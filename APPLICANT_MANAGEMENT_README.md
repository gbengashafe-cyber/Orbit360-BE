# Applicant Management System - Complete Documentation

## 📚 Documentation Index

### Getting Started
1. **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide (START HERE)
2. **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Step-by-step implementation

### Architecture & Design
3. **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - Visual diagrams and data flow
4. **[APPLICANT_DATABASE_DESIGN.md](./APPLICANT_DATABASE_DESIGN.md)** - Database schema and migrations

### API Reference
5. **[APPLICANT_ENDPOINTS.md](./APPLICANT_ENDPOINTS.md)** - Complete API endpoint documentation

### Integration Guides
6. **[APPLICANT_INTEGRATION_GUIDE.md](./APPLICANT_INTEGRATION_GUIDE.md)** - Backend integration details
7. **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** - Frontend integration details

### Error Handling
8. **[RECRUITMENT_ERROR_MESSAGES.md](./RECRUITMENT_ERROR_MESSAGES.md)** - All error scenarios and handling

---

## 🚀 Quick Overview

### What Changed?

**Architecture:** Moved from single-table to **two-table design**

```
OLD (Single Table):
job_applications
├─ id
├─ applicant_name         ← Duplicate data
├─ applicant_email        ← Duplicate data
├─ applicant_phone        ← Duplicate data
└─ ...

NEW (Two Tables):
applicants                        job_applications
├─ id                           ├─ id
├─ name                         ├─ applicant_id (FK) ← Single reference
├─ email (UNIQUE)               ├─ job_posting_id
├─ phone                        ├─ status
└─ ...                          └─ [denormalized fields for backward compat]
```

### Key Benefits

✅ **Auto-Deduplication** - Same email = same applicant profile  
✅ **Applicant Reusability** - One person can apply to many jobs  
✅ **No Duplicates** - Unique email constraint prevents duplicates  
✅ **Backward Compatible** - Existing frontend works without changes  
✅ **Full History** - All applications tracked and accessible  
✅ **Scalable** - Foundation for future features  

---

## 📋 Core Features

### Feature: Auto-Deduplication

When a user submits an applicant form:
1. Backend checks if email exists in `applicants` table
2. **If YES:** Reuses existing applicant record
3. **If NO:** Creates new applicant record
4. Creates new `job_application` record linking them

**Result:** Same person can apply to multiple jobs with one profile!

### Feature: Application Pipeline

Frontend displays applications grouped by status:
- Submitted (status = `applied`)
- Under Review (status = `under_review`)
- Shortlisted (status = `interviewed`)
- Interview Scheduled (status = `interview_scheduled`)

**UI:** Drag/drop between columns updates status

---

## 🏗️ Implementation Status

### ✅ Completed

- [x] Applicant model created
- [x] JobApplication model updated
- [x] Controller logic implemented with auto-deduplication
- [x] Validators with specific error messages
- [x] Model associations set up
- [x] Error handling for all scenarios
- [x] Backward compatibility maintained
- [x] Frontend API service updated
- [x] Frontend form component updated
- [x] Comprehensive documentation

### ⏳ Next Steps

1. **Database Sync:** `npm run sync`
2. **Backend Test:** Start backend and test endpoints
3. **Frontend Test:** Test "Add Applicant" flow
4. **Integration Test:** Test end-to-end flow

---

## 📁 Files Changed

### Backend Files
```
src/features/recruitment/
├── applicant.model.ts (NEW)
├── job-application.model.ts (MODIFIED)
├── recruitment.controller.ts (MODIFIED)
└── recruitment.validators.ts (MODIFIED)
```

### Frontend Files
```
src/
├── api/
│   ├── recruitment.service.js (MODIFIED)
│   └── apiRoutes.js (MODIFIED)
└── components/recruitment/
    └── ApplicantForm.jsx (MODIFIED)
```

---

## 🔌 API Endpoints Summary

### Applicant Management
```
GET    /api/v1/recruitments/applicants              List applicants
POST   /api/v1/recruitments/applicants              Create applicant
GET    /api/v1/recruitments/applicants/:id          Get applicant
PUT    /api/v1/recruitments/applicants/:id          Update applicant
DELETE /api/v1/recruitments/applicants/:id          Delete applicant
```

### Application Management
```
POST   /api/v1/recruitments/applications            Create application (auto-dedup)
GET    /api/v1/recruitments/applications/by-posting/:jobPostingId
PUT    /api/v1/recruitments/applications/:id/status Update status
POST   /api/v1/recruitments/applications/:id/hire   Hire applicant
POST   /api/v1/recruitments/applications/:id/reject Reject applicant
...and more
```

---

## 🧪 Testing

### Backend Test (Postman/cURL)
```bash
POST /api/v1/recruitments/applications
{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "08012345678"
}
```

### Frontend Test
1. Go to Recruitment → Job Postings
2. Click "View Applications"
3. Click "Add Applicant"
4. Fill form and submit
5. Should see success message
6. Applicant appears in pipeline

---

## 🎯 User Flow

