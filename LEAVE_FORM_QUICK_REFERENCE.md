# Leave Request Form - Quick Reference Guide

## For Frontend Developers

### Form Fields Location
**File:** `src/components/selfservice/LeaveManagement.jsx`

### Current API Calls Made by Form

```javascript
// 1. Load employee info (on form open)
GET /api/v1/employees/{employeeId}

// 2. Load leave balance (on form open)
GET /api/v1/leaves/balance/{employeeId}

// 3. Load all employees (for dropdowns)
GET /api/v1/employees?page=1&rows=100

// 4. Submit leave request (on form submit)
POST /api/v1/leaves
Body: {
  employeeId,
  type,
  startDate,
  endDate,
  reason
}
```

### Form Fields Currently Not Being Sent
These fields are captured in the form but NOT sent to the API:

```javascript
// In formData object but not in API call:
leave_period           // "full_day", "half_day_morning", "half_day_afternoon"
selected_supervisor_id // Employee ID of supervisor
emergency_contact      // Phone number
alternative_email      // Backup email
covering_employee_id   // Employee ID covering duties
handover_notes         // Instructions for backup person

// Files captured but not uploaded:
supportingFiles[]      // Array of File objects
handoverFiles[]        // Array of File objects
```

### To Complete Implementation

1. **Update leaveService.createLeave():**
```javascript
// In src/api/services/leaveService.js or similar
static async createLeave(formData, files = {}) {
  const data = new FormData();
  
  // Add all fields
  data.append('employeeId', formData.employeeId);
  data.append('type', formData.leave_type);
  data.append('startDate', formData.start_date);
  data.append('endDate', formData.end_date);
  data.append('reason', formData.reason);
  
  // Add missing fields
  data.append('leave_period', formData.leave_period);
  data.append('supervisor_id', formData.selected_supervisor_id);
  data.append('emergency_contact', formData.emergency_contact);
  data.append('alternative_email', formData.alternative_email);
  data.append('covering_employee_id', formData.covering_employee_id);
  data.append('handover_notes', formData.handover_notes);
  
  // Add files
  if (files.supporting?.length) {
    files.supporting.forEach(f => data.append('supporting_documents', f));
  }
  if (files.handover?.length) {
    files.handover.forEach(f => data.append('handover_documents', f));
  }
  
  return axios.post('/leaves', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
```

2. **Update handleSubmit() in LeaveManagement.jsx:**
```javascript
// Around line 119, change:
await leaveService.createLeave(leaveData);

// To:
await leaveService.createLeave(formData, {
  supporting: supportingFiles,
  handover: handoverFiles
});
```

---

## For Backend Developers

### Current Leave Model
**File:** `src/features/leave/leave.model.ts`

**Current Fields:**
```typescript
id
employeeId
startDate
endDate
type
reason
status
currentApproverId
approvedBy
createdAt
updatedAt
```

### Database Changes Needed

```sql
-- Add to leaves table
ALTER TABLE leaves ADD COLUMN leave_period VARCHAR(30) DEFAULT 'full_day';
ALTER TABLE leaves ADD COLUMN supervisor_id INT;
ALTER TABLE leaves ADD COLUMN covering_employee_id INT;
ALTER TABLE leaves ADD COLUMN emergency_contact VARCHAR(20);
ALTER TABLE leaves ADD COLUMN alternative_email VARCHAR(100);
ALTER TABLE leaves ADD COLUMN handover_notes LONGTEXT;

-- Add foreign keys
ALTER TABLE leaves ADD CONSTRAINT fk_supervisor 
  FOREIGN KEY (supervisor_id) REFERENCES employees(id);
ALTER TABLE leaves ADD CONSTRAINT fk_covering_emp 
  FOREIGN KEY (covering_employee_id) REFERENCES employees(id);

-- Create documents table
CREATE TABLE leave_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  leave_id INT NOT NULL,
  document_type ENUM('supporting', 'handover'),
  file_name VARCHAR(255),
  file_size INT,
  file_path VARCHAR(500),
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leave_id) REFERENCES leaves(id) ON DELETE CASCADE
);
```

### Update Leave Controller
**File:** `src/features/leave/leave.controller.ts`

**Change create() method to accept new fields:**
```typescript
static async create(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      employeeId,
      startDate,
      endDate,
      type,
      reason,
      leave_period,
      supervisor_id,
      covering_employee_id,
      emergency_contact,
      alternative_email,
      handover_notes
    } = req.body;

    const leave = await Leave.create({
      employeeId,
      startDate,
      endDate,
      type,
      reason,
      leave_period,
      supervisor_id,
      covering_employee_id,
      emergency_contact,
      alternative_email,
      handover_notes,
      status: 'pending',
    });

    // Handle file uploads
    if (req.files) {
      const documents = req.files.map(file => ({
        leave_id: leave.id,
        document_type: file.fieldname.includes('supporting') ? 'supporting' : 'handover',
        file_name: file.originalname,
        file_size: file.size,
        file_path: file.path,
        mime_type: file.mimetype
      }));
      await LeaveDocument.bulkCreate(documents);
    }

    const createdLeave = await Leave.findByPk(leave.id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: Employee, as: 'supervisor' },
        { model: Employee, as: 'coveringEmployee' },
        { model: LeaveDocument, as: 'documents' }
      ]
    });

    res.status(201).json({ 
      data: createdLeave, 
      message: 'Leave request created successfully' 
    });
  } catch (error) {
    logger.error(`Error creating leave: ${error}`);
    next(error);
  }
}
```

