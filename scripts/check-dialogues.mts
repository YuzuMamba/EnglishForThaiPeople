// Listening-dialogue checker — the executable half of the authoring brief.
//
// A dialogue is the one place a learner hears English in flow, so the two
// things that silently go wrong are vocabulary from a level they have not
// reached (the line is noise) and a question answerable without the English
// (the longest choice is the answer, in most first drafts). Both are
// mechanical, so this checks them mechanically, plus the plumbing an author
// gets wrong on a first draft: ids, cast names, line counts, and the
// Thai-script reading against the CMU-backed deriver in scripts/reading.
//
//   npx tsx scripts/check-dialogues.mts                       # whole corpus
//   npx tsx scripts/check-dialogues.mts --level 4             # one level
//   npx tsx scripts/check-dialogues.mts --file path/to/x.ts   # a scratch file
//                                                             # exporting `dialogues`
//
// Exit code 1 on any FAIL. Pre-existing glue in old levels is reported as
// WARN, so the corpus as a whole passes; a NEW dialogue is held to the
// brief's limit of three glue tokens. Likewise a reading that disagrees with
// the deriver FAILs a draft and WARNs in the corpus.
import { ITEMS, LISTENING } from '../src/data'
import { CAST } from '../src/data/listening'
import type { ListeningExercise } from '../src/core/types'
import { derive } from './reading/derive'

const args = process.argv.slice(2)
const argOf = (k: string): string | undefined => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined }
const onlyLevel = argOf('--level') ? Number(argOf('--level')) : undefined
const file = argOf('--file')

