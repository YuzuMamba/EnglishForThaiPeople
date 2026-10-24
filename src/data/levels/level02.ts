import type { Level, LexItem, SentencePattern } from '../../core/types'

// Level 2 — Wants & Needs. Ordering food and drink, saying what you want,
// need and don't want: the street stall, the café counter, the first foreign
// customer. Grammar: `want to` + verb (Thai อยากกิน has nothing between),
// the article `a` (Thai has none), `is` completing am/are/is, and `not` as
// the first negation (`not spicy`); do-support waits for Level 4.
//
// Readings/IPA are from scripts/reading-anchor.mts (CLAUDE.md §4).

export const items: LexItem[] = [
  {
    id: 'want', type: 'vocab', en: 'want', reading: 'วอนต์', ipa: '/wɑnt/', th: 'อยากได้',
    altTh: ['ต้องการ', 'อยาก', 'เอา'], pos: 'คำกริยา', level: 2, tags: ['core', 'food', 'shopping'],
    notes: 'บอกว่าอยากได้อะไร แล้วตามด้วยของนั้นได้เลย: I want water. ลำดับคำเหมือนไทยทุกคำ แต่ต้องมี I นำหน้าเสมอ ละไม่ได้ ระวังว่า want ฟังตรงและห้วนนิดหน่อย — กับเพื่อนใช้ได้ แต่กับพนักงานหรือคนแปลกหน้า เติม please หรือใช้ Can I have … จะนุ่มกว่า',
    mnemonic: 'ท้ายคำมี น กับ ต ซ้อนกัน: พูด "วอน" แล้วแตะลิ้นปิดด้วย ต เบาๆ ไม่ใช่ "ว้อน" ห้วนๆ',
    examples: [
      { en: 'I want coffee.', reading: 'ไอ วอนต์ คอฟ-ฟี่', th: 'ฉันอยากได้กาแฟ' },
      { en: 'I want this one, please.', reading: 'ไอ วอนต์ ดิส วัน พลีส', th: 'ฉันเอาอันนี้ค่ะ/ครับ' },
    ],
  },
  {
    id: 'want-to', type: 'phrase', en: 'want to', reading: 'วอนต์ ทู', ipa: '/wɑnt/ /tu/', th: 'อยากจะ (ตามด้วยกริยา)',
    altTh: ['อยาก', 'อยากจะ'], altEn: ['wanna'], pos: 'คำช่วย', level: 2, tags: ['core', 'grammar'],
    literal: 'อยาก-ที่จะ',
    notes: 'ภาษาไทยพูด "อยากกิน" โดยเอากริยาต่อท้ายอยากได้ทันที แต่ภาษาอังกฤษต้องมี to คั่นก่อนกริยาเสมอ: I want to eat. จำ want to เป็นก้อนเดียวแล้วค่อยต่อกริยา พูดเร็วๆ ฝรั่งออกเสียงเป็น wanna (วอน-นะ) ซึ่งตอนพิมพ์ตอบระบบก็รับ',
    mnemonic: 'want = อยากได้ "ของ" · want to = อยากจะ "ทำ" — เห็นกริยาเมื่อไหร่ ต้องมี to',
    examples: [
      { en: 'I want to eat.', reading: 'ไอ วอนต์ ทู อีต', th: 'ฉันอยากกินข้าว' },
      { en: 'I want to drink tea.', reading: 'ไอ วอนต์ ทู ดริงค์ ที', th: 'ฉันอยากดื่มชา' },
    ],
  },
  {
    id: 'need', type: 'vocab', en: 'need', reading: 'นีด', ipa: '/nid/', th: 'ต้องการ',
    altTh: ['จำเป็นต้องมี', 'ต้องมี', 'ต้องใช้'], pos: 'คำกริยา', level: 2, tags: ['core', 'survival'],
    notes: 'หนักกว่า want: want คืออยากได้ แต่ need คือต้องมี ขาดไม่ได้ เช่น I need water ตอนหิวน้ำจริงๆ ใช้เหมือน want ทุกอย่าง คือ I need + ของ และต้องมี I เสมอ ออกเสียง d ท้ายคำให้ปิด ไม่ใช่ "นี"',
    examples: [
      { en: 'I need water.', reading: 'ไอ นีด วอ-เทอร์', th: 'ฉันต้องการน้ำ' },
      { en: 'I need water. Not beer.', reading: 'ไอ นีด วอ-เทอร์ นอต เบียร์', th: 'ฉันต้องการน้ำ ไม่ใช่เบียร์' },
    ],
  },
  {
    id: 'can-i-have', type: 'phrase', en: 'can I have', reading: 'แค็น ไอ แฮ็ฟ', ipa: '/kæn/ /aɪ/ /hæv/', th: 'ขอ… หน่อย',
    altTh: ['ขอ…ได้ไหม', 'ขอ'], altEn: ['can I get', 'could I have'], pos: 'วลี', level: 2, tags: ['core', 'polite', 'food'],
    literal: 'ได้ไหม-ฉัน-มี',
    notes: 'ก้อนคำขอที่สุภาพและใช้ได้ทุกร้าน: Can I have water, please? ตรงกับ "ขอน้ำหน่อย" ของไทย จำเป็นก้อนเดียวไปก่อน ส่วน can จะได้เรียนแยกในระดับ 3 ปิดท้ายด้วย please เสียงจะนุ่มขึ้นทันที และในร้านกาแฟจะได้ยิน Can I get … บ่อยพอกัน',
    examples: [
      { en: 'Can I have water, please?', reading: 'แค็น ไอ แฮ็ฟ วอ-เทอร์ พลีส', th: 'ขอน้ำหน่อยได้ไหม' },
      { en: 'Can I have this one, please?', reading: 'แค็น ไอ แฮ็ฟ ดิส วัน พลีส', th: 'ขออันนี้หน่อยได้ไหม' },
    ],
  },
  {
    id: 'id-like', type: 'phrase', en: "I'd like", reading: 'ไอด์ ไลก์', ipa: '/aɪd/ /laɪk/', th: 'ฉันขอ… (สุภาพ)',
    altTh: ['ขอ…หน่อย', 'ฉันอยากได้… (แบบสุภาพ)'], altEn: ['I would like'], pos: 'วลี', level: 2, tags: ['core', 'polite', 'food'],
    literal: 'ฉัน-จะ-ชอบ',
    notes: 'ความหมายเดียวกับ I want แต่สุภาพกว่ามาก และเป็นประโยคสั่งอาหารมาตรฐานของเจ้าของภาษา: I\'d like a coffee. ไอด์ คือ I would ย่อ เสียง d ท้ายแทบไม่ได้ยินแต่ต้องมี ไม่อย่างนั้นจะกลายเป็น I like (ฉันชอบ) ซึ่งคนละความหมาย',
    mnemonic: 'I\'d = ไอ + ด เล็กๆ — ด ตัวนี้คือความสุภาพทั้งก้อน ลืมแล้วกลายเป็น "ฉันชอบ"',
    examples: [
      { en: "I'd like a coffee, please.", reading: 'ไอด์ ไลก์ อะ คอฟ-ฟี่ พลีส', th: 'ขอกาแฟหนึ่งแก้วค่ะ/ครับ' },
      { en: "I'd like rice and chicken.", reading: 'ไอด์ ไลก์ ไรส์ อันด์ ชิก-เก็น', th: 'ขอข้าวกับไก่' },
    ],
  },
  {
    id: 'have', type: 'vocab', en: 'have', reading: 'แฮ็ฟ', ipa: '/hæv/', th: 'มี',
    altTh: ['ได้รับ', 'กิน', 'ดื่ม', 'เอา'], pos: 'คำกริยา', level: 2, tags: ['core', 'grammar', 'food'],
    notes: 'ความหมายหลักคือ มี แต่ในร้านอาหารฝรั่งใช้ have แทนทั้งกินและดื่ม: I want to have rice = เอาข้าว และเป็นคำเดียวกับใน Can I have ที่เพิ่งเรียน ออกเสียง v ท้ายคำให้ฟันบนแตะริมฝีปากล่าง "แฮ็ฟ" ไม่ใช่ "แฮบ"',
    examples: [
      { en: 'I want to have this one.', reading: 'ไอ วอนต์ ทู แฮ็ฟ ดิส วัน', th: 'ฉันเอาอันนี้' },
      { en: 'I have water, thank you.', reading: 'ไอ แฮ็ฟ วอ-เทอร์ แธงค์ ยู', th: 'ฉันมีน้ำแล้ว ขอบคุณ' },
    ],
  },
  {
    id: 'a', type: 'vocab', en: 'a', reading: 'อะ', ipa: '/ə/', th: 'หนึ่ง (นำหน้าของนับได้)',
    altTh: ['หนึ่ง', 'สัก…หนึ่ง'], pos: 'คำนำหน้านาม', level: 2, tags: ['core', 'grammar'],
    notes: 'ภาษาไทยพูด "กาแฟแก้วหนึ่ง" โดยไม่มีคำนำหน้า แต่ภาษาอังกฤษต้องใส่ a หน้าของที่นับได้ทีละชิ้นทีละแก้ว: a coffee, a beer ส่วนของที่นับไม่ได้อย่าง water, rice, sugar, ice ไม่ใส่ a เลย ออกเสียงเบาและสั้น "อะ" แทบไม่ได้ยิน',
    mnemonic: 'a = "หนึ่งหน่วย" — ถ้านับเป็นแก้ว ขวด จาน ชิ้นได้ ก็ใส่ a ได้',
    examples: [
      { en: 'Can I have a coffee, please?', reading: 'แค็น ไอ แฮ็ฟ อะ คอฟ-ฟี่ พลีส', th: 'ขอกาแฟแก้วหนึ่งได้ไหม' },
      { en: 'I want a beer.', reading: 'ไอ วอนต์ อะ เบียร์', th: 'ฉันอยากได้เบียร์ขวดหนึ่ง' },
    ],
  },
  {
    id: 'and', type: 'vocab', en: 'and', reading: 'อันด์', ipa: '/ənd/', th: 'และ',
    altTh: ['กับ'], pos: 'คำเชื่อม', level: 2, tags: ['core', 'grammar'],
    notes: 'เชื่อมของสองอย่างเหมือน "กับ/และ": rice and chicken พูดจริงจะย่อเหลือเสียงสั้นๆ "อึน" (rice \'n chicken) ไม่ต้องเน้น ใช้ขึ้นต้นคำถามสั้นๆ ก็ได้: And you? = แล้วคุณล่ะ',
    examples: [
      { en: 'Rice and chicken, please.', reading: 'ไรส์ อันด์ ชิก-เก็น พลีส', th: 'ขอข้าวกับไก่' },
      { en: 'Coffee and water, please.', reading: 'คอฟ-ฟี่ อันด์ วอ-เทอร์ พลีส', th: 'ขอกาแฟกับน้ำเปล่า' },
    ],
  },
  {
    id: 'not', type: 'vocab', en: 'not', reading: 'นอต', ipa: '/nɑt/', th: 'ไม่ (ไม่เผ็ด ไม่ดี)',
    altTh: ['ไม่', 'ไม่ใช่'], pos: 'คำกริยาวิเศษณ์', level: 2, tags: ['core', 'grammar'],
    notes: 'คำปฏิเสธที่วางหน้าคำคุณศัพท์หรือหลัง is: not spicy, This is not good ต่างจากไทยที่ "ไม่" วางหน้าได้ทุกคำ — not ใช้กับกริยาทั่วไปตรงๆ ไม่ได้ (ไม่กิน ไม่ใช่ not eat) ตรงนั้นต้องใช้ don\'t ซึ่งจะเจอในระดับ 4 ส่วนหน้าคำนามใช้ no: no sugar',
    examples: [
      { en: 'Not spicy, please.', reading: 'นอต สไป-ซี่ พลีส', th: 'ไม่เผ็ดนะ' },
      { en: 'This is not spicy.', reading: 'ดิส อิส นอต สไป-ซี่', th: 'อันนี้ไม่เผ็ด' },
    ],
  },
  {
    id: 'what', type: 'vocab', en: 'what', reading: 'วอต', ipa: '/wʌt/', th: 'อะไร',
    altTh: ['อะไรนะ'], pos: 'คำถาม', level: 2, tags: ['core', 'question'],
    notes: 'คำถาม "อะไร" ที่ภาษาอังกฤษเอาไว้หน้าประโยคเสมอ: What is this? กลับกับไทยที่ "อะไร" อยู่ท้าย (นี่อะไร) พูดเร็วๆ จะย่อกับ is เป็น What\'s (วอตส์) อย่างใน What\'s your name ที่เรียนไปแล้ว',
    examples: [
      { en: 'What is this?', reading: 'วอต อิส ดิส', th: 'นี่อะไร' },
      { en: "What's your name?", reading: 'วอตส์ ยอร์ เนม', th: 'คุณชื่ออะไร' },
    ],
  },
  {
    id: 'is', type: 'vocab', en: 'is', reading: 'อิส', ipa: '/ɪz/', th: 'เป็น (ใช้กับ this, it, he, she)',
    altTh: ['อยู่', 'คือ', 'กริยา be ของ this และ it'], pos: 'คำกริยา', level: 2, tags: ['core', 'grammar'],
    notes: 'ตัวที่สามของครอบครัว be: I am, you are และ is สำหรับคนหรือของอื่นทุกอย่าง — this, it, he, she, ชื่อคน: This is chicken. ภาษาไทยไม่มีคำนี้ (นี่ไก่) แต่ภาษาอังกฤษขาดไม่ได้ และถามแบบไม่มี "ไหม" ด้วยการย้าย is มาหน้า: Is this spicy?',
    mnemonic: 'I-am · you-are · ที่เหลือ-is จำสามคู่นี้แล้วประโยคพื้นฐานไม่พังอีก',
    examples: [
      { en: 'This is chicken.', reading: 'ดิส อิส ชิก-เก็น', th: 'นี่คือไก่' },
      { en: 'Is this spicy?', reading: 'อิส ดิส สไป-ซี่', th: 'อันนี้เผ็ดไหม' },
    ],
  },
  {
    id: 'this', type: 'vocab', en: 'this', reading: 'ดิส', ipa: '/ðɪs/', th: 'นี่',
    altTh: ['นี้', 'อันนี้', 'สิ่งนี้'], pos: 'คำสรรพนาม', level: 2, tags: ['core', 'grammar'],
    notes: 'ชี้ของใกล้ตัวเหมือน "นี่": What is this? / This is good. ใช้กับทุกอย่างโดยไม่ต้องมีลักษณนาม เสียง th ตัวนี้ต่างจาก thank: ลิ้นแตะฟันแล้วเสียงสั่น ออกมาเป็น "ดิส" ไม่ใช่ "ธิส" และต้องมี s ปิดท้าย',
    examples: [
      { en: 'What is this?', reading: 'วอต อิส ดิส', th: 'นี่อะไร' },
      { en: 'This is good!', reading: 'ดิส อิส กุด', th: 'อันนี้อร่อย / อันนี้ดี' },
    ],
  },
  {
    id: 'this-one', type: 'phrase', en: 'this one', reading: 'ดิส วัน', ipa: '/ðɪs/ /wʌn/', th: 'อันนี้',
    altTh: ['ชิ้นนี้', 'แก้วนี้', 'นี่'], pos: 'วลี', level: 2, tags: ['core', 'shopping', 'food'],
    literal: 'นี่-อัน',
    notes: 'ชี้เลือกของบนเมนูหรือในตู้: This one, please. ฝรั่งใช้ one แทนของที่ชี้ เหมือนไทยใช้ "อัน" แต่ใช้ได้กับทุกอย่างโดยไม่ต้องเปลี่ยนตามลักษณนาม — อันนี้ แก้วนี้ จานนี้ ชิ้นนี้ เป็น this one หมด',
    examples: [
      { en: 'I want this one.', reading: 'ไอ วอนต์ ดิส วัน', th: 'ฉันเอาอันนี้' },
      { en: 'This one, please.', reading: 'ดิส วัน พลีส', th: 'อันนี้ค่ะ/ครับ' },
    ],
  },
  {
    id: 'water', type: 'vocab', en: 'water', reading: 'วอ-เทอร์', ipa: '/ˈwɔtər/', th: 'น้ำ',
    altTh: ['น้ำเปล่า'], pos: 'คำนาม', level: 2, tags: ['core', 'food', 'survival'],
    notes: 'หมายถึงน้ำเปล่าโดยอัตโนมัติ ไม่ต้องบอกว่า "เปล่า" นับไม่ได้จึงไม่ใส่ a: Water, please. ออกเสียงแบบอเมริกัน "วอ-เทอร์" โดย t ตรงกลางเบาเกือบเป็น ด (วอ-เดอร์) ก็ยังถูก',
    examples: [
      { en: 'Water, please.', reading: 'วอ-เทอร์ พลีส', th: 'ขอน้ำหน่อย' },
      { en: 'I want to drink water.', reading: 'ไอ วอนต์ ทู ดริงค์ วอ-เทอร์', th: 'ฉันอยากดื่มน้ำ' },
    ],
  },
  {
    id: 'coffee', type: 'vocab', en: 'coffee', reading: 'คอฟ-ฟี่', ipa: '/ˈkɑfi/', th: 'กาแฟ',
    pos: 'คำนาม', level: 2, tags: ['core', 'food'],
    notes: 'สั่งได้ทั้ง coffee เฉยๆ และ a coffee (หนึ่งแก้ว) อยากบอกว่าไม่ใส่น้ำตาล พูดต่อท้ายว่า no sugar เน้นพยางค์แรก "คอฟ" ให้หนัก พยางค์หลังเบา และ f ให้ฟันแตะริมฝีปาก ไม่ใช่ "คอป-ปี้"',
    examples: [
      { en: 'Can I have a coffee, please?', reading: 'แค็น ไอ แฮ็ฟ อะ คอฟ-ฟี่ พลีส', th: 'ขอกาแฟแก้วหนึ่งได้ไหม' },
      { en: 'Coffee, no sugar, please.', reading: 'คอฟ-ฟี่ โน ชุก-เกอร์ พลีส', th: 'กาแฟไม่ใส่น้ำตาลนะ' },
    ],
  },
  {
    id: 'tea', type: 'vocab', en: 'tea', reading: 'ที', ipa: '/ti/', th: 'ชา',
    altTh: ['น้ำชา'], pos: 'คำนาม', level: 2, tags: ['core', 'food'],
    notes: 'ชาเขียว ชาไทย ชาร้อน ชาเย็น เรียกรวมว่า tea ได้หมด เสียงยาว "ที" เหมือนชื่อตัวอักษร T สั่งแก้วเดียวพูด a tea ได้ แต่ Tea, please. ก็พอแล้ว',
    examples: [
      { en: 'Tea, please. No ice.', reading: 'ที พลีส โน ไอส์', th: 'ขอชา ไม่ใส่น้ำแข็ง' },
      { en: 'I want to drink tea.', reading: 'ไอ วอนต์ ทู ดริงค์ ที', th: 'ฉันอยากดื่มชา' },
    ],
  },
  {
    id: 'beer', type: 'vocab', en: 'beer', reading: 'เบียร์', ipa: '/bɪr/', th: 'เบียร์',
    pos: 'คำนาม', level: 2, tags: ['core', 'food', 'social'],
    notes: 'ออกเสียงใกล้ไทยอยู่แล้ว แต่ท้ายคำต้องมี r เบาๆ แบบอเมริกัน สั่งขวดเดียวพูด a beer ถ้าสองขวดขึ้นไปต้องเติม s เป็น beers ซึ่งจะเจอพร้อมตัวเลขในระดับ 3',
    examples: [
      { en: 'Can I have a beer, please?', reading: 'แค็น ไอ แฮ็ฟ อะ เบียร์ พลีส', th: 'ขอเบียร์ขวดหนึ่งได้ไหม' },
      { en: 'I want a beer.', reading: 'ไอ วอนต์ อะ เบียร์', th: 'ฉันอยากได้เบียร์สักขวด' },
    ],
  },
  {
    id: 'rice', type: 'vocab', en: 'rice', reading: 'ไรส์', ipa: '/raɪs/', th: 'ข้าว',
    altTh: ['ข้าวสวย'], pos: 'คำนาม', level: 2, tags: ['core', 'food'],
    notes: 'ข้าวสวย ข้าวเหนียว ข้าวผัด ใช้ rice เป็นฐานทั้งหมด นับไม่ได้จึงไม่มี a rice ออกเสียง r ห่อลิ้นและ s ท้ายให้ชัด "ไรส์" — ถ้าเผลอพูด "ไลส์" ฝรั่งจะได้ยินเป็น lice (เหา)',
    mnemonic: 'ห่อลิ้นให้ ร ชัดก่อน ไรส์ — ร คือข้าว ล คือเหา',
    examples: [
      { en: 'Rice and chicken, please.', reading: 'ไรส์ อันด์ ชิก-เก็น พลีส', th: 'ขอข้าวกับไก่' },
      { en: 'I want to eat rice.', reading: 'ไอ วอนต์ ทู อีต ไรส์', th: 'ฉันอยากกินข้าว' },
    ],
  },
  {
    id: 'chicken', type: 'vocab', en: 'chicken', reading: 'ชิก-เก็น', ipa: '/ˈtʃɪkən/', th: 'ไก่',
    altTh: ['เนื้อไก่'], pos: 'คำนาม', level: 2, tags: ['core', 'food'],
    notes: 'ใช้คำเดียวทั้งตัวไก่และเนื้อไก่ในจาน ไม่ต้องแยก เน้นพยางค์แรก "ชิก" ให้ชัด พยางค์หลัง "เก็น" เบาๆ บอกลูกค้าได้ทันทีว่า This is chicken.',
    examples: [
      { en: 'This is chicken.', reading: 'ดิส อิส ชิก-เก็น', th: 'นี่คือไก่' },
      { en: 'Is this chicken?', reading: 'อิส ดิส ชิก-เก็น', th: 'อันนี้ไก่หรือเปล่า' },
    ],
  },
  {
    id: 'spicy', type: 'vocab', en: 'spicy', reading: 'สไป-ซี่', ipa: '/ˈspaɪsi/', th: 'เผ็ด',
    altTh: ['รสจัด'], pos: 'คำคุณศัพท์', level: 2, tags: ['core', 'food'],
    notes: 'คำที่ลูกค้าต่างชาติถามบ่อยที่สุด: Is this spicy? ตอบได้ว่า Yes หรือ Not spicy ส่วน "เผ็ดนิดหน่อย" คือ a little spicy ซึ่งจะได้เรียนในระดับ 8 ออกเสียง "สไป-ซี่" — p ที่ตามหลัง s ไม่มีลม เหมือน ป',
    examples: [
      { en: 'Is this spicy?', reading: 'อิส ดิส สไป-ซี่', th: 'อันนี้เผ็ดไหม' },
      { en: 'Not spicy, please.', reading: 'นอต สไป-ซี่ พลีส', th: 'ขอไม่เผ็ดนะ' },
    ],
  },
  {
    id: 'sugar', type: 'vocab', en: 'sugar', reading: 'ชุก-เกอร์', ipa: '/ˈʃʊgər/', th: 'น้ำตาล',
    pos: 'คำนาม', level: 2, tags: ['core', 'food'],
    notes: 'สิ่งที่ลูกค้าฝรั่งมักขอไม่ใส่: no sugar ตัว s ต้นคำออกเสียง ช ไม่ใช่ ซ — "ชุก-เกอร์" เป็นคำผิดปกติที่ต้องจำ นับไม่ได้ ไม่ใส่ a',
    mnemonic: 'sugar ขึ้นต้นด้วย s แต่เสียงเป็น ช — คำเดียวกับที่คนไทยเรียก "ชูการ์" อยู่แล้ว',
    examples: [
      { en: 'No sugar, please.', reading: 'โน ชุก-เกอร์ พลีส', th: 'ไม่ใส่น้ำตาลนะ' },
      { en: 'Can I have sugar, please?', reading: 'แค็น ไอ แฮ็ฟ ชุก-เกอร์ พลีส', th: 'ขอน้ำตาลหน่อยได้ไหม' },
    ],
  },
  {
    id: 'ice', type: 'vocab', en: 'ice', reading: 'ไอส์', ipa: '/aɪs/', th: 'น้ำแข็ง',
    pos: 'คำนาม', level: 2, tags: ['core', 'food'],
    notes: 'ฝรั่งหลายคนไม่เอาน้ำแข็ง: no ice นับไม่ได้ ไม่ใส่ a ออกเสียง "ไอส์" ให้มี s ท้ายชัดๆ — ถ้าไม่มี s จะกลายเป็น I (ฉัน) หรือ eye (ตา) ทันที',
    examples: [
      { en: 'No ice, please.', reading: 'โน ไอส์ พลีส', th: 'ไม่ใส่น้ำแข็งนะ' },
      { en: 'More ice, please.', reading: 'มอร์ ไอส์ พลีส', th: 'ขอน้ำแข็งเพิ่มหน่อย' },
    ],
  },
  {
    id: 'eat', type: 'vocab', en: 'eat', reading: 'อีต', ipa: '/it/', th: 'กิน',
    altTh: ['ทาน', 'รับประทาน'], pos: 'คำกริยา', level: 2, tags: ['core', 'food'],
    notes: 'กริยากินที่ใช้กับอาหารเท่านั้น เครื่องดื่มใช้ drink — ต่างจากไทยที่ "กินน้ำ" ได้ ใช้คู่กับ want to: I want to eat. สระยาว "อีต" ปิดท้ายด้วย t เบาๆ ไม่ใช่ "อิ๊ด"',
    examples: [
      { en: 'I want to eat this.', reading: 'ไอ วอนต์ ทู อีต ดิส', th: 'ฉันอยากกินอันนี้' },
      { en: 'I want to eat chicken.', reading: 'ไอ วอนต์ ทู อีต ชิก-เก็น', th: 'ฉันอยากกินไก่' },
    ],
  },
  {
    id: 'drink', type: 'vocab', en: 'drink', reading: 'ดริงค์', ipa: '/drɪŋk/', th: 'ดื่ม',
    altTh: ['กินน้ำ', 'เครื่องดื่ม'], pos: 'คำกริยา', level: 2, tags: ['core', 'food'],
    notes: 'ใช้กับของเหลวทุกอย่าง น้ำ กาแฟ เบียร์ ภาษาไทยพูด "กินน้ำ" ได้ แต่ภาษาอังกฤษต้อง drink water เสมอ คำเดียวกันเป็นคำนามได้ด้วย: a drink = เครื่องดื่มหนึ่งแก้ว ออกเสียง "ดริงค์" ให้มี k ปิดท้าย',
    examples: [
      { en: 'I want to drink water.', reading: 'ไอ วอนต์ ทู ดริงค์ วอ-เทอร์', th: 'ฉันอยากดื่มน้ำ' },
      { en: 'I want to drink coffee.', reading: 'ไอ วอนต์ ทู ดริงค์ คอฟ-ฟี่', th: 'ฉันอยากดื่มกาแฟ' },
    ],
  },
  {
    id: 'more', type: 'vocab', en: 'more', reading: 'มอร์', ipa: '/mɔr/', th: 'เพิ่ม',
    altTh: ['อีก', 'มากกว่า'], pos: 'คำคุณศัพท์', level: 2, tags: ['core', 'food', 'shopping'],
    notes: 'ขอเพิ่มง่ายที่สุดด้วย more + ของ + please: More water, please. = ขอน้ำเพิ่มหน่อย ใช้ได้ทั้งของนับได้และนับไม่ได้ ภาษาไทยวาง "เพิ่ม/อีก" ไว้หลังของ แต่ภาษาอังกฤษวาง more ไว้หน้าของเสมอ',
    examples: [
      { en: 'More water, please.', reading: 'มอร์ วอ-เทอร์ พลีส', th: 'ขอน้ำเพิ่มหน่อย' },
      { en: 'Can I have more rice, please?', reading: 'แค็น ไอ แฮ็ฟ มอร์ ไรส์ พลีส', th: 'ขอข้าวเพิ่มหน่อยได้ไหม' },
    ],
  },
]

