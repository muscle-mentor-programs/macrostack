import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
import vm from 'node:vm'

const source=readFileSync('supabase/functions/create-checkout-session/index.ts','utf8').replace(/^import .*\n/gm,'')
const js=stripTypeScriptTypes(source)
async function checkout(profile,audience,plan){
 let handler,session
 const query={select(){return this},eq(){return this},single:async()=>({data:profile})}
 class Stripe{static createFetchHttpClient(){};checkout={sessions:{create:async input=>{session=input;return {url:'https://checkout.example.invalid'}}}}}
 vm.runInNewContext(js,{Deno:{env:{get:()=> 'fixture'}},Stripe,createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'one',email:'member@example.invalid'}}})},from:()=>query}),serve:fn=>{handler=fn},Response,console})
 const response=await handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify({audience,plan,returnUrl:'https://example.invalid'})}))
 return {status:response.status,body:await response.json(),session}
}
const member={stripe_subscription_id:'sub_member',subscription_status:'active'}
const profile={role:'coach',dual_role:true,stripe_customer_id:'cus_existing',subscription_status:'inactive',member_subscription:member}
let result=await checkout(profile,'coach','t_2_10')
assert.equal(result.status,200);assert.equal(result.session.customer,'cus_existing')
assert.equal(result.session.subscription_data.metadata.audience,'coach')
assert.match(result.session.success_url,/workspace=coach/);assert.match(result.session.cancel_url,/workspace=coach/)
result=await checkout(profile,'user','annual');assert.equal(result.status,400);assert.match(result.body.error,/already have a subscription/)
result=await checkout({...profile,stripe_subscription_id:'sub_coach',subscription_status:'active',member_subscription:{}},'user','annual')
assert.equal(result.status,200);assert.equal(result.session.subscription_data.metadata.audience,'user');assert.match(result.session.success_url,/workspace=client/)
result=await checkout({...profile,role:'client',dual_role:false},'coach','t_2_10');assert.equal(result.status,400)
result=await checkout({...profile,dual_role:false},'user','annual');assert.equal(result.status,400)

const webhook=readFileSync('supabase/functions/stripe-webhook/index.ts','utf8').replace(/^import .*\n/gm,'').split('serve(async')[0]
const context=vm.createContext({console,syncMarketplaceSubscription:async()=>{}})
vm.runInContext(stripTypeScriptTypes(webhook),context)
const calls=[]
const admin={rpc:async(name,args)=>{calls.push({name,args});return {error:null}}}
const subscription={id:'sub_member',customer:'cus_existing',status:'active',metadata:{supabase_user_id:'one',audience:'user',plan:'annual'},items:{data:[{price:{recurring:{interval:'year'}}}]}}
await context.syncSubscription({},admin,subscription)
assert.equal(calls[0].name,'sync_account_subscription');assert.equal(calls[0].args.p_audience,'user')
await assert.rejects(()=>context.syncSubscription({},{rpc:async()=>({error:{message:'retry me'}})},subscription),/retry me/)
await context.syncSubscription({},admin,{...subscription,metadata:{...subscription.metadata,kind:'coach_payment'}})
assert.equal(calls.length,1,'Direct coaching payments cannot update platform subscriptions')
console.log('PASS dual-role checkout audience, duplicate subscriptions, return workspace, and webhook routing/retry')
