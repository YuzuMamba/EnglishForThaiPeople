import type { Level, LexItem, SentencePattern } from '../../core/types'

// Level 4 — People & Feelings. Family words, likes and dislikes, where you
// are from, and how you feel at the end of the day: the small talk a Thai
// adult makes with a customer, a date or a new friend.
//
// Grammar carried here: he/she with `is` (L2); `from`; `very` / `so` before a
// feeling; and the two do-support frames Thai has no equivalent for —
// `Do you …?` instead of ไหม and `don't` instead of a bare ไม่.
//
// Readings/IPA are from scripts/reading-anchor.mts (CLAUDE.md §4).

export const items: LexItem[] = [
  {
    id: 'he', type: 'vocab', en: 'he', reading: 'ฮี', ipa: '/hi/', th: 'เขา (ผู้ชาย)',
    altTh: ['เค้า (ผู้ชาย)', 'ผู้ชายคนนั้น'], pos: 'คำสรรพนาม', level: 4, tags: ['core', 'people', 'grammar'],
    notes: 'ภาษาไทยใช้ "เขา" ได้ทั้งชายหญิง แต่ภาษาอังกฤษแยกชัด: he = ผู้ชาย, she = ผู้หญิง ต้องเลือกให้ถูกทุกครั้ง he ใช้คู่กับ is ไม่ใช่ am/are: He is my friend และเหมือน I — ละไม่ได้ ต้องพูด he ทุกประโยค แม้เพิ่งพูดถึงเขาไปเมื่อกี้',
    mnemonic: '"ฮี" เหมือนเสียงแรกของ hero (ฮีโร่) — พระเอก เป็นผู้ชาย',
    examples: [
      { en: 'He is my friend.', reading: 'ฮี อิส มาย เฟรนด์', th: 'เขาเป็นเพื่อนฉัน' },
      { en: 'He is from Thailand.', reading: 'ฮี อิส ฟรอม ไท-แลนด์', th: 'เขามาจากประเทศไทย' },
    ],
  },
  {
    id: 'she', type: 'vocab', en: 'she', reading: 'ชี', ipa: '/ʃi/', th: 'เธอ (ผู้หญิง)',
    altTh: ['เขา (ผู้หญิง)', 'หล่อน'], pos: 'คำสรรพนาม', level: 4, tags: ['core', 'people', 'grammar'],
    notes: 'คู่ของ he สำหรับผู้หญิง และใช้กับ is เหมือนกัน: She is my sister ออกเสียง "ชี" ให้มีลม ช ยาวๆ ไม่ใช่ "ซี" — ถ้าพูดเป็นซี ฝรั่งจะได้ยินเป็น see (เห็น) แล้วรอฟังว่าคุณเห็นอะไร',
    mnemonic: 'she เริ่มด้วยเสียง "ชู่ว" เหมือนบอกให้เงียบ — ลมออกมาก่อน แล้วค่อย อี',
    examples: [
      { en: 'She is my mom.', reading: 'ชี อิส มาย มอม', th: 'เขาเป็นแม่ฉัน' },
      { en: 'She is happy.', reading: 'ชี อิส แฮป-ปี้', th: 'เขาดีใจ' },
    ],
  },
  {
    id: 'from', type: 'vocab', en: 'from', reading: 'ฟรอม', ipa: '/frʌm/', th: 'มาจาก',
    altTh: ['จาก'], pos: 'คำบุพบท', level: 4, tags: ['core', 'grammar', 'place'],
    notes: 'ใช้บอกที่มา: I am from Thailand = ฉันมาจากประเทศไทย ภาษาไทยพูด "มาจาก" เป็นกริยาได้เลย แต่ภาษาอังกฤษ from ไม่ใช่กริยา จึงต้องมี am/is/are คั่นเสมอ — "I from Thailand" คือประโยคที่พัง ส่วนคำถามเอา from ไปไว้ท้ายสุด: Where are you from? ออกเสียง "ฟรอม" ปิดปากที่ ม',
    examples: [
      { en: 'I am from Bangkok.', reading: 'ไอ แอ็ม ฟรอม แบง-ค็อก', th: 'ฉันมาจากกรุงเทพฯ' },
      { en: 'Where are you from?', reading: 'แวร์ อาร์ ยู ฟรอม', th: 'คุณมาจากไหน' },
    ],
  },
  {
    id: 'thailand', type: 'vocab', en: 'Thailand', reading: 'ไท-แลนด์', ipa: '/ˈtaɪˌlænd/', th: 'ประเทศไทย',
    altTh: ['เมืองไทย'], pos: 'คำนาม', level: 4, tags: ['core', 'place', 'travel'],
    notes: 'ชื่อประเทศ เขียน T ตัวใหญ่เสมอ อย่าสลับกับ Thai (ระดับ 1) ที่แปลว่าคนไทย: I am from Thailand (ประเทศ) แต่ I am Thai (คนไทย) ถ้าพูด "I am Thailand" ฝรั่งจะยิ้มแล้วแก้ให้ ออกเสียงสองพยางค์และปิดท้ายด้วย d เบาๆ "ไท-แลนด์" ไม่ใช่ "ไท-แลน"',
    examples: [
      { en: 'I am from Thailand.', reading: 'ไอ แอ็ม ฟรอม ไท-แลนด์', th: 'ฉันมาจากประเทศไทย' },
      { en: 'I love Thailand.', reading: 'ไอ ลัฟ ไท-แลนด์', th: 'ฉันรักเมืองไทย' },
    ],
  },
  {
    id: 'bangkok', type: 'vocab', en: 'Bangkok', reading: 'แบง-ค็อก', ipa: '/bæŋˈkɑk/', th: 'กรุงเทพฯ',
    altTh: ['กรุงเทพมหานคร', 'บางกอก'], pos: 'คำนาม', level: 4, tags: ['core', 'place', 'travel'],
    notes: 'ชื่อที่ทั้งโลกเรียกกรุงเทพฯ — ถ้าบอกว่า I am from Krungthep แทบไม่มีฝรั่งคนไหนรู้จัก ต้องพูด Bangkok เน้นพยางค์หลัง "ค็อก" ให้ดังกว่าพยางค์แรก และปิดท้ายด้วย k สั้นๆ ใช้เป็นกรรมได้ตรงๆ: I love Bangkok',
    examples: [
      { en: 'I am from Bangkok.', reading: 'ไอ แอ็ม ฟรอม แบง-ค็อก', th: 'ฉันมาจากกรุงเทพฯ' },
      { en: 'Do you like Bangkok?', reading: 'ดู ยู ไลก์ แบง-ค็อก', th: 'คุณชอบกรุงเทพฯ ไหม' },
    ],
  },
  {
    id: 'where-are-you-from', type: 'phrase', en: 'where are you from', reading: 'แวร์ อาร์ ยู ฟรอม', ipa: '/wɛr/ /ɑr/ /ju/ /frʌm/', th: 'คุณมาจากไหน',
    altTh: ['มาจากประเทศอะไร'], altEn: ["where're you from"], pos: 'วลี', level: 4, tags: ['core', 'question', 'social'],
    literal: 'ที่ไหน-เป็น-คุณ-จาก',
    notes: 'คำถามที่ฝรั่งถามคนไทย และคนไทยถามฝรั่ง บ่อยที่สุดหลังจากถามชื่อ สังเกตลำดับที่กลับกับไทยหมด: Where ขึ้นต้น (ไม่ใช่ "ไหน" ท้ายประโยค) are มาก่อน you และ from ไปอยู่ท้ายสุด ตอบว่า I am from … ตามด้วยชื่อประเทศหรือเมือง แล้วถามกลับว่า And you?',
    examples: [
      { en: 'Hello! Where are you from?', reading: 'เฮล-โล แวร์ อาร์ ยู ฟรอม', th: 'สวัสดี คุณมาจากไหน' },
      { en: 'Where are you from? I am from Thailand.', reading: 'แวร์ อาร์ ยู ฟรอม ไอ แอ็ม ฟรอม ไท-แลนด์', th: 'คุณมาจากไหน — ฉันมาจากประเทศไทย' },
    ],
  },
  {
    id: 'like', type: 'vocab', en: 'like', reading: 'ไลก์', ipa: '/laɪk/', th: 'ชอบ',
    altTh: ['ถูกใจ'], pos: 'คำกริยา', level: 4, tags: ['core', 'feelings', 'social'],
    notes: 'ชอบ ใช้ได้กับของ อาหาร คน สถานที่ ตามด้วยคำนามตรงๆ เหมือนไทย: I like coffee = ฉันชอบกาแฟ ไม่ต้องมี am คั่น เพราะ like เป็นกริยาเองแล้ว ออกเสียง "ไลก์" ให้มี ก เบาๆ ปิดท้าย ถ้าพูด "ไล" เฉยๆ จะกลายเป็น lie (โกหก) ส่วน like ที่แปลว่า "เหมือน" เป็นอีกคำ จะเจอทีหลัง',
    mnemonic: 'กด "ไลก์" ในเฟซบุ๊ก = ชอบ คำเดียวกันเป๊ะ',
    examples: [
      { en: 'I like Thai food.', reading: 'ไอ ไลก์ ไท ฟูด', th: 'ฉันชอบอาหารไทย' },
      { en: 'Do you like coffee?', reading: 'ดู ยู ไลก์ คอฟ-ฟี่', th: 'คุณชอบกาแฟไหม' },
    ],
  },
  {
    id: 'love', type: 'vocab', en: 'love', reading: 'ลัฟ', ipa: '/lʌv/', th: 'รัก',
    altTh: ['ชอบมาก', 'หลงรัก'], pos: 'คำกริยา', level: 4, tags: ['core', 'feelings', 'social'],
    notes: 'แรงกว่า like ใช้ได้ทั้งกับคน (I love you) และกับของที่ชอบมากๆ: I love Thai food = ฉันชอบอาหารไทยมากๆ ฝรั่งพูด love กับอาหาร กับเมือง กับเพลง เป็นเรื่องปกติ ไม่ได้แปลว่าหลงรักจริงจัง ออกเสียง "ลัฟ" สระสั้น และจบด้วยฟันบนแตะริมฝีปากล่าง ไม่ใช่ "เลิฟ"',
    mnemonic: 'v ท้ายคำ: ฟันบนกัดริมฝีปากล่างเบาๆ แล้วปล่อยลม "ลัฟ-ฟ"',
    examples: [
      { en: 'I love Thailand.', reading: 'ไอ ลัฟ ไท-แลนด์', th: 'ฉันรักเมืองไทย' },
      { en: 'I love it!', reading: 'ไอ ลัฟ อิต', th: 'ชอบมากเลย!' },
    ],
  },
  {
    id: 'do', type: 'vocab', en: 'do', reading: 'ดู', ipa: '/du/', th: 'ทำ (และใช้ขึ้นต้นคำถาม)',
    altTh: ['…ไหม (คำขึ้นต้นคำถาม)', 'กระทำ'], pos: 'คำช่วย', level: 4, tags: ['core', 'grammar', 'question'],
    notes: 'คำที่ทำหน้าที่แทน "ไหม": Do you like coffee? = คุณชอบกาแฟไหม วาง Do ไว้หน้าสุด แล้วที่เหลือเหมือนประโยคบอกเล่าทุกคำ ตอบสั้นๆ ว่า Yes, I do หรือ No, I don\'t ไม่ต้องพูดกริยาซ้ำ do ยังแปลว่า "ทำ" ได้ด้วย ซึ่งจะได้ใช้ทีหลัง ออกเสียง "ดู" เหมือนคำว่าดูในภาษาไทยเลย',
    mnemonic: 'ก่อนถามว่า "…ไหม" ให้ "ดู" หน้าประโยคก่อน ว่ามี Do หรือยัง',
    examples: [
      { en: 'Do you like Thai food?', reading: 'ดู ยู ไลก์ ไท ฟูด', th: 'คุณชอบอาหารไทยไหม' },
      { en: 'Yes, I do.', reading: 'เย็ส ไอ ดู', th: 'ชอบ (ตอบรับคำถาม Do you …?)' },
    ],
  },
  {
    id: 'dont', type: 'phrase', en: "don't", reading: 'โดนต์', ipa: '/doʊnt/', th: 'ไม่ (+กริยา)',
    altTh: ['ไม่ได้…', 'อย่า'], altEn: ['do not'], pos: 'คำช่วย', level: 4, tags: ['core', 'grammar'],
    literal: 'do-not (ย่อ) = ไม่',
    notes: 'ภาษาไทยเอา "ไม่" ไว้หน้ากริยาได้เลย (ไม่ชอบ ไม่กิน) แต่ภาษาอังกฤษต้องใช้ don\'t: I don\'t like sugar และกริยาที่ตามมาคงรูปเดิม อย่าเอา not จากระดับ 2 ไปวางหน้ากริยาเอง — not ใช้กับ am/is/are และคำคุณศัพท์ (not spicy) ส่วน don\'t ใช้กับกริยาทั่วไป พูดคำเดียวห้วนๆ Don\'t! แปลว่า "อย่า" ออกเสียง "โดนต์" ไม่ใช่ "ด้อน"',
    mnemonic: 'don\'t = do + not บีบรวมกัน — ตัว o ตัวที่สองหาย เหลือเครื่องหมาย \' แทน',
    examples: [
      { en: "I don't like sugar.", reading: 'ไอ โดนต์ ไลก์ ชุก-เกอร์', th: 'ฉันไม่ชอบน้ำตาล' },
      { en: "No, I don't.", reading: 'โน ไอ โดนต์', th: 'ไม่ ไม่ชอบ/ไม่เอา (ตอบปฏิเสธคำถาม Do you …?)' },
    ],
  },
  {
    id: 'very', type: 'vocab', en: 'very', reading: 'เว-รี่', ipa: '/ˈvɛri/', th: 'มาก',
    altTh: ['มากๆ', 'อย่างมาก'], pos: 'คำกริยาวิเศษณ์', level: 4, tags: ['core', 'grammar', 'feelings'],
    notes: 'ภาษาไทยเอา "มาก" ไว้หลังคำ (เหนื่อยมาก) แต่ภาษาอังกฤษเอา very ไว้หน้าคำคุณศัพท์: very tired ไม่ใช่ tired very ใช้ได้กับคำบอกสภาพทุกคำ: very good, very happy, very spicy เสียงแรกคือ v — ฟันบนแตะริมฝีปากล่าง "เว-รี่" ถ้าพูด "แว-รี่" ด้วยริมฝีปากสองข้าง ฝรั่งจะได้ยินเป็นคำอื่น',
    examples: [
      { en: 'I am very hungry.', reading: 'ไอ แอ็ม เว-รี่ ฮัง-กรี่', th: 'ฉันหิวมาก' },
      { en: 'Thai food is very good.', reading: 'ไท ฟูด อิส เว-รี่ กุด', th: 'อาหารไทยอร่อยมาก' },
    ],
  },
  {
    id: 'so', type: 'vocab', en: 'so', reading: 'โซ', ipa: '/soʊ/', th: 'มาก (แบบใส่อารมณ์)',
    altTh: ['มาก', '…จัง', '…เหลือเกิน'], pos: 'คำกริยาวิเศษณ์', level: 4, tags: ['core', 'feelings', 'social'],
    notes: 'ความหมายเหมือน very แต่ใส่อารมณ์มากกว่า เทียบได้กับ "…จัง" หรือ "…เหลือเกิน": I am so tired = เหนื่อยจังเลย ใช้ตอนคุยสบายๆ และวางหน้าคำคุณศัพท์เหมือน very ส่วน so ที่แปลว่า "งั้น/ดังนั้น" เป็นอีกความหมาย จะเจอทีหลัง ออกเสียง "โซ" ปากกลมและลากเสียงได้ตามอารมณ์: so-o-o tired',
    examples: [
      { en: 'I am so tired.', reading: 'ไอ แอ็ม โซ ไทร์ด', th: 'ฉันเหนื่อยจังเลย' },
      { en: 'I am so happy!', reading: 'ไอ แอ็ม โซ แฮป-ปี้', th: 'ดีใจจังเลย!' },
    ],
  },
  {
    id: 'family', type: 'vocab', en: 'family', reading: 'แฟม-มะ-ลี่', ipa: '/ˈfæməli/', th: 'ครอบครัว',
    altTh: ['คนในครอบครัว'], pos: 'คำนาม', level: 4, tags: ['core', 'people'],
    notes: 'ครอบครัว ใช้ได้ทั้งพูดถึงภาพรวม (my family) และคนในบ้านทั้งหมด ฝรั่งถามเรื่องครอบครัวเป็นการคุยเล่นปกติ ไม่ถือว่าเสียมารยาท ออกเสียงเน้นพยางค์แรก "แฟม" ส่วนตรงกลางพูดเบาและเร็วมาก จนในชีวิตจริงได้ยินแค่ "แฟม-ลี่"',
    examples: [
      { en: 'This is my family.', reading: 'ดิส อิส มาย แฟม-มะ-ลี่', th: 'นี่ครอบครัวฉัน' },
      { en: 'I love my family.', reading: 'ไอ ลัฟ มาย แฟม-มะ-ลี่', th: 'ฉันรักครอบครัว' },
    ],
  },
  {
    id: 'mom', type: 'vocab', en: 'mom', reading: 'มอม', ipa: '/mɑm/', th: 'แม่',
    altTh: ['คุณแม่', 'มารดา'], altEn: ['mum', 'mother'], pos: 'คำนาม', level: 4, tags: ['core', 'people'],
    notes: 'คำเรียกแม่แบบที่ใช้จริงในบ้าน (แบบอเมริกัน) mum เป็นแบบอังกฤษ ส่วน mother เป็นทางการ ใช้ในเอกสารหรือพูดกับคนนอก ใช้เรียกตรงๆ ได้โดยไม่ต้องมี my (Mom!) และใช้ my mom เมื่อเล่าให้คนอื่นฟัง ออกเสียง "มอม" ปิดปากท้ายคำทั้งสองข้าง',
    examples: [
      { en: 'This is my mom.', reading: 'ดิส อิส มาย มอม', th: 'นี่แม่ฉัน' },
      { en: 'My mom is from Bangkok.', reading: 'มาย มอม อิส ฟรอม แบง-ค็อก', th: 'แม่ฉันมาจากกรุงเทพฯ' },
    ],
  },
  {
    id: 'dad', type: 'vocab', en: 'dad', reading: 'แด็ด', ipa: '/dæd/', th: 'พ่อ',
    altTh: ['คุณพ่อ', 'บิดา'], altEn: ['father'], pos: 'คำนาม', level: 4, tags: ['core', 'people'],
    notes: 'คู่ของ mom: dad คือพ่อแบบพูดในบ้าน father เป็นทางการ สระสั้นปากกว้าง "แด็ด" และต้องมี d ปิดท้าย — ลิ้นแตะเพดานเบาๆ ถ้าหายไปเหลือ "แด" ฝรั่งจะฟังไม่ออกว่าพูดถึงใคร',
    examples: [
      { en: 'This is my dad.', reading: 'ดิส อิส มาย แด็ด', th: 'นี่พ่อฉัน' },
      { en: 'I love my dad.', reading: 'ไอ ลัฟ มาย แด็ด', th: 'ฉันรักพ่อ' },
    ],
  },
  {
    id: 'sister', type: 'vocab', en: 'sister', reading: 'ซิส-เตอร์', ipa: '/ˈsɪstər/', th: 'พี่สาว/น้องสาว',
    altTh: ['พี่สาว', 'น้องสาว'], pos: 'คำนาม', level: 4, tags: ['core', 'people'],
    notes: 'ภาษาอังกฤษไม่แยกพี่กับน้อง — sister คำเดียวใช้ได้ทั้งพี่สาวและน้องสาว ถ้าอยากเจาะจงค่อยเติมคำขยายทีหลัง และใช้กับพี่น้องจริงๆ เท่านั้น ไม่ได้เรียกเพื่อนรุ่นพี่ว่า sister แบบที่ไทยเรียก "พี่" ออกเสียงเน้นพยางค์แรก "ซิส" พยางค์หลังเบา',
    examples: [
      { en: 'She is my sister.', reading: 'ชี อิส มาย ซิส-เตอร์', th: 'เขาเป็นน้องสาวฉัน' },
      { en: 'Do you have a sister?', reading: 'ดู ยู แฮ็ฟ อะ ซิส-เตอร์', th: 'คุณมีพี่สาวหรือน้องสาวไหม' },
    ],
  },
  {
    id: 'brother', type: 'vocab', en: 'brother', reading: 'บรา-เธอร์', ipa: '/ˈbrʌðər/', th: 'พี่ชาย/น้องชาย',
    altTh: ['พี่ชาย', 'น้องชาย'], pos: 'คำนาม', level: 4, tags: ['core', 'people'],
    notes: 'เหมือน sister: brother คำเดียวใช้ได้ทั้งพี่ชายและน้องชาย ฝรั่งไม่สนว่าใครแก่กว่าจนกว่าจะถามเอง เสียง th ตรงกลาง "บรา-เธอร์" ปลายลิ้นแตะฟันบนเบาๆ ไม่ใช่ "บรา-เดอร์" และ r ท้ายคำห่อลิ้นนิดเดียว',
    mnemonic: 'ลิ้นแตะฟันตรงกลางคำ — ถ้าไม่แตะจะเป็น "บรา-เดอร์" ฝรั่งฟังออก แต่รู้ทันทีว่าสำเนียงไทย',
    examples: [
      { en: 'He is my brother.', reading: 'ฮี อิส มาย บรา-เธอร์', th: 'เขาเป็นพี่ชายฉัน' },
      { en: 'I have a brother.', reading: 'ไอ แฮ็ฟ อะ บรา-เธอร์', th: 'ฉันมีน้องชายหนึ่งคน' },
    ],
  },
  {
    id: 'friend', type: 'vocab', en: 'friend', reading: 'เฟรนด์', ipa: '/frɛnd/', th: 'เพื่อน',
    altTh: ['มิตร'], pos: 'คำนาม', level: 4, tags: ['core', 'people', 'social'],
    notes: 'เพื่อน ใช้ได้กับทุกวัยทุกเพศ my friend = เพื่อนฉัน โดยไม่ต้องบอกว่าชายหรือหญิง ฝรั่งเรียกคนที่เพิ่งรู้จักไม่นานว่า friend ได้ง่ายกว่าไทย ไม่ได้แปลว่าสนิทมาก ออกเสียง "เฟรนด์" พยางค์เดียว มี d ท้ายเบาๆ แต่ต้องมี — "เฟรน" เฉยๆ ฟังเหมือนพูดไม่จบ',
    examples: [
      { en: 'He is my friend.', reading: 'ฮี อิส มาย เฟรนด์', th: 'เขาเป็นเพื่อนฉัน' },
      { en: 'This is my friend, Nam.', reading: 'ดิส อิส มาย เฟรนด์ น้ำ', th: 'นี่เพื่อนฉัน ชื่อน้ำ' },
    ],
  },
  {
    id: 'food', type: 'vocab', en: 'food', reading: 'ฟูด', ipa: '/fud/', th: 'อาหาร',
    altTh: ['ของกิน'], pos: 'คำนาม', level: 4, tags: ['core', 'food'],
    notes: 'คำรวมของทุกอย่างที่กินได้ เป็นคำนามนับไม่ได้ จึงไม่มี a นำหน้า: I like Thai food ไม่ใช่ a Thai food เอาคำขยายไว้หน้าได้เลย — Thai food = อาหารไทย, spicy food = อาหารเผ็ด (คำขยายอยู่หน้าคำนาม กลับกับไทย) ออกเสียงสระยาว "ฟูด" และปิดด้วย d เบาๆ',
    examples: [
      { en: 'I like Thai food.', reading: 'ไอ ไลก์ ไท ฟูด', th: 'ฉันชอบอาหารไทย' },
      { en: 'Do you like spicy food?', reading: 'ดู ยู ไลก์ สไป-ซี่ ฟูด', th: 'คุณชอบอาหารเผ็ดไหม' },
    ],
  },
  {
    id: 'sad', type: 'vocab', en: 'sad', reading: 'แซ็ด', ipa: '/sæd/', th: 'เศร้า',
    altTh: ['เสียใจ'], pos: 'คำคุณศัพท์', level: 4, tags: ['core', 'feelings'],
    notes: 'บอกความรู้สึกด้วย I am sad — ต้องมี am คั่นเสมอ ใช้ได้ทั้งเรื่องเล็กและเรื่องใหญ่ ฝรั่งพูด I am so sad กับเรื่องร้านโปรดปิดก็ได้ ระวังสระ: "แซ็ด" สั้น ปากกว้าง ไม่ใช่ "ซาด" ลากยาว และ d ท้ายคำต้องมี',
    mnemonic: 'sad กับ dad คล้องกัน — ปากกว้าง "แอะ" สั้นๆ ทั้งคู่ จบด้วย d เหมือนกัน',
    examples: [
      { en: 'I am sad.', reading: 'ไอ แอ็ม แซ็ด', th: 'ฉันเศร้า' },
      { en: 'Are you sad?', reading: 'อาร์ ยู แซ็ด', th: 'เศร้าเหรอ' },
    ],
  },
  {
    id: 'tired', type: 'vocab', en: 'tired', reading: 'ไทร์ด', ipa: '/ˈtaɪərd/', th: 'เหนื่อย',
    altTh: ['ง่วง', 'เพลีย'], pos: 'คำคุณศัพท์', level: 4, tags: ['core', 'feelings', 'work'],
    notes: 'ใช้ได้ทั้งเหนื่อยกายและง่วงนอน: I am so tired = เหนื่อยจังเลย / ง่วงมาก เป็นประโยคที่คนทำงานพูดบ่อยที่สุดประโยคหนึ่ง ออกเสียง "ไทร์ด" เป็นพยางค์เดียวลากยาว ปิดด้วย d — ไม่ใช่ "ไท-เอิด" สองพยางค์',
    examples: [
      { en: 'I am so tired.', reading: 'ไอ แอ็ม โซ ไทร์ด', th: 'ฉันเหนื่อยจังเลย' },
      { en: 'My mom is tired.', reading: 'มาย มอม อิส ไทร์ด', th: 'แม่ฉันเหนื่อย' },
    ],
  },
  {
    id: 'hungry', type: 'vocab', en: 'hungry', reading: 'ฮัง-กรี่', ipa: '/ˈhʌŋgri/', th: 'หิว',
    altTh: ['หิวข้าว'], pos: 'คำคุณศัพท์', level: 4, tags: ['core', 'feelings', 'food'],
    notes: 'หิวข้าว = I am hungry ไม่ต้องพูดถึงข้าว และต้องมี am คั่นเหมือนทุกครั้ง — "I hungry" ไม่ใช่ประโยค ออกเสียง "ฮัง-กรี่" พยางค์แรกดัง ระวังอย่าสับสนกับ angry (โกรธ) ที่ต่างกันแค่ตัว h ตัวเดียว — บอกว่าหิวแต่ฝรั่งได้ยินว่าโกรธ บรรยากาศจะเปลี่ยนทันที',
    mnemonic: 'hungry มี h — "ฮ" คือเสียงท้องร้อง ถ้าลืม h จะกลายเป็น angry โกรธ',
    examples: [
      { en: 'I am very hungry.', reading: 'ไอ แอ็ม เว-รี่ ฮัง-กรี่', th: 'ฉันหิวมาก' },
      { en: 'Are you hungry?', reading: 'อาร์ ยู ฮัง-กรี่', th: 'หิวไหม' },
    ],
  },
]

