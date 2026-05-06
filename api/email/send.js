/**
 * POST /api/email/send
 * Coach broadcast email — sends to one or more client email addresses.
 *
 * Body: { to: string[], subject: string, body: string, coachName?: string, clientNames?: Record<string,string> }
 */
import { Resend } from 'resend'
import { coachBroadcastTemplate } from '../../src/lib/emailTemplates.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM_EMAIL || 'MacroStack <onboarding@resend.dev>'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, subject, body, coachName, clientNames = {} } = req.body

  if (!Array.isArray(to) || !to.length || !subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured' })
  }

  try {
    const results = await Promise.allSettled(
      to.map((email) =>
        resend.emails.send({
          from:     FROM,
          to:       email,
          subject,
          html: coachBroadcastTemplate({
            coachName,
            subject,
            body,
            clientName: clientNames[email] || null,
          }),
        })
      )
    )

    const sent   = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    res.status(200).json({ ok: true, sent, failed })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
