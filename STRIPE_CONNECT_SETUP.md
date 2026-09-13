# Existing Stripe accounts and direct coach payments

This release replaces Express account creation with Standard-account OAuth.
MacroStack software subscriptions continue using the platform Stripe account.
New coaching payments use the coach account with no application fee. Legacy
orders retain destination-charge reconciliation using their payment_flow value.

## Required Stripe configuration

1. Enable live OAuth for Stripe Dashboard accounts in Connect settings.
2. Register exactly `https://www.getmacrostack.com/stripe-connect/callback`.
3. Create a **snapshot event** webhook endpoint for **Connected accounts**
   (not events on the platform account), using API version **2024-06-20**:
   `https://ryvsbidtwhxfmashwsqt.supabase.co/functions/v1/stripe-connect-webhook`
4. Subscribe to these events:
   - checkout.session.completed
   - checkout.session.async_payment_succeeded
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.paid
   - invoice.payment_failed
   - charge.refunded
   - account.updated
   - account.application.deauthorized
5. Put that endpoint's signing secret in Supabase Edge Function secrets as
   `STRIPE_CONNECT_WEBHOOK_SECRET`. Do not replace `STRIPE_WEBHOOK_SECRET`.
   Do not paste signing secrets into chat or commit them.
6. The platform OAuth client ID belongs in `STRIPE_CONNECT_CLIENT_ID`.

Until the connected webhook secret exists, new direct purchases and marketplace
publishing are blocked. OAuth authorization and saving profile drafts work.

## Deployment and verification

Branden applies SQL migrations manually. Verify `marketplace_orders.payment_flow`
exists before enabling purchases. Existing rows default to `destination`; new
orders explicitly use `direct`. No historical Stripe identifiers are rewritten.

Deploy connect-onboard, marketplace, pay-coach, stripe-webhook, and
stripe-connect-webhook with manual authentication/signature checking enabled in
the function code (`--no-verify-jwt --use-api` for deployment).

Run `node scripts/test-stripe-connect.mjs` and the frontend production build.
The focused tests use fake Stripe/database clients and do not prove live OAuth,
Stripe configuration, actual renewals, or browser/mobile operation.

Manual acceptance: authorize an existing coach Stripe account, return to the
same signed-in coach, verify connection and publish. With explicit permission,
test purchase, coaching access, renewal, cancellation and refund in Stripe test
mode first. Confirm charges exist in the coach account and MacroStack's software
subscription is unchanged. Never create unapproved live charges for QA.

## Rollback

Keep the additive schema and existing records. Before any direct orders exist,
the previous frontend is commit 18093cf. After direct orders exist, retain direct
order reconciliation and the Connect webhook even if the frontend is rolled
back; disable new purchases rather than reverting payment handling blindly.
