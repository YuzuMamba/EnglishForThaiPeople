// Readings the rules cannot or should not produce. Keep this SHORT.
//
// Two kinds of word belong here, and nothing else:
//   1. Words CMUdict does not have — Thai proper names and dishes a learner
//      will meet in English. These carry their own `ipa`.
//   2. Words whose fixed Thai form disagrees with their General American
//      sound (world เวิลด์, four โฟร์). The rule output is a faithful
//      pronunciation guide, but a Thai reader would stumble on it because
//      the "right" spelling is already in their head. The IPA still comes
//      from CMUdict, so `ipa` is omitted.
//
// Every entry has a comment saying what the rules give and why that is not
// shipped. "The deriver got it wrong" is not a reason — fix the rule in
// derive.ts / arpabet.ts and run validate.mts. Keys are lower-case; a key may
// contain a space (matched before single words) or a hyphen.

export interface Exception {
  reading: string
  /** Only for words CMUdict lacks; otherwise the IPA is derived. */
  ipa?: string
}

export const EXCEPTIONS: Record<string, Exception> = {
  // ── Thai names and dishes, as English words (not in CMUdict, or CMUdict's guess is foreign) ──
  bangkok: { reading: 'แบง-ค็อก' },                               // CMUdict B AE0 NG K AA1 K → แบง-คอก; the Thai-written English form keeps ็
  thailand: { reading: 'ไท-แลนด์' },                              // rules give ไท-แลนด์ too, but T AY1 L AE2 N D is one GA variant among several; pinned
  'chiang mai': { reading: 'เชียง-ใหม่', ipa: '/tʃiɑŋ ˈmaɪ/' },
  phuket: { reading: 'ภู-เก็ต', ipa: '/puˈkɛt/' },               // Thai spelling ภูเก็ต, not a transliteration of /fuːkɛt/
  sukhumvit: { reading: 'สุ-ขุม-วิท', ipa: '/suˈkʊmvɪt/' },
  siam: { reading: 'สยาม', ipa: '/saɪˈæm/' },                     // the Thai word, one token
  baht: { reading: 'บาท', ipa: '/bɑt/' },                         // Thai currency, written as the Thai word
  'pad thai': { reading: 'ผัด-ไทย', ipa: '/pɑd ˈtaɪ/' },
  'tom yum': { reading: 'ต้ม-ยำ', ipa: '/tɑm ˈjʌm/' },
  'som tam': { reading: 'ส้ม-ตำ', ipa: '/sɔm ˈtɑm/' },
  grab: { reading: 'แกร็บ' },                                     // the app, as Thai writes it (rules: แกร็บ as well; pinned so the brand never drifts)
  line: { reading: 'ไลน์' },                                      // the app; also the common noun, same reading
  '7-eleven': { reading: 'เซ-เว่น', ipa: '/ˈsɛvən/' },            // Thai says just "เซเว่น"; digits are not in CMUdict

  // ── English words whose fixed Thai form disagrees with the GA sound ──
  hello: { reading: 'เฮล-โล' },          // HH AH0 L OW1 → ฮะ-โล by rule; Thai writes เฮลโล (CMUdict's own variant is HH EH0 L OW1)
  world: { reading: 'เวิลด์' },          // W ER1 L D → เวิร์ลด์; Thai drops the ร์ before ลด์
  there: { reading: 'แธร์' },            // DH EH1 R → แดร์ (same as "dare"); Thai writes แธร์
  four: { reading: 'โฟร์' },             // F AO1 R → ฟอร์ (same as "for"); Thai writes โฟร์
  what: { reading: 'วอต' },              // W AH1 T → วัต; Thai hears the British /ɒ/: ว็อท/วอท
  "what's": { reading: 'วอตส์' },        // as above
  of: { reading: 'ออฟ' },                // AH1 V → อัฟ; Thai writes ออฟ
  the: { reading: 'เดอะ' },              // DH AH0 → ดะ; เดอะ is universal in Thai
  today: { reading: 'ทู-เดย์' },         // T AH0 D EY1 → ทะ-เดย์; Thai keeps "to" as ทู
  tonight: { reading: 'ทู-ไนต์' },       // as above
  tomorrow: { reading: 'ทู-มอ-โร' },     // as above
  together: { reading: 'ทู-เก-เธอร์' },  // as above
  computer: { reading: 'คอม-พิว-เทอร์' }, // K AH0 M P Y UW1 T ER0 → คัม-พิว-เทอร์; คอมพิวเตอร์ is a Thai dictionary word
  banana: { reading: 'บะ-นา-นะ' },       // B AH0 N AE1 N AH0 → บะ-แนน-นะ by the gemination rule; Thai follows the British /ɑː/
  school: { reading: 'สคูล' },           // S K UW1 L → สกูล by the S-cluster rule (sky สกาย); สคูล is the fixed Thai spelling
  new: { reading: 'นิว' },               // N UW1 → นู (GA drops the /j/); Thai keeps it: นิว, นิวยอร์ก
  news: { reading: 'นิวส์' },            // as above
  // CMUdict reduces -day to /di/ in these four (M AH1 N D IY0 → มัน-ดี้); Thai always says เดย์, as in birthday เบิร์ธ-เดย์.
  monday: { reading: 'มัน-เดย์' },
  tuesday: { reading: 'ทูส-เดย์' },
  wednesday: { reading: 'เวนส์-เดย์' },
  sunday: { reading: 'ซัน-เดย์' },
}
