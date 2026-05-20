import { Monitor, LogOut } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import ThemeToggle from '../components/ThemeToggle'
import useStore from '../store'

/* ── Minimal ambient background — grain + grid + directional depth ── */
function AmbientBackground() {
  return (
    <>
      {/* Film grain — tactile texture without visual noise */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.028,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
      {/* Faint grid — structural techy detail */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-accent) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Directional top fade — adds depth without color bleeding */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.022) 0%, transparent 38%)',
        }}
      />
    </>
  )
}

export default function ClientLayout({ children }) {
  const { logout, currentUser, setActiveRole, activePage } = useStore()

  const isSuperAdmin = currentUser?.role === 'superadmin'

  return (
    <div className="flex flex-col h-full w-full bg-bg relative">
      <AmbientBackground />

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

      {/* Scrollable page content with entrance animation */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-nav">
        <div key={activePage} className="anim-page-reveal min-h-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
