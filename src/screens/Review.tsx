import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp, dueQueue, canReadEnglish } from '../core/store'
import { ITEMS, PATTERNS, SCRIPT_CHARS, getAnyItem, letterSound } from '../data'
import type { LexItem, QuizKind, SrsStage } from '../core/types'
import { SRS_STAGE_NAMES } from '../core/types'
import { stageColor, isDue } from '../core/srs'
import { makeRound, type Round } from '../core/generate'
import { speakEnglish, sfx } from '../core/audio'
import { celebrate } from '../three/celebrate'
import Speak from '../components/Speak'
import '../styles/session.css'

interface Question {
  id: string
  kind: QuizKind
  choices?: string[]      // item ids for MC (graphemes, for phonics questions)
  answerIdx?: number
  round?: Round           // for 'assemble' (pattern production)
  /** Same-session retry of a miss — must not advance the SRS schedule. */
  requeue?: boolean
  /** Reads from / writes to the phonics deck rather than the vocabulary deck. */
  script?: boolean
  /** SRS stage snapshotted at question creation — rendered from here so the
   *  header pill / reading scaffold never rewrite themselves mid-feedback. */
  stage: SrsStage
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Which question kinds a vocabulary item is eligible for at a given stage.
 *
 * The ladder ramps from recognition to production. Multiple choice puts a 25%
 * floor under every answer, which is fine early — the job then is exposure,
 * and a lucky guess costs one four-hour interval. It stops being fine at the
 * top: ทอง claims the learner will still have the word in a month and ยืนต้น
 * in four, and an interval that long should be earned by PRODUCING the word,
 * not by recognising it among three strangers. So from stage 7 the only kind
 * offered is typing it.
 *
 * Stages 4–6 mix typing in at half weight (it appears twice in a four-entry
 * table) rather than switching over at a line, so the first typed card arrives
 * well before it is the only option.
 *
 * Typing is in the TARGET language here — the learner types the English for
 * a Thai meaning. That is the opposite of ChaiThai, where typing Thai needed a
 * Thai keyboard; a Thai learner of English has the Latin keyboard already,
 * and spelling the word is itself part of what is being learned. Patterns
 * never reach this table — `makeQuestion` routes them to `assemble` first,
 * which is already production.
 */
export function kindsForStage(stage: SrsStage): QuizKind[] {
  return stage <= 1 ? ['meaning-mc', 'listen-mc']
    : stage <= 3 ? ['meaning-mc', 'reading-mc', 'listen-mc']
    : stage <= 6 ? ['reading-mc', 'listen-mc', 'type-en', 'type-en']
    : ['type-en']
}

function makeQuestion(
  id: string, stage: SrsStage, met: Set<string>, requeue = false,
): Question {
  const pattern = PATTERNS[id]
  if (pattern) {
    // Patterns are tested in PRODUCTION: build the English for a meaning.
    return { id, kind: 'assemble', round: makeRound([pattern]), requeue, stage }
  }
  const item = ITEMS[id]!
  // Distractors: same-kind vocab only — never leak raw pattern templates.
  // They must also be unambiguously WRONG: an item sharing the target's
  // English form or Thai gloss (homographs, near-synonyms across levels) would
  // make the question have two correct answers, so collisions are filtered
  // out — against the target and against each other.
  const glosses = (o: LexItem): string[] =>
    [o.th, ...(o.altTh ?? [])].flatMap(g => g.split('/')).map(g => g.trim().toLowerCase())
  const targetGlosses = new Set(glosses(item))
  const usedEn = new Set([item.en.toLowerCase()])
  const usedGlosses = new Set(targetGlosses)
  const pool: string[] = []
  // Prefer distractors the learner has actually MET, then words from levels
  // they've reached, and only then the wider corpus. Drawing from the whole
  // corpus made an early-level question answerable by recognition alone —
  // with ~15 items learned, all three distractors were almost always words
  // never seen before, so "which is the English for X" reduced to "pick the
  // one that looks familiar". That tests exposure, not recall.
  const all = Object.values(ITEMS)
  const usable = (o: LexItem): boolean =>
    o.id !== id && (o.type === 'vocab' || o.type === 'phrase')
  const candidates = [
    ...shuffle(all.filter(o => usable(o) && met.has(o.id))),
    ...shuffle(all.filter(o => usable(o) && !met.has(o.id) && o.level <= item.level)),
    ...shuffle(all.filter(o => usable(o) && !met.has(o.id) && o.level > item.level)),
  ]
  for (const o of candidates) {
    if (pool.length === 3) break
    if (usedEn.has(o.en.toLowerCase())) continue
    const g = glosses(o)
    if (g.some(x => usedGlosses.has(x))) continue
    pool.push(o.id)
    usedEn.add(o.en.toLowerCase())
    g.forEach(x => usedGlosses.add(x))
  }
  const kinds = kindsForStage(stage)
  const kind = kinds[Math.floor(Math.random() * kinds.length)]
  const choices = shuffle([id, ...pool])
  return { id, kind, choices, answerIdx: choices.indexOf(id), requeue, stage }
}

/**
 * A grapheme, reviewed on the same SRS ladder as vocabulary. Recognition
 * (spelling → sound) comes first; once it is holding, recall (sound →
 * spelling) is mixed in, because reading and spelling need the mapping both
 * ways.
 *
 * Distractors are drawn from graphemes the learner has already met before
 * falling back to the whole course, so a miss means "I mixed up two sounds I
 * know" — a real signal — rather than "I guessed among strangers".
 */
function makeScriptQuestion(
  char: string, stage: SrsStage, met: string[], requeue = false,
): Question {
  const target = SCRIPT_CHARS[char]!
  const usedReading = new Set([target.reading])
  const pool: string[] = []
  for (const c of [...shuffle(met), ...shuffle(Object.keys(SCRIPT_CHARS))]) {
    if (pool.length === 3) break
    const o = SCRIPT_CHARS[c]
    // Same sound = two right answers (c/k, ee/ea); duplicates across the
    // fallback pass would do the same, so dedupe on grapheme too.
    if (!o || o.char === char || usedReading.has(o.reading) || pool.includes(o.char)) continue
    pool.push(o.char)
    usedReading.add(o.reading)
  }
  const kind: QuizKind = stage <= 1 || Math.random() < 0.5 ? 'char-sound' : 'char-glyph'
  const choices = shuffle([char, ...pool])
  return { id: char, kind, choices, answerIdx: choices.indexOf(char), requeue, stage, script: true }
}

// ─── Typed English ───────────────────────────────────────────────────────────

/** Both sides are expanded before comparing, so "I'm" and "I am" are one answer. */
const CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, 'i am'], [/\byou're\b/g, 'you are'], [/\bwe're\b/g, 'we are'], [/\bthey're\b/g, 'they are'],
  [/\bhe's\b/g, 'he is'], [/\bshe's\b/g, 'she is'], [/\bit's\b/g, 'it is'], [/\bthat's\b/g, 'that is'],
  [/\bwhat's\b/g, 'what is'], [/\bwhere's\b/g, 'where is'], [/\bhow's\b/g, 'how is'], [/\bwho's\b/g, 'who is'],
  [/\bthere's\b/g, 'there is'], [/\bhere's\b/g, 'here is'], [/\blet's\b/g, 'let us'],
  [/\bcan't\b/g, 'can not'], [/\bcannot\b/g, 'can not'], [/\bwon't\b/g, 'will not'], [/\bshan't\b/g, 'shall not'],
  [/n't\b/g, ' not'],
  [/\b(i|you|we|he|she|it|they)'ll\b/g, '$1 will'],
  [/\b(i|you|we|they)'ve\b/g, '$1 have'],
  [/\b(i|you|we|he|she|it|they)'d\b/g, '$1 would'],
  [/\bgonna\b/g, 'going to'], [/\bwanna\b/g, 'want to'], [/\bgotta\b/g, 'got to'],
  [/\bokay\b/g, 'ok'],
]
const NEGATION = new Set(['not', 'no', 'never', 'nothing', 'nobody', 'none'])

/** Lower-case, ASCII apostrophes, contractions expanded, punctuation gone. */
function normalizeEnglish(s: string): string[] {
  let t = s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9'\s]/g, ' ')
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep)
  const words = t.replace(/'/g, '').split(/\s+/).filter(Boolean)
  // A leading article or infinitive marker is not what the card is testing:
  // "a coffee" for coffee and "to go" for go are the learner knowing the word.
  // Only at the START — "I want a coffee" must still match "I want a coffee".
  while (words.length > 1 && (words[0] === 'a' || words[0] === 'an' || words[0] === 'the' || words[0] === 'to')) words.shift()
  return words
}

/** Damerau–Levenshtein with transpositions, capped at 2 for speed. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > 2) return 3
  const d: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) d[i][0] = i
  for (let j = 0; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

/**
 * Does a typed English answer match one of the accepted forms?
 *
 * Word-by-word, in order — this is production, so word order is part of the
 * answer. Each word must be exact, or one slip away when it is long enough
 * that a slip is clearly a typo rather than a different word (≥ 6 letters,
 * edit distance 1: "recieve" passes, "ship" for "sheep" does not). A
 * negation on one side and not the other is never a match, whatever the
 * distance says — "not sure" must not pass for "sure". Guarded by
 * scripts/verify-srs.mjs.
 */
export function typedMatches(typed: string, answers: string[]): boolean {
  const t = normalizeEnglish(typed)
  if (t.length === 0) return false
  const tNeg = t.some(w => NEGATION.has(w))
  return answers.some(a => {
    for (const part of a.split(' / ')) {
      const at = normalizeEnglish(part)
      if (at.length === 0 || at.length !== t.length) continue
      if (at.some(w => NEGATION.has(w)) !== tNeg) continue
      const ok = at.every((w, i) => {
        const u = t[i]
        if (w === u) return true
        if (NEGATION.has(w) || NEGATION.has(u)) return false
        return w.length >= 6 && u.length >= 5 && editDistance(w, u) <= 1
      })
      if (ok) return true
    }
    return false
  })
}

/** Big filled speaker glyph for the audio-hero tile (dark ink on brand orange). */
function HeroSpeakerIcon({ size }: { size: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9.5v5c0 .6.4 1 1 1h2.6l4 3.2c.7.5 1.6 0 1.6-.8V6.1c0-.8-.9-1.3-1.6-.8l-4 3.2H5c-.6 0-1 .4-1 1Z"
        fill="#2b1400"
      />
      <path d="M16 9.2a4.2 4.2 0 0 1 0 5.6" stroke="#2b1400" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.4 7.2a7.4 7.4 0 0 1 0 9.6" stroke="#2b1400" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

/** Listen-prompt hero: chunky primary speaker + smaller turtle (slow) beside it. */
function AudioHero({ text }: { text: string }): JSX.Element {
  const [speaking, setSpeaking] = useState<'normal' | 'slow' | null>(null)
  const play = (slow: boolean) => {
    speakEnglish(text, slow ? 0.65 : 0.92)
    setSpeaking(slow ? 'slow' : 'normal')
    window.setTimeout(() => setSpeaking(null), 1400)
  }
  return (
    <div className="audio-hero">
      <button
        className={`speak-hero ${speaking === 'normal' ? 'speaking' : ''}`}
        aria-label="ฟังเสียงภาษาอังกฤษ"
        onClick={() => play(false)}
      >
        <HeroSpeakerIcon size={46} />
      </button>
      <div className="speak-slow-wrap">
        <button
          className={`speak-hero slow ${speaking === 'slow' ? 'speaking' : ''}`}
          aria-label="ฟังเสียงภาษาอังกฤษ (ช้า)"
          onClick={() => play(true)}
        >
          🐢
        </button>
        <span className="slow-lbl">ช้า</span>
      </div>
    </div>
  )
}

const KIND_HINT: Record<string, string> = {
  'meaning-mc': 'คำนี้แปลว่าอะไร?',
  'reading-mc': 'ข้อไหนคือภาษาอังกฤษของ…',
  'listen-mc': 'ได้ยินว่าอะไร?',
  'type-en': 'พิมพ์เป็นภาษาอังกฤษ',
  'assemble': 'เรียงเป็นภาษาอังกฤษ…',
  'char-sound': 'ตัวนี้ออกเสียงยังไง?',
  'char-glyph': 'ตัวไหนออกเสียงแบบนี้?',
}

/** Thai label for an item's category chip. */
function kindLabel(item: LexItem): string {
  if (item.pos) return item.pos
  return item.type === 'pattern' ? 'แพตเทิร์น' : item.type === 'phrase' ? 'วลี' : 'คำศัพท์'
}

/** The reading scaffold line: Thai reading, then IPA as a footnote. */
function ReadLine({ item }: { item: LexItem }): JSX.Element {
  return (
    <div className="read-line">
      {item.reading}
      {item.ipa && <span className="ipa">{item.ipa}</span>}
    </div>
  )
}

export default function Review(): JSX.Element {
  const st = useApp()
  // Graphemes already met — the distractor pool for phonics questions.
  const met = useMemo(
    () => Object.keys(st.scriptProgress).filter(c => SCRIPT_CHARS[c]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  // Words already met — the distractor pool for vocabulary questions.
  const metWords = useMemo(
    () => new Set(Object.keys(st.progress).filter(id => ITEMS[id])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const initial = useMemo(() => {
    // Selection is scheduling policy, so it lives in the store (dueQueue):
    // one pool across all three decks, most overdue first, cut to the session
    // size. Shuffle only what survives the cut, so ORDER varies but WHICH
    // items are served stays strictly by urgency.
    return shuffle(dueQueue(st)).map(({ id, script }) =>
      script
        ? makeScriptQuestion(id, st.scriptProgress[id]?.stage ?? 0, met)
        : makeQuestion(id, st.progress[id]?.stage ?? 0, metWords))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [queue, setQueue] = useState<Question[]>(initial)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [placed, setPlaced] = useState<number[]>([])
  const [result, setResult] = useState<'good' | 'bad' | null>(null)
  const [stats, setStats] = useState({ right: 0, wrong: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const q = queue[i]
  const item = q && !q.script ? getAnyItem(q.id) : undefined
  const sc = q?.script ? SCRIPT_CHARS[q.id] : undefined
  const showReading = st.settings.showReading

  const spokenForm = (it: LexItem): string => it.audioHint ?? it.en.replace(/_/g, '')

  useEffect(() => {
    if (q?.kind === 'listen-mc' && item) speakEnglish(spokenForm(item))
    // Sound → spelling: the sound is the prompt, so it should be audible too —
    // the example word that carries it.
    if (q?.kind === 'char-glyph' && sc) speakEnglish(letterSound(sc))
    if (q?.kind === 'type-en') inputRef.current?.focus()
  }, [i, q?.id])

  if (queue.length === 0) {
    return (
      <div className="card card-pad col" style={{ alignItems: 'center', gap: 16, padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🌤️</div>
        <div className="h1">ทบทวนครบแล้ว!</div>
        <div className="muted" style={{ fontWeight: 700, maxWidth: 420 }}>
          ตอนนี้ยังไม่มีอะไรถึงเวลาทบทวน ช่วงที่เว้นไปคือตอนที่สมองกำลังจำ —
          กลับมาใหม่เมื่อชุดถัดไปสุกงอม
        </div>
        <button className="btn big" onClick={() => st.go('home')}>กลับหน้าหลัก</button>
      </div>
    )
  }

  if (i >= queue.length) {
    const pct = Math.round((stats.right / (stats.right + stats.wrong || 1)) * 100)
    return (
      <div className="card card-pad col" style={{ alignItems: 'center', gap: 18, padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 72 }}>{pct >= 80 ? '🏆' : '💪'}</div>
        <div className="h1">จบรอบแล้ว!</div>
        <div className="row" style={{ gap: 24 }}>
          <div className="col" style={{ alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--green)' }}>{stats.right}</div>
            <div className="muted small" style={{ fontWeight: 800 }}>ถูก</div>
          </div>
          <div className="col" style={{ alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--red)' }}>{stats.wrong}</div>
            <div className="muted small" style={{ fontWeight: 800 }}>ปลูกใหม่</div>
          </div>
          <div className="col" style={{ alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--gold)' }}>{pct}%</div>
            <div className="muted small" style={{ fontWeight: 800 }}>ความแม่น</div>
          </div>
        </div>
        <button className="btn big" onClick={() => st.go('home')}>กลับหน้าหลัก</button>
      </div>
    )
  }

  const answer = (correct: boolean) => {
    if (result) return
    setResult(correct ? 'good' : 'bad')
    // Requeued questions record the outcome but never move the schedule.
    if (q.script) st.answerScript(q.id, correct, !q.requeue)
    else st.answer(q.id, correct, !q.requeue)
    st.addXp(correct ? 12 : 4)
    if (st.settings.sound) correct ? sfx.correct() : sfx.wrong()
    setStats(s => ({ right: s.right + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }))
    if (!correct) {
      setQueue(qq => [...qq, q.script
        ? makeScriptQuestion(q.id, 0, met, true)
        : makeQuestion(q.id, 0, metWords, true)])
    } else if (sc) {
      speakEnglish(letterSound(sc))
    } else if (item && q.kind !== 'assemble') {
      speakEnglish(spokenForm(item))
    } else if (q.round) {
      speakEnglish(q.round.tokens.map(t => t.en).join(' '))
    }
  }

  const next = () => {
    setResult(null); setPicked(null); setTyped(''); setPlaced([])
    if (i + 1 >= queue.length && st.settings.sound) { sfx.fanfare(); celebrate.burst() }
    setI(i + 1)
  }

  const checkTyped = () => {
    if (!item) return
    answer(typedMatches(typed, [item.en, ...(item.altEn ?? [])]))
  }

  const answerTiles = q.round ? placed.map(k => q.round!.tray.find(t => t.key === k)!) : []
  const checkAssembled = () => {
    if (!q.round) return
    const ok =
      answerTiles.length === q.round.tokens.length &&
      answerTiles.every((t, ti) => t.en === q.round!.tokens[ti].en)
    answer(ok)
  }

  // Render from the creation-time snapshot: live progress moves the moment an
  // answer is recorded, and the question must not rewrite itself mid-feedback.
  const stage = q.stage
  // The Thai reading is a SCAFFOLD, not a permanent label: it rides along
  // while an item is still young and is withdrawn once it's holding, so the
  // reading never becomes the thing being remembered. One rule, applied to
  // every question type that shows English.
  // Every English word this question puts on screen. For reading-mc that's
  // all four choices, not just the answer — the learner has to read all of
  // them to choose between them.
  const enOnScreen = q.kind === 'reading-mc'
    ? (q.choices ?? []).map(cid => getAnyItem(cid)?.en ?? '')
    : item ? [item.en] : []
  const canRead = enOnScreen.every(t => canReadEnglish(t, st.scriptProgress))
  // The reading is withdrawn only once BOTH are true: the item is mature
  // (recall shouldn't lean on the reading), AND the learner can actually
  // decode the spelling in front of them. Maturity alone is the wrong axis —
  // it would withdraw the reading from learners who have not met a single
  // sound yet, turning "which is the English for X" into shape-matching.
  const readingScaffold = showReading && (stage <= 2 || !canRead)
  // Stable countdown: unique unanswered ids left. A missed item's requeue is
  // the same id, so it never pushes the number back up.
  const toGo = new Set(queue.slice(i).map(qq => qq.id)).size

  // Category cue: pos-tag only — text reads cleanly where a 15px emoji can't.
  const cue = sc ? (
    <div className="cue-chip"><span>ตัวอักษร · {sc.meta}</span></div>
  ) : item && (
    <div className="cue-chip"><span>{kindLabel(item)}</span></div>
  )

  const prompt = () => {
    if (sc) {
      return q.kind === 'char-sound' ? (
        <>
          <div className="quiz-prompt en" style={{ fontSize: 'clamp(64px,11vw,104px)', lineHeight: 1 }}>{sc.char}</div>
          <div className="row" style={{ justifyContent: 'center' }}><Speak text={letterSound(sc)} /></div>
        </>
      ) : (
        <>
          <div className="quiz-prompt" style={{ fontSize: 'clamp(32px,5vw,52px)' }}>“{sc.reading}”</div>
          <div className="muted small" style={{ textAlign: 'center', fontWeight: 800 }}>เช่นในคำว่า <span className="en">{sc.word}</span> — {sc.wordTh}</div>
          <div className="row" style={{ justifyContent: 'center' }}><Speak text={sc.word} /></div>
        </>
      )
    }
    if (!item) return null
    switch (q.kind) {
      case 'meaning-mc':
        return (
          <>
            <div className="quiz-prompt en">{item.en}</div>
            {readingScaffold && <ReadLine item={item} />}
            <div className="row" style={{ justifyContent: 'center' }}><Speak text={spokenForm(item)} /></div>
          </>
        )
      case 'reading-mc':
        return <div className="quiz-prompt" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>“{item.th}”</div>
      case 'listen-mc':
        return <AudioHero text={spokenForm(item)} />
      case 'type-en':
        // Production: the Thai meaning is the prompt and the English is the
        // answer, so no reading is shown — it would spell the answer out.
        return <div className="quiz-prompt" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>“{item.th}”</div>
      case 'assemble':
        return <div className="quiz-prompt" style={{ fontSize: 'clamp(24px,3.5vw,36px)' }}>“{q.round!.th}”</div>
      default:
        return null
    }
  }

  const renderChoiceLabel = (cid: string) => {
    if (q.script) {
      const c = SCRIPT_CHARS[cid]
      if (!c) return cid
      return q.kind === 'char-glyph'
        ? <span className="en" style={{ fontSize: 30 }}>{c.char}</span>
        : <>{c.reading}</>
    }
    const c = getAnyItem(cid)
    if (!c) return cid
    if (q.kind === 'reading-mc') {
      return (
        <>
          <span className="en" style={{ fontSize: 21 }}>{c.en}</span>
          {readingScaffold && <span className="muted small" style={{ fontWeight: 700 }}>{c.reading}</span>}
        </>
      )
    }
    return c.th
  }

  // Short single-word choices read better 2-up — but a choice carrying both an
  // English form and its reading is twice as wide, so measure what's rendered.
  const choiceLabels = q.choices?.map(cid => {
    if (q.script) {
      const c = SCRIPT_CHARS[cid]
      return (q.kind === 'char-glyph' ? c?.char : c?.reading) ?? cid
    }
    const c = getAnyItem(cid)
    if (q.kind !== 'reading-mc') return c?.th ?? cid
    return (c?.en ?? cid) + (readingScaffold ? ` ${c?.reading ?? ''}` : '')
  })
  const twoCol = !!choiceLabels && choiceLabels.every(l => l.length < 16)

  const isMc = q.kind === 'meaning-mc' || q.kind === 'reading-mc' || q.kind === 'listen-mc'
    || q.kind === 'char-sound' || q.kind === 'char-glyph'

  return (
    <div className="focus-col">
      <div className="spread">
        <button className="btn ghost small" onClick={() => st.go('home')}>✕ จบรอบ</button>
        <div className="row" style={{ gap: 14 }}>
          <span className="muted" style={{ fontWeight: 800 }}>เหลือ {toGo} ข้อ</span>
          {(item || sc) && (
            <span
              className="stage-pill"
              style={{ '--stage': stageColor(stage) } as React.CSSProperties}
            >
              {SRS_STAGE_NAMES[stage]}
            </span>
          )}
        </div>
      </div>
      <div className="pbar"><i style={{ width: `${(i / queue.length) * 100}%` }} /></div>

      <div className={`card session-card ${result ? 'graded' : ''}`}>
        <div className="quiz-main">
          <div className="prompt-zone">
            {cue}
            <div className="muted" style={{ fontWeight: 800, textAlign: 'center' }}>{KIND_HINT[q.kind]}</div>
            {prompt()}
          </div>

          {q.kind === 'type-en' && (
            <div className="answer-zone quiz-narrow" style={{ maxWidth: 480 }}>
              <input
                ref={inputRef}
                className={`type-input ${result === 'good' ? 'good' : result === 'bad' ? 'bad' : ''}`}
                value={typed}
                disabled={result != null}
                lang="en"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={e => setTyped(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && typed.trim()) checkTyped() }}
                placeholder="พิมพ์ภาษาอังกฤษ…"
              />
            </div>
          )}

          {q.kind === 'assemble' && q.round && (
            <div className="answer-zone quiz-narrow" style={{ gap: 14 }}>
              <div className={`answer-strip ${result === 'good' ? 'strip-good' : result === 'bad' ? 'strip-bad' : placed.length > 0 ? 'glow' : 'empty'}`}>
                {answerTiles.length === 0 && (
                  <span className="faint" style={{ fontWeight: 700, padding: '0 6px' }}>แตะคำด้านล่างเพื่อเรียงประโยค…</span>
                )}
                {answerTiles.map(t => (
                  <button key={t.key} className="tile in-answer en" disabled={result != null}
                    onClick={() => { setPlaced(p => p.filter(k => k !== t.key)); if (st.settings.sound) sfx.tap() }}>
                    {t.en}
                    {showReading && t.reading && <span className="tile-sub">{t.reading}</span>}
                  </button>
                ))}
              </div>
              <div className={`tile-tray ${result != null ? 'frozen' : ''}`}>
                {q.round.tray.map(t => (
                  <button key={t.key} className={`tile en ${placed.includes(t.key) ? 'used' : ''}`} disabled={result != null}
                    onClick={() => { setPlaced(p => [...p, t.key]); if (st.settings.sound) sfx.tap(); speakEnglish(t.en, 0.95) }}>
                    {t.en}
                    {showReading && t.reading && <span className="tile-sub">{t.reading}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isMc && (
            <div className={`answer-zone quiz-narrow choices ${twoCol ? 'choice-grid' : ''}`} style={{ maxWidth: 560 }}>
              {q.choices!.map((cid, ci) => (
                <button
                  key={cid}
                  className={`choice ${result && ci === q.answerIdx ? 'correct' : ''} ${result && picked === ci && ci !== q.answerIdx ? 'wrong' : ''} ${result && picked !== ci && ci !== q.answerIdx ? 'dim' : ''}`}
                  disabled={result != null}
                  onClick={() => { setPicked(ci); answer(ci === q.answerIdx) }}
                >
                  <span className="key">{ci + 1}</span>
                  {renderChoiceLabel(cid)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="session-footer feedback-sticky">
          {!result && q.kind === 'type-en' && (
            <div className="check-row">
              <button className="btn green" disabled={!typed.trim()} onClick={checkTyped}>ตรวจ</button>
            </div>
          )}
          {!result && q.kind === 'assemble' && (
            <div className="check-row">
              <button className="btn green" disabled={answerTiles.length === 0} onClick={checkAssembled}>ตรวจ</button>
            </div>
          )}
          {result && (item || sc) && (
            <div className={`feedback ${result}`}>
              <span style={{ fontSize: 30 }}>{result === 'good' ? '✅' : '🌧️'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 17 }}>
                  {result === 'good' ? 'ถูกต้อง! Correct!' : 'ยังไม่ใช่ — เดี๋ยวได้เจออีกครั้งในรอบนี้'}
                </div>
                <div className="muted" style={{ fontWeight: 700 }}>
                  {sc ? (
                    <>
                      <span className="en" style={{ fontSize: 22 }}>{sc.char}</span>
                      <span style={{ margin: '0 8px', color: 'var(--gold)' }}>{sc.reading}</span>
                      — เช่น <span className="en">{sc.word}</span> ({sc.wordTh}) · {sc.meta}
                    </>
                  ) : q.kind === 'assemble' && q.round ? (
                    <>
                      <span className="en" style={{ fontSize: 18 }}>{q.round.tokens.map(t => t.en).join(' ')}</span>
                      <span style={{ marginLeft: 8 }}>= {q.round.th}</span>
                    </>
                  ) : item ? (
                    <>
                      <span className="en" style={{ fontSize: 18 }}>{item.en}</span>
                      {showReading && <span style={{ margin: '0 8px', color: 'var(--gold)' }}>{item.reading}</span>}
                      = {item.th}
                    </>
                  ) : null}
                </div>
              </div>
              <button className="btn" onClick={next}>ไปต่อ →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
