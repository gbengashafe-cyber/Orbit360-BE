# Postman Collection Import & Testing Guide

## Quick Start (2 minutes)

### Step 1: Download the Collection
File: `Orbit360_Leave_API.postman_collection.json`
Located in: `/Orbit360-BE/`

### Step 2: Import into Postman

**Option A: Direct Import**
1. Open Postman
2. Click "File" → "Import"
3. Select "Orbit360_Leave_API.postman_collection.json"
4. Click "Import"

**Option B: Drag & Drop**
1. Open Postman
2. Drag the JSON file into the Postman window
3. Click "Import" when prompted

### Step 3: Set Environment Variables
1. Click the "eye" icon (top-right)
2. Click "Edit" next to "Globals"
3. Add these variables:
   - `base_url` = `http://localhost:3000`
   - `jwt_token` = `YOUR_ACTUAL_JWT_TOKEN`

### Step 4: Start Testing
1. Expand "1. GET ENDPOINTS"
2. Run "1.1 Get Current Employee Info"
3. Use the response data for other requests

---

## What's in the Collection

### 📁 Folder Structure

```
Orbit360 Leave API
├── 1. GET ENDPOINTS - Form Initialization
│   ├── 1.1 Get Current Employee Info
│   ├── 1.2 Get Employee Leave Balance
│   └── 1.3 Get All Employees (for Dropdowns)
│
├── 2. POST ENDPOINTS - Current Implementation
│   ├── 2.1 Create Leave - Basic (5 fields)
│   ├── 2.2 Create Leave - Vacation (Extended)
│   ├── 2.3 Create Leave - Sick
│   └── 2.4 Create Leave - Personal
│
├── 3. POST ENDPOINTS - After Implementation
│   ├── 3.1 Create Leave - Full Details (All Fields)
│   ├── 3.2 Create Leave - Maternity (Full Details)
│   ├── 3.3 Create Leave - Half-Day (Morning)
│   ├── 3.4 Create Leave - Half-Day (Afternoon)
│   └── 3.5 Create Leave - Paternity (Full Details)
│
├── 4. ERROR HANDLING - Test Cases
│   ├── 4.1 Error - Missing Required Field
│   ├── 4.2 Error - Invalid Date Range
│   ├── 4.3 Error - Invalid Employee ID
│   ├── 4.4 Error - Insufficient Leave Balance
│   └── 4.5 Error - Unauthorized (Missing Token)
│
└── 5. GET REQUESTS - Retrieve Leaves
    ├── 5.1 Get All Leaves (Paginated)
    ├── 5.2 Get Leave By ID
    └── 5.3 Get Leaves By Employee
```

---

## Testing Workflow

### Phase 1: Verify Setup (5 minutes)

1. **Test Authentication**
   - Run: 1.1 Get Current Employee Info
   - Expected: 200 OK with employee data
   - If 401: Update jwt_token in variables

2. **Fetch Form Data**
   - Run: 1.2 Get Employee Leave Balance
   - Expected: 200 OK with balance breakdown
   - Note the available days for vacation

3. **Fetch Dropdown Data**
   - Run: 1.3 Get All Employees
   - Expected: 200 OK with employee list
   - Note employee IDs for supervisors (e.g., 2, 3)

### Phase 2: Test Current Implementation (10 minutes)

1. **Basic Leave Request**
   - Run: 2.1 Create Leave - Basic (5 fields)
   - Expected: 201 Created
   - Note the leave request ID

2. **Verify Storage**
   - Run: 5.2 Get Leave By ID
   - Replace ID with the one from previous response
   - Expected: 200 OK with created leave details

3. **Test Different Leave Types**
   - Run: 2.2 Create Leave - Vacation
   - Run: 2.3 Create Leave - Sick
   - Run: 2.4 Create Leave - Personal
   - Each should return 201 Created

### Phase 3: Test Error Handling (10 minutes)

1. **Missing Field**
   - Run: 4.1 Error - Missing Required Field
   - Expected: 400 Bad Request with error message

