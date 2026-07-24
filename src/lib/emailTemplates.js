/**
 * Branded HTML email templates for MacroStack.
 * All styles are inline — required for email client compatibility.
 */

const BRAND = {
  bg:      '#0D0C0A',
  card:    '#1C1A18',
  border:  '#2A2724',
  cream:   '#E8E4DC',
  brown:   '#9A7B55',
  muted:   '#7A756E',
  dim:     '#3A3733',
  olive:   '#6B7A52',
}

function shell(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>MacroStack</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">

      <!-- Logo -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr>
          <td style="padding-bottom:28px;text-align:center;">
            <span style="font-family:Impact,'Arial Black',sans-serif;font-size:32px;letter-spacing:6px;color:${BRAND.cream};">MACRO</span><span style="font-family:Impact,'Arial Black',sans-serif;font-size:32px;letter-spacing:6px;color:${BRAND.brown};">STACK</span>
            <p style="margin:4px 0 0;font-size:11px;letter-spacing:4px;color:${BRAND.muted};">NUTRITION OS</p>
          </td>
        </tr>
      </table>

      <!-- Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
        <tr><td style="padding:36px 36px 32px;">
          ${body}
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin-top:24px;">
        <tr>
          <td style="text-align:center;padding:0 16px;">
            <p style="margin:0;font-size:11px;color:${BRAND.dim};letter-spacing:1px;">
              MacroStack · Nutrition coaching platform<br/>
              <a href="https://getmacrostack.com" style="color:${BRAND.muted};text-decoration:none;">getmacrostack.com</a>
            </p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`
}

// ── Template: Coach broadcast ─────────────────────────────────────────────────
export function coachBroadcastTemplate({ coachName, subject, body, clientName }) {
  return shell(`
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:${BRAND.muted};">MESSAGE FROM YOUR COACH</p>
    <h1 style="margin:0 0 24px;font-family:Impact,'Arial Black',sans-serif;font-size:26px;letter-spacing:4px;color:${BRAND.cream};">${subject.toUpperCase()}</h1>

    ${clientName ? `<p style="margin:0 0 16px;font-size:13px;color:${BRAND.muted};">Hi ${clientName},</p>` : ''}

    <div style="background:${BRAND.bg};border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.cream};white-space:pre-wrap;">${body}</p>
    </div>

    ${coachName ? `<p style="margin:0;font-size:13px;color:${BRAND.muted};">– ${coachName}</p>` : ''}

    <hr style="border:none;border-top:1px solid ${BRAND.border};margin:28px 0 20px;"/>
    <p style="margin:0;font-size:12px;color:${BRAND.dim};text-align:center;">
      Log into the app to reply to your coach.<br/>
      <a href="https://getmacrostack.com" style="color:${BRAND.brown};text-decoration:none;letter-spacing:2px;font-size:11px;">OPEN MACROSTACK →</a>
    </p>
  `)
}

// ── Template: Meal plan delivery ─────────────────────────────────────────────
export function mealPlanTemplate({ clientName, planName, days, coachName }) {
  const dayRows = days.slice(0, 3).map((day) => {
    const cals = Object.values(day.meals).flat().reduce((s, i) => s + (i.calories || 0), 0)
    const prot = Object.values(day.meals).flat().reduce((s, i) => s + (i.protein  || 0), 0)
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">
          <span style="font-size:12px;letter-spacing:2px;color:${BRAND.muted};">${day.label.toUpperCase()}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};text-align:right;">
          <span style="font-size:13px;color:${BRAND.cream};">${Math.round(cals)} kcal</span>
          <span style="font-size:11px;color:${BRAND.muted};margin-left:8px;">${Math.round(prot)}g protein</span>
        </td>
      </tr>`
  }).join('')

  return shell(`
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:${BRAND.olive};">YOUR MEAL PLAN IS READY</p>
    <h1 style="margin:0 0 24px;font-family:Impact,'Arial Black',sans-serif;font-size:26px;letter-spacing:4px;color:${BRAND.cream};">${planName.toUpperCase()}</h1>

    <p style="margin:0 0 20px;font-size:13px;color:${BRAND.muted};">Hi ${clientName}, your coach has put together a ${days.length}-day meal plan. A full PDF is attached.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};border-radius:10px;padding:4px 20px;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};">
          <span style="font-size:11px;letter-spacing:3px;color:${BRAND.dim};">DAY</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};text-align:right;">
          <span style="font-size:11px;letter-spacing:3px;color:${BRAND.dim};">TARGETS</span>
        </td>
      </tr>
      ${dayRows}
      ${days.length > 3 ? `<tr><td colspan="2" style="padding:10px 0;text-align:center;font-size:11px;color:${BRAND.dim};">+ ${days.length - 3} more days in the attached PDF</td></tr>` : ''}
    </table>

    <a href="https://getmacrostack.com" style="display:block;background:${BRAND.olive};color:${BRAND.bg};text-align:center;text-decoration:none;font-family:Impact,'Arial Black',sans-serif;font-size:13px;letter-spacing:4px;padding:14px;border-radius:10px;margin-bottom:20px;">OPEN IN APP →</a>

    ${coachName ? `<p style="margin:0;font-size:12px;color:${BRAND.muted};text-align:center;">Plan created by ${coachName}</p>` : ''}
  `)
}

