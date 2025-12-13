// React Query hooks for Projection Settings operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectionSettingsApi } from '../api';
import type { ProjectionSettings } from '../types';

// Query keys
export const projectionSettingsKeys = {
  all: ['projectionSettings'] as const,
  byLoan: (mwLoanNo: string) => ['projectionSettings', 'loan', mwLoanNo] as const
};

// Variable types for mutations
interface SaveSettingsVariables {
  mwLoanNo: string;
  settings: ProjectionSettings;
}

interface UpdateSettingVariables {
  mwLoanNo: string;
  key: keyof ProjectionSettings;
  value: ProjectionSettings[keyof ProjectionSettings];
}

// Context types for optimistic updates
interface UpdateSettingContext {
  previousSettings: ProjectionSettings | undefined;
}

// ==================== QUERIES ====================

/**
 * Get projection settings for a specific loan
 * Returns default settings if none saved
 */
export function useProjectionSettings(mwLoanNo: string) {
  return useQuery({
    queryKey: projectionSettingsKeys.byLoan(mwLoanNo),
    queryFn: () => projectionSettingsApi.getByLoan(mwLoanNo),
    enabled: !!mwLoanNo,
    staleTime: 1000 * 60 * 5, // Settings don't change often, cache for 5 minutes
  });
}

// ==================== MUTATIONS ====================

/**
 * Save all projection settings for a loan
 */
export function useSaveProjectionSettings() {
  const queryClient = useQueryClient();

  return useMutation<ProjectionSettings, Error, SaveSettingsVariables>({
    mutationFn: ({ mwLoanNo, settings }: SaveSettingsVariables) =>
      projectionSettingsApi.save(mwLoanNo, settings),

    onSuccess: (_data: ProjectionSettings, { mwLoanNo }: SaveSettingsVariables) => {
      queryClient.invalidateQueries({ queryKey: projectionSettingsKeys.byLoan(mwLoanNo) });
    }
  });
}

/**
 * Update a single projection setting for a loan
 * Uses optimistic updates for instant UI feedback
 */
export function useUpdateProjectionSetting() {
  const queryClient = useQueryClient();

  return useMutation<ProjectionSettings, Error, UpdateSettingVariables, UpdateSettingContext>({
    mutationFn: ({ mwLoanNo, key, value }: UpdateSettingVariables) =>
      projectionSettingsApi.updateSetting(mwLoanNo, key, value),

    onMutate: async ({ mwLoanNo, key, value }: UpdateSettingVariables): Promise<UpdateSettingContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectionSettingsKeys.byLoan(mwLoanNo) });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<ProjectionSettings>(
        projectionSettingsKeys.byLoan(mwLoanNo)
      );

      // Optimistically update the cache
      if (previousSettings) {
        queryClient.setQueryData<ProjectionSettings>(
          projectionSettingsKeys.byLoan(mwLoanNo),
          { ...previousSettings, [key]: value }
        );
      }

      return { previousSettings };
    },

    onError: (_err: Error, { mwLoanNo }: UpdateSettingVariables, context: UpdateSettingContext | undefined) => {
      // Roll back on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          projectionSettingsKeys.byLoan(mwLoanNo),
          context.previousSettings
        );
      }
    },

    onSettled: (_data: ProjectionSettings | undefined, _error: Error | null, { mwLoanNo }: UpdateSettingVariables) => {
      // Always refetch to ensure we have the latest
      queryClient.invalidateQueries({ queryKey: projectionSettingsKeys.byLoan(mwLoanNo) });
    }
  });
}

/**
 * Reset projection settings to defaults for a loan
 */
export function useResetProjectionSettings() {
  const queryClient = useQueryClient();

  return useMutation<ProjectionSettings, Error, string>({
    mutationFn: (mwLoanNo: string) => projectionSettingsApi.reset(mwLoanNo),

    onSuccess: (_data: ProjectionSettings, mwLoanNo: string) => {
      queryClient.invalidateQueries({ queryKey: projectionSettingsKeys.byLoan(mwLoanNo) });
    }
  });
}
