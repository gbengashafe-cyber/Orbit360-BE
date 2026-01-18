# Application Pipeline Setup Guide

## Overview

The Application Pipeline displays applicants grouped by their status stages in a Kanban-style board.

## Pipeline Stages

### Frontend Display ↔ Backend Status Mapping

| Frontend Label | Frontend Key | Backend Status |
|---|---|---|
| **Submitted** | `applied` | `applied` |
| **Under Review** | `under_review` | `under_review` |
| **Shortlisted** | `interviewed` | `interviewed` |
| **Interview Scheduled** | `interview_scheduled` | `interview_scheduled` |
| **Offer Made** | `offered` | `offered` |
| **Hired** | `hired` | `hired` |
| **Rejected** | `rejected` | `rejected` |

## How It Works

### 1. User Clicks "View Applications"

```
Recruitment.jsx
├─ Job Postings Table
│  └─ [View Applications] button clicked
└─ Sets selectedJob state
   └─ Opens Dialog modal
```

### 2. Modal Loads ApplicationPipeline

```
Dialog Modal Opens
│
└─ ApplicationPipeline Component
   ├─ Receives: job (job details), applications (from parent)
   ├─ Maps applications to stages by status
   └─ Displays 7 Kanban columns
```

### 3. Mapping Logic

```
Backend sends applications with status field
  "status": "applied"  ← Backend status
            ↓
Frontend maps to stage key:
  STAGE_TO_STATUS["applied"] = "applied"
            ↓
Filters and displays in column:
  getStageApplications("applied")
  → filters: app.status === "applied"
```

## Data Flow

### Getting Applications

```javascript
// Recruitment.jsx loads all applications
const applications = await recruitmentService.getJobApplications(1, 100);

// Pass filtered set to pipeline
<ApplicationPipeline
  job={selectedJob}
  applications={applications.filter(a => a.job_posting_id === selectedJob.id)}
/>
```

### OR Using Dedicated Endpoint

```javascript
// More efficient: get only for this job + grouped
const pipelineData = await recruitmentService.getApplicationPipeline(jobPostingId);
// Returns: { jobPosting, pipeline, summary }

// Then display
<ApplicationPipeline
  job={pipelineData.jobPosting}
  applications={pipelineData.pipeline.all}
/>
```

## Example Response Structure

### From `/applications/by-posting/:jobPostingId`

```json
{
  "data": [
    {
      "id": 1,
      "job_posting_id": 1,
      "applicant_id": 5,
      "status": "applied",
      "applicant_name": "John Doe",
      "applicant_email": "john@example.com",
      "applicant_phone": "08012345678",
      "salary_expectation": 500000,
      "applied_date": "2026-01-17T10:30:00Z",
      "interview_date": null,
      "rating": null
    },
    {
      "id": 2,
      "job_posting_id": 1,
      "applicant_id": 6,
      "status": "under_review",
      "applicant_name": "Jane Smith",
      ...
    }
  ]
}
```

### From `/applications/pipeline/:jobPostingId`

```json
{
  "data": {
    "jobPosting": {
      "id": 1,
      "title": "Senior Developer"
    },
    "pipeline": {
      "applied": [
        { id: 1, applicant_name: "John Doe", ... }
      ],
      "under_review": [
        { id: 2, applicant_name: "Jane Smith", ... }
      ],
      "interviewed": [],
      "interview_scheduled": [],
      "offered": [],
      "hired": [],
      "rejected": []
    },
    "summary": {
      "submitted": 1,
      "under_review": 1,
      "shortlisted": 0,
      "interview_scheduled": 0,
      "total": 2
    }
  }
}
```

## Display Logic

### Stage Rendering

```javascript
// For each stage in APPLICATION_STAGES
APPLICATION_STAGES.map((stage) => (
  <Droppable key={stage.key} droppableId={stage.key}>
    {/* Column for this stage */}
    <div>
      <h3>{stage.label}</h3>
      {/* Count badge */}
      <Badge>{getStageApplications(stage.key).length}</Badge>
      
      {/* Applicant cards */}
      {getStageApplications(stage.key).map((app) => (
        <Card>
          <h4>{app.applicant_name}</h4>
          <p>{app.applicant_email}</p>
          <p>{app.applicant_phone}</p>
        </Card>
      ))}
    </div>
  </Droppable>
))
```

## Drag & Drop Flow

### When User Drags Card Between Columns

```
User drags card from "Submitted" to "Under Review"
│
└─ onDragEnd() triggered
   ├─ source.droppableId = "applied"
   ├─ destination.droppableId = "under_review"
   ├─ draggableId = application.id
   │
   ├─ Optimistic update: setLocalApplications
   │  └─ Change app.status = "under_review"
   │
   ├─ API call: PUT /applications/1/status
   │  └─ { "status": "under_review" }
   │
   ├─ Response: 200 OK
   │  └─ { message: "Applicant status updated..." }
   │
   └─ Refresh applications
      └─ onRefreshApplications()
```

