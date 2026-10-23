import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useApp, unlearnedIds, newBudgetRemaining } from '../core/store'
import { CURRICULUM, PATTERNS, getAnyItem } from '../data'
import type { LexItem, SentencePattern } from '../core/types'
import { speakEnglish, sfx } from '../core/audio'
import { celebrate } from '../three/celebrate'
import Speak from '../components/Speak'
import '../styles/lab.css'

/** A lesson is a sequence of teach cards interleaved with quick retrieval
 *  checks: every ~3 cards (and right before the final card) the learner is
 *  asked to pick the English for something they just saw. No SRS writes — the
 *  checks are pacing + immediate retrieval, not grading. */
type Step =
  | { kind: 'teach'; id: string }
  | { kind: 'check'; id: string; choices: string[] }

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildSteps(queue: string[]): Step[] {
  // Checks quiz vocab/phrases only — patterns don't have a clean th→en pair.
  const checkable = queue.filter(qid => !PATTERNS[qid] && getAnyItem(qid))
  const steps: Step[] = []
  const taught: string[] = []
  const alreadyChecked = new Set<string>()

  const makeCheck = (): Step | null => {
    // Target: a recently-taught, not-yet-checked item from this session.
    const pool = taught.filter(tid => checkable.includes(tid) && !alreadyChecked.has(tid))
    if (pool.length === 0) return null
    const recent = pool.slice(-3)
    const target = recent[Math.floor(Math.random() * recent.length)]
    // Distractors must be unambiguously WRONG, the same rule Review's
    // makeQuestion applies. A level teaches near-synonyms side by side
    // ("although" / "even though", "up to you" / "whatever you like"), and
    // without this filter the very session that introduces them could show
    // both as choices for one prompt — two correct answers, one marked wrong.
    const glosses = (id: string): string[] => {
      const o = getAnyItem(id)
      return o ? [o.th, ...(o.altTh ?? [])].flatMap(g => g.split('/')).map(g => g.trim().toLowerCase()) : []
    }
    const usedEn = new Set([getAnyItem(target)?.en.toLowerCase()])
    const usedGlosses = new Set(glosses(target))
    const distractors: string[] = []
    for (const cid of shuffle(checkable.filter(cid => cid !== target))) {
      if (distractors.length === 3) break
      const o = getAnyItem(cid)
      if (!o || usedEn.has(o.en.toLowerCase())) continue
      const g = glosses(cid)
      if (g.some(x => usedGlosses.has(x))) continue
      distractors.push(cid)
      usedEn.add(o.en.toLowerCase())
      g.forEach(x => usedGlosses.add(x))
    }
    if (distractors.length < 2) return null
    alreadyChecked.add(target)
    return { kind: 'check', id: target, choices: shuffle([target, ...distractors]) }
  }

  queue.forEach((qid, i) => {
    const beforeLast = i === queue.length - 1 && i > 0
    if ((i > 0 && i % 3 === 0) || beforeLast) {
      const check = makeCheck()
      if (check) steps.push(check)
    }
    steps.push({ kind: 'teach', id: qid })
    taught.push(qid)
  })
  return steps
}

/** Thai label for the card's category chip: the pos tag when the item has one. */
function kindLabel(item: LexItem): string {
  if (item.pos) return item.pos
  return item.type === 'phrase' ? 'วลี' : 'คำศัพท์'
}

