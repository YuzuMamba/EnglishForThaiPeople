import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single-file build for hosted-preview publishing: everything (JS, CSS, fonts)
// inlined into one self-contained index.html.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020',
    outDir: 'dist-artifact',
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 5000,
  },
})
