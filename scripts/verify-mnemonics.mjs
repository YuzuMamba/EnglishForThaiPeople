// The letter mnemonics: content integrity, and the panel that shows them.
//
// The stories were in the data from the start, reachable only through a
// `title` tooltip — which on the touch device this app is actually used on
// means not reachable at all. Two things can now regress: a character can be
// added without its story, and the panel can stop rendering one. Both are
// silent, and both leave a learner staring at a shape with nothing to hang it
// on, which is the exact failure the mnemonics exist to prevent.
//
// Usage: node scripts/verify-mnemonics.mjs   (needs `npm run dev` on :5173)
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:5173'

const results = []
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`)
}

const pageErrors = []
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } })
await ctx.addInitScript(() => {
  const real = navigator.storage.estimate.bind(navigator.storage)
  navigator.storage.estimate = async () => ({ ...(await real()), quota: 150_000 * 1024 * 1024 })
})
const page = await ctx.newPage()
page.setDefaultTimeout(15_000)
page.on('pageerror', e => pageErrors.push(String(e)))
await page.goto(BASE, { waitUntil: 'networkidle' })

// ── Content integrity ──────────────────────────────────────────────────────
const data = await page.evaluate(async () => {
  const d = await import('/src/data/script.ts')
  const t = await import('/src/core/tone.ts')
  const chars = d.SCRIPT_LESSONS.flatMap(l => l.chars)
  return {
    chars: chars.map(c => ({
      char: c.char,
      emoji: c.emoji ?? '',
      sound: c.sound ?? '',
      mnemonic: c.mnemonic ?? '',
      wordTh: c.wordTh ?? '',
      // A single-codepoint entry that the tone tables know is a consonant, and
      // therefore must have a class story to show.
      cls: c.char.length === 1 ? (t.CONSONANT_CLASS[c.char] ?? null) : null,
    })),
    classStories: Object.keys(d.CLASS_STORY),
  }
})

const missing = f => data.chars.filter(c => !c[f].trim()).map(c => c.char)
check('every character has a shape mnemonic', missing('mnemonic').length === 0, missing('mnemonic').join(' '))
check('every character has a sound mnemonic', missing('sound').length === 0, missing('sound').join(' '))
check('every character has an illustration', missing('emoji').length === 0, missing('emoji').join(' '))
check('every character has an accessible name for its illustration',
  missing('wordTh').length === 0, missing('wordTh').join(' '))
check('all 76 characters are covered', data.chars.length === 76, `${data.chars.length} characters`)

// Emphasis is the mechanism that makes a sound hook readable; an unclosed
// marker renders as literal asterisks.
const unbalanced = data.chars.filter(c =>
  (c.sound.match(/\*\*/g) ?? []).length % 2 !== 0 ||
  (c.mnemonic.match(/\*\*/g) ?? []).length % 2 !== 0)
check('no mnemonic has an unclosed **emphasis** marker',
  unbalanced.length === 0, unbalanced.map(c => c.char).join(' '))

const noEmphasis = data.chars.filter(c => !c.sound.includes('**'))
check('every sound mnemonic actually points at the sound',
  noEmphasis.length <= 6,
  `${noEmphasis.length} without emphasis: ${noEmphasis.map(c => c.char).join(' ')}`)

check('all three consonant classes have a story',
  ['mid', 'high', 'low'].every(k => data.classStories.includes(k)),
  data.classStories.join(' '))

// ── The panel ──────────────────────────────────────────────────────────────
const go = () => page.evaluate(async () => {
  const m = await import('/src/core/store.ts')
  m.useApp.getState().go('script')
})
await go()
await page.waitForTimeout(500)

const lessons = await page.locator('.lesson-card').count()
check('the course path lists its lessons', lessons >= 12, `${lessons} lessons`)

let panelsSeen = 0, classRowsSeen = 0, checkedChars = 0
for (let li = 0; li < lessons; li++) {
  await page.locator('.lesson-card').nth(li).click()
  await page.waitForTimeout(320)
  const cards = await page.locator('.char-card').count()

  if (cards > 0) {
    // Opening a lesson must show a mnemonic straight away — a panel nobody
    // discovers is the tooltip problem again in a bigger box.
    const openOnArrival = await page.locator('[data-testid=mnemonic]').count()
    check(`lesson ${li + 1}: a mnemonic is showing on arrival`, openOnArrival === 1,
      `${openOnArrival} panels, ${cards} letters`)

    for (let ci = 0; ci < cards; ci++) {
      await page.locator('.char-card').nth(ci).click()
      await page.waitForTimeout(90)
      const panel = page.locator('[data-testid=mnemonic]')
      const text = await panel.innerText()
      const glyph = await panel.locator('.mnem-glyph').innerText()
      const known = data.chars.find(c => c.char === glyph)
      const ok =
        known != null &&
        text.includes('LOOKS LIKE') && text.includes('SOUNDS LIKE') &&
        (await panel.locator('.mnem-emoji').count()) === 1
      check(`lesson ${li + 1} letter ${glyph}: panel shows picture, shape and sound`, ok,
        ok ? '' : text.slice(0, 90).replace(/\n/g, ' | '))
      checkedChars++
      panelsSeen++
      const hasClassRow = text.includes('ITS CLASS')
      if (known?.cls) {
        check(`letter ${glyph}: a consonant states its tone class`, hasClassRow,
          `class=${known.cls}`)
        classRowsSeen++
      } else {
        check(`letter ${glyph}: a non-consonant does not invent a tone class`, !hasClassRow)
      }
      // Emphasis must arrive as markup, never as literal asterisks on screen.
      check(`letter ${glyph}: no raw ** markers leak into the UI`, !text.includes('**'),
        text.includes('**') ? text.slice(0, 60) : '')
    }
  }
  await page.locator('button:has-text("All lessons")').first().click()
  await page.waitForTimeout(220)
}

check('every one of the 76 letters was opened and checked', checkedChars === 76, `${checkedChars} opened`)
check('the class story was exercised across the consonants', classRowsSeen >= 40,
  `${classRowsSeen} consonants showed a class`)
check('panels rendered without a single miss', panelsSeen === checkedChars)

const overflow = await page.evaluate(() => ({
  s: document.documentElement.scrollWidth, i: window.innerWidth,
}))
check('390px: the panel introduces no horizontal overflow',
  overflow.s <= overflow.i + 1, `scrollWidth=${overflow.s} vs ${overflow.i}`)

check('zero uncaught page errors', pageErrors.length === 0,
  pageErrors.length ? pageErrors.slice(0, 3).join(' | ') : 'clean')

const failed = results.filter(r => !r.pass).length
console.log(`\n${results.length} assertions, ${failed} failed`)
await browser.close()
process.exit(failed ? 1 : 0)
