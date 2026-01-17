# Drag & Drop Loading Indicator

## Feature Overview

When a user drags an applicant card to a new status column, a **loading indicator overlay** appears showing:
- Spinning loader icon
- "Moving [Applicant Name]..." message
- "Please wait" status text

## What Was Added

### 1. Loading State Variables
```javascript
const [isDragging, setIsDragging] = useState(false);
const [draggedItemName, setDraggedItemName] = useState('');
```

### 2. Loader Icon Import
```javascript
import { Loader2 } from "lucide-react";
```

### 3. Loading State Management
```javascript
const onDragEnd = async (result) => {
  // ... validation code ...
  
  // Set loading state
  setIsDragging(true);
  setDraggedItemName(applicant.applicant_name);
  
  try {
    // ... update application status ...
  } finally {
    // Clear loading state
    setIsDragging(false);
    setDraggedItemName('');
  }
};
```

### 4. Loading Overlay UI
```javascript
{isDragging && (
  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-sm font-medium text-gray-900">
        Moving <span className="font-semibold text-blue-600">{draggedItemName}</span>...
      </p>
      <p className="text-xs text-gray-500">Please wait</p>
    </div>
  </div>
)}
```

---

## How It Works

### Timeline of Drag Operation

```
User drags card
    ↓
onDragEnd() triggered
    ↓
setIsDragging(true)         ← Loading overlay appears
setDraggedItemName(name)
    ↓
Optimistic UI update        ← Card moves immediately
    ↓
API call sent               ← Backend processes
    ↓
Response received (200 OK)  ← Confirmed
    ↓
finally block executes      ← Loading overlay disappears
setIsDragging(false)
    ↓
Complete
```

### Visual Sequence

```
BEFORE DRAG:
┌─────────────────────────────────────────┐
│ Application Pipeline                    │
│                                         │
│ Submitted (2)    Under Review (0)       │
│ ┌──────────────┐  No applications       │
│ │ Zoe Zebedee  │                        │
│ │ ...          │                        │
│ └──────────────┘                        │
└─────────────────────────────────────────┘

DURING DRAG (After dropping):
┌─────────────────────────────────────────┐
│ Application Pipeline                    │
│  ╔═════════════════════════════════╗   │
│  ║  [Spinner]                      ║   │
│  ║  Moving Zoe Zebedee...          ║   │
│  ║  Please wait                    ║   │
│  ╚═════════════════════════════════╝   │
│                                         │
│ Submitted (1)    Under Review (1)       │
│ ┌──────────────┐  ┌──────────────┐     │
│ │ [2nd person] │  │ Zoe Zebedee  │     │
│ └──────────────┘  │ (optimistic)  │    │
└─────────────────────────────────────────┘

AFTER DRAG (API confirms):
┌─────────────────────────────────────────┐
│ Application Pipeline                    │
│                                         │
│ Submitted (1)    Under Review (1)       │
│ ┌──────────────┐  ┌──────────────┐     │
│ │ [2nd person] │  │ Zoe Zebedee  │     │
│ │              │  │              │     │
│ └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
```

---

## Styling Details

### Loading Overlay
- **Background**: Semi-transparent black (30% opacity) with blur effect
- **Position**: Absolute, covers entire pipeline
- **Z-index**: 50 (appears above all content)
- **Border-radius**: Matches pipeline rounded corners

### Loading Dialog
- **Background**: White with shadow
- **Padding**: 24px (6 units)
- **Gap**: 12px between elements
- **Positioning**: Centered both horizontally and vertically

