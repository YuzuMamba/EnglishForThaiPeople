// Screenshot harness: captures screens (demo-seeded) for visual review and
// reports horizontal overflow + console errors per screen.
//   node scripts/shoot.mjs [outDir] [screens,comma,separated] [width]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const out = process.argv[2] ?? 'shots'
const screens = (process.argv[3] ?? 'home,review,builder,listening,script,sounds,library,lesson,about,settings').split(',')
const width = Number(process.argv[4] ?? 390)
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 2 })
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push(String(e)))
for (const s of screens) {
  await page.goto(`http://localhost:5173/?demo=1&screen=${s}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500) // let three.js + fonts + entrance animations settle
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  await page.screenshot({ path: `${out}/${s}-${width}.png`, fullPage: true })
  console.log(`shot ${s}@${width} overflowX=${overflow}`)
}
console.log('console errors:', errors.length, errors.slice(0, 5).join(' | '))
await browser.close()
