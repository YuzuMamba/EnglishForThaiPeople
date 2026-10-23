import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp, listRescues, stashRescue, snapshotOf, effectiveUnlocked,
  NEW_PER_DAY_RANGE, SESSION_SIZE_RANGE, learnedTodayCount } from '../core/store'
import { devEnabled, setDevEnabled, advanceClock, jumpToLevel, resetAll } from '../core/dev'
import { CURRICULUM, ITEMS, PATTERNS } from '../data'
import { serializeBackup, parseAnyBackup, parseStorageBlob, backupFilename, type BackupSummary } from '../core/backup'
import type { PersistedSnapshot } from '../core/store'
import { diagnose, readMirror, type Diagnosis } from '../core/vault'
import SyncCard from './SyncCard'
import '../styles/settings.css'

// Settings — preferences plus the learner-data lifeline. Progress lives only
// in this browser's localStorage (see CLAUDE.md §2), so export/import IS the
// backup story until a backend exists. Everything here must work in iOS
// Safari: Blob + <a download> for export, <input type=file> and paste for
// import, clipboard writes only inside the tap's own event handler — and
// recovery must never require devtools, because iOS has none.

interface Pending {
  state: PersistedSnapshot
  summary: BackupSummary
  source: string
}

/** The whole course, counted live — words, phrases and patterns the path
 *  hands out against the daily budget. Graphemes are not in it: the phonics
 *  course is self-paced. */
const COURSE_SIZE = Object.keys(ITEMS).length + Object.keys(PATTERNS).length

/** Thai names for the rescue-key labels the store writes (identifiers stay
 *  English in storage; only the display changes). */
const RESCUE_LABELS: Record<string, string> = {
  'import': 'ก่อนนำเข้า',
  'corrupt': 'ข้อมูลเสียหาย',
  'newer': 'จากเวอร์ชันใหม่กว่า',
  'migrate-error': 'ย้ายข้อมูลไม่สำเร็จ',
  'demo-overwrite': 'ก่อนโหลดเดโม',
}

/** An ISO timestamp shows as its date; anything else (e.g. "unknown") as is. */
const dayOf = (iso: string): string => (/^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : iso)

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }): JSX.Element {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={onClick}>
      <span className="knob" />
    </button>
  )
}

