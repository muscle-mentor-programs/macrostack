const esc = (value) =>
  String(value || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function retailEmail(kind, { url, store = "your store" } = {}) {
  const copy = {
    confirm: [
      "Confirm your retailer email",
      "ONE LAST STEP",
      "Confirm your email.",
      "Verify your work email to unlock your MacroStack retailer workspace. Your account stays locked until you confirm.",
      "Confirm email",
      "This is a single-use, time-limited link. If you did not create this account, you can ignore this email.",
    ],
    recovery: [
      "Reset your retailer password",
      "ACCOUNT SECURITY",
      "A fresh start.",
      "Use the secure link below to choose a new password for your retailer account.",
      "Reset password",
      "This is a single-use, time-limited link. If you did not request a reset, ignore this email. Your password has not changed.",
    ],
    welcome: [
      "Welcome to MacroStack for Retailers",
      "YOU’RE VERIFIED",
      "Your next chapter starts here.",
      "Your email is confirmed. Set up your business, invite your team, and bring customer nutrition into one connected workspace.",
      "Open your workspace",
      "Creating a workspace does not charge you. Store activation is a separate step.",
    ],
    staff: [
      "Your MacroStack team invitation",
      "YOUR TEAM IS WAITING",
      "Welcome to the team.",
      `You have been invited to work with ${store}. Use the invited work email to create or sign in to your separate retailer account.`,
      "Accept team invitation",
      "This invitation expires after seven days. Personal and coach accounts cannot accept staff invitations.",
    ],
    customer: [
      "Connect with your store on MacroStack",
      "NUTRITION. CONNECTED.",
      "Your support starts here.",
      `${store} has invited you to connect on MacroStack for nutrition plans, check-ins and support between visits. Use your existing customer account or create one with this email.`,
      "View invitation",
      "You choose whether to connect and share nutrition activity. This invitation expires after seven days.",
    ],
  }[kind];
  if (!copy) throw new Error("Unsupported email");
  const [subject, eyebrow, title, body, label, note] = copy;
  const link = new URL(url);
  if (link.origin !== "https://www.getmacrostack.com")
    throw new Error("Invalid email destination");
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>${esc(subject)}</title></head><body style="margin:0;background:#080b12;color:#d8e6f2;font-family:'Space Grotesk',Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${esc(body)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#080b12"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px"><tr><td style="padding-bottom:32px;font-family:'Barlow Condensed','Arial Narrow',Arial,sans-serif;font-weight:800;font-size:30px;letter-spacing:1px"><img src="https://www.getmacrostack.com/email/macrostack-wordmark.png" width="240" alt="MACROSTACK" style="display:block;width:240px;max-width:100%;height:auto;border:0"><div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;font-weight:400;color:#9aaabd;margin-top:9px">FOR RETAILERS</div></td></tr><tr><td style="background:#141a2b;border:1px solid #2b3850;border-top:3px solid #82ade1;border-radius:16px;padding:32px"><p style="color:#82ade1;font-size:11px;letter-spacing:2px;margin:0 0 20px">${esc(eyebrow)}</p><h1 style="font-family:'Barlow Condensed','Arial Narrow',Arial,sans-serif;font-size:32px;line-height:1.1;margin:0 0 20px">${esc(title)}</h1><p style="font-size:16px;line-height:1.65;color:#d8e6f2">${esc(body)}</p><table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0"><tr><td bgcolor="#82ade1" style="border-radius:9px"><a href="${esc(url)}" style="display:inline-block;padding:16px 24px;color:#080b12;font-weight:700;text-decoration:none;font-size:15px">${esc(label)} →</a></td></tr></table><p style="font-size:13px;line-height:1.6;color:#9aaabd">${esc(note)}</p><p style="border-top:1px solid #2b3850;padding-top:20px;font-size:12px;line-height:1.6;color:#9aaabd">Button not working? Copy this link into your browser:<br><a href="${esc(url)}" style="color:#82ade1;word-break:break-all">${esc(url)}</a></p></td></tr><tr><td style="padding:26px 4px;color:#9aaabd;font-size:12px;line-height:1.7">MacroStack, LLC<br>Questions? <a href="mailto:getmacrostack@gmail.com" style="color:#82ade1">getmacrostack@gmail.com</a></td></tr></table></td></tr></table></body></html>`;
  return {
    subject,
    html,
    text: `MACROSTACK\n${title}\n\n${body}\n\n${label}: ${url}\n\n${note}\n\nMacroStack, LLC · getmacrostack@gmail.com`,
  };
}
export async function sendRetailEmail({
  key,
  from,
  to,
  kind,
  url,
  store,
  idempotencyKey,
  fetcher = fetch,
}) {
  if (!key || !from || /onboarding@resend\.dev/i.test(from))
    throw new Error(
      "Email delivery is not configured. Please contact getmacrostack@gmail.com.",
    );
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: "getmacrostack@gmail.com",
      ...retailEmail(kind, { url, store }),
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.id)
    throw new Error("Email could not be sent. Please retry shortly.");
  return result.id;
}
