import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.3";
serve(async (req) => {
  const url = new URL(req.url),
    token = url.searchParams.get("token") || "";
  if (!/^[0-9a-f-]{36}$/i.test(token))
    return new Response("Invalid preference link", { status: 400 });
  if (req.method === "GET")
    return new Response(
      `<html><meta name="viewport" content="width=device-width"><title>MacroStack preferences</title><body style="font-family:system-ui;max-width:480px;margin:60px auto;padding:24px"><h1>Stop store reminders</h1><p>This stops email and text reminders for this store connection. Your account stays active.</p><form method="post"><button style="padding:14px">Unsubscribe</button></form></body></html>`,
      {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { error } = await admin.rpc("retail_unsubscribe", { token });
  return new Response(
    error
      ? "Please retry."
      : "Store email and text reminders are now disabled.",
    { status: error ? 500 : 200, headers: { "Cache-Control": "no-store" } },
  );
});
