import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { FOOD_COUNT } from '../data/foods'

/* ── inline logo mark (transparent-bg MS diamond) ── */
function LogoMark({ size = 32 }) {
  return (
    <img
      src="/MSLOGO2.png"
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
═══════════════════════════════════════════════════════ */
const ScrollRoot = createContext(null)

function useReveal(threshold = 0.12) {
  const root = useContext(ScrollRoot)
  const ref  = useRef(null)
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

/* ── upgraded Reveal: blur + scale + spring easing ── */
function Reveal({ children, className = '', delay = 0, y = 64, x = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translate(${x}px,${y}px) scale(0.93)`,
        filter: visible ? 'blur(0px)' : 'blur(10px)',
        transition: [
          `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
          `transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
          `filter 0.7s ease ${delay}ms`,
        ].join(', '),
      }}
    >
      {children}
    </div>
  )
}

/* ── SplitReveal: word-by-word animation for headings ── */
function SplitReveal({ children, className = '', delay = 0, wordDelay = 100 }) {
  const [ref, visible] = useReveal()
  const words = String(children).split(' ')
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0px)' : 'translateY(48px)',
            filter: visible ? 'blur(0px)' : 'blur(6px)',
            transition: [
              `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay + i * wordDelay}ms`,
              `transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay + i * wordDelay}ms`,
              `filter 0.55s ease ${delay + i * wordDelay}ms`,
            ].join(', '),
            marginRight: i < words.length - 1 ? '0.3em' : '0',
          }}
        >
          {word}
        </span>
      ))}
    </span>
  )
}

/* ── ScrollProgress: fixed bar at very top ── */
function ScrollProgress({ containerRef }) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const h = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      setPct(Math.min((scrollTop / (scrollHeight - clientHeight)) * 100, 100))
    }
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [containerRef])
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none">
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #9A7B55, #C4A882, #6B7A52)',
          transition: 'width 0.08s linear',
          boxShadow: '0 0 12px 2px rgba(154,123,85,0.6)',
        }}
      />
    </div>
  )
}

/* ── useParallax: scroll-driven offset ── */
function useParallax(speed = 0.15) {
  const root = useContext(ScrollRoot)
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    const el = root?.current; if (!el) return
    const h = () => setOffset(el.scrollTop * speed)
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [root, speed])
  return offset
}

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

function MacroBar({ label, value, max, colorClass, delay = 0 }) {
  const [ref, visible] = useReveal(0.05)
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="font-display text-xs tracking-widest text-muted">{label}</span>
        <span className="font-mono text-xs text-cream">{value}<span className="text-muted">/{max}g</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-dim overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: visible ? `${pct}%` : '0%', transition: `width 1.3s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}
        />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MOUSE-INTERACTIVE COMPONENTS
══════════════════════════════════════════════════════ */

/* ── Cursor spotlight — radial glow follows the mouse ── */
function CursorSpotlight() {
  const [pos, setPos] = useState({ x: -9999, y: -9999 })
  useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [])
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[3] hidden md:block"
      style={{
        background: `radial-gradient(550px at ${pos.x}px ${pos.y}px, rgba(154,123,85,0.05) 0%, transparent 70%)`,
      }}
    />
  )
}

/* ── 3D tilt card — perspective parallax + specular shine ── */
function TiltCard({ children, className = '', strength = 7, glowColor = 'rgba(154,123,85,0.11)' }) {
  const ref = useRef(null)
  const [s, setS] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, on: false })

  useEffect(() => {
    const el = ref.current; if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      setS({
        rx: ny * strength,
        ry: -nx * strength,
        gx: ((e.clientX - r.left) / r.width) * 100,
        gy: ((e.clientY - r.top) / r.height) * 100,
        on: true,
      })
    }
    const onLeave = () => setS({ rx: 0, ry: 0, gx: 50, gy: 50, on: false })
    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [strength])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `perspective(900px) rotateX(${s.rx}deg) rotateY(${s.ry}deg) translateZ(${s.on ? 6 : 0}px)`,
        transition: s.on ? 'transform 0.12s ease-out' : 'transform 0.65s cubic-bezier(0.16,1,0.3,1)',
        willChange: 'transform',
        position: 'relative',
      }}
    >
      {children}
      {/* Specular shine overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: 'inherit',
          background: `radial-gradient(circle at ${s.gx}% ${s.gy}%, ${glowColor}, transparent 62%)`,
          opacity: s.on ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />
    </div>
  )
}

/* ── Magnetic button — gently attracts to cursor on hover ── */
function MagneticButton({ children, className = '', onClick, strength = 0.32, style: extraStyle }) {
  const ref = useRef(null)
  const [off, setOff] = useState({ x: 0, y: 0 })
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    setOff({
      x: (e.clientX - r.left - r.width / 2) * strength,
      y: (e.clientY - r.top - r.height / 2) * strength,
    })
  }
  const onLeave = () => setOff({ x: 0, y: 0 })
  const isResting = off.x === 0 && off.y === 0
  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        ...extraStyle,
        transform: `translate(${off.x}px, ${off.y}px)`,
        transition: isResting
          ? 'transform 0.55s cubic-bezier(0.16,1,0.3,1)'
          : 'transform 0.12s ease-out',
        display: 'inline-block',
      }}
    >
      {children}
    </button>
  )
}

/* ── hero mock dashboard ──────────────────────────── */
function HeroDashboard() {
  const [ref, visible] = useReveal(0.05)
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(64px) scale(0.9)',
        filter: visible ? 'blur(0px)' : 'blur(12px)',
        transition: [
          'opacity 0.9s cubic-bezier(0.16,1,0.3,1) 200ms',
          'transform 0.9s cubic-bezier(0.16,1,0.3,1) 200ms',
          'filter 0.7s ease 200ms',
        ].join(', '),
      }}
      className="relative"
    >
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: '0 0 80px -16px rgba(154,123,85,0.22)', borderRadius: '16px' }} />

      <div className="relative bg-card border border-border rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 32px 64px -16px rgba(0,0,0,0.7)' }}>

        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-surface">
          <div className="w-2.5 h-2.5 rounded-full bg-dim" />
          <div className="w-2.5 h-2.5 rounded-full bg-dim" />
          <div className="w-2.5 h-2.5 rounded-full bg-dim" />
          <span className="font-mono text-xs text-dim ml-3 tracking-widest">MACROSTACK — COACH PORTAL</span>
        </div>

        <div className="p-5 space-y-5">
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

          <div className="space-y-3">
            <MacroBar label="PROTEIN" value={145} max={160} colorClass="bg-olive"     delay={400} />
            <MacroBar label="CARBS"   value={220} max={250} colorClass="bg-brown"     delay={560} />
            <MacroBar label="FAT"     value={52}  max={65}  colorClass="bg-slategray" delay={720} />
          </div>

          <div className="space-y-0 border-t border-border pt-4">
            {[
              { meal: 'BREAKFAST', items: 'Oats, Eggs, Banana', cal: 540 },
              { meal: 'LUNCH',     items: 'Chicken Rice Bowl',  cal: 720 },
              { meal: 'DINNER',    items: 'Salmon, Broccoli…',  cal: 580 },
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

      {/* Floating badge — AI · liquid glass */}
      <div
        className="glass absolute -right-5 top-10 rounded-xl px-3 py-2 flex items-center gap-2"
        style={{ animation: 'float 3.2s ease-in-out infinite' }}
      >
        <div className="w-5 h-5 rounded bg-brown/20 flex items-center justify-center">
          <span className="text-brown-light text-xs">✦</span>
        </div>
        <span className="font-mono text-xs text-cream whitespace-nowrap">AI FOOD SEARCH</span>
      </div>

      {/* Floating badge — Coach · liquid glass */}
      <div
        className="glass absolute -left-5 bottom-16 rounded-xl px-3 py-2 flex items-center gap-2"
        style={{ animation: 'float 3.2s ease-in-out infinite 1.6s' }}
      >
        <div className="w-5 h-5 rounded bg-olive/20 flex items-center justify-center">
          <span className="text-olive-light text-xs">↗</span>
        </div>
        <div>
          <p className="font-mono text-xs text-cream">COACH BRANDEN</p>
          <p className="font-mono text-xs text-muted">12 active users</p>
        </div>
      </div>
    </div>
  )
}

