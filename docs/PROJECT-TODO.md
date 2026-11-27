# ORBIT 360 project backlog

Canonical backlog for both repositories. Evidence is a source-code/documentation review, not proof of end-to-end operation. Update status, tasks, dependencies, blockers, decisions and verification as work proceeds. Do not mark a feature complete without appropriate verification. Read the relevant feature specification before planning; where none exists, identify the missing specification and obtain decisions before implementing.

Statuses: **Completed**, **Partially implemented**, **Pending**, **Blocked**, **Requires product decision**, **Requires verification**. Priorities below are proposed sequencing, not approved scope. Product decisions and permissions remain unchanged.

Full regression is tracked in [FULL-REGRESSION-TEST-PLAN.md](FULL-REGRESSION-TEST-PLAN.md); execution is incomplete. Security review additionally found `LeaveController.cancel` destroys a non-approved leave by ID without checking the caller's ownership or permissions. Confirm the authorized cancellation policy, fix and test cross-user access before release.

## Notification Center and workflow recipients

**Status:** Partially implemented. **Priority:** High. **Dependencies:** representative role-browser verification and migration verification in other environments. **Documentation:** [NOTIFICATIONS.md](NOTIFICATIONS.md), [workflow map](NOTIFICATION-WORKFLOW-MAP.md), [role-based notifications plan](ROLE-BASED-NOTIFICATIONS-PLAN.md).

Product has approved the role-notification D1–D5. Training HR-stage enforcement, reviewer event delivery, new categories, workflow occurrence dedupe, and focused tests are implemented. Cross-role browser verification remains outstanding. The performance authorization concern remains separately scoped and is not part of these notification integrations.

Regression follow-up: the loan form now reads the newly selected loan type's tenure; the authorization view exposes pending supervisor decisions from the supervisor-scoped queue and selects an available initial tab. These corrections still require representative browser and database-backed workflow verification. Both migrations were applied to local `orbit360_dev` on 25 November 2026; other environments have not been verified.

The backend suite passed 162 tests after selecting notification-free existing accounts for database-backed tests; existing notification rows were preserved. Authenticated local loan return cycles confirmed PENDING_REVIEW and occurrence-specific reviewer notifications; the misleading final-rejection response was corrected and retested. Frontend build, targeted lint and notification tests passed. Full role-based browser and cross-module workflow verification remain outstanding, as do the documented performance and leave-cancellation authorization issues.

Implemented: central registry, service and recipient resolution; owner-facing leave, loan, training, complaint and exit events; reliever on approved leave; channel preferences, polling and acknowledgement. Frontend has notification history, preferences and central self-toast suppression. These are implementation observations, not a new acceptance test.

- [x] Deliver supervisor, HR Officer/Manager and eligible reviewer/approver workflow events through the central Notification Center.
- [x] Resolve recipients from a persisted supervisor or active existing-permission queue, with maker/checker and account eligibility exclusions.
- [x] Preserve after-commit dispatch, preferences, polling acknowledgement, self-toast suppression, and complaint confidentiality.
- [x] Apply `20261126120000-extend-workflow-notification-categories.cjs` and `20261126120100-onboarding-decision-version.cjs` to local development with explicit approval.
- [ ] Complete representative browser delivery checks with supervisor, HR Officer, HR Manager and requester accounts.

**Product decisions:** no durable notification outbox is documented. Background/offline reliability work and any future category or recipient changes need separate approval.

## Employee dashboard

**Status:** Partially implemented. **Priority:** High. **Dependencies:** owner-scoped APIs, agreed dashboard metrics and notification feed. **Documentation:** frontend `src/pages/employee-portal/dashboard/Dashboard.jsx`, `DESIGN.md`; [NOTIFICATIONS.md](NOTIFICATIONS.md).

Implemented: personal dashboard summary endpoint, owner-scoped request counts and recent requests, annual leave balance, active loans, latest approved payslip, personal profile, quick actions and existing notification feed. Focused tests, local database query and full backend rerun passed; browser and responsive acceptance remain outstanding. An earlier backend run had a non-reproduced dashboard test-file process failure. See [employee dashboard specification](EMPLOYEE-DASHBOARD-UX.md).

- [ ] Define and implement owner-only activity summaries and consolidated My Requests using verified existing APIs or propose missing endpoints.
- [ ] Add approved quick actions, recent notifications and relevant personal employment information.
- [ ] Verify loading, empty, error, access control and responsive states; exclude company-wide HR analytics and other employees' private information.

**Product decisions:** which activities, request statuses, counts, actions, personal fields and notification limits provide value; no inferred policy.

## KPI management

**Status:** Pending. **Priority:** Medium. **Dependencies:** approved KPI specification, ownership/permissions and performance model. **Documentation:** `src/features/performance`, frontend `src/components/performance`.

