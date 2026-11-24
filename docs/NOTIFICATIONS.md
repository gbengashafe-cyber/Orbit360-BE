# ORBIT 360 Notification Center

This document describes the Phase 2 Notification Center foundation and the permanent standard for integrating future business workflows. It distinguishes implemented behavior from approved product decisions and recommended practices; the presence of an event definition does not mean a workflow currently dispatches that event.

## Purpose and architecture

The Notification Center stores employee-facing notification snapshots in one central `notifications` table. Business features call the central notification service with a registered event and payload. The service validates the payload, resolves recipients, renders the title/message and metadata, and writes notification rows. The API exposes only the authenticated user's feed and read state.

There is no event bus, queue, WebSocket, SSE, or module-specific notification system in this implementation. No public route creates notifications. Workflow integrations are performed in the owning business workflow, not by adding notification behavior to the feed API.

### Feature files

| File | Responsibility |
| --- | --- |
| `notification.events.ts` | Event registry: strict payload schemas, category/audience, recipient references, copy, entity, metadata, actor, and dedupe key. |
| `notification.service.ts` | Payload validation, event rendering, recipient resolution, persistence, dedupe outcome handling, privacy guard, and after-commit dispatch. |
| `notification.recipients.ts` | Resolves explicit user references and employee references to existing user accounts. |
| `notification.model.ts` | Sequelize notification model and supported category/audience/entity values. |
| `notification.repository.ts` | Recipient-scoped feed, unread count, and read-state persistence operations. |
| `notification.controller.ts` | API request handling and safe notification response view. |
| `notification.routes.ts` | Authenticated Notification Center endpoints. |
| `notification.validators.ts` | Zod query and route parameter validation. |
| `notification.cursor.ts` | Opaque keyset cursor encoding and validation. |
| `notification.dates.ts` | Africa/Lagos display formatting and local calendar date boundaries. |
| `migrations/20261124120000-create-notifications.cjs` | Additive migration for the notification table and its indexes/constraints. |

The notification feature is mounted at `/api/v1/notifications` from `src/app.ts`.

## Implemented service behavior

### Event registry

Callers use `NotificationService.notify(eventType, payload)` and event types/payloads from `notification.events.ts`. Event definitions own the event's schema, category, audience, recipient resolver input, copy, entity reference, metadata, actor, and dedupe key. Payload schemas are strict so unknown fields are rejected.

Current employee-facing event definitions are listed below. They are registered in Phase 2; workflow dispatch is not automatically wired by registering them.

| Category | Event types |
| --- | --- |
| `LEAVE` | `LEAVE_APPLIED`, `LEAVE_APPROVED`, `LEAVE_REJECTED`, `LEAVE_CANCELLED` |
| `RELIEVER` | `RELIEVER_ASSIGNED` |
| `LOAN` | `LOAN_APPLIED`, `LOAN_APPROVED`, `LOAN_REJECTED`, `LOAN_CANCELLED` |
| `TRAINING` | `TRAINING_APPLIED`, `TRAINING_APPROVED`, `TRAINING_REJECTED` |
| `COMPLAINT` | `COMPLAINT_SUBMITTED`, `COMPLAINT_APPROVED`, `COMPLAINT_REJECTED` |
| `GENERAL` | `GENERAL_NOTIFICATION` |

The six categories are `LEAVE`, `LOAN`, `TRAINING`, `RELIEVER`, `COMPLAINT`, and `GENERAL`. `COMPLAINT` is intentionally the sixth category (D3). Audiences represented in the model include `REQUESTER`, `RELIEVER`, `DIRECT`, `ACTOR_QUEUE`, and `BROADCAST`; the latter two are not Phase 2 delivery integrations.

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
| `GET /api/v1/notifications/unread-count` | Live unread total and counts for every category. |
| `PATCH /api/v1/notifications/read-all` | Mark the caller's unread notifications as read, optionally by category. |
| `PATCH /api/v1/notifications/:id/read` | Mark one of the caller's notifications as read. |
| `PATCH /api/v1/notifications/:id/unread` | Mark one of the caller's notifications as unread. |

The feed is ordered by `(createdAt, id)` and uses keyset pagination. A cursor does not grant access: every page query remains scoped to the session user. Date filters are calendar days in `Africa/Lagos`.

## Approved product decisions

These are approved decisions. They govern integrations even when the corresponding workflow call site is not yet implemented.

- **D1 — Dates:** Display notification dates as `DD/MM/YYYY`. Store timestamps in UTC and format display dates in `Africa/Lagos`.
- **D2 — Reliever:** Notify the reliever when leave is approved. The named employee is the person going on leave; the reliever is the recipient. The current message is “You are covering for {employee going on leave} starting {date}.”
- **D3 — Complaints:** Complaints is the sixth notification category, `COMPLAINT`.
- **D4 — Approvers:** Defer supervisor and HR notification delivery until Employee Hub is signed off. Do not add approver fan-out during employee-facing integrations.
- **D5 — Loan approval:** Notify when loan status reaches `PENDING_DISBURSEMENT`. The notification says the loan was approved; it must not say paid or disbursed.
- **D6 — TEAM training:** Notify only the original training request submitter, including requests with `requestScope: TEAM`.
- **D7 — Concurrent decisions:** Apply minimal safeguards against misleading notifications from stale or competing workflow decisions. Do not perform a broad concurrency refactor without approval.

## Privacy and security expectations

- Never accept the recipient from an untrusted request field. Determine the business owner/recipient from authenticated context or the persisted record, then use the central resolver.
- Keep every feed/read operation scoped to the authenticated user. Do not expose internal recipient, actor, or dedupe fields.
- Complaint notifications go only to the complaint owner. Their strict payload contains only complaint ID, owner employee ID for recipient resolution, public reference, and submitted timestamp. Do not include complainant identity, complaint title/content, witnesses, anonymity flag, reviewer/approver notes, or other sensitive data.
- Complaint notifications always have a null actor and metadata restricted to the allow-list (`reference`, `status`, `submittedAt`). The service applies this as defense in depth.
- Do not log notification message text, complaint content, secrets, names, or email addresses. Follow the feature's existing ID-only logging patterns.
- Do not notify supervisors or HR during Phase 3 employee-facing event integration (D4).

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

The Phase 2 code defines the event types above but does not itself wire all business workflow transitions to them. In particular, agents must inspect the current workflow before claiming any event is dispatched. Current event payloads expect numeric leave/loan/complaint IDs and a numeric `trainingRequestId`; the training model uses UUID IDs, so this mismatch must be resolved before dispatching training events. This is an application/event-schema alignment issue, not a reason to change the notification table schema.

The approved decisions D5–D7 govern future integrations. They are not claims that loan approval integration, team-request routing behavior, or concurrency safeguards have already been implemented in business workflows.
