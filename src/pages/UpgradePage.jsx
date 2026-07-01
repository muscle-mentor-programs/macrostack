import { useState, useEffect } from 'react'
import { Check, Loader2, Settings } from 'lucide-react'
import useStore from '../store'
import useSubscription from '../hooks/useSubscription'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

const COACH_PERKS = [
  'Unlimited clients',
  'AI meal-plan builder',
  'Full coaching dashboard & compliance',
  'Real-time client messaging',
]
// Pro covers the solo power features. Coach connection, messaging, and
// meal plans unlock separately via a coach code — so they're NOT listed here.
const USER_PERKS = [
  'Barcode scanner — instant macros from any label',
  'Weight trends & 7-day moving averages',
  'Calorie history & consistency insights',
]

// Display pricing. Stripe is the source of truth at checkout; these are the
// shown numbers and should match the Stripe Prices you create.
const PRICES = {
  user: { weekly: 5.95, monthly: 9.95, annual: 89.95 },
}

// Coach plans — tiered by active client count (monthly). `key` must match the
// COACH_TIER_PRICE_IDS keys in the create-checkout-session edge function.
const COACH_TIERS = [
  { key: 't_2_10',     range: '2–10 clients',   price: 19.95 },
  { key: 't_11_30',    range: '11–30 clients',  price: 39.95,  tag: 'POPULAR' },
  { key: 't_31_60',    range: '31–60 clients',  price: 59.95 },
  { key: 't_61_120',   range: '61–120 clients', price: 89.95 },
  { key: 't_121_plus', range: '121+ clients',   price: 139.95, tag: 'UNLIMITED SCALE' },
]

const CADENCES = ['weekly', 'monthly', 'annual']
const SUFFIX   = { weekly: 'wk', monthly: 'mo', annual: 'yr' }

// Friendly label for the active plan on the management view — coach tiers show
// their client range, user cadences show the cadence name.
function planLabel(plan) {
  if (!plan) return 'Subscription active'
  const tier = COACH_TIERS.find((t) => t.key === plan)
  if (tier) return `${tier.range} plan`
  if (plan === 'annual') return 'Annual plan'
  if (plan === 'weekly') return 'Weekly plan'
  return 'Monthly plan'
}

// Annualized cost of each cadence, so cadences compare apples-to-apples.
function annualizedCost(prices, cadence) {
  if (cadence === 'weekly')  return prices.weekly * 52
  if (cadence === 'monthly') return prices.monthly * 12
  return prices.annual
}
// Savings of a cadence vs the next-cheaper one up (monthly vs weekly,
// annual vs monthly) — the "step up and save" comparison.
const PREV_CADENCE = { monthly: 'weekly', annual: 'monthly' }
function savingsPct(prices, cadence) {
  const prev = PREV_CADENCE[cadence]
  if (!prev) return 0
  return Math.round((1 - annualizedCost(prices, cadence) / annualizedCost(prices, prev)) * 100)
}

