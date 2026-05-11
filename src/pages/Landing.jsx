import { createContext, useContext, useEffect, useRef, useState } from 'react'

/* ── inline logo mark (transparent-bg MS diamond) ── */
function LogoMark({ size = 32 }) {
  return (
    <img
      src="/logo.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}

/* ═══════════════════════════════════════════════════════
   SCROLL ROOT CONTEXT
   Passes the landing page's scroll container to every
   IntersectionObserver so reveals fire against the
   container viewport (not the locked html/body).
═══════════════════════════════════════════════════════ */
const ScrollRoot = createContext(null)

/* ── scroll-reveal hook ──────────────────────────────── */
function useReveal(threshold = 0.12) {
  const root = useContext(ScrollRoot)
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold, root: root?.current ?? null, rootMargin: '0px 0px -48px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, root])
  return [ref, visible]
}

/* ── generic reveal wrapper ──────────────────────────── */
function Reveal({ children, className = '', delay = 0, y = 22, x = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translate(${x}px,${y}px)`,
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ── count-up number ─────────────────────────────────── */
function CountUp({ to, suffix = '', prefix = '', dur = 1800 }) {
  const [val, setVal] = useState(0)
  const [ref, visible] = useReveal(0.3)
  useEffect(() => {
    if (!visible) return
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1)
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible, to, dur])
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
}

/* ── animated macro progress bar ─────────────────────── */
function MacroBar({ label, value, max, colorClass, bgClass, delay = 0 }) {
  const [ref, visible] = useReveal(0.05)
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="font-display text-xs tracking-widest text-muted">{label}</span>
        <span className="font-mono text-xs text-cream">
          {value}<span className="text-muted">/{max}g</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-dim overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{
            width: visible ? `${pct}%` : '0%',
            transition: `width 1.3s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
          }}
        />
      </div>
    </div>
  )
}

/* ── hero right-side mock dashboard ─────────────────── */
function HeroDashboard() {
  const [ref, visible] = useReveal(0.05)
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(32px)',
        transition: 'opacity 0.8s ease 200ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) 200ms',
      }}
      className="relative"
    >
      {/* Glow behind card */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: '0 0 80px -16px rgba(154,123,85,0.22)', borderRadius: '16px' }} />

      {/* Main card */}
      <div className="relative bg-card border border-border rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 32px 64px -16px rgba(0,0,0,0.7)' }}>

        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-surface">
          <div className="w-2.5 h-2.5 rounded-full bg-dim" />
          <div className="w-2.5 h-2.5 rounded-full bg-dim" />
          <div className="w-2.5 h-2.5 rounded-full bg-dim" />
          <span className="font-mono text-xs text-dim ml-3 tracking-widest">MACROSTACK — COACH PORTAL</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-muted tracking-widest">TODAY'S MACROS</p>
              <p className="font-display font-black text-2xl text-cream mt-0.5">
                1,840 <span className="text-muted text-sm font-normal">/ 2,200 kcal</span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
              <span className="font-display font-black text-sm text-brown-light">B</span>
            </div>
          </div>

          {/* Macro bars */}
          <div className="space-y-3">
            <MacroBar label="PROTEIN" value={145} max={160} colorClass="bg-olive" delay={400} />
            <MacroBar label="CARBS"   value={220} max={250} colorClass="bg-brown"  delay={560} />
            <MacroBar label="FAT"     value={52}  max={65}  colorClass="bg-slategray" delay={720} />
          </div>

          {/* Meal list */}
          <div className="space-y-0 border-t border-border pt-4">
            {[
              { meal: 'BREAKFAST', items: 'Oats, Eggs, Banana',  cal: 540 },
              { meal: 'LUNCH',     items: 'Chicken Rice Bowl',   cal: 720 },
              { meal: 'DINNER',    items: 'Salmon, Broccoli…',   cal: 580 },
            ].map(({ meal, items, cal }, i) => (
              <div key={meal}
                className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'none' : 'translateX(-8px)',
                  transition: `opacity 0.5s ease ${600 + i * 100}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${600 + i * 100}ms`,
                }}
              >
                <div>
                  <p className="font-display font-bold text-xs tracking-widest text-muted">{meal}</p>
                  <p className="font-mono text-xs text-cream">{items}</p>
                </div>
                <span className="font-mono text-xs text-muted">{cal} kcal</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge — AI */}
      <div
        className="absolute -right-5 top-10 bg-surface border border-border rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl"
        style={{ animation: 'float 3.2s ease-in-out infinite' }}
      >
        <div className="w-5 h-5 rounded bg-brown/20 flex items-center justify-center">
          <span className="text-brown-light text-xs">✦</span>
        </div>
        <span className="font-mono text-xs text-cream whitespace-nowrap">AI FOOD SEARCH</span>
      </div>

      {/* Floating badge — Coach */}
      <div
        className="absolute -left-5 bottom-16 bg-surface border border-border rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl"
        style={{ animation: 'float 3.2s ease-in-out infinite 1.6s' }}
      >
        <div className="w-5 h-5 rounded bg-olive/20 flex items-center justify-center">
          <span className="text-olive-light text-xs">↗</span>
        </div>
        <div>
          <p className="font-mono text-xs text-cream">COACH BRANDEN</p>
          <p className="font-mono text-xs text-muted">12 active clients</p>
        </div>
      </div>
    </div>
  )
}

