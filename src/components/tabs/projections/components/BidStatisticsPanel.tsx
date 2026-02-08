// Bid statistics display panel - shared between Modern and Classic modes
import React from 'react';
import type { BidStatistics } from '../../../../utils/calculations';
import type { ThemeStyles } from '../../../../types';

interface BidStatisticsPanelProps {
  bidStatistics: BidStatistics;
  discountRate: string;
  setDiscountRate: (value: string) => void;
  styles: ThemeStyles;
  compact?: boolean;
}

export const BidStatisticsPanel: React.FC<BidStatisticsPanelProps> = ({
  bidStatistics,
  discountRate,
  setDiscountRate,
  styles,
  compact = false,
}) => {
  const metricSize = compact ? 'text-lg' : 'text-xl';
  const secondarySize = compact ? 'text-base' : 'text-lg';
  const gap = compact ? 'gap-2' : 'gap-3';
  const padding = compact ? 'p-2' : 'p-3';

  return (
    <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border ${compact ? 'h-fit sticky top-4' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-medium ${styles.textPrimary}`}>Bid Statistics</h3>
        <div className="flex items-center gap-2">
          <label className={`text-xs ${styles.textMuted}`}>{compact ? 'Disc:' : 'Discount Rate:'}</label>
          <input
            type="text"
            value={discountRate}
            onChange={(e) => setDiscountRate(e.target.value)}
            placeholder="15"
            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 ${compact ? 'w-12' : 'w-16'} text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
          />
          <span className={`text-xs ${styles.textMuted}`}>%</span>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className={`grid grid-cols-2 ${gap}`}>
        <div className={`${styles.readOnlyBg} rounded ${padding} ${styles.inputBorder} border`}>
          <div className={`text-xs ${styles.textMuted} mb-1`}>Bid Price</div>
          <div className={`${metricSize} font-bold ${bidStatistics.bidPrice >= 0 ? styles.textGreen : styles.textRed}`}>
            ${bidStatistics.bidPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
        </div>
        <div className={`${styles.readOnlyBg} rounded ${padding} ${styles.inputBorder} border`}>
          <div className={`text-xs ${styles.textMuted} mb-1`}>Bid %</div>
          <div className={`${metricSize} font-bold ${styles.textPrimary}`}>
            {bidStatistics.bidPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className={`grid grid-cols-${compact ? '2' : '4'} ${gap} mt-${compact ? '2' : '3'}`}>
        <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
          <div className={`text-xs ${styles.textMuted}`}>MOIC</div>
          <div className={`${secondarySize} font-medium ${bidStatistics.moic >= 1 ? styles.textGreen : styles.textYellow}`}>
            {bidStatistics.moic.toFixed(2)}x
          </div>
        </div>
        <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
          <div className={`text-xs ${styles.textMuted}`}>Cash Yield</div>
          <div className={`${secondarySize} font-medium ${bidStatistics.cashYield >= 0 ? styles.textGreen : styles.textRed}`}>
            {bidStatistics.cashYield.toFixed(1)}%
          </div>
        </div>
        <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
          <div className={`text-xs ${styles.textMuted}`}>Bid/Collat</div>
          <div className={`${secondarySize} font-medium ${
            bidStatistics.bidToCollateralPercentage <= 70 ? styles.textGreen :
            bidStatistics.bidToCollateralPercentage <= 90 ? styles.textYellow :
            styles.textRed
          }`}>
            {bidStatistics.bidToCollateralPercentage.toFixed(1)}%
          </div>
        </div>
        <div className={`${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border text-center`}>
          <div className={`text-xs ${styles.textMuted}`}>F12/P12</div>
          <div className={`${secondarySize} font-medium ${
            bidStatistics.f12vsP12Change > 0 ? styles.textGreen :
            bidStatistics.f12vsP12Change < 0 ? styles.textRed :
            styles.textPrimary
          }`}>
            {bidStatistics.p12CashFlow > 0 ? (
              <>{bidStatistics.f12vsP12Change >= 0 ? '+' : ''}{bidStatistics.f12vsP12Change.toFixed(1)}%</>
            ) : (
              <span className={styles.textMuted}>N/A</span>
            )}
          </div>
        </div>
      </div>

      {/* YTM Metrics */}
      <div className={`mt-3 pt-3 border-t ${styles.borderColor}`}>
        <div className={`grid grid-cols-2 ${gap}`}>
          <div className={`${styles.readOnlyBg} rounded ${padding} ${styles.inputBorder} border`}>
            <div className={`text-xs ${styles.textMuted} mb-1`}>YTM (IRR)</div>
            <div className={`${metricSize} font-bold ${bidStatistics.ytm >= 0 ? styles.textGreen : styles.textRed}`}>
              {bidStatistics.ytm.toFixed(2)}%
            </div>
            {!compact && <div className={`text-xs ${styles.textMuted} mt-1`}>Contractual + exit</div>}
          </div>
          <div className={`${styles.readOnlyBg} rounded ${padding} ${styles.inputBorder} border`}>
            <div className={`text-xs ${styles.textMuted} mb-1`}>YTM (XIRR)</div>
            <div className={`${metricSize} font-bold ${bidStatistics.ytmXirr >= 0 ? styles.textGreen : styles.textRed}`}>
              {bidStatistics.ytmXirr.toFixed(2)}%
            </div>
            {!compact && <div className={`text-xs ${styles.textMuted} mt-1`}>Date-adjusted</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
