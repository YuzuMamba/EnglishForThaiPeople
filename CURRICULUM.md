# ChaiEnglish — Curriculum plan

Authors write `src/data/levels/levelNN.ts` from the level block below: items become `LexItem`s (ids = lower-case English slug, one id per sense), patterns become `SentencePattern`s (`p-` + slug), dialogues go through `scripts/check-dialogues.mts` then `merge-listening.mts`. Levels 13–35 are appended by parts 2–3 of this document and must take every closed-class form from the **Global allocation** table at the level it names — a form is taught once, as a unit, and never earlier than its row.
Inflected forms that fill a slot (`beers`, `likes`, `went`, `eating`) are their own ids tagged `plural` / `3sg` / `past` / `ing` — the engine does not inflect, so a pattern that needs the form must have it as an item at or before its level. Where a slot pool mixes foods, places and people, authors set `compat` so verbs pair sensibly; the showcase sentences are the guaranteed-good combinations.

## Sequence rationale

- Order = frequency × usefulness × teachability × combinability. Week one is the politeness kit, ordering food, prices and numbers — what a Thai adult actually needs with a foreign customer or on a trip — not textbook "colours and animals".
- Levels 1–4 are speakable with no reading: every item carries a Thai-script reading; the first phonics checkpoint sits at L5. L1–3 get a third dialogue because listening is the only input channel there.
- Closed-class words are placed where a pattern first needs them (`please` L1 → `Can I have … please` L2; `the` L3 → `Where is the …`), never in a "grammar level". The allocation table fixes each one so parts 2–3 cannot re-teach or skip them.
- Thai-L1 traps, each introduced once then recycled in later pattern notes:
  - be-verb am/are **L1** (Thai omits), is **L2** · subject pronoun never dropped **L1** (pattern note), recycled L4, L7
  - yes/no questions: `Are you …` **L1**, `Do you …` **L4**, `Does …` **L7** (no ไหม — flip or add do)
  - articles: `a` **L2**, `the` **L3**, `an` **L6** · plural -s **L3** (`two beers`), recycled L9 (`how many`)
  - wh- word order: **L3** (`How much is …` / `Where is the …`), generalised **L9**
  - can **L3** / can't **L7** · want to **L2**, `I'd like` **L2**, would **L19** · there is/are **L9**
  - 3rd-person -s / does **L7** · degree too/so/very **L6**, enough **L19** · comparatives **L6**, superlatives **L22**
  - prepositions: to **L5**, in/at **L7**, on **L12**, directions set **L13**, position set **L27**
  - will / going to **L5** · present continuous **L11** · have to / must **L11**, should **L15** · present perfect `Have you ever` **L11**
  - past -ed and irregulars **L21** · phrasal verbs **L14** (transport) and **L27** · tag questions **L26** · reported speech lite **L26** · polite softeners `could you / would you mind` **L26** · if-conditionals: `if` **L11**, full conditional frames **L33–34**
- Pronouns ride on need: he/she L4, we L5, they L9, me L8, him/them L22, us L20, mine/yours L23, our/their L31.
- Numbers 1–100 land at L3 as 28 ids; L3 is therefore the one oversized level (as in ChaiThai), paced by the daily new-item budget.
- The top ~1,000 spoken words are all placed by L35; the hand-off section lists what L13–35 still owe.
- CEFR waypoints: A1 by ~L12 (introduce self, order, ask prices/directions, say plans, basic questions); A1→A2 by ~L24 (past narration, health, shopping, work, time); A2 at L35 (linking clauses, opinions, changing plans, describing people and weather).

## Global allocation

Every closed-class form, placed once. Parts 2–3 teach each form at the level in its row (never earlier; a later level may only recycle it). Forms the audit script lists but the brief omits (`myself`, `being`, `done`, `none`, contracted negatives, `twelve`, `forty`, `fifty`) are included so `audit-content.mts` passes at L35.

| form | level | note |
|---|---|---|
| I | 1 | never dropped — pattern note at L1 |
| you | 1 | subject and object, one id |
| my | 1 | |
| your | 1 | |
| it | 3 | `How much is it` |
| he | 4 | |
| she | 4 | |
| we | 5 | `Can we …` |
| his | 7 | with 3rd-person -s |
| her | 7 | possessive and object, one id, note covers both |
| me | 8 | `help me`, `tell me` |
| they | 9 | with `there are` / plurals |
| us | 20 | with `let's` (= let us) |
| him | 22 | |
| them | 22 | |
| mine | 23 | |
| yours | 23 | |
| its | 27 | |
| myself | 30 | `by myself` |
| yourself | 30 | |
| our | 31 | |
| their | 31 | |
| am | 1 | `I am {state}` |
| are | 1 | `Are you {state}` |
| is | 2 | `What is this` |
| have | 2 | via `can I have` phrase + verb `have` |
| do | 4 | `Do you {verb} {thing}` |
| does | 7 | |
| has | 7 | 3sg |
| be | 11 | after might/must: `It might be …` |
| was | 21 | |
| were | 21 | |
| did | 21 | |
| had | 21 | |
| done | 28 | `I'm done` / `have you done` |
| been | 28 | word; L11 teaches phrase `been to` |
| being | 33 | |
| what | 2 | |
| where | 3 | |
| how much | 3 | unit |
| why | 8 | |
| when | 9 | question and conjunction, one id |
| who | 9 | |
| how | 9 | |
| how many | 9 | unit |
| how old | 9 | unit |
| how long | 14 | unit, transport |
| which | 16 | `which one` |
| whose | 27 | |
| no | 1 | answer and `no sugar` |
| not | 2 | `not spicy` |
| don't | 4 | unit |
| can't | 7 | unit |
| doesn't | 7 | unit |
| never | 18 | with frequency adverbs |
| didn't | 21 | unit |
| nothing | 23 | |
| nobody | 23 | |
| isn't | 23 | unit |
| aren't | 23 | unit |
| none | 25 | |
| won't | 34 | unit |
| a | 2 | |
| this | 2 | |
| the | 3 | |
| an | 6 | |
| that | 6 | determiner/pronoun; conjunction use noted at L20, same id |
| some | 9 | |
| any | 9 | |
| all | 10 | `that's all` |
| these | 16 | |
| those | 16 | |
| every | 18 | `every day` composes |
| another | 19 | `another beer please` |
| other | 23 | `the other one` |
| each | 25 | |
| both | 25 | |
| to | 5 | preposition; `want to` / `going to` are separate unit ids |
| from | 4 | `I am from …` |
| in | 7 | place; time use recycled L12 |
| at | 7 | `at home`, `at work`; clock use recycled L24 |
| with | 8 | |
| for | 9 | `a table for two` |
| of | 9 | `a lot of` |
| about | 10 | `What about …` |
| on | 12 | `on Monday`; place use recycled L27 |
| near | 13 | |
| next to | 13 | unit |
| behind | 13 | |
| in front of | 13 | unit |
| around | 13 | |
| by | 16 | `pay by card` |
| after | 20 | |
| before | 20 | |
| between | 27 | |
| under | 27 | |
| over | 27 | |
| through | 27 | |
| during | 30 | |
| until | 34 | preposition and conjunction, one id |
| and | 2 | `coffee and water` |
| but | 8 | |
| or | 8 | |
| because | 8 | |
| than | 6 | comparatives |
| if | 11 | word; conditional frames L33–34 |
| so (conj) | 20 | id `so-conj`; degree `so` is L4 |
| while | 33 | |
| although | 33 | |
| though | 33 | |
| unless | 33 | |
| want to | 2 | unit, altEn `wanna` |
| can | 3 | |
| going to | 5 | unit, altEn `gonna` |
| will | 5 | altEn `'ll` noted |
| can't | 7 | (listed above) |
| have to | 11 | unit, altEn `gotta` |
| must | 11 | |
| might | 11 | |
| should | 15 | health advice |
| need to | 15 | unit |
| may | 16 | `May I help you` |
| would | 19 | `Would you like …` |
| could | 26 | polite softener |
| used to | 30 | unit |
| more | 2 | `more water please`; comparative use recycled L6 |
| very | 4 | |
| so (degree) | 4 | |
| too | 6 | excess; `me too` phrase at L10 |
| a lot | 9 | unit |
| many | 9 | |
| a little | 8 | phrase: `a little English` |
| really | 10 | adverb and reaction, one id |
| all | 10 | (listed above) |
| also | 20 | |
| enough | 19 | |
| quite | 22 | |
| much | 25 | |
| few | 25 | |
| little | 25 | |
| less | 25 | |
| most | 25 | superlative form pool starts L22 (`best`) |
| only | 25 | |
| just | 28 | `just did` |
| one … ten | 3 | ten ids |
| eleven … nineteen | 3 | nine ids |
| twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety | 3 | eight ids |
| hundred | 3 | |
| first, second, third | 12 | ordinals for dates |
| thousand | 24 | |
| million | 24 | |
| half | 24 | `half past` |
| today | 5 | |
| tomorrow | 5 | |
| now | 5 | |
| later | 5 | |
| morning | 5 | |
| already | 5 | |
| again | 8 | `again please` |
| years | 9 | plural id for `years old`; singular `year` L12 |
| still | 11 | |
| yet | 11 | word; phrase `not yet` is L5 |
| afternoon | 12 | |
| evening | 12 | |
| night | 12 | |
| week | 12 | |
| month | 12 | |
| year | 12 | |
| always | 18 | |
| usually | 18 | |
| often | 18 | |
| sometimes | 18 | |
| never | 18 | (listed above) |
| yesterday | 21 | |
| hour | 24 | |
| minute | 24 | |
| o'clock | 24 | |
| soon | 28 | |
| months January–December | 24 | twelve ids, with dates |
| okay | 1 | altEn `OK` |
| sorry | 1 | |
| excuse me | 3 | unit |
| maybe | 8 | |
| of course | 8 | unit |
| no problem | 8 | unit |
| yeah | 10 | |
| sure | 10 | |
| well | 10 | filler |
| actually | 10 | |
| there | 9 | adverb, needed by the literal in `Is there a … here`; `there is` / `there are` are L9 phrase ids |
| something / anything / everything / someone / anyone | 23 | |
| get | 13 | `How do I get to …`; `get` = become recycled L35 |
| let's | 20 | unit |
| ago | 21 | |

