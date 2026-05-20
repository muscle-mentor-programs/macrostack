import { useRef, useEffect } from 'react'
import { Smartphone, LogOut } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import CoachBottomNav from '../components/CoachBottomNav'
import ThemeToggle from '../components/ThemeToggle'
import useStore from '../store'
import useIsMobile from '../hooks/useIsMobile'

/* ── Shared ambient background — grain + grid + drifting orbs + vignette ── */
function AmbientBackground() {
  return (
    <>
      {/* Film grain noise — adds premium texture depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.038,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '220px 220px',
        }}
      />
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.030]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-accent) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Drifting ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-right primary glow */}
        <div
          className="absolute rounded-full"
          style={{
            top: '-20%', right: '-15%',
            width: '65vw', height: '65vw',
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 65%)',
            opacity: 0.13,
            animation: 'driftBlob 22s ease-in-out infinite',
          }}
        />
        {/* Bottom-left secondary glow */}
        <div
          className="absolute rounded-full"
          style={{
            bottom: '3%', left: '-15%',
            width: '48vw', height: '48vw',
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 65%)',
            opacity: 0.08,
            animation: 'driftBlob 18s ease-in-out infinite reverse',
            animationDelay: '-8s',
          }}
        />
        {/* Center-left accent whisper */}
        <div
          className="absolute rounded-full"
          style={{
            top: '38%', left: '-8%',
            width: '36vw', height: '36vw',
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 65%)',
            opacity: 0.045,
            animation: 'driftBlob 28s ease-in-out infinite',
            animationDelay: '-14s',
          }}
        />
      </div>
      {/* Vignette — darkens edges for focused depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 35%, transparent 42%, rgba(0,0,0,0.52) 100%)',
        }}
      />
    </>
  )
}

export default function CoachLayout({ children }) {
  const { logout, setActiveRole, activePage } = useStore()
  const isMobile = useIsMobile()
  const mainRef  = useRef(null)

  // Reset scroll position to top whenever the active page changes
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [activePage])

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
        <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-nav">
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
