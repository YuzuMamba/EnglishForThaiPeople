import type { Level, LexItem, SentencePattern } from '../../core/types'

// Level 1 — the politeness kit + a two-line self-introduction.
// Everything a receptionist, barista or new acquaintance says in the first
// ten seconds. Every later level leans on these words constantly.
//
// Readings/IPA are from scripts/reading-anchor.mts (CLAUDE.md §4).

export const items: LexItem[] = [
  {
    id: 'hello', type: 'vocab', en: 'hello', reading: 'เฮล-โล', ipa: '/həˈloʊ/', th: 'สวัสดี',
    altTh: ['หวัดดี'], altEn: ['hi'], pos: 'คำทักทาย', level: 1, tags: ['core', 'greeting'],
    notes: 'ใช้ได้ทุกเวลา ทั้งเช้า บ่าย ค่ำ และใช้ได้กับทุกคน — ไม่ต้องมี ครับ/ค่ะ ต่อท้าย ภาษาอังกฤษใช้น้ำเสียงและรอยยิ้มแทน ส่วน hi สั้นกว่าและสบายๆ กว่า ใช้กับเพื่อนหรือคนที่เจอบ่อย',
    mnemonic: 'เสียง "เฮล-โล" — เน้นพยางค์หลัง โล ให้ยาวและสูงขึ้นนิดหนึ่ง จะฟังเป็นมิตรทันที',
    examples: [
      { en: 'Hello! I am Nam.', reading: 'เฮล-โล ไอ แอ็ม น้ำ', th: 'สวัสดี! ฉันชื่อน้ำ' },
      { en: 'Hello, Tom. How are you?', reading: 'เฮล-โล ทอม ฮาว อาร์ ยู', th: 'สวัสดีทอม สบายดีไหม' },
    ],
  },
  {
    id: 'bye', type: 'vocab', en: 'bye', reading: 'บาย', ipa: '/baɪ/', th: 'ลาก่อน',
    altTh: ['บ๊ายบาย', 'ไปก่อนนะ'], altEn: ['goodbye', 'bye bye'], pos: 'คำทักทาย', level: 1, tags: ['core', 'greeting'],
    notes: 'คำลาที่ใช้จริงในชีวิตประจำวัน goodbye เป็นทางการกว่าและใช้น้อยกว่า ส่วน bye bye ฟังน่ารักแบบเด็กๆ ใช้กับคนสนิทได้ คนไทยชอบพูด "บ๊ายบาย" อยู่แล้ว — แค่ตัดให้เหลือ bye คำเดียวก็เป็นธรรมชาติ',
    examples: [
      { en: 'Bye, Tom!', reading: 'บาย ทอม', th: 'บาย ทอม!' },
      { en: 'Okay, bye!', reading: 'โอ-เค บาย', th: 'โอเค บาย!' },
    ],
  },
  {
    id: 'thank-you', type: 'phrase', en: 'thank you', reading: 'แธงค์ ยู', ipa: '/θæŋk/ /ju/', th: 'ขอบคุณ',
    altTh: ['ขอบใจ'], altEn: ['thanks', 'thank you very much'], pos: 'วลี', level: 1, tags: ['core', 'polite'],
    literal: 'ขอบคุณ-คุณ',
    notes: 'พูดได้บ่อยเท่าที่อยากพูด ฝรั่งพูด thank you กับพนักงาน กับคนขับ กับทุกคน — บ่อยกว่าที่คนไทยพูดขอบคุณมาก ระวังเสียง th: ลิ้นแตะฟันบน ไม่ใช่ "แต๊งกิ้ว" และ thanks (แธงค์ส) สั้นกว่า ใช้กับเรื่องเล็กๆ',
    mnemonic: 'แลบลิ้นแตะฟันก่อนพูด "แธงค์" — ถ้าลิ้นไม่แตะฟัน จะกลายเป็น tank (ถัง)',
    examples: [
      { en: 'Thank you, Nam.', reading: 'แธงค์ ยู น้ำ', th: 'ขอบคุณนะน้ำ' },
      { en: 'Thank you! I am happy.', reading: 'แธงค์ ยู ไอ แอ็ม แฮป-ปี้', th: 'ขอบคุณ! ฉันดีใจ' },
    ],
  },
  {
    id: 'yes', type: 'vocab', en: 'yes', reading: 'เย็ส', ipa: '/jɛs/', th: 'ใช่',
    altTh: ['ครับ', 'ค่ะ', 'ตอบรับ'], altEn: ['yeah', 'yep'], pos: 'คำตอบรับ', level: 1, tags: ['core', 'reaction'],
    notes: 'ภาษาอังกฤษไม่มี ครับ/ค่ะ — คำตอบรับคือ yes ตรงๆ และต้องออกเสียง s ท้ายคำให้ได้ยิน (เย็ส ไม่ใช่ เย็ด) ในการพูดจริงมักได้ยิน yeah (เย) ซึ่งสบายๆ กว่า',
    examples: [{ en: 'Yes, I am Thai.', reading: 'เย็ส ไอ แอ็ม ไท', th: 'ใช่ ฉันเป็นคนไทย' }],
  },
  {
    id: 'no', type: 'vocab', en: 'no', reading: 'โน', ipa: '/noʊ/', th: 'ไม่',
    altTh: ['ไม่ใช่', 'เปล่า'], altEn: ['nope'], pos: 'คำตอบรับ', level: 1, tags: ['core', 'reaction'],
    notes: 'ใช้ตอบปฏิเสธ และใช้นำหน้าคำนามได้ด้วย: no sugar = ไม่ใส่น้ำตาล ส่วน "ไม่" ที่อยู่หน้ากริยา (ไม่กิน ไม่ไป) ภาษาอังกฤษใช้คำอื่น ซึ่งจะเจอในระดับ 2 และ 4 ออกเสียงให้ท้ายคำกลมๆ "โน-ว" ไม่ใช่ "โน๊" ห้วนๆ',
    examples: [{ en: 'No, I am fine.', reading: 'โน ไอ แอ็ม ไฟน์', th: 'ไม่ ฉันสบายดี' }],
  },
  {
    id: 'please', type: 'vocab', en: 'please', reading: 'พลีส', ipa: '/pliz/', th: 'ได้โปรด',
    altTh: ['หน่อย', 'กรุณา'], pos: 'คำวิเศษณ์', level: 1, tags: ['core', 'polite'],
    notes: 'คำเดียวที่เปลี่ยนคำสั่งให้เป็นคำขอ — ทำหน้าที่เหมือน "หน่อย" ท้ายประโยคไทย วางท้ายประโยคได้เสมอ: Coffee, please. ภาษาอังกฤษไม่มีครับ/ค่ะ ดังนั้น please คือความสุภาพที่คนฟังได้ยินชัดที่สุด ออกเสียง ส ท้ายคำให้ได้ยิน',
    examples: [{ en: 'Yes, please.', reading: 'เย็ส พลีส', th: 'ค่ะ/ครับ เอาค่ะ (ตอบรับเมื่อมีคนเสนอให้)' }],
  },
  {
    id: 'sorry', type: 'vocab', en: 'sorry', reading: 'ซอ-รี่', ipa: '/ˈsɑri/', th: 'ขอโทษ',
    altTh: ['เสียใจ'], altEn: ["I'm sorry", 'i am sorry'], pos: 'คำอุทาน', level: 1, tags: ['core', 'polite'],
    notes: 'ใช้ได้ทั้งตอนชนคน ตอนทำผิด และตอนเสียใจกับเรื่องของอีกฝ่าย ฝรั่งพูด sorry บ่อยมาก แม้เรื่องเล็กนิดเดียว ส่วน "ขอโทษครับ" แบบเรียกให้คนหันมา (ขอทางหน่อย) ใช้ excuse me ซึ่งจะเจอในระดับ 3',
    mnemonic: 'เสียง r ตรงกลาง ห่อลิ้น ไม่รัว — "ซอ-รี่" ไม่ใช่ "ซอ-หลี่"',
    examples: [{ en: 'Sorry! Are you okay?', reading: 'ซอ-รี่ อาร์ ยู โอ-เค', th: 'ขอโทษ! คุณโอเคไหม' }],
  },
  {
    id: 'i', type: 'vocab', en: 'I', reading: 'ไอ', ipa: '/aɪ/', th: 'ฉัน',
    altTh: ['ผม', 'ดิฉัน'], pos: 'คำสรรพนาม', level: 1, tags: ['core', 'pronoun', 'grammar'],
    notes: 'คำเดียวใช้ได้ทั้งผู้ชายผู้หญิง ไม่มีผม/ฉัน/หนู และเขียนตัวใหญ่ I เสมอ กฎสำคัญที่สุด: ภาษาไทยละประธานได้ (สบายดี = ฉันสบายดี) แต่ภาษาอังกฤษละไม่ได้เลย — ต้องพูด I ทุกครั้ง ประโยค "am fine" ที่ไม่มี I คือประโยคที่พัง',
    examples: [{ en: 'I am Nam.', reading: 'ไอ แอ็ม น้ำ', th: 'ฉันชื่อน้ำ / ฉันคือน้ำ' }],
  },
  {
    id: 'you', type: 'vocab', en: 'you', reading: 'ยู', ipa: '/ju/', th: 'คุณ',
    altTh: ['เธอ', 'นาย'], pos: 'คำสรรพนาม', level: 1, tags: ['core', 'pronoun'],
    notes: 'คำเดียวใช้กับทุกคน ทุกวัย ทุกสถานะ — ไม่มีการเลือกระหว่าง คุณ/เธอ/แก/ท่าน ความสุภาพอยู่ที่น้ำเสียงและ please ไม่ได้อยู่ที่สรรพนาม และ you เป็นได้ทั้งประธาน (You are good) และกรรม (Thank you) โดยไม่เปลี่ยนรูป',
    examples: [
      { en: 'Are you okay?', reading: 'อาร์ ยู โอ-เค', th: 'คุณโอเคไหม' },
      { en: 'Thank you.', reading: 'แธงค์ ยู', th: 'ขอบคุณ' },
    ],
  },
  {
    id: 'am', type: 'vocab', en: 'am', reading: 'แอ็ม', ipa: '/æm/', th: 'เป็น (ใช้กับ I)',
    altTh: ['อยู่', 'คือ', 'กริยา be ของ I'], pos: 'คำกริยา', level: 1, tags: ['core', 'grammar'],
    notes: 'กริยาที่ภาษาไทยไม่มี: ไทยพูด "ฉันสบายดี" โดยไม่มีอะไรคั่น แต่ภาษาอังกฤษต้องมี am คั่นระหว่าง I กับสภาพเสมอ (I am fine) am ใช้กับ I เท่านั้น พูดเร็วๆ จะย่อเป็น I\'m (ไอม์) ซึ่งเป็นแบบที่ได้ยินบ่อยที่สุด',
    mnemonic: 'I ต้องมี am ประกบ — I am เป็นคู่แฝด แยกกันไม่ได้',
    examples: [{ en: 'I am fine.', reading: 'ไอ แอ็ม ไฟน์', th: 'ฉันสบายดี' }],
  },
  {
    id: 'are', type: 'vocab', en: 'are', reading: 'อาร์', ipa: '/ɑr/', th: 'เป็น (ใช้กับ you)',
    altTh: ['อยู่', 'คือ', 'กริยา be ของ you'], pos: 'คำกริยา', level: 1, tags: ['core', 'grammar'],
    notes: 'คู่ของ am สำหรับ you: You are good. และนี่คือวิธีตั้งคำถามแบบไม่มี "ไหม" — ย้าย are ไปไว้หน้า you: Are you okay? ภาษาอังกฤษไม่มีคำว่าไหม การสลับที่คือคำถาม ออกเสียง ร ท้ายคำเบาๆ แบบอเมริกัน "อาร์"',
    examples: [
      { en: 'Are you Thai?', reading: 'อาร์ ยู ไท', th: 'คุณเป็นคนไทยหรือเปล่า' },
      { en: 'You are good.', reading: 'ยู อาร์ กุด', th: 'คุณเก่ง / คุณดี' },
    ],
  },
  {
    id: 'my', type: 'vocab', en: 'my', reading: 'มาย', ipa: '/maɪ/', th: 'ของฉัน',
    altTh: ['ของผม'], pos: 'คำสรรพนาม', level: 1, tags: ['core', 'pronoun', 'grammar'],
    notes: 'ภาษาไทยเอา "ของฉัน" ไว้หลังคำนาม (ชื่อของฉัน) แต่ภาษาอังกฤษเอา my ไว้หน้าเสมอ: my name ไม่ใช่ name my เป็นคำที่ต้องสลับลำดับในหัวทุกครั้งในช่วงแรก',
    examples: [{ en: 'My name is Nam.', reading: 'มาย เนม อิส น้ำ', th: 'ฉันชื่อน้ำ (is จะเจอในระดับ 2)' }],
  },
  {
    id: 'your', type: 'vocab', en: 'your', reading: 'ยอร์', ipa: '/jɔr/', th: 'ของคุณ',
    altTh: ['ของเธอ'], pos: 'คำสรรพนาม', level: 1, tags: ['core', 'pronoun', 'grammar'],
    notes: 'คู่ของ my: your name = ชื่อของคุณ วางหน้าคำนามเหมือนกัน ออกเสียงคล้าย you แต่มี ร ปิดท้าย — ถ้าพูดเป็น "ยู เนม" ฝรั่งจะงงว่าหมายถึงอะไร',
    examples: [
      { en: "What's your name?", reading: 'วอตส์ ยอร์ เนม', th: 'คุณชื่ออะไร' },
      { en: 'Your name, please?', reading: 'ยอร์ เนม พลีส', th: 'ขอชื่อด้วยค่ะ/ครับ' },
    ],
  },
  {
    id: 'name', type: 'vocab', en: 'name', reading: 'เนม', ipa: '/neɪm/', th: 'ชื่อ',
    pos: 'คำนาม', level: 1, tags: ['core', 'intro'],
    notes: 'คำนามล้วนๆ ไม่เป็นกริยาเหมือน "ชื่อ" ในภาษาไทย (ฉันชื่อน้ำ) ภาษาอังกฤษต้องพูด My name is Nam หรือ I am Nam ออกเสียง m ท้ายคำให้ปิดปาก',
    examples: [{ en: 'My name is Nam.', reading: 'มาย เนม อิส น้ำ', th: 'ฉันชื่อน้ำ' }],
  },
  {
    id: 'fine', type: 'vocab', en: 'fine', reading: 'ไฟน์', ipa: '/faɪn/', th: 'สบายดี',
    altTh: ['ดี', 'ไม่เป็นไร'], pos: 'คำคุณศัพท์', level: 1, tags: ['core', 'state'],
    notes: 'คำตอบมาตรฐานของ How are you? คือ I am fine แปลว่าสบายดี และยังใช้บอกว่า "ไม่เป็นไร" ได้เมื่อมีคนขอโทษ: It\'s fine. ออกเสียง f ให้ฟันบนแตะริมฝีปากล่าง ไม่ใช่ "ไพน์"',
    examples: [{ en: 'I am fine, thank you.', reading: 'ไอ แอ็ม ไฟน์ แธงค์ ยู', th: 'ฉันสบายดี ขอบคุณ' }],
  },
  {
    id: 'okay', type: 'vocab', en: 'okay', reading: 'โอ-เค', ipa: '/ˌoʊˈkeɪ/', th: 'โอเค',
    altTh: ['ตกลง', 'ไม่เป็นไร'], altEn: ['OK', 'ok'], pos: 'คำคุณศัพท์', level: 1, tags: ['core', 'state', 'reaction'],
    notes: 'คำที่ทำงานหนักที่สุดในภาษาอังกฤษ: เป็นคำตอบรับ (Okay!) เป็นสภาพ (I am okay = ฉันโอเค/ไม่เป็นไร) และเป็นคำถามห่วงใย (Are you okay?) สะกดได้ทั้ง okay และ OK',
    examples: [
      { en: 'Are you okay?', reading: 'อาร์ ยู โอ-เค', th: 'คุณโอเคไหม / เป็นอะไรหรือเปล่า' },
      { en: 'Okay, bye!', reading: 'โอ-เค บาย', th: 'โอเค บาย!' },
    ],
  },
  {
    id: 'good', type: 'vocab', en: 'good', reading: 'กุด', ipa: '/gʊd/', th: 'ดี',
    altTh: ['เก่ง'], pos: 'คำคุณศัพท์', level: 1, tags: ['core', 'state'],
    notes: 'ใช้ชมของ ชมคน และตอบว่าสบายดีก็ได้ (I am good = ฉันสบายดี แบบสบายๆ กว่า fine) ระวังสระสั้น: "กุด" ไม่ใช่ "กู๊ด" และ d ท้ายคำต้องมี',
    examples: [{ en: 'I am good.', reading: 'ไอ แอ็ม กุด', th: 'ฉันสบายดี (แบบสบายๆ)' }],
  },
  {
    id: 'happy', type: 'vocab', en: 'happy', reading: 'แฮป-ปี้', ipa: '/ˈhæpi/', th: 'ดีใจ',
    altTh: ['มีความสุข'], pos: 'คำคุณศัพท์', level: 1, tags: ['core', 'feeling'],
    notes: 'ครอบคลุมทั้ง ดีใจ และ มีความสุข ใช้บอกความรู้สึกตอนนี้ได้เลย: I am happy เน้นพยางค์แรก "แฮป" ให้ดัง พยางค์หลังเบาและสั้น',
    examples: [
      { en: 'I am happy.', reading: 'ไอ แอ็ม แฮป-ปี้', th: 'ฉันดีใจ' },
      { en: 'Are you happy?', reading: 'อาร์ ยู แฮป-ปี้', th: 'คุณมีความสุขไหม' },
    ],
  },
  {
    id: 'thai', type: 'vocab', en: 'Thai', reading: 'ไท', ipa: '/taɪ/', th: 'คนไทย',
    altTh: ['ไทย', 'ภาษาไทย'], pos: 'คำคุณศัพท์', level: 1, tags: ['core', 'identity'],
    notes: 'คำเดียวแปลได้ทั้ง ไทย คนไทย และภาษาไทย ตามบริบท: I am Thai = ฉันเป็นคนไทย เขียนตัวใหญ่เสมอ T ออกเสียง "ไท" ไม่มี h ลม — ฝรั่งไม่พูด "ไท-ฮ"',
    examples: [
      { en: 'I am Thai.', reading: 'ไอ แอ็ม ไท', th: 'ฉันเป็นคนไทย' },
      { en: 'Are you Thai?', reading: 'อาร์ ยู ไท', th: 'คุณเป็นคนไทยหรือเปล่า' },
    ],
  },
  {
    id: 'nice-to-meet-you', type: 'phrase', en: 'nice to meet you', reading: 'ไนส์ ทู มีต ยู', ipa: '/naɪs/ /tu/ /mit/ /ju/', th: 'ยินดีที่ได้รู้จัก',
    altTh: ['ดีใจที่ได้เจอ'], altEn: ['nice to meet you too', 'nice meeting you'], pos: 'วลี', level: 1, tags: ['core', 'intro', 'polite'],
    literal: 'ดี-ที่-พบ-คุณ',
    notes: 'พูดตอนรู้จักกันครั้งแรก หลังจากบอกชื่อ อีกฝ่ายมักตอบกลับว่า Nice to meet you too จำเป็นก้อนเดียว ส่วนประกอบ (nice, meet) จะได้เรียนแยกทีหลัง ออกเสียง ส ท้าย nice และ ต ท้าย meet ให้ได้ยิน',
    examples: [{ en: 'Hello, Tom. Nice to meet you.', reading: 'เฮล-โล ทอม ไนส์ ทู มีต ยู', th: 'สวัสดีทอม ยินดีที่ได้รู้จัก' }],
  },
  {
    id: 'how-are-you', type: 'phrase', en: 'how are you', reading: 'ฮาว อาร์ ยู', ipa: '/haʊ/ /ɑr/ /ju/', th: 'สบายดีไหม',
    altTh: ['เป็นยังไงบ้าง'], altEn: ["how're you", 'how are you doing'], pos: 'วลี', level: 1, tags: ['core', 'intro', 'greeting'],
    literal: 'อย่างไร-เป็น-คุณ',
    notes: 'คำทักทายที่ตามหลัง hello แทบทุกครั้ง ส่วนใหญ่ไม่ได้ถามจริงจัง — ตอบสั้นๆ ว่า I am fine หรือ Good, thank you แล้วถามกลับ And you? ก็พอ สังเกตว่า are อยู่หน้า you เหมือนคำถาม Are you …? เพราะเป็นคำถามเหมือนกัน',
    examples: [{ en: 'Hello! How are you?', reading: 'เฮล-โล ฮาว อาร์ ยู', th: 'สวัสดี! สบายดีไหม' }],
  },
  {
    id: 'whats-your-name', type: 'phrase', en: "what's your name", reading: 'วอตส์ ยอร์ เนม', ipa: '/wʌts/ /jɔr/ /neɪm/', th: 'คุณชื่ออะไร',
    altTh: ['ชื่ออะไร'], altEn: ['what is your name'], pos: 'วลี', level: 1, tags: ['core', 'intro', 'question'],
    literal: 'อะไร-คือ-ของคุณ-ชื่อ',
    notes: 'คำถามเปิดบทสนทนา what\'s = what is (จะได้เรียนทั้ง what และ is ในระดับ 2) สังเกตลำดับ: คำถามขึ้นต้นประโยค ตามด้วย your name — กลับกับไทยที่ "อะไร" อยู่ท้าย ตอบว่า I am … หรือ My name is …',
    examples: [{ en: "Hello! What's your name?", reading: 'เฮล-โล วอตส์ ยอร์ เนม', th: 'สวัสดี! คุณชื่ออะไร' }],
  },
]

