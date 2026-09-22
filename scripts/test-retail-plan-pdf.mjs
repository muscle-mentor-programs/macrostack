import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const origin='http://127.0.0.1:5198';
await mkdir('outputs/retail',{recursive:true});
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/retail/api.js*',route=>route.fulfill({contentType:'application/javascript',body:`export async function removeMealPlan(){window.planRemoved=true} export async function storeBranding(){window.brandFetches=(window.brandFetches||0)+1;return window.currentBrand} export function brandLogoURL(){return '/email/macrostack-wordmark.png'}`}));
  await page.route('**/qa-plan',route=>route.fulfill({contentType:'text/html',body:'<html class="ocean-dark"><body><div id="root"></div></body></html>'}));
  await page.goto(origin+'/qa-plan');
  await page.evaluate(async()=>{
   const refresh=await import('/@react-refresh');refresh.default.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
   await import('/src/index.css');await import('/src/retail/retail.css');
   const {default:React}=await import('/node_modules/.vite/deps/react.js');const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');const {default:Plan}=await import('/src/retail/PublishedPlan.jsx');
   const item={name:'Chipotle chicken avocado sandwich with fresh vegetables',quantity:1,servingUnit:'sandwich',calories:690,protein:42,carbs:63,fat:28};
   window.plan={id:'plan',plan_name:'Personalized nutrition plan',active:true,can_remove:true,days:[{label:'Day 1',meals:{Lunch:[item],Breakfast:[{...item,name:'Greek yogurt with berries',calories:320}],Dinner:[{...item,name:'Chicken, rice and greens'}],Snack:[{...item,name:'Whole almonds',quantity:2,servingUnit:'1 oz'}]}},{label:'Day 2',meals:{Lunch:Array.from({length:45},(_,i)=>({...item,name:`Meal ${i+1}: ${item.name}`}))}}]};
   window.currentBrand={name:'Peak Nutrition',logo_path:'test',brand_colors:{primary:'#D895A8',secondary:'#79BCA4'}};
   ReactDOM.createRoot(document.getElementById('root')).render(React.createElement('div',{className:'retail',style:{padding:20}},React.createElement(Plan,{plan:window.plan,staff:true,relationship:{location_id:'location',name:'Alexandra Montgomery'}})));
  });
  await page.getByRole('heading',{name:'Personalized nutrition plan'}).waitFor();
  assert.equal(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`outputs/retail/published-plan-${width}.png`,fullPage:true});
  const [download]=await Promise.all([page.waitForEvent('download',{timeout:15000}).catch(async e=>{throw new Error(e.message+' '+await page.locator('body').innerText())}),page.getByRole('button',{name:'Download PDF'}).click()]);
  await download.saveAs(`outputs/retail/store-plan-${width}.pdf`);
  assert.equal(await page.evaluate(()=>window.brandFetches),1);
  await page.getByRole('button',{name:'Download PDF'}).waitFor();
  await page.evaluate(()=>{window.currentBrand={...window.currentBrand,name:'Updated Store',brand_colors:{primary:'#9988CC',secondary:'#BB9988'}}});
  const [updated]=await Promise.all([page.waitForEvent('download',{timeout:15000}).catch(async e=>{throw new Error(e.message+' '+await page.locator('body').innerText())}),page.getByRole('button',{name:'Download PDF'}).click()]);await updated.saveAs(`outputs/retail/store-plan-updated-${width}.pdf`);
  assert.equal(await page.evaluate(()=>window.brandFetches),2);
  await page.getByRole('button',{name:'Day 2',exact:true}).click();assert.equal(await page.locator('.retail-plan-meal li').count(),45);
  await page.getByRole('button',{name:'Remove plan',exact:true}).click();
  await page.getByRole('button',{name:'Confirm removal'}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>window.planRemoved),true);
  assert.deepEqual(errors,[]);console.log(`PASS retail published layout, day navigation and freshly branded PDF download ${width}px`);await page.close();
 }
}finally{await browser.close()}
