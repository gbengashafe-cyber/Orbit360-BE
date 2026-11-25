# ORBIT 360 Notification Center

**Role-based expansion status:** the product owner approved sequential training review, eligible reviewer queues, confidential complaint reviewer alerts, workflow-specific categories and occurrence-aware best-effort deduplication. These new decisions are separate from the existing D1–D7 below. Only the training HR-stage correction has been implemented in this partial pass; role-based events, categories and queue delivery remain unimplemented. See [role-based plan](ROLE-BASED-NOTIFICATIONS-PLAN.md) for current status and blockers.

This document describes the Phase 2 Notification Center foundation, Phase 3 employee-facing workflow integrations, and the Phase 4 Exit Management and preference integrations currently implemented. It distinguishes implemented behavior from approved product decisions and recommended practices; event definitions alone do not imply that a workflow dispatches an event.

## Purpose and architecture

The Notification Center stores employee-facing notification snapshots in one central `notifications` table. Business features call the central notification service with a registered event and payload. The service validates the payload, resolves recipients, renders the title/message and metadata, applies the recipient's channel preferences, and writes notification rows. The API exposes only the authenticated user's feed, preferences, pending real-time alerts, read state, and alert acknowledgements.

There is no event bus, durable outbox, push service, WebSocket, SSE, or module-specific notification system in this implementation. Real-time alerts use an authenticated polling endpoint with acknowledgement. No public route creates notifications. Workflow integrations are performed in the owning business workflow, not by adding notification behavior to the feed API.

### Feature files

| File | Responsibility |
| --- | --- |
| `notification.events.ts` | Event registry: strict payload schemas, category/audience, recipient references, copy, entity, metadata, actor, and dedupe key. |
| `notification.service.ts` | Payload validation, event rendering, recipient resolution, persistence, dedupe outcome handling, privacy guard, and after-commit dispatch. |
| `notification-preference.model.ts` | Per-user, per-category in-app and real-time preference persistence. |
| `notification-preference.service.ts` | Current-permission category availability, enabled-by-default values, and authenticated user's preference updates. |
| `notification-preference.controller.ts` | Preference APIs and pending real-time alert polling/acknowledgement. |
| `notification.recipients.ts` | Resolves explicit user references and employee references to existing user accounts. |
| `notification.model.ts` | Sequelize notification model and supported category/audience/entity values. |
| `notification.repository.ts` | Recipient-scoped feed, unread count, and read-state persistence operations. |
| `notification.controller.ts` | API request handling and safe notification response view. |
| `notification.routes.ts` | Authenticated Notification Center endpoints. |
| `notification.validators.ts` | Zod query and route parameter validation. |
| `notification.cursor.ts` | Opaque keyset cursor encoding and validation. |
| `notification.dates.ts` | Africa/Lagos display formatting and local calendar date boundaries. |
| `migrations/20261124120000-create-notifications.cjs` | Additive migration for the notification table and its indexes/constraints. |
| `migrations/20261125120000-add-notification-preferences-and-polling.cjs` | Adds the `EXIT` category, per-channel notification fields, polling acknowledgement, and user preference table. |

The notification feature is mounted at `/api/v1/notifications` from `src/app.ts`.

## Implemented service behavior

### Event registry

Callers use `NotificationService.notify(eventType, payload)` and event types/payloads from `notification.events.ts`. Event definitions own the event's schema, category, audience, recipient resolver input, copy, entity reference, metadata, actor, and dedupe key. Payload schemas are strict so unknown fields are rejected.

The original event definitions were established in Phase 2; Phase 4 adds Exit events. The workflow tables that follow record which events Phase 3 and Phase 4 business workflows dispatch.

