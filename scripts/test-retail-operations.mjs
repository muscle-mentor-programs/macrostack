import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  quietHours,
  deliverRetail,
  nextDeliveryState,
} from "../supabase/functions/_shared/retail-delivery.mjs";
import { validEmailSignature } from "../supabase/functions/_shared/retail-email-signature.mjs";
import { validTwilioSignature } from "../supabase/functions/_shared/retail-sms.mjs";
import {
  syncRetailSubscription,
  checkoutContract,
} from "../supabase/functions/_shared/retail-billing.mjs";
assert.equal(
  quietHours("America/Chicago", new Date("2026-09-20T15:00:00Z")),
  false,
);
assert.equal(
  quietHours("America/Chicago", new Date("2026-09-20T01:00:00Z")),
  true,
);
assert.equal(nextDeliveryState("sms", 503), "unknown");
assert.equal(nextDeliveryState("email", 503), "queued");
const target = {
    email: "test@example.invalid",
    phone: "+12025550123",
    store: "Test store",
    timezone: "UTC",
    unsubscribe: "token",
  },
  now = new Date("2026-09-20T15:00:00Z");
const emailEnv = {
  RETAIL_EMAIL_ENABLED: "true",
  RESEND_API_KEY: "test",
  RESEND_FROM_EMAIL: "test@example.invalid",
  SUPABASE_URL: "https://example.invalid",
};
let requests = [];
const fetcher = async (url, options) => {
  requests.push({ url, options });
  return new Response(JSON.stringify({ id: "mail" }), { status: 200 });
};
assert.equal(
  (
    await deliverRetail({
      delivery: { id: "one", channel: "email" },
      target: null,
      env: emailEnv,
      now,
      fetcher,
    })
  ).status,
  "suppressed",
);
assert.equal(requests.length, 0);
assert.equal(
  (
    await deliverRetail({
      delivery: { id: "one", channel: "email" },
      target,
      env: {},
      now,
      fetcher,
    })
  ).defer,
  true,
);
assert.equal(requests.length, 0);
for (let i = 0; i < 2; i++)
  assert.equal(
    (
      await deliverRetail({
        delivery: { id: "one", channel: "email" },
        target,
        env: emailEnv,
        now,
        fetcher,
      })
    ).status,
    "accepted",
  );
assert.equal(
  requests[0].options.headers["Idempotency-Key"],
  requests[1].options.headers["Idempotency-Key"],
);
assert.ok(!requests[0].options.body.includes("weight"));
const smsEnv = {
  RETAIL_SMS_ENABLED: "true",
  TWILIO_ACCOUNT_SID: "test",
  TWILIO_AUTH_TOKEN: "test",
  TWILIO_MESSAGING_SERVICE_SID: "test",
};
assert.equal(
  (
    await deliverRetail({
      delivery: { id: "one", channel: "sms" },
      target,
      env: smsEnv,
      now,
      fetcher: async () => {
        throw Error("timeout");
      },
    })
  ).status,
  "unknown",
);
const body = '{"type":"email.delivered"}',
  stamp = String(Math.floor(Date.now() / 1000)),
  key = Buffer.from("test signing secret");
const sig = createHmac("sha256", key)
  .update(`evt.${stamp}.${body}`)
  .digest("base64");
const headers = new Headers({
  "svix-id": "evt",
  "svix-timestamp": stamp,
  "svix-signature": `v1,${sig}`,
});
assert.equal(
  await validEmailSignature(body, headers, `whsec_${key.toString("base64")}`),
  true,
);
assert.equal(
  await validEmailSignature(
    body + "x",
    headers,
    `whsec_${key.toString("base64")}`,
  ),
  false,
);
assert.equal(
  await validEmailSignature(
    body,
    headers,
    `whsec_${key.toString("base64")}`,
    Date.now() + 600000,
  ),
  false,
);
const url = "https://example.invalid/webhook",
  params = new URLSearchParams({ Body: "STOP", From: "+12025550123" }),
  tsig = createHmac("sha1", "secret")
    .update(url + "BodySTOPFrom+12025550123")
    .digest("base64");
assert.equal(await validTwilioSignature(url, params, tsig, "secret"), true);
assert.equal(await validTwilioSignature(url, params, tsig, "wrong"), false);
const contract = {
  id: "contract",
  monthly_cents: 59900,
  currency: "usd",
  stripe_customer_id: "cus",
  revision: 1,
};
let writes = [];
const db = {
  from: () => ({
    select: () => ({
      eq: () => ({ single: async () => ({ data: contract }) }),
    }),
    update: (patch) => ({
      eq: async () => {
        writes.push(patch);
        return {};
      },
    }),
  }),
  rpc: async (name, args) => {
    writes.push({ name, args });
    return {};
  },
};
const sub = {
  id: "sub",
  customer: "cus",
  status: "active",
  metadata: { kind: "retail_store", retail_contract_id: "contract" },
  current_period_end: 1900000000,
  items: {
    data: [
      {
        quantity: 1,
        price: {
          unit_amount: 59900,
          currency: "usd",
          recurring: { interval: "month" },
        },
      },
    ],
  },
};
const stripe = {
  subscriptions: {
    retrieve: async () => sub,
    list: async () => ({ data: [] }),
  },
  checkout: {
    sessions: {
      list: async () => ({
        data: [
          {
            metadata: { retail_contract_id: "contract" },
            status: "open",
            expires_at: Date.now() / 1000 + 900,
            url: "existing",
          },
        ],
      }),
      create: async () => {
        throw Error("Must reuse checkout");
      },
    },
  },
};
assert.equal(await syncRetailSubscription(stripe, db, "sub"), true);
assert.equal(writes[0].name, "retail_sync_contract");
sub.items.data[0].price.unit_amount = 50000;
await assert.rejects(
  () => syncRetailSubscription(stripe, db, "sub"),
  /price mismatch/,
);
sub.metadata.kind = "personal";
assert.equal(await syncRetailSubscription(stripe, db, "sub"), false);
assert.deepEqual(
  await checkoutContract(stripe, db, contract, "https://example.invalid"),
  { url: "existing" },
);
stripe.subscriptions.list = async () => ({
  data: [{ metadata: { retail_contract_id: "contract" }, status: "active" }],
});
await assert.rejects(
  () => checkoutContract(stripe, db, contract, "https://example.invalid"),
  /already has a subscription/,
);
console.log(
  "PASS retail operations: consent, quiet hours, provider retries, signature forgery/replay, $599 price verification, separate subscriptions and duplicate checkout prevention",
);
