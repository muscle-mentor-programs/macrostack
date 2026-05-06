import { LogOut } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import ThemeToggle from '../components/ThemeToggle'
import useStore from '../store'

export default function ClientLayout({ children }) {
  const { logout } = useStore()

  return (
    <div className="flex flex-col h-screen w-screen bg-bg overflow-hidden">
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

      {/* Mobile viewport — content scrolls, nav is fixed at bottom */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
