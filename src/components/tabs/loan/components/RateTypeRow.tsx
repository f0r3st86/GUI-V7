// Bottom row: Rate type information (7-column grid)
import React from 'react';
import type { Loan, ThemeStyles } from '../../../../types';

interface RateTypeRowProps {
  loan: Loan;
  styles: ThemeStyles;
  localFloor: string;
  localCeiling: string;
  localMargin: string;
  handleLoanFieldChange: (field: string, value: string | number) => void;
  handleRateChange: (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  handleDateChange: (field: string, value: string) => void;
  setLocalFloor: React.Dispatch<React.SetStateAction<string>>;
  setLocalCeiling: React.Dispatch<React.SetStateAction<string>>;
  setLocalMargin: React.Dispatch<React.SetStateAction<string>>;
  getInputStyle: (field: string) => string;
}

export const RateTypeRow: React.FC<RateTypeRowProps> = ({
  loan,
  styles,
  localFloor,
  localCeiling,
  localMargin,
  handleLoanFieldChange,
  handleRateChange,
  handleDateChange,
  setLocalFloor,
  setLocalCeiling,
  setLocalMargin,
  getInputStyle,
}) => {
  const inputClass = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;
  const inputBase = `${styles.inputBg} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
      <div className="grid grid-cols-7 gap-3">
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Rate Type:</label>
          <select
            aria-label="Rate Type"
            value={loan.rateType || ''}
            onChange={(e) => handleLoanFieldChange('rateType', e.target.value)}
            className={inputClass}
          >
            <option value="">Select</option>
            <option value="Fixed">Fixed</option>
            <option value="Variable">Variable</option>
            <option value="Adjustable">Adjustable</option>
          </select>
        </div>
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Floor:</label>
          <input
            type="text"
            aria-label="Rate Floor"
            value={localFloor}
            onChange={(e) => handleRateChange('floor', e.target.value, setLocalFloor)}
            placeholder="0.000"
            className={`${inputBase} ${getInputStyle('floor')}`}
          />
        </div>
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Ceiling:</label>
          <input
            type="text"
            aria-label="Rate Ceiling"
            value={localCeiling}
            onChange={(e) => handleRateChange('ceiling', e.target.value, setLocalCeiling)}
            placeholder="0.000"
            className={`${inputBase} ${getInputStyle('ceiling')}`}
          />
        </div>
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Margin:</label>
          <input
            type="text"
            aria-label="Rate Margin"
            value={localMargin}
            onChange={(e) => handleRateChange('margin', e.target.value, setLocalMargin)}
            placeholder="0.000"
            className={`${inputBase} ${getInputStyle('margin')}`}
          />
        </div>
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>ChDt:</label>
          <input
            type="text"
            aria-label="Change Date"
            value={loan.chDt || ''}
            onChange={(e) => handleDateChange('chDt', e.target.value)}
            placeholder="MM/DD/YY"
            className={`${inputBase} ${getInputStyle('chDt')}`}
          />
        </div>
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>ChFrq:</label>
          <input
            type="text"
            aria-label="Change Frequency"
            value={loan.chFrq || ''}
            onChange={(e) => handleLoanFieldChange('chFrq', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Index:</label>
          <select
            aria-label="Rate Index"
            value={loan.rateIndex || ''}
            onChange={(e) => handleLoanFieldChange('rateIndex', e.target.value)}
            className={inputClass}
          >
            <option value=""></option>
            <option value="LIBOR">LIBOR</option>
            <option value="SOFR">SOFR</option>
            <option value="Prime">Prime</option>
          </select>
        </div>
      </div>
    </div>
  );
};
