import { useState } from 'react'
import {
  Radar, Search, ExternalLink, Shield, Loader2, RefreshCw,
  Users, Dumbbell, Lightbulb, MessageSquareQuote,
} from 'lucide-react'
import useIsSuperadmin from '../../hooks/useIsSuperadmin'
import ScrambleText from '../../components/ScrambleText'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

/* ── One scanner panel — fires /api/leads and renders lead cards ────────────── */
function LeadPanel({ kind, icon: Icon, eyebrow, title, blurb }) {
  const [leads, setLeads]     = useState(null)   // null = never scanned
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [scannedAt, setScannedAt] = useState(null)

  const scan = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`)
      setLeads(data.leads || [])
      setScannedAt(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card border border-border rounded-2xl card-dim overflow-hidden flex flex-col min-h-[420px]">
      {/* Panel header */}
      <div className="px-5 md:px-6 pt-5 pb-4 border-b border-border/60">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={13} style={{ color: 'var(--color-accent)' }} />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">{eyebrow}</p>
            </div>
            <h3 className="font-display font-black text-xl md:text-2xl tracking-wide text-cream leading-none">
              {title}
            </h3>
            <p className="font-mono text-xs text-muted mt-2 leading-relaxed">{blurb}</p>
          </div>
          <button
            onClick={scan}
            disabled={loading}
            className="flex items-center gap-2 flex-shrink-0 btn-accent disabled:opacity-50 font-display font-bold text-xs tracking-widest px-4 py-2.5 rounded-xl transition-colors glow-hover press"
            style={{ color: '#fff' }}
          >
            {loading
              ? <Loader2 size={13} className="animate-spin" />
              : leads === null ? <Search size={13} /> : <RefreshCw size={13} />}
            {loading ? 'SCANNING…' : leads === null ? 'FIND LEADS' : 'RESCAN'}
          </button>
        </div>
        {scannedAt && !loading && (
          <p className="font-mono text-[10px] text-dim mt-3">
            Last scan {scannedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            {leads ? ` · ${leads.length} lead${leads.length === 1 ? '' : 's'}` : ''}
          </p>
        )}
      </div>

      {/* Panel body */}
      <div className="flex-1 p-4 md:p-5 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center anim-fade-in">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 anim-pop"
              style={{ background: accentA(10), border: `1px solid ${accentA(25)}` }}
            >
              <Radar size={22} className="animate-pulse" style={{ color: 'var(--color-accent)' }} />
            </div>
            <p className="font-display font-bold text-sm text-muted tracking-widest">SEARCHING THE WEB</p>
            <p className="font-mono text-xs text-dim mt-2 max-w-[260px] leading-relaxed">
              Claude is running live searches across Reddit, X, and forums — this can take a minute or two.
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-14 text-center anim-fade-in px-4">
            <p className="font-display font-bold text-sm text-red-400 tracking-widest">SCAN FAILED</p>
            <p className="font-mono text-xs text-dim mt-2 max-w-sm break-words leading-relaxed">{error}</p>
            <button
              onClick={scan}
              className="mt-5 px-4 py-2 rounded-lg border border-border text-cream font-display font-bold text-xs tracking-widest hover:border-muted transition-colors"
            >
              RETRY
            </button>
          </div>
        ) : leads === null ? (
          <div className="flex flex-col items-center justify-center py-16 text-center anim-fade-in px-4">
            <Radar size={26} className="text-dim mb-3" />
            <p className="font-mono text-xs text-dim max-w-[280px] leading-relaxed">
              Hit FIND LEADS and Claude will surface live posts from people who fit this profile, with direct links.
            </p>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center anim-fade-in px-4">
            <p className="font-display font-bold text-sm text-muted tracking-widest">NO LEADS THIS PASS</p>
            <p className="font-mono text-xs text-dim mt-2">Try rescanning — every pass runs fresh searches.</p>
          </div>
        ) : (
          leads.map((lead, i) => (
            <div
              key={`${lead.url}-${i}`}
              className="anim-fade-in-up rounded-xl border border-border bg-surface/40 p-4"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              {/* Source + date */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-mono text-[9px] tracking-widest px-2 py-0.5 rounded-full"
                  style={{ color: 'var(--color-accent)', background: accentA(10), border: `1px solid ${accentA(24)}` }}
                >
                  {lead.source || 'WEB'}
                </span>
                {lead.date && <span className="font-mono text-[10px] text-dim">{lead.date}</span>}
              </div>

              {/* Title → direct link */}
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-1.5 mt-2.5"
              >
                <p className="font-display font-bold text-sm text-cream leading-snug group-hover:underline underline-offset-2">
                  {lead.title}
                </p>
                <ExternalLink size={12} className="text-dim group-hover:text-cream flex-shrink-0 mt-0.5 transition-colors" />
              </a>

              {/* Quote */}
              {lead.snippet && (
                <p className="font-mono text-xs text-muted mt-2 leading-relaxed border-l-2 pl-3" style={{ borderColor: accentA(35) }}>
                  “{lead.snippet}”
                </p>
              )}

              {/* Why + angle */}
              <div className="mt-3 space-y-1.5">
                {lead.why && (
                  <p className="flex items-start gap-2 font-mono text-[11px] text-muted leading-relaxed">
                    <Lightbulb size={11} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                    {lead.why}
                  </p>
                )}
                {lead.angle && (
                  <p className="flex items-start gap-2 font-mono text-[11px] text-dim leading-relaxed">
                    <MessageSquareQuote size={11} className="flex-shrink-0 mt-0.5 text-muted" />
                    {lead.angle}
                  </p>
                )}
              </div>

              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 font-display font-bold text-[10px] tracking-widest text-muted hover:text-cream border border-border hover:border-muted rounded-lg px-3 py-1.5 transition-colors"
              >
                <ExternalLink size={11} />
                OPEN POST
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ── LEAD FINDER — superadmin-only prospecting via Claude + live web search ── */
export default function LeadFinder() {
  const isSuperadmin = useIsSuperadmin()

  if (!isSuperadmin) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center text-center px-6 anim-fade-in">
        <Shield size={36} className="text-dim mb-4" />
        <p className="font-display font-bold text-xl text-muted tracking-widest">SUPERADMIN ONLY</p>
        <p className="font-mono text-xs text-dim mt-2">This panel is restricted.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="relative px-5 md:px-8 pt-mobile-header md:pt-7 pb-5 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-5 h-px flex-shrink-0" style={{ background: accentA(50) }} />
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted">SUPERADMIN</p>
        </div>
        <h2 className="font-display font-black text-4xl tracking-wide text-cream leading-none">
          <ScrambleText text="LEAD FINDER" duration={800} />
        </h2>
        <p className="font-mono text-xs md:text-sm text-muted mt-2">
          Claude scans the live web for people who need MacroStack — direct links to their posts, ready to reply to.
        </p>
      </div>

      {/* Two scanners side by side */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 md:p-6 xl:p-8 max-w-[1500px] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <LeadPanel
            kind="users"
            icon={Users}
            eyebrow="MACROSTACK PRO PROSPECTS"
            title="TRACKERS & MFP SWITCHERS"
            blurb="People asking for MyFitnessPal alternatives, macro-tracking app recommendations, or nutrition coaching and accountability help."
          />
          <LeadPanel
            kind="coaches"
            icon={Dumbbell}
            eyebrow="MACROSTACK COACH PROSPECTS"
            title="COACHES & TRAINERS"
            blurb="Nutrition coaches and personal trainers looking for client check-in software, coaching platforms, or better ways to manage clients."
          />
        </div>
      </div>
    </div>
  )
}
