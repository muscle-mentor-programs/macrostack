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
  const { activePage, setActivePage, activeClientId, messages, navHidden } = useStore()

  const unread = (messages[activeClientId] || []).filter(
    (m) => m.from === 'coach' && !m.readByClient
  ).length

  return (
    <nav
      id="client-bottom-nav"
      className={`fixed bottom-0 left-0 right-0 w-full glass-bottom-nav border-t border-border/40 nav-safe-bottom z-20 transition-transform duration-200 ${
        navHidden ? 'translate-y-full' : ''
      }`}
    >
      <div className="grid grid-cols-5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id
          const badge  = id === 'messages' && unread > 0 ? unread : 0
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
