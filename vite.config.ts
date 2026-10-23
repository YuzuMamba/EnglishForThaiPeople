import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `virtual:inline-audio` is filled only by scripts/build-artifact.mts; every
// other build (dev, Pages, Netlify) resolves it to an empty map and fetches
// the real /audio files instead.
const emptyInlineAudio = {
  name: 'chaienglish:inline-audio-stub',
  enforce: 'pre' as const,
  resolveId: (id: string) => (id === 'virtual:inline-audio' ? '\0virtual:inline-audio' : null),
  load: (id: string) => (id === '\0virtual:inline-audio' ? 'export default {}' : null),
}

/**
 * When this bundle was built, stamped in at build time.
 *
 * Every "is the fix live on this device yet?" question has been answered by
 * guessing — a phone can hold a stale bundle, a deploy can quietly not have
 * happened, and the two are indistinguishable from the outside. One visible
 * timestamp settles it in a glance instead of a round-trip.
 */
const BUILT_AT = new Date().toISOString()

export default defineConfig({
  define: { __BUILT_AT__: JSON.stringify(BUILT_AT) },
  plugins: [emptyInlineAudio, react()],
  server: { port: 5173, host: true },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
  },
})
