import { useRef, useState } from 'react'
import { BriefcaseBusiness, Loader2 } from 'lucide-react'
import useStore from '../store'

export default function CoachActivation() {
  const { currentUser, activateCoach, setActiveRole } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  if (!currentUser || !['client','coach'].includes(currentUser.role)) return null
  const enabled = currentUser.role === 'coach'
  const activate = async () => {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setError('')
    try {
      if (enabled) await setActiveRole('coach')
      else {
        const result = await activateCoach()
        if (!result?.ok) setError(result?.error || 'Could not activate coaching. Please retry.')
      }
    } catch { setError('Could not activate coaching. Please retry.') }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <section className="app-page-inset mb-6 glass-card border border-border rounded-2xl p-4">
    <h2 className="profile-card-heading">{enabled ? 'Coach workspace' : 'Become a coach'}</h2>
    <p className="font-mono text-sm text-muted mt-2 leading-relaxed">{enabled ? 'Switch to your coach portal with this same login.' : 'Add a coach workspace to this account. Your member profile, food logs, coach connection, and Pro subscription stay intact. Choose a separate coach plan next; activating does not charge you.'}</p>
    <button disabled={busy} onClick={activate} className="profile-card-action is-filled mt-4 flex items-center gap-2 min-h-11 px-4 py-2 rounded-lg bg-brown disabled:opacity-60">
      {busy ? <Loader2 size={16} className="animate-spin"/> : <BriefcaseBusiness size={16}/>}
      {busy ? 'Setting up…' : enabled ? 'Open coach portal' : 'Activate coach profile'}
    </button>
    {error && <p role="alert" className="mt-3 font-mono text-sm text-red-400">{error}</p>}
  </section>
}
