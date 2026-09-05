import { useLayoutEffect, useRef } from 'react'
import { Smartphone, Share, PlusSquare, Sun, Moon } from 'lucide-react'
import useStore from '../store'
import { splatToggleTheme } from '../lib/themeSplat'
import { FOOD_COUNT } from '../data/foodCount'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Landing.css'

gsap.registerPlugin(ScrollTrigger)

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
const INVERT_BG     = 'var(--land-invert-bg)'
const INVERT_INK    = 'var(--land-invert-ink)'
const INVERT_SOFT   = 'var(--land-invert-soft)'
const INVERT_CARD   = 'var(--land-invert-card)'
const INVERT_BORDER = '1px solid var(--land-invert-border)'
const INVERT_SHADOW = 'var(--land-invert-shadow)'

const ON_ACCENT = '#FFFFFF' /* accent is mid-tone in every theme — white reads on all */

/* ── Content data ─────────────────────────────────────────────────────────── */

/* In-page nav targets (section ids set on the landing sections below). */
const NAV_LINKS = [
  { id: 'features', label: 'FEATURES' },
  { id: 'app',      label: 'THE APP'  },
  { id: 'pricing',  label: 'PRICING'  },
  { id: 'coach',    label: 'COACHES'  },
]

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
    body: 'Point your camera at a label and get instant, verified macros from a database of 15,000+ foods.',
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


const CARDS = [
  { icon: '◎', title: 'PRECISION TRACKING', body: 'Exact macros for every meal. Custom foods, serving math, gram-level control.' },
  { icon: '▤', title: 'BARCODE SCANNER',    body: 'Instant nutrition data from any label. No typing, no guessing.' },
  { icon: '↗', title: 'COACH DASHBOARD',    body: 'Unlimited clients, individual targets, live compliance — one screen.' },
  { icon: '✦', title: 'KAY AI',             body: 'A nutrition expert in your pocket. Food intel and answers, 24/7.', soon: true },
  { icon: '▦', title: 'MEAL PLANS',         body: 'Coaches build day-by-day plans. Clients log a full meal with one tap.' },
  { icon: '◠', title: 'WEIGHT & TRENDS',    body: '7-day moving averages, calorie trends, consistency heatmaps.' },
]

const STATS = [
  // FOOD_COUNT is auto-generated at build time (scripts/gen-food-count.mjs),
  // so this stat always matches the real database size.
  { value: FOOD_COUNT, suffix: '+',  label: 'VERIFIED FOODS' },
  { value: 100,        suffix: '%',  label: 'FREE TO START'  },
  { value: 24,         suffix: '/7', label: 'COACH ACCESS'   },
]

/* MacroStack Pro billing options — same Pro features, three cadences.
   Display prices; Stripe is the source of truth at checkout. */
const PRO_PLANS = [
  { id: 'weekly',  name: 'WEEKLY',  price: '5.95',  unit: '/wk', note: 'Billed weekly' },
  { id: 'monthly', name: 'MONTHLY', price: '9.95',  unit: '/mo', note: 'Billed monthly', tag: 'POPULAR' },
  { id: 'annual',  name: 'ANNUAL',  price: '89.95', unit: '/yr', note: '≈ $7.50/mo · save 25%', tag: 'BEST VALUE', best: true },
]

/* What Pro unlocks on top of the always-free core. */
const PRO_FEATURES = [
  'Barcode scanner — instant macros from any label',
  'Weight trends & 7-day moving averages',
  'Calorie history & consistency insights',
  'Everything in Free — unlimited logging, 15,000+ foods, custom foods',
]

/* MacroStack Coach — tiered by active client count. `plan` matches the tier
   keys in UpgradePage / the create-checkout-session edge function, so a click
   here carries through signup straight into Stripe checkout. */
const COACH_TIERS = [
  { range: '1 client',        price: 'Free',    unit: 'forever',  tag: 'START FREE', plan: null },
  { range: '2–10 clients',    price: '$19.95',  unit: '/mo',                         plan: 't_2_10' },
  { range: '11–30 clients',   price: '$39.95',  unit: '/mo', tag: 'POPULAR',         plan: 't_11_30' },
  { range: '31–60 clients',   price: '$59.95',  unit: '/mo',                         plan: 't_31_60' },
  { range: '61–120 clients',  price: '$89.95',  unit: '/mo',                         plan: 't_61_120' },
  { range: '121+ clients',    price: '$139.95', unit: '/mo', tag: 'UNLIMITED SCALE', plan: 't_121_plus' },
]

