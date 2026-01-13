# Staff Complaints Module - API Documentation

## Overview
The Staff Complaints module allows employees to file complaints and enables HR to track, review, and resolve them. Complaints can cover various issues including harassment, discrimination, safety concerns, wage disputes, and working conditions.

## Base URL
```
/api/v1/complaints
```

---

## Endpoints

### 1. List All Complaints (HR View)
**GET** `/`

Retrieve all complaints with filtering options for HR dashboard.

**Query Parameters:**
- `page` (integer, default: 1) - Page number for pagination
- `rows` (integer, default: 10) - Number of records per page
- `status` (string, optional) - Filter by status: `open`, `under_review`, `resolved`, `closed`
- `severity` (string, optional) - Filter by severity: `low`, `medium`, `high`, `critical`
- `complaint_type` (string, optional) - Filter by type: `harassment`, `discrimination`, `safety`, `wage_dispute`, `working_conditions`, `other`
- `employee_id` (integer, optional) - Filter by employee ID

**Response Example:**
```json
{
  "data": [
    {
      "id": 1,
      "employee_id": 5,
      "complaint_type": "harassment",
      "title": "Workplace Harassment",
      "description": "Manager has been making inappropriate comments...",
      "status": "open",
      "severity": "high",
      "reported_date": "2024-01-10T10:30:00Z",
      "reported_to": "hr@example.com",
      "resolution_notes": null,
      "resolved_date": null,
      "createdAt": "2024-01-10T10:30:00Z",
      "updatedAt": "2024-01-10T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "rows": 10,
    "pages": 2
  }
}
```

---

### 2. Get Complaint by ID
**GET** `/:id`

Retrieve details of a specific complaint.

**Path Parameters:**
- `id` (integer, required) - Complaint ID

**Response:**
```json
{
  "data": {
    "id": 1,
    "employee_id": 5,
    "complaint_type": "discrimination",
    "title": "Unfair Treatment Based on Gender",
    "description": "I have been consistently passed over for promotions...",
    "status": "under_review",
    "severity": "critical",
    "reported_date": "2024-01-10T10:30:00Z",
    "reported_to": "hr_manager@example.com",
    "resolution_notes": null,
    "resolved_date": null,
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-10T10:30:00Z"
  }
}
```

---

### 3. Create Complaint
**POST** `/`

Submit a new complaint (typically by employees via portal).

**Request Body:**
```json
{
  "employee_id": 5,
  "complaint_type": "working_conditions",
  "title": "Poor Office Ventilation",
  "description": "The office air conditioning is not functioning properly, causing discomfort.",
  "severity": "medium",
  "reported_to": "hr@example.com"
}
```

**Required Fields:**
- `employee_id` (integer) - ID of the employee filing the complaint
- `complaint_type` (string) - One of: `harassment`, `discrimination`, `safety`, `wage_dispute`, `working_conditions`, `other`
- `title` (string) - Short title of the complaint
- `description` (string) - Detailed description of the complaint

**Optional Fields:**
- `severity` (string, default: `medium`) - One of: `low`, `medium`, `high`, `critical`
- `reported_to` (string) - Name or email of HR representative

**Response:**
```json
{
  "data": {
    "id": 16,
    "employee_id": 5,
    "complaint_type": "working_conditions",
    "title": "Poor Office Ventilation",
    "description": "The office air conditioning is not functioning properly, causing discomfort.",
    "status": "open",
    "severity": "medium",
    "reported_date": "2024-01-15T14:20:00Z",
    "reported_to": "hr@example.com",
    "resolution_notes": null,
    "resolved_date": null,
    "createdAt": "2024-01-15T14:20:00Z",
    "updatedAt": "2024-01-15T14:20:00Z"
  },
  "message": "Complaint created successfully"
}
```

---

### 4. Update Complaint
**PUT** `/:id`

Update complaint details (HR staff can update status, notes, etc.).

**Path Parameters:**
- `id` (integer, required) - Complaint ID

**Request Body:**
```json
{
  "status": "under_review",
  "severity": "high"
}
```

**Updatable Fields:**
- `complaint_type` - Type of complaint
- `title` - Complaint title
- `description` - Complaint description
- `status` - Status of complaint
- `severity` - Severity level
- `reported_to` - HR personnel assigned

**Response:**
```json
{
  "data": {
    "id": 1,
    "employee_id": 5,
    "complaint_type": "harassment",
    "title": "Workplace Harassment",
    "description": "Manager has been making inappropriate comments...",
    "status": "under_review",
    "severity": "high",
    "reported_date": "2024-01-10T10:30:00Z",
    "reported_to": "hr@example.com",
    "resolution_notes": null,
    "resolved_date": null,
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-15T14:25:00Z"
  },
  "message": "Complaint updated successfully"
}
```

---

