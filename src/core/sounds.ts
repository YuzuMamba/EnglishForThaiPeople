// ─── English sounds for Thai ears ────────────────────────────────────────────
// The mirror of ChaiThai's tone engine. Thai tone is CALCULATED from spelling;
// English pronunciation is not, so the thing worth a reference screen here is
// different: which sounds Thai does not have, which finals Thai swallows, and
// how stress carries meaning the way tone does in Thai. The sound pairs are
// COMPUTED from the corpus's IPA, so every content batch adds its own.

import { ITEMS } from '../data'
import type { LexItem } from './types'

// ─── The phoneme inventory, tokenised from IPA strings ───────────────────────

/** Multi-character symbols first so the tokenizer never splits them. */
const MULTI = ['tʃ', 'dʒ', 'eɪ', 'aɪ', 'aʊ', 'oʊ', 'ɔɪ', 'ɜr', 'ər', 'ɝ', 'ɚ']
const STRESS = /[ˈˌ.\/\[\]\s]/g

/** IPA string → phoneme tokens, stress marks and slashes dropped. */
export function phonemes(ipa: string): string[] {
  const s = ipa.replace(STRESS, '')
  const out: string[] = []
  for (let i = 0; i < s.length;) {
    const m = MULTI.find(sym => s.startsWith(sym, i))
    if (m) { out.push(m); i += m.length } else { out.push(s[i]); i++ }
  }
  return out
}

// ─── Confusions ──────────────────────────────────────────────────────────────
// Pairs of English phonemes a Thai ear tends to hear as one. Each carries the
// Thai-facing label the UI shows. The order inside a pair does not matter.
export interface Confusion { a: string; b: string; label: string; why: string }
export const CONFUSIONS: Confusion[] = [
  { a: 'r', b: 'l', label: 'r กับ l', why: 'ภาษาไทยพูดเร็วๆ ร กลายเป็น ล — ภาษาอังกฤษแยกเป็นคนละคำ: rice ข้าว / lice เหา' },
  { a: 'v', b: 'w', label: 'v กับ w', why: 'ไทยมีแต่ ว — v ต้องให้ฟันบนแตะริมฝีปากล่าง: very / wary' },
  { a: 'v', b: 'f', label: 'v กับ f', why: 'ปากเหมือนกัน ต่างกันที่ v มีเสียงก้องจากคอ: van / fan' },
  { a: 'θ', b: 't', label: 'th กับ t', why: 'th ลิ้นแตะฟัน t ลิ้นแตะเหงือก: three / tree' },
  { a: 'θ', b: 's', label: 'th กับ s', why: 'คนไทยมักแทน th ด้วย ส: think / sink' },
  { a: 'ð', b: 'd', label: 'th (ก้อง) กับ d', why: 'they ไม่ใช่ day — ลิ้นต้องแตะฟัน' },
  { a: 'ʃ', b: 's', label: 'sh กับ s', why: 'sh ริมฝีปากห่อ ลมยาว: ship / sip' },
  { a: 'tʃ', b: 'ʃ', label: 'ch กับ sh', why: 'ch ระเบิดสั้น sh ลมยาว: chip / ship' },
  { a: 'z', b: 's', label: 'z กับ s', why: 'z ต้องสั่นคอ ไทยไม่มี: zoo / Sue, eyes / ice' },
  { a: 'dʒ', b: 'tʃ', label: 'j กับ ch', why: 'j มีเสียงก้อง ch ไม่มี: jeep / cheap' },
  { a: 'ɪ', b: 'i', label: 'i สั้น กับ ee ยาว', why: 'ไม่ใช่แค่ยาว-สั้น ปากก็ต่าง: ship / sheep, live / leave' },
  { a: 'ɛ', b: 'æ', label: 'e กับ a', why: 'æ อ้าปากกว้างกว่า: bed / bad, men / man' },
  { a: 'ʊ', b: 'u', label: 'u สั้น กับ oo ยาว', why: 'full / fool, pull / pool' },
  { a: 'ʌ', b: 'ɑ', label: 'u กับ o', why: 'cup / cop, luck / lock' },
  { a: 'æ', b: 'ʌ', label: 'a กับ u', why: 'cat / cut, bag / bug' },
  { a: 'b', b: 'p', label: 'b กับ p ท้ายคำ', why: 'ไทยกลืนตัวสะกดทั้งคู่เป็น บ: cab / cap' },
  { a: 'd', b: 't', label: 'd กับ t ท้ายคำ', why: 'bad / bat, need / neat' },
  { a: 'g', b: 'k', label: 'g กับ k ท้ายคำ', why: 'bag / back, dog / dock' },
  { a: 'n', b: 'ŋ', label: 'n กับ ng', why: 'thin / thing, sin / sing' },
  { a: 'l', b: 'n', label: 'l กับ n ท้ายคำ', why: 'ไทยไม่มี ล สะกด เลยกลายเป็น น: ball / bawn, feel / fin' },
]
const confusionOf = (x: string, y: string): Confusion | undefined =>
  CONFUSIONS.find(c => (c.a === x && c.b === y) || (c.a === y && c.b === x))

