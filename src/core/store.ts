import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import type { ItemProgress, SrsStage } from './types'
import { applyAnswer, isDue, newProgress } from './srs'
import { CURRICULUM, SCRIPT_CHARS, charsThroughStage, getAnyItem } from '../data'
import { graphemeUnits } from './phonics'
import { mirror } from './vault'

export type Screen =
  | 'home' | 'lesson' | 'review' | 'builder'
  | 'listening' | 'script' | 'sounds' | 'library' | 'about' | 'settings'

interface DayStat {
  /** YYYY-MM-DD */
  day: string
  reviews: number
  xp: number
}

interface AppState {
  screen: Screen
  /** Level currently opened in the lesson flow. */
  activeLevel: number
  progress: Record<string, ItemProgress>
  scriptProgress: Record<string, ItemProgress>
  /** Highest level ever unlocked — monotonic; lapsing reviews never re-lock. */
  maxUnlocked: number
  xp: number
  streakDays: number
  lastActiveDay: string
  history: DayStat[]
  settings: PacedSettings
  seenSentences: Record<string, number>

  go(s: Screen): void
  openLevel(n: number): void
  learnItem(id: string): void
  /** schedule=false records stats without moving stage/due (practice credit). */
  answer(id: string, correct: boolean, schedule?: boolean): void
  /** schedule=false records stats without moving stage/due (practice credit). */
  answerScript(id: string, correct: boolean, schedule?: boolean): void
  /** First exposure to a grapheme — enters it into the phonics SRS deck. */
  learnScriptChar(char: string): void
  /** Records that Sentence Builder has just served a given sentence. */
  markSentenceSeen(hash: string): void
  addXp(n: number): void
  toggleSound(): void
  toggleReading(): void
  setPacing(patch: Partial<Pick<PacedSettings, 'newPerDay' | 'sessionSize'>>): void
  seedDemo(): void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Persistence versioning ──────────────────────────────────────────────────
// Any change to the SHAPE of persisted state must bump PERSIST_VERSION and
// extend migrateState with a step from the previous version. The same chain
// runs on boot (zustand `migrate`) and on backup import (core/backup.ts), so
// old blobs and old backup files both land on the current shape.

/** v0: implicit zustand default (no version field ever written before this).
 *  v1: identical shape, but normalized — every ItemProgress field coerced to
 *      a sane value so a corrupted blob can't crash boot or the scheduler.
 *  v2: settings gains newPerDay + sessionSize (pacing). Purely additive, but
 *      the version MUST bump: zustand's merge is shallow, so a v1 blob's
 *      settings object would replace the initial one wholesale and the new
 *      fields would arrive undefined.
 *  v3: every ItemProgress gains `updatedAt`, the per-record clock that account
 *      sync merges on. Backfilled from `learnedAt` (the only honest evidence
 *      of when an old record last moved) rather than from `now`: stamping the
 *      migration time would make every local record look newer than anything
 *      on the server and silently win every merge on the first sync.
 *  v4: adds `seenSentences` — Sentence Builder's memory of which sentences it
 *      has already served, so a new sitting continues where the last one left
 *      off instead of re-rolling at random. Purely additive and safe to arrive
 *      empty, but the version must bump for the same reason v2 did: zustand's
 *      merge is shallow. */
export const PERSIST_VERSION = 4

export interface PacedSettings {
  sound: boolean
  showReading: boolean
  /** New curriculum items offered per day. Letters are NOT counted — the
   *  script course is a parallel track the learner paces themselves. */
  newPerDay: number
  /** Questions served per review session. */
  sessionSize: number
}

export const PACING_DEFAULTS = { newPerDay: 6, sessionSize: 20 } as const
export const NEW_PER_DAY_RANGE = [2, 15] as const
export const SESSION_SIZE_RANGE = [10, 60] as const

const clampInt = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback
  return Math.min(hi, Math.max(lo, n))
}

