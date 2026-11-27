# ORBIT 360 Notification Workflow Map

**Implementation update:** HR review requires `PENDING_HR_REVIEW` and the HR form no longer enables review while supervisor approval is pending. Role-based delivery is implemented through persisted-supervisor or bounded existing-permission resolution. The early duplicate-toast discovery remains historical and is superseded by the later frontend suppression.

## Staff Movement request lifecycle

Phase 2 uses the existing STAFF_MOVEMENT category. After a committed submission, review, correction or escalation, MOVEMENT_REVIEW_REQUIRED goes only to the next independent eligible stage principal and applicable bound delegate, or the expressly assigned independent HR reviewer. An initiating HOD's recorded endorsement skips that stage's duplicate task. Objections first go to assigned HR, then to Head of HR on escalation. Returned requests and clarifications send MOVEMENT_CORRECTION_REQUIRED to the designated correcting party. Approval, rejection, withdrawal and cancellation send MOVEMENT_OUTCOME to initiator and subject; approval also includes the eligible departmental heads. Recipients are deduplicated per occurrence. Payloads contain identifiers and revision only. Record access is independently rechecked by the API. Scheduling, letters and clearance are later phases.

## Current role-based delivery

| Workflow transition | Recipient policy | Event/category |
| --- | --- | --- |
| Leave submission | Requester's persisted supervisor | `LEAVE_REVIEW` / `LEAVE` |
| Training submission | Requester's persisted supervisor | `TRAINING_SUPERVISOR_REVIEW` / `TRAINING` |
| Training supervisor approval | Active `MANAGE_TRAINING_REQUESTS` holders, excluding the acting supervisor and requester | `TRAINING_HR_REVIEW` / `TRAINING` |
| Training HR review | Active `APPROVE_TRAINING_REQUESTS` holders, excluding requester and reviewer | `TRAINING_FINAL_APPROVAL` / `TRAINING` |
| Loan submission and return | Active `MANAGE_LOANS` holders excluding the maker | `LOAN_REVIEW` / `LOAN` |
| Loan review | Active `APPROVE_LOANS` holders excluding requester and reviewer | `LOAN_AUTHORIZATION` / `LOAN` |
| Employee change | Active `APPROVE_EMPLOYEES` holders excluding maker and affected employee | `EMPLOYEE_MANAGEMENT_AUTHORIZATION` |
| Exit submission and reviewer clearance | Existing Exit permission queues | `EXIT_REVIEW`, `EXIT_AUTHORIZATION` / `EXIT` |
| Job posting | Active `APPROVE_JOB_POSTINGS` holders and the persisted creator outcome | `RECRUITMENT_*` |
| Complaint review/authorization | Active existing complaint permission queues, generic confidential copy only | `COMPLAINT_REVIEW`, `COMPLAINT_AUTHORIZATION` |
| Payroll, document deletion, onboarding | Existing permission queues and persisted maker/employee outcomes | `PAYROLL_*`, `DOCUMENTS_*`, `ONBOARDING_*` |

The remaining discovery content is historical. It must not be read as a statement that the current integration is absent.

**Performance security update:** a local unauthenticated HTTP probe reached a mocked goal lookup and returned 200. No real performance record was read. Its test process then encountered a Windows libuv shutdown assertion; the finding and test limitation are recorded in the role-based plan. Performance notifications remain deferred pending separate security remediation.

**Discovery snapshot:** 24 November 2026  
**Scope:** Existing backend and frontend workflow code, with a targeted investigation of the duplicate training toast. This is a discovery report, not an implementation plan approved for every candidate event. Notification event registration alone does not prove that a workflow dispatches it.

## Executive findings