/* ── mock coach dashboard ─────────────────────────── */
function CoachMockup() {
  const [ref, visible] = useReveal(0.1)
  const clients = [
    { name: 'Grayson H.', pct: 94,  label: 'ON TRACK',        c: 'olive'     },
    { name: 'Alex M.',    pct: 78,  label: 'NEEDS CHECK-IN',  c: 'brown'     },
    { name: 'Jordan K.',  pct: 105, label: 'OVER TARGET',     c: 'slategray' },
    { name: 'Sam R.',     pct: 88,  label: 'ON TRACK',        c: 'olive'     },
    { name: 'Casey L.',   pct: 62,  label: 'NEEDS ATTENTION', c: 'brown'     },
  ]
  const iconBg  = { olive: 'bg-olive/20',      brown: 'bg-brown/20',     slategray: 'bg-slategray/20'     }
  const iconBdr = { olive: 'border-olive/30',  brown: 'border-brown/30', slategray: 'border-slategray/30' }
  const iconTxt = { olive: 'text-olive-light', brown: 'text-brown-light',slategray: 'text-slategray-light'}
  const barBg   = { olive: 'bg-olive',         brown: 'bg-brown',        slategray: 'bg-slategray'        }

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateX(60px) scale(0.92)',
        filter: visible ? 'blur(0px)' : 'blur(12px)',
        transition: [
          'opacity 0.9s cubic-bezier(0.16,1,0.3,1) 200ms',
          'transform 0.9s cubic-bezier(0.16,1,0.3,1) 200ms',
          'filter 0.7s ease 200ms',
        ].join(', '),
        boxShadow: '0 24px 56px -12px rgba(0,0,0,0.6), 0 0 40px -12px rgba(154,123,85,0.12)',
      }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-muted tracking-widest">COACH PORTAL</p>
          <p className="font-display font-black text-lg tracking-wide">MY USERS</p>
        </div>
        <div className="bg-brown/10 border border-brown/20 rounded-lg px-3 py-1">
          <span className="font-mono text-xs text-brown-light">12 ACTIVE</span>
        </div>
      </div>

      <div className="flex border-b border-border">
        {['ALL', 'ON TRACK', 'NEEDS ATTENTION'].map((tab, i) => (
          <div key={tab} className={`flex-1 text-center py-2.5 font-display text-xs tracking-widest ${i === 0 ? 'text-brown-light border-b-2 border-brown' : 'text-muted'}`}>
            {tab}
          </div>
        ))}
      </div>

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
                  style={{ width: visible ? `${Math.min(pct, 100)}%` : '0%', transition: `width 1.1s cubic-bezier(0.16,1,0.3,1) ${450 + i * 80}ms` }}
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

/* ── mock mobile client app ───────────────────────── */
function ClientMockup() {
  const [ref, visible] = useReveal(0.1)
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateX(-60px) scale(0.92)',
        filter: visible ? 'blur(0px)' : 'blur(12px)',
        transition: [
          'opacity 0.9s cubic-bezier(0.16,1,0.3,1) 200ms',
          'transform 0.9s cubic-bezier(0.16,1,0.3,1) 200ms',
          'filter 0.7s ease 200ms',
        ].join(', '),
        maxWidth: '260px',
      }}
      className="relative mx-auto"
    >
      <div
        className="bg-card border border-border rounded-3xl overflow-hidden"
        style={{ maxWidth: '260px', margin: '0 auto', boxShadow: '0 32px 64px -16px rgba(0,0,0,0.65), 0 0 36px -12px rgba(107,122,82,0.15)' }}
      >
        <div className="bg-surface px-5 pt-4 pb-2 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">9:41</span>
          <div className="flex gap-1">
            <div className="w-1 h-2 bg-muted rounded-sm" />
            <div className="w-1 h-3 bg-muted rounded-sm" />
            <div className="w-1 h-4 bg-cream rounded-sm" />
          </div>
        </div>

        <div className="px-4 pb-6 pt-3 space-y-4">
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(10px)', transition: 'opacity 0.5s ease 300ms, transform 0.5s ease 300ms' }}>
            <p className="font-mono text-xs text-muted tracking-widest">MONDAY · MAY 11</p>
            <p className="font-display font-black text-2xl leading-tight mt-0.5">HEY,<br/><span className="text-olive-light">GRAYSON!</span></p>
          </div>

          <div className="bg-surface rounded-xl p-3 border border-border" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 400ms' }}>
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

          <div className="bg-surface rounded-xl p-3 border border-border flex items-center gap-3"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: 'opacity 0.5s ease 700ms, transform 0.5s ease 700ms' }}>
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

          <div className="space-y-1.5" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 820ms' }}>
            <p className="font-display font-bold text-xs tracking-widest text-muted">TODAY'S MEALS</p>
            {[
              { name: 'BREAKFAST', desc: 'Oats · Eggs', cal: 480 },
              { name: 'LUNCH',     desc: 'Chicken bowl', cal: 760 },
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

      {/* Floating notification · liquid glass */}
      <div
        className="glass absolute -right-4 top-20 rounded-xl px-3 py-2"
        style={{ animation: 'float 3.5s ease-in-out infinite 0.8s' }}
      >
        <p className="font-mono text-xs text-brown-light">✓ LOG SUBMITTED</p>
        <p className="font-mono text-xs text-muted">Coach notified</p>
      </div>
    </div>
  )
}

/* ── Kay AI avatar ────────────────────────────────────── */
function KayAvatar() {
  return (
    <div className="relative mx-auto" style={{ width: 260, height: 260 }}>
      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(154,123,85,0.25) 0%, transparent 65%)',
          filter: 'blur(28px)',
          animation: 'glowPulse 3.5s ease-in-out infinite',
        }}
      />

      {/* Concentric rings */}
      {[220, 180, 150].map((size, i) => (
        <div
          key={size}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size, height: size,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            border: `1px solid rgba(154,123,85,${0.12 + i * 0.06})`,
            animation: `float ${5 - i}s ease-in-out infinite ${i * 0.7}s`,
          }}
        />
      ))}

      {/* Core glass card */}
      <div
        className="absolute glass-warm rounded-3xl flex flex-col items-center justify-center gap-1"
        style={{
          width: 120, height: 120,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(154,123,85,0.38)',
          boxShadow: '0 0 48px rgba(154,123,85,0.22), 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.13)',
          overflow: 'hidden',
        }}
      >
        {/* Internal scan line */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.35 }}>
          <div
            className="absolute inset-x-0 h-12"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(154,123,85,0.08), transparent)',
              animation: 'scanDown 3s linear infinite',
            }}
          />
        </div>
        <span
          className="font-display font-black leading-none"
          style={{
            fontSize: '3.2rem',
            color: '#C4A882',
            textShadow: '0 0 22px rgba(154,123,85,0.8), 0 0 44px rgba(154,123,85,0.35)',
          }}
        >
          K
        </span>
        <span className="font-mono tracking-widest" style={{ fontSize: '6px', color: 'rgba(154,123,85,0.55)' }}>
          AI · NUTRITION
        </span>
      </div>

      {/* Floating chip badges */}
      <div
        className="glass absolute rounded-xl px-2.5 py-1.5"
        style={{ top: '7%', right: '3%', animation: 'float 3.4s ease-in-out infinite 0.4s' }}
      >
        <p className="font-mono whitespace-nowrap" style={{ fontSize: '9px', color: '#C4A882' }}>✦ {FOOD_COUNT.toLocaleString()}+ foods</p>
      </div>
      <div
        className="glass absolute rounded-xl px-2.5 py-1.5"
        style={{ bottom: '10%', left: '2%', animation: 'float 3.9s ease-in-out infinite 1.2s' }}
      >
        <p className="font-mono whitespace-nowrap" style={{ fontSize: '9px', color: 'var(--color-olive-light)' }}>↗ Instant macros</p>
      </div>
      <div
        className="glass absolute rounded-xl px-2.5 py-1.5"
        style={{ top: '48%', left: '-2%', transform: 'translateY(-50%)', animation: 'float 4.3s ease-in-out infinite 0.9s' }}
      >
        <p className="font-mono whitespace-nowrap" style={{ fontSize: '9px', color: 'var(--color-slategray-light)' }}>◎ 24 / 7</p>
      </div>
    </div>
  )
}

