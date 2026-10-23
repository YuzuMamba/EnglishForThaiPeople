// Account sync — pull, merge, push, against a Supabase project.
//
// Deliberately dependency-free: Supabase's auth (GoTrue) and REST (PostgREST)
// surfaces are plain HTTPS, and this app needs exactly one table and one auth
// flow. `@supabase/supabase-js` is ~120 KB for that, on a bundle that is
// already 1.1 MB. Two fetch calls are cheaper to ship and easier to reason
// about when progress is the thing at stake.
//
// Design rules, in priority order:
//
//   1. NEVER LOSE LOCAL DATA. Every sync pulls the remote copy, merges it with
//      local (src/core/merge.ts), and writes the merge back to BOTH sides. A
//      failed or half-finished sync leaves local progress untouched.
//   2. OFFLINE IS NORMAL. The app must work with no network and no account,
//      exactly as it does today. Sync is additive; nothing may become a
//      prerequisite for studying.
//   3. NO SECRETS IN THE BUNDLE. The URL and anon key come from Vite env vars.
//      The anon key is *designed* to be public — every request is still
//      authorised per-user by row-level security in the database — but it is
//      configuration, not source, and must never be committed (CLAUDE.md §8).

import type { PersistedSnapshot } from './store'
import { mergeSnapshots, describeMerge, type SyncEnvelope } from './merge'

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/** Sync is only offered when the deploy was built with credentials. */
export const syncConfigured = (): boolean => Boolean(URL_BASE && ANON_KEY)

/** Decodes a JWT payload without verifying it — enough to read `role`. */
function jwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch { return null }
}

/**
 * Refuses a credential that must never reach a browser.
 *
 * Supabase's `anon` and `service_role` keys are BOTH JWTs beginning `eyJ`, of
 * similar length, shown on the same dashboard page. Nothing about them looks
 * different — only the label beside them. And pasting the wrong one does not
 * fail: sync works perfectly, while `service_role` bypasses row-level security
 * entirely, so the bundle would hand every visitor full read and write access
 * to every learner's data. A mistake that is easy to make, impossible to see,
 * and severe.
 *
 * So the app checks rather than trusting the person configuring it. Returns a
 * message to show, or null when the credentials are fine.
 */
const looksLikeKey = (v: string): boolean => /^(sb_(publishable|secret)_|eyJ)/.test(v)
const isSecretKey = (v: string): boolean =>
  v.startsWith('sb_secret_') || jwtPayload(v)?.role === 'service_role'

/**
 * The parameters exist for the test suite. `credentialProblem()` with no
 * arguments is the real call: Vite inlines the env vars at build time, so a
 * deploy has exactly one pair of values and nothing to vary at runtime.
 */
export function credentialProblem(url: string = URL_BASE, key: string = ANON_KEY): string | null {
  if (!url && !key) return null // sync simply isn't configured
  if (!url) return 'ขาด VITE_SUPABASE_URL — เพิ่มแล้ว deploy ใหม่'
  if (!key) return 'ขาด VITE_SUPABASE_ANON_KEY — เพิ่มแล้ว deploy ใหม่'

  // Checked against BOTH values: a secret key pasted into the URL slot is
  // published in the bundle just the same as one pasted into the key slot.
  if (isSecretKey(key) || isSecretKey(url)) {
    return 'This build was given the SECRET (service_role) key. That key ignores ' +
      'row-level security, so publishing it would expose every learner\'s data to ' +
      'anyone who opens the page. Sync is disabled until it is replaced with the ' +
      'anon / publishable key. Replace it in your host\'s environment variables, ' +
      'redeploy, and rotate the leaked key in the Supabase dashboard.'
  }

  // Two variables, added one after the other, holding two opaque strings — they
  // go into the wrong boxes often enough to be worth naming. Saying "this is
  // not a URL" is true but sends someone to fix the value they got right.
  if (looksLikeKey(url) || /^https?:\/\//.test(key)) {
    return 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are swapped — the URL slot ' +
      'holds the API key. Swap them in your host\'s environment variables and redeploy. ' +
      'VITE_SUPABASE_URL is https://YOUR-PROJECT.supabase.co; VITE_SUPABASE_ANON_KEY is ' +
      'the sb_publishable_… key.'
  }

  if (!/^https:\/\/[^/]+\.supabase\.(co|in)$/.test(url) && !url.startsWith('http://localhost')) {
    return `VITE_SUPABASE_URL does not look like a Supabase project URL (${url}). ` +
      'It should be https://YOUR-PROJECT.supabase.co, copied from Settings → Data API ' +
      '(without the /rest/v1/ that page appends).'
  }
  return null
}

const SESSION_KEY = 'chaienglish-session'
const DEVICE_KEY = 'chaienglish-device'

export interface Session {
  accessToken: string
  refreshToken: string
  /** Epoch ms. */
  expiresAt: number
  email: string
  userId: string
}

export type SyncState =
  | { kind: 'off' }
  | { kind: 'signed-out' }
  | { kind: 'idle'; email: string; lastSyncedAt: number | null }
  | { kind: 'syncing'; email: string }
  | { kind: 'error'; email: string | null; message: string }

