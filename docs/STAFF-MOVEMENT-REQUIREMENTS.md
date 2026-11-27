# Orbit360 HRIS – Staff Movement Module

## Product Requirements Document (PRD)

The Staff Movement Module should manage the entire lifecycle of employee transfers from one department, unit, branch, business location or subsidiary to another, from initiation and approval to documentation and automatic updating of employee records.

The module should be designed around proper authorization, workforce planning, segregation of duties, accountability and audit trail management.

## 1. Who should initiate staff movement?

Orbit360 should not restrict staff movement initiation to the HR department alone. There should be four possible initiation channels, depending on the circumstances surrounding the movement.

| Initiator | Reason for initiation |
|---|---|
| Receiving Head of Department | Requires an employee from another department to fill a manpower or competency gap. |
| Current Head of Department | Recommends an employee for redeployment or transfer. |
| HR Officer | Initiates movement based on workforce planning, restructuring, job rotation or management directives. |
| Employee | Requests a voluntary transfer to another department, branch or location. |

Executive management should also be able to direct staff movement through HR.

Regardless of who initiates the movement, HR should coordinate the process, and the Head of HR should be the final approving authority for routine staff movements, subject to the organization's approval matrix.

## 2. Stakeholders and responsibilities

| Stakeholder | Responsibility |
|---|---|
| Employee | Initiates voluntary requests, receives notifications and acknowledges movement. |
| Current HOD | Reviews the release of the employee and provides handover requirements. |
| Receiving HOD | Confirms manpower requirements, role availability and acceptance. |
| HR Officer | Validates the request, coordinates the movement and prepares documentation. |
| Head of HR | Reviews and approves staff movement. |
| Executive Management | Approves exceptional or strategic movements where required. |
| IT Department | Updates system access and permissions. |
| Payroll Officer | Implements approved compensation or allowance changes where applicable. |
| Administration | Coordinates workspace, equipment and logistics. |

## 3. Types of staff movement

Orbit360 should allow the organization to configure different movement categories.

**Interdepartmental transfer**

Movement between departments.

**Interbranch transfer**

Movement between branches.

**Location transfer**

Movement to another geographical location.

**Job rotation**

Temporary movement for competency development.

**Redeployment**

Movement based on organizational requirements.

**Secondment**

Temporary assignment to another business unit.

**Promotion-related movement**

Transfer associated with a higher role.

**Intragroup transfer**

Movement between subsidiaries or legal entities.

Intragroup transfers involving a change of legal employer should have additional contractual, payroll and statutory checks.

## 4. Recommended staff movement process flow

Where an HOD initiates a request, the system should capture their departmental endorsement at submission rather than requiring them to approve the same request twice.

## 5. Detailed system workflow

### Stage 1: Initiation of staff movement

The authorized initiator logs into Orbit360 and navigates to:

Staff Movement → Initiate New Movement

The system displays a Staff Movement Request Form containing the following information.

| Field | Field type |
|---|---|
| Movement reference number | Automatically generated |
| Employee name | Searchable dropdown |
| Employee ID | Automatically populated |
| Current department | Automatically populated |
| Current designation | Automatically populated |
| Current grade | Automatically populated |
| Current branch/location | Automatically populated |
| Current reporting manager | Automatically populated |
| Movement type | Dropdown |
| Proposed department | Dropdown |
| Proposed designation | Dropdown |
| Proposed reporting manager | Dropdown |
| Proposed branch/location | Dropdown |
| Proposed grade | Dropdown |
| Movement duration | Permanent or temporary |
| Proposed effective date | Date picker |
| End date for temporary movement | Conditional date picker |
| Reason for movement | Text field |
| Business justification | Detailed text field |
| Replacement required | Yes/No |
| Compensation implication | Yes/No |
| Supporting documents | File upload |

Upon submission, the system generates a unique reference number, for example:

ORB/SM/2026/0001

The request is forwarded to the assigned HR Officer.

### Stage 2: HR Officer preliminary review

The HR Officer receives a notification that a staff movement request has been initiated.

The HR Officer should be able to verify:

- Employee eligibility and employment status.
- Availability of an approved position in the receiving department.
- Approved departmental headcount.
- Employee competencies and qualifications.
- Existing pending movement requests.
- Potential compensation and grade implications.
- Compliance with the organization's staff movement policy.

