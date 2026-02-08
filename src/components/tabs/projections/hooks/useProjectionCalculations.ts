// Core projection calculation logic extracted from ProjectionsTab
import { useMemo, useCallback, useState } from 'react';
import {
  calculatePMT,
  calculateFV,
  calculatePV,
  calculateTrailingPayments,
  debug
} from '../../../../utils';
import type { ProjectionSettings, ExitSettings, Loan, PaymentRecord } from '../../../../types';
import type { Collateral } from '../../../../types';

interface UseProjectionCalculationsParams {
  selectedLoan: string;
  selectedLoanData: Loan | undefined;
  projSettings: ProjectionSettings | undefined;
  exitSettings: ExitSettings | undefined;
  paymentRecords: PaymentRecord[];
  loans: Loan[];
  loanCollateral: Collateral | undefined;
  updateProjSetting: <K extends keyof ProjectionSettings>(key: K, value: ProjectionSettings[K]) => void;
  updateExitSetting: <K extends keyof ExitSettings>(key: K, value: ExitSettings[K]) => void;
}

export const useProjectionCalculations = ({
  selectedLoan,
  selectedLoanData,
  projSettings,
  exitSettings,
  paymentRecords,
  loans,
  loanCollateral,
  updateProjSetting,
  updateExitSetting,
}: UseProjectionCalculationsParams) => {
  // Local state for input fields to allow empty display while keeping valid context state
  const [startMonthInput, setStartMonthInput] = useState(exitSettings?.startMonth || '1');
  const [endMonthInput, setEndMonthInput] = useState(exitSettings?.endMonth || '24');

  // Sync local state when settings change (but not during typing)
  // Note: these effects are kept here because they're tied to the input state
  // The component using this hook should NOT duplicate these effects

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

  // Safe handlers for input changes with local state
  const handleStartMonthChange = useCallback((value: string) => {
    setStartMonthInput(value);
    if (value === '') {
      updateExitSetting('startMonth', '1');
      return;
    }
    if (!/^\d+$/.test(value)) return;
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
    setEndMonthInput(value);
    if (value === '') {
      updateExitSetting('endMonth', '24');
      return;
    }
    if (!/^\d+$/.test(value)) return;
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
    if (value === '') {
      updateProjSetting('addBackPercentage', value);
      return;
    }
    if (!/^\d*\.?\d*$/.test(value)) return;
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 100) {
      updateProjSetting('addBackPercentage', '100');
      return;
    }
    updateProjSetting('addBackPercentage', value);
  }, [updateProjSetting]);

  const handleAddBackPercentageBlur = useCallback((value: string) => {
    if (value === '' || value === '.') {
      updateProjSetting('addBackPercentage', '0');
      return;
    }
    const numValue = parseFloat(value);
    const sanitized = Math.max(0, Math.min(100, numValue));
    updateProjSetting('addBackPercentage', sanitized.toString());
  }, [updateProjSetting]);

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
          break;
        case 'User Enter':
          result = parseFloat(projSettings?.userPayment || '') || 0;
          break;
        case 'Interest Payment': {
          const rate = getProjectedRate();
          result = (selectedLoanData?.principal ?? 0) * (rate / 100) / 12;
          break;
        }
        case 'Term Pmt': {
          const termRate = getProjectedRate();
          const amortMonths = parseInt(projSettings?.amortMonths || '') || 360;
          result = calculatePMT(termRate, amortMonths, selectedLoanData?.principal ?? 0);
          break;
        }
        case '% of Trail Pmt': {
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
          break;
        }
        default:
          result = selectedLoanData?.pmt ?? 0;
      }

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
    return numberOfMonths * monthlyHolding;
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
      if (!isFinite(result)) return 0;
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
      const nper = Math.max(1, endMonth - startMonth + 1);
      const rate = getProjectedRate();
      const payment = calculateProjectedPayment();

      if (!isFinite(rate) || !isFinite(payment) || !isFinite(selectedLoanData?.principal ?? 0)) {
        return selectedLoanData?.principal ?? 0;
      }

      const fv = calculateFV(rate, nper, -payment, selectedLoanData?.principal ?? 0);
      if (!isFinite(fv)) return selectedLoanData?.principal ?? 0;
      return fv;
    } catch (error) {
      debug.error('Error in calculatePayInFull:', error);
      return selectedLoanData?.principal ?? 0;
    }
  }, [sanitizedExitSettings.startMonth, sanitizedExitSettings.endMonth, selectedLoanData?.principal ?? 0, getProjectedRate, calculateProjectedPayment]);

  // Get calculated exit value
  const calculatedExitValue = useMemo(() => {
    try {
      let result = 0;
      const exitMethod = exitSettings?.method || 'Pay in Full';

      switch (exitMethod) {
        case 'Pay in Full':
          result = calculatePayInFull();
          break;
        case 'DPO': {
          const payInFull = calculatePayInFull();
          const dpoPercent = parseFloat(exitSettings?.dpoPercentage || '') || 95;
          result = payInFull * dpoPercent / 100;
          break;
        }
        case 'Value Cap': {
          const collateralValue = loanCollateral ? parseFloat(String(loanCollateral.ourValue).replace(/[$,]/g, '')) : 0;
          const capPercent = parseFloat(exitSettings?.valueCapPercentage || '') || 90;
          result = collateralValue * capPercent / 100;
          break;
        }
        case 'User Enter':
          result = parseFloat(exitSettings?.userEnterAmount || '') || 0;
          break;
        case 'YTM Sell Solve': {
          const desiredYield = parseFloat(exitSettings?.ytmDesired || '') || 12;
          const startMonthYTM = parseInt(sanitizedExitSettings.startMonth) || 1;
          const endMonthYTM = parseInt(sanitizedExitSettings.endMonth) || 24;
          const months = Math.max(1, endMonthYTM - startMonthYTM + 1);
          const monthlyPmt = calculateProjectedPayment();
          const finalPayoff = calculatePayInFull();
          result = calculatePV(desiredYield, months, monthlyPmt, finalPayoff);
          break;
        }
        case 'Liquidation': {
          const liquidationMonths = parseInt(exitSettings?.liquidationMonths || '') || 12;
          let startingBalance = selectedLoanData?.principal ?? 0;
          if (exitSettings?.liquidationAddInterest) {
            startingBalance += selectedLoanData?.interest ?? 0;
          }
          const liqRate = getProjectedRate();
          const accruedDebt = calculateFV(liqRate, liquidationMonths, 0, startingBalance);
          result = accruedDebt;
          break;
        }
        default:
          result = 0;
      }

      if (!isFinite(result)) return 0;
      return result;
    } catch (error) {
      debug.error('Error calculating exit value:', error);
      return 0;
    }
  }, [
    exitSettings?.method,
    exitSettings?.dpoPercentage,
    exitSettings?.valueCapPercentage,
    exitSettings?.userEnterAmount,
    exitSettings?.ytmDesired,
    exitSettings?.liquidationMonths,
    exitSettings?.liquidationAddInterest,
    sanitizedExitSettings.startMonth,
    sanitizedExitSettings.endMonth,
    selectedLoanData?.principal ?? 0,
    selectedLoanData?.interest ?? 0,
    loanCollateral,
    calculateProjectedPayment,
    calculatePayInFull,
    getProjectedRate,
  ]);

  // Memoized projected payment value
  const projectedPaymentValue = useMemo(() => {
    try {
      const value = calculateProjectedPayment();
      return isFinite(value) ? value : 0;
    } catch (error) {
      debug.error('Error getting projected payment value:', error);
      return 0;
    }
  }, [calculateProjectedPayment]);

  // Memoized add back value
  const addBackValue = useMemo(() => {
    try {
      const value = calculateAddBackToExit();
      return isFinite(value) ? value : 0;
    } catch (error) {
      debug.error('Error getting add back value:', error);
      return 0;
    }
  }, [calculateAddBackToExit]);

  // Memoized total exit proceeds (exit value + add back recovery)
  const totalExitProceeds = useMemo(() => {
    const exitVal = isFinite(calculatedExitValue) ? calculatedExitValue : 0;
    const total = exitVal + addBackValue;
    return isFinite(total) ? total : 0;
  }, [calculatedExitValue, addBackValue]);

  return {
    // Calculated values
    sanitizedExitSettings,
    projectedPaymentValue,
    calculatedExitValue,
    addBackValue,
    totalExitProceeds,
    getProjectedRate,

    // Input state
    startMonthInput,
    setStartMonthInput,
    endMonthInput,
    setEndMonthInput,

    // Input handlers
    handleStartMonthChange,
    handleEndMonthChange,
    handleStartMonthBlur,
    handleEndMonthBlur,
    handleAddBackPercentageChange,
    handleAddBackPercentageBlur,
  };
};
