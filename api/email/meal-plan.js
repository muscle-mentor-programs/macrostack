/**
 * POST /api/email/meal-plan
 * Send a meal plan as a branded PDF attachment.
 *
 * Body: { to: string, clientName: string, planName: string,
 *         pdfBase64: string, days: number, coachName?: string }
 */
import { Resend } from 'resend'
import { mealPlanTemplate } from '../../src/lib/emailTemplates.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM_EMAIL || 'MacroStack <coaching@macrostack.app>'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, clientName, planName, pdfBase64, days = [], coachName } = req.body

  if (!to || !clientName || !planName || !pdfBase64) {
    return res.status(400).json({ error: 'Missing required fields: to, clientName, planName, pdfBase64' })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured' })
  }

  try {
    const filename = `${planName.replace(/\s+/g, '-').toLowerCase()}.pdf`

    await resend.emails.send({
      from:    FROM,
      to,
      subject: `Your Meal Plan: ${planName}`,
      html:    mealPlanTemplate({ clientName, planName, days, coachName }),
      attachments: [
        {
          filename,
          content: pdfBase64,
        },
      ],
    })

    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
