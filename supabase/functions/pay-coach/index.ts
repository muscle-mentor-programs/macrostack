import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { coachConnection, directReady } from '../_shared/coach-payments.ts'

// ════════════════════════════════════════════════════════════════════════════
// PAY COACH (client → coach monthly coaching subscription via Stripe Connect)
// The signed-in client is looked up server-side; the coach's price and Connect
// account come from the DB, nothing about money is trusted from the browser.
// New charges are created directly in the coach's own Stripe account.
// ════════════════════════════════════════════════════════════════════════════

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors })

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('Billing is not configured.')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() })

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    // The caller's client row → their coach
    const { data: clientRow } = await admin.from('clients')
      .select('id, name, coach_id').eq('profile_id', user.id).maybeSingle()
    if (!clientRow?.coach_id) throw new Error('No coach linked to your account.')

    const [{ data: coach }, { data: billing }] = await Promise.all([
      admin.from('profiles').select('name, stripe_connect_id').eq('id', clientRow.coach_id).single(),
      admin.from('coach_billing').select('price, connect_ready').eq('coach_id', clientRow.coach_id).maybeSingle(),
    ])
    const price = Number(billing?.price) || 0
    const connection = await coachConnection(admin, clientRow.coach_id)
    if (!connection || !coach) {
      throw new Error('Your coach has not finished setting up billing yet.')
    }
    if (!Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET')) throw new Error('Direct coach payments are still being configured.')
    const account = await stripe.accounts.retrieve(connection.stripe_account_id)
    if (!directReady(account)) throw new Error('Your coach needs to finish Stripe payment setup.')
    const options = { stripeAccount: connection.stripe_account_id }
    if (price < 1) throw new Error('Your coach has not set a coaching price yet.')

    const base = new URL(Deno.env.get('SITE_URL') || 'https://www.getmacrostack.com').origin
    // Avoid replacing an existing coaching subscription, including legacy payments.
    const query = `metadata['supabase_client_id']:'${clientRow.id}' AND metadata['kind']:'coach_payment'`
    for (const context of [{}, options]) {
      const existing = await stripe.subscriptions.search({ query, limit: 100 }, context)
      if (existing.data.some(sub => !['canceled', 'incomplete_expired'].includes(sub.status))) {
        throw new Error('You already have a coaching subscription. Manage it in Stripe or contact your coach before starting another.')
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(price * 100),
          recurring: { interval: 'month' },
          product_data: { name: `Coaching with ${coach.name || 'your coach'}, MacroStack` },
        },
      }],
      subscription_data: {
        metadata: { supabase_client_id: clientRow.id, coach_id: clientRow.coach_id, kind: 'coach_payment' },
      },
      metadata: { kind: 'coach_payment' },
      success_url: `${base}/?coachpay=success`,
      cancel_url:  `${base}/?coachpay=cancelled`,
    }, { ...options, idempotencyKey: `coach-payment-${clientRow.id}-${Math.floor(Date.now() / 3600000)}` })

    return new Response(JSON.stringify({ ok: true, url: session.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