/** The data half of AppState — what persists, what backups carry. */
export interface PersistedSnapshot {
  progress: Record<string, ItemProgress>
  scriptProgress: Record<string, ItemProgress>
  maxUnlocked: number
  xp: number
  streakDays: number
  lastActiveDay: string
  history: DayStat[]
  settings: PacedSettings
  /**
   * Sentence hash → when Sentence Builder last served it.
   *
   * Not scheduling state and deliberately not part of `progress`: a sentence
   * is not an item, has no SRS stage, and its only job here is to keep a
   * sitting from repeating what the last one already covered. Pruned to the
   * most recent SEEN_SENTENCE_CAP so it stays a few KB as the corpus grows.
   */
  seenSentences: Record<string, number>
}

/** Enough to cover the whole corpus today (461) with room as it grows. Once
 *  full, the oldest entries fall out and those sentences become eligible
 *  again — which is the correct end state, not a failure. */
export const SEEN_SENTENCE_CAP = 800

/** Keeps the newest N entries. */
export function pruneSeen(seen: Record<string, number>, cap = SEEN_SENTENCE_CAP): Record<string, number> {
  const keys = Object.keys(seen)
  if (keys.length <= cap) return seen
  const kept = keys.sort((a, b) => (seen[b] ?? 0) - (seen[a] ?? 0)).slice(0, cap)
  const out: Record<string, number> = {}
  for (const k of kept.sort()) out[k] = seen[k]
  return out
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback

/** Coerce one scheduling record. Never validates the ID — patterns are not in
 *  ITEMS and future content may not exist yet in this build; orphaned entries
 *  are harmless by design and must survive migration untouched. */
function normalizeProgress(v: unknown, now: number): ItemProgress | null {
  if (!isObj(v)) return null
  const streak = Math.max(0, Math.round(num(v.streak, 0)))
  // A damaged stage must not silently reset a Golden item to Seedling. When
  // stage is unreadable (NaN/Infinity/string), the streak is the best
  // surviving evidence of maturity — floor there, capped below Burned so we
  // never fabricate retirement. due=now surfaces it for a real review, which
  // re-anchors the truth either way.
  const stageRaw = typeof v.stage === 'number' && Number.isFinite(v.stage)
    ? Math.round(v.stage)
    : Math.min(8, streak)
  const stage = Math.min(9, Math.max(0, stageRaw)) as SrsStage
  // MAX_SAFE_INTEGER is the legitimate "burned, never due" sentinel.
  const due = num(v.due, now)
  return {
    stage,
    due,
    correct: Math.max(0, Math.round(num(v.correct, 0))),
    incorrect: Math.max(0, Math.round(num(v.incorrect, 0))),
    streak,
    learnedAt: num(v.learnedAt, now),
    // v3 backfill. A record written before updatedAt existed gets learnedAt,
    // which is always <= any real edit time, so it loses merges against a
    // genuinely newer record instead of wrongly winning them.
    updatedAt: num(v.updatedAt, num(v.learnedAt, now)),
  }
}

function normalizeMap(v: unknown, now: number): Record<string, ItemProgress> {
  if (!isObj(v)) return {}
  // Null prototype: backup files are arbitrary input, and a `__proto__` key
  // must neither pollute nor vanish silently into the prototype chain.
  const out: Record<string, ItemProgress> = Object.create(null)
  for (const [id, p] of Object.entries(v)) {
    const n = normalizeProgress(p, now)
    if (n) out[id] = n
  }
  return out
}

/** Boot- and import-time migration. `from` is the version the blob was
 *  written at; steps run IN ORDER until the shape is current. Every future
 *  step is an explicit `if (v < N) { st = reshape(st) }` block here — never
 *  an implicit "the normalization will handle it". A blob NEWER than this
 *  build is best-effort: the fields this version knows are extracted below,
 *  and the storage layer has already stashed the raw original to a rescue
 *  key before this runs (see appStorage.getItem). */
export function migrateState(persisted: unknown, from: number | undefined): PersistedSnapshot {
  const now = Date.now()
  const v = from ?? 0
  const st = isObj(persisted) ? persisted : {}
  // v0 → v1 (normalize) and v2 → v3 (backfill updatedAt) both happen inside
  // normalizeMap below, which is idempotent. A step that RESHAPES rather than
  // coerces gets its own explicit block here, oldest first:
  // if (v < 4) { st = reshapeV3toV4(st) }
  void v
  const settings = isObj(st.settings) ? st.settings : {}
  return {
    progress: normalizeMap(st.progress, now),
    scriptProgress: normalizeMap(st.scriptProgress, now),
    maxUnlocked: Math.max(1, Math.round(num(st.maxUnlocked, 1))),
    xp: Math.max(0, Math.round(num(st.xp, 0))),
    streakDays: Math.max(0, Math.round(num(st.streakDays, 0))),
    lastActiveDay: typeof st.lastActiveDay === 'string' ? st.lastActiveDay : '',
    history: Array.isArray(st.history)
      ? st.history.filter(isObj).map(h => ({
          day: typeof h.day === 'string' ? h.day : '',
          reviews: Math.max(0, Math.round(num(h.reviews, 0))),
          xp: Math.max(0, Math.round(num(h.xp, 0))),
        }))
      : [],
    settings: {
      sound: typeof settings.sound === 'boolean' ? settings.sound : true,
      showReading: typeof settings.showReading === 'boolean' ? settings.showReading : true,
      newPerDay: clampInt(settings.newPerDay, NEW_PER_DAY_RANGE[0], NEW_PER_DAY_RANGE[1], PACING_DEFAULTS.newPerDay),
      sessionSize: clampInt(settings.sessionSize, SESSION_SIZE_RANGE[0], SESSION_SIZE_RANGE[1], PACING_DEFAULTS.sessionSize),
    },
    // v3 → v4. Absent on every older blob, which is correct: an empty memory
    // simply means the next sitting picks at random, exactly as before.
    seenSentences: pruneSeen(normalizeSeen(st.seenSentences)),
  }
}

/** Hash → epoch ms, discarding anything that is not that. */
function normalizeSeen(v: unknown): Record<string, number> {
  if (!isObj(v)) return {}
  const out: Record<string, number> = {}
  for (const [k, t] of Object.entries(v)) {
    if (typeof k === 'string' && k.length > 0 && k.length <= 16 && typeof t === 'number' && Number.isFinite(t) && t > 0) {
      out[k] = Math.round(t)
    }
  }
  return out
}

/** The persisted fields of a live state object, for backups.
 *  ⚠ Any new persisted field MUST be added here AND to PersistedSnapshot, or
 *  it silently vanishes from every backup. verify-backup.mjs pins the keys. */
export function snapshotOf(st: PersistedSnapshot): PersistedSnapshot {
  const { progress, scriptProgress, maxUnlocked, xp, streakDays, lastActiveDay, history, settings, seenSentences } = st
  return { progress, scriptProgress, maxUnlocked, xp, streakDays, lastActiveDay, history, settings, seenSentences }
}

// ─── Rescue keys ─────────────────────────────────────────────────────────────
// Any operation that could destroy learner data stashes the ORIGINAL raw blob
// first: unreadable JSON, a blob from a newer app version, a failed migration,
// and every import. Keys are timestamped so consecutive stashes never clobber
// each other; the newest few are kept. Settings lists them with a Restore
// button, so recovery never requires devtools (which iOS doesn't have).

const RESCUE_PREFIX = 'chaienglish-rescue-'
export const RESCUE_KEEP = 5

const rescueTime = (key: string): number => Number(key.split('-').pop()) || 0

export function stashRescue(label: 'import' | 'corrupt' | 'newer' | 'migrate-error' | 'demo-overwrite', raw: string): void {
  if (!raw) return
  try {
    // Bump the timestamp on collision so two stashes in one millisecond
    // (possible under test, ruinous if the second silently clobbers the
    // first) always land on distinct keys.
    let ts = Date.now()
    while (localStorage.getItem(`${RESCUE_PREFIX}${label}-${ts}`) != null) ts++
    localStorage.setItem(`${RESCUE_PREFIX}${label}-${ts}`, raw)
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith(RESCUE_PREFIX))
      .sort((a, b) => rescueTime(b) - rescueTime(a))
    for (const k of keys.slice(RESCUE_KEEP)) localStorage.removeItem(k)
  } catch { /* storage full or unavailable — nothing safer to do than proceed */ }
}

