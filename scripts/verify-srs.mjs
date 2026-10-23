// End-to-end STATE-ASSERTION play-test for the ChaiEnglish SRS engine.
//
// Plays the real UI (review / builder / listening) against the dev server and
// asserts every persisted state transition in localStorage['chaienglish-v1']:
//   1. correct review answers advance exactly one SRS stage with the right due
//   2. wrong answers drop 1 (or 2 from stage>=5) stages
//   3. same-session requeues NEVER move stage/due (schedule=false path)
//   4. Builder first-Check on a non-due pattern never moves stage/due
//   5. maxUnlocked is monotonic
//   6. Listening XP is granted once per exercise id
//   7. the typed-English matcher: word order, contractions, a forgiven leading
//      article, one slip in a long word, and negation that never crosses
//   8. zero console errors
//
// Everything that plays the UI is content-dependent — the demo seed, the
// distractor pool, the Builder meter and the Listening cycle all walk the
// real levels — so those phases report the missing content until
// src/data/levels/ is authored. The typed-English matcher and the quiz-kind
// ladder are pure and pass on the engine alone.
//
// Usage: node scripts/verify-srs.mjs
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:5173'
const KEY = 'chaienglish-v1'
const INTERVALS = [4, 8, 24, 48, 96, 168, 336, 720, 2880, Infinity] // SRS_INTERVALS_H
const STAGE_NAMES = [ // SRS_STAGE_NAMES — Thai, garden metaphor kept
  'เมล็ด', 'งอก', 'ต้นอ่อน', 'หยั่งราก',
  'ออกดอก', 'แข็งแรง', 'หยั่งลึก', 'ทอง', 'ยืนต้น', 'ฝังใจ',
]
const DUE_TOL_MS = 2 * 60_000

// ─── assertion bookkeeping ───────────────────────────────────────────────────
const results = []
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`)
}

const consoleErrors = []

// ─── snapshot helpers ────────────────────────────────────────────────────────
async function snap(page) {
  const raw = await page.evaluate(k => localStorage.getItem(k), KEY)
  if (!raw) throw new Error('no persisted state found')
  return JSON.parse(raw).state
}

function progressDelta(pre, post) {
  const ids = new Set([...Object.keys(pre), ...Object.keys(post)])
  return [...ids].filter(id => JSON.stringify(pre[id]) !== JSON.stringify(post[id]))
}

const hrs = (ms) => (ms / 3600e3).toFixed(2)

/** Full scheduled applyAnswer contract: stage move + due re-anchor + stats. */
function assertScheduled(label, pre, post, outcome, tClick) {
  const s0 = pre.stage
  const correct = outcome === 'good'
  const expStage = correct
    ? Math.min(9, s0 + 1)
    : Math.max(0, s0 - (s0 >= 5 ? 2 : 1))
  const h = INTERVALS[expStage]
  const dueOk = h === Infinity
    ? post.due === Number.MAX_SAFE_INTEGER
    : Math.abs(post.due - (tClick + h * 3600e3)) <= DUE_TOL_MS
  const statsOk = correct
    ? post.correct === pre.correct + 1 && post.incorrect === pre.incorrect && post.streak === pre.streak + 1
    : post.correct === pre.correct && post.incorrect === pre.incorrect + 1 && post.streak === 0
  check(label, post.stage === expStage && dueOk && statsOk,
    `${outcome === 'good' ? 'correct' : 'wrong'}: stage ${s0}→${post.stage} (exp ${expStage}), ` +
    `due=now+${hrs(post.due - tClick)}h (exp ${h}h), stats ok=${statsOk}`)
}

/** schedule=false contract: stage/due frozen, only counters move. */
function assertFrozen(label, pre, post, outcome) {
  const frozen = post.stage === pre.stage && post.due === pre.due && post.learnedAt === pre.learnedAt
  const correct = outcome === 'good'
  const statsOk = correct
    ? post.correct === pre.correct + 1 && post.incorrect === pre.incorrect && post.streak === pre.streak + 1
    : post.correct === pre.correct && post.incorrect === pre.incorrect + 1 && post.streak === 0
  check(label, frozen && statsOk,
    `${correct ? 'correct' : 'wrong'}: stage ${pre.stage}→${post.stage} (must be =), ` +
    `dueΔ=${post.due - pre.due}ms (must be 0), stats ok=${statsOk}`)
}

// ─── maxUnlocked monotonicity (within each demo-seeded page load) ────────────
const unlockTrail = []
function trackUnlock(phase, st) { unlockTrail.push({ phase, v: st.maxUnlocked }) }

// ─── quiz-kind ladder: {id, kind, stage} for every vocabulary card served ────
const kindTrail = []

// ─── app data (imported through the vite dev server) ─────────────────────────
async function loadData(page) {
  return await page.evaluate(async () => {
    const m = await import('/src/data/index.ts')
    const items = {}
    for (const [id, it] of Object.entries(m.ITEMS)) {
      items[id] = {
        id, en: it.en, th: it.th, reading: it.reading, altEn: it.altEn ?? [],
        audioHint: it.audioHint ?? null,
      }
    }
    const patterns = {}
    for (const [id, p] of Object.entries(m.PATTERNS)) {
      patterns[id] = {
        id, name: p.name, enTemplate: p.enTemplate, thTemplate: p.thTemplate,
        slots: p.slots, thOverrides: p.thOverrides ?? null,
      }
    }
    const listening = m.LISTENING.map(ex => ({
      id: ex.id, level: ex.level, question: ex.question, choices: ex.choices, answer: ex.answer,
    }))
    return { items, patterns, listening }
  })
}

// ─── sentence oracle (mirrors core/generate.ts deterministically) ────────────
// A round shows a THAI meaning and asks for the ENGLISH tiles. The oracle
// rebuilds the Thai a pattern + fills renders, and the English tokens that
// build it; English tokens are joined with ' ' everywhere (CLAUDE.md §2).
function cleanTh(raw) {
  let s = raw.split('/')[0].trim()
  s = s.replace(/\s*\(.*?\)\s*/g, ' ').trim()
  return s
}
function thaiFor(pattern, fills, items) {
  const filledIds = pattern.slots.map(s => fills[s.name]).filter(Boolean)
  const ov = pattern.thOverrides
  const override = ov?.[filledIds.join('+')] ?? (filledIds.length === 1 ? ov?.[filledIds[0]] : undefined)
  if (override != null) return override
  return pattern.thTemplate
    .replace(/\{(\w+)\}/g, (_, slot) => {
      const id = fills[slot]
      return id ? cleanTh(items[id]?.th ?? '') : ''
    })
    .replace(/\s+/g, ' ').replace(/\s+([,.?!])/g, '$1').trim()
}
function tokensFor(pattern, fills, items) {
  const tokens = []
  for (const part of pattern.enTemplate.split(/\s+/)) {
    const m = part.match(/^\{(\w+)\}$/)
    if (m) { const id = fills[m[1]]; if (id) tokens.push(items[id]?.en ?? '') }
    else tokens.push(part)
  }
  return tokens
}
/** Find the token sequence for a displayed round (Thai meaning + tray tiles). */
function solveAssemble(patternList, items, meaning, trayLabels) {
  for (const pattern of patternList) {
    const optionLists = pattern.slots.map(s => (s.optional ? ['', ...s.itemIds] : s.itemIds))
    let combos = [[]]
    for (const opts of optionLists) combos = combos.flatMap(c => opts.map(o => [...c, o]))
    for (const combo of combos) {
      const fills = {}
      pattern.slots.forEach((s, i) => { fills[s.name] = combo[i] })
      if (thaiFor(pattern, fills, items) !== meaning) continue
      const toks = tokensFor(pattern, fills, items)
      const pool = [...trayLabels]
      let ok = true
      for (const t of toks) {
        const at = pool.indexOf(t)
        if (at < 0) { ok = false; break }
        pool.splice(at, 1)
      }
      if (ok) return { patternId: pattern.id, tokens: toks }
    }
  }
  return null
}

// ─── DOM readers / actions ───────────────────────────────────────────────────
// Sub-labels stripped before matching text: the key letter on a choice, the
// reading under a choice or tile, and the Thai gloss on an unmet tile.
const SUB_LABELS = '.key, .tile-sub, .tile-en, .muted'

async function readUi(page) {
  return await page.evaluate(sub => {
    const txt = el => (el ? el.textContent.trim() : null)
    const strip = btn => {
      const c = btn.cloneNode(true)
      c.querySelectorAll(sub).forEach(e => e.remove())
      return c.textContent.trim()
    }
    const body = document.body.innerText
    // Review renders the Thai prompt as .quiz-prompt; Builder renders it as a
    // bare styled div inside .prompt-zone — fall back to the “…”-quoted div.
    const qp = [...document.querySelectorAll('.quiz-prompt')].find(e => !e.classList.contains('en'))
      ?? [...document.querySelectorAll('.prompt-zone > div')].find(e => /^“.*”$/s.test(e.textContent.trim()))
    return {
      complete: body.includes('จบรอบแล้ว!'),
      caughtUp: body.includes('ทบทวนครบแล้ว!'),
      feedback: document.querySelector('.feedback.good') ? 'good'
        : document.querySelector('.feedback.bad') ? 'bad' : null,
      choices: [...document.querySelectorAll('.choices .choice')].map(strip),
      tray: [...document.querySelectorAll('.tile-tray .tile')].map(b => ({
        label: strip(b), used: b.classList.contains('used'),
      })),
      hasInput: !!document.querySelector('.type-input'),
      stagePill: txt(document.querySelector('.stage-pill')),
      hasAudioHero: !!document.querySelector('.audio-hero'),
      // The English target, in the Latin font (meaning-mc prompt).
      promptEnglish: txt(document.querySelector('.quiz-prompt.en')),
      // The Thai meaning, quoted (reading-mc / type-en / assemble prompt).
      promptMeaning: qp ? qp.textContent.trim().replace(/^[“"]/, '').replace(/[”"]$/, '') : null,
      spoken: (window.__spoken ?? []).slice(),
      patternName: txt(document.querySelector('.pattern-chip .pat')),
      labQuestion: txt(document.querySelector('.lab-question-title')),
      labChoices: [...document.querySelectorAll('.lab-choices .choice')].map(strip),
    }
  }, SUB_LABELS)
}

async function clickChoice(page, scope, idx) {
  await page.locator(`${scope} .choice`).nth(idx).click()
}

async function clickTileByLabel(page, label) {
  const idx = await page.evaluate(([lbl, sub]) => {
    const tiles = [...document.querySelectorAll('.tile-tray .tile')]
    return tiles.findIndex(b => {
      if (b.classList.contains('used')) return false
      const c = b.cloneNode(true)
      c.querySelectorAll(sub).forEach(e => e.remove())
      return c.textContent.trim() === lbl
    })
  }, [label, SUB_LABELS])
  if (idx < 0) throw new Error('tile not found in tray: ' + label)
  await page.locator('.tile-tray .tile').nth(idx).click()
}

async function waitFeedback(page) {
  await page.waitForSelector('.feedback.good, .feedback.bad', { timeout: 8000 })
  await page.waitForTimeout(350) // let zustand persist flush
}

async function clickAndClear(page, buttonRe) {
  await page.evaluate(() => { window.__spoken = [] })
  await page.getByRole('button', { name: buttonRe }).click()
  await page.waitForFunction(() => !document.querySelector('.feedback.good, .feedback.bad'))
  await page.waitForTimeout(120)
}

/** The one Check button on screen (Builder also has ล้าง next to it). */
const checkButton = page => page.getByRole('button', { name: 'ตรวจ', exact: true })

async function gotoDemo(page, screen) {
  await page.goto(`${BASE}/?demo=1&screen=${screen}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700) // seed + persist + mount settle
}

