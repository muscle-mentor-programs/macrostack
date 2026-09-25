import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import apiFetch from '../lib/apiFetch'

export default function AccountDeletionRequest() {
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [requestId, setRequestId] = useState('')
  const [error, setError] = useState('')

  const requestDeletion = async () => {
    if (sending) return
    setSending(true)
    setError('')
    try {
      const response = await apiFetch('/api/account/deletion-request', { method: 'POST' })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Could not send your request.')
      setRequestId(result.requestId)
      setConfirming(false)
    } catch (err) {
      setError(err.message || 'Could not send your request. Please retry.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="glass-card border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Trash2 size={17} className="text-muted shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-bold text-lg text-cream">Delete account</h2>
          <p className="font-mono text-xs text-muted mt-1 leading-relaxed">
            Request permanent deletion of your MacroStack account and personal data. Our team handles the request and emails you when it is complete.
          </p>
          {requestId ? (
            <p role="status" className="font-mono text-xs text-cream mt-4 break-all">
              Request received. Reference: {requestId}
            </p>
          ) : confirming ? (
            <div className="mt-4 space-y-3">
              <p className="font-mono text-xs text-muted leading-relaxed">
                Your account remains active while we review the request. We will handle any active subscription and explain any records we must retain by law. This cannot be undone once completed.
              </p>
              {error && <p role="alert" className="font-mono text-xs text-red-400">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={requestDeletion} disabled={sending} className="min-h-11 rounded-xl bg-red-900/40 border border-red-500/50 px-4 font-display font-bold text-xs tracking-wide text-red-200 disabled:opacity-50">
                  {sending ? 'SENDING…' : 'CONFIRM REQUEST'}
                </button>
                <button type="button" onClick={() => { setConfirming(false); setError('') }} disabled={sending} className="min-h-11 rounded-xl border border-border px-4 font-display font-bold text-xs tracking-wide text-cream">
                  KEEP ACCOUNT
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="mt-4 min-h-11 rounded-xl border border-border px-4 font-display font-bold text-xs tracking-wide text-muted hover:text-cream hover:border-red-500/50">
              REQUEST ACCOUNT DELETION
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
