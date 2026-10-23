import { useMemo } from 'react'
import { useApp, SCRIPT_GATES, SCRIPT_GATE_STAGE } from '../core/store'
import { CURRICULUM, ITEMS, PATTERNS, LISTENING, SCRIPT_LESSONS } from '../data'
import { SRS_STAGE_NAMES, SRS_INTERVALS_H } from '../core/types'
import { stageColor } from '../core/srs'
import '../styles/about.css'

// About — how the app works, why it works, and what it's aiming at.
// Every number on this page is computed from the live curriculum, so the
// page can never drift out of date as content is added.

/** Human-friendly interval label in Thai, e.g. 4 ชม. / 2 วัน / 14 วัน / 4 เดือน.
 *  Anything under a month is given in days: "สัปดาห์" is too wide for a
 *  ladder rung on a 360px phone, and 14 วัน reads just as naturally. */
function intervalLabel(hours: number): string {
  if (!Number.isFinite(hours)) return 'พ้นทบทวน'
  if (hours < 24) return `${hours} ชม.`
  const d = hours / 24
  if (d < 30) return `${d} วัน`
  if (d < 365) return `${Math.round(d / 30)} เดือน`
  return `${Math.round(d / 365)} ปี`
}

export default function About(): JSX.Element {
  const go = useApp(s => s.go)

  const stats = useMemo(() => {
    const items = Object.values(ITEMS)
    const patterns = Object.values(PATTERNS)
    // Every sentence the Builder can generate, counted the way the engine does.
    let sentences = 0
    for (const p of patterns) {
      const walk = (i: number, prev: string): number => {
        if (i === p.slots.length) return 1
        const slot = p.slots[i]
        const allowed = prev && p.compat?.[prev]
          ? slot.itemIds.filter(id => p.compat![prev].includes(id))
          : slot.itemIds
        let n = slot.optional ? walk(i + 1, prev) : 0
        for (const id of allowed) n += walk(i + 1, id)
        return n
      }
      sentences += walk(0, '')
    }
    return {
      words: items.length,
      patterns: patterns.length,
      levels: CURRICULUM.length,
      sentences,
      dialogues: LISTENING.length,
      scriptLessons: SCRIPT_LESSONS.length,
      scriptChars: SCRIPT_LESSONS.reduce((a, l) => a + l.chars.length, 0),
    }
  }, [])

  // Minimum real time to reach the unlock gate: sum of the first four intervals.
  const gateDays = useMemo(
    () => Math.round((SRS_INTERVALS_H.slice(0, 4).reduce((a, h) => a + h, 0) / 24) * 10) / 10,
    [],
  )

  const gateLevels = Object.keys(SCRIPT_GATES).map(Number).sort((a, b) => a - b)
  const gateList = Object.entries(SCRIPT_GATES)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([lv, n]) => `${n} ตัวก่อนระดับ ${lv}`)
    .join(', ')

  return (
    <div className="col page-narrow about" style={{ gap: 22 }}>
      <div className="browse-head">
        <div className="h1">💡 ChaiEnglish ทำงานยังไง</div>
        <div className="browse-sub">
          ระบบเรียนภาษาอังกฤษที่เอาความจำมาก่อนความเร็ว — เพื่อพูดได้จริงในชีวิตประจำวัน
          และเหตุผลเบื้องหลังทุกการออกแบบในนี้
        </div>
      </div>

      {/* Live inventory */}
      <div className="about-stats">
        {[
          [stats.words, 'คำศัพท์และวลี'],
          [stats.patterns, 'แพตเทิร์นประโยค'],
          [stats.sentences.toLocaleString(), 'ประโยคที่สร้างได้'],
          [stats.levels, 'ระดับ'],
          [stats.dialogues, 'บทสนทนา'],
          [stats.scriptChars, 'เสียง/ตัวอักษร'],
        ].map(([n, label]) => (
          <div key={String(label)} className="about-stat">
            <span className="n">{n}</span>
            <span className="l">{label}</span>
          </div>
        ))}
      </div>

      {/* The core idea */}
      <section className="card card-pad about-sec">
        <h2 className="h2">แนวคิดหลัก</h2>
        <p>
          แอปส่วนใหญ่พาคุณเดินหน้า แอปนี้สร้างมาเพื่อไม่ให้คุณถอยหลัง
          มันไม่ใช่แอปเรียนวันละบท แต่เป็น <b>ระบบกันลืม</b> — นึกถึง WaniKani
          สำหรับภาษาอังกฤษที่ใช้พูดจริง: ทุกอย่างที่คุณเรียนจะวนกลับมาตามตาราง
          จนกว่าจะเป็นของคุณจริงๆ
        </p>
        <p>
          แนวคิดที่สองสำคัญไม่แพ้กัน แทนที่จะท่องประโยคสำเร็จรูปเป็นคลัง คุณเรียน
          {' '}<b>แพตเทิร์น</b> — และแพตเทิร์นเอาไปผสมต่อได้ เรียน
          {' '}<span className="en">I want to ___</span> บวกกริยา 5 คำ กับคำนาม 5 คำ
          คุณไม่ได้ประโยคเดียว แต่ได้เป็นสิบ นี่คือเหตุผลที่คำศัพท์ {stats.words} คำ
          กับแพตเทิร์น {stats.patterns} แบบ สร้างได้ถึง <b>{stats.sentences.toLocaleString()} ประโยค</b>
          {' '}ในหน้าสร้างประโยค — ส่วนใหญ่คุณไม่เคยเห็นมาก่อน
        </p>
      </section>

      {/* Progression */}
      <section className="card card-pad about-sec">
        <h2 className="h2">การปลดล็อกระดับ</h2>
        <p>
          ระดับปลดล็อกด้วย <b>ความจำที่พิสูจน์แล้ว ไม่ใช่การเรียนจบ</b> คุณกดผ่านบทเรียนเร็วๆ
          ให้จบระดับไม่ได้
        </p>
        <div className="gate-rule">
          <span className="badge">เงื่อนไข</span>
          <span>
            <b>80%</b> ของคำและแพตเทิร์นในระดับต้องถึงขั้น{' '}
            <b style={{ color: stageColor(4) }}>{SRS_STAGE_NAMES[4]}</b> ระดับถัดไปจึงจะเปิด
          </span>
        </div>
        <p>
          การไปถึงขั้น{SRS_STAGE_NAMES[4]}ต้องตอบถูก <i>แบบเว้นระยะ</i> 4 ครั้ง
          ({SRS_INTERVALS_H.slice(0, 4).map(h => intervalLabel(h)).join(' → ')}) หนึ่งระดับจึงใช้เวลาจริง
          อย่างน้อย <b>~{gateDays} วัน</b> ไม่ว่าคุณจะขยันแค่ไหน การบังคับเว้นระยะไม่ใช่อุปสรรค —
          มันคือกลไกทั้งหมดที่ทำให้คำติดอยู่ในหัว
        </p>
        <div className="gate-rule">
          <span className="badge">ด่านการอ่าน</span>
          <span>
            ที่ระดับ {gateLevels.join(', ')} เส้นทางยังขอให้คุณอ่านตัวอักษรอังกฤษได้จริงด้วย —{' '}
            {gateList} ที่ขั้น{' '}
            <b style={{ color: stageColor(SCRIPT_GATE_STAGE as never) }}>
              {SRS_STAGE_NAMES[SCRIPT_GATE_STAGE]}
            </b>{' '}ขึ้นไป
          </span>
        </div>
        <p>
          สี่ระดับแรกพูดได้เต็มที่โดยไม่ต้องอ่าน — เป้าหมายคือพูดสิ่งที่ใช้ได้จริงตั้งแต่สัปดาห์แรก
          ตัวอักษรไม่ควรขวางทางนั้น แต่คำอ่านไทยเป็นไม้ค้ำที่ยิ่งพิงนานยิ่งหนัก — มันบอกเสียง
          {' '}<span className="en">th</span>, <span className="en">v</span>, ตัวสะกด และการเน้นไม่ได้
          และมันล็อกคุณไว้นอกเมนู ป้าย และข้อความจริง ตั้งแต่ระดับ 5 เส้นทางจึงแวะเช็กเป็นระยะ
          ด่านนับ <i>ตัวอักษรที่คุณจำได้</i> ไม่ใช่ตัวที่เคยแตะครั้งเดียว — ตัวอักษรจะนับก็ต่อเมื่อ
          รอดการทบทวนแบบเว้นระยะมาถึงขั้น{SRS_STAGE_NAMES[SCRIPT_GATE_STAGE]}แล้ว
        </p>
        <ul className="about-list">
          <li><b>ตัวอักษรทบทวนเหมือนทุกอย่าง</b> ทุกเสียง-ตัวอักษรที่คุณเจอจะเข้ากองทบทวนเดียวกับคำศัพท์ และกลับมาในรอบทบทวนเดียวกัน — โชว์ตัวอักษรให้บอกเสียง และโชว์เสียงให้เลือกตัวอักษร</li>
          <li><b>ไม่มีอะไรล็อกกลับ</b> ถ้าขาดทบทวนไป ระดับที่เคยเปิดแล้วก็ยังเปิดอยู่</li>
          <li><b>การฝึกปั่นความคืบหน้าไม่ได้</b> หน้าสร้างประโยคและการตอบซ้ำในรอบเดียวกันบันทึกสถิติ แต่ไม่เลื่อนตาราง — มีแค่การนึกออกแบบเว้นระยะจริงๆ เท่านั้นที่เลื่อนได้</li>
          <li><b>ตอบผิดมีราคา</b> คำที่ตอบผิดจะร่วงลงบันได (ยิ่งขั้นสูงยิ่งร่วงไกล) และกลับมาอีกครั้งในรอบเดียวกัน</li>
        </ul>
      </section>

      {/* SRS ladder */}
      <section className="card card-pad about-sec">
        <h2 className="h2">บันไดความจำ</h2>
        <p>
          ทุกคำ วลี และแพตเทิร์นปีนบันไดของตัวเอง แต่ละขั้นรอนานกว่าขั้นก่อน —
          ช่องว่างระหว่างขั้นคือตอนที่สมองทำงานจำ
        </p>
        <div className="ladder">
          {SRS_STAGE_NAMES.map((name, i) => (
            <div key={name} className="rung" style={{ borderColor: `${stageColor(i as never)}66` }}>
              <span className="dot" style={{ background: stageColor(i as never) }} />
              <span className="nm" style={{ color: stageColor(i as never) }}>{name}</span>
              <span className="iv">{intervalLabel(SRS_INTERVALS_H[i])}</span>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ fontWeight: 700 }}>
          คำที่รอดช่วงสี่เดือนได้จะ <b>{SRS_STAGE_NAMES[9]}</b> — พ้นจากการทบทวน ถือว่าจำได้ถาวร
        </p>
      </section>

      {/* The five modes */}
      <section className="card card-pad about-sec">
        <h2 className="h2">5 วิธีฝึก</h2>
        <div className="modes">
          {[
            ['🏠', 'บทเรียน', 'พบคำและแพตเทิร์นใหม่ พร้อมโน้ตอธิบายว่าทำไมภาษาอังกฤษถึงพูดแบบนั้น — และมีคำถามสั้นๆ แทรกให้คุณนึกออกเอง ไม่ใช่แค่อ่านผ่าน'],
            ['🔁', 'ทบทวน', 'กระดูกสันหลังของแอป ความหมาย คำอ่าน ฟัง พิมพ์ — แพตเทิร์นให้เรียงประโยคจากคำ ตัวอักษรให้อ่านออกเสียงทั้งสองทาง ทั้งจำได้และพูดได้ ตามตาราง'],
            ['🧱', 'สร้างประโยค', 'คุณได้ความหมาย แล้วต้องเรียงภาษาอังกฤษเอง ประโยคสุ่มใหม่ทุกครั้ง คุณจึงได้พูดประโยคที่ไม่มีใครเขียนไว้ให้'],
            ['🎧', 'ห้องฟัง', `${stats.dialogues} บทสนทนาที่สร้างจากคำที่คุณรู้แล้ว คำถามถามว่าเกิดอะไรขึ้น ไม่ใช่ให้แปลทีละคำ`],
            ['🔤', 'อ่านอังกฤษ', `${stats.scriptLessons} บทเรียน ${stats.scriptChars} เสียง-ตัวอักษร สระ พยัญชนะ เสียงที่ไทยไม่มี ทีมตัวอักษร และ magic e — ทุกแบบฝึกอ่านได้ด้วยเสียงที่สอนไปแล้วเท่านั้น และทุกตัวอักษรอยู่ในระบบทบทวนเดียวกับคำศัพท์`],
          ].map(([icon, title, body]) => (
            <div key={title} className="mode">
              <span className="ic" aria-hidden>{icon}</span>
              <div>
                <div className="t">{title}</div>
                <div className="b">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why it works */}
      <section className="card card-pad about-sec">
        <h2 className="h2">ทำไมวิธีนี้ได้ผล</h2>
        <ul className="about-list reasons">
          <li>
            <b>เว้นระยะชนะการท่องรวด</b> การทบทวนก่อนจะลืมพอดีคือเทคนิคที่งานวิจัยด้านความจำ
            ยืนยันซ้ำแล้วซ้ำเล่าว่าได้ผลที่สุด ตารางที่ขยายขึ้นเรื่อยๆ ด้านบนสร้างบนหลักนี้โดยตรง
          </li>
          <li>
            <b>นึกออกเอง ไม่ใช่แค่จำหน้าได้</b> การเห็นคำตอบให้ความรู้สึกเหมือนได้เรียน
            การผลิตคำตอบเองต่างหากคือการเรียน ขั้นหลังๆ จึงตัดตัวเลือกทิ้ง ให้คุณพิมพ์และเรียงเอง
          </li>
          <li>
            <b>เรียงตามความถี่</b> คำถูกสอนตามที่มันโผล่จริงในชีวิตและผสมกับคำอื่นได้ดีแค่ไหน —
            ไม่ใช่ตามตัวอักษรหรือตามบทในตำรา สัปดาห์แรกก็พูดสิ่งที่ใช้ได้แล้ว
          </li>
          <li>
            <b>ใช้ซ้ำแบบทบต้น</b> แพตเทิร์นใหม่ทุกแบบรับคำเก่าเข้าช่อง ของเก่าจึงได้ออกกำลังต่อ
            ขณะที่ของใหม่ขยายสิ่งที่คุณพูดได้
          </li>
          <li>
            <b>สร้างเองได้ ไม่ใช่ท่องจำ</b> เข้าใจว่า<i>ทำไม</i>ประโยคถึงใช้ได้ คุณก็สร้างต่อได้อีกเป็นพัน
            ประโยคที่ท่องเอาไปต่อไม่ได้ แพตเทิร์นเอาไปต่อได้
          </li>
          <li>
            <b>เสียงจริง สำเนียงจริง</b> เสียงเจ้าของภาษาทุกคำทุกประโยค และคำศัพท์แบบที่คนพูดกันจริง —
            ไม่ใช่ภาษาตำรา
          </li>
        </ul>
      </section>

      {/* Honest scope */}
      <section className="card card-pad about-sec scope">
        <h2 className="h2">ได้อะไรจริงๆ — พูดตรงๆ</h2>
        <p>
          เป้าหมายคือ <b>A1 แน่นๆ กำลังเข้า A2</b> ตามเกณฑ์ CEFR: พูดอังกฤษในชีวิตประจำวันได้สบาย
          ด้นสดได้ ไม่ใช่อังกฤษวิชาการ
        </p>
        <p>
          เรียนครบทั้งหมดแล้ว คุณควรรับมือได้กับการสั่งอาหารและขอปรับเมนู ต่อราคาในตลาด
          เรียกแท็กซี่และบอกทาง นัดหมายวันเวลา คุยเรื่องงานและงานอดิเรก บอกอาการป่วยที่ร้านยา
          ให้ความเห็นพร้อมเหตุผล และเล่าว่าเมื่อวานเกิดอะไรขึ้น — บวกฟังคำตอบที่สร้างจากของเดียวกัน
          รู้เรื่อง และกู้บทสนทนาเมื่อมันสะดุด
          (<span className="en">Sorry, could you say that again?</span>,{' '}
          <span className="en">I don't understand</span>)
        </p>
        <p className="muted" style={{ fontWeight: 700 }}>
          สิ่งที่มัน<i>ไม่ใช่</i>: ความคล่อง การตามเจ้าของภาษาสองคนคุยกันเต็มสปีด หรือถกการเมือง
          ต้องใช้คำศัพท์หลายพันคำและการฟังเป็นปีๆ แอปนี้พาคุณไปถึงจุดที่บทสนทนาจริงเริ่มเป็นไปได้ —
          ซึ่งเป็นจุดที่การเรียนรู้ของจริงเริ่มต้น
        </p>
      </section>

      <div className="row" style={{ justifyContent: 'center', padding: '4px 0 8px' }}>
        <button className="btn big" onClick={() => go('home')}>กลับหน้าหลัก</button>
      </div>
    </div>
  )
}
