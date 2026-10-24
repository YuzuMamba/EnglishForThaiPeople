// Derives the Thai-script reading (คำอ่าน) and GA IPA of English text from
// the CMU Pronouncing Dictionary, through the tables in arpabet.ts.
//
// CLAUDE.md §4: readings are never written from memory. English spelling does
// not encode pronunciation, so the reading is COMPUTED from CMUdict phones:
//   phones → syllabify.ts → Thai-specific merges → one Thai syllable each,
//   joined with hyphens. One reading token per English word.
//
// The phones carry the sound; a few conventions of Thai transliteration also
// look at the SPELLING (a final -e, -ow, -ayed, the ex- prefix, tch/dg, a t
// that CMUdict wrote as a flapped D). Those read `Spelling`, built once per
// word by analyseSpelling(); everything else is phones only.
//
// What is a rule and what is an exception: everything that follows from the
// phones (and these spelling cues) is a rule here. A word whose Thai form is
// fixed by convention and disagrees with its sound (world เวิลด์, four โฟร์,
// banana บะ-นา-นะ) is in exceptions.ts, with a reason, and is reported as
// EXCEPTION so authors know which words the rules did not produce.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  AA_OPEN_BEFORE_R, AH0_FORMS, AH0_L, AH0_PALATAL_N, AW_NL, AW_NL_CODAS, AY_FINAL_CARRIER,
  CARRIER, CODA, CODA_K_AFTER_SONORANT, CODA_S_FOR_X, DH_NON_INITIAL, EX_PREFIX, EY_SPELLED_Y_F, GEMINATE,
  GEMINATE_SPELLING, IPA_BY_STRESS, IPA_CONSONANT, IPA_PRIMARY, IPA_SECONDARY, KARAN, MID_CLASS,
  NO_SHORT_MARK_BEFORE, NO_SHORT_MARK_POLYSYLLABLE, ONSET, ONSET_S_CLUSTER, ONSET_S_K_BEFORE_GLIDE,
  OW_SPELLED_OW, OW_SPELLED_OW_F, PALATALS, S_K_GLIDES, SHORT_MARK_CLUSTER_STARTS, SPELLED_E_PLAIN,
  SPELLED_E_PLAIN_CODAS, SPELLED_E_SHORT, STANDALONE_BEFORE, STANDALONE_LEADERS, TONE_FALLING_MID,
  TONE_FALLING_OTHER, UNASPIRATED, VOWELS, type Consonant, type Vowel, type VowelForms,
} from './arpabet'
import { syllabify, type Syllable } from './syllabify'
import { EXCEPTIONS } from './exceptions'

export type Source = 'DERIVED' | 'EXCEPTION' | 'MISSING'

export interface WordReading {
  word: string
  reading: string
  ipa: string
  source: Source
}

export interface Derivation {
  /** Readings joined with single spaces: one token per English word. */
  reading: string
  /** Per-word IPA in slashes, joined with spaces. */
  ipa: string
  words: WordReading[]
}

// ─── CMUdict ────────────────────────────────────────────────────────────────

let cmu: Map<string, string[]> | null = null

/** First pronunciation of every headword; `word(2)` variants are ignored so output is deterministic. */
export function cmudict(): Map<string, string[]> {
  if (cmu) return cmu
  const path = join(dirname(fileURLToPath(import.meta.url)), 'cmudict.dict')
  cmu = new Map()
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    const [head, ...phones] = line.split(/\s+/)
    if (head.endsWith(')')) continue
    if (!cmu.has(head)) cmu.set(head, phones)
  }
  return cmu
}

export const phonesOf = (word: string): string[] | undefined => cmudict().get(word.toLowerCase())

// ─── Spelling cues ──────────────────────────────────────────────────────────

export interface Spelling {
  /** Lower-case a–z only. */
  letters: string
  /** The last vowel letter is an `e` followed by consonants (ticket, places, silence — not apple, not doesn't). */
  finalE: boolean
  startsEx: boolean
  ends: (suffix: string) => boolean
  has: (part: string) => boolean
}

/**
 * Spelling cues for one word. `clusterEnding` is true when the last syllable
 * closes with two or more consonants — then a final -ed / -es is a silent
 * ending stuck onto a closed stem (finished, noticed, minutes) rather than a
 * syllable of its own (wanted, hundred, places), and its e does not count.
 */
