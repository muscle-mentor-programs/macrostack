import assert from 'node:assert/strict'
import { validateListing, stripeReady, accessActive } from '../supabase/functions/_shared/marketplace-rules.ts'
import { fulfillMarketplace } from '../supabase/functions/_shared/marketplace-payments.ts'

const draft = { name: 'Coach Example', headline: 'Build consistent habits', bio: 'Personal nutrition coaching and weekly accountability.', billing_mode: 'one_time', price_cents: 9900, duration_days: 45 }
assert.equal(validateListing(draft).duration_days, 45)
assert.equal(validateListing(draft).published, false)
assert.equal(validateListing({ ...draft, billing_mode: 'monthly' }).duration_days, null)
for (const duration_days of [0, -1, 731, 1.5, NaN]) assert.throws(() => validateListing({ ...draft, duration_days }))
for (const price_cents of [0, 99, 1000001, 200.2]) assert.throws(() => validateListing({ ...draft, price_cents }))
assert.throws(() => validateListing({ ...draft, photo_url: 'javascript:alert(1)' }))
assert.equal(stripeReady({ charges_enabled: true, payouts_enabled: false, capabilities: { transfers: 'active' } }), false)
assert.equal(stripeReady({ charges_enabled: true, payouts_enabled: true, capabilities: { transfers: 'active' } }), true)
assert.equal(accessActive(null, 100), false)
assert.equal(accessActive({ paid_until: new Date(100).toISOString() }, 100), false)
assert.equal(accessActive({ paid_until: new Date(101).toISOString() }, 100), true)
assert.equal(accessActive({ paid_until: new Date(101).toISOString(), disabled: true }, 100), false)

const order = { id: 'order', state: 'pending', session_id: 'session', buyer_id: 'buyer', price_cents: 9900, billing_mode: 'one_time', duration_days: 45, destination: 'coach' }
const session = { id: 'session', metadata: { kind: 'marketplace_coaching', marketplace_order_id: 'order' }, payment_status: 'paid', client_reference_id: 'buyer', amount_total: 9900, currency: 'usd', payment_intent: 'intent' }
let fulfillments = 0
const db = { from(table) {
  assert.equal(table, 'marketplace_orders', 'Must never write Pro profile fields')
  return { select() { return this }, eq() { return this }, single: async () => ({ data: order }), update() { return this } }
}, rpc: async (name, args) => { assert.equal(name, 'fulfill_marketplace_order'); assert.equal(args.p_order, 'order'); fulfillments++; return {} } }
const stripe = { paymentIntents: { retrieve: async () => ({ status: 'succeeded', transfer_data: { destination: 'coach' }, metadata: { marketplace_order_id: 'order' } }) } }
await fulfillMarketplace(stripe, db, { ...session, payment_status: 'unpaid' })
assert.equal(fulfillments, 0)
await assert.rejects(fulfillMarketplace(stripe, db, { ...session, client_reference_id: 'other' }))
await assert.rejects(fulfillMarketplace(stripe, db, { ...session, amount_total: 1 }))
await fulfillMarketplace(stripe, db, session)
assert.equal(fulfillments, 1)
order.state = 'paid'
await fulfillMarketplace(stripe, db, session)
assert.equal(fulfillments, 1, 'Retry must not extend paid access')
order.state = 'pending'
order.billing_mode = 'monthly'
stripe.subscriptions = { retrieve: async () => ({ metadata: { marketplace_order_id: 'order' }, transfer_data: { destination: 'coach' }, latest_invoice: { status: 'paid', payment_intent: 'intent' }, current_period_end: Math.floor(Date.now() / 1000) + 86400 }) }
await fulfillMarketplace(stripe, db, { ...session, subscription: 'subscription' })
assert.equal(fulfillments, 2)
stripe.subscriptions.retrieve = async () => ({ metadata: { marketplace_order_id: 'order' }, transfer_data: { destination: 'other' }, latest_invoice: { status: 'paid' } })
await assert.rejects(fulfillMarketplace(stripe, db, { ...session, subscription: 'subscription' }))
assert.equal(fulfillments, 2)
console.log('PASS: marketplace validation, access expiry, unpaid rejection, ownership, amount and duplicate fulfillment checks.')
