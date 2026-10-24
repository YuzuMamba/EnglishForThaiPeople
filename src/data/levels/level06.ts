import type { Level, LexItem, SentencePattern } from '../../core/types'

// Level 6 — Describing Things. The core adjective set, the degree words that
// go BEFORE an adjective (very / so / too), the first comparatives
// (-er + than, good → better), that / that one, and `an` to complete a/an/the.
// The situations are choosing a room, a dish or a souvenir, and saying why.
//
// Readings/IPA are from scripts/reading-anchor.mts (CLAUDE.md §4).

export const items: LexItem[] = [
  {
    id: 'big', type: 'vocab', en: 'big', reading: 'บิก', ipa: '/bɪg/', th: 'ใหญ่',
    altTh: ['โต', 'กว้าง'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'shopping'],
    notes: 'ใช้กับขนาดได้ทุกอย่าง ห้อง เมือง อาหาร เสื้อ และใช้กับคนได้ (คนตัวใหญ่) ภาษาอังกฤษวางคำคุณศัพท์ไว้หน้าคำนาม: a big room ไม่ใช่ room big — กลับกับไทยที่พูด "ห้องใหญ่" แต่ถ้าอยู่หลัง is ลำดับจะเหมือนไทย: The room is big',
    mnemonic: 'เสียงสั้นห้วน "บิก" ปิดท้ายด้วย ก ให้ชัด ไม่ใช่ "บิ๊ก" ยาวๆ แบบชื่อเล่น',
    examples: [
      { en: 'This hotel is big.', reading: 'ดิส โฮ-เทล อิส บิก', th: 'โรงแรมนี้ใหญ่' },
      { en: 'It is too big.', reading: 'อิต อิส ทู บิก', th: 'มันใหญ่เกินไป' },
    ],
  },
  {
    id: 'small', type: 'vocab', en: 'small', reading: 'สมอล', ipa: '/smɔl/', th: 'เล็ก',
    altTh: ['น้อย', 'ขนาดเล็ก'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'shopping'],
    notes: 'ตรงข้ามกับ big ใช้ได้ทั้งขนาดของและไซส์เสื้อ (ไซส์ S คือ small) เวลาสั่งกาแฟแก้วเล็กพูดว่า a small coffee — คำคุณศัพท์อยู่หน้าคำนามเสมอ ออกเสียง ส นำแล้วตามด้วย ม ติดกัน: สมอล ไม่ใช่ "ซะ-มอล"',
    examples: [
      { en: 'This one is small.', reading: 'ดิส วัน อิส สมอล', th: 'อันนี้เล็ก' },
      { en: 'It is too small.', reading: 'อิต อิส ทู สมอล', th: 'มันเล็กเกินไป' },
    ],
  },
  {
    id: 'hot', type: 'vocab', en: 'hot', reading: 'ฮอต', ipa: '/hɑt/', th: 'ร้อน',
    altTh: ['ร้อนจัด', 'เผ็ด'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'food'],
    notes: 'ใช้กับอากาศ อาหาร เครื่องดื่ม: It is hot today / This coffee is hot ระวังว่าฝรั่งใช้ hot แปลว่า "เผ็ด" ได้ด้วย ถ้าอยากถามว่าเผ็ดไหมให้ใช้ spicy จะชัดกว่า ออกเสียง ฮ ลมแรง และปิดท้ายด้วย ต',
    examples: [
      { en: 'It is so hot today.', reading: 'อิต อิส โซ ฮอต ทู-เดย์', th: 'วันนี้ร้อนจังเลย' },
      { en: 'This coffee is hot.', reading: 'ดิส คอฟ-ฟี่ อิส ฮอต', th: 'กาแฟแก้วนี้ร้อน' },
    ],
  },
  {
    id: 'cold', type: 'vocab', en: 'cold', reading: 'โคลด์', ipa: '/koʊld/', th: 'เย็น',
    altTh: ['หนาว', 'เย็นจัด'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'food'],
    notes: 'คำเดียวครอบคลุมทั้ง "เย็น" (น้ำเย็น เบียร์เย็น) และ "หนาว" (อากาศหนาว ฉันหนาว = I am cold) ภาษาไทยแยกเป็นสองคำ ภาษาอังกฤษใช้ cold คำเดียว ท้ายคำมีทั้ง ล และ ด: โคลด์ อย่าตัดเหลือแค่ "โคล"',
    mnemonic: 'โคลด์ — นึกถึงโค้กเย็นๆ แล้วปิดท้ายด้วย ล-ด ให้ครบ',
    examples: [
      { en: 'I want a cold beer.', reading: 'ไอ วอนต์ อะ โคลด์ เบียร์', th: 'ฉันอยากได้เบียร์เย็นๆ' },
      { en: 'This water is cold.', reading: 'ดิส วอ-เทอร์ อิส โคลด์', th: 'น้ำขวดนี้เย็น' },
    ],
  },
  {
    id: 'expensive', type: 'vocab', en: 'expensive', reading: 'เอ็กซ์-เพน-ซิฟ', ipa: '/ɪkˈspɛnsɪv/', th: 'แพง',
    altTh: ['ราคาแพง'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'shopping'],
    notes: 'คำยาวแต่ใช้บ่อยมาก เน้นพยางค์กลาง "เพน" ให้ดัง: เอ็กซ์-เพน-ซิฟ บ่นว่าแพงเกินไปพูดว่า too expensive (too อยู่หน้า ไม่ใช่หลังแบบ "แพงไป") และบอกว่าไม่แพงใช้ not expensive หรือ cheap',
    examples: [
      { en: 'This hotel is expensive.', reading: 'ดิส โฮ-เทล อิส เอ็กซ์-เพน-ซิฟ', th: 'โรงแรมนี้แพง' },
      { en: 'It is too expensive.', reading: 'อิต อิส ทู เอ็กซ์-เพน-ซิฟ', th: 'มันแพงเกินไป' },
    ],
  },
  {
    id: 'cheap', type: 'vocab', en: 'cheap', reading: 'ชีป', ipa: '/tʃip/', th: 'ถูก (ราคา)',
    altTh: ['ราคาถูก', 'ไม่แพง'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'shopping'],
    notes: 'แปลว่าราคาถูกเท่านั้น — "ถูก" ที่แปลว่าถูกต้องเป็นอีกคำหนึ่ง (right) อย่าสับสน cheap บางครั้งแฝงความหมายว่าของไม่ค่อยดีด้วย ถ้าอยากชมว่าคุ้มราคาให้พูด not expensive หรือ a good price ออกเสียง ช ยาว "ชีป" ปิดด้วย ป',
    examples: [
      { en: 'This one is cheap.', reading: 'ดิส วัน อิส ชีป', th: 'อันนี้ถูก' },
      { en: 'Thai food is cheap.', reading: 'ไท ฟูด อิส ชีป', th: 'อาหารไทยราคาถูก' },
    ],
  },
  {
    id: 'new', type: 'vocab', en: 'new', reading: 'นิว', ipa: '/nu/', th: 'ใหม่',
    altTh: ['ของใหม่'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'shopping'],
    notes: 'ใช้กับของ สถานที่ และคน (a new friend เพื่อนใหม่) วางไว้หน้าคำนาม: a new hotel ส่วนไทยพูด "โรงแรมใหม่" กลับลำดับกัน ถามว่าเป็นของใหม่ไหมพูดว่า Is it new? ย้าย is มาไว้หน้าเหมือน Are you …?',
    examples: [
      { en: 'This hotel is new.', reading: 'ดิส โฮ-เทล อิส นิว', th: 'โรงแรมนี้ใหม่' },
      { en: 'Is it new?', reading: 'อิส อิต นิว', th: 'ของใหม่หรือเปล่า' },
    ],
  },
  {
    id: 'old', type: 'vocab', en: 'old', reading: 'โอลด์', ipa: '/oʊld/', th: 'เก่า',
    altTh: ['แก่', 'อายุมาก'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'people'],
    notes: 'คำเดียวใช้ได้ทั้ง "เก่า" กับของ และ "แก่" กับคน ภาษาไทยแยกสองคำ อังกฤษใช้ old ทั้งคู่ และยังใช้ถามอายุด้วย (How old are you? จะเจอในระดับ 9) พูดถึงคนว่า old ตรงๆ อาจไม่สุภาพ ใช้กับของและสถานที่สบายใจกว่า',
    examples: [
      { en: 'This taxi is old.', reading: 'ดิส แทก-ซี่ อิส โอลด์', th: 'แท็กซี่คันนี้เก่า' },
      { en: 'That is an old hotel.', reading: 'แด็ต อิส แอ็น โอลด์ โฮ-เทล', th: 'นั่นเป็นโรงแรมเก่า' },
    ],
  },
  {
    id: 'beautiful', type: 'vocab', en: 'beautiful', reading: 'บิว-ติ-ฟูล', ipa: '/ˈbjutəfəl/', th: 'สวย',
    altTh: ['งาม', 'สวยงาม'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'social'],
    notes: 'ใช้ชมผู้หญิง วิว สถานที่ ของ ได้หมด เหมือน "สวย" ของไทย (ผู้ชายใช้ handsome) เป็นคำชมที่ฝรั่งพูดบ่อยและพูดตรงๆ ได้ไม่เขิน เน้นพยางค์แรก "บิว" ที่เหลือเบาและเร็ว: บิว-ติ-ฟูล',
    examples: [
      { en: 'Thailand is beautiful.', reading: 'ไท-แลนด์ อิส บิว-ติ-ฟูล', th: 'ประเทศไทยสวย' },
      { en: 'This place is beautiful.', reading: 'ดิส เพลส อิส บิว-ติ-ฟูล', th: 'ที่นี่สวย' },
    ],
  },
  {
    id: 'nice', type: 'vocab', en: 'nice', reading: 'ไนส์', ipa: '/naɪs/', th: 'ดี (ถูกใจ น่าพอใจ)',
    altTh: ['ดี', 'น่ารัก', 'ใจดี', 'ดีจัง'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'social'],
    notes: 'คำชมอเนกประสงค์ที่ฝรั่งใช้บ่อยกว่า good: ของก็ nice ที่พักก็ nice คนใจดีก็ nice (You are nice = คุณใจดี/น่ารัก) และพูดว่า Nice! คำเดียวเป็นคำชมได้เลย ความหมายเบาและเป็นมิตรกว่า beautiful ออกเสียง ส ท้ายคำให้ได้ยิน',
    examples: [
      { en: 'This place is nice.', reading: 'ดิส เพลส อิส ไนส์', th: 'ที่นี่ดีจัง' },
      { en: 'You are nice.', reading: 'ยู อาร์ ไนส์', th: 'คุณใจดี' },
    ],
  },
  {
    id: 'bad', type: 'vocab', en: 'bad', reading: 'แบ็ด', ipa: '/bæd/', th: 'แย่',
    altTh: ['ไม่ดี', 'เลว'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'feelings'],
    notes: 'ตรงข้ามกับ good ใช้กับอาหาร อากาศ วันแย่ๆ ได้หมด ประโยคที่ได้ยินบ่อยคือ Not bad! แปลว่า "ก็ดีนะ / ใช้ได้" ไม่ใช่คำตำหนิ สระสั้น "แบ็ด" ปิดท้ายด้วย ด — ถ้าลากยาวเป็น "แบด" ฝรั่งอาจได้ยินเป็นคำอื่น',
    examples: [
      { en: 'This food is bad.', reading: 'ดิส ฟูด อิส แบ็ด', th: 'อาหารจานนี้แย่' },
      { en: 'It is not bad.', reading: 'อิต อิส นอต แบ็ด', th: 'ก็ไม่แย่นะ (ใช้ได้เลย)' },
    ],
  },
  {
    id: 'easy', type: 'vocab', en: 'easy', reading: 'อี-ซี่', ipa: '/ˈizi/', th: 'ง่าย',
    altTh: ['สบาย', 'ไม่ยาก'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'work'],
    notes: 'ใช้กับงาน ข้อสอบ ภาษา ทางเดิน ประโยคปลอบใจที่ฝรั่งพูดบ่อย: It is easy. (ง่ายจะตาย) เสียง z ตรงกลางต้องสั่นที่คอ: อี-ซี่ ไม่ใช่ "อี-สี่"',
    examples: [
      { en: 'It is easy.', reading: 'อิต อิส อี-ซี่', th: 'มันง่าย' },
      { en: 'Thai is not easy.', reading: 'ไท อิส นอต อี-ซี่', th: 'ภาษาไทยไม่ง่าย' },
    ],
  },
  {
    id: 'difficult', type: 'vocab', en: 'difficult', reading: 'ดิฟ-ฟะ-เคิลต์', ipa: '/ˈdɪfəkəlt/', th: 'ยาก',
    altTh: ['ลำบาก', 'ไม่ง่าย'], altEn: ['hard'], pos: 'คำคุณศัพท์', level: 6, tags: ['core', 'adj', 'work'],
    notes: 'ตรงข้ามกับ easy ในการพูดจริงฝรั่งมักใช้ hard แทน (It is hard) ซึ่งสั้นกว่า ระบบรับทั้งสองคำ เน้นพยางค์แรก "ดิฟ" พยางค์ที่เหลือเบาและเร็ว ปิดท้าย ลต์ ให้พอได้ยิน',
    examples: [
      { en: 'It is too difficult.', reading: 'อิต อิส ทู ดิฟ-ฟะ-เคิลต์', th: 'มันยากเกินไป' },
      { en: 'Is it difficult?', reading: 'อิส อิต ดิฟ-ฟะ-เคิลต์', th: 'ยากไหม' },
    ],
  },
  {
    id: 'too', type: 'vocab', en: 'too', reading: 'ทู', ipa: '/tu/', th: 'เกินไป',
    altTh: ['มากเกินไป', '…ไป (แพงไป ร้อนไป)'], pos: 'คำกริยาวิเศษณ์', level: 6, tags: ['core', 'grammar', 'degree'],
    notes: 'แปลว่า "เกินไป" และมีความหมายเชิงบ่นเสมอ: too expensive = แพงไป too hot = ร้อนไป กฎสำคัญ: ภาษาไทยเอา "เกินไป" ไว้หลังคำคุณศัพท์ แต่อังกฤษเอา too ไว้หน้า ถ้าแค่อยากบอกว่า "มาก" เฉยๆ ให้ใช้ very ส่วน too อีกความหมาย (ด้วย เหมือนกัน เช่น me too) จะเจอในระดับ 10',
    mnemonic: 'too ออกเสียงเหมือน two — สองเท่าของที่ควรเป็น ก็คือ "เกินไป"',
    examples: [
      { en: 'It is too expensive.', reading: 'อิต อิส ทู เอ็กซ์-เพน-ซิฟ', th: 'มันแพงเกินไป' },
      { en: 'This is too spicy.', reading: 'ดิส อิส ทู สไป-ซี่', th: 'อันนี้เผ็ดเกินไป' },
    ],
  },
  {
    id: 'an', type: 'vocab', en: 'an', reading: 'แอ็น', ipa: '/æn/', th: 'a (ใช้หน้าคำที่ขึ้นต้นด้วยเสียงสระ)',
    altTh: ['หนึ่ง (นำหน้าของนับได้)', 'หนึ่ง'], pos: 'คำนำหน้านาม', level: 6, tags: ['core', 'grammar'],
    notes: 'คือ a ตัวเดียวกัน แต่เปลี่ยนเป็น an เมื่อคำถัดไปขึ้นต้นด้วยเสียงสระ อา อี อู เอ โอ: an old hotel, an ATM (ออกเสียง เอ-ที-เอ็ม ขึ้นต้นด้วยเสียง เอ) ดูที่เสียง ไม่ใช่ตัวสะกด ภาษาไทยไม่มีคำนำหน้านามเลย จึงต้องจำว่าของนับได้หนึ่งชิ้น = ต้องมี a หรือ an หน้าคำนามเสมอ',
    examples: [
      { en: 'This is an old hotel.', reading: 'ดิส อิส แอ็น โอลด์ โฮ-เทล', th: 'นี่คือโรงแรมเก่า' },
      { en: 'Where is an ATM?', reading: 'แวร์ อิส แอ็น เอ-ที-เอ็ม', th: 'ตู้เอทีเอ็มอยู่ที่ไหน' },
    ],
  },
  {
    id: 'that', type: 'vocab', en: 'that', reading: 'แด็ต', ipa: '/ðæt/', th: 'นั่น',
    altTh: ['นั้น', 'อันนั้น', 'โน่น'], pos: 'คำสรรพนาม', level: 6, tags: ['core', 'grammar', 'shopping'],
    notes: 'คู่ของ this: this คือใกล้ตัว that คือไกลออกไปหรือเป็นสิ่งที่เพิ่งพูดถึง ใช้ชี้ได้เลย (What is that?) และวางหน้าคำนามได้ (that hotel = โรงแรมนั้น — that อยู่หน้า ต่างจากไทยที่ "นั้น" อยู่หลัง) ออกเสียง ด ขึ้นต้นโดยแตะลิ้นที่ฟันบน',
    examples: [
      { en: 'What is that?', reading: 'วอต อิส แด็ต', th: 'นั่นคืออะไร' },
      { en: 'How much is that?', reading: 'ฮาว มัช อิส แด็ต', th: 'นั่นราคาเท่าไหร่' },
    ],
  },
  {
    id: 'that-one', type: 'phrase', en: 'that one', reading: 'แด็ต วัน', ipa: '/ðæt/ /wʌn/', th: 'อันนั้น',
    altTh: ['นั่น', 'ชิ้นนั้น', 'อันโน้น'], pos: 'วลี', level: 6, tags: ['core', 'shopping'],
    literal: 'นั่น-อัน',
    notes: 'คู่ของ this one: ชี้ของที่อยู่ไกลออกไปโดยไม่ต้องรู้ชื่อมัน — I want that one. ใช้ได้กับทุกอย่างที่เป็นชิ้น แก้ว จาน ห้อง one ตรงนี้ไม่ได้แปลว่า "หนึ่ง" แต่แทนคำนามที่ทั้งสองฝ่ายรู้อยู่แล้วว่าหมายถึงอะไร',
    examples: [
      { en: 'I want that one.', reading: 'ไอ วอนต์ แด็ต วัน', th: 'ฉันเอาอันนั้น' },
      { en: 'That one is cheaper.', reading: 'แด็ต วัน อิส ชี-เพอร์', th: 'อันนั้นถูกกว่า' },
    ],
  },
  {
    id: 'than', type: 'vocab', en: 'than', reading: 'แด็น', ipa: '/ðæn/', th: 'กว่า',
    altTh: ['มากกว่า (ตามหลังขั้นกว่า)'], pos: 'คำเชื่อม', level: 6, tags: ['core', 'grammar'],
    notes: 'ใช้เชื่อมของสองอย่างที่เปรียบเทียบกัน: cheaper than that = ถูกกว่านั่น ภาษาไทยพูด "ถูกกว่า" แล้วจบได้เลย แต่อังกฤษถ้าจะบอกว่ากว่า "อะไร" ต้องมี than ตามด้วยสิ่งนั้นเสมอ than อยู่เดี่ยวๆ ไม่ได้ ต้องตามหลังคำที่ลงท้าย -er หรือ better ออกเสียงเหมือน that แต่ลงท้ายด้วย น',
    examples: [
      { en: 'This is cheaper than that.', reading: 'ดิส อิส ชี-เพอร์ แด็น แด็ต', th: 'อันนี้ถูกกว่าอันนั้น' },
      { en: 'Coffee is better than tea.', reading: 'คอฟ-ฟี่ อิส เบต-เตอร์ แด็น ที', th: 'กาแฟดีกว่าชา' },
    ],
  },
  {
    id: 'better', type: 'vocab', en: 'better', reading: 'เบต-เตอร์', ipa: '/ˈbɛtər/', th: 'ดีกว่า',
    altTh: ['ดีขึ้น'], pos: 'คำคุณศัพท์ (ขั้นกว่า)', level: 6, tags: ['core', 'grammar', 'comparative'],
    notes: 'ขั้นกว่าของ good ไม่มีคำว่า gooder — ต้องใช้ better เสมอ ใช้เลือกของ (This one is better) และใช้บอกว่าอาการดีขึ้นได้ด้วย (I am better = ฉันดีขึ้นแล้ว) ท้ายคำ -er ออกเสียงเบาๆ "เตอร์" ห่อลิ้นนิดหนึ่ง',
    examples: [
      { en: 'This one is better.', reading: 'ดิส วัน อิส เบต-เตอร์', th: 'อันนี้ดีกว่า' },
      { en: 'Is this one better?', reading: 'อิส ดิส วัน เบต-เตอร์', th: 'อันนี้ดีกว่าไหม' },
    ],
  },
  {
    id: 'cheaper', type: 'vocab', en: 'cheaper', reading: 'ชี-เพอร์', ipa: '/ˈtʃipər/', th: 'ถูกกว่า',
    altTh: ['ราคาถูกกว่า'], pos: 'คำคุณศัพท์ (ขั้นกว่า)', level: 6, tags: ['core', 'grammar', 'shopping'],
    notes: 'cheap + er = ถูกกว่า คำคุณศัพท์สั้นๆ แค่เติม -er ท้ายคำก็เป็นขั้นกว่า ไม่ต้องมี more นำหน้า (more cheaper ผิด) ใช้ต่อรองราคาได้เลย: That one is cheaper. แล้วชี้',
    examples: [
      { en: 'That one is cheaper.', reading: 'แด็ต วัน อิส ชี-เพอร์', th: 'อันนั้นถูกกว่า' },
      { en: 'This hotel is cheaper than that hotel.', reading: 'ดิส โฮ-เทล อิส ชี-เพอร์ แด็น แด็ต โฮ-เทล', th: 'โรงแรมนี้ถูกกว่าโรงแรมนั้น' },
    ],
  },
  {
    id: 'bigger', type: 'vocab', en: 'bigger', reading: 'บิก-เกอร์', ipa: '/ˈbɪgər/', th: 'ใหญ่กว่า',
    altTh: ['โตกว่า'], pos: 'คำคุณศัพท์ (ขั้นกว่า)', level: 6, tags: ['core', 'grammar', 'shopping'],
    notes: 'big + er แต่สะกดเพิ่ม g เป็น bigger เพราะคำสั้นที่ลงท้ายด้วยสระสั้น + พยัญชนะตัวเดียวจะเบิ้ลตัวท้ายก่อนเติม -er (hot → hotter ก็เช่นกัน) ออกเสียง "บิก-เกอร์" ใช้ขอไซส์ใหญ่กว่าหรือห้องใหญ่กว่าได้ทันที',
    examples: [
      { en: 'This hotel is bigger.', reading: 'ดิส โฮ-เทล อิส บิก-เกอร์', th: 'โรงแรมนี้ใหญ่กว่า' },
      { en: 'It is bigger than that.', reading: 'อิต อิส บิก-เกอร์ แด็น แด็ต', th: 'มันใหญ่กว่านั่น' },
    ],
  },
  {
    id: 'thing', type: 'vocab', en: 'thing', reading: 'ธิง', ipa: '/θɪŋ/', th: 'ของ (สิ่งของ)',
    altTh: ['สิ่ง', 'สิ่งของ', 'เรื่อง'], pos: 'คำนาม', level: 6, tags: ['core', 'shopping'],
    notes: 'คำเรียกของที่ไม่รู้ชื่อหรือไม่อยากระบุ: What is this thing? = ของชิ้นนี้คืออะไร ใช้แทนคำนามได้แทบทุกอย่าง และยังแปลว่า "เรื่อง" ได้ด้วย (จะเจอในระดับถัดๆ ไป) เสียง th ขึ้นต้น: แลบลิ้นแตะฟันแล้วเป่าลม "ธิง" ไม่ใช่ "ติง" หรือ "ซิง"',
    examples: [
      { en: 'What is this thing?', reading: 'วอต อิส ดิส ธิง', th: 'ของชิ้นนี้คืออะไร' },
      { en: 'This thing is new.', reading: 'ดิส ธิง อิส นิว', th: 'ของชิ้นนี้ใหม่' },
    ],
  },
  {
    id: 'place', type: 'vocab', en: 'place', reading: 'เพลส', ipa: '/pleɪs/', th: 'สถานที่',
    altTh: ['ที่', 'ร้าน', 'แห่ง'], pos: 'คำนาม', level: 6, tags: ['core', 'place', 'travel'],
    notes: 'คำกว้างๆ ที่ใช้แทนร้าน โรงแรม เมือง หรือที่ไหนก็ได้: This place is nice. = ที่นี่ดีจัง ร้านนี้ดีจัง สังเกตว่าไทยพูด "ที่นี่" คำเดียว แต่อังกฤษพูดเต็มว่า this place เมื่อจะบอกว่าสถานที่นั้นเป็นยังไง ออกเสียง "เพลส" ลงท้ายด้วย ส',
    examples: [
      { en: 'I like this place.', reading: 'ไอ ไลก์ ดิส เพลส', th: 'ฉันชอบที่นี่' },
      { en: 'Is this place good?', reading: 'อิส ดิส เพลส กุด', th: 'ที่นี่ดีไหม' },
    ],
  },
]

