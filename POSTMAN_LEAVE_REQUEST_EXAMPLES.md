# Postman Leave Request - Complete Examples

## Current State (What Works Now)

### Endpoint
```
POST http://localhost:3000/api/v1/leaves
```

### Headers
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Request Body (5 fields - Currently Accepted)
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "reason": "Family vacation"
}
```

### Expected Response
```json
{
  "data": {
    "id": 1,
    "employeeId": 1,
    "type": "vacation",
    "startDate": "2024-02-15",
    "endDate": "2024-02-20",
    "reason": "Family vacation",
    "status": "pending_supervisor_approval",
    "created_at": "2024-01-19T10:30:00Z",
    "updated_at": "2024-01-19T10:30:00Z"
  },
  "message": "Leave request created successfully"
}
```

---

## Future State (After Implementation)

### Endpoint
```
POST http://localhost:3000/api/v1/leaves
```

### Headers
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

### Request Body - Option 1: JSON Only (No Files)
```json
{
  "employeeId": 1,
  "type": "vacation",
  "leave_period": "full_day",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "reason": "Family vacation",
  "supervisor_id": 2,
  "covering_employee_id": 3,
  "emergency_contact": "+1-555-0123",
  "alternative_email": "zebedee.backup@example.com",
  "handover_notes": "Project files are in the shared drive /projects/orbit360. All documentation is current as of Jan 19. Contact Jane Smith for urgent technical issues."
}
```

---

## Postman Setup Instructions

### For Current Implementation (JSON Body)

1. **Create New Request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/v1/leaves`

2. **Set Headers**
   - Click "Headers" tab
   - Add: `Authorization` = `Bearer YOUR_JWT_TOKEN`
   - Add: `Content-Type` = `application/json`

3. **Set Body**
   - Click "Body" tab
   - Select "raw" radio button
   - Select "JSON" from dropdown
   - Paste the request body below:

```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "reason": "Family vacation"
}
```

4. **Click Send**

---

## Complete Request Bodies by Type

### Type 1: Simple Vacation Leave
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-03-01",
  "endDate": "2024-03-10",
  "reason": "Annual leave",
  "leave_period": "full_day",
  "supervisor_id": 2,
  "emergency_contact": "+1-555-0100"
}
```

### Type 2: Sick Leave
```json
{
  "employeeId": 5,
  "type": "sick",
  "startDate": "2024-02-20",
  "endDate": "2024-02-20",
  "reason": "Medical appointment and recovery",
  "leave_period": "full_day",
  "supervisor_id": 3,
  "covering_employee_id": 4,
  "emergency_contact": "+1-555-0105"
}
```

### Type 3: Half Day Leave
```json
{
  "employeeId": 2,
  "type": "personal",
  "startDate": "2024-02-22",
  "endDate": "2024-02-22",
  "reason": "Personal appointment",
  "leave_period": "half_day_morning",
  "supervisor_id": 1,
  "emergency_contact": "+1-555-0102"
}
```

### Type 4: Maternity Leave (Full Details)
```json
{
  "employeeId": 3,
  "type": "maternity",
  "startDate": "2024-04-01",
  "endDate": "2024-06-30",
  "reason": "Maternity leave",
  "leave_period": "full_day",
  "supervisor_id": 2,
  "covering_employee_id": 6,
  "emergency_contact": "+234-803-1234567",
  "alternative_email": "jane.smith.backup@orbit360.com",
  "handover_notes": "Complete handover to John Doe. All project documentation updated. Client contacts in shared drive. Sprint planning notes in Jira project ORBIT-360."
}
```

### Type 5: Paternity Leave
```json
{
  "employeeId": 4,
  "type": "paternity",
  "startDate": "2024-05-15",
  "endDate": "2024-05-29",
  "reason": "Paternity leave",
  "leave_period": "full_day",
  "supervisor_id": 1,
  "covering_employee_id": 5,
  "emergency_contact": "+234-805-5555555",
  "alternative_email": "john.doe.backup@orbit360.com",
  "handover_notes": "Backup: All development tasks in JIRA. Staging environment setup in AWS. Deployment keys in vault. Contact Sarah for any issues."
}
```

---

## Postman Collection JSON (Import Ready)

Copy the entire JSON below and import into Postman:

```json
{
  "info": {
    "name": "Leave Request API",
    "description": "Leave Request Collection - Current & Future States",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Get Employee Info",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer YOUR_JWT_TOKEN"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/v1/employees/1",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "employees", "1"]
        }
      }
    },
    {
      "name": "2. Get Leave Balance",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer YOUR_JWT_TOKEN"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/v1/leaves/balance/1",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "leaves", "balance", "1"]
        }
      }
    },
    {
      "name": "3. Get All Employees",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer YOUR_JWT_TOKEN"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/v1/employees?page=1&rows=100",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "employees"],
          "query": [
            {
              "key": "page",
              "value": "1"
            },
            {
              "key": "rows",
              "value": "100"
            }
          ]
        }
      }
    },
    {
      "name": "4. Create Leave - Basic (Current)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer YOUR_JWT_TOKEN"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"employeeId\": 1, \"type\": \"vacation\", \"startDate\": \"2024-02-15\", \"endDate\": \"2024-02-20\", \"reason\": \"Family vacation\"}"
        },
        "url": {
          "raw": "http://localhost:3000/api/v1/leaves",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "leaves"]
        }
      }
    },
    {
      "name": "5. Create Leave - Full Details (Future)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer YOUR_JWT_TOKEN"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"employeeId\": 1, \"type\": \"vacation\", \"leave_period\": \"full_day\", \"startDate\": \"2024-02-15\", \"endDate\": \"2024-02-20\", \"reason\": \"Family vacation\", \"supervisor_id\": 2, \"covering_employee_id\": 3, \"emergency_contact\": \"+1-555-0123\", \"alternative_email\": \"backup@example.com\", \"handover_notes\": \"Files in shared drive\"}"
        },
        "url": {
          "raw": "http://localhost:3000/api/v1/leaves",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "leaves"]
        }
      }
    }
  ]
}
```

---

## Testing Workflow in Postman

### Step 1: Pre-fetch Data
**Run in this order:**

1. **Get Employee Info** (GET)
   - URL: `http://localhost:3000/api/v1/employees/1`
   - Note the `id`, `firstName`, `lastName`, `departmentName`

