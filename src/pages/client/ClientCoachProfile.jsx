import { useEffect, useState } from 'react'
import { Globe, Award, User, BookOpen, MessageCircle, Check, ClipboardCheck } from 'lucide-react'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'
import PremiumGate from '../../components/PremiumGate'
import useSubscription from '../../hooks/useSubscription'
import { successHaptic } from '../../utils/haptics'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

// 1–5 selector used for adherence / hunger / energy
function Scale({ label, low, high, value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-display text-xs text-muted tracking-widest">{label}</label>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button" onClick={() => onChange(n)}
            className="flex-1 h-9 rounded-lg font-mono text-sm transition-colors border press"
            style={value === n
              ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'transparent' }
              : { borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-surface)' }}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[9px] text-dim">{low}</span>
        <span className="font-mono text-[9px] text-dim">{high}</span>
      </div>
    </div>
  )
}

// Weekly check-in form — own state so hooks stay above the parent's early returns
function WeeklyCheckinCard({ clientId, lastCheckin }) {
  const addClientCheckin = useStore((s) => s.addClientCheckin)
  const [weight, setWeight]       = useState('')
  const [unit, setUnit]           = useState('lbs')
  const [adherence, setAdherence] = useState(0)
  const [hunger, setHunger]       = useState(0)
  const [energy, setEnergy]       = useState(0)
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [done, setDone]           = useState(false)

  const submit = async () => {
    if (saving) return
    setSaving(true)
    const res = await addClientCheckin(clientId, {
      weight: weight ? Number(weight) : null,
      weightUnit: unit,
      adherence: adherence || null,
      hunger: hunger || null,
      energy: energy || null,
      notes: notes.trim(),
    })
    setSaving(false)
    if (res.ok) { successHaptic(); setDone(true) }
  }

  if (done) {
    return (
      <div className="glass-card border rounded-2xl p-6 text-center" style={{ borderColor: accentA(35) }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 anim-pop"
          style={{ background: accentA(18) }}>
          <Check size={22} style={{ color: 'var(--color-accent)' }} />
        </div>
        <p className="font-display font-bold text-sm tracking-widest text-cream">CHECK-IN SENT</p>
        <p className="font-mono text-xs text-muted mt-1.5">Your coach will review it and adjust if needed.</p>
      </div>
    )
  }

  const lastDate = lastCheckin?.createdAt ? new Date(lastCheckin.createdAt).toLocaleDateString() : null

  return (
    <div className="glass-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={14} style={{ color: 'var(--color-accent)' }} />
          <p className="font-display text-xs text-muted tracking-widest">WEEKLY CHECK-IN</p>
        </div>
        {lastDate && <span className="font-mono text-[10px] text-dim">Last: {lastDate}</span>}
      </div>

      {/* Weight */}
      <div>
        <label className="font-display text-xs text-muted tracking-widest block mb-1.5">CURRENT WEIGHT</label>
        <div className="flex gap-2">
          <input
            type="number" inputMode="decimal" placeholder="0.0"
            value={weight} onChange={(e) => setWeight(e.target.value)}
            className="flex-1 min-w-0 bg-surface border border-border rounded-xl px-4 py-3 font-mono text-base text-cream placeholder-muted focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30"
          />
          <button
            type="button" onClick={() => setUnit(unit === 'lbs' ? 'kg' : 'lbs')}
            className="flex-shrink-0 bg-surface border border-border rounded-xl px-3.5 font-display font-bold text-sm text-muted hover:text-cream transition-colors"
          >
            {unit}
          </button>
        </div>
      </div>

      <Scale label="ADHERENCE" low="Off plan" high="Nailed it" value={adherence} onChange={setAdherence} />
      <Scale label="HUNGER"    low="Starving"  high="Satisfied" value={hunger}    onChange={setHunger} />
      <Scale label="ENERGY"    low="Drained"   high="Great"     value={energy}    onChange={setEnergy} />

      <div>
        <label className="font-display text-xs text-muted tracking-widest block mb-1.5">NOTES FOR YOUR COACH</label>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          placeholder="How did the week go? Anything I should know…"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 resize-none"
        />
      </div>

      <button
        onClick={submit}
        disabled={saving}
        className="w-full btn-accent text-bg font-display font-bold text-sm tracking-widest py-3.5 rounded-xl transition-colors glow-hover press disabled:opacity-50"
      >
        {saving ? 'SENDING…' : 'SEND CHECK-IN'}
      </button>
    </div>
  )
}

export default function ClientCoachProfile() {
  const { coachProfile, activeClientId, clients, setActivePage, loadCoachProfile } = useStore()
  const { hasAccess } = useSubscription()

  const client = clients.find((c) => c.id === activeClientId)

  // Re-load if coachProfile is stale or missing
  useEffect(() => {
    if (!coachProfile && client?.coachId) {
      loadCoachProfile(client.coachId)
    }
  }, [client?.coachId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Coach connection is premium
  if (!hasAccess) {
    return (
      <div className="flex flex-col min-h-full w-full overflow-x-hidden">
        <div className="glass-panel accent-line relative px-4 pt-mobile-header pb-4 border-b border-border anim-fade-in-down">
          <h2 className="font-display font-black text-3xl tracking-wider text-cream">
            <ScrambleText text="COACH" duration={700} />
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <PremiumGate
            title="COACH CONNECTION"
            blurb="Link with a certified coach for personalized targets, meal plans, and messaging."
          />
        </div>
      </div>
    )
  }

  if (!coachProfile && !client?.coachId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center px-8 anim-fade-in">
        <User size={36} className="text-dim mb-4" />
        <p className="font-display font-bold text-xl text-muted tracking-widest">NO COACH LINKED</p>
        <p className="font-mono text-sm text-dim mt-2 max-w-xs leading-relaxed">
          Have a coach code? Enter it under Profile → Link to Coach to connect.
        </p>
        <button
          onClick={() => setActivePage('profile')}
          className="mt-6 px-5 py-2.5 rounded-xl border border-border text-cream font-display font-bold text-xs tracking-widest hover:border-muted transition-colors press"
        >
          ENTER COACH CODE
        </button>
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
          <div className="glass-card border border-border rounded-2xl p-5 flex items-center gap-4">
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

          {/* Weekly check-in */}
          <WeeklyCheckinCard clientId={activeClientId} lastCheckin={client?.checkins?.[0]} />

          {/* Bio */}
          {profile.bio && (
            <div className="glass-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={13} className="text-muted" />
                <p className="font-display text-xs text-muted tracking-widest">ABOUT</p>
              </div>
              <p className="font-mono text-sm text-cream leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Specialties */}
          {specialtyList.length > 0 && (
            <div className="glass-card border border-border rounded-2xl p-5">
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
            <div className="glass-card border border-border rounded-2xl p-5">
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
