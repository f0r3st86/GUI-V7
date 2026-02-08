// Column 1: Property information (description, address, location, physical details)
import React from 'react';
import { US_STATES } from '../../../../data';
import type { Collateral, ThemeStyles } from '../../../../types';

interface PropertyInfoColumnProps {
  styles: ThemeStyles;
  collateral: Collateral;
  localSqft: string;
  handleCollateralFieldChange: (field: keyof Collateral, value: string) => void;
  handleIntegerChange: (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  setLocalSqft: React.Dispatch<React.SetStateAction<string>>;
  getInputStyle: (field: string) => string;
}

export const PropertyInfoColumn: React.FC<PropertyInfoColumnProps> = ({
  styles,
  collateral,
  localSqft,
  handleCollateralFieldChange,
  handleIntegerChange,
  setLocalSqft,
  getInputStyle,
}) => {
  const inputClass = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div className="space-y-3">
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
        <h4 className={`text-xs ${styles.textMuted} font-medium mb-3`}>Property Information</h4>
        <div className="space-y-2">
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Description:</label>
            <input type="text" value={collateral.description} onChange={(e) => handleCollateralFieldChange('description', e.target.value)} aria-label="Description" className={inputClass} />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Address:</label>
            <input type="text" value={collateral.address1} onChange={(e) => handleCollateralFieldChange('address1', e.target.value)} aria-label="Address" className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>City:</label>
              <input type="text" value={collateral.city} onChange={(e) => handleCollateralFieldChange('city', e.target.value)} aria-label="City" className={inputClass} />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>State:</label>
              <select value={collateral.state} onChange={(e) => handleCollateralFieldChange('state', e.target.value)} aria-label="State" className={inputClass}>
                {US_STATES.map(state => (
                  <option key={state.code} value={state.code}>{state.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Zip:</label>
              <input type="text" value={collateral.zip} onChange={(e) => handleCollateralFieldChange('zip', e.target.value)} aria-label="Zip Code" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>County:</label>
              <input type="text" value={collateral.county} onChange={(e) => handleCollateralFieldChange('county', e.target.value)} aria-label="County" className={inputClass} />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Parcel ID:</label>
              <input type="text" value={collateral.parcelId} onChange={(e) => handleCollateralFieldChange('parcelId', e.target.value)} aria-label="Parcel ID" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>SqFt:</label>
              <input
                type="text"
                value={localSqft}
                onChange={(e) => handleIntegerChange('sqft', e.target.value, setLocalSqft)}
                placeholder="0"
                aria-label="Square Feet"
                className={`${styles.inputBg} ${getInputStyle('sqft')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Acres:</label>
              <input type="text" value={collateral.acres} onChange={(e) => handleCollateralFieldChange('acres', e.target.value)} aria-label="Acres" className={inputClass} />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Year Built:</label>
              <input type="text" value={collateral.yearBuilt} onChange={(e) => handleCollateralFieldChange('yearBuilt', e.target.value)} aria-label="Year Built" className={inputClass} />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Units:</label>
              <input type="text" value={collateral.units} onChange={(e) => handleCollateralFieldChange('units', e.target.value)} aria-label="Units" className={inputClass} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
