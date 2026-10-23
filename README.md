# 🧋 ChaiEnglish — เรียนอังกฤษที่ใช้พูดจริง

A progression-based, SRS-powered app that teaches **spoken English to Thai speakers**:
**"WaniKani for everyday English."** Instead of marching through lessons once, everything
you learn keeps coming back through spaced repetition until it's second nature — and instead
of memorizing fixed phrases, you learn *patterns* that recombine into thousands of sentences
you've never seen.

It is the mirror image of [ChaiThai](https://github.com/YuzuMamba/ChaiThai) (Thai for English
speakers) and shares its engine. The learner-facing language here is Thai; the target is English.

## Run it

```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # production build
```

Append `?demo=1` to the URL to preview a mid-journey account (seeded progress, due reviews).

## What's inside

| Mode | What it trains |
|---|---|
| **หน้าหลัก (Path)** | 35 curriculum levels, unlocked by demonstrated retention (80% of the previous level at stage 4+), never re-locked |
| **ทบทวน (Reviews)** | The SRS backbone — 10 stages, intervals 4h → 4mo. Recognition *and* production: meaning/listening choice, English-recognition choice, **typing the English**, and tile-assembly of pattern sentences |
| **สร้างประโยค (Sentence Builder)** | Generative production: given a Thai meaning, construct the English from tiles using learned patterns + vocab |
| **ห้องฟัง (Listening Lab)** | Short natural-speed English dialogues built from vocabulary you already know; Thai questions test meaning, never word-by-word translation |
| **อ่านอังกฤษ (Read English)** | The sound-spelling system as a course: short vowels, the sounds Thai lacks, released finals, magic e, vowel teams, r-vowels, -s/-ed, stress — drills only ever use graphemes already taught |
| **เสียงและการเน้น (Sounds)** | The reference: sounds Thai doesn't have, finals Thai swallows, stress & intonation, and minimal pairs computed from the course |
| **คลังคำ (Library)** | Every word and pattern, grouped by level, searchable, with live mastery badges |

## Content principles

- **Spoken, everyday register** — the English a Thai adult actually needs, ordered by frequency × usefulness × combinability
- **Contrastive for Thai speakers** — every grammar note says what Thai does and what English does differently
- **Readings are derived, not remembered** — every Thai-script reading and IPA comes from the CMU Pronouncing Dictionary through `scripts/reading/`
- **Retention is the gate** — progress is "what can you understand and say", not "lessons completed"
- **Honest scheduling** — practice reps never advance the SRS schedule; only genuine spaced recall does

## Tech

React 18 + TypeScript + Vite, Zustand (persisted), Three.js for the ambient dusk scene.
No backend required — all state lives in `localStorage` (optional Supabase account sync).
Curriculum is plain typed data in `src/data/`. See `CLAUDE.md` for the architecture and the
authoring rules, and `CURRICULUM.md` for the 35-level plan.
