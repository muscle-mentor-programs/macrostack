import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/motion-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
 await page.goto('http://127.0.0.1:5198/motion-fixture');
 await page.evaluate(async()=>{
  document.body.innerHTML='<style>details{box-sizing:border-box;width:320px;padding:20px;border:1px solid}summary{height:30px}.content{height:250px}#menu{position:relative}#menu>div{position:absolute;top:100%;height:100px;background:gray}</style><details id="normal"><summary>Open</summary><div class="content"><input></div></details><details id="menu"><summary>Menu</summary><div><button>Action</button></div></details>';
  const {installDisclosureMotion}=await import('/src/motion/disclosures.js');installDisclosureMotion();
 });
 const normal=page.locator('#normal');const summary=normal.locator('summary');
 const height=()=>normal.evaluate(e=>e.getBoundingClientRect().height);
 const closed=await height();
 await summary.click();await page.waitForTimeout(75);const opening=await height();
 await page.waitForTimeout(300);const full=await height();assert(opening>closed&&opening<full);
 await summary.press('Enter');await page.waitForTimeout(75);const closing=await height();assert(closing>closed&&closing<full);
 await page.waitForTimeout(300);assert.equal(await normal.getAttribute('open'),null);assert.equal(await height(),closed);
 await summary.click();await page.waitForTimeout(50);await summary.click();await page.waitForTimeout(50);await summary.click();
 await page.waitForTimeout(350);assert.equal(await height(),full);
 await normal.evaluate(e=>e.open=false);await page.waitForTimeout(50);assert((await height())>closed);await page.waitForTimeout(350);assert.equal(await height(),closed);
 await page.locator('#menu summary').click();await page.waitForTimeout(250);assert(await page.locator('#menu button').isVisible());
 await page.locator('#menu').evaluate(e=>e.open=false);await page.waitForTimeout(250);assert.equal(await page.locator('#menu').getAttribute('open'),null);
 await page.emulateMedia({reducedMotion:'reduce'});await summary.click();assert.equal(await height(),full);await summary.click();assert.equal(await height(),closed);
 assert.deepEqual(errors,[]);console.log('Disclosure motion: opening, closing, keyboard, reversal, external close, dropdown, and reduced motion passed.');
} finally {await browser.close()}