The HR Officer can forward the request, return it for correction or decline it with documented reasons, subject to assigned authority.

### Stage 3: Current HOD review

The current Head of Department receives the movement request for review.

The HOD should provide information regarding:

- Whether the employee can be released.
- Earliest possible release date.
- Outstanding assignments and responsibilities.
- Whether a replacement is required.
- Proposed handover arrangements.
- Operational risks associated with the transfer.
- Additional comments or objections.

Available system actions:

- Endorse release.
- Conditional release.
- Object to release.

An objection from the current HOD should not necessarily terminate the request. HR should be able to escalate the matter to the Head of HR or management for resolution.

This prevents departmental heads from indefinitely obstructing legitimate organizational redeployment.

### Stage 4: Receiving HOD acceptance

The receiving Head of Department reviews the proposed movement and confirms:

- Acceptance of the employee.
- Availability of the proposed position.
- Proposed job description.
- Reporting structure.
- Required competencies.
- Resumption date.
- Departmental cost centre.
- Proposed KPIs and performance expectations.
- Training and onboarding requirements.

The receiving HOD can accept, request modifications or decline with reasons.

### Stage 5: HR Officer final recommendation

After receiving the departmental endorsements, the HR Officer prepares the final movement recommendation.

The system should display a consolidated view of the entire request, including all comments, proposed changes, objections and supporting documentation.

The HR Officer confirms the final movement details, including:

- Approved proposed department and designation.
- Effective date.
- Grade and compensation implications.
- Reporting manager.
- Handover deadline.
- Movement conditions.
- HR recommendation.

The request is then submitted to the Head of HR for approval.

### Stage 6: Head of HR approval

The Head of HR should have access to the complete request history and all stakeholder recommendations.

The available actions should include:

| Action | System behaviour |
|---|---|
| Approve | Proceeds to movement documentation. |
| Reject | Closes the request and notifies stakeholders. |
| Return for amendment | Returns to the HR Officer for correction. |
| Request clarification | Requests additional information. |
| Escalate to management | Routes to the designated executive approver. |

Executive management approval should be configurable for movements involving senior management, changes in grade, significant salary adjustments, intercompany transfers or exceptions to established policy.

### Stage 7: Automatic generation of staff movement letter

Once all required approvals have been obtained, Orbit360 should automatically generate a Staff Movement Letter using the organization's approved letter template.

The letter should contain:

- Employee name and ID.
- Current and new department.
- Current and new designation.
- New reporting manager.
- Effective date.
- Handover requirements.
- Applicable movement conditions.
- Authorized signatory.
- Movement reference number.

The approved letter should automatically be stored in the employee's electronic personnel file and made available on the employee self-service portal.

### Stage 8: Employee notification and acknowledgement

The employee receives an in-app notification and, where configured, an email notification.

The employee logs into:

Employee Portal → Staff Movement → Incoming Movement

The employee can view the movement details, download the letter, acknowledge receipt and submit comments or concerns.

Acknowledgement should not automatically be interpreted as consent to changes in contractual employment terms. Where consent is required, the system should capture it separately.

### Stage 9: Handover and clearance

Orbit360 should automatically generate a movement clearance checklist.

**Sample movement clearance checklist**

0 of 6 completed.

| Stakeholder | Clearance task |
|---|---|
| Current HOD | Confirm completion of departmental handover. |
| Receiving HOD | Confirm readiness to receive employee. |
| IT Department | Prepare changes to system access and permissions. |
| Administration | Confirm workspace and equipment readiness. |
| Payroll Officer | Validate applicable compensation changes. |
| HR Officer | Confirm documentation and outstanding requirements. |

Implementation readiness: Clearance pending.

Each stakeholder should be able to complete their assigned clearance task independently. Mandatory outstanding clearances should prevent implementation or trigger an authorized exception process.

### Stage 10: Automatic implementation on the effective date

This is one of the most important features of the module.

Approval of staff movement should not immediately change the employee's departmental information unless the effective date is immediate.

For example, if a movement is approved on 25 November but takes effect on 1 December, Orbit360 should retain the current employee assignment until 1 December.

