import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

// Dev-only handle for driving animations in headless verification
if (import.meta.env.DEV) window.__gsap = gsap

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
    n: '04', tag: 'ADAPT', title: 'KAY FILLS THE GAPS',
    body: 'Tell Kay, the built-in AI nutritionist, what macros you have left. Get meal suggestions that fit exactly.',
  },
]

const STORY_PCTS = ['25%', '50%', '75%', '100%']

const CARDS = [
  { icon: '◎', title: 'PRECISION TRACKING', body: 'Exact macros for every meal. Custom foods, serving math, gram-level control.' },
  { icon: '▤', title: 'BARCODE SCANNER',    body: 'Instant nutrition data from any label. No typing, no guessing.' },
  { icon: '↗', title: 'COACH DASHBOARD',    body: 'Unlimited clients, individual targets, live compliance — one screen.' },
  { icon: '✦', title: 'KAY AI',             body: 'A nutrition expert in your pocket. Food intel and answers, 24/7.' },
  { icon: '▦', title: 'MEAL PLANS',         body: 'Coaches build day-by-day plans. Clients log a full meal with one tap.' },
  { icon: '◠', title: 'WEIGHT & TRENDS',    body: '7-day moving averages, calorie trends, consistency heatmaps.' },
]

const STATS = [
  { value: 1924, suffix: '+',  label: 'VERIFIED FOODS' },
  { value: 100,  suffix: '%',  label: 'FREE TO START'  },
  { value: 24,   suffix: '/7', label: 'KAY AVAILABLE'  },
]

