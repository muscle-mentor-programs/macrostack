/**
 * Server-side auth for API routes (underscore file = not deployed as a route).
 * Verifies the caller's Supabase session token; superadmin variant also checks
 * the profiles.role via PostgREST using the caller's own token (RLS-safe).
 */
const SB_URL = process.env.VITE_SUPABASE_URL
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY

export async function requireUser(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token || !SB_URL || !SB_KEY) {
    res.status(401).json({ error: 'Sign in required.' })
    return null
  }
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: SB_KEY, authorization: `Bearer ${token}` },
    })
    if (!r.ok) { res.status(401).json({ error: 'Sign in required.' }); return null }
    const user = await r.json()
    if (!user?.id) { res.status(401).json({ error: 'Sign in required.' }); return null }
    return { user, token }
  } catch {
    res.status(401).json({ error: 'Sign in required.' })
    return null
  }
}

export async function requireSuperadmin(req, res) {
  const auth = await requireUser(req, res)
  if (!auth) return null
  try {
    const r = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${auth.user.id}&select=role`, {
      headers: { apikey: SB_KEY, authorization: `Bearer ${auth.token}` },
    })
    const rows = r.ok ? await r.json() : []
    if (rows[0]?.role !== 'superadmin') {
      res.status(403).json({ error: 'Superadmin only.' })
      return null
    }
    return auth
  } catch {
    res.status(403).json({ error: 'Superadmin only.' })
    return null
  }
}

// Outbound email is limited to the caller and their own coaching roster.
// Authenticate using the session, then use that same token so database RLS applies.
export async function requireEmailRecipients(auth, recipients, res) {
  const normalize = value => typeof value === 'string' ? value.trim().toLowerCase() : ''
  const addresses = (Array.isArray(recipients) ? recipients : [recipients]).map(normalize)
  if (!addresses.length || addresses.some(address => !address || !address.includes('@'))) {
    res.status(400).json({ error: 'Valid email recipients are required.' })
    return false
  }
  const allowed = new Set([normalize(auth.user.email)])
  if (addresses.every(address => allowed.has(address))) return true
  try {
    const headers = { apikey: SB_KEY, authorization: `Bearer ${auth.token}` }
    const profileResponse = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${auth.user.id}&select=role`, { headers })
    const profiles = profileResponse.ok ? await profileResponse.json() : []
    if (!['coach', 'superadmin'].includes(profiles[0]?.role)) {
      res.status(403).json({ error: 'You can only email yourself or your coaching clients.' })
      return false
    }
    const rosterResponse = await fetch(`${SB_URL}/rest/v1/clients?coach_id=eq.${auth.user.id}&select=email`, { headers })
    if (!rosterResponse.ok) throw new Error('Roster unavailable')
    for (const client of await rosterResponse.json()) allowed.add(normalize(client.email))
    if (!addresses.every(address => allowed.has(address))) {
      res.status(403).json({ error: 'You can only email yourself or your coaching clients.' })
      return false
    }
    return true
  } catch {
    res.status(503).json({ error: 'Could not verify email recipients. Please retry.' })
    return false
  }
}
