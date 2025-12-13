// React Query hooks for Loan operations
// These hooks wrap the mock API and provide React Query benefits:
// - Automatic caching
// - Loading/error states
// - Optimistic updates
// - Automatic refetching

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loanApi } from '../api';
import type { Loan } from '../types';

// Query keys for cache management
export const loanKeys = {
  all: ['loans'] as const,
  detail: (mwLoanNo: string) => ['loans', mwLoanNo] as const
};

// Context types for mutations
interface AddLoanContext {
  previousLoans: Loan[] | undefined;
}

interface UpdateLoanContext {
  previousLoans: Loan[] | undefined;
  previousLoan: Loan | undefined;
}

interface DeleteLoanContext {
  previousLoans: Loan[] | undefined;
}

// ==================== QUERIES ====================

/**
 * Get all loans
 *
 * Usage:
 * const { data: loans, isLoading, error } = useLoans();
 *
 * Returns: Loan[] with loading/error states
 */
export function useLoans() {
  return useQuery({
    queryKey: loanKeys.all,
    queryFn: () => loanApi.getAll()
  });
}

/**
 * Get single loan by MW Loan Number
 *
 * Usage:
 * const { data: loan, isLoading } = useLoan('7758');
 *
 * Returns: Loan | undefined with loading/error states
 */
export function useLoan(mwLoanNo: string) {
  return useQuery({
    queryKey: loanKeys.detail(mwLoanNo),
    queryFn: () => loanApi.getById(mwLoanNo),
    enabled: !!mwLoanNo // Only fetch if mwLoanNo is provided
  });
}

// ==================== MUTATIONS ====================

/**
 * Add a new loan
 *
 * Usage:
 * const { mutate: addLoan, isPending } = useAddLoan();
 * addLoan(newLoan);
 *
 * Features:
 * - Optimistic update (UI updates immediately)
 * - Automatic rollback on error
 * - Refetches loan list on success
 */
export function useAddLoan() {
  const queryClient = useQueryClient();

  return useMutation<Loan, Error, Loan, AddLoanContext>({
    mutationFn: (loan: Loan) => loanApi.create(loan),

    // Optimistic update - update UI immediately
    onMutate: async (newLoan: Loan): Promise<AddLoanContext> => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: loanKeys.all });

      // Snapshot previous value for rollback
      const previousLoans = queryClient.getQueryData<Loan[]>(loanKeys.all);

      // Optimistically update the cache
      if (previousLoans) {
        queryClient.setQueryData<Loan[]>(loanKeys.all, [...previousLoans, newLoan]);
      }

      return { previousLoans };
    },

    // Rollback on error
    onError: (_err: Error, _newLoan: Loan, context: AddLoanContext | undefined) => {
      if (context?.previousLoans) {
        queryClient.setQueryData(loanKeys.all, context.previousLoans);
      }
    },

    // Refetch to ensure sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
    }
  });
}

/**
 * Update an existing loan
 *
 * Usage:
 * const { mutate: updateLoan } = useUpdateLoan();
 * updateLoan({ mwLoanNo: '7758', updates: { principal: 500000 } });
 *
 * Features:
 * - Optimistic update
 * - Automatic rollback on error
 * - Updates both list and detail views
 */
interface UpdateLoanVariables {
  mwLoanNo: string;
  updates: Partial<Loan>;
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();

  return useMutation<Loan, Error, UpdateLoanVariables, UpdateLoanContext>({
    mutationFn: ({ mwLoanNo, updates }: UpdateLoanVariables) =>
      loanApi.update(mwLoanNo, updates),

    // Optimistic update
    onMutate: async ({ mwLoanNo, updates }: UpdateLoanVariables): Promise<UpdateLoanContext> => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: loanKeys.all });
      await queryClient.cancelQueries({ queryKey: loanKeys.detail(mwLoanNo) });

      // Snapshot previous values
      const previousLoans = queryClient.getQueryData<Loan[]>(loanKeys.all);
      const previousLoan = queryClient.getQueryData<Loan>(loanKeys.detail(mwLoanNo));

      // Optimistically update list
      if (previousLoans) {
        queryClient.setQueryData<Loan[]>(
          loanKeys.all,
          previousLoans.map(loan =>
            loan.mwLoanNo === mwLoanNo ? { ...loan, ...updates } : loan
          )
        );
      }

      // Optimistically update detail
      if (previousLoan) {
        queryClient.setQueryData(
          loanKeys.detail(mwLoanNo),
          { ...previousLoan, ...updates }
        );
      }

      return { previousLoans, previousLoan };
    },

    // Rollback on error
    onError: (_err: Error, { mwLoanNo }: UpdateLoanVariables, context: UpdateLoanContext | undefined) => {
      if (context?.previousLoans) {
        queryClient.setQueryData(loanKeys.all, context.previousLoans);
      }
      if (context?.previousLoan) {
        queryClient.setQueryData(loanKeys.detail(mwLoanNo), context.previousLoan);
      }
    },

    // Refetch to ensure sync
    onSettled: (_data: Loan | undefined, _error: Error | null, variables: UpdateLoanVariables) => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
      queryClient.invalidateQueries({ queryKey: loanKeys.detail(variables.mwLoanNo) });
    }
  });
}

/**
 * Delete a loan
 *
 * Usage:
 * const { mutate: deleteLoan } = useDeleteLoan();
 * deleteLoan('7758');
 *
 * Features:
 * - Optimistic update
 * - Automatic rollback on error
 * - Removes from cache immediately
 */
export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, DeleteLoanContext>({
    mutationFn: (mwLoanNo: string) => loanApi.delete(mwLoanNo),

    // Optimistic update
    onMutate: async (mwLoanNo: string): Promise<DeleteLoanContext> => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: loanKeys.all });

      // Snapshot previous value
      const previousLoans = queryClient.getQueryData<Loan[]>(loanKeys.all);

      // Optimistically remove from cache
      if (previousLoans) {
        queryClient.setQueryData<Loan[]>(
          loanKeys.all,
          previousLoans.filter(loan => loan.mwLoanNo !== mwLoanNo)
        );
      }

      return { previousLoans };
    },

    // Rollback on error
    onError: (_err: Error, _mwLoanNo: string, context: DeleteLoanContext | undefined) => {
      if (context?.previousLoans) {
        queryClient.setQueryData(loanKeys.all, context.previousLoans);
      }
    },

    // Refetch to ensure sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all });
    }
  });
}
