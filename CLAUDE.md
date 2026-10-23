# CLAUDE.md

Project instructions for Claude Code. Read this fully before any task in this repo.

---

## 1. What this is

A progression-based, SRS-powered app that teaches **spoken English to Thai speakers**. The mental model is **"WaniKani for everyday English"** — not Duolingo's forward-marching lesson path, but a retention system where vocabulary, phrases, sentence patterns, and the sound-spelling system of English continually resurface until they're automatic.

It is the **mirror image of ChaiThai** (github.com/YuzuMamba/ChaiThai, Thai for English speakers) and shares its engine almost line for line. The two repos are deliberately separate and are never merged: different learners, different content, different deploys. Design decisions that were settled in ChaiThai are settled here unless this file says otherwise.

**Direction, once and for all:** the *target* language is English, the learner's *native* language is Thai. Everything the learner reads as instruction — UI, notes, explanations, questions — is Thai. The thing being learned (`en`) is English.

**Quality bar: AAA.** Visually beautiful, everything considered — textures, motion, physics, transitions, feel. The benchmark is Duolingo's production quality, *not* Duolingo's pedagogy. Rendering is ThreeJS.

---

## 2. Verified architecture — do not assume otherwise

The following is verified against the repo. **If a task assumes something not on this list, stop and flag it before writing code.**

| | Reality |
|---|---|
| Backend | **Optional Supabase**, one table (`supabase/schema.sql`), reached with plain `fetch` — no SDK. Absent credentials = no backend, and the app is unchanged. Content is still 100% static |
| Persistence | `localStorage`, key `chaienglish-v1`, via zustand `persist` (**v4**). A **mirror** goes to IndexedDB (`src/core/vault.ts`) — recovery copy and diagnostic, never the boot source. Optional account sync merges per record (`src/core/merge.ts`) |
| Content | Compiled into the JS bundle from `src/data/levels/level01–35.ts`. Hand-edited TypeScript. **No CSV import pipeline exists** |
| Scheduler | **Not SM-2.** Fixed WaniKani-style ladder: `SRS_INTERVALS_H` in `src/core/types.ts`, stages 0–9, `applyAnswer()` in `src/core/srs.ts`. Binary correct/incorrect |
| Audio | Pre-generated MP3s, resolved by **`clipKey(text)`** — lower-cased, letters/digits/apostrophes only — against `public/audio/manifest.json`. Items carry no audio path. No clip → `window.speechSynthesis` with an `en-US` voice |
| Structure | 35 levels. Items are `LexItem` (vocab + phrase) + `SentencePattern` + listening dialogues. Counts: recompute, see below |
| Phonics | `SCRIPT_LESSONS` / `ScriptChar` — a separate type, not part of `ITEMS`. 12 lessons; each `ScriptChar` is a **grapheme** (`'a'`, `'th'`, `'a-e'`), not a letter of an alphabet |

Recompute counts rather than trusting any number written in a doc:

```bash
npx tsx -e "
import { ITEMS, PATTERNS, CURRICULUM, SCRIPT_LESSONS, LISTENING } from './src/data/index.ts'
const t = {}; for (const i of Object.values(ITEMS)) t[i.type] = (t[i.type] ?? 0) + 1
console.log(\`levels=\${CURRICULUM.length} items=\${Object.keys(ITEMS).length} (\${Object.entries(t).map(([k,v])=>k+':'+v).join(' ')}) patterns=\${Object.keys(PATTERNS).length} dialogues=\${LISTENING.length} phonicsLessons=\${SCRIPT_LESSONS.length} graphemes=\${SCRIPT_LESSONS.reduce((a,l)=>a+l.chars.length,0)}\`)
"
```

### The data model, and what each field is for

```ts
LexItem { id, type, en, reading, ipa?, th, altTh?, altEn?, literal?, pos?, level, tags, notes?, mnemonic?, audioHint?, examples? }
```

