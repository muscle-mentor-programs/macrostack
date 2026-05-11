import { LayoutDashboard, Users, MessageCircle, Utensils, User } from 'lucide-react'
import useStore from '../store'

const NAV = [
  { id: 'dashboard', label: 'HOME',    icon: LayoutDashboard },
  { id: 'clients',   label: 'CLIENTS', icon: Users           },
  { id: 'chat',      label: 'CHAT',    icon: MessageCircle   },
  { id: 'foods',     label: 'FOODS',   icon: Utensils        },
  { id: 'profile',   label: 'PROFILE', icon: User            },
]

export default function CoachBottomNav() {
  const { activePage, setActivePage, clients, messages, navHidden } = useStore()

  const totalUnread = clients.reduce(
    (n, c) =>
      n + (messages[c.id] || []).filter((m) => m.from === 'client' && !m.readByCoach).length,
    0
  )

  return (
    <nav className={`flex-shrink-0 w-full nav-bg backdrop-blur-sm border-t border-border nav-elevated nav-safe-bottom transition-transform duration-200 ${
      navHidden ? 'translate-y-full' : ''
    }`}>
      <div className="grid grid-cols-5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id
          const badge  = id === 'chat' && totalUnread > 0 ? totalUnread : 0
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`relative flex flex-col items-center justify-center py-3.5 gap-1 transition-all duration-150 ${
                active ? 'text-brown-light' : 'text-muted'
              }`}
            >
              <div className="relative transition-transform duration-150" style={{ transform: active ? 'scale(1.1)' : 'scale(1)' }}>
                <Icon size={active ? 20 : 18} strokeWidth={active ? 2.5 : 1.5} className="transition-all duration-150" />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-brown flex items-center justify-center font-mono text-[9px] text-bg font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`font-display font-bold tracking-wider transition-all duration-150 ${active ? 'text-[9px]' : 'text-[8px]'}`}>{label}</span>
              {/* Always rendered — transitions opacity & scaleX instead of unmounting */}
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-brown rounded-full shadow-[0_0_8px_var(--color-accent)] transition-all duration-200 ${
                active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
              }`} />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
