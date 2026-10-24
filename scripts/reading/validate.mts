// Regression suite for the reading deriver.
//
// Two checks, both must pass:
//   1. The regression table below: every word derives to EXACTLY the expected
//      reading. Any mismatch fails the run. Fix RULES (arpabet.ts, derive.ts)
//      before touching an expectation; an expectation changes only when the
//      expectation itself was the unidiomatic one, and the commit says so.
//   2. Coverage: fewer than 2% of the top 1,000 spoken-English words
//      (scripts/freq/en-opensubtitles-top3000.txt) may be MISSING — in neither
//      CMUdict nor exceptions.ts.
//
//   npx tsx scripts/reading/validate.mts              summary + failures
//   npx tsx scripts/reading/validate.mts --verbose    every table row
//   npx tsx scripts/reading/validate.mts --sample 60  also print 60 random
//                                                     top-1,000 derivations
//                                                     to eyeball for nonsense
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { derive } from './derive'

const argv = process.argv.slice(2)
const verbose = argv.includes('--verbose')
const sampleN = argv.includes('--sample') ? Number(argv[argv.indexOf('--sample') + 1] || 60) : 0

// ─── Regression table: English → expected reading ──────────────────────────
// Readings here are the transcription convention (scripts/reading/README.md),
// not Thai loanword spellings. Rows that pass through exceptions.ts are marked.
const TABLE: [string, string][] = [
  // ── The original specification ──
  ['hello', 'เฮล-โล'], ['thank you', 'แธงค์ ยู'], ['coffee', 'คอฟ-ฟี่'], ['water', 'วอ-เทอร์'],
  ['please', 'พลีส'], ['sorry', 'ซอ-รี่'], ['happy', 'แฮป-ปี้'], ['friend', 'เฟรนด์'],
  ['think', 'ธิงค์'], ['this', 'ดิส'], ['very', 'เว-รี่'], ['work', 'เวิร์ก'],
  ['world', 'เวิลด์'], ['girl', 'เกิร์ล'], ['first', 'เฟิร์สต์'], ['teacher', 'ที-เชอร์'],
  ['computer', 'คอม-พิว-เทอร์'], ['apple', 'แอป-เปิล'], ['banana', 'บะ-นา-นะ'], ['today', 'ทู-เดย์'],
  ['name', 'เนม'], ['time', 'ไทม์'], ['nice', 'ไนส์'], ['house', 'เฮาส์'],
  ['now', 'นาว'], ['down', 'ดาวน์'], ['boy', 'บอย'], ['book', 'บุก'],
  ['food', 'ฟูด'], ['good', 'กุด'], ['home', 'โฮม'], ['go', 'โก'],
  ['car', 'คาร์'], ['here', 'เฮียร์'], ['there', 'แธร์'], ['where', 'แวร์'],
  ['sure', 'ชัวร์'], ['four', 'โฟร์'], ['more', 'มอร์'], ['my', 'มาย'],
  ['I', 'ไอ'], ['high', 'ไฮ'], ['school', 'สคูล'], ['street', 'สตรีต'],
  ['three', 'ธรี'], ['zoo', 'ซู'], ['station', 'สเต-ชั่น'], ['question', 'เควส-ชั่น'],
  ['money', 'มัน-นี่'], ['city', 'ซิต-ตี้'], ['easy', 'อี-ซี่'], ['little', 'ลิต-เติล'],
  ['people', 'พี-เพิล'], ['cat', 'แค็ต'], ['bed', 'เบ็ด'], ['sit', 'ซิต'],
  ['hot', 'ฮอต'], ['cup', 'คัป'], ['yes', 'เย็ส'], ['bus', 'บัส'],
  ['like', 'ไลก์'], ['five', 'ไฟฟ์'], ['night', 'ไนต์'], ['play', 'เพลย์'],
  ['late', 'เลต'], ['law', 'ลอ'], ['talk', 'ทอก'], ['her', 'เฮอร์'],
  ['bird', 'เบิร์ด'], ['two', 'ทู'], ['you', 'ยู'], ['phone', 'โฟน'],
  ['about', 'อะ-เบาต์'], ['out', 'เอาต์'], ['love', 'ลัฟ'], ['lesson', 'เลส-ซัน'],
  ['open', 'โอ-เพ็น'], ['cats', 'แค็ตส์'], ['test', 'เทสต์'], ['friends', 'เฟรนด์ส์'],
  ["don't", 'โดนต์'], ["I'm", 'ไอม์'], ["it's", 'อิตส์'], ["what's", 'วอตส์'],
  ["can't", 'แคนต์'], ["doesn't", 'ดัซ-ซันต์'], ['Bangkok', 'แบง-ค็อก'],
  // ── Rules beyond the first spec, pinned so they cannot drift ──
  ['music', 'มิว-ซิก'], ['idea', 'ไอ-เดีย'], ['fire', 'ไฟร์'], ['hour', 'อาวร์'],
  ['around', 'อะ-ราวนด์'], ['player', 'เพล-เยอร์'], ['square', 'สแควร์'], ['twenty', 'ทเวน-ตี้'],
  ['father', 'ฟา-เธอร์'], ['with', 'วิธ'], ['problem', 'พรอบ-เล็ม'], ['busy', 'บิซ-ซี่'],
  ['heavy', 'เฮ-วี่'], ['milk', 'มิลค์'], ['desk', 'เดสก์'], ['English', 'อิง-กลิช'],
  ['Hello, world!', 'เฮล-โล เวิลด์'], ['pad thai', 'ผัด-ไทย'], ['t-shirt', 'ที-เชิร์ต'],
  ['days', 'เดย์ส์'], ['always', 'ออล-เวย์ส์'], ['hurry', 'เฮอร์-รี่'], ['mother', 'มา-เธอร์'],
  ['Monday', 'มัน-เดย์'], ['birthday', 'เบิร์ธ-เดย์'], ['apples', 'แอป-เปิลส์'], ['stations', 'สเต-ชั่นส์'],
  ['nobody', 'โน-บอด-ดี้'], ['playing', 'เพลย์-อิง'], ['trying', 'ทราย-อิง'], ['quiet', 'ไคว-เอ็ต'],
  ['excuse', 'เอ็กซ์-คิวส์'], ['agent', 'เอ-เจ็นต์'], ['live', 'ลิฟ'], ['read', 'รีด'],
  ['tiger', 'ไท-เกอร์'], ['kitchen', 'คิท-เช็น'], ['sixteen', 'ซิกซ์-ทีน'], ['yellow', 'เยล-โลว์'],
  // ── Spelling-sensitive round ──
  // 1. reduced last syllable spelled with e
  ['ticket', 'ทิก-เก็ต'], ['wanted', 'วอน-เต็ด'], ['needed', 'นี-เด็ด'], ['chicken', 'ชิก-เก็น'],
  ['present', 'เพรซ-เซ็นต์'], ['student', 'สตู-เด็นต์'], ['moment', 'โม-เม็นต์'], ['hundred', 'ฮัน-เดร็ด'],
  ['buses', 'บัส-เซส'], ['wishes', 'วิช-เชส'], ['places', 'เพล-เซส'], ['level', 'เล-เวล'],
  ['woman', 'วุม-มัน'], ['Boston', 'บอส-ตัน'], ['budget', 'บัด-เจ็ต'], ['college', 'คอล-เลจ'],
  // 2. V never geminates
  ['seven', 'เซ-เว็น'], ['cover', 'คัฟ-เวอร์'], ['lover', 'ลัฟ-เวอร์'], ['eleven', 'อิ-เล-เว็น'], ['never', 'เน-เวอร์'], ['river', 'ริ-เวอร์'],
  // 3. no ็ before an L coda
  ['hotel', 'โฮ-เทล'], ['bell', 'เบล'], ['well', 'เวล'], ['tell', 'เทล'], ['sell', 'เซล'], ['pal', 'แพล'],
  // 4. word-final -ow
  ['know', 'โนว์'], ['show', 'โชว์'], ['low', 'โลว์'], ['slow', 'สโลว์'], ['window', 'วิน-โดว์'],
  ['tomorrow', 'ทู-มอ-โรว์'], ['no', 'โน'], ['so', 'โซ'], ['knows', 'โนว์ส์'], ['showed', 'โชว์ด'],
  // 5. -ayed / -eyed
  ['played', 'เพลย์ด'], ['stayed', 'สเตย์ด'], ['obeyed', 'โอ-เบย์ด'], ['paid', 'เพด'], ['raise', 'เรส'],
  // 6. ex- prefix
  ['expensive', 'เอ็กซ์-เพน-ซิฟ'], ['explain', 'เอ็กซ์-เพลน'], ['express', 'เอ็กซ์-เพรส'],
  ['exit', 'เอ็ก-ซิต'], ['example', 'เอ็ก-แซม-เปิล'], ['exact', 'เอ็ก-แซ็กต์'], ['exercise', 'เอ็ก-เซอร์-ไซส์'],
  // 7. flapped D is a T; the tens
  ['thirty', 'เธอร์-ตี้'], ['forty', 'ฟอร์-ตี้'], ['dirty', 'เดอร์-ตี้'], ['fifty', 'ฟิฟ-ตี้'],
  ['sixty', 'ซิกซ์-ตี้'], ['seventy', 'เซ-เวน-ตี้'], ['eighty', 'เอต-ตี้'], ['ninety', 'ไนน์-ตี้'],
  ['party', 'พาร์-ตี้'], ['sister', 'ซิส-เตอร์'], ['doctor', 'ดอก-เตอร์'], ['fifteen', 'ฟิฟ-ทีน'],
  // 8. exceptions with comments
  ['beautiful', 'บิว-ติ-ฟูล'], ['restaurant', 'เรส-เตอ-รองต์'], ['power', 'พาว-เวอร์'],
  ['tower', 'ทาว-เวอร์'], ['flower', 'ฟลาว-เวอร์'], ['shower', 'ชาว-เวอร์'],
  // 9. uniform gemination
  ['vision', 'วิช-ชั่น'],
  // ็ before a stop-initial cluster; the letter x; the syllabic -le; compounds keep aspiration
  ['exact', 'เอ็ก-แซ็กต์'], ['act', 'แอ็กต์'], ['kept', 'เค็ปต์'], ['box', 'บอกซ์'], ['six', 'ซิกซ์'],
  ['next', 'เน็กซ์ต์'], ['taxi', 'แทก-ซี่'], ['books', 'บุกส์'], ['settled', 'เซต-เติลด์'], ['levels', 'เล-เวลส์'],
  ['expert', 'เอ็กซ์-เพิร์ต'], ['sometimes', 'ซัม-ไทมส์'], ['airport', 'แอร์-พอร์ต'], ['contain', 'คัน-เทน'],
  // the dialogue cast and fixed Thai spellings (exceptions)
  ['Mr. Lee', 'มิส-เตอร์ ลี'], ['okay', 'โอ-เค'], ['OK', 'โอ-เค'], ['Emma', 'เอ็ม-ม่า'], ['Thai', 'ไท'], ['Jack', 'แจ็ค'],
  // silent -ed / -es belong to the stem; secondary stress is not a reduced syllable
  ['finished', 'ฟิน-นิชต์'], ['noticed', 'โน-ทัสต์'], ['happened', 'แฮป-เป็นด์'], ['visited', 'วิซ-ซิ-เท็ด'],
  ['minutes', 'มิน-นัตส์'], ['watches', 'วอท-เชส'], ['girlfriend', 'เกิร์ล-เฟรนด์'], ['welcome', 'เวล-คัม'],
]