| Category | Event types |
| --- | --- |
| `LEAVE` | `LEAVE_APPLIED`, `LEAVE_APPROVED`, `LEAVE_REJECTED`, `LEAVE_CANCELLED` |
| `RELIEVER` | `RELIEVER_ASSIGNED` |
| `LOAN` | `LOAN_APPLIED`, `LOAN_APPROVED`, `LOAN_REJECTED`, `LOAN_CANCELLED` |
| `TRAINING` | `TRAINING_APPLIED`, `TRAINING_APPROVED`, `TRAINING_REJECTED` |
| `COMPLAINT` | `COMPLAINT_SUBMITTED`, `COMPLAINT_APPROVED`, `COMPLAINT_REJECTED` |
| `EXIT` | `EXIT_APPLIED`, `EXIT_APPROVED`, `EXIT_REJECTED`, `EXIT_COMPLETED` |
| `GENERAL` | `GENERAL_NOTIFICATION` |

The Phase 2 categories remain `LEAVE`, `LOAN`, `TRAINING`, `RELIEVER`, `COMPLAINT`, and `GENERAL`; `COMPLAINT` retains its approved identity and category decision (D3). Phase 4 adds `EXIT` without renaming or removing any existing category. Audiences represented in the model include `REQUESTER`, `RELIEVER`, `DIRECT`, `ACTOR_QUEUE`, and `BROADCAST`; `ACTOR_QUEUE` and `BROADCAST` have no Phase 3 or Phase 4 Notification Center delivery integrations.

## Implemented Phase 3 workflow integrations

The business integrations below are implemented in the named backend workflows. Every event uses the central event registry and recipient resolver. Employee recipient references are resolved through the existing employee-to-user email relationship; missing accounts are skipped rather than guessed.

| Workflow transition | Event/category | Recipient | Dispatch timing and behavior |
| --- | --- | --- | --- |
| Leave created | `LEAVE_APPLIED` / `LEAVE` | Leave requester | After `Leave.create` succeeds (the submission path is non-transactional). |
| Leave approved | `LEAVE_APPROVED` / `LEAVE` | Employee taking leave | Registered with `notifyAfterCommit` in the approval transaction. |
| Leave approved with `covering_employee_id` | `RELIEVER_ASSIGNED` / `RELIEVER` | Assigned covering employee | Registered in the same approval transaction. Names the employee taking leave; copy: “You are covering for {employee going on leave} starting DD/MM/YYYY.” No reliever event is registered without an assigned covering employee. |
| Leave rejected | `LEAVE_REJECTED` / `LEAVE` | Leave requester | Registered with `notifyAfterCommit` after the conditional pending-to-rejected update in the transaction. |
| Leave cancelled | `LEAVE_CANCELLED` / `LEAVE` | Leave requester | Payload is captured before the existing delete; `notify` runs only after deletion succeeds. |
| Loan created | `LOAN_APPLIED` / `LOAN` | Requesting employee | Registered with `notifyAfterCommit` in the existing creation/audit transaction. |
| Final loan approval reaches `PENDING_DISBURSEMENT` | `LOAN_APPROVED` / `LOAN` | Requesting employee | Registered with `notifyAfterCommit` in the approval/audit transaction. Copy says approved, not paid or disbursed (D5). |
| Final loan decision reaches `REJECTED` | `LOAN_REJECTED` / `LOAN` | Requesting employee | Registered after the successful conditional update and audit in the transaction. Intermediate reviewer rejection and the approver path returning the loan to `PENDING_REVIEW` do not notify. |
| Eligible loan cancellation succeeds | `LOAN_CANCELLED` / `LOAN` | Requesting employee | `notify` runs after the conditional status update succeeds. |
| Training request created | `TRAINING_APPLIED` / `TRAINING` | Original submitter | `notify` runs after creation. For `requestScope: TEAM`, other team members are not recipients (D6). Training IDs are UUIDs and the event schema validates UUIDs. |
| Supervisor or HR Officer rejects training | `TRAINING_REJECTED` / `TRAINING` | Original submitter | `notify` runs after the conditional status update succeeds. |
| HR Manager makes final training decision | `TRAINING_APPROVED` or `TRAINING_REJECTED` / `TRAINING` | Original submitter | `notify` runs after the conditional status update succeeds. Intermediate supervisor approval and HR review approval do not notify. |
| Complaint submitted | `COMPLAINT_SUBMITTED` / `COMPLAINT` | Complaint owner | Registered with `notifyAfterCommit` in the submission transaction, after the reference and audit record are written. |
| HR Officer rejects complaint | `COMPLAINT_REJECTED` / `COMPLAINT` | Complaint owner | Registered with `notifyAfterCommit` after the conditional transition and audit in the transaction. HR Officer approval to `PENDING_APPROVAL` is intermediate and does not notify. |
| HR Manager makes final complaint decision | `COMPLAINT_APPROVED` or `COMPLAINT_REJECTED` / `COMPLAINT` | Complaint owner | Registered with `notifyAfterCommit` after the conditional transition and audit in the transaction. |