// ─── Local session storage ──────────────────────────────────────────────────
// Kept in localStorage alongside progress. If storage is unavailable the app
// simply behaves as signed-out, which is the correct degradation.

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch { return null }
}

const writeJson = (key: string, v: unknown): void => {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* unavailable */ }
}

export const loadSession = (): Session | null => readJson<Session>(SESSION_KEY)
export const clearSession = (): void => {
  try { localStorage.removeItem(SESSION_KEY) } catch { /* unavailable */ }
}

/** Stable per-device id, so a sync can say which device last wrote. */
export function deviceId(): string {
  let id = readJson<string>(DEVICE_KEY)
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2, 10)}`
    writeJson(DEVICE_KEY, id)
  }
  return id
}

// ─── Auth ───────────────────────────────────────────────────────────────────

/**
 * What a 401 actually means here, and why it gets its own message.
 *
 * Supabase fronts both GoTrue and PostgREST with a gateway that checks the
 * `apikey` header FIRST. A rejected key therefore fails identically no matter
 * what was being attempted — signing up, signing in, reading, writing — and
 * fails before the email, the password, or the table are ever looked at. It is
 * the one sync error that is never about the learner and always about the
 * build's configuration.
 *
 * "HTTP 401" on a create-account form reads as "your details were rejected",
 * which sends someone hunting for a typo in a password that was never seen.
 */
const KEY_REJECTED =
  'โปรเจกต์ Supabase ปฏิเสธ API key ของแอปนี้ จึงยังไม่ได้ส่งอะไรออกไป — ไม่มีการสร้างบัญชี ' +
  'และความคืบหน้าในเครื่องนี้ยังอยู่ครบ นี่เป็นปัญหาการตั้งค่าของแอป ไม่ใช่อีเมลหรือรหัสผ่านของคุณ: ' +
  'ผู้ดูแลต้องคัดลอก publishable key จาก Settings → API Keys ใส่ VITE_SUPABASE_ANON_KEY แล้ว deploy ใหม่ ' +
  '(ถ้ายังไม่ได้ ให้ใช้ anon key จากแท็บ Legacy API keys แทน)'

/**
 * The gateway's own errors arrive as `message`; GoTrue's arrive as `msg` or
 * `error_description`. Reading only the latter is how a rejected key surfaced
 * as a bare "HTTP 401" with nothing to act on.
 */
function apiMessage(json: Record<string, unknown>, status: number): string {
  const m = json.msg ?? json.error_description ?? json.message ?? json.error
  return m ? String(m) : `HTTP ${status}`
}

/**
 * A request that never arrived, said usefully.
 *
 * `fetch` rejects with a bare TypeError when the network layer fails, and
 * every browser words it differently: Safari says "Load failed", Chrome
 * "Failed to fetch", Firefox "NetworkError when attempting to fetch resource".
 * Surfaced raw on a sign-in form, "Load failed" reads as though the account or
 * the app is broken — when in fact the request never left the device, so
 * nothing at the far end was even asked.
 *
 * The causes are few and all checkable, so name them.
 */
const OFFLINE =
  'ติดต่อเซิร์ฟเวอร์ซิงก์ไม่ได้ จึงยังไม่ได้ส่งอะไรออกไป และความคืบหน้าในเครื่องนี้ยังอยู่ครบ ' +
  'สาเหตุมีสามอย่าง: ไม่มีอินเทอร์เน็ต; โปรเจกต์ Supabase ถูกพัก (แพ็กเกจฟรีจะพักเองเมื่อไม่ได้ใช้ราวหนึ่งสัปดาห์ — ' +
  'กดเปิดใหม่จากแดชบอร์ด); หรือตัวบล็อกโฆษณา/VPN ในเครื่องนี้กันคำขอไว้ ' +
  'ทุกอย่างใช้ได้ตามปกติโดยไม่ต้องเข้าสู่ระบบ เรียนต่อไปก่อนแล้วค่อยซิงก์ทีหลังได้'

const isNetworkFailure = (e: unknown): boolean =>
  e instanceof TypeError ||
  /load failed|failed to fetch|networkerror|network request failed/i.test(
    e instanceof Error ? e.message : String(e))

/** Runs a fetch, turning a network-layer rejection into something actionable. */
async function reach(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (e) {
    if (isNetworkFailure(e)) throw new Error(OFFLINE)
    throw e
  }
}

async function authFetch(path: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await reach(`${URL_BASE}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({})) as Record<string, unknown>
  if (!res.ok) {
    if (res.status === 401) throw new Error(KEY_REJECTED)
    throw new Error(apiMessage(json, res.status))
  }
  return json
}

const toSession = (j: Record<string, unknown>): Session => {
  const user = (j.user ?? {}) as Record<string, unknown>
  return {
    accessToken: String(j.access_token ?? ''),
    refreshToken: String(j.refresh_token ?? ''),
    expiresAt: Date.now() + Number(j.expires_in ?? 3600) * 1000,
    email: String(user.email ?? ''),
    userId: String(user.id ?? ''),
  }
}

