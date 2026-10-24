import type { Level, LexItem, SentencePattern } from '../../core/types'

// Level 7 — Daily Life: where you live, work and study; what you can and
// can't do in English; phones, movies and music. The grammar is the two
// things Thai never does: the verb changes for he/she (likes, speaks, has)
// and the preposition splits (in a city, at a point).
//
// Readings/IPA are from scripts/reading-anchor.mts (CLAUDE.md §4).
// `lives` and `works` are added to the plan's 22: the first dialogue cannot
// say "my sister lives in Chiang Mai" or "she works at a hotel" without
// them, and they are the two -s forms a Thai adult says most.

export const items: LexItem[] = [
  {
    id: 'live', type: 'vocab', en: 'live', reading: 'ลิฟ', ipa: '/lɪv/', th: 'อาศัยอยู่',
    altTh: ['อยู่', 'พักอยู่'], pos: 'คำกริยา', level: 7, tags: ['core', 'place', 'verb'],
    notes: 'ใช้บอกว่าอยู่ที่ไหนเป็นประจำ — บ้าน เมือง ประเทศ: I live in Bangkok ภาษาไทยพูด "อยู่กรุงเทพฯ" ได้เลย แต่ภาษาอังกฤษต้องมี in คั่นก่อนชื่อเมืองเสมอ ระวังสระสั้น "ลิฟ" ไม่ใช่ "ไลฟ์" — ไลฟ์ คือ สด (ถ่ายทอดสด) คนละคำกัน',
    mnemonic: 'ลิฟ สั้นๆ เหมือน "ลิฟต์" ที่ขึ้นไปห้องที่คุณอยู่',
    examples: [
      { en: 'I live in Bangkok.', reading: 'ไอ ลิฟ อิน แบง-ค็อก', th: 'ฉันอยู่กรุงเทพฯ' },
      { en: 'Where do you live?', reading: 'แวร์ ดู ยู ลิฟ', th: 'คุณอยู่ที่ไหน' },
    ],
  },
  {
    id: 'work', type: 'vocab', en: 'work', reading: 'เวิร์ก', ipa: '/wɜrk/', th: 'ทำงาน',
    altTh: ['งาน', 'ที่ทำงาน'], pos: 'คำกริยา', level: 7, tags: ['core', 'work'],
    notes: 'เป็นได้ทั้งกริยา (I work in Bangkok = ฉันทำงานที่กรุงเทพฯ) และคำนามที่แปลว่า งาน หรือ ที่ทำงาน: at work = อยู่ที่ทำงาน วลีนี้ไม่มี the ออกเสียง "เวิร์ก" ห่อลิ้นตรง ร แล้วปิดท้ายด้วย k ให้ชัด',
    examples: [
      { en: 'I work in Chiang Mai.', reading: 'ไอ เวิร์ก อิน เชียง-ใหม่', th: 'ฉันทำงานที่เชียงใหม่' },
      { en: 'I am at work now.', reading: 'ไอ แอ็ม แอ็ต เวิร์ก นาว', th: 'ตอนนี้ฉันอยู่ที่ทำงาน' },
    ],
  },
  {
    id: 'study', type: 'vocab', en: 'study', reading: 'สตัด-ดี้', ipa: '/ˈstʌdi/', th: 'เรียน',
    altTh: ['ศึกษา', 'อ่านหนังสือ'], pos: 'คำกริยา', level: 7, tags: ['core', 'work', 'school'],
    notes: 'เรียนในระบบ (มหาวิทยาลัย คอร์ส) หรือนั่งอ่านหนังสือทบทวนก็ใช้ study: I study English = ฉันเรียนภาษาอังกฤษ ส่วน learn คือได้ความรู้หรือทักษะใหม่มาจริงๆ — study คือการกระทำ learn คือผลที่ได้ เน้นพยางค์แรก "สตัด" ให้หนัก พยางค์หลังเบา',
    examples: [
      { en: 'I study English.', reading: 'ไอ สตัด-ดี้ อิง-กลิช', th: 'ฉันเรียนภาษาอังกฤษ' },
      { en: 'Do you study in Bangkok?', reading: 'ดู ยู สตัด-ดี้ อิน แบง-ค็อก', th: 'คุณเรียนที่กรุงเทพฯ หรือเปล่า' },
    ],
  },
  {
    id: 'speak', type: 'vocab', en: 'speak', reading: 'สปีก', ipa: '/spik/', th: 'พูด (ภาษา)',
    altTh: ['พูดคุย'], pos: 'คำกริยา', level: 7, tags: ['core', 'social'],
    notes: 'ใช้กับภาษาเป็นหลัก: speak English, speak Thai — ไม่ต้องมีคำว่า "ภาษา" นำหน้า คำถามที่ชาวต่างชาติถามคุณบ่อยที่สุดคือ Do you speak English? ตอบว่า Yes, I can หรือ No ก็ได้ ออกเสียง ส นำแล้วตามด้วย ป ไม่มีลม: "สปีก" ไม่ใช่ "สะ-พีก"',
    examples: [
      { en: 'Do you speak English?', reading: 'ดู ยู สปีก อิง-กลิช', th: 'คุณพูดภาษาอังกฤษได้ไหม' },
      { en: 'I can speak Thai.', reading: 'ไอ แค็น สปีก ไท', th: 'ฉันพูดภาษาไทยได้' },
    ],
  },
  {
    id: 'english', type: 'vocab', en: 'English', reading: 'อิง-กลิช', ipa: '/ˈɪŋglɪʃ/', th: 'ภาษาอังกฤษ',
    altTh: ['อังกฤษ', 'คนอังกฤษ'], pos: 'คำนาม', level: 7, tags: ['core', 'social', 'language'],
    notes: 'คำเดียวหมายถึงภาษาอังกฤษ (I speak English) และใช้ขยายว่า "ของอังกฤษ / แบบอังกฤษ" ได้ด้วย เขียนตัวใหญ่ E เสมอ เหมือน Thai ออกเสียง "อิง-กลิช" — พยางค์แรกคือ อิง ไม่ใช่ เอ็ง และท้ายคำเป็นเสียง ช',
    examples: [
      { en: 'I study English.', reading: 'ไอ สตัด-ดี้ อิง-กลิช', th: 'ฉันเรียนภาษาอังกฤษ' },
      { en: 'She speaks English.', reading: 'ชี สปีกส์ อิง-กลิช', th: 'เธอพูดภาษาอังกฤษได้' },
    ],
  },
  {
    id: 'learn', type: 'vocab', en: 'learn', reading: 'เลิร์น', ipa: '/lɜrn/', th: 'เรียนรู้',
    altTh: ['หัด', 'ฝึก'], pos: 'คำกริยา', level: 7, tags: ['core', 'school'],
    notes: 'เรียนรู้จนทำเป็น: I want to learn English = ฉันอยากเรียนภาษาอังกฤษ (ให้พูดได้) ต่างจาก study ตรงที่ learn เน้นว่ามีอะไรใหม่เข้าหัว ไม่ใช่แค่นั่งเรียน ใช้กับทักษะทุกอย่าง ไม่เฉพาะภาษา ออกเสียง "เลิร์น" ห่อลิ้นตรง ร แล้วปิดด้วย น',
    examples: [
      { en: 'I want to learn English.', reading: 'ไอ วอนต์ ทู เลิร์น อิง-กลิช', th: 'ฉันอยากเรียนภาษาอังกฤษ' },
      { en: 'Do you want to learn Thai?', reading: 'ดู ยู วอนต์ ทู เลิร์น ไท', th: 'คุณอยากเรียนภาษาไทยไหม' },
    ],
  },
  {
    id: 'in', type: 'vocab', en: 'in', reading: 'อิน', ipa: '/ɪn/', th: 'ใน (เมือง ประเทศ)',
    altTh: ['ที่', 'ข้างใน'], pos: 'คำบุพบท', level: 7, tags: ['core', 'grammar', 'place'],
    notes: 'ใช้กับพื้นที่ใหญ่ที่เรา "อยู่ข้างใน" ได้ — เมือง ประเทศ ห้อง: in Bangkok, in Thailand ภาษาไทยใช้ "ที่" คำเดียวกับทุกอย่าง (อยู่ที่กรุงเทพฯ อยู่ที่บ้าน) แต่ภาษาอังกฤษแยกเป็นสองคำ: เมืองและประเทศใช้ in ส่วนจุดเล็กๆ อย่างบ้านหรือที่ทำงานใช้ at',
    examples: [
      { en: 'I live in Bangkok.', reading: 'ไอ ลิฟ อิน แบง-ค็อก', th: 'ฉันอยู่กรุงเทพฯ' },
      { en: 'She lives in Chiang Mai.', reading: 'ชี ลิฟส์ อิน เชียง-ใหม่', th: 'เธออยู่เชียงใหม่' },
    ],
  },
  {
    id: 'at', type: 'vocab', en: 'at', reading: 'แอ็ต', ipa: '/æt/', th: 'ที่ (จุดเฉพาะ)',
    altTh: ['อยู่ที่', 'ณ'], pos: 'คำบุพบท', level: 7, tags: ['core', 'grammar', 'place'],
    notes: 'ใช้กับ "จุด" ที่ชี้ได้บนแผนที่: at home, at work, at the hotel — ไม่ใช่พื้นที่กว้างอย่างเมือง สองวลีที่ใช้ทุกวันคือ at home (อยู่บ้าน) กับ at work (อยู่ที่ทำงาน) และทั้งคู่ไม่มี the ออกเสียงสั้น "แอ็ต" พูดเร็วๆ เสียงจะเบาลงมาก แต่ t ท้ายคำยังอยู่',
    examples: [
      { en: 'I am at home.', reading: 'ไอ แอ็ม แอ็ต โฮม', th: 'ฉันอยู่บ้าน' },
      { en: 'She is at work now.', reading: 'ชี อิส แอ็ต เวิร์ก นาว', th: 'ตอนนี้เธออยู่ที่ทำงาน' },
    ],
  },
  {
    id: 'chiang-mai', type: 'vocab', en: 'Chiang Mai', reading: 'เชียง-ใหม่', ipa: '/tʃiɑŋ ˈmaɪ/', th: 'เชียงใหม่',
    altTh: ['จังหวัดเชียงใหม่'], pos: 'คำนาม', level: 7, tags: ['place', 'travel'],
    notes: 'จังหวัดที่ชาวต่างชาติรู้จักมากที่สุดรองจากกรุงเทพฯ ภาษาอังกฤษเขียนแยกสองคำ ตัวใหญ่ทั้งคู่ ฝรั่งมักออกเสียงเป็น "เชียง-ไม" โทนเรียบ — คุณออกเสียงแบบไทยได้เลย เขาเข้าใจ ใช้กับ in เหมือนเมืองอื่น: in Chiang Mai',
    examples: [
      { en: 'I am from Chiang Mai.', reading: 'ไอ แอ็ม ฟรอม เชียง-ใหม่', th: 'ฉันมาจากเชียงใหม่' },
      { en: 'Do you like Chiang Mai?', reading: 'ดู ยู ไลก์ เชียง-ใหม่', th: 'คุณชอบเชียงใหม่ไหม' },
    ],
  },
  {
    id: 'cant', type: 'phrase', en: "can't", reading: 'แคนต์', ipa: '/kænt/', th: 'ไม่ได้ (ทำไม่ได้)',
    altTh: ['ไม่สามารถ'], altEn: ['cannot', 'can not'], pos: 'คำช่วย', level: 7, tags: ['core', 'grammar'],
    literal: 'ได้-ไม่',
    notes: 'can + not รวมเป็นคำเดียว วางหน้ากริยาเสมอ: I can\'t speak English ภาษาไทยเอา "ไม่ได้" ไว้ท้ายประโยค แต่ภาษาอังกฤษเอาไว้หน้ากริยา จุดที่พลาดกันมากที่สุดคือเสียง: can พูดเบาและสั้น ส่วน can\'t พูดหนัก ยาว และต้องมี ต ปิดท้าย — ถ้าไม่มี ต ฝรั่งจะได้ยินเป็น can แปลว่าทำได้ ตรงข้ามกับที่คุณตั้งใจ',
    mnemonic: 'can\'t = can + ต — ไม่มีเสียง ต ก็ไม่มีคำว่า "ไม่"',
    examples: [
      { en: "I can't speak English.", reading: 'ไอ แคนต์ สปีก อิง-กลิช', th: 'ฉันพูดภาษาอังกฤษไม่ได้' },
      { en: "I can't call you now.", reading: 'ไอ แคนต์ คอล ยู นาว', th: 'ตอนนี้ฉันโทรหาคุณไม่ได้' },
    ],
  },
  {
    id: 'does', type: 'vocab', en: 'does', reading: 'ดัส', ipa: '/dʌz/', th: 'ทำ (และใช้ขึ้นต้นคำถามกับ he, she, it)',
    altTh: ['ไหม (ถามถึง he, she, it)', 'รูป -s ของ do'], pos: 'คำช่วย', level: 7, tags: ['core', 'grammar', 'question'],
    notes: 'คู่ของ do สำหรับประธานคนเดียวที่ไม่ใช่ I/you: Does she work? Does he like coffee? พอมี does นำหน้าแล้ว กริยาข้างหลังกลับเป็นรูปธรรมดา ไม่เติม -s (Does she like ไม่ใช่ Does she likes) เพราะ -s ย้ายจากกริยามาอยู่ที่ does แล้ว ตอบว่า Yes, she does หรือ No, she doesn\'t',
    examples: [
      { en: 'Does she work?', reading: 'ดัส ชี เวิร์ก', th: 'เธอทำงานไหม' },
      { en: 'Does he like coffee?', reading: 'ดัส ฮี ไลก์ คอฟ-ฟี่', th: 'เขาชอบกาแฟไหม' },
    ],
  },
  {
    id: 'doesnt', type: 'phrase', en: "doesn't", reading: 'ดัซ-ซันต์', ipa: '/ˈdʌzənt/', th: 'ไม่ (ปฏิเสธ he, she, it)',
    altTh: ['ไม่ได้ทำ (he, she, it)'], altEn: ['does not'], pos: 'คำช่วย', level: 7, tags: ['core', 'grammar'],
    literal: 'ทำ-ไม่',
    notes: 'does + not ใช้ปฏิเสธเมื่อประธานเป็น he, she, it หรือคนเดียว: She doesn\'t like beer ภาษาไทยแค่ใส่ "ไม่" หน้ากริยา แต่ภาษาอังกฤษต้องใช้ doesn\'t แล้วกริยากลับเป็นรูปธรรมดา (doesn\'t like ไม่ใช่ doesn\'t likes) ถ้าประธานเป็น I/you/we ยังใช้ don\'t ตามเดิม ออกเสียง "ดัซ-ซันต์" ท้ายคำมี ต',
    examples: [
      { en: "She doesn't like beer.", reading: 'ชี ดัซ-ซันต์ ไลก์ เบียร์', th: 'เธอไม่ชอบเบียร์' },
      { en: "He doesn't speak Thai.", reading: 'ฮี ดัซ-ซันต์ สปีก ไท', th: 'เขาไม่พูดภาษาไทย' },
    ],
  },
  {
    id: 'likes', type: 'vocab', en: 'likes', reading: 'ไลกส์', ipa: '/laɪks/', th: 'ชอบ (he, she, it)',
    altTh: ['ชอบ (รูป -s)'], pos: 'คำกริยา (รูป -s)', level: 7, tags: ['core', 'grammar', '3sg'],
    notes: 'like ที่เติม -s เพราะประธานเป็น he, she หรือคนคนเดียว: She likes coffee, Mom likes music ภาษาไทย "เขาชอบ" กับ "ฉันชอบ" ใช้คำเดียวกัน แต่ภาษาอังกฤษเปลี่ยนรูปกริยาตามประธาน — ลืม -s ฝรั่งยังเข้าใจ แต่ฟังออกทันทีว่าเพิ่งเริ่มเรียน ออกเสียง ส ท้ายคำให้ได้ยิน "ไลกส์"',
    mnemonic: 'he / she / คนเดียว → กริยาต่อหาง -s เสมอ',
    examples: [
      { en: 'She likes coffee.', reading: 'ชี ไลกส์ คอฟ-ฟี่', th: 'เธอชอบกาแฟ' },
      { en: 'My dad likes music.', reading: 'มาย แด็ด ไลกส์ มิว-ซิก', th: 'พ่อฉันชอบฟังเพลง' },
    ],
  },
  {
    id: 'speaks', type: 'vocab', en: 'speaks', reading: 'สปีกส์', ipa: '/spiks/', th: 'พูด (he, she, it)',
    altTh: ['พูด (รูป -s)'], pos: 'คำกริยา (รูป -s)', level: 7, tags: ['core', 'grammar', '3sg'],
    notes: 'speak สำหรับ he, she และคนคนเดียว: He speaks English, My mom speaks Thai กฎเดียวจำง่าย: ประธานคนเดียวที่ไม่ใช่ฉันและคุณ → กริยาเติม -s ส่วนในคำถามและประโยคปฏิเสธ -s จะย้ายไปอยู่ที่ does / doesn\'t แทน (Does he speak Thai?)',
    examples: [
      { en: 'He speaks English.', reading: 'ฮี สปีกส์ อิง-กลิช', th: 'เขาพูดภาษาอังกฤษได้' },
      { en: 'She speaks Thai.', reading: 'ชี สปีกส์ ไท', th: 'เธอพูดภาษาไทยได้' },
    ],
  },
  {
    id: 'has', type: 'vocab', en: 'has', reading: 'แฮ็ส', ipa: '/hæz/', th: 'มี (he, she, it)',
    altTh: ['มี (รูป -s ของ have)'], pos: 'คำกริยา (รูป -s)', level: 7, tags: ['core', 'grammar', '3sg'],
    notes: 'รูป -s ของ have แต่ไม่ใช่ haves — เปลี่ยนทั้งคำเป็น has: She has a phone, He has my phone ใช้กับ he, she, it และคนคนเดียว ส่วน I / you / we ยังใช้ have ตามเดิม ออกเสียง "แฮ็ส" สั้นๆ ท้ายคำเป็นเสียง ส ก้อง',
    examples: [
      { en: 'She has a phone.', reading: 'ชี แฮ็ส อะ โฟน', th: 'เธอมีโทรศัพท์' },
      { en: 'He has my phone.', reading: 'ฮี แฮ็ส มาย โฟน', th: 'โทรศัพท์ฉันอยู่ที่เขา' },
    ],
  },
  {
    id: 'lives', type: 'vocab', en: 'lives', reading: 'ลิฟส์', ipa: '/lɪvz/', th: 'อาศัยอยู่ (he, she, it)',
    altTh: ['อยู่ (รูป -s)'], pos: 'คำกริยา (รูป -s)', level: 7, tags: ['core', 'grammar', '3sg', 'place'],
    notes: 'live ที่เติม -s สำหรับ he, she และคนคนเดียว: My sister lives in Chiang Mai ยังต้องมี in ก่อนชื่อเมืองเหมือนเดิม ออกเสียง "ลิฟส์" สระสั้น — ถ้าพูด "ไลฟ์ส" จะกลายเป็นคำว่า ชีวิต (หลายชีวิต) คนละคำกัน',
    examples: [
      { en: 'My sister lives in Chiang Mai.', reading: 'มาย ซิส-เตอร์ ลิฟส์ อิน เชียง-ใหม่', th: 'พี่สาวฉันอยู่เชียงใหม่' },
      { en: 'He lives in Bangkok.', reading: 'ฮี ลิฟส์ อิน แบง-ค็อก', th: 'เขาอยู่กรุงเทพฯ' },
    ],
  },
  {
    id: 'works', type: 'vocab', en: 'works', reading: 'เวิร์กส์', ipa: '/wɜrks/', th: 'ทำงาน (he, she, it)',
    altTh: ['ทำงาน (รูป -s)'], pos: 'คำกริยา (รูป -s)', level: 7, tags: ['core', 'grammar', '3sg', 'work'],
    notes: 'work สำหรับ he, she และคนคนเดียว: She works at a hotel, Dad works in Bangkok สังเกตคู่ที่ใช้บ่อย: works in + เมือง, works at + ที่ทำงาน ออกเสียง "เวิร์กส์" — มี k แล้วตามด้วย s ท้ายคำ สองเสียงติดกัน',
    examples: [
      { en: 'She works at a hotel.', reading: 'ชี เวิร์กส์ แอ็ต อะ โฮ-เทล', th: 'เธอทำงานที่โรงแรม' },
      { en: 'My brother works in Bangkok.', reading: 'มาย บรา-เธอร์ เวิร์กส์ อิน แบง-ค็อก', th: 'พี่ชายฉันทำงานที่กรุงเทพฯ' },
    ],
  },
  {
    id: 'phone', type: 'vocab', en: 'phone', reading: 'โฟน', ipa: '/foʊn/', th: 'โทรศัพท์',
    altTh: ['มือถือ'], altEn: ['cell phone', 'mobile phone', 'telephone'], pos: 'คำนาม', level: 7, tags: ['core', 'social', 'thing'],
    notes: 'ใช้ได้ทั้งโทรศัพท์บ้านและมือถือ — ในชีวิตประจำวันฝรั่งพูด my phone ไม่ค่อยพูด mobile phone ตัว ph ออกเสียงเป็น ฟ: "โฟน" ไม่ใช่ "โพน" และ n ท้ายคำต้องปิดปาก นับได้ จึงพูดว่า a phone, my phone',
    examples: [
      { en: 'This is my phone.', reading: 'ดิส อิส มาย โฟน', th: 'นี่โทรศัพท์ฉัน' },
      { en: 'Where is my phone?', reading: 'แวร์ อิส มาย โฟน', th: 'โทรศัพท์ฉันอยู่ไหน' },
    ],
  },
  {
    id: 'call', type: 'vocab', en: 'call', reading: 'คอล', ipa: '/kɔl/', th: 'โทรหา',
    altTh: ['โทร', 'เรียก'], pos: 'คำกริยา', level: 7, tags: ['core', 'social'],
    notes: 'โทรหาใคร = call + คนนั้นตรงๆ ไม่มี to: call her, call my mom ภาษาไทยพูด "โทรหาแม่" แต่ภาษาอังกฤษไม่มีคำว่า "หา" อีกความหมายคือเรียกชื่อ (What do you call this?) ออกเสียง "คอล" สระ ออ ยาว ล ท้ายคำแตะเพดาน',
    examples: [
      { en: 'I will call you later.', reading: 'ไอ วิล คอล ยู เล-เทอร์', th: 'เดี๋ยวฉันโทรหาคุณนะ' },
      { en: 'Can you call her?', reading: 'แค็น ยู คอล เฮอร์', th: 'คุณโทรหาเธอหน่อยได้ไหม' },
    ],
  },
  {
    id: 'movie', type: 'vocab', en: 'movie', reading: 'มู-วี่', ipa: '/ˈmuvi/', th: 'หนัง',
    altTh: ['ภาพยนตร์'], altEn: ['film'], pos: 'คำนาม', level: 7, tags: ['social', 'fun'],
    notes: 'คำแบบอเมริกันที่ใช้กันทั่วโลก ส่วน film เป็นแบบอังกฤษ ใช้แทนกันได้ นับได้ จึงต้องมี a: watch a movie = ดูหนัง (ภาษาไทยไม่ต้องมีอะไรนำหน้า) ออกเสียง "มู-วี่" ตัว v ฟันบนแตะริมฝีปากล่าง ไม่ใช่ "มู-หวี่"',
    examples: [
      { en: 'I want to watch a movie.', reading: 'ไอ วอนต์ ทู วอช อะ มู-วี่', th: 'ฉันอยากดูหนัง' },
      { en: 'Do you like this movie?', reading: 'ดู ยู ไลก์ ดิส มู-วี่', th: 'คุณชอบหนังเรื่องนี้ไหม' },
    ],
  },
  {
    id: 'music', type: 'vocab', en: 'music', reading: 'มิว-ซิก', ipa: '/ˈmjuzɪk/', th: 'เพลง',
    altTh: ['ดนตรี'], pos: 'คำนาม', level: 7, tags: ['social', 'fun'],
    notes: 'หมายถึงเพลงและดนตรีโดยรวม เป็นคำนับไม่ได้ — ไม่มี a music และไม่มี musics: I like music ถ้าหมายถึงเพลงเดียวเป็นเพลงๆ ใช้ a song (จะได้เรียนทีหลัง) ออกเสียง "มิว-ซิก" ตัว s ตรงกลางเป็นเสียง ซ ไม่ใช่ ส',
    examples: [
      { en: 'I like Thai music.', reading: 'ไอ ไลก์ ไท มิว-ซิก', th: 'ฉันชอบเพลงไทย' },
      { en: 'She likes music.', reading: 'ชี ไลกส์ มิว-ซิก', th: 'เธอชอบฟังเพลง' },
    ],
  },
  {
    id: 'watch', type: 'vocab', en: 'watch', reading: 'วอช', ipa: '/wɑtʃ/', th: 'ดู (หนัง ทีวี)',
    altTh: ['ชม', 'เฝ้าดู'], pos: 'คำกริยา', level: 7, tags: ['core', 'social'],
    notes: 'ดูสิ่งที่เคลื่อนไหวและใช้เวลาดู: watch a movie, watch TV ส่วน see คือเห็นหรือเจอโดยไม่ได้ตั้งใจจ้อง ภาษาไทยใช้ "ดู" คำเดียวทั้งสองแบบ แต่ภาษาอังกฤษแยก ออกเสียง "วอช" ท้ายคำเป็นเสียง ช ไม่ใช่ "วอต"',
    examples: [
      { en: 'I want to watch a movie.', reading: 'ไอ วอนต์ ทู วอช อะ มู-วี่', th: 'ฉันอยากดูหนัง' },
      { en: 'Can we watch it tonight?', reading: 'แค็น วี วอช อิต ทู-ไนต์', th: 'คืนนี้เราดูกันได้ไหม' },
    ],
  },
  {
    id: 'his', type: 'vocab', en: 'his', reading: 'ฮิส', ipa: '/hɪz/', th: 'ของเขา (ผู้ชาย)',
    altTh: ['ของเขา'], pos: 'คำสรรพนาม', level: 7, tags: ['core', 'grammar', 'people'],
    notes: 'คู่กับ he: his phone = โทรศัพท์ของเขา (ผู้ชาย) วางหน้าคำนามเหมือน my / your — ภาษาไทยเอา "ของเขา" ไว้หลังคำนาม แต่ภาษาอังกฤษเอาไว้หน้าเสมอ และภาษาไทยไม่แยกเพศของเจ้าของ แต่ภาษาอังกฤษแยก: ผู้ชาย his ผู้หญิง her ออกเสียง "ฮิส" ท้ายคำเป็นเสียง ส ก้อง',
    examples: [
      { en: 'This is his phone.', reading: 'ดิส อิส ฮิส โฟน', th: 'นี่โทรศัพท์ของเขา' },
      { en: 'His name is Tom.', reading: 'ฮิส เนม อิส ทอม', th: 'เขาชื่อทอม' },
    ],
  },
  {
    id: 'her', type: 'vocab', en: 'her', reading: 'เฮอร์', ipa: '/hɜr/', th: 'เธอ (หลังกริยา) / ของเธอ',
    altTh: ['หล่อน', 'ของหล่อน'], pos: 'คำสรรพนาม', level: 7, tags: ['core', 'grammar', 'people'],
    notes: 'คำเดียวทำสองหน้าที่: "เธอ" ที่อยู่หลังกริยา (I call her = ฉันโทรหาเธอ) และ "ของเธอ" หน้าคำนาม (her phone = โทรศัพท์ของเธอ) ดูจากตำแหน่ง: มีคำนามตามหลังคือ ของเธอ อยู่หลังกริยาคือ เธอ ระวังอย่าใช้ she หลังกริยา — I call she ผิด ออกเสียง "เฮอร์" ห่อลิ้นท้ายคำ',
    mnemonic: 'she อยู่หน้ากริยา her อยู่หลังกริยา — เหมือน I กับ my ที่สลับที่กันไม่ได้',
    examples: [
      { en: 'This is her phone.', reading: 'ดิส อิส เฮอร์ โฟน', th: 'นี่โทรศัพท์ของเธอ' },
      { en: 'I will call her later.', reading: 'ไอ วิล คอล เฮอร์ เล-เทอร์', th: 'เดี๋ยวฉันโทรหาเธอทีหลัง' },
    ],
  },
]

