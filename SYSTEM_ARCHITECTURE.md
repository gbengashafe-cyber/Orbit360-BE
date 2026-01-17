# System Architecture - Applicant Management

## Overall Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Job Postings Table                                         │ │
│  │ [View Applications] → Opens modal                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Application Pipeline Modal (by job_posting_id)            │ │
│  │ ┌──────────────────────────────────────────────────────┐  │ │
│  │ │ Submitted │ Under Review │ Shortlisted │ Interview  │  │ │
│  │ └──────────────────────────────────────────────────────┘  │ │
│  │ [Add Applicant] → Form                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ApplicantForm.jsx                                          │ │
│  │ Fills: Name, Email, Phone, Salary, Resume, Cover Letter  │ │
│  │ POST /api/v1/recruitments/applications                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ JobApplicationController.create()                          │ │
│  │                                                            │ │
│  │ 1. Validate job_posting_id exists                        │ │
│  │ 2. Check if applicant email exists in DB                 │ │
│  │    ├─ YES: Fetch existing Applicant (reuse)             │ │
│  │    └─ NO:  Create new Applicant                          │ │
│  │ 3. Check if duplicate application (same job + applicant) │ │
│  │ 4. Create JobApplication record                          │ │
│  │    ├─ applicant_id (FK to Applicant)                    │ │
│  │    ├─ job_posting_id (FK to JobPosting)                 │ │
│  │    ├─ Denormalized fields (for backward compat)          │ │
│  │    └─ status = 'applied'                                 │ │
│  │ 5. Return full response with applicant data             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ DATABASE                                                   │ │
│  │                                                            │ │
│  │ ┌──────────────────┐         ┌──────────────────────┐     │ │
│  │ │   applicants     │ (1:N)   │ job_applications     │     │ │
│  │ ├──────────────────┤◄────────┤──────────────────────┤     │ │
│  │ │ id (PK)          │         │ id (PK)              │     │ │
│  │ │ name             │         │ job_posting_id (FK)  │     │ │
│  │ │ email (UNIQUE)   │         │ applicant_id (FK)    │     │ │
│  │ │ phone            │         │ status               │     │ │
│  │ │ resume_url       │         │ applied_date         │     │ │
│  │ │ cover_letter     │         │ interview_date       │     │ │
│  │ │ salary_exp       │         │ rating               │     │ │
│  │ │ source           │         │ [denormalized fields]│     │ │
│  │ │ createdAt        │         │ createdAt            │     │ │
│  │ │ updatedAt        │         │ updatedAt            │     │ │
│  │ └──────────────────┘         └──────────────────────┘     │ │
│  │                                                            │ │
│  │ Benefits:                                                  │ │
│  │ ✅ One applicant → Multiple jobs                          │ │
│  │ ✅ No duplicates (email unique in applicants)             │ │
│  │ ✅ Full history of all applications                       │ │
│  │ ✅ Denormalized fields for quick access                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow

### Scenario: Add New Applicant (Auto-Deduplication)

#### Request
```
POST /api/v1/recruitments/applications
Content-Type: application/json

{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "08012345678",
  "salary_expectation": 500000,
  "cover_letter": "Interested in this role"
}
```

#### Processing
```
Controller receives request
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Validate job_posting_id = 1 exists              │
│ Result: JobPosting found ✓                              │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Check if email exists in applicants table      │
│ Query: SELECT * FROM applicants WHERE email = ?         │
│ Result: NOT FOUND                                       │
│ Action: CREATE new Applicant record                     │
│         INSERT INTO applicants (...)                    │
│         Applicant ID = 5 ✓                              │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Check for duplicate application                │
│ Query: SELECT * FROM job_applications                  │
│        WHERE job_posting_id=1 AND applicant_id=5       │
│ Result: NOT FOUND ✓                                    │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Create JobApplication                         │
│ INSERT INTO job_applications (                         │
│   job_posting_id: 1,                                   │
│   applicant_id: 5,                                     │
│   applicant_name: "John Doe",                          │
│   applicant_email: "john@example.com",                 │
│   applicant_phone: "08012345678",                      │
│   salary_expectation: 500000,                          │
│   status: "applied",                                   │
│   applied_date: NOW()                                  │
│ )                                                      │
│ JobApplication ID = 1 ✓                                │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Return response with both objects              │
└─────────────────────────────────────────────────────────────┘
```

#### Response
```
HTTP 201 Created
Content-Type: application/json

{
  "data": {
    "id": 1,
    "job_posting_id": 1,
    "applicant_id": 5,
    "applied_date": "2026-01-17T10:30:00Z",
    "status": "applied",
    "rating": null,
    "interview_date": null,
    
    // Denormalized fields (backward compatible)
    "applicant_name": "John Doe",
    "applicant_email": "john@example.com",
    "applicant_phone": "08012345678",
    "salary_expectation": 500000,
    
    // Full applicant object
    "applicant": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "08012345678",
      "resume_url": null,
      "cover_letter": "Interested in this role",
      "salary_expectation": 500000,
      "source": "manual",
      "notes": null,
      "createdAt": "2026-01-17T10:30:00Z",
      "updatedAt": "2026-01-17T10:30:00Z"
    }
  },
  "message": "Applicant added successfully"
}
```

---

### Scenario: Same Person Applies to Another Job

#### Request
```
POST /api/v1/recruitments/applications

{
  "job_posting_id": 2,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "08012345678",
  "salary_expectation": 500000
}
```

