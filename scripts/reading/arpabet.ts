// ARPAbet → Thai-script reading tables. DATA ONLY — the rules that pick a
// form live in derive.ts, the syllable split in syllabify.ts.
//
// Every English item in the corpus carries a `reading` (คำอ่าน): a Thai-script
// pronunciation guide derived from the CMU Pronouncing Dictionary. These
// tables are the transcription convention. They describe SOUND, not Thai
// loanword spelling: บะ-นา-นะ is how /bəˈnænə/ reads, even though a Thai shop
// sign says บานาน่า. Where Thai readers really would be thrown by the rule
// output, the word goes in exceptions.ts with a reason — the tables stay pure.
//
// CMUdict phones: vowels carry a stress digit (0 unstressed, 1 primary,
// 2 secondary); consonants do not.

export type Consonant =
  | 'P' | 'B' | 'T' | 'D' | 'K' | 'G' | 'F' | 'V' | 'TH' | 'DH' | 'S' | 'Z'
  | 'SH' | 'ZH' | 'CH' | 'JH' | 'HH' | 'M' | 'N' | 'NG' | 'L' | 'R' | 'W' | 'Y'

export type Vowel =
  | 'IY' | 'IH' | 'EY' | 'EH' | 'AE' | 'AA' | 'AO' | 'AH' | 'ER' | 'UH' | 'UW'
  | 'OW' | 'AY' | 'AW' | 'OY'

// ─── Consonants ─────────────────────────────────────────────────────────────

/** Onset (syllable-initial) letter. S alone is ซ (sit ซิต); in a cluster see ONSET_S_CLUSTER. */
export const ONSET: Record<Consonant, string> = {
  P: 'พ', B: 'บ', T: 'ท', D: 'ด', K: 'ค', G: 'ก', F: 'ฟ', V: 'ว',
  TH: 'ธ', DH: 'ด', S: 'ซ', Z: 'ซ', SH: 'ช', ZH: 'ช', CH: 'ช', JH: 'จ',
  HH: 'ฮ', M: 'ม', N: 'น', NG: 'ง', L: 'ล', R: 'ร', W: 'ว', Y: 'ย',
}

/**
 * DH is ด only at the start of a word (this ดิส, that แด็ต, the เดอะ).
 * Anywhere else Thai writes ธ: father ฟา-เธอร์, mother มา-เธอร์, with วิธ.
 */
export const DH_NON_INITIAL = 'ธ'

/**
 * Inside an onset cluster the leading S is ส and the stop after it is the
 * unaspirated letter: stop สตอป, spa สปา, sky สกาย, street สตรีต, small สมอล.
 * (school สคูล is the one fixed Thai spelling that breaks this — exceptions.ts.)
 *
 * The same unaspirated letters open an UNSTRESSED syllable right after a
 * closed one (a coda, or the ร์ of ER), and any syllable after an S coda:
 * sister ซิส-เตอร์, doctor ดอก-เตอร์, party พาร์-ตี้, thirty เธอร์-ตี้,
 * example เอ็ก-แซม-เปิล, monkey มัง-กี้, Boston บอส-ตัน. A stressed syllable
 * keeps พ ท ค (fifteen ฟิฟ-ทีน, contain คัน-เทน), as does one after an open
 * syllable (water วอ-เทอร์, people พี-เพิล).
 */
export const ONSET_S_CLUSTER = 'ส'
export const UNASPIRATED: Partial<Record<Consonant, string>> = { P: 'ป', T: 'ต', K: 'ก' }
export const ONSET_AFTER_S = UNASPIRATED
/** …except K before a glide, which Thai writes ค: square สแควร์, screen สครีน, script สคริปต์. */
export const ONSET_S_K_BEFORE_GLIDE = 'ค'
export const S_K_GLIDES: ReadonlySet<Consonant> = new Set<Consonant>(['R', 'W'])

/**
 * Coda (syllable-final) letter. R is always ร์ and is handled by the vowel
 * R-forms in derive.ts, so it never goes through this table.
 */