// ─── phase 1+2+4: review session ─────────────────────────────────────────────
async function reviewPhase(page, data) {
  await gotoDemo(page, 'review')
  const itemByEn = {}, itemByTh = {}
  const itemsArr = Object.values(data.items)
  for (const it of itemsArr) {
    (itemByEn[it.en] ??= []).push(it)
    ;(itemByTh[it.th] ??= []).push(it)
  }
  const patternList = Object.values(data.patterns)

  let st = await snap(page)
  trackUnlock('review', st)
  const seeded = st
  check('review: demo seed present after load',
    Object.keys(seeded.progress).length > 0 && seeded.xp === 4260,
    `${Object.keys(seeded.progress).length} items seeded, xp=${seeded.xp}` +
    (itemsArr.length ? '' : ' (content-dependent — no levels authored yet)'))

  const wrongAnsweredIds = new Set() // ids whose next appearance is a requeue
  let scheduledGood = 0, scheduledBad = 0, requeueChecks = 0, qNum = 0
  let highDropSeen = false, highStageMet = 0 // stage>=5 items we could target for the -2 penalty

  for (let iter = 0; iter < 100; iter++) {
    const ui = await readUi(page)
    if (ui.complete || ui.caughtUp) break

    // classify the question
    let kind
    if (ui.tray.length > 0) kind = 'assemble'
    else if (ui.hasInput) kind = 'type-en'
    else if (ui.hasAudioHero) kind = 'listen-mc'
    else if (ui.promptEnglish) kind = 'meaning-mc'
    else kind = 'reading-mc'

    // find the correct answer deterministically where possible
    let correctIdx = -1
    let correctText = null // for type-en: the English to type
    let assembleSolution = null
    let candId = null // item id identified BEFORE clicking, when possible
    if (kind === 'meaning-mc' && ui.promptEnglish) {
      // English shown → pick the Thai meaning
      const cand = (itemByEn[ui.promptEnglish] ?? []).find(it => ui.choices.includes(it.th))
      if (cand) { correctIdx = ui.choices.indexOf(cand.th); candId = cand.id }
    } else if (kind === 'reading-mc' && ui.promptMeaning) {
      // Thai meaning shown → pick the English
      const en = ui.choices.find(t => (itemByEn[t] ?? []).some(it => it.th === ui.promptMeaning))
      if (en) {
        correctIdx = ui.choices.indexOf(en)
        candId = (itemByEn[en] ?? []).find(it => it.th === ui.promptMeaning)?.id ?? null
      }
    } else if (kind === 'listen-mc') {
      // English spoken → pick the Thai meaning
      const spoken = ui.spoken[ui.spoken.length - 1]
      const cand = itemsArr.find(it =>
        (it.audioHint === spoken || it.en.replace(/_/g, '') === spoken) && ui.choices.includes(it.th))
      if (cand) { correctIdx = ui.choices.indexOf(cand.th); candId = cand.id }
    } else if (kind === 'type-en' && ui.promptMeaning) {
      // Thai meaning shown → TYPE the English (production)
      const cand = (itemByTh[ui.promptMeaning] ?? [])[0]
      if (cand) { correctText = cand.en; candId = cand.id }
    } else if (kind === 'assemble' && ui.promptMeaning) {
      assembleSolution = solveAssemble(patternList, data.items, ui.promptMeaning, ui.tray.map(t => t.label))
      candId = assembleSolution?.patternId ?? null
    }

    // Quiz-kind ladder: record what was served against the stage the question
    // was BUILT from — the pill renders that creation-time snapshot, which is
    // exactly what kindsForStage() was handed. Only vocabulary counts:
    // graphemes run their own two-kind table and patterns are always 'assemble'.
    if (candId && data.items[candId]) {
      kindTrail.push({ id: candId, kind, stage: STAGE_NAMES.indexOf(ui.stagePill) })
    }

    const pre = await snap(page)
    // intent: force wrong until we have 2 scheduled wrong samples; additionally
    // force ONE wrong on a stage>=5 item to exercise the -2 penalty branch
    const candStage = candId && !wrongAnsweredIds.has(candId) ? pre.progress[candId]?.stage : undefined
    if (candStage >= 5) highStageMet++
    const wantWrong = scheduledBad < 2 || (!highDropSeen && candStage >= 5)
    const tClick = Date.now()

    if (kind === 'type-en') {
      await page.fill('.type-input', wantWrong || !correctText ? 'xyzzy plugh' : correctText)
      await checkButton(page).click()
    } else if (kind === 'assemble') {
      if (!wantWrong && assembleSolution) {
        for (const tok of assembleSolution.tokens) await clickTileByLabel(page, tok)
      } else {
        // one tile is wrong unless the sentence is a single known token
        const bad = ui.tray.find(t =>
          !(assembleSolution && assembleSolution.tokens.length === 1 && assembleSolution.tokens[0] === t.label))
        await clickTileByLabel(page, (bad ?? ui.tray[0]).label)
      }
      await checkButton(page).click()
    } else {
      let idx
      if (wantWrong) idx = correctIdx === -1 ? 0 : (correctIdx + 1) % ui.choices.length
      else idx = correctIdx === -1 ? 0 : correctIdx
      await clickChoice(page, '.choices', idx)
    }

    await waitFeedback(page)
    const outcome = (await readUi(page)).feedback
    const post = await snap(page)
    trackUnlock('review', post)
    qNum++

    const changed = progressDelta(pre.progress, post.progress)
    check(`review q${qNum}: exactly one progress entry changed`,
      changed.length === 1, `changed=[${changed.join(', ')}] kind=${kind}`)
    if (changed.length === 1) {
      const id = changed[0]
      const p0 = pre.progress[id], p1 = post.progress[id]
      if (wrongAnsweredIds.has(id)) {
        // same-session requeue: schedule must be frozen at the post-miss state
        assertFrozen(`review q${qNum}: REQUEUE of '${id}' keeps stage/due frozen`, p0, p1, outcome)
        requeueChecks++
      } else {
        assertScheduled(`review q${qNum}: '${id}' scheduled transition matches feedback`, p0, p1, outcome, tClick)
        if (outcome === 'good') scheduledGood++
        else {
          scheduledBad++
          wrongAnsweredIds.add(id)
          if (p0.stage >= 5) highDropSeen = true
        }
      }
    }

    await clickAndClear(page, /ไปต่อ/)
  }

  check('review: covered >=6 scheduled questions with both outcomes',
    scheduledGood + scheduledBad >= 6 && scheduledGood >= 1 && scheduledBad >= 2,
    `scheduled correct=${scheduledGood}, scheduled wrong=${scheduledBad}`)
  check('review: at least one requeued miss re-answered (non-scheduling verified)',
    requeueChecks >= 1, `requeue answers checked=${requeueChecks}`)
  check('review: -2 penalty branch (miss at stage>=5) exercised when reachable',
    highDropSeen || highStageMet === 0,
    highDropSeen ? 'stage>=5 miss observed dropping 2 stages'
      : `no identifiable stage>=5 item appeared this session (met=${highStageMet})`)
}

