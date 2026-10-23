# Readings (คำอ่าน) — how an English item gets its Thai-script reading

**Never type a reading from memory.** English spelling does not say how a word sounds, so every `reading` and `ipa` is derived from the CMU Pronouncing Dictionary (`cmudict.dict`, BSD licence in `LICENSE-cmudict.txt`) through the rules in this folder:

```bash
npx tsx scripts/reading-anchor.mts --en "thank you" "coffee"      # reading + IPA + verdict per word
npx tsx scripts/reading-anchor.mts --json --en "thank you" ...     # batch
npx tsx scripts/reading-anchor.mts --check "coffee" "คอฟ-ฟี่"       # MATCH / MISMATCH against the derived form
npx tsx scripts/reading/validate.mts [--sample 60]                 # regression table + top-1,000 coverage; run after ANY edit here
```

Verdicts: **DERIVED** ship it · **EXCEPTION** from `exceptions.ts`, ship it · **MISSING** not in CMUdict — add an exception *with a reason*, never guess. A reading describes the **sound**, not the Thai loanword spelling: บะ-นา-นะ is what the rules give for /bəˈnænə/; where Thai readers would stumble on that (world เวิลด์, four โฟร์, banana บะ-นา-นะ via exception), the word lives in `exceptions.ts` with a comment. Fix rules before adding exceptions.

## Shape
- One space-separated token per English word, syllables inside a word joined with `-`: `thank you` → `แธงค์ ยู`, `coffee` → `คอฟ-ฟี่`. A hyphenated English word is one token (`t-shirt` → `ที-เชิร์ต`).
- No tone marks except the falling mark on a word-final unstressed *-y* (ี้ after ก จ ด ต บ ป อ, else ี่: แฮป-ปี้, เว-รี่) and the fixed ั่น of *-tion/-sion* (สเต-ชั่น). Stress lives in the IPA only.
- Case-insensitive; `,.!?;:"()` are dropped; apostrophes stay (`don't` โดนต์, `I'm` ไอม์).

## Syllables (`syllabify.ts`)
A **stressed lax vowel** (IH EH AE AH UH AA) must be closed. One following consonant is **doubled** — coda here, onset there: happy แฮป-ปี้, city ซิต-ตี้, lesson เลส-ซัน, busy บิซ-ซี่, heavy เฮฟ-วี่ (pairs in `GEMINATE`). R W Y HH DH never double (very เว-รี่, father ฟา-เธอร์) and NG is only a coda (singer ซิง-เออร์). Two or more consonants: the first closes the syllable, the rest form the longest legal onset (problem พรอบ-ลัม, extra เอก-สตระ, sixteen ซิก-สตีน). After any other vowel the next syllable takes the longest legal onset (teacher ที-เชอร์, open โอ-พัน).

## Consonants (`arpabet.ts`)
Onset: P พ B บ T ท D ด K ค G ก F ฟ V ว TH ธ DH ด (initial) / ธ (elsewhere) S ซ Z ซ SH/ZH/CH ช JH จ HH ฮ M ม N น L ล R ร W ว Y ย. In a cluster a leading S is ส and the stop after it is ป ต ก (stop สตอป, sky สกาย; ค before R/W/ิว: สแควร์, สคิวส์). No onset → carrier อ (apple แอป-เปิล). A preposed vowel goes in front of a Thai-shaped cluster (great เกรต, play เพลย์, question เควส) but after a standalone ส/ท/ด (station สเต-ชั่น, twenty ทเวน-ที่).
Coda: P ป B บ T ต D ด K ก (ค after NG/L: ธิงค์, มิลค์) G ก F ฟ V ฟ TH/DH ธ S/Z ส SH ช CH ช JH จ M ม N น NG ง L ล R ร์. In a coda cluster the first consonant is plain and every later one takes ์ (test เทสต์, friends เฟรนด์ส์); after ร์ the count restarts (first เฟิร์สต์, hard ฮาร์ด).

## Vowels — open / closed (`VOWELS` in `arpabet.ts`)
IY อี/-ี- · IH อิ/-ิ- · EY เ-ย์ final, เ- else (เพลย์, เลต, เว-เค-ชั่น; +Z only: เดย์ส์) · EH เอะ/เ-็- · AE แอะ/แ-็- (the ็ only word-final with a single coda: เบ็ด, แค็ต but เฟรนด์, แฮป-ปี้, เควส-ชั่น) · AA -า (sorry ซอ-รี่ before an R onset), -อ- closed, -าร์ before R · AO ออ/-อ-, -อร์ · AH1 -า open, -ะ final, -ั- closed (มา-เธอร์, คัป) · AH0 -ะ/-ั-, เ-ิล before L (แอป-เปิล), ั่น after ช/จ (ชั่น) · ER เ-อร์/เ-ิร์- (เฮอร์, เวิร์ก) · UH อุ/-ุ-, -ัวร์ before R · UW อู/-ู- · C+Y+UW → -ิว (มิว-ซิก, คิวต์) · OW โ-/โ-C, โ-ร์ · AY -าย final (ไ- with no/ฮ onset: ไอ ไฮ), ไ- else; closed ไ-C with ์ on a single coda (ไลก์, ไทม์, ไฟน์) · AW -าว, -าวน์/-าวล์, else เ-า + C์ (เฮาส์, เอาต์) · OY ออย, -อยน์ · IH/IY+R เ-ียร์ · EH+R แ-ร์ · AY+ER ไ-ร์ (ไฟร์) · AW+ER -าวร์ (อาวร์) · IY+AH0 เ-ีย (ไอ-เดีย) · ER before a vowel hands its r on: around อะ-ราวนด์, hurry เฮอร์-รี่ · AY/EY before *-ing* keep their final shape: ทราย-อิง, เพลย์-อิง.

IPA is General American with ˈ ˌ before stressed syllables (none on a monosyllable), one `/…/` per word: `/ˈhæpi/`, `/θæŋk/ /ju/`.
