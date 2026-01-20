# Leave Request Form - Frontend vs Backend Analysis

## Overview
The frontend leave request form (`LeaveManagement.jsx` and `LeaveRequestForm.jsx`) contains all the fields documented in `ALL_CREATE_ENDPOINTS.md`. Below is a detailed comparison of the form structure with the implementation.

---

## Frontend Form Structure

### 1. Employee Information (Read-Only Display)
- **Full Name** - Displayed from `employee.firstName` / `employee.first_name`
- **Employee ID** - Displayed from `employee.id` / `employee.employee_id`
- **Department** - Displayed from `employee.department`
- **Supervisor** - Displayed from `employee.supervisor_name`

**Form Location:** Lines 388-393 in `LeaveManagement.jsx`

---

### 2. Leave Details Section

#### Type of Leave
- **Field ID:** `leave_type`
- **Type:** Select dropdown
- **Default:** Empty (required)
- **Options:**
  - Annual Leave (value: `annual`)
  - Sick Leave (value: `sick`)
  - Maternity Leave (value: `maternity`)
  - Paternity Leave (value: `paternity`)
  - Compassionate Leave (value: `compassionate`)
  - Study Leave (value: `study`)
  - Unpaid Leave (value: `unpaid`)

**Form Location:** Lines 408-422 in `LeaveManagement.jsx`
**API Field:** `type` (sent as `formData.leave_type` in form, mapped to `type` in API call)

---

#### Leave Period
- **Field ID:** `leave_period`
- **Type:** Select dropdown
- **Default:** `full_day`
- **Options:**
  - Full Day(s) (value: `full_day`)
  - Half Day - Morning (value: `half_day_morning`)
  - Half Day - Afternoon (value: `half_day_afternoon`)

**Form Location:** Lines 423-433 in `LeaveManagement.jsx`
**Note:** This field is captured in form but NOT sent to the backend API (Line 111-117)

---

#### Dates
- **Start Date**
  - **Field ID:** `start_date`
  - **Type:** HTML date input (format: YYYY-MM-DD)
  - **Required:** Yes
  - **Location:** Lines 437-440

- **End Date**
  - **Field ID:** `end_date`
  - **Type:** HTML date input (format: YYYY-MM-DD)
  - **Required:** Yes
  - **Location:** Lines 441-444

- **Total Days**
  - **Type:** Read-only calculated field
  - **Calculation:** `calculateDays()` function (Lines 85-96)
  - **Formula:** 
    - For same-day half-day: 0.5 days
    - For multiple days: `ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1`
  - **Display:** Read-only input with gray background
  - **Location:** Lines 445-448

---

#### Reason for Leave
- **Field ID:** `reason`
- **Type:** Textarea
- **Required:** No
- **Placeholder:** "Provide a brief reason for your leave request..."
- **Rows:** 3
- **Location:** Lines 451-454

**API Mapping:** Sent as `reason` in API call

---

### 3. Supporting Documents Section

#### Supporting Document(s)
- **Field ID:** `supporting_document`
- **Type:** File upload (multiple files allowed)
- **Component:** `FileUploader` (Lines 187-231)
- **Specifications:**
  - Multiple files allowed
  - Max 5MB per file (noted in description)
  - Dashed border with upload icon
  - File preview with size formatting
  - Remove button per file

**Form Location:** Lines 456-462
**Note:** Files are captured in `supportingFiles` state but NOT sent to backend API

**Description:** "e.g., medical certificate for sick leave, travel itinerary, etc. (Max 5MB per file)"

---

### 4. Handover & Backup Section

#### Approving Supervisor
- **Field ID:** `selected_supervisor_id`
- **Type:** Select dropdown (employee list)
- **Placeholder:** "Select your direct supervisor"
- **Options:** Populated from all employees list
- **Display Format:** `{first_name} {last_name} - {position}`
- **Location:** Lines 468-478

**Note:** Captured in form but NOT sent to backend API

---

#### Contact Number (During Leave)
- **Field ID:** `emergency_contact`
- **Type:** Text input
- **Default:** Pre-filled from `employee.phone`
- **Placeholder:** "Your phone number while on leave"
- **Location:** Lines 481-484

**Note:** Captured in form but NOT sent to backend API

---

#### Alternative Email
- **Field ID:** `alternative_email`
- **Type:** Email input
- **Placeholder:** "Alternative email if applicable"
- **Location:** Lines 485-488