/** Create an account. Returns true when a confirmation email is required. */
export async function signUp(email: string, password: string): Promise<{ needsConfirm: boolean }> {
  const j = await authFetch('signup', { email, password })
  if (j.access_token) {
    writeJson(SESSION_KEY, toSession(j))
    return { needsConfirm: false }
  }
  // Supabase returns a user with no session when confirmations are on.
  return { needsConfirm: true }
}

export async function signIn(email: string, password: string): Promise<Session> {
  const j = await authFetch('token?grant_type=password', { email, password })
  const s = toSession(j)
  writeJson(SESSION_KEY, s)
  return s
}

/** Refresh an expired token. Returns null when the refresh itself fails. */
async function refresh(s: Session): Promise<Session | null> {
  try {
    const j = await authFetch('token?grant_type=refresh_token', { refresh_token: s.refreshToken })
    const next = { ...toSession(j), email: s.email || String(j.email ?? '') }
    writeJson(SESSION_KEY, next)
    return next
  } catch { return null }
}

/** A session guaranteed usable now, refreshing if it is close to expiry. */
async function liveSession(): Promise<Session | null> {
  const s = loadSession()
  if (!s) return null
  if (s.expiresAt - Date.now() > 60_000) return s
  return refresh(s)
}

export async function signOut(): Promise<void> {
  const s = loadSession()
  clearSession()
  if (!s) return
  // Best effort: a failed server-side revoke must not block signing out here.
  try {
    await fetch(`${URL_BASE}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${s.accessToken}` },
    })
  } catch { /* already signed out locally, which is what the user asked for */ }
}

// ─── The row ────────────────────────────────────────────────────────────────

interface RemoteRow {
  snapshot: PersistedSnapshot
  updated_at: string
  device_id: string
}

/**
 * A REST failure, said usefully.
 *
 * 401 here is ambiguous in a way the auth endpoints' 401 is not: the gateway
 * rejects a bad `apikey`, but PostgREST also returns 401 for an expired user
 * token, which is a different problem with a different fix. The gateway names
 * the key in its message, so read it rather than guessing.
 */
async function restError(res: Response, what: string): Promise<Error> {
  const text = await res.text().catch(() => '')
  let msg = ''
  try { msg = apiMessage(JSON.parse(text) as Record<string, unknown>, res.status) } catch { msg = text.slice(0, 120) }
  if (res.status === 401 && /api key/i.test(msg)) return new Error(KEY_REJECTED)
  if (res.status === 404) {
    return new Error(
      'ยังไม่มีตาราง `progress` ในโปรเจกต์ Supabase — ผู้ดูแลต้องรัน SQL จาก supabase/schema.sql ' +
      'ใน SQL Editor ก่อน ความคืบหน้าในเครื่องนี้ยังอยู่ครบ',
    )
  }
  return new Error(`${what} (HTTP ${res.status})${msg ? ` — ${msg}` : ''}`)
}

async function pull(s: Session): Promise<SyncEnvelope | null> {
  const res = await reach(
    `${URL_BASE}/rest/v1/progress?select=snapshot,updated_at,device_id&user_id=eq.${s.userId}`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${s.accessToken}` } },
  )
  if (!res.ok) throw await restError(res, 'อ่านความคืบหน้าที่บันทึกไว้ไม่ได้')
  const rows = (await res.json()) as RemoteRow[]
  if (!rows.length) return null
  const r = rows[0]
  return {
    snapshot: r.snapshot,
    updatedAt: Date.parse(r.updated_at) || 0,
    deviceId: r.device_id ?? '',
  }
}

async function push(s: Session, snapshot: PersistedSnapshot): Promise<void> {
  const res = await reach(`${URL_BASE}/rest/v1/progress`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${s.accessToken}`,
      'Content-Type': 'application/json',
      // One row per user; upsert so the first sync creates it.
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: s.userId,
      snapshot,
      device_id: deviceId(),
      updated_at: new Date().toISOString(),
    }),
  })
  if (!res.ok) throw await restError(res, 'บันทึกลงบัญชีไม่ได้')
}

export interface SyncResult {
  merged: PersistedSnapshot
  gained: number
  advanced: number
  /** True when the account had no row yet — the first sync from this device. */
  firstPush: boolean
}

/**
 * One full sync cycle: pull, merge, push the merge back.
 *
 * The merge is written to BOTH sides, so after a successful sync every device
 * that has synced holds the same superset. Throwing leaves local untouched —
 * the caller keeps its snapshot and simply reports the failure.
 */
export async function syncNow(local: PersistedSnapshot): Promise<SyncResult> {
  const s = await liveSession()
  if (!s) throw new Error('ยังไม่ได้เข้าสู่ระบบ')

  const remote = await pull(s)
  const localEnv: SyncEnvelope = { snapshot: local, updatedAt: Date.now(), deviceId: deviceId() }
  const merged = remote ? mergeSnapshots(localEnv, remote) : local
  const { gained, advanced } = describeMerge(local, merged)

  await push(s, merged)
  return { merged, gained, advanced, firstPush: remote === null }
}