// ─── lexicon by level (same rule as audit-content.mts) ───────────────────────
// Lower-case, split on whitespace, punctuation stripped, apostrophes kept. A
// token is covered when it equals an item form (en, each `/` alternative,
// altEn) at ≤ level; a run of tokens when it splits into whole item forms.
// Never segmented below the word.
const PUNCT = /[,.!?;:"()…—–]/g
const tokens = (s: string): string[] =>
  s.toLowerCase().replace(/[’‘]/g, "'").replace(PUNCT, ' ').split(/\s+/).filter(Boolean)
const canon = (s: string): string => tokens(s).join(' ')
const lexLevel = new Map<string, number>()
const teach = (form: string, level: number): void => {
  const f = canon(form)
  if (!f) return
  const cur = lexLevel.get(f)
  if (cur === undefined || level < cur) lexLevel.set(f, level)
}
for (const it of Object.values(ITEMS)) {
  for (const form of it.en.split('/')) teach(form, it.level)
  for (const alt of it.altEn ?? []) teach(alt, it.level)
}
const maxWords = Math.max(1, ...[...lexLevel.keys()].map(f => f.split(' ').length))
function uncovered(words: string[], cap: number): string[] {
  const n = words.length
  const best: ({ miss: number; left: string[] } | null)[] = new Array(n + 1).fill(null)
  best[0] = { miss: 0, left: [] }
  for (let i = 0; i < n; i++) {
    const b = best[i]
    if (!b) continue
    const skip = { miss: b.miss + 1, left: [...b.left, words[i]] }
    if (!best[i + 1] || skip.miss < best[i + 1]!.miss) best[i + 1] = skip
    for (let L = 1; L <= Math.min(maxWords, n - i); L++) {
      const lv = lexLevel.get(words.slice(i, i + L).join(' '))
      if (lv !== undefined && lv <= cap && (!best[i + L] || b.miss < best[i + L]!.miss)) {
        best[i + L] = { miss: b.miss, left: b.left }
      }
    }
  }
  return best[n]!.left
}

// The cast's names are not vocabulary but they are in every dialogue; digits
// are read, not learned; a few interjections are conversation glue.
const NAME_TOKENS = new Set(Object.keys(CAST).flatMap(n => tokens(n)))
const INTERJECTIONS = new Set(['oh', 'hi', 'hey', 'um', 'uh', 'wow', 'hmm', 'yeah', 'yep', 'okay', 'ok'])
const NUMBER = /^\d+([.:,]\d+)*(st|nd|rd|th|s|am|pm)?$/
const ignorable = (t: string): boolean => NAME_TOKENS.has(t) || INTERJECTIONS.has(t) || NUMBER.test(t)
/** Tokens of a line not built from items taught at ≤ level. */
const glue = (line: string, level: number): string[] =>
  uncovered(tokens(line).filter(t => !ignorable(t)), level)

// ─── reading compare ─────────────────────────────────────────────────────────
/**
 * A written reading agrees with the deriver when they match after dropping
 * what is layout or accent rather than sound: hyphens and spaces (syllable and
 * word joins), the four tone marks ่ ้ ๊ ๋ (English has no lexical tone; the
 * marks only hint stress) and การันต์ ์ (silences a letter kept for spelling).
 */
const normReading = (r: string): string => r.replace(/[-\s่-๋์]/g, '')
/** What the deriver is handed: punctuation out, contractions intact. */
const cleanEn = (s: string): string => s.replace(/[’‘]/g, "'").replace(PUNCT, ' ').replace(/\s+/g, ' ').trim()

// ─── run ─────────────────────────────────────────────────────────────────────
let fails = 0, warns = 0
const fail = (m: string): void => { fails++; console.log(`FAIL  ${m}`) }
const warn = (m: string): void => { warns++; console.log(`WARN  ${m}`) }

let subject: ListeningExercise[]
let isNew = false
if (file) {
  const mod = await import(file.startsWith('/') ? file : `${process.cwd()}/${file}`)
  subject = mod.dialogues as ListeningExercise[]
  isNew = true
} else {
  subject = onlyLevel ? LISTENING.filter(d => d.level === onlyLevel) : LISTENING
}

const corpusIds = new Set(LISTENING.map(d => d.id))
const seen = new Set<string>()
for (const d of subject) {
  const tag = `${d.id} (L${d.level})`
  if (seen.has(d.id)) fail(`${tag}: duplicate id within the set`)
  seen.add(d.id)
  if (isNew && corpusIds.has(d.id)) fail(`${tag}: id already exists in src/data/listening.ts`)
  if (onlyLevel && d.level !== onlyLevel) fail(`${tag}: level field is ${d.level}`)
  if (!/^lis-[a-z0-9-]+$/.test(d.id)) fail(`${tag}: id must be lis-<slug>`)

  // lines
  if (d.lines.length < 4 || d.lines.length > 10) fail(`${tag}: ${d.lines.length} lines — want 6–10 (4 tolerated for the oldest levels)`)
  const speakers = [...new Set(d.lines.map(l => l.speaker))]
  if (speakers.length !== 2) fail(`${tag}: ${speakers.length} speakers — want exactly 2 (${speakers.join(', ')})`)
  for (let i = 1; i < d.lines.length; i++) {
    if (d.lines[i].speaker === d.lines[i - 1].speaker) { fail(`${tag}: lines ${i} and ${i + 1} are both ${d.lines[i].speaker} — speakers must alternate`); break }
  }
  const allGlue: string[] = []
  for (const [i, l] of d.lines.entries()) {
    if (!CAST[l.speaker]) fail(`${tag} line ${i + 1}: unknown speaker ${l.speaker} — add them to CAST in src/data/listening.ts with a gender`)
    if (!l.en?.trim()) fail(`${tag} line ${i + 1}: empty en`)
    if (!l.reading?.trim()) fail(`${tag} line ${i + 1}: empty reading`)
    if (!l.th?.trim()) fail(`${tag} line ${i + 1}: empty th`)
    if (!l.en?.trim()) continue
    allGlue.push(...glue(l.en, d.level))
    // reading against the deriver
    if (l.reading?.trim()) {
      const r = derive(cleanEn(l.en))
      const missing = r.words.filter((w: { source: string }) => w.source === 'MISSING').map((w: { word: string }) => w.word)
      if (missing.length > 0) {
        warn(`${tag} line ${i + 1}: the deriver has no reading for ${missing.join(' ')} — add an exception in scripts/reading or accept the written reading — "${l.en}"`)
      } else if (normReading(r.reading) !== normReading(l.reading)) {
        const m = `${tag} line ${i + 1}: reading mismatch — "${l.en}" written ${l.reading}, derived ${r.reading}`
        if (isNew) fail(m); else warn(m)
      }
    }
  }
  const uniq = [...new Set(allGlue)]
  if (uniq.length > 0) {
    const m = `${tag}: ${uniq.length} token(s) not built from words taught at ≤ L${d.level}: ${uniq.join(' ')}`
    if (isNew && uniq.length > 3) fail(m); else warn(m)
  }

  // question
  if (d.choices.length !== 4) fail(`${tag}: ${d.choices.length} choices — want 4`)
  if (d.answer < 0 || d.answer >= d.choices.length) fail(`${tag}: answer index ${d.answer} out of range`)
  const longest = Math.max(...d.choices.map(c => c.length))
  if (d.choices[d.answer]?.length === longest && d.choices.filter(c => c.length === longest).length === 1) {
    const m = `${tag}: the correct answer is the longest choice (${longest} chars) — a test-wise learner picks it without the English`
    if (isNew) fail(m); else warn(m)
  }
  if (!d.question.trim().endsWith('?')) warn(`${tag}: question does not end with "?"`)
  // Thai is denser than English on the page, so 60 Thai characters say what 80 Latin ones do.
  if (d.explanation.length < 60) fail(`${tag}: explanation is ${d.explanation.length} chars — want ≥ 60, naming the English that carries the answer`)
  if (!/[A-Za-z]{2,}/.test(d.explanation)) warn(`${tag}: explanation cites no English`)
}

console.log(`\n${subject.length} dialogue(s) checked · ${fails} FAIL · ${warns} WARN`)
process.exit(fails ? 1 : 0)
