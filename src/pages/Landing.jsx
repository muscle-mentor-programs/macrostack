import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

// Dev-only handle for driving animations in headless verification
if (import.meta.env.DEV) window.__gsap = gsap

/* ── Theme tokens — landing inherits the app's active theme ──────────────────
   All colors come from the CSS custom properties the app's theme system sets
   (ocean/forest/default, dark/light). Accent shades and alphas are derived
   with color-mix so every theme renders its own correct palette.            */
const ACCENT       = 'var(--color-accent)'
const ACCENT_LIGHT = 'color-mix(in srgb, var(--color-accent) 72%, white)'
const ACCENT_DARK  = 'color-mix(in srgb, var(--color-accent) 70%, black)'
const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

/* Inverted section: the theme's cream as background, its bg as ink — keeps
   the dark/light alternation alive in every theme. */
const INVERT_BG   = 'var(--color-cream)'
const INVERT_INK  = 'var(--color-bg)'
const INVERT_SOFT = 'color-mix(in srgb, var(--color-bg) 62%, var(--color-cream))'

const ON_ACCENT = '#FFFFFF' /* accent is mid-tone in every theme — white reads on all */

/* ── Content data ─────────────────────────────────────────────────────────── */

const HERO_LINES = [
  { text: 'TRACK.',    accent: false },
  { text: 'OPTIMIZE.', accent: false },
  { text: 'PERFORM.',  accent: true  },
]

const STATEMENT =
  'Every gram counts. Every meal matters. This is nutrition engineered for performance.'

const STORY_STEPS = [
  {
    n: '01', tag: 'LOG', title: 'LOG MEALS IN SECONDS',
    body: 'Your most-logged foods surface first. One tap, macros counted. The fastest food log you have ever used.',
  },
  {
    n: '02', tag: 'SCAN', title: 'SCAN ANY BARCODE',
    body: 'Point your camera at a label and get instant, verified macros from a database of 1,900+ foods.',
  },
  {
    n: '03', tag: 'COACH', title: 'YOUR COACH SEES EVERYTHING',
    body: 'Daily intake, 7-day compliance, weight trends — live on your coach’s dashboard, with real-time messaging built in.',
  },
  {
    n: '04', tag: 'COMING SOON', title: 'MEET KAY — AI NUTRITIONIST',
    body: 'Kay is on the way: a built-in AI nutritionist that suggests meals to fit your remaining macros. Launching soon.',
  },
]

const STORY_PCTS = ['25%', '50%', '75%', '100%']

const CARDS = [
  { icon: '◎', title: 'PRECISION TRACKING', body: 'Exact macros for every meal. Custom foods, serving math, gram-level control.' },
  { icon: '▤', title: 'BARCODE SCANNER',    body: 'Instant nutrition data from any label. No typing, no guessing.' },
  { icon: '↗', title: 'COACH DASHBOARD',    body: 'Unlimited clients, individual targets, live compliance — one screen.' },
  { icon: '✦', title: 'KAY AI',             body: 'A nutrition expert in your pocket. Food intel and answers, 24/7.', soon: true },
  { icon: '▦', title: 'MEAL PLANS',         body: 'Coaches build day-by-day plans. Clients log a full meal with one tap.' },
  { icon: '◠', title: 'WEIGHT & TRENDS',    body: '7-day moving averages, calorie trends, consistency heatmaps.' },
]

const STATS = [
  { value: 1924, suffix: '+',  label: 'VERIFIED FOODS' },
  { value: 100,  suffix: '%',  label: 'FREE TO START'  },
  { value: 24,   suffix: '/7', label: 'COACH ACCESS'   },
]

/* Fill-vessel geometry (SVG user units). Bottom edge sits at y = VESSEL_BOTTOM;
   each story step fills one LAYER_H slab upward — animated via attr y/height. */
const VESSEL_BOTTOM = 320
const LAYER_H       = 70

/* ── Component ────────────────────────────────────────────────────────────── */

