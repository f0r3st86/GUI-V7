// Custom hook for BorrowerTab state management
// Handles borrower data, validation, delete confirmation, and loan relationships
import { useState, useMemo, useCallback } from 'react';
import { useTheme, useLoan } from '../../../../context';
import {
  validatePhone,
  validateZip,
  validateSSN,
  validateEIN,
  validateDateFormat,
  validateCreditScore
} from '../../../../utils';
import {
  useBorrowers,
  useAddBorrower,
  useUpdateBorrower,
  useDeleteBorrower,
  useLoans
} from '../../../../hooks';
import type { Borrower, DeleteConfirmation } from '../../../../types';
import type { BorrowerFormState } from '../types';

export function useBorrowerForm(): BorrowerFormState | { isLoading: true } | { isLoading: false; selectedBorrower: undefined } {
  const { styles } = useTheme();
  const { currentRelationship, selectedBorrowerId, setSelectedBorrowerId } = useLoan();

  const { data: borrowers, isLoading: loadingBorrowers } = useBorrowers();
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { mutate: addBorrowerMutation } = useAddBorrower();
  const { mutate: updateBorrower } = useUpdateBorrower();
  const { mutate: deleteBorrowerMutation } = useDeleteBorrower();

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    show: false,
    borrowerId: null,
    borrowerName: ''
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const selectedBorrower = useMemo(
    () => borrowers?.find(b => b.id === selectedBorrowerId),
    [borrowers, selectedBorrowerId]
  );

  const relationshipBorrowers = useMemo(
    () => borrowers?.filter(b => b.relationship === currentRelationship) || [],
    [borrowers, currentRelationship]
  );

  const sortedLoans = useMemo(() => loans || [], [loans]);

  const currentBorrowerLoanRelationships = useMemo(
    () => selectedBorrower?.loanRelationships || {},
    [selectedBorrower]
  );

  const selectedLoansStats = useMemo(() => {
    const relationships = currentBorrowerLoanRelationships;
    const selectedCount = Object.values(relationships).filter(r => r?.selected).length;
    const totalLoans = sortedLoans.length;
    const totalExposure = sortedLoans
      .filter(loan => relationships[loan.mwLoanNo]?.selected)
      .reduce((sum, loan) => sum + loan.principal, 0);
    return { selectedCount, totalLoans, totalExposure };
  }, [currentBorrowerLoanRelationships, sortedLoans]);

  // Handlers
  const handleBorrowerFieldChange = useCallback((field: keyof Borrower, value: string) => {
    if (selectedBorrowerId) {
      updateBorrower({ id: selectedBorrowerId, updates: { [field]: value } });
    }
  }, [selectedBorrowerId, updateBorrower]);

  const getInputStyle = useCallback((field: string) => {
    if (validationErrors[field]) return styles.invalidBorder;
    return `${styles.inputBorder}`;
  }, [validationErrors, styles]);

  const handlePhoneChange = useCallback((value: string) => {
    const isValid = validatePhone(value);
    setValidationErrors(prev => ({ ...prev, phone: !isValid }));
    handleBorrowerFieldChange('phone', value);
  }, [handleBorrowerFieldChange]);

  const handleZipChange = useCallback((value: string) => {
    const isValid = validateZip(value);
    setValidationErrors(prev => ({ ...prev, zip: !isValid }));
    handleBorrowerFieldChange('zip', value);
  }, [handleBorrowerFieldChange]);

  const handleSsnEinChange = useCallback((value: string) => {
    const isValidSSN = validateSSN(value);
    const isValidEIN = validateEIN(value);
    const isValid = isValidSSN || isValidEIN || value === '';
    setValidationErrors(prev => ({ ...prev, ssnEin: !isValid }));
    handleBorrowerFieldChange('ssnEin', value);
  }, [handleBorrowerFieldChange]);

  const handleCreditScoreChange = useCallback((value: string) => {
    const isValid = validateCreditScore(value);
    setValidationErrors(prev => ({ ...prev, creditScore: !isValid }));
    handleBorrowerFieldChange('creditScore', value);
  }, [handleBorrowerFieldChange]);

  const handleDateChange = useCallback((field: keyof Borrower, value: string) => {
    const isValid = validateDateFormat(value);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
    handleBorrowerFieldChange(field, value);
  }, [handleBorrowerFieldChange]);

  const addNewBorrower = useCallback(() => {
    const nextId = (!borrowers || borrowers.length === 0) ? 1 : Math.max(...borrowers.map(b => b.id)) + 1;
    const newBorrower: Borrower = {
      id: nextId,
      relationship: currentRelationship,
      name: '', address1: '', address2: '', city: '', state: '', zip: '',
      phone: '', dob: '', ssnEin: '', creditScore: '', creditScoreDate: '',
      bkStatus: 'none', bkChapter: '', bkCourtCase: '', bkCourtLocation: '',
      bkAssets: 'No Assets', type: 'Borrower', loanRelationships: {}
    };
    addBorrowerMutation(newBorrower);
    setSelectedBorrowerId(nextId);
  }, [borrowers, currentRelationship, addBorrowerMutation, setSelectedBorrowerId]);

  const showDeleteConfirmation = useCallback((id: number, name: string) => {
    setDeleteConfirmation({ show: true, borrowerId: id, borrowerName: name });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteConfirmation.borrowerId !== null) {
      const remaining = relationshipBorrowers.filter(b => b.id !== deleteConfirmation.borrowerId);
      deleteBorrowerMutation(deleteConfirmation.borrowerId);
      if (remaining.length > 0) setSelectedBorrowerId(remaining[0].id);
    }
    setDeleteConfirmation({ show: false, borrowerId: null, borrowerName: '' });
  }, [deleteConfirmation.borrowerId, relationshipBorrowers, deleteBorrowerMutation, setSelectedBorrowerId]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmation({ show: false, borrowerId: null, borrowerName: '' });
  }, []);

  const toggleLoanRelationship = useCallback((loanNo: string) => {
    if (!selectedBorrower || !selectedBorrowerId) return;
    const currentRels = selectedBorrower.loanRelationships || {};
    const currentLoanRel = currentRels[loanNo] || { selected: false, role: 'Borrower' };
    updateBorrower({
      id: selectedBorrowerId,
      updates: {
        loanRelationships: { ...currentRels, [loanNo]: { ...currentLoanRel, selected: !currentLoanRel.selected } }
      }
    });
  }, [selectedBorrower, selectedBorrowerId, updateBorrower]);

  const changeLoanRole = useCallback((loanNo: string, role: string) => {
    if (!selectedBorrower || !selectedBorrowerId) return;
    const currentRels = selectedBorrower.loanRelationships || {};
    const currentLoanRel = currentRels[loanNo] || { selected: false, role: 'Borrower' };
    updateBorrower({
      id: selectedBorrowerId,
      updates: {
        loanRelationships: { ...currentRels, [loanNo]: { ...currentLoanRel, role } }
      }
    });
  }, [selectedBorrower, selectedBorrowerId, updateBorrower]);

  if (loadingBorrowers || loadingLoans) {
    return { isLoading: true };
  }

  if (!selectedBorrower) {
    return { isLoading: false, selectedBorrower: undefined };
  }

  return {
    selectedBorrower,
    relationshipBorrowers,
    sortedLoans,
    currentRelationship,
    selectedBorrowerId,
    selectedLoansStats,
    currentBorrowerLoanRelationships,
    deleteConfirmation,
    setSelectedBorrowerId,
    handleBorrowerFieldChange,
    handlePhoneChange,
    handleZipChange,
    handleSsnEinChange,
    handleCreditScoreChange,
    handleDateChange,
    addNewBorrower,
    showDeleteConfirmation,
    confirmDelete,
    cancelDelete,
    toggleLoanRelationship,
    changeLoanRole,
    getInputStyle,
  };
}