// Slot pools. Every combination must be natural English (CURRICULUM.md L2).
const THINGS = ['water', 'coffee', 'tea', 'beer', 'rice', 'chicken', 'sugar', 'ice', 'this', 'this-one']
const FOODS = ['rice', 'chicken', 'this', 'this-one']
const DRINKS = ['water', 'coffee', 'tea', 'beer', 'this', 'this-one']
const MENU = ['rice', 'chicken', 'water', 'coffee', 'tea', 'beer', 'this', 'this-one']

export const patterns: SentencePattern[] = [
  {
    id: 'p-i-want', level: 2,
    name: 'I want ___',
    enTemplate: 'I want {thing}',
    readingTemplate: 'ไอ วอนต์ {thing}',
    thTemplate: 'ฉันอยากได้{thing}',
    slots: [{ name: 'thing', itemIds: THINGS }],
    explanation:
      'ลำดับคำเหมือนไทยทุกคำ: ฉัน-อยากได้-ของ = I want water แต่ I ละไม่ได้เลย — "want water" เฉยๆ ไม่ใช่ประโยค ' +
      'ใส่ของที่อยากได้ต่อท้ายได้ทุกอย่างโดยไม่ต้องมีลักษณนาม ' +
      'ระวังว่า I want ฟังตรงและห้วนเล็กน้อย กับเพื่อนหรือตอนถูกถามว่าจะเอาอะไรใช้ได้ แต่กับพนักงานหรือคนแปลกหน้า เติม please หรือใช้ Can I have … please จะนุ่มกว่า',
    showcase: [{ thing: 'water' }, { thing: 'this-one' }, { thing: 'rice' }],
    distractors: ['need', 'you', 'not', 'eat'],
  },
  {
    id: 'p-can-i-have', level: 2,
    name: 'Can I have ___, please?',
    enTemplate: 'Can I have {thing} please',
    readingTemplate: 'แค็น ไอ แฮ็ฟ {thing} พลีส',
    thTemplate: 'ขอ{thing}หน่อยได้ไหม',
    slots: [{ name: 'thing', itemIds: THINGS }],
    explanation:
      'ประโยคสั่งของที่สุภาพและใช้ได้ทุกที่ จำเป็นก้อนเดียว: Can I have + ของ + please เท่ากับ "ขอ…หน่อย" ของไทย ' +
      'ของนับไม่ได้ใส่เปล่าๆ (water, rice, ice) ส่วนของที่นับเป็นแก้วเป็นขวดใส่ a ข้างหน้าได้: Can I have a coffee, please ' +
      'please อยู่ท้ายประโยคเสมอ และ can จะได้เรียนแยกเป็นคำของตัวเองในระดับ 3',
    showcase: [{ thing: 'water' }, { thing: 'this-one' }, { thing: 'coffee' }],
    distractors: ['want', 'you', 'are', 'need'],
  },
  {
    id: 'p-i-want-to', level: 2,
    name: 'I want to ___ ___',
    enTemplate: 'I want to {verb} {thing}',
    readingTemplate: 'ไอ วอนต์ ทู {verb} {thing}',
    thTemplate: 'ฉันอยาก{verb}{thing}',
    slots: [
      { name: 'verb', itemIds: ['eat', 'drink', 'have'] },
      { name: 'thing', itemIds: MENU },
    ],
    compat: { eat: FOODS, drink: DRINKS, have: MENU },
    // `have` when ordering is "เอา", not "มี" — the Thai must say so.
    thOverrides: {
      'have+rice': 'ฉันเอาข้าว', 'have+chicken': 'ฉันเอาไก่', 'have+water': 'ฉันเอาน้ำ',
      'have+coffee': 'ฉันเอากาแฟ', 'have+tea': 'ฉันเอาชา', 'have+beer': 'ฉันเอาเบียร์',
      'have+this': 'ฉันเอานี่', 'have+this-one': 'ฉันเอาอันนี้',
    },
    explanation:
      'ภาษาไทยพูด "อยากกิน" โดยเอากริยาต่อท้ายอยากทันที แต่ภาษาอังกฤษต้องมี to คั่นเสมอ: I want to eat — "I want eat" คือประโยคที่พัง ' +
      'จำ want to เป็นก้อนเดียว แล้วต่อด้วยกริยาและของ: I want to drink water ' +
      'eat ใช้กับอาหาร drink ใช้กับเครื่องดื่ม ส่วน have ใช้ได้ทั้งสองอย่างในความหมาย "เอา" ตอนสั่ง: I want to have this one = ฉันเอาอันนี้ ' +
      'พูดเร็วๆ ฝรั่งออกเสียง want to เป็น wanna (วอน-นะ) ตอนพิมพ์ตอบระบบรับทั้งสองแบบ',
    showcase: [{ verb: 'eat', thing: 'rice' }, { verb: 'drink', thing: 'water' }, { verb: 'have', thing: 'this-one' }],
    distractors: ['need', 'and', 'not', 'you'],
  },
]

