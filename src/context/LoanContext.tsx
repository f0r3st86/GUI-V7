// Loan Context - core loan selection and data management
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type { Loan, LoanContextType } from '../types';
import { initialLoans } from '../data';

// Create context
const LoanContext = createContext<LoanContextType | undefined>(undefined);

interface LoanProviderProps {
  children: ReactNode;
}

// Provider component
export const LoanProvider: React.FC<LoanProviderProps> = ({ children }) => {
  // Loan state
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [selectedLoan, setSelectedLoan] = useState<string>('7758');
  const [activeTab, setActiveTab] = useState<string>('Loan');

  // Get currently selected loan data
  const selectedLoanData = useMemo(() =>
    loans.find(loan => loan.mwLoanNo === selectedLoan),
    [loans, selectedLoan]
  );

  // Get current relationship (grouping)
  const currentRelationship = useMemo(() =>
    selectedLoanData?.relatedLoans || '',
    [selectedLoanData]
  );

  // Handle changes to loan fields
  const handleLoanFieldChange = useCallback((field: string, value: string | number) => {
    setLoans(prevLoans =>
      prevLoans.map(loan =>
        loan.mwLoanNo === selectedLoan
          ? { ...loan, [field]: value }
          : loan
      )
    );
  }, [selectedLoan]);

  // Get sorted loans (selected loan first)
  const getSortedLoans = useCallback((): Loan[] => {
    return [...loans].sort((a, b) => {
      if (a.mwLoanNo === selectedLoan) return -1;
      if (b.mwLoanNo === selectedLoan) return 1;
      return 0;
    });
  }, [loans, selectedLoan]);

  // Context value
  const value = useMemo<LoanContextType>(() => ({
    loans,
    setLoans,
    selectedLoan,
    setSelectedLoan,
    selectedLoanData,
    currentRelationship,
    activeTab,
    setActiveTab,
    handleLoanFieldChange,
    getSortedLoans,
  }), [
    loans, selectedLoan, selectedLoanData, currentRelationship,
    activeTab, handleLoanFieldChange, getSortedLoans
  ]);

  return (
    <LoanContext.Provider value={value}>
      {children}
    </LoanContext.Provider>
  );
};

// Custom hook to use loan context
export const useLoan = (): LoanContextType => {
  const context = useContext(LoanContext);
  if (context === undefined) {
    throw new Error('useLoan must be used within a LoanProvider');
  }
  return context;
};
