import { useEffect, useRef, useState } from 'react'
import { Globe, Award, User, BookOpen, MessageCircle, Check, ClipboardCheck, ClipboardList, ImagePlus, X, ChevronDown } from 'lucide-react'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'
import { successHaptic } from '../../utils/haptics'
import { DEFAULT_QUESTIONS } from '../../lib/checkinQuestions'
import { QuestionField, countAnswered, ScaleField as Scale, YesNoField as YesNo } from '../../components/FormFields'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

/* A form from the coach (intro questionnaire / custom) awaiting completion —
   collapsed card that expands into the full form. */
function PendingFormCard({ form, clientId }) {
  const submitClientForm = useStore((s) => s.submitClientForm)
  const [open, setOpen]       = useState(form.kind === 'intro') // intro starts open
  const [answers, setAnswers] = useState({})
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)

  const answered = countAnswered(form.questions, answers)
  const canSubmit = !saving && answered > 0

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    const snapshot = form.questions.map((q) => ({
      id: q.id, label: q.label, type: q.type,
      value: answers[q.id] ?? null,
    }))
    const res = await submitClientForm(form, clientId, snapshot)
    setSaving(false)
    if (res.ok) { successHaptic(); setDone(true) }
  }

  if (done) {
    return (
      <div className="glass-card border rounded-2xl p-5 text-center" style={{ borderColor: accentA(35) }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 anim-pop" style={{ background: accentA(18) }}>
          <Check size={18} style={{ color: 'var(--color-accent)' }} />
        </div>
        <p className="font-display font-bold text-sm tracking-widest text-cream">{form.title.toUpperCase()} SENT</p>
        <p className="font-mono text-xs text-muted mt-1">Your coach has your answers.</p>
      </div>
    )
  }

  return (
    <div className="glass-card border rounded-2xl p-5 space-y-4" style={{ borderColor: accentA(40) }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardList size={14} style={{ color: 'var(--color-accent)' }} className="flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-xs text-cream tracking-widest truncate">{form.title.toUpperCase()}</p>
            {form.description && !open && (
              <p className="font-mono text-[10px] text-muted mt-0.5 truncate">{form.description}</p>
            )}
          </div>
        </div>
        <span className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-[9px] tracking-[0.18em] px-2 py-1 rounded-full"
            style={{ background: accentA(16), color: 'var(--color-accent)' }}>
            {form.kind === 'intro' ? 'NEW' : 'TO DO'}
          </span>
          <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <>
          {form.description && (
            <p className="font-mono text-xs text-muted leading-relaxed -mt-1">{form.description}</p>
          )}
          {form.questions.map((q) => (
            <QuestionField
              key={q.id} question={q}
              value={answers[q.id]}
              onChange={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}
            />
          ))}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-dim)' }}>
              <div className="h-1 rounded-full transition-all duration-300"
                style={{ width: `${(answered / Math.max(form.questions.length, 1)) * 100}%`, background: 'var(--color-accent)' }} />
            </div>
            <span className="font-mono text-[10px] text-dim whitespace-nowrap">{answered}/{form.questions.length}</span>
          </div>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full btn-accent text-bg font-display font-bold text-sm tracking-widest py-3.5 rounded-xl transition-colors glow-hover press disabled:opacity-40"
          >
            {saving ? 'SENDING…' : `SEND ${form.kind === 'intro' ? 'ANSWERS' : 'FORM'}`}
          </button>
        </>
      )}
    </div>
  )
}

// Weekly check-in form — coach-customized questions, due tracking, optional
// photo uploads, and a success summary. Own state so hooks stay above the
// parent's early returns.
function WeeklyCheckinCard({ clientId, lastCheckin, allowPhotos = false }) {
  const { addClientCheckin, fetchCheckinQuestions, clients } = useStore()
  const client = clients.find((c) => c.id === clientId)

  const [questions, setQuestions] = useState(null) // null while loading
  const [weight, setWeight]   = useState('')
  const [unit, setUnit]       = useState(lastCheckin?.weightUnit || 'lbs')
  const [answers, setAnswers] = useState({})       // { [questionId]: value }
  const [photos, setPhotos]   = useState([])       // File[] (max 4)
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)
  const photoInputRef = useRef(null)

  const addPhotos = (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    setPhotos((p) => [...p, ...files].slice(0, 4))
  }
  const removePhoto = (i) => setPhotos((p) => p.filter((_, x) => x !== i))

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
    }, photos)
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

      {/* Progress photos (coach-enabled) */}
      {allowPhotos && questions !== null && (
        <div>
          <label className="font-display text-xs text-muted tracking-widest block mb-1.5">
            PROGRESS PHOTOS <span className="text-dim normal-case tracking-normal">(optional)</span>
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((f, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img src={URL.createObjectURL(f)} alt={`Photo ${i + 1}`}
                  className="w-16 aspect-[3/4] object-cover rounded-lg border border-border" />
                <button
                  type="button" onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-bg border border-border flex items-center justify-center text-muted hover:text-red-400 transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button
                type="button" onClick={() => photoInputRef.current?.click()}
                className="flex-shrink-0 w-16 aspect-[3/4] rounded-lg border border-dashed border-border hover:border-brown/60 flex flex-col items-center justify-center gap-1 text-dim hover:text-brown-light transition-colors"
              >
                <ImagePlus size={14} />
                <span className="font-mono text-[8px] tracking-widest">ADD</span>
              </button>
            )}
          </div>
          <p className="font-mono text-[9px] text-dim mt-1">Saved to your progress timeline for your coach.</p>
          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
        </div>
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
  const { coachProfile, activeClientId, clients, setActivePage, loadCoachProfile, coachForms, fetchCoachForms } = useStore()

  const client = clients.find((c) => c.id === activeClientId)

  // Re-load if coachProfile is stale or missing
  useEffect(() => {
    if (!coachProfile && client?.coachId) {
      loadCoachProfile(client.coachId)
    }
  }, [client?.coachId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Forms this coach auto-sends (intro / custom) + weekly check-in settings
  useEffect(() => {
    if (client?.coachId) fetchCoachForms()
  }, [client?.coachId]) // eslint-disable-line react-hooks/exhaustive-deps

  const forms = coachForms || []
  const weeklyCfg = forms.find((f) => f.kind === 'weekly')
  // Pending = active intro/custom forms this client hasn't submitted yet
  const pendingForms = forms.filter((f) =>
    f.kind !== 'weekly' && f.active && f.questions.length > 0 &&
    !(client?.submissions || []).some((s) => s.formId === f.id)
  )

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

          {/* Forms from the coach — shown until completed */}
          {pendingForms.map((f) => (
            <PendingFormCard key={f.id} form={f} clientId={activeClientId} />
          ))}

          {/* Weekly check-in */}
          <WeeklyCheckinCard
            clientId={activeClientId}
            lastCheckin={client?.checkins?.[0]}
            allowPhotos={!!weeklyCfg?.allowPhotos}
          />

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
