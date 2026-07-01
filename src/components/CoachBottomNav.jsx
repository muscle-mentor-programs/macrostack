import { LayoutDashboard, Users, MessageCircle, Utensils, User, CreditCard, UserCog, Zap } from 'lucide-react'
import useStore from '../store'
import useIsSuperadmin from '../hooks/useIsSuperadmin'

const BASE_NAV = [
  { id: 'dashboard', label: 'HOME',    icon: LayoutDashboard },
  { id: 'clients',   label: 'USERS',   icon: Users           },
  { id: 'chat',      label: 'CHAT',    icon: MessageCircle   },
  { id: 'foods',     label: 'FOODS',   icon: Utensils        },
  { id: 'profile',   label: 'PROFILE', icon: User            },
]
// Coaches get an UPGRADE tab (plan management); superadmins get COACHES +
// BILLING instead (they have override access — mirrors the desktop sidebar).
const UPGRADE_NAV = { id: 'upgrade', label: 'UPGRADE', icon: Zap }
const COACHES_NAV = { id: 'coaches', label: 'COACHES', icon: UserCog }
const BILLING_NAV = { id: 'billing', label: 'BILLING', icon: CreditCard }

export default function CoachBottomNav() {
  const { activePage, setActivePage, clients, messages, navHidden } = useStore()

  const isSuperadmin = useIsSuperadmin()
  const NAV = isSuperadmin ? [...BASE_NAV, COACHES_NAV, BILLING_NAV] : [...BASE_NAV, UPGRADE_NAV]

  const totalUnread = clients.reduce(
    (n, c) =>
      n + (messages[c.id] || []).filter((m) => m.from === 'client' && !m.readByCoach).length,
    0
  )

  return (
    <nav
      className={`flex-shrink-0 w-full glass-bottom-nav border-t border-white/[0.06] nav-safe-bottom transition-all duration-200 ${
        navHidden ? 'translate-y-full opacity-0 pointer-events-none' : ''
      }`}
    >
      <div className={`grid ${isSuperadmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id
          const badge  = id === 'chat' && totalUnread > 0 ? totalUnread : 0
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`relative flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 ${
                active ? 'text-brown-light' : 'text-muted hover:text-cream'
              }`}
            >
              {/* Active pill background */}
              {active && (
                <span
                  className="absolute inset-x-3 top-1.5 bottom-4 rounded-xl pointer-events-none"
                  style={{ background: 'rgba(154,123,85,0.10)' }}
                />
              )}

              <div className="relative z-10 transition-all duration-200"
                style={{ transform: active ? 'scale(1.14)' : 'scale(1)' }}>
                <Icon
                  size={active ? 21 : 19}
                  strokeWidth={active ? 2.2 : 1.6}
                  className="transition-all duration-200"
                />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-brown flex items-center justify-center font-mono text-[9px] text-bg font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>

              <span
                className={`relative z-10 font-display font-bold tracking-wider transition-all duration-200 ${
                  active ? 'text-[9px] text-brown-light' : 'text-[8px]'
                }`}
              >
                {label}
              </span>

              {/* Glow line indicator */}
              <span
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-300 ${
                  active ? 'opacity-100 w-10' : 'opacity-0 w-0'
                }`}
                style={{
                  background: active
                    ? 'linear-gradient(90deg, transparent, var(--color-accent), transparent)'
                    : 'none',
                  boxShadow: active ? '0 0 14px var(--color-accent), 0 0 6px var(--color-accent)' : 'none',
                }}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
