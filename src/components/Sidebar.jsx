import useStore from '../store'
import ScrambleText from './ScrambleText'
import ThemeToggle from './ThemeToggle'
import { LayoutDashboard, Utensils, Users, MessageCircle, Layers, LogOut, User } from 'lucide-react'

const NAV = [
  { id: 'dashboard', n: '01', label: 'DASHBOARD', icon: LayoutDashboard },
  { id: 'clients',   n: '02', label: 'USERS',     icon: Users           },
  { id: 'chat',      n: '03', label: 'CHAT',      icon: MessageCircle   },
  { id: 'foods',     n: '04', label: 'MY FOODS',  icon: Utensils        },
  { id: 'profile',   n: '05', label: 'PROFILE',   icon: User            },
]

/* Nav geometry — items are fixed-height so the active pill can slide
   between them with spring physics (same easing as the login toggle). */
const ITEM_H   = 46
const ITEM_GAP = 6

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

export default function Sidebar() {
  const { activePage, setActivePage, setActiveRole, logout, currentUser, clients, messages } = useStore()

  const totalUnread = clients.reduce(
    (n, c) => n + (messages[c.id] || []).filter((m) => m.from === 'client' && !m.readByCoach).length,
    0
  )

  const activeIdx = Math.max(0, NAV.findIndex((n) => n.id === activePage))

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full relative z-10 my-4 ml-4 rounded-3xl glass-sidebar border border-border overflow-hidden"
      style={{ borderRight: '1px solid var(--color-border)' }}
    >
      {/* Ambient accent glow — landing hero language */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 90% 30% at 50% 0%, ${accentA(10)}, transparent 70%)`,
        }}
      />

      {/* Brand */}
      <div className="px-6 pt-7 pb-6 border-b border-border relative scanline-parent">
        <h1 className="font-display font-black text-2xl tracking-[0.12em] text-cream uppercase leading-none">
          <ScrambleText text="MACRO" duration={900} delay={0} />
          <span style={{ color: 'var(--color-accent)' }}>
            <ScrambleText text="STACK" duration={900} delay={150} />
          </span>
        </h1>
        <div className="flex items-center gap-2 mt-3">
          <span className="w-5 h-px flex-shrink-0" style={{ background: accentA(50) }} />
          <p className="font-mono text-[10px] text-muted tracking-[0.22em]">COACH PORTAL</p>
        </div>
      </div>

      {/* Quick stats — live numbers, landing finale language */}
      <div className="grid grid-cols-2 border-b border-border relative">
        <div className="px-6 py-3 border-r border-border">
          <p className="font-display font-black text-xl leading-none" style={{ color: 'var(--color-accent)' }}>
            {clients.length}
          </p>
          <p className="font-mono text-[9px] tracking-[0.2em] text-muted mt-1">USERS</p>
        </div>
        <div className="px-6 py-3">
          <p className={`font-display font-black text-xl leading-none ${totalUnread > 0 ? 'text-cream' : 'text-dim'}`}>
            {totalUnread}
          </p>
          <p className="font-mono text-[9px] tracking-[0.2em] text-muted mt-1">UNREAD</p>
        </div>
      </div>

      {/* Nav — spring-sliding active pill */}
      <nav className="flex-1 px-3 pt-4 relative">
        {/* The pill — one element that springs between items */}
        <div
          className="absolute left-3 right-3 rounded-xl pointer-events-none"
          style={{
            height: ITEM_H,
            top: 16 + activeIdx * (ITEM_H + ITEM_GAP),
            background: `linear-gradient(90deg, ${accentA(16)}, ${accentA(5)})`,
            border: `1px solid ${accentA(25)}`,
            boxShadow: `0 4px 24px ${accentA(12)}`,
            transition: 'top 0.38s cubic-bezier(0.34, 1.4, 0.64, 1)',
          }}
        >
          {/* Glowing left bar rides the pill */}
          <span
            className="absolute left-0 top-[22%] bottom-[22%] w-[2.5px] rounded-r"
            style={{
              background: 'var(--color-accent)',
              boxShadow: '0 0 12px var(--color-accent), 0 0 4px var(--color-accent)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: ITEM_GAP }}>
          {NAV.map(({ id, n, label, icon: Icon }, i) => {
            const active = activePage === id
            const badge  = id === 'chat' && totalUnread > 0 ? totalUnread : 0
            return (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                style={{ height: ITEM_H, animationDelay: `${i * 45}ms` }}
                className={`anim-slide-left w-full flex items-center gap-3 px-4 rounded-xl transition-colors duration-200 group relative ${
                  active ? 'text-cream' : 'text-muted hover:text-cream'
                }`}
              >
                <span
                  className="font-mono text-[9px] tracking-widest transition-colors flex-shrink-0"
                  style={{ color: active ? 'var(--color-accent)' : 'var(--color-dim)' }}
                >
                  {n}
                </span>
                <Icon
                  size={15}
                  className="relative z-10 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
                  style={active ? { color: 'var(--color-accent)' } : undefined}
                />
                <span className="relative z-10 font-display font-bold text-sm tracking-widest flex-1 text-left">
                  {label}
                </span>
                {badge > 0 && (
                  <span
                    className="relative z-10 font-mono text-[10px] rounded-full px-1.5 py-0.5 font-bold leading-none"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Coach identity card */}
      <div className="mx-3 mb-3 px-3 py-3 rounded-2xl border border-border bg-white/[0.02] flex items-center gap-3 relative">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accentA(28)}, ${accentA(10)})`,
            border: `1px solid ${accentA(35)}`,
            boxShadow: `0 0 14px ${accentA(15)}`,
          }}
        >
          <span className="font-display font-black text-sm" style={{ color: 'var(--color-accent)' }}>
            {currentUser?.name?.charAt(0) ?? 'C'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-cream truncate leading-tight">
            {currentUser?.name ?? 'Coach'}
          </p>
          <p className="font-mono text-[9px] text-dim truncate leading-tight tracking-[0.18em]">
            {currentUser?.role === 'superadmin' ? 'SUPER ADMIN' : 'COACH'}
          </p>
        </div>
      </div>

      {/* Controls — compact icon row */}
      <div className="px-3 pb-4 flex items-center gap-1.5 relative">
        <ThemeToggle compact />
        <button
          onClick={() => setActiveRole(null)}
          title="Switch role"
          className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl border border-border text-dim hover:text-cream hover:border-muted transition-colors"
        >
          <Layers size={12} />
          <span className="font-display font-semibold text-[10px] tracking-widest">ROLE</span>
        </button>
        <button
          onClick={logout}
          title="Log out"
          className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl border border-border text-dim hover:text-red-400 hover:border-red-400/40 transition-colors"
        >
          <LogOut size={12} />
          <span className="font-display font-semibold text-[10px] tracking-widest">EXIT</span>
        </button>
      </div>
    </aside>
  )
}
