import useStore from '../store'

/**
 * Subscription access for the signed-in account.
 *
 * Returns:
 *   hasAccess   – effective access (superadmin override > Stripe status)
 *   isSubscribed – true if a paid/trialing Stripe sub is active
 *   plan        – 'monthly' | 'annual' | null
 *   status      – raw Stripe status string
 *   override    – 'locked' | 'unlocked' | null (superadmin-set)
 *   audience    – 'coach' | 'user' (which plan this account would buy)
 */
export default function useSubscription() {
  const user = useStore((s) => s.currentUser)

  const hasAccess    = !!user?.hasAccess
  const status       = user?.subscriptionStatus || 'inactive'
  const isSubscribed = status === 'active' || status === 'trialing'
  const audience     = user?.role === 'client' ? 'user' : 'coach'

  return {
    hasAccess,
    isSubscribed,
    plan:     user?.subscriptionPlan || null,
    status,
    override: user?.adminOverride || null,
    audience,
  }
}
