// Nothing may render underneath the status bar, the Dynamic Island, or the
// home indicator.
//
// index.html asks for `viewport-fit=cover` with a black-translucent status bar,
// which makes the viewport run edge to edge — the page's y=0 is the top of the
// physical screen, not the top of the usable area. In a browser tab this is
// invisible, because Safari's own chrome occupies that space anyway. It appears
// only once the app is INSTALLED to the home screen, where there is no chrome,
// and it appears as content that is drawn but cannot be tapped.
//
// That is the whole difficulty: the bug is unreachable from a desktop browser,
// unreachable from mobile Safari, and reachable only on a physical installed
// device. So this suite simulates it. `env(safe-area-inset-*)` cannot be
// overridden from script, which is why global.css aliases all four into CSS
// variables — those CAN be overridden, and everything anchored to a viewport
// edge is required to consume the variable rather than call env() directly.
//
// Usage: node scripts/verify-safe-area.mjs   (needs `npm run dev` on :5173)
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:5173'

// iPhone 15/16 Pro, portrait: Dynamic Island above, home indicator below.
const INSET = { t: 59, r: 0, b: 34, l: 0 }

const results = []
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`)
}

const pageErrors = []
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})

/**
 * A viewport with the insets forced on, standing in for an installed app.
 * Passing zeroes gives the browser-tab case, where the same rules must NOT
 * introduce phantom space.
 */
async function screen(width, height, inset) {
  const ctx = await browser.newContext({ viewport: { width, height } })
  await ctx.addInitScript(i => {
    const apply = () => {
      const s = document.createElement('style')
      s.textContent =
        `:root{--safe-t:${i.t}px;--safe-r:${i.r}px;--safe-b:${i.b}px;--safe-l:${i.l}px}`
      document.head.appendChild(s)
    }
    if (document.head) apply()
    else document.addEventListener('DOMContentLoaded', apply, { once: true })
  }, inset)
  // Playwright contexts are incognito-like and report a ~1 GB quota, which trips
  // the private-browsing warning. That banner is not what is under test, and an
  // extra banner would shift the very geometry being measured.
  await ctx.addInitScript(() => {
    const real = navigator.storage.estimate.bind(navigator.storage)
    navigator.storage.estimate = async () => ({ ...(await real()), quota: 150_000 * 1024 * 1024 })
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(15_000)
  page.on('pageerror', e => pageErrors.push(String(e)))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    const d = await import('/src/core/dev.ts')
    d.jumpToLevel(3)
  })
  return { ctx, page }
}

const go = (page, s) => page.evaluate(async name => {
  const m = await import('/src/core/store.ts')
  m.useApp.getState().go(name)
}, s)

/**
 * The topmost visible pixel of real UI. Scoped to `.shell` so the fixed
 * decorative layers (`.bg3d`, `.bg-vignette`) are excluded by construction —
 * those are meant to bleed to the edges, and are not tappable.
 */
const topOfContent = page => page.evaluate(() => {
  let top = Infinity, who = ''
  // `.shell` itself is excluded: it is a transparent grid container whose border
  // box legitimately spans the whole viewport. The inset lives in its padding,
  // so it is the CONTENTS that must clear the bar.
  for (const el of document.querySelectorAll('.shell *')) {
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    if (r.top < top) { top = r.top; who = `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 60) }
  }
  return { top, who }
})

// Every tab plus the two reference screens reached from inside them: Sounds
// (from the Read-English course) and Settings (from Home).
const SCREENS = ['home', 'review', 'builder', 'listening', 'script', 'sounds', 'library', 'about', 'settings']

for (const width of [390, 360]) {
  const { ctx, page } = await screen(width, 844, INSET)

  for (const s of SCREENS) {
    await go(page, s)
    await page.waitForTimeout(350)
    const { top, who } = await topOfContent(page)
    check(`${width}px · ${s}: nothing is drawn under the status bar`,
      top >= INSET.t - 0.5, `topmost content at y=${Math.round(top)} (inset ${INSET.t}) — ${who}`)
  }

  // The tab bar is the one control anchored to the bottom edge, and the home
  // indicator sits on top of it.
  await go(page, 'home')
  await page.waitForTimeout(300)
  const nav = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.nav-btn')]
    const last = btns.map(b => b.getBoundingClientRect()).sort((a, b) => b.bottom - a.bottom)[0]
    const side = document.querySelector('.side').getBoundingClientRect()
    return { btnBottom: last.bottom, sideBottom: side.bottom, h: window.innerHeight, n: btns.length }
  })
  check(`${width}px · tab bar reaches the bottom edge`,
    Math.abs(nav.sideBottom - nav.h) < 1.5, `side bottom=${Math.round(nav.sideBottom)} vs ${nav.h}`)
  check(`${width}px · no tab sits under the home indicator`,
    nav.btnBottom <= nav.h - INSET.b + 0.5,
    `lowest tab at y=${Math.round(nav.btnBottom)}, usable to ${nav.h - INSET.b}`)

  // Sticky level headers stick to the viewport, so they need the inset too —
  // this one only misbehaves after a scroll, which is how it was missed.
  await go(page, 'library')
  await page.waitForTimeout(400)
  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(300)
  const sticky = await page.evaluate(() => {
    const heads = [...document.querySelectorAll('.lib-section-head')]
      .map(h => h.getBoundingClientRect())
      .filter(r => r.height > 0 && r.top < window.innerHeight && r.bottom > 0)
    return heads.length ? Math.min(...heads.map(r => r.top)) : null
  })
  check(`${width}px · a stuck library header clears the status bar`,
    sticky === null || sticky >= INSET.t - 0.5,
    sticky === null ? 'no header on screen — not exercised' : `stuck at y=${Math.round(sticky)}`)

  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth, inner: window.innerWidth,
  }))
  check(`${width}px · the insets introduce no horizontal overflow`,
    overflow.scroll <= overflow.inner + 1, `scrollWidth=${overflow.scroll} vs ${overflow.inner}`)

  await ctx.close()
}

// The control. Without insets the layout must be exactly what it always was —
// a fix that hardcodes a notch-sized gap would push every browser user down by
// 59px for nothing, and would pass every assertion above.
{
  const { ctx, page } = await screen(390, 844, { t: 0, r: 0, b: 0, l: 0 })
  await go(page, 'settings')
  await page.waitForTimeout(350)
  const { top } = await topOfContent(page)
  check('with no insets, the mobile 12px padding is unchanged',
    top >= 11.5 && top <= 13, `topmost content at y=${top}`)
  await ctx.close()
}

check('zero uncaught page errors', pageErrors.length === 0,
  pageErrors.length ? pageErrors.slice(0, 3).join(' | ') : 'clean')

const failed = results.filter(r => !r.pass).length
console.log(`\n${results.length} assertions, ${failed} failed`)
await browser.close()
process.exit(failed ? 1 : 0)