/** Learn-new-items flow: rich teaching cards, one concept at a time. */
export default function Lesson(): JSX.Element {
  const st = useApp()
  const level = CURRICULUM.find(l => l.n === st.activeLevel) ?? CURRICULUM[0]
  const queue = useMemo(() => {
    // Only as many new items as today's budget still allows. A whole level at
    // once is what produced the one-dense-day-then-three-empty rhythm; spread
    // over several days, every day has both new material and reviews.
    const unlearned = unlearnedIds(st.progress, level.n)
    // Material still to come, but today's budget is gone → serve NOTHING.
    // This used to fall through to the whole level, which meant the cap held
    // for the first lesson of the day and evaporated on the second: a learner
    // could take all of level 3 in one sitting, then all of level 4 the moment
    // the rolling frontier opened it. Guarded by scripts/verify-pacing.mjs.
    if (unlearned.length > 0) return unlearned.slice(0, newBudgetRemaining(st))
    // Every item here has been met already, so re-teaching starts nothing new
    // and costs no budget — a refresher pass over the cards is fine.
    return level.itemIds.concat(level.patternIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.n])
  const steps = useMemo(() => buildSteps(queue), [queue])
  const [stepIdx, setStepIdx] = useState(0)
  const [done, setDone] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const showReading = st.settings.showReading

  const step: Step | undefined = steps[Math.min(stepIdx, steps.length - 1)]
  const id = step?.id ?? ''
  const item = getAnyItem(id)
  const pattern = step?.kind === 'teach' ? PATTERNS[id] : undefined
  const isLastStep = stepIdx + 1 >= steps.length

  useEffect(() => {
    if (step?.kind === 'teach' && item && !PATTERNS[step.id]) speakEnglish(item.en)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx])

  // Today's new-item budget is spent, but this level still has material. Not a
  // punishment and not a dead end — reviews are the point of the day, and the
  // pace is the learner's to change.
  if (steps.length === 0) {
    const waiting = unlearnedIds(st.progress, level.n).length
    return (
      <div className="focus-col teach-col" data-testid="lesson-nothing-new">
        <div className="card card-pad col grow-card" style={{ alignItems: 'center', gap: 18, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>🌱</div>
          <div className="h1">วันนี้เรียนใหม่ครบแล้ว</div>
          <div className="muted" style={{ fontWeight: 700, maxWidth: 440 }}>
            คุณปลูกคำใหม่ของวันนี้ครบทั้ง {st.settings.newPerDay} คำแล้ว
            {waiting > 0 && <> พรุ่งนี้มีอีก {waiting} คำรอคุณอยู่ในระดับ {level.n}</>}
            {' '}การเว้นระยะคือสิ่งที่ทำให้จำได้ติดทน — การเรียนรู้จริงๆ เกิดขึ้นตอนทบทวน
          </div>
          <div className="lab-done-actions">
            <button className="btn big" onClick={() => st.go('review')}>ไปทบทวน</button>
            <button className="btn ghost big" onClick={() => st.go('home')}>กลับหน้าหลัก</button>
          </div>
          <button className="btn ghost small" onClick={() => st.go('settings')}>
            อยากเรียนเร็วขึ้น? ปรับได้ที่ ตั้งค่า
          </button>
        </div>
      </div>
    )
  }

  if (!item) return <div className="card card-pad">ยังไม่มีอะไรให้เรียนที่นี่</div>

  if (done) {
    return (
      <div className="focus-col teach-col">
        <div className="card card-pad col grow-card" style={{ alignItems: 'center', gap: 18, padding: 48, textAlign: 'center' }}>
          <div className="lab-stagger" style={{ fontSize: 72, '--d': 0 } as CSSProperties}>🎉</div>
          <div className="h1 lab-stagger" style={{ '--d': 1 } as CSSProperties}>จบบทเรียนระดับ {level.n} แล้ว!</div>
          <div className="row lab-stagger" style={{ gap: 12, '--d': 2 } as CSSProperties}>
            <div className="lab-stat">
              <span className="n">{queue.length}</span>
              <span className="l">คำใหม่</span>
            </div>
            <div className="lab-stat">
              <span className="n" style={{ color: 'var(--gold)' }}>+{queue.length * 10}</span>
              <span className="l">XP ที่ได้</span>
            </div>
          </div>
          <div className="muted lab-stagger" style={{ fontWeight: 700, maxWidth: 440, '--d': 3 } as CSSProperties}>
            ทุกอย่างที่ปลูกไว้จะงอกขึ้นมาในรอบทบทวนอีกประมาณ 4 ชั่วโมง —
            นั่นคือ SRS กำลังทำงานของมัน
          </div>
          <div className="lab-done-actions lab-stagger" style={{ '--d': 4 } as CSSProperties}>
            <button className="btn big" onClick={() => st.go('home')}>กลับหน้าหลัก</button>
            <button className="btn ghost big" onClick={() => st.go('builder')}>ลองสร้างประโยค</button>
          </div>
        </div>
      </div>
    )
  }

  const finishOrNext = () => {
    if (isLastStep) {
      if (st.settings.sound) sfx.fanfare()
      celebrate.burst()
      setDone(true)
    } else {
      setPicked(null)
      setStepIdx(stepIdx + 1)
    }
  }

  const advanceTeach = () => {
    st.learnItem(id)
    st.addXp(10)
    if (st.settings.sound) sfx.tap()
    finishOrNext()
  }

  const pick = (choiceId: string) => {
    if (picked) return
    setPicked(choiceId)
    const ok = choiceId === id
    if (ok) {
      if (st.settings.sound) sfx.correct()
      speakEnglish(item.en)
    } else if (st.settings.sound) {
      sfx.wrong()
    }
    // Correct → brief green, auto-advance. Wrong → linger on the right answer.
    window.setTimeout(finishOrNext, ok ? 850 : 1900)
  }

  const header = (
    <>
      <div className="spread">
        <button className="btn ghost small" onClick={() => st.go('home')}>← หน้าหลัก</button>
        <div className="muted" style={{ fontWeight: 800 }}>
          ระดับ {level.n} · {level.title} — {stepIdx + 1} / {steps.length}
        </div>
      </div>
      <div className="pbar"><i style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }} /></div>
    </>
  )

  if (step.kind === 'check') {
    const wrongPick = picked !== null && picked !== id
    return (
      <div className="focus-col teach-col">
        {header}
        <div className="card card-pad col teach-card" style={{ gap: 16, padding: 28 }}>
          <div className="row" style={{ justifyContent: 'center' }}>
            <span className="lab-chip check-chip">⚡ เช็กเร็วๆ!</span>
          </div>
          <div className="muted" style={{ textAlign: 'center', fontWeight: 800 }}>
            เพิ่งเรียนไปเมื่อกี้ — ข้อไหนคือภาษาอังกฤษของ…
          </div>
          <div className="quiz-prompt" style={{ fontSize: 'clamp(26px, 4.5vw, 38px)' }}>“{item.th}”</div>
          <div className="lab-choices" style={{ marginTop: 4 }}>
            {step.choices.map(cid => {
              const choice = getAnyItem(cid)
              if (!choice) return null
              const cls = picked === null
                ? 'choice'
                : cid === id ? 'choice correct'
                  : cid === picked ? 'choice wrong'
                    : 'choice dim'
              return (
                <button key={cid} className={cls} disabled={picked !== null} onClick={() => pick(cid)}>
                  <span className="en" style={{ fontSize: 21, fontWeight: 700 }}>{choice.en.replace(/_/g, '')}</span>
                  {showReading && <span className="muted small" style={{ fontWeight: 700 }}>{choice.reading}</span>}
                </button>
              )
            })}
          </div>
          <div className="small faint check-foot" style={{ textAlign: 'center', fontWeight: 700 }}>
            {wrongPick
              ? <>คำตอบคือ <span className="en" style={{ fontSize: 15 }}>{item.en.replace(/_/g, '')}</span> — เดี๋ยวได้เจออีกตอนทบทวน</>
              : 'แค่เช็กจังหวะเฉยๆ — ไม่มีผลกับการทบทวนของคุณ'}
          </div>
        </div>
      </div>
    )
  }

  /**
   * A pattern card must speak a real sentence, not its template.
   *
   * `patternAsItem` renders `{subject} want {object}` as `___ want ___` for
   * display, and the vocabulary path then strips underscores — which for a
   * pattern leaves only the literal words. The audio button would then ask
   * the manifest for a fragment (`want` alone, `please` alone) rather than a
   * sentence, and a pattern with no literal words at all would ask for an
   * empty key and play nothing. Audio resolves by text, so neither case
   * errors — the button simply does nothing useful.
   *
   * The showcase combo is the right thing to say: it is a concrete example of
   * the pattern, every pattern has one, and it is a generatable sentence so a
   * clip is guaranteed to exist.
   */
  const showcaseEn = (p: SentencePattern): string =>
    p.enTemplate
      .replace(/\{(\w+)\}/g, (_, slot) => {
        const fill = (p.showcase ?? [])[0]?.[slot]
        return fill ? (getAnyItem(fill)?.en ?? '') : ''
      })
      .replace(/\s+/g, ' ')
      .trim()

  const audioText = pattern
    ? showcaseEn(pattern)
    : item.audioHint ?? item.en.replace(/_/g, '')

  return (
    <div className="focus-col teach-col">
      {header}

      <div className="card card-pad col teach-card" style={{ gap: 16, padding: 28 }}>
        <div className="row" style={{ justifyContent: 'center' }}>
          <span className="lab-chip">
            {pattern ? '✨ แพตเทิร์นใหม่' : `🆕 คำใหม่ · ${kindLabel(item)}`}
          </span>
        </div>

        <div className="quiz-prompt en" style={{ marginTop: 2 }}>{item.en}</div>
        {showReading && (
          <div className="read-line">
            {item.reading}
            {item.ipa && <span className="ipa">{item.ipa}</span>}
          </div>
        )}
        {/* For a pattern, `item.en` above is already the frame with blanks, so
            the meaning line is the Thai template — not the frame a second time. */}
        <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 900 }}>
          {pattern ? pattern.thTemplate.replace(/\{\w+\}/g, '___') : item.th}
        </div>

        <div className="row" style={{ justifyContent: 'center', alignItems: 'flex-end', gap: 18 }}>
          <div className="lab-audio">
            <Speak text={audioText} size={56} />
            <span className="lbl">ฟัง</span>
          </div>
          <div className="lab-audio">
            <Speak text={audioText} slow size={40} />
            <span className="lbl">🐢 ช้า</span>
          </div>
        </div>

        {(item.notes || pattern) && (
          <div className="card card-pad" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="small" style={{ fontWeight: 900, color: 'var(--orange-soft)', marginBottom: 6 }}>
              💡 ทำไมถึงใช้แบบนี้
            </div>
            <div style={{ fontWeight: 600, lineHeight: 1.7 }}>{pattern ? pattern.explanation : item.notes}</div>
            {item.mnemonic && (
              <div className="muted" style={{ marginTop: 10, fontWeight: 600, lineHeight: 1.7 }}>
                🧠 {item.mnemonic}
              </div>
            )}
          </div>
        )}

        {item.examples && item.examples.length > 0 && (
          <div className="col" style={{ gap: 8 }}>
            {item.examples.map((ex, i) => (
              <div key={i} className="row card" style={{ padding: '12px 16px', gap: 14 }}>
                <Speak text={ex.en} size={36} />
                <div>
                  <span className="en" style={{ fontSize: 20, fontWeight: 700 }}>{ex.en}</span>
                  {showReading && <span className="muted" style={{ marginLeft: 10, fontWeight: 700, color: 'var(--gold)' }}>{ex.reading}</span>}
                  <div className="muted small" style={{ fontWeight: 700 }}>{ex.th}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pattern && (
          <div className="col" style={{ gap: 8 }}>
            {(pattern.showcase ?? []).map((combo, i) => {
              const en = pattern.enTemplate.replace(/\{(\w+)\}/g, (_, slot) =>
                combo[slot] ? (getAnyItem(combo[slot])?.en ?? '') : '').replace(/\s+/g, ' ').trim()
              return (
                <div key={i} className="row card" style={{ padding: '12px 16px', gap: 14 }}>
                  <Speak text={en} size={36} />
                  <span className="en" style={{ fontSize: 20, fontWeight: 700 }}>{en}</span>
                </div>
              )
            })}
          </div>
        )}

        <button className="btn big teach-cta" style={{ alignSelf: 'center', minWidth: 240 }} onClick={advanceTeach}>
          {isLastStep ? 'จบบทเรียน' : 'เข้าใจแล้ว ถัดไป'}
        </button>
      </div>
    </div>
  )
}
