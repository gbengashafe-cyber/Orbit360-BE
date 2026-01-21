# Complete API Endpoints Reference - Orbit360 HR

---

# Authentication

**Base URL:** `http://localhost:3000/api/auth`

## Google Callback

**POST** `/api/auth/google/callback`

```json
{
  "code": "google_auth_code",
  "redirectUri": "http://localhost:3000/callback"
}
```

## Get Current User

**GET** `/api/auth/me`

## Logout

**POST** `/api/auth/logout`

---

# Users

**Base URL:** `http://localhost:3000/api/v1/users`
_Requires: Authentication + ADMIN permission_

## Create User

**POST** `/api/v1/users`

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "position": "Software Engineer",
  "department": "Engineering"
}
```

## Get All Users

**GET** `/api/v1/users`

## Get User by ID

**GET** `/api/v1/users/1`

## Update User

**PUT** `/api/v1/users/1`

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "position": "Senior Software Engineer",
  "department": "Engineering",
  "status": "active"
}
```

---

# Employees

**Base URL:** `http://localhost:3000/api/v1/employees`
_Requires: Authentication + MANAGE_EMPLOYEES permission + HR department_

## Create Employee

**POST** `/api/v1/employees`

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "employeeId": "EMP001",
  "phone": "+1234567890",
  "hireDate": "2024-01-15",
  "departmentName": "Engineering",
  "supervisorId": "1",
  "position": "Senior Developer",
  "dob": "1990-05-20",
  "gender": "F",
  "nationality": "Nigeria",
  "address": "123 Main Street, New York, NY",
  "bankName": "First Bank",
  "bankCode": "011",
  "accountNumber": "0123456789",
  "accountName": "Jane Smith",
  "nhfApplicable": true,
  "annualBasicSalary": 120000,
  "annualHousingAllowance": 24000,
  "annualTransportAllowance": 12000,
  "annualLeaveAllowance": 6000,
  "annualOtherAllowances": 5000,
  "beneficiaryName": "John Smith",
  "beneficiaryRelationship": "Brother",
  "beneficiaryPhone": "+9876543210",
  "nokName": "Mary Smith",
  "nokRelationship": "Mother",
  "nokPhone": "+1111111111",
  "leaveEntitlement": 21
}
```

## Get All Employees

**GET** `/api/v1/employees`

## Get Employee by ID

**GET** `/api/v1/employees/1`

## Update Employee

**PUT** `/api/v1/employees/1`

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "annualBasicSalary": 130000,
  "status": "active"
}
```

---

# Departments

**Base URL:** `http://localhost:3000/api/v1/departments`

## Create Department

**POST** `/api/v1/departments`

```json
{
  "name": "Engineering",
  "description": "Software and Systems Engineering Department",
  "companyId": 1
}
```

## Get All Departments

**GET** `/api/v1/departments`

## Get Department by ID

**GET** `/api/v1/departments/1`

## Update Department

**PUT** `/api/v1/departments/1`

```json
{
  "name": "Engineering",
  "description": "Software, Systems and DevOps Engineering"
}
```

## Delete Department

**DELETE** `/api/v1/departments/1`

---

# Positions

**Base URL:** `http://localhost:3000/api/v1/positions`

## Create Position

**POST** `/api/v1/positions`

```json
{
  "title": "Senior Software Engineer",
  "description": "Lead software development initiatives and mentor junior developers"
}
```

## Get All Positions

**GET** `/api/v1/positions`

## Get Position by ID

**GET** `/api/v1/positions/1`

## Update Position

**PUT** `/api/v1/positions/1`

```json
{
  "title": "Senior Software Engineer",
  "description": "Lead full-stack development and architect scalable systems"
}
```

## Delete Position

**DELETE** `/api/v1/positions/1`

---

# Companies

**Base URL:** `http://localhost:3000/api/v1/companies`
_Requires: Authentication + ADMIN permission_

## Create Company

**POST** `/api/v1/companies`