2. **Get Leave Balance** (GET)
   - URL: `http://localhost:3000/api/v1/leaves/balance/1`
   - Note the available days for 'vacation' type

3. **Get All Employees** (GET)
   - URL: `http://localhost:3000/api/v1/employees?page=1&rows=100`
   - Note the `id` values for supervisors and backup employees

### Step 2: Create Leave Request

Run **Create Leave** with the body below. Replace values based on data from Step 1:

```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "reason": "Family vacation"
}
```

---

## cURL Command Examples

### Current Implementation
```bash
curl -X POST http://localhost:3000/api/v1/leaves \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 1,
    "type": "vacation",
    "startDate": "2024-02-15",
    "endDate": "2024-02-20",
    "reason": "Family vacation"
  }'
```

### After Implementation (With Files)
```bash
curl -X POST http://localhost:3000/api/v1/leaves \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "employeeId=1" \
  -F "type=vacation" \
  -F "leave_period=full_day" \
  -F "startDate=2024-02-15" \
  -F "endDate=2024-02-20" \
  -F "reason=Family vacation" \
  -F "supervisor_id=2" \
  -F "covering_employee_id=3" \
  -F "emergency_contact=+1-555-0123" \
  -F "alternative_email=backup@example.com" \
  -F "handover_notes=Files in shared drive" \
  -F "supporting_documents=@/path/to/medical-cert.pdf" \
  -F "handover_documents=@/path/to/handover-guide.pdf"
```

---

## Request Body - All Fields Explained

### Mandatory Fields (Must Include)
```json
{
  "employeeId": 1,              // Integer: Employee ID (primary key)
  "type": "vacation",           // String: vacation|sick|personal|maternity|paternity
  "startDate": "2024-02-15",    // String: Date in YYYY-MM-DD format
  "endDate": "2024-02-20"       // String: Date in YYYY-MM-DD format (>= startDate)
}
```

### Optional Fields (Recommended to Include)
```json
{
  "reason": "Family vacation",                    // String: Why taking leave
  "leave_period": "full_day",                    // String: full_day|half_day_morning|half_day_afternoon
  "supervisor_id": 2,                            // Integer: Employee ID of supervisor
  "covering_employee_id": 3,                     // Integer: Employee ID of backup
  "emergency_contact": "+1-555-0123",           // String: Phone number during leave
  "alternative_email": "backup@example.com",    // String: Email during leave
  "handover_notes": "Files in shared drive"     // String: Instructions for backup person
}
```

### File Fields (After Implementation)
```
supporting_documents: binary (file upload)    // Medical cert, travel itinerary, etc.
handover_documents: binary (file upload)      // Project handover, contact list, etc.
```

---

## Response Bodies

### Success Response (201 Created)
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
    "covering_employee_id": 3,
    "emergency_contact": "+1-555-0123",
    "alternative_email": "backup@example.com",
    "handover_notes": "Files in shared drive",
    "status": "pending_supervisor_approval",
    "documents": [
      {
        "id": 1,
        "document_type": "supporting",
        "file_name": "medical-cert.pdf",
        "file_size": 2048576,
        "document_url": "/api/v1/leaves/1/documents/1"
      }
    ],
    "created_at": "2024-01-19T10:30:00Z",
    "updated_at": "2024-01-19T10:30:00Z"
  },
  "message": "Leave request created successfully"
}
```

### Error Response (400 Bad Request)
```json
{
  "error": {
    "message": "Validation Error",
    "details": [
      {
        "field": "supervisor_id",
        "message": "supervisor_id must be a valid employee ID"
      },
      {
        "field": "endDate",
        "message": "endDate must be after startDate"
      }
    ]
  }
}
```

### Error Response (401 Unauthorized)
```json
{
  "error": {
    "message": "Unauthorized",
    "code": 401
  }
}
```

---

## Testing Scenarios

### Scenario 1: Basic Leave Request
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-03-15",
  "endDate": "2024-03-20",
  "reason": "Spring vacation"
}
```
**Expected:** 201 Created with status `pending_supervisor_approval`

