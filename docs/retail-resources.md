# Retail Resources

Resources replaces the retail Library navigation with a reusable catalog of meal plans, forms, and guides.

## Workflows

- Managers create store resources; organization administrators can also create corporate resources.
- Staff can use published customer-facing resources for active, authorized customers. Staff-only guides never have a sharing action and the API rejects assignment.
- Meal templates use the existing food database builder. Applying one opens a personalized copy and publishes nutrition targets through the existing optimistic-concurrency checks.
- Managers can save a customer meal plan into Resources as a draft.
- Forms support short/long text, numbers, choices, required questions and optional due dates. Customers submit from their store workspace or the Resources button in store chat. Completion posts a store chat update.
- Guides are shared with an optional chat message and can be marked read.
- Customer assignments retain title, content, resource version and responses. Catalog edits/archiving do not change those copies. Meal-plan removal clears its assignment reference but preserves the snapshot.
- Published resources can be duplicated when allowed. Used resources are archived, never deleted.
- Existing legacy outlines are copied into the catalog as staff-only material. Existing intake behavior remains intact; new reusable forms are explicitly assigned.

## Data and authorization

Migration: `20260922210354_retail_resources_workspace.sql`.
New tables: `retail_resources`, `retail_resource_assignments`. Browser roles receive SELECT under RLS; writes go through `retail_resource_command` with explicit permission and revision checks. The catalog returns usage counts limited to assignments the caller can access.

One request ID identifies an assignment and its chat message. Transaction locking and retries prevent duplicate assignments/notifications. Meal publication and assignment insertion happen in one transaction.

Catalog retrieval is capped at 1,000 resources; assignment history shows the latest 500 accessible assignments. Customer selection is searched/paginated in groups of 50. Due dates are displayed; this release does not introduce automatic due-date reminder scheduling.

## Verification

- `scripts/test-retail-db.mjs`: RLS boundaries, staff-only denial, immutable snapshots, idempotency, required answers, archive preservation, meal-plan assignment and removal.
- `scripts/test-retail-resources.mjs`: create, select customer, share, personalize meal plan, complete form and read guide at mobile/desktop widths.
- Existing responsive, customer connection/chat, build and core suites.

Apply the committed migration before releasing the client bundle. No Edge Function deployment is needed.
