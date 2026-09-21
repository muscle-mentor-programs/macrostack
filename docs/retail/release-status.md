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

## Retailer self-service release — September 20, 2026

Added `/retailers` and `/retail/start`, retailer navigation, account creation/sign-in, business/first-store setup, automatic organization-admin/store-manager membership, draft $599 store billing, and a direct workspace handoff. Applied only `20260920230443_retail_self_service_onboarding.sql`; its local filename matches the hosted migration version. No Edge Function code changed. Existing pilots keep their previous behavior; self-service stores activate through verified subscription synchronization.

Four-width signup and existing workspace browser checks, all 14 core suites, build, lint and production dependency audit pass. The actual hosted self-service SQL acceptance passed and rolled back its synthetic records. No new advisor finding was introduced by onboarding; prior notices remain. Provider transaction testing and email/SMS sender activation remain separate configuration dependencies.

## Customer nutrition workflow — September 20, 2026

The retailer workspace now defaults to Customers, with dedicated customer cards and direct Nutrition, Food journal, Progress and Messages actions. Customer profiles keep store navigation visible and expose a Nutrition tab with all four daily targets, meal guidance, habits, product routines and plan history. Updating nutrition starts at the target editor using the current published plan; existing drafts take precedence. The journal shows consented daily intake alongside store-plan targets. Progress keeps photos/files and assessments together. Pending invitations can have drafts prepared but still require customer connection before publication.

Retail workspace links are prominent in the coach sidebar and Library/Settings, and retailer-specific sign-in returns existing staff directly to their retail workspace. Leaving a dirty consultation through store navigation retains the existing save protection. Organization-only administrators continue to land on their permitted store-management view rather than customer records.

Expanded browser coverage exercises card shortcuts, all customer sections, publication, existing-plan reuse, save failures, unsaved-navigation protection, and customer/private controls at four widths. These are interface changes using the existing Supabase commands; no schema or Edge Function deployment is required. Personal nutrition targets are not overwritten by publishing a store plan.

## Separate retailer accounts — September 20, 2026

- Dedicated retailer signup/sign-in, requiring a different work email from a personal/coach account. Isolated browser session storage; no reuse of existing personal sessions.
- Server registration writes the trusted retailer account type. Database checks reject personal workspace creation/staff enrollment and retailer customer enrollment. No existing hosted retailer staff or self-service workspaces required migration.
- Customer store connections keep personal login through `/retail/member`; staff invitations carry through dedicated sign-in. Personal/coach login rejects retailer credentials.
- Validation: core tests, database/RLS acceptance, signup login rejection at four widths, retail workflow checks, production build and dependency audit.
- Deploy `register` from local source, preserving JWT verification, and the account-separation migration alongside the application release.
- Existing sender configuration and historical synchronization limitations remain unchanged.
