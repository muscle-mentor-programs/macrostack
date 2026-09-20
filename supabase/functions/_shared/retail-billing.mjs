export async function syncRetailSubscription(stripe, admin, subscriptionId) {
  // Retrieve current provider state instead of trusting delivery order.
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.metadata?.kind !== "retail_store") return false;
  const cid = sub.metadata.retail_contract_id;
  const { data: c, error } = await admin
    .from("retail_contracts")
    .select("*")
    .eq("id", cid)
    .single();
  if (error || !c) throw new Error("Contract unavailable");
  const item = sub.items?.data?.[0];
  if (
    sub.items.data.length !== 1 ||
    item.quantity !== 1 ||
    item.price.unit_amount !== c.monthly_cents ||
    item.price.currency !== c.currency ||
    item.price.recurring?.interval !== "month" ||
    (item.price.recurring.interval_count || 1) !== 1
  )
    throw new Error("Contract price mismatch");
  const end = sub.current_period_end ?? item.current_period_end;
  const result = await admin.rpc("retail_sync_contract", {
    cid,
    subscription_id: sub.id,
    customer_id:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    subscription_status: sub.status,
    paid_until: Number.isFinite(end)
      ? new Date(end * 1000).toISOString()
      : null,
  });
  if (result.error) throw result.error;
  return true;
}
export async function checkoutContract(stripe, admin, contract, site) {
  let c = { ...contract };
  if (!c.stripe_customer_id) {
    const customer = await stripe.customers.create(
      {
        name: c.billing_name,
        email: c.billing_email,
        metadata: { retail_contract_id: c.id, kind: "retail_store" },
      },
      { idempotencyKey: `retail-customer-${c.id}` },
    );
    c.stripe_customer_id = customer.id;
    const saved = await admin
      .from("retail_contracts")
      .update({ stripe_customer_id: customer.id })
      .eq("id", c.id);
    if (saved.error) throw saved.error;
  }
  const existing = await stripe.subscriptions.list({
    customer: c.stripe_customer_id,
    status: "all",
    limit: 100,
  });
  if (
    existing.data.some(
      (s) =>
        s.metadata?.retail_contract_id === c.id &&
        !["canceled", "incomplete_expired"].includes(s.status),
    )
  )
    throw new Error(
      "This store already has a subscription. Use Manage billing.",
    );
  // Reuse open sessions, including a session whose database acknowledgement was lost.
  const sessions = await stripe.checkout.sessions.list({
    customer: c.stripe_customer_id,
    limit: 100,
  });
  const open = sessions.data.find(
    (s) =>
      s.metadata?.retail_contract_id === c.id &&
      s.status === "open" &&
      s.expires_at > Date.now() / 1000,
  );
  if (open) return { url: open.url };
  if (c.stripe_subscription_id)
    throw new Error(
      "This contract has subscription history. Contact MacroStack to renew it.",
    );
  const metadata = { kind: "retail_store", retail_contract_id: c.id };
  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: c.stripe_customer_id,
      metadata,
      subscription_data: { metadata },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: c.currency,
            unit_amount: c.monthly_cents,
            recurring: { interval: "month" },
            product_data: {
              name: `MacroStack, LLC — store subscription`,
              metadata,
            },
          },
        },
      ],
      success_url: `${site}/retail?billing=success`,
      cancel_url: `${site}/retail?billing=canceled`,
      custom_text: {
        submit: {
          message:
            "Billed monthly by MacroStack, LLC. Your agreed store contract governs the subscription.",
        },
      },
      billing_address_collection: "required",
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    },
    {
      idempotencyKey: `retail-checkout-${c.id}-${c.revision}-${Math.floor(Date.now() / 1800000)}`,
    },
  );
  const saved = await admin
    .from("retail_contracts")
    .update({
      checkout_id: session.id,
      checkout_url: session.url,
      checkout_expires_at: new Date(session.expires_at * 1000).toISOString(),
    })
    .eq("id", c.id);
  if (saved.error) throw saved.error;
  return { url: session.url };
}