## Status Update Rules

### What Transitions Are Valid

✅ **Always allowed:**
- `applied` → `under_review` → `interviewed` → `interview_scheduled` → `offered` → `hired`
- `applied` → `rejected` (at any point)
- Any status → any status (no validation on drag)

❌ **Prevented by backend:**
- Cannot send offer to `rejected` applicant
- Cannot hire `rejected` applicant
- Cannot reject `hired` applicant
- Cannot delete `hired` applicant

## Testing Pipeline Display

### Test Case 1: View Applications with No Data
```
1. Create job posting (status = pending_approval)
2. Approve job posting
3. Click "View Applications"
4. Should show 7 empty columns with "No applications" text
```

### Test Case 2: Add Applicant and View
```
1. Click "Add Applicant"
2. Fill form: Name, Email, Phone, Salary
3. Click "Save Applicant"
4. New card should appear in "Submitted" column
```

### Test Case 3: Drag Applicant to Different Stage
```
1. Have applicant in "Submitted" column
2. Drag to "Under Review" column
3. Should see success message
4. Pipeline refreshes
5. Card moves to new column
```

### Test Case 4: Same Person, Multiple Jobs
```
1. Job A: Add John (john@ex.com) → Submitted
2. Job B: Add John (same email) → Should reuse, not create new
3. Both jobs should show John in their Submitted columns
4. Same applicant_id, different applications
```

## Troubleshooting

### Issue: All Stages Show "0 applications"

**Check:**
1. Verify applications exist in database:
   ```sql
   SELECT * FROM job_applications WHERE job_posting_id = 1;
   ```

2. Check status values match backend:
   ```javascript
   // Backend returns
   "status": "applied"
   // Frontend key
   STAGE_TO_STATUS["applied"] = "applied" ✓
   ```

3. Verify applications are being loaded:
   ```javascript
   // In browser console
   console.log(localApplications);
   // Should show array of applications
   ```

**Solution:**
- Add applicant via "Add Applicant" form
- Verify success toast appears
- Refresh modal or page
- Check if card appears in "Submitted" column

### Issue: Card Appears but Can't Drag

**Check:**
1. DragDropContext is wrapping the component
2. Droppable droppableId matches stage.key
3. Draggable draggableId is unique (application.id)

**Solution:**
- Ensure hello-pangea/dnd is installed
- Check browser console for errors
- Verify Draggable/Droppable props are set correctly

### Issue: Drag Works but Status Doesn't Update

**Check:**
1. Backend endpoint exists: `/applications/:id/status`
2. Correct status value sent: `{ "status": "under_review" }`
3. API response is 200 OK

**Solution:**
- Check network tab in browser dev tools
- Verify request body has correct status
- Ensure backend is running and responding
- Check for validation errors in response

## Configuration

### Stages (in ApplicationPipeline.jsx)

```javascript
const APPLICATION_STAGES = [
  { 
    key: "applied",              // Frontend key for filtering
    label: "Submitted",           // Display label
    color: "bg-blue-100 text-blue-700",  // Tailwind colors
    backendStatus: "applied"      // Backend status value
  },
  ...
];
```

To add a new stage:
1. Add entry to `APPLICATION_STAGES`
2. Add mapping in `STAGE_TO_STATUS`
3. Update backend status enum if needed
4. Test filtering and drag/drop

## Performance Optimization

### Current Approach
- Loads all applications (for all jobs)
- Filters by job_posting_id on frontend
- Maps and displays

### Optimized Approach
- Use `/applications/pipeline/:jobPostingId` endpoint
- Returns pre-grouped, pre-counted data
- Reduces network payload
- Reduces frontend processing

### To Switch to Optimized
```javascript
// In Recruitment.jsx, replace:
const applications = await recruitmentService.getJobApplications();

// With:
const pipelineData = await recruitmentService.getApplicationPipeline(job.id);

// Then pass to ApplicationPipeline:
<ApplicationPipeline
  job={pipelineData.data.jobPosting}
  applications={pipelineData.data.pipeline}
/>
```

## Success Indicators

✅ **Pipeline is working when:**
1. Modal opens showing 7 columns
2. Each column has a count (0 or number)
3. Adding applicant shows card in "Submitted"
4. Can drag cards between columns
5. Dragging triggers status update
6. Pipeline refreshes after drag
7. Same person in multiple jobs shows correctly
8. All error messages display properly

## Next Steps

1. **Verify Mapping** - Check APPLICATION_STAGES matches backend statuses
2. **Test Display** - Add applicant and verify pipeline shows it
3. **Test Drag** - Drag applicant to different stage
4. **Monitor** - Check network tab and console for errors
5. **Optimize** - Switch to pipeline endpoint if desired
