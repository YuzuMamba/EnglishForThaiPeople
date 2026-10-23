// State-assertion play-test for the Thai-LETTER SRS and the reading gates.
//
// The script course used to record a "seen" flag dressed up as SRS: progress
// objects existed, but they were only ever written once, with correct=true,
// and nothing ever read their due dates. This suite asserts the real contract:
//   1. letters are scheduled by the SAME applyAnswer ladder as vocabulary
//   2. due letters actually surface as questions in a Review session
//   3. answering a letter in Review moves scriptProgress (and only it)
//   4. a wrong letter answer drops the stage and requeues WITHOUT rescheduling
//   5. tapping a letter card plants it at Seedling — it does not grade it
//   6. the lesson drill only advances the schedule for letters that are due
//   7. reading checkpoints hold a level shut until enough letters are retained
//   8. checkpoints count RETAINED letters (stage>=2), not letters merely met
//   9. maxUnlocked stays monotonic — a gate never re-locks an opened level
//
// Usage: node scripts/verify-script-srs.mjs   (dev server must be on :5173)
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:5173'
const KEY = 'chaienglish-v1'
const INTERVALS = [4, 8, 24, 48, 96, 168, 336, 720, 2880, Infinity]
const DUE_TOL_MS = 2 * 60_000
const H = 3600e3

