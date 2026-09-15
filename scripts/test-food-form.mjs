import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir} from 'node:fs/promises'
import {validServingSize,validFoodForm} from '../src/lib/foodFormValidation.js'
for(const value of ['', '0', '-1', '3.335545365857573e+50', '3335545365857573', 'Infinity', 'NaN']) assert.equal(validServingSize(value),false)
for(const value of ['33','33.5','0.25','10000']) assert.equal(validServingSize(value),true)
assert.equal(validFoodForm({name:'Food',servingSize:'33',calories:'Infinity'}),false)
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const browser=await chromium.launch({channel:'chrome',headless:true})
await mkdir('outputs/food-form',{recursive:true})
try {
for(const width of [320,390,768]) for(const kind of ['scan','custom','mobile']) {
 const page=await browser.newPage({viewport:{width,height:844}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('https://world.openfoodfacts.org/**',route=>route.fulfill({json:{status:1,product:{product_name:'Whey Protein Rich Chocolate',brands:'Equate',serving_quantity:33,nutriments:{'energy-kcal_serving':110,proteins_serving:24,carbohydrates_serving:2,fat_serving:1}}}}))
 await page.goto('http://127.0.0.1:5199/__food-form-qa?kind='+kind)
 const amount=page.getByLabel('Amount',{exact:true});await amount.waitFor()
 const box=await amount.boundingBox();assert.ok(box.width>=110,`Amount too narrow: ${width}/${kind}: ${box.width}`)
 assert.equal(await amount.getAttribute('inputmode'),'decimal')
 await amount.fill('33.5');assert.equal(await amount.inputValue(),'33.5')
 await page.setViewportSize({width,height:430});await amount.focus()
 await page.waitForTimeout(150)
 const keyboardBox=await amount.boundingBox();const header=await page.locator('.food-form-panel > div').first().boundingBox();assert.ok(keyboardBox.y>=header.y+header.height&&keyboardBox.y+keyboardBox.height<=430, 'Focused amount must be visible below the header and above the keyboard')
 await page.screenshot({path:`outputs/food-form/keyboard-${kind}-${width}.png`})
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 const save=page.getByRole('button',{name:kind==='scan'?'ADD TO DATABASE':'SAVE CHANGES'})
 for(const bad of ['0','3.335545365857573e+50','999999999999999999999']) {
  await amount.fill(bad);assert.equal(await save.isDisabled(),true);await page.getByRole('alert').waitFor()
 }
 await amount.fill('33.5');assert.equal(await save.isEnabled(),true)
 await page.setViewportSize({width,height:844})
 await amount.evaluate(el=>el.scrollIntoView({block:'center'}))
 await page.screenshot({path:`outputs/food-form/${kind}-${width}.png`})
 await save.click();assert.equal(await page.evaluate(()=>window.savedFood.servingSize),33.5)
 assert.deepEqual(errors,[])
 await page.close();console.log(`PASS ${kind} ${width}px: visible decimal input, keyboard viewport, invalid amount blocked, exact saved amount`)
}
for(const kind of ['custom','mobile']) {
 const page=await browser.newPage({viewport:{width:390,height:844}})
 await page.goto('http://127.0.0.1:5199/__food-form-qa?kind='+kind+'&corrupt=1')
 const save=page.getByRole('button',{name:'SAVE CHANGES'})
 assert.equal(await save.isDisabled(),true)
 await page.getByLabel('Amount',{exact:true}).fill('33.5')
 assert.equal(await page.getByLabel('CALORIES',{exact:true}).inputValue(),'110')
 assert.equal(await page.getByLabel('PROTEIN',{exact:true}).inputValue(),'24')
 await save.click()
 assert.deepEqual(await page.evaluate(()=>({size:window.savedFood.servingSize,calories:window.savedFood.calories,protein:window.savedFood.protein})),{size:33.5,calories:110,protein:24})
 await page.close();console.log('PASS '+kind+': correcting corrupt serving size preserves nutrition')
}
const logPage=await browser.newPage({viewport:{width:390,height:844}})
await logPage.goto('http://127.0.0.1:5199/__food-form-qa?kind=log')
await logPage.getByText('Serving size needs correction',{exact:true}).click()
await logPage.getByText('This saved serving size is invalid.',{exact:false}).waitFor()
assert.equal(await logPage.getByLabel('Logged grams').isDisabled(),true)
assert.equal(await logPage.getByRole('button',{name:'SAVE',exact:true}).isDisabled(),true)
assert.equal(await logPage.evaluate(()=>window.logWrite),undefined)
await logPage.close()
console.log('PASS corrupt log: invalid gram conversion blocked without writing zero nutrition')
} finally {await browser.close()}
