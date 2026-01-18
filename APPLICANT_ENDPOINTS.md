# Applicant Management Endpoints

## Base URL
```
http://localhost:3000/api/v1/recruitments
```

---

## Applicant Endpoints

### 1. Get All Applicants
```
GET /applicants?page=1&rows=10
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "08012345678",
      "resume_url": "https://example.com/resume.pdf",
      "cover_letter": "Interested in this role",
      "salary_expectation": 500000,
      "source": "manual",
      "notes": "Strong candidate",
      "createdAt": "2026-01-17T10:30:00Z",
      "updatedAt": "2026-01-17T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "rows": 10,
    "pages": 1
  }
}
```

---

### 2. Get Applicant by ID
```
GET /applicants/:id
```

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "resume_url": "https://example.com/resume.pdf",
    "cover_letter": "...",
    "salary_expectation": 500000,
    "source": "manual",
    "notes": "...",
    "createdAt": "2026-01-17T10:30:00Z",
    "updatedAt": "2026-01-17T10:30:00Z"
  }
}
```

**Errors:**
- 404: `Applicant with ID {id} not found`

---

### 3. Get Applicant by Email
```
GET /applicants?email=john@example.com
```

**Response (200):** Same as #1 but filtered by email

---

### 4. Create Applicant
```
POST /applicants
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "resume_url": "https://example.com/resume.pdf",
  "cover_letter": "Interested in this role",
  "salary_expectation": 500000,
  "source": "manual",
  "notes": "Strong candidate"
}
```

**Response (201):**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "resume_url": "https://example.com/resume.pdf",
    "cover_letter": "Interested in this role",
    "salary_expectation": 500000,
    "source": "manual",
    "notes": "Strong candidate",
    "createdAt": "2026-01-17T10:30:00Z",
    "updatedAt": "2026-01-17T10:30:00Z"
  },
  "message": "Applicant created successfully"
}
```

**Errors:**
- 400: `Name is required`
- 400: `Email is required`
- 400: `Phone is required`
- 409: `Applicant with email {email} already exists`

---

### 5. Update Applicant
```
PUT /applicants/:id
```

