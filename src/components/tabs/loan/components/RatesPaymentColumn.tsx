// Column 3: Interest rates and payment fields
import React from 'react';
import type { Loan, ThemeStyles } from '../../../../types';

interface RatesPaymentColumnProps {
  loan: Loan;
  styles: ThemeStyles;
  localIntRate: string;
  localDRate: string;
  localPmt: string;
  localEscPmt: string;
  handleCurrencyChange: (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  handleRateChange: (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  handleLoanFieldChange: (field: string, value: string | number) => void;
  setLocalIntRate: React.Dispatch<React.SetStateAction<string>>;
  setLocalDRate: React.Dispatch<React.SetStateAction<string>>;
  setLocalPmt: React.Dispatch<React.SetStateAction<string>>;
  setLocalEscPmt: React.Dispatch<React.SetStateAction<string>>;
  getInputStyle: (field: string) => string;
}

export const RatesPaymentColumn: React.FC<RatesPaymentColumnProps> = ({
  loan,
  styles,
  localIntRate,
  localDRate,
  localPmt,
  localEscPmt,
  handleCurrencyChange,
  handleRateChange,
  handleLoanFieldChange,
  setLocalIntRate,
  setLocalDRate,
  setLocalPmt,
  setLocalEscPmt,
  getInputStyle,
}) => {
  const inputClass = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;
  const inputBase = `${styles.inputBg} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div className="space-y-3">
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
        <div className="space-y-2">
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Int Rate:</label>
            <input
              type="text"
              aria-label="Interest Rate"
              value={localIntRate}
              onChange={(e) => handleRateChange('intRate', e.target.value, setLocalIntRate)}
              className={`${inputBase} ${getInputStyle('intRate')}`}
              placeholder="0.000"
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Default Rate:</label>
            <input
              type="text"
              aria-label="Default Rate"
              value={localDRate}
              onChange={(e) => handleRateChange('dRate', e.target.value, setLocalDRate)}
              className={`${inputBase} ${getInputStyle('dRate')}`}
              placeholder="0.000"
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Payment:</label>
            <input
              type="text"
              aria-label="Payment"
              value={localPmt}
              onChange={(e) => handleCurrencyChange('pmt', e.target.value, setLocalPmt)}
              className={`${inputBase} ${getInputStyle('pmt')}`}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Escrow Pmt:</label>
            <input
              type="text"
              aria-label="Escrow Payment"
              value={localEscPmt}
              onChange={(e) => handleCurrencyChange('escPmt', e.target.value, setLocalEscPmt)}
              className={`${inputBase} ${getInputStyle('escPmt')}`}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Pmt Freq:</label>
            <select
              aria-label="Payment Frequency"
              value={loan.pmtFreq}
              onChange={(e) => handleLoanFieldChange('pmtFreq', e.target.value)}
              className={inputClass}
            >
              <option value="M">M</option>
              <option value="Q">Q</option>
              <option value="SA">SA</option>
              <option value="A">A</option>
            </select>
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Unfunded Commitment:</label>
            <input
              type="text"
              aria-label="Unfunded Commitment"
              value={loan.unfundedCommitment || ''}
              onChange={(e) => handleLoanFieldChange('unfundedCommitment', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