// ── Template: Weekly progress report ─────────────────────────────────────────
export function weeklyReportTemplate({
  clientName, rangeLabel, avgCal, avgProtein, daysLogged,
  weightChange, weightUnit, calAdherencePct, streak, coachName,
}) {
  const stat = (val, label) => `
    <td style="padding:14px 8px;text-align:center;border:1px solid ${BRAND.border};border-radius:10px;">
      <div style="font-family:Impact,'Arial Black',sans-serif;font-size:22px;color:${BRAND.cream};">${val}</div>
      <div style="font-size:10px;letter-spacing:1px;color:${BRAND.muted};margin-top:4px;">${label}</div>
    </td>`
  const changeStr = weightChange === null || weightChange === undefined
    ? '—'
    : `${weightChange > 0 ? '+' : ''}${weightChange}`

  return shell(`
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:${BRAND.olive};">YOUR WEEKLY REPORT</p>
    <h1 style="margin:0 0 8px;font-family:Impact,'Arial Black',sans-serif;font-size:26px;letter-spacing:4px;color:${BRAND.cream};">LAST 7 DAYS</h1>
    <p style="margin:0 0 22px;font-size:12px;color:${BRAND.muted};">${rangeLabel}</p>

    <p style="margin:0 0 18px;font-size:13px;color:${BRAND.muted};">Hi ${clientName}, here's how your week went. The full breakdown is in the attached PDF.</p>

    <table width="100%" cellpadding="0" cellspacing="6" style="margin-bottom:20px;">
      <tr>
        ${stat(Math.round(avgCal || 0), 'avg kcal')}
        ${stat(`${Math.round(avgProtein || 0)}g`, 'avg protein')}
        ${stat(`${daysLogged}/7`, 'days logged')}
        ${stat(`${changeStr} ${weightUnit || ''}`.trim(), 'weight change')}
      </tr>
    </table>

    <p style="margin:0 0 22px;font-size:12px;color:${BRAND.cream};text-align:center;">
      Calorie adherence <span style="color:${BRAND.olive};">${calAdherencePct}%</span>
      &nbsp;·&nbsp; Current log streak <span style="color:${BRAND.brown};">${streak} ${streak === 1 ? 'day' : 'days'}</span>
    </p>

    <a href="https://getmacrostack.com" style="display:block;background:${BRAND.olive};color:${BRAND.bg};text-align:center;text-decoration:none;font-family:Impact,'Arial Black',sans-serif;font-size:13px;letter-spacing:4px;padding:14px;border-radius:10px;margin-bottom:20px;">OPEN IN APP →</a>

    ${coachName ? `<p style="margin:0;font-size:12px;color:${BRAND.muted};text-align:center;">Your coach: ${coachName}</p>` : ''}
  `)
}

