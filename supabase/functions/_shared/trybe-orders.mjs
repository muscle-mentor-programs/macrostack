export function trybeOrderForPaidInvoice(invoice, subscription) {
  const vid = subscription.metadata?.trybe_vid
  if (subscription.metadata?.audience !== 'user' || !['weekly', 'monthly', 'annual'].includes(subscription.metadata?.plan)) return null
  if (typeof vid !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(vid)) return null
  if (invoice.status !== 'paid' || invoice.paid !== true || invoice.paid_out_of_band === true || invoice.amount_paid <= 0 || invoice.currency?.toLowerCase() !== 'usd') return null
  if (invoice.subscription !== subscription.id) return null
  return {
    orderId: invoice.id,
    value: invoice.amount_paid / 100,
    currency: 'USD',
    vid,
    orderTime: new Date((invoice.status_transitions?.paid_at || invoice.created) * 1000).toISOString(),
  }
}

export async function isFirstPositivePaidInvoice(invoice, paidInvoices) {
  for await (const paid of paidInvoices) {
    if (paid.id !== invoice.id && paid.amount_paid > 0 && paid.created < invoice.created) return false
  }
  return true
}

export async function submitTrybeOrder(order, apiKey, fetchImpl = fetch) {
  if (!apiKey) throw new Error('TRYBE_ORDERS_API_KEY is missing')
  const response = await fetchImpl('https://jointrybe.com/attribution/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, ...order }),
  })
  // Trybe uses orderId for deduplication. A Stripe retry may receive 409.
  if (response.ok || response.status === 409) return
  throw new Error(`Trybe order submission failed (${response.status})`)
}