1. **The duplicate training success toast is independently emitted by the UI and by notification polling.** On successful submission, `src/pages/training-requests/training-request-form.jsx` calls `sonner`'s `toast.success`. The backend `TrainingRequestService.createRequest` also dispatches `TRAINING_APPLIED` to the request owner's employee account. `NotificationCenterContext.jsx` polls `/v1/notifications/realtime` and renders every returned alert with Sonner. The new row also correctly increases unread count and appears in the in-app feed.
2. The creation payload is built by `notificationPayload(request)` without `actorUserId`, so the stored event has no initiator identity. Other training decisions pass `actorUserId`, but that field is deliberately omitted from the API view used by polling. The client therefore cannot distinguish an action confirmation from an alert for an action by somebody else.
3. **Recommended reusable resolution:** make realtime presentation actor-aware centrally. Populate the authenticated initiating user ID for employee-originated events, then suppress only the realtime alert for the recipient account that initiated that same event; continue to store the notification with the recipient's independent in-app preference so history and unread behavior remain unchanged. Other recipients, such as a reliever or a designated reviewer, still receive realtime alerts. Implement the rule in the central notification delivery/polling path, not in the training form. Complaint events need a privacy-preserving internal actor comparison that does not persist or expose the complainant identity or relax the complaint actor-null rule. Cover both a self-recipient and a different recipient in tests, including all four preference combinations.
4. Do not simply remove the training form's success toast: it is the immediate confirmation for the action, whereas a notification is also required for history. Do not suppress the notification row or alter user preferences to solve duplicate visual feedback.
5. The backend now sends a workflow task to the actual persisted supervisor where one exists, otherwise to active eligible users holding the workflow's existing required permission. No arbitrary administrator fallback exists.

## Repositories and instructions reviewed

- Backend: `AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`), and `docs/NOTIFICATIONS.md`.
- Frontend: `README.md`, `QUICK_REFERENCE.md`, routing/layout, authentication context, feature forms and approval screens. No frontend `AGENTS.md` or `CLAUDE.md` was present outside ignored dependency directories.
- The backend and frontend repositories are both on `amelia/phase-2`. Backend working tree was clean. The frontend already had Phase 5 changes in its working tree before this discovery; those changes were preserved and are not included in this report's documentation-only diff.
- No migrations, database commands, code edits, or workflow changes were made.

## Duplicate toast trace

```text
Employee submits TrainingRequestForm
  -> trainingService.submitRequest()
  -> UI: toast.success("Success", ...)
  -> backend TrainingRequestController.submitRequest()
  -> TrainingRequestService.createRequest()
       creates PENDING_SUPERVISOR_APPROVAL row
       NotificationService.notify(TRAINING_APPLIED, owner employee ID, no actorUserId)
  -> Employee-to-User resolver finds employee account using its email
  -> notification persisted with independently selected channel preferences
  -> NotificationCenterContext polls pending realtime rows (visible tab, ~30s)
  -> UI: toast(alert.title, { description: alert.message })
```

The backend event is persisted once; the two toast calls are separate UI effects. `TRAINING_APPLIED` is only addressed to the original submitter even for `requestScope: TEAM` (D6). This is not a duplicate database row or a polling acknowledgement failure. Acknowledgement prevents replay of the same alert after delivery; it cannot know that the action form already displayed success. Current preference handling still gives: in-app ON/realtime ON = history plus polling toast; ON/OFF = history only; OFF/ON = polling toast only; OFF/OFF = neither. The duplicate occurs in the ON/ON case when the submitter is also the notification owner.

The same design can repeat outside training: the leave request form, complaint submission dialog, and Exit submission screen also display success feedback while their backend sends an owner notification; those event callers either omit actor identity or (for complaints) intentionally force it to null. Loan submission supplies the actor user ID, but the polling response still does not expose it. This confirms a reusable central actor-aware rule is more appropriate than changing one form. Complaint actor-null and anonymity requirements must remain intact.

### Resolution requirements

- Use an authenticated actor identity from the successful workflow request, not a guessed employee/user mapping.
- Preserve an in-app row and its unread count if in-app is enabled, including when the same user initiated the action.
- Suppress only the redundant realtime presentation to that same actor/recipient for that event. Do not suppress a different recipient's alert.
- Keep `inAppEnabled` and `realtimeEnabled` as separate preferences. Treat suppression as an actor-feedback rule, not as a preference mutation.
- For complaints, preserve the strict payload, owner-only recipient, null stored actor, safe metadata, and anonymity protections. If central suppression needs actor context, compare it transiently and do not expose/store the identity in complaint notification data.
- Tests should verify the four preference combinations, requester self-submission with no second toast but with feed/unread presence, and an intended other recipient still alerted.

## Existing workflow map

The routes/controllers below are the actual transition owners. Where a backend field stores only a permission or a generic `reviewedBy`, the responsible person is not assigned by the workflow. “No Notification Center event” means no dispatch was found in the workflow implementation inspected.

### Leave Management — implemented

```text
Employee submits -> pending
  -> employee's selected/linked supervisor approves -> approved
       -> employee requester notified; assigned covering employee notified
  -> supervisor rejects -> rejected -> employee requester notified
  -> requester cancels eligible request -> deletion -> requester notified
```

