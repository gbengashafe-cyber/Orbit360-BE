# Recruitment API Documentation

## Base URL
```
http://localhost:3000/api/v1/recruitment
```

---

## Dashboard

### Get Dashboard Stats
```
GET /dashboard/stats
```

**Response:**
```json
{
  "data": {
    "activeJobs": 12,
    "totalApplications": 145,
    "pendingInterviews": 8,
    "hireRate": 18,
    "hiredCount": 26
  }
}
```

**Metrics:**
- `activeJobs` - Number of job postings with status `active`
- `totalApplications` - Total number of applications received
- `pendingInterviews` - Applications scheduled for interviews
- `hireRate` - Percentage of hired candidates (hiredCount / totalApplications * 100)
- `hiredCount` - Total number of hired candidates

---

## Job Postings

### Get All Job Postings
```
GET /postings?page=1&rows=10&status=active
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `rows` - Items per page (default: 10)
- `status` - Filter by status: `draft`, `pending_approval`, `active`, `closed`, `rejected`, `on_hold`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Senior Software Developer",
      "description": "We are looking for...",
      "department": "Engineering",
      "location": "New York",
      "employment_type": "full_time",
      "salary_range_min": 80000,
      "salary_range_max": 120000,
      "requirements": "5+ years experience...",
      "posted_date": "2024-01-15T10:00:00Z",
      "status": "active",
      "created_by": "hr@example.com",
      "approved_by": "md@example.com",
      "approved_date": "2024-01-15T14:00:00Z",
      "closedDate": null,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "rows": 10,
    "pages": 3
  }
}
```

### Get Job Posting by ID
```
GET /postings/:id
```

### Create Job Posting
```
POST /postings
Content-Type: application/json

{
  "title": "Senior Software Developer",
  "description": "We are looking for an experienced software developer...",
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

### Update Job Posting
```
PUT /postings/:id
Content-Type: application/json

{
  "title": "Senior Software Developer",
  "salary_range_min": 85000,
  "salary_range_max": 130000
}
```

### Approve Job Posting (MD only)
```
POST /postings/:id/approve
Content-Type: application/json

{
  "approved_by": "md@example.com"
}
```

Status changes: `pending_approval` → `active`

### Reject Job Posting (MD only)
```
POST /postings/:id/reject
```

Status changes: `pending_approval` → `rejected`

### Close Role
```
POST /postings/:id/close
```

Status changes: `active` → `closed` (prevents new applications)

### Delete Job Posting
```
DELETE /postings/:id
```

---

## Job Applications

### Get All Applications
```
GET /applications?page=1&rows=10&status=applied&job_posting_id=1
```

**Query Parameters:**
- `page` - Page number
- `rows` - Items per page
- `status` - Filter: `applied`, `under_review`, `interview_scheduled`, `interviewed`, `offered`, `hired`, `rejected`
- `job_posting_id` - Filter by job posting

### Get Application by ID
```
GET /applications/:id
```

### Get Applications for Specific Job
```
GET /applications/by-posting/:jobPostingId?page=1&rows=10
```

### Submit Job Application
```
POST /applications
Content-Type: application/json

{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "+1234567890",
  "resume_url": "https://example.com/resumes/john-doe.pdf",
  "cover_letter": "I am interested in this position because..."
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "job_posting_id": 1,
    "applicant_name": "John Doe",
    "applicant_email": "john@example.com",
    "applicant_phone": "+1234567890",
    "resume_url": "https://example.com/resumes/john-doe.pdf",
    "cover_letter": "I am interested...",
    "applied_date": "2024-01-15T10:30:00Z",
    "status": "applied",
    "interview_date": null,
    "interview_notes": null,
    "rating": null
  },
  "message": "Job application submitted successfully"
}
```

### Update Application Status
```
PUT /applications/:id/status
Content-Type: application/json

{
  "status": "under_review",
  "rating": 4,
  "interview_notes": "Promising candidate"
}
```

### Schedule Interview
```
POST /applications/:id/schedule-interview
Content-Type: application/json

{
  "interview_date": "2024-02-15T14:00:00Z",
  "interview_notes": "Technical + HR round"
}
```

Status changes: `applied` → `interview_scheduled`

### Send Offer
```
POST /applications/:id/send-offer
```

Status changes: `interviewed` → `offered`

### Hire Applicant
```
POST /applications/:id/hire
```

Status changes: `offered` → `hired`

### Reject Applicant
```
POST /applications/:id/reject
```

Status changes: any → `rejected`

### Delete Application
```
DELETE /applications/:id
```

---

## Application Status Workflow

```
applied
  ↓
