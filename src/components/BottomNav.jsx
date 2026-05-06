import { Home, BookOpen, TrendingUp, Scale, User, MessageCircle } from 'lucide-react'
import useStore from '../store'

const NAV = [
  { id: 'dashboard', label: 'HOME',     icon: Home          },
  { id: 'log',       label: 'LOG',      icon: BookOpen      },
  { id: 'weight',    label: 'WEIGHT',   icon: Scale         },
  { id: 'progress',  label: 'PROGRESS', icon: TrendingUp    },
  { id: 'messages',  label: 'CHAT',     icon: MessageCircle },
  { id: 'profile',   label: 'PROFILE',  icon: User          },
]

export default function BottomNav() {
  const { activePage, setActivePage, activeClientId, messages } = useStore()

  const unread = (messages[activeClientId] || []).filter(
    (m) => m.from === 'coach' && !m.readByClient
  ).length

  return (
    <nav className="flex-shrink-0 bg-surface border-t border-border grid grid-cols-6 safe-area-bottom">
      {NAV.map(({ id, label, icon: Icon }) => {
        const active = activePage === id
        const badge  = id === 'messages' && unread > 0 ? unread : 0
        return (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            className={`relative flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              active ? 'text-brown-light' : 'text-muted'
            }`}
          >
            <div className="relative">
              <Icon size={17} strokeWidth={active ? 2.5 : 1.5} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-brown flex items-center justify-center font-mono text-[8px] text-bg font-bold">
                  {badge}
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
    </nav>
  )
}
