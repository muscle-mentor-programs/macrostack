import { requireUser } from '../_auth.js'
/**
 * Vercel serverless function — proxies /api/ai/* → https://api.anthropic.com/*
 *
 * REQUIRED: Set ANTHROPIC_API_KEY in Vercel project settings:
 *   Vercel Dashboard → Project → Settings → Environment Variables
 *
 * Never prefix with VITE_ — this key must stay server-side only.
 */
export default async function handler(req, res) {
  if (!(await requireUser(req, res))) return
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res
      .status(500)
      .setHeader('content-type', 'application/json')
      .send(JSON.stringify({
        error: 'ANTHROPIC_API_KEY is not configured. Add it to Vercel → Settings → Environment Variables.',
      }))
  }

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
        'x-api-key':         apiKey,
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