- `en` — the English. The target. Rendered in the Latin font (CSS class `en`).
- `reading` — the **Thai-script reading** (คำอ่าน): syllables joined with hyphens, **one space-separated token per English word** (`thank you` → `แธงค์ ยู`). It is a scaffold, derived by the tool in §4, never typed from memory, and the one-token-per-word rule is load-bearing: `src/core/generate.ts` aligns `readingTemplate` to `enTemplate` word by word to put a reading on every tile.
- `ipa` — General American IPA from the same deriver. Shown as a footnote to the reading; also the input to the minimal-pair finder (`src/core/sounds.ts`).
- `th` — the Thai meaning. The answer in recognition questions, the prompt in production ones.
- `altTh` — other Thai glosses, used only to keep multiple-choice distractors unambiguous.
- `altEn` — other **English** forms accepted when the learner **types** the answer (`I'm` / `I am`, `okay` / `OK`). Typing is in the target language here, the reverse of ChaiThai.
- `notes`, `mnemonic`, `pos`, pattern `explanation`, level `canDo`, dialogue `question`/`choices`/`explanation` — all Thai.

### Structural facts that bite

- **`progress` is keyed by item id, one-to-one.** Vocab, phrases, and patterns all share the same `progress` map. `scriptProgress` is a separate map keyed by grapheme. A second scheduling record per item is structurally impossible without a key change.
- **Quiz kind (`QuizKind`) is not persisted.** It's rolled at question-construction time in `src/screens/Review.tsx`. All directions share one stage and one interval.
- **`persist` has `version` and `migrate`** (`PERSIST_VERSION` in `src/core/store.ts`). Any change to the shape of persisted state bumps the version and adds a migration step. Guarded by `verify-backup.mjs`.
- **Changing an item id orphans its progress silently.** Ids are hand-written stable strings (`'hello'`, `'p-i-want-to'`). Treat them as permanent.
- **Rendering is duplicated across four screens, ~6 code paths.** Adding a quiz kind means editing several by hand. Don't add another path; propose consolidating into one data-driven card renderer before any work that would.
- **Gating is client-side pacing, not access control.** `unlockedLevel()` in `src/core/store.ts` — a level opens at ≥80% of the previous level's items at stage ≥4, plus `SCRIPT_GATES` (reading checkpoints at levels 5/9/13/17/21/25/29). The gate values are **computed from the phonics course** (`charsThroughStage(n).length`), so adding a grapheme to a lesson moves the gate with it. `effectiveUnlocked()` is monotonic, so lapses never re-lock. Listening uses the rolling met frontier (`listeningCap()`).

### Invariants that must not break

Inherited from ChaiThai, where each was learned the hard way, and re-verified here.

- **`schedule=false` is load-bearing.** `applyAnswer(p, correct, now, schedule=false)` records stats without moving `stage` or `due`. Used for same-session requeues, Sentence Builder's off-schedule reps, and the phonics drill on a grapheme that isn't due. Practice that isn't spaced recall must not advance the scheduler.
- **The reading is a scaffold withdrawn on TWO axes, and reading ability is the hard one.** `readingScaffold = showReading && (stage <= 2 || !canRead)` in `Review.tsx`. `canRead` is `canReadEnglish()` applied to **every English word the question puts on screen**: true only when each grapheme in each word is retained at `SCRIPT_GATE_STAGE`. The word is cut into graphemes by `segmentGraphemes()` in `src/core/phonics.ts` — the same cut the course teaches — and a grapheme taught nowhere keeps the scaffold on. Lesson tiles and Builder tiles show the reading whenever `showReading` is on, with no gate.
- **Typing is production.** `type-en` shows the Thai meaning and the learner types the English. `typedMatches()` compares word by word **in order** (word order is part of the answer), expands contractions on both sides, forgives a leading article or `to`, tolerates one slip in a word of six letters or more, and **never** accepts a negation the answer lacks or lacks one the answer has. Guarded by `verify-srs.mjs`.
- **English tokens are joined with spaces.** Anywhere ChaiThai joined Thai tokens with `''`, this app joins with `' '` — a sentence spoken or displayed without spaces is a bug, not a style.
- **The daily new-item budget must survive repeat visits.** `Lesson.tsx` caps its queue at `newBudgetRemaining(st)`, and when that cap yields nothing it serves **nothing** — not the whole level. Guarded by `verify-pacing.mjs`.
- **An installed iOS app has its OWN storage bucket**, separate from Safari's for the same URL. `isStandalone()` in `src/core/vault.ts` detects it and the app explains it instead of letting it read as data loss. Any future change to the manifest or the apple meta tags moves a learner between buckets — treat it as a migration.
- **Graphemes ride the same ladder as vocabulary.** Every `ScriptChar` met enters `scriptProgress` via `learnScriptChar()` at เมล็ด and is reviewed in the same session queue as words and patterns.
- **Sentence Builder's spacing memory is `seenSentences`, not `progress`.** Recorded on serve, pruned to `SEEN_SENTENCE_CAP`, unioned on sync by later-sighting-wins.
- **Pattern tiles carry their own reading.** `makeRound()` resolves it once from `readingTemplate` by slot-anchored alignment, falling back to the lexicon. Renderers read `tile.reading`, never re-derive it.