export function listRescues(): { key: string; label: string; time: number; raw: string }[] {
  try {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(RESCUE_PREFIX))
      .sort((a, b) => rescueTime(b) - rescueTime(a))
      .map(key => ({
        key,
        label: key.slice(RESCUE_PREFIX.length).replace(/-\d+$/, ''),
        time: rescueTime(key),
        raw: localStorage.getItem(key) ?? '',
      }))
      .filter(r => r.raw)
  } catch {
    return []
  }
}

// ─── Storage layer ───────────────────────────────────────────────────────────
// Hand-rolled instead of createJSONStorage so the READ path can defend data:
//  · unreadable JSON  → stash the raw text to a rescue key, boot fresh —
//    without this, the first tap after a failed parse OVERWRITES a blob that
//    may still be 99% recoverable text
//  · missing/broken version field → coerce to 0 so migration actually runs
//    (zustand skips migrate entirely when version isn't a number)
//  · version NEWER than this build → stash the original before the best-effort
//    downgrade, so returning to the newer app can recover every field

function pickBacking(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    localStorage.setItem('__chaienglish_probe', '1')
    localStorage.removeItem('__chaienglish_probe')
    return localStorage
  } catch {
    // Sandboxed embeds may block localStorage — run in-memory, no persistence.
    const mem = new Map<string, string>()
    return {
      getItem: k => mem.get(k) ?? null,
      setItem: (k, v) => { mem.set(k, v) },
      removeItem: k => { mem.delete(k) },
    }
  }
}
const backing = pickBacking()