```json
{
  "name": "Orbit360 Tech",
  "description": "Human Resources Management Company"
}
```

## Get All Companies

**GET** `/api/v1/companies`

## Get Company by ID

**GET** `/api/v1/companies/1`

## Update Company

**PUT** `/api/v1/companies/1`

```json
{
  "name": "Orbit360 Tech Solutions",
  "description": "Leading HR Management and Talent Solutions Company"
}
```

## Delete Company

**DELETE** `/api/v1/companies/1`

---

# Leaves

**Base URL:** `http://localhost:3000/api/v1/leaves`
_Requires: Authentication_

## Create Leave

**POST** `/api/v1/leaves`

```json
{
  "employeeId": 1,
  "startDate": "2024-02-15T00:00:00Z",
  "endDate": "2024-02-20T23:59:59Z",
  "type": "vacation",
  "reason": "Family vacation"
}
```

**Leave Type Options:** `sick`, `vacation`, `personal`, `maternity`, `paternity`

## Get All Leaves

**GET** `/api/v1/leaves?page=1&rows=10`
_Requires: HR department + MANAGE_LEAVES permission_

## Get Leave by Employee

**GET** `/api/v1/leaves/employee/1`

## Get Leave Types

**GET** `/api/v1/leaves/types`

## Get Leave Balance

**GET** `/api/v1/leaves/balance/1`

## Get Leave by ID

**GET** `/api/v1/leaves/1`

## Approve/Decline Leave

**PATCH** `/api/v1/leaves/1/status`
_Requires: HR department + APPROVE_LEAVES permission_

```json
{
  "action": "approved"
}
```

**Action Options:** `approved`, `rejected`

## Cancel Leave

**DELETE** `/api/v1/leaves/1`

---

# Exits

**Base URL:** `http://localhost:3000/api/v1/exits`
_Requires: Authentication_

## Create Exit

**POST** `/api/v1/exits`

```json
{
  "employeeId": 1,
  "exitType": "resignation",
  "exitDate": "2024-03-31T00:00:00Z",
  "reason": "Personal reasons"
}
```

**Exit Type Options:** `resignation`, `termination`, `retirement`, `contract_end`

## Get All Exits

**GET** `/api/v1/exits`
_Requires: HR department + MANAGE_EXITS permission_

## Get Exit by Employee

**GET** `/api/v1/exits/employee/1`

## Get Exit by ID

**GET** `/api/v1/exits/1`

## Approve Exit

**PATCH** `/api/v1/exits/1/approve`
_Requires: HR department + APPROVE_EXITS permission_

```json
{
  "action": "approved"
}
```

**Action Options:** `approved`, `rejected`

---

# Onboarding

**Base URL:** `http://localhost:3000/api/v1/onboardings`
_Requires: Authentication_

## Create Onboarding

**POST** `/api/v1/onboardings`
_Requires: HR department + MANAGE_ONBOARDING permission_

```json
{
  "employeeId": 1,
  "documentType": "Contract",
  "documentName": "Employment Agreement",
  "documentUrl": "https://example.com/documents/contract.pdf",
  "notes": "Standard employment contract"
}
```

## Get All Onboarding

**GET** `/api/v1/onboardings`
_Requires: HR department + MANAGE_ONBOARDING permission_

## Get Onboarding by Employee

**GET** `/api/v1/onboardings/employee/1`

## Get Onboarding by ID

**GET** `/api/v1/onboardings/1`

## Update Onboarding

**PATCH** `/api/v1/onboardings/1`
_Requires: HR department + MANAGE_ONBOARDING permission_

```json
{
  "status": "approved",
  "documentUrl": "https://example.com/documents/contract-signed.pdf",
  "notes": "Contract approved and signed"
}
```

**Status Options:** `pending`, `submitted`, `approved`, `rejected`

---

# Payroll

**Base URL:** `http://localhost:3000/api/v1/payrolls`

## Generate Payroll

