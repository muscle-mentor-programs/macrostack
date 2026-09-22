# Retail customer workspace redesign

## Structure
Six main destinations: Overview, Nutrition, Food journal, Progress, Check-ins, Chat.
More contains Intake, Private notes, History & exports, and Connection settings.
The legacy App records entry maps to Nutrition; its record categories are distributed
between the relevant destinations. Customer-controlled sharing remains separate from
staff-controlled relationship management.

## Nutrition contract
Migration `20260922183826_retail_customer_workspace.sql` must ship with the frontend.
- `retail_nutrition_state` returns current targets, the app client ID, active plan,
  and a snapshot version after checking relationship access and app-record consent.
- Every target/plan write must include `_client_id` and `_version`. The database locks
  that client row, checks its relationship and current values, and rejects stale writes.
- The relationship retains an explicit nutrition client association after the first
  validated write. Initial resolution follows the existing app-client ordering.
- Publishing guidance no longer triggers an update of live app targets. Existing
  guidance keeps its historical target snapshot.
- Plan publishing retains its request-ID retry behavior, preserves earlier plans,
  and requires a visible replacement confirmation when an active plan exists.
- New conversations inherit the assigned relationship specialist unless overridden.

## Drafts and permissions
Consultation drafts carry `flow_version: 2`. Legacy six-step positions map into the
four-step flow. Intake is used only as initial staff-draft context; original customer
answers remain unchanged. Publishing retains the existing cancellation of superseded
open consultation tasks, completed-task history, and deduplication rules.

Staff notes remain staff-only. App activity and broader app-record consent retain
separate scopes. Reminder saving reports partial progress if a later operation fails.

## Verification
- Six-width staff/member workflow suite, including draft failure/recovery and publishing.
- Meal-plan builder, store invitation, branding and customer chat regression suite.
- PGlite database suite: permissions, store isolation, target stale-write rejection,
  wrong-client rejection, guidance isolation, publication retries and existing operations.
- Core test suite, targeted ESLint, production build, and diff checks.

## Release
Relevant hosted function definitions and migration history were inspected read-only
before authoring this migration. Historical drift in `sync-baseline.md` remains.
No blanket database push. Apply this exact migration, then deploy the matching app
commit and verify customer flows. There are no changed Edge Functions.

The migration deliberately rejects legacy target writers that omit the snapshot.
Coordinate database/frontend deployment; during that interval older open editors must
reload. Do not roll the frontend back to a version without snapshot metadata while
leaving the new write contract active. If rollback is necessary, retain the new schema
column and restore the previous function definitions from the prior migration after
review; do not delete customer data or newly authored records.
