// BorrowerTab component - displays borrower/guarantor information and loan relationships
// Decomposed into focused sub-components with shared hook for state management
import React from 'react';
import { useTheme } from '../../context';
import { DeleteModal } from '../ui';
import { useBorrowerForm } from './borrower/hooks/useBorrowerForm';
import { BorrowersTable } from './borrower/components/BorrowersTable';
import { BorrowerDetailsPanel } from './borrower/components/BorrowerDetailsPanel';
import { LoanRelationshipsPanel } from './borrower/components/LoanRelationshipsPanel';

export const BorrowerTab = React.memo(() => {
  const { styles } = useTheme();
  const form = useBorrowerForm();

  if ('isLoading' in form && form.isLoading) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

  if (!('selectedBorrower' in form) || !form.selectedBorrower) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>No borrower selected</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <BorrowersTable
        styles={styles}
        currentRelationship={form.currentRelationship}
        relationshipBorrowers={form.relationshipBorrowers}
        selectedBorrowerId={form.selectedBorrowerId}
        setSelectedBorrowerId={form.setSelectedBorrowerId}
        addNewBorrower={form.addNewBorrower}
        showDeleteConfirmation={form.showDeleteConfirmation}
      />

      <div className="grid grid-cols-2 gap-4">
        <BorrowerDetailsPanel
          styles={styles}
          borrower={form.selectedBorrower}
          handleBorrowerFieldChange={form.handleBorrowerFieldChange}
          handlePhoneChange={form.handlePhoneChange}
          handleZipChange={form.handleZipChange}
          handleSsnEinChange={form.handleSsnEinChange}
          handleCreditScoreChange={form.handleCreditScoreChange}
          handleDateChange={form.handleDateChange}
          getInputStyle={form.getInputStyle}
        />
        <LoanRelationshipsPanel
          styles={styles}
          currentRelationship={form.currentRelationship}
          selectedBorrowerId={form.selectedBorrowerId}
          sortedLoans={form.sortedLoans}
          currentBorrowerLoanRelationships={form.currentBorrowerLoanRelationships}
          selectedLoansStats={form.selectedLoansStats}
          toggleLoanRelationship={form.toggleLoanRelationship}
          changeLoanRole={form.changeLoanRole}
        />
      </div>

      <DeleteModal
        show={form.deleteConfirmation.show}
        itemName={form.deleteConfirmation.borrowerName}
        onConfirm={form.confirmDelete}
        onCancel={form.cancelDelete}
      />
    </div>
  );
});
BorrowerTab.displayName = 'BorrowerTab';