| Stage | Responsible role / identity | Actual transition and owner | Transaction | Notification Center |
|---|---|---|---|---|
| Submit | Employee; employee record is obtained from authenticated user | `LeaveController.create`, creates `pending` | No encompassing transaction | `LEAVE_APPLIED` to requester after create |
| Review | Supervisor resolved by employee `supervisorId` (employee ID, not user ID); caller's `employeeRecord.id` must match | `LeaveController.approveOrDecline`, conditional `pending` → `approved`/`rejected` | Yes; conditional update and related balance/status changes | `LEAVE_APPROVED` or `LEAVE_REJECTED` after commit to requester. `RELIEVER_ASSIGNED` after commit to `covering_employee_id` on approval only; D2 copy names the person on leave. |
| Cancel | Employee/requester | `LeaveController.cancel`; approved leave cannot be cancelled; deletes eligible leave | No encompassing transaction | `LEAVE_CANCELLED` only after deletion succeeds |

Relevant frontend paths include employee `LeaveManagement` / `LeaveRequestForm` and HR `LeaveApprovals`. No reviewer Notification Center alert is dispatched (D4).

### Training Requests — implemented employee notifications; Phase 6 reviewer events missing

```text
Employee submits -> PENDING_SUPERVISOR_APPROVAL
  -> assigned supervisor approves -> PENDING_HR_REVIEW
       -> HR Officer approves -> PENDING_HR_APPROVAL
            -> HR Manager approves -> APPROVED (terminal)
            -> HR Manager rejects -> REJECTED (terminal)
       -> HR Officer rejects -> HR_REJECTED (terminal)
  -> assigned supervisor rejects -> SUPERVISOR_REJECTED (terminal)
```

The supervisor is **`Employee.supervisorId`, an Employee ID**. The supervisor decision route is `PUT /v1/training-requests/:id/supervisor-approval`; the controller passes the authenticated supervisor's `employeeRecord.id`, and the service checks equality with the requester's supervisor ID. Recipient resolution for a future supervisor event must resolve that employee record to its user account through the established employee email relationship. The decision actor fields (`supervisorApprovedBy`, `hrReviewedBy`, `finalApprovedBy`) are **User IDs**.

| Stage | Responsible role / identity | Actual transition and owner | Transaction | Notification Center |
|---|---|---|---|---|
| Submit | Employee; TEAM requests retain original `employeeId` as owner | `TrainingRequestController.submitRequest` → `TrainingRequestService.createRequest`, new row `PENDING_SUPERVISOR_APPROVAL` | No transaction; create then notify | `TRAINING_APPLIED` to original requester. No supervisor/HR notification. TEAM members are not recipients (D6). The frontend now suppresses only the matching, transient real-time toast after it has shown the initiator's normal action-success toast; the stored notification and polling payload do not contain actor identity. |
| Supervisor decision | The single employee referenced by requester's `supervisorId`; authenticated user must have matching employee record | `supervisorApproval`, `PENDING_SUPERVISOR_APPROVAL` → `PENDING_HR_REVIEW` or `SUPERVISOR_REJECTED` | Conditional status update, not wrapped in transaction | Employee gets `TRAINING_REJECTED` on supervisor rejection. No notification to supervisor/HR on submission or next-stage queueing. |
| HR Officer review | Any caller with `MANAGE_TRAINING_REQUESTS`; no HR reviewer assignment is stored | `hrReview`, normally `PENDING_HR_REVIEW` → `PENDING_HR_APPROVAL` or `HR_REJECTED` | Conditional status update, not wrapped in transaction | Employee gets `TRAINING_REJECTED` on rejection. Intermediate approval does not notify employee. No next reviewer notification. |
| HR Manager final | Any caller with `APPROVE_TRAINING_REQUESTS`; no manager assignment is stored | `finalApproval`, `PENDING_HR_APPROVAL` → `APPROVED` or `REJECTED` | Conditional status update, not wrapped in transaction | Employee gets `TRAINING_APPROVED` or `TRAINING_REJECTED`. |
| Delete/cancel | Original employee only | `deleteRequest` destroys rows only from `PENDING_SUPERVISOR_APPROVAL` | No transaction | No event found. This is the model's initial state and no review has begun. The previous `PENDING` gate was unreachable because `PENDING` is not a TrainingRequest status. |

