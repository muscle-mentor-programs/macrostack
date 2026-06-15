# Stripe Subscriptions — Setup Checklist

The code is built. These steps wire it to your live Stripe account. **Claude cannot
do these** — they require your Stripe credentials and DB access.

## 1. Apply the database migration
The migration adds subscription columns + RPCs to `profiles`.
```bash
supabase db push          # or run supabase/migrations/20260615_subscriptions.sql in the SQL editor
```
Verify `get_my_profile()` now returns the subscription fields and that
`set_subscription_override` + `admin_list_accounts` exist.

## 2. Create products & prices in Stripe (dashboard → Products)
Create 2 products, each with a monthly + annual recurring price:

| Product            | Monthly        | Annual         |
|--------------------|----------------|----------------|
| MacroStack Coach   | e.g. $29 / mo  | e.g. $290 / yr |
| MacroStack Pro     | e.g. $9 / mo   | e.g. $90 / yr  |

Copy the 4 **Price IDs** (`price_...`). Update the displayed numbers in
`src/pages/UpgradePage.jsx` (`PRICES`) to match what you set here.

## 3. Set Supabase function secrets
```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  STRIPE_PRICE_COACH_MONTHLY=price_xxx \
  STRIPE_PRICE_COACH_ANNUAL=price_xxx \
  STRIPE_PRICE_USER_MONTHLY=price_xxx \
  STRIPE_PRICE_USER_ANNUAL=price_xxx \
  SITE_URL=https://your-app-url
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## 4. Deploy the edge functions
```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook --no-verify-jwt
```
> `stripe-webhook` MUST be `--no-verify-jwt` — Stripe calls it without a Supabase
> JWT; it authenticates via the Stripe signature instead.

## 5. Register the webhook (Stripe dashboard → Developers → Webhooks)
- Endpoint URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` (step 3).

## 6. Enable the customer portal
Stripe dashboard → Settings → Billing → Customer portal → activate.

---

## How it behaves
- **Coach free tier:** capped at 3 clients (`FREE_CLIENT_CAP` in `src/store/index.js`).
- **User free tier:** food search/logging, weight logging, goals, profile.
  Gated: barcode scanner, weight trends, coach connection + messaging, meal plans.
- **Superadmin override** (BILLING tab in the coach sidebar): lock/unlock any
  account. Override **always beats** Stripe status — a webhook can't undo it.
  Clear the override to fall back to Stripe.

## Testing without going live
Use Stripe **test mode** keys + `stripe listen --forward-to` for the webhook, or
just use the **superadmin BILLING panel** to unlock/lock accounts — that path
needs no Stripe at all and exercises the entire gating system.