Leave approval, loan review/authorization, and complaint transitions use conditional status updates so a stale decision that loses the transition cannot register an outcome notification. Training transitions use conditional status updates for the same reason. Repeated dispatches for an event and record are protected by the stable event/entity dedupe key and unique recipient/dedupe database constraint. These safeguards are limited to notification-relevant transitions; they do not constitute a broad concurrency redesign.

No Phase 3 integration sends notifications to supervisors or HR recipients (D4). Training's existing helper methods that log placeholder “queued” messages are not Notification Center dispatches or recipient fan-out.

## Implemented Phase 4 Exit Management integration

Exit events use the `EXIT` category and are sent only to the employee who owns the persisted Exit record. No new Exit notification is sent to a reviewer, approver, supervisor, or HR group (D4). The existing Exit controller's email side effects are pre-existing workflow behavior and are not Notification Center recipient fan-out added by Phase 4.

| Workflow transition | Event | Recipient | Behavior |
| --- | --- | --- | --- |
| Exit record created with status `submitted` | `EXIT_APPLIED` | Exit record's employee | `notify` runs after `Exit.create` succeeds. |
| Reviewer sets `finalApprovalStatus` to `rejected` | `EXIT_REJECTED` | Exit record's employee | `notify` runs after the successful update. The employee message excludes reviewer identity, comments, and notes. |
| Final approval sets status/final approval to `approved` or `rejected` | `EXIT_APPROVED` or `EXIT_REJECTED` | Exit record's employee | `notify` runs after the successful existing update. |
| Existing status update transitions to `completed` | `EXIT_COMPLETED` | Exit record's employee | `notify` runs after the successful update. |

Clearance approval to `finalApprovalStatus: cleared`, `under_review`, and `clearance_pending` are intermediate states and do not notify the employee. Other clearance fields and `withdrawn` do not have a Notification Center event in the current workflow. Exit event messages use the last working date formatted under D1. Exit record IDs are UUIDs; the event uses the UUID as its entity ID and dedupe-key component.

Exit controller writes are not wrapped in Sequelize transactions, so these events use `notify` after the corresponding write succeeds. The central service contains notification delivery failures. Existing Exit workflow updates are not converted into a new approval system or broad concurrency redesign.

## Notification Preferences and independent channels

Preferences are stored by authenticated `users.id` and category in `notification_preferences`; they are not shared by users with the same role. The notification recipient is also a user account, resolved through the existing employee email relationship, so preference ownership uses the same identity as delivery.

### Category availability

On each preferences request, the backend uses the current permissions loaded by authentication and checks for an employee record matching the user's email:

- A user with an employee record can manage the employee-facing categories `LEAVE`, `LOAN`, `TRAINING`, `RELIEVER`, `COMPLAINT`, and `EXIT`.
- `GENERAL` is available to every authenticated user.
- A non-employee staff account can manage feature categories when its current permission set includes that feature's existing permissions: `LIST_LOANS` / `MANAGE_LOANS` / `APPROVE_LOANS`; `LIST_TRAINING_REQUESTS` / `MANAGE_TRAINING_REQUESTS` / `APPROVE_TRAINING_REQUESTS`; `MANAGE_COMPLAINTS` / `APPROVE_COMPLAINTS`; or `MANAGE_EXITS` / `APPROVE_EXITS`.
- Leave and reliever have no corresponding feature permissions in the current permission registry, so those preferences are available through an employee record.