---

## 3. Product principles

Settled. Don't relitigate them; do flag if a task conflicts with one.

**Generative ability over phrase memorization.** If a learner knows 600 useful words and a few dozen high-frequency frames, they should understand and produce thousands of sentences they've never studied. Sentence Builder gives a *Thai meaning* and asks the learner to construct the English.

**Understanding over memorizing.** Every pattern needs an explanation the learner can generalize from — in Thai, contrastive with Thai: *why* English needs `am/is/are` where Thai has nothing, *why* the question word moves to the front, *why* `-s` on `he works` matters.

**Frequency- and combinability-driven sequencing.** Content is ordered by real-world usefulness, frequency, teachability, and how well it recombines — not by textbook chapter. `CURRICULUM.md` is the plan; `scripts/audit-content.mts` measures it against an external spoken-English frequency list.

**Everyday spoken register.** The English a Thai adult actually uses: foreign customers and tourists in Thailand, travel abroad, hotels, airports, cafés, taxis, online chat, work, hospitals, explaining Thai food and culture. International, lightly American. Not exam English.

**Comprehension and production both.** Hear real English built from known material and understand it directly. Then produce English from a Thai meaning — tiles first, then typing.

**Pronunciation is its own progression.** The Read-English course teaches the sound-spelling system (short vowels → familiar consonants → the sounds Thai lacks → released finals → magic e → vowel teams → r-vowels → special letters → `-s`/`-ed` → stress). Speaking runs free through Level 4; from Level 5 the reading checkpoints require graphemes the learner actually retains. The Sounds screen (`src/screens/Sounds.tsx`) is the always-reachable reference: sounds Thai lacks, finals Thai swallows, stress and intonation, and minimal pairs computed from the corpus.

**No coercive gamification.** No hearts, no loss aversion, no leaderboards, no streak *pressure*. XP, a day streak, celebrations and the SRS garden are fine and shipped.

**Progress test:** not "have I completed X lessons?" but "what English can I understand, and what can I say on my own?"

---

## 4. Content standards

- **Readings are DERIVED — never recalled.** English spelling does not encode pronunciation, so the reading comes from the CMU Pronouncing Dictionary through the committed rules in `scripts/reading/` (conventions in `scripts/reading/README.md`):

  ```bash
  npx tsx scripts/reading-anchor.mts --en "thank you" "coffee"        # reading + IPA per word
  npx tsx scripts/reading-anchor.mts --check "coffee" "คอฟ-ฟี่"         # audit a reading you have
  npx tsx scripts/reading-anchor.mts --json --en ...                   # batch
  ```

  Verdicts: **DERIVED** (ship it), **EXCEPTION** (a listed irregular or proper name from `scripts/reading/exceptions.ts` — ship it), **MISSING** (not in CMUdict — add an exception with a comment, never guess silently). **After editing any rule file, run `npx tsx scripts/reading/validate.mts`**; it replays the regression table and the top-1,000 frequency words and must stay green. Do not add to `exceptions.ts` to silence a rule you haven't understood — if the rule is wrong, fix the rule.
