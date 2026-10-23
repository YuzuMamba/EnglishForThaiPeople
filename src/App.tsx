import { useEffect, useMemo, useState } from 'react'
import Background from './three/Background'
import { useApp, dueReviewIds, dueScriptIds, type Screen } from './core/store'
import { sfx } from './core/audio'
import Home from './screens/Home'
import Lesson from './screens/Lesson'
import Review from './screens/Review'
import Builder from './screens/Builder'
import Listening from './screens/Listening'
import Script from './screens/Script'
import Sounds from './screens/Sounds'
import { persistenceBlocked, looksEphemeral, isStandalone } from './core/vault'
import './styles/settings.css'
import Library from './screens/Library'
import About from './screens/About'
import Settings from './screens/Settings'

const NAV: { id: Screen; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'หน้าหลัก' },
  { id: 'review', icon: '🔁', label: 'ทบทวน' },
  { id: 'builder', icon: '🧱', label: 'สร้างประโยค' },
  { id: 'listening', icon: '🎧', label: 'ห้องฟัง' },
  { id: 'script', icon: '🔤', label: 'อ่านอังกฤษ' },
  { id: 'library', icon: '📚', label: 'คลังคำ' },
  { id: 'about', icon: '💡', label: 'เกี่ยวกับ' },
]

export default function App(): JSX.Element {
  const screen = useApp(s => s.screen)
  const go = useApp(s => s.go)
  const progress = useApp(s => s.progress)
  const scriptProgress = useApp(s => s.scriptProgress)
  const sound = useApp(s => s.settings.sound)
  // One badge for one queue: words, patterns and graphemes all review here.
  const due = useMemo(
    () => dueReviewIds(progress).length + dueScriptIds(scriptProgress).length,
    [progress, scriptProgress, screen],
  )

  const focus = screen === 'lesson' || screen === 'review'

  // If the browser refuses local storage, the app still LOOKS like it works —
  // XP rises, the garden grows — and every bit of it vanishes on close. That
  // silent failure is a candidate cause of progress being lost three times, so
  // it now says so on every screen rather than nowhere at all.
  const cannotSave = useMemo(() => persistenceBlocked(), [])

  // Private Browsing is the one that actually cost three weeks of progress, and
  // NONE of the other checks can see it: storage works, writes succeed, the
  // mirror is written — then Safari discards the session when the last private
  // tab closes, with no error at any point. Detection is a quota heuristic, so
  // this is worded as a suspicion and sits alongside the hard alarm rather than
  // replacing it.
  const [ephemeral, setEphemeral] = useState(false)
  useEffect(() => {
    let alive = true
    void looksEphemeral().then(r => { if (alive) setEphemeral(r.likely) })
    return () => { alive = false }
  }, [])

  // On iOS an INSTALLED app gets its own storage bucket, separate from Safari's
  // for the very same URL. A learner who studied in the browser and then taps
  // the home-screen icon finds an empty app and reasonably concludes their
  // progress was deleted — it is sitting untouched in the other bucket. Adding
  // the PWA manifest is what flipped that icon from "opens in Safari" to
  // "launches standalone", so the app has to explain it rather than let it look
  // like data loss. Clears itself the moment anything is saved here.
  const emptyInstall = useMemo(
    () => isStandalone() && Object.keys(progress).length === 0 && Object.keys(scriptProgress).length === 0,
    [progress, scriptProgress],
  )

  return (
    <>
      <Background />
      <div className="bg-vignette" />
      <div className={`shell ${focus ? 'focus' : ''}`}>
        <aside className="side">
          <div className="logo">
            <span className="cup">🧋</span>
            <span><span className="chai">Chai</span><span className="eng-part">English</span></span>
          </div>
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-btn ${screen === n.id ? 'on' : ''}`}
              onClick={() => { if (sound) sfx.whoosh(); go(n.id) }}
            >
              <span className="ic">{n.icon}</span>
              <span className="txt">{n.label}</span>
              {n.id === 'review' && due > 0 && <span className="badge">{due}</span>}
            </button>
          ))}
        </aside>
        <main className="main" key={screen}>
          {emptyInstall && (
            <div className="storage-alarm info" role="status">
              <span className="ico" aria-hidden>📲</span>
              <span>
                <b>เคยเรียนใน Safari มาก่อนติดตั้งแอปใช่ไหม?</b>{' '}
                บน iOS แอปที่ติดตั้งไว้จะมีที่เก็บข้อมูลของตัวเอง แยกจาก Safari — หน้านี้จึงดูว่างเปล่า
                ทั้งที่ไม่มีอะไรหายไปเลย เปิดเว็บนี้ใน Safari แตะ
                <b> ดาวน์โหลดไฟล์สำรอง</b> ในหน้าตั้งค่า แล้วนำเข้าที่นี่
                หลังจากนั้นถ้าเข้าสู่ระบบ ทั้งสองที่จะตรงกันเองตลอด
              </span>
            </div>
          )}
          {!cannotSave && ephemeral && (
            <div className="storage-alarm" role="alert">
              <span className="ico" aria-hidden>🕶️</span>
              <span>
                <b>หน้าต่างนี้ดูเหมือนโหมดเลือกดูแบบส่วนตัว (Private Browsing)</b>{' '}
                ทุกอย่างจะดูเหมือนบันทึกได้ตามปกติ — แต่พอคุณปิดแท็บส่วนตัวแท็บสุดท้าย
                Safari จะทิ้งข้อมูลทั้งเซสชันไปทั้งหมด เปิดแอปในหน้าต่างปกติก่อนเริ่มเรียนจริง
              </span>
            </div>
          )}
          {cannotSave && (
            <div className="storage-alarm" role="alert">
              <span className="ico" aria-hidden>⚠️</span>
              <span>
                <b>เบราว์เซอร์นี้บล็อกการเก็บข้อมูล สิ่งที่คุณทำที่นี่จะบันทึกไม่ได้เลย</b>{' '}
                ส่วนใหญ่เกิดจากโหมดเลือกดูแบบส่วนตัว หรือการตั้งค่า → Safari → ปิดกั้นคุกกี้ทั้งหมด
                เปลี่ยนไปใช้หน้าต่างปกติก่อนเริ่มเรียนจริง
              </span>
            </div>
          )}
          {screen === 'home' && <Home />}
          {screen === 'lesson' && <Lesson />}
          {screen === 'review' && <Review />}
          {screen === 'builder' && <Builder />}
          {screen === 'listening' && <Listening />}
          {screen === 'script' && <Script />}
          {screen === 'sounds' && <Sounds />}
          {screen === 'library' && <Library />}
          {screen === 'about' && <About />}
          {screen === 'settings' && <Settings />}
        </main>
      </div>
    </>
  )
}
