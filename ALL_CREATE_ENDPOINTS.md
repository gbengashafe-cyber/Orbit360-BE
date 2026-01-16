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
*Requires: Authentication + ADMIN permission*

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
*Requires: Authentication + MANAGE_EMPLOYEES permission + HR department*

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "employeeId": "EMP001",
  "phone": "+1234567890",
  "hireDate": "2024-01-15",
  "departmentName": "Engineering",
  "supervisorId": null,
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
  "otherAllowance": 5000,
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

## 4. Departments - Create Department
**POST** `/api/v1/departments`

```json
{
  "name": "Engineering",
  "description": "Software and Systems Engineering Department",
  "companyId": 1
}
```

---

## 5. Positions - Create Position
**POST** `/api/v1/positions`

```json
{
  "title": "Senior Software Engineer",
  "description": "Lead software development initiatives and mentor junior developers"
}
```

---

## 6. Companies - Create Company
**POST** `/api/v1/companies`
*Requires: Authentication + ADMIN permission*

```json
{
  "name": "Orbit360 Tech",
  "description": "Human Resources Management Company"
}
```

---

## 7. Leaves - Create Leave
**POST** `/api/v1/leaves`
*Requires: Authentication*

```json
{
  "employeeId": 1,
  "startDate": "2024-02-15T00:00:00Z",
  "endDate": "2024-02-20T23:59:59Z",
  "type": "vacation",
  "reason": "Family vacation"
}
```

**Leave Type Options:**
- `sick`
- `vacation`
- `personal`
- `maternity`
- `paternity`

---

## 8. Exits - Create Exit
**POST** `/api/v1/exits`
*Requires: Authentication*

```json
{
  "employeeId": 1,
  "exitType": "resignation",
  "exitDate": "2024-03-31T00:00:00Z",
  "reason": "Personal reasons"
}
```

**Exit Type Options:**
- `resignation`
- `termination`
- `retirement`
- `contract_end`

---

## 9. Onboarding - Create Onboarding
**POST** `/api/v1/onboardings`
*Requires: Authentication + MANAGE_ONBOARDING permission + HR department*

```json
{
  "employeeId": 1,
  "documentType": "Contract",
  "documentName": "Employment Agreement",
  "documentUrl": "https://example.com/documents/contract.pdf",
  "notes": "Standard employment contract"
}
```

---

## 10. Payroll - Generate Payroll
**POST** `/api/v1/payrolls`
*Requires: Authentication + MANAGE_PAYROLL permission + HR department*

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

## 11. Deductions - Create Deduction
**POST** `/api/v1/deductions`
*Requires: Authentication + MANAGE_PAYROLL permission + HR department*

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

## 12. Loans - Create Loan
**POST** `/api/v1/loans`
*Requires: Authentication + MANAGE_LOAN permission + HR department*

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

## 13. Complaints - Create Complaint
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

## 14. Performance - Create Goal
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

---

## 15. Performance - Create Appraisal Cycle
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

---

## 16. Performance - Submit Appraisal
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

## 17. Recruitment - Create Job Posting
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

## 18. Recruitment - Submit Job Application
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
3. ✓ Create Position
4. ✓ Create User
5. ✓ Create Employee
6. ✓ Create Leave Request
7. ✓ Create Exit Record
8. ✓ Create Onboarding Document
9. ✓ Create Loan
10. ✓ Create Deduction
11. ✓ Generate Payroll
12. ✓ Create Complaint
13. ✓ Create Performance Goal
14. ✓ Create Appraisal Cycle
15. ✓ Submit Appraisal
16. ✓ Create Job Posting
17. ✓ Submit Job Application
