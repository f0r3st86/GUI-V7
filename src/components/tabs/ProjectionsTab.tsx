// ProjectionsTab component - cash flow projections and exit scenarios
import React, { useMemo } from 'react';
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

  if (!selectedLoanData) {
    return <div className="p-4"><p className={styles.textMuted}>No loan selected</p></div>;
  }

  // Calculate projected payment based on method
  const calculateProjectedPayment = (): number => {
    switch (projSettings.paymentMethod) {
      case 'Contractual':
        return selectedLoanData.pmt;
      case 'User Enter':
        return parseFloat(projSettings.userPayment) || 0;
      case 'Interest Payment':
        return selectedLoanData.principal * (getProjectedRate() / 100) / 12;
      case 'Term Pmt':
        return calculatePMT(getProjectedRate(), parseInt(projSettings.amortMonths) || 360, selectedLoanData.principal);
      case '% of Trail Pmt':
        const trailData = calculateTrailingPayments(
          selectedLoan,
          parseInt(projSettings.trailPeriod) || 12,
          selectedLoanData.lastImportDate,
          paymentRecords,
          loans
        );
        const trailMonthly = trailData?.monthly || 0;
        return trailMonthly * (parseFloat(projSettings.trailPercentage) || 100) / 100;
      default:
        return selectedLoanData.pmt;
    }
  };

  // Get projected rate
  const getProjectedRate = (): number => {
    if (projSettings.rateMethod === 'User Enter') {
      return parseFloat(projSettings.userRate) || 0;
    }
    return selectedLoanData.intRate;
  };

  // Calculate total holding costs
  const calculateTotalHoldingCosts = (): number => {
    const legalStartMonth = parseInt(projSettings.initialLegalStartMonth) || 0;
    const holdingEndMonth = parseInt(projSettings.holdingCostsEndMonth) || 0;
    const numberOfMonths = Math.max(0, holdingEndMonth - legalStartMonth);
    return numberOfMonths * (parseFloat(projSettings.holdingCosts) || 0);
  };

  // Calculate add back to exit
  const calculateAddBackToExit = (): number => {
    const initialLegal = parseFloat(projSettings.initialLegal) || 0;
    const totalHolding = calculateTotalHoldingCosts();
    const basis = projSettings.addBackBasis === 'Initial Only' ? initialLegal : initialLegal + totalHolding;
    return basis * (parseFloat(projSettings.addBackPercentage) || 0) / 100;
  };

  // Calculate pay in full value
  const calculatePayInFull = (): number => {
    const startMonth = parseInt(exitSettings.startMonth) || 1;
    const endMonth = parseInt(exitSettings.endMonth) || 24;
    const nper = Math.max(1, endMonth - startMonth + 1); // Ensure positive nper
    const rate = getProjectedRate();
    const payment = calculateProjectedPayment();

    // Calculate future value of balance with payments
    // The FV represents the remaining balance after nper payments, which is the payoff amount
    const fv = calculateFV(rate, nper, -payment, selectedLoanData.principal);
    return fv;
  };

  // Get calculated exit value
  const getCalculatedExitValue = (): number => {
    try {
      switch (exitSettings.method) {
        case 'Pay in Full':
          return calculatePayInFull();
        case 'DPO':
          return calculatePayInFull() * (parseFloat(exitSettings.dpoPercentage) || 95) / 100;
        case 'Value Cap':
          const loanCollateral = collateralList.find(c =>
            collateralLoanRelationships[c.id]?.[selectedLoan]
          );
          const collateralValue = loanCollateral ? parseFloat(String(loanCollateral.ourValue).replace(/[$,]/g, '')) : 0;
          return collateralValue * (parseFloat(exitSettings.valueCapPercentage) || 90) / 100;
        case 'User Enter':
          return parseFloat(exitSettings.userEnterAmount) || 0;
        case 'YTM Sell Solve':
          const desiredYield = parseFloat(exitSettings.ytmDesired) || 12;
          const startMonthYTM = parseInt(exitSettings.startMonth) || 1;
          const endMonthYTM = parseInt(exitSettings.endMonth) || 24;
          const months = Math.max(1, endMonthYTM - startMonthYTM + 1); // Ensure positive months
          const monthlyPmt = calculateProjectedPayment();
          const finalPayoff = calculatePayInFull();
          // Calculate present value: what to sell loan for today to achieve desired yield
          // With positive payments (cash inflows) and positive final payoff
          return calculatePV(desiredYield, months, monthlyPmt, finalPayoff);
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
          return col ? parseFloat(String(col.ourValue).replace(/[$,]/g, '')) : balance;
        default:
          return 0;
      }
    } catch (error) {
      console.error('Error calculating exit value:', error);
      return 0;
    }
  };

  // Build projection grid
  const buildProjectionGrid = useMemo(() => {
    const income: Record<string, Record<number, number>> = {};
    const expenses: Record<string, Record<number, number>> = {};
    const netCashFlow: Record<string, Record<number, number>> = {};

    const startMonth = parseInt(exitSettings.startMonth) || 1;
    const endMonth = Math.min(Math.max(1, parseInt(exitSettings.endMonth) || 24), 60); // Ensure valid range
    const monthlyPayment = calculateProjectedPayment();
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
  }, [projSettings, exitSettings, selectedLoanData]);

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
                  ${calculateProjectedPayment().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}/mo
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
              {(() => {
                const start = parseInt(exitSettings.startMonth) || 1;
                const end = parseInt(exitSettings.endMonth) || 24;
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
              <span className={`text-sm font-medium ${getCalculatedExitValue() < 0 ? 'text-red-500' : styles.textYellow}`}>
                ${getCalculatedExitValue().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                ${getCalculatedExitValue().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
              <div className={`text-xs ${styles.textMuted} mb-1`}>Add Back Recovery</div>
              <div className={`text-lg font-medium ${styles.textYellow}`}>
                ${calculateAddBackToExit().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
              <div className={`text-xs ${styles.textMuted} mb-1`}>Total Exit Proceeds</div>
              <div className={`text-lg font-medium ${styles.textGreen}`}>
                ${(getCalculatedExitValue() + calculateAddBackToExit()).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
