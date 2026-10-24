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
]
