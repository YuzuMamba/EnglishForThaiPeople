-- ChaiEnglish account sync — the entire backend.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query
-- → paste → Run). It is idempotent, so re-running is safe.
--
-- One row per learner holding one JSONB snapshot. That is enough because the
-- snapshot is small (~66 KB for a completed 22-level course) and because the
-- per-record conflict resolution that actually matters happens client-side in
-- src/core/merge.ts, where it can be tested without a server. Splitting
-- progress into a row per item would add thousands of rows, a schema to
-- migrate every time content changes, and no correctness this does not have.

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  snapshot   jsonb       not null,
  device_id  text,
  updated_at timestamptz not null default now()
);

-- Row-level security is what makes the anon key safe to ship in the bundle:
-- the key only lets a request authenticate, and every statement below is
-- scoped to the authenticated user's own row. Without this, the anon key WOULD
-- be a leak.
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

-- No delete policy on purpose: nothing in the app deletes progress, so there is
-- no reason to grant a capability that could only ever destroy data. Removing
-- an account still cascades from auth.users.