export function analyseSpelling(word: string, clusterEnding = false): Spelling {
  const letters = word.toLowerCase().replace(/[^a-z]/g, '')
  // A syllabic -le (apple, apples, settled) has no vowel letter of its own: not an e-spelled syllable.
  // (-lled is a stem's e + -ed: travelled, cancelled.)
  const syllabicLe = /[^aeiouyl]le[sd]?$/.test(letters)
  let s = letters
  if (clusterEnding && s.endsWith('ed')) s = s.slice(0, -2)
  else if (clusterEnding && s.endsWith('es')) s = s.slice(0, -1)
  // A silent final e (consonant + e, with a vowel letter before it) is not the last syllable's vowel.
  if (/[^aeiouy]e$/.test(s) && /[aeiouy]/.test(s.slice(0, -1))) s = s.slice(0, -1)
  const lastVowel = /([aeiouy])[^aeiouy]+$/.exec(s)?.[1]
  return {
    letters,
    finalE: !word.includes("'") && !syllabicLe && lastVowel === 'e',
    startsEx: letters.startsWith('ex'),
    ends: suffix => letters.endsWith(suffix),
    has: part => letters.includes(part),
  }
}

/**
 * CMUdict writes a flapped t as D in a few words (thirty TH ER1 D IY0, forty,
 * dirty). A D phone the spelling has no `d` for is a T.
 */
export function fixFlaps(phones: string[], word: string): string[] {
  const letters = word.toLowerCase().replace(/[^a-z]/g, '').replace(/dd/g, 'd')
  let excess = phones.filter(p => p === 'D').length - (letters.match(/d/g) ?? []).length
  if (excess <= 0) return phones
  const out = [...phones]
  for (let i = out.length - 1; i >= 0 && excess > 0; i--) {
    if (out[i] === 'D') { out[i] = 'T'; excess-- }
  }
  return out
}

// ─── IPA ────────────────────────────────────────────────────────────────────

function ipaVowel(v: Vowel, stress: number): string {
  const byStress = IPA_BY_STRESS[v]
  return byStress ? (stress ? byStress.stressed : byStress.unstressed) : VOWELS[v].ipa
}

/** GA IPA for a phone list, with ˈ / ˌ before stressed syllables (none on a monosyllable), in slashes. */
export function ipaOf(phones: string[]): string {
  const syls = syllabify(phones)
  const out = syls.map(s => {
    const mark = syls.length === 1 ? '' : s.stress === 1 ? IPA_PRIMARY : s.stress === 2 ? IPA_SECONDARY : ''
    const onset = (s.geminateOnset ? s.onset.slice(1) : s.onset).map(c => IPA_CONSONANT[c]).join('')
    return mark + onset + ipaVowel(s.nucleus, s.stress) + s.coda.map(c => IPA_CONSONANT[c]).join('')
  })
  return `/${out.join('')}/`
}

// ─── Thai reading ───────────────────────────────────────────────────────────

/** A syllable after the Thai-specific merges. */
interface ThaiSyl {
  onset: Consonant[]
  nucleus: Vowel | 'IW' | 'IYA'
  stress: 0 | 1 | 2
  coda: Consonant[]
  geminateOnset: boolean
  /** Its single coda consonant is doubled as the next syllable's onset. */
  geminateCoda: boolean
  /** The ex- prefix syllable, written เอ็กซ์ / เอ็ก as a unit. */
  exPrefix: boolean
}

/**
 * Sound sequences Thai writes differently from the phone-by-phone split:
 *   C + Y + UW/UH → ิว   (music มิว-ซิก, cute คิวต์)   — bare Y UW stays ยู (you)
 *   IY + AH0      → เ-ีย (idea ไอ-เดีย, serious ซิ-เรียส)
 *   AY/AW + ER0   → the ER0 is r-colouring (fire ไฟร์, hour อาวร์, tired ไทร์ด)
 *   EY/OY + ER0   → a ย glide opens the ER0 (player เพล-เยอร์, employer เอ็ม-พลอย-เยอร์)
 *   ER + vowel    → the r is the next syllable's onset: unstressed ER0 is then
 *                   plain schwa (around อะ-ราวนด์, direct ดะ-เร็กต์), stressed
 *                   ER keeps เ-อร์ (hurry เฮอร์-รี่, current เคอร์-รันต์)
 */