const ACCENT = '#9A7B55'

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
    <div ref={rootRef} className="bg-[#0A0A09] text-[#E8E4DC] font-mono antialiased">

      {/* ── Scroll progress bar ── */}
      <div
        ref={progressRef}
        className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none"
        style={{ background: `linear-gradient(90deg, ${ACCENT}, #C8A468)` }}
      />

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 md:px-10 py-4 bg-[#0A0A09]/70 backdrop-blur-xl border-b border-white/[0.06]">
        <p className="font-display font-black text-lg tracking-widest">
          MACRO<span style={{ color: ACCENT }}>STACK</span>
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onGetStarted}
            className="font-display font-bold text-xs tracking-widest text-[#7A756E] hover:text-[#E8E4DC] transition-colors px-3 py-2"
          >
            SIGN IN
          </button>
          <button
            onClick={onGetStarted}
            className="font-display font-bold text-xs tracking-widest text-[#0A0A09] px-4 py-2 rounded-lg transition-all hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #B89060)` }}
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
            background: `radial-gradient(ellipse 60% 45% at 70% 20%, rgba(154,123,85,0.16), transparent 60%), radial-gradient(ellipse 50% 40% at 25% 80%, rgba(154,123,85,0.10), transparent 60%)`,
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
          <p className="font-mono text-[11px] md:text-xs tracking-[0.35em] text-[#7A756E] mb-6">
            PRECISION NUTRITION PLATFORM
          </p>
          <h1 className="font-display font-black leading-[0.95] text-6xl md:text-8xl tracking-[0.06em]">
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
          <p className="hero-sub max-w-md mx-auto mt-8 text-sm md:text-base leading-relaxed text-[#9B968E]">
            The nutrition OS for serious athletes and the coaches who guide them.
            Macro tracking, coaching tools, and AI food intel — one platform.
          </p>
          <div className="hero-ctas flex items-center justify-center gap-4 mt-10">
            <button
              onClick={onGetStarted}
              className="font-display font-bold text-sm tracking-widest text-[#0A0A09] px-8 py-4 rounded-xl transition-all hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, #B89060)`,
                boxShadow: '0 8px 32px rgba(154,123,85,0.35)',
              }}
            >
              START FOR FREE →
            </button>
            <button
              onClick={onGetStarted}
              className="font-display font-bold text-sm tracking-widest text-[#E8E4DC] px-6 py-4 rounded-xl border border-white/15 hover:border-white/40 transition-colors"
            >
              SIGN IN
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
          <p className="font-mono text-[9px] tracking-[0.35em] text-[#5A554E]">SCROLL</p>
          <div className="w-[22px] h-[36px] rounded-full border border-white/20 flex justify-center pt-2">
            <div className="scroll-cue-dot w-1 h-2 rounded-full" style={{ background: ACCENT }} />
          </div>
        </div>
      </section>

      {/* ══ 3+4. GUIDE LINE over STATEMENT (light) ═══════════════════════════ */}
      <div className="guide-wrap relative bg-[#F5F1EB] text-[#161310]">
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
            stroke={ACCENT}
            strokeOpacity="0.55"
            strokeWidth="2.5"
          />
          <circle ref={guideDotRef} r="7" fill={ACCENT}>
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
            <span className="w-8 h-px" style={{ background: `${ACCENT}99` }} />
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#8A8378]">HOW IT WORKS</p>
          </div>
          <h2 className="font-display font-black text-5xl md:text-7xl tracking-wide leading-[1.02]">
            FOUR STEPS TO
            <br />
            <span style={{ color: ACCENT }}>DIALED-IN</span> NUTRITION.
          </h2>
        </section>
      </div>

      {/* ══ 5. PINNED STORY (dark) ═══════════════════════════════════════════ */}
      <section className="story relative h-screen overflow-hidden bg-[#0A0A09]">
        <div className="h-full max-w-6xl mx-auto px-6 md:px-10 grid md:grid-cols-2 items-center gap-10 pt-16 md:pt-0">

          {/* Steps — stacked, crossfade */}
          <div className="relative h-64 md:h-72 order-2 md:order-1">
            {STORY_STEPS.map((s) => (
              <div key={s.n} className="story-step absolute inset-0 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display font-black text-5xl" style={{ color: `${ACCENT}55` }}>
                    {s.n}
                  </span>
                  <span
                    className="font-mono text-[10px] tracking-[0.3em] px-2.5 py-1 rounded-full border"
                    style={{ color: ACCENT, borderColor: `${ACCENT}44`, background: `${ACCENT}11` }}
                  >
                    {s.tag}
                  </span>
                </div>
                <h3 className="font-display font-black text-3xl md:text-5xl tracking-wide leading-tight mb-4">
                  {s.title}
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-[#9B968E] max-w-md">
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
                  <stop offset="0%" stopColor="#C8A468" />
                  <stop offset="100%" stopColor={ACCENT} />
                </linearGradient>
              </defs>

              {/* Vessel outline */}
              <rect x="80" y="40" width="160" height="280" rx="18"
                stroke={`${ACCENT}66`} strokeWidth="2" fill="rgba(255,255,255,0.02)" />

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
                    stroke="#0A0A09" strokeOpacity="0.45" strokeWidth="2"
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
                  fill="#E8E4DC"
                  style={{ font: '900 44px "Barlow Condensed", sans-serif', letterSpacing: '2px' }}
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
                  fill={ACCENT}
                  style={{ font: '700 13px "Courier Prime", monospace', letterSpacing: '2px' }}
                >
                  {label}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* ══ 6. HORIZONTAL SHOWCASE (light) ═══════════════════════════════════ */}
      <section className="showcase relative h-screen overflow-hidden bg-[#F5F1EB] text-[#161310]">
        <div className="pt-24 md:pt-28 px-6 md:px-10 max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px" style={{ background: `${ACCENT}99` }} />
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#8A8378]">THE PLATFORM</p>
          </div>
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-wide">
            EVERYTHING YOU NEED.
          </h2>
        </div>

        <div ref={trackRef} className="flex gap-5 md:gap-7 mt-12 md:mt-16 pl-6 md:pl-10 pr-10 w-max">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="w-[78vw] sm:w-[380px] md:w-[420px] flex-shrink-0 rounded-3xl border border-[#161310]/10 bg-white/60 p-8 md:p-10 backdrop-blur-sm"
              style={{ boxShadow: '0 8px 40px rgba(22,19,16,0.08)' }}
            >
              <span className="text-4xl" style={{ color: ACCENT }}>{c.icon}</span>
              <h3 className="font-display font-black text-2xl md:text-3xl tracking-wide mt-6 mb-3">
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#5A544C]">{c.body}</p>
            </div>
          ))}
          {/* View-all card */}
          <button
            onClick={onGetStarted}
            className="w-[78vw] sm:w-[380px] md:w-[420px] flex-shrink-0 rounded-3xl p-8 md:p-10 text-left flex flex-col justify-between transition-all hover:brightness-110"
            style={{
              background: `linear-gradient(150deg, ${ACCENT}, #7A5F3E)`,
              boxShadow: '0 12px 48px rgba(154,123,85,0.35)',
            }}
          >
            <span className="text-4xl text-[#F5F1EB]">→</span>
            <div>
              <h3 className="font-display font-black text-3xl md:text-4xl tracking-wide text-[#F5F1EB]">
                SEE IT ALL.
                <br />
                FREE.
              </h3>
              <p className="font-mono text-xs tracking-[0.25em] text-[#F5F1EB]/70 mt-4">
                CREATE YOUR ACCOUNT →
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* ══ 7. FINALE (dark) ═════════════════════════════════════════════════ */}
      <section className="relative bg-[#0A0A09] px-6 pt-32 pb-24">
        {/* Stats */}
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 md:gap-12 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-display font-black text-4xl md:text-7xl" style={{ color: ACCENT }}>
                <span className="stat-num" data-value={s.value}>0</span>
                <span>{s.suffix}</span>
              </p>
              <p className="font-mono text-[9px] md:text-xs tracking-[0.3em] text-[#7A756E] mt-2">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="finale-cta max-w-3xl mx-auto text-center mt-36 mb-12">
          <h2 className="font-display font-black text-5xl md:text-8xl tracking-wide leading-[0.98]">
            START
            <br />
            <span style={{ color: ACCENT }}>STACKING.</span>
          </h2>
          <p className="text-sm md:text-base text-[#9B968E] mt-6 max-w-md mx-auto">
            Free to start. No credit card. Your coach — or your goals — are waiting.
          </p>
          <button
            onClick={onGetStarted}
            className="font-display font-bold text-base tracking-widest text-[#0A0A09] px-10 py-5 rounded-2xl mt-10 transition-all hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #B89060)`,
              boxShadow: '0 12px 48px rgba(154,123,85,0.4)',
            }}
          >
            GET STARTED FREE →
          </button>
        </div>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto mt-24 pt-8 border-t border-white/[0.06] flex items-center justify-between">
          <p className="font-display font-black text-sm tracking-widest">
            MACRO<span style={{ color: ACCENT }}>STACK</span>
          </p>
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#5A554E]">
            NUTRITION OS · {new Date().getFullYear()}
          </p>
        </footer>
      </section>
    </div>
  )
}
