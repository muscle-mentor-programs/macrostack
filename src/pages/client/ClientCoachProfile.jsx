import { useEffect } from 'react'
import { Globe, Award, User, BookOpen, MessageCircle } from 'lucide-react'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'

export default function ClientCoachProfile() {
  const { coachProfile, activeClientId, clients, setActivePage, loadCoachProfile } = useStore()

  const client = clients.find((c) => c.id === activeClientId)

  // Re-load if coachProfile is stale or missing
  useEffect(() => {
    if (!coachProfile && client?.coachId) {
      loadCoachProfile(client.coachId)
    }
  }, [client?.coachId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!coachProfile && !client?.coachId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center px-8 anim-fade-in">
        <User size={36} className="text-dim mb-4" />
        <p className="font-display font-bold text-xl text-muted tracking-widest">NO COACH LINKED</p>
        <p className="font-mono text-sm text-dim mt-2">You haven't been linked to a coach yet.</p>
      </div>
    )
  }

  const profile = coachProfile
  const initial = (profile?.name || 'C').charAt(0).toUpperCase()

  const specialtyList = profile?.specialties
    ? profile.specialties.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div className="flex flex-col min-h-full w-full overflow-x-hidden">
      {/* Header */}
      <div className="glass-panel accent-line relative px-4 pt-mobile-header pb-4 border-b border-border anim-fade-in-down">
        <h2 className="font-display font-black text-3xl tracking-wider text-cream">
          <ScrambleText text="COACH" duration={700} />
        </h2>
        <p className="font-mono text-xs text-muted mt-0.5">Your nutrition coach</p>
      </div>

      {!profile ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8 anim-fade-in">
          <div className="w-8 h-8 border-2 border-brown border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-mono text-sm text-muted">Loading coach profile…</p>
        </div>
      ) : (
        <div className="px-4 py-6 space-y-6 pb-24 anim-fade-in">

          {/* Avatar + name card */}
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
              <span className="font-display font-black text-2xl text-brown-light">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-lg text-cream">{profile.name}</p>
              {profile.credentials && (
                <p className="font-mono text-xs text-muted mt-0.5">{profile.credentials}</p>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-brown-light mt-0.5 flex items-center gap-1 hover:text-brown"
                >
                  <Globe size={10} />
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>

          {/* Message button */}
          <button
            onClick={() => setActivePage('messages')}
            className="w-full flex items-center justify-center gap-2 bg-brown hover:bg-brown-light text-bg font-display font-bold text-sm tracking-widest py-3.5 rounded-2xl transition-colors glow-hover"
          >
            <MessageCircle size={16} />
            MESSAGE {profile.name.split(' ')[0].toUpperCase()}
          </button>

          {/* Bio */}
          {profile.bio && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={13} className="text-muted" />
                <p className="font-display text-xs text-muted tracking-widest">ABOUT</p>
              </div>
              <p className="font-mono text-sm text-cream leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Specialties */}
          {specialtyList.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Award size={13} className="text-muted" />
                <p className="font-display text-xs text-muted tracking-widest">SPECIALTIES</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialtyList.map((s, i) => (
                  <span key={i} className="font-mono text-xs text-brown-light bg-brown/10 border border-brown/20 px-3 py-1 rounded-xl">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Credentials */}
          {profile.credentials && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <User size={13} className="text-muted" />
                <p className="font-display text-xs text-muted tracking-widest">CREDENTIALS</p>
              </div>
              <p className="font-mono text-sm text-cream">{profile.credentials}</p>
            </div>
          )}

          {/* Empty state when profile has no info filled in yet */}
          {!profile.bio && !profile.credentials && specialtyList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center anim-fade-in">
              <User size={28} className="text-dim mb-3" />
              <p className="font-display font-bold text-lg text-muted tracking-widest">PROFILE COMING SOON</p>
              <p className="font-mono text-sm text-dim mt-1">Your coach hasn't filled in their profile yet.</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
