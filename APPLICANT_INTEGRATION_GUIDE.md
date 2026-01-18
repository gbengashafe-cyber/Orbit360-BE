# Applicant Integration Guide

## Updated API Flows with New Applicant Model

### Frontend Flow (Unchanged from User's Perspective)

1. **Job Postings Table** → "View Applications" button (passes `job_posting_id`)
2. **Application Pipeline Modal** → Shows applications filtered by job posting
3. **Pipeline Stages** → Submitted, Under Review, Shortlisted, Interview Scheduled
4. **Add Applicant** → Opens form to manually add applicant

---

## Backend Changes

### Two Ways to Add an Applicant

#### Option A: Create New Applicant (Most Common)
When user fills "Add New Applicant" form in the modal:

```bash
POST /api/v1/recruitments/applications
```

**Request Body:**
```json
{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john.doe@example.com",
  "applicant_phone": "08012345678",
  "salary_expectation": 500000,
  "resume_url": "https://example.com/resume.pdf",
  "cover_letter": "I'm interested in this role"
}
```

**What Happens:**
1. Check if applicant with `email: john.doe@example.com` exists
2. **If NO**: Create new `Applicant` record
3. **If YES**: Reuse existing `Applicant` record
4. Create `JobApplication` linking to applicant
5. Populate denormalized fields for backward compatibility

**Response:**
```json
{
  "data": {
    "id": 1,
    "job_posting_id": 1,
    "applicant_id": 5,
    "applied_date": "2026-01-17T17:30:00Z",
    "status": "applied",
    "applicant_name": "John Doe",
    "applicant_email": "john.doe@example.com",
    "applicant_phone": "08012345678",
    "salary_expectation": 500000,
    "applicant": {
      "id": 5,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "08012345678",
      "resume_url": "https://example.com/resume.pdf",
      "cover_letter": "I'm interested in this role",
      "salary_expectation": 500000,
      "source": "manual"
    }
  },
  "message": "Applicant added successfully"
}
```

---

#### Option B: Link Existing Applicant (For Reuse)
When applicant profile already exists (future enhancement):

```bash
POST /api/v1/recruitments/applications
```

**Request Body:**
```json
{
  "job_posting_id": 2,
  "applicant_id": 5
}
```

**What Happens:**
1. Verify `Applicant` with ID 5 exists
2. Create `JobApplication` linking applicant to job
3. Populate denormalized fields from applicant

**Response:**
```json
{
  "data": { /* same as above */ },
  "message": "Applicant added successfully"
}
```

---

### Get Applications for Job Posting

```bash
GET /api/v1/recruitments/applications/by-posting/1
```

**Response includes applicant data:**
```json
{
  "data": [
    {
      "id": 1,
      "job_posting_id": 1,
      "applicant_id": 5,
      "applied_date": "2026-01-17T17:30:00Z",
      "status": "applied",
      "rating": null,
      "interview_date": null,
      "interview_notes": null,
      "applicant_name": "John Doe",
      "applicant_email": "john.doe@example.com",
      "applicant_phone": "08012345678",
      "resume_url": "https://example.com/resume.pdf",
      "salary_expectation": 500000,
      "applicant": {
        "id": 5,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "08012345678",
        "resume_url": "https://example.com/resume.pdf",
        "cover_letter": "...",
        "salary_expectation": 500000,
        "source": "manual",
        "createdAt": "2026-01-17T17:30:00Z"
      }
    }
  ],
  "pagination": { "total": 1, "page": 1, "rows": 10, "pages": 1 }
}
```

---

## Data Structure

### Applicants Table
Central repository for applicant profiles:

```
id             | name      | email                  | phone        | resume_url | salary_exp | source | createdAt
1              | John Doe  | john.doe@example.com   | 08012345678  | https://.. | 500000     | manual | 2026-01-17
2              | Jane Smith| jane.smith@example.com | 08098765432  | https://.. | 750000     | linkedin | 2026-01-16
```

### Job Applications Table
Applications linking applicants to jobs:

```
id | job_posting_id | applicant_id | status | applied_date | interview_date
1  | 1              | 1            | applied| 2026-01-17   | NULL
2  | 2              | 1            | under_review | 2026-01-17 | NULL
3  | 1              | 2            | interview_scheduled | 2026-01-16 | 2026-01-25
```

**Same applicant (id=1) applying to multiple jobs**

---

## Key Features

✅ **Automatic Deduplication**: Same email = same applicant record  
✅ **Reusable Profiles**: One applicant applies to multiple jobs  
✅ **Backward Compatible**: Denormalized fields still in job_applications  
✅ **Smart Updates**: If applicant reapplies, their profile can be updated  
✅ **Full Association Support**: Can query applicant from application and vice versa  

---

## Frontend Implementation

No changes needed to the current UI/UX:

1. **Add Applicant Form** → Same fields, same modal
2. **Application Pipeline** → Same Kanban board display
3. **Filtering & Sorting** → Same job_posting_id filtering
4. **Drag & Drop** → Same status update mechanism

**Backend handles the deduplication transparently.**

---

## Error Scenarios

### Duplicate Application (Already Applied)
```json
{
  "success": false,
  "code": 409,
  "message": "This applicant has already applied for this job posting"
}
```

### Applicant ID Not Found
```json
{
  "success": false,
  "code": 404,
  "message": "Applicant with ID 99 not found"
}
```

### Job Posting Not Found
```json
{
  "success": false,
  "code": 404,
  "message": "Job posting with ID 1 not found"
}
```

---

## Migration Status

✅ Models created  
✅ Controllers updated  
✅ Associations configured  
⏳ Database sync needed  
⏳ Data migration script needed (if migrating from old schema)

---

## Next Steps

1. Run database sync: `npm run sync`
2. Test the endpoint with Postman
3. Verify applicant deduplication works
4. Monitor application logs for any association issues
