import {serve} from 'https://deno.land/std@0.168.0/http/server.ts'
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import {validateListing,stripeReady,accessActive} from '../_shared/marketplace-rules.ts'
import {fulfillMarketplace,syncMarketplaceSubscription} from '../_shared/marketplace-payments.ts'

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type'}
const fields='coach_id,name,headline,bio,specialties,credentials,photo_url,cover_url,price_cents,billing_mode,duration_days'
serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors})
  const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{...cors,'Content-Type':'application/json'}})
  try {
    if(req.method!=='POST') return json({error:'Method not allowed'},405)
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const input=await req.json(), action=input.action
    if(action==='list') {
      const {data,error}=await db.from('marketplace_profiles').select(fields).eq('published',true).eq('stripe_ready',true).order('name').limit(200)
      if(error) throw error
      return json({coaches:data})
    }
    const {data:{user},error:authError}=await db.auth.getUser((req.headers.get('Authorization')||'').replace('Bearer ',''))
    if(authError || !user) return json({error:'Please sign in to continue.'},401)
    const {data:profile,error:profileError}=await db.from('profiles').select('id,role,name,stripe_connect_id,coach_code,subscription_status,subscription_plan,admin_override').eq('id',user.id).single()
    if(profileError) throw profileError
    const stripe=new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!,{apiVersion:'2024-06-20',httpClient:Stripe.createFetchHttpClient()})
    const base=new URL(Deno.env.get('SITE_URL') || 'https://www.getmacrostack.com').origin
    if(action==='save') {
      if(!['coach','superadmin'].includes(profile.role)) return json({error:'Coach account required.'},403)
      const listing=validateListing(input.profile || {})
      const account=profile.stripe_connect_id?await stripe.accounts.retrieve(profile.stripe_connect_id):null
      const ready=!!account && stripeReady(account)
      if(listing.published && (!ready || !profile.coach_code)) throw new Error('Complete Stripe setup before publishing.')
      const {error}=await db.from('marketplace_profiles').upsert({...listing,coach_id:user.id,stripe_ready:ready,updated_at:new Date().toISOString()})
      if(error) throw error
      return json({ok:true,ready})
    }
    if(action==='my-profile') {
      if(!['coach','superadmin'].includes(profile.role)) return json({error:'Coach account required.'},403)
      const {data,error}=await db.from('marketplace_profiles').select('*').eq('coach_id',user.id).maybeSingle()
      if(error) throw error
      return json({profile:data})
    }
    if(profile.role!=='client') return json({error:'Use a client account to purchase coaching.'},403)
    const {data:client,error:clientError}=await db.from('clients').select('id,coach_id,status').eq('profile_id',user.id).single()
    if(clientError) throw new Error('Your client profile is not ready. Please sign in again.')
    if(action==='manage') {
      const {data:access,error}=await db.from('marketplace_access').select('order_id').eq('client_id',client.id).single()
      if(error) throw new Error('No coaching subscription was found.')
      const {data:order,error:orderError}=await db.from('marketplace_orders').select('customer_id,subscription_id').eq('id',access.order_id).eq('buyer_id',user.id).single()
      if(orderError || !order?.subscription_id || !order.customer_id) throw new Error('This package does not have a recurring subscription.')
      const portal=await stripe.billingPortal.sessions.create({customer:order.customer_id,return_url:`${base}/marketplace`})
      return json({url:portal.url})
    }
    if(action==='status') {
      if(input.session_id) {
        const session=await stripe.checkout.sessions.retrieve(input.session_id)
        if(session.client_reference_id!==user.id || session.metadata?.kind!=='marketplace_coaching') return json({error:'This checkout does not belong to your account.'},403)
        await fulfillMarketplace(stripe,db,session)
      }
      const {data:access,error}=await db.from('marketplace_access').select('*').eq('client_id',client.id).maybeSingle()
      if(error) throw error
      if(!access) return json({access:null})
      const {data:order}=await db.from('marketplace_orders').select('subscription_id').eq('id',access.order_id).single()
      if(order?.subscription_id) await syncMarketplaceSubscription(stripe,db,order.subscription_id)
      const {data:latest,error:latestError}=await db.from('marketplace_access').select('*').eq('client_id',client.id).single()
      if(latestError) throw latestError
      const {data:coach}=await db.from('profiles').select('name,coach_code').eq('id',latest.coach_id).single()
      return json({access:{...latest,recurring:!!order?.subscription_id,active:accessActive(latest),coach_name:coach?.name,coach_code:accessActive(latest)?coach?.coach_code:null}})
    }
    if(action==='checkout') {
      const {data:listing,error}=await db.from('marketplace_profiles').select('*').eq('coach_id',input.coach_id).eq('published',true).single()
      if(error || !listing) throw new Error('This coach is not currently accepting marketplace purchases.')
      if(client.coach_id && client.coach_id!==listing.coach_id) throw new Error('You are already connected to another coach. Contact your coach before changing connections.')
      if(client.status==='archived') throw new Error('Your client profile is archived. Contact support before purchasing coaching.')
      const {data:access}=await db.from('marketplace_access').select('*').eq('client_id',client.id).maybeSingle()
      if(accessActive(access)) throw new Error('Your coaching access is already active.')
      if(access) {
        const {data:previous}=await db.from('marketplace_orders').select('subscription_id').eq('id',access.order_id).single()
        if(previous?.subscription_id) {
          const sub=await stripe.subscriptions.retrieve(previous.subscription_id,{expand:['latest_invoice']})
          if(!['canceled','incomplete_expired'].includes(sub.status)) {
            if(sub.latest_invoice && typeof sub.latest_invoice!=='string' && sub.latest_invoice.status==='open' && sub.latest_invoice.hosted_invoice_url) return json({url:sub.latest_invoice.hosted_invoice_url})
            throw new Error('Your coaching subscription already exists. Manage it before starting another payment.')
          }
        }
      }
      const {data:coach}=await db.from('profiles').select('stripe_connect_id,coach_code,subscription_status,subscription_plan,admin_override').eq('id',listing.coach_id).single()
      if(!coach?.stripe_connect_id || !coach.coach_code) throw new Error('Coach billing is unavailable.')
      if(client.coach_id!==listing.coach_id && coach.admin_override!=='unlocked') {
        const limits:Record<string,number>={t_2_10:10,t_11_30:30,t_31_60:60,t_61_120:120}
        const limit=['active','trialing'].includes(coach.subscription_status)?limits[coach.subscription_plan]:1
        if(limit) {
          const {count,error:countError}=await db.from('clients').select('id',{count:'exact',head:true}).eq('coach_id',listing.coach_id).neq('status','archived')
          if(countError) throw countError
          if((count || 0)>=limit) throw new Error('This coach is at capacity. Please choose another coach or try later.')
        }
      }
      const account=await stripe.accounts.retrieve(coach.stripe_connect_id)
      if(!stripeReady(account)) {
        await db.from('marketplace_profiles').update({stripe_ready:false}).eq('coach_id',listing.coach_id)
        throw new Error('This coach is still completing payment setup.')
      }
      // A pending row plus Stripe idempotency key protects against double clicks and retries.
      await db.from('marketplace_orders').update({state:'expired'}).eq('buyer_id',user.id).eq('state','pending').lt('expires_at',new Date().toISOString())
      let {data:order}=await db.from('marketplace_orders').select('*').eq('buyer_id',user.id).eq('state','pending').maybeSingle()
      if(order && order.coach_id!==listing.coach_id) throw new Error('Finish or wait for your current checkout to expire before choosing another coach.')
      if(order?.session_id) {
        const existing=await stripe.checkout.sessions.retrieve(order.session_id)
        if(existing.status==='open' && existing.url) return json({url:existing.url})
        if(existing.status==='complete') throw new Error('Your payment is being confirmed. Return to the marketplace to check access.')
        const expired=await db.from('marketplace_orders').update({state:'expired'}).eq('id',order.id).eq('state','pending')
        if(expired.error) throw expired.error
        order=null
      }
      if(!order) {
        const created=await db.from('marketplace_orders').insert({client_id:client.id,buyer_id:user.id,coach_id:listing.coach_id,
          price_cents:listing.price_cents,billing_mode:listing.billing_mode,duration_days:listing.duration_days,destination:coach.stripe_connect_id}).select().single()
        if(created.error) throw new Error('A checkout is already being prepared. Please retry.')
        order=created.data
      }
      const metadata={kind:'marketplace_coaching',marketplace_order_id:order.id}
      const session=await stripe.checkout.sessions.create({mode:order.billing_mode==='monthly'?'subscription':'payment',
        customer_email:user.email,client_reference_id:user.id,payment_method_types:['card'],metadata,
        line_items:[{quantity:1,price_data:{currency:'usd',unit_amount:order.price_cents,
          ...(order.billing_mode==='monthly'?{recurring:{interval:'month' as const}}:{}),
          product_data:{name:'MacroStack coaching',description:order.billing_mode==='monthly'?'Monthly coaching subscription':`${order.duration_days} days of coaching access`}}}],
        ...(order.billing_mode==='monthly'?{subscription_data:{metadata,transfer_data:{destination:order.destination}}}:{payment_intent_data:{metadata,transfer_data:{destination:order.destination}}}),
        expires_at:Math.floor(new Date(order.created_at).getTime()/1000)+1800,
        success_url:`${base}/marketplace?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${base}/marketplace?cancelled=1`,
      },{idempotencyKey:`marketplace-${order.id}`})
      const saved=await db.from('marketplace_orders').update({session_id:session.id}).eq('id',order.id)
      if(saved.error) throw saved.error
      return json({url:session.url})
    }
    return json({error:'Unknown marketplace action.'},400)
  } catch(error) {
    console.error('Marketplace request failed:',error)
    return json({error:error instanceof Error?error.message:'Marketplace is unavailable. Please retry.'},400)
  }
})
