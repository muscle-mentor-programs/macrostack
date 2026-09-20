# Retail pilot runbook

## Release sequencing

1. Read `docs/sync-baseline.md`. This repository has historical migration drift: do not run a blanket database push.
2. Compare actual `profiles.member_subscription`, `member_weight_access()`, existing weight/check-in policies and migration history. Back up the database through the normal operator process.
3. Run the core suite, production build, database isolation suite and responsive browser suite. Review the new migration in full. Apply only `20260920193515_retail_store_platform.sql` after checking it has not been applied under another version.
4. Confirm every `retail_*` public table has RLS and browser SELECT-only grants. Confirm `retail-files` is private, with the size/type restrictions and path policies in the migration. Run database advisors and assess new findings.
5. Check `cron.job` contains the active `retail-service-reminders` job. Run the worker twice with a synthetic due task: first creates one notification, second creates none. Inspect `cron.job_run_details` for failures. The local PGlite harness intentionally does not provide pg_cron.
6. Deploy committed application source, verify the source SHA and production alias, then exercise a synthetic store/customer account end to end. No live customer records should be used for smoke tests.
7. Only then provision the agreed pilot organization/stores. No partner or customer records are seeded by the migration.

## Start one pilot store

- Superadmin opens Store workspace and creates the organization/first store.
- Confirm operator type, IANA timezone, response expectation and sponsorship expiration. The default pilot term is 90 days; replace it with the agreed contract term.
- Invite an organization administrator for aggregate reporting and a store manager for customer operations. An organization administrator needs an explicit location membership to access individual customer records.
- The manager creates resources/intake questions, invites specialists, and prints the store QR. Staff invitation links are secret, single-use, email-matched and expire in seven days. They are copied for deliberate sharing; the application does not silently send them.
- Use a synthetic customer to complete intake, consultation, publish, check-in, message, assessment import, file upload and reminder. Verify access from an unrelated store is denied.
- Agree on store hours, expected follow-up cadence and what specialists may recommend. Configure approved resources before enrolling real customers.

## Staff workflow (training)

1. **Today:** work due follow-ups and unassigned conversations.
2. **New customer consultation:** capture name/email and share the private invitation. The customer signs in/creates their own account and consents. Public QR links do not claim prepared customer records solely by email.
3. **Consultation:** choose goals, record observations, review assessment, personalize the plan, agree follow-up dates and review the exact customer-facing preview. Private notes stay private. Verify the Saved indicator before closing.
4. **Publish:** the customer receives their plan and follow-up schedule. Publication produces an immutable version. Correct a plan by creating a new consultation/version.
5. **Progress:** enter a measurement or preview/import the customer's CSV. Never guess identity or units. Upload the scan report into the store's private files if appropriate.
6. **Inbox:** assign the conversation, answer the customer, and resolve it. A new message reopens it. The composing indicator reduces simultaneous replies but does not lock out another employee.
7. **Follow-ups:** complete, cancel or reschedule with a note. Outstanding manual tasks are retained when a new plan is published; previous automatic plan follow-ups are canceled.

## Customer workflow

Sign in through the store link, confirm the relationship, choose optional personal-activity sharing, complete intake, read the plan, send a check-in, and message the store. Upload store-shared photos/documents in Progress. Sharing preferences can be changed later. Ending the store connection stops sponsored access and future reminders while preserving the personal account and published records.

## Operational checks

- Daily: overdue tasks, unresolved conversations, scheduler failures and staff access changes.
- Weekly: activation counts, published consultations, repeat scan counts, follow-up completion and staff adoption. Compare store counts using the same period. Imported historical measurements use their import timestamp in adoption metrics.
- Remove departing staff access promptly. Revocation unassigns their work and expires outstanding invitations they created for that organization.
- Change sponsorship terms through superadmin controls. Do not edit a customer's Stripe subscription to represent a store contract.
- For a bad rollout, disable affected locations first to stop staff access/new interactions/reminders. Preserve the database and audit trail; do not drop tables or replay old migrations. Roll back the frontend commit if needed. Paid access remains independent.

## Partner dependencies

- InBody: supported export/API format, authorization, sample deidentified files and identity mapping.
- POS/loyalty: provider, API/webhook access, stable store/customer identifiers, purchase/refund semantics and approved attribution definitions.
- Messaging: approved provider/sender, consent wording, opt-out handling and business hours. Current reminders are in-app only.
- Commercial: store roster, corporate/franchise contracting structure, term, sponsorship coverage and onboarding owner.
- Privacy: partner-approved retention/export/deletion process and forms. No private records are silently copied during a store transfer: the customer joins the new location and can end the old connection.

## Verification commands

```sh
npm test
npm run build
PGLITE_MODULE=/path/to/@electric-sql/pglite node scripts/test-retail-db.mjs
PLAYWRIGHT_MODULE=/path/to/playwright TEST_URL=http://127.0.0.1:5198 node scripts/test-retail-responsive.mjs
```

Browser tests use synthetic API responses to verify layout, save recovery and interactions. Database tests execute the actual migration/RPCs in local PostgreSQL-compatible PGlite. Neither substitutes for post-migration hosted Supabase/Storage/Auth/cron smoke tests.
