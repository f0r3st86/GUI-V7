// React Query hooks for Comment operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '../api';
import type { Comment } from '../types';

// Query keys
export const commentKeys = {
  all: ['comments'] as const,
  byLoan: (mwLoanNo: string) => ['comments', 'loan', mwLoanNo] as const
};

// ==================== QUERIES ====================

/**
 * Get all comments
 */
export function useComments() {
  return useQuery({
    queryKey: commentKeys.all,
    queryFn: () => commentApi.getAll()
  });
}

/**
 * Get comments for a specific loan
 */
export function useCommentsByLoan(mwLoanNo: string) {
  return useQuery({
    queryKey: commentKeys.byLoan(mwLoanNo),
    queryFn: () => commentApi.getByLoan(mwLoanNo),
    enabled: !!mwLoanNo
  });
}

// ==================== MUTATIONS ====================

/**
 * Add a new comment
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comment: Comment) => commentApi.create(comment),

    onMutate: async (newComment) => {
      await queryClient.cancelQueries({ queryKey: commentKeys.all });
      await queryClient.cancelQueries({ queryKey: commentKeys.byLoan(newComment.loanNo) });

      const previousComments = queryClient.getQueryData<Comment[]>(commentKeys.all);
      const previousLoanComments = queryClient.getQueryData<Comment[]>(
        commentKeys.byLoan(newComment.loanNo)
      );

      if (previousComments) {
        queryClient.setQueryData<Comment[]>(commentKeys.all, [...previousComments, newComment]);
      }

      if (previousLoanComments) {
        queryClient.setQueryData<Comment[]>(
          commentKeys.byLoan(newComment.loanNo),
          [...previousLoanComments, newComment]
        );
      }

      return { previousComments, previousLoanComments };
    },

    onError: (_err, newComment, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentKeys.all, context.previousComments);
      }
      if (context?.previousLoanComments) {
        queryClient.setQueryData(commentKeys.byLoan(newComment.loanNo), context.previousLoanComments);
      }
    },

    onSettled: (_data, _error, newComment) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
      queryClient.invalidateQueries({ queryKey: commentKeys.byLoan(newComment.loanNo) });
    }
  });
}

/**
 * Update an existing comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Comment> }) =>
      commentApi.update(id, updates),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    }
  });
}

/**
 * Delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => commentApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: commentKeys.all });
      const previousComments = queryClient.getQueryData<Comment[]>(commentKeys.all);

      if (previousComments) {
        queryClient.setQueryData<Comment[]>(
          commentKeys.all,
          previousComments.filter(comment => comment.id !== id)
        );
      }

      return { previousComments };
    },

    onError: (_err, _id, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentKeys.all, context.previousComments);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    }
  });
}
