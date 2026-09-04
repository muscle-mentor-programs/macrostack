import { requireUser } from '../_auth.js'
/**
 * Vercel serverless function — proxies POST /api/ai/messages → Anthropic Messages API
 *
 * Model selection priority:
 *   1. ANTHROPIC_MODEL env var (Vercel → Settings → Environment Variables)
 *   2. Auto-discovered best model from GET /v1/models (cached 30 min)
 *   3. Hard-coded fallback
 *
 * REQUIRED: ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables
 */

// Module-level cache survives across warm lambda invocations
let _cachedModel = null
let _cacheTime   = 0
const CACHE_TTL  = 30 * 60 * 1000 // 30 minutes
const requestWindow = new Map()
const REQUEST_LIMIT = 20
const WINDOW_MS = 10 * 60 * 1000

function isRateLimited(userId) {
  const now = Date.now()
  const timestamps = (requestWindow.get(userId) || []).filter((time) => now - time < WINDOW_MS)
  if (timestamps.length >= REQUEST_LIMIT) return true
  timestamps.push(now)
  requestWindow.set(userId, timestamps)
  return false
}

/**
 * Score a model id so we can pick the best available one.
 * Prefers: opus > sonnet > haiku, and newer versions (higher version numbers).
 */
function scoreModel(id) {
  const lower = id.toLowerCase()
  let score = 0
  if (lower.includes('opus'))   score += 3000
  if (lower.includes('sonnet')) score += 2000
  if (lower.includes('haiku'))  score += 1000
  // Boost by version numbers found in the id (e.g. "4", "5", "6")
  const nums = lower.match(/\d+/g) || []
  nums.forEach((n) => { score += Number(n) })
  return score
}

async function resolveModel(apiKey) {
  // 1. Hard override via env var — always wins
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL

  // 2. Return cached result if still fresh
  if (_cachedModel && Date.now() - _cacheTime < CACHE_TTL) return _cachedModel

  // 3. Query Anthropic's models list and pick the highest-scoring one
  try {
    const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
    })
    if (res.ok) {
      const json = await res.json()
      const models = (json.data || []).filter((m) => m.type === 'model')
      if (models.length > 0) {
        models.sort((a, b) => scoreModel(b.id) - scoreModel(a.id))
        _cachedModel = models[0].id
        _cacheTime   = Date.now()
        console.log('[ai/messages] auto-selected model:', _cachedModel)
        return _cachedModel
      }
    }
  } catch (e) {
    console.warn('[ai/messages] models list fetch failed:', e.message)
  }

  // 4. Last-resort fallback
  return 'claude-sonnet-4-5'
}

export default async function handler(req, res) {
  const auth = await requireUser(req, res)
  if (!auth) return
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

  if (isRateLimited(auth.user.id)) {
    return res.status(429).setHeader('content-type', 'application/json')
      .send(JSON.stringify({ error: 'Too many AI requests. Please try again in a few minutes.' }))
  }

  const model = await resolveModel(apiKey)
  const requestedMessages = Array.isArray(req.body?.messages) ? req.body.messages : []
  const messages = requestedMessages.slice(-20).map((message) => ({
    role: message?.role === 'assistant' ? 'assistant' : 'user',
    content: String(message?.content || '').slice(0, 16_000),
  })).filter((message) => message.content)
  if (!messages.length) {
    return res.status(400).setHeader('content-type', 'application/json')
      .send(JSON.stringify({ error: 'At least one message is required.' }))
  }
  const body = {
    model,
    max_tokens: Math.min(Math.max(Number(req.body?.max_tokens) || 1024, 1), 8192),
    system: String(req.body?.system || '').slice(0, 16_000),
    messages,
  }

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
