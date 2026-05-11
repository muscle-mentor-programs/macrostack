/**
 * POST /api/ai/food-search
 *
 * Superadmin-only endpoint: uses the Anthropic API to search for foods and
 * return structured nutritional data that can be added to the shared food DB.
 *
 * Body: { query: string }
 * Returns: { foods: Array<FoodItem> }
 *
 * FoodItem: { name, brand, servingSize, servingUnit, calories, protein, carbs, fat, fiber, sugar, sodium }
 */

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

  const { query } = req.body || {}
  if (!query?.trim()) {
    return res.status(400).json({ error: 'query is required' })
  }

  const systemPrompt = `You are a precise nutritional database assistant. When given a food search query, return a JSON array of matching foods with accurate USDA-level nutritional data.

Rules:
- Return ONLY a valid JSON array — no markdown, no explanation, no extra text.
- Each item must have these exact fields:
  { "name": string, "brand": string, "servingSize": number, "servingUnit": string, "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "sugar": number, "sodium": number }
- "brand" is empty string "" for generic/whole foods.
- "servingUnit" is one of: "g", "oz", "ml", "fl oz", "cup", "tbsp", "tsp", "piece", "slice", "scoop", "bar", "packet", "bottle", "can", "bag"
- All macro values are per ONE serving at the given servingSize.
- Calories, protein, carbs, fat are required and must be realistic numbers.
- fiber, sugar, sodium can be 0 if unknown, but try to include accurate values.
- Return 3–8 relevant results depending on the query breadth.
- For branded foods, include the brand name. For generic foods (chicken breast, apple, oats, etc.), leave brand empty.
- Nutritional values must be accurate and sourced from well-known nutritional databases (USDA, NCCDB, manufacturer data).`

  const userMessage = `Search the nutritional database for: "${query.trim()}"

Return a JSON array of matching foods with complete nutritional information.`

  try {
    // Resolve best available model (prefer haiku for fast structured output)
    let model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system:     systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      return res.status(upstream.status).json({ error: errText })
    }

    const data    = await upstream.json()
    const rawText = data.content?.[0]?.text || '[]'

    // Strip any accidental markdown code fences
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let foods = []
    try {
      foods = JSON.parse(cleaned)
      if (!Array.isArray(foods)) foods = []
    } catch {
      console.error('[food-search] Failed to parse AI response:', cleaned.slice(0, 300))
      foods = []
    }

    // Sanitise each food item so missing fields don't break the UI
    foods = foods.map((f) => ({
      name:        String(f.name        || '').trim(),
      brand:       String(f.brand       || '').trim(),
      servingSize: Number(f.servingSize) || 100,
      servingUnit: String(f.servingUnit  || 'g'),
      calories:    Number(f.calories)    || 0,
      protein:     Number(f.protein)     || 0,
      carbs:       Number(f.carbs)       || 0,
      fat:         Number(f.fat)         || 0,
      fiber:       Number(f.fiber)       || 0,
      sugar:       Number(f.sugar)       || 0,
      sodium:      Number(f.sodium)      || 0,
    })).filter((f) => f.name && f.calories > 0)

    return res.status(200).json({ foods })
  } catch (e) {
    console.error('[food-search] error:', e)
    return res.status(500).json({ error: e.message })
  }
}
