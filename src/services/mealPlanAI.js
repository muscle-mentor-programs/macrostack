import { FOODS } from '../data/foods'

// Build a compact food catalogue for the AI prompt.
// Samples up to MAX_PER_CAT foods per category so the prompt stays well
// within token limits and Vercel's function timeout.
const MAX_PER_CAT = 10

function buildFoodList(customFoods = []) {
  // Group built-in foods by category and take a representative slice
  const byCategory = {}
  for (const f of FOODS) {
    const cat = f.category || 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    if (byCategory[cat].length < MAX_PER_CAT) byCategory[cat].push(f)
  }

  const sampled = Object.values(byCategory).flat()

  // Always include all custom foods (coach's own additions)
  const customIds = new Set(customFoods.map((f) => f.id))
  const combined  = [
    ...sampled.filter((f) => !customIds.has(f.id)),
    ...customFoods,
  ]

  return combined.map((f) => ({
    id:    f.id,
    name:  f.name,
    brand: f.brand || '',
    cal:   f.calories,
    pro:   f.protein,
    carbs: f.carbs,
    fat:   f.fat,
    sv:    f.servingUnit ? `${f.servingSize}${f.servingUnit}` : `${f.servingSize}g`,
  }))
}

// Map a foodId from the AI response back to full food object
function resolveFood(foodId, customFoods = []) {
  const all = [...FOODS, ...customFoods]
  return all.find((f) => f.id === foodId) || null
}

/**
 * Generate a meal plan using Claude.
 *
 * @param {object} params
 * @param {object} params.goals          - { calories, protein, carbs, fat }
 * @param {number} params.days           - number of days (1–7)
 * @param {string} params.preferences    - free-text preferences / notes
 * @param {string} params.clientName     - used to personalise the prompt
 * @param {Array}  params.customFoods    - coach's custom food list
 * @returns {Promise<object>}            - { planName, days: [{label, meals}] }
 */
export async function generateMealPlan({ goals, days = 7, preferences = '', clientName = 'the client', customFoods = [] }) {
  const foodList = buildFoodList(customFoods)
  const foodJson = JSON.stringify(foodList)

  const systemPrompt = `You are a professional sports nutritionist and meal-plan builder.
You MUST ONLY use foods from the exact list provided — do not invent any new foods.
Respond with ONLY valid JSON, no markdown, no commentary.`

  const userPrompt = `Build a ${days}-day meal plan for ${clientName}.

TARGETS (daily): ${goals.calories} kcal | ${goals.protein}g protein | ${goals.carbs}g carbs | ${goals.fat}g fat
PREFERENCES / NOTES: ${preferences || 'none'}

AVAILABLE FOODS (id, name, brand, cal, pro, carbs, fat, serving):
${foodJson}

Rules:
- Each day has 4 meals: Breakfast, Lunch, Dinner, Snack
- Each meal item must reference a valid "foodId" from the list above
- Include a "quantity" (number, decimals allowed) that scales the macros proportionally
- Total daily macros should be within ±10% of the targets
- Vary the foods across days to avoid repetition
- Prefer high-protein options when possible

Respond with ONLY this JSON shape (no markdown):
{
  "planName": "string — descriptive name for the plan",
  "days": [
    {
      "label": "Day 1",
      "meals": {
        "Breakfast": [{ "foodId": "...", "quantity": 1 }],
        "Lunch":     [{ "foodId": "...", "quantity": 1 }],
        "Dinner":    [{ "foodId": "...", "quantity": 1 }],
        "Snack":     [{ "foodId": "...", "quantity": 1 }]
      }
    }
  ]
}`

  const response = await fetch('/api/ai/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-3-5-sonnet-latest',
      max_tokens: 8000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    let errDetail = ''
    try { errDetail = await response.text() } catch (_) {}
    throw new Error(`AI API error ${response.status}${errDetail ? ': ' + errDetail : ''}`)
  }

  const data = await response.json()
  const raw = data.content?.[0]?.text || ''

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Try to extract JSON block if there's surrounding text
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI returned invalid JSON')
    parsed = JSON.parse(match[0])
  }

  // Hydrate foodId references with full food objects + scaled macros
  const hydratedDays = parsed.days.map((day) => ({
    id: 'day_' + Math.random().toString(36).slice(2),
    label: day.label,
    meals: Object.fromEntries(
      Object.entries(day.meals).map(([mealName, items]) => [
        mealName,
        items
          .map((item) => {
            const food = resolveFood(item.foodId, customFoods)
            if (!food) return null
            const qty = item.quantity || 1
            return {
              id:          Math.random().toString(36).slice(2),
              foodId:      food.id,
              name:        food.name,
              brand:       food.brand || '',
              quantity:    qty,
              servingSize: food.servingSize,
              servingUnit: food.servingUnit || 'g',
              calories:    parseFloat((food.calories * qty).toFixed(1)),
              protein:     parseFloat((food.protein  * qty).toFixed(1)),
              carbs:       parseFloat((food.carbs    * qty).toFixed(1)),
              fat:         parseFloat((food.fat      * qty).toFixed(1)),
            }
          })
          .filter(Boolean),
      ])
    ),
  }))

  return {
    planName:    parsed.planName || 'AI Meal Plan',
    aiGenerated: true,
    days:        hydratedDays,
  }
}