export interface PairMember {
  id: string
  en: string
  reading: string
  th: string
  level: number
  /** The phoneme this member has at the contrasting position. */
  phone: string
}

export interface MinimalPair {
  /** The confusion this pair demonstrates. */
  confusion: Confusion
  members: [PairMember, PairMember]
  /** Earliest level at which both words are available. */
  level: number
}

const single = (it: LexItem): boolean =>
  !!it.ipa && (it.type === 'vocab') && !/\s/.test(it.en.trim())

/**
 * Every pair of single-word items in the corpus that differ in EXACTLY one
 * phoneme, where that difference is one a Thai ear conflates.
 *
 * Computed, never listed: a hand-written list goes stale the moment content
 * is added, and silently. Memoised because it is O(n²) over the lexicon and
 * the lexicon never changes at runtime.
 */
let memo: MinimalPair[] | null = null
export function minimalPairs(): MinimalPair[] {
  if (memo) return memo
  const words = Object.values(ITEMS).filter(single).map(it => ({ it, ph: phonemes(it.ipa!) }))
  const out: MinimalPair[] = []
  const seen = new Set<string>()
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const A = words[i], B = words[j]
      if (A.ph.length !== B.ph.length || A.it.en.toLowerCase() === B.it.en.toLowerCase()) continue
      let diff = -1
      let ok = true
      for (let k = 0; k < A.ph.length; k++) {
        if (A.ph[k] === B.ph[k]) continue
        if (diff >= 0) { ok = false; break }
        diff = k
      }
      if (!ok || diff < 0) continue
      const c = confusionOf(A.ph[diff], B.ph[diff])
      if (!c) continue
      const key = [A.it.id, B.it.id].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      const mem = (w: typeof A): PairMember => ({
        id: w.it.id, en: w.it.en, reading: w.it.reading, th: w.it.th, level: w.it.level, phone: w.ph[diff],
      })
      const [m1, m2] = A.it.level <= B.it.level ? [mem(A), mem(B)] : [mem(B), mem(A)]
      out.push({ confusion: c, members: [m1, m2], level: Math.max(A.it.level, B.it.level) })
    }
  }
  memo = out.sort((a, b) => a.level - b.level || a.confusion.label.localeCompare(b.confusion.label))
  return memo
}

/** Pairs where the learner has met both words — the ones they can actually be
 *  confused by right now. */
export function metPairs(progress: Record<string, unknown>): MinimalPair[] {
  return minimalPairs().filter(p => p.members.every(m => m.id in progress))
}

// ─── Reference content for the Sounds screen ────────────────────────────────

export interface SoundNote {
  ipa: string
  /** How the course writes it in a reading. */
  reading: string
  title: string
  how: string
  trap: string
  /** Example words — real corpus words preferred, spoken via TTS. */
  examples: string[]
}

