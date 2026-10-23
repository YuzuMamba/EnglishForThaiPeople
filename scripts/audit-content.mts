// Corpus-level content audit — the out-of-family checks CLAUDE.md §5 asks for.
//
// Item-level correctness (is this entry right?) is what a reviewer checks by
// reading. This script asks the other question — does the course have HOLES a
// learner falls through? — and it asks it against data the authors did not
// produce:
//
//   A. coverage of an EXTERNAL spoken-register frequency list
//      (scripts/freq/en-opensubtitles-top3000.txt, provenance in its header)
//   B. closed-class inventories, enumerated: pronouns, be/do/have forms,
//      question words, negation, articles and determiners, prepositions,
//      conjunctions, modals, quantifiers and degree words, numbers, time
//      words, fillers and reactions
//   C. pattern ↔ item cross-reference: every literal word in a template must be
//      learnable at or before the pattern's level, and every slot item must exist
//      at or before it
//   D. listening dialogues: vocabulary outside what their level has taught
//   E. field completeness, orphans, level-field agreement, duplicate English forms
//
// Run it after any content batch:
//   npx tsx scripts/audit-content.mts             summary
//   npx tsx scripts/audit-content.mts --verbose   plus the full uncovered list
//
// Tokenisation: lower-case, split on whitespace, punctuation stripped,
// apostrophes kept ("don't" is one word). A token is COVERED when it equals an
// item form — an `en`, each `/` alternative of it, or an `altEn` — taught at
// or below the level in question; a RUN of tokens is covered when it splits
// into whole item forms ("thank you" is covered by the phrase item, or by
// `thank` + `you`). English is never segmented below the word: a multi-word
// phrase teaches nothing about its parts, so the item "thank you" does NOT
// cover a bare "thank", and nothing is ever matched letter by letter.
import { readFileSync, existsSync } from 'node:fs'
import { ITEMS, PATTERNS, CURRICULUM, LISTENING } from '../src/data'
import { CAST } from '../src/data/listening'

const verbose = process.argv.includes('--verbose')
const items = Object.values(ITEMS)