// ─── distractors must be words the learner has actually met ──────────────────
// Drawing distractors from the whole corpus makes an early question answerable
// by recognition alone: with ~15 items learned, all three wrong answers were
// almost always words never seen before, so the learner picks the familiar one
// without knowing the target at all.
async function distractorPhase(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const seeded = await page.evaluate(async () => {
    const d = await import('/src/data/index.ts')
    const now = Date.now()
    // A Level-1-only learner: the worst case for distractor leakage.
    const ids = (d.CURRICULUM[0]?.itemIds ?? []).filter(i => d.ITEMS[i])
    const progress = {}
    for (const id of ids) {
      progress[id] = { stage: 2, due: now - 1000, correct: 3, incorrect: 0, streak: 3, learnedAt: now - 4e8 }
    }
    localStorage.setItem('chaienglish-v1', JSON.stringify({
      version: 1,
      state: { screen: 'review', activeLevel: 1, progress, scriptProgress: {}, maxUnlocked: 1,
        xp: 0, streakDays: 0, lastActiveDay: '', history: [], settings: { sound: false, showReading: true } },
    }))
    return ids
  })
  const met = new Set(seeded)

  let questions = 0, leaked = 0, allMetQuestions = 0
  for (let n = 0; n < (met.size ? 12 : 1); n++) {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
    await page.evaluate(async () => {
      const m = await import('/src/core/store.ts')
      m.useApp.getState().go('review')
    })
    await page.waitForTimeout(320)
    // Map every rendered choice back to an item id via its English / Thai text.
    const shown = await page.evaluate(async () => {
      const d = await import('/src/data/index.ts')
      const btns = [...document.querySelectorAll('.choices .choice')]
      if (btns.length === 0) return null
      const labels = btns.map(b => {
        const c = b.cloneNode(true)
        c.querySelectorAll('.key, .muted').forEach(e => e.remove())
        return c.textContent.trim()
      })
      const ids = labels.map(l => {
        const hit = Object.values(d.ITEMS).find(i => i.en === l || i.th === l)
        return hit ? hit.id : null
      })
      return ids
    })
    if (!shown) continue
    questions++
    const resolved = shown.filter(Boolean)
    const unseen = resolved.filter(id => !met.has(id))
    if (unseen.length === resolved.length && resolved.length >= 3) leaked++
    if (unseen.length === 0) allMetQuestions++
  }

  const nc = met.size ? '' : ' (content-dependent — level 1 has no items yet)'
  check('distractors: every choice is a word the learner has met',
    questions > 0 && allMetQuestions === questions,
    `${allMetQuestions}/${questions} questions had all choices from the learned set${nc}`)
  check('distractors: no question is answerable by picking the only familiar word',
    questions > 0 && leaked === 0, `${leaked}/${questions} questions had every distractor unseen${nc}`)
}

// ─── mature items are produced, not recognised ───────────────────────────────
// The demo seed tops out below ทอง, so the live end of the kind ladder needs
// its own seed: a learner whose whole vocabulary sits at ยืนต้น must never be
// shown a multiple choice, because four months of claimed retention cannot
// rest on a 25% guess. Stage 2 is the control — the same items, same screen —
// so a pass proves the STAGE is driving the card, not that review is broken.
async function maturePhase(page) {
  const serve = async (stage, rounds) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
    const n = await page.evaluate(async (s) => {
      const d = await import('/src/data/index.ts')
      const now = Date.now()
      const progress = {}
      for (const id of (d.CURRICULUM[0]?.itemIds ?? []).filter(i => d.ITEMS[i])) {
        progress[id] = { stage: s, due: now - 1000, correct: 9, incorrect: 0, streak: 9, learnedAt: now - 4e8 }
      }
      localStorage.setItem('chaienglish-v1', JSON.stringify({
        version: 1,
        state: { screen: 'review', activeLevel: 1, progress, scriptProgress: {}, maxUnlocked: 1,
          xp: 0, streakDays: 0, lastActiveDay: '', history: [], settings: { sound: false, showReading: true } },
      }))
      return Object.keys(progress).length
    }, stage)
    const cards = []
    for (let k = 0; k < (n ? rounds : 1); k++) {
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
      await page.evaluate(async () => {
        const m = await import('/src/core/store.ts')
        m.useApp.getState().go('review')
      })
      await page.waitForTimeout(320)
      const c = await page.evaluate(() => {
        const pill = document.querySelector('.stage-pill')
        if (!pill) return null
        const zone = document.querySelector('.prompt-zone')
        return {
          pill: pill.textContent.trim(),
          typed: !!document.querySelector('.type-input'),
          choices: document.querySelectorAll('.choices .choice').length,
          // A typed card is production: the prompt is the Thai meaning, and
          // neither the English nor its reading may appear — that would spell
          // the answer out.
          promptIsThai: /[ก-๙]/.test(zone?.querySelector('.quiz-prompt')?.textContent ?? ''),
          leaksAnswer: !!zone?.querySelector('.quiz-prompt.en') || !!zone?.querySelector('.read-line'),
        }
      })
      if (c) cards.push(c)
    }
    return cards
  }

  const mature = await serve(8, 8)
  check('mature: a ยืนต้น item is never offered multiple choice',
    mature.length > 0 && mature.every(c => c.typed && c.choices === 0),
    mature.length
      ? `${mature.length} cards: ${mature.map(c => `${c.pill}/${c.typed ? 'typed' : `mc(${c.choices})`}`).join(' ')}`
      : 'no card served (content-dependent — level 1 has no items yet)')
  check('mature: the typed card shows the Thai meaning and never the English or its reading',
    mature.length > 0 && mature.every(c => c.promptIsThai && !c.leaksAnswer),
    'type-en is production — the reading would spell the answer out')

  const young = await serve(2, 6)
  check('mature: the control — the same items at ต้นอ่อน are multiple choice',
    young.length > 0 && young.every(c => !c.typed && c.choices > 0),
    young.length
      ? `${young.length} cards: ${young.map(c => `${c.pill}/${c.typed ? 'typed' : `mc(${c.choices})`}`).join(' ')}`
      : 'no card served (content-dependent — level 1 has no items yet)')
}