/** The sounds Thai does not have, in the order the course meets them. */
export const NEW_SOUNDS: SoundNote[] = [
  {
    ipa: 'v', reading: 'ว (ฟันแตะปาก)', title: 'v — ไม่ใช่ ว',
    how: 'ฟันบนแตะริมฝีปากล่างเหมือนจะพูด ฟ แล้วเปิดเสียงให้คอสั่น',
    trap: 'ถ้าห่อปากกลมจะกลายเป็น w ทันที — very จะกลายเป็น wery',
    examples: ['very', 'have', 'five', 'love'],
  },
  {
    ipa: 'z', reading: 'ซ (สั่น)', title: 'z — ส ที่คอสั่น',
    how: 'วางลิ้นเหมือน ส แล้วเปิดเสียงจากคอ เหมือนเสียงผึ้ง zzz',
    trap: 'ท้ายคำสำคัญมาก: eyes กับ ice, plays กับ place ต่างกันตรงนี้',
    examples: ['zoo', 'easy', 'busy', 'is'],
  },
  {
    ipa: 'θ', reading: 'ธ (ลิ้นแตะฟัน)', title: 'th — ลิ้นออกมาแตะฟัน',
    how: 'แลบปลายลิ้นออกมาแตะฟันบนเบาๆ แล้วเป่าลมผ่าน',
    trap: 'แทนด้วย ส หรือ ท แล้ว think กลายเป็น sink, three กลายเป็น tree',
    examples: ['think', 'thank you', 'three', 'month'],
  },
  {
    ipa: 'ð', reading: 'ด (ลิ้นแตะฟัน)', title: 'th แบบก้อง — the, this, that',
    how: 'ลิ้นแตะฟันเหมือน θ แต่เปิดเสียงจากคอ',
    trap: 'พูดเป็น ด ก็พอฟังออก แต่ they จะฟังเป็น day',
    examples: ['the', 'this', 'that', 'they'],
  },
  {
    ipa: 'ʃ', reading: 'ช (ลมยาว)', title: 'sh — ช ที่ลมยาว',
    how: 'ห่อปากเล็กน้อย ลิ้นถอยหลัง ปล่อยลมยาวเหมือนบอกให้เงียบ shhh',
    trap: 'ไทยมี ช แต่ของเราระเบิดสั้น — ship กับ chip จึงฟังเหมือนกันสำหรับเรา',
    examples: ['she', 'shop', 'fish', 'wish'],
  },
  {
    ipa: 'tʃ', reading: 'ช (ระเบิด)', title: 'ch — ระเบิดแล้วค่อยพ่นลม',
    how: 'เริ่มด้วย ท แล้วปล่อยเป็น sh ในจังหวะเดียว',
    trap: 'ท้ายคำต้องออกเสียงให้ได้ยิน: much, watch, rich',
    examples: ['chair', 'much', 'watch', 'lunch'],
  },
  {
    ipa: 'dʒ', reading: 'จ (ก้อง)', title: 'j — จ ที่มีเสียงก้อง',
    how: 'เหมือน ch แต่เปิดเสียงจากคอ',
    trap: 'ใช้ จ ไทยก็พอได้ แต่จะไม่ก้อง: jeep จะฟังเป็น cheap',
    examples: ['job', 'juice', 'enjoy', 'change'],
  },
  {
    ipa: 'r', reading: 'ร (ห่อลิ้น)', title: 'r — ห่อลิ้น ไม่รัว',
    how: 'ม้วนปลายลิ้นขึ้นโดยไม่แตะเพดาน ริมฝีปากห่อเล็กน้อย',
    trap: 'ร ไทยที่รัวหรือ ล ที่แตะเพดาน — rice กลายเป็น lice',
    examples: ['red', 'right', 'rice', 'sorry'],
  },
]

