import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { connectCoach, stateHash } from '../supabase/functions/_shared/connect-oauth.ts'
import { orderOptions, verifyOrderAccount, directReady } from '../supabase/functions/_shared/coach-payments.ts'
import { fulfillMarketplace } from '../supabase/functions/_shared/marketplace-payments.ts'

function fixture(role = 'coach') {
  const tables = { profiles: [{ id: 'coach1', role }], coach_stripe_connections: [], stripe_connect_oauth_states: [], coach_billing: [], marketplace_orders: [] }
  const writes = [], calls = []
  const db = { from(table) {
    let action = 'select', value, predicates = [], ignoreDuplicates = false, single = false
    const run = () => {
      const rows = tables[table].filter(row => predicates.every(p => p(row)))
      if (action !== 'select') writes.push(table)
      if (action === 'insert') tables[table].push({ expires_at: new Date(Date.now() + 600000).toISOString(), consumed_at: null, ...value })
      if (action === 'upsert') {
        const existing = tables[table].find(row => row.coach_id === value.coach_id)
        if (!existing) tables[table].push(value)
        else if (!ignoreDuplicates) Object.assign(existing, value)
      }
      if (action === 'update') rows.forEach(row => Object.assign(row, value))
      return { data: single ? rows[0] || null : rows, error: null }
    }
    const q = {
      select() { return q }, eq(key, value) { predicates.push(row => row[key] === value); return q },
      is(key, value) { predicates.push(row => row[key] === value); return q },
      gt(key, value) { predicates.push(row => row[key] > value); return q },
      update(v) { action = 'update'; value = v; return q },
      insert(v) { action = 'insert'; value = v; return q },
      upsert(v, options) { action = 'upsert'; value = v; ignoreDuplicates = options?.ignoreDuplicates; return q },
      single: async () => { single = true; return run() }, maybeSingle: async () => { single = true; return run() }, then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject) },
    }
    return q
  } }
  const account = { id: 'acct_testCoach', type: 'standard', charges_enabled: true, payouts_enabled: true }
  const grant = { stripe_user_id: account.id, scope: 'read_write', livemode: true }
  const stripe = { checkout: { sessions: { list: async () => ({ data: [], has_more: false }) } }, subscriptions: { list: async () => ({ data: [], has_more: false }) }, oauth: { deauthorize: async params => { calls.push(['deauthorize', params]); return { stripe_user_id: account.id } }, token: async () => { calls.push('exchange'); return grant } }, accounts: { retrieve: async () => account } }
  return { tables, calls, writes, account, grant, ctx: { db, stripe, userId: 'coach1', clientId: 'ca_example', base: 'https://www.getmacrostack.com', live: true } }
}

async function begin(f) {
  const result = await connectCoach(f.ctx, {})
  return new URL(result.url).searchParams.get('state')
}

