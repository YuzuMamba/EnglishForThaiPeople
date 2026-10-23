// State-assertion suite for persistence versioning + backup export/import.
// Hardened after adversarial review; every scenario here maps to a way real
// learner data could have been lost:
//
//   1. v0 and version-LESS blobs boot intact and are re-stamped v1 — with a
//      discriminating probe (stage 99 → 9) proving migration actually RAN
//   2. corrupted entries normalize instead of crashing; a damaged stage falls
//      back to the streak floor, never silently Seedling
//   3. unreadable JSON boots fresh AND preserves the original under a rescue
//      key — the first tap must never overwrite recoverable text
//   4. a blob from a NEWER app version is stashed before best-effort load
//   5. backup parsing refuses junk, foreign files, empty backups, future
//      versions, and DAMAGED version fields (no fail-open guessing)
//   6. snapshotOf's key set is pinned — a forgotten field fails here, not in
//      a learner's backup
//   7. the real UI: export downloads; importing a SMALLER backup over live
//      data warns with both sides shown; rescue snapshots accumulate without
//      clobbering and restore; imports survive a reload; a storage write
//      failure reports failure, not success
//
// Usage: node scripts/verify-backup.mjs   (dev server on :5173)
import { chromium } from 'playwright-core'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = 'http://localhost:5173'
const KEY = 'chaienglish-v1'

