// Generates the PWA icon set, from code, with no image dependency.
//
// Why this exists: installing ChaiEnglish to the iOS Home Screen is currently the
// only thing that protects a learner's progress from Safari's 7-day eviction of
// script-writable storage (see ROADMAP P1 #4). Installing needs a manifest, and
// a manifest needs real icons — without them iOS falls back to a screenshot of
// the page, which looks broken on the home screen.
//
// Rendered at 4× and box-downsampled, so edges are properly anti-aliased.
//
//   npx tsx scripts/make-icons.mts
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

// ─── Minimal PNG encoder (RGBA, 8-bit, no interlace) ────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

const crc32 = (buf: Uint8Array): number => {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

function encodePng(w: number, h: number, rgba: Uint8Array): Uint8Array {
  const ihdr = new Uint8Array(13)
  const dv = new DataView(ihdr.buffer)
  dv.setUint32(0, w); dv.setUint32(4, h)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  // Filter byte 0 (None) in front of every scanline.
  const raw = new Uint8Array(h * (1 + w * 4))
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0
    raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * (1 + w * 4) + 1)
  }

  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', new Uint8Array(deflateSync(raw, { level: 9 }))),
    chunk('IEND', new Uint8Array(0)),
  ]
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let at = 0
  for (const p of parts) { out.set(p, at); at += p.length }
  return out
}

// ─── The mark ───────────────────────────────────────────────────────────────
// A sprout on deep navy: the app already speaks in Seedling / Rooted / Blooming
// stages and shows an SRS garden on Home, so the seedling is the house image.

type RGB = [number, number, number]
const mix = (a: RGB, b: RGB, t: number): RGB =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

const NAVY_TOP: RGB = [18, 34, 56]
const NAVY_BOT: RGB = [9, 18, 32]
const GOLD: RGB = [242, 189, 92]
const LEAF: RGB = [96, 198, 143]
const LEAF_DEEP: RGB = [58, 158, 108]

/** Standard rounded-box signed distance; negative inside, in pixels. */
function roundedBoxSdf(x: number, y: number, s: number, r: number): number {
  const qx = Math.abs(x - s / 2) - (s / 2 - r)
  const qy = Math.abs(y - s / 2) - (s / 2 - r)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
}

/** Point-in-ellipse, rotated by `rot` about (cx, cy). */
function inEllipse(
  x: number, y: number, cx: number, cy: number, rx: number, ry: number, rot: number,
): boolean {
  const c = Math.cos(-rot), s = Math.sin(-rot)
  const dx = x - cx, dy = y - cy
  const u = dx * c - dy * s, v = dx * s + dy * c
  return (u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1
}

/** Renders one pixel of the mark at unit scale (0..1 across the icon). */
function shade(px: number, py: number, S: number): [RGB, number] {
  if (roundedBoxSdf(px, py, S, S * 0.235) > 0) return [[0, 0, 0], 0]

  const bg = mix(NAVY_TOP, NAVY_BOT, py / S)

  const u = px / S, v = py / S // unit coords

  // Two leaves, angled out from the stem. Drawn before the stem so the stem
  // reads as passing in front of them.
  if (inEllipse(u, v, 0.352, 0.470, 0.147, 0.073, -0.60)) {
    return [mix(LEAF, LEAF_DEEP, (u - 0.21) / 0.30), 1]
  }
  if (inEllipse(u, v, 0.648, 0.470, 0.147, 0.073, 0.60)) {
    return [mix(LEAF_DEEP, LEAF, (u - 0.50) / 0.30), 1]
  }

  // Stem: a capsule with rounded caps, so it neither floats nor ends in a cut.
  // Distance is measured to the polyline SEGMENTS, not to the sample points —
  // point-distance scallops the outline into visible bumps.
  if (u > 0.38 && u < 0.62 && v > 0.28 && v < 0.80) {
    const R = 0.030
    const N = 20
    const at = (t: number): [number, number] =>
      [0.5 + 0.028 * Math.sin(t * 2.1), 0.350 + t * (0.715 - 0.350)]
    let best = Infinity
    let [px0, py0] = at(0)
    for (let i = 1; i <= N; i++) {
      const [px1, py1] = at(i / N)
      const ex = px1 - px0, ey = py1 - py0
      const len2 = ex * ex + ey * ey
      const t = Math.max(0, Math.min(1, ((u - px0) * ex + (v - py0) * ey) / len2))
      best = Math.min(best, Math.hypot(u - (px0 + t * ex), v - (py0 + t * ey)))
      px0 = px1; py0 = py1
    }
    if (best <= R) {
      const t = Math.min(1, Math.max(0, (v - 0.350) / 0.365))
      return [mix(LEAF, LEAF_DEEP, t), 1]
    }
  }

  // The seed: a warm dot cresting the sprout, echoing the gold XP accent. It
  // overlaps the stem top by a hair so the two read as one shape.
  if (Math.hypot(u - 0.5, v - 0.292) < 0.077) return [GOLD, 1]

  return [bg, 1]
}

/** Renders at `scale`× then box-downsamples for anti-aliasing. */
function render(size: number, scale = 4): Uint8Array {
  const S = size * scale
  const big = new Float32Array(S * S * 4)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const [rgb, a] = shade(x + 0.5, y + 0.5, S)
      const i = (y * S + x) * 4
      big[i] = rgb[0]; big[i + 1] = rgb[1]; big[i + 2] = rgb[2]; big[i + 3] = a * 255
    }
  }
  const out = new Uint8Array(size * size * 4)
  const n = scale * scale
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = ((y * scale + dy) * S + (x * scale + dx)) * 4
          r += big[i]; g += big[i + 1]; b += big[i + 2]; a += big[i + 3]
        }
      }
      const o = (y * size + x) * 4
      out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n)
      out[o + 2] = Math.round(b / n); out[o + 3] = Math.round(a / n)
    }
  }
  return out
}

/** iOS ignores transparency and squares the corners itself, so its icon is
 *  rendered edge-to-edge with no rounding. */
function renderOpaque(size: number, scale = 4): Uint8Array {
  const rgba = render(size, scale)
  const S = size * scale
  void S
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 255) {
      const t = rgba[i + 3] / 255
      const bg = mix(NAVY_TOP, NAVY_BOT, ((i / 4 / size) | 0) / size)
      rgba[i] = Math.round(rgba[i] * t + bg[0] * (1 - t))
      rgba[i + 1] = Math.round(rgba[i + 1] * t + bg[1] * (1 - t))
      rgba[i + 2] = Math.round(rgba[i + 2] * t + bg[2] * (1 - t))
      rgba[i + 3] = 255
    }
  }
  return rgba
}

for (const [file, size, opaque] of [
  ['public/icon-192.png', 192, false],
  ['public/icon-512.png', 512, false],
  ['public/apple-touch-icon.png', 180, true],
] as const) {
  const rgba = opaque ? renderOpaque(size) : render(size)
  const png = encodePng(size, size, rgba)
  writeFileSync(file, png)
  console.log(`${file.padEnd(30)} ${size}×${size}  ${(png.length / 1024).toFixed(1)} KB`)
}