The API derives the available set on every request. Clients cannot submit an arbitrary category or a user ID. Losing a permission hides the corresponding saved preference and blocks updates but does not delete the stored preference; it becomes visible again if access is restored. Current employee-facing categories remain available to employees as approved, even if the user lacks the staff review/approval permissions.

### Independent in-app and real-time controls

Every category has `inAppEnabled` and `realtimeEnabled` values. If a preference row is missing, both default to `true`; the API returns these defaults without requiring a row to be created. Preferences are read when an event is delivered, and the two channel values are stored on the resulting notification row.

| In-app | Real-time | Result |
| --- | --- | --- |
| On | On | Appears in history and is available to the real-time poller. |
| On | Off | Appears in history; excluded from real-time polling. |
| Off | On | Stored for deduplication and acknowledgement, hidden from history/unread/read APIs, and available to the real-time poller. |
| Off | Off | No notification row is created for that recipient. |

Real-time polling is `GET /api/v1/notifications/realtime` (optional `rows`, default 20, maximum 50). It returns the oldest unacknowledged alerts for the authenticated user. After presenting alerts, the client acknowledges their IDs with `POST /api/v1/notifications/realtime/acknowledge` and `{ "ids": [1, 2] }` (maximum 100 IDs). The server scopes both polling and acknowledgement to the authenticated recipient and to real-time-enabled rows. Acknowledgement is idempotent and does not mark an in-app notification as read. Until acknowledged, an alert can be returned again; clients should use the stable notification ID to avoid showing a duplicate if a poll or acknowledgement response is retried.

The client should poll about every 30 seconds while its application tab is visible. Polling only delivers alerts while the application is active and polling. Background/offline push delivery is future work. Existing Phase 2 notification rows are migrated with real-time delivery disabled, so they are not replayed as new alerts.

Preference endpoints are authenticated and user-specific:

| Method and path | Purpose |
| --- | --- |
| `GET /api/v1/notifications/preferences` | Return categories available to the current user and both current/default values. |
| `PATCH /api/v1/notifications/preferences` | Update one or both controls for one available category; body fields are `category`, `inAppEnabled?`, `realtimeEnabled?`. |

These endpoints are backend APIs only; no frontend preference interface or polling client is part of this phase.

### Recipient resolution

Event definitions identify a recipient as an employee or user. Employee references are resolved through the established `employees.email` to `users.email` relationship, with trimmed, case-insensitive email matching. Explicit user references are checked against existing, non-deleted users. The resolver deduplicates resolved user IDs, never guesses a missing match, and logs unresolved IDs without logging names or email addresses. An unresolved employee/account is skipped and reported in the service outcome.

Events normally have a maximum recipient count of one. The internal `GENERAL_NOTIFICATION` event supports an explicit list, but no public announcement or broadcast creation endpoint exists.

### Transactions, failures, and idempotency

- Call `notify` only after a non-transactional business write has succeeded.
- For a business transaction, register `NotificationService.notifyAfterCommit(transaction, eventType, payload)` within the transaction. Rollback sends nothing; commit schedules notification delivery after commit.
- Notification failures are logged and returned as an outcome; they do not throw through the business workflow or roll back a completed action. After-commit delivery runs asynchronously.
- Each event definition builds a stable event/entity dedupe key. A unique database index on `(recipient_user_id, dedupe_key)` prevents repeated or concurrent delivery of the same event to the same account from creating duplicate rows.
- This is not a durable outbox or retry queue. Process failure or a delivery error can leave a business action committed without a notification; the current service reports/logs the outcome but does not persist retry jobs.

## Notification API

Every route uses the existing authentication middleware. Queries and updates are scoped to the authenticated user; no route accepts a recipient ID. Internal columns such as recipient ID, actor ID, and dedupe key are omitted from API views. A missing notification and another user's notification return the same not-found response.

