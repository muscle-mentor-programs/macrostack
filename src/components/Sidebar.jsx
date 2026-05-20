import useStore from '../store'
import ScrambleText from './ScrambleText'
import ThemeToggle from './ThemeToggle'
import { LayoutDashboard, Utensils, Users, MessageCircle, Layers, LogOut, User } from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { id: 'clients',   label: 'USERS',     icon: Users            },
  { id: 'chat',      label: 'CHAT',      icon: MessageCircle    },
  { id: 'foods',     label: 'MY FOODS',  icon: Utensils         },
  { id: 'profile',   label: 'PROFILE',   icon: User             },
]

export default function Sidebar() {
  const { activePage, setActivePage, setActiveRole, logout, currentUser, clients, messages } = useStore()

  const totalUnread = clients.reduce(
    (n, c) => n + (messages[c.id] || []).filter((m) => m.from === 'client' && !m.readByCoach).length,
    0
  )

  return (
    <aside className="w-56 flex-shrink-0 glass-sidebar flex flex-col h-full relative z-10">

      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-white/[0.07] scanline-parent relative overflow-hidden">
        {/* Subtle gradient wash behind brand */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(160deg, rgba(154,123,85,0.10) 0%, transparent 60%)',
          }}
        />
        <h1 className="font-display font-black text-3xl tracking-[0.12em] text-cream uppercase relative">
          <ScrambleText text="MACRO" duration={900} delay={0} />
          <br />
          <ScrambleText text="STACK" className="text-gradient-accent" duration={900} delay={150} />
        </h1>
        <div className="flex items-center justify-between mt-2">
          <p className="font-mono text-[10px] text-muted tracking-widest cursor">COACH PORTAL</p>
          <span className="font-mono text-[10px] text-brown bg-brown/10 border border-brown/20 px-1.5 py-0.5 rounded-md whitespace-nowrap">
            {clients.length} users
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-3">
        {NAV.map(({ id, label, icon: Icon }, i) => {
          const active = activePage === id
          const badge  = id === 'chat' && totalUnread > 0 ? totalUnread : 0
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              style={{ animationDelay: `${i * 45}ms` }}
              className={`anim-slide-left w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                active
                  ? 'text-brown-light'
                  : 'text-muted hover:text-cream'
              }`}
            >
              {/* Active background gradient */}
              {active && (
                <span
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, rgba(154,123,85,0.16) 0%, rgba(154,123,85,0.06) 100%)',
                    border: '1px solid rgba(154,123,85,0.22)',
                  }}
                />
              )}
              {/* Hover background */}
              {!active && (
                <span className="absolute inset-0 rounded-xl bg-white/[0.00] group-hover:bg-white/[0.04] transition-colors pointer-events-none" />
              )}

              {/* Left accent bar */}
              {active && (
                <span
                  className="absolute left-0 top-[20%] bottom-[20%] w-[2px] rounded-r"
                  style={{
                    background: 'var(--color-accent)',
                    boxShadow: '0 0 10px var(--color-accent), 0 0 4px var(--color-accent)',
                  }}
                />
              )}

              <Icon
                size={14}
                className={`relative z-10 transition-colors duration-150 flex-shrink-0 ${
                  active ? 'text-brown-light' : 'text-muted group-hover:text-cream'
                }`}
              />
              <span className="relative z-10 font-display font-bold text-sm tracking-widest flex-1 text-left">
                {label}
              </span>

              {badge > 0 && (
                <span className="relative z-10 ml-auto font-mono text-[10px] text-bg bg-brown rounded-full px-1.5 py-0.5 font-bold leading-none">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-3 border-t border-white/[0.07] flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(154,123,85,0.25), rgba(154,123,85,0.12))',
            border: '1px solid rgba(154,123,85,0.35)',
            boxShadow: '0 0 12px rgba(154,123,85,0.15)',
          }}
        >
          <span className="font-display font-black text-sm text-brown-light">
            {currentUser?.name?.charAt(0) ?? 'A'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-cream truncate leading-tight">
            {currentUser?.name ?? 'Coach'}
          </p>
          <p className="font-mono text-[10px] text-dim truncate leading-tight tracking-widest">
            {currentUser?.role === 'superadmin' ? 'SUPER ADMIN' : 'COACH'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-3 py-2 pb-4 border-t border-white/[0.07] space-y-0.5">
        <ThemeToggle />
        <button
          onClick={() => setActiveRole(null)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-dim hover:text-muted hover:bg-white/[0.04] transition-colors group"
        >
          <Layers size={12} className="group-hover:text-brown transition-colors" />
          <span className="font-display font-semibold text-xs tracking-widest">SWITCH ROLE</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-dim hover:text-red-400 hover:bg-red-400/[0.05] transition-colors group"
        >
          <LogOut size={12} />
          <span className="font-display font-semibold text-xs tracking-widest">LOG OUT</span>
        </button>
      </div>
    </aside>
  )
}
