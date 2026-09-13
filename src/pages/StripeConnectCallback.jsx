import { useEffect, useState } from 'react'
import { stripeConnectRequest } from '../lib/stripeConnect'

// One request per page load, including React StrictMode's double effect setup.
let completion
const callbackParams = window.location.pathname === '/stripe-connect/callback'
  ? new URLSearchParams(window.location.search) : null
if (callbackParams) window.history.replaceState({}, '', '/stripe-connect/callback')
function completeOnce() {
  if (!completion) {
    const params = callbackParams || new URLSearchParams()
    const input = { action: 'complete', code: params.get('code'), state: params.get('state'), error: params.get('error') }
    completion = stripeConnectRequest(input)
  }
  return completion
}

export default function StripeConnectCallback() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    completeOnce().then(value => { if (active) setResult(value) }).catch(failure => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [])
  const destination = sessionStorage.getItem('ms-stripe-return') === '/upgrade' ? '/upgrade' : '/marketplace'
  return <main className="min-h-dvh bg-bg text-cream flex items-center justify-center p-5">
    <section className="glass-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4" aria-live="polite">
      <h1 className="font-display text-3xl">{error ? 'STRIPE CONNECTION' : result ? 'STRIPE CONNECTED' : 'CONNECTING STRIPE'}</h1>
      {error ? <p role="alert" className="text-red-400">{error}</p> : <p className="text-muted">{result
        ? result.ready ? 'Your Stripe account is authorized. Return to your coach portal to continue setup.'
          : 'Your Stripe account is authorized. Complete the remaining payment and payout requirements in your Stripe Dashboard.'
        : 'Confirming your authorization securely. Please keep this page open.'}</p>}
      {(error || result) && <a className="btn-accent block text-center p-3" href={destination}>Return to coach portal</a>}
      {result && !result.ready && <a className="btn-ghost block text-center p-3" href="https://dashboard.stripe.com">Open Stripe Dashboard</a>}
    </section>
  </main>
}
