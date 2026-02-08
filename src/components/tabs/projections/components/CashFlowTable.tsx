// Reusable cash flow table for Income, Expenses, and Net Cash Flow
import React from 'react';
import { MONTH_NAMES_SHORT } from '../../../../data';
import { calculateYearSum } from '../../../../utils';
import type { ThemeStyles } from '../../../../types';

type ColorMode = 'income' | 'expense' | 'net';

interface CashFlowTableProps {
  title: string;
  data: Record<string, Record<number, number>>;
  sortedYears?: string[];
  yearSums?: Record<string, number>;
  styles: ThemeStyles;
  colorMode: ColorMode;
  formatCurrency?: (value: number) => string;
  filterEmptyYears?: boolean;
  useStickyHeader?: boolean;
}

const defaultFormatCurrency = (value: number): string =>
  value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const CashFlowTable: React.FC<CashFlowTableProps> = ({
  title,
  data,
  sortedYears: sortedYearsProp,
  yearSums: yearSumsProp,
  styles,
  colorMode,
  formatCurrency = defaultFormatCurrency,
  filterEmptyYears = false,
  useStickyHeader = false,
}) => {
  const sortedYears = sortedYearsProp || Object.keys(data).sort();

  const getCellColor = (amount: number | undefined, isValid: boolean): string => {
    if (!isValid) return styles.textSecondary;
    switch (colorMode) {
      case 'income':
        return amount! > 0 ? styles.textGreen : styles.textSecondary;
      case 'expense':
        return amount! > 0 ? 'text-red-500' : styles.textSecondary;
      case 'net':
        return amount! > 0 ? styles.textGreen : amount! < 0 ? 'text-red-500' : styles.textSecondary;
      default:
        return styles.textSecondary;
    }
  };

  const getSumColor = (sum: number): string => {
    switch (colorMode) {
      case 'income':
        return sum > 0 ? styles.textGreen : styles.textSecondary;
      case 'expense':
        return sum > 0 ? 'text-red-500' : styles.textSecondary;
      case 'net':
        return sum > 0 ? styles.textGreen : sum < 0 ? 'text-red-500' : styles.textSecondary;
      default:
        return styles.textSecondary;
    }
  };

  const displayValue = (amount: number | undefined, isValid: boolean): string => {
    if (!isValid) return '-';
    if (colorMode === 'expense') return amount! > 0 ? amount!.toFixed(0) : '-';
    return amount !== 0 ? amount!.toFixed(0) : '-';
  };

  return (
    <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
      <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className={useStickyHeader ? `${styles.tableHeaderBg} sticky top-0` : undefined}>
            <tr>
              <th className={`text-left px-2 py-${useStickyHeader ? '2' : '1'} ${styles.textMuted} font-medium`}>
                {useStickyHeader ? 'Year' : ''}
              </th>
              {MONTH_NAMES_SHORT.map(month => (
                <th key={month} className={`text-center px-1 py-${useStickyHeader ? '2' : '1'} ${styles.textMuted} font-medium`}>
                  {month}
                </th>
              ))}
              <th className={`text-${useStickyHeader ? 'right' : 'center'} px-2 py-${useStickyHeader ? '2' : '1'} ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>
                {useStickyHeader ? 'Total' : 'Sum'}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedYears.map((year, index) => {
              const yearData = data[year] || {};
              const yearSum = yearSumsProp?.[year] ?? calculateYearSum(yearData);

              if (filterEmptyYears && yearSum === 0 && Object.values(yearData).every(v => v === 0)) {
                return null;
              }

              return (
                <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                  <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                    const amount = yearData[month];
                    const isValidAmount = amount != null && isFinite(amount);
                    return (
                      <td key={month} className={`text-center px-1 py-2 ${getCellColor(amount, isValidAmount && (colorMode === 'expense' ? amount > 0 : amount !== undefined))}`}>
                        {displayValue(amount, isValidAmount)}
                      </td>
                    );
                  })}
                  <td className={`text-${useStickyHeader ? 'right' : 'center'} px-2 py-2 font-medium ${getSumColor(yearSum)} ${styles.borderColor} border-l`}>
                    ${formatCurrency(yearSum)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
