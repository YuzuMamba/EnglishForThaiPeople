/// <reference types="vite/client" />

declare module 'virtual:inline-audio' {
  /** clipKey → data: URI. Empty outside the artifact build. */
  const clips: Record<string, string>
  export default clips
}

interface ImportMetaEnv {
  /** Supabase project URL. Absent = sync is not offered (see src/core/sync.ts). */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon key — publishable; row-level security does the real work. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** ISO timestamp of when this bundle was built. Injected by vite.config.ts. */
declare const __BUILT_AT__: string