under_review
  ↓
interview_scheduled
  ↓
interviewed
  ↓
offered
  ↓
hired (or) rejected
```

---

## Job Posting Status Workflow

```
draft
  ↓
pending_approval
  ↓
active (approved) OR rejected
  ↓
closed (optional, from active)
```

---

## Example cURL Commands

### Get Dashboard Stats
```bash
curl http://localhost:3000/api/v1/recruitment/dashboard/stats
```

### Create a Job Posting
```bash
curl -X POST http://localhost:3000/api/v1/recruitment/postings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Frontend Developer",
    "description": "We seek a talented frontend developer...",
    "department": "Engineering",
    "location": "Remote",
    "employment_type": "full_time",
    "salary_range_min": 70000,
    "salary_range_max": 100000,
    "requirements": "React, TypeScript, 3+ years",
    "created_by": "hr@example.com"
  }'
```

### List Active Job Postings
```bash
curl "http://localhost:3000/api/v1/recruitment/postings?status=active&page=1&rows=10"
```

### Submit Application
```bash
curl -X POST http://localhost:3000/api/v1/recruitment/applications \
  -H "Content-Type: application/json" \
  -d '{
    "job_posting_id": 1,
    "applicant_name": "Jane Smith",
    "applicant_email": "jane@example.com",
    "applicant_phone": "+9876543210",
    "resume_url": "https://example.com/jane-resume.pdf",
    "cover_letter": "Excited about this opportunity..."
  }'
```

### Schedule Interview
```bash
curl -X POST http://localhost:3000/api/v1/recruitment/applications/1/schedule-interview \
  -H "Content-Type: application/json" \
  -d '{
    "interview_date": "2024-02-20T15:00:00Z",
    "interview_notes": "Phone screening + technical assessment"
  }'
```

### Approve Job Posting
```bash
curl -X POST http://localhost:3000/api/v1/recruitment/postings/1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "approved_by": "md@example.com"
  }'
```

---

## Summary of Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard/stats` | Get recruitment dashboard KPIs |
| GET | `/postings` | List all job postings |
| POST | `/postings` | Create new job posting |
| GET | `/postings/:id` | Get single job posting |
| PUT | `/postings/:id` | Update job posting |
| POST | `/postings/:id/approve` | Approve posting (MD) |
| POST | `/postings/:id/reject` | Reject posting (MD) |
| POST | `/postings/:id/close` | Close role |
| DELETE | `/postings/:id` | Delete posting |
| GET | `/applications` | List all applications |
| POST | `/applications` | Submit application |
| GET | `/applications/:id` | Get single application |
| GET | `/applications/by-posting/:jobPostingId` | Get applications for job |
| PUT | `/applications/:id/status` | Update application status |
| POST | `/applications/:id/schedule-interview` | Schedule interview |
| POST | `/applications/:id/send-offer` | Send offer |
| POST | `/applications/:id/hire` | Hire applicant |
| POST | `/applications/:id/reject` | Reject applicant |
| DELETE | `/applications/:id` | Delete application |

---

## Database Models

### JobPosting
```sql
CREATE TABLE job_postings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  department VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  employment_type ENUM('full_time', 'part_time', 'contract', 'temporary'),
  salary_range_min DECIMAL(12,2),
  salary_range_max DECIMAL(12,2),
  requirements TEXT,
  posted_date DATETIME DEFAULT NOW(),
  status ENUM('draft', 'pending_approval', 'active', 'closed', 'on_hold', 'rejected'),
  created_by VARCHAR(255) NOT NULL,
  approved_by VARCHAR(255),
  approved_date DATETIME,
  closedDate DATETIME,
  createdAt DATETIME DEFAULT NOW(),
  updatedAt DATETIME DEFAULT NOW()
);
```

### JobApplication
```sql
CREATE TABLE job_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_posting_id INT NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  applicant_phone VARCHAR(20) NOT NULL,
  resume_url VARCHAR(500),
  cover_letter TEXT,
  applied_date DATETIME DEFAULT NOW(),
  status ENUM('applied', 'under_review', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'),
  interview_date DATETIME,
  interview_notes TEXT,
  rating INT (1-5),
  createdAt DATETIME DEFAULT NOW(),
  updatedAt DATETIME DEFAULT NOW(),
  FOREIGN KEY (job_posting_id) REFERENCES job_postings(id)
);
```
