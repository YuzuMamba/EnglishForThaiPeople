import { useEffect, useState } from 'react'
import { useApp, snapshotOf, stashRescue } from '../core/store'
import {
  syncConfigured, credentialProblem, loadSession, signIn, signUp, signOut, syncNow,
  type Session,
} from '../core/sync'

// The account-sync card in Settings.
//
// Three rules this UI has to hold to, all of them learned the hard way:
//   · Signing in must never be a prerequisite for studying. The card is
//     skippable and the app is fully usable signed out.
//   · A sync stashes a rescue snapshot before it applies anything, exactly as
//     an import does, so even a merge bug is reversible from this same screen.
//   · Errors say what failed and what the learner still has. "Sync failed" with
//     no more detail is how someone concludes their progress is gone.

const LAST_SYNC_KEY = 'chaienglish-last-sync'

/** Appended to any failure that does not already say the device is safe.
 *  The regex below recognises both this Thai and sync.ts's English wording,
 *  so the reassurance is never doubled whichever language the error came in. */
const UNTOUCHED = 'ความคืบหน้าในเครื่องนี้ยังอยู่ครบ'
const SAYS_UNTOUCHED = /untouched|ยังอยู่ครบ/i

const readLastSync = (): number | null => {
  try {
    const v = Number(localStorage.getItem(LAST_SYNC_KEY))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch { return null }
}
const writeLastSync = (t: number): void => {
  try { localStorage.setItem(LAST_SYNC_KEY, String(t)) } catch { /* unavailable */ }
}

export default function SyncCard(): JSX.Element | null {
  const st = useApp()
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ kind: 'ok' | 'err' | 'warn'; text: string } | null>(null)
  const [lastSync, setLastSync] = useState<number | null>(readLastSync)

  // Sync once on mount when already signed in, so opening the app on a second
  // device pulls without anyone having to remember to press a button.
  useEffect(() => {
    if (session) void run(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!syncConfigured()) return null

  // A misconfigured credential must never be quietly used. The service_role
  // case in particular WORKS — that is exactly what makes it dangerous — so the
  // only safe response is to refuse before a single request goes out.
  const badCredential = credentialProblem()
  if (badCredential) {
    return (
      <div className="card card-pad col" style={{ gap: 10 }}>
        <div className="h2">☁️ ซิงก์บัญชี</div>
        <div className="data-notice sync-notice err">{badCredential}</div>
      </div>
    )
  }

  async function run(quiet = false): Promise<void> {
    setBusy(true)
    if (!quiet) setNote(null)
    try {
      const local = snapshotOf(useApp.getState())
      const res = await syncNow(local)
      // Same safety net as an import: the pre-merge state stays restorable.
      if (res.gained || res.advanced) {
        try { stashRescue('import', localStorage.getItem('chaienglish-v1') ?? '') } catch { /* best effort */ }
      }
      useApp.setState(res.merged)
      const now = Date.now()
      writeLastSync(now)
      setLastSync(now)
      setNote({
        kind: 'ok',
        text: res.firstPush
          ? 'บันทึกความคืบหน้าไว้ในบัญชีของคุณแล้ว เข้าสู่ระบบบนเครื่องอื่นเพื่อเรียนต่อจากจุดเดิมได้เลย'
          : res.gained || res.advanced
            ? `ซิงก์แล้ว — ได้มาใหม่ ${res.gained} รายการ และอัปเดต ${res.advanced} รายการจากเครื่องอื่นของคุณ`
            : 'ซิงก์แล้ว ทุกอย่างเป็นปัจจุบันอยู่แล้ว',
      })
    } catch (e) {
      // Every sync failure has to say the device is unaffected, or it reads as
      // data loss. Some errors say it themselves, in their own words — don't
      // bolt a second copy onto those.
      const msg = e instanceof Error ? e.message : 'ซิงก์ไม่สำเร็จ'
      setNote({
        kind: 'err',
        text: SAYS_UNTOUCHED.test(msg) ? msg : `${msg} — ${UNTOUCHED}`,
      })
    } finally {
      setBusy(false)
    }
  }

  const doAuth = async (): Promise<void> => {
    setBusy(true)
    setNote(null)
    try {
      if (mode === 'up') {
        const { needsConfirm } = await signUp(email.trim(), password)
        if (needsConfirm) {
          setNote({ kind: 'warn', text: 'เช็กอีเมลเพื่อยืนยันบัญชีก่อน แล้วค่อยกลับมาเข้าสู่ระบบ' })
          setMode('in')
          return
        }
      } else {
        await signIn(email.trim(), password)
      }
      setSession(loadSession())
      setPassword('')
      await run()
    } catch (e) {
      // Same rule as a failed sync: never let an error imply the learner lost
      // something. Signing in is the moment someone is most primed to read a
      // failure as "my progress is gone".
      const msg = e instanceof Error ? e.message : 'เข้าสู่ระบบไม่สำเร็จ'
      setNote({
        kind: 'err',
        text: SAYS_UNTOUCHED.test(msg) ? msg : `${msg} — ${UNTOUCHED}`,
      })
    } finally {
      setBusy(false)
    }
  }

  const doSignOut = async (): Promise<void> => {
    await signOut()
    setSession(null)
    setNote({
      kind: 'ok',
      text: 'ออกจากระบบแล้ว ความคืบหน้ายังอยู่ในเครื่องนี้ — ไม่มีอะไรถูกลบ',
    })
  }

  return (
    <div className="card card-pad col" style={{ gap: 10 }}>
      <div className="h2">☁️ ซิงก์บัญชี</div>

      {session ? (
        <>
          <p className="muted data-note">
            เข้าสู่ระบบในชื่อ <b>{session.email}</b>
            {lastSync
              ? <> · ซิงก์ล่าสุด {new Date(lastSync).toLocaleString()}</>
              : <> · ยังไม่ได้ซิงก์บนเครื่องนี้</>}
            {' '}ความคืบหน้าจะรวมกันทีละรายการ เรียนบนสองเครื่องจึงไม่มีทางเขียนทับกัน
          </p>
          <div className="data-actions">
            <button className="btn" disabled={busy} onClick={() => void run()}>
              {busy ? '… กำลังซิงก์' : '🔄 ซิงก์ตอนนี้'}
            </button>
            <button className="btn ghost" disabled={busy} onClick={() => void doSignOut()}>
              ออกจากระบบ
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="muted data-note">
            ไม่บังคับ บัญชีช่วยให้ความคืบหน้าตามคุณไปทุกเครื่อง และยังอยู่แม้ล้างข้อมูลเบราว์เซอร์นี้ —
            สิ่งเดียวที่ไฟล์สำรองในเครื่องทำเองไม่ได้ ไม่เข้าสู่ระบบก็ใช้ได้ครบทุกอย่าง
          </p>
          <div className="col" style={{ gap: 8 }}>
            <input
              className="sync-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              className="sync-input"
              type="password"
              autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
              placeholder="รหัสผ่าน"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className="data-actions">
            <button className="btn" disabled={busy || !email || !password} onClick={() => void doAuth()}>
              {busy ? '…' : mode === 'up' ? 'สมัครบัญชี' : 'เข้าสู่ระบบ'}
            </button>
            <button
              className="btn ghost"
              disabled={busy}
              onClick={() => { setMode(m => (m === 'in' ? 'up' : 'in')); setNote(null) }}
            >
              {mode === 'in' ? 'สมัครบัญชีใหม่' : 'มีบัญชีอยู่แล้ว'}
            </button>
          </div>
        </>
      )}

      {note && <div className={`data-notice sync-notice ${note.kind}`}>{note.text}</div>}
    </div>
  )
}
