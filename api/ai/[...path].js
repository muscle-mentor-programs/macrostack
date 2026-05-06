/**
 * Vercel serverless function — proxies /api/ai/* → https://api.anthropic.com/*
 * The ANTHROPIC_API_KEY env var is set in Vercel project settings (server-side only).
 */
export default async function handler(req, res) {
  const { path } = req.query
  const apiPath = Array.isArray(path) ? path.join('/') : (path || '')
  const url = `https://api.anthropic.com/${apiPath}`

  let body
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = JSON.stringify(req.body)
  }

  try {
    const upstream = await fetch(url, {
      method:  req.method,
      headers: {
        'content-type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body,
    })

    const text = await upstream.text()
    res.status(upstream.status)
      .setHeader('content-type', 'application/json')
      .send(text)
  } catch (e) {
    res.status(500)
      .setHeader('content-type', 'application/json')
      .send(JSON.stringify({ error: e.message }))
  }
}