// Typed to the migrated snapshot — persist infers its persisted-state type
// from `migrate`'s return. At runtime setItem still receives the full state
// (no partialize), which JSON.stringify strips of functions as before.
const appStorage: PersistStorage<PersistedSnapshot> = {
  getItem: name => {
    const raw = backing.getItem(name)
    if (raw == null) return null
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      stashRescue('corrupt', raw)
      console.warn('[chaienglish] stored progress was unreadable — original preserved under a rescue key (Settings → snapshots); starting fresh')
      return null
    }
    const blob = isObj(parsed) ? parsed : {}
    const version = typeof blob.version === 'number' && Number.isFinite(blob.version)
      ? blob.version : 0
    if (version > PERSIST_VERSION) {
      stashRescue('newer', raw)
      console.warn(`[chaienglish] progress was written by a newer app (v${version} > v${PERSIST_VERSION}) — original preserved under a rescue key; loading the fields this version understands`)
    }
    return { state: blob.state as PersistedSnapshot, version }
  },
  setItem: (name, value) => { backing.setItem(name, JSON.stringify(value)) },
  removeItem: name => { backing.removeItem(name) },
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'home',
      activeLevel: 1,
      progress: {},
      scriptProgress: {},
      maxUnlocked: 1,
      xp: 0,
      streakDays: 0,
      lastActiveDay: '',
      history: [],
      settings: { sound: true, showReading: true, ...PACING_DEFAULTS },
      seenSentences: {},

      go: s => set({ screen: s }),
      openLevel: n => set({ activeLevel: n, screen: 'lesson' }),

      /** Sentence Builder served this sentence. Recorded so the next sitting
       *  reaches for something else first. */
      markSentenceSeen: hash =>
        set(st => ({
          seenSentences: pruneSeen({ ...st.seenSentences, [hash]: Date.now() }),
        })),

      learnItem: id =>
        set(st => ({
          progress: { ...st.progress, [id]: st.progress[id] ?? newProgress() },
        })),

      answer: (id, correct, schedule = true) =>
        set(st => {
          const cur = st.progress[id] ?? newProgress()
          const progress = { ...st.progress, [id]: applyAnswer(cur, correct, Date.now(), schedule) }
          return {
            progress,
            maxUnlocked: Math.max(st.maxUnlocked, unlockedLevel(progress, st.scriptProgress)),
          }
        }),

      answerScript: (id, correct, schedule = true) =>
        set(st => {
          const cur = st.scriptProgress[id] ?? newProgress()
          const scriptProgress = {
            ...st.scriptProgress,
            [id]: applyAnswer(cur, correct, Date.now(), schedule),
          }
          return {
            scriptProgress,
            // Graphemes can satisfy a checkpoint gate, so recompute the ceiling.
            maxUnlocked: Math.max(st.maxUnlocked, unlockedLevel(st.progress, scriptProgress)),
          }
        }),

      learnScriptChar: char =>
        set(st => (st.scriptProgress[char]
          ? st
          : { scriptProgress: { ...st.scriptProgress, [char]: newProgress() } })),

      addXp: n =>
        set(st => {
          const day = today()
          const hist = [...st.history]
          const last = hist[hist.length - 1]
          if (last && last.day === day) {
            hist[hist.length - 1] = { ...last, xp: last.xp + n, reviews: last.reviews + 1 }
          } else {
            hist.push({ day, xp: n, reviews: 1 })
          }
          let { streakDays, lastActiveDay } = st
          if (lastActiveDay !== day) {
            const yest = new Date(Date.now() - 86400_000).toISOString().slice(0, 10)
            streakDays = lastActiveDay === yest ? streakDays + 1 : 1
            lastActiveDay = day
          }
          return { xp: st.xp + n, history: hist.slice(-60), streakDays, lastActiveDay }
        }),

      toggleSound: () => set(st => ({ settings: { ...st.settings, sound: !st.settings.sound } })),
      toggleReading: () => set(st => ({ settings: { ...st.settings, showReading: !st.settings.showReading } })),
      setPacing: patch =>
        set(st => ({
          settings: {
            ...st.settings,
            ...(patch.newPerDay !== undefined
              ? { newPerDay: clampInt(patch.newPerDay, NEW_PER_DAY_RANGE[0], NEW_PER_DAY_RANGE[1], PACING_DEFAULTS.newPerDay) }
              : {}),
            ...(patch.sessionSize !== undefined
              ? { sessionSize: clampInt(patch.sessionSize, SESSION_SIZE_RANGE[0], SESSION_SIZE_RANGE[1], PACING_DEFAULTS.sessionSize) }
              : {}),
          },
        })),

      /** Seed a mid-journey account so every screen has life in it (demo / previews). */
      seedDemo: () => {
        const now = Date.now()
        const progress: Record<string, ItemProgress> = {}
        const levels = CURRICULUM.slice(0, 3)
        levels.forEach((lv, li) => {
          lv.itemIds.concat(lv.patternIds).forEach((id, i) => {
            const stage = (li === 0 ? 5 - (i % 2) : li === 1 ? 3 + (i % 2) : 1 + (i % 2)) as SrsStage
            const due = i % 3 === 0 ? now - 3600_000 : now + (i % 5) * 7200_000
            progress[id] = {
              stage, due,
              correct: 6 + i, incorrect: i % 4 === 0 ? 2 : 0,
              streak: 3, learnedAt: now - (20 - li * 5) * 86400_000,
            }
          })
        })
        // Guarantee a couple of PATTERNS are due so assemble questions are
        // always reachable in demo review sessions.
        for (const pid of ['p-i-want-to', 'p-can-i-have']) {
          if (progress[pid]) progress[pid] = { ...progress[pid], stage: 4, due: now - 3600_000 }
        }
        const day = (o: number) => new Date(now - o * 86400_000).toISOString().slice(0, 10)
        set({
          progress,
          maxUnlocked: unlockedLevel(progress, {}),
          xp: 4260,
          streakDays: 17,
          lastActiveDay: day(0),
          history: Array.from({ length: 14 }, (_, i) => ({
            day: day(13 - i),
            reviews: 12 + Math.round(18 * Math.abs(Math.sin(i * 1.7))),
            xp: 120 + Math.round(160 * Math.abs(Math.sin(i * 2.3))),
          })),
        })
      },
    }),
    {
      name: 'chaienglish-v1',
      version: PERSIST_VERSION,
      // Runs when a stored blob's version differs from PERSIST_VERSION, in
      // EITHER direction (appStorage stashes the original first when the blob
      // is newer). The migrated snapshot omits transient UI fields (screen,
      // activeLevel), which zustand's default merge fills from initial state —
      // note the whole state, transients included, is still WRITTEN on save.
      // A throwing migration must not fall through to zustand's silent
      // "unhydrated store + first write wins" path: stash and boot fresh.
      migrate: (persisted, version) => {
        try {
          return migrateState(persisted, version)
        } catch (e) {
          try { stashRescue('migrate-error', JSON.stringify({ state: persisted, version })) } catch { /* stash is best-effort */ }
          console.error('[chaienglish] migration failed — original preserved under a rescue key', e)
          return migrateState({}, PERSIST_VERSION)
        }
      },
      storage: appStorage,
    },
  ),
)