**Request Body (All fields optional):**
```json
{
  "name": "John Doe Updated",
  "phone": "08098765432",
  "resume_url": "https://example.com/new-resume.pdf",
  "salary_expectation": 600000,
  "notes": "Updated notes"
}
```

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe Updated",
    "email": "john@example.com",
    "phone": "08098765432",
    ...
  },
  "message": "Applicant updated successfully"
}
```

**Errors:**
- 404: `Applicant with ID {id} not found`

---

### 6. Delete Applicant
```
DELETE /applicants/:id
```

**Response (200):**
```json
{
  "message": "Applicant deleted successfully"
}
```

**Errors:**
- 404: `Applicant with ID {id} not found`
- 400: `Cannot delete applicant with active applications`

---

## Job Application Endpoints (Updated)

### 1. Create Job Application
```
POST /applications
```

**Request Body (Option A - Create/Reuse Applicant):**
```json
{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "08012345678",
  "salary_expectation": 500000,
  "cover_letter": "I'm interested"
}
```

**Request Body (Option B - Use Existing Applicant):**
```json
{
  "job_posting_id": 1,
  "applicant_id": 5
}
```

**Response (201):**
```json
{
  "data": {
    "id": 1,
    "job_posting_id": 1,
    "applicant_id": 5,
    "applied_date": "2026-01-17T10:30:00Z",
    "status": "applied",
    "rating": null,
    "interview_date": null,
    "applicant_name": "John Doe",
    "applicant_email": "john@example.com",
    "applicant_phone": "08012345678",
    "salary_expectation": 500000,
    "applicant": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "08012345678",
      "resume_url": null,
      "cover_letter": "I'm interested",
      "salary_expectation": 500000,
      "source": "manual",
      "createdAt": "2026-01-17T10:30:00Z"
    }
  },
  "message": "Applicant added successfully"
}
```

**Errors:**
- 400: `Job posting ID is required`
- 400: `Applicant name is required`
- 400: `Applicant email is required`
- 400: `Applicant phone is required`
- 404: `Job posting with ID {id} not found`
- 404: `Applicant with ID {id} not found`
- 409: `This applicant has already applied for this job posting`

---

### 2. Get Applications by Job Posting
```
GET /applications/by-posting/:jobPostingId?page=1&rows=10
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "job_posting_id": 1,
      "applicant_id": 5,
      "applied_date": "2026-01-17T10:30:00Z",
      "status": "applied",
      "rating": null,
      "interview_date": null,
      "applicant_name": "John Doe",
      "applicant_email": "john@example.com",
      "applicant_phone": "08012345678",
      "salary_expectation": 500000,
      "applicant": {
        "id": 5,
        "name": "John Doe",
        "email": "john@example.com",
        ...
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "rows": 10,
    "pages": 1
  }
}
```

---

### 3. Update Application Status
```
PUT /applications/:id/status
```

**Request Body:**
```json
{
  "status": "under_review"
}
```

**Valid Statuses:**
- `applied`
- `under_review`
- `interview_scheduled`
- `interviewed`
- `offered`
- `hired`
- `rejected`

**Response (200):**
```json
{
  "data": { /* application object */ },
  "message": "Applicant status updated from 'applied' to 'under_review' successfully"
}
```

**Errors:**
- 400: `Status is required`
- 400: `Invalid status. Allowed values: ...`
- 404: `Job application with ID {id} not found`

---

### 4. Schedule Interview
```
POST /applications/:id/schedule-interview
```

**Request Body:**
```json
{
  "interview_date": "2026-01-25",
  "interview_notes": "Technical round discussion"
}
```

**Response (200):**
```json
{
  "data": { /* application object */ },
  "message": "Interview scheduled for 1/25/2026 successfully"
}
```

**Errors:**
- 400: `Interview date is required`
- 400: `Cannot schedule interview for applicant with status: {status}`
- 404: `Job application with ID {id} not found`

---

### 5. Send Offer
```
POST /applications/:id/send-offer
```

**Response (200):**
```json
{
  "data": { /* application object */ },
  "message": "Offer sent to John Doe successfully"
}
```

**Errors:**
- 400: `Cannot send offer to rejected applicant`
- 404: `Job application with ID {id} not found`

---

### 6. Hire Applicant
```
POST /applications/:id/hire
```

**Response (200):**
```json
{
  "data": { /* application object */ },
  "message": "John Doe hired successfully"
}
```

**Errors:**
- 400: `Cannot hire rejected applicant`
- 404: `Job application with ID {id} not found`

---

### 7. Reject Applicant
```
POST /applications/:id/reject
```

**Response (200):**
```json
{
  "data": { /* application object */ },
  "message": "John Doe rejected successfully"
}
```

**Errors:**
- 400: `Cannot reject applicant who is already hired`
- 404: `Job application with ID {id} not found`

---

### 8. Delete Application
```
DELETE /applications/:id
```

**Response (200):**
```json
{
  "message": "Application for John Doe deleted successfully"
}
```

**Errors:**
- 400: `Cannot delete application for hired applicant`
- 404: `Job application with ID {id} not found`

---

## Testing with cURL

### Create Applicant
```bash
curl -X POST http://localhost:3000/api/v1/recruitments/applicants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "salary_expectation": 500000,
    "source": "manual"
  }'
```

### Add Application (Auto-Deduplicates)
```bash
curl -X POST http://localhost:3000/api/v1/recruitments/applications \
  -H "Content-Type: application/json" \
  -d '{
    "job_posting_id": 1,
    "applicant_name": "John Doe",
    "applicant_email": "john@example.com",
    "applicant_phone": "08012345678",
    "salary_expectation": 500000
  }'
```

### Get Applications by Job
```bash
curl -X GET "http://localhost:3000/api/v1/recruitments/applications/by-posting/1?page=1&rows=10"
```

### Update Status
```bash
curl -X PUT http://localhost:3000/api/v1/recruitments/applications/1/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "under_review" }'
```

---

## Date Format

- **Simple**: `YYYY-MM-DD` (e.g., `2026-01-15`)
- **ISO 8601**: `YYYY-MM-DDTHH:mm:ssZ` (e.g., `2026-01-15T14:00:00Z`)

Both formats are accepted.
