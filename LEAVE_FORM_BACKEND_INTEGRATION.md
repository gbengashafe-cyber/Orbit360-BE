# Leave Request Form - Backend Integration Guide

## Overview
This document maps the frontend leave request form fields to the corresponding backend endpoints and database models.

---

## Frontend Form Data Flow

### 1. Form Initialization - Load Employee Information

When the leave form is opened, the frontend calls these endpoints to populate the form:

#### Step 1a: Fetch Current Employee Information
```
GET /api/v1/employees/{currentEmployeeId}
```

**Purpose:** Pre-fill employee information section
- Full Name: `firstName + lastName`
- Employee ID: `employeeId`
- Department: `departmentName`
- Supervisor: `supervisor_name`

**Frontend Code Reference:** `LeaveManagement.jsx` lines 86-92 (loadDataForEmployee)

---

#### Step 1b: Fetch Employee Leave Balance
```
GET /api/v1/leaves/balance/{employeeId}
```

**Purpose:** Display current leave balance and validate requested days

**Response Mapping:**
```javascript
// Frontend calculation
leaveBalance = leaveBalance.find(b => b.leaveType === 'vacation')?.remaining || 0
// Display: "Your current annual leave balance is {leaveBalance} days"
```

**Frontend Code Reference:** `LeaveManagement.jsx` lines 42-53 (calculateLeaveBalance)

---

#### Step 1c: Fetch All Employees List
```
GET /api/v1/employees?page=1&rows=100
```

**Purpose:** Populate dropdown lists for:
- Approving Supervisor selector
- Backup/Reliever selector

**Frontend Code Reference:** `LeaveManagement.jsx` lines 59-61 (loadData)

---

## Leave Request Form Submission

### Current Form Fields (What's Captured)

| Field | Form ID | Type | Required | Captured |
|-------|---------|------|----------|----------|
| Leave Type | `leave_type` | Select | ✓ Yes | ✓ Yes |
| Leave Period | `leave_period` | Select | ✗ No | ✓ Yes |
| Start Date | `start_date` | Date | ✓ Yes | ✓ Yes |
| End Date | `end_date` | Date | ✓ Yes | ✓ Yes |
| Reason | `reason` | Textarea | ✗ No | ✓ Yes |
| Supervisor ID | `selected_supervisor_id` | Select | ✗ No | ✓ Yes |
| Emergency Contact | `emergency_contact` | Text | ✗ No | ✓ Yes |
| Alt Email | `alternative_email` | Email | ✗ No | ✓ Yes |
| Covering Employee | `covering_employee_id` | Select | ✗ No | ✓ Yes |
| Handover Notes | `handover_notes` | Textarea | ✗ No | ✓ Yes |
| Supporting Docs | `supporting_document` | Files | ✗ No | ✓ Yes |
| Handover Docs | `handover_document` | Files | ✗ No | ✓ Yes |

---

### Current Form Submission

#### API Endpoint Called
```
POST /api/v1/leaves
```

#### Current Request Body (What's Actually Sent)
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "reason": "Family vacation"
}
```

**Frontend Code Reference:** `LeaveManagement.jsx` lines 111-117 (handleSubmit)

---

## Gap Analysis: Form vs API

### Fields Captured but NOT Sent to Backend

1. **leave_period** (Full Day vs Half Day)
   - Frontend: Captured in `formData.leave_period`
   - Backend: Not sent in API request
   - Status: Missing implementation

2. **selected_supervisor_id** (Approving Supervisor)
   - Frontend: Captured in `formData.selected_supervisor_id`
   - Backend: Not sent in API request
   - Status: Missing implementation

3. **emergency_contact** (Contact Number)
   - Frontend: Captured in `formData.emergency_contact`
   - Backend: Not sent in API request
   - Status: Missing implementation

4. **alternative_email** (Alternative Email)
   - Frontend: Captured in `formData.alternative_email`
   - Backend: Not sent in API request
   - Status: Missing implementation

5. **covering_employee_id** (Backup/Reliever)
   - Frontend: Captured in `formData.covering_employee_id`
   - Backend: Not sent in API request
   - Status: Missing implementation

6. **handover_notes** (Handover Instructions)
   - Frontend: Captured in `formData.handover_notes`
   - Backend: Not sent in API request
   - Status: Missing implementation

7. **Supporting Documents** (File uploads)
   - Frontend: Captured in `supportingFiles` state
   - Backend: Not sent in API request
   - Status: Missing implementation

8. **Handover Documents** (File uploads)
   - Frontend: Captured in `handoverFiles` state
   - Backend: Not sent in API request
   - Status: Missing implementation

---

## Recommended Backend Implementation

### 1. Update Leave Model Schema

Add these fields to the `Leave` table:

```sql
ALTER TABLE leaves ADD COLUMN leave_period ENUM('full_day', 'half_day_morning', 'half_day_afternoon') DEFAULT 'full_day';
ALTER TABLE leaves ADD COLUMN supervisor_id INT REFERENCES employees(id);
ALTER TABLE leaves ADD COLUMN covering_employee_id INT REFERENCES employees(id);
ALTER TABLE leaves ADD COLUMN emergency_contact VARCHAR(20);
ALTER TABLE leaves ADD COLUMN alternative_email VARCHAR(100);
ALTER TABLE leaves ADD COLUMN handover_notes TEXT;
```

---

### 2. Create Supporting Documents Model

```typescript
// File: leave-document.model.ts
export class LeaveDocument extends Model {
  declare id: number;
  declare leaveId: number;
  declare documentType: 'supporting' | 'handover';
  declare documentUrl: string;
  declare fileName: string;
  declare fileSize: number;
  declare mimeType: string;
  declare uploadedAt: Date;
}

