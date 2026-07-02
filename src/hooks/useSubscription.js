import useStore from '../store'

/**
 * Subscription access for the signed-in account.
 *
 * Returns:
 *   hasAccess   – effective access (superadmin override > coach link > Stripe)
 *   viaCoach    – true when Pro is included because they're linked to a coach
 *   isSubscribed – true if a paid/trialing Stripe sub is active
 *   plan        – 'monthly' | 'annual' | null
 *   status      – raw Stripe status string
 *   override    – 'locked' | 'unlocked' | null (superadmin-set)
 *   audience    – 'coach' | 'user' (which plan this account would buy)
 */
export default function useSubscription() {
  const user           = useStore((s) => s.currentUser)
  const clients        = useStore((s) => s.clients)
  const activeClientId = useStore((s) => s.activeClientId)

  const status       = user?.subscriptionStatus || 'inactive'
  const isSubscribed = status === 'active' || status === 'trialing'
  const audience     = user?.role === 'client' ? 'user' : 'coach'

  // Clients connected to a coach get Pro included while linked — the coach's
  // tier covers them. An explicit superadmin 'locked' override still wins.
  const viaCoach =
    user?.role === 'client' &&
    user?.adminOverride !== 'locked' &&
    !!clients.find((c) => c.id === activeClientId)?.coachId

  const hasAccess = !!user?.hasAccess || viaCoach

  return {
    hasAccess,
    viaCoach,
    isSubscribed,
    plan:     user?.subscriptionPlan || null,
    status,
    override: user?.adminOverride || null,
    audience,
  }
}