export const patterns: SentencePattern[] = [
  {
    id: 'p-i-live-in', level: 7,
    name: 'I live in ___ · She lives in ___',
    enTemplate: '{person} {verb} in {place}',
    readingTemplate: '{person} {verb} อิน {place}',
    thTemplate: '{person}{verb}ที่{place}',
    slots: [
      { name: 'person', itemIds: ['i', 'we', 'he', 'she', 'mom', 'dad'] },
      { name: 'verb', itemIds: ['live', 'work', 'study', 'lives', 'works'] },
      { name: 'place', itemIds: ['bangkok', 'thailand', 'chiang-mai'] },
    ],
    // I / we take the base verb; one other person takes the -s form.
    compat: {
      i: ['live', 'work', 'study'],
      we: ['live', 'work', 'study'],
      he: ['lives', 'works'],
      she: ['lives', 'works'],
      mom: ['lives', 'works'],
      dad: ['lives', 'works'],
    },
    explanation:
      'ภาษาไทยพูด "อยู่กรุงเทพฯ" หรือ "ทำงานเชียงใหม่" ได้โดยไม่ต้องมีคำเชื่อม แต่ภาษาอังกฤษต้องมี in คั่นก่อนชื่อเมืองหรือประเทศเสมอ: I live in Bangkok ' +
      'และดูที่กริยา: ถ้าประธานเป็น I หรือ we ใช้ live / work / study ตรงๆ แต่ถ้าเป็น he, she, แม่ หรือพ่อ — คนคนเดียวที่ไม่ใช่ฉันและคุณ — กริยาต้องเติม -s: She lives in Chiang Mai ' +
      'ภาษาไทยไม่เคยเปลี่ยนกริยาตามประธาน นี่จึงเป็นจุดที่ต้องฝึกจนติดปาก คำถามคู่กันคือ Where do you live?',
    showcase: [
      { person: 'i', verb: 'live', place: 'bangkok' },
      { person: 'she', verb: 'lives', place: 'chiang-mai' },
      { person: 'i', verb: 'study', place: 'thailand' },
    ],
    distractors: ['at', 'live', 'lives', 'from'],
  },
  {
    id: 'p-she-likes', level: 7,
    name: 'She likes ___',
    enTemplate: '{person} {verb} {thing}',
    readingTemplate: '{person} {verb} {thing}',
    thTemplate: '{person}{verb}{thing}',
    slots: [
      { name: 'person', itemIds: ['he', 'she', 'mom', 'dad'] },
      { name: 'verb', itemIds: ['likes', 'speaks', 'has'] },
      { name: 'thing', itemIds: ['coffee', 'tea', 'beer', 'chicken', 'english', 'thai', 'music', 'this-one'] },
    ],
    compat: {
      likes: ['coffee', 'tea', 'beer', 'chicken', 'english', 'music', 'this-one'],
      speaks: ['english', 'thai'],
      has: ['coffee', 'tea', 'beer', 'chicken', 'this-one'],
    },
    // `Thai` glosses as คนไทย; after speaks it is the language.
    thOverrides: {
      'he+speaks+thai': 'เขาพูดภาษาไทย',
      'she+speaks+thai': 'เธอพูดภาษาไทย',
      'mom+speaks+thai': 'แม่พูดภาษาไทย',
      'dad+speaks+thai': 'พ่อพูดภาษาไทย',
    },
    explanation:
      'เมื่อประธานเป็น he, she หรือคนคนเดียว (แม่ พ่อ เพื่อน) ที่ไม่ใช่ I / you กริยาต้องเติม -s: She likes coffee, He speaks English ' +
      'ภาษาไทยใช้ "ชอบ" คำเดียวกับทุกประธาน นี่จึงเป็นจุดที่คนไทยลืมบ่อยที่สุด have พิเศษหน่อย — ไม่ใช่ haves แต่เปลี่ยนทั้งคำเป็น has ' +
      'ส่วนเวลาถามหรือปฏิเสธ ใช้ Does she like …? / She doesn\'t like … แล้วกริยากลับเป็นรูปธรรมดา เพราะ -s ย้ายไปอยู่ที่ does แล้ว',
    showcase: [
      { person: 'she', verb: 'likes', thing: 'coffee' },
      { person: 'he', verb: 'speaks', thing: 'english' },
      { person: 'dad', verb: 'has', thing: 'this-one' },
    ],
    distractors: ['like', 'speak', 'have', 'does'],
  },
  {
    id: 'p-i-can',
    level: 7,
    name: "I can / can't ___",
    enTemplate: 'I {modal} {verb} {thing}',
    readingTemplate: 'ไอ {modal} {verb} {thing}',
    thTemplate: 'ฉัน{verb}{thing}{modal}',
    slots: [
      { name: 'modal', itemIds: ['can', 'cant'] },
      { name: 'verb', itemIds: ['speak', 'eat', 'drink', 'see', 'watch', 'call'] },
      { name: 'thing', itemIds: ['english', 'thai', 'chicken', 'beer', 'coffee', 'this-one', 'her', 'you'] },
    ],
    compat: {
      speak: ['english', 'thai'],
      eat: ['chicken', 'this-one'],
      drink: ['beer', 'coffee', 'this-one'],
      see: ['you', 'her'],
      watch: ['this-one'],
      call: ['you', 'her'],
    },
    // Thai for "can see" is มองเห็น / มองไม่เห็น, not เห็น…ได้; `Thai` after speak is the language.
    thOverrides: {
      'can+speak+thai': 'ฉันพูดภาษาไทยได้',
      'cant+speak+thai': 'ฉันพูดภาษาไทยไม่ได้',
      'can+see+you': 'ฉันมองเห็นคุณ',
      'cant+see+you': 'ฉันมองไม่เห็นคุณ',
      'can+see+her': 'ฉันมองเห็นเธอ',
      'cant+see+her': 'ฉันมองไม่เห็นเธอ',
    },
    explanation:
      'can (ได้) และ can\'t (ไม่ได้) วางหน้ากริยาเสมอ ตามด้วยกริยารูปธรรมดา: I can speak Thai ภาษาไทยเอา "ได้ / ไม่ได้" ไว้ท้ายประโยค แต่ภาษาอังกฤษเอาไว้หน้ากริยา ' +
      'และไม่ว่าประธานจะเป็นใคร can ไม่เติม -s (She can speak ไม่ใช่ She cans) ' +
      'จุดชี้ขาดอยู่ที่เสียง: can พูดเบาและสั้นแทบไม่ได้ยิน ส่วน can\'t พูดหนัก ยาว และมี ต ปิดท้าย — ถ้าพูด "แคน" ทั้งสองคำ ฝรั่งจะไม่รู้ว่าคุณทำได้หรือไม่ได้',
    showcase: [
      { modal: 'can', verb: 'speak', thing: 'thai' },
      { modal: 'cant', verb: 'speak', thing: 'english' },
      { modal: 'cant', verb: 'eat', thing: 'chicken' },
    ],
    distractors: ['not', 'dont', 'speaks', 'does'],
  },
]

