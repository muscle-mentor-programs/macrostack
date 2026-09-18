import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
const store=readFileSync('src/store/index.js','utf8')
const compute=store.match(/export function computeSubscriptionAccess\(profile\) \{[\s\S]*?\n\}/)[0].replace('export ','')
const convert=store.match(/function profileToUser\(profile, email\) \{[\s\S]*?\n\}/)[0]
const hook=readFileSync('src/hooks/useSubscription.js','utf8').replace("import useStore from '../store'",'').replace('export default function','function')
for(const member of ['active','inactive','past_due','trialing'])for(const coach of ['active','inactive'])for(const role of ['client','coach']){
 const ctx=vm.createContext({profile:{id:'one',role:'coach',dual_role:true,subscription_status:coach,subscription_plan:'t_2_10',member_subscription:{subscription_status:member,subscription_plan:'annual'}},role})
 vm.runInContext(`${compute};${convert};const state={currentUser:profileToUser(profile,'same@example.com'),activeRole:role};const useStore=fn=>fn(state);${hook};result=useSubscription()`,ctx)
 assert.equal(ctx.result.audience,role==='client'?'user':'coach')
 assert.equal(ctx.result.hasAccess,['active','trialing'].includes(role==='client'?member:coach))
 assert.equal(ctx.result.plan,role==='client'?'annual':'t_2_10')
}
console.log('PASS dual-role paid access, audience and plans remain separate in both portals')
