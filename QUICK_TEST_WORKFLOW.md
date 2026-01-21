# Quick Test Workflow - Step by Step

## Server is Running ✅
Port: 3000
Database: Connected ✅

---

## Step 1: Login to Get JWT Token

**Endpoint:**
```
POST http://localhost:3000/api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@orbit360.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@orbit360.com",
      "firstName": "Admin",
      "lastName": "User"
    }
  }
}
```

**Save the token** from response (the long string after "token":)

---

## Step 2: Use Token to Test Leave Endpoints

### 2.1 Get Employee Info
**Endpoint:**
```
GET http://localhost:3000/api/v1/employees/1
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response:**
```json
{
  "data": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@orbit360.com",
    "employeeId": "EMP001",
    "department": "HR",
    "leaveEntitlement": 21
  },
  "message": "Employee fetched successfully"
}
```

---

### 2.2 Get Leave Balance
**Endpoint:**
```
GET http://localhost:3000/api/v1/leaves/balance/1
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 1,
      "employeeId": 1,
      "leaveType": "vacation",
      "allocated": 21,
      "used": 0,
      "remaining": 21,
      "year": 2026
    }
  ]
}
```

---

### 2.3 Create Leave Request
**Endpoint:**
```
POST http://localhost:3000/api/v1/leaves
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "employeeId": 1,
  "type": "vacation",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "reason": "Family vacation"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employeeId": 1,
    "type": "vacation",
    "startDate": "2024-02-15",
    "endDate": "2024-02-20",
    "reason": "Family vacation",
    "status": "pending_supervisor_approval",
    "created_at": "2026-01-19T02:56:00Z"
  },
  "message": "Leave request created successfully"
}
```

---

## Quick Postman Setup

### In Postman:

1. **Create Login Request**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/login`
   - Body (raw JSON):
   ```json
   {
     "email": "admin@orbit360.com",
     "password": "password"
   }
   ```
   - Send and copy the token from response

2. **Create Leave Request**
   - Method: POST
   - URL: `http://localhost:3000/api/v1/leaves`
   - Headers:
     - `Authorization: Bearer YOUR_TOKEN`
     - `Content-Type: application/json`
   - Body:
   ```json
   {
     "employeeId": 1,
     "type": "vacation",
     "startDate": "2024-02-15",
     "endDate": "2024-02-20",
     "reason": "Family vacation"
   }
   ```
   - Send

---

## Common Issues

### Issue: "Authentication failed"
**Solution:** You didn't include the Authorization header or token is invalid
- Get new token from login
- Format: `Bearer TOKEN_HERE` (with Bearer prefix)
- Copy exact token from login response

### Issue: "Invalid token"
**Solution:** Token might be expired or malformed
- Get fresh token from login again
- Make sure full token is copied (no extra spaces)

### Issue: "Employee not found"
**Solution:** Employee ID doesn't exist
- Use ID from employee info response
- Default is usually 1

### Issue: "Insufficient leave balance"
**Solution:** Requesting more days than available
- Check leave balance first
- Request fewer days
- Default balance is 21 days

---

## Complete Test Flow (10 minutes)

1. **Login** (1 min)
   - POST login
   - Copy token

2. **Get Employee Info** (1 min)
   - GET /employees/1
   - Use token
   - Verify you get employee data

3. **Get Leave Balance** (1 min)
   - GET /leaves/balance/1
   - Use token
   - Note available days (should be 21)

4. **Create Leave** (2 min)
   - POST /leaves
   - Use token
   - Body with 5 fields
   - Should return 201 Created

5. **Test Error Case** (2 min)
   - POST /leaves with missing field
   - Should return 400 Bad Request

6. **Retrieve Leave** (2 min)
   - GET /leaves/1
   - Use token
   - Verify created leave is returned

---

## Test Credentials

| Field | Value |
|-------|-------|
| Email | admin@orbit360.com |
| Password | password |
| Result | JWT Token |

---

## Using the Postman Collection

If you imported the collection earlier:

1. **Set environment variable**
   - jwt_token = (leave empty)

2. **Run the login request first**
   - It should populate jwt_token automatically

3. **Then run other requests**
   - They'll use the token from step 2

---

## cURL Commands (Complete Flow)

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@orbit360.com","password":"password"}'
```

Copy the token from response.

### 2. Create Leave (replace TOKEN)
```bash
curl -X POST http://localhost:3000/api/v1/leaves \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 1,
    "type": "vacation",
    "startDate": "2024-02-15",
    "endDate": "2024-02-20",
    "reason": "Family vacation"
  }'
```

### 3. Get Leave Balance
```bash
curl -X GET http://localhost:3000/api/v1/leaves/balance/1 \
  -H "Authorization: Bearer TOKEN"
```

---

## Next Steps

1. ✅ Server running on port 3000
2. ✅ Database connected
3. 🔄 Get JWT token (login)
4. 🔄 Test leave endpoints
5. 🔄 Verify Postman collection works
6. 🔄 Test the complete flow

---

**Ready to test?** Start with the Login request above using Postman or cURL.
