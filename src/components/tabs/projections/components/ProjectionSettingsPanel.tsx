// Projection settings panel - payment method, rate method, expense assumptions
import React from 'react';
import { PAYMENT_METHODS, RATE_METHODS } from '../../../../data';
import type { ProjectionSettings, ThemeStyles } from '../../../../types';

interface ProjectionSettingsPanelProps {
  projSettings: ProjectionSettings;
  updateProjSetting: <K extends keyof ProjectionSettings>(key: K, value: ProjectionSettings[K]) => void;
  projectedPaymentValue: number;
  getProjectedRate: () => number;
  handleAddBackPercentageChange: (value: string) => void;
  handleAddBackPercentageBlur: (value: string) => void;
  styles: ThemeStyles;
}

export const ProjectionSettingsPanel: React.FC<ProjectionSettingsPanelProps> = ({
  projSettings,
  updateProjSetting,
  projectedPaymentValue,
  getProjectedRate,
  handleAddBackPercentageChange,
  handleAddBackPercentageBlur,
  styles,
}) => {
  const inputClass = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;
  const inputClassXs = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
      <h3 className={`font-medium mb-4 ${styles.textPrimary}`}>Projection Settings</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Payment Method Section */}
        <div>
          <h4 className={`text-sm font-medium ${styles.textPrimary} mb-2`}>Payment Method</h4>
          <select
            value={projSettings.paymentMethod}
            onChange={(e) => updateProjSetting('paymentMethod', e.target.value as typeof projSettings.paymentMethod)}
            aria-label="Payment Method"
            className={inputClass}
          >
            {PAYMENT_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          <div className={`mt-1 px-2 py-1 ${styles.readOnlyBg} rounded ${styles.inputBorder} border`}>
            <span className={`text-xs ${styles.textMuted}`}>Calc: </span>
            <span className={`text-sm font-medium ${styles.textYellow}`}>
              ${projectedPaymentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}/mo
            </span>
          </div>

          {projSettings.paymentMethod === 'User Enter' && (
            <div className="mt-2">
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Amount:</label>
              <input
                type="text"
                value={projSettings.userPayment}
                onChange={(e) => updateProjSetting('userPayment', e.target.value)}
                aria-label="User Payment Amount"
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          )}

          {projSettings.paymentMethod === 'Term Pmt' && (
            <div className="mt-2">
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Amort (mo):</label>
              <input
                type="text"
                value={projSettings.amortMonths}
                onChange={(e) => updateProjSetting('amortMonths', e.target.value)}
                aria-label="Amortization Months"
                placeholder="360"
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* Rate Method Section */}
        <div>
          <h4 className={`text-sm font-medium ${styles.textPrimary} mb-2`}>Rate Method</h4>
          <select
            value={projSettings.rateMethod}
            onChange={(e) => updateProjSetting('rateMethod', e.target.value as typeof projSettings.rateMethod)}
            aria-label="Rate Method"
            className={inputClass}
          >
            {RATE_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          <div className={`mt-1 px-2 py-1 ${styles.readOnlyBg} rounded ${styles.inputBorder} border`}>
            <span className={`text-xs ${styles.textMuted}`}>Rate: </span>
            <span className={`text-sm font-medium ${styles.textYellow}`}>{getProjectedRate().toFixed(2)}%</span>
          </div>

          {projSettings.rateMethod === 'User Enter' && (
            <div className="mt-2">
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Rate (%):</label>
              <input
                type="text"
                value={projSettings.userRate}
                onChange={(e) => updateProjSetting('userRate', e.target.value)}
                aria-label="User Rate"
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>

      {/* Expense Assumptions */}
      <div className={`mt-4 pt-3 border-t ${styles.borderColor}`}>
        <h4 className={`text-sm font-medium ${styles.textPrimary} mb-2`}>Expense Assumptions</h4>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Initial Legal ($):</label>
            <input
              type="text"
              value={projSettings.initialLegal}
              onChange={(e) => updateProjSetting('initialLegal', e.target.value)}
              aria-label="Initial Legal Cost"
              placeholder="0"
              className={inputClassXs}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Start Month:</label>
            <input
              type="text"
              value={projSettings.initialLegalStartMonth}
              onChange={(e) => updateProjSetting('initialLegalStartMonth', e.target.value)}
              aria-label="Legal Cost Start Month"
              placeholder="1"
              className={inputClassXs}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Holding Costs ($/mo):</label>
            <input
              type="text"
              value={projSettings.holdingCosts}
              onChange={(e) => updateProjSetting('holdingCosts', e.target.value)}
              aria-label="Holding Costs"
              placeholder="0"
              className={inputClassXs}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Through Month:</label>
            <input
              type="text"
              value={projSettings.holdingCostsEndMonth}
              onChange={(e) => updateProjSetting('holdingCostsEndMonth', e.target.value)}
              aria-label="Holding Costs Through Month"
              placeholder="12"
              className={inputClassXs}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Add Back Basis:</label>
            <select
              value={projSettings.addBackBasis || 'Initial Only'}
              onChange={(e) => updateProjSetting('addBackBasis', e.target.value as 'Initial Only' | 'Initial + Holding')}
              aria-label="Add Back Basis"
              className={inputClassXs}
            >
              <option value="Initial Only">Initial Only</option>
              <option value="Initial + Holding">Initial + Holding</option>
            </select>
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Recovery (%):</label>
            <input
              type="text"
              value={projSettings.addBackPercentage || ''}
              onChange={(e) => handleAddBackPercentageChange(e.target.value)}
              onBlur={(e) => handleAddBackPercentageBlur(e.target.value)}
              aria-label="Recovery Percentage"
              placeholder="0"
              className={inputClassXs}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
