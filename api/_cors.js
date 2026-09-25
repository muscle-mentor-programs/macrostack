const nativeOrigins = new Set(['capacitor://localhost'])

export function handleNativeCors(req, res) {
  const origin = req.headers.origin
  if (nativeOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.setHeader('Access-Control-Max-Age', '600')
  }
  if (req.method !== 'OPTIONS') return false
  res.status(nativeOrigins.has(origin) ? 204 : 403).end()
  return true
}
