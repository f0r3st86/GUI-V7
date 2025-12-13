# Phase 5: Fix Async Test Handling

## Problem Summary

**126 tests failing** across 7 test files due to React Query async loading states.

### Root Cause
- Tests use synchronous `getBy*` queries immediately after `render()`
- Components fetch data via React Query hooks and show "Loading..." state initially
- Mock API has artificial delays (50-200ms) simulating real network latency
- Tests expect content that only appears AFTER data loads

### Error Pattern
```
Unable to find an element with the text: [expected text]
```
DOM during failure shows:
```html
<p class="text-gray-400">Loading...</p>
```

### Affected Test Files
1. `src/components/tabs/ProjectionsTab.test.tsx` - 40 tests
2. `src/components/tabs/LoanTab.test.tsx` - 28 tests
3. `src/components/tabs/BorrowerTab.test.tsx` - 29 tests
4. `src/components/tabs/CollateralTab.test.tsx` - 19 tests
5. `src/components/tabs/CommentTab.test.tsx` - 17 tests
6. `src/components/tabs/PayHistTab.test.tsx` - 25 tests
7. `src/context/LoanContext.test.tsx` - Some tests may need updates

---

## Solution Approach

**Constraint:** Keep all component logic exactly the same. Only modify test infrastructure and test files.

### Strategy: Convert to Async Test Patterns

Use @testing-library's async utilities:
- `findBy*` queries - automatically wait up to 1000ms for element
- `waitFor()` - wait for assertion to pass
- `waitForElementToBeRemoved()` - wait for loading state to disappear

---

## Implementation Steps

### Step 1: Enhance Test Utilities

Update `src/test/test-utils.tsx` to add:

1. **`renderAndWaitForLoad()`** - Async render helper that waits for loading to complete
2. **`waitForLoadingComplete()`** - Helper to wait for "Loading..." to disappear

```typescript
// New helper: Render and wait for data to load
export const renderAndWaitForLoad = async (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const result = customRender(ui, options);

  // Wait for loading state to disappear
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  return result;
};

// New helper: Wait for loading to complete after render
export const waitForLoadingComplete = async () => {
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
};
```

### Step 2: Update ProjectionsTab.test.tsx

Convert all tests from:
```typescript
it('should display loan number', () => {
  render(<ProjectionsTab />);
  expect(screen.getByText('Loan #:')).toBeInTheDocument();
});
```

To async pattern:
```typescript
it('should display loan number', async () => {
  render(<ProjectionsTab />);
  expect(await screen.findByText('Loan #:')).toBeInTheDocument();
});
```

Or using the new helper:
```typescript
it('should display loan number', async () => {
  await renderAndWaitForLoad(<ProjectionsTab />);
  expect(screen.getByText('Loan #:')).toBeInTheDocument();
});
```

**Pattern for getAllByText:**
```typescript
// Before
expect(screen.getAllByText('Contractual').length).toBeGreaterThanOrEqual(1);

// After - wait first, then use getAll
await screen.findByText('Contractual'); // Wait for first match
expect(screen.getAllByText('Contractual').length).toBeGreaterThanOrEqual(1);
```

### Step 3: Update LoanTab.test.tsx

Same conversion pattern as Step 2:
- Add `async` to all test functions
- Use `findBy*` instead of `getBy*` for first assertion
- For multiple element checks, wait first then use `getAll*`

### Step 4: Update BorrowerTab.test.tsx

Same conversion pattern:
- Make tests async
- Wait for loading with `findBy*` or `renderAndWaitForLoad`

### Step 5: Update CollateralTab.test.tsx

Same conversion pattern.

### Step 6: Update CommentTab.test.tsx

Same conversion pattern.

### Step 7: Update PayHistTab.test.tsx

Same conversion pattern.

### Step 8: Update LoanContext.test.tsx (if needed)

The context tests use `renderHook` which may also need async handling:
```typescript
const { result } = renderHook(() => useLoan(), { wrapper });

// May need to wait for async initialization
await waitFor(() => {
  expect(result.current.loans.length).toBeGreaterThan(0);
});
```

### Step 9: Verify All Tests Pass

Run full test suite:
```bash
npm test
```

Expected result: 628 tests passing (0 failures)

---

## Detailed Conversion Examples

### Example 1: Simple getByText
```typescript
// BEFORE
it('should render header', () => {
  render(<Component />);
  expect(screen.getByText('Header')).toBeInTheDocument();
});

// AFTER
it('should render header', async () => {
  render(<Component />);
  expect(await screen.findByText('Header')).toBeInTheDocument();
});
```

### Example 2: Multiple getByText in one test
```typescript
// BEFORE
it('should render fields', () => {
  render(<Component />);
  expect(screen.getByText('Field 1:')).toBeInTheDocument();
  expect(screen.getByText('Field 2:')).toBeInTheDocument();
  expect(screen.getByText('Field 3:')).toBeInTheDocument();
});

// AFTER - Wait once, then sync is fine
it('should render fields', async () => {
  await renderAndWaitForLoad(<Component />);
  expect(screen.getByText('Field 1:')).toBeInTheDocument();
  expect(screen.getByText('Field 2:')).toBeInTheDocument();
  expect(screen.getByText('Field 3:')).toBeInTheDocument();
});
```

### Example 3: getAllByText
```typescript
// BEFORE
it('should have multiple items', () => {
  render(<Component />);
  expect(screen.getAllByText('Item').length).toBeGreaterThan(2);
});

// AFTER
it('should have multiple items', async () => {
  render(<Component />);
  await screen.findByText('Item'); // Wait for at least one
  expect(screen.getAllByText('Item').length).toBeGreaterThan(2);
});
```

### Example 4: getAllByRole
```typescript
// BEFORE
it('should have options', () => {
  render(<Component />);
  const options = screen.getAllByRole('option');
  expect(options.length).toBeGreaterThan(0);
});

// AFTER
it('should have options', async () => {
  await renderAndWaitForLoad(<Component />);
  const options = screen.getAllByRole('option');
  expect(options.length).toBeGreaterThan(0);
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/test/test-utils.tsx` | Add `renderAndWaitForLoad`, `waitForLoadingComplete` helpers |
| `src/components/tabs/ProjectionsTab.test.tsx` | Convert ~40 tests to async |
| `src/components/tabs/LoanTab.test.tsx` | Convert ~28 tests to async |
| `src/components/tabs/BorrowerTab.test.tsx` | Convert ~29 tests to async |
| `src/components/tabs/CollateralTab.test.tsx` | Convert ~19 tests to async |
| `src/components/tabs/CommentTab.test.tsx` | Convert ~17 tests to async |
| `src/components/tabs/PayHistTab.test.tsx` | Convert ~25 tests to async |
| `src/context/LoanContext.test.tsx` | Review and update if needed |

---

## What Stays the Same

- All component source code (no changes to any `.tsx` component files)
- React Query hooks implementation
- Mock API implementation and delays
- Context providers
- Test assertions (just making them async)
- Test coverage scope

---

## Success Criteria

1. All 628 tests pass
2. No component logic changes
3. Tests properly wait for async data loading
4. Test execution time reasonable (< 60 seconds total)
