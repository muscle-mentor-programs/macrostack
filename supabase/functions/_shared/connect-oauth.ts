import { unlinkStripe } from './stripe-unlink.ts'
// Database and Stripe clients are injected for focused tests without live payments.
// deno-lint-ignore-file no-explicit-any
import { ConnectError } from './stripe-connect-error.ts'
export { ConnectError } from './stripe-connect-error.ts'

export async function stateHash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

export async function connectCoach(ctx: {db: any; stripe: any; userId: string; clientId?: string; base: string; live: boolean}, input: any) {
  const { db, stripe, userId } = ctx
  const { data: profile, error: profileError } = await db.from('profiles').select('role').eq('id', userId).single()
  if (profileError || !['coach', 'superadmin'].includes(profile?.role)) throw new ConnectError('A coach account is required.', 403)
  const { data: connection, error: connectionError } = await db.from('coach_stripe_connections').select('*').eq('coach_id', userId).maybeSingle()
  if (connectionError) throw new ConnectError('Stripe connection storage is unavailable.', 503)
  const action = input.action || 'begin'
  if (!['begin', 'complete', 'status', 'disconnect'].includes(action)) throw new ConnectError('Unknown connection action.')

  if (action === 'disconnect') return await unlinkStripe(ctx, connection, input.confirm === true)
  if (connection?.disconnect_pending) {
    if (action === 'status') return { ok: true, connected: true, ready: false, disconnect_pending: true }
    throw new ConnectError('Finish unlinking Stripe before connecting again.', 409)
  }

  if (action === 'complete') {
    if (typeof input.state !== 'string' || !/^[a-f0-9]{64}$/.test(input.state)) throw new ConnectError('Invalid authorization state. Start again from the coach portal.')
    // Atomic consume, bound to the current authenticated coach, prevents replay and account swapping.
    const consumed = await db.from('stripe_connect_oauth_states').update({ consumed_at: new Date().toISOString() })
      .eq('state_hash', await stateHash(input.state)).eq('coach_id', userId).is('consumed_at', null)
      .gt('expires_at', new Date().toISOString()).select('coach_id').maybeSingle()
    if (consumed.error || !consumed.data) throw new ConnectError('This authorization expired or was already used. Start again from the coach portal.')
    if (input.error) throw new ConnectError('Stripe authorization was canceled. Your existing connection has not changed.')
    if (typeof input.code !== 'string' || !/^ac_[A-Za-z0-9]+$/.test(input.code)) throw new ConnectError('Stripe did not return a valid authorization code.')
    // Never retry this call: Stripe revokes a connection when an authorization code is reused.
    const grant = await stripe.oauth.token({ grant_type: 'authorization_code', code: input.code })
    if (grant.scope !== 'read_write' || grant.livemode !== ctx.live || !/^acct_[A-Za-z0-9]+$/.test(grant.stripe_user_id || '')) {
      throw new ConnectError('Stripe returned an incompatible authorization. Check the live OAuth configuration.')
    }
    const account = await stripe.accounts.retrieve(grant.stripe_user_id)
    if (account.type !== 'standard') throw new ConnectError('Connect your own Stripe Dashboard account, not an Express account.')
    if (connection && !connection.disconnected_at && connection.stripe_account_id !== account.id) throw new ConnectError('A different Stripe account is already linked. Contact support before switching accounts so existing payments stay intact.')
    const saved = await db.from('coach_stripe_connections').upsert({ coach_id: userId, stripe_account_id: account.id,
      livemode: grant.livemode, charges_enabled: !!account.charges_enabled, payouts_enabled: !!account.payouts_enabled,
      updated_at: new Date().toISOString(), connected_at: new Date().toISOString(), disconnected_at: null, disconnect_pending: false,
    }, { onConflict: 'coach_id', ignoreDuplicates: false })
    if (saved.error) throw new ConnectError('This Stripe account could not be saved. It may already be linked to another coach. Contact support before retrying.')
    const refreshed = await db.from('coach_stripe_connections').update({ charges_enabled: !!account.charges_enabled,
      payouts_enabled: !!account.payouts_enabled, disconnected_at: null, updated_at: new Date().toISOString() })
      .eq('coach_id', userId).eq('stripe_account_id', account.id).select('coach_id').maybeSingle()
    if (refreshed.error || !refreshed.data) throw new ConnectError('Another Stripe account is already linked to this coach. Contact support before switching accounts.')
    await syncBilling(db, userId, !!account.charges_enabled && !!account.payouts_enabled)
    // Never overwrite legacy Express identifiers or MacroStack customer/subscription billing.
    return { ok: true, connected: true, ready: !!account.charges_enabled && !!account.payouts_enabled }
  }

  if (connection && !connection.disconnected_at) {
    const account = await stripe.accounts.retrieve(connection.stripe_account_id)
    const ready = !!account.charges_enabled && !!account.payouts_enabled
    const updated = await db.from('coach_stripe_connections').update({ charges_enabled: !!account.charges_enabled,
      payouts_enabled: !!account.payouts_enabled, updated_at: new Date().toISOString() }).eq('coach_id', userId)
    if (updated.error) throw new ConnectError('Could not refresh your Stripe connection.')
    await syncBilling(db, userId, ready)
    return { ok: true, connected: true, ready, ...(!ready && action === 'begin' ? { url: 'https://dashboard.stripe.com' } : {}) }
  }
  if (action === 'status') return { ok: true, connected: false, ready: false }
  if (!ctx.clientId?.startsWith('ca_')) throw new ConnectError('Stripe authorization is not configured yet. Please contact MacroStack support.', 503)
  const state = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')
  const stored = await db.from('stripe_connect_oauth_states').insert({ state_hash: await stateHash(state), coach_id: userId })
  if (stored.error) throw new ConnectError('Could not start secure Stripe authorization. Please retry.')
  const url = new URL('https://connect.stripe.com/oauth/authorize')
  url.search = new URLSearchParams({ response_type: 'code', client_id: ctx.clientId, scope: 'read_write',
    redirect_uri: `${ctx.base}/stripe-connect/callback`, state }).toString()
  return { ok: true, connected: false, ready: false, url: url.toString() }
}

async function syncBilling(db: any, coachId: string, ready: boolean) {
  const result = await db.from('coach_billing').upsert({ coach_id: coachId, connect_ready: ready,
    updated_at: new Date().toISOString() }, { onConflict: 'coach_id' })
  if (result.error) throw new ConnectError('Stripe is authorized, but billing status could not refresh. Click verify Stripe to retry.')
}
