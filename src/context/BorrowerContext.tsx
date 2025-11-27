// Borrower Context - manages borrower-related state
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type {
  Borrower,
  DeleteConfirmation,
  LoanRelationship,
  BorrowerContextType
} from '../types';
import { initialBorrowers } from '../data';
import { useLoan } from './LoanContext';

// Create context
const BorrowerContext = createContext<BorrowerContextType | undefined>(undefined);

interface BorrowerProviderProps {
  children: ReactNode;
}

// Provider component
export const BorrowerProvider: React.FC<BorrowerProviderProps> = ({ children }) => {
  // Get loan context for relationship filtering
  const { currentRelationship } = useLoan();

  // Borrower state
  const [borrowersList, setBorrowersList] = useState<Borrower[]>(initialBorrowers);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<number>(1);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    show: false,
    borrowerId: null,
    borrowerName: ''
  });

  // Get selected borrower
  const selectedBorrower = useMemo(() =>
    borrowersList.find(b => b.id === selectedBorrowerId),
    [borrowersList, selectedBorrowerId]
  );

  // Get borrowers for current relationship
  const getRelationshipBorrowers = useCallback((): Borrower[] => {
    return borrowersList.filter(b => b.relationship === currentRelationship);
  }, [borrowersList, currentRelationship]);

  // Get current borrower's loan relationships
  const getCurrentBorrowerLoanRelationships = useCallback((): Record<string, LoanRelationship> => {
    if (!selectedBorrower) return {};
    return selectedBorrower.loanRelationships || {};
  }, [selectedBorrower]);

  // ID generator
  const getNextBorrowerId = useCallback((): number => {
    return Math.max(...borrowersList.map(b => b.id), 0) + 1;
  }, [borrowersList]);

  // Context value
  const value = useMemo<BorrowerContextType>(() => ({
    borrowersList,
    setBorrowersList,
    selectedBorrowerId,
    setSelectedBorrowerId,
    selectedBorrower,
    deleteConfirmation,
    setDeleteConfirmation,
    getRelationshipBorrowers,
    getCurrentBorrowerLoanRelationships,
    getNextBorrowerId,
  }), [
    borrowersList, selectedBorrowerId, selectedBorrower, deleteConfirmation,
    getRelationshipBorrowers, getCurrentBorrowerLoanRelationships, getNextBorrowerId
  ]);

  return (
    <BorrowerContext.Provider value={value}>
      {children}
    </BorrowerContext.Provider>
  );
};

// Custom hook to use borrower context
export const useBorrower = (): BorrowerContextType => {
  const context = useContext(BorrowerContext);
  if (context === undefined) {
    throw new Error('useBorrower must be used within a BorrowerProvider');
  }
  return context;
};
