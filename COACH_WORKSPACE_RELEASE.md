# Coach workspace release

## Included

- Workboard with client search, attention filters, unread/check-in counts, and due follow-ups.
- Shared desktop/mobile Client Hub: Summary, Journal, Notes, Tasks, Reviews, Timeline, Plan.
- Private notes with templates, tags, pins, append-only revisions, retained original notes, explicit save status, and in-session draft recovery.
- Tasks with due dates, responsible person, completion/reopen history.
- Logged-day weekly averages, check-in comparison, recorded reviews, and a separate client-ready summary for copying into Messages.
- Journal review markers and private meal comments.
- Timeline combines workspace history, messages, check-ins, photos, weights, and meal-plan creation.
- Manual plan snapshots/rationale. All original target, plan, photo, form, messaging, and dashboard controls remain accessible.

## Verification

- Production build passed; existing large food-search bundle warning remains.
- Focused ESLint passed for new workspace components and data helper.
- `node --test scripts/coach-workspace.test.mjs`: four tests, covering unknown intake, date boundaries, revisions, and retry after a committed write with a lost response.
- Local browser fixtures at 1440px and 390px: note failure/retry, original-note preservation, revisions/history, task completion, review summary, all hub sections, old dashboard navigation, and mobile top spacing.
- 33 coach/client/admin route-width fixture checks: meaningful content, no page errors or document overflow. These are smoke checks, not exhaustive feature coverage.
- Screenshots reviewed on desktop and mobile; fixed mobile workboard header overlap.
- Production SQL transaction test under the authenticated role: assigned-coach insert/read/revisions passed, update/delete denied, other-user reads and forged author inserts denied. Rolled back; verified zero workspace records remained.
- Both migrations were applied manually by the project owner. Grants and row policies inspected live.

## Limits and remaining work

This is the coach workspace release, not completion of every previously discussed expansion.
Automatic target-change history, scheduled outbound task reminders, persistent browser-restart draft recovery, document management, and a complete rebuild of every legacy coach screen are not included.
Client summaries are copied manually into Messages; private records are never automatically sent. Task ownership is coach-tracked, not an assignment notification.
Historical target values cannot be reconstructed from current targets. Plan snapshots are explicit documentation, not an automatic audit trail. Meal-plan timeline entries show creation only, not all edits.
Draft recovery is in memory for the current session; save before closing/reloading. Original notes now use an explicit Save button.
Browser testing used sample data with production requests blocked. SQL permissions were tested independently; an authenticated production browser save roundtrip and physical iOS PWA check remain manual QA.
Existing database security-advisor notices unrelated to this new table were not modified.

## Deployment and rollback

Deploy only the committed source through the linked MacroStack Vercel project under muscle-mentor-programs.
Previous production source: `db77f39`.
Rollback the application to the prior Vercel deployment if required; retain both additive database migrations and all workspace rows. Do not drop the table to roll back the UI.
No existing client records, authentication, payments, or landing-page files were changed by this release. Database QA writes were rolled back.

## Changed surfaces

`src/App.jsx`, `src/components/Sidebar.jsx`, `src/components/CoachBottomNav.jsx`,
`src/pages/coach/Clients.jsx`, `src/pages/coach/mobile/MobileClients.jsx`,
`src/pages/coach/CoachWorkboard.jsx`, `src/components/coach/ClientWorkspace.jsx`,
`src/components/coach/CoachWorkspace.css`, `src/lib/coachWorkspace.js`,
`src/store/index.js`, `scripts/coach-workspace.test.mjs`, and the two coach-workspace migrations.
