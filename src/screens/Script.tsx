import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp, dueScriptIds, gatedCharCount, SCRIPT_GATE_STAGE } from '../core/store'
import { SCRIPT_LESSONS, SCRIPT_CHARS } from '../data'
import { GROUP_STORY, letterSound } from '../data/script'
import { segmentGraphemes, isTaughtGrapheme } from '../core/phonics'
import type { ScriptChar, ScriptLesson } from '../core/types'
import { SRS_STAGE_NAMES } from '../core/types'
import { isDue, stageColor } from '../core/srs'
import { speakEnglish, sfx } from '../core/audio'
import Speak from '../components/Speak'
import '../styles/browse.css'
import '../styles/sounds.css'

// Read English — the phonics course. Short vowels, consonants, the sounds Thai
// lacks, letter teams and magic e, introduced progressively; drills only ever
// use graphemes already taught. The list is a numbered course path; each
// lesson opens into a grapheme grid + sound-it-out drills (or an inline
// self-quiz when a lesson has no drills yet).

/** Graphemes that count toward a lesson's progress. A practice lesson has no
 *  chars of its own — it exercises everything taught before it. */
function charsFor(lesson: ScriptLesson): string[] {
  if (lesson.chars.length > 0) return lesson.chars.map(c => c.char)
  const i = SCRIPT_LESSONS.findIndex(l => l.id === lesson.id)
  return SCRIPT_LESSONS.slice(0, i).flatMap(l => l.chars.map(c => c.char))
}

/** The face of a lesson chip: its own first grapheme, or a book for practice. */
function chipGlyph(l: ScriptLesson): string {
  if (l.kind === 'practice') return '📖'
  return l.chars[0]?.char ?? 'a'
}

/** Learner-facing name of each lesson kind. */
const KIND_LABEL: Record<ScriptLesson['kind'], string> = {
  vowels: 'สระ',
  consonants: 'พยัญชนะ',
  sounds: 'เสียงใหม่',
  practice: 'ฝึกอ่าน',
}

/** Tiny corner speaker so letter cards read as tappable-audio. */
function MiniSpeaker(): JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9.5v5c0 .6.4 1 1 1h2.6l4 3.2c.7.5 1.6 0 1.6-.8V6.1c0-.8-.9-1.3-1.6-.8l-4 3.2H5c-.6 0-1 .4-1 1Z"
        fill="var(--gold)"
      />
      <path d="M16 9.2a4.2 4.2 0 0 1 0 5.6" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Inline grapheme self-quiz for lessons without read-aloud drills: shows
 *  each grapheme once, four sound choices, small tally at the end. */
function LetterQuiz({ chars }: { chars: ScriptChar[] }): JSX.Element {
  const st = useApp()
  const [seed, setSeed] = useState(0)
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [hits, setHits] = useState(0)

  const rounds = useMemo(
    () =>
      shuffle(chars).map(c => {
        // Choices are READINGS, and two graphemes can share one (c and k are
        // both ค). Distractors are deduplicated against the answer and each
        // other so a question never carries two correct buttons.
        const others = [...new Set(chars.filter(o => o.char !== c.char).map(o => o.reading))]
          .filter(r => r !== c.reading)
        return { c, choices: shuffle([c.reading, ...shuffle(others).slice(0, 3)]) }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chars, seed],
  )

  const done = idx >= rounds.length

  if (done) {
    return (
      <div className="quiz-done">
        <span className="big" aria-hidden>{hits === rounds.length ? '🎉' : '🌱'}</span>
        <div className="h2">{hits} / {rounds.length} ถูกตั้งแต่ครั้งแรก</div>
        <div className="note">
          {hits === rounds.length
            ? 'ทุกตัว แตะเดียวถูก — ชุดนี้เป็นของคุณแล้ว'
            : 'ผ่านได้ดี แตะตัวอักษรด้านบนเพื่อฟังอีกครั้ง แล้วลองอีกรอบ'}
        </div>
        <button
          className="btn ghost small"
          onClick={() => { setSeed(s => s + 1); setIdx(0); setHits(0); setPicked(null) }}
        >
          ↻ ฝึกอีกรอบ
        </button>
      </div>
    )
  }

  const round = rounds[idx]
  const pick = (reading: string): void => {
    if (picked !== null) return
    setPicked(reading)
    const correct = reading === round.c.reading
    // This drill feeds the same SRS deck as Reviews — but it only ADVANCES the
    // schedule for a grapheme that is actually due (or brand new). Otherwise
    // "Practice again" three times in a row would rocket it to Golden without
    // a single night of forgetting in between.
    const p = st.scriptProgress[round.c.char]
    st.answerScript(round.c.char, correct, !p || isDue(p))
    if (correct) {
      setHits(h => h + 1)
      if (st.settings.sound) sfx.tap()
    }
    // The question was "how does this sound?" — answer it with the sound.
    speakEnglish(letterSound(round.c))
    // Correct dwell is long enough for the green confirmation to land.
    window.setTimeout(() => { setIdx(i => i + 1); setPicked(null) }, correct ? 1150 : 1400)
  }

  return (
    <>
      <div className="quiz-steps">
        {rounds.map((r, i) => (
          <span key={r.c.char} className={`qdot ${i < idx ? 'hit' : i === idx ? 'now' : ''}`} />
        ))}
      </div>
      <div className="quiz-glyph en">{round.c.char}</div>
      <div className="quiz-q">ตัวนี้ออกเสียงยังไง?</div>
      <div className="col" style={{ gap: 10 }}>
        {round.choices.map((r, i) => {
          const cls =
            picked === null ? '' :
            r === round.c.reading ? 'correct' :
            r === picked ? 'wrong' : 'dim'
          return (
            <button key={r} className={`choice ${cls}`} disabled={picked !== null} onClick={() => pick(r)}>
              <span className="key">{'ABCD'[i]}</span>
              {r}
            </button>
          )
        })}
      </div>
    </>
  )
}

/**
 * `**bold**` inside a mnemonic, rendered.
 *
 * The sound hooks lean on emphasis — "ลิ้นแตะ**ฟัน** ไม่ใช่เหงือก" only lands
 * if the key word is picked out. A full markdown dependency for one inline
 * rule would be absurd; this is the one rule.
 */
function Emphasised({ text }: { text: string }): JSX.Element {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <b key={i} className="mnem-em">{part.slice(2, -2)}</b>
          : <span key={i}>{part}</span>,
      )}
    </>
  )
}

