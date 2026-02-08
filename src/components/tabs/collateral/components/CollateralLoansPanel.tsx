// Column 3: Collateral-loan relationship checkboxes, summary stats, SQL info
import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { Loan, ThemeStyles } from '../../../../types';

interface CollateralLoansPanelProps {
  styles: ThemeStyles;
  selectedLoan: string;
  selectedCollateralId: number;
  sortedLoans: Loan[];
  collateralLoanRelationships: Record<number, Record<string, boolean>> | undefined;
  securingLoansStats: { securingCount: number; totalLoans: number; totalSecured: number };
  toggleCollateralLoanRelationship: (loanNo: string) => void;
}

export const CollateralLoansPanel: React.FC<CollateralLoansPanelProps> = ({
  styles,
  selectedLoan,
  selectedCollateralId,
  sortedLoans,
  collateralLoanRelationships,
  securingLoansStats,
  toggleCollateralLoanRelationship,
}) => (
  <div className="space-y-3">
    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
      <h4 className={`text-xs ${styles.textMuted} font-medium mb-3`}>Related Loans</h4>
      <p className={`text-xs ${styles.textMuted} mb-3`}>
        Select which loans this collateral secures:
      </p>

      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {sortedLoans.map((loan) => (
          <div
            key={loan.mwLoanNo}
            className={`flex items-center p-2 rounded ${styles.inputBorder} border transition-colors ${
              collateralLoanRelationships?.[selectedCollateralId]?.[loan.mwLoanNo] ? styles.activeTabBg : styles.inactiveTabBg
            }`}
          >
            <input
              type="checkbox"
              id={`collateral-loan-${loan.mwLoanNo}`}
              checked={collateralLoanRelationships?.[selectedCollateralId]?.[loan.mwLoanNo] || false}
              onChange={() => toggleCollateralLoanRelationship(loan.mwLoanNo)}
              className="mr-2"
            />
            <label
              htmlFor={`collateral-loan-${loan.mwLoanNo}`}
              className="flex-1 cursor-pointer flex items-center justify-between"
            >
              <div className={`font-medium ${styles.textPrimary} text-xs`}>
                #{loan.mwLoanNo}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`${styles.textGreen} font-medium text-xs`}>
                  ${loan.principal.toLocaleString()}
                </span>
                <span className={`${styles.textMuted} text-xs`}>
                  @ {loan.intRate}%
                </span>
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className={`mt-4 pt-3 ${styles.borderColor} border-t`}>
        <div className="flex justify-between items-center">
          <span className={`text-xs ${styles.textMuted}`}>Securing Loans:</span>
          <span className={`text-xs font-medium ${styles.textPrimary}`}>
            {securingLoansStats.securingCount} of {securingLoansStats.totalLoans}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${styles.textMuted}`}>Total Secured:</span>
          <span className={`text-xs font-medium ${styles.textGreen}`}>
            ${securingLoansStats.totalSecured.toLocaleString()}
          </span>
        </div>
      </div>
    </div>

    {/* SQL Connection Info */}
    <div className={`${styles.alertBg} ${styles.alertBorder} rounded-lg border p-3`}>
      <div className="flex items-start">
        <AlertCircle size={16} className={`${styles.alertText} mr-2 mt-0.5`} />
        <div className={`text-xs ${styles.alertText}`}>
          <p className="font-medium">SQL Connection Points:</p>
          <p className="mt-1">SELECT * FROM collateral WHERE loan_id = '{selectedLoan}'</p>
          <p>INSERT INTO collateral (loan_id, ...) VALUES (...)</p>
          <p>UPDATE collateral SET field = value WHERE id = {selectedCollateralId}</p>
          <p>DELETE FROM collateral WHERE id = collateral_id</p>
        </div>
      </div>
    </div>
  </div>
);
