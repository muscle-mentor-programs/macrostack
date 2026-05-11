import { FOODS } from '../data/foods'

const MAX_PER_CAT = 10

function buildFoodList(customFoods = []) {
  const byCategory = {}
  for (const f of FOODS) {
    const cat = f.category || 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    if (byCategory[cat].length < MAX_PER_CAT) byCategory[cat].push(f)
  }

  const sampled = Object.values(byCategory).flat()
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

function resolveFood(foodId, customFoods = []) {
  const all = [...FOODS, ...customFoods]
  return all.find((f) => f.id === foodId) || null
}

// Scale all items in a day's meals so total calories land within ±5% of target.
// This is the safety net — it fires whenever the AI overshoots.
function scaleDayToTarget(mealsObj, calTarget) {
  const allItems  = Object.values(mealsObj).flat()
  const totalCal  = allItems.reduce((s, i) => s + i.calories, 0)
  if (totalCal <= 0) return mealsObj

  const maxCal = calTarget * 1.05
  const minCal = calTarget * 0.95
  if (totalCal >= minCal && totalCal <= maxCal) return mealsObj

  const scale = calTarget / totalCal
  return Object.fromEntries(
    Object.entries(mealsObj).map(([meal, items]) => [
      meal,
      items.map((item) => ({
        ...item,
        quantity: parseFloat((item.quantity * scale).toFixed(3)),
        calories: parseFloat((item.calories * scale).toFixed(1)),
        protein:  parseFloat((item.protein  * scale).toFixed(1)),
        carbs:    parseFloat((item.carbs    * scale).toFixed(1)),
        fat:      parseFloat((item.fat      * scale).toFixed(1)),
      })),
    ])
  )
}

/**
 * Generate a meal plan using Claude / Kay.
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

DAILY TARGETS: ${goals.calories} kcal | ${goals.protein}g protein | ${goals.carbs}g carbs | ${goals.fat}g fat
COACH PREFERENCES / NOTES: ${preferences || 'none'}

AVAILABLE FOODS (id · name · brand · cal · pro · carbs · fat · serving — ALL VALUES ARE PER SERVING AT quantity=1):
${foodJson}

━━━ HOW QUANTITY WORKS ━━━
"quantity" is a multiplier applied to every macro in that row.
  final_cal  = food.cal  × quantity
  final_pro  = food.pro  × quantity
  final_carbs= food.carbs× quantity
  final_fat  = food.fat  × quantity
Use decimals (e.g. 0.5, 1.5, 2.0) to hit exact targets.

━━━ CALORIE RULE (HIGHEST PRIORITY) ━━━
• The DAILY TARGET above is the hard limit UNLESS the COACH PREFERENCES explicitly name a different number.
• For each day, sum every item's (food.cal × quantity). That sum MUST equal the calorie target ±5%.
  Allowed range: ${Math.round(goals.calories * 0.95)} – ${Math.round(goals.calories * 1.05)} kcal per day.
• Do NOT produce a day whose total exceeds ${Math.round(goals.calories * 1.05)} kcal under any circumstances.
• If your chosen foods add up to too many calories, REDUCE quantities (use fractions < 1) until the sum fits.

━━━ MACRO RULES ━━━
• Protein per day must be within ±10% of ${goals.protein}g (${Math.round(goals.protein * 0.9)}–${Math.round(goals.protein * 1.1)}g).
• Carbs per day must be within ±10% of ${goals.carbs}g.
• Fat per day must be within ±10% of ${goals.fat}g.
• Sanity check: (protein×4) + (carbs×4) + (fat×9) must ≈ total kcal.

━━━ MEAL RULES ━━━
• Each day: 4 meals — Breakfast, Lunch, Dinner, Snack.
• Each item must reference a valid "foodId" from the list above.
• Vary foods across days to avoid repetition.
• Prefer high-protein options when possible.
• Apply any dietary restrictions from COACH PREFERENCES.

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
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI returned invalid JSON')
    parsed = JSON.parse(match[0])
  }

  // Hydrate foodId references with full food objects + scaled macros,
  // then apply post-processing scale so every day lands within ±5% of target.
  const hydratedDays = parsed.days.map((day) => {
    const rawMeals = Object.fromEntries(
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
    )

    // Safety net: scale the entire day if the AI overshot or undershot
    const scaledMeals = scaleDayToTarget(rawMeals, goals.calories)

    return {
      id:    'day_' + Math.random().toString(36).slice(2),
      label: day.label,
      meals: scaledMeals,
    }
  })

  return {
    planName:    parsed.planName || 'AI Meal Plan',
    aiGenerated: true,
    days:        hydratedDays,
  }
}