export const level: Level = {
  n: 2,
  title: 'อยากได้ ต้องการ',
  titleEn: 'Wants & Needs',
  subtitle: 'สั่งอาหารและเครื่องดื่ม บอกได้ว่าอยากได้อะไร ไม่เอาอะไร',
  icon: '🍜',
  canDo: [
    'สั่งอาหารและเครื่องดื่มง่ายๆ ที่ร้านหรือแผงลอยได้',
    'สั่งกาแฟและบอกได้ว่าไม่เอาน้ำตาล ไม่เอาน้ำแข็ง',
    'บอกได้ว่าอยากกินหรืออยากดื่มอะไรด้วย I want to …',
    'ขอของอย่างสุภาพด้วย Can I have … please',
    'ถามได้ว่า "นี่คืออะไร" และชี้เลือก "อันนี้" ได้',
  ],
  itemIds: [
    'want', 'want-to', 'need', 'can-i-have', 'id-like', 'have',
    'a', 'and', 'not', 'what', 'is', 'this', 'this-one',
    'water', 'coffee', 'tea', 'beer', 'rice', 'chicken', 'spicy', 'sugar', 'ice',
    'eat', 'drink', 'more',
  ],
  patternIds: ['p-i-want', 'p-can-i-have', 'p-i-want-to'],
}
