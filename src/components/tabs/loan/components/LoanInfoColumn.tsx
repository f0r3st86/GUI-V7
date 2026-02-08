// Column 1: Loan identification and status fields
import React from 'react';
import type { LoanColumnProps } from '../types';

interface LoanInfoColumnProps extends LoanColumnProps {
  handleDateChange: (field: string, value: string) => void;
  getInputStyle: (field: string) => string;
}

export const LoanInfoColumn: React.FC<LoanInfoColumnProps> = ({
  loan,
  styles,
  handleLoanFieldChange,
  handleDateChange,
  getInputStyle,
}) => {
  const inputClass = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div className="space-y-3">
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
        <div className="space-y-2">
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>MW Loan #:</label>
            <input
              type="text"
              aria-label="MW Loan Number"
              value={loan.mwLoanNo}
              readOnly
              className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none cursor-not-allowed`}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Borrower:</label>
            <input
              type="text"
              aria-label="Borrower"
              value={loan.borrowerName}
              onChange={(e) => handleLoanFieldChange('borrowerName', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Relationship:</label>
            <input
              type="text"
              aria-label="Relationship"
              value={loan.relatedLoans}
              onChange={(e) => handleLoanFieldChange('relatedLoans', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Pool:</label>
            <input
              type="text"
              aria-label="Pool"
              value={loan.pool || ''}
              onChange={(e) => handleLoanFieldChange('pool', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Status:</label>
            <select
              aria-label="Status"
              value={loan.status || ''}
              onChange={(e) => handleLoanFieldChange('status', e.target.value)}
              className={inputClass}
            >
              <option value="">Select</option>
              <option value="PA">PA - Performing Asset</option>
              <option value="FA">FA - Fully Performing</option>
              <option value="FC">FC - Foreclosure</option>
              <option value="JG">JG - Judgment</option>
              <option value="LT">LT - Litigation</option>
              <option value="BK">BK - Bankruptcy</option>
              <option value="REO">REO - Real Estate Owned</option>
            </select>
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Last Import:</label>
            <input
              type="text"
              aria-label="Last Import Date"
              value={loan.lastImportDate || ''}
              onChange={(e) => handleDateChange('lastImportDate', e.target.value)}
              placeholder="MM/DD/YY"
              className={`${styles.inputBg} ${getInputStyle('lastImportDate')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
