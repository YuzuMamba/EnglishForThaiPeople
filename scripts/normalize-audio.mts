// Level-match the audio corpus so every clip speaks at the same volume.
//
// Google TTS does not level-match its output. Measured on ChaiThai's corpus
// (2026-09-25, same voices, same API), item clips spanned -25.6 to -11.6 dBFS
// of speech level — a 14 dB gap, about "half as loud" twice over — and the
// quiet end was day-one vocabulary, all cut by the four quietest voices on the
// panel. In a review session those play next to a clip 10 dB louder and are
// heard as whispers, although every one of them passes the silence check. The
// silence check catches a broken clip; this catches a quiet one.
//
// Method: measure the speech level (active-frame RMS, see audio-probe.ts),
// apply a plain gain to reach LEVEL_TARGET, cap the gain so the peak stays
// under 0.95, re-encode. Plain gain, not compression: the clip's own dynamics
// are untouched, so tones are untouched. Clips already within 1 dB are left
// alone, so re-runs re-encode nothing (lossy generations do not stack), and
// the manifest never changes — a clip keeps its filename and its voice.
//
// Clips below MIN_PEAK are skipped, not boosted: a whisper boosted 30 dB is a
// loud hiss that would then pass the audit. Those belong to audit-audio's
// drop-and-re-cut path, which runs first in the workflow.
//
//   npx tsx scripts/normalize-audio.mts          # apply
//   npx tsx scripts/normalize-audio.mts --dry    # report what would change

import { execFile } from 'node:child_process'
import { readFileSync, renameSync, unlinkSync, existsSync } from 'node:fs'
import { promisify } from 'node:util'
import { FFMPEG, LEVEL_TARGET, MIN_PEAK, OUT, probe, requireFfmpeg } from './audio-probe.ts'

const run = promisify(execFile)
const DRY = process.argv.includes('--dry')
/** Leave a clip alone when it is already this close. */
const SKIP_WITHIN_DB = 1.0
/** Peak ceiling after gain, linear. */
const PEAK_CEIL = 0.95
/** Source clips are 32 kb/s mono 24 kHz; a second lossy generation at a
 *  higher rate keeps what the first one left. */
const ENCODE = ['-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k']
const PARALLEL = 4

requireFfmpeg()

const manifest: Record<string, string> = JSON.parse(readFileSync(`${OUT}/manifest.json`, 'utf8'))
const entries = Object.entries(manifest)

interface Job { key: string; file: string; before: number; gain: number; capped: boolean }
const jobs: Job[] = []
const skippedQuiet: string[] = []
let dead = 0, inTol = 0
const levels: number[] = []

for (const [key, file] of entries) {
  const p = probe(file)
  if (!p) { dead++; continue }
  levels.push(p.levelDb)
  if (p.peak < MIN_PEAK) { skippedQuiet.push(key); continue }
  let gain = LEVEL_TARGET - p.levelDb
  if (Math.abs(gain) <= SKIP_WITHIN_DB) { inTol++; continue }
  const maxGain = 20 * Math.log10(PEAK_CEIL / p.peak)
  const capped = gain > maxGain
  if (capped) gain = maxGain
  // A capped clip takes whatever lift its peak allows, even a small one: it
  // is outside tolerance and this is all gain can do for it. Below a quarter
  // of a decibel the re-encode is not worth the generation.
  if (capped ? gain < 0.25 : Math.abs(gain) <= SKIP_WITHIN_DB) { inTol++; continue }
  jobs.push({ key, file, before: p.levelDb, gain, capped })
}

const sorted = [...levels].sort((a, b) => a - b)
const at = (q: number): number => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0
console.log(`${entries.length} clips: level p05 ${at(0.05).toFixed(1)}  median ${at(0.5).toFixed(1)}  p95 ${at(0.95).toFixed(1)} dBFS (target ${LEVEL_TARGET})`)
console.log(`${jobs.length} to adjust · ${inTol} within ${SKIP_WITHIN_DB} dB · ${skippedQuiet.length} inaudible (left for audit-audio) · ${dead} would not decode`)
if (jobs.length > 0) {
  const gains = jobs.map(j => j.gain).sort((a, b) => a - b)
  console.log(`gain range ${gains[0].toFixed(1)} … ${gains[gains.length - 1].toFixed(1)} dB · ${jobs.filter(j => j.capped).length} capped by the peak ceiling`)
  const worst = [...jobs].sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain)).slice(0, 12)
  for (const j of worst) console.log(`  ${j.key.padEnd(24)} ${j.before.toFixed(1).padStart(6)} dBFS  ${j.gain >= 0 ? '+' : ''}${j.gain.toFixed(1)} dB${j.capped ? ' (capped)' : ''}`)
}
if (skippedQuiet.length > 0) console.log(`inaudible, not boosted: ${skippedQuiet.join(' ')}`)

if (DRY || jobs.length === 0) process.exit(0)

let done = 0, failed = 0
async function worker(queue: Job[]): Promise<void> {
  for (;;) {
    const j = queue.shift()
    if (!j) return
    const src = `${OUT}/${j.file}`
    const tmp = `${src}.norm.tmp.mp3`
    try {
      await run(FFMPEG, ['-v', 'error', '-y', '-i', src, '-af', `volume=${j.gain.toFixed(2)}dB`, ...ENCODE, tmp])
      const check = probe(`${j.file}.norm.tmp.mp3`)
      if (!check || check.peak < MIN_PEAK) throw new Error('re-encode came back unreadable')
      renameSync(tmp, src)
      done++
    } catch (e) {
      failed++
      console.error(`  FAIL ${j.key}: ${e instanceof Error ? e.message : e}`)
      if (existsSync(tmp)) unlinkSync(tmp)
    }
    if ((done + failed) % 400 === 0) console.log(`  ${done + failed}/${jobs.length}…`)
  }
}
const queue = [...jobs]
await Promise.all(Array.from({ length: PARALLEL }, () => worker(queue)))
console.log(`\nNormalized ${done} clip(s) to ${LEVEL_TARGET} dBFS; ${failed} failed.`)
process.exit(failed > 0 ? 1 : 0)
