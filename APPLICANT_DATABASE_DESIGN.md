# Applicant Database Design - Option 2 (Recommended)

## Overview

This document explains the database design for the recruitment module using **separate Applicant and JobApplication tables** (Option 2).

## Architecture

### Two Tables:

```
┌─────────────────┐         ┌──────────────────┐
│   Applicants    │         │  JobApplications │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │ (1:N)   │ id (PK)          │
│ name            │◄────────│ applicant_id (FK)│
│ email (UNIQUE)  │         │ job_posting_id   │
│ phone           │         │ applied_date     │
│ resume_url      │         │ status           │
│ cover_letter    │         │ interview_date   │
│ salary_exp      │         │ interview_notes  │
│ source          │         │ rating           │
│ notes           │         │ [denorm fields]  │
│ createdAt       │         │ createdAt        │
│ updatedAt       │         │ updatedAt        │
└─────────────────┘         └──────────────────┘
```

## Benefits

✅ **Applicant Reusability**: One applicant can apply to multiple jobs  
✅ **Data Normalization**: Single source of truth for applicant info  
✅ **Reduced Duplication**: No duplicate applicant records  
✅ **Scalability**: Better for large applicant databases  
✅ **Flexibility**: Easy to add applicant fields without affecting applications  

## Database Schema

### Applicants Table

```sql
CREATE TABLE applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  resume_url VARCHAR(500),
  cover_letter TEXT,
  salary_expectation DECIMAL(12, 2),
  source ENUM('linkedin', 'indeed', 'referral', 'direct', 'manual') DEFAULT 'manual',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### JobApplications Table (Refactored)

```sql
CREATE TABLE job_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_posting_id INT NOT NULL,
  applicant_id INT NOT NULL,
  applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('applied', 'under_review', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected') DEFAULT 'applied',
  interview_date TIMESTAMP,
  interview_notes TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  
  -- Denormalized fields (for backward compatibility)
  applicant_name VARCHAR(255),
  applicant_email VARCHAR(255),
  applicant_phone VARCHAR(20),
  resume_url VARCHAR(500),
  cover_letter TEXT,
  salary_expectation DECIMAL(12, 2),
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_posting_id) REFERENCES job_postings(id),
  FOREIGN KEY (applicant_id) REFERENCES applicants(id),
  UNIQUE KEY unique_application (job_posting_id, applicant_id)
);
```

## Data Flow

### Scenario 1: Adding a New Applicant

```
User submits application form
    ↓
Check if applicant exists (by email)
    ↓
If NO: Create new Applicant record
If YES: Use existing Applicant record
    ↓
Create JobApplication record linking to applicant
```

### Scenario 2: Applicant Applies to Multiple Jobs

```
Applicant A (Email: john@example.com)
    ↓
Apply to Job 1 → JobApplication(applicant_id=1, job_posting_id=1)
Apply to Job 2 → JobApplication(applicant_id=1, job_posting_id=2)
Apply to Job 3 → JobApplication(applicant_id=1, job_posting_id=3)
    ↓
All linked to same Applicant record (id=1)
```

## API Changes Required

### Update Create Application Endpoint

**Current** (creates new applicant each time):
```
POST /applications
{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  ...
}
```

**New** (reuses or creates applicant):
```
POST /applications
{
  "job_posting_id": 1,
  "applicant_id": 1  // Use existing applicant
}
OR
{
  "job_posting_id": 1,
  "applicant": {     // Create new applicant
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "resume_url": "...",
    "salary_expectation": 500000,
    "source": "manual"
  }
}
```

### New Endpoint: Get/Create Applicant

```
GET /applicants?email=john@example.com

POST /applicants
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "resume_url": "...",
  "salary_expectation": 500000,
  "source": "manual"
}
```

## Migration Path

### Step 1: Create Applicants Table
```sql
CREATE TABLE applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  resume_url VARCHAR(500),
  cover_letter TEXT,
  salary_expectation DECIMAL(12, 2),
  source VARCHAR(50) DEFAULT 'manual',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Step 2: Add applicant_id to job_applications
```sql
ALTER TABLE job_applications 
ADD COLUMN applicant_id INT;
```

### Step 3: Migrate Data from job_applications to applicants
```sql
INSERT INTO applicants (name, email, phone, resume_url, cover_letter, salary_expectation, source, createdAt, updatedAt)
SELECT DISTINCT 
  applicant_name, 
  applicant_email, 
  applicant_phone, 
  resume_url, 
  cover_letter, 
  salary_expectation,
  'manual',
  createdAt,
  updatedAt
FROM job_applications
WHERE applicant_email IS NOT NULL
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
```

### Step 4: Update job_applications with applicant_id references
```sql
UPDATE job_applications ja
INNER JOIN applicants a ON ja.applicant_email = a.email
SET ja.applicant_id = a.id;
```

### Step 5: Add Foreign Key Constraint
```sql
ALTER TABLE job_applications
ADD CONSTRAINT fk_applicant_id 
FOREIGN KEY (applicant_id) REFERENCES applicants(id);

ALTER TABLE job_applications
ADD UNIQUE KEY unique_application (job_posting_id, applicant_id);
```

### Step 6: Make applicant_id required and clean up
```sql
ALTER TABLE job_applications 
MODIFY COLUMN applicant_id INT NOT NULL;
```

## Code Changes

### Models
- ✅ Created: `Applicant` model
- ✅ Updated: `JobApplication` model (now has applicant_id)

### Controllers
- Need to update: `create()` method in `JobApplicationController`
- Need to add: Applicant CRUD operations

### Validators
- Need to update: Application creation validation

## Backward Compatibility

The denormalized fields (`applicant_name`, `applicant_email`, etc.) are retained in `job_applications` table for backward compatibility. When fetching applications, you can either:

1. **Include associated applicant data**:
```typescript
const application = await JobApplication.findByPk(id, {
  include: [{ association: 'applicant' }]
});
```

2. **Use denormalized fields**:
```typescript
const application = await JobApplication.findByPk(id);
// Use application.applicant_name, application.applicant_email, etc.
```

## References

### Models
- `src/features/recruitment/applicant.model.ts` - New Applicant model
- `src/features/recruitment/job-application.model.ts` - Refactored JobApplication

### Implementation Status
- ✅ Models created
- ⏳ Controllers need update
- ⏳ Database migration needed
- ⏳ API endpoints need adjustment
