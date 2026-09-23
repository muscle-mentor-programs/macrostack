import LoadingSplash from "../components/LoadingSplash";
import { useEffect, useState } from "react";
import { billing, command, list } from "./api";
import { Alert, Button, Field, useAction } from "./ui";
export default function Operations({
  location,
  admin,
  organizationAdmin,
  onBillingRefresh,
}) {
  const [contract, setContract] = useState(null),
    [loaded, setLoaded] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState("");
  const { busy, error, run, setError } = useAction();
  const reload = async () => {
    const contracts = await list("contracts", { location_id: location.id });
    setContract(contracts[0] || null);
    setName(contracts[0]?.billing_name || "");
    setEmail(contracts[0]?.billing_email || "");
    setLoaded(true);
    await onBillingRefresh?.();
  };
  useEffect(() => {
    let active = true;
    list("contracts", { location_id: location.id })
      .then((contracts) => {
        if (!active) return;
        setContract(contracts[0] || null);
        setName(contracts[0]?.billing_name || "");
        setEmail(contracts[0]?.billing_email || "");
        setLoaded(true);
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [location.id, setError]);
  const redirect = (action) =>
    run(async () => {
      const result = await billing(contract.id, action);
      const url = new URL(result.url);
      if (
        url.protocol !== "https:" ||
        !["checkout.stripe.com", "billing.stripe.com"].includes(url.hostname)
      )
        throw new Error("Unexpected billing destination");
      window.location.assign(url.href);
    });
  return (
    <div className="retail-store-settings-stack">
      <section className="retail-section retail-setup-target retail-store-scroll-target" id="retail-billing" tabIndex={-1} aria-label="Store subscription">
        <h2 className="retail-store-section-heading">Subscription</h2>
        <p>
          <strong>$599 / store / month</strong>
        </p>
        <p>
          Billed by MacroStack, LLC. Store billing is separate from personal
          subscriptions.
        </p>
        <Alert error={error} />
        {!loaded ? (
          <LoadingSplash label="Loading billing details…" />
        ) : (
          <>
            <p>Status: {contract?.status || "Not configured"}</p>
            {contract?.period_end && (
              <p>
                Current period ends{" "}
                {new Date(contract.period_end).toLocaleDateString()}
              </p>
            )}
            {(admin || (organizationAdmin && location.billing_required)) &&
              !contract?.checkout_id &&
              !contract?.stripe_subscription_id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => {
                      await command("contract", {
                        location_id: location.id,
                        billing_name: name,
                        billing_email: email,
                        revision: contract?.revision,
                      });
                      await reload();
                    });
                  }}
                >
                  <Field
                    label="Billing contact name"
                    value={name}
                    onChange={setName}
                    required
                    maxLength={150}
                  />
                  <Field
                    label="Billing email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    required
                  />
                  <Button disabled={busy} type="submit">
                    Save billing contact
                  </Button>
                </form>
              )}
            {contract && (
              <div className="retail-actions">
                {!contract.stripe_subscription_id && (
                  <Button
                    primary
                    disabled={busy}
                    onClick={() => redirect("checkout")}
                  >
                    Set up $599 monthly billing
                  </Button>
                )}
                {contract.stripe_customer_id && (
                  <Button disabled={busy} onClick={() => redirect("portal")}>
                    Manage billing
                  </Button>
                )}
                <Button
                  disabled={busy}
                  onClick={() => run(reload)}
                >
                  Refresh billing
                </Button>
              </div>
            )}
            <p className="retail-muted">
              Payment is confirmed on Stripe’s secure checkout. Saving a contact
              does not charge the store.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
