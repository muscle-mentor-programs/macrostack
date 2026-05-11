import { useState, useRef, useEffect } from 'react'
import useStore from '../store'

const THEMES = [
  { id: 'ocean-dark',  label: 'DARK',  card: '#141B2E', accent: '#4878B0' },
  { id: 'ocean-light', label: 'LIGHT', card: '#B0C2DC', accent: '#4878B0' },
]

function ThemeGrid({ theme, setTheme, onPick }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {THEMES.map((t) => {
        const isActive = theme === t.id
        return (
          <button
            key={t.id}
            onClick={() => { setTheme(t.id); onPick?.() }}
            className="relative rounded-lg p-2.5 text-left transition-all"
            style={{
              backgroundColor: t.card,
              border: `2px solid ${isActive ? t.accent : 'transparent'}`,
              boxShadow: isActive ? `0 0 0 1px ${t.accent}40` : 'none',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.accent }} />
              <span className="font-display font-bold text-[9px] tracking-widest leading-none" style={{ color: t.accent }}>
                {t.label}
              </span>
            </div>
            <div className="flex gap-0.5 mb-1">
              <div className="h-1 rounded-full flex-1" style={{ backgroundColor: t.accent + '90' }} />
              <div className="h-1 rounded-full w-2/3" style={{ backgroundColor: t.accent + '40' }} />
            </div>
            {isActive && (
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const active = THEMES.find((t) => t.id === theme) || THEMES[0]
  const isDark  = theme === 'ocean-dark'

  if (compact) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          title="Change theme"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border hover:border-brown/50 transition-all shadow-sm"
          style={{ borderColor: open ? active.accent + '80' : undefined }}
        >
          {/* Half-circle icon: dark half + light half */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" fill={active.accent} opacity="0.25" />
            <path d={isDark ? 'M8 2 A6 6 0 0 1 8 14 Z' : 'M8 14 A6 6 0 0 1 8 2 Z'} fill={active.accent} />
          </svg>
        </button>
        {open && (
          <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-2xl p-3 shadow-2xl w-44 anim-fade-in-down">
            <p className="font-display font-bold text-[9px] tracking-widest text-muted mb-2.5 px-0.5">APPEARANCE</p>
            <ThemeGrid theme={theme} setTheme={setTheme} onPick={() => setOpen(false)} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-2 py-2">
      <p className="font-display text-[9px] text-dim tracking-widest mb-2 px-1">APPEARANCE</p>
      <ThemeGrid theme={theme} setTheme={setTheme} />
    </div>
  )
}
