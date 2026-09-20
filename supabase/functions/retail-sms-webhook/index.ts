import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.3";
import { validTwilioSignature } from "../_shared/retail-sms.mjs";
serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });
  const params = new URLSearchParams(await req.text()),
    url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/retail-sms-webhook`;
  if (
    !(await validTwilioSignature(
      url,
      params,
      req.headers.get("x-twilio-signature"),
      Deno.env.get("TWILIO_AUTH_TOKEN"),
    )) ||
    params.get("AccountSid") !== Deno.env.get("TWILIO_ACCOUNT_SID")
  )
    return new Response("Invalid signature", { status: 403 });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const optout = (params.get("OptOutType") || params.get("Body") || "")
    .trim()
    .toUpperCase();
  if (
    [
      "STOP",
      "STOPALL",
      "UNSUBSCRIBE",
      "CANCEL",
      "END",
      "QUIT",
      "REVOKE",
      "OPTOUT",
    ].includes(optout)
  ) {
    const result = await admin
      .from("retail_contact_preferences")
      .update({ sms_enabled: false })
      .eq("verified_phone", params.get("From") || "");
    if (result.error) return new Response("Retry", { status: 500 });
  }
  const state = params.get("MessageStatus"),
    sid = params.get("MessageSid");
  if (sid && ["delivered", "failed", "undelivered"].includes(state || "")) {
    const result = await admin
      .from("retail_deliveries")
      .update({
        status: state === "delivered" ? "delivered" : "failed",
        error_code: state === "delivered" ? null : "sms_delivery_failed",
        updated_at: new Date().toISOString(),
      })
      .eq("provider_id", sid)
      .eq("channel", "sms")
      .in("status", ["sending", "accepted", "unknown"]);
    if (result.error) return new Response("Retry", { status: 500 });
  }
  return new Response("<Response/>", {
    headers: { "Content-Type": "text/xml" },
  });
});
