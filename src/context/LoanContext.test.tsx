/**
 * LoanContext Integration Tests
 * Tests for centralized loan state management
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { LoanProvider, useLoan } from './LoanContext';

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LoanProvider>{children}</LoanProvider>
);

describe('LoanContext', () => {
  describe('useLoan hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useLoan());
      }).toThrow('useLoan must be used within a LoanProvider');

      consoleSpy.mockRestore();
    });

    it('should provide initial state when used within provider', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.loans).toBeDefined();
      expect(result.current.loans.length).toBeGreaterThan(0);
      expect(result.current.selectedLoan).toBe('7758');
      expect(result.current.activeTab).toBe('Loan');
    });
  });

  describe('Loan State Management', () => {
    it('should allow selecting a different loan', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      act(() => {
        result.current.setSelectedLoan('2461');
      });

      expect(result.current.selectedLoan).toBe('2461');
    });

    it('should provide selectedLoanData based on selectedLoan', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.selectedLoanData).toBeDefined();
      expect(result.current.selectedLoanData?.mwLoanNo).toBe('7758');
    });

    it('should update selectedLoanData when selectedLoan changes', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const initialLoanData = result.current.selectedLoanData;

      act(() => {
        result.current.setSelectedLoan('2461');
      });

      expect(result.current.selectedLoanData?.mwLoanNo).toBe('2461');
      expect(result.current.selectedLoanData).not.toBe(initialLoanData);
    });

    it('should handle loan field changes', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const originalStatus = result.current.selectedLoanData?.status;

      act(() => {
        result.current.handleLoanFieldChange('status', 'FC');
      });

      expect(result.current.selectedLoanData?.status).toBe('FC');
      expect(result.current.selectedLoanData?.status).not.toBe(originalStatus);
    });

    it('should get sorted loans with selected loan first', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const sortedLoans = result.current.getSortedLoans();

      expect(sortedLoans[0].mwLoanNo).toBe(result.current.selectedLoan);
    });

    it('should derive currentRelationship from selectedLoanData', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.currentRelationship).toBe(
        result.current.selectedLoanData?.relatedLoans
      );
    });
  });

  describe('Tab State Management', () => {
    it('should allow changing active tab', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      act(() => {
        result.current.setActiveTab('Borrower');
      });

      expect(result.current.activeTab).toBe('Borrower');
    });
  });

  describe('Borrower State Management', () => {
    it('should provide borrowers list', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.borrowersList).toBeDefined();
      expect(Array.isArray(result.current.borrowersList)).toBe(true);
    });

    it('should filter borrowers by relationship', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const relationshipBorrowers = result.current.getRelationshipBorrowers();

      relationshipBorrowers.forEach(borrower => {
        expect(borrower.relationship).toBe(result.current.currentRelationship);
      });
    });

    it('should allow selecting a borrower', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      act(() => {
        result.current.setSelectedBorrowerId(2);
      });

      expect(result.current.selectedBorrowerId).toBe(2);
    });

    it('should provide selected borrower data', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.selectedBorrower).toBeDefined();
      expect(result.current.selectedBorrower?.id).toBe(result.current.selectedBorrowerId);
    });

    it('should generate next borrower ID', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const maxId = Math.max(...result.current.borrowersList.map(b => b.id));
      const nextId = result.current.getNextBorrowerId();

      expect(nextId).toBe(maxId + 1);
    });

    it('should get current borrower loan relationships', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const relationships = result.current.getCurrentBorrowerLoanRelationships();

      expect(typeof relationships).toBe('object');
    });

    it('should manage delete confirmation state', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      act(() => {
        result.current.setDeleteConfirmation({
          show: true,
          borrowerId: 1,
          borrowerName: 'Test Borrower'
        });
      });

      expect(result.current.deleteConfirmation.show).toBe(true);
      expect(result.current.deleteConfirmation.borrowerId).toBe(1);
    });
  });

  describe('Collateral State Management', () => {
    it('should provide collateral list', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.collateralList).toBeDefined();
      expect(Array.isArray(result.current.collateralList)).toBe(true);
    });

    it('should allow selecting collateral', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      act(() => {
        result.current.setSelectedCollateralId(2);
      });

      expect(result.current.selectedCollateralId).toBe(2);
    });

    it('should provide selected collateral data', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.selectedCollateral).toBeDefined();
      expect(result.current.selectedCollateral?.id).toBe(result.current.selectedCollateralId);
    });

    it('should get collateral for current loan', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const collateralForLoan = result.current.getCollateralForLoan();

      expect(Array.isArray(collateralForLoan)).toBe(true);
    });

    it('should manage collateral loan relationships', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.collateralLoanRelationships).toBeDefined();
      expect(typeof result.current.collateralLoanRelationships).toBe('object');
    });

    it('should generate next collateral ID', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const maxId = Math.max(...result.current.collateralList.map(c => c.id));
      const nextId = result.current.getNextCollateralId();

      expect(nextId).toBe(maxId + 1);
    });

    it('should manage delete collateral confirmation state', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      act(() => {
        result.current.setDeleteCollateralConfirmation({
          show: true,
          collateralId: 1,
          collateralDescription: 'Test Property'
        });
      });

      expect(result.current.deleteCollateralConfirmation.show).toBe(true);
      expect(result.current.deleteCollateralConfirmation.collateralId).toBe(1);
    });
  });

  describe('Comment State Management', () => {
    it('should provide comments list', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.commentsList).toBeDefined();
      expect(Array.isArray(result.current.commentsList)).toBe(true);
    });

    it('should allow selecting a comment', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      act(() => {
        result.current.setSelectedCommentId(2);
      });

      expect(result.current.selectedCommentId).toBe(2);
    });

    it('should provide selected comment data', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.selectedComment).toBeDefined();
      expect(result.current.selectedComment?.id).toBe(result.current.selectedCommentId);
    });

    it('should generate next comment ID', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const maxId = Math.max(...result.current.commentsList.map(c => c.id));
      const nextId = result.current.getNextCommentId();

      expect(nextId).toBe(maxId + 1);
    });
  });

  describe('Payment State Management', () => {
    it('should provide payment records', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.paymentRecords).toBeDefined();
      expect(Array.isArray(result.current.paymentRecords)).toBe(true);
    });

    it('should filter payment records for selected loan', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const filteredRecords = result.current.getFilteredPaymentRecords();

      filteredRecords.forEach(record => {
        expect(record.loanNo).toBe(result.current.selectedLoan);
      });
    });

    it('should generate next payment ID', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const maxId = Math.max(...result.current.paymentRecords.map(r => r.id));
      const nextId = result.current.getNextPaymentId();

      expect(nextId).toBe(maxId + 1);
    });

    it('should provide payment grid data', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      expect(result.current.paymentGridData).toBeDefined();
      expect(typeof result.current.paymentGridData).toBe('object');
    });

    it('should allow adding payment records', async () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const initialCount = result.current.paymentRecords.length;

      act(() => {
        const newRecord = {
          id: result.current.getNextPaymentId(),
          loanNo: result.current.selectedLoan,
          year: '2024',
          month: '11',
          amount: '1000'
        };
        result.current.setPaymentRecords([...result.current.paymentRecords, newRecord]);
      });

      await waitFor(() => {
        expect(result.current.paymentRecords.length).toBeGreaterThan(initialCount);
      });
    });
  });

  describe('State Persistence Across Updates', () => {
    it('should maintain other state when one state changes', () => {
      const { result } = renderHook(() => useLoan(), { wrapper });

      const originalBorrowers = result.current.borrowersList;
      const originalCollateral = result.current.collateralList;

      act(() => {
        result.current.setSelectedLoan('7759');
      });

      // Borrowers and collateral should remain unchanged
      expect(result.current.borrowersList).toBe(originalBorrowers);
      expect(result.current.collateralList).toBe(originalCollateral);
    });
  });
});