LeaveDocument.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  leaveId: { type: DataTypes.INTEGER, allowNull: false },
  documentType: { type: DataTypes.ENUM('supporting', 'handover'), allowNull: false },
  documentUrl: { type: DataTypes.STRING, allowNull: false },
  fileName: { type: DataTypes.STRING, allowNull: false },
  fileSize: { type: DataTypes.INTEGER },
  mimeType: { type: DataTypes.STRING },
  uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize: db });

Leave.hasMany(LeaveDocument, { foreignKey: 'leaveId', as: 'documents' });
```

---

### 3. Update Leave Controller

Modify `leave.controller.ts`:

```typescript
static async create(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      employeeId,
      startDate,
      endDate,
      type,
      reason,
      leave_period,          // NEW
      supervisor_id,         // NEW
      covering_employee_id,  // NEW
      emergency_contact,     // NEW
      alternative_email,     // NEW
      handover_notes         // NEW
    } = req.body;

    const leave = await Leave.create({
      employeeId,
      startDate,
      endDate,
      type,
      reason,
      leave_period,          // NEW
      supervisor_id,         // NEW
      covering_employee_id,  // NEW
      emergency_contact,     // NEW
      alternative_email,     // NEW
      handover_notes,        // NEW
      status: 'pending',
    });

    // Handle file uploads separately
    if (req.files) {
      await handleFileUploads(leave.id, req.files);
    }

    res.status(201).json({ data: leave, message: 'Leave request created successfully' });
  } catch (error) {
    logger.error(`Error creating leave: ${error}`);
    next(error);
  }
}
```

---

### 4. Update Leave Routes

Modify `leave.routes.ts`:

```typescript
import { fileUploadMiddleware } from '../../middlewares/file-upload';

