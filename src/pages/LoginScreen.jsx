import { useState } from 'react'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import useStore from '../store'
import ScrambleText from '../components/ScrambleText'
import ThemeToggle from '../components/ThemeToggle'

export default function LoginScreen() {
  const { login, signup } = useStore()

  const [edition, setEdition]   = useState('coach') // 'coach' | 'client'
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
  const emailField = (tabIdx, focusCls = 'focus:border-brown') => (
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

  const passwordField = (tabIdx, focusCls = 'focus:border-brown') => (
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
          <div className="w-12 h-12 rounded-full bg-olive/20 border border-olive/30 flex items-center justify-center mx-auto">
            <UserPlus size={20} className="text-olive-light" />
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
        {signupError && <p className="font-mono text-xs text-red-400 anim-fade-in">{signupError}</p>}
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
    <div className="relative w-screen min-h-screen bg-bg overflow-y-auto overflow-x-hidden anim-fade-in">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle compact />
      </div>

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#9A7B55 1px, transparent 1px), linear-gradient(90deg, #9A7B55 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm px-6 py-10 anim-fade-in-up">

        {/* Brand */}
        <div className="text-center mb-8 scanline-parent py-3">
          <h1 className="font-display font-black text-6xl tracking-widest leading-none text-cream">
            <ScrambleText text="MACRO" duration={900} />
            <br />
            <ScrambleText text="STACK" className="text-brown" duration={900} delay={150} />
          </h1>
          <p className="font-mono text-xs text-muted tracking-widest mt-2 cursor">NUTRITION OS</p>
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
              <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
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
                    {error && <p className="font-mono text-xs text-red-400 anim-fade-in">{error}</p>}
                    <button
                      type="submit"
                      tabIndex={isClient ? -1 : 0}
                      disabled={loading || !email || !password}
                      className="w-full mt-1 bg-brown hover:bg-brown-light disabled:opacity-40 disabled:cursor-not-allowed text-bg font-display font-bold text-sm tracking-widest py-3.5 rounded-xl transition-colors glow-hover"
                    >
                      {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                    </button>
                  </form>
                ) : (
                  signupForm(isClient ? -1 : 0, 'focus:border-brown', 'bg-brown hover:bg-brown-light')
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
              <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
                <div>
                  <p className="font-display font-black text-xl tracking-widest text-olive-light">
                    {mode === 'login' ? 'CLIENT SIGN IN' : 'CLIENT SIGN UP'}
                  </p>
                  <p className="font-mono text-xs text-muted mt-0.5">
                    {mode === 'login' ? 'Access your nutrition log' : 'Create your client account'}
                  </p>
                </div>

                {mode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-3">
                    {emailField(!isClient ? -1 : 0, 'focus:border-olive')}
                    {passwordField(!isClient ? -1 : 0, 'focus:border-olive')}
                    {error && <p className="font-mono text-xs text-red-400 anim-fade-in">{error}</p>}
                    <button
                      type="submit"
                      tabIndex={!isClient ? -1 : 0}
                      disabled={loading || !email || !password}
                      className="w-full mt-1 bg-olive hover:bg-olive-light disabled:opacity-40 disabled:cursor-not-allowed text-bg font-display font-bold text-sm tracking-widest py-3.5 rounded-xl transition-colors glow-hover"
                    >
                      {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                    </button>
                  </form>
                ) : (
                  signupForm(!isClient ? -1 : 0, 'focus:border-olive', 'bg-olive hover:bg-olive-light')
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ─────────────────────────────────────────────── */}

        {/* Edition toggle */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => switchEdition('coach')}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs tracking-widest transition-all duration-200 ${
              !isClient
                ? 'bg-brown text-bg shadow-sm'
                : 'bg-card border border-border text-muted hover:text-cream'
            }`}
          >
            COACH EDITION
          </button>
          <button
            onClick={() => switchEdition('client')}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs tracking-widest transition-all duration-200 ${
              isClient
                ? 'bg-olive text-bg shadow-sm'
                : 'bg-card border border-border text-muted hover:text-cream'
            }`}
          >
            CLIENT EDITION
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

      </div>
      </div>
    </div>
  )
}
