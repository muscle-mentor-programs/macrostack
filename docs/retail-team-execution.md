# Retail teams and company resources

The retailer workspace supports chain administrators, franchise administrators,
regional managers, store managers, nutrition specialists, associates, and
read-only reviewers. Roles carry server-enforced capabilities for customer care,
nutrition, messaging, resources, team management, reporting, exports, billing,
branding, and customer removal. A manager may further narrow an employee's
capabilities. Customer visibility follows assigned store and employee scope.
Existing memberships retain access through their original role defaults.

Chain administrators can invite employees to one or several stores, review the
exact scope before sending, resend or cancel pending invitations, edit access,
and suspend or reactivate staff. Suspending access immediately blocks the
existing session's store actions and requires assigned customers, tasks, and
conversations to be transferred or deliberately moved to an unassigned queue.
The Team view shows the directory, pending invitations, and recent access
changes.

The Resources area supports store drafts, company approval, distribution by
store, controlled personalization, and required staff references. A revision
of a published resource remains a separate draft until approval. Approval
archives the previous published version and publishes the reviewed version.
Required references appear on Today until the employee acknowledges the current
version. Read-only reviewers can inspect allowed records but cannot mutate them.

The Customers page offers Cards and List views, remembers the chosen view on
that device, and shows photo or initials, name, email, and the assigned employee.

## Release checks

- Full application tests, lint, build, and production dependency audit.
- Local database migration and permission tests against the current schema.
- Mobile and desktop Chrome checks for customer directory, resources, and team
  invitations/suspension.
- Compare remote migration history and schema before applying this migration.
- Verify the pushed commit, production deployment source, and production alias.

Historical migration drift is documented in `docs/sync-baseline.md`; this
release applies only its uniquely versioned new migration and does not replay
older migrations.
