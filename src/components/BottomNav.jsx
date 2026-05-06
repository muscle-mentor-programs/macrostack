import { Home, BookOpen, Scale, User, MessageCircle } from 'lucide-react'
import useStore from '../store'

const NAV = [
  { id: 'dashboard', label: 'HOME',    icon: Home          },
  { id: 'log',       label: 'LOG',     icon: BookOpen      },
  { id: 'weight',    label: 'WEIGHT',  icon: Scale         },
  { id: 'messages',  label: 'CHAT',    icon: MessageCircle },
  { id: 'profile',   label: 'PROFILE', icon: User          },
]

export default function BottomNav() {
  const { activePage, setActivePage, activeClientId, messages } = useStore()

  const unread = (messages[activeClientId] || []).filter(
    (m) => m.from === 'coach' && !m.readByClient
  ).length

  return (
    // fixed bottom-0 so the keyboard slides OVER the nav rather than pushing it up
    <nav
      id="client-bottom-nav"
      className="fixed bottom-0 left-0 right-0 w-full bg-surface border-t border-border nav-safe-bottom z-20"
    >
      <div className="grid grid-cols-5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id
          const badge  = id === 'messages' && unread > 0 ? unread : 0
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`relative flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                active ? 'text-brown-light' : 'text-muted'
              }`}
            >
              <div className="relative">
                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-brown flex items-center justify-center font-mono text-[9px] text-bg font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="font-display font-bold text-[8px] tracking-wider">{label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brown rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
