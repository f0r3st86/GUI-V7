// Loan Context - centralized state management for all loan-related data
import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode, useCallback } from 'react';
import type {
  Loan,
  Borrower,
  Collateral,
  Comment,
  PaymentRecord,
  PaymentGridData,
  DeleteConfirmation,
  DeleteCollateralConfirmation,
  CollateralLoanRelationships,
  LoanRelationship,
  LoanContextType
} from '../types';
import {
  initialLoans,
  initialBorrowers,
  initialCollateral,
  initialCollateralLoanRelationships,
  initialComments,
  initialPaymentRecords
} from '../data';

// Create context
const LoanContext = createContext<LoanContextType | undefined>(undefined);

interface LoanProviderProps {
  children: ReactNode;
}

// Provider component
export const LoanProvider: React.FC<LoanProviderProps> = ({ children }) => {
  // ==================== LOAN STATE ====================
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [selectedLoan, setSelectedLoan] = useState<string>('7758');
  const [activeTab, setActiveTab] = useState<string>('Loan');

  // ==================== BORROWER STATE ====================
  const [borrowersList, setBorrowersList] = useState<Borrower[]>(initialBorrowers);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<number>(1);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    show: false,
    borrowerId: null,
    borrowerName: ''
  });

  // ==================== COLLATERAL STATE ====================
  const [collateralList, setCollateralList] = useState<Collateral[]>(initialCollateral);
  const [selectedCollateralId, setSelectedCollateralId] = useState<number>(1);
  const [collateralLoanRelationships, setCollateralLoanRelationships] =
    useState<CollateralLoanRelationships>(initialCollateralLoanRelationships);
  const [deleteCollateralConfirmation, setDeleteCollateralConfirmation] =
    useState<DeleteCollateralConfirmation>({
      show: false,
      collateralId: null,
      collateralDescription: ''
    });

  // ==================== COMMENT STATE ====================
  const [commentsList, setCommentsList] = useState<Comment[]>(initialComments);
  const [selectedCommentId, setSelectedCommentId] = useState<number>(1);

  // ==================== PAYMENT STATE ====================
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(initialPaymentRecords);
  const [paymentGridData, setPaymentGridData] = useState<PaymentGridData>({});

  // ==================== DERIVED STATE ====================

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

  // Get selected borrower
  const selectedBorrower = useMemo(() =>
    borrowersList.find(b => b.id === selectedBorrowerId),
    [borrowersList, selectedBorrowerId]
  );

  // Get selected collateral
  const selectedCollateral = useMemo(() =>
    collateralList.find(c => c.id === selectedCollateralId),
    [collateralList, selectedCollateralId]
  );

  // Get selected comment
  const selectedComment = useMemo(() =>
    commentsList.find(c => c.id === selectedCommentId),
    [commentsList, selectedCommentId]
  );

  // ==================== HELPER FUNCTIONS ====================

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

  // Get borrowers for current relationship
  const getRelationshipBorrowers = useCallback((): Borrower[] => {
    return borrowersList.filter(b => b.relationship === currentRelationship);
  }, [borrowersList, currentRelationship]);

  // Get sorted loans (selected loan first)
  const getSortedLoans = useCallback((): Loan[] => {
    return [...loans].sort((a, b) => {
      if (a.mwLoanNo === selectedLoan) return -1;
      if (b.mwLoanNo === selectedLoan) return 1;
      return 0;
    });
  }, [loans, selectedLoan]);

  // Get current borrower's loan relationships
  const getCurrentBorrowerLoanRelationships = useCallback((): Record<string, LoanRelationship> => {
    if (!selectedBorrower) return {};
    return selectedBorrower.loanRelationships || {};
  }, [selectedBorrower]);

  // Get collateral for current loan
  const getCollateralForLoan = useCallback((): Collateral[] => {
    return collateralList.filter(c =>
      collateralLoanRelationships[c.id]?.[selectedLoan]
    );
  }, [collateralList, collateralLoanRelationships, selectedLoan]);

  // Get filtered payment records for current loan
  const getFilteredPaymentRecords = useCallback((): PaymentRecord[] => {
    return paymentRecords.filter(record => record.loanNo === selectedLoan);
  }, [paymentRecords, selectedLoan]);

  // ID generators
  const getNextPaymentId = useCallback((): number => {
    return Math.max(...paymentRecords.map(r => r.id), 0) + 1;
  }, [paymentRecords]);

  const getNextBorrowerId = useCallback((): number => {
    return Math.max(...borrowersList.map(b => b.id), 0) + 1;
  }, [borrowersList]);

  const getNextCollateralId = useCallback((): number => {
    return Math.max(...collateralList.map(c => c.id), 0) + 1;
  }, [collateralList]);

  const getNextCommentId = useCallback((): number => {
    return Math.max(...commentsList.map(c => c.id), 0) + 1;
  }, [commentsList]);

  // ==================== EFFECTS ====================

  // Update payment grid data when payment records or selected loan changes
  useEffect(() => {
    const filteredRecords = paymentRecords.filter(
      record => record.loanNo === selectedLoan && record.year && record.month && record.amount
    );

    const gridData: PaymentGridData = {};
    filteredRecords.forEach(record => {
      const year = record.year;
      const month = parseInt(record.month);
      const amount = parseFloat(record.amount.replace(/[$,]/g, '')) || 0;

      if (!gridData[year]) {
        gridData[year] = {};
      }
      gridData[year][month] = amount;
    });

    setPaymentGridData(gridData);
  }, [paymentRecords, selectedLoan]);

  // Ensure there's always an empty row for new entries in payment records
  useEffect(() => {
    const filteredRecords = paymentRecords.filter(record => record.loanNo === selectedLoan);
    const lastRecord = filteredRecords[filteredRecords.length - 1];

    // Add empty row if the last row has data or if there are no records
    if (!lastRecord || (lastRecord.year && lastRecord.month && lastRecord.amount)) {
      setPaymentRecords(prev => [
        ...prev,
        {
          id: getNextPaymentId(),
          loanNo: selectedLoan,
          year: '',
          month: '',
          amount: ''
        }
      ]);
    }
  }, [selectedLoan, paymentRecords, getNextPaymentId]);

  // ==================== CONTEXT VALUE ====================
  const value = useMemo<LoanContextType>(() => ({
    // Loan state
    loans,
    setLoans,
    selectedLoan,
    setSelectedLoan,
    selectedLoanData,
    currentRelationship,

    // Tab state
    activeTab,
    setActiveTab,

    // Borrower state
    borrowersList,
    setBorrowersList,
    selectedBorrowerId,
    setSelectedBorrowerId,
    selectedBorrower,
    deleteConfirmation,
    setDeleteConfirmation,

    // Collateral state
    collateralList,
    setCollateralList,
    selectedCollateralId,
    setSelectedCollateralId,
    selectedCollateral,
    collateralLoanRelationships,
    setCollateralLoanRelationships,
    deleteCollateralConfirmation,
    setDeleteCollateralConfirmation,

    // Comment state
    commentsList,
    setCommentsList,
    selectedCommentId,
    setSelectedCommentId,
    selectedComment,

    // Payment state
    paymentRecords,
    setPaymentRecords,
    paymentGridData,
    setPaymentGridData,

    // Helper functions
    handleLoanFieldChange,
    getRelationshipBorrowers,
    getSortedLoans,
    getCurrentBorrowerLoanRelationships,
    getCollateralForLoan,
    getFilteredPaymentRecords,
    getNextPaymentId,
    getNextBorrowerId,
    getNextCollateralId,
    getNextCommentId,
  }), [
    loans, selectedLoan, selectedLoanData, currentRelationship,
    activeTab, borrowersList, selectedBorrowerId, selectedBorrower, deleteConfirmation,
    collateralList, selectedCollateralId, selectedCollateral,
    collateralLoanRelationships, deleteCollateralConfirmation,
    commentsList, selectedCommentId, selectedComment,
    paymentRecords, paymentGridData,
    handleLoanFieldChange, getRelationshipBorrowers, getSortedLoans,
    getCurrentBorrowerLoanRelationships, getCollateralForLoan, getFilteredPaymentRecords,
    getNextPaymentId, getNextBorrowerId, getNextCollateralId, getNextCommentId
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