- **One reading token per English word.** `thank you` → `แธงค์ ยู`, never `แธงค์-ยู`. The tile aligner depends on it.
- **English must be natural spoken English**, not translated Thai. If a Thai speaker would say it but an English speaker wouldn't, it doesn't ship.
- **Field completeness**: every item needs `pos`, `tags`, `notes`, `reading`, `ipa` (via the deriver), and `altTh` where another Thai gloss is plausible. Every item whose English has a contraction or spelling variant needs `altEn`.
- **Sense splitting**: one item per sense. `like` (ชอบ) and `like` (เหมือน) are two ids at two levels, never a rewritten gloss.
- **Thai-L1 contrast in every note that touches grammar.** The note says what Thai does and what English does differently — that is the whole value of a course written *for* Thai speakers.
- **Ids are permanent.** Never mint a new id for content that already exists. Convention: lower-case English slug (`'thank-you'`, `'how-much'`); patterns `'p-'` + slug (`'p-i-want-to'`); dialogues `'lis-'` + slug.
- **Any content importer is a build-time script** (`scripts/`). Content stays statically compiled; never introduce runtime content fetching.
- **Imported or generated content gets the same QC as hand-written content.**

### Authoring a level — the brief

`CURRICULUM.md` says what each level contains. The file is `src/data/levels/levelNN.ts` exporting `items`, `patterns`, `level`. For every level:

1. Items: the words and phrases in the plan, each with `en`, `reading` + `ipa` from the deriver, `th`, `altTh`, `altEn` where relevant, `pos` (Thai), `tags`, a `notes` string of 1–3 sentences in Thai (contrastive where grammar is involved), a `mnemonic` where one helps, and 1–2 `examples` built as far as possible from earlier levels.
2. Patterns: 3 per level (2 at L1). `enTemplate` with `{slot}` placeholders and **no sentence punctuation** (tiles are words); `readingTemplate` with the same slots and one token per word; `thTemplate`; `slots[].itemIds` only from this and earlier levels; `compat` where a slot's fill constrains the next; `showcase` with 2–3 natural combos; `distractors` 3–4 ids; an `explanation` in Thai that a learner can generalise from.
3. Dialogues: 2 per level in a scratch file exporting `dialogues`, 6–10 lines, two alternating speakers from the fixed `CAST` in `src/data/listening.ts`, English built from vocabulary at or below the level (≤ 3 chunks of glue), `reading` per line from the deriver, `th` per line, a Thai `question` with 4 Thai `choices` whose correct answer is **not** the longest, and an `explanation` naming the English that carries the answer. `npx tsx scripts/check-dialogues.mts --file <scratch>` must pass; then `npx tsx scripts/merge-listening.mts <scratch>`.
4. Register the level: it is already imported in `src/data/index.ts`; a level with `itemIds.length > 0` participates.
5. Run: `npx tsc -b --noEmit`, `npx tsx scripts/audit-content.mts`, `npx tsx scripts/check-dialogues.mts --level NN`, `npx tsx scripts/export-content.mts`.

---

## 5. Build method — the gauntlet

Default working mode for any **substantial** task: new features, content authoring, visual work, anything touching the scheduler or persistence. Do not hand back single-agent output as final.

1. **Fan out.** Spawn a dedicated subagent per work item and have each tackle its item individually.
2. **Loop each item.** `/loop` until done, not until first plausible output.
3. **Independent critic per item.** A *separate* subagent checks the work and is a harsh critic. For visual work it compares against Duolingo **blind, side by side**, and states which looks better. For Thai copy it reads as a Thai adult who has never seen the English.
4. **Don't stop** until each critic is genuinely impressed.
5. Ultracode.

**Threshold.** Single-file fixes already covered by the suites in §7 go direct. The gauntlet is for work where the *design* is in question.

