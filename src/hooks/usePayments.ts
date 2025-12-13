// React Query hooks for Payment operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api';
import type { PaymentRecord } from '../types';

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  byLoan: (mwLoanNo: string) => ['payments', 'loan', mwLoanNo] as const
};

// Context types for mutations
interface AddPaymentContext {
  previousPayments: PaymentRecord[] | undefined;
  previousLoanPayments: PaymentRecord[] | undefined;
}

interface UpdatePaymentVariables {
  id: number;
  updates: Partial<PaymentRecord>;
}

interface DeletePaymentContext {
  previousPayments: PaymentRecord[] | undefined;
}

// ==================== QUERIES ====================

/**
 * Get all payment records
 */
export function usePayments() {
  return useQuery({
    queryKey: paymentKeys.all,
    queryFn: () => paymentApi.getAll()
  });
}

/**
 * Get payment records for a specific loan
 */
export function usePaymentsByLoan(mwLoanNo: string) {
  return useQuery({
    queryKey: paymentKeys.byLoan(mwLoanNo),
    queryFn: () => paymentApi.getByLoan(mwLoanNo),
    enabled: !!mwLoanNo
  });
}

// ==================== MUTATIONS ====================

/**
 * Add a new payment record
 */
export function useAddPayment() {
  const queryClient = useQueryClient();

  return useMutation<PaymentRecord, Error, PaymentRecord, AddPaymentContext>({
    mutationFn: (payment: PaymentRecord) => paymentApi.create(payment),

    onMutate: async (newPayment: PaymentRecord): Promise<AddPaymentContext> => {
      await queryClient.cancelQueries({ queryKey: paymentKeys.all });
      await queryClient.cancelQueries({ queryKey: paymentKeys.byLoan(newPayment.loanNo) });

      const previousPayments = queryClient.getQueryData<PaymentRecord[]>(paymentKeys.all);
      const previousLoanPayments = queryClient.getQueryData<PaymentRecord[]>(
        paymentKeys.byLoan(newPayment.loanNo)
      );

      if (previousPayments) {
        queryClient.setQueryData<PaymentRecord[]>(paymentKeys.all, [...previousPayments, newPayment]);
      }

      if (previousLoanPayments) {
        queryClient.setQueryData<PaymentRecord[]>(
          paymentKeys.byLoan(newPayment.loanNo),
          [...previousLoanPayments, newPayment]
        );
      }

      return { previousPayments, previousLoanPayments };
    },

    onError: (_err: Error, newPayment: PaymentRecord, context: AddPaymentContext | undefined) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(paymentKeys.all, context.previousPayments);
      }
      if (context?.previousLoanPayments) {
        queryClient.setQueryData(paymentKeys.byLoan(newPayment.loanNo), context.previousLoanPayments);
      }
    },

    onSettled: (_data: PaymentRecord | undefined, _error: Error | null, newPayment: PaymentRecord) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentKeys.byLoan(newPayment.loanNo) });
    }
  });
}

/**
 * Update an existing payment record
 * Uses optimistic updates for instant UI feedback
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation<PaymentRecord, Error, UpdatePaymentVariables, { previousPayments: PaymentRecord[] | undefined }>({
    mutationFn: ({ id, updates }: UpdatePaymentVariables) =>
      paymentApi.update(id, updates),

    // Optimistic update - update UI immediately before API call completes
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: paymentKeys.all });

      // Snapshot the previous value
      const previousPayments = queryClient.getQueryData<PaymentRecord[]>(paymentKeys.all);

      // Optimistically update to the new value
      if (previousPayments) {
        queryClient.setQueryData<PaymentRecord[]>(
          paymentKeys.all,
          previousPayments.map(payment =>
            payment.id === id ? { ...payment, ...updates } : payment
          )
        );
      }

      return { previousPayments };
    },

    // If the mutation fails, roll back to the previous value
    onError: (_err, _variables, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(paymentKeys.all, context.previousPayments);
      }
    },

    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    }
  });
}

/**
 * Delete a payment record
 */
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, DeletePaymentContext>({
    mutationFn: (id: number) => paymentApi.delete(id),

    onMutate: async (id: number): Promise<DeletePaymentContext> => {
      await queryClient.cancelQueries({ queryKey: paymentKeys.all });
      const previousPayments = queryClient.getQueryData<PaymentRecord[]>(paymentKeys.all);

      if (previousPayments) {
        queryClient.setQueryData<PaymentRecord[]>(
          paymentKeys.all,
          previousPayments.filter(payment => payment.id !== id)
        );
      }

      return { previousPayments };
    },

    onError: (_err: Error, _id: number, context: DeletePaymentContext | undefined) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(paymentKeys.all, context.previousPayments);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    }
  });
}
