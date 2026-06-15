import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

// Map a Stripe subscription onto the profile row. The webhook NEVER touches
// admin_override — a superadmin's manual lock/unlock always wins.
async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.supabase_user_id
  if (!userId) {
    // Fall back to customer metadata lookup
    const customer = await stripe.customers.retrieve(sub.customer as string)
    const fallbackId = (customer as Stripe.Customer).metadata?.supabase_user_id
    if (!fallbackId) { console.error('No supabase_user_id on subscription/customer'); return }
    return updateProfile(fallbackId, sub)
  }
  return updateProfile(userId, sub)
}

async function updateProfile(userId: string, sub: Stripe.Subscription) {
  const plan = sub.metadata?.plan
    || (sub.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly')

  const { error } = await admin.from('profiles').update({
    stripe_subscription_id: sub.id,
    stripe_customer_id:     sub.customer as string,
    subscription_status:    sub.status, // active | trialing | past_due | canceled | ...
    subscription_plan:      plan,
    current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
  }).eq('id', userId)

  if (error) console.error('profile update failed:', error.message)
}

serve(async (req) => {
  const sig = req.headers.get('stripe-signature')
  if (!sig) return new Response('Missing signature', { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET)
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
          await syncSubscription(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(event.data.object as Stripe.Subscription)
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