function mergeForThai(syls: Syllable[]): ThaiSyl[] {
  const out: ThaiSyl[] = syls.map((s, i) => ({
    ...s, geminateCoda: syls[i + 1]?.geminateOnset ?? false, exPrefix: false,
  }))
  for (const s of out) {
    if (s.onset.length >= 2 && s.onset[s.onset.length - 1] === 'Y' && (s.nucleus === 'UW' || s.nucleus === 'UH')) {
      s.onset = s.onset.slice(0, -1)
      s.nucleus = 'IW'
    }
  }
  for (let i = 0; i + 1 < out.length; i++) {
    const a = out[i], b = out[i + 1]
    if (a.coda.length || b.onset.length) continue
    if (a.nucleus === 'IY' && b.nucleus === 'AH' && b.stress === 0) {
      a.nucleus = 'IYA'; a.coda = b.coda; a.geminateCoda = b.geminateCoda; out.splice(i + 1, 1); i--
    } else if ((a.nucleus === 'AY' || a.nucleus === 'AW') && b.nucleus === 'ER' && b.stress === 0) {
      a.coda = ['R', ...b.coda]; a.geminateCoda = b.geminateCoda; out.splice(i + 1, 1); i--
    } else if ((a.nucleus === 'EY' || a.nucleus === 'OY') && b.nucleus === 'ER' && b.stress === 0) {
      b.onset = ['Y']
    } else if (a.nucleus === 'ER') {
      b.onset = ['R']
      if (a.stress === 0) a.nucleus = 'AH'
    }
  }
  return out
}

/**
 * The ex- prefix (spelling starts with ex, no onset, EH/IH): K S both close
 * the first syllable as เอ็กซ์ when a consonant follows (explain เอ็กซ์-เพลน,
 * excuse เอ็กซ์-คิวส์); before a vowel, or for G Z, the first syllable is
 * เอ็ก and the S/Z opens the next (exercise เอ็ก-เซอร์-ไซส์, exit เอ็ก-ซิต).
 */
function applyExPrefix(syls: ThaiSyl[], sp: Spelling): void {
  if (!sp.startsEx) return
  const a = syls[0], b = syls[1] as ThaiSyl | undefined
  if (a.onset.length || (a.nucleus !== 'EH' && a.nucleus !== 'IH')) return
  const between = [...a.coda, ...(b?.onset ?? [])]
  if (between[0] === 'K' && between[1] === 'S') {
    const rest = between.slice(2)
    if (b && rest.length === 0) { a.coda = ['K']; b.onset = ['S'] }
    else { a.coda = ['K', 'S']; if (b) b.onset = rest }
  } else if (between[0] === 'G' && between[1] === 'Z' && b) {
    a.coda = ['G']; b.onset = between.slice(1)
  } else return
  a.exPrefix = true
  a.geminateCoda = false
  if (b) b.geminateOnset = false
}

/**
 * The letter x is one unit to a Thai eye: when its K S sits before another
 * consonant, both close the syllable (sixty ซิกซ์-ตี้, sixteen ซิกซ์-ทีน,
 * mixture มิกซ์-เชอร์). Before a vowel the S opens the next syllable as usual
 * (taxi แท็ก-ซี่, boxing บ็อก-ซิง).
 */
function applyX(syls: ThaiSyl[], sp: Spelling): void {
  if (!sp.has('x')) return
  for (let i = 0; i + 1 < syls.length; i++) {
    const a = syls[i], b = syls[i + 1]
    if (a.coda[a.coda.length - 1] === 'K' && b.onset[0] === 'S' && b.onset.length > 1) {
      a.coda = [...a.coda, 'S']
      b.onset = b.onset.slice(1)
      a.geminateCoda = false
      b.geminateOnset = false
    }
  }
}