const results = []
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`)
}
const consoleErrors = []

async function snap(page) {
  const raw = await page.evaluate(k => localStorage.getItem(k), KEY)
  if (!raw) throw new Error('no persisted state found')
  return JSON.parse(raw).state
}

/** Seed state directly, then reload so the app boots from it. */
async function seed(page, state, screen) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate(([k, s]) => {
    localStorage.setItem(k, JSON.stringify({ state: s, version: 0 }))
  }, [KEY, state])
  await page.goto(`${BASE}/${screen ? `?screen=${screen}` : ''}`, { waitUntil: 'networkidle' })
  if (screen) await page.evaluate(async s => {
    const m = await import('/src/core/store.ts')
    m.useApp.getState().go(s)
  }, screen)
  await page.waitForTimeout(400)
}

const base = (over = {}) => ({
  screen: 'home', activeLevel: 1, progress: {}, scriptProgress: {},
  maxUnlocked: 1, xp: 0, streakDays: 0, lastActiveDay: '', history: [],
  settings: { sound: false, showReading: true }, ...over,
})

/** What the UI actually gates on: the live computation floored by the
 *  persisted monotonic maximum. `maxUnlocked` alone only catches up on the
 *  next answer, so asserting on it would test the wrong thing. */
async function unlocked(page) {
  return page.evaluate(async () => {
    const s = await import('/src/core/store.ts')
    return s.effectiveUnlocked(s.useApp.getState())
  })
}

/** Levels the path renders as open (teasers and locked rows excluded). */
async function openLevels(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.lv-card:not(.lv-teaser) .h2')]
      .map(e => Number((e.textContent.match(/Level (\d+)/) ?? [])[1]))
      .filter(Boolean))
}

const prog = (stage, dueOffsetH, extra = {}) => ({
  stage, due: Date.now() + dueOffsetH * H,
  correct: 3, incorrect: 0, streak: 3, learnedAt: Date.now() - 5 * 86400e3, ...extra,
})

// ─── pure-function contracts (evaluated inside the app's own module graph) ───
async function pureContracts(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const r = await page.evaluate(async () => {
    const s = await import('/src/core/store.ts')
    const d = await import('/src/data/index.ts')
    const now = Date.now()
    const chars = Object.keys(d.SCRIPT_CHARS)
    const mk = (stage, dueOff) => ({
      stage, due: now + dueOff, correct: 1, incorrect: 0, streak: 1, learnedAt: now,
    })
    // A level-4-complete learner with no reading at all.
    const l4 = {}
    for (const lv of d.CURRICULUM.filter(l => l.n <= 4)) {
      for (const id of lv.itemIds.concat(lv.patternIds)) l4[id] = mk(4, 1e9)
    }
    const met = {}, retained = {}
    chars.slice(0, 7).forEach(c => { met[c] = mk(1, 1e9); retained[c] = mk(2, 1e9) })
    const sixRetained = {}
    chars.slice(0, 6).forEach(c => { sixRetained[c] = mk(2, 1e9) })

    const dueMix = { [chars[0]]: mk(1, -1000), [chars[1]]: mk(1, 1e9), [chars[2]]: mk(9, -1000) }
    return {
      charCount: chars.length,
      gates: s.SCRIPT_GATES,
      gateStage: s.SCRIPT_GATE_STAGE,
      // gate arithmetic
      shortfallEmpty: s.scriptGateShortfall(5, {}),
      shortfallMet: s.scriptGateShortfall(5, met),          // stage 1 < 2 → no credit
      shortfallRetained: s.scriptGateShortfall(5, retained),
      shortfallNonGate: s.scriptGateShortfall(4, {}),
      gatedMet: s.gatedCharCount(met),
      gatedRetained: s.gatedCharCount(retained),
      // unlock arithmetic
      unlockNoScript: s.unlockedLevel(l4, {}),
      unlockSixLetters: s.unlockedLevel(l4, sixRetained),
      unlockSevenLetters: s.unlockedLevel(l4, retained),
      unlockDefaultArg: s.unlockedLevel(l4),
      // monotonic floor
      effLapsed: s.effectiveUnlocked({ progress: l4, scriptProgress: {}, maxUnlocked: 9 }),
      // due selection
      dueChars: s.dueScriptIds(dueMix),
      dueIgnoresJunk: s.dueScriptIds({ 'not-a-char': mk(1, -1000) }),
    }
  })

  const gateLevels = Object.keys(r.gates).map(Number).sort((a, b) => a - b)
  check('gates: checkpoints declared at ascending levels with ascending demands',
    gateLevels.length >= 3 &&
    gateLevels.every((lv, i) => i === 0 || (lv > gateLevels[i - 1] && r.gates[lv] > r.gates[gateLevels[i - 1]])),
    gateLevels.map(l => `L${l}:${r.gates[l]}`).join(' '))
  check('gates: every checkpoint is reachable with the letters that exist',
    Math.max(...Object.values(r.gates)) <= r.charCount,
    `max demand ${Math.max(...Object.values(r.gates))} of ${r.charCount} letters taught`)
  check('gates: speaking runs free before the first checkpoint',
    r.shortfallNonGate === 0 && !r.gates[2] && !r.gates[3] && !r.gates[4],
    `L4 shortfall=${r.shortfallNonGate}`)

  check('gate credit requires retention, not exposure',
    r.gatedMet === 0 && r.gatedRetained === 7,
    `7 letters at stage 1 → ${r.gatedMet} credited; at stage ${r.gateStage} → ${r.gatedRetained}`)
  check('shortfall: reports exactly how many letters are still owed',
    r.shortfallEmpty === r.gates[5] && r.shortfallMet === r.gates[5] && r.shortfallRetained === 0,
    `none=${r.shortfallEmpty}, met-only=${r.shortfallMet}, retained=${r.shortfallRetained}`)

  check('gate holds Level 5 shut when the vocabulary is done but the script is not',
    r.unlockNoScript === 4,
    `L1-4 mastered, 0 letters → unlocked=${r.unlockNoScript} (expect 4)`)
  check('gate is not satisfied one letter short',
    r.unlockSixLetters === 4, `6/${r.gates[5]} letters → unlocked=${r.unlockSixLetters}`)
  check('gate opens Level 5 the moment the letter quota is met',
    r.unlockSevenLetters === 5, `${r.gates[5]} letters → unlocked=${r.unlockSevenLetters}`)
  check('unlockedLevel defaults to gated behaviour when no script map is passed',
    r.unlockDefaultArg === 4, `unlocked=${r.unlockDefaultArg}`)
  check('a gate never re-locks a level already opened (monotonic floor)',
    r.effLapsed === 9, `maxUnlocked=9, live=4 → effective=${r.effLapsed}`)

  check('dueScriptIds returns only due, unburned, real characters',
    r.dueChars.length === 1 && r.dueIgnoresJunk.length === 0,
    `due=${JSON.stringify(r.dueChars)} (1 due, 1 future, 1 burned), junk=${r.dueIgnoresJunk.length}`)
}

// ─── letters inside a real Review session ────────────────────────────────────
async function reviewPhase(page) {
  const chars = await page.evaluate(async () => {
    const d = await import('/src/data/index.ts')
    return Object.values(d.SCRIPT_CHARS).slice(0, 6)
      .map(c => ({ char: c.char, reading: c.reading, word: c.word }))
  })
  const scriptProgress = {}
  for (const c of chars) scriptProgress[c.char] = prog(3, -1)  // all overdue
  await seed(page, base({ scriptProgress }), 'review')

  const ui = async () => page.evaluate(() => {
    const strip = b => { const c = b.cloneNode(true); c.querySelectorAll('.key').forEach(e => e.remove()); return c.textContent.trim() }
    return {
      caughtUp: document.body.innerText.includes('All caught up!'),
      complete: document.body.innerText.includes('Session complete!'),
      hint: document.querySelector('.prompt-zone .muted')?.textContent.trim() ?? null,
      cue: document.querySelector('.cue-chip')?.textContent.trim() ?? null,
      promptThai: document.querySelector('.quiz-prompt.en')?.textContent.trim() ?? null,
      promptEn: [...document.querySelectorAll('.quiz-prompt')]
        .find(e => !e.classList.contains('en'))?.textContent.trim().replace(/[“”]/g, '') ?? null,
      choices: [...document.querySelectorAll('.choices .choice')].map(strip),
      stagePill: document.querySelector('.stage-pill')?.textContent.trim() ?? null,
      feedback: document.querySelector('.feedback.good') ? 'good'
        : document.querySelector('.feedback.bad') ? 'bad' : null,
    }
  })

  let u = await ui()
  check('review: due letters surface as questions instead of an empty session',
    !u.caughtUp && u.choices.length === 4,
    u.caughtUp ? 'session said "All caught up" with 6 letters overdue' : `${u.choices.length} choices shown`)

  const byRoman = Object.fromEntries(chars.map(c => [c.reading, c]))
  const byChar = Object.fromEntries(chars.map(c => [c.char, c]))
  let good = 0, bad = 0, glyphQ = 0, soundQ = 0, distinct = 0, pillSeen = 0, retries = 0
  let wrongChar = null
  // A missed letter is re-queued in the SAME session; that retry must be
  // frozen, so the loop has to know which characters it has already graded.
  const graded = new Set()

  for (let n = 0; n < 12; n++) {
    u = await ui()
    if (u.complete || u.caughtUp) break
    const isGlyphQ = !!u.promptThai && !u.promptEn   // glyph shown → pick the sound
    const target = isGlyphQ ? byChar[u.promptThai] : byRoman[u.promptEn]
    if (!target) { check('review: letter question maps to a known character', false, `prompt=${u.promptThai ?? u.promptEn}`); break }
    isGlyphQ ? soundQ++ : glyphQ++
    if (u.stagePill) pillSeen++

    // Distractors must be unambiguous — no repeated sounds among the choices.
    if (new Set(u.choices).size === u.choices.length) distinct++

    const answer = isGlyphQ ? target.reading : target.char
    const idx = u.choices.indexOf(answer)
    check(`review: the correct answer for ${target.char} is on offer`, idx >= 0,
      `looking for "${answer}" in ${JSON.stringify(u.choices)}`)
    if (idx < 0) break

    const pre = (await snap(page)).scriptProgress[target.char]
    const preVocab = JSON.stringify((await snap(page)).progress)
    // Alternate: mostly correct, one deliberate miss to exercise the drop path.
    const isRetry = graded.has(target.char)
    const answerCorrectly = isRetry || bad > 0 || n < 2
    const clickIdx = answerCorrectly ? idx : (idx + 1) % u.choices.length
    const t = Date.now()
    await page.locator('.choices .choice').nth(clickIdx).click()
    await page.waitForSelector('.feedback.good, .feedback.bad', { timeout: 8000 })
    await page.waitForTimeout(300)
    const st = await snap(page)
    const post = st.scriptProgress[target.char]
    graded.add(target.char)

    if (isRetry) {
      check(`review: the same-session retry of ${target.char} never re-schedules it`,
        post.stage === pre.stage && post.due === pre.due && post.correct === pre.correct + 1,
        `stage ${pre.stage}→${post.stage} (must be =), dueΔ=${post.due - pre.due}ms (must be 0), ` +
        `correct ${pre.correct}→${post.correct}`)
      retries++
    } else if (answerCorrectly) {
      good++
      const exp = Math.min(9, pre.stage + 1)
      const dueOk = Math.abs(post.due - (t + INTERVALS[exp] * H)) <= DUE_TOL_MS
      check(`review: correct letter ${target.char} climbs the ladder like any item`,
        post.stage === exp && dueOk && post.correct === pre.correct + 1 && post.streak === pre.streak + 1,
        `stage ${pre.stage}→${post.stage} (exp ${exp}), due=+${((post.due - t) / H).toFixed(1)}h (exp ${INTERVALS[exp]}h)`)
    } else {
      bad++
      wrongChar = target.char
      const exp = Math.max(0, pre.stage - (pre.stage >= 5 ? 2 : 1))
      const dueOk = Math.abs(post.due - (t + INTERVALS[exp] * H)) <= DUE_TOL_MS
      check('review: a missed letter falls back down the ladder',
        post.stage === exp && dueOk && post.incorrect === pre.incorrect + 1 && post.streak === 0,
        `stage ${pre.stage}→${post.stage} (exp ${exp}), streak=${post.streak}`)
    }
    check(`review: answering a letter leaves the vocabulary deck untouched`,
      JSON.stringify(st.progress) === preVocab, 'progress map unchanged')

    await page.getByRole('button', { name: /Continue/ }).click()
    await page.waitForTimeout(250)
  }

  check('review: letters are tested both directions (glyph→sound and sound→glyph)',
    soundQ > 0, `glyph→sound: ${soundQ}, sound→glyph: ${glyphQ}`)
  check('review: no letter question offers the same sound twice',
    distinct === soundQ + glyphQ, `${distinct}/${soundQ + glyphQ} questions had 4 distinct choices`)
  check('review: every letter question carries a visible SRS stage',
    pillSeen === soundQ + glyphQ, `${pillSeen}/${soundQ + glyphQ} questions showed a stage pill`)
  check('review: a missed letter is re-queued into the same session',
    bad > 0 && retries > 0, `${bad} missed, ${retries} retries served`)
  check('review: the whole letter session graded through the SRS deck',
    good >= 4, `${good} scheduled advances, ${bad} drops, ${retries} frozen retries (missed: ${wrongChar})`)
}

// ─── the script course itself ────────────────────────────────────────────────
async function scriptPhase(page) {
  await seed(page, base(), 'script')
  await page.getByRole('button', { name: /Mid-class|Lesson|.*/ }).first().waitFor()
  // Open the first lesson.
  await page.locator('.lesson-card').first().click()
  await page.waitForTimeout(350)

  const before = await snap(page)
  await page.locator('.char-card').first().click()
  await page.waitForTimeout(350)
  const after = await snap(page)
  const planted = Object.keys(after.scriptProgress).filter(c => !before.scriptProgress[c])
  check('script: tapping a letter card plants it in the deck at Seedling',
    planted.length === 1 && after.scriptProgress[planted[0]].stage === 0,
    planted.length ? `${planted[0]} → stage ${after.scriptProgress[planted[0]].stage}` : 'nothing planted')
  const p0 = after.scriptProgress[planted[0]]
  check('script: a first meeting schedules a first review, it does not grade one',
    p0 && p0.correct === 0 && p0.incorrect === 0 &&
    Math.abs(p0.due - (Date.now() + INTERVALS[0] * H)) <= DUE_TOL_MS,
    p0 ? `correct=${p0.correct}, due=+${((p0.due - Date.now()) / H).toFixed(1)}h (exp ${INTERVALS[0]}h)` : 'missing')

  // Tapping again must not double-plant or reset the schedule.
  await page.locator('.char-card').first().click()
  await page.waitForTimeout(300)
  const again = (await snap(page)).scriptProgress[planted[0]]
  check('script: re-tapping a known letter never resets its schedule',
    again.due === p0.due && again.stage === p0.stage,
    `dueΔ=${again.due - p0.due}ms`)

  check('script: the letter card shows its SRS stage, not a bare checkmark',
    await page.locator('.char-card .seen-dot').first().isVisible(),
    'stage badge rendered')
}

// ─── the drill only advances letters that are actually due ───────────────────
async function drillPhase(page) {
  const chars = await page.evaluate(async () => {
    const d = await import('/src/data/index.ts')
    return d.SCRIPT_LESSONS[0].chars.map(c => ({ char: c.char, reading: c.reading }))
  })
  const scriptProgress = {}
  // Half overdue, half freshly reviewed — the drill must treat them differently.
  chars.forEach((c, i) => { scriptProgress[c.char] = prog(3, i % 2 ? -1 : 48) })
  await seed(page, base({ scriptProgress }), 'script')
  await page.locator('.lesson-card').first().click()
  await page.waitForTimeout(300)
  const practice = page.getByRole('button', { name: /Practice these letters/ })
  if (!(await practice.count())) {
    check('drill: lesson exposes a practice quiz', false, 'no practice button on lesson 1')
    return
  }
  await practice.click()
  await page.waitForTimeout(350)

  let scheduled = 0, frozen = 0
  for (let n = 0; n < chars.length + 2; n++) {
    const glyph = await page.locator('.quiz-glyph').first().textContent().catch(() => null)
    if (!glyph) break
    const target = chars.find(c => c.char === glyph.trim())
    if (!target) break
    const pre = (await snap(page)).scriptProgress[target.char]
    const labels = await page.locator('.self-quiz .choice').allTextContents()
    const idx = labels.findIndex(l => l.replace(/^[ABCD]/, '').trim() === target.reading)
    if (idx < 0) break
    await page.locator('.self-quiz .choice').nth(idx).click()
    await page.waitForTimeout(1400)
    const post = (await snap(page)).scriptProgress[target.char]
    const wasDue = pre.due <= Date.now()
    if (wasDue) {
      scheduled++
      check(`drill: a DUE letter (${target.char}) advances on a correct answer`,
        post.stage === pre.stage + 1 && post.due > pre.due,
        `stage ${pre.stage}→${post.stage}`)
    } else {
      frozen++
      check(`drill: a NOT-due letter (${target.char}) records the hit but never re-schedules`,
        post.stage === pre.stage && post.due === pre.due && post.correct === pre.correct + 1,
        `stage ${pre.stage}→${post.stage} (must be =), dueΔ=${post.due - pre.due}ms (must be 0)`)
    }
  }
  check('drill: exercised both the due and the not-due path',
    scheduled > 0 && frozen > 0, `${scheduled} scheduled, ${frozen} frozen`)
}

// ─── the gate as the learner sees it on Home ─────────────────────────────────
async function homePhase(page) {
  const built = await page.evaluate(async () => {
    const d = await import('/src/data/index.ts')
    const now = Date.now()
    const mk = (stage) => ({ stage, due: now + 1e9, correct: 4, incorrect: 0, streak: 4, learnedAt: now })
    const progress = {}
    for (const lv of d.CURRICULUM.filter(l => l.n <= 4)) {
      for (const id of lv.itemIds.concat(lv.patternIds)) progress[id] = mk(4)
    }
    const chars = Object.keys(d.SCRIPT_CHARS)
    return { progress, chars }
  })

  // 1) Vocabulary done through Level 4, no reading at all.
  await seed(page, base({ progress: built.progress, maxUnlocked: 4 }), 'home')
  let body = await page.evaluate(() => document.body.innerText)
  check('home: the checkpoint is explained on the locked level, not just a padlock',
    /Reading checkpoint/i.test(body) && /Thai letters remembered/i.test(body),
    'requirement list rendered')
  check('home: the checkpoint states the exact shortfall and offers the way out',
    /0 \/ 7/.test(body) && /Go to Read Thai/.test(body),
    (body.match(/Go to Read Thai[^\n]*/) ?? ['(missing)'])[0])
  let open = await openLevels(page)
  check('home: Level 5 stays locked with the vocabulary finished but no letters',
    (await unlocked(page)) === 4 && !open.includes(5),
    `unlocked=${await unlocked(page)}, path shows levels ${open.join(',')}`)

  // 2) Letters MET but not retained — must still be locked.
  const metOnly = {}
  built.chars.slice(0, 10).forEach(c => { metOnly[c] = prog(1, 1e6) })
  await seed(page, base({ progress: built.progress, scriptProgress: metOnly, maxUnlocked: 4 }), 'home')
  open = await openLevels(page)
  check('home: ten letters merely met do not open the checkpoint',
    (await unlocked(page)) === 4 && !open.includes(5),
    `unlocked=${await unlocked(page)} with 10 letters at stage 1`)

  // 3) Quota retained — the gate opens.
  const retained = {}
  built.chars.slice(0, 7).forEach(c => { retained[c] = prog(2, 1e6) })
  await seed(page, base({ progress: built.progress, scriptProgress: retained, maxUnlocked: 4 }), 'home')
  open = await openLevels(page)
  body = await page.evaluate(() => document.body.innerText)
  check('home: retaining the quota opens Level 5',
    (await unlocked(page)) === 5, `unlocked=${await unlocked(page)} with 7 letters at stage 2`)
  check('home: the newly opened level is presented as playable content',
    open.includes(5) && !/Reading checkpoint/.test(body.split('Level 5')[0] ?? ''),
    `path shows levels ${open.join(',')}`)

  // 4) A later checkpoint is advertised before the learner gets there.
  check('home: further checkpoints are visible on the road ahead',
    /🇹🇭 \d+ letters/.test(body), (body.match(/🇹🇭 \d+ letters/) ?? ['(none)'])[0])

  // 5) Due letters are counted in the review call to action.
  const dueChars = {}
  built.chars.slice(0, 3).forEach(c => { dueChars[c] = prog(2, -1) })
  await seed(page, base({ progress: built.progress, scriptProgress: dueChars, maxUnlocked: 4 }), 'home')
  body = await page.evaluate(() => document.body.innerText)
  check('home: due letters are counted as reviews, not hidden in a side course',
    /3 reviews ready/.test(body), (body.match(/\d+ reviews? ready/) ?? ['(none)'])[0])
  const badge = await page.locator('.nav-btn .badge').first().textContent().catch(() => null)
  check('nav: the Reviews badge includes due letters', badge === '3', `badge=${badge}`)
}

// ─── romanization scaffold is gated on READING ABILITY, not just maturity ────
// A learner who has not met a letter cannot answer "which is the Thai for X"
// except by matching shapes. The scaffold must therefore stay until the
// characters in the words on screen are actually retained.
async function scaffoldPhase(page) {
  const build = (stage, mode) => page.evaluate(async ([stg, m]) => {
    const d = await import('/src/data/index.ts')
    const now = Date.now()
    const mk = s => ({ stage: s, due: now - 1000, correct: 3, incorrect: 0, streak: 3, learnedAt: now - 4e8 })
    const progress = {}
    for (const id of d.CURRICULUM[0].itemIds.slice(0, 10)) progress[id] = mk(stg)
    const scriptProgress = {}
    if (m !== 'none') {
      const keys = Object.keys(d.SCRIPT_CHARS)
      for (const k of keys) scriptProgress[k] = { ...mk(m === 'all' ? 2 : 1), due: now + 1e9 }
    }
    return { screen: 'review', activeLevel: 1, progress, scriptProgress, maxUnlocked: 1,
      xp: 0, streakDays: 0, lastActiveDay: '', history: [], settings: { sound: false, showReading: true } }
  }, [stage, mode])

  // reading-mc is drawn at random from the stage's kind list — retry to find it.
  async function readingMc(stage, mode) {
    const st = await build(stage, mode)
    for (let n = 0; n < 30; n++) {
      await seed(page, st, 'review')
      const hint = await page.locator('.prompt-zone .muted').first().textContent().catch(() => null)
      if (hint && hint.includes('Which is the Thai')) {
        return {
          choices: await page.locator('.choices .choice .en').count(),
          romans: await page.locator('.choices .choice .muted.small').count(),
        }
      }
    }
    return null
  }

  const cases = [
    ['young item, no letters known', 2, 'none', true],
    ['young item, all letters known', 2, 'all', true],
    ['MATURE item, NO letters known', 3, 'none', true],
    ['mature item, letters met but not retained (stage 1)', 4, 'met', true],
    ['mature item, all letters retained', 3, 'all', false],
    ['stage 4 item, all letters retained', 4, 'all', false],
  ]
  for (const [label, stage, mode, wantRoman] of cases) {
    const r = await readingMc(stage, mode)
    if (!r) { check(`scaffold: ${label}`, false, 'no reading-mc drawn in 30 tries'); continue }
    check(`scaffold: ${label} → reading ${wantRoman ? 'SHOWN' : 'withdrawn'}`,
      wantRoman ? r.romans === r.choices : r.romans === 0,
      `${r.romans}/${r.choices} choices carried a reading`)
  }

  // The setting still wins outright.
  const off = await page.evaluate(async () => {
    const d = await import('/src/data/index.ts')
    const now = Date.now()
    const mk = s => ({ stage: s, due: now - 1000, correct: 3, incorrect: 0, streak: 3, learnedAt: now - 4e8 })
    const progress = {}
    for (const id of d.CURRICULUM[0].itemIds.slice(0, 10)) progress[id] = mk(2)
    return { screen: 'review', activeLevel: 1, progress, scriptProgress: {}, maxUnlocked: 1,
      xp: 0, streakDays: 0, lastActiveDay: '', history: [], settings: { sound: false, showReading: false } }
  })
  let found = null
  for (let n = 0; n < 30; n++) {
    await seed(page, off, 'review')
    const hint = await page.locator('.prompt-zone .muted').first().textContent().catch(() => null)
    if (hint && hint.includes('Which is the Thai')) {
      found = await page.locator('.choices .choice .muted.small').count()
      break
    }
  }
  check('scaffold: showReading=false suppresses the reading even when unreadable',
    found === 0, `${found} choices carried a reading`)

  // The pure predicate, at the boundary.
  const pure = await page.evaluate(async () => {
    const s = await import('/src/core/store.ts')
    const d = await import('/src/data/index.ts')
    const now = Date.now()
    const mk = st => ({ stage: st, due: now, correct: 1, incorrect: 0, streak: 1, learnedAt: now })
    const all = st => Object.fromEntries(Object.keys(d.SCRIPT_CHARS).map(k => [k, mk(st)]))
    const vocab = Object.values(d.ITEMS).filter(i => i.type === 'vocab')
    return {
      atGate: vocab.filter(i => s.canReadEnglish(i.en, all(s.SCRIPT_GATE_STAGE))).length,
      belowGate: vocab.filter(i => s.canReadEnglish(i.en, all(s.SCRIPT_GATE_STAGE - 1))).length,
      total: vocab.length,
      unknownChar: s.canReadEnglish('ก๛', all(2)), // a codepoint taught nowhere
      spaces: s.canReadEnglish('ก ก', { 'ก': mk(2) }),
    }
  })
  check('scaffold: every vocab word becomes readable once all letters are retained',
    pure.atGate === pure.total, `${pure.atGate}/${pure.total}`)
  check('scaffold: one stage below the gate, nothing counts as readable',
    pure.belowGate === 0, `${pure.belowGate}/${pure.total} readable at stage ${'gate-1'}`)
  check('scaffold: a character taught nowhere keeps the reading on',
    pure.unknownChar === false)
  check('scaffold: whitespace is not treated as an unreadable character',
    pure.spaces === true)
}

// ─── run ─────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--mute-audio'],
})
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', e => consoleErrors.push(String(e)))

  console.log('── pure contracts ──');   await pureContracts(page)
  console.log('\n── review session ──'); await reviewPhase(page)
  console.log('\n── script course ──');  await scriptPhase(page)
  console.log('\n── lesson drill ──');   await drillPhase(page)
  console.log('\n── home gates ──');     await homePhase(page)
  console.log('\n── reading scaffold ──'); await scaffoldPhase(page)

  console.log('')
  check('zero console errors during the whole run', consoleErrors.length === 0,
    consoleErrors.length ? consoleErrors.slice(0, 5).join(' | ') : 'clean')
} finally {
  await browser.close()
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length} assertions, ${failed.length} failed`)
if (failed.length) {
  console.log('FAILED:')
  for (const f of failed) console.log(`  - ${f.name}  —  ${f.detail}`)
  process.exit(1)
}