| Method and path | Purpose |
| --- | --- |
| `GET /api/v1/notifications` | Cursor-paginated feed. Supports category, read status, inclusive Africa/Lagos date range, sort order, cursor, and page size (default 20, maximum 50). |
| `GET /api/v1/notifications/unread-count` | Live unread total and counts for every category, counting only in-app-enabled rows. |
| `PATCH /api/v1/notifications/read-all` | Mark the caller's unread notifications as read, optionally by category. |
| `PATCH /api/v1/notifications/:id/read` | Mark one of the caller's notifications as read. |
| `PATCH /api/v1/notifications/:id/unread` | Mark one of the caller's notifications as unread. |

The feed is ordered by `(createdAt, id)` and uses keyset pagination. A cursor does not grant access: every page query remains scoped to the session user. Date filters are calendar days in `Africa/Lagos`. Rows with `inAppEnabled: false` are excluded from the feed, unread counts, and read-state APIs.

## Approved product decisions

These approved decisions remain authoritative for the implementation and future integrations.

- **D1 — Dates:** Display notification dates as `DD/MM/YYYY`. Store timestamps in UTC and format display dates in `Africa/Lagos`.
- **D2 — Reliever:** Notify the reliever when leave is approved. The named employee is the person going on leave; the reliever is the recipient. The current message is “You are covering for {employee going on leave} starting {date}.”
- **D3 — Complaints:** Complaints is the sixth notification category, `COMPLAINT`.
- **D4 — Approvers:** Supervisor and HR notification delivery was deferred until Employee Hub was signed off. Employee Hub sign-off is now complete, so that deferred scope may be addressed as Phase 6 work. This milestone does not mean role notifications are already implemented; identify actual responsible recipients per workflow and do not fan out indiscriminately. Existing Phase 3/4 implementations remain as documented.
- **D5 — Loan approval:** Notify when loan status reaches `PENDING_DISBURSEMENT`. The notification says the loan was approved; it must not say paid or disbursed.
- **D6 — TEAM training:** Notify only the original training request submitter, including requests with `requestScope: TEAM`.
- **D7 — Concurrent decisions:** Apply minimal safeguards against misleading notifications from stale or competing workflow decisions. Do not perform a broad concurrency refactor without approval.

## Privacy and security expectations

- Never accept the recipient from an untrusted request field. Determine the business owner/recipient from authenticated context or the persisted record, then use the central resolver.
- Keep every feed/read operation scoped to the authenticated user. Do not expose internal recipient, actor, or dedupe fields.
- Complaint notifications go only to the complaint owner. Their strict payload contains only complaint ID, owner employee ID for recipient resolution, public reference, and submitted timestamp. Do not include complainant identity, complaint title/content, witnesses, anonymity flag, reviewer/approver notes, or other sensitive data.
- Complaint notifications always have a null actor and metadata restricted to the allow-list (`reference`, `status`, `submittedAt`). The service applies this as defense in depth.
- Exit notifications go only to the employee referenced by the persisted Exit record. Their message contains the last working date and outcome; do not include reviewer names, reviewer notes, clearance comments, or other Exit form details.
- Do not log notification message text, complaint content, secrets, names, or email addresses. Follow the feature's existing ID-only logging patterns.
- No supervisor or HR Notification Center recipients were added in Phases 3 or 4 (D4). With Employee Hub now signed off, any future role notification work must still use actual workflow responsibility and be approved per event. Existing non-Notification-Center workflow email behavior is separate and remains unchanged.

## Permanent Notification Integration Standard

For every new feature or workflow, agents must:

1. Identify important workflow events and status transitions.
2. Determine which events genuinely require notifications.
3. Identify recipients and the business reason they should receive notifications.
4. Establish the correct dispatch timing.
5. Define message content, category, and privacy requirements.
6. Reuse the existing central notification infrastructure.
7. Dispatch transactional notifications only after successful commits.
8. Ensure notification failures do not reverse successful business operations.
9. Implement appropriate tests.
10. Report events that were deliberately excluded and why.

Do not invent recipients or business rules. Request approval when requirements are unclear. Do not create separate notification tables, services, or APIs for individual modules.

### Integration implementation guidance

