// A second copy of progress, kept OUTSIDE localStorage — and an instrument for
// working out what happened when progress goes missing.
//
// Why this exists: progress has now been lost three times, and from inside the
// app we could not tell WHY. localStorage came back empty and that was the end
// of the story — every explanation (Safari's 7-day eviction, a cleared site,
// a different origin, a bug of ours) fits an empty key equally well.
//
// Two jobs, deliberately separate:
//
//   1. MIRROR — the full snapshot is written to IndexedDB after every change.
//      IndexedDB is a different quota bucket with different failure modes, so
//      it survives the things that hit localStorage alone: quota exhaustion,
//      a corrupt value, a blocked-cookies setting that disables localStorage
//      but not IDB. It does NOT survive a browser-level clear of site data,
//      which takes everything — that is what account sync is for (ROADMAP P1).
//
//   2. CANARIES — one tiny timestamped record written to each of four
//      independent stores. On boot we read all four and compare. Which ones
//      survived identifies the CLASS of failure, which is the thing we could
//      never determine before:
//
//        all four gone, app used before  → browser cleared/evicted everything
//        localStorage gone, IDB present  → localStorage-specific failure
//        all present, but progress gone  → a bug in our own persistence
//        nothing ever written            → storage is blocked; nothing persists
//
// This module must never throw into the boot path. Every entry point is
// wrapped, and a failure here degrades to "no mirror, no diagnosis" — never to
// a broken app.

import type { PersistedSnapshot } from './store'

const DB_NAME = 'chaienglish'
const STORE = 'vault'
const SNAPSHOT_KEY = 'snapshot'
const CANARY_KEY = 'chaienglish-canary'
const COOKIE_KEY = 'chaienglish_canary'

export interface Canary {
  /** When this canary was written. */
  t: number
  /** How many progress records existed at the time — a loss is visible as a drop. */
  n: number
}

export type StoreState = 'ok' | 'empty' | 'unavailable'

export interface Diagnosis {
  localStorage: StoreState
  indexedDb: StoreState
  sessionStorage: StoreState
  cookie: StoreState
  /** Newest canary found anywhere, or null if this device has never saved. */
  lastSeen: Canary | null
  /** True when at least one store held a canary but progress is empty now. */
  lostSinceLastSave: boolean
  /** Heuristic: this looks like a Private Browsing / incognito session. */
  ephemeral: boolean
  /** Running as an installed Home-Screen app, which on iOS has its OWN storage. */
  standalone: boolean
  /** Installed app, nothing ever saved here — the "where did my progress go" case. */
  freshInstall: boolean
  /** Plain-language reading of the four states, for the learner and for us.
   *  Thai: Settings shows it verbatim. */
  verdict: string
}

// ─── IndexedDB, promise-wrapped ─────────────────────────────────────────────

function openDb(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    let settled = false
    const done = (v: IDBDatabase | null) => { if (!settled) { settled = true; resolve(v) } }
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
      }
      req.onsuccess = () => done(req.result)
      req.onerror = () => done(null)
      req.onblocked = () => done(null)
      // Safari can leave an open() request pending forever in some private
      // modes. Never let that stall a caller.
      setTimeout(() => done(null), 3000)
    } catch { done(null) }
  })
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<boolean> {
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(value, key)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
      tx.onabort = () => resolve(false)
    } catch { resolve(false) }
  })
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | null> {
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve((req.result as T) ?? null)
      req.onerror = () => resolve(null)
    } catch { resolve(null) }
  })
}

// ─── Cookie canary ──────────────────────────────────────────────────────────
// Cookies are capped hard by ITP (7 days for script-set cookies) but they live
// in a different store again, so they distinguish "localStorage cleared" from
// "everything cleared".

function writeCookie(v: Canary): boolean {
  try {
    const val = encodeURIComponent(JSON.stringify(v))
    document.cookie = `${COOKIE_KEY}=${val}; path=/; max-age=31536000; SameSite=Lax`
    return document.cookie.includes(COOKIE_KEY)
  } catch { return false }
}

