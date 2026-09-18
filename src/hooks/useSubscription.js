import useStore from '../store'

/**
 * Subscription access for the signed-in account.
 *
 * Returns:
 *   hasAccess   – effective access (superadmin override > Stripe)
 *   isSubscribed – true if a paid/trialing Stripe sub is active
 *   plan        – 'monthly' | 'annual' | null
 *   status      – raw Stripe status string
 *   override    – 'locked' | 'unlocked' | null (superadmin-set)
 *   audience    – 'coach' | 'user' (which plan this account would buy)
 */
export default function useSubscription() {
  const user           = useStore((s) => s.currentUser)

  const activeRole = useStore(s => s.activeRole)
  const memberMode = user?.dualRole && activeRole === 'client'
  const subscription = memberMode ? user.memberSubscription : user
  const status       = subscription?.subscriptionStatus || 'inactive'
  const isSubscribed = status === 'active' || status === 'trialing'
  const audience     = (memberMode || user?.role === 'client') ? 'user' : 'coach'

  // Coach connections do not change the account's subscription entitlement.
  const hasAccess = !!subscription?.hasAccess

  return {
    hasAccess,
    isSubscribed,
    plan:     subscription?.subscriptionPlan || null,
    status,
    override: subscription?.adminOverride || null,
    audience,
  }
}
