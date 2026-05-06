import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import useStore from '../store'
import ScrambleText from '../components/ScrambleText'
import ThemeToggle from '../components/ThemeToggle'

export default function LoginScreen() {
  const { login } = useStore()

  const [edition, setEdition] = useState('coach') // 'coach' | 'client'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const isClient = edition === 'client'

  const switchEdition = (ed) => {
    if (ed === edition) return
    setEdition(ed)
    setEmail('')
    setPassword('')
    setError('')
    setShowPw(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    setTimeout(() => {
      const result = login(email, password, edition)
      if (!result.ok) setError(result.error)
      setLoading(false)
    }, 350)
  }

  const inputCls =
    'w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none transition-colors'

  // Shared field JSX — inlined per face so React keeps them stable in the DOM
  const emailField = (tabIdx) => (
    <div>
      <label className="font-display text-xs text-muted tracking-widest block mb-1.5">EMAIL</label>
      <input
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        tabIndex={tabIdx}
        onChange={(e) => { setEmail(e.target.value); setError('') }}
        className={`${inputCls} focus:border-brown`}
      />
    </div>
  )

  const passwordField = (tabIdx) => (
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
          className={`${inputCls} pr-11 focus:border-brown`}
        />
        <button
          type="button"
          tabIndex={tabIdx}
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
        >
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="relative flex h-screen w-screen bg-bg items-center justify-center overflow-hidden anim-fade-in">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-10">
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

      <div className="w-full max-w-sm px-6 anim-fade-in-up">

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
                  <p className="font-display font-black text-xl tracking-widest text-cream">COACH SIGN IN</p>
                  <p className="font-mono text-xs text-muted mt-0.5">Access your coaching dashboard</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
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
                  <p className="font-display font-black text-xl tracking-widest text-olive-light">CLIENT SIGN IN</p>
                  <p className="font-mono text-xs text-muted mt-0.5">Access your nutrition log</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  {emailField(!isClient ? -1 : 0)}
                  {passwordField(!isClient ? -1 : 0)}
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

      </div>
    </div>
  )
}
