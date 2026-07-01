/* ── Coach tiers: one source of truth for limits + labels ─────────────────────
   Keys match the create-checkout-session / change-subscription edge functions
   and profiles.subscription_plan. A DB trigger enforces the same limits
   server-side (see 20260701_client_limits.sql). limit: null = unlimited. */

export const COACH_TIERS = [
  { key: 't_2_10',     range: '2–10 clients',   price: 19.95,  limit: 10 },
  { key: 't_11_30',    range: '11–30 clients',  price: 39.95,  limit: 30,  tag: 'POPULAR' },
  { key: 't_31_60',    range: '31–60 clients',  price: 59.95,  limit: 60 },
  { key: 't_61_120',   range: '61–120 clients', price: 89.95,  limit: 120 },
  { key: 't_121_plus', range: '121+ clients',   price: 139.95, limit: null, tag: 'UNLIMITED SCALE' },
]

export const FREE_COACH_LIMIT = 1

export const tierByKey = (key) => COACH_TIERS.find((t) => t.key === key) || null

/* Max active clients for a coach account (store currentUser shape).
   null = unlimited. */
export function coachClientLimit(user) {
  if (!user) return FREE_COACH_LIMIT
  if (user.adminOverride === 'unlocked') return null
  const active = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'
  if (!active) return FREE_COACH_LIMIT
  const tier = tierByKey(user.subscriptionPlan)
  // Active sub on a legacy (pre-tier) plan → treat as unlimited, as sold.
  return tier ? tier.limit : null
}

/* Human label for the current plan ('Free', '11–30 clients', …) */
export function coachTierLabel(user) {
  const active = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing'
  if (!active) return 'Free'
  return tierByKey(user.subscriptionPlan)?.range || 'Legacy plan'
}
