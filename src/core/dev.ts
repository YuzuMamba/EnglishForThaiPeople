import { useApp, unlockedLevel, SCRIPT_GATES, SCRIPT_GATE_STAGE } from './store'
import { CURRICULUM, SCRIPT_CHARS } from '../data'
import { SRS_INTERVALS_H, type ItemProgress, type SrsStage } from './types'

// ─── Developer / recovery tools ──────────────────────────────────────────────
// Enabled only with ?dev=1, and deliberately kept OUT of the store's AppState
// so the shipped action surface stays clean. These exist because progress is
// per-origin localStorage (CLAUDE.md §2): change the deploy URL and the
// learner's history is stranded on the old origin, not lost — but a way back
// in is still needed when a real backup wasn't taken in time.

const DEV_FLAG = 'chaienglish-dev'

/**
 * `?dev=1` works on a normal deploy, but NOT inside the artifact viewer: the
 * page runs sandboxed, so a query string typed on the outer URL never reaches
 * `location.search`. A sticky flag, set by tapping the Settings heading, is
 * the trigger that works in every context — including a home-screen app,
 * where there is no address bar to type a parameter into at all.
 */
export function devEnabled(): boolean {
  try {
    if (new URLSearchParams(location.search).get('dev') === '1') return true
  } catch { /* sandboxed location — fall through to the flag */ }
  try {
    return localStorage.getItem(DEV_FLAG) === '1'
  } catch {
    return false
  }
}

/** Returns the new state. */
export function setDevEnabled(on: boolean): boolean {
  try {
    if (on) localStorage.setItem(DEV_FLAG, '1')
    else localStorage.removeItem(DEV_FLAG)
  } catch { /* storage blocked — the panel simply won't stick */ }
  return on
}

const BURN_STAGE = (SRS_INTERVALS_H.length - 1) as SrsStage

/** Nothing is due later than this — the burn sentinel must never be shifted
 *  into the past, or retired items come flooding back. */
const isBurned = (p: ItemProgress): boolean =>
  p.stage >= BURN_STAGE || p.due >= Number.MAX_SAFE_INTEGER

/**
 * Move every due date back by `hours`, i.e. pretend that long has passed.
 *
 * This fabricates NO knowledge — it only makes already-learned items
 * reviewable now. That makes it the honest tool for testing the scheduler and
 * for catching up after an interruption: you still have to answer everything.
 */
export function advanceClock(hours: number): void {
  const ms = hours * 3600_000
  const shift = (m: Record<string, ItemProgress>): Record<string, ItemProgress> => {
    const out: Record<string, ItemProgress> = {}
    for (const [id, p] of Object.entries(m)) out[id] = isBurned(p) ? p : { ...p, due: p.due - ms }
    return out
  }
  const st = useApp.getState()
  useApp.setState({ progress: shift(st.progress), scriptProgress: shift(st.scriptProgress) })
}

export interface JumpResult {
  itemsSeeded: number
  lettersSeeded: number
  unlocked: number
}

/**
 * Rebuild a plausible history up to (not including) level `n`, so the path
 * reopens at that level.
 *
 * ⚠ This FABRICATES review history. Seeded items are placed at exactly the
 * unlock threshold (stage 4) and no higher, and their first review is
 * scheduled soon rather than far out, so the scheduler re-tests everything
 * quickly instead of trusting knowledge you may not have. Items you already
 * have real progress on are never overwritten.
 */
export function jumpToLevel(n: number, stage: SrsStage = 4): JumpResult {
  const st = useApp.getState()
  const now = Date.now()
  const progress = { ...st.progress }
  const scriptProgress = { ...st.scriptProgress }
  let itemsSeeded = 0
  let lettersSeeded = 0

  const seed = (): ItemProgress => ({
    stage,
    // Deliberately short: a fabricated item should come back for a real
    // answer within a day, not sit on a 4-day interval it never earned.
    due: now + Math.min(SRS_INTERVALS_H[stage], 24) * 3600_000,
    correct: stage, incorrect: 0, streak: stage,
    // Backdated: `learnedTodayCount` reads learnedAt, so stamping "now" would
    // burn the whole daily new-item budget the moment you jump.
    learnedAt: now - 30 * 86400_000,
  })

  for (const lv of CURRICULUM.filter(l => l.n < n)) {
    for (const id of lv.itemIds.concat(lv.patternIds)) {
      if (!progress[id]) { progress[id] = seed(); itemsSeeded++ }
    }
  }

  // Reading checkpoints are part of the gate, so a jump past one has to
  // satisfy it or the level still won't open. Seed the earliest characters
  // (the course teaches them in order) up to the largest checkpoint crossed.
  const need = Math.max(0, ...Object.entries(SCRIPT_GATES)
    .filter(([lv]) => Number(lv) <= n)
    .map(([, count]) => count))
  if (need > 0) {
    const already = Object.keys(scriptProgress)
      .filter(c => SCRIPT_CHARS[c] && (scriptProgress[c]?.stage ?? 0) >= SCRIPT_GATE_STAGE).length
    for (const c of Object.keys(SCRIPT_CHARS)) {
      if (already + lettersSeeded >= need) break
      if (!scriptProgress[c]) {
        scriptProgress[c] = { ...seed(), stage: SCRIPT_GATE_STAGE, correct: SCRIPT_GATE_STAGE, streak: SCRIPT_GATE_STAGE }
        lettersSeeded++
      }
    }
  }

  // Recompute through the real gate rather than asserting a level — if the
  // seed doesn't actually satisfy unlockedLevel, the jump should under-deliver
  // visibly instead of stamping a level the rules don't support.
  const maxUnlocked = Math.max(st.maxUnlocked, unlockedLevel(progress, scriptProgress))
  useApp.setState({ progress, scriptProgress, activeLevel: Math.min(n, maxUnlocked), maxUnlocked })
  return { itemsSeeded, lettersSeeded, unlocked: maxUnlocked }
}

/** Wipe everything back to a clean install (the blob is rescued first by the
 *  caller, so this stays recoverable). */
export function resetAll(): void {
  useApp.setState({
    progress: {}, scriptProgress: {}, maxUnlocked: 1, xp: 0,
    streakDays: 0, lastActiveDay: '', history: [], activeLevel: 1,
  })
}