/** Onset letters split into [standalone leader(s), the part the preposed vowel wraps]. */
function onsetLetters(s: ThaiSyl, i: number, all: ThaiSyl[]): [string, string] {
  const cs = s.onset
  if (cs.length === 0) return ['', CARRIER]
  const prev = all[i - 1] as ThaiSyl | undefined
  // The เอ็กซ์ prefix does not count as a closer: explain เอ็กซ์-เพลน, excuse เอ็กซ์-คิวส์.
  const afterClosed = prev !== undefined && !prev.exPrefix && (prev.coda.length > 0 || prev.nucleus === 'ER')
  const afterS = afterClosed && prev!.coda[prev!.coda.length - 1] === 'S'
  // A final -y that CMUdict marks IY2 (thirty) is as unstressed as IY0.
  const isFinal = i === all.length - 1
  const unstressed = s.stress === 0 || (s.stress === 2 && isFinal && s.nucleus === 'IY' && s.coda.length === 0)
  const letters = cs.map((c, k) => {
    if (k === 0 && s.geminateOnset) return GEMINATE[c]![1]
    if (c === 'S' && cs.length > 1 && k === 0) return ONSET_S_CLUSTER
    if (k > 0 && cs[0] === 'S' && c === 'K' && (S_K_GLIDES.has(cs[k + 1]) || (k === cs.length - 1 && s.nucleus === 'IW'))) return ONSET_S_K_BEFORE_GLIDE
    if (k > 0 && cs[0] === 'S' && UNASPIRATED[c]) return UNASPIRATED[c]!
    // Unaspirated opening an unstressed syllable after a closed one (single stop), or after an S coda
    // (any cluster): sister ซิส-เตอร์, party พาร์-ตี้, district ดิส-ตริกต์; stressed stays: sixteen ซิกซ์-ทีน.
    if (k === 0 && UNASPIRATED[c] && unstressed && (afterS || (afterClosed && cs.length === 1))) return UNASPIRATED[c]!
    if (c === 'DH' && i > 0) return DH_NON_INITIAL
    return ONSET[c]
  })
  let lead = 0
  if (cs.length > 1 && STANDALONE_LEADERS.has(cs[0])) {
    if (cs[0] === 'S') lead = 1
    else if (STANDALONE_BEFORE.has(cs[1])) lead = 1
  }
  return [letters.slice(0, lead).join(''), letters.slice(lead).join('')]
}

/**
 * Coda letters. The first consonant is plain, every later one carries ์;
 * a vowel written with a glide (ไ- เ-า -าว -อย -ิว) silences even a single
 * coda. R never comes through here (the vowel R-forms write it).
 */
function codaLetters(coda: Consonant[], glide: boolean, geminate: boolean, sp: Spelling): string {
  return coda.map((c, i) => {
    let letter = CODA[c]
    if (c === 'K' && i > 0 && (coda[i - 1] === 'NG' || coda[i - 1] === 'L')) letter = CODA_K_AFTER_SONORANT
    if (c === 'S' && i > 0 && coda[i - 1] === 'K' && sp.has('x')) letter = CODA_S_FOR_X
    if (geminate && i === coda.length - 1) {
      const spelled = GEMINATE_SPELLING[c]
      letter = spelled && sp.has(spelled[0]) ? spelled[1] : GEMINATE[c]![0]
    }
    const silent = i > 0 || (glide && coda.length === 1)
    return letter + (silent ? KARAN : '')
  }).join('')
}

interface Pick { tmpl: string; glide: boolean; rColoured: boolean }
const pick = (tmpl: string, glide = false, rColoured = false): Pick => ({ tmpl, glide, rColoured })

