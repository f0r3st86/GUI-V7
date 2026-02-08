// Shared types for PayHistTab sub-components
import type { Loan, PaymentRecord, TrailingPaymentData } from '../../../types';

export interface PayHistFormState {
  // Data
  selectedLoan: string;
  selectedLoanData: Loan;
  filteredRecords: PaymentRecord[];
  paymentGridData: Record<string, Record<number, number>>;
  sortedYears: string[];
  yearSums: Record<string, number>;
  grandTotal: number;

  // Trailing analytics
  effectiveDate: string | null;
  trailing12: TrailingPaymentData | null;
  trailing6: TrailingPaymentData | null;
  trailing3: TrailingPaymentData | null;

  // Pay history date
  payHistDate: string;
  parsedPayHistDate: string | null;
  setPayHistDate: (value: string) => void;

  // Theme
  theme: string;

  // Handlers
  handleCellEdit: (id: number, field: string, value: string) => void;
  handleAmountBlur: (id: number, value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent, id: number, field: string) => void;
  deletePaymentRow: (id: number) => void;
  exportPaymentHistory: () => void;
  isFieldInvalid: (id: number, field: string) => boolean;
}