// ─── Second copy, outside localStorage ───────────────────────────────────────
// Progress has been lost three times, and localStorage alone gives no way to
// tell what happened. Every change is mirrored (debounced) into IndexedDB — a
// different quota bucket with different failure modes — and stamps a canary in
// four independent stores so the NEXT loss can be attributed instead of
// guessed at. See src/core/vault.ts. This is strictly additive: the hydration
// path above is unchanged and still the only thing the app boots from.
useApp.subscribe(st => { mirror(snapshotOf(st)) })

// ─── Selectors ───────────────────────────────────────────────────────────────

export function dueReviewIds(progress: Record<string, ItemProgress>): string[] {
  const now = Date.now()
  return Object.keys(progress).filter(id => getAnyItem(id) && isDue(progress[id], now))
}

/** Graphemes due for review right now. */
export function dueScriptIds(scriptProgress: Record<string, ItemProgress>): string[] {
  const now = Date.now()
  return Object.keys(scriptProgress).filter(c => SCRIPT_CHARS[c] && isDue(scriptProgress[c], now))
}

/**
 * The review session: one pool across all three decks, most overdue first,
 * cut to the session size.
 *
 * Previously the decks were interleaved round-robin and the overflow dropped
 * at random, so on a heavy day an item could stay overdue indefinitely while
 * its neighbours cycled — and the nav badge counted work the session refused
 * to serve. Draining oldest-first makes a backlog finite. Presentation order
 * is shuffled by the caller; WHICH items are served is strictly by urgency.
 */
