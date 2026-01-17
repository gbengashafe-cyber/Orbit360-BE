# Drag & Drop Troubleshooting Guide

## Issue: Cannot Drag Applicant Cards

### Symptoms
- Cards appear in pipeline but won't drag
- No visual feedback when hovering
- Cards don't move to other columns
- Drag feels "stuck" or unresponsive

---

## Root Cause Found & Fixed ✅

**Problem:** `draggableId` must be a **string**, but application ID was passed as a **number**.

**Solution Applied:**
```javascript
// BEFORE (Broken)
<Draggable draggableId={application.id} ... />  // ← Number

// AFTER (Fixed)
<Draggable draggableId={String(application.id)} ... />  // ← String
```

---

## Quick Fix Steps

### Step 1: Update ApplicationPipeline.jsx
```javascript
// Line 137: Change draggableId to string
<Draggable 
  key={application.id} 
  draggableId={String(application.id)}  // ← Add String()
  index={index}
>
```

### Step 2: Update onDragEnd Handler
```javascript
// Line 64-65: Parse draggableId back to number
const onDragEnd = async (result) => {
  const { source, destination, draggableId } = result;
  
  // Convert back to number
  const applicationId = parseInt(draggableId);  // ← Parse string to number
  const applicant = localApplications.find(app => app.id === applicationId);
  
  // Use applicationId instead of draggableId in rest of function
```

### Step 3: Refresh Frontend
```bash
# If using hot reload, it should update automatically
# Otherwise, restart frontend dev server
npm run dev
```

---

## How to Test Drag & Drop

### Test Case: Basic Drag

```
1. Open Application Pipeline modal
2. Find applicant card in "Submitted" column
3. Place cursor on the card
4. Click and hold (don't release)
5. Move mouse to "Under Review" column
6. Release to drop
7. Card should move to new column
8. See success toast
```

**Expected behavior:**
- ✅ Card highlights when hovering
- ✅ Cursor changes to grab cursor
- ✅ Card moves smoothly
- ✅ New column highlights when dragging over
- ✅ Status updates in backend
- ✅ Toast shows success

### Test Case: Drag to Multiple Stages

```
1. Drag from Submitted → Under Review
2. Verify card moved
3. Drag from Under Review → Shortlisted
4. Verify card moved
5. Continue through all stages
```

**Expected progression:**
```
Submitted → Under Review → Shortlisted → Interview Scheduled → Offer Made → Hired
```

---

## Drag & Drop Requirements

### What Must Be True

✅ **draggableId must be:**
- A string (not number)
- Unique per item
- Match the format Draggable library expects

✅ **Droppable must have:**
- Proper ref={provided.innerRef}
- All provided.droppableProps spread
- Unique droppableId per column

✅ **Draggable must have:**
- Unique draggableId as string
- Proper index
- All provided.draggableProps spread
- All provided.dragHandleProps spread

✅ **onDragEnd must handle:**
- source.droppableId (original column)
- destination.droppableId (target column)
- draggableId (which item was dragged)

---

## Code Checklist

After fix, verify these in ApplicationPipeline.jsx:

```javascript
// ✓ Draggable component (Line 137)
<Draggable 
  key={application.id}
  draggableId={String(application.id)}     // ← STRING
  index={index}
>

// ✓ onDragEnd handler (Line 55-75)
const onDragEnd = async (result) => {
  const { source, destination, draggableId } = result;
  
  if (!destination) return;
  
  if (source.droppableId === destination.droppableId && 
      source.index === destination.index) {
    return;
  }
  
  const applicationId = parseInt(draggableId);  // ← PARSE TO NUMBER
  const applicant = localApplications.find(app => app.id === applicationId);
  
  // ... rest of handler
}
```

---

## Common Drag & Drop Issues

### Issue 1: "Cannot read property 'id' of undefined"

**Cause:** Draggable ID mismatch  
**Fix:** Ensure draggableId is String(application.id)

### Issue 2: Card Doesn't Move

**Cause:** 
- draggableId not string
- Missing provided.draggableProps
- Styles preventing interaction

**Fix:**
```javascript
// Verify all props are spread
<Draggable draggableId={String(id)} index={i}>
  {(provided) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}     // ← Required
      {...provided.dragHandleProps}    // ← Required
    >
      Content
    </div>
  )}
</Draggable>
```

### Issue 3: Drag Starts But Doesn't Drop