export const patterns: SentencePattern[] = [
  {
    id: 'p-it-is-too', level: 6,
    name: 'It is too ___',
    enTemplate: 'It is {degree} {adj}',
    readingTemplate: 'อิต อิส {degree} {adj}',
    thTemplate: 'มัน{adj}{degree}',
    slots: [
      { name: 'degree', itemIds: ['very', 'so', 'too'] },
      { name: 'adj', itemIds: ['expensive', 'hot', 'big', 'small', 'spicy', 'good', 'easy', 'difficult'] },
    ],
    // `too good` is a different idiom (too good to be true) — a complaint word
    // does not sit on a compliment.
    compat: { too: ['expensive', 'hot', 'big', 'small', 'spicy', 'easy', 'difficult'] },
    // `so` is feeling, not measurement: Thai says จังเลย, not มาก.
    thOverrides: {
      'so+expensive': 'มันแพงจังเลย', 'so+hot': 'มันร้อนจังเลย', 'so+big': 'มันใหญ่จังเลย',
      'so+small': 'มันเล็กจังเลย', 'so+spicy': 'มันเผ็ดจังเลย', 'so+good': 'มันดีจังเลย',
      'so+easy': 'มันง่ายจังเลย', 'so+difficult': 'มันยากจังเลย',
    },
    explanation:
      'ภาษาไทยวางคำบอกระดับไว้หลังคำคุณศัพท์ (แพงมาก แพงเกินไป) แต่ภาษาอังกฤษวางไว้หน้า: very expensive, too expensive — สลับที่กันเสมอ ' +
      'สามคำนี้ไม่เหมือนกัน: very คือ "มาก" แบบกลางๆ so คือ "มากจริงๆ" ใส่อารมณ์ ส่วน too คือ "เกินไป" ซึ่งเป็นการบ่นเสมอ — too good จึงแทบไม่พูดกัน ' +
      'และอย่าลืมว่าประโยคต้องมี It is นำหน้า จะพูดแค่ "too expensive" ลอยๆ ได้เฉพาะตอนอุทาน',
    showcase: [{ degree: 'too', adj: 'expensive' }, { degree: 'so', adj: 'hot' }, { degree: 'very', adj: 'good' }],
    distractors: ['that', 'than', 'not', 'this'],
  },
  {
    id: 'p-this-is', level: 6,
    name: 'This ___ is ___',
    enTemplate: 'This {noun} is {adj}',
    readingTemplate: 'ดิส {noun} อิส {adj}',
    thTemplate: '{noun}นี้{adj}',
    slots: [
      { name: 'noun', itemIds: ['hotel', 'place', 'thing', 'taxi', 'coffee', 'tea', 'beer', 'food'] },
      { name: 'adj', itemIds: ['old', 'new', 'nice', 'beautiful', 'bad', 'cheap', 'cold', 'hot'] },
    ],
    // A drink or a dish is judged by taste, price and temperature, not by age
    // or looks; a taxi can be anything but beautiful.
    compat: {
      taxi: ['old', 'new', 'nice', 'bad', 'cheap', 'cold', 'hot'],
      coffee: ['nice', 'bad', 'cheap', 'cold', 'hot'],
      tea: ['nice', 'bad', 'cheap', 'cold', 'hot'],
      beer: ['nice', 'bad', 'cheap', 'cold', 'hot'],
      food: ['nice', 'bad', 'cheap', 'cold', 'hot'],
    },
    // Thai points at a place as ที่นี่ and counts everything else with its
    // classifier (แก้ว ขวด จาน คัน ชิ้น); a bare "กาแฟนี้" reads as translated.
    thOverrides: {
      'place+old': 'ที่นี่เก่า', 'place+new': 'ที่นี่ใหม่', 'place+nice': 'ที่นี่ดี', 'place+beautiful': 'ที่นี่สวย',
      'place+bad': 'ที่นี่แย่', 'place+cheap': 'ที่นี่ถูก', 'place+cold': 'ที่นี่เย็น', 'place+hot': 'ที่นี่ร้อน',
      'thing+old': 'ของชิ้นนี้เก่า', 'thing+new': 'ของชิ้นนี้ใหม่', 'thing+nice': 'ของชิ้นนี้ดี', 'thing+beautiful': 'ของชิ้นนี้สวย',
      'thing+bad': 'ของชิ้นนี้แย่', 'thing+cheap': 'ของชิ้นนี้ถูก', 'thing+cold': 'ของชิ้นนี้เย็น', 'thing+hot': 'ของชิ้นนี้ร้อน',
      'taxi+old': 'แท็กซี่คันนี้เก่า', 'taxi+new': 'แท็กซี่คันนี้ใหม่', 'taxi+nice': 'แท็กซี่คันนี้ดี', 'taxi+bad': 'แท็กซี่คันนี้แย่',
      'taxi+cheap': 'แท็กซี่คันนี้ถูก', 'taxi+cold': 'แท็กซี่คันนี้เย็น', 'taxi+hot': 'แท็กซี่คันนี้ร้อน',
      'coffee+nice': 'กาแฟแก้วนี้ดี', 'coffee+bad': 'กาแฟแก้วนี้แย่', 'coffee+cheap': 'กาแฟแก้วนี้ถูก', 'coffee+cold': 'กาแฟแก้วนี้เย็น', 'coffee+hot': 'กาแฟแก้วนี้ร้อน',
      'tea+nice': 'ชาแก้วนี้ดี', 'tea+bad': 'ชาแก้วนี้แย่', 'tea+cheap': 'ชาแก้วนี้ถูก', 'tea+cold': 'ชาแก้วนี้เย็น', 'tea+hot': 'ชาแก้วนี้ร้อน',
      'beer+nice': 'เบียร์ขวดนี้ดี', 'beer+bad': 'เบียร์ขวดนี้แย่', 'beer+cheap': 'เบียร์ขวดนี้ถูก', 'beer+cold': 'เบียร์ขวดนี้เย็น', 'beer+hot': 'เบียร์ขวดนี้ร้อน',
      'food+nice': 'อาหารจานนี้ดี', 'food+bad': 'อาหารจานนี้แย่', 'food+cheap': 'อาหารจานนี้ถูก', 'food+cold': 'อาหารจานนี้เย็น', 'food+hot': 'อาหารจานนี้ร้อน',
    },
    explanation:
      'ไทยพูด "โรงแรมนี้เก่า" สามคำจบ แต่อังกฤษต้องเปลี่ยนสองอย่าง: this ย้ายมาอยู่หน้าคำนาม (this hotel ไม่ใช่ hotel this) และต้องมี is คั่นก่อนคำคุณศัพท์เสมอ — "This hotel old" ไม่ใช่ประโยค ' +
      'โครงนี้ใช้บรรยายอะไรก็ได้ที่อยู่ตรงหน้า: ของ อาหาร ที่พัก ' +
      'ถ้าของอยู่ไกลออกไปเปลี่ยน this เป็น that แล้วที่เหลือเหมือนเดิม: That hotel is old.',
    showcase: [{ noun: 'hotel', adj: 'old' }, { noun: 'coffee', adj: 'cold' }, { noun: 'place', adj: 'beautiful' }],
    distractors: ['that', 'it', 'than', 'are'],
  },
  {
    id: 'p-is-er-than', level: 6,
    name: '___ is ___er than ___',
    enTemplate: '{first} is {comparative} than {second}',
    readingTemplate: '{first} อิส {comparative} แด็น {second}',
    thTemplate: '{first}{comparative}{second}',
    // The two sides are drawn from disjoint pools on purpose: the generator
    // enumerates every combination, and "this is cheaper than this" must be
    // impossible, not merely unlikely.
    slots: [
      { name: 'first', itemIds: ['this', 'this-one', 'it', 'coffee', 'tea'] },
      { name: 'comparative', itemIds: ['better', 'cheaper', 'bigger'] },
      { name: 'second', itemIds: ['that', 'that-one', 'beer'] },
    ],
    // A drink is better or cheaper, never bigger; and nothing is bigger than beer.
    compat: {
      coffee: ['better', 'cheaper'],
      tea: ['better', 'cheaper'],
      bigger: ['that', 'that-one'],
    },
    explanation:
      'ภาษาไทยพูด "ถูกกว่า" แล้วจบได้ แต่อังกฤษถ้าจะบอกว่ากว่าอะไร ต้องมี than ตามด้วยสิ่งที่สอง: This is cheaper than that. ' +
      'คำคุณศัพท์สั้นๆ เติม -er ท้ายคำ (cheap → cheaper, big → bigger) ไม่ต้องมี more นำหน้า — more cheaper ผิด ' +
      'ส่วน good ไม่มี gooder ต้องใช้ better และอย่าลืม is: "This cheaper than that" ขาดกริยา',
    showcase: [
      { first: 'this', comparative: 'cheaper', second: 'that' },
      { first: 'this-one', comparative: 'better', second: 'that-one' },
      { first: 'coffee', comparative: 'better', second: 'beer' },
    ],
    distractors: ['more', 'are', 'very', 'too'],
  },
]

