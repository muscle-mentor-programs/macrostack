import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright')
const browser=await chromium.launch({channel:'chrome',headless:true})
try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}})
 let fail=true,activations=0,loadFixtures=false
 await page.route('**/src/lib/supabase.js*',async route=>{const response=await route.fetch();const body=(await response.text()).replace(/const supabaseUrl[^\n]+/,"const supabaseUrl = 'https://activation-test.supabase.co';").replace(/const supabaseAnonKey[^\n]+/,"const supabaseAnonKey = 'fixture-key';");await route.fulfill({response,body})})
 const profile={id:'member-one',name:'Existing Member',role:'coach',dual_role:true,coach_code:'MEMBER01',subscription_status:'inactive',member_subscription:{subscription_status:'active',subscription_plan:'annual'}}
 await page.route('**/*.supabase.co/**',async route=>{
  if(route.request().url().endsWith('/rpc/activate_coach_workspace')){activations++;return route.fulfill({status:fail?400:200,contentType:'application/json',body:fail?JSON.stringify({message:'Activation test failed'}):'null'})}
  if(route.request().url().endsWith('/rpc/get_my_account'))return route.fulfill({contentType:'application/json',body:JSON.stringify([profile])})
  if(loadFixtures){const table=new URL(route.request().url()).pathname.split('/').pop();const data={clients:[{id:'own',profile_id:'member-one',coach_id:'external',name:'Existing Member'},{id:'roster',profile_id:'other',coach_id:'member-one',name:'Coached Member'}],messages:[{id:'own-message',client_id:'own'},{id:'roster-message',client_id:'roster'}],food_log:[{id:'food',client_id:'own',date:'2026-09-17',name:'Original food',calories:100}],coach_requests:[{id:'member-request',client_profile_id:'member-one',coach_id:'external'},{id:'coach-request',client_profile_id:'other',coach_id:'member-one'}]};return route.fulfill({contentType:'application/json',body:JSON.stringify(data[table]||[])})}
  return route.abort()
 })
 await page.route(/\/$/,r=>r.fulfill({contentType:'text/html',body:`<html><body><div id="activation-test"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>`}))
 await page.goto('http://127.0.0.1:5198');await page.waitForFunction(()=>window.__vite_plugin_react_preamble_installed__)
 await page.evaluate(async()=>{
  const {default:React}=await import('/node_modules/.vite/deps/react.js');const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');const {createRoot}=ReactDOM
  const hook=await(await fetch('/src/hooks/useSubscription.js')).text();const {default:store}=await import(hook.match(/from ["']([^"']+)["']/)[1]);const {default:Activation}=await import('/src/components/CoachActivation.jsx');window.testStore=store
  window.realLoadAllData=store.getState().loadAllData
  const own={id:'own',profileId:'member-one',coachId:'external-coach',name:'Existing Member',log:{today:[{name:'Existing food'}]},goals:{}}
  store.setState({currentUser:{id:'member-one',role:'client',name:'Existing Member',email:'same@example.com',hasAccess:true},activeRole:'client',activeClientId:'own',clients:[own],loadCoachProfile:async()=>{},loadAllData:async()=>{const s=store.getState();store.setState({clients:s.activeRole==='client'?[own]:[]})}})
  const activate=store.getState().activateCoach;store.setState({activateCoach:async()=>{try{return await activate()}catch(e){window.activationError=e.stack;throw e}}})
  await import('/src/index.css');createRoot(document.getElementById('activation-test')).render(React.createElement(Activation))
 })
 await page.getByRole('button',{name:'Activate coach profile'}).click();await page.getByRole('alert').waitFor()
 assert.equal(await page.evaluate(()=>testStore.getState().currentUser.role),'client')
 fail=false
 await page.getByRole('button',{name:'Activate coach profile'}).click()
 await page.waitForFunction(()=>testStore.getState().activePage==='upgrade',{},{timeout:10000}).catch(async error=>{console.log(await page.locator('body').innerText(), await page.evaluate(()=>({error:window.activationError,role:testStore.getState().currentUser?.role,page:testStore.getState().activePage})));throw error})
 assert.equal(activations,2)
 assert.deepEqual(await page.evaluate(()=>{const s=testStore.getState();return [s.activeRole,s.clients.length,s.currentUser.memberSubscription.hasAccess,s.currentUser.hasAccess]}),['coach',0,true,false])
 await page.evaluate(()=>testStore.getState().setActiveRole('client'))
 assert.deepEqual(await page.evaluate(()=>{const s=testStore.getState();return [s.activeClientId,s.clients[0].log.today[0].name,s.currentUser.email]}),['own','Existing food','same@example.com'])
 await page.getByRole('button',{name:'Open coach portal'}).click();await page.waitForFunction(()=>testStore.getState().activeRole==='coach'&&!testStore.getState().authLoading)
 assert.equal(activations,2,'Switching back never activates twice')
 loadFixtures=true
 await page.evaluate(async()=>{testStore.setState({loadAllData:window.realLoadAllData,subscribeToMessages:()=>{}});await testStore.getState().loadAllData()})
 assert.deepEqual(await page.evaluate(()=>[testStore.getState().clients.map(c=>c.id),Object.keys(testStore.getState().messages),testStore.getState().coachRequests.map(r=>r.id)]),[['roster'],['roster'],['coach-request']])
 await page.evaluate(()=>testStore.getState().setActiveRole('client'))
 assert.deepEqual(await page.evaluate(()=>[testStore.getState().clients.map(c=>c.id),Object.keys(testStore.getState().messages),testStore.getState().coachRequests.map(r=>r.id)]),[['own'],['own'],['member-request']])
 console.log(`PASS ${width}px activation failure/retry, separate entitlements, original member data, portal switching`)
 await page.close()
}}finally{await browser.close()}
