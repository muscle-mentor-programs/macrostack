# Retail platform implementation

Approved scope: organization/store permissions, consultation-to-plan flow, customer store connection, shared inbox, templates, follow-ups, reminders, assessment imports, reporting and pilot operations.

Defaults pending partner discovery:
- MacroStack branding; partner name configured per organization. No unapproved partner logo.
- A customer explicitly joins a location; private notes never transfer automatically.
- Specialists see assigned or unassigned relationships in their location. Managers see their location. Operators manage their operator's locations. Organization administrators see aggregate reporting, not individual health records without a location membership.
- Customer sponsorship is separate from Stripe subscription status.
- In-app reminders first. External providers require verified configuration and consent.
- Manual assessments and validated CSV imports; no claimed InBody or POS connection.

Release gate: database isolation tests, application regression tests, production build, browser verification and migration review. No real customer enrollment or partner outreach during development.

External inputs still needed: authorized partner brand assets, intake questionnaires, corporate/franchise agreements, pilot locations/staff, POS and InBody export/API access, consent/retention requirements, email/SMS delivery settings and commercial limits.

## Implemented surfaces

`/retail` is a lazy-loaded workspace. Store staff and customers use their existing authenticated identity; no second email/account is created. Account/Profile offers entry and onboarding links retain their intent through sign-in.

- **Today:** scoped action counts, oldest outstanding follow-ups and open conversations.
- **Customers:** server-side search, assignment/status filters, 50-row pagination, separate customer cards.
- **Consultation:** six steps, debounced server drafts, save status, stale-revision rejection, retry IDs, private observations and a customer preview. Publication is immutable and idempotent. New plans cancel superseded automatic follow-ups, not manual work.
- **Customer:** plan history, intake, check-ins, store messages, assessments, private signed file links, optional sharing of recent food/weight logs, reminder preferences and disconnect.
- **Inbox:** shared assignment, unread counts, resolve/reopen, expiring composing lease. Polling runs only while the conversation is open.
- **Library:** corporate/store resources, version checks, editable intake questions and nutrition template application.
- **Store:** email-matched private staff invitations, access removal/unassignment, QR onboarding, store/operator setup, sponsorship term, aggregate comparison and CSV exports.
- **Assessment:** manual record and validated CSV preview, explicit customer confirmation, import deduplication. Private scan report/photo/PDF upload, 10 MB max.
- **Reminders:** due-action notifications inside the store workspace, five-minute pg_cron job where available, dedupe by task revision, opt-out/pause/end stop conditions. No external delivery claim.

## Data and access

All new tables use `retail_` names, explicit grants and RLS. Browser roles have SELECT only; audited command RPCs perform validated mutations. Private helper functions use a fixed empty search path and fully qualified objects. Customers cannot read consultation drafts or staff notes. Organization/operator reporting does not grant raw customer access. The client `coach_id`, existing coach records, personal photos and Stripe subscription fields are unchanged.

The private `retail-files` bucket is separate from personal progress photos. Its paths are `relationship UUID / uploader UUID / file UUID`. Upload requires an active authorized relationship; viewing requires current relationship access. Signed file links expire after 120 seconds. No public bucket or permanent public URL is used. Unregistered uploads are cleaned up on a confirmed failed registration; ambiguous responses preserve the file until reconciled.

Sponsorship extends member feature access only, respects account locks, and is checked again in database weight policies. Frontend grants expire after 70 seconds and refresh every minute/on visibility. A customer's own paid subscription survives an ended store connection.

## Defined limits

Customer search returns 50 rows/page. The action queue reads the oldest 100 and shows the next 25. Inbox returns the latest 100 threads. Customer history loads the latest 300 records per category. Activity sharing returns up to 500 food entries/30 days and 100 weights/90 days. These bounds protect initial rendering; larger archival history needs a dedicated export/pagination pass before claiming unlimited history access.

Corporate reports are counts, not revenue attribution. New relationships and activations have distinct date cohorts. Scan metrics use recorded/imported timestamps. A missing food log means unknown intake. Customer documents are store-shared; personal photos are not automatically shared or transferred between stores.

## Pending external activation

InBody and POS synchronization, SMS/email delivery, authorized partner assets, approved partner intake/legal copy and real-store onboarding need partner/provider inputs. The interface explicitly describes manual workflows until those integrations are verified. No customer invitation, marketing message or real enrollment is sent by development scripts.

## Retail operations extension

