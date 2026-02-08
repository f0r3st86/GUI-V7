// Projection grid construction logic extracted from ProjectionsTab
import { useMemo, useCallback } from 'react';
import { calculateYearSum } from '../../../../utils';
import type { ProjectionSettings, ExitSettings } from '../../../../types';
import type { ClassicEntry, ProjectionGrid } from '../types';

interface UseProjectionGridParams {
  projSettings: ProjectionSettings | undefined;
  exitSettings: ExitSettings | undefined;
  sanitizedExitSettings: { startMonth: string; endMonth: string };
  projectedPaymentValue: number;
  calculatedExitValue: number;
  classicEntries: ClassicEntry[];
  mode: 'modern' | 'classic';
}

export const useProjectionGrid = ({
  projSettings,
  exitSettings,
  sanitizedExitSettings,
  projectedPaymentValue,
  calculatedExitValue,
  classicEntries,
  mode,
}: UseProjectionGridParams) => {
  // Build modern mode projection grid
  const buildProjectionGrid = useMemo<ProjectionGrid>(() => {
    const income: Record<string, Record<number, number>> = {};
    const expenses: Record<string, Record<number, number>> = {};
    const netCashFlow: Record<string, Record<number, number>> = {};

    const startMonth = parseInt(sanitizedExitSettings.startMonth) || 1;
    const endMonth = Math.min(Math.max(1, parseInt(sanitizedExitSettings.endMonth) || 24), 60);
    const monthlyPayment = projectedPaymentValue;
    const initialLegal = parseFloat(projSettings?.initialLegal || '') || 0;
    const initialLegalStart = parseInt(projSettings?.initialLegalStartMonth || '') || 1;
    const holdingCosts = parseFloat(projSettings?.holdingCosts || '') || 0;
    const holdingCostsEnd = parseInt(projSettings?.holdingCostsEndMonth || '') || 12;
    const isLiquidation = exitSettings?.method === 'Liquidation';
    const currentYear = new Date().getFullYear();

    for (let month = startMonth; month <= endMonth; month++) {
      const actualMonth = ((month - 1) % 12) + 1;
      const yearOffset = Math.floor((month - 1) / 12);
      const year = (currentYear + yearOffset).toString();

      if (!income[year]) income[year] = {};
      if (!expenses[year]) expenses[year] = {};
      if (!netCashFlow[year]) netCashFlow[year] = {};

      // Add income
      if (isLiquidation) {
        income[year][actualMonth] = month === endMonth ? calculatedExitValue : 0;
      } else {
        income[year][actualMonth] = (income[year][actualMonth] || 0) + monthlyPayment;
      }

      // Add expenses
      let monthExpense = 0;
      if (month === initialLegalStart) {
        monthExpense += initialLegal;
      }
      if (month > initialLegalStart && month <= holdingCostsEnd) {
        monthExpense += holdingCosts;
      }
      expenses[year][actualMonth] = (expenses[year][actualMonth] || 0) + monthExpense;

      // Calculate net
      netCashFlow[year][actualMonth] = income[year][actualMonth] - expenses[year][actualMonth];
    }

    return { income, expenses, netCashFlow };
  }, [projSettings, sanitizedExitSettings, projectedPaymentValue, exitSettings?.method, calculatedExitValue]);

  // Build classic mode projection grid from entries
  const buildClassicProjectionGrid = useMemo<ProjectionGrid>(() => {
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();

    classicEntries.forEach(entry => {
      const startYear = parseInt(entry.startYear);
      const endYear = parseInt(entry.endYear);
      const startMonth = parseInt(entry.startMonth);
      const endMonth = parseInt(entry.endMonth);
      const amount = parseFloat(entry.amount) || 0;

      for (let year = startYear; year <= endYear; year++) {
        const firstMonth = (year === startYear) ? startMonth : 1;
        const lastMonth = (year === endYear) ? endMonth : 12;

        for (let month = firstMonth; month <= lastMonth; month++) {
          const key = `${year}-${month}`;
          if (entry.type === 'income') {
            incomeMap.set(key, amount);
          } else {
            expenseMap.set(key, amount);
          }
        }
      }
    });

    const income: Record<string, Record<number, number>> = {};
    const expenses: Record<string, Record<number, number>> = {};
    const netCashFlow: Record<string, Record<number, number>> = {};

    const allYears = new Set<string>();
    incomeMap.forEach((_, key) => allYears.add(key.split('-')[0]));
    expenseMap.forEach((_, key) => allYears.add(key.split('-')[0]));

    allYears.forEach(yearStr => {
      income[yearStr] = {};
      expenses[yearStr] = {};
      netCashFlow[yearStr] = {};

      for (let month = 1; month <= 12; month++) {
        const key = `${yearStr}-${month}`;
        const incomeAmount = incomeMap.get(key) || 0;
        const expenseAmount = expenseMap.get(key) || 0;

        if (incomeAmount > 0) income[yearStr][month] = incomeAmount;
        if (expenseAmount > 0) expenses[yearStr][month] = expenseAmount;
        if (incomeAmount > 0 || expenseAmount > 0) {
          netCashFlow[yearStr][month] = incomeAmount - expenseAmount;
        }
      }
    });

    return { income, expenses, netCashFlow };
  }, [classicEntries]);

  const projectionGrid = mode === 'classic' ? buildClassicProjectionGrid : buildProjectionGrid;

  // Memoize sorted years
  const sortedIncomeYears = useMemo(
    () => Object.keys(projectionGrid.income).sort(),
    [projectionGrid.income]
  );
  const sortedExpenseYears = useMemo(
    () => Object.keys(projectionGrid.expenses).sort(),
    [projectionGrid.expenses]
  );
  const sortedNetCashFlowYears = useMemo(
    () => Object.keys(projectionGrid.netCashFlow).sort(),
    [projectionGrid.netCashFlow]
  );

  // Pre-calculate ALL year sums
  const yearSums = useMemo(() => {
    const incomeSums: Record<string, number> = {};
    const expenseSums: Record<string, number> = {};
    const netCashFlowSums: Record<string, number> = {};

    sortedIncomeYears.forEach(year => {
      incomeSums[year] = calculateYearSum(projectionGrid.income[year] || {});
    });
    sortedExpenseYears.forEach(year => {
      expenseSums[year] = calculateYearSum(projectionGrid.expenses[year] || {});
    });
    sortedNetCashFlowYears.forEach(year => {
      netCashFlowSums[year] = calculateYearSum(projectionGrid.netCashFlow[year] || {});
    });

    return { income: incomeSums, expenses: expenseSums, netCashFlow: netCashFlowSums };
  }, [sortedIncomeYears, sortedExpenseYears, sortedNetCashFlowYears, projectionGrid]);

  // Memoized currency formatter
  const formatCurrency = useCallback((value: number): string => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }, []);

  return {
    projectionGrid,
    sortedIncomeYears,
    sortedExpenseYears,
    sortedNetCashFlowYears,
    yearSums,
    formatCurrency,
  };
};