/* Remember which plan was clicked on the landing page so the app can open the
   Upgrade page with it preselected right after signup/login. */
export const PENDING_PLAN_KEY = 'ms-pending-plan'
function rememberPlan(audience, plan) {
  try { localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify({ audience, plan })) } catch { /* private mode */ }
}
function clearPlan() {
  try { localStorage.removeItem(PENDING_PLAN_KEY) } catch { /* private mode */ }
}

/* Everything a coach gets. (A few are on the near-term roadmap — we build them next.) */
const COACH_FEATURES = [
  { t: 'Live client dashboard',      d: 'Every client’s daily intake, macros, and 7-day compliance at a glance.' },
  { t: 'AI meal-plan builder',       d: 'Build day-by-day custom plans in seconds — clients log them in one tap.' },
  { t: 'Real-time messaging',        d: 'Direct in-app chat with every client, with read receipts and unread badges.' },
  { t: 'Weekly check-ins',           d: 'Clients submit weight, adherence & notes — AI summarizes so you review in seconds.' },
  { t: 'Macro targets & auto-adjust',d: 'Set each client’s calorie & macro goals; get nudges to adjust as progress dictates.' },
  { t: 'Progress & photos',          d: 'Weight trends, compliance streaks, and progress-photo timelines over time.' },
  { t: 'Automated reminders',        d: 'Auto-nudge clients to log meals and submit check-ins — hands-off.' },
  { t: 'Pro included for every client', d: 'Everyone on your roster gets the full Pro app — barcode scanner, trends, analytics — at no extra cost to them.' },
  { t: 'Client mobile app',          d: 'Your clients get a fast, installable app to log meals and scan barcodes.' },
  { t: 'Your brand, front & center', d: 'A coach profile clients see — credentials, bio, specialties, and your links.' },
]

/* Product mockups — large phones alternate left/right beside feature copy as
   you scroll. Files live in public/mockups/. */
const APP_SHOWCASE = [
  { src: '/mockups/app-home.png',   eyebrow: 'YOUR DAY',  title: 'EVERY GRAM, AT A GLANCE',  body: 'Calories, macros, and your streak the second you open the app — no digging required.' },
  { src: '/mockups/app-search.png', eyebrow: 'LOG FAST',  title: '15,000+ FOODS, ONE TAP',    body: 'Search the database or scan any barcode for verified macros. Your go-to foods surface first.' },
  { src: '/mockups/app-weight.png', eyebrow: 'PROGRESS',  title: 'WATCH THE REAL TREND',     body: '7-day moving averages cut the daily scale noise so you see actual change, not water weight.' },
  { src: '/mockups/app-chat.png',   eyebrow: 'COACHING',  title: 'YOUR COACH, ONE TAP AWAY', body: 'Message your coach and submit weekly check-ins right inside the app.' },
]
const COACH_SHOWCASE = [
  { src: '/mockups/coach-dashboard.png', eyebrow: 'DASHBOARD', title: 'YOUR ROSTER, LIVE',      body: "Every client's intake, compliance, and streaks on one screen — spot who's on track in seconds." },
  { src: '/mockups/coach-users.png',     eyebrow: 'USERS',     title: 'EVERY CLIENT, TRACKED',  body: "See who's dialed in and who needs a nudge at a glance, then drill into anyone." },
  { src: '/mockups/coach-chat.png',      eyebrow: 'MESSAGING', title: 'MESSAGE ANY CLIENT',     body: 'Direct chat with your whole roster — unread badges so nothing slips.' },
  { src: '/mockups/coach-profile.png',   eyebrow: 'YOUR BRAND', title: "A PROFILE THAT'S YOURS", body: 'Clients see your code, bio, credentials, and specialties — your brand, front and center.' },
]

/* Fill-vessel geometry (SVG user units). Bottom edge sits at y = VESSEL_BOTTOM;
   each story step fills one LAYER_H slab upward — animated via attr y/height. */

/* ── Feature row — a large phone mockup on one side, copy on the other.
   `flip` puts the phone on the right. Reveals on scroll via coach-reveal. ── */