export const CODA: Record<Consonant, string> = {
  P: 'ป', B: 'บ', T: 'ต', D: 'ด', K: 'ก', G: 'ก', F: 'ฟ', V: 'ฟ',
  TH: 'ธ', DH: 'ธ', S: 'ส', Z: 'ส', SH: 'ช', ZH: 'ช', CH: 'ช', JH: 'จ',
  HH: 'ฮ', M: 'ม', N: 'น', NG: 'ง', L: 'ล', R: 'ร', W: 'ว', Y: 'ย',
}

/** K after a sonorant coda is ค (think ธิงค์, thank แธงค์, milk มิลค์); after S it stays ก (desk เดสก์). */
export const CODA_K_AFTER_SONORANT = 'ค'

/** The silencer การันต์: every coda consonant after the first carries it (test เทสต์, friends เฟรนด์ส์). */
export const KARAN = '์'

/**
 * Gemination: a stressed lax vowel + ONE consonant + another vowel doubles
 * the consonant — it closes syllable 1 AND opens syllable 2 (happy แฮป-ปี้,
 * city ซิต-ตี้, lesson เลส-ซัน). The pair is [coda letter, onset letter]:
 * usually the coda letter twice (Thai hears intervocalic p t k as ป ต ก), but
 * S/Z show their onset letter the second time (lesson เลส-ซัน, busy บิซ-ซี่).
 * Consonants absent here never geminate: R W Y HH DH V leave the vowel open
 * (very เว-รี่, father ฟา-เธอร์, seven เซ-เว็น, heavy เฮ-วี่) and NG is
 * always a plain coda (singer ซิง-เออร์).
 */
export const GEMINATE: Partial<Record<Consonant, [string, string]>> = {
  P: ['ป', 'ป'], B: ['บ', 'บ'], T: ['ต', 'ต'], D: ['ด', 'ด'], K: ['ก', 'ก'], G: ['ก', 'ก'],
  F: ['ฟ', 'ฟ'], V: ['ฟ', 'ว'], TH: ['ธ', 'ธ'], S: ['ส', 'ซ'], Z: ['ซ', 'ซ'],
  SH: ['ช', 'ช'], ZH: ['ช', 'ช'], CH: ['ช', 'ช'], JH: ['จ', 'จ'],
  M: ['ม', 'ม'], N: ['น', 'น'], L: ['ล', 'ล'],
}
/** A doubled affricate closes with the stop its spelling shows: kitchen คิท-เช็น (tch), budget บัด-เจ็ต (dg). */
export const GEMINATE_SPELLING: Partial<Record<Consonant, [spelled: string, coda: string]>> = {
  CH: ['tch', 'ท'], JH: ['dg', 'ด'],
}

/**
 * Vowels that can geminate the next consonant: the stressed LAX vowels. AA is
 * included because its closed form -อ- is short (coffee คอฟ-ฟี่, bottle
 * บอต-เติล); AO is not (water วอ-เทอร์). Secondary stress counts (afternoon
 * แอฟ-เทอร์-นูน).
 */
export const LAX_VOWELS: ReadonlySet<Vowel> = new Set<Vowel>(['IH', 'EH', 'AE', 'AH', 'UH', 'AA'])

/** Letters of the Thai MID class — a falling tone on these is written ้, on every other letter ่. */
export const MID_CLASS = new Set(['ก', 'จ', 'ด', 'ต', 'บ', 'ป', 'อ'])
export const TONE_FALLING_MID = '้'
export const TONE_FALLING_OTHER = '่'

/** Carrier for a syllable with no onset consonant: apple แอป-เปิล, I ไอ, eat อีต. */
export const CARRIER = 'อ'

// ─── Legal English onsets (for onset-maximisation in syllabify.ts) ──────────

