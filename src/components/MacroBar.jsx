import AnimatedNumber from './AnimatedNumber'

export default function MacroBar({ label, current, goal, color, unit = 'g' }) {
  const pct = Math.min((current / (goal || 1)) * 100, 100)
  const over = current > goal

  const colors = {
    brown: {
      bar: 'bg-brown', text: 'text-brown-light',
      bg: 'bg-brown/8', border: 'border-brown/20',
      glow: 'rgba(154,123,85,0.35)',
    },
    olive: {
      bar: 'bg-olive', text: 'text-olive-light',
      bg: 'bg-olive/8', border: 'border-olive/20',
      glow: 'rgba(107,140,58,0.35)',
    },
    slate: {
      bar: 'bg-slategray', text: 'text-slategray-light',
      bg: 'bg-slategray/8', border: 'border-slategray/20',
      glow: 'rgba(74,90,106,0.35)',
    },
    cream: {
      bar: 'bg-cream', text: 'text-cream',
      bg: 'bg-cream/5', border: 'border-cream/10',
      glow: 'rgba(232,228,220,0.25)',
    },
  }
  const c = colors[color] || colors.brown

  return (
    <div
      className={`rounded-xl border ${c.border} ${c.bg} p-4 anim-fade-in-up card-dim`}
    >
      <div className="flex justify-between items-baseline mb-3">
        <span className="font-display font-bold text-xs tracking-widest text-muted uppercase">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={`font-display font-black text-3xl leading-none ${over ? 'text-red-400' : c.text}`}>
            <AnimatedNumber value={current} duration={800} />
          </span>
          <span className="font-mono text-xs text-dim">/ {goal}{unit}</span>
        </div>
      </div>

      {/* Track */}
      <div className="w-full rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(255,255,255,0.06)' }}>
        <div
          className={`h-full rounded-full bar-fill ${over ? 'bg-red-400' : c.bar}`}
          style={{
            width: `${pct}%`,
            boxShadow: over ? '0 0 10px rgba(248,113,113,0.5)' : `0 0 10px ${c.glow}`,
          }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className={`font-mono text-xs font-bold ${over ? 'text-red-400' : c.text}`}>
          <AnimatedNumber value={pct} duration={800} />%
        </span>
        <span className="font-mono text-xs text-dim">
          <AnimatedNumber value={Math.max(goal - current, 0)} duration={800} />{unit} left
        </span>
      </div>
    </div>
  )
}