// ─── pacing: daily new-item budget, rolling frontier, due-sorted queue ───────
async function pacingPhase(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const r = await page.evaluate(async () => {
    const s = await import('/src/core/store.ts')
    const d = await import('/src/data/index.ts')
    const now = Date.now()
    const mk = (stage, dueOffMs, learnedAgoDays = 10) => ({
      stage, due: now + dueOffMs, correct: 4, incorrect: 0, streak: 4,
      learnedAt: now - learnedAgoDays * 86400e3,
    })
    const S = { sound: false, showReading: true, newPerDay: 6, sessionSize: 20 }
    const lvl = n => d.CURRICULUM[n - 1] ?? { n, itemIds: [], patternIds: [] }

    // ── budget ──
    const p1 = {}
    lvl(1).itemIds.slice(0, 4).forEach(id => { p1[id] = mk(1, 1e9, 0) })   // today
    lvl(1).itemIds.slice(4, 9).forEach(id => { p1[id] = mk(4, 1e9, 10) })  // older
    const budget = {
      learnedToday: s.learnedTodayCount(p1),
      left: s.newBudgetRemaining({ progress: p1, settings: S }),
      exhausted: s.newBudgetRemaining({ progress: p1, settings: { ...S, newPerDay: 4 } }),
    }

    // ── frontier ──
    const metL1 = {}
    for (const id of lvl(1).itemIds.concat(lvl(1).patternIds)) metL1[id] = mk(1, 1e9)
    const halfL1 = {}
    lvl(1).itemIds.slice(0, 5).forEach(id => { halfL1[id] = mk(1, 1e9) })
    const thru4 = {}
    for (const l of d.CURRICULUM.filter(x => x.n <= 4)) {
      for (const id of l.itemIds.concat(l.patternIds)) thru4[id] = mk(4, 1e9)
    }
    // The Level 5 checkpoint, satisfied: the first SCRIPT_GATES[5] graphemes
    // (course order) retained at the gate stage.
    const need = s.SCRIPT_GATES[5]
    const gateChars = {}
    Object.keys(d.SCRIPT_CHARS).slice(0, need).forEach(c => { gateChars[c] = mk(2, 1e9) })
    const frontier = {
      need,
      levels: d.CURRICULUM.length,
      metNotMastered: s.learningFrontier({ progress: metL1, scriptProgress: {}, maxUnlocked: 1 }),
      halfMet: s.learningFrontier({ progress: halfL1, scriptProgress: {}, maxUnlocked: 1 }),
      blockedByGate: s.learningFrontier({ progress: thru4, scriptProgress: {}, maxUnlocked: 4 }),
      gateSatisfied: s.learningFrontier({ progress: thru4, scriptProgress: gateChars, maxUnlocked: 4 }),
    }

    // ── due-sorted queue: 40 due items, 20-question session ──
    const many = {}
    const ids = Object.keys(d.ITEMS).slice(0, 40)
    // Oldest-due first in `ids` order: item i is overdue by (40 - i) hours.
    ids.forEach((id, i) => { many[id] = mk(3, -(40 - i) * 3600e3) })
    const served = s.dueQueue({ progress: many, scriptProgress: {}, settings: S })
    const expected = ids.slice(0, 20)          // the 20 MOST overdue
    const queue = {
      corpus: ids.length,
      size: served.length,
      isMostOverdue: JSON.stringify(served.map(x => x.id)) === JSON.stringify(expected),
      respectsSetting: s.dueQueue({ progress: many, scriptProgress: {}, settings: { ...S, sessionSize: 35 } }).length,
      // burned items must never be served
      excludesBurned: ids.length > 0 && s.dueQueue({
        progress: { ...many, [ids[0]]: { ...mk(9, -1e6), due: Number.MAX_SAFE_INTEGER } },
        scriptProgress: {}, settings: S,
      }).every(x => x.id !== ids[0]),
    }
    return { budget, frontier, queue }
  })

  const nc = r.frontier.levels >= 5 ? '' : ` (content-dependent — levels authored=${r.frontier.levels})`
  check('pacing: new-item budget counts only items started today',
    r.budget.learnedToday === 4 && r.budget.left === 2,
    `${r.budget.learnedToday} today, ${r.budget.left} of 6 left${nc}`)
  check('pacing: budget bottoms out at zero, never negative',
    r.budget.exhausted === 0, `${r.budget.exhausted} left of 4 after 4 started today${nc}`)
  check('pacing: frontier rolls ahead once a level is fully MET (not mastered)',
    r.frontier.metNotMastered === 2, `frontier=${r.frontier.metNotMastered}${nc}`)
  check('pacing: frontier holds while the current level is only half met',
    r.frontier.halfMet === 1, `frontier=${r.frontier.halfMet}${nc}`)
  check('pacing: frontier never crosses an unsatisfied reading checkpoint',
    r.frontier.blockedByGate === 4, `frontier=${r.frontier.blockedByGate} (L5 needs ${r.frontier.need} graphemes)${nc}`)
  check('pacing: frontier rolls past the checkpoint once the graphemes are retained',
    r.frontier.gateSatisfied === 5, `frontier=${r.frontier.gateSatisfied}${nc}`)
  check('queue: serves exactly the session size',
    r.queue.size === 20 && r.queue.respectsSetting === 35,
    `${r.queue.size} at default, ${r.queue.respectsSetting} at sessionSize=35 (corpus ${r.queue.corpus})${nc}`)
  check('queue: serves the MOST OVERDUE items, not a random slice',
    r.queue.corpus >= 40 && r.queue.isMostOverdue, `40 due, 20 served, oldest-first${nc}`)
  check('queue: burned items are never served', r.queue.excludesBurned, nc.trim())
}

