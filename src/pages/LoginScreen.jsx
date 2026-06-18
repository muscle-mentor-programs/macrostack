import { useState } from 'react'
import { Eye, EyeOff, UserPlus, Share, MoreVertical, PlusSquare, Smartphone } from 'lucide-react'
import useStore from '../store'
import ScrambleText from '../components/ScrambleText'
import ThemeToggle from '../components/ThemeToggle'

// Detected once at module load — platform + whether already installed.
const UA = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
const IS_IOS = /iphone|ipad|ipod/i.test(UA)
const IS_ANDROID = /android/i.test(UA)
const IS_INSTALLED =
  (typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true))

// "Add to Home Screen" instructions — platform-aware. Hidden once installed.
function AddToHomeScreen() {
  if (IS_INSTALLED) return null

  const steps = IS_IOS
    ? [
        { icon: Share, text: <>Tap the <b className="text-cream">Share</b> button in Safari's toolbar</> },
        { icon: PlusSquare, text: <>Choose <b className="text-cream">Add to Home Screen</b></> },
      ]
    : IS_ANDROID
    ? [
        { icon: MoreVertical, text: <>Tap the <b className="text-cream">⋮ menu</b> in Chrome</> },
        { icon: PlusSquare, text: <>Choose <b className="text-cream">Add to Home screen</b></> },
      ]
    : [
        { icon: PlusSquare, text: <>Use your browser's <b className="text-cream">Install</b> icon in the address bar</> },
      ]

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone size={14} className="text-brown-light" />
        <p className="font-display font-bold text-xs tracking-widest text-cream">ADD TO HOME SCREEN</p>
      </div>
      <p className="font-mono text-[11px] text-muted leading-relaxed mb-3">
        Install MacroStack for a full-screen app experience — fastest way to log every day.
      </p>
      <div className="space-y-2">
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-brown/15 border border-brown/25 flex items-center justify-center flex-shrink-0">
                <Icon size={12} className="text-brown-light" />
              </div>
              <p className="font-mono text-[11px] text-muted">
                <span className="text-dim mr-1">{i + 1}.</span>{s.text}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function LoginScreen({ onBack }) {
  const { login, signup } = useStore()

  const [edition, setEdition]   = useState('client') // 'coach' | 'client'
  const [mode, setMode]         = useState('login')  // 'login' | 'signup'

  // Login fields
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Signup fields
  const [name, setName]                   = useState('')
  const [signupEmail, setSignupEmail]     = useState('')
  const [signupPw, setSignupPw]           = useState('')
  const [confirmPw, setConfirmPw]         = useState('')
  const [showSignupPw, setShowSignupPw]   = useState(false)
  const [signupError, setSignupError]     = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  const isClient = edition === 'client'

  const switchEdition = (ed) => {
    if (ed === edition) return
    setEdition(ed)
    setEmail('')
    setPassword('')
    setError('')
    setShowPw(false)
    setSignupError('')
  }

  const switchMode = (m) => {
    setMode(m)
    // Reset all fields and errors
    setEmail('')
    setPassword('')
    setError('')
    setShowPw(false)
    setName('')
    setSignupEmail('')
    setSignupPw('')
    setConfirmPw('')
    setShowSignupPw(false)
    setSignupError('')
    setSignupSuccess(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    const result = await login(email, password, edition)
    if (!result.ok) setError(result.error)
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!name || !signupEmail || !signupPw || !confirmPw) return
    if (signupPw !== confirmPw) {
      setSignupError('Passwords do not match.')
      return
    }
    if (signupPw.length < 6) {
      setSignupError('Password must be at least 6 characters.')
      return
    }
    setSignupError('')
    setSignupLoading(true)
    const result = await signup(name, signupEmail, signupPw, edition)
    setSignupLoading(false)
    if (result.needsConfirmation) {
      setSignupSuccess(true)
      return
    }
    if (!result.ok) {
      setSignupError(result.error || 'Sign-up failed. Please try again.')
    }
    // If ok and no needsConfirmation, store has already navigated
  }

  const inputCls =
    'w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none transition-colors'

  // ── Shared field helpers ──────────────────────────────────────────────────
  const emailField = (tabIdx, focusCls = 'focus:border-green') => (
    <div>
      <label className="font-display text-xs text-muted tracking-widest block mb-1.5">EMAIL</label>
      <input
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        tabIndex={tabIdx}
        onChange={(e) => { setEmail(e.target.value); setError('') }}
        className={`${inputCls} ${focusCls}`}
      />
    </div>
  )

  const passwordField = (tabIdx, focusCls = 'focus:border-green') => (
    <div>
      <label className="font-display text-xs text-muted tracking-widest block mb-1.5">PASSWORD</label>
      <div className="relative">
        <input
          type={showPw ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          tabIndex={tabIdx}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          className={`${inputCls} pr-11 ${focusCls}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
        >
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )

  // ── Signup form fields ────────────────────────────────────────────────────
  const signupForm = (tabIdx, accentFocusCls, btnCls) => {
    if (signupSuccess) {
      return (
        <div className="py-6 text-center space-y-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${isClient ? 'bg-blue/20 border border-blue/30' : 'bg-green/20 border border-green/30'}`}>
            <UserPlus size={20} className={isClient ? 'text-blue-light' : 'text-green-light'} />
          </div>
          <p className="font-display font-bold text-sm tracking-widest text-cream">CHECK YOUR EMAIL</p>
          <p className="font-mono text-xs text-muted leading-relaxed">
            We sent a confirmation link to <span className="text-cream">{signupEmail}</span>.
            Click it to activate your account.
          </p>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="font-mono text-xs text-brown hover:text-brown-light underline underline-offset-2 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      )
    }

    return (
      <form onSubmit={handleSignup} className="space-y-3">
        <div>
          <label className="font-display text-xs text-muted tracking-widest block mb-1.5">NAME</label>
          <input
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            tabIndex={tabIdx}
            onChange={(e) => { setName(e.target.value); setSignupError('') }}
            className={`${inputCls} ${accentFocusCls}`}
          />
        </div>
        <div>
          <label className="font-display text-xs text-muted tracking-widest block mb-1.5">EMAIL</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={signupEmail}
            tabIndex={tabIdx}
            onChange={(e) => { setSignupEmail(e.target.value); setSignupError('') }}
            className={`${inputCls} ${accentFocusCls}`}
          />
        </div>
        <div>
          <label className="font-display text-xs text-muted tracking-widest block mb-1.5">PASSWORD</label>
          <div className="relative">
            <input
              type={showSignupPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={signupPw}
              tabIndex={tabIdx}
              onChange={(e) => { setSignupPw(e.target.value); setSignupError('') }}
              className={`${inputCls} pr-11 ${accentFocusCls}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowSignupPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
            >
              {showSignupPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="font-display text-xs text-muted tracking-widest block mb-1.5">CONFIRM PASSWORD</label>
          <input
            type={showSignupPw ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPw}
            tabIndex={tabIdx}
            onChange={(e) => { setConfirmPw(e.target.value); setSignupError('') }}
            className={`${inputCls} ${accentFocusCls}`}
          />
        </div>
        {signupError && <p className="font-mono text-xs text-red-400 anim-shake">{signupError}</p>}
        <button
          type="submit"
          tabIndex={tabIdx}
          disabled={signupLoading || !name || !signupEmail || !signupPw || !confirmPw}
          className={`w-full mt-1 disabled:opacity-40 disabled:cursor-not-allowed text-bg font-display font-bold text-sm tracking-widest py-3.5 rounded-xl transition-colors glow-hover flex items-center justify-center gap-2 ${btnCls}`}
        >
          <UserPlus size={15} />
          {signupLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
        </button>
      </form>
    )
  }

  return (
    <div className="fixed inset-0 bg-bg overflow-y-auto anim-fade-in">
      {/* Back to landing */}
      {onBack && (
        <div className="fixed top-safe left-4 z-10">
          <button
            onClick={onBack}
            className="font-mono text-xs text-muted hover:text-cream tracking-widest flex items-center gap-1.5 py-2 transition-colors"
          >
            ← BACK
          </button>
        </div>
      )}

      {/* Theme toggle */}
      <div className="fixed top-safe right-4 z-10">
        <ThemeToggle compact />
      </div>

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#9A7B55 1px, transparent 1px), linear-gradient(90deg, #9A7B55 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="min-h-full flex items-center justify-center px-6 py-14">
      <div className="w-full max-w-sm anim-fade-in-up">

        {/* Brand */}
        <div className="text-center mb-8 scanline-parent py-3">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* Ambient glow behind the logo */}
              <div className="absolute inset-0 rounded-full bg-brown/30 blur-2xl scale-150" />
              <img src="/MSLOGO2.png" width="56" height="56" alt="MacroStack logo" className="relative" />
            </div>
          </div>
          {/* track-center compensates the trailing letter-space so the
              tracked display text sits on true center */}
          <h1 className="font-display font-black text-6xl tracking-widest track-center leading-none text-cream">
            <ScrambleText text="MACRO" duration={900} />
            <br />
            <ScrambleText text="STACK" className="text-brown" duration={900} delay={150} />
          </h1>
          <p className="font-mono text-xs text-muted tracking-widest track-center mt-3">NUTRITION OS</p>
        </div>

        {/* ── 3D flip card ─────────────────────────────── */}
        <div style={{ perspective: '1200px' }}>
          <div
            style={{
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isClient ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* ── COACH face (front) ── */}
            <div
              aria-hidden={isClient}
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
              <div className="relative overflow-hidden glass-card border border-border rounded-2xl p-6 space-y-4 accent-line">
                <div>
                  <p className="font-display font-black text-xl tracking-widest text-cream">
                    {mode === 'login' ? 'COACH SIGN IN' : 'COACH SIGN UP'}
                  </p>
                  <p className="font-mono text-xs text-muted mt-0.5">
                    {mode === 'login' ? 'Access your coaching dashboard' : 'Create your coach account'}
                  </p>
                </div>

                {mode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-3">
                    {emailField(isClient ? -1 : 0)}
                    {passwordField(isClient ? -1 : 0)}
                    {error && <p className="font-mono text-xs text-red-400 anim-shake">{error}</p>}
                    <button
                      type="submit"
                      tabIndex={isClient ? -1 : 0}
                      disabled={loading || !email || !password}
                      className="w-full mt-1 bg-green hover:bg-green-light disabled:opacity-40 disabled:cursor-not-allowed text-bg font-display font-bold text-sm tracking-widest py-3.5 rounded-xl transition-colors glow-hover"
                    >
                      {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                    </button>
                  </form>
                ) : (
                  signupForm(isClient ? -1 : 0, 'focus:border-green', 'bg-green hover:bg-green-light')
                )}
              </div>
            </div>

            {/* ── CLIENT face (back) ── */}
            <div
              aria-hidden={!isClient}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                position: 'absolute',
                top: 0, left: 0, right: 0,
              }}
            >
              <div className="relative overflow-hidden glass-card border border-border rounded-2xl p-6 space-y-4 accent-line">
                <div>
                  <p className="font-display font-black text-xl tracking-widest text-blue-light">
                    {mode === 'login' ? 'USER SIGN IN' : 'USER SIGN UP'}
                  </p>
                  <p className="font-mono text-xs text-muted mt-0.5">
                    {mode === 'login' ? 'Access your nutrition log' : 'Create your user account'}
                  </p>
                </div>

                {mode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-3">
                    {emailField(!isClient ? -1 : 0, 'focus:border-blue')}
                    {passwordField(!isClient ? -1 : 0, 'focus:border-blue')}
                    {error && <p className="font-mono text-xs text-red-400 anim-shake">{error}</p>}
                    <button
                      type="submit"
                      tabIndex={!isClient ? -1 : 0}
                      disabled={loading || !email || !password}
                      className="w-full mt-1 bg-blue hover:bg-blue-light disabled:opacity-40 disabled:cursor-not-allowed text-bg font-display font-bold text-sm tracking-widest py-3.5 rounded-xl transition-colors glow-hover"
                    >
                      {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                    </button>
                  </form>
                ) : (
                  signupForm(!isClient ? -1 : 0, 'focus:border-blue', 'bg-blue hover:bg-blue-light')
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ─────────────────────────────────────────────── */}

        {/* Edition toggle — segmented control with sliding pill */}
        <div className="relative flex mt-4 bg-card border border-border rounded-xl p-1 card-dim">
          <div
            className="absolute top-1 bottom-1 rounded-lg pointer-events-none"
            style={{
              left:  isClient ? '4px' : '50%',
              width: 'calc(50% - 4px)',
              background: isClient
                ? 'linear-gradient(135deg, #4A80C4 0%, #6B9FD8 100%)'
                : 'linear-gradient(135deg, #558A55 0%, #6EAA6E 100%)',
              boxShadow: isClient
                ? '0 2px 14px rgba(74,128,196,0.45), inset 0 1px 0 rgba(255,255,255,0.25)'
                : '0 2px 14px rgba(85,138,85,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
              transition: 'left 0.38s cubic-bezier(0.34, 1.4, 0.64, 1), background 0.3s ease, box-shadow 0.3s ease',
            }}
          />
          <button
            onClick={() => switchEdition('client')}
            className={`relative z-10 flex-1 py-2.5 font-display font-bold text-xs tracking-widest transition-colors duration-200 ${
              isClient ? 'text-bg' : 'text-muted hover:text-cream'
            }`}
          >
            USER EDITION
          </button>
          <button
            onClick={() => switchEdition('coach')}
            className={`relative z-10 flex-1 py-2.5 font-display font-bold text-xs tracking-widest transition-colors duration-200 ${
              !isClient ? 'text-bg' : 'text-muted hover:text-cream'
            }`}
          >
            COACH EDITION
          </button>
        </div>

        {/* Mode toggle */}
        <div className="text-center mt-3">
          {mode === 'login' ? (
            <button
              onClick={() => switchMode('signup')}
              className="font-mono text-xs text-muted hover:text-cream transition-colors"
            >
              Don&apos;t have an account?{' '}
              <span className="text-brown underline underline-offset-2">CREATE ACCOUNT</span>
            </button>
          ) : (
            <button
              onClick={() => switchMode('login')}
              className="font-mono text-xs text-muted hover:text-cream transition-colors"
            >
              Already have an account?{' '}
              <span className="text-brown underline underline-offset-2">SIGN IN</span>
            </button>
          )}
        </div>

        {/* Add to Home Screen instructions */}
        <AddToHomeScreen />

      </div>{/* max-w-sm content */}
      </div>{/* min-h-full centering wrapper */}
    </div>
  )
}
