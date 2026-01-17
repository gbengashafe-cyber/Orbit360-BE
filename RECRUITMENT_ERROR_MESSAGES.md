# Recruitment API - Error Messages & Status Codes

## Error Message Guide

All endpoints include specific error messages to help debug issues. Below are the common error scenarios:

---

## Job Applications

### POST /api/v1/recruitments/applications (Add Applicant)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Job posting ID is required` | Missing `job_posting_id` in request |
| 400 | `Applicant name is required` | Missing `applicant_name` in request |
| 400 | `Applicant email is required` | Missing `applicant_email` in request |
| 400 | `Applicant phone is required` | Missing `applicant_phone` in request |
| 404 | `Job posting with ID {id} not found` | Job posting doesn't exist in database |
| 409 | `This applicant has already applied for this job posting` | Duplicate application (same email + job posting) |

**Success Response (201)**:
```json
{
  "data": { /* application object */ },
  "message": "Applicant added successfully"
}
```

---

### PUT /api/v1/recruitments/applications/:id/status (Update Status)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Status is required` | Missing `status` in request body |
| 400 | `Invalid status. Allowed values: applied, under_review, interview_scheduled, interviewed, offered, hired, rejected` | Invalid status value |
| 404 | `Job application with ID {id} not found` | Application doesn't exist |

**Success Response (200)**:
```json
{
  "data": { /* updated application */ },
  "message": "Applicant status updated from 'applied' to 'under_review' successfully"
}
```

---

### POST /api/v1/recruitments/applications/:id/schedule-interview (Schedule Interview)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Interview date is required` | Missing `interview_date` in request |
| 400 | `Cannot schedule interview for applicant with status: {status}` | Applicant is rejected or hired |
| 404 | `Job application with ID {id} not found` | Application doesn't exist |

**Success Response (200)**:
```json
{
  "data": { /* application with interview scheduled */ },
  "message": "Interview scheduled for 1/25/2026 successfully"
}
```

---

### POST /api/v1/recruitments/applications/:id/send-offer (Send Offer)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Cannot send offer to rejected applicant` | Applicant is rejected |
| 404 | `Job application with ID {id} not found` | Application doesn't exist |

**Success Response (200)**:
```json
{
  "data": { /* application with offered status */ },
  "message": "Offer sent to John Doe successfully"
}
```

---

### POST /api/v1/recruitments/applications/:id/hire (Hire Applicant)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Cannot hire rejected applicant` | Applicant is rejected |
| 404 | `Job application with ID {id} not found` | Application doesn't exist |

**Success Response (200)**:
```json
{
  "data": { /* application with hired status */ },
  "message": "John Doe hired successfully"
}
```

---

### POST /api/v1/recruitments/applications/:id/reject (Reject Applicant)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Cannot reject applicant who is already hired` | Applicant is already hired |
| 404 | `Job application with ID {id} not found` | Application doesn't exist |

**Success Response (200)**:
```json
{
  "data": { /* application with rejected status */ },
  "message": "John Doe rejected successfully"
}
```

---

### DELETE /api/v1/recruitments/applications/:id (Delete Application)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Cannot delete application for hired applicant` | Applicant is already hired |
| 404 | `Job application with ID {id} not found` | Application doesn't exist |

**Success Response (200)**:
```json
{
  "message": "Application for John Doe deleted successfully"
}
```

---

## Job Postings

### POST /api/v1/recruitments/postings (Create Job Posting)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Job title is required` | Missing `title` in request |
| 400 | `Job description is required` | Missing `description` in request |
| 400 | `Department is required` | Missing `department` in request |
| 400 | `Location is required` | Missing `location` in request |
| 400 | `Created by (user ID) is required` | Missing `created_by` in request |

**Success Response (201)**:
```json
{
  "data": { /* job posting object */ },
  "message": "Job posting 'Senior Developer' created successfully and is pending approval"
}
```

---

### PUT /api/v1/recruitments/postings/:id (Update Job Posting)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Cannot update a closed job posting` | Job posting is closed |
| 404 | `Job posting with ID {id} not found` | Job posting doesn't exist |

**Success Response (200)**:
```json
{
  "data": { /* updated job posting */ },
  "message": "Job posting 'Senior Developer' updated successfully"
}
```

---

### POST /api/v1/recruitments/postings/:id/approve (Approve Job Posting)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Approver ID is required` | Missing `approved_by` in request |
| 400 | `Job posting cannot be approved when status is '{status}'` | Job is not pending_approval |
| 404 | `Job posting with ID {id} not found` | Job posting doesn't exist |

**Success Response (200)**:
```json
{
  "data": { /* approved job posting */ },
  "message": "Job posting 'Senior Developer' approved and is now active"
}
```

---

### POST /api/v1/recruitments/postings/:id/reject (Reject Job Posting)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Cannot reject job posting with status '{status}'` | Cannot reject active or closed job postings |
| 404 | `Job posting with ID {id} not found` | Job posting doesn't exist |

**Success Response (200)**:
```json
{
  "data": { /* rejected job posting */ },
  "message": "Job posting 'Senior Developer' rejected successfully"
}
```

---

### POST /api/v1/recruitments/postings/:id/close (Close Job Posting)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Only active job postings can be closed. Current status: '{status}'` | Job is not active |
| 404 | `Job posting with ID {id} not found` | Job posting doesn't exist |

**Success Response (200)**:
```json
{
  "data": { /* closed job posting */ },
  "message": "Job posting 'Senior Developer' closed successfully"
}
```

---

### DELETE /api/v1/recruitments/postings/:id (Delete Job Posting)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Cannot delete job posting with status '{status}'` | Cannot delete active or closed job postings |
| 404 | `Job posting with ID {id} not found` | Job posting doesn't exist |

**Success Response (200)**:
```json
{
  "message": "Job posting 'Senior Developer' deleted successfully"
}
```

---

### GET /api/v1/recruitments/applications/pipeline/:jobPostingId (Get Application Pipeline)

| Status | Error Message | Cause |
|--------|---------------|-------|
| 400 | `Job posting ID is required` | Missing jobPostingId param |
| 404 | `Job posting with ID {id} not found` | Job posting doesn't exist |

**Success Response (200)**:
```json
{
  "data": {
    "jobPosting": {
      "id": 1,
      "title": "Senior Developer"
    },
    "pipeline": {
      "submitted": [ /* applications */ ],
      "under_review": [ /* applications */ ],
      "shortlisted": [ /* applications */ ],
      "interview_scheduled": [ /* applications */ ]
    },
    "summary": {
      "submitted": 5,
      "under_review": 3,
      "shortlisted": 2,
      "interview_scheduled": 1,
      "total": 11
    }
  }
}
```

---

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success - Request completed successfully |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or business logic violation |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource or conflicting data |
| 500 | Internal Server Error - Server-side error |

---

## Testing Error Scenarios

### Add duplicate applicant (409 Conflict)
```bash
curl -X POST http://localhost:3000/api/v1/recruitments/applications \
  -H "Content-Type: application/json" \
  -d '{
    "job_posting_id": 1,
    "applicant_name": "John Doe",
    "applicant_email": "john@example.com",
    "applicant_phone": "08012345678"
  }'
```

### Try to schedule interview for rejected applicant (400)
```bash
curl -X POST http://localhost:3000/api/v1/recruitments/applications/1/schedule-interview \
  -H "Content-Type: application/json" \
  -d '{
    "interview_date": "2026-01-25T14:00:00Z"
  }'
```

### Approve non-pending job posting (400)
```bash
curl -X POST http://localhost:3000/api/v1/recruitments/postings/1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "approved_by": "admin"
  }'
```
