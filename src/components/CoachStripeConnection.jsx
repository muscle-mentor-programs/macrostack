import { useEffect, useState } from 'react'
import { Check, ExternalLink, Link2, Unlink } from 'lucide-react'
import { startStripeConnection, stripeConnectRequest } from '../lib/stripeConnect'
import './CoachStripeConnection.css'

export default function CoachStripeConnection() {
  const [connection, setConnection] = useState(null)
  const [busy, setBusy] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    let alive = true
    stripeConnectRequest({ action: 'status' })
      .then(result => { if (alive) setConnection(result) })
      .catch(err => { if (alive) setError(err.message) })
      .finally(() => { if (alive) setBusy(false) })
    return () => { alive = false }
  }, [])

  async function refreshOrConnect() {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = connection?.connected || !connection
        ? await stripeConnectRequest({ action: 'status' })
        : await startStripeConnection('marketplace')
      setConnection(result)
      if (!result.url) setMessage(result.disconnect_pending ? 'Unlinking is pending. Retry below to finish.' : result.connected ? 'Stripe connection verified.' : 'Ready to connect your Stripe account.')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function disconnect() {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await stripeConnectRequest({ action: 'disconnect', confirm: true })
      setConnection(result); setConfirming(false)
      setMessage('Stripe unlinked. Your marketplace listing is hidden until you reconnect. Your clients and history are saved.')
    } catch (err) {
      setError(err.message)
      // Refresh even after an uncertain response so a pending revocation never
      // looks like a healthy payment connection.
      try { setConnection(await stripeConnectRequest({ action: 'status' })) } catch { /* Keep the actionable original error. */ }
    } finally { setBusy(false) }
  }
  const linked = connection?.connected && !connection?.disconnect_pending
  return <section className="coach-stripe-connection" aria-label="Stripe payment account" aria-busy={busy}>
    <button type="button" onClick={refreshOrConnect} disabled={busy}
      className={`coach-stripe-button ${linked ? 'is-linked' : ''}`}>
      {linked ? <Check size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
      {busy ? 'Updating Stripe…' : connection?.disconnect_pending ? 'Refresh unlink status' : linked ? 'Stripe linked' : connection ? 'Connect Stripe account' : 'Check Stripe connection'}
    </button>
    {linked && <p className="coach-stripe-caption">{connection.ready ? 'Connected for coaching payments.' : 'Account linked. Finish payment setup in Stripe to accept payments.'}</p>}
    {connection?.disconnect_pending && <p className="coach-stripe-caption">Unlinking is pending. New payments are paused until it finishes.</p>}
    {connection?.connected && <div className="coach-stripe-actions">
      <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">Stripe Dashboard <ExternalLink size={13} aria-hidden="true" /></a>
      {!confirming && <button type="button" disabled={busy} onClick={() => { setConfirming(true); setMessage('') }}><Unlink size={13} aria-hidden="true" />{connection.disconnect_pending ? 'Retry unlinking' : 'Unlink Stripe account'}</button>}
    </div>}
    {confirming && connection?.connected && <div className="coach-stripe-confirm">
      <h3>Unlink this Stripe account?</h3>
      <p>This removes MacroStack’s access, closes unused coaching checkout links, and hides your marketplace listing. You can connect a Stripe account again later.</p>
      <p>Your Stripe account, payment history, clients, and MacroStack subscription stay intact. Ongoing coaching subscriptions must end before unlinking. Manage historical refunds directly in Stripe after unlinking.</p>
      <div className="coach-stripe-confirm-actions">
        <button type="button" disabled={busy} onClick={() => setConfirming(false)}>Keep linked</button>
        <button type="button" disabled={busy} onClick={disconnect} className="coach-stripe-unlink">{busy ? 'Unlinking…' : 'Confirm unlink'}</button>
      </div>
    </div>}
    {error && <p role="alert" className="coach-stripe-error">{error}</p>}
    {message && <p role="status" className="coach-stripe-caption">{message}</p>}
  </section>
}
