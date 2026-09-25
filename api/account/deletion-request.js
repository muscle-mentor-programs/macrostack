import { Resend } from 'resend'
import { handleNativeCors } from '../_cors.js'
import { requireUser } from '../_auth.js'

const from = process.env.RESEND_FROM_EMAIL || 'MacroStack <onboarding@resend.dev>'
const deletionInbox = process.env.ACCOUNT_DELETION_EMAIL || 'branden@bullfit.com'

export default async function handler(req, res) {
  if (handleNativeCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  const auth = await requireUser(req, res)
  if (!auth) return
  if (!auth.user.email || !auth.user.email_confirmed_at) {
    return res.status(403).json({ error: 'Confirm your account email before requesting deletion.' })
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'Deletion requests are temporarily unavailable. Please retry shortly.' })
  }

  const requestId = crypto.randomUUID()
  const resend = new Resend(process.env.RESEND_API_KEY)
  const requestedAt = new Date().toISOString()

  try {
    const staff = await resend.emails.send({
      from,
      to: deletionInbox,
      subject: `MacroStack account deletion request ${requestId}`,
      text: [
        'A signed-in MacroStack user requested permanent account deletion in the app.',
        `Request ID: ${requestId}`,
        `User ID: ${auth.user.id}`,
        `Account email: ${auth.user.email}`,
        `Requested at: ${requestedAt}`,
        '',
        'Verify the account and any active subscriptions, remove personal data and Storage objects, delete the Auth user, then email the user when complete. See docs/account-deletion.md.',
      ].join('\n'),
    })
    if (staff.error) throw staff.error

    // A failed receipt does not discard a request already delivered to staff.
    const receipt = await resend.emails.send({
      from,
      to: auth.user.email,
      subject: 'We received your MacroStack account deletion request',
      text: [
        'We received your request to permanently delete your MacroStack account.',
        `Request ID: ${requestId}`,
        'Our team will review the account, handle any active subscription, and email you when deletion is complete.',
        'You can reply to this email with questions. Your account remains available until deletion is complete.',
      ].join('\n\n'),
    })
    if (receipt.error) console.error('[account-deletion] receipt failed', requestId)

    return res.status(200).json({ ok: true, requestId })
  } catch (error) {
    console.error('[account-deletion] request delivery failed', requestId, error?.message)
    return res.status(502).json({ error: 'Could not send the deletion request. Please retry.' })
  }
}
