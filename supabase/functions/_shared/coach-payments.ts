// deno-lint-ignore-file no-explicit-any
export function orderOptions(order: any) {
  return order.payment_flow === 'direct' ? { stripeAccount: order.destination } : {}
}
export function verifyOrderAccount(order: any, account?: string) {
  if ((order.payment_flow === 'direct' ? order.destination : undefined) !== account) throw new Error('Payment account verification failed.')
}
export async function coachConnection(db: any, coachId: string) {
  const { data, error } = await db.from('coach_stripe_connections').select('*').eq('coach_id', coachId).is('disconnected_at', null).eq('disconnect_pending', false).maybeSingle()
  if (error) throw error
  return data
}
export function directReady(account: any) {
  return account?.type === 'standard' && !!account.charges_enabled && !!account.payouts_enabled
}