/* ── Kay chat demo ────────────────────────────────────── */
function KayChatPreview() {
  const [ref, visible] = useReveal(0.08)
  const MSGS = [
    { role: 'user', text: 'What are the macros in a Chipotle chicken burrito bowl?' },
    {
      role: 'kay',
      text: 'Chicken Burrito Bowl (~530g): approx. 700 kcal, 43g protein, 72g carbs, 23g fat. The cilantro-lime rice accounts for ~40g of the carbs — swapping it for extra fajita veggies saves ~30g carbs with only 60 fewer calories.',
      chips: [
        { label: 'PROTEIN', val: '43g', color: 'text-olive-light' },
        { label: 'CARBS',   val: '72g', color: 'text-brown-light' },
        { label: 'FAT',     val: '23g', color: 'text-slategray-light' },
        { label: 'KCAL',    val: '700', color: 'text-cream' },
      ],
    },
    { role: 'user', text: 'I have 45g protein and 180 kcal remaining today. What should I eat?' },
    { role: 'kay', text: '1 cup low-fat cottage cheese: 26g protein, 180 kcal — near perfect. Add one hard-boiled egg for +6g protein and +78 kcal if you can flex slightly over target.' },
  ]

  return (
    <div ref={ref} className="max-w-2xl mx-auto">
      <TiltCard className="glass-warm rounded-2xl overflow-hidden" strength={3} glowColor="rgba(154,123,85,0.10)">
        {/* Header */}
        <div className="px-5 py-4 border-b border-brown/15 flex items-center gap-3" style={{ background: 'rgba(154,123,85,0.05)' }}>
          <div className="w-9 h-9 rounded-xl bg-brown/20 border border-brown/35 flex items-center justify-center flex-shrink-0">
            <span className="font-display font-black text-base text-brown-light">K</span>
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-sm tracking-widest text-cream">KAY</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-olive" style={{ animation: 'glowPulse 2s ease-in-out infinite' }} />
              <p className="font-mono text-xs text-muted">AI Nutrition Expert · always on</p>
            </div>
          </div>
          <span className="font-mono text-xs text-dim bg-card border border-border rounded px-2 py-0.5">BETA</span>
        </div>

        {/* Messages */}
        <div className="px-5 py-5 space-y-4">
          {MSGS.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{
                opacity:    visible ? 1 : 0,
                transform:  visible ? 'none' : 'translateY(10px)',
                transition: `opacity 0.5s ease ${350 + i * 180}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${350 + i * 180}ms`,
              }}
            >
              <div className={msg.role === 'user' ? 'ml-10' : 'mr-10'}>
                {msg.role === 'kay' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded bg-brown/20 border border-brown/25 flex items-center justify-center">
                      <span className="font-display font-black text-brown-light" style={{ fontSize: '8px' }}>K</span>
                    </div>
                    <span className="font-mono text-brown tracking-widest" style={{ fontSize: '9px' }}>KAY</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-brown/12 border border-brown/22'
                      : 'bg-card border border-border'
                  }`}
                  style={msg.role === 'user' ? { background: 'rgba(154,123,85,0.12)' } : {}}
                >
                  <p className="font-mono text-xs text-muted leading-relaxed">{msg.text}</p>
                  {msg.chips && (
                    <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/50">
                      {msg.chips.map(({ label, val, color }) => (
                        <div key={label} className="text-center">
                          <p className={`font-display font-bold text-sm ${color}`}>{val}</p>
                          <p className="font-mono text-dim" style={{ fontSize: '8px' }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          <div
            className="flex justify-start"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 1100ms' }}
          >
            <div className="mr-10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 rounded bg-brown/20 border border-brown/25 flex items-center justify-center">
                  <span className="font-display font-black text-brown-light" style={{ fontSize: '8px' }}>K</span>
                </div>
                <span className="font-mono text-brown tracking-widest" style={{ fontSize: '9px' }}>KAY</span>
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3 flex gap-1.5 items-center">
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    className="w-1.5 h-1.5 rounded-full bg-brown/50"
                    style={{ animation: `glowPulse 1.3s ease-in-out infinite ${j * 0.22}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </TiltCard>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN LANDING PAGE
═══════════════════════════════════════════════════════ */
const NAV_LINKS = [
  { label: 'FEATURES',    id: 'features' },
  { label: 'MEET KAY',   id: 'kay'      },
  { label: 'FOR COACHES', id: 'coaches'  },
  { label: 'FOR USERS',  id: 'clients'  },
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
    kay:      useRef(null),
    coaches:  useRef(null),
    clients:  useRef(null),
    solo:     useRef(null),
  }

  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const h = () => setNavSolid(el.scrollTop > 56)
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const goto = (id) => {
    sectionRefs[id]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMenuOpen(false)
  }

  /* ── parallax for hero blobs ── */
  const [parallaxY, setParallaxY] = useState(0)
  const [heroMouse, setHeroMouse] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const h = () => setParallaxY(el.scrollTop * 0.2)
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [])

  return (
    <ScrollRoot.Provider value={containerRef}>

      <style>{`
        @keyframes heroLine  { from { width:0;opacity:0 } to { width:100%;opacity:1 } }
        @keyframes scanDown  { from { transform:translateY(-100%) } to { transform:translateY(100vh) } }
        @keyframes float     { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) } }

        @keyframes shimmer {
          0%   { background-position: -200% center }
          100% { background-position:  200% center }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4 }
          50%       { opacity: 1 }
        }
        @keyframes driftBlob {
          0%,100% { transform: translate(-50%,-50%) scale(1) }
          40%     { transform: translate(-44%,-58%) scale(1.1) }
          70%     { transform: translate(-56%,-44%) scale(0.92) }
        }
        @keyframes lineReveal {
          from { transform: scaleX(0); transform-origin: left center }
          to   { transform: scaleX(1); transform-origin: left center }
        }
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(24px); filter: blur(6px) }
          to   { opacity:1; transform: none; filter: blur(0) }
        }

        .landing-grid {
          background-image:
            linear-gradient(rgba(154,123,85,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(154,123,85,0.055) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .landing-scan::after {
          content:''; position:absolute; inset:0; pointer-events:none;
          background: linear-gradient(to bottom, transparent 40%, rgba(154,123,85,0.04) 50%, transparent 60%);
          animation: scanDown 5s linear infinite;
        }

        /* ── LIQUID GLASS UTILITIES ── */
        .glass {
          background: rgba(255,255,255,0.022);
          backdrop-filter: blur(22px) saturate(180%);
          -webkit-backdrop-filter: blur(22px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.10);
        }
        /* warm tint — brown accent */
        .glass-warm {
          background: rgba(154,123,85,0.04);
          backdrop-filter: blur(22px) saturate(180%);
          -webkit-backdrop-filter: blur(22px) saturate(180%);
          border: 1px solid rgba(154,123,85,0.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.08);
        }
        /* olive tint */
        .glass-olive {
          background: rgba(107,122,82,0.04);
          backdrop-filter: blur(22px) saturate(180%);
          -webkit-backdrop-filter: blur(22px) saturate(180%);
          border: 1px solid rgba(107,122,82,0.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.08);
        }
        /* slate tint */
        .glass-slate {
          background: rgba(90,100,114,0.04);
          backdrop-filter: blur(22px) saturate(180%);
          -webkit-backdrop-filter: blur(22px) saturate(180%);
          border: 1px solid rgba(90,100,114,0.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.08);
        }
        /* section-level glass — matches navbar opacity */
        .glass-section {
          background: rgba(14,14,12,0.09);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
        }
        /* ghost button */
        .glass-btn {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .glass-btn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(154,123,85,0.45);
          color: #E8E4DC;
        }

        .glow-brown-btn:hover { box-shadow: 0 0 28px 6px rgba(154,123,85,0.28); }
        .glow-olive-btn:hover  { box-shadow: 0 0 28px 6px rgba(107,122,82,0.28); }
      `}</style>

      <CursorSpotlight />
      <ScrollProgress containerRef={containerRef} />

      <div ref={containerRef} className="h-full w-full overflow-y-auto bg-bg text-cream" style={{ scrollBehavior: 'smooth' }}>

        {/* ══ NAVBAR ════════════════════════════════ */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background:     navSolid ? 'rgba(28,26,24,0.09)' : 'transparent',
            backdropFilter: navSolid ? 'blur(22px) saturate(180%)' : 'none',
            WebkitBackdropFilter: navSolid ? 'blur(22px) saturate(180%)' : 'none',
            borderBottom:   navSolid ? '1px solid rgba(255,255,255,0.07)' : 'none',
            boxShadow:      navSolid ? 'inset 0 -1px 0 rgba(255,255,255,0.04)' : 'none',
          }}
        >
          <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
            <button onClick={() => goto('hero')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <LogoMark size={34} />
              <span className="font-display font-black text-2xl tracking-widest leading-none">
                MACRO<span className="text-brown-light">STACK</span>
              </span>
            </button>

            <div className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map(({ label, id }) => (
                <button key={id} onClick={() => goto(id)}
                  className="font-display text-xs tracking-widest text-muted hover:text-cream transition-colors relative group">
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-brown transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={onGetStarted}
                className="font-display text-xs tracking-widest text-muted hover:text-cream transition-colors px-3 py-1.5">
                SIGN IN
              </button>
              <button onClick={onGetStarted}
                className="font-display font-bold text-xs tracking-widest bg-brown hover:bg-brown-light text-bg px-5 py-2 rounded-lg transition-all glow-brown-btn">
                GET STARTED
              </button>
            </div>

            <button className="md:hidden flex flex-col gap-1.5 p-1.5" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
              <span className={`block w-5 h-px bg-cream transition-all duration-300 ${menuOpen ? 'translate-y-2.5 rotate-45' : ''}`} />
              <span className={`block w-5 h-px bg-cream transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-5 h-px bg-cream transition-all duration-300 ${menuOpen ? '-translate-y-2.5 -rotate-45' : ''}`} />
            </button>
          </div>

          {/* Mobile dropdown · liquid glass */}
          <div
            className="md:hidden overflow-hidden transition-all duration-300"
            style={{
              maxHeight: menuOpen ? '360px' : '0',
              background: 'rgba(14,14,12,0.12)',
              backdropFilter: 'blur(22px) saturate(180%)',
              WebkitBackdropFilter: 'blur(22px) saturate(180%)',
              borderBottom: menuOpen ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}
          >
            <div className="px-5 py-4 border-t border-white/5 space-y-1">
              {NAV_LINKS.map(({ label, id }) => (
                <button key={id} onClick={() => goto(id)}
                  className="block w-full text-left font-display text-sm tracking-widest text-muted hover:text-cream py-2.5 transition-colors">
                  {label}
                </button>
              ))}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <button onClick={onGetStarted}
                  className="block w-full font-display font-bold text-sm tracking-widest bg-brown text-bg py-3 rounded-lg text-center">
                  GET STARTED FREE
                </button>
                <button onClick={onGetStarted}
                  className="glass-btn block w-full font-display text-sm tracking-widest text-muted py-3 rounded-lg text-center">
                  SIGN IN
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* ══ HERO ══════════════════════════════════ */}
        <section
          ref={sectionRefs.hero}
          className="relative min-h-screen flex items-center pt-14 overflow-hidden landing-grid landing-scan"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            setHeroMouse({
              x: (e.clientX - r.left) / r.width - 0.5,
              y: (e.clientY - r.top)  / r.height - 0.5,
            })
          }}
          onMouseLeave={() => setHeroMouse({ x: 0, y: 0 })}
        >
          {/* Parallax blobs — two-layer: outer handles translate+parallax, inner handles drift animation */}
          <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] pointer-events-none"
            style={{
              transform: `translate(-50%,-50%) translate(${heroMouse.x * 22}px, ${heroMouse.y * 22}px) translateY(${parallaxY * 0.6}px)`,
              transition: 'transform 1.4s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <div className="w-full h-full rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(154,123,85,0.07) 0%, transparent 65%)',
                animation: 'driftBlob 18s ease-in-out infinite',
              }}
            />
          </div>
          <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] pointer-events-none"
            style={{
              transform: `translate(${-heroMouse.x * 14}px, ${-heroMouse.y * 14}px) translateY(${parallaxY * 0.4}px)`,
              transition: 'transform 1.8s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <div className="w-full h-full rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(107,122,82,0.05) 0%, transparent 65%)',
                animation: 'driftBlob 22s ease-in-out infinite 4s',
              }}
            />
          </div>

          <div className="relative max-w-6xl mx-auto px-5 w-full py-24 lg:py-32">
            <div className="grid md:grid-cols-2 gap-14 lg:gap-20 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6"
                  style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(10px)', transition: 'opacity 0.5s ease 100ms, transform 0.5s ease 100ms' }}>
                  <span className="w-8 h-px bg-brown" style={{ animation: heroVisible ? 'heroLine 0.6s ease 200ms both' : 'none' }} />
                  <span className="font-mono text-xs tracking-widest text-brown">PRECISION NUTRITION PLATFORM</span>
                  <span className="font-mono text-xs text-dim animate-pulse">_</span>
                </div>

                <h1 className="font-display font-black leading-none tracking-wide mb-6" style={{ fontSize: 'clamp(3.2rem,7.5vw,5.5rem)' }}>
                  {['TRACK.', 'OPTIMIZE.', <span key="p" className="text-brown-light">PERFORM.</span>].map((word, i) => (
                    <div key={i} style={{
                      opacity: heroVisible ? 1 : 0,
                      transform: heroVisible ? 'none' : `translateY(72px) scale(0.88)`,
                      filter: heroVisible ? 'blur(0px)' : 'blur(12px)',
                      transition: [
                        `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${160 + i * 160}ms`,
                        `transform 0.85s cubic-bezier(0.16,1,0.3,1) ${160 + i * 160}ms`,
                        `filter 0.65s ease ${160 + i * 160}ms`,
                      ].join(', '),
                      display: 'block',
                    }}>
                      {word}
                    </div>
                  ))}
                </h1>

                <p className="font-mono text-sm text-muted leading-relaxed mb-8 max-w-md"
                  style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s ease 620ms, transform 0.6s ease 620ms' }}>
                  The nutrition OS for serious athletes and the coaches who guide them.
                  Precision macro tracking, real-time coaching tools, and AI-powered food data — all in one platform.
                </p>

                <div className="flex flex-wrap gap-3 mb-12"
                  style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s ease 760ms, transform 0.6s ease 760ms' }}>
                  <MagneticButton onClick={onGetStarted}
                    className="font-display font-bold text-sm tracking-widest bg-brown hover:bg-brown-light text-bg px-7 py-3.5 rounded-lg transition-all glow-brown-btn">
                    START FOR FREE →
                  </MagneticButton>
                  <MagneticButton onClick={onGetStarted}
                    className="glass-btn font-display font-bold text-sm tracking-widest text-muted px-7 py-3.5 rounded-lg">
                    SIGN IN
                  </MagneticButton>
                </div>

                {/* Stats strip · liquid glass pill */}
                <div
                  className="glass inline-flex flex-wrap gap-8 px-6 py-4 rounded-2xl"
                  style={{ opacity: heroVisible ? 1 : 0, transition: 'opacity 0.6s ease 900ms' }}
                >
                  {[
                    { to: FOOD_COUNT, suffix: '+', label: 'FOODS IN DB'  },
                    { to: 100,   suffix: '%', label: 'FREE TO START'},
                  ].map(({ to, suffix, label }) => (
                    <div key={label}>
                      <div className="font-display font-black text-3xl text-brown-light"><CountUp to={to} suffix={suffix} /></div>
                      <div className="font-mono text-xs text-muted tracking-widest mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden md:block">
                <TiltCard strength={4} glowColor="rgba(154,123,85,0.06)">
                  <HeroDashboard />
                </TiltCard>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            style={{ opacity: heroVisible ? 0.5 : 0, transition: 'opacity 0.6s ease 1200ms' }}>
            <span className="font-mono text-xs tracking-widest text-dim">SCROLL</span>
            <div className="w-px h-8 bg-gradient-to-b from-dim to-transparent" style={{ animation: 'float 2s ease-in-out infinite' }} />
          </div>
        </section>

        {/* ══ STATS TICKER · glass section ═════════ */}
        <section className="glass-section border-y border-white/5 py-12 overflow-hidden">
          <div className="max-w-6xl mx-auto px-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
              {[
                { to: FOOD_COUNT, suffix: '+',  label: 'FOODS IN DATABASE', delay: 0   },
                { to: 100,   suffix: '%', label: 'MACRO PRECISION',   delay: 150 },
                { to: 24,    suffix: '/7',label: 'ALWAYS AVAILABLE',  delay: 300 },
              ].map(({ to, suffix, label, delay }) => (
                <Reveal key={label} delay={delay} className="text-center">
                  {/* Each stat in its own glass pill */}
                  <div className="glass rounded-xl py-4 px-2">
                    <div className="font-display font-black text-4xl md:text-5xl text-brown-light">
                      <CountUp to={to} suffix={suffix} />
                    </div>
                    <div className="font-mono text-xs text-muted tracking-widest mt-2">{label}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES · glass cards ════════════════ */}
        <section ref={sectionRefs.features} className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 landing-grid opacity-50 pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-5">
            <Reveal className="text-center mb-16">
              <div className="w-8 h-px bg-brown/70 mb-3 mx-auto" style={{ animation: 'lineReveal 0.6s cubic-bezier(0.16,1,0.3,1) both' }} />
              <p className="font-mono text-xs tracking-widest text-brown mb-3">— WHAT WE OFFER —</p>
              <h2 className="font-display font-black tracking-wide" style={{ fontSize: 'clamp(2.5rem,6vw,4rem)' }}>
                <SplitReveal delay={200}>BUILT FOR</SplitReveal>
                <br/>
                <SplitReveal delay={400}>PERFORMANCE</SplitReveal>
              </h2>
              <p className="font-mono text-sm text-muted mt-4 max-w-lg mx-auto leading-relaxed">
                Three tools in one platform — everything an athlete or coach needs to operate at the highest level.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { symbol: '◎', glassClass: 'glass-warm',  glowColor: 'rgba(154,123,85,0.14)', iconBg: 'bg-brown/20',     iconBdr: 'border-brown/30',     iconTxt: 'text-brown-light',    tagCls: 'bg-brown/10 text-brown-light border-brown/20',          title: 'PRECISION TRACKING', desc: 'Log every meal with exact macros. Barcode scanner, custom foods, and AI-powered search mean no calorie goes unaccounted for.',                tags: ['BARCODE SCAN','CUSTOM FOODS','SEARCH'],         delay: 0   },
                { symbol: '↗', glassClass: 'glass-olive', glowColor: 'rgba(107,122,82,0.14)', iconBg: 'bg-olive/20',     iconBdr: 'border-olive/30',     iconTxt: 'text-olive-light',    tagCls: 'bg-olive/10 text-olive-light border-olive/20',          title: 'COACH CONNECT',      desc: 'Coaches manage unlimited users, set individual macro targets, monitor daily logs, and communicate in real time — one dashboard.',         tags: ['USER DASHBOARD','MACRO TARGETS','MESSAGING'], delay: 180 },
                { symbol: '✦', glassClass: 'glass-slate', glowColor: 'rgba(90,100,114,0.14)', iconBg: 'bg-slategray/20', iconBdr: 'border-slategray/30', iconTxt: 'text-slategray-light', tagCls: 'bg-slategray/10 text-slategray-light border-slategray/20', title: 'AI FOOD INTEL',      desc: 'Our AI identifies nutrition data for virtually any food — by name, brand, or description. No barcode required.',                             tags: ['ANY FOOD','INSTANT DATA','VERIFIED'],           delay: 360 },
              ].map(({ symbol, glassClass, glowColor, iconBg, iconBdr, iconTxt, tagCls, title, desc, tags, delay }) => (
                <Reveal key={title} delay={delay}>
                  <TiltCard className={`${glassClass} rounded-xl p-6 h-full`} strength={6} glowColor={glowColor}>
                    <div className={`w-11 h-11 rounded-xl ${iconBg} border ${iconBdr} flex items-center justify-center mb-5`}>
                      <span className={`${iconTxt} text-xl`}>{symbol}</span>
                    </div>
                    <h3 className="font-display font-black text-xl tracking-widest mb-3">{title}</h3>
                    <p className="font-mono text-sm text-muted leading-relaxed mb-5">{desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span key={tag} className={`glass font-mono text-xs px-2 py-0.5 rounded ${tagCls}`} style={{ border: 'none' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ MEET KAY ══════════════════════════════ */}
        <section ref={sectionRefs.kay} className="py-28 glass-section relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(154,123,85,0.07) 0%, transparent 65%)' }} />

          <div className="max-w-6xl mx-auto px-5">
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">

              {/* Left: avatar */}
              <Reveal x={-50} className="flex justify-center">
                <KayAvatar />
              </Reveal>

              {/* Right: copy */}
              <div>
                <Reveal>
                  <div className="w-8 h-px mb-3" style={{ background: 'var(--color-accent)' }} />
                  <p className="font-mono text-xs tracking-widest text-brown mb-3">— POWERED BY AI —</p>
                  <h2 className="font-display font-black leading-none tracking-wide mb-5" style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)' }}>
                    <SplitReveal delay={200}>MEET</SplitReveal>
                    <br/>
                    <SplitReveal delay={350} className="text-brown-light">KAY.</SplitReveal>
                  </h2>
                  <p className="font-mono text-sm text-muted leading-relaxed mb-8 max-w-md">
                    Kay is MacroStack's built-in AI nutrition expert — backed by {FOOD_COUNT.toLocaleString()}+ verified foods and nutrition science to give you instant, accurate answers about anything you eat.
                  </p>
                </Reveal>

                <div className="space-y-4">
                  {[
                    { sym: '✦', title: 'INSTANT FOOD IDENTIFICATION', desc: 'Describe any food in plain language. Kay identifies it and returns complete macro data in seconds — no barcode, no manual entry.' },
                    { sym: '◎', title: 'HIT YOUR REMAINING TARGETS', desc: 'Tell Kay how much protein or calories you have left. Get personalized meal suggestions that fit exactly where you stand.' },
                    { sym: '↗', title: 'RESEARCH-BACKED Q&A', desc: 'Ask anything — protein timing, food swaps, calorie estimates. Kay gives evidence-based answers drawn from nutrition science, available 24/7.' },
                    { sym: '■', title: 'COACH MEAL PLAN DRAFTING', desc: 'Coaches can deploy Kay to generate full meal plans automatically, tailored to each user\'s goals — saving hours every week.' },
                  ].map(({ sym, title, desc }, i) => (
                    <Reveal key={title} delay={i * 100}>
                      <div className="flex gap-4 group">
                        <div className="w-8 h-8 rounded-lg bg-brown/15 border border-brown/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-brown-light text-sm">{sym}</span>
                        </div>
                        <div>
                          <p className="font-display font-bold text-sm tracking-widest text-cream mb-0.5">{title}</p>
                          <p className="font-mono text-xs text-muted leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat preview */}
            <Reveal delay={150}>
              <KayChatPreview />
            </Reveal>
          </div>
        </section>

        {/* ══ FOR COACHES · glass section bg ═══════ */}
        <section ref={sectionRefs.coaches} className="py-28 glass-section relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle at 100% 0%, rgba(154,123,85,0.15) 0%, transparent 60%)' }} />

          <div className="max-w-6xl mx-auto px-5">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <Reveal>
                  <div className="w-8 h-px bg-brown/70 mb-3" />
                  <p className="font-mono text-xs tracking-widest text-brown mb-3">— FOR COACHES —</p>
                  <h2 className="font-display font-black leading-none tracking-wide mb-5" style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)' }}>
                    <SplitReveal delay={200}>MANAGE YOUR</SplitReveal>
                    <br/>
                    <SplitReveal delay={400} className="text-brown-light">ENTIRE ROSTER.</SplitReveal>
                  </h2>
                  <p className="font-mono text-sm text-muted leading-relaxed mb-8 max-w-md">
                    Everything you need to run a data-driven coaching practice.
                    Monitor users, set targets, and make adjustments in real time — from anywhere.
                  </p>
                </Reveal>

                <div className="space-y-4 mb-10">
                  {[
                    { title: 'USER DASHBOARD',    desc: 'See all users at a glance — who hit their targets, who needs attention, who messaged you today.' },
                    { title: 'CUSTOM TARGETS',    desc: 'Set individual calorie and macro goals for each user based on their body composition and objectives.' },
                    { title: 'REAL-TIME LOG VIEW',desc: "Watch any user's food log update as they track throughout the day — no waiting for weekly reports." },
                    { title: 'DIRECT MESSAGING',  desc: 'In-app coach-user messaging keeps all communication organized and searchable in one place.' },
                    { title: 'COACH CODE',        desc: 'Share your unique 6-digit code so new users link to you instantly when they sign up.' },
                  ].map(({ title, desc }, i) => (
                    <Reveal key={title} delay={i * 120}>
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
                  <MagneticButton onClick={onGetStarted}
                    className="font-display font-bold text-sm tracking-widest bg-brown hover:bg-brown-light text-bg px-7 py-3.5 rounded-lg transition-all glow-brown-btn">
                    START COACHING →
                  </MagneticButton>
                </Reveal>
              </div>
              <TiltCard strength={5} glowColor="rgba(154,123,85,0.09)">
                <CoachMockup />
              </TiltCard>
            </div>
          </div>
        </section>

        {/* ══ FOR CLIENTS ══════════════════════════ */}
        <section ref={sectionRefs.clients} className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 landing-grid opacity-40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle at 0% 100%, rgba(107,122,82,0.12) 0%, transparent 60%)' }} />

          <div className="max-w-6xl mx-auto px-5">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <TiltCard strength={5} glowColor="rgba(107,122,82,0.09)">
                  <ClientMockup />
                </TiltCard>
              </div>
              <div>
                <Reveal>
                  <div className="w-8 h-px bg-olive/70 mb-3" />
                  <p className="font-mono text-xs tracking-widest text-olive mb-3">— FOR USERS —</p>
                  <h2 className="font-display font-black leading-none tracking-wide mb-5" style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)' }}>
                    <SplitReveal delay={200}>FOLLOW YOUR</SplitReveal>
                    <br/>
                    <SplitReveal delay={400} className="text-olive-light">PERSONALIZED PLAN.</SplitReveal>
                  </h2>
                  <p className="font-mono text-sm text-muted leading-relaxed mb-8 max-w-md">
                    Your coach sets the targets. You log the food. MacroStack shows you exactly where you stand — every single day.
                  </p>
                </Reveal>

                <div className="space-y-4 mb-10">
                  {[
                    { title: 'PERSONALIZED TARGETS', desc: 'Calories and macros set specifically for your body composition, goals, and timeline by your coach.' },
                    { title: 'FAST FOOD LOGGING',    desc: `Search ${FOOD_COUNT.toLocaleString()}+ foods from 60+ restaurants and top brands, scan barcodes, or use AI to log any meal in under 10 seconds.` },
                    { title: 'WEIGHT TREND',         desc: 'Log your weight daily and watch a smooth trend line show your real progress over time.' },
                    { title: 'COACH MESSAGING',      desc: 'Direct line to your coach for questions, check-ins, or when you need a plan adjustment.' },
                    { title: 'DAILY PROGRESS',       desc: "See your calorie and macro breakdown in real time — no guessing if you're on track today." },
                  ].map(({ title, desc }, i) => (
                    <Reveal key={title} delay={i * 120}>
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
                  <MagneticButton onClick={onGetStarted}
                    className="font-display font-bold text-sm tracking-widest bg-olive hover:bg-olive-light text-bg px-7 py-3.5 rounded-lg transition-all glow-olive-btn">
                    JOIN AS A USER →
                  </MagneticButton>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ══ INDIVIDUALS · glass section + glass cards */}
        <section ref={sectionRefs.solo} className="py-28 glass-section relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(90,100,114,0.08) 0%, transparent 70%)' }} />

          <div className="max-w-6xl mx-auto px-5">
            <Reveal className="text-center mb-16">
              <div className="w-8 h-px bg-slategray/70 mb-3 mx-auto" />
              <p className="font-mono text-xs tracking-widest text-slategray-light mb-3">— FOR INDIVIDUALS —</p>
              <h2 className="font-display font-black tracking-wide leading-none" style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)' }}>
                <SplitReveal delay={200}>NO COACH?</SplitReveal>
                <br/>
                <SplitReveal delay={400} className="text-slategray-light">NO PROBLEM.</SplitReveal>
              </h2>
              <p className="font-mono text-sm text-muted mt-5 max-w-lg mx-auto leading-relaxed">
                MacroStack's full tracking suite is available to anyone who wants to take control of their nutrition independently.
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { sym: '◎', title: 'FULL FOOD DATABASE', desc: `${FOOD_COUNT.toLocaleString()}+ foods verified from 60+ restaurant chains, top supplement brands, and grocery staples. Search by name, brand, or barcode.`, delay: 0   },
                { sym: '✦', title: 'AI FOOD SEARCH',     desc: 'Describe any food and our AI returns accurate nutrition data instantly — no barcode, no problem.',                                   delay: 90  },
                { sym: '↑', title: 'WEIGHT TRACKING',    desc: 'Log your weight daily. Watch a trend line smooth out the noise and show your real trajectory.',                                     delay: 180 },
                { sym: '→', title: 'SET YOUR TARGETS',   desc: "Use the built-in macro calculator or enter custom goals. You're in complete control.",                                              delay: 270 },
                { sym: '■', title: 'CUSTOM FOODS',       desc: "Add any food that isn't in the database. Your entries are saved for fast re-use.",                                                  delay: 360 },
                { sym: '◆', title: 'UPGRADE ANYTIME',    desc: "Start solo and connect with a coach whenever you're ready. All your data transfers seamlessly.",                                    delay: 450 },
              ].map(({ sym, title, desc, delay }) => (
                <Reveal key={title} delay={delay}>
                  <TiltCard className="glass-slate rounded-xl p-5 h-full" strength={5} glowColor="rgba(90,100,114,0.14)">
                    <span className="text-slategray-light text-xl block mb-4">{sym}</span>
                    <h3 className="font-display font-bold text-sm tracking-widest mb-2 text-cream">{title}</h3>
                    <p className="font-mono text-xs text-muted leading-relaxed">{desc}</p>
                  </TiltCard>
                </Reveal>
              ))}
            </div>

            <Reveal delay={360} className="text-center mt-12">
              <MagneticButton onClick={onGetStarted}
                className="glass-btn font-display font-bold text-sm tracking-widest text-slategray-light px-7 py-3.5 rounded-lg">
                START TRACKING FREE →
              </MagneticButton>
            </Reveal>
          </div>
        </section>

        {/* ══ FINAL CTA ═════════════════════════════ */}
        <section className="py-36 relative overflow-hidden landing-grid landing-scan">
          <div className="absolute top-1/2 left-1/2 w-[900px] h-[500px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(154,123,85,0.1) 0%, transparent 65%)', transform: 'translate(-50%,-50%)' }} />

          <div className="relative max-w-2xl mx-auto px-5 text-center">
            <Reveal>
              <p className="font-mono text-xs tracking-widest text-brown mb-5 flex items-center justify-center gap-3">
                <span className="w-8 h-px bg-brown" /> READY TO START? <span className="w-8 h-px bg-brown" />
              </p>
              <h2 className="font-display font-black leading-none tracking-wide mb-6" style={{ fontSize: 'clamp(3rem,8vw,5.5rem)' }}>
                <SplitReveal delay={200}>YOUR MACROS</SplitReveal>
                <br/>
                <SplitReveal delay={400} className="text-brown-light">AWAIT.</SplitReveal>
              </h2>
              <p className="font-mono text-sm text-muted leading-relaxed mb-10 max-w-md mx-auto">
                Join athletes and coaches already using MacroStack to hit their targets every single day.
                It's free to start — no credit card required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <MagneticButton onClick={onGetStarted}
                  className="font-display font-bold text-base tracking-widest bg-brown hover:bg-brown-light text-bg px-9 py-4 rounded-lg transition-all glow-brown-btn">
                  GET STARTED FREE
                </MagneticButton>
                <MagneticButton onClick={onGetStarted}
                  className="glass-btn font-display font-bold text-base tracking-widest text-muted px-9 py-4 rounded-lg">
                  SIGN IN
                </MagneticButton>
              </div>

              {/* Trust signals · glass pill */}
              <div className="glass inline-flex flex-wrap justify-center gap-6 mt-10 px-6 py-3 rounded-2xl">
                {['FREE TO START', 'NO CREDIT CARD', 'COACH OR SOLO'].map(t => (
                  <span key={t} className="font-mono text-xs tracking-widest text-dim flex items-center gap-2">
                    <span className="text-brown/60">✓</span> {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ BLOG ══════════════════════════════════ */}
        <section className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 landing-grid opacity-40 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(154,123,85,0.06) 0%, transparent 65%)' }} />

          <div className="relative max-w-6xl mx-auto px-5">
            <Reveal className="text-center mb-14">
              <div className="w-8 h-px bg-brown/70 mb-3 mx-auto" />
              <p className="font-mono text-xs tracking-widest text-brown mb-3">— THE MACROSTACK BRIEF —</p>
              <h2 className="font-display font-black tracking-wide" style={{ fontSize: 'clamp(2.5rem,6vw,4rem)' }}>
                <SplitReveal delay={200}>SCIENCE MEETS</SplitReveal>
                <br/>
                <SplitReveal delay={400}>PRACTICE</SplitReveal>
              </h2>
              <p className="font-mono text-sm text-muted mt-4 max-w-lg mx-auto leading-relaxed">
                Evidence-based insights on nutrition, performance, and the research actually worth knowing about.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-6">

              {/* ── BLOG 1 ── */}
              <Reveal delay={0}>
                <TiltCard className="glass-warm rounded-2xl overflow-hidden h-full flex flex-col" strength={4} glowColor="rgba(154,123,85,0.13)">
                  {/* Header band */}
                  <div className="px-6 pt-6 pb-4 border-b border-brown/15">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-mono text-xs text-brown-light tracking-widest px-2 py-0.5 rounded glass-warm">PROTEIN</span>
                      <span className="font-mono text-xs text-muted">8 MIN READ</span>
                    </div>
                    <h3 className="font-display font-black text-xl tracking-wide leading-tight text-cream">
                      HOW MUCH PROTEIN DO YOU ACTUALLY NEED?
                    </h3>
                    <p className="font-mono text-xs text-muted mt-1">The science behind the 0.7g/lb myth — and the updated consensus</p>
                  </div>
                  {/* Body */}
                  <div className="px-6 py-5 flex-1 space-y-4">
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      For decades, the fitness industry anchored on 1g of protein per pound of bodyweight — a round number with surprisingly little precision science behind it. Recent meta-analyses have clarified the picture considerably.
                    </p>
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      A landmark 2018 meta-analysis in the <span className="text-cream italic">British Journal of Sports Medicine</span> (Morton et al.) pooled 49 studies and found that protein intakes above <span className="text-brown-light font-bold">~0.73g/lb (1.62g/kg)</span> of bodyweight produced no further gains in muscle mass or strength. Protein synthesis simply plateaus — excess is oxidized for energy.
                    </p>
                    <div className="glass rounded-xl p-4 space-y-2">
                      <p className="font-display font-bold text-xs tracking-widest text-brown-light">EVIDENCE-BASED TARGETS</p>
                      <div className="space-y-1.5">
                        {[
                          ['Sedentary adults',          '0.36 g/lb',  'RDA minimum'],
                          ['Recreational training',     '0.54–0.68 g/lb', 'Solid muscle support'],
                          ['Serious resistance athletes','0.64–0.82 g/lb', 'Maximized hypertrophy'],
                          ['Cutting (caloric deficit)',  '0.82–1.0 g/lb',  'Muscle preservation'],
                        ].map(([group, dose, note]) => (
                          <div key={group} className="flex items-start justify-between gap-2">
                            <span className="font-mono text-xs text-muted flex-1">{group}</span>
                            <div className="text-right flex-shrink-0">
                              <span className="font-display font-bold text-xs text-cream block">{dose}</span>
                              <span className="font-mono text-xs text-dim">{note}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      Critically, protein distribution matters almost as much as total intake. Research by Areta et al. (2013) showed that spreading protein across <span className="text-cream">4–5 meals of 20–40g</span> maximally stimulates muscle protein synthesis over 12 hours — a single large serving doesn't "catch up."
                    </p>
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      For older adults (50+), the muscle protein synthesis response to a given protein dose is blunted — a phenomenon called "anabolic resistance." Studies suggest targeting <span className="text-brown-light">~0.68–0.82g/lb</span> and prioritizing leucine-rich sources (whey, eggs, red meat) to overcome this threshold.
                    </p>
                  </div>
                  {/* Footer cite */}
                  <div className="px-6 pb-5 pt-2 border-t border-brown/10">
                    <p className="font-mono text-xs text-dim leading-relaxed">
                      Sources: Morton et al. (2018) BJSM · Stokes et al. (2018) Nutrients · Areta et al. (2013) J Physiol
                    </p>
                  </div>
                </TiltCard>
              </Reveal>

              {/* ── BLOG 2 ── */}
              <Reveal delay={180}>
                <TiltCard className="glass-olive rounded-2xl overflow-hidden h-full flex flex-col" strength={4} glowColor="rgba(107,122,82,0.13)">
                  <div className="px-6 pt-6 pb-4 border-b border-olive/15">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-mono text-xs text-olive-light tracking-widest px-2 py-0.5 rounded glass-olive">TRACKING</span>
                      <span className="font-mono text-xs text-muted">6 MIN READ</span>
                    </div>
                    <h3 className="font-display font-black text-xl tracking-wide leading-tight text-cream">
                      WHY CALORIE TRACKING WORKS — EVEN WHEN IT'S IMPRECISE
                    </h3>
                    <p className="font-mono text-xs text-muted mt-1">Self-monitoring as a behavioral intervention, backed by two decades of data</p>
                  </div>
                  <div className="px-6 py-5 flex-1 space-y-4">
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      A common objection to calorie counting is that food labels carry a federally-permitted error of up to <span className="text-cream">±20%</span>, restaurant meals vary wildly, and cooking methods alter caloric availability. So why does tracking consistently outperform non-tracking for fat loss?
                    </p>
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      The mechanism isn't absolute precision — it's <span className="text-olive-light font-bold">behavioral feedback loops</span>. A 2019 systematic review in <span className="text-cream italic">Obesity Reviews</span> covering 15 RCTs found that self-monitoring dietary intake was one of the strongest single predictors of weight-loss success, independent of the actual diet prescribed.
                    </p>
                    <div className="glass rounded-xl p-4 space-y-2">
                      <p className="font-display font-bold text-xs tracking-widest text-olive-light">KEY FINDINGS FROM THE RESEARCH</p>
                      <div className="space-y-2.5">
                        {[
                          { stat: '3–5×', detail: 'Greater fat loss in trackers vs. non-trackers (Burke et al., 2011)' },
                          { stat: '64%',  detail: 'Of successful long-term maintainers track food regularly (NWCR data)' },
                          { stat: '~10%', detail: 'Typical underestimation of intake by unassisted self-report' },
                          { stat: '+40%', detail: 'Adherence improvement when using digital logging vs. paper' },
                        ].map(({ stat, detail }) => (
                          <div key={stat} className="flex gap-3">
                            <span className="font-display font-black text-lg text-olive-light flex-shrink-0 leading-none mt-0.5">{stat}</span>
                            <span className="font-mono text-xs text-muted leading-relaxed">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      Consistency beats precision. Tracking 80% of meals accurately outperforms tracking 50% perfectly. The act of logging creates a "pause-and-log" friction that interrupts mindless eating — behavioral economics calls this an <span className="text-cream">implementation intention</span>.
                    </p>
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      The most consistent finding across weight-management literature: <span className="text-olive-light">frequency of logging correlates more strongly with outcomes than the accuracy of any individual entry.</span> Log often. Perfection is counterproductive.
                    </p>
                  </div>
                  <div className="px-6 pb-5 pt-2 border-t border-olive/10">
                    <p className="font-mono text-xs text-dim leading-relaxed">
                      Sources: Burke et al. (2011) JADA · Linardon & Mitchell (2017) Obesity Reviews · NWCR Long-Term Registry Data
                    </p>
                  </div>
                </TiltCard>
              </Reveal>

              {/* ── BLOG 3 ── */}
              <Reveal delay={360}>
                <TiltCard className="glass-slate rounded-2xl overflow-hidden h-full flex flex-col" strength={4} glowColor="rgba(90,100,114,0.13)">
                  <div className="px-6 pt-6 pb-4 border-b border-slategray/15">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-mono text-xs text-slategray-light tracking-widest px-2 py-0.5 rounded glass-slate">BODY COMPOSITION</span>
                      <span className="font-mono text-xs text-muted">7 MIN READ</span>
                    </div>
                    <h3 className="font-display font-black text-xl tracking-wide leading-tight text-cream">
                      THE BODY RECOMPOSITION DEBATE: CAN YOU GAIN MUSCLE AND LOSE FAT SIMULTANEOUSLY?
                    </h3>
                    <p className="font-mono text-xs text-muted mt-1">New research challenges the "bulk or cut" orthodoxy</p>
                  </div>
                  <div className="px-6 py-5 flex-1 space-y-4">
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      Traditional periodization dogma held that muscle gain requires a caloric surplus and fat loss requires a deficit — making simultaneous body recomposition (gaining muscle while losing fat) essentially impossible for trained athletes. The evidence has shifted substantially.
                    </p>
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      A 2020 review in <span className="text-cream italic">Frontiers in Physiology</span> confirmed that body recomposition is reliably achievable under specific conditions. The key variable isn't the overall calorie balance — it's <span className="text-slategray-light font-bold">protein intake and resistance training stimulus</span>.
                    </p>
                    <div className="glass rounded-xl p-4 space-y-3">
                      <p className="font-display font-bold text-xs tracking-widest text-slategray-light">CONDITIONS THAT ENABLE RECOMP</p>
                      {[
                        { label: 'Protein ≥ 0.73g/lb/day',     desc: 'Provides substrate for MPS regardless of energy balance' },
                        { label: 'Progressive resistance training', desc: '3–4x/week minimum; training stimulus drives muscle protein synthesis even in deficit' },
                        { label: 'Moderate deficit only (−250–400 kcal)', desc: 'Severe restriction accelerates muscle catabolism — blunts recomp potential' },
                        { label: 'Training status',              desc: 'Beginners and detrained individuals show highest recomp rates; advanced athletes are limited' },
                      ].map(({ label, desc }) => (
                        <div key={label} className="flex gap-2.5">
                          <span className="text-slategray-light mt-0.5 flex-shrink-0 text-xs">▸</span>
                          <div>
                            <p className="font-display font-bold text-xs text-cream tracking-wide">{label}</p>
                            <p className="font-mono text-xs text-muted">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      A practical 2022 study (Barakat et al.) tracked resistance-trained subjects over 8 weeks in a slight deficit with high protein (~0.9g/lb). Result: <span className="text-slategray-light">+1.1kg lean mass, −2.4kg fat mass</span> — simultaneous recomposition in trained individuals with precise macro control.
                    </p>
                    <p className="font-mono text-xs text-muted leading-relaxed">
                      The takeaway: body recomposition is real, but it's <span className="text-cream">highly sensitive to protein distribution and training consistency</span>. Tracking macros precisely — not just calories — is what separates recomposition outcomes from stalled progress.
                    </p>
                  </div>
                  <div className="px-6 pb-5 pt-2 border-t border-slategray/10">
                    <p className="font-mono text-xs text-dim leading-relaxed">
                      Sources: Barakat et al. (2020) Strength & Cond. J. · Longland et al. (2016) AJCN · Murphy et al. (2022) Front. Physiol.
                    </p>
                  </div>
                </TiltCard>
              </Reveal>

            </div>

            {/* Bottom note */}
            <Reveal delay={300} className="text-center mt-10">
              <p className="font-mono text-xs text-dim">
                Research summaries are for educational purposes. Individual results vary — work with a qualified coach for personalized guidance.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ══ FOOTER · glass section ════════════════ */}
        <footer className="glass-section border-t border-white/5 py-10">
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
                  <button key={id} onClick={() => goto(id)}
                    className="font-mono text-xs text-muted hover:text-cream tracking-widest transition-colors">
                    {label}
                  </button>
                ))}
              </div>

              <p className="font-mono text-xs text-dim">© 2026 MACROSTACK</p>
            </div>
          </div>
        </footer>

      </div>
    </ScrollRoot.Provider>
  )
}