**Workflow caveat / unresolved product decision:** HR review explicitly accepts both `PENDING_HR_REVIEW` and `PENDING_SUPERVISOR_APPROVAL`. A user with `MANAGE_TRAINING_REQUESTS` can therefore review a request before supervisor approval. The route permission does not require that caller to be the requester's supervisor. The normal frontend sequence and the submission response say supervisor approval comes first, but no existing policy document says whether the backend exception is intentional. This task leaves the bypass unchanged. Decide whether HR may intentionally bypass supervisor review; if not, restrict `hrReview` to `PENDING_HR_REVIEW` and add a regression test before adding Phase 6 reviewer alerts.

Frontend paths: `RequestTraining.jsx` and `training-request-form.jsx`; supervisor queue/actions are in the training review UI/controller calls, and HR review/final approval are under `hr-portal/training-request-review` and Authorization Center modules. Note the legacy UI/API copies (`RequestTraining_NEW.jsx`, `RequestTraining_UPDATED.jsx`) are not necessarily routed; the active route imports `training-requests/RequestTraining.jsx`.

**Missing recipient decisions:** A submission alert to the one identified supervisor is data-supported and has a clear queue event. HR Officer and HR Manager stages are permission pools, not assigned individual users. `MANAGE_TRAINING_REQUESTS` and `APPROVE_TRAINING_REQUESTS` are role/permission gates; the request has no `assignedReviewerId`. Do not fan out to every HR user automatically. Decide whether a specific assignee/queue owner exists outside this feature or approve a permission-holder notification policy before implementing these alerts.

**Exact Phase 6 candidate dispatch points (not implemented):** (1) after request creation at `PENDING_SUPERVISOR_APPROVAL`, target the one employee identified by the request owner's `supervisorId`; (2) after successful supervisor approval to `PENDING_HR_REVIEW`, target the responsible HR Officer, once an individual is determined; (3) after successful HR Officer review to `PENDING_HR_APPROVAL`, target the responsible HR Manager, once an individual is determined. HR Officer rejection and HR Manager final decision already notify the request owner. Add supervisor and HR event definitions to the central registry only after deciding recipient assignment and message fields. The HR review endpoint also accepts `PENDING_SUPERVISOR_APPROVAL`, so an alert that fires only after supervisor approval will not cover the permitted HR-bypass route. Decide whether that route is intentional or whether HR needs a separate queue alert at submission. D6 preserves the original submitter as the sole TEAM employee beneficiary; an approved supervisor/HR task alert would go to the responsible workflow actor, not TEAM members.

### Loans / Cooperative — implemented requester notifications; reviewer events missing

```text
Employee submits -> PENDING_REVIEW
  -> loan reviewer (MANAGE_LOANS) approves -> PENDING_APPROVAL / nextStep ACTIVE
  -> loan reviewer rejects -> PENDING_APPROVAL / nextStep REJECTED (still awaiting authorizer)
  -> HR Authorizer (APPROVE_LOANS) confirms reviewer APPROVE -> PENDING_DISBURSEMENT
  -> HR Authorizer confirms reviewer REJECT -> REJECTED (terminal)
  -> HR Authorizer rejects/returns the review -> PENDING_REVIEW
  -> eventual disbursement/payment -> later payment status
```

| Stage | Responsible role / identity | Status / handler | Transaction | Existing event / gap |
|---|---|---|---|---|
| Submit/edit/cancel | Employee owner via `/v1/employees/loans`; service loads authenticated employee ID and user ID | `EmployeeController` and `EmployeeService`; starts `PENDING_REVIEW`; cancellation updates eligible pending state | Creation and cancellation/update paths use transactions | `LOAN_APPLIED` after creation transaction; `LOAN_CANCELLED` after successful conditional cancellation. No reviewer alert. |
| HR review | Permission holder `MANAGE_LOANS`; `reviewedBy` is a User ID | `LoanService.reviewLoanRequest` sets status to the record's `nextStep` (normally `PENDING_APPROVAL`) and updates `nextStep` to `ACTIVE` for reviewer APPROVE or `REJECTED` for reviewer REJECT | Yes, transaction plus audit | This rejection is intermediate: no employee notification yet. Reviewer approval also has no notification. |
| Authorizer | Permission holder `APPROVE_LOANS`, distinct from reviewer by maker-checker | `approveLoanReview` uses the stored reviewer decision: reviewer APPROVE → `PENDING_DISBURSEMENT`; reviewer REJECT → `REJECTED`. `rejectLoanReview` returns status to `PENDING_REVIEW` | Yes, transaction plus audit | `LOAN_APPROVED` only at `PENDING_DISBURSEMENT`; `LOAN_REJECTED` only when resulting status is `REJECTED`. Returning to `PENDING_REVIEW` is not a final rejection. Note the API route names (`approve`/`reject`) describe the authorizer's action on the review; the resulting business status depends on the stored reviewer decision. |
| Disbursement/payment | Payment/disbursement execution ownership is not represented by an identified Notification Center recipient in the inspected loan transition routes | Payment model/status progression exists separately from approval | Not verified as one atomic notification transition | No event found; D5 says approved notification must not claim payment/disbursement. A future disbursement event requires explicit responsible-user/employee message policy. |

