// Merging two devices' progress. Pure functions, no I/O — this is the part of
// sync where data actually gets lost, so it is kept separate from the network
// and tested exhaustively by scripts/verify-sync.mjs.
//
// The governing rule: A MERGE MUST NEVER LOSE GROUND. Every field is combined
// with an operation that cannot go backwards on its own — max for monotonic
// counters, newer-wins for records that carry their own clock, union for
// collections. Whole-blob last-write-wins is what this exists to avoid: it
// silently discards whichever device synced first, which is precisely the
// failure that made progress feel unreliable in the first place.
//
// A note on why this is a *client-side* merge over a single stored row rather
// than per-row database writes: the whole snapshot is ~66 KB (measured on a
// full 22-level learner), so one JSONB row is cheap, atomic, and needs no
// schema migrations as content grows. The per-record correctness that matters
// is achieved here, in code that can be tested without a server.

import type { ItemProgress } from './types'
import { pruneSeen, type PersistedSnapshot } from './store'

/** A snapshot plus the wall-clock stamp of when the device last wrote it. */
export interface SyncEnvelope {
  snapshot: PersistedSnapshot
  /** Epoch ms. Used only for the scalars that carry no clock of their own. */
  updatedAt: number
  /** Which device wrote it — for display, never for merge decisions. */
  deviceId: string
}

const recordTime = (p: ItemProgress): number => p.updatedAt ?? p.learnedAt ?? 0

/**
 * Pick between two records for the same id. Newer `updatedAt` wins.
 *
 * On an exact tie — same millisecond, genuinely possible after the v3 backfill
 * stamped a whole map from `learnedAt` — fall back to whichever record is
 * further along, then to more answers seen. Never to "whichever argument came
 * first": that would make the result depend on which device called itself
 * local, and the two would then disagree forever.
 */
function pickRecord(ra: ItemProgress, rb: ItemProgress): ItemProgress {
  const ta = recordTime(ra)
  const tb = recordTime(rb)
  if (tb !== ta) return tb > ta ? rb : ra
  if (rb.stage !== ra.stage) return rb.stage > ra.stage ? rb : ra
  const answersA = ra.correct + ra.incorrect
  const answersB = rb.correct + rb.incorrect
  if (answersB !== answersA) return answersB > answersA ? rb : ra
  return ra
}

/**
 * Merge two progress maps, taking the newer record per id.
 *
 * SYMMETRIC AND DETERMINISTIC: `mergeProgress(a, b)` and `mergeProgress(b, a)`
 * produce byte-identical JSON. That is not tidiness — both devices run this
 * merge independently, so if the two orderings disagreed they would push
 * different blobs back and forth and never converge. Keys are emitted sorted
 * for the same reason: object key order is part of the serialised form that
 * gets stored and compared.
 */
export function mergeProgress(
  a: Record<string, ItemProgress>,
  b: Record<string, ItemProgress>,
): Record<string, ItemProgress> {
  const out: Record<string, ItemProgress> = Object.create(null)
  for (const id of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    const ra = a[id]
    const rb = b[id]
    out[id] = !ra ? rb : !rb ? ra : pickRecord(ra, rb)
  }
  return out
}

/** Merge day-by-day history, keeping the highest figures seen for each day. */
export function mergeHistory(
  a: PersistedSnapshot['history'],
  b: PersistedSnapshot['history'],
): PersistedSnapshot['history'] {
  const byDay = new Map<string, { day: string; reviews: number; xp: number }>()
  for (const h of [...(a ?? []), ...(b ?? [])]) {
    if (!h?.day) continue
    const cur = byDay.get(h.day)
    byDay.set(h.day, cur
      ? { day: h.day, reviews: Math.max(cur.reviews, h.reviews), xp: Math.max(cur.xp, h.xp) }
      : { day: h.day, reviews: h.reviews, xp: h.xp })
  }
  return [...byDay.values()].sort((x, y) => x.day.localeCompare(y.day))
}

