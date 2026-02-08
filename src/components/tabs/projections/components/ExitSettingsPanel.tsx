// Exit scenario settings panel - exit method, month range, conditional inputs, value summary
import React from 'react';
import { EXIT_METHODS } from '../../../../data';
import type { ExitSettings, Loan, ThemeStyles } from '../../../../types';

interface ExitSettingsPanelProps {
  exitSettings: ExitSettings;
  updateExitSetting: <K extends keyof ExitSettings>(key: K, value: ExitSettings[K]) => void;
  startMonthInput: string;
  endMonthInput: string;
  handleStartMonthChange: (value: string) => void;
  handleEndMonthChange: (value: string) => void;
  handleStartMonthBlur: () => void;
  handleEndMonthBlur: () => void;
  calculatedExitValue: number;
  addBackValue: number;
  totalExitProceeds: number;
  selectedLoanData: Loan;
  styles: ThemeStyles;
}

export const ExitSettingsPanel: React.FC<ExitSettingsPanelProps> = ({
  exitSettings,
  updateExitSetting,
  startMonthInput,
  endMonthInput,
  handleStartMonthChange,
  handleEndMonthChange,
  handleStartMonthBlur,
  handleEndMonthBlur,
  calculatedExitValue,
  addBackValue,
  totalExitProceeds,
  selectedLoanData,
  styles,
}) => {
  const inputClass = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
      <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Exit Scenario Settings</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Cash Flow Start Month:</label>
          <input
            type="text"
            name="startMonth"
            value={startMonthInput}
            onChange={(e) => handleStartMonthChange(e.target.value)}
            onBlur={handleStartMonthBlur}
            placeholder="1"
            className={inputClass}
          />
        </div>
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Month:</label>
          <input
            type="text"
            name="endMonth"
            value={endMonthInput}
            onChange={(e) => handleEndMonthChange(e.target.value)}
            onBlur={handleEndMonthBlur}
            placeholder="24"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Method</label>
        <div className="mb-1">
          <span className={`text-xs ${styles.textMuted}`}>Exit Type:</span>
        </div>
        <select
          value={exitSettings.method}
          onChange={(e) => updateExitSetting('method', e.target.value as typeof exitSettings.method)}
          className={inputClass}
        >
          {EXIT_METHODS.map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>

      {/* Conditional inputs based on exit method */}
      {exitSettings.method === 'DPO' && (
        <div className="mt-2">
          <label className={`text-xs ${styles.textMuted} block mb-1`}>DPO %:</label>
          <input
            type="text"
            value={exitSettings.dpoPercentage}
            onChange={(e) => updateExitSetting('dpoPercentage', e.target.value)}
            placeholder="95"
            className={inputClass}
          />
        </div>
      )}

      {exitSettings.method === 'Value Cap' && (
        <div className="mt-2">
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Value Cap %:</label>
          <input
            type="text"
            value={exitSettings.valueCapPercentage}
            onChange={(e) => updateExitSetting('valueCapPercentage', e.target.value)}
            placeholder="90"
            className={inputClass}
          />
        </div>
      )}

      {exitSettings.method === 'User Enter' && (
        <div className="mt-2">
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Value ($):</label>
          <input
            type="text"
            value={exitSettings.userEnterAmount}
            onChange={(e) => updateExitSetting('userEnterAmount', e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
      )}

      {exitSettings.method === 'YTM Sell Solve' && (
        <div className="mt-2">
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Desired YTM %:</label>
          <input
            type="text"
            value={exitSettings.ytmDesired}
            onChange={(e) => updateExitSetting('ytmDesired', e.target.value)}
            placeholder="12.00"
            className={inputClass}
          />
        </div>
      )}

      {exitSettings.method === 'Liquidation' && (
        <div className="mt-2 space-y-2">
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Liquidation Months:</label>
            <input
              type="text"
              value={exitSettings.liquidationMonths}
              onChange={(e) => updateExitSetting('liquidationMonths', e.target.value)}
              placeholder="12"
              className={inputClass}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="addCurrentInterest"
              checked={exitSettings.liquidationAddInterest}
              onChange={(e) => updateExitSetting('liquidationAddInterest', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="addCurrentInterest" className={`text-xs ${styles.textPrimary}`}>
              Add interest (${selectedLoanData.interest.toLocaleString()})
            </label>
          </div>
        </div>
      )}

      {/* Exit Value Summary */}
      <div className={`mt-3 pt-3 border-t ${styles.borderColor}`}>
        <div className="grid grid-cols-3 gap-2">
          <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
            <div className={`text-xs ${styles.textMuted}`}>Exit Value</div>
            <div className={`text-sm font-medium ${calculatedExitValue < 0 ? 'text-red-500' : styles.textYellow}`}>
              ${(isFinite(calculatedExitValue) ? calculatedExitValue : 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
            </div>
          </div>
          <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
            <div className={`text-xs ${styles.textMuted}`}>Add Back Recovery</div>
            <div className={`text-sm font-medium ${styles.textYellow}`}>
              ${addBackValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
            </div>
          </div>
          <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
            <div className={`text-xs ${styles.textMuted}`}>Total Exit Proceeds</div>
            <div className={`text-sm font-medium ${styles.textGreen}`}>
              ${totalExitProceeds.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