// POST endpoint with file upload handling
router.post(
  '/',
  validateAuthToken,
  fileUploadMiddleware.array('documents', 10),  // Max 10 files
  validateCreateLeave,
  LeaveController.create
);
```

---

### 5. Update Leave Validation Schema

Create/Update `leave.validators.ts`:

```typescript
const createLeaveSchema = z.object({
  body: z.object({
    employeeId: z.number().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    type: z.enum(['vacation', 'sick', 'personal', 'maternity', 'paternity']),
    reason: z.string().optional(),
    leave_period: z.enum(['full_day', 'half_day_morning', 'half_day_afternoon']).optional(),
    supervisor_id: z.number().optional(),
    covering_employee_id: z.number().optional(),
    emergency_contact: z.string().phone().optional(),
    alternative_email: z.string().email().optional(),
    handover_notes: z.string().optional(),
  }),
  files: z.array(
    z.object({
      fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype: z.string(),
      destination: z.string(),
      filename: z.string(),
      path: z.string(),
      size: z.number().max(5242880), // 5MB max
    })
  ).optional(),
});
```

---

### 6. Frontend API Service Update

Update `leaveService.createLeave()` in frontend:

```javascript
static async createLeave(formData, files = {}) {
  const data = new FormData();
  
  // Add form fields
  data.append('employeeId', formData.employeeId);
  data.append('type', formData.leave_type);
  data.append('startDate', formData.start_date);
  data.append('endDate', formData.end_date);
  data.append('reason', formData.reason);
  
  // Add new fields
  data.append('leave_period', formData.leave_period);
  data.append('supervisor_id', formData.selected_supervisor_id);
  data.append('covering_employee_id', formData.covering_employee_id);
  data.append('emergency_contact', formData.emergency_contact);
  data.append('alternative_email', formData.alternative_email);
  data.append('handover_notes', formData.handover_notes);
  
  // Add files
  if (files.supporting?.length) {
    files.supporting.forEach((file, index) => {
      data.append('supporting_documents', file);
    });
  }
  
  if (files.handover?.length) {
    files.handover.forEach((file, index) => {
      data.append('handover_documents', file);
    });
  }
  
  return axios.post(`${API_BASE}/leaves`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
```

---

## Frontend Implementation Checklist

- [ ] Update `leaveService.createLeave()` to send all form fields
- [ ] Add file upload handling to form submission
- [ ] Update error handling for file upload failures
- [ ] Add progress indicator for file uploads
- [ ] Implement file validation (type, size)
- [ ] Update success message to reflect all submitted data
- [ ] Add loading state while uploading files

---

## Backend Implementation Checklist

- [ ] Add new fields to Leave model
- [ ] Create LeaveDocument model for file storage
- [ ] Update Leave controller to handle new fields
- [ ] Implement file upload endpoint
- [ ] Add validation for all new fields
- [ ] Update Leave routes with file upload middleware
- [ ] Create database migration
- [ ] Update API response to include new fields
- [ ] Add file retrieval endpoints
- [ ] Implement file cleanup on leave deletion
- [ ] Add audit trail for document uploads

---

## Database Migration Example

```sql
-- Add new columns to leaves table
ALTER TABLE leaves ADD COLUMN leave_period VARCHAR(30) DEFAULT 'full_day';
ALTER TABLE leaves ADD COLUMN supervisor_id INT;
ALTER TABLE leaves ADD COLUMN covering_employee_id INT;
ALTER TABLE leaves ADD COLUMN emergency_contact VARCHAR(20);
ALTER TABLE leaves ADD COLUMN alternative_email VARCHAR(100);
ALTER TABLE leaves ADD COLUMN handover_notes LONGTEXT;

-- Add foreign key constraints
ALTER TABLE leaves ADD CONSTRAINT fk_supervisor_id 
  FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE leaves ADD CONSTRAINT fk_covering_employee_id 
  FOREIGN KEY (covering_employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Create leave_documents table
CREATE TABLE leave_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leave_id INT NOT NULL,
  document_type ENUM('supporting', 'handover') NOT NULL,
  document_url VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (leave_id) REFERENCES leaves(id) ON DELETE CASCADE,
  INDEX idx_leave_id (leave_id),
  INDEX idx_document_type (document_type)
);
```

---

## API Response After Implementation

### GET `/api/v1/leaves/{id}`

```json
{
  "data": {
    "id": 1,
    "employeeId": 1,
    "type": "vacation",
    "leave_period": "full_day",
    "startDate": "2024-02-15",
    "endDate": "2024-02-20",
    "reason": "Family vacation",
    "supervisor_id": 2,
    "supervisor": {
      "id": 2,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com"
    },
    "covering_employee_id": 3,
    "covering_employee": {
      "id": 3,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "emergency_contact": "+1234567890",
    "alternative_email": "zebedee.alt@example.com",
    "handover_notes": "Project files in shared drive. Contact for urgent issues.",
    "documents": [
      {
        "id": 1,
        "document_type": "handover",
        "file_name": "project-handover.pdf",
        "file_size": 2048576,
        "document_url": "/api/v1/leaves/1/documents/1",
        "uploaded_at": "2024-02-10T10:00:00Z"
      }
    ],
    "status": "pending_supervisor_approval",
    "created_at": "2024-02-10T10:00:00Z",
    "updated_at": "2024-02-10T10:00:00Z"
  }
}
```

---

## Testing Endpoints

### 1. Test Employee Information Fetch
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/v1/employees/1
```

### 2. Test Leave Balance Fetch
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/v1/leaves/balance/1
```

### 3. Test Employee List Fetch
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/v1/employees?page=1&rows=100
```

### 4. Test Leave Request with Files
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -F "employeeId=1" \
  -F "type=vacation" \
  -F "startDate=2024-02-15" \
  -F "endDate=2024-02-20" \
  -F "reason=Family vacation" \
  -F "leave_period=full_day" \
  -F "supervisor_id=2" \
  -F "covering_employee_id=3" \
  -F "emergency_contact=+1234567890" \
  -F "alternative_email=zebedee.alt@example.com" \
  -F "handover_notes=Project files in shared drive" \
  -F "supporting_documents=@medical-cert.pdf" \
  -F "handover_documents=@project-handover.pdf" \
  https://api.example.com/api/v1/leaves
```

---

## Security Considerations

1. **File Upload Security:**
   - Validate file types (whitelist: pdf, doc, docx, jpg, png, xlsx)
   - Enforce file size limits (5MB per file)
   - Scan uploaded files for malware
   - Store files outside web root
   - Generate random file names to prevent path traversal

2. **Data Validation:**
   - Validate supervisor_id and covering_employee_id exist and are active
   - Validate dates (end_date >= start_date)
   - Validate phone format for emergency_contact
   - Validate email format for alternative_email

3. **Authorization:**
   - Ensure user can only submit leaves for themselves
   - Admin/HR can submit on behalf of others
   - Only assigned approvers can view leave requests

4. **Data Privacy:**
   - Don't expose alternative emails/phone numbers in lists
   - Restrict document access to relevant parties
   - Implement audit logging for all changes

---

## Summary

The frontend leave request form is **feature-complete** but only sends 5 of 12+ fields to the backend. The backend needs to be extended to:

1. ✓ Accept all form fields via updated POST endpoint
2. ✓ Store files and generate accessible URLs
3. ✓ Validate all new fields
4. ✓ Return complete leave request with all fields and relationships

Once implemented, the system will provide a complete handover workflow with supervisor assignment, backup coverage planning, and document management.
