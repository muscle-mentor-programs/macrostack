import { ConnectError } from './stripe-connect-error.ts'
// deno-lint-ignore-file no-explicit-any
// Ten minutes exceeds the Edge Function execution limit. A terminated request cannot
// overlap a replacement lease; normal requests release immediately in finally.
export async function withStripeOperationLock(db: any, coachId: string, work: () => Promise<any>) {
  const token = crypto.randomUUID()
  const acquired = await db.rpc('acquire_coach_stripe_lock', { p_coach: coachId, p_token: token })
  if (acquired.error || acquired.data !== true) throw new ConnectError('A Stripe update or checkout is already in progress. Please try again shortly.', 409)
  try { return await work() }
  finally {
    // Never release another request's lease. Failed cleanup expires automatically.
    await db.from('coach_stripe_operation_locks').delete().eq('coach_id', coachId).eq('token', token)
  }
}
