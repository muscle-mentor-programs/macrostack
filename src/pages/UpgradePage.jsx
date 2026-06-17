import { useState, useEffect } from 'react'
import { Check, Sparkles, Loader2, Settings } from 'lucide-react'
import useStore from '../store'
import useSubscription from '../hooks/useSubscription'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

const COACH_PERKS = [
  'Unlimited clients',
  'AI meal-plan builder',
  'Full coaching dashboard & compliance',
  'Real-time client messaging',
]
const USER_PERKS = [
  'Barcode scanner',
  'Progress & analytics dashboards',
  'Connect with your coach + messaging',
  'Coach-assigned meal plans',
]

// Display pricing. Stripe is the source of truth at checkout; these are the
// shown numbers and should match the Stripe Prices you create.
// Display amounts only — Stripe is the source of truth at checkout. Update
// these to match the real Prices you set in Stripe.
const PRICES = {
  coach: { weekly: 9,     monthly: 29,    annual: 290    },
  user:  { weekly: 5.95,  monthly: 9.95,  annual: 89.95  },
}

const CADENCES = ['weekly', 'monthly', 'annual']
const SUFFIX   = { weekly: 'wk', monthly: 'mo', annual: 'yr' }

export default function UpgradePage() {
  const { startCheckout, refreshSubscription, openBillingPortal, setActivePage } = useStore()
  const { hasAccess, isSubscribed, audience, plan, status } = useSubscription()

  const [cadence, setCadence] = useState('annual') // 'monthly' | 'annual'
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

  const price = PRICES[audience][cadence]
  const perks = audience === 'coach' ? COACH_PERKS : USER_PERKS
  const label = audience === 'coach' ? 'COACH' : 'PRO'

  const handleSubscribe = async () => {
    setLoading(true); setError('')
    const res = await startCheckout(audience, cadence)
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
          {plan ? `${plan === 'annual' ? 'Annual' : 'Monthly'} plan` : 'Subscription active'} · {status}
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
    <div className="min-h-full px-6 py-12 anim-content-rise">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 anim-pop"
            style={{ background: accentA(12), border: `1px solid ${accentA(28)}` }}>
            <Sparkles size={24} style={{ color: 'var(--color-accent)' }} />
          </div>
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
              : 'Unlock scanning, analytics, and your coach connection.'}
          </p>
        </div>

        {/* Cadence toggle — sliding pill across 3 options */}
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
          {CADENCES.map((c) => (
            <button
              key={c}
              onClick={() => setCadence(c)}
              className={`relative z-10 flex-1 py-2.5 font-display font-bold text-[11px] tracking-[0.12em] transition-colors ${
                cadence === c ? 'text-bg' : 'text-muted hover:text-cream'
              }`}
              style={cadence === c ? { color: '#fff' } : undefined}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Price card */}
        <div className="glass-card border rounded-2xl p-6 card-dim mb-5"
          style={{ borderColor: accentA(35) }}>
          <div className="flex items-baseline gap-1.5 mb-5">
            <span className="font-display font-black text-5xl text-cream">${price}</span>
            <span className="font-mono text-sm text-muted">/{SUFFIX[cadence]}</span>
          </div>
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
            : <>SUBSCRIBE — ${price}/{SUFFIX[cadence]}</>}
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
