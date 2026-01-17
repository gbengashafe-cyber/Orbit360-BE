# Applicant Management Implementation

## Overview
This document outlines the endpoints and flow for managing job applicants in the Recruitment module.

## Frontend Flow (from Orbit FE)

1. **Job Postings Table**: User clicks "View Applications" button for a job posting
2. **Application Pipeline Modal**: Opens a dialog showing all applications in a Kanban board layout
3. **Pipeline Stages**: Applications are organized by status:
   - `submitted` (status: `applied`)
   - `under_review` 
   - `shortlisted` (status: `interviewed`)
   - `interview_scheduled`
   - `interviewed`
   - `offer_made` (status: `offered`)
   - `hired`
   - `rejected`
4. **Add Applicant**: User can click "Add Applicant" button to open a form
5. **Form Fields**:
   - Full Name (required)
   - Email (required)
   - Phone (optional)
   - Salary Expectation (₦) (optional)
   - Resume/CV (optional, file upload)
6. **Drag & Drop**: Applications can be dragged between pipeline stages
7. **Real-time Updates**: Status changes are sent to backend via `updateApplicationStatus(id, status)`

## Backend Endpoints

### 1. Create Job Application (Add Applicant)
**Endpoint**: `POST /api/v1/recruitments/applications`

**Request Body**:
```json
{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "08012345678",
  "salary_expectation": 500000,
  "resume_url": "https://example.com/resume.pdf",
  "cover_letter": "Optional cover letter text"
}
```

**Response**:
```json
{
  "data": {
    "id": 1,
    "job_posting_id": 1,
    "applicant_name": "John Doe",
    "applicant_email": "john@example.com",
    "applicant_phone": "08012345678",
    "salary_expectation": 500000,
    "resume_url": "https://example.com/resume.pdf",
    "cover_letter": null,
    "applied_date": "2024-01-17T10:30:00Z",
    "status": "applied",
    "interview_date": null,
    "interview_notes": null,
    "rating": null
  },
  "message": "Job application submitted successfully"
}
```

**Notes**:
- `resume_url` is now optional (to allow manual applicant entry)
- `salary_expectation` is new and optional
- Status defaults to `applied`

### 2. Get Applications by Job Posting
**Endpoint**: `GET /api/v1/recruitments/applications/by-posting/:jobPostingId`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `rows` (optional): Rows per page (default: 10)

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "job_posting_id": 1,
      "applicant_name": "John Doe",
      "applicant_email": "john@example.com",
      "applicant_phone": "08012345678",
      "salary_expectation": 500000,
      "resume_url": "https://example.com/resume.pdf",
      "applied_date": "2024-01-17T10:30:00Z",
      "status": "applied",
      "rating": null
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

### 3. Update Application Status (Drag & Drop)
**Endpoint**: `PUT /api/v1/recruitments/applications/:id/status`

**Request Body**:
```json
{
  "status": "under_review"
}
```

**Valid Status Values**:
- `applied` (Submitted)
- `under_review` (Under Review)
- `interviewed` (Shortlisted)
- `interview_scheduled` (Interview Scheduled)
- `offered` (Offer Made)
- `hired` (Hired)
- `rejected` (Rejected)

**Response**:
```json
{
  "data": {
    "id": 1,
    "status": "under_review",
    "updated_at": "2024-01-17T11:00:00Z"
  },
  "message": "Job application updated successfully"
}
```

### 4. Schedule Interview
**Endpoint**: `POST /api/v1/recruitments/applications/:id/schedule-interview`

**Request Body**:
```json
{
  "interview_date": "2024-01-25T14:00:00Z",
  "interview_notes": "Technical round discussion"
}
```

**Response**:
```json
{
  "data": {
    "id": 1,
    "status": "interview_scheduled",
    "interview_date": "2024-01-25T14:00:00Z",
    "interview_notes": "Technical round discussion"
  },
  "message": "Interview scheduled successfully"
}
```

### 5. Get All Applications
**Endpoint**: `GET /api/v1/recruitments/applications`

**Query Parameters**:
- `page` (optional): Page number
- `rows` (optional): Rows per page
- `status` (optional): Filter by status
- `job_posting_id` (optional): Filter by job posting ID

## Data Model Changes

### JobApplication Model
New field added:
- **salary_expectation** (DECIMAL): Optional salary expectation in currency

### Validation Rules
- `applicant_name`: 2+ characters (required)
- `applicant_email`: Valid email format (required)
- `applicant_phone`: 7+ characters (required)
- `resume_url`: Valid URL format (optional)
- `salary_expectation`: Positive number (optional)

## Implementation Status

✅ **Completed**:
- Add applicant endpoint with salary_expectation field
- Get applications by job posting
- Update application status
- Schedule interview
- Job application model updated

## Usage Flow

### Adding an Applicant (Frontend to Backend)
1. User fills the "Add Applicant" form
2. Frontend calls `recruitmentService.createJobApplication(formData)`
3. POST to `/api/v1/recruitments/applications`
4. Backend validates and creates record
5. Pipeline refreshes to show new applicant in "Submitted" stage

### Moving Applicant Between Stages
1. User drags card from one pipeline stage to another
2. Frontend calls `recruitmentService.updateApplicationStatus(id, newStatus)`
3. PUT to `/api/v1/recruitments/applications/{id}/status`
4. Backend updates status
5. Pipeline updates in real-time

## Migration Note
If you have existing database records, run a migration to add the `salary_expectation` column:
```sql
ALTER TABLE job_applications ADD COLUMN salary_expectation DECIMAL(12, 2) NULL DEFAULT NULL;
```
