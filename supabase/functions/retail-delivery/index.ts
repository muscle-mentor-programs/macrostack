import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.3";
import { deliverRetail } from "../_shared/retail-delivery.mjs";
serve(async (req) => {
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const workerKey = Deno.env.get("RETAIL_DELIVERY_WORKER_KEY") || service;
  if (
    !service ||
    !workerKey ||
    req.headers.get("authorization") !== `Bearer ${workerKey}`
  )
    return new Response("Unauthorized", { status: 401 });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, service);
  const started = new Date().toISOString();
  await admin
    .from("retail_worker_health")
    .upsert({
      id: true,
      last_started_at: started,
      status: "running",
      processed: 0,
    });
  try {
    const { data: jobs, error } = await admin.rpc("retail_claim_deliveries", {
      batch_size: 25,
    });
    if (error) throw error;
    let processed = 0;
    for (const job of jobs || []) {
      const target = await admin.rpc("retail_delivery_target", { did: job.id });
      if (target.error) throw target.error;
      const result = await deliverRetail({
        delivery: job,
        target: target.data,
        env: Deno.env.toObject(),
      });
      const { defer, ...patch } = result;
      // Retry email within the provider's idempotency window. Never blindly resend ambiguous SMS.
      if (
        patch.status === "queued" &&
        Date.now() - Date.parse(job.created_at) > 23 * 3600000
      ) {
        patch.status = "failed";
        patch.error_code = "delivery_window_expired";
      }
      if (patch.status === "queued" && job.attempts >= 5 && !defer) {
        patch.status = "failed";
        patch.error_code = "retries_exhausted";
      }
      const saved = await admin
        .from("retail_deliveries")
        .update({
          ...patch,
          attempts: defer ? Math.max(0, job.attempts - 1) : job.attempts,
          available_at:
            patch.available_at ||
            new Date(
              Date.now() + Math.min(60, 2 ** job.attempts) * 60000,
            ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("status", "sending")
        .eq("claimed_at", job.claimed_at);
      if (saved.error) throw saved.error;
      processed++;
    }
    await admin
      .from("retail_worker_health")
      .update({
        last_finished_at: new Date().toISOString(),
        status: "ok",
        processed,
      })
      .eq("id", true)
      .eq("last_started_at", started);
    return Response.json({ processed });
  } catch {
    await admin
      .from("retail_worker_health")
      .update({ last_finished_at: new Date().toISOString(), status: "failed" })
      .eq("id", true)
      .eq("last_started_at", started);
    return Response.json(
      { error: "Delivery processing failed; inspect the delivery queue." },
      { status: 500 },
    );
  }
});
