import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
import vm from 'node:vm'
import {marketplaceReview} from '../supabase/functions/_shared/marketplace-review.ts'
import {validateListing} from '../supabase/functions/_shared/marketplace-rules.ts'

function database(role='superadmin') {
 const tables={profiles:[{id:'actor',role,coach_code:'CODE'}],clients:[{id:'member',profile_id:'actor',status:'active'}],marketplace_profiles:[{coach_id:'coach',name:'Coach',headline:'Coaching for members',bio:'A complete coaching program for members',price_cents:10000,billing_mode:'monthly',published:true,stripe_ready:true,approval_status:'pending',revision:1}]}
 const writes=[]
 const db={auth:{getUser:async()=>({data:{user:{id:'actor'}}})},from(table){
  let filters=[],values,action='select',range=null,single=false
  const run=()=>{
   let rows=(tables[table]||[]).filter(row=>filters.every(fn=>fn(row)))
   if(action==='update'){writes.push(values);rows.forEach(row=>Object.assign(row,values))}
   if(action==='insert'){writes.push(values);tables[table].push(values);rows=[values]}
   if(range)rows=rows.slice(range[0],range[1]+1)
   return {data:single?(rows[0]||null):rows,error:null}
  }
  const q={select(){return q},eq(k,v){filters.push(row=>row[k]===v);return q},in(k,v){filters.push(row=>v.includes(row[k]));return q},order(){return q},limit(n){range=[0,n-1];return q},range(a,b){range=[a,b];return q},update(v){action='update';values=v;return q},insert(v){action='insert';values=v;return q},maybeSingle(){single=true;return Promise.resolve(run())},single(){single=true;return Promise.resolve(run())},then(resolve,reject){return Promise.resolve(run()).then(resolve,reject)}}
  return q
 }}
 return {db,tables,writes}
}
const f=database()
await assert.rejects(()=>marketplaceReview(f.db,{id:'actor',role:'coach'},{action:'admin-review',decision:'approved',revision:1}),/Superadmin/)
await assert.rejects(()=>marketplaceReview(f.db,{id:'actor',role:'superadmin'},{action:'admin-review',coach_id:'coach',decision:'rejected',revision:1}),/reason/)
await assert.rejects(()=>marketplaceReview(f.db,{id:'actor',role:'superadmin'},{action:'admin-review',coach_id:'coach',decision:'approved',revision:2}),/changed/)
await marketplaceReview(f.db,{id:'actor',role:'superadmin'},{action:'admin-review',coach_id:'coach',decision:'approved',revision:1,note:'Approved'})
assert.equal(f.tables.marketplace_profiles[0].reviewed_by,'actor')
assert.equal(f.tables.marketplace_profiles[0].approval_status,'approved')
await marketplaceReview(f.db,{id:'actor',role:'superadmin'},{action:'admin-review',coach_id:'coach',decision:'rejected',revision:1,note:'Credentials need clarification'})
assert.equal(f.tables.marketplace_profiles[0].approval_status,'rejected')

const source=stripTypeScriptTypes(readFileSync('supabase/functions/marketplace/index.ts','utf8').replace(/^import .*\n/gm,''))
async function call(f,input){
 let handler
 class Stripe{static createFetchHttpClient(){};accounts={retrieve:async()=>({})}}
 vm.runInNewContext(source,{serve:fn=>{handler=fn},createClient:()=>f.db,Stripe,Deno:{env:{get:key=>key==='SITE_URL'?'https://example.invalid':'fixture'}},Response,URL,console:{error(){}},marketplaceReview,validateListing,coachConnection:async()=>({stripe_account_id:'acct_fixture'}),directReady:()=>true})
 const response=await handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify(input)}))
 return {status:response.status,body:await response.json()}
}
const client=database('client')
for(const status of ['draft','pending','rejected']){
 client.tables.marketplace_profiles[0].approval_status=status
 assert.equal((await call(client,{action:'list'})).body.coaches.length,0)
 const blocked=await call(client,{action:'checkout',coach_id:'coach'})
 assert.equal(blocked.status,400);assert.match(blocked.body.error,/not currently accepting/)
}
client.tables.marketplace_profiles[0].approval_status='approved'
assert.equal((await call(client,{action:'list'})).body.coaches.length,1)
assert.equal((await call(client,{action:'admin-list',role:'superadmin'})).status,403,'Request body cannot grant admin role')
const coach=database('coach');coach.tables.marketplace_profiles[0].coach_id='actor'
assert.equal((await call(coach,{action:'admin-review',decision:'approved',revision:1,coach_id:'actor'})).status,403)
const forged={...coach.tables.marketplace_profiles[0],coach_id:'someone-else',approval_status:'approved',reviewed_by:'actor'}
const saved=await call(coach,{action:'save',profile:forged})
assert.equal(saved.status,200);assert.equal(coach.writes[0].coach_id,'actor');assert.equal(coach.writes[0].approval_status,undefined);assert.equal(coach.writes[0].reviewed_by,undefined)
assert.equal((await call(coach,{action:'save',profile:{...forged,revision:0}})).status,400)
console.log('PASS Marketplace approval API: superadmin-only review, stale decisions, required feedback, revoke, hidden listings, blocked checkout, forged approval and ownership denial')
