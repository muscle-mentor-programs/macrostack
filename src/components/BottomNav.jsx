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
    <nav
      id="client-bottom-nav"
      className="fixed bottom-0 left-0 right-0 w-full bg-card/95 backdrop-blur-sm border-t border-border nav-elevated nav-safe-bottom z-20"
    >
      <div className="grid grid-cols-5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id
          const badge  = id === 'messages' && unread > 0 ? unread : 0
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`relative flex flex-col items-center justify-center py-3.5 gap-1 transition-colors ${
                active ? 'text-brown-light' : 'text-muted'
              }`}
            >
              <div className="relative">
                <Icon size={active ? 20 : 18} strokeWidth={active ? 2.5 : 1.5} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-brown flex items-center justify-center font-mono text-[9px] text-bg font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`font-display font-bold tracking-wider ${active ? 'text-[9px]' : 'text-[8px]'}`}>{label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-brown rounded-full shadow-[0_0_8px_var(--color-accent)]" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
