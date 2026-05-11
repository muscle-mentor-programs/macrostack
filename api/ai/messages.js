/**
 * Vercel serverless function — proxies POST /api/ai/messages → Anthropic Messages API
 *
 * Simpler, explicit endpoint (no catch-all) to ensure reliable Vercel routing.
 *
 * REQUIRED: ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables
 * Never prefix with VITE_ — this key must stay server-side only.
 */
export default async function handler(req, res) {
  // Only allow POST
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

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
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
