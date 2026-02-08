// Bottom row: Read-only calculated fields (interest accrued, maturity, amortization)
import React from 'react';
import type { Loan, ThemeStyles } from '../../../../types';
import {
  calculateInterestAccrued,
  calculateMonthsToMaturity,
  calculateAmortizationMonths,
} from '../../../../utils';

interface CalculatedFieldsRowProps {
  loan: Loan;
  styles: ThemeStyles;
}

export const CalculatedFieldsRow: React.FC<CalculatedFieldsRowProps> = ({
  loan,
  styles,
}) => {
  const readOnlyClass = `${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`;

  return (
    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Months Interest Accrued:</label>
          <input
            type="text"
            aria-label="Months Interest Accrued"
            value={calculateInterestAccrued(loan.interest, loan.principal, loan.intRate)}
            className={readOnlyClass}
            readOnly
            title="Interest Balance / (Principal Balance x (Rate/12))"
          />
        </div>
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Months to Maturity:</label>
          <input
            type="text"
            aria-label="Months to Maturity"
            value={loan.matDt ? calculateMonthsToMaturity(loan.matDt) : '0'}
            className={readOnlyClass}
            readOnly
            title="Calculated from Today to Maturity Date"
          />
        </div>
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Months to Amortization:</label>
          <input
            type="text"
            aria-label="Months to Amortization"
            value={calculateAmortizationMonths(loan.principal, loan.pmt, loan.intRate)}
            className={readOnlyClass}
            readOnly
            title="NPER calculation: Months to pay off principal at current payment rate"
          />
        </div>
      </div>
    </div>
  );
};
