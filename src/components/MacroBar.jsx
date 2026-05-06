import AnimatedNumber from './AnimatedNumber'

export default function MacroBar({ label, current, goal, color, unit = 'g' }) {
  const pct = Math.min((current / (goal || 1)) * 100, 100)
  const over = current > goal

  const colors = {
    brown: { bar: 'bg-brown', text: 'text-brown-light', bg: 'bg-brown/10', border: 'border-brown/20' },
    olive: { bar: 'bg-olive', text: 'text-olive-light', bg: 'bg-olive/10', border: 'border-olive/20' },
    slate: { bar: 'bg-slategray', text: 'text-slategray-light', bg: 'bg-slategray/10', border: 'border-slategray/20' },
    cream: { bar: 'bg-cream', text: 'text-cream', bg: 'bg-cream/5', border: 'border-cream/10' },
  }
  const c = colors[color] || colors.brown

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4 anim-fade-in-up`}>
      <div className="flex justify-between items-baseline mb-3">
        <span className="font-display font-bold text-xs tracking-widest text-muted">{label}</span>
        <div className="text-right">
          <span className={`font-display font-black text-3xl ${over ? 'text-red-400' : c.text}`}>
            <AnimatedNumber value={current} duration={800} />
          </span>
          <span className="font-mono text-xs text-muted ml-1">
            / {goal}{unit}
          </span>
        </div>
      </div>
      <div className="w-full bg-dim rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full bar-fill ${over ? 'bg-red-400' : c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="font-mono text-xs text-muted">
          <AnimatedNumber value={pct} duration={800} />%
        </span>
        <span className="font-mono text-xs text-muted">
          <AnimatedNumber value={Math.max(goal - current, 0)} duration={800} />{unit} left
        </span>
      </div>
    </div>
  )
}