On the effective date, provided all mandatory requirements have been satisfied, the system should automatically update the relevant employee records.

| Orbit360 module | Automatic action |
|---|---|
| Employee Master Record | Update department, designation and location. |
| Organizational Structure | Move employee to the new reporting hierarchy. |
| Job Description | Assign the approved job description. |
| KPI Management | Assign new KPIs and preserve previous KPI records. |
| Performance Management | Update appraiser and preserve previous appraisals. |
| Payroll | Apply separately authorized compensation and cost centre changes. |
| Leave Management | Update leave approval hierarchy. |
| User Management | Update authorized role-based access permissions. |
| Staff Movement | Record completed movement history. |
| Notification Center | Notify all relevant stakeholders. |
| Document Management | Archive movement letter and approval records. |
| Learning and Development | Assign relevant training requirements. |

This integration is particularly important given the existing and planned modules within Orbit360.

## 6. Staff movement status tracking

Every request should have a clearly identifiable status.

The following status labels are proposed based on the meanings in the original requirements. Final technical status names should be established in the implementation specification.

| Status | Meaning |
|---|---|
| Draft | Request has not been submitted. |
| Submitted | Request has been initiated. |
| Pending HR Validation | Awaiting preliminary validation. |
| Pending Current HOD Review | Awaiting current department review. |
| Pending Receiving HOD Review | Awaiting receiving department review. |
| Pending Final HR Review | Awaiting final HR review. |
| Pending Final Approval | Awaiting final approving authority. |
| Approved | All required approvals obtained. |
| Pending Employee Acknowledgement | Employee has not acknowledged receipt. |
| Pending Clearance | Outstanding handover requirements. |
| Scheduled | Awaiting effective date. |
| Completed | Movement successfully implemented. |
| Rejected | Request declined. |
| Cancelled | Request withdrawn or cancelled. |
| Implementation Failed | System update requires intervention. |

## 7. Staff Movement Dashboard

The corporate HR portal should have a dedicated Staff Movement Dashboard.

### Staff Movement Overview

Illustrative dashboard — sample data only.

| Metric | Sample value |
|---|---:|
| Total requests | 48 |
| Pending approvals | 12 |
| Approved / Scheduled | 8 |
| Completed movements | 24 |
| Rejected requests | 4 |
| Overdue actions | 3 |

### Movements by type

| Movement type | Sample value |
|---|---:|
| Interdepartmental | 20 |
| Interbranch | 12 |
| Redeployment | 8 |
| Job rotation | 5 |
| Secondment | 3 |

The dashboard should support filtering by employee, department, subsidiary, branch, movement type, status, initiator, effective date and approving authority.

## 8. Employee self-service staff movement features

Under the employee portal, the Staff Movement menu should contain the following submenus.

| Submenu | Function |
|---|---|
| Request Staff Movement | Submit voluntary transfer requests. |
| My Movement Requests | Track submitted requests. |
| Incoming Movement | View management-initiated transfers. |
| Movement Letters | View and download approved letters. |
| Handover Checklist | Complete assigned handover responsibilities. |
| Movement History | View historical departmental and location movements. |
| Notifications | Receive movement-related updates. |

Employees should only have access to their own movement records.

## 9. Employee movement history

Orbit360 should maintain a permanent historical record of every completed movement.

### Employee Career Movement History

Illustrative employee record: EMP-0042.

**10 January 2022**

Operations Department

Operations Officer — Initial employment

**1 March 2024**

Internal Control Department

Internal Control Officer — Interdepartmental transfer

**1 June 2025**

Risk Management Department

Risk Analyst — Redeployment

**1 December 2026**

Human Resources Department

HR Risk and Compliance Officer — Transfer

Current assignment in example.

Historical records must not be overwritten whenever an employee moves to another department. Every assignment should have a start date and an end date.

## 10. Internal controls and risk management

To make Orbit360 suitable for corporate organizations, the following controls should be mandatory.

