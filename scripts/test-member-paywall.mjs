import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({viewport:{width:390,height:844}})
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.route('**/*.supabase.co/**', route => route.abort())
  await page.route(/\/$/, route => route.fulfill({contentType:'text/html',body:`<html><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>`}))
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5198')
  await page.waitForFunction(()=>window.__vite_plugin_react_preamble_installed__)
  await page.evaluate(async () => {
    const {default:React} = await import('/node_modules/.vite/deps/react.js')
    const {default:{createRoot}} = await import('/node_modules/.vite/deps/react-dom_client.js')
    const hookSource=await (await fetch('/src/hooks/useSubscription.js')).text()
    const storeUrl=hookSource.match(/from ["']([^"']+)["']/)[1]
    const {default:store} = await import(storeUrl)
    document.getElementById('root').style.display = 'none'
    const host = document.createElement('div'); host.id='paywall-test';document.body.append(host)
    window.testRoot = createRoot(host);window.testReact=React;window.testStore=store
    store.setState({fetchMyCoachRequests:async()=>{},activeClientId:'test', clients:[{id:'test',name:'Test',goals:{},log:{},weightLog:[{id:'weight',value:180,unit:'lbs',date:'2026-09-14'}]}]})
  })
  for (const [component,title,proText] of [
    ['ClientWeight','WEIGHT & ANALYTICS','HISTORY'],
    ['ClientProgress','PROGRESS ANALYTICS','CALORIE TREND'],
    ['ClientProfile','30-DAY ANALYTICS','CALORIE TREND'],
  ]) {
    for (const hasAccess of [false,true,false]) {
      await page.evaluate(async ({component,hasAccess}) => {
        window.testStore.setState({currentUser:{id:'test',name:'Test',role:'client',hasAccess,subscriptionStatus:hasAccess?'active':'inactive'}})
        const {default:Component}=await import(`/src/pages/client/${component}.jsx`)
        window.testRoot.render(window.testReact.createElement(Component))
      },{component,hasAccess})
      if(hasAccess) await page.locator('#paywall-test').getByText(proText,{exact:true}).waitFor()
      else {
        await page.locator('#paywall-test').getByText(title,{exact:true}).waitFor()
        assert.equal(await page.locator('#paywall-test').getByText(proText,{exact:true}).count(),0)
      }
    }
  }
  const result=await page.evaluate(async()=>{
    const store=window.testStore
    const before=JSON.stringify(store.getState().clients)
    const add=await store.getState().addClientWeight('test',{value:190,date:'2026-09-15'})
    const remove=await store.getState().removeClientWeight('test','weight')
    return {add:add.ok,remove:remove.ok,unchanged:before===JSON.stringify(store.getState().clients),page:store.getState().activePage}
  })
  assert.deepEqual(result,{add:false,remove:false,unchanged:true,page:'upgrade'})
  assert.deepEqual(errors,[])
  console.log('PASS: free/Pro/downgrade weight, progress and profile gates; blocked weight mutations preserve history.')
} finally { await browser.close() }

if(process.env.PGLITE_MODULE) {
  const {PGlite}=require(process.env.PGLITE_MODULE)
  const db=new PGlite()
  await db.exec(`
    create role authenticated; create role anon;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select '00000000-0000-0000-0000-000000000001'::uuid $$;
    create table public.profiles(id uuid,role text,admin_override text,subscription_status text);
    create table public.weight_log(id integer, value numeric);
    create table public.checkins(id integer, weight numeric);
    insert into profiles values ('00000000-0000-0000-0000-000000000001','client',null,'inactive');
    alter table weight_log enable row level security; alter table checkins enable row level security;
    create policy ownership_fixture on weight_log for all to authenticated using(true) with check(true);
    create policy ownership_fixture on checkins for all to authenticated using(true) with check(true);
    grant usage on schema auth to authenticated;
    grant select on profiles to authenticated;
    grant all on weight_log,checkins to authenticated;
    insert into weight_log values(1,180);
  `)
  await db.exec(readFileSync(new URL('../supabase/migrations/20260915235944_member_weight_paywall.sql',import.meta.url),'utf8'))
  for(const [role,status,override,allowed] of [
    ['client','inactive',null,false],['client','active',null,true],['client','trialing',null,true],
    ['client','canceled',null,false],['client','past_due',null,false],
    ['client','active','locked',false],['client','inactive','unlocked',true],
    ['coach','inactive',null,true],['superadmin','inactive',null,true],
  ]) {
    await db.query('update profiles set role=$1,subscription_status=$2,admin_override=$3',[role,status,override])
    await db.exec('set role authenticated')
    assert.equal((await db.query('select * from weight_log')).rows.length,allowed?1:0)
    for(const sql of ['insert into weight_log values(2,190)','insert into checkins values(2,190)']) {
      if(allowed) await db.exec(sql)
      else await assert.rejects(db.exec(sql), /row-level security/)
    }
    await db.exec('insert into checkins values(3,null)')
    if(!allowed) await assert.rejects(db.exec('update checkins set weight=195 where id=3'), /row-level security/)
    await db.exec('reset role;delete from weight_log where id=2;delete from checkins;')
  }
  await db.close()
  console.log('PASS: database paywall migration across nine entitlement states; free check-ins allowed, weight bypass blocked.')
}
