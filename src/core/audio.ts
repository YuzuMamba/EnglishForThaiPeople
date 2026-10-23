// ─── English speech + procedural SFX ─────────────────────────────────────────
// Speech prefers pre-generated native clips (Google Cloud TTS, shipped as
// static MP3s in /audio with a manifest — see scripts/generate-audio.mts) and
// falls back to the browser's English voice for anything not in the corpus.
// SFX are synthesized with WebAudio.

import INLINE_AUDIO from 'virtual:inline-audio'

// ─── Native clip playback ────────────────────────────────────────────────────

let manifest: Record<string, string> | null | undefined // undefined=not loaded, null=absent
let manifestLoading: Promise<void> | null = null
let currentClip: HTMLAudioElement | null = null

// Clips baked in at build time as data URIs (see scripts/build-artifact.mts).
// Empty in every normal build — the single-file artifact build is the only one
// that fills it, because there the /audio directory does not exist.
const seedManifest = (): Record<string, string> | null =>
  Object.keys(INLINE_AUDIO).length > 0 ? { ...INLINE_AUDIO } : null

function loadManifest(): Promise<void> {
  if (!manifestLoading) {
    const seed = seedManifest()
    manifestLoading = fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
      // Real files win over inlined copies when both exist — they stream
      // instead of sitting decoded in memory, and they cover the full corpus.
      .then(async r => { manifest = r.ok ? { ...(seed ?? {}), ...(await r.json()) } : seed })
      .catch(() => { manifest = seed })
  }
  return manifestLoading
}
if (typeof window !== 'undefined') void loadManifest()

/**
 * Lookup key for a clip: lower-cased, letters/digits/apostrophes only, so
 * "Thank you!" and "thank you" are the same utterance. Must match
 * scripts/generate-audio.mts exactly.
 */
export const clipKey = (text: string): string =>
  text.toLowerCase().replace(/[^a-z0-9']/g, '')

/** Play a pre-generated native clip if we have one. Resolves when playback
 *  finishes (or is superseded/fails); null when no clip exists for the text. */
function playClip(text: string, rate: number): Promise<void> | null {
  if (!manifest) return null
  const base = clipKey(text.includes('/') ? text.split('/')[0] : text)
  const slow = rate < 0.8
  const file = (slow && manifest[`slow:${base}`]) || manifest[base]
  if (!file) return null
  currentClip?.pause()
  const src = file.startsWith('data:') ? file : `${import.meta.env.BASE_URL}audio/${file}`
  const a = new Audio(src)
  // If we only have the normal-speed clip, slow it down without pitch shift —
  // a chipmunk or a growl is not what "slow" means.
  if (slow && !manifest[`slow:${base}`]) {
    a.playbackRate = 0.72
    ;(a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true
  }
  currentClip = a
  return new Promise<void>(resolve => {
    // 'pause' covers being superseded by the next utterance, so a sequence
    // driven off these promises can never deadlock.
    const done = (): void => resolve()
    a.addEventListener('ended', done, { once: true })
    a.addEventListener('pause', done, { once: true })
    a.addEventListener('error', done, { once: true })
    a.play().catch(done)
  })
}

// ─── Browser TTS fallback ────────────────────────────────────────────────────

let englishVoice: SpeechSynthesisVoice | null = null
let voicesReady = false

/** Voices that sound like a person rather than a 1990s modem, when present. */
const PREFERRED = /samantha|ava|allison|zoe|google us english|aria|jenny|guy|natural|premium|enhanced/i

function pickEnglishVoice(): void {
  const voices = window.speechSynthesis?.getVoices() ?? []
  const us = voices.filter(v => v.lang.replace('_', '-').toLowerCase() === 'en-us')
  const en = voices.filter(v => v.lang.toLowerCase().startsWith('en'))
  englishVoice =
    us.find(v => PREFERRED.test(v.name)) ??
    us.find(v => !v.localService) ??
    us[0] ??
    en.find(v => PREFERRED.test(v.name)) ??
    en[0] ??
    null
  voicesReady = true
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickEnglishVoice()
  window.speechSynthesis.onvoiceschanged = pickEnglishVoice
}

export function hasEnglishVoice(): boolean {
  if (!voicesReady) pickEnglishVoice()
  return englishVoice != null
}

/** Speak English text. rate < 1 slows down for learners.
 *  Native pre-generated clips first; browser TTS as fallback.
 *  Resolves when the utterance finishes — await it to chain lines back to back
 *  instead of guessing at fixed delays. */
export function speakEnglish(text: string, rate = 0.92): Promise<void> {
  if (manifest === undefined) {
    // Manifest still loading on a very early tap — resolve then play.
    return loadManifest().then(() => speakBackend(text, rate))
  }
  return speakBackend(text, rate)
}

function speakBackend(text: string, rate: number): Promise<void> {
  const clip = playClip(text, rate)
  if (clip) {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    return clip
  }
  if (!('speechSynthesis' in window)) return Promise.resolve()
  window.speechSynthesis.cancel()
  // Tiles and templates may carry a "/" choice (a / an) — speak the first.
  const spoken = text.includes('/') && !/\d\/\d/.test(text) ? text.split('/')[0] : text
  const u = new SpeechSynthesisUtterance(spoken)
  u.lang = 'en-US'
  if (!voicesReady) pickEnglishVoice()
  if (englishVoice) u.voice = englishVoice
  u.rate = rate
  u.pitch = 1
  return new Promise<void>(resolve => {
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
    // Safety net: some engines drop onend for very short utterances.
    window.setTimeout(resolve, 1000 + spoken.length * 90)
  })
}

export function stopSpeech(): void {
  currentClip?.pause()
  currentClip = null
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

// ─── SFX ─────────────────────────────────────────────────────────────────────

let ctx: AudioContext | null = null
function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number, start: number, dur: number,
  type: OscillatorType = 'sine', gainPeak = 0.16,
): void {
  const c = ac()
  const t0 = c.currentTime + start
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gainPeak, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export const sfx = {
  /** Soft marimba-like tap for tiles/buttons. */
  tap(): void {
    tone(520, 0, 0.08, 'triangle', 0.08)
  },
  /** Bright ascending "correct" chime. */
  correct(): void {
    tone(660, 0, 0.16, 'sine', 0.14)
    tone(880, 0.07, 0.22, 'sine', 0.14)
    tone(1320, 0.14, 0.3, 'sine', 0.1)
  },
  /** Gentle descending "not quite" — never punishing. */
  wrong(): void {
    tone(330, 0, 0.18, 'triangle', 0.12)
    tone(262, 0.12, 0.28, 'triangle', 0.1)
  },
  /** Level-up / session-complete fanfare. */
  fanfare(): void {
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => {
      tone(f, i * 0.09, 0.28, 'triangle', 0.13)
      tone(f * 2, i * 0.09 + 0.02, 0.2, 'sine', 0.05)
    })
    tone(1568, 0.42, 0.5, 'sine', 0.09)
  },
  /** Whoosh for screen transitions. */
  whoosh(): void {
    const c = ac()
    const t0 = c.currentTime
    const buf = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
    const src = c.createBufferSource()
    src.buffer = buf
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.setValueAtTime(400, t0)
    f.frequency.exponentialRampToValueAtTime(2400, t0 + 0.22)
    const g = c.createGain()
    g.gain.setValueAtTime(0.06, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25)
    src.connect(f).connect(g).connect(c.destination)
    src.start(t0)
  },
}