/** Two- and three-consonant onsets English allows word-internally. Singles are all legal except NG. */
export const LEGAL_CLUSTERS: ReadonlySet<string> = new Set([
  'P L', 'P R', 'B L', 'B R', 'T R', 'D R', 'K L', 'K R', 'K W', 'G L', 'G R', 'G W',
  'F L', 'F R', 'TH R', 'SH R', 'T W', 'D W', 'TH W',
  'S P', 'S T', 'S K', 'S M', 'S N', 'S L', 'S W', 'S F',
  'S P L', 'S P R', 'S T R', 'S K R', 'S K W', 'S K L',
])
/** C + Y is an onset only before UW/UH (music, cute, few); elsewhere Y starts its own syllable (onion อัน-ยัน). */
export const Y_ONSET_BEFORE: ReadonlySet<string> = new Set(['UW', 'UH'])

/**
 * Where the preposed vowel (เ แ โ ไ) goes in a cluster. Thai-shaped clusters
 * (C + ร/ล, and คว/กว) take it in front of the whole cluster: great เกรต,
 * play เพลย์, question เควส. Clusters Thai cannot write as one unit leave the
 * first letter standing alone and the vowel wraps the rest: station สเต-ชั่น,
 * twenty ทเวน-ตี้, square สแควร์. These are the standalone leaders.
 */
export const STANDALONE_LEADERS: ReadonlySet<Consonant> = new Set<Consonant>(['S', 'T', 'D', 'TH'])
export const STANDALONE_BEFORE: ReadonlySet<Consonant> = new Set<Consonant>(['W'])

// ─── Vowels ─────────────────────────────────────────────────────────────────
//
// Templates: C = the onset letters, F = the coda letters. derive.ts picks the
// form; the choice rules are in its comments and in README.md.
//
//   open        no coda, not word-final (or word-final where openFinal is absent)
//   openFinal   no coda, last syllable of the word
//   closed      with a coda
//   closedLong  with a coda but the short mark ็ dropped: a coda cluster,
//               a geminated consonant, or a non-final syllable (friend เฟรนด์,
//               happy แฮป-ปี้, question เควส-ชั่น)
//   r           the coda begins with R; the ร์ is written in the template
//   glide       the vowel ends in a written ย/ว, so a SINGLE coda consonant
//               also takes ์ (like ไลก์, down ดาวน์, coin คอยน์)

export interface VowelForms {
  open: string
  openFinal?: string
  closed: string
  closedLong?: string
  r?: string
  glide?: boolean
  /** IPA (General American). ER and AH differ by stress — see IPA_BY_STRESS. */
  ipa: string
}

