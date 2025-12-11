// ProjectionsTab component - cash flow projections and exit scenarios
import React, { useMemo, useCallback } from 'react';
import { useTheme, useLoan, useProjection, useExit } from '../../context';
import { PAYMENT_METHODS, RATE_METHODS, EXIT_METHODS, MONTH_NAMES_SHORT } from '../../data';
import {
  calculatePMT,
  calculateFV,
  calculatePV,
  calculateTrailingPayments,
  calculateYearSum
} from '../../utils';

export const ProjectionsTab: React.FC = () => {
  console.log('[ProjectionsTab] Component rendering');

  const { styles } = useTheme();
  const {
    selectedLoan,
    selectedLoanData,
    paymentRecords,
    loans,
    collateralList,
    collateralLoanRelationships
  } = useLoan();
  const { settings: projSettings, updateSetting: updateProjSetting } = useProjection();
  const { settings: exitSettings, updateSetting: updateExitSetting } = useExit();

  // Mode state: 'modern' or 'classic'
  const [mode, setMode] = React.useState<'modern' | 'classic'>('modern');

  // Classic mode state - array of cash flow entries
  type ClassicEntry = {
    id: string;
    startMonth: string;
    startYear: string;
    endMonth: string;
    endYear: string;
    amount: string;
    type: 'income' | 'expense';
  };
  const [classicEntries, setClassicEntries] = React.useState<ClassicEntry[]>([]);

  // Local state for input fields to allow empty display while keeping valid context state
  const [startMonthInput, setStartMonthInput] = React.useState(exitSettings.startMonth);
  const [endMonthInput, setEndMonthInput] = React.useState(exitSettings.endMonth);

  // Sync local state when context changes (but not during typing)
  React.useEffect(() => {
    if (document.activeElement?.getAttribute('name') !== 'startMonth') {
      setStartMonthInput(exitSettings.startMonth);
    }
  }, [exitSettings.startMonth]);

  React.useEffect(() => {
    if (document.activeElement?.getAttribute('name') !== 'endMonth') {
      setEndMonthInput(exitSettings.endMonth);
    }
  }, [exitSettings.endMonth]);

  console.log('[ProjectionsTab] Context values:', {
    selectedLoan,
    hasSelectedLoanData: !!selectedLoanData,
    projSettings,
    exitSettings
  });

  if (!selectedLoanData) {
    console.warn('[ProjectionsTab] No loan data selected');
    return <div className="p-4"><p className={styles.textMuted}>No loan selected</p></div>;
  }

  console.log('[ProjectionsTab] Selected loan data:', {
    mwLoanNo: selectedLoanData.mwLoanNo,
    principal: selectedLoanData.principal,
    intRate: selectedLoanData.intRate,
    pmt: selectedLoanData.pmt
  });

  // Safe handlers for input changes with local state
  const handleStartMonthChange = useCallback((value: string) => {
    // Update local state immediately (allows empty for UX)
    setStartMonthInput(value);

    // Only update context with valid values
    if (value === '') {
      updateExitSetting('startMonth', '1'); // Use default in context
      return;
    }

    if (!/^\d+$/.test(value)) {
      return; // Ignore non-numeric
    }

    const numValue = parseInt(value);
    if (numValue > 60) {
      setStartMonthInput('60');
      updateExitSetting('startMonth', '60');
      return;
    }

    if (numValue >= 1) {
      updateExitSetting('startMonth', value);
    }
  }, [updateExitSetting]);

  const handleEndMonthChange = useCallback((value: string) => {
    // Update local state immediately (allows empty for UX)
    setEndMonthInput(value);

    // Only update context with valid values
    if (value === '') {
      updateExitSetting('endMonth', '24'); // Use default in context
      return;
    }

    if (!/^\d+$/.test(value)) {
      return; // Ignore non-numeric
    }

    const numValue = parseInt(value);
    if (numValue > 60) {
      setEndMonthInput('60');
      updateExitSetting('endMonth', '60');
      return;
    }

    if (numValue >= 1) {
      updateExitSetting('endMonth', value);
    }
  }, [updateExitSetting]);

  const handleStartMonthBlur = useCallback(() => {
    const parsed = parseInt(startMonthInput) || 1;
    const sanitized = Math.max(1, Math.min(60, parsed)).toString();
    setStartMonthInput(sanitized);
    updateExitSetting('startMonth', sanitized);
  }, [startMonthInput, updateExitSetting]);

  const handleEndMonthBlur = useCallback(() => {
    const parsed = parseInt(endMonthInput) || 24;
    const sanitized = Math.max(1, Math.min(60, parsed)).toString();
    setEndMonthInput(sanitized);
    updateExitSetting('endMonth', sanitized);
  }, [endMonthInput, updateExitSetting]);

  // Handle add back percentage change - allow empty temporarily, cap at 100
  const handleAddBackPercentageChange = useCallback((value: string) => {
    // Allow empty string temporarily
    if (value === '') {
      updateProjSetting('addBackPercentage', value);
      return;
    }

    // Only allow numeric characters and decimal point
    if (!/^\d*\.?\d*$/.test(value)) {
      return; // Reject non-numeric
    }

    // Parse and cap at 100
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 100) {
      updateProjSetting('addBackPercentage', '100');
      return;
    }

    updateProjSetting('addBackPercentage', value);
  }, [updateProjSetting]);

  // Handle add back percentage blur - ensure valid value when leaving field
  const handleAddBackPercentageBlur = useCallback((value: string) => {
    if (value === '' || value === '.') {
      updateProjSetting('addBackPercentage', '0');
      return;
    }

    const numValue = parseFloat(value);
    const sanitized = Math.max(0, Math.min(100, numValue));
    updateProjSetting('addBackPercentage', sanitized.toString());
  }, [updateProjSetting]);

  // Sanitize exit settings to prevent invalid calculations during user input
  const sanitizedExitSettings = useMemo(() => {
    const startMonth = parseInt(exitSettings.startMonth) || 1;
    const endMonth = parseInt(exitSettings.endMonth) || 24;

    return {
      ...exitSettings,
      startMonth: Math.max(1, Math.min(60, startMonth)).toString(),
      endMonth: Math.max(1, Math.min(60, endMonth)).toString(),
    };
  }, [exitSettings]);

  // Get projected rate
  const getProjectedRate = useCallback((): number => {
    try {
      let rate = 0;
      if (projSettings.rateMethod === 'User Enter') {
        rate = parseFloat(projSettings.userRate) || 0;
        console.log('[getProjectedRate] Using User Enter:', rate);
      } else {
        rate = selectedLoanData.intRate;
        console.log('[getProjectedRate] Using Contractual:', rate);
      }

      // Validate rate
      if (!isFinite(rate) || rate < 0) {
        console.warn('[getProjectedRate] Invalid rate, using contractual:', selectedLoanData.intRate);
        return selectedLoanData.intRate;
      }

      return rate;
    } catch (error) {
      console.error('Error in getProjectedRate:', error);
      return selectedLoanData.intRate;
    }
  }, [projSettings.rateMethod, projSettings.userRate, selectedLoanData.intRate]);

  // Calculate projected payment based on method
  const calculateProjectedPayment = useCallback((): number => {
    try {
      let result = 0;
      console.log('[calculateProjectedPayment] Method:', projSettings.paymentMethod);

      switch (projSettings.paymentMethod) {
        case 'Contractual':
          result = selectedLoanData.pmt;
          console.log('[calculateProjectedPayment] Contractual:', result);
          break;
        case 'User Enter':
          result = parseFloat(projSettings.userPayment) || 0;
          console.log('[calculateProjectedPayment] User Enter:', result);
          break;
        case 'Interest Payment':
          const rate = getProjectedRate();
          result = selectedLoanData.principal * (rate / 100) / 12;
          console.log('[calculateProjectedPayment] Interest Payment - Rate:', rate, 'Principal:', selectedLoanData.principal, 'Result:', result);
          break;
        case 'Term Pmt':
          const termRate = getProjectedRate();
          const amortMonths = parseInt(projSettings.amortMonths) || 360;
          result = calculatePMT(termRate, amortMonths, selectedLoanData.principal);
          console.log('[calculateProjectedPayment] Term Pmt - Rate:', termRate, 'Months:', amortMonths, 'Result:', result);
          break;
        case '% of Trail Pmt':
          const trailData = calculateTrailingPayments(
            selectedLoan,
            parseInt(projSettings.trailPeriod) || 12,
            selectedLoanData.lastImportDate,
            paymentRecords,
            loans
          );
          const trailMonthly = trailData?.monthly || 0;
          const trailPercent = parseFloat(projSettings.trailPercentage) || 100;
          result = trailMonthly * trailPercent / 100;
          console.log('[calculateProjectedPayment] Trail Pmt - Monthly:', trailMonthly, 'Percent:', trailPercent, 'Result:', result);
          break;
        default:
          result = selectedLoanData.pmt;
          console.log('[calculateProjectedPayment] Default:', result);
      }

      // Validate result
      if (!isFinite(result) || result < 0) {
        console.warn('[calculateProjectedPayment] Invalid result, using contractual:', selectedLoanData.pmt);
        return selectedLoanData.pmt;
      }

      return result;
    } catch (error) {
      console.error('Error in calculateProjectedPayment:', error);
      return selectedLoanData.pmt;
    }
  }, [projSettings.paymentMethod, projSettings.userPayment, projSettings.amortMonths, projSettings.trailPeriod, projSettings.trailPercentage, selectedLoanData.pmt, selectedLoanData.principal, selectedLoanData.lastImportDate, selectedLoan, paymentRecords, loans, getProjectedRate]);

  // Calculate total holding costs
  const calculateTotalHoldingCosts = useCallback((): number => {
    const legalStartMonth = parseInt(projSettings.initialLegalStartMonth) || 0;
    const holdingEndMonth = parseInt(projSettings.holdingCostsEndMonth) || 0;
    const numberOfMonths = Math.max(0, holdingEndMonth - legalStartMonth);
    const monthlyHolding = parseFloat(projSettings.holdingCosts) || 0;
    const total = numberOfMonths * monthlyHolding;

    console.log('[calculateTotalHoldingCosts]:', {
      legalStartMonth,
      holdingEndMonth,
      numberOfMonths,
      monthlyHolding,
      total
    });

    return total;
  }, [projSettings.initialLegalStartMonth, projSettings.holdingCostsEndMonth, projSettings.holdingCosts]);

  // Calculate add back to exit
  const calculateAddBackToExit = useCallback((): number => {
    try {
      const initialLegal = parseFloat(projSettings.initialLegal) || 0;
      const totalHolding = calculateTotalHoldingCosts();
      const basis = projSettings.addBackBasis === 'Initial Only' ? initialLegal : initialLegal + totalHolding;
      const percentage = parseFloat(projSettings.addBackPercentage) || 0;
      const result = basis * percentage / 100;

      console.log('[calculateAddBackToExit] Expense Recovery:', {
        initialLegal,
        totalHolding,
        addBackBasis: projSettings.addBackBasis,
        basis,
        percentage,
        result
      });

      // Validate result
      if (!isFinite(result)) {
        console.warn('[calculateAddBackToExit] Invalid result, returning 0');
        return 0;
      }

      return result;
    } catch (error) {
      console.error('Error in calculateAddBackToExit:', error);
      return 0;
    }
  }, [projSettings.initialLegal, projSettings.addBackBasis, projSettings.addBackPercentage, calculateTotalHoldingCosts]);

  // Calculate pay in full value
  const calculatePayInFull = useCallback((): number => {
    try {
      const startMonth = parseInt(sanitizedExitSettings.startMonth) || 1;
      const endMonth = parseInt(sanitizedExitSettings.endMonth) || 24;
      const nper = Math.max(1, endMonth - startMonth + 1); // Ensure positive nper
      const rate = getProjectedRate();
      const payment = calculateProjectedPayment();

      console.log('[calculatePayInFull] Using:', {
        rate,
        payment,
        principal: selectedLoanData.principal,
        nper,
        paymentMethod: projSettings.paymentMethod,
        rateMethod: projSettings.rateMethod
      });

      // Validate inputs
      if (!isFinite(rate) || !isFinite(payment) || !isFinite(selectedLoanData.principal)) {
        console.warn('[calculatePayInFull] Invalid inputs, returning principal');
        return selectedLoanData.principal;
      }

      // Calculate future value of balance with payments
      // The FV represents the remaining balance after nper payments, which is the payoff amount
      const fv = calculateFV(rate, nper, -payment, selectedLoanData.principal);

      console.log('[calculatePayInFull] Result:', fv);

      // Validate output
      if (!isFinite(fv)) {
        console.warn('[calculatePayInFull] Invalid FV, returning principal');
        return selectedLoanData.principal;
      }

      return fv;
    } catch (error) {
      console.error('Error in calculatePayInFull:', error);
      return selectedLoanData.principal;
    }
  }, [sanitizedExitSettings.startMonth, sanitizedExitSettings.endMonth, selectedLoanData.principal, projSettings.paymentMethod, projSettings.rateMethod, getProjectedRate, calculateProjectedPayment]);

  // Get calculated exit value - memoized to prevent recalculation on every render
  const calculatedExitValue = useMemo(() => {
    try {
      let result = 0;
      console.log(`[calculatedExitValue] Method: ${exitSettings.method}`);

      switch (exitSettings.method) {
        case 'Pay in Full':
          result = calculatePayInFull();
          console.log('[Pay in Full] Result:', result);
          break;
        case 'DPO':
          const payInFull = calculatePayInFull();
          const dpoPercent = parseFloat(exitSettings.dpoPercentage) || 95;
          result = payInFull * dpoPercent / 100;
          console.log('[DPO] Pay in Full:', payInFull, 'Percentage:', dpoPercent, 'Result:', result);
          break;
        case 'Value Cap':
          const loanCollateral = collateralList.find(c =>
            collateralLoanRelationships[c.id]?.[selectedLoan]
          );
          const collateralValue = loanCollateral ? parseFloat(String(loanCollateral.ourValue).replace(/[$,]/g, '')) : 0;
          const capPercent = parseFloat(exitSettings.valueCapPercentage) || 90;
          result = collateralValue * capPercent / 100;
          console.log('[Value Cap] Collateral:', collateralValue, 'Percentage:', capPercent, 'Result:', result);
          break;
        case 'User Enter':
          result = parseFloat(exitSettings.userEnterAmount) || 0;
          console.log('[User Enter] Amount:', result);
          break;
        case 'YTM Sell Solve':
          const desiredYield = parseFloat(exitSettings.ytmDesired) || 12;
          const startMonthYTM = parseInt(sanitizedExitSettings.startMonth) || 1;
          const endMonthYTM = parseInt(sanitizedExitSettings.endMonth) || 24;
          const months = Math.max(1, endMonthYTM - startMonthYTM + 1); // Ensure positive months
          const monthlyPmt = calculateProjectedPayment();
          const finalPayoff = calculatePayInFull();
          console.log('[YTM Sell Solve] Using:', {
            desiredYield,
            months,
            monthlyPmt,
            finalPayoff,
            paymentMethod: projSettings.paymentMethod,
            rateMethod: projSettings.rateMethod
          });
          // Calculate present value: what to sell loan for today to achieve desired yield
          // With positive payments (cash inflows) and positive final payoff
          result = calculatePV(desiredYield, months, monthlyPmt, finalPayoff);
          console.log('[YTM Sell Solve] Result:', result);
          break;
        case 'Liquidation':
          const liquidationMonths = parseInt(exitSettings.liquidationMonths) || 12;
          let balance = selectedLoanData.principal;
          if (exitSettings.liquidationAddInterest) {
            balance += selectedLoanData.interest;
          }
          const rate = getProjectedRate();
          const monthlyRate = rate / 100 / 12;
          console.log('[Liquidation] Starting balance:', balance, 'Rate:', rate, 'Months:', liquidationMonths, 'Rate method:', projSettings.rateMethod);
          // Calculate interest accrual during liquidation
          for (let i = 0; i < liquidationMonths; i++) {
            balance += balance * monthlyRate;
          }
          // Assume recovery at collateral value
          const col = collateralList.find(c => collateralLoanRelationships[c.id]?.[selectedLoan]);
          result = col ? parseFloat(String(col.ourValue).replace(/[$,]/g, '')) : balance;
          console.log('[Liquidation] Balance after accrual:', balance, 'Collateral value:', result);
          break;
        default:
          result = 0;
      }

      // Validate result - handle NaN, Infinity, etc.
      if (!isFinite(result)) {
        console.warn('Invalid exit value calculation:', result);
        return 0;
      }

      console.log(`[calculatedExitValue] Final result for ${exitSettings.method}:`, result);
      return result;
    } catch (error) {
      console.error('Error calculating exit value:', error);
      return 0;
    }
  }, [sanitizedExitSettings, exitSettings.method, exitSettings.dpoPercentage, exitSettings.valueCapPercentage, exitSettings.userEnterAmount, exitSettings.ytmDesired, exitSettings.liquidationMonths, exitSettings.liquidationAddInterest, selectedLoanData, collateralList, collateralLoanRelationships, selectedLoan, calculateProjectedPayment, calculatePayInFull, getProjectedRate, projSettings.paymentMethod, projSettings.rateMethod]);

  // Memoized projected payment value - don't call function in render
  const projectedPaymentValue = useMemo(() => {
    try {
      const value = calculateProjectedPayment();
      return isFinite(value) ? value : 0;
    } catch (error) {
      console.error('Error getting projected payment value:', error);
      return 0;
    }
  }, [calculateProjectedPayment]);

  // Memoized add back value - don't call function in render
  const addBackValue = useMemo(() => {
    try {
      const value = calculateAddBackToExit();
      const result = isFinite(value) ? value : 0;
      console.log('[addBackValue] Memoized expense recovery value:', result);
      return result;
    } catch (error) {
      console.error('Error getting add back value:', error);
      return 0;
    }
  }, [calculateAddBackToExit]);

  // Memoized total exit proceeds (exit value + add back recovery)
  const totalExitProceeds = useMemo(() => {
    const exitVal = isFinite(calculatedExitValue) ? calculatedExitValue : 0;
    const total = exitVal + addBackValue;
    const result = isFinite(total) ? total : 0;

    console.log('[totalExitProceeds] Final Calculation:', {
      exitValue: exitVal,
      addBackRecovery: addBackValue,
      totalExitProceeds: result
    });

    return result;
  }, [calculatedExitValue, addBackValue]);

  // Build projection grid
  const buildProjectionGrid = useMemo(() => {
    const income: Record<string, Record<number, number>> = {};
    const expenses: Record<string, Record<number, number>> = {};
    const netCashFlow: Record<string, Record<number, number>> = {};

    const startMonth = parseInt(sanitizedExitSettings.startMonth) || 1;
    const endMonth = Math.min(Math.max(1, parseInt(sanitizedExitSettings.endMonth) || 24), 60); // Ensure valid range
    const monthlyPayment = projectedPaymentValue;
    const initialLegal = parseFloat(projSettings.initialLegal) || 0;
    const initialLegalStart = parseInt(projSettings.initialLegalStartMonth) || 1;
    const holdingCosts = parseFloat(projSettings.holdingCosts) || 0;
    const holdingCostsEnd = parseInt(projSettings.holdingCostsEndMonth) || 12;

    // Get current date for starting year
    const currentYear = new Date().getFullYear();

    for (let month = startMonth; month <= endMonth; month++) {
      // Calculate actual month and year
      const actualMonth = ((month - 1) % 12) + 1;
      const yearOffset = Math.floor((month - 1) / 12);
      const year = (currentYear + yearOffset).toString();

      // Initialize year data if needed
      if (!income[year]) income[year] = {};
      if (!expenses[year]) expenses[year] = {};
      if (!netCashFlow[year]) netCashFlow[year] = {};

      // Add income (monthly payment)
      income[year][actualMonth] = (income[year][actualMonth] || 0) + monthlyPayment;

      // Add expenses
      let monthExpense = 0;
      if (month === initialLegalStart) {
        monthExpense += initialLegal;
      }
      // Start holding costs AFTER initial legal expense month
      if (month > initialLegalStart && month <= holdingCostsEnd) {
        monthExpense += holdingCosts;
      }
      expenses[year][actualMonth] = (expenses[year][actualMonth] || 0) + monthExpense;

      // Calculate net
      netCashFlow[year][actualMonth] = income[year][actualMonth] - expenses[year][actualMonth];
    }

    return { income, expenses, netCashFlow };
  }, [projSettings, sanitizedExitSettings, projectedPaymentValue]);

  // Build classic mode projection grid from entries
  const buildClassicProjectionGrid = useMemo(() => {
    const income: Record<string, Record<number, number>> = {};
    const expenses: Record<string, Record<number, number>> = {};
    const netCashFlow: Record<string, Record<number, number>> = {};

    classicEntries.forEach(entry => {
      const startYear = parseInt(entry.startYear);
      const endYear = parseInt(entry.endYear);
      const startMonth = parseInt(entry.startMonth);
      const endMonth = parseInt(entry.endMonth);
      const amount = parseFloat(entry.amount) || 0;

      // Iterate through all months in the range
      for (let year = startYear; year <= endYear; year++) {
        const yearStr = year.toString();

        // Initialize year data if needed
        if (!income[yearStr]) income[yearStr] = {};
        if (!expenses[yearStr]) expenses[yearStr] = {};
        if (!netCashFlow[yearStr]) netCashFlow[yearStr] = {};

        // Determine which months to populate for this year
        const firstMonth = (year === startYear) ? startMonth : 1;
        const lastMonth = (year === endYear) ? endMonth : 12;

        for (let month = firstMonth; month <= lastMonth; month++) {
          // Overwrite the value (not additive)
          if (entry.type === 'income') {
            income[yearStr][month] = amount;
          } else {
            expenses[yearStr][month] = amount;
          }

          // Calculate net cash flow
          const incomeAmount = income[yearStr][month] || 0;
          const expenseAmount = expenses[yearStr][month] || 0;
          netCashFlow[yearStr][month] = incomeAmount - expenseAmount;
        }
      }
    });

    return { income, expenses, netCashFlow };
  }, [classicEntries]);

  const projectionGrid = mode === 'classic' ? buildClassicProjectionGrid : buildProjectionGrid;

  return (
    <div className="p-4">
      {/* Mode Selector */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode('modern')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
            mode === 'modern'
              ? `${styles.activeBg} ${styles.textPrimary} ${styles.inputBorder}`
              : `${styles.cardBg} ${styles.textMuted} ${styles.borderColor} ${styles.hoverText}`
          }`}
        >
          Modern Mode
        </button>
        <button
          onClick={() => setMode('classic')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
            mode === 'classic'
              ? `${styles.activeBg} ${styles.textPrimary} ${styles.inputBorder}`
              : `${styles.cardBg} ${styles.textMuted} ${styles.borderColor} ${styles.hoverText}`
          }`}
        >
          Classic Mode
        </button>
      </div>

      {/* Loan Header Info */}
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
        <div className="flex items-center space-x-6">
          <div>
            <span className={`text-xs ${styles.textMuted}`}>Loan #:</span>
            <span className={`ml-2 font-medium ${styles.textPrimary}`}>{selectedLoan}</span>
          </div>
          <div>
            <span className={`text-xs ${styles.textMuted}`}>UPB:</span>
            <span className={`ml-2 font-medium ${styles.textGreen}`}>
              ${(isFinite(selectedLoanData.principal) ? selectedLoanData.principal : 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className={`text-xs ${styles.textMuted}`}>Contractual Rate:</span>
            <span className={`ml-2 font-medium ${styles.textPrimary}`}>
              {isFinite(selectedLoanData.intRate) ? selectedLoanData.intRate : 0}%
            </span>
          </div>
          <div>
            <span className={`text-xs ${styles.textMuted}`}>Contractual Pmt:</span>
            <span className={`ml-2 font-medium ${styles.textPrimary}`}>
              ${(isFinite(selectedLoanData.pmt) ? selectedLoanData.pmt : 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Mode Content */}
      {mode === 'modern' && (
        <>
          {/* Projection Settings */}
          <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-4 ${styles.textPrimary}`}>Projection Settings</h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Payment Method Section */}
          <div>
            <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Payment Method</h4>
            <div className="mb-3">
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Payment Type:</label>
              <select
                value={projSettings.paymentMethod}
                onChange={(e) => updateProjSetting('paymentMethod', e.target.value as typeof projSettings.paymentMethod)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              <div className={`mt-2 px-2 py-1 ${styles.readOnlyBg} rounded ${styles.inputBorder} border`}>
                <span className={`text-xs ${styles.textMuted}`}>Calculated: </span>
                <span className={`text-sm font-medium ${styles.textYellow}`}>
                  ${projectedPaymentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}/mo
                </span>
              </div>
            </div>

            {projSettings.paymentMethod === 'User Enter' && (
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Payment Amount:</label>
                <input
                  type="text"
                  value={projSettings.userPayment}
                  onChange={(e) => updateProjSetting('userPayment', e.target.value)}
                  placeholder="0.00"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
            )}

            {projSettings.paymentMethod === 'Term Pmt' && (
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Amortization (months):</label>
                <input
                  type="text"
                  value={projSettings.amortMonths}
                  onChange={(e) => updateProjSetting('amortMonths', e.target.value)}
                  placeholder="360"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
            )}
          </div>

          {/* Rate Method Section */}
          <div>
            <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Rate Method</h4>
            <div className="mb-3">
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Rate Type:</label>
              <select
                value={projSettings.rateMethod}
                onChange={(e) => updateProjSetting('rateMethod', e.target.value as typeof projSettings.rateMethod)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              >
                {RATE_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              <div className={`mt-2 px-2 py-1 ${styles.readOnlyBg} rounded ${styles.inputBorder} border`}>
                <span className={`text-xs ${styles.textMuted}`}>Effective Rate: </span>
                <span className={`text-sm font-medium ${styles.textYellow}`}>{getProjectedRate().toFixed(2)}%</span>
              </div>
            </div>

            {projSettings.rateMethod === 'User Enter' && (
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Interest Rate (%):</label>
                <input
                  type="text"
                  value={projSettings.userRate}
                  onChange={(e) => updateProjSetting('userRate', e.target.value)}
                  placeholder="0.00"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Expense Assumptions */}
        <div className={`mt-6 pt-4 border-t ${styles.borderColor}`}>
          <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Expense Assumptions</h4>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Initial Legal ($):</label>
              <input
                type="text"
                value={projSettings.initialLegal}
                onChange={(e) => updateProjSetting('initialLegal', e.target.value)}
                placeholder="0.00"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Start Month:</label>
              <input
                type="text"
                value={projSettings.initialLegalStartMonth}
                onChange={(e) => updateProjSetting('initialLegalStartMonth', e.target.value)}
                placeholder="1"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Holding Costs ($/mo):</label>
              <input
                type="text"
                value={projSettings.holdingCosts}
                onChange={(e) => updateProjSetting('holdingCosts', e.target.value)}
                placeholder="0.00"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Through Month:</label>
              <input
                type="text"
                value={projSettings.holdingCostsEndMonth}
                onChange={(e) => updateProjSetting('holdingCostsEndMonth', e.target.value)}
                placeholder="12"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
          </div>

          {/* Expense Recovery (Add Back) */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Add Back Basis:</label>
              <select
                value={projSettings.addBackBasis || 'Initial Only'}
                onChange={(e) => updateProjSetting('addBackBasis', e.target.value as 'Initial Only' | 'Initial + Holding')}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              >
                <option value="Initial Only">Initial Only</option>
                <option value="Initial + Holding">Initial + Holding</option>
              </select>
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Add Back Recovery (%):</label>
              <input
                type="text"
                value={projSettings.addBackPercentage || ''}
                onChange={(e) => handleAddBackPercentageChange(e.target.value)}
                onBlur={(e) => handleAddBackPercentageBlur(e.target.value)}
                placeholder="0"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exit Scenario Settings */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border mt-4`}>
        <h3 className={`font-medium mb-4 ${styles.textPrimary}`}>Exit Scenario Settings</h3>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Cash Flow Start Month:</label>
            <input
              type="text"
              name="startMonth"
              value={startMonthInput}
              onChange={(e) => handleStartMonthChange(e.target.value)}
              onBlur={handleStartMonthBlur}
              placeholder="1"
              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Month:</label>
            <input
              type="text"
              name="endMonth"
              value={endMonthInput}
              onChange={(e) => handleEndMonthChange(e.target.value)}
              onBlur={handleEndMonthBlur}
              placeholder="24"
              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
            />
            <p className={`text-xs ${styles.textMuted} mt-1`}>
              {(() => {
                const start = parseInt(sanitizedExitSettings.startMonth) || 1;
                const end = parseInt(sanitizedExitSettings.endMonth) || 24;
                const monthsCount = Math.max(0, end - start + 1);
                return `${monthsCount} months of cash flow`;
              })()}
            </p>
          </div>
        </div>

        <div className={`pt-4 border-t ${styles.borderColor}`}>
          <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Exit Method</h4>
          <div className="mb-4">
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Type:</label>
            <select
              value={exitSettings.method}
              onChange={(e) => updateExitSetting('method', e.target.value as typeof exitSettings.method)}
              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
            >
              {EXIT_METHODS.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            <div className={`mt-2 px-2 py-1 ${styles.readOnlyBg} rounded ${styles.inputBorder} border`}>
              <span className={`text-xs ${styles.textMuted}`}>Exit Value: </span>
              <span className={`text-sm font-medium ${calculatedExitValue < 0 ? 'text-red-500' : styles.textYellow}`}>
                ${(isFinite(calculatedExitValue) ? calculatedExitValue : 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
          </div>

          {/* Conditional inputs based on exit method */}
          {exitSettings.method === 'DPO' && (
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>DPO Percentage (%):</label>
              <input
                type="text"
                value={exitSettings.dpoPercentage}
                onChange={(e) => updateExitSetting('dpoPercentage', e.target.value)}
                placeholder="95"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
          )}

          {exitSettings.method === 'Value Cap' && (
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Value Cap Percentage (%):</label>
              <input
                type="text"
                value={exitSettings.valueCapPercentage}
                onChange={(e) => updateExitSetting('valueCapPercentage', e.target.value)}
                placeholder="90"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
          )}

          {exitSettings.method === 'User Enter' && (
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Value ($):</label>
              <input
                type="text"
                value={exitSettings.userEnterAmount}
                onChange={(e) => updateExitSetting('userEnterAmount', e.target.value)}
                placeholder="0.00"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
          )}

          {exitSettings.method === 'YTM Sell Solve' && (
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Desired YTM (%):</label>
              <input
                type="text"
                value={exitSettings.ytmDesired}
                onChange={(e) => updateExitSetting('ytmDesired', e.target.value)}
                placeholder="12.00"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
          )}

          {exitSettings.method === 'Liquidation' && (
            <div className="space-y-3">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Liquidation Months:</label>
                <input
                  type="text"
                  value={exitSettings.liquidationMonths}
                  onChange={(e) => updateExitSetting('liquidationMonths', e.target.value)}
                  placeholder="12"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="addCurrentInterest"
                  checked={exitSettings.liquidationAddInterest}
                  onChange={(e) => updateExitSetting('liquidationAddInterest', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="addCurrentInterest" className={`text-xs ${styles.textPrimary}`}>
                  Add current interest (${selectedLoanData.interest.toLocaleString()})
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Exit Value Summary */}
        <div className={`mt-6 pt-4 border-t ${styles.borderColor}`}>
          <div className="grid grid-cols-3 gap-4">
            <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
              <div className={`text-xs ${styles.textMuted} mb-1`}>Exit Value</div>
              <div className={`text-lg font-medium ${calculatedExitValue < 0 ? 'text-red-500' : styles.textYellow}`}>
                ${(isFinite(calculatedExitValue) ? calculatedExitValue : 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
              <div className={`text-xs ${styles.textMuted} mb-1`}>Add Back Recovery</div>
              <div className={`text-lg font-medium ${styles.textYellow}`}>
                ${addBackValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
              <div className={`text-xs ${styles.textMuted} mb-1`}>Total Exit Proceeds</div>
              <div className={`text-lg font-medium ${styles.textGreen}`}>
                ${totalExitProceeds.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projection Tables */}
      <div className="mt-4 space-y-4">
        {/* Income Table */}
        <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
          <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Projected Income</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className={`text-left px-2 py-1 ${styles.textMuted} font-medium`}></th>
                  {MONTH_NAMES_SHORT.map(month => (
                    <th key={month} className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>{month}</th>
                  ))}
                  <th className={`text-center px-2 py-1 ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Sum</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(projectionGrid.income)
                  .filter(year => calculateYearSum(projectionGrid.income[year]) > 0)
                  .map((year, index) => {
                    const yearData = projectionGrid.income[year] || {};
                    const yearSum = calculateYearSum(yearData);
                    return (
                      <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                        <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                          const amount = yearData[month];
                          const isValidAmount = amount != null && isFinite(amount);
                          return (
                            <td key={month} className={`text-center px-1 py-2 ${isValidAmount && amount > 0 ? styles.textGreen : styles.textSecondary}`}>
                              {isValidAmount && amount > 0 ? amount.toFixed(0) : '-'}
                            </td>
                          );
                        })}
                        <td className={`text-center px-2 py-2 font-medium ${yearSum > 0 ? styles.textGreen : styles.textSecondary} ${styles.borderColor} border-l`}>
                          ${yearSum.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Cash Flow Table */}
        <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
          <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Net Cash Flow</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className={`text-left px-2 py-1 ${styles.textMuted} font-medium`}></th>
                  {MONTH_NAMES_SHORT.map(month => (
                    <th key={month} className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>{month}</th>
                  ))}
                  <th className={`text-center px-2 py-1 ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Sum</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(projectionGrid.netCashFlow).map((year, index) => {
                  const yearData = projectionGrid.netCashFlow[year] || {};
                  const yearSum = calculateYearSum(yearData);
                  if (yearSum === 0 && Object.values(yearData).every(v => v === 0)) return null;
                  return (
                    <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                      <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                        const amount = yearData[month];
                        const isValidAmount = amount != null && isFinite(amount);
                        return (
                          <td key={month} className={`text-center px-1 py-2 ${
                            isValidAmount && amount > 0 ? styles.textGreen :
                            isValidAmount && amount < 0 ? 'text-red-500' :
                            styles.textSecondary
                          }`}>
                            {isValidAmount && amount !== 0 ? amount.toFixed(0) : '-'}
                          </td>
                        );
                      })}
                      <td className={`text-center px-2 py-2 font-medium ${
                        yearSum > 0 ? styles.textGreen :
                        yearSum < 0 ? 'text-red-500' :
                        styles.textSecondary
                      } ${styles.borderColor} border-l`}>
                        ${yearSum.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Classic Mode Content */}
      {mode === 'classic' && (
        <>
          {/* Classic Mode Entry Form */}
          <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border mb-4`}>
            <h3 className={`font-medium mb-4 ${styles.textPrimary}`}>Add Cash Flow Entry</h3>

            <div className="grid grid-cols-6 gap-3 items-end">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Start Month:</label>
                <select
                  id="classic-start-month"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Start Year:</label>
                <input
                  type="text"
                  id="classic-start-year"
                  placeholder="2025"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>

              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>End Month:</label>
                <select
                  id="classic-end-month"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>End Year:</label>
                <input
                  type="text"
                  id="classic-end-year"
                  placeholder="2027"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>

              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Amount ($):</label>
                <input
                  type="text"
                  id="classic-amount"
                  placeholder="500"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>

              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Type:</label>
                <select
                  id="classic-type"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <button
                  onClick={() => {
                    const startMonth = (document.getElementById('classic-start-month') as HTMLSelectElement)?.value;
                    const startYear = (document.getElementById('classic-start-year') as HTMLInputElement)?.value;
                    const endMonth = (document.getElementById('classic-end-month') as HTMLSelectElement)?.value;
                    const endYear = (document.getElementById('classic-end-year') as HTMLInputElement)?.value;
                    const amount = (document.getElementById('classic-amount') as HTMLInputElement)?.value;
                    const type = (document.getElementById('classic-type') as HTMLSelectElement)?.value as 'income' | 'expense';

                    if (startMonth && startYear && endMonth && endYear && amount) {
                      const newEntry: ClassicEntry = {
                        id: Date.now().toString(),
                        startMonth,
                        startYear,
                        endMonth,
                        endYear,
                        amount,
                        type
                      };
                      setClassicEntries(prev => [...prev, newEntry]);
                    }
                  }}
                  className={`${styles.activeBg} ${styles.textPrimary} px-4 py-2 rounded text-sm font-medium border ${styles.inputBorder} ${styles.buttonHover} transition-colors`}
                >
                  Add Entry
                </button>
              </div>
            </div>

            {/* Clear All Button */}
            {classicEntries.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setClassicEntries([])}
                  className={`${styles.cardBg} ${styles.textMuted} hover:${styles.textPrimary} px-4 py-2 rounded text-sm border ${styles.borderColor} transition-colors`}
                >
                  Clear All Entries
                </button>
              </div>
            )}
          </div>

          {/* Classic Mode Tables - Income, Expenses, Net Cash Flow */}
          <div className="space-y-4">
            {/* Income Table */}
            <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
              <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Income</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className={`${styles.tableHeaderBg} sticky top-0`}>
                    <tr>
                      <th className={`px-2 py-2 text-left ${styles.textMuted} font-medium`}>Year</th>
                      {MONTH_NAMES_SHORT.map(month => (
                        <th key={month} className={`text-center px-1 py-2 ${styles.textMuted} font-medium`}>{month}</th>
                      ))}
                      <th className={`px-2 py-2 text-right ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(projectionGrid.income).sort().map((year, index) => {
                      const yearData = projectionGrid.income[year] || {};
                      const yearSum = calculateYearSum(yearData);
                      return (
                        <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                          <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                            const amount = yearData[month];
                            const isValidAmount = amount != null && isFinite(amount);
                            return (
                              <td key={month} className={`text-center px-1 py-2 ${isValidAmount && amount > 0 ? styles.textGreen : styles.textSecondary}`}>
                                {isValidAmount && amount > 0 ? amount.toFixed(0) : '-'}
                              </td>
                            );
                          })}
                          <td className={`px-2 py-2 text-right font-medium ${
                            yearSum > 0 ? styles.textGreen : styles.textSecondary
                          } ${styles.borderColor} border-l`}>
                            ${yearSum.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expenses Table */}
            <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
              <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Expenses</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className={`${styles.tableHeaderBg} sticky top-0`}>
                    <tr>
                      <th className={`px-2 py-2 text-left ${styles.textMuted} font-medium`}>Year</th>
                      {MONTH_NAMES_SHORT.map(month => (
                        <th key={month} className={`text-center px-1 py-2 ${styles.textMuted} font-medium`}>{month}</th>
                      ))}
                      <th className={`px-2 py-2 text-right ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(projectionGrid.expenses).sort().map((year, index) => {
                      const yearData = projectionGrid.expenses[year] || {};
                      const yearSum = calculateYearSum(yearData);
                      if (yearSum === 0 && Object.values(yearData).every(v => v === 0)) return null;
                      return (
                        <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                          <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                            const amount = yearData[month];
                            const isValidAmount = amount != null && isFinite(amount);
                            return (
                              <td key={month} className={`text-center px-1 py-2 ${
                                isValidAmount && amount > 0 ? styles.textGreen :
                                isValidAmount && amount < 0 ? styles.textYellow :
                                styles.textSecondary
                              }`}>
                                {isValidAmount && amount !== 0 ? amount.toFixed(0) : '-'}
                              </td>
                            );
                          })}
                          <td className={`px-2 py-2 text-right font-medium ${
                            yearSum > 0 ? styles.textGreen :
                            yearSum < 0 ? styles.textYellow :
                            styles.textSecondary
                          } ${styles.borderColor} border-l`}>
                            ${yearSum.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Cash Flow Table */}
            <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
              <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Net Cash Flow</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className={`${styles.tableHeaderBg} sticky top-0`}>
                    <tr>
                      <th className={`px-2 py-2 text-left ${styles.textMuted} font-medium`}>Year</th>
                      {MONTH_NAMES_SHORT.map(month => (
                        <th key={month} className={`text-center px-1 py-2 ${styles.textMuted} font-medium`}>{month}</th>
                      ))}
                      <th className={`px-2 py-2 text-right ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(projectionGrid.netCashFlow).sort().map((year, index) => {
                      const yearData = projectionGrid.netCashFlow[year] || {};
                      const yearSum = calculateYearSum(yearData);
                      return (
                        <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                          <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                            const amount = yearData[month];
                            const isValidAmount = amount != null && isFinite(amount);
                            return (
                              <td key={month} className={`text-center px-1 py-2 ${
                                isValidAmount && amount > 0 ? styles.textGreen :
                                isValidAmount && amount < 0 ? styles.textYellow :
                                styles.textSecondary
                              }`}>
                                {isValidAmount && amount !== 0 ? amount.toFixed(0) : '-'}
                              </td>
                            );
                          })}
                          <td className={`px-2 py-2 text-right font-medium ${
                            yearSum > 0 ? styles.textGreen :
                            yearSum < 0 ? styles.textYellow :
                            styles.textSecondary
                          } ${styles.borderColor} border-l`}>
                            ${yearSum.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
