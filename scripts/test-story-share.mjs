import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { storySnapshot, canShareImage, photoCrop, generateStoryImage, storyServing, storyPageCount } from '../src/lib/storyImage.js'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const data = { kind: 'daily', date: '2026-09-12', totals: { calories: 123.4, protein: 4.5, carbs: 6, fat: 7 }, goals: { calories: 2000 }, email: 'private@example.com' }
const snapshot = storySnapshot(data)
assert.equal(snapshot.totals.calories, 123.4)
assert.equal(snapshot.email, undefined)
assert.equal(storyServing({quantity:1.5,servingSize:100,servingUnit:'g'}), '150 g')
assert.equal(storyServing({quantity:0.5,servingSize:15,servingUnit:'tbsp'}), '0.5 tbsp')
assert.equal(storyServing({amount:85}), '85 g')
assert.equal(storyServing({}), '')
assert.equal(storyServing({quantity:1,servingUnit:'2 tablespoons'}), '2 tablespoons')
assert.equal(storyServing({quantity:0.5,servingUnit:'2 tablespoons'}), '0.5 × 2 tablespoons')
assert.equal(storyServing({quantity:2,servingSize:100}), '200 g')
const meal = storySnapshot({...data,kind:'meal',items:[{name:'Rice',amount:150,email:'private',id:'secret'}]})
assert.deepEqual(meal.items, [{name:'Rice',serving:'150 g'}])
assert.equal(storyPageCount({...meal,items:Array.from({length:13},()=>meal.items[0])}),3)
data.totals.calories = 999
assert.equal(snapshot.totals.calories, 123.4)
assert.throws(() => storySnapshot({ ...data, kind: 'meal', items: [] }))
assert.throws(() => storySnapshot({ ...data, totals: {} }))
assert.equal(canShareImage({}, {}), false)
assert.equal(canShareImage({}, { share() {}, canShare() { throw Error() } }), false)
await assert.rejects(generateStoryImage({ ...snapshot, kind: 'meal' }), /food photo/)
assert.deepEqual(photoCrop(1080, 1920), { x: 0, y: 0, width: 1080, height: 1920 })
assert.ok(photoCrop(1920,1080,{x:100,y:50}).x > photoCrop(1920,1080,{x:0,y:50}).x)
await mkdir('outputs/story-share', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const fixturePage = await browser.newPage()
  await fixturePage.goto('http://127.0.0.1:5198/__story-qa')
  const photoBytes = await fixturePage.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width=1080; canvas.height=1920
    const ctx=canvas.getContext('2d');ctx.fillStyle='#C7A785';ctx.fillRect(0,0,1080,1920)
    ctx.fillStyle='#F4F0E9';ctx.beginPath();ctx.arc(540,870,390,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#D69551';ctx.beginPath();ctx.ellipse(430,860,190,110,.5,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#698349';ctx.beginPath();ctx.ellipse(710,780,95,160,-.3,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#E6CC8A';ctx.beginPath();ctx.ellipse(650,1030,125,85,0,0,Math.PI*2);ctx.fill()
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))
    return Array.from(new Uint8Array(await blob.arrayBuffer()))
  })
  await fixturePage.close()
  const photoFile = { name: 'synthetic-food.png', mimeType: 'image/png', buffer: Buffer.from(photoBytes) }
  await writeFile('outputs/story-share/synthetic-food.png', photoFile.buffer)
  const addPhoto = page => page.getByLabel('Choose food photo', { exact: true }).setInputFiles(photoFile)
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 850 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('http://127.0.0.1:5198/__story-qa')
    for (const [label, kind] of [['Share lunch', 'meal'], ['Share daily totals', 'daily']]) {
      await page.getByRole('button', { name: label, exact: true }).click()
      if (kind === 'meal') {
        assert.equal(await page.getByRole('link', { name: 'Download image' }).count(), 0)
        assert.equal(await page.getByLabel('Take food photo', { exact: true }).getAttribute('capture'), 'environment')
        await addPhoto(page)
      } else {
        assert.equal(await page.locator('input[type="file"]').count(), 0)
        assert.equal(await page.locator('.story-photo-position').count(), 0)
      }
      const preview = page.getByRole('img')
      await preview.waitFor()
      assert.deepEqual(await preview.evaluate(image => [image.width, image.height]), [1080, 1920])
      await page.locator('a[download][href]').waitFor()
      if (kind === 'meal') {
        const slider = page.getByLabel('Photo horizontal position')
        await slider.focus()
        const before = await slider.boundingBox()
        await page.evaluate(() => {
          window.previewNode = document.querySelector('canvas[role="img"]')
          window.encodeCount = 0
          window.originalToBlob = HTMLCanvasElement.prototype.toBlob
          HTMLCanvasElement.prototype.toBlob = function(...args) { window.encodeCount++; return window.originalToBlob.apply(this, args) }
        })
        for (let step = 0; step < 12; step++) {
          await slider.press('ArrowRight')
          assert.equal(await preview.evaluate(node => node === window.previewNode && !node.hidden), true)
          assert.equal((await slider.boundingBox()).y, before.y)
        }
        await page.locator('a[download][href]').waitFor()
        assert.equal(await page.evaluate(() => window.encodeCount), 1, 'Only one PNG encoding after rapid positioning')
        await page.evaluate(() => { HTMLCanvasElement.prototype.toBlob = window.originalToBlob })
      }
      const download = page.getByRole('link', { name: 'Download image' })
      const box = await download.boundingBox()
      assert.ok(box.y >= 0 && box.y + box.height <= 850)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      const bytes = await preview.evaluate(async image => Array.from(new Uint8Array(await (await new Promise(resolve => image.toBlob(resolve, 'image/png'))).arrayBuffer())))
      await writeFile(`outputs/story-share/${kind}-${width}.png`, new Uint8Array(bytes))
      await page.screenshot({ path: `outputs/story-share/preview-${kind}-${width}.png` })
      const downloaded = page.waitForEvent('download')
      await download.click()
      assert.match((await downloaded).suggestedFilename(), /macrostack-.*\.png/)
      await page.getByRole('button', { name: 'Close share preview' }).click()
    }
    await page.getByRole('button', {name:'Share large meal',exact:true}).click()
    await addPhoto(page)
    await page.locator('a[download][href]').waitFor()
    assert.match(await page.locator('a[download]').getAttribute('download'), /-1\.png$/)
    await page.getByRole('button', {name:'Next ingredient card'}).click()
    await page.locator('a[download][href]').waitFor()
    assert.match(await page.locator('a[download]').getAttribute('download'), /-2\.png$/)
    assert.equal(await page.getByRole('button', {name:'Next ingredient card'}).isDisabled(), true)
    await page.getByRole('button', {name:'Previous ingredient card'}).click()
    await page.locator('a[download][href]').waitFor()
    assert.match(await page.locator('a[download]').getAttribute('download'), /-1\.png$/)
    await page.getByRole('button', {name:'Close share preview'}).click()
    // Native API is mocked: no OS share target or social app receives test data.
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
      Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.lastShare = { count: payload.files.length, type: payload.files[0].type, keys: Object.keys(payload) } } })
    })
    await page.getByRole('button', { name: 'Share lunch', exact: true }).click()
    await addPhoto(page)
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
    const { generateStoryImage, storySnapshot, readStoryPhoto } = await import('/src/lib/storyImage.js')
    const source = await (await fetch('/outputs/story-share/synthetic-food.png')).blob()
    const photo = await readStoryPhoto(new File([source],'food.png',{type:'image/png'}))
    const blob = await generateStoryImage(storySnapshot({kind:'meal',date:'2026-09-13',meal:'An extremely long meal name that must stay inside the safe margins',totals:window.storyFixtures.totals,items:Array.from({length:12},()=>({name:'A very long food name '.repeat(20)}))}), photo)
    // Confirm every logged food reaches a card, including the final partial card.
    const {renderStoryCanvas, storyPageCount}=await import('/src/lib/storyImage.js')
    const names=Array.from({length:13},(_,i)=>`Ingredient ${i+1}`)
    const paged=storySnapshot({kind:'meal',date:'2026-09-13',meal:'Lunch',totals:window.storyFixtures.totals,items:names.map(name=>({name,amount:125}))})
    const drawn=[];const fill=CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText=function(value,...args){drawn.push(value);return fill.call(this,value,...args)}
    try { for(let page=0;page<storyPageCount(paged);page++) await renderStoryCanvas(paged,photo,undefined,page) }
    finally { CanvasRenderingContext2D.prototype.fillText=fill }
    if(names.some(name=>drawn.filter(text=>text===name).length!==1)) throw Error('Missing or duplicated ingredient')
    if(drawn.filter(text=>text==='125 g').length!==13) throw Error('Missing logged quantities')
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
  await fallback.getByLabel('Choose food photo', { exact: true }).setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('not a photo')})
  await fallback.getByRole('alert').waitFor()
  assert.equal(await fallback.getByRole('link', { name: 'Download image' }).count(), 0)
  await addPhoto(fallback)
  await fallback.getByRole('button', { name: 'Retry', exact: true }).waitFor()
  await fallback.unroute('**/fonts/BarlowCondensed-Black.ttf')
  await fallback.getByRole('button', { name: 'Retry', exact: true }).click()
  await fallback.getByRole('img').waitFor()
  await fallback.getByLabel('Photo horizontal position').focus()
  await fallback.getByLabel('Photo horizontal position').press('Home')
  await fallback.getByRole('img').waitFor()
  await fallback.locator('a[download][href]').waitFor()
  assert.equal(await fallback.getByRole('button', { name: 'Share image', exact: true }).count(), 0)
  const smallButton = await fallback.getByRole('link', { name: 'Download image' }).boundingBox()
  assert.ok(smallButton.y + smallButton.height <= 568)
  await fallback.screenshot({ path: 'outputs/story-share/fallback-320.png' })
  await fallback.close()
  console.log('PASS required photo, invalid file, camera input, reposition, unsupported sharing, failed font load/retry, 320px download visibility')
  console.log('PASS long meal export, all 13 foods and quantities across cards; snapshot privacy and numeric preservation checks')
} finally { await browser.close() }
