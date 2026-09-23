# Trybe affiliate program

Configuration verified in the MacroStack Trybe brand portal on 2026-09-23.

## Program

- Name: MacroStack Affiliates
- Status: Private; creator discovery is off
- Promoted offer: MacroStack Pro subscriptions (weekly, monthly, and annual). Coach subscriptions are outside this program brief.
- Category: Fitness Apps
- Commission already configured in Trybe: 30% of GMV, videos only, paid monthly, using Trybe attribution
- Commission scope chosen by owner: first paid Pro invoice only; renewals are excluded. A free first invoice does not consume the commission opportunity.
- Creator-facing overview: "Make honest, useful videos showing how MacroStack Pro helps you log food faster and understand your progress. MacroStack is free to start; Pro adds barcode scanning, weight tracking, and progress analytics. Show a real Pro workflow from your routine and invite viewers to explore Pro at getmacrostack.com. This program promotes Pro subscriptions, not Coach plans."
- Creative brief: [MacroStack Pro creator brief](../output/pdf/macrostack-trybe-creator-brief.pdf), uploaded to Trybe
- Creative angles: Scan a real meal with Pro; A clearer progress picture; Why I use MacroStack Pro

## Integration source

- Production web visitors see an affiliate tracking choice. Only after acceptance does `public/trybe-attribution.js` load the Trybe pixel from `track.getmacrostack.com`.
- Accepted visitors' Trybe visitor ID is sent to `create-checkout-session` for user Pro plans and carried on Stripe subscription metadata.
- On `invoice.paid`, `stripe-webhook` submits the earliest positive paid Pro invoice to Trybe's Orders API. It uses the Stripe invoice ID as an idempotent order ID; subsequent renewal invoices are excluded.
- Set `TRYBE_ORDERS_API_KEY` as a Supabase Edge Function secret. Never put it in the Vercel bundle, Git, or a log.
- The revised privacy page explains the affiliate data and provides a way to decline future tracking.
- Shortlisted in Trybe Discovery for later invitation: Hunter Favela (fitness), Marc Malcolm (health), Robert Rascon (food and fitness), and Rachael Lucero (nutrition and fitness). These are candidates only; no invitation has been sent.

## Incomplete setup

- Trybe's Products section shows "No products imported yet" and offers no product to assign to the program. MacroStack Pro is the selected offer in the program copy and brief, but is not assigned as a Trybe product.
- No creators are enrolled. The program remains private while attribution is not yet verified.
- The Trybe Pixel record for getmacrostack.com exists, but its connection health last said "No data received yet." Live pixel receipt still needs verification after release.
- A live first-purchase attribution test still needs a real checkout (or a controlled Stripe test environment) and Trybe reporting verification.

## Next verification

Determine how Trybe imports or creates a product for a custom-site integration, assign MacroStack Pro if supported, then verify site visits and a test subscription attribution before inviting creators.
