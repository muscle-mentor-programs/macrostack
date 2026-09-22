# Coach Stripe unlinking

The coach marketplace payment control verifies the existing Standard Connect account, shows a green linked state, and offers a confirmed unlink action. This revokes OAuth access; it does not delete the coach's Stripe account or cancel their MacroStack software subscription.

## Payment safety

- Server authentication selects the coach and saved Stripe account. Browser-supplied account IDs are ignored.
- Checkout, profile saves, OAuth changes, and account-state webhooks share a per-coach database lease. Cleanup is token-scoped; abandoned leases expire after ten minutes (longer than an Edge Function execution).
- Unused MacroStack checkout sessions expire. Ongoing MacroStack coaching subscriptions (including past-due, incomplete, and cancel-at-period-end subscriptions) block unlinking. They must end through Stripe first; unlinking never silently cancels them.
- Pending marketplace payments must settle before revocation. Existing paid access, client relationships, orders, and Stripe payment history are retained. Historical refunds are managed in the coach's Stripe Dashboard after unlinking.
- Before revocation, a persisted pending flag pauses payments. A database trigger clears listing readiness, coaching billing readiness, and outstanding OAuth states atomically.
- Stripe network/configuration failures remain pending, rather than claiming success. The coach can refresh/retry; a signed deauthorization webhook also completes cleanup. Persistent failures require support to verify revocation before clearing saved status. Do not interpret generic `invalid_client` responses as successful revocation.
- Completed unlinking allows a new authorization, including a different Standard account. An active account cannot be silently swapped. Old payment-account references remain on orders.

## Release order

Apply only the new `coach_stripe_unlink` migration after checking remote history/schema. Deploy `connect-onboard`, `marketplace`, `pay-coach`, and `stripe-connect-webhook` with all local shared dependencies and existing authentication settings. Then release the frontend. Do not replay the historical migration backlog.

## Verification

- `node --test scripts/test-stripe-connect.mjs`
- `PGLITE_MODULE=... node scripts/test-stripe-unlink-db.mjs`
- `PLAYWRIGHT_MODULE=... TEST_URL=http://127.0.0.1:5198 node scripts/test-stripe-unlink-ui.mjs`
- `npm test` and `npm run build`

Automated Stripe tests use injected clients; browser tests use mocked responses. They do not revoke real accounts, create charges, or cancel real subscriptions.
