// Reading (คำอ่าน) anchor for new English content.
//
// CLAUDE.md §4: readings are never written from memory. English spelling does
// not encode pronunciation, so every item's `reading` and `ipa` come from the
// CMU Pronouncing Dictionary through the rules in scripts/reading/. This CLI
// is how an author (human or agent) gets them.
//
//   npx tsx scripts/reading-anchor.mts --en "thank you" "coffee"
//       prints reading + IPA per input, and a verdict per word:
//         DERIVED    computed from CMUdict through the rules — ship it
//         EXCEPTION  from scripts/reading/exceptions.ts (a proper name or a
//                    word whose fixed Thai form beats the rule) — ship it
//         MISSING    in neither; the reading prints as ? and the run exits 1.
//                    Add an exception WITH a reason, never guess.
//
//   npx tsx scripts/reading-anchor.mts --json --en "thank you" "coffee"
//       the same as a JSON array, for batch use.
//
//   npx tsx scripts/reading-anchor.mts --check "coffee" "คอฟ-ฟี่"
//       audits a reading someone already wrote: MATCH / MISMATCH against the
//       derived form. Hyphens, spaces and tone marks are ignored in the
//       comparison (they are presentation; the letters are the claim).
//
// Conventions: scripts/reading/README.md. Regression suite: scripts/reading/validate.mts.
import { derive, type Derivation } from './reading/derive'

const argv = process.argv.slice(2)
const usage = () => {
  console.error('usage: npx tsx scripts/reading-anchor.mts [--json] --en "<english>" ...\n       npx tsx scripts/reading-anchor.mts --check "<english>" "<reading>"')
  process.exit(2)
}

/** Strip hyphens, spaces and the four tone marks (่ ้ ๊ ๋) so only the letters are compared. */
export const normaliseReading = (s: string): string =>
  s.normalize('NFC').replace(/[-\s่-๋]/g, '')

if (argv.includes('--check')) {
  const i = argv.indexOf('--check')
  const en = argv[i + 1]
  const reading = argv[i + 2]
  if (!en || !reading) usage()
  const d = derive(en)
  const match = normaliseReading(d.reading) === normaliseReading(reading)
  console.log(`${match ? 'MATCH   ' : 'MISMATCH'} ${en}`)
  console.log(`  yours:   ${reading}`)
  console.log(`  derived: ${d.reading}   ${d.ipa}`)
  for (const w of d.words) if (w.source !== 'DERIVED') console.log(`  ${w.source.padEnd(9)} ${w.word}`)
  process.exit(match ? 0 : 1)
}

const json = argv.includes('--json')
const enIdx = argv.indexOf('--en')
if (enIdx < 0) usage()
const inputs = argv.slice(enIdx + 1).filter(a => a !== '--json')
if (inputs.length === 0) usage()

const results: (Derivation & { en: string })[] = inputs.map(en => ({ en, ...derive(en) }))
const anyMissing = results.some(r => r.words.some(w => w.source === 'MISSING'))

if (json) {
  console.log(JSON.stringify(results, null, 2))
} else {
  for (const r of results) {
    console.log(`${r.en}`)
    console.log(`  reading: ${r.reading}`)
    console.log(`  ipa:     ${r.ipa}`)
    for (const w of r.words) {
      console.log(`  ${w.source.padEnd(9)} ${w.word.padEnd(16)} ${w.reading.padEnd(20)} ${w.ipa}`)
    }
    console.log()
  }
  if (anyMissing) console.log('MISSING words above: add them to scripts/reading/exceptions.ts with a reason, never guess.')
}
process.exit(anyMissing ? 1 : 0)
