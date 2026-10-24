import type { ListeningExercise } from '../core/types'

// Listening Lab dialogues — short natural-speed English conversations built
// (almost) entirely from vocabulary taught at or below their level. Questions
// test MEANING and situation, in Thai, never word-by-word translation.
//
// The fixed cast and their genders, for voice casting (scripts/generate-audio.mts
// gives each character one voice of the right gender across every dialogue):
export const CAST: Record<string, 'MALE' | 'FEMALE'> = {
  Nam: 'FEMALE', Ploy: 'FEMALE', Fah: 'FEMALE', Bank: 'MALE', Tee: 'MALE', Nut: 'MALE',
  Emma: 'FEMALE', Sarah: 'FEMALE', Anna: 'FEMALE', Tom: 'MALE', Jack: 'MALE', 'Mr. Lee': 'MALE',
}

export const LISTENING: ListeningExercise[] = [

  // ── Added 2026-10-24 from level01.ts ──────────────────────────────
  {
    id: 'lis-hostel-first-meeting',
    level: 1,
    lines: [
      { speaker: 'Nam', en: 'Hello!', reading: 'เฮล-โล', th: 'สวัสดีค่ะ!' },
      { speaker: 'Emma', en: 'Hello.', reading: 'เฮล-โล', th: 'สวัสดี' },
      { speaker: 'Nam', en: "What's your name?", reading: 'วอตส์ ยอร์ เนม', th: 'คุณชื่ออะไรคะ' },
      { speaker: 'Emma', en: "I am Emma. What's your name?", reading: 'ไอ แอ็ม เอ็ม-ม่า วอตส์ ยอร์ เนม', th: 'ฉันชื่อเอ็มม่า คุณชื่ออะไร' },
      { speaker: 'Nam', en: 'I am Nam. Nice to meet you, Emma.', reading: 'ไอ แอ็ม น้ำ ไนส์ ทู มีต ยู เอ็ม-ม่า', th: 'ฉันชื่อน้ำ ยินดีที่ได้รู้จักค่ะ เอ็มม่า' },
      { speaker: 'Emma', en: 'Nice to meet you, Nam.', reading: 'ไนส์ ทู มีต ยู น้ำ', th: 'ยินดีที่ได้รู้จักเหมือนกัน น้ำ' },
      { speaker: 'Nam', en: 'How are you?', reading: 'ฮาว อาร์ ยู', th: 'สบายดีไหมคะ' },
      { speaker: 'Emma', en: 'I am fine, thank you.', reading: 'ไอ แอ็ม ไฟน์ แธงค์ ยู', th: 'สบายดี ขอบคุณ' },
    ],
    question: 'น้ำกับเอ็มม่ารู้จักกันมาก่อนหรือเปล่า?',
    choices: [
      'เพิ่งเจอกันครั้งแรก',
      'เป็นเพื่อนเก่าที่ไม่ได้เจอกันนาน',
      'เป็นเพื่อนร่วมงานกัน',
      'เคยเจอกันเมื่อวานนี้',
    ],
    answer: 0,
    explanation:
      'สังเกตจาก What\'s your name? (คุณชื่ออะไร) และ Nice to meet you (ยินดีที่ได้รู้จัก) — สองประโยคนี้พูดเฉพาะตอนเจอกันครั้งแรกเท่านั้น ถ้ารู้จักกันอยู่แล้วจะไม่ถามชื่อกัน',
  },
  {
    id: 'lis-cafe-tray',
    level: 1,
    lines: [
      { speaker: 'Tom', en: 'Sorry! Sorry!', reading: 'ซอ-รี่ ซอ-รี่', th: 'ขอโทษ! ขอโทษครับ!' },
      { speaker: 'Ploy', en: 'Are you okay?', reading: 'อาร์ ยู โอ-เค', th: 'คุณโอเคไหมคะ' },
      { speaker: 'Tom', en: 'I am okay. Are you okay?', reading: 'ไอ แอ็ม โอ-เค อาร์ ยู โอ-เค', th: 'ผมโอเค คุณโอเคไหม' },
      { speaker: 'Ploy', en: 'Yes, I am fine. Thank you.', reading: 'เย็ส ไอ แอ็ม ไฟน์ แธงค์ ยู', th: 'ค่ะ ฉันไม่เป็นไร ขอบคุณค่ะ' },
      { speaker: 'Tom', en: 'Good. Sorry!', reading: 'กุด ซอ-รี่', th: 'ดีครับ ขอโทษอีกทีนะ!' },
      { speaker: 'Ploy', en: 'Okay, okay.', reading: 'โอ-เค โอ-เค', th: 'โอเคๆ ไม่เป็นไรค่ะ' },
      { speaker: 'Tom', en: 'Thank you. Bye!', reading: 'แธงค์ ยู บาย', th: 'ขอบคุณครับ บาย!' },
      { speaker: 'Ploy', en: 'Bye!', reading: 'บาย', th: 'บายค่ะ!' },
    ],
    question: 'หลังจากทอมชนถาดที่ร้านกาแฟ เกิดอะไรขึ้น?',
    choices: [
      'ไม่มีใครเป็นอะไร',
      'ทอมเจ็บที่แขนมาก',
      'พลอยโกรธทอมที่ชนถาด',
      'ทอมขอกาแฟแก้วใหม่อีกแก้ว',
    ],
    answer: 0,
    explanation:
      'ฟังคำตอบของทั้งคู่: ทอมพูด I am okay และพลอยตอบ Yes, I am fine — ไม่มีใครเจ็บ และพลอยยังพูด Okay, okay. แปลว่าไม่ถือสา ไม่มีคำว่าโกรธหรือกาแฟเลยในบทสนทนา',
  },
  {
    id: 'lis-bts-thai',
    level: 1,
    lines: [
      { speaker: 'Sarah', en: 'Hello!', reading: 'เฮล-โล', th: 'สวัสดี!' },
      { speaker: 'Bank', en: 'Hello. How are you?', reading: 'เฮล-โล ฮาว อาร์ ยู', th: 'สวัสดีครับ สบายดีไหม' },
      { speaker: 'Sarah', en: 'I am good, thank you. Are you Thai?', reading: 'ไอ แอ็ม กุด แธงค์ ยู อาร์ ยู ไท', th: 'สบายดี ขอบคุณ คุณเป็นคนไทยหรือเปล่า' },
      { speaker: 'Bank', en: 'Yes, I am Thai. My name is Bank.', reading: 'เย็ส ไอ แอ็ม ไท มาย เนม อิส แบงค์', th: 'ครับ ผมเป็นคนไทย ผมชื่อแบงค์' },
      { speaker: 'Sarah', en: 'Nice to meet you, Bank. I am Sarah.', reading: 'ไนส์ ทู มีต ยู แบงค์ ไอ แอ็ม ซา-ร่า', th: 'ยินดีที่ได้รู้จัก แบงค์ ฉันชื่อซาร่า' },
      { speaker: 'Bank', en: 'Nice to meet you, Sarah.', reading: 'ไนส์ ทู มีต ยู ซา-ร่า', th: 'ยินดีที่ได้รู้จักครับ ซาร่า' },
      { speaker: 'Sarah', en: 'Thank you, Bank. Bye!', reading: 'แธงค์ ยู แบงค์ บาย', th: 'ขอบคุณนะแบงค์ บาย!' },
      { speaker: 'Bank', en: 'Bye, Sarah!', reading: 'บาย ซา-ร่า', th: 'บายครับ ซาร่า!' },
    ],
    question: 'ใครเป็นคนถามว่าอีกฝ่ายเป็นคนไทยหรือเปล่า?',
    choices: [
      'ซาร่า',
      'แบงค์',
      'ทั้งสองคนถาม',
      'ไม่มีใครถาม',
    ],
    answer: 0,
    explanation:
      'ประโยค Are you Thai? (คุณเป็นคนไทยหรือเปล่า) มาจากปากของซาร่า และแบงค์เป็นคนตอบ Yes, I am Thai. สังเกตว่าคำถามแบบใช่/ไม่ใช่ขึ้นต้นด้วย Are you และตอบด้วย Yes, I am',
  },

  // ── Added 2026-10-24 from level04.ts ──────────────────────────────
  {
    id: 'lis-family-photo',
    level: 4,
    lines: [
      { speaker: 'Nam', en: 'Emma, this is my family.', reading: 'เอ็ม-ม่า ดิส อิส มาย แฟม-มะ-ลี่', th: 'เอ็มม่า นี่ครอบครัวฉันค่ะ' },
      { speaker: 'Emma', en: 'Oh! Is this your mom?', reading: 'โอ อิส ดิส ยอร์ มอม', th: 'โอ้! นี่แม่คุณเหรอ' },
      { speaker: 'Nam', en: 'Yes. This is my mom, and this is my dad.', reading: 'เย็ส ดิส อิส มาย มอม อันด์ ดิส อิส มาย แด็ด', th: 'ใช่ค่ะ นี่แม่ แล้วนี่พ่อ' },
      { speaker: 'Emma', en: 'Is this your brother?', reading: 'อิส ดิส ยอร์ บรา-เธอร์', th: 'คนนี้พี่ชายคุณเหรอ' },
      { speaker: 'Nam', en: 'Yes! He is my brother.', reading: 'เย็ส ฮี อิส มาย บรา-เธอร์', th: 'ใช่ค่ะ! เขาเป็นพี่ชายฉัน' },
      { speaker: 'Emma', en: 'Do you have a sister?', reading: 'ดู ยู แฮ็ฟ อะ ซิส-เตอร์', th: 'คุณมีพี่สาวหรือน้องสาวไหม' },
      { speaker: 'Nam', en: "No, I don't. Do you have a sister?", reading: 'โน ไอ โดนต์ ดู ยู แฮ็ฟ อะ ซิส-เตอร์', th: 'ไม่มีค่ะ แล้วคุณล่ะ มีพี่สาวหรือน้องสาวไหม' },
      { speaker: 'Emma', en: 'Yes, I do. I have a sister and a brother. I love my family.', reading: 'เย็ส ไอ ดู ไอ แฮ็ฟ อะ ซิส-เตอร์ อันด์ อะ บรา-เธอร์ ไอ ลัฟ มาย แฟม-มะ-ลี่', th: 'มีสิ ฉันมีน้องสาวกับพี่ชาย ฉันรักครอบครัวฉันมาก' },
    ],
    question: 'ในรูปที่น้ำโชว์ ครอบครัวของน้ำมีใครบ้าง?',
    choices: [
      'แม่ พ่อ และพี่ชายหรือน้องชาย',
      'แม่ พ่อ และพี่สาวหรือน้องสาว',
      'แม่ พ่อ พี่สาวหนึ่งคน และพี่ชายหนึ่งคน',
      'แม่กับพ่อ ไม่มีพี่น้องเลย',
    ],
    answer: 0,
    explanation:
      'น้ำชี้รูปแล้วพูด This is my mom, and this is my dad จากนั้นยืนยันว่า He is my brother (เขาเป็นพี่ชาย) พอเอ็มม่าถาม Do you have a sister? น้ำตอบ No, I don\'t — คือไม่มีพี่สาวหรือน้องสาว ส่วนคนที่มีทั้ง sister และ brother คือเอ็มม่า ไม่ใช่น้ำ',
  },
  {
    id: 'lis-first-dinner-date',
    level: 4,
    lines: [
      { speaker: 'Tee', en: 'Anna, do you like Thai food?', reading: 'แอน-นา ดู ยู ไลก์ ไท ฟูด', th: 'แอนนา ชอบอาหารไทยไหมครับ' },
      { speaker: 'Anna', en: 'Yes, I do! I love it.', reading: 'เย็ส ไอ ดู ไอ ลัฟ อิต', th: 'ชอบสิ! ชอบมากเลย' },
      { speaker: 'Tee', en: 'Do you like spicy food?', reading: 'ดู ยู ไลก์ สไป-ซี่ ฟูด', th: 'แล้วชอบอาหารเผ็ดไหมครับ' },
      { speaker: 'Anna', en: "No, I don't. Not spicy, please.", reading: 'โน ไอ โดนต์ นอต สไป-ซี่ พลีส', th: 'ไม่ชอบ ขอไม่เผ็ดนะ' },
      { speaker: 'Tee', en: 'Okay. Do you want a beer?', reading: 'โอ-เค ดู ยู วอนต์ อะ เบียร์', th: 'ได้ครับ เอาเบียร์ไหม' },
      { speaker: 'Anna', en: "No, thank you. I don't drink beer. Water, please.", reading: 'โน แธงค์ ยู ไอ โดนต์ ดริงค์ เบียร์ วอ-เทอร์ พลีส', th: 'ไม่ล่ะ ขอบคุณ ฉันไม่ดื่มเบียร์ ขอน้ำเปล่าแทน' },
      { speaker: 'Tee', en: 'Okay. Chicken and rice, not spicy, and water.', reading: 'โอ-เค ชิก-เก็น อันด์ ไรส์ นอต สไป-ซี่ อันด์ วอ-เทอร์', th: 'โอเคครับ งั้นไก่กับข้าว ไม่เผ็ด แล้วก็น้ำเปล่า' },
      { speaker: 'Anna', en: 'Thank you, Tee. Where are you from?', reading: 'แธงค์ ยู ตี้ แวร์ อาร์ ยู ฟรอม', th: 'ขอบคุณนะตี้ คุณมาจากไหนเหรอ' },
      { speaker: 'Tee', en: 'I am from Bangkok. Do you like Bangkok?', reading: 'ไอ แอ็ม ฟรอม แบง-ค็อก ดู ยู ไลก์ แบง-ค็อก', th: 'ผมมาจากกรุงเทพฯ ครับ คุณชอบกรุงเทพฯ ไหม' },
      { speaker: 'Anna', en: 'Yes! I love Bangkok. I am very happy.', reading: 'เย็ส ไอ ลัฟ แบง-ค็อก ไอ แอ็ม เว-รี่ แฮป-ปี้', th: 'ชอบสิ! ฉันรักกรุงเทพฯ ฉันมีความสุขมากเลย' },
    ],
    question: 'ในมื้อนี้ แอนนาปฏิเสธอะไรบ้าง?',
    choices: [
      'อาหารเผ็ดกับเบียร์',
      'ข้าวกับไก่',
      'อาหารไทยกับน้ำเปล่า',
      'กรุงเทพฯ กับอาหารไทย',
    ],
    answer: 0,
    explanation:
      'ฟังคำตอบที่ขึ้นต้นด้วย No: พอตี้ถาม Do you like spicy food? แอนนาตอบ No, I don\'t. Not spicy, please และพอถาม Do you want a beer? เธอตอบ No, thank you. I don\'t drink beer ส่วนอาหารไทยกับกรุงเทพฯ เธอพูด I love it / I love Bangkok คือชอบมาก',
  },

  // ── Added 2026-10-24 from level07.ts ──────────────────────────────
  {
    id: 'lis-hotel-regular-sister',
    level: 7,
    lines: [
      { speaker: 'Mr. Lee', en: 'Hello, Nut! How are you?', reading: 'เฮล-โล นัท ฮาว อาร์ ยู', th: 'สวัสดีนัท สบายดีไหม' },
      { speaker: 'Nut', en: 'Good, thank you! How are you?', reading: 'กุด แธงค์ ยู ฮาว อาร์ ยู', th: 'สบายดีครับ ขอบคุณ คุณล่ะครับ' },
      { speaker: 'Mr. Lee', en: 'I am fine. Is your family in Bangkok?', reading: 'ไอ แอ็ม ไฟน์ อิส ยอร์ แฟม-มะ-ลี่ อิน แบง-ค็อก', th: 'สบายดี ครอบครัวคุณอยู่กรุงเทพฯ หรือเปล่า' },
      { speaker: 'Nut', en: 'My mom and dad live in Bangkok. My sister lives in Chiang Mai.', reading: 'มาย มอม อันด์ แด็ด ลิฟ อิน แบง-ค็อก มาย ซิส-เตอร์ ลิฟส์ อิน เชียง-ใหม่', th: 'พ่อกับแม่อยู่กรุงเทพฯ ครับ ส่วนพี่สาวอยู่เชียงใหม่' },
      { speaker: 'Mr. Lee', en: 'Chiang Mai is beautiful! Does she work?', reading: 'เชียง-ใหม่ อิส บิว-ติ-ฟูล ดัส ชี เวิร์ก', th: 'เชียงใหม่สวยมาก! เธอทำงานไหม' },
      { speaker: 'Nut', en: 'Yes, she works at a hotel in Chiang Mai.', reading: 'เย็ส ชี เวิร์กส์ แอ็ต อะ โฮ-เทล อิน เชียง-ใหม่', th: 'ครับ เธอทำงานที่โรงแรมในเชียงใหม่' },
      { speaker: 'Mr. Lee', en: 'Nice! I am going to Chiang Mai tomorrow. Does she speak English?', reading: 'ไนส์ ไอ แอ็ม โก-อิง ทู เชียง-ใหม่ ทู-มอ-โรว์ ดัส ชี สปีก อิง-กลิช', th: 'ดีเลย! พรุ่งนี้ผมจะไปเชียงใหม่พอดี เธอพูดภาษาอังกฤษได้ไหม' },
      { speaker: 'Nut', en: 'Yes, she speaks good English. I will call her tonight.', reading: 'เย็ส ชี สปีกส์ กุด อิง-กลิช ไอ วิล คอล เฮอร์ ทู-ไนต์', th: 'ได้ครับ เธอพูดอังกฤษเก่ง คืนนี้ผมจะโทรบอกเธอไว้' },
      { speaker: 'Mr. Lee', en: 'Thank you, Nut. See you later!', reading: 'แธงค์ ยู นัท ซี ยู เล-เทอร์', th: 'ขอบคุณนะนัท แล้วเจอกัน' },
      { speaker: 'Nut', en: 'See you, Mr. Lee!', reading: 'ซี ยู มิส-เตอร์ ลี', th: 'แล้วเจอกันครับ คุณลี' },
    ],
    question: 'พี่สาวของนัทอยู่ที่ไหน?',
    choices: [
      'อยู่กรุงเทพฯ กับพ่อแม่ของนัท',
      'อยู่เชียงใหม่ ทำงานที่โรงแรม',
      'อยู่โรงแรมเดียวกับที่นัททำงาน',
      'อยู่ต่างประเทศ ไม่ได้อยู่เมืองไทย',
    ],
    answer: 1,
    explanation:
      'คำตอบอยู่ที่ประโยค My sister lives in Chiang Mai (พี่สาวผมอยู่เชียงใหม่) และ she works at a hotel in Chiang Mai ส่วนกรุงเทพฯ คือที่ที่พ่อแม่ของนัทอยู่ (My mom and dad live in Bangkok) ไม่ใช่พี่สาว สังเกตว่า lives และ works มี -s เพราะพูดถึงคนคนเดียว แต่ live ไม่มี เพราะพ่อกับแม่เป็นสองคน',
  },
  {
    id: 'lis-language-exchange-cant',
    level: 7,
    lines: [
      { speaker: 'Jack', en: 'Hi, Fah! Do you speak English?', reading: 'ไฮ ฟ้า ดู ยู สปีก อิง-กลิช', th: 'ไงฟ้า คุณพูดภาษาอังกฤษได้ไหม' },
      { speaker: 'Fah', en: 'Hello, Jack. Yes, I study English at home.', reading: 'เฮล-โล แจ็ค เย็ส ไอ สตัด-ดี้ อิง-กลิช แอ็ต โฮม', th: 'สวัสดีค่ะแจ็ค ได้ค่ะ ฉันเรียนภาษาอังกฤษเองที่บ้าน' },
      { speaker: 'Jack', en: 'Nice! Your English is good.', reading: 'ไนส์ ยอร์ อิง-กลิช อิส กุด', th: 'เยี่ยม! ภาษาอังกฤษคุณดีนะ' },
      { speaker: 'Fah', en: "No, no. I can't speak English at work. It is difficult.", reading: 'โน โน ไอ แคนต์ สปีก อิง-กลิช แอ็ต เวิร์ก อิต อิส ดิฟ-ฟะ-เคิลต์', th: 'ไม่หรอกค่ะ อยู่ที่ทำงานฉันพูดอังกฤษไม่ออกเลย มันยาก' },
      { speaker: 'Jack', en: 'I can speak Thai. My Thai is not good. Can we speak Thai and English?', reading: 'ไอ แค็น สปีก ไท มาย ไท อิส นอต กุด แค็น วี สปีก ไท อันด์ อิง-กลิช', th: 'ผมพูดไทยได้นะ แต่ไม่เก่ง เราคุยกันทั้งไทยทั้งอังกฤษได้ไหม' },
      { speaker: 'Fah', en: 'Yes! Do you live in Bangkok?', reading: 'เย็ส ดู ยู ลิฟ อิน แบง-ค็อก', th: 'ได้เลยค่ะ! คุณอยู่กรุงเทพฯ หรือเปล่า' },
      { speaker: 'Jack', en: 'Yes, I live in Bangkok. I work at a hotel.', reading: 'เย็ส ไอ ลิฟ อิน แบง-ค็อก ไอ เวิร์ก แอ็ต อะ โฮ-เทล', th: 'ใช่ ผมอยู่กรุงเทพฯ ทำงานที่โรงแรม' },
      { speaker: 'Fah', en: 'Can we meet tomorrow? Can we watch a movie?', reading: 'แค็น วี มีต ทู-มอ-โรว์ แค็น วี วอช อะ มู-วี่', th: 'พรุ่งนี้เจอกันได้ไหมคะ ไปดูหนังกันไหม' },
      { speaker: 'Jack', en: 'Yes! I will call you tonight.', reading: 'เย็ส ไอ วิล คอล ยู ทู-ไนต์', th: 'ได้สิ! คืนนี้ผมจะโทรหานะ' },
      { speaker: 'Fah', en: 'Okay, see you tomorrow, Jack!', reading: 'โอ-เค ซี ยู ทู-มอ-โรว์ แจ็ค', th: 'โอเค แล้วเจอกันพรุ่งนี้นะแจ็ค!' },
    ],
    question: 'ฟ้าบอกว่าตัวเองทำอะไรไม่ได้?',
    choices: [
      'พูดภาษาอังกฤษตอนอยู่ที่ทำงาน',
      'พูดภาษาไทยกับแจ็คที่เป็นฝรั่ง',
      'ดูหนังภาษาอังกฤษที่บ้านคนเดียว',
      'ไปเจอแจ็คพรุ่งนี้เพราะติดงานทั้งวัน',
    ],
    answer: 0,
    explanation:
      'ฟ้าพูดว่า I can\'t speak English at work. It is difficult. — can\'t คือ "ไม่ได้" และ at work คือ "ที่ทำงาน" ส่วนเรื่องอื่นเธอทำได้หมด: เธอเรียนภาษาอังกฤษที่บ้าน (I study English at home) และเป็นคนชวนเจอและชวนดูหนังเอง (Can we meet tomorrow? Can we watch a movie?) ฟังให้ออกว่า can กับ can\'t ต่างกันที่เสียง ต ท้ายคำ',
  },

  // ── Added 2026-10-24 from level02.ts ──────────────────────────────
  {
    id: 'lis-street-stall-not-spicy',
    level: 2,
    lines: [
      { speaker: 'Jack', en: 'Hello! What is this?', reading: 'เฮล-โล วอต อิส ดิส', th: 'สวัสดีครับ นี่อะไรครับ' },
      { speaker: 'Ploy', en: 'Hello! This is chicken and rice.', reading: 'เฮล-โล ดิส อิส ชิก-เก็น อันด์ ไรส์', th: 'สวัสดีค่ะ นี่ข้าวกับไก่ค่ะ' },
      { speaker: 'Jack', en: 'Is this spicy?', reading: 'อิส ดิส สไป-ซี่', th: 'อันนี้เผ็ดไหมครับ' },
      { speaker: 'Ploy', en: 'Yes, this is spicy!', reading: 'เย็ส ดิส อิส สไป-ซี่', th: 'ค่ะ อันนี้เผ็ดนะคะ' },
      { speaker: 'Jack', en: 'Okay. Can I have this one, please? Not spicy.', reading: 'โอ-เค แค็น ไอ แฮ็ฟ ดิส วัน พลีส นอต สไป-ซี่', th: 'โอเค ขออันนี้หน่อยครับ แบบไม่เผ็ดนะ' },
      { speaker: 'Ploy', en: 'Not spicy? Okay!', reading: 'นอต สไป-ซี่ โอ-เค', th: 'ไม่เผ็ดใช่ไหม ได้ค่ะ!' },
      { speaker: 'Jack', en: 'And water, please. Thank you!', reading: 'อันด์ วอ-เทอร์ พลีส แธงค์ ยู', th: 'แล้วก็ขอน้ำเปล่าด้วยครับ ขอบคุณ!' },
      { speaker: 'Ploy', en: 'Okay! Thank you!', reading: 'โอ-เค แธงค์ ยู', th: 'ได้ค่ะ ขอบคุณค่ะ!' },
    ],
    question: 'แจ็คตัดสินใจเรื่องความเผ็ดอย่างไร?',
    choices: [
      'ขอแบบไม่เผ็ด',
      'ขอแบบเผ็ดมากๆ',
      'ขอเผ็ดนิดหน่อยพอ',
      'ไม่ได้พูดถึงความเผ็ดเลย',
    ],
    answer: 0,
    explanation:
      'แจ็คถามก่อนว่า Is this spicy? (อันนี้เผ็ดไหม) พลอยตอบว่าเผ็ด แจ็คจึงสั่ง this one แล้วเติมท้ายว่า Not spicy. (ไม่เผ็ด) และพลอยทวนว่า Not spicy? Okay! — คำว่า not คือตัวตัดสิน',
  },
  {
    id: 'lis-cafe-no-sugar-no-ice',
    level: 2,
    lines: [
      { speaker: 'Nam', en: 'Hello! How are you?', reading: 'เฮล-โล ฮาว อาร์ ยู', th: 'สวัสดีค่ะ สบายดีไหมคะ' },
      { speaker: 'Emma', en: 'I am good, thank you. Can I have a coffee, please?', reading: 'ไอ แอ็ม กุด แธงค์ ยู แค็น ไอ แฮ็ฟ อะ คอฟ-ฟี่ พลีส', th: 'สบายดี ขอบคุณ ขอกาแฟแก้วหนึ่งได้ไหม' },
      { speaker: 'Nam', en: 'Okay. Sugar and ice?', reading: 'โอ-เค ชุก-เกอร์ อันด์ ไอส์', th: 'ได้ค่ะ ใส่น้ำตาลกับน้ำแข็งไหมคะ' },
      { speaker: 'Emma', en: 'No sugar, please. And no ice.', reading: 'โน ชุก-เกอร์ พลีส อันด์ โน ไอส์', th: 'ไม่ใส่น้ำตาลนะ แล้วก็ไม่เอาน้ำแข็ง' },
      { speaker: 'Nam', en: 'No sugar, no ice. Okay! Water?', reading: 'โน ชุก-เกอร์ โน ไอส์ โอ-เค วอ-เทอร์', th: 'ไม่ใส่น้ำตาล ไม่ใส่น้ำแข็ง ได้ค่ะ! รับน้ำเปล่าไหมคะ' },
      { speaker: 'Emma', en: 'Yes, please.', reading: 'เย็ส พลีส', th: 'เอาค่ะ' },
      { speaker: 'Nam', en: 'Is this okay?', reading: 'อิส ดิส โอ-เค', th: 'แบบนี้โอเคไหมคะ' },
      { speaker: 'Emma', en: 'Yes, this is good. Thank you!', reading: 'เย็ส ดิส อิส กุด แธงค์ ยู', th: 'ค่ะ ดีเลย ขอบคุณ!' },
    ],
    question: 'เอ็มม่าไม่เอาอะไรบ้าง?',
    choices: [
      'น้ำตาลกับน้ำแข็ง',
      'กาแฟกับน้ำเปล่า',
      'น้ำแข็งกับน้ำเปล่า',
      'น้ำตาลกับกาแฟร้อน',
    ],
    answer: 0,
    explanation:
      'ฟังคำว่า no ที่เอ็มม่าพูดสองครั้ง: No sugar (ไม่ใส่น้ำตาล) และ And no ice (ไม่เอาน้ำแข็ง) ส่วนกาแฟกับน้ำเปล่าเธอรับทั้งคู่ — Can I have a coffee และ Yes, please. ตอนน้ำถามว่า Water?',
  },
  {
    id: 'lis-hotel-restaurant-water',
    level: 2,
    lines: [
      { speaker: 'Tee', en: 'Hello! How are you?', reading: 'เฮล-โล ฮาว อาร์ ยู', th: 'สวัสดีครับ สบายดีไหมครับ' },
      { speaker: 'Anna', en: 'I am good, thank you. I want to eat.', reading: 'ไอ แอ็ม กุด แธงค์ ยู ไอ วอนต์ ทู อีต', th: 'สบายดี ขอบคุณ ฉันอยากกินข้าวแล้ว' },
      { speaker: 'Tee', en: 'Okay! Rice and chicken? This is good.', reading: 'โอ-เค ไรส์ อันด์ ชิก-เก็น ดิส อิส กุด', th: 'ได้ครับ! ข้าวกับไก่ไหมครับ จานนี้อร่อย' },
      { speaker: 'Anna', en: 'Yes! Rice and chicken, please. Not spicy.', reading: 'เย็ส ไรส์ อันด์ ชิก-เก็น พลีส นอต สไป-ซี่', th: 'เอาค่ะ! ขอข้าวกับไก่ แบบไม่เผ็ดนะ' },
      { speaker: 'Tee', en: 'Okay, not spicy. And a drink? Water, tea, beer?', reading: 'โอ-เค นอต สไป-ซี่ อันด์ อะ ดริงค์ วอ-เทอร์ ที เบียร์', th: 'ได้ครับ ไม่เผ็ด แล้วเครื่องดื่มล่ะครับ น้ำเปล่า ชา หรือเบียร์' },
      { speaker: 'Anna', en: 'Water, please. No beer.', reading: 'วอ-เทอร์ พลีส โน เบียร์', th: 'น้ำเปล่าค่ะ ไม่เอาเบียร์' },
      { speaker: 'Tee', en: 'Water. Ice?', reading: 'วอ-เทอร์ ไอส์', th: 'น้ำเปล่านะครับ ใส่น้ำแข็งไหมครับ' },
      { speaker: 'Anna', en: 'Yes, ice, please. Thank you!', reading: 'เย็ส ไอส์ พลีส แธงค์ ยู', th: 'ค่ะ ใส่น้ำแข็งด้วย ขอบคุณ!' },
    ],
    question: 'แอนนาเลือกดื่มอะไร?',
    choices: [
      'น้ำเปล่าใส่น้ำแข็ง',
      'เบียร์เย็นๆ หนึ่งขวด',
      'ชาร้อนไม่ใส่น้ำตาล',
      'กาแฟกับน้ำเปล่า',
    ],
    answer: 0,
    explanation:
      'ตี้เสนอว่า Water, tea, beer? แอนนาตอบ Water, please. และย้ำว่า No beer. (ไม่เอาเบียร์) จากนั้นตี้ถาม Ice? เธอตอบ Yes, ice, please. — จึงเป็นน้ำเปล่าใส่น้ำแข็ง ไม่ใช่เบียร์หรือชา',
  },

  // ── Added 2026-10-24 from level05.ts ──────────────────────────────
  {
    id: 'lis-chat-meet-up',
    level: 5,
    lines: [
      { speaker: 'Jack', en: 'Hi Fah! Are you free tomorrow?', reading: 'ไฮ ฟ้า อาร์ ยู ฟรี ทู-มอ-โรว์', th: 'ไงฟ้า! พรุ่งนี้ว่างไหม' },
      { speaker: 'Fah', en: 'Hi Jack. Sorry, I am busy tomorrow.', reading: 'ไฮ แจ็ค ซอ-รี่ ไอ แอ็ม บิซ-ซี่ ทู-มอ-โรว์', th: 'ไงแจ็ค ขอโทษนะ พรุ่งนี้ฉันไม่ว่าง' },
      { speaker: 'Jack', en: 'Okay. Tonight? Are you free tonight?', reading: 'โอ-เค ทู-ไนต์ อาร์ ยู ฟรี ทู-ไนต์', th: 'โอเค งั้นคืนนี้ล่ะ คืนนี้ว่างไหม' },
      { speaker: 'Fah', en: 'Tonight... yes! I am free tonight.', reading: 'ทู-ไนต์ เย็ส ไอ แอ็ม ฟรี ทู-ไนต์', th: 'คืนนี้เหรอ… ว่าง! คืนนี้ฉันว่าง' },
      { speaker: 'Jack', en: 'Good! Can we meet tonight? I want to eat Thai food.', reading: 'กุด แค็น วี มีต ทู-ไนต์ ไอ วอนต์ ทู อีต ไท ฟูด', th: 'เยี่ยม! คืนนี้เจอกันได้ไหม ผมอยากกินอาหารไทย' },
      { speaker: 'Fah', en: 'Yes! I will come to your hotel.', reading: 'เย็ส ไอ วิล คัม ทู ยอร์ โฮ-เทล', th: 'ได้สิ! เดี๋ยวฉันไปที่โรงแรมคุณเอง' },
      { speaker: 'Jack', en: 'Thank you, Fah. See you tonight!', reading: 'แธงค์ ยู ฟ้า ซี ยู ทู-ไนต์', th: 'ขอบคุณนะฟ้า คืนนี้เจอกัน!' },
      { speaker: 'Fah', en: 'See you tonight, Jack!', reading: 'ซี ยู ทู-ไนต์ แจ็ค', th: 'เจอกันคืนนี้นะแจ็ค!' },
    ],
    question: 'สุดท้ายแล้วฟ้ากับแจ็คตกลงเจอกันเมื่อไหร่ ที่ไหน?',
    choices: [
      'คืนนี้ ที่โรงแรมของแจ็ค',
      'พรุ่งนี้ ที่ร้านอาหารไทย',
      'ตอนนี้เลย ที่โรงแรม',
      'ยังไม่ได้นัด เพราะแจ็คไม่ว่าง',
    ],
    answer: 0,
    explanation:
      'แจ็คถามก่อนว่า Are you free tomorrow? แต่ฟ้าตอบ I am busy tomorrow (พรุ่งนี้ไม่ว่าง) แจ็คจึงเปลี่ยนเป็น tonight และฟ้าตอบ I am free tonight ตามด้วย I will come to your hotel — ทั้งคู่ปิดท้ายด้วย See you tonight นัดจึงเป็นคืนนี้ที่โรงแรมของแจ็ค ไม่ใช่พรุ่งนี้ที่พูดถึงตอนแรก',
  },
  {
    id: 'lis-hotel-morning-taxi',
    level: 5,
    lines: [
      { speaker: 'Mr. Lee', en: 'Good morning, Bank. What time is it?', reading: 'กุด มอร์-นิง แบงค์ วอต ไทม์ อิส อิต', th: 'อรุณสวัสดิ์แบงค์ ตอนนี้กี่โมงแล้ว' },
      { speaker: 'Bank', en: 'Good morning, Mr. Lee. It is nine.', reading: 'กุด มอร์-นิง มิส-เตอร์ ลี อิต อิส ไนน์', th: 'อรุณสวัสดิ์ครับมิสเตอร์ลี เก้าโมงครับ' },
      { speaker: 'Mr. Lee', en: 'Nine! I am going to go now.', reading: 'ไนน์ ไอ แอ็ม โก-อิง ทู โก นาว', th: 'เก้าโมงแล้วเหรอ! ผมกำลังจะออกไปแล้ว' },
      { speaker: 'Bank', en: 'Okay. Do you have a taxi, Mr. Lee?', reading: 'โอ-เค ดู ยู แฮ็ฟ อะ แทก-ซี่ มิส-เตอร์ ลี', th: 'ครับ มีแท็กซี่แล้วหรือยังครับ' },
      { speaker: 'Mr. Lee', en: 'Not yet. Can I have a taxi, please?', reading: 'นอต เย็ต แค็น ไอ แฮ็ฟ อะ แทก-ซี่ พลีส', th: 'ยังเลย ขอแท็กซี่คันหนึ่งได้ไหม' },
      { speaker: 'Bank', en: 'Yes. I will call a taxi now.', reading: 'เย็ส ไอ วิล คอล อะ แทก-ซี่ นาว', th: 'ได้ครับ ผมจะโทรเรียกแท็กซี่ให้เดี๋ยวนี้เลย' },
      { speaker: 'Mr. Lee', en: 'Thank you. See you tonight!', reading: 'แธงค์ ยู ซี ยู ทู-ไนต์', th: 'ขอบคุณ เจอกันคืนนี้นะ' },
      { speaker: 'Bank', en: 'See you tonight, Mr. Lee!', reading: 'ซี ยู ทู-ไนต์ มิส-เตอร์ ลี', th: 'เจอกันคืนนี้ครับ มิสเตอร์ลี' },
    ],
    question: 'ตอนที่มิสเตอร์ลีจะออกจากโรงแรม เขามีแท็กซี่แล้วหรือยัง?',
    choices: [
      'ยังไม่มี แบงค์จะเรียกให้',
      'มีแล้ว จอดรออยู่หน้าโรงแรม',
      'ไม่ต้องใช้ เขาจะเดินไปเอง',
      'มีแล้ว เพื่อนขับรถมารับ',
    ],
    answer: 0,
    explanation:
      'แบงค์ถาม Do you have a taxi? และมิสเตอร์ลีตอบ Not yet (ยังเลย) แล้วขอต่อว่า Can I have a taxi, please? แบงค์จึงรับปากด้วย I will call a taxi now — ฟังคำว่า not yet ให้ดี เพราะถ้าได้ยินแค่คำว่า taxi อาจเข้าใจผิดว่ามีแล้ว',
  },
]
