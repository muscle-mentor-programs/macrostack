import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { storySnapshot, canShareImage } from '../src/lib/storyImage.js'
const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/Branden Hales/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const data = { kind: 'daily', date: '2026-09-12', totals: { calories: 123.4, protein: 4.5, carbs: 6, fat: 7 }, goals: { calories: 2000 }, email: 'private@example.com' }
const snapshot = storySnapshot(data)
assert.equal(snapshot.totals.calories, 123.4)
assert.equal(snapshot.email, undefined)
data.totals.calories = 999
assert.equal(snapshot.totals.calories, 123.4)
assert.throws(() => storySnapshot({ ...data, kind: 'meal', items: [] }))
assert.throws(() => storySnapshot({ ...data, totals: {} }))
assert.equal(canShareImage({}, {}), false)
assert.equal(canShareImage({}, { share() {}, canShare() { throw Error() } }), false)
await mkdir('outputs/story-share', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 850 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('http://127.0.0.1:5198/__story-qa')
    for (const [label, kind] of [['Share lunch', 'meal'], ['Share daily totals', 'daily']]) {
      await page.getByRole('button', { name: label, exact: true }).click()
      const preview = page.getByRole('img')
      await preview.waitFor()
      assert.deepEqual(await preview.evaluate(image => [image.naturalWidth, image.naturalHeight]), [1080, 1920])
      const download = page.getByRole('link', { name: 'Download image' })
      const box = await download.boundingBox()
      assert.ok(box.y >= 0 && box.y + box.height <= 850)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      const bytes = await preview.evaluate(async image => Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer())))
      await writeFile(`outputs/story-share/${kind}-${width}.png`, new Uint8Array(bytes))
      await page.screenshot({ path: `outputs/story-share/preview-${kind}-${width}.png` })
      const downloaded = page.waitForEvent('download')
      await download.click()
      assert.match((await downloaded).suggestedFilename(), /macrostack-.*\.png/)
      await page.getByRole('button', { name: 'Close share preview' }).click()
    }
    // Native API is mocked: no OS share target or social app receives test data.
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
      Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.lastShare = { count: payload.files.length, type: payload.files[0].type, keys: Object.keys(payload) } } })
    })
    await page.getByRole('button', { name: 'Share lunch', exact: true }).click()
    await page.getByRole('button', { name: 'Share image', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.lastShare), { count: 1, type: 'image/png', keys: ['files'] })
    await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Canceled', 'AbortError') } }))
    await page.getByRole('button', { name: 'Share image', exact: true }).click()
    await page.getByText('Sharing closed.', { exact: false }).waitFor()
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('dialog').count(), 0)
    assert.deepEqual(errors, [])
    console.log(`PASS ${width}px: meal/daily PNG dimensions, preview visibility, download, share payload, cancel and Escape`)
    await page.close()
  }
  const page = await browser.newPage()
  await page.goto('http://127.0.0.1:5198/__story-qa')
  const bytes = await page.evaluate(async () => {
    const { generateStoryImage, storySnapshot } = await import('/src/lib/storyImage.js')
    const blob = await generateStoryImage(storySnapshot({kind:'meal',date:'2026-09-13',meal:'An extremely long meal name that must stay inside the safe margins',totals:window.storyFixtures.totals,items:Array.from({length:12},()=>({name:'A very long food name '.repeat(20)}))}))
    return Array.from(new Uint8Array(await blob.arrayBuffer()))
  })
  await writeFile('outputs/story-share/long-meal.png', new Uint8Array(bytes))
  await page.close()
  const fallback = await browser.newPage({ viewport: { width: 320, height: 568 } })
  await fallback.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
  })
  await fallback.route('**/fonts/BarlowCondensed-Black.ttf', route => route.abort())
  await fallback.goto('http://127.0.0.1:5198/__story-qa')
  await fallback.getByRole('button', { name: 'Share lunch', exact: true }).click()
  await fallback.getByRole('button', { name: 'Retry', exact: true }).waitFor()
  await fallback.unroute('**/fonts/BarlowCondensed-Black.ttf')
  await fallback.getByRole('button', { name: 'Retry', exact: true }).click()
  await fallback.getByRole('img').waitFor()
  assert.equal(await fallback.getByRole('button', { name: 'Share image', exact: true }).count(), 0)
  const smallButton = await fallback.getByRole('link', { name: 'Download image' }).boundingBox()
  assert.ok(smallButton.y + smallButton.height <= 568)
  await fallback.screenshot({ path: 'outputs/story-share/fallback-320.png' })
  await fallback.close()
  console.log('PASS unsupported sharing, failed font load and retry, 320px download visibility')
  console.log('PASS long meal / overflowing item list export; snapshot privacy and numeric preservation checks')
} finally { await browser.close() }
