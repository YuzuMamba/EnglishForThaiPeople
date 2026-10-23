// ─── ChaiEnglish core data model ─────────────────────────────────────────────
// ChaiEnglish is the mirror image of ChaiThai: the TARGET language is English
// and the learner's NATIVE language is Thai. Every field that faces the
// learner (meanings, notes, explanations, UI) is Thai; the thing being learned
// (`en`) is English.

/** What kind of learnable thing this is. */
export type ItemType = 'vocab' | 'phrase' | 'pattern' | 'char'

/** A single learnable item: word, phrase, sentence pattern, or English sound. */
export interface LexItem {
  id: string
  type: ItemType
  /** English form — the target. For patterns, the template with ___ blanks. */
  en: string
  /**
   * Thai-script reading (คำอ่าน): syllables joined with hyphens, and ONE
   * space-separated token per English word, so `thank you` reads `แธงค์ ยู`.
   * Derived from the CMU pronouncing dictionary by scripts/reading-anchor.mts
   * — never recalled from memory. Renderers align it word-for-word with `en`.
   */
  reading: string
  /** IPA (General American) from the same deriver, with stress marks. */
  ipa?: string
  /** Primary Thai meaning. */
  th: string
  /** Alternative Thai glosses — keeps multiple-choice distractors unambiguous. */
  altTh?: string[]
  /**
   * Accepted alternative ENGLISH forms when the learner TYPES the answer:
   * contractions and spelling variants ("I'm" / "I am", "okay" / "OK").
   */
  altEn?: string[]
  /** Word-by-word Thai gloss (for phrases/patterns). */
  literal?: string
  /** Part of speech / category label shown on the card, in Thai. */
  pos?: string
  /** Curriculum level this item belongs to (1-based). */
  level: number
  /** Semantic tags: 'food', 'core-verb', 'grammar', 'polite', … */
  tags: string[]
  /** Teaching note in Thai: why it works, register, culture, pitfalls. */
  notes?: string
  /** Mnemonic in Thai to anchor the sound/meaning. */
  mnemonic?: string
  /** Override text handed to TTS when `en` isn't what should be spoken. */
  audioHint?: string
  /** Example usages built (as far as possible) from previously-learned items. */
  examples?: Example[]
}

export interface Example {
  en: string
  reading: string
  th: string
}

/** A slot inside a sentence pattern. */
export interface PatternSlot {
  /** Display name of the slot, e.g. 'verb', 'food', 'place'. */
  name: string
  /** Item ids allowed to fill this slot (curated so results are natural English). */
  itemIds: string[]
  /** Optional: slot can be omitted entirely. */
  optional?: boolean
}

/**
 * A generative sentence pattern for Sentence Builder mode.
 * `enTemplate`/`thTemplate` use {slotName} placeholders.
 */
export interface SentencePattern {
  id: string
  level: number
  /** Learner-facing name — the English frame, e.g. 'I want to ___'. */
  name: string
  enTemplate: string
  /** Reading template: one token per English word, slots kept as {slot}. */
  readingTemplate: string
  thTemplate: string
  slots: PatternSlot[]
  /** Why this pattern works — the grammar behind it, in plain Thai. */
  explanation: string
  /** Curated combos that are especially natural (used for teaching examples). */
  showcase?: Record<string, string>[]
  /**
   * Slot-fill compatibility: for a keyed slot item id, the ONLY item ids the
   * NEXT slot may take (e.g. drink → drinks only). Absent = all combinations.
   */
  compat?: Record<string, string[]>
  /** Optional per-combination Thai overrides keyed by joined slot ids. */
  thOverrides?: Record<string, string>
  /** Distractor word ids to mix into the tile tray. */
  distractors?: string[]
}

/** A curriculum level: a themed bundle of items + patterns. */
export interface Level {
  n: number
  /** Thai title, e.g. 'คำแรกๆ'. */
  title: string
  /** English theme name shown small beside the title, e.g. 'First Words'. */
  titleEn: string
  subtitle: string
  /** Emoji badge for the level node on the path. */
  icon: string
  /** What the learner will be able to DO after this level (Thai). */
  canDo: string[]
  itemIds: string[]
  patternIds: string[]
}

