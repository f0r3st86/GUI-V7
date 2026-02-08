// Right panel: Payment history grid, trailing analytics cards, SQL info
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { MONTH_NAMES } from '../../../../data';
import type { ThemeStyles, TrailingPaymentData } from '../../../../types';

interface PaymentGridPanelProps {
  styles: ThemeStyles;
  selectedLoan: string;
  paymentGridData: Record<string, Record<number, number>>;
  sortedYears: string[];
  yearSums: Record<string, number>;
  grandTotal: number;
  effectiveDate: string | null;
  trailing12: TrailingPaymentData | null;
  trailing6: TrailingPaymentData | null;
  trailing3: TrailingPaymentData | null;
}

const TrailingCard: React.FC<{
  styles: ThemeStyles;
  title: string;
  data: TrailingPaymentData;
}> = ({ styles, title, data }) => (
  <div className={`${styles.inputBorder} border rounded-lg p-4`}>
    <div className={`text-base font-semibold ${styles.textPrimary} mb-3 text-center`}>{title}</div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className={`text-base ${styles.textMuted}`}>$/Mo</span>
        <span className={`text-base font-medium ${styles.textPrimary}`}>
          ${data.monthly.toLocaleString(undefined, {maximumFractionDigits: 0})}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-base ${styles.textMuted}`}>Actual</span>
        <span className={`text-base font-medium ${styles.textGreen}`}>
          ${data.actual.toLocaleString(undefined, {maximumFractionDigits: 0})}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-base ${styles.textMuted}`}>% Cont.</span>
        <span className={`text-base font-medium ${
          data.percentOfContractual >= 100 ? styles.textGreen :
          data.percentOfContractual >= 80 ? styles.textYellow : styles.textRed
        }`}>
          {data.percentOfContractual.toFixed(1)}%
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-base ${styles.textMuted}`}>Mo Pd</span>
        <span className={`text-base font-medium ${styles.textPrimary}`}>
          {data.monthsPaidContractual.toFixed(1)}
        </span>
      </div>
    </div>
  </div>
);

export const PaymentGridPanel: React.FC<PaymentGridPanelProps> = ({
  styles,
  selectedLoan,
  paymentGridData,
  sortedYears,
  yearSums,
  grandTotal,
  effectiveDate,
  trailing12,
  trailing6,
  trailing3,
}) => (
  <div className={`flex-1 ${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border overflow-x-auto`}>
    <h3 className={`font-medium mb-3 ${styles.textPrimary} text-center`}>Data will be displayed here</h3>

    {/* Payment History Grid */}
    <table className="w-full text-xs">
      <thead>
        <tr>
          <th className={`text-left px-2 py-1 ${styles.textMuted} font-medium`}></th>
          {MONTH_NAMES.map(month => (
            <th key={month} className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>{month}</th>
          ))}
          <th className={`text-center px-2 py-1 ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Sum</th>
        </tr>
      </thead>
      <tbody>
        {sortedYears.map((year, index) => {
          const yearData = paymentGridData[year] || {};
          const yearSum = yearSums[year];
          return (
            <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
              <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                const amount = yearData[month];
                return (
                  <td key={month} className={`text-center px-1 py-2 ${amount ? styles.textGreen : styles.textSecondary}`}>
                    {amount ? amount.toFixed(2) : '-'}
                  </td>
                );
              })}
              <td className={`text-center px-2 py-2 font-medium ${yearSum > 0 ? styles.textPrimary : styles.textSecondary} ${styles.borderColor} border-l`}>
                ${yearSum.toFixed(2)}
              </td>
            </tr>
          );
        })}

        {/* Total Row */}
        <tr className={`${styles.borderColor} border-t font-medium`}>
          <td className={`px-2 py-2 ${styles.textPrimary}`}>TOTAL</td>
          <td colSpan={12} className={`text-right px-2 py-2 ${styles.textPrimary}`}>Grand Total:</td>
          <td className={`text-center px-2 py-2 ${styles.textGreen} ${styles.borderColor} border-l`}>
            ${grandTotal.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>

    {/* Trailing Payment Analytics */}
    {effectiveDate && trailing12 && trailing6 && trailing3 ? (
      <div className="mt-4">
        <h4 className={`text-base font-medium ${styles.textMuted} mb-2`}>Payment Analytics</h4>
        <div className="grid grid-cols-3 gap-4" style={{ maxWidth: '540px' }}>
          <TrailingCard styles={styles} title="Trailing 12" data={trailing12} />
          <TrailingCard styles={styles} title="Trailing 6" data={trailing6} />
          <TrailingCard styles={styles} title="Trailing 3" data={trailing3} />
        </div>
      </div>
    ) : (
      <div className={`mt-3 p-2 ${styles.inputBg} ${styles.inputBorder} rounded border`}>
        <div className={`text-xs ${styles.textMuted} text-center`}>
          Enter Pay History Date above for trailing analytics
        </div>
      </div>
    )}

    {/* SQL Connection Info */}
    <div className={`mt-4 p-3 ${styles.alertBg} ${styles.alertBorder} rounded-lg border`}>
      <div className="flex items-start">
        <AlertCircle size={16} className={`${styles.alertText} mr-2 mt-0.5`} />
        <div className={`text-xs ${styles.alertText}`}>
          <p className="font-medium">SQL Connection Points:</p>
          <p className="mt-1">SELECT * FROM payment_history WHERE loan_id = '{selectedLoan}' ORDER BY year DESC, month DESC</p>
          <p>INSERT INTO payment_history (loan_id, year, month, amount) VALUES (...)</p>
          <p>UPDATE payment_history SET amount = value WHERE id = record_id</p>
          <p>DELETE FROM payment_history WHERE id = record_id</p>
        </div>
      </div>
    </div>
  </div>
);
