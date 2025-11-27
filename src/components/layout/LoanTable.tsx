// LoanTable component - displays the relationship loans grid
import React from 'react';
import { useTheme, useLoan, getStatusColor } from '../../context';
import type { Loan } from '../../types';

export const LoanTable: React.FC = () => {
  const { theme, styles } = useTheme();
  const { loans, selectedLoan, setSelectedLoan, currentRelationship } = useLoan();

  // Filter loans by current relationship
  const relationshipLoans = loans.filter(
    loan => loan.relatedLoans === currentRelationship
  );

  // Handle loan selection
  const handleLoanClick = (loan: Loan) => {
    setSelectedLoan(loan.mwLoanNo);
  };

  return (
    <div className={`${styles.headerBg} ${styles.borderColor} border-b`}>
      {/* Relationship Label */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <span className={`text-sm font-medium ${styles.textPrimary}`}>
            Relationship: {currentRelationship || 'None'}
          </span>
          <span className={`ml-3 text-xs ${styles.textMuted}`}>
            ({relationshipLoans.length} loans)
          </span>
        </div>
      </div>

      {/* Loan Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={`${styles.borderColor} border-b ${styles.tableHeaderBg}`}>
              <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium`}>Loan No</th>
              <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium`}>Borrower</th>
              <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium`}>Principal</th>
              <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium`}>Interest</th>
              <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium`}>Total</th>
              <th className={`text-center px-3 py-2 ${styles.textMuted} font-medium`}>Rate</th>
              <th className={`text-center px-3 py-2 ${styles.textMuted} font-medium`}>PMT</th>
              <th className={`text-center px-3 py-2 ${styles.textMuted} font-medium`}>Status</th>
              <th className={`text-center px-3 py-2 ${styles.textMuted} font-medium`}>Change</th>
            </tr>
          </thead>
          <tbody>
            {relationshipLoans.map((loan) => (
              <tr
                key={loan.mwLoanNo}
                onClick={() => handleLoanClick(loan)}
                className={`${styles.borderColor} border-b cursor-pointer transition-colors ${
                  loan.mwLoanNo === selectedLoan
                    ? styles.selectedBg + ' ' + styles.selectedHoverBg
                    : styles.hoverBg
                }`}
              >
                <td className={`px-3 py-2 font-medium ${
                  loan.mwLoanNo === selectedLoan ? styles.textGreen : styles.textPrimary
                }`}>
                  {loan.mwLoanNo}
                </td>
                <td className={`px-3 py-2 ${styles.textPrimary}`}>
                  {loan.borrowerName}
                </td>
                <td className={`px-3 py-2 text-right ${styles.textPrimary}`}>
                  ${loan.principal.toLocaleString()}
                </td>
                <td className={`px-3 py-2 text-right ${styles.textMuted}`}>
                  ${loan.interest.toLocaleString()}
                </td>
                <td className={`px-3 py-2 text-right ${styles.textGreen} font-medium`}>
                  ${(loan.principal + loan.interest).toLocaleString()}
                </td>
                <td className={`px-3 py-2 text-center ${styles.textPrimary}`}>
                  {loan.intRate}%
                </td>
                <td className={`px-3 py-2 text-center ${styles.textPrimary}`}>
                  ${loan.pmt.toLocaleString()}
                </td>
                <td className={`px-3 py-2 text-center font-medium ${getStatusColor(loan.status, theme)}`}>
                  {loan.status || '-'}
                </td>
                <td className={`px-3 py-2 text-center ${
                  loan.change > 0
                    ? styles.textGreen
                    : loan.change < 0
                      ? 'text-red-500'
                      : styles.textMuted
                }`}>
                  {loan.change > 0 ? '+' : ''}{loan.change}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
