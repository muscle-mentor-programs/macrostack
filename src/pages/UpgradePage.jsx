import { useState, useEffect } from 'react'
import { Check, Loader2, Settings, Users, ArrowUpRight, ArrowDownRight, Lock, Banknote, ExternalLink } from 'lucide-react'
import useStore from '../store'
import useSubscription from '../hooks/useSubscription'
// Coach tiers — shared with the landing page, client-limit gates, and edge functions
import { COACH_TIERS, coachClientLimit, coachTierLabel } from '../lib/coachTiers'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

const COACH_PERKS = [
  'Roster that grows with your tier',
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
  const { startCheckout, refreshSubscription, openBillingPortal, setActivePage, clients, changeSubscriptionTier, currentUser } = useStore()
  const { hasAccess, viaCoach, isSubscribed, audience, plan, status } = useSubscription()

  const isCoach = audience === 'coach'

  // Plan picked on the landing page before auth (stored by Landing.jsx) —
  // preselect it here, then clear the key so it only applies once.
  const pendingPlan = (() => {
    try { return JSON.parse(localStorage.getItem('ms-pending-plan') || 'null') } catch { return null }
  })()
  const [cadence, setCadence] = useState(() =>
    CADENCES.includes(pendingPlan?.plan) ? pendingPlan.plan : 'weekly')
  const [tier, setTier] = useState(() =>
    COACH_TIERS.some((t) => t.key === pendingPlan?.plan) ? pendingPlan.plan : 't_11_30')
  useEffect(() => { localStorage.removeItem('ms-pending-plan') }, [])

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

  // ── Pro included via coach link (no personal sub needed) ──
  if (viaCoach && !isSubscribed) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 anim-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 anim-pop"
          style={{ background: accentA(14), border: `1px solid ${accentA(30)}` }}>
          <Users size={28} style={{ color: 'var(--color-accent)' }} />
        </div>
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted mb-2">YOUR PLAN</p>
        <h1 className="font-display font-black text-3xl tracking-widest text-cream text-center">PRO INCLUDED</h1>
        <p className="font-mono text-xs text-muted mt-3 max-w-xs text-center leading-relaxed">
          You're connected to a coach, so every Pro feature — barcode scanner, weight trends,
          full analytics — is unlocked for as long as you're linked. Nothing to pay here.
        </p>
        <button
          onClick={() => setActivePage('dashboard')}
          className="mt-6 border border-border text-cream font-display font-bold text-sm tracking-widest px-6 py-3 rounded-xl hover:border-muted transition-colors press"
        >
          BACK TO DASHBOARD
        </button>
      </div>
    )
  }

  // ── Already subscribed: management view ──
  if (hasAccess && isSubscribed) {
    // Coaches manage their tier here — upgrade anytime, downgrade only once
    // the roster fits the lower tier (also enforced server-side).
    if (isCoach) return <CoachTierManager clients={clients} plan={plan} status={status}
      currentUser={currentUser} changeSubscriptionTier={changeSubscriptionTier} openBillingPortal={openBillingPortal} />

    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 anim-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 anim-pop"
          style={{ background: accentA(14), border: `1px solid ${accentA(30)}` }}>
          <Check size={28} style={{ color: 'var(--color-accent)' }} />
        </div>
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted mb-2">YOUR PLAN</p>
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
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted">MACROSTACK {label}</p>
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

        {/* Coaches can set up client billing regardless of their own plan */}
        {isCoach && <ClientBillingCard />}
      </div>
    </div>
  )
}

/* ── Client billing — coaches charge their clients through MacroStack ─────────
   Stripe Connect Express: connect once, set a monthly price, clients get a
   PAY COACH button on their coach tab. Money goes straight to the coach. */