## Fixed cast

Thai speakers: **Nam** (f), **Ploy** (f), **Fah** (f), **Bank** (m), **Tee** (m), **Nut** (m). Foreigners: **Emma** (f), **Sarah** (f), **Anna** (f), **Tom** (m), **Jack** (m), **Mr. Lee** (m). Every dialogue has at least one Thai speaker; the Thai speaker is the learner's proxy (receptionist, barista, driver, colleague, friend, date), the foreigner is the customer, tourist, boss or chat partner. Names are not items; they are read, never learned.

## Level 1 — First Words · คำแรก
- icon: 👋
- subtitle (Thai, ≤ 60 chars): ทักทาย ขอบคุณ แนะนำตัว — พูดได้ตั้งแต่วันแรก
- theme: The politeness kit and a two-line self-introduction; everything a Thai receptionist, barista or new acquaintance says in the first ten seconds.
- grammar focus:
  - be-verb `am / are`: Thai says ฉันสบายดี with no verb; English must put `am`/`are` between subject and state (`I am fine`). Contraction `I'm` / `you're` noted, full form taught.
  - subject pronoun is never dropped: Thai drops ฉัน/คุณ freely; English `am fine` is broken. Every pattern here starts with `I` or `you`.
  - yes/no question by flipping `are` to the front (`Are you okay?`), no ไหม particle. Answer `Yes, I am` / `No`.
- canDo (Thai):
  - ทักทายและบอกลาลูกค้าต่างชาติได้อย่างมั่นใจ
  - ขอบคุณและขอโทษได้ถูกสถานการณ์
  - บอกชื่อตัวเองและถามชื่ออีกฝ่ายได้
  - บอกได้ว่าสบายดี โอเค หรือเป็นคนไทย ด้วยประโยค I am …
  - ถามว่าอีกฝ่ายโอเคไหมด้วย Are you …? และตอบ Yes / No ได้
- items (22):
  - hello — สวัสดี — คำทักทาย — greeting
  - bye — ลาก่อน / บ๊ายบาย — คำทักทาย — greeting (altEn goodbye)
  - thank you — ขอบคุณ — วลี — polite (phrase; altEn thanks)
  - yes — ใช่ / ครับ / ค่ะ (ตอบรับ) — คำตอบรับ — reaction
  - no — ไม่ / ไม่ใช่ — คำตอบรับ — reaction
  - please — ได้โปรด / …หน่อย (ท้ายคำขอ) — คำวิเศษณ์ — polite
  - sorry — ขอโทษ — คำอุทาน — polite
  - I — ฉัน / ผม — คำสรรพนาม — pronoun
  - you — คุณ — คำสรรพนาม — pronoun
  - am — เป็น / อยู่ / คือ (กริยา be คู่กับ I) — คำกริยา — grammar
  - are — เป็น / อยู่ / คือ (กริยา be คู่กับ you) — คำกริยา — grammar
  - my — ของฉัน — คำสรรพนาม — pronoun
  - your — ของคุณ — คำสรรพนาม — pronoun
  - name — ชื่อ — คำนาม — intro
  - fine — สบายดี — คำคุณศัพท์ — state
  - okay — โอเค / ไม่เป็นไร — คำคุณศัพท์ — state (altEn OK)
  - good — ดี — คำคุณศัพท์ — state
  - happy — ดีใจ / มีความสุข — คำคุณศัพท์ — feeling
  - Thai — ไทย / คนไทย — คำคุณศัพท์ — identity
  - nice to meet you — ยินดีที่ได้รู้จัก — วลี — intro (phrase)
  - how are you — สบายดีไหม — วลี — intro (phrase)
  - what's your name — คุณชื่ออะไร — วลี — intro (phrase; altEn what is your name)
- patterns (2):
  - `I am` → `I am {state}` → ฉัน{state} → state: fine, okay, good, happy, Thai, sorry (all L1) → Thai has no verb here; English needs `am` after `I` every time, and `I` is never dropped. Spoken form `I'm` accepted when typed. → I am fine · I am Thai · I am sorry
  - `Are you` → `Are you {state}` → คุณ{state}ไหม → state: okay, fine, happy, Thai (L1) → No ไหม in English: the question is made by moving `are` in front of `you`. Answer with `Yes, I am` or `No`, never with the bare adjective. → Are you okay · Are you Thai · Are you happy
- dialogues (3):
  - Hostel reception, first meeting · Nam (reception) & Emma (guest) · tests whether the two have met before (the `nice to meet you` / `what's your name` exchange) — not what any line means.
  - Café counter, Tom bumps the tray · Ploy (barista) & Tom · tests whether Tom is hurt or fine after `sorry` / `Are you okay?` / `I am fine`.
  - BTS platform small talk · Bank & Sarah · tests whether Bank is Thai and who asked first (`Are you Thai?` → `Yes, I am`).
- recycles: none (first level); every L1 item is a slot or literal in L2–L4 (`please` in `Can I have … please`, `I/you/am/are` in every frame, `your` in `When is your …` L12).

## Level 2 — Wants & Needs · อยากได้ ต้องการ
- icon: 🍜
- subtitle (Thai, ≤ 60 chars): สั่งอาหารและเครื่องดื่ม บอกได้ว่าอยากได้อะไร ไม่เอาอะไร
- theme: Ordering food and drink, saying what you want, need and don't want — the street stall, the café counter, the first foreign customer.
- grammar focus:
  - `want to` + verb: Thai อยากกิน puts the verb straight after อยาก; English needs `to` (`I want to eat`). Taught as one chunk `want to`.
  - article `a`: Thai has no article; English counts one countable thing with `a` (`a coffee`, `a beer`) and leaves mass nouns bare (`water`, `rice`). Introduced here, `the` at L3, `an` at L6.
  - `is` completes the be-verb set (`What is this`, `This is chicken`); `not` is the first negation (`not spicy`), do-support negation waits for L4.
- canDo (Thai):
  - สั่งอาหารและเครื่องดื่มง่ายๆ ที่ร้านหรือแผงลอยได้
  - สั่งกาแฟและบอกได้ว่าไม่เอาน้ำตาล ไม่เอาน้ำแข็ง
  - บอกได้ว่าอยากกินหรืออยากดื่มอะไรด้วย I want to …
  - ขอของอย่างสุภาพด้วย Can I have … please
  - ถามได้ว่า "นี่คืออะไร" และชี้เลือก "อันนี้" ได้
- items (25):
  - want — อยากได้ / ต้องการ — คำกริยา — core-verb
  - want to — อยากจะ (+กริยา) — คำช่วยกริยา — modal (phrase; altEn wanna)
  - need — ต้องการ / จำเป็นต้องมี — คำกริยา — core-verb
  - can I have — ขอ… (ได้ไหม) — วลี — polite (phrase; altEn can I get)
  - I'd like — ฉันขอ… (สุภาพกว่า I want) — วลี — polite (phrase; altEn I would like)
  - have — มี / ได้รับ / กิน (ในบริบทสั่งอาหาร) — คำกริยา — core-verb
  - a — (นำหน้านามนับได้ หนึ่งหน่วย) — คำนำหน้านาม — grammar
  - and — และ / กับ — คำสันธาน — glue
  - not — ไม่ (ปฏิเสธ) — คำวิเศษณ์ — grammar
  - what — อะไร — คำถาม — question
  - is — เป็น / อยู่ / คือ (be คู่กับ he, she, it, this) — คำกริยา — grammar
  - this — นี่ / นี้ — คำสรรพนาม — determiner
  - this one — อันนี้ (ชี้เลือก) — วลี — phrase
  - water — น้ำ / น้ำเปล่า — คำนาม — drink
  - coffee — กาแฟ — คำนาม — drink
  - tea — ชา — คำนาม — drink
  - beer — เบียร์ — คำนาม — drink
  - rice — ข้าว — คำนาม — food
  - chicken — ไก่ — คำนาม — food
  - spicy — เผ็ด — คำคุณศัพท์ — food-adj
  - sugar — น้ำตาล — คำนาม — food
  - ice — น้ำแข็ง — คำนาม — food
  - eat — กิน — คำกริยา — core-verb
  - drink — ดื่ม — คำกริยา — core-verb
  - more — เพิ่ม / อีก (more water please) — คำวิเศษณ์ — quantity (comparative use recycled L6)