export const VOWELS: Record<Vowel | 'IW' | 'IYA', VowelForms> = {
  IY: { open: 'Cี', closed: 'CีF', r: 'เCียF', ipa: 'i' },                       // see ซี, seat ซีต, we're เวียร์
  IH: { open: 'Cิ', closed: 'CิF', r: 'เCียF', ipa: 'ɪ' },                       // sit ซิต, here เฮียร์
  EY: { open: 'เC', openFinal: 'เCย์', closed: 'เCF', ipa: 'eɪ' },               // play เพลย์, late เลต, vacation เว-เค-ชั่น
  EH: { open: 'เC', openFinal: 'เCะ', closed: 'เC็F', closedLong: 'เCF', r: 'แCF', ipa: 'ɛ' }, // bed เบ็ด, very เว-รี่, where แวร์
  AE: { open: 'แC', openFinal: 'แCะ', closed: 'แC็F', closedLong: 'แCF', r: 'แCF', ipa: 'æ' }, // cat แค็ต, carry แค-รี่
  AA: { open: 'Cา', closed: 'CอF', r: 'CาF', ipa: 'ɑ' },                          // spa สปา, hot ฮอต, car คาร์ (open before R: Cอ, sorry ซอ-รี่)
  AO: { open: 'Cอ', closed: 'CอF', r: 'CอF', ipa: 'ɔ' },                          // law ลอ, talk ทอก, more มอร์
  AH: { open: 'Cา', openFinal: 'Cะ', closed: 'CัF', ipa: 'ʌ' },                   // AH1: cup คัป, mother มา-เธอร์; AH0 uses AH0 below
  ER: { open: 'เCอร์', closed: 'เCิร์F', ipa: 'ɜr' },                             // her เฮอร์, work เวิร์ก, first เฟิร์สต์
  UH: { open: 'Cุ', closed: 'CุF', r: 'CัวF', ipa: 'ʊ' },                        // book บุก, sure ชัวร์
  UW: { open: 'Cู', closed: 'CูF', r: 'CัวF', ipa: 'u' },                        // two ทู, food ฟูด, poor พัวร์
  OW: { open: 'โC', closed: 'โCF', r: 'โCF', ipa: 'oʊ' },                         // go โก, home โฮม, four โฟร์ (exception: CMUdict has AO)
  AY: { open: 'ไC', openFinal: 'Cาย', closed: 'ไCF', r: 'ไCF', glide: true, ipa: 'aɪ' }, // my มาย, tiger ไท-เกอร์, like ไลก์, fire ไฟร์ (ไ- after empty/HH onset: I ไอ, high ไฮ)
  AW: { open: 'Cาว', closed: 'เCาF', r: 'CาวF', glide: true, ipa: 'aʊ' },          // now นาว, house เฮาส์, hour อาวร์ (+N/L: down ดาวน์ — AW_NL below)
  OY: { open: 'Cอย', closed: 'CอยF', r: 'CอยF', glide: true, ipa: 'ɔɪ' },         // boy บอย, coin คอยน์
  // Pseudo-vowels that derive.ts builds from phone pairs:
  IW:  { open: 'Cิว', closed: 'CิวF', r: 'CิวF', glide: true, ipa: 'ju' },        // C + Y UW: music มิว-ซิก, cute คิวต์, computer คอม-พิว-เทอร์
  IYA: { open: 'เCีย', closed: 'เCียF', ipa: 'iə' },                             // IY + AH0: idea ไอ-เดีย, serious ซิ-เรียส
}

/** Unstressed AH0 (schwa): about อะ-เบาต์, lesson เลส-ซัน. Its L and palatal-N forms are AH0_L / AH0_PALATAL_N. */
export const AH0_FORMS: VowelForms = { open: 'Cะ', closed: 'CัF', ipa: 'ə' }
/** AH0 + L coda — the syllabic l: apple แอป-เปิล, little ลิต-เติล, people พี-เพิล. */
export const AH0_L = 'เCิF'
/** SH/ZH/CH/JH + AH0 + N — the -tion/-sion ending: station สเต-ชั่น, vision วิ-ชั่น. */
export const AH0_PALATAL_N = 'Cั่F'
export const PALATALS: ReadonlySet<Consonant> = new Set<Consonant>(['SH', 'ZH', 'CH', 'JH'])
// ─── Spelling-sensitive forms (derive.ts reads the word's letters for these) ──

/**
 * A reduced LAST syllable (AH0/IH0/EH0, or secondary stress) with a coda, when
 * the word's last vowel letter is `e` (a silent final e does not count):
 * -et -ed -en -em -ent -ence → เ-็- (ticket ทิก-เก็ต, student สตู-เด็นต์,
 * problem พรอบ-เล็ม); before S Z SH CH JH L → เ- with no ็ (buses บัส-เซส,
 * college คอล-เลจ, level เล-เวล). Other spellings keep ั/ิ (lesson เลส-ซัน,
 * woman วุม-มัน). Contractions are skipped (doesn't ดัซ-ซันต์).
 */
export const SPELLED_E_SHORT = 'เC็F'
export const SPELLED_E_PLAIN = 'เCF'
export const SPELLED_E_PLAIN_CODAS: ReadonlySet<Consonant> = new Set<Consonant>(['S', 'Z', 'SH', 'CH', 'JH', 'L'])

/** EY written ay/ey keeps its ย์ before an -s or -ed: days เดย์ส์, always ออล-เวย์ส์, played เพลย์ด (raise เรส, paid เพด do not). */
export const EY_SPELLED_Y_F = 'เCย์F'
/** Word-final OW written ow: know โนว์, show โชว์, window วิน-โดว์, and knows โนว์ส์, showed โชว์ด (go โก, no โน keep โ-). */
export const OW_SPELLED_OW = 'โCว์'
export const OW_SPELLED_OW_F = 'โCว์F'

