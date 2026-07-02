import useStore from '../store'
import { Sun, Moon } from 'lucide-react'
import { splatToggleTheme } from '../lib/themeSplat'

const THEMES = [
  { id: 'ocean-dark',  label: 'DARK',  accent: '#4878B0' },
  { id: 'ocean-light', label: 'LIGHT', accent: '#4878B0' },
]

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useStore()

  const isDark  = theme === 'ocean-dark'
  const active  = THEMES.find((t) => t.id === theme) || THEMES[0]
  const toggle  = (e) => splatToggleTheme(e, () => setTheme(isDark ? 'ocean-light' : 'ocean-dark'))

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border hover:border-brown/50 transition-all shadow-sm"
      >
        {isDark
          ? <Sun  size={15} className="text-muted hover:text-cream transition-colors" />
          : <Moon size={15} className="text-muted hover:text-cream transition-colors" />
        }
      </button>
    )
  }

  /* Sidebar non-compact — matches SWITCH ROLE / LOG OUT button style */
  return (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-dim hover:text-muted hover:bg-white/[0.04] transition-colors group"
    >
      {isDark
        ? <Sun  size={13} className="group-hover:text-brown transition-colors" />
        : <Moon size={13} className="group-hover:text-brown transition-colors" />
      }
      <span className="font-display font-semibold text-xs tracking-widest">
        {isDark ? 'LIGHT MODE' : 'DARK MODE'}
      </span>
    </button>
  )
}
