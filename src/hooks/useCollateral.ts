// React Query hooks for Collateral operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collateralApi } from '../api';
import type { Collateral, CollateralLoanRelationships } from '../types';

// Query keys
export const collateralKeys = {
  all: ['collateral'] as const,
  detail: (id: number) => ['collateral', id] as const,
  relationships: ['collateral-relationships'] as const
};

// Context types for mutations
interface AddCollateralContext {
  previousCollateral: Collateral[] | undefined;
}

interface UpdateCollateralVariables {
  id: number;
  updates: Partial<Collateral>;
}

interface UpdateCollateralContext {
  previousCollateral: Collateral[] | undefined;
  previousItem: Collateral | undefined;
}

interface DeleteCollateralContext {
  previousCollateral: Collateral[] | undefined;
}

// ==================== QUERIES ====================

/**
 * Get all collateral
 */
export function useCollateral() {
  return useQuery({
    queryKey: collateralKeys.all,
    queryFn: () => collateralApi.getAll()
  });
}

/**
 * Get single collateral by ID
 */
export function useCollateralItem(id: number) {
  return useQuery({
    queryKey: collateralKeys.detail(id),
    queryFn: () => collateralApi.getById(id),
    enabled: !!id
  });
}

/**
 * Get collateral-loan relationships
 */
export function useCollateralRelationships() {
  return useQuery({
    queryKey: collateralKeys.relationships,
    queryFn: () => collateralApi.getRelationships()
  });
}

// ==================== MUTATIONS ====================

/**
 * Add new collateral
 */
export function useAddCollateral() {
  const queryClient = useQueryClient();

  return useMutation<Collateral, Error, Collateral, AddCollateralContext>({
    mutationFn: (collateral: Collateral) => collateralApi.create(collateral),

    onMutate: async (newCollateral: Collateral): Promise<AddCollateralContext> => {
      await queryClient.cancelQueries({ queryKey: collateralKeys.all });
      const previousCollateral = queryClient.getQueryData<Collateral[]>(collateralKeys.all);

      if (previousCollateral) {
        queryClient.setQueryData<Collateral[]>(collateralKeys.all, [...previousCollateral, newCollateral]);
      }

      return { previousCollateral };
    },

    onError: (_err: Error, _newCollateral: Collateral, context: AddCollateralContext | undefined) => {
      if (context?.previousCollateral) {
        queryClient.setQueryData(collateralKeys.all, context.previousCollateral);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: collateralKeys.all });
    }
  });
}

/**
 * Update existing collateral
 */
export function useUpdateCollateral() {
  const queryClient = useQueryClient();

  return useMutation<Collateral, Error, UpdateCollateralVariables, UpdateCollateralContext>({
    mutationFn: ({ id, updates }: UpdateCollateralVariables) =>
      collateralApi.update(id, updates),

    onMutate: async ({ id, updates }: UpdateCollateralVariables): Promise<UpdateCollateralContext> => {
      await queryClient.cancelQueries({ queryKey: collateralKeys.all });
      await queryClient.cancelQueries({ queryKey: collateralKeys.detail(id) });

      const previousCollateral = queryClient.getQueryData<Collateral[]>(collateralKeys.all);
      const previousItem = queryClient.getQueryData<Collateral>(collateralKeys.detail(id));

      if (previousCollateral) {
        queryClient.setQueryData<Collateral[]>(
          collateralKeys.all,
          previousCollateral.map(item =>
            item.id === id ? { ...item, ...updates } : item
          )
        );
      }

      if (previousItem) {
        queryClient.setQueryData(
          collateralKeys.detail(id),
          { ...previousItem, ...updates }
        );
      }

      return { previousCollateral, previousItem };
    },

    onError: (_err: Error, { id }: UpdateCollateralVariables, context: UpdateCollateralContext | undefined) => {
      if (context?.previousCollateral) {
        queryClient.setQueryData(collateralKeys.all, context.previousCollateral);
      }
      if (context?.previousItem) {
        queryClient.setQueryData(collateralKeys.detail(id), context.previousItem);
      }
    },

    onSettled: (_data: Collateral | undefined, _error: Error | null, { id }: UpdateCollateralVariables) => {
      queryClient.invalidateQueries({ queryKey: collateralKeys.all });
      queryClient.invalidateQueries({ queryKey: collateralKeys.detail(id) });
    }
  });
}

/**
 * Delete collateral
 */
export function useDeleteCollateral() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, DeleteCollateralContext>({
    mutationFn: (id: number) => collateralApi.delete(id),

    onMutate: async (id: number): Promise<DeleteCollateralContext> => {
      await queryClient.cancelQueries({ queryKey: collateralKeys.all });
      const previousCollateral = queryClient.getQueryData<Collateral[]>(collateralKeys.all);

      if (previousCollateral) {
        queryClient.setQueryData<Collateral[]>(
          collateralKeys.all,
          previousCollateral.filter(item => item.id !== id)
        );
      }

      return { previousCollateral };
    },

    onError: (_err: Error, _id: number, context: DeleteCollateralContext | undefined) => {
      if (context?.previousCollateral) {
        queryClient.setQueryData(collateralKeys.all, context.previousCollateral);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: collateralKeys.all });
      queryClient.invalidateQueries({ queryKey: collateralKeys.relationships });
    }
  });
}

/**
 * Update collateral-loan relationships
 */
export function useUpdateCollateralRelationships() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CollateralLoanRelationships>({
    mutationFn: (relationships: CollateralLoanRelationships) =>
      collateralApi.updateRelationships(relationships),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collateralKeys.relationships });
    }
  });
}
