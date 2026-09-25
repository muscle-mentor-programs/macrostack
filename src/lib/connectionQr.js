const COACH_CODE = /^[A-Z0-9]{4,12}$/
const STORE_CODE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LIVE_HOSTS = new Set(['getmacrostack.com', 'www.getmacrostack.com'])

export function coachJoinURL(origin, code) {
  const normalized = String(code || '').trim().toUpperCase()
  if (!COACH_CODE.test(normalized)) return null
  const url = new URL('/profile', origin)
  url.searchParams.set('coach', normalized)
  return url.toString()
}

export function parseConnectionQR(value, currentOrigin) {
  const raw = String(value || '').trim()
  if (!raw) return null

  const upper = raw.toUpperCase()
  if (COACH_CODE.test(upper)) return { kind: 'coach', code: upper }
  if (STORE_CODE.test(raw)) return { kind: 'store', code: raw.toLowerCase() }

  let url
  try { url = new URL(raw) } catch { return null }
  const current = new URL(currentOrigin)
  const trusted = url.origin === current.origin ||
    (url.protocol === 'https:' && !url.port && LIVE_HOSTS.has(url.hostname))
  if (!trusted || url.username || url.password || url.hash) return null

  const path = url.pathname.replace(/\/$/, '')
  const coach = url.searchParams.get('coach')?.trim().toUpperCase()
  if (path === '/profile' && coach && COACH_CODE.test(coach)) {
    return { kind: 'coach', code: coach }
  }
  const store = url.searchParams.get('store')?.trim()
  if (path === '/retail/member' && store && STORE_CODE.test(store)) {
    return { kind: 'store', code: store.toLowerCase() }
  }
  return null
}