function readCookie(): Canary | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`))
    return m ? (JSON.parse(decodeURIComponent(m[1])) as Canary) : null
  } catch { return null }
}

const parseCanary = (raw: string | null): Canary | null => {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Canary
    return typeof v?.t === 'number' ? v : null
  } catch { return null }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Writes the canary to every store. Cheap; called on each mirror save. */
async function stampCanaries(n: number): Promise<void> {
  const c: Canary = { t: Date.now(), n }
  const raw = JSON.stringify(c)
  try { localStorage.setItem(CANARY_KEY, raw) } catch { /* blocked */ }
  try { sessionStorage.setItem(CANARY_KEY, raw) } catch { /* blocked */ }
  writeCookie(c)
  const db = await openDb()
  if (db) { await idbPut(db, CANARY_KEY, c); db.close() }
}

let pending: number | null = null
let lastWritten = ''

/**
 * Mirrors a snapshot to IndexedDB, debounced. Safe to call on every store
 * change; identical snapshots are skipped so a burst of reviews writes once.
 */
export function mirror(snapshot: PersistedSnapshot): void {
  const json = (() => {
    try { return JSON.stringify(snapshot) } catch { return '' }
  })()
  if (!json || json === lastWritten) return
  if (pending !== null) clearTimeout(pending)
  pending = window.setTimeout(() => {
    pending = null
    lastWritten = json
    void (async () => {
      const db = await openDb()
      if (db) { await idbPut(db, SNAPSHOT_KEY, json); db.close() }
      await stampCanaries(Object.keys(snapshot.progress ?? {}).length)
    })()
  }, 1500)
}

/** Reads the mirrored snapshot, or null if there isn't one. */
export async function readMirror(): Promise<PersistedSnapshot | null> {
  const db = await openDb()
  if (!db) return null
  const raw = await idbGet<string>(db, SNAPSHOT_KEY)
  db.close()
  if (!raw) return null
  try { return JSON.parse(raw) as PersistedSnapshot } catch { return null }
}

/**
 * Works out what state storage is in and, if progress went missing, what class
 * of failure caused it.
 *
 * `progressCount` is how many records the app currently holds, so the verdict
 * can distinguish "nothing saved yet" from "something was saved and is gone".
 */
export async function diagnose(progressCount: number): Promise<Diagnosis> {
  // localStorage: can we round-trip a write at all?
  let ls: StoreState = 'unavailable'
  let lsCanary: Canary | null = null
  try {
    localStorage.setItem('__chaienglish_probe', '1')
    localStorage.removeItem('__chaienglish_probe')
    lsCanary = parseCanary(localStorage.getItem(CANARY_KEY))
    ls = lsCanary ? 'ok' : 'empty'
  } catch { ls = 'unavailable' }

  let ss: StoreState = 'unavailable'
  let ssCanary: Canary | null = null
  try {
    sessionStorage.setItem('__chaienglish_probe', '1')
    sessionStorage.removeItem('__chaienglish_probe')
    ssCanary = parseCanary(sessionStorage.getItem(CANARY_KEY))
    ss = ssCanary ? 'ok' : 'empty'
  } catch { ss = 'unavailable' }

  const cookieCanary = readCookie()
  const cookie: StoreState = cookieCanary ? 'ok' : (writeCookie({ t: Date.now(), n: progressCount }) ? 'empty' : 'unavailable')

  const db = await openDb()
  let idb: StoreState = 'unavailable'
  let idbCanary: Canary | null = null
  if (db) {
    idbCanary = await idbGet<Canary>(db, CANARY_KEY)
    idb = idbCanary ? 'ok' : 'empty'
    db.close()
  }

  const { likely: ephemeral } = await looksEphemeral()
  const standalone = isStandalone()

  const seen = [lsCanary, idbCanary, ssCanary, cookieCanary].filter(Boolean) as Canary[]
  const lastSeen = seen.length ? seen.reduce((a, b) => (a.t >= b.t ? a : b)) : null
  const everSaved = lastSeen !== null && lastSeen.n > 0
  const lostSinceLastSave = everSaved && progressCount === 0

  // An installed app that has never saved anything is almost always a learner
  // who was studying in the browser: same URL, different storage bucket. Ranked
  // above the benign "nothing saved yet" because to them it looks like loss.
  const freshInstall = standalone && !everSaved && progressCount === 0

  let verdict: string
  if (freshInstall) {
    verdict =
      'นี่คือแอปที่ติดตั้งไว้ และบน iOS แอปที่ติดตั้งแล้วจะมีที่เก็บข้อมูลของตัวเอง — ' +
      'แยกจาก Safari แม้จะเป็นที่อยู่เดียวกัน ถ้าคุณเคยเรียนใน Safari ความคืบหน้ายังอยู่ที่นั่น ' +
      'ไม่ได้หายไปไหน: เปิดเว็บใน Safari กด “ดาวน์โหลดไฟล์สำรอง” แล้วกลับมานำเข้าที่นี่ ' +
      'เข้าสู่ระบบด้านล่างเพื่อให้ทั้งสองที่ตรงกันต่อจากนี้'
  } else if (ls === 'unavailable') {
    verdict =
      'เบราว์เซอร์นี้บล็อกการเก็บข้อมูลในเครื่อง สิ่งที่คุณทำที่นี่จะบันทึกไม่ได้เลย ' +
      'ส่วนใหญ่เกิดจากโหมดเลือกดูแบบส่วนตัว (Private Browsing) หรือการตั้งค่า → Safari → ปิดกั้นคุกกี้ทั้งหมด ' +
      'ปิดตัวเลือกนั้น หรือใช้หน้าต่างปกติ — ระหว่างนี้ให้ถือว่าเป็นแค่การทดลองเล่น'
  } else if (ephemeral) {
    // Named first and unconditionally: in a private window every other signal
    // reads healthy right up until the session ends and takes everything.
    verdict =
      'หน้าต่างนี้ดูเหมือนโหมดเลือกดูแบบส่วนตัว (Private Browsing) ที่เก็บข้อมูลดูเหมือนใช้ได้ปกติ ' +
      'แต่พอคุณปิดแท็บส่วนตัวแท็บสุดท้าย Safari จะทิ้งทั้งเซสชันไป — ' +
      'นี่คือสาเหตุที่ความคืบหน้าหายไปข้ามคืนโดยไม่มีคำเตือน เปิดแอปในหน้าต่างปกติแทน'
  } else if (lostSinceLastSave && idb === 'ok') {
    verdict =
      `ความคืบหน้าหายไปจากที่เก็บหลัก แต่สำเนาสำรองจากเมื่อ ` +
      `${new Date(lastSeen!.t).toLocaleString()} ยังอยู่ (${lastSeen!.n} รายการ) ` +
      'กู้คืนได้ด้านล่าง'
  } else if (lostSinceLastSave) {
    verdict =
      `ทุกสำเนาในเครื่องนี้หายไปหมด รวมถึงที่อยู่คนละที่เก็บกัน ` +
      `บันทึกครั้งล่าสุดเมื่อ ${new Date(lastSeen!.t).toLocaleString()} มี ${lastSeen!.n} รายการ ` +
      'ทุกที่เก็บหายพร้อมกัน แปลว่าเบราว์เซอร์ทิ้งข้อมูลของเว็บไซต์ทั้งหมด ไม่ใช่แอปทำหาย ' +
      'สาเหตุที่พบบ่อยที่สุดคือหน้าต่างโหมดเลือกดูแบบส่วนตัว (Private Browsing) ' +
      'ซึ่งถูกล้างเมื่อปิดแท็บส่วนตัวแท็บสุดท้าย รองลงมาคือ Safari ที่ตั้งให้ล้างข้อมูลเมื่อปิด ' +
      'ใช้หน้าต่างปกติ และเก็บไฟล์สำรองที่ดาวน์โหลดไว้ด้วย'
  } else if (!everSaved) {
    verdict = 'ยังไม่มีความคืบหน้าถูกบันทึกในเครื่องนี้ ตัวที่เก็บข้อมูลเองทำงานปกติ'
  } else {
    verdict = `ที่เก็บข้อมูลปกติดี บันทึกล่าสุดเมื่อ ${new Date(lastSeen!.t).toLocaleString()} มี ${lastSeen!.n} รายการ`
  }

  return {
    localStorage: ls, indexedDb: idb, sessionStorage: ss, cookie,
    lastSeen, lostSinceLastSave, ephemeral, standalone, freshInstall, verdict,
  }
}

/**
 * Whether this looks like a Private Browsing / incognito session, where
 * storage works normally and is then thrown away when the window closes.
 *
 * This is the failure that actually cost the owner three weeks of progress,
 * and it is invisible to every other check in this file: localStorage does not
 * throw, writes succeed, reads succeed, the IndexedDB mirror is written — and
 * Safari discards the entire session when the last private tab closes. There
 * is no error to catch, because from the page's point of view nothing failed.
 *
 * Browsers deliberately make private mode hard to detect, so this is a
 * HEURISTIC and is worded as one wherever it is shown. The signal is the
 * storage quota: private sessions are handed a small ephemeral bucket
 * (a few hundred MB at most) where a normal profile is offered many GB.
 * A device genuinely almost out of disk can look the same — which is why the
 * message says "looks like" and never asserts.
 */
/**
 * True when the app is running as an installed Home-Screen app rather than in
 * the browser.
 *
 * This matters far more than it looks. On iOS an installed web app gets its
 * OWN storage bucket, completely separate from Safari's for the same URL. The
 * two cannot see each other, so a learner who studies in Safari and then taps
 * the home-screen icon finds an empty app and concludes their progress was
 * deleted — when it is sitting untouched in the other bucket.
 *
 * This app CAUSED that for its owner: adding `apple-mobile-web-app-capable`
 * with the PWA manifest changed the home-screen icon from "opens in Safari"
 * (shared storage) to "launches standalone" (separate storage), and a
 * Level 3 history appeared to vanish. Nothing was lost; it was in Safari.
 */
export function isStandalone(): boolean {
  try {
    // iOS-only, and the only reliable signal there.
    if ((navigator as unknown as { standalone?: boolean }).standalone === true) return true
    return window.matchMedia?.('(display-mode: standalone)').matches ?? false
  } catch { return false }
}

export interface EphemeralCheck {
  likely: boolean
  quotaMb: number | null
}

export async function looksEphemeral(): Promise<EphemeralCheck> {
  try {
    if (!navigator.storage?.estimate) return { likely: false, quotaMb: null }
    const { quota } = await navigator.storage.estimate()
    if (typeof quota !== 'number' || quota <= 0) return { likely: false, quotaMb: null }
    const quotaMb = Math.round(quota / 1_048_576)
    // Measured, not guessed: a normal Chromium profile on this machine reports
    // ~154,000 MB while an incognito context reports exactly 1,024 MB — private
    // sessions get a hard cap rather than a share of free disk. The threshold
    // sits just above that cap.
    //
    // The false positives are benign by design: a device with under ~1.2 GB
    // free really is at risk of having its storage evicted, so the warning is
    // still the right thing to show there.
    return { likely: quotaMb < 1200, quotaMb }
  } catch {
    return { likely: false, quotaMb: null }
  }
}

/** True when the app cannot persist anything at all — the loud-warning case. */
export function persistenceBlocked(): boolean {
  try {
    localStorage.setItem('__chaienglish_probe', '1')
    localStorage.removeItem('__chaienglish_probe')
    return false
  } catch { return true }
}