- Trace the actual status transition code and use the persisted record's owner and identifiers. Do not infer a final rejection from an intermediate reviewer decision; inspect the resulting status.
- For transactional writes, use `notifyAfterCommit`; never send before commit. For a non-transactional write, call `notify` only after the write resolves.
- Do not make a business response depend on delivery success. The central service reports delivery failures without throwing; do not rethrow or convert them into business-action failures.
- Keep one dispatch point per business transition. Use the existing event/entity key and unique recipient index for retry idempotency.
- For stale or competing decisions, use the smallest status guard or conditional transition that prevents sending a notification for a transition that did not win. Preserve existing permissions and statuses; request approval before broader concurrency or schema changes.
- Use the event registry's strict payload and recipient mapping. If a domain identifier or available workflow field does not match its schema, report and correct that mismatch in the central event definition with tests; do not force or fabricate values.
- Enforce notification preferences centrally after recipient resolution. Apply in-app and real-time controls independently; never skip the whole event just because only one channel is disabled. Keep real-time polling and acknowledgement recipient-scoped.
- Preserve UTC timestamps and the `Africa/Lagos` / `DD/MM/YYYY` display rule.

### Discovery and planning expectations

Before implementation, inspect the feature's routes, controllers, services, models, validators, transaction boundaries, status transitions, and tests. Produce a workflow-to-event map that states:

- each candidate event and the transition that triggers it;
- intended recipients and the reason each is entitled to the event;
- event type, required payload fields, message/category, and privacy constraints;
- whether the transition has a transaction and how after-commit dispatch will be done;
- how duplicate calls and stale/concurrent decisions are handled;
- events intentionally excluded (including intermediate statuses and D4 approver/HR notifications);
- mismatches, risks, and product questions requiring approval.

Do not present proposed integrations as implemented behavior. In reports and documentation, label current implementation, approved product decisions, and recommended future practices separately.

## Testing standard

Notification integration tests should cover, as applicable:

- event payload validation, exact category/copy, date interpolation, and entity metadata;
- correct employee/user recipient resolution, including missing employee/account behavior and no recipient guessing;
- each intended status transition, with no notification for excluded intermediate transitions;
- `notifyAfterCommit` delivery after commit and no delivery after rollback;
- notification failure does not reverse or falsely fail a successful business action;
- duplicate/retried dispatch creates one notification per recipient/event/entity;
- requester ownership, reliever mapping, and no supervisor/HR fan-out under D4;
- complaint owner-only delivery and absence of identity/content/actor leakage.

Keep tests isolated from unrelated user data. Use the existing notification test helpers and local development database conventions. Run focused tests, the full `npm test` suite, and `npx.cmd tsc --noEmit` for backend changes when available; report any required local database or migration setup.

## Current implementation notes and known alignment checks

The workflow tables above describe current Phase 3 and Phase 4 integrations, not merely proposed behavior. Notification Preferences and Exit Management integration are implemented as described above. The Phase 5 frontend in `orbit360-FE` includes notification history/preferences UI and the polling client. Background/offline push delivery is not implemented. Consult `docs/NOTIFICATION-WORKFLOW-MAP.md` for a cross-feature discovery of additional approval workflows and proposed recipient gaps; those Phase 6 integrations are not implemented.

The existing Exit controller does not use transactions or conditional status updates. Notifications follow successful writes and the central unique event/recipient key prevents repeated copies of the same event, but competing terminal Exit updates can still produce conflicting outcome events. Fixing the underlying Exit workflow concurrency behavior is outside the approved Phase 4 scope and requires separate approval.

The training event schema accepts UUID-backed request IDs, matching the `TrainingRequest` model. The approved decisions D1–D7 remain authoritative: D1 dates, D2 reliever recipient and wording, D3 complaint category decision, D4 supervisor/HR delivery deferred until Employee Hub sign-off (milestone now complete; implementation remains future Phase 6 work), D5 loan approval at `PENDING_DISBURSEMENT`, D6 requester-only TEAM training, and D7 minimal safeguards against misleading concurrent outcomes.
