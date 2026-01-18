# Implementation Checklist - Applicant Management System

## Backend Implementation ✅

### Models
- ✅ Created `Applicant` model (`src/features/recruitment/applicant.model.ts`)
- ✅ Updated `JobApplication` model with `applicant_id` FK
- ✅ Set up model associations (belongsTo/hasMany)
- ✅ Added denormalized fields for backward compatibility

### Controllers
- ✅ Updated `JobApplicationController.create()` to handle:
  - New applicant creation with auto-deduplication
  - Existing applicant reuse by ID
  - Smart duplicate checking
- ✅ Updated `getByJobPosting()` to include applicant data
- ✅ All other application endpoints updated with error messages

### Validators
- ✅ Updated validators with specific error messages
- ✅ Added date format flexibility (YYYY-MM-DD or ISO 8601)
- ✅ All required field validations in place

### Documentation
- ✅ `APPLICANT_DATABASE_DESIGN.md` - Architecture & migration
- ✅ `APPLICANT_INTEGRATION_GUIDE.md` - Backend integration guide
- ✅ `APPLICANT_ENDPOINTS.md` - Complete API reference
- ✅ `RECRUITMENT_ERROR_MESSAGES.md` - All error scenarios
- ✅ `FRONTEND_INTEGRATION_GUIDE.md` - Frontend integration

---

## Frontend Implementation ✅

### API Service (recruitment.service.js)
- ✅ Added `getApplicants()`
- ✅ Added `getApplicantById()`
- ✅ Added `getApplicantByEmail()`
- ✅ Added `createApplicant()`
- ✅ Added `updateApplicant()`
- ✅ Added `deleteApplicant()`

### API Routes (apiRoutes.js)
- ✅ Added `/v1/recruitments/applicants` routes
- ✅ Added `/v1/recruitments/applicants/:id` routes

### Components
- ✅ Updated `ApplicantForm.jsx`:
  - Better validation
  - Comments explaining auto-deduplication
  - Improved error handling

### No UI Changes Required
- ✅ Existing forms work as-is
- ✅ Existing pipeline display works as-is
- ✅ Deduplication happens transparently

---

## Database Setup ⏳

### Before Running Backend

1. **Run database sync:**
   ```bash
   npm run sync
   ```
   This will create the `applicants` table and update `job_applications` with `applicant_id` column.

2. **Verify table structure:**
   ```sql
   -- Check applicants table
   DESCRIBE applicants;
   
   -- Check job_applications table
   DESCRIBE job_applications;
   ```

### Migration (If Migrating from Old Schema)

If you have existing job_applications without applicant_id:

1. Create applicants table
2. Migrate data from job_applications:
   ```sql
   INSERT INTO applicants (name, email, phone, resume_url, cover_letter, salary_expectation, source)
   SELECT DISTINCT applicant_name, applicant_email, applicant_phone, resume_url, cover_letter, salary_expectation, 'manual'
   FROM job_applications
   WHERE applicant_email IS NOT NULL;
   ```
3. Update job_applications with applicant_id references
4. Add foreign key constraint

---

## Testing Checklist

### Backend Testing

- [ ] Start backend: `npm run dev`
- [ ] Check for errors in console
- [ ] Run sync: `npm run sync`
- [ ] Test applicant creation: `POST /applications` with new email
- [ ] Test applicant reuse: `POST /applications` with existing email
- [ ] Test duplicate application error: `POST /applications` same job + email
- [ ] Test get applications: `GET /applications/by-posting/1`
- [ ] Test status update: `PUT /applications/1/status`
- [ ] Test all error scenarios

### Frontend Testing

- [ ] Navigate to Recruitment → Job Postings
- [ ] Click "View Applications" on a job posting
- [ ] Click "Add Applicant" button
- [ ] Fill form with new email → Submit → Check success message
- [ ] Add same person to another job → Should work
- [ ] Try adding duplicate (same email + job) → Should error
- [ ] Verify application pipeline shows applicants correctly
- [ ] Test drag/drop status updates
- [ ] Verify denormalized fields display correctly

### API Testing (Postman)