- patterns (3):
  - `I want` → `I want {thing}` → ฉันอยากได้{thing} → thing: water, coffee, tea, beer, rice, chicken, sugar, ice, this, this one (L2) → Word order matches Thai, but `I` is never dropped. `want` is direct; with a stranger use `I'd like` or the next frame. → I want water · I want this one · I want rice
  - `Can I have … please` → `Can I have {thing} please` → ขอ{thing}หน่อยได้ไหม → thing: water, coffee, tea, beer, rice, chicken, sugar, ice, this, this one (L2) → The polite ordering chunk; learned whole, `can` is unpacked at L3. Mass nouns take no article; one countable item takes `a` (`a coffee`), covered in the item note, not in the slot. → Can I have water please · Can I have this one please · Can I have coffee please
  - `I want to` → `I want to {verb} {thing}` → ฉันอยาก{verb}{thing} → verb: eat, drink, have (L2); thing: rice, chicken, water, coffee, tea, beer, this, this one (L2) → Thai อยาก + กริยา has nothing between; English must have `to`. `want to` is one chunk (`wanna` in fast speech). → I want to eat rice · I want to drink water · I want to have this one
- dialogues (3):
  - Street-food stall · Ploy (vendor) & Jack · Jack asks `What is this?`, orders `this one`, adds `not spicy` — question tests what Jack decided about spiciness, not what the dish is.
  - Café counter · Nam (barista) & Emma · Emma orders coffee with `no sugar, no ice` — question tests which thing Emma does **not** want.
  - Hotel restaurant · Tee (waiter) & Anna · Anna says `I want to eat`, chooses rice and chicken, asks for water — question tests what she chose to drink.
- recycles: please, I, yes, no, thank you (L1); pattern `I am {state}` reused in dialogue closings (`I am happy`); `this` returns in L3 `How much is {thing}`.

## Level 3 — Getting Around · เดินทางในเมือง
- icon: 🧭
- subtitle (Thai, ≤ 60 chars): ถามราคา ถามทาง นับเลข 1–100 ขอโทษ/ขออนุญาตแบบสุภาพ
- theme: Prices, places and numbers — the taxi, the market, the hotel lobby, the ticket counter. Oversized by design: numbers 1–100 are 28 ids (as in ChaiThai L3).
- grammar focus:
  - wh- word order: Thai puts เท่าไหร่ / ที่ไหน at the end; English puts `How much` / `Where` first and `is` immediately after (`How much is this`, `Where is the toilet`).
  - plural -s: Thai เบียร์สองขวด keeps the noun; English adds -s after any number above one (`two beers`). Plural forms are separate ids (`beers`, `coffees`, `tickets`).
  - `the` (specific thing both people know: `the toilet`, `the hotel`) vs `a` from L2; `can` as a modal on its own (`Can I …`), unpacked from `can I have`.
- canDo (Thai):
  - ถามราคาและเข้าใจคำตอบเป็นบาทได้ (1–100 และหลักร้อย)
  - นับเลข 1–100 และบอกจำนวนที่ต้องการได้
  - ถามว่าห้องน้ำ โรงแรม แท็กซี่ หรือตู้เอทีเอ็มอยู่ที่ไหน
  - สั่งของหลายชิ้นได้ถูกต้องด้วยรูปพหูพจน์ (two beers)
  - ใช้ Excuse me เรียกคนและใช้ Sorry ขอโทษได้ถูกสถานการณ์
- items (43):
  - one — หนึ่ง — จำนวน — number
  - two — สอง — จำนวน — number
  - three — สาม — จำนวน — number
  - four — สี่ — จำนวน — number
  - five — ห้า — จำนวน — number
  - six — หก — จำนวน — number
  - seven — เจ็ด — จำนวน — number
  - eight — แปด — จำนวน — number
  - nine — เก้า — จำนวน — number
  - ten — สิบ — จำนวน — number
  - eleven — สิบเอ็ด — จำนวน — number
  - twelve — สิบสอง — จำนวน — number
  - thirteen — สิบสาม — จำนวน — number (note: -teen = 10+, stress on -teen)
  - fourteen — สิบสี่ — จำนวน — number
  - fifteen — สิบห้า — จำนวน — number
  - sixteen — สิบหก — จำนวน — number
  - seventeen — สิบเจ็ด — จำนวน — number
  - eighteen — สิบแปด — จำนวน — number
  - nineteen — สิบเก้า — จำนวน — number
  - twenty — ยี่สิบ — จำนวน — number (note: twenty-one … twenty-nine compose with a hyphen)
  - thirty — สามสิบ — จำนวน — number (note: -ty vs -teen, stress on first syllable)
  - forty — สี่สิบ — จำนวน — number
  - fifty — ห้าสิบ — จำนวน — number
  - sixty — หกสิบ — จำนวน — number
  - seventy — เจ็ดสิบ — จำนวน — number
  - eighty — แปดสิบ — จำนวน — number
  - ninety — เก้าสิบ — จำนวน — number
  - hundred — ร้อย — จำนวน — number (note: `a hundred` / `one hundred`; `two hundred baht` no -s)
  - how much — เท่าไหร่ (ราคา) — คำถาม — question (phrase)
  - where — ที่ไหน — คำถาม — question
  - the — (นำหน้านามที่รู้กันว่าหมายถึงอันไหน) — คำนำหน้านาม — grammar
  - here — ที่นี่ — คำวิเศษณ์ — place
  - it — มัน / สิ่งนั้น — คำสรรพนาม — pronoun
  - excuse me — ขอโทษค่ะ/ครับ (เรียกคน ขอทาง) — วลี — polite (phrase)
  - can — ได้ / สามารถ — คำช่วยกริยา — modal
  - baht — บาท — คำนาม — money
  - toilet — ห้องน้ำ — คำนาม — place (altEn bathroom, restroom)
  - hotel — โรงแรม — คำนาม — place
  - ATM — ตู้เอทีเอ็ม — คำนาม — place
  - taxi — แท็กซี่ — คำนาม — place
  - beers — เบียร์ (หลายขวด) — คำนาม (พหูพจน์) — plural
  - coffees — กาแฟ (หลายแก้ว) — คำนาม (พหูพจน์) — plural
  - tickets — ตั๋ว (หลายใบ) — คำนาม (พหูพจน์) — plural (singular `ticket` is L14)
- patterns (3):
  - `How much is` → `How much is {thing}` → {thing}ราคาเท่าไหร่ → thing: this, this one, it, coffee, beer, water, rice, chicken, tea (L2–L3) → Question word first, then `is`, then the thing — the reverse of Thai. Answer `{number} baht`. → How much is this · How much is it · How much is this one
  - `Where is the` → `Where is the {place}` → {place}อยู่ที่ไหน → place: toilet, hotel, ATM, taxi, coffee, water (L2–L3) → Same wh- fronting; `the` because both people know which toilet is meant. Answer `Here` / point. → Where is the toilet · Where is the ATM · Where is the taxi
  - `Can I have {number} … please` → `Can I have {number} {things} please` → ขอ{things} {number}ที่หน่อย → number: one … ten (L3); things: beers, coffees, tickets (L3), with `compat` pairing `one` with singular `beer` / `coffee` (L2) → Plural -s is mandatory after two and up; Thai never changes the noun. `one` keeps the singular. → Can I have two beers please · Can I have three tickets please · Can I have two coffees please
- dialogues (3):
  - Night-market stall · Fah (vendor) & Tom · two prices quoted (`two hundred baht`, `one hundred fifty`) — question tests which item Tom takes, i.e. the cheaper one.
  - Hotel lobby · Bank (bell staff) & Sarah · `Excuse me, where is the toilet?` then the ATM — question tests where Sarah goes **next** after the toilet.
  - Beach bar · Nut (bartender) & Jack · Jack orders a number of beers, then changes it — question tests the final number ordered.
- recycles: this, this one, coffee, beer, water, rice (L2) in the price pool; `can I have` (L2) is extended with numbers; please (L1); `sorry` (L1) contrasted with `excuse me` in notes; `is` (L2) now carries both wh- frames.

## Level 4 — People & Feelings · คนและความรู้สึก
- icon: 💛
- subtitle (Thai, ≤ 60 chars): ครอบครัว ชอบ/ไม่ชอบ มาจากไหน ถามด้วย Do you …?
- theme: Family words, likes and dislikes, where you are from, and the feelings you have at the end of a day — small talk with a customer, a date or a new friend.
- grammar focus:
  - do-support for yes/no questions: Thai adds ไหม; English puts `Do` before the subject (`Do you like coffee?`). No ไหม, no rising "like?".
  - do-support for negation: Thai puts ไม่ straight before the verb; English needs `don't` + base verb (`I don't like sugar`). Introduced as one chunk `don't`.
  - `he / she` + `is` (from L2) and the preposition `from` (`I am from Bangkok`); degree words `very` / `so` before feelings (`so tired`).
- canDo (Thai):
  - บอกได้ว่าชอบหรือไม่ชอบอะไร (อาหาร เครื่องดื่ม สถานที่)
  - ถามอีกฝ่ายว่าชอบ/อยากได้/มี … ไหม ด้วย Do you …?
  - แนะนำคนในครอบครัวและเพื่อนด้วย This is my …
  - บอกได้ว่ามาจากไหนและถามกลับได้ (Where are you from?)
  - บอกความรู้สึก เหนื่อย หิว เศร้า และเน้นด้วย very / so ได้
