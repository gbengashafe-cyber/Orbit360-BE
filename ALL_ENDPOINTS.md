# All API Endpoints - Orbit360 HR

---

## Authentication
**Base URL:** `http://localhost:3000/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/google/callback` | Google OAuth callback |
| GET | `/me` | Get current user |
| POST | `/logout` | Logout user |

---

## Users
**Base URL:** `http://localhost:3000/api/v1/users`
*Requires: Authentication + ADMIN permission*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create user |
| GET | `/` | Get all users |
| GET | `/:id` | Get user by ID |
| PUT | `/:id` | Update user |

---

## Employees
**Base URL:** `http://localhost:3000/api/v1/employees`
*Requires: Authentication + MANAGE_EMPLOYEES permission + HR department*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all employees |
| GET | `/:id` | Get employee by ID |
| POST | `/` | Create employee |
| PUT | `/:id` | Update employee |

---

## Departments
**Base URL:** `http://localhost:3000/api/v1/departments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all departments |
| GET | `/:id` | Get department by ID |
| POST | `/` | Create department |
| PUT | `/:id` | Update department |
| DELETE | `/:id` | Delete department |

---

## Positions
**Base URL:** `http://localhost:3000/api/v1/positions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all positions |
| GET | `/:id` | Get position by ID |
| POST | `/` | Create position |
| PUT | `/:id` | Update position |
| DELETE | `/:id` | Delete position |

---

## Companies
**Base URL:** `http://localhost:3000/api/v1/companies`
*Requires: Authentication + ADMIN permission*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create company |
| GET | `/` | Get all companies |
| GET | `/:id` | Get company by ID |
| PUT | `/:id` | Update company |
| DELETE | `/:id` | Delete company |

---

## Leaves
**Base URL:** `http://localhost:3000/api/v1/leaves`
*Requires: Authentication*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create leave request |
| GET | `/` | Get all leaves (HR + MANAGE_LEAVES) |
| GET | `/employee/:employeeId` | Get leaves by employee |
| GET | `/types` | Get leave types |
| GET | `/balance/:employeeId` | Get leave balance |
| GET | `/:id` | Get leave by ID |
| PATCH | `/:id/status` | Approve/decline leave (HR + APPROVE_LEAVES) |
| DELETE | `/:id` | Cancel leave |

---

## Exits
**Base URL:** `http://localhost:3000/api/v1/exits`
*Requires: Authentication*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create exit |
| GET | `/` | Get all exits (HR + MANAGE_EXITS) |
| GET | `/employee/:employeeId` | Get exit by employee |
| GET | `/:id` | Get exit by ID |
| PATCH | `/:id/approve` | Approve exit (HR + APPROVE_EXITS) |

---

## Onboarding
**Base URL:** `http://localhost:3000/api/v1/onboardings`
*Requires: Authentication*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create onboarding (HR + MANAGE_ONBOARDING) |
| GET | `/` | Get all onboarding (HR + MANAGE_ONBOARDING) |
| GET | `/employee/:employeeId` | Get onboarding by employee |
| GET | `/:id` | Get onboarding by ID |
| PATCH | `/:id` | Update onboarding (HR + MANAGE_ONBOARDING) |

---

## Payroll
**Base URL:** `http://localhost:3000/api/v1/payrolls`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all payrolls |
| GET | `/employee/:employeeId` | Get payroll by employee |
| GET | `/:id` | Get payroll by ID |
| GET | `/periods/:payPeriod` | Get payroll by pay period |
| POST | `/` | Generate payroll (HR + MANAGE_PAYROLL) |
| PUT | `/:id` | Update payroll |
| POST | `/:id/process` | Mark payroll as processed |
| POST | `/:id/pay` | Mark payroll as paid |
| DELETE | `/:id` | Delete payroll |

---

## Deductions
**Base URL:** `http://localhost:3000/api/v1/deductions`
*Requires: Authentication + MANAGE_PAYROLL permission + HR department*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create deduction |
| GET | `/` | Get all deductions |
| GET | `/:id` | Get deduction by ID |
| PUT | `/:id` | Update deduction |

---

## Loans
**Base URL:** `http://localhost:3000/api/v1/loans`
*Requires: Authentication + MANAGE_LOANS permission + HR department*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all loans |
| GET | `/:id` | Get loan by ID |
| POST | `/` | Create loan |
| PUT | `/:id` | Update loan |
| DELETE | `/:id` | Delete loan |

---

## Complaints
**Base URL:** `http://localhost:3000/api/v1/complaints`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all complaints |
| GET | `/:id` | Get complaint by ID |
| POST | `/` | Create complaint |
| PUT | `/:id` | Update complaint |
| POST | `/:id/resolve` | Resolve complaint |
| POST | `/:id/close` | Close complaint |
| DELETE | `/:id` | Delete complaint |

---

## Performance
**Base URL:** `http://localhost:3000/api/v1/performance`

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get performance dashboard |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/goals` | Get all goals |
| GET | `/goals/:id` | Get goal by ID |
| POST | `/goals` | Create goal |
| PUT | `/goals/:id` | Update goal |
| PATCH | `/goals/:id/progress` | Update goal progress |
| DELETE | `/goals/:id` | Delete goal |

### Appraisal Cycles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cycles` | Get all appraisal cycles |
| GET | `/cycles/:id` | Get cycle by ID |
| POST | `/cycles` | Create appraisal cycle |
| PUT | `/cycles/:id` | Update appraisal cycle |
| POST | `/cycles/:id/activate` | Activate cycle |
| POST | `/cycles/:id/close` | Close cycle |

### Appraisals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/appraisals` | Get all appraisals |
| GET | `/appraisals/:id` | Get appraisal by ID |
| POST | `/appraisals` | Submit appraisal |
| PUT | `/appraisals/:id` | Update appraisal |
| POST | `/appraisals/:id/submit` | Submit for review |
| POST | `/appraisals/:id/review` | Review appraisal |
| DELETE | `/appraisals/:id` | Delete appraisal |

---

## Recruitment
**Base URL:** `http://localhost:3000/api/v1/recruitment`

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Get recruitment dashboard stats |

### Job Postings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/postings` | Get all job postings |
| GET | `/postings/:id` | Get job posting by ID |
| POST | `/postings` | Create job posting |
| PUT | `/postings/:id` | Update job posting |
| POST | `/postings/:id/approve` | Approve job posting |
| POST | `/postings/:id/reject` | Reject job posting |
| POST | `/postings/:id/close` | Close job posting |
| DELETE | `/postings/:id` | Delete job posting |

### Job Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/applications` | Get all applications |
| GET | `/applications/:id` | Get application by ID |
| GET | `/applications/by-posting/:jobPostingId` | Get applications by job posting |
| POST | `/applications` | Submit job application |
| PUT | `/applications/:id/status` | Update application status |
| POST | `/applications/:id/schedule-interview` | Schedule interview |
| POST | `/applications/:id/send-offer` | Send offer |
| POST | `/applications/:id/hire` | Hire applicant |
| POST | `/applications/:id/reject` | Reject applicant |
| DELETE | `/applications/:id` | Delete application |

---

## Health Check
**Base URL:** `http://localhost:3000/api/health`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Check API health |

---

## API Documentation
**URL:** `http://localhost:3000/api-docs`
View interactive Swagger documentation of all endpoints
