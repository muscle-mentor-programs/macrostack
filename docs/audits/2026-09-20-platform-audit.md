# Platform audit — September 20, 2026

## Result

A broad regression and failure-handling audit found and fixed reproducible persistence and email issues locally. This is not a certification that every platform behavior is bug-free. No production deployment or database migration was performed.

Base: local HEAD and origin/master both `c157e1f03afc0d3154dd945a3e749ea516d69a42`. The changes below were uncommitted at audit completion and prepared for release afterward. Existing untracked AGENTS.md, docs, and outputs were preserved.

## Fixes

- Member and coach profile editors now await successful persistence, display failures, retain drafts, and allow retry. Updates affecting zero rows cannot report success.
- Account-name synchronization failures are reported separately from a successful client-profile update.
- Food edits/deletes preserve existing entries when rejected. Copy-day only appends confirmed entries and avoids duplication when realtime updates arrive first.
- Weight adds/deletes preserve history on failure. Failed adds retain the input, show an error, and reject nonpositive/nonfinite values.
- Email endpoints now check provider error responses instead of treating every resolved promise as success. Bulk delivery reports partial failures accurately.
- Email recipients are checked against the authenticated account and its coaching roster. Member reports target the signed-in account email.
- The email authorization check uses the caller's token and database row-level security; it does not use a service key.
- Added `npm test` with 11 core suites. The GitHub Actions integration remains a local change because the GitHub connection lacks workflow-write scope.
- Repaired the notification test's machine-specific database-runtime import and made the gyms test URL configurable.
- Corrected ESLint's Node environment configuration; excluded generated outputs.

## Verification

| Area | Evidence |
| --- | --- |
| Production build | `npm run build` passed, including the final resumed run |
| Core regressions | All 11 `npm test` suites passed: workspace, account roles, checkout/webhooks, Marketplace, moderation, Stripe Connect, subscription access, presentation helpers, persistence, email results and authorization |
| Dependencies | `npm audit --omit=dev --audit-level=high`: zero vulnerabilities |
| Coach UI | Responsive suite passed at 320, 390, 430, 768, 1024, 1440 and 1920 pixels in both themes; included roster, journal, check-ins, tasks, navigation and failed message/meal-plan saves |
| Member paywall | Free/Pro/downgrade browser checks passed; isolated database tests covered nine entitlement states and blocked weight bypasses |
| Food forms | Decimal visibility, keyboard-height viewport, invalid amounts and corrupted serving-size recovery passed across tested sizes |
| Share cards | Mobile/desktop export, photos, downloads, cancellation, missing fonts and multi-card ingredient preservation passed |
| Marketplace | Mobile/desktop moderation UI passed; isolated database tests passed approval, rejected writes, edit resets, stale decisions, Stripe updates and republishing |
| Dual role | Mobile/desktop activation, failure/retry, separate subscriptions and original member data passed |
| Profile failure UI | Both member and coach editors retained drafts after rejected/thrown saves and succeeded on retry |
| Gym page | 320/390/1440 layout, images, pricing, email-draft and direct-route checks passed |
| Live public routes | Home, gyms, marketplace, login and signup returned 200 at 390 and 1440 pixels with no recorded page exceptions or horizontal overflow |
| Database notifications | 13 isolated checks passed: first payment, retry, renewal, rollback, ownership and write protection |
| Live database review | All public tables had RLS enabled; profile UPDATE grants were limited to permitted profile fields; inspected admin RPCs enforce superadmin checks; Marketplace message/check-in gates are restrictive policies |
| Diff hygiene | `git diff --check` passed |

Browser tests use Chrome and isolated fixtures. Payment/email tests mock external services. Live checks were read-only and ran before the local fixes were deployed.

## Remaining findings and coverage limits

1. **Lint is not clean:** 47 errors and 20 warnings remain, chiefly unused code, React effect/purity rules and mixed component/helper exports. These are not 67 demonstrated runtime bugs, but they need a separate cleanup with behavior verification.
2. **Other persistence paths need further hardening:** several older store mutations still discard database errors, including client removal, hydration, reminder preferences and some template/custom-food operations. This pass fixed profile, food edit/copy/delete and weight mutations, not every mutation.
3. **Existing Supabase advisories remain:** legacy publicly executable SECURITY DEFINER functions, `pg_net` in public, and leaked-password protection disabled. Inspected admin functions enforce role checks; an advisor flag alone does not establish an authorization bypass. Two server-only Stripe tables intentionally have RLS without user policies.
   - [Function privilege guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
   - [Extension schema guidance](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
   - [Password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
4. **Historical database drift remains:** see `docs/sync-baseline.md`. No blanket migration replay or schema synchronization was attempted.
5. **Performance:** the food dataset chunk remains about 3.49 MB uncompressed / 500 KB gzip; Vite reports a large-chunk warning. Build success does not certify fast loading on every device/network.
6. **Not verified end to end:** physical iPhone/Safari keyboard behavior, real purchases/refunds, actual email/push delivery, camera hardware, every superadmin tool, and every production account/data combination. No customer notifications or charges were generated.

## Release state

At audit completion these fixes were local only. Release verification is reported separately and must confirm GitHub/Vercel commit identity, the production domain alias, and the affected flows. No Supabase schema/function changes are included.
