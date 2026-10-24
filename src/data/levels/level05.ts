import type { Level, LexItem, SentencePattern } from '../../core/types'

// Level 5 — Time & Plans. Saying when, making and confirming a meet-up,
// `going to` for a plan already in your head, `will` for the decision you
// make on the spot, `already` / `not yet` for "done or not?" without any
// past tense, and `see you` as the everyday sign-off. The first phonics
// checkpoint sits here, so every item is short and high-frequency.
//
// Readings/IPA are from scripts/reading-anchor.mts (CLAUDE.md §4).

export const items: LexItem[] = [
  {
    id: 'today', type: 'vocab', en: 'today', reading: 'ทู-เดย์', ipa: '/təˈdeɪ/', th: 'วันนี้',
    pos: 'คำกริยาวิเศษณ์', level: 5, tags: ['core', 'time'],
    notes: 'วันนี้ — วางท้ายประโยคได้เลย (I am busy today) หรือขึ้นต้นประโยคก็ได้ ภาษาอังกฤษไม่ต้องมีคำว่า "ใน" นำหน้า: today เฉยๆ ไม่ใช่ in today ออกเสียงเน้นพยางค์หลัง "เดย์" ส่วน "ทู" ข้างหน้าพูดเบาและสั้น',
    examples: [
      { en: 'Are you free today?', reading: 'อาร์ ยู ฟรี ทู-เดย์', th: 'วันนี้คุณว่างไหม' },
      { en: 'I am busy today.', reading: 'ไอ แอ็ม บิซ-ซี่ ทู-เดย์', th: 'วันนี้ฉันไม่ว่าง' },
    ],
  },
  {
    id: 'tomorrow', type: 'vocab', en: 'tomorrow', reading: 'ทู-มอ-โรว์', ipa: '/təˈmɑˌroʊ/', th: 'พรุ่งนี้',
    pos: 'คำกริยาวิเศษณ์', level: 5, tags: ['core', 'time'],
    notes: 'พรุ่งนี้ ใช้เหมือน today: ไว้ท้ายประโยค ไม่มีคำบุพบทนำหน้า จะบอกว่า "พรุ่งนี้เช้า" ก็เรียงเหมือนไทยเลย: tomorrow morning เน้นพยางค์กลาง "มอ" ให้ชัด พยางค์แรกและพยางค์ท้ายเบา',
    mnemonic: 'ทู-มอ-โรว์ สามพยางค์ เน้นตรงกลาง — เหมือนจังหวะเคาะ เบา-หนัก-เบา',
    examples: [
      { en: 'See you tomorrow!', reading: 'ซี ยู ทู-มอ-โรว์', th: 'พรุ่งนี้เจอกัน!' },
      { en: 'I am going to go to Bangkok tomorrow.', reading: 'ไอ แอ็ม โก-อิง ทู โก ทู แบง-ค็อก ทู-มอ-โรว์', th: 'พรุ่งนี้ฉันจะไปกรุงเทพฯ' },
    ],
  },
  {
    id: 'now', type: 'vocab', en: 'now', reading: 'นาว', ipa: '/naʊ/', th: 'ตอนนี้',
    altTh: ['เดี๋ยวนี้', 'ขณะนี้'], pos: 'คำกริยาวิเศษณ์', level: 5, tags: ['core', 'time'],
    notes: 'ตอนนี้ / เดี๋ยวนี้ ไว้ท้ายประโยค: I am going to go now. พูดคำเดียวเป็นคำถามก็ได้ — Now? แปลว่า "ตอนนี้เลยเหรอ" ภาษาไทยชอบขึ้นต้นด้วย "เดี๋ยว…" แต่ now ของอังกฤษอยู่ท้ายประโยคเกือบเสมอ ออกเสียงสระ "าว" ให้เต็มปาก',
    examples: [
      { en: 'I am going to sleep now.', reading: 'ไอ แอ็ม โก-อิง ทู สลีป นาว', th: 'ฉันกำลังจะนอนแล้ว' },
      { en: 'Are you free now?', reading: 'อาร์ ยู ฟรี นาว', th: 'ตอนนี้คุณว่างไหม' },
    ],
  },
  {
    id: 'later', type: 'vocab', en: 'later', reading: 'เล-เทอร์', ipa: '/ˈleɪtər/', th: 'ทีหลัง',
    altTh: ['ไว้ค่อย', 'เดี๋ยว', 'ภายหลัง'], pos: 'คำกริยาวิเศษณ์', level: 5, tags: ['core', 'time'],
    notes: 'ทีหลัง / เดี๋ยวค่อย — See you later เป็นคำลาที่ได้ยินทุกวัน แม้จะไม่ได้เจอกันจริงๆ ในวันนั้นก็พูดได้ ภาษาไทยขึ้นต้นว่า "เดี๋ยวค่อย…" แต่อังกฤษเอา later ไปไว้ท้ายประโยค: I am going to eat later. เสียง t ตรงกลางพูดเบาๆ "เล-เทอร์"',
    examples: [
      { en: 'See you later!', reading: 'ซี ยู เล-เทอร์', th: 'ไว้เจอกันนะ!' },
      { en: 'I am going to eat later.', reading: 'ไอ แอ็ม โก-อิง ทู อีต เล-เทอร์', th: 'เดี๋ยวฉันค่อยกิน' },
    ],
  },
  {
    id: 'tonight', type: 'vocab', en: 'tonight', reading: 'ทู-ไนต์', ipa: '/təˈnaɪt/', th: 'คืนนี้',
    altTh: ['เย็นนี้'], pos: 'คำกริยาวิเศษณ์', level: 5, tags: ['core', 'time', 'social'],
    notes: 'คืนนี้ คำเดียวจบ ไม่ต้องพูด this night (ฝรั่งไม่พูดแบบนั้น) ครอบคลุมตั้งแต่หัวค่ำถึงดึก จึงใช้นัดกินข้าวเย็นได้: Are you free tonight? ออกเสียง t ท้ายคำให้ได้ยิน "ทู-ไนต์"',
    mnemonic: 'to + night = ถึงคืนนี้ — today, tonight, tomorrow สามคำนี้ขึ้นต้นด้วย "ทู" เหมือนกันหมด',
    examples: [
      { en: 'Are you free tonight?', reading: 'อาร์ ยู ฟรี ทู-ไนต์', th: 'คืนนี้คุณว่างไหม' },
      { en: 'Can we meet tonight?', reading: 'แค็น วี มีต ทู-ไนต์', th: 'คืนนี้เราเจอกันได้ไหม' },
    ],
  },
  {
    id: 'morning', type: 'vocab', en: 'morning', reading: 'มอร์-นิง', ipa: '/ˈmɔrnɪŋ/', th: 'ตอนเช้า',
    altTh: ['เช้า'], pos: 'คำนาม', level: 5, tags: ['core', 'time', 'greeting'],
    notes: 'ตอนเช้า ใช้ได้จนถึงเที่ยง Good morning คือ "สวัสดีตอนเช้า" ที่พนักงานพูดกับลูกค้าทุกเช้า ต่อจาก tomorrow ได้ตรงๆ: tomorrow morning = พรุ่งนี้เช้า ส่วน "ตอนเช้า" เฉยๆ ต้องพูด in the morning ซึ่งจะได้เรียน in ในระดับ 7 ออกเสียง r ห่อลิ้น "มอร์-นิง"',
    examples: [
      { en: 'Good morning!', reading: 'กุด มอร์-นิง', th: 'สวัสดีตอนเช้า!' },
      { en: 'Are you free tomorrow morning?', reading: 'อาร์ ยู ฟรี ทู-มอ-โรว์ มอร์-นิง', th: 'พรุ่งนี้เช้าคุณว่างไหม' },
    ],
  },
  {
    id: 'time', type: 'vocab', en: 'time', reading: 'ไทม์', ipa: '/taɪm/', th: 'เวลา',
    altTh: ['ครั้ง', 'ช่วงเวลา'], pos: 'คำนาม', level: 5, tags: ['core', 'time', 'question'],
    notes: 'เวลา — What time is it? คือ "กี่โมงแล้ว" และ What time? สั้นๆ คือ "กี่โมง" ตอนนัดกัน ภาษาไทยถามด้วย "กี่โมง" แต่อังกฤษถามด้วย what time เสมอ ไม่ใช่ how many time ส่วน "ไม่มีเวลา" คือ I don\'t have time ออกเสียง m ปิดปากท้ายคำ "ไทม์"',
    examples: [
      { en: 'What time is it?', reading: 'วอต ไทม์ อิส อิต', th: 'กี่โมงแล้ว' },
      { en: "I don't have time today.", reading: 'ไอ โดนต์ แฮ็ฟ ไทม์ ทู-เดย์', th: 'วันนี้ฉันไม่มีเวลา' },
    ],
  },
  {
    id: 'going-to', type: 'phrase', en: 'going to', reading: 'โก-อิง ทู', ipa: '/ˈgoʊɪŋ/ /tu/', th: 'กำลังจะ (บอกแผน)',
    altTh: ['จะ (มีแผนอยู่แล้ว)', 'ว่าจะ', 'ตั้งใจจะ'], altEn: ['gonna'], pos: 'คำช่วย', level: 5, tags: ['core', 'grammar', 'time'],
    literal: 'กำลังไป-สู่',
    notes: 'ก้อนคำบอกแผนที่คิดไว้แล้ว ต้องมี am/are นำหน้าเสมอ: I am going to sleep. / Are you going to come? ภาษาไทยใช้ "จะ" คำเดียว แต่อังกฤษใช้สามคำ แล้วตามด้วยกริยารูปธรรมดา พูดเร็วๆ จะได้ยินเป็น gonna (กอน-นะ): I\'m gonna sleep — คำเดียวกัน ความหมายเดียวกัน',
    mnemonic: 'going to = "กำลังเดินไปหา" สิ่งที่จะทำ — แผนอยู่ในหัวแล้ว เหลือแค่เดินไปถึง',
    examples: [
      { en: 'I am going to go home now.', reading: 'ไอ แอ็ม โก-อิง ทู โก โฮม นาว', th: 'ฉันกำลังจะกลับบ้านแล้ว' },
      { en: 'Are you going to come tonight?', reading: 'อาร์ ยู โก-อิง ทู คัม ทู-ไนต์', th: 'คืนนี้คุณจะมาไหม' },
    ],
  },
  {
    id: 'will', type: 'vocab', en: 'will', reading: 'วิล', ipa: '/wɪl/', th: 'จะ (ตัดสินใจตอนนี้)',
    altTh: ['จะ (รับปาก)', 'จะ…ให้'], pos: 'คำช่วย', level: 5, tags: ['core', 'grammar', 'time'],
    notes: 'จะ — แบบที่เพิ่งตัดสินใจเดี๋ยวนั้นหรือรับปาก: มีคนถาม แล้วคุณตอบ Okay, I will go. ต่างจาก going to ที่เป็นแผนซึ่งคิดไว้ก่อนแล้ว ภาษาไทยใช้ "จะ" กับทั้งสองแบบ จึงต้องสังเกตว่าตัดสินใจเมื่อไหร่ will ไม่ต้องมี am/are และตามด้วยกริยารูปธรรมดา พูดเร็วย่อเป็น I\'ll (ไอล์)',
    mnemonic: 'will = ความตั้งใจ (willpower) — พูดตอนที่ตั้งใจขึ้นมาเดี๋ยวนั้น',
    examples: [
      { en: 'I will come tomorrow.', reading: 'ไอ วิล คัม ทู-มอ-โรว์', th: 'พรุ่งนี้ฉันจะมา (รับปาก)' },
      { en: 'Okay, I will go now.', reading: 'โอ-เค ไอ วิล โก นาว', th: 'โอเค งั้นฉันไปเดี๋ยวนี้เลย' },
    ],
  },
  {
    id: 'go', type: 'vocab', en: 'go', reading: 'โก', ipa: '/goʊ/', th: 'ไป',
    altTh: ['ออกไป', 'เดินทางไป'], pos: 'คำกริยา', level: 5, tags: ['core', 'verb', 'travel'],
    notes: 'ไป — ตามด้วย to + สถานที่: go to Bangkok ยกเว้น go home ที่ไม่มี to ประโยค I am going to go now ฟังเหมือนพูดซ้ำแต่ถูกต้องและพูดกันจริง (going to คือก้อนบอกแผน ส่วน go คือกริยาไป) ออกเสียง "โก" ปากกลม ลากเสียงนิดหนึ่ง ไม่ห้วน',
    examples: [
      { en: 'Can we go now?', reading: 'แค็น วี โก นาว', th: 'เราไปตอนนี้เลยได้ไหม' },
      { en: 'I am going to go home now.', reading: 'ไอ แอ็ม โก-อิง ทู โก โฮม นาว', th: 'ฉันกำลังจะกลับบ้านแล้ว' },
    ],
  },
  {
    id: 'come', type: 'vocab', en: 'come', reading: 'คัม', ipa: '/kʌm/', th: 'มา',
    altTh: ['มาหา', 'มาถึง'], pos: 'คำกริยา', level: 5, tags: ['core', 'verb', 'social'],
    notes: 'มา — มาหาคนฟัง จุดที่คนไทยพลาดบ่อย: ภาษาไทยพูด "เดี๋ยวไป" เมื่อจะไปหาคนที่คุยด้วย แต่อังกฤษมองจากฝั่งคนฟัง จึงพูด I will come ไม่ใช่ I will go ตามด้วย to + สถานที่ของเขา: come to your hotel ออกเสียง "คัม" สั้นๆ ปิดปากท้ายคำ',
    mnemonic: 'come = มาหาคนที่กำลังคุยด้วย — ถ้าปลายทางคือ "คุณ" ให้ใช้ come เสมอ แม้ไทยจะพูดว่าไป',
    examples: [
      { en: 'Can you come tomorrow?', reading: 'แค็น ยู คัม ทู-มอ-โรว์', th: 'พรุ่งนี้คุณมาได้ไหม' },
      { en: 'I will come to your hotel.', reading: 'ไอ วิล คัม ทู ยอร์ โฮ-เทล', th: 'เดี๋ยวฉันไปที่โรงแรมคุณเอง' },
    ],
  },
  {
    id: 'see', type: 'vocab', en: 'see', reading: 'ซี', ipa: '/si/', th: 'เห็น',
    altTh: ['เจอ', 'ดู', 'พบ'], pos: 'คำกริยา', level: 5, tags: ['core', 'verb'],
    notes: 'เห็น และ เจอ: see you = เจอคุณ ส่วน "ดู" ที่ตั้งใจมองจะเป็นอีกคำหนึ่งในระดับ 7 ประโยค I see. ได้ยินบ่อยมาก แปลว่า "อ๋อ เข้าใจแล้ว" ไม่ใช่ฉันเห็น ออกเสียง "ซี" ยาวและใส ไม่ใช่ "ซิ"',
    examples: [
      { en: 'I will see you tomorrow.', reading: 'ไอ วิล ซี ยู ทู-มอ-โรว์', th: 'พรุ่งนี้เจอกัน' },
      { en: 'Can you see it?', reading: 'แค็น ยู ซี อิต', th: 'คุณเห็นมันไหม' },
    ],
  },
  {
    id: 'see-you', type: 'phrase', en: 'see you', reading: 'ซี ยู', ipa: '/si/ /ju/', th: 'แล้วเจอกัน',
    altTh: ['เจอกันนะ', 'ไว้เจอกัน', 'แล้วพบกัน'], altEn: ['see ya', 'see you later'], pos: 'วลี', level: 5, tags: ['core', 'social', 'greeting'],
    literal: 'เห็น-คุณ',
    notes: 'คำลาที่ใช้บ่อยพอๆ กับ bye และพูดคู่กันได้: Okay, bye! See you! เติมเวลาต่อท้ายได้เลย See you tomorrow / tonight / later ย่อมาจาก I will see you — ฝรั่งตัด I will ทิ้ง แปลตรงตัวว่า "เห็นคุณ" แต่ความหมายคือแล้วเจอกัน พูดเร็วๆ เป็น see ya',
    examples: [
      { en: 'See you tomorrow!', reading: 'ซี ยู ทู-มอ-โรว์', th: 'พรุ่งนี้เจอกัน!' },
      { en: 'Okay, bye! See you!', reading: 'โอ-เค บาย ซี ยู', th: 'โอเค บาย แล้วเจอกันนะ!' },
    ],
  },
  {
    id: 'meet', type: 'vocab', en: 'meet', reading: 'มีต', ipa: '/mit/', th: 'พบ (นัดเจอ)',
    altTh: ['เจอ', 'เจอกัน', 'พบกัน', 'นัดเจอ'], pos: 'คำกริยา', level: 5, tags: ['core', 'verb', 'social'],
    notes: 'พบ / นัดเจอ ใช้ตอนนัดหมาย (Can we meet tomorrow?) และตอนรู้จักกันครั้งแรก — Nice to meet you ก็มาจากคำนี้ ภาษาไทยพูด "เจอกัน" ต้องมีคำว่ากัน แต่ meet คำเดียวมีความหมาย "กัน" อยู่ในตัวแล้ว ส่วน see คือเจอแบบบังเอิญหรือแวะไปหา ออกเสียง t ท้ายคำ "มีต"',
    examples: [
      { en: 'Can we meet tomorrow?', reading: 'แค็น วี มีต ทู-มอ-โรว์', th: 'พรุ่งนี้เราเจอกันได้ไหม' },
      { en: 'Nice to meet you, Tom.', reading: 'ไนส์ ทู มีต ยู ทอม', th: 'ยินดีที่ได้รู้จักนะทอม' },
    ],
  },
  {
    id: 'free', type: 'vocab', en: 'free', reading: 'ฟรี', ipa: '/fri/', th: 'ว่าง',
    altTh: ['มีเวลา', 'ฟรี (ไม่เสียเงิน)'], pos: 'คำคุณศัพท์', level: 5, tags: ['core', 'state', 'social'],
    notes: 'ว่าง มีเวลา — ถามว่า "ว่างไหม" คือ Are you free? ตอบ I am free หรือ I am busy ส่วน free ยังแปลว่า ฟรี ไม่เสียเงิน ได้ด้วย (free coffee) ดูจากบริบท ออกเสียง f ฟันบนแตะริมฝีปากล่าง แล้วห่อลิ้น r "ฟรี"',
    mnemonic: 'ฟรี = ว่าง — เวลาที่ "ฟรี" คือเวลาที่ยังไม่มีใครจอง',
    examples: [
      { en: 'Are you free tomorrow?', reading: 'อาร์ ยู ฟรี ทู-มอ-โรว์', th: 'พรุ่งนี้คุณว่างไหม' },
      { en: 'I am free tonight.', reading: 'ไอ แอ็ม ฟรี ทู-ไนต์', th: 'คืนนี้ฉันว่าง' },
    ],
  },
  {
    id: 'busy', type: 'vocab', en: 'busy', reading: 'บิซ-ซี่', ipa: '/ˈbɪzi/', th: 'ยุ่ง',
    altTh: ['ไม่ว่าง', 'งานยุ่ง'], pos: 'คำคุณศัพท์', level: 5, tags: ['core', 'state', 'work'],
    notes: 'ยุ่ง / ไม่ว่าง — วิธีปฏิเสธนัดที่สุภาพและพอแล้ว: Sorry, I am busy tomorrow. ไม่ต้องอธิบายเหตุผลเพิ่ม ระวังเสียง: สะกดด้วย u แต่อ่าน "บิซ-ซี่" ไม่ใช่ "บัส-ซี่" และ s ตรงกลางออกเสียงก้องเหมือน z',
    mnemonic: 'busy bee — ผึ้งที่ยุ่งตลอดเวลา เสียง "บิซ" เหมือนเสียงผึ้งบิน',
    examples: [
      { en: 'Sorry, I am busy today.', reading: 'ซอ-รี่ ไอ แอ็ม บิซ-ซี่ ทู-เดย์', th: 'ขอโทษนะ วันนี้ฉันไม่ว่าง' },
      { en: 'Are you busy now?', reading: 'อาร์ ยู บิซ-ซี่ นาว', th: 'ตอนนี้คุณยุ่งอยู่ไหม' },
    ],
  },
  {
    id: 'already', type: 'vocab', en: 'already', reading: 'ออล-เรด-ดี้', ipa: '/ɔlˈrɛdi/', th: 'แล้ว (ทำไปแล้ว)',
    altTh: ['เรียบร้อยแล้ว', 'อยู่แล้ว'], pos: 'คำกริยาวิเศษณ์', level: 5, tags: ['core', 'time', 'grammar'],
    notes: 'แล้ว (ทำไปแล้ว) ภาษาไทยวาง "แล้ว" ไว้ท้ายประโยค แต่อังกฤษวาง already ไว้หลัง am/are หรือหน้ากริยาหลัก: I am already home. / I already have a taxi. ตอบคำถาม "…แล้วหรือยัง" สั้นๆ ว่า Yes, already ก็ได้ คู่ตรงข้ามคือ not yet เน้นพยางค์กลาง "เรด"',
    examples: [
      { en: 'I am already home.', reading: 'ไอ แอ็ม ออล-เรด-ดี้ โฮม', th: 'ฉันถึงบ้านแล้ว' },
      { en: 'I already have a taxi.', reading: 'ไอ ออล-เรด-ดี้ แฮ็ฟ อะ แทก-ซี่', th: 'ฉันมีแท็กซี่แล้ว' },
    ],
  },
  {
    id: 'not-yet', type: 'phrase', en: 'not yet', reading: 'นอต เย็ต', ipa: '/nɑt/ /jɛt/', th: 'ยัง (ยังไม่ได้ทำ)',
    altTh: ['ยังเลย', 'ยังไม่'], pos: 'วลี', level: 5, tags: ['core', 'time', 'grammar'],
    literal: 'ไม่-จนถึงตอนนี้',
    notes: 'ยัง / ยังเลย — คำตอบสั้นๆ ของคำถามว่าทำแล้วหรือยัง ภาษาไทยตอบ "ยัง" คำเดียว แต่อังกฤษต้องพูดสองคำ not yet เสมอ (ตอบ not หรือ yet คำเดียวไม่ได้) จำเป็นคู่กับ already: Yes, already. / Not yet. ออกเสียง t ท้ายทั้งสองคำให้ได้ยิน',
    examples: [
      { en: 'Not yet. I am going to eat later.', reading: 'นอต เย็ต ไอ แอ็ม โก-อิง ทู อีต เล-เทอร์', th: 'ยังเลย เดี๋ยวฉันค่อยกิน' },
      { en: 'Not yet, I am busy now.', reading: 'นอต เย็ต ไอ แอ็ม บิซ-ซี่ นาว', th: 'ยังเลย ตอนนี้ฉันยุ่งอยู่' },
    ],
  },
  {
    id: 'sleep', type: 'vocab', en: 'sleep', reading: 'สลีป', ipa: '/slip/', th: 'นอน',
    altTh: ['หลับ', 'นอนหลับ'], pos: 'คำกริยา', level: 5, tags: ['core', 'verb', 'health'],
    notes: 'นอนหลับ — ภาษาไทย "นอน" ใช้ได้ทั้งนอนเล่นและนอนหลับ แต่ sleep คือหลับเท่านั้น จะเข้านอนพูด I am going to sleep. ออกเสียง ส นำ แล้วตามด้วย ล ติดกัน "สลีป" ไม่ใช่ "สะ-ลีป" และ p ปิดปากท้ายคำ',
    examples: [
      { en: 'I am so tired. I want to sleep.', reading: 'ไอ แอ็ม โซ ไทร์ด ไอ วอนต์ ทู สลีป', th: 'ฉันเหนื่อยมาก อยากนอนแล้ว' },
      { en: 'Are you going to sleep now?', reading: 'อาร์ ยู โก-อิง ทู สลีป นาว', th: 'คุณจะนอนแล้วเหรอ' },
    ],
  },
  {
    id: 'home', type: 'vocab', en: 'home', reading: 'โฮม', ipa: '/hoʊm/', th: 'บ้าน',
    altTh: ['ที่บ้าน', 'กลับบ้าน'], pos: 'คำนาม', level: 5, tags: ['core', 'place'],
    notes: 'บ้าน ในความหมาย "ที่ที่เรากลับไป" กฎพิเศษที่คนไทยพลาดบ่อยที่สุด: go home ไม่มี to (ไม่ใช่ go to home) เพราะ home บอกทิศทางในตัวอยู่แล้ว I am going to go home. = ฉันจะกลับบ้าน ออกเสียง "โฮม" ปิดปากท้ายคำ',
    mnemonic: 'home ไม่ต้องมี to — บ้านอยู่ใกล้ใจ ไม่ต้องชี้ทาง',
    examples: [
      { en: 'I am going to go home now.', reading: 'ไอ แอ็ม โก-อิง ทู โก โฮม นาว', th: 'ฉันกำลังจะกลับบ้านแล้ว' },
      { en: 'Can we go home?', reading: 'แค็น วี โก โฮม', th: 'เรากลับบ้านกันได้ไหม' },
    ],
  },
  {
    id: 'to', type: 'vocab', en: 'to', reading: 'ทู', ipa: '/tu/', th: 'ไปยัง (บอกปลายทาง)',
    altTh: ['ถึง', 'สู่', 'ไปที่'], pos: 'คำบุพบท', level: 5, tags: ['core', 'grammar', 'travel'],
    notes: 'คำบอกปลายทาง วางหน้าสถานที่: go to Bangkok, come to my hotel ภาษาไทยพูด "ไปกรุงเทพฯ" ติดกันเลย แต่อังกฤษต้องมี to คั่น ยกเว้น home (go home) และ here (come here) อย่าสับสนกับ to ใน want to และ going to — ตัวนั้นเป็นส่วนหนึ่งของก้อนคำ ไม่ได้บอกทิศทาง พูดเร็วๆ จะเบาลงเป็น "ทะ"',
    mnemonic: 'to = ลูกศร → ชี้ไปที่ปลายทาง',
    examples: [
      { en: 'I will come to your hotel tomorrow.', reading: 'ไอ วิล คัม ทู ยอร์ โฮ-เทล ทู-มอ-โรว์', th: 'พรุ่งนี้ฉันจะไปที่โรงแรมคุณ' },
      { en: 'Can we go to the hotel now?', reading: 'แค็น วี โก ทู เดอะ โฮ-เทล นาว', th: 'เราไปโรงแรมตอนนี้เลยได้ไหม' },
    ],
  },
  {
    id: 'we', type: 'vocab', en: 'we', reading: 'วี', ipa: '/wi/', th: 'เรา',
    altTh: ['พวกเรา'], pos: 'คำสรรพนาม', level: 5, tags: ['core', 'pronoun', 'grammar'],
    notes: 'เรา = ฉันกับคนอื่นอย่างน้อยอีกหนึ่งคน (พวกเรา) ใช้กับ are เหมือน you: We are free tonight. ระวังนิสัยไทย: ภาษาไทยใช้ "เรา" แทนตัวเองคนเดียวได้ (เราไปก่อนนะ) แต่ we หมายถึงหลายคนเสมอ — ถ้าหมายถึงตัวเองคนเดียวต้องพูด I',
    examples: [
      { en: 'Can we meet tomorrow?', reading: 'แค็น วี มีต ทู-มอ-โรว์', th: 'พรุ่งนี้เราเจอกันได้ไหม' },
      { en: 'We are free tonight.', reading: 'วี อาร์ ฟรี ทู-ไนต์', th: 'คืนนี้เราว่าง' },
    ],
  },
]

