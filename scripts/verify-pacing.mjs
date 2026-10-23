// State-assertion play-test for the daily new-item budget.
//
// The budget exists to stop a learner taking a whole level in one sitting —
// that rhythm (one dense day, then three empty ones) was the original
// complaint. This suite pins the property that matters:
//
//   NO SEQUENCE OF LESSON VISITS IN ONE DAY MAY START MORE THAN
//   settings.newPerDay NEW ITEMS.
//
// It is a regression guard for a real bug: Lesson.tsx capped the queue with
// `.slice(0, budget)` but then fell back to the WHOLE LEVEL when that came back
// empty — so the cap held for the first visit of the day and evaporated on the
// second. A learner could take all 30 items of level 3 in one sitting, and then
// all of level 4 the moment the rolling frontier opened it.
//
// Usage: node scripts/verify-pacing.mjs   (needs a FRESHLY started dev server —
// Vite HMR splits the module graph after edits and the probes land on a second
// store instance.)
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:5173'
const KEY = 'chaienglish-v1'

const results = []
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`)
}

const consoleErrors = []

const snap = async page => {
  const raw = await page.evaluate(k => localStorage.getItem(k), KEY)
  return raw ? JSON.parse(raw).state : null
}

/** What the budget counts: items (never letters) first started today. */
const learnedToday = st => {
  const day = new Date().toISOString().slice(0, 10)
  return Object.values(st.progress ?? {})
    .filter(p => new Date(p.learnedAt).toISOString().slice(0, 10) === day).length
}

const store = async (page, fn, arg) =>
  page.evaluate(async ([src, a]) => {
    const m = await import('/src/core/store.ts')
    return new Function('m', 'a', `return (${src})(m, a)`)(m, a)
  }, [fn.toString(), arg ?? null])

/** Tap through one full Lesson visit for `levelN`; returns how it ended. */
async function runLesson(page, levelN, maxSteps = 500) {
  await store(page, m => m.useApp.getState().go('home'))
  await store(page, (m, n) => m.useApp.getState().openLevel(n), levelN)
  await page.waitForTimeout(300)

  for (let i = 0; i < maxSteps; i++) {
    if (await page.locator('[data-testid="lesson-nothing-new"]').count()) return 'capped'
    if (await page.locator('.lab-stagger').count() && await page.locator('button:has-text("กลับหน้าหลัก")').count()) return 'complete'

    const cta = page.locator('button.teach-cta')
    if (await cta.count()) { await cta.first().click(); await page.waitForTimeout(80); continue }

    // Quick-check card. Only enabled buttons are clickable — after a pick they
    // all disable while the feedback lingers (850ms right, 1900ms wrong).
    const choices = page.locator('.lab-choices button:not([disabled])')
    if (await choices.count()) {
      await choices.first().click().catch(() => {})
      await page.waitForTimeout(2100)
      continue
    }

    await page.waitForTimeout(150)
  }
  return 'timeout'
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(10_000)
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', e => consoleErrors.push(String(e)))

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.evaluate(k => localStorage.removeItem(k), KEY)
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)

// Reproduce the owner's situation exactly: lost progress, then dev-jumped to L3.
await store(page, async () => {
  const dev = await import('/src/core/dev.ts')
  dev.jumpToLevel(3)
})
await page.waitForTimeout(400)

let st = await snap(page)
const budget = st.settings.newPerDay
// Content-dependent: the whole suite drives real lessons, so it can only pass
// once src/data/levels/ has at least levels 1–4. Until then it reports the
// missing content here instead of crashing on an undefined level.
const level3Size = await store(page, async m => {
  const d = await import('/src/data/index.ts')
  return d.CURRICULUM.find(l => l.n === 3)?.itemIds.length ?? 0
})
check('setup: level 3 exists in the curriculum', level3Size > 0,
  level3Size ? `${level3Size} items` : 'no levels authored yet — every check below needs them')

check('setup: dev jump to level 3 unlocked it', st.maxUnlocked >= 3, `maxUnlocked=${st.maxUnlocked}`)
check('setup: jumped items are backdated and do not eat today\'s budget',
  learnedToday(st) === 0, `learnedToday=${learnedToday(st)} (must be 0)`)

// Content-dependent: with no level 3 the Lesson screen has nothing to open
// (it falls back to CURRICULUM[0], which does not exist either), so the visit
// loops below would only spin against an error. Report and skip them.
if (level3Size === 0) {
  const nc = 'content-dependent — no levels authored yet'
  for (const name of [
    'four lesson visits in one day never exceed newPerDay',
    'the cap was actually exercised, not idled past',
    'one day cannot start an entire level',
    'a second visit after the budget is spent offers nothing new',
    'frontier rolls to level 4 once every level-3 item is met',
    'the rolling frontier does not bypass the daily budget either',
  ]) check(name, false, nc)
} else {
  const before = learnedToday(st)

  // ── The property under test ────────────────────────────────────────────────
  // Four visits in the same simulated day. The first should hand over the daily
  // budget; every later one should hand over nothing.
  const outcomes = []
  for (let visit = 1; visit <= 4; visit++) {
    outcomes.push(await runLesson(page, 3))
    await page.waitForTimeout(150)
    st = await snap(page)
    const started = learnedToday(st) - before
    check(`visit ${visit}: cumulative new items today stays within newPerDay`,
      started <= budget, `started=${started}, newPerDay=${budget}, outcome=${outcomes[visit - 1]}`)
  }

  const totalToday = learnedToday(st) - before
  check('four lesson visits in one day never exceed newPerDay',
    totalToday <= budget, `total=${totalToday}, budget=${budget}`)
  check('the cap was actually exercised, not idled past',
    totalToday >= Math.min(budget, 1), `total=${totalToday}`)
  check('one day cannot start an entire level',
    totalToday < level3Size, `level 3 has ${level3Size} items, started ${totalToday} today`)
  check('a second visit after the budget is spent offers nothing new',
    outcomes.slice(1).every(o => o === 'capped'), `outcomes=${outcomes.join(',')}`)

  // ── The rolling frontier must not become a second way around the budget ────
  // Meeting every item up to the unlocked level rolls the learning frontier one
  // level ahead (by design). That must still be paced.
  await store(page, async m => {
    const d = await import('/src/data/index.ts')
    const s = m.useApp.getState()
    // Meet every remaining item at/below level 3, backdated so the budget is free.
    const back = Date.now() - 30 * 86400_000
    const progress = { ...s.progress }
    for (const lv of d.CURRICULUM.filter(l => l.n <= 3)) {
      for (const id of lv.itemIds.concat(lv.patternIds)) {
        if (!progress[id]) progress[id] = { stage: 4, due: Date.now() + 3600_000, correct: 5, incorrect: 0, streak: 5, learnedAt: back }
      }
    }
    m.useApp.setState({ progress })
  })
  await page.waitForTimeout(300)

  st = await snap(page)
  const base2 = learnedToday(st)
  const frontier = await store(page, m => m.learningFrontier(m.useApp.getState()))
  check('frontier rolls to level 4 once every level-3 item is met', frontier === 4, `frontier=${frontier}`)

  for (let visit = 1; visit <= 3; visit++) await runLesson(page, 4)
  st = await snap(page)
  const startedL4 = learnedToday(st) - base2
  check('the rolling frontier does not bypass the daily budget either',
    startedL4 <= budget, `started on level 4 today=${startedL4}, budget=${budget}`)
}

check('zero console errors during the whole run', consoleErrors.length === 0,
  consoleErrors.length ? consoleErrors.slice(0, 3).join(' | ') : 'clean')

const failed = results.filter(r => !r.pass).length
console.log(`\n${results.length} assertions, ${failed} failed`)
await browser.close()
process.exit(failed ? 1 : 0)
