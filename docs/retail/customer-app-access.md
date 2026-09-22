# Customer app records and store chat

The store customer workspace adds an App records view using the retail design system, with profile/current targets, paginated food and weight history, personal progress photos, meal plans, check-ins, submitted forms, and scheduled targets. Each page holds at most 50 records; no fixed history cutoff applies. Existing store consultations, nutrition plans, assessments, notes, tasks, check-ins and chat remain available in their own sections.

`share_app_records` defaults to false, including for existing relationships. Only the linked customer can opt in or revoke through App records. Existing activity-sharing consent permits food/weight reads; additional categories require expanded consent. Access requires an active, enabled, eligible store relationship and existing staff permissions. Corporate aggregate access does not grant individual customer access. The RPC returns selected customer fields rather than entire profile rows. Private coach conversations, coach workspace notes and internal coach review state are excluded.

Personal photo access is SELECT-only, tied to the stored photo path and the same relationship/consent checks. Signed links last 120 seconds; already issued links can remain valid until expiration after revocation. Store staff cannot modify or delete personal photos through this grant.

Customer chat opens from the customer workspace primary action and section navigation. The personal app has a Store chat shortcut to `/retail/member?chat=1`, preserving the personal session and opening the store conversation after store selection. Coach and store conversations remain separate.

Verification: retail database tests cover default denial, staff inability to grant consent, unrelated-user denial, opt-in/revocation, private photo RLS, and paginated historical records. Responsive tests cover staff/customer navigation and app records at 320/390/768/1440px. Deploy the migration before releasing the frontend.
