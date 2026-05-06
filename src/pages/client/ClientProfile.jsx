import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { Check } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis,
  ResponsiveContainer, Tooltip, ReferenceLine,
} from 'recharts'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'

export default function ClientProfile() {
  const { activeClientId, clients, updateClientProfile } = useStore()
  const client = clients.find((c) => c.id === activeClientId)

  const [form, setForm] = useState({
    name:   client?.name   || '',
    height: client?.height || '',
    dob:    client?.dob    || '',
    phone:  client?.phone  || '',
    bio:    client?.bio    || '',
  })
  const [saved, setSaved] = useState(false)

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
    'w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors'
  const lbl = 'font-display text-xs text-muted tracking-widest block mb-1.5'

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 anim-fade-in-down">
        <h1 className="font-display font-black text-3xl tracking-wider text-cream">
          <ScrambleText text="PROFILE" duration={750} />
        </h1>
        <p className="font-mono text-xs text-muted mt-1">Your info & 30-day progress</p>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-6 anim-pop" style={{ animationDelay: '80ms' }}>
        <div className="w-20 h-20 rounded-full bg-olive/20 border-2 border-olive/30 flex items-center justify-center">
          <span className="font-display font-black text-3xl text-olive-light">
            {(form.name || '?').charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Personal info form */}
      <div className="mx-5 mb-4 bg-card border border-border rounded-xl p-4 space-y-4 anim-fade-in-up" style={{ animationDelay: '130ms' }}>
        <p className="font-display font-bold text-xs text-muted tracking-widest">PERSONAL INFO</p>

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

        <div>
          <label className={lbl}>DATE OF BIRTH</label>
          <div className="overflow-hidden rounded-xl">
            <input type="date" value={form.dob} onChange={field('dob')}
              className={`${inputCls} text-center`}
              style={{ colorScheme: 'dark', display: 'block', width: '100%', maxWidth: '100%' }} />
          </div>
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

      {/* Save button */}
      <div className="mx-5 mb-6 anim-fade-in-up" style={{ animationDelay: '200ms' }}>
        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-widest transition-all glow-hover-olive ${
            saved ? 'bg-olive text-bg' : 'bg-brown hover:bg-brown-light text-bg'
          }`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={15} /> SAVED
            </span>
          ) : 'SAVE CHANGES'}
        </button>
      </div>

      {/* Coach-assigned targets (read-only) */}
      <div className="mx-5 mb-6 bg-card border border-border rounded-xl p-4 anim-fade-in-up" style={{ animationDelay: '260ms' }}>
        <p className="font-display font-bold text-xs text-muted tracking-widest mb-4">
          COACH-ASSIGNED TARGETS
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'CALORIES', value: client?.goals?.calories, unit: 'kcal' },
            { label: 'PROTEIN',  value: client?.goals?.protein,  unit: 'g'    },
            { label: 'CARBS',    value: client?.goals?.carbs,    unit: 'g'    },
            { label: 'FAT',      value: client?.goals?.fat,      unit: 'g'    },
          ].map(({ label, value, unit }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-3">
              <p className="font-display font-black text-xl text-cream">{value ?? '—'}</p>
              <p className="font-mono text-xs text-muted">{label} / {unit}</p>
            </div>
          ))}
        </div>
        <p className="font-mono text-xs text-dim mt-3">
          Contact your coach to update these targets.
        </p>
      </div>

      {/* ── 30-Day Progress ─────────────────────────────────────────────────── */}
      <div className="px-5 mb-3 anim-fade-in-down" style={{ animationDelay: '320ms' }}>
        <p className="font-display font-black text-lg tracking-widest text-cream">30-DAY PROGRESS</p>
        <p className="font-mono text-xs text-muted mt-0.5">Last 30 days</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mx-5 mb-5 anim-fade-in-up" style={{ animationDelay: '360ms' }}>
        {[
          { val: avgCal.toFixed(0),          label: 'avg kcal / day',   color: 'text-cream'            },
          { val: daysLogged,                  label: 'days logged',       color: 'text-cream'            },
          { val: `${avgProtein.toFixed(0)}g`, label: 'avg protein / day', color: 'text-olive-light'     },
          { val: `${avgFat.toFixed(0)}g`,     label: 'avg fat / day',     color: 'text-slategray-light' },
        ].map(({ val, label, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className={`font-display font-black text-2xl ${color} data-flicker`}>{val}</p>
            <p className="font-mono text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Calorie trend */}
      <div className="mx-5 mb-5 bg-card border border-border rounded-xl p-4 anim-fade-in-up" style={{ animationDelay: '420ms' }}>
        <p className="font-display font-bold text-xs text-muted tracking-widest mb-4">CALORIE TREND</p>
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
      <div className="mx-5 mb-4 bg-card border border-border rounded-xl p-4 anim-fade-in-up" style={{ animationDelay: '480ms' }}>
        <p className="font-display font-bold text-xs text-muted tracking-widest mb-4">PROTEIN TREND</p>
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
    </div>
  )
}
