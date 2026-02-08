// Column 5: Address and location fields
import React from 'react';
import { US_STATES } from '../../../../data';
import type { LoanColumnProps } from '../types';

interface AddressColumnProps extends LoanColumnProps {
  handleZipChange: (value: string) => void;
  getInputStyle: (field: string) => string;
}

export const AddressColumn: React.FC<AddressColumnProps> = ({
  loan,
  styles,
  handleLoanFieldChange,
  handleZipChange,
  getInputStyle,
}) => {
  const inputClass = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div className="space-y-3">
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
        <div className="space-y-2">
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 1:</label>
            <input
              type="text"
              aria-label="Address Line 1"
              value={loan.address1 || ''}
              onChange={(e) => handleLoanFieldChange('address1', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 2:</label>
            <input
              type="text"
              aria-label="Address Line 2"
              value={loan.address2 || ''}
              onChange={(e) => handleLoanFieldChange('address2', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>City:</label>
            <input
              type="text"
              aria-label="City"
              value={loan.city || ''}
              onChange={(e) => handleLoanFieldChange('city', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>State:</label>
              <select
                aria-label="State"
                value={loan.state || ''}
                onChange={(e) => handleLoanFieldChange('state', e.target.value)}
                className={inputClass}
              >
                {US_STATES.map(state => (
                  <option key={state.code} value={state.code}>{state.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Zip:</label>
              <input
                type="text"
                aria-label="Zip Code"
                value={loan.zip || ''}
                onChange={(e) => handleZipChange(e.target.value)}
                placeholder="12345"
                maxLength={10}
                className={`${styles.inputBg} ${getInputStyle('zip')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