Employee UI is `employee-cooperative/cooperative-loan.jsx`; HR review is `hr-portal/loans/Cooperative.jsx`; authorization uses Authorization Center. HR queues are permission-based rather than per-request assigned. No HR/reviewer notification exists.

### Staff Complaints — implemented owner-only notifications; privacy restriction remains

```text
Employee submits -> PENDING_REVIEW
  -> HR Officer review approves -> PENDING_APPROVAL
  -> HR Officer rejects -> REJECTED_BY_REVIEWER (terminal)
  -> different HR Manager approves -> APPROVED (terminal)
  -> different HR Manager rejects -> REJECTED_BY_APPROVER (terminal)
```

The routes require `MANAGE_COMPLAINTS` for the HR Officer stage and `APPROVE_COMPLAINTS` for the HR Manager stage. Maker-checker prevents the same user from both stages. Service transitions are conditional and transactional. Current `COMPLAINT_SUBMITTED`, `COMPLAINT_APPROVED`, and `COMPLAINT_REJECTED` go **only to the complaint owner** after commit. Preserve the strict payload, null actor and metadata allow-list; no supervisor or HR reviewer event may reveal complainant identity or complaint details. This owner-only rule takes precedence over role-based fan-out even though the Employee Hub milestone has passed. Employee UI is `complaints/staff-complaints.jsx`; reviewer UI is `complaints/complaint-management.jsx` and Authorization Center.

### Exit Management — implemented employee outcomes; reviewer/clearance alerts missing

```text
Employee submits -> submitted
  -> reviewer MANAGE_EXITS: finalApprovalStatus pending -> cleared (workflow remains in review/clearance)
       or rejected (terminal reviewer rejection)
  -> authorizer APPROVE_EXITS: status/finalApprovalStatus -> approved or rejected
  -> clearance completion/status update -> completed
```

`ExitController.create/update/reviewExit/approveExit` own the transitions. `EXIT_APPLIED`, `EXIT_APPROVED`, `EXIT_REJECTED`, `EXIT_COMPLETED` are delivered to the employee owner. Reviewer clearance (`finalApprovalStatus: cleared`) is intermediate and has no employee outcome event. Route permissions identify permission classes but do not assign a specific reviewer. Existing Exit writes are not transactional or guarded by conditional status updates; competing terminal updates may create conflicting outcomes (known D7 risk). Employee UI is `components/selfservice/ExitManagement.jsx`; reviewer/approver UI is `ExitApprovals.jsx` and Authorization Center.

### Recruitment and Recruitment Approvals — implemented applicant and job-posting workflow; no Notification Center integration

**Job posts:** `JobPostingController` creates `pending_approval` posts under `MANAGE_JOB_POSTINGS` and stores the initiating user in `created_by`; a caller with `APPROVE_JOB_POSTINGS` sets `active` or `rejected`. The creator is therefore an identifiable candidate recipient for outcome notifications. Active postings may be closed. No event dispatch exists. Posting approval is one stage, not a chained review; the reject handler can set `rejected` for any status other than active/closed and has no conditional update guard.

**Applications:** Candidate applications progress through `applied`, `under_review`, `interview_scheduled`, `interviewed`, `offered`, `hired`, or `rejected`. Authenticated recruitment handlers can update status, schedule interview, send offer, hire, reject, and delete. Candidate/contact data is not an ORBIT employee account; current central recipient resolver cannot assume the candidate has a Notification Center account. Internal recruiter assignment is not identified by these status changes. No Notification Center event exists. Do not invent employee/manager recipients or expose candidate personal data in general notifications. Frontend: `Recruitment.jsx`, `RecruitmentApprovals.jsx`, pipeline/application components.

### Onboarding — implemented document status editing; no distinct approval assignment

