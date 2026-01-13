# Performance Management Module - API Documentation

## Overview
The Performance Management module enables organizations to set employee goals, track progress, and conduct appraisals. It includes goal management, appraisal cycle creation, and performance tracking with a comprehensive dashboard.

## Base URL
```
/api/v1/performance
```

---

## Performance Dashboard

### Get Performance Dashboard
**GET** `/dashboard`

Retrieve performance metrics and KPIs for HR dashboard.

**Query Parameters:**
- `employee_id` (integer, optional) - Filter metrics for specific employee

**Response Example:**
```json
{
  "data": {
    "activeAppraisalCycles": 3,
    "pendingAppraisals": 12,
    "completedAppraisals": 45,
    "activeGoals": 87,
    "avgGoalCompletion": 72.50,
    "avgAppraisalRating": 3.75
  }
}
```

**Metrics:**
- **Active Appraisal Cycles** - Number of ongoing appraisal cycles
- **Pending Appraisals** - Appraisals awaiting submission
- **Completed Appraisals** - Total appraisals reviewed this year
- **Active Goals** - Goals in progress or not started
- **Avg Goal Completion** - Average completion percentage (0-100)
- **Avg Appraisal Rating** - Average rating from completed appraisals (1-5)

---

## Goals Management

### List All Goals
**GET** `/goals`

Retrieve all employee goals with filtering options.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `rows` (integer, default: 10) - Records per page
- `status` (string, optional) - Filter by status: `not_started`, `in_progress`, `completed`, `failed`, `on_hold`
- `employee_id` (integer, optional) - Filter by employee

**Response Example:**
```json
{
  "data": [
    {
      "id": 1,
      "employee_id": 5,
      "title": "Increase Sales by 20%",
      "description": "Achieve Q1 sales target of 20% growth",
      "target_value": 100000,
      "current_progress": 75000,
      "completion_percentage": 75,
      "status": "in_progress",
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-03-31T23:59:59Z",
      "assigned_by": "manager@example.com",
      "createdAt": "2024-01-01T10:30:00Z",
      "updatedAt": "2024-02-15T14:20:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "rows": 10,
    "pages": 5
  }
}
```

### Get Goal by ID
**GET** `/goals/:id`

Retrieve a specific goal's details.

**Path Parameters:**
- `id` (integer, required) - Goal ID

**Response:**
```json
{
  "data": {
    "id": 1,
    "employee_id": 5,
    "title": "Increase Sales by 20%",
    "description": "Achieve Q1 sales target of 20% growth",
    "target_value": 100000,
    "current_progress": 75000,
    "completion_percentage": 75,
    "status": "in_progress",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-03-31T23:59:59Z",
    "assigned_by": "manager@example.com",
    "createdAt": "2024-01-01T10:30:00Z",
    "updatedAt": "2024-02-15T14:20:00Z"
  }
}
```

### Create Goal
**POST** `/goals`

Create a new goal for an employee.

**Request Body:**
```json
{
  "employee_id": 5,
  "title": "Complete Project Alpha",
  "description": "Successfully deliver Project Alpha within budget and timeline",
  "target_value": 500000,
  "start_date": "2024-01-15T00:00:00Z",
  "end_date": "2024-06-30T23:59:59Z",
  "assigned_by": "manager@example.com"
}
```

**Required Fields:**
- `employee_id` (integer) - Employee ID
- `title` (string) - Goal title (3-255 characters)
- `description` (string) - Goal description (min 10 characters)
- `start_date` (datetime) - Goal start date (ISO 8601)
- `end_date` (datetime) - Goal end date (ISO 8601)

**Optional Fields:**
- `target_value` (number) - Target numeric value
- `assigned_by` (string) - Manager/assigner name

**Response:**
```json
{
  "data": {
    "id": 45,
    "employee_id": 5,
    "title": "Complete Project Alpha",
    "description": "Successfully deliver Project Alpha within budget and timeline",
    "target_value": 500000,
    "current_progress": 0,
    "completion_percentage": 0,
    "status": "not_started",
    "start_date": "2024-01-15T00:00:00Z",
    "end_date": "2024-06-30T23:59:59Z",
    "assigned_by": "manager@example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Goal created successfully"
}
```

### Update Goal
**PUT** `/goals/:id`

Update goal details.

**Path Parameters:**
- `id` (integer, required) - Goal ID

