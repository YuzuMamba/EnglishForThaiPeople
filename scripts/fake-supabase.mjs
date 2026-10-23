// A tiny stand-in for Supabase, used by verify-sync-live.mjs.
//
// Network egress is restricted in this environment and a real project needs
// the owner's credentials, so the HTTP layer of src/core/sync.ts would
// otherwise ship untested — auth flow, header shapes, upsert semantics, error
// paths. This implements just enough of GoTrue and PostgREST to exercise all
// of it for real: real fetch, real JSON, real status codes.
//
// It is a TEST DOUBLE, not a server. No security, no persistence, no
// concurrency. It deliberately mirrors the row-level-security *shape* — every
// request is scoped to the bearer token's user — so a bug where the client
// forgets to scope a query shows up here as cross-user data, loudly.
import { createServer } from 'node:http'

const users = new Map()    // email -> { id, password }
const tokens = new Map()   // accessToken -> userId
const rows = new Map()     // userId -> { snapshot, updated_at, device_id }

// Supabase fronts GoTrue and PostgREST with a gateway that validates the
// `apikey` header before either service sees the request. When it refuses, every
// endpoint fails identically — 401, `{"message":"Invalid API key"}` — whatever
// was being attempted. Flipping this reproduces a misconfigured deploy, which is
// the failure a real learner is most likely to hit and the one the app has to
// explain rather than relay as "HTTP 401".
let gatewayRejects = false

let seq = 0
const uid = () => `user-${++seq}`
const mkToken = () => `tok-${++seq}-${Math.random().toString(36).slice(2)}`

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

const readBody = req => new Promise(resolve => {
  let s = ''
  req.on('data', c => { s += c })
  req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}) } catch { resolve({}) } })
})

const bearer = req => {
  const h = req.headers.authorization ?? ''
  return tokens.get(h.replace(/^Bearer /, '')) ?? null
}

export function startFakeSupabase(port = 54321) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
      })
      return res.end()
    }

    // The gateway runs before everything, including auth.
    if (gatewayRejects) return json(res, 401, { message: 'Invalid API key' })

    // ── GoTrue ──────────────────────────────────────────────────────────────
    if (url.pathname === '/auth/v1/signup') {
      const { email, password } = await readBody(req)
      if (users.has(email)) return json(res, 400, { msg: 'User already registered' })
      const id = uid()
      users.set(email, { id, password })
      const access_token = mkToken()
      tokens.set(access_token, id)
      return json(res, 200, {
        access_token, refresh_token: mkToken(), expires_in: 3600, user: { id, email },
      })
    }

    if (url.pathname === '/auth/v1/token') {
      const grant = url.searchParams.get('grant_type')
      const body = await readBody(req)
      if (grant === 'password') {
        const u = users.get(body.email)
        if (!u || u.password !== body.password) {
          return json(res, 400, { error_description: 'Invalid login credentials' })
        }
        const access_token = mkToken()
        tokens.set(access_token, u.id)
        return json(res, 200, {
          access_token, refresh_token: mkToken(), expires_in: 3600,
          user: { id: u.id, email: body.email },
        })
      }
      if (grant === 'refresh_token') {
        const access_token = mkToken()
        // The double has no refresh-token table; any refresh mints a token for
        // the most recent user, which is enough to exercise the client path.
        tokens.set(access_token, [...users.values()].at(-1)?.id ?? uid())
        return json(res, 200, { access_token, refresh_token: mkToken(), expires_in: 3600, user: {} })
      }
      return json(res, 400, { msg: 'unsupported grant' })
    }

    if (url.pathname === '/auth/v1/logout') {
      const h = (req.headers.authorization ?? '').replace(/^Bearer /, '')
      tokens.delete(h)
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*' })
      return res.end()
    }

    // ── PostgREST ───────────────────────────────────────────────────────────
    if (url.pathname === '/rest/v1/progress') {
      const userId = bearer(req)
      if (!userId) return json(res, 401, { message: 'JWT expired or missing' })

      if (req.method === 'GET') {
        // Mirrors RLS: only ever the caller's own row, whatever was asked for.
        const row = rows.get(userId)
        return json(res, 200, row ? [{ ...row, user_id: userId }] : [])
      }
      if (req.method === 'POST') {
        const body = await readBody(req)
        if (body.user_id !== userId) {
          // What RLS would do to a client that scoped its write wrongly.
          return json(res, 403, { message: 'new row violates row-level security policy' })
        }
        rows.set(userId, {
          snapshot: body.snapshot,
          updated_at: body.updated_at ?? new Date().toISOString(),
          device_id: body.device_id ?? '',
        })
        res.writeHead(201, { 'Access-Control-Allow-Origin': '*' })
        return res.end()
      }
    }

    return json(res, 404, { message: 'not found' })
  })

  return new Promise(resolve => {
    server.listen(port, () => resolve({
      url: `http://localhost:${port}`,
      close: () => new Promise(r => server.close(r)),
      reset: () => { users.clear(); tokens.clear(); rows.clear() },
      rowCount: () => rows.size,
      /** Simulate a deploy built with a key the project refuses. */
      setGatewayRejects: v => { gatewayRejects = v },
    }))
  })
}
