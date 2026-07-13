import apiFetch from '../lib/apiFetch'
import { FOODS } from '../data/foods'

const MAX_PER_CAT = 10

// Units that allow arbitrary decimal quantities (weight / liquid volume).
const CONTINUOUS_UNITS = ['oz', ' g', 'ml', 'fl oz', ' lb', ' kg']

// Units that are strictly countable — must stay whole numbers (1, 2, 3…).
const WHOLE_UNITS = [
  'bar', 'bottle', 'can', 'cookie', 'donut', 'bag', 'sandwich', 'waffle',
  'egg', 'slice', 'piece', 'packet', 'patty', 'burger', 'nugget', 'strip',
  'wrap', 'roll', 'bun', 'muffin', 'cupcake', 'bite',
]

/**
 * Snap a quantity to a realistic value based on the food's serving unit.
 *  - Weight/volume (oz, g, ml…)  → 1-decimal precision (e.g. 1.5 oz is fine)
 *  - Countable items (bar, egg…) → whole numbers only (1, 2, 3)
 *  - Everything else (scoop, cup, tbsp…) → nearest 0.5 (0.5, 1.0, 1.5…)
 */
function snapQuantity(qty, servingUnit) {
  const su = (servingUnit || '').toLowerCase()
  if (CONTINUOUS_UNITS.some((u) => su.includes(u))) {
    // weight/volume: round to 1 decimal, minimum 0.5
    return Math.max(0.5, Math.round(qty * 10) / 10)
  }
  if (WHOLE_UNITS.some((u) => su.includes(u))) {
    // discrete items: whole numbers only, minimum 1
    return Math.max(1, Math.round(qty))
  }
  // semi-discrete (scoop, cup, tbsp, tsp, etc.): nearest 0.5, minimum 0.5
  return Math.max(0.5, Math.round(qty * 2) / 2)
}

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

// Safety net: scale every item proportionally so total calories land within ±5%.
// Scaling is proportional, so macro ratios are preserved — if Kay picked the right
// macro split the scaled day will also hit the macro targets.
function scaleDayToTarget(mealsObj, calTarget) {
  const allItems = Object.values(mealsObj).flat()
  const totalCal = allItems.reduce((s, i) => s + i.calories, 0)
  if (totalCal <= 0) return mealsObj

  const withinRange = totalCal >= calTarget * 0.95 && totalCal <= calTarget * 1.05
  if (withinRange) return mealsObj

  const scale = calTarget / totalCal
  return Object.fromEntries(
    Object.entries(mealsObj).map(([meal, items]) => [
      meal,
      items.map((item) => {
        const scaledRaw = item.quantity * scale
        const snapped   = snapQuantity(scaledRaw, item.servingUnit)
        const snapScale = snapped / (item.quantity || 1)
        return {
          ...item,
          quantity: snapped,
          calories: parseFloat((item.calories * snapScale).toFixed(1)),
          protein:  parseFloat((item.protein  * snapScale).toFixed(1)),
          carbs:    parseFloat((item.carbs    * snapScale).toFixed(1)),
          fat:      parseFloat((item.fat      * snapScale).toFixed(1)),
        }
      }),
    ])
  )
}