Implemented: no dedicated KPI library or assignment workflow was identified in the inspected feature inventory; goals exist, but are not evidence of a KPI product.

- [ ] Define KPI library, creation, management, assignment, tracking and reporting.
- [ ] Establish the data model and integration with goals/appraisals; verify any existing reusable capability.
- [ ] Implement and verify only after an approved specification and plan.

**Product decisions:** ownership, measures, targets, scoring, review periods, access and approval rules.

## Performance management

**Status:** Partially implemented. **Priority:** Medium. **Dependencies:** security review and KPI/appraisal decisions. **Documentation:** `src/features/performance/performance.routes.ts`, frontend `src/components/performance`, [workflow map](NOTIFICATION-WORKFLOW-MAP.md).

Implemented: backend goal CRUD/progress and dashboard routes; frontend goal and feedback components exist. Check-in, recognition, analytics and development-planning components include coming-soon placeholders. Dedicated performance routing and functional integration require verification.

- [ ] Verify goals/OKRs and feedback persistence, routes and permissions end to end.
- [ ] Specify and implement check-ins, recognition and performance reports; do not count placeholders as functionality.
- [ ] Audit access and ownership enforcement for performance endpoints before exposure; workflow map notes routes lack local authentication middleware, and app-level protection must be checked.
- [ ] High priority: secure performance routes and enforce record-level ownership/permissions. Local code inspection found no global or route authentication; an unauthenticated HTTP request reached a mocked goal lookup and returned 200. The probe hit a Windows libuv shutdown assertion after its assertion passed, so repeat it in a stable test environment and verify deployment controls. Do not expose performance/appraisal notifications before remediation.
- [ ] Remediation proposal: authenticate the performance router, define explicit permissions for cycle administration and reporting, and enforce owner or assigned-manager checks on each goal and appraisal read and mutation. Confirm manager identity and approval policy before implementation; add unauthenticated, cross-employee, unauthorized-manager and permitted-role regression tests. Current controllers look up records by ID and mutate them without a requester ownership check, so authentication alone is insufficient.

**Product decisions:** goal/OKR ownership, visibility, feedback privacy, review and reporting audiences.

## Appraisal management

**Status:** Partially implemented. **Priority:** Medium. **Dependencies:** performance security, manager identity mapping and approved cycle policy. **Documentation:** `src/features/performance/performance.routes.ts`, `appraisal.model.ts`, [workflow map](NOTIFICATION-WORKFLOW-MAP.md).

Implemented: backend cycle and appraisal create/update/submit/review routes. Employee UI, quarterly rules and reporting are not established by route existence.

- [ ] Verify cycle lifecycle and appraisal permissions/end-to-end behavior, including employee and manager identity mapping.
- [ ] Specify quarterly cycles, employee/manager goal agreements, employee appraisal screens, review and reporting.
- [ ] Assess approval, return and notification requirements against real transitions.

**Product decisions:** cycle cadence, agreement and review sequence, scoring, manager identity, confidentiality and reporting access.

## Staff movement

**Status:** Phase 1 foundation verified. Phase 2 request submission and authorization implemented on local MySQL. **Priority:** Medium. See the [requirements](STAFF-MOVEMENT-REQUIREMENTS.md), [technical discovery](STAFF-MOVEMENT-TECHNICAL-DISCOVERY.md) and [implementation and migration record](STAFF-MOVEMENT-SPEC.md).

- [x] Record approved D1?D9 and implement organizational configuration, effective-dated assignments and Staff Movement notification category.
- [x] Register company-scoped configuration APIs, implement principal and delegate checks for all six authority roles, append transactional audit, enforce persisted state guards and protect historical workflow versions and stages.
- [x] Verify the four backend controls with 13 focused tests, 179 full-suite tests, TypeScript and both repository diff checks.
- [x] Recover `20261126161000-staff-movement-active-request-constraint.cjs` on local `orbit360_dev`. The generated slot and unique employee/slot index passed real competing-transaction, rollback, status and recovery tests. All four Staff Movement migrations are recorded. Final verification passed 27 focused tests, 193 backend tests, six frontend notification tests, TypeScript and both repository diff checks. See the specification for deployment compatibility and the separate path for an already-applied trigger migration.
- [x] Implement Phase 2 request intake, review queues, independent approvals, corrections, audit and notification dispatch. See the [Phase 2 implementation and verification record](STAFF-MOVEMENT-PHASE-2.md).
- [ ] Conduct product-owner acceptance with representative organization data and published approval matrices.
- [ ] Specify and implement Request New Staff and replacement requisitions under Recruitment, linked to approved positions and headcount when available.
- [x] Integrate review, correction and outcome notifications for submission and approval.
- [ ] Implement downstream events and scheduled reminders with their respective workflow phases.