test('begin uses OAuth, exact callback, hashed random state and no account creation', async () => {
  const f = fixture(), result = await connectCoach(f.ctx, {})
  const url = new URL(result.url), state = url.searchParams.get('state')
  assert.equal(url.origin, 'https://connect.stripe.com')
  assert.equal(url.searchParams.get('redirect_uri'), 'https://www.getmacrostack.com/stripe-connect/callback')
  assert.equal(url.searchParams.get('scope'), 'read_write')
  assert.equal(f.tables.stripe_connect_oauth_states[0].state_hash, await stateHash(state))
  assert.notEqual(state, f.tables.stripe_connect_oauth_states[0].state_hash)
  assert.deepEqual(f.calls, [])
})
test('non-coach cannot begin', async () => {
  const f = fixture('client')
  await assert.rejects(connectCoach(f.ctx, {}), /coach account/)
  assert.deepEqual(f.writes, [])
})
test('successful authorization stores the Standard account without changing platform subscription fields', async () => {
  const f = fixture(), state = await begin(f)
  const result = await connectCoach(f.ctx, { action: 'complete', state, code: 'ac_example' })
  assert.equal(result.ready, true)
  assert.equal(f.tables.coach_stripe_connections[0].stripe_account_id, 'acct_testCoach')
  assert.ok(!f.writes.includes('profiles'))
  assert.deepEqual(f.calls, ['exchange'])
})
test('replay never exchanges a Stripe code twice', async () => {
  const f = fixture(), state = await begin(f), input = { action: 'complete', state, code: 'ac_example' }
  await connectCoach(f.ctx, input)
  await assert.rejects(connectCoach(f.ctx, input), /already used/)
  assert.deepEqual(f.calls, ['exchange'])
})
test('wrong coach and expired states fail before token exchange', async () => {
  for (const mode of ['coach', 'expiry']) {
    const f = fixture(), state = await begin(f)
    if (mode === 'coach') f.tables.stripe_connect_oauth_states[0].coach_id = 'other'
    else f.tables.stripe_connect_oauth_states[0].expires_at = '2000-01-01T00:00:00Z'
    await assert.rejects(connectCoach(f.ctx, { action: 'complete', state, code: 'ac_example' }), /expired or was already used/)
    assert.deepEqual(f.calls, [])
  }
})
test('cancel consumes state without exchanging a code', async () => {
  const f = fixture(), state = await begin(f)
  await assert.rejects(connectCoach(f.ctx, { action: 'complete', state, error: 'access_denied' }), /canceled/)
  assert.deepEqual(f.calls, [])
})
test('wrong Stripe mode and Express accounts are rejected', async () => {
  for (const mode of ['test', 'express']) {
    const f = fixture(), state = await begin(f)
    if (mode === 'test') f.grant.livemode = false
    else f.account.type = 'express'
    await assert.rejects(connectCoach(f.ctx, { action: 'complete', state, code: 'ac_example' }))
    assert.equal(f.tables.coach_stripe_connections.length, 0)
  }
})
test('existing account status does not create another authorization', async () => {
  const f = fixture(), state = await begin(f)
  await connectCoach(f.ctx, { action: 'complete', state, code: 'ac_example' })
  const result = await connectCoach(f.ctx, { action: 'status' })
  assert.equal(result.connected, true)
  assert.equal(f.tables.stripe_connect_oauth_states.length, 1)
})
test('direct order operations are account-scoped and legacy orders stay platform-scoped', () => {
  const direct = { payment_flow: 'direct', destination: 'acct_coach' }
  assert.deepEqual(orderOptions(direct), { stripeAccount: 'acct_coach' })
  assert.deepEqual(orderOptions({ payment_flow: 'destination' }), {})
  assert.throws(() => verifyOrderAccount(direct), /verification/)
  assert.throws(() => verifyOrderAccount(direct, 'acct_other'), /verification/)
  assert.doesNotThrow(() => verifyOrderAccount(direct, 'acct_coach'))
  assert.throws(() => verifyOrderAccount({ payment_flow: 'destination' }, 'acct_coach'))
})
test('direct readiness does not require transfer capability', () => {
  assert.equal(directReady({ type: 'standard', charges_enabled: true, payouts_enabled: true }), true)
  assert.equal(directReady({ type: 'express', charges_enabled: true, payouts_enabled: true }), false)
})
test('fulfillment rejects a different connected account even for an already paid order', async () => {
  const f = fixture()
  f.tables.marketplace_orders = [{ id: 'order1', state: 'paid', payment_flow: 'direct', destination: 'acct_right' }]
  await assert.rejects(fulfillMarketplace({}, f.ctx.db, { metadata: { kind: 'marketplace_coaching', marketplace_order_id: 'order1' }, payment_status: 'paid' }, 'acct_wrong'), /verification/)
  assert.deepEqual(f.writes, [])
})
test('connection source has no Express creation and client billing has no destination transfers', () => {
  const connect = readFileSync(new URL('../supabase/functions/connect-onboard/index.ts', import.meta.url), 'utf8')
  const pay = readFileSync(new URL('../supabase/functions/pay-coach/index.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(connect, /accounts\.create|accountLinks\.create/)
  assert.doesNotMatch(pay, /transfer_data|application_fee/)
})

test('direct paid one-time order verifies in coach account and fulfills without platform calls', async () => {
  const f = fixture(), requests = []
  f.tables.marketplace_orders = [{ id: 'o1', state: 'pending', payment_flow: 'direct', destination: 'acct_coach',
    session_id: 'cs_1', buyer_id: 'buyer1', price_cents: 10000, billing_mode: 'one_time', duration_days: 30 }]
  f.ctx.db.rpc = async (name, args) => { requests.push([name, args.p_order]); return { error: null } }
  const stripe = { paymentIntents: { retrieve: async (id, params, options) => {
    requests.push([id, options]); return { status: 'succeeded', metadata: { marketplace_order_id: 'o1' } }
  } } }
  await fulfillMarketplace(stripe, f.ctx.db, { id: 'cs_1', client_reference_id: 'buyer1', amount_total: 10000,
    currency: 'usd', payment_status: 'paid', payment_intent: 'pi_1', metadata: { kind: 'marketplace_coaching', marketplace_order_id: 'o1' } }, 'acct_coach')
  assert.deepEqual(requests, [['pi_1', { stripeAccount: 'acct_coach' }], ['fulfill_marketplace_order', 'o1']])
})

test('failed direct fulfillment refunds in coach account without reverse transfer', async () => {
  const f = fixture(), requests = []
  f.tables.marketplace_orders = [{ id: 'o1', state: 'pending', payment_flow: 'direct', destination: 'acct_coach',
    session_id: 'cs_1', buyer_id: 'buyer1', price_cents: 10000, billing_mode: 'one_time', duration_days: 30 }]
  f.ctx.db.rpc = async () => ({ error: { code: 'P0001' } })
  const stripe = {
    paymentIntents: { retrieve: async () => ({ status: 'succeeded', metadata: { marketplace_order_id: 'o1' } }) },
    refunds: { create: async (params, options) => { requests.push({ params, options }) } },
  }
  await fulfillMarketplace(stripe, f.ctx.db, { id: 'cs_1', client_reference_id: 'buyer1', amount_total: 10000,
    currency: 'usd', payment_status: 'paid', payment_intent: 'pi_1', metadata: { kind: 'marketplace_coaching', marketplace_order_id: 'o1' } }, 'acct_coach')
  assert.deepEqual(requests[0], { params: { payment_intent: 'pi_1' }, options: { stripeAccount: 'acct_coach', idempotencyKey: 'marketplace-unfulfilled-o1' } })
  assert.equal(f.tables.marketplace_orders[0].state, 'refunded')
})

test('legacy destination purchase still verifies transfer destination on platform', async () => {
  const f = fixture(), requests = []
  f.tables.marketplace_orders = [{ id: 'o1', state: 'pending', payment_flow: 'destination', destination: 'acct_legacy',
    session_id: 'cs_1', buyer_id: 'buyer1', price_cents: 10000, billing_mode: 'one_time', duration_days: 30 }]
  f.ctx.db.rpc = async () => ({ error: null })
  const stripe = { paymentIntents: { retrieve: async (id, params, options) => {
    requests.push(options); return { status: 'succeeded', transfer_data: { destination: 'acct_legacy' }, metadata: { marketplace_order_id: 'o1' } }
  } } }
  await fulfillMarketplace(stripe, f.ctx.db, { id: 'cs_1', client_reference_id: 'buyer1', amount_total: 10000,
    currency: 'usd', payment_status: 'paid', payment_intent: 'pi_1', metadata: { kind: 'marketplace_coaching', marketplace_order_id: 'o1' } })
  assert.deepEqual(requests, [{}])
})

async function linkedFixture() {
  const f = fixture(), state = await begin(f)
  await connectCoach(f.ctx, { action: 'complete', state, code: 'ac_example' })
  f.calls.length = 0
  return f
}
test('unlink requires confirmation and never accepts an account ID supplied by the caller', async () => {
  const f = await linkedFixture()
  await assert.rejects(connectCoach(f.ctx, { action: 'disconnect' }), /Confirm/)
  assert.equal(f.calls.length, 0)
  const result = await connectCoach(f.ctx, { action: 'disconnect', confirm: true, stripe_account_id: 'acct_someoneElse' })
  assert.equal(result.connected, false)
  assert.deepEqual(f.calls, [['deauthorize', { client_id: 'ca_example', stripe_user_id: 'acct_testCoach' }]])
  assert.ok(f.tables.coach_stripe_connections[0].disconnected_at)
  assert.equal(f.tables.coach_stripe_connections[0].disconnect_pending, false)
  assert.ok(!f.writes.includes('profiles'))
  await connectCoach(f.ctx, { action: 'disconnect', confirm: true })
  assert.equal(f.calls.length, 1)
})
test('ongoing MacroStack subscriptions block unlinking, including subscriptions on later pages', async () => {
  const f = await linkedFixture(), cursors = []
  f.ctx.stripe.subscriptions.list = async params => {
    cursors.push(params.starting_after)
    return params.starting_after ? { data: [{ id: 'sub_active', status: 'past_due', metadata: { kind: 'marketplace_coaching' } }], has_more: false }
      : { data: [{ id: 'sub_other', status: 'active', metadata: {} }], has_more: true }
  }
  await assert.rejects(connectCoach(f.ctx, { action: 'disconnect', confirm: true }), /ongoing/)
  assert.deepEqual(cursors, [undefined, 'sub_other'])
  assert.equal(f.calls.length, 0)
  assert.equal(f.tables.coach_stripe_connections[0].disconnect_pending, false)
})
test('unused coaching checkout links expire before subscription checks; unrelated sessions stay intact', async () => {
  const f = await linkedFixture(), expired = []
  f.ctx.stripe.checkout.sessions.list = async () => ({ data: [{ id: 'cs_coach', metadata: { kind: 'coach_payment' } }, { id: 'cs_other', metadata: {} }], has_more: false })
  f.ctx.stripe.checkout.sessions.expire = async (id, _, options) => expired.push([id, options])
  await connectCoach(f.ctx, { action: 'disconnect', confirm: true })
  assert.deepEqual(expired, [['cs_coach', { stripeAccount: 'acct_testCoach' }]])
})
test('completed but unfulfilled payments prevent revocation', async () => {
  const f = await linkedFixture()
  f.tables.marketplace_orders.push({ id: 'pending', coach_id: 'coach1', destination: 'acct_testCoach', payment_flow: 'direct', state: 'pending', session_id: 'cs_paid' })
  f.ctx.stripe.checkout.sessions.retrieve = async () => ({ status: 'complete' })
  await assert.rejects(connectCoach(f.ctx, { action: 'disconnect', confirm: true }), /still being confirmed/)
  assert.equal(f.calls.length, 0)
})
test('uncertain revocation stays pending, blocks reconnection, and retries safely', async () => {
  const f = await linkedFixture(), revoke = f.ctx.stripe.oauth.deauthorize
  f.ctx.stripe.oauth.deauthorize = async () => { throw new Error('network timeout') }
  await assert.rejects(connectCoach(f.ctx, { action: 'disconnect', confirm: true }), /could not be confirmed/)
  assert.equal((await connectCoach(f.ctx, { action: 'status' })).disconnect_pending, true)
  await assert.rejects(connectCoach(f.ctx, { action: 'begin' }), /Finish unlinking/)
  f.ctx.stripe.oauth.deauthorize = revoke
  await connectCoach(f.ctx, { action: 'disconnect', confirm: true })
  assert.equal((await connectCoach(f.ctx, { action: 'status' })).connected, false)
})
test('a fully unlinked coach can authorize a different Standard account', async () => {
  const f = await linkedFixture()
  await connectCoach(f.ctx, { action: 'disconnect', confirm: true })
  f.account.id = 'acct_newCoach'; f.grant.stripe_user_id = f.account.id
  const state = await begin(f)
  const result = await connectCoach(f.ctx, { action: 'complete', state, code: 'ac_new' })
  assert.equal(result.connected, true)
  assert.equal(f.tables.coach_stripe_connections[0].stripe_account_id, 'acct_newCoach')
  assert.equal(f.tables.coach_stripe_connections[0].disconnected_at, null)
})
test('an active connection cannot be swapped for another account', async () => {
  const f = fixture(), state = await begin(f)
  f.tables.coach_stripe_connections.push({ coach_id: 'coach1', stripe_account_id: 'acct_old' })
  await assert.rejects(connectCoach(f.ctx, { action: 'complete', state, code: 'ac_new' }), /different Stripe account/)
})

test('non-coach and mismatched Stripe mode cannot unlink accounts', async () => {
  const member = fixture('client')
  await assert.rejects(connectCoach(member.ctx, { action: 'disconnect', confirm: true }), /coach account/)
  assert.deepEqual(member.calls, [])
  const f = await linkedFixture()
  f.ctx.live = false
  await assert.rejects(connectCoach(f.ctx, { action: 'disconnect', confirm: true }), /not configured/)
  assert.deepEqual(f.calls, [])
})
test('Stripe lease rejects competing requests and releases its own token after failure', async () => {
  const { withStripeOperationLock } = await import('../supabase/functions/_shared/stripe-operation-lock.ts')
  let allowed = false, worked = false, token
  const filters = []
  const chain = { delete() { return chain }, eq(k,v) { filters.push([k,v]); return chain }, then(resolve) { resolve({error:null}) } }
  const db = { rpc: async (_, args) => { token = args.p_token; return {data:allowed} }, from: table => { assert.equal(table, 'coach_stripe_operation_locks'); return chain } }
  await assert.rejects(withStripeOperationLock(db, 'coach1', async () => { worked = true }), /already in progress/)
  assert.equal(worked, false); assert.deepEqual(filters, [])
  allowed = true
  await assert.rejects(withStripeOperationLock(db, 'coach1', async () => { throw new Error('Stripe unavailable') }), /Stripe unavailable/)
  assert.deepEqual(filters, [['coach_id', 'coach1'], ['token', token]])
})
