// Pre-generate the app's ENTIRE audio corpus with Google Cloud Text-to-Speech.
// The speakable text is a closed set (items, examples, every generatable
// pattern sentence, dialogue lines, phonics words and sounds, drills, tile
// tokens), so we synthesize each utterance once into public/audio/<hash>.mp3
// and ship static files — zero runtime latency, no API key in the client.
//
// Usage:  GOOGLE_TTS_API_KEY=xxxx npx tsx scripts/generate-audio.mts
// Re-runs are incremental: existing hashes are skipped.

import { createHash } from 'node:crypto'
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import { ITEMS, PATTERNS, LISTENING, SCRIPT_LESSONS, letterSound } from '../src/data'
import { CAST } from '../src/data/listening'

/**
 * GOOGLE_TTS_PLAN=1 reports what a real run would do — the corpus, what is
 * missing, and which speaker every clip would get — without a key, without a
 * network call, and without spending anything. It exists because the voice
 * ASSIGNMENT is the part that goes wrong quietly: a dialogue voiced line by
 * line, or a slow replay in a different speaker, is only discovered by
 * listening to output that has already been paid for and committed.
 */
const PLAN = process.env.GOOGLE_TTS_PLAN === '1'

const KEY = process.env.GOOGLE_TTS_API_KEY
if (!KEY && !PLAN) {
  console.error('Set GOOGLE_TTS_API_KEY (a Google Cloud API key with the Text-to-Speech API enabled).')
  console.error('Or run with GOOGLE_TTS_PLAN=1 to preview the run without a key.')
  process.exit(1)
}

const OUT = 'public/audio'
const MANIFEST_PATH = `${OUT}/manifest.json`
mkdirSync(OUT, { recursive: true })

/**
 * Runtime lookup key: lower-cased, letters/digits/apostrophes only, so
 * "Thank you!" and "thank you" are one clip. MUST match `clipKey` in
 * src/core/audio.ts (and the copy in scripts/build-artifact.mts) exactly — the
 * app resolves clips by this key and nothing else.
 */