`OnboardingController.create` creates onboarding/document records, usually `pending`; generic permission-gated `update` can set `submitted`, `approved`, or `rejected` and writes `reviewedBy`/`reviewedAt` for terminal statuses. There is no separate stage-specific approval route or assigned reviewer; `MANAGE_ONBOARDING` is the update permission. The affected employee is `employeeId`; the actor/reviewer is a user ID. Writes are not grouped in a business transaction. No Notification Center dispatch exists. Candidate events (document submitted, approved/rejected) need a product decision about whether the employee owner should be notified and what safe document-level copy to use. Frontend: `Onboarding.jsx`.

### Payroll and Payslips — implemented maker-checker payroll batch approval; no Notification Center integration

`PayrollService.generateBatch` creates batch `PENDING_APPROVAL` with payroll rows in a transaction. A different user with `APPROVE_PAYROLLS` approves (`APPROVED`) or rejects (`REJECTED`); the batch and payroll rows update/delete in a transaction. Override path transitions `APPROVED` to `PENDING_OVERRIDE_APPROVAL` and then `OVERRIDE_APPROVED`; it records the checker/authorizer in audit records. The batch maker is `createdBy`; reviewer is `reviewedBy`; per-employee payroll rows carry the employee IDs. No notification events exist. Potential notifications include batch maker on decision and employee when a payslip becomes available, but they have different privacy/audience concerns and require an approved policy. Do not place salary values or payslip data in a general notification. Frontend: `Payroll.jsx`, `hr-portal/payslip/*`, employee payslip view.

### Employee maintenance / staff record changes — implemented maker-checker; no Notification Center integration

`EmployeeService.initiateEmployeeMaintenance` transactionally creates `EmployeeChangeRequest(PENDING_APPROVAL)` and `EmployeeDraft`, records requester `requestedBy` (User ID), and temporarily changes employee status. `APPROVE_EMPLOYEES` users approve/reject, excluding the maker; `approveMaintenance` applies draft and updates request to `APPROVED` in one transaction, while `rejectMaintenance` marks `REJECTED` and restores previous employee status. Employee create requests share the approval machinery. On create approval, an employee account may be created and a welcome email sent. No Notification Center events exist. The requester and affected employee are distinct candidate recipients; the employee may not yet have an account. Resolve which one receives each outcome before implementation. Frontend: employee management pages and Authorization Center employee module.

### Performance appraisals — partially implemented lifecycle; no Notification Center integration

Appraisal records have `pending`, `in_progress`, `submitted`, `completed`, and `reviewed`; appraisals store `employee_id` and `manager_id` as integers. Controller handlers create an `in_progress` appraisal, permit updates, transition to `submitted`, then manager review changes it to `reviewed`. No explicit rejection/return-for-correction status or multi-stage approval appears in this model/controller. No Notification Center dispatch exists. The relationship/namespace for `manager_id` and whether that user has an ORBIT account are not established in these handlers; do not infer a recipient. Routes shown do not apply auth/permission middleware locally, an access-control concern outside notification scope. Goals and cycles are planning/progress lifecycles, not approval chains in the inspected routes. Frontend performance components exist, but no dedicated current approval screen was identified in page routing.

### HR document/folder deletion requests — implemented one-stage permission approval; no Notification Center integration

Deletion requests progress `PENDING_APPROVAL` to `APPROVED` or `REJECTED`. The creator is persisted as `requestedBy`; the decision user is `reviewedBy`. `APPROVE_DOCUMENT_DELETION` accesses the pending queue and approves/rejects. The request status write and subsequent actual document/folder deletion are separate operations; approval can be recorded before the delete side effect completes. No Notification Center event exists. Requester notification on decision is plausible, but transaction/side-effect consistency should be resolved before dispatch. Ordinary document CRUD is not an approval workflow. No frontend deletion-approval screen was identified in current page routes.

### Workflows not implemented / additional scope

| Feature | Finding |
|---|---|
| Staff Movement | No backend `staff-movement` feature or frontend workflow was found in the repository inventories inspected. No workflow or recipient should be invented. |
| Disciplinary Management | No backend disciplinary feature or frontend workflow was found in the repository inventories inspected. No workflow or recipient should be invented. |
| Job applications for external candidates | Implemented recruitment lifecycle, but candidates are not known to be central notification users and no recipient account mapping/assignment was identified. |
| Leave, loan, training and complaint approval queues | Existing queues/approval routes found; notification delivery to supervisors/HR roles is currently absent except the leave's employee and reliever outcomes. D4 deferral is now eligible for reassessment, not evidence those messages already exist. |

## Current Notification Center coverage by audience

## Candidate Phase 6 notification gaps (proposals only)

