import { useMemo, useState } from 'react'
import { useApp, effectiveUnlocked } from '../core/store'
import { PATTERNS, CURRICULUM } from '../data'
import { isDue } from '../core/srs'
import { makeRound, possibleSentenceCount, sentenceKey, sentenceHash, type Round } from '../core/generate'
import { speakEnglish, sfx } from '../core/audio'
import { celebrate } from '../three/celebrate'
import Speak from '../components/Speak'
import '../styles/session.css'

// Sentence Builder — the production engine. The learner gets a MEANING (in
// Thai) and must construct the English themselves from tiles, using patterns
// + vocab they already know. Combos are generated fresh every round, so they
// constantly build sentences they've never seen.

export default function Builder(): JSX.Element {
  const st = useApp()
  const available = useMemo(() => {
    const maxLevel = effectiveUnlocked(st)
    const learned = Object.values(PATTERNS).filter(p => st.progress[p.id])
    if (learned.length > 0) return learned
    return Object.values(PATTERNS).filter(p => p.level <= maxLevel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // What these patterns can produce between them, counted rather than
  // estimated — the generator can reach every one of them. It is the honest
  // form of this app's whole claim: a few dozen patterns and a few hundred
  // words are not a phrasebook, they are hundreds of sentences you were never
  // taught. Recomputed only when the pattern set changes, which is never
  // mid-session.
  const possible = useMemo(() => possibleSentenceCount(available), [available])

  /**
   * What the next pattern is worth.
   *
   * The meter counts what PATTERNS can produce, and a learner reasonably
   * expects a number labelled "sentences you can build" to move when they learn
   * ten words. It does not, and cannot: the nine patterns at levels 1–3 draw on
   * 22 slot words between them, so vocabulary beyond those changes nothing. The
   * honest fix is to say what actually moves it — and one pattern is worth far
   * more than ten words, which is the app's whole thesis stated as a number.
   */
  const nextUnlock = useMemo(() => {
    for (const lv of CURRICULUM) {
      for (const id of lv.patternIds) {
        const p = PATTERNS[id]
        if (!p || st.progress[id] || available.some(a => a.id === id)) continue
        return { name: p.name, gain: possibleSentenceCount([...available, p]) - possible }
      }
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available, possible])

  // Serving a round is what counts as "seen" — not answering it correctly.
  // Skipping a sentence is still having been shown it, and the complaint this
  // fixes was about seeing the same ones, not about scoring them.
  const serve = (): Round | null => {
    if (!available.length) return null
    const live = useApp.getState()
    // Patterns whose most recent answer was wrong. Read fresh each round so a
    // miss influences the very next sentence, and recomputed rather than
    // stored — `applyAnswer` already keeps these counters, including on the
    // off-schedule practice path Builder uses.
    const struggling = new Set(
      available
        .map(p => p.id)
        .filter(id => {
          const pr = live.progress[id]
          return pr != null && pr.incorrect > 0 && pr.streak === 0
        }),
    )
    const r = makeRound(available, live.seenSentences, { struggling })
    st.markSentenceSeen(sentenceHash(sentenceKey(r)))
    return r
  }

  const [round, setRound] = useState<Round | null>(serve)
  const [placed, setPlaced] = useState<number[]>([])   // tray keys in answer order
  const [result, setResult] = useState<'good' | 'bad' | null>(null)
  const [streak, setStreak] = useState(0)
  // Distinct sentences, not correct answers: building the same one twice is
  // one sentence built. Session-scoped by design — it resets each visit, so it
  // reads as "what can I make today", not a permanent completion score.
  const [built, setBuilt] = useState<ReadonlySet<string>>(() => new Set())
  const showReading = st.settings.showReading

  if (!round) {
    return (
      <div className="card card-pad col" style={{ alignItems: 'center', gap: 16, padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🧱</div>
        <div className="h1">สร้างประโยค</div>
        <div className="muted" style={{ fontWeight: 700, maxWidth: 440 }}>
          เรียนแพตเทิร์นประโยคแรกในบทเรียนก่อน แล้วค่อยกลับมาที่นี่เพื่อเริ่มสร้างประโยคภาษาอังกฤษของคุณเอง
          — ประโยคที่ไม่เคยเห็นมาก่อน จากชิ้นส่วนที่คุณรู้จักแล้ว
        </div>
        <button className="btn big" onClick={() => st.go('home')}>ไปเรียนแพตเทิร์น</button>
      </div>
    )
  }

  const answerTiles = placed.map(k => round.tray.find(t => t.key === k)!)
  const check = () => {
    const ok =
      answerTiles.length === round.tokens.length &&
      answerTiles.every((t, i) => t.en === round.tokens[i].en)
    setResult(ok ? 'good' : 'bad')
    if (st.settings.sound) ok ? sfx.correct() : sfx.wrong()
    if (ok) {
      st.addXp(20)
      setStreak(s => s + 1)
      const key = sentenceKey(round)
      const fresh = !built.has(key)
      setBuilt(b => new Set(b).add(key))
      // English words are spoken with spaces between them.
      speakEnglish(round.tokens.map(t => t.en).join(' '))
      // Finishing the set is the bigger moment of the two, so it wins.
      if (fresh && built.size + 1 === possible) celebrate.burst()
      else if ((streak + 1) % 5 === 0) celebrate.burst()
    }
    // Builder is practice: it only advances the SRS schedule when the
    // pattern was genuinely due — off-schedule reps record stats only.
    const p = st.progress[round.pattern.id]
    st.answer(round.pattern.id, ok, p ? isDue(p) : false)
    if (!ok) setStreak(0)
  }

  const nextRound = () => {
    setRound(serve())
    setPlaced([])
    setResult(null)
  }

  const correctEn = round.tokens.map(t => t.en).join(' ')
  const complete = possible > 0 && built.size >= possible

  /**
   * A word this learner has never been taught.
   *
   * Builder fills slots from everything a pattern allows, which can include
   * vocabulary the daily budget has not reached yet — about 5% of tiles, in
   * roughly one round in six. Those tiles were previously bare English:
   * nothing to reason from, so the round became guesswork on that one word.
   *
   * Applied to EVERY tile, distractors included. If only the answer's new
   * words were glossed, the gloss would be a tell — "this tile belongs in the
   * sentence" — and the round would be solvable without reading any English.
   * Literal template words have no item and no gloss; they are the pattern
   * itself, which is explained beside the card.
   */
  const isNew = (t: { id: string; th: string }): boolean =>
    !t.id.startsWith('lit:') && t.th !== '' && !st.progress[t.id]

  /** English, reading, and — for an unmet word — its Thai meaning. */
  const tileFace = (t: Round['tray'][number]): JSX.Element => {
    const fresh = isNew(t)
    return (
      <>
        {t.en}
        {/* The reading is a scaffold for what you cannot yet decode, so an
            unmet word keeps it even when the setting is off. */}
        {(showReading || fresh) && t.reading && <span className="tile-sub">{t.reading}</span>}
        {fresh && <span className="tile-en">{t.th}</span>}
      </>
    )
  }

  // "Close" is earned, not given: right tile count AND at most one tile out of
  // position. Anything else (extra tiles, wrong words) is simply not it.
  const positionalMatches = answerTiles.filter((t, i) => t.en === round.tokens[i]?.en).length
  const isClose =
    answerTiles.length === round.tokens.length &&
    positionalMatches >= round.tokens.length - 1

  return (
    <div className="focus-col">
      <div className="builder-head">
        <div className="builder-head-text">
          <div className="builder-title">🧱 สร้างประโยค</div>
          <div className="muted small builder-sub">พูดเองได้ — จากชิ้นส่วนที่คุณรู้อยู่แล้ว</div>
          {streak === 0 && built.size === 0 && !result && (
            <div className="stat-chip motivate">สร้างประโยคแรกของคุณ! <span>🧱</span></div>
          )}
        </div>
        {streak > 0 && (
          <div className="statbar">
            <div className="stat-chip flame"><span>🔥</span><div><div className="n">{streak}</div><div className="lbl">ติดต่อกัน</div></div></div>
          </div>
        )}
      </div>

      {/* The set is finite and reachable, so it gets a real meter rather than a
          running tally. Reading "3 / 47" on arrival is the point: it says how
          much these few patterns are actually worth before any of it is built. */}
      <div className="build-meter">
        <div className="spread">
          {/* "Sentences you can build" read as a claim about vocabulary, and
              the number then sat still through a week of learning words. This
              says what the number is actually counting. */}
          <span className="muted small build-meter-label">
            {complete
              ? 'ครบทุกประโยคที่แพตเทิร์นของคุณสร้างได้แล้ว 🎉'
              : 'ประโยคที่แพตเทิร์นของคุณสร้างได้'}
          </span>
          {!complete && (
            <span className="muted small build-meter-count">{built.size} / {possible}</span>
          )}
        </div>
        <div className={`pbar ${complete ? 'green' : ''} ${built.size === 0 ? 'at-zero' : ''}`}>
          <i style={{ width: `${possible ? (built.size / possible) * 100 : 0}%` }} />
        </div>
        {nextUnlock && nextUnlock.gain > 0 && (
          <span className="muted small build-meter-next" data-testid="next-unlock">
            แพตเทิร์นถัดไป <b className="en">{nextUnlock.name}</b> จะเพิ่มให้อีก{' '}
            <b>+{nextUnlock.gain}</b>
          </span>
        )}
      </div>

      <div className="builder-body">
        <div className={`card session-card grow-card ${result ? 'graded' : ''}`}>
          <div className="quiz-main">
            <div className="prompt-zone">
              <div className="muted" style={{ fontWeight: 800 }}>เรียงประโยคภาษาอังกฤษให้ตรงกับ:</div>
              <div style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 900, textAlign: 'center' }}>“{round.th}”</div>
              <div className="pattern-chip">
                <span className="lbl">แพตเทิร์น</span>
                <span className="en pat">{round.pattern.name}</span>
              </div>
            </div>

            <div className="answer-zone quiz-narrow" style={{ gap: 14 }}>
              <div className={`answer-strip ${result === 'good' ? 'strip-good' : result === 'bad' ? 'strip-bad' : placed.length > 0 ? 'glow' : 'empty'}`}>
                {answerTiles.length === 0 && (
                  <span className="faint" style={{ fontWeight: 700, padding: '0 6px' }}>แตะคำด้านล่างเพื่อเรียงประโยค…</span>
                )}
                {answerTiles.map(t => (
                  <button
                    key={t.key}
                    className={`tile in-answer en ${isNew(t) ? 'fresh' : ''}`}
                    disabled={result != null}
                    onClick={() => { setPlaced(p => p.filter(k => k !== t.key)); if (st.settings.sound) sfx.tap() }}
                  >
                    {tileFace(t)}
                  </button>
                ))}
              </div>

              <div className={`tile-tray ${result != null ? 'frozen' : ''}`}>
                {round.tray.map(t => (
                  <button
                    key={t.key}
                    className={`tile en ${placed.includes(t.key) ? 'used' : ''} ${isNew(t) ? 'fresh' : ''}`}
                    disabled={result != null}
                    onClick={() => {
                      setPlaced(p => [...p, t.key])
                      if (st.settings.sound) sfx.tap()
                      speakEnglish(t.en, 0.95)
                    }}
                  >
                    {tileFace(t)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="session-footer feedback-sticky">
            {!result && (
              <div className="check-row">
                <button className="btn ghost small" onClick={() => setPlaced([])} disabled={placed.length === 0}>ล้าง</button>
                <button className="btn green big" disabled={answerTiles.length === 0} onClick={check}>ตรวจ</button>
              </div>
            )}
            {result && (
              <div className={`feedback ${result}`}>
                <span style={{ fontSize: 30 }}>{result === 'good' ? '🎉' : '🌧️'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 17 }}>
                    {result === 'good'
                      ? 'คุณสร้างประโยคนี้ขึ้นมาเองเลยนะ!'
                      : isClose
                        ? 'เกือบแล้ว — นี่คือลำดับที่เป็นธรรมชาติ'
                        : 'ยังไม่ใช่ — คำตอบคือ:'}
                  </div>
                  <div className="row" style={{ gap: 10, marginTop: 4 }}>
                    <Speak text={correctEn} size={34} />
                    <span className="en" style={{ fontSize: 20, fontWeight: 700 }}>{correctEn}</span>
                  </div>
                </div>
                <button className="btn" onClick={nextRound}>ถัดไป →</button>
              </div>
            )}
          </div>
        </div>

        <div className="card card-pad why-panel">
          <div className="why-title">✨ ทำไมแพตเทิร์นนี้ถึงใช้ได้</div>
          <div className="why-body">{round.pattern.explanation}</div>
        </div>
      </div>
    </div>
  )
}
