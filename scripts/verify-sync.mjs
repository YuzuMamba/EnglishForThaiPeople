// State-assertion play-test for account sync.
//
// The merge is the dangerous part: whole-blob last-write-wins silently
// discards whichever device synced first, and that is the exact class of
// silent loss sync is meant to END rather than introduce. So the merge is a
// pure function and this suite hammers it — including a property test over
// randomised histories — before any of it touches a network.
//
// The sync CYCLE is exercised against a fake in-process server, so pull →
// merge → push is proven without needing a Supabase project or egress. What is
// therefore NOT covered here: real GoTrue auth, real PostgREST responses, and
// row-level security. Those need a live project and a manual pass.
//
// Usage: node scripts/verify-sync.mjs   (needs a FRESHLY started dev server)
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:5173'

const results = []
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`)
}

const pageErrors = []
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15_000)
page.on('pageerror', e => pageErrors.push(String(e)))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })

const inPage = fn => page.evaluate(async src => {
  const merge = await import('/src/core/merge.ts')
  const srs = await import('/src/core/srs.ts')
  return new Function('merge', 'srs', `return (${src})(merge, srs)`)(merge, srs)
}, fn.toString())

// ── 1. Per-record merge: the newer record wins, both ways round ─────────────
const basic = await inPage(merge => {
  const rec = (stage, updatedAt) => ({
    stage, due: updatedAt + 3600e3, correct: stage, incorrect: 0,
    streak: stage, learnedAt: 1000, updatedAt,
  })
  const a = { x: rec(5, 2000), onlyA: rec(1, 1500) }
  const b = { x: rec(2, 3000), onlyB: rec(3, 1800) }
  const ab = merge.mergeProgress(a, b)
  const ba = merge.mergeProgress(b, a)
  return {
    newerWins: ab.x.stage,
    symmetric: JSON.stringify(ab) === JSON.stringify(ba),
    keptOnlyA: !!ab.onlyA, keptOnlyB: !!ab.onlyB,
    count: Object.keys(ab).length,
  }
})
check('the newer record wins regardless of stage', basic.newerWins === 2,
  `merged stage=${basic.newerWins} (b was newer at stage 2)`)
check('merge is symmetric — same result whichever side is "local"', basic.symmetric)

// Symmetry has to survive an exact updatedAt TIE, which the v3 backfill makes
// realistic: it stamps a whole map from learnedAt, so many records share a
// millisecond. Preferring "argument a" there would make two devices disagree
// forever, each convinced the other was wrong.
const ties = await inPage(merge => {
  const rec = (stage, correct) => ({
    stage, due: 5000, correct, incorrect: 0, streak: stage,
    learnedAt: 1000, updatedAt: 2000,          // identical clocks on purpose
  })
  const a = { x: rec(5, 9), y: rec(1, 1) }
  const b = { x: rec(2, 3), y: rec(1, 1) }
  const ab = JSON.stringify(merge.mergeProgress(a, b))
  const ba = JSON.stringify(merge.mergeProgress(b, a))
  return { symmetric: ab === ba, chosenStage: JSON.parse(ab).x.stage }
})
check('merge stays symmetric when updatedAt ties exactly', ties.symmetric)
check('a tie resolves toward the further-along record, not toward argument order',
  ties.chosenStage === 5, `chose stage ${ties.chosenStage}`)

// Key ORDER is part of the stored form: two devices must produce byte-identical
// JSON or they push differing blobs back and forth forever.
const ordering = await inPage((merge, srs) => {
  const t = 1000
  const a = { zeta: srs.newProgress(t), alpha: srs.newProgress(t) }
  const b = { mid: srs.newProgress(t), alpha: srs.newProgress(t) }
  return {
    keys: Object.keys(merge.mergeProgress(a, b)),
    identical: JSON.stringify(merge.mergeProgress(a, b)) === JSON.stringify(merge.mergeProgress(b, a)),
  }
})
check('merged keys are emitted in a stable sorted order',
  ordering.keys.join(',') === 'alpha,mid,zeta', ordering.keys.join(','))
check('the serialised merge is byte-identical from both directions', ordering.identical)
check('records present on only one side are kept', basic.keptOnlyA && basic.keptOnlyB,
  `${basic.count} ids merged`)

// ── 2. The failure that motivated updatedAt ────────────────────────────────
// A wrong answer LOWERS due. Merging on due would discard the newer answer.
const dueTrap = await inPage((merge, srs) => {
  const t0 = 1_000_000
  let p = srs.newProgress(t0)
  for (let i = 0; i < 5; i++) p = srs.applyAnswer(p, true, t0 + i * 1000)   // up to stage 5
  const mature = p
  const lapsed = srs.applyAnswer(p, false, t0 + 60_000)                     // wrong, later
  const merged = merge.mergeProgress({ w: mature }, { w: lapsed }).w
  return {
    matureStage: mature.stage, matureDue: mature.due,
    lapsedStage: lapsed.stage, lapsedDue: lapsed.due,
    mergedStage: merged.stage,
    dueWentBackwards: lapsed.due < mature.due,
  }
})
check('a wrong answer really does set an EARLIER due than the mature record',
  dueTrap.dueWentBackwards,
  `mature due=${dueTrap.matureDue}, after lapse=${dueTrap.lapsedDue}`)
check('merging on updatedAt keeps the lapse — "later due wins" would have lost it',
  dueTrap.mergedStage === dueTrap.lapsedStage,
  `merged stage=${dueTrap.mergedStage}, expected ${dueTrap.lapsedStage} (not ${dueTrap.matureStage})`)

// ── 3. Scalars never go backwards ──────────────────────────────────────────
const scalars = await inPage(merge => {
  const env = (snap, updatedAt) => ({ snapshot: snap, updatedAt, deviceId: 'd' })
  const a = { progress: {}, scriptProgress: {}, maxUnlocked: 7, xp: 900, streakDays: 12,
    lastActiveDay: '2026-08-20', history: [{ day: '2026-08-19', reviews: 10, xp: 100 }],
    settings: { sound: true, showReading: true, newPerDay: 6, sessionSize: 20 },
    seenSentences: { onlyA: 50, both: 900 } }
  const b = { progress: {}, scriptProgress: {}, maxUnlocked: 4, xp: 1500, streakDays: 3,
    lastActiveDay: '2026-08-21', history: [{ day: '2026-08-19', reviews: 4, xp: 250 },
      { day: '2026-08-21', reviews: 8, xp: 80 }],
    settings: { sound: false, showReading: false, newPerDay: 12, sessionSize: 40 },
    seenSentences: { onlyB: 70, both: 400 } }
  const m = merge.mergeSnapshots(env(a, 100), env(b, 200))
  return {
    maxUnlocked: m.maxUnlocked, xp: m.xp, streakDays: m.streakDays,
    lastActiveDay: m.lastActiveDay,
    days: m.history.length,
    day19: m.history.find(h => h.day === '2026-08-19'),
    newPerDay: m.settings.newPerDay,
    seen: m.seenSentences,
    seenSymmetric:
      JSON.stringify(m.seenSentences) ===
      JSON.stringify(merge.mergeSnapshots(env(b, 200), env(a, 100)).seenSentences),
  }
})
check('maxUnlocked takes the max — a device never re-locks a level',
  scalars.maxUnlocked === 7, `got ${scalars.maxUnlocked}`)
check('xp takes the max — a learner is never shown less than they had',
  scalars.xp === 1500, `got ${scalars.xp}`)
check('streakDays takes the max', scalars.streakDays === 12, `got ${scalars.streakDays}`)
check('lastActiveDay takes the later date', scalars.lastActiveDay === '2026-08-21',
  scalars.lastActiveDay)
// Sentence Builder's spacing memory. Union, so a sentence built on the phone is
// not offered again on the iPad; later timestamp wins, because that is when it
// was most recently seen.
check('seenSentences unions across devices — neither device loses its history',
  scalars.seen.onlyA === 50 && scalars.seen.onlyB === 70,
  JSON.stringify(scalars.seen))
check('a sentence seen on both takes the LATER sighting',
  scalars.seen.both === 900, `got ${scalars.seen.both}`)
check('seenSentences merges symmetrically — or two devices push it back and forth',
  scalars.seenSymmetric)
check('history is unioned by day', scalars.days === 2, `${scalars.days} days`)
check('a day present on both sides keeps the higher figures',
  scalars.day19.reviews === 10 && scalars.day19.xp === 250,
  `reviews=${scalars.day19.reviews} xp=${scalars.day19.xp}`)
check('settings come from the more recently written device',
  scalars.newPerDay === 12, `newPerDay=${scalars.newPerDay}`)

// ── 4. Property test: a merge can never lose ground ─────────────────────────
// Randomised histories on two devices from a shared base. Whatever happens,
// every id must survive and every record must be at least as recent as the
// better of the two inputs.
const property = await inPage((merge, srs) => {
  let seed = 12345
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
  let violations = 0, rounds = 0, idsChecked = 0

  for (let trial = 0; trial < 300; trial++) {
    const ids = Array.from({ length: 12 }, (_, i) => `i${i}`)
    const base = {}
    let t = 1_000_000
    for (const id of ids) if (rnd() < 0.7) base[id] = srs.newProgress(t += 100)

    const fork = src => JSON.parse(JSON.stringify(src))
    const a = fork(base)
    const b = fork(base)
    // Each device studies independently for a while.
    for (const dev of [a, b]) {
      const n = Math.floor(rnd() * 10)
      for (let i = 0; i < n; i++) {
        const id = ids[Math.floor(rnd() * ids.length)]
        t += Math.floor(rnd() * 5000) + 1
        dev[id] = dev[id] ? srs.applyAnswer(dev[id], rnd() < 0.6, t) : srs.newProgress(t)
      }
    }
    const m = merge.mergeProgress(a, b)
    rounds++

    // Every id from either device survives.
    for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
      idsChecked++
      if (!m[id]) { violations++; continue }
      const ta = a[id]?.updatedAt ?? -1
      const tb = b[id]?.updatedAt ?? -1
      // The merged record must be the freshest of the two.
      if (m[id].updatedAt !== Math.max(ta, tb)) violations++
    }
  }
  return { violations, rounds, idsChecked }
})
check('property: over 300 randomised two-device histories, no record is lost or stale',
  property.violations === 0,
  `${property.violations} violations across ${property.rounds} merges, ${property.idsChecked} ids`)

// ── 5. Idempotence and convergence ─────────────────────────────────────────
// Syncing twice must change nothing, and both devices must land on the same
// state after each has merged — otherwise devices ping-pong forever.
const converge = await inPage((merge, srs) => {
  const t = 1_000_000
  const a = { x: srs.applyAnswer(srs.newProgress(t), true, t + 500), p: srs.newProgress(t + 10) }
  const b = { x: srs.newProgress(t), q: srs.newProgress(t + 20) }
  const envA = { snapshot: { progress: a, scriptProgress: {}, maxUnlocked: 3, xp: 10, streakDays: 1, lastActiveDay: 'a', history: [], settings: {} }, updatedAt: 1, deviceId: 'a' }
  const envB = { snapshot: { progress: b, scriptProgress: {}, maxUnlocked: 5, xp: 20, streakDays: 2, lastActiveDay: 'b', history: [], settings: {} }, updatedAt: 2, deviceId: 'b' }
  const m1 = merge.mergeSnapshots(envA, envB)
  const m2 = merge.mergeSnapshots({ ...envA, snapshot: m1 }, { ...envB, snapshot: m1 })
  const fromOtherSide = merge.mergeSnapshots(envB, envA)
  return {
    idempotent: JSON.stringify(m1.progress) === JSON.stringify(m2.progress),
    converged: JSON.stringify(m1.progress) === JSON.stringify(fromOtherSide.progress),
    ids: Object.keys(m1.progress).sort().join(','),
  }
})
check('merging an already-merged snapshot changes nothing (idempotent)',
  converge.idempotent)
check('both devices converge on the same result', converge.converged,
  `ids=${converge.ids}`)

// ── 6. The full cycle against a fake server ────────────────────────────────
// Two devices, alternating syncs, with the server as the only shared state.
const cycle = await page.evaluate(async () => {
  const merge = await import('/src/core/merge.ts')
  const srs = await import('/src/core/srs.ts')

  let server = null // the single stored row
  const blank = () => ({ progress: {}, scriptProgress: {}, maxUnlocked: 1, xp: 0,
    streakDays: 0, lastActiveDay: '', history: [], settings: { newPerDay: 6 } })

  // Mirrors syncNow(): pull, merge, push the merge to BOTH sides.
  let clock = 1
  const sync = local => {
    const env = { snapshot: local, updatedAt: clock++, deviceId: 'x' }
    const merged = server ? merge.mergeSnapshots(env, server) : local
    server = { snapshot: merged, updatedAt: clock++, deviceId: 'x' }
    return merged
  }

  let t = 1_000_000
  let phone = blank()
  let ipad = blank()

  phone.progress.a = srs.newProgress(t += 100)
  phone.xp = 50
  phone = sync(phone)                       // first push creates the row

  ipad = sync(ipad)                         // fresh device pulls everything
  const ipadGotPhone = !!ipad.progress.a && ipad.xp === 50

  ipad.progress.b = srs.newProgress(t += 100)
  ipad.progress.a = srs.applyAnswer(ipad.progress.a, true, t += 100)
  ipad.xp = 130
  ipad = sync(ipad)

  phone.progress.c = srs.newProgress(t += 100)
  phone = sync(phone)                       // phone still holds its stale 'a'

  return {
    ipadGotPhone,
    phoneHasAll: ['a', 'b', 'c'].every(k => k in phone.progress),
    phoneAStage: phone.progress.a.stage,     // must be the iPad's advanced one
    phoneXp: phone.xp,
    serverHasAll: ['a', 'b', 'c'].every(k => k in server.snapshot.progress),
  }
})
check('a fresh device pulls the other device\'s progress', cycle.ipadGotPhone)
check('after alternating syncs, every device has every record',
  cycle.phoneHasAll && cycle.serverHasAll,
  `phone=${cycle.phoneHasAll} server=${cycle.serverHasAll}`)
check('a stale local record is replaced by the remote advance, not the reverse',
  cycle.phoneAStage === 1, `stage=${cycle.phoneAStage} (iPad advanced it to 1)`)
check('xp survives the round trip', cycle.phoneXp === 130, `xp=${cycle.phoneXp}`)

// ── 7. Config gating: no credentials means sync is simply not offered ───────
const gated = await page.evaluate(async () => {
  const s = await import('/src/core/sync.ts')
  return { configured: s.syncConfigured(), device: s.deviceId(), session: s.loadSession() }
})
check('sync is not offered when the build has no credentials',
  gated.configured === false, `syncConfigured=${gated.configured}`)
check('a device id is generated and stable', /^dev_/.test(gated.device), gated.device)
check('no session exists before signing in', gated.session === null)

// ── 8. Credential guard ────────────────────────────────────────────────────
// The anon and service_role keys are BOTH JWTs starting `eyJ`, of similar
// length, printed on the same dashboard page. Pasting the wrong one does not
// fail — sync works perfectly, while service_role bypasses row-level security
// and hands every visitor full access to every learner's data. Since the
// mistake is invisible, the app has to catch it instead of the person.
const guard = await page.evaluate(async () => {
  const s = await import('/src/core/sync.ts')
  // credentialProblem() reads build-time env, so the role check is exercised
  // through the same JWT decoding on synthetic keys shaped like the real ones.
  const b64 = o => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const jwt = role => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ iss: 'supabase', ref: 'abcdefghijklmnop', role })}.SIG`
  return { anonJwt: jwt('anon'), svcJwt: jwt('service_role'), fn: String(s.credentialProblem) }
})
check('anon and service_role keys are visually indistinguishable',
  guard.anonJwt.slice(0, 24) === guard.svcJwt.slice(0, 24),
  'same prefix — only the dashboard label tells them apart, which is why this guard exists')