export function dueQueue(st: {
  progress: Record<string, ItemProgress>
  scriptProgress: Record<string, ItemProgress>
  settings: PacedSettings
}): { id: string; script: boolean }[] {
  const now = Date.now()
  const pool: { id: string; due: number; script: boolean }[] = []
  for (const [id, p] of Object.entries(st.progress)) {
    if (getAnyItem(id) && isDue(p, now)) pool.push({ id, due: p.due, script: false })
  }
  for (const [id, p] of Object.entries(st.scriptProgress)) {
    if (SCRIPT_CHARS[id] && isDue(p, now)) pool.push({ id, due: p.due, script: true })
  }
  pool.sort((a, b) => a.due - b.due)
  return pool.slice(0, st.settings.sessionSize).map(({ id, script }) => ({ id, script }))
}

/** Stage a grapheme must reach to count toward a reading checkpoint. */
export const SCRIPT_GATE_STAGE = 2

/**
 * Reading checkpoints. Speaking runs free for the first four levels — the
 * whole point is saying useful things immediately — but from Level 5 on, the
 * path periodically requires real progress through the phonics course, so
 * the reading half can't be skipped forever. Value = graphemes at stage 2+.
 *
 * Computed from the course itself rather than written as numbers, so adding a
 * grapheme to a lesson moves the gate with it instead of silently loosening it.
 */
