// Bottom row: Loan type classification fields
import React from 'react';
import type { LoanColumnProps } from '../types';

export const LoanTypeRow: React.FC<LoanColumnProps> = ({
  loan,
  styles,
  handleLoanFieldChange,
}) => {
  const inputClass = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Ah/Bhd:</label>
          <input
            type="text"
            aria-label="Ahead Behind"
            value={loan.ahBhd || ''}
            onChange={(e) => handleLoanFieldChange('ahBhd', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>AssetType:</label>
          <select
            aria-label="Asset Type"
            value={loan.assetType || ''}
            onChange={(e) => handleLoanFieldChange('assetType', e.target.value)}
            className={inputClass}
          >
            <option value=""></option>
            <option value="Commercial RE">Commercial RE</option>
            <option value="Residential">Residential</option>
            <option value="Multi-family">Multi-family</option>
            <option value="Land">Land</option>
            <option value="Construction">Construction</option>
          </select>
        </div>
        <div>
          {/* Empty cell for consistent 3-column layout */}
        </div>
      </div>
    </div>
  );
};
