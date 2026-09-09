# Marketplace release gate

Production release authorized by Branden with Stripe end-to-end testing deferred until after deployment. Existing Pro billing remains separate. The SQL migration was applied manually and verified.

1. Branden manually applies `supabase/migrations/20260909143652_coach_marketplace_payments.sql` in the Supabase dashboard. Do not use db push.
2. Verify new tables, policies, and service-only fulfillment grants. Test ownership and inactive-access policies in a test environment.
3. Verify Stripe test-mode checkout for monthly and one-time packages, including 3DS, cancellation, expiry, renewal failure/recovery, duplicate webhooks, full refunds, and a client changing coaches during checkout. No live customer charges for QA.
4. Verify the platform webhook receives checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid/payment_failed, charge.refunded, and account.updated. Connected-account event delivery must use the correct signing secret; configure and verify this before release. Confirm Stripe billing portal cancellation is enabled.
5. Deploy marketplace with manual JWT handling (`--no-verify-jwt --use-api`), stripe-webhook with Stripe signature validation, and connect-onboard using the existing project deployment workflow. Verify trusted SITE_URL and Stripe environment alignment.
6. Deploy the exact reviewed commit to the existing Vercel project, then verify public navigation, opt-in publishing, checkout return, inactive relationships, and unchanged Pro access.

Rollback: restore the previous web and Edge Function versions. Keep additive marketplace tables and payment records; never drop financial history. Do not reactivate expired paid access as a rollback shortcut.

Local checks: production build; focused frontend lint; marketplace rule/fulfillment fixtures; existing 14 Pro-access regression cases; 390px and 1440px mocked browser tests. These do not replace Stripe end-to-end or database policy tests.
