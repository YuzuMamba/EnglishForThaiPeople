import '../styles/home.css'
import { useMemo } from 'react'
import {
  useApp, dueReviewIds, dueScriptIds, effectiveUnlocked, unlearnedIds,
  gatedCharCount, SCRIPT_GATES, learningFrontier, newBudgetRemaining,
} from '../core/store'
import { CURRICULUM, ITEMS } from '../data'
import { SRS_STAGE_NAMES } from '../core/types'
import type { SrsStage } from '../core/types'
import { stageColor } from '../core/srs'

/** Plant ladder for the 10 SRS stages: Seedling → Burned. */
const STAGE_PLANTS = ['🌰', '🌱', '🌿', '🪴', '🌸', '🌳', '🌲', '🏵️', '🌟', '🔥'] as const

function timeGreeting(hour: number): string {
  if (hour < 6) return 'ตื่นเช้าจัง'
  if (hour < 12) return 'อรุณสวัสดิ์'
  if (hour < 18) return 'สวัสดีตอนบ่าย'
  return 'สวัสดีตอนเย็น'
}

export default function Home(): JSX.Element {
  const st = useApp()
  // Words, patterns and letters all sit in the same review session.
  const due = useMemo(
    () => dueReviewIds(st.progress).length + dueScriptIds(st.scriptProgress).length,
    [st.progress, st.scriptProgress],
  )
  const unlocked = useMemo(
    () => effectiveUnlocked(st),
    [st.progress, st.scriptProgress, st.maxUnlocked],
  )
  const retainedChars = gatedCharCount(st.scriptProgress)
  const learnedCount = Object.keys(st.progress).length
  const burnedCount = Object.values(st.progress).filter(p => p.stage >= 7).length

  const stageCounts = useMemo(() => {
    const counts = SRS_STAGE_NAMES.map(() => 0)
    for (const p of Object.values(st.progress)) counts[p.stage]++
    return counts
  }, [st.progress])

  // Growth ladder = stages 0–8; Burned (9) is retirement, shown apart.
  const LADDER_STAGES = 9
  const retiredCount = stageCounts[9]
  const lastAlive = stageCounts.slice(0, LADDER_STAGES).reduce((acc, c, s) => (c > 0 ? s : acc), -1)
  // Fold the trailing run of all-zero stages into one strip (only worth it for 2+).
  const trailingZeros = LADDER_STAGES - (lastAlive + 1)
  const gardenVisible = trailingZeros >= 2 ? lastAlive + 1 : LADDER_STAGES

  // Learning may run one level ahead of the unlock gate (see learningFrontier).
  const frontier = useMemo(
    () => learningFrontier(st),
    [st.progress, st.scriptProgress, st.maxUnlocked],
  )
  const budgetLeft = newBudgetRemaining(st)
  const shown = Math.max(unlocked, frontier)
  const unlockedLevels = CURRICULUM.filter(lv => lv.n <= shown)
  const lockedLevels = CURRICULUM.filter(lv => lv.n > shown)
  const nextLocked = lockedLevels[0]
  const restLocked = lockedLevels.slice(1)

  return (
    <div className="col page-narrow" style={{ gap: 22 }}>
      {/* Header hero */}
      <div className="spread" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="h1 home-hello">
            <span className="en">Hello!</span>
            <span className="boba" aria-hidden>🧋</span>
            <span className="hello-sub">
              {timeGreeting(new Date().getHours())}{learnedCount > 0 ? ', ยินดีต้อนรับกลับมา' : ' — พร้อมเริ่มไหม?'}
            </span>
          </div>
          <div className="muted" style={{ marginTop: 4, fontWeight: 700 }}>
            {learnedCount > 0
              ? <>ภาษาอังกฤษของคุณกำลังงอกงาม — มี {learnedCount} ต้นกำลังโตอยู่ในสวน</>
              : <>เรียนคำแรกๆ ด้านล่างนี้ แล้วสวนของคุณจะเริ่มงอกงาม</>}
          </div>
        </div>
        <div className="statbar">
          <button
            className="icon-btn gear-btn"
            aria-label="ตั้งค่า"
            title="ตั้งค่า"
            onClick={() => st.go('settings')}
          >⚙️</button>
          <div className="stat-chip flame"><span style={{ fontSize: 20 }}>🔥</span><div><div className="n">{st.streakDays}</div><div className="lbl">วันติดต่อกัน</div></div></div>
          <div className="stat-chip"><span style={{ fontSize: 20 }}>⚡</span><div><div className="n">{st.xp.toLocaleString()}</div><div className="lbl">XP</div></div></div>
          {burnedCount > 0 ? (
            <div className="stat-chip"><span style={{ fontSize: 20 }}>🏵️</span><div><div className="n">{burnedCount}</div><div className="lbl">ทอง</div></div></div>
          ) : (
            <div className="stat-chip goal-chip"><span style={{ fontSize: 20 }} aria-hidden>🏵️</span><div><div className="goal-title">ทองดอกแรก</div><div className="lbl">ที่ขั้น 8</div></div></div>
          )}
        </div>
      </div>

      {/* Review CTA */}
      {due > 0 && (
        <div className="card card-pad spread cta-card" style={{
          background: 'linear-gradient(135deg, rgba(255,138,61,0.22), rgba(255,201,77,0.08))',
          borderColor: 'rgba(255,138,61,0.4)',
        }}>
          <div className="row" style={{ gap: 16 }}>
            <span style={{ fontSize: 38 }}>🌱</span>
            <div>
              <div className="h2">ถึงเวลาทบทวน {due} ข้อแล้ว</div>
              <div className="muted" style={{ fontWeight: 700 }}>รดน้ำสวนก่อนจะเหี่ยว — การทบทวนแบบเว้นระยะคือหัวใจของทั้งหมด</div>
            </div>
          </div>
          <button className="btn big" onClick={() => st.go('review')}>เริ่มทบทวน</button>
        </div>
      )}

      {/* Level path */}
      <div className="col" style={{ gap: 14 }}>
        <div className="h2">เส้นทางของคุณ</div>

        {unlockedLevels.map(lv => {
          const ids = lv.itemIds.concat(lv.patternIds)
          const started = ids.filter(id => st.progress[id]).length
          const passed = ids.filter(id => (st.progress[id]?.stage ?? 0) >= 4).length
          const fresh = Math.min(unlearnedIds(st.progress, lv.n).length, budgetLeft)
          const freshTotal = unlearnedIds(st.progress, lv.n).length
          const ahead = lv.n > unlocked
          const pct = Math.round((passed / ids.length) * 100)
          const preview = lv.itemIds.slice(0, 3).map(id => ITEMS[id]).filter(Boolean)
          return (
            <div key={lv.n} className={`card lv-card${ahead ? ' lv-ahead' : ''}`}>
              <div className="lv-grid">
                <div className="lv-tile">{lv.icon}</div>
                <div>
                  <div className="h2">
                    ระดับ {lv.n} · {lv.title}
                    <span className="en muted small" style={{ fontWeight: 700, marginLeft: 8 }}>{lv.titleEn}</span>
                  </div>
                  <div className="muted lv-sub">{lv.subtitle}</div>
                  <div className="row small faint lv-caption">
                    <span>เรียนแล้ว {started}/{ids.length}</span>
                    <span>·</span>
                    <span>แม่นแล้ว {pct}%</span>
                  </div>
                  <div className="pbar lv-pbar">
                    <i style={{ width: `${Math.max(2, pct)}%` }} />
                  </div>
                  {ahead && (
                    <div className="ahead-note">
                      ✨ กำลังเรียนล่วงหน้า — ระดับ {lv.n} จะเปิดเต็มที่เมื่อระดับ {lv.n - 1} แม่นแล้ว
                    </div>
                  )}
                  {freshTotal > 0 && fresh === 0 && (
                    <div className="budget-note">
                      วันนี้เรียนใหม่ครบ {st.settings.newPerDay} คำแล้ว — พรุ่งนี้มีอีก {freshTotal} คำรอคุณอยู่ที่นี่
                    </div>
                  )}
                </div>
                <div className="lv-side">
                  <div className="lv-chips">
                    {preview.map(it => (
                      <span key={it.id} className="lv-chip en">{it.en}</span>
                    ))}
                  </div>
                  {fresh > 0
                    ? <button className="btn" onClick={() => st.openLevel(lv.n)}>เรียนใหม่ {fresh} คำ</button>
                    : pct >= 100
                      ? <button className="btn ghost" onClick={() => st.openLevel(lv.n)}>ทบทวนบทเรียน</button>
                      : <button className="btn" onClick={() => st.openLevel(lv.n)}>เรียนต่อ</button>}
                </div>
              </div>
            </div>
          )
        })}

        {/* Next level up: a teaser, not a tombstone. At a reading checkpoint it
            becomes a two-line requirement list, so a learner who has skipped
            the phonics course can see exactly what is holding the door. */}
        {nextLocked && (() => {
          const need = SCRIPT_GATES[nextLocked.n] ?? 0
          const prev = CURRICULUM.find(l => l.n === nextLocked.n - 1)
          const prevIds = prev ? prev.itemIds.concat(prev.patternIds) : []
          const prevPct = prevIds.length
            ? Math.round((prevIds.filter(id => (st.progress[id]?.stage ?? 0) >= 4).length / prevIds.length) * 100)
            : 0
          const prevMet = prevPct >= 80
          const readMet = retainedChars >= need
          return (
            <div className="card lv-card lv-teaser">
              <div className="lv-grid">
                <div className="lv-tile lv-tile-locked">
                  <span className="lv-tile-emoji">{nextLocked.icon}</span>
                  <span className="lock-badge" aria-label="ล็อก">🔒</span>
                </div>
                <div>
                  <div className="h2">
                    ระดับ {nextLocked.n} · {nextLocked.title}
                    <span className="en muted small" style={{ fontWeight: 700, marginLeft: 8 }}>{nextLocked.titleEn}</span>
                  </div>
                  <div className="muted lv-sub">{nextLocked.subtitle}</div>
                  {need > 0 ? (
                    <div className="gate-reqs">
                      <div className="gate-title">🔤 ด่านการอ่าน</div>
                      <div className={`gate-req ${prevMet ? 'met' : ''}`}>
                        <span className="tick" aria-hidden>{prevMet ? '✓' : '○'}</span>
                        ระดับ {nextLocked.n - 1} แม่นแล้ว
                        <span className="gate-num">{prevPct}% / 80%</span>
                      </div>
                      <div className={`gate-req ${readMet ? 'met' : ''}`}>
                        <span className="tick" aria-hidden>{readMet ? '✓' : '○'}</span>
                        ตัวอักษรที่จำได้
                        <span className="gate-num">{retainedChars} / {need}</span>
                      </div>
                      {!readMet && (
                        <button className="btn ghost small gate-cta" onClick={() => st.go('script')}>
                          🔤 ไปที่ อ่านอังกฤษ — อีก {need - retainedChars} ตัว
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="unlock-hint">✨ จบระดับ {nextLocked.n - 1} เพื่อปลดล็อก</div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Everything further out: one slim line each */}
        {restLocked.length > 0 && (
          <div className="card locked-list">
            {restLocked.map(lv => (
              <div key={lv.n} className="locked-row">
                <span className="ic" aria-hidden>{lv.icon}</span>
                <span className="ttl">ระดับ {lv.n} · {lv.title}</span>
                <span className="meta">
                  {SCRIPT_GATES[lv.n]
                    ? <span className="gate-tag" title={`ด่านการอ่าน: ${SCRIPT_GATES[lv.n]} ตัวอักษร`}>🔤 {SCRIPT_GATES[lv.n]} ตัวอักษร</span>
                    : `${lv.itemIds.length} คำ`}
                </span>
                <span className="lk" aria-label="ล็อก">🔒</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SRS garden — the growth ladder covers stages 0–8 (Seedling → Evergreen).
          Burned is retirement, not a milestone, so it lives outside the ladder. */}
      <div className="card card-pad col">
        <div className="spread">
          <div className="h2">สวนของคุณ</div>
          {learnedCount > 0 && <div className="small faint" style={{ fontWeight: 800 }}>{learnedCount} ต้น</div>}
        </div>
        {learnedCount === 0 ? (
          <div className="garden-empty">
            <span className="ge-art" aria-hidden>🌱</span>
            <div className="h2">ปลูกคำแรกของคุณ</div>
            <div className="muted" style={{ fontWeight: 700, maxWidth: 380 }}>
              เรียนสักสองสามคำในระดับ 1 แล้วมาดูมันโตที่นี่
              ตั้งแต่เมล็ดไปจนถึงทอง
            </div>
            <button className="btn" onClick={() => st.openLevel(1)}>เรียนคำแรกของคุณ</button>
          </div>
        ) : (
          <>
            <div className="muted small" style={{ fontWeight: 700 }}>
              ทุกคำจะโตจากเมล็ดไปจนถึงทอง เมื่อคุณพิสูจน์ว่ายังจำได้
            </div>
            <div className="garden-row">
              {SRS_STAGE_NAMES.slice(0, gardenVisible).map((name, stage) => {
                const count = stageCounts[stage]
                const has = count > 0
                return (
                  <div key={name} className={`g-stage${has ? '' : ' empty'}`}>
                    <span className="g-plant" style={{ fontSize: has ? Math.min(40, 22 + count * 2.5) : 15 }} aria-hidden>
                      {STAGE_PLANTS[stage]}
                    </span>
                    <span className="g-soil" aria-hidden />
                    <span className="g-count" style={has ? { color: stageColor(stage as SrsStage) } : undefined}>{count}</span>
                    <span className="g-name">{name}</span>
                  </div>
                )
              })}
              {gardenVisible < LADDER_STAGES && (
                <div className="g-fold">
                  <span className="g-fold-plants" aria-hidden>
                    {STAGE_PLANTS.slice(gardenVisible, Math.min(gardenVisible + 3, LADDER_STAGES)).join(' ')}
                  </span>
                  <span>อีก {LADDER_STAGES - gardenVisible} ขั้นที่รอให้โต</span>
                </div>
              )}
            </div>
            {retiredCount > 0 && (
              <div className="g-retired">
                <span aria-hidden>🔥</span>
                <span>เกษียณแล้ว: {retiredCount}</span>
                <span className="faint">— ฝังใจจนไม่ต้องทบทวนอีก</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