2. **Invalid Date Range**
   - Run: 4.2 Error - Invalid Date Range
   - Expected: 400 Bad Request

3. **Invalid Employee**
   - Run: 4.3 Error - Invalid Employee ID
   - Expected: 404 Not Found

4. **Insufficient Balance**
   - Run: 4.4 Error - Insufficient Leave Balance
   - Expected: 400 Bad Request with balance info

5. **Unauthorized**
   - Run: 4.5 Error - Unauthorized
   - Expected: 401 Unauthorized

### Phase 4: Test After Backend Implementation (10 minutes)

Once backend is updated to accept all fields:

1. **Full Leave Details**
   - Run: 3.1 Create Leave - Full Details (All Fields)
   - Change employee IDs to match your database
   - Expected: 201 Created with all new fields

2. **Half-Day Leave**
   - Run: 3.3 Create Leave - Half-Day (Morning)
   - Expected: 201 Created with days = 0.5

3. **Extended Leave**
   - Run: 3.2 Create Leave - Maternity
   - Expected: 201 Created with supervisor and backup assigned

---

## Environment Variables Setup

### Method 1: Using Globals

1. Click the "eye" icon (top-right corner)
2. Click "Edit"
3. Add variables:
   ```
   base_url: http://localhost:3000
   jwt_token: <your JWT token from login>
   employee_id: 1
   supervisor_id: 2
   backup_employee_id: 3
   ```
4. Save

### Method 2: Create Environment

1. Click "Environments" (left sidebar)
2. Click "+" to create new
3. Name it "Orbit360 Dev"
4. Add variables:
   ```
   {
     "base_url": "http://localhost:3000",
     "jwt_token": "your-jwt-token",
     "api_version": "v1"
   }
   ```
5. Select it from environment dropdown

### Getting Your JWT Token

1. First, you need to authenticate
2. Send request to: `POST /api/auth/login`
3. With credentials:
   ```json
   {
     "email": "user@example.com",
     "password": "password"
   }
   ```
4. Copy the `token` from response
5. Paste into `{{jwt_token}}` variable

---

## Common Issues & Solutions

### Issue: "{{jwt_token}} is not defined"
**Solution:** 
1. Click "eye" icon
2. Click "Edit"
3. Add `jwt_token` variable with actual token

### Issue: "404 Not Found" on GET requests
**Solution:**
1. Verify base_url is correct: `http://localhost:3000`
2. Check server is running
3. Verify employee ID exists (usually 1, 2, 3)

### Issue: "401 Unauthorized"
**Solution:**
1. Get fresh JWT token from login
2. Update jwt_token variable
3. Make sure token is not expired

### Issue: "400 Bad Request"
**Solution:**
1. Check request body JSON syntax
2. Verify required fields are present
3. Check date format: `YYYY-MM-DD`
4. See error message for specific field issue

### Issue: Request takes too long
**Solution:**
1. Increase timeout: Settings → General → Request timeout
2. Check server logs for errors
3. Verify server is responding

---

## Testing the Complete Flow

### Recommended Testing Order

1. **Setup & Validation** (5 min)
   ```
   1.1 Get Current Employee Info
   1.2 Get Employee Leave Balance  
   1.3 Get All Employees
   ```

2. **Create Basic Request** (5 min)
   ```
   2.1 Create Leave - Basic
   5.2 Get Leave By ID (verify it was created)
   ```

3. **Create Different Types** (5 min)
   ```
   2.2 Create Leave - Vacation
   2.3 Create Leave - Sick
   2.4 Create Leave - Personal
   ```

4. **Error Cases** (5 min)
   ```
   4.1 Missing field
   4.2 Invalid dates
   4.3 Invalid employee
   ```

5. **Retrieve Data** (5 min)
   ```
   5.1 Get All Leaves
   5.3 Get Leaves by Employee
   ```

**Total: ~25 minutes complete test suite**

---

## Postman Tips & Tricks