**On step 3:** `duolingo.com` is **blocked by this environment's network egress**. The working substitute is critics' internalized knowledge of Duolingo's design language plus reference-free probes: spacing rhythm, tap-target sizing, contrast ratios, motion timing, screenshots at 360/390px. Say which method was used.

### Mandatory addition: out-of-family review

The gauntlet's known failure mode is **sibling review**: a critic spawned from the same session as the generator shares its blind spots. ChaiThai shipped a curriculum that was internally consistent and missing `มี`, `เขา`, `ของ`, `กับ`, `ใน`. The English equivalents are waiting to be missed here: `get`, `do`, `there is`, `some`, `any`, `one` (the pronoun).

So, for content tasks specifically:

- **Item-level correctness and corpus-level completeness are different checks.** Run both. "Is this entry right?" and "can a learner who finishes this course say *I have a friend*?"
- **Gate content against the external frequency list**, not against the generator's judgement: `npx tsx scripts/audit-content.mts` measures coverage of `scripts/freq/en-opensubtitles-top3000.txt`, enumerates the English closed classes, cross-references pattern literals against the levels that teach them, and reports listening vocabulary outside its level. Run it after every content batch and put the numbers in the commit.
- **Authors working in parallel cannot see each other's levels.** Run one corpus-level critic across the whole wave after the item-level critics.
- **Verify closed-class inventories explicitly** — pronouns, `be`/`do`/`have` forms, question words, articles and determiners, prepositions, conjunctions, modals, quantifiers, numbers, time words, reactions. Finite. Enumerate and check.
- **Cross-reference patterns against items.** Any literal word in an `enTemplate` must be a learnable item at or before that pattern's level.
- **Thai copy is reviewed by a critic reading as a Thai learner**, not by the author. Watch for translated-English Thai (ภาษาไทยที่แปลมา), for explanations that assume the learner already knows the grammar term, and for ครับ/ค่ะ creeping into the neutral UI voice.

---

## 6. Known open issues

Verified present in the repo. Fix or flag them when working nearby.

- **Audio corpus is not generated yet.** Every clip falls back to the device's `en-US` voice. The `Generate audio` workflow and `scripts/generate-audio.mts` are ported and planned; running them needs `GOOGLE_TTS_API_KEY` in repo secrets (§8). Until then the Listening Lab speaks with the device voice — adequate on iOS/Android, poor on desktop Linux.
- **The verify suites were ported from ChaiThai by selector and text**; any UI copy change in Thai must be mirrored in `scripts/verify-*.mjs`.
- **`course-content.csv` at the repo root is generated** by `npx tsx scripts/export-content.mts`. Re-run it whenever `src/data/levels/*` changes.
- **Pronunciation scoring is deferred.** Speech-to-text normalises toward the nearest real word and therefore *hides* the errors Thai speakers make (finals, th, v, stress), which is worse than no feedback.

---

## 7. Standing checks before committing

**Run the suites first.** They need the dev server up (`npm run dev`), started FRESH (Vite HMR splits the module graph after edits and probes can land on a second store instance):

```bash
node scripts/verify-srs.mjs         # SRS stage/due transitions, requeue freeze, Builder due-gate + sentence meter, typed English matcher
node scripts/verify-script-srs.mjs  # grapheme SRS, reading gates, lesson-drill due-gate, review queue, nav badge
node scripts/verify-backup.mjs      # persist version/migrate chain, export/import, rescue stash, dev tools
node scripts/verify-pacing.mjs      # daily new-item budget holds across repeat lesson visits
node scripts/verify-vault.mjs       # IndexedDB mirror, storage diagnosis, blocked-storage + private-browsing alarms
node scripts/verify-sync.mjs        # merge rules — symmetry, no-lost-ground property test
node scripts/verify-sync-live.mjs   # sync over real HTTP against scripts/fake-supabase.mjs (starts its own dev server)
node scripts/verify-safe-area.mjs   # nothing renders under the status bar / Dynamic Island / home indicator
node scripts/verify-mnemonics.mjs   # every grapheme has a how-to-say and a how-to-remember story and a panel that shows it
npx tsx scripts/audit-content.mts   # corpus: frequency coverage, closed classes, pattern cross-refs, listening leakage
npx tsx scripts/check-dialogues.mts # every dialogue: cast, glue, readings, question design
npx tsx scripts/reading/validate.mts # the reading deriver's regression table
npx tsc -b --noEmit                 # app — must be clean
npm run typecheck:scripts           # scripts/*.mts
```

