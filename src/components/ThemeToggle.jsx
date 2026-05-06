import { Sun, Moon } from 'lucide-react'
import useStore from '../store'

/**
 * ThemeToggle
 *
 * compact={false}  → full-width sidebar row  "LIGHT MODE / DARK MODE"
 * compact={true}   → small square icon button for mobile overlay
 */
export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useStore()
  const isLight = theme === 'light'
  const Icon = isLight ? Moon : Sun
  const label = isLight ? 'DARK MODE' : 'LIGHT MODE'

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        title={label}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border text-muted hover:text-cream hover:border-brown/50 transition-all shadow-sm"
      >
        <Icon size={15} />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center gap-2 px-3 py-2 rounded text-dim hover:text-muted hover:bg-card transition-colors group"
    >
      <Icon size={13} className="group-hover:text-brown transition-colors" />
      <span className="font-display font-semibold text-xs tracking-widest">{label}</span>
    </button>
  )
}
