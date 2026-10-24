import type { Level, LexItem, SentencePattern } from '../../core/types'

// Level 3 — prices, places and the numbers 1–100.
// The taxi, the market stall, the hotel lobby, the ticket counter. Oversized
// by design: 28 of the 43 items are numbers, paced by the daily new-item
// budget. Grammar: wh- word order (How much is / Where is the), plural -s
// after two and up, `the` for the thing both people know, `can` on its own.
//
// Readings/IPA are from scripts/reading-anchor.mts (CLAUDE.md §4).

export const items: LexItem[] = [
  // ── numbers 1–10 ──────────────────────────────────────────────────────────
  {
    id: 'one', type: 'vocab', en: 'one', reading: 'วัน', ipa: '/wʌn/', th: 'หนึ่ง',
    altTh: ['อันหนึ่ง', 'เดียว'], pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'นับหนึ่ง และวางหน้าคำนามได้เลย: one coffee = กาแฟหนึ่งแก้ว ภาษาอังกฤษไม่มีลักษณนาม (แก้ว ขวด ใบ) ตัวเลขอยู่หน้าคำนามตรงๆ อ่านว่า "วัน" ไม่ใช่ "โอน"',
    mnemonic: 'สะกด o-n-e แต่อ่าน "วัน" — หนึ่งวัน จำคู่กันไปเลย',
    examples: [{ en: 'One coffee, please.', reading: 'วัน คอฟ-ฟี่ พลีส', th: 'ขอกาแฟหนึ่งแก้ว' }],
  },
  {
    id: 'two', type: 'vocab', en: 'two', reading: 'ทู', ipa: '/tu/', th: 'สอง',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'ตั้งแต่ two ขึ้นไป คำนามต้องเติม -s: two beers ไม่ใช่ two beer ภาษาไทยไม่เปลี่ยนคำนามเลย นี่คือจุดที่คนไทยพลาดบ่อยที่สุด ออกเสียง "ทู" ปล่อยลมที่ t',
    mnemonic: 'two อ่าน "ทู" เสียงเดียวกับ too และ to — สะกดต่างกัน เสียงเดียวกัน',
    examples: [{ en: 'Two beers, please.', reading: 'ทู เบียร์ส พลีส', th: 'ขอเบียร์สองขวด' }],
  },
  {
    id: 'three', type: 'vocab', en: 'three', reading: 'ธรี', ipa: '/θri/', th: 'สาม',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'เสียง th ต้นคำ: แลบลิ้นแตะฟันบนแล้วปล่อยลม ไม่ใช่ "ทรี" และไม่ใช่ "ซรี" ถ้าพูดเป็น tree จะกลายเป็นต้นไม้',
    mnemonic: 'ลิ้นแตะฟันก่อน แล้วค่อย "รี" — ธรี',
    examples: [{ en: 'Three tickets, please.', reading: 'ธรี ทิก-เก็ตส์ พลีส', th: 'ขอตั๋วสามใบ' }],
  },
  {
    id: 'four', type: 'vocab', en: 'four', reading: 'โฟร์', ipa: '/fɔr/', th: 'สี่',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'อ่าน "โฟร์" เสียงเดียวกับ for ออกเสียง f ให้ฟันบนแตะริมฝีปากล่าง ไม่ใช่ "โพร์" สะกด four แต่พอเป็น 40 จะตัด u ออก (forty)',
    examples: [{ en: 'Can I have four coffees, please?', reading: 'แค็น ไอ แฮ็ฟ โฟร์ คอฟ-ฟีส พลีส', th: 'ขอกาแฟสี่แก้วได้ไหม' }],
  },
  {
    id: 'five', type: 'vocab', en: 'five', reading: 'ไฟฟ์', ipa: '/faɪv/', th: 'ห้า',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'ลงท้ายด้วยเสียง v (ไฟฟ์) ริมฝีปากล่างแตะฟันบนตอนจบคำ ไม่ใช่ "ไฟ" ห้วนๆ',
    examples: [{ en: 'It is five baht.', reading: 'อิต อิส ไฟฟ์ บาท', th: 'ห้าบาท' }],
  },
  {
    id: 'six', type: 'vocab', en: 'six', reading: 'ซิกซ์', ipa: '/sɪks/', th: 'หก',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'ลงท้ายด้วยสองเสียงติดกัน k-s (ซิกส์) คนไทยมักพูดแค่ "ซิก" แล้วฝรั่งได้ยินเป็น sick (ป่วย) ออกเสียง s ท้ายให้ชัด',
    examples: [{ en: 'Can I have six tickets, please?', reading: 'แค็น ไอ แฮ็ฟ ซิกซ์ ทิก-เก็ตส์ พลีส', th: 'ขอตั๋วหกใบได้ไหม' }],
  },
  {
    id: 'seven', type: 'vocab', en: 'seven', reading: 'เซ-เว็น', ipa: '/ˈsɛvən/', th: 'เจ็ด',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'สองพยางค์ เน้นพยางค์แรก "เซ" พยางค์หลังเบาๆ ตัว v ตรงกลางให้ฟันแตะริมฝีปาก คุณคุ้นเสียงนี้จาก 7-Eleven อยู่แล้ว',
    examples: [{ en: 'It is seven baht.', reading: 'อิต อิส เซ-เว็น บาท', th: 'เจ็ดบาท' }],
  },
  {
    id: 'eight', type: 'vocab', en: 'eight', reading: 'เอต', ipa: '/eɪt/', th: 'แปด',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'สะกดแปลก — gh ไม่ออกเสียง อ่านแค่ "เอต" เสียงเดียวกับ ate ปิดท้ายด้วย t เบาๆ',
    mnemonic: 'ตัวอักษรเยอะ แต่เสียงสั้นนิดเดียว: เอต',
    examples: [{ en: 'Eight tickets, please.', reading: 'เอต ทิก-เก็ตส์ พลีส', th: 'ขอตั๋วแปดใบ' }],
  },
  {
    id: 'nine', type: 'vocab', en: 'nine', reading: 'ไนน์', ipa: '/naɪn/', th: 'เก้า',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'อ่าน "ไนน์" ปิดปากด้วยเสียง n ท้ายคำ สระยาวแบบ ไอ ไม่ใช่ "นาย"',
    examples: [{ en: 'Nine beers? Okay!', reading: 'ไนน์ เบียร์ส โอ-เค', th: 'เบียร์เก้าขวดเหรอ โอเค!' }],
  },
  {
    id: 'ten', type: 'vocab', en: 'ten', reading: 'เท็น', ipa: '/tɛn/', th: 'สิบ',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'สระสั้น "เท็น" ปิดท้ายด้วย n ชัดๆ เลข 11–19 และ 20–90 สร้างจากสิบทั้งนั้น แต่ภาษาอังกฤษไม่พูด "สิบ-หนึ่ง" — แต่ละตัวมีคำของมันเอง',
    examples: [{ en: 'It is ten baht.', reading: 'อิต อิส เท็น บาท', th: 'สิบบาท' }],
  },

  // ── 11–19 ─────────────────────────────────────────────────────────────────
  {
    id: 'eleven', type: 'vocab', en: 'eleven', reading: 'อิ-เล-เว็น', ipa: '/ɪˈlɛvən/', th: 'สิบเอ็ด',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'สิบเอ็ดกับสิบสองมีคำเฉพาะ ไม่ได้ลงท้าย -teen เน้นพยางค์กลาง "เล" (อิ-เล-เว็น)',
    mnemonic: '7-Eleven — คุณพูดคำนี้ได้อยู่แล้วทุกวัน',
    examples: [{ en: 'It is eleven baht.', reading: 'อิต อิส อิ-เล-เว็น บาท', th: 'สิบเอ็ดบาท' }],
  },
  {
    id: 'twelve', type: 'vocab', en: 'twelve', reading: 'ทเวลฟ์', ipa: '/twɛlv/', th: 'สิบสอง',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'คำเฉพาะเหมือน eleven อ่าน "ทเวลฟ์" — tw ต้นคำ (ท แล้วห่อปากเป็น ว ทันที) และ lv ท้ายคำ พูดช้าๆ ได้ ฝรั่งเข้าใจ',
    examples: [{ en: 'Twelve baht, please.', reading: 'ทเวลฟ์ บาท พลีส', th: 'ทั้งหมดสิบสองบาท' }],
  },
  {
    id: 'thirteen', type: 'vocab', en: 'thirteen', reading: 'เธอร์-ทีน', ipa: '/ˈθɜrˈtin/', th: 'สิบสาม',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: '-teen = สิบ+ (13–19) เน้นเสียงที่ "ทีน" ให้ยาวและดัง ส่วน thirty (30) เน้นพยางค์แรก คู่นี้ฝรั่งเองยังฟังสับสน บอกราคาให้พูดช้าและชัด',
    mnemonic: 'teen ยาว = วัยรุ่น (13–19) · ty สั้น = หลักสิบ (30–90)',
    examples: [{ en: 'Thirteen? No, thirty.', reading: 'เธอร์-ทีน โน เธอร์-ตี้', th: 'สิบสามเหรอ ไม่ใช่ สามสิบ' }],
  },
  {
    id: 'fourteen', type: 'vocab', en: 'fourteen', reading: 'ฟอร์-ทีน', ipa: '/ˈfɔrˈtin/', th: 'สิบสี่',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'four + teen เน้นที่ "ทีน" คู่สับสนคือ forty (40) ที่เน้นพยางค์แรก',
    examples: [{ en: 'Fourteen baht, please.', reading: 'ฟอร์-ทีน บาท พลีส', th: 'ทั้งหมดสิบสี่บาท' }],
  },
  {
    id: 'fifteen', type: 'vocab', en: 'fifteen', reading: 'ฟิฟ-ทีน', ipa: '/fɪfˈtin/', th: 'สิบห้า',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'ไม่ใช่ five-teen — สะกด fif- (ฟิฟ) เหมือน fifty เน้นที่ "ทีน"',
    examples: [{ en: 'It is fifteen baht.', reading: 'อิต อิส ฟิฟ-ทีน บาท', th: 'สิบห้าบาท' }],
  },
  {
    id: 'sixteen', type: 'vocab', en: 'sixteen', reading: 'ซิกซ์-ทีน', ipa: '/sɪkˈstin/', th: 'สิบหก',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'six + teen เน้นที่ "ทีน" ออกเสียง ks ตรงรอยต่อให้ครบ (ซิกส์-ทีน)',
    examples: [{ en: 'Sixteen baht, please.', reading: 'ซิกซ์-ทีน บาท พลีส', th: 'ทั้งหมดสิบหกบาท' }],
  },
  {
    id: 'seventeen', type: 'vocab', en: 'seventeen', reading: 'เซ-วัน-ทีน', ipa: '/ˈsɛvənˈtin/', th: 'สิบเจ็ด',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'seven + teen สามพยางค์ เน้นพยางค์สุดท้าย',
    examples: [{ en: 'It is seventeen baht.', reading: 'อิต อิส เซ-วัน-ทีน บาท', th: 'สิบเจ็ดบาท' }],
  },
  {
    id: 'eighteen', type: 'vocab', en: 'eighteen', reading: 'เอ-ทีน', ipa: '/eɪˈtin/', th: 'สิบแปด',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'eight + teen อ่าน "เอ-ทีน" ตัว t ตัวเดียวกลางคำ เน้นที่ "ทีน"',
    examples: [{ en: 'Eighteen baht, please.', reading: 'เอ-ทีน บาท พลีส', th: 'ทั้งหมดสิบแปดบาท' }],
  },
  {
    id: 'nineteen', type: 'vocab', en: 'nineteen', reading: 'ไนน์-ทีน', ipa: '/ˈnaɪnˈtin/', th: 'สิบเก้า',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'nine + teen เน้นที่ "ทีน" ตัวสุดท้ายของชุด -teen',
    examples: [{ en: 'It is nineteen baht.', reading: 'อิต อิส ไนน์-ทีน บาท', th: 'สิบเก้าบาท' }],
  },

  // ── tens and hundred ──────────────────────────────────────────────────────
  {
    id: 'twenty', type: 'vocab', en: 'twenty', reading: 'ทเวน-ตี้', ipa: '/ˈtwɛnti/', th: 'ยี่สิบ',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: '21–29 พูดต่อกันตรงๆ: twenty-one, twenty-two … ไม่มีคำว่า "เอ็ด" แบบ ยี่สิบเอ็ด เน้นพยางค์แรก "ทเวน" พูดเร็วๆ t ตัวกลางมักหายเป็น "ทเวน-นี่" บอกอายุก็ใช้คำนี้: I am twenty ไม่ต้องมีคำว่าอายุ',
    examples: [{ en: 'I am twenty.', reading: 'ไอ แอ็ม ทเวน-ตี้', th: 'ฉันอายุยี่สิบ' }],
  },
  {
    id: 'thirty', type: 'vocab', en: 'thirty', reading: 'เธอร์-ตี้', ipa: '/ˈθɜrˌti/', th: 'สามสิบ',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: '-ty = หลักสิบ (30–90) เน้นพยางค์แรก "เธอร์" สั้นและห้วน ต่างจาก thirteen ที่เน้นท้าย ถ้าไม่แน่ใจว่าอีกฝ่ายได้ยิน 13 หรือ 30 ให้ชูนิ้วหรือพิมพ์ตัวเลขให้ดู',
    examples: [{ en: 'I am thirty.', reading: 'ไอ แอ็ม เธอร์-ตี้', th: 'ฉันอายุสามสิบ' }],
  },
  {
    id: 'forty', type: 'vocab', en: 'forty', reading: 'ฟอร์-ตี้', ipa: '/ˈfɔrti/', th: 'สี่สิบ',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'สะกด forty ไม่มี u (ไม่ใช่ fourty) แต่อ่าน "ฟอร์-ตี้" เหมือน four เน้นพยางค์แรก',
    mnemonic: 'สี่สิบ ตัว u หายไป — forty',
    examples: [{ en: 'It is forty baht.', reading: 'อิต อิส ฟอร์-ตี้ บาท', th: 'สี่สิบบาท' }],
  },
  {
    id: 'fifty', type: 'vocab', en: 'fifty', reading: 'ฟิฟ-ตี้', ipa: '/ˈfɪfti/', th: 'ห้าสิบ',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'fif- เหมือน fifteen แต่เน้นพยางค์แรกและลงท้าย -ty สั้นๆ (ฟิฟ-ตี้) ราคาที่ได้ยินบ่อยที่สุดในตลาด',
    examples: [{ en: 'It is fifty baht.', reading: 'อิต อิส ฟิฟ-ตี้ บาท', th: 'ห้าสิบบาท' }],
  },
  {
    id: 'sixty', type: 'vocab', en: 'sixty', reading: 'ซิกซ์-ตี้', ipa: '/ˈsɪksti/', th: 'หกสิบ',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'six + ty เน้นพยางค์แรก ออกเสียง ks ให้ครบก่อน "ตี้"',
    examples: [{ en: 'Sixty baht, please.', reading: 'ซิกซ์-ตี้ บาท พลีส', th: 'ทั้งหมดหกสิบบาท' }],
  },
  {
    id: 'seventy', type: 'vocab', en: 'seventy', reading: 'เซ-เวน-ตี้', ipa: '/ˈsɛvənti/', th: 'เจ็ดสิบ',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'seven + ty สามพยางค์ เน้นพยางค์แรก "เซ" พยางค์กลางเบามาก',
    examples: [{ en: 'It is seventy baht.', reading: 'อิต อิส เซ-เวน-ตี้ บาท', th: 'เจ็ดสิบบาท' }],
  },
  {
    id: 'eighty', type: 'vocab', en: 'eighty', reading: 'เอต-ตี้', ipa: '/ˈeɪti/', th: 'แปดสิบ',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'eight + ty อ่าน "เอต-ตี้" เน้นพยางค์แรก',
    examples: [{ en: 'Eighty baht, please.', reading: 'เอต-ตี้ บาท พลีส', th: 'ทั้งหมดแปดสิบบาท' }],
  },
  {
    id: 'ninety', type: 'vocab', en: 'ninety', reading: 'ไนน์-ตี้', ipa: '/ˈnaɪnti/', th: 'เก้าสิบ',
    pos: 'ตัวเลข', level: 3, tags: ['number', 'core'],
    notes: 'nine + ty สะกด ninety (คง e ไว้) เน้นพยางค์แรก "ไนน์"',
    examples: [{ en: 'It is ninety baht.', reading: 'อิต อิส ไนน์-ตี้ บาท', th: 'เก้าสิบบาท' }],
  },
  {
    id: 'hundred', type: 'vocab', en: 'hundred', reading: 'ฮัน-เดร็ด', ipa: '/ˈhʌndrəd/', th: 'ร้อย',
    altTh: ['หนึ่งร้อย'], pos: 'ตัวเลข', level: 3, tags: ['number', 'core', 'shopping'],
    notes: 'ต้องมีตัวเลขหรือ a นำหน้าเสมอ: one hundred / a hundred = ร้อย, two hundred = สองร้อย และไม่เติม -s แม้มีหลายร้อย (two hundred baht ไม่ใช่ two hundreds) 150 พูดต่อกันตรงๆ เหมือนไทย: one hundred fifty',
    mnemonic: 'ฮัน-เดร็ด — เน้น "ฮัน" พยางค์หลังเบาจนเกือบหาย',
    examples: [{ en: 'It is one hundred fifty baht.', reading: 'อิต อิส วัน ฮัน-เดร็ด ฟิฟ-ตี้ บาท', th: 'ร้อยห้าสิบบาท' }],
  },

  // ── asking, pointing, paying ──────────────────────────────────────────────
  {
    id: 'how-much', type: 'phrase', en: 'how much', reading: 'ฮาว มัช', ipa: '/haʊ/ /mʌtʃ/', th: 'เท่าไหร่ (ราคา)',
    altTh: ['ราคาเท่าไหร่', 'กี่บาท'], altEn: ['how much is it'], pos: 'คำถาม', level: 3, tags: ['question', 'shopping', 'core'],
    literal: 'อย่างไร-มาก',
    notes: 'คำถามราคา ภาษาไทยเอา "เท่าไหร่" ไว้ท้ายประโยค (อันนี้เท่าไหร่) แต่ภาษาอังกฤษเอา How much ขึ้นต้น แล้วตามด้วย is: How much is this? พูดสั้นๆ แค่ How much? พร้อมชี้ของก็เข้าใจกัน ตอบด้วยตัวเลข + baht',
    mnemonic: 'มัช = มาก — ถามว่า "มากเท่าไหร่"',
    examples: [
      { en: 'How much is this?', reading: 'ฮาว มัช อิส ดิส', th: 'อันนี้เท่าไหร่' },
      { en: 'How much is it? Fifty baht.', reading: 'ฮาว มัช อิส อิต ฟิฟ-ตี้ บาท', th: 'เท่าไหร่ — ห้าสิบบาท' },
    ],
  },
  {
    id: 'where', type: 'vocab', en: 'where', reading: 'แวร์', ipa: '/wɛr/', th: 'ที่ไหน',
    altTh: ['ไหน', 'อยู่ไหน'], pos: 'คำถาม', level: 3, tags: ['question', 'place', 'core'],
    notes: 'ถามสถานที่ ภาษาไทยเอา "ที่ไหน" ไว้ท้าย (ห้องน้ำอยู่ที่ไหน) ภาษาอังกฤษเอา Where ขึ้นต้นแล้วตามด้วย is ทันที: Where is the toilet? ออกเสียง "แวร์" ห่อปากตอน w ไม่ใช่ "แฮร์"',
    mnemonic: 'where กับ here คล้องกัน: Where? — Here!',
    examples: [
      { en: 'Where is the toilet?', reading: 'แวร์ อิส เดอะ ทอย-เล็ต', th: 'ห้องน้ำอยู่ที่ไหน' },
      { en: 'Where is my coffee?', reading: 'แวร์ อิส มาย คอฟ-ฟี่', th: 'กาแฟของฉันอยู่ไหน' },
    ],
  },
  {
    id: 'the', type: 'vocab', en: 'the', reading: 'เดอะ', ipa: '/ðə/', th: 'เดอะ (นำหน้าสิ่งที่รู้กันว่าอันไหน)',
    altTh: ['คำนำหน้านามชี้เฉพาะ', 'อันที่ว่า'], pos: 'คำนำหน้านาม', level: 3, tags: ['grammar', 'core'],
    notes: 'ใช้หน้าสิ่งที่ทั้งคุณและคนฟังรู้ว่าหมายถึงอันไหน: the toilet = ห้องน้ำของที่นี่ the hotel = โรงแรมที่เราพัก ต่างจาก a (ระดับ 2) ที่หมายถึงอันไหนก็ได้หนึ่งอัน ภาษาไทยไม่มีคำนี้เลยจึงมักลืม — ท่องเป็นก้อน Where is the … ออกเสียง "เดอะ" เบาและสั้น',
    mnemonic: 'เดอะ = "อันนั้นแหละ" ที่รู้กันอยู่',
    examples: [
      { en: 'Where is the ATM?', reading: 'แวร์ อิส เดอะ เอ-ที-เอ็ม', th: 'ตู้เอทีเอ็มอยู่ที่ไหน' },
      { en: 'The coffee is good.', reading: 'เดอะ คอฟ-ฟี่ อิส กุด', th: 'กาแฟอร่อย' },
    ],
  },
  {
    id: 'here', type: 'vocab', en: 'here', reading: 'เฮียร์', ipa: '/hir/', th: 'ที่นี่',
    altTh: ['ตรงนี้', 'นี่ค่ะ/ครับ (ยื่นของให้)'], pos: 'คำกริยาวิเศษณ์', level: 3, tags: ['place', 'core'],
    notes: 'ตอบคำถาม Where ได้คำเดียว: Here. พร้อมชี้ และใช้ตอนยื่นของให้ — เงิน บัตร ถุง — พูด Here. เหมือน "นี่ค่ะ" ออกเสียง "เฮียร์" มี ร เบาๆ ปิดท้าย ไม่ใช่ "เฮีย"',
    examples: [
      { en: 'The toilet is here.', reading: 'เดอะ ทอย-เล็ต อิส เฮียร์', th: 'ห้องน้ำอยู่ตรงนี้' },
      { en: 'Here. Fifty baht.', reading: 'เฮียร์ ฟิฟ-ตี้ บาท', th: 'นี่ค่ะ/ครับ ห้าสิบบาท' },
    ],
  },
  {
    id: 'it', type: 'vocab', en: 'it', reading: 'อิต', ipa: '/ɪt/', th: 'มัน',
    altTh: ['สิ่งนั้น', 'อันนั้น'], pos: 'คำสรรพนาม', level: 3, tags: ['core', 'grammar', 'pronoun'],
    notes: 'แทนสิ่งของหรือสัตว์ ไม่ใช้กับคน ("มัน" ในภาษาไทยฟังหยาบ แต่ it ในภาษาอังกฤษเป็นคำปกติ) จุดสำคัญ: ภาษาไทยละประธานได้ (ห้าสิบบาท / แพงจัง) แต่ภาษาอังกฤษต้องมีประธานเสมอ จึงใช้ it นำหน้าเมื่อไม่มีใครเป็นประธาน: It is fifty baht. ออกเสียงสั้น "อิต"',
    examples: [
      { en: 'It is fifty baht.', reading: 'อิต อิส ฟิฟ-ตี้ บาท', th: 'ห้าสิบบาท' },
      { en: 'How much is it?', reading: 'ฮาว มัช อิส อิต', th: 'อันนั้นเท่าไหร่' },
    ],
  },
  {
    id: 'excuse-me', type: 'phrase', en: 'excuse me', reading: 'เอ็กซ์-คิวส์ มี', ipa: '/ɪkˈskjus/ /mi/', th: 'ขอโทษค่ะ/ครับ (เรียกคน ขอทาง)',
    altTh: ['ขอทางหน่อย', 'ขอโทษนะคะ/ครับ'], pos: 'วลี', level: 3, tags: ['polite', 'survival', 'social'],
    literal: 'ยกโทษ-ฉัน',
    notes: 'ใช้ก่อนรบกวนใคร: เรียกพนักงาน ขอทางในที่แคบ ถามทางคนแปลกหน้า ส่วน sorry ใช้หลังทำอะไรผิดไปแล้ว — ชนแล้วพูด sorry จะเดินผ่านพูด excuse me ถ้าพูดเสียงขึ้นท้าย Excuse me? แปลว่า พูดอีกทีได้ไหม',
    mnemonic: 'excuse = ขอตัว / ยกโทษ · excuse me = ขอตัวนะ ขอรบกวนนะ',
    examples: [
      { en: 'Excuse me. Where is the toilet?', reading: 'เอ็กซ์-คิวส์ มี แวร์ อิส เดอะ ทอย-เล็ต', th: 'ขอโทษค่ะ/ครับ ห้องน้ำอยู่ที่ไหน' },
      { en: 'Excuse me! Two coffees, please.', reading: 'เอ็กซ์-คิวส์ มี ทู คอฟ-ฟีส พลีส', th: 'ขอโทษค่ะ/ครับ ขอกาแฟสองแก้ว' },
    ],
  },
  {
    id: 'can', type: 'vocab', en: 'can', reading: 'แค็น', ipa: '/kæn/', th: 'ได้ / สามารถ',
    altTh: ['ทำได้', 'ได้ไหม (เมื่อถาม)'], pos: 'คำช่วย', level: 3, tags: ['grammar', 'core'],
    notes: 'คำว่า "ได้" ของภาษาอังกฤษ แต่วางหน้ากริยา ไม่ใช่หลัง: ไทยพูด กินที่นี่ได้ อังกฤษพูด I can eat here. ตามด้วยกริยารูปธรรมดา ไม่มี to ถาม "ได้ไหม" โดยสลับ can มาไว้หน้าประธานเหมือน Are you: Can I …? ออกเสียง "แค็น" สั้น ในประโยคพูดเร็วจะเบาลงเป็น "เคิน"',
    mnemonic: 'แค็น = ได้ — คำเดียวใช้ทั้งขออนุญาต (Can I …?) และบอกว่าทำได้ (I can …)',
    examples: [
      { en: 'Can I eat here?', reading: 'แค็น ไอ อีต เฮียร์', th: 'กินที่นี่ได้ไหม' },
      { en: 'Can I have two, please?', reading: 'แค็น ไอ แฮ็ฟ ทู พลีส', th: 'ขอสองอันได้ไหม' },
    ],
  },
  {
    id: 'baht', type: 'vocab', en: 'baht', reading: 'บาท', ipa: '/bɑt/', th: 'บาท',
    altTh: ['เงินบาท'], pos: 'คำนาม', level: 3, tags: ['shopping', 'survival', 'core'],
    notes: 'ไม่เติม -s แม้หลายบาท: fifty baht ไม่ใช่ fifty bahts และพูดตัวเลขก่อนเสมอ: twenty baht ไม่ใช่ baht twenty ฝรั่งออกเสียง "บาท" ใกล้เคียงไทย บางคนพูด "บัต" ก็ยังหมายถึงบาท',
    examples: [
      { en: 'It is twenty baht.', reading: 'อิต อิส ทเวน-ตี้ บาท', th: 'ยี่สิบบาท' },
      { en: 'One hundred baht, please.', reading: 'วัน ฮัน-เดร็ด บาท พลีส', th: 'ทั้งหมดร้อยบาท' },
    ],
  },

  // ── places ────────────────────────────────────────────────────────────────
  {
    id: 'toilet', type: 'vocab', en: 'toilet', reading: 'ทอย-เล็ต', ipa: '/ˈtɔɪlət/', th: 'ห้องน้ำ',
    altTh: ['สุขา', 'ห้องส้วม'], altEn: ['bathroom', 'restroom'], pos: 'คำนาม', level: 3, tags: ['place', 'survival', 'travel'],
    notes: 'คำที่ใช้ได้ทั่วโลกและในไทย แต่คนอเมริกันมักพูด bathroom หรือ restroom เพราะ toilet สำหรับเขาคือโถส้วม ถ้าคุยกับลูกค้าอเมริกัน restroom จะนุ่มกว่า เน้นพยางค์แรก "ทอย" ลงท้าย t เบาๆ',
    examples: [
      { en: 'Where is the toilet?', reading: 'แวร์ อิส เดอะ ทอย-เล็ต', th: 'ห้องน้ำอยู่ที่ไหน' },
      { en: 'The toilet is not here.', reading: 'เดอะ ทอย-เล็ต อิส นอต เฮียร์', th: 'ห้องน้ำไม่ได้อยู่ตรงนี้' },
    ],
  },
  {
    id: 'hotel', type: 'vocab', en: 'hotel', reading: 'โฮ-เทล', ipa: '/hoʊˈtɛl/', th: 'โรงแรม',
    altTh: ['ที่พัก'], pos: 'คำนาม', level: 3, tags: ['place', 'travel', 'work'],
    notes: 'เน้นพยางค์หลัง "โฮ-เทล" (เทล ดังและยาว) คนไทยเน้นพยางค์แรกว่า "โฮ-เต็ล" ซึ่งฝรั่งฟังยาก ใช้บอกที่พักหรือถามทางกลับที่พักได้ทันที',
    mnemonic: 'โฮ-เทล เน้นท้าย — เหมือนเรียกให้คนหัน: โฮ-เทล!',
    examples: [
      { en: 'Where is the hotel?', reading: 'แวร์ อิส เดอะ โฮ-เทล', th: 'โรงแรมอยู่ที่ไหน' },
      { en: 'My hotel is here.', reading: 'มาย โฮ-เทล อิส เฮียร์', th: 'โรงแรมของฉันอยู่ตรงนี้' },
    ],
  },
  {
    id: 'atm', type: 'vocab', en: 'ATM', reading: 'เอ-ที-เอ็ม', ipa: '/ˈeɪˌtiˈɛm/', th: 'ตู้เอทีเอ็ม',
    altTh: ['ตู้กดเงิน'], altEn: ['cash machine'], pos: 'คำนาม', level: 3, tags: ['place', 'shopping', 'travel'],
    notes: 'อ่านทีละตัวอักษร เอ-ที-เอ็ม เน้นตัวสุดท้าย "เอ็ม" ให้ชัด คำที่นักท่องเที่ยวถามหาบ่อยพอๆ กับห้องน้ำ ใช้กับ the เสมอเมื่อถามทาง: the ATM',
    examples: [
      { en: 'Where is the ATM?', reading: 'แวร์ อิส เดอะ เอ-ที-เอ็ม', th: 'ตู้เอทีเอ็มอยู่ที่ไหน' },
      { en: 'The ATM is here.', reading: 'เดอะ เอ-ที-เอ็ม อิส เฮียร์', th: 'ตู้เอทีเอ็มอยู่ตรงนี้' },
    ],
  },
  {
    id: 'taxi', type: 'vocab', en: 'taxi', reading: 'แทก-ซี่', ipa: '/ˈtæksi/', th: 'แท็กซี่',
    altTh: ['รถแท็กซี่'], altEn: ['cab'], pos: 'คำนาม', level: 3, tags: ['travel', 'place', 'survival'],
    notes: 'คำเดียวกับไทย แต่เน้นพยางค์แรก "แทก" และ x ออกเสียง ks ให้ครบ ใช้เรียกรถหรือถามหาจุดจอดก็ได้ ในอเมริกาได้ยิน cab บ่อยพอกัน',
    examples: [
      { en: 'Where is the taxi?', reading: 'แวร์ อิส เดอะ แทก-ซี่', th: 'แท็กซี่อยู่ที่ไหน' },
      { en: 'I need a taxi.', reading: 'ไอ นีด อะ แทก-ซี่', th: 'ฉันต้องการแท็กซี่' },
    ],
  },

  // ── plurals ───────────────────────────────────────────────────────────────
  {
    id: 'beers', type: 'vocab', en: 'beers', reading: 'เบียร์ส', ipa: '/bɪrz/', th: 'เบียร์ (หลายขวด)',
    altTh: ['เบียร์หลายแก้ว'], pos: 'คำนาม', level: 3, tags: ['food', 'grammar', 'plural'],
    notes: 'เบียร์ตั้งแต่สองขวดขึ้นไป: two beers, three beers ภาษาไทยพูด "เบียร์สองขวด" โดยคำว่าเบียร์ไม่เปลี่ยน แต่ภาษาอังกฤษเติม -s ที่คำนาม และไม่มีลักษณนาม เสียง s ท้ายคำนี้เป็น z เบาๆ "เบียร์ส" ถ้าหายไป ฝรั่งได้ยินว่าขวดเดียว',
    examples: [
      { en: 'Two beers, please.', reading: 'ทู เบียร์ส พลีส', th: 'ขอเบียร์สองขวด' },
      { en: 'Can I have three beers, please?', reading: 'แค็น ไอ แฮ็ฟ ธรี เบียร์ส พลีส', th: 'ขอเบียร์สามขวดได้ไหม' },
    ],
  },
  {
    id: 'coffees', type: 'vocab', en: 'coffees', reading: 'คอฟ-ฟีส', ipa: '/ˈkɑfiz/', th: 'กาแฟ (หลายแก้ว)',
    altTh: ['กาแฟหลายถ้วย'], pos: 'คำนาม', level: 3, tags: ['food', 'grammar', 'plural'],
    notes: 'ในร้าน coffee นับเป็นแก้วได้: two coffees = กาแฟสองแก้ว ปกติ coffee เป็นนามนับไม่ได้ (กาแฟในฐานะเครื่องดื่ม) แต่พอสั่งเป็นแก้วก็เติม -s เหมือนคำนามทั่วไป ออกเสียง s ท้ายให้ได้ยิน',
    examples: [
      { en: 'Two coffees, please.', reading: 'ทู คอฟ-ฟีส พลีส', th: 'ขอกาแฟสองแก้ว' },
      { en: 'Three coffees, no sugar.', reading: 'ธรี คอฟ-ฟีส โน ชุก-เกอร์', th: 'กาแฟสามแก้ว ไม่ใส่น้ำตาล' },
    ],
  },
  {
    id: 'tickets', type: 'vocab', en: 'tickets', reading: 'ทิก-เก็ตส์', ipa: '/ˈtɪkəts/', th: 'ตั๋ว (หลายใบ)',
    altTh: ['ตั๋วหลายใบ', 'บัตร'], pos: 'คำนาม', level: 3, tags: ['travel', 'grammar', 'plural'],
    notes: 'ตั๋วรถไฟฟ้า ตั๋วหนัง ตั๋วเรือ — ตั้งแต่สองใบขึ้นไปเติม -s: two tickets ออกเสียงท้ายคำ ts ติดกัน (ทิก-เก็ตส์) คนไทยมักพูดแค่ "ทิกเก็ต" ซึ่งฟังเป็นใบเดียว รูปเอกพจน์ ticket จะได้เรียนในเรื่องเดินทางระดับหลัง',
    examples: [
      { en: 'Two tickets, please.', reading: 'ทู ทิก-เก็ตส์ พลีส', th: 'ขอตั๋วสองใบ' },
      { en: 'Can I have four tickets, please?', reading: 'แค็น ไอ แฮ็ฟ โฟร์ ทิก-เก็ตส์ พลีส', th: 'ขอตั๋วสี่ใบได้ไหม' },
    ],
  },
]

