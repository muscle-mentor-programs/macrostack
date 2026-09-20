import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.3";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
};
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const reply = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const caller = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("authorization") || "" },
        },
      },
    );
    const {
      data: { user },
      error,
    } = await caller.auth.getUser();
    if (error || !user) return reply({ error: "Sign in required" }, 401);
    const body = await req.json();
    const result = await caller.rpc("retail_operations", {
      lid: body.location_id,
    });
    if (result.error) return reply({ error: "Store manager required" }, 403);
    const has = (...names: string[]) =>
      names.every((n) => Boolean(Deno.env.get(n)));
    return reply({
      ...result.data,
      configuration: {
        email:
          Deno.env.get("RETAIL_EMAIL_ENABLED") === "true" &&
          has(
            "RESEND_API_KEY",
            "RESEND_FROM_EMAIL",
            "RETAIL_RESEND_WEBHOOK_SECRET",
          ),
        sms:
          Deno.env.get("RETAIL_SMS_ENABLED") === "true" &&
          has(
            "TWILIO_ACCOUNT_SID",
            "TWILIO_AUTH_TOKEN",
            "TWILIO_MESSAGING_SERVICE_SID",
          ),
        worker: has("RETAIL_DELIVERY_WORKER_KEY"),
        billing: has("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"),
      },
    });
  } catch {
    return reply({ error: "Could not check store operations" }, 500);
  }
});