| Control | Requirement |
|---|---|
| Maker-checker control | An initiator cannot independently give final approval to their own request. |
| Role-based access | Users can only perform authorized actions. |
| Audit trail | Record every action, comment, timestamp and change. |
| Duplicate prevention | Prevent conflicting active movement requests for the same employee. |
| Headcount validation | Check approved manpower requirements. |
| Effective date control | Prevent premature implementation. |
| Historical data preservation | Preserve previous assignments, KPIs and appraisals. |
| Approval delegation | Support authorized acting HODs and HR approvers. |
| Escalation management | Escalate requests exceeding defined turnaround times. |
| Data confidentiality | Restrict sensitive movement and compensation information. |
| Reversal control | Require formal approval to reverse completed movements. |
| Implementation integrity | Prevent partial or inconsistent updates across modules. |
| Temporary movement expiry | Trigger review or authorized return at the end of secondment or rotation. |
| Material amendment control | Require renewed approval when approved movement details are materially changed. |

## 11. Automatic notifications

The Staff Movement Module should integrate directly with the Orbit360 Notification Center.

| Trigger | Recipient |
|---|---|
| New request submitted | HR Officer |
| Request validated | Current HOD |
| Release endorsed | Receiving HOD |
| Departmental reviews completed | HR Officer |
| Final recommendation submitted | Head of HR |
| Movement approved | Employee and relevant HODs |
| Movement letter generated | Employee |
| Clearance tasks assigned | Relevant stakeholders |
| Effective date approaching | Employee, HR and both HODs |
| Approval overdue | Approver and designated escalation authority |
| Movement implemented | All relevant stakeholders |
| Temporary movement approaching expiry | HR Officer and relevant HODs |

## 12. Staff movement reports

The module should generate reports covering:

- Monthly and annual staff movements.
- Departmental inflow and outflow.
- Interbranch and intercompany transfers.
- Employee career movement history.
- Pending and overdue approvals.
- Average movement processing turnaround time.
- Staff movement by grade and designation.
- Voluntary versus management-initiated transfers.
- Movement-related compensation adjustments.
- Temporary assignments and secondment expiry.
- Departmental headcount before and after movement.
- Rejected movement requests and reasons.

Reports should be exportable to Excel and PDF.

## 13. Recommended Orbit360 menu structure

### Corporate HR Portal

Staff Movement

- Movement Dashboard
- Initiate Staff Movement
- All Movement Requests
- My Pending Approvals
- Approved Movements
- Scheduled Movements
- Handover & Clearance
- Completed Movements
- Movement History
- Reports & Analytics
- Movement Configuration

### Employee Self-Service Portal

Staff Movement

- Request Staff Movement
- My Movement Requests
- Incoming Movement
- Movement Letters
- Handover Checklist
- My Movement History

## 14. Configurable approval matrix

Rather than hard-coding the approval process, Orbit360 should support a configurable workflow engine.

Different client organizations will have different approval hierarchies.

| Movement category | Recommended approval authority |
|---|---|
| Routine interdepartmental transfer | Head of HR |
| Interbranch transfer | Head of HR |
| Employee-requested transfer | Head of HR |
| Temporary job rotation | Head of HR |
| Transfer with salary increase | Head of HR and designated financial or executive approver |
| Senior management transfer | MD/CEO or designated authority |
| Intercompany transfer | Relevant executive authorities |
| Exceptional redeployment | Head of HR and Executive Management |

The approval matrix should allow administrators to configure approval levels, mandatory stakeholders, turnaround times, escalation rules and movement categories without modifying the application's source code.

## 15. Final recommendation for Orbit360

The Staff Movement Module should be built around five fundamental principles:

**Decentralized initiation:** Employees, departmental heads and HR can initiate appropriate movement requests.

**Centralized HR coordination:** HR validates and coordinates every formal movement.

**Departmental consultation:** Both releasing and receiving departments participate in the decision.

**Controlled approval:** The Head of HR or designated executive authorizes the movement.

**Automated implementation:** Orbit360 updates all relevant modules on the approved effective date while preserving historical records.

The proposed approval hierarchy assumes that the Head of HR has delegated authority over routine staff transfers. Since client organizations may operate differently, this should be a configurable default rather than a fixed system rule.

Ultimately, the Staff Movement Module should not simply be a transfer request and approval feature. It should function as an enterprise workforce mobility management system, fully integrated with employee records, organizational structure, performance management, payroll, access management and workforce planning.
