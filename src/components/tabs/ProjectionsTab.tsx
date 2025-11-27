// ProjectionsTab component - cash flow projections and exit scenarios
import React, { useMemo } from 'react';
import { useTheme, useLoan, usePayment, useCollateral, useProjection, useExit } from '../../context';
import { PAYMENT_METHODS, RATE_METHODS, EXIT_METHODS, MONTH_NAMES_SHORT } from '../../data';
import {
  calculatePMT,
  calculateFV,
  calculatePV,
  calculateTrailingPayments,
  calculateYearSum
} from '../../utils';

// Safe number parsing helpers to prevent NaN crashes
const safeParseInt = (value: string | undefined | null, defaultValue: number = 0): number => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
};

const safeParseFloat = (value: string | undefined | null, defaultValue: number = 0): number => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const parsed = parseFloat(String(value).replace(/[$,]/g, ''));
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
};

// Safe number formatter - ensures toLocaleString never receives NaN/Infinity
const safeFormat = (value: number | undefined | null, options?: Intl.NumberFormatOptions): string => {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return '0';
  return value.toLocaleString(undefined, options);
};

// Safe toFixed wrapper
const safeToFixed = (value: number | undefined | null, digits: number = 2): string => {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return '0';
  return value.toFixed(digits);
};

