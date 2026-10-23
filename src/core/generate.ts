import type { SentencePattern } from './types'
import { ITEMS, getAnyItem } from '../data'

// Shared sentence generator: turns a pattern + random compatible slot fills
// into a target sentence with English tokens, a Thai rendering, and a tile
// tray. Used by Sentence Builder mode AND by 'assemble' review questions.

export interface Tile {
  en: string
  /** Reading shown under the Thai. '' only when nothing can resolve it. */
  reading: string
  /**
   * English gloss, for a renderer that wants to scaffold an unfamiliar word.
   * '' for the literal words baked into a pattern, which are not items and are
   * already covered by the pattern's own explanation. Resolved here rather
   * than in each renderer, for the same reason `reading` is.
   */
  th: string
  id: string
}

export interface Round {
  pattern: SentencePattern
  fills: Record<string, string>
  tokens: Tile[]
  th: string
  tray: (Tile & { key: number })[]
}

// ─── readings for the literal words in a template ────────────────────────────
// Slot fills are lexicon items and carry their own reading. The words baked
// into the pattern itself (please, can, the) are not items, so without help
// they render as bare English on a tile sitting next to neighbours that show
// a reading.

const ITEM_READING = new Map<string, string>()
for (const it of Object.values(ITEMS)) {
  const k = it.en.toLowerCase()
  if (!ITEM_READING.has(k)) ITEM_READING.set(k, it.reading)
}

const isSlot = (s: string): boolean => /^\{\w+\}$/.test(s)
/** readingTemplate carries sentence punctuation the Thai template doesn't. */
const tidy = (s: string): string => s.replace(/[,.!?]+$/, '').trim()

/** Lexicon reading for one literal word, case-insensitively; a slash choice
 *  (a/an) reads as the readings joined the same way. '' when unknown. */
function lexiconReading(en: string): string {
  if (en.includes('/')) {
    const parts = en.split('/').map(lexiconReading)
    return parts.every(Boolean) ? parts.join('/') : ''
  }
  return ITEM_READING.get(tidy(en).toLowerCase()) ?? ''
}

/**
 * Readings for every literal word in a pattern, keyed by the Thai word.
 *
 * The pattern's own readingTemplate is the best source — it is the author's
 * reading of exactly this sentence, tones and all. Slot placeholders anchor
 * the two templates to each other, so the literal words between two anchors
 * correspond as a run. Thai is written without spaces inside a compound, so
 * a run's token counts can differ (ได้ไหม is one Thai word but two reading
 * ones); where they do, fall back to the lexicon.
 */
function literalReadings(pattern: SentencePattern): Map<string, string> {
  const out = new Map<string, string>()
  const T = pattern.enTemplate.split(/\s+/).filter(Boolean)
  const R = pattern.readingTemplate.split(/\s+/).filter(Boolean)
  let ti = 0, ri = 0
  while (ti < T.length) {
    if (isSlot(T[ti])) { ti++; if (isSlot(R[ri])) ri++; continue }
    const tRun: string[] = []
    const rRun: string[] = []
    while (ti < T.length && !isSlot(T[ti])) tRun.push(T[ti++])
    while (ri < R.length && !isSlot(R[ri])) rRun.push(R[ri++])
    for (let k = 0; k < tRun.length; k++) {
      const aligned = tRun.length === rRun.length ? rRun[k]
        : tRun.length === 1 ? rRun.join(' ')
        : ''
      out.set(tRun[k], tidy(aligned) || lexiconReading(tRun[k]))
    }
  }
  return out
}

/**
 * The gloss for a tile. Unlike `cleanTh`, which builds a readable sentence,
 * this keeps the parenthetical — "ฉัน (ผู้หญิง)" — because the part in
 * brackets is the part worth previewing.
 */
const tileTh = (raw: string): string => raw.split('/')[0].trim()

