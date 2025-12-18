# Orbit360 HR API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently no authentication implemented. To be added: JWT tokens.

---

## Endpoints

### Health Check

```
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Companies

### Get All Companies

```
GET /companies?page=1&rows=10
```

### Get Company by ID

```
GET /companies/:id
```

### Create Company

```
POST /companies
Content-Type: application/json

{
  "name": "Company Alpha",
  "description": "Capital Management company"
}
```

---

## Departments

### Get All Departments

```
GET /departments?page=1&rows=10
```

### Get Department by ID

```
GET /departments/:id
```

### Create Department

```
POST /departments
Content-Type: application/json

{
  "name": "Engineering",
  "description": "Software Development Department"
}
```

### Update Department

```
PUT /departments/:id
Content-Type: application/json

{
  "name": "Engineering",
  "description": "Updated description"
}
```

### Delete Department

```
DELETE /departments/:id
```

---

## Positions

### Get All Positions

```
GET /positions?page=1&rows=10
```

### Get Position by ID

```
GET /positions/:id
```

### Create Position

```
POST /positions
Content-Type: application/json

{
  "title": "Senior Developer",
  "description": "Senior Software Developer position"
}
```

### Update Position

```
PUT /positions/:id
Content-Type: application/json

{
  "title": "Senior Developer",
  "description": "Updated description"
}
```

### Delete Position

```
DELETE /positions/:id
```

---

## Employees

### Get All Employees

```
GET /employees?page=1&rows=10
```

### Get Employee by ID

```
GET /employees/:id
```

### Create Employee

```
POST /employees
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "hireDate": "2024-01-15",
  "salary": 50000.00,
  "departmentId": 1,
  "positionId": 1,
  "status": "active"
}
```

### Update Employee

```
PUT /employees/:id
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "hireDate": "2024-01-15",
  "salary": 55000.00,
  "departmentId": 1,
  "positionId": 2,
  "status": "active"
}
```

### Delete Employee

```
DELETE /employees/:id
```

---

## Attendance

### Get All Attendance Records

```
GET /attendance?page=1&rows=10
```

### Get Employee Attendance

```
GET /attendance/employee/:employeeId?page=1&rows=10&startDate=2024-01-01&endDate=2024-01-31
```

### Get Attendance by ID

```
GET /attendance/:id
```

### Check In

```
POST /attendance/check-in
Content-Type: application/json

{
  "employeeId": 1
}
```

Response:

```json
{
  "data": {
    "id": 1,
    "employeeId": 1,
    "date": "2024-01-15",
    "checkIn": "2024-01-15T08:30:00.000Z",
    "checkOut": null,
    "status": "present"
  },
  "message": "Checked in successfully"
}
```

### Check Out

```
POST /attendance/check-out
Content-Type: application/json

{
  "employeeId": 1
}
```

### Mark Absent

```
POST /attendance/mark-absent
Content-Type: application/json

{
  "employeeId": 1,
  "date": "2024-01-15"
}
```

### Delete Attendance Record

```
DELETE /attendance/:id
```

---

## Leave

### Get All Leave Requests

```
GET /leaves?page=1&rows=10
```

### Get Employee Leave Requests

```
GET /leaves/employee/:employeeId?page=1&rows=10
```

### Get Leave Request by ID

```
GET /leaves/:id
```

### Create Leave Request

```
POST /leaves
Content-Type: application/json

{
  "employeeId": 1,
  "startDate": "2024-02-01",
  "endDate": "2024-02-05",
  "type": "vacation",
  "reason": "Family vacation"
}
```

Allowed types: `sick`, `vacation`, `personal`, `maternity`, `paternity`

### Approve Leave Request

```
POST /leaves/:id/approve
```

### Reject Leave Request

```
POST /leaves/:id/reject
```

### Cancel Leave Request

```
DELETE /leaves/:id
```

---

## Payroll

### Get All Payroll Records

```
GET /payroll?page=1&rows=10
```

### Get Employee Payroll

```
GET /payroll/employee/:employeeId?page=1&rows=10
```

### Get Payroll by ID

```
GET /payroll/:id
```

### Create Payroll

```
POST /payroll
Content-Type: application/json

{
  "employeeId": 1,
  "month": 1,
  "year": 2024,
  "baseSalary": 50000.00,
  "allowances": 5000.00,
  "deductions": 2500.00
}
```

Response:

```json
{
  "data": {
    "id": 1,
    "employeeId": 1,
    "month": 1,
    "year": 2024,
    "baseSalary": "50000.00",
    "allowances": "5000.00",
    "deductions": "2500.00",
    "netSalary": "52500.00",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Payroll created successfully"
}
```

### Update Payroll

```
PUT /payroll/:id
Content-Type: application/json

{
  "baseSalary": 55000.00,
  "allowances": 5500.00,
  "deductions": 2800.00
}
```

### Mark Payroll as Processed

```
POST /payroll/:id/process
```

### Mark Payroll as Paid

```
POST /payroll/:id/pay
```

### Delete Payroll

```
DELETE /payroll/:id
```

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/employees"
}
```

Common HTTP Status Codes:

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Pagination

All list endpoints support pagination with query parameters:

- `page` - Page number (default: 1)
- `rows` - Items per page (default: 10)

Response format:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "rows": 10,
    "pages": 10
  }
}
```

---

## Environment Variables

Create a `.env` file in the root directory:

```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
DB_NAME=orbit360_hr
DB_USER=root
DB_PASSWORD=your_password
DB_HOST_NAME=localhost
DB_PORT=3306
DB_TYPE=mysql
```