function FeatureRow({ src, eyebrow, title, body, flip, textColor, softColor }) {
  return (
    <div className={`landing-product-card flex flex-col ${flip ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 md:gap-16`}>
      {/* Phone */}
      <div className="coach-reveal flex-shrink-0 w-[60vw] max-w-[260px] md:w-[320px] md:max-w-[320px]">
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="w-full h-auto"
          style={{ filter: 'drop-shadow(0 34px 64px rgba(0,0,0,0.45))' }}
        />
      </div>
      {/* Copy */}
      <div className="coach-reveal flex-1 text-center md:text-left">
        <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
          <span className="w-6 h-px" style={{ background: accentA(60) }} />
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: softColor }}>{eyebrow}</p>
        </div>
        <h3 className="font-display font-black text-3xl md:text-5xl tracking-wide leading-[1.03]" style={{ color: textColor }}>
          {title}
        </h3>
        <p className="text-sm md:text-base leading-relaxed mt-5 max-w-md mx-auto md:mx-0" style={{ color: softColor }}>
          {body}
        </p>
      </div>
    </div>
  )
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function Landing({ onGetStarted, onSignUp = onGetStarted }) {
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const rootRef      = useRef(null)
  const progressRef  = useRef(null)
  const trackRef     = useRef(null)

  /* Smooth-scroll to a section — use Lenis so the pinned ScrollTrigger
     sections stay in sync; fall back to native smooth scroll if it's not ready. */
  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    if (window.lenis) {
      window.lenis.scrollTo(el, {
        offset: -72,
        duration: 1.2,
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), // easeInOutCubic
      })
    } else {
      el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
  }

  useLayoutEffect(() => {
    const root = rootRef.current
    document.documentElement.classList.add('landing-mode')
    const mm = gsap.matchMedia(root)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root)
      gsap.from(q('.hero-word'), { yPercent: 110, duration: 1, stagger: .12, ease: 'power4.out' })
      gsap.from(q('.hero-sub, .hero-ctas, .hero-mockup'), { y: 28, opacity: 0, duration: 1, stagger: .14, delay: .3 })
      q('.coach-reveal, .story-step, .showcase .snap-start').forEach((el) => {
        gsap.from(el, { y: 32, opacity: 0, duration: .75, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 94%', once: true } })
      })
      gsap.fromTo(progressRef.current, { scaleX: 0 }, { scaleX: 1, ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: true } })
      gsap.to(q('.hero-orbit'), { rotate: 30, ease: 'none',
        scrollTrigger: { trigger: q('.hero')[0], start: 'top top', end: 'bottom top', scrub: 1 } })
    })
    return () => {
      mm.revert()
      document.documentElement.classList.remove('landing-mode')
    }
  }, [])

  return (
    <div ref={rootRef} className="landing-redesign bg-bg text-cream font-mono antialiased">

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
        <button
          onClick={() => window.lenis ? window.lenis.scrollTo(0, { duration: 1.2 }) : window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-display font-black text-lg tracking-widest text-cream"
        >
          MACRO<span style={{ color: ACCENT }}>STACK</span>
        </button>

        {/* Section links — jump straight to each section (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="font-display font-bold text-xs tracking-widest text-muted hover:text-cream transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => splatToggleTheme(e, toggleTheme)}
            title={theme === 'ocean-dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-cream border border-border hover:border-muted transition-colors btn-lift"
          >
            {theme === 'ocean-dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={onGetStarted}
            className="font-display font-bold text-xs tracking-widest text-muted hover:text-cream transition-colors px-3 py-2 btn-lift"
          >
            SIGN IN
          </button>
          <button
            onClick={() => { clearPlan(); onSignUp() }}
            className="font-display font-bold text-xs tracking-widest px-4 py-2 rounded-lg btn-lift btn-shine"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`, color: ON_ACCENT }}
          >
            GET STARTED
          </button>
        </div>
      </nav>

      {/* ══ 2. HERO ══════════════════════════════════════════════════════════ */}
      {/* min-h-screen (not h-screen): on phones the stacked hero content is
          taller than the viewport — a fixed height + overflow-hidden clips it.
          Mobile padding clears the fixed nav (top) and scroll cue (bottom). */}
      <section className="hero relative min-h-screen overflow-hidden flex items-center justify-center pt-24 pb-24 md:pt-0 md:pb-0">
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

        <div className="hero-inner relative w-full max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-10 items-center">
          {/* Left — copy */}
          <div className="text-center md:text-left">
            {/* App icon — signals this is an installable app at first glance */}
            <img
              src="/macrostack-logo.jpg"
              alt="MacroStack app icon"
              width="64"
              height="64"
              className="w-14 h-14 md:w-16 md:h-16 rounded-[22%] mx-auto md:mx-0 mb-5 border"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-accent) 28%, transparent)',
                boxShadow: `0 8px 28px color-mix(in srgb, var(--color-accent) 22%, transparent)`,
              }}
            />
            <p className="font-mono text-[11px] md:text-xs tracking-[0.35em] text-muted mb-6">
              PRECISION NUTRITION PLATFORM
            </p>
            <h1 className="font-display font-black leading-[0.95] text-5xl md:text-7xl tracking-[0.06em] text-cream">
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
            <p className="hero-sub max-w-md mx-auto md:mx-0 mt-8 text-sm md:text-base leading-relaxed text-muted">
              The nutrition OS for serious athletes and the coaches who guide them.
              Macro tracking, coaching tools, and AI food intel — one platform.
            </p>
            <div className="hero-ctas flex items-center justify-center md:justify-start gap-4 mt-10">
              <button
                onClick={() => { clearPlan(); onSignUp() }}
                className="font-display font-bold text-sm tracking-widest px-8 py-4 rounded-xl btn-lift btn-shine"
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
                className="font-display font-bold text-sm tracking-widest text-cream px-6 py-4 rounded-xl border border-border hover:border-muted transition-colors btn-lift"
              >
                SIGN IN
              </button>
            </div>
          </div>

          {/* Product composition */}
          <div className="hero-mockup relative flex justify-center md:justify-end">
            <div className="hero-orbit" aria-hidden="true" />
            <img className="hero-secondary" src="/mockups/app-weight.png" alt="MacroStack weight trends screen" />
            <div
              className="pointer-events-none absolute inset-0 -z-10"
              style={{ background: `radial-gradient(ellipse 55% 55% at 55% 45%, ${accentA(22)}, transparent 65%)` }}
            />
            <img
              src="/mockups/app-home.png"
              alt="MacroStack home screen"
              className="w-[42vw] max-w-[150px] md:w-full md:max-w-[300px] h-auto"
              style={{ filter: 'drop-shadow(0 34px 70px rgba(0,0,0,0.55))' }}
            />
          </div>
        </div>

        <div className="landing-hero-rail"><span>LOG WITH PRECISION</span><span>BUILD CONSISTENCY</span><span>PERFORM WITH PURPOSE</span></div>
        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
          <p className="font-mono text-[9px] tracking-[0.35em] text-muted opacity-70">SCROLL</p>
          <div className="w-[22px] h-[36px] rounded-full border border-border flex justify-center pt-2">
            <div className="scroll-cue-dot w-1 h-2 rounded-full" style={{ background: ACCENT }} />
          </div>
        </div>
      </section>

      {/* ══ 3+4. GUIDE LINE — weaves behind content across the light statement
             AND the dark "four steps" block (z-1 line, z-0 backdrops, z-2 content) ══ */}
      <div className="guide-wrap relative" style={{ background: INVERT_BG, color: INVERT_INK, isolation: 'isolate' }}>
        {/* Statement */}
        <section className="relative z-[2] min-h-[70vh] flex items-center justify-center px-6 py-24 md:py-28">
          <p className="stmt max-w-3xl text-center font-display font-black text-4xl md:text-6xl leading-[1.15] tracking-wide">
            {STATEMENT.split(' ').map((w, i) => (
              <span key={i} className="stmt-word inline-block mr-[0.28em]">
                {w}
              </span>
            ))}
          </p>
        </section>

        {/* Mobile web app — install steps (light section, below the statement) */}
        <section className="relative z-[2] px-6 pb-24 md:pb-28">
          <div className="relative max-w-4xl mx-auto">
            <div className="coach-reveal text-center mb-2">
              <div className="flex items-center gap-2 justify-center mb-4">
                <span className="w-6 h-px" style={{ background: accentA(60) }} />
                <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: INVERT_SOFT }}>MOBILE WEB APP</p>
                <span className="w-6 h-px" style={{ background: accentA(60) }} />
              </div>
              <h2 className="font-display font-black text-4xl md:text-6xl tracking-wide leading-[1.05]">
                NO APP STORE.
                <br />
                <span style={{ color: ACCENT }}>ADD TO HOME SCREEN.</span>
              </h2>
              <p className="font-mono text-xs md:text-sm mt-5 max-w-md mx-auto leading-relaxed" style={{ color: INVERT_SOFT }}>
                MacroStack runs right in your browser. Add it to your home screen for a
                full-screen, app-like experience — no download, no updates to chase.
              </p>
            </div>

            {/* Install steps */}
            <div className="coach-reveal grid gap-4 md:grid-cols-3 mt-12">
              {[
                { n: '01', icon: Smartphone, t: 'Open in your browser', d: <>Go to <b>getmacrostack.com</b> on your phone — Safari on iPhone, Chrome on Android.</> },
                { n: '02', icon: Share,      t: 'Tap Share',            d: <>Tap the <b>Share</b> button in your browser's toolbar.</> },
                { n: '03', icon: PlusSquare, t: 'Add to Home Screen',   d: <>Choose <b>Add to Home Screen</b> — MacroStack lands right beside your other apps.</> },
              ].map(({ n, icon: Icon, t, d }) => (
                <div
                  key={n}
                  className="rounded-2xl p-6"
                  style={{ background: INVERT_CARD, border: INVERT_BORDER }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display font-black text-3xl" style={{ color: accentA(45) }}>{n}</span>
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: accentA(14), border: `1px solid ${accentA(30)}` }}
                    >
                      <Icon size={18} style={{ color: ACCENT }} />
                    </span>
                  </div>
                  <p className="font-display font-bold text-base tracking-wide mb-1.5">{t}</p>
                  <p className="text-sm leading-relaxed" style={{ color: INVERT_SOFT }}>{d}</p>
                </div>
              ))}
            </div>

            <p className="coach-reveal text-center font-mono text-[10px] mt-8 tracking-[0.25em]" style={{ color: INVERT_SOFT }}>
              WORKS ON ANY PHONE · NO DOWNLOAD · INSTANT UPDATES
            </p>
          </div>
        </section>

        {/* How-it-works heading — dark block INSIDE the guide-wrap so the line
            weaves through it (dark backdrop behind the line, content above it) */}
        <section className="relative px-6 pt-24 md:pt-28 pb-16 md:pb-20">
          {/* dark backdrop sits behind the guide line */}
          <div className="absolute inset-0" style={{ background: 'var(--color-bg)' }} />
          <div className="relative z-[2] max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-px" style={{ background: accentA(60) }} />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">HOW IT WORKS</p>
            </div>
            <h2 className="font-display font-black text-5xl md:text-7xl tracking-wide leading-[1.02] text-cream">
              HOW MACROSTACK
              <br />
              <span style={{ color: ACCENT }}>KEEPS YOU ON TRACK.</span>
            </h2>
          </div>
        </section>
      </div>

      {/* ══ 5. PINNED STORY (theme dark) ═════════════════════════════════════ */}
      <section className="story bg-bg">
        <div className="landing-story-grid">
          {STORY_STEPS.map((s) => (
            <article key={s.n} className="story-step">
              <div className="landing-step-top"><span>{s.n}</span><span>{s.tag}</span></div>
              <h3 className="font-display">{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ══ 6. SHOWCASE (inverted theme section) — square cards, compact ═════ */}
      <section id="features" className="showcase relative py-20 md:py-28 overflow-hidden" style={{ background: INVERT_BG, color: INVERT_INK }}>
        <div className="px-6 md:px-10 max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-8 h-px" style={{ background: accentA(60) }} />
            <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: INVERT_SOFT }}>
              THE PLATFORM
            </p>
            <span className="w-8 h-px" style={{ background: accentA(60) }} />
          </div>
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-wide">
            EVERYTHING YOU NEED.
          </h2>
        </div>

        {/* pb-20/-mb-14: overflow-x clips vertical overflow too, so the strip
            needs room for the cards' soft drop-shadows (largest ≈ 60px + the
            scrollbar) — otherwise they get chopped into a visible line +
            shading band across the section. */}
        <div ref={trackRef} className="premium-scroll mt-10 md:mt-12 px-6 md:px-10 overflow-x-auto pb-20 -mb-14 snap-x snap-mandatory">
          {/* w-max + mx-auto: centered under the heading when the cards fit
              the viewport, normal left-anchored scrolling when they overflow */}
          <div className="flex items-start gap-5 md:gap-6 w-max mx-auto">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="w-[74vw] sm:w-[300px] md:w-[340px] aspect-square flex-shrink-0 snap-start rounded-3xl p-6 md:p-8 backdrop-blur-sm flex flex-col justify-between"
              style={{
                background: INVERT_CARD,
                border: INVERT_BORDER,
                boxShadow: `0 8px 40px ${INVERT_SHADOW}`,
              }}
            >
              <div className="flex items-start justify-between">
                <span className="text-5xl" style={{ color: ACCENT }}>{c.icon}</span>
                {c.soon && (
                  <span
                    className="font-mono text-[9px] tracking-[0.25em] px-2.5 py-1 rounded-full border"
                    style={{ color: ACCENT, borderColor: accentA(35), background: accentA(8) }}
                  >
                    COMING SOON
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-display font-black text-2xl md:text-3xl tracking-wide mb-3">
                  {c.title}
                </h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: INVERT_SOFT }}>{c.body}</p>
              </div>
            </div>
          ))}
          {/* View-all card */}
          <button
            onClick={() => { clearPlan(); onSignUp() }}
            className="w-[74vw] sm:w-[300px] md:w-[340px] aspect-square flex-shrink-0 snap-start rounded-3xl p-6 md:p-8 text-left flex flex-col justify-between btn-lift btn-shine"
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
              </h3>
              <p className="font-mono text-xs tracking-[0.25em] mt-4" style={{ opacity: 0.75 }}>
                CREATE YOUR ACCOUNT →
              </p>
            </div>
          </button>
          </div>
        </div>
      </section>

      {/* ══ 6.1 THE APP + 6.2 PRICING — one continuous dark section, no seam ═ */}
      <section id="app" className="relative bg-bg px-6 pt-10 pb-28 md:pb-36 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${accentA(9)}, transparent 60%)` }}
        />
        <div className="relative max-w-5xl mx-auto">
          <div className="coach-reveal text-center mb-16 md:mb-24">
            <div className="flex items-center gap-2 justify-center mb-4">
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">SEE IT IN ACTION</p>
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
            </div>
            <h2 className="font-display font-black text-4xl md:text-6xl tracking-wide text-cream leading-[1.05]">
              YOUR NUTRITION, <span style={{ color: ACCENT }}>IN YOUR POCKET</span>.
            </h2>
          </div>
          <div className="landing-product-grid">
            {APP_SHOWCASE.map((f, i) => (
              <FeatureRow key={f.src} {...f} flip={i % 2 === 1} textColor="var(--color-cream)" softColor="var(--color-muted)" />
            ))}
          </div>
        </div>

        {/* ── PRICING — MacroStack Pro (same section as the app showcase, no divider line) ── */}
        <div id="pricing" className="relative max-w-5xl mx-auto mt-28 md:mt-40">
          {/* Heading */}
          <div className="coach-reveal text-center mb-12">
            <div className="flex items-center gap-2 justify-center mb-4">
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">PRICING</p>
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
            </div>
            <h2 className="font-display font-black text-4xl md:text-6xl tracking-wide leading-[1.05] text-cream">
              MACROSTACK <span style={{ color: ACCENT }}>PRO</span>.
            </h2>
            <p className="font-mono text-xs md:text-sm text-muted mt-4 max-w-md mx-auto leading-relaxed">
              Start free, forever. Go Pro for the barcode scanner and full progress
              analytics — same features on every plan, cancel anytime.
              {' '}<span style={{ color: ACCENT }}>Working with a coach? Pro is included free while you're connected.</span>
            </p>
          </div>

          {/* Plan cards — three billing cadences */}
          <div className="coach-reveal grid gap-5 md:grid-cols-3 items-stretch">
            {PRO_PLANS.map((p) => (
              <div
                key={p.id}
                className="relative rounded-3xl p-7 md:p-8 flex flex-col"
                style={p.best
                  ? { background: `linear-gradient(160deg, ${accentA(16)}, ${accentA(5)})`, border: `1px solid ${accentA(45)}`, boxShadow: `0 14px 50px ${accentA(20)}` }
                  : { background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                {p.tag && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.25em] px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ background: ACCENT, color: ON_ACCENT, boxShadow: `0 4px 16px ${accentA(40)}` }}
                  >
                    {p.tag}
                  </span>
                )}
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted mb-5">{p.name}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-black text-5xl text-cream">${p.price}</span>
                  <span className="font-mono text-sm text-muted">{p.unit}</span>
                </div>
                <p
                  className="font-mono text-[11px] mt-2 mb-6"
                  style={{ color: p.best ? ACCENT : 'var(--color-muted)' }}
                >
                  {p.note}
                </p>
                <button
                  onClick={() => { rememberPlan('user', p.id); onSignUp() }}
                  className={`mt-auto w-full font-display font-bold text-sm tracking-widest py-3.5 rounded-xl btn-lift ${p.best ? 'btn-shine' : ''}`}
                  style={p.best
                    ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`, color: ON_ACCENT, boxShadow: `0 8px 28px ${accentA(35)}` }
                    : { border: '1px solid var(--color-border)', color: 'var(--color-cream)' }}
                >
                  GET PRO →
                </button>
              </div>
            ))}
          </div>

          {/* What's included — identical across every Pro plan */}
          <div
            className="coach-reveal mt-10 rounded-3xl p-7 md:p-9"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted mb-6">EVERYTHING IN PRO</p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[11px]"
                    style={{ background: accentA(18), color: ACCENT }}
                  >
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed text-cream">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 6.5 MACROSTACK COACH — coach your clients on the platform ════════ */}
      <section id="coach" className="relative px-6 pt-28 pb-20 overflow-hidden" style={{ background: INVERT_BG, color: INVERT_INK }}>
        {/* ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${accentA(16)}, transparent 65%)` }}
        />
        <div className="relative max-w-5xl mx-auto">
          {/* Heading */}
          <div className="coach-reveal text-center mb-4">
            <div className="flex items-center gap-2 justify-center mb-4">
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
              <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: INVERT_SOFT }}>MACROSTACK COACH</p>
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
            </div>
            <h2 className="font-display font-black text-4xl md:text-6xl tracking-wide leading-[1.05]">
              COACH YOUR CLIENTS,
              <br />
              <span style={{ color: ACCENT }}>ALL IN ONE PLACE</span>.
            </h2>
            <p className="max-w-xl mx-auto text-center text-sm md:text-base leading-relaxed mt-5" style={{ color: INVERT_SOFT }}>
              Run your whole nutrition-coaching business on MacroStack — build meal plans, track
              compliance, message clients, and review weekly check-ins from one dashboard.
              <strong style={{ color: INVERT_INK }}> Your first client is free.</strong> Scale as you grow.
            </p>
          </div>

          {/* Feature grid — everything a coach gets */}
          <div className="coach-reveal grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-12">
            {COACH_FEATURES.map(({ t, d }) => (
              <div
                key={t}
                className="rounded-2xl p-5"
                style={{ background: INVERT_CARD, border: INVERT_BORDER }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: accentA(16), color: ACCENT, border: `1px solid ${accentA(30)}` }}
                  >
                    ✓
                  </span>
                  <p className="font-display font-bold text-sm tracking-wide">{t}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: INVERT_SOFT }}>{d}</p>
              </div>
            ))}
          </div>

          {/* Coach portal mockups — alternating large mockups + copy */}
          <div className="coach-reveal mt-20 mb-16 md:mb-24 text-center">
            <div className="flex items-center gap-2 justify-center">
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
              <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: INVERT_SOFT }}>INSIDE THE COACH PORTAL</p>
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
            </div>
          </div>
          <div className="landing-product-grid">
            {COACH_SHOWCASE.map((f, i) => (
              <FeatureRow key={f.src} {...f} flip={i % 2 === 1} textColor={INVERT_INK} softColor={INVERT_SOFT} />
            ))}
          </div>

          {/* Pricing — tiered by roster size */}
          <div className="coach-reveal mt-16">
            <div className="flex items-center gap-2 justify-center mb-3">
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
              <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: INVERT_SOFT }}>PRICED BY ROSTER SIZE</p>
              <span className="w-6 h-px" style={{ background: accentA(60) }} />
            </div>
            <p className="text-center text-sm mb-9 max-w-lg mx-auto leading-relaxed" style={{ color: INVERT_SOFT }}>
              One flat monthly rate for your entire client list — <strong style={{ color: INVERT_INK }}>every feature included on every tier</strong>. No per-client fees, no add-ons.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {COACH_TIERS.map((tier) => {
                const isFree = tier.price === 'Free'
                const highlight = isFree || tier.tag === 'POPULAR'
                return (
                  <button
                    key={tier.range}
                    onClick={() => { rememberPlan('coach', tier.plan); onSignUp() }}
                    className="btn-lift relative rounded-2xl p-5 pt-6 pb-4 text-center cursor-pointer"
                    style={highlight
                      ? { background: `linear-gradient(160deg, ${accentA(16)}, ${accentA(5)})`, border: `1px solid ${accentA(45)}`, boxShadow: `0 12px 40px ${accentA(15)}` }
                      : { background: INVERT_CARD, border: INVERT_BORDER }}
                  >
                    {tier.tag && (
                      <span
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 font-mono text-[8px] tracking-[0.18em] px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ background: ACCENT, color: ON_ACCENT, boxShadow: `0 4px 14px ${accentA(40)}` }}
                      >
                        {tier.tag}
                      </span>
                    )}
                    <p className="font-mono text-[10px] tracking-[0.14em] mb-3" style={{ color: INVERT_SOFT }}>{tier.range}</p>
                    <span className="font-display font-black text-3xl md:text-4xl" style={isFree ? { color: ACCENT } : undefined}>{tier.price}</span>
                    <p className="font-mono text-[10px] mt-1" style={{ color: INVERT_SOFT }}>{tier.unit}</p>
                    <span
                      className="mt-3 inline-block font-mono text-[9px] tracking-[0.2em] px-3 py-1.5 rounded-lg"
                      style={{ background: accentA(isFree || highlight ? 90 : 14), color: isFree || highlight ? ON_ACCENT : ACCENT }}
                    >
                      {isFree ? 'START FREE →' : 'GET STARTED →'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="coach-reveal mt-12 text-center">
            <button
              onClick={() => { rememberPlan('coach', null); onSignUp() }}
              className="inline-block font-display font-bold text-sm tracking-widest px-10 py-4 rounded-xl btn-lift btn-shine"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                boxShadow: `0 8px 32px ${accentA(35)}`,
                color: ON_ACCENT,
              }}
            >
              START COACHING FREE →
            </button>
            <p className="font-mono text-[10px] mt-4 tracking-[0.2em]" style={{ color: 'color-mix(in srgb, var(--color-bg) 45%, var(--color-cream))' }}>
              NO CARD TO START · UPGRADE AS YOUR ROSTER GROWS · CANCEL ANYTIME
            </p>
          </div>
        </div>
      </section>

      {/* ══ 7. FINALE (theme dark) ═══════════════════════════════════════════ */}
      <section className="relative bg-bg px-6 pt-20 pb-24">
        {/* Stats */}
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 md:gap-12 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-display font-black text-4xl md:text-7xl" style={{ color: ACCENT }}>
                <span className="stat-num" data-value={s.value}>{s.value.toLocaleString('en-US')}</span>
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
            onClick={() => { clearPlan(); onSignUp() }}
            className="font-display font-bold text-base tracking-widest px-10 py-5 rounded-2xl mt-10 btn-lift btn-shine"
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
        <footer className="max-w-5xl mx-auto mt-24 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-black text-sm tracking-widest text-cream">
            MACRO<span style={{ color: ACCENT }}>STACK</span>
          </p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="font-mono text-[10px] tracking-[0.2em] text-muted opacity-70 hover:opacity-100 transition-opacity">
              PRIVACY
            </a>
            <a href="/terms" className="font-mono text-[10px] tracking-[0.2em] text-muted opacity-70 hover:opacity-100 transition-opacity">
              TERMS
            </a>
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted opacity-70">
              NUTRITION OS · {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </section>
    </div>
  )
}
