# Quick Start Guide - Applicant Management Integration

## 5-Minute Setup

### 1. Backend Setup
```bash
# Sync database to create applicants table
npm run sync

# Start backend
npm run dev
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd orbit360-FE

# Start frontend
npm run dev
```

### 3. Test the Flow

**Open browser to:** `http://localhost:5173` (or your frontend port)

1. Navigate to **Recruitment** → **Job Postings**
2. Click **"View Applications"** on any job posting
3. Click **"Add Applicant"** button
4. Fill form:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `08012345678`
   - Salary: `500000`
5. Click **"Save Applicant"**
6. Should see success toast: **"Applicant added successfully!"**
7. New applicant card appears in **Submitted** column

---

## How It Works

### Adding an Applicant

```
User Form → Backend Auto-Deduplication → Database
    ↓             ↓                           ↓
Name         Check if email exists      If NO: Create Applicant
Email        in applicants table        If YES: Reuse Applicant
Phone        ↓                               ↓
Salary       Create JobApplication Record
Resume       ↓
             Return Success
```

**Key Point:** Same email = same applicant profile. Can apply to multiple jobs!

---

## API Quick Reference

### Create Application (Frontend does this)
```bash
POST /api/v1/recruitments/applications
{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "08012345678",
  "salary_expectation": 500000
}
```

### Get Applications for Job
```bash
GET /api/v1/recruitments/applications/by-posting/1
```

### Update Status (Drag/Drop)
```bash
PUT /api/v1/recruitments/applications/1/status
{ "status": "under_review" }
```

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Database sync completes
- [ ] Can add new applicant to job
- [ ] Application appears in pipeline
- [ ] Same person applies to different job (should work)
- [ ] Try duplicate (same job + email) - should error
- [ ] Drag/drop status updates work
- [ ] Toast messages display correctly
- [ ] No console errors

---

## Common Issues & Fixes

### Issue: "Unknown column 'applicant_id'"
**Fix:** Run `npm run sync`

### Issue: "Applicant not found"
**Fix:** Ensure applicant_id field exists in request

### Issue: "Duplicate application" error
**Fix:** This is correct behavior - same person can't apply twice to same job

### Issue: Frontend form not submitting
**Fix:** Check browser console for validation errors

### Issue: Empty pipeline even after adding applicant
**Fix:** Refresh page or close/reopen modal

---

## Key Files

### Backend
- `src/features/recruitment/applicant.model.ts` - Applicant profile model
- `src/features/recruitment/job-application.model.ts` - Application (junction table)
- `src/features/recruitment/recruitment.controller.ts` - Business logic
- `APPLICANT_ENDPOINTS.md` - Full API documentation

### Frontend
- `src/api/recruitment.service.js` - API methods
- `src/api/apiRoutes.js` - Endpoint URLs
- `src/components/recruitment/ApplicantForm.jsx` - Form component

### Documentation
- `SYSTEM_ARCHITECTURE.md` - Visual diagrams
- `APPLICANT_DATABASE_DESIGN.md` - Database design
- `APPLICANT_ENDPOINTS.md` - API reference
- `FRONTEND_INTEGRATION_GUIDE.md` - Frontend guide
- `IMPLEMENTATION_CHECKLIST.md` - Detailed checklist

---

## Architecture in One Picture

```
FRONTEND                    BACKEND                    DATABASE
────────────────────────────────────────────────────────────────

Job Table
[View App] ──→  Modal
                 │
                 ├─→ ApplicationPipeline
                 │   [Submitted] [Review] [Shortlisted]
                 │
                 └─→ [Add Applicant]
                      │
                      └─→ Form (Name, Email, Phone)
                          POST /applications
                          │
                          └──────→ Check if email exists
                                   YES: Reuse Applicant ──→ applicants table
                                   NO:  Create Applicant ─→ applicants table
                                   │
                                   └──→ Create JobApplication
                                        │
                                        └──→ job_applications table
                                             │
                                             └──→ Response with both objects
                                                  │
                                                  ↓
                          Success Toast
                          Pipeline refreshes
                          New card appears
```

---

## Response Example

When you add an applicant, backend returns:

```json
{
  "data": {
    "id": 1,
    "job_posting_id": 1,
    "applicant_id": 5,
    "status": "applied",
    "applicant_name": "John Doe",
    "applicant_email": "john@example.com",
    
    // Full applicant object
    "applicant": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "08012345678",
      ...
    }
  },
  "message": "Applicant added successfully"
}
```

**Note:** You can use either the denormalized fields (`applicant_name`, etc.) OR the full `applicant` object in your frontend.

---

## Next Level Features (Not Implemented Yet)

The new structure enables:
1. **View All Applicant's Jobs** - See all jobs they applied to
2. **Reuse Applicant Profile** - Link to existing applicant instead of creating new
3. **Bulk Actions** - Move all applications of one person to status
4. **Applicant Search** - Search applicants across all jobs
5. **Resume Management** - Centralized resume per applicant

---

## Troubleshooting Steps

1. **Check Backend Console**
   ```
   npm run dev
   Look for errors or SQL queries
   ```

2. **Check Frontend Console**
   ```
   Open browser dev tools (F12)
   Look for API errors in Network tab
   ```

3. **Verify Database**
   ```sql
   SHOW TABLES;
   DESCRIBE applicants;
   DESCRIBE job_applications;
   ```

4. **Test with cURL**
   ```bash
   curl -X POST http://localhost:3000/api/v1/recruitments/applications \
     -H "Content-Type: application/json" \
     -d '{"job_posting_id":1,"applicant_name":"Test","applicant_email":"test@example.com","applicant_phone":"08012345678"}'
   ```

---

## Support Documents

| Document | Purpose |
|----------|---------|
| `SYSTEM_ARCHITECTURE.md` | Visual diagrams and data flow |
| `APPLICANT_DATABASE_DESIGN.md` | Schema design and migrations |
| `APPLICANT_ENDPOINTS.md` | Complete API reference |
| `APPLICANT_INTEGRATION_GUIDE.md` | Backend integration details |
| `FRONTEND_INTEGRATION_GUIDE.md` | Frontend integration details |
| `RECRUITMENT_ERROR_MESSAGES.md` | All error scenarios |
| `IMPLEMENTATION_CHECKLIST.md` | Detailed implementation guide |

---

## Success Indicators

✅ **System Working When:**
- Backend starts with no sync errors
- Can add applicant to job
- Same person can apply to multiple jobs
- Pipeline shows correct applicants
- Drag/drop status updates work
- Error messages are clear and specific

---

## One-Command Test

```bash
# Add applicant (assumes job_posting_id=1 exists)
curl -X POST http://localhost:3000/api/v1/recruitments/applications \
  -H "Content-Type: application/json" \
  -d '{
    "job_posting_id": 1,
    "applicant_name": "Test User",
    "applicant_email": "test'$(date +%s)'@example.com",
    "applicant_phone": "08012345678",
    "salary_expectation": 500000
  }'

# Should return 201 Created with applicant data
```

---

**You're all set! The system is ready to use.** 🎉
