// State-assertion play-test for the out-of-localStorage vault.
//
// Progress has been lost three times and the app could never say why. This
// suite pins the two things that changed:
//
//   1. A second copy of progress lives in IndexedDB and survives losing the
//      localStorage blob, so a localStorage-specific failure is recoverable
//      in-app instead of terminal.
//   2. Canaries in four independent stores let the app NAME the class of
//      failure rather than guessing at it — the whole point of the exercise.
//
// Usage: node scripts/verify-vault.mjs   (needs a FRESHLY started dev server)
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:5173'
const KEY = 'chaienglish-v1'

const results = []
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`)
}

const pageErrors = []

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
// Playwright's newContext() is itself incognito-like and reports a ~1 GB quota,
// which the private-browsing heuristic correctly flags. Every scenario EXCEPT
// the private-browsing one wants to look like a normal profile, so the roomy
// quota is the context default and the private test overrides it back down.
await ctx.addInitScript(() => {
  const real = navigator.storage.estimate.bind(navigator.storage)
  navigator.storage.estimate = async () => ({ ...(await real()), quota: 150_000 * 1024 * 1024 })
})
/**
 * An untouched device. Any scenario whose premise is "nothing has ever been
 * saved here" needs one of these rather than a cleared page in the shared
 * context: mirroring is debounced, so a write scheduled by an earlier scenario
 * can land after the clear and quietly restore the state being tested away.
 */
const freshContext = async () => {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await c.addInitScript(() => {
    const real = navigator.storage.estimate.bind(navigator.storage)
    navigator.storage.estimate = async () => ({ ...(await real()), quota: 150_000 * 1024 * 1024 })
  })
  return c
}

const page = await ctx.newPage()
page.setDefaultTimeout(10_000)
page.on('pageerror', e => pageErrors.push(String(e)))

const store = (fn) => page.evaluate(async src => {
  const m = await import('/src/core/store.ts')
  const d = await import('/src/core/dev.ts')
  const v = await import('/src/core/vault.ts')
  return new Function('m', 'd', 'v', `return (${src})(m, d, v)`)(m, d, v)
}, fn.toString())

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.evaluate(k => localStorage.removeItem(k), KEY)
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })

// ── 1. The mirror is written ────────────────────────────────────────────────
await store((m, d) => { d.jumpToLevel(3); m.useApp.getState().addXp(250) })
await page.waitForTimeout(2500) // debounce is 1500ms

const seeded = await page.evaluate(k => {
  const raw = localStorage.getItem(k)
  return raw ? Object.keys(JSON.parse(raw).state.progress).length : 0
}, KEY)
check('setup: progress exists in localStorage', seeded > 0, `${seeded} items`)

let mirrored = await store((_m, _d, v) => v.readMirror().then(s =>
  s ? { items: Object.keys(s.progress).length, xp: s.xp } : null))
check('the mirror captured the snapshot', mirrored && mirrored.items === seeded,
  `mirror=${JSON.stringify(mirrored)}`)

// ── 2. It survives losing the localStorage blob ─────────────────────────────
await page.evaluate(k => localStorage.removeItem(k), KEY)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const afterWipe = await page.evaluate(k => {
  const raw = localStorage.getItem(k)
  return raw ? Object.keys(JSON.parse(raw).state.progress).length : 0
}, KEY)
check('the app really did lose its progress (the failure is reproduced)',
  afterWipe === 0, `${afterWipe} items in localStorage`)

mirrored = await store((_m, _d, v) => v.readMirror().then(s =>
  s ? { items: Object.keys(s.progress).length, xp: s.xp } : null))
check('the mirror survived the wipe intact',
  mirrored && mirrored.items === seeded && mirrored.xp === 250,
  `mirror=${JSON.stringify(mirrored)}`)

// ── 3. The diagnosis names THIS class of failure ────────────────────────────
const diag = await store((_m, _d, v) => v.diagnose(0))
check('diagnosis: localStorage reads as working', diag.localStorage === 'ok', `ls=${diag.localStorage}`)
check('diagnosis: the backup copy is found', diag.indexedDb === 'ok', `idb=${diag.indexedDb}`)
check('diagnosis: it knows progress was lost since the last save',
  diag.lostSinceLastSave === true, `lostSinceLastSave=${diag.lostSinceLastSave}`)
check('diagnosis: the verdict points at the recoverable backup',
  /backup copy/i.test(diag.verdict), diag.verdict.slice(0, 90))

// ── 4. Restoring from the mirror actually returns the progress ──────────────
const restored = await store(async (m, _d, v) => {
  const snap = await v.readMirror()
  m.useApp.setState(snap)
  return Object.keys(m.useApp.getState().progress).length
})
check('restoring from the mirror brings the progress back', restored === seeded,
  `${restored} items restored (was ${seeded})`)
await page.waitForTimeout(400)
const persistedAgain = await page.evaluate(k => {
  const raw = localStorage.getItem(k)
  return raw ? Object.keys(JSON.parse(raw).state.progress).length : 0
}, KEY)
check('the restore is written back to localStorage', persistedAgain === seeded,
  `${persistedAgain} items persisted`)

// ── 5. Everything cleared reads differently from a localStorage-only loss ───
// A SEPARATE context, because "clean device" cannot be faked by clearing
// storage inside a context that already has progress. `mirror()` is debounced
// 1.5s and the page is still holding the earlier scenarios' state, so a write
// scheduled before the wipe lands after it and re-stamps the canary with a
// non-zero progress count — the device then correctly reports "saved before,
// empty now", and the assertion fails on roughly one run in six. A fresh
// context is genuinely clean and needs no wiping at all.
const cleanCtx = await freshContext()
const wiped = await cleanCtx.newPage()
wiped.on('pageerror', e => pageErrors.push(String(e)))
await wiped.goto(`${BASE}/`, { waitUntil: 'networkidle' })
const fresh = await wiped.evaluate(async () => {
  const v = await import('/src/core/vault.ts')
  return await v.diagnose(0)
})
check('a truly clean device is NOT reported as data loss',
  fresh.lostSinceLastSave === false, `lostSinceLastSave=${fresh.lostSinceLastSave}`)
check('a clean device says storage is working rather than raising an alarm',
  /No progress has been saved/i.test(fresh.verdict), fresh.verdict.slice(0, 80))
await cleanCtx.close()

// ── 6. Blocked storage is detected, not silently tolerated ──────────────────
const blocked = await ctx.newPage()
blocked.on('pageerror', e => pageErrors.push(String(e)))
await blocked.addInitScript(() => {
  // Emulate iOS "Block All Cookies", where localStorage access throws.
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() { throw new Error('SecurityError: storage is disabled') },
  })
})
await blocked.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await blocked.waitForTimeout(600)
const alarmShown = await blocked.locator('.storage-alarm').count()
check('a device that cannot save shows the app-wide alarm', alarmShown > 0,
  `banners=${alarmShown}`)
const blockedDiag = await blocked.evaluate(async () => {
  const v = await import('/src/core/vault.ts')
  return { blocked: v.persistenceBlocked(), d: await v.diagnose(0) }
})
check('persistenceBlocked() detects it', blockedDiag.blocked === true)
check('the verdict tells the learner nothing can be saved',
  /blocking local storage/i.test(blockedDiag.d.verdict), blockedDiag.d.verdict.slice(0, 80))
await blocked.close()

// ── 7. Private Browsing — the failure that actually cost three weeks ────────
// Nothing else in this file can see it: storage works, writes succeed, the
// mirror is written, and then the session is discarded with no error at any
// point. Detection is a quota heuristic, so it is pinned from both sides.
const incog = await browser.newContext({ viewport: { width: 390, height: 844 } })
const ipage = await incog.newPage()
ipage.on('pageerror', e => pageErrors.push(String(e)))
// Emulate the hard quota cap a private session is given (measured: a normal
// Chromium profile reports ~154,000 MB, an incognito context exactly 1,024 MB).
await ipage.addInitScript(() => {
  const real = navigator.storage.estimate.bind(navigator.storage)
  navigator.storage.estimate = async () => ({ ...(await real()), quota: 1024 * 1024 * 1024 })
})
await ipage.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await ipage.waitForTimeout(900)
const eph = await ipage.evaluate(async () => {
  const v = await import('/src/core/vault.ts')
  return { check: await v.looksEphemeral(), d: await v.diagnose(0), banners: document.querySelectorAll('.storage-alarm').length }
})
check('a private-session quota is recognised as ephemeral', eph.check.likely === true,
  `quota=${eph.check.quotaMb}MB`)
check('private browsing raises the app-wide banner', eph.banners > 0, `banners=${eph.banners}`)
check('the verdict names private browsing', /PRIVATE BROWSING/.test(eph.d.verdict),
  eph.d.verdict.slice(0, 70))
check('private browsing outranks "nothing saved yet" in the verdict',
  !/No progress has been saved/i.test(eph.d.verdict))
await ipage.close()

// …and must NOT fire on a normal profile, or the warning becomes noise.
const roomy = await ctx.newPage()
await roomy.addInitScript(() => {
  const real = navigator.storage.estimate.bind(navigator.storage)
  navigator.storage.estimate = async () => ({ ...(await real()), quota: 150_000 * 1024 * 1024 })
})
await roomy.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await roomy.waitForTimeout(700)
const roomyCheck = await roomy.evaluate(async () => {
  const v = await import('/src/core/vault.ts')
  return { check: await v.looksEphemeral(), banners: document.querySelectorAll('.storage-alarm').length }
})
check('a normal profile is NOT flagged as private', roomyCheck.check.likely === false,
  `quota=${roomyCheck.check.quotaMb}MB`)
check('a normal profile shows no storage banner', roomyCheck.banners === 0)
await roomy.close()

// ── 8. Installed app on iOS: separate storage, NOT data loss ───────────────
// Adding the PWA manifest flipped the home-screen icon from "opens in Safari"
// (shared storage) to "launches standalone" (its own bucket), and the owner's
// Level 3 history appeared to vanish. Nothing was lost — it was in Safari. The
// app has to say so, and must stop saying so once anything is saved here.
// A FRESH context, not another page in the shared one. An installed app has
// its own bucket — that is the whole subject here — and the shared context
// still holds the IndexedDB mirror written by the earlier scenarios. Reusing
// it made this section pass or fail depending on how much of that mirror had
// been flushed by the time it ran: "fresh install" was being told there was a
// backup, because in that context there genuinely was one.
const instCtx = await freshContext()
await instCtx.addInitScript(() => {
  Object.defineProperty(navigator, 'standalone', { configurable: true, get: () => true })
})
const installed = await instCtx.newPage()
installed.setDefaultTimeout(10_000)
installed.on('pageerror', e => pageErrors.push(String(e)))
// Load ONCE. The old sequence — load, clear localStorage, reload — raced the
// app's own first write: if the vault mirrored anything during that first load,
// the canary survived the localStorage wipe and the second load correctly
// diagnosed "saved before, empty now" instead of "fresh install". The scenario
// never needed the wipe; a new context is already an empty bucket.
await installed.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await installed.waitForTimeout(900)

const inst = await installed.evaluate(async () => {
  const v = await import('/src/core/vault.ts')
  return { standalone: v.isStandalone(), d: await v.diagnose(0),
    banners: document.querySelectorAll('.storage-alarm.info').length }
})
check('an installed (standalone) launch is detected', inst.standalone === true)
check('an empty installed app explains the separate storage bucket',
  inst.banners > 0, `banners=${inst.banners}`)
check('the verdict says the progress is not lost, and where to find it',
  /own storage/i.test(inst.d.verdict) && /not lost/i.test(inst.d.verdict),
  inst.d.verdict.slice(0, 80))
check('it is reported as a fresh install, not as data loss',
  inst.d.freshInstall === true && inst.d.lostSinceLastSave === false,
  `freshInstall=${inst.d.freshInstall} lost=${inst.d.lostSinceLastSave}`)

// Once there IS progress here, the notice must disappear — otherwise it becomes
// permanent furniture and stops meaning anything.
await installed.evaluate(async () => {
  const d = await import('/src/core/dev.ts')
  d.jumpToLevel(2)
})
await installed.waitForTimeout(600)
const afterStudy = await installed.evaluate(() => document.querySelectorAll('.storage-alarm.info').length)
check('the notice clears as soon as the installed app has progress of its own',
  afterStudy === 0, `banners=${afterStudy}`)
await instCtx.close()

// A normal browser tab must never show it.
const browserTab = await ctx.newPage()
await browserTab.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await browserTab.evaluate(k => localStorage.removeItem(k), KEY)
await browserTab.reload({ waitUntil: 'networkidle' })
await browserTab.waitForTimeout(700)
const tabBanners = await browserTab.evaluate(() => document.querySelectorAll('.storage-alarm.info').length)
check('a normal browser tab never shows the installed-app notice', tabBanners === 0,
  `banners=${tabBanners}`)
await browserTab.close()

check('zero uncaught page errors across every scenario', pageErrors.length === 0,
  pageErrors.length ? pageErrors.slice(0, 3).join(' | ') : 'clean')

const failed = results.filter(r => !r.pass).length
console.log(`\n${results.length} assertions, ${failed} failed`)
await browser.close()
process.exit(failed ? 1 : 0)
