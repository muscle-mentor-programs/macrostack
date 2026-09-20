import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir} from 'node:fs/promises'
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser=await chromium.launch({channel:'chrome',headless:true})
await mkdir('outputs/gyms',{recursive:true})
try {
 for(const width of [320,390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900}})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${process.env.TEST_URL || 'http://127.0.0.1:5198'}/gyms`)
  await page.getByRole('heading',{level:1}).waitFor()
  await page.evaluate(()=>document.fonts.ready)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),true)
  await page.getByRole('link',{name:'Find your gym’s plan'}).click()
  await page.waitForTimeout(100)
  assert.ok(await page.evaluate(()=>window.scrollY)>0,'Public page must scroll to pricing')
  await page.evaluate(()=>window.scrollTo(0,0))
  await page.screenshot({path:`outputs/gyms/page-${width}.png`,fullPage:true})
  const size=page.getByLabel('Total gym members')
  for(const [i,price] of ['299','499','799','1,299'].entries()) {
   await size.selectOption(String(i));assert.equal(await page.locator('.gyms-price').innerText(),`$${price}/mo`)
  }
  await page.getByRole('button',{name:'One year'}).click()
  assert.equal(await page.locator('.gyms-price').innerText(),'$1,039.20/mo')
  await size.selectOption('4');assert.equal(await page.locator('.gyms-price').innerText(),'LET’S TALK')
  await size.selectOption('1')
  await page.getByLabel('Gym name',{exact:true}).fill('Test Gym')
  await page.getByLabel('Your name',{exact:true}).fill('QA Owner')
  await page.getByLabel('Work email').fill('qa@example.com')
  await page.getByRole('button',{name:'Prepare my inquiry'}).click()
  const href=await page.getByRole('link',{name:'Open email draft'}).getAttribute('href')
  assert.ok(href.startsWith('mailto:getmacrostack@gmail.com?'))
  assert.match(decodeURIComponent(href),/251–500/)
  assert.match(decodeURIComponent(href),/399.2/)
  await page.getByLabel('Gym name',{exact:true}).fill('Changed Gym')
  assert.equal(await page.getByRole('link',{name:'Open email draft'}).count(),0)
  await page.reload();assert.equal(new URL(page.url()).pathname,'/gyms')
  assert.deepEqual(errors,[])
  console.log(`PASS ${width}px: layout, images, pricing, annual/custom plans, email draft, stale draft cleared, direct route`)
  await page.close()
 }
} finally {await browser.close()}