**Request Body:**
```json
{
  "title": "Complete Project Alpha - Updated",
  "description": "Successfully deliver Project Alpha with enhanced features",
  "target_value": 550000
}
```

**Response:**
```json
{
  "data": { ... },
  "message": "Goal updated successfully"
}
```

### Update Goal Progress
**PATCH** `/goals/:id/progress`

Update goal progress tracking.

**Path Parameters:**
- `id` (integer, required) - Goal ID

**Request Body:**
```json
{
  "current_progress": 250000,
  "completion_percentage": 50,
  "status": "in_progress"
}
```

**Optional Fields:**
- `current_progress` (number) - Current progress value
- `completion_percentage` (number, 0-100) - Completion percentage
- `status` (string) - One of: `not_started`, `in_progress`, `completed`, `failed`, `on_hold`

**Response:**
```json
{
  "data": { ... },
  "message": "Goal progress updated successfully"
}
```

### Delete Goal
**DELETE** `/goals/:id`

Delete a goal record.

**Path Parameters:**
- `id` (integer, required) - Goal ID

**Response:**
```json
{
  "message": "Goal deleted successfully"
}
```

---

## Appraisal Cycles

### List Appraisal Cycles
**GET** `/cycles`

Retrieve all appraisal cycles.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `rows` (integer, default: 10) - Records per page
- `status` (string, optional) - Filter by status: `planning`, `active`, `review`, `completed`, `closed`
- `department` (string, optional) - Filter by department