All must end `0 failed`. Assertion *totals* vary between runs because question kinds are drawn randomly — judge by the failure count.

`verify-safe-area` covers a class of bug that **cannot be reproduced in a browser tab**: `index.html` sets `viewport-fit=cover`, so an installed app's UI can render under the Dynamic Island. `global.css` aliases the four insets into `--safe-t/r/b/l`; **anything anchored to a viewport edge must consume the variable, never call `env()` directly.**

Then:

- Does anything change the shape of persisted state? If yes, bump `PERSIST_VERSION` and add a `migrate` step first.
- Do all `CURRICULUM` `itemIds` / `patternIds` resolve? Any orphans?
- Does every item's own `level` field agree with the level listing it?
- Did any id change? If so, an explicit remap is required.
- Does new English text have a matching entry in `public/audio/manifest.json` once audio exists? Audio resolves by text, so a wording change silently breaks a clip.
- Screenshot any UI change at **390px and 360px** and confirm zero horizontal overflow — Thai text is taller and wider than English; check line-height and wrapping specifically.

---

## 8. Toolchain, deployment, secrets

- **Stack:** React 18 + TypeScript + Vite 6, Zustand (`persist`), Three.js. No test framework — verification is the Playwright state-assertion suites in §7, driven by `playwright-core` against the dev server.
- **Fonts:** UI is `Nunito Variable` with `Noto Sans Thai` falling in for Thai glyphs; English target text uses the `en` class (Latin font). Thai needs line-height ≥ 1.45 in body text.
- **Deployment:** Netlify only — `netlify.toml` (build `npm run build`, publish `dist`, SPA fallback), auto-deploying on push to the production branch chosen when the site is created. This is a **separate Netlify site** from ChaiThai with its own URL and therefore its own `localStorage` origin.
- **Audio generation:** `scripts/generate-audio.mts`, run as `GOOGLE_TTS_API_KEY=xxxx npx tsx scripts/generate-audio.mts`. It enumerates the whole corpus and writes `public/audio/*.mp3` + `manifest.json` + `voices.json`.
  - **Always run `GOOGLE_TTS_PLAN=1 npx tsx scripts/generate-audio.mts` first.** No key, no network, nothing spent.
  - The panel is **every `en-US` Chirp3-HD voice**. Assignment is deterministic. Dialogue characters each keep one voice, matched to the gender declared in `CAST` (`src/data/listening.ts`); castmates never share a voice.
  - `scripts/audit-audio.mts` judges audibility by amplitude and level; `scripts/normalize-audio.mts` level-matches.
  - **From a phone:** the `Generate audio` GitHub Action does all of this with the key in repo secrets. Leave `plan_only` ticked for a free preview.
- **Never hardcode or commit an API key.** The key is read from the environment only.

---

## 9. Don't

- Don't invent infrastructure. If a task needs a backend, say so instead of scaffolding one.
- Don't replace the interval ladder with SM-2 as incidental work.
- Don't reformat or re-derive existing readings as a side effect of another task.
- Don't add another hardcoded rendering path; propose consolidation instead (§2).
- Don't remove the `schedule=false` path or the reading scaffold because they look like bugs (§2).
- Don't strip XP, streaks, or celebration effects in the name of "no gamification" (§3).
- Don't write UI copy in English. The learner is Thai.
- Don't touch the ChaiThai repo from here, and don't copy content from it — it is Thai-for-English-speakers and this is the reverse.
- Don't report a check as passing without having run it.
