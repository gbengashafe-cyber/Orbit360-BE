# All CREATE Endpoints with Request Bodies

---

## 1. Authentication - Google Callback

**POST** `/api/auth/google/callback`

```json
{
  "code": "google_auth_code",
  "redirectUri": "http://localhost:3000/callback"
}
```

---

## 2. Users - Create User

**POST** `/api/v1/users`
_Requires: Authentication + ADMIN permission_

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "position": "Software Engineer",
  "department": "Engineering"
}
```

---

## 3. Employees - Create Employee

**POST** `/api/v1/employees`
_Requires: Authentication + MANAGE_EMPLOYEES permission + HR department_

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "employeeId": "EMP002",
  "phone": "+1234567890",
  "hireDate": "2024-01-15",
  "departmentName": "Engineering",
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

---

## 4. Companies - Create Company

**POST** `/api/v1/companies`
_Requires: Authentication + ADMIN permission_

```json
{
  "name": "Orbit360 Tech",
  "description": "Human Resources Management Company"
}
```

---

## 5. Departments - Create Department

**POST** `/api/v1/departments`
_Requires: Valid companyId_

```json
{
  "name": "Engineering",
  "description": "Software and Systems Engineering Department",
  "companyId": 1
}
```

---

## 6. Job Roles - Create Job Role

**POST** `/api/v1/job-roles`
_Requires: Authentication_

```json
{
  "title": "Senior Developer",
  "description": "Senior software developer position"
}
```

---

## 7. Positions - Create Position

**POST** `/api/v1/positions`

```json
{
  "title": "Senior Software Engineer",
  "description": "Lead software development initiatives and mentor junior developers"
}
```

---

## 8. Leaves - Create Leave

**POST** `/api/v1/leaves`
_Requires: Authentication_

```json
{
  "employeeId": 1,
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "type": "vacation",
  "reason": "Family vacation"
}
```

**Date Format:** `YYYY-MM-DD` (also accepts ISO 8601: `2024-02-15T00:00:00Z`)

**Leave Type Options:**

- `sick`
- `vacation`
- `personal`
- `maternity`
- `paternity`

---

## 8a. Employees - Get Employee Information (with Leave Balance)

**GET** `/api/v1/employees/{id}`
_Requires: Authentication_

### Response Example:

```json
{
  "data": {
    "id": 1,
    "employeeId": "EMP001",
    "firstName": "Zebedee",
    "lastName": "Zoe",
    "email": "zebedee.zoe@example.com",
    "phone": "+1234567890",
    "dob": "1990-05-20",
    "gender": "M",
    "nationality": "Nigerian",
    "address": "123 Main Street, Lagos, NG",
    "hireDate": "2023-01-15",
    "departmentName": "General",
    "jobRole": "Manager",
    "status": "active",
    "annualLeaveAllowance": 21,
    "leaveEntitlement": 21,
    "supervisorId": null,
    "supervisor_name": "N/A"
  },
  "message": "Employee fetched successfully"
}
```

### Usage in Leave Request Form:

This endpoint is called to pre-populate employee information in the leave request form:

- **Full Name:** `{firstName} {lastName}`
- **Employee ID:** `{employeeId}`
- **Department:** `{departmentName}`
- **Supervisor:** `{supervisor_name}`
- **Leave Entitlement:** `{leaveEntitlement}` (used to calculate balance)

---

## 8b. Leaves - Get Employee Leave Balance

**GET** `/api/v1/leaves/balance/{employeeId}`
_Requires: Authentication_

### Query Parameters:

- `year` (optional): Specific year to fetch balance. Defaults to current year.

### Response Example:

```json
{
  "data": [
    {
      "id": 1,
      "employeeId": 1,
      "leaveType": "vacation",
      "allocated": 21,
      "used": 0,
      "remaining": 21,
      "year": 2024
    },
    {
      "id": 2,
      "employeeId": 1,
      "leaveType": "sick",
      "allocated": 10,
      "used": 2,
      "remaining": 8,
      "year": 2024
    }
  ],
  "message": "Leave balance fetched successfully"
}
```

### Usage in Leave Request Form:

This endpoint provides the breakdown of leave balances by type:

- **Total Annual Leave Balance:** Sum of `remaining` for `leaveType: 'vacation'`
- **Display:** "Your current annual leave balance is {remaining} days"
- **Validation:** Prevent leave request if `requested_days > remaining`

---

## 8c. Employees - Get All Employees (for Supervisor/Backup Selection)

**GET** `/api/v1/employees?page=1&rows=100`
_Requires: Authentication_

### Response Example:

```json
{
  "data": [
    {
      "id": 1,
      "firstName": "Zebedee",
      "lastName": "Zoe",
      "employeeId": "EMP001",
      "email": "zebedee.zoe@example.com",
      "departmentName": "General",
      "jobRole": "Manager",
      "status": "active"
    },
    {
      "id": 2,
      "firstName": "Jane",
      "lastName": "Smith",
      "employeeId": "EMP002",
      "email": "jane.smith@example.com",
      "departmentName": "Engineering",
      "jobRole": "Developer",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "rows": 100,
    "pages": 1
  },
  "message": "Employees fetched successfully"
}
```

### Usage in Leave Request Form:

This endpoint is used to populate dropdown lists:

- **Approving Supervisor Dropdown:** List all employees with `{firstName} {lastName} - {jobRole}`
- **Backup/Reliever Dropdown:** List all employees with `{firstName} {lastName} - {departmentName}`
- **Filter:** Only show `active` status employees

---

## 9. Exits - Create Exit

**POST** `/api/v1/exits`
_Requires: Authentication_

```json
{
  "employeeId": 1,
  "exitType": "resignation",
  "exitDate": "2024-03-31",
  "reason": "Personal reasons"
}
```

**Exit Type Options:**

- `resignation`
- `termination`
- `retirement`
- `contract_end`

---

## 10. Onboarding - Create Onboarding

**POST** `/api/v1/onboardings`
_Requires: Authentication + MANAGE_ONBOARDING permission + HR department_

```json
{
  "employeeId": 3,
  "documentType": "Contract",
  "documentName": "Employment Agreement",
  "documentUrl": "https://example.com/documents/contract.pdf"
}
```

**Note:** `employeeId` must be the numeric `id` from the employee, NOT the string `employeeId` (e.g., use `3` not `"EMP002"`)

---

## 11. Payroll - Generate Payroll

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

---

## 12. Deductions - Create Deduction

**POST** `/api/v1/deductions`
_Requires: Authentication + MANAGE_PAYROLL permission + HR department_

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

---

## 13. Loans - Create Loan

**POST** `/api/v1/loans`
_Requires: Authentication + MANAGE_LOANS permission + HR department_

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

**Loan Type Options:**

- `PERSONAL`
- `VEHICLE`
- `HOUSING`
- `EMERGENCY`

---

## 14. Complaints - Create Complaint

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

**Complaint Type Options:**

- `harassment`
- `discrimination`
- `safety`
- `wage_dispute`
- `working_conditions`
- `other`

**Severity Options:**

- `low`
- `medium`
- `high`
- `critical`

---

## 15. Performance - Create Goal

**POST** `/api/v1/performance/goals`

```json
{
  "employee_id": 1,
  "title": "Improve Code Quality",
  "description": "Reduce code defects by implementing comprehensive unit testing across all modules",
  "target_value": 95,
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "assigned_by": "Manager Name"
}
```

**Date Format:** `YYYY-MM-DD` (or ISO 8601: `2024-01-01T14:00:00Z`)

---

## 16. Performance - Create Appraisal Cycle

**POST** `/api/v1/performance/cycles`

```json
{
  "cycle_name": "Annual Performance Review 2024",
  "description": "Comprehensive annual performance appraisal cycle",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "review_deadline": "2024-12-15",
  "created_by": "HR Admin",
  "department": "Engineering"
}
```

**Date Format:** `YYYY-MM-DD` (or ISO 8601: `2024-01-01T14:00:00Z`)

---

## 17. Performance - Submit Appraisal

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

---

## 18. Recruitment - Create Job Posting

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

**Employment Type Options:**

- `full_time`
- `part_time`
- `contract`
- `temporary`

---

## 19. Recruitment - Submit Job Application

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

---

## Testing Checklist

Create endpoints in this order:

1. ✓ Create Company
2. ✓ Create Department
3. ✓ Create Job Role
4. ✓ Create Position
5. ✓ Create User
6. ✓ Create Employee
7. ✓ Create Leave Request
8. ✓ Create Exit Record
9. ✓ Create Onboarding Document
10. ✓ Create Loan
11. ✓ Create Deduction
12. ✓ Generate Payroll
13. ✓ Create Complaint
14. ✓ Create Performance Goal
15. ✓ Create Appraisal Cycle
16. ✓ Submit Appraisal
17. ✓ Create Job Posting
18. ✓ Approve Job Posting (for Managing Directors)
19. ✓ Submit Job Application