export const ProjectionsTab: React.FC = () => {
  const { styles } = useTheme();
  const { selectedLoan, selectedLoanData, loans } = useLoan();
  const { paymentRecords } = usePayment();
  const { collateralList, collateralLoanRelationships } = useCollateral();
  const { settings: projSettings, updateSetting: updateProjSetting } = useProjection();
  const { settings: exitSettings, updateSetting: updateExitSetting } = useExit();

  // Get projected rate - memoized
  const projectedRate = useMemo(() => {
    try {
      if (!selectedLoanData) return 0;
      if (projSettings.rateMethod === 'User Enter') {
        return safeParseFloat(projSettings.userRate, 0);
      }
      return selectedLoanData.intRate || 0;
    } catch {
      return 0;
    }
  }, [projSettings.rateMethod, projSettings.userRate, selectedLoanData]);

  // Calculate total holding costs - memoized
  const totalHoldingCosts = useMemo(() => {
    try {
      const legalStartMonth = safeParseInt(projSettings.initialLegalStartMonth, 0);
      const holdingEndMonth = safeParseInt(projSettings.holdingCostsEndMonth, 0);
      const numberOfMonths = Math.max(0, holdingEndMonth - legalStartMonth);
      return numberOfMonths * safeParseFloat(projSettings.holdingCosts, 0);
    } catch {
      return 0;
    }
  }, [projSettings.initialLegalStartMonth, projSettings.holdingCostsEndMonth, projSettings.holdingCosts]);

  // Calculate projected payment - memoized
  const projectedPayment = useMemo(() => {
    try {
      if (!selectedLoanData) return 0;
      switch (projSettings.paymentMethod) {
        case 'Contractual':
          return selectedLoanData.pmt || 0;
        case 'User Enter':
          return safeParseFloat(projSettings.userPayment, 0);
        case 'Interest Payment':
          return (selectedLoanData.principal || 0) * (projectedRate / 100) / 12;
        case 'Term Pmt':
          return calculatePMT(projectedRate, safeParseInt(projSettings.amortMonths, 360), selectedLoanData.principal || 0);
        case '% of Trail Pmt':
          const trailData = calculateTrailingPayments(
            selectedLoan,
            safeParseInt(projSettings.trailPeriod, 12),
            selectedLoanData.lastImportDate,
            paymentRecords,
            loans
          );
          const trailMonthly = trailData?.monthly || 0;
          return trailMonthly * safeParseFloat(projSettings.trailPercentage, 100) / 100;
        default:
          return selectedLoanData.pmt || 0;
      }
    } catch {
      return selectedLoanData?.pmt || 0;
    }
  }, [projSettings.paymentMethod, projSettings.userPayment, projSettings.amortMonths, projSettings.trailPeriod, projSettings.trailPercentage, projectedRate, selectedLoanData, selectedLoan, paymentRecords, loans]);

  // Calculate add back to exit - memoized
  const addBackToExit = useMemo(() => {
    try {
      const initialLegal = safeParseFloat(projSettings.initialLegal, 0);
      const basis = projSettings.addBackBasis === 'Initial Only' ? initialLegal : initialLegal + totalHoldingCosts;
      return basis * safeParseFloat(projSettings.addBackPercentage, 0) / 100;
    } catch {
      return 0;
    }
  }, [projSettings.initialLegal, projSettings.addBackBasis, projSettings.addBackPercentage, totalHoldingCosts]);

  // Calculate pay in full value - memoized
  const payInFullValue = useMemo(() => {
    try {
      if (!selectedLoanData) return 0;
      const startMonth = safeParseInt(exitSettings.startMonth, 1);
      const endMonth = safeParseInt(exitSettings.endMonth, 24);
      const nper = Math.max(1, endMonth - startMonth + 1);
      const principal = selectedLoanData.principal || 0;

      const fv = calculateFV(projectedRate, nper, -projectedPayment, principal);
      return isNaN(fv) || !isFinite(fv) ? principal : fv + projectedPayment;
    } catch {
      return selectedLoanData?.principal || 0;
    }
  }, [exitSettings.startMonth, exitSettings.endMonth, projectedRate, projectedPayment, selectedLoanData]);

  // Get calculated exit value - memoized
  const calculatedExitValue = useMemo(() => {
    try {
      if (!selectedLoanData) return 0;
      switch (exitSettings.method) {
        case 'Pay in Full':
          return payInFullValue;
        case 'DPO':
          return payInFullValue * safeParseFloat(exitSettings.dpoPercentage, 95) / 100;
        case 'Value Cap':
          const loanCollateral = collateralList.find(c =>
            collateralLoanRelationships[c.id]?.[selectedLoan]
          );
          const collateralValue = loanCollateral ? safeParseFloat(String(loanCollateral.ourValue), 0) : 0;
          return collateralValue * safeParseFloat(exitSettings.valueCapPercentage, 90) / 100;
        case 'User Enter':
          return safeParseFloat(exitSettings.userEnterAmount, 0);
        case 'YTM Sell Solve':
          const desiredYield = safeParseFloat(exitSettings.ytmDesired, 12);
          const ytmStartMonth = safeParseInt(exitSettings.startMonth, 1);
          const ytmEndMonth = safeParseInt(exitSettings.endMonth, 24);
          const months = Math.max(1, ytmEndMonth - ytmStartMonth + 1);
          const pvResult = calculatePV(desiredYield, months, projectedPayment, payInFullValue);
          return isNaN(pvResult) || !isFinite(pvResult) ? 0 : pvResult;
        case 'Liquidation':
          const liquidationMonths = safeParseInt(exitSettings.liquidationMonths, 12);
          let balance = selectedLoanData.principal || 0;
          if (exitSettings.liquidationAddInterest) {
            balance += selectedLoanData.interest || 0;
          }
          const monthlyRate = projectedRate / 100 / 12;
          for (let i = 0; i < liquidationMonths; i++) {
            balance += balance * monthlyRate;
          }
          const col = collateralList.find(c => collateralLoanRelationships[c.id]?.[selectedLoan]);
          return col ? safeParseFloat(String(col.ourValue), balance) : balance;
        default:
          return 0;
      }
    } catch {
      return 0;
    }
  }, [exitSettings, payInFullValue, projectedPayment, projectedRate, selectedLoanData, selectedLoan, collateralList, collateralLoanRelationships]);

  if (!selectedLoanData) {
    return <div className="p-4"><p className={styles.textMuted}>No loan selected</p></div>;
  }

  // Helper functions for display (these just return the memoized values)
  const getProjectedRate = () => projectedRate;
  const calculateProjectedPayment = () => projectedPayment;
  const calculateTotalHoldingCosts = () => totalHoldingCosts;
  const calculateAddBackToExit = () => addBackToExit;
  const getCalculatedExitValue = () => calculatedExitValue;

  // Build projection grid - uses memoized values
  const buildProjectionGrid = useMemo(() => {
    const income: Record<string, Record<number, number>> = {};
    const expenses: Record<string, Record<number, number>> = {};
    const netCashFlow: Record<string, Record<number, number>> = {};

    try {
      const startMonth = safeParseInt(exitSettings.startMonth, 1);
      const endMonth = Math.min(safeParseInt(exitSettings.endMonth, 24), 60);

      // Return empty grid if invalid range
      if (startMonth > endMonth || startMonth < 1) {
        return { income, expenses, netCashFlow };
      }

      const initialLegal = safeParseFloat(projSettings.initialLegal, 0);
      const initialLegalStart = safeParseInt(projSettings.initialLegalStartMonth, 1);
      const holdingCosts = safeParseFloat(projSettings.holdingCosts, 0);
      const holdingCostsEnd = safeParseInt(projSettings.holdingCostsEndMonth, 12);

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

        // Add income (monthly payment) - use memoized value
        income[year][actualMonth] = (income[year][actualMonth] || 0) + projectedPayment;

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
    } catch {
      return { income, expenses, netCashFlow };
    }
  }, [exitSettings.startMonth, exitSettings.endMonth, projSettings.initialLegal, projSettings.initialLegalStartMonth, projSettings.holdingCosts, projSettings.holdingCostsEndMonth, projectedPayment]);

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
                  ${safeFormat(calculateProjectedPayment(), {minimumFractionDigits: 2, maximumFractionDigits: 2})}/mo
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
                <p className={`text-xs ${styles.textMuted} mt-1`}>
                  {safeToFixed(safeParseInt(projSettings.amortMonths, 360) / 12, 1)} years
                </p>
              </div>
            )}

            {projSettings.paymentMethod === '% of Trail Pmt' && (
              <div className="space-y-3">
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Trailing Period:</label>
                  <select
                    value={projSettings.trailPeriod}
                    onChange={(e) => updateProjSetting('trailPeriod', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  >
                    <option value="12">12 Months</option>
                    <option value="6">6 Months</option>
                    <option value="3">3 Months</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Percentage (%):</label>
                  <input
                    type="text"
                    value={projSettings.trailPercentage}
                    onChange={(e) => updateProjSetting('trailPercentage', e.target.value)}
                    placeholder="100"
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} ${parseFloat(projSettings.trailPercentage) < 0 || parseFloat(projSettings.trailPercentage) > 100 ? 'border-yellow-500' : ''}`}
                  />
                  {(parseFloat(projSettings.trailPercentage) < 0 || parseFloat(projSettings.trailPercentage) > 100) && (
                    <p className="text-xs text-yellow-400 mt-1">⚠️ Percentage should be 0-100</p>
                  )}
                </div>
                {/* No Payment History Warning */}
                {(() => {
                  const trailingData = calculateTrailingPayments(
                    selectedLoan,
                    safeParseInt(projSettings.trailPeriod, 12),
                    selectedLoanData?.lastImportDate,
                    paymentRecords,
                    loans
                  );
                  return trailingData && trailingData.paymentsReceived === 0 ? (
                    <div className="p-2 bg-yellow-900/30 border border-yellow-500/50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">⚠️</span>
                        <span className="text-yellow-300 text-xs">
                          No payment history available for trailing calculation. Using $0.
                        </span>
                      </div>
                    </div>
                  ) : null;
                })()}
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
                <span className={`text-sm font-medium ${styles.textYellow}`}>{safeToFixed(getProjectedRate(), 2)}%</span>
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
          {/* Holding Costs Summary */}
          <div className={`mt-3 ${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border`}>
            <span className={`text-xs ${styles.textMuted}`}>Total Holding: </span>
            <span className={`text-sm font-medium ${styles.textYellow}`}>
              {(() => {
                const legalStartMonth = safeParseInt(projSettings.initialLegalStartMonth, 0);
                const holdingEndMonth = safeParseInt(projSettings.holdingCostsEndMonth, 0);
                const numberOfMonths = Math.max(0, holdingEndMonth - legalStartMonth);
                return `${numberOfMonths} months × $${safeFormat(safeParseFloat(projSettings.holdingCosts, 0))} = $${safeFormat(calculateTotalHoldingCosts(), {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
              })()}
            </span>
          </div>
        </div>

        {/* Add Back to Exit */}
        <div className={`mt-4 pt-4 border-t border-dashed ${styles.borderColor}`}>
          <h5 className={`text-xs font-medium ${styles.textPrimary} mb-3`}>Add Back to Exit</h5>

          <div className="grid grid-cols-2 gap-6">
            {/* Add Back Percentage */}
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Recovery Percentage (%):</label>
              <input
                type="text"
                value={projSettings.addBackPercentage}
                onChange={(e) => updateProjSetting('addBackPercentage', e.target.value)}
                placeholder="0"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} ${parseFloat(projSettings.addBackPercentage) < 0 || parseFloat(projSettings.addBackPercentage) > 100 ? 'border-yellow-500' : ''}`}
              />
              {(parseFloat(projSettings.addBackPercentage) < 0 || parseFloat(projSettings.addBackPercentage) > 100) && (
                <p className="text-xs text-yellow-400 mt-1">⚠️ Percentage should be 0-100</p>
              )}
            </div>

            {/* Add Back Basis */}
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Apply To:</label>
              <select
                value={projSettings.addBackBasis}
                onChange={(e) => updateProjSetting('addBackBasis', e.target.value as typeof projSettings.addBackBasis)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              >
                <option value="Initial Only">Initial Legal Only</option>
                <option value="Initial + Holding">Initial Legal + Holding Costs</option>
              </select>
            </div>
          </div>

          {/* Show calculation */}
          <div className={`mt-3 ${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border`}>
            <div className={`text-xs ${styles.textMuted}`}>Expected Recovery at Exit:</div>
            <div className={`text-sm font-medium ${styles.textYellow} mt-1`}>
              ${safeFormat(calculateAddBackToExit(), {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <div className={`text-xs ${styles.textMuted} mt-1`}>
              {projSettings.addBackPercentage || '0'}% of {projSettings.addBackBasis === 'Initial Only'
                ? `Initial Legal ($${safeFormat(safeParseFloat(projSettings.initialLegal, 0))})`
                : `Initial + Holding ($${safeFormat(safeParseFloat(projSettings.initialLegal, 0) + calculateTotalHoldingCosts())})`
              }
            </div>
          </div>
        </div>

        {/* Projected Cash Flow Summary */}
        <div className={`mt-6 pt-4 border-t ${styles.borderColor}`}>
          <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Projected Cash Flow</h4>

          <div className="grid grid-cols-3 gap-4">
            <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
              <div className={`text-xs ${styles.textMuted} mb-1`}>Monthly Payment</div>
              <div className={`text-lg font-medium ${styles.textYellow}`}>
                ${safeFormat(calculateProjectedPayment(), {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>

            <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
              <div className={`text-xs ${styles.textMuted} mb-1`}>Effective Rate</div>
              <div className={`text-lg font-medium ${styles.textYellow}`}>
                {safeToFixed(getProjectedRate(), 2)}%
              </div>
            </div>

            <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
              <div className={`text-xs ${styles.textMuted} mb-1`}>Annual Cash Flow</div>
              <div className={`text-lg font-medium ${styles.textYellow}`}>
                ${safeFormat(calculateProjectedPayment() * 12, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
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
              onChange={(e) => updateExitSetting('startMonth', e.target.value)}
              placeholder="1"
              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Month:</label>
            <input
              type="text"
              value={exitSettings.endMonth}
              onChange={(e) => updateExitSetting('endMonth', e.target.value)}
              placeholder="24"
              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
            />
            <p className={`text-xs ${styles.textMuted} mt-1`}>
              {safeParseInt(exitSettings.endMonth, 24) - safeParseInt(exitSettings.startMonth, 1) + 1} months of cash flow
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
              <span className={`text-sm font-medium ${getCalculatedExitValue() < 0 ? 'text-red-500' : styles.textYellow}`}>
                ${safeFormat(getCalculatedExitValue(), {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
              <div className={`text-lg font-medium ${getCalculatedExitValue() < 0 ? 'text-red-500' : styles.textYellow}`}>
                ${safeFormat(getCalculatedExitValue(), {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
              <div className={`text-xs ${styles.textMuted} mb-1`}>Add Back Recovery</div>
              <div className={`text-lg font-medium ${styles.textYellow}`}>
                ${safeFormat(calculateAddBackToExit(), {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
              <div className={`text-xs ${styles.textMuted} mb-1`}>Total Exit Proceeds</div>
              <div className={`text-lg font-medium ${getCalculatedExitValue() + calculateAddBackToExit() < 0 ? 'text-red-500' : styles.textGreen}`}>
                ${safeFormat(getCalculatedExitValue() + calculateAddBackToExit(), {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
          </div>

          {/* Negative Exit Value Warning */}
          {getCalculatedExitValue() < 0 && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-lg">⚠️</span>
                <div>
                  <div className="text-red-400 font-medium text-sm">Warning: Exit value is negative</div>
                  <div className="text-red-300/70 text-xs mt-1">
                    This may indicate the loan balance exceeds the expected recovery value.
                  </div>
                </div>
              </div>
            </div>
          )}
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
                          const amount = yearData[month] || 0;
                          return (
                            <td key={month} className={`text-center px-1 py-2 ${amount > 0 ? styles.textGreen : styles.textSecondary}`}>
                              {amount > 0 ? safeToFixed(amount, 0) : '-'}
                            </td>
                          );
                        })}
                        <td className={`text-center px-2 py-2 font-medium ${yearSum > 0 ? styles.textGreen : styles.textSecondary} ${styles.borderColor} border-l`}>
                          ${safeFormat(yearSum, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
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
                  .filter(year => {
                    const yearData = projectionGrid.expenses[year] || {};
                    return calculateYearSum(yearData) > 0 || Object.values(yearData).some(v => v > 0);
                  })
                  .map((year, index) => {
                    const yearData = projectionGrid.expenses[year] || {};
                    const yearSum = calculateYearSum(yearData);
                    return (
                      <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                        <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                          const amount = yearData[month] || 0;
                          return (
                            <td key={month} className={`text-center px-1 py-2 ${amount > 0 ? 'text-red-400' : styles.textSecondary}`}>
                              {amount > 0 ? safeToFixed(amount, 0) : '-'}
                            </td>
                          );
                        })}
                        <td className={`text-center px-2 py-2 font-medium ${yearSum > 0 ? 'text-red-400' : styles.textSecondary} ${styles.borderColor} border-l`}>
                          ${safeFormat(yearSum, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
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
                        const amount = yearData[month] || 0;
                        return (
                          <td key={month} className={`text-center px-1 py-2 ${
                            amount > 0 ? styles.textGreen :
                            amount < 0 ? 'text-red-500' :
                            styles.textSecondary
                          }`}>
                            {amount !== 0 ? safeToFixed(amount, 0) : '-'}
                          </td>
                        );
                      })}
                      <td className={`text-center px-2 py-2 font-medium ${
                        yearSum > 0 ? styles.textGreen :
                        yearSum < 0 ? 'text-red-500' :
                        styles.textSecondary
                      } ${styles.borderColor} border-l`}>
                        ${safeFormat(yearSum, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
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
