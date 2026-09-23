# Trybe affiliate program

Configuration verified in the MacroStack Trybe brand portal on 2026-09-23.

## Program

- Name: MacroStack Affiliates
- Status: Private; creator discovery is off
- Promoted offer: MacroStack Pro subscriptions (weekly, monthly, and annual). Coach subscriptions are outside this program brief.
- Category: Fitness Apps
- Commission already configured in Trybe: 30% of GMV, videos only, paid monthly, using Trybe attribution
- Creator-facing overview: "Make honest, useful videos showing how MacroStack Pro helps you log food faster and understand your progress. MacroStack is free to start; Pro adds barcode scanning, weight tracking, and progress analytics. Show a real Pro workflow from your routine and invite viewers to explore Pro at getmacrostack.com. This program promotes Pro subscriptions, not Coach plans."
- Creative brief: [MacroStack Pro creator brief](../output/pdf/macrostack-trybe-creator-brief.pdf), uploaded to Trybe
- Creative angles: Scan a real meal with Pro; A clearer progress picture; Why I use MacroStack Pro

## Incomplete setup

- Trybe's Products section shows "No products imported yet" and offers no product to assign to the program. MacroStack Pro is the selected offer in the program copy and brief, but is not assigned as a Trybe product.
- No creators are enrolled. The program remains private while attribution is not yet verified.
- The Trybe Pixel record for getmacrostack.com exists, but its connection health says "No data received yet." The site has no Trybe pixel implementation in the current repository.
- Stripe subscription purchases are not yet submitted to Trybe as orders. Keep the Orders API key in server-side configuration only; never commit it or include it in the browser bundle.

## Next verification

Determine how Trybe imports or creates a product for a custom-site integration, assign MacroStack Pro if supported, then verify site visits and a test subscription attribution before inviting creators.
