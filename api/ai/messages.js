/**
 * Vercel serverless function — proxies POST /api/ai/messages → Anthropic Messages API
 *
 * REQUIRED env vars (Vercel → Project → Settings → Environment Variables):
 *   ANTHROPIC_API_KEY   — your Anthropic secret key (never use VITE_ prefix)
 *   ANTHROPIC_MODEL     — (optional) override the model, e.g. claude-opus-4-5
 *                         defaults to claude-3-7-sonnet-20250219
 */

const DEFAULT_MODEL = 'claude-3-7-sonnet-20250219'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).setHeader('content-type', 'application/json')
      .send(JSON.stringify({ error: 'Method not allowed' }))
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).setHeader('content-type', 'application/json')
      .send(JSON.stringify({
        error: 'ANTHROPIC_API_KEY is not configured. Add it to Vercel → Settings → Environment Variables.',
      }))
  }

  // Allow server-side model override so the model can be updated via Vercel
  // environment variables without a code deployment.
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL
  const body  = { ...req.body, model }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
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
