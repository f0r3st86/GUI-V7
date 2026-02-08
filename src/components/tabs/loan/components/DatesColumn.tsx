// Column 4: Date fields with validation
import React from 'react';
import type { Loan, ThemeStyles } from '../../../../types';

interface DatesColumnProps {
  loan: Loan;
  styles: ThemeStyles;
  handleDateChange: (field: string, value: string) => void;
  getInputStyle: (field: string) => string;
}

export const DatesColumn: React.FC<DatesColumnProps> = ({
  loan,
  styles,
  handleDateChange,
  getInputStyle,
}) => {
  const dateFields = [
    { key: 'notDue', label: 'Not Due:', ariaLabel: 'Not Due Date' },
    { key: 'lastPmt', label: 'Last PMT:', ariaLabel: 'Last Payment Date' },
    { key: 'origDt', label: 'Orig Dt:', ariaLabel: 'Origination Date' },
    { key: 'matDt', label: 'Mat Dt:', ariaLabel: 'Maturity Date' },
    { key: 'accDt', label: 'Acc Dt:', ariaLabel: 'Acceleration Date' },
    { key: 'dueDt', label: 'Due Dt:', ariaLabel: 'Due Date' },
  ] as const;

  return (
    <div className="space-y-3">
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
        <div className="space-y-2">
          {dateFields.map(({ key, label, ariaLabel }) => (
            <div key={key}>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>{label}</label>
              <input
                type="text"
                aria-label={ariaLabel}
                value={loan[key as keyof typeof loan] as string || ''}
                onChange={(e) => handleDateChange(key, e.target.value)}
                placeholder="MM/DD/YY"
                className={`${styles.inputBg} ${getInputStyle(key)} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
