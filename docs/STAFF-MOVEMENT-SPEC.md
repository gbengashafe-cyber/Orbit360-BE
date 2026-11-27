# Staff Movement technical specification

Status: Phase 1 foundation complete and verified on local MySQL. Phase 2 remains pending.

## Current implementation

The local foundation contains the eight approved categories, organization references, positions, effective-dated headcounts, workflow versions and stages, requests, assignment snapshots and decisions. Headcount validation remains manual because employees lack authoritative position links. The existing Staff Movement notification category supports preferences. Phase 1 configuration changes do not dispatch employee notifications.

### Configuration and authority

The configuration router is mounted under `/api/v1/staff-movement/configuration`. Every operation authenticates the account and checks the current job-role permission `MANAGE_STAFF_MOVEMENT_CONFIGURATION`, active account and unique eligible employee mapping in its transaction. New workflows belong to the manager's company. Department and company records are scoped on reads and writes. Global reference category changes and maintenance of legacy shared workflows require an administrator who also holds the permission. No grants are seeded.

Managers can maintain reference data, positions and headcount periods, create, publish and retire workflow versions, and list, create or revoke HOD assignments, approver assignments and delegations. HOD scope follows the assigned department. HR, Head of HR, executive and financial assignments can cover a department or its company. An explicit department and fixed date range narrow each delegation. It binds to a specific principal assignment. Prior unbound delegations require reissue after eligibility review. Assignment replacement cannot revive an old delegation. Application writes serialize conflicting assignment periods on the department or company. Acting authority is rechecked against the persisted stage, employee/account eligibility, source assignment, current permission and Lagos business date. HOD and HR use review permission. Head of HR, executive and financial authorities use approval permission. Maker and subject exclusions apply to both principal and acting delegate.

### Persistence boundaries

Configuration writes, including implicit retirement during publication, append an event to `sm_audit_events` in the same transaction. Events identify the actor, action, resource, record, time and relevant changed fields. Settings content is excluded from the change log. The router has no audit mutation operation. Sequelize guards reject normal updates, upserts and deletes of protected history. Database administrators with direct SQL access remain outside this application boundary.

Published versions retain settings and ordered stages. Configuration changes create a new version under a workflow lock. Requests pin the original version, including after retirement. Stage additions require a locked, unreferenced draft. Versions, stages and snapshots are protected against ordinary model mutations.

The internal transition service locks the request, checks its revision and allowed edge, and writes the new revision and audit atomically. Draft withdrawal requires the eligible maker. Review return, rejection and clarification require an allowed source state, the pinned stage and its stored departmental snapshot. Edges requiring submission, positive approval, additional-stage selection, contextual resumption or implementation evidence remain closed pending their workflow phase. The API exposes configuration only.

### Active-request constraint and migration recovery

InnoDB enforces one active request per employee through the unique index `sm_request_employee_active_slot_uq (employee_id, active_slot)`. The virtual `TINYINT` column derives from the persisted status. COMPLETED, REJECTED, WITHDRAWN and CANCELLED produce NULL, permitting multiple terminal records. Every other state produces 1, including draft, returned, clarification and implementation failure. Inserts and status updates maintain the index inside the writer's transaction. Request and transition code continue to write their existing fields.

Local MySQL Community Server 26.10.0 rejected the original BEFORE triggers under its binary-logging policy. This left an ordinary nullable helper and unique index without a reliable writer. The revised migration uses ordinary schema privileges. It requires InnoDB, indexed virtual generated columns, and the MySQL 8-era information_schema metadata used for validation (including index visibility and view-table dependencies). Local 26.10.0 was exercised; verify other server releases and database variants on an isolated copy before deployment.

**Recovery for an unrecorded migration.** Confirm target and journal, pause request writes, capture the table definition and data, and inspect triggers, dependent objects and duplicates grouped by employee across nonterminal rows. Unexpected definitions, dependencies and conflicting records require review. Run `sequelize-cli db:migrate --env development --name 20261126161000-staff-movement-active-request-constraint.cjs` against the approved local target. The migration verifies the generated expression and unique index before dropping the known partial index and column. It recognizes clean, partial and interrupted installations. After interruption, recheck metadata and rerun by name. Automatic down is blocked because removing the index would remove the guarantee; any reversal requires stopped writers and a reviewed replacement or restore.

**Already-applied trigger version.** Sequelize skips a recorded filename. Use a separate reviewed forward migration in that environment: back up, quiesce writers, inspect actual trigger definitions and dependencies, establish and verify the new generated key, then retire the verified legacy triggers before removing their column. Preserve the existing journal entry. No global settings or grants are part of this recovery.

The local pre-recovery table was empty. Its verified recovery SQL captures the complete definition, including unrelated keys. Sequelize applied the revised migration by name after the authority/audit migration. Development and deployment databases maintain independent journals.

### Phase 1 acceptance on local development