export const SCRIPT_GATES: Record<number, number> = {
  5: charsThroughStage(1).length,   // the five short vowels (lesson 1)
  9: charsThroughStage(2).length,   // + the familiar stops and nasals (lesson 2)
  13: charsThroughStage(3).length,  // + s f h l w y c (lesson 3)
  17: charsThroughStage(4).length,  // + the sounds Thai lacks (lesson 4)
  21: charsThroughStage(7).length,  // + magic e and the first vowel teams (lessons 6–7)
  25: charsThroughStage(9).length,  // + the rest of the teams and r-vowels (lessons 8–9)
  29: charsThroughStage(10).length, // everything, special letters included (lesson 10)
}

/** How many graphemes are retained well enough to count toward a gate. */
export function gatedCharCount(scriptProgress: Record<string, ItemProgress>): number {
  return Object.keys(scriptProgress)
    .filter(c => SCRIPT_CHARS[c] && (scriptProgress[c]?.stage ?? 0) >= SCRIPT_GATE_STAGE).length
}

/**
 * Can the learner actually sound this English out — is every grapheme in it
 * retained at `SCRIPT_GATE_STAGE`? The word is cut into the same units the
 * course teaches (`segmentGraphemes`): single letters, letter teams, magic e.
 * A unit taught nowhere, or taught but not yet retained, makes the whole word
 * unreadable: the answer deliberately errs toward "no", because the cost of a
 * wrong "yes" is an unanswerable review card, and the cost of a wrong "no" is
 * one extra line of Thai reading.
 */
export function canReadEnglish(en: string, scriptProgress: Record<string, ItemProgress>): boolean {
  for (const unit of graphemeUnits(en)) {
    if (!SCRIPT_CHARS[unit]) return false
    if ((scriptProgress[unit]?.stage ?? -1) < SCRIPT_GATE_STAGE) return false
  }
  return true
}

/** Graphemes still needed before `levelN` can open (0 = gate satisfied). */
export function scriptGateShortfall(
  levelN: number, scriptProgress: Record<string, ItemProgress>,
): number {
  const need = SCRIPT_GATES[levelN] ?? 0
  return Math.max(0, need - gatedCharCount(scriptProgress))
}

/** The level gate the UI should use: live computation, floored by the
 *  persisted monotonic maximum so lapsed reviews never re-lock a level. */
export function effectiveUnlocked(st: {
  progress: Record<string, ItemProgress>
  scriptProgress: Record<string, ItemProgress>
  maxUnlocked: number
}): number {
  return Math.max(st.maxUnlocked, unlockedLevel(st.progress, st.scriptProgress))
}

/** A level unlocks when ≥80% of the previous level's items reach stage 4+ —
 *  and, at checkpoint levels, when enough English graphemes are also retained. */
export function unlockedLevel(
  progress: Record<string, ItemProgress>,
  scriptProgress: Record<string, ItemProgress> = {},
): number {
  let unlocked = 1
  for (const lv of CURRICULUM) {
    const ids = lv.itemIds.concat(lv.patternIds)
    if (ids.length === 0) break
    const passed = ids.filter(id => (progress[id]?.stage ?? 0) >= 4).length
    const next = Math.min(CURRICULUM.length, lv.n + 1)
    if (passed / ids.length >= 0.8 && scriptGateShortfall(next, scriptProgress) === 0) unlocked = next
    else break
  }
  return unlocked
}

