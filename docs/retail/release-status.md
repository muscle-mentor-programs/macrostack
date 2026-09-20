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

## Readiness follow-up — September 20, 2026

Applied `20260920213018_retail_readiness.sql`; local filename matches Supabase history. Added restricted operations health, manager-only safe email retries, paginated inbox RPCs and supporting indexes. `retail-health` is ACTIVE v1 (JWT required); `retail-delivery` is ACTIVE v2 with worker heartbeat reporting and existing worker authentication.

The synthetic hosted database workflow passed for staff/customer enrollment, intake, idempotent publication, private-note isolation, assessment visibility, idempotent messaging, check-ins, sponsorship and unrelated-account denial. All test writes were rolled back; no test accounts or retail customer records remain. Storage binary transport and external provider acceptance still require configured, consenting test accounts/providers.

Fourteen core suites, the expanded database suite, both four-width browser suites, React lint, Deno checks, the production build and production dependency audit pass. The public interactive demo is isolated from customer APIs. Browser tests verify draft-only resource creation, retry controls, save recovery, mobile/desktop layouts and sample consultation/member flows. The worker-health table intentionally has no browser policies: only server code can access it directly; authorized managers use the scoped health RPC.

## Real hosted transport acceptance — September 20, 2026

The previously outstanding Auth/API/Storage transport checks now pass: actual signup/password sign-in, email-matched invitations and wrong-email rejection, intake, idempotent publication, private-note isolation, member messages/check-ins, consent validation, and binary PNG uploads/downloads in both directions. Downloaded bytes matched exactly; unrelated and anonymous file access was denied. Manager health access passed and member access was rejected. All four synthetic accounts, their sessions, test objects and retail records were removed. See `hosted-acceptance.md` for the repeatable test and cleanup procedure.

The deployed health endpoint reports billing credentials present, but email, SMS and worker configuration absent. No real checkout, charge or external message was attempted. Full signed-in browser/staff acceptance and external provider testing remain pending their required inputs; deployment alone does not complete those steps.
