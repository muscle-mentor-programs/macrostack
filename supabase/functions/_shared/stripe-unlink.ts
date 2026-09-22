// deno-lint-ignore-file no-explicit-any
import { ConnectError } from './stripe-connect-error.ts'

const coaching = (item: any) => ['marketplace_coaching', 'coach_payment'].includes(item.metadata?.kind)

// A bounded, fully paginated scan fails closed if an unusually large account needs support.
async function scan(list: any, params: any, options: any, visit: (item: any) => Promise<void>) {
  let cursor: string | undefined
  for (let page = 0; page < 100; page++) {
    const result = await list({ ...params, limit: 100, ...(cursor ? { starting_after: cursor } : {}) }, options)
    for (const item of result.data) await visit(item)
    if (!result.has_more) return
    cursor = result.data.at(-1)?.id
    if (!cursor) break
  }
  throw new ConnectError('This Stripe account needs a support-assisted payment review before unlinking.', 409)
}

export async function unlinkStripe(ctx: any, connection: any, confirmed: boolean) {
  const { db, stripe, userId } = ctx
  if (!confirmed) throw new ConnectError('Confirm unlinking your Stripe account first.')
  if (!connection || connection.disconnected_at) return { ok: true, connected: false, ready: false }
  if (!ctx.clientId?.startsWith('ca_') || connection.livemode !== ctx.live) throw new ConnectError('Stripe unlinking is not configured for this account. Contact support.', 503)
  const accountId = connection.stripe_account_id
  const options = { stripeAccount: accountId }
  if (!connection.disconnect_pending) {
    // Close abandoned checkout links before the final subscription scan. Do not
    // cancel subscriptions or refund payments as a side effect of disconnecting.
    await scan(stripe.checkout.sessions.list.bind(stripe.checkout.sessions), { status: 'open' }, options, async session => {
      if (coaching(session)) await stripe.checkout.sessions.expire(session.id, {}, options)
    })
    await scan(stripe.subscriptions.list.bind(stripe.subscriptions), { status: 'all' }, options, async sub => {
      if (coaching(sub) && !['canceled', 'incomplete_expired'].includes(sub.status)) {
        throw new ConnectError('An ongoing MacroStack coaching subscription is still linked. End it in your Stripe Dashboard before unlinking. A subscription scheduled to end must finish first. No subscriptions were canceled.', 409)
      }
    })
    const orders = await db.from('marketplace_orders').select('id,session_id').eq('coach_id', userId).eq('destination', accountId).eq('payment_flow', 'direct').eq('state', 'pending')
    if (orders.error) throw new ConnectError('Could not verify pending payments. Please retry.', 503)
    for (const order of orders.data || []) {
      const session = order.session_id ? await stripe.checkout.sessions.retrieve(order.session_id, {}, options) : null
      if (session && session.status !== 'expired') throw new ConnectError('A customer payment is still being confirmed. Wait for it to finish before unlinking.', 409)
      const expired = await db.from('marketplace_orders').update({ state: 'expired' }).eq('id', order.id).eq('state', 'pending')
      if (expired.error) throw new ConnectError('Could not close pending checkout records. Please retry.', 503)
    }
    const pending = await db.from('coach_stripe_connections').update({ disconnect_pending: true, updated_at: new Date().toISOString() }).eq('coach_id', userId).eq('stripe_account_id', accountId)
    if (pending.error) throw new ConnectError('Could not prepare Stripe unlinking. Please retry.', 503)
  }
  // Never treat invalid_client as success: it can mean a configuration error.
  // If the network result is uncertain, remain pending and let the signed Stripe
  // deauthorization webhook finalize it, or allow a safe retry.
  try {
    const revoked = await stripe.oauth.deauthorize({ client_id: ctx.clientId, stripe_user_id: accountId })
    if (revoked.stripe_user_id !== accountId) throw new Error('Account mismatch')
  } catch {
    throw new ConnectError('Stripe unlinking could not be confirmed. New payments are paused. Refresh the status or retry unlinking; contact support if this continues.', 503)
  }
  const removed = await db.from('coach_stripe_connections').update({ disconnected_at: new Date().toISOString(), disconnect_pending: false,
    charges_enabled: false, payouts_enabled: false, updated_at: new Date().toISOString() }).eq('coach_id', userId).eq('stripe_account_id', accountId)
  if (removed.error) throw new ConnectError('Stripe access was revoked, but the saved status is still updating. Refresh the status shortly.', 503)
  return { ok: true, connected: false, ready: false }
}