// ─── tokenisation ───────────────────────────────────────────────────────────
const PUNCT = /[,.!?;:"()…—–]/g
/** Lower-cased word tokens of an English string: punctuation stripped,
 *  apostrophes kept and normalised to the ASCII one. */
const tokens = (s: string): string[] =>
  s.toLowerCase().replace(/[’‘]/g, "'").replace(PUNCT, ' ').split(/\s+/).filter(Boolean)
/** Canonical form of a word or phrase: its tokens joined by single spaces. */
const canon = (s: string): string => tokens(s).join(' ')

// ─── lexicon: English form → earliest level it is taught ────────────────────
const lexLevel = new Map<string, number>()
const teach = (form: string, level: number): void => {
  const f = canon(form)
  if (!f) return
  const cur = lexLevel.get(f)
  if (cur === undefined || level < cur) lexLevel.set(f, level)
}
for (const it of items) {
  for (const form of it.en.split('/')) teach(form, it.level)
  for (const alt of it.altEn ?? []) teach(alt, it.level)
}
const maxWords = Math.max(1, ...[...lexLevel.keys()].map(f => f.split(' ').length))

/**
 * The tokens of `words` left uncovered when the run is split into whole item
 * forms taught at level ≤ cap — the split that leaves the FEWEST uncovered.
 * Word granularity only; see the header.
 */
function uncovered(words: string[], cap = Infinity): string[] {
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
/** A word or phrase is covered when nothing in it is left uncovered. */
const covered = (phrase: string, cap = Infinity): boolean => uncovered(tokens(phrase), cap).length === 0
/** Level at which a whole form is first taught, for "taught later" reports. */
const taughtAt = (form: string): number | undefined => lexLevel.get(canon(form))

// ─── A. external frequency coverage ─────────────────────────────────────────
console.log('=== A. External frequency coverage (OpenSubtitles en, word tokens)')
const freqPath = 'scripts/freq/en-opensubtitles-top3000.txt'
let rank = new Map<string, number>()
if (!existsSync(freqPath)) {
  console.log(`  ${freqPath} missing — section skipped`)
} else {
  const freq = readFileSync(freqPath, 'utf8').split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => { const [tok, n] = l.trim().split(/\s+/); return { tok: canon(tok), n: Number(n) || 0 } })
    .filter(r => r.tok)
  rank = new Map(freq.map((r, i) => [r.tok, i + 1]))
  for (const N of [100, 300, 500, 1000, 2000, 3000]) {
    const band = freq.slice(0, N)
    if (band.length === 0) continue
    const cov = band.filter(r => covered(r.tok))
    const mass = band.reduce((a, r) => a + r.n, 0)
    const covMass = cov.reduce((a, r) => a + r.n, 0)
    console.log(`  top ${String(N).padStart(4)}: ${String(cov.length).padStart(4)}/${band.length} tokens (${(100 * cov.length / band.length).toFixed(0)}%) · ${mass ? (100 * covMass / mass).toFixed(0) : '0'}% of the band's occurrences`)
  }
  const uncov = freq.filter(r => !covered(r.tok))
  console.log(`  uncovered in top 3000: ${uncov.length}. First 80:`)
  console.log('  ' + uncov.slice(0, 80).map(r => r.tok).join(' '))
  if (verbose) console.log('  all: ' + uncov.map(r => `${r.tok}(${rank.get(r.tok)})`).join(' '))
}

// ─── B. closed-class inventories ────────────────────────────────────────────
// Finite sets a course either has or doesn't. Enumerated by hand — the point is
// that these are checked against a LIST, not against the authors' sense of
// what feels covered. A form counts only when it is taught AS A UNIT (an item
// or altEn form): "have to" taught as `have` + `to` is a modal the course has
// not named. Extend the lists; never trim them to make a level pass.
const CLOSED: Record<string, string[]> = {
  pronouns: ['I', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'myself', 'yourself'],
  'be/do/have': ['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'done', 'have', 'has', 'had'],
  questions: ['what', 'where', 'when', 'who', 'why', 'how', 'which', 'whose', 'how much', 'how many', 'how long', 'how old'],
  negation: ['not', 'no', 'never', 'nothing', 'nobody', 'none', "don't", "doesn't", "didn't", "can't", "won't", "isn't", "aren't"],
  determiners: ['a', 'an', 'the', 'this', 'that', 'these', 'those', 'some', 'any', 'every', 'each', 'all', 'both', 'another', 'other'],
  prepositions: ['in', 'on', 'at', 'to', 'from', 'with', 'for', 'of', 'about', 'by', 'near', 'next to', 'behind', 'in front of', 'between', 'under', 'over', 'after', 'before', 'until', 'during', 'through', 'around'],
  conjunctions: ['and', 'but', 'or', 'so', 'because', 'if', 'when', 'while', 'although', 'though', 'until', 'unless', 'than', 'that'],
  modals: ['can', 'could', 'will', 'would', 'should', 'must', 'may', 'might', 'have to', 'want to', 'need to', 'going to', 'used to'],
  quantifiers: ['a lot', 'many', 'much', 'few', 'little', 'more', 'less', 'most', 'enough', 'too', 'very', 'really', 'quite', 'just', 'only', 'also'],
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'twenty', 'thirty', 'forty', 'fifty', 'hundred', 'thousand', 'million', 'first', 'second', 'third', 'half'],
  time: ['today', 'tomorrow', 'yesterday', 'now', 'later', 'soon', 'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year', 'hour', 'minute', "o'clock", 'always', 'usually', 'often', 'sometimes', 'never', 'again', 'still', 'already', 'yet'],
  fillers: ['okay', 'yeah', 'sure', 'really', 'well', 'actually', 'maybe', 'of course', 'no problem', 'sorry', 'excuse me'],
}
console.log('\n=== B. Closed-class inventories')
const missingClosed: string[] = []
for (const [cls, forms] of Object.entries(CLOSED)) {
  const miss = forms.filter(f => taughtAt(f) === undefined)
  missingClosed.push(...miss.map(canon))
  console.log(`  ${cls.padEnd(15)} ${String(forms.length - miss.length).padStart(2)}/${forms.length}   missing: ${miss.join(' ') || '—'}`)
}
if (rank.size) {
  const ranked = [...new Set(missingClosed)].map(f => ({ f, r: rank.get(f) ?? Infinity })).filter(x => x.r < Infinity).sort((a, b) => a.r - b.r)
  console.log(`  missing closed-class forms by external rank: ${ranked.map(x => `${x.f}(${x.r})`).join(' ') || '—'}`)
}

// ─── C. pattern ↔ item cross-reference ──────────────────────────────────────
console.log('\n=== C. Pattern literals not learnable at or before their level')
let xref = 0
for (const p of Object.values(PATTERNS)) {
  // Literal runs between slots — a multi-word form cannot span a slot.
  const runs: string[][] = [[]]
  for (const part of p.enTemplate.split(/\s+/).filter(Boolean)) {
    if (/^\{\w+\}$/.test(part)) runs.push([])
    else runs[runs.length - 1].push(part)
  }
  for (const run of runs) {
    // `a/an` alternatives: each must be covered on its own; the run as a whole
    // is checked with the first alternative in place.
    const alts = run.filter(t => t.includes('/')).flatMap(t => t.split('/').flatMap(a => tokens(a)))
    const words = run.flatMap(t => tokens(t.split('/')[0]))
    const miss = new Set([...uncovered(words, p.level), ...alts.filter(a => !covered(a, p.level))])
    for (const t of miss) {
      xref++
      const later = taughtAt(t)
      console.log(`  ${p.id.padEnd(22)} L${String(p.level).padEnd(3)} "${t}"  ${later !== undefined ? `taught later: L${later}` : 'never taught'}`)
    }
  }
  for (const s of p.slots) for (const id of s.itemIds) {
    const it = ITEMS[id]
    if (!it) { xref++; console.log(`  ${p.id} slot ${s.name}: unknown item ${id}`) }
    else if (it.level > p.level) { xref++; console.log(`  ${p.id.padEnd(22)} L${String(p.level).padEnd(3)} slot ${s.name} uses ${id} (${it.en}) taught at L${it.level}`) }
  }
}
console.log(`  hits: ${xref}`)

// ─── D. listening leakage ───────────────────────────────────────────────────
console.log('\n=== D. Listening: tokens not covered by items at ≤ their level')
// The cast's names are not vocabulary but they are in every dialogue; digits
// are read, not learned; and a short list of interjections is conversation
// glue no course teaches as items.
const NAME_TOKENS = new Set(Object.keys(CAST).flatMap(n => tokens(n)))
const INTERJECTIONS = new Set(['oh', 'hi', 'hey', 'um', 'uh', 'wow', 'hmm', 'yeah', 'yep', 'okay', 'ok'])
const NUMBER = /^\d+([.:,]\d+)*(st|nd|rd|th|s|am|pm)?$/
const ignorable = (t: string): boolean => NAME_TOKENS.has(t) || INTERJECTIONS.has(t) || NUMBER.test(t)
const byLevel = new Map<number, Set<string>>()
let leakTotal = 0
for (const ex of LISTENING) {
  for (const line of ex.lines) {
    for (const t of uncovered(tokens(line.en).filter(t => !ignorable(t)), ex.level)) {
      const set = byLevel.get(ex.level) ?? new Set<string>()
      set.add(t); byLevel.set(ex.level, set); leakTotal++
    }
  }
}
for (const [lv, set] of [...byLevel].sort((a, b) => a[0] - b[0])) console.log(`  L${lv}: ${[...set].join(' ')}`)
console.log(`  tokens: ${leakTotal} across ${LISTENING.length} dialogues`)

// ─── E. structure ───────────────────────────────────────────────────────────
console.log('\n=== E. Structure')
const incomplete = items.filter(i => !i.pos || !i.tags?.length || !i.notes)
console.log(`  items missing pos/tags/notes: ${incomplete.length}${incomplete.length ? ' — ' + incomplete.map(i => i.id).join(' ') : ''}`)
console.log(`  items without altTh: ${items.filter(i => !i.altTh?.length).length}/${items.length} (multiple-choice distractors can collide with the primary gloss)`)
const unread = items.filter(i => !i.reading?.trim() || !i.ipa?.trim())
console.log(`  items without ipa or reading: ${unread.length}/${items.length}${unread.length ? ' — ' + unread.map(i => i.id).join(' ') : ''}`)
console.log(`  items without examples: ${items.filter(i => !i.examples?.length).length}/${items.length}`)
const listed = new Set(CURRICULUM.flatMap(l => [...l.itemIds, ...l.patternIds]))
console.log(`  orphan items: ${items.filter(i => !listed.has(i.id)).map(i => i.id).join(' ') || 'none'}`)
console.log(`  orphan patterns: ${Object.keys(PATTERNS).filter(id => !listed.has(id)).join(' ') || 'none'}`)
console.log(`  level-field disagreements: ${CURRICULUM.flatMap(l => l.itemIds.filter(id => ITEMS[id] && ITEMS[id].level !== l.n)).join(' ') || 'none'}`)
const byEn = new Map<string, string[]>()
for (const i of items) byEn.set(canon(i.en), [...(byEn.get(canon(i.en)) ?? []), i.id])
console.log(`  same English, several ids (sense splits): ${[...byEn].filter(([, v]) => v.length > 1).map(([k, v]) => `${k}[${v.join(',')}]`).join(' ') || 'none'}`)
const lc = new Map<number, number>()
for (const l of LISTENING) lc.set(l.level, (lc.get(l.level) ?? 0) + 1)
console.log(`  levels with no listening dialogue: ${CURRICULUM.filter(l => !lc.get(l.n)).map(l => l.n).join(' ') || 'none'}`)
console.log(`\n${CURRICULUM.length} levels · ${items.length} items · ${Object.keys(PATTERNS).length} patterns · ${LISTENING.length} dialogues`)
