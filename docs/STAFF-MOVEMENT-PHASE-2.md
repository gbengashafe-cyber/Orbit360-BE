# Staff Movement Phase 2 implementation plan

Scope ends at an authorized workflow outcome. Employee assignments, payroll, protected letters, acknowledgement, clearance, execution, reminders and frontend screens belong to later phases.

1. **Intake and persistence.** Use the existing request, immutable snapshots, stages, authority and audit models. Add request-specific form and routing context, reference uniqueness and structured decision evidence. Keep employee and maker immutable. Select an unambiguous active company workflow (or shared workflow if no company workflow applies). Confirm the version at submission and retain it throughout review. Allocate ORB/SM/YYYY/NNNN under database uniqueness. The generated active slot covers drafts too.
2. **Access and validation.** Employee voluntary requests require ownership. Both HOD paths require the corresponding department assignment or valid delegate. Workforce planning and executive directives originate with scoped HR. Validate persisted company/department/role/position and master-data identifiers. Unknown current grade, position or branch requires documented manual verification. Temporary assignments require an end date. Capture supporting references without granting file access.
3. **API contract.** Authenticated /api/v1/staff-movement/requests supports draft creation, scoped list/detail, draft patch, submission and stage actions. Mutations after creation require expected revision. Queue results and permitted actions use the same assignment and exclusion checks as writes. Employee summaries exclude internal notes and audit. Paginate before returning authorized results and limit search to permitted records.
4. **Workflow.** HR validates eligibility, headcount, competencies, pending matters, compensation and policy. Current HOD records release/conditions/objections. Receiving HOD records role, reporting line, start, cost centre, suitability, KPIs and training. Capture a qualifying initiating HOD endorsement only for its own stage. HR consolidates then Head of HR authorizes. Resolve additional stages in frozen order. Preserve old decisions when resubmission or material amendment requires a new review cycle.
5. **Exceptions and notifications.** Maintain prior stage for clarification and return. Record objections and escalation explicitly. Apply current scoped authority, delegation and independent checker at decision time. Use central STAFF_MOVEMENT events after commit for assigned stage actors, corrections and outcomes. Revision-specific keys distinguish cycles. Payloads exclude private form and review content.
6. **Atomicity and acceptance.** Lock request, compare revision, write evidence, state, snapshots and audit in one transaction. Map active-slot violations, stale decisions and lock contention to conflict. Never replay a non-idempotent action automatically. Exercise the five intake paths, all eight categories, every routine stage, HOD skip, conditional routes, exceptions, revoked authority, private reads, competing writes and notification rollback. Verify on local MySQL with isolated fixtures, then run full backend tests, TypeScript and both diff checks.

### Product clarifications

Product confirmed a separate independent HR reviewer for HR-originated requests, independent Head of HR with documented reasons for cancellation and objection overrides, and explicit conditional-stage flags. The configuration manager can record a request-specific HR appointment within the company. Additional stages accept a frozen whenAny list of gradeChange, legalEntityChange, compensationImplication or policyException. Unknown criteria fail closed.

### Implemented API

| Method and path (under `/api/v1`) | Operation |
| --- | --- |
| `POST /staff-movement/requests` | Reserve the employee slot and create a draft from employeeId, categoryId, path and form. |
| `GET /staff-movement/requests` | Page through accessible, initiated, employee-owned or assigned requests. Filters include status and reference/ID search. |
| `GET /staff-movement/requests/{id}` | Return permitted actions, current stage and role-appropriate detail. The current reviewer can inspect findings, prior submissions and request audit. |
| `PATCH /staff-movement/requests/{id}` | Replace the form with the expected revision during an authorized edit. |
| `POST /staff-movement/requests/{id}/actions` | Submit the expected revision, action, comments and applicable structured evidence or HR appointment. The response supplies the next revision. |
| `GET /pending-authorization/STAFF%20MOVEMENT` | Return the authenticated reviewer's assigned queue. The counts endpoint uses the same assignment checks. |

The [OpenAPI contract](../src/swagger/index.yaml) lists form fields, stage evidence and action names. Business validation returns 400, failed authority checks return 403, unavailable private reads return 404, and stale revisions, active-slot collisions and lock contention return 409. Reload the current request before deciding whether to retry.

### Operational acceptance

The local migration `20261127120000-staff-movement-workflow.cjs` adds request context, reference uniqueness and decision evidence. The four Phase 1 migrations and the unique employee/active-slot index remain in the local migration and schema records. References use the database request ID padded to at least four digits, prefixed with the Lagos submission year. The numbering can contain gaps. Supporting documents are existing public HR document UUIDs. Unknown current assignment attributes stay null and require manual HR verification.

Manual acceptance requires a representative company with employee-linked accounts, current and receiving HOD assignments, an HR reviewer, Head of HR and applicable additional approvers. Publish an appropriate category workflow and use separate actors to trace a request through their own queues. Confirm the pilot's organization data, authority assignments, manual findings and notification preferences before rollout. Automated scenarios create and remove their own scoped fixtures.

### Change inventory

| Location | Files |
| --- | --- |
| `src/features/staff-movement/` | New `staff-movement.intake.ts`, `staff-movement.participants.ts`, `staff-movement.requests.ts` and `staff-movement.routes.ts`. Updated `staff-movement.models.ts` and `staff-movement.transitions.ts`. |
| `src/features/staff-movement/__tests__/` | New `staff-movement.workflow.test.ts`; updated schema expectation in `staff-movement.database.test.ts`. |
| API and Authorization Center | `src/app.ts`, `src/pending-authorization/pending-authorization.controller.ts`, `src/swagger/index.yaml`. |
| Notification Center | `src/features/notifications/notification.events.ts`, `src/features/notifications/notification.model.ts`. |
| Migration | `migrations/20261127120000-staff-movement-workflow.cjs`. |
| Documentation | This plan, `STAFF-MOVEMENT-SPEC.md`, `PROJECT-TODO.md`, `NOTIFICATIONS.md` and `NOTIFICATION-WORKFLOW-MAP.md` in `docs/`. |

### Verification on 27 November 2026

All 32 focused Staff Movement tests and all 198 backend tests passed on local development. Tests exercised competing creation, submission and review, rollback on audit failure, pinned retired versions, all five initiation paths, exact review recipients and duplicate replay. The approval fixture compared the employee and its payroll rows before and after approval. TypeScript compilation, Swagger YAML parsing and Git diff checks passed. The initial full run encountered a Windows libuv shutdown assertion in the personal-dashboard worker after its tests passed. The full rerun passed without a dashboard change. Product-owner acceptance with representative company data remains pending.