**Note:** Captured in form but NOT sent to backend API

---

#### Backup/Reliever Name
- **Field ID:** `covering_employee_id`
- **Type:** Select dropdown (employee list)
- **Placeholder:** "Select employee to cover your duties"
- **Options:** Populated from all employees list
- **Display Format:** `{first_name} {last_name} - {department}`
- **Location:** Lines 491-501

**Note:** Captured in form but NOT sent to backend API

---

#### Handover Notes
- **Field ID:** `handover_notes`
- **Type:** Textarea
- **Placeholder:** "Provide detailed instructions for the person covering your duties..."
- **Rows:** 4
- **Location:** Lines 503-512

**Note:** Captured in form but NOT sent to backend API

---

#### Handover Document(s)
- **Field ID:** `handover_document`
- **Type:** File upload (multiple files allowed)
- **Component:** `FileUploader`
- **Specifications:** Same as Supporting Documents
- **Description:** "Attach any files relevant to your handover. (Max 5MB per file)"
- **Location:** Lines 514-520

**Note:** Files are captured but NOT sent to backend API

---

## Backend API Integration

### Current API Implementation
**Location:** `leaveService.createLeave()` (Lines 119)

**Fields Currently Sent to Backend:**
```javascript
{
  employeeId: employee.id,
  type: formData.leave_type,
  startDate: formData.start_date,
  endDate: formData.end_date,
  reason: formData.reason
}
```

**Fields NOT Currently Sent:**
- `leave_period` (Full Day vs Half Day)
- `selected_supervisor_id` (Approving Supervisor)
- `emergency_contact` (Contact Number)
- `alternative_email` (Alternative Email)
- `covering_employee_id` (Backup/Reliever)
- `handover_notes` (Handover Instructions)
- `supportingFiles` (Supporting Documents)
- `handoverFiles` (Handover Documents)

---

## Form Validation

### Current Validation
**Location:** Lines 100-106 in `LeaveManagement.jsx`

**Validations Implemented:**
1. Required fields check at submit (Lines 42-45 in `LeaveRequestForm.jsx`)
2. Vacation leave balance check (Lines 103-106)
   - Prevents submitting if requested days exceed available balance
   - Shows error: `"Insufficient leave balance. Available: ${leaveBalance} days, Requested: ${daysRequested} days."`

### Missing Validations
- No validation for end date < start date
- No validation for past dates
- No validation for conflicting leave periods
- No file size validation (only noted in UI)
- No file type validation
- No file count limits
- No mandatory fields beyond leave_type, start_date, end_date (marked with *)

---

## UI Components Used

| Component | Purpose | Location |
|-----------|---------|----------|
| `Card` | Container sections | Multiple |
| `Input` | Text/date inputs | Date, phone, email fields |
| `Select/SelectTrigger/SelectContent` | Dropdowns | Leave type, period, supervisor, etc. |
| `Textarea` | Multi-line text | Reason, handover notes |
| `Label` | Field labels | All form fields |
| `Button` | Submit/Cancel actions | Lines 523-533 |
| `Badge` | Status indicators | Leave request table |
| `Table` | List leave requests | Lines 309-366 |
| `Dialog/DialogContent` | Modal form | Lines 249-250, 368-537 |
| `Alert/AlertDescription` | Info messages | Info and warning alerts |
| `FileUploader` | Custom file upload | Custom component Lines 187-231 |

---

## Leave Balance Calculation

**Location:** `calculateLeaveBalance()` function (Lines 42-53)

**Formula:**
```javascript
approvedAnnualLeave = approved requests where type === 'vacation'
                      .map(r => days between start and end)
                      .sum()

entitlement = employee.annual_leave_entitlement || 21

balance = entitlement - approvedAnnualLeave
```

**Display:** Updated in Alert box (Lines 396-401) showing current balance

---

## Recommendations for Backend Integration

### 1. Extend API to Accept Additional Fields
The API should be updated to accept and store:
- `leave_period` (full_day, half_day_morning, half_day_afternoon)
- `supervisor_id` (selected approving supervisor)
- `emergency_contact` (phone during leave)
- `alternative_email` (backup email)
- `covering_employee_id` (who will handle duties)
- `handover_notes` (instructions for reliever)

### 2. Implement File Upload Handling
- Create separate endpoints for document uploads
- Link supporting documents to leave request
- Link handover documents to leave request
- Implement file size validation on backend

