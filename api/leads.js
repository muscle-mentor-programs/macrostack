/**
 * POST /api/leads
 *
 * Superadmin-only endpoint (UI-gated, like /api/ai/food-search): uses the
 * Anthropic API with the web_search server tool to find live prospect posts.
 *
 * Body: { kind: 'users' | 'coaches' }
 * Returns: { leads: Array<{ title, url, source, date, snippet, why, angle }> }
 */

const PROMPTS = {
  users: `Find recent public posts, threads, and replies (ideally from the last 60 days) written by INDIVIDUALS who are prime prospects for MacroStack, a macro-tracking app with built-in coach messaging (www.getmacrostack.com). Look for people who are:
- complaining about MyFitnessPal (price increases, ads, barcode scanner behind paywall) or asking for MyFitnessPal alternatives
- asking for macro/calorie tracking app recommendations (alternatives to LoseIt, Cronometer, MacroFactor, etc.)
- asking for help tracking macros, hitting protein targets, or staying consistent with logging
- looking for nutrition coaching, accountability partners, or check-in support

Search across Reddit (r/loseit, r/fitness, r/nutrition, r/CICO, r/gainit, r/xxfitness and similar), X/Twitter, and fitness forums. Run several DIFFERENT searches to cover multiple angles.`,

  coaches: `Find recent public posts, threads, and replies (ideally from the last 60 days) written by NUTRITION COACHES, PERSONAL TRAINERS, and ONLINE FITNESS COACHES who are prime prospects for MacroStack Coach, a client-management platform with macro tracking, weekly check-ins, intake forms, meal plans, progress photos, and in-app client messaging (www.getmacrostack.com). Look for professionals who are:
- asking for coaching software / client check-in app recommendations
- complaining about or seeking alternatives to Trainerize, Everfit, TrueCoach, CoachRx, Healthie, PT Distinction, or spreadsheets
- asking how to manage client macros, check-ins, forms, or progress tracking at scale
- growing an online coaching business and looking for tools

Search across Reddit (r/personaltraining, r/fitnesscareers, r/OnlineCoaching, r/nutritioncoaching and similar), X/Twitter, and fitness-industry forums. Run several DIFFERENT searches to cover multiple angles.`,
}

const SYSTEM = `You are a lead-generation researcher for MacroStack, a nutrition-tracking and coaching platform. You find real, recent, public posts by people who match the target profile, with DIRECT links to each post.

Rules for your FINAL answer:
- You have a limited search budget. After at most 4-5 searches, STOP searching and write the final answer from the results you have — NEVER end the turn without producing it, even if coverage feels incomplete.
- The final answer is a valid JSON array wrapped in sentinel tags, exactly like: <leads>[ {...}, {...} ]</leads> — no markdown fences, nothing else after the closing tag.
- 4 to 12 items, best leads first.
- Each item has exactly these fields:
  {
    "title":   string,  // short title of the post or a 5-10 word summary of it
    "url":     string,  // DIRECT link to the specific post/thread/reply — must be a real URL from your search results, never invented
    "source":  string,  // e.g. "Reddit · r/loseit", "X / Twitter", "Bodybuilding.com forum"
    "date":    string,  // when it was posted, as best known, e.g. "3 days ago" or "Jun 2026"; "" if unknown
    "snippet": string,  // 1-2 sentence quote or faithful paraphrase of what the person said
    "why":     string,  // one sentence: why this person is a strong lead for MacroStack
    "angle":   string   // one sentence: suggested angle for a helpful, non-spammy reply
  }
- Only include posts by genuine prospects (not news articles, listicles, or competitor marketing).
- Never fabricate URLs. If a result has no direct post link, skip it.`

