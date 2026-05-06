import { useState } from 'react'
import { Check } from 'lucide-react'
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

  const inputCls =
    'w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors'
  const lbl = 'font-display text-xs text-muted tracking-widest block mb-1.5'

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 anim-fade-in-down">
        <h1 className="font-display font-black text-3xl tracking-wider text-cream">
          <ScrambleText text="PROFILE" duration={750} />
        </h1>
        <p className="font-mono text-xs text-muted mt-1">Your personal information</p>
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
          <input
            type="text"
            value={form.name}
            onChange={field('name')}
            placeholder="Your name"
            className={inputCls}
          />
        </div>

        <div>
          <label className={lbl}>HEIGHT</label>
          <input
            type="text"
            value={form.height}
            onChange={field('height')}
            placeholder="e.g. 5'10&quot; or 178 cm"
            className={inputCls}
          />
        </div>

        <div>
          <label className={lbl}>DATE OF BIRTH</label>
          <input
            type="date"
            value={form.dob}
            onChange={field('dob')}
            className={inputCls}
          />
        </div>

        <div>
          <label className={lbl}>PHONE</label>
          <input
            type="tel"
            value={form.phone}
            onChange={field('phone')}
            placeholder="(555) 000-0000"
            className={inputCls}
          />
        </div>

        <div>
          <label className={lbl}>NOTES FOR COACH</label>
          <textarea
            value={form.bio}
            onChange={field('bio')}
            placeholder="Anything your coach should know..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      {/* Coach-assigned targets (read-only) */}
      <div className="mx-5 mb-5 bg-card border border-border rounded-xl p-4 anim-fade-in-up" style={{ animationDelay: '220ms' }}>
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

      {/* Save button */}
      <div className="mx-5 anim-fade-in-up" style={{ animationDelay: '300ms' }}>
        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-widest transition-all glow-hover-olive ${
            saved
              ? 'bg-olive text-bg'
              : 'bg-brown hover:bg-brown-light text-bg'
          }`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={15} /> SAVED
            </span>
          ) : (
            'SAVE CHANGES'
          )}
        </button>
      </div>
    </div>
  )
}
