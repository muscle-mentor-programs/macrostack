import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { format, subDays } from 'date-fns'
import { Check, Link2, Camera, Bell, BellRing, Unlink, Search, Loader2 } from 'lucide-react'
import { enablePush, pushPermission } from '../../lib/push'
import {
  AreaChart, Area, XAxis, YAxis,
  ResponsiveContainer, Tooltip, ReferenceLine,
} from 'recharts'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'
import ClientAvatar from '../../components/ClientAvatar'
import AvatarCropModal from '../../components/AvatarCropModal'
import CoachMarketplace from '../../components/CoachMarketplace'

/* Enable browser push — new messages from the coach ping the home screen. */
function PushToggle() {
  const registerPushSubscription = useStore((s) => s.registerPushSubscription)
  const [state, setState] = useState(pushPermission())
  if (state === 'unsupported') return null

  const enable = async () => {
    const res = await enablePush(registerPushSubscription)
    setState(res.ok ? 'granted' : pushPermission())
  }

  return (
    <button
      onClick={state === 'granted' ? undefined : enable}
      className="w-full flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border/50"
    >
      <span className="flex items-center gap-2.5 text-left">
        <BellRing size={14} className="text-muted flex-shrink-0" />
        <span>
          <span className="block font-mono text-sm text-cream">Push notifications</span>
          <span className="block font-mono text-[10px] text-dim mt-0.5">
            Get pinged when your coach messages you
          </span>
        </span>
      </span>
      <span className="font-mono text-[9px] tracking-[0.18em] px-2 py-1 rounded-full flex-shrink-0"
        style={state === 'granted'
          ? { background: 'rgba(107,122,82,0.15)', color: '#849663' }
          : { background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)', color: 'var(--color-accent)' }}>
        {state === 'granted' ? 'ON' : 'ENABLE'}
      </span>
    </button>
  )
}

export default function ClientProfile() {
  const {
    activeClientId, clients, updateClientProfile, uploadClientAvatar,
    submitCoachCode, setClientReminders, updateClientGoals, setServingPref,
    unlinkFromCoach, myCoachRequests, fetchMyCoachRequests, coachProfile,
  } = useStore()
  const client = clients.find((c) => c.id === activeClientId)

  // Unlink + marketplace
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  const [unlinking,     setUnlinking]     = useState(false)
  const [showMarket,    setShowMarket]    = useState(false)

  useEffect(() => { fetchMyCoachRequests() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // A coach replied to a marketplace request with their connection code
  const codeSentReq = myCoachRequests.find((r) => r.status === 'code_sent' && r.coach_code)

  // My targets editing (available to every user; coach edits override)
  const [editGoals, setEditGoals] = useState(false)
  const [goalDraft, setGoalDraft] = useState({ calories: '', protein: '', carbs: '', fat: '' })

  // Coach code linking
  const [codeInput,  setCodeInput]  = useState('')
  const [codeStatus, setCodeStatus] = useState('idle') // 'idle' | 'sending' | 'sent' | 'error'
  const [codeError,  setCodeError]  = useState('')
  const [coachName,  setCoachName]  = useState('')

  const hasCoach = Boolean(client?.coachId)

  const handleSubmitCode = async (e) => {
    e.preventDefault()
    if (!codeInput.trim()) return
    setCodeStatus('sending')
    setCodeError('')
    const result = await submitCoachCode(codeInput.trim())
    if (result.ok) {
      setCodeStatus('sent')
      setCoachName(result.coachName || '')
    } else {
      setCodeStatus('error')
      setCodeError(result.error || 'Something went wrong.')
    }
  }

  const handleUseSentCode = async () => {
    if (!codeSentReq) return
    setCodeStatus('sending')
    setCodeError('')
    const result = await submitCoachCode(codeSentReq.coach_code)
    if (result.ok) {
      setCodeStatus('sent')
      setCoachName(result.coachName || '')
    } else {
      setCodeStatus('error')
      setCodeError(result.error || 'Something went wrong.')
    }
  }

  const handleUnlink = async () => {
    setUnlinking(true)
    const res = await unlinkFromCoach()
    setUnlinking(false)
    setConfirmUnlink(false)
    if (res.ok) {
      setCoachName('')
      setCodeStatus('idle')
      setCodeInput('')
    }
  }

  const [form, setForm] = useState({
    name:   client?.name   || '',
    height: client?.height || '',
    dob:    client?.dob    || '',
    phone:  client?.phone  || '',
    bio:    client?.bio    || '',
  })
  const [saved,      setSaved]      = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [cropSrc,    setCropSrc]    = useState(null)   // object-URL while cropping
  const fileInputRef = useRef(null)

  // Step 1 — file selected → open crop modal
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCropSrc(url)
    e.target.value = ''
  }

  // Step 2 — crop confirmed → upload blob
  const handleCropConfirm = async (blob) => {
    URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setUploading(true)
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    await uploadClientAvatar(activeClientId, file)
    setUploading(false)
  }

  const handleCropCancel = () => {
    URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = () => {
    updateClientProfile(activeClientId, {
      name:   form.name,
      height: form.height,
      dob:    form.dob,
      phone:  form.phone,
      bio:    form.bio,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── 30-day progress data ───────────────────────────────────────────────────
  const calData = Array.from({ length: 30 }, (_, i) => {
    const date    = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
    const entries = client?.log?.[date] || []
    return {
      date:    format(subDays(new Date(), 29 - i), 'MMM d'),
      cal:     entries.reduce((s, e) => s + (e.calories || 0), 0),
      protein: entries.reduce((s, e) => s + (e.protein  || 0), 0),
      fat:     entries.reduce((s, e) => s + (e.fat      || 0), 0),
    }
  })
  const daysLogged = calData.filter((d) => d.cal > 0).length
  const avgCal     = daysLogged > 0 ? calData.reduce((s, d) => s + d.cal,     0) / daysLogged : 0
  const avgProtein = daysLogged > 0 ? calData.reduce((s, d) => s + d.protein, 0) / daysLogged : 0
  const avgFat     = daysLogged > 0 ? calData.reduce((s, d) => s + d.fat,     0) / daysLogged : 0

  const tooltipStyle = {
    background: '#1C1A18', border: '1px solid #2A2724',
    borderRadius: 8, fontFamily: 'Space Mono', fontSize: 11, color: '#E8E4DC',
  }

  const inputCls =
    'w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 transition-colors'
  const lbl = 'font-display text-xs text-muted tracking-widest block mb-1.5'

  return (
    <>
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 px-5 pt-mobile-header pb-4 border-b border-border anim-fade-in-down glass-panel accent-line">
        <h1 className="font-display font-black text-3xl tracking-wide text-cream">
          <ScrambleText text="PROFILE" duration={750} />
        </h1>
        <p className="font-mono text-xs text-muted mt-1">Your info & 30-day progress</p>
      </div>

      {/* Avatar — tap to upload */}
      <div className="flex flex-col items-center mt-5 mb-6 anim-pop" style={{ animationDelay: '80ms' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative group focus:outline-none"
        >
          <ClientAvatar
            name={form.name || client?.name}
            avatarUrl={client?.avatarUrl}
            className="w-20 h-20"
            textClassName="text-3xl"
            color="olive"
          />
          {/* Camera overlay */}
          <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {uploading
              ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Camera size={20} className="text-white" />
            }
          </div>
        </button>
        <p className="font-mono text-xs text-dim mt-2">
          {uploading ? 'Uploading…' : 'Tap to change photo'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* Link to Coach */}
      <div className="mx-5 mb-6 glass-card border border-border rounded-2xl p-4 anim-fade-in-up card-hover" style={{ animationDelay: '130ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <Link2 size={14} className="text-olive-light" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted">LINK TO COACH</p>
        </div>

        {hasCoach ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 py-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-olive/20 border border-olive/30 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-olive-light" />
                </div>
                <p className="font-mono text-sm text-olive-light truncate">
                  Linked to {(coachProfile?.name || coachName) ? <span className="text-cream">{coachProfile?.name || coachName}</span> : 'your coach'}
                </p>
              </div>
              {!confirmUnlink && (
                <button
                  onClick={() => setConfirmUnlink(true)}
                  className="flex items-center gap-1.5 flex-shrink-0 font-display font-bold text-[10px] tracking-widest px-3 py-2 rounded-lg border border-border text-dim hover:text-red-400 hover:border-red-400/30 transition-colors press"
                >
                  <Unlink size={11} /> UNLINK
                </button>
              )}
            </div>
            {confirmUnlink && (
              <div className="bg-red-400/[0.06] border border-red-400/25 rounded-xl p-3.5 space-y-3 anim-fade-in">
                <p className="font-mono text-xs text-muted leading-relaxed">
                  <span className="text-red-400 font-bold">Are you sure?</span> Your coach will lose
                  access to your logs and check-ins, your meal plans from them go away, and any
                  Pro access included through them ends.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleUnlink}
                    disabled={unlinking}
                    className="flex-1 flex items-center justify-center gap-2 font-display font-bold text-xs tracking-widest py-2.5 rounded-lg bg-red-400/15 border border-red-400/30 text-red-400 hover:bg-red-400/25 transition-colors disabled:opacity-50"
                  >
                    {unlinking ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
                    YES, UNLINK
                  </button>
                  <button
                    onClick={() => setConfirmUnlink(false)}
                    disabled={unlinking}
                    className="flex-1 font-display font-bold text-xs tracking-widest py-2.5 rounded-lg border border-border text-muted hover:text-cream transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : codeStatus === 'sent' ? (
          <p className="font-mono text-sm text-olive-light py-2">
            Linked to {coachName ? <span className="text-cream">{coachName}</span> : 'your coach'}!
          </p>
        ) : (
          <div className="space-y-3">
            {/* A coach answered your marketplace request with their code */}
            {codeSentReq && (
              <button
                onClick={handleUseSentCode}
                disabled={codeStatus === 'sending'}
                className="w-full text-left rounded-xl p-3.5 border transition-colors press anim-fade-in"
                style={{
                  borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
                  background:  'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                }}
              >
                <p className="font-display font-bold text-xs tracking-widest" style={{ color: 'var(--color-accent)' }}>
                  {codeStatus === 'sending' ? 'LINKING…' : 'A COACH SENT YOU THEIR CODE'}
                </p>
                <p className="font-mono text-xs text-muted mt-1">
                  Tap to link with code <span className="text-cream tracking-widest">{codeSentReq.coach_code}</span>
                </p>
              </button>
            )}
            <form onSubmit={handleSubmitCode} className="space-y-3">
              <p className="font-mono text-xs text-muted leading-relaxed">
                Enter the code your coach gave you to link your account.
              </p>
              <div>
                <input
                  type="text"
                  placeholder="BRAN4X7K"
                  value={codeInput}
                  onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); setCodeStatus('idle') }}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-olive transition-colors tracking-widest uppercase"
                  maxLength={12}
                />
              </div>
              {codeStatus === 'error' && (
                <p className="font-mono text-xs text-red-400 anim-fade-in">{codeError}</p>
              )}
              <button
                type="submit"
                disabled={codeStatus === 'sending' || !codeInput.trim()}
                className="w-full py-3 rounded-xl font-display font-bold text-sm tracking-widest bg-olive hover:bg-olive-light disabled:opacity-40 disabled:cursor-not-allowed text-bg transition-colors"
              >
                {codeStatus === 'sending' ? 'LINKING...' : 'LINK'}
              </button>
            </form>
            {/* No code? Browse the marketplace */}
            <div className="flex items-center gap-3">
              <span className="flex-1 h-px bg-border" />
              <span className="font-mono text-[9px] tracking-[0.3em] text-dim">OR</span>
              <span className="flex-1 h-px bg-border" />
            </div>
            <button
              onClick={() => setShowMarket(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-sm tracking-widest border transition-colors press"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
                background:  'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                color: 'var(--color-accent)',
              }}
            >
              <Search size={14} />
              FIND A COACH
            </button>
          </div>
        )}
      </div>

      {/* My targets — every user (free or Pro) can edit; a linked coach can
          override from their portal at any time */}
      <div className="mx-5 mb-6 glass-card border border-border rounded-2xl p-4 anim-fade-in-up card-hover" style={{ animationDelay: '190ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted">MY TARGETS</p>
          </div>
          <button
            onClick={() => {
              if (editGoals) { setEditGoals(false); return }
              setGoalDraft({
                calories: String(client?.goals?.calories ?? ''),
                protein:  String(client?.goals?.protein  ?? ''),
                carbs:    String(client?.goals?.carbs    ?? ''),
                fat:      String(client?.goals?.fat      ?? ''),
              })
              setEditGoals(true)
            }}
            className="font-display font-bold text-xs tracking-widest text-brown-light press"
          >
            {editGoals ? 'CANCEL' : 'EDIT'}
          </button>
        </div>
        {editGoals ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'calories', label: 'CALORIES / kcal' },
                { key: 'protein',  label: 'PROTEIN / g'     },
                { key: 'carbs',    label: 'CARBS / g'       },
                { key: 'fat',      label: 'FAT / g'         },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="font-mono text-[10px] tracking-widest text-muted block mb-1">{label}</label>
                  <input
                    type="number" inputMode="numeric" min="0"
                    value={goalDraft[key]}
                    onChange={(e) => setGoalDraft((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 font-mono text-sm text-cream focus:outline-none focus:border-brown"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                updateClientGoals(activeClientId, {
                  calories: Number(goalDraft.calories) || 0,
                  protein:  Number(goalDraft.protein)  || 0,
                  carbs:    Number(goalDraft.carbs)    || 0,
                  fat:      Number(goalDraft.fat)      || 0,
                })
                setEditGoals(false)
              }}
              className="w-full mt-3 btn-accent font-display font-bold text-xs tracking-widest py-2.5 rounded-xl press"
              style={{ color: '#fff' }}
            >
              SAVE TARGETS
            </button>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'CALORIES', value: client?.goals?.calories, unit: 'kcal' },
              { label: 'PROTEIN',  value: client?.goals?.protein,  unit: 'g'    },
              { label: 'CARBS',    value: client?.goals?.carbs,    unit: 'g'    },
              { label: 'FAT',      value: client?.goals?.fat,      unit: 'g'    },
            ].map(({ label, value, unit }) => (
              <div key={label} className="glass-card border border-border rounded-2xl p-3 card-dim">
                <p className="font-display font-black text-2xl text-cream">{value ?? '—'}</p>
                <p className="font-mono text-xs text-muted">{label} / {unit}</p>
              </div>
            ))}
          </div>
        )}
        <p className="font-mono text-xs text-dim mt-3">
          {client?.coachId
            ? 'Your coach can also adjust these — their changes apply to your account too.'
            : 'Not sure where to start? Use the macro calculator on our site, then set them here.'}
        </p>
      </div>

      {/* ── 30-Day Progress ─────────────────────────────────────────────────── */}
      <div className="px-5 mb-3 anim-fade-in-down" style={{ animationDelay: '250ms' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted">30-DAY PROGRESS</p>
        </div>
        <p className="font-display font-black text-2xl tracking-wide text-cream">LAST 30 DAYS</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mx-5 mb-5 anim-fade-in-up" style={{ animationDelay: '300ms' }}>
        {[
          { val: avgCal.toFixed(0),          label: 'avg kcal / day',   color: 'text-cream'            },
          { val: daysLogged,                  label: 'days logged',       color: 'text-cream'            },
          { val: `${avgProtein.toFixed(0)}g`, label: 'avg protein / day', color: 'text-olive-light'     },
          { val: `${avgFat.toFixed(0)}g`,     label: 'avg fat / day',     color: 'text-slategray-light' },
        ].map(({ val, label, color }) => (
          <div key={label} className="glass-card border border-border rounded-2xl p-4 card-dim">
            <p className={`font-display font-black text-3xl ${color} data-flicker`}>{val}</p>
            <p className="font-mono text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Calorie trend */}
      <div className="mx-5 mb-5 glass-card border border-border rounded-2xl p-4 anim-fade-in-up" style={{ animationDelay: '360ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted">CALORIE TREND</p>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={calData}>
            <defs>
              <linearGradient id="calGradP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#9A7B55" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9A7B55" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date"
              tick={{ fontSize: 10, fill: '#7A756E', fontFamily: 'Space Mono' }}
              interval={6} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#7A756E' }} />
            <ReferenceLine y={client?.goals?.calories || 2000}
              stroke="#6B7A52" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Area type="monotone" dataKey="cal"
              stroke="#9A7B55" strokeWidth={2} fill="url(#calGradP)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Protein trend */}
      <div className="mx-5 mb-6 glass-card border border-border rounded-2xl p-4 anim-fade-in-up" style={{ animationDelay: '420ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted">PROTEIN TREND</p>
        </div>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={calData}>
            <defs>
              <linearGradient id="proGradP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6B7A52" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6B7A52" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date"
              tick={{ fontSize: 10, fill: '#7A756E', fontFamily: 'Space Mono' }}
              interval={6} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#7A756E' }}
              formatter={(val) => [`${val.toFixed(0)}g`, 'Protein']} />
            <ReferenceLine y={client?.goals?.protein || 150}
              stroke="#849663" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Area type="monotone" dataKey="protein"
              stroke="#6B7A52" strokeWidth={2} fill="url(#proGradP)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Personal info form */}
      <div className="mx-5 mb-4 glass-card border border-border rounded-2xl p-4 space-y-4 anim-fade-in-up card-hover" style={{ animationDelay: '480ms' }}>
        <div className="flex items-center gap-2">
          <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted">PERSONAL INFO</p>
        </div>

        <div>
          <label className={lbl}>NAME</label>
          <input type="text" value={form.name} onChange={field('name')}
            placeholder="Your name" className={inputCls} />
        </div>

        <div>
          <label className={lbl}>HEIGHT</label>
          <input type="text" value={form.height} onChange={field('height')}
            placeholder="e.g. 5'10&quot; or 178 cm" className={inputCls} />
        </div>

        <div className="overflow-hidden">
          <label className={lbl}>DATE OF BIRTH</label>
          <input type="date" value={form.dob} onChange={field('dob')}
            className={`${inputCls} h-11`}
            style={{ colorScheme: 'dark', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label className={lbl}>PHONE</label>
          <input type="tel" value={form.phone} onChange={field('phone')}
            placeholder="(555) 000-0000" className={inputCls} />
        </div>

        <div>
          <label className={lbl}>NOTES FOR COACH</label>
          <textarea value={form.bio} onChange={field('bio')}
            placeholder="Anything your coach should know..."
            rows={3} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Notifications */}
      <div className="mx-5 mb-4 glass-card border border-border rounded-2xl p-4 anim-fade-in-up card-hover" style={{ animationDelay: '500ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted">NOTIFICATIONS</p>
        </div>
        <button
          onClick={() => setClientReminders(client.id, !(client?.remindersEnabled ?? true))}
          className="w-full flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2.5 text-left">
            <Bell size={14} className="text-muted flex-shrink-0" />
            <span>
              <span className="block font-mono text-sm text-cream">Reminder emails</span>
              <span className="block font-mono text-[10px] text-dim mt-0.5">
                A daily nudge if you haven't logged, and when your weekly check-in is due
              </span>
            </span>
          </span>
          {/* Toggle */}
          <span
            className="relative flex-shrink-0 w-10 h-6 rounded-full transition-colors"
            style={{ background: (client?.remindersEnabled ?? true) ? 'var(--color-accent)' : 'var(--color-dim)' }}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: (client?.remindersEnabled ?? true) ? '20px' : '4px' }}
            />
          </span>
        </button>

        {/* Push notifications */}
        <PushToggle />
      </div>

      {/* Logging preferences */}
      <div className="mx-5 mb-4 glass-card border border-border rounded-2xl p-4 anim-fade-in-up card-hover" style={{ animationDelay: '510ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted">LOGGING</p>
        </div>
        <p className="font-mono text-sm text-cream mb-1">Serving sizes when adding food</p>
        <p className="font-mono text-[10px] text-dim leading-relaxed mb-3">
          REMEMBER LAST opens each food at the amount you last logged it at — if you eat
          the same portions daily, logging becomes one tap. DEFAULT always starts at the
          label serving size.
        </p>
        <div className="flex bg-surface border border-border rounded-xl p-1">
          {[
            { id: 'default', label: 'DEFAULT' },
            { id: 'last',    label: 'REMEMBER LAST' },
          ].map((opt) => {
            const active = (client?.servingPref || 'default') === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setServingPref(client.id, opt.id)}
                className="flex-1 py-2.5 font-display font-bold text-[11px] tracking-[0.12em] rounded-lg transition-all"
                style={active
                  ? { background: 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 72%, white))', color: '#fff' }
                  : { color: 'var(--color-muted)' }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Save button */}
      <div className="mx-5 mb-8 anim-fade-in-up" style={{ animationDelay: '520ms' }}>
        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-widest transition-all glow-hover-olive ${
            saved ? 'bg-olive text-bg' : 'btn-accent text-bg'
          }`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={15} /> SAVED
            </span>
          ) : 'SAVE CHANGES'}
        </button>
      </div>
    </div>

    {/* Crop modal — portaled so it sits above everything */}
    {cropSrc && createPortal(
      <AvatarCropModal
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />,
      document.body
    )}

    {/* Coach marketplace — portaled full-screen overlay */}
    {showMarket && createPortal(
      <CoachMarketplace onClose={() => { setShowMarket(false); fetchMyCoachRequests() }} />,
      document.body
    )}
    </>
  )
}
