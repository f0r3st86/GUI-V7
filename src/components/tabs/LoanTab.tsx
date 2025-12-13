// LoanTab component - displays loan details in 5-column grid layout
import React, { useState, useEffect, useMemo } from 'react';
import { useTheme, useLoan } from '../../context';
import { US_STATES } from '../../data';
import {
  calculateInterestAccrued,
  calculateMonthsToMaturity,
  calculateAmortizationMonths,
  validateCurrency,
  validateInterestRate,
  validateDateFormat,
  validateZip,
  sanitizeCurrency,
  sanitizeNumber
} from '../../utils';
import { useDebounce, useLoans, useUpdateLoan } from '../../hooks';

export const LoanTab = React.memo(() => {
  const { styles } = useTheme();

  // Get selectedLoan from Context (UI state - which loan is selected)
  const { selectedLoan } = useLoan();

  // Get loans data from React Query (replaces Context data)
  const { data: loans, isLoading } = useLoans();

  // Get update mutation from React Query (replaces handleLoanFieldChange)
  const { mutate: updateLoan } = useUpdateLoan();

  // Find the currently selected loan from React Query data
  const selectedLoanData = useMemo(
    () => loans?.find(loan => loan.mwLoanNo === selectedLoan),
    [loans, selectedLoan]
  );

  // Helper to update loan field (replaces handleLoanFieldChange)
  const handleLoanFieldChange = React.useCallback((field: string, value: string | number) => {
    if (selectedLoan) {
      updateLoan({
        mwLoanNo: selectedLoan,
        updates: { [field]: value }
      });
    }
  }, [selectedLoan, updateLoan]);

  // Local state for debounced inputs (to prevent lag during typing)
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

  // Validation state (track invalid inputs)
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Debounce expensive calculation inputs (500ms delay)
  const debouncedPrincipal = useDebounce(localPrincipal, 500);
  const debouncedInterest = useDebounce(localInterest, 500);
  const debouncedOrigBalance = useDebounce(localOrigBalance, 500);
  const debouncedEscrow = useDebounce(localEscrow, 500);
  const debouncedOther = useDebounce(localOther, 500);
  const debouncedPmt = useDebounce(localPmt, 500);
  const debouncedEscPmt = useDebounce(localEscPmt, 500);
  const debouncedIntRate = useDebounce(localIntRate, 500);
  const debouncedDRate = useDebounce(localDRate, 500);
  const debouncedFloor = useDebounce(localFloor, 500);
  const debouncedCeiling = useDebounce(localCeiling, 500);
  const debouncedMargin = useDebounce(localMargin, 500);

  // Track the current loan ID to prevent stale updates
  const currentLoanIdRef = React.useRef<string | null>(null);

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

  // Update context when debounced values change
  // FIXED: Added missing dependencies and loan ID check to prevent stale closure bugs
  useEffect(() => {
    if (debouncedPrincipal && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedPrincipal) || 0;
      if (value !== selectedLoanData.principal) {
        handleLoanFieldChange('principal', value);
      }
    }
  }, [debouncedPrincipal, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedInterest && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedInterest) || 0;
      if (value !== selectedLoanData.interest) {
        handleLoanFieldChange('interest', value);
      }
    }
  }, [debouncedInterest, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedOrigBalance && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedOrigBalance) || 0;
      if (value !== selectedLoanData.origBalance) {
        handleLoanFieldChange('origBalance', value);
      }
    }
  }, [debouncedOrigBalance, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedEscrow && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedEscrow) || 0;
      if (value !== selectedLoanData.escrowBalance) {
        handleLoanFieldChange('escrowBalance', value);
      }
    }
  }, [debouncedEscrow, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedOther && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedOther) || 0;
      if (value !== selectedLoanData.otherBalance) {
        handleLoanFieldChange('otherBalance', value);
      }
    }
  }, [debouncedOther, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedPmt && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedPmt) || 0;
      if (value !== selectedLoanData.pmt) {
        handleLoanFieldChange('pmt', value);
      }
    }
  }, [debouncedPmt, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedEscPmt && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedEscPmt) || 0;
      if (value !== selectedLoanData.escPmt) {
        handleLoanFieldChange('escPmt', value);
      }
    }
  }, [debouncedEscPmt, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedIntRate && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedIntRate) || 0;
      if (value !== selectedLoanData.intRate) {
        handleLoanFieldChange('intRate', value);
      }
    }
  }, [debouncedIntRate, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedDRate && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      const value = parseFloat(debouncedDRate) || 0;
      if (value !== selectedLoanData.dRate) {
        handleLoanFieldChange('dRate', value);
      }
    }
  }, [debouncedDRate, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedFloor !== undefined && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      if (debouncedFloor !== selectedLoanData.floor) {
        handleLoanFieldChange('floor', debouncedFloor);
      }
    }
  }, [debouncedFloor, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedCeiling !== undefined && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      if (debouncedCeiling !== selectedLoanData.ceiling) {
        handleLoanFieldChange('ceiling', debouncedCeiling);
      }
    }
  }, [debouncedCeiling, selectedLoanData, handleLoanFieldChange]);

  useEffect(() => {
    if (debouncedMargin !== undefined && selectedLoanData && currentLoanIdRef.current === selectedLoanData.mwLoanNo) {
      if (debouncedMargin !== selectedLoanData.margin) {
        handleLoanFieldChange('margin', debouncedMargin);
      }
    }
  }, [debouncedMargin, selectedLoanData, handleLoanFieldChange]);

  // Helper: Handle currency input with validation
  const handleCurrencyChange = (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const sanitized = sanitizeCurrency(value);
    const isValid = validateCurrency(sanitized);

    setter(sanitized);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
  };

  // Helper: Handle rate/percentage input with validation
  const handleRateChange = (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const sanitized = sanitizeNumber(value, 3); // Allow 3 decimals for rates
    const isValid = validateInterestRate(sanitized);

    setter(sanitized);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
  };

  // Helper: Handle date input with validation
  const handleDateChange = (field: string, value: string) => {
    const isValid = validateDateFormat(value);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
    handleLoanFieldChange(field, value);
  };

  // Helper: Handle zip code with validation
  const handleZipChange = (value: string) => {
    const isValid = validateZip(value);
    setValidationErrors(prev => ({ ...prev, zip: !isValid }));
    handleLoanFieldChange('zip', value);
  };

  // Helper: Get input border style (red if invalid)
  const getInputStyle = (field: string) => {
    if (validationErrors[field]) {
      return 'border-red-500';
    }
    return `${styles.inputBorder}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

  // Show no loan selected
  if (!selectedLoanData) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>No loan selected</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Main 5-column grid for loan tab */}
      <div className="grid grid-cols-5 gap-4">
        {/* Column 1: Loan Info */}
        <div className="space-y-3">
          <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>MW Loan #:</label>
                <input
                  type="text"
                  value={selectedLoanData.mwLoanNo}
                  readOnly
                  className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none cursor-not-allowed`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Borrower:</label>
                <input
                  type="text"
                  value={selectedLoanData.borrowerName}
                  onChange={(e) => handleLoanFieldChange('borrowerName', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Relationship:</label>
                <input
                  type="text"
                  value={selectedLoanData.relatedLoans}
                  onChange={(e) => handleLoanFieldChange('relatedLoans', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Pool:</label>
                <input
                  type="text"
                  value={selectedLoanData.pool || ''}
                  onChange={(e) => handleLoanFieldChange('pool', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Status:</label>
                <select
                  value={selectedLoanData.status || ''}
                  onChange={(e) => handleLoanFieldChange('status', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                >
                  <option value="">Select</option>
                  <option value="PA">PA - Performing Asset</option>
                  <option value="FA">FA - Fully Performing</option>
                  <option value="FC">FC - Foreclosure</option>
                  <option value="JG">JG - Judgment</option>
                  <option value="LT">LT - Litigation</option>
                  <option value="BK">BK - Bankruptcy</option>
                  <option value="REO">REO - Real Estate Owned</option>
                </select>
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Last Import:</label>
                <input
                  type="text"
                  value={selectedLoanData.lastImportDate || ''}
                  onChange={(e) => handleDateChange('lastImportDate', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${getInputStyle('lastImportDate')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Balances */}
        <div className="space-y-3">
          <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Orig Balance:</label>
                <input
                  type="text"
                  value={localOrigBalance}
                  onChange={(e) => handleCurrencyChange('origBalance', e.target.value, setLocalOrigBalance)}
                  className={`${styles.inputBg} ${getInputStyle('origBalance')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Principal:</label>
                <input
                  type="text"
                  value={localPrincipal}
                  onChange={(e) => handleCurrencyChange('principal', e.target.value, setLocalPrincipal)}
                  className={`${styles.inputBg} ${getInputStyle('principal')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Interest:</label>
                <input
                  type="text"
                  value={localInterest}
                  onChange={(e) => handleCurrencyChange('interest', e.target.value, setLocalInterest)}
                  className={`${styles.inputBg} ${getInputStyle('interest')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Escrow:</label>
                <input
                  type="text"
                  value={localEscrow}
                  onChange={(e) => handleCurrencyChange('escrow', e.target.value, setLocalEscrow)}
                  className={`${styles.inputBg} ${getInputStyle('escrow')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Other:</label>
                <input
                  type="text"
                  value={localOther}
                  onChange={(e) => handleCurrencyChange('other', e.target.value, setLocalOther)}
                  className={`${styles.inputBg} ${getInputStyle('other')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Total Balance:</label>
                <input
                  type="text"
                  value={'$' + (selectedLoanData.principal + selectedLoanData.interest + selectedLoanData.escrowBalance + selectedLoanData.otherBalance).toLocaleString()}
                  className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textGreen} font-medium focus:outline-none cursor-not-allowed`}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Rates and Payment */}
        <div className="space-y-3">
          <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Int Rate:</label>
                <input
                  type="text"
                  value={localIntRate}
                  onChange={(e) => handleRateChange('intRate', e.target.value, setLocalIntRate)}
                  className={`${styles.inputBg} ${getInputStyle('intRate')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Default Rate:</label>
                <input
                  type="text"
                  value={localDRate}
                  onChange={(e) => handleRateChange('dRate', e.target.value, setLocalDRate)}
                  className={`${styles.inputBg} ${getInputStyle('dRate')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Payment:</label>
                <input
                  type="text"
                  value={localPmt}
                  onChange={(e) => handleCurrencyChange('pmt', e.target.value, setLocalPmt)}
                  className={`${styles.inputBg} ${getInputStyle('pmt')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Escrow Pmt:</label>
                <input
                  type="text"
                  value={localEscPmt}
                  onChange={(e) => handleCurrencyChange('escPmt', e.target.value, setLocalEscPmt)}
                  className={`${styles.inputBg} ${getInputStyle('escPmt')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Pmt Freq:</label>
                <select
                  value={selectedLoanData.pmtFreq}
                  onChange={(e) => handleLoanFieldChange('pmtFreq', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                >
                  <option value="M">M</option>
                  <option value="Q">Q</option>
                  <option value="SA">SA</option>
                  <option value="A">A</option>
                </select>
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Unfunded Commitment:</label>
                <input
                  type="text"
                  value={selectedLoanData.unfundedCommitment || ''}
                  onChange={(e) => handleLoanFieldChange('unfundedCommitment', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Dates */}
        <div className="space-y-3">
          <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Not Due:</label>
                <input
                  type="text"
                  value={selectedLoanData.notDue || ''}
                  onChange={(e) => handleDateChange('notDue', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${getInputStyle('notDue')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Last PMT:</label>
                <input
                  type="text"
                  value={selectedLoanData.lastPmt || ''}
                  onChange={(e) => handleDateChange('lastPmt', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${getInputStyle('lastPmt')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Orig Dt:</label>
                <input
                  type="text"
                  value={selectedLoanData.origDt || ''}
                  onChange={(e) => handleDateChange('origDt', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${getInputStyle('origDt')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Mat Dt:</label>
                <input
                  type="text"
                  value={selectedLoanData.matDt || ''}
                  onChange={(e) => handleDateChange('matDt', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${getInputStyle('matDt')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Acc Dt:</label>
                <input
                  type="text"
                  value={selectedLoanData.accDt || ''}
                  onChange={(e) => handleDateChange('accDt', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${getInputStyle('accDt')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Due Dt:</label>
                <input
                  type="text"
                  value={selectedLoanData.dueDt || ''}
                  onChange={(e) => handleDateChange('dueDt', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${getInputStyle('dueDt')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 5: Address and Additional Info */}
        <div className="space-y-3">
          <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 1:</label>
                <input
                  type="text"
                  value={selectedLoanData.address1 || ''}
                  onChange={(e) => handleLoanFieldChange('address1', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 2:</label>
                <input
                  type="text"
                  value={selectedLoanData.address2 || ''}
                  onChange={(e) => handleLoanFieldChange('address2', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>City:</label>
                <input
                  type="text"
                  value={selectedLoanData.city || ''}
                  onChange={(e) => handleLoanFieldChange('city', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>State:</label>
                  <select
                    value={selectedLoanData.state || ''}
                    onChange={(e) => handleLoanFieldChange('state', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  >
                    {US_STATES.map(state => (
                      <option key={state.code} value={state.code}>{state.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Zip:</label>
                  <input
                    type="text"
                    value={selectedLoanData.zip || ''}
                    onChange={(e) => handleZipChange(e.target.value)}
                    placeholder="12345"
                    maxLength={10}
                    className={`${styles.inputBg} ${getInputStyle('zip')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Rate Type, Loan Type, Calculated Fields */}
      <div className="mt-4 space-y-3">
        {/* Rate Type Information */}
        <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
          <div className="grid grid-cols-7 gap-3">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Rate Type:</label>
              <select
                value={selectedLoanData.rateType || ''}
                onChange={(e) => handleLoanFieldChange('rateType', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              >
                <option value="">Select</option>
                <option value="Fixed">Fixed</option>
                <option value="Variable">Variable</option>
                <option value="Adjustable">Adjustable</option>
              </select>
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Floor:</label>
              <input
                type="text"
                value={localFloor}
                onChange={(e) => handleRateChange('floor', e.target.value, setLocalFloor)}
                placeholder="0.000"
                className={`${styles.inputBg} ${getInputStyle('floor')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Ceiling:</label>
              <input
                type="text"
                value={localCeiling}
                onChange={(e) => handleRateChange('ceiling', e.target.value, setLocalCeiling)}
                placeholder="0.000"
                className={`${styles.inputBg} ${getInputStyle('ceiling')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Margin:</label>
              <input
                type="text"
                value={localMargin}
                onChange={(e) => handleRateChange('margin', e.target.value, setLocalMargin)}
                placeholder="0.000"
                className={`${styles.inputBg} ${getInputStyle('margin')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>ChDt:</label>
              <input
                type="text"
                value={selectedLoanData.chDt || ''}
                onChange={(e) => handleDateChange('chDt', e.target.value)}
                placeholder="MM/DD/YY"
                className={`${styles.inputBg} ${getInputStyle('chDt')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>ChFrq:</label>
              <input
                type="text"
                value={selectedLoanData.chFrq || ''}
                onChange={(e) => handleLoanFieldChange('chFrq', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Index:</label>
              <select
                value={selectedLoanData.rateIndex || ''}
                onChange={(e) => handleLoanFieldChange('rateIndex', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              >
                <option value=""></option>
                <option value="LIBOR">LIBOR</option>
                <option value="SOFR">SOFR</option>
                <option value="Prime">Prime</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loan Type Information - 3 columns with empty space */}
        <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Ah/Bhd:</label>
              <input
                type="text"
                value={selectedLoanData.ahBhd || ''}
                onChange={(e) => handleLoanFieldChange('ahBhd', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>AssetType:</label>
              <select
                value={selectedLoanData.assetType || ''}
                onChange={(e) => handleLoanFieldChange('assetType', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              >
                <option value=""></option>
                <option value="Commercial RE">Commercial RE</option>
                <option value="Residential">Residential</option>
                <option value="Multi-family">Multi-family</option>
                <option value="Land">Land</option>
                <option value="Construction">Construction</option>
              </select>
            </div>
            <div>
              {/* Empty cell for consistent 3-column layout */}
            </div>
          </div>
        </div>

        {/* Calculated Fields - Local calculations, not stored in database */}
        <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Months Interest Accrued:</label>
              <input
                type="text"
                value={calculateInterestAccrued(selectedLoanData.interest, selectedLoanData.principal, selectedLoanData.intRate)}
                className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                readOnly
                title="Interest Balance / (Principal Balance x (Rate/12))"
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Months to Maturity:</label>
              <input
                type="text"
                value={selectedLoanData.matDt ? calculateMonthsToMaturity(selectedLoanData.matDt) : '0'}
                className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                readOnly
                title="Calculated from Today to Maturity Date"
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Months to Amortization:</label>
              <input
                type="text"
                value={calculateAmortizationMonths(selectedLoanData.principal, selectedLoanData.pmt, selectedLoanData.intRate)}
                className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                readOnly
                title="NPER calculation: Months to pay off principal at current payment rate"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
