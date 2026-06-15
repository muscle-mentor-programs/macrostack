import { Lock } from 'lucide-react'
import useStore from '../store'
import useSubscription from '../hooks/useSubscription'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

/**
 * Wraps a premium feature. If the account has access, renders children.
 * Otherwise shows a compact locked card with an Upgrade CTA that routes to
 * the upgrade page.
 *
 * Props:
 *   title    – feature name shown in the locked state
 *   blurb    – one-line description of what unlocks
 *   children – the gated feature
 *   inline   – smaller locked card (for embedding inside a page section)
 */
export default function PremiumGate({ title, blurb, children, inline = false }) {
  const { hasAccess } = useSubscription()
  const setActivePage = useStore((s) => s.setActivePage)

  if (hasAccess) return children

  return (
    <div
      className={`glass-card border border-border rounded-2xl text-center anim-fade-in-up card-dim ${
        inline ? 'p-6' : 'p-8'
      }`}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 anim-pop"
        style={{ background: accentA(12), border: `1px solid ${accentA(28)}` }}
      >
        <Lock size={22} style={{ color: 'var(--color-accent)' }} />
      </div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="w-5 h-px" style={{ background: accentA(50) }} />
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted">PREMIUM</p>
        <span className="w-5 h-px" style={{ background: accentA(50) }} />
      </div>
      <p className="font-display font-black text-xl tracking-widest text-cream">{title}</p>
      {blurb && <p className="font-mono text-xs text-muted mt-2 max-w-xs mx-auto leading-relaxed">{blurb}</p>}
      <button
        onClick={() => setActivePage('upgrade')}
        className="btn-accent text-bg font-display font-bold text-sm tracking-widest px-6 py-3 rounded-xl mt-5 transition-colors glow-hover press"
      >
        UNLOCK WITH PREMIUM
      </button>
    </div>
  )
}
