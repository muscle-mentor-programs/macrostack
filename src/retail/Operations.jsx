import LoadingSplash from "../components/LoadingSplash";
import { useEffect, useState } from "react";
import { billing, command, list } from "./api";
import { Alert, Button, Check, Field, useAction } from "./ui";
export default function Operations({
  location,
  organization,
  admin,
  organizationAdmin,
  onBillingRefresh,
}) {
  const [contract, setContract] = useState(null),
    [pilot, setPilot] = useState(null),
    [loaded, setLoaded] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState("");
  const { busy, error, run, setError } = useAction();
  const reload = async (scope = "all") => {
    const [contracts, settings] = await Promise.all([
      list("contracts", { location_id: location.id }),
      list("pilot_settings", { organization_id: organization.id }),
    ]);
    if (scope !== "pilot") {
      setContract(contracts[0] || null);
      setName(contracts[0]?.billing_name || "");
      setEmail(contracts[0]?.billing_email || "");
    }
    if (scope !== "billing") {
      setPilot(
        settings[0] || {
          public_name: organization.name,
          contact_email: "",
          onboarding_notes: "",
          forms_approved: false,
          brand_approved: false,
          staff_trained: false,
        },
      );
    }
    setLoaded(true);
    if (scope !== "pilot") await onBillingRefresh?.();
  };
  useEffect(() => {
    let active = true;
    Promise.all([
      list("contracts", { location_id: location.id }),
      list("pilot_settings", { organization_id: organization.id }),
    ])
      .then(([contracts, settings]) => {
        if (!active) return;
        setContract(contracts[0] || null);
        setName(contracts[0]?.billing_name || "");
        setEmail(contracts[0]?.billing_email || "");
        setPilot(
          settings[0] || {
            public_name: organization.name,
            contact_email: "",
            onboarding_notes: "",
            forms_approved: false,
            brand_approved: false,
            staff_trained: false,
          },
        );
        setLoaded(true);
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [location.id, organization.id, organization.name, setError]);
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
    <div className="retail-columns">
      <section className="retail-card">
        <h2>Store subscription</h2>
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
                      await reload("billing");
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
                  onClick={() => run(() => reload("billing"))}
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
      <section className="retail-card">
        <h2>Pilot readiness</h2>
        {pilot && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await command("pilot_settings", {
                  ...pilot,
                  organization_id: organization.id,
                });
                await reload("pilot");
              });
            }}
          >
            <Field
              label="Partner name"
              value={pilot.public_name}
              onChange={(v) => setPilot((p) => ({ ...p, public_name: v }))}
              required
              disabled={!organizationAdmin}
            />
            <Field
              label="Partner support email"
              type="email"
              value={pilot.contact_email}
              onChange={(v) => setPilot((p) => ({ ...p, contact_email: v }))}
              disabled={!organizationAdmin}
            />
            <Field
              label="Launch notes and staff onboarding"
              multiline
              value={pilot.onboarding_notes}
              onChange={(v) => setPilot((p) => ({ ...p, onboarding_notes: v }))}
              disabled={!organizationAdmin}
            />
            {organizationAdmin && (
              <>
                {[
                  ["forms_approved", "Partner has approved the intake forms"],
                  ["brand_approved", "Partner has approved the branding"],
                  ["staff_trained", "Pilot staff have completed training"],
                ].map(([key, label]) => (
                  <Check
                    key={key}
                    checked={pilot[key]}
                    onChange={(v) => setPilot((p) => ({ ...p, [key]: v }))}
                  >
                    {label}
                  </Check>
                ))}
                <Button disabled={busy} type="submit">
                  Save readiness
                </Button>
              </>
            )}
            <p className="retail-muted">
              Add approved resources in Library and invite staff from Store.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