/* Translate raw Anthropic API errors into actionable, human-readable text */
function friendlyAnthropicError(errText, status) {
  let msg = ''
  try { msg = JSON.parse(errText)?.error?.message || '' } catch { msg = errText }
  if (/credit balance is too low/i.test(msg)) {
    return 'The Anthropic account is out of API credits. Top up at console.anthropic.com → Plans & Billing, then retry.'
  }
  if (status === 429 || /rate limit/i.test(msg)) {
    return 'Anthropic rate limit hit — wait a minute and retry.'
  }
  if (status === 401) {
    return 'Anthropic API key is invalid — check ANTHROPIC_API_KEY in Vercel env settings.'
  }
  if (status === 529 || /overloaded/i.test(msg)) {
    return 'Anthropic API is temporarily overloaded — retry in a moment.'
  }
  return msg || `Anthropic API error (${status})`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured. Add it to Vercel → Settings → Environment Variables.',
    })
  }

  const { kind } = req.body || {}
  if (!PROMPTS[kind]) {
    return res.status(400).json({ error: "kind must be 'users' or 'coaches'" })
  }

  try {
    const messages = [{ role: 'user', content: PROMPTS[kind] }]
    const body = {
      // Sonnet 5: near-Opus quality on search/agentic work with much higher
      // rate limits — this org's Opus tier (10k input tokens/min) can't absorb
      // the token volume web search generates. Override via LEADS_MODEL after
      // a rate-tier upgrade to run on claude-opus-4-8.
      model: process.env.LEADS_MODEL || 'claude-sonnet-5',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      // medium effort: the task is search + summarize — keeps the scan well
      // inside the serverless time budget without hurting lead quality
      output_config: { effort: 'medium' },
      system: SYSTEM,
      // Basic web search variant: the _20260209 dynamic-filtering variant runs
      // code execution internally, which exhausted the tool budget mid-scan
      // and left the model unable to write its final answer
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      messages,
    }

    // Server-side web search runs a sampling loop that can return
    // stop_reason "pause_turn" — resume by re-sending with the assistant turn.
    let data = null
    let retriedRateLimit = false
    for (let i = 0; i < 5; i++) {
      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ ...body, messages }),
      })
      // Per-minute token limits recover quickly — wait out one window and retry
      if (upstream.status === 429 && !retriedRateLimit) {
        retriedRateLimit = true
        await new Promise((r) => setTimeout(r, 45000))
        continue
      }
      if (!upstream.ok) {
        const errText = await upstream.text()
        console.error('[leads] anthropic error:', errText.slice(0, 500))
        return res.status(upstream.status).json({ error: friendlyAnthropicError(errText, upstream.status) })
      }
      data = await upstream.json()
      if (data.stop_reason !== 'pause_turn') break
      messages.push({ role: 'assistant', content: data.content })
    }

    // Concatenate text blocks (web search responses split text around citations)
    const rawText = (data?.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')

    // Extract the JSON array: prefer the <leads> sentinel; otherwise bracket-
    // match backwards from the last ']' (intermediate text blocks can contain
    // stray brackets, so first-[ to last-] is not safe)
    let jsonText = null
    const sentinel = rawText.match(/<leads>([\s\S]*?)<\/leads>/)
    if (sentinel) {
      jsonText = sentinel[1]
    } else {
      const end = rawText.lastIndexOf(']')
      if (end !== -1) {
        let depth = 0
        for (let i = end; i >= 0; i--) {
          if (rawText[i] === ']') depth++
          else if (rawText[i] === '[') {
            depth--
            if (depth === 0) { jsonText = rawText.slice(i, end + 1); break }
          }
        }
      }
    }

    let leads = []
    if (jsonText) {
      try {
        leads = JSON.parse(jsonText)
        if (!Array.isArray(leads)) leads = []
      } catch {
        console.error('[leads] JSON parse failed:', jsonText.slice(0, 300))
      }
    }

    // Sanitise: real http(s) links only, trimmed strings
    leads = leads
      .map((l) => ({
        title:   String(l.title   || '').trim(),
        url:     String(l.url     || '').trim(),
        source:  String(l.source  || '').trim(),
        date:    String(l.date    || '').trim(),
        snippet: String(l.snippet || '').trim(),
        why:     String(l.why     || '').trim(),
        angle:   String(l.angle   || '').trim(),
      }))
      .filter((l) => l.title && /^https?:\/\//.test(l.url))

    // Surface diagnostics on empty results — this endpoint is superadmin-only
    // and empty scans are otherwise impossible to debug from the client
    const debug = leads.length === 0
      ? { stop_reason: data?.stop_reason, blocks: (data?.content || []).map((b) => b.type), sample: rawText.slice(0, 600) }
      : undefined

    return res.status(200).json({ leads, debug })
  } catch (e) {
    console.error('[leads] error:', e)
    return res.status(500).json({ error: e.message })
  }
}
