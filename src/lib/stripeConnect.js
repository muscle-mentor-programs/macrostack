import { supabase } from './supabase'

export async function stripeConnectRequest(body) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Please sign in again, then restart Stripe connection from your coach portal.')
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-onboard`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || result.error) throw new Error(result.error || 'Could not connect to Stripe. Please retry from your coach portal.')
  return result
}

export async function startStripeConnection(returnPage = 'marketplace') {
  sessionStorage.setItem('ms-stripe-return', returnPage === 'upgrade' ? '/upgrade' : '/marketplace')
  const result = await stripeConnectRequest({ action: 'begin' })
  if (result.url) window.location.assign(result.url)
  return result
}