**POST** `/api/v1/payrolls`
_Requires: Authentication + MANAGE_PAYROLL permission + HR department_

```json
{
  "employee": 1,
  "month": 2,
  "year": 2024,
  "baseSalary": 10000,
  "allowances": 2000,
  "deductions": 1000
}
```

## Get All Payrolls

**GET** `/api/v1/payrolls`

## Get Payroll by Employee

**GET** `/api/v1/payrolls/employee/1`

## Get Payroll by ID

**GET** `/api/v1/payrolls/1`

## Get Payroll by Period

**GET** `/api/v1/payrolls/periods/2024-02`

## Update Payroll

**PUT** `/api/v1/payrolls/1`

```json
{
  "baseSalary": 11000,
  "allowances": 2200,
  "deductions": 1100
}
```

## Mark Payroll as Processed

**POST** `/api/v1/payrolls/1/process`

## Mark Payroll as Paid

**POST** `/api/v1/payrolls/1/pay`

## Delete Payroll

**DELETE** `/api/v1/payrolls/1`

---

# Deductions

**Base URL:** `http://localhost:3000/api/v1/deductions`
_Requires: Authentication + MANAGE_PAYROLL permission + HR department_

## Create Deduction

**POST** `/api/v1/deductions`

```json
{
  "name": "Pension Fund",
  "annualRate": 8.5,
  "isPercentage": true,
  "optionalFieldLink": "basic_salary",
  "compensationFields": "basicSalary",
  "isOptional": false
}
```

## Get All Deductions

**GET** `/api/v1/deductions`

## Get Deduction by ID

**GET** `/api/v1/deductions/1`

## Update Deduction

**PUT** `/api/v1/deductions/1`

```json
{
  "name": "Pension Fund",
  "annualRate": 9.0,
  "status": true
}
```

---

# Loans

**Base URL:** `http://localhost:3000/api/v1/loans`
_Requires: Authentication + MANAGE_LOANS permission + HR department_

## Create Loan

**POST** `/api/v1/loans`

```json
{
  "employeeId": 1,
  "loanType": "PERSONAL",
  "principalAmount": 50000,
  "interestRate": 12,
  "tenureMonths": 24,
  "startDate": "2024-02-01",
  "notes": "Personal loan for emergency"
}
```

**Loan Type Options:** `PERSONAL`, `VEHICLE`, `HOUSING`, `EMERGENCY`

## Get All Loans

**GET** `/api/v1/loans`

## Get Loan by ID

**GET** `/api/v1/loans/1`

## Update Loan

**PUT** `/api/v1/loans/1`

```json
{
  "interestRate": 11,
  "status": "active"
}
```

## Delete Loan

**DELETE** `/api/v1/loans/1`

---

# Complaints

**Base URL:** `http://localhost:3000/api/v1/complaints`

## Create Complaint

**POST** `/api/v1/complaints`

```json
{
  "employee_id": 1,
  "complaint_type": "harassment",
  "title": "Workplace Harassment Incident",
  "description": "Experienced unprofessional conduct from supervisor during team meeting",
  "severity": "high",
  "reported_to": "HR Manager"
}
```

**Complaint Type Options:** `harassment`, `discrimination`, `safety`, `wage_dispute`, `working_conditions`, `other`
**Severity Options:** `low`, `medium`, `high`, `critical`

## Get All Complaints

**GET** `/api/v1/complaints?page=1&rows=10`

## Get Complaint by ID

**GET** `/api/v1/complaints/1`

## Update Complaint

**PUT** `/api/v1/complaints/1`

```json
{
  "complaint_type": "discrimination",
  "title": "Workplace Discrimination",
  "severity": "critical",
  "status": "under_review"
}
```

**Status Options:** `open`, `under_review`, `resolved`, `closed`

## Resolve Complaint

**POST** `/api/v1/complaints/1/resolve`

```json
{
  "resolution_notes": "Issue resolved through HR mediation and employee counseling sessions"
}
```

