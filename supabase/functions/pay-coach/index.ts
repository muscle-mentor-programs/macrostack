import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

// ════════════════════════════════════════════════════════════════════════════
// PAY COACH (client → coach monthly coaching subscription via Stripe Connect)
// The signed-in client is looked up server-side; the coach's price and Connect
// account come from the DB — nothing about money is trusted from the browser.
// Funds route to the coach's Express account (destination charge).
// ════════════════════════════════════════════════════════════════════════════

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

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
    if (!billing?.connect_ready || !coach?.stripe_connect_id) {
      throw new Error('Your coach has not finished setting up billing yet.')
    }
    if (price < 1) throw new Error('Your coach has not set a coaching price yet.')

    const { returnUrl } = await req.json().catch(() => ({}))
    const base = returnUrl || Deno.env.get('SITE_URL') || 'https://www.getmacrostack.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(price * 100),
          recurring: { interval: 'month' },
          product_data: { name: `Coaching with ${coach.name || 'your coach'} — MacroStack` },
        },
      }],
      subscription_data: {
        transfer_data: { destination: coach.stripe_connect_id },
        metadata: { supabase_client_id: clientRow.id, coach_id: clientRow.coach_id, kind: 'coach_payment' },
      },
      metadata: { kind: 'coach_payment' },
      success_url: `${base}/?coachpay=success`,
      cancel_url:  `${base}/?coachpay=cancelled`,
    })

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