#### Processing
```
Step 2: Check if email exists in applicants table
Query: SELECT * FROM applicants WHERE email = "john@example.com"
Result: FOUND - Applicant ID = 5 ✓
Action: REUSE existing applicant (don't create new)
    ↓
Step 3: Check for duplicate application
Query: SELECT * FROM job_applications
       WHERE job_posting_id=2 AND applicant_id=5
Result: NOT FOUND ✓
    ↓
Step 4: Create NEW JobApplication
INSERT INTO job_applications (
  job_posting_id: 2,
  applicant_id: 5,  // Same applicant!
  ...
)
JobApplication ID = 2 ✓
```

#### Database State After
```
applicants table:
┌────┬──────────┬──────────────────────┐
│ id │ name     │ email                │
├────┼──────────┼──────────────────────┤
│ 5  │ John Doe │ john@example.com     │  ← Single record
└────┴──────────┴──────────────────────┘

job_applications table:
┌────┬────────────────┬──────────────┬──────────┐
│ id │ job_posting_id │ applicant_id │ status   │
├────┼────────────────┼──────────────┼──────────┤
│ 1  │ 1              │ 5            │ applied  │
│ 2  │ 2              │ 5            │ applied  │  ← Both point to same applicant
└────┴────────────────┴──────────────┴──────────┘
```

**Result:** Same applicant (id=5) has 2 applications for different jobs ✓

---

## Component Dependencies

```
┌──────────────────────────────────┐
│ Recruitment.jsx                  │
│ - Loads job postings             │
│ - Loads all applications         │
│ - Manages modal state             │
└────────────┬─────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
┌──────────────┐ ┌──────────────────────────┐
│Job Postings  │ │Dialog (Modal)            │
│- Table       │ │┌────────────────────────┐│
│- [View Apps] │ ││ApplicationPipeline    ││
└──────────────┘ ││- Displays by status   ││
                 ││- Drag/drop updates   ││
                 ││[Add Applicant]        ││
                 ││└────────────────────┐││
                 ││  ApplicantForm       │││
                 ││  - Name, Email, etc │││
                 ││  - POST /applications│││
                 ││  └────────────────┐│││
                 ││    recruitmentSvc │││
                 ││    .create...()   │││
                 ││└────────────────┘│││
                 ││└────────────────────┘││
                 └──────────────────────────┘
```

---

## Data Model Relationships

```
┌─────────────────────────────────────────────────────────┐
│ ONE Applicant can have MANY JobApplications            │
│                                                         │
│ Applicant (1) ──→ (N) JobApplication                   │
│     │                        │                         │
│     ├─ id: 5                 ├─ id: 1                  │
│     ├─ name: John Doe        ├─ applicant_id: 5       │
│     ├─ email: john@...       ├─ job_posting_id: 1     │
│     ├─ phone: 080...         ├─ status: applied       │
│     └─ ...                   └─ ...                    │
│                                                         │
│                              ├─ id: 2                  │
│                              ├─ applicant_id: 5       │
│                              ├─ job_posting_id: 2     │
│                              ├─ status: under_review  │
│                              └─ ...                    │
│                                                         │
│                              ├─ id: 3                  │
│                              ├─ applicant_id: 5       │
│                              ├─ job_posting_id: 3     │
│                              ├─ status: rejected      │
│                              └─ ...                    │
└─────────────────────────────────────────────────────────┘
```

**Same applicant can apply to 3 different jobs!**

---

## API Endpoint Map

```
APPLICANTS
├── GET    /applicants                    → List all
├── POST   /applicants                    → Create new
├── GET    /applicants/:id                → Get by ID
├── PUT    /applicants/:id                → Update
└── DELETE /applicants/:id                → Delete

APPLICATIONS
├── GET    /applications                  → List all
├── POST   /applications                  → Create (auto-dedup)
├── GET    /applications/:id              → Get by ID
├── PUT    /applications/:id/status       → Update status
├── POST   /applications/:id/schedule-interview
├── POST   /applications/:id/send-offer
├── POST   /applications/:id/hire
├── POST   /applications/:id/reject
├── DELETE /applications/:id              → Delete
└── GET    /applications/by-posting/:jobPostingId → Get by job
```

---

## Error Handling Flow

```
Request arrives
    ↓
Validate input
    ├─ Missing field? → 400 Bad Request
    └─ Invalid format? → 400 Bad Request
    ↓
Check resources
    ├─ Job posting not found? → 404 Not Found
    ├─ Applicant not found? → 404 Not Found
    └─ Both found? ✓
    ↓
Check business logic
    ├─ Duplicate application? → 409 Conflict
    ├─ Can't update closed job? → 400 Bad Request
    ├─ Can't hire rejected applicant? → 400 Bad Request
    └─ No conflicts? ✓
    ↓
Execute operation
    ├─ Success? → 200/201 OK/Created
    └─ DB error? → 500 Internal Server Error
    ↓
Return response with message
```

---

## Summary

The system uses a **two-table design** to enable:
- ✅ **Applicant Reusability** - One person, multiple jobs
- ✅ **No Duplicates** - Unique email constraint
- ✅ **Auto-Deduplication** - Backend handles intelligently
- ✅ **Full History** - All applications tracked
- ✅ **Backward Compatibility** - Denormalized fields preserved
- ✅ **Clean API** - Clear error messages and responses