### 3. Add Validation Rules
- Validate end_date > start_date
- Prevent leaves in the past
- Check for overlapping leave periods
- Validate file types and sizes

### 4. Update Leave Request Model
Should include fields for:
- `leave_period` (enum: full_day, half_day_morning, half_day_afternoon)
- `supporting_documents` (array of file references)
- `handover_documents` (array of file references)
- `supervisor_id` (foreign key)
- `covering_employee_id` (foreign key)
- `handover_notes` (text)
- `emergency_contact` (phone)
- `alternative_email` (email)

---

## Form State Variables

**Main Form Data Object (Lines 29-40):**
```javascript
{
  leave_type: '',
  start_date: '',
  end_date: '',
  leave_period: 'full_day',
  reason: '',
  emergency_contact: employee.phone || '',
  alternative_email: '',
  handover_notes: '',
  covering_employee_id: '',
  selected_supervisor_id: ''
}
```

**Additional State:**
- `handoverFiles: []` - File objects for handover documents
- `supportingFiles: []` - File objects for supporting documents
- `leaveBalance: 0` - Calculated available leave days
- `leaveRequests: []` - User's submitted requests
- `employees: []` - All employees for dropdowns
- `loading: boolean` - Data loading state
- `isSubmitting: boolean` - Form submission state

---

## File Upload Component Details

**FileUploader Component (Lines 187-231):**
- Accepts multiple files
- Displays file name and size (formatted: B, KB, MB, GB)
- Remove button for each file
- Dashed border styling with upload icon
- No actual upload on form submit (only state update)

**File Format Handling:**
```javascript
formatFileSize = (bytes) => {
  // Converts bytes to human-readable format
  // Returns: "100 KB", "2.5 MB", etc.
}
```

---

## Key Findings

### Fields Displayed but Not Sent to Backend:
1. **leave_period** - User selects full day vs half day, but API doesn't receive this
2. **selected_supervisor_id** - Supervisor selection not sent
3. **emergency_contact** - Emergency phone number not sent
4. **alternative_email** - Alternative email not sent
5. **covering_employee_id** - Backup employee selection not sent
6. **handover_notes** - Handover instructions not sent
7. **Supporting & Handover Documents** - File uploads not handled

### API Only Receives:
- `employeeId`
- `type` (leave_type)
- `startDate`
- `endDate`
- `reason`

---

## Next Steps for Implementation

1. **Backend API Updates:**
   - Modify `LeaveRequest` model to include all form fields
   - Add fields to create/update endpoints
   - Implement file upload endpoints

2. **Frontend API Integration:**
   - Update `leaveService.createLeave()` to send all form fields
   - Implement file upload functionality
   - Add proper error handling for file operations

3. **Database Schema:**
   - Add supporting_documents, handover_documents relationships
   - Add leave_period, supervisor_id, covering_employee_id, handover_notes fields
   - Add emergency_contact, alternative_email fields

4. **Validation:**
   - Implement backend validation for all fields
   - Add date range validation
   - Add file type/size validation

---

## Form Fields Summary

| Field | Type | Required | Current Backend | Notes |
|-------|------|----------|-----------------|-------|
| leave_type | Select | ✓ | ✓ Sent | Maps to `type` |
| leave_period | Select | ✗ | ✗ Not sent | UI only |
| start_date | Date | ✓ | ✓ Sent | Mapped to `startDate` |
| end_date | Date | ✓ | ✓ Sent | Mapped to `endDate` |
| total_days | Calculated | - | - | Read-only display |
| reason | Textarea | ✗ | ✓ Sent | Optional in API |
| supervisor_id | Select | ✗ | ✗ Not sent | UI only |
| emergency_contact | Text | ✗ | ✗ Not sent | UI only |
| alternative_email | Email | ✗ | ✗ Not sent | UI only |
| covering_employee_id | Select | ✗ | ✗ Not sent | UI only |
| handover_notes | Textarea | ✗ | ✗ Not sent | UI only |
| supporting_docs | Files | ✗ | ✗ Not sent | UI only |
| handover_docs | Files | ✗ | ✗ Not sent | UI only |

---

**Generated:** January 2026
**Source Files:** 
- Frontend: `c:\Users\xownl\Documents\Dev\orbit360-FE\src\components\selfservice\LeaveManagement.jsx`
- Frontend: `c:\Users\xownl\Documents\Dev\orbit360-FE\src\pages\LeaveManagement.jsx`