// ─── Pacing ──────────────────────────────────────────────────────────────────
// A level is ~18 items and the unlock gate is 84h away, so learning a whole
// level at once produced one dense day followed by three empty ones — the same
// ~5 items/day on average, but felt as a drought. Two changes fix that without
// touching the scheduler: a daily budget spreads a level over several days,
// and a rolling frontier lets the next level's material start once the current
// one is fully MET, so the budget never runs dry waiting for mastery.

/** New curriculum items already started today. Derived from `learnedAt`
 *  rather than a counter, so it needs no extra persisted state and can never
 *  drift out of sync with `progress`. */
export function learnedTodayCount(progress: Record<string, ItemProgress>): number {
  const day = today()
  return Object.entries(progress)
    .filter(([id, p]) => getAnyItem(id) && new Date(p.learnedAt).toISOString().slice(0, 10) === day)
    .length
}

/** How many new items the learner may still start today. */
export function newBudgetRemaining(st: {
  progress: Record<string, ItemProgress>
  settings: PacedSettings
}): number {
  return Math.max(0, st.settings.newPerDay - learnedTodayCount(st.progress))
}

/**
 * The highest level whose items may be LEARNED right now.
 *
 * Normally the unlocked level. Once every item up to there has been met, the
 * frontier rolls one level ahead — new material keeps arriving while the
 * earlier level is still maturing toward its gate. It never rolls past an
 * unsatisfied reading checkpoint, so `SCRIPT_GATES` still means something.
 * Builder and the level gate itself continue to use `effectiveUnlocked`;
 * learning runs ahead, and Listening follows the met frontier
 * (`listeningCap`) because a dialogue needs its words recognised, not held.
 */
export function learningFrontier(st: {
  progress: Record<string, ItemProgress>
  scriptProgress: Record<string, ItemProgress>
  maxUnlocked: number
}): number {
  const unlocked = effectiveUnlocked(st)
  const allMet = CURRICULUM
    .filter(lv => lv.n <= unlocked)
    .every(lv => lv.itemIds.concat(lv.patternIds).every(id => st.progress[id]))
  if (!allMet) return unlocked
  const next = Math.min(CURRICULUM.length, unlocked + 1)
  return scriptGateShortfall(next, st.scriptProgress) === 0 ? next : unlocked
}

/**
 * The highest level whose listening dialogues are open.
 *
 * A dialogue needs its words RECOGNISED, not retained: hearing them in flow
 * is what moves them toward retention. So a level's conversations open as
 * soon as every item in it (and below it) has been met, instead of waiting
 * for the 80%-at-stage-4 gate that opens the *next* level. With the rolling
 * frontier a learner is typically meeting level N+1 while level N is still
 * maturing; under the old rule that learner saw no conversation above N−1,
 * reported from use as "15 conversations against 186 Builder sentences".
 * The unlocked level stays the floor, so a learner who unlocked by mastery
 * without meeting every item loses nothing.
 */
export function listeningCap(st: {
  progress: Record<string, ItemProgress>
  scriptProgress: Record<string, ItemProgress>
  maxUnlocked: number
}): number {
  let met = 0
  for (const lv of CURRICULUM) {
    const ids = lv.itemIds.concat(lv.patternIds)
    if (ids.length === 0 || !ids.every(id => st.progress[id])) break
    met = lv.n
  }
  return Math.max(effectiveUnlocked(st), met)
}

/** Ids in a level not yet started. */
export function unlearnedIds(progress: Record<string, ItemProgress>, levelN: number): string[] {
  const lv = CURRICULUM.find(l => l.n === levelN)
  if (!lv) return []
  return lv.itemIds.concat(lv.patternIds).filter(id => !progress[id])
}
