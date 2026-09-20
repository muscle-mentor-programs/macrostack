# Retail release verification — September 20, 2026

## Backend

- Applied `20260920205307_retail_store_platform.sql` and `20260920205319_retail_operations_billing.sql` only. Local filenames match the versions assigned by Supabase. Historical migrations were not replayed.
- Confirmed all 24 retail tables have RLS. Anonymous callers cannot execute the command RPC; authenticated users cannot directly update contracts, sync billing, or claim deliveries.
- Five new Edge Functions are ACTIVE at version 1: retail-billing (JWT enabled), retail-delivery (worker-secret authentication), retail-unsubscribe (unguessable consent-removal token), retail-email-webhook (Svix signature), retail-sms-webhook (Twilio signature).
- stripe-webhook is ACTIVE at version 15, deployed with local shared dependencies and existing signature authentication.
- Hosted rejection checks passed: billing/worker 401; unsigned email/SMS callbacks 403; invalid unsubscribe 400; unsigned Stripe callback 400.
- Both five-minute cron jobs are present. External delivery remains inert: no Vault worker credential is configured. Provider sender activation and test-recipient delivery remain pending.
- No store contracts, customer enrollments, payments or outbound messages were created during verification.

## Verification

- 13 core suites pass, including retail provider/billing tests.
- Database suite executes both exact migration files and validates store isolation, private/customer access, consent, verified phone requirements, outbox deduplication, opt-out and contract price/provider ownership.
- Browser fixture checks pass at 320/390/768/1440 pixels for staff/customer flows, history, preferences, both themes, save failure recovery and keyboard viewport behavior.
- All six changed/new Edge Functions pass Deno type checking. Retail React lint and production build pass. Production dependency audit: zero vulnerabilities.
- Browser checks use synthetic responses; a signed-in hosted pilot flow and real provider test-mode transactions still need pilot/provider configuration.

## Remaining configuration

The default is $599 USD/store/month, billed by MacroStack, LLC. The billing contact, partner roster, approved forms and brand assets are intentionally pending. InBody and POS integrations are deferred. See `implementation.md` for exact non-secret sender/webhook/Vault configuration requirements. Stripe legal-entity/invoice settings have not been independently verified.

Supabase advisors returned no retail-specific warnings. Existing notices remain for public pg_net, legacy callable security-definer functions, leaked-password protection and two intentionally server-only Stripe tables with no browser policies. These are not changes from this release. [Supabase advisor guidance](https://supabase.com/docs/guides/database/database-linter).

Historical drift in `docs/sync-baseline.md` remains unresolved. The preexisting local workflow change and untracked workspace/reference outputs were excluded from this release.