export function ClientBillingCard() {
  const { coachBilling, fetchCoachBilling, saveCoachBillingPrice, startConnectOnboarding } = useStore()
  const [price, setPrice]   = useState('')
  const [saved, setSaved]   = useState(false)
  const [busy, setBusy]     = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    fetchCoachBilling().then((cb) => { if (cb?.price) setPrice(String(cb.price)) })
    // Returning from Stripe onboarding → re-sync readiness
    const params = new URLSearchParams(window.location.search)
    if (params.get('connect')) {
      window.history.replaceState({}, '', window.location.pathname)
      // connect-onboard syncs charges_enabled; refetch after a beat
      setTimeout(() => fetchCoachBilling(), 1200)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ready = !!coachBilling?.connectReady

  const handleConnect = async () => {
    setBusy(true); setError('')
    const res = await startConnectOnboarding()
    if (!res.ok) { setError(res.error); setBusy(false) }
    else if (!res.url) {
      // Already ready — refresh state
      await fetchCoachBilling()
      setBusy(false)
    }
    // otherwise the browser is redirecting to Stripe
  }

  const handleSavePrice = async () => {
    const p = Number(price)
    if (!p || p < 1) { setError('Enter a monthly price of at least $1.'); return }
    setBusy(true); setError('')
    const res = await saveCoachBillingPrice(p)
    setBusy(false)
    if (!res.ok) setError(res.error)
    else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  return (
    <div className="glass-card border border-border rounded-2xl p-5 card-dim mt-6">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Banknote size={15} style={{ color: 'var(--color-accent)' }} />
          <p className="font-display font-bold text-sm tracking-widest text-cream">CLIENT BILLING</p>
        </div>
        <span className="font-mono text-[9px] tracking-[0.18em] px-2 py-1 rounded-full"
          style={ready
            ? { background: 'rgba(107,122,82,0.15)', color: 'var(--color-olive-light, #849663)' }
            : { background: 'var(--color-dim)', color: 'var(--color-muted)' }}>
          {ready ? 'STRIPE CONNECTED' : 'NOT CONNECTED'}
        </span>
      </div>
      <p className="font-mono text-xs text-muted leading-relaxed mb-4">
        Charge your clients monthly, right inside MacroStack. Payments go straight to your own Stripe account.
      </p>

      {!ready ? (
        <button
          onClick={handleConnect}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 btn-accent text-bg font-display font-bold text-xs tracking-widest py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
          {coachBilling === null ? 'LOADING…' : 'CONNECT STRIPE — 2 MINUTES'}
        </button>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="font-display text-xs text-muted tracking-widest block mb-1.5">MONTHLY COACHING PRICE (USD)</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">$</span>
                <input
                  type="number" inputMode="decimal" min="1" placeholder="150"
                  value={price} onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-8 pr-4 py-3 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown"
                />
              </div>
              <button
                onClick={handleSavePrice}
                disabled={busy}
                className="btn-accent text-bg font-display font-bold text-xs tracking-widest px-5 rounded-xl transition-colors disabled:opacity-50"
              >
                {saved ? 'SAVED ✓' : 'SAVE'}
              </button>
            </div>
          </div>
          <p className="font-mono text-[10px] text-dim leading-relaxed">
            {Number(coachBilling?.price) > 0
              ? `Clients see a PAY $${coachBilling.price}/mo button on their coach tab and subscribe in one tap.`
              : 'Set a price and every client gets a payment button on their coach tab.'}
          </p>
        </div>
      )}
      {error && <p className="font-mono text-xs text-red-400 mt-3 anim-shake leading-relaxed">{error}</p>}
    </div>
  )
}

/* ── Coach tier manager — upgrade / downgrade the active subscription ─────────
   Upgrades apply immediately (prorated). Downgrades are blocked until the
   roster fits the lower tier; the edge function re-verifies server-side. */
function CoachTierManager({ clients, plan, status, currentUser, changeSubscriptionTier, openBillingPortal }) {
  const [busyTier, setBusyTier] = useState(null)
  const [error, setError]       = useState('')
  const [changed, setChanged]   = useState(false)

  const clientCount  = clients.length
  const currentLimit = coachClientLimit(currentUser)
  const currentIdx   = COACH_TIERS.findIndex((t) => t.key === plan)

  const handleChange = async (tierKey) => {
    setBusyTier(tierKey); setError(''); setChanged(false)
    const res = await changeSubscriptionTier(tierKey)
    if (!res.ok) setError(res.error)
    else setChanged(true)
    setBusyTier(null)
  }

  return (
    <div className="min-h-full px-6 pt-mobile-header pb-12 anim-content-rise">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-5 h-px" style={{ background: accentA(50) }} />
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted">MACROSTACK COACH</p>
            <span className="w-5 h-px" style={{ background: accentA(50) }} />
          </div>
          <h1 className="font-display font-black text-4xl tracking-widest text-cream leading-none">YOUR TIER</h1>
          <p className="font-mono text-xs text-muted mt-3">
            {coachTierLabel(currentUser)} · {status}
          </p>
        </div>

        {/* Roster usage */}
        <div className="glass-card border border-border rounded-2xl p-4 card-dim mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <Users size={15} className="text-muted" />
            <span className="font-mono text-sm text-cream">Active clients</span>
          </span>
          <span className="font-display font-black text-xl text-cream">
            {clientCount}
            <span className="font-mono text-xs text-muted font-normal">
              {' '}/ {currentLimit === null ? '∞' : currentLimit}
            </span>
          </span>
        </div>

        {changed && (
          <p className="flex items-center justify-center gap-2 font-mono text-xs text-olive-light mb-4">
            <Check size={13} /> Tier updated — billing is prorated automatically.
          </p>
        )}
        {error && (
          <p className="font-mono text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5 mb-4 anim-shake leading-relaxed">{error}</p>
        )}

        {/* Tier list */}
        <div className="space-y-2.5">
          {COACH_TIERS.map((t, i) => {
            const isCurrent   = t.key === plan
            const isUpgrade   = currentIdx === -1 || i > currentIdx
            const overCap     = t.limit !== null && clientCount > t.limit
            const removeCount = overCap ? clientCount - t.limit : 0
            const busy        = busyTier === t.key

            return (
              <div
                key={t.key}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 border"
                style={isCurrent
                  ? { borderColor: 'var(--color-accent)', background: accentA(12) }
                  : { borderColor: 'var(--color-border)', background: 'var(--color-card)' }}
              >
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm tracking-wide text-cream">
                    {t.range}
                    {t.tag && (
                      <span className="ml-2 font-mono text-[8px] tracking-[0.18em] px-1.5 py-0.5 rounded align-middle"
                        style={{ background: accentA(16), color: 'var(--color-accent)' }}>{t.tag}</span>
                    )}
                  </p>
                  <p className="font-mono text-xs text-muted mt-0.5">
                    ${t.price}/mo
                    {overCap && !isCurrent && (
                      <span className="text-red-400"> · remove {removeCount} client{removeCount === 1 ? '' : 's'} first</span>
                    )}
                  </p>
                </div>

                {isCurrent ? (
                  <span className="flex-shrink-0 font-display font-bold text-[10px] tracking-widest px-3 py-2 rounded-lg"
                    style={{ background: accentA(90), color: '#fff' }}>
                    CURRENT
                  </span>
                ) : overCap ? (
                  <span className="flex-shrink-0 flex items-center gap-1.5 font-display font-bold text-[10px] tracking-widest px-3 py-2 rounded-lg border border-border text-dim cursor-not-allowed">
                    <Lock size={11} /> LOCKED
                  </span>
                ) : (
                  <button
                    onClick={() => handleChange(t.key)}
                    disabled={busyTier !== null}
                    className="flex-shrink-0 flex items-center gap-1.5 font-display font-bold text-[10px] tracking-widest px-3 py-2 rounded-lg border transition-colors press disabled:opacity-50"
                    style={isUpgrade
                      ? { background: accentA(16), borderColor: accentA(40), color: 'var(--color-accent)' }
                      : { borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
                  >
                    {busy
                      ? <Loader2 size={11} className="animate-spin" />
                      : isUpgrade ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {isUpgrade ? 'UPGRADE' : 'DOWNGRADE'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p className="font-mono text-[10px] text-dim text-center mt-4 leading-relaxed">
          Changes are prorated by Stripe on your next invoice.
        </p>

        <button
          onClick={openBillingPortal}
          className="w-full flex items-center justify-center gap-2 mt-4 border border-border text-cream font-display font-bold text-sm tracking-widest px-6 py-3 rounded-xl hover:border-muted transition-colors press"
        >
          <Settings size={14} />
          MANAGE BILLING
        </button>

        {/* Charge your own clients through the platform */}
        <ClientBillingCard />
      </div>
    </div>
  )
}
