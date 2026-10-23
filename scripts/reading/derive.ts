// Derives the Thai-script reading (คำอ่าน) and GA IPA of English text from
// the CMU Pronouncing Dictionary, through the tables in arpabet.ts.
//
// CLAUDE.md §4: readings are never written from memory. English spelling does
// not encode pronunciation, so the reading is COMPUTED from CMUdict phones:
//   phones → syllabify.ts → Thai-specific merges → one Thai syllable each,
//   joined with hyphens. One reading token per English word.
//
// What is a rule and what is an exception: everything that follows from the
// phones is a rule here. A word whose Thai form is fixed by convention and
// disagrees with its sound (world เวิลด์, four โฟร์, banana บะ-นา-นะ) is in
// exceptions.ts, with a reason, and is reported as EXCEPTION so authors know
// which words the rules did not produce.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  AA_OPEN_BEFORE_R, AH0_FORMS, AH0_L, AH0_PALATAL_N, AW_NL, AW_NL_CODAS, AY_FINAL_CARRIER,
  CARRIER, CODA, CODA_K_AFTER_SONORANT, DH_NON_INITIAL, GEMINATE,
  IPA_BY_STRESS, IPA_CONSONANT, IPA_PRIMARY, IPA_SECONDARY, KARAN, MID_CLASS,
  ONSET, ONSET_AFTER_S, ONSET_S_CLUSTER, ONSET_S_K_BEFORE_GLIDE, PALATALS, S_K_GLIDES,
  STANDALONE_BEFORE, STANDALONE_LEADERS,
  TONE_FALLING_MID, TONE_FALLING_OTHER, VOWELS, type Consonant, type Vowel, type VowelForms,
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
    ...s, geminateCoda: syls[i + 1]?.geminateOnset ?? false,
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

/** Onset letters split into [standalone leader(s), the part the preposed vowel wraps]. */
function onsetLetters(s: ThaiSyl, wordInitial: boolean): [string, string] {
  const cs = s.onset
  if (cs.length === 0) return ['', CARRIER]
  const letters = cs.map((c, i) => {
    if (i === 0 && s.geminateOnset) return GEMINATE[c]![1]
    if (c === 'S' && cs.length > 1 && i === 0) return ONSET_S_CLUSTER
    if (i > 0 && cs[0] === 'S' && c === 'K' && S_K_GLIDES.has(cs[i + 1])) return ONSET_S_K_BEFORE_GLIDE
    if (i > 0 && cs[0] === 'S' && ONSET_AFTER_S[c]) return ONSET_AFTER_S[c]!
    if (c === 'DH' && !wordInitial) return DH_NON_INITIAL
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
function codaLetters(coda: Consonant[], glide: boolean, geminate: boolean): string {
  return coda.map((c, i) => {
    let letter = CODA[c]
    if (c === 'K' && i > 0 && (coda[i - 1] === 'NG' || coda[i - 1] === 'L')) letter = CODA_K_AFTER_SONORANT
    if (geminate && i === coda.length - 1) letter = GEMINATE[c]![0]
    const silent = i > 0 || (glide && coda.length === 1)
    return letter + (silent ? KARAN : '')
  }).join('')
}

/** Pick the vowel template for this syllable in its word context. */
function vowelTemplate(s: ThaiSyl, isFinal: boolean, next: ThaiSyl | undefined): { tmpl: string; glide: boolean; rColoured: boolean } {
  const forms: VowelForms = s.nucleus === 'AH' && s.stress === 0 ? AH0_FORMS : VOWELS[s.nucleus]
  const glide = forms.glide ?? false
  const nextStartsR = next?.onset[0] === 'R'

  if (s.coda.length === 0) {
    if (isFinal) {
      if (s.nucleus === 'AY' && (s.onset.length === 0 || (s.onset.length === 1 && s.onset[0] === 'HH'))) {
        return { tmpl: AY_FINAL_CARRIER, glide, rColoured: false }
      }
      return { tmpl: forms.openFinal ?? forms.open, glide, rColoured: false }
    }
    if (s.nucleus === 'AA' && nextStartsR) return { tmpl: AA_OPEN_BEFORE_R, glide, rColoured: false }
    return { tmpl: forms.open, glide, rColoured: false }
  }

  if (s.coda[0] === 'R') return { tmpl: forms.r ?? forms.closed, glide: false, rColoured: true }
  if (s.nucleus === 'AH' && s.stress === 0) {
    if (s.coda[0] === 'L') return { tmpl: AH0_L, glide, rColoured: false }
    if (s.coda[0] === 'N' && s.onset.length > 0 && PALATALS.has(s.onset[s.onset.length - 1])) {
      return { tmpl: AH0_PALATAL_N, glide, rColoured: false }
    }
  }
  if (s.nucleus === 'AW' && AW_NL_CODAS.has(s.coda[0])) return { tmpl: AW_NL, glide, rColoured: false }
  // The short mark ็ (เ-็ แ-็) only in a word-final syllable with a single coda consonant.
  const short = isFinal && s.coda.length === 1 && !s.geminateCoda
  return { tmpl: short ? forms.closed : forms.closedLong ?? forms.closed, glide, rColoured: false }
}

function renderSyllable(s: ThaiSyl, i: number, all: ThaiSyl[]): string {
  const isFinal = i === all.length - 1
  const [lead, main] = onsetLetters(s, i === 0)
  const { tmpl, glide, rColoured } = vowelTemplate(s, isFinal, all[i + 1])

  let coda: string
  if (rColoured) {
    // ร์ is written by the template; the consonants after it count afresh (hard ฮาร์ด, first เฟิร์สต์).
    coda = KARAN_R + codaLetters(s.coda.slice(1), false, false)
  } else {
    coda = codaLetters(s.coda, glide, s.geminateCoda)
  }

  let text = lead + tmpl.replace('C', main).replace('F', coda)

  // Word-final unstressed -y falls: ี้ after a mid-class letter, ี่ otherwise (happy แฮป-ปี้, very เว-รี่).
  if (isFinal && s.nucleus === 'IY' && s.stress === 0 && s.coda.length === 0) {
    text += MID_CLASS.has(main[main.length - 1]) ? TONE_FALLING_MID : TONE_FALLING_OTHER
  }
  return text
}

const KARAN_R = CODA.R + KARAN

/** Thai reading of a phone list: syllables joined with hyphens. */
export function readingOf(phones: string[]): string {
  const syls = mergeForThai(syllabify(phones))
  return syls.map((s, i) => renderSyllable(s, i, syls)).join('-')
}

// ─── Words and text ─────────────────────────────────────────────────────────

/** Characters that are never part of a word; apostrophes stay (don't, i'm, 'em are CMUdict headwords). */
const PUNCT = /[,.!?;:"()\[\]{}…“”]/g

const MULTIWORD = Object.keys(EXCEPTIONS).filter(k => k.includes(' ')).sort((a, b) => b.length - a.length)

function lookup(word: string): WordReading | null {
  const key = word.toLowerCase()
  const exc = EXCEPTIONS[key]
  const phones = phonesOf(key)
  if (exc) {
    return { word, reading: exc.reading, ipa: exc.ipa ?? (phones ? ipaOf(phones) : '?'), source: 'EXCEPTION' }
  }
  if (phones) return { word, reading: readingOf(phones), ipa: ipaOf(phones), source: 'DERIVED' }
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
