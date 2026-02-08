// Shared types for LoanTab sub-components
import type { Loan, ThemeStyles } from '../../../types';

/** Return type of useLoanForm hook */
export interface LoanFormState {
  // Data
  selectedLoanData: Loan;
  isLoading: boolean;

  // Local state for debounced inputs
  localPrincipal: string;
  localInterest: string;
  localOrigBalance: string;
  localEscrow: string;
  localOther: string;
  localPmt: string;
  localEscPmt: string;
  localIntRate: string;
  localDRate: string;
  localFloor: string;
  localCeiling: string;
  localMargin: string;

  // Setters (needed by column components for currency/rate handlers)
  setLocalPrincipal: React.Dispatch<React.SetStateAction<string>>;
  setLocalInterest: React.Dispatch<React.SetStateAction<string>>;
  setLocalOrigBalance: React.Dispatch<React.SetStateAction<string>>;
  setLocalEscrow: React.Dispatch<React.SetStateAction<string>>;
  setLocalOther: React.Dispatch<React.SetStateAction<string>>;
  setLocalPmt: React.Dispatch<React.SetStateAction<string>>;
  setLocalEscPmt: React.Dispatch<React.SetStateAction<string>>;
  setLocalIntRate: React.Dispatch<React.SetStateAction<string>>;
  setLocalDRate: React.Dispatch<React.SetStateAction<string>>;
  setLocalFloor: React.Dispatch<React.SetStateAction<string>>;
  setLocalCeiling: React.Dispatch<React.SetStateAction<string>>;
  setLocalMargin: React.Dispatch<React.SetStateAction<string>>;

  // Handlers
  handleLoanFieldChange: (field: string, value: string | number) => void;
  handleCurrencyChange: (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  handleRateChange: (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  handleDateChange: (field: string, value: string) => void;
  handleZipChange: (value: string) => void;
  getInputStyle: (field: string) => string;
}

/** Common props shared by all column/row components */
export interface LoanColumnProps {
  loan: Loan;
  styles: ThemeStyles;
  handleLoanFieldChange: (field: string, value: string | number) => void;
}
