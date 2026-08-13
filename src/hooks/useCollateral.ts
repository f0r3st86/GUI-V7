// React Query hooks for Collateral operations
// Keyed by mwPropertyNo (production CollateralInfo.MWPropertyNo).
// Collateral links to the relationship via relatedLoans (primary) and
// optionally to a specific loan via loanNo (secondary).
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collateralApi } from '../api';
import type { Collateral } from '../types';

// Query keys
export const collateralKeys = {
  all: ['collateral'] as const,
  detail: (mwPropertyNo: number) => ['collateral', mwPropertyNo] as const
};

// Context types for mutations
interface AddCollateralContext {
  previousCollateral: Collateral[] | undefined;
}

interface UpdateCollateralVariables {
  mwPropertyNo: number;
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
 * Get single collateral by production key
 */
export function useCollateralItem(mwPropertyNo: number) {
  return useQuery({
    queryKey: collateralKeys.detail(mwPropertyNo),
    queryFn: () => collateralApi.getById(mwPropertyNo),
    enabled: !!mwPropertyNo
  });
}

// ==================== MUTATIONS ====================

/**
 * Add new collateral (server assigns mwPropertyNo)
 */
export function useAddCollateral() {
  const queryClient = useQueryClient();

  return useMutation<Collateral, Error, Omit<Collateral, 'mwPropertyNo'> & { mwPropertyNo?: number }, AddCollateralContext>({
    mutationFn: (collateral) => collateralApi.create(collateral),

    onMutate: async (): Promise<AddCollateralContext> => {
      await queryClient.cancelQueries({ queryKey: collateralKeys.all });
      const previousCollateral = queryClient.getQueryData<Collateral[]>(collateralKeys.all);
      // No optimistic insert: the server owns mwPropertyNo, so we wait for it
      return { previousCollateral };
    },

    onError: (_err, _newCollateral, context) => {
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
    mutationFn: ({ mwPropertyNo, updates }: UpdateCollateralVariables) =>
      collateralApi.update(mwPropertyNo, updates),

    onMutate: async ({ mwPropertyNo, updates }: UpdateCollateralVariables): Promise<UpdateCollateralContext> => {
      await queryClient.cancelQueries({ queryKey: collateralKeys.all });
      await queryClient.cancelQueries({ queryKey: collateralKeys.detail(mwPropertyNo) });

      const previousCollateral = queryClient.getQueryData<Collateral[]>(collateralKeys.all);
      const previousItem = queryClient.getQueryData<Collateral>(collateralKeys.detail(mwPropertyNo));

      if (previousCollateral) {
        queryClient.setQueryData<Collateral[]>(
          collateralKeys.all,
          previousCollateral.map(item =>
            item.mwPropertyNo === mwPropertyNo ? { ...item, ...updates } : item
          )
        );
      }

      if (previousItem) {
        queryClient.setQueryData(
          collateralKeys.detail(mwPropertyNo),
          { ...previousItem, ...updates }
        );
      }

      return { previousCollateral, previousItem };
    },

    onError: (_err, { mwPropertyNo }, context) => {
      if (context?.previousCollateral) {
        queryClient.setQueryData(collateralKeys.all, context.previousCollateral);
      }
      if (context?.previousItem) {
        queryClient.setQueryData(collateralKeys.detail(mwPropertyNo), context.previousItem);
      }
    },

    onSettled: (_data, _error, { mwPropertyNo }) => {
      queryClient.invalidateQueries({ queryKey: collateralKeys.all });
      queryClient.invalidateQueries({ queryKey: collateralKeys.detail(mwPropertyNo) });
    }
  });
}

/**
 * Delete collateral
 */
export function useDeleteCollateral() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, DeleteCollateralContext>({
    mutationFn: (mwPropertyNo: number) => collateralApi.delete(mwPropertyNo),

    onMutate: async (mwPropertyNo: number): Promise<DeleteCollateralContext> => {
      await queryClient.cancelQueries({ queryKey: collateralKeys.all });
      const previousCollateral = queryClient.getQueryData<Collateral[]>(collateralKeys.all);

      if (previousCollateral) {
        queryClient.setQueryData<Collateral[]>(
          collateralKeys.all,
          previousCollateral.filter(item => item.mwPropertyNo !== mwPropertyNo)
        );
      }

      return { previousCollateral };
    },

    onError: (_err, _mwPropertyNo, context) => {
      if (context?.previousCollateral) {
        queryClient.setQueryData(collateralKeys.all, context.previousCollateral);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: collateralKeys.all });
    }
  });
}
