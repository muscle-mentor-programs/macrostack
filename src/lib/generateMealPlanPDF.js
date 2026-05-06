/**
 * Client-side PDF generation for meal plans using jsPDF.
 * Returns a base64 string suitable for download or email attachment.
 */
import { jsPDF } from 'jspdf'

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const COLORS = {
  bg:     [13,  12,  10 ],
  card:   [28,  26,  24 ],
  border: [42,  39,  36 ],
  cream:  [232, 228, 220],
  brown:  [154, 123, 85 ],
  olive:  [107, 122, 82 ],
  muted:  [122, 117, 110],
  dim:    [58,  55,  51 ],
}

function setFill(doc, rgb) { doc.setFillColor(...rgb) }
function setDraw(doc, rgb) { doc.setDrawColor(...rgb) }
function setTxt(doc, rgb)  { doc.setTextColor(...rgb) }

function dayTotals(day) {
  return MEALS.reduce(
    (acc, m) => {
      const items = day.meals[m] || []
      return {
        calories: acc.calories + items.reduce((s, i) => s + (i.calories || 0), 0),
        protein:  acc.protein  + items.reduce((s, i) => s + (i.protein  || 0), 0),
        carbs:    acc.carbs    + items.reduce((s, i) => s + (i.carbs    || 0), 0),
        fat:      acc.fat      + items.reduce((s, i) => s + (i.fat      || 0), 0),
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export function generateMealPlanPDF(plan, client) {
  const doc   = new jsPDF({ unit: 'pt', format: 'letter' })
  const W     = doc.internal.pageSize.getWidth()
  const H     = doc.internal.pageSize.getHeight()
  const PAD   = 40
  const INNER = W - PAD * 2

  // ── Background ──────────────────────────────────────────────────────────────
  setFill(doc, COLORS.bg)
  doc.rect(0, 0, W, H, 'F')

  let y = PAD

  // ── Header bar ──────────────────────────────────────────────────────────────
  setFill(doc, COLORS.card)
  doc.roundedRect(PAD, y, INNER, 64, 6, 6, 'F')

  // Logo text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  setTxt(doc, COLORS.cream)
  doc.text('MACRO', PAD + 16, y + 28)
  const mW = doc.getTextWidth('MACRO')
  setTxt(doc, COLORS.brown)
  doc.text('STACK', PAD + 16 + mW + 2, y + 28)

  doc.setFontSize(8)
  setTxt(doc, COLORS.muted)
  doc.text('NUTRITION OS', PAD + 16, y + 44)

  // Plan name (right aligned)
  doc.setFontSize(10)
  setTxt(doc, COLORS.muted)
  doc.text('MEAL PLAN', W - PAD - 16, y + 24, { align: 'right' })
  doc.setFontSize(14)
  setTxt(doc, COLORS.cream)
  doc.text(plan.planName.toUpperCase(), W - PAD - 16, y + 42, { align: 'right' })

  y += 80

  // ── Client + summary strip ───────────────────────────────────────────────────
  if (client) {
    doc.setFontSize(9)
    setTxt(doc, COLORS.muted)
    doc.text(`CLIENT: ${client.name.toUpperCase()}`, PAD, y)
    if (client.goals) {
      const g = client.goals
      doc.text(
        `TARGETS: ${g.calories} kcal  ·  ${g.protein}g protein  ·  ${g.carbs}g carbs  ·  ${g.fat}g fat`,
        PAD, y + 14,
      )
    }
    y += 32
  }

  // ── Days ────────────────────────────────────────────────────────────────────
  for (let di = 0; di < plan.days.length; di++) {
    const day    = plan.days[di]
    const totals = dayTotals(day)

    // Check if we need a new page
    const estimatedHeight = 34 + MEALS.reduce((s, m) => {
      return s + (day.meals[m]?.length ? day.meals[m].length * 14 + 20 : 0)
    }, 0)

    if (y + estimatedHeight > H - PAD) {
      doc.addPage()
      setFill(doc, COLORS.bg)
      doc.rect(0, 0, W, H, 'F')
      y = PAD
    }

    // Day header
    setFill(doc, COLORS.card)
    doc.roundedRect(PAD, y, INNER, 28, 4, 4, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    setTxt(doc, COLORS.cream)
    doc.text(day.label.toUpperCase(), PAD + 12, y + 18)

    // Totals (right side of day header)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setTxt(doc, COLORS.muted)
    doc.text(
      `${Math.round(totals.calories)} kcal  ·  ${Math.round(totals.protein)}g P  ·  ${Math.round(totals.carbs)}g C  ·  ${Math.round(totals.fat)}g F`,
      W - PAD - 12, y + 18, { align: 'right' },
    )

    y += 34

    // Meals
    for (const meal of MEALS) {
      const items = day.meals[meal] || []
      if (!items.length) continue

      // Meal label
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      setTxt(doc, COLORS.olive)
      doc.text(meal.toUpperCase(), PAD + 8, y + 10)
      y += 16

      // Items
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      for (const item of items) {
        if (y + 14 > H - PAD) {
          doc.addPage()
          setFill(doc, COLORS.bg)
          doc.rect(0, 0, W, H, 'F')
          y = PAD
        }

        setTxt(doc, COLORS.cream)
        const name = item.brand ? `${item.name} — ${item.brand}` : item.name
        const label = item.quantity !== 1 ? `× ${item.quantity}  ${name}` : name
        doc.text(label, PAD + 16, y + 9, { maxWidth: INNER * 0.6 })

        setTxt(doc, COLORS.muted)
        doc.text(
          `${Math.round(item.calories)} kcal  ${Math.round(item.protein)}g P`,
          W - PAD - 8, y + 9, { align: 'right' },
        )

        y += 14
      }

      y += 4
    }

    y += 10
  }

  // ── Footer on last page ─────────────────────────────────────────────────────
  setTxt(doc, COLORS.dim)
  doc.setFontSize(8)
  doc.text(
    `Generated by MacroStack  ·  macrostack-plum.vercel.app  ·  ${new Date().toLocaleDateString()}`,
    W / 2, H - 20, { align: 'center' },
  )

  return doc
}

/**
 * Download the PDF in the browser.
 */
export function downloadMealPlanPDF(plan, client) {
  const doc = generateMealPlanPDF(plan, client)
  const filename = `${(plan.planName || 'meal-plan').replace(/\s+/g, '-').toLowerCase()}.pdf`
  doc.save(filename)
}

/**
 * Return the PDF as a base64 string (for sending as email attachment).
 */
export function mealPlanPDFBase64(plan, client) {
  const doc = generateMealPlanPDF(plan, client)
  return doc.output('datauristring').split(',')[1]
}
