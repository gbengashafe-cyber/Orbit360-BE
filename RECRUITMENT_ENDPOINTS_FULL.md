# All Recruitment API Endpoints

**Base URL:** `http://localhost:3000/api/v1/recruitment`

---

## Dashboard

### Get Dashboard Stats
```
GET /api/v1/recruitment/dashboard/stats
```
**Response:** Dashboard KPIs (activeJobs, totalApplications, pendingInterviews, hireRate, hiredCount)

---

## Job Postings

### 1. Get All Job Postings
```
GET /api/v1/recruitment/postings?page=1&rows=10&status=active
```
**Query Params:**
- page (optional, default: 1)
- rows (optional, default: 10)
- status (optional: draft, pending_approval, active, closed, rejected, on_hold)

---

### 2. Get Job Posting by ID
```
GET /api/v1/recruitment/postings/1
```

---

### 3. Create Job Posting
```
POST /api/v1/recruitment/postings
Content-Type: application/json

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

---

### 4. Update Job Posting
```
PUT /api/v1/recruitment/postings/1
Content-Type: application/json

{
  "title": "Senior Software Developer",
  "salary_range_min": 85000,
  "salary_range_max": 130000
}
```

---

### 5. Approve Job Posting (MD only)
```
POST /api/v1/recruitment/postings/1/approve
Content-Type: application/json

{
  "approved_by": "md@example.com"
}
```

---

### 6. Reject Job Posting (MD only)
```
POST /api/v1/recruitment/postings/1/reject
```

---

### 7. Close Job Role
```
POST /api/v1/recruitment/postings/1/close
```

---

### 8. Delete Job Posting
```
DELETE /api/v1/recruitment/postings/1
```

---

## Job Applications

### 1. Get All Applications
```
GET /api/v1/recruitment/applications?page=1&rows=10&status=applied&job_posting_id=1
```
**Query Params:**
- page (optional)
- rows (optional)
- status (optional: applied, under_review, interview_scheduled, interviewed, offered, hired, rejected)
- job_posting_id (optional)

---

### 2. Get Application by ID
```
GET /api/v1/recruitment/applications/1
```

---

### 3. Get Applications for Specific Job
```
GET /api/v1/recruitment/applications/by-posting/1?page=1&rows=10
```

---

### 4. Submit Job Application
```
POST /api/v1/recruitment/applications
Content-Type: application/json

{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "+1234567890",
  "resume_url": "https://example.com/resumes/john-doe.pdf",
  "cover_letter": "I am interested in this position because I have strong backend experience."
}
```

---

### 5. Update Application Status
```
PUT /api/v1/recruitment/applications/1/status
Content-Type: application/json

{
  "status": "under_review",
  "rating": 4,
  "interview_notes": "Promising candidate"
}
```

**Status Options:** applied, under_review, interview_scheduled, interviewed, offered, hired, rejected

---

### 6. Schedule Interview
```
POST /api/v1/recruitment/applications/1/schedule-interview
Content-Type: application/json

{
  "interview_date": "2024-02-15T14:00:00Z",
  "interview_notes": "Technical + HR round"
}
```

---

### 7. Send Offer
```
POST /api/v1/recruitment/applications/1/send-offer
```

---

### 8. Hire Applicant
```
POST /api/v1/recruitment/applications/1/hire
```

---

### 9. Reject Applicant
```
POST /api/v1/recruitment/applications/1/reject
```

---

### 10. Delete Application
```
DELETE /api/v1/recruitment/applications/1
```

---

## Testing Order

1. **Create Job Posting** (POST /postings) → Note the ID
2. **Get All Job Postings** (GET /postings)
3. **Get Job Posting by ID** (GET /postings/1)
4. **Create Job Application** (POST /applications with job_posting_id from step 1)
5. **Get All Applications** (GET /applications)
6. **Get Application by ID** (GET /applications/1)
7. **Update Application Status** (PUT /applications/1/status)
8. **Schedule Interview** (POST /applications/1/schedule-interview)
9. **Send Offer** (POST /applications/1/send-offer)
10. **Hire Applicant** (POST /applications/1/hire)
11. **Get Dashboard Stats** (GET /dashboard/stats)
