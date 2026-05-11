import { Smartphone, LogOut } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import CoachBottomNav from '../components/CoachBottomNav'
import ThemeToggle from '../components/ThemeToggle'
import useStore from '../store'
import useIsMobile from '../hooks/useIsMobile'

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
            opacity: 0.055,
            animation: 'driftBlob 22s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '8%', left: '-10%',
            width: '32vw', height: '32vw',
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 68%)',
            opacity: 0.035,
            animation: 'driftBlob 18s ease-in-out infinite reverse',
            animationDelay: '-8s',
          }}
        />
      </div>
    </>
  )
}

export default function CoachLayout({ children }) {
  const { logout, setActiveRole, activePage } = useStore()
  const isMobile = useIsMobile()

  /* ── Mobile layout ─────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full bg-bg overflow-hidden relative">
        <AmbientBackground />

        {/* Floating top-right controls */}
        <div className="fixed top-safe right-4 z-30 flex items-center gap-1.5">
          <ThemeToggle compact />
          <button
            onClick={() => setActiveRole(null)}
            title="Switch to User App"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-olive/40 text-olive hover:text-olive-light hover:border-olive/70 hover:bg-olive/10 transition-all shadow-sm"
          >
            <Smartphone size={15} />
          </button>
          <button
            onClick={logout}
            title="Log Out"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border text-muted hover:text-red-400 hover:border-red-400/30 transition-all shadow-sm"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Scrollable page content with entrance animation */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-nav pt-safe-top">
          <div key={activePage} className="anim-page-reveal min-h-full">
            {children}
          </div>
        </main>

        <CoachBottomNav />
      </div>
    )
  }

  /* ── Desktop layout ────────────────────────────────────────── */
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg relative">
      <AmbientBackground />
      <Sidebar />
      <main className="flex-1 overflow-hidden relative">
        <div key={activePage} className="anim-page-reveal h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
