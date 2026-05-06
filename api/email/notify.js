/**
 * POST /api/email/notify
 * Sends a notification email for new messages or new account creation.
 *
 * Body:
 *   type: 'message' | 'welcome'
 *
 *   For 'message':
 *     { recipientEmail, recipientName, senderName, senderRole, preview }
 *
 *   For 'welcome':
 *     { recipientEmail, name, role }
 */
import { Resend } from 'resend'
import { newMessageTemplate, welcomeTemplate } from '../../src/lib/emailTemplates.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM_EMAIL || 'MacroStack <onboarding@resend.dev>'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured' })
  }

  const { type, recipientEmail, ...payload } = req.body

  if (!type || !recipientEmail) {
    return res.status(400).json({ error: 'Missing type or recipientEmail' })
  }

  try {
    let subject, html

    if (type === 'message') {
      const { recipientName, senderName, senderRole, preview } = payload
      subject = `New message from ${senderName}`
      html    = newMessageTemplate({ recipientName, senderName, senderRole, preview })
    } else if (type === 'welcome') {
      const { name, role } = payload
      subject = 'Welcome to MacroStack'
      html    = welcomeTemplate({ name, role })
    } else {
      return res.status(400).json({ error: `Unknown notification type: ${type}` })
    }

    await resend.emails.send({ from: FROM, to: recipientEmail, subject, html })
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
