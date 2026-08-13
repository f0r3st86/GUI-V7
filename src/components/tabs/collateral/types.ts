// Shared types for CollateralTab sub-components
import type { Collateral, Loan, ThemeStyles } from '../../../types';

export interface CollateralFormState {
  // Data
  selectedCollateral: Collateral;
  collateralList: Collateral[];
  sortedLoans: Loan[];
  selectedLoan: string;
  /** Holds the selected collateral's mwPropertyNo */
  selectedCollateralId: number;
  securingLoansStats: { securingCount: number; totalLoans: number; totalSecured: number };

  // Local debounced state
  localListPrice: string;
  localAppraisedValue: string;
  localOurValue: string;
  localBpoValue: string;
  localSqft: string;

  // Setters
  setLocalListPrice: React.Dispatch<React.SetStateAction<string>>;
  setLocalAppraisedValue: React.Dispatch<React.SetStateAction<string>>;
  setLocalOurValue: React.Dispatch<React.SetStateAction<string>>;
  setLocalBpoValue: React.Dispatch<React.SetStateAction<string>>;
  setLocalSqft: React.Dispatch<React.SetStateAction<string>>;

  // Delete state
  deleteConfirmation: { show: boolean; collateralId: number | null; collateralDescription: string };

  // Handlers
  setSelectedCollateralId: (id: number) => void;
  handleCollateralFieldChange: (field: keyof Collateral, value: string) => void;
  handleCurrencyChange: (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  handleIntegerChange: (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => void;
  addNewCollateral: () => void;
  showDeleteConfirmation: (mwPropertyNo: number, description: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  /** Set/clear the collateral's secondary loan link (single loanNo) */
  setLinkedLoan: (loanNo: string) => void;
  getInputStyle: (field: string) => string;
}

export interface CollateralColumnProps {
  collateral: Collateral;
  styles: ThemeStyles;
  handleCollateralFieldChange: (field: keyof Collateral, value: string) => void;
}
