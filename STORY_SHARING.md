# Story sharing

## Meal ingredient cards

Meal exports pair a photo hero with a dark ingredient panel, numbered foods,
logged quantities, whole-meal calories and macros, and the existing MacroStack
logo and wordmark in the top left, Barlow Condensed / Space Grotesk type, and blue/green accents.
The photo normally fills the top 1080 × 1110 region of each 1080 × 1920 image;
wrapped food names reserve extra panel height when needed. Position sliders crop
within that region. Ingredient rows use compact spacing with extra room for long
names and quantities. The bottom panel sits lower to leave more photo space;
calorie and macro values share a baseline, with their labels aligned below. The ingredient panel is opaque for readability.

Each card includes up to six logged foods in their original order. Meals with
more foods have Previous/Next controls and numbered export filenames. Share or
download each card to include the complete list; every card repeats the nutrition totals for the complete meal. Long names wrap to three lines and then use an ellipsis.
Logged amounts use quantity/serving metadata or legacy gram amounts; unknown
amounts stay blank. Labels with embedded quantities retain their meaning (for
example, 0.5 × 2 tablespoons). Foods are meal-slot log entries, not an invented
recipe title or an inferred ingredient breakdown of packaged foods.

Take Photo requests the rear camera through a system file input. Choose Photo
is the gallery/desktop fallback. Meal sharing requires a photo; daily totals
retain the photo-free THE DAILY STACK graphic and macro-goal progress bars.
The selected log date is used, including historical dates.

## Privacy and sharing

The snapshot allowlist includes food names and formatted serving labels plus
nutrition totals, goals, meal label, and date. Account IDs, private notes, and
other record fields are excluded. Photos are decoded locally, bounded to 2400px,
and cropped in Canvas. Nothing is uploaded. The exported PNG does not retain
photo EXIF/location metadata. Unsupported files, files over 20 MB, and decoding
errors produce recoverable errors. Picker cancellation preserves the photo.

Preview rendering uses a persistent canvas. PNG encoding waits for 250 ms of
settled input. Page/crop/photo changes invalidate the previous downloadable
asset until the current card is encoded, preventing stale exports. Object URLs
are revoked. Generation precedes the final Share tap to retain user activation.

Native sharing uses navigator.canShare and navigator.share with PNG files only.
Download remains available when sharing is unavailable or canceled. Users choose
the destination and finish publishing. Direct Instagram Stories integration is
not implemented; native iOS/Android work and physical-device testing would be
needed for that. No database change or new application dependency is required.

## Verification

- Production build and focused ESLint for the sharing component and renderer.
- Start the synthetic fixture: `node scripts/story-share-qa-server.mjs`.
- Run `node scripts/test-story-share.mjs` in a second terminal. It resolves
  `playwright`, or accepts an absolute module path through `PLAYWRIGHT_MODULE`.
- Tests use fictional data: 390px/1440px previews, 320px fallback, PNG dimensions,
  downloads, pagination/export filenames, all 13 foods across three cards,
  quantities, long names, snapshot privacy, crop updates, cancellation, invalid
  files, and failed font loading/retry. Native sharing is mocked; no posts occur.
- Generated images are written to `outputs/story-share/` for visual review.
- Physical iOS/Android share-sheet behavior still needs device QA.