**Response Example:**
```json
{
  "data": [
    {
      "id": 1,
      "cycle_name": "Annual Appraisal 2024",
      "description": "Comprehensive performance review for the fiscal year",
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-12-31T23:59:59Z",
      "review_deadline": "2024-12-15T23:59:59Z",
      "status": "active",
      "created_by": "hr_manager@example.com",
      "department": null,
      "createdAt": "2023-12-15T10:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Appraisal Cycle by ID
**GET** `/cycles/:id`

Retrieve specific appraisal cycle details.

**Path Parameters:**
- `id` (integer, required) - Appraisal Cycle ID

### Create Appraisal Cycle
**POST** `/cycles`

Create a new appraisal cycle.

**Request Body:**
```json
{
  "cycle_name": "Mid-Year Review 2024",
  "description": "Mid-year performance review and goal adjustment",
  "start_date": "2024-07-01T00:00:00Z",
  "end_date": "2024-07-31T23:59:59Z",
  "review_deadline": "2024-07-25T23:59:59Z",
  "created_by": "hr_manager@example.com",
  "department": "Engineering"
}
```

**Required Fields:**
- `cycle_name` (string) - Cycle name (3-255 characters)
- `start_date` (datetime) - Cycle start date
- `end_date` (datetime) - Cycle end date
- `review_deadline` (datetime) - Review deadline
- `created_by` (string) - Creator name/email

**Optional Fields:**
- `description` (string) - Cycle description
- `department` (string) - Department (if cycle-specific)

**Response:**
```json
{
  "data": {
    "id": 2,
    "cycle_name": "Mid-Year Review 2024",
    "description": "Mid-year performance review and goal adjustment",
    "start_date": "2024-07-01T00:00:00Z",
    "end_date": "2024-07-31T23:59:59Z",
    "review_deadline": "2024-07-25T23:59:59Z",
    "status": "planning",
    "created_by": "hr_manager@example.com",
    "department": "Engineering",
    "createdAt": "2024-02-20T10:30:00Z",
    "updatedAt": "2024-02-20T10:30:00Z"
  },
  "message": "Appraisal cycle created successfully"
}
```

### Update Appraisal Cycle
**PUT** `/cycles/:id`

Update appraisal cycle details.

**Path Parameters:**
- `id` (integer, required) - Appraisal Cycle ID

**Request Body:**
```json
{
  "review_deadline": "2024-07-28T23:59:59Z"
}
```

### Activate Appraisal Cycle
**POST** `/cycles/:id/activate`

Change cycle status from planning to active.

**Path Parameters:**
- `id` (integer, required) - Appraisal Cycle ID

**Response:**
```json
{
  "data": { ... },
  "message": "Appraisal cycle activated successfully"
}
```

### Close Appraisal Cycle
**POST** `/cycles/:id/close`

Close an appraisal cycle.

**Path Parameters:**
- `id` (integer, required) - Appraisal Cycle ID

---

## Appraisals

### List Appraisals
**GET** `/appraisals`

Retrieve all appraisals with filtering.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `rows` (integer, default: 10) - Records per page
- `status` (string, optional) - Filter by status: `pending`, `in_progress`, `submitted`, `completed`, `reviewed`
- `appraisal_cycle_id` (integer, optional) - Filter by cycle
- `employee_id` (integer, optional) - Filter by employee

**Response Example:**
```json
{
  "data": [
    {
      "id": 1,
      "appraisal_cycle_id": 1,
      "employee_id": 5,
      "manager_id": 2,
      "overall_rating": 4.2,
      "performance_summary": "Strong performer with excellent communication skills",
      "strengths": "Leadership, Problem-solving, Team collaboration",
      "areas_for_improvement": "Time management, Delegation",
      "goals_achievement": 85,
      "status": "reviewed",
      "submitted_date": "2024-02-10T10:00:00Z",
      "reviewed_date": "2024-02-15T14:30:00Z",
      "createdAt": "2024-02-01T09:00:00Z",
      "updatedAt": "2024-02-15T14:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Appraisal by ID
**GET** `/appraisals/:id`

Retrieve specific appraisal details.

**Path Parameters:**
- `id` (integer, required) - Appraisal ID

### Submit Appraisal
**POST** `/appraisals`

Create and submit a new appraisal.

**Request Body:**
```json
{
  "appraisal_cycle_id": 1,
  "employee_id": 5,
  "manager_id": 2,
  "performance_summary": "Strong performer meeting all objectives",
  "strengths": "Leadership, Problem-solving, Communication",
  "areas_for_improvement": "Time management, Report writing"
}
```

**Required Fields:**
- `appraisal_cycle_id` (integer) - Appraisal cycle ID
- `employee_id` (integer) - Employee being appraised
- `manager_id` (integer) - Manager conducting appraisal

**Optional Fields:**
- `performance_summary` (string) - Summary comments
- `strengths` (string) - Employee strengths
- `areas_for_improvement` (string) - Areas needing improvement

**Response:**
```json
{
  "data": {
    "id": 45,
    "appraisal_cycle_id": 1,
    "employee_id": 5,
    "manager_id": 2,
    "overall_rating": null,
    "performance_summary": "Strong performer meeting all objectives",
    "strengths": "Leadership, Problem-solving, Communication",
    "areas_for_improvement": "Time management, Report writing",
    "goals_achievement": 0,
    "status": "in_progress",
    "submitted_date": "2024-02-20T11:00:00Z",
    "reviewed_date": null,
    "createdAt": "2024-02-20T11:00:00Z",
    "updatedAt": "2024-02-20T11:00:00Z"
  },
  "message": "Appraisal submitted successfully"
}
```

### Update Appraisal
**PUT** `/appraisals/:id`

Update appraisal details.

**Path Parameters:**
- `id` (integer, required) - Appraisal ID

**Request Body:**
```json
{
  "performance_summary": "Updated summary with more details",
  "strengths": "Leadership, Problem-solving, Communication, Initiative"
}
```

### Submit Appraisal for Review
**POST** `/appraisals/:id/submit`

Submit a draft appraisal for manager review.

**Path Parameters:**
- `id` (integer, required) - Appraisal ID

**Response:**
```json
{
  "data": { ... },
  "message": "Appraisal submitted for review"
}
```

### Review Appraisal
**POST** `/appraisals/:id/review`

Complete appraisal review with ratings.

**Path Parameters:**
- `id` (integer, required) - Appraisal ID

**Request Body:**
```json
{
  "overall_rating": 4.5,
  "goals_achievement": 90
}
```

**Required Fields:**
- `overall_rating` (number, 1-5) - Overall performance rating
- `goals_achievement` (number, 0-100) - Goal achievement percentage

**Response:**
```json
{
  "data": {
    "id": 1,
    "overall_rating": 4.5,
    "goals_achievement": 90,
    "status": "reviewed",
    "reviewed_date": "2024-02-20T15:30:00Z",
    ...
  },
  "message": "Appraisal reviewed successfully"
}
```

### Delete Appraisal
**DELETE** `/appraisals/:id`

Delete an appraisal record.

**Path Parameters:**
- `id` (integer, required) - Appraisal ID

---

## Goal Status

| Status | Description |
|--------|-------------|
| `not_started` | Goal not yet initiated |
| `in_progress` | Goal in progress |
| `completed` | Goal successfully completed |
| `failed` | Goal not achieved |
| `on_hold` | Goal temporarily paused |

---

## Appraisal Cycle Status

| Status | Description |
|--------|-------------|
| `planning` | Cycle in planning phase |
| `active` | Cycle active, appraisals ongoing |
| `review` | Review phase, no new submissions |
| `completed` | All appraisals completed |
| `closed` | Cycle closed, no changes allowed |

---

## Appraisal Status

| Status | Description |
|--------|-------------|
| `pending` | Awaiting appraisal initiation |
| `in_progress` | Appraisal draft in progress |
| `submitted` | Submitted for review |
| `completed` | Review completed |
| `reviewed` | Final review done |

---

## Database Schema

### goals table
```sql
id                     INTEGER PRIMARY KEY AUTO_INCREMENT
employee_id            INTEGER NOT NULL
title                  VARCHAR(255) NOT NULL
description            TEXT NOT NULL
target_value           DECIMAL(12,2)
current_progress       DECIMAL(12,2) DEFAULT 0
status                 ENUM(...) DEFAULT 'not_started'
start_date             DATETIME NOT NULL
end_date               DATETIME NOT NULL
assigned_by            VARCHAR(255)
completion_percentage  INTEGER DEFAULT 0
createdAt              DATETIME
updatedAt              DATETIME
```

### appraisal_cycles table
```sql
id                 INTEGER PRIMARY KEY AUTO_INCREMENT
cycle_name         VARCHAR(255) NOT NULL
description        TEXT
start_date         DATETIME NOT NULL
end_date           DATETIME NOT NULL
review_deadline    DATETIME NOT NULL
status             ENUM(...) DEFAULT 'planning'
created_by         VARCHAR(255) NOT NULL
department         VARCHAR(255)
createdAt          DATETIME
updatedAt          DATETIME
```

### appraisals table
```sql
id                      INTEGER PRIMARY KEY AUTO_INCREMENT
appraisal_cycle_id      INTEGER NOT NULL
employee_id             INTEGER NOT NULL
manager_id              INTEGER NOT NULL
overall_rating          DECIMAL(3,2)
performance_summary     TEXT
strengths               TEXT
areas_for_improvement   TEXT
goals_achievement       INTEGER DEFAULT 0
status                  ENUM(...) DEFAULT 'pending'
submitted_date          DATETIME
reviewed_date           DATETIME
createdAt               DATETIME
updatedAt               DATETIME
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Title must be at least 3 characters"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Goal not found"
  }
}
```

---

## cURL Examples

### Get performance dashboard
```bash
curl "http://localhost:3000/api/v1/performance/dashboard"
```

### Create goal
```bash
curl -X POST http://localhost:3000/api/v1/performance/goals \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 5,
    "title": "Increase Sales by 20%",
    "description": "Achieve Q1 sales target of 20% growth",
    "target_value": 100000,
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-03-31T23:59:59Z",
    "assigned_by": "manager@example.com"
  }'
```

### Update goal progress
```bash
curl -X PATCH http://localhost:3000/api/v1/performance/goals/1/progress \
  -H "Content-Type: application/json" \
  -d '{
    "current_progress": 50000,
    "completion_percentage": 50,
    "status": "in_progress"
  }'
```

### Create appraisal cycle
```bash
curl -X POST http://localhost:3000/api/v1/performance/cycles \
  -H "Content-Type: application/json" \
  -d '{
    "cycle_name": "Annual Appraisal 2024",
    "description": "Comprehensive performance review",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-12-31T23:59:59Z",
    "review_deadline": "2024-12-15T23:59:59Z",
    "created_by": "hr_manager@example.com"
  }'
```

### Submit appraisal
```bash
curl -X POST http://localhost:3000/api/v1/performance/appraisals \
  -H "Content-Type: application/json" \
  -d '{
    "appraisal_cycle_id": 1,
    "employee_id": 5,
    "manager_id": 2,
    "performance_summary": "Strong performer",
    "strengths": "Leadership, Problem-solving",
    "areas_for_improvement": "Time management"
  }'
```

### Review appraisal
```bash
curl -X POST http://localhost:3000/api/v1/performance/appraisals/1/review \
  -H "Content-Type: application/json" \
  -d '{
    "overall_rating": 4.5,
    "goals_achievement": 90
  }'
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Pagination defaults: page=1, rows=10
- Rating scale for appraisals: 1-5
- Completion percentage: 0-100
- All dates must be in valid ISO 8601 datetime format
- Appraisal cycles should be created before submitting appraisals
