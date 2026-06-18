import { useRef, useEffect, useState, useCallback } from 'react'
import { Smartphone, LogOut } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import CoachBottomNav from '../components/CoachBottomNav'
import ThemeToggle from '../components/ThemeToggle'
import useStore from '../store'
import useIsMobile from '../hooks/useIsMobile'

// Resizable sidebar width — persisted so it survives reloads.
const SIDEBAR_MIN = 200
const SIDEBAR_MAX = 460
const SIDEBAR_KEY = 'macrostack-sidebar-w'
const readSidebarWidth = () => {
  const v = Number(localStorage.getItem(SIDEBAR_KEY))
  return v >= SIDEBAR_MIN && v <= SIDEBAR_MAX ? v : 256
}

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

export default function CoachLayout({ children }) {
  const { logout, setActiveRole, activePage } = useStore()
  const isMobile = useIsMobile()
  const mainRef  = useRef(null)

  const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth)

  // Reset scroll position to top whenever the active page changes
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [activePage])

  // Drag the divider to resize the sidebar (the main canvas fills the rest)
  const startResize = useCallback((e) => {
    e.preventDefault()
    let latest = 256
    const onMove = (mv) => {
      // 16 = sidebar's ml-4 offset from the viewport's left edge
      latest = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, mv.clientX - 16))
      setSidebarWidth(latest)
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      try { localStorage.setItem(SIDEBAR_KEY, String(Math.round(latest))) } catch { /* ignore */ }
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

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

        {/* Scrollable page content — MotionPage (in App) choreographs entrances
            and binds scroll reveals to this scroller via data-scroller */}
        <main ref={mainRef} data-scroller className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-nav">
          <div key={activePage} className="min-h-full">
            {children}
          </div>
        </main>

        <CoachBottomNav />
      </div>
    )
  }

  /* ── Desktop layout — floating rail + floating page canvas ──── */
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg relative">
      <AmbientBackground />

      {/* Landing-style ambient accent glows behind the shell */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 85% 8%, color-mix(in srgb, var(--color-accent) 9%, transparent), transparent 65%),
            radial-gradient(ellipse 45% 35% at 8% 95%, color-mix(in srgb, var(--color-accent) 6%, transparent), transparent 65%)
          `,
        }}
      />

      <Sidebar width={sidebarWidth} />

      {/* Drag handle — resize the sidebar / main split */}
      <div
        onMouseDown={startResize}
        title="Drag to resize"
        className="group relative w-2 flex-shrink-0 cursor-col-resize flex items-center justify-center"
      >
        <div
          className="w-[3px] h-16 rounded-full transition-colors"
          style={{ background: 'var(--color-border)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-border)')}
        />
      </div>

      {/* Page canvas — rounded floating surface, pages scroll inside it */}
      <main className="flex-1 min-w-0 overflow-hidden relative py-4 pr-4">
        <div
          key={activePage}
          className="h-full rounded-3xl border border-border overflow-hidden relative"
          style={{
            background: 'color-mix(in srgb, var(--color-surface) 55%, var(--color-bg))',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.02)',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