/**
 * Generate a meal plan using Kay.
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

  // Pre-compute the ±5% allowed ranges for every macro
  const cal   = goals.calories
  const pro   = goals.protein
  const carbs = goals.carbs
  const fat   = goals.fat

  const r = (n) => Math.round(n)

  // Macro split as % of total calories — helps Kay pick the right food balance
  const proPct   = Math.round((pro   * 4) / cal * 100)
  const carbsPct = Math.round((carbs * 4) / cal * 100)
  const fatPct   = Math.round((fat   * 9) / cal * 100)

  const systemPrompt = `You are a professional sports nutritionist and meal-plan builder.
You MUST ONLY use foods from the exact list provided — do not invent any new foods.
Respond with ONLY valid JSON, no markdown, no commentary.`

  const userPrompt = `Build a ${days}-day meal plan for ${clientName}.

COACH PREFERENCES / NOTES: ${preferences || 'none'}

━━━ DAILY TARGETS (ALL FOUR MUST BE HIT EVERY DAY) ━━━
┌─────────────┬──────────┬─────────────────────────────┬───────────────┐
│ Macro        │ Target   │ Allowed range (±5%)         │ % of calories │
├─────────────┼──────────┼─────────────────────────────┼───────────────┤
│ Calories     │ ${cal} kcal│ ${r(cal*0.95)}–${r(cal*1.05)} kcal              │               │
│ Protein      │ ${pro}g    │ ${r(pro*0.95)}–${r(pro*1.05)}g                  │ ~${proPct}%          │
│ Carbohydrates│ ${carbs}g    │ ${r(carbs*0.95)}–${r(carbs*1.05)}g                  │ ~${carbsPct}%          │
│ Fat          │ ${fat}g    │ ${r(fat*0.95)}–${r(fat*1.05)}g                  │ ~${fatPct}%          │
└─────────────┴──────────┴─────────────────────────────┴───────────────┘
Sanity check: (protein×4) + (carbs×4) + (fat×9) ≈ ${cal} kcal

━━━ HOW QUANTITY WORKS ━━━
"quantity" is a multiplier on every macro for that food item:
  calories = food.cal   × quantity
  protein  = food.pro   × quantity
  carbs    = food.carbs × quantity
  fat      = food.fat   × quantity

SERVING QUANTITY RULES — follow strictly:
• Countable packaged items (sv contains: bar, bottle, can, egg, slice, sandwich,
  waffle, cookie, bag, piece, packet, patty, wrap, roll, bun, etc.)
  → WHOLE NUMBERS ONLY: 1, 2, 3. Never 1.18 bars or 0.8 eggs.
• Weight-based items (sv contains: oz, g, lb, ml)
  → Decimals fine: 0.5, 1.0, 1.5, 2.25, etc.
• Volume/measure items (scoop, cup, tbsp, tsp)
  → Use 0.5 increments: 0.5, 1.0, 1.5, 2.0. Not 1.18 scoops.

━━━ FOOD SELECTION STRATEGY ━━━
The macro split is ~${proPct}% protein / ~${carbsPct}% carbs / ~${fatPct}% fat.
When choosing foods, balance high-protein sources, carb sources, and fat sources
so the day's totals match this split. Do not over-select protein foods at the
expense of carbs and fat, or vice-versa.

━━━ RULES ━━━
1. ALL FOUR targets must land within their ±5% allowed ranges EVERY day.
2. If a food choice pushes one macro out of range, swap it or adjust the quantity.
3. Each day: 4 meals — Breakfast, Lunch, Dinner, Snack.
4. Each item must reference a valid "foodId" from the list below.
5. Vary foods across days; avoid repeating the same item daily.
6. Apply dietary restrictions from COACH PREFERENCES.
${preferences ? '7. Coach preferences can override a target only if they name an explicit number (e.g. "aim for 1600 kcal").' : ''}

AVAILABLE FOODS (ALL VALUES PER SERVING AT quantity=1):
${foodJson}

Respond with ONLY this JSON (no markdown):
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

  const response = await apiFetch('/api/ai/messages', {
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

  // Hydrate foodId references, then apply the calorie safety net.
  // Because scaling is proportional, a correctly-balanced macro split from Kay
  // will remain balanced after scaling.
  const hydratedDays = parsed.days.map((day) => {
    const rawMeals = Object.fromEntries(
      Object.entries(day.meals).map(([mealName, items]) => [
        mealName,
        items
          .map((item) => {
            const food = resolveFood(item.foodId, customFoods)
            if (!food) return null
            const rawQty = item.quantity || 1
            const qty = snapQuantity(rawQty, food.servingUnit)
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
