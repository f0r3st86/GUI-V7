# Projections Tab Debugging Guide

## How to Identify Issues

When you report "the projections tab is not working", please provide the following information:

### 1. Open Browser Developer Tools
- Press `F12` or right-click and select "Inspect"
- Go to the "Console" tab

### 2. Navigate to Projections Tab
- Click on the "Projections" tab in the application
- Watch the console for messages

### 3. Check for Errors
Look for messages that start with:
- `[ProjectionsTab]` - These are debug messages showing what's happening
- `❌ Error:` - These indicate actual errors
- `⚠️ Warning:` - These indicate potential issues

### 4. Identify the Specific Issue

#### Issue A: Tab Doesn't Render At All
**Symptoms:**
- Clicking Projections tab shows nothing
- No content appears

**Console messages to look for:**
- `[ProjectionsTab] Component rendering` - Should appear when tab loads
- `[ProjectionsTab] No loan data selected` - Means no loan is selected

**Solution:**
- Make sure a loan is selected in the loan table above

#### Issue B: White Screen / Crash
**Symptoms:**
- Screen goes completely white
- Application becomes unresponsive

**Console messages to look for:**
- `ErrorBoundary caught an error:` - Shows the exact error
- Red error messages in console

**What to do:**
- Click the error details in the red error box that appears
- Copy the error message and stack trace
- Report the exact error message

#### Issue C: Calculations Are Wrong
**Symptoms:**
- Tab loads fine
- Numbers don't look correct

**What to check:**
- What specific calculation is wrong?
- What value did you expect?
- What value are you seeing?

#### Issue D: Input Fields Don't Work
**Symptoms:**
- Can't type in input fields
- Backspace causes crash
- Fields don't update

**Console messages to look for:**
- Watch for errors when you click into a field
- Watch for errors when you type or backspace

**What to do:**
- Note which specific field has the problem
- Note the exact action that causes the issue (click, type specific character, backspace, etc.)

### 5. Test Cases

Try these specific actions and note what happens:

1. **Load Test**
   - Navigate to Projections tab
   - Does content appear? ✓ / ✗

2. **Display Test**
   - Can you see the loan header? ✓ / ✗
   - Can you see projection settings? ✓ / ✗
   - Can you see exit scenario settings? ✓ / ✗
   - Can you see the projection tables? ✓ / ✗

3. **Input Test - Exit Month**
   - Click on "Exit Month" field
   - Type "36"
   - Does it update? ✓ / ✗
   - Press backspace twice
   - Does it crash? ✓ / ✗

4. **Input Test - Payment Method**
   - Change "Payment Method" dropdown to "User Enter"
   - Does a payment input field appear? ✓ / ✗
   - Type "1000" in the payment field
   - Does "Calculated" value update? ✓ / ✗

5. **Calculation Test**
   - Look at "Exit Value" display
   - Is it showing a number? ✓ / ✗
   - Is it showing $NaN or $Infinity? ✓ / ✗

### 6. Screenshots

If possible, provide:
- Screenshot of the entire Projections tab
- Screenshot of browser console showing any errors
- Screenshot of the error boundary if it appears

### 7. Expected Behavior

The Projections tab should:
- Load without errors
- Display loan information at the top
- Allow you to change payment methods and see updated calculations
- Allow you to change exit scenarios and see updated exit values
- Allow you to type in input fields without crashing
- Allow you to backspace in fields without crashing
- Show financial projection tables at the bottom

## Common Fixes

### If you see "No loan selected"
- Go back to the Loan tab
- Click on a loan in the relationship loans table at the top

### If you see a white screen
- Look for the red error box
- Click "Reload Page" button
- Report the error details

### If calculations look wrong
- Check what values you've entered
- Make sure exit month is greater than start month
- Make sure rate and payment values are reasonable

## Developer Console Commands

Open console (F12) and run these to check state:

```javascript
// Check if contexts are loaded
console.log('Theme:', document.querySelector('[data-theme]'));
console.log('React DevTools available:', typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined');

// Check for errors
console.log('Errors:', window.onerror);
```

## Report Format

When reporting issues, please use this format:

```
**Issue:** [Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]

**Actual:** [What actually happens]

**Console Errors:**
[Paste any error messages from console]

**Screenshots:**
[Attach screenshots if available]
```

Example:
```
**Issue:** White screen when backspacing in exit month field

**Steps to Reproduce:**
1. Navigate to Projections tab
2. Click on "Exit Month" field
3. Type "36"
4. Press backspace

**Expected:** Should delete one character, showing "3"

**Actual:** Entire screen goes white

**Console Errors:**
ErrorBoundary caught an error: Cannot read property 'toLocaleString' of NaN

**Screenshots:**
[screenshot.png]
```