**Cause:** Destination column not properly configured  
**Fix:**
```javascript
// Verify Droppable has proper props
<Droppable droppableId={stage.key}>
  {(provided) => (
    <div
      ref={provided.innerRef}          // ← Required
      {...provided.droppableProps}     // ← Required
    >
      {/* Items here */}
      {provided.placeholder}           // ← May be needed
    </div>
  )}
</Droppable>
```

### Issue 4: Multiple Drags Cause Errors

**Cause:** Race condition or state not syncing  
**Fix:**
- Ensure onRefreshApplications is called after drag
- Check that status update completes before next drag
- Add error handling in onDragEnd

---

## Browser Console Debugging

Open DevTools (F12) and check for errors:

```javascript
// Check if applications are loading
console.log(localApplications)
// Should show: Array of applications with status field

// Check if dragging triggers handler
// Add this to onDragEnd:
console.log('Drag detected:', { source, destination, draggableId })

// Check API call
// Look in Network tab for PUT /applications/:id/status
// Should show 200 OK response
```

---

## Network Tab Verification

When drag and drop is working:

1. **Initiate Drag**
2. **Open DevTools** → Network tab
3. **Drag card to new column**
4. **Should see:**
   - PUT /api/v1/recruitments/applications/:id/status
   - Request body: `{ "status": "new_status" }`
   - Response: 200 OK

**If no request appears:**
- Check that onDragEnd is being called
- Verify no JavaScript errors in console
- Check that destination.droppableId is valid

---

## Complete Working Example

```javascript
// ApplicationPipeline.jsx - Drag & Drop Implementation

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ApplicationPipeline({ job, applications, ... }) {
  const [localApplications, setLocalApplications] = useState(applications);

  // Handle drag end
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) {
      return;
    }

    // Convert to number (draggableId is string)
    const applicationId = parseInt(draggableId);
    const applicant = localApplications.find(app => app.id === applicationId);
    if (!applicant) return;

    const originalStatus = applicant.status;
    const newStatus = destination.droppableId;
    
    if (originalStatus === newStatus) return;

    // Optimistic update
    const updated = localApplications.map(app =>
      app.id === applicationId ? { ...app, status: newStatus } : app
    );
    setLocalApplications(updated);

    try {
      // Update status
      await recruitmentService.updateApplicationStatus(applicationId, newStatus);
      
      // Refresh to sync
      onRefreshApplications();
    } catch (error) {
      // Revert on error
      setLocalApplications(applications);
      alert("Failed to update status");
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <ScrollArea>
        <div className="flex space-x-4 p-4">
          {APPLICATION_STAGES.map((stage) => (
            <Droppable key={stage.key} droppableId={stage.key}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-72"
                >
                  <h3>{stage.label}</h3>
                  
                  {getStageApplications(stage.key).map((app, idx) => (
                    <Draggable 
                      key={app.id} 
                      draggableId={String(app.id)}  // ← String!
                      index={idx}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-3 bg-white rounded-lg"
                        >
                          <h4>{app.applicant_name}</h4>
                          <p>{app.applicant_email}</p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </ScrollArea>
    </DragDropContext>
  );
}
```

---

## After Fix: Test These

- [ ] Cards appear in pipeline
- [ ] Can hover over card (cursor changes)
- [ ] Can click and hold card
- [ ] Card moves as you drag mouse
- [ ] Destination column highlights
- [ ] Drop in new column
- [ ] Card moves to new column
- [ ] Success toast appears
- [ ] Network request shows 200 OK
- [ ] Counts update correctly
- [ ] Auto-refresh syncs data

---

## Success Indicators ✅

You'll know drag & drop is working when:

1. **Visual Feedback**
   - Cards respond to hover
   - Cursor becomes "grab" on hover
   - Card scales up when dragging

2. **Functional**
   - Can drag from any column to any other
   - Card moves when dropped
   - Counts update

3. **Backend Sync**
   - Network shows PUT request
   - Status updates in database
   - Toast confirms success
   - Other users see the change (after refresh)

---

## Still Not Working?

1. **Clear browser cache** - Ctrl+Shift+Delete
2. **Restart dev server** - Kill and restart `npm run dev`
3. **Check console** - Look for JavaScript errors
4. **Verify draggableId** - Should be `String(application.id)`
5. **Check network** - See if PUT request is sent
6. **Check response** - Should be 200 OK with updated status

If still stuck, check:
- Is hello-pangea/dnd installed? `npm list @hello-pangea/dnd`
- Are imports correct? `import { DragDropContext, Droppable, Draggable }`
- Is Draggable ID really a string? Add `console.log(draggableId, typeof draggableId)`

---

**The fix has been applied. Now test drag & drop with your applicants!** 🎉
