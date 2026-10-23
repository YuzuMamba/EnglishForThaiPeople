# Connecting account sync

One-time setup, about ten minutes. Everything here is doable from a phone.

Until it is done, the app behaves exactly as it always has: the sync card does
not render, no network call is made, progress stays local. Nothing about this is
required to keep studying.

---

## 1. Create the project

1. Go to **supabase.com** → sign in → **New project**.
2. Name it anything (`chaienglish`). Pick the region closest to **you** — Supabase
   has no Thailand region, so Singapore is the nearest for South-East Asia.
   Low stakes: this syncs a ~66 KB blob a few times a day in the background, so
   a poor choice costs milliseconds nobody waits on. It cannot be changed later
   without migrating to a new project, which is the only reason to think about
   it at all.
3. It generates a database password. **You do not need it for any of this**, but
   save it anyway; it is the only copy.
4. Wait for provisioning (~2 minutes).

## 2. Create the table

Dashboard → **SQL Editor** → **New query**, then paste the SQL below and **Run**.

⚠️ Paste the **SQL itself**, not the words `supabase/schema.sql`. That is a file
path — pasting it gets you `ERROR: 42601: syntax error at or near "supabase"`.
The block is reproduced here precisely because a phone or tablet has no
convenient way to open the file.

```sql
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  snapshot   jsonb       not null,
  device_id  text,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

drop policy if exists "read own progress"   on public.progress;
drop policy if exists "insert own progress" on public.progress;
drop policy if exists "update own progress" on public.progress;

create policy "read own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "update own progress"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

You should see *Success. No rows returned*. That is correct — it creates a
table, not data.

This is the whole backend: a single table, one row per learner, plus the
row-level security policies. Re-running it later is safe. It is the same SQL as
`supabase/schema.sql`, which carries the reasoning in comments; if you ever
change one, change both.

## 3. Email confirmation — leave it ON

**Recommended: change nothing here.** Confirmation is on by default, the app
handles it, and leaving it on is both safer and simpler than the alternative.

With it on, signing up returns no session; the app says *"Check your email to
confirm the account, then sign in"* and switches to the sign-in form. You click
the link, come back, sign in. One extra round-trip, once, ever.

One setting to check so that link behaves: **Authentication → URL Configuration
→ Site URL** should be your real site (`https://your-site.netlify.app`), not the
default `http://localhost:3000`. If it is wrong the account still gets
confirmed — verification happens server-side when the link is opened — but you
land on a dead page and reasonably assume it failed.

Turning it off (**Authentication → Sign In / Providers → Email → Confirm
email**) removes that round-trip. It is a fair trade while you are the only
user, but it leaves a thing to remember: without confirmation anyone can
register against any address, including one that is not theirs. Leaving it on
means never having to remember to turn it back on.

## 4. Copy the two credentials

They live on **two different pages**. Supabase reorganised this, and the newer
layout no longer shows the URL beside the keys.

### Value 1 — Project URL

**Settings → Data API** (under *INTEGRATIONS* in the settings sidebar). The
**Project URL** is at the top:

```
https://abcdefghijklmnop.supabase.co
```

Copy it whole, including `https://`. A trailing slash is harmless — the app
strips it.

*If you cannot find that page:* **Settings → General** shows the **Project ID**
(a ~20-character string). Your URL is `https://<that-id>.supabase.co`.

→ this is `VITE_SUPABASE_URL`

### Value 2 — the public key

**Settings → API Keys**. Two tabs; either works with this app.

**Publishable and secret API keys** (the newer default) — take the
**Publishable key**, `sb_publishable_…`. The page itself says *"Publishable keys
can be safely shared publicly"*, which is exactly right: it is safe because the
row-level security policies from step 2 are doing the real work.

**Legacy anon, service_role API keys** — take **anon public**, `eyJhbGciOi…`.
Only needed as a fallback (see below).

→ this is `VITE_SUPABASE_ANON_KEY`

🚨 **Never the secret key.** On the new tab it is plainly labelled *Secret keys*
and starts `sb_secret_`, which is hard to get wrong. On the **legacy** tab it is
much easier to slip: `anon` and `service_role` are both JWTs starting `eyJ`, of
similar length, side by side, distinguishable only by their label. Pasting the
wrong one does not fail — sync works perfectly while `service_role` ignores
row-level security, so the published bundle would hand every visitor full read
and write access to every learner's data.

Because that mistake is invisible, **the app refuses it**: it checks the key and,
on a secret or `service_role` credential, disables sync and says so before making
a single request. If you see that message, replace the key, redeploy, and rotate
the exposed one in the dashboard.

**If sync returns `HTTP 401` with the publishable key**, switch to the legacy
`anon` key from the other tab. Both are supported by this app; the publishable
key is the one Supabase is moving to, so it is the better default.

## 5. Add them to Netlify

### 5a. Find the environment variables page

1. **app.netlify.com** → sign in → open the site (newer dashboards call the
   list **Projects** rather than **Sites**; same thing).
