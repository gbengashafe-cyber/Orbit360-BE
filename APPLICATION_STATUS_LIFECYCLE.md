# Application Status Lifecycle

## Overview

Application statuses in the recruitment pipeline **do NOT change automatically**. They only change when explicit actions are taken by recruiters.

## Status Change Triggers

### How Status Changes Happen

```
┌──────────────────────────────────────────────────────────┐
│ WAYS STATUS CHANGES IN PIPELINE                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 1. DRAG & DROP (Most Common)                            │
│    User drags card → status updates → API call          │
│                                                          │
│ 2. ACTION BUTTONS                                        │
│    - [Schedule Interview] → status: interview_scheduled │
│    - [Send Offer] → status: offered                     │
│    - [Hire] → status: hired                             │
│    - [Reject] → status: rejected                        │
│                                                          │
│ 3. API CALLS (Backend Updates)                          │
│    - Direct PUT /applications/:id/status                │
│    - Webhook/Automation (if implemented)                │
│                                                          │
│ 4. ADMIN ACTIONS (Future)                               │
│    - Bulk status change                                 │
│    - Scheduled status change                            │
│    - Automatic status based on date                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Status Transitions

### Valid Transitions

```
┌──────────────┐
│   APPLIED    │ (Submitted)
└──────┬───────┘
       │
       ├──→ UNDER_REVIEW ──→ INTERVIEWED ──→ INTERVIEW_SCHEDULED ──→ OFFERED ──→ HIRED
       │      (2)                (3)              (4)                  (5)        (6)
       │
       └──→ REJECTED (Can happen from any stage)
               (7)
```

### Status Details

| # | Status | Label | Description | What Triggers | Can Transition To |
|---|---|---|---|---|---|
| 1 | `applied` | Submitted | Applicant just applied | New application created | under_review, rejected |
| 2 | `under_review` | Under Review | Being actively reviewed | Drag from Submitted | interviewed, rejected |
| 3 | `interviewed` | Shortlisted | Interview completed | Drag from Under Review | interview_scheduled, rejected |
| 4 | `interview_scheduled` | Interview Scheduled | Interview appointment set | Schedule Interview button | offered, rejected |
| 5 | `offered` | Offer Made | Job offer sent | Send Offer button | hired, rejected |
| 6 | `hired` | Hired | Applicant hired | Hire button | None (Final) |
| 7 | `rejected` | Rejected | Application rejected | Reject button (any stage) | None (Final) |

## Frontend Status Changes

### User Drags Card

```javascript
User drags John from "Submitted" to "Under Review"
         ↓
onDragEnd() triggered
         ↓
1. Optimistic Update (immediate UI change)
   setLocalApplications(updated) // Card moves visually

2. API Call
   PUT /api/v1/recruitments/applications/1/status
   { "status": "under_review" }

3. Response Handling
   ✓ If 200 OK: Keep optimistic update
   ✗ If error: Revert UI change, show error

4. Refresh
   Call onRefreshApplications() to reload from backend
```

### Action Button Clicked

```javascript
User clicks [Schedule Interview] on applicant card
         ↓
scheduleInterview(applicationId, date, notes)
         ↓
POST /api/v1/recruitments/applications/:id/schedule-interview
{
  "interview_date": "2026-01-25T14:00:00Z",
  "interview_notes": "Technical round"
}
         ↓
Status updates to: "interview_scheduled"
         ↓
Pipeline refreshes
         ↓
Card moves to "Interview Scheduled" column
```

## Data Flow for Status Change

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION                                                 │
│ - Drag & Drop, or                                           │
│ - Click Action Button                                       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                            │
│                                                             │
│ 1. Optimistic Update                                       │
│    └─ setLocalApplications(updatedApps)                   │
│       Card appears to move immediately                     │
│                                                             │
│ 2. Send to Backend                                         │
│    └─ recruitmentService.updateApplicationStatus(         │
│         id, newStatus)                                     │
│       PUT /applications/:id/status                         │
│       { "status": "under_review" }                         │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (Node.js)                                           │
│                                                             │
│ 1. Validate Request                                        │
│    └─ Check status is valid enum value                    │
│                                                             │
│ 2. Update Database                                         │
│    └─ UPDATE job_applications                             │
│       SET status = "under_review"                          │
│       WHERE id = 1;                                        │
│                                                             │
│ 3. Return Response                                         │
│    └─ { status: "under_review", message: "..." }         │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React) - Response Handling                        │
│                                                             │
│ ✓ If 200 OK                                               │
│   └─ Keep optimistic UI change                            │
│   └─ Show success toast                                   │
│                                                             │
│ ✗ If Error (400, 404, 409)                               │
│   └─ Revert UI to previous state                          │
│   └─ Show error toast with message                        │
│   └─ Example: "Cannot send offer to rejected applicant"   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ REFRESH PIPELINE                                            │
│                                                             │
│ 1. Auto-Refresh (every 30 seconds)                        │
│    └─ onRefreshApplications()                             │
│    └─ loadData() from Recruitment.jsx                     │
│                                                             │
│ 2. Manual Refresh                                          │
│    └─ User closes modal and reopens                       │
│    └─ User clicks refresh button (if available)           │
│                                                             │
│ 3. After Status Update                                    │
│    └─ Immediately refreshes to sync with backend          │
└─────────────────────────────────────────────────────────────┘
```

