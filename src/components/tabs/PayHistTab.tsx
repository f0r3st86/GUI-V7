// PayHistTab component - payment history with Excel-like grid
// Decomposed into focused sub-components with shared hook for state management
import React from 'react';
import { useTheme } from '../../context';
import { usePayHistForm } from './payhist/hooks/usePayHistForm';
import { PayHistHeader } from './payhist/components/PayHistHeader';
import { PaymentEntryPanel } from './payhist/components/PaymentEntryPanel';
import { PaymentGridPanel } from './payhist/components/PaymentGridPanel';

export const PayHistTab = React.memo(() => {
  const { styles } = useTheme();
  const form = usePayHistForm();

  if ('isLoading' in form && form.isLoading) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

  if (!('selectedLoanData' in form) || !form.selectedLoanData) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>No loan selected</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PayHistHeader
        styles={styles}
        selectedLoan={form.selectedLoan}
        selectedLoanData={form.selectedLoanData}
        exportPaymentHistory={form.exportPaymentHistory}
      />

      <div className="flex space-x-4">
        <PaymentEntryPanel
          styles={styles}
          theme={form.theme}
          selectedLoan={form.selectedLoan}
          filteredRecords={form.filteredRecords}
          payHistDate={form.payHistDate}
          parsedPayHistDate={form.parsedPayHistDate}
          setPayHistDate={form.setPayHistDate}
          handleCellEdit={form.handleCellEdit}
          handleAmountBlur={form.handleAmountBlur}
          handleKeyDown={form.handleKeyDown}
          deletePaymentRow={form.deletePaymentRow}
          isFieldInvalid={form.isFieldInvalid}
        />
        <PaymentGridPanel
          styles={styles}
          selectedLoan={form.selectedLoan}
          paymentGridData={form.paymentGridData}
          sortedYears={form.sortedYears}
          yearSums={form.yearSums}
          grandTotal={form.grandTotal}
          effectiveDate={form.effectiveDate}
          trailing12={form.trailing12}
          trailing6={form.trailing6}
          trailing3={form.trailing3}
        />
      </div>
    </div>
  );
});
PayHistTab.displayName = 'PayHistTab';
