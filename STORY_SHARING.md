# Story sharing

The food log has a Share action for each populated meal slot and a Share daily
totals action. The dashboard also offers daily totals. The selected log date is
used (including historical dates), not the device date. Meal slots are the app's
existing logged-meal grouping; saved-meal bundle names are not retained by the log.

`StoryShareButton` snapshots an explicit allowlist of nutrition fields. It opens
a native dialog and generates a 1080 × 1920 PNG with Canvas 2D, local Barlow
Condensed / Space Grotesk fonts, and the existing shaded logo. No screenshots,
server rendering, uploads, referrals, account details, or analytics are involved.
Font licenses are alongside the font assets. Display values are rounded to whole
units; the underlying totals helper and calculations are unchanged. Missing goals
display a dash. Long food lists show four items and an additional-item count.

Native sharing uses `navigator.canShare({files})` and `navigator.share({files})`.
The PNG is prepared before the final tap so no asset-loading await precedes the
share call. Download remains available, including when native sharing is absent,
blocked, canceled or Instagram is unavailable. Users choose the destination and
complete publishing themselves. No URL or clipboard text is sent.

Direct Instagram Stories handoff is **not implemented**. The current Capacitor
wrapper has no native sharing plugin/Instagram bridge. Safari/browser share-sheet
targets depend on the OS and installed apps; Instagram Stories cannot be forced.
A future direct integration needs separately scoped native iOS/Android work and
device testing. No native dependency was added for this feature.

## Verification

- `npm run build`
- `npx eslint src/components/StoryShareButton.jsx src/lib/storyImage.js`
- Synthetic browser harness: `node scripts/story-share-qa-server.mjs`
- In another terminal: `node scripts/test-story-share.mjs`

The browser tests use the existing local Codex Playwright runtime (path in the test
script), not a new app dependency. They cover desktop/mobile previews, PNG size,
download, mocked native sharing, cancellation, missing assets/retry, privacy field
allowlisting and long text. They never sign in or publish anything. Actual mobile
Safari, the Capacitor webview, and Instagram posting need a physical-device check.
Generated QA images use fictional food/goal values in `outputs/story-share/`.

No database migration or production deployment is part of this change.
