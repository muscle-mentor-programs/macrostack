import { useState } from 'react'
import { UserPlus, Loader2, Check, X, ShieldCheck, Mail } from 'lucide-react'
import useStore from '../store'
import ScrambleText from '../components/ScrambleText'
import ThemeToggle from '../components/ThemeToggle'

/* ── Create-account + payment page ────────────────────────────────────────────
   Landing CTAs land here. If a plan was picked (ms-pending-plan), the page
   shows it, creates the account, and goes STRAIGHT into Stripe checkout in one
   flow. With no plan it's a plain branded free signup with a role toggle. */

const COACH_TIER_INFO = {
  t_2_10:     { range: '2–10 clients',   price: 19.95 },
  t_11_30:    { range: '11–30 clients',  price: 39.95,  tag: 'POPULAR' },
  t_31_60:    { range: '31–60 clients',  price: 59.95 },
  t_61_120:   { range: '61–120 clients', price: 89.95 },
  t_121_plus: { range: '121+ clients',   price: 139.95, tag: 'UNLIMITED SCALE' },
}
const PRO_PLAN_INFO = {
  weekly:  { name: 'WEEKLY',  price: 5.95,  unit: '/wk' },
  monthly: { name: 'MONTHLY', price: 9.95,  unit: '/mo', tag: 'POPULAR' },
  annual:  { name: 'ANNUAL',  price: 89.95, unit: '/yr', tag: 'BEST VALUE' },
}

function readPendingPlan() {
  try { return JSON.parse(localStorage.getItem('ms-pending-plan') || 'null') } catch { return null }
}

const inputCls =
  'w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 transition-colors'
const lblCls = 'font-display text-xs text-muted tracking-widest block mb-1.5'

