import { useEffect, useState } from 'react'
import { Globe, Award, User, BookOpen, MessageCircle, Check, ClipboardCheck } from 'lucide-react'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'
import { successHaptic } from '../../utils/haptics'
import { DEFAULT_QUESTIONS } from '../../lib/checkinQuestions'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

// 1–5 selector with labeled endpoints
function Scale({ low, high, value, onChange }) {
  return (
    <div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button" onClick={() => onChange(n)}
            className="flex-1 h-10 rounded-lg font-mono text-sm transition-all border press"
            style={value === n
              ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'transparent', transform: 'scale(1.04)' }
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

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[{ v: true, l: 'YES' }, { v: false, l: 'NO' }].map(({ v, l }) => (
        <button
          key={l} type="button" onClick={() => onChange(v)}
          className="flex-1 h-10 rounded-lg font-display font-bold text-xs tracking-widest transition-all border press"
          style={value === v
            ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'transparent' }
            : { borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-surface)' }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

// Weekly check-in form — coach-customized questions, due tracking, and a
// success summary. Own state so hooks stay above the parent's early returns.
function WeeklyCheckinCard({ clientId, lastCheckin }) {
  const { addClientCheckin, fetchCheckinQuestions, clients } = useStore()
  const client = clients.find((c) => c.id === clientId)

  const [questions, setQuestions] = useState(null) // null while loading
  const [weight, setWeight]   = useState('')
  const [unit, setUnit]       = useState(lastCheckin?.weightUnit || 'lbs')
  const [answers, setAnswers] = useState({})       // { [questionId]: value }
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)

  useEffect(() => {
    let alive = true
    fetchCheckinQuestions().then((qs) => {
      if (alive) setQuestions(qs?.length ? qs : DEFAULT_QUESTIONS)
    })
    return () => { alive = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Due status — weekly cadence from the last submission
  const daysSince = lastCheckin?.createdAt
    ? Math.floor((Date.now() - new Date(lastCheckin.createdAt).getTime()) / 86_400_000)
    : null
  const isDue = daysSince === null || daysSince >= 7

  const lastWeight = (client?.weightLog || []).slice(-1)[0]

  const setAnswer = (id, value) => setAnswers((p) => ({ ...p, [id]: value }))
  const answeredCount = questions
    ? questions.filter((q) => {
        const v = answers[q.id]
        return v !== undefined && v !== null && String(v).trim() !== ''
      }).length
    : 0
  const canSubmit = !saving && (weight || answeredCount > 0)

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)

    // Snapshot every question with its answer (unanswered → null)
    const snapshot = questions.map((q) => ({
      id: q.id, label: q.label, type: q.type,
      value: answers[q.id] !== undefined && String(answers[q.id]).trim?.() !== '' ? answers[q.id] : answers[q.id] ?? null,
    }))
    // Slug-mapped questions also fill the legacy columns (trends + Kay)
    const bySlug = (slug) => {
      const q = questions.find((x) => x.slug === slug)
      const v = q ? answers[q.id] : null
      return typeof v === 'number' ? v : null
    }

    const res = await addClientCheckin(clientId, {
      weight: weight ? Number(weight) : null,
      weightUnit: unit,
      adherence: bySlug('adherence'),
      hunger:    bySlug('hunger'),
      energy:    bySlug('energy'),
      notes: '',
      answers: snapshot,
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
        <p className="font-mono text-xs text-muted mt-1.5">
          {answeredCount} answer{answeredCount === 1 ? '' : 's'}{weight ? ` + weight (${weight} ${unit})` : ''} sent to your coach.
        </p>
        <p className="font-mono text-[10px] text-dim mt-2">Next check-in is due in 7 days — we'll remind you.</p>
      </div>
    )
  }

  return (
    <div className="glass-card border rounded-2xl p-5 space-y-5"
      style={{ borderColor: isDue ? accentA(40) : 'var(--color-border)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={14} style={{ color: 'var(--color-accent)' }} />
          <p className="font-display text-xs text-muted tracking-widest">WEEKLY CHECK-IN</p>
        </div>
        {isDue ? (
          <span className="font-mono text-[9px] tracking-[0.18em] px-2 py-1 rounded-full"
            style={{ background: accentA(16), color: 'var(--color-accent)' }}>
            {daysSince === null ? 'FIRST CHECK-IN' : 'DUE'}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-dim">Next due in {7 - daysSince}d</span>
        )}
      </div>

      {daysSince !== null && daysSince >= 7 && (
        <p className="font-mono text-[10px] text-muted -mt-2">
          Last check-in was {daysSince} days ago.
        </p>
      )}

      {/* Weight */}
      <div>
        <label className="font-display text-xs text-muted tracking-widest block mb-1.5">CURRENT WEIGHT</label>
        <div className="flex gap-2">
          <input
            type="number" inputMode="decimal"
            placeholder={lastWeight ? `Last: ${lastWeight.value}` : '0.0'}
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

      {/* Coach's questions */}
      {questions === null ? (
        <div className="py-4 flex justify-center">
          <div className="w-5 h-5 border-2 border-brown border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        questions.map((q) => (
          <div key={q.id}>
            <label className="font-display text-xs text-muted tracking-widest block mb-1.5 leading-relaxed">
              {q.label.toUpperCase()}
            </label>
            {q.type === 'scale' && (
              <Scale low={q.low} high={q.high} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
            )}
            {q.type === 'yesno' && (
              <YesNo value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
            )}
            {q.type === 'text' && (
              <textarea
                value={answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} rows={2}
                placeholder="Type your answer…"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 resize-none"
              />
            )}
          </div>
        ))
      )}

      {/* Progress + submit */}
      {questions !== null && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-dim)' }}>
              <div className="h-1 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%`, background: 'var(--color-accent)' }} />
            </div>
            <span className="font-mono text-[10px] text-dim whitespace-nowrap">{answeredCount}/{questions.length}</span>
          </div>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full btn-accent text-bg font-display font-bold text-sm tracking-widest py-3.5 rounded-xl transition-colors glow-hover press disabled:opacity-40"
          >
            {saving ? 'SENDING…' : 'SEND CHECK-IN'}
          </button>
        </>
      )}
    </div>
  )
}

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
      <div className="glass-panel accent-line sticky top-0 z-20 px-4 pt-mobile-header pb-4 border-b border-border anim-fade-in-down">
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
