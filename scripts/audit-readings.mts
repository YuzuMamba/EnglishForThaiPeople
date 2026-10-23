// Corpus-wide reading audit — every Thai-script reading in the course,
// replayed through the deriver.
//
// CLAUDE.md §4: readings are DERIVED, never recalled. Authors run
// reading-anchor.mts while writing, but nothing stops a hand edit later, and a
// reading that drifts from the rules is invisible on a card — it just teaches
// a slightly different pronunciation than every other card. This catches it.
//
//   npx tsx scripts/audit-readings.mts            # whole corpus, exit 1 on mismatch
//   npx tsx scripts/audit-readings.mts --level 3  # one level's items/patterns
//   npx tsx scripts/audit-readings.mts --warn     # report, exit 0
//
// Comparison ignores hyphens, spaces and Thai tone marks (่ ้ ๊ ๋) — the rules
// place a tone mark only on a word-final unstressed -y, and an author who
// dropped it has the pronunciation right. การันต์ (์) is kept: เทสต์ and เทสต
// are different claims about the final cluster.
import { ITEMS, PATTERNS, LISTENING, SCRIPT_LESSONS } from '../src/data'
import { derive } from './reading/derive'

const args = process.argv.slice(2)
const warnOnly = args.includes('--warn')
const li = args.indexOf('--level')
const onlyLevel = li >= 0 ? Number(args[li + 1]) : undefined

const norm = (r: string): string => r.replace(/[-\s]/g, '').replace(/[่-๋]/g, '')
const isSlot = (t: string): boolean => /^\{\w+\}$/.test(t)
const tidy = (t: string): string => t.replace(/[,.!?;:"]+$/g, '').replace(/^["(]+/, '')

let checked = 0, mismatches = 0, missing = 0
const report = (where: string, en: string, written: string, derived: string, src: string): void => {
  checked++
  if (src === 'MISSING') { missing++; console.log(`MISSING  ${where}  "${en}" — not in CMUdict/exceptions; written ${written}`); return }
  if (norm(written) === norm(derived)) return
  mismatches++
  console.log(`MISMATCH ${where}  "${en}"  written ${written}  derived ${derived}`)
}

/** Derive one English string and summarise the per-word sources. */
const check = (where: string, en: string, written: string): void => {
  const d = derive(en)
  const src = d.words.some(w => w.source === 'MISSING') ? 'MISSING' : 'OK'
  report(where, en, written, d.reading, src)
}

// Items, examples
for (const it of Object.values(ITEMS)) {
  if (onlyLevel && it.level !== onlyLevel) continue
  check(`item ${it.id}`, it.audioHint ?? it.en.replace(/_/g, ''), it.reading)
  for (const [i, ex] of (it.examples ?? []).entries()) check(`item ${it.id} example ${i + 1}`, ex.en, ex.reading)
}

// Patterns: literal tokens must align one-to-one and agree with the deriver.
for (const p of Object.values(PATTERNS)) {
  if (onlyLevel && p.level !== onlyLevel) continue
  const T = p.enTemplate.split(/\s+/).filter(Boolean)
  const R = p.readingTemplate.split(/\s+/).filter(Boolean)
  if (T.length !== R.length) {
    mismatches++
    console.log(`MISMATCH pattern ${p.id}  enTemplate has ${T.length} tokens, readingTemplate has ${R.length} — one reading token per English word`)
    continue
  }
  T.forEach((t, i) => {
    if (isSlot(t)) { if (!isSlot(R[i])) { mismatches++; console.log(`MISMATCH pattern ${p.id}  token ${i + 1}: ${t} vs ${R[i]}`) }; return }
    const forms = tidy(t).split('/')
    const reads = R[i].split('/')
    forms.forEach((f, k) => check(`pattern ${p.id} token ${i + 1}`, f, reads[k] ?? ''))
  })
}

// Dialogues
for (const d of LISTENING) {
  if (onlyLevel && d.level !== onlyLevel) continue
  d.lines.forEach((l, i) => check(`dialogue ${d.id} line ${i + 1}`, l.en, l.reading))
}

// Phonics: example words and drills
if (!onlyLevel) {
  for (const lesson of SCRIPT_LESSONS) {
    for (const c of lesson.chars) check(`phonics ${lesson.id} ${c.char}`, c.word, c.wordReading)
    for (const dr of lesson.drills) check(`phonics ${lesson.id} drill`, dr.en, dr.reading)
  }
}

console.log(`\n${checked} readings checked · ${mismatches} mismatch · ${missing} missing from the dictionary`)
process.exit(!warnOnly && (mismatches > 0 || missing > 0) ? 1 : 0)
