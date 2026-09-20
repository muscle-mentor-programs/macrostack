import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.3";
import { validEmailSignature } from "../_shared/retail-email-signature.mjs";
serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });
  const body = await req.text();
  if (
    !(await validEmailSignature(
      body,
      req.headers,
      Deno.env.get("RETAIL_RESEND_WEBHOOK_SECRET"),
    ))
  )
    return new Response("Invalid signature", { status: 403 });
  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid event", { status: 400 });
  }
  const states: Record<string, string> = {
    "email.delivered": "delivered",
    "email.bounced": "failed",
    "email.complained": "suppressed",
    "email.suppressed": "suppressed",
  };
  const state = states[event.type];
  if (!state || !event.data?.email_id) return new Response("ok");
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const lookup = await admin
    .from("retail_deliveries")
    .select("id,relationship_id,status")
    .eq("provider_id", event.data.email_id)
    .eq("channel", "email");
  if (lookup.error) return new Response("Retry", { status: 500 });
  for (const job of lookup.data || []) {
    if (state === "delivered" && ["failed", "suppressed"].includes(job.status))
      continue;
    const saved = await admin
      .from("retail_deliveries")
      .update({
        status: state,
        error_code: state === "delivered" ? null : event.type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    if (saved.error) return new Response("Retry", { status: 500 });
    if (state !== "delivered") {
      const optout = await admin
        .from("retail_contact_preferences")
        .update({ email_enabled: false })
        .eq("relationship_id", job.relationship_id);
      if (optout.error) return new Response("Retry", { status: 500 });
    }
  }
  return new Response("ok");
});
