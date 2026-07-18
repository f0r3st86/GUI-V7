/**
 * LoanContext Tests
 *
 * LoanContext holds UI state only (selection + navigation); server state
 * lives in React Query. The provider derives selectedLoanData and
 * currentRelationship from the React Query loans cache, so tests wrap it
 * in a QueryClientProvider pre-seeded with the initial loan data.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoanProvider, useLoan } from './LoanContext';
import { initialLoans } from '../data';

// Wrapper with pre-seeded React Query cache (same approach as test-utils)
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: Infinity },
    },
  });
  queryClient.setQueryData(['loans'], [...initialLoans]);

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LoanProvider>{children}</LoanProvider>
    </QueryClientProvider>
  );
};

describe('LoanContext', () => {
  describe('useLoan hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useLoan());
      }).toThrow('useLoan must be used within a LoanProvider');

      consoleSpy.mockRestore();
    });

    it('should provide initial UI state when used within provider', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      expect(result.current.selectedLoan).toBe('7758');
      expect(result.current.activeTab).toBe('Loan');
      expect(result.current.selectedBorrowerId).toBe(1);
      expect(result.current.selectedCollateralId).toBe(1);
      expect(result.current.selectedCommentId).toBe(1);
    });
  });

  describe('Loan Selection', () => {
    it('should allow selecting a different loan', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      act(() => {
        result.current.setSelectedLoan('2461');
      });

      expect(result.current.selectedLoan).toBe('2461');
    });

    it('should derive selectedLoanData from the React Query loans cache', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      expect(result.current.selectedLoanData).toBeDefined();
      expect(result.current.selectedLoanData?.mwLoanNo).toBe('7758');
    });

    it('should update selectedLoanData when selectedLoan changes', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      const initialLoanData = result.current.selectedLoanData;

      act(() => {
        result.current.setSelectedLoan('2461');
      });

      expect(result.current.selectedLoanData?.mwLoanNo).toBe('2461');
      expect(result.current.selectedLoanData).not.toBe(initialLoanData);
    });

    it('should derive currentRelationship from selectedLoanData', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      expect(result.current.currentRelationship).toBe('Haskell');
      expect(result.current.currentRelationship).toBe(
        result.current.selectedLoanData?.relatedLoans
      );
    });

    it('should return undefined selectedLoanData for unknown loan number', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      act(() => {
        result.current.setSelectedLoan('9999');
      });

      expect(result.current.selectedLoanData).toBeUndefined();
      expect(result.current.currentRelationship).toBe('');
    });
  });

  describe('Tab Navigation', () => {
    it('should allow changing active tab', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      act(() => {
        result.current.setActiveTab('Borrower');
      });

      expect(result.current.activeTab).toBe('Borrower');
    });
  });

  describe('Entity Selection', () => {
    it('should allow selecting a borrower', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      act(() => {
        result.current.setSelectedBorrowerId(2);
      });

      expect(result.current.selectedBorrowerId).toBe(2);
    });

    it('should allow selecting collateral', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      act(() => {
        result.current.setSelectedCollateralId(2);
      });

      expect(result.current.selectedCollateralId).toBe(2);
    });

    it('should allow selecting a comment', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      act(() => {
        result.current.setSelectedCommentId(2);
      });

      expect(result.current.selectedCommentId).toBe(2);
    });
  });

  describe('State Independence', () => {
    it('should maintain other selections when one changes', () => {
      const { result } = renderHook(() => useLoan(), { wrapper: createWrapper() });

      act(() => {
        result.current.setSelectedBorrowerId(3);
        result.current.setSelectedCollateralId(2);
      });

      act(() => {
        result.current.setSelectedLoan('2461');
      });

      expect(result.current.selectedBorrowerId).toBe(3);
      expect(result.current.selectedCollateralId).toBe(2);
      expect(result.current.selectedLoan).toBe('2461');
    });
  });
});
