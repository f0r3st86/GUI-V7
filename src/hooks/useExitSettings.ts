// React Query hooks for Exit Settings operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exitSettingsApi } from '../api';
import type { ExitSettings } from '../types';

// Query keys
export const exitSettingsKeys = {
  all: ['exitSettings'] as const,
  byLoan: (mwLoanNo: string) => ['exitSettings', 'loan', mwLoanNo] as const
};

// Variable types for mutations
interface SaveSettingsVariables {
  mwLoanNo: string;
  settings: ExitSettings;
}

interface UpdateSettingVariables {
  mwLoanNo: string;
  key: keyof ExitSettings;
  value: ExitSettings[keyof ExitSettings];
}

// Context types for optimistic updates
interface UpdateSettingContext {
  previousSettings: ExitSettings | undefined;
}

// ==================== QUERIES ====================

/**
 * Get exit settings for a specific loan
 * Returns default settings if none saved
 */
export function useExitSettings(mwLoanNo: string) {
  return useQuery({
    queryKey: exitSettingsKeys.byLoan(mwLoanNo),
    queryFn: () => exitSettingsApi.getByLoan(mwLoanNo),
    enabled: !!mwLoanNo,
    staleTime: 1000 * 60 * 5, // Settings don't change often, cache for 5 minutes
  });
}

// ==================== MUTATIONS ====================

/**
 * Save all exit settings for a loan
 */
export function useSaveExitSettings() {
  const queryClient = useQueryClient();

  return useMutation<ExitSettings, Error, SaveSettingsVariables>({
    mutationFn: ({ mwLoanNo, settings }: SaveSettingsVariables) =>
      exitSettingsApi.save(mwLoanNo, settings),

    onSuccess: (_data: ExitSettings, { mwLoanNo }: SaveSettingsVariables) => {
      queryClient.invalidateQueries({ queryKey: exitSettingsKeys.byLoan(mwLoanNo) });
    }
  });
}

/**
 * Update a single exit setting for a loan
 * Uses optimistic updates for instant UI feedback
 */
export function useUpdateExitSetting() {
  const queryClient = useQueryClient();

  return useMutation<ExitSettings, Error, UpdateSettingVariables, UpdateSettingContext>({
    mutationFn: ({ mwLoanNo, key, value }: UpdateSettingVariables) =>
      exitSettingsApi.updateSetting(mwLoanNo, key, value),

    onMutate: async ({ mwLoanNo, key, value }: UpdateSettingVariables): Promise<UpdateSettingContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: exitSettingsKeys.byLoan(mwLoanNo) });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<ExitSettings>(
        exitSettingsKeys.byLoan(mwLoanNo)
      );

      // Optimistically update the cache
      if (previousSettings) {
        queryClient.setQueryData<ExitSettings>(
          exitSettingsKeys.byLoan(mwLoanNo),
          { ...previousSettings, [key]: value }
        );
      }

      return { previousSettings };
    },

    onError: (_err: Error, { mwLoanNo }: UpdateSettingVariables, context: UpdateSettingContext | undefined) => {
      // Roll back on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          exitSettingsKeys.byLoan(mwLoanNo),
          context.previousSettings
        );
      }
    },

    onSettled: (_data: ExitSettings | undefined, _error: Error | null, { mwLoanNo }: UpdateSettingVariables) => {
      // Always refetch to ensure we have the latest
      queryClient.invalidateQueries({ queryKey: exitSettingsKeys.byLoan(mwLoanNo) });
    }
  });
}

/**
 * Reset exit settings to defaults for a loan
 */
export function useResetExitSettings() {
  const queryClient = useQueryClient();

  return useMutation<ExitSettings, Error, string>({
    mutationFn: (mwLoanNo: string) => exitSettingsApi.reset(mwLoanNo),

    onSuccess: (_data: ExitSettings, mwLoanNo: string) => {
      queryClient.invalidateQueries({ queryKey: exitSettingsKeys.byLoan(mwLoanNo) });
    }
  });
}
