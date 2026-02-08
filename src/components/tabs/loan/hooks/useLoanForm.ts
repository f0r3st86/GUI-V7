// Custom hook for LoanTab form state management
// Handles local state, debouncing, validation, and sync effects
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLoan } from '../../../../context';
import { DEBOUNCE_DELAY } from '../../../../data';
import {
  validateCurrency,
  validateInterestRate,
  validateDateFormat,
  validateZip,
  sanitizeCurrency,
  sanitizeNumber
} from '../../../../utils';
import { useDebounce, useLoans, useUpdateLoan } from '../../../../hooks';
import { useTheme } from '../../../../context';
import type { LoanFormState } from '../types';

export function useLoanForm(): LoanFormState | { isLoading: true; selectedLoanData: undefined } | { isLoading: false; selectedLoanData: undefined } {
  const { styles } = useTheme();
  const { selectedLoan } = useLoan();
  const { data: loans, isLoading } = useLoans();
  const { mutate: updateLoan } = useUpdateLoan();

  const selectedLoanData = useMemo(
    () => loans?.find(loan => loan.mwLoanNo === selectedLoan),
    [loans, selectedLoan]
  );

  const handleLoanFieldChange = useCallback((field: string, value: string | number) => {
    if (selectedLoan) {
      updateLoan({
        mwLoanNo: selectedLoan,
        updates: { [field]: value }
      });
    }
  }, [selectedLoan, updateLoan]);

  // Local state for debounced inputs
  const [localPrincipal, setLocalPrincipal] = useState('');
  const [localInterest, setLocalInterest] = useState('');
  const [localOrigBalance, setLocalOrigBalance] = useState('');
  const [localEscrow, setLocalEscrow] = useState('');
  const [localOther, setLocalOther] = useState('');
  const [localPmt, setLocalPmt] = useState('');
  const [localEscPmt, setLocalEscPmt] = useState('');
  const [localIntRate, setLocalIntRate] = useState('');
  const [localDRate, setLocalDRate] = useState('');
  const [localFloor, setLocalFloor] = useState('');
  const [localCeiling, setLocalCeiling] = useState('');
  const [localMargin, setLocalMargin] = useState('');

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Debounced values
  const debouncedPrincipal = useDebounce(localPrincipal, DEBOUNCE_DELAY);
  const debouncedInterest = useDebounce(localInterest, DEBOUNCE_DELAY);
  const debouncedOrigBalance = useDebounce(localOrigBalance, DEBOUNCE_DELAY);
  const debouncedEscrow = useDebounce(localEscrow, DEBOUNCE_DELAY);
  const debouncedOther = useDebounce(localOther, DEBOUNCE_DELAY);
  const debouncedPmt = useDebounce(localPmt, DEBOUNCE_DELAY);
  const debouncedEscPmt = useDebounce(localEscPmt, DEBOUNCE_DELAY);
  const debouncedIntRate = useDebounce(localIntRate, DEBOUNCE_DELAY);
  const debouncedDRate = useDebounce(localDRate, DEBOUNCE_DELAY);
  const debouncedFloor = useDebounce(localFloor, DEBOUNCE_DELAY);
  const debouncedCeiling = useDebounce(localCeiling, DEBOUNCE_DELAY);
  const debouncedMargin = useDebounce(localMargin, DEBOUNCE_DELAY);

  // Track the current loan ID to prevent stale updates
  const currentLoanIdRef = useRef<string | null>(null);

  // Initialize local state from selectedLoanData when loan changes
  useEffect(() => {
    if (selectedLoanData) {
      currentLoanIdRef.current = selectedLoanData.mwLoanNo;
      setLocalPrincipal(selectedLoanData.principal.toString());
      setLocalInterest(selectedLoanData.interest.toString());
      setLocalOrigBalance(selectedLoanData.origBalance.toString());
      setLocalEscrow(selectedLoanData.escrowBalance.toString());
      setLocalOther(selectedLoanData.otherBalance.toString());
      setLocalPmt(selectedLoanData.pmt.toString());
      setLocalEscPmt(selectedLoanData.escPmt.toString());
      setLocalIntRate(selectedLoanData.intRate.toString());
      setLocalDRate(selectedLoanData.dRate.toString());
      setLocalFloor(selectedLoanData.floor || '');
      setLocalCeiling(selectedLoanData.ceiling || '');
      setLocalMargin(selectedLoanData.margin || '');
    }
  }, [selectedLoanData?.mwLoanNo]); // Only re-init when loan changes

  // Sync debounced values back to context
  useEffect(() => {
    if (debouncedPrincipal && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedPrincipal) || 0;
      if (value !== selectedLoanData.principal) handleLoanFieldChange('principal', value);
    }
  }, [debouncedPrincipal, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedInterest && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedInterest) || 0;
      if (value !== selectedLoanData.interest) handleLoanFieldChange('interest', value);
    }
  }, [debouncedInterest, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedOrigBalance && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedOrigBalance) || 0;
      if (value !== selectedLoanData.origBalance) handleLoanFieldChange('origBalance', value);
    }
  }, [debouncedOrigBalance, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedEscrow && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedEscrow) || 0;
      if (value !== selectedLoanData.escrowBalance) handleLoanFieldChange('escrowBalance', value);
    }
  }, [debouncedEscrow, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedOther && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedOther) || 0;
      if (value !== selectedLoanData.otherBalance) handleLoanFieldChange('otherBalance', value);
    }
  }, [debouncedOther, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedPmt && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedPmt) || 0;
      if (value !== selectedLoanData.pmt) handleLoanFieldChange('pmt', value);
    }
  }, [debouncedPmt, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedEscPmt && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedEscPmt) || 0;
      if (value !== selectedLoanData.escPmt) handleLoanFieldChange('escPmt', value);
    }
  }, [debouncedEscPmt, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedIntRate && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedIntRate) || 0;
      if (value !== selectedLoanData.intRate) handleLoanFieldChange('intRate', value);
    }
  }, [debouncedIntRate, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedDRate && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedDRate) || 0;
      if (value !== selectedLoanData.dRate) handleLoanFieldChange('dRate', value);
    }
  }, [debouncedDRate, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedFloor !== undefined && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      if (debouncedFloor !== selectedLoanData.floor) handleLoanFieldChange('floor', debouncedFloor);
    }
  }, [debouncedFloor, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedCeiling !== undefined && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      if (debouncedCeiling !== selectedLoanData.ceiling) handleLoanFieldChange('ceiling', debouncedCeiling);
    }
  }, [debouncedCeiling, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedMargin !== undefined && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      if (debouncedMargin !== selectedLoanData.margin) handleLoanFieldChange('margin', debouncedMargin);
    }
  }, [debouncedMargin, selectedLoanData, handleLoanFieldChange]);

  // Input handlers with validation
  const handleCurrencyChange = useCallback((field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const sanitized = sanitizeCurrency(value);
    const isValid = validateCurrency(sanitized);
    setter(sanitized);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
  }, []);

  const handleRateChange = useCallback((field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const sanitized = sanitizeNumber(value, 3);
    const isValid = validateInterestRate(sanitized);
    setter(sanitized);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
  }, []);

  const handleDateChange = useCallback((field: string, value: string) => {
    const isValid = validateDateFormat(value);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
    handleLoanFieldChange(field, value);
  }, [handleLoanFieldChange]);

  const handleZipChange = useCallback((value: string) => {
    const isValid = validateZip(value);
    setValidationErrors(prev => ({ ...prev, zip: !isValid }));
    handleLoanFieldChange('zip', value);
  }, [handleLoanFieldChange]);

  const getInputStyle = useCallback((field: string) => {
    if (validationErrors[field]) {
      return styles.invalidBorder;
    }
    return `${styles.inputBorder}`;
  }, [validationErrors, styles]);

  if (isLoading) {
    return { isLoading: true, selectedLoanData: undefined };
  }

  if (!selectedLoanData) {
    return { isLoading: false, selectedLoanData: undefined };
  }

  return {
    selectedLoanData,
    isLoading: false,
    localPrincipal, localInterest, localOrigBalance, localEscrow, localOther,
    localPmt, localEscPmt, localIntRate, localDRate, localFloor, localCeiling, localMargin,
    setLocalPrincipal, setLocalInterest, setLocalOrigBalance, setLocalEscrow, setLocalOther,
    setLocalPmt, setLocalEscPmt, setLocalIntRate, setLocalDRate, setLocalFloor, setLocalCeiling, setLocalMargin,
    handleLoanFieldChange, handleCurrencyChange, handleRateChange, handleDateChange, handleZipChange,
    getInputStyle,
  };
}