export const level: Level = {
  n: 7,
  title: 'ชีวิตประจำวัน',
  titleEn: 'Daily Life',
  subtitle: 'อยู่ที่ไหน ทำงานอะไร พูดอังกฤษได้/ไม่ได้ และ he/she ลงท้าย -s',
  icon: '🏙️',
  canDo: [
    'บอกได้ว่าอยู่ ทำงาน หรือเรียนที่ไหน และถามกลับได้',
    'พูดถึงคนอื่นว่าเขาชอบอะไร พูดภาษาอะไร มีอะไร (likes / speaks / has)',
    'บอกได้ว่าพูดอังกฤษได้นิดหน่อยหรือยังพูดไม่ได้ (can / can\'t)',
    'ถามว่า he/she ทำ … ไหม ด้วย Does … ?',
    'คุยเรื่องโทรศัพท์ หนัง และเพลงแบบง่ายๆ ได้',
  ],
  itemIds: [
    'live', 'work', 'study', 'speak', 'english', 'learn',
    'in', 'at', 'chiang-mai',
    'cant', 'does', 'doesnt',
    'likes', 'speaks', 'has', 'lives', 'works',
    'phone', 'call', 'movie', 'music', 'watch',
    'his', 'her',
  ],
  patternIds: ['p-i-live-in', 'p-she-likes', 'p-i-can'],
}
