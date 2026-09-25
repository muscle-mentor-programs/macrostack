import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.3";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { checkoutContract } from "../_shared/retail-billing.mjs";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
};
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  if (req.method !== "POST")
    return respond({ error: "Method not allowed" }, 405);
  let locked = false,
    admin: any,
    cid: string | undefined;
  try {
    const url = Deno.env.get("SUPABASE_URL")!,
      service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const token = req.headers.get("authorization") || "";
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: token } },
    });
    const {
      data: { user },
      error: authError,
    } = await caller.auth.getUser();
    if (authError || !user) return respond({ error: "Sign in required" }, 401);
    if (user.email?.toLowerCase() === "demo@getmacrostack.com")
      return respond({ error: "Billing is unavailable in the demo workspace" }, 403);
    const body = await req.json();
    cid = body.contract_id;
    const { data: c, error } = await caller
      .from("retail_contracts")
      .select("*")
      .eq("id", cid)
      .single();
    if (error || !c)
      return respond({ error: "Store billing administrator required" }, 403);
    const { data: profile } = await caller
      .from("profiles")
      .select("admin_override")
      .eq("id", user.id)
      .single();
    if (profile?.admin_override === "locked")
      return respond({ error: "Account locked" }, 403);
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key)
      return respond({ error: "Billing provider is not configured" }, 503);
    const stripe = new Stripe(key, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const site = Deno.env.get("SITE_URL") || "https://www.getmacrostack.com";
    admin = createClient(url, service);
    if (body.action === "portal") {
      if (!c.stripe_customer_id)
        return respond({ error: "Start billing first" }, 400);
      const session = await stripe.billingPortal.sessions.create({
        customer: c.stripe_customer_id,
        return_url: `${site}/retail`,
      });
      return respond({ url: session.url });
    }
    if (body.action !== "checkout")
      return respond({ error: "Unknown billing action" }, 400);
    const lock = await admin.rpc("retail_billing_lock", { cid });
    if (lock.error) throw lock.error;
    if (!lock.data)
      return respond(
        { error: "Billing is already being prepared. Please retry shortly." },
        409,
      );
    locked = true;
    const fresh = await admin
      .from("retail_contracts")
      .select("*")
      .eq("id", cid)
      .single();
    if (fresh.error) throw fresh.error;
    return respond(await checkoutContract(stripe, admin, fresh.data, site));
  } catch (e) {
    return respond(
      { error: e instanceof Error ? e.message : "Could not prepare billing" },
      400,
    );
  } finally {
    if (locked && admin)
      await admin.rpc("retail_billing_lock", { cid, release_lock: true });
  }
});