/** Pick the vowel template for this syllable in its word context. */
function vowelTemplate(s: ThaiSyl, i: number, all: ThaiSyl[], sp: Spelling): Pick {
  const isFinal = i === all.length - 1
  const next = all[i + 1] as ThaiSyl | undefined
  const forms: VowelForms = s.nucleus === 'AH' && s.stress === 0 ? AH0_FORMS : VOWELS[s.nucleus]
  const glide = forms.glide ?? false
  const single = s.coda.length === 1

  if (s.coda.length === 0) {
    // AY/EY keep their word-final shape before the -ing syllable: trying ทราย-อิง, playing เพลย์-อิง
    // (but not before AH0: quiet ไคว-เอ็ต, science ไซ-เอ็นส์).
    const beforeIng = next !== undefined && next.onset.length === 0 && next.nucleus === 'IH' && next.stress === 0
    if (isFinal || (beforeIng && (s.nucleus === 'AY' || s.nucleus === 'EY'))) {
      if (s.nucleus === 'AY' && (s.onset.length === 0 || (s.onset.length === 1 && s.onset[0] === 'HH'))) return pick(AY_FINAL_CARRIER, glide)
      if (s.nucleus === 'OW' && isFinal && sp.ends('ow')) return pick(OW_SPELLED_OW)
      return pick(forms.openFinal ?? forms.open, glide)
    }
    if (s.nucleus === 'AA' && next?.onset[0] === 'R') return pick(AA_OPEN_BEFORE_R, glide)
    return pick(forms.open, glide)
  }

  if (s.coda[0] === 'R') return pick(forms.r ?? forms.closed, false, true)

  // A reduced last syllable whose spelling has e: ticket ทิก-เก็ต, places เพล-เซส, level เล-เวล.
  if (isFinal && sp.finalE && s.stress === 0 && (s.nucleus === 'AH' || s.nucleus === 'IH' || s.nucleus === 'EH')) {
    return pick(SPELLED_E_PLAIN_CODAS.has(s.coda[0]) ? SPELLED_E_PLAIN : SPELLED_E_SHORT, glide)
  }
  if (s.nucleus === 'AH' && s.stress === 0) {
    if (s.coda[0] === 'L') return pick(AH0_L, glide)
    // -tion / -sion (and their plurals): ชั่น, ชั่นส์.
    const nOrNz = s.coda[0] === 'N' && (single || (s.coda.length === 2 && s.coda[1] === 'Z'))
    if (nOrNz && s.onset.length > 0 && PALATALS.has(s.onset[s.onset.length - 1])) return pick(AH0_PALATAL_N, glide)
  }
  if (s.nucleus === 'AW' && AW_NL_CODAS.has(s.coda[0])) return pick(AW_NL, glide)
  if (isFinal && single) {
    // Spelling-kept glides before an -s / -ed: days เดย์ส์, played เพลย์ด, knows โนว์ส์, showed โชว์ด.
    if (s.nucleus === 'EY' && s.coda[0] === 'Z' && (sp.ends('ays') || sp.ends('eys'))) return pick(EY_SPELLED_Y_F, true)
    if (s.nucleus === 'EY' && s.coda[0] === 'D' && (sp.ends('ayed') || sp.ends('eyed'))) return pick(EY_SPELLED_Y_F)
    if (s.nucleus === 'OW' && s.coda[0] === 'Z' && sp.ends('ows')) return pick(OW_SPELLED_OW_F, true)
    if (s.nucleus === 'OW' && s.coda[0] === 'D' && sp.ends('owed')) return pick(OW_SPELLED_OW_F)
  }
  // The short mark ็ (เ-็ แ-็): a word-final syllable with a single coda consonant or a stop-initial
  // cluster (bed เบ็ด, exact แซ็กต์; but friend เฟรนด์), not before L, and not before S/Z in a
  // polysyllable (yes เย็ส, but express เอ็กซ์-เพรส).
  const short = isFinal && !s.geminateCoda && (single || SHORT_MARK_CLUSTER_STARTS.has(s.coda[0]))
    && !NO_SHORT_MARK_BEFORE.has(s.coda[0]) && !(all.length > 1 && NO_SHORT_MARK_POLYSYLLABLE.has(s.coda[0]))
  return pick(short ? forms.closed : forms.closedLong ?? forms.closed, glide)
}

const KARAN_R = CODA.R + KARAN