export default function Landing({ onGetStarted }) {
  const rootRef      = useRef(null)
  const progressRef  = useRef(null)
  const guidePathRef = useRef(null)
  const guideDotRef  = useRef(null)
  const fillRef      = useRef(null)
  const trackRef     = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    document.documentElement.classList.add('landing-mode')

    const mm = gsap.matchMedia(root)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root)

      /* ── 1. Smooth scroll foundation ── */
      const lenis = new Lenis({ lerp: 0.1 })
      window.lenis = lenis
      lenis.on('scroll', ScrollTrigger.update)
      const raf = (time) => lenis.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)

      /* ── 7c. Scroll progress bar ── */
      gsap.set(progressRef.current, { scaleX: 0, transformOrigin: 'left center' })
      gsap.to(progressRef.current, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: true },
      })

      /* ── 2. Hero intro — words rise line by line ── */
      gsap.fromTo(q('.hero-word'),
        { yPercent: 120 },
        { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: 0.15 })
      gsap.fromTo(q('.hero-sub'),
        { y: 26, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', delay: 0.7 })
      gsap.fromTo(q('.hero-ctas'),
        { y: 26, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', delay: 0.85 })
      gsap.to(q('.scroll-cue-dot'), {
        y: 9, repeat: -1, yoyo: true, duration: 0.7, ease: 'power1.inOut',
      })

      /* Hero recedes as you scroll past */
      gsap.to(q('.hero-inner'), {
        yPercent: 28, scale: 0.94, opacity: 0.1, ease: 'none',
        scrollTrigger: {
          trigger: q('.hero')[0], start: 'top top', end: 'bottom top', scrub: true,
        },
      })

      /* ── 3. Guide line — draws itself + glowing dot rides the tip ── */
      const path = guidePathRef.current
      const len  = path.getTotalLength()
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(path, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: {
          trigger: q('.guide-wrap')[0], start: 'top 70%', end: 'bottom 75%', scrub: true,
        },
      })
      gsap.to(guideDotRef.current, {
        ease: 'none',
        motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
        scrollTrigger: {
          trigger: q('.guide-wrap')[0], start: 'top 70%', end: 'bottom 75%', scrub: true,
        },
      })

      /* ── 4. Statement — words light up as scroll passes through ── */
      q('.stmt-word').forEach((w) => {
        gsap.fromTo(w, { opacity: 0.15 }, {
          opacity: 1, ease: 'none',
          scrollTrigger: { trigger: w, start: 'top 78%', end: 'top 55%', scrub: true },
        })
      })

      /* ── 5. Pinned story — steps crossfade while the vessel fills ── */
      const steps = q('.story-step')
      const pcts  = q('.story-pct')
      const layerLabels = q('.story-layer-label')
      gsap.set(steps.slice(1), { autoAlpha: 0, y: 30 })
      gsap.set(pcts.slice(1),  { autoAlpha: 0 })
      gsap.set(layerLabels.slice(1), { opacity: 0.2 })
      gsap.set(fillRef.current, {
        attr: { y: VESSEL_BOTTOM - LAYER_H, height: LAYER_H },
      })

      const storyTl = gsap.timeline({
        scrollTrigger: {
          trigger: q('.story')[0],
          start: 'top top',
          end: `+=${STORY_STEPS.length * 90}%`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      for (let i = 1; i < STORY_STEPS.length; i++) {
        storyTl
          .to(steps[i - 1], { autoAlpha: 0, y: -30, duration: 0.45 }, i)
          .fromTo(steps[i], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.45 }, i + 0.25)
          .to(pcts[i - 1],  { autoAlpha: 0, duration: 0.3 }, i)
          .to(pcts[i],      { autoAlpha: 1, duration: 0.3 }, i + 0.2)
          .to(layerLabels[i], { opacity: 1, duration: 0.4 }, i + 0.3)
          /* fill level — attr y/height, NOT scaleY (SVG transform quirks) */
          .to(fillRef.current, {
            attr: {
              y: VESSEL_BOTTOM - LAYER_H * (i + 1),
              height: LAYER_H * (i + 1),
            },
            duration: 0.9, ease: 'power1.inOut',
          }, i)
      }
      storyTl.to({}, { duration: 0.5 }) // hold the finished state briefly

      /* ── 6. Horizontal showcase ── */
      const track = trackRef.current
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: q('.showcase')[0],
          start: 'top top',
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      /* ── 7a. Stat counters — count up once ── */
      q('.stat-num').forEach((el) => {
        const target = parseFloat(el.dataset.value)
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target, duration: 1.8, ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-US') },
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        })
      })

      /* ── 6.5 Coaching section — staggered reveal on scroll ── */
      gsap.set(q('.coach-reveal'), { y: 28, autoAlpha: 0 })
      ScrollTrigger.batch(q('.coach-reveal'), {
        start: 'top 88%',
        onEnter: (els) => gsap.to(els, {
          y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1, overwrite: true,
        }),
      })

      /* ── 7b. CTA scales in with scrub ── */
      gsap.fromTo(q('.finale-cta'),
        { scale: 0.86, autoAlpha: 0.25 },
        {
          scale: 1, autoAlpha: 1, ease: 'none',
          scrollTrigger: {
            trigger: q('.finale-cta')[0], start: 'top 92%', end: 'top 58%', scrub: true,
          },
        })

      /* Pin-spacers change the document height AFTER Lenis measures it —
         re-sync Lenis dimensions on every ScrollTrigger refresh, then force
         one refresh now that all scenes exist. */
      const onRefresh = () => lenis.resize()
      ScrollTrigger.addEventListener('refresh', onRefresh)
      ScrollTrigger.refresh()

      return () => {
        ScrollTrigger.removeEventListener('refresh', onRefresh)
        gsap.ticker.remove(raf)
        lenis.destroy()
        delete window.lenis
      }
    })

    /* Reduced motion: no animation context registers — the page renders fully
       static and visible because every hidden state is set in JS, never CSS. */

    return () => {
      mm.revert()
      document.documentElement.classList.remove('landing-mode')
    }
  }, [])

  return (
    <div ref={rootRef} className="bg-bg text-cream font-mono antialiased">

      {/* ── Scroll progress bar ── */}
      <div
        ref={progressRef}
        className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none"
        style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_LIGHT})` }}
      />

      {/* ── Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 md:px-10 py-4 backdrop-blur-xl border-b border-border"
        style={{ background: 'color-mix(in srgb, var(--color-bg) 72%, transparent)' }}
      >
        <p className="font-display font-black text-lg tracking-widest text-cream">
          MACRO<span style={{ color: ACCENT }}>STACK</span>
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onGetStarted}
            className="font-display font-bold text-xs tracking-widest text-muted hover:text-cream transition-colors px-3 py-2"
          >
            SIGN IN
          </button>
          <button
            onClick={onGetStarted}
            className="font-display font-bold text-xs tracking-widest px-4 py-2 rounded-lg transition-all hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`, color: ON_ACCENT }}
          >
            GET STARTED
          </button>
        </div>
      </nav>

      {/* ══ 2. HERO ══════════════════════════════════════════════════════════ */}
      <section className="hero relative h-screen overflow-hidden flex items-center justify-center">
        {/* Radial brand glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 45% at 70% 20%, ${accentA(16)}, transparent 60%), radial-gradient(ellipse 50% 40% at 25% 80%, ${accentA(10)}, transparent 60%)`,
          }}
        />
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(${ACCENT} 1px, transparent 1px), linear-gradient(90deg, ${ACCENT} 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="hero-inner relative text-center px-6">
          <p className="font-mono text-[11px] md:text-xs tracking-[0.35em] text-muted mb-6">
            PRECISION NUTRITION PLATFORM
          </p>
          <h1 className="font-display font-black leading-[0.95] text-6xl md:text-8xl tracking-[0.06em] text-cream">
            {HERO_LINES.map(({ text, accent }) => (
              <span key={text} className="block overflow-hidden py-1">
                <span
                  className="hero-word block will-change-transform"
                  style={accent ? { color: ACCENT } : undefined}
                >
                  {text}
                </span>
              </span>
            ))}
          </h1>
          <p className="hero-sub max-w-md mx-auto mt-8 text-sm md:text-base leading-relaxed text-muted">
            The nutrition OS for serious athletes and the coaches who guide them.
            Macro tracking, coaching tools, and AI food intel — one platform.
          </p>
          <div className="hero-ctas flex items-center justify-center gap-4 mt-10">
            <button
              onClick={onGetStarted}
              className="font-display font-bold text-sm tracking-widest px-8 py-4 rounded-xl transition-all hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                boxShadow: `0 8px 32px ${accentA(35)}`,
                color: ON_ACCENT,
              }}
            >
              START FOR FREE →
            </button>
            <button
              onClick={onGetStarted}
              className="font-display font-bold text-sm tracking-widest text-cream px-6 py-4 rounded-xl border border-border hover:border-muted transition-colors"
            >
              SIGN IN
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
          <p className="font-mono text-[9px] tracking-[0.35em] text-muted opacity-70">SCROLL</p>
          <div className="w-[22px] h-[36px] rounded-full border border-border flex justify-center pt-2">
            <div className="scroll-cue-dot w-1 h-2 rounded-full" style={{ background: ACCENT }} />
          </div>
        </div>
      </section>

      {/* ══ 3+4. GUIDE LINE over STATEMENT (inverted theme section) ══════════ */}
      <div className="guide-wrap relative" style={{ background: INVERT_BG, color: INVERT_INK }}>
        {/* Weaving SVG guide line — behind content */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 2000"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            ref={guidePathRef}
            d="M 500 0 C 500 260, 160 330, 160 560 C 160 800, 840 760, 840 1010 C 840 1260, 200 1300, 320 1560 C 400 1740, 500 1800, 500 2000"
            style={{ stroke: ACCENT, strokeOpacity: 0.55 }}
            strokeWidth="2.5"
          />
          <circle ref={guideDotRef} r="7" style={{ fill: ACCENT }}>
            <animate attributeName="opacity" values="1;0.6;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Statement */}
        <section className="relative min-h-[120vh] flex items-center justify-center px-6 py-40">
          <p className="stmt max-w-3xl text-center font-display font-black text-4xl md:text-6xl leading-[1.15] tracking-wide">
            {STATEMENT.split(' ').map((w, i) => (
              <span key={i} className="stmt-word inline-block mr-[0.28em]">
                {w}
              </span>
            ))}
          </p>
        </section>

        {/* How-it-works intro */}
        <section className="relative px-6 pb-36 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px" style={{ background: accentA(60) }} />
            <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: INVERT_SOFT }}>
              HOW IT WORKS
            </p>
          </div>
          <h2 className="font-display font-black text-5xl md:text-7xl tracking-wide leading-[1.02]">
            FOUR STEPS TO
            <br />
            <span style={{ color: ACCENT }}>DIALED-IN</span> NUTRITION.
          </h2>
        </section>
      </div>

      {/* ══ 5. PINNED STORY (theme dark) ═════════════════════════════════════ */}
      <section className="story relative h-screen overflow-hidden bg-bg">
        <div className="h-full max-w-6xl mx-auto px-6 md:px-10 grid md:grid-cols-2 items-center gap-10 pt-16 md:pt-0">

          {/* Steps — stacked, crossfade */}
          <div className="relative h-64 md:h-72 order-2 md:order-1">
            {STORY_STEPS.map((s) => (
              <div key={s.n} className="story-step absolute inset-0 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display font-black text-5xl" style={{ color: accentA(33) }}>
                    {s.n}
                  </span>
                  <span
                    className="font-mono text-[10px] tracking-[0.3em] px-2.5 py-1 rounded-full border"
                    style={{ color: ACCENT, borderColor: accentA(27), background: accentA(7) }}
                  >
                    {s.tag}
                  </span>
                </div>
                <h3 className="font-display font-black text-3xl md:text-5xl tracking-wide leading-tight mb-4 text-cream">
                  {s.title}
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-muted max-w-md">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          {/* Vessel illustration — fill level animates via attr y/height */}
          <div className="flex justify-center order-1 md:order-2">
            <svg width="280" height="340" viewBox="0 0 320 360" className="max-h-[32vh] md:max-h-none w-auto">
              <defs>
                <clipPath id="vesselClip">
                  <rect x="80" y="40" width="160" height="280" rx="18" />
                </clipPath>
                <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: ACCENT_LIGHT }} />
                  <stop offset="100%" style={{ stopColor: 'var(--color-accent)' }} />
                </linearGradient>
              </defs>

              {/* Vessel outline */}
              <rect x="80" y="40" width="160" height="280" rx="18"
                style={{ stroke: accentA(40), fill: 'rgba(127,127,127,0.04)' }} strokeWidth="2" />

              {/* The fill — y/height animated, clipped to vessel */}
              <g clipPath="url(#vesselClip)">
                <rect
                  ref={fillRef}
                  x="80" y={VESSEL_BOTTOM - LAYER_H} width="160" height={LAYER_H}
                  fill="url(#fillGrad)" fillOpacity="0.88"
                />
                {[1, 2, 3].map((i) => (
                  <line
                    key={i}
                    x1="80" x2="240"
                    y1={VESSEL_BOTTOM - LAYER_H * i} y2={VESSEL_BOTTOM - LAYER_H * i}
                    style={{ stroke: 'var(--color-bg)' }} strokeOpacity="0.45" strokeWidth="2"
                  />
                ))}
              </g>

              {/* % readout — crossfades per step */}
              {STORY_PCTS.map((p) => (
                <text
                  key={p}
                  className="story-pct"
                  x="160" y="190"
                  textAnchor="middle"
                  style={{
                    fill: 'var(--color-cream)',
                    font: '900 44px "Barlow Condensed", sans-serif',
                    letterSpacing: '2px',
                  }}
                >
                  {p}
                </text>
              ))}

              {/* Layer labels light up as each fills */}
              {['PRO', 'CARB', 'FAT', 'KCAL'].map((label, i) => (
                <text
                  key={label}
                  className="story-layer-label"
                  x="252" y={VESSEL_BOTTOM - LAYER_H * i - LAYER_H / 2 + 5}
                  style={{
                    fill: 'var(--color-accent)',
                    font: '700 13px "Courier Prime", monospace',
                    letterSpacing: '2px',
                  }}
                >
                  {label}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* ══ 6. HORIZONTAL SHOWCASE (inverted theme section) ══════════════════ */}
      <section className="showcase relative h-screen overflow-hidden" style={{ background: INVERT_BG, color: INVERT_INK }}>
        <div className="pt-24 md:pt-28 px-6 md:px-10 max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px" style={{ background: accentA(60) }} />
            <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: INVERT_SOFT }}>
              THE PLATFORM
            </p>
          </div>
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-wide">
            EVERYTHING YOU NEED.
          </h2>
        </div>

        <div ref={trackRef} className="flex gap-5 md:gap-7 mt-12 md:mt-16 pl-6 md:pl-10 pr-10 w-max">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="w-[78vw] sm:w-[380px] md:w-[420px] flex-shrink-0 rounded-3xl p-8 md:p-10 backdrop-blur-sm"
              style={{
                background: 'color-mix(in srgb, var(--color-cream) 40%, rgba(255,255,255,0.45))',
                border: '1px solid color-mix(in srgb, var(--color-bg) 12%, transparent)',
                boxShadow: '0 8px 40px color-mix(in srgb, var(--color-bg) 10%, transparent)',
              }}
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl" style={{ color: ACCENT }}>{c.icon}</span>
                {c.soon && (
                  <span
                    className="font-mono text-[9px] tracking-[0.25em] px-2.5 py-1 rounded-full border"
                    style={{ color: ACCENT, borderColor: accentA(35), background: accentA(8) }}
                  >
                    COMING SOON
                  </span>
                )}
              </div>
              <h3 className="font-display font-black text-2xl md:text-3xl tracking-wide mt-6 mb-3">
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: INVERT_SOFT }}>{c.body}</p>
            </div>
          ))}
          {/* View-all card */}
          <button
            onClick={onGetStarted}
            className="w-[78vw] sm:w-[380px] md:w-[420px] flex-shrink-0 rounded-3xl p-8 md:p-10 text-left flex flex-col justify-between transition-all hover:brightness-110"
            style={{
              background: `linear-gradient(150deg, ${ACCENT}, ${ACCENT_DARK})`,
              boxShadow: `0 12px 48px ${accentA(35)}`,
              color: ON_ACCENT,
            }}
          >
            <span className="text-4xl">→</span>
            <div>
              <h3 className="font-display font-black text-3xl md:text-4xl tracking-wide">
                SEE IT ALL.
                <br />
                FREE.
              </h3>
              <p className="font-mono text-xs tracking-[0.25em] mt-4" style={{ opacity: 0.75 }}>
                CREATE YOUR ACCOUNT →
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* ══ 6.5 COACHING — work with Branden ═════════════════════════════════ */}
      <section className="relative bg-bg px-6 pt-28 pb-8 overflow-hidden">
        {/* ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${accentA(12)}, transparent 65%)` }}
        />
        <div className="relative max-w-3xl mx-auto">
          {/* Heading */}
          <div className="coach-reveal text-center mb-3">
            <div className="flex items-center gap-2 justify-center mb-4">
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">NUTRITION COACHING</p>
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
            </div>
            <h2 className="font-display font-black text-4xl md:text-6xl tracking-wide leading-[1.05] text-cream">
              COACHING THAT ACTUALLY
              <br />
              <span style={{ color: ACCENT }}>KEEPS UP</span> WITH YOU.
            </h2>
          </div>

          <p className="coach-reveal max-w-xl mx-auto text-center text-sm md:text-base leading-relaxed text-muted mt-6">
            Most people don't need more information. They need someone watching the numbers
            with them and adjusting before things stall.
          </p>
          <p className="coach-reveal max-w-xl mx-auto text-center text-sm md:text-base leading-relaxed text-muted mt-4">
            That's what this is. I build your nutrition, you log it, I check it every week and
            we course-correct. You also get my training app to handle the lifting side.
          </p>

          {/* Price */}
          <div className="coach-reveal flex flex-col items-center mt-10 mb-10">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-6xl md:text-7xl text-cream">$400</span>
              <span className="font-mono text-sm text-muted">/ month</span>
            </div>
            <p className="font-mono text-xs text-muted mt-3 max-w-xs text-center leading-relaxed">
              Month to month. No setup fee, no separate app subscriptions to deal with.
            </p>
          </div>

          {/* Two pillars */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {/* MacroStack */}
            <div className="coach-reveal glass-card border border-border rounded-2xl p-6 card-dim">
              <div className="flex items-center justify-between mb-1">
                <p className="font-display font-black text-xl tracking-wide text-cream">
                  MACRO<span style={{ color: ACCENT }}>STACK</span>
                </p>
              </div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted mb-4">WHERE WE RUN YOUR NUTRITION</p>
              <p className="text-sm leading-relaxed text-muted mb-3">
                I build your meal plan around your goal, your schedule, and the food you'll
                actually eat. You log it in the app the same way you would in MyFitnessPal,
                except I'm on the other end looking at it.
              </p>
              <p className="text-sm leading-relaxed text-muted">
                When the scale or the mirror says something needs to change, I change it.
                That's the whole point of paying for a coach instead of downloading a free tracker.
              </p>
            </div>

            {/* Muscle Mentor */}
            <div className="coach-reveal glass-card border border-border rounded-2xl p-6 card-dim">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-display font-black text-xl tracking-wide text-cream">MUSCLE MENTOR</p>
                <span
                  className="font-mono text-[9px] tracking-[0.2em] px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ color: ACCENT, background: accentA(12), border: `1px solid ${accentA(28)}` }}
                >
                  INCLUDED
                </span>
              </div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted mb-4">YOUR TRAINING, HANDLED</p>
              <p className="text-sm leading-relaxed text-muted mb-3">
                You get full access to my training app at no extra charge. Pick a mesocycle
                that fits where you're at and run it. If something doesn't make sense or you're
                not sure how to scale it, message me and I'll sort it out.
              </p>
              <p className="text-sm leading-relaxed text-muted">
                I'd rather you follow programming that's already proven than chase a custom
                plan that looks impressive and goes nowhere.
              </p>
            </div>
          </div>

          {/* Who it's for */}
          <p className="coach-reveal max-w-xl mx-auto text-center text-sm md:text-base leading-relaxed text-muted mt-10">
            This is built for people who already know the basics but can't stay consistent on
            their own. If that's you, the weekly check-ins are the thing that finally makes it
            stick.
          </p>

          {/* CTA */}
          <div className="coach-reveal mt-8 rounded-2xl border p-6 md:p-8 text-center"
            style={{ borderColor: accentA(35), background: accentA(6) }}>
            <p className="font-display font-bold text-lg md:text-xl tracking-wide text-cream mb-1">
              Want to talk through whether it's a fit?
            </p>
            <p className="font-mono text-xs text-muted mb-5 max-w-md mx-auto leading-relaxed">
              Reach out and I'll get you set up with a unique coach code to link your account to me.
            </p>
            <a
              href="mailto:musclementorprograms@gmail.com?subject=Nutrition%20Coaching"
              className="inline-block font-display font-bold text-sm tracking-widest px-8 py-4 rounded-xl transition-all hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                boxShadow: `0 8px 32px ${accentA(35)}`,
                color: ON_ACCENT,
              }}
            >
              musclementorprograms@gmail.com
            </a>
          </div>

          {/* Fine print */}
          <p className="coach-reveal text-center font-mono text-[10px] text-dim mt-6 leading-relaxed max-w-md mx-auto">
            Training app access comes with active coaching and ends when coaching does. Rate good for 2026.
          </p>
        </div>
      </section>

      {/* ══ 7. FINALE (theme dark) ═══════════════════════════════════════════ */}
      <section className="relative bg-bg px-6 pt-20 pb-24">
        {/* Stats */}
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 md:gap-12 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-display font-black text-4xl md:text-7xl" style={{ color: ACCENT }}>
                <span className="stat-num" data-value={s.value}>0</span>
                <span>{s.suffix}</span>
              </p>
              <p className="font-mono text-[9px] md:text-xs tracking-[0.3em] text-muted mt-2">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="finale-cta max-w-3xl mx-auto text-center mt-36 mb-12">
          <h2 className="font-display font-black text-5xl md:text-8xl tracking-wide leading-[0.98] text-cream">
            START
            <br />
            <span style={{ color: ACCENT }}>STACKING.</span>
          </h2>
          <p className="text-sm md:text-base text-muted mt-6 max-w-md mx-auto">
            Free to start. No credit card. Your coach — or your goals — are waiting.
          </p>
          <button
            onClick={onGetStarted}
            className="font-display font-bold text-base tracking-widest px-10 py-5 rounded-2xl mt-10 transition-all hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
              boxShadow: `0 12px 48px ${accentA(40)}`,
              color: ON_ACCENT,
            }}
          >
            GET STARTED FREE →
          </button>
        </div>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto mt-24 pt-8 border-t border-border flex items-center justify-between">
          <p className="font-display font-black text-sm tracking-widest text-cream">
            MACRO<span style={{ color: ACCENT }}>STACK</span>
          </p>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted opacity-70">
            NUTRITION OS · {new Date().getFullYear()}
          </p>
        </footer>
      </section>
    </div>
  )
}
