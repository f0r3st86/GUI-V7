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

  // Safe handlers for input changes that sanitize before updating state
  const handleExitMonthChange = useCallback((field: 'startMonth' | 'endMonth', value: string) => {
    // Allow empty string temporarily for user to type
    if (value === '') {
      updateExitSetting(field, value);
      return;
    }

    // Only allow numeric characters
    if (!/^\d+$/.test(value)) {
      return; // Don't update if non-numeric
    }

    // Update with the value (will be sanitized on blur)
    updateExitSetting(field, value);
  }, [updateExitSetting]);

  const handleExitMonthBlur = useCallback((field: 'startMonth' | 'endMonth', value: string) => {
    // On blur, ensure we have a valid value
    const parsed = parseInt(value) || (field === 'startMonth' ? 1 : 24);
    const sanitized = Math.max(1, Math.min(60, parsed));
    updateExitSetting(field, sanitized.toString());
  }, [updateExitSetting]);

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
      } else {
        rate = selectedLoanData.intRate;
      }

      // Validate rate
      if (!isFinite(rate) || rate < 0) {
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
      switch (projSettings.paymentMethod) {
        case 'Contractual':
          result = selectedLoanData.pmt;
          break;
        case 'User Enter':
          result = parseFloat(projSettings.userPayment) || 0;
          break;
        case 'Interest Payment':
          result = selectedLoanData.principal * (getProjectedRate() / 100) / 12;
          break;
        case 'Term Pmt':
          result = calculatePMT(getProjectedRate(), parseInt(projSettings.amortMonths) || 360, selectedLoanData.principal);
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
          result = trailMonthly * (parseFloat(projSettings.trailPercentage) || 100) / 100;
          break;
        default:
          result = selectedLoanData.pmt;
      }

      // Validate result
      if (!isFinite(result) || result < 0) {
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
    return numberOfMonths * (parseFloat(projSettings.holdingCosts) || 0);
  }, [projSettings.initialLegalStartMonth, projSettings.holdingCostsEndMonth, projSettings.holdingCosts]);

  // Calculate add back to exit
  const calculateAddBackToExit = useCallback((): number => {
    try {
      const initialLegal = parseFloat(projSettings.initialLegal) || 0;
      const totalHolding = calculateTotalHoldingCosts();
      const basis = projSettings.addBackBasis === 'Initial Only' ? initialLegal : initialLegal + totalHolding;
      const result = basis * (parseFloat(projSettings.addBackPercentage) || 0) / 100;

      // Validate result
      if (!isFinite(result)) {
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

      // Validate inputs
      if (!isFinite(rate) || !isFinite(payment) || !isFinite(selectedLoanData.principal)) {
        return selectedLoanData.principal;
      }

      // Calculate future value of balance with payments
      // The FV represents the remaining balance after nper payments, which is the payoff amount
      const fv = calculateFV(rate, nper, -payment, selectedLoanData.principal);

      // Validate output
      if (!isFinite(fv)) {
        return selectedLoanData.principal;
      }

      return fv;
    } catch (error) {
      console.error('Error in calculatePayInFull:', error);
      return selectedLoanData.principal;
    }
  }, [sanitizedExitSettings.startMonth, sanitizedExitSettings.endMonth, selectedLoanData.principal, getProjectedRate, calculateProjectedPayment]);

  // Get calculated exit value - memoized to prevent recalculation on every render
  const calculatedExitValue = useMemo(() => {
    try {
      let result = 0;
      switch (exitSettings.method) {
        case 'Pay in Full':
          result = calculatePayInFull();
          break;
        case 'DPO':
          result = calculatePayInFull() * (parseFloat(exitSettings.dpoPercentage) || 95) / 100;
          break;
        case 'Value Cap':
          const loanCollateral = collateralList.find(c =>
            collateralLoanRelationships[c.id]?.[selectedLoan]
          );
          const collateralValue = loanCollateral ? parseFloat(String(loanCollateral.ourValue).replace(/[$,]/g, '')) : 0;
          result = collateralValue * (parseFloat(exitSettings.valueCapPercentage) || 90) / 100;
          break;
        case 'User Enter':
          result = parseFloat(exitSettings.userEnterAmount) || 0;
          break;
        case 'YTM Sell Solve':
          const desiredYield = parseFloat(exitSettings.ytmDesired) || 12;
          const startMonthYTM = parseInt(sanitizedExitSettings.startMonth) || 1;
          const endMonthYTM = parseInt(sanitizedExitSettings.endMonth) || 24;
          const months = Math.max(1, endMonthYTM - startMonthYTM + 1); // Ensure positive months
          const monthlyPmt = calculateProjectedPayment();
          const finalPayoff = calculatePayInFull();
          // Calculate present value: what to sell loan for today to achieve desired yield
          // With positive payments (cash inflows) and positive final payoff
          result = calculatePV(desiredYield, months, monthlyPmt, finalPayoff);
          break;
        case 'Liquidation':
          const liquidationMonths = parseInt(exitSettings.liquidationMonths) || 12;
          let balance = selectedLoanData.principal;
          if (exitSettings.liquidationAddInterest) {
            balance += selectedLoanData.interest;
          }
          // Calculate interest accrual during liquidation
          const monthlyRate = getProjectedRate() / 100 / 12;
          for (let i = 0; i < liquidationMonths; i++) {
            balance += balance * monthlyRate;
          }
          // Assume recovery at collateral value
          const col = collateralList.find(c => collateralLoanRelationships[c.id]?.[selectedLoan]);
          result = col ? parseFloat(String(col.ourValue).replace(/[$,]/g, '')) : balance;
          break;
        default:
          result = 0;
      }

      // Validate result - handle NaN, Infinity, etc.
      if (!isFinite(result)) {
        console.warn('Invalid exit value calculation:', result);
        return 0;
      }

      return result;
    } catch (error) {
      console.error('Error calculating exit value:', error);
      return 0;
    }
  }, [sanitizedExitSettings, exitSettings.method, exitSettings.dpoPercentage, exitSettings.valueCapPercentage, exitSettings.userEnterAmount, exitSettings.ytmDesired, exitSettings.liquidationMonths, exitSettings.liquidationAddInterest, selectedLoanData, collateralList, collateralLoanRelationships, selectedLoan, calculateProjectedPayment, calculatePayInFull, getProjectedRate]);

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
      return isFinite(value) ? value : 0;
    } catch (error) {
      console.error('Error getting add back value:', error);
      return 0;
    }
  }, [calculateAddBackToExit]);

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
      if (month >= initialLegalStart && month <= holdingCostsEnd) {
        monthExpense += holdingCosts;
      }
      expenses[year][actualMonth] = (expenses[year][actualMonth] || 0) + monthExpense;

      // Calculate net
      netCashFlow[year][actualMonth] = income[year][actualMonth] - expenses[year][actualMonth];
    }

    return { income, expenses, netCashFlow };
  }, [projSettings, sanitizedExitSettings, projectedPaymentValue]);

  const projectionGrid = buildProjectionGrid;

  return (
    <div className="p-4">
      {/* Loan Header Info */}
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
        <div className="flex items-center space-x-6">
          <div>
            <span className={`text-xs ${styles.textMuted}`}>Loan #:</span>
            <span className={`ml-2 font-medium ${styles.textPrimary}`}>{selectedLoan}</span>
          </div>
          <div>
            <span className={`text-xs ${styles.textMuted}`}>UPB:</span>
            <span className={`ml-2 font-medium ${styles.textGreen}`}>${selectedLoanData.principal.toLocaleString()}</span>
          </div>
          <div>
            <span className={`text-xs ${styles.textMuted}`}>Contractual Rate:</span>
            <span className={`ml-2 font-medium ${styles.textPrimary}`}>{selectedLoanData.intRate}%</span>
          </div>
          <div>
            <span className={`text-xs ${styles.textMuted}`}>Contractual Pmt:</span>
            <span className={`ml-2 font-medium ${styles.textPrimary}`}>${selectedLoanData.pmt.toLocaleString()}</span>
          </div>
        </div>
      </div>

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
              value={exitSettings.startMonth}
              onChange={(e) => handleExitMonthChange('startMonth', e.target.value)}
              onBlur={(e) => handleExitMonthBlur('startMonth', e.target.value)}
              placeholder="1"
              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Month:</label>
            <input
              type="text"
              value={exitSettings.endMonth}
              onChange={(e) => handleExitMonthChange('endMonth', e.target.value)}
              onBlur={(e) => handleExitMonthBlur('endMonth', e.target.value)}
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
                ${(() => {
                  const exitVal = isFinite(calculatedExitValue) ? calculatedExitValue : 0;
                  const total = exitVal + addBackValue;
                  return (isFinite(total) ? total : 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                })()}
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
                          return (
                            <td key={month} className={`text-center px-1 py-2 ${amount > 0 ? styles.textGreen : styles.textSecondary}`}>
                              {amount > 0 ? amount.toFixed(0) : '-'}
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
                        return (
                          <td key={month} className={`text-center px-1 py-2 ${
                            amount > 0 ? styles.textGreen :
                            amount < 0 ? 'text-red-500' :
                            styles.textSecondary
                          }`}>
                            {amount !== 0 ? amount.toFixed(0) : '-'}
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
    </div>
  );
};
