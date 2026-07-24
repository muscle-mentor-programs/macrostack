/**
 * Client-side PDF generation for a client's weekly progress report using jsPDF.
 * Premium (Pro) feature — surfaced from the client Profile page.
 *
 * Mirrors the styling of generateMealPlanPDF.js so the two exports feel like
 * one product.
 */
import { jsPDF } from 'jspdf'
import { format, subDays } from 'date-fns'

const COLORS = {
  bg:     [13,  12,  10 ],
  card:   [28,  26,  24 ],
  border: [42,  39,  36 ],
  cream:  [232, 228, 220],
  brown:  [154, 123, 85 ],
  olive:  [107, 122, 82 ],
  muted:  [122, 117, 110],
  dim:    [58,  55,  51 ],
  red:    [198, 96,  96 ],
}

function setFill(doc, rgb) { doc.setFillColor(...rgb) }
function setTxt(doc, rgb)  { doc.setTextColor(...rgb) }

/**
 * Compute the last-7-days progress stats for a client. Shared by the PDF and
 * the on-screen insight tiles so the numbers always match.
 *
 * Returns:
 *   days        – [{ date, label, cal, protein, carbs, fat }] oldest → newest
 *   daysLogged  – count of days with any calories logged
 *   avg{Cal,Protein,Carbs,Fat} – averages across LOGGED days (0 if none)
 *   goals       – { calories, protein, carbs, fat }
 *   calOnTarget – days whose calories landed within ±10% of the calorie goal
 *   proteinHits – days that met or exceeded the protein goal
 *   streak      – consecutive logged days ending at the most recent day
 *   weight      – { current, unit, change } over the window (nulls if <2 entries)
 */
export function computeWeeklyStats(client) {
  const goals = {
    calories: client?.goals?.calories || 0,
    protein:  client?.goals?.protein  || 0,
    carbs:    client?.goals?.carbs    || 0,
    fat:      client?.goals?.fat      || 0,
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d       = subDays(new Date(), 6 - i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const entries = client?.log?.[dateStr] || []
    return {
      date:    dateStr,
      label:   format(d, 'EEE M/d'),
      cal:     entries.reduce((s, e) => s + (e.calories || 0), 0),
      protein: entries.reduce((s, e) => s + (e.protein  || 0), 0),
      carbs:   entries.reduce((s, e) => s + (e.carbs    || 0), 0),
      fat:     entries.reduce((s, e) => s + (e.fat      || 0), 0),
    }
  })

  const logged     = days.filter((d) => d.cal > 0)
  const daysLogged = logged.length
  const avg = (key) =>
    daysLogged > 0 ? logged.reduce((s, d) => s + d[key], 0) / daysLogged : 0

  const calOnTarget = goals.calories
    ? logged.filter((d) => Math.abs(d.cal - goals.calories) <= goals.calories * 0.1).length
    : 0
  const proteinHits = goals.protein
    ? logged.filter((d) => d.protein >= goals.protein).length
    : 0

  // Streak: consecutive logged days counting back from the newest day.
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].cal > 0) streak++
    else break
  }

  // Weight change across the window (first vs last logged entry in range).
  const start = format(subDays(new Date(), 6), 'yyyy-MM-dd')
  const wlog  = [...(client?.weightLog || [])]
    .filter((w) => w.date >= start)
    .sort((a, b) => a.date.localeCompare(b.date))
  const weight = wlog.length >= 2
    ? {
        current: wlog[wlog.length - 1].value,
        unit:    wlog[wlog.length - 1].unit || 'lbs',
        change:  +(wlog[wlog.length - 1].value - wlog[0].value).toFixed(1),
      }
    : { current: wlog[0]?.value ?? null, unit: wlog[0]?.unit || 'lbs', change: null }

  return {
    days,
    daysLogged,
    avgCal:     avg('cal'),
    avgProtein: avg('protein'),
    avgCarbs:   avg('carbs'),
    avgFat:     avg('fat'),
    goals,
    calOnTarget,
    proteinHits,
    streak,
    weight,
  }
}

