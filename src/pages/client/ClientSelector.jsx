import { User, ArrowLeft } from 'lucide-react'
import useStore from '../../store'
import ClientAvatar from '../../components/ClientAvatar'
import ScrambleText from '../../components/ScrambleText'

export default function ClientSelector() {
  const { clients, setActiveClientId, setActiveRole, currentUser } = useStore()
  const isClientUser = currentUser?.role === 'client'

  return (
    <div className="flex flex-col h-screen bg-bg px-6 pt-12 pb-8">
      {/* Back button — coaches only; client users skip this row entirely */}
      {!isClientUser && (
        <div className="mb-10 anim-fade-in-down">
          <button
            onClick={() => setActiveRole(null)}
            className="flex items-center gap-2 text-muted hover:text-cream w-fit transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="font-display font-semibold text-sm tracking-widest">BACK</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 anim-fade-in-up" style={{ animationDelay: '50ms' }}>
        <h1 className="font-display font-black text-4xl tracking-widest text-cream">
          <ScrambleText text="SELECT" duration={700} delay={50} /><br />
          <ScrambleText text="PROFILE" duration={700} delay={200} />
        </h1>
        <p className="font-mono text-sm text-muted mt-2">Choose your user profile to continue</p>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center anim-fade-in" style={{ animationDelay: '120ms' }}>
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-4 anim-pop" style={{ animationDelay: '200ms' }}>
            <User size={28} className="text-muted" />
          </div>
          <p className="font-display font-bold text-xl text-muted tracking-widest">NO PROFILES</p>
          <p className="font-mono text-sm text-dim mt-2 max-w-xs">
            Your coach hasn&apos;t approved your request yet, or enter your coach code in your Profile after signing in.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client, ci) => (
            <button
              key={client.id}
              onClick={() => setActiveClientId(client.id)}
              className="w-full bg-card border border-border hover:border-olive/50 rounded-xl p-4 flex items-center gap-4 text-left transition-all group anim-fade-in-up"
              style={{ animationDelay: `${ci * 70 + 120}ms` }}
            >
              {/* Avatar */}
              <ClientAvatar name={client.name} avatarUrl={client.avatarUrl} className="w-12 h-12" textClassName="text-lg" color="olive" />
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-base tracking-wide text-cream">{client.name}</p>
                {client.email && (
                  <p className="font-mono text-xs text-muted truncate">{client.email}</p>
                )}
              </div>
              {/* Goal peek */}
              <div className="text-right">
                <p className="font-display font-black text-lg text-cream">{client.goals.calories}</p>
                <p className="font-mono text-xs text-muted">kcal goal</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