export const patterns: SentencePattern[] = [
  {
    id: 'p-i-am-going-to', level: 5,
    name: 'I am going to ___ ___',
    enTemplate: 'I am going to {verb} {time}',
    readingTemplate: 'ไอ แอ็ม โก-อิง ทู {verb} {time}',
    thTemplate: 'ฉันจะ{verb}{time}',
    slots: [
      { name: 'verb', itemIds: ['go', 'come', 'sleep', 'eat', 'drink'] },
      { name: 'time', itemIds: ['today', 'tomorrow', 'now', 'later', 'tonight'] },
    ],
    // Bare `sleep` / `eat` / `drink` with a whole day attached reads as odd English
    // ("I am going to sleep tomorrow"); keep them to the near-term words.
    compat: {
      sleep: ['now', 'later'],
      eat: ['now', 'later'],
      drink: ['later', 'tonight'],
    },
    thOverrides: {
      'go+now': 'ฉันกำลังจะไปแล้ว',
      'come+now': 'ฉันกำลังจะมาแล้ว',
      'sleep+now': 'ฉันกำลังจะนอนแล้ว',
      'eat+now': 'ฉันกำลังจะกินแล้ว',
      'drink+tonight': 'คืนนี้ฉันจะไปดื่ม',
    },
    explanation:
      'ภาษาไทยพูด "ฉันจะนอน" ด้วย จะ คำเดียว แต่ภาษาอังกฤษต้องมี am (หรือ are กับ you และ we) ก่อน going to เสมอ แล้วจึงตามด้วยกริยารูปธรรมดา: I am going to sleep. ' +
      'โครงนี้ใช้กับแผนที่คิดไว้แล้ว ส่วน will ใช้ตอนเพิ่งตัดสินใจเดี๋ยวนั้น — ไทยใช้ จะ ทั้งสองแบบ จึงต้องสังเกตว่าตัดสินใจเมื่อไหร่ ' +
      'คำบอกเวลา (now, tomorrow, tonight) ไว้ท้ายประโยค พูดเร็วๆ จะได้ยินเป็น I\'m gonna (ไอม์ กอน-นะ) ซึ่งเป็นประโยคเดียวกัน',
    showcase: [{ verb: 'sleep', time: 'now' }, { verb: 'eat', time: 'later' }, { verb: 'come', time: 'tonight' }],
    distractors: ['will', 'are', 'we', 'busy'],
  },
  {
    id: 'p-are-you-free', level: 5,
    name: 'Are you free ___?',
    enTemplate: 'Are you free {time}',
    readingTemplate: 'อาร์ ยู ฟรี {time}',
    thTemplate: 'คุณว่าง{time}ไหม',
    slots: [{ name: 'time', itemIds: ['today', 'tomorrow', 'now', 'later', 'tonight'] }],
    thOverrides: { later: 'เดี๋ยวคุณว่างไหม' },
    explanation:
      'โครง Are you … จากระดับ 1 ใส่คำคุณศัพท์ free แล้วต่อด้วยคำบอกเวลา: Are you free tomorrow? ไม่มีคำว่า "ไหม" — การเอา are ขึ้นหน้า you คือคำถามแล้ว ' +
      'ภาษาไทยถาม "ว่างไหม" โดยไม่มีประธาน แต่อังกฤษต้องมี you เสมอ ' +
      'ตอบว่า Yes, I am free หรือ No, I am busy — ไม่ตอบ free ห้วนๆ คำเดียว และคำบอกเวลาไว้ท้ายประโยคเสมอ',
    showcase: [{ time: 'tomorrow' }, { time: 'tonight' }, { time: 'now' }],
    distractors: ['busy', 'am', 'i', 'will'],
  },
  {
    id: 'p-can-we', level: 5,
    name: 'Can we ___ ___?',
    enTemplate: 'Can we {verb} {time}',
    readingTemplate: 'แค็น วี {verb} {time}',
    thTemplate: 'เรา{verb}{time}ได้ไหม',
    slots: [
      { name: 'verb', itemIds: ['meet', 'go', 'eat', 'drink', 'come'] },
      { name: 'time', itemIds: ['today', 'tomorrow', 'now', 'later', 'tonight'] },
    ],
    compat: { eat: ['now', 'later', 'tonight'], drink: ['later', 'tonight'] },
    thOverrides: {
      'meet+today': 'วันนี้เราเจอกันได้ไหม',
      'meet+tomorrow': 'พรุ่งนี้เราเจอกันได้ไหม',
      'meet+now': 'เราเจอกันตอนนี้เลยได้ไหม',
      'meet+later': 'เดี๋ยวเราค่อยเจอกันได้ไหม',
      'meet+tonight': 'คืนนี้เราเจอกันได้ไหม',
      'eat+tonight': 'คืนนี้เรากินข้าวกันได้ไหม',
      'drink+tonight': 'คืนนี้เราไปดื่มกันได้ไหม',
      'drink+later': 'เดี๋ยวเราค่อยไปดื่มกันได้ไหม',
    },
    explanation:
      'can (ระดับ 3) + we = ชวนหรือเสนอให้ทำด้วยกัน ภาษาไทยเอา "ได้ไหม" ไว้ท้ายประโยค แต่อังกฤษเอา Can ขึ้นต้น แล้วตามด้วย we และกริยารูปธรรมดา: Can we meet tomorrow? ' +
      'we คือเรา — ฉันกับคุณ — ไม่ใช่ฉันคนเดียว ถ้าถามเพื่อตัวเองคนเดียวใช้ Can I … ' +
      'ตอบรับว่า Yes! หรือ Okay และปฏิเสธนุ่มๆ ว่า Sorry, I am busy',
    showcase: [{ verb: 'meet', time: 'tomorrow' }, { verb: 'eat', time: 'now' }, { verb: 'go', time: 'later' }],
    distractors: ['i', 'are', 'you', 'free'],
  },
]

export const level: Level = {
  n: 5,
  title: 'เวลาและแผน',
  titleEn: 'Time & Plans',
  subtitle: 'วันนี้ พรุ่งนี้ ตอนนี้ กำลังจะทำอะไร นัดเจอกัน แล้วเจอกัน',
  icon: '⏰',
  canDo: [
    'บอกได้ว่ากำลังจะทำอะไร วันนี้ พรุ่งนี้ หรือคืนนี้',
    'ถามว่าอีกฝ่ายว่างไหม และตอบว่าว่างหรือไม่ว่าง',
    'ชวนและนัดเจอกันด้วย Can we meet …? และปิดท้ายด้วย See you …',
    'ถามและบอกเวลาแบบง่าย (What time is it? / now / later)',
    'ตอบได้ว่า "แล้ว" หรือ "ยัง" ด้วย already / not yet',
  ],
  itemIds: [
    'today', 'tomorrow', 'now', 'later', 'tonight', 'morning', 'time',
    'going-to', 'will', 'go', 'come', 'see', 'see-you', 'meet',
    'free', 'busy', 'already', 'not-yet', 'sleep', 'home', 'to', 'we',
  ],
  patternIds: ['p-i-am-going-to', 'p-are-you-free', 'p-can-we'],
}