Names below are candidate event names, not registered or implemented event types. Existing categories should be reused where semantically approved; the current registry has no dedicated Recruitment, Onboarding, Employee Maintenance, Payroll, Appraisal, or Document Deletion category. Selecting `GENERAL` or adding categories needs a product decision, especially where new category eligibility would require schema changes.

| Workflow outcome / queue entry | Candidate event | Candidate recipient | Exact dispatch point | Blocker / approval needed |
|---|---|---|---|---|
| Leave awaits supervisor | `LEAVE_REVIEW_REQUIRED` | The requester's assigned supervisor (employee relationship) | After leave create commits/succeeds with status pending | Confirm supervisor task notifications are now in Phase 6 scope and resolve recipient through employee-to-user account mapping. |
| Training awaits supervisor | `TRAINING_REVIEW_REQUIRED` | One employee from requester's `supervisorId` | After training request row is created successfully | Event absent. Pass authenticated actor context for duplicate-toast suppression. |
| Training enters HR Officer review | `TRAINING_HR_REVIEW_REQUIRED` | Specifically assigned HR Officer | After transition to `PENDING_HR_REVIEW` | No per-request HR Officer assignment exists; choose assignment or explicitly approve permission-holder policy. Handle HR bypass from `PENDING_SUPERVISOR_APPROVAL`. |
| Training enters HR Manager authorization | `TRAINING_HR_APPROVAL_REQUIRED` | Specifically assigned HR Manager | After transition to `PENDING_HR_APPROVAL` | No per-request HR Manager assignment exists; choose assignment or approve a bounded queue recipient rule. |
| Loan awaits HR review / authorization | `LOAN_REVIEW_REQUIRED`, `LOAN_AUTHORIZATION_REQUIRED` | Actual responsible reviewer/authorizer | After committed transition to `PENDING_REVIEW` / `PENDING_APPROVAL`, including returned items only if review is required again | Permissions gate queues but do not assign individual users. Do not alert all `MANAGE_LOANS`/`APPROVE_LOANS` users without policy approval. Respect intermediate `nextStep` and never send a final rejection for the review's `PENDING_APPROVAL` stage. |
| Complaint awaits HR review/authorization | No candidate HR event under current privacy decision | Complaint owner only | Existing owner-only outcome events after commit | Notification policy says complaint notification goes only to owner and complaint payload must remain identity-safe. An HR task alert requires explicit privacy/product approval; do not add it from this discovery. |
| Exit awaits reviewer/authorizer | `EXIT_REVIEW_REQUIRED`, `EXIT_AUTHORIZATION_REQUIRED` | Actually responsible reviewer/authorizer | After submission or transition into clearance/authorization queue | Role permission is not assignment. Preserve owner-only sensitive outcome copy; known non-transactional/unguarded Exit workflow risk needs an approved minimal safeguard plan before adding competing outcome alerts. |
| Job posting approval/rejection | `JOB_POSTING_APPROVED`, `JOB_POSTING_REJECTED` | Posting `created_by` user | After successful active/rejected update | Recipient exists; event category/copy and status guard/transaction convention need design. |
| External job application status/interview/offer | Candidate-facing event proposals | Candidate contact channel, not currently a known Notification Center user | After successful candidate status update/scheduling/offer/hire/rejection | No account/user mapping, central-recipient eligibility, or product decision for candidates. Do not guess a recipient account. Internal recruiter assignee also absent. |
| Onboarding document submission/review | `ONBOARDING_SUBMITTED`, `ONBOARDING_APPROVED`, `ONBOARDING_REJECTED` | Employee owner; perhaps record creator if distinct | After successful status update | No assigned reviewer; category and safe document-level message require approval. |
| Employee create/change approval outcome | `EMPLOYEE_CHANGE_APPROVED`, `EMPLOYEE_CHANGE_REJECTED` | `requestedBy` user; possibly affected employee after account exists | After transaction commit | Maker and affected employee can differ; employee creation may have no account until approval. Confirm audience and new category versus GENERAL. |
| Payroll batch approval/rejection | `PAYROLL_BATCH_APPROVED`, `PAYROLL_BATCH_REJECTED` | Batch `createdBy` user | After batch/payroll transaction commit | Category and message approval needed; don't disclose payroll amounts or notes. |
| Payslip becomes available | `PAYSLIP_AVAILABLE` | Employee owner of payroll row | After approved payroll rows/payslip are accessible | Confirm event timing and employee preference category; no salary data in alert. |
| Appraisal requested/reviewed | `APPRAISAL_REVIEW_REQUIRED`, `APPRAISAL_REVIEWED` | Assigned `manager_id` / employee owner if IDs resolve | After successful submit/review update | Clarify whether manager_id is User ID or Employee ID and enforce expected role/account mapping; current route lacks local auth middleware. |
| Document/folder deletion request decision | `DOCUMENT_DELETION_APPROVED`, `DOCUMENT_DELETION_REJECTED` | Persisted `requestedBy` user | After both decision and physical deletion side effect succeed, or after a redesigned atomic/outbox boundary | Current repository commits request decision before actual delete; do not report completion before side effect. Choose privacy-safe copy and category. |

