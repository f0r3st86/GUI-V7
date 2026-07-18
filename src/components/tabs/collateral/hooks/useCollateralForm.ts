// Custom hook for CollateralTab state management
// Handles collateral data, debouncing, validation, delete, and loan relationships
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme, useLoan } from '../../../../context';
import { DEBOUNCE_DELAY } from '../../../../data';
import {
  validateCurrency,
  validatePositiveInteger,
  sanitizeCurrency,
  sanitizeNumber
} from '../../../../utils';
import {
  useDebounce,
  useCollateral,
  useCollateralRelationships,
  useAddCollateral,
  useUpdateCollateral,
  useDeleteCollateral,
  useUpdateCollateralRelationships,
  useLoans
} from '../../../../hooks';
import type { Collateral, DeleteCollateralConfirmation } from '../../../../types';
import type { CollateralFormState } from '../types';

export function useCollateralForm(): CollateralFormState | { isLoading: true } | { isLoading: false; selectedCollateral: undefined } {
  const { styles } = useTheme();
  const {
    selectedLoan,
    selectedCollateralId,
    setSelectedCollateralId
  } = useLoan();

  // Delete confirmation is local to this form (same pattern as useBorrowerForm)
  const [deleteCollateralConfirmation, setDeleteCollateralConfirmation] =
    useState<DeleteCollateralConfirmation>({
      show: false,
      collateralId: null,
      collateralDescription: ''
    });

  const { data: collateral, isLoading: loadingCollateral } = useCollateral();
  const { data: collateralLoanRelationships } = useCollateralRelationships();
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { mutate: addCollateralMutation } = useAddCollateral();
  const { mutate: updateCollateral } = useUpdateCollateral();
  const { mutate: deleteCollateralMutation } = useDeleteCollateral();
  const { mutate: updateRelationships } = useUpdateCollateralRelationships();

  const collateralList = useMemo(() => collateral || [], [collateral]);
  const selectedCollateralData = useMemo(
    () => collateralList.find(c => c.id === selectedCollateralId),
    [collateralList, selectedCollateralId]
  );
  const sortedLoans = useMemo(() => loans || [], [loans]);

  const securingLoansStats = useMemo(() => {
    if (!collateralLoanRelationships) {
      return { securingCount: 0, totalLoans: 0, totalSecured: 0 };
    }
    const relationships = collateralLoanRelationships[selectedCollateralId] || {};
    const securingCount = Object.values(relationships).filter(Boolean).length;
    const totalLoans = sortedLoans.length;
    const totalSecured = sortedLoans
      .filter(loan => relationships[loan.mwLoanNo])
      .reduce((sum, loan) => sum + loan.principal, 0);
    return { securingCount, totalLoans, totalSecured };
  }, [collateralLoanRelationships, selectedCollateralId, sortedLoans]);

  // Local debounced state
  const [localListPrice, setLocalListPrice] = useState('');
  const [localAppraisedValue, setLocalAppraisedValue] = useState('');
  const [localOurValue, setLocalOurValue] = useState('');
  const [localBpoValue, setLocalBpoValue] = useState('');
  const [localSqft, setLocalSqft] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const debouncedListPrice = useDebounce(localListPrice, DEBOUNCE_DELAY);
  const debouncedAppraisedValue = useDebounce(localAppraisedValue, DEBOUNCE_DELAY);
  const debouncedOurValue = useDebounce(localOurValue, DEBOUNCE_DELAY);
  const debouncedBpoValue = useDebounce(localBpoValue, DEBOUNCE_DELAY);
  const debouncedSqft = useDebounce(localSqft, DEBOUNCE_DELAY);

  const currentCollateralIdRef = useRef<number | null>(null);

  const handleCollateralFieldChange = useCallback((field: keyof Collateral, value: string) => {
    if (selectedCollateralId) {
      updateCollateral({ id: selectedCollateralId, updates: { [field]: value } });
    }
  }, [selectedCollateralId, updateCollateral]);

  // Initialize local state when collateral changes
  useEffect(() => {
    if (selectedCollateralData) {
      currentCollateralIdRef.current = selectedCollateralData.id;
      setLocalListPrice(selectedCollateralData.listPrice || '');
      setLocalAppraisedValue(selectedCollateralData.appraisedValue || '');
      setLocalOurValue(selectedCollateralData.ourValue || '');
      setLocalBpoValue(selectedCollateralData.bpoValue || '');
      setLocalSqft(selectedCollateralData.sqft || '');
    }
  }, [selectedCollateralId, selectedCollateralData]);

  // Sync debounced values
  useEffect(() => {
    if (debouncedListPrice !== undefined && selectedCollateralData &&
        currentCollateralIdRef.current === selectedCollateralData.id &&
        debouncedListPrice !== selectedCollateralData.listPrice) {
      handleCollateralFieldChange('listPrice', debouncedListPrice);
    }
  }, [debouncedListPrice, selectedCollateralData, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedAppraisedValue !== undefined && selectedCollateralData &&
        currentCollateralIdRef.current === selectedCollateralData.id &&
        debouncedAppraisedValue !== selectedCollateralData.appraisedValue) {
      handleCollateralFieldChange('appraisedValue', debouncedAppraisedValue);
    }
  }, [debouncedAppraisedValue, selectedCollateralData, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedOurValue !== undefined && selectedCollateralData &&
        currentCollateralIdRef.current === selectedCollateralData.id &&
        debouncedOurValue !== selectedCollateralData.ourValue) {
      handleCollateralFieldChange('ourValue', debouncedOurValue);
    }
  }, [debouncedOurValue, selectedCollateralData, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedBpoValue !== undefined && selectedCollateralData &&
        currentCollateralIdRef.current === selectedCollateralData.id &&
        debouncedBpoValue !== selectedCollateralData.bpoValue) {
      handleCollateralFieldChange('bpoValue', debouncedBpoValue);
    }
  }, [debouncedBpoValue, selectedCollateralData, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedSqft !== undefined && selectedCollateralData &&
        currentCollateralIdRef.current === selectedCollateralData.id &&
        debouncedSqft !== selectedCollateralData.sqft) {
      handleCollateralFieldChange('sqft', debouncedSqft);
    }
  }, [debouncedSqft, selectedCollateralData, handleCollateralFieldChange]);

  // Validation handlers
  const getInputStyle = useCallback((field: string) => {
    if (validationErrors[field]) return styles.invalidBorder;
    return `${styles.inputBorder}`;
  }, [validationErrors, styles]);

  const handleCurrencyChange = useCallback((field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const sanitized = sanitizeCurrency(value);
    const isValid = validateCurrency(sanitized);
    setter(sanitized);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
  }, []);

  const handleIntegerChange = useCallback((field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const sanitized = sanitizeNumber(value, 0);
    const isValid = validatePositiveInteger(sanitized, 0);
    setter(sanitized);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
  }, []);

  // Action handlers
  const getNextCollateralId = useCallback(() => {
    if (collateralList.length === 0) return 1;
    return Math.max(...collateralList.map(c => c.id)) + 1;
  }, [collateralList]);

  const addNewCollateral = useCallback(() => {
    const newId = getNextCollateralId();
    const newCollateral: Collateral = {
      id: newId, loanNo: selectedLoan, collateralCode: '', description: '',
      address1: '', city: '', state: '', zip: '', county: '', parcelId: '',
      taxes: '', delinquentTaxes: '', taxAssessedValue: '', taxMarketValue: '',
      sellerLienPosition: '', sellerLienAmount: '', titleLienPosition: '', titleLienAmount: '',
      listPrice: '', daysOnMarket: '', appraisedValue: '', appraisedDate: '',
      ourValue: '', ourValueDate: '', bpoValue: '', bpoDate: '',
      sqft: '', acres: '', yearBuilt: '', units: ''
    };
    addCollateralMutation(newCollateral, {
      onSuccess: () => {
        const newRelationships = {
          ...collateralLoanRelationships,
          [newId]: { [selectedLoan]: true }
        };
        updateRelationships(newRelationships);
        setSelectedCollateralId(newId);
      }
    });
  }, [getNextCollateralId, selectedLoan, addCollateralMutation, collateralLoanRelationships, updateRelationships, setSelectedCollateralId]);

  const toggleCollateralLoanRelationship = useCallback((loanNo: string) => {
    if (!collateralLoanRelationships) return;
    const updatedRelationships = {
      ...collateralLoanRelationships,
      [selectedCollateralId]: {
        ...(collateralLoanRelationships[selectedCollateralId] || {}),
        [loanNo]: !(collateralLoanRelationships[selectedCollateralId]?.[loanNo])
      }
    };
    updateRelationships(updatedRelationships);
  }, [collateralLoanRelationships, selectedCollateralId, updateRelationships]);

  const showDeleteConfirmation = useCallback((id: number, description: string) => {
    setDeleteCollateralConfirmation({ show: true, collateralId: id, collateralDescription: description });
  }, [setDeleteCollateralConfirmation]);

  const confirmDelete = useCallback(() => {
    if (deleteCollateralConfirmation.collateralId !== null) {
      const idToDelete = deleteCollateralConfirmation.collateralId;
      deleteCollateralMutation(idToDelete, {
        onSuccess: () => {
          const remaining = collateralList.filter(c => c.id !== idToDelete);
          if (remaining.length > 0) setSelectedCollateralId(remaining[0].id);
        }
      });
    }
    setDeleteCollateralConfirmation({ show: false, collateralId: null, collateralDescription: '' });
  }, [deleteCollateralConfirmation.collateralId, collateralList, deleteCollateralMutation, setSelectedCollateralId, setDeleteCollateralConfirmation]);

  const cancelDelete = useCallback(() => {
    setDeleteCollateralConfirmation({ show: false, collateralId: null, collateralDescription: '' });
  }, [setDeleteCollateralConfirmation]);

  if (loadingCollateral || loadingLoans) {
    return { isLoading: true };
  }

  if (!selectedCollateralData) {
    return { isLoading: false, selectedCollateral: undefined };
  }

  return {
    selectedCollateral: selectedCollateralData,
    collateralList,
    sortedLoans,
    selectedLoan,
    selectedCollateralId,
    securingLoansStats,
    collateralLoanRelationships,
    localListPrice, localAppraisedValue, localOurValue, localBpoValue, localSqft,
    setLocalListPrice, setLocalAppraisedValue, setLocalOurValue, setLocalBpoValue, setLocalSqft,
    deleteConfirmation: deleteCollateralConfirmation,
    setSelectedCollateralId,
    handleCollateralFieldChange,
    handleCurrencyChange,
    handleIntegerChange,
    addNewCollateral,
    showDeleteConfirmation,
    confirmDelete,
    cancelDelete,
    toggleCollateralLoanRelationship,
    getInputStyle,
  };
}
