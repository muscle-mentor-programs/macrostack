import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { fulfillMarketplace, syncMarketplaceSubscription } from '../_shared/marketplace-payments.ts'
import { directReady, verifyOrderAccount } from '../_shared/coach-payments.ts'

// Deliberately separate from MacroStack software-subscription webhooks.
serve(async req => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const key = Deno.env.get('STRIPE_SECRET_KEY'), secret = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET')
  if (!key || !secret) return new Response('Connect webhook not configured', { status: 503 })
  const stripe = new Stripe(key, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() })
  let event: Stripe.Event
  try { event = await stripe.webhooks.constructEventAsync(await req.text(), req.headers.get('stripe-signature') || '', secret) }
  catch { return new Response('Invalid signature', { status: 400 }) }
  if (!event.account) return new Response('Connected account required', { status: 400 })
  const account = event.account, options = { stripeAccount: account }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  try {
    const owner = await db.from('coach_stripe_connections').select('coach_id,livemode').eq('stripe_account_id', account).maybeSingle()
    if (owner.error) throw owner.error
    if (!owner.data || owner.data.livemode !== event.livemode) return new Response('Ignored', { status: 200 })
    const object = event.data.object
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await fulfillMarketplace(stripe, db, object, account)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        if ((object as Stripe.Subscription).metadata?.kind === 'marketplace_coaching') {
          await syncMarketplaceSubscription(stripe, db, object.id, account)
        }
        break
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = object as Stripe.Invoice
        if (invoice.subscription) await syncMarketplaceSubscription(stripe, db, invoice.subscription as string, account)
        break
      }
      case 'account.updated': {
        const current = object as Stripe.Account
        if (current.id !== account) throw new Error('Account mismatch')
        const saved = await db.from('coach_stripe_connections').update({ charges_enabled: !!current.charges_enabled,
          payouts_enabled: !!current.payouts_enabled, updated_at: new Date().toISOString() }).eq('stripe_account_id', account)
        if (saved.error) throw saved.error
        const listing = await db.from('marketplace_profiles').update({ stripe_ready: directReady(current) }).eq('coach_id', owner.data.coach_id)
        if (listing.error) throw listing.error
        break
      }
      case 'account.application.deauthorized': {
        const removed = await db.from('coach_stripe_connections').update({ disconnected_at: new Date().toISOString(),
          charges_enabled: false, payouts_enabled: false }).eq('stripe_account_id', account)
        if (removed.error) throw removed.error
        const listing = await db.from('marketplace_profiles').update({ stripe_ready: false }).eq('coach_id', owner.data.coach_id)
        if (listing.error) throw listing.error
        break
      }
      case 'charge.refunded': {
        const charge = object as Stripe.Charge
        if (!charge.refunded || !charge.payment_intent) break
        const intent = await stripe.paymentIntents.retrieve(charge.payment_intent as string, {}, options)
        let orderId = intent.metadata?.marketplace_order_id
        if (!orderId && charge.invoice) {
          const invoice = await stripe.invoices.retrieve(charge.invoice as string, {}, options)
          if (invoice.subscription) {
            const sub = await stripe.subscriptions.retrieve(invoice.subscription as string, {}, options)
            if (sub.metadata?.kind === 'marketplace_coaching') orderId = sub.metadata.marketplace_order_id
          }
        }
        if (orderId) {
          const order = await db.from('marketplace_orders').select('*').eq('id', orderId).single()
          if (order.error) throw order.error
          verifyOrderAccount(order.data, account)
          const result = await db.from('marketplace_access').update({ disabled: true }).eq('order_id', orderId)
          if (result.error) throw result.error
        }
        break
      }
    }
    return Response.json({ received: true })
  } catch {
    // Stripe retries delivery; do not expose or log payment/customer payloads.
    return new Response('Connect event could not be processed', { status: 500 })
  }
})
