import { useState, useEffect, useRef } from 'react'
import { User, Globe, Award, BookOpen, Check, Copy, Download, Link2, Pencil, QrCode, X } from 'lucide-react'
import useStore from '../../store'
import useIsSuperadmin from '../../hooks/useIsSuperadmin'
import ScrambleText from '../../components/ScrambleText'
import ConnectionQR from '../../components/ConnectionQR'
import { coachJoinURL } from '../../lib/connectionQr'

const inputCls = 'w-full bg-surface border border-border rounded-lg px-4 py-2.5 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 transition-colors resize-none'
const lbl      = 'font-display text-xs text-muted tracking-widest block mb-1.5'

const ACCENT  = 'var(--color-accent)'
const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

export default function CoachProfile() {
  const { currentUser, updateCoachProfile } = useStore()
  const isSuperadmin = useIsSuperadmin()

  const [editing, setEditing]   = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')
  const [copied,  setCopied]    = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareError, setShareError] = useState('')
  const qrRef = useRef(null)
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
    if (saving) return
    setSaving(true)
    setSaveError('')
    try {
      const result = await updateCoachProfile(form)
      if (!result?.ok) throw new Error(result?.error || 'Could not save your profile. Please retry.')
      setEditing(false)
    } catch (error) {
      setSaveError(error.message || 'Could not save your profile. Please retry.')
    } finally {
      setSaving(false)
    }
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

  const joinURL = coachJoinURL(window.location.origin, currentUser?.coachCode)
  const copyJoinURL = async () => {
    if (!joinURL) return
    try {
      await navigator.clipboard.writeText(joinURL)
      setLinkCopied(true)
      setShareError('')
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      setShareError('Could not copy the link. Try again or share the coach code above.')
    }
  }
  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const objectURL = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectURL
    link.download = `macrostack-coach-${currentUser.coachCode.toLowerCase()}.svg`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(objectURL), 1000)
  }

  const initial = (currentUser?.name || 'C').charAt(0).toUpperCase()

  const roleLabel = isSuperadmin ? 'SUPER ADMIN' : 'NUTRITION COACH'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header, locked */}
      <div className="app-page-gutter relative px-4 md:px-8 pt-mobile-header md:pt-6 pb-5 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-px flex-shrink-0" style={{ background: accentA(50) }} />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">COACH PORTAL</p>
            </div>
            <h2 className="font-display font-black text-4xl tracking-wide text-cream leading-none">
              <ScrambleText text="PROFILE" duration={850} />
            </h2>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-surface border border-border text-muted hover:text-cream hover:border-brown font-display font-bold text-sm tracking-widest px-5 py-2.5 rounded-xl transition-colors flex-shrink-0"
            >
              <Pencil size={14} />
              EDIT
            </button>
          ) : (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 btn-accent disabled:opacity-50 font-display font-bold text-sm tracking-widest px-5 py-2.5 rounded-xl transition-colors glow-hover"
              >
                <Check size={14} />
                {saving ? 'SAVING…' : 'SAVE'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 bg-surface border border-border text-muted hover:text-cream font-display font-bold text-sm tracking-widest px-4 py-2.5 rounded-xl transition-colors"
              >
                <X size={14} />
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>

      {saveError && <p role="alert" className="px-4 md:px-8 py-3 text-sm text-red-400">{saveError}</p>}

      {/* Scrollable content, main column + sticky rail (code + live preview) */}
      <div className="flex-1 overflow-y-auto">
        <div className="app-page-gutter px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto anim-fade-in grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
          <div className="space-y-5 min-w-0">

          {/* Identity hero */}
          <div
            className="coach-card relative overflow-hidden rounded-3xl border p-6 md:p-7"
            style={{ borderColor: accentA(22), background: `linear-gradient(150deg, ${accentA(12)}, transparent 72%)` }}
          >
            <div
              className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
              style={{ background: `radial-gradient(circle, ${accentA(14)}, transparent 70%)` }}
            />
            <div className="relative flex items-center gap-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accentA(32)}, ${accentA(10)})`,
                  border: `1px solid ${accentA(38)}`,
                  boxShadow: `0 0 26px ${accentA(18)}`,
                }}
              >
                <span className="font-display font-black text-3xl" style={{ color: ACCENT }}>{initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div>
                    <label className={lbl}>DISPLAY NAME</label>
                    <input type="text" value={form.name} onChange={f('name')} className={inputCls} placeholder="Your name" />
                  </div>
                ) : (
                  <>
                    <p className="font-display font-black text-3xl text-cream leading-tight truncate">{currentUser?.name || '-'}</p>
                    <p className="font-mono text-sm text-muted mt-2 truncate">{currentUser?.email || ''}</p>
                    <span
                      className="inline-block mt-3 font-mono text-[10px] tracking-[0.2em] px-2.5 py-1 rounded-full"
                      style={{ color: ACCENT, background: accentA(12), border: `1px solid ${accentA(30)}` }}
                    >
                      {roleLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Detail fields, consistent premium cards */}
          <div className="glass-card border border-border rounded-2xl p-5 card-dim">
            <label className="flex items-center gap-2 font-display text-xs text-muted tracking-widest mb-3">
              <BookOpen size={12} style={{ color: ACCENT }} /> BIO
            </label>
            {editing ? (
              <textarea rows={4} value={form.bio} onChange={f('bio')}
                placeholder="Tell users about yourself, your approach, philosophy, and background…"
                className={`${inputCls} resize-y`} />
            ) : (
              <p className="font-mono text-sm text-cream leading-relaxed">
                {currentUser?.bio || <span className="text-dim italic">No bio added yet</span>}
              </p>
            )}
          </div>

          <div className="glass-card border border-border rounded-2xl p-5 card-dim">
            <label className="flex items-center gap-2 font-display text-xs text-muted tracking-widest mb-3">
              <Award size={12} style={{ color: ACCENT }} /> SPECIALTIES
            </label>
            {editing ? (
              <input type="text" value={form.specialties} onChange={f('specialties')}
                placeholder="e.g. Sports nutrition, weight loss, muscle gain, plant-based…"
                className={inputCls} />
            ) : (
              currentUser?.specialties ? (
                <div className="flex flex-wrap gap-2">
                  {currentUser.specialties.split(',').map((s) => s.trim()).filter(Boolean).map((s, i) => (
                    <span key={i} className="font-mono text-xs px-2.5 py-1 rounded-lg"
                      style={{ color: ACCENT, background: accentA(10), border: `1px solid ${accentA(24)}` }}>
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-sm text-dim italic">No specialties added yet</p>
              )
            )}
          </div>

          <div className="glass-card border border-border rounded-2xl p-5 card-dim">
            <label className="flex items-center gap-2 font-display text-xs text-muted tracking-widest mb-3">
              <User size={12} style={{ color: ACCENT }} /> CREDENTIALS &amp; CERTIFICATIONS
            </label>
            {editing ? (
              <input type="text" value={form.credentials} onChange={f('credentials')}
                placeholder="e.g. RD, CSSD, NASM-CPT, Precision Nutrition Level 2…"
                className={inputCls} />
            ) : (
              <p className="font-mono text-sm text-cream">
                {currentUser?.credentials || <span className="text-dim italic">No credentials added yet</span>}
              </p>
            )}
          </div>

          <div className="glass-card border border-border rounded-2xl p-5 card-dim">
            <label className="flex items-center gap-2 font-display text-xs text-muted tracking-widest mb-3">
              <Globe size={12} style={{ color: ACCENT }} /> WEBSITE
            </label>
            {editing ? (
              <input type="url" value={form.website} onChange={f('website')}
                placeholder="https://getmacrostack.app" className={inputCls} />
            ) : (
              currentUser?.website ? (
                <a href={currentUser.website} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-sm underline underline-offset-2" style={{ color: ACCENT }}>
                  {currentUser.website}
                </a>
              ) : (
                <p className="font-mono text-sm text-dim italic">No website added yet</p>
              )
            )}
          </div>

          </div>

          {/* Right rail, coach code + live preview, always in view on lg+ */}
          <div className="space-y-5 lg:sticky lg:top-6">

          {/* Coach code, premium accent card */}
          <div
            className="coach-card rounded-2xl border p-5"
            style={{ borderColor: accentA(28), background: `linear-gradient(160deg, ${accentA(12)}, ${accentA(3)})` }}
          >
            <p className="font-mono text-[10px] tracking-[0.3em] mb-2" style={{ color: accentA(75) }}>COACH CODE</p>
            <div className="flex items-center gap-3">
              <span className="font-display font-black text-2xl tracking-[0.28em] flex-1 min-w-0 truncate" style={{ color: ACCENT }}>
                {currentUser?.coachCode || '-'}
              </span>
              {currentUser?.coachCode && (
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 flex-shrink-0 font-display font-bold text-xs tracking-widest px-3.5 py-2 rounded-xl transition-colors"
                  style={{ color: ACCENT, background: accentA(10), border: `1px solid ${accentA(30)}` }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              )}
            </div>
            <p className="font-mono text-xs text-muted mt-3">
              Share this code with users so they can link to you after signing up.
            </p>
            {joinURL && <div className="mt-5 pt-5 border-t border-border/70">
              <div className="flex items-center gap-2 mb-3"><QrCode size={15} style={{ color: ACCENT }} /><p className="font-mono text-[10px] tracking-[0.22em] text-muted">YOUR CONNECTION QR</p></div>
              <div ref={qrRef} className="w-fit mx-auto rounded-2xl bg-white p-3 shadow-[0_12px_35px_rgba(0,0,0,0.22)]">
                <ConnectionQR url={joinURL} label={`Scan to link with ${currentUser?.name || 'this coach'}`} size={190} className="block max-w-full h-auto" />
              </div>
              <p className="font-mono text-xs text-muted text-center leading-relaxed mt-3">Users scan this in Profile, review your name, and confirm the connection.</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button type="button" onClick={copyJoinURL} className="min-h-11 rounded-xl border border-border bg-surface text-cream hover:border-brown flex items-center justify-center gap-2 font-display font-bold text-xs tracking-wide">
                  {linkCopied ? <Check size={14} /> : <Link2 size={14} />}{linkCopied ? 'LINK COPIED' : 'COPY LINK'}
                </button>
                <button type="button" onClick={downloadQR} className="min-h-11 rounded-xl border border-border bg-surface text-cream hover:border-brown flex items-center justify-center gap-2 font-display font-bold text-xs tracking-wide"><Download size={14} /> DOWNLOAD QR</button>
              </div>
              {shareError && <p role="alert" className="mt-2 text-xs text-red-400">{shareError}</p>}
            </div>}
          </div>

          {/* Profile preview */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-px flex-shrink-0" style={{ background: accentA(50) }} />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">PROFILE PREVIEW</p>
            </div>
            <p className="font-mono text-xs text-dim mb-3">
              What users see when they view your coach profile in the app.
            </p>
            <div className="glass-card border rounded-2xl p-5 space-y-3" style={{ borderColor: accentA(22) }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${accentA(28)}, ${accentA(10)})`, border: `1px solid ${accentA(32)}` }}>
                  <span className="font-display font-black text-xl" style={{ color: ACCENT }}>{initial}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-base text-cream truncate">{form.name || currentUser?.name}</p>
                  <p className="font-mono text-xs text-muted truncate">
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
                  {(form.specialties || currentUser?.specialties || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4).map((s, i) => (
                    <span key={i} className="font-mono text-[10px] px-2 py-0.5 rounded"
                      style={{ color: ACCENT, background: accentA(10), border: `1px solid ${accentA(22)}` }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          </div>
        </div>
      </div>
    </div>
  )
}
