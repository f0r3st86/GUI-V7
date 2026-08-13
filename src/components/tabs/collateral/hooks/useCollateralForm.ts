// Custom hook for CollateralTab state management
// Production model: collateral keyed by mwPropertyNo, linked to the
// RELATIONSHIP via relatedLoans (primary) and optionally to one loan
// via loanNo (secondary). See docs/UI-DATA-BINDINGS.md.
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
  useAddCollateral,
  useUpdateCollateral,
  useDeleteCollateral,
  useLoans
} from '../../../../hooks';
import type { Collateral, DeleteCollateralConfirmation } from '../../../../types';
import type { CollateralFormState } from '../types';

export function useCollateralForm(): CollateralFormState | { isLoading: true } | { isLoading: false; selectedCollateral: undefined } {
  const { styles } = useTheme();
  const {
    selectedLoan,
    currentRelationship,
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
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { mutate: addCollateralMutation } = useAddCollateral();
  const { mutate: updateCollateral } = useUpdateCollateral();
  const { mutate: deleteCollateralMutation } = useDeleteCollateral();

  // Collateral belongs to the relationship (production linkage rule)
  const collateralList = useMemo(
    () => (collateral || []).filter(c => c.relatedLoans === currentRelationship),
    [collateral, currentRelationship]
  );
  const selectedCollateralData = useMemo(
    () => collateralList.find(c => c.mwPropertyNo === selectedCollateralId),
    [collateralList, selectedCollateralId]
  );
  // Relationship loans, principal descending (workbook grid contract)
  const sortedLoans = useMemo(
    () => (loans || [])
      .filter(l => l.relatedLoans === currentRelationship)
      .sort((a, b) => (b.principal || 0) - (a.principal || 0)),
    [loans, currentRelationship]
  );

  // Stats for the linkage panel: the linked loan + relationship totals
  const securingLoansStats = useMemo(() => {
    const linked = sortedLoans.find(l => l.mwLoanNo === selectedCollateralData?.loanNo);
    return {
      securingCount: linked ? 1 : 0,
      totalLoans: sortedLoans.length,
      totalSecured: linked ? linked.principal : 0
    };
  }, [sortedLoans, selectedCollateralData]);

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
      updateCollateral({ mwPropertyNo: selectedCollateralId, updates: { [field]: value } });
    }
  }, [selectedCollateralId, updateCollateral]);

  // Initialize local state when collateral changes
  useEffect(() => {
    if (selectedCollateralData) {
      currentCollateralIdRef.current = selectedCollateralData.mwPropertyNo;
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
        currentCollateralIdRef.current === selectedCollateralData.mwPropertyNo &&
        debouncedListPrice !== selectedCollateralData.listPrice) {
      handleCollateralFieldChange('listPrice', debouncedListPrice);
    }
  }, [debouncedListPrice, selectedCollateralData, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedAppraisedValue !== undefined && selectedCollateralData &&
        currentCollateralIdRef.current === selectedCollateralData.mwPropertyNo &&
        debouncedAppraisedValue !== selectedCollateralData.appraisedValue) {
      handleCollateralFieldChange('appraisedValue', debouncedAppraisedValue);
    }
  }, [debouncedAppraisedValue, selectedCollateralData, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedOurValue !== undefined && selectedCollateralData &&
        currentCollateralIdRef.current === selectedCollateralData.mwPropertyNo &&
        debouncedOurValue !== selectedCollateralData.ourValue) {
      handleCollateralFieldChange('ourValue', debouncedOurValue);
    }
  }, [debouncedOurValue, selectedCollateralData, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedBpoValue !== undefined && selectedCollateralData &&
        currentCollateralIdRef.current === selectedCollateralData.mwPropertyNo &&
        debouncedBpoValue !== selectedCollateralData.bpoValue) {
      handleCollateralFieldChange('bpoValue', debouncedBpoValue);
    }
  }, [debouncedBpoValue, selectedCollateralData, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedSqft !== undefined && selectedCollateralData &&
        currentCollateralIdRef.current === selectedCollateralData.mwPropertyNo &&
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
  const addNewCollateral = useCallback(() => {
    const newCollateral: Omit<Collateral, 'mwPropertyNo'> = {
      relatedLoans: currentRelationship, loanNo: selectedLoan,
      collateralCode: '', description: '',
      address1: '', city: '', state: '', zip: '', county: '', parcelId: '',
      taxes: '', delinquentTaxes: '', taxAssessedValue: '', taxMarketValue: '',
      sellerLienPosition: '', sellerLienAmount: '', titleLienPosition: '', titleLienAmount: '',
      listPrice: '', daysOnMarket: '', appraisedValue: '', appraisedDate: '',
      ourValue: '', ourValueDate: '', bpoValue: '', bpoDate: '',
      sqft: '', acres: '', yearBuilt: '', units: ''
    };
    addCollateralMutation(newCollateral, {
      onSuccess: (created) => {
        // Server assigned the key
        setSelectedCollateralId(created.mwPropertyNo);
      }
    });
  }, [currentRelationship, selectedLoan, addCollateralMutation, setSelectedCollateralId]);

  // Set (or clear) the secondary loan link — production single-loan model
  const setLinkedLoan = useCallback((loanNo: string) => {
    if (!selectedCollateralId) return;
    updateCollateral({ mwPropertyNo: selectedCollateralId, updates: { loanNo } });
  }, [selectedCollateralId, updateCollateral]);

  const showDeleteConfirmation = useCallback((mwPropertyNo: number, description: string) => {
    setDeleteCollateralConfirmation({ show: true, collateralId: mwPropertyNo, collateralDescription: description });
  }, [setDeleteCollateralConfirmation]);

  const confirmDelete = useCallback(() => {
    if (deleteCollateralConfirmation.collateralId !== null) {
      const keyToDelete = deleteCollateralConfirmation.collateralId;
      deleteCollateralMutation(keyToDelete, {
        onSuccess: () => {
          const remaining = collateralList.filter(c => c.mwPropertyNo !== keyToDelete);
          if (remaining.length > 0) setSelectedCollateralId(remaining[0].mwPropertyNo);
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
    setLinkedLoan,
    getInputStyle,
  };
}