| Foundation criterion | Verification |
| --- | --- |
| Persistence and organizational configuration | MySQL table, relationship, category and workflow-version tests passed. Headcount retains its documented manual-verification outcome. |
| Configuration access, scoped authority and audit | Mounted-route authentication and permission tests passed. A database-backed service fixture exercised all six authorities, eligibility, revocation, maker/checker exclusions and transactional audit rollback. |
| Historical configuration and state guards | A request retained its pinned version and stages after replacement. Invalid and stale transitions and historical mutations were rejected. Real state and slot writes rolled back together on injected audit failure. |
| Active-request integrity and migration | Seven live MySQL tests covered same-employee claim and release under commit and rollback, different employees, all 17 approved states, terminal history and direct SQL. Seven more exercised clean and partial installations, interrupted DDL, repeat application and rejection of drift or duplicate data. The four contested cases used separate connections and observed the competing statement on the server before releasing the holder. |
| Notification category | Existing preference and API tests passed in the backend suite. The frontend label is present and six frontend notification regressions passed. Movement workflow dispatch belongs to later phases. |

All 27 focused tests, all 193 backend tests, TypeScript and both Git diff checks passed. The focused suite includes pure state and mocked handler/identity tests. The concurrency and migration results above come from InnoDB. An early different-employee test timed out when it held a transaction open until a reused-key insert finished. Fresh-key transactions held independent slots concurrently; transactions on reused keys both committed when the holder could finish independently. Callers should keep transactions short and avoid making a commit depend on a competing insert.

## Approved decisions D1–D9

D1: explicit scoped HOD and delegated assignments; HOD is distinct from supervisor, delegation is time-bound and cannot elevate authority. D2: movement-owned, versioned configurable approval workflow integrated with Authorization Center; HOD initiator's appropriate endorsement is captured on submission. D3: controlled objections, amendments, exceptions, clearance, reversal and cancellation, with audit. D4: reuse authoritative organization data; missing headcount or positions require documented manual verification rather than a false automated pass. D5: protected letters; acknowledgement and consent are separate; approved templates and signatories required. D6: new-staff and replacement requisitions belong to Recruitment, not movement of existing employees. D7: future durable automatic effective-date processing, Africa/Lagos midnight, UTC audit, mandatory readiness and idempotent recovery. D8: central Notification Center category and configurable reminders; event integrations occur with their workflow phase. D9: a single role-appropriate navigation entry per portal, contextual tabs, and no placeholder routes.

## Boundaries and domain

Phase 1 establishes configuration and domain foundations; it does not expose submission or decisions, mutate employee records, generate letters, schedule jobs, perform payroll/access changes or implement dashboards, requisitions or reports. Eight stable categories: INTERDEPARTMENTAL_TRANSFER, INTERBRANCH_TRANSFER, LOCATION_TRANSFER, JOB_ROTATION, REDEPLOYMENT, SECONDMENT, PROMOTION_RELATED and INTRAGROUP_TRANSFER. Inactive categories remain valid historically; execution remains unavailable in Phase 1.

The domain needs movement requests linked to employee, category, initiator and immutable configuration version, containing current and proposed assignment snapshots, effective dates, status and version. Configuration versions own ordered stages with authority and scope, stakeholder requirements and conditional rules. Departmental assignment links department and eligible employee; delegation links an authorized principal and delegate, scope and validity. Append-only audit events record actor, action, record, UTC time and minimal safe changes. Letters, acknowledgements, consent, clearances, execution attempts and effective-dated assignment history are later-phase relationships; no speculative implementation implies they exist.

## Workflow and authorization contract

The routine ordered stages are HR preliminary validation, current HOD, receiving HOD, HR final recommendation, Head of HR and conditional executive/financial approval. Employee, HR or appropriately assigned HOD may initiate according to D1; only the assigned eligible stage actor may decide, and the initiator cannot independently final-approve. Submitted HOD endorsements count only for their own applicable department. Reviewers are resolved from persisted scope and validity, never titles or supervisor inference. Validate current permissions and active employee/user eligibility on each action. Delegations cannot exceed principal authority, scope or validity and are revoked when authority ceases. A single-approver slot cannot have overlapping assignments; conflicts fail closed.

