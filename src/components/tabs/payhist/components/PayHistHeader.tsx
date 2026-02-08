// Top header bar: loan info summary + export button
import React from 'react';
import type { Loan, ThemeStyles } from '../../../../types';

interface PayHistHeaderProps {
  styles: ThemeStyles;
  selectedLoan: string;
  selectedLoanData: Loan;
  exportPaymentHistory: () => void;
}

export const PayHistHeader: React.FC<PayHistHeaderProps> = ({
  styles,
  selectedLoan,
  selectedLoanData,
  exportPaymentHistory,
}) => (
  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div>
          <span className={`text-xs ${styles.textMuted}`}>Loan #:</span>
          <span className={`ml-2 font-medium ${styles.textPrimary}`}>{selectedLoan}</span>
        </div>
        <div>
          <span className={`text-xs ${styles.textMuted}`}>Borrower:</span>
          <span className={`ml-2 ${styles.textPrimary}`}>{selectedLoanData.borrowerName}</span>
        </div>
        <div>
          <span className={`text-xs ${styles.textMuted}`}>Current Balance:</span>
          <span className={`ml-2 font-medium ${styles.textGreen}`}>${selectedLoanData.principal.toLocaleString()}</span>
        </div>
        <div>
          <span className={`text-xs ${styles.textMuted}`}>Monthly Payment:</span>
          <span className={`ml-2 ${styles.textPrimary}`}>${selectedLoanData.pmt.toLocaleString()}</span>
        </div>
        <div>
          <span className={`text-xs ${styles.textMuted}`}>Rate:</span>
          <span className={`ml-2 ${styles.textPrimary}`}>{selectedLoanData.intRate}%</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={exportPaymentHistory}
          className={`px-4 py-1.5 ${styles.cardBg} ${styles.inputBorder} border ${styles.textPrimary} rounded transition-colors text-xs ${styles.buttonHover}`}
        >
          Export History
        </button>
      </div>
    </div>
  </div>
);