### 5. Resolve Complaint
**POST** `/:id/resolve`

Mark a complaint as resolved with resolution notes.

**Path Parameters:**
- `id` (integer, required) - Complaint ID

**Request Body:**
```json
{
  "resolution_notes": "Issue investigated. Inappropriate comments were addressed with the manager. Training provided."
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "employee_id": 5,
    "complaint_type": "harassment",
    "title": "Workplace Harassment",
    "description": "Manager has been making inappropriate comments...",
    "status": "resolved",
    "severity": "high",
    "reported_date": "2024-01-10T10:30:00Z",
    "reported_to": "hr@example.com",
    "resolution_notes": "Issue investigated. Inappropriate comments were addressed with the manager. Training provided.",
    "resolved_date": "2024-01-16T09:00:00Z",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-16T09:00:00Z"
  },
  "message": "Complaint resolved successfully"
}
```

---

### 6. Close Complaint
**POST** `/:id/close`

Close a resolved or abandoned complaint.

**Path Parameters:**
- `id` (integer, required) - Complaint ID

**Response:**
```json
{
  "data": {
    "id": 1,
    "employee_id": 5,
    "complaint_type": "harassment",
    "title": "Workplace Harassment",
    "description": "Manager has been making inappropriate comments...",
    "status": "closed",
    "severity": "high",
    "reported_date": "2024-01-10T10:30:00Z",
    "reported_to": "hr@example.com",
    "resolution_notes": "Issue investigated. Inappropriate comments were addressed with the manager. Training provided.",
    "resolved_date": "2024-01-16T09:00:00Z",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-16T10:15:00Z"
  },
  "message": "Complaint closed successfully"
}
```

---

### 7. Delete Complaint
**DELETE** `/:id`

Delete a complaint record (typically for erroneous entries).

**Path Parameters:**
- `id` (integer, required) - Complaint ID

**Response:**
```json
{
  "message": "Complaint deleted successfully"
}
```

---

## Complaint Types

| Type | Description |
|------|-------------|
| `harassment` | Workplace harassment, bullying, or intimidation |
| `discrimination` | Discrimination based on protected characteristics |
| `safety` | Workplace safety concerns or injuries |
| `wage_dispute` | Salary, bonus, or payment-related issues |
| `working_conditions` | Issues with facilities, hours, or work environment |
| `other` | Any other type of complaint |

---

## Status Workflow

```
open
  ↓
under_review
  ├→ resolved
  │   └→ closed
  └→ closed (abandoned)
```

---

## Severity Levels

| Level | Description |
|-------|-------------|
| `low` | Minor issue, can be addressed at team level |
| `medium` | Moderate issue requiring HR attention |
| `high` | Serious issue requiring management escalation |
| `critical` | Urgent matter requiring immediate action |

---

## Database Schema

### complaints table
```sql
id              INTEGER PRIMARY KEY AUTO_INCREMENT
employee_id     INTEGER NOT NULL
complaint_type  ENUM('harassment', 'discrimination', 'safety', 'wage_dispute', 'working_conditions', 'other')
title           VARCHAR(255) NOT NULL
description     TEXT NOT NULL
status          ENUM('open', 'under_review', 'resolved', 'closed') DEFAULT 'open'
severity        ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium'
reported_date   DATETIME DEFAULT CURRENT_TIMESTAMP
reported_to     VARCHAR(255)
resolution_notes TEXT
resolved_date   DATETIME
createdAt       DATETIME
updatedAt       DATETIME
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Missing required fields: employee_id, complaint_type, title, description"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Complaint not found"
  }
}
```

---

## cURL Examples

### List all complaints
```bash
curl "http://localhost:3000/api/v1/complaints?page=1&rows=10"
```

### List high-severity complaints
```bash
curl "http://localhost:3000/api/v1/complaints?severity=high&status=open"
```

### Create complaint
```bash
curl -X POST http://localhost:3000/api/v1/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 5,
    "complaint_type": "working_conditions",
    "title": "Poor Office Ventilation",
    "description": "The office air conditioning is not functioning properly.",
    "severity": "medium",
    "reported_to": "hr@example.com"
  }'
```

### Resolve complaint
```bash
curl -X POST http://localhost:3000/api/v1/complaints/1/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "resolution_notes": "Issue has been resolved and follow-up scheduled."
  }'
```

### Close complaint
```bash
curl -X POST http://localhost:3000/api/v1/complaints/1/close
```

### Delete complaint
```bash
curl -X DELETE http://localhost:3000/api/v1/complaints/1
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Pagination defaults: page=1, rows=10
- Status automatically set to `open` when complaint is created
- Default severity is `medium` if not specified
- HR can filter complaints by multiple criteria (status, severity, type, employee)
- Resolution requires `resolution_notes` and automatically sets `resolved_date`
