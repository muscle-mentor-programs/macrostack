# Retail demo workspace

The retailer demo uses the production retailer sign-in and the real `RetailApp` at `/retail`. It does not use a separate portal, client-side password check, or browser-only sample records. The guide appears only after Supabase verifies the dedicated retailer account at `demo@getmacrostack.com`; closing it leaves the user in the live portal, and **Replay tour** is available in the header.

The demo account belongs only to a dedicated **MacroStack Retail** organization with sample locations and records. Sample customer email addresses use the reserved `example.com` domain. No actual customer profile should be linked to a sample relationship. The organization is non-billing, and no real customer invitation should be sent from it.

The dedicated account must be email-confirmed and have Supabase Auth app metadata `account_type=retailer` and `retail_verified_email=demo@getmacrostack.com`. It also needs an active organization-administrator staff membership and location-level manager memberships to display the whole portal. These are production configuration records, not application seed data; do not store the account password, Supabase service key, or database contents in Git.

After provisioning, verify sign-in at `/retailers?signin=1`, the redirect to `/retail`, the guide on the actual Today/Customers/Inbox/Resources/Store screens, Back/Next/close/replay behavior, and data isolation from other retailer organizations. Revisit the shared sample records periodically because visitors can change demo data while exploring.