const keyOf = (text: string): string => text.toLowerCase().replace(/[^a-z0-9']/g, '')
const hashOf = (s: string): string => createHash('sha1').update(s).digest('hex').slice(0, 16)

// ─── Collect the corpus ──────────────────────────────────────────────────────
// Map: canonical spoken text. Spaces and punctuation are KEPT in the text handed
// to Google — "Where are you from?" is phrased as a question, "where are you
// from" is not — and only folded in the key.
const corpus = new Map<string, string>() // key → canonical text
const slowSet = new Set<string>()        // keys that also get a slow variant

function add(text: string, slow = false): void {
  const t = text.trim()
  if (!t) return
  // Slash alternates (a/an): the app speaks the first form; cut each part.
  if (t.includes('/')) {
    t.split('/').forEach(p => add(p, slow))
    return
  }
  const k = keyOf(t)
  if (!k) return // a bare "?" or "…" tile has nothing to say
  if (!corpus.has(k) || (corpus.get(k)!.length < t.length)) corpus.set(k, t)
  if (slow) slowSet.add(k)
}

for (const it of Object.values(ITEMS)) {
  add(it.audioHint ?? it.en.replace(/_/g, ''), true)
  for (const ex of it.examples ?? []) add(ex.en, true)
}

/** A template's literal tokens as tiles speak them: punctuation off. */
const bareToken = (t: string): string => t.replace(/[,.!?;:"()…—–]/g, '')

for (const p of Object.values(PATTERNS)) {
  // Literal template tokens (tiles speak them individually).
  for (const part of p.enTemplate.split(/\s+/)) {
    if (!/^\{\w+\}$/.test(part)) add(bareToken(part))
  }
  // Every generatable sentence: full cross-product through compat, with
  // optional slots both filled and omitted (mirrors src/core/generate.ts).
  // English words join with a space; a `/` choice takes its first form.
  const slots = p.slots
  const walk = (idx: number, fills: Record<string, string>): void => {
    if (idx === slots.length) {
      const sentence = p.enTemplate
        .split(/\s+/)
        .map(part => {
          const m = part.match(/^\{(\w+)\}$/)
          if (!m) return part.split('/')[0]
          const id = fills[m[1]]
          return id ? (ITEMS[id]?.en ?? '') : ''
        })
        .filter(Boolean)
        .join(' ')
      add(sentence)
      return
    }
    const slot = slots[idx]
    const prev = idx > 0 ? fills[slots[idx - 1].name] : ''
    const allowed = prev && p.compat?.[prev]
      ? slot.itemIds.filter(id => p.compat![prev].includes(id))
      : slot.itemIds
    if (slot.optional) walk(idx + 1, { ...fills, [slot.name]: '' })
    for (const id of allowed) walk(idx + 1, { ...fills, [slot.name]: id })
  }
  walk(0, {})
}

// ─── Who is speaking, in the dialogues ──────────────────────────────────────
// A conversation has to sound like a conversation. Assigning a voice per
// utterance is right for isolated vocabulary and wrong here: a two-person
// exchange comes out with a different speaker on every line, and the learner
// cannot follow who is who — the one thing Listening Lab is training.
//
// English does not mark the speaker's gender in the sentence (nothing plays
// the role Thai's ครับ/ค่ะ do), so the cast is declared once, by hand, in
// src/data/listening.ts — CAST maps every character to MALE or FEMALE. A
// speaker who is not in CAST is a content error and fails the plan: there is
// no second source to infer a gender from, and a guess would be paid for and
// committed before anyone heard it.
const speakerOf = new Map<string, string>()          // utterance key → character
const lineCount = new Map<string, number>()
const together = new Map<string, Set<string>>()      // who shares a dialogue with whom
const unknownSpeakers = new Set<string>()
for (const ex of LISTENING) {
  const cast = [...new Set(ex.lines.map(l => l.speaker))]
  for (const a of cast) {
    const s = together.get(a) ?? new Set<string>()
    for (const b of cast) if (b !== a) s.add(b)
    together.set(a, s)
  }
  for (const line of ex.lines) {
    add(line.en, true)
    speakerOf.set(keyOf(line.en.trim()), line.speaker)
    if (!CAST[line.speaker]) unknownSpeakers.add(line.speaker)
    lineCount.set(line.speaker, (lineCount.get(line.speaker) ?? 0) + 1)
  }
}
/** MALE / FEMALE per character who actually speaks, from the cast list. */
const speakerGender = new Map<string, 'MALE' | 'FEMALE'>()
for (const name of lineCount.keys()) if (CAST[name]) speakerGender.set(name, CAST[name])
if (unknownSpeakers.size > 0) {
  console.error(`Dialogue speaker(s) not in CAST (src/data/listening.ts): ${[...unknownSpeakers].join(', ')}`)
  console.error('Add each one with a gender before cutting audio — a voice cannot be chosen for them.')
  if (!PLAN) process.exit(1)
}

for (const lesson of SCRIPT_LESSONS) {
  // A grapheme card speaks letterSound(c) — the SOUND the spelling makes, not
  // the letter's Thai name (which is Thai text, and would be read by an
  // English voice as noise). The example word is cut with a slow variant.
  for (const c of lesson.chars) { add(c.word, true); add(letterSound(c)) }
  for (const d of lesson.drills) add(d.en, true)
}

console.log(`Corpus: ${corpus.size} utterances (${slowSet.size} with slow variants)`)

// ─── Pick a PANEL of English voices ─────────────────────────────────────────
// Not one voice. Training on a single talker builds talker-specific
// perception: the learner gets good at hearing THAT voice's /l/ vs /r/ and
// transfers poorly to real people. Several speakers across the corpus is
// worth more than any tier upgrade.
//
// Assignment is deterministic (hash of the utterance key → voice), never
// random, for two reasons: re-runs are incremental, so a random pick would
// give the same word a different voice each regeneration; and a stable
// mapping means a learner always hears a given word from the same speaker
// while the corpus as a whole stays multi-voice.
interface Voice { name: string; languageCodes: string[]; ssmlGender?: string }

/** A stand-in panel for GOOGLE_TTS_PLAN, so the assignment logic can be
 *  inspected offline. Shapes only — the real run always asks Google. */
const PLAN_VOICES: Voice[] = [
  ['Aoede', 'FEMALE'], ['Kore', 'FEMALE'], ['Leda', 'FEMALE'], ['Zephyr', 'FEMALE'],
  ['Achernar', 'FEMALE'], ['Autonoe', 'FEMALE'], ['Callirrhoe', 'FEMALE'], ['Despina', 'FEMALE'],
  ['Charon', 'MALE'], ['Fenrir', 'MALE'], ['Orus', 'MALE'], ['Puck', 'MALE'],
  ['Achird', 'MALE'], ['Algenib', 'MALE'], ['Alnilam', 'MALE'], ['Enceladus', 'MALE'],
].map(([n, g]) => ({ name: `en-US-Chirp3-HD-${n}`, languageCodes: ['en-US'], ssmlGender: g }))

/** Listing voices is free — it synthesizes nothing. So a plan asks for the
 *  REAL panel whenever a key is available, and only invents one when it has
 *  no way to look. A plan against a made-up voice list cannot tell you the
 *  thing you most want to know before paying: who is actually going to speak. */
async function listVoices(): Promise<Voice[] | null> {
  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?languageCode=en-US&key=${KEY}`,
    )
    if (!res.ok) {
      console.error('Voice list failed:', res.status, (await res.text()).slice(0, 200))
      return null
    }
    return ((await res.json()) as { voices: Voice[] }).voices
  } catch (e) {
    console.error('Voice list failed:', e instanceof Error ? e.message : e)
    return null
  }
}

let voices: Voice[]
let panelIsReal = true
if (PLAN) {
  const real = KEY ? await listVoices() : null
  if (real) {
    voices = real
    console.log(`PLAN MODE — nothing will be synthesized. Voice list is REAL (${real.length} en-US voices).`)
  } else {
    panelIsReal = false
    voices = PLAN_VOICES
    console.log('PLAN MODE — nothing will be synthesized.')
    console.log(KEY
      ? '  ⚠ Could not reach Google, so the panel below is a STAND-IN, not your account\'s.'
      : '  ⚠ No API key, so the panel below is a STAND-IN. It checks the wiring and the'
        + '\n    assignment rules, but NOT which voices you actually have.')
  }
} else {
  const real = await listVoices()
  if (!real) process.exit(1)
  voices = real
}
const rank = (n: string): number =>
  n.includes('Chirp3-HD') ? 0 : n.includes('Chirp-HD') ? 1 : n.includes('Neural2') ? 2
  : n.includes('Wavenet') ? 3 : 4

/** GOOGLE_TTS_VOICES=a,b,c pins an explicit panel; GOOGLE_TTS_VOICE pins a
 *  single voice (back-compat, and useful for A/B-ing one speaker). */
const explicit = (process.env.GOOGLE_TTS_VOICES ?? process.env.GOOGLE_TTS_VOICE ?? '')
  .split(',').map(v => v.trim()).filter(Boolean)

const available = voices.map(v => v.name).sort((a, b) => rank(a) - rank(b))
if (available.length === 0) { console.error('No en-US voices available on this account.'); process.exit(1) }
// Take every voice in the BEST available tier — mixing tiers would make the
// corpus audibly uneven, which is worse than a single good voice.
const bestTier = rank(available[0])
const panel = explicit.length > 0 ? explicit : available.filter(n => rank(n) === bestTier)

const unknown = explicit.filter(n => !available.includes(n))
if (unknown.length > 0) {
  console.error(`Voice(s) not available for en-US: ${unknown.join(', ')}`)
  console.error(`Available: ${available.join(', ')}`)
  process.exit(1)
}
console.log(`Voice panel (${panel.length}): ${panel.join(', ')}`)
if (panel.length === 1) {
  console.warn('  ⚠ Only ONE voice — single-talker audio trains talker-specific perception.')
}
const genders = new Map(voices.map(v => [v.name, v.ssmlGender ?? '?']))
console.log(`  genders: ${panel.map(n => `${n.split('-').pop()}=${genders.get(n)}`).join(' ')}`)

const pickFrom = (pool: string[], seed: string): string =>
  pool[parseInt(hashOf(seed).slice(0, 8), 16) % pool.length]

/**
 * Voices that returned an INAUDIBLE clip for a given utterance, recorded by
 * `audit-audio.mts --recut`. Google's whisper failure is not always a fluke:
 * for some short words the same voice returns the same whisper on every
 * retry (seen twice over on two one-syllable words in ChaiThai's corpus,
 * 2026-09-25), so dropping the clip and cutting it again with the same
 * speaker can never heal it. A shunned voice is taken out of THAT utterance's
 * pool and the hash picks again from the rest; the slow variant follows,
 * since it must share the normal clip's voice. Dialogue lines are exempt —
 * their voice belongs to the character, and one quiet line is a smaller wrong
 * than a character who changes voice mid-conversation.
 */
const SHUN_PATH = `${OUT}/shunned.json`
const shunned: Record<string, string[]> =
  existsSync(SHUN_PATH) ? JSON.parse(readFileSync(SHUN_PATH, 'utf8')) : {}
const shunnedFor = (manifestKey: string): string[] => {
  const base = manifestKey.replace(/^slow:/, '')
  return speakerOf.has(base) ? [] : (shunned[base] ?? [])
}

const byGender = (g: 'MALE' | 'FEMALE'): string[] => {
  const pool = panel.filter(n => genders.get(n) === g)
  return pool.length > 0 ? pool : panel  // never fail; warned about below
}

const male = byGender('MALE'), female = byGender('FEMALE')
if (male === panel || female === panel) {
  console.warn('  ⚠ The panel is single-gender, so dialogue characters cannot be voiced by the')
  console.warn('    gender CAST declares for them. Some will come out in the wrong voice.')
}

/**
 * One voice per dialogue character, chosen so that nobody sharing a
 * conversation shares a voice.
 *
 * Hashing the name alone very nearly worked — but "very nearly" here means two
 * characters in the same exchange can collide, which is precisely the
 * confusion the per-character voice exists to remove. It held in ChaiThai only
 * because the colliding pairs happened never to appear together; one new
 * dialogue would have broken it silently.
 *
 * So: take each character's hash-preferred voice, and step to the next one of
 * their gender if a castmate already has it. Deterministic (fixed order, fixed
 * hash), stable across runs, and correct by construction rather than by luck.
 */
// Which speaker produced each clip. Lets a future run detect that the panel
// changed, and lets QC sample per-voice rather than treating the corpus as one.
// Read here, before the cast is voiced, because the cast's voices are STICKY
// to what is already on disk (below).
const VOICE_LOG_PATH = `${OUT}/voices.json`
const voiceLog: Record<string, string> =
  existsSync(VOICE_LOG_PATH) ? JSON.parse(readFileSync(VOICE_LOG_PATH, 'utf8')) : {}

/**
 * The voice a character already speaks with on disk — the most common logged
 * voice across their lines. Content growth reorders `order` (it sorts by line
 * count) and can change which character wins a hash collision; without this,
 * adding one dialogue could move a character to a new voice and either leave
 * their old clips in the wrong voice (the lax cache rule) or re-cut every line
 * they have (the strict one). Keeping the voice they have is correct by
 * construction and costs nothing.
 */
function diskVoice(name: string): string | undefined {
  const tally = new Map<string, number>()
  for (const [k, who] of speakerOf) {
    if (who !== name) continue
    const v = voiceLog[k]
    if (v) tally.set(v, (tally.get(v) ?? 0) + 1)
  }
  return [...tally].sort((a, b) => b[1] - a[1])[0]?.[0]
}

const speakerVoice = new Map<string, string>()
{
  const order = [...speakerGender.keys()].sort((a, b) =>
    (lineCount.get(b) ?? 0) - (lineCount.get(a) ?? 0) || a.localeCompare(b))
  for (const name of order) {
    const pool = speakerGender.get(name) === 'MALE' ? male : female
    const taken = new Set(
      [...(together.get(name) ?? [])].map(o => speakerVoice.get(o)).filter(Boolean) as string[])
    const kept = diskVoice(name)
    if (kept && pool.includes(kept) && !taken.has(kept)) { speakerVoice.set(name, kept); continue }
    const start = parseInt(hashOf(name).slice(0, 8), 16) % pool.length
    let chosen = pool[start]
    for (let i = 0; i < pool.length; i++) {
      const c = pool[(start + i) % pool.length]
      if (!taken.has(c)) { chosen = c; break }
    }
    speakerVoice.set(name, chosen)
  }
}

/**
 * Stable voice for an utterance: same key → same speaker, every run.
 *
 * Two rules beyond the hash, both fixing things that only become audible once
 * the panel has more than one voice in it:
 *
 *   · The slow variant shares its normal counterpart's voice. Hashing the
 *     `slow:` prefix along with the key gave a word one speaker at full speed
 *     and a different one when replayed slowly — the single most confusing
 *     possible outcome for the button whose whole job is "say that again".
 *   · A dialogue line is voiced by its CHARACTER, in the gender CAST declares
 *     for them. Emma sounds like Emma in every dialogue she appears in, and
 *     never answers in a man's voice.
 */
const voiceFor = (manifestKey: string): string => {
  const base = manifestKey.replace(/^slow:/, '')
  const who = speakerOf.get(base)
  if (who) return speakerVoice.get(who) ?? pickFrom(panel, base)
  const avoid = shunnedFor(base)
  const pool = avoid.length > 0 ? panel.filter(v => !avoid.includes(v)) : panel
  return pickFrom(pool.length > 0 ? pool : panel, base)
}
// Chirp voices reject speakingRate < 1 in some versions; probe once below.

// ─── Synthesize ─────────────────────────────────────────────────────────────
const manifest: Record<string, string> =
  existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {}

async function synth(text: string, rate: number, voice: string): Promise<Buffer | null> {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'en-US', name: voice },
        audioConfig: { audioEncoding: 'MP3', speakingRate: rate },
      }),
    },
  )
  if (!res.ok) {
    console.error(`  FAIL (${res.status}) "${text}": ${(await res.text()).slice(0, 160)}`)
    return null
  }
  const { audioContent } = (await res.json()) as { audioContent: string }
  return Buffer.from(audioContent, 'base64')
}

const FORCE = process.env.GOOGLE_TTS_FORCE === '1'

/**
 * Whether an existing clip can be kept.
 *
 * Caching on "the file exists" alone is wrong in a way that only shows up
 * after the panel changes. A corpus generated by a single-voice run, followed
 * by a multi-voice run, would re-synthesize ONLY the handful of clips that
 * happened to be missing — leaving thousands of clips in one speaker and a
 * scattering in others. That is worse than either a single voice or a full
 * panel, and nothing about it is visible until you hear it.
 *
 * voices.json is the record of who said what, so it is also the migration
 * signal: a clip with no logged voice predates the panel, and a clip whose
 * voice has left the panel no longer belongs to the set. Both are re-cut.
 */
const stillGood = (mk: string, file: string): boolean => {
  if (FORCE) return false
  if (manifest[mk] !== file || !existsSync(`${OUT}/${file}`)) return false
  const had = voiceLog[mk]
  if (had == null || !panel.includes(had)) return false
  // A voice shunned for this utterance also retires the clips it DID manage
  // to cut — typically the slow variant of a word whose normal clip came back
  // as a whisper — so the pair moves to the new speaker together.
  if (shunnedFor(mk).includes(had)) return false
  // A dialogue line belongs to its CHARACTER. If the line has been given to
  // another character since it was cut, or the character's own voice (or
  // CAST gender) moved, the clip on disk is in the wrong voice although the
  // plan, which reads the assignment rather than the disk, reports one voice
  // per character. Re-cut it.
  if (speakerOf.has(mk.replace(/^slow:/, '')) && had !== voiceFor(mk)) return false
  return true
}

/** Every manifest key a full run touches, normal and slow. */
const allKeys = [...corpus.keys()].flatMap(k => (slowSet.has(k) ? [k, `slow:${k}`] : [k]))

const stale = allKeys.filter(mk => manifest[mk] && !stillGood(mk, `${hashOf(mk)}.mp3`)).length
const fresh = allKeys.filter(mk => !manifest[mk]).length
if (stale > 0) {
  console.log(`Re-voicing ${stale} existing clip(s): recorded before this voice panel, by a voice no longer in it, or by a voice shunned for that word.`)
  // A stand-in panel holds a fraction of the real voices, so every clip cut by
  // one of the others looks "no longer in the panel" and the figure above
  // becomes alarming fiction. Say so rather than letting it be read as a plan.
  if (!panelIsReal) {
    console.log('  ⚠ That count is against the STAND-IN panel and means nothing. A real run,')
    console.log('    which reads your actual voice list, will re-cut far fewer.')
  }
}
if (fresh > 0) console.log(`Generating ${fresh} clip(s) that do not exist yet.`)

if (PLAN) {
  const chars = [...corpus.values()].reduce((a, t) => a + t.length, 0)
  const spread: Record<string, number> = {}
  for (const mk of allKeys) {
    const v = voiceFor(mk).split('-').pop()!
    spread[v] = (spread[v] ?? 0) + 1
  }
  console.log(`\nWould synthesize ${stale + fresh} clip(s) of ${allKeys.length}; ${allKeys.length - stale - fresh} kept.`)
  console.log(`Characters in the corpus: ${chars}`)
  console.log(`\nVoice spread: ${Object.entries(spread).sort((a, b) => b[1] - a[1]).map(([v, n]) => `${v}:${n}`).join(' ') || '(empty corpus)'}`)

  console.log('\nDialogue characters — one voice each, gender from CAST in src/data/listening.ts:')
  for (const [name, g] of [...speakerGender].sort()) {
    const lines = [...speakerOf].filter(([, w]) => w === name).length
    console.log(`  ${name.padEnd(8)} ${g.padEnd(6)} ${voiceFor([...speakerOf].find(([, w]) => w === name)![0]).split('-').pop()}  (${lines} lines)`)
  }
  if (speakerGender.size === 0) console.log('  (no dialogues yet)')

  // The properties worth proving before paying for a run.
  const mismatched = allKeys.filter(mk => {
    const base = mk.replace(/^slow:/, '')
    return slowSet.has(base) && voiceFor(base) !== voiceFor(`slow:${base}`)
  }).length
  console.log(`\nSlow variants voiced differently from their normal clip: ${mismatched} (must be 0)`)
  const inconsistent = [...new Set(speakerOf.values())].filter(name => {
    const vs = new Set([...speakerOf].filter(([, w]) => w === name).map(([k]) => voiceFor(k)))
    return vs.size !== 1
  })
  console.log(`Dialogue characters with more than one voice: ${inconsistent.length} (must be 0)${inconsistent.length ? ' — ' + inconsistent.join(' ') : ''}`)

  const clashes: string[] = []
  for (const [name, others] of together) {
    for (const o of others) {
      if (name < o && speakerVoice.get(name) === speakerVoice.get(o)) clashes.push(`${name}=${o}`)
    }
  }
  console.log(`Castmates sharing a voice in the same dialogue: ${clashes.length} (must be 0)${clashes.length ? ' — ' + clashes.join(' ') : ''}`)

  const wrongGender = [...speakerVoice].filter(([n, v]) => genders.get(v) !== speakerGender.get(n))
  console.log(`Characters voiced against their CAST gender: ${wrongGender.length} (must be 0)`)
  console.log(`Dialogue speakers missing from CAST: ${unknownSpeakers.size} (must be 0)${unknownSpeakers.size ? ' — ' + [...unknownSpeakers].join(' ') : ''}`)
  // The checks above read the ASSIGNMENT. This one reads the DISK: a line
  // whose logged voice is not its character's current voice will be re-cut.
  const onDiskWrong = allKeys.filter(mk => {
    const had = voiceLog[mk]
    return had && speakerOf.has(mk.replace(/^slow:/, '')) && had !== voiceFor(mk)
  })
  console.log(`Dialogue clips on disk in a voice other than their character's: ${onDiskWrong.length} (re-cut by a real run)${panelIsReal ? '' : ' — against the STAND-IN panel; meaningless without a key'}`)

  const ok = mismatched === 0 && inconsistent.length === 0 && clashes.length === 0 && wrongGender.length === 0 && unknownSpeakers.size === 0
  console.log(ok ? '\n✓ Plan is sound.' : '\n✗ Plan has problems — do not run.')
  process.exit(ok ? 0 : 1)
}

let made = 0, skipped = 0, failed = 0
for (const [k, text] of corpus) {
  const jobs: [string, number][] = [[k, 1.0]]
  if (slowSet.has(k)) jobs.push([`slow:${k}`, 0.62])
  for (const [mk, rate] of jobs) {
    const file = `${hashOf(mk)}.mp3`
    if (stillGood(mk, file)) { skipped++; continue }
    const buf = await synth(text, rate, voiceFor(mk))
    if (!buf) { failed++; continue }
    writeFileSync(`${OUT}/${file}`, buf)
    manifest[mk] = file
    voiceLog[mk] = voiceFor(mk)
    made++
    if (made % 50 === 0) console.log(`  ${made} synthesized…`)
    await new Promise(r => setTimeout(r, 60)) // stay far under rate limits
  }
}

writeFileSync(MANIFEST_PATH, JSON.stringify(manifest))
writeFileSync(VOICE_LOG_PATH, JSON.stringify(voiceLog))
const spread: Record<string, number> = {}
for (const v of Object.values(voiceLog)) spread[v] = (spread[v] ?? 0) + 1
console.log(`Done: ${made} new, ${skipped} cached, ${failed} failed → ${OUT} (${Object.keys(manifest).length} total clips)`)
console.log(`Voice spread: ${Object.entries(spread).map(([v, n]) => `${v.split('-').pop()}:${n}`).join(' ') || '(none recorded)'}`)
const heard = new Set(Object.values(voiceLog).map(v => genders.get(v) ?? '?'))
if (heard.size === 1) {
  console.warn(`  ⚠ Every clip is ${[...heard][0]}. English learners need both — check the panel above.`)
}
if (made === 0 && skipped > 0) {
  console.log('Nothing to do: every clip is current and voiced from this panel.')
  console.log('GOOGLE_TTS_FORCE=1 re-cuts the whole corpus anyway.')
}
if (failed > 0) process.exit(1)
