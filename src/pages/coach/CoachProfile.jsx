import { useState, useEffect } from 'react'
import { User, Globe, Award, BookOpen, Check, Copy, Pencil, X } from 'lucide-react'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'

const inputCls = 'w-full bg-surface border border-border rounded-lg px-4 py-2.5 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 transition-colors resize-none'
const lbl      = 'font-display text-xs text-muted tracking-widest block mb-1.5'

export default function CoachProfile() {
  const { currentUser, updateCoachProfile } = useStore()

  const [editing, setEditing]   = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [copied,  setCopied]    = useState(false)
  const [form,    setForm]      = useState({
    name:        currentUser?.name        || '',
    bio:         currentUser?.bio         || '',
    specialties: currentUser?.specialties || '',
    credentials: currentUser?.credentials || '',
    website:     currentUser?.website     || '',
  })

  // Keep form in sync if currentUser changes (e.g. after initial load)
  useEffect(() => {
    if (!editing) {
      setForm({
        name:        currentUser?.name        || '',
        bio:         currentUser?.bio         || '',
        specialties: currentUser?.specialties || '',
        credentials: currentUser?.credentials || '',
        website:     currentUser?.website     || '',
      })
    }
  }, [currentUser, editing])

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    await updateCoachProfile(form)
    setSaving(false)
    setEditing(false)
  }

  const handleCancel = () => {
    setForm({
      name:        currentUser?.name        || '',
      bio:         currentUser?.bio         || '',
      specialties: currentUser?.specialties || '',
      credentials: currentUser?.credentials || '',
      website:     currentUser?.website     || '',
    })
    setEditing(false)
  }

  const copyCode = () => {
    if (!currentUser?.coachCode) return
    navigator.clipboard.writeText(currentUser.coachCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const initial = (currentUser?.name || 'C').charAt(0).toUpperCase()

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="relative px-4 md:px-8 pt-mobile-header md:pt-6 pb-6 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-4xl tracking-[0.15em] text-cream">
              <ScrambleText text="PROFILE" duration={850} />
            </h2>
            <p className="font-mono text-sm text-muted mt-1">
              Your public coaching profile — visible to users
            </p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-surface border border-border text-muted hover:text-cream hover:border-brown font-display font-bold text-sm tracking-widest px-5 py-2.5 rounded-lg transition-colors"
            >
              <Pencil size={14} />
              EDIT
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 btn-accent disabled:opacity-50 text-bg font-display font-bold text-sm tracking-widest px-5 py-2.5 rounded-lg transition-colors glow-hover"
              >
                <Check size={14} />
                {saving ? 'SAVING…' : 'SAVE'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-surface border border-border text-muted hover:text-cream font-display font-bold text-sm tracking-widest px-4 py-2.5 rounded-lg transition-colors"
              >
                <X size={14} />
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 py-8 max-w-2xl space-y-8 anim-fade-in">

        {/* Avatar + name */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
            <span className="font-display font-black text-3xl text-brown-light">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div>
                <label className={lbl}>DISPLAY NAME</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={f('name')}
                  className={inputCls}
                  placeholder="Your name"
                />
              </div>
            ) : (
              <>
                <p className="font-display font-black text-3xl text-cream">{currentUser?.name || '—'}</p>
                <p className="font-mono text-sm text-muted mt-0.5">{currentUser?.email || ''}</p>
                <p className="font-mono text-xs text-dim mt-0.5">
                  {currentUser?.role === 'superadmin' ? 'SUPER ADMIN' : 'NUTRITION COACH'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Coach code */}
        <div className="glass-card border border-border/60 rounded-xl p-5 card-hover">
          <p className={lbl}>COACH CODE</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-xl font-bold text-brown-light tracking-widest flex-1">
              {currentUser?.coachCode || '—'}
            </span>
            {currentUser?.coachCode && (
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 bg-surface border border-border text-muted hover:text-cream hover:border-brown font-display font-bold text-xs tracking-widest px-3 py-2 rounded-lg transition-colors"
              >
                {copied ? <Check size={12} className="text-olive-light" /> : <Copy size={12} />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            )}
          </div>
          <p className="font-mono text-xs text-dim mt-2">
            Share this code with users so they can link to you after signing up.
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="flex items-center gap-2 font-display text-xs text-muted tracking-widest mb-1.5">
            <BookOpen size={12} />
            BIO
          </label>
          {editing ? (
            <textarea
              rows={4}
              value={form.bio}
              onChange={f('bio')}
              placeholder="Tell users about yourself — your approach, philosophy, and background…"
              className={`${inputCls} resize-y`}
            />
          ) : (
            <p className="font-mono text-sm text-cream leading-relaxed">
              {currentUser?.bio || <span className="text-dim italic">No bio added yet</span>}
            </p>
          )}
        </div>

        {/* Specialties */}
        <div>
          <label className="flex items-center gap-2 font-display text-xs text-muted tracking-widest mb-1.5">
            <Award size={12} />
            SPECIALTIES
          </label>
          {editing ? (
            <input
              type="text"
              value={form.specialties}
              onChange={f('specialties')}
              placeholder="e.g. Sports nutrition, weight loss, muscle gain, plant-based…"
              className={inputCls}
            />
          ) : (
            currentUser?.specialties ? (
              <div className="flex flex-wrap gap-2">
                {currentUser.specialties.split(',').map((s) => s.trim()).filter(Boolean).map((s, i) => (
                  <span key={i} className="font-mono text-xs text-brown-light bg-brown/10 border border-brown/20 px-2.5 py-1 rounded-lg">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-mono text-sm text-dim italic">No specialties added yet</p>
            )
          )}
        </div>

        {/* Credentials */}
        <div>
          <label className="flex items-center gap-2 font-display text-xs text-muted tracking-widest mb-1.5">
            <User size={12} />
            CREDENTIALS & CERTIFICATIONS
          </label>
          {editing ? (
            <input
              type="text"
              value={form.credentials}
              onChange={f('credentials')}
              placeholder="e.g. RD, CSSD, NASM-CPT, Precision Nutrition Level 2…"
              className={inputCls}
            />
          ) : (
            <p className="font-mono text-sm text-cream">
              {currentUser?.credentials || <span className="text-dim italic">No credentials added yet</span>}
            </p>
          )}
        </div>

        {/* Website */}
        <div>
          <label className="flex items-center gap-2 font-display text-xs text-muted tracking-widest mb-1.5">
            <Globe size={12} />
            WEBSITE
          </label>
          {editing ? (
            <input
              type="url"
              value={form.website}
              onChange={f('website')}
              placeholder="https://yourwebsite.com"
              className={inputCls}
            />
          ) : (
            currentUser?.website ? (
              <a
                href={currentUser.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-brown-light hover:text-brown underline underline-offset-2"
              >
                {currentUser.website}
              </a>
            ) : (
              <p className="font-mono text-sm text-dim italic">No website added yet</p>
            )
          )}
        </div>

        {/* Stats */}
        <div className="border-t border-border pt-6">
          <p className={lbl}>PROFILE PREVIEW</p>
          <p className="font-mono text-xs text-dim">
            This is what users see when they view your coach profile from the app.
          </p>
          <div className="mt-3 glass-card border border-border/60 rounded-xl p-5 space-y-3 card-hover">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
                <span className="font-display font-black text-xl text-brown-light">{initial}</span>
              </div>
              <div>
                <p className="font-display font-bold text-base text-cream">{form.name || currentUser?.name}</p>
                <p className="font-mono text-xs text-dim">
                  {form.credentials || currentUser?.credentials || 'Nutrition Coach'}
                </p>
              </div>
            </div>
            {(form.bio || currentUser?.bio) && (
              <p className="font-mono text-xs text-muted leading-relaxed line-clamp-3">
                {form.bio || currentUser?.bio}
              </p>
            )}
            {(form.specialties || currentUser?.specialties) && (
              <div className="flex flex-wrap gap-1.5">
                {(form.specialties || currentUser?.specialties).split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4).map((s, i) => (
                  <span key={i} className="font-mono text-[10px] text-brown-light bg-brown/10 border border-brown/20 px-2 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