- items (21):
  - he — เขา (ผู้ชาย) — คำสรรพนาม — pronoun
  - she — เธอ / เขา (ผู้หญิง) — คำสรรพนาม — pronoun
  - from — จาก / มาจาก — คำบุพบท — prep
  - Thailand — ประเทศไทย — คำนาม — place
  - Bangkok — กรุงเทพฯ — คำนาม — place
  - like — ชอบ — คำกริยา — core-verb
  - love — รัก / ชอบมาก — คำกริยา — core-verb
  - don't — ไม่ (ปฏิเสธกริยาทั่วไป) — คำช่วยกริยา — grammar (phrase; altEn do not)
  - do — (ทำประโยคคำถาม) / ทำ — คำช่วยกริยา — grammar
  - very — มาก — คำวิเศษณ์ — degree
  - so — มาก (เน้นอารมณ์) — คำวิเศษณ์ — degree
  - family — ครอบครัว — คำนาม — family
  - mom — แม่ — คำนาม — family (altEn mum, mother)
  - dad — พ่อ — คำนาม — family (altEn father)
  - sister — พี่สาว / น้องสาว — คำนาม — family
  - brother — พี่ชาย / น้องชาย — คำนาม — family
  - friend — เพื่อน — คำนาม — people
  - food — อาหาร — คำนาม — food
  - sad — เศร้า — คำคุณศัพท์ — feeling
  - tired — เหนื่อย — คำคุณศัพท์ — feeling
  - hungry — หิว — คำคุณศัพท์ — feeling
- patterns (3):
  - `I like` → `I {verb} {thing}` → ฉัน{verb}{thing} → verb: like, love (L4), want, need, have (L2); thing: coffee, tea, beer, rice, chicken, water, sugar, ice, food, this, this one (L2), it (L3), Thailand, Bangkok (L4) → Subject + verb + object, the same order as Thai — the trap is only that `I` must be said. `like` is ชอบ, `love` is stronger; both take a noun straight after. → I like coffee · I love Thailand · I need water
  - `I don't` → `I don't {verb} {thing}` → ฉันไม่{verb}{thing} → verb: like, want, need, eat, drink, have (L2/L4); thing: same pool as above → Thai ไม่ sits before the verb alone; English needs `don't` and the verb stays base form (`don't eat`, never `don't eats`). → I don't like sugar · I don't drink beer · I don't eat chicken
  - `Do you` → `Do you {verb} {thing}` → คุณ{verb}{thing}ไหม → verb: like, want, need, have, eat, drink; thing: same pool → `Do` opens the question and carries the ไหม job; the verb stays base. Answer `Yes, I do` / `No, I don't`. → Do you like coffee · Do you want water · Do you have ice
- dialogues (2):
  - Phone photo of family · Nam & Emma · Nam introduces mom, dad and a brother; Emma asks `Do you have a sister?` — question tests whether Nam has a sister or a brother.
  - First dinner date · Tee & Anna · `Do you like Thai food?` / `I love it` / `Not spicy` / `Where are you from?` — question tests what Anna does **not** like, not whether she likes Thai food.
- recycles: `I am {state}` (L1) with sad, tired, hungry and `so` (`I am so tired` in dialogue); this, this one, coffee, beer, sugar, ice (L2) as objects; it (L3); Thai (L1) + food = `Thai food` in dialogue; `where` (L3) in `Where are you from?`.

## Level 5 — Time & Plans · เวลาและแผน
- icon: ⏰
- subtitle (Thai, ≤ 60 chars): วันนี้ พรุ่งนี้ ตอนนี้ กำลังจะทำอะไร นัดเจอกัน แล้วเจอกัน
- theme: Saying when, making and confirming plans, `going to` for intentions, `will` for on-the-spot decisions, `see you` as the sign-off. First phonics checkpoint sits here, so items stay short and high-frequency.
- grammar focus:
  - `going to` + verb for plans: Thai จะ has no be-verb; English is `am/are going to` + base verb. Learned as a chunk (`gonna` in fast speech).
  - `will` vs `going to`: `will` is the decision made right now or a promise (`I will come`); `going to` is a plan you already have. Thai uses จะ for both, so the note is contrastive.
  - `already` / `not yet` answer "done or not?" — Thai แล้ว / ยัง — without any past tense yet; `we` and `Can we …` for proposals; `to` as the direction preposition (`go to Bangkok`).
- canDo (Thai):
  - บอกได้ว่ากำลังจะทำอะไร วันนี้ พรุ่งนี้ หรือคืนนี้
  - ถามว่าอีกฝ่ายว่างไหม และตอบว่าว่างหรือไม่ว่าง
  - ชวนและนัดเจอกันด้วย Can we meet …? และปิดท้ายด้วย See you …
  - ถามและบอกเวลาแบบง่าย (What time is it? / now / later)
  - ตอบได้ว่า "แล้ว" หรือ "ยัง" ด้วย already / not yet