/** Finals Thai swallows — English releases every one of them. */
export const FINALS: SoundNote[] = [
  {
    ipa: 's / z', reading: 'ส ท้ายคำ', title: 'ตัวสะกด s และ z',
    how: 'ปล่อยลมผ่านฟันจนจบคำ — bus ไม่ใช่ บัด',
    trap: 'พหูพจน์ (cats, dogs) และกริยาบุคคลที่สาม (he works) หายไปทั้งระบบ ถ้าไม่ออกเสียงท้ายคำ',
    examples: ['bus', 'yes', 'please', 'is'],
  },
  {
    ipa: 'l', reading: 'ล ท้ายคำ', title: 'ตัวสะกด l',
    how: 'ปลายลิ้นแตะหลังฟันบนค้างไว้ตอนจบคำ',
    trap: 'ไทยไม่มี ล สะกด คนไทยจึงพูด school เป็น สะ-คูน, ball เป็น บอน',
    examples: ['school', 'well', 'call', 'small'],
  },
  {
    ipa: 'tʃ / ʃ / dʒ', reading: 'ช / จ ท้ายคำ', title: 'ตัวสะกด ch, sh, j',
    how: 'ท้ายคำต้องมีลมพ่นออกมา ไม่ใช่กลืนเป็น ด',
    trap: 'much, wash, change — ถ้าจบด้วย ด จะกลายเป็นคนละคำ',
    examples: ['much', 'wish', 'change', 'watch'],
  },
  {
    ipa: 'f / v / θ', reading: 'ฟ / ธ ท้ายคำ', title: 'ตัวสะกด f, v, th',
    how: 'ฟันบนแตะริมฝีปากล่าง (f, v) หรือลิ้นแตะฟัน (th) แล้วปล่อยลมจนจบ',
    trap: 'five, have, with, both — จบด้วย บ หรือ ด แล้วจะไม่มีใครเข้าใจ',
    examples: ['five', 'have', 'with', 'both'],
  },
  {
    ipa: 'kst / nd / st', reading: 'สะกดซ้อน', title: 'ตัวสะกดซ้อนกันหลายตัว',
    how: 'ออกทีละเสียงต่อกันเร็วๆ — ไทยเขียนตัวที่เกินด้วย ์ แต่ภาษาอังกฤษออกเสียงทุกตัว',
    trap: 'next, friends, first — คนไทยมักเหลือแค่ตัวแรก: เน็ก เฟรน เฟิร์ส',
    examples: ['next', 'friends', 'first', 'asked'],
  },
]

export interface StressRule { title: string; body: string; examples: { en: string; note: string }[] }

/** Stress and tune — the thing that does in English what tone does in Thai. */
export const STRESS_RULES: StressRule[] = [
  {
    title: 'ทุกคำมีพยางค์เดียวที่ดัง ยาว และสูงกว่าเพื่อน',
    body: 'ภาษาไทยทุกพยางค์หนักเท่ากัน ภาษาอังกฤษไม่ใช่ — เน้นผิดพยางค์ คนฟังจะไม่รู้ว่าคำอะไร แม้ทุกเสียงถูก',
    examples: [
      { en: 'water', note: 'WA-ter — เน้นพยางค์แรก' },
      { en: 'hotel', note: 'ho-TEL — เน้นพยางค์หลัง' },
      { en: 'banana', note: 'ba-NA-na — เน้นตรงกลาง' },
    ],
  },
  {
    title: 'คำนามสองพยางค์มักเน้นหน้า คำกริยามักเน้นหลัง',
    body: 'ไม่ใช่กฎตายตัว แต่ถูกบ่อยพอให้เดาได้',
    examples: [
      { en: 'coffee', note: 'COF-fee (นาม)' },
      { en: 'teacher', note: 'TEA-cher (นาม)' },
      { en: 'begin', note: 'be-GIN (กริยา)' },
    ],
  },
  {
    title: 'คำถาม yes/no เสียงขึ้นท้าย คำถาม wh- เสียงลง',
    body: 'ภาษาไทยใช้คำว่า ไหม ภาษาอังกฤษใช้ทำนองเสียง — ประโยคบอกเล่าที่ลงท้ายเสียงขึ้นก็กลายเป็นคำถามได้',
    examples: [
      { en: 'Are you okay?', note: '↗ เสียงขึ้น' },
      { en: 'Where are you from?', note: '↘ เสียงลง' },
      { en: 'You like it?', note: '↗ บอกเล่าที่กลายเป็นคำถาม' },
    ],
  },
  {
    title: 'คำเล็กๆ ถูกกลืน คำใหญ่ถูกเน้น',
    body: 'a, the, to, and, of, can แทบไม่ได้ยิน — ฟังหาคำนามกับกริยาพอ นี่คือเหตุผลที่เจ้าของภาษาพูดแล้วเหมือนเร็วมาก',
    examples: [
      { en: 'a cup of coffee', note: 'ได้ยินแค่ CUP … COF-fee' },
      { en: 'I want to go', note: 'want to → "wanna"' },
    ],
  },
]
