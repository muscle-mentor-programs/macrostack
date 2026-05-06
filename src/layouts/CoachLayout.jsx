import { Layers, LogOut } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import CoachBottomNav from '../components/CoachBottomNav'
import ThemeToggle from '../components/ThemeToggle'
import useStore from '../store'
import useIsMobile from '../hooks/useIsMobile'

export default function CoachLayout({ children }) {
  const { logout, setActiveRole } = useStore()
  const isMobile = useIsMobile()

  /* ── Mobile layout ─────────────────────────────────────────── */
  if (isMobile) {
    return (
      /* h-[100dvh] = dynamic viewport height — correctly handles iOS URL-bar show/hide.
         w-full instead of w-screen avoids the 100vw horizontal-overflow bug.       */
      <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-bg">
        {/* Floating top-right controls */}
        <div className="fixed top-3 right-4 z-30 flex items-center gap-1.5">
          <ThemeToggle compact />
          <button
            onClick={() => setActiveRole(null)}
            title="Switch Role"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border text-muted hover:text-cream hover:border-border transition-all shadow-sm"
          >
            <Layers size={15} />
          </button>
          <button
            onClick={logout}
            title="Log Out"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border text-muted hover:text-red-400 hover:border-red-400/30 transition-all shadow-sm"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Scrollable page content — min-h-0 lets flex shrink below content height */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-nav">
          {children}
        </main>

        {/* Persistent bottom navigation */}
        <CoachBottomNav />
      </div>
    )
  }

  /* ── Desktop layout ────────────────────────────────────────── */
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
