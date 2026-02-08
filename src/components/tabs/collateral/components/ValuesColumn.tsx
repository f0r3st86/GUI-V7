// Column 2: Value fields (list/appraised/our/BPO) with $/SF calculated rows
import React from 'react';
import { calculatePerSqft } from '../../../../utils';
import type { Collateral, ThemeStyles } from '../../../../types';

interface ValuesColumnProps {
  styles: ThemeStyles;
  collateral: Collateral;
  localListPrice: string;
  localAppraisedValue: string;
  localOurValue: string;
  localBpoValue: string;
  handleCurrencyChange: (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  setLocalListPrice: React.Dispatch<React.SetStateAction<string>>;
  setLocalAppraisedValue: React.Dispatch<React.SetStateAction<string>>;
  setLocalOurValue: React.Dispatch<React.SetStateAction<string>>;
  setLocalBpoValue: React.Dispatch<React.SetStateAction<string>>;
  getInputStyle: (field: string) => string;
}

export const ValuesColumn: React.FC<ValuesColumnProps> = ({
  styles,
  collateral,
  localListPrice,
  localAppraisedValue,
  localOurValue,
  localBpoValue,
  handleCurrencyChange,
  setLocalListPrice,
  setLocalAppraisedValue,
  setLocalOurValue,
  setLocalBpoValue,
  getInputStyle,
}) => {
  const inputBase = `${styles.inputBg} border rounded px-2 py-1 w-full text-xs focus:outline-none ${styles.focusBorder}`;
  const readOnlyClass = `${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`;

  const perSqft = (value: string) =>
    value && collateral.sqft ? `$${calculatePerSqft(value, collateral.sqft)}` : '$0';

  return (
    <div className="space-y-3">
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
        <h4 className={`text-xs ${styles.textMuted} font-medium mb-3`}>Values</h4>
        <div className="grid grid-cols-4 gap-3">
          {/* Headers */}
          <div className={`text-xs ${styles.textMuted} font-medium`}>List Price</div>
          <div className={`text-xs ${styles.textMuted} font-medium`}>Appraised</div>
          <div className={`text-xs ${styles.textMuted} font-medium`}>Our Value</div>
          <div className={`text-xs ${styles.textMuted} font-medium`}>BPO</div>

          {/* Value Row */}
          <div>
            <input
              type="text" value={localListPrice}
              onChange={(e) => handleCurrencyChange('listPrice', e.target.value, setLocalListPrice)}
              placeholder="0.00" aria-label="List Price"
              className={`${inputBase} ${getInputStyle('listPrice')} ${styles.textPrimary}`}
            />
          </div>
          <div>
            <input
              type="text" value={localAppraisedValue}
              onChange={(e) => handleCurrencyChange('appraisedValue', e.target.value, setLocalAppraisedValue)}
              placeholder="0.00" aria-label="Appraised Value"
              className={`${inputBase} ${getInputStyle('appraisedValue')} ${styles.textPrimary}`}
            />
          </div>
          <div>
            <input
              type="text" value={localOurValue}
              onChange={(e) => handleCurrencyChange('ourValue', e.target.value, setLocalOurValue)}
              placeholder="0.00" aria-label="Our Value"
              className={`${inputBase} ${getInputStyle('ourValue')} ${styles.textGreen}`}
            />
          </div>
          <div>
            <input
              type="text" value={localBpoValue}
              onChange={(e) => handleCurrencyChange('bpoValue', e.target.value, setLocalBpoValue)}
              placeholder="0.00" aria-label="BPO Value"
              className={`${inputBase} ${getInputStyle('bpoValue')} ${styles.textPrimary}`}
            />
          </div>

          {/* $/SF Row */}
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
            <input type="text" value={perSqft(collateral.listPrice)} aria-label="List Price per Square Foot" className={readOnlyClass} readOnly />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
            <input type="text" value={perSqft(collateral.appraisedValue)} aria-label="Appraised Value per Square Foot" className={readOnlyClass} readOnly />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
            <input type="text" value={perSqft(collateral.ourValue)} aria-label="Our Value per Square Foot" className={readOnlyClass} readOnly />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
            <input type="text" value={perSqft(collateral.bpoValue)} aria-label="BPO per Square Foot" className={readOnlyClass} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
};