let fail = 0
for (const [en, want] of TABLE) {
  const got = derive(en)
  const ok = got.reading === want
  if (!ok) fail++
  if (!ok || verbose) {
    const src = got.words.map(w => w.source).join(',')
    console.log(`  ${ok ? 'ok      ' : 'MISMATCH'} ${en.padEnd(14)} got ${got.reading.padEnd(22)} want ${want.padEnd(22)} ${got.ipa}  [${src}]`)
  }
}
console.log(`table: ${TABLE.length - fail}/${TABLE.length} match exactly${fail ? ` — ${fail} MISMATCH` : ''}\n`)

// ─── Coverage of the top 1,000 spoken words ─────────────────────────────────
const freqPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'freq', 'en-opensubtitles-top3000.txt')
const top = readFileSync(freqPath, 'utf8').split('\n')
  .filter(l => l && !l.startsWith('#'))
  .map(l => l.split(/\s+/)[0])
  .slice(0, 1000)

const missing: string[] = []
const exceptions: string[] = []
const derived: { word: string; reading: string; ipa: string }[] = []
for (const w of top) {
  const d = derive(w)
  const src = d.words[0]?.source
  if (src === 'MISSING') missing.push(w)
  else if (src === 'EXCEPTION') exceptions.push(w)
  else derived.push({ word: w, reading: d.reading, ipa: d.ipa })
}
const pct = (100 * missing.length) / top.length
console.log(`top 1,000: ${derived.length} derived · ${exceptions.length} exceptions · ${missing.length} missing (${pct.toFixed(1)}%)`)
if (missing.length) console.log(`  missing: ${missing.join(' ')}`)
if (exceptions.length) console.log(`  exceptions: ${exceptions.join(' ')}`)
const coverageOk = pct < 2

if (sampleN > 0) {
  console.log(`\n${sampleN} random derivations from the top 1,000 — read these for anything absurd:`)
  const pool = [...derived]
  for (let i = 0; i < sampleN && pool.length; i++) {
    const [pick] = pool.splice(Math.floor(Math.random() * pool.length), 1)
    console.log(`  ${pick.word.padEnd(14)} ${pick.reading.padEnd(24)} ${pick.ipa}`)
  }
}

console.log(`\n${fail === 0 && coverageOk ? 'PASS' : 'FAIL'}: ${fail} table mismatches, ${pct.toFixed(1)}% missing (limit 2%)`)
process.exit(fail === 0 && coverageOk ? 0 : 1)