const results = []
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`)
}

const now = Date.now()
const prog = (stage, dueOff = 1e9, extra = {}) => ({
  stage, due: now + dueOff, correct: 4, incorrect: 1, streak: 2, learnedAt: now - 5 * 86400e3, ...extra,
})

async function bootWith(page, blob) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate(([k, b]) => {
    for (const key of Object.keys(localStorage)) {
      if (key === k || key.startsWith('chaienglish-rescue-')) localStorage.removeItem(key)
    }
    if (b !== null) localStorage.setItem(k, typeof b === 'string' ? b : JSON.stringify(b))
  }, [KEY, blob])
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
}

const getState = page => page.evaluate(async () => {
  const m = await import('/src/core/store.ts')
  return m.useApp.getState()
})
const readBlob = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY)
const rescueKeys = page => page.evaluate(() =>
  Object.keys(localStorage).filter(k => k.startsWith('chaienglish-rescue-')).sort())
const gotoSettings = async page => {
  await page.evaluate(async () => {
    const m = await import('/src/core/store.ts')
    m.useApp.getState().go('settings')
  })
  await page.waitForTimeout(350)
}

let PERSIST_VERSION = null   // read from the app once the first page is open

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--mute-audio'],
})
const pageErrors = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.on('pageerror', e => pageErrors.push(String(e)))
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  PERSIST_VERSION = await page.evaluate(async () =>
    (await import('/src/core/store.ts')).PERSIST_VERSION)
  check('suite: read PERSIST_VERSION from the app', typeof PERSIST_VERSION === 'number',
    `v${PERSIST_VERSION}`)

  // ── 1. version migration ───────────────────────────────────────────────────
  const v0state = {
    screen: 'home', activeLevel: 2,
    progress: {
      sawatdii: prog(5),
      'p-yaak': prog(3),
      'ghost-id-from-2024': prog(7),
      wild: prog(99),  // discriminator: only a RUN migration clamps this
    },
    scriptProgress: { 'ก': prog(2) },
    maxUnlocked: 3, xp: 777, streakDays: 4, lastActiveDay: '2026-08-17',
    history: [{ day: '2026-08-17', reviews: 9, xp: 120 }],
    settings: { sound: false, showReading: true },
  }
  for (const [label, blob] of [
    ['explicit version 0', { state: v0state, version: 0 }],
    ['missing version field', { state: v0state }],
  ]) {
    await bootWith(page, blob)
    const st = await getState(page)
    check(`migration: ${label} boots with data intact`,
      st.progress?.sawatdii?.stage === 5 && st.xp === 777 && st.maxUnlocked === 3 &&
      st.settings?.sound === false,
      `stage=${st.progress?.sawatdii?.stage}, xp=${st.xp}`)
    check(`migration: ${label} PROVABLY ran (stage 99 clamped to 9)`,
      st.progress?.wild?.stage === 9,
      `wild.stage=${st.progress?.wild?.stage} — if 99, migrate was skipped`)
    check(`migration: ${label} keeps orphaned ids untouched`,
      st.progress?.['ghost-id-from-2024']?.stage === 7)
    await page.evaluate(async () => {
      const m = await import('/src/core/store.ts')
      m.useApp.getState().go('about')
    })
    await page.waitForTimeout(250)
    check(`migration: ${label} re-stamped at the current version on next write`,
      (await readBlob(page)).version === PERSIST_VERSION,
      `stored v${(await readBlob(page)).version}, current v${PERSIST_VERSION}`)
  }

  // ── 2. corrupted entries ───────────────────────────────────────────────────
  await bootWith(page, {
    version: 0,
    state: {
      progress: {
        good: prog(4),
        stageWild: prog(99),
        stageInfMature: prog(4, 1e9, { stage: Infinity, streak: 7 }),
        stageNaNFresh: prog(4, 1e9, { stage: NaN, streak: 0 }),
        dueString: prog(4, 1e9, { due: 'tomorrow' }),
        burned: prog(9, 0, { due: Number.MAX_SAFE_INTEGER }),
        notAnObject: 'hello',
        nullEntry: null,
      },
      scriptProgress: 'this-should-be-a-map',
      maxUnlocked: 'seven', xp: -50,
      settings: { sound: 'loud' },
    },
  })
  const st2 = await getState(page)
  check('corruption: wild stage clamped into 0–9', st2.progress.stageWild?.stage === 9)
  check('corruption: unreadable stage falls back to the streak floor, not Seedling',
    st2.progress.stageInfMature?.stage === 7 && st2.progress.stageNaNFresh?.stage === 0,
    `Infinity+streak7 → ${st2.progress.stageInfMature?.stage}, NaN+streak0 → ${st2.progress.stageNaNFresh?.stage}`)
  check('corruption: burn sentinel due=MAX_SAFE_INTEGER survives exactly',
    st2.progress.burned?.due === Number.MAX_SAFE_INTEGER)
  check('corruption: non-numeric due replaced, entry kept',
    typeof st2.progress.dueString?.due === 'number')
  check('corruption: non-object entries dropped, good ones kept',
    !('notAnObject' in st2.progress) && !('nullEntry' in st2.progress) && st2.progress.good?.stage === 4)
  check('corruption: junk top-level fields fall back to defaults',
    st2.maxUnlocked === 1 && st2.xp === 0 && st2.settings.sound === true)

  // ── 3. unreadable blob → fresh boot + rescue stash ─────────────────────────
  const truncated = '{"state":{"progress":{"sawatdii":{"stage":8},"khoop'
  await bootWith(page, truncated)
  const fresh = await getState(page)
  const rk1 = await rescueKeys(page)
  const stashed = await page.evaluate(k => localStorage.getItem(k), rk1.find(k => k.includes('corrupt')) ?? '')
  check('unreadable blob: app boots fresh instead of white-screening',
    Object.keys(fresh.progress).length === 0)
  check('unreadable blob: the original text is preserved under a rescue key',
    stashed === truncated,
    rk1.join(', ') || 'NO RESCUE KEY — first tap would destroy recoverable data')

  // ── 4. blob from a NEWER app version ───────────────────────────────────────
  const futureBlob = JSON.stringify({
    version: 7,
    state: { ...v0state, cardProgressV7: { onlyTheFutureKnows: true } },
  })
  await bootWith(page, futureBlob)
  const stF = await getState(page)
  const rkF = await rescueKeys(page)
  const stashedF = await page.evaluate(k => localStorage.getItem(k), rkF.find(k => k.includes('newer')) ?? '')
  check('newer blob: known fields load best-effort',
    stF.progress?.sawatdii?.stage === 5 && stF.xp === 777)
  check('newer blob: the ORIGINAL (with fields this build cannot read) is stashed first',
    stashedF === futureBlob && stashedF.includes('onlyTheFutureKnows'),
    rkF.join(', ') || 'NO RESCUE — downgrade would silently destroy v7 data')

  // ── 5. backup pure functions ───────────────────────────────────────────────
  const pure = await page.evaluate(async () => {
    const b = await import('/src/core/backup.ts')
    const s = await import('/src/core/store.ts')
    const now = Date.now()
    const p = st => ({ stage: st, due: now, correct: 1, incorrect: 0, streak: 1, learnedAt: now, updatedAt: now })
    const snap = {
      progress: { a: p(3) }, scriptProgress: { 'ก': p(2) },
      maxUnlocked: 4, xp: 100, streakDays: 2, lastActiveDay: '2026-08-18',
      history: [], settings: { sound: true, showReading: false, newPerDay: 6, sessionSize: 20 },
      // v4. A backup that drops this silently un-spaces Sentence Builder on
      // the device it is restored to — no error, just repeats coming back.
      seenSentences: { ab12cd34: now - 1000 },
    }
    const json = b.serializeBackup(snap)
    const tryParse = txt => { try { b.parseBackup(txt); return 'accepted' } catch (e) { return e.message } }
    return {
      roundOk: JSON.stringify(b.parseBackup(json).state) === JSON.stringify(snap),
      junk: tryParse('haha'),
      wrongApp: tryParse(JSON.stringify({ app: 'other', version: 1, state: {} })),
      future: tryParse(JSON.stringify({ app: 'chaienglish', version: s.PERSIST_VERSION + 5, state: snap })),
      versionString: tryParse(JSON.stringify({ app: 'chaienglish', version: '2', state: snap })),
      versionMissing: tryParse(JSON.stringify({ app: 'chaienglish', state: snap })),
      empty: tryParse(JSON.stringify({ app: 'chaienglish', version: 1, state: { progress: {} } })),
      oldMigrated: b.parseBackup(JSON.stringify({
        app: 'chaienglish', version: 0, state: { progress: { a: { stage: 99 } }, xp: 5 },
      })).state.progress.a.stage,
      snapshotKeys: Object.keys(s.snapshotOf(s.useApp.getState())).sort().join(','),
      // v1 blobs predate the pacing settings — the step must default them
      // rather than leaving them undefined (zustand's merge is shallow).
      v1Settings: b.parseBackup(JSON.stringify({
        app: 'chaienglish', version: 1,
        state: { progress: { a: p(3) }, settings: { sound: false, showReading: false } },
      })).state.settings,
      // and an out-of-range value must be clamped, not trusted
      clamped: b.parseBackup(JSON.stringify({
        app: 'chaienglish', version: 2,
        state: { progress: { a: p(3) }, settings: { newPerDay: 999, sessionSize: -5 } },
      })).state.settings,
      // v3 adds updatedAt, the per-record clock sync merges on. A pre-v3 record
      // must be backfilled from learnedAt — NOT from now, which would make
      // every local record look newer than the server's and win every merge.
      v3Backfill: b.parseBackup(JSON.stringify({
        app: 'chaienglish', version: 2,
        state: { progress: { a: { stage: 3, due: now, correct: 1, incorrect: 0, streak: 1, learnedAt: 12345 } } },
      })).state.progress.a,
    }
  })
  check('backup: serialize → parse round-trips identically', pure.roundOk)
  check('backup: a pre-v3 record gets updatedAt backfilled from learnedAt, not from now',
    pure.v3Backfill.updatedAt === 12345,
    `updatedAt=${pure.v3Backfill.updatedAt}, learnedAt=${pure.v3Backfill.learnedAt}`)
  check('backup: junk text refused', /not valid JSON/i.test(pure.junk))
  check('backup: foreign JSON refused', /not a ChaiEnglish backup/i.test(pure.wrongApp))
  check('backup: future version refused', /newer version/i.test(pure.future))
  check('backup: STRING version field refused, not guessed as v0',
    /version field is damaged/i.test(pure.versionString), pure.versionString)
  check('backup: MISSING version field refused, not guessed as v0',
    /version field is damaged/i.test(pure.versionMissing), pure.versionMissing)
  check('backup: empty backup cannot wipe real progress', /no progress/i.test(pure.empty))
  check('backup: old v0 backup file migrates on import (99→9)', pure.oldMigrated === 9)
  check('migration v1→v2: pacing settings defaulted on an older backup',
    pure.v1Settings.newPerDay === 6 && pure.v1Settings.sessionSize === 20 &&
    pure.v1Settings.sound === false,
    JSON.stringify(pure.v1Settings))
  check('migration v1→v2: out-of-range pacing values are clamped',
    pure.clamped.newPerDay === 15 && pure.clamped.sessionSize === 10,
    `newPerDay 999→${pure.clamped.newPerDay}, sessionSize -5→${pure.clamped.sessionSize}`)
  check('backup: snapshotOf keys pinned — a forgotten field fails HERE, not in a backup',
    pure.snapshotKeys === 'history,lastActiveDay,maxUnlocked,progress,scriptProgress,seenSentences,settings,streakDays,xp',
    pure.snapshotKeys)

  // ── 6. UI: export, then import a SMALLER backup over live data ─────────────
  const richBlob = {
    version: 1,
    state: {
      ...v0state,
      progress: {
        sawatdii: prog(6), khoop_khun: prog(5), 'p-yaak': prog(4),
        aroi: prog(5), phet: prog(4),
      },
      xp: 4242, maxUnlocked: 4,
    },
  }
  await bootWith(page, richBlob)
  await gotoSettings(page)

  const dlDir = mkdtempSync(join(tmpdir(), 'chaienglish-bk-'))
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.getByRole('button', { name: /Download backup/ }).click(),
  ])
  const richFile = join(dlDir, download.suggestedFilename())
  await download.saveAs(richFile)
  check('ui: export downloads a dated JSON file',
    /^chaienglish-backup-\d{4}-\d{2}-\d{2}\.json$/.test(download.suggestedFilename()) &&
    JSON.parse(readFileSync(richFile, 'utf8')).state.xp === 4242)

  // A one-lesson spare-device backup — the classic foot-gun.
  const smallFile = join(dlDir, 'small.json')
  writeFileSync(smallFile, JSON.stringify({
    app: 'chaienglish', version: 1, exportedAt: '2026-08-01T00:00:00Z',
    state: {
      progress: { sawatdii: prog(1) }, scriptProgress: {},
      maxUnlocked: 1, xp: 40, streakDays: 1, lastActiveDay: '2026-08-01',
      history: [], settings: { sound: true, showReading: true },
    },
  }))
  await page.locator('input[type=file]').setInputFiles(smallFile)
  await page.waitForSelector('.import-confirm', { timeout: 5000 })
  const confirmBox = await page.locator('.import-confirm').innerText()
  const isDanger = await page.locator('.import-confirm.danger').count()
  check('ui: importing a smaller backup over live data warns loudly',
    isDanger === 1 && /LESS than you have now/i.test(confirmBox))
  check('ui: the confirm shows BOTH sides, not just the incoming file',
    /Now on this device:[\s\S]*5 items/.test(confirmBox) && /1 items · 0 letters/.test(confirmBox),
    confirmBox.replace(/\n/g, ' · ').slice(0, 120))
  await page.getByRole('button', { name: /Replace anyway/ }).click()
  await page.waitForTimeout(400)
  const afterSmall = await getState(page)
  const rkImport1 = await rescueKeys(page)
  check('ui: import applied and the pre-import state was stashed',
    Object.keys(afterSmall.progress).length === 1 && afterSmall.xp === 40 &&
    rkImport1.some(k => k.includes('import')),
    `rescues: ${rkImport1.join(', ')}`)

  // ── 7. restore from the recovery snapshot ──────────────────────────────────
  await page.waitForSelector('.rescue-row', { timeout: 5000 })
  check('ui: the recovery snapshot row shows what it holds',
    /5 items/.test(await page.locator('.rescue-row').first().innerText()))
  await page.locator('.rescue-row').first().getByRole('button', { name: /Restore/ }).click()
  await page.waitForSelector('.import-confirm', { timeout: 5000 })
  await page.locator('.import-confirm').getByRole('button', { name: /Replace/ }).first().click()
  await page.waitForTimeout(400)
  const restored = await getState(page)
  const rkImport2 = await rescueKeys(page)
  check('ui: restore brings back all 5 items and 4,242 XP',
    Object.keys(restored.progress).length === 5 && restored.xp === 4242)
  check('ui: consecutive stashes accumulate — nothing clobbered',
    rkImport2.filter(k => k.includes('import')).length === 2,
    rkImport2.join(', '))

  // ── 8. imports survive a reload ────────────────────────────────────────────
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const rebooted = await getState(page)
  check('ui: the restored state actually rehydrates after a reload',
    Object.keys(rebooted.progress).length === 5 && rebooted.xp === 4242)

  // ── 9. a storage write failure reports failure ─────────────────────────────
  await gotoSettings(page)
  await page.evaluate(() => {
    const orig = Storage.prototype.setItem
    // eslint-disable-next-line no-extend-native
    Storage.prototype.setItem = function (k, v) {
      if (k === 'chaienglish-v1') throw new DOMException('QuotaExceededError')
      return orig.call(this, k, v)
    }
  })
  await page.locator('input[type=file]').setInputFiles(smallFile)
  await page.waitForSelector('.import-confirm', { timeout: 5000 })
  await page.getByRole('button', { name: /Replace anyway/ }).click()
  await page.waitForTimeout(400)
  const quotaNotice = await page.locator('.data-notice.err').innerText().catch(() => '')
  check('ui: a quota failure during import reports FAILURE, never success',
    /could not be SAVED/i.test(quotaNotice), quotaNotice.slice(0, 80) || 'no error notice shown')
  await page.reload({ waitUntil: 'networkidle' })  // clears the monkeypatch

  // ── 10. paste-import path ──────────────────────────────────────────────────
  await page.waitForTimeout(400)
  await gotoSettings(page)
  await page.getByRole('button', { name: /Paste backup/ }).click()
  await page.locator('.paste-box').fill(readFileSync(smallFile, 'utf8'))
  await page.getByRole('button', { name: /Read pasted backup/ }).click()
  await page.waitForSelector('.import-confirm', { timeout: 5000 })
  check('ui: pasted backup text reaches the same confirm pipeline',
    (await page.locator('.import-confirm').innerText()).includes('pasted text'))
  await page.locator('.import-confirm').getByRole('button', { name: /Cancel|anyway/ }).last().click()

  // ── 11. toggles persist ────────────────────────────────────────────────────
  const sndBefore = (await getState(page)).settings.sound
  await page.locator('.toggle').first().click()
  await page.waitForTimeout(300)
  check('ui: sound toggle flips and persists',
    (await readBlob(page)).state.settings.sound === !sndBefore)

  // ── 12. developer / recovery tools (?dev=1 only) ───────────────────────────
  await bootWith(page, richBlob)
  await gotoSettings(page)
  check('dev: the panel is hidden without ?dev=1',
    (await page.locator('.dev-card').count()) === 0)

  const dev = await page.evaluate(async () => {
    const m = await import('/src/core/store.ts')
    const d = await import('/src/core/dev.ts')
    const data = await import('/src/data/index.ts')
    const now = Date.now()
    const ids = data.CURRICULUM[0].itemIds.slice(0, 3)
    const prog = {}
    // A real, mature record the tools must not damage.
    prog[ids[0]] = { stage: 7, due: now + 500 * 3600e3, correct: 40, incorrect: 2, streak: 12, learnedAt: now - 9e8 }
    prog[ids[1]] = { stage: 3, due: now + 40 * 3600e3, correct: 3, incorrect: 0, streak: 3, learnedAt: now }
    prog[ids[2]] = { stage: 9, due: Number.MAX_SAFE_INTEGER, correct: 9, incorrect: 0, streak: 9, learnedAt: now }
    m.useApp.setState({ progress: prog, scriptProgress: {}, maxUnlocked: 1, xp: 0 })

    const dueBefore = m.dueReviewIds(m.useApp.getState().progress).length
    d.advanceClock(48)
    const afterClock = m.useApp.getState()

    const jump = d.jumpToLevel(9)
    const afterJump = m.useApp.getState()
    return {
      dueBefore,
      dueAfterClock: m.dueReviewIds(afterClock.progress).length,
      burnedUntouched: afterClock.progress[ids[2]].due === Number.MAX_SAFE_INTEGER,
      stagesUnchangedByClock: afterClock.progress[ids[1]].stage === 3,
      jump,
      matureIntact: afterJump.progress[ids[0]].stage === 7 && afterJump.progress[ids[0]].correct === 40,
      seededStage: afterJump.progress[data.CURRICULUM[3].itemIds[0]]?.stage,
      seededDueWithin: (afterJump.progress[data.CURRICULUM[3].itemIds[0]]?.due ?? 0) - Date.now() <= 25 * 3600e3,
      lettersSeeded: Object.keys(afterJump.scriptProgress).length,
      gateNeed: m.SCRIPT_GATES[9],
      unlocked: m.effectiveUnlocked(afterJump),
    }
  })
  check('dev: advanceClock makes future reviews due now',
    dev.dueBefore === 0 && dev.dueAfterClock >= 1, `${dev.dueBefore} → ${dev.dueAfterClock} due`)
  check('dev: advanceClock never resurrects a burned item', dev.burnedUntouched)
  check('dev: advanceClock fabricates no knowledge (stages unchanged)', dev.stagesUnchangedByClock)
  check('dev: jumpToLevel seeds at the unlock threshold, no higher',
    dev.seededStage === 4, `seeded at stage ${dev.seededStage}`)
  check('dev: seeded items come back for a real answer within a day',
    dev.seededDueWithin === true)
  check('dev: jumpToLevel never overwrites real progress', dev.matureIntact,
    'a stage-7 record with 40 corrects survived untouched')
  check('dev: jumpToLevel satisfies the reading checkpoint it crosses',
    dev.lettersSeeded >= dev.gateNeed && dev.unlocked >= 9,
    `${dev.lettersSeeded} letters seeded for L9 (needs ${dev.gateNeed}), unlocked=${dev.unlocked}`)

  check('zero uncaught page errors across every scenario', pageErrors.length === 0,
    pageErrors.slice(0, 3).join(' | ') || 'clean')
} finally {
  await browser.close()
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length} assertions, ${failed.length} failed`)
if (failed.length) process.exit(1)
