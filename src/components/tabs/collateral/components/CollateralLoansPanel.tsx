// Column 3: Linked loan selector, summary stats, SQL info
// Production model (CollateralInfo): collateral belongs to the
// RELATIONSHIP (relatedLoans); optionally links to ONE loan (MWLoanNo).
import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { Loan, ThemeStyles } from '../../../../types';

interface CollateralLoansPanelProps {
  styles: ThemeStyles;
  linkedLoanNo: string;
  selectedCollateralId: number;
  sortedLoans: Loan[];
  securingLoansStats: { securingCount: number; totalLoans: number; totalSecured: number };
  setLinkedLoan: (loanNo: string) => void;
}

export const CollateralLoansPanel: React.FC<CollateralLoansPanelProps> = ({
  styles,
  linkedLoanNo,
  selectedCollateralId,
  sortedLoans,
  securingLoansStats,
  setLinkedLoan,
}) => (
  <div className="space-y-3">
    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
      <h4 className={`text-xs ${styles.textMuted} font-medium mb-3`}>Linked Loan</h4>
      <p className={`text-xs ${styles.textMuted} mb-3`}>
        Collateral belongs to the relationship; optionally link it to one specific loan:
      </p>

      <div className="space-y-1 max-h-[300px] overflow-y-auto" role="radiogroup" aria-label="Linked loan">
        <div
          className={`flex items-center p-2 rounded ${styles.inputBorder} border transition-colors ${
            !linkedLoanNo ? styles.activeTabBg : styles.inactiveTabBg
          }`}
        >
          <input
            type="radio"
            id="collateral-loan-none"
            name="linked-loan"
            checked={!linkedLoanNo}
            onChange={() => setLinkedLoan('')}
            className="mr-2"
          />
          <label htmlFor="collateral-loan-none" className={`flex-1 cursor-pointer text-xs ${styles.textPrimary}`}>
            Relationship-level only (no specific loan)
          </label>
        </div>
        {sortedLoans.map((loan) => (
          <div
            key={loan.mwLoanNo}
            className={`flex items-center p-2 rounded ${styles.inputBorder} border transition-colors ${
              linkedLoanNo === loan.mwLoanNo ? styles.activeTabBg : styles.inactiveTabBg
            }`}
          >
            <input
              type="radio"
              id={`collateral-loan-${loan.mwLoanNo}`}
              name="linked-loan"
              checked={linkedLoanNo === loan.mwLoanNo}
              onChange={() => setLinkedLoan(loan.mwLoanNo)}
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
          <span className={`text-xs ${styles.textMuted}`}>Linked Loan:</span>
          <span className={`text-xs font-medium ${styles.textPrimary}`}>
            {linkedLoanNo ? `#${linkedLoanNo}` : 'None (relationship-level)'}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${styles.textMuted}`}>Linked Loan UPB:</span>
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
          <p className="mt-1">SELECT * FROM CollateralInfo WHERE RelatedLoans = @relationship</p>
          <p>UPDATE CollateralInfo SET MWLoanNo = @loanNo WHERE MWPropertyNo = {selectedCollateralId}</p>
        </div>
      </div>
    </div>
  </div>
);