async function builderPhase(page, data) {
  await gotoDemo(page, 'builder')
  const patternByName = {}
  for (const p of Object.values(data.patterns)) patternByName[p.name] = p
  const patternList = Object.values(data.patterns)

  // Content-dependent: every check below walks the real patterns.
  if (patternList.length === 0) {
    check('builder: patterns exist to drive Sentence Builder', false,
      'content-dependent — no levels authored yet; the whole Builder phase needs them')
    return
  }

  let dueRounds = 0, nonDueRounds = 0, nonDueCorrect = 0, dueCorrect = 0

  // ── the "sentences your patterns can build" meter ────────────────────────
  // Its denominator is a promise: these patterns really can produce that many
  // distinct sentences, and the generator really can serve every one of them.
  // A number the learner cannot reach would be worse than no number at all.
  const meter = async () => {
    const t = await page.locator('.build-meter-count').textContent().catch(() => null)
    const m = /(\d+)\s*\/\s*(\d+)/.exec(t ?? '')
    return m ? { n: Number(m[1]), d: Number(m[2]) } : null
  }

  const truth = await page.evaluate(async () => {
    const g = await import('/src/core/generate.ts')
    const s = await import('/src/core/store.ts')
    const d = await import('/src/data/index.ts')
    const st = s.useApp.getState()
    const learned = Object.values(d.PATTERNS).filter(p => st.progress[p.id])
    const avail = learned.length
      ? learned
      : Object.values(d.PATTERNS).filter(p => p.level <= s.effectiveUnlocked(st))
    const total = g.possibleSentenceCount(avail)
    // Every counted sentence must be reachable by the generator. The `avoid`
    // set is what makes this terminate — random picking alone would take
    // unboundedly long to hit the last few.
    // Feed it the real shape — hash → timestamp. Passing a Set here silently
    // makes every age 0, which is a different test than the one intended.
    const seen = new Set()
    const ages = {}
    let tick = 1
    for (let i = 0; i < 60_000 && seen.size < total; i++) {
      const k = g.sentenceKey(g.makeRound(avail, ages))
      seen.add(k)
      ages[g.sentenceHash(k)] = tick++
    }
    // Once everything has been served there is nothing fresh left, and serving
    // a repeat is the right answer — but it must still be a real round.
    const last = g.makeRound(avail, ages)
    const exhausted = last.tokens.length > 0 && last.tray.length > 0 && seen.has(g.sentenceKey(last))
    // English is joined with spaces — a sentence key without them is a bug.
    const spaced = [...seen].every(k => k.split(' ').length >= 2 || !k.includes('{'))
    const spoken = last.tokens.map(t => t.en).join(' ')

    return { total, reached: seen.size, patterns: avail.length, exhausted, spaced, spoken, sample: [...seen].slice(0, 3) }
  })

  check('builder: every sentence the meter counts is reachable by the generator',
    truth.reached === truth.total,
    `reached ${truth.reached} of ${truth.total} across ${truth.patterns} patterns`)
  check('builder: with everything built, the generator still serves a real round',
    truth.exhausted, 'repeats gracefully rather than looping or returning nothing')
  check('builder: English tokens are joined with spaces, never run together',
    truth.spaced && /\S \S/.test(truth.spoken), truth.sample.join(' | '))

  // ── spacing ACROSS sittings ──────────────────────────────────────────────
  // Reported from use: "I tend to get the same sentences" on reopening. The
  // memory used to be session-scoped, so closing the screen forgot everything
  // and the next sitting re-rolled at random — which over a pool of a couple
  // of hundred repeats roughly a third of a 20-round sitting, by the birthday
  // problem alone. The fix is persistence plus least-recently-served
  // selection, and the property worth pinning is that a learner covers the
  // pool before seeing anything twice.
  const spacing = await page.evaluate(async () => {
    const g = await import('/src/core/generate.ts')
    const s = await import('/src/core/store.ts')
    const d = await import('/src/data/index.ts')
    const st = s.useApp.getState()
    const learned = Object.values(d.PATTERNS).filter(p => st.progress[p.id])
    const avail = learned.length ? learned : Object.values(d.PATTERNS)
    const total = g.possibleSentenceCount(avail)

    // Five sittings of twenty, the memory surviving between them.
    const run = useMemory => {
      const everSeen = new Set()
      const seen = {}
      let repeats = 0, clock = 1
      for (let sitting = 0; sitting < 5; sitting++) {
        for (let i = 0; i < 20; i++) {
          const r = g.makeRound(avail, useMemory ? seen : undefined)
          const k = g.sentenceKey(r)
          if (everSeen.has(k)) repeats++
          everSeen.add(k)
          seen[g.sentenceHash(k)] = clock++
        }
      }
      return { repeats, distinct: everSeen.size }
    }
    const withMem = run(true), without = run(false)

    // And it must keep serving past exhaustion rather than stalling.
    const seen = {}
    let clock = 1
    const order = []
    for (let i = 0; i < total + 5; i++) {
      const k = g.sentenceKey(g.makeRound(avail, seen))
      order.push(k)
      seen[g.sentenceHash(k)] = clock++
    }
    return { total, withMem, without, coverage: new Set(order.slice(0, total)).size, served: order.length }
  })

  // Not "zero repeats" — with a pool of 47 a hundred rounds MUST recycle, and
  // asserting otherwise would be asserting the impossible. The property is
  // that nothing comes back until everything has been served once.
  check('builder: five sittings serve every distinct sentence available before any repeat',
    spacing.withMem.distinct === Math.min(100, spacing.total),
    `${spacing.withMem.distinct} distinct of a possible ${Math.min(100, spacing.total)} (pool ${spacing.total}, 100 rounds)`)
  check('builder: that is a real improvement, not a pool big enough to hide it',
    spacing.without.repeats > 10,
    `without the memory the same 100 rounds repeat ${spacing.without.repeats} times`)
  check('builder: the whole pool is covered before anything comes back',
    spacing.coverage >= Math.floor(spacing.total * 0.9),
    `${spacing.coverage} distinct in the first ${spacing.total}`)
  check('builder: it keeps serving past exhaustion', spacing.served === spacing.total + 5)

  // ── variety ACROSS passes ────────────────────────────────────────────────
  // Strict least-recently-served covers the pool perfectly and then freezes:
  // once every sentence carries a timestamp the order is fixed, so pass 2
  // replays pass 1 exactly and does so for ever. That took a full pass through
  // the pool to become visible, which is precisely why one pass was not enough
  // to test. Drawing at random from the stalest tenth keeps the coverage and
  // reshuffles every pass.
  const variety = await page.evaluate(async () => {
    const g = await import('/src/core/generate.ts')
    const s = await import('/src/core/store.ts')
    const d = await import('/src/data/index.ts')
    const st = s.useApp.getState()
    const learned = Object.values(d.PATTERNS).filter(p => st.progress[p.id])
    const avail = learned.length ? learned : Object.values(d.PATTERNS)
    const total = g.possibleSentenceCount(avail)
    const seen = {}
    let clock = 1
    const passes = []
    for (let p = 0; p < 3; p++) {
      const order = []
      for (let i = 0; i < total; i++) {
        const k = g.sentenceKey(g.makeRound(avail, seen))
        order.push(k)
        seen[g.sentenceHash(k)] = clock++
      }
      passes.push(order)
    }
    const overlap = (a, b) => a.filter((x, i) => x === b[i]).length
    return {
      total,
      distinct: passes.map(p => new Set(p).size),
      p2vp1: overlap(passes[1], passes[0]),
      p3vp2: overlap(passes[2], passes[1]),
    }
  })
  check('builder: a later pass is not a replay of the earlier one',
    variety.p2vp1 < variety.total * 0.25 && variety.p3vp2 < variety.total * 0.25,
    `pass2 matched pass1 in ${variety.p2vp1}/${variety.total} positions, pass3 vs pass2 ${variety.p3vp2}`)
  check('builder: reshuffling costs almost none of the coverage',
    variety.distinct.every(d => d >= variety.total * 0.85),
    `${variety.distinct.join(', ')} distinct per pass of ${variety.total}`)

  // ── remediation ──────────────────────────────────────────────────────────
  // A pattern whose last answer was wrong comes back sooner — with a DIFFERENT
  // sentence, since the one just missed is the freshest and therefore last in
  // line. Bounded, or a pattern the learner keeps missing takes over the queue
  // and practice becomes punishment.
  const remedial = await page.evaluate(async () => {
    const g = await import('/src/core/generate.ts')
    const s = await import('/src/core/store.ts')
    const d = await import('/src/data/index.ts')
    const st = s.useApp.getState()
    const learned = Object.values(d.PATTERNS).filter(p => st.progress[p.id])
    const avail = learned.length ? learned : Object.values(d.PATTERNS)
    // The case that matters: a small pattern, where the natural wait is long.
    const target = [...avail]
      .map(p => ({ p, n: g.possibleSentenceCount([p]) }))
      .sort((a, b) => a.n - b.n)[0].p
    const standing = { struggling: new Set([target.id]) }

    const wait = useStanding => {
      const seen = {}
      let clock = 1
      for (let i = 0; i < 400; i++) {
        const r = g.makeRound(avail, seen, useStanding ? standing : undefined)
        seen[g.sentenceHash(g.sentenceKey(r))] = clock++
        if (r.pattern.id === target.id) return i + 1
      }
      return 400
    }
    const mean = f => Array.from({ length: 120 }, f).reduce((a, b) => a + b, 0) / 120

    // And it must not take over.
    const seen = {}
    let clock = 1, hits = 0
    for (let i = 0; i < 300; i++) {
      const r = g.makeRound(avail, seen, standing)
      if (r.pattern.id === target.id) hits++
      seen[g.sentenceHash(g.sentenceKey(r))] = clock++
    }
    return {
      target: target.id,
      without: mean(() => wait(false)),
      withIt: mean(() => wait(true)),
      share: hits / 300,
    }
  })
  check('builder: a pattern you just got wrong comes back sooner',
    remedial.withIt < remedial.without * 0.6,
    `${remedial.target}: ${remedial.without.toFixed(1)} rounds → ${remedial.withIt.toFixed(1)}`)
  check('builder: but it never takes over the queue',
    remedial.share <= 0.45, `${(remedial.share * 100).toFixed(0)}% of rounds`)

  // ── glossing unmet words ─────────────────────────────────────────────────
  // A tile the learner has never been taught shows its Thai meaning, so the
  // round is buildable rather than a guess on that one word. The rule has to
  // apply to DISTRACTORS too: if only the answer's new words were glossed, the
  // gloss would say "this tile belongs in the sentence" and the round would
  // be solvable without reading a word of Thai.
  const gloss = await page.evaluate(async () => {
    const g = await import('/src/core/generate.ts')
    const s = await import('/src/core/store.ts')
    const d = await import('/src/data/index.ts')
    const st = s.useApp.getState()
    const learned = Object.values(d.PATTERNS).filter(p => st.progress[p.id])
    const avail = learned.length ? learned : Object.values(d.PATTERNS)

    // A synthetic half-taught learner. The real progress map here has met
    // everything these patterns use, so the interesting case would never
    // arise from it.
    const ids = [...new Set(avail.flatMap(p => p.slots.flatMap(s => s.itemIds)))]
    const known = new Set(ids.filter((_, i) => i % 2 === 0))
    const fresh = t => !t.id.startsWith('lit:') && t.th !== '' && !known.has(t.id)

    let itemTiles = 0, withTh = 0, litWithTh = 0
    let glossedDistractors = 0, glossedKnown = 0, roundsWithNew = 0
    for (let i = 0; i < 400; i++) {
      const r = g.makeRound(avail)
      const answer = new Set(r.tokens.map(t => t.id))
      for (const t of r.tray) {
        if (t.id.startsWith('lit:')) { if (t.th) litWithTh++; continue }
        itemTiles++
        if (t.th) withTh++
        if (fresh(t) && !answer.has(t.id)) glossedDistractors++
        if (known.has(t.id) && fresh(t)) glossedKnown++
      }
      if (r.tray.some(fresh)) roundsWithNew++
    }
    return { itemTiles, withTh, litWithTh, glossedDistractors, glossedKnown, roundsWithNew }
  })

  check('builder: every item tile carries a Thai gloss the renderer can show',
    gloss.withTh === gloss.itemTiles, `${gloss.withTh} of ${gloss.itemTiles} item tiles`)
  check('builder: literal pattern words carry no gloss — they are the pattern, not vocabulary',
    gloss.litWithTh === 0, `${gloss.litWithTh} literals carried one`)
  check('builder: a word already learned is never glossed',
    gloss.glossedKnown === 0, `${gloss.glossedKnown} known words were marked new`)
  // The one that matters. If the gloss only ever appeared on answer tiles it
  // would announce them, and the round could be solved without reading Thai.
  check('builder: DISTRACTORS get glossed too, so a gloss never marks a correct tile',
    gloss.glossedDistractors > 0,
    `${gloss.glossedDistractors} glossed distractors across ${gloss.roundsWithNew} rounds containing an unmet word`)

  const start = await meter()
  check('builder: the meter renders and starts the session at zero',
    start != null && start.n === 0, start ? `${start.n} / ${start.d}` : 'no meter')
  check('builder: the meter\'s total is the real count, not an estimate',
    start != null && start.d === truth.total, `shown=${start?.d} computed=${truth.total}`)

  // The label has to name what the number counts. "Sentences you can build"
  // reads as a claim about vocabulary, and then sits still through a week of
  // learning words — which is what it did, and what got reported.
  const label = await page.locator('.build-meter-label').textContent() ?? ''
  check('builder: the meter says the count is about PATTERNS, not vocabulary',
    /แพตเทิร์น/.test(label) && !/คำศัพท์|คำที่คุณรู้/.test(label), label)

  // And it names the thing that does move it.
  const nextLine = await page.locator('[data-testid=next-unlock]').textContent().catch(() => null)
  const nextTruth = await page.evaluate(async () => {
    const g = await import('/src/core/generate.ts')
    const s = await import('/src/core/store.ts')
    const d = await import('/src/data/index.ts')
    const st = s.useApp.getState()
    const learned = Object.values(d.PATTERNS).filter(p => st.progress[p.id])
    const avail = learned.length
      ? learned
      : Object.values(d.PATTERNS).filter(p => p.level <= s.effectiveUnlocked(st))
    const base = g.possibleSentenceCount(avail)
    for (const lv of d.CURRICULUM) {
      for (const id of lv.patternIds) {
        const p = d.PATTERNS[id]
        if (!p || st.progress[id] || avail.some(a => a.id === id)) continue
        return { name: p.name, gain: g.possibleSentenceCount([...avail, p]) - base }
      }
    }
    return null
  })
  check('builder: the next pattern and what it adds are shown',
    nextTruth == null || nextLine != null,
    nextTruth ? `expected ${nextTruth.name} +${nextTruth.gain}` : 'no unlearned pattern remains')
  if (nextTruth && nextLine) {
    check('builder: the advertised gain is the real one',
      new RegExp(`\\+${nextTruth.gain}\\b`).test(nextLine),
      `shown "${nextLine.trim()}" vs computed +${nextTruth.gain}`)
    check('builder: one pattern is worth more than a handful of words',
      nextTruth.gain > 0, `+${nextTruth.gain}`)
  }

  // Distinct sentences solved, by the same identity the component uses: the
  // written English. Solving one twice must advance the meter once.
  const distinctSolved = new Set()
  let repeats = 0

  for (let round = 1; round <= 14; round++) {
    const ui = await readUi(page)
    if (!ui.patternName || ui.tray.length === 0) break
    const sol = solveAssemble(patternList, data.items, ui.promptMeaning ?? '', ui.tray.map(t => t.label))
      ?? (patternByName[ui.patternName]
        ? solveAssemble([patternByName[ui.patternName]], data.items, ui.promptMeaning ?? '', ui.tray.map(t => t.label))
        : null)

    const wantWrong = round % 2 === 1 || !sol
    const pre = await snap(page)
    const tClick = Date.now()

    if (!wantWrong) {
      for (const tok of sol.tokens) await clickTileByLabel(page, tok)
    } else {
      const bad = ui.tray.find(t => !(sol && sol.tokens.length === 1 && sol.tokens[0] === t.label))
      await clickTileByLabel(page, (bad ?? ui.tray[0]).label)
    }
    await checkButton(page).click()
    await waitFeedback(page)
    const outcome = (await readUi(page)).feedback
    const post = await snap(page)
    trackUnlock('builder', post)

    if (outcome === 'good' && sol) {
      const key = sol.tokens.join(' ')
      if (distinctSolved.has(key)) repeats++
      distinctSolved.add(key)
      const m = await meter()
      check(`builder r${round}: the meter counts DISTINCT sentences, not correct answers`,
        m != null && m.n === distinctSolved.size,
        `meter=${m?.n} distinct solved=${distinctSolved.size} (repeats so far ${repeats})`)
      check(`builder r${round}: the meter's total does not drift mid-session`,
        m != null && m.d === truth.total, `${m?.d} vs ${truth.total}`)
    }

    const changed = progressDelta(pre.progress, post.progress)
    check(`builder r${round}: exactly one progress entry changed`,
      changed.length === 1, `changed=[${changed.join(', ')}] pattern='${ui.patternName}'`)
    if (changed.length === 1) {
      const id = changed[0]
      const p0 = pre.progress[id], p1 = post.progress[id]
      const wasDue = p0 != null && p0.stage < 9 && p0.due <= tClick
      if (wasDue) {
        assertScheduled(`builder r${round}: DUE pattern '${id}' first Check moves schedule`, p0, p1, outcome, tClick)
        dueRounds++
        if (outcome === 'good') dueCorrect++
      } else {
        assertFrozen(`builder r${round}: NON-DUE pattern '${id}' first Check keeps stage/due frozen`, p0, p1, outcome)
        nonDueRounds++
        if (outcome === 'good') nonDueCorrect++
      }
    }
    await clickAndClear(page, /ถัดไป/)
  }

  check('builder: isDue gate exercised on both sides',
    nonDueRounds >= 1 && dueRounds >= 1,
    `due first-Checks=${dueRounds} (correct=${dueCorrect}), non-due first-Checks=${nonDueRounds} (correct=${nonDueCorrect})`)
  check('builder: non-due gate verified on a CORRECT solve too (not only misses)',
    nonDueCorrect >= 1, `non-due correct solves=${nonDueCorrect}`)
}