export default function Settings(): JSX.Element {
  const st = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err' | 'warn'; text: string } | null>(null)
  // Bumped after anything that writes a rescue key, so the list re-renders.
  const [rescueEpoch, setRescueEpoch] = useState(0)
  const [jumpTo, setJumpTo] = useState(1)
  const [showText, setShowText] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const [devOn, setDevOn] = useState(devEnabled)
  const rescues = useMemo(() => listRescues(), [rescueEpoch])

  // Storage diagnosis is async (IndexedDB), so it lands after first paint.
  const [health, setHealth] = useState<Diagnosis | null>(null)
  useEffect(() => {
    let alive = true
    void diagnose(Object.keys(st.progress).length).then(d => { if (alive) setHealth(d) })
    return () => { alive = false }
  }, [st.progress, rescueEpoch])

  const doExport = (): void => {
    const json = serializeBackup(st)
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = backupFilename()
    document.body.appendChild(a)
    a.click()
    // WebKit can abort a download whose anchor leaves the DOM synchronously,
    // and revoking early races the iOS "Download this file?" sheet — so both
    // tear-downs are deferred well past any human confirm.
    window.setTimeout(() => a.remove(), 1000)
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    setNotice({ kind: 'ok', text: 'ดาวน์โหลดไฟล์สำรองแล้ว เก็บไว้ในที่ปลอดภัย — iCloud Drive ก็ใช้ได้' })
  }

  const doCopy = (): void => {
    if (!navigator.clipboard) {
      setNotice({ kind: 'err', text: 'คลิปบอร์ดใช้ได้เฉพาะบนหน้าเว็บที่ปลอดภัย (https) — ใช้ดาวน์โหลดแทน' })
      return
    }
    navigator.clipboard.writeText(serializeBackup(st)).then(
      () => setNotice({ kind: 'ok', text: 'คัดลอกไฟล์สำรองไปคลิปบอร์ดแล้ว — วางลงในโน้ตหรือไฟล์ได้เลย' }),
      () => setNotice({ kind: 'err', text: 'เข้าถึงคลิปบอร์ดไม่ได้ — ใช้ดาวน์โหลดแทน' }),
    )
  }

  const stage = (parse: () => { state: PersistedSnapshot; summary: BackupSummary }, source: string): void => {
    setNotice(null)
    try {
      setPending({ ...parse(), source })
    } catch (e) {
      setPending(null)
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'อ่านข้อมูลนี้ไม่ได้' })
    }
  }

  const onPickFile = async (file: File | undefined): Promise<void> => {
    if (!file) return
    const text = await file.text()
    stage(() => parseAnyBackup(text), file.name)
    if (fileRef.current) fileRef.current.value = '' // same file re-pickable
  }

  const applyImport = (): void => {
    if (!pending) return
    try {
      try {
        stashRescue('import', localStorage.getItem('chaienglish-v1') ?? '')
      } catch { /* storage unavailable — the import itself still applies in memory */ }
      useApp.setState(pending.state) // persist middleware writes the new blob
      setPending(null)
      setPasteOpen(false)
      setPasteText('')
      setRescueEpoch(n => n + 1)
      setNotice({ kind: 'ok', text: 'กู้คืนความคืบหน้าแล้ว สวนของคุณกลับมาอยู่ตรงที่คุณทิ้งไว้พอดี' })
    } catch (e) {
      // A quota error mid-write must not look like success. Memory may hold
      // the imported data, but the disk write failed — be precise about it.
      setNotice({
        kind: 'err',
        text: `นำเข้าแล้วแต่บันทึกลงเครื่องไม่สำเร็จ (${e instanceof Error ? e.message : 'ที่เก็บข้อมูลมีปัญหา'}) — ข้อมูลจะหายไปเมื่อปิดหน้านี้ ลองเคลียร์พื้นที่เก็บข้อมูลแล้วทำใหม่`,
      })
    }
  }

  const live = snapshotOf(st)
  const liveItems = Object.keys(live.progress).length
  const liveLetters = Object.keys(live.scriptProgress).length
  // Importing a SMALLER backup is almost always the spare-device mistake —
  // say so loudly instead of letting one tap replace a year of intervals.
  const shrink = pending != null &&
    pending.summary.items + pending.summary.letters < liveItems + liveLetters

  return (
    <div className="col page-narrow" style={{ gap: 18 }}>
      <div className="browse-head">
        {/* Five taps reveals the Developer panel. A URL parameter cannot be
            typed inside the artifact viewer or a home-screen app, so the
            gesture is the only trigger available in every context.
            MUST be a real <button>: iOS Safari does not dispatch click events
            to non-interactive elements, so the same handler on a <div> fires
            in Chromium and silently does nothing on an iPhone. */}
        <button
          type="button"
          className="h1 h1-tap"
          aria-label="ตั้งค่า — แตะห้าครั้งเพื่อเปิดเครื่องมือนักพัฒนา"
          onClick={() => {
            const n = tapCount + 1
            setTapCount(n)
            if (n < 5) return
            setTapCount(0)
            const on = setDevEnabled(!devOn)
            setDevOn(on)
            setNotice({
              kind: 'ok',
              text: on ? 'ปลดล็อกเครื่องมือนักพัฒนาแล้ว — ดูแผงที่ด้านล่างสุด' : 'ซ่อนเครื่องมือนักพัฒนาแล้ว',
            })
          }}
        >⚙️ ตั้งค่า</button>
        <div className="browse-sub">
          ปรับการใช้งาน และกุญแจดูแลข้อมูลของคุณเอง
          {tapCount > 0 && tapCount < 5 && !devOn && (
            <span className="faint"> · อีก {5 - tapCount} ครั้ง</span>
          )}
        </div>
      </div>

      <div className="card card-pad col" style={{ gap: 4 }}>
        <div className="h2">ทั่วไป</div>
        <div className="pref-row">
          <div>
            <div className="pref-name">เสียงประกอบ</div>
            <div className="pref-sub">เสียงแตะ เสียงกริ๊ง และแตรฉลองตอนเลื่อนระดับ</div>
          </div>
          <Toggle on={st.settings.sound} onClick={st.toggleSound} label="เสียงประกอบ" />
        </div>
        <div className="pref-row">
          <div>
            <div className="pref-name">คำอ่านภาษาไทย</div>
            <div className="pref-sub">คำอ่านไทยและ IPA ใต้คำอังกฤษ — จะค่อยๆ ซ่อนเองเมื่อคุณจำคำได้และอ่านออก</div>
          </div>
          <Toggle on={st.settings.showReading} onClick={st.toggleReading} label="คำอ่านภาษาไทย" />
        </div>
      </div>

      <div className="card card-pad col" style={{ gap: 4 }}>
        <div className="h2">ความเร็วการเรียน</div>
        <div className="pref-row pref-stack">
          <div>
            <div className="pref-name">คำใหม่ต่อวัน · {st.settings.newPerDay}</div>
            <div className="pref-sub">
              จำนวนเนื้อหาใหม่ที่เส้นทางจะเสนอให้ในแต่ละวัน ค่อยๆ ทยอยมาแทนที่จะมาทีเดียวทั้งระดับ
              ตัวอักษรไม่นับรวม — คอร์สอ่านอังกฤษเรียนตามจังหวะของคุณเอง
              พอตารางเต็มแล้วจะมีทบทวนราวๆ {st.settings.newPerDay * 9} ข้อต่อวัน และใช้เวลาประมาณ{' '}
              {Math.round(COURSE_SIZE / st.settings.newPerDay)} วันจนจบคอร์ส
              {' '}<b>วันนี้เริ่มไปแล้ว {learnedTodayCount(st.progress)} รายการ</b>
            </div>
          </div>
          <input
            className="pace-range"
            type="range"
            min={NEW_PER_DAY_RANGE[0]}
            max={NEW_PER_DAY_RANGE[1]}
            value={st.settings.newPerDay}
            aria-label="คำใหม่ต่อวัน"
            onChange={e => st.setPacing({ newPerDay: Number(e.target.value) })}
          />
        </div>
        <div className="pref-row pref-stack">
          <div>
            <div className="pref-name">จำนวนข้อต่อรอบ · {st.settings.sessionSize}</div>
            <div className="pref-sub">
              จำนวนคำถามต่อรอบทบทวน เรียงจากข้อที่ค้างนานที่สุดก่อน
            </div>
          </div>
          <input
            className="pace-range"
            type="range"
            min={SESSION_SIZE_RANGE[0]}
            max={SESSION_SIZE_RANGE[1]}
            step={5}
            value={st.settings.sessionSize}
            aria-label="จำนวนข้อต่อรอบ"
            onChange={e => st.setPacing({ sessionSize: Number(e.target.value) })}
          />
        </div>
      </div>

      <SyncCard />

      <div className="card card-pad col" style={{ gap: 10 }}>
        <div className="h2">ข้อมูลของคุณ</div>
        <p className="muted data-note">
          ความคืบหน้าถูกเก็บไว้ในเบราว์เซอร์นี้เท่านั้น — ตอนนี้มี {liveItems} รายการ และ {liveLetters} ตัวอักษร
          ถ้าล้างข้อมูลเว็บไซต์ ข้อมูลจะหายไป และ iOS อาจลบทิ้งเองเมื่อพื้นที่เก็บข้อมูลเหลือน้อย
          ดาวน์โหลดไฟล์สำรองไว้เป็นระยะ แล้วนำเข้าเมื่อย้ายไปเครื่องใหม่
        </p>
        <div className="data-actions">
          <button className="btn" onClick={doExport}>⬇️ ดาวน์โหลดไฟล์สำรอง</button>
          <button className="btn ghost" onClick={doCopy}>📋 คัดลอกไปคลิปบอร์ด</button>
          <button className="btn ghost" onClick={() => { setShowText(t => !t); setNotice(null) }}>
            👁️ แสดงข้อความสำรอง
          </button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>⬆️ นำเข้าไฟล์สำรอง…</button>
          <button className="btn ghost" onClick={() => { setPasteOpen(o => !o); setNotice(null) }}>
            📝 วางข้อความสำรอง…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json,text/plain"
            style={{ display: 'none' }}
            onChange={e => void onPickFile(e.target.files?.[0])}
          />
        </div>

        {/* Which build THIS device is running. A phone holding a stale bundle
            and a deploy that never happened look identical from the outside,
            and both have sent us chasing bugs that were already fixed. One
            timestamp settles it in a glance. */}
        <div className="pref-sub build-stamp" data-testid="build-stamp">
          บิลด์ {new Date(__BUILT_AT__).toLocaleString()}
        </div>

        {/* Last-resort export: needs neither a download nor clipboard
            permission, so it still works where both are blocked — inside the
            artifact viewer's sandbox, or on a plain-http LAN address. */}
        {showText && (
          <div className="col" style={{ gap: 6 }}>
            <div className="pref-sub">
              เลือกทั้งหมดแล้วคัดลอกข้อความนี้ไปเก็บไว้ในที่ปลอดภัย
              ใช้ได้แม้ในที่ที่ดาวน์โหลดและคลิปบอร์ดถูกบล็อก
            </div>
            <textarea
              className="paste-box"
              readOnly
              value={serializeBackup(st)}
              onFocus={e => e.currentTarget.select()}
            />
          </div>
        )}

        {pasteOpen && !pending && (
          <div className="col" style={{ gap: 8 }}>
            <textarea
              className="paste-box"
              placeholder="วางไฟล์สำรอง หรือค่า chaienglish-v1 ดิบๆ ที่กู้มาจาก URL อื่น…"
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
            />
            <button
              className="btn"
              style={{ alignSelf: 'flex-start' }}
              disabled={!pasteText.trim()}
              onClick={() => stage(() => parseAnyBackup(pasteText), 'ข้อความที่วาง')}
            >อ่านข้อความที่วาง</button>
          </div>
        )}

        {pending && (
          <div className={`import-confirm ${shrink ? 'danger' : ''}`}>
            <div className="ic-title">
              {shrink ? '⚠️ ไฟล์สำรองนี้มีข้อมูลน้อยกว่าที่คุณมีอยู่ตอนนี้' : 'แทนที่ความคืบหน้าของคุณด้วยไฟล์สำรองนี้?'}
            </div>
            <div className="ic-body">
              <span className="ic-side">ตอนนี้ในเครื่องนี้:</span>{' '}
              {liveItems} รายการ · {liveLetters} ตัวอักษร · {live.xp.toLocaleString()} XP
              <br />
              <span className="ic-side">จาก {pending.source}:</span>{' '}
              {pending.summary.items} รายการ · {pending.summary.letters} ตัวอักษร ·{' '}
              {pending.summary.xp.toLocaleString()} XP · ระดับ {pending.summary.maxUnlocked}
              <br />
              <span className="faint">บันทึกเมื่อ {dayOf(pending.summary.exportedAt)}</span>
              {shrink && (
                <>
                  <br />
                  <b>การนำเข้าจะแทนที่ทั้งหมด — ความคืบหน้าส่วนที่เกินมาในเครื่องนี้จะถูกย้ายไปเก็บเป็น
                  สแนปช็อตกู้คืนด้านล่าง ไม่ได้รวมเข้าด้วยกัน</b>
                </>
              )}
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button className={`btn ${shrink ? '' : 'green'}`} onClick={applyImport}>
                {shrink ? 'แทนที่อยู่ดี' : 'แทนที่เลย'}
              </button>
              <button className={shrink ? 'btn green' : 'btn ghost'} onClick={() => setPending(null)}>ยกเลิก</button>
            </div>
          </div>
        )}

        {notice && <div className={`data-notice ${notice.kind}`}>{notice.text}</div>}

        {/* Storage health. Progress has gone missing three times and the app
            could never say why — an empty localStorage looks identical whether
            Safari evicted it, the site was cleared, or we had a bug. This reads
            canaries from four independent stores and names the cause. */}
        <div className="col" style={{ gap: 6 }}>
          <div className="pref-name" style={{ marginTop: 6 }}>สถานะที่เก็บข้อมูล</div>
          {health ? (
            <>
              {/* Warn tone for anything the learner must ACT on — a private
                  window and an empty installed app both read as "your
                  progress will / did vanish" and must not sit in a green box. */}
              <div className={`data-notice ${health.localStorage === 'unavailable' || health.lostSinceLastSave || health.ephemeral || health.freshInstall ? 'warn' : 'ok'}`}>
                {health.verdict}
              </div>
              <div className="store-grid">
                {([
                  ['ที่เก็บหลัก', health.localStorage],
                  ['สำเนาสำรอง', health.indexedDb],
                  ['เซสชันนี้', health.sessionStorage],
                  ['คุกกี้', health.cookie],
                ] as const).map(([label, state]) => (
                  <div key={label} className={`store-pill s-${state}`}>
                    <b>{label}</b>
                    <span>{state === 'ok' ? 'มีอยู่' : state === 'empty' ? 'ว่าง' : 'ถูกบล็อก'}</span>
                  </div>
                ))}
              </div>
              {health.indexedDb === 'ok' && (
                <button
                  className="btn ghost small"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={async () => {
                    const snap = await readMirror()
                    if (!snap) { setNotice({ kind: 'warn', text: 'ไม่พบสำเนาสำรอง' }); return }
                    // Routed through the same confirm-then-replace flow as a
                    // file import, so restoring from the mirror still stashes
                    // a rescue and still warns if it would shrink progress.
                    stage(() => ({
                      state: snap,
                      summary: {
                        items: Object.keys(snap.progress ?? {}).length,
                        letters: Object.keys(snap.scriptProgress ?? {}).length,
                        xp: snap.xp ?? 0,
                        maxUnlocked: snap.maxUnlocked ?? 1,
                        exportedAt: health?.lastSeen
                          ? new Date(health.lastSeen.t).toISOString()
                          : new Date().toISOString(),
                      },
                    }), 'สำเนาสำรอง')
                  }}
                >กู้คืนจากสำเนาสำรอง</button>
              )}
            </>
          ) : (
            <div className="pref-sub">กำลังตรวจสอบ…</div>
          )}
        </div>

        {rescues.length > 0 && (
          <div className="col" style={{ gap: 6 }}>
            <div className="pref-name" style={{ marginTop: 6 }}>สแนปช็อตกู้คืน</div>
            <div className="pref-sub">
              บันทึกให้อัตโนมัติก่อนการนำเข้าทุกครั้ง และทุกครั้งที่ข้อมูลที่เก็บไว้ดูผิดปกติ
            </div>
            {rescues.map(r => {
              let line = 'สแนปช็อตอ่านไม่ได้'
              try {
                const s = parseStorageBlob(r.raw, r.time).summary
                line = `${s.items} รายการ · ${s.letters} ตัวอักษร · ${s.xp.toLocaleString()} XP`
              } catch { /* leave the label */ }
              return (
                <div key={r.key} className="rescue-row">
                  <div>
                    <div className="rescue-when">
                      {new Date(r.time).toLocaleString()} <span className="faint">({RESCUE_LABELS[r.label] ?? r.label})</span>
                    </div>
                    <div className="rescue-what">{line}</div>
                  </div>
                  <button
                    className="btn ghost small"
                    onClick={() => stage(() => parseStorageBlob(r.raw, r.time), 'สแนปช็อตกู้คืน')}
                  >กู้คืน</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {devOn && (
        <div className="card card-pad col dev-card" style={{ gap: 10 }}>
          <div className="h2">🛠️ นักพัฒนา</div>
          <div className="pref-sub">
            แตะหัวข้อ “ตั้งค่า” ห้าครั้งเพื่อซ่อนอีกครั้ง ปลดล็อกถึงระดับ {effectiveUnlocked(st)} ·{' '}
            {liveItems} รายการ · {liveLetters} ตัวอักษร
          </div>

          <div className="pref-name" style={{ marginTop: 4 }}>เลื่อนเวลาไปข้างหน้า</div>
          <div className="pref-sub">
            ขยับกำหนดทบทวนของทุกรายการให้เร็วขึ้น จนถึงเวลาทบทวนตอนนี้ ไม่ได้แต่งเติมความรู้ให้ —
            คุณยังต้องตอบเองทุกข้อ
          </div>
          <div className="data-actions">
            {[['+1 ชม.', 1], ['+4 ชม.', 4], ['+1 วัน', 24], ['+3 วัน', 72], ['+1 สัปดาห์', 168]].map(([label, h]) => (
              <button
                key={label as string}
                className="btn ghost"
                onClick={() => {
                  stashRescue('import', localStorage.getItem('chaienglish-v1') ?? '')
                  advanceClock(h as number)
                  setRescueEpoch(n => n + 1)
                  setNotice({ kind: 'ok', text: `เลื่อนเวลาไป ${label} แล้ว ลองดูหน้าทบทวน` })
                }}
              >{label as string}</button>
            ))}
          </div>

          <div className="pref-name" style={{ marginTop: 8 }}>ข้ามไประดับ</div>
          <div className="pref-sub">
            ⚠️ สร้างประวัติการทบทวนสมมติให้ทุกระดับก่อนหน้า ที่ระดับเกณฑ์ปลดล็อก (ออกดอก) ไม่สูงกว่านั้น
            พร้อมช่วงเว้นแรกสั้นๆ ให้ระบบทดสอบใหม่ทั้งหมดภายในหนึ่งวัน ความคืบหน้าจริงไม่ถูกเขียนทับ
            ด่านอ่านอังกฤษก็ถูกปลดให้ด้วย ไม่อย่างนั้นประตูจะยังปิดระดับนั้นอยู่
          </div>
          <div className="data-actions" style={{ alignItems: 'center' }}>
            <input
              className="dev-num"
              type="number"
              min={1}
              max={CURRICULUM.length}
              value={jumpTo}
              onChange={e => setJumpTo(Math.max(1, Math.min(CURRICULUM.length, Number(e.target.value) || 1)))}
            />
            <button
              className="btn"
              onClick={() => {
                stashRescue('import', localStorage.getItem('chaienglish-v1') ?? '')
                const r = jumpToLevel(jumpTo)
                setRescueEpoch(n => n + 1)
                setNotice({
                  kind: r.unlocked >= jumpTo ? 'ok' : 'err',
                  text: `สร้างข้อมูล ${r.itemsSeeded} รายการ + ${r.lettersSeeded} ตัวอักษร — ปลดล็อกถึงระดับ ${r.unlocked} แล้ว` +
                    (r.unlocked < jumpTo ? ` (ยังไม่ถึง ${jumpTo}: กฎของด่านยังบังคับใช้อยู่)` : ''),
                })
              }}
            >ข้ามไประดับ {jumpTo}</button>
            <button
              className="btn ghost"
              onClick={() => {
                stashRescue('import', localStorage.getItem('chaienglish-v1') ?? '')
                resetAll()
                setRescueEpoch(n => n + 1)
                setNotice({ kind: 'ok', text: 'รีเซ็ตเป็นเครื่องใหม่แล้ว — สถานะก่อนหน้าอยู่ในสแนปช็อตด้านบน' })
              }}
            >รีเซ็ตความคืบหน้าทั้งหมด</button>
          </div>
          <div className="pref-sub">
            ทุกปุ่มในนี้จะเก็บสแนปช็อตกู้คืนไว้ก่อนเสมอ จึงย้อนกลับได้จากด้านบน
          </div>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'center', padding: '4px 0 8px' }}>
        <button className="btn big" onClick={() => st.go('home')}>กลับหน้าหลัก</button>
      </div>
    </div>
  )
}