export const level: Level = {
  n: 6,
  title: 'บรรยายสิ่งของ',
  titleEn: 'Describing Things',
  subtitle: 'ใหญ่ เล็ก แพง ถูก ร้อน เย็น — เปรียบเทียบด้วย -er และ than',
  icon: '🔍',
  canDo: [
    'บรรยายของ อาหาร ห้อง หรือสถานที่ด้วยคำคุณศัพท์พื้นฐานได้',
    'บอกว่าอะไร "มากเกินไป" ด้วย too และเน้นด้วย very / so',
    'เปรียบเทียบของสองอย่างว่าถูกกว่า ใหญ่กว่า ดีกว่า',
    'ชี้ของใกล้/ไกลด้วย this / that และเลือกอันที่ต้องการได้',
    'ใช้ a / an / the ได้ถูกต้องในวลีง่ายๆ',
  ],
  itemIds: [
    'big', 'small', 'hot', 'cold', 'expensive', 'cheap', 'new', 'old',
    'beautiful', 'nice', 'bad', 'easy', 'difficult',
    'too', 'an', 'that', 'that-one', 'than',
    'better', 'cheaper', 'bigger', 'thing', 'place',
  ],
  patternIds: ['p-it-is-too', 'p-this-is', 'p-is-er-than'],
}
