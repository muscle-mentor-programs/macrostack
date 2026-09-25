# MacroStack iOS release checklist

The App Store distributes the installed iOS build. Supabase remains the database, Auth, Storage, and Edge Function backend. Vercel continues to host the website and `/api` functions. Native app builds use the web assets in `dist` (`capacitor.config.json`); publishing the website alone does not update those bundled assets.

## Before each build

1. Work from a reviewed, committed source revision. Check `docs/sync-baseline.md` before any database or production release work. Keep unrelated work out of the release.
2. Install dependencies with `npm ci`, run `npm test`, `npm run lint`, and `npm run build`. Run the CI production dependency audit.
3. Run `npm run ios:sync` after web changes. This builds and copies `dist` into Xcode's app project.
4. Ensure the build has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public client values). For a native build, `/api` calls use `VITE_API_ORIGIN`, defaulting to `https://www.getmacrostack.com`. Never place the Supabase service role key or Resend key in a `VITE_` variable or the iOS bundle.
5. Verify the production Vercel functions have `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and a monitored `ACCOUNT_DELETION_EMAIL`. The deletion request route uses the contact address in `public/privacy.html` if the last variable is absent.

## Test on iPhone and iPad

- Sign in with a dedicated test account and verify a fresh launch, returning launch, sign out, and sign in again.
- Check food logging, coach connection and messages, profile updates, photos, barcode scanning, and all features the release makes available.
- Exercise a Vercel `/api` feature from the native app and verify both preflight and authenticated response. `capacitor://localhost` is the allowed native origin. Confirm ordinary web requests still work.
- Submit an account deletion request using a dedicated confirmed-email test account. Verify the staff message and user receipt, then complete the manual process in `docs/account-deletion.md` and send completion confirmation.
- Test poor connectivity, declined camera or microphone permission, and an expired session. Confirm no blank screen or silent data loss.

Simulator tests are useful, but a physical iPhone test and TestFlight pass are required before the first public release. Do not use a production customer account to test deletion.

## App Store Connect

1. Enroll in the Apple Developer Program, configure signing for `com.getmacrostack.app`, and create the app record.
2. Set initial App Store availability to **United States only**. The current native upgrade screen directs users to the website; Apple's U.S. storefront rules currently allow external purchase calls to action without an entitlement. Review the rule again before submission and revisit the flow before adding other storefronts: <https://developer.apple.com/app-store/review/guidelines/>.
3. Prepare the icon, screenshots, description, support and privacy URLs, privacy disclosures, review notes, and a working demo account. The deletion request is manual and must be described accurately.
4. Increment the Xcode version and build number, archive, upload, and test the exact build in TestFlight. Submit that build for App Review when the checks above pass.
5. After approval, verify the exact App Store version and monitor crashes, authentication, Vercel API errors, Supabase errors, deletion requests, and user feedback.

Current state: the iPhone and iPad simulator sign-in screens have launched, and the iPhone simulator opened the signed-in dashboard. Source builds and local tests have passed. Signed-in feature flows, the deletion request against deployed services, physical device testing, TestFlight, signing, and App Review remain unverified until completed.
