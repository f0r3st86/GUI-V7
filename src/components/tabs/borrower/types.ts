// Shared types for BorrowerTab sub-components
import type { Borrower, Loan, DeleteConfirmation } from '../../../types';

export interface BorrowerFormState {
  // Data
  selectedBorrower: Borrower;
  relationshipBorrowers: Borrower[];
  sortedLoans: Loan[];
  currentRelationship: string;
  selectedBorrowerId: number | null;
  selectedLoansStats: { selectedCount: number; totalLoans: number; totalExposure: number };
  currentBorrowerLoanRelationships: Record<string, { selected: boolean; role: string }>;

  // Delete modal state
  deleteConfirmation: DeleteConfirmation;

  // Handlers
  setSelectedBorrowerId: (id: number) => void;
  handleBorrowerFieldChange: (field: keyof Borrower, value: string) => void;
  handlePhoneChange: (value: string) => void;
  handleZipChange: (value: string) => void;
  handleSsnEinChange: (value: string) => void;
  handleCreditScoreChange: (value: string) => void;
  handleDateChange: (field: keyof Borrower, value: string) => void;
  addNewBorrower: () => void;
  showDeleteConfirmation: (id: number, name: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  toggleLoanRelationship: (loanNo: string) => void;
  changeLoanRole: (loanNo: string, role: string) => void;
  getInputStyle: (field: string) => string;
}
