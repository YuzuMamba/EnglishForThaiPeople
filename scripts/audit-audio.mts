// Listen to the audio corpus the way a learner does — by amplitude, not by
// file size.
//
// Google's TTS sporadically returns a valid MP3 that is barely audible: right
// duration-ish, correct headers, decodes fine, and about fifty times too quiet.
// It is not silence, so a silence check misses it. It is not always small, so
// the file-size fingerprint in CLAUDE.md §7 misses it too — and worse, size
// flags plenty of clips that are simply short words, so the signal drowns.
//
// Decoding settles it. Across the 2,396 clips of ChaiThai's corpus (the same
// voices, the same API) the clips separated cleanly: healthy ones peaked at
// 0.46–0.97 (5th percentile 0.499), broken ones at 0.006–0.019. There is
// nothing in between, so the threshold is not a judgement call.
//
// It also reports the SPEECH LEVEL of every clip (active-frame RMS), because
// a clip that passes the silence check can still be 10 dB quieter than its
// neighbours and be heard as a whisper — see normalize-audio.mts.
//
//   npx tsx scripts/audit-audio.mts            # report
//   npx tsx scripts/audit-audio.mts --recut    # ALSO drop the bad ones from
//                                              # the manifest so the next
//                                              # generate-audio run remakes them
//
// Needs ffmpeg on PATH. GitHub's ubuntu-latest runners do NOT ship it — the
// workflow apt-installs it before synthesizing. Set FFMPEG to point at one
// elsewhere.

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { LEVEL_TARGET, LEVEL_TOL, MIN_PEAK, OUT, probe, requireFfmpeg, type Probe } from './audio-probe.ts'

const MANIFEST_PATH = `${OUT}/manifest.json`
const VOICE_LOG_PATH = `${OUT}/voices.json`
const SHUN_PATH = `${OUT}/shunned.json`

const RECUT = process.argv.includes('--recut')

requireFfmpeg()

const manifest: Record<string, string> = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
const voiceLog: Record<string, string> =
  existsSync(VOICE_LOG_PATH) ? JSON.parse(readFileSync(VOICE_LOG_PATH, 'utf8')) : {}

const keys = Object.keys(manifest)
const bad: { key: string; p: Probe }[] = []
const audible: { key: string; p: Probe }[] = []
const dead: string[] = []
const peaks: number[] = []
const levels: number[] = []

let done = 0
for (const key of keys) {
  const p = probe(manifest[key])
  if (!p) { dead.push(key); continue }
  peaks.push(p.peak)
  if (p.peak < MIN_PEAK) bad.push({ key, p })
  else { audible.push({ key, p }); levels.push(p.levelDb) }
  if (++done % 400 === 0) console.log(`  ${done}/${keys.length} decoded…`)
}