```
User clicks "View Applications"
    ↓
Modal opens showing Application Pipeline
    ↓
User clicks "Add Applicant"
    ↓
Form appears with fields:
- Full Name
- Email
- Phone
- Salary Expectation
- Resume/CV
- Cover Letter
    ↓
User submits form
    ↓
Backend:
1. Check if email exists
   - YES: Reuse applicant
   - NO: Create applicant
2. Create JobApplication
3. Return success
    ↓
Frontend:
1. Show success toast
2. Refresh pipeline
3. New card appears in "Submitted" column
    ↓
Done!
```

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────┐
│ FRONTEND (React)                            │
│ Job Postings Table → View Applications      │
│ → Application Pipeline Modal                │
│ → Add Applicant Form                        │
└──────────────┬──────────────────────────────┘
               │
               ↓ POST /applications
               │
┌──────────────────────────────────────────────┐
│ BACKEND (Node.js)                           │
│ JobApplicationController.create()            │
│ 1. Validate inputs                          │
│ 2. Check if email exists                    │
│ 3. Create/Reuse applicant                   │
│ 4. Create job application                   │
│ 5. Return response                          │
└──────────────┬───────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────┐
│ DATABASE                                    │
│                                             │
│ applicants table (1 record per unique email)│
│ job_applications table (many per applicant) │
└──────────────────────────────────────────────┘
```

---

## 🔐 Data Integrity

### Constraints
- `applicants.email` - UNIQUE (prevents duplicates)
- `job_applications(job_posting_id, applicant_id)` - UNIQUE (prevents duplicate applications)
- Both tables have proper foreign keys

### Validation
- Email format validated
- Phone number length checked
- Required fields enforced
- Status values controlled via ENUM

---

## ⚠️ Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Unknown column 'applicant_id'" | Database not synced | Run `npm run sync` |
| "Applicant with email X already exists" | Email unique constraint | Use different email |
| "This applicant has already applied" | Duplicate application | OK - prevents double apply |
| "Job posting not found" | Invalid job ID | Use valid job_posting_id |
| "Cannot send offer to rejected applicant" | Business logic | Applicant is already rejected |

---

## 📱 Frontend Components

### ApplicantForm.jsx
- Renders form to add new applicant
- Auto-deduplication handled by backend
- Shows validation errors
- Success/error toasts

### ApplicationPipeline.jsx
- Displays applications by status
- Drag/drop to update status
- Shows applicant details
- Includes "Add Applicant" button

### Recruitment.jsx
- Main page with job postings table
- "View Applications" button opens modal
- Modal contains ApplicationPipeline

---

## 🚀 Deployment Checklist

- [ ] Run `npm run sync` to create applicants table
- [ ] Backend starts without errors
- [ ] Test applicant creation endpoint
- [ ] Test applicant reuse (same email, different job)
- [ ] Test duplicate application error
- [ ] Frontend loads without errors
- [ ] "Add Applicant" form works
- [ ] Pipeline displays applications correctly
- [ ] Drag/drop status updates work
- [ ] Error messages display properly

---

## 📖 Documentation Structure

```
QUICK_START.md (5 min read) ← START HERE
    ↓
SYSTEM_ARCHITECTURE.md (visual diagrams)
    ↓
APPLICANT_DATABASE_DESIGN.md (schema details)
    ↓
APPLICANT_ENDPOINTS.md (API reference)
    ↓
APPLICANT_INTEGRATION_GUIDE.md (backend details)
FRONTEND_INTEGRATION_GUIDE.md (frontend details)
    ↓
RECRUITMENT_ERROR_MESSAGES.md (error handling)
    ↓
IMPLEMENTATION_CHECKLIST.md (detailed guide)
```

---

## 🎓 Learn More

Each documentation file contains:
- **Detailed examples** with JSON payloads
- **Error scenarios** with solutions
- **Code snippets** for common tasks
- **Visual diagrams** for architecture
- **Migration scripts** if needed
- **Testing examples** for verification

---

## ✅ Success Criteria

The system is working correctly when:

1. ✅ Backend syncs database without errors
2. ✅ "Add Applicant" form submits successfully
3. ✅ New applicant appears in pipeline
4. ✅ Same person can apply to multiple jobs
5. ✅ Duplicate application shows error
6. ✅ Drag/drop status updates work
7. ✅ Error messages are specific and helpful
8. ✅ No console errors in browser
9. ✅ No database connection errors in backend
10. ✅ All responses include applicant data

---

## 🔗 Quick Links

- **Quick Start:** [QUICK_START.md](./QUICK_START.md)
- **API Docs:** [APPLICANT_ENDPOINTS.md](./APPLICANT_ENDPOINTS.md)
- **Architecture:** [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
- **Database Design:** [APPLICANT_DATABASE_DESIGN.md](./APPLICANT_DATABASE_DESIGN.md)
- **Frontend Guide:** [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)
- **Error Reference:** [RECRUITMENT_ERROR_MESSAGES.md](./RECRUITMENT_ERROR_MESSAGES.md)

---

## 📞 Support

For questions about specific areas, refer to:
- **Schemas & Migrations** → `APPLICANT_DATABASE_DESIGN.md`
- **API Endpoints** → `APPLICANT_ENDPOINTS.md`
- **Error Handling** → `RECRUITMENT_ERROR_MESSAGES.md`
- **Frontend Implementation** → `FRONTEND_INTEGRATION_GUIDE.md`
- **Backend Logic** → `APPLICANT_INTEGRATION_GUIDE.md`
- **Visual Overview** → `SYSTEM_ARCHITECTURE.md`

---

**Last Updated:** 2026-01-17  
**Version:** 1.0  
**Status:** Ready for Implementation ✅
