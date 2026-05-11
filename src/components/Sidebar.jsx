import useStore from '../store'
import ScrambleText from './ScrambleText'
import ThemeToggle from './ThemeToggle'
import { LayoutDashboard, Utensils, Users, MessageCircle, Layers, LogOut, User } from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { id: 'clients',   label: 'CLIENTS',   icon: Users            },
  { id: 'chat',      label: 'CHAT',      icon: MessageCircle    },
  { id: 'foods',     label: 'MY FOODS',  icon: Utensils         },
  { id: 'profile',   label: 'PROFILE',   icon: User             },
]

export default function Sidebar() {
  const { activePage, setActivePage, setActiveRole, logout, currentUser, clients, messages } = useStore()

  // Total unread messages from clients
  const totalUnread = clients.reduce(
    (n, c) => n + (messages[c.id] || []).filter((m) => m.from === 'client' && !m.readByCoach).length,
    0
  )

  return (
    <aside className="w-56 flex-shrink-0 bg-surface border-r border-border flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-border scanline-parent">
        <h1 className="font-display font-black text-3xl tracking-widest text-cream uppercase">
          <ScrambleText text="MACRO" duration={900} delay={0} />
          <ScrambleText text="STACK" className="text-brown" duration={900} delay={150} />
        </h1>
        <div className="flex items-center justify-between mt-1">
          <p className="font-mono text-xs text-muted tracking-widest cursor">COACH PORTAL</p>
          <span className="font-mono text-xs text-dim bg-brown/10 border border-brown/20 px-1.5 py-0.5 rounded text-brown/70 whitespace-nowrap">
            {clients.length} clients
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-3">
        {NAV.map(({ id, label, icon: Icon }, i) => {
          const active = activePage === id
          const badge  = id === 'chat' && totalUnread > 0 ? totalUnread : 0
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              style={{ animationDelay: `${i * 45}ms` }}
              className={`anim-slide-left w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-150 group ${
                active
                  ? 'bg-brown/20 text-brown-light border border-brown/30'
                  : 'text-muted hover:text-cream hover:bg-card border border-transparent'
              }`}
            >
              <Icon size={15} className={active ? 'text-brown' : 'text-muted group-hover:text-cream transition-colors'} />
              <span className="font-display font-semibold text-sm tracking-widest flex-1 text-left">{label}</span>
              {id === 'clients' && clients.length > 0 && (
                <span className="ml-auto font-mono text-xs text-muted bg-card border border-border rounded px-1.5">
                  {clients.length}
                </span>
              )}
              {badge > 0 && (
                <span className="ml-auto font-mono text-xs text-bg bg-brown rounded-full px-1.5 py-0.5 font-bold">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
          <span className="font-display font-black text-sm text-brown-light">
            {currentUser?.name?.charAt(0) ?? 'A'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-cream truncate leading-tight">
            {currentUser?.name ?? 'Coach'}
          </p>
          <p className="font-mono text-xs text-dim truncate leading-tight">
            {currentUser?.role === 'superadmin' ? 'SUPER ADMIN' : 'COACH'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-2 pb-3 border-t border-border space-y-0.5">
        <ThemeToggle />
        <button
          onClick={() => setActiveRole(null)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-dim hover:text-muted hover:bg-card transition-colors group"
        >
          <Layers size={13} className="group-hover:text-brown transition-colors" />
          <span className="font-display font-semibold text-xs tracking-widest">SWITCH ROLE</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-dim hover:text-red-400 hover:bg-card transition-colors group"
        >
          <LogOut size={13} />
          <span className="font-display font-semibold text-xs tracking-widest">LOG OUT</span>
        </button>
      </div>
    </aside>
  )
}