- items (22):
  - today — วันนี้ — คำวิเศษณ์ — time
  - tomorrow — พรุ่งนี้ — คำวิเศษณ์ — time
  - now — ตอนนี้ — คำวิเศษณ์ — time
  - later — ทีหลัง / ไว้ค่อย — คำวิเศษณ์ — time
  - tonight — คืนนี้ — คำวิเศษณ์ — time
  - morning — ตอนเช้า — คำนาม — time (`good morning` composes)
  - time — เวลา — คำนาม — time (`what time is it` composes)
  - going to — กำลังจะ (+กริยา) — คำช่วยกริยา — modal (phrase; altEn gonna)
  - will — จะ (ตัดสินใจตอนนี้ / สัญญา) — คำช่วยกริยา — modal (altEn 'll)
  - go — ไป — คำกริยา — core-verb
  - come — มา — คำกริยา — core-verb
  - see — เห็น / เจอ — คำกริยา — core-verb
  - see you — แล้วเจอกัน — วลี — greeting (phrase)
  - meet — พบ / เจอ (นัดเจอ) — คำกริยา — core-verb
  - free — ว่าง — คำคุณศัพท์ — state
  - busy — ยุ่ง / ไม่ว่าง — คำคุณศัพท์ — state
  - already — แล้ว (ทำไปแล้ว) — คำวิเศษณ์ — time
  - not yet — ยัง (ยังไม่ได้ทำ) — วลี — time (phrase)
  - sleep — นอน — คำกริยา — core-verb
  - home — บ้าน / ที่บ้าน (go home ไม่มี to) — คำนาม — place
  - to — ไป…/ ถึง (บอกทิศทาง) — คำบุพบท — prep
  - we — เรา (พวกเรา) — คำสรรพนาม — pronoun
- patterns (3):
  - `I am going to` → `I am going to {verb} {time}` → ฉันกำลังจะ{verb}{time} → verb: go, come, sleep, eat, drink (L2/L5); time: today, tomorrow, now, later, tonight (L5) → Thai จะ + กริยา; English keeps `am` and the chunk `going to`, then the base verb. Time word goes last. → I am going to sleep now · I am going to eat later · I am going to come tonight
  - `Are you free` → `Are you free {time}` → คุณว่าง{time}ไหม → time: today, tomorrow, now, later, tonight (L5) → The L1 `Are you …` frame with an adjective and a time word; answer `Yes` / `No, I am busy`. → Are you free tomorrow · Are you free tonight · Are you free now
  - `Can we` → `Can we {verb} {time}` → เรา{verb}{time}ได้ไหม → verb: meet, go, eat, drink, come (L2/L5); time: today, tomorrow, now, later, tonight (L5) → `can` + `we` makes a proposal; Thai …ได้ไหม goes at the end, English `Can` goes first. → Can we meet tomorrow · Can we eat now · Can we go later
- dialogues (2):
  - Chat to fix a meet-up · Fah & Jack · `Are you free tomorrow?` → busy → `Tonight?` → `See you tonight` — question tests **when** they finally agree to meet.
  - Hotel reception, guest leaving · Bank & Mr. Lee · `What time is it?` / `I am going to go now` / `Taxi?` / `Not yet` — question tests whether Mr. Lee already has a taxi.
- recycles: `Are you {state}` (L1) extended with `free`; can (L3) in `Can we`; eat, drink (L2) and go, come, sleep (L5) share one verb pool; what, is (L2) + it (L3) compose `What time is it`; taxi, hotel (L3) in dialogue.

## Level 6 — Describing Things · บรรยายสิ่งของ
- icon: 🔍
- subtitle (Thai, ≤ 60 chars): ใหญ่ เล็ก แพง ถูก ร้อน เย็น — เปรียบเทียบด้วย -er และ than
- theme: The core adjective set, degree words before the adjective, and the first comparatives — choosing a room, a dish, a souvenir, and saying why.
- grammar focus:
  - degree word before the adjective: Thai แพงมาก / แพงเกินไป puts the degree after; English `very / so / too` go before (`too expensive`). `too` is always "more than is good".
  - comparatives: Thai adj + กว่า; English short adj + `-er` + `than` (`cheaper than`), irregular `good → better`. The -er forms are separate ids. Long adjectives take `more` (from L2) — shown in notes, pooled at L22.
  - `that` (far / already mentioned) vs `this`; `an` before a vowel sound (`an old hotel`), completing a/an/the.
- canDo (Thai):
  - บรรยายของ อาหาร ห้อง หรือสถานที่ด้วยคำคุณศัพท์พื้นฐานได้
  - บอกว่าอะไร "มากเกินไป" ด้วย too และเน้นด้วย very / so
  - เปรียบเทียบของสองอย่างว่าถูกกว่า ใหญ่กว่า ดีกว่า
  - ชี้ของใกล้/ไกลด้วย this / that และเลือกอันที่ต้องการได้
  - ใช้ a / an / the ได้ถูกต้องในวลีง่ายๆ
- items (22):
  - big — ใหญ่ — คำคุณศัพท์ — adj
  - small — เล็ก — คำคุณศัพท์ — adj
  - hot — ร้อน — คำคุณศัพท์ — adj (temperature; `spicy` is L2)
  - cold — เย็น / หนาว — คำคุณศัพท์ — adj
  - expensive — แพง — คำคุณศัพท์ — adj
  - cheap — ถูก (ราคา) — คำคุณศัพท์ — adj
  - new — ใหม่ — คำคุณศัพท์ — adj
  - old — เก่า / แก่ — คำคุณศัพท์ — adj
  - beautiful — สวย — คำคุณศัพท์ — adj
  - nice — ดี / น่ารัก / น่าพอใจ — คำคุณศัพท์ — adj
  - bad — แย่ / ไม่ดี — คำคุณศัพท์ — adj
  - easy — ง่าย — คำคุณศัพท์ — adj
  - difficult — ยาก — คำคุณศัพท์ — adj (altEn hard)
  - too — เกินไป — คำวิเศษณ์ — degree (`me too` sense is an L10 phrase)
  - an — (a ก่อนเสียงสระ) — คำนำหน้านาม — grammar
  - that — นั่น / นั้น — คำสรรพนาม — determiner
  - than — กว่า — คำสันธาน — grammar
  - better — ดีกว่า — คำคุณศัพท์ (ขั้นกว่า) — comparative
  - cheaper — ถูกกว่า — คำคุณศัพท์ (ขั้นกว่า) — comparative
  - bigger — ใหญ่กว่า — คำคุณศัพท์ (ขั้นกว่า) — comparative
  - thing — สิ่ง / ของ — คำนาม — noun
  - place — สถานที่ / ร้าน — คำนาม — noun
- patterns (3):
  - `It is too` → `It is {degree} {adj}` → มัน{adj}{degree} → degree: very, so (L4), too (L6); adj: big, small, hot, cold, expensive, cheap, new, old, beautiful, nice, bad, easy, difficult (L6), spicy (L2), good (L1) → Degree word first, adjective second — the reverse of Thai. `too` is a complaint, `so` is feeling, `very` is neutral. → It is too expensive · It is so hot · It is very good
  - `This … is` → `This {thing} is {adj}` → {thing}นี้{adj} → thing: hotel, taxi (L3), coffee, beer, tea, rice, chicken, water (L2), food (L4), place, thing (L6); adj: same pool → `this` comes **before** the noun and `is` cannot be skipped: Thai โรงแรมนี้เก่า has neither order. → This hotel is old · This coffee is cold · This place is beautiful
  - `… is -er than …` → `{a} is {comparative} than {b}` → {a}{comparative}{b} → a / b: this, this one (L2), that, it (L3/L6), coffee, tea, beer (L2), Bangkok, Thailand (L4); comparative: better, cheaper, bigger (L6) → Thai says ถูกกว่า and stops; English needs `than` + the second thing. `good` has no `gooder`: use `better`. → This is cheaper than that · This one is better than that · Coffee is better than tea
- dialogues (2):
  - Choosing between two hotel rooms · Nam (reception) & Tom · `This one is big. That one is small, cheaper.` — question tests which one Tom takes and the reason (price, not size).
  - Market browsing with a foreign friend · Ploy & Sarah · `It is too expensive` / `This one is nice. Is it new?` — question tests why Sarah does not buy the first item.
- recycles: this, this one (L2) and it (L3) as subjects; very, so (L4) now in a pattern; good (L1), spicy (L2) in the adjective pool; hotel, taxi (L3) as nouns; `How much is {thing}` (L3) and `I like {thing}` (L4) reused in dialogue with `that`.

## Level 7 — Daily Life · ชีวิตประจำวัน
- icon: 🏙️
- subtitle (Thai, ≤ 60 chars): อยู่ที่ไหน ทำงานอะไร พูดอังกฤษได้/ไม่ได้ และ he/she ลงท้าย -s
- theme: Where you live, work and study, what you can and can't do in English, phones, movies and music — the questions a Thai adult gets from every foreign colleague or chat partner.
- grammar focus:
  - 3rd-person -s: Thai เขาชอบ = ฉันชอบ; English adds -s when the subject is he/she/it or one person (`she likes`, `he speaks`, `she has`). The -s forms are their own ids. Questions and negatives use `does / doesn't` and the verb drops the -s.
  - `can / can't`: Thai puts ได้ / ไม่ได้ at the end; English puts `can` before the base verb. Pronunciation contrast: `can` is weak /kən/, `can't` is strong /kænt/ with a released -t.
  - prepositions of place: `in` for a city or country (`in Bangkok`), `at` for a point (`at home`, `at work`); Thai ที่ covers both.
- canDo (Thai):
  - บอกได้ว่าอยู่ ทำงาน หรือเรียนที่ไหน และถามกลับได้
  - พูดถึงคนอื่นว่าเขาชอบอะไร พูดภาษาอะไร มีอะไร (likes / speaks / has)
  - บอกได้ว่าพูดอังกฤษได้นิดหน่อยหรือยังพูดไม่ได้ (can / can't)
  - ถามว่า he/she ทำ … ไหม ด้วย Does … ?
  - คุยเรื่องโทรศัพท์ หนัง และเพลงแบบง่ายๆ ได้
- items (22):
  - live — อาศัยอยู่ — คำกริยา — core-verb
  - work — ทำงาน / งาน — คำกริยา — core-verb (noun sense `at work` in notes)
  - study — เรียน — คำกริยา — core-verb
  - speak — พูด (ภาษา) — คำกริยา — core-verb
  - English — ภาษาอังกฤษ — คำนาม — language
  - learn — เรียนรู้ — คำกริยา — core-verb
  - in — ใน (เมือง ประเทศ) — คำบุพบท — prep
  - at — ที่ (จุดเฉพาะ: at home, at work) — คำบุพบท — prep
  - Chiang Mai — เชียงใหม่ — คำนาม — place
  - can't — ไม่ได้ (can + not) — คำช่วยกริยา — modal (phrase; altEn cannot)
  - does — (ทำคำถามกับ he/she/it) — คำช่วยกริยา — grammar
  - doesn't — ไม่ (ปฏิเสธกับ he/she/it) — คำช่วยกริยา — grammar (phrase; altEn does not)
  - likes — ชอบ (he/she/it) — คำกริยา (รูป -s) — 3sg
  - speaks — พูด (he/she/it) — คำกริยา (รูป -s) — 3sg
  - has — มี (he/she/it) — คำกริยา (รูป -s) — 3sg
  - phone — โทรศัพท์ — คำนาม — noun
  - call — โทร / เรียก — คำกริยา — core-verb
  - movie — หนัง — คำนาม — noun (altEn film)
  - music — เพลง / ดนตรี — คำนาม — noun
  - watch — ดู (หนัง ทีวี) — คำกริยา — core-verb
  - his — ของเขา (ผู้ชาย) — คำสรรพนาม — pronoun
  - her — ของเธอ / เธอ (กรรม) — คำสรรพนาม — pronoun
- patterns (3):
  - `I live in` → `I {verb} in {place}` → ฉัน{verb}ที่{place} → verb: live, work, study (L7); place: Bangkok, Thailand (L4), Chiang Mai (L7) → `in` goes before a city or country; Thai ที่ does the job of both `in` and `at`. Answer to `Where do you live?` → I live in Bangkok · I work in Chiang Mai · I study in Thailand
  - `She likes` → `{person} {verb-s} {thing}` → {person}{verb}{thing} → person: he, she, mom, dad (L4); verb-s: likes, speaks, has (L7); thing: coffee, tea, beer, chicken, rice (L2), food (L4), English (L7), Thai (L1), music (L7), it (L3), this (L2); `compat`: speaks → English / Thai only → One person who is not `I` or `you` makes the verb take -s; Thai never changes the verb. `has` is the -s form of `have`. → She likes coffee · He speaks English · Dad has it
  - `I can / can't` → `I {modal} {verb} {thing}` → ฉัน{verb}{thing}{ได้/ไม่ได้} → modal: can (L3), can't (L7); verb: speak, watch, call (L7), eat, drink (L2), see (L5); thing: English, Thai (L1/L7), chicken, beer, coffee (L2), it (L3), this (L2), music (L7); `compat`: speak → English / Thai → `can` sits before the base verb, never after; the negative is one word `can't`. Say the vowel: `can` short and weak, `can't` long and strong. → I can speak Thai · I can't speak English · I can't eat chicken
- dialogues (2):
  - Hotel staff and a regular guest · Nut & Mr. Lee · `Do you live in Bangkok?` / `My sister lives in Chiang Mai` / `Does she work?` — question tests where the sister lives, not where Nut lives.
  - Language-exchange chat · Fah & Jack · `Do you speak Thai?` / `I can speak Thai, not good` / `I can't speak English. I study English` / `Can we watch a movie?` — question tests what Fah says she **can't** do.
- recycles: `Do you {verb} {thing}` (L4) becomes `Does she …` in notes; Bangkok, Thailand, he, she, mom, dad (L4); can (L3) now paired with can't; coffee, beer, chicken (L2) as objects; `I am going to {verb}` (L5) in dialogue (`I am going to call`).

## Level 8 — Conversation Glue · คำเชื่อมบทสนทนา
- icon: 🧩
- subtitle (Thai, ≤ 60 chars): I think, why/because, but/or — ขอให้พูดช้าๆ อีกครั้ง ขอความช่วยเหลือ
- theme: The words that keep a conversation alive when you only half understand: opinions with `I think`, reasons with `why / because`, contrasts with `but / or`, and the repair kit — slowly, again, how do you say, can you help me.
- grammar focus:
  - `I think` + full clause: Thai คิดว่า…; English `I think it is …` with no connector needed. Softens any opinion.
  - `but / or / because / why`: clause connectors sit between two full clauses (`I like coffee but not tea`); `because` answers `why` and must be followed by subject + verb.
  - object pronoun `me` (Thai ฉัน serves both); request frame `Can you … me please` with `help / tell / teach / call`.
- canDo (Thai):
  - บอกความเห็นแบบนุ่มนวลด้วย I think …
  - บอกเหตุผลและถามเหตุผลด้วย why / because ได้
  - บอกว่าชอบอย่างหนึ่งแต่ไม่ชอบอีกอย่างด้วย but ได้
  - ขอให้พูดช้าลง พูดอีกครั้ง หรืออธิบายคำศัพท์ได้เมื่อไม่เข้าใจ
  - ขอความช่วยเหลืออย่างสุภาพด้วย Can you help me please
- items (22):
  - think — คิด — คำกริยา — core-verb
  - why — ทำไม — คำถาม — question
  - because — เพราะว่า — คำสันธาน — glue
  - but — แต่ — คำสันธาน — glue
  - or — หรือ — คำสันธาน — glue
  - again — อีกครั้ง — คำวิเศษณ์ — time
  - slowly — ช้าๆ — คำวิเศษณ์ — adverb (altEn slower)
  - understand — เข้าใจ — คำกริยา — core-verb
  - know — รู้ / รู้จัก — คำกริยา — core-verb
  - mean — หมายถึง / หมายความว่า — คำกริยา — core-verb
  - say — พูด / บอกว่า — คำกริยา — core-verb
  - how do you say — …พูดว่ายังไง (ในภาษาอังกฤษ) — วลี — repair (phrase)
  - maybe — อาจจะ / บางที — คำวิเศษณ์ — reaction
  - of course — แน่นอน / ได้สิ — วลี — reaction (phrase)
  - no problem — ไม่มีปัญหา / ไม่เป็นไร — วลี — reaction (phrase)
  - with — กับ / ด้วย — คำบุพบท — prep
  - me — ฉัน (กรรม) — คำสรรพนาม — pronoun
  - help — ช่วย — คำกริยา — core-verb
  - tell — บอก — คำกริยา — core-verb
  - talk — คุย — คำกริยา — core-verb
  - teach — สอน — คำกริยา — core-verb
  - a little — นิดหน่อย — วลี — quantity (phrase; `a little English`)
- patterns (3):
  - `I think it is` → `I think it is {adj}` → ฉันคิดว่ามัน{adj} → adj: good, okay (L1), spicy (L2), big, small, hot, cold, expensive, cheap, new, old, beautiful, nice, bad, easy, difficult (L6) → `I think` is followed by a complete clause with its own `is`; nothing like ว่า is needed. Use it to disagree politely. → I think it is expensive · I think it is good · I think it is difficult
  - `I like … but not …` → `I like {a} but not {b}` → ฉันชอบ{a}แต่ไม่ชอบ{b} → a / b: coffee, tea, beer, rice, chicken, sugar, ice (L2), music (L7), Bangkok, Thailand (L4), this, this one (L2), that (L6) → `but` sets two things against each other; after `but not` the verb is not repeated. → I like coffee but not tea · I like rice but not chicken · I like Thailand but not Bangkok
  - `Can you … me please` → `Can you {verb} me please` → ช่วย{verb}ฉันหน่อยได้ไหม → verb: help, tell, teach (L8), call (L7) → Request frame: `Can you` first, verb, then `me` (object form, not `I`), `please` last. Thai ช่วย…หน่อย has no modal. → Can you help me please · Can you call me please · Can you teach me please
- dialogues (2):
  - Counter, staff misses the request · Ploy & Jack · `Sorry, I don't understand. Again please, slowly.` / `Can you help me?` / `Of course` — question tests what Ploy asks Jack to do.
  - Learner asks about a word · Bank & Emma · `How do you say this in English?` / `What does it mean?` / `Why?` / `Because …` — question tests what Bank wants from Emma (a word, not directions).
- recycles: `I don't {verb}` (L4) as `I don't understand / I don't know`; can (L3) and speak, English (L7) in `Can you speak slowly please`; `It is {adj}` (L6) embedded under `I think`; like (L4); `a little` with `I can speak` (L7).

## Level 9 — Real Questions · ถามจริงจัง
- icon: ❓
- subtitle (Thai, ≤ 60 chars): who / when / how, มีกี่คน อายุเท่าไหร่ และ "ที่นี่มี…ไหม" (Is there…)
- theme: The remaining question words, counting people and things, ages, and existence with `there is / there are` — guesthouse check-in, colleague small talk, the questions tourists ask.
- grammar focus:
  - wh- question + do-support: `When do you work?`, `How many kids do you have?` — question word first, then `do`, then subject, then base verb. Thai keeps เมื่อไหร่ / กี่ at the end.
  - existence: Thai มี means both "have" and "there is"; English separates them — `I have a phone` vs `There is a toilet here`. Question flips `is`: `Is there …?` Plural `there are`.
  - plural -s recycled under `how many` (`How many sisters`); `some / any` (statement vs question/negative); `a lot of`; `for` (`a table for two`).
- canDo (Thai):
  - ถามว่าใคร เมื่อไหร่ อย่างไร และตอบคำถามเหล่านั้นแบบสั้นๆ
  - ถามและบอกจำนวนคนหรือของด้วย How many … do you have
  - ถามอายุและบอกอายุตัวเองได้ (How old … / … years old)
  - ถามว่าที่นี่มีห้องน้ำ มีไวไฟ มีแท็กซี่ไหม ด้วย Is there …
  - ตอบได้ว่ามี/ไม่มี ด้วย there is / there are / some / any
- items (23):
  - who — ใคร — คำถาม — question
  - when — เมื่อไหร่ — คำถาม — question (conjunction sense noted later, same id)
  - how — อย่างไร / ยังไง — คำถาม — question
  - how many — กี่ (จำนวนนับได้) — คำถาม — question (phrase)
  - how old — อายุเท่าไหร่ — คำถาม — question (phrase)
  - many — หลาย / มาก (นับได้) — คำวิเศษณ์ — quantity
  - some — บาง / สักหน่อย (ในประโยคบอกเล่า) — คำวิเศษณ์ — quantity
  - any — ใดๆ / บ้างไหม (ในคำถามและปฏิเสธ) — คำวิเศษณ์ — quantity
  - a lot — มาก / เยอะ — วลี — quantity (phrase; `a lot of` composes with `of`)
  - of — ของ / แห่ง — คำบุพบท — prep
  - for — สำหรับ / เพื่อ — คำบุพบท — prep
  - there — ที่นั่น / ตรงนั้น — คำวิเศษณ์ — place (`over there` composes at L13)
  - there is — มี… (อยู่) เอกพจน์ — วลี — grammar (phrase; altEn there's)
  - there are — มี… (อยู่) พหูพจน์ — วลี — grammar (phrase)
  - they — พวกเขา — คำสรรพนาม — pronoun
  - wifi — ไวไฟ — คำนาม — noun
  - problem — ปัญหา — คำนาม — noun
  - years — ปี (หลายปี; `… years old`) — คำนาม (พหูพจน์) — plural
  - kids — ลูกๆ / เด็กๆ — คำนาม (พหูพจน์) — plural (altEn children)
  - brothers — พี่ชาย/น้องชาย (หลายคน) — คำนาม (พหูพจน์) — plural
  - sisters — พี่สาว/น้องสาว (หลายคน) — คำนาม (พหูพจน์) — plural
  - friends — เพื่อนๆ — คำนาม (พหูพจน์) — plural
  - people — ผู้คน / คน (พหูพจน์ไม่ปกติ) — คำนาม (พหูพจน์) — plural
- patterns (3):
  - `How many … do you have` → `How many {plural} do you have` → คุณมี{plural}กี่คน/กี่อัน → plural: kids, brothers, sisters, friends (L9), beers, coffees, tickets (L3) → `how many` always takes the plural; the question then runs on `do you have`. Answer with a bare number or `I have two`. → How many kids do you have · How many sisters do you have · How many tickets do you have
  - `When do you` → `When do you {verb}` → คุณ{verb}เมื่อไหร่ → verb: work, study (L7), sleep, come (L5), eat, drink (L2) → Question word in front, then `do you`, then the base verb — the same machinery as `Do you …` (L4) with a wh- word on top. Answer with an L5 time word. → When do you work · When do you sleep · When do you eat
  - `Is there a … here` → `Is there a {thing} here` → ที่นี่มี{thing}ไหม → thing: toilet, hotel, taxi (L3), phone (L7), problem (L9) (ATM is excluded: it needs `an`) → Existence, not possession: Thai มี but English `there is`, flipped to `Is there` for the question. `wifi` and other mass nouns drop the `a` (dialogue only). → Is there a toilet here · Is there a taxi here · Is there a problem here
- dialogues (2):
  - Guesthouse check-in · Fah (host) & Tom · `How many people?` / `Is there wifi here?` / `Is there an ATM here?` / `No, there is an ATM at the hotel` — question tests **where** the ATM is.
  - Colleagues on a break · Nut & Sarah · `How many kids do you have?` / `Two` / `How old are they?` / `Ten and seven` — question tests the ages, i.e. which number answers which question.
- recycles: `Do you {verb} {thing}` (L4) now under a wh- word; numbers (L3) as answers; old (L6) inside `how old`; toilet, hotel, ATM, taxi (L3); work, study (L7); beers, coffees, tickets (L3) in the `how many` pool; `a lot` + `of` + people composes `a lot of people`.

## Level 10 — Sounding Human · พูดให้เป็นธรรมชาติ
- icon: 🗣️
- subtitle (Thai, ≤ 60 chars): Really? Sure! No way — ตอบรับ โยนคำถามกลับ และคำพูดติดปากแบบเจ้าของภาษา
- theme: Reactions, fillers and bounce-backs: what native speakers say between the sentences. Short items, high frequency, almost all usable as a whole turn.
- grammar focus:
  - reaction frame `That's {adj}` / `Sounds {adj}`: Thai says ดีจัง with no subject or verb; English keeps `that is` (spoken `that's`), and `sounds` is one of the rare subject-less sentences — the -s stays.
  - `What about {thing}` to bounce or propose (Thai แล้ว…ล่ะ); `and you?` as the two-word version.
  - register: `yeah / sure / cool / kind of / I guess` are casual; `of course / you're welcome` (L8/L10) are the polite set. Notes mark each.
- canDo (Thai):
  - ตอบรับแบบธรรมชาติด้วย Really? / Sure / No way / Cool เมื่อฟังอีกฝ่าย
  - โยนคำถามกลับด้วย And you? / What about you?
  - บอกว่าเห็นด้วยหรือเฉยๆ ด้วย Me too / Kind of / I guess
  - ประเมินข้อเสนอด้วย Sounds good / That's great
  - ใช้คำพูดติดปาก well / actually / you know / I mean ให้ถูกจังหวะ
- items (21):
  - really — จริงๆ / จริงเหรอ — คำวิเศษณ์ — reaction (adverb and `Really?` reaction, one id)
  - yeah — ใช่ / อืม (ไม่เป็นทางการ) — คำตอบรับ — reaction
  - sure — ได้เลย / แน่นอน — คำตอบรับ — reaction
  - well — เอ่อ / คือว่า (คำขึ้นต้น) — คำวิเศษณ์ — filler
  - actually — จริงๆ แล้ว — คำวิเศษณ์ — filler
  - about — เกี่ยวกับ — คำบุพบท — prep
  - all — ทั้งหมด — คำวิเศษณ์ — quantity (`that's all` composes)
  - no way — ไม่มีทาง / ไม่จริงน่า — วลี — reaction (phrase)
  - great — เยี่ยม — คำคุณศัพท์ — adj
  - cool — เจ๋ง / โอเคเลย — คำคุณศัพท์ — adj
  - fun — สนุก — คำคุณศัพท์ — adj
  - right — ถูกต้อง / ใช่ไหม (ท้ายประโยค) — คำคุณศัพท์ — reaction
  - and you — แล้วคุณล่ะ — วลี — reaction (phrase)
  - me too — ฉันก็เหมือนกัน — วลี — reaction (phrase)
  - kind of — ก็…นิดหน่อย / ประมาณนั้น — วลี — reaction (phrase; altEn kinda)
  - I guess — คงจะ / ก็คงงั้น — วลี — reaction (phrase)
  - I mean — คือว่า / หมายถึง — วลี — filler (phrase)
  - you know — คือ… / รู้ไหม (คำแทรก) — วลี — filler (phrase)
  - I see — อ๋อ เข้าใจแล้ว — วลี — reaction (phrase)
  - sounds — ฟังดู (it sounds …) — คำกริยา (รูป -s) — 3sg
  - you're welcome — ไม่เป็นไร / ด้วยความยินดี (ตอบขอบคุณ) — วลี — polite (phrase)
- patterns (3):
  - `That is …` → `That is {adj}` → นั่น{adj} / {adj}จัง → adj: great, cool, fun (L10), nice, bad, beautiful, expensive, cheap, big, difficult, easy, new, old (L6), good, okay (L1), spicy (L2) → The reaction sentence Thai says without any subject; English keeps `that is`, spoken as `that's`. → That is great · That is cool · That is expensive
  - `What about …` → `What about {thing}` → แล้ว{thing}ล่ะ → thing: you (L1), tomorrow, tonight, today, later (L5), coffee, tea, beer (L2), this, this one (L2), that (L6), music (L7), Bangkok (L4) → One frame that bounces the question back (`What about you`) or proposes (`What about tomorrow`); no verb at all. → What about you · What about tomorrow · What about this one
  - `Sounds …` → `Sounds {adj}` → ฟังดู{adj} → adj: good, okay (L1), great, cool, fun (L10), nice, bad, expensive, difficult, easy (L6) → `It` is dropped in casual speech but the -s of `sounds` is not. Reply to any plan or price. → Sounds good · Sounds fun · Sounds expensive
- dialogues (2):
  - Two friends settling dinner · Nam & Anna · `Can we eat tonight?` / `Sure! What about Thai food?` / `Sounds good` / `And you?` — question tests what they agree to eat, not whether they meet.
  - Bar chat with a customer · Tee & Jack · `I live in Bangkok` / `Really? Me too!` / `Do you like it?` / `Kind of. It is so hot` / `Yeah, I know` — question tests Jack's attitude to Bangkok (lukewarm, because of the heat).
- recycles: `Can we {verb} {time}` (L5), `I live in {place}` (L7), `It is {degree} {adj}` (L6) and `I think it is {adj}` (L8) in dialogue; hot, nice, expensive (L6) in pools; know (L8) in `I know`; you (L1) as the `What about you` fill.

## Level 11 — Must, Might & Have Done · ต้อง อาจจะ เคย
- icon: 🧭
- subtitle (Thai, ≤ 60 chars): have to, might / probably, Have you ever …?, กำลังทำ (-ing) และ if
- theme: Obligation, possibility, experience and "right now": `I have to work`, `It might rain`, `Have you ever tried durian?`, `I am eating`. The three structures Thai expresses with ต้อง / อาจจะ / เคย / กำลัง and English expresses with verb forms.
- grammar focus:
  - `have to` + base verb (chunk, `gotta` in fast speech) vs `must` (stronger, rules); Thai ต้อง covers both. `be` appears after a modal (`It might be expensive`).
  - present perfect for experience: `Have you ever` + past participle (`tried / eaten / seen / been to`); Thai เคย + verb, no verb change. Participles are their own ids; `yet / still / already` ride on this frame (`not yet`).
  - present continuous: Thai กำลัง + verb; English `am / are / is` + verb-ing. The -ing forms are their own ids. `What are you doing?` and `Where are you going?` compose from items.
  - `if … then` as words only (`If you want, …`); full conditional frames are L33–34.
- canDo (Thai):
  - บอกได้ว่าต้องทำอะไร และปฏิเสธนัดเพราะต้องทำงาน
  - บอกความเป็นไปได้ด้วย might / probably / maybe
  - ถามว่าเคยลอง เคยกิน เคยไป … ไหม และตอบว่าเคย/ยังไม่เคย
  - บอกว่ากำลังทำอะไรอยู่ตอนนี้ และถาม What are you doing?
  - ใช้ still / yet / already บอกว่ายังทำอยู่ ยังไม่ทำ หรือทำแล้ว
- items (21):
  - have to — ต้อง (+กริยา) — คำช่วยกริยา — modal (phrase; altEn gotta)
  - must — ต้อง (เข้ม / กฎ) — คำช่วยกริยา — modal
  - might — อาจจะ — คำช่วยกริยา — modal
  - probably — น่าจะ / คงจะ — คำวิเศษณ์ — adverb
  - be — เป็น / อยู่ (รูปฐาน หลัง modal) — คำกริยา — grammar
  - ever — เคย (ในคำถาม) — คำวิเศษณ์ — adverb
  - tried — ลอง (เคยลอง; รูป participle) — คำกริยา (รูป pp) — pp
  - eaten — กิน (เคยกิน; รูป participle) — คำกริยา (รูป pp) — pp
  - seen — เห็น / ดู (เคยเห็น; รูป participle) — คำกริยา (รูป pp) — pp
  - been to — เคยไป (ที่) — วลี — pp (phrase; word `been` is L28)
  - durian — ทุเรียน — คำนาม — food
  - if — ถ้า — คำสันธาน — glue
  - then — แล้วก็ / งั้น — คำวิเศษณ์ — glue
  - doing — กำลังทำ — คำกริยา (รูป -ing) — ing
  - going — กำลังไป — คำกริยา (รูป -ing) — ing
  - eating — กำลังกิน — คำกริยา (รูป -ing) — ing
  - working — กำลังทำงาน — คำกริยา (รูป -ing) — ing
  - sleeping — กำลังนอน — คำกริยา (รูป -ing) — ing
  - waiting — กำลังรอ — คำกริยา (รูป -ing) — ing (base `wait` is L14)
  - yet — ยัง (ในคำถาม/ปฏิเสธ) — คำวิเศษณ์ — time
  - still — ยังคง / ยัง…อยู่ — คำวิเศษณ์ — time
- patterns (3):
  - `I have to` → `I have to {verb} {time}` → ฉันต้อง{verb}{time} → verb: work, study, call (L7), go, come, sleep (L5), eat (L2); time: today, tomorrow, now, later, tonight (L5) → `have to` is one chunk followed by the base verb; Thai ต้อง does the same job with no `to`. The classic excuse: `Sorry, I have to work`. → I have to work tomorrow · I have to go now · I have to sleep
  - `Have you ever` → `Have you ever {pp} {thing}` → คุณเคย{pp}{thing}ไหม → pp: tried, eaten, seen, been to (L11); thing: durian (L11), chicken, rice (L2), it, this (L2/L3), that (L6), Bangkok, Thailand (L4), Chiang Mai (L7); `compat`: been to → places only, eaten / tried → foods, seen → it / this / that → Thai เคย + the plain verb; English changes the verb to its participle after `have`. Answer `Yes, I have` / `No, not yet` / `No, never` (L18). → Have you ever tried durian · Have you ever been to Chiang Mai · Have you ever seen it
  - `I am -ing` → `I am {verb-ing} {time}` → ฉันกำลัง{verb}{time} → verb-ing: eating, working, sleeping, waiting (L11); time: now, today, tonight, later (L5) → Thai กำลัง + verb; English needs both `am` and the -ing ending. `now` is the natural partner; `later / tonight` make it an arrangement. → I am eating now · I am working today · I am waiting now
- dialogues (2):
  - Declining a dinner invite · Fah & Sarah · `Can we eat tonight?` / `Sorry, I can't. I have to work` / `What are you doing now?` / `Still working. Maybe tomorrow?` — question tests **why** Fah cannot come.
  - Fruit stall with a foreign friend · Nut & Emma · `Have you ever tried durian?` / `No, not yet` / `You must try it. You might like it` — question tests whether Emma has tried durian before (no) and what Nut suggests.
- recycles: `Can we {verb} {time}` (L5), can't (L7), work (L7), not yet / already (L5) as answers; what, are, you (L1–2) + doing compose `What are you doing`; where (L3) + going compose `Where are you going`; like (L4) after `might`; `I think` (L8) + probably in dialogue.

## Level 12 — Days & Dates · วันและวันที่
- icon: 📅
- subtitle (Thai, ≤ 60 chars): วันจันทร์–อาทิตย์ สัปดาห์หน้า เสาร์ที่แล้ว วันเกิด — นัดวันให้ชัด
- theme: Days of the week, next / last, parts of the day, ordinals for dates, and the appointment talk that goes with them — the A1 waypoint: a Thai adult can now fix a day, a time of day and a reason.
- grammar focus:
  - `on` + day (`on Monday`), `in` (L7) + part of day (`in the afternoon`), `at` (L7) + `night`; Thai uses วัน / ตอน with no preposition. Capital letters on day names.
  - `next / last` + week / month / year / day name with **no** preposition (`next week`, `last Friday`), contrasted with `on`.
  - present continuous for arranged future (`What are you doing on Saturday?`), recycled from L11; ordinals `first / second / third` for dates (`on the first`), the rest are -th and compose with L3 numbers.
- canDo (Thai):
  - พูดชื่อวันทั้งเจ็ดและถามว่าวันนี้วันอะไรได้
  - นัดหมายโดยระบุวันและช่วงเวลา (Saturday afternoon) ได้
  - บอกได้ว่าว่างหรือไม่ว่างวันไหน และทำงานวันไหน
  - พูดถึงสัปดาห์หน้า เดือนที่แล้ว ปีหน้า ด้วย next / last
  - ถามและบอกวันเกิดหรือวันหยุด และปิดท้ายด้วย See you Monday
- items (24):
  - Monday — วันจันทร์ — คำนาม — day
  - Tuesday — วันอังคาร — คำนาม — day
  - Wednesday — วันพุธ — คำนาม — day (note: silent first d)
  - Thursday — วันพฤหัสบดี — คำนาม — day
  - Friday — วันศุกร์ — คำนาม — day
  - Saturday — วันเสาร์ — คำนาม — day
  - Sunday — วันอาทิตย์ — คำนาม — day
  - day — วัน — คำนาม — time (`what day is it` composes)
  - week — สัปดาห์ — คำนาม — time
  - weekend — สุดสัปดาห์ — คำนาม — time
  - month — เดือน — คำนาม — time
  - year — ปี — คำนาม — time (plural `years` is L9)
  - next — หน้า / ถัดไป (next week) — คำคุณศัพท์ — time
  - last — ที่แล้ว (last week) — คำคุณศัพท์ — time
  - on — ใน (วัน: on Monday) — คำบุพบท — prep (place sense recycled L27)
  - afternoon — ตอนบ่าย — คำนาม — time
  - evening — ตอนเย็น — คำนาม — time
  - night — กลางคืน / ตอนกลางคืน — คำนาม — time
  - first — ที่หนึ่ง / วันที่ 1 — คำคุณศัพท์ (ลำดับ) — ordinal
  - second — ที่สอง / วันที่ 2 — คำคุณศัพท์ (ลำดับ) — ordinal
  - third — ที่สาม / วันที่ 3 — คำคุณศัพท์ (ลำดับ) — ordinal
  - birthday — วันเกิด — คำนาม — event
  - holiday — วันหยุด — คำนาม — event (altEn vacation)
  - day off — วันหยุดงาน — วลี — event (phrase)
- patterns (3):
  - `What are you doing on` → `What are you doing on {day}` → คุณจะทำอะไรวัน{day} → day: Monday … Sunday (L12) → The L11 -ing frame pointed at the future: a day name after `on` makes it an arrangement. Thai วันเสาร์ needs no `on`. → What are you doing on Saturday · What are you doing on Friday · What are you doing on Sunday
  - `I am … on` → `I am {state} on {day}` → ฉัน{state}วัน{day} → state: free, busy, home (L5), working (L11); day: Monday … Sunday (L12) → `am` + adjective or -ing, then `on` + day; the reply to the first frame. → I am busy on Monday · I am free on Saturday · I am working on Sunday
  - `See you …` → `See you {time}` → แล้วเจอกัน{time} → time: tomorrow, tonight, later (L5), Monday … Sunday (L12) → `see you` + a time with no preposition in casual speech (`See you Monday`); `See you next week` composes from items. → See you tomorrow · See you Monday · See you later
- dialogues (2):
  - Booking a lesson · Bank & Mr. Lee · `What are you doing on Friday?` / `I am working on Friday. Saturday?` / `I am free on Saturday afternoon` / `See you Saturday` — question tests the day **and** part of day they settle on.
  - Birthday plans · Ploy & Anna · `When is your birthday?` / `Next week, on Thursday` / `Are you free on Thursday night?` / `Sounds fun` — question tests when Anna's birthday is, distinguishing `next week` from `this week`.
- recycles: `Are you free {time}` (L5) extended with `on {day}`; free, busy, home, see you (L5); doing, working (L11); when (L9) in `When is your birthday`; `Sounds {adj}` (L10) as the closing reaction; numbers (L3) with first / second / third for dates in notes.

## Hand-off to parts 2–3

- Lexicon after L12: **288 items** (L1 22 · L2 25 · L3 43 · L4 21 · L5 22 · L6 22 · L7 22 · L8 22 · L9 23 · L10 21 · L11 21 · L12 24), 35 patterns, 27 dialogues. Ids are permanent; never re-mint `like`, `that`, `her`, `work`, `really`, `too`, `so` — split a new sense with a suffixed id (`so-conj`, `get-become`) only if the allocation table names it.
- Allocation-table forms still owed, by level: **13** near, next to, behind, in front of, around, get · **14** how long, phrasal verbs (get on/off, pick up) · **15** should, need to · **16** which, these, those, by, may · **18** every, never, always, usually, often, sometimes · **19** another, would, enough · **20** us, let's, so-conj, after, before, also · **21** was, were, did, had, didn't, yesterday, ago + first past ids (went, came, saw, ate, had, did, got, made, took, said, told, bought, thought, knew) · **22** him, them, quite, superlatives (best, most + adj) · **23** mine, yours, nothing, nobody, isn't, aren't, other, something / anything / everything / someone / anyone · **24** thousand, million, half, hour, minute, o'clock, months January–December · **25** none, each, both, much, few, little, less, most, only · **26** could, tag questions, reported speech lite, `would you mind` · **27** its, whose, between, under, over, through, on (place) · **28** done, been, just, soon · **30** myself, yourself, during, used to · **31** our, their · **33** being, while, although, though, unless · **34** won't, until.
- Top-1,000 verbs not yet placed (suggested homes): get, find, turn, walk, show (13) · take, wait, leave, stop, drive, ticket (14) · feel, hurt, rest (15) · buy, pay, look, try, give, wear (16) · use, read, write, send, start, finish, ask (17) · play, listen, stay, run, cook (18) · make, bring, order, taste (19) · let, remember, forget, hope, wish, hear (20–22) · put, open, close, keep, sit, stand (27) · sell, change (29) · move, grow, become (30) · marry, born (31) · rain, break, hurt (35). Nouns: car, house, room, money, job, boss, school, doctor, man / woman / boy / girl, son / daughter, husband / wife, party, table — place them where the theme needs them.
- Inflected ids are expected, not exceptional: plural (`days`, `hours`, `things`, `times`, `words`), 3sg (`works`, `lives`, `goes`, `does`), -ing (`looking`, `talking`, `trying`, `thinking`, `getting`), past (list above), participles (`gone`, `done`, `been`, `bought`). Tag them `plural` / `3sg` / `ing` / `past` / `pp`.
- Frames built here that later levels should extend rather than replace: `Can I have {thing} please` → `Could I have …` (26) · `Is there a {thing} here` → `Is there a {place} near here` (13) · `How much is {thing}` → `How much are {plural}` (25) · `I {can/can't} {verb} {thing}` → `I {should/need to} {verb}` (15) · `Have you ever {pp} {thing}` → `I have never {pp}` (18) and `I have just {pp}` (28) · `I am going to {verb} {time}` → `I am about to {verb}` (28) · `{a} is {comp} than {b}` → `{a} is the {superlative}` (22) · `I think it is {adj}` → `I think that {clause}` (20/22) · `Do you {verb} {thing}` → `Did you {verb} {thing}` (21) · `When do you {verb}` → `What time do you {verb}` (24) · `What about {thing}` → `How about {verb-ing}` (20) · `See you {time}` → `See you at {clock}` (24).
- Every dialogue keeps one Thai speaker from the cast; from L13 the Thai speaker should sometimes be the one who knows less (asking directions, at the pharmacy abroad) so the comprehension question can test the foreigner's answer.
