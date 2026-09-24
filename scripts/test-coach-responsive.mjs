import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir} from 'node:fs/promises'
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright')
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true})
await mkdir('outputs/coach-responsive',{recursive:true})
try{
 for(const width of [320,390,430,768,1024,1440,1920,2520]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[]
  page.on('pageerror',e=>errors.push(e.stack || e.message))
  await page.route('**/*.supabase.co/**',r=>r.abort())
  await page.route('**/src/lib/coachWorkspace.js*',async route=>{const response=await route.fetch();const body=(await response.text()).replace(/async function loadWorkspace\(clientId\) \{[\s\S]*?\n\}/, 'async function loadWorkspace() { return [] }');await route.fulfill({response,body})})
  await page.route(/\/$/,r=>r.fulfill({contentType:'text/html',body:`<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"></head><body><div id="root"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>`}))
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:5198');await page.waitForFunction(()=>window.__vite_plugin_react_preamble_installed__)
  await page.evaluate(async(width)=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js'),{default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js')
   const hook=await(await fetch('/src/hooks/useSubscription.js')).text();const {default:store}=await import(hook.match(/from ["']([^"']+)["']/)[1]);window.testStore=store
   for(const f of ['index','software','light-depth','coach-colors','coach-dashboard','software-motion','coach-cards','coach-responsive'])await import(`/src/${f}.css`)
   const {default:Layout}=await import('/src/layouts/CoachLayout.jsx')
   const paths={dashboard:width<768?'mobile/MobileCoachDashboard':'CoachDashboard',clients:width<768?'mobile/MobileClients':'Clients',library:'CoachResources',more:'CoachMore',chat:width<768?'mobile/MobileChat':'CoachChat'}
   const components={};for(const [key,path]of Object.entries(paths))components[key]=(await import(`/src/pages/coach/${path}.jsx`)).default
   const today=new Date().toLocaleDateString('en-CA')
   const clients=Array.from({length:45},(_,i)=>({id:`client-${i}`,name:i?'Client '+i:'Alexandra Montgomery With A Long Name',email:`client${i}@example.com`,status:'active',goals:{calories:2200,protein:160,carbs:250,fat:65},log:{[today]:[{id:'food',name:'Oats',meal:'Breakfast',calories:300,protein:20,carbs:40,fat:7}]},weightLog:[],checkins:[],photos:[],mealPlans:[],tags:[],createdAt:new Date().toISOString()}))
   store.setState({isAuthenticated:true,currentUser:{id:'test-coach',name:'Coach',role:'coach',hasAccess:true},activeRole:'coach',activePage:'dashboard',clients,messages:{},coachProfile:{},customFoods:[],mealPlanTemplates:[],fetchCoachForms:async()=>{},fetchCoachRequests:async()=>{},fetchTargetSchedules:async()=>{},fetchClientSubmissions:async()=>{},fetchMyCoachRequests:async()=>{},fetchClientNote:async()=>'',fetchCheckinQuestions:async()=>[],markCheckinReviewed:async()=>{},fetchMealPlanTemplates:async()=>{},getClientTotalsForDate:()=>({calories:300,protein:20,carbs:40,fat:7})})
   function Harness(){const active=store(s=>s.activePage);const Component=components[active]||components.more;return React.createElement(Layout,null,React.createElement(Component,{key:active}))}
   window.testReact=React;window.testRoot=createRoot(document.getElementById('root'));window.testRoot.render(React.createElement(Harness))
  },width)
  await page.getByRole('button',{name:'Find a client',exact:true}).count() // settle imports
  await page.locator('.coach-roster-row').first().waitFor()
  if(width===1440){
   const surfaces=await page.evaluate(()=>{
    const roster=getComputedStyle(document.querySelector('.coach-roster-cards'))
    const card=getComputedStyle(document.querySelector('.coach-client-card'))
    return {rosterFill:roster.backgroundColor,rosterShadow:roster.boxShadow,cardFill:card.backgroundColor,cardShadow:card.boxShadow,canvas:getComputedStyle(document.querySelector('.coach-shell')).backgroundColor}
   })
   assert.equal(surfaces.rosterFill,'rgba(0, 0, 0, 0)','Roster gaps show the page canvas')
   assert.equal(surfaces.rosterShadow,'none','Roster has no shared panel shadow')
   assert.notEqual(surfaces.cardFill,surfaces.canvas,'Client cards remain distinct from the canvas')
   assert.notEqual(surfaces.cardShadow,'none','Client cards have their own depth')
  }
  const shell = await page.locator('.coach-shell').boundingBox()
  assert.ok(Math.abs(shell.x)<1 && Math.abs(shell.width-width)<1, `${width}: coach shell fills viewport`)
  if(width>=768){
   const main=await page.locator('.coach-main').boundingBox(),board=await page.locator('.dashboard-workboard').boundingBox()
   assert.ok(board.width>=main.width-70, `${width}: dashboard uses available page width`)
  }
  if(width===2520)await page.screenshot({path:`outputs/coach-responsive/dashboard-${width}.png`})
  await page.getByRole('button',{name:/Marketplace notifications/}).click()
  assert.equal(await page.locator('#coach-notification-title').evaluate(el=>getComputedStyle(el).fontSize),'18px')
  assert.equal(await page.locator('.coach-notification-actions button').first().evaluate(el=>getComputedStyle(el).fontSize),'14px')
  await page.getByRole('button',{name:'Close notifications',exact:true}).click()

  assert.equal(await page.locator('.coach-roster-row').count(),20)
  const identity = page.locator('.coach-client-identity').first()
  await identity.hover(); await page.mouse.down(); await page.waitForTimeout(180)
  assert.ok(Number(await page.locator('.coach-client-card').first().evaluate(el=>getComputedStyle(el).scale)) < 1, 'Whole client card responds to press')
  assert.equal(await identity.evaluate(el=>getComputedStyle(el).boxShadow), 'none', 'No inset rectangle on client name')
  await page.mouse.move(0,0); await page.mouse.up()

  await page.getByRole('button',{name:'Next',exact:true}).click();assert.match(await page.locator('.coach-pagination').innerText(),/2\/3/)
  await page.getByRole('button',{name:'Previous',exact:true}).click()
  for(const theme of ['ocean-dark','ocean-light']){
   await page.evaluate(theme=>{document.documentElement.className=theme;window.testStore.setState({theme})},theme)
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width} ${theme}: document overflow`)
  }
  if(width===1440){
   for(const theme of ['ocean-dark','ocean-light']){
    await page.evaluate(theme=>{document.documentElement.className=theme;window.testStore.setState({theme})},theme)
    for(const [active,tone] of [['dashboard','amber'],['clients','blue'],['chat','teal'],['library','sage'],['foods','sage'],['forms','lavender'],['more','lavender'],['profile','lavender']]){
     await page.evaluate(active=>window.testStore.getState().setActivePage(active),active)
     await page.waitForFunction(({active,tone})=>{
      const shell=document.querySelector('.coach-shell')
      const button=shell?.querySelector('.coach-sidebar nav button[aria-current=page]')
      if(!button||shell.dataset.coachPage!==active)return false
      const heading=button.closest('section')?.querySelector('.coach-sidebar-heading')
      const sample=document.createElement('span');sample.style.color=`var(--coach-${tone})`;shell.append(sample)
      const matches=getComputedStyle(heading).color===getComputedStyle(sample).color
      sample.remove();return matches
     },{active,tone})
     await page.waitForFunction(()=>{
      const headings=[...document.querySelectorAll('.coach-sidebar nav .coach-sidebar-heading')]
      const sample=document.createElement('span');sample.style.color='var(--color-muted)';headings[0].closest('.coach-shell').append(sample)
      const muted=getComputedStyle(sample).color;sample.remove()
      return headings.filter(h=>!h.parentElement.querySelector('button[aria-current=page]')).every(h=>getComputedStyle(h).color===muted)
     })
    }
   }
   await page.evaluate(()=>window.testStore.getState().setActivePage('dashboard'))
  }
  await page.evaluate(()=>{window.testStore.getState().setViewingClientId('client-0','overview');window.testStore.getState().setActivePage('clients')})
  await page.getByRole('navigation',{name:'Client sections'}).waitFor()
  if(width>=768){
   const main=await page.locator('.coach-main').boundingBox(),detail=await page.locator('.coach-client-detail').boundingBox()
   assert.ok(Math.abs(detail.x-main.x)<1 && detail.width>=main.width-20, `${width}: client detail fills main area`)
  }
  if(width<768){
   await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:420});Object.defineProperty(visualViewport,'offsetTop',{configurable:true,value:180});visualViewport.dispatchEvent(new Event('resize'));visualViewport.dispatchEvent(new Event('scroll'))})
   await page.waitForTimeout(80)
   const bounds=await page.locator('.coach-client-detail').evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom}})
   assert.ok(Math.abs(bounds.top-180)<2,'Editor follows keyboard viewport pan')
   assert.ok(Math.abs(bounds.bottom-600)<2,'Editor reaches visible keyboard boundary')
   await page.evaluate(()=>{delete visualViewport.height;delete visualViewport.offsetTop;visualViewport.dispatchEvent(new Event('resize'));visualViewport.dispatchEvent(new Event('scroll'))})
   await page.waitForTimeout(80)
  }

  await page.getByText('Client brief & follow-ups',{exact:true}).click()
  await page.getByRole('button',{name:'Update brief',exact:true}).click()
  const reviewDate=page.getByLabel('Next review date',{exact:true})
  await reviewDate.fill('2026-12-31')
  assert.equal(await reviewDate.evaluate(el=>{const field=el.getBoundingClientRect(),label=el.parentElement.getBoundingClientRect();return field.left>=label.left-1&&field.right<=label.right+1}),true,`${width}: review date stays within label`)
  await page.getByRole('button',{name:'Discard draft',exact:true}).click()
  await page.getByRole('button',{name:'Journal',exact:true}).click()
  await page.getByRole('heading',{name:'Client journal',exact:true}).waitFor()
  assert.equal(await page.locator('.coach-client-detail').evaluate(n=>n.scrollWidth>n.clientWidth),false,`${width}: client detail overflow`)
  if(width===1440)assert.notEqual(await page.locator('.coach-client-detail .cw-panel').first().evaluate(n=>getComputedStyle(n).boxShadow),'none','Client workspace cards have depth')
  await page.evaluate(()=>document.fonts.ready)
  if(width===390||width===1440||width===2520)await page.screenshot({path:`outputs/coach-responsive/journal-${width}.png`})
  await page.getByRole('button',{name:'Check-ins',exact:true}).click();await page.getByText('NO CHECK-IN YET').waitFor()
  await page.getByRole('button',{name:'Photos',exact:true}).click()
  await page.evaluate(()=>window.testStore.setState({sendMessage:async()=>({ok:false})}))
  await page.getByRole('button',{name:'Request progress photos',exact:true}).click()
  await page.getByRole('alert').filter({hasText:'Could not send the request'}).waitFor()
  await page.evaluate(()=>window.testStore.setState({sendMessage:async(id,from,text)=>{window.photoRequest={id,from,text};return {ok:true}}}))
  await page.getByRole('button',{name:'Request progress photos',exact:true}).click()
  assert.equal(await page.getByRole('button',{name:'Request sent',exact:true}).isDisabled(),true)
  const request = await page.evaluate(()=>window.photoRequest)
  assert.equal(request.id,'client-0');assert.equal(request.from,'coach');assert.match(request.text,/requested updated progress photos/)
  if(await page.locator('.coach-section-more summary').isVisible())await page.locator('.coach-section-more summary').click()
  await page.getByRole('button',{name:'Notes & tasks',exact:true}).filter({visible:true}).click()
  await page.getByRole('button',{name:'Tasks',exact:true}).click();await page.getByRole('button',{name:'New follow-up'}).waitFor()
  await page.evaluate(()=>window.testStore.getState().setActivePage('library'));await page.getByRole('heading',{name:'Library',exact:true}).waitFor()
  if(width===1440)assert.notEqual(await page.locator('.coach-resource-grid>button').first().evaluate(n=>getComputedStyle(n).boxShadow),'none','Library cards have depth')
  await page.evaluate(()=>window.testStore.getState().setActivePage('more'));await page.getByRole('heading',{name:'Settings',exact:true,level:1}).waitFor()
  if(width===390 || width===1440){
    await page.evaluate(async()=>{
      const {Composer}=await import('/src/components/ChatKit.jsx')
      window.testRoot.render(window.testReact.createElement(Composer,{clientId:'client-0',onSendText:async()=>({ok:false,error:'Test save failed; retry'}),onSendAttachment:async()=>({ok:true})}))
    })
    await page.getByRole('textbox',{name:'Message',exact:true}).fill('Keep this draft')
    await page.getByRole('button',{name:'Send',exact:true}).click()
    await page.getByRole('alert').waitFor()
    assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).inputValue(),'Keep this draft')
    await page.evaluate(async()=>{
      const {Composer}=await import('/src/components/ChatKit.jsx')
      window.testRoot.render(window.testReact.createElement(Composer,{clientId:'client-0',onSendText:async()=>({ok:true}),onSendAttachment:async()=>({ok:true})}))
    })
    await page.getByRole('button',{name:'Send',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('textarea').value==='')
    await page.evaluate(async()=>{
      const {default:Editor}=await import('/src/pages/coach/MealPlanBuilder.jsx')
      window.testRoot.render(window.testReact.createElement(Editor,{client:window.testStore.getState().clients[0],onSave:async()=>{throw Error('Test save failed')},onClose:()=>{}}))
    })
    await page.getByLabel('Plan name').count()
    await page.locator('#meal-plan-name').fill('Draft plan')
    await page.getByRole('button',{name:'SAVE PLAN',exact:true}).click()
    await page.getByRole('alert').waitFor()
    assert.equal(await page.locator('#meal-plan-name').inputValue(),'Draft plan')
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    console.log(`PASS ${width}px: failed messages and meal plans preserve drafts; message retry clears only on success.`)
  }
  assert.deepEqual(errors,[],`${width}: browser errors`)
  console.log(`PASS ${width}px: roster pagination, client sections, Journal, Check-ins, Tasks, Library and Account; both themes.`)
  await page.close()
 }
}finally{await browser.close()}
