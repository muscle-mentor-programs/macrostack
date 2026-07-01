import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

// ════════════════════════════════════════════════════════════════════════════
// CHANGE COACH TIER (upgrade / downgrade on the existing subscription)
// - Upgrades are always allowed (prorated immediately).
// - Downgrades are refused unless the coach's current roster fits the lower
//   tier — verified HERE with the service role, not trusted from the client.
// ════════════════════════════════════════════════════════════════════════════

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Must match create-checkout-session + src/lib/coachTiers.js
const TIERS: Record<string, { priceId: string; limit: number | null; label: string }> = {
  t_2_10:     { priceId: Deno.env.get('STRIPE_PRICE_COACH_2_10')     || 'price_1ToTcZ5UsTzAaeWaz692hsEW', limit: 10,   label: '2–10 clients' },
  t_11_30:    { priceId: Deno.env.get('STRIPE_PRICE_COACH_11_30')    || 'price_1ToTcm5UsTzAaeWaag49H3ol', limit: 30,   label: '11–30 clients' },
  t_31_60:    { priceId: Deno.env.get('STRIPE_PRICE_COACH_31_60')    || 'price_1ToTd25UsTzAaeWaggN7ekOk', limit: 60,   label: '31–60 clients' },
  t_61_120:   { priceId: Deno.env.get('STRIPE_PRICE_COACH_61_120')   || 'price_1ToTdM5UsTzAaeWagQysWfi9', limit: 120,  label: '61–120 clients' },
  t_121_plus: { priceId: Deno.env.get('STRIPE_PRICE_COACH_121_PLUS') || 'price_1ToTde5UsTzAaeWarmWtvri1', limit: null, label: '121+ clients' },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('Billing is not configured (missing STRIPE_SECRET_KEY).')
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

    const { plan } = await req.json()
    const target = TIERS[plan]
    if (!target) throw new Error(`Invalid coach tier: ${plan}`)

    const { data: profile } = await admin
      .from('profiles')
      .select('role, stripe_subscription_id, subscription_status, subscription_plan')
      .eq('id', user.id)
      .single()
    if (!profile || profile.role === 'client') throw new Error('Only coach accounts can change coach tiers.')
    if (!profile.stripe_subscription_id) throw new Error('No active subscription to change — subscribe first.')
    if (plan === profile.subscription_plan) throw new Error('You are already on that tier.')

    // Downgrade guard: the roster must fit the new tier. Count every client
    // attached to this coach (pending invites included — they become active).
    if (target.limit !== null) {
      const { count } = await admin
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', user.id)
      if ((count ?? 0) > target.limit) {
        const excess = (count ?? 0) - target.limit
        throw new Error(
          `You have ${count} clients — the ${target.label} tier allows ${target.limit}. ` +
          `Remove ${excess} client${excess === 1 ? '' : 's'} to downgrade.`
        )
      }
    }

    // Swap the subscription's price in place, prorated from today.
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    if (!['active', 'trialing', 'past_due'].includes(sub.status)) {
      throw new Error('Your subscription is not active — manage it from the billing portal instead.')
    }
    await stripe.subscriptions.update(sub.id, {
      items: [{ id: sub.items.data[0].id, price: target.priceId }],
      proration_behavior: 'create_prorations',
      metadata: { ...sub.metadata, plan },
    })

    // Reflect immediately (the webhook will confirm shortly after).
    await admin.from('profiles').update({ subscription_plan: plan }).eq('id', user.id)

    return new Response(JSON.stringify({ ok: true, plan }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
