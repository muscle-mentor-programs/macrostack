import { useState } from 'react'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SetPasswordScreen({ onDone }) {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
    sessionStorage.removeItem('macrostack-post-invite')
    setTimeout(onDone, 1400)
  }

  return (
    <div className="software-ui software-entry flex h-full w-full bg-bg items-center justify-center px-6">
      <div className="w-full max-w-sm anim-fade-in-up">

        {/* Logo / brand mark */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brown/20 border border-brown/40 flex items-center justify-center">
            <Lock size={22} className="text-brown-light" />
          </div>
        </div>

        <h1 className="font-display font-black text-3xl tracking-widest text-cream text-center mb-2">
          CREATE PASSWORD
        </h1>
        <p className="font-mono text-sm text-muted text-center mb-8 leading-relaxed">
          Your coach set up your account.<br />Create a password to log in next time.
        </p>

        {done ? (
          <div className="flex flex-col items-center gap-3 anim-fade-in">
            <CheckCircle size={40} className="text-olive-light" />
            <p className="font-display font-bold text-sm tracking-widest text-olive-light">
              PASSWORD SET — WELCOME!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password */}
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-11 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirm */}
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full bg-card border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors"
            />

            {error && (
              <p className="font-mono text-xs text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brown hover:bg-brown-light disabled:opacity-50 text-bg font-display font-black text-sm tracking-widest py-3.5 rounded-xl transition-colors mt-2"
            >
              {loading ? 'SAVING…' : 'SET PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
