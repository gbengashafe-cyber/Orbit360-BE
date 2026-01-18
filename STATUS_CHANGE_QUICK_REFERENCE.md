# Status Change - Quick Reference

## Direct Answer

**Q: Do statuses change over time on frontend?**

**A: No. Statuses ONLY change when:**
1. ✅ User drags applicant card to different column
2. ✅ User clicks action button (Schedule Interview, Hire, Reject, etc.)
3. ✅ Backend updates via API call

**No automatic time-based status changes.**

---

## How to Change Status

### Method 1: Drag & Drop (Easiest)
```
1. Find applicant card in pipeline
2. Click and hold the card
3. Drag to desired column
4. Release to drop
5. Status updates immediately (optimistic)
6. Backend confirms the change
7. Success toast appears
```

**Example:**
```
Submitted column (John Doe)
        ↓ Drag
Under Review column (John Doe appears)
        ↓ Backend confirms
Success toast: "Status updated to Under Review"
```

### Method 2: Action Buttons (For Specific Actions)
```
1. Find applicant card
2. Right-click or look for action menu
3. Click action:
   - [Schedule Interview] → Sets interview_scheduled status
   - [Send Offer] → Sets offered status
   - [Hire] → Sets hired status
   - [Reject] → Sets rejected status
4. Fill required fields (e.g., interview date)
5. Submit
6. Status changes
```

### Method 3: API Call (Backend/Admin)
```
PUT /api/v1/recruitments/applications/1/status
Content-Type: application/json

{
  "status": "under_review"
}

Response: 200 OK
{ "status": "under_review", "message": "..." }
```

---

## Current Flow

```
Modal Opens
  ↓ Shows pipeline with Submitted (1 application)
  ↓
Auto-refresh Every 30 Seconds
  ├─ Checks for new applicants
  ├─ Checks for status changes
  └─ Updates counts
  
When User Drags Card
  ├─ Optimistic update (immediate)
  ├─ API call to backend
  ├─ Backend confirms
  └─ Refresh to sync
  
When User Adds Applicant
  ├─ New card appears in Submitted
  ├─ Count increases
  └─ Auto-refresh confirms
```

---

## Status Legend

| Stage | Backend Key | Count Shows | Data Present |
|---|---|---|---|
| 📝 Submitted | `applied` | Yes | ✅ John Doe |
| 👀 Under Review | `under_review` | 0 | No applications |
| 💬 Shortlisted | `interviewed` | 0 | No applications |
| 📅 Interview Scheduled | `interview_scheduled` | 0 | No applications |
| 💼 Offer Made | `offered` | 0 | No applications |
| ✅ Hired | `hired` | 0 | No applications |
| ❌ Rejected | `rejected` | 0 | No applications |

---

## What You're Seeing

```
Your current view shows:
┌─────────────────────────────────────────────────┐
│ Application Pipeline: Senior Software Developer │
├─────────────────────────────────────────────────┤
│                                                 │
│ Submitted (1)      Under Review (0) ...         │
│ ┌────────────────┐  "No applications" ...       │
│ │ John Doe       │                              │
│ │ john@ex...     │                              │
│ │ 08012345678    │                              │
│ │ Expected:₦500K │                              │
│ └────────────────┘                              │
│                                                 │
│ [Add Applicant] [Drag John to next stage]       │
└─────────────────────────────────────────────────┘
```

**Your data:**
- ✅ Job posting loaded
- ✅ 1 applicant in Submitted column
- ✅ Other columns empty (0 applications each)
- ✅ System working correctly

**To change status:**
- 👉 Drag John from Submitted → Under Review

---

## Common Questions

**Q: Do applicants auto-move to next stage over time?**
A: No. You must drag them manually.

**Q: Does status change when interview date passes?**
A: No. Status only changes on manual action.

**Q: Can I schedule automatic status changes?**
A: Not currently, but can be implemented.

**Q: Do all users see the same pipeline?**
A: Yes. Pipeline auto-refreshes every 30 seconds to sync.

**Q: What if another user changes status while I'm viewing?**
A: Auto-refresh (30 sec) will show the change.

**Q: Can I revert a status change?**
A: Yes. Drag the card back to previous stage.

---

## Actions Per Status

| Current Status | Can Do | Cannot Do |
|---|---|---|
| Submitted | Drag anywhere, reject | - |
| Under Review | Drag forward/reject | - |
| Shortlisted | Drag forward/reject | - |
| Interview Scheduled | Send offer or reject | - |
| Offer Made | Hire or reject | - |
| Hired | View details | Drag, update status, reject, delete |
| Rejected | View details | Drag, update status, hire, delete |

---

## Error Messages & What They Mean

| Error | Reason | How to Fix |
|---|---|---|
| "Cannot send offer to rejected applicant" | Already rejected | Drag back to earlier stage first |
| "Cannot hire rejected applicant" | Already rejected | Drag back first |
| "Cannot reject hired applicant" | Already hired | Cannot reverse (final) |
| "This applicant has already applied" | Duplicate application | Use different applicant |

---

## Real-World Example

```
Timeline of applicant progression:

Day 1
  [Add Applicant: John Doe] → Status: Submitted

Day 3
  [Drag from Submitted] → Under Review → Status: under_review

Day 5
  [Drag from Under Review] → Shortlisted → Status: interviewed

Day 7
  [Click Schedule Interview] → Date: Jan 25 → Status: interview_scheduled

Day 20 (after interview)
  [Drag from Interview Scheduled] → Offer Made → Status: offered

Day 25 (offer accepted)
  [Click Hire] → Status: hired ✅ FINAL

OR at any point:
  [Click Reject] → Status: rejected ❌ FINAL
```

---

## Your Next Steps

1. **Open modal** - "View Applications" button
2. **See John Doe** in Submitted column
3. **Drag John** to "Under Review"
4. **Watch status change**
5. **See success toast**
6. **Card moves** to new column

That's it! The status only changes when you take action.

---

## Troubleshooting

### Pipeline shows 0 everywhere
- ✅ Normal if no applicants added
- ✓ Click "Add Applicant" to test

### Card doesn't move when dragged
- ❌ Check browser console for errors
- ✓ Ensure you're clicking on the card itself
- ✓ Drag to the empty space in target column

### Status doesn't update
- ❌ Check network tab in DevTools
- ✓ Verify request shows correct status
- ✓ Check API response is 200 OK

### Changes aren't visible after refresh
- ❌ Data may not have persisted
- ✓ Wait 30 seconds for auto-refresh
- ✓ Close and reopen modal

---

## Summary

```
┌─────────────────────────────────────────┐
│ Status Change Mechanism                 │
├─────────────────────────────────────────┤
│                                         │
│ NOT Automatic  ← Statuses DO NOT       │
│ NOT Time-Based   change automatically  │
│ NOT Scheduled    or over time          │
│                                         │
│ MANUAL ONLY    ← Only change when:      │
│ - Drag card                             │
│ - Click button                          │
│ - API update                            │
│                                         │
└─────────────────────────────────────────┘
```

**Remember:** This is a *manual workflow tool*. You control when applicants advance through the pipeline. ✅
