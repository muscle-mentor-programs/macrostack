import assert from 'node:assert/strict';
import {handleRetailAuth} from '../supabase/functions/_shared/retail-auth.mjs';
import {retailEmail,sendRetailEmail} from '../supabase/functions/_shared/retail-email.mjs';
import {isVerifiedRetailAccount} from '../src/retail/authRouting.mjs';
const email='owner@example.invalid';
function harness(opts={}){
 const sent=[],created=[],updates=[];
 let user=opts.user;
 const admin={rpc:async(name)=>name==='retail_email_limit'?{data:!opts.limited}:{data:opts.identity||null},auth:{getUser:async()=>({data:{user}}),admin:{createUser:async body=>{created.push(body);user={id:'owner',...body,email_confirmed_at:null};return {data:{user}};},generateLink:async()=>({data:{properties:{hashed_token:'a'.repeat(56)}}}),updateUserById:async(id,body)=>{updates.push(body);user={...user,...body};return {data:{user}};}}}};
 const authClient=()=>({auth:{verifyOtp:async()=>opts.invalid?{error:{message:'expired'}}:{data:{user,session:{access_token:'access',refresh_token:'refresh'}}}},rpc:async()=>opts.forbidden?{error:{message:'denied'}}:{data:opts.invite}});
 const fetcher=async(url,body)=>{sent.push(JSON.parse(body.body));return new Response(JSON.stringify(opts.failed?{message:'rejected'}:{id:'email-id'}),{status:opts.failed?500:200});};
 return {sent,created,updates,call:async body=>{const response=await handleRetailAuth(new Request('https://test.invalid',{method:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify(body)}),{admin,authClient,env:opts.missing?{}:{RESEND_API_KEY:'test',RESEND_FROM_EMAIL:'MacroStack <hello@getmacrostack.com>'},fetcher});return {status:response.status,...await response.json()};}};
}
let h=harness();let r=await h.call({action:'register',email,password:'StrongPassword123',name:'Owner'});assert.equal(r.ok,true);assert.equal(h.created[0].email_confirm,false);assert.equal(h.created[0].app_metadata.retail_verified_email,undefined);assert.equal(r.session,undefined);assert.match(h.sent[0].html,/token_hash/);assert.equal(h.sent[0].reply_to,'getmacrostack@gmail.com');
h=harness({missing:true});assert.equal((await h.call({action:'register',email,password:'StrongPassword123'})).status,503);assert.equal(h.created.length,0);
h=harness({identity:{account_type:'personal'}});assert.equal((await h.call({action:'resend',email})).ok,true);assert.equal(h.sent.length,0);assert.equal((await h.call({action:'register',email,password:'StrongPassword123'})).status,409);
h=harness({failed:true});assert.equal((await h.call({action:'register',email,password:'StrongPassword123'})).ok,undefined);
h=harness({limited:true});assert.equal((await h.call({action:'resend',email})).status,429);
h=harness({invalid:true});assert.equal((await h.call({action:'verify',token_hash:'a'.repeat(56),type:'email'})).status,400);assert.equal(h.updates.length,0);
const retailer={id:'owner',email,email_confirmed_at:'2026-09-21',app_metadata:{account_type:'retailer'}};
h=harness({user:retailer});r=await h.call({action:'verify',token_hash:'a'.repeat(56),type:'email'});assert.equal(r.session.access_token,'access');assert.equal(h.updates[0].app_metadata.retail_verified_email,email);assert.equal(h.sent.length,1);
h=harness({user:retailer,failed:true});r=await h.call({action:'verify',token_hash:'a'.repeat(56),type:'email'});assert.equal(r.welcome_pending,true);assert(r.session);assert.equal(h.updates.length,1);
h=harness({user:{...retailer,app_metadata:{account_type:'personal'}}});assert.equal((await h.call({action:'verify',token_hash:'a'.repeat(56),type:'email'})).status,400);assert.equal(h.updates.length,0);
h=harness({user:retailer,forbidden:true});assert.equal((await h.call({action:'invite',invitation_id:'other'})).status,403);assert.equal(h.sent.length,0);
h=harness({user:retailer,invite:{id:'inv',email,token:'token',role:'customer',store_name:'<script>x</script>'}});await h.call({action:'invite',invitation_id:'inv'});assert.match(h.sent[0].html,/retail\/member/);assert(!h.sent[0].html.includes('<script>'));
assert(!isVerifiedRetailAccount(retailer));assert(isVerifiedRetailAccount({...retailer,app_metadata:{...retailer.app_metadata,retail_verified_email:email}}));assert(!isVerifiedRetailAccount({...retailer,app_metadata:{...retailer.app_metadata,retail_verified_email:'old@example.invalid'}}));
for(const kind of ['confirm','recovery','welcome','staff','customer']){const t=retailEmail(kind,{url:'https://www.getmacrostack.com/retailers'});assert(t.html.includes('#82ade1'));assert(t.text.includes('MacroStack, LLC'));}
assert.throws(()=>retailEmail('confirm',{url:'https://evil.invalid'}));
await assert.rejects(()=>sendRetailEmail({key:'key',from:'onboarding@resend.dev'}),/not configured/);
console.log('PASS retail email: unconfirmed signup, wrong-account isolation, server confirmation, one-use failure, sender failure, rate limits, invitation authorization and escaped branded templates');
