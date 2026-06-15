import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

// Stripe Price IDs — create one Price per (audience, cadence) in the Stripe
// dashboard and set these as function secrets.
const PRICE_IDS: Record<string, string | undefined> = {
  'coach:monthly': Deno.env.get('STRIPE_PRICE_COACH_MONTHLY'),
  'coach:annual':  Deno.env.get('STRIPE_PRICE_COACH_ANNUAL'),
  'user:monthly':  Deno.env.get('STRIPE_PRICE_USER_MONTHLY'),
  'user:annual':   Deno.env.get('STRIPE_PRICE_USER_ANNUAL'),
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const { audience, plan, returnUrl } = await req.json()
    if (!['coach', 'user'].includes(audience)) throw new Error('Invalid audience')
    if (!['monthly', 'annual'].includes(plan)) throw new Error('Invalid plan')

    const priceId = PRICE_IDS[`${audience}:${plan}`]
    if (!priceId) throw new Error(`No price configured for ${audience}:${plan}`)

    // Reuse an existing Stripe customer if we have one, else create + persist it.
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

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