function renderSyllable(s: ThaiSyl, i: number, all: ThaiSyl[], sp: Spelling): string {
  if (s.exPrefix) return s.coda.includes('S') ? EX_PREFIX.ks : EX_PREFIX.k
  const isFinal = i === all.length - 1
  const [lead, main] = onsetLetters(s, i, all)
  const { tmpl, glide, rColoured } = vowelTemplate(s, i, all, sp)

  // ร์ is written by the R-form template; the consonants after it count afresh (hard ฮาร์ด, first เฟิร์สต์).
  const coda = rColoured
    ? KARAN_R + codaLetters(s.coda.slice(1), false, false, sp)
    : codaLetters(s.coda, glide, s.geminateCoda, sp)

  let text = lead + tmpl.replace('C', main).replace('F', coda)

  // Word-final unstressed -y falls: ี้ after a mid-class letter, ี่ otherwise (happy แฮป-ปี้, very เว-รี่).
  // CMUdict marks some of these IY2 (nobody, company, probably); secondary stress is unstressed to a Thai ear.
  if (isFinal && s.nucleus === 'IY' && s.stress !== 1 && s.coda.length === 0) {
    text += MID_CLASS.has(main[main.length - 1]) ? TONE_FALLING_MID : TONE_FALLING_OTHER
  }
  return text
}

/** Thai reading of a phone list: syllables joined with hyphens. `spelling` enables the spelling-sensitive forms. */
export function readingOf(phones: string[], spelling = ''): string {
  const syls = mergeForThai(syllabify(phones))
  const sp = analyseSpelling(spelling, syls[syls.length - 1].coda.length >= 2)
  applyExPrefix(syls, sp)
  applyX(syls, sp)
  return syls.map((s, i) => renderSyllable(s, i, syls, sp)).join('-')
}

// ─── Words and text ─────────────────────────────────────────────────────────

/** Characters that are never part of a word; apostrophes stay (don't, i'm, 'em are CMUdict headwords). */
const PUNCT = /[,.!?;:"()\[\]{}…“”]/g

const MULTIWORD = Object.keys(EXCEPTIONS).filter(k => k.includes(' ')).sort((a, b) => b.length - a.length)

function lookup(word: string): WordReading | null {
  const key = word.toLowerCase()
  const exc = EXCEPTIONS[key]
  const raw = phonesOf(key)
  const phones = raw && fixFlaps(raw, key)
  if (exc) {
    return { word, reading: exc.reading, ipa: exc.ipa ?? (phones ? ipaOf(phones) : '?'), source: 'EXCEPTION' }
  }
  // A CMUdict entry with no vowel (hm, shh) has no syllable to write: treat it as MISSING.
  if (phones && phones.some(p => /\d$/.test(p))) {
    return { word, reading: readingOf(phones, key), ipa: ipaOf(phones), source: 'DERIVED' }
  }
  return null
}

function readWord(word: string): WordReading {
  const direct = lookup(word) ?? lookup(word.replace(/^'+|'+$/g, ''))
  if (direct) return { ...direct, word }
  // A hyphenated word is still one English word: parts joined with hyphens.
  if (word.includes('-')) {
    const parts = word.split('-').filter(Boolean).map(p => lookup(p))
    if (parts.length && parts.every(p => p !== null)) {
      const ps = parts as WordReading[]
      return {
        word,
        reading: ps.map(p => p.reading).join('-'),
        ipa: `/${ps.map(p => p.ipa.replace(/^\/|\/$/g, '')).join('.')}/`,
        source: ps.some(p => p.source === 'EXCEPTION') ? 'EXCEPTION' : 'DERIVED',
      }
    }
  }
  return { word, reading: '?', ipa: '?', source: 'MISSING' }
}

/**
 * Derive the reading and IPA of English text. Case-insensitive; sentence
 * punctuation is dropped; apostrophes inside words are kept. Multi-word
 * exceptions (pad thai) are matched before single words.
 */
export function derive(text: string): Derivation {
  const tokens = text.replace(/’/g, "'").replace(PUNCT, ' ').split(/\s+/).filter(Boolean)
  const words: WordReading[] = []
  for (let i = 0; i < tokens.length; ) {
    const phrase = MULTIWORD.find(k => {
      const n = k.split(' ').length
      return tokens.slice(i, i + n).join(' ').toLowerCase() === k
    })
    if (phrase) {
      const n = phrase.split(' ').length
      const original = tokens.slice(i, i + n).join(' ')
      words.push({ ...lookup(phrase)!, word: original })
      i += n
    } else {
      words.push(readWord(tokens[i]))
      i++
    }
  }
  return {
    reading: words.map(w => w.reading).join(' '),
    ipa: words.map(w => w.ipa).join(' '),
    words,
  }
}