// This deploy has NO credentials, so the guard must stay silent rather than
// nagging every learner who never set sync up.
const unconfigured = await page.evaluate(async () => {
  const s = await import('/src/core/sync.ts')
  return { problem: s.credentialProblem(), configured: s.syncConfigured() }
})
check('an unconfigured build reports no credential problem',
  unconfigured.problem === null && unconfigured.configured === false,
  `problem=${unconfigured.problem}`)

// Every shape a misconfigured deploy actually takes. credentialProblem() takes
// its two values as optional arguments purely so these can be exercised without
// a rebuild per case — the real call passes nothing and reads the baked-in env.
const URL_OK = 'https://abcdefghijklmnop.supabase.co'
const PUB_OK = 'sb_publishable_NZMm2h43jk8h6Yf3mib4Q'
const shapes = await page.evaluate(async ([url, pub]) => {
  const s = await import('/src/core/sync.ts')
  const b64 = o => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const jwt = role => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ iss: 'supabase', role })}.SIG`
  const p = (u, k) => s.credentialProblem(u, k)
  return {
    ok: p(url, pub),
    okLegacy: p(url, jwt('anon')),
    swapped: p(pub, url),
    keyInUrlSlotOnly: p(pub, pub),
    secret: p(url, 'sb_secret_abc123'),
    secretJwt: p(url, jwt('service_role')),
    secretInUrlSlot: p('sb_secret_abc123', pub),
    restPath: p(`${url}/rest/v1/`, pub),
    noUrl: p('', pub),
    noKey: p(url, ''),
    neither: p('', ''),
  }
}, [URL_OK, PUB_OK])

check('a correct publishable-key build passes the guard', shapes.ok === null, String(shapes.ok))
check('a correct legacy anon-key build passes the guard', shapes.okLegacy === null, String(shapes.okLegacy))
check('swapped URL and key are named as swapped, not as a bad URL',
  /swapped/i.test(shapes.swapped ?? ''), (shapes.swapped ?? '').slice(0, 70))
check('a key in the URL slot is caught even when the key slot is also a key',
  /swapped/i.test(shapes.keyInUrlSlotOnly ?? ''), (shapes.keyInUrlSlotOnly ?? '').slice(0, 70))
check('the secret key is refused', /SECRET/.test(shapes.secret ?? ''), (shapes.secret ?? '').slice(0, 50))
check('a service_role JWT is refused', /SECRET/.test(shapes.secretJwt ?? ''), (shapes.secretJwt ?? '').slice(0, 50))
check('a secret key is refused even in the URL slot, where it is published too',
  /SECRET/.test(shapes.secretInUrlSlot ?? ''), (shapes.secretInUrlSlot ?? '').slice(0, 50))
check('a URL with the Data API path still attached is rejected',
  /does not look like/i.test(shapes.restPath ?? ''), (shapes.restPath ?? '').slice(0, 60))
check('a missing URL names the URL variable', /VITE_SUPABASE_URL is missing/.test(shapes.noUrl ?? ''))
check('a missing key names the key variable', /VITE_SUPABASE_ANON_KEY is missing/.test(shapes.noKey ?? ''))
check('no credentials at all is silence, not a warning', shapes.neither === null)

check('zero uncaught page errors', pageErrors.length === 0,
  pageErrors.length ? pageErrors.slice(0, 3).join(' | ') : 'clean')

const failed = results.filter(r => !r.pass).length
console.log(`\n${results.length} assertions, ${failed} failed`)
await browser.close()
process.exit(failed ? 1 : 0)
