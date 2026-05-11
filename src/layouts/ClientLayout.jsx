import { Monitor, LogOut } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import ThemeToggle from '../components/ThemeToggle'
import useStore from '../store'

/* ── Shared ambient background — grid texture + drifting orbs ── */
function AmbientBackground() {
  return (
    <>
      {/* Subtle 40px grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-accent) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Drifting gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            top: '-18%', right: '-10%',
            width: '48vw', height: '48vw',
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 68%)',
            opacity: 0.05,
            animation: 'driftBlob 22s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '8%', left: '-10%',
            width: '32vw', height: '32vw',
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 68%)',
            opacity: 0.032,
            animation: 'driftBlob 18s ease-in-out infinite reverse',
            animationDelay: '-8s',
          }}
        />
      </div>
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
