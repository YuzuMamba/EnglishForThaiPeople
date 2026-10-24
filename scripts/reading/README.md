# Readings (คำอ่าน) — how an English item gets its Thai-script reading

**Never type a reading from memory.** English spelling does not say how a word sounds, so every `reading` and `ipa` is derived from the CMU Pronouncing Dictionary (`cmudict.dict`, BSD licence in `LICENSE-cmudict.txt`) through the rules in this folder:

```bash
npx tsx scripts/reading-anchor.mts --en "thank you" "coffee"      # reading + IPA + verdict per word
npx tsx scripts/reading-anchor.mts --json --en "thank you" ...     # batch
npx tsx scripts/reading-anchor.mts --check "coffee" "คอฟ-ฟี่"       # MATCH / MISMATCH against the derived form
npx tsx scripts/reading/validate.mts [--sample 60]                 # regression table + top-1,000 coverage; run after ANY edit here
npx tsx scripts/audit-readings.mts [--warn]                        # every reading in the corpus, replayed through the deriver
```

Verdicts: **DERIVED** ship it · **EXCEPTION** from `exceptions.ts`, ship it · **MISSING** not in CMUdict — add an exception *with a reason*, never guess. A reading describes the **sound**, not the Thai loanword spelling; where Thai readers would stumble on the rule output (world เวิลด์, four โฟร์, the dialogue cast), the word lives in `exceptions.ts` with a comment. Fix rules before adding exceptions.

