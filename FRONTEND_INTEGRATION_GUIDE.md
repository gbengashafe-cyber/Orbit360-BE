# Frontend Integration Guide - Applicant Management

## Overview

The frontend has been updated to support the new Applicant model architecture. No UI/UX changes are needed—the user experience remains exactly the same.

## Changes Made

### 1. API Service (recruitment.service.js)

**New Applicant Management Methods:**

```javascript
// Get all applicants
recruitmentService.getApplicants(page, rows)

// Get single applicant by ID
recruitmentService.getApplicantById(id)

// Get applicant by email
recruitmentService.getApplicantByEmail(email)

// Create new applicant
recruitmentService.createApplicant(data)

// Update applicant profile
recruitmentService.updateApplicant(id, data)

// Delete applicant
recruitmentService.deleteApplicant(id)
```

### 2. API Routes (apiRoutes.js)

**New endpoint paths:**

```javascript
// Applicants
/v1/recruitments/applicants           // GET (list) / POST (create)
/v1/recruitments/applicants/:id       // GET / PUT / DELETE
```

### 3. ApplicantForm Component

**What Changed:**
- ✅ Added validation for required fields
- ✅ Better error handling
- ✅ Automatic applicant deduplication on backend
- ✅ Comments explaining auto-deduplication

**Backend Behavior (Transparent to Frontend):**
- If email exists → Reuses applicant record
- If new email → Creates applicant record
- Always creates new JobApplication record

## How It Works (User Perspective)

### Scenario 1: User Adds New Applicant

```
User clicks "Add Applicant" button
    ↓
Fills form (Name, Email, Phone, Salary)
    ↓
Clicks "Save Applicant"
    ↓
Frontend sends POST /applications with form data
    ↓
Backend checks if email exists in applicants table
    ↓
IF NEW EMAIL:
  - Creates Applicant record
  - Creates JobApplication record
  
IF EMAIL EXISTS:
  - Reuses Applicant record
  - Creates JobApplication record
    ↓
Response returns applicant + application data
    ↓
Toast: "Applicant added successfully!"
    ↓
Pipeline refreshes with new applicant card
```

### Scenario 2: Same Person Applies to Multiple Jobs

```
John (john@example.com) applies to Job #1
    ↓
Applicant record created (id=5)
JobApplication created (applicant_id=5, job_posting_id=1)
    ↓
Later, John applies to Job #2
    ↓
Backend finds John's existing Applicant (id=5)
    ↓
Creates new JobApplication (applicant_id=5, job_posting_id=2)
    ↓
Same applicant profile, different job applications
```

## API Response Format

### POST /applications (Create Application)

**Request:**
```json
{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "08012345678",
  "salary_expectation": 500000,
  "cover_letter": "I'm interested in this role"
}
```

**Response:**
```json
{
  "data": {
    "id": 1,                           // Application ID
    "job_posting_id": 1,
    "applicant_id": 5,                 // Reference to Applicant
    "applied_date": "2026-01-17T...",
    "status": "applied",
    "rating": null,
    "interview_date": null,
    
    // Denormalized fields (for backward compatibility)
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
      "cover_letter": "I'm interested in this role",
      "salary_expectation": 500000,
      "source": "manual",
      "createdAt": "2026-01-17T..."
    }
  },
  "message": "Applicant added successfully"
}
```

### GET /applications/by-posting/:jobPostingId

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "job_posting_id": 1,
      "applicant_id": 5,
      "status": "applied",
      "applicant_name": "John Doe",
      "applicant_email": "john@example.com",
      "applicant": {
        "id": 5,
        "name": "John Doe",
        "email": "john@example.com",
        ...
      }
    }
  ],
  "pagination": { "total": 1, "page": 1, "rows": 10, "pages": 1 }
}
```

## Component Behavior

### ApplicationPipeline.jsx

**No changes needed.** The component works exactly the same:
- ✅ Displays applications grouped by status
- ✅ Accepts `applications` prop with job_posting_id filtered data
- ✅ Shows applicant info from denormalized fields
- ✅ Can also access full applicant object via `application.applicant`

### Recruitment.jsx

**No changes needed.** The component works exactly the same:
- ✅ Loads job postings
- ✅ Loads applications
- ✅ Filters applications by job_posting_id
- ✅ Passes to ApplicationPipeline

## Backend Validation (What Can Go Wrong)

### Error: Duplicate Application
```json
{
  "success": false,
  "code": 409,
  "message": "This applicant has already applied for this job posting"
}
```
**Cause:** Same applicant tries to apply to same job twice  
**Solution:** User cannot apply twice; let them update status if needed

### Error: Job Posting Not Found
```json
{
  "success": false,
  "code": 404,
  "message": "Job posting with ID 1 not found"
}
```
**Cause:** Invalid job_posting_id  
**Solution:** Verify job posting exists before adding applicant

### Error: Missing Required Fields
```json
{
  "success": false,
  "code": 400,
  "message": "Applicant name is required"
}
```
**Cause:** User submitted form with empty fields  
**Solution:** Frontend validation already prevents this

## Testing Checklist

- [ ] Add new applicant to job posting → Works
- [ ] Add same person to different job → Reuses applicant record
- [ ] Application pipeline shows correct applicants
- [ ] Drag/drop status update still works
- [ ] Error messages display correctly
- [ ] Applicant data includes full object + denormalized fields

## Example Postman Test

### Create Application (Backend Testing)

**POST** `/api/v1/recruitments/applications`

```json
{
  "job_posting_id": 1,
  "applicant_name": "Jane Smith",
  "applicant_email": "jane.smith@example.com",
  "applicant_phone": "08098765432",
  "salary_expectation": 750000,
  "cover_letter": "I have 5 years of experience"
}
```

**Expected Response:** 201 Created with full applicant + application data

### Get Applications by Job

**GET** `/api/v1/recruitments/applications/by-posting/1`

**Expected Response:** Array of applications with applicant data

## Backward Compatibility

✅ **Denormalized Fields:** All old applicant fields (`applicant_name`, `applicant_email`, etc.) are still in `job_applications` table  
✅ **Existing API Calls:** Frontend can still use these fields without changes  
✅ **New Data Access:** Can also access full applicant object via `application.applicant`  

## Future Enhancements

The new structure enables:
1. **Applicant Profiles** - View all applicant's applications across jobs
2. **Bulk Actions** - Move all applications of an applicant to a status
3. **Applicant Search** - Find applicants across all job postings
4. **Apply with Existing Profile** - Reuse applicant ID instead of creating new
5. **Resume Management** - Centralized resume storage per applicant

## No UI Changes Required

The entire frontend works as-is. The deduplication and applicant management happens transparently on the backend.

- ✅ Same "Add Applicant" form
- ✅ Same application pipeline
- ✅ Same drag/drop functionality
- ✅ Same error handling
- ✅ Same user experience