/* ── mock coach client list card ─────────────────────── */
function CoachMockup() {
  const [ref, visible] = useReveal(0.1)
  const clients = [
    { name: 'Grayson H.', pct: 94, label: 'ON TRACK',        c: 'olive'     },
    { name: 'Alex M.',    pct: 78, label: 'NEEDS CHECK-IN',  c: 'brown'     },
    { name: 'Jordan K.',  pct: 105,label: 'OVER TARGET',     c: 'slategray' },
    { name: 'Sam R.',     pct: 88, label: 'ON TRACK',        c: 'olive'     },
    { name: 'Casey L.',   pct: 62, label: 'NEEDS ATTENTION', c: 'brown'     },
  ]
  // Static color maps (Tailwind requires static class names)
  const iconBg  = { olive: 'bg-olive/20',      brown: 'bg-brown/20',     slategray: 'bg-slategray/20'     }
  const iconBdr = { olive: 'border-olive/30',  brown: 'border-brown/30', slategray: 'border-slategray/30' }
  const iconTxt = { olive: 'text-olive-light', brown: 'text-brown-light',slategray: 'text-slategray-light'}
  const barBg   = { olive: 'bg-olive',         brown: 'bg-brown',        slategray: 'bg-slategray'        }

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateX(28px)',
        transition: 'opacity 0.7s ease 200ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) 200ms',
        boxShadow: '0 24px 56px -12px rgba(0,0,0,0.6), 0 0 40px -12px rgba(154,123,85,0.12)',
      }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-muted tracking-widest">COACH PORTAL</p>
          <p className="font-display font-black text-lg tracking-wide">MY CLIENTS</p>
        </div>
        <div className="bg-brown/10 border border-brown/20 rounded-lg px-3 py-1">
          <span className="font-mono text-xs text-brown-light">12 ACTIVE</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {['ALL', 'ON TRACK', 'NEEDS ATTENTION'].map((tab, i) => (
          <div key={tab} className={`flex-1 text-center py-2.5 font-display text-xs tracking-widest ${i === 0 ? 'text-brown-light border-b-2 border-brown' : 'text-muted'}`}>
            {tab}
          </div>
        ))}
      </div>

      {/* Client rows */}
      <div className="divide-y divide-border">
        {clients.map(({ name, pct, label, c }, i) => (
          <div
            key={name}
            className="px-5 py-3.5 flex items-center gap-3"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateX(-8px)',
              transition: `opacity 0.5s ease ${300 + i * 80}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${300 + i * 80}ms`,
            }}
          >
            <div className={`w-9 h-9 rounded-xl ${iconBg[c]} border ${iconBdr[c]} flex items-center justify-center flex-shrink-0`}>
              <span className={`font-display font-black text-sm ${iconTxt[c]}`}>{name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm text-cream">{name}</p>
              <div className="h-1 bg-dim rounded-full mt-1.5 overflow-hidden w-full">
                <div
                  className={`h-full rounded-full ${barBg[c]}`}
                  style={{
                    width: visible ? `${Math.min(pct, 100)}%` : '0%',
                    transition: `width 1.1s cubic-bezier(0.16,1,0.3,1) ${450 + i * 80}ms`,
                  }}
                />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-mono text-xs text-cream">{pct}%</p>
              <p className={`font-mono text-xs ${iconTxt[c]}`}>{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── mock mobile client app ──────────────────────────── */
function ClientMockup() {
  const [ref, visible] = useReveal(0.1)
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateX(-28px)',
        transition: 'opacity 0.7s ease 200ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) 200ms',
        maxWidth: '260px',
      }}
      className="relative mx-auto"
    >
      <div
        className="bg-card border border-border rounded-3xl overflow-hidden"
        style={{
          maxWidth: '260px',
          margin: '0 auto',
          boxShadow: '0 32px 64px -16px rgba(0,0,0,0.65), 0 0 36px -12px rgba(107,122,82,0.15)',
        }}
      >
        {/* Status bar */}
        <div className="bg-surface px-5 pt-4 pb-2 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">9:41</span>
          <div className="flex gap-1">
            <div className="w-1 h-2 bg-muted rounded-sm" />
            <div className="w-1 h-3 bg-muted rounded-sm" />
            <div className="w-1 h-4 bg-cream rounded-sm" />
          </div>
        </div>

        <div className="px-4 pb-6 pt-3 space-y-4">
          {/* Greeting */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(10px)',
              transition: 'opacity 0.5s ease 300ms, transform 0.5s ease 300ms',
            }}
          >
            <p className="font-mono text-xs text-muted tracking-widest">MONDAY · MAY 11</p>
            <p className="font-display font-black text-2xl leading-tight mt-0.5">
              HEY,<br/><span className="text-olive-light">GRAYSON!</span>
            </p>
          </div>

          {/* Calories ring-style summary */}
          <div
            className="bg-surface rounded-xl p-3 border border-border"
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.5s ease 400ms',
            }}
          >
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-mono text-xs text-muted">CALORIES</span>
              <span className="font-display font-black text-lg">1,240 <span className="text-muted text-sm font-normal">/ 2,200</span></span>
            </div>
            <div className="space-y-2.5">
              <MacroBar label="PROTEIN" value={95}  max={160} colorClass="bg-olive"     delay={500} />
              <MacroBar label="CARBS"   value={130} max={250} colorClass="bg-brown"     delay={640} />
              <MacroBar label="FAT"     value={35}  max={65}  colorClass="bg-slategray" delay={780} />
            </div>
          </div>

          {/* Coach card */}
          <div
            className="bg-surface rounded-xl p-3 border border-border flex items-center gap-3"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(8px)',
              transition: 'opacity 0.5s ease 700ms, transform 0.5s ease 700ms',
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
              <span className="font-display font-black text-sm text-brown-light">B</span>
            </div>
            <div className="flex-1">
              <p className="font-mono text-xs text-muted">YOUR COACH</p>
              <p className="font-display font-bold text-sm text-cream">BRANDEN H.</p>
            </div>
            <div className="w-6 h-6 rounded bg-brown/10 flex items-center justify-center">
              <span className="text-brown-light text-xs">→</span>
            </div>
          </div>

          {/* Meal list preview */}
          <div
            className="space-y-1.5"
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.5s ease 820ms',
            }}
          >
            <p className="font-display font-bold text-xs tracking-widest text-muted">TODAY'S MEALS</p>
            {[
              { name: 'BREAKFAST', desc: 'Oats · Eggs', cal: 480 },
              { name: 'LUNCH',     desc: 'Chicken bowl',cal: 760 },
            ].map(({ name, desc, cal }) => (
              <div key={name} className="bg-surface rounded-lg px-3 py-2 flex items-center justify-between border border-border">
                <div>
                  <p className="font-display font-bold text-xs tracking-widest text-cream">{name}</p>
                  <p className="font-mono text-xs text-muted">{desc}</p>
                </div>
                <span className="font-mono text-xs text-muted">{cal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating notification */}
      <div
        className="absolute -right-4 top-20 bg-surface border border-border rounded-xl px-3 py-2 shadow-xl"
        style={{ animation: 'float 3.5s ease-in-out infinite 0.8s' }}
      >
        <p className="font-mono text-xs text-brown-light">✓ LOG SUBMITTED</p>
        <p className="font-mono text-xs text-muted">Coach notified</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN LANDING PAGE
═══════════════════════════════════════════════════════ */
const NAV_LINKS = [
  { label: 'FEATURES',    id: 'features' },
  { label: 'FOR COACHES', id: 'coaches'  },
  { label: 'FOR CLIENTS', id: 'clients'  },
  { label: 'INDIVIDUALS', id: 'solo'     },
]

export default function Landing({ onGetStarted }) {
  const containerRef = useRef(null)
  const [navSolid,    setNavSolid]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)

  const sectionRefs = {
    hero:     useRef(null),
    features: useRef(null),
    coaches:  useRef(null),
    clients:  useRef(null),
    solo:     useRef(null),
  }

  /* Nav transparency on scroll */
  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const h = () => setNavSolid(el.scrollTop > 56)
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [])

  /* Hero entrance */
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const goto = (id) => {
    const el = sectionRefs[id]?.current
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMenuOpen(false)
  }

  /* ─── render ─────────────────────────────────────── */
  return (
    <ScrollRoot.Provider value={containerRef}>

      {/* ── extra keyframes not in app's index.css ─── */}
      <style>{`
        @keyframes heroLine {
          from { width: 0; opacity: 0; }
          to   { width: 100%; opacity: 1; }
        }
        @keyframes termBlink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes gridPulse {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
        @keyframes scanDown {
          from { transform: translateY(-100%); }
          to   { transform: translateY(100vh); }
        }
        .landing-grid {
          background-image:
            linear-gradient(rgba(154,123,85,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(154,123,85,0.055) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .landing-scan::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(154,123,85,0.04) 50%, transparent 60%);
          animation: scanDown 5s linear infinite;
          pointer-events: none;
        }
        .glow-brown-btn:hover {
          box-shadow: 0 0 28px 6px rgba(154,123,85,0.28);
        }
        .glow-olive-btn:hover {
          box-shadow: 0 0 28px 6px rgba(107,122,82,0.28);
        }
      `}</style>

      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto bg-bg text-cream"
        style={{ scrollBehavior: 'smooth' }}
      >

        {/* ════════════════════════════════════════
            NAVBAR
        ════════════════════════════════════════ */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background: navSolid ? 'rgba(28,26,24,0.96)' : 'transparent',
            backdropFilter: navSolid ? 'blur(12px)' : 'none',
            borderBottom: navSolid ? '1px solid rgba(42,39,36,0.8)' : 'none',
          }}
        >
          <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">

            {/* Logo */}
            <button
              onClick={() => goto('hero')}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <LogoMark size={34} />
              <span className="font-display font-black text-2xl tracking-widest leading-none">
                MACRO<span className="text-brown-light">STACK</span>
              </span>
            </button>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => goto(id)}
                  className="font-display text-xs tracking-widest text-muted hover:text-cream transition-colors relative group"
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-brown transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onGetStarted}
                className="font-display text-xs tracking-widest text-muted hover:text-cream transition-colors px-3 py-1.5"
              >
                SIGN IN
              </button>
              <button
                onClick={onGetStarted}
                className="font-display font-bold text-xs tracking-widest bg-brown hover:bg-brown-light text-bg px-5 py-2 rounded-lg transition-all glow-brown-btn"
              >
                GET STARTED
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-1.5"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-px bg-cream transition-all duration-300 ${menuOpen ? 'translate-y-2.5 rotate-45' : ''}`} />
              <span className={`block w-5 h-px bg-cream transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-5 h-px bg-cream transition-all duration-300 ${menuOpen ? '-translate-y-2.5 -rotate-45' : ''}`} />
            </button>
          </div>

          {/* Mobile dropdown */}
          <div
            className="md:hidden overflow-hidden transition-all duration-300"
            style={{ maxHeight: menuOpen ? '360px' : '0', background: 'rgba(28,26,24,0.98)', backdropFilter: 'blur(12px)' }}
          >
            <div className="px-5 py-4 border-t border-border space-y-1">
              {NAV_LINKS.map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => goto(id)}
                  className="block w-full text-left font-display text-sm tracking-widest text-muted hover:text-cream py-2.5 transition-colors"
                >
                  {label}
                </button>
              ))}
              <div className="pt-3 border-t border-border space-y-2">
                <button
                  onClick={onGetStarted}
                  className="block w-full font-display font-bold text-sm tracking-widest bg-brown text-bg py-3 rounded-lg text-center"
                >
                  GET STARTED FREE
                </button>
                <button
                  onClick={onGetStarted}
                  className="block w-full font-display text-sm tracking-widest border border-border text-muted py-3 rounded-lg text-center"
                >
                  SIGN IN
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* ════════════════════════════════════════
            HERO
        ════════════════════════════════════════ */}
        <section
          ref={sectionRefs.hero}
          className="relative min-h-screen flex items-center pt-14 overflow-hidden landing-grid landing-scan"
        >
          {/* Background glow orbs */}
          <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(154,123,85,0.07) 0%, transparent 65%)', transform: 'translate(-50%,-50%)' }} />
          <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(107,122,82,0.05) 0%, transparent 65%)' }} />

          <div className="relative max-w-6xl mx-auto px-5 w-full py-24 lg:py-32">
            <div className="grid md:grid-cols-2 gap-14 lg:gap-20 items-center">

              {/* ─ Left: copy ─────────────────── */}
              <div>
                {/* Eyebrow */}
                <div
                  className="flex items-center gap-3 mb-6"
                  style={{
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? 'none' : 'translateY(10px)',
                    transition: 'opacity 0.5s ease 100ms, transform 0.5s ease 100ms',
                  }}
                >
                  <span className="w-8 h-px bg-brown" style={{ animation: heroVisible ? 'heroLine 0.6s ease 200ms both' : 'none' }} />
                  <span className="font-mono text-xs tracking-widest text-brown">PRECISION NUTRITION PLATFORM</span>
                  <span className="font-mono text-xs text-dim animate-pulse">_</span>
                </div>

                {/* Main headline */}
                <h1
                  className="font-display font-black leading-none tracking-wide mb-6"
                  style={{ fontSize: 'clamp(3.2rem,7.5vw,5.5rem)' }}
                >
                  {['TRACK.', 'OPTIMIZE.', <span key="p" className="text-brown-light">PERFORM.</span>].map((word, i) => (
                    <div
                      key={i}
                      style={{
                        opacity: heroVisible ? 1 : 0,
                        transform: heroVisible ? 'none' : 'translateY(28px)',
                        transition: `opacity 0.6s ease ${200 + i * 140}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${200 + i * 140}ms`,
                        display: 'block',
                      }}
                    >
                      {word}
                    </div>
                  ))}
                </h1>

                {/* Description */}
                <p
                  className="font-mono text-sm text-muted leading-relaxed mb-8 max-w-md"
                  style={{
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? 'none' : 'translateY(16px)',
                    transition: 'opacity 0.6s ease 620ms, transform 0.6s ease 620ms',
                  }}
                >
                  The nutrition OS for serious athletes and the coaches who guide them.
                  Precision macro tracking, real-time coaching tools, and AI-powered food data — all in one platform.
                </p>

                {/* CTA buttons */}
                <div
                  className="flex flex-wrap gap-3 mb-12"
                  style={{
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? 'none' : 'translateY(16px)',
                    transition: 'opacity 0.6s ease 760ms, transform 0.6s ease 760ms',
                  }}
                >
                  <button
                    onClick={onGetStarted}
                    className="font-display font-bold text-sm tracking-widest bg-brown hover:bg-brown-light text-bg px-7 py-3.5 rounded-lg transition-all glow-brown-btn"
                  >
                    START FOR FREE →
                  </button>
                  <button
                    onClick={onGetStarted}
                    className="font-display font-bold text-sm tracking-widest border border-border hover:border-brown/50 text-muted hover:text-cream px-7 py-3.5 rounded-lg transition-all"
                  >
                    SIGN IN
                  </button>
                </div>

                {/* Stats strip */}
                <div
                  className="flex flex-wrap gap-8 pt-7 border-t border-border"
                  style={{
                    opacity: heroVisible ? 1 : 0,
                    transition: 'opacity 0.6s ease 900ms',
                  }}
                >
                  {[
                    { to: 10000, suffix: '+', label: 'FOODS IN DB'       },
                    { to: 3,     suffix: '',  label: 'USER ROLES'         },
                    { to: 100,   suffix: '%', label: 'FREE TO START'      },
                  ].map(({ to, suffix, label }) => (
                    <div key={label}>
                      <div className="font-display font-black text-3xl text-brown-light">
                        <CountUp to={to} suffix={suffix} />
                      </div>
                      <div className="font-mono text-xs text-muted tracking-widest mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─ Right: mock dashboard ────────── */}
              <div className="hidden md:block">
                <HeroDashboard />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            style={{
              opacity: heroVisible ? 0.5 : 0,
              transition: 'opacity 0.6s ease 1200ms',
            }}
          >
            <span className="font-mono text-xs tracking-widest text-dim">SCROLL</span>
            <div className="w-px h-8 bg-gradient-to-b from-dim to-transparent" style={{ animation: 'float 2s ease-in-out infinite' }} />
          </div>
        </section>

        {/* ════════════════════════════════════════
            STATS TICKER
        ════════════════════════════════════════ */}
        <section className="border-y border-border bg-surface py-10 overflow-hidden">
          <div className="max-w-6xl mx-auto px-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { to: 10000, suffix: '+', label: 'FOODS IN DATABASE',  delay: 0   },
                { to: 3,     suffix: '',  label: 'COACHING TIERS',     delay: 100 },
                { to: 100,   suffix: '%', label: 'MACRO PRECISION',    delay: 200 },
                { to: 24,    suffix: '/7',label: 'ALWAYS AVAILABLE',   delay: 300 },
              ].map(({ to, suffix, label, delay }) => (
                <Reveal key={label} delay={delay} className="text-center">
                  <div className="font-display font-black text-4xl md:text-5xl text-brown-light">
                    <CountUp to={to} suffix={suffix} />
                  </div>
                  <div className="font-mono text-xs text-muted tracking-widest mt-2">{label}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FEATURES
        ════════════════════════════════════════ */}
        <section ref={sectionRefs.features} className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 landing-grid opacity-50 pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-5">
            <Reveal className="text-center mb-16">
              <p className="font-mono text-xs tracking-widest text-brown mb-3">— WHAT WE OFFER —</p>
              <h2 className="font-display font-black tracking-wide" style={{ fontSize: 'clamp(2.5rem,6vw,4rem)' }}>
                BUILT FOR<br/>PERFORMANCE
              </h2>
              <p className="font-mono text-sm text-muted mt-4 max-w-lg mx-auto leading-relaxed">
                Three tools in one platform — everything an athlete or coach needs to operate at the highest level.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  symbol: '◎',
                  color:  'brown',
                  title:  'PRECISION TRACKING',
                  desc:   'Log every meal with exact macros. Barcode scanner, custom foods, and AI-powered search mean no calorie goes unaccounted for.',
                  tags:   ['BARCODE SCAN', 'CUSTOM FOODS', 'SEARCH'],
                  delay:  0,
                },
                {
                  symbol: '↗',
                  color:  'olive',
                  title:  'COACH CONNECT',
                  desc:   'Coaches manage unlimited clients, set individual macro targets, monitor daily logs, and communicate in real time — one dashboard.',
                  tags:   ['CLIENT DASHBOARD', 'MACRO TARGETS', 'MESSAGING'],
                  delay:  120,
                },
                {
                  symbol: '✦',
                  color:  'slategray',
                  title:  'AI FOOD INTEL',
                  desc:   'Our AI identifies nutrition data for virtually any food — by name, brand, or description. No barcode required.',
                  tags:   ['ANY FOOD', 'INSTANT DATA', 'VERIFIED'],
                  delay:  240,
                },
              ].map(({ symbol, color, title, desc, tags, delay }) => {
                const iconBg  = { brown: 'bg-brown/20',     olive: 'bg-olive/20',     slategray: 'bg-slategray/20'     }
                const iconBdr = { brown: 'border-brown/30', olive: 'border-olive/30', slategray: 'border-slategray/30' }
                const iconTxt = { brown: 'text-brown-light',olive: 'text-olive-light',slategray: 'text-slategray-light'}
                const tagBg   = { brown: 'bg-brown/10 text-brown-light border-brown/20',
                                  olive: 'bg-olive/10 text-olive-light border-olive/20',
                                  slategray: 'bg-slategray/10 text-slategray-light border-slategray/20' }
                const cardHov = { brown: 'hover:border-brown/40',olive: 'hover:border-olive/40',slategray: 'hover:border-slategray/40'}
                return (
                  <Reveal key={title} delay={delay}>
                    <div className={`bg-card border border-border ${cardHov[color]} rounded-xl p-6 h-full group transition-all duration-300 hover:-translate-y-1`}
                      style={{ ':hover': { boxShadow: '0 12px 32px -8px rgba(0,0,0,0.4)' } }}>
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl ${iconBg[color]} border ${iconBdr[color]} flex items-center justify-center mb-5 transition-all`}>
                        <span className={`${iconTxt[color]} text-xl`}>{symbol}</span>
                      </div>
                      <h3 className="font-display font-black text-xl tracking-widest mb-3">{title}</h3>
                      <p className="font-mono text-sm text-muted leading-relaxed mb-5">{desc}</p>
                      {/* Tag chips */}
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <span key={tag} className={`font-mono text-xs px-2 py-0.5 rounded border ${tagBg[color]}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FOR COACHES
        ════════════════════════════════════════ */}
        <section ref={sectionRefs.coaches} className="py-28 bg-surface relative overflow-hidden">
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle at 100% 0%, rgba(154,123,85,0.15) 0%, transparent 60%)' }} />

          <div className="max-w-6xl mx-auto px-5">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left: copy */}
              <div>
                <Reveal>
                  <p className="font-mono text-xs tracking-widest text-brown mb-3">— FOR COACHES —</p>
                  <h2
                    className="font-display font-black leading-none tracking-wide mb-5"
                    style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)' }}
                  >
                    MANAGE YOUR<br/><span className="text-brown-light">ENTIRE ROSTER.</span>
                  </h2>
                  <p className="font-mono text-sm text-muted leading-relaxed mb-8 max-w-md">
                    Everything you need to run a data-driven coaching practice.
                    Monitor clients, set targets, and make adjustments in real time — from anywhere.
                  </p>
                </Reveal>

                <div className="space-y-4 mb-10">
                  {[
                    { title: 'CLIENT DASHBOARD',  desc: 'See all clients at a glance — who hit their targets, who needs attention, who messaged you today.' },
                    { title: 'CUSTOM TARGETS',     desc: 'Set individual calorie and macro goals for each client based on their body composition and objectives.' },
                    { title: 'REAL-TIME LOG VIEW', desc: "Watch any client's food log update as they track throughout the day — no waiting for weekly reports." },
                    { title: 'DIRECT MESSAGING',   desc: 'In-app coach-client messaging keeps all communication organized and searchable in one place.' },
                    { title: 'COACH CODE',         desc: 'Share your unique 6-digit code so new clients link to you instantly when they sign up.' },
                  ].map(({ title, desc }, i) => (
                    <Reveal key={title} delay={i * 80}>
                      <div className="flex gap-4 group">
                        <div className="w-0.5 rounded-full bg-brown/30 group-hover:bg-brown/60 flex-shrink-0 transition-colors" style={{ minHeight: '2.5rem' }} />
                        <div className="pb-1">
                          <p className="font-display font-bold text-sm tracking-widest text-cream mb-0.5">{title}</p>
                          <p className="font-mono text-xs text-muted leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>

                <Reveal delay={480}>
                  <button
                    onClick={onGetStarted}
                    className="font-display font-bold text-sm tracking-widest bg-brown hover:bg-brown-light text-bg px-7 py-3.5 rounded-lg transition-all glow-brown-btn"
                  >
                    START COACHING →
                  </button>
                </Reveal>
              </div>

              {/* Right: mockup */}
              <CoachMockup />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FOR CLIENTS
        ════════════════════════════════════════ */}
        <section ref={sectionRefs.clients} className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 landing-grid opacity-40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle at 0% 100%, rgba(107,122,82,0.12) 0%, transparent 60%)' }} />

          <div className="max-w-6xl mx-auto px-5">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left: mockup */}
              <div className="relative">
                <ClientMockup />
              </div>

              {/* Right: copy */}
              <div>
                <Reveal>
                  <p className="font-mono text-xs tracking-widest text-olive mb-3">— FOR CLIENTS —</p>
                  <h2
                    className="font-display font-black leading-none tracking-wide mb-5"
                    style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)' }}
                  >
                    FOLLOW YOUR<br/><span className="text-olive-light">PERSONALIZED PLAN.</span>
                  </h2>
                  <p className="font-mono text-sm text-muted leading-relaxed mb-8 max-w-md">
                    Your coach sets the targets. You log the food. MacroStack shows you exactly
                    where you stand — every single day.
                  </p>
                </Reveal>

                <div className="space-y-4 mb-10">
                  {[
                    { title: 'PERSONALIZED TARGETS',  desc: 'Calories and macros set specifically for your body composition, goals, and timeline by your coach.' },
                    { title: 'FAST FOOD LOGGING',      desc: 'Search thousands of foods, scan barcodes, or use AI to log any meal in under 10 seconds.' },
                    { title: 'WEIGHT TREND TRACKING',  desc: 'Log your weight daily and watch a smooth trend line show your real progress over time.' },
                    { title: 'COACH MESSAGING',        desc: 'Direct line to your coach for questions, check-ins, or when you need a plan adjustment.' },
                    { title: 'DAILY PROGRESS VIEW',    desc: 'See your calorie and macro breakdown in real time — no guessing if you\'re on track today.' },
                  ].map(({ title, desc }, i) => (
                    <Reveal key={title} delay={i * 80}>
                      <div className="flex gap-4 group">
                        <div className="w-0.5 rounded-full bg-olive/30 group-hover:bg-olive/60 flex-shrink-0 transition-colors" style={{ minHeight: '2.5rem' }} />
                        <div className="pb-1">
                          <p className="font-display font-bold text-sm tracking-widest text-cream mb-0.5">{title}</p>
                          <p className="font-mono text-xs text-muted leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>

                <Reveal delay={480}>
                  <button
                    onClick={onGetStarted}
                    className="font-display font-bold text-sm tracking-widest bg-olive hover:bg-olive-light text-bg px-7 py-3.5 rounded-lg transition-all glow-olive-btn"
                  >
                    JOIN AS A CLIENT →
                  </button>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FOR INDIVIDUALS / SOLO
        ════════════════════════════════════════ */}
        <section ref={sectionRefs.solo} className="py-28 bg-surface relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(90,100,114,0.08) 0%, transparent 70%)' }} />

          <div className="max-w-6xl mx-auto px-5">
            <Reveal className="text-center mb-16">
              <p className="font-mono text-xs tracking-widest text-slategray-light mb-3">— FOR INDIVIDUALS —</p>
              <h2
                className="font-display font-black tracking-wide leading-none"
                style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)' }}
              >
                NO COACH?<br/><span className="text-slategray-light">NO PROBLEM.</span>
              </h2>
              <p className="font-mono text-sm text-muted mt-5 max-w-lg mx-auto leading-relaxed">
                MacroStack's full tracking suite is available to anyone who wants to take control of their nutrition independently —
                no coach connection required.
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  sym: '◎',
                  title: 'FULL FOOD DATABASE',
                  desc: 'Access thousands of foods with verified nutrition data. Search by name, brand, or scan a barcode.',
                  delay: 0,
                },
                {
                  sym: '✦',
                  title: 'AI FOOD SEARCH',
                  desc: "Describe any food and our AI returns accurate nutrition data instantly — no barcode, no problem.",
                  delay: 60,
                },
                {
                  sym: '↑',
                  title: 'WEIGHT TRACKING',
                  desc: 'Log your weight daily. Watch a trend line smooth out the noise and show your real trajectory.',
                  delay: 120,
                },
                {
                  sym: '→',
                  title: 'SET YOUR OWN TARGETS',
                  desc: "Use the built-in macro calculator or enter custom goals. You're in complete control.",
                  delay: 180,
                },
                {
                  sym: '■',
                  title: 'CUSTOM FOODS',
                  desc: "Add any food that isn't in the database. Your entries are saved for fast re-use.",
                  delay: 240,
                },
                {
                  sym: '◆',
                  title: 'UPGRADE ANYTIME',
                  desc: 'Start solo and connect with a coach whenever you\'re ready. All your data transfers seamlessly.',
                  delay: 300,
                },
              ].map(({ sym, title, desc, delay }) => (
                <Reveal key={title} delay={delay}>
                  <div className="bg-card border border-border hover:border-slategray/40 rounded-xl p-5 h-full group transition-all duration-300 hover:-translate-y-0.5">
                    <span className="text-slategray-light text-xl block mb-4">{sym}</span>
                    <h3 className="font-display font-bold text-sm tracking-widest mb-2 text-cream">{title}</h3>
                    <p className="font-mono text-xs text-muted leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={360} className="text-center mt-12">
              <button
                onClick={onGetStarted}
                className="font-display font-bold text-sm tracking-widest border border-slategray/40 hover:border-slategray text-slategray-light hover:text-cream px-7 py-3.5 rounded-lg transition-all"
              >
                START TRACKING FREE →
              </button>
            </Reveal>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════ */}
        <section className="py-36 relative overflow-hidden landing-grid landing-scan">
          {/* Big centered glow */}
          <div className="absolute top-1/2 left-1/2 w-[900px] h-[500px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(154,123,85,0.1) 0%, transparent 65%)', transform: 'translate(-50%,-50%)' }} />

          <div className="relative max-w-2xl mx-auto px-5 text-center">
            <Reveal>
              <p className="font-mono text-xs tracking-widest text-brown mb-5 flex items-center justify-center gap-3">
                <span className="w-8 h-px bg-brown" />
                READY TO START?
                <span className="w-8 h-px bg-brown" />
              </p>
              <h2
                className="font-display font-black leading-none tracking-wide mb-6"
                style={{ fontSize: 'clamp(3rem,8vw,5.5rem)' }}
              >
                YOUR MACROS<br/><span className="text-brown-light">AWAIT.</span>
              </h2>
              <p className="font-mono text-sm text-muted leading-relaxed mb-10 max-w-md mx-auto">
                Join athletes and coaches already using MacroStack to hit their targets every single day.
                It's free to start — no credit card required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onGetStarted}
                  className="font-display font-bold text-base tracking-widest bg-brown hover:bg-brown-light text-bg px-9 py-4 rounded-lg transition-all glow-brown-btn"
                >
                  GET STARTED FREE
                </button>
                <button
                  onClick={onGetStarted}
                  className="font-display font-bold text-base tracking-widest border border-border hover:border-brown/40 text-muted hover:text-cream px-9 py-4 rounded-lg transition-all"
                >
                  SIGN IN
                </button>
              </div>

              {/* Trust signals */}
              <div className="mt-10 flex flex-wrap justify-center gap-6 text-dim">
                {['FREE TO START', 'NO CREDIT CARD', 'COACH OR SOLO'].map(t => (
                  <span key={t} className="font-mono text-xs tracking-widest flex items-center gap-2">
                    <span className="text-brown/60">✓</span> {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════ */}
        <footer className="border-t border-border bg-surface py-10">
          <div className="max-w-6xl mx-auto px-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <LogoMark size={30} />
                  <span className="font-display font-black text-2xl tracking-widest">
                    MACRO<span className="text-brown-light">STACK</span>
                  </span>
                </div>
                <p className="font-mono text-xs text-muted mt-1">PRECISION NUTRITION PLATFORM</p>
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {NAV_LINKS.map(({ label, id }) => (
                  <button
                    key={id}
                    onClick={() => goto(id)}
                    className="font-mono text-xs text-muted hover:text-cream tracking-widest transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="font-mono text-xs text-dim">
                © 2026 MACROSTACK
              </p>
            </div>
          </div>
        </footer>

      </div>
    </ScrollRoot.Provider>
  )
}
