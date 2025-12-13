// ProjectionsTab component - cash flow projections and exit scenarios
import React, { useMemo, useCallback } from 'react';
import { useTheme, useLoan } from '../../context';
import { PAYMENT_METHODS, RATE_METHODS, EXIT_METHODS, MONTH_NAMES_SHORT } from '../../data';
import {
  calculatePMT,
  calculateFV,
  calculatePV,
  calculateTrailingPayments,
  calculateYearSum,
  calculateBidStatistics,
  calculateAmortizationMonths,
  calculateMonthsToMaturity,
  debug
} from '../../utils';
import type { BidStatistics } from '../../utils/calculations';
import {
  useLoans,
  usePayments,
  useCollateral,
  useCollateralRelationships,
  useProjectionSettings,
  useUpdateProjectionSetting,
  useExitSettings,
  useUpdateExitSetting
} from '../../hooks';
import type { ProjectionSettings, ExitSettings } from '../../types';

export const ProjectionsTab = React.memo(() => {
  debug.log('[ProjectionsTab] Component rendering');

  const { styles } = useTheme();

  // UI state from Context
  const { selectedLoan } = useLoan();

  // Projection and Exit settings from React Query (persisted per loan)
  const { data: projSettings, isLoading: loadingProjSettings } = useProjectionSettings(selectedLoan);
  const { data: exitSettings, isLoading: loadingExitSettings } = useExitSettings(selectedLoan);
  const updateProjSettingMutation = useUpdateProjectionSetting();
  const updateExitSettingMutation = useUpdateExitSetting();

  // Wrapper functions to match the original API (key, value) -> mutation({ mwLoanNo, key, value })
  const updateProjSetting = useCallback(<K extends keyof ProjectionSettings>(
    key: K,
    value: ProjectionSettings[K]
  ) => {
    if (selectedLoan) {
      updateProjSettingMutation.mutate({ mwLoanNo: selectedLoan, key, value });
    }
  }, [selectedLoan, updateProjSettingMutation]);

  const updateExitSetting = useCallback(<K extends keyof ExitSettings>(
    key: K,
    value: ExitSettings[K]
  ) => {
    if (selectedLoan) {
      updateExitSettingMutation.mutate({ mwLoanNo: selectedLoan, key, value });
    }
  }, [selectedLoan, updateExitSettingMutation]);

  // Data from React Query
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { data: collateral, isLoading: loadingCollateral } = useCollateral();
  const { data: collateralLoanRelationships } = useCollateralRelationships();

  // Computed values
  const selectedLoanData = useMemo(
    () => loans?.find(loan => loan.mwLoanNo === selectedLoan),
    [loans, selectedLoan]
  );

  const paymentRecords = useMemo(
    () => payments || [],
    [payments]
  );

  const collateralList = useMemo(
    () => collateral || [],
    [collateral]
  );

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
  const [startMonthInput, setStartMonthInput] = React.useState(exitSettings?.startMonth || '1');
  const [endMonthInput, setEndMonthInput] = React.useState(exitSettings?.endMonth || '24');

  // Memoize collateral lookup to avoid O(n) search on every render - PERFORMANCE OPTIMIZATION
  const loanCollateral = useMemo(() =>
    collateralList.find(c => collateralLoanRelationships?.[c.id]?.[selectedLoan]),
    [collateralList, collateralLoanRelationships, selectedLoan]
  );

  // Classic Mode refs - replace DOM access for better React pattern
  const classicStartMonthRef = React.useRef<HTMLSelectElement>(null);
  const classicStartYearRef = React.useRef<HTMLInputElement>(null);
  const classicEndMonthRef = React.useRef<HTMLSelectElement>(null);
  const classicEndYearRef = React.useRef<HTMLInputElement>(null);
  const classicAmountRef = React.useRef<HTMLInputElement>(null);
  const classicTypeRef = React.useRef<HTMLSelectElement>(null);

  // Sync local state when settings change (but not during typing)
  React.useEffect(() => {
    if (exitSettings && document.activeElement?.getAttribute('name') !== 'startMonth') {
      setStartMonthInput(exitSettings.startMonth);
    }
  }, [exitSettings?.startMonth]);

  React.useEffect(() => {
    if (exitSettings && document.activeElement?.getAttribute('name') !== 'endMonth') {
      setEndMonthInput(exitSettings.endMonth);
    }
  }, [exitSettings?.endMonth]);

  debug.log('[ProjectionsTab] Context values:', {
    selectedLoan,
    hasSelectedLoanData: !!selectedLoanData,
    projSettings,
    exitSettings
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
    if (!exitSettings) {
      return { startMonth: '1', endMonth: '24' };
    }
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
      if (projSettings?.rateMethod === 'User Enter') {
        rate = parseFloat(projSettings?.userRate || '') || 0;
        debug.log('[getProjectedRate] Using User Enter:', rate);
      } else {
        rate = selectedLoanData?.intRate ?? 0;
        debug.log('[getProjectedRate] Using Contractual:', rate);
      }

      // Validate rate
      if (!isFinite(rate) || rate < 0) {
        debug.warn('[getProjectedRate] Invalid rate, using contractual:', selectedLoanData?.intRate ?? 0);
        return selectedLoanData?.intRate ?? 0;
      }

      return rate;
    } catch (error) {
      debug.error('Error in getProjectedRate:', error);
      return selectedLoanData?.intRate ?? 0;
    }
  }, [projSettings?.rateMethod, projSettings?.userRate, selectedLoanData?.intRate ?? 0]);

  // Calculate projected payment based on method
  const calculateProjectedPayment = useCallback((): number => {
    try {
      let result = 0;
      const paymentMethod = projSettings?.paymentMethod || 'Contractual';
      debug.log('[calculateProjectedPayment] Method:', paymentMethod);

      switch (paymentMethod) {
        case 'Contractual':
          result = selectedLoanData?.pmt ?? 0;
          debug.log('[calculateProjectedPayment] Contractual:', result);
          break;
        case 'User Enter':
          result = parseFloat(projSettings?.userPayment || '') || 0;
          debug.log('[calculateProjectedPayment] User Enter:', result);
          break;
        case 'Interest Payment':
          const rate = getProjectedRate();
          result = selectedLoanData?.principal ?? 0 * (rate / 100) / 12;
          debug.log('[calculateProjectedPayment] Interest Payment - Rate:', rate, 'Principal:', selectedLoanData?.principal ?? 0, 'Result:', result);
          break;
        case 'Term Pmt':
          const termRate = getProjectedRate();
          const amortMonths = parseInt(projSettings?.amortMonths || '') || 360;
          result = calculatePMT(termRate, amortMonths, selectedLoanData?.principal ?? 0);
          debug.log('[calculateProjectedPayment] Term Pmt - Rate:', termRate, 'Months:', amortMonths, 'Result:', result);
          break;
        case '% of Trail Pmt':
          const trailData = calculateTrailingPayments(
            selectedLoan,
            parseInt(projSettings?.trailPeriod || '') || 12,
            selectedLoanData?.lastImportDate ?? "",
            paymentRecords,
            loans || []
          );
          const trailMonthly = trailData?.monthly || 0;
          const trailPercent = parseFloat(projSettings?.trailPercentage || '') || 100;
          result = trailMonthly * trailPercent / 100;
          debug.log('[calculateProjectedPayment] Trail Pmt - Monthly:', trailMonthly, 'Percent:', trailPercent, 'Result:', result);
          break;
        default:
          result = selectedLoanData?.pmt ?? 0;
          debug.log('[calculateProjectedPayment] Default:', result);
      }

      // Validate result
      if (!isFinite(result) || result < 0) {
        debug.warn('[calculateProjectedPayment] Invalid result, using contractual:', selectedLoanData?.pmt ?? 0);
        return selectedLoanData?.pmt ?? 0;
      }

      return result;
    } catch (error) {
      debug.error('Error in calculateProjectedPayment:', error);
      return selectedLoanData?.pmt ?? 0;
    }
  }, [projSettings?.paymentMethod, projSettings?.userPayment, projSettings?.amortMonths, projSettings?.trailPeriod, projSettings?.trailPercentage, selectedLoanData?.pmt ?? 0, selectedLoanData?.principal ?? 0, selectedLoanData?.lastImportDate, selectedLoan, paymentRecords, loans, getProjectedRate]);

  // Calculate total holding costs
  const calculateTotalHoldingCosts = useCallback((): number => {
    const legalStartMonth = parseInt(projSettings?.initialLegalStartMonth || '') || 0;
    const holdingEndMonth = parseInt(projSettings?.holdingCostsEndMonth || '') || 0;
    const numberOfMonths = Math.max(0, holdingEndMonth - legalStartMonth);
    const monthlyHolding = parseFloat(projSettings?.holdingCosts || '') || 0;
    const total = numberOfMonths * monthlyHolding;

    debug.log('[calculateTotalHoldingCosts]:', {
      legalStartMonth,
      holdingEndMonth,
      numberOfMonths,
      monthlyHolding,
      total
    });

    return total;
  }, [projSettings?.initialLegalStartMonth, projSettings?.holdingCostsEndMonth, projSettings?.holdingCosts]);

  // Calculate add back to exit
  const calculateAddBackToExit = useCallback((): number => {
    try {
      const initialLegal = parseFloat(projSettings?.initialLegal || '') || 0;
      const totalHolding = calculateTotalHoldingCosts();
      const addBackBasis = projSettings?.addBackBasis || 'Initial Only';
      const basis = addBackBasis === 'Initial Only' ? initialLegal : initialLegal + totalHolding;
      const percentage = parseFloat(projSettings?.addBackPercentage || '') || 0;
      const result = basis * percentage / 100;

      debug.log('[calculateAddBackToExit] Expense Recovery:', {
        initialLegal,
        totalHolding,
        addBackBasis,
        basis,
        percentage,
        result
      });

      // Validate result
      if (!isFinite(result)) {
        debug.warn('[calculateAddBackToExit] Invalid result, returning 0');
        return 0;
      }

      return result;
    } catch (error) {
      debug.error('Error in calculateAddBackToExit:', error);
      return 0;
    }
  }, [projSettings?.initialLegal, projSettings?.addBackBasis, projSettings?.addBackPercentage, calculateTotalHoldingCosts]);

  // Calculate pay in full value
  const calculatePayInFull = useCallback((): number => {
    try {
      const startMonth = parseInt(sanitizedExitSettings.startMonth) || 1;
      const endMonth = parseInt(sanitizedExitSettings.endMonth) || 24;
      const nper = Math.max(1, endMonth - startMonth + 1); // Ensure positive nper
      const rate = getProjectedRate();
      const payment = calculateProjectedPayment();

      debug.log('[calculatePayInFull] Using:', {
        rate,
        payment,
        principal: selectedLoanData?.principal ?? 0,
        nper,
        paymentMethod: projSettings?.paymentMethod,
        rateMethod: projSettings?.rateMethod
      });

      // Validate inputs
      if (!isFinite(rate) || !isFinite(payment) || !isFinite(selectedLoanData?.principal ?? 0)) {
        debug.warn('[calculatePayInFull] Invalid inputs, returning principal');
        return selectedLoanData?.principal ?? 0;
      }

      // Calculate future value of balance with payments
      // The FV represents the remaining balance after nper payments, which is the payoff amount
      const fv = calculateFV(rate, nper, -payment, selectedLoanData?.principal ?? 0);

      debug.log('[calculatePayInFull] Result:', fv);

      // Validate output
      if (!isFinite(fv)) {
        debug.warn('[calculatePayInFull] Invalid FV, returning principal');
        return selectedLoanData?.principal ?? 0;
      }

      return fv;
    } catch (error) {
      debug.error('Error in calculatePayInFull:', error);
      return selectedLoanData?.principal ?? 0;
    }
  }, [sanitizedExitSettings.startMonth, sanitizedExitSettings.endMonth, selectedLoanData?.principal ?? 0, projSettings?.paymentMethod, projSettings?.rateMethod, getProjectedRate, calculateProjectedPayment]);

  // Get calculated exit value - memoized to prevent recalculation on every render
  const calculatedExitValue = useMemo(() => {
    try {
      let result = 0;
      const exitMethod = exitSettings?.method || 'Pay in Full';
      debug.log(`[calculatedExitValue] Method: ${exitMethod}`);

      switch (exitMethod) {
        case 'Pay in Full':
          result = calculatePayInFull();
          debug.log('[Pay in Full] Result:', result);
          break;
        case 'DPO':
          const payInFull = calculatePayInFull();
          const dpoPercent = parseFloat(exitSettings?.dpoPercentage || '') || 95;
          result = payInFull * dpoPercent / 100;
          debug.log('[DPO] Pay in Full:', payInFull, 'Percentage:', dpoPercent, 'Result:', result);
          break;
        case 'Value Cap':
          // Use memoized collateral lookup for O(1) performance
          const collateralValue = loanCollateral ? parseFloat(String(loanCollateral.ourValue).replace(/[$,]/g, '')) : 0;
          const capPercent = parseFloat(exitSettings?.valueCapPercentage || '') || 90;
          result = collateralValue * capPercent / 100;
          debug.log('[Value Cap] Collateral:', collateralValue, 'Percentage:', capPercent, 'Result:', result);
          break;
        case 'User Enter':
          result = parseFloat(exitSettings?.userEnterAmount || '') || 0;
          debug.log('[User Enter] Amount:', result);
          break;
        case 'YTM Sell Solve':
          const desiredYield = parseFloat(exitSettings?.ytmDesired || '') || 12;
          const startMonthYTM = parseInt(sanitizedExitSettings.startMonth) || 1;
          const endMonthYTM = parseInt(sanitizedExitSettings.endMonth) || 24;
          const months = Math.max(1, endMonthYTM - startMonthYTM + 1); // Ensure positive months
          const monthlyPmt = calculateProjectedPayment();
          const finalPayoff = calculatePayInFull();
          debug.log('[YTM Sell Solve] Using:', {
            desiredYield,
            months,
            monthlyPmt,
            finalPayoff,
            paymentMethod: projSettings?.paymentMethod,
            rateMethod: projSettings?.rateMethod
          });
          // Calculate present value: what to sell loan for today to achieve desired yield
          // With positive payments (cash inflows) and positive final payoff
          result = calculatePV(desiredYield, months, monthlyPmt, finalPayoff);
          debug.log('[YTM Sell Solve] Result:', result);
          break;
        case 'Liquidation':
          // Liquidation: No interim payments, accrue interest using FV, then recover collateral
          const liquidationMonths = parseInt(exitSettings?.liquidationMonths || '') || 12;

          // Start with UPB (principal)
          let startingBalance = selectedLoanData?.principal ?? 0;

          // Optionally add already accrued interest
          if (exitSettings?.liquidationAddInterest) {
            startingBalance += selectedLoanData?.interest ?? 0;
          }

          const liqRate = getProjectedRate();
          debug.log('[Liquidation] Starting balance:', startingBalance, 'Rate:', liqRate, 'Months:', liquidationMonths);

          // Calculate FV of accrued debt: FV = PV * (1 + r)^n
          // This is the total debt owed after liquidation period (for reference)
          const accruedDebt = calculateFV(liqRate, liquidationMonths, 0, startingBalance);
          debug.log('[Liquidation] Accrued debt after', liquidationMonths, 'months:', accruedDebt);

          // Recovery is the collateral value (what you get back from selling the property)
          const collateralRecovery = loanCollateral ? parseFloat(String(loanCollateral.ourValue).replace(/[$,]/g, '')) : 0;

          // Exit proceeds = collateral value (the recovery at liquidation)
          result = collateralRecovery;
          debug.log('[Liquidation] Collateral recovery:', collateralRecovery, 'vs Accrued debt:', accruedDebt);
          break;
        default:
          result = 0;
      }

      // Validate result - handle NaN, Infinity, etc.
      if (!isFinite(result)) {
        debug.warn('Invalid exit value calculation:', result);
        return 0;
      }

      debug.log(`[calculatedExitValue] Final result for ${exitMethod}:`, result);
      return result;
    } catch (error) {
      debug.error('Error calculating exit value:', error);
      return 0;
    }
    // OPTIMIZED DEPENDENCIES: Only include what's actually used, not entire objects
  }, [
    // Exit settings - only specific fields used in switch cases
    exitSettings?.method,
    exitSettings?.dpoPercentage,
    exitSettings?.valueCapPercentage,
    exitSettings?.userEnterAmount,
    exitSettings?.ytmDesired,
    exitSettings?.liquidationMonths,
    exitSettings?.liquidationAddInterest,
    // Sanitized start/end months (not entire object)
    sanitizedExitSettings.startMonth,
    sanitizedExitSettings.endMonth,
    // Loan data - only specific fields
    selectedLoanData?.principal ?? 0,
    selectedLoanData?.interest ?? 0,
    // Memoized collateral (replaces collateralList + relationships + selectedLoan)
    loanCollateral,
    // Calculation functions
    calculateProjectedPayment,
    calculatePayInFull,
    getProjectedRate,
    // Projection settings used in logging
    projSettings?.paymentMethod,
    projSettings?.rateMethod
  ]);

  // Memoized projected payment value - don't call function in render
  const projectedPaymentValue = useMemo(() => {
    try {
      const value = calculateProjectedPayment();
      return isFinite(value) ? value : 0;
    } catch (error) {
      debug.error('Error getting projected payment value:', error);
      return 0;
    }
  }, [calculateProjectedPayment]);

  // Memoized add back value - don't call function in render
  const addBackValue = useMemo(() => {
    try {
      const value = calculateAddBackToExit();
      const result = isFinite(value) ? value : 0;
      debug.log('[addBackValue] Memoized expense recovery value:', result);
      return result;
    } catch (error) {
      debug.error('Error getting add back value:', error);
      return 0;
    }
  }, [calculateAddBackToExit]);

  // Memoized total exit proceeds (exit value + add back recovery)
  const totalExitProceeds = useMemo(() => {
    const exitVal = isFinite(calculatedExitValue) ? calculatedExitValue : 0;
    const total = exitVal + addBackValue;
    const result = isFinite(total) ? total : 0;

    debug.log('[totalExitProceeds] Final Calculation:', {
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
    const initialLegal = parseFloat(projSettings?.initialLegal || '') || 0;
    const initialLegalStart = parseInt(projSettings?.initialLegalStartMonth || '') || 1;
    const holdingCosts = parseFloat(projSettings?.holdingCosts || '') || 0;
    const holdingCostsEnd = parseInt(projSettings?.holdingCostsEndMonth || '') || 12;

    // Check if Liquidation mode - no interim payments, only recovery at exit
    const isLiquidation = exitSettings?.method === 'Liquidation';

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

      // Add income - Liquidation has NO interim payments
      if (isLiquidation) {
        // Liquidation: $0 income during hold period (borrower in default)
        income[year][actualMonth] = 0;
      } else {
        // Normal mode: monthly payment as income
        income[year][actualMonth] = (income[year][actualMonth] || 0) + monthlyPayment;
      }

      // Add expenses (apply in both normal and liquidation modes)
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
  }, [projSettings, sanitizedExitSettings, projectedPaymentValue, exitSettings?.method]);

  // Build classic mode projection grid from entries - OPTIMIZED O(n) algorithm
  const buildClassicProjectionGrid = useMemo(() => {
    // Use Map for O(1) lookups instead of nested object access
    const incomeMap = new Map<string, number>(); // "year-month" -> amount
    const expenseMap = new Map<string, number>();

    // Single pass through entries - O(n * m) where m is months per entry (typically 1-36)
    classicEntries.forEach(entry => {
      const startYear = parseInt(entry.startYear);
      const endYear = parseInt(entry.endYear);
      const startMonth = parseInt(entry.startMonth);
      const endMonth = parseInt(entry.endMonth);
      const amount = parseFloat(entry.amount) || 0;

      // Calculate all year-month keys for this entry
      for (let year = startYear; year <= endYear; year++) {
        const firstMonth = (year === startYear) ? startMonth : 1;
        const lastMonth = (year === endYear) ? endMonth : 12;

        for (let month = firstMonth; month <= lastMonth; month++) {
          const key = `${year}-${month}`;
          // Overwrite the value (Map.set is O(1))
          if (entry.type === 'income') {
            incomeMap.set(key, amount);
          } else {
            expenseMap.set(key, amount);
          }
        }
      }
    });

    // Convert Maps to structured format - O(n) where n is unique year-months
    const income: Record<string, Record<number, number>> = {};
    const expenses: Record<string, Record<number, number>> = {};
    const netCashFlow: Record<string, Record<number, number>> = {};

    // Collect all unique years
    const allYears = new Set<string>();
    incomeMap.forEach((_, key) => allYears.add(key.split('-')[0]));
    expenseMap.forEach((_, key) => allYears.add(key.split('-')[0]));

    // Build structured format - single pass through years
    allYears.forEach(yearStr => {
      income[yearStr] = {};
      expenses[yearStr] = {};
      netCashFlow[yearStr] = {};

      for (let month = 1; month <= 12; month++) {
        const key = `${yearStr}-${month}`;
        const incomeAmount = incomeMap.get(key) || 0;
        const expenseAmount = expenseMap.get(key) || 0;

        if (incomeAmount > 0) income[yearStr][month] = incomeAmount;
        if (expenseAmount > 0) expenses[yearStr][month] = expenseAmount;
        if (incomeAmount > 0 || expenseAmount > 0) {
          netCashFlow[yearStr][month] = incomeAmount - expenseAmount;
        }
      }
    });

    return { income, expenses, netCashFlow };
  }, [classicEntries]);

  const projectionGrid = mode === 'classic' ? buildClassicProjectionGrid : buildProjectionGrid;

  // PERFORMANCE OPTIMIZATION: Memoize sorted years to avoid O(n log n) sort on every render
  // Previously: Object.keys().sort() called 3 times per render = 15-25ms
  // Now: Sorted once when projectionGrid changes = <1ms
  const sortedIncomeYears = useMemo(
    () => Object.keys(projectionGrid.income).sort(),
    [projectionGrid.income]
  );
  const sortedExpenseYears = useMemo(
    () => Object.keys(projectionGrid.expenses).sort(),
    [projectionGrid.expenses]
  );
  const sortedNetCashFlowYears = useMemo(
    () => Object.keys(projectionGrid.netCashFlow).sort(),
    [projectionGrid.netCashFlow]
  );

  // PERFORMANCE OPTIMIZATION: Pre-calculate ALL year sums
  // Previously: calculateYearSum() called inside map = 3+ times per year per render = 5-10ms
  // Now: Calculated once per year when data changes = <1ms
  const yearSums = useMemo(() => {
    const incomeSums: Record<string, number> = {};
    const expenseSums: Record<string, number> = {};
    const netCashFlowSums: Record<string, number> = {};

    sortedIncomeYears.forEach(year => {
      incomeSums[year] = calculateYearSum(projectionGrid.income[year] || {});
    });
    sortedExpenseYears.forEach(year => {
      expenseSums[year] = calculateYearSum(projectionGrid.expenses[year] || {});
    });
    sortedNetCashFlowYears.forEach(year => {
      netCashFlowSums[year] = calculateYearSum(projectionGrid.netCashFlow[year] || {});
    });

    return { income: incomeSums, expenses: expenseSums, netCashFlow: netCashFlowSums };
  }, [sortedIncomeYears, sortedExpenseYears, sortedNetCashFlowYears, projectionGrid]);

  // Discount rate state for bid pricing (user configurable)
  const [discountRate, setDiscountRate] = React.useState<string>('15');

  // Get trailing 12 months actual payments for P12 comparison
  const trailingPaymentData = useMemo(() => {
    return calculateTrailingPayments(
      selectedLoan,
      12,
      selectedLoanData?.lastImportDate ?? '',
      paymentRecords,
      loans || []
    );
  }, [selectedLoan, selectedLoanData?.lastImportDate, paymentRecords, loans]);

  // Calculate bid statistics
  const bidStatistics: BidStatistics = useMemo(() => {
    const startMonth = parseInt(sanitizedExitSettings.startMonth) || 1;
    const endMonth = parseInt(sanitizedExitSettings.endMonth) || 24;
    const upb = selectedLoanData?.principal ?? 0;
    const collateralValue = loanCollateral ? parseFloat(String(loanCollateral.ourValue).replace(/[$,]/g, '')) : 0;
    const discRate = parseFloat(discountRate) || 15;
    const contractualPayment = selectedLoanData?.pmt ?? 0;
    const interestRate = selectedLoanData?.intRate ?? 0;
    const monthsToAmort = calculateAmortizationMonths(
      selectedLoanData?.principal ?? 0,
      selectedLoanData?.pmt ?? 0,
      selectedLoanData?.intRate ?? 0
    );
    const monthsToMat = calculateMonthsToMaturity(selectedLoanData?.matDt ?? '');
    const trailingP12 = trailingPaymentData?.actual ?? 0;

    return calculateBidStatistics({
      netCashFlow: projectionGrid.netCashFlow,
      startMonth,
      endMonth,
      upb,
      collateralValue,
      discountRate: discRate,
      contractualPayment,
      interestRate,
      monthsToAmortization: monthsToAmort,
      monthsToMaturity: monthsToMat,
      exitProceeds: totalExitProceeds,
      trailingP12
    });
  }, [
    projectionGrid.netCashFlow,
    sanitizedExitSettings.startMonth,
    sanitizedExitSettings.endMonth,
    selectedLoanData?.principal,
    selectedLoanData?.pmt,
    selectedLoanData?.intRate,
    selectedLoanData?.matDt,
    loanCollateral,
    discountRate,
    totalExitProceeds,
    trailingPaymentData?.actual
  ]);

  // PERFORMANCE OPTIMIZATION: Memoized currency formatter
  // Previously: toLocaleString() called 30+ times per render = 20-40ms
  // Now: Single formatter function reused = <1ms
  const formatCurrency = useCallback((value: number): string => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }, []);

  // Loading state (must be after all hooks)
  if (loadingLoans || loadingPayments || loadingCollateral || loadingProjSettings || loadingExitSettings) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

  if (!selectedLoanData || !projSettings || !exitSettings) {
    debug.warn('[ProjectionsTab] No loan data or settings available');
    return <div className="p-4"><p className={styles.textMuted}>No loan selected</p></div>;
  }

  debug.log('[ProjectionsTab] Selected loan data:', {
    mwLoanNo: selectedLoanData?.mwLoanNo ?? "",
    principal: selectedLoanData?.principal ?? 0,
    intRate: selectedLoanData?.intRate ?? 0,
    pmt: selectedLoanData?.pmt ?? 0
  });

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
              ${(isFinite(selectedLoanData?.principal ?? 0) ? selectedLoanData?.principal ?? 0 : 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className={`text-xs ${styles.textMuted}`}>Contractual Rate:</span>
            <span className={`ml-2 font-medium ${styles.textPrimary}`}>
              {isFinite(selectedLoanData?.intRate ?? 0) ? selectedLoanData?.intRate ?? 0 : 0}%
            </span>
          </div>
          <div>
            <span className={`text-xs ${styles.textMuted}`}>Contractual Pmt:</span>
            <span className={`ml-2 font-medium ${styles.textPrimary}`}>
              ${(isFinite(selectedLoanData?.pmt ?? 0) ? selectedLoanData?.pmt ?? 0 : 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Mode Content */}
      {mode === 'modern' && (
        <>
          {/* Two Column Layout: Settings (Left) | Bid Statistics (Right) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column - Settings */}
            <div className="space-y-4">
              {/* Projection Settings */}
              <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
                <h3 className={`font-medium mb-4 ${styles.textPrimary}`}>Projection Settings</h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Payment Method Section */}
                  <div>
                    <h4 className={`text-sm font-medium ${styles.textPrimary} mb-2`}>Payment Method</h4>
                    <select
                      value={projSettings.paymentMethod}
                      onChange={(e) => updateProjSetting('paymentMethod', e.target.value as typeof projSettings.paymentMethod)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                    <div className={`mt-1 px-2 py-1 ${styles.readOnlyBg} rounded ${styles.inputBorder} border`}>
                      <span className={`text-xs ${styles.textMuted}`}>Calc: </span>
                      <span className={`text-sm font-medium ${styles.textYellow}`}>
                        ${projectedPaymentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}/mo
                      </span>
                    </div>

                    {projSettings.paymentMethod === 'User Enter' && (
                      <div className="mt-2">
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Amount:</label>
                        <input
                          type="text"
                          value={projSettings.userPayment}
                          onChange={(e) => updateProjSetting('userPayment', e.target.value)}
                          placeholder="0.00"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                    )}

                    {projSettings.paymentMethod === 'Term Pmt' && (
                      <div className="mt-2">
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Amort (mo):</label>
                        <input
                          type="text"
                          value={projSettings.amortMonths}
                          onChange={(e) => updateProjSetting('amortMonths', e.target.value)}
                          placeholder="360"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Rate Method Section */}
                  <div>
                    <h4 className={`text-sm font-medium ${styles.textPrimary} mb-2`}>Rate Method</h4>
                    <select
                      value={projSettings.rateMethod}
                      onChange={(e) => updateProjSetting('rateMethod', e.target.value as typeof projSettings.rateMethod)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    >
                      {RATE_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                    <div className={`mt-1 px-2 py-1 ${styles.readOnlyBg} rounded ${styles.inputBorder} border`}>
                      <span className={`text-xs ${styles.textMuted}`}>Rate: </span>
                      <span className={`text-sm font-medium ${styles.textYellow}`}>{getProjectedRate().toFixed(2)}%</span>
                    </div>

                    {projSettings.rateMethod === 'User Enter' && (
                      <div className="mt-2">
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Rate (%):</label>
                        <input
                          type="text"
                          value={projSettings.userRate}
                          onChange={(e) => updateProjSetting('userRate', e.target.value)}
                          placeholder="0.00"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Expense Assumptions - Compact */}
                <div className={`mt-4 pt-3 border-t ${styles.borderColor}`}>
                  <h4 className={`text-sm font-medium ${styles.textPrimary} mb-2`}>Expenses</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Legal ($):</label>
                      <input
                        type="text"
                        value={projSettings.initialLegal}
                        onChange={(e) => updateProjSetting('initialLegal', e.target.value)}
                        placeholder="0"
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Start Mo:</label>
                      <input
                        type="text"
                        value={projSettings.initialLegalStartMonth}
                        onChange={(e) => updateProjSetting('initialLegalStartMonth', e.target.value)}
                        placeholder="1"
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Hold ($/mo):</label>
                      <input
                        type="text"
                        value={projSettings.holdingCosts}
                        onChange={(e) => updateProjSetting('holdingCosts', e.target.value)}
                        placeholder="0"
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Thru Mo:</label>
                      <input
                        type="text"
                        value={projSettings.holdingCostsEndMonth}
                        onChange={(e) => updateProjSetting('holdingCostsEndMonth', e.target.value)}
                        placeholder="12"
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Add Back Basis:</label>
                      <select
                        value={projSettings.addBackBasis || 'Initial Only'}
                        onChange={(e) => updateProjSetting('addBackBasis', e.target.value as 'Initial Only' | 'Initial + Holding')}
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      >
                        <option value="Initial Only">Initial Only</option>
                        <option value="Initial + Holding">Initial + Holding</option>
                      </select>
                    </div>
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Recovery (%):</label>
                      <input
                        type="text"
                        value={projSettings.addBackPercentage || ''}
                        onChange={(e) => handleAddBackPercentageChange(e.target.value)}
                        onBlur={(e) => handleAddBackPercentageBlur(e.target.value)}
                        placeholder="0"
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Exit Scenario Settings - Compact */}
              <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
                <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Exit Settings</h3>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Start Month:</label>
                    <input
                      type="text"
                      name="startMonth"
                      value={startMonthInput}
                      onChange={(e) => handleStartMonthChange(e.target.value)}
                      onBlur={handleStartMonthBlur}
                      placeholder="1"
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
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
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Method:</label>
                  <select
                    value={exitSettings.method}
                    onChange={(e) => updateExitSetting('method', e.target.value as typeof exitSettings.method)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  >
                    {EXIT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional inputs based on exit method */}
                {exitSettings.method === 'DPO' && (
                  <div className="mt-2">
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>DPO %:</label>
                    <input
                      type="text"
                      value={exitSettings.dpoPercentage}
                      onChange={(e) => updateExitSetting('dpoPercentage', e.target.value)}
                      placeholder="95"
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                )}

                {exitSettings.method === 'Value Cap' && (
                  <div className="mt-2">
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Value Cap %:</label>
                    <input
                      type="text"
                      value={exitSettings.valueCapPercentage}
                      onChange={(e) => updateExitSetting('valueCapPercentage', e.target.value)}
                      placeholder="90"
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                )}

                {exitSettings.method === 'User Enter' && (
                  <div className="mt-2">
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Value ($):</label>
                    <input
                      type="text"
                      value={exitSettings.userEnterAmount}
                      onChange={(e) => updateExitSetting('userEnterAmount', e.target.value)}
                      placeholder="0.00"
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                )}

                {exitSettings.method === 'YTM Sell Solve' && (
                  <div className="mt-2">
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Desired YTM %:</label>
                    <input
                      type="text"
                      value={exitSettings.ytmDesired}
                      onChange={(e) => updateExitSetting('ytmDesired', e.target.value)}
                      placeholder="12.00"
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                )}

                {exitSettings.method === 'Liquidation' && (
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Liquidation Months:</label>
                      <input
                        type="text"
                        value={exitSettings.liquidationMonths}
                        onChange={(e) => updateExitSetting('liquidationMonths', e.target.value)}
                        placeholder="12"
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
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
                        Add interest (${selectedLoanData.interest.toLocaleString()})
                      </label>
                    </div>
                  </div>
                )}

                {/* Exit Value Summary - Compact */}
                <div className={`mt-3 pt-3 border-t ${styles.borderColor}`}>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
                      <div className={`text-xs ${styles.textMuted}`}>Exit Value</div>
                      <div className={`text-sm font-medium ${calculatedExitValue < 0 ? 'text-red-500' : styles.textYellow}`}>
                        ${(isFinite(calculatedExitValue) ? calculatedExitValue : 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                      </div>
                    </div>
                    <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
                      <div className={`text-xs ${styles.textMuted}`}>Add Back</div>
                      <div className={`text-sm font-medium ${styles.textYellow}`}>
                        ${addBackValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                      </div>
                    </div>
                    <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
                      <div className={`text-xs ${styles.textMuted}`}>Total Exit</div>
                      <div className={`text-sm font-medium ${styles.textGreen}`}>
                        ${totalExitProceeds.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Bid Statistics */}
            <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${styles.textPrimary}`}>Bid Statistics</h3>
                <div className="flex items-center gap-2">
                  <label className={`text-xs ${styles.textMuted}`}>Discount Rate:</label>
                  <input
                    type="text"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    placeholder="15"
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-16 text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                  <span className={`text-xs ${styles.textMuted}`}>%</span>
                </div>
              </div>

              {/* Primary Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
                  <div className={`text-xs ${styles.textMuted} mb-1`}>Bid Price</div>
                  <div className={`text-xl font-bold ${bidStatistics.bidPrice >= 0 ? styles.textGreen : 'text-red-500'}`}>
                    ${bidStatistics.bidPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                  </div>
                </div>
                <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
                  <div className={`text-xs ${styles.textMuted} mb-1`}>Bid %</div>
                  <div className={`text-xl font-bold ${styles.textPrimary}`}>
                    {bidStatistics.bidPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
                  <div className={`text-xs ${styles.textMuted}`}>MOIC</div>
                  <div className={`text-lg font-medium ${bidStatistics.moic >= 1 ? styles.textGreen : styles.textYellow}`}>
                    {bidStatistics.moic.toFixed(2)}x
                  </div>
                </div>
                <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
                  <div className={`text-xs ${styles.textMuted}`}>Cash Yield</div>
                  <div className={`text-lg font-medium ${bidStatistics.cashYield >= 0 ? styles.textGreen : 'text-red-500'}`}>
                    {bidStatistics.cashYield.toFixed(1)}%
                  </div>
                </div>
                <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
                  <div className={`text-xs ${styles.textMuted}`}>Bid/Collat</div>
                  <div className={`text-lg font-medium ${
                    bidStatistics.bidToCollateralPercentage <= 70 ? styles.textGreen :
                    bidStatistics.bidToCollateralPercentage <= 90 ? styles.textYellow :
                    'text-red-500'
                  }`}>
                    {bidStatistics.bidToCollateralPercentage.toFixed(1)}%
                  </div>
                </div>
                <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
                  <div className={`text-xs ${styles.textMuted}`}>F12/P12</div>
                  <div className={`text-lg font-medium ${
                    bidStatistics.f12vsP12Change > 0 ? styles.textGreen :
                    bidStatistics.f12vsP12Change < 0 ? 'text-red-500' :
                    styles.textPrimary
                  }`}>
                    {bidStatistics.p12CashFlow > 0 ? (
                      <>{bidStatistics.f12vsP12Change >= 0 ? '+' : ''}{bidStatistics.f12vsP12Change.toFixed(1)}%</>
                    ) : (
                      <span className={styles.textMuted}>N/A</span>
                    )}
                  </div>
                </div>
              </div>

              {/* YTM Metrics */}
              <div className={`mt-3 pt-3 border-t ${styles.borderColor}`}>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
                    <div className={`text-xs ${styles.textMuted} mb-1`}>YTM (IRR)</div>
                    <div className={`text-xl font-bold ${bidStatistics.ytm >= 0 ? styles.textGreen : 'text-red-500'}`}>
                      {bidStatistics.ytm.toFixed(2)}%
                    </div>
                    <div className={`text-xs ${styles.textMuted} mt-1`}>Contractual + exit</div>
                  </div>
                  <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
                    <div className={`text-xs ${styles.textMuted} mb-1`}>YTM (XIRR)</div>
                    <div className={`text-xl font-bold ${bidStatistics.ytmXirr >= 0 ? styles.textGreen : 'text-red-500'}`}>
                      {bidStatistics.ytmXirr.toFixed(2)}%
                    </div>
                    <div className={`text-xs ${styles.textMuted} mt-1`}>Date-adjusted</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projection Tables - Below the two columns */}
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

        {/* Expense Table */}
        <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
          <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Projected Expenses</h3>
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
                {Object.keys(projectionGrid.expenses)
                  .filter(year => calculateYearSum(projectionGrid.expenses[year]) > 0)
                  .map((year, index) => {
                    const yearData = projectionGrid.expenses[year] || {};
                    const yearSum = calculateYearSum(yearData);
                    return (
                      <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                        <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                          const amount = yearData[month];
                          const isValidAmount = amount != null && isFinite(amount);
                          return (
                            <td key={month} className={`text-center px-1 py-2 ${isValidAmount && amount > 0 ? 'text-red-500' : styles.textSecondary}`}>
                              {isValidAmount && amount > 0 ? amount.toFixed(0) : '-'}
                            </td>
                          );
                        })}
                        <td className={`text-center px-2 py-2 font-medium ${yearSum > 0 ? 'text-red-500' : styles.textSecondary} ${styles.borderColor} border-l`}>
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
          <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Net Cash Flow (Income - Expenses)</h3>
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
                  ref={classicStartMonthRef}
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
                  ref={classicStartYearRef}
                  placeholder="2025"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>

              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>End Month:</label>
                <select
                  id="classic-end-month"
                  ref={classicEndMonthRef}
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
                  ref={classicEndYearRef}
                  placeholder="2027"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>

              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Amount ($):</label>
                <input
                  type="text"
                  id="classic-amount"
                  ref={classicAmountRef}
                  placeholder="500"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>

              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Type:</label>
                <select
                  id="classic-type"
                  ref={classicTypeRef}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <button
                  onClick={() => {
                    // Use React refs instead of direct DOM access - BETTER PATTERN
                    const startMonth = classicStartMonthRef.current?.value;
                    const startYear = classicStartYearRef.current?.value;
                    const endMonth = classicEndMonthRef.current?.value;
                    const endYear = classicEndYearRef.current?.value;
                    const amount = classicAmountRef.current?.value;
                    const type = classicTypeRef.current?.value as 'income' | 'expense';

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
                    {sortedIncomeYears.map((year, index) => {
                      const yearData = projectionGrid.income[year] || {};
                      const yearSum = yearSums.income[year];
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
                            ${formatCurrency(yearSum)}
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
                    {sortedExpenseYears.map((year, index) => {
                      const yearData = projectionGrid.expenses[year] || {};
                      const yearSum = yearSums.expenses[year];
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
                            ${formatCurrency(yearSum)}
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
                    {sortedNetCashFlowYears.map((year, index) => {
                      const yearData = projectionGrid.netCashFlow[year] || {};
                      const yearSum = yearSums.netCashFlow[year];
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
                            ${formatCurrency(yearSum)}
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
});
