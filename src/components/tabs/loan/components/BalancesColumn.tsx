// Column 2: Balance fields with debounced currency inputs
import React from 'react';
import type { Loan, ThemeStyles } from '../../../../types';

interface BalancesColumnProps {
  loan: Loan;
  styles: ThemeStyles;
  localOrigBalance: string;
  localPrincipal: string;
  localInterest: string;
  localEscrow: string;
  localOther: string;
  handleCurrencyChange: (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  setLocalOrigBalance: React.Dispatch<React.SetStateAction<string>>;
  setLocalPrincipal: React.Dispatch<React.SetStateAction<string>>;
  setLocalInterest: React.Dispatch<React.SetStateAction<string>>;
  setLocalEscrow: React.Dispatch<React.SetStateAction<string>>;
  setLocalOther: React.Dispatch<React.SetStateAction<string>>;
  getInputStyle: (field: string) => string;
}

export const BalancesColumn: React.FC<BalancesColumnProps> = ({
  loan,
  styles,
  localOrigBalance,
  localPrincipal,
  localInterest,
  localEscrow,
  localOther,
  handleCurrencyChange,
  setLocalOrigBalance,
  setLocalPrincipal,
  setLocalInterest,
  setLocalEscrow,
  setLocalOther,
  getInputStyle,
}) => {
  const inputBase = `${styles.inputBg} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div className="space-y-3">
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
        <div className="space-y-2">
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Orig Balance:</label>
            <input
              type="text"
              aria-label="Original Balance"
              value={localOrigBalance}
              onChange={(e) => handleCurrencyChange('origBalance', e.target.value, setLocalOrigBalance)}
              className={`${inputBase} ${getInputStyle('origBalance')}`}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Principal:</label>
            <input
              type="text"
              aria-label="Principal"
              value={localPrincipal}
              onChange={(e) => handleCurrencyChange('principal', e.target.value, setLocalPrincipal)}
              className={`${inputBase} ${getInputStyle('principal')}`}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Interest:</label>
            <input
              type="text"
              aria-label="Interest"
              value={localInterest}
              onChange={(e) => handleCurrencyChange('interest', e.target.value, setLocalInterest)}
              className={`${inputBase} ${getInputStyle('interest')}`}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Escrow:</label>
            <input
              type="text"
              aria-label="Escrow"
              value={localEscrow}
              onChange={(e) => handleCurrencyChange('escrow', e.target.value, setLocalEscrow)}
              className={`${inputBase} ${getInputStyle('escrow')}`}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Other:</label>
            <input
              type="text"
              aria-label="Other"
              value={localOther}
              onChange={(e) => handleCurrencyChange('other', e.target.value, setLocalOther)}
              className={`${inputBase} ${getInputStyle('other')}`}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Total Balance:</label>
            <input
              type="text"
              aria-label="Total Balance"
              value={'$' + (loan.principal + loan.interest + loan.escrowBalance + loan.otherBalance).toLocaleString()}
              className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textGreen} font-medium focus:outline-none cursor-not-allowed`}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
};