### Loader Icon
- **Size**: 32px (w-8 h-8)
- **Color**: Blue (#2563eb)
- **Animation**: Spinning (animate-spin)

### Text
- **Title**: Medium weight, gray-900
- **Applicant Name**: Bold, blue-600
- **Subtitle**: Small, gray-500

---

## User Experience

### What Users See

1. **Before Drag**
   - Normal pipeline view
   - Cards are interactive
   - No loading state

2. **During Drag (Immediate)**
   - Card moves to new column (optimistic)
   - Overlay appears over entire pipeline
   - Shows applicant name being moved
   - Pipeline content becomes slightly blurred/darkened

3. **During API Request**
   - Overlay stays visible
   - Spinner continues spinning
   - User cannot interact with pipeline
   - Prevents accidental clicks/drags while processing

4. **After API Response**
   - Overlay disappears (finally block clears state)
   - Pipeline fully interactive again
   - Data synced with backend
   - Card remains in new column

### Error Handling

If API call fails:
- Overlay disappears anyway (finally block)
- Alert message shows error
- Card reverts to previous column (in catch block)
- User can retry

---

## Configuration Options

You can customize the loader appearance by modifying:

### Overlay Color
```javascript
// bg-black/30 ← change opacity
// Current: 30% opacity black
// Options: /10, /20, /30, /40, /50
```

### Loader Icon Size
```javascript
// w-8 h-8 ← change size (32px)
// Options: w-6 h-6 (24px), w-10 h-10 (40px)
```

### Loader Color
```javascript
// text-blue-600 ← change color
// Options: text-green-600, text-purple-600, etc.
```

### Text Messages
```javascript
// "Moving {name}..." ← customize message
// "Please wait" ← customize subtitle
```

### Animation Speed
```javascript
// animate-spin ← built-in Tailwind
// For custom speed, modify tailwind.config.js
```

---

## Edge Cases

### Case 1: Fast Network
- Loader appears and disappears quickly
- Shows user that request was processed
- Prevents double-clicks

### Case 2: Slow Network
- Loader stays visible longer
- User knows something is happening
- Cannot interact (prevents errors)

### Case 3: Network Error
- Loader disappears (finally block)
- Card reverts (catch block)
- Alert shows error message
- Applicant stays in original column

### Case 4: User Closes Modal During Drag
- Overlay clears via finally block
- Modal closes normally
- Data state cleaned up

---

## Testing the Loader

### Test Case 1: Verify Loader Appears
```
1. Open Application Pipeline
2. Drag applicant card to new column
3. VERIFY: Overlay appears immediately
4. VERIFY: Shows "Moving [Name]..."
5. VERIFY: Spinner is animated
```

### Test Case 2: Verify Loader Disappears
```
1. Keep dragging (as above)
2. Wait for API response
3. VERIFY: Overlay disappears
4. VERIFY: Card is in new column
5. VERIFY: Pipeline is interactive again
```

### Test Case 3: Verify Applicant Name Shows Correctly
```
1. Drag "Zoe Zebedee" card
2. VERIFY: Loader shows "Moving Zoe Zebedee..."
3. Drag different applicant
4. VERIFY: Loader shows correct name
```

### Test Case 4: Test with Slow Network
```
1. Open DevTools → Network tab
2. Set network to "Slow 3G"
3. Drag applicant
4. VERIFY: Loader stays visible longer
5. VERIFY: Card moves (optimistic)
6. VERIFY: Loader disappears when request completes
```

### Test Case 5: Test Error Handling
```
1. Drag applicant to "Hired" status
2. Drag same applicant to "Rejected"
3. VERIFY: Error alert appears
4. VERIFY: Loader disappears
5. VERIFY: Card reverts to "Hired"
```

---

## Implementation Details

### State Variables
```javascript
const [isDragging, setIsDragging] = useState(false);     // Controls overlay visibility
const [draggedItemName, setDraggedItemName] = useState(''); // Shows in loader message
```

### Setting State
```javascript
// When drag starts
setIsDragging(true);
setDraggedItemName(applicant.applicant_name);

// When drag completes (always runs)
setIsDragging(false);
setDraggedItemName('');
```

### Conditional Rendering
```javascript
{isDragging && (
  // Render overlay only when isDragging is true
)}
```

---

## Browser Support

The loader uses standard Tailwind CSS classes that work on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

### CSS Features Used
- `absolute` positioning
- `backdrop-filter: blur()` - supported on modern browsers
- `animate-spin` - standard CSS animation
- Flexbox for centering

---

## Performance Impact

### Minimal
- Loading state is just boolean flags
- Overlay renders only when isDragging is true
- No extra API calls
- No complex computations

### Optimization Tips
1. Loader appears immediately (no delay)
2. Finally block ensures cleanup
3. No memory leaks (state cleared)
4. Can handle rapid drags

---

## Future Enhancements

Possible improvements:
1. **Progress indication** - Show percentage complete
2. **Cancel button** - Allow user to cancel operation
3. **Retry logic** - Auto-retry failed requests
4. **Toast instead of modal** - Less intrusive feedback
5. **Animations** - Fade in/out overlay smoothly
6. **Sound feedback** - Auditory confirmation

---

## Summary

The loading indicator:
✅ Appears when drag starts
✅ Shows applicant name
✅ Displays spinning loader
✅ Covers entire pipeline (prevents interaction)
✅ Disappears when complete
✅ Works with error handling
✅ Improves user experience
✅ Shows operation in progress

---

## Testing Checklist

- [ ] Loader appears when dragging
- [ ] Shows correct applicant name
- [ ] Spinner animates smoothly
- [ ] Loader disappears after drag
- [ ] Can still drag multiple times
- [ ] Works with slow network
- [ ] Works with fast network
- [ ] Card position correct after loader
- [ ] Error alert shows on failure
- [ ] Card reverts on error
- [ ] No console errors