Store subscriptions default to **$599 USD per location per month**, billed by **MacroStack, LLC**. Billing contacts remain blank until supplied. Superadmins save a contract contact; an authorized store billing administrator completes Stripe Checkout. There is no charge when the contact is saved. Store customers and subscriptions are separate from personal MacroStack subscriptions. Verified Stripe events control the paid sponsorship period; canceled/unpaid subscriptions stop sponsorship, and past-due events never extend it.

Store settings include partner readiness and launch notes. Approved 5 Star branding, forms, staff/store roster and billing contact are pending. Existing Library and staff invitation tools accept those materials when supplied. InBody and POS integrations are explicitly deferred; manual assessments and validated CSV imports remain available.

Customers can opt into email and verified-phone text service reminders, independently of marketing consent. Delivery requires both relationship service consent and channel consent. Reminders contain a generic secure-app link, not health records. The worker uses 9am–8pm store-local quiet hours, consent rechecks, deduplication, bounded retries and provider signatures. Ambiguous SMS delivery is marked unknown rather than automatically resent. Provider acceptance is distinguished from confirmed delivery. Unsubscribe disables both reminder channels for that store relationship; SMS STOP disables texts for the verified number.

Customer histories use date-filtered keyset pagination. Exports include either the current page or the complete selected date range up to 50,000 records; larger exports require a narrower range and never silently truncate. Private consultations, notes, follow-ups and delivery history remain staff-only.

### Delivery activation checklist

- Supabase secrets: `RETAIL_EMAIL_ENABLED=true`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (verified sender), `RETAIL_RESEND_WEBHOOK_SECRET`, and `SITE_URL`.
- Resend webhook: `/functions/v1/retail-email-webhook`, subscribed to delivered, bounced, complained and suppressed events. Use its signing secret above.
- SMS requires an approved Twilio sender, `RETAIL_SMS_ENABLED=true`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`, and a configured Supabase Auth phone provider. Configure incoming messages/advanced opt-out to `/functions/v1/retail-sms-webhook`; delivery callbacks are attached to each send.
- Store the same randomly generated worker credential in Supabase Edge secret `RETAIL_DELIVERY_WORKER_KEY` and Vault secret `retail_delivery_worker_key`. The five-minute SQL cron schedule remains inert without the Vault secret. Never put credentials in SQL migration files or Git.
- Billing uses existing `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. The Stripe account business/legal identity and invoice settings must reflect MacroStack, LLC; a product label alone does not change Stripe’s legal entity settings. Enable the billing portal in Stripe.
- All webhook functions use custom signature/token authentication with platform JWT checks disabled. `retail-billing` validates the caller and store access, and keeps platform JWT verification enabled.
- Before enabling delivery or accepting payments, run a hosted test-mode checkout and consenting test-recipient send, verify webhook results and cancellation/opt-out, then enable production channels. No live payment or message is needed to create the setup.

## Readiness, training and operational support

- `/retail/demo` is a separate lazy-loaded public demo. Its stores, customers, plans, messages and results are fictional and held only in component memory. It never imports the retail API or customer store. Reset clears the scenario. The three-step rehearsal is deliberately shorter than the live six-step consultation.
- Contextual quick guides link to the demo. Library has five editable starter outlines; opening one never saves or publishes it. Staff must explicitly save and choose whether to publish. These are unapproved starting points, not partner materials. Training: `staff-training.md`.
- Store operations shows 30-day delivery counts, recent issues, provider configuration and worker heartbeat. Organization/operator viewers receive aggregates; only authorized location staff see customer issue rows. Provider configuration is not an actual delivery/payment test.
- Retry is restricted to managers with customer access, temporary email failures under 23 hours old, current consent, and at most three manual retries. The delivery keeps its original provider idempotency key. Unknown results, texts, bounces, old reminders and opt-outs cannot be replayed by this control.
- Follow-up queues use 25-row pages; inbox pages show 50 conversations with a one-row lookahead. Customer paging has a stable composite index. Store metadata requests are deduplicated and cached for 15 seconds within the mounted user/store workspace; successful mutations and periodic refreshes bypass cache. Chat polling fetches conversation data instead of every customer dataset.
- Billing refresh and pilot-settings save no longer reset the other form’s unsaved values. Reduced-motion preferences apply throughout the retail workspace.

Validation includes an isolated demo browser suite, expanded draft/retry browser interactions, cache failure/race tests, manager retry authorization tests and a hosted-database workflow in `scripts/test-retail-hosted.sql`. The hosted test uses synthetic identities within one transaction and rolls back all records. It does not test binary object transport or external provider delivery and never calls a provider.
