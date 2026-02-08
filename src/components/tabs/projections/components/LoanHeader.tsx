// Loan header info bar - displays loan number, UPB, rate, payment
import React from 'react';
import type { Loan, ThemeStyles } from '../../../../types';

interface LoanHeaderProps {
  selectedLoan: string;
  selectedLoanData: Loan;
  styles: ThemeStyles;
}

export const LoanHeader: React.FC<LoanHeaderProps> = ({ selectedLoan, selectedLoanData, styles }) => (
  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
    <div className="flex items-center space-x-6">
      <div>
        <span className={`text-xs ${styles.textMuted}`}>Loan #:</span>
        <span className={`ml-2 font-medium ${styles.textPrimary}`}>{selectedLoan}</span>
      </div>
      <div>
        <span className={`text-xs ${styles.textMuted}`}>UPB:</span>
        <span className={`ml-2 font-medium ${styles.textGreen}`}>
          ${(isFinite(selectedLoanData?.principal ?? 0) ? selectedLoanData?.principal ?? 0 : 0).toLocaleString()}
        </span>
      </div>
      <div>
        <span className={`text-xs ${styles.textMuted}`}>Contractual Rate:</span>
        <span className={`ml-2 font-medium ${styles.textPrimary}`}>
          {isFinite(selectedLoanData?.intRate ?? 0) ? selectedLoanData?.intRate ?? 0 : 0}%
        </span>
      </div>
      <div>
        <span className={`text-xs ${styles.textMuted}`}>Contractual Pmt:</span>
        <span className={`ml-2 font-medium ${styles.textPrimary}`}>
          ${(isFinite(selectedLoanData?.pmt ?? 0) ? selectedLoanData?.pmt ?? 0 : 0).toLocaleString()}
        </span>
      </div>
    </div>
  </div>
);
