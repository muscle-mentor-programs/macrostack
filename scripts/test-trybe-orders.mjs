import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isFirstPositivePaidInvoice, submitTrybeOrder, trybeOrderForPaidInvoice } from '../supabase/functions/_shared/trybe-orders.mjs'
import { getTrybeVisitorId } from '../src/lib/trybeAttribution.js'

const subscription = { id: 'sub_123', metadata: { audience: 'user', plan: 'monthly', trybe_vid: 'visitor_12345' } }
const invoice = { id: 'in_123', subscription: 'sub_123', status: 'paid', paid: true, amount_paid: 999, currency: 'usd', created: 1720000000 }

test('checkout reads the Trybe visitor ID only after consent', () => {
  const oldWindow = globalThis.window
  const oldStorage = globalThis.localStorage
  const oldDocument = globalThis.document
  try {
    globalThis.window = { trybe: { getVisitorId: () => 'visitor_12345' } }
    globalThis.document = { cookie: '' }
    globalThis.localStorage = { getItem: () => 'declined' }
    assert.equal(getTrybeVisitorId(), null)
    globalThis.localStorage = { getItem: () => 'accepted' }
    assert.equal(getTrybeVisitorId(), 'visitor_12345')
    globalThis.window.trybe.getVisitorId = () => 'unsafe value!'
    assert.equal(getTrybeVisitorId(), null)
    globalThis.localStorage = { getItem: () => { throw new Error('storage blocked') } }
    assert.equal(getTrybeVisitorId(), null)
  } finally {
    globalThis.window = oldWindow
    globalThis.localStorage = oldStorage
    globalThis.document = oldDocument
  }
})

test('submits only a positive paid Pro invoice', () => {
  assert.deepEqual(trybeOrderForPaidInvoice(invoice, subscription), {
    orderId: 'in_123', value: 9.99, currency: 'USD', vid: 'visitor_12345', orderTime: new Date(invoice.created * 1000).toISOString(),
  })
  assert.equal(trybeOrderForPaidInvoice({ ...invoice, amount_paid: 0 }, subscription), null)
  assert.equal(trybeOrderForPaidInvoice(invoice, { ...subscription, metadata: { ...subscription.metadata, audience: 'coach' } }), null)
  assert.equal(trybeOrderForPaidInvoice({ ...invoice, subscription: 'sub_other' }, subscription), null)
  assert.equal(trybeOrderForPaidInvoice({ ...invoice, paid_out_of_band: true }, subscription), null)
})

test('a free first invoice leaves the first positive invoice eligible, but renewals do not', async () => {
  const paidInvoices = [{ id: 'in_free', created: invoice.created - 100, amount_paid: 0 }, invoice]
  assert.equal(await isFirstPositivePaidInvoice(invoice, paidInvoices), true)
  assert.equal(await isFirstPositivePaidInvoice({ ...invoice, id: 'in_renewal', created: invoice.created + 100 }, paidInvoices), false)
})

test('accepts Trybe duplicate order response and rejects other failures', async () => {
  const order = trybeOrderForPaidInvoice(invoice, subscription)
  let sent
  await submitTrybeOrder(order, 'private-test-key', async (url, options) => {
    sent = { url, ...JSON.parse(options.body) }
    return { ok: false, status: 409 }
  })
  assert.equal(sent.orderId, 'in_123')
  assert.equal(sent.apiKey, 'private-test-key')
  await assert.rejects(submitTrybeOrder(order, 'private-test-key', async () => ({ ok: false, status: 500 })), /failed \(500\)/)
})
