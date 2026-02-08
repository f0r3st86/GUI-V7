// LoanTab component - displays loan details in 5-column grid layout
// Decomposed into focused sub-components with shared hook for state management
import React from 'react';
import { useTheme } from '../../context';
import { useLoanForm } from './loan/hooks/useLoanForm';
import { LoanInfoColumn } from './loan/components/LoanInfoColumn';
import { BalancesColumn } from './loan/components/BalancesColumn';
import { RatesPaymentColumn } from './loan/components/RatesPaymentColumn';
import { DatesColumn } from './loan/components/DatesColumn';
import { AddressColumn } from './loan/components/AddressColumn';
import { RateTypeRow } from './loan/components/RateTypeRow';
import { LoanTypeRow } from './loan/components/LoanTypeRow';
import { CalculatedFieldsRow } from './loan/components/CalculatedFieldsRow';

export const LoanTab = React.memo(() => {
  const { styles } = useTheme();
  const form = useLoanForm();

  if (form.isLoading) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

  if (!form.selectedLoanData) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>No loan selected</p>
      </div>
    );
  }

  const loan = form.selectedLoanData;

  return (
    <div className="p-4">
      {/* Main 5-column grid for loan tab */}
      <div className="grid grid-cols-5 gap-4">
        <LoanInfoColumn
          loan={loan}
          styles={styles}
          handleLoanFieldChange={form.handleLoanFieldChange}
          handleDateChange={form.handleDateChange}
          getInputStyle={form.getInputStyle}
        />
        <BalancesColumn
          loan={loan}
          styles={styles}
          localOrigBalance={form.localOrigBalance}
          localPrincipal={form.localPrincipal}
          localInterest={form.localInterest}
          localEscrow={form.localEscrow}
          localOther={form.localOther}
          handleCurrencyChange={form.handleCurrencyChange}
          setLocalOrigBalance={form.setLocalOrigBalance}
          setLocalPrincipal={form.setLocalPrincipal}
          setLocalInterest={form.setLocalInterest}
          setLocalEscrow={form.setLocalEscrow}
          setLocalOther={form.setLocalOther}
          getInputStyle={form.getInputStyle}
        />
        <RatesPaymentColumn
          loan={loan}
          styles={styles}
          localIntRate={form.localIntRate}
          localDRate={form.localDRate}
          localPmt={form.localPmt}
          localEscPmt={form.localEscPmt}
          handleCurrencyChange={form.handleCurrencyChange}
          handleRateChange={form.handleRateChange}
          handleLoanFieldChange={form.handleLoanFieldChange}
          setLocalIntRate={form.setLocalIntRate}
          setLocalDRate={form.setLocalDRate}
          setLocalPmt={form.setLocalPmt}
          setLocalEscPmt={form.setLocalEscPmt}
          getInputStyle={form.getInputStyle}
        />
        <DatesColumn
          loan={loan}
          styles={styles}
          handleDateChange={form.handleDateChange}
          getInputStyle={form.getInputStyle}
        />
        <AddressColumn
          loan={loan}
          styles={styles}
          handleLoanFieldChange={form.handleLoanFieldChange}
          handleZipChange={form.handleZipChange}
          getInputStyle={form.getInputStyle}
        />
      </div>

      {/* Bottom Row - Rate Type, Loan Type, Calculated Fields */}
      <div className="mt-4 space-y-3">
        <RateTypeRow
          loan={loan}
          styles={styles}
          localFloor={form.localFloor}
          localCeiling={form.localCeiling}
          localMargin={form.localMargin}
          handleLoanFieldChange={form.handleLoanFieldChange}
          handleRateChange={form.handleRateChange}
          handleDateChange={form.handleDateChange}
          setLocalFloor={form.setLocalFloor}
          setLocalCeiling={form.setLocalCeiling}
          setLocalMargin={form.setLocalMargin}
          getInputStyle={form.getInputStyle}
        />
        <LoanTypeRow
          loan={loan}
          styles={styles}
          handleLoanFieldChange={form.handleLoanFieldChange}
        />
        <CalculatedFieldsRow
          loan={loan}
          styles={styles}
        />
      </div>
    </div>
  );
});
LoanTab.displayName = 'LoanTab';
