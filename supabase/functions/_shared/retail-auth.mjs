import { sendRetailEmail } from "./retail-email.mjs";
const site = "https://www.getmacrostack.com";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
const verified = (u) =>
  u?.app_metadata?.account_type === "retailer" &&
  u.email_confirmed_at &&
  u.app_metadata.retail_verified_email === u.email;
const hash = async (value) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
export async function handleRetailAuth(
  req,
  { admin, authClient, env, fetcher = fetch },
) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 8000) return json({ error: "Request too large" }, 413);
    const body = JSON.parse(raw);
    const { action } = body;
    if (
      ![
        "register",
        "resend",
        "recover",
        "verify",
        "welcome",
        "invite",
      ].includes(action)
    )
      return json({ error: "Invalid request" }, 400);
    const key = env.RESEND_API_KEY,
      from = env.RESEND_FROM_EMAIL;
    if (
      action !== "verify" &&
      (!key || !from || /onboarding@resend\.dev/i.test(from))
    )
      return json(
        {
          error:
            "Email delivery is not configured. Please contact getmacrostack@gmail.com.",
        },
        503,
      );
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    async function limit(bucket, max, seconds) {
      const r = await admin.rpc("retail_email_limit", {
        bucket_key: await hash(bucket),
        max_attempts: max,
        window_seconds: seconds,
      });
      if (r.error) throw Error("Email service unavailable. Please retry.");
      return r.data === true;
    }
    if (
      !(await limit("ip:" + ip, 30, 3600)) ||
      !(await limit("global", 300, 3600))
    )
      return json({ error: "Too many requests. Please try again later." }, 429);
    async function send(kind, to, url, idempotencyKey, store) {
      return sendRetailEmail({
        key,
        from,
        to,
        kind,
        url,
        idempotencyKey,
        store,
        fetcher,
      });
    }
    async function caller() {
      const bearer = (req.headers.get("authorization") || "").replace(
        /^Bearer\s+/i,
        "",
      );
      const r = await admin.auth.getUser(bearer);
      if (r.error || !r.data?.user) throw Error("Sign in required.");
      return r.data.user;
    }
    async function welcome(user) {
      if (!verified(user)) throw Error("Confirm your retailer email first.");
      if (user.app_metadata.retail_welcome_sent) return;
      await send(
        "welcome",
        user.email,
        site + "/retail",
        "retail-welcome-" + user.id,
      );
      const r = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, retail_welcome_sent: true },
      });
      if (r.error) throw Error("Could not record welcome email.");
    }
    if (action === "welcome") {
      await welcome(await caller());
      return json({ ok: true });
    }
    if (action === "invite") {
      const sender = await caller();
      if (sender.email?.toLowerCase() === "demo@getmacrostack.com")
        return json({ error: "The demo workspace cannot email invitations." }, 403);
      const callerClient = authClient(req.headers.get("authorization"));
      const { data: invite, error } = await callerClient.rpc(
        "retail_invitation_email",
        { iid: body.invitation_id },
      );
      if (error || !invite)
        return json(
          {
            error:
              "This invitation is unavailable or you no longer have permission to send it.",
          },
          403,
        );
      if (!(await limit("invite:" + invite.id, 1, 60)))
        return json(
          { error: "Wait one minute before resending this invitation." },
          429,
        );
      const url = new URL(
        invite.role === "customer" ? "/retail/member" : "/retail",
        site,
      );
      url.searchParams.set("invite", invite.token);
      if (invite.role !== "customer") url.searchParams.set("staff", "1");
      await send(
        invite.role === "customer" ? "customer" : "staff",
        invite.email,
        url.href,
        "retail-invite-" + invite.id + "-" + Math.floor(Date.now() / 60000),
        invite.store_name,
      );
      return json({ ok: true });
    }
    if (action === "verify") {
      if (
        !["email", "recovery"].includes(body.type) ||
        !/^[A-Za-z0-9_-]{20,512}$/.test(body.token_hash || "")
      )
        return json(
          { error: "This link is invalid. Request a new email." },
          400,
        );
      const r = await authClient().auth.verifyOtp({
        token_hash: body.token_hash,
        type: body.type,
      });
      const user = r.data?.user,
        session = r.data?.session;
      if (
        r.error ||
        !session ||
        user?.app_metadata?.account_type !== "retailer" ||
        !user.email_confirmed_at
      )
        return json(
          {
            error:
              "This link has expired or was already used. Request a new email.",
          },
          400,
        );
      const update = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...user.app_metadata,
          retail_verified_email: user.email,
        },
      });
      if (update.error)
        throw Error(
          "Could not confirm your account. Please request a new link.",
        );
      let welcomePending = false;
      if (body.type === "email")
        try {
          await welcome(update.data.user);
        } catch {
          welcomePending = true;
        }
      return json({
        ok: true,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
        welcome_pending: welcomePending,
      });
    }
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return json({ error: "Enter a valid work email." }, 400);
    if (!(await limit("address:" + email, 1, 60)))
      return json(
        { error: "Wait one minute before requesting another email." },
        429,
      );
    const lookup = await admin.rpc("retail_email_identity", { address: email });
    if (lookup.error) throw Error("Account service unavailable.");
    let user = lookup.data;
    if (action === "register") {
      if (
        typeof body.password !== "string" ||
        body.password.length < 8 ||
        body.password.length > 128
      )
        return json(
          { error: "Use a password between 8 and 128 characters." },
          400,
        );
      if (user)
        return json(
          {
            error:
              "This email is already registered. Sign in or resend confirmation. Use a different work email if it belongs to a personal or coach account.",
          },
          409,
        );
      const created = await admin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: false,
        user_metadata: {
          name:
            String(body.name || "")
              .trim()
              .slice(0, 120) || "Retailer",
          role: "client",
        },
        app_metadata: { role: "client", account_type: "retailer" },
      });
      if (created.error)
        throw Error(
          "Could not create your account. If it already exists, sign in or resend confirmation.",
        );
      user = { id: created.data.user.id, email, account_type: "retailer" };
    }
    // A neutral response avoids exposing which existing emails belong to retailers.
    if (
      user?.account_type !== "retailer" ||
      (action === "recover" &&
        (!user.confirmed || user.verified_email !== email)) ||
      (action === "resend" && user.verified_email === email)
    )
      return json({ ok: true });
    const type = action === "recover" ? "recovery" : "magiclink";
    const link = await admin.auth.admin.generateLink({ type, email });
    if (link.error || !link.data?.properties?.hashed_token)
      throw Error("Could not prepare your email. Please retry shortly.");
    const url = new URL("/retailers", site);
    url.searchParams.set("flow", action === "recover" ? "reset" : "confirm");
    if (action !== "recover" && /^[0-9a-f-]{36}$/i.test(body.invite || ""))
      url.searchParams.set("invite", body.invite);
    url.hash = new URLSearchParams({
      token_hash: link.data.properties.hashed_token,
      type: action === "recover" ? "recovery" : "email",
    }).toString();
    await send(
      action === "recover" ? "recovery" : "confirm",
      email,
      url.href,
      "retail-auth-" + (await hash(link.data.properties.hashed_token)),
    );
    return json({ ok: true, confirmation_required: action !== "recover" });
  } catch (e) {
    return json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Email request failed. Please retry.",
      },
      400,
    );
  }
}