```bash
# 1. Create Applicant (Option A - Auto-Dedup)
POST /api/v1/recruitments/applications
{
  "job_posting_id": 1,
  "applicant_name": "Test User",
  "applicant_email": "test@example.com",
  "applicant_phone": "08012345678",
  "salary_expectation": 500000
}

# 2. Get Applications by Job
GET /api/v1/recruitments/applications/by-posting/1

# 3. Update Status
PUT /api/v1/recruitments/applications/1/status
{
  "status": "under_review"
}

# 4. Get All Applicants
GET /api/v1/recruitments/applicants?page=1&rows=10

# 5. Create Application with Existing Applicant
POST /api/v1/recruitments/applications
{
  "job_posting_id": 2,
  "applicant_id": 1
}
```

---

## API Behavior Overview

### Create Application Flow

```
Frontend POST /applications (with applicant data)
    ↓
Backend receives request
    ↓
1. Validate job_posting_id exists
2. Check if applicant email exists
   - YES: Reuse applicant record
   - NO: Create new applicant record
3. Check if application already exists (same job + applicant)
   - YES: Return 409 Conflict error
   - NO: Continue
4. Create JobApplication with denormalized applicant fields
5. Return full response with applicant object
```

### Key Features

✅ **Auto-Deduplication**: Same email = same applicant  
✅ **Profile Reusability**: One applicant, multiple jobs  
✅ **Backward Compatible**: Denormalized fields in job_applications  
✅ **Full Data Access**: Both denormalized + full applicant object  
✅ **Error Validation**: Clear error messages for all scenarios  

---

## Files Modified/Created

### Backend
- ✅ Created: `src/features/recruitment/applicant.model.ts`
- ✅ Modified: `src/features/recruitment/job-application.model.ts`
- ✅ Modified: `src/features/recruitment/recruitment.controller.ts`
- ✅ Modified: `src/features/recruitment/recruitment.validators.ts`
- ✅ Created: `APPLICANT_DATABASE_DESIGN.md`
- ✅ Created: `APPLICANT_INTEGRATION_GUIDE.md`
- ✅ Created: `APPLICANT_ENDPOINTS.md`
- ✅ Created: `RECRUITMENT_ERROR_MESSAGES.md`
- ✅ Created: `FRONTEND_INTEGRATION_GUIDE.md`

### Frontend
- ✅ Modified: `src/api/recruitment.service.js`
- ✅ Modified: `src/api/apiRoutes.js`
- ✅ Modified: `src/components/recruitment/ApplicantForm.jsx`

---

## Next Steps

1. **Database Sync**
   ```bash
   npm run sync
   ```

2. **Start Backend**
   ```bash
   npm run dev
   ```

3. **Test Endpoints**
   - Use Postman or cURL to verify functionality
   - Check console for any errors

4. **Frontend Integration**
   - Start frontend dev server
   - Test "Add Applicant" flow
   - Verify pipeline displays correctly

5. **Monitor Logs**
   - Check backend console for SQL queries
   - Verify associations are working
   - Monitor for any model sync issues

---

## Troubleshooting

### Issue: applicant_id column not found
**Solution:** Run `npm run sync` to create the column

### Issue: Association errors in logs
**Solution:** Ensure both models are loaded before associations are set up

### Issue: Duplicate email error when shouldn't happen
**Solution:** Check if email in database differs (case, spaces, etc.)

### Issue: Denormalized fields are null
**Solution:** Ensure Applicant record is fetched before creating JobApplication

---

## Success Criteria

- ✅ Backend starts without errors
- ✅ Database sync completes successfully
- ✅ Can add new applicant to job posting
- ✅ Same person can apply to multiple jobs
- ✅ Duplicate application returns error
- ✅ Pipeline displays applications correctly
- ✅ Status updates work via drag/drop
- ✅ All API responses include applicant object
- ✅ Error messages are specific and helpful
- ✅ Frontend works without modifications

---

## Support

For detailed information, see:
- **Architecture**: `APPLICANT_DATABASE_DESIGN.md`
- **API Reference**: `APPLICANT_ENDPOINTS.md`
- **Frontend Guide**: `FRONTEND_INTEGRATION_GUIDE.md`
- **Errors**: `RECRUITMENT_ERROR_MESSAGES.md`