2. Top tabs: **Site configuration** (older builds: **Site settings**).
3. Left sidebar → **Environment variables**.

On a tablet the sidebar may be collapsed behind a **☰** or a *Site
configuration* dropdown at the top. If the layout hides things, Safari →
**ᴀA** in the address bar → **Request Desktop Website**.

### 5b. Add the first variable

**Add a variable** → **Add a single variable**.

- **Key**: `VITE_SUPABASE_URL` — typed exactly, `VITE_` prefix included. That
  prefix is not decoration: Vite exposes *only* `VITE_*` variables to browser
  code, so `SUPABASE_URL` would build fine and be invisible at runtime.
- **Values**: leave **Same value for all deploy contexts** selected and paste
  `https://YOUR-PROJECT.supabase.co`.
- **Scopes**, if the plan shows it: leave **All scopes**. The one that must be
  included is **Builds** — Vite reads these during `npm run build`, not when a
  visitor loads the page.
- Do **not** tick *Contains secret values*. See 5d.

**Create variable**, then repeat for `VITE_SUPABASE_ANON_KEY` with the
`sb_publishable_…` key.

Both should now be listed. Check for a trailing space or a truncated paste —
that produces an `HTTP 401` later, with nothing on screen looking wrong.

### 5c. Redeploy — not optional

**Deploys** → **Trigger deploy** ▾ → **Deploy site**.

Vite bakes environment variables into the JavaScript at build time, so the
deploy already live was built with these as empty strings. Adding them changes
nothing until a new build runs. **This is the single most common way this setup
appears not to work.** Watch for *Published*; a build is roughly a minute.

(Pushing a commit also triggers a deploy, so if you happen to push after
step 5b you can skip this.)

### 5d. If the build fails on secrets scanning

Netlify fails a build when the *value* of an environment variable appears in
the published output — a good default, and exactly backwards here. Vite inlines
`VITE_*` into the bundle on purpose, and the publishable key is meant to be
public; row-level security is what protects the data.

`netlify.toml` already declares both keys as intentionally public via
`SECRETS_SCAN_OMIT_KEYS`, so this should not happen. If a build does fail with
*"Secrets scanning found secrets in build output"*, confirm that line is
present and that the deploy is building the branch that contains it.

## 6. Check it

Open the app → **Settings**. An **☁️ Account sync** card should now be there.
If it is not, the build did not pick up the variables — go back to step 5.

Then, in this order:

1. **On the device that already has your progress**, create an account, and wait
   for *"Progress saved to your account."*
2. **On the other device**, sign in with the same details. Your progress should
   appear.

The order is a suggestion, not a requirement — the merge never loses ground, so
signing in on the empty device first would still be recovered by the next sync
from the device that has your history. Doing it this way just means you see the
right thing immediately.

---

## If something goes wrong

Every sync failure leaves local progress untouched and says so. The message
carries the real reason:

| Message | Cause |
|---|---|
| No sync card at all | Env vars missing, or the site was not redeployed (step 5) |
| `HTTP 404` on sync | The SQL from step 2 was not run |
| *"rejected this app's API key"* | The key in `VITE_SUPABASE_ANON_KEY` is wrong, truncated, or from a different project — see below |
| `Invalid login credentials` | Wrong password — or the account was never confirmed (step 3) |
| `Email not confirmed` | Confirmation is still on; check your inbox or turn it off |
| `Failed to fetch` | Offline, or the project is paused (see below) |

### A rejected API key

Supabase checks the `apikey` header at its gateway, before either the auth
service or the database sees the request. So a bad key fails *everything*
identically, before your email, your password, or the table are looked at —
which is why the app names it as a configuration problem rather than passing
`HTTP 401` along to someone who will reasonably go looking for a typo in their
password.

In order:

1. **Re-copy the key.** Settings → API Keys → **Publishable key** → copy →
   paste into Netlify → **redeploy**. A key that was copied by hand, or that
   travelled through a chat message, is very easily short by a few characters,
   and a truncated key looks completely normal in the variables list.
2. **Check it landed intact.** Expand the variable's row in Netlify and compare
   the last few characters against the dashboard. Watch for a leading or
   trailing space.
3. **Fall back to the legacy key.** Settings → API Keys → **Legacy API keys**
   tab → **anon public** (`eyJhbGciOi…`). Paste that into
   `VITE_SUPABASE_ANON_KEY` instead and redeploy. Both work with this app.
   🚨 Take `anon`, never `service_role` — they sit side by side and look alike.
4. **Confirm the URL and key are from the same project.** A key from an older
   project against a new project's URL fails exactly this way.

**Free-tier projects pause after about a week of inactivity.** Data is not lost
— the dashboard has a Resume button — but sync will fail until you resume it.
If you go quiet for a while, expect to resume the project before the next sync.

## What this does and does not protect

Sync means your progress lives somewhere other than one browser on one device.
It survives clearing site data, switching between Safari and the installed app,
losing the phone, and getting a new one.

It does not remove the need to press **Download backup** occasionally. That file
is the only copy that survives you deleting the Supabase project, and it costs
ten seconds.