## Auto-Refresh Behavior

### How Often Pipeline Updates

```javascript
// ApplicationPipeline.jsx
React.useEffect(() => {
  const refreshInterval = setInterval(() => {
    if (onRefreshApplications) {
      onRefreshApplications();  // Refresh
      setLastRefresh(Date.now());
    }
  }, 30000);  // ← Every 30 seconds

  return () => clearInterval(refreshInterval);
}, [onRefreshApplications]);
```

### What Triggers Refresh

✅ **Automatic:**
- Every 30 seconds while modal is open
- After applicant is added
- After status is changed
- After action button is clicked

✅ **Manual:**
- Close and reopen modal
- (Optional) Refresh button in modal

### Why Auto-Refresh?

1. **Sync with Backend** - Ensures UI matches database
2. **Multi-User Scenario** - If another recruiter updates same job
3. **Keep Data Fresh** - Prevents stale data display
4. **Error Recovery** - Fixes any desync issues

## Timeline Example

```
Time  Event                          Status        Pipeline Updates
────────────────────────────────────────────────────────────────
T+0s  Modal opens                    applied       Shows 1 in Submitted
      User drags John to next        (optimistic)  Card moves immediately
      
T+0.5s Backend confirms update       under_review  Confirms change
       Toast: "Status updated"                     
       
T+30s Auto-refresh triggered         under_review  Refreshes counts
      Reloads all applications                    Syncs with backend
      
T+60s Another refresh                under_review  Still 1 in Under Review
      (No change since last refresh)              (No changes made)
      
T+120s User closes modal                          Data saved
       User opens different job                   Pipeline cleared
```

## Important Notes

### ❌ Status Does NOT Change Automatically Because:
- Recruiter decisions should be explicit (audit trail)
- Status represents real-world actions taken
- No automatic aging or deadline-based changes
- Prevents accidental status changes

### ✅ Status ONLY Changes When:
- User explicitly drags applicant
- User clicks action button
- API call is made
- Backend updates (future: webhooks, integrations)

### 🔄 UI Updates When:
- Status changes (local first, then confirmed)
- Applications are refreshed (every 30 seconds)
- User reopens modal
- New applicant is added

## API Constraints

### What Backend Prevents

```
❌ Cannot send offer to rejected applicant
❌ Cannot hire rejected applicant
❌ Cannot reject hired applicant
❌ Cannot delete hired applicant
❌ Cannot schedule interview for rejected/hired applicant
❌ Cannot update closed job posting

✅ Can transition any status except those above
✅ Can always reject (from any stage)
```

## Testing Status Changes

### Test Case 1: Drag & Drop Status Change
```
1. Add applicant (appears in Submitted)
2. Drag to "Under Review"
3. Should see success toast
4. Card moves to new column
5. Refresh data → Status persists
```

### Test Case 2: Multiple Stages
```
1. Add applicant (Submitted)
2. Drag → Under Review (status: under_review)
3. Drag → Shortlisted (status: interviewed)
4. Drag → Interview Scheduled (status: interview_scheduled)
5. Verify all transitions work
```

### Test Case 3: Action Buttons
```
1. Add applicant (Submitted)
2. Right-click/button for "Schedule Interview"
3. Select date and notes
4. Click submit
5. Status changes to interview_scheduled
6. Card moves to correct column
```

### Test Case 4: Error Handling
```
1. Add applicant
2. Drag to Hired
3. Try to drag to Rejected
4. Should show error: "Cannot reject hired applicant"
5. Card reverts to Hired column
```

### Test Case 5: Concurrent Users (Future)
```
1. User A views job pipeline
2. User B adds applicant to same job
3. After 30 seconds, User A sees new applicant
4. (Sync via auto-refresh)
```

## Status Change Audit Trail

Currently, status changes are tracked by:
- `applied_date` - When application was created
- `interview_date` - When interview is scheduled
- Individual API calls (logged in backend)

### Future: Full Audit Log
```
Could implement:
- status_history table
- timestamp of each status change
- who made the change (user_id)
- reason/notes for change
```

## Summary

| Question | Answer |
|---|---|
| Do statuses change automatically? | ❌ No, never |
| What triggers status change? | ✅ User action (drag, button, API) |
| How often does pipeline refresh? | ✅ Every 30 seconds + after changes |
| Can multiple users work on same job? | ✅ Yes, auto-refresh keeps data sync |
| Are status changes reversible? | ✅ Yes, drag to different stage |
| Is there an audit trail? | ⏳ Not yet (can be implemented) |
| Can status changes be scheduled? | ❌ Not currently (can be added) |

---

**Key Takeaway:** Status changes are **manual, explicit actions** taken by recruiters. The system keeps data current through auto-refresh every 30 seconds while the modal is open.
