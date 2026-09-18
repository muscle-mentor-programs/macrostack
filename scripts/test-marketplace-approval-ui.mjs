import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser=await chromium.launch({channel:'chrome',headless:true})
try {for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/*.supabase.co/**',route=>route.abort())
 await page.route('**/src/lib/marketplace.js*',route=>route.fulfill({contentType:'application/javascript',body:"export async function marketplace(action,values){return window.mockMarketplace(action,values)};export function coachingPrice(p){return '$'+p.price_cents/100+' / month'}"}))
 await page.route(/\/$/,route=>route.fulfill({contentType:'text/html',body:`<html><body><div id="root"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>`}))
 await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5199');await page.waitForFunction(()=>window.__vite_plugin_react_preamble_installed__)
 await page.evaluate(async()=>{
  const {default:React}=await import('/node_modules/.vite/deps/react.js'),{default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js')
  for(const css of ['index','software','coach-responsive'])await import(`/src/${css}.css`)
  const {default:Queue}=await import('/src/components/MarketplaceReviewQueue.jsx')
  window.row={coach_id:'test-coach',name:'Test Coach',headline:'Nutrition coaching',bio:'A detailed nutrition coaching program for members.',specialties:'Nutrition',credentials:'Test qualification',price_cents:10000,billing_mode:'monthly',published:true,stripe_ready:true,approval_status:'pending',revision:1}
  window.mockMarketplace=async(action,input={})=>{
   if(action==='admin-list')return {profiles:row.approval_status===input.status?[{...row}]:[],hasMore:false}
   if(action==='admin-review'){if(window.failReview)throw Error('Profile changed. Refresh and review again.');row={...row,approval_status:input.decision,review_note:input.note,revision:row.revision+1};return {profile:row}}
   if(action==='my-profile')return {profile:row}
   if(action==='save'){row={...input.profile,approval_status:input.profile.published?'pending':'draft',revision:row.revision+1};return {profile:row}}
  }
  window.testRoot=createRoot(document.getElementById('root'));window.React=React;testRoot.render(React.createElement(Queue))
 })
 await page.locator('summary').click()
 assert.equal(await page.getByRole('button',{name:'Request changes',exact:true}).isDisabled(),true)
 await page.getByRole('button',{name:'Approve profile',exact:true}).click()
 await page.getByText('Test Coach approved.',{exact:false}).waitFor()
 await page.getByRole('button',{name:'Approved',exact:true}).click();await page.locator('summary').click()
 await page.getByLabel('Feedback for Test Coach').fill('Please clarify the credentials listed.')
 await page.getByRole('button',{name:'Revoke approval',exact:true}).click()
 await page.getByText('Test Coach hidden from the Marketplace.',{exact:false}).waitFor()
 await page.getByRole('button',{name:'Changes requested',exact:true}).click();await page.locator('summary').click()
 await page.getByText('Previous feedback: Please clarify the credentials listed.').waitFor()
 await page.evaluate(()=>{row.approval_status='pending';window.failReview=true})
 await page.getByRole('button',{name:'Pending review',exact:true}).click();await page.locator('summary').click()
 await page.getByRole('button',{name:'Approve profile',exact:true}).click();await page.getByRole('alert').waitFor()
 assert.equal(await page.getByRole('button',{name:'Refresh reviews',exact:true}).isEnabled(),true)
 await page.evaluate(async()=>{const {default:Setup}=await import('/src/pages/coach/MarketplaceSetup.jsx');testRoot.render(React.createElement(Setup))})
 await page.getByText('Pending superadmin review',{exact:true}).waitFor()
 await page.getByRole('button',{name:'Submit for review',exact:true}).click()
 await page.getByText('Submitted for superadmin review. Your profile stays hidden until approved.',{exact:true}).waitFor()
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false)
 assert.deepEqual(errors,[])
 console.log(`PASS ${width}px review/approve/revoke/feedback/stale-error flow and coach submission status`)
 await page.close()
}}finally{await browser.close()}
