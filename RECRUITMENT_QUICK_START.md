# Recruitment Module - Quick Start Guide

## Dashboard Endpoint

Get all recruitment KPIs with a single API call:

```bash
GET /api/v1/recruitment/dashboard/stats
```

**Response:**
```json
{
  "data": {
    "activeJobs": 5,
    "totalApplications": 42,
    "pendingInterviews": 3,
    "hireRate": 21,
    "hiredCount": 9
  }
}
```

### Metrics Explained

| Metric | Formula | Description |
|--------|---------|-------------|
| **Active Jobs** | COUNT(status='active') | Number of open job postings |
| **Total Applications** | COUNT(*) | All applications received |
| **Pending Interviews** | COUNT(status='interview_scheduled') | Applications waiting for interview |
| **Hire Rate** | (hiredCount / totalApplications) * 100 | Percentage of successful hires |
| **Hired Count** | COUNT(status='hired') | Total candidates hired |

---

## Complete Recruitment Workflow

### 1. HR Creates Job Posting
```bash
POST /api/v1/recruitment/postings
{
  "title": "Senior Developer",
  "description": "...",
  "department": "Engineering",
  "location": "Remote",
  "employment_type": "full_time",
  "salary_range_min": 100000,
  "salary_range_max": 150000,
  "requirements": "5+ years experience",
  "created_by": "hr@example.com"
}
```
Status: `pending_approval`

### 2. Managing Director Approves
```bash
POST /api/v1/recruitment/postings/1/approve
{
  "approved_by": "md@example.com"
}
```
Status: `active` (now visible to candidates)

### 3. Candidates Submit Applications
```bash
POST /api/v1/recruitment/applications
{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "+1234567890",
  "resume_url": "https://...",
  "cover_letter": "I am interested..."
}
```
Status: `applied`

### 4. HR Reviews Applications
```bash
GET /api/v1/recruitment/applications?job_posting_id=1&status=applied
```

### 5. Schedule Interview
```bash
POST /api/v1/recruitment/applications/1/schedule-interview
{
  "interview_date": "2024-02-20T14:00:00Z",
  "interview_notes": "Phone screening"
}
```
Status: `interview_scheduled`

### 6. Conduct Interview & Rate
```bash
PUT /api/v1/recruitment/applications/1/status
{
  "status": "interviewed",
  "rating": 4
}
```
Status: `interviewed`

### 7. Send Offer
```bash
POST /api/v1/recruitment/applications/1/send-offer
```
Status: `offered`

### 8. Finalize Hiring
```bash
POST /api/v1/recruitment/applications/1/hire
```
Status: `hired`

---

## API Endpoints at a Glance

### Dashboard
- `GET /dashboard/stats` - Get KPI metrics

### Job Postings
- `GET /postings` - List all postings
- `POST /postings` - Create posting
- `GET /postings/:id` - Get details
- `PUT /postings/:id` - Update posting
- `POST /postings/:id/approve` - MD approval
- `POST /postings/:id/reject` - MD rejection
- `POST /postings/:id/close` - Close role
- `DELETE /postings/:id` - Delete posting

### Job Applications
- `GET /applications` - List all applications
- `POST /applications` - Submit application
- `GET /applications/:id` - Get application
- `GET /applications/by-posting/:jobPostingId` - Get job applications
- `PUT /applications/:id/status` - Update status & rating
- `POST /applications/:id/schedule-interview` - Schedule interview
- `POST /applications/:id/send-offer` - Send offer
- `POST /applications/:id/hire` - Hire candidate
- `POST /applications/:id/reject` - Reject candidate
- `DELETE /applications/:id` - Delete application

---

## Status Workflows

### Job Posting Status
```
draft
  ↓
pending_approval
  ├→ active (approved by MD)
  └→ rejected (rejected by MD)
  
active
  ├→ closed (no more applications)
  └→ on_hold (paused)
```

### Application Status
```
applied
  ↓
under_review
  ↓
interview_scheduled
  ↓
interviewed
  ├→ offered
  │  └→ hired
  └→ rejected
```

---

## Frontend Integration Example

```javascript
// Fetch dashboard metrics
async function loadRecruitmentDashboard() {
  const response = await fetch('http://localhost:3000/api/v1/recruitment/dashboard/stats');
  const { data } = await response.json();
  
  document.querySelector('[data-active-jobs]').textContent = data.activeJobs;
  document.querySelector('[data-total-applications]').textContent = data.totalApplications;
  document.querySelector('[data-pending-interviews]').textContent = data.pendingInterviews;
  document.querySelector('[data-hire-rate]').textContent = data.hireRate + '%';
}

// Create job posting
async function createJobPosting(formData) {
  const response = await fetch('http://localhost:3000/api/v1/recruitment/postings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  return response.json();
}

// Submit application
async function submitApplication(jobId, applicantData) {
  const response = await fetch('http://localhost:3000/api/v1/recruitment/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_posting_id: jobId,
      ...applicantData
    })
  });
  return response.json();
}

// Schedule interview
async function scheduleInterview(applicationId, interviewData) {
  const response = await fetch(
    `http://localhost:3000/api/v1/recruitment/applications/${applicationId}/schedule-interview`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interviewData)
    }
  );
  return response.json();
}
```

---

## Testing with cURL

```bash
# Get dashboard
curl http://localhost:3000/api/v1/recruitment/dashboard/stats

# Create job
curl -X POST http://localhost:3000/api/v1/recruitment/postings \
  -H "Content-Type: application/json" \
  -d '{"title":"Dev","description":"...","department":"Eng",...}'

# List applications
curl "http://localhost:3000/api/v1/recruitment/applications?page=1&rows=10"

# Submit application
curl -X POST http://localhost:3000/api/v1/recruitment/applications \
  -H "Content-Type: application/json" \
  -d '{"job_posting_id":1,"applicant_name":"John",...}'

# Schedule interview
curl -X POST http://localhost:3000/api/v1/recruitment/applications/1/schedule-interview \
  -H "Content-Type: application/json" \
  -d '{"interview_date":"2024-02-20T14:00:00Z","interview_notes":"Phone"}'

# Hire candidate
curl -X POST http://localhost:3000/api/v1/recruitment/applications/1/hire
```

---

## Database Tables

### job_postings
```sql
id, title, description, department, location, employment_type,
salary_range_min, salary_range_max, requirements, posted_date,
status, created_by, approved_by, approved_date, closedDate,
createdAt, updatedAt
```

### job_applications
```sql
id, job_posting_id, applicant_name, applicant_email, applicant_phone,
resume_url, cover_letter, applied_date, status, interview_date,
interview_notes, rating, createdAt, updatedAt
```

---

## Notes

- Job postings start as `pending_approval` and require MD approval
- Only `active` job postings are visible to candidates
- Hire Rate = (Hired Count / Total Applications) × 100
- All timestamps are in ISO 8601 format (UTC)
- Pagination defaults: page=1, rows=10