## Shape
- One space-separated token per English word, syllables inside a word joined with `-`: `thank you` → `แธงค์ ยู`, `coffee` → `คอฟ-ฟี่`. A hyphenated English word is one token (`t-shirt` → `ที-เชิร์ต`).
- No tone marks except the falling mark on a word-final unstressed *-y* (ี้ after ก จ ด ต บ ป อ, else ี่: แฮป-ปี้, เว-รี่, also CMUdict's IY2: nobody โน-บอด-ดี้) and the fixed ั่น of *-tion/-sion* (สเต-ชั่น). Stress lives in the IPA only.
- Case-insensitive; `,.!?;:"()` are dropped (`Mr. Lee` → มิส-เตอร์ ลี); apostrophes stay (`don't` โดนต์, `I'm` ไอม์).

## Syllables (`syllabify.ts`)
A **stressed lax vowel** (IH EH AE AH UH AA) must be closed. One following consonant is **doubled** — coda here, onset there: happy แฮป-ปี้, city ซิต-ตี้, lesson เลส-ซัน, busy บิซ-ซี่, coffee คอฟ-ฟี่ (pairs in `GEMINATE`; kitchen คิท-เช็น and budget บัด-เจ็ต close with the stop their *tch*/*dg* shows). R W Y HH DH **V** never double (very เว-รี่, father ฟา-เธอร์, seven เซ-เว็น, heavy เฮ-วี่) and NG is only a coda (singer ซิง-เออร์). Two or more consonants: the first closes the syllable, the rest form the longest legal onset (problem พรอบ-เล็ม, extra เอ็กซ์-ทระ). After any other vowel the next syllable takes the longest legal onset (teacher ที-เชอร์, open โอ-เพ็น). A D that the spelling has no *d* for is CMUdict's flapped *t* (thirty เธอร์-ตี้, dirty เดอร์-ตี้).

## Consonants (`arpabet.ts`)
Onset: P พ B บ T ท D ด K ค G ก F ฟ V ว TH ธ DH ด (initial) / ธ (elsewhere) S ซ Z ซ SH/ZH/CH ช JH จ HH ฮ M ม N น L ล R ร W ว Y ย. In a cluster a leading S is ส and the stop after it is ป ต ก (stop สตอป, sky สกาย; ค before R/W/ิว: สแควร์, สคิวส์). **The same ป ต ก open an unstressed syllable after a closed one** (a coda, or the ร์ of ER) and any syllable after an S coda: sister ซิส-เตอร์, doctor ดอก-เตอร์, party พาร์-ตี้, twenty ทเวน-ตี้, example เอ็ก-แซม-เปิล, Boston บอส-ตัน; a stressed syllable, or one after an open syllable, keeps พ ท ค (fifteen ฟิฟ-ทีน, water วอ-เทอร์, explain เอ็กซ์-เพลน). No onset → carrier อ (apple แอป-เปิล). A preposed vowel goes in front of a Thai-shaped cluster (great เกรต, play เพลย์, question เควส) but after a standalone ส/ท/ด (station สเต-ชั่น, twenty ทเวน-ตี้).
Coda: P ป B บ T ต D ด K ก (ค after NG/L: ธิงค์, มิลค์) G ก F ฟ V ฟ TH/DH ธ S/Z ส SH ช CH ช JH จ M ม N น NG ง L ล R ร์. In a coda cluster the first consonant is plain and every later one takes ์ (test เทสต์, friends เฟรนด์ส์); after ร์ the count restarts (first เฟิร์สต์, hard ฮาร์ด). The letter *x* is กซ์ (box บอกซ์, six ซิกซ์, next เน็กซ์ต์, sixty ซิกซ์-ตี้; books บุกส์ keeps ส).

## Vowels — open / closed (`VOWELS` in `arpabet.ts`)
IY อี/-ี- · IH อิ/-ิ- · EY เ-ย์ final, เ- else (เพลย์, เลต, เว-เค-ชั่น); written *ay/ey* it keeps ย์ before *-s/-ed*: days เดย์ส์, played เพลย์ด (raise เรส, paid เพด) · EH เอะ/เ-็- · AE แอะ/แ-็- · AA -า (sorry ซอ-รี่ before an R onset), -อ- closed, -าร์ before R · AO ออ/-อ-, -อร์ · AH1 -า open, -ะ final, -ั- closed (มา-เธอร์, คัป) · AH0 -ะ/-ั-, เ-ิล before L (แอป-เปิล), ั่น after ช/จ (ชั่น) · ER เ-อร์/เ-ิร์- (เฮอร์, เวิร์ก) · UH อุ/-ุ-, -ัวร์ before R · UW อู/-ู- · C+Y+UW → -ิว (มิว-ซิก, คิวต์) · OW โ-/โ-C, โ-ร์; written *ow* at the end it is โ-ว์: know โนว์, window วิน-โดว์, knows โนว์ส์ (go โก, no โน) · AY -าย final (ไ- with no/ฮ onset: ไอ ไฮ), ไ- else; closed ไ-C with ์ on a single coda (ไลก์, ไทม์, ไฟน์) · AW -าว, -าวน์/-าวล์, else เ-า + C์ (เฮาส์, เอาต์) · OY ออย, -อยน์ · IH/IY+R เ-ียร์ · EH+R แ-ร์ · AY+ER ไ-ร์ (ไฟร์) · AW+ER -าวร์ (อาวร์; power พาว-เวอร์ is an exception) · IY+AH0 เ-ีย (ไอ-เดีย) · ER before a vowel hands its r on: around อะ-ราวนด์, hurry เฮอร์-รี่ · AY/EY before *-ing* keep their final shape: ทราย-อิง, เพลย์-อิง.

**The short mark ็** (เ-็ แ-็) is written in a word-final syllable with a single coda or a stop-initial cluster (bed เบ็ด, cat แค็ต, exact แซ็กต์, cats แค็ตส์), but not before L (bell เบล, hotel โฮ-เทล), not before S/Z in a polysyllable (express เอ็กซ์-เพรส; yes เย็ส keeps it), not before a sonorant/fricative cluster (friend เฟรนด์, can't แคนต์, test เทสต์), and never in a non-final or doubled syllable (question เควส-ชั่น, happy แฮป-ปี้).

**A reduced last syllable spelled with *e*** (AH0/IH0 with a coda, the word's last vowel letter *e*; a silent *-e*, *-le*, *-ed*, *-es* does not count): *-et -ed -en -em -ent -ence* → เ-็- (ticket ทิก-เก็ต, wanted วอน-เต็ด, chicken ชิก-เก็น, student สตู-เด็นต์, problem พรอบ-เล็ม, open โอ-เพ็น, hundred ฮัน-เดร็ด); before S Z SH CH JH L → เ- (buses บัส-เซส, places เพล-เซส, college คอล-เลจ, level เล-เวล). Other spellings keep ั/ิ (lesson เลส-ซัน, woman วุม-มัน, finished ฟิน-นิชต์, minutes มิน-นัตส์); contractions too (doesn't ดัซ-ซันต์).

**The ex- prefix**: เอ็กซ์- before a consonant (explain เอ็กซ์-เพลน, excuse เอ็กซ์-คิวส์, expert เอ็กซ์-เพิร์ต), เอ็ก- before a vowel or for *G Z* (exit เอ็ก-ซิต, example เอ็ก-แซม-เปิล, exercise เอ็ก-เซอร์-ไซส์).

IPA is General American with ˈ ˌ before stressed syllables (none on a monosyllable), one `/…/` per word: `/ˈhæpi/`, `/θæŋk/ /ju/`.