export const patterns: SentencePattern[] = [
  {
    id: 'p-i-like', level: 4,
    name: 'I like ___',
    enTemplate: 'I {verb} {thing}',
    readingTemplate: 'ไอ {verb} {thing}',
    thTemplate: 'ฉัน{verb}{thing}',
    slots: [
      { name: 'verb', itemIds: ['like', 'love', 'want', 'need', 'have'] },
      { name: 'thing', itemIds: ['coffee', 'beer', 'rice', 'chicken', 'water', 'it', 'thailand', 'bangkok'] },
    ],
    compat: {
      like: ['coffee', 'beer', 'rice', 'chicken', 'water', 'it', 'thailand', 'bangkok'],
      love: ['coffee', 'beer', 'rice', 'chicken', 'it', 'thailand', 'bangkok'],
      want: ['coffee', 'beer', 'rice', 'chicken', 'water', 'it'],
      need: ['coffee', 'water', 'it'],
      have: ['coffee', 'beer', 'rice', 'chicken', 'water', 'it'],
    },
    thOverrides: {
      'like+it': 'ฉันชอบมันนะ', 'love+it': 'ฉันชอบมันมากเลย', 'want+it': 'ฉันอยากได้มัน',
      'need+it': 'ฉันต้องการมัน', 'have+it': 'ฉันมีมันอยู่แล้ว',
      'love+coffee': 'ฉันชอบกาแฟมากๆ', 'love+beer': 'ฉันชอบเบียร์มากๆ',
      'love+rice': 'ฉันชอบข้าวมากๆ', 'love+chicken': 'ฉันชอบไก่มากๆ',
      'love+thailand': 'ฉันรักเมืองไทย', 'love+bangkok': 'ฉันรักกรุงเทพฯ',
    },
    explanation:
      'ประธาน + กริยา + กรรม เรียงเหมือนภาษาไทยเป๊ะ: I like coffee = ฉันชอบกาแฟ กับดักเดียวคือห้ามละ I — "like coffee" เฉยๆ ฟังเหมือนคำสั่งให้คนอื่นชอบ ไม่ใช่การบอกว่าคุณชอบ ' +
      'กริยาในช่องนี้สลับได้ตามใจ: like ชอบ, love ชอบมากๆ/รัก, want อยากได้, need ต้องการ, have มี — ทุกคำตามด้วยคำนามตรงๆ ไม่มีอะไรคั่น ' +
      'สังเกตว่าประโยคพวกนี้ไม่มี am เพราะ like/want เป็นกริยาเองแล้ว "I am like coffee" จึงผิด — am ใช้กับคำบอกสภาพ (I am hungry) เท่านั้น',
    showcase: [{ verb: 'like', thing: 'coffee' }, { verb: 'love', thing: 'thailand' }, { verb: 'need', thing: 'water' }],
    distractors: ['am', 'is', 'do', 'not'],
  },
  {
    id: 'p-i-dont', level: 4,
    name: "I don't ___",
    enTemplate: "I don't {verb} {thing}",
    readingTemplate: 'ไอ โดนต์ {verb} {thing}',
    thTemplate: 'ฉันไม่{verb}{thing}',
    slots: [
      { name: 'verb', itemIds: ['like', 'want', 'need', 'eat', 'drink', 'have'] },
      { name: 'thing', itemIds: ['coffee', 'beer', 'rice', 'chicken', 'water', 'sugar', 'ice', 'it'] },
    ],
    compat: {
      like: ['coffee', 'beer', 'rice', 'chicken', 'water', 'sugar', 'ice', 'it'],
      want: ['coffee', 'beer', 'rice', 'chicken', 'water', 'sugar', 'ice', 'it'],
      need: ['coffee', 'water', 'sugar', 'ice', 'it'],
      eat: ['rice', 'chicken', 'sugar'],
      drink: ['coffee', 'beer'],
      have: ['coffee', 'beer', 'rice', 'chicken', 'water', 'sugar', 'ice', 'it'],
    },
    thOverrides: {
      'like+it': 'ฉันไม่ชอบมัน', 'need+it': 'ฉันไม่ต้องการมัน', 'have+it': 'ฉันไม่มีมัน',
      'want+coffee': 'ฉันไม่เอากาแฟ', 'want+beer': 'ฉันไม่เอาเบียร์', 'want+rice': 'ฉันไม่เอาข้าว',
      'want+chicken': 'ฉันไม่เอาไก่', 'want+water': 'ฉันไม่เอาน้ำ', 'want+sugar': 'ฉันไม่เอาน้ำตาล',
      'want+ice': 'ฉันไม่เอาน้ำแข็ง', 'want+it': 'ฉันไม่เอามัน',
    },
    explanation:
      'ภาษาไทยแค่เอา "ไม่" ไว้หน้ากริยา (ไม่ชอบ ไม่กิน) แต่ภาษาอังกฤษต้องใช้ don\'t: I don\'t like sugar และกริยาที่ตามหลัง don\'t อยู่ในรูปเดิมเสมอ ' +
      'อย่าเอา not หรือ no ไปวางหน้ากริยาเอง — "I not like" และ "I no like" คือประโยคที่พัง not ใช้คู่กับ am/is/are และหน้าคำคุณศัพท์ (not spicy) ส่วน don\'t ใช้กับกริยาทั่วไป ' +
      'พูดเร็วๆ จะได้ยินเป็น "ไอ โดน ไลก์" — ต ท้าย don\'t แทบหายไป แต่คุณยังต้องรู้ว่ามันอยู่ตรงนั้น ไม่งั้นจะฟังเป็น "I do like" ซึ่งแปลว่าชอบมากเสียอีก',
    showcase: [{ verb: 'like', thing: 'sugar' }, { verb: 'drink', thing: 'beer' }, { verb: 'eat', thing: 'chicken' }],
    distractors: ['not', 'no', 'am', 'do'],
  },
  {
    id: 'p-do-you', level: 4,
    name: 'Do you ___?',
    enTemplate: 'Do you {verb} {thing}',
    readingTemplate: 'ดู ยู {verb} {thing}',
    thTemplate: 'คุณ{verb}{thing}ไหม',
    slots: [
      { name: 'verb', itemIds: ['like', 'want', 'need', 'have', 'eat', 'drink'] },
      { name: 'thing', itemIds: ['coffee', 'beer', 'rice', 'chicken', 'water', 'sugar', 'ice', 'bangkok'] },
    ],
    compat: {
      like: ['coffee', 'beer', 'rice', 'chicken', 'bangkok'],
      want: ['coffee', 'beer', 'rice', 'chicken', 'water', 'sugar', 'ice'],
      need: ['coffee', 'water', 'sugar', 'ice'],
      have: ['coffee', 'beer', 'rice', 'chicken', 'water', 'sugar', 'ice'],
      eat: ['rice', 'chicken'],
      drink: ['coffee', 'beer'],
    },
    thOverrides: {
      'want+coffee': 'คุณเอากาแฟไหม', 'want+beer': 'คุณเอาเบียร์ไหม', 'want+rice': 'คุณเอาข้าวไหม',
      'want+chicken': 'คุณเอาไก่ไหม', 'want+water': 'คุณเอาน้ำไหม', 'want+sugar': 'คุณเอาน้ำตาลไหม',
      'want+ice': 'คุณเอาน้ำแข็งไหม', 'like+bangkok': 'คุณชอบกรุงเทพฯ ไหม',
    },
    explanation:
      'ภาษาไทยถามว่าชอบไหมด้วยการเติม "ไหม" ท้ายประโยค แต่ภาษาอังกฤษเติม Do ไว้หน้าประโยคแทน: you like coffee → Do you like coffee? ที่เหลือเหมือนเดิมทุกคำ ' +
      'กับกริยาทั่วไป (like, want, have, eat) ต้องใช้ Do ไม่ใช่ Are — "Are you like coffee?" ผิด Are จากระดับ 1 ใช้เฉพาะกับคำบอกสภาพ (Are you hungry?) ' +
      'ตอบสั้นๆ ว่า Yes, I do หรือ No, I don\'t โดยไม่ต้องพูดกริยาซ้ำ และปลายประโยคขึ้นเสียงสูงเหมือนคำถามใช่/ไม่ใช่ทุกข้อ',
    showcase: [{ verb: 'like', thing: 'coffee' }, { verb: 'want', thing: 'water' }, { verb: 'have', thing: 'ice' }],
    distractors: ['are', 'is', 'dont', 'what'],
  },
]

export const level: Level = {
  n: 4,
  title: 'คนและความรู้สึก',
  titleEn: 'People & Feelings',
  subtitle: 'ครอบครัว ชอบ/ไม่ชอบ มาจากไหน ถามด้วย Do you …?',
  icon: '💛',
  canDo: [
    'บอกได้ว่าชอบหรือไม่ชอบอะไร (อาหาร เครื่องดื่ม สถานที่)',
    'ถามอีกฝ่ายว่าชอบ/อยากได้/มี … ไหม ด้วย Do you …?',
    'แนะนำคนในครอบครัวและเพื่อนด้วย This is my …',
    'บอกได้ว่ามาจากไหนและถามกลับได้ (Where are you from?)',
    'บอกความรู้สึก เหนื่อย หิว เศร้า และเน้นด้วย very / so ได้',
  ],
  itemIds: [
    'he', 'she', 'from', 'thailand', 'bangkok', 'where-are-you-from',
    'like', 'love', 'do', 'dont', 'very', 'so',
    'family', 'mom', 'dad', 'sister', 'brother', 'friend',
    'food', 'sad', 'tired', 'hungry',
  ],
  patternIds: ['p-i-like', 'p-i-dont', 'p-do-you'],
}
