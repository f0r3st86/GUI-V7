// CollateralTab component - displays collateral information
// Decomposed into focused sub-components with shared hook for state management
import React from 'react';
import { useTheme } from '../../context';
import { DeleteModal } from '../ui';
import { useCollateralForm } from './collateral/hooks/useCollateralForm';
import { CollateralTable } from './collateral/components/CollateralTable';
import { PropertyInfoColumn } from './collateral/components/PropertyInfoColumn';
import { ValuesColumn } from './collateral/components/ValuesColumn';
import { CollateralLoansPanel } from './collateral/components/CollateralLoansPanel';

export const CollateralTab = React.memo(() => {
  const { styles } = useTheme();
  const form = useCollateralForm();

  if ('isLoading' in form && form.isLoading) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

  if (!('selectedCollateral' in form) || !form.selectedCollateral) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>No collateral selected</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <CollateralTable
        styles={styles}
        selectedLoan={form.selectedLoan}
        collateralList={form.collateralList}
        selectedCollateralId={form.selectedCollateralId}
        setSelectedCollateralId={form.setSelectedCollateralId}
        addNewCollateral={form.addNewCollateral}
        showDeleteConfirmation={form.showDeleteConfirmation}
      />

      <div className="grid grid-cols-3 gap-4">
        <PropertyInfoColumn
          styles={styles}
          collateral={form.selectedCollateral}
          localSqft={form.localSqft}
          handleCollateralFieldChange={form.handleCollateralFieldChange}
          handleIntegerChange={form.handleIntegerChange}
          setLocalSqft={form.setLocalSqft}
          getInputStyle={form.getInputStyle}
        />
        <ValuesColumn
          styles={styles}
          collateral={form.selectedCollateral}
          localListPrice={form.localListPrice}
          localAppraisedValue={form.localAppraisedValue}
          localOurValue={form.localOurValue}
          localBpoValue={form.localBpoValue}
          handleCurrencyChange={form.handleCurrencyChange}
          setLocalListPrice={form.setLocalListPrice}
          setLocalAppraisedValue={form.setLocalAppraisedValue}
          setLocalOurValue={form.setLocalOurValue}
          setLocalBpoValue={form.setLocalBpoValue}
          getInputStyle={form.getInputStyle}
        />
        <CollateralLoansPanel
          styles={styles}
          selectedLoan={form.selectedLoan}
          selectedCollateralId={form.selectedCollateralId}
          sortedLoans={form.sortedLoans}
          collateralLoanRelationships={form.collateralLoanRelationships}
          securingLoansStats={form.securingLoansStats}
          toggleCollateralLoanRelationship={form.toggleCollateralLoanRelationship}
        />
      </div>

      <DeleteModal
        show={form.deleteConfirmation.show}
        itemName={form.deleteConfirmation.collateralDescription}
        onConfirm={form.confirmDelete}
        onCancel={form.cancelDelete}
      />
    </div>
  );
});
CollateralTab.displayName = 'CollateralTab';