| From | Allowed next state / condition |
| --- | --- |
| DRAFT | SUBMITTED on validated submission; WITHDRAWN by permitted maker |
| SUBMITTED | PENDING_HR_VALIDATION |
| PENDING_HR_VALIDATION | PENDING_CURRENT_HOD, RETURNED, REJECTED |
| PENDING_CURRENT_HOD | PENDING_RECEIVING_HOD after endorsement/conditional release; RETURNED or escalation after objection |
| PENDING_RECEIVING_HOD | PENDING_FINAL_HR_REVIEW, RETURNED, REJECTED |
| PENDING_FINAL_HR_REVIEW | PENDING_FINAL_APPROVAL, RETURNED |
| PENDING_FINAL_APPROVAL | PENDING_ADDITIONAL_APPROVAL if configured; APPROVED; RETURNED, CLARIFICATION or REJECTED |
| PENDING_ADDITIONAL_APPROVAL | APPROVED, RETURNED, CLARIFICATION or REJECTED |
| RETURNED / CLARIFICATION | resume the authorized prior stage after correction; material amendment renews affected approvals |
| APPROVED | SCHEDULED only after independent acknowledgement/consent and mandatory clearance gates are satisfied; CANCELLED only by authorized audited action |
| SCHEDULED | COMPLETED on successful eligible execution; IMPLEMENTATION_FAILED on failure; CANCELLED by authorized action |
| IMPLEMENTATION_FAILED | SCHEDULED after authorized recovery or COMPLETED after idempotent retry |
| COMPLETED | no destructive edit; authorized linked reversal request instead |

These are intended transition guards; Phase 1 does not expose workflow endpoints. Overdue escalation never grants approval. Separate acknowledgement, consent, clearance and exception records avoid conflating readiness with request status. Configuration changes produce a new immutable version; submitted requests keep their exact snapshot. Validation must prevent missing mandatory stages, contradictory conditions, missing authority, ambiguous approvers and maker-checker bypass. Active request conflict and activation/assignment races require database constraints or locking, not only read-before-write.

## Organization, documents and execution

Reuse Company, Department, JobRole, Employee and supervisor association; designation is not an approved position, and company is not automatically a legal employer or branch. Model necessary location, grade, legal entity, cost centre, approved position and headcount only when needed; absent authoritative data requires recorded HR manual validation. No fabricated organizational records. Secure letter storage requires authenticated per-employee/participant authorization and versioned approved template/signatory; the current static document URL is unsuitable for confidential letters. Acknowledgement does not constitute consent.

Future execution is eligible from midnight Africa/Lagos on the effective date, with UTC timestamps. It must use durable recoverable processing, transactional row locks/version checks and idempotency, revalidate readiness and stale assignments, preserve prior and new history, record failures, and require separately authorized payroll and access changes. Backdating requires an authorized exception. Temporary expiry triggers review and authorized return, never silent reversal. Holidays are not currently provided; reminder business days are Monday–Friday excluding weekends, with holidays excluded only once an approved calendar exists.

## Notifications

Staff Movement uses the central registry and preferences, not a separate notification system. Proposed event/recipient matrix: submission → assigned HR; validation → current HOD; release → receiving HOD; departmental reviews → HR; final recommendation → Head of HR; additional approval → assigned executive/financial approver; approval → employee and relevant HODs; letter → employee; clearance → assigned stakeholders; effective-date reminders → employee, HR and HODs; overdue → assigned approver and escalation authority; completion → authorized stakeholders; temporary expiry → HR and HODs. Messages must be minimal and exclude compensation, reasons and private comments. Each transactional event dispatches after commit with occurrence-aware per-recipient dedupe, existing preference/polling and safe destination checks. Reminders default to approval 2 business days, escalation 5 business days, effective date 7/1 days, clearance 3/1 days, expiry 14/3 days. No events are sent in Phase 1.

## API and UI contracts

Phase 1 configuration APIs must require authentication plus narrowly scoped management permission and validate inputs, organization scope and acting authority server-side; expose categories, versioned approval configuration, departmental HOD and scoped delegation, and any actually introduced organizational data. No request submission or decision endpoints in this phase. Use existing API response/error, validators and Swagger conventions. A later employee-scoped API must enforce ownership; reviewer APIs verify assigned stage and current authority. Later frontend uses one role-aware Staff Movement landing entry with contextual tabs, Authorization Center integration, existing responsive navigation and `DESIGN.md` components; no empty routes.

## Phases and acceptance

1. Foundation: coherent persistence, configuration validation/versioning, authorization and audit, category integration, focused tests and migrations. No workflow claims until verified.
2. Implement request lifecycle and assigned reviews, maker-checker, optimistic conflict checks, scoped Authorization Center and stage notifications. Verify all initiating roles, refusals, objections, concurrent decisions and privacy.
3. Protected letters, separate consent/acknowledgement and clearance, notifications and exception controls. Verify access and revocation.
4. Durable scheduled execution, immutable history, temporary expiry and reversal, idempotent recovery and stale-data handling; verify real database concurrency and restart recovery.
5. Reports and approved integrations; KPI/performance/appraisal remain deferred, including the existing performance authorization blocker.

Testing must cover permissions, category and workflow configuration, historical versions, assignment/delegation expiry and scope, maker-checker, state validation, audit, real MySQL constraints and concurrency, preferences and existing notification behaviour. Do not treat mocks as database concurrency evidence. Required external inputs include authoritative organization/position data, approver assignments, approved templates, signatories, consent policy, operating schedule and eventual holiday calendar.
