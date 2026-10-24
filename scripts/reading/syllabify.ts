// ARPAbet phone list → syllables (onset / nucleus / coda, with stress).
//
// Two principles, applied in this order:
//
//   1. A STRESSED LAX vowel (IH1 EH1 AE1 AH1 UH1 AA1, or with secondary
//      stress) must be in a closed syllable — English never ends a stressed
//      syllable on one of these. So at least one of the following consonants
//      closes it. With ONE consonant that means GEMINATION: the consonant is
//      the coda of this syllable AND the onset of the next (happy → HAP-PY,
//      city → CIT-TY). With several, the first is the coda and the rest form
//      the biggest legal onset they can (problem → PROB-LEM, extra → EX-TRA).
//      Consonants that cannot be doubled in Thai — R W Y HH DH — leave the
//      vowel open instead (very → VE-RY, father → FA-THER), and NG is only
//      ever a coda (singer → SING-ER).
//
//   2. Everything else is ONSET MAXIMISATION: the next syllable takes the
//      longest legal English onset, the rest closes this one (teacher →
//      TEA-CHER, sister → SIS-TER, open → O-PEN).
//
// The output is phonological. Thai-specific merges (C + Y UW → ิว, IY + AH0 →
// เ-ีย, AY/AW + ER0 → r-coloured) happen in derive.ts, because the IPA must
// still show the real phones.

import { CONSONANTS, LAX_VOWELS, LEGAL_CLUSTERS, Y_ONSET_BEFORE, isVowelPhone, type Consonant, type Vowel } from './arpabet'

export interface Syllable {
  onset: Consonant[]
  /** The vowel without its stress digit. */
  nucleus: Vowel
  /** 0 unstressed, 1 primary, 2 secondary (CMUdict's digit). */
  stress: 0 | 1 | 2
  coda: Consonant[]
  /** True when the first onset consonant is a copy of the previous syllable's last coda consonant. */
  geminateOnset: boolean
}

/** Consonants that never geminate: the stressed lax vowel before them stays open (very, father, seven). */
export const NO_GEMINATION: ReadonlySet<Consonant> = new Set<Consonant>(['R', 'W', 'Y', 'HH', 'DH', 'V'])

/** Is this consonant sequence a legal English onset (given the vowel that follows it)? */
export function isLegalOnset(cs: Consonant[], nextVowel: Vowel): boolean {
  if (cs.length === 0) return true
  if (cs.length === 1) return cs[0] !== 'NG'
  // C + Y only before UW/UH: music, cute, few — never onion, million.
  if (cs[cs.length - 1] === 'Y') {
    if (!Y_ONSET_BEFORE.has(nextVowel)) return false
    const head = cs.slice(0, -1)
    return head.length === 1 ? head[0] !== 'NG' && head[0] !== 'Y' : LEGAL_CLUSTERS.has(head.join(' '))
  }
  return LEGAL_CLUSTERS.has(cs.join(' '))
}

/** The longest suffix of `cs` that is a legal onset; returns [coda part, onset part]. */
function maximalOnset(cs: Consonant[], nextVowel: Vowel): [Consonant[], Consonant[]] {
  for (let i = 0; i <= cs.length; i++) {
    const onset = cs.slice(i)
    if (isLegalOnset(onset, nextVowel)) return [cs.slice(0, i), onset]
  }
  return [cs, []]
}

const stressOf = (phone: string): 0 | 1 | 2 => {
  const d = Number(phone.slice(-1))
  return d === 1 ? 1 : d === 2 ? 2 : 0
}

/**
 * Split a CMUdict phone list into syllables. Throws on an unknown phone so a
 * dictionary typo is loud rather than silently misread.
 */
export function syllabify(phones: string[]): Syllable[] {
  for (const p of phones) {
    if (!isVowelPhone(p) && !CONSONANTS.has(p)) throw new Error(`unknown ARPAbet phone: ${p}`)
  }
  const vowelIdx = phones.map((p, i) => (isVowelPhone(p) ? i : -1)).filter(i => i >= 0)
  if (vowelIdx.length === 0) throw new Error(`no vowel in: ${phones.join(' ')}`)

  const syls: Syllable[] = vowelIdx.map(i => ({
    onset: [],
    nucleus: phones[i].replace(/\d$/, '') as Vowel,
    stress: stressOf(phones[i]),
    coda: [],
    geminateOnset: false,
  }))

  // Leading and trailing consonants have only one place to go.
  syls[0].onset = phones.slice(0, vowelIdx[0]) as Consonant[]
  syls[syls.length - 1].coda = phones.slice(vowelIdx[vowelIdx.length - 1] + 1) as Consonant[]

  // Consonants between two vowels.
  for (let k = 0; k + 1 < vowelIdx.length; k++) {
    const between = phones.slice(vowelIdx[k] + 1, vowelIdx[k + 1]) as Consonant[]
    const here = syls[k]
    const next = syls[k + 1]
    if (between.length === 0) continue

    const stressedLax = here.stress !== 0 && LAX_VOWELS.has(here.nucleus)
    if (stressedLax && between.length === 1) {
      const c = between[0]
      if (c === 'NG') { here.coda = [c]; continue }
      // V doubles only after AH1 (cover คัฟ-เวอร์, lover ลัฟ-เวอร์): everywhere else
      // Thai writes it single (seven เซ-เว็น, heavy เฮ-วี่, river ริ-เวอร์).
      if (NO_GEMINATION.has(c) && !(c === 'V' && here.nucleus === 'AH')) { next.onset = [c]; continue }
      here.coda = [c]
      next.onset = [c]
      next.geminateOnset = true
      continue
    }
    if (stressedLax) {
      // First consonant closes the stressed syllable; the rest is split by onset maximisation.
      const [moreCoda, onset] = maximalOnset(between.slice(1), next.nucleus)
      here.coda = [between[0], ...moreCoda]
      next.onset = onset
      continue
    }
    const [coda, onset] = maximalOnset(between, next.nucleus)
    here.coda = coda
    next.onset = onset
  }
  return syls
}
