// Shared measurement for the audio corpus: decode a clip with ffmpeg and
// report what a learner would hear. Used by audit-audio.mts (report / drop
// inaudible clips) and normalize-audio.mts (level-match the corpus).

import { execFileSync } from 'node:child_process'

export const OUT = 'public/audio'
export const FFMPEG = process.env.FFMPEG ?? 'ffmpeg'

/** Below this peak a clip is inaudible in practice — Google's sporadic
 *  whisper failure. Healthy clips peak at 0.24–1.0, broken ones at
 *  0.006–0.019; there is nothing in between. */
export const MIN_PEAK = 0.05

/**
 * Target speech level, dBFS, RMS over active frames. The corpus median before
 * level-matching was -17; the ear tolerates about ±3 dB before one clip reads
 * as "quiet" next to another.
 */
export const LEVEL_TARGET = -17
export const LEVEL_TOL = 3

const SR = 16000
const FRAME = 320 // 20 ms

export interface Probe {
  /** Highest absolute sample, 0–1. */
  peak: number
  /** Whole-clip RMS, 0–1 (silence included; legacy figure). */
  rms: number
  seconds: number
  /**
   * Speech level: RMS in dBFS over the ACTIVE frames only (20 ms frames above
   * -45 dBFS), so leading and trailing silence do not drag the figure down and
   * a short word measures the same as a long one. This is what the ear tracks
   * as "how loud is this voice" — not the peak, which a single click can set.
   */
  levelDb: number
  /** Seconds of active speech. */
  activeSeconds: number
}

export function requireFfmpeg(): void {
  try {
    execFileSync(FFMPEG, ['-version'], { stdio: 'ignore' })
  } catch {
    console.error(`Could not run "${FFMPEG}". Install ffmpeg, or set FFMPEG to a binary.`)
    process.exit(1)
  }
}

/** Decode to raw mono 16-bit and measure. Returns null if it will not decode. */
export function probe(file: string): Probe | null {
  let raw: Buffer
  try {
    raw = execFileSync(
      FFMPEG,
      ['-v', 'error', '-i', `${OUT}/${file}`, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'],
      { maxBuffer: 64 * 1024 * 1024 },
    )
  } catch { return null }
  const n = Math.floor(raw.length / 2)
  if (n === 0) return null
  let peak = 0, sumSq = 0
  const x = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const v = raw.readInt16LE(i * 2) / 32768
    x[i] = v
    const a = Math.abs(v)
    if (a > peak) peak = a
    sumSq += v * v
  }
  let activeSq = 0, activeN = 0
  for (let f = 0; f + FRAME <= n; f += FRAME) {
    let s = 0
    for (let i = f; i < f + FRAME; i++) s += x[i] * x[i]
    if (10 * Math.log10(s / FRAME + 1e-12) > -45) { activeSq += s; activeN += FRAME }
  }
  return {
    peak,
    rms: Math.sqrt(sumSq / n),
    seconds: n / SR,
    levelDb: activeN > 0 ? 10 * Math.log10(activeSq / activeN) : -99,
    activeSeconds: activeN / SR,
  }
}