/** The ex- prefix: IH0/EH + K S → เอ็กซ์- before a consonant (explain เอ็กซ์-เพลน), เอ็ก- before a vowel or for G Z (exit เอ็ก-ซิต, exercise เอ็ก-เซอร์-ไซส์). */
export const EX_PREFIX = { ks: 'เอ็กซ์', k: 'เอ็ก' }

/** The short mark ็ is never written before an L coda (bell เบล, hotel โฮ-เทล, pal แพล)… */
export const NO_SHORT_MARK_BEFORE: ReadonlySet<Consonant> = new Set<Consonant>(['L'])
/** …nor before S/Z in a polysyllable (express เอ็กซ์-เพรส, princess พริน-เซส); a monosyllable keeps it (yes เย็ส). */
export const NO_SHORT_MARK_POLYSYLLABLE: ReadonlySet<Consonant> = new Set<Consonant>(['S', 'Z'])
/**
 * Before a coda CLUSTER the short mark is kept only when the cluster starts
 * with a stop (exact แซ็กต์, act แอ็กต์, box บ็อกซ์, kept เค็ปต์, cats แค็ตส์);
 * a sonorant or fricative drops it (friend เฟรนด์, can't แคนต์, test เทสต์, help เฮลป์).
 */
export const SHORT_MARK_CLUSTER_STARTS: ReadonlySet<Consonant> = new Set<Consonant>(['P', 'B', 'T', 'D', 'K', 'G'])
/** The letter x is written กซ์, not กส์: box บอกซ์, six ซิกซ์, next เน็กซ์ต์, sixty ซิกซ์-ตี้ (books บุกส์ keeps ส). */
export const CODA_S_FOR_X = 'ซ'
/** AW before an N or L coda keeps the าว shape: down ดาวน์, town ทาวน์, owl อาวล์. */
export const AW_NL = 'CาวF'
export const AW_NL_CODAS: ReadonlySet<Consonant> = new Set<Consonant>(['N', 'L'])
/** AY word-final with no onset consonant, or HH: ไ- (I ไอ, high ไฮ, hi ไฮ). */
export const AY_FINAL_CARRIER = 'ไC'
/** AA in an open syllable followed by an R onset is the short -อ (sorry ซอ-รี่, tomorrow ทะ-มอ-โร). */
export const AA_OPEN_BEFORE_R = 'Cอ'

// ─── IPA ────────────────────────────────────────────────────────────────────

export const IPA_CONSONANT: Record<Consonant, string> = {
  P: 'p', B: 'b', T: 't', D: 'd', K: 'k', G: 'g', F: 'f', V: 'v', TH: 'θ', DH: 'ð',
  S: 's', Z: 'z', SH: 'ʃ', ZH: 'ʒ', CH: 'tʃ', JH: 'dʒ', HH: 'h', M: 'm', N: 'n',
  NG: 'ŋ', L: 'l', R: 'r', W: 'w', Y: 'j',
}

/** Stress-dependent vowel symbols; everything else uses VOWELS[v].ipa. */
export const IPA_BY_STRESS: Partial<Record<Vowel, { stressed: string; unstressed: string }>> = {
  AH: { stressed: 'ʌ', unstressed: 'ə' },
  ER: { stressed: 'ɜr', unstressed: 'ər' },
}

export const IPA_PRIMARY = 'ˈ'
export const IPA_SECONDARY = 'ˌ'

export const CONSONANTS: ReadonlySet<string> = new Set(Object.keys(ONSET))
export const VOWEL_SET: ReadonlySet<string> = new Set<string>(
  ['IY', 'IH', 'EY', 'EH', 'AE', 'AA', 'AO', 'AH', 'ER', 'UH', 'UW', 'OW', 'AY', 'AW', 'OY'],
)
export const isVowelPhone = (p: string): boolean => VOWEL_SET.has(p.replace(/\d$/, ''))