/** A short listening-comprehension exercise. */
export interface ListeningExercise {
  id: string
  level: number
  /** Lines of dialogue (1 line = a single-speaker clip). */
  lines: { speaker: string; en: string; reading: string; th: string }[]
  /** Question and choices in Thai — comprehension, not translation. */
  question: string
  choices: string[]
  answer: number
  /** Why the answer is right; what to listen for (Thai). */
  explanation: string
}

/** A lesson in the Read-English phonics course. */
export interface ScriptLesson {
  id: string
  stage: number
  title: string
  subtitle: string
  kind: 'vowels' | 'consonants' | 'sounds' | 'practice'
  intro: string
  chars: ScriptChar[]
  /** Read-aloud drills using only graphemes introduced so far. */
  drills: { en: string; reading: string; th?: string }[]
}

/**
 * One teachable GRAPHEME — a letter or letter team — and the sound it makes.
 * Keyed by the grapheme as written: 'a', 'th', 'ee', 'a-e' (magic e).
 */
export interface ScriptChar {
  char: string
  /** Thai name of the letter/team, e.g. 'เอ', 'ที-เอช'. */
  name: string
  /** The sound, as a Thai-script reading: 'แอะ', 'ธ (ลมผ่านลิ้น)'. */
  reading: string
  /** The sound in IPA: 'æ', 'θ'. */
  ipa: string
  /** Group label shown on the card: 'สระสั้น', 'เสียงที่ไทยไม่มี', … */
  meta: string
  /** An example word that carries the sound, e.g. 'cat'. */
  word: string
  /** Reading of the example word. */
  wordReading: string
  /** Thai meaning of the example word. */
  wordTh: string
  /**
   * How to MAKE the sound with a Thai mouth — tongue, lips, air — and the
   * trap Thai speakers fall into. Thai.
   */
  mnemonic: string
  /** How to REMEMBER which sound this spelling makes — the hook. Thai. */
  sound: string
  /** One emoji standing in for the example word. */
  emoji: string
}

// ─── SRS ─────────────────────────────────────────────────────────────────────

/** SRS stage 0‥9. 0 = just learned; 9 = burned (retired). */
export type SrsStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface ItemProgress {
  stage: SrsStage
  /** Epoch ms when the item is next due. */
  due: number
  correct: number
  incorrect: number
  /** Consecutive correct answers in the current run. */
  streak: number
  /** Epoch ms when first learned. */
  learnedAt: number
  /**
   * Epoch ms when this record last CHANGED. Written by `newProgress` and
   * `applyAnswer`, which are the only two functions that ever produce one.
   *
   * Load-bearing for sync: merging two devices takes the newer record per id,
   * and `due` cannot stand in for this. A wrong answer at stage 5 drops to
   * stage 3 and sets a SHORTER due than before, so "later due wins" would
   * systematically discard the most recent answer — the exact silent loss sync
   * is supposed to prevent. Optional so that pre-v3 blobs still typecheck
   * while migrating; `migrateState` backfills it.
   */
  updatedAt?: number
}

/** Stage names shown to the learner — Thai, garden metaphor kept. */
export const SRS_STAGE_NAMES = [
  'เมล็ด', 'งอก', 'ต้นอ่อน', 'หยั่งราก',
  'ออกดอก', 'แข็งแรง', 'หยั่งลึก', 'ทอง', 'ยืนต้น', 'ฝังใจ',
] as const

/** Stage → interval in hours. One month of retention is weak evidence of
 *  durable acquisition, so a ~4-month Evergreen stage guards the burn. */
export const SRS_INTERVALS_H = [4, 8, 24, 48, 96, 168, 336, 720, 2880, Infinity] as const

export type QuizKind =
  | 'meaning-mc'      // English shown → pick the Thai meaning
  | 'reading-mc'      // Thai shown → pick the English
  | 'listen-mc'       // English audio only → pick the Thai meaning
  | 'type-en'         // Thai shown → TYPE the English (production)
  | 'assemble'        // Thai shown → assemble English tiles
  | 'char-sound'      // grapheme shown → pick the sound it makes
  | 'char-glyph'      // sound shown → pick the grapheme