## Close Complaint

**POST** `/api/v1/complaints/1/close`

## Delete Complaint

**DELETE** `/api/v1/complaints/1`

---

# Performance

**Base URL:** `http://localhost:3000/api/v1/performance`

## Get Performance Dashboard

**GET** `/api/v1/performance/dashboard`

---

## Goals

### Create Goal

**POST** `/api/v1/performance/goals`

```json
{
  "employee_id": 1,
  "title": "Improve Code Quality",
  "description": "Reduce code defects by implementing comprehensive unit testing across all modules",
  "target_value": 95,
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z",
  "assigned_by": "Manager Name"
}
```

### Get All Goals

**GET** `/api/v1/performance/goals`

### Get Goal by ID

**GET** `/api/v1/performance/goals/1`

### Update Goal

**PUT** `/api/v1/performance/goals/1`

```json
{
  "title": "Improve Code Quality and Test Coverage",
  "target_value": 98
}
```

### Update Goal Progress

**PATCH** `/api/v1/performance/goals/1/progress`

```json
{
  "current_progress": 75,
  "completion_percentage": 75,
  "status": "in_progress"
}
```

**Status Options:** `not_started`, `in_progress`, `completed`, `failed`, `on_hold`

### Delete Goal

**DELETE** `/api/v1/performance/goals/1`

---

## Appraisal Cycles

### Create Appraisal Cycle

**POST** `/api/v1/performance/cycles`

```json
{
  "cycle_name": "Annual Performance Review 2024",
  "description": "Comprehensive annual performance appraisal cycle",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z",
  "review_deadline": "2024-12-15T23:59:59Z",
  "created_by": "HR Admin",
  "department": "Engineering"
}
```

### Get All Cycles

**GET** `/api/v1/performance/cycles`

### Get Cycle by ID

**GET** `/api/v1/performance/cycles/1`

### Update Cycle

**PUT** `/api/v1/performance/cycles/1`

```json
{
  "cycle_name": "Annual Performance Review 2024 - Updated",
  "review_deadline": "2024-12-20T23:59:59Z"
}
```

### Activate Cycle

**POST** `/api/v1/performance/cycles/1/activate`

### Close Cycle

**POST** `/api/v1/performance/cycles/1/close`

---

## Appraisals

### Submit Appraisal

**POST** `/api/v1/performance/appraisals`

```json
{
  "appraisal_cycle_id": 1,
  "employee_id": 1,
  "manager_id": 2,
  "performance_summary": "Employee has shown excellent performance in delivering projects on time",
  "strengths": "Strong communication skills, excellent problem-solving abilities",
  "areas_for_improvement": "Time management in multitasking environments"
}
```

### Get All Appraisals

**GET** `/api/v1/performance/appraisals`

### Get Appraisal by ID

**GET** `/api/v1/performance/appraisals/1`

### Update Appraisal

**PUT** `/api/v1/performance/appraisals/1`

```json
{
  "performance_summary": "Exceptional performance this year",
  "strengths": "Leadership, teamwork, innovation",
  "areas_for_improvement": "Delegation"
}
```

### Submit for Review

**POST** `/api/v1/performance/appraisals/1/submit`

### Review Appraisal

**POST** `/api/v1/performance/appraisals/1/review`

```json
{
  "overall_rating": 4,
  "goals_achievement": 85
}
```

### Delete Appraisal

**DELETE** `/api/v1/performance/appraisals/1`

---

# Recruitment

**Base URL:** `http://localhost:3000/api/v1/recruitment`

## Dashboard Stats

**GET** `/api/v1/recruitment/dashboard/stats`

---

## Job Postings

### Create Job Posting

**POST** `/api/v1/recruitment/postings`

```json
{
  "title": "Senior Software Developer",
  "description": "We are looking for an experienced software developer with strong backend skills.",
  "department": "Engineering",
  "location": "New York",
  "employment_type": "full_time",
  "salary_range_min": 80000,
  "salary_range_max": 120000,
  "requirements": "5+ years experience, JavaScript, React, Node.js",
  "created_by": "hr@example.com"
}
```