### Add Relationships to Leave Model
```typescript
// In leave.model.ts

Leave.belongsTo(Employee, { 
  foreignKey: 'supervisor_id', 
  as: 'supervisor' 
});

Leave.belongsTo(Employee, { 
  foreignKey: 'covering_employee_id', 
  as: 'coveringEmployee' 
});

Leave.hasMany(LeaveDocument, { 
  foreignKey: 'leave_id', 
  as: 'documents' 
});
```

### Create Validation Schema
**File:** `src/features/leave/leave.validators.ts`

```typescript
const createLeaveSchema = z.object({
  employeeId: z.number().positive(),
  type: z.enum(['vacation', 'sick', 'personal', 'maternity', 'paternity']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
  leave_period: z.enum(['full_day', 'half_day_morning', 'half_day_afternoon']).optional(),
  supervisor_id: z.number().optional(),
  covering_employee_id: z.number().optional(),
  emergency_contact: z.string().regex(/^\+?[0-9]{10,}$/).optional(),
  alternative_email: z.string().email().optional(),
  handover_notes: z.string().optional()
});
```

### Update Route with File Upload Middleware
**File:** `src/features/leave/leave.routes.ts`

```typescript
import { fileUploadMiddleware } from '../../middlewares/file-upload';

router.post(
  '/',
  validateAuthToken,
  fileUploadMiddleware.array('documents', 10),
  validateCreateLeave,
  LeaveController.create
);
```

---

## Quick Status Check

### What's Working ✓
- Frontend captures all form data
- Backend receives basic leave info (5 fields)
- Employee info endpoints exist
- Leave balance calculation works
- Approval workflow implemented

### What's Not Working ✗
- Backend doesn't accept 7 form fields
- No file upload handling
- Database missing handover columns
- Frontend doesn't send extra fields to API

### To Get It Working
1. Create database migration (2 hours)
2. Update Leave model with new fields (1 hour)
3. Update controller & routes (2 hours)
4. Add file upload middleware (1 hour)
5. Update frontend API service (1 hour)
6. Update frontend form handler (30 min)
7. Test end-to-end (2 hours)

**Total: ~10 hours of work**

---

## Testing the Complete Flow

### 1. Test with cURL (after backend is ready)
```bash
curl -X POST http://localhost:3000/api/v1/leaves \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "employeeId=1" \
  -F "type=vacation" \
  -F "startDate=2024-02-15" \
  -F "endDate=2024-02-20" \
  -F "reason=Family vacation" \
  -F "leave_period=full_day" \
  -F "supervisor_id=2" \
  -F "covering_employee_id=3" \
  -F "emergency_contact=+1234567890" \
  -F "alternative_email=backup@example.com" \
  -F "handover_notes=Files in shared drive" \
  -F "supporting_documents=@cert.pdf" \
  -F "handover_documents=@handover.pdf"
```

### 2. Test Response
```json
{
  "data": {
    "id": 123,
    "employeeId": 1,
    "type": "vacation",
    "leave_period": "full_day",
    "startDate": "2024-02-15",
    "endDate": "2024-02-20",
    "supervisor_id": 2,
    "covering_employee_id": 3,
    "emergency_contact": "+1234567890",
    "alternative_email": "backup@example.com",
    "handover_notes": "Files in shared drive",
    "documents": [
      {
        "id": 1,
        "document_type": "supporting",
        "file_name": "cert.pdf"
      },
      {
        "id": 2,
        "document_type": "handover",
        "file_name": "handover.pdf"
      }
    ],
    "status": "pending_supervisor_approval"
  }
}
```

### 3. Verify in Database
```sql
SELECT * FROM leaves WHERE id = 123;
SELECT * FROM leave_documents WHERE leave_id = 123;
```

---

## File References

### Frontend Files
- **Form Component:** `src/components/selfservice/LeaveManagement.jsx`
- **Page Component:** `src/pages/LeaveManagement.jsx`
- **Form Fields:** Lines 29-40 (formData object)
- **Form Submission:** Lines 111-117 (leaveService call)
- **File Uploaders:** Lines 187-231 (FileUploader component)

### Backend Files
- **Controller:** `src/features/leave/leave.controller.ts`
- **Model:** `src/features/leave/leave.model.ts`
- **Routes:** `src/features/leave/leave.routes.ts`
- **Validators:** `src/features/leave/leave.validators.ts`

---

## Dependencies Needed

### Frontend
- `axios` (already have)
- `FormData` (native browser API)
- `react` (already have)

### Backend
- `multer` (file uploads) - might need to install
- `express` (already have)
- `sequelize` (already have)
- `zod` (validation, already have)

---

## Common Issues & Solutions

### Issue: "Form data not sent to backend"
**Solution:** Make sure `leaveService.createLeave()` includes all fields in the API call

### Issue: "Files not uploading"
**Solution:** Need to use `FormData` and set `Content-Type: multipart/form-data` header

### Issue: "Foreign key constraint fails"
**Solution:** Make sure supervisor_id and covering_employee_id reference valid employee IDs

### Issue: "New fields return null from API"
**Solution:** Database migration didn't run or Leave model doesn't include new fields

---

## Next Steps

1. **Immediate:** Create migration file and apply it
2. **Short term:** Update backend model and controller
3. **Medium term:** Update frontend service and form handler
4. **Testing:** Verify end-to-end flow with complete data
5. **Documentation:** Update API docs with new fields

---

For detailed information, see:
- `LEAVE_REQUEST_FORM_ANALYSIS.md` - Field-by-field breakdown
- `LEAVE_FORM_BACKEND_INTEGRATION.md` - Complete implementation guide
- `LEAVE_FORM_IMPLEMENTATION_STATUS.md` - Full status and timeline
