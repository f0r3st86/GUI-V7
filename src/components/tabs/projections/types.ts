// Shared types for ProjectionsTab sub-components

export type ClassicEntry = {
  id: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  amount: string;
  type: 'income' | 'expense';
};

export type ProjectionGrid = {
  income: Record<string, Record<number, number>>;
  expenses: Record<string, Record<number, number>>;
  netCashFlow: Record<string, Record<number, number>>;
};