/**
 * The mnemonic panel: how to MAKE the sound with a Thai mouth, how to
 * REMEMBER which sound this spelling makes, and which sound group it sits in.
 *
 * The stories are the point of the screen, so the panel is always open on
 * the first grapheme of a lesson and tapping any card swaps it.
 */
function Mnemonic({ c }: { c: ScriptChar }): JSX.Element {
  const story = GROUP_STORY[c.meta]
  return (
    <div className="card card-pad mnem-card" data-testid="mnemonic">
      <div className="mnem-top">
        <div className="mnem-stage">
          {/* The picture sits BEHIND the grapheme, so the two are seen as one
              thing rather than a glyph with a sticker next to it. */}
          <span className="mnem-emoji" role="img" aria-label={c.wordTh}>{c.emoji}</span>
          <span className="mnem-glyph en" data-len={Math.min(c.char.length, 3)}>{c.char}</span>
        </div>
        <div className="mnem-id">
          <div className="mnem-name">{c.name}</div>
          <div className="mnem-reading">
            {c.reading} <span className="mnem-ipa en">/{c.ipa}/</span>
          </div>
          <div className="mnem-meta">
            <span className="en">{c.word}</span> — {c.wordTh} · {c.meta}
          </div>
          <Speak text={letterSound(c)} size={34} />
        </div>
      </div>

      <div className="mnem-row">
        <span className="mnem-key">ออกเสียงยังไง</span>
        <p className="mnem-text"><Emphasised text={c.mnemonic} /></p>
      </div>
      <div className="mnem-row">
        <span className="mnem-key">จำยังไง</span>
        <p className="mnem-text"><Emphasised text={c.sound} /></p>
      </div>
      {story && (
        <div className="mnem-row">
          <span className="mnem-key">กลุ่มเสียง</span>
          <p className="mnem-text">
            <b className="mnem-em">{story.emoji} {story.title}</b>{' '}
            <Emphasised text={story.body} />
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * A drill word cut into the graphemes the course teaches, each with its
 * reading underneath. The drills otherwise let a learner pattern-match whole
 * words without ever applying the sound-spelling rules — the app would teach
 * the system and then only test its outputs. Same cut as `canReadEnglish`
 * in the store, so the strip and the gate can never disagree.
 */
function SoundItOut({ en }: { en: string }): JSX.Element {
  // One group per word: a phrase like "thank you" keeps its word boundary
  // visible, and punctuation / digits carry no sound to show.
  const words = en.toLowerCase().split(/[^a-z]+/).filter(Boolean)
  return (
    <span className="sound-chips" aria-label="สะกดทีละเสียง">
      {words.map((w, wi) => (
        <span key={`${w}-${wi}`} className="sound-word">
          {segmentGraphemes(w).map((u, i) => {
            const sc = SCRIPT_CHARS[u]
            return (
              <span key={`${u}-${i}`} className={`sound-chip ${isTaughtGrapheme(u) ? '' : 'untaught'}`}>
                <span className="u en">{u}</span>
                {sc && <span className="r">{sc.reading}</span>}
              </span>
            )
          })}
        </span>
      ))}
    </span>
  )
}

/** A single opened lesson: intro callout, grapheme grid, drills or self-quiz. */
function LessonView({ lesson, onBack }: { lesson: ScriptLesson; onBack: () => void }): JSX.Element {
  const st = useApp()
  const [quizOn, setQuizOn] = useState(false)
  const quizRef = useRef<HTMLDivElement>(null)
  // Opening a lesson shows the first grapheme's panel rather than an empty
  // slot: the panel is the point of the screen, so it should never need
  // discovering. Tapping any card swaps it.
  const [open, setOpen] = useState<string | null>(() => lesson.chars[0]?.char ?? null)
  const shown = lesson.chars.find(c => c.char === open)

  // The quiz card mounts below the grapheme grid — bring it into view.
  useEffect(() => {
    if (quizOn) quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [quizOn])

  return (
    <div className="col page-narrow" style={{ gap: 18 }}>
      <div className="lesson-head">
        <button className="btn ghost small" onClick={onBack}>← บทเรียนทั้งหมด</button>
        <div className="browse-head">
          <div className="h1">{lesson.title}</div>
          <div className="browse-sub">{lesson.subtitle}</div>
        </div>
      </div>

      <div className="callout">
        <span className="ico" aria-hidden>💡</span>
        <span>{lesson.intro}</span>
      </div>

      {lesson.chars.length > 0 && (
        <div className="char-grid">
          {lesson.chars.map(c => {
            // Tapping a card is a first meeting, not a graded answer: it plants
            // the grapheme in the SRS deck at Seedling and schedules its first
            // review. Grading happens in the drill and in Reviews.
            const p = st.scriptProgress[c.char]
            return (
              <button
                key={c.char}
                className={`card char-card ${open === c.char ? 'open' : ''}`}
                aria-pressed={open === c.char}
                onClick={() => {
                  // The card promises a sound (its reading line); play THAT,
                  // not the example word.
                  speakEnglish(letterSound(c))
                  if (st.settings.sound) sfx.tap()
                  st.learnScriptChar(c.char)
                  setOpen(c.char)
                }}
              >
                {p && (
                  <span
                    className="seen-dot"
                    style={{ '--stage': stageColor(p.stage) } as React.CSSProperties}
                    aria-label={`ขั้น: ${SRS_STAGE_NAMES[p.stage]}`}
                    title={SRS_STAGE_NAMES[p.stage]}
                  >
                    {p.stage >= SCRIPT_GATE_STAGE ? '✓' : p.stage + 1}
                  </span>
                )}
                <span className="glyph en">{c.char}</span>
                <span className="reading">{c.reading}</span>
                <span className="cname">{c.name}</span>
                <span className="cmeta">
                  <span className="en">{c.word}</span> · {c.wordTh}
                </span>
                <span className="speaker-corner"><MiniSpeaker /></span>
              </button>
            )
          })}
        </div>
      )}

      {shown && <Mnemonic c={shown} />}

      {lesson.drills.length > 0 ? (
        <div className="col drill-list" style={{ gap: 8 }}>
          <div className="h2">อ่านออกเสียง</div>
          {lesson.drills.map(d => (
            <div key={d.en} className="card drill-row">
              <Speak text={d.en} size={40} />
              <span className="drill-en en">{d.en}</span>
              <span className="drill-gloss"><b>{d.reading}</b>{d.th ? ` — ${d.th}` : ''}</span>
              <SoundItOut en={d.en} />
            </div>
          ))}
        </div>
      ) : quizOn ? (
        <div ref={quizRef} className="card card-pad self-quiz">
          <LetterQuiz chars={lesson.chars} />
        </div>
      ) : (
        <button className="btn green big" style={{ alignSelf: 'center' }} onClick={() => setQuizOn(true)}>
          📖 ฝึกตัวอักษรชุดนี้
        </button>
      )}
    </div>
  )
}

export default function Script(): JSX.Element {
  const st = useApp()
  const [openId, setOpenId] = useState<string | null>(null)

  if (SCRIPT_LESSONS.length === 0) {
    return (
      <div className="card card-pad col" style={{ alignItems: 'center', gap: 16, padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🔤</div>
        <div className="h1">อ่านอังกฤษ</div>
        <div className="muted" style={{ fontWeight: 700, maxWidth: 440 }}>
          คอร์สอ่านอังกฤษ — สระ พยัญชนะ เสียงที่ไทยไม่มี และตัวสะกด สอนทีละขั้น — กำลังเตรียมอยู่
        </div>
        <button className="btn big" onClick={() => st.go('home')}>กลับหน้าหลัก</button>
      </div>
    )
  }

  const lesson = SCRIPT_LESSONS.find(l => l.id === openId)
  if (lesson) return <LessonView key={lesson.id} lesson={lesson} onBack={() => setOpenId(null)} />

  const allChars = SCRIPT_LESSONS.flatMap(l => l.chars.map(c => c.char))
  const seenTotal = allChars.filter(c => st.scriptProgress[c]).length
  // Graphemes are on the same SRS ladder as vocabulary: "met" is not "known",
  // so the course reports both, and surfaces the ones that have come due.
  const retained = gatedCharCount(st.scriptProgress)
  const dueLetters = dueScriptIds(st.scriptProgress).length
  const stats = SCRIPT_LESSONS.map(l => {
    const chars = charsFor(l)
    const seen = chars.filter(c => st.scriptProgress[c]).length
    return { chars: chars.length, seen, done: chars.length > 0 && seen === chars.length }
  })
  const activeIdx = stats.findIndex(s => !s.done)

  return (
    <div className="col page-narrow" style={{ gap: 18 }}>
      <div className="browse-head">
        <div className="h1">🔤 อ่านอังกฤษ</div>
        <div className="browse-sub">
          12 บทเรียน จากศูนย์ถึงอ่านออกเสียงคำอังกฤษได้เอง — ทุกแบบฝึกใช้เฉพาะเสียงที่คุณเรียนมาแล้ว
        </div>
        <div className="course-meter">
          {/* An all-zero bar is noise — show the track only once progress exists */}
          {seenTotal > 0 && (
            <div className="pbar">
              <i style={{ width: `${Math.round((seenTotal / allChars.length) * 100)}%` }} />
            </div>
          )}
          <span className="count">
            {seenTotal} / {allChars.length} ตัวอักษร
            {retained > 0 && <> · <b style={{ color: 'var(--green)' }}>จำได้ {retained}</b></>}
          </span>
        </div>
      </div>

      {/* The sounds Thai lacks, the finals and stress are taught inside the
          lesson intros, which are read once and then gone. This is the way
          back to them. */}
      <button className="card card-pad spread sounds-entry" onClick={() => st.go('sounds')}>
        <div className="row" style={{ gap: 16 }}>
          <span style={{ fontSize: 34 }} aria-hidden>🗣️</span>
          <div style={{ textAlign: 'left' }}>
            <div className="h2">เสียงและการเน้น</div>
            <div className="muted" style={{ fontWeight: 700 }}>
              เสียงที่ไทยไม่มี ตัวสะกดที่ต้องปล่อย และการเน้นพยางค์ — รวมไว้หน้าเดียว
            </div>
          </div>
        </div>
        <span className="pill" aria-hidden>→</span>
      </button>

      {dueLetters > 0 && (
        <div className="card card-pad spread cta-card" style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.20), rgba(167,139,250,0.08))',
          borderColor: 'rgba(56,189,248,0.38)',
        }}>
          <div className="row" style={{ gap: 16 }}>
            <span style={{ fontSize: 34 }} aria-hidden>🔁</span>
            <div>
              <div className="h2">ตัวอักษร {dueLetters} ตัวถึงเวลาทบทวน</div>
              <div className="muted" style={{ fontWeight: 700 }}>
                ตัวอักษรทบทวนรวมกับคำศัพท์และแพตเทิร์นในหน้าทบทวน — ไม่มีรอบแยกเฉพาะตัวอักษร
                เคลียร์ที่นั่นแล้วจะจำได้แน่น
              </div>
            </div>
          </div>
          <button className="btn big" onClick={() => st.go('review')}>ไปทบทวน</button>
        </div>
      )}

      <div className="path">
        {SCRIPT_LESSONS.map((l, i) => {
          const s = stats[i]
          const state = s.done ? 'done' : i === activeIdx ? 'active' : ''
          const pillCls = s.done ? 'done' : s.seen > 0 ? 'going' : ''
          return (
            <div key={l.id} className="path-step">
              <div className={`step-node ${state}`} aria-hidden>{s.done ? '✓' : l.stage}</div>
              <button className="card lesson-card" onClick={() => setOpenId(l.id)}>
                <div className={`glyph-chip k-${l.kind} en`} aria-label={KIND_LABEL[l.kind]}>{chipGlyph(l)}</div>
                <div>
                  <div className="lesson-title">{l.title}</div>
                  <div className="lesson-sub">{l.subtitle}</div>
                  {s.seen > 0 && (
                    <div className={`lesson-mini ${s.done ? 'full' : ''}`} aria-hidden>
                      <i style={{ width: `${s.chars ? Math.round((s.seen / s.chars) * 100) : 0}%` }} />
                    </div>
                  )}
                </div>
                <div className="lesson-state">
                  <span className={`pill ${pillCls}`}>{s.seen}/{s.chars} ตัว</span>
                  <span className={`kind-tag k-${l.kind}`}>{KIND_LABEL[l.kind]}</span>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
