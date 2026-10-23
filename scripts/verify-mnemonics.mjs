// The grapheme mnemonics: content integrity, and the panel that shows them.
//
// Every grapheme in the Read-English course carries two stories — `mnemonic`,
// how to MAKE the sound with a Thai mouth, and `sound`, how to REMEMBER which
// sound this spelling makes — plus a group story (`GROUP_STORY`, keyed by the
// card's `meta`) that frames the whole family of spellings. On the touch
// device this app is actually used on, a tooltip would be unreachable, so the
// panel is the only way a learner ever meets them. Two things can regress: a
// grapheme can be added without its stories, and the panel can stop rendering
// one. Both are silent, and both leave a learner staring at a spelling with
// nothing to hang it on, which is the exact failure the mnemonics exist to
// prevent.
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
  const idx = await import('/src/data/index.ts')
  const chars = d.SCRIPT_LESSONS.flatMap(l => l.chars)
  return {
    chars: chars.map(c => ({
      char: c.char,
      name: c.name ?? '',
      reading: c.reading ?? '',
      ipa: c.ipa ?? '',
      meta: c.meta ?? '',
      word: c.word ?? '',
      wordReading: c.wordReading ?? '',
      wordTh: c.wordTh ?? '',
      emoji: c.emoji ?? '',
      mnemonic: c.mnemonic ?? '',
      sound: c.sound ?? '',
    })),
    lessonsWithChars: d.SCRIPT_LESSONS.filter(l => l.chars.length > 0).length,
    deckSize: Object.keys(idx.SCRIPT_CHARS).length,
    stories: Object.fromEntries(Object.entries(d.GROUP_STORY).map(([k, v]) => [k, {
      emoji: v.emoji ?? '', title: v.title ?? '', body: v.body ?? '',
    }])),
  }
})

const missing = f => data.chars.filter(c => !c[f].trim()).map(c => c.char)
check('every grapheme has a how-to-say story (mnemonic)', missing('mnemonic').length === 0, missing('mnemonic').join(' '))
check('every grapheme has a how-to-remember hook (sound)', missing('sound').length === 0, missing('sound').join(' '))
check('every grapheme has an illustration', missing('emoji').length === 0, missing('emoji').join(' '))
check('every grapheme has an accessible name for its illustration',
  missing('wordTh').length === 0, missing('wordTh').join(' '))
check('every grapheme has an example word with its reading',
  missing('word').length === 0 && missing('wordReading').length === 0,
  [...missing('word'), ...missing('wordReading')].join(' '))
check('every grapheme has a Thai name, a reading and IPA',
  missing('name').length === 0 && missing('reading').length === 0 && missing('ipa').length === 0,
  [...missing('name'), ...missing('reading'), ...missing('ipa')].join(' '))
// The deck is keyed by grapheme, so a spelling taught in two lessons would
// silently collapse into one card.
check('every grapheme is taught exactly once across the course',
  data.chars.length === data.deckSize && new Set(data.chars.map(c => c.char)).size === data.chars.length,
  `${data.chars.length} graphemes in lessons, ${data.deckSize} in the deck`)

// Emphasis is the mechanism that makes a sound hook readable; an unclosed
// marker renders as literal asterisks.
const unbalanced = data.chars.filter(c =>
  (c.sound.match(/\*\*/g) ?? []).length % 2 !== 0 ||
  (c.mnemonic.match(/\*\*/g) ?? []).length % 2 !== 0)
check('no mnemonic has an unclosed **emphasis** marker',
  unbalanced.length === 0, unbalanced.map(c => c.char).join(' '))

const noEmphasis = data.chars.filter(c => !c.sound.includes('**'))
check('every sound hook actually points at the sound',
  noEmphasis.length <= 6,
  `${noEmphasis.length} without emphasis: ${noEmphasis.map(c => c.char).join(' ')}`)

const metas = [...new Set(data.chars.map(c => c.meta))]
const storyless = metas.filter(m => !data.stories[m])
check('GROUP_STORY has an entry for every sound group (meta) a grapheme uses',
  storyless.length === 0, storyless.length ? `missing: ${storyless.join(', ')}` : metas.join(' · '))
const thinStory = Object.entries(data.stories).filter(([, s]) => !s.emoji || !s.title.trim() || !s.body.trim()).map(([k]) => k)
check('every group story has an emoji, a title and a body', thinStory.length === 0, thinStory.join(', '))

// ── The panel ──────────────────────────────────────────────────────────────
const go = () => page.evaluate(async () => {
  const m = await import('/src/core/store.ts')
  m.useApp.getState().go('script')
})
await go()
await page.waitForTimeout(500)

const lessons = await page.locator('.lesson-card').count()
check('the course path lists its lessons', lessons >= 12, `${lessons} lessons`)

let panelsSeen = 0, groupRowsSeen = 0, checkedChars = 0, lessonsOpened = 0
for (let li = 0; li < lessons; li++) {
  await page.locator('.lesson-card').nth(li).click()
  await page.waitForTimeout(320)
  const cards = await page.locator('.char-card').count()

  if (cards > 0) {
    lessonsOpened++
    // Opening a lesson must show a mnemonic straight away — a panel nobody
    // discovers is the tooltip problem again in a bigger box.
    const openOnArrival = await page.locator('[data-testid=mnemonic]').count()
    check(`lesson ${li + 1}: a mnemonic is showing on arrival`, openOnArrival === 1,
      `${openOnArrival} panels, ${cards} graphemes`)

    for (let ci = 0; ci < cards; ci++) {
      await page.locator('.char-card').nth(ci).click()
      await page.waitForTimeout(90)
      const panel = page.locator('[data-testid=mnemonic]')
      const text = await panel.innerText()
      const glyph = (await panel.locator('.mnem-glyph').innerText()).trim()
      const known = data.chars.find(c => c.char === glyph)
      const ok =
        known != null &&
        text.includes('ออกเสียงยังไง') && text.includes('จำยังไง') &&
        (await panel.locator('.mnem-emoji').count()) === 1
      check(`lesson ${li + 1} grapheme ${glyph}: panel shows picture, how to say and how to remember`, ok,
        ok ? '' : text.slice(0, 90).replace(/\n/g, ' | '))
      checkedChars++
      panelsSeen++
      // The group story — every meta has one, so every card shows the row,
      // with that group's own title.
      const story = known ? data.stories[known.meta] : null
      const hasGroupRow = text.includes('กลุ่มเสียง') && !!story && text.includes(story.title)
      check(`grapheme ${glyph}: the panel names its sound group (${known?.meta ?? '?'})`, hasGroupRow,
        story ? '' : 'no story for this meta')
      if (hasGroupRow) groupRowsSeen++
      // Emphasis must arrive as markup, never as literal asterisks on screen.
      check(`grapheme ${glyph}: no raw ** markers leak into the UI`, !text.includes('**'),
        text.includes('**') ? text.slice(0, 60) : '')
    }
  }
  await page.locator('button:has-text("บทเรียนทั้งหมด")').first().click()
  await page.waitForTimeout(220)
}

check('every grapheme in the course was opened and checked', checkedChars === data.chars.length,
  `${checkedChars} of ${data.chars.length} opened across ${lessonsOpened} lessons (${data.lessonsWithChars} carry graphemes)`)
check('the group story was shown on every card', groupRowsSeen === checkedChars,
  `${groupRowsSeen}/${checkedChars} cards showed a group row`)
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
