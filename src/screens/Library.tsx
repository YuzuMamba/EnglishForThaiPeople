import { useMemo, useState } from 'react'
import { useApp } from '../core/store'
import { CURRICULUM, ITEMS, PATTERNS, patternAsItem } from '../data'
import type { LexItem } from '../core/types'
import { SRS_STAGE_NAMES } from '../core/types'
import { stageColor } from '../core/srs'
import Speak from '../components/Speak'
import '../styles/browse.css'

// Library — everything you've planted, browsable and searchable. Grouped by
// curriculum level under sticky headers; filterable by level and mastery.
// Each level lists its words AND its sentence patterns (✨ rows), so the
// header counts line up with Home's "learned / total" captions.

/** Stage at which an item counts as "mastered" (mastery() saturates at 5). */
const MASTERED_STAGE = 5

type MasteryFilter = 'all' | 'learning' | 'mastered'

const MASTERY_CHIPS: { id: MasteryFilter; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'learning', label: 'กำลังเรียน' },
  { id: 'mastered', label: 'แม่นแล้ว' },
]

/** Matches the English (case-insensitively), the Thai reading, or any Thai gloss. */
function matchesQuery(it: LexItem, needle: string): boolean {
  return (
    !needle ||
    it.en.toLowerCase().includes(needle) ||
    it.reading.includes(needle) ||
    it.th.includes(needle) ||
    (it.altTh ?? []).some(a => a.includes(needle))
  )
}

export default function Library(): JSX.Element {
  const st = useApp()
  const [q, setQ] = useState('')
  const [lvl, setLvl] = useState<number | 'all'>('all')
  const [mastery, setMastery] = useState<MasteryFilter>('all')
  // Per-level "peek" state for levels the learner hasn't started yet.
  const [peeked, setPeeked] = useState<Record<number, boolean>>({})

  const totalWords = Object.keys(ITEMS).length

  const sections = useMemo(() => {
    const needle = q.toLowerCase().trim()
    return CURRICULUM
      .filter(lv => lvl === 'all' || lv.n === lvl)
      .map(lv => {
        // Words first, then the level's sentence patterns as pseudo-items —
        // the same id set Home counts, so totals match across screens.
        const inLevel = lv.itemIds
          .map(id => ITEMS[id])
          .filter((it): it is LexItem => !!it)
          .concat(
            lv.patternIds
              .map(id => PATTERNS[id])
              .filter(p => !!p)
              .map(patternAsItem),
          )
        const items = inLevel.filter(it => {
          if (!matchesQuery(it, needle)) return false
          const p = st.progress[it.id]
          if (mastery === 'learning') return !!p && p.stage < MASTERED_STAGE
          if (mastery === 'mastered') return !!p && p.stage >= MASTERED_STAGE
          return true
        })
        const learned = inLevel.filter(it => st.progress[it.id]).length
        return { lv, items, total: inLevel.length, learned, searching: needle !== '' }
      })
      .filter(s => s.items.length > 0)
  }, [q, lvl, mastery, st.progress])

  const clearFilters = (): void => { setQ(''); setLvl('all'); setMastery('all') }

  return (
    <div className="col page-narrow" style={{ gap: 18 }}>
      <div className="browse-head">
        <div className="h1">📚 คลังคำ</div>
        <div className="browse-sub">
          ทุกคำที่คุณจะได้เจอบนเส้นทางนี้ — {totalWords} คำ ใน {CURRICULUM.length} ระดับ
          แตะลำโพงเพื่อฟังเสียง
        </div>
      </div>

      <div className="lib-search">
        <span className="mag" aria-hidden>🔍</span>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="ค้นหาคำ…"
          aria-label="ค้นหาคำ"
        />
      </div>

      <div className="col" style={{ gap: 8 }}>
        <div className="fchips">
          <span className="flabel">ระดับ</span>
          <button className={`fchip ${lvl === 'all' ? 'on' : ''}`} onClick={() => setLvl('all')}>ทั้งหมด</button>
          {CURRICULUM.map(lv => (
            <button
              key={lv.n}
              className={`fchip ${lvl === lv.n ? 'on' : ''}`}
              onClick={() => setLvl(lvl === lv.n ? 'all' : lv.n)}
            >
              {lv.n}
            </button>
          ))}
        </div>
        <div className="fchips">
          <span className="flabel">ความแม่น</span>
          {MASTERY_CHIPS.map(m => (
            <button
              key={m.id}
              className={`fchip ${mastery === m.id ? 'on' : ''}`}
              onClick={() => setMastery(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {sections.length === 0 && (
        <div className="card lib-empty">
          <div className="big" aria-hidden>🫖</div>
          <div>ยังไม่มีอะไรชงอยู่ตรงนี้ — ไม่มีคำที่ตรงกับตัวกรอง</div>
          <button className="btn ghost small" style={{ marginTop: 14 }} onClick={clearFilters}>
            ล้างการค้นหาและตัวกรอง
          </button>
        </div>
      )}

      {sections.map(({ lv, items, total, learned, searching }) => {
        // A level the learner hasn't touched at all is a wall of "ยังไม่เรียน" —
        // fold it into one summary row until they ask to peek. Searching
        // always shows matches so results never hide behind the fold.
        if (learned === 0 && !searching && !peeked[lv.n]) {
          return (
            <button
              key={lv.n}
              className="card lib-locked"
              onClick={() => setPeeked(p => ({ ...p, [lv.n]: true }))}
            >
              <span className="lock-ico" aria-hidden>{lv.icon ?? '🌱'}</span>
              <span className="lock-text">
                <b>ระดับ {lv.n}</b> · {lv.title} — รอคุณอยู่ {total} คำ
              </span>
              <span className="lock-cta">แตะเพื่อดู</span>
            </button>
          )
        }
        return (
          <div key={lv.n} className="col" style={{ gap: 8 }}>
            <div className="lib-section-head">
              <div className="inner">
                <span className="lvl-n">ระดับ {lv.n}</span>
                <span>· {lv.title}</span>
                <span className="lvl-count">{items.length}/{total}</span>
              </div>
            </div>
            <div className="lib-rows">
              {items.map(it => {
                const p = st.progress[it.id]
                const c = p ? stageColor(p.stage) : ''
                const isPattern = it.type === 'pattern'
                return (
                  <div key={it.id} className="card lib-row">
                    {isPattern
                      ? <span className="pat-ico" title="แพตเทิร์นประโยค" aria-label="แพตเทิร์นประโยค">✨</span>
                      : <Speak text={it.audioHint ?? it.en} size={44} />}
                    <div className="word">
                      <div className="line1">
                        <span className="w-en en">{it.en}</span>
                        <span className="w-reading">{it.reading}</span>
                      </div>
                      <div className="line2">
                        <span className="w-en">{it.th}</span>
                        <span className="lib-meta">
                          <span className="lvl-tag">ระดับ {it.level}</span>
                          {p ? (
                            <span
                              className="stage-badge"
                              style={{ background: `${c}1f`, borderColor: `${c}55`, color: c }}
                            >
                              {SRS_STAGE_NAMES[p.stage]}
                            </span>
                          ) : (
                            <span className="stage-badge none">ยังไม่เรียน</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
