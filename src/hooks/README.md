# React Query Hooks

This directory contains React Query hooks that wrap the mock API for type-safe, cached data operations.

## Benefits

- ✅ **Automatic caching** - Data fetched once, reused everywhere
- ✅ **Loading states** - Built-in `isLoading`, `isPending` states
- ✅ **Error handling** - Automatic error capture and retry
- ✅ **Optimistic updates** - UI updates immediately, rolls back on error
- ✅ **Auto-refetch** - Keeps data fresh across tabs/windows

## Available Hooks

### Loans (`useLoans.ts`)

```typescript
import { useLoans, useAddLoan, useUpdateLoan, useDeleteLoan } from '@/hooks';

// Get all loans
const { data: loans, isLoading, error } = useLoans();

// Get single loan
const { data: loan } = useLoan('7758');

// Add loan
const { mutate: addLoan } = useAddLoan();
addLoan(newLoan);

// Update loan
const { mutate: updateLoan } = useUpdateLoan();
updateLoan({ mwLoanNo: '7758', updates: { principal: 500000 } });

// Delete loan
const { mutate: deleteLoan } = useDeleteLoan();
deleteLoan('7758');
```

### Borrowers (`useBorrowers.ts`)

```typescript
import {
  useBorrowers,
  useAddBorrower,
  useUpdateBorrower,
  useDeleteBorrower,
  useUpdateBorrowerRelationships
} from '@/hooks';

// Get all borrowers
const { data: borrowers } = useBorrowers();

// Add borrower
const { mutate: addBorrower } = useAddBorrower();
addBorrower(newBorrower);

// Update borrower-loan relationships
const { mutate: updateRelationships } = useUpdateBorrowerRelationships();
updateRelationships({ id: 1, relationships: { '7758': { selected: true, role: 'primary' } } });
```

### Collateral (`useCollateral.ts`)

```typescript
import {
  useCollateral,
  useCollateralRelationships,
  useAddCollateral,
  useUpdateCollateralRelationships
} from '@/hooks';

// Get all collateral
const { data: collateral } = useCollateral();

// Get collateral-loan relationships
const { data: relationships } = useCollateralRelationships();

// Update relationships
const { mutate: updateRelationships } = useUpdateCollateralRelationships();
```

### Comments (`useComments.ts`)

```typescript
import { useComments, useCommentsByLoan, useAddComment } from '@/hooks';

// Get all comments
const { data: comments } = useComments();

// Get comments for specific loan
const { data: loanComments } = useCommentsByLoan('7758');

// Add comment
const { mutate: addComment } = useAddComment();
addComment(newComment);
```

### Payments (`usePayments.ts`)

```typescript
import { usePayments, usePaymentsByLoan, useAddPayment } from '@/hooks';

// Get all payments
const { data: payments } = usePayments();

// Get payments for specific loan
const { data: loanPayments } = usePaymentsByLoan('7758');

// Add payment
const { mutate: addPayment } = useAddPayment();
addPayment(newPayment);
```

## Usage Patterns

### Loading States

```typescript
const { data: loans, isLoading, error } = useLoans();

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return <div>{loans.map(...)}</div>;
```

### Mutations with Callbacks

```typescript
const { mutate: addLoan, isPending } = useAddLoan();

const handleSubmit = () => {
  addLoan(newLoan, {
    onSuccess: () => {
      console.log('Loan added successfully!');
      // UI already updated via optimistic update
    },
    onError: (error) => {
      console.error('Failed to add loan:', error);
      // UI already rolled back
    }
  });
};
```

### Optimistic Updates

All mutation hooks include automatic optimistic updates:

1. **Mutation called** → UI updates immediately
2. **API call in progress** → User sees instant feedback
3. **Success** → Data refetched to ensure sync
4. **Error** → UI automatically rolls back to previous state

## Migration from Context

### Before (Context):
```typescript
const { loans, addLoan, updateLoan } = useLoan();

// No loading state
// No error handling
// No caching
// Manual state management
```

### After (React Query):
```typescript
const { data: loans, isLoading, error } = useLoans();
const { mutate: addLoan } = useAddLoan();
const { mutate: updateLoan } = useUpdateLoan();

// ✅ Automatic loading states
// ✅ Built-in error handling
// ✅ Automatic caching
// ✅ Optimistic updates
```

## When Backend is Ready

These hooks use the **mock API** (returns same data as Context). When you have a real backend:

1. Update `src/api/client.ts` to use `axios` instead of mock
2. **Zero changes needed in components** - same hook API!
3. Just change `.env` file: `VITE_API_URL=https://your-api.com`

That's it! The hooks work identically with mock or real API.