// ── Template: New message notification ───────────────────────────────────────
export function newMessageTemplate({ recipientName, senderName, senderRole, preview }) {
  const accentColor = senderRole === 'coach' ? BRAND.brown : BRAND.olive
  const label       = senderRole === 'coach' ? 'MESSAGE FROM YOUR COACH' : 'MESSAGE FROM YOUR USER'

  return shell(`
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:${accentColor};">${label}</p>
    <h1 style="margin:0 0 24px;font-family:Impact,'Arial Black',sans-serif;font-size:26px;letter-spacing:4px;color:${BRAND.cream};">NEW MESSAGE</h1>

    <p style="margin:0 0 16px;font-size:13px;color:${BRAND.muted};">Hi ${recipientName}, ${senderName} sent you a message:</p>

    <div style="background:${BRAND.bg};border-left:3px solid ${accentColor};border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:${BRAND.cream};line-height:1.6;">${preview}</p>
    </div>

    <a href="https://getmacrostack.com" style="display:block;background:${accentColor};color:${BRAND.bg};text-align:center;text-decoration:none;font-family:Impact,'Arial Black',sans-serif;font-size:13px;letter-spacing:4px;padding:14px;border-radius:10px;">OPEN MESSAGES →</a>
  `)
}

// ── Template: Automated reminder (log meals / submit check-in) ───────────────
export function reminderTemplate({ recipientName, coachName, missedLog, missedCheckin }) {
  const items = []
  if (missedLog) items.push({
    title: 'LOG TODAY’S MEALS',
    body:  'You haven’t logged anything today. Even a quick estimate keeps your data — and your coaching — accurate.',
  })
  if (missedCheckin) items.push({
    title: 'SUBMIT YOUR WEEKLY CHECK-IN',
    body:  'It’s been over a week since your last check-in. It takes under a minute and helps your coach adjust your targets.',
  })

  const rows = items.map((it) => `
    <div style="background:${BRAND.bg};border-left:3px solid ${BRAND.olive};border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:12px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;color:${BRAND.cream};font-family:Impact,'Arial Black',sans-serif;">${it.title}</p>
      <p style="margin:0;font-size:13px;color:${BRAND.muted};line-height:1.6;">${it.body}</p>
    </div>`).join('')

  return shell(`
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:${BRAND.olive};">FRIENDLY REMINDER</p>
    <h1 style="margin:0 0 24px;font-family:Impact,'Arial Black',sans-serif;font-size:26px;letter-spacing:4px;color:${BRAND.cream};">STAY ON TRACK</h1>

    <p style="margin:0 0 20px;font-size:13px;color:${BRAND.muted};">Hi ${recipientName || 'there'}, a quick nudge${coachName ? ` from ${coachName}'s MacroStack` : ''}:</p>

    ${rows}

    <a href="https://getmacrostack.com" style="display:block;background:${BRAND.olive};color:${BRAND.bg};text-align:center;text-decoration:none;font-family:Impact,'Arial Black',sans-serif;font-size:13px;letter-spacing:4px;padding:14px;border-radius:10px;margin-top:12px;">OPEN MACROSTACK →</a>

    <p style="margin:20px 0 0;font-size:11px;color:${BRAND.dim};text-align:center;">You can turn reminder emails off anytime from your profile in the app.</p>
  `)
}

// ── Template: Welcome / account created ──────────────────────────────────────
export function welcomeTemplate({ name, role, loginUrl }) {
  const isCoach   = role !== 'client'
  const accentColor = isCoach ? BRAND.brown : BRAND.olive
  const roleLabel   = isCoach ? 'COACH PORTAL' : 'USER APP'

  return shell(`
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:${accentColor};">WELCOME TO MACROSTACK</p>
    <h1 style="margin:0 0 8px;font-family:Impact,'Arial Black',sans-serif;font-size:26px;letter-spacing:4px;color:${BRAND.cream};">YOUR ACCOUNT IS READY</h1>
    <p style="margin:0 0 28px;font-size:13px;color:${BRAND.muted};">Hi ${name}, your ${isCoach ? 'coach' : 'user'} account has been created.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};border-radius:10px;padding:20px;margin-bottom:24px;">
      <tr>
        <td style="font-size:11px;letter-spacing:3px;color:${BRAND.dim};padding-bottom:12px;">WHAT YOU CAN DO</td>
      </tr>
      ${isCoach ? `
      <tr><td style="padding:6px 0;font-size:13px;color:${BRAND.cream};">✓ &nbsp;Manage user profiles & goals</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:${BRAND.cream};">✓ &nbsp;Build and assign meal plans with AI</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:${BRAND.cream};">✓ &nbsp;Track user macro compliance</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:${BRAND.cream};">✓ &nbsp;Message users directly in the app</td></tr>
      ` : `
      <tr><td style="padding:6px 0;font-size:13px;color:${BRAND.cream};">✓ &nbsp;Log meals and track daily macros</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:${BRAND.cream};">✓ &nbsp;Monitor weight trends over time</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:${BRAND.cream};">✓ &nbsp;View your coach-assigned meal plans</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:${BRAND.cream};">✓ &nbsp;Message your coach directly</td></tr>
      `}
    </table>

    <a href="${loginUrl || 'https://getmacrostack.com'}" style="display:block;background:${accentColor};color:${BRAND.bg};text-align:center;text-decoration:none;font-family:Impact,'Arial Black',sans-serif;font-size:13px;letter-spacing:4px;padding:14px;border-radius:10px;">OPEN ${roleLabel} →</a>
  `)
}

// ── Template: Password reset (for Supabase dashboard — plain HTML) ────────────
export const passwordResetTemplate = shell(`
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:#9A7B55;">ACCOUNT SECURITY</p>
  <h1 style="margin:0 0 8px;font-family:Impact,'Arial Black',sans-serif;font-size:26px;letter-spacing:4px;color:#E8E4DC;">RESET YOUR PASSWORD</h1>
  <p style="margin:0 0 28px;font-size:13px;color:#7A756E;">We received a request to reset your MacroStack password. Click the button below to choose a new one.</p>

  <a href="{{ .ConfirmationURL }}" style="display:block;background:#9A7B55;color:#0D0C0A;text-align:center;text-decoration:none;font-family:Impact,'Arial Black',sans-serif;font-size:13px;letter-spacing:4px;padding:14px;border-radius:10px;margin-bottom:24px;">RESET PASSWORD →</a>

  <p style="margin:0;font-size:12px;color:#3A3733;text-align:center;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
`)

// ── Template: Email confirmation (for Supabase dashboard) ────────────────────
export const emailConfirmTemplate = shell(`
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:#6B7A52;">ALMOST THERE</p>
  <h1 style="margin:0 0 8px;font-family:Impact,'Arial Black',sans-serif;font-size:26px;letter-spacing:4px;color:#E8E4DC;">CONFIRM YOUR EMAIL</h1>
  <p style="margin:0 0 28px;font-size:13px;color:#7A756E;">Click below to confirm your email address and activate your MacroStack account.</p>

  <a href="{{ .ConfirmationURL }}" style="display:block;background:#6B7A52;color:#0D0C0A;text-align:center;text-decoration:none;font-family:Impact,'Arial Black',sans-serif;font-size:13px;letter-spacing:4px;padding:14px;border-radius:10px;margin-bottom:24px;">CONFIRM EMAIL →</a>

  <p style="margin:0;font-size:12px;color:#3A3733;text-align:center;">If you didn't create a MacroStack account, you can safely ignore this email.</p>
`)
