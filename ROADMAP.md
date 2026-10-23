# ChaiEnglish — Roadmap

Created 2026-10-23 as the mirror of ChaiThai. Dates are when something was last verified.

## Where it stands

- Engine ported from ChaiThai with the direction reversed (English target, Thai native), Thai UI, a 12-lesson phonics course in place of the Thai script course, a Sounds reference in place of Tone Rules, and a CMUdict-based reading deriver in place of the Paiboon deriver.
- Content: see the live counts (`CLAUDE.md` §2). Levels are authored from `CURRICULUM.md` in waves; a level with no items is skipped by the app.
- Audio: not yet generated (needs `GOOGLE_TTS_API_KEY`); device `en-US` voices in the meantime.

## P0 — Reach a complete course

1. **All 35 levels authored and audited** against `scripts/audit-content.mts` and `scripts/check-dialogues.mts`, with the corpus-level critic pass from `CLAUDE.md` §5.
2. **Native audio** for the whole corpus via the `Generate audio` workflow, then `audit-audio` / `normalize-audio`.
3. **Verify suites green** on every commit (`CLAUDE.md` §7).

## P1 — Before sharing widely

4. Reading-scaffold tuning from real use: does the Thai reading withdraw at the right moment for a Thai learner, and is IPA helping or noise?
5. Typed-answer tolerance tuning (`typedMatches`): collect real misses and decide which are typos and which are errors.
6. Account sync against a dedicated Supabase project (schema in `supabase/`).

## P2 — The differentiator

7. **Pronunciation feedback on the things STT hides** (finals, th/v, stress) — deferred until an approach exists that does not normalise the learner's error away.
8. Ear training built on the computed minimal pairs (`src/core/sounds.ts`): a drill mode, not just a reference.

## Working agreement

Same as ChaiThai: nothing ships without the suites; content is gated by the external frequency list, not by the author's sense of coverage; UI copy is Thai; readings are derived.
