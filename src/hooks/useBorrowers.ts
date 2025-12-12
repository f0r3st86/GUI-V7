// React Query hooks for Borrower operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowerApi } from '../api';
import type { Borrower, LoanRelationship } from '../types';

// Query keys
export const borrowerKeys = {
  all: ['borrowers'] as const,
  detail: (id: number) => ['borrowers', id] as const
};

// ==================== QUERIES ====================

/**
 * Get all borrowers
 */
export function useBorrowers() {
  return useQuery({
    queryKey: borrowerKeys.all,
    queryFn: () => borrowerApi.getAll()
  });
}

/**
 * Get single borrower by ID
 */
export function useBorrower(id: number) {
  return useQuery({
    queryKey: borrowerKeys.detail(id),
    queryFn: () => borrowerApi.getById(id),
    enabled: !!id
  });
}

// ==================== MUTATIONS ====================

/**
 * Add a new borrower
 */
export function useAddBorrower() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (borrower: Borrower) => borrowerApi.create(borrower),

    onMutate: async (newBorrower) => {
      await queryClient.cancelQueries({ queryKey: borrowerKeys.all });
      const previousBorrowers = queryClient.getQueryData<Borrower[]>(borrowerKeys.all);

      if (previousBorrowers) {
        queryClient.setQueryData<Borrower[]>(borrowerKeys.all, [...previousBorrowers, newBorrower]);
      }

      return { previousBorrowers };
    },

    onError: (_err, _newBorrower, context) => {
      if (context?.previousBorrowers) {
        queryClient.setQueryData(borrowerKeys.all, context.previousBorrowers);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: borrowerKeys.all });
    }
  });
}

/**
 * Update an existing borrower
 */
export function useUpdateBorrower() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Borrower> }) =>
      borrowerApi.update(id, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: borrowerKeys.all });
      await queryClient.cancelQueries({ queryKey: borrowerKeys.detail(id) });

      const previousBorrowers = queryClient.getQueryData<Borrower[]>(borrowerKeys.all);
      const previousBorrower = queryClient.getQueryData<Borrower>(borrowerKeys.detail(id));

      if (previousBorrowers) {
        queryClient.setQueryData<Borrower[]>(
          borrowerKeys.all,
          previousBorrowers.map(borrower =>
            borrower.id === id ? { ...borrower, ...updates } : borrower
          )
        );
      }

      if (previousBorrower) {
        queryClient.setQueryData(
          borrowerKeys.detail(id),
          { ...previousBorrower, ...updates }
        );
      }

      return { previousBorrowers, previousBorrower };
    },

    onError: (_err, { id }, context) => {
      if (context?.previousBorrowers) {
        queryClient.setQueryData(borrowerKeys.all, context.previousBorrowers);
      }
      if (context?.previousBorrower) {
        queryClient.setQueryData(borrowerKeys.detail(id), context.previousBorrower);
      }
    },

    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: borrowerKeys.all });
      queryClient.invalidateQueries({ queryKey: borrowerKeys.detail(id) });
    }
  });
}

/**
 * Delete a borrower
 */
export function useDeleteBorrower() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => borrowerApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: borrowerKeys.all });
      const previousBorrowers = queryClient.getQueryData<Borrower[]>(borrowerKeys.all);

      if (previousBorrowers) {
        queryClient.setQueryData<Borrower[]>(
          borrowerKeys.all,
          previousBorrowers.filter(borrower => borrower.id !== id)
        );
      }

      return { previousBorrowers };
    },

    onError: (_err, _id, context) => {
      if (context?.previousBorrowers) {
        queryClient.setQueryData(borrowerKeys.all, context.previousBorrowers);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: borrowerKeys.all });
    }
  });
}

/**
 * Update borrower-loan relationships
 */
export function useUpdateBorrowerRelationships() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, relationships }: { id: number; relationships: Record<string, LoanRelationship> }) =>
      borrowerApi.updateRelationships(id, relationships),

    onSuccess: (_data, { id }) => {
      // Refetch the specific borrower to get updated relationships
      queryClient.invalidateQueries({ queryKey: borrowerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: borrowerKeys.all });
    }
  });
}