### Pre-request Script (Auto-set date)
Add to "Pre-request Script" tab:
```javascript
// Set current date as startDate
const today = new Date();
const startDate = today.toISOString().split('T')[0];
const endDate = new Date(today.getTime() + 5*24*60*60*1000).toISOString().split('T')[0];

pm.environment.set("startDate", startDate);
pm.environment.set("endDate", endDate);
```

Then in body:
```json
{
  "startDate": "{{startDate}}",
  "endDate": "{{endDate}}"
}
```

### Tests Tab (Auto-verify responses)
Add to "Tests" tab:
```javascript
// Check status code
pm.test("Status code is 201 or 200", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

// Check response has data
pm.test("Response has data", function () {
    pm.expect(pm.response.json().data).to.exist;
});

// Save ID for next request
pm.test("Save leave ID", function () {
    const leaveId = pm.response.json().data.id;
    pm.environment.set("leave_id", leaveId);
});
```

---

## Request & Response Examples

### Request: Create Leave
**Method:** POST
**URL:** `{{base_url}}/api/v1/leaves`
**Headers:**
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```
**Body:**
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "reason": "Family vacation"
}
```

### Response: Success (201 Created)
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
    "created_at": "2024-01-19T10:30:00Z"
  },
  "message": "Leave request created successfully"
}
```

### Response: Error (400 Bad Request)
```json
{
  "error": {
    "message": "Validation Error",
    "details": [
      {
        "field": "endDate",
        "message": "endDate is required"
      }
    ]
  }
}
```

---

## Batch Testing (Run All)

To test multiple requests automatically:

1. **Create a Collection Run**
   - Click "..." next to collection name
   - Select "Run collection"

2. **Configure Runner**
   - Select which requests to run
   - Set delays between requests: 1000ms
   - Environment: Select your environment
   - Click "Run"

3. **View Results**
   - Green checkmark = Pass
   - Red X = Fail
   - View details for each request

---

## Exporting Results

### Save Test Results
1. After running collection
2. Click "Export Results" (if available)
3. Save as JSON file for record keeping

### Share with Team
1. Right-click collection
2. Select "Export"
3. Share the JSON file
4. Team members import it

---

## Documentation for Each Request

Each request in the collection includes:
- **Description:** What the request does
- **Expected Response:** What to expect back
- **Body:** Pre-filled with example data
- **Headers:** Proper authorization setup

---

## Troubleshooting Checklist

- [ ] Server is running (`localhost:3000`)
- [ ] JWT token is valid and not expired
- [ ] Environment variables are set correctly
- [ ] Request body JSON is valid
- [ ] Dates are in `YYYY-MM-DD` format
- [ ] Employee IDs exist in database
- [ ] No special characters in strings
- [ ] Content-Type header is correct

---

## Next Steps

### After Testing Works
1. Review responses for data consistency
2. Check database for created records
3. Test approval workflow
4. Test with files (after implementation)
5. Load test with high volumes

### For Backend Developers
1. Import collection into their Postman
2. Run requests against their local server
3. Debug failed requests
4. Add new requests as features are added

### For Frontend Developers
1. Compare API responses with what form expects
2. Ensure data mapping is correct
3. Test error handling
4. Implement retry logic if needed

---

## Support

- **Collection Issues:** Check the `Orbit360_Leave_API.postman_collection.json` file
- **Request Examples:** See `POSTMAN_LEAVE_REQUEST_EXAMPLES.md`
- **API Docs:** See `ALL_CREATE_ENDPOINTS.md`
- **Implementation Guide:** See `LEAVE_FORM_BACKEND_INTEGRATION.md`

---

## Quick Commands

| Action | Steps |
|--------|-------|
| Import Collection | File → Import → Select JSON |
| Add JWT Token | Eye Icon → Edit → Add jwt_token |
| Run Request | Click Send |
| View Response | Bottom panel shows response |
| Save to Collection | Ctrl+S |
| Duplicate Request | Right-click → Duplicate |
| Copy as cURL | Code button (right side of request) |

---

**Collection Version:** 1.0
**Last Updated:** January 19, 2026
**API Version:** v1
**Base URL:** `http://localhost:3000`
