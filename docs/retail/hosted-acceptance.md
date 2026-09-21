# Hosted retail acceptance

This opt-in test uses real Auth, PostgREST, Edge Functions and private Storage. It is deliberately excluded from CI. It creates four synthetic accounts and one synthetic store, uses no actual customer data, opts out of external reminders, and never invokes checkout. Retailer registration sends a real confirmation email to an explicitly supplied, controlled test mailbox.

## Run safely

1. Create a private temporary JSON file outside the repository, with permissions `0600`, containing `url` (the MacroStack Supabase URL) and `key` (its public anon key), plus `retailTestEmail` (an unused mailbox you control and authorize for this test). Do not use a service-role key. The test writes generated account credentials here; never print, commit or share this file.
2. Run `node scripts/test-retail-live.mjs register /absolute/private/state.json`. The manager uses retailer registration and must confirm the received email before the verify step. Other synthetic accounts use personal registration. No automatic confirmation bypass is used.
3. Through authorized database administration, give only the newly returned synthetic **admin** profile the `superadmin` role. Check the exact account UUID and run-specific `@example.invalid` email before updating it. Never use an actual user's account for this test.
4. Run `node scripts/test-retail-live.mjs verify /absolute/private/state.json` once. This creates the synthetic store and exercises email-matched staff/customer invitations, intake, publication deduplication, private-note isolation, member messaging/check-ins, unverified-phone rejection, real file transfer in both directions, unrelated/anonymous file denial, and manager-only health access. Configuration booleans mean credentials are present, not that a provider transaction succeeded.
5. Even after a failure, run `node scripts/test-retail-live.mjs remove-files /absolute/private/state.json` before database cleanup. This removes binary objects using their uploader's actual Storage permissions.
6. Run `node scripts/test-retail-live.mjs cleanup-sql /absolute/private/state.json`. Review the generated SQL and execute it through authorized database administration. It targets the exact random run identity and refuses cleanup if test storage objects remain. It removes synthetic retail records, sessions, profiles and accounts. Never delete Storage metadata directly to bypass object cleanup.
7. Verify zero test accounts, objects, organizations and locations remain. Delete the temporary credential file. On an interrupted run, retain that private file until cleanup is complete; it records account emails before signup and object paths before upload.

This checks real service transport. It does not establish a full signed-in browser walkthrough, staff usability acceptance, actual provider delivery or a successful payment.

## September 20, 2026 evidence

- Four accounts registered and signed in using the actual hosted services.
- Both wrong-email invitation attempts were rejected; intended staff and customer claims succeeded.
- Intake, publication retry, private-note isolation, member message and check-in passed.
- Both manager-to-member and member-to-manager binary PNG upload/download passed with byte-for-byte equality.
- Unrelated and anonymous signed-file requests were denied.
- A manager could read operations health; the member could not.
- Billing credential presence: true. Email, SMS and worker configuration: false.
- Test objects, sessions, accounts and retail records were removed after the run.

## Remaining activation dependencies

- First store name/timezone, billing contact and staff roster.
- Approved partner resources and staff acceptance walkthrough.
- Resend verified sender/API key/webhook secret; Twilio approved sender/credentials/webhook and phone verification provider.
- Matching worker secret in Edge configuration and Vault.
- Stripe account identity/invoice/portal review, followed by test-mode checkout, failed-payment and cancellation verification. Existing production credentials must not be used to simulate a purchase.
- Actual consenting recipients for provider delivery, reply and opt-out acceptance.

InBody and POS integrations remain deferred.