export default function UpgradePage() {
  const { startCheckout, refreshSubscription, openBillingPortal, setActivePage } = useStore()
  const { hasAccess, isSubscribed, audience, plan, status } = useSubscription()

  const isCoach = audience === 'coach'
  const [cadence, setCadence] = useState('weekly')  // user: 'weekly' | 'monthly' | 'annual'
  const [tier, setTier]       = useState('t_11_30') // coach: tier key
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Returning from Stripe Checkout → refresh access state. The webhook that
  // flips status to active fires a beat after the redirect, so refresh now and
  // again shortly after to catch it without a manual reload.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      refreshSubscription()
      const t1 = setTimeout(() => refreshSubscription(), 2500)
      const t2 = setTimeout(() => refreshSubscription(), 6000)
      window.history.replaceState({}, '', window.location.pathname)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedTier = COACH_TIERS.find((t) => t.key === tier) || COACH_TIERS[1]
  const selection = isCoach ? tier : cadence
  const price     = isCoach ? selectedTier.price : PRICES.user[cadence]
  const suffix    = isCoach ? 'mo' : SUFFIX[cadence]
  const perks     = isCoach ? COACH_PERKS : USER_PERKS
  const label     = isCoach ? 'COACH' : 'PRO'

  const handleSubscribe = async () => {
    setLoading(true); setError('')
    const res = await startCheckout(audience, selection)
    if (!res.ok) { setError(res.error || 'Could not start checkout.'); setLoading(false) }
    // on success the browser redirects to Stripe
  }

  // ── Already subscribed: management view ──
  if (hasAccess && isSubscribed) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 anim-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 anim-pop"
          style={{ background: accentA(14), border: `1px solid ${accentA(30)}` }}>
          <Check size={28} style={{ color: 'var(--color-accent)' }} />
        </div>
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted mb-2">YOUR PLAN</p>
        <h1 className="font-display font-black text-3xl tracking-widest text-cream">PREMIUM ACTIVE</h1>
        <p className="font-mono text-xs text-muted mt-2">
          {planLabel(plan)} · {status}
        </p>
        <button
          onClick={openBillingPortal}
          className="flex items-center gap-2 mt-6 border border-border text-cream font-display font-bold text-sm tracking-widest px-6 py-3 rounded-xl hover:border-muted transition-colors press"
        >
          <Settings size={14} />
          MANAGE BILLING
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full px-6 pt-mobile-header pb-12 anim-content-rise">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-5 h-px" style={{ background: accentA(50) }} />
            <p className="font-mono text-[10px] tracking-[0.22em] text-muted">MACROSTACK {label}</p>
            <span className="w-5 h-px" style={{ background: accentA(50) }} />
          </div>
          <h1 className="font-display font-black text-4xl tracking-widest text-cream leading-none">
            GO PREMIUM
          </h1>
          <p className="font-mono text-xs text-muted mt-3 max-w-xs mx-auto leading-relaxed">
            {audience === 'coach'
              ? 'Unlock unlimited clients and the full coaching toolkit.'
              : 'Unlock the barcode scanner and full progress analytics.'}
          </p>
        </div>

        {/* Plan selector */}
        {isCoach ? (
          /* Coach — pick a tier by active client count */
          <div className="space-y-2.5 mb-6">
            {COACH_TIERS.map((t) => {
              const active = tier === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTier(t.key)}
                  className="w-full flex items-center justify-between rounded-xl px-4 py-3.5 border transition-all press"
                  style={active
                    ? { borderColor: 'var(--color-accent)', background: accentA(12), boxShadow: `0 2px 18px ${accentA(28)}` }
                    : { borderColor: 'var(--color-border)', background: 'var(--color-card)' }}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center"
                      style={{ borderColor: active ? 'var(--color-accent)' : 'var(--color-border)' }}
                    >
                      {active && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent)' }} />}
                    </span>
                    <span className="font-display font-bold text-sm tracking-wide text-cream truncate">{t.range}</span>
                    {t.tag && (
                      <span className="font-mono text-[8px] tracking-[0.18em] px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: accentA(16), color: 'var(--color-accent)' }}>
                        {t.tag}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-sm whitespace-nowrap flex-shrink-0 ml-2">
                    <span className="font-display font-black text-cream">${t.price}</span>
                    <span className="text-muted">/mo</span>
                  </span>
                </button>
              )
            })}
            <p className="font-mono text-[10px] text-dim text-center pt-1">
              Coaching your first client is free, forever.
            </p>
          </div>
        ) : (
          /* User — cadence toggle, sliding pill across 3 options */
          <div className="relative flex bg-card border border-border rounded-xl p-1 card-dim mb-6">
            <div
              className="absolute top-1 bottom-1 rounded-lg pointer-events-none"
              style={{
                left:  `calc(4px + ${CADENCES.indexOf(cadence)} * (100% - 8px) / ${CADENCES.length})`,
                width: `calc((100% - 8px) / ${CADENCES.length})`,
                background: 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 72%, white))',
                boxShadow: `0 2px 14px ${accentA(40)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                transition: 'left 0.38s cubic-bezier(0.34, 1.4, 0.64, 1)',
              }}
            />
            {CADENCES.map((c) => {
              const pct = savingsPct(PRICES.user, c)
              const active = cadence === c
              return (
                <button
                  key={c}
                  onClick={() => setCadence(c)}
                  className={`relative z-10 flex-1 py-2 flex flex-col items-center gap-0.5 font-display font-bold transition-colors ${
                    active ? 'text-bg' : 'text-muted hover:text-cream'
                  }`}
                  style={active ? { color: '#fff' } : undefined}
                >
                  <span className="text-[11px] tracking-[0.12em]">{c.toUpperCase()}</span>
                  {pct > 0 && (
                    <span
                      className="font-mono text-[8px] tracking-wide leading-none px-1 py-0.5 rounded"
                      style={active
                        ? { background: 'rgba(255,255,255,0.22)', color: '#fff' }
                        : { background: accentA(14), color: 'var(--color-accent)' }}
                    >
                      SAVE {pct}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Price card */}
        <div className="glass-card border rounded-2xl p-6 card-dim mb-5"
          style={{ borderColor: accentA(35) }}>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-display font-black text-5xl text-cream">${price}</span>
            <span className="font-mono text-sm text-muted">/{suffix}</span>
          </div>
          {isCoach ? (
            <p className="font-mono text-xs text-muted mb-5">
              {selectedTier.range} · billed monthly · scale up or down anytime.
            </p>
          ) : savingsPct(PRICES.user, cadence) > 0 ? (
            <p className="font-mono text-xs mb-5" style={{ color: 'var(--color-accent)' }}>
              ✦ Save {savingsPct(PRICES.user, cadence)}% vs {PREV_CADENCE[cadence]}
            </p>
          ) : (
            <p className="font-mono text-xs text-muted mb-5">
              Switch to monthly and save {savingsPct(PRICES.user, 'monthly')}%
            </p>
          )}
          <div className="space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: accentA(18) }}>
                  <Check size={12} style={{ color: 'var(--color-accent)' }} />
                </div>
                <span className="font-mono text-sm text-cream">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="font-mono text-xs text-red-400 anim-shake text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full btn-accent text-bg font-display font-bold text-sm tracking-widest py-4 rounded-xl transition-colors glow-hover press flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> STARTING CHECKOUT…</>
            : <>SUBSCRIBE — ${price}/{suffix}</>}
        </button>

        <button
          onClick={() => setActivePage(audience === 'coach' ? 'dashboard' : 'dashboard')}
          className="w-full font-mono text-xs text-muted hover:text-cream transition-colors mt-4 py-2"
        >
          Maybe later
        </button>

        <p className="font-mono text-[10px] text-dim text-center mt-3 leading-relaxed">
          Secure checkout via Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