export const patterns: SentencePattern[] = [
  {
    id: 'p-i-am', level: 1,
    name: 'I am ___',
    enTemplate: 'I am {state}',
    readingTemplate: 'ไอ แอ็ม {state}',
    thTemplate: 'ฉัน{state}',
    slots: [{ name: 'state', itemIds: ['fine', 'okay', 'happy', 'thai', 'sorry'] }],
    thOverrides: { thai: 'ฉันเป็นคนไทย', sorry: 'ฉันขอโทษ' },
    explanation:
      'ภาษาไทยพูด "ฉันสบายดี" โดยไม่มีอะไรคั่นระหว่างฉันกับสบายดี แต่ภาษาอังกฤษต้องมีกริยา am คั่นทุกครั้ง: I am fine. ' +
      'และ I ละไม่ได้เลย — "am fine" เฉยๆ ไม่ใช่ประโยค ' +
      'แบบที่ได้ยินในชีวิตจริงคือ I\'m (ไอม์) ซึ่งเป็นคำเดียวกันพูดเร็ว ตอนพิมพ์ตอบ ระบบรับทั้งสองแบบ',
    showcase: [{ state: 'fine' }, { state: 'thai' }, { state: 'sorry' }],
    distractors: ['you', 'your', 'name', 'hello'],
  },
  {
    id: 'p-are-you', level: 1,
    name: 'Are you ___?',
    enTemplate: 'Are you {state}',
    readingTemplate: 'อาร์ ยู {state}',
    thTemplate: 'คุณ{state}ไหม',
    slots: [{ name: 'state', itemIds: ['okay', 'fine', 'happy', 'thai'] }],
    thOverrides: { thai: 'คุณเป็นคนไทยหรือเปล่า' },
    explanation:
      'ภาษาอังกฤษไม่มีคำว่า "ไหม" คำถามเกิดจากการสลับที่: ประโยคบอกเล่า You are okay กลายเป็นคำถามเมื่อย้าย are มาไว้หน้า you — Are you okay? ' +
      'ตอบว่า Yes, I am หรือ No ไม่ใช่ตอบด้วยคำคุณศัพท์เปล่าๆ แบบไทย (โอเค) ' +
      'น้ำเสียงท้ายประโยคขึ้นสูง เพราะเป็นคำถามแบบใช่/ไม่ใช่',
    showcase: [{ state: 'okay' }, { state: 'thai' }, { state: 'happy' }],
    distractors: ['i', 'am', 'my', 'bye'],
  },
]

export const level: Level = {
  n: 1,
  title: 'คำแรก',
  titleEn: 'First Words',
  subtitle: 'ทักทาย ขอบคุณ แนะนำตัว — พูดได้ตั้งแต่วันแรก',
  icon: '👋',
  canDo: [
    'ทักทายและบอกลาลูกค้าต่างชาติได้อย่างมั่นใจ',
    'ขอบคุณและขอโทษได้ถูกสถานการณ์',
    'บอกชื่อตัวเองและถามชื่ออีกฝ่ายได้',
    'บอกได้ว่าสบายดี โอเค หรือเป็นคนไทย ด้วยประโยค I am …',
    'ถามว่าอีกฝ่ายโอเคไหมด้วย Are you …? และตอบ Yes / No ได้',
  ],
  itemIds: [
    'hello', 'bye', 'thank-you', 'yes', 'no', 'please', 'sorry',
    'i', 'you', 'am', 'are', 'my', 'your', 'name',
    'fine', 'okay', 'good', 'happy', 'thai',
    'nice-to-meet-you', 'how-are-you', 'whats-your-name',
  ],
  patternIds: ['p-i-am', 'p-are-you'],
}
