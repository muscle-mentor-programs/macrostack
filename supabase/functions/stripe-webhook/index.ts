import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

// Safely convert a Stripe unix timestamp to ISO. Returns null if absent/invalid
// (avoids `new Date(NaN).toISOString()` throwing and 500-ing the webhook).
function toISO(ts: number | null | undefined): string | null {
  return typeof ts === 'number' && Number.isFinite(ts) ? new Date(ts * 1000).toISOString() : null
}

// current_period_end lived on the subscription in older API versions and moved
// to the subscription item in newer ones — read whichever is present.
function periodEnd(sub: Stripe.Subscription): string | null {
  // deno-lint-ignore no-explicit-any
  const top = (sub as any).current_period_end
  // deno-lint-ignore no-explicit-any
  const item = (sub.items?.data?.[0] as any)?.current_period_end
  return toISO(top ?? item)
}

// Map a Stripe subscription onto the profile row. The webhook NEVER touches
// admin_override — a superadmin's manual lock/unlock always wins.
async function syncSubscription(stripe: Stripe, admin: ReturnType<typeof createClient>, sub: Stripe.Subscription) {
  let userId = sub.metadata?.supabase_user_id
  if (!userId) {
    // Fall back to customer metadata lookup
    const customer = await stripe.customers.retrieve(sub.customer as string)
    userId = (customer as Stripe.Customer).metadata?.supabase_user_id
    if (!userId) { console.error('No supabase_user_id on subscription/customer'); return }
  }

  const interval = sub.items.data[0]?.price.recurring?.interval
  const plan = sub.metadata?.plan
    || (interval === 'year' ? 'annual' : interval === 'week' ? 'weekly' : 'monthly')

  const { error } = await admin.from('profiles').update({
    stripe_subscription_id: sub.id,
    stripe_customer_id:     sub.customer as string,
    subscription_status:    sub.status, // active | trialing | past_due | canceled | ...
    subscription_plan:      plan,
    current_period_end:     periodEnd(sub),
  }).eq('id', userId)

  if (error) console.error('profile update failed:', error.message)
}

serve(async (req) => {
  // Init inside the handler so missing secrets log a clear reason instead of
  // an opaque boot crash (which would 503 every Stripe delivery).
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!stripeKey || !webhookSecret) {
    console.error('Webhook misconfigured: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return new Response('Webhook not configured', { status: 500 })
  }
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  })
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const sig = req.headers.get('stripe-signature')
  if (!sig) return new Response('Missing signature', { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch (e) {
    console.error('Signature verification failed:', (e as Error).message)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          // carry the checkout metadata onto the subscription if missing
          if (!sub.metadata?.supabase_user_id && session.metadata?.supabase_user_id) {
            sub.metadata = { ...sub.metadata, ...session.metadata }
          }
          await syncSubscription(stripe, admin, sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(stripe, admin, event.data.object as Stripe.Subscription)
        break
      }
      default:
        break
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Webhook handler error:', (e as Error).message)
    return new Response('Handler error', { status: 500 })
  }
})
