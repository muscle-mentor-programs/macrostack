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