function cleanTh(raw: string): string {
  let s = raw.split('/')[0].trim()
  s = s.replace(/\s*\(.*?\)\s*/g, ' ').trim()
  return s
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/**
 * The fills a slot may take given what was filled before it.
 *
 * Shared by the generator and the counter so the two can never drift: a count
 * that disagrees with what the generator will actually serve is worse than no
 * count, because it sets a target the learner cannot reach.
 */
function allowedFor(
  pattern: SentencePattern,
  slot: SentencePattern['slots'][number],
  prevFill: string,
): string[] {
  return prevFill && pattern.compat?.[prevFill]
    ? slot.itemIds.filter(id => pattern.compat![prevFill].includes(id))
    : slot.itemIds
}

/** The English a given set of fills produces, as written tokens. */
function enTokens(pattern: SentencePattern, fills: Record<string, string>): string[] {
  const out: string[] = []
  for (const part of pattern.enTemplate.split(/\s+/)) {
    const m = part.match(/^\{(\w+)\}$/)
    if (m) {
      const id = fills[m[1]]
      if (id) out.push(ITEMS[id]?.en ?? '')
    } else {
      out.push(part)
    }
  }
  return out
}

/**
 * Identity of a built sentence — the English itself, not the pattern and slots
 * that produced it. Two routes to the same sentence are the same sentence, and
 * the learner has no way to see which route the generator took.
 */
export const sentenceKey = (round: Round): string => round.tokens.map(t => t.en).join(' ')

/** Every fill combination a pattern admits, mirroring makeRound's rules. */
function* fillCombos(
  pattern: SentencePattern,
  i = 0,
  prevFill = '',
  acc: Record<string, string> = {},
): Generator<Record<string, string>> {
  if (i === pattern.slots.length) { yield { ...acc }; return }
  const slot = pattern.slots[i]
  const allowed = allowedFor(pattern, slot, prevFill)
  // An optional slot with nothing compatible left is always dropped — the
  // generator has no other branch there, so neither does this.
  if (slot.optional) {
    yield* fillCombos(pattern, i + 1, prevFill, { ...acc, [slot.name]: '' })
    for (const id of allowed) yield* fillCombos(pattern, i + 1, id, { ...acc, [slot.name]: id })
    return
  }
  for (const id of allowed.length ? allowed : slot.itemIds) {
    yield* fillCombos(pattern, i + 1, id, { ...acc, [slot.name]: id })
  }
}

/** How many combinations exist, without building them. */
function comboCount(pattern: SentencePattern): number {
  const memo = new Map<string, number>()
  const rec = (i: number, prevFill: string): number => {
    if (i === pattern.slots.length) return 1
    const key = `${i}|${prevFill}`
    const hit = memo.get(key)
    if (hit !== undefined) return hit
    const slot = pattern.slots[i]
    const allowed = allowedFor(pattern, slot, prevFill)
    let n = slot.optional ? rec(i + 1, prevFill) : 0
    for (const id of slot.optional ? allowed : (allowed.length ? allowed : slot.itemIds)) {
      n += rec(i + 1, id)
    }
    memo.set(key, n)
    return n
  }
  return rec(0, '')
}

/** Enumerating past this many combinations for one pattern isn't worth it. */
const ENUM_CAP = 20_000

/**
 * How many DISTINCT sentences these patterns can produce between them.
 *
 * Distinct by written English, so the same sentence reachable two ways counts
 * once — the arithmetic product would overcount, and this is a number the
 * learner is invited to chase to the end. As of writing the whole 22-level
 * course is 461 sentences and a learner at level 3 has 47, so enumeration is
 * cheap; the cap only guards against a future pattern with a huge slot.
 */
export function possibleSentenceCount(patterns: SentencePattern[]): number {
  const seen = new Set<string>()
  let uncounted = 0
  for (const p of patterns) {
    if (comboCount(p) > ENUM_CAP) { uncounted += comboCount(p); continue }
    for (const fills of fillCombos(p)) seen.add(enTokens(p, fills).join(' '))
  }
  return seen.size + uncounted
}

/**
 * A short, stable id for a sentence, for storing what has been seen.
 *
 * The sentence key is the English itself, which is the honest identity but too
 * long to keep hundreds of. Hashing gives a fixed 8 characters, so remembering
 * the whole 461-sentence corpus costs a few KB rather than tens.
 */
export function sentenceHash(key: string): string {
  let h = 5381
  for (let i = 0; i < key.length; i++) h = ((h * 33) ^ key.charCodeAt(i)) >>> 0
  return h.toString(36).padStart(7, '0').slice(0, 8)
}

/** Every sentence these patterns can produce, with the fills that make it. */
function candidates(patterns: SentencePattern[]): { pattern: SentencePattern; fills: Record<string, string>; key: string }[] {
  const out: { pattern: SentencePattern; fills: Record<string, string>; key: string }[] = []
  for (const p of patterns) {
    if (comboCount(p) > ENUM_CAP) continue // pathological pattern: leave it to chance
    for (const fills of fillCombos(p)) {
      out.push({ pattern: p, fills, key: enTokens(p, fills).join(' ') })
    }
  }
  return out
}

/**
 * @param seen Sentence hash → when it was last served. Given this, selection
 *   stops being random and becomes least-recently-served: the generator
 *   enumerates everything the patterns can produce and picks from whatever has
 *   waited longest, breaking ties at random so the order never becomes fixed.
 *
 *   Random selection with rejection — the previous approach — cannot do this.
 *   Over a 153-sentence pool it repeats about a third of a 20-round sitting by
 *   the birthday problem alone, and it forgets everything the moment the screen
 *   is closed. Enumerating is affordable precisely because the set is small and
 *   finite, which is the same fact the "sentences your patterns can make" meter
 *   rests on.
 *
 *   Omitted (Review's assemble questions), behaviour is unchanged: every
 *   candidate scores equally, so the pick is uniform at random.
 */
/**
 * How much of the staleness ordering to draw from.
 *
 * Taking only the single oldest is what a strict reading of
 * "least-recently-served" implies, and it has a flaw that takes a full pass
 * through the pool to become visible: once everything carries a timestamp, the
 * order is frozen. Measured over a 111-sentence pool, pass 2 reproduced pass 1
 * in 111 of 111 positions, and pass 3 reproduced pass 2 — a fixed loop, for
 * ever.
 *
 * Drawing at random from the oldest tenth breaks that while keeping almost all
 * of the coverage. Over three passes of 111 rounds: 106-108 distinct per pass
 * (against 111 for strict, and 66-74 for the uniform-random selection this
 * whole mechanism replaced), with the order freshly shuffled each time.
 */
const STALE_WINDOW = 0.10

/**
 * A pattern the learner just got wrong is worth returning to sooner — but with
 * a DIFFERENT sentence, not the one they missed.
 *
 * Missing a Builder round almost never means that sentence is hard; it means
 * the pattern is. Re-serving the same string teaches the string, which is the
 * one thing this app is not for. Re-serving a different sentence from the same
 * pattern teaches the rule.
 *
 * `streak === 0` alongside `incorrect > 0` means the last answer on this
 * pattern was wrong — a signal `applyAnswer` already records even when the
 * schedule is frozen, so this needs no new state at all.
 */
const MISS_SHARE = 1 / 3

export interface PatternStanding {
  /** Pattern ids whose most recent answer was wrong. */
  struggling: ReadonlySet<string>
}

export function makeRound(
  patterns: SentencePattern[],
  seen?: Readonly<Record<string, number>>,
  standing?: PatternStanding,
): Round {
  if (!seen) return buildRound(patterns)
  const cands = candidates(patterns)
  if (cands.length === 0) return buildRound(patterns)

  // Ties are shuffled, not left in enumeration order. On a fresh install every
  // sentence has age 0, and a stable sort would then make the window the same
  // fixed handful every time — so a new learner's first rounds would come from
  // one corner of the corpus.
  const age = (c: { key: string }): number => seen[sentenceHash(c.key)] ?? 0
  const byAge = cands
    .map(c => ({ c, a: age(c), r: Math.random() }))
    .sort((x, y) => x.a - y.a || x.r - y.r)
    .map(x => x.c)
  const window = byAge.slice(0, Math.max(1, Math.ceil(byAge.length * STALE_WINDOW)))

  // Remediation searches the WHOLE pool, not just the window. Confining it to
  // the window looked safer and did nothing useful: a two-sentence pattern
  // sitting deep in the queue is exactly the case where the wait is longest
  // (measured at ~105 rounds) and exactly the case the window cannot reach.
  //
  // It stays bounded by MISS_SHARE instead. Unbounded, a pattern the learner
  // keeps missing would take over the queue and turn practice into punishment
  // — the repetition complaint that started all of this, wearing a hat.
  //
  // Taking the STALEST of the struggling pattern's sentences is what makes
  // this teach the rule rather than the string: the sentence just missed is
  // the freshest one, so it is last in line, and what comes back is a
  // different sentence built on the same pattern.
  const struggling = standing?.struggling
  if (struggling?.size && Math.random() < MISS_SHARE) {
    const remedial = byAge.filter(c => struggling.has(c.pattern.id))
    if (remedial.length > 0) {
      const chosen = pick(remedial.slice(0, Math.max(1, Math.ceil(remedial.length * STALE_WINDOW))))
      return roundFrom(chosen.pattern, chosen.fills)
    }
  }

  const chosen = pick(window)
  return roundFrom(chosen.pattern, chosen.fills)
}

function buildRound(patterns: SentencePattern[]): Round {
  const pattern = pick(patterns)
  const fills: Record<string, string> = {}
  let prevFill = ''
  for (const slot of pattern.slots) {
    // Respect the compatibility map: a previous slot's fill can constrain us.
    const allowed = allowedFor(pattern, slot, prevFill)
    const omit = slot.optional && (allowed.length === 0 || Math.random() < 0.35)
    fills[slot.name] = omit ? '' : pick(allowed.length ? allowed : slot.itemIds)
    if (fills[slot.name]) prevFill = fills[slot.name]
  }
  return roundFrom(pattern, fills)
}

/** Everything downstream of choosing the fills — tokens, Thai, tray. */
function roundFrom(pattern: SentencePattern, fills: Record<string, string>): Round {
  const lits = literalReadings(pattern)
  const tokens: Tile[] = []
  for (const part of pattern.enTemplate.split(/\s+/)) {
    const m = part.match(/^\{(\w+)\}$/)
    if (m) {
      const id = fills[m[1]]
      if (id) {
        tokens.push({
          en: ITEMS[id]?.en ?? '',
          reading: ITEMS[id]?.reading ?? '',
          th: tileTh(ITEMS[id]?.th ?? ''),
          id,
        })
      }
    } else {
      tokens.push({ en: part, reading: lits.get(part) ?? '', th: '', id: `lit:${part}` })
    }
  }

  const filledIds = pattern.slots.map(s => fills[s.name]).filter(Boolean)
  const override =
    pattern.thOverrides?.[filledIds.join('+')] ??
    (filledIds.length === 1 ? pattern.thOverrides?.[filledIds[0]] : undefined)
  const th = override ?? pattern.thTemplate.replace(/\{(\w+)\}/g, (_, slot) => {
    const id = fills[slot]
    return id ? cleanTh(ITEMS[id]?.th ?? '') : ''
  }).replace(/\s+/g, ' ').replace(/\s+([,.?!])/g, '$1').trim()

  const distractorTiles: Tile[] = shuffle(pattern.distractors ?? [])
    .slice(0, 3)
    .map(id => ({
      en: getAnyItem(id)?.en ?? '',
      reading: getAnyItem(id)?.reading ?? '',
      th: tileTh(getAnyItem(id)?.th ?? ''),
      id,
    }))
    .filter(t => t.en && !tokens.some(tok => tok.en === t.en))

  const tray = shuffle([...tokens, ...distractorTiles]).map((t, i) => ({ ...t, key: i }))
  return { pattern, fills, tokens, th, tray }
}
