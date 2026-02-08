// Classic mode cash flow entry form
import React from 'react';
import type { ClassicEntry } from '../types';
import type { ThemeStyles } from '../../../../types';

interface ClassicEntryFormProps {
  classicEntries: ClassicEntry[];
  setClassicEntries: React.Dispatch<React.SetStateAction<ClassicEntry[]>>;
  styles: ThemeStyles;
}

export const ClassicEntryForm: React.FC<ClassicEntryFormProps> = ({
  classicEntries,
  setClassicEntries,
  styles,
}) => {
  const classicStartMonthRef = React.useRef<HTMLSelectElement>(null);
  const classicStartYearRef = React.useRef<HTMLInputElement>(null);
  const classicEndMonthRef = React.useRef<HTMLSelectElement>(null);
  const classicEndYearRef = React.useRef<HTMLInputElement>(null);
  const classicAmountRef = React.useRef<HTMLInputElement>(null);
  const classicTypeRef = React.useRef<HTMLSelectElement>(null);

  const inputClass = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1.5 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  const handleAdd = () => {
    const startMonth = classicStartMonthRef.current?.value;
    const startYear = classicStartYearRef.current?.value;
    const endMonth = classicEndMonthRef.current?.value;
    const endYear = classicEndYearRef.current?.value;
    const amount = classicAmountRef.current?.value;
    const type = classicTypeRef.current?.value as 'income' | 'expense';

    if (startMonth && startYear && endMonth && endYear && amount) {
      const newEntry: ClassicEntry = {
        id: Date.now().toString(),
        startMonth,
        startYear,
        endMonth,
        endYear,
        amount,
        type
      };
      setClassicEntries(prev => [...prev, newEntry]);
    }
  };

  const months = [1,2,3,4,5,6,7,8,9,10,11,12];

  return (
    <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
      <h3 className={`font-medium mb-4 ${styles.textPrimary}`}>Add Cash Flow Entry</h3>

      <div className="grid grid-cols-7 gap-3 items-end">
        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Start Month:</label>
          <select ref={classicStartMonthRef} aria-label="Start Month" className={inputClass}>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Start Year:</label>
          <input type="text" ref={classicStartYearRef} aria-label="Start Year" placeholder="2025" className={inputClass} />
        </div>

        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>End Month:</label>
          <select ref={classicEndMonthRef} aria-label="End Month" className={inputClass}>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>End Year:</label>
          <input type="text" ref={classicEndYearRef} aria-label="End Year" placeholder="2027" className={inputClass} />
        </div>

        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Amount ($):</label>
          <input type="text" ref={classicAmountRef} aria-label="Amount" placeholder="500" className={inputClass} />
        </div>

        <div>
          <label className={`text-xs ${styles.textMuted} block mb-1`}>Type:</label>
          <select ref={classicTypeRef} aria-label="Entry Type" className={inputClass}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className={`${styles.activeBg} ${styles.textPrimary} px-3 py-1.5 rounded text-sm font-medium border ${styles.inputBorder} ${styles.buttonHover} transition-colors`}
          >
            Add
          </button>
          {classicEntries.length > 0 && (
            <button
              onClick={() => setClassicEntries([])}
              className={`${styles.cardBg} ${styles.textMuted} hover:${styles.textPrimary} px-3 py-1.5 rounded text-sm border ${styles.borderColor} transition-colors`}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