export const patterns: SentencePattern[] = [
  {
    id: 'p-how-much-is', level: 3,
    name: 'How much is ___?',
    enTemplate: 'How much is {thing}',
    readingTemplate: 'ฮาว มัช อิส {thing}',
    thTemplate: '{thing}ราคาเท่าไหร่',
    slots: [{ name: 'thing', itemIds: ['this', 'this-one', 'it', 'coffee', 'beer', 'water', 'rice', 'chicken', 'tea'] }],
    thOverrides: { this: 'นี่ราคาเท่าไหร่', 'this-one': 'อันนี้ราคาเท่าไหร่', it: 'ราคาเท่าไหร่' },
    explanation:
      'ภาษาไทยถามราคาโดยเอา "เท่าไหร่" ไว้ท้ายประโยค: อันนี้เท่าไหร่ แต่ภาษาอังกฤษกลับด้าน — คำถาม How much ขึ้นต้น ตามด้วย is แล้วค่อยถึงของ: How much is this? ' +
      'สูตรนี้ใช้กับคำถามทุกตัว (what, where, how much): คำถาม + is + สิ่งที่ถาม ' +
      'ตอบด้วยตัวเลข + baht: It is fifty baht. หรือพูดสั้นๆ Fifty baht.',
    showcase: [{ thing: 'this' }, { thing: 'it' }, { thing: 'this-one' }],
    distractors: ['where', 'are', 'what', 'you'],
  },
  {
    id: 'p-where-is-the', level: 3,
    name: 'Where is the ___?',
    enTemplate: 'Where is the {place}',
    readingTemplate: 'แวร์ อิส เดอะ {place}',
    thTemplate: '{place}อยู่ที่ไหน',
    slots: [{ name: 'place', itemIds: ['toilet', 'hotel', 'atm', 'taxi', 'coffee', 'water'] }],
    explanation:
      'สูตรเดียวกับ How much is: คำถาม Where ขึ้นต้น ตามด้วย is แล้วค่อยถึงสถานที่ — กลับกับไทยที่ "ที่ไหน" อยู่ท้าย (ห้องน้ำอยู่ที่ไหน) ' +
      'ใช้ the เพราะทั้งคุณและคนฟังรู้ว่าหมายถึงห้องน้ำของที่นี่ ไม่ใช่ห้องน้ำไหนก็ได้ ' +
      'คำตอบสั้นๆ คือ Here. พร้อมชี้ทาง หรือเต็มประโยค It is here.',
    showcase: [{ place: 'toilet' }, { place: 'atm' }, { place: 'taxi' }],
    distractors: ['how-much', 'are', 'here', 'it'],
  },
  {
    id: 'p-can-i-have-n', level: 3,
    name: 'Can I have ___ ___, please?',
    enTemplate: 'Can I have {number} {things} please',
    readingTemplate: 'แค็น ไอ แฮ็ฟ {number} {things} พลีส',
    thTemplate: 'ขอ{things} {number}ที่หน่อย',
    slots: [
      { name: 'number', itemIds: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'] },
      { name: 'things', itemIds: ['beer', 'coffee', 'beers', 'coffees', 'tickets'] },
    ],
    // `one` keeps the singular; every other number takes the plural.
    compat: {
      one: ['beer', 'coffee'],
      two: ['beers', 'coffees', 'tickets'],
      three: ['beers', 'coffees', 'tickets'],
      four: ['beers', 'coffees', 'tickets'],
      five: ['beers', 'coffees', 'tickets'],
      six: ['beers', 'coffees', 'tickets'],
      seven: ['beers', 'coffees', 'tickets'],
      eight: ['beers', 'coffees', 'tickets'],
    },
    thOverrides: {
      'one+beer': 'ขอเบียร์หนึ่งขวดหน่อย', 'one+coffee': 'ขอกาแฟหนึ่งแก้วหน่อย',
      'two+beers': 'ขอเบียร์สองขวดหน่อย', 'two+coffees': 'ขอกาแฟสองแก้วหน่อย', 'two+tickets': 'ขอตั๋วสองใบหน่อย',
      'three+beers': 'ขอเบียร์สามขวดหน่อย', 'three+coffees': 'ขอกาแฟสามแก้วหน่อย', 'three+tickets': 'ขอตั๋วสามใบหน่อย',
      'four+beers': 'ขอเบียร์สี่ขวดหน่อย', 'four+coffees': 'ขอกาแฟสี่แก้วหน่อย', 'four+tickets': 'ขอตั๋วสี่ใบหน่อย',
      'five+beers': 'ขอเบียร์ห้าขวดหน่อย', 'five+coffees': 'ขอกาแฟห้าแก้วหน่อย', 'five+tickets': 'ขอตั๋วห้าใบหน่อย',
      'six+beers': 'ขอเบียร์หกขวดหน่อย', 'six+coffees': 'ขอกาแฟหกแก้วหน่อย', 'six+tickets': 'ขอตั๋วหกใบหน่อย',
      'seven+beers': 'ขอเบียร์เจ็ดขวดหน่อย', 'seven+coffees': 'ขอกาแฟเจ็ดแก้วหน่อย', 'seven+tickets': 'ขอตั๋วเจ็ดใบหน่อย',
      'eight+beers': 'ขอเบียร์แปดขวดหน่อย', 'eight+coffees': 'ขอกาแฟแปดแก้วหน่อย', 'eight+tickets': 'ขอตั๋วแปดใบหน่อย',
    },
    explanation:
      'ภาษาไทยนับของด้วยลักษณนามหลังคำนาม (เบียร์สองขวด) และคำนามไม่เปลี่ยนรูป ภาษาอังกฤษไม่มีลักษณนาม — ตัวเลขอยู่หน้าคำนามตรงๆ ' +
      'แต่ตั้งแต่สองขึ้นไปคำนามต้องเติม -s: two beers, three tickets มีแค่ one ที่คงรูปเดิม: one beer ' +
      'เสียง s ท้ายคำนี้ห้ามหาย ไม่งั้นฝรั่งได้ยินว่าขวดเดียว please ท้ายประโยคทำให้เป็นคำขอที่สุภาพเหมือนเดิม',
    showcase: [{ number: 'two', things: 'beers' }, { number: 'three', things: 'tickets' }, { number: 'two', things: 'coffees' }],
    distractors: ['beer', 'beers', 'it', 'the'],
  },
]

export const level: Level = {
  n: 3,
  title: 'เดินทางในเมือง',
  titleEn: 'Getting Around',
  subtitle: 'ถามราคา ถามทาง นับเลข 1–100 ขอโทษ/ขออนุญาตแบบสุภาพ',
  icon: '🧭',
  canDo: [
    'ถามราคาและเข้าใจคำตอบเป็นบาทได้ (1–100 และหลักร้อย)',
    'นับเลข 1–100 และบอกจำนวนที่ต้องการได้',
    'ถามว่าห้องน้ำ โรงแรม แท็กซี่ หรือตู้เอทีเอ็มอยู่ที่ไหน',
    'สั่งของหลายชิ้นได้ถูกต้องด้วยรูปพหูพจน์ (two beers)',
    'ใช้ Excuse me เรียกคนและใช้ Sorry ขอโทษได้ถูกสถานการณ์',
  ],
  itemIds: [
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
    'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred',
    'how-much', 'where', 'the', 'here', 'it', 'excuse-me', 'can', 'baht',
    'toilet', 'hotel', 'atm', 'taxi',
    'beers', 'coffees', 'tickets',
  ],
  patternIds: ['p-how-much-is', 'p-where-is-the', 'p-can-i-have-n'],
}
