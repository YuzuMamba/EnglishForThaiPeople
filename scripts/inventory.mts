// Author-facing inventory of the whole corpus, one line per entry — what a
// content author (human or agent) reads to learn which ids exist, which
// English is already taught and at which level (with its Thai reading and
// meaning), and which dialogue situations are already used. Regenerate before
// every content batch.
//
//   npx tsx scripts/inventory.mts <out-dir>
//
// Writes items.txt, patterns.txt, listening.txt into <out-dir>.
import { mkdirSync, writeFileSync } from 'node:fs'
import { ITEMS, PATTERNS, LISTENING } from '../src/data'

const out = process.argv[2]
if (!out) { console.error('usage: npx tsx scripts/inventory.mts <out-dir>'); process.exit(2) }
mkdirSync(out, { recursive: true })

const items = Object.values(ITEMS).sort((a, b) => a.level - b.level || a.id.localeCompare(b.id))
writeFileSync(`${out}/items.txt`, items.map(i =>
  `L${String(i.level).padStart(2)} ${i.id.padEnd(18)} ${i.en.padEnd(22)} ${i.reading.padEnd(24)} [${i.pos}] ${i.th}${i.altTh?.length ? '  alt: ' + i.altTh.join(' / ') : ''}  {${i.tags.join(',')}}`,
).join('\n') + '\n')

const pats = Object.values(PATTERNS).sort((a, b) => a.level - b.level || a.id.localeCompare(b.id))
writeFileSync(`${out}/patterns.txt`, pats.map(p =>
  `L${String(p.level).padStart(2)} ${p.id.padEnd(22)} ${p.enTemplate.padEnd(34)} ${p.thTemplate}  slots: ${p.slots.map(s => s.name + '[' + s.itemIds.join(',') + ']').join(' ')}`,
).join('\n') + '\n')

writeFileSync(`${out}/listening.txt`, LISTENING.map(d =>
  `L${d.level} ${d.id} · Q: ${d.question} · ${d.lines.map(l => l.speaker + ': ' + l.en).join(' | ')}`,
).join('\n') + '\n')

console.log(`${out}: items ${items.length} · patterns ${pats.length} · dialogues ${LISTENING.length}`)
