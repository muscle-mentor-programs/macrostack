import { Monitor, LogOut } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import ThemeToggle from '../components/ThemeToggle'
import useStore from '../store'

export default function ClientLayout({ children }) {
  const { logout, currentUser, setActiveRole, activePage } = useStore()

  const isSuperAdmin = currentUser?.role === 'superadmin'

  return (
    <div className="flex flex-col h-full w-full bg-bg">
      {/* Top-right controls: role switch (superadmin only) + theme + logout */}
      <div className="fixed top-safe right-4 z-30 flex items-center gap-2">
        {isSuperAdmin && (
          <button
            onClick={() => setActiveRole(null)}
            title="Switch to Coach Portal"
            className="h-9 px-3 flex items-center gap-1.5 rounded-xl bg-card border border-brown/40 text-brown hover:text-brown-light hover:border-brown/70 hover:bg-brown/10 transition-all shadow-sm"
          >
            <Monitor size={13} />
            <span className="font-display font-bold text-[10px] tracking-widest">COACH</span>
          </button>
        )}
        <ThemeToggle compact />
        <button
          onClick={logout}
          title="Log out"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border text-muted hover:text-red-400 hover:border-red-400/30 transition-all shadow-sm"
        >
          <LogOut size={15} />
        </button>
      </div>

      {/* Scrollable content — keyed on activePage so each switch triggers anim-fade-in */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-nav pt-client-top">
        <div key={activePage} className="anim-fade-in">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
