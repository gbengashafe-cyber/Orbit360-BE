# Full application regression test plan

Status: in progress. A build or mocked test does not establish an end-to-end pass. Each row is a test case; record evidence, defects and retests as testing progresses. Untested cases are Not Run; Blocked requires a specific obstacle. Use local isolated records and retain existing data. Avoid external email and destructive actions.

Scope sources: frontend `src/pages/index.jsx`, `src/api/apiRoutes.js`, backend `src/app.ts`, mounted feature `*.routes.ts`, `NOTIFICATIONS.md`, `NOTIFICATION-WORKFLOW-MAP.md`, and `ROLE-BASED-NOTIFICATIONS-PLAN.md`. Route files under `src/features/job-application/` are not mounted by the current `app.ts`; verify before treating them as active. Roles derive from authenticated employee relationships and job-role permissions, not job titles alone.

For every applicable case verify permitted and denied roles, validation, API method/payload/status/response, persisted state, reload, error/empty/loading behavior, notification recipient/content/unread/read/link/preferences/deduplication, and privacy. Exercise approval and rejection using distinct isolated requests. Never modify or delete existing business records.

| ID | Feature / role | Expected workflow | Actual / defect / retest | Status |
| --- | --- | --- | --- | --- |
| 01 | Authentication / all | Login, refresh, logout and denied access | Not exercised | Not Run |
| 02 | Employee dashboard / employee | Own employment details and shortcuts | Not exercised | Not Run |
| 03 | Leave / employee and supervisor | Submit, validate, assigned review, approve/reject, owner and reliever notices | 26 Nov: authenticated create 201, wrong supervisor 403, assigned supervisor reject 200; persisted rejected and requester/supervisor notifications confirmed. Approval, reliever and UI still unverified. | Not Run |
| 04 | Loan / employee, HR reviewer, authorizer | Submit, review, return/reject, authorize and owner notices | QA loan 1 reached PENDING_DISBURSEMENT with expected notifications. QA loan 2 was reviewed and returned twice to PENDING_REVIEW, with occurrence-specific reviewer notifications and no final rejection notice. Corrected misleading return response and retested 200. Final rejection and UI submission remain unverified. | Not Run |
| 05 | Training / employee, supervisor, HR, authorizer | Submit, sequential review, approve/reject and notices | 26 Nov: authenticated submit 201, wrong supervisor 403, assigned supervisor, HR review and final approval 200; APPROVED and all five stage notifications confirmed. Rejection and UI remain unverified. | Not Run |
| 06 | Exit / employee, HR, authorizer | Submit, review, clear/reject, authorize and notify owner | Not exercised end-to-end | Not Run |
| 07 | Complaints / employee, HR, authorizer | Submit and review confidentially, authorize/reject, preserve anonymity | Not exercised end-to-end | Not Run |
| 08 | Documents / employee, HR, authorizer | Scoped list/download, management and deletion authorization | Not exercised | Not Run |
| 09 | Payslips / employee and HR | Own payslips and authorized HR views | Not exercised | Not Run |
| 10 | Notifications / all | Feed, unread, read, preferences, polling, links and duplicate suppression | Not exercised end-to-end | Not Run |
| 11 | HR dashboard / HR | Authorized analytics and denial for others | Not exercised | Not Run |
| 12 | Employee management / maker and checker | Create/edit, authorize/reject; maker exclusion | Not exercised | Not Run |
| 13 | HR loans / reviewer and authorizer | List, review, decision, return and authorization | Not exercised | Not Run |
| 14 | Payroll / HR and authorizer | Generate, approve/reject, overrides, reports and permissions | Not exercised | Not Run |
| 15 | Recruitment / HR and authorizer | Posting create/approval/rejection, candidate pipeline and offers | Not exercised | Not Run |
| 16 | Onboarding / employee and HR | Document submission, review/decision and notification | Not exercised | Not Run |
| 17 | Authorization Center / supervisor and checkers | Scoped queue, detail, approve/reject and maker exclusion | Not exercised end-to-end | Not Run |
| 18 | User management / admin | Listing and supported account/permission actions; non-admin denial | Not exercised | Not Run |
| 19 | Companies, departments and job roles / authorized users | Supported listing and management with validation and permissions | Not exercised | Not Run |
| 20 | Tax calculator / applicable user | Calculation, validation and error handling | Not exercised | Not Run |
| 21 | Performance API / security | Authenticated, owner/manager/authorized HR only | Router lacks authentication and record ownership checks; prior unauthenticated mocked probe reached handler. Remediation requires approval. | Fail |
| 22 | Performance and appraisal UI | Verify actual routes and persisted workflows, distinguish placeholders | No dedicated page route found in `src/pages/index.jsx`; backend endpoints exist | Not Run |
| 23 | API contract and schema / all mounted routes | Compare every mounted route, frontend caller, payload, response and authorization | Inventory started; endpoint-by-endpoint verification incomplete | Not Run |
| 24 | Leave cancellation / unauthorized employee | Cannot cancel another employee's request | Code inspection: `LeaveController.cancel` loads by ID and destroys without checking owner or permission. Browser exploitation has not been attempted. | Fail |

Performance affected endpoints: `/api/v1/performance/dashboard`, `/goals` and `/goals/:id` (including progress), `/cycles` and `/cycles/:id` (including activate/close), and `/appraisals` and `/appraisals/:id` (including submit/review). Proposed remediation: authenticate the router; establish approved employee-owner, assigned-manager and authorized HR/admin rules; scope reads and writes to records; test anonymous, cross-employee, wrong-manager and permitted cases. Authentication alone is insufficient. Obtain product approval for the access matrix before substantial authorization changes.

Previous verification: local migrations for workflow categories and onboarding decision version applied; backend suite 162/162 passed; frontend production build, targeted lint and five notification tests passed. These do not count as browser workflow passes.

26 Nov additional read-only smoke checks: authenticated employee GET requests returned 200 for dashboard, employee self, employee loans/training, notification unread count/preferences, document and folder lists, own complaints, leave types, authorization counts and loan types. These status checks do not prove complete module workflows or permission isolation.
