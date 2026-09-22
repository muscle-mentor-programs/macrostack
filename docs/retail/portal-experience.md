# Retail portal experience and customer connection

## Account flow and branding

Returning verified retailers with an existing workspace see a welcome card, not business setup fields. Workspace detection has explicit loading and retry states. Only confirmed absence of membership allows creation.

Organization administrators can upload transparent PNG/WebP logos (2 MB maximum, 4096 px source limit, normalized to PNG at 1200 px maximum) and choose a display name. Public brand assets are stored separately from private customer files. Branding appears for authorized store staff and linked customers with a permanent Powered by MacroStack attribution. Logo storage writes and branding changes require organization administration permission.

## Customer invitations and chat

Existing `/retail/member?invite=...` email links now open a dedicated invitation flow. A valid, unexpired random invitation token retrieves only the intended email, account-existence flag and store branding. New customers create a personal account; existing customers sign in. A branded confirmation dialog requires explicit connection consent and optionally expanded app-record sharing. Email matching, verified-email requirements, active-store checks and single-use acceptance remain enforced by the existing server command.

Store conversations appear in the normal customer Messages area alongside the coach conversation entry. Customer chat reads and writes use the existing scoped retail conversation APIs, idempotent message IDs and read receipts. Store unread counts contribute to the Chat navigation badge. Customers retain their separate coach connection and private coach conversations.

## Nutrition tools

The retailer meal-plan editor uses the same bundled food database, custom foods and relevance ranking as the coach editor. It reuses the coach MealPlanBuilder component for the same desktop split-pane and mobile plan/search layout, brand/name searches, serving quantities, automatic macro scaling, multiple days and day totals. Retail-specific targets and publish actions are supplied by its wrapper. Shared custom foods remain subject to their existing RLS.

Publishing creates an actual `meal_plans` record, assigns it as the customer's active plan and updates their actual calorie/protein/carbohydrate/fat targets atomically. Retry request IDs avoid duplicate plans. Only authorized staff for an active customer relationship may publish. Staff can read their own authored plans without requiring consent to unrelated historical records. Targets can also be saved independently without replacing the meal plan. Publishing a consultation carries its supplied nutrition targets into the customer app. The latest published targets win; the UI explains this where coach and store relationships coexist. The app refreshes nutrition on foreground and its existing visible-page refresh interval.

## Design

The retail workspace expands to 1760 px; the meal builder expands to 1280 px with two desktop meal columns and a single mobile column. The store selector accommodates longer names. Navigation order is Today, Customers, Inbox, Library, Store. Shared spacing separates standalone actions from cards. Deferred integration notices are removed.

A shared MacroStack loading splash covers page/account/workspace loading. Retail public-page reveals match the homepage/gym timing, portal headings reuse ScrambleText, and subtle portal entrances reuse workspace motion tokens. Reduced-motion preferences disable animation, including scramble text.

The retailer landing page covers customer care, nutrition, messaging, consultations, branding, team permissions, multi-location operations, customer benefits and FAQs using existing project assets and typography. Account and verification screens remain focused.

## Deployment order and checks

Apply `retail_portal_branding` before `retail_customer_connection`, then release the frontend. No Edge Function edits are necessary: existing customer invitation URLs are handled by the new route. Keep existing historical migration drift separate; do not run a blanket database push.

Local checks: core tests, build, retailer signup/responsive flows, invitation signup/login and consent, branding upload/removal, food gram/serving conversion and nutrition publishing, customer chat read/send, database permission and retry tests. These local fixtures do not replace live deployment and authenticated-flow verification.

## Customer photos and feature entry points

Customer cards and records support store-managed profile photos in the private `retail-avatars` bucket. Only authorized staff for that customer relationship may upload, replace or remove its photo; scoped customer access is required to view it. Images use expiring signed URLs and remain separate from personal app avatars and progress photos. Apply `retail_customer_avatars` before releasing these controls.

Nutrition opens with the food-database meal-plan builder; consultation guidance is a separate secondary action. App plan assignment requires an active, accepted customer connection. Organization administrators can use the persistent Brand your portal shortcut to reach Store logo & portal branding.

Retail page headers and typography follow the coach header system without changing retail navigation. The existing saved light/dark switch is available in the retail toolbar. Customer app tab loading uses lightweight skeletons; branded loading remains for startup. Shared retail spacing separates form labels/help, headings, dialog controls, action groups, rows and expandable sections.
