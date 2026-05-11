import { LayoutDashboard, Users, MessageCircle, Utensils, User } from 'lucide-react'
import useStore from '../store'

const NAV = [
  { id: 'dashboard', label: 'HOME',    icon: LayoutDashboard },
  { id: 'clients',   label: 'USERS',   icon: Users           },
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
    <nav
      className={`flex-shrink-0 w-full glass-bottom-nav border-t border-border/40 nav-safe-bottom transition-transform duration-200 ${
        navHidden ? 'translate-y-full' : ''
      }`}
    >
      <div className="grid grid-cols-5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id
          const badge  = id === 'chat' && totalUnread > 0 ? totalUnread : 0
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`relative flex flex-col items-center justify-center py-3.5 gap-1 transition-all duration-200 ${
                active ? 'text-brown-light' : 'text-muted'
              }`}
            >
              <div
                className="relative transition-all duration-200"
                style={{ transform: active ? 'scale(1.12)' : 'scale(1)' }}
              >
                <Icon
                  size={active ? 20 : 18}
                  strokeWidth={active ? 2.5 : 1.5}
                  className="transition-all duration-200"
                />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-brown flex items-center justify-center font-mono text-[9px] text-bg font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span
                className={`font-display font-bold tracking-wider transition-all duration-200 ${
                  active ? 'text-[9px]' : 'text-[8px]'
                }`}
              >
                {label}
              </span>
              {/* Glowing bottom indicator line */}
              <span
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300 ${
                  active ? 'opacity-100 w-8' : 'opacity-0 w-0'
                }`}
                style={{
                  background: 'var(--color-accent)',
                  boxShadow: active ? '0 0 10px var(--color-accent)' : 'none',
                }}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
