// Append authored dialogues into src/data/listening.ts.
//
//   npx tsx scripts/merge-listening.mts <file.ts> [<file.ts> …]
//
// Each file exports `dialogues: ListeningExercise[]`. Dialogues whose id is
// already in the corpus are skipped, so re-running is safe. New ones are
// appended before the array's closing bracket under a dated comment; file
// order inside listening.ts is cosmetic (the app sorts nothing by position).
// Run scripts/check-dialogues.mts --file on each file FIRST — this does no
// checking of its own.
import { readFileSync, writeFileSync } from 'node:fs'
import { LISTENING } from '../src/data'

const files = process.argv.slice(2)
if (files.length === 0) { console.error('usage: npx tsx scripts/merge-listening.mts <file.ts> …'); process.exit(2) }

const path = 'src/data/listening.ts'
let src = readFileSync(path, 'utf8')
const have = new Set(LISTENING.map(d => d.id))
let added = 0

for (const f of files) {
  const scratch = readFileSync(f, 'utf8')
  const start = scratch.indexOf('= [') + 3
  const stop = scratch.lastIndexOf(']')
  let body = scratch.slice(start, stop)
  // Drop any object literal whose id is already merged.
  body = body.replace(/\n\s*\{\s*\n\s*id: '([^']+)',[\s\S]*?\n {2}\},?/g, (block, id) => {
    if (have.has(id)) { console.log(`skip ${id}: already in the corpus`); return '' }
    have.add(id); added++
    console.log(`merge ${id}`)
    return block
  })
  body = body.replace(/^\s*\n/, '').trimEnd()
  if (!body) continue
  const end = src.lastIndexOf(']')
  const stamp = new Date().toISOString().slice(0, 10)
  src = src.slice(0, end) + `\n  // ── Added ${stamp} from ${f.split('/').pop()} ${'─'.repeat(30)}\n` + body + '\n' + src.slice(end)
}
writeFileSync(path, src)
console.log(`${added} dialogue(s) appended to ${path}`)
