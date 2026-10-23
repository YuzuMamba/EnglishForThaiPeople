// End-to-end sync against a running HTTP server that speaks Supabase's
// protocol (scripts/fake-supabase.mjs).
//
// verify-sync.mjs proves the MERGE. This proves the WIRE: real fetch calls,
// real auth headers, real status codes, real upsert, and the two-device
// journey through the actual UI. Together they cover everything except a live
// Supabase project's row-level security, which needs the owner's credentials.
//
// Runs its own dev server on a spare port so it can inject VITE_SUPABASE_* —
// Vite bakes env vars at startup, so they cannot be set from the test.
//
// Usage: node scripts/verify-sync-live.mjs
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { startFakeSupabase } from './fake-supabase.mjs'

const PORT = 5199
const BASE = `http://localhost:${PORT}`

const results = []
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`)
}

const api = await startFakeSupabase(54321)

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  env: {
    ...process.env,
    VITE_SUPABASE_URL: api.url,
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  },
  stdio: 'ignore',
  // `npx` forks the real vite, and killing npx leaves that child holding the
  // port. The next run then fails --strictPort, silently tests against the
  // STALE server, and reports failures that have nothing to do with the code.
  // Own the process group so the whole thing goes down together.
  detached: true,
})

// Wait for the dev server rather than guessing at a sleep.
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(BASE)
    if (r.ok) break
  } catch { /* not up yet */ }
  await new Promise(r => setTimeout(r, 500))
}

const pageErrors = []
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})

/** A fresh, isolated browser context = a separate device. */
async function device(label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  // Playwright contexts are incognito-like and report a ~1 GB quota, which the
  // private-browsing heuristic correctly flags. Nothing here is testing that,
  // so present a normal-profile quota and keep the banner out of the way.
  await ctx.addInitScript(() => {
    const real = navigator.storage.estimate.bind(navigator.storage)
    navigator.storage.estimate = async () => ({ ...(await real()), quota: 150_000 * 1024 * 1024 })
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(15_000)
  page.on('pageerror', e => pageErrors.push(`${label}: ${e}`))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  return { ctx, page, label }
}

const gotoSettings = p => p.evaluate(async () => {
  const m = await import('/src/core/store.ts')
  m.useApp.getState().go('settings')
})

const snapshot = p => p.evaluate(async () => {
  const m = await import('/src/core/store.ts')
  const s = m.useApp.getState()
  return { items: Object.keys(s.progress).length, letters: Object.keys(s.scriptProgress).length, xp: s.xp }
})

// The buttons. `exact` because "สมัครบัญชี" (submit) is a prefix of
// "สมัครบัญชีใหม่" (the mode switch), and has-text matches substrings.
const btn = (p, name) => p.getByRole('button', { name, exact: true })

// ── The card only appears when the build has credentials ───────────────────
const phone = await device('phone')
await gotoSettings(phone.page)
await phone.page.waitForTimeout(600)
check('the sync card appears when the build is configured',
  await phone.page.locator('text=ซิงก์บัญชี').count() > 0)
const credOk = await phone.page.evaluate(async () => {
  const s = await import('/src/core/sync.ts')
  return s.credentialProblem()
})
check('a correctly configured build reports no credential problem', credOk === null,
  String(credOk).slice(0, 70))

// ── Sign up, then sync a first payload ─────────────────────────────────────
// Progress to carry across, seeded through the store's own `learnItem`. Sync
// merges per record and never asks what an id means (orphans survive by
// design, CLAUDE.md §2), so the corpus is used when there is one and stable
// placeholder ids while the levels are still being authored.
await phone.page.evaluate(async () => {
  const m = await import('/src/core/store.ts')
  const data = await import('/src/data/index.ts')
  const real = Object.keys(data.ITEMS).slice(0, 12)
  const ids = real.length ? real : Array.from({ length: 12 }, (_, i) => `seed-item-${i + 1}`)
  for (const id of ids) m.useApp.getState().learnItem(id)
  m.useApp.getState().addXp(400)
})
const phoneBefore = await snapshot(phone.page)
check('the first device has progress to push', phoneBefore.items > 0 && phoneBefore.xp === 400,
  JSON.stringify(phoneBefore))

await btn(phone.page, 'สมัครบัญชีใหม่').click()
await phone.page.locator('input[type=email]').fill('learner@example.com')
await phone.page.locator('input[type=password]').fill('correct-horse-battery')
await btn(phone.page, 'สมัครบัญชี').click()
await phone.page.waitForTimeout(2500)

const phoneNote = await phone.page.locator('.sync-notice').last().textContent()
check('sign-up succeeds and the first sync pushes', /บันทึกความคืบหน้าไว้ในบัญชี|ซิงก์แล้ว/.test(phoneNote ?? ''),
  (phoneNote ?? '').slice(0, 80))
check('the server now holds exactly one row', api.rowCount() === 1, `rows=${api.rowCount()}`)

// ── A second device signs in and pulls ─────────────────────────────────────
const ipad = await device('ipad')
await gotoSettings(ipad.page)
await ipad.page.waitForTimeout(500)
const ipadEmpty = await snapshot(ipad.page)
check('the second device starts empty', ipadEmpty.items === 0, `${ipadEmpty.items} items`)

await ipad.page.locator('input[type=email]').fill('learner@example.com')
await ipad.page.locator('input[type=password]').fill('correct-horse-battery')
await btn(ipad.page, 'เข้าสู่ระบบ').first().click()
await ipad.page.waitForTimeout(2500)

const ipadAfter = await snapshot(ipad.page)
check('signing in pulls the other device\'s progress',
  ipadAfter.items === phoneBefore.items && ipadAfter.xp === phoneBefore.xp,
  `ipad=${JSON.stringify(ipadAfter)} phone=${JSON.stringify(phoneBefore)}`)

// ── Study on the second device, then sync both ways ────────────────────────
const advanced = await ipad.page.evaluate(async () => {
  const m = await import('/src/core/store.ts')
  const s = m.useApp.getState()
  const id = Object.keys(s.progress)[0]
  const before = s.progress[id].stage
  s.answer(id, true)              // real scheduled answer, advances a stage
  s.learnItem('__ipad_only__')    // a record the phone has never seen
  s.addXp(90)
  return { id, before, after: m.useApp.getState().progress[id].stage }
})
check('the second device advanced a shared record', advanced.after === advanced.before + 1,
  `${advanced.id}: ${advanced.before} → ${advanced.after}`)

await ipad.page.locator('button:has-text("ซิงก์ตอนนี้")').click()
await ipad.page.waitForTimeout(2000)

await phone.page.locator('button:has-text("ซิงก์ตอนนี้")').click()
await phone.page.waitForTimeout(2000)

const phoneFinal = await phone.page.evaluate(async ([id]) => {
  const m = await import('/src/core/store.ts')
  const s = m.useApp.getState()
  return {
    items: Object.keys(s.progress).length,
    stage: s.progress[id]?.stage,
    hasIpadOnly: '__ipad_only__' in s.progress,
    xp: s.xp,
  }
}, [advanced.id])

check('the phone receives the record only the iPad had', phoneFinal.hasIpadOnly)
check('the phone picks up the iPad\'s advance on a SHARED record',
  phoneFinal.stage === advanced.after,
  `phone stage=${phoneFinal.stage}, iPad advanced to ${advanced.after}`)
check('xp is carried across, never reduced', phoneFinal.xp >= 400 + 90,
  `xp=${phoneFinal.xp}`)
check('the server still holds exactly one row per user', api.rowCount() === 1,
  `rows=${api.rowCount()}`)

// ── Failure paths ──────────────────────────────────────────────────────────
const badLogin = await device('bad-login')
await gotoSettings(badLogin.page)
await badLogin.page.waitForTimeout(400)
await badLogin.page.locator('input[type=email]').fill('learner@example.com')
await badLogin.page.locator('input[type=password]').fill('wrong-password')
await btn(badLogin.page, 'เข้าสู่ระบบ').first().click()
await badLogin.page.waitForTimeout(1500)
const badNote = await badLogin.page.locator('.sync-notice').last().textContent()
// GoTrue's own reason is relayed verbatim (it is the server's wording), with
// the Thai reassurance that nothing on this device changed appended.
check('a wrong password reports the real reason', /invalid login/i.test(badNote ?? ''),
  (badNote ?? '').slice(0, 60))
check('a wrong password still says the device is unaffected', /ยังอยู่ครบ/.test(badNote ?? ''),
  (badNote ?? '').slice(0, 90))
await badLogin.ctx.close()

// ── A key the project refuses ──────────────────────────────────────────────
// The most likely real-world misconfiguration, and the one that used to
// surface as a bare "HTTP 401" on a create-account form — which reads as "your
// email or password was rejected" and sends someone hunting for a typo in
// credentials the server never even looked at.
api.setGatewayRejects(true)

await phone.page.locator('button:has-text("ซิงก์ตอนนี้")').click()
await phone.page.waitForTimeout(1500)
const keyNote = await phone.page.locator('.sync-notice').last().textContent() ?? ''
check('a rejected API key is explained, not relayed as a status code',
  /ปฏิเสธ API key/.test(keyNote) && !/HTTP 401/.test(keyNote),
  keyNote.slice(0, 80))
check('a rejected API key is named as a configuration problem, not a login one',
  /ปัญหาการตั้งค่า/.test(keyNote) && /deploy ใหม่/.test(keyNote) && /ไม่ใช่อีเมลหรือรหัสผ่าน/.test(keyNote))
check('a rejected API key still says the device is unaffected — exactly once',
  (keyNote.match(/ยังอยู่ครบ/g) ?? []).length === 1,
  `${(keyNote.match(/ยังอยู่ครบ/g) ?? []).length} occurrences`)

const signup = await device('bad-key-signup')
await gotoSettings(signup.page)
await signup.page.waitForTimeout(400)
await btn(signup.page, 'สมัครบัญชีใหม่').click()
await signup.page.locator('input[type=email]').fill('nobody@example.com')
await signup.page.locator('input[type=password]').fill('correct-horse-battery')
await btn(signup.page, 'สมัครบัญชี').click()
await signup.page.waitForTimeout(1500)
const signupNote = await signup.page.locator('.sync-notice').last().textContent() ?? ''
check('sign-up under a rejected key blames the key, not the learner',
  /ปฏิเสธ API key/.test(signupNote), signupNote.slice(0, 80))
check('sign-up under a rejected key states no account was created',
  /ไม่มีการสร้างบัญชี/.test(signupNote))
await signup.ctx.close()

api.setGatewayRejects(false)

// The server going away must never cost local progress.
await api.close()
const beforeOutage = await snapshot(phone.page)
await phone.page.locator('button:has-text("ซิงก์ตอนนี้")').click()
await phone.page.waitForTimeout(2500)
const afterOutage = await snapshot(phone.page)
const outageNote = await phone.page.locator('.sync-notice').last().textContent()
check('a failed sync leaves local progress completely untouched',
  JSON.stringify(beforeOutage) === JSON.stringify(afterOutage),
  `before=${JSON.stringify(beforeOutage)} after=${JSON.stringify(afterOutage)}`)
check('a failed sync says so, and says the device is unaffected',
  /ยังอยู่ครบ/.test(outageNote ?? ''), (outageNote ?? '').slice(0, 90))
// Browsers word a network-layer rejection differently — Safari "Load failed",
// Chrome "Failed to fetch" — and none of those wordings tells anyone anything.
check('an unreachable server is explained, not relayed as the browser\'s wording',
  /ติดต่อเซิร์ฟเวอร์ซิงก์ไม่ได้/.test(outageNote ?? '') &&
  !/load failed|failed to fetch/i.test(outageNote ?? ''),
  (outageNote ?? '').slice(0, 90))
check('an unreachable server names the causes worth checking',
  /ถูกพัก/.test(outageNote ?? '') && /ตัวบล็อกโฆษณา|VPN/.test(outageNote ?? ''))

// Signing in is where a failure is most likely to read as lost progress, and
// that path used to show the raw message with no reassurance at all.
const offlineLogin = await device('offline-login')
await gotoSettings(offlineLogin.page)
await offlineLogin.page.waitForTimeout(400)
await offlineLogin.page.locator('input[type=email]').fill('learner@example.com')
await offlineLogin.page.locator('input[type=password]').fill('correct-horse-battery')
await btn(offlineLogin.page, 'เข้าสู่ระบบ').first().click()
await offlineLogin.page.waitForTimeout(2000)
const offlineNote = await offlineLogin.page.locator('.sync-notice').last().textContent() ?? ''
check('a sign-in against an unreachable server says the device is unaffected',
  /ยังอยู่ครบ/.test(offlineNote) && /ติดต่อเซิร์ฟเวอร์ซิงก์ไม่ได้/.test(offlineNote),
  offlineNote.slice(0, 90))
await offlineLogin.ctx.close()

check('zero uncaught page errors', pageErrors.length === 0,
  pageErrors.length ? pageErrors.slice(0, 3).join(' | ') : 'clean')

const failed = results.filter(r => !r.pass).length
console.log(`\n${results.length} assertions, ${failed} failed`)
await browser.close()
try { process.kill(-vite.pid) } catch { vite.kill() }
process.exit(failed ? 1 : 0)
