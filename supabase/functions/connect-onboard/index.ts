import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

// ════════════════════════════════════════════════════════════════════════════
// STRIPE CONNECT ONBOARDING (coach client-billing)
// Creates (or reuses) an Express account for the coach and returns an
// onboarding link. Also refreshes coach_billing.connect_ready from the
// account's charges_enabled, so re-calling after onboarding syncs status.
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

    const { data: profile } = await admin.from('profiles')
      .select('role, name, stripe_connect_id').eq('id', user.id).single()
    if (!profile || profile.role === 'client') throw new Error('Only coach accounts can set up client billing.')

    const { returnUrl } = await req.json().catch(() => ({}))
    const base = returnUrl || Deno.env.get('SITE_URL') || 'https://www.getmacrostack.com'

    let accountId = profile.stripe_connect_id
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        metadata: { supabase_user_id: user.id },
        capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
      })
      accountId = account.id
      await admin.from('profiles').update({ stripe_connect_id: accountId }).eq('id', user.id)
    }

    // Sync readiness (covers the return-from-onboarding call)
    const account = await stripe.accounts.retrieve(accountId)
    await admin.from('coach_billing').upsert({
      coach_id: user.id,
      connect_ready: !!account.charges_enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'coach_id', ignoreDuplicates: false })

    if (account.charges_enabled) {
      return new Response(JSON.stringify({ ok: true, ready: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/?connect=refresh`,
      return_url:  `${base}/?connect=return`,
      type: 'account_onboarding',
    })

    return new Response(JSON.stringify({ ok: true, ready: false, url: link.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
