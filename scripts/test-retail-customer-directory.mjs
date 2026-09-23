import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try {for(const width of [390,1440]) {
 const page=await browser.newPage({viewport:{width,height:950}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/directory-fixture',r=>r.fulfill({contentType:'text/html',body:`<div id="root"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script>`}));
 await page.goto('http://127.0.0.1:5198/directory-fixture');
 await page.evaluate(async()=>{const {default:R}=await import('/node_modules/.vite/deps/react.js');const {default:D}=await import('/node_modules/.vite/deps/react-dom_client.js');await import('/src/index.css');await import('/src/retail/retail.css');const {brandStyle}=await import('/src/retail/brandColors.js');const {default:Directory}=await import('/src/retail/CustomerDirectory.jsx');window.mount=()=>{D.createRoot(document.getElementById('root')).render(R.createElement('main',{className:'retail',style:{...brandStyle({}),padding:24}},R.createElement(Directory,{customers:[{id:'customer',name:'Alexandra Customer With A Longer Name',email:'alexandra.customer@example.invalid',assigned_to:'employee',status:'active'},{id:'other',name:'Taylor Customer',email:'taylor@example.invalid',status:'invited'}],employees:[{user_id:'employee',name:'Jordan Specialist'}],user:{id:'self'},onOpen:(c,t)=>{window.opened={id:c.id,tab:t}}})));};window.mount();});
 await page.getByRole('button',{name:'List',exact:true}).click();await page.locator('.customer-list-row').first().waitFor();
 assert.equal(await page.getByText('Jordan Specialist',{exact:true}).count(),1);
 assert.equal(await page.getByText('Unassigned',{exact:true}).count(),1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.waitForTimeout(250);assert.equal(await page.getByRole('button',{name:'List',exact:true}).getAttribute('aria-pressed'),'true');
 await page.screenshot({path:`/tmp/retail-customer-list-${width}.png`});
 await page.locator('.customer-list-row .retail-customer-open').first().click();assert.deepEqual(await page.evaluate(()=>window.opened),{id:'customer',tab:'Overview'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('macrostack:retail:customer-layout')),'list');
 await page.getByRole('button',{name:'Cards',exact:true}).click();await page.locator('.retail-customer-card').first().waitFor();await page.getByRole('button',{name:'Nutrition',exact:true}).first().click();assert.equal((await page.evaluate(()=>window.opened)).tab,'Plan');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 console.log(`PASS customer list/cards ${width}px: identities, assigned employee, navigation, preference, overflow`);await page.close();
}}finally{await browser.close()}
