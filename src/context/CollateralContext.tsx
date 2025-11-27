// Collateral Context - manages collateral-related state
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type {
  Collateral,
  CollateralLoanRelationships,
  DeleteCollateralConfirmation,
  CollateralContextType
} from '../types';
import { initialCollateral, initialCollateralLoanRelationships } from '../data';
import { useLoan } from './LoanContext';

// Create context
const CollateralContext = createContext<CollateralContextType | undefined>(undefined);

interface CollateralProviderProps {
  children: ReactNode;
}

// Provider component
export const CollateralProvider: React.FC<CollateralProviderProps> = ({ children }) => {
  // Get loan context for filtering
  const { selectedLoan } = useLoan();

  // Collateral state
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

  // Get selected collateral
  const selectedCollateral = useMemo(() =>
    collateralList.find(c => c.id === selectedCollateralId),
    [collateralList, selectedCollateralId]
  );

  // Get collateral for current loan
  const getCollateralForLoan = useCallback((): Collateral[] => {
    return collateralList.filter(c =>
      collateralLoanRelationships[c.id]?.[selectedLoan]
    );
  }, [collateralList, collateralLoanRelationships, selectedLoan]);

  // ID generator
  const getNextCollateralId = useCallback((): number => {
    return Math.max(...collateralList.map(c => c.id), 0) + 1;
  }, [collateralList]);

  // Context value
  const value = useMemo<CollateralContextType>(() => ({
    collateralList,
    setCollateralList,
    selectedCollateralId,
    setSelectedCollateralId,
    selectedCollateral,
    collateralLoanRelationships,
    setCollateralLoanRelationships,
    deleteCollateralConfirmation,
    setDeleteCollateralConfirmation,
    getCollateralForLoan,
    getNextCollateralId,
  }), [
    collateralList, selectedCollateralId, selectedCollateral,
    collateralLoanRelationships, deleteCollateralConfirmation,
    getCollateralForLoan, getNextCollateralId
  ]);

  return (
    <CollateralContext.Provider value={value}>
      {children}
    </CollateralContext.Provider>
  );
};

// Custom hook to use collateral context
export const useCollateral = (): CollateralContextType => {
  const context = useContext(CollateralContext);
  if (context === undefined) {
    throw new Error('useCollateral must be used within a CollateralProvider');
  }
  return context;
};
