# Pipeline Status Mapping Reference

## Quick Reference Table

| # | Frontend Display | Frontend Key | Backend Status | Drag Target | Color |
|---|---|---|---|---|---|
| 1 | **Submitted** | `applied` | `applied` | `applied` | Blue |
| 2 | **Under Review** | `under_review` | `under_review` | `under_review` | Yellow |
| 3 | **Shortlisted** | `interviewed` | `interviewed` | `interviewed` | Purple |
| 4 | **Interview Scheduled** | `interview_scheduled` | `interview_scheduled` | `interview_scheduled` | Orange |
| 5 | **Offer Made** | `offered` | `offered` | `offered` | Green |
| 6 | **Hired** | `hired` | `hired` | `hired` | Emerald |
| 7 | **Rejected** | `rejected` | `rejected` | `rejected` | Red |

## Flow Diagram

```
Application Created
        ↓
  Status: "applied"
        ↓
  ┌─────────────────────┐
  │    SUBMITTED        │
  │  (0 applications)   │
  │  [Add Applicant]    │
  └──────────┬──────────┘
             │ Drag to next stage
             ↓
  ┌─────────────────────┐
  │   UNDER REVIEW      │
  │  (0 applications)   │
  └──────────┬──────────┘
             │ Drag to next stage
             ↓
  ┌─────────────────────┐
  │   SHORTLISTED       │
  │  (0 applications)   │
  └──────────┬──────────┘
             │ Drag to next stage
             ↓
  ┌─────────────────────┐
  │ INTERVIEW SCHEDULED │
  │  (0 applications)   │
  └──────────┬──────────┘
             │ Drag to next stage
             ↓
  ┌─────────────────────┐
  │   OFFER MADE        │
  │  (0 applications)   │
  └──────────┬──────────┘
             │ Drag to next stage
             ↓
  ┌─────────────────────┐
  │      HIRED          │
  │  (0 applications)   │
  └─────────────────────┘
             
  OR at any point:
             │ Drag to reject column
             ↓
  ┌─────────────────────┐
  │     REJECTED        │
  │  (0 applications)   │
  └─────────────────────┘
```

## Status Code Mapping (Backend)

```typescript
// Valid status enum values
type ApplicationStatus = 
  | 'applied'              // Newly submitted
  | 'under_review'         // Being reviewed
  | 'interviewed'          // Interview completed (Shortlisted)
  | 'interview_scheduled'  // Interview scheduled
  | 'offered'              // Offer made
  | 'hired'                // Hired
  | 'rejected';            // Rejected
```

## Frontend Stage Key Mapping (Component)

```javascript
const STAGE_TO_STATUS = {
  'applied': 'applied',
  'under_review': 'under_review',
  'interviewed': 'interviewed',
  'interview_scheduled': 'interview_scheduled',
  'offered': 'offered',
  'hired': 'hired',
  'rejected': 'rejected'
};
```

## Data Transformation

### From Backend Response
```json
{
  "status": "applied"           ← Backend status value
}
```

### To Frontend Display
```javascript
// Frontend filters by droppableId/stage.key
if (app.status === STAGE_TO_STATUS[stage.key]) {
  // Matches! Display in this column
}

// Example:
// app.status = "applied"
// stage.key = "applied"
// STAGE_TO_STATUS["applied"] = "applied" ✓
// Display in this column
```

## API Endpoints

### Create Application (Auto-Dedup)
```
POST /api/v1/recruitments/applications

Response: { status: "applied" }
↓
Displayed in: SUBMITTED column
```

### Update Application Status
```
PUT /api/v1/recruitments/applications/:id/status
{ "status": "under_review" }

Response: { status: "under_review" }
↓
Displayed in: UNDER REVIEW column
```

### Get Applications by Job
```
GET /api/v1/recruitments/applications/by-posting/:jobPostingId

Response: [
  { status: "applied" },
  { status: "under_review" },
  { status: "interviewed" }
]
↓
Grouped into respective columns
```

## Pipeline View Example

```
When you have 3 applicants:

SUBMITTED          UNDER REVIEW       SHORTLISTED
1 applications     1 applications     1 applications
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ John Doe     │  │ Jane Smith   │  │ Bob Johnson  │
│ john@ex.com  │  │ jane@ex.com  │  │ bob@ex.com   │
│ 08012345678  │  │ 08098765432  │  │ 08056789012  │
└──────────────┘  └──────────────┘  └──────────────┘
  Drag to →         Drag to →         Drag to →
  
INTERVIEW SCHEDULED  OFFER MADE       HIRED          REJECTED
0 applications      0 applications   0 applications  0 applications
No applications     No applications  No applications No applications
```

## Drag & Drop Status Update

### How Drag Maps to Status

```
User drags John from SUBMITTED to UNDER REVIEW

onDragEnd({
  draggableId: "1",                    // Application ID
  source: { droppableId: "applied" },
  destination: { droppableId: "under_review" }
})

↓ Maps to:

newStatus = STAGE_TO_STATUS[destination.droppableId]
          = STAGE_TO_STATUS["under_review"]
          = "under_review"

↓ Sends:

PUT /api/v1/recruitments/applications/1/status
{ "status": "under_review" }

↓ Backend updates:

UPDATE job_applications 
SET status = "under_review" 
WHERE id = 1;

↓ Response:

{ status: "under_review" }

↓ Frontend:

Card moves from SUBMITTED column to UNDER REVIEW column
```

## Testing Checklist

Use this reference while testing:

- [ ] Add applicant → Appears in **SUBMITTED** (status: `applied`)
- [ ] Drag to column 2 → **UNDER REVIEW** (status: `under_review`)
- [ ] Drag to column 3 → **SHORTLISTED** (status: `interviewed`)
- [ ] Drag to column 4 → **INTERVIEW SCHEDULED** (status: `interview_scheduled`)
- [ ] Drag to column 5 → **OFFER MADE** (status: `offered`)
- [ ] Drag to column 6 → **HIRED** (status: `hired`)
- [ ] Drag to column 7 → **REJECTED** (status: `rejected`)

## Verification Steps

### 1. Check Database Status Value
```sql
SELECT id, applicant_name, status FROM job_applications;
-- Should show: applied, under_review, interviewed, interview_scheduled, offered, hired, rejected
```

### 2. Check API Response
```bash
curl http://localhost:3000/api/v1/recruitments/applications/by-posting/1 \
  | jq '.data[].status'
# Should output status values matching above
```

### 3. Check Frontend Console
```javascript
// Open DevTools Console and check
localApplications
// Should show array with status field matching backend

// Check filtering works
getStageApplications("applied")
// Should return apps with status === "applied"
```

### 4. Check Drag Works
1. Open DevTools → Network tab
2. Drag card to new column
3. Should see PUT request to `/applications/:id/status`
4. Request body: `{ "status": "under_review" }`
5. Response: 200 OK

## Common Mistakes

❌ **Wrong mapping:**
```javascript
// DON'T DO THIS
if (app.status === stage.key)  // If stage.key = "submitted" but app.status = "applied"
```

✅ **Correct mapping:**
```javascript
// DO THIS
if (app.status === STAGE_TO_STATUS[stage.key])  // Maps "submitted" → "applied"
```

---

**Keep this reference handy while testing the pipeline!**
