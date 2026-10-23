// Single-file artifact build WITH native audio inlined as data URIs.
//
// The artifact viewer serves one self-contained HTML file and its CSP blocks
// external hosts, so /audio/*.mp3 is unreachable there and speech silently
// degrades to the browser's English voice. But the corpus is already generated
// and committed — the problem is hosting, not synthesis — and the clips that
// actually matter are a small slice of it: item words, phonics example words
// and drills, examples, and dialogue lines. The rest is Sentence Builder's
// combinatorial pattern output, which is far too large to inline and degrades
// gracefully to TTS.
//
// Usage: npx tsx scripts/build-artifact.mts
import { build, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync, statSync } from 'node:fs'
import { ITEMS, SCRIPT_LESSONS, LISTENING } from '../src/data/index.ts'

const AUDIO_DIR = 'public/audio'
/** Leaves headroom under the 16MB artifact ceiling for the ~1.5MB app. */
const BUDGET_BYTES = 11 * 1024 * 1024

/**
 * Manifest key for a clip. Re-implemented here, identically, rather than
 * imported: src/core/audio.ts pulls in `virtual:inline-audio` and the browser
 * speech APIs, which this build script cannot load. Must stay byte-for-byte the
 * rule in audio.ts (`clipKey`) and scripts/generate-audio.mts (`keyOf`):
 * lower-cased, letters/digits/apostrophes only.
 */
const clipKey = (t: string): string => t.toLowerCase().replace(/[^a-z0-9']/g, '')

/** Priority order: what a learner meets most, first. Anything that doesn't fit
 *  the budget falls back to browser TTS rather than breaking. */
function priorityKeys(): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (t: string): void => {
    // A `/` choice (a/an) is spoken as its first form — same as audio.ts.
    const k = clipKey(t.includes('/') ? t.split('/')[0] : t)
    if (k && !seen.has(k)) { seen.add(k); out.push(k) }
  }
  for (const it of Object.values(ITEMS)) add(it.audioHint ?? it.en)
  for (const l of SCRIPT_LESSONS) for (const c of l.chars) add(c.word)
  for (const l of SCRIPT_LESSONS) for (const d of l.drills) add(d.en)
  for (const it of Object.values(ITEMS)) for (const ex of it.examples ?? []) add(ex.en)
  for (const x of LISTENING) for (const line of x.lines) add(line.en)
  return out
}

function buildInlineMap(): { map: Record<string, string>; bytes: number; skipped: number } {
  const manifest: Record<string, string> = JSON.parse(
    readFileSync(`${AUDIO_DIR}/manifest.json`, 'utf8'),
  )
  const map: Record<string, string> = {}
  let bytes = 0
  let skipped = 0
  for (const key of priorityKeys()) {
    const file = manifest[key]
    if (!file) { skipped++; continue }
    let size: number
    try { size = statSync(`${AUDIO_DIR}/${file}`).size } catch { skipped++; continue }
    // base64 inflates ~4/3, plus the data: prefix.
    if (bytes + size * 1.37 > BUDGET_BYTES) { skipped++; continue }
    bytes += size * 1.37
    map[key] = `data:audio/mpeg;base64,${readFileSync(`${AUDIO_DIR}/${file}`).toString('base64')}`
  }
  return { map, bytes, skipped }
}

const VIRTUAL = 'virtual:inline-audio'
const RESOLVED = `\0${VIRTUAL}`

function inlineAudioPlugin(map: Record<string, string>): Plugin {
  return {
    name: 'chaienglish:inline-audio',
    enforce: 'pre',
    resolveId: id => (id === VIRTUAL ? RESOLVED : null),
    load: id => (id === RESOLVED ? `export default ${JSON.stringify(map)}` : null),
  }
}

const { map, bytes, skipped } = buildInlineMap()
console.log(
  `inlining ${Object.keys(map).length} clips (${(bytes / 1048576).toFixed(1)}MB base64), ` +
  `${skipped} left to browser TTS`,
)

await build({
  configFile: false,
  plugins: [inlineAudioPlugin(map), react(), viteSingleFile()],
  build: {
    target: 'es2020',
    outDir: 'dist-artifact',
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 30_000,
  },
})