---

### Scenario 2: Full Leave with Handover
```json
{
  "employeeId": 2,
  "type": "vacation",
  "leave_period": "full_day",
  "startDate": "2024-04-01",
  "endDate": "2024-04-15",
  "reason": "Extended vacation",
  "supervisor_id": 1,
  "covering_employee_id": 3,
  "emergency_contact": "+234-803-1234567",
  "alternative_email": "jane.backup@orbit360.com",
  "handover_notes": "All projects documented. Client contacts updated. Team briefing completed."
}
```
**Expected:** 201 Created with all fields returned

---

### Scenario 3: Half-Day Leave
```json
{
  "employeeId": 3,
  "type": "personal",
  "leave_period": "half_day_afternoon",
  "startDate": "2024-02-22",
  "endDate": "2024-02-22",
  "reason": "Appointment",
  "supervisor_id": 2
}
```
**Expected:** 201 Created, days calculated as 0.5

---

### Scenario 4: Sick Leave (Medical Certificate)
```json
{
  "employeeId": 4,
  "type": "sick",
  "leave_period": "full_day",
  "startDate": "2024-02-25",
  "endDate": "2024-02-26",
  "reason": "Fever and fatigue",
  "supervisor_id": 1,
  "emergency_contact": "+234-805-5555555"
}
```
**Expected:** 201 Created (file upload follows)

---

## Validation Rules to Test

### Invalid Cases (Should Fail)

**Test 1: Missing mandatory field**
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-15"
  // Missing: endDate
}
```
**Expected:** 400 Bad Request - "endDate is required"

---

**Test 2: Invalid date range**
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-20",
  "endDate": "2024-02-15"  // Before startDate
}
```
**Expected:** 400 Bad Request - "endDate must be after startDate"

---

**Test 3: Invalid employee ID**
```json
{
  "employeeId": 99999,
  "type": "vacation",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20"
}
```
**Expected:** 400 Bad Request - "Employee not found"

---

**Test 4: Invalid supervisor ID**
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "supervisor_id": 99999
}
```
**Expected:** 400 Bad Request - "supervisor_id is invalid"

---

**Test 5: Insufficient leave balance**
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-15",
  "endDate": "2024-03-20"  // 34 days, but balance is 21
}
```
**Expected:** 400 Bad Request - "Insufficient leave balance. Available: 21 days, Requested: 34 days"

---

## Quick Copy-Paste Templates

### Template 1: Minimal Leave
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "reason": "Vacation"
}
```

### Template 2: Complete Leave
```json
{
  "employeeId": 1,
  "type": "vacation",
  "leave_period": "full_day",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "reason": "Family vacation",
  "supervisor_id": 2,
  "covering_employee_id": 3,
  "emergency_contact": "+1-555-0123",
  "alternative_email": "backup@example.com",
  "handover_notes": "Project files in shared drive"
}
```

### Template 3: Sick Leave
```json
{
  "employeeId": 1,
  "type": "sick",
  "leave_period": "full_day",
  "startDate": "2024-02-20",
  "endDate": "2024-02-21",
  "reason": "Medical appointment",
  "supervisor_id": 2,
  "emergency_contact": "+1-555-0123"
}
```

### Template 4: Half-Day Leave
```json
{
  "employeeId": 1,
  "type": "personal",
  "leave_period": "half_day_morning",
  "startDate": "2024-02-22",
  "endDate": "2024-02-22",
  "reason": "Personal appointment",
  "supervisor_id": 2
}
```

---

## Postman Environment Variables (Optional)

Create a Postman environment with these variables:

```json
{
  "base_url": "http://localhost:3000",
  "api_version": "v1",
  "jwt_token": "YOUR_JWT_TOKEN_HERE",
  "employee_id": "1",
  "supervisor_id": "2",
  "backup_employee_id": "3"
}
```

Then use in requests:
```
{{base_url}}/api/{{api_version}}/leaves
Authorization: Bearer {{jwt_token}}
```

---

## Summary

| Request Type | Headers | Body Type | Files |
|--------------|---------|-----------|-------|
| Current (JSON) | Content-Type: application/json | Raw JSON | No |
| Future (Complete) | Content-Type: multipart/form-data | Form Data | Yes |

**Start with the "Current Implementation" examples above, then upgrade to complete examples after backend implementation.**