peaks.sort((a, b) => a - b)
const at = (q: number): number => peaks[Math.floor(peaks.length * q)] ?? 0
console.log(`\n${peaks.length} clips decoded.`)
console.log(`peak amplitude — min ${at(0).toFixed(4)}  p05 ${at(0.05).toFixed(3)}  median ${at(0.5).toFixed(3)}`)
const lv = [...levels].sort((a, b) => a - b)
const lat = (q: number): number => lv[Math.min(lv.length - 1, Math.floor(lv.length * q))] ?? 0
console.log(`speech level — p05 ${lat(0.05).toFixed(1)}  median ${lat(0.5).toFixed(1)}  p95 ${lat(0.95).toFixed(1)} dBFS (target ${LEVEL_TARGET} ± ${LEVEL_TOL})`)
// A quiet clip whose peak is already near full scale cannot be raised by
// plain gain without clipping — its dynamics are wide, not its level low.
// Those are reported separately: the normaliser has done what gain can do.
// Half a decibel of margin: a re-encode shifts peak and level a little, so a
// clip that gain can only just lift over the line is not worth another pass.
const reachable = (p: Probe): number => p.levelDb + 20 * Math.log10(0.95 / p.peak)
const floor = LEVEL_TARGET - LEVEL_TOL
const quiet = audible.filter(c => c.p.levelDb < floor).sort((a, b) => a.p.levelDb - b.p.levelDb)
const fixable = quiet.filter(c => reachable(c.p) >= floor + 0.5)
const peakLimited = quiet.filter(c => reachable(c.p) < floor + 0.5)
const loud = audible.filter(c => c.p.levelDb > LEVEL_TARGET + LEVEL_TOL).sort((a, b) => b.p.levelDb - a.p.levelDb)
if (fixable.length + loud.length === 0) {
  console.log(`✓ Every clip is level-matched${peakLimited.length ? ` (${peakLimited.length} sit ${LEVEL_TOL}–${(LEVEL_TARGET - Math.min(...peakLimited.map(c => c.p.levelDb))).toFixed(0)} dB under target because their peak is already near full scale — gain cannot lift them further without clipping)` : ''}.`)
} else {
  console.log(`${fixable.length} quiet / ${loud.length} loud clip(s) outside ±${LEVEL_TOL} dB — heard as a whisper or a shout next to the rest; normalize-audio.mts fixes these without re-cutting:`)
  for (const { key, p } of [...fixable.slice(0, 15), ...loud.slice(0, 5)]) {
    console.log(`  ${key.padEnd(24)} ${p.levelDb.toFixed(1).padStart(6)} dBFS  ${p.seconds.toFixed(2)}s  ${(voiceLog[key] ?? '?').split('-').pop()}`)
  }
  if (peakLimited.length > 0) console.log(`  (+${peakLimited.length} quiet but peak-limited — gain cannot lift them without clipping)`)
}

if (dead.length > 0) {
  console.log(`\n${dead.length} clip(s) would not decode at all:`)
  for (const k of dead) console.log(`  ${k}`)
}

if (bad.length === 0) {
  console.log('\n✓ Every clip is audible.')
} else {
  console.log(`\n${bad.length} clip(s) below peak ${MIN_PEAK} — audible as a whisper, if at all:`)
  for (const { key, p } of bad.sort((a, b) => a.p.peak - b.p.peak)) {
    console.log(`  ${key.padEnd(24)} peak ${p.peak.toFixed(4)}  ${p.seconds.toFixed(2)}s  ${(voiceLog[key] ?? '?').split('-').pop()}`)
  }
}

if (RECUT && bad.length > 0) {
  // Drop them from the manifest AND the voice log, then delete the files. The
  // generator caches on voices.json, so removing the entry is what makes the
  // next run treat it as missing rather than current.
  //
  // Also SHUN the voice that whispered, per utterance. The failure repeats for
  // some short words — the same voice returned the same whisper for the same
  // one-syllable word on two consecutive cuts — so a retry with the same
  // speaker is a retry that cannot succeed. The generator reads shunned.json
  // and picks another voice for that word (and its slow variant) instead.
  const shunned: Record<string, string[]> =
    existsSync(SHUN_PATH) ? JSON.parse(readFileSync(SHUN_PATH, 'utf8')) : {}
  let newlyShunned = 0
  for (const { key } of bad) {
    const file = manifest[key]
    try { if (file && existsSync(`${OUT}/${file}`)) unlinkSync(`${OUT}/${file}`) } catch { /* already gone */ }
    const voice = voiceLog[key]
    if (voice) {
      const base = key.replace(/^slow:/, '')
      const list = shunned[base] ?? (shunned[base] = [])
      if (!list.includes(voice)) { list.push(voice); newlyShunned++ }
    }
    delete manifest[key]
    delete voiceLog[key]
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest))
  writeFileSync(VOICE_LOG_PATH, JSON.stringify(voiceLog))
  writeFileSync(SHUN_PATH, JSON.stringify(shunned))
  console.log(`\nDropped ${bad.length} clip(s) and shunned ${newlyShunned} voice/word pairing(s). Run generate-audio to re-cut them.`)
}

// A report is informational; --recut has done its job and should not fail the
// build, or the workflow step after it never runs.
process.exit(0)