**Approved:** D1–D9, including explicit scoped assignments, protected letters, separate consent, effective-date processing and Recruitment ownership of new-staff requisitions. Remaining external inputs include authoritative organization data, approver assignments, approved letter templates and consent policy. KPI, Performance and Appraisal integrations remain deferred; existing regression and security release blockers remain unchanged.

## Disciplinary action

**Status:** Pending. **Priority:** Medium. **Dependencies:** approved policy, confidentiality and access-control design. **Documentation:** [workflow map](NOTIFICATION-WORKFLOW-MAP.md) (inventory).

Implemented: no dedicated disciplinary feature was found in the inspected inventory.

- [ ] Specify case creation, investigation, review, verdicts and case history.
- [ ] Define retention, audit, access and notification requirements; implement and verify after approval.

**Product decisions:** sensitive-case visibility, participant roles, process, appeals and retention.

## User management

**Status:** Partially implemented. **Priority:** High. **Dependencies:** authorization/security review and approved account-lifecycle policy. **Documentation:** `src/features/users/user.router.ts`, frontend `src/pages/UserManagement.jsx`.

Implemented: admin-gated backend list/create/update/get routes and frontend listing/create/update controls for access level, job role and status. Job-role permissions are represented in the interface. Existing status controls are not proof that every suspension requirement works end to end; no user-delete route appears in the inspected router.

- [ ] Verify listing, role/job-role changes, permission enforcement, account suspension and self-protection end to end.
- [ ] Define deletion/deactivation and permission administration; implement only approved missing capabilities.

**Product decisions:** deletion vs retention/deactivation, role assignment authority, permission editing and recovery.

## Existing workflow improvements

**Status:** Partially implemented. **Priority:** High. **Dependencies:** workflow owners and regression tests. **Documentation:** [workflow map](NOTIFICATION-WORKFLOW-MAP.md), `src/features/training/training-request.service.ts`.

Training HR review now requires `PENDING_HR_REVIEW`, enforcing the approved supervisor-first policy. Training deletion checks initial `PENDING_SUPERVISOR_APPROVAL` rather than unreachable `PENDING`. Focused tests cover these gates. Loan approver rejection can return to `PENDING_REVIEW` and must not become a final employee rejection. The workflow map documents document-deletion decision/side-effect separation.

- [x] Enforce the approved supervisor-first training review policy in the service and HR review form; focused tests passed.
- [ ] Review other approval transitions, assignment, permissions and notification timing against actual code; assess document-deletion consistency separately.
- [ ] Verify training deletion and other current workflows with focused regression tests.

**Product decisions:** HR bypass and any exceptions; intended approval, cancellation and reviewer assignment policies wherever unspecified.

## Technical debt and QA

**Status:** Requires verification. **Priority:** High. **Dependencies:** test environments and scope-specific owners. **Documentation:** frontend `package.json`, `DESIGN.md`, [workflow map](NOTIFICATION-WORKFLOW-MAP.md).

Known prior results: frontend focused lint reported existing unused imports/variables, hook warnings and an undefined `error` reference in Document Management; production build reported stale Browserslist data and large chunks. These were not re-run for this documentation task. Frontend has a notification presentation test file but no `test` script in `package.json`; this does not establish broader test coverage.

- [ ] Reproduce and triage existing lint issues and the Document Management error reference; distinguish existing from new failures.
- [ ] Establish automated frontend test commands and meaningful component/workflow coverage; preserve notification tests.
- [ ] Run responsive, keyboard, accessibility and interaction regression checks across roles and workflows.
- [ ] Assess build warnings, dependencies and bundle size without changing them as part of unrelated work.
- [ ] Verify backend test/type-check and integration coverage in a suitable environment; record results and blockers.

**Product decisions:** prioritize any scope-changing security, reliability or workflow fixes separately.

## Design system compliance

**Status:** Completed for product designer's visual sign-off on Steps 1–4; **Requires verification** for automated and comprehensive browser testing. **Priority:** Ongoing. **Dependencies:** frontend `DESIGN.md` and shared components. **Documentation:** frontend `DESIGN.md`, `AGENTS.md`.

Implemented: tokens, shared patterns and documented designer sign-off. Sign-off is not evidence that every interaction has been automated or browser-tested.

- [ ] Follow `DESIGN.md` for every future frontend feature; reuse tokens, components and formatting.
- [ ] Create a Markdown implementation plan before each new feature or significant UX improvement; include design-system compliance in verification.
- [ ] Document reusable pattern additions centrally and verify responsive and role-specific behavior.

**Product decisions:** approve new patterns or departures where requirements are unclear.

## Proposed sequence

1. Complete cross-role browser acceptance checks and verify migration deployment separately for other environments.
2. Implement the functional Employee Dashboard using verified owner-scoped APIs.
3. Define and implement Staff Movement as the next major feature.
4. Triage the separately scoped performance authorization remediation before performance/appraisal expansion.
6. Continue user-management lifecycle work and remaining workflow improvements as their policy and security dependencies are resolved.
