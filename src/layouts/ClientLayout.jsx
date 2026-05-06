import { LogOut } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import ThemeToggle from '../components/ThemeToggle'
import useStore from '../store'

export default function ClientLayout({ children }) {
  const { logout } = useStore()

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-bg overflow-hidden">
      {/* Top-right controls: theme + logout */}
      <div className="fixed top-3 right-4 z-30 flex items-center gap-2">
        <ThemeToggle compact />
        <button
          onClick={logout}
          title="Log out"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border text-muted hover:text-red-400 hover:border-red-400/30 transition-all shadow-sm"
        >
          <LogOut size={15} />
        </button>
      </div>

      {/* Scrollable content — min-h-0 lets flex child shrink below content height */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-nav">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
