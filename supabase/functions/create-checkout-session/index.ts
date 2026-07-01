import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── User (client) Pro prices — cadence based. Set as function secrets. ──
const USER_PRICE_IDS: Record<string, string | undefined> = {
  weekly:  Deno.env.get('STRIPE_PRICE_USER_WEEKLY'),
  monthly: Deno.env.get('STRIPE_PRICE_USER_MONTHLY'),
  annual:  Deno.env.get('STRIPE_PRICE_USER_ANNUAL'),
}

// ── Coach prices — tiered by active client count (monthly). Price IDs are
// not secrets, so they live here directly; an env var override wins if set
// (handy for swapping test ↔ live). Keys must match the client's tier keys. ──
const COACH_TIER_PRICE_IDS: Record<string, string> = {
  t_2_10:     Deno.env.get('STRIPE_PRICE_COACH_2_10')     || 'price_1ToTcZ5UsTzAaeWaz692hsEW',
  t_11_30:    Deno.env.get('STRIPE_PRICE_COACH_11_30')    || 'price_1ToTcm5UsTzAaeWaag49H3ol',
  t_31_60:    Deno.env.get('STRIPE_PRICE_COACH_31_60')    || 'price_1ToTd25UsTzAaeWaggN7ekOk',
  t_61_120:   Deno.env.get('STRIPE_PRICE_COACH_61_120')   || 'price_1ToTdM5UsTzAaeWagQysWfi9',
  t_121_plus: Deno.env.get('STRIPE_PRICE_COACH_121_PLUS') || 'price_1ToTde5UsTzAaeWarmWtvri1',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    // Init Stripe inside the handler so a missing key returns a clear JSON
    // error (with CORS) instead of crashing on boot → browser "Failed to fetch".
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('Subscriptions are not configured yet (missing STRIPE_SECRET_KEY).')
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    // `plan` is a cadence (weekly|monthly|annual) for users, or a coach tier
    // key (t_2_10 … t_121_plus) for coaches.
    const { plan, returnUrl } = await req.json()

    // Reuse an existing Stripe customer if we have one, else create + persist it.
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, role')
      .eq('id', user.id)
      .single()

    // Audience is derived from the account's real role — never trusted from the
    // client — so a user can't check out at the wrong plan/price.
    const audience = profile?.role === 'client' ? 'user' : 'coach'

    let priceId: string | undefined
    if (audience === 'coach') {
      priceId = COACH_TIER_PRICE_IDS[plan]
      if (!priceId) throw new Error(`Invalid coach tier: ${plan}`)
    } else {
      if (!['weekly', 'monthly', 'annual'].includes(plan)) throw new Error('Invalid plan')
      priceId = USER_PRICE_IDS[plan]
      if (!priceId) throw new Error(`No price configured for user:${plan}`)
    }

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const base = returnUrl || Deno.env.get('SITE_URL') || ''
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // user_id in metadata lets the webhook map the subscription back to a profile
      subscription_data: { metadata: { supabase_user_id: user.id, plan } },
      metadata: { supabase_user_id: user.id, plan },
      success_url: `${base}/?checkout=success`,
      cancel_url: `${base}/?checkout=cancelled`,
      allow_promotion_codes: true,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