export default function SignupCheckout({ onBack, onSignIn }) {
  const { signup, startCheckout } = useStore()

  const [pending, setPending] = useState(readPendingPlan)
  const paidPlan = pending?.plan || null
  const isCoachPlan = pending?.audience === 'coach'
  const tierInfo = isCoachPlan ? COACH_TIER_INFO[paidPlan] : null
  const proInfo  = !isCoachPlan && paidPlan ? PRO_PLAN_INFO[paidPlan] : null

  // Free signups still need a role; a picked plan fixes it.
  const [role, setRole] = useState(pending?.audience === 'coach' ? 'coach' : 'client')
  const effectiveRole = paidPlan ? (isCoachPlan ? 'coach' : 'client') : role

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [paying, setPaying]     = useState(false)
  const [error, setError]       = useState('')
  const [confirmSent, setConfirmSent] = useState(false)

  const removePlan = () => {
    localStorage.removeItem('ms-pending-plan')
    setPending(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')

    const res = await signup(name.trim(), email.trim(), password, effectiveRole)
    if (!res.ok) { setError(res.error || 'Could not create your account.'); setLoading(false); return }
    if (res.needsConfirmation) { setConfirmSent(true); setLoading(false); return }

    // Account is live and signed in — go straight to payment if a plan was picked.
    if (paidPlan) {
      setPaying(true)
      const co = await startCheckout(pending.audience, paidPlan)
      if (!co.ok) {
        // They're signed in; the app's pending-plan redirect lands them on the
        // Upgrade page to retry — so just let the app take over.
        setPaying(false)
      }
    }
    // No plan → the auth state flip renders the app.
  }

  const planLine = tierInfo
    ? { label: 'MACROSTACK COACH', name: tierInfo.range, price: `$${tierInfo.price}`, unit: '/mo', tag: tierInfo.tag,
        note: 'Your first client is free — this tier kicks in as your roster grows.' }
    : proInfo
    ? { label: 'MACROSTACK PRO', name: proInfo.name, price: `$${proInfo.price}`, unit: proInfo.unit, tag: proInfo.tag,
        note: 'Barcode scanner + full progress analytics. Cancel anytime.' }
    : null

  /* ── Redirecting to Stripe overlay ── */
  if (paying) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center gap-4 anim-fade-in">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
        <p className="font-display font-bold text-sm tracking-widest text-cream">ACCOUNT CREATED</p>
        <p className="font-mono text-xs text-muted">Redirecting to secure checkout…</p>
      </div>
    )
  }

  /* ── Email-confirmation fallback ── */
  if (confirmSent) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center gap-4 px-6 text-center anim-fade-in">
        <Mail size={28} style={{ color: 'var(--color-accent)' }} />
        <p className="font-display font-bold text-lg tracking-widest text-cream">CHECK YOUR EMAIL</p>
        <p className="font-mono text-xs text-muted max-w-xs leading-relaxed">
          We sent a confirmation link to {email}. Confirm it, sign in, and we'll pick up right where you left off.
        </p>
        <button onClick={onSignIn} className="font-mono text-xs tracking-widest mt-2 px-4 py-2 rounded-lg border border-border text-cream hover:border-muted transition-colors">
          GO TO SIGN IN →
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-bg overflow-y-auto anim-fade-in">
      {/* Back to landing */}
      {onBack && (
        <div className="fixed top-safe left-4 z-10">
          <button
            onClick={onBack}
            className="font-mono text-xs text-muted hover:text-cream tracking-widest flex items-center gap-1.5 py-2 transition-colors"
          >
            ← BACK
          </button>
        </div>
      )}

      {/* Theme toggle */}
      <div className="fixed top-safe right-4 z-10">
        <ThemeToggle compact />
      </div>

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-accent) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="min-h-full flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm anim-fade-in-up">

          {/* Brand */}
          <div className="text-center mb-7 scanline-parent py-3">
            <h1 className="font-display font-black text-5xl tracking-widest track-center leading-none text-cream">
              <ScrambleText text="MACRO" duration={900} />
              <br />
              <ScrambleText text="STACK" className="text-brown" duration={900} delay={150} />
            </h1>
            <p className="font-mono text-xs text-muted tracking-widest track-center mt-3">CREATE YOUR ACCOUNT</p>
          </div>

          {/* Selected plan */}
          {planLine && (
            <div
              className="relative rounded-2xl p-4 mb-5 anim-fade-in-up"
              style={{
                background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)',
              }}
            >
              <button
                onClick={removePlan}
                title="Remove plan — create a free account instead"
                className="absolute top-3 right-3 text-dim hover:text-cream transition-colors p-1"
              >
                <X size={14} />
              </button>
              <p className="font-mono text-[9px] tracking-[0.25em] text-muted mb-1.5">
                YOUR PLAN {planLine.tag ? `· ${planLine.tag}` : ''}
              </p>
              <div className="flex items-baseline justify-between gap-3 pr-6">
                <p className="font-display font-black text-lg text-cream tracking-wide">
                  {planLine.label} <span style={{ color: 'var(--color-accent)' }}>— {planLine.name.toUpperCase()}</span>
                </p>
                <p className="font-mono text-sm text-cream whitespace-nowrap">
                  <span className="font-display font-black text-xl">{planLine.price}</span>
                  <span className="text-muted">{planLine.unit}</span>
                </p>
              </div>
              <p className="font-mono text-[10px] text-muted mt-2 leading-relaxed">{planLine.note}</p>
            </div>
          )}

          {/* Role toggle — free signups only */}
          {!paidPlan && (
            <div className="flex bg-card border border-border rounded-xl p-1 mb-5">
              {[{ id: 'client', label: "I'M A USER" }, { id: 'coach', label: "I'M A COACH" }].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className="flex-1 py-2.5 font-display font-bold text-[11px] tracking-[0.12em] rounded-lg transition-all"
                  style={role === r.id
                    ? { background: 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 72%, white))', color: '#fff' }
                    : { color: 'var(--color-muted)' }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={lblCls}>NAME</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name" autoComplete="name" className={inputCls} />
            </div>
            <div>
              <label className={lblCls}>EMAIL</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" className={inputCls} />
            </div>
            <div>
              <label className={lblCls}>PASSWORD</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="6+ characters" autoComplete="new-password" className={inputCls} />
            </div>

            {error && (
              <p className="font-mono text-xs text-red-400 anim-shake">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim() || !password}
              className="w-full btn-accent text-bg font-display font-bold text-sm tracking-widest py-4 rounded-xl btn-lift btn-shine flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> CREATING ACCOUNT…</>
                : paidPlan
                ? <><UserPlus size={15} /> CREATE ACCOUNT & PAY {planLine.price}{planLine.unit} →</>
                : <><UserPlus size={15} /> CREATE FREE ACCOUNT →</>}
            </button>
          </form>

          {/* Trust + sign-in */}
          <div className="mt-5 space-y-3 text-center">
            {paidPlan && (
              <p className="flex items-center justify-center gap-1.5 font-mono text-[10px] text-dim">
                <ShieldCheck size={12} />
                Secure payment via Stripe · Cancel anytime
              </p>
            )}
            {!paidPlan && (
              <p className="flex items-center justify-center gap-1.5 font-mono text-[10px] text-dim">
                <Check size={12} />
                Free to start · No credit card required
              </p>
            )}
            <button
              onClick={onSignIn}
              className="font-mono text-xs text-muted hover:text-cream tracking-widest transition-colors py-1"
            >
              ALREADY HAVE AN ACCOUNT? SIGN IN →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
