# Retail account email and verification

## Behavior

Retail signup uses `retail-auth` instead of the legacy general `register` function. The legacy endpoint rejects retailer registrations. A retailer is created unconfirmed and receives no session from signup. Email delivery must be configured before registration is accepted.

The confirmation email links to `/retailers?flow=confirm` with the single-use Supabase token in the URL fragment. Opening the page does not redeem the token; the recipient clicks **Confirm my email**. The server verifies the native token, verifies that the account is a retailer, and writes `app_metadata.retail_verified_email` before returning a session. The field must equal the current email and Supabase must report the email confirmed. Client-editable metadata cannot grant access. Retail workspace mutations and staff data-access helpers enforce that proof, including after an email change.

Resend confirmation and reset requests return neutral results for ineligible addresses. Password recovery uses `/retailers?flow=reset`, verifies a native recovery token, and requires matching new passwords before signing out. Personal account credentials remain separate. Staff invitation links survive signup and confirmation across devices.

Welcome email is attempted after confirmation. Failure does not undo verification: the next workspace visit retries. A stable provider idempotency key and server-owned sent flag prevent routine duplicates. A provider-accepted send is not a claim of inbox delivery.

Created customer/staff invitations automatically attempt branded email delivery. If delivery fails, the saved invitation remains visible with a retry button and a manual link. The server looks up the recipient and token, and rechecks current sender permissions; the browser cannot choose arbitrary recipients. Customer invitations use personal sessions; staff invitations require a separate verified retailer account.

## Branding and delivery configuration

- Provider: Resend, sending only. Receiving is disabled.
- Domain: `getmacrostack.com` (Resend ID `b48c6f0e-006a-4683-a0df-e2ea0d986bef`).
- Supabase secret `RESEND_FROM_EMAIL`: `MacroStack <hello@getmacrostack.com>`.
- Supabase secret `RESEND_API_KEY`: sending-only credential restricted to the verified domain. Never store its value in Git.
- Replies: `getmacrostack@gmail.com`; no purchased domain inbox required.
- Templates: `supabase/functions/_shared/retail-email.mjs`, dark MacroStack colors and light-blue accent. The wordmark PNG is rendered from the existing Barlow Condensed Black font by `scripts/build-email-wordmark.mjs`; email body fonts have safe email-client fallbacks.
- Five templates: confirmation, password recovery, welcome, staff invitation, customer invitation. Each includes HTML, plain text, a fallback URL and support contact.
- No SMTP change is needed: the server generates native Supabase one-time links and sends them through Resend. Disable provider click/open tracking for security emails.
- `retail-auth` keeps gateway JWT verification enabled (public registration uses the existing anonymous project JWT). Authenticated actions also verify the caller token and current database permissions.
- Shared server-side limits: 1 request/address/minute, 1 invite resend/minute, 30 requests/IP/hour and 300 global requests/hour. Hashes expire from the limiter after two days. Tune deliberately for a larger launch.

## DNS records requested by Resend

| Type | Name | Value |
|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCjFV0KbkIR/rHmSXfMibSs/MTsqpIvW7gabSw9c4IuROdKQc0yFOSHRPIAsp618VV/FhTWXTNwN9t2zFxLGzICcbm1KvxRvFRd92qHh+w2X8MbqY075mci292DxMbqBPy3gL1WTdwkOXyaPGaDOHM6PJAhGi6F/rEym0gHPY4ANQIDAQAB` |
| CNAME | `rsend` | `rsend.forge.rmta.net` |
| CNAME | `send` | `send.forge.rmta.net` |

These are public sending-verification records, not private API credentials. Do not change website records or add receiving MX records for this setup.

## Verification

- `scripts/test-retail-email.mjs`: server signup confirmation, isolation, failures, rate limits, escaped templates, and invitation permissions.
- `scripts/test-retail-email-browser.mjs`: explicit confirmation, expired-token recovery, reset mismatch, and layout at 320/390/768/1440 pixels.
- `scripts/test-retail-signup.mjs`: signup and unverified sign-in cannot reach business setup; verified sign-in can.
- `scripts/test-retail-db.mjs`: unverified retailer mutations and staff reads are blocked, service-only lookups are inaccessible to browser roles, existing customer and store isolation still hold.
- Live send and confirmation/recovery acceptance must be verified after the domain and sending credential are configured. A build alone does not establish delivery.
