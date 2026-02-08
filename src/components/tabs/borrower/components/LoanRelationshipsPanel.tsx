// Right column: Loan relationship checkboxes, summary stats, SQL info
import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { Loan, ThemeStyles } from '../../../../types';

interface LoanRelationshipsPanelProps {
  styles: ThemeStyles;
  currentRelationship: string;
  selectedBorrowerId: number | null;
  sortedLoans: Loan[];
  currentBorrowerLoanRelationships: Record<string, { selected: boolean; role: string }>;
  selectedLoansStats: { selectedCount: number; totalLoans: number; totalExposure: number };
  toggleLoanRelationship: (loanNo: string) => void;
  changeLoanRole: (loanNo: string, role: string) => void;
}

export const LoanRelationshipsPanel: React.FC<LoanRelationshipsPanelProps> = ({
  styles,
  currentRelationship,
  selectedBorrowerId,
  sortedLoans,
  currentBorrowerLoanRelationships,
  selectedLoansStats,
  toggleLoanRelationship,
  changeLoanRole,
}) => (
  <div className="space-y-4">
    <h3 className={`font-medium ${styles.textPrimary} mb-3`}>Related Loans</h3>

    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
      <p className={`text-xs ${styles.textMuted} mb-3`}>
        Select loans and specify role for this borrower:
      </p>

      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {sortedLoans.map((loan) => {
          const loanRel = currentBorrowerLoanRelationships[loan.mwLoanNo] || { selected: false, role: 'Borrower' };
          return (
            <div
              key={loan.mwLoanNo}
              className={`flex items-center p-2 rounded ${styles.inputBorder} border transition-colors ${
                loanRel.selected ? styles.activeTabBg : styles.inactiveTabBg
              }`}
            >
              <input
                type="checkbox"
                id={`loan-${loan.mwLoanNo}`}
                checked={loanRel.selected || false}
                onChange={() => toggleLoanRelationship(loan.mwLoanNo)}
                className="mr-2"
              />
              <label
                htmlFor={`loan-${loan.mwLoanNo}`}
                className="flex-shrink-0 cursor-pointer"
              >
                <div className={`font-medium ${styles.textPrimary} text-xs`}>
                  #{loan.mwLoanNo}
                </div>
              </label>
              <div className="flex-1 flex items-center justify-between ml-3">
                <div className="flex items-center space-x-2">
                  <span className={`${styles.textGreen} font-medium text-xs`}>
                    ${loan.principal.toLocaleString()}
                  </span>
                  <span className={`${styles.textMuted} text-xs`}>
                    @ {loan.intRate}%
                  </span>
                </div>
                <select
                  value={loanRel.role}
                  onChange={(e) => changeLoanRole(loan.mwLoanNo, e.target.value)}
                  disabled={!loanRel.selected}
                  aria-label="Borrower Role"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-0.5 text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="Borrower">Borrower</option>
                  <option value="Guarantor">Guarantor</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className={`mt-4 pt-3 ${styles.borderColor} border-t`}>
        <div className="flex justify-between items-center">
          <span className={`text-xs ${styles.textMuted}`}>Selected Loans:</span>
          <span className={`text-xs font-medium ${styles.textPrimary}`}>
            {selectedLoansStats.selectedCount} of {selectedLoansStats.totalLoans}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${styles.textMuted}`}>Total Exposure:</span>
          <span className={`text-xs font-medium ${styles.textGreen}`}>
            ${selectedLoansStats.totalExposure.toLocaleString()}
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
          <p className="mt-1">SELECT * FROM borrowers WHERE relationship = '{currentRelationship}'</p>
          <p>INSERT INTO borrowers (relationship, ...) VALUES ('{currentRelationship}', ...)</p>
          <p>UPDATE borrowers SET field = value WHERE id = {selectedBorrowerId}</p>
          <p>DELETE FROM borrowers WHERE id = borrower_id</p>
        </div>
      </div>
    </div>
  </div>
);
