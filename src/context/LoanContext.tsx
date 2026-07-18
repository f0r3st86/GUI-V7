// Loan Context - UI state only (selection, navigation)
//
// Server state (loans, borrowers, collateral, comments, payments) lives in
// React Query via the hooks in src/hooks — this context deliberately holds
// none of it. selectedLoanData/currentRelationship are derived from the
// React Query loans cache so every consumer sees the same, live data.
// When the mock API is replaced with a real backend, nothing here changes.
import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import type { LoanContextType } from '../types';
import { useLoans } from '../hooks';

const LoanContext = createContext<LoanContextType | undefined>(undefined);

interface LoanProviderProps {
  children: ReactNode;
}

export const LoanProvider: React.FC<LoanProviderProps> = ({ children }) => {
  // ==================== UI STATE ====================
  const [selectedLoan, setSelectedLoan] = useState<string>('7758');
  const [activeTab, setActiveTab] = useState<string>('Loan');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<number>(1);
  const [selectedCollateralId, setSelectedCollateralId] = useState<number>(1);
  const [selectedCommentId, setSelectedCommentId] = useState<number>(1);

  // ==================== DERIVED FROM REACT QUERY ====================
  const { data: loans } = useLoans();

  const selectedLoanData = useMemo(
    () => (loans ?? []).find(loan => loan.mwLoanNo === selectedLoan),
    [loans, selectedLoan]
  );

  const currentRelationship = selectedLoanData?.relatedLoans || '';

  // ==================== CONTEXT VALUE ====================
  const value = useMemo<LoanContextType>(() => ({
    selectedLoan,
    setSelectedLoan,
    selectedLoanData,
    currentRelationship,
    activeTab,
    setActiveTab,
    selectedBorrowerId,
    setSelectedBorrowerId,
    selectedCollateralId,
    setSelectedCollateralId,
    selectedCommentId,
    setSelectedCommentId,
  }), [
    selectedLoan, selectedLoanData, currentRelationship, activeTab,
    selectedBorrowerId, selectedCollateralId, selectedCommentId
  ]);

  return (
    <LoanContext.Provider value={value}>
      {children}
    </LoanContext.Provider>
  );
};

export const useLoan = (): LoanContextType => {
  const context = useContext(LoanContext);
  if (context === undefined) {
    throw new Error('useLoan must be used within a LoanProvider');
  }
  return context;
};
