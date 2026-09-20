# Retailer self-service

Retailers start at `/retailers` (also `/retail/start`). The main website navigation links to Retailers. They create a regular MacroStack identity or sign in to an existing one, then enter their business, first store, timezone and billing contact. This does not change their personal account role or subscription.

`retail_command('start_workspace', ...)` creates the organization, corporate operator, first location, organization-admin and location-manager memberships, and a $599 USD/month draft contract in one transaction. A profile-row lock and unique owner mapping return the existing workspace on retries. Revoked owners cannot regain access by retrying. Names, timezone and billing fields are validated on the server; account locks are respected. The owner mapping has RLS and no direct browser writes.

The workspace opens on Store setup with billing first. Owners can prepare resources and invite staff without a payment. New self-service stores have no free sponsorship and remain disabled for customer operations until the existing signed Stripe webhook verifies the store subscription. Creating an account/workspace never charges a card. Checkout is a separate explicit action. The server fixes the amount at $599/month, regardless of browser input. Owners can edit their own unstarted contract contact details, but cannot change price or grant themselves sponsorship.

Verified subscription synchronization enables self-service stores. Cancellation, unpaid, paused and expired incomplete subscriptions disable them. Store operations and uploads check paid-through time; owners cannot bypass activation with the enable-store control. Existing administrator-provisioned pilots preserve their previous behavior. Additional self-service locations receive independent draft contracts and manager membership for their creator.

Existing staff open `/retail`. Customers continue to use store QR/private invitations. Owners have access to Today, Customers, Consultations, Inbox, Library and Store, including published plans, check-ins, progress files, manual assessments/CSV import, staff administration and reporting, under the existing permissions.

Email/SMS provider activation still requires sender configuration. InBody/POS automation remains deferred. Self-service signup does not claim partner approval, alter Stripe legal identity, or activate an unconfigured external sender.

## Verification

- `scripts/test-retail-signup.sql`: transactional server acceptance covering owner memberships, retries, validation, price protection, access isolation, paid activation, cancellation, additional-store billing and locked accounts. Run as part of `scripts/test-retail-db.mjs`; it can also run against the hosted database with rollback.
- `scripts/test-retail-signup.mjs`: real UI with synthetic service responses at 320/390/768/1440 pixels; verifies signup, role choice, business fields, retry recovery and workspace redirect.
- Existing retail database, responsive workspace and core suites remain release checks.
