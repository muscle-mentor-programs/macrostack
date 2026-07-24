import { requireUser } from '../_auth.js'
/**
 * POST /api/email/report
 * Send a client's weekly progress report as a branded PDF attachment.
 *
 * Body: {
 *   to: string, clientName: string, rangeLabel: string, pdfBase64: string,
 *   avgCal?: number, avgProtein?: number, daysLogged?: number,
 *   weightChange?: number|null, weightUnit?: string,
 *   calAdherencePct?: number, streak?: number, coachName?: string
 * }
 */
import { Resend } from 'resend'
import { weeklyReportTemplate } from '../../src/lib/emailTemplates.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM_EMAIL || 'MacroStack <onboarding@resend.dev>'

export default async function handler(req, res) {
  if (!(await requireUser(req, res))) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    to, clientName, rangeLabel, pdfBase64,
    avgCal, avgProtein, daysLogged, weightChange, weightUnit,
    calAdherencePct, streak, coachName,
  } = req.body

  if (!to || !clientName || !pdfBase64) {
    return res.status(400).json({ error: 'Missing required fields: to, clientName, pdfBase64' })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured' })
  }

  try {
    const stamp    = new Date().toISOString().slice(0, 10)
    const filename = `${clientName.replace(/\s+/g, '-').toLowerCase()}-weekly-report-${stamp}.pdf`

    await resend.emails.send({
      from:    FROM,
      to,
      subject: `Your MacroStack weekly report — ${rangeLabel || 'last 7 days'}`,
      html:    weeklyReportTemplate({
        clientName, rangeLabel, avgCal, avgProtein, daysLogged,
        weightChange, weightUnit, calAdherencePct, streak, coachName,
      }),
      attachments: [{ filename, content: pdfBase64 }],
    })

    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