**Employment Type Options:** `full_time`, `part_time`, `contract`, `temporary`

### Get All Job Postings

**GET** `/api/v1/recruitment/postings?page=1&rows=10&status=active`
**Query Parameters:**

- `page` (optional, default: 1)
- `rows` (optional, default: 10)
- `status` (optional: `draft`, `pending_approval`, `active`, `closed`, `rejected`, `on_hold`)

### Get Job Posting by ID

**GET** `/api/v1/recruitment/postings/1`

### Update Job Posting

**PUT** `/api/v1/recruitment/postings/1`

```json
{
  "title": "Senior Software Developer",
  "salary_range_min": 85000,
  "salary_range_max": 130000
}
```

### Approve Job Posting

**POST** `/api/v1/recruitment/postings/1/approve`
_MD only_

```json
{
  "approved_by": "md@example.com"
}
```

### Reject Job Posting

**POST** `/api/v1/recruitment/postings/1/reject`
_MD only_

### Close Job Role

**POST** `/api/v1/recruitment/postings/1/close`

### Delete Job Posting

**DELETE** `/api/v1/recruitment/postings/1`

---

## Job Applications

### Submit Job Application

**POST** `/api/v1/recruitment/applications`

```json
{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "+1234567890",
  "resume_url": "https://example.com/resumes/john-doe.pdf",
  "cover_letter": "I am interested in this position because I have strong backend experience with modern technologies."
}
```

### Get All Applications

**GET** `/api/v1/recruitment/applications?page=1&rows=10&status=applied&job_posting_id=1`
**Query Parameters:**

- `page` (optional)
- `rows` (optional)
- `status` (optional: `applied`, `under_review`, `interview_scheduled`, `interviewed`, `offered`, `hired`, `rejected`)
- `job_posting_id` (optional)

### Get Application by ID

**GET** `/api/v1/recruitment/applications/1`

### Get Applications by Job Posting

**GET** `/api/v1/recruitment/applications/by-posting/1?page=1&rows=10`

### Update Application Status

**PUT** `/api/v1/recruitment/applications/1/status`

```json
{
  "status": "under_review",
  "rating": 4,
  "interview_notes": "Promising candidate"
}
```

**Status Options:** `applied`, `under_review`, `interview_scheduled`, `interviewed`, `offered`, `hired`, `rejected`

### Schedule Interview

**POST** `/api/v1/recruitment/applications/1/schedule-interview`

```json
{
  "interview_date": "2024-02-15T14:00:00Z",
  "interview_notes": "Technical + HR round"
}
```

### Send Offer

**POST** `/api/v1/recruitment/applications/1/send-offer`

### Hire Applicant

**POST** `/api/v1/recruitment/applications/1/hire`

### Reject Applicant

**POST** `/api/v1/recruitment/applications/1/reject`

### Delete Application

**DELETE** `/api/v1/recruitment/applications/1`

---

# Health Check

**GET** `/api/health`

---

# API Documentation

**GET** `/api-docs` - View interactive Swagger documentation

---

## Application Workflow Examples

### Leave Request Workflow

1. Create Leave → GET Leave by Employee → Approve/Decline Leave → Cancel Leave

### Exit Process Workflow

1. Create Exit → GET Exit by Employee → Approve Exit

### Recruitment Workflow

1. Create Job Posting → Get All Postings → Approve Posting → Submit Application → Update Status → Schedule Interview → Send Offer → Hire → Dashboard Stats

### Performance Review Workflow

1. Create Goal → Update Progress → Create Appraisal Cycle → Activate Cycle → Submit Appraisal → Review Appraisal → Close Cycle

### Payroll Workflow

1. Create Deduction → Create Loan → Generate Payroll → Update Payroll → Process Payroll → Mark as Paid
