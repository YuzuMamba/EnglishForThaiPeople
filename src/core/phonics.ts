// ─── Graphemes: how an English word decomposes into taught sound-spellings ───
// The Read-English course teaches GRAPHEMES — single letters ('a', 'k'),
// letter teams ('th', 'ee') and the magic-e pattern ('a-e') — and each one is
// a card on the same SRS ladder as vocabulary. To ask whether a learner can
// sound a word out, the word has to be cut into those same units. This is the
// one place that cut is made; the store's `canReadEnglish` and the drill rows
// in the course both use it, so they can never disagree.

import { SCRIPT_CHARS } from '../data'

const VOWELS = 'aeiou'

/** Two-letter teams the course teaches, longest match first. Built once. */
const TEAMS: string[] = Object.keys(SCRIPT_CHARS)
  .filter(k => k.length === 2 && !k.includes('-'))

/** Magic-e vowels the course teaches ('a-e' → 'a'). */
const MAGIC: Set<string> = new Set(
  Object.keys(SCRIPT_CHARS).filter(k => /^[aeiou]-e$/.test(k)).map(k => k[0]),
)

/**
 * Cut one lower-case word into grapheme units.
 *
 * Orthographic, not phonetic: 'great' yields g·r·ea·t even though ea is /eɪ/
 * there. That is deliberate — the question is "has the learner met every
 * spelling in this word", and a learner who knows ea can be told it is
 * irregular in `great` by the card, not by the gate.
 *
 * Magic e: V + single consonant + final e (or + s/d, for plurals and -ed)
 * becomes the 'V-e' unit, the consonant stays its own unit, and the e is
 * consumed — cake → c·a-e·k, liked → l·i-e·k·d.
 */
export function segmentGraphemes(word: string): string[] {
  const w = word.toLowerCase()
  const out: string[] = []
  const consumed = new Set<number>()
  for (let i = 0; i < w.length; i++) {
    if (consumed.has(i)) continue
    const c = w[i]
    // magic e
    if (MAGIC.has(c) && i + 2 < w.length) {
      const mid = w[i + 1]
      const e = w[i + 2]
      const tailOk = i + 3 === w.length || (i + 3 === w.length - 1 && 'sd'.includes(w[i + 3]))
      if (e === 'e' && tailOk && !VOWELS.includes(mid) && !'rwyx'.includes(mid)) {
        out.push(`${c}-e`)
        consumed.add(i + 2)
        continue
      }
    }
    const pair = w.slice(i, i + 2)
    if (pair.length === 2 && TEAMS.includes(pair)) {
      out.push(pair)
      i++
      continue
    }
    out.push(c)
  }
  return out
}

/** Grapheme units of a whole phrase; digits and punctuation carry no sound and are skipped. */
export function graphemeUnits(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean)
    .flatMap(segmentGraphemes)
}

/** Does the course teach this unit anywhere? */
export const isTaughtGrapheme = (unit: string): boolean => unit in SCRIPT_CHARS
