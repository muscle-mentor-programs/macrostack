import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { connectCoach, ConnectError } from '../_shared/connect-oauth.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
    status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer /, '')
    const { data: { user }, error } = await db.auth.getUser(token)
    if (error || !user) return json({ error: 'Please sign in again to connect Stripe.' }, 401)
    const key = Deno.env.get('STRIPE_SECRET_KEY')
    if (!key) throw new ConnectError('Billing is not configured.', 503)
    const stripe = new Stripe(key, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 0 })
    return json(await connectCoach({ db, stripe, userId: user.id,
      clientId: Deno.env.get('STRIPE_CONNECT_CLIENT_ID'),
      base: 'https://www.getmacrostack.com',
      live: key.startsWith('sk_live_') || key.startsWith('rk_live_'),
    }, await req.json()))
  } catch (error) {
    // Never log authorization codes, OAuth tokens, or Stripe request bodies.
    return json({ error: error instanceof ConnectError ? error.message : 'Stripe connection could not be completed. Return to the coach portal and retry.' },
      error instanceof ConnectError ? error.status : 400)
  }
})
