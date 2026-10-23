import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp, listeningCap } from '../core/store'
import { LISTENING } from '../data'
import { speakEnglish, stopSpeech, sfx } from '../core/audio'
import { celebrate } from '../three/celebrate'
import Speak from '../components/Speak'
import '../styles/lab.css'

// Listening comprehension — hear real English built from words you know,
// understand the meaning directly (no word-by-word translating).

function permute(n: number): number[] {
  const p = Array.from({ length: n }, (_, k) => k)
  for (let k = n - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1))
    ;[p[k], p[j]] = [p[j], p[k]]
  }
  return p
}

/** Skeleton bar width (px) derived from the hidden line's length, so the
 *  pre-reveal chat has the rhythm of the real conversation. */
function skelWidth(en: string): number {
  return Math.min(420, 46 + en.length * 8)
}

export default function Listening(): JSX.Element {
  const st = useApp()
  // Only serve dialogues whose words the learner has met: every level up to
  // the cap is fully met (or unlocked). See listeningCap() for why this is
  // the met frontier rather than the mastery gate.
  const exercises = useMemo(() => {
    const cap = listeningCap(st)
    const eligible = LISTENING.filter(ex => ex.level <= cap)
    return eligible.length > 0 ? eligible : LISTENING.filter(ex => ex.level === 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  // Choices are shuffled per exercise; picked/answer are in DISPLAY order.
  const ex0 = exercises[i % (exercises.length || 1)]
  const order = useMemo(() => permute(ex0?.choices.length ?? 0), [i, ex0?.id])
  const rewarded = useRef(new Set<string>())
  // Which line is currently speaking, and a token that cancels a running
  // sequence when the exercise changes or the user takes over.
  const [playingLine, setPlayingLine] = useState<number | null>(null)
  const playRun = useRef(0)

  useEffect(() => {
    playRun.current++
    stopSpeech()
    setPlayingLine(null)
    return () => { playRun.current++; stopSpeech() }
  }, [i])

  if (exercises.length === 0) {
    return (
      <div className="card card-pad col" style={{ alignItems: 'center', gap: 16, padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🎧</div>
        <div className="h1">ห้องฟัง</div>
        <div className="muted" style={{ fontWeight: 700, maxWidth: 440 }}>
          บทสนทนาสั้นๆ ความเร็วเจ้าของภาษา ที่สร้างจากคำที่คุณรู้แล้ว กำลังชงอยู่ — แวะกลับมาใหม่เร็วๆ นี้
        </div>
        <button className="btn big" onClick={() => st.go('home')}>กลับหน้าหลัก</button>
      </div>
    )
  }

  const ex = exercises[i % exercises.length]
  const answerDisplayIdx = order.indexOf(ex.answer)
  const done = picked != null
  const pos = (i % exercises.length) + 1
  const total = exercises.length
  // First voice in the dialogue sits on the left; the reply sits on the right.
  const firstSpeaker = ex.lines[0]?.speaker

  // Play the dialogue line by line, WAITING for each clip to finish. A fixed
  // timer truncated any line longer than the interval; lines run 1-5s, so most
  // of them were being cut off mid-sentence.
  const playAll = async (): Promise<void> => {
    const run = ++playRun.current
    stopSpeech()
    for (let li = 0; li < ex.lines.length; li++) {
      if (playRun.current !== run) return
      setPlayingLine(li)
      await speakEnglish(ex.lines[li].en)
      if (playRun.current !== run) return
      // A beat between speakers, the way a real conversation breathes.
      await new Promise(r => window.setTimeout(r, 420))
    }
    if (playRun.current === run) setPlayingLine(null)
  }

  /** Any manual tap on a single line takes over from the sequence. */
  const takeOver = (): void => { playRun.current++; setPlayingLine(null) }

  return (
    <div className="col page-narrow" style={{ gap: 10 }}>
      <div className="spread">
        <div>
          <div className="h1">🎧 ห้องฟัง</div>
          <div className="muted" style={{ fontWeight: 700 }}>ฟังให้เข้าใจความหมาย — ไม่ต้องแปลทีละคำ</div>
        </div>
        <span className="muted small" style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{pos} / {total}</span>
      </div>
      <div className="pbar"><i style={{ width: `${(pos / total) * 100}%` }} /></div>

      <div className="card col" style={{ gap: 0, marginTop: 4 }}>
        <div className="lab-toolbar">
          {/* After answering, Next (in the banner) is the primary action — demote Play to ghost */}
          <button className={done ? 'btn ghost' : 'btn'} onClick={() => void playAll()}>▶ ฟังบทสนทนา</button>
          <button className="icon-btn" aria-label="ฟังบทสนทนาอีกครั้ง" title="ฟังอีกครั้ง" onClick={() => void playAll()}>↻</button>
          <span className="lab-hint">ฟังก่อน แล้วค่อยตอบ</span>
        </div>

        <div className="lab-chat">
          {ex.lines.map((l, li) => (
            <div
              key={li}
              className={`lab-bubble ${l.speaker === firstSpeaker ? 'a' : 'b'} ${playingLine === li ? 'speaking' : ''}`}
            >
              <span className="lab-avatar" aria-hidden="true">{l.speaker.charAt(0)}</span>
              <div className="lab-bubble-body">
                <div className="lab-bubble-head">
                  <span className="lab-speaker">{l.speaker}</span>
                  <span onClickCapture={takeOver}><Speak text={l.en} size={28} /></span>
                </div>
                <div className="lab-bubble-text">
                  {/* Same markup pre/post reveal: hidden, it sizes the well so
                      the reveal never shifts layout; the skeleton floats on top. */}
                  <div className={revealed ? 'lab-reveal' : 'lab-ghost'} aria-hidden={!revealed}>
                    <div className="en" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.45 }}>{l.en}</div>
                    <div className="muted small" style={{ fontWeight: 700 }}>{l.reading} — {l.th}</div>
                  </div>
                  {!revealed && (
                    <div className="lab-skel-wrap lab-skel-overlay" aria-label="บทพูดจะแสดงหลังจากคุณตอบ">
                      <span className="lab-skel" style={{ width: skelWidth(l.en) }} />
                      <span className="lab-skel sub" style={{ width: skelWidth(l.en) * 0.68 }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`lab-question ${done ? 'answered' : ''}`}>
          <div className="lab-question-title">{ex.question}</div>
          <div className="lab-choices">
            {order.map((origIdx, ci) => (
              <button
                key={ci}
                className={`choice ${done && ci === answerDisplayIdx ? 'correct' : ''} ${done && picked === ci && ci !== answerDisplayIdx ? 'wrong' : ''} ${done && picked !== ci && ci !== answerDisplayIdx ? 'dim' : ''}`}
                disabled={done}
                onClick={() => {
                  setPicked(ci)
                  setRevealed(true)
                  const ok = ci === answerDisplayIdx
                  if (st.settings.sound) ok ? sfx.correct() : sfx.wrong()
                  if (ok && !rewarded.current.has(ex.id)) {
                    rewarded.current.add(ex.id)
                    st.addXp(15)
                    celebrate.burst(undefined, undefined, 40)
                  }
                }}
              >
                <span className="key">{ci + 1}</span>{ex.choices[origIdx]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {done && (
        <div className={`feedback feedback-sticky ${picked === answerDisplayIdx ? 'good' : 'bad'}`}>
          <span style={{ fontSize: 30 }}>{picked === answerDisplayIdx ? '✅' : '🌧️'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900 }}>{picked === answerDisplayIdx ? 'เข้าใจภาษาอังกฤษจริงๆ แล้ว!' : 'ฟังอีกรอบพร้อมเปิดบทพูด'}</div>
            <div className="muted" style={{ fontWeight: 700 }}>{ex.explanation}</div>
          </div>
          <button className="btn" onClick={() => { setI(i + 1); setPicked(null); setRevealed(false) }}>ถัดไป →</button>
        </div>
      )}
    </div>
  )
}