/**
 * Merge two full snapshots.
 *
 * Field by field, and each choice is deliberate:
 *
 *   progress / scriptProgress — per record, newer `updatedAt` wins. The only
 *     place a genuine conflict can occur, and the only place `updatedAt` is
 *     consulted.
 *   maxUnlocked — max. Already monotonic by design (`effectiveUnlocked`), so
 *     taking the max preserves that invariant across devices.
 *   xp / streakDays — max. Both are non-gating, so the worst case is that a
 *     device's XP does not add to the other's; taking the max can never show a
 *     learner *less* than they had, which is the property that matters.
 *   lastActiveDay — later of the two.
 *   history — per day, highest figures.
 *   settings — from whichever envelope was written more recently. Preferences
 *     are the one thing where "most recent choice wins" is what a human
 *     actually expects; there is no meaningful way to merge a slider.
 *   seenSentences — per sentence, the later timestamp. Union, so a sentence
 *     built on the phone is not offered again on the iPad; and later-wins,
 *     because a sentence seen on both devices was most recently seen at the
 *     later of the two. Same never-lose-ground shape as everything above.
 */
export function mergeSnapshots(a: SyncEnvelope, b: SyncEnvelope): PersistedSnapshot {
  // Same symmetry requirement as pickRecord: on an exact timestamp tie, break
  // it on the content rather than on argument order, or the two devices choose
  // different settings and keep overwriting each other.
  const newer = b.updatedAt !== a.updatedAt
    ? (b.updatedAt > a.updatedAt ? b : a)
    : (JSON.stringify(b.snapshot.settings) > JSON.stringify(a.snapshot.settings) ? b : a)
  return {
    progress: mergeProgress(a.snapshot.progress ?? {}, b.snapshot.progress ?? {}),
    scriptProgress: mergeProgress(a.snapshot.scriptProgress ?? {}, b.snapshot.scriptProgress ?? {}),
    maxUnlocked: Math.max(a.snapshot.maxUnlocked ?? 1, b.snapshot.maxUnlocked ?? 1),
    xp: Math.max(a.snapshot.xp ?? 0, b.snapshot.xp ?? 0),
    streakDays: Math.max(a.snapshot.streakDays ?? 0, b.snapshot.streakDays ?? 0),
    lastActiveDay: (a.snapshot.lastActiveDay ?? '') > (b.snapshot.lastActiveDay ?? '')
      ? a.snapshot.lastActiveDay
      : b.snapshot.lastActiveDay,
    history: mergeHistory(a.snapshot.history, b.snapshot.history),
    settings: newer.snapshot.settings,
    seenSentences: pruneSeen(mergeSeen(a.snapshot.seenSentences, b.snapshot.seenSentences)),
  }
}

/** Union of two seen-maps, keeping the later sighting of each sentence. */
export function mergeSeen(
  a: Record<string, number> | undefined,
  b: Record<string, number> | undefined,
): Record<string, number> {
  const out: Record<string, number> = {}
  // Keys emitted in sorted order for the same reason mergeProgress does it:
  // merging in argument order makes merge(a,b) and merge(b,a) differ byte for
  // byte, and two devices then push each other's copy back and forth forever.
  for (const k of [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])].sort()) {
    out[k] = Math.max((a ?? {})[k] ?? 0, (b ?? {})[k] ?? 0)
  }
  return out
}

/** Records changed on either side — for reporting what a sync actually did. */
export function describeMerge(
  local: PersistedSnapshot, merged: PersistedSnapshot,
): { gained: number; advanced: number } {
  let gained = 0
  let advanced = 0
  for (const map of ['progress', 'scriptProgress'] as const) {
    const l = local[map] ?? {}
    const m = merged[map] ?? {}
    for (const id of Object.keys(m)) {
      if (!l[id]) gained++
      else if (recordTime(m[id]) > recordTime(l[id])) advanced++
    }
  }
  return { gained, advanced }
}
