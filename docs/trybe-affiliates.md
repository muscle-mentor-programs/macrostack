# Trybe affiliate program

Configuration verified in the MacroStack Trybe brand portal on 2026-09-23.

## Program

- Name: MacroStack Affiliates
- Status: Private; creator discovery is off
- Promoted offer: MacroStack Pro subscriptions (weekly, monthly, and annual). Coach subscriptions are outside this program brief.
- Category: Fitness Apps
- Commission configured in Trybe: 30% of GMV, videos only, paid monthly, using Trybe attribution. [Trybe advertises](https://jointrybe.com/) a separate 1.5% platform fee on attributed sales.
- Commission scope chosen by owner: first paid Pro invoice only; renewals are excluded. A free first invoice does not consume the commission opportunity.
- Creator-facing overview: "Make honest, useful videos showing how MacroStack Pro helps you log food faster and understand your progress. MacroStack is free to start; Pro adds barcode scanning, weight tracking, and progress analytics. Show a real Pro workflow from your routine and invite viewers to explore Pro at getmacrostack.com. This program promotes Pro subscriptions, not Coach plans. Creators earn 30% of the first paid Pro invoice from an attributed new subscription; renewals and Coach purchases do not earn commission."
- Creative brief: [MacroStack Pro creator brief](../output/pdf/macrostack-trybe-creator-brief.pdf), uploaded to Trybe
- Creative angles: Scan a real meal with Pro; A clearer progress picture; Why I use MacroStack Pro

## Integration source

- Production web visitors see an affiliate tracking choice. Only after acceptance does `public/trybe-attribution.js` load the Trybe pixel from `track.getmacrostack.com`.
- Accepted visitors' Trybe visitor ID is sent to `create-checkout-session` for user Pro plans and carried on Stripe subscription metadata.
- On `invoice.paid`, `stripe-webhook` submits the earliest positive paid Pro invoice to Trybe's Orders API. It uses the Stripe invoice ID as an idempotent order ID; subsequent renewal invoices are excluded.
- `TRYBE_ORDERS_API_KEY` was configured as a Supabase Edge Function secret on 2026-09-23. Its value is not in the Vercel bundle or Git.
- The revised privacy page explains the affiliate data and provides a way to decline future tracking.
- Shortlisted in Trybe Discovery: Rachael Lucero (nutrition and fitness), Hunter Favela (fitness), Robert Rascon (food and fitness), and Marc Malcolm (health). Rachael is the first invitation candidate; the other three are candidates only.

## Deployment and verification (2026-09-23)

- Source commit `953fc537d82e61cc17f862de1a334e19f110b5ad` was pushed to `master` and passed the GitHub Quality workflow, including the production-dependency audit and build.
- Supabase `stripe-webhook` is ACTIVE at version 19 and `create-checkout-session` is ACTIVE at version 18; both were deployed from this checkout with their local shared dependencies.
- Vercel deployment `dpl_GuL2PWDwtwa1CQcQywtzawrKXuoU` reached READY from that source commit. The production `getmacrostack.com` alias points to it.
- A live visit after accepting affiliate tracking inserted the Trybe pixel. Trybe then reported connection health **Receiving data** and a recent session. Its last order remained **None yet**.
- The live privacy page disclosed Trybe tracking. Its opt-out button persisted the choice, and a subsequent home visit did not load the pixel.

## Incomplete setup

- Trybe's Products section shows "No products imported yet" and offers no product to assign to the program. MacroStack Pro is the selected offer in the program copy and brief, but is not assigned as a Trybe product.
- No invitations have been sent and no creators are enrolled. The first invitation to Rachael is drafted but awaits the owner's acknowledgment of Trybe's 1.5% fee. The program remains private while paid-order attribution is not yet verified.
- A live first-purchase attribution test still needs a real referred Pro checkout and confirmation that the order appears in Trybe. Do not create a production purchase solely for testing without the owner's action.
- Stripe's dashboard was not available in the setup browser without a separate login, so the live webhook endpoint's `invoice.paid` event subscription was not independently checked. The existing webhook source already handled `invoice.paid` before this change.
- [Trybe's agreement guide](https://jointrybe.com/help/brand-guides/program-agreements-and-the-compliance-check) says a commission-program content license lasts while commissions are paid. Clarify the intended rights before using creator submissions in paid ads under a first-invoice-only commission.

## Next verification

Determine how Trybe imports or creates a product for a custom-site integration and assign MacroStack Pro if supported. Verify the first referred paid Pro invoice appears once in Trybe, with no renewal commission.