These proposals describe candidate events and dispatch moments for product/implementation planning. They are not permission to modify any workflow, recipient set, registry category, or database schema.

| Audience | Current delivered events | Coverage gaps / limits |
|---|---|---|
| Employee/request owner | Leave applied/approved/rejected/cancelled; loan applied/approved/rejected/cancelled; training applied/approved/rejected; complaint submitted/approved/rejected; exit applied/approved/rejected/completed | Current workflows generally notify only the requester/owner. No notifications for employee maintenance, onboarding, payroll/payslip, appraisal, recruitment applicant, or HR document deletion outcomes. Training submission currently creates duplicate visual feedback when ON/ON and the submitter is the recipient. |
| Assigned leave reliever | `RELIEVER_ASSIGNED` after approved leave | Existing behavior only; no general assignment notification model for other modules. |
| Supervisor/Team Lead | None in Notification Center | A training requester's `Employee.supervisorId` identifies exactly one employee-record supervisor, but no event is dispatched to them. D4 was deferred and can now be reconsidered. Other workflows need their own assignment evidence. |
| HR Officer | None as Notification Center recipients | Training/complaint review routes use `MANAGE_*` permission but no explicit per-request HR Officer assignment. Complaints remain owner-only because of privacy rules. Do not indiscriminately notify all permission holders. |
| HR Manager | None as Notification Center recipients | Training/complaint final decisions use `APPROVE_*` permission; complaint owner-only rule remains. No named training manager assignment is stored. |
| Authorizer / approval permission holder | None as Notification Center queue recipients | Permission-gated authorization queues are already available in Authorization Center. `ACTOR_QUEUE`/`BROADCAST` exist in model vocabulary, but there is no Phase 3–5 workflow notification delivery for them. Determine actual assigned approver from each module before proposing direct notification. |
| Super Administrator | No special broadcast | Admin role alone is not a business reason to receive feature notifications. Existing category eligibility is permission-based; do not infer super-admin fan-out. |

Preferences are centrally enforced by notification category and user; employee-facing categories and permission-eligible categories are returned by the backend. New role notifications should use the correct existing category and recipient entitlement, and must not bypass preferences.

## Future feature compatibility

The existing root backend `AGENTS.md` makes notification assessment mandatory for every new workflow and directs agents to `docs/NOTIFICATIONS.md`. The permanent standard there requires discovering transitions, recipients, dispatch timing, copy/privacy, central event registry and service reuse, after-commit safety, delivery-failure isolation, tests, and reporting exclusions. That is an adequate architectural baseline for future Staff Movement and Disciplinary work; this map should be consulted during their discovery. Before implementation, each new event still needs a strict event schema, recipient source, permission/ownership analysis, preference category, dispatch/dedupe tests, and a documentation update. It must not be documented as implemented before dispatch code exists.

## D1–D7 preservation and Phase 6 boundary

- **D1:** UTC timestamps, `Africa/Lagos` display, `DD/MM/YYYY` dates.
- **D2:** notify reliever on leave approval; named person is the employee going on leave, reliever is recipient.
- **D3:** complaints remains the sixth original category (`COMPLAINT`); never expose complaint identity/details.
- **D4:** supervisor and HR delivery was deferred until Employee Hub sign-off. Sign-off is complete, so the deferred scope can now be addressed through Phase 6 discovery; no such role notifications are implemented by that milestone alone.
- **D5:** loan approval is when status reaches `PENDING_DISBURSEMENT`; copy must say approved, not paid/disbursed.
- **D6:** TEAM training events go only to the original request submitter among employee recipients.
- **D7:** use minimal stale/competing decision safeguards; no broad concurrency redesign without approval.

The exact permitted supervisors, HR recipients, authorizers, message content and any complaint exception require event-by-event review. There is no approval here for broad recipient fan-out or modifying existing recipients.