// ─── phase 5: listening XP-once ──────────────────────────────────────────────
async function listeningPhase(page, data) {
  await gotoDemo(page, 'listening')
  const st0 = await snap(page)
  trackUnlock('listening', st0)

  const findEx = ui =>
    data.listening.find(ex =>
      ex.question === ui.labQuestion &&
      ex.choices.length === ui.labChoices.length &&
      ex.choices.every(c => ui.labChoices.includes(c)))

  const ui0 = await readUi(page)
  const first = findEx(ui0)
  check('listening: current exercise identified from data', !!first,
    `q='${ui0.labQuestion}'` + (data.listening.length ? '' : ' (content-dependent — no dialogues authored yet)'))
  if (!first) return

  // total cycle length shown as "pos / total"
  const total = await page.evaluate(() => {
    const m = document.body.innerText.match(/(\d+)\s*\/\s*(\d+)/)
    return m ? Number(m[2]) : 0
  })
  check('listening: exercise cycle length read from UI', total > 0, `total=${total}`)

  // The cycle is every dialogue at or below listeningCap(): the met frontier,
  // not the mastery gate. A learner meeting level N+1 while level N matures
  // used to see nothing above N−1 ("15 conversations against 186 sentences").
  const gate = await page.evaluate(async () => {
    const m = await import('/src/core/store.ts')
    const d = await import('/src/data/index.ts')
    const st = m.useApp.getState()
    const live = { cap: m.listeningCap(st), unlocked: m.effectiveUnlocked(st) }
    // Pure-rule probes on synthetic progress: levels 1–3 fully MET at stage 0
    // (nothing retained, nothing unlocked beyond 1) must open level 3's
    // dialogues; level 4 half-met must not open level 4's.
    const met = (n, frac = 1) => {
      const p = {}
      for (const lv of d.CURRICULUM) {
        if (lv.n > n) break
        const ids = lv.itemIds.concat(lv.patternIds)
        const take = lv.n === n ? Math.floor(ids.length * frac) : ids.length
        for (const id of ids.slice(0, take)) p[id] = { stage: 0, due: 0, learnedAt: 0, correct: 0, incorrect: 0, streak: 0 }
      }
      return p
    }
    const base = { scriptProgress: {}, maxUnlocked: 1 }
    return {
      ...live,
      threeMet: m.listeningCap({ ...base, progress: met(3) }),
      threeMetUnlocked: m.effectiveUnlocked({ ...base, progress: met(3) }),
      fourHalf: m.listeningCap({ ...base, progress: met(4, 0.5) }),
      floor: m.listeningCap({ ...base, maxUnlocked: 6, progress: {} }),
    }
  })
  const expectedTotal = data.listening.filter(ex => ex.level <= gate.cap).length
  check('listening: the cycle is every dialogue at or below listeningCap()',
    total === expectedTotal, `ui=${total} expected=${expectedTotal} cap=${gate.cap} unlocked=${gate.unlocked}`)
  check('listening: a fully-met level opens its dialogues before it is mastered',
    gate.threeMet === 3 && gate.threeMetUnlocked === 1, `cap=${gate.threeMet} unlocked=${gate.threeMetUnlocked}`)
  check('listening: a half-met level stays closed', gate.fourHalf === 3, `cap=${gate.fourHalf}`)
  check('listening: the unlocked level is the floor', gate.floor === 6, `cap=${gate.floor}`)

  // 1st pass: answer the first exercise CORRECTLY → +15 xp
  const preXp = st0.xp
  await clickChoice(page, '.lab-choices', ui0.labChoices.indexOf(first.choices[first.answer]))
  await waitFeedback(page)
  let ui = await readUi(page)
  let post = await snap(page)
  check(`listening: first correct answer on '${first.id}' grants +15 xp`,
    ui.feedback === 'good' && post.xp - preXp === 15,
    `feedback=${ui.feedback}, xpΔ=${post.xp - preXp}`)
  trackUnlock('listening', post)

  // walk the rest of the cycle answering WRONG (no xp) until the first ex repeats
  for (let k = 1; k < total; k++) {
    await clickAndClear(page, /ถัดไป/)
    const uk = await readUi(page)
    const ex = findEx(uk)
    const preK = (await snap(page)).xp
    const correctLabel = ex ? ex.choices[ex.answer] : null
    const wrongIdx = uk.labChoices.findIndex(l => l !== correctLabel)
    await clickChoice(page, '.lab-choices', Math.max(0, wrongIdx))
    await waitFeedback(page)
    const postK = await snap(page)
    check(`listening: wrong answer on intermediate exercise ${k + 1}/${total} grants no xp`,
      (await readUi(page)).feedback === 'bad' && postK.xp === preK,
      `xpΔ=${postK.xp - preK}`)
    trackUnlock('listening', postK)
  }

  // cycle wrapped: same exercise again — correct answer must NOT re-grant xp
  await clickAndClear(page, /ถัดไป/)
  const uiW = await readUi(page)
  const exW = findEx(uiW)
  check('listening: cycle wrapped back to the first exercise',
    exW?.id === first.id, `expected '${first.id}', got '${exW?.id}'`)
  const preW = (await snap(page)).xp
  await clickChoice(page, '.lab-choices', uiW.labChoices.indexOf(first.choices[first.answer]))
  await waitFeedback(page)
  const postW = await snap(page)
  check(`listening: SECOND correct answer on '${first.id}' grants no xp (xp-once)`,
    (await readUi(page)).feedback === 'good' && postW.xp === preW,
    `xpΔ=${postW.xp - preW}`)
  trackUnlock('listening', postW)
}

