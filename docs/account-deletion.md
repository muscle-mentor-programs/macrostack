# Account deletion requests

MacroStack lets signed-in users start a permanent account deletion request from User Profile or Coach Profile. The app sends an authenticated request to `api/account/deletion-request.js`. Vercel uses Resend to notify the deletion inbox and acknowledge receipt to the user. A staff member must complete deletion and email the user; receiving a request does not delete the account.

## Configuration

- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` must be configured for Vercel Production. Existing email routes use the same values.
- `ACCOUNT_DELETION_EMAIL` is the monitored staff inbox. If unset, the route uses the contact address in `public/privacy.html`.
- Test this route with a dedicated confirmed-email test account before App Store submission. The staff message must arrive, the user must receive a receipt, and an undeliverable staff message must produce an error in the app.

## Process each request

1. Match the request ID, user ID, and email in the staff message to the Auth user in Supabase. Never choose a deletion target solely from an email address in an untrusted message.
2. Review active Stripe subscriptions, coach marketplace orders, retailer relationships, and any retention obligations. Cancel or resolve ongoing billing and tell the user if any records must be retained by law.
3. Inventory the user's personal rows and owned Storage objects. Include client rows linked through `clients.profile_id`, logs, messages, check-ins, progress photos, avatars, chat attachments, coach content, and retailer records. The existing `admin-delete-user` function is **not** the account deletion workflow: it intentionally keeps client data and allows relinking on a later signup.
4. Delete personal Storage objects through the Storage API. Supabase will reject Auth user deletion if the user still owns Storage objects. Remove associated personal database rows, respecting shared records and foreign keys, then delete the Auth user. Do this with a reviewed, account-specific plan; do not run a blanket migration or broad table delete.
5. Verify that the Auth user and personal data are gone, that billing is resolved, and that retained records are limited to what is legally required. Send the user a completion email describing any retention.

Apple permits a manual account deletion process, but the in-app request and staff completion are both part of the release. Do not describe account deletion as automatic or complete until step 5 is verified.