export function generateProgressReportPDF(client) {
  const s     = computeWeeklyStats(client)
  const doc   = new jsPDF({ unit: 'pt', format: 'letter' })
  const W     = doc.internal.pageSize.getWidth()
  const H     = doc.internal.pageSize.getHeight()
  const PAD   = 40
  const INNER = W - PAD * 2

  setFill(doc, COLORS.bg)
  doc.rect(0, 0, W, H, 'F')

  let y = PAD

  // ── Header bar ──────────────────────────────────────────────────────────────
  setFill(doc, COLORS.card)
  doc.roundedRect(PAD, y, INNER, 64, 6, 6, 'F')

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

  doc.setFontSize(10)
  setTxt(doc, COLORS.muted)
  doc.text('WEEKLY REPORT', W - PAD - 16, y + 24, { align: 'right' })
  doc.setFontSize(12)
  setTxt(doc, COLORS.cream)
  const rangeLabel = `${format(subDays(new Date(), 6), 'MMM d')} – ${format(new Date(), 'MMM d, yyyy')}`
  doc.text(rangeLabel, W - PAD - 16, y + 42, { align: 'right' })

  y += 80

  // ── Client + targets strip ────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setTxt(doc, COLORS.muted)
  if (client?.name) doc.text(`USER: ${client.name.toUpperCase()}`, PAD, y)
  doc.text(
    `TARGETS: ${s.goals.calories} kcal  ·  ${s.goals.protein}g protein  ·  ${s.goals.carbs}g carbs  ·  ${s.goals.fat}g fat`,
    PAD, y + 14,
  )
  y += 34

  // ── Summary stat cards ──────────────────────────────────────────────────────
  const cards = [
    { val: Math.round(s.avgCal).toString(),        unit: 'avg kcal / day' },
    { val: `${Math.round(s.avgProtein)}g`,          unit: 'avg protein / day' },
    { val: `${s.daysLogged}/7`,                     unit: 'days logged' },
    {
      val:  s.weight.change === null ? '—' : `${s.weight.change > 0 ? '+' : ''}${s.weight.change}`,
      unit: `${s.weight.unit} change`,
    },
  ]
  const gap = 10
  const cardW = (INNER - gap * (cards.length - 1)) / cards.length
  cards.forEach((c, i) => {
    const cx = PAD + i * (cardW + gap)
    setFill(doc, COLORS.card)
    doc.roundedRect(cx, y, cardW, 54, 5, 5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    setTxt(doc, COLORS.cream)
    doc.text(c.val, cx + 12, y + 26)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setTxt(doc, COLORS.muted)
    doc.text(c.unit, cx + 12, y + 42)
  })
  y += 74

  // ── Adherence line ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setTxt(doc, COLORS.olive)
  doc.text('ADHERENCE', PAD, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setTxt(doc, COLORS.cream)
  doc.text(
    `Calorie target hit ${s.calOnTarget}/${s.daysLogged || 0} logged days   ·   ` +
    `Protein goal met ${s.proteinHits}/${s.daysLogged || 0} days   ·   ` +
    `Current log streak ${s.streak} ${s.streak === 1 ? 'day' : 'days'}`,
    PAD, y,
  )
  y += 26

  // ── Day-by-day table ────────────────────────────────────────────────────────
  const cols = [
    { key: 'label',   header: 'DAY',    w: 0.28, align: 'left'  },
    { key: 'cal',     header: 'KCAL',   w: 0.16, align: 'right' },
    { key: 'protein', header: 'P',      w: 0.13, align: 'right' },
    { key: 'carbs',   header: 'C',      w: 0.13, align: 'right' },
    { key: 'fat',     header: 'F',      w: 0.13, align: 'right' },
    { key: 'vs',      header: 'VS GOAL', w: 0.17, align: 'right' },
  ]
  const colX = (i) => PAD + 12 + cols.slice(0, i).reduce((sum, c) => sum + c.w * INNER, 0)
  const colRight = (i) => PAD + cols.slice(0, i + 1).reduce((sum, c) => sum + c.w * INNER, 0) - 12

  // Header row
  setFill(doc, COLORS.card)
  doc.roundedRect(PAD, y, INNER, 22, 4, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  setTxt(doc, COLORS.muted)
  cols.forEach((c, i) => {
    if (c.align === 'left') doc.text(c.header, colX(i), y + 14)
    else doc.text(c.header, colRight(i), y + 14, { align: 'right' })
  })
  y += 26

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  s.days.forEach((d) => {
    const logged = d.cal > 0
    const diff   = s.goals.calories && logged ? Math.round(d.cal - s.goals.calories) : null
    cols.forEach((c, i) => {
      let text
      if (c.key === 'label')      { setTxt(doc, COLORS.cream); text = d.label }
      else if (c.key === 'vs') {
        if (diff === null) { setTxt(doc, COLORS.dim); text = '—' }
        else { setTxt(doc, diff > 0 ? COLORS.red : COLORS.olive); text = `${diff > 0 ? '+' : ''}${diff}` }
      } else {
        setTxt(doc, logged ? COLORS.cream : COLORS.dim)
        text = logged ? Math.round(d[c.key]).toString() : '—'
      }
      if (c.align === 'left') doc.text(text, colX(i), y + 9)
      else doc.text(text, colRight(i), y + 9, { align: 'right' })
    })
    y += 18
  })

  // ── Footer ──────────────────────────────────────────────────────────────────
  setTxt(doc, COLORS.dim)
  doc.setFontSize(8)
  doc.text(
    `Generated by MacroStack  ·  getmacrostack.com  ·  ${new Date().toLocaleDateString()}`,
    W / 2, H - 20, { align: 'center' },
  )

  return doc
}

/** Download the report PDF in the browser. */
export function downloadProgressReportPDF(client) {
  const doc  = generateProgressReportPDF(client)
  const name = (client?.name || 'progress').replace(/\s+/g, '-').toLowerCase()
  const stamp = format(new Date(), 'yyyy-MM-dd')
  doc.save(`${name}-weekly-report-${stamp}.pdf`)
}

/** Return the report PDF as base64 (for emailing as an attachment later). */
export function progressReportPDFBase64(client) {
  return generateProgressReportPDF(client).output('datauristring').split(',')[1]
}