// ─── main ────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(10_000)
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
page.on('pageerror', err => consoleErrors.push(String(err)))
// capture what the app "speaks" so listen-mc questions are identifiable
await page.addInitScript(() => {
  window.__spoken = []
  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.speak = u => { window.__spoken.push(u.text) }
      window.speechSynthesis.cancel = () => {}
    } catch { /* keep going without capture */ }
  }
})

try {
  await page.goto(`${BASE}/?demo=1&screen=home`, { waitUntil: 'networkidle' })
  const data = await loadData(page)
  console.log(`data loaded: ${Object.keys(data.items).length} items, ` +
    `${Object.keys(data.patterns).length} patterns, ${data.listening.length} listening exercises\n`)

  await reviewPhase(page, data)
  console.log('')
  await distractorPhase(page)
  console.log('')
  await maturePhase(page)
  console.log('')
  await pacingPhase(page)
  console.log('')
  await builderPhase(page, data)
  console.log('')
  await listeningPhase(page, data)
  console.log('')

  // phase 4: maxUnlocked monotonic within each seeded run
  let mono = true
  const seen = []
  for (let i = 1; i < unlockTrail.length; i++) {
    if (unlockTrail[i].phase === unlockTrail[i - 1].phase &&
        unlockTrail[i].v < unlockTrail[i - 1].v) mono = false
  }
  for (const u of unlockTrail) {
    if (!seen.length || seen[seen.length - 1] !== `${u.phase}:${u.v}`) seen.push(`${u.phase}:${u.v}`)
  }
  check('maxUnlocked never decreases across all interactions', mono,
    `trail (deduped): ${seen.join(' → ')}`)

  // ── Typed answers ─────────────────────────────────────────────────────────
  // 'type-en' is PRODUCTION: the card shows the Thai meaning and the learner
  // types the English, scored by typedMatches() against item.en and altEn.
  // The contract (CLAUDE.md §2): word by word, IN ORDER; contractions expanded
  // on both sides; a leading article or `to` forgiven; one slip tolerated in a
  // word of six letters or more; and a negation never accepted on one side
  // only. Pure, so it is pinned here with its own answer lists rather than
  // through the corpus.
  const typedCases = await page.evaluate(async () => {
    const r = await import('/src/screens/Review.tsx')
    // [group, typed, accepted forms (item.en first, then altEn), expected]
    const cases = [
      // the exact English, however it is cased or punctuated
      ['exact', 'coffee', ['coffee'], true],
      ['exact', 'Coffee!', ['coffee'], true],
      ['exact', 'thank you', ['Thank you'], true],
      ['exact', '  thank   you ', ['thank you'], true],
      ['exact', 'How much is it?', ['how much is it'], true],
      // word order is part of the answer
      ['order', 'you thank', ['thank you'], false],
      ['order', 'go I', ['I go'], false],
      ['order', 'it is how much', ['how much is it'], false],
      // contractions are one answer, whichever side has them
      ['contractions', "I'm fine", ['I am fine'], true],
      ['contractions', 'I am fine', ["I'm fine"], true],
      ['contractions', 'I’m fine', ['I am fine'], true],          // curly apostrophe
      ['contractions', "don't know", ['do not know'], true],
      ['contractions', "I can't", ['I cannot'], true],
      ['contractions', "it's ok", ['it is okay'], true],
      ['contractions', 'wanna go', ['want to go'], true],
      ['contractions', "where's it", ['where is it'], true],
      // a leading article or infinitive marker is not what the card tests…
      ['leading', 'a coffee', ['coffee'], true],
      ['leading', 'the coffee', ['coffee'], true],
      ['leading', 'an apple', ['apple'], true],
      ['leading', 'to go', ['go'], true],
      ['leading', 'coffee', ['a coffee'], true],
      // …but only at the START — mid-sentence the article counts
      ['leading', 'I want coffee', ['I want a coffee'], false],
      ['leading', 'I want a coffee', ['I want coffee'], false],
      // one slip in a long word is a typo; in a short word it is another word
      ['slip', 'recieve', ['receive'], true],
      ['slip', 'tomorow', ['tomorrow'], true],
      ['slip', 'resturant', ['restaurant'], true],
      ['slip', 'ship', ['sheep'], false],
      ['slip', 'hose', ['house'], false],
      ['slip', 'bed', ['bad'], false],
      ['slip', 'cats', ['cat'], false],
      ['slip', 'reciave', ['receive'], false],                   // two slips
      // negation never crosses, whatever the edit distance says
      ['negation', 'not sure', ['sure'], false],
      ['negation', 'sure', ['not sure'], false],
      ['negation', "I don't know", ['I know'], false],
      ['negation', 'I know', ["I don't know"], false],
      ['negation', "I don't know", ['I do not know'], true],
      ['negation', "I can't", ['I can'], false],
      ['negation', 'never late', ['always late'], false],
      ['negation', 'no', ['no'], true],
      ['negation', 'no problem', ['no problem'], true],
      // altEn: the other accepted English forms
      ['altEn', 'yeah', ['yes', 'yeah'], true],
      ['altEn', 'yeah', ['yes'], false],
      ['altEn', 'OK', ['okay', 'OK'], true],
      ['altEn', 'I am', ["I'm", 'I am'], true],
      ['altEn', 'hi', ['hello / hi'], true],                      // slash-joined form
      // extra or missing words are a different sentence
      ['length', 'very good', ['good'], false],
      ['length', 'good', ['very good'], false],
      // digits are answers too
      ['digits', '20', ['20'], true],
      ['digits', 'twenty', ['20'], false],
      ['digits', '5 pm', ['5 pm'], true],
      // empty input is never a pass
      ['empty', '', ['coffee'], false],
      ['empty', '   ', ['coffee'], false],
    ]
    return cases.map(([group, typed, answers, want]) =>
      ({ group, typed, answers, want, got: r.typedMatches(typed, answers) }))
  })
  const typedWrong = typedCases.filter(c => c.got !== c.want)
  const groupOk = g => typedCases.filter(c => c.group === g).every(c => c.got === c.want)
  const groupBad = g => typedWrong.filter(c => c.group === g)
    .map(c => `"${c.typed}" vs [${c.answers.join(' | ')}] want ${c.want} got ${c.got}`).join(' ; ')
  check('typed: the exact English is accepted whatever the case, spacing or punctuation',
    groupOk('exact'), groupBad('exact'))
  check('typed: word order is part of the answer', groupOk('order'), groupBad('order'))
  check('typed: contractions expand on both sides ("I\'m fine" == "I am fine")',
    groupOk('contractions'), groupBad('contractions'))
  check('typed: a leading a/an/the/to is forgiven, and only a leading one',
    groupOk('leading'), groupBad('leading'))
  check('typed: one slip is tolerated in a word of 6+ letters ("recieve"), not in a short one ("ship" ≠ "sheep")',
    groupOk('slip'), groupBad('slip'))
  check('typed: a negation never crosses ("not sure" ≠ "sure", "I don\'t know" ≠ "I know")',
    groupOk('negation'), groupBad('negation'))
  check('typed: altEn forms are accepted', groupOk('altEn'), groupBad('altEn'))
  check('typed: extra or missing words fail, digits count, empty input never passes',
    groupOk('length') && groupOk('digits') && groupOk('empty'),
    [groupBad('length'), groupBad('digits'), groupBad('empty')].filter(Boolean).join(' ; '))
  check('typed: all cases score as expected', typedWrong.length === 0,
    typedWrong.length
      ? typedWrong.map(c => `${c.group}:"${c.typed}" want ${c.want} got ${c.got}`).join(' | ')
      : `${typedCases.length} cases`)

  // ── Quiz-kind ladder ──────────────────────────────────────────────────────
  // Multiple choice puts a 25% floor under every answer. That is fine while
  // an item is young — a lucky guess costs one four-hour interval. It is not
  // fine at the top of the ladder, where ทอง claims a month of retention and
  // ยืนต้น four: an interval that long has to be earned by PRODUCING the
  // answer, not by recognising it among three strangers. So from stage 7 the
  // only kind offered is 'type-en'.
  const ladder = await page.evaluate(async () => {
    const r = await import('/src/screens/Review.tsx')
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(s => r.kindsForStage(s))
  })
  const MC = ['meaning-mc', 'reading-mc', 'listen-mc']
  check('kind ladder: stages 7–9 are typed only, never multiple choice',
    ladder.slice(7).every(ks => ks.length > 0 && ks.every(k => k === 'type-en')),
    ladder.slice(7).map((ks, i) => `${STAGE_NAMES[i + 7]}=[${ks}]`).join(' '))
  check('kind ladder: stages 0–3 never ask for typing',
    ladder.slice(0, 4).every(ks => ks.every(k => MC.includes(k))),
    ladder.slice(0, 4).map((ks, i) => `${STAGE_NAMES[i]}=[${ks}]`).join(' '))
  check('kind ladder: stages 4–6 mix typing with recognition',
    ladder.slice(4, 7).every(ks => ks.includes('type-en') && ks.some(k => MC.includes(k))),
    ladder.slice(4, 7).map((ks, i) => `${STAGE_NAMES[i + 4]}=[${ks}]`).join(' '))
  check('kind ladder: every stage can still produce a question',
    ladder.every(ks => ks.length > 0))

  // …and the session actually obeys the table. Catches a second question
  // constructor drifting away from it, which is how the rendering duplication
  // in this screen bites.
  const offLadder = kindTrail.filter(c => c.stage < 0 || !ladder[c.stage].includes(c.kind))
  check('review: every card served was a kind its stage allows',
    offLadder.length === 0,
    offLadder.length
      ? offLadder.slice(0, 5).map(c => `${c.id} ${STAGE_NAMES[c.stage] ?? '?'}→${c.kind}`).join(' | ')
      : `${kindTrail.length} cards, stages ${[...new Set(kindTrail.map(c => c.stage))].sort((a, b) => a - b).join(',')}`)

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
