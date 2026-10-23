import { useMemo, useState } from 'react'
import { useApp } from '../core/store'
import {
  NEW_SOUNDS, FINALS, STRESS_RULES, minimalPairs, metPairs,
  type MinimalPair, type SoundNote,
} from '../core/sounds'
import { speakEnglish } from '../core/audio'
import Speak from '../components/Speak'
import '../styles/browse.css'
import '../styles/sounds.css'

// The pronunciation reference — the sounds Thai lacks, the finals Thai
// swallows, and stress, in one place, always reachable.
//
// The phonics course TEACHES these across its lessons, but only in each
// lesson's intro: a paragraph read once and never seen again. That left the
// system explained but not revisitable, which is the gap this screen fills.
//
// The minimal pairs at the bottom are COMPUTED from the corpus's IPA by
// `minimalPairs()`, so every content batch adds its own. Nothing there is
// transcribed by hand.

/** Pairs shown per confusion group before the "show more" button. */
const PAIR_PREVIEW = 4

/** Crisp speaker glyph for the example-word chips (brand gold, like Speak). */
function SpeakerGlyph(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9.5v5c0 .6.4 1 1 1h2.6l4 3.2c.7.5 1.6 0 1.6-.8V6.1c0-.8-.9-1.3-1.6-.8l-4 3.2H5c-.6 0-1 .4-1 1Z"
        fill="var(--gold)"
      />
      <path d="M16 9.2a4.2 4.2 0 0 1 0 5.6" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** An example word as one tappable chip: the whole pill speaks, not just a
 *  28px icon inside it, so the tap target stays a comfortable 40px high. */
function WordChip({ word }: { word: string }): JSX.Element {
  const [speaking, setSpeaking] = useState(false)
  return (
    <button
      className={`eg-chip ${speaking ? 'speaking' : ''}`}
      aria-label={`ฟัง ${word}`}
      onClick={() => {
        speakEnglish(word, 0.88)
        setSpeaking(true)
        window.setTimeout(() => setSpeaking(false), 1400)
      }}
    >
      <SpeakerGlyph />
      <span className="en">{word}</span>
    </button>
  )
}

/** One sound (or final): how to make it, where Thai mouths slip, words to try. */
function SoundCard({ note }: { note: SoundNote }): JSX.Element {
  return (
    <div className="sound-note">
      <div className="sound-head">
        <span className="ipa-chip big en">/{note.ipa}/</span>
        <div className="sound-id">
          <div className="sound-title">{note.title}</div>
          <div className="sound-reading">{note.reading}</div>
        </div>
      </div>
      <div className="sound-row">
        <span className="sound-key">ทำยังไง</span>
        <p>{note.how}</p>
      </div>
      <div className="sound-row trap">
        <span className="sound-key">กับดัก</span>
        <p>{note.trap}</p>
      </div>
      <div className="eg-chips">
        {note.examples.map(w => <WordChip key={w} word={w} />)}
      </div>
    </div>
  )
}

interface PairGroup {
  label: string
  why: string
  pairs: { p: MinimalPair; met: boolean }[]
}

const pairKey = (p: MinimalPair): string => p.members.map(m => m.id).sort().join('|')

export default function Sounds(): JSX.Element {
  const go = useApp(s => s.go)
  const progress = useApp(s => s.progress)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  // Grouped by the confusion each pair demonstrates. Pairs the learner has
  // already met both halves of — the ones they can be confused by right now —
  // float to the top of their group, and groups holding one float to the top
  // of the list. minimalPairs() is memoised inside sounds.ts; this memo is
  // over the grouping and the met-check.
  const groups = useMemo<PairGroup[]>(() => {
    const met = new Set(metPairs(progress).map(pairKey))
    const byLabel = new Map<string, PairGroup>()
    for (const p of minimalPairs()) {
      const g = byLabel.get(p.confusion.label)
        ?? { label: p.confusion.label, why: p.confusion.why, pairs: [] }
      g.pairs.push({ p, met: met.has(pairKey(p)) })
      byLabel.set(p.confusion.label, g)
    }
    const out = [...byLabel.values()]
    for (const g of out) g.pairs.sort((a, b) => Number(b.met) - Number(a.met))
    out.sort((a, b) =>
      Number(b.pairs.some(x => x.met)) - Number(a.pairs.some(x => x.met)))
    return out
  }, [progress])

  const toggle = (label: string): void =>
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label); else next.add(label)
      return next
    })

  return (
    <div className="col page-narrow" style={{ gap: 18 }}>
      <div className="browse-head">
        <div className="h1">🗣️ เสียงและการเน้น</div>
        <div className="browse-sub">
          ภาษาไทยมีโทน ภาษาอังกฤษมีการเน้นเสียง — และมีเสียงอีกหลายตัวที่ปากคนไทยไม่เคยทำ
          หน้านี้รวมไว้ให้กลับมาดูได้ตลอด
        </div>
      </div>

      {/* ── 1 · The sounds Thai does not have ───────────────────────────── */}
      <div className="card card-pad col" style={{ gap: 12 }}>
        <div className="h2">เสียงที่ภาษาไทยไม่มี</div>
        <div className="sec-lead">
          {NEW_SOUNDS.length} เสียงที่ปากคนไทยไม่เคยทำ — แต่ละเสียงบอกว่าต้องวางลิ้นกับริมฝีปากยังไง
          และกับดักที่คนไทยมักตก แตะคำตัวอย่างเพื่อฟัง
        </div>
        {NEW_SOUNDS.map(n => <SoundCard key={n.ipa} note={n} />)}
      </div>

      {/* ── 2 · Finals Thai swallows ────────────────────────────────────── */}
      <div className="card card-pad col" style={{ gap: 12 }}>
        <div className="h2">ตัวสะกดที่คนไทยชอบกลืน</div>
        <div className="sec-lead">
          ภาษาไทยปิดท้ายคำเบาๆ ภาษาอังกฤษปล่อยตัวสะกดทุกตัวให้ได้ยิน — กลืนตัวเดียว
          คำก็กลายเป็นอีกคำ
        </div>
        {FINALS.map(n => <SoundCard key={n.ipa} note={n} />)}
      </div>

      {/* ── 3 · Stress ──────────────────────────────────────────────────── */}
      <div className="card card-pad col" style={{ gap: 12 }}>
        <div className="h2">การเน้นเสียงคือ 'โทน' ของภาษาอังกฤษ</div>
        <div className="sec-lead">
          คนไทยไม่เคยต้องคิดเรื่องพยางค์หนักเบา เพราะทุกพยางค์หนักเท่ากัน —
          ในภาษาอังกฤษ นี่คือสิ่งที่ตัดสินว่าคนฟังจะเข้าใจหรือไม่
        </div>
        {STRESS_RULES.map(r => (
          <div key={r.title} className="stress-rule">
            <div className="stress-title">{r.title}</div>
            <div className="stress-body">{r.body}</div>
            <div className="stress-eg">
              {r.examples.map(e => (
                <div key={e.en} className="stress-eg-row">
                  <Speak text={e.en} size={36} />
                  <div className="stress-eg-text">
                    <span className="stress-eg-en en">{e.en}</span>
                    <span className="stress-eg-note">{e.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── 4 · Minimal pairs ───────────────────────────────────────────── */}
      <div className="card card-pad col" style={{ gap: 12 }}>
        <div className="h2">คู่คำที่หูคนไทยแยกยาก</div>
        <div className="sec-lead">
          คำสองคำที่ต่างกันแค่เสียงเดียว — และเป็นเสียงที่หูคนไทยได้ยินเป็นเสียงเดียวกัน
          ระบบหาให้จากคำในคอร์ส แตะฟังเทียบกันทีละคู่
        </div>
        {groups.length === 0 ? (
          <div className="rule-note" data-testid="pairs-empty">
            เมื่อคุณเรียนคำมากขึ้น คู่คำจะปรากฏที่นี่เอง — ระบบหาให้จากคำที่อยู่ในคอร์ส
          </div>
        ) : groups.map(g => {
          const open = expanded.has(g.label)
          const shown = open ? g.pairs : g.pairs.slice(0, PAIR_PREVIEW)
          const hidden = g.pairs.length - shown.length
          return (
            <div key={g.label} className="pair-group">
              <div className="pair-group-head">
                <div className="pair-group-label">
                  {g.label}<span className="n">{g.pairs.length} คู่</span>
                </div>
                <div className="pair-group-why">{g.why}</div>
              </div>
              {shown.map(({ p, met }) => (
                <div key={pairKey(p)} className={`pair-row ${met ? 'met' : ''}`}>
                  <div className="pair-members">
                    {p.members.map(m => (
                      <div key={m.id} className="pair-member">
                        <Speak text={m.en} size={34} />
                        <div className="pair-text">
                          <div className="pair-en en">{m.en}</div>
                          <div className="pair-reading">{m.reading}</div>
                          <div className="pair-th">{m.th}</div>
                        </div>
                        <span className="ipa-chip phone-chip en">/{m.phone}/</span>
                      </div>
                    ))}
                  </div>
                  {met && <span className="met-tag">✓ คุณเจอทั้งคู่แล้ว</span>}
                </div>
              ))}
              {(hidden > 0 || open) && g.pairs.length > PAIR_PREVIEW && (
                <button className="btn ghost small pair-more" onClick={() => toggle(g.label)}>
                  {open ? 'ย่อ' : `ดูอีก ${hidden} คู่`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* ── 5 · Why bother ──────────────────────────────────────────────── */}
      <div className="card card-pad col" style={{ gap: 10 }}>
        <div className="h2">ทำไมถึงคุ้มที่จะฝึก</div>
        <div className="sec-lead">
          เสียงพวกนี้ไม่ได้มีไว้ให้พูดเพราะ แต่มีไว้ให้คนฟังเข้าใจ —{' '}
          <span className="en">rice</span> กับ <span className="en">lice</span>,{' '}
          <span className="en">think</span> กับ <span className="en">sink</span> ต่างกันแค่ปากขยับนิดเดียว
          ฝึกปากทีละเสียง แล้วทุกคำที่คุณเรียนต่อจากนี้จะออกมาชัดขึ้นเอง
          หน้านี้ไม่ต้องท่อง กลับมาเปิดดูได้ทุกครั้งที่สงสัย
        </div>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <button className="btn big" onClick={() => go('script')}>กลับไปอ่านอังกฤษ</button>
          <button className="btn ghost big" onClick={() => go('review')}>ไปทบทวน</button>
        </div>
      </div>
    </div>
  )
}
