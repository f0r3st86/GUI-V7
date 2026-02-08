// Left panel: Editable payment entry table + pay history date input
import React from 'react';
import type { PaymentRecord, ThemeStyles } from '../../../../types';

interface PaymentEntryPanelProps {
  styles: ThemeStyles;
  theme: string;
  selectedLoan: string;
  filteredRecords: PaymentRecord[];
  payHistDate: string;
  parsedPayHistDate: string | null;
  setPayHistDate: (value: string) => void;
  handleCellEdit: (id: number, field: string, value: string) => void;
  handleAmountBlur: (id: number, value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent, id: number, field: string) => void;
  deletePaymentRow: (id: number) => void;
  isFieldInvalid: (id: number, field: string) => boolean;
}

export const PaymentEntryPanel: React.FC<PaymentEntryPanelProps> = ({
  styles,
  theme,
  selectedLoan,
  filteredRecords,
  payHistDate,
  parsedPayHistDate,
  setPayHistDate,
  handleCellEdit,
  handleAmountBlur,
  handleKeyDown,
  deletePaymentRow,
  isFieldInvalid,
}) => (
  <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`} style={{ minWidth: '350px' }}>
    <h3 className={`font-medium mb-3 ${styles.textPrimary} text-center`}>Payment Entry for Loan #{selectedLoan}</h3>

    <div className={`${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} rounded border ${styles.borderColor}`}>
      <table className="w-full">
        <thead>
          <tr className={`${styles.borderColor} border-b ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'}`}>
            <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`} style={{ width: '80px' }}>Year</th>
            <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`} style={{ width: '80px' }}>Month</th>
            <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`} style={{ width: '100px' }}>Amount</th>
            <th className={`px-2 py-2`} style={{ width: '30px' }}></th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map((record, index) => (
            <tr key={record.id} className={`${styles.borderColor} border-b ${styles.hoverBg}`}>
              <td className="px-0 py-0">
                <input
                  id={`year-${record.id}`}
                  type="text"
                  value={record.year}
                  onChange={(e) => handleCellEdit(record.id, 'year', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, record.id, 'year')}
                  aria-label="Payment Year"
                  placeholder="YYYY"
                  maxLength={4}
                  className={`w-full px-3 py-2 text-xs ${styles.textPrimary} bg-transparent focus:outline-none ${
                    isFieldInvalid(record.id, 'year')
                      ? `ring-1 ${styles.invalidRing}`
                      : `focus:ring-1 focus:${styles.validRing}`
                  }`}
                  style={{ border: 'none' }}
                />
              </td>
              <td className="px-0 py-0">
                <input
                  id={`month-${record.id}`}
                  type="text"
                  value={record.month}
                  onChange={(e) => handleCellEdit(record.id, 'month', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, record.id, 'month')}
                  aria-label="Payment Month"
                  placeholder="1-12"
                  maxLength={2}
                  className={`w-full px-3 py-2 text-xs ${styles.textPrimary} bg-transparent focus:outline-none ${
                    isFieldInvalid(record.id, 'month')
                      ? `ring-1 ${styles.invalidRing}`
                      : `focus:ring-1 focus:${styles.validRing}`
                  }`}
                  style={{ border: 'none' }}
                />
              </td>
              <td className="px-0 py-0">
                <input
                  id={`amount-${record.id}`}
                  type="text"
                  value={record.amount}
                  onChange={(e) => handleCellEdit(record.id, 'amount', e.target.value)}
                  onBlur={(e) => handleAmountBlur(record.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, record.id, 'amount')}
                  placeholder="0.00"
                  title="You can enter calculations like 500+108.15 or 608.15*2"
                  className={`w-full px-3 py-2 text-xs ${styles.textGreen} bg-transparent focus:outline-none ${
                    isFieldInvalid(record.id, 'amount')
                      ? `ring-1 ${styles.invalidRing}`
                      : `focus:ring-1 focus:${styles.validRing}`
                  }`}
                  style={{ border: 'none' }}
                />
              </td>
              <td className="px-2 py-0">
                {record.year && record.month && record.amount && index < filteredRecords.length - 1 && (
                  <button
                    onClick={() => deletePaymentRow(record.id)}
                    className={`${styles.textMuted} ${styles.hoverDanger} text-xs`}
                    title="Delete row"
                  >
                    x
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className={`mt-3 text-xs ${styles.textMuted}`}>
      <p>Click any cell to edit</p>
      <p>Press Enter or Down to move down</p>
      <p>Press Tab to move right</p>
      <p>Amount supports calculations: 500+108.15</p>
    </div>

    {/* Pay History Date Input */}
    <div className={`mt-4 p-3 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-50'} rounded border ${styles.borderColor}`}>
      <label className={`block text-xs font-medium ${styles.textMuted} mb-1`}>
        Pay History Date (last month of data)
      </label>
      <input
        type="text"
        value={payHistDate}
        onChange={(e) => setPayHistDate(e.target.value)}
        aria-label="Pay History Date"
        placeholder="M-D-YY (e.g., 9-12-25)"
        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
      />
      {payHistDate && !parsedPayHistDate && (
        <p className={`${styles.textRed} text-xs mt-1`}>Invalid date format. Use M-D-YY</p>
      )}
      {parsedPayHistDate && (
        <p className={`text-xs mt-1 ${styles.textGreen}`}>
          Using: {parsedPayHistDate}
        </p>
      )}
    </div>
  </div>
);
