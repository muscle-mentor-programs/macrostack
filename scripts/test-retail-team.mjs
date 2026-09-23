import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const fixture = `
window.teamData={members:[{id:'employee',user_id:'person',organization_id:'org',location_id:'store',role:'specialist',access_role:'associate',permissions:{},revision:1,active:true,name:'Jordan Example',email:'jordan@sample.invalid',location_name:'Downtown Store'}],invitations:[],activity:[]};
window.teamActions=[];
export async function teamDirectory(){return structuredClone(window.teamData)}
export async function teamImpact(){return {customers:2,tasks:1,conversations:1}}
export async function teamCommand(action,payload){window.teamActions.push({action,payload});if(action==='invite'){const invite={id:'invited',email:payload.email,location_ids:payload.location_ids,role:'specialist',access_role:payload.access_role,expires_at:new Date(Date.now()+86400000).toISOString()};window.teamData.invitations.push(invite);return invite;}if(action==='suspend'){window.teamData.members[0].active=false;window.teamData.members[0].revision++;return window.teamData.members[0]}return {id:payload.id||'employee'}}
`;
try {
 for (const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/retail/teamApi.js*',r=>r.fulfill({contentType:'text/javascript',body:fixture}));
  await page.route('**/src/retail/accountEmail.js*',r=>r.fulfill({contentType:'text/javascript',body:'export async function accountEmail(){return true}'}));
  await page.route('**/team-fixture',r=>r.fulfill({contentType:'text/html',body:'<div id="root"></div><script type="module">import R from "/@react-refresh";R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script>'}));
  await page.goto('http://127.0.0.1:5198/team-fixture');await page.waitForFunction(()=>window.__vite_plugin_react_preamble_installed__);
  await page.evaluate(async()=>{const {default:R}=await import('/node_modules/.vite/deps/react.js');const {default:D}=await import('/node_modules/.vite/deps/react-dom_client.js');await import('/src/index.css');await import('/src/retail/retail.css');const {default:Team}=await import('/src/retail/Team.jsx');D.createRoot(document.getElementById('root')).render(R.createElement('main',{className:'retail',style:{padding:'24px'}},R.createElement(Team,{organizationId:'org',location:{id:'store'},locations:[{id:'store',name:'Downtown Store'},{id:'other',name:'Uptown Store'}],operators:[],corporate:true})));});
  await page.getByText('Jordan Example').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Invite employee'}).click();
  const modal=page.getByRole('dialog');await modal.getByLabel('Work email').fill('alex@sample.invalid');
  await modal.getByRole('combobox',{name:'Role'}).selectOption('associate');
  await modal.getByText('Uptown Store').click();
  await modal.getByRole('button',{name:'Review access →'}).click();
  await modal.getByRole('button',{name:'Send invitation'}).click();
  await modal.waitFor({state:'hidden'});
  const invite=await page.evaluate(()=>window.teamActions.find(x=>x.action==='invite'));
  assert.deepEqual(invite.payload.location_ids.sort(),['store','other'].sort());
  await page.getByRole('button',{name:'Manage access'}).click();
  await page.getByRole('button',{name:'Suspend access'}).click();
  await modal.getByText('Move open work to the unassigned queue').click();
  await modal.getByRole('button',{name:'Suspend access'}).click();
  await modal.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>window.teamActions.some(x=>x.action==='suspend'&&x.payload.confirm_unassigned)),true);
  assert.deepEqual(errors,[]);
  console.log(`PASS team ${width}px: directory, multi-store invite, access review, suspension and reassignment`);
  await page.close();
 }
} finally { await browser.close(); }
