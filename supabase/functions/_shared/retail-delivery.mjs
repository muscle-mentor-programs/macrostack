export function quietHours(timezone, now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "America/Chicago",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  return hour < 9 || hour >= 20;
}
export function reminderText(store, site) {
  return `MacroStack: You have an update from ${store}. View it securely: ${site}/retail. Reply STOP to stop texts.`;
}
export function nextDeliveryState(channel, status) {
  if (status >= 200 && status < 300) return "accepted";
  if (status === 429) return "queued";
  if (status >= 500) return channel === "email" ? "queued" : "unknown";
  return "failed";
}
export async function deliverRetail({
  delivery,
  target,
  env,
  fetcher = fetch,
  now = new Date(),
}) {
  if (!target)
    return { status: "suppressed", error_code: "consent_or_access_revoked" };
  if (quietHours(target.timezone, now))
    return {
      status: "queued",
      available_at: new Date(now.getTime() + 60 * 60000).toISOString(),
      defer: true,
    };
  const site = env.SITE_URL || "https://www.getmacrostack.com";
  if (delivery.channel === "email") {
    if (
      env.RETAIL_EMAIL_ENABLED !== "true" ||
      !env.RESEND_API_KEY ||
      !env.RESEND_FROM_EMAIL
    )
      return {
        status: "queued",
        error_code: "email_not_configured",
        available_at: new Date(now.getTime() + 3600000).toISOString(),
        defer: true,
      };
    const unsubscribe = `${env.SUPABASE_URL}/functions/v1/retail-unsubscribe?token=${target.unsubscribe}`;
    try {
      const r = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `retail-${delivery.id}`,
        },
        body: JSON.stringify({
          from: env.RESEND_FROM_EMAIL,
          to: target.email,
          subject: "An update from your MacroStack store",
          text: `You have a new store update. Sign in to view it securely: ${site}/retail\n\nManage notification preferences: ${site}/retail\nStop store emails and texts: ${unsubscribe}\n\nMacroStack, LLC`,
          headers: {
            "List-Unsubscribe": `<${unsubscribe}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });
      const body = await r.json().catch(() => ({}));
      return {
        status:
          r.ok && !body.id ? "unknown" : nextDeliveryState("email", r.status),
        provider_id: body.id || null,
        error_code: r.ok ? null : `provider_${r.status}`,
      };
    } catch {
      return { status: "queued", error_code: "network_uncertain" };
    }
  }
  if (
    env.RETAIL_SMS_ENABLED !== "true" ||
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.TWILIO_MESSAGING_SERVICE_SID
  )
    return {
      status: "queued",
      error_code: "sms_not_configured",
      available_at: new Date(now.getTime() + 3600000).toISOString(),
      defer: true,
    };
  try {
    const r = await fetcher(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: target.phone,
          MessagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
          Body: reminderText(target.store, site),
          StatusCallback: `${env.SUPABASE_URL}/functions/v1/retail-sms-webhook`,
        }),
      },
    );
    const body = await r.json().catch(() => ({}));
    return {
      status:
        r.ok && !body.sid ? "unknown" : nextDeliveryState("sms", r.status),
      provider_id: body.sid || null,
      error_code: r.ok ? null : `provider_${r.status}`,
    };
  } catch {
    return { status: "unknown", error_code: "network_uncertain" };
  }
}
