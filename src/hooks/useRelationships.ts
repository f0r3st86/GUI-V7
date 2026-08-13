// React Query hooks for Relationship operations (tblRelationships)
// Flags, narratives, exit code — the relationship-level write surface.
// sortNo and rowguid are server-owned (the API strips them from updates).
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { relationshipApi } from '../api';
import type { Relationship } from '../types';

export const relationshipKeys = {
  all: ['relationships'] as const,
  detail: (relatedLoans: string) => ['relationships', relatedLoans] as const
};

interface UpdateRelationshipVariables {
  relatedLoans: string;
  updates: Partial<Relationship>;
}

interface UpdateRelationshipContext {
  previousRelationships: Relationship[] | undefined;
}

/**
 * Get all relationships
 */
export function useRelationships() {
  return useQuery({
    queryKey: relationshipKeys.all,
    queryFn: () => relationshipApi.getAll()
  });
}

/**
 * Get a single relationship by its key (RelatedLoans)
 */
export function useRelationship(relatedLoans: string) {
  return useQuery({
    queryKey: relationshipKeys.detail(relatedLoans),
    queryFn: () => relationshipApi.getByKey(relatedLoans),
    enabled: !!relatedLoans
  });
}

/**
 * Update a relationship (flags, narratives, exitCode).
 * Optimistic with rollback, mirroring the other entity hooks.
 */
export function useUpdateRelationship() {
  const queryClient = useQueryClient();

  return useMutation<Relationship, Error, UpdateRelationshipVariables, UpdateRelationshipContext>({
    mutationFn: ({ relatedLoans, updates }) =>
      relationshipApi.update(relatedLoans, updates),

    onMutate: async ({ relatedLoans, updates }): Promise<UpdateRelationshipContext> => {
      await queryClient.cancelQueries({ queryKey: relationshipKeys.all });
      const previousRelationships = queryClient.getQueryData<Relationship[]>(relationshipKeys.all);

      if (previousRelationships) {
        queryClient.setQueryData<Relationship[]>(
          relationshipKeys.all,
          previousRelationships.map(r =>
            r.relatedLoans === relatedLoans ? { ...r, ...updates } : r
          )
        );
      }

      return { previousRelationships };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousRelationships) {
        queryClient.setQueryData(relationshipKeys.all, context.previousRelationships);
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
      queryClient.invalidateQueries({ queryKey: relationshipKeys.detail(variables.relatedLoans) });
    }
  });
}

/**
 * Program action: recompute sortNo across all projects
 * (rank by aggregate principal UPB, largest = 1)
 */
export function useRecomputeSortOrder() {
  const queryClient = useQueryClient();

  return useMutation<Relationship[], Error, void>({
    mutationFn: () => relationshipApi.recomputeSortOrder(),
    onSuccess: (data) => {
      queryClient.setQueryData(relationshipKeys.all, data);
    }
  });
}
