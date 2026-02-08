// ProjectionsTab component - cash flow projections and exit scenarios
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTheme, useLoan } from '../../context';
import { debug } from '../../utils';
import type { ProjectionSettings, ExitSettings } from '../../types';
import {
  useLoans,
  usePayments,
  useCollateral,
  useCollateralRelationships,
  useProjectionSettings,
  useUpdateProjectionSetting,
  useExitSettings,
  useUpdateExitSetting
} from '../../hooks';
import type { ClassicEntry } from './projections/types';
import { useProjectionCalculations } from './projections/hooks/useProjectionCalculations';
import { useProjectionGrid } from './projections/hooks/useProjectionGrid';
import { useBidStatistics } from './projections/hooks/useBidStatistics';
import { LoanHeader } from './projections/components/LoanHeader';
import { ModeSelector } from './projections/components/ModeSelector';
import { ProjectionSettingsPanel } from './projections/components/ProjectionSettingsPanel';
import { ExitSettingsPanel } from './projections/components/ExitSettingsPanel';
import { BidStatisticsPanel } from './projections/components/BidStatisticsPanel';
import { CashFlowTable } from './projections/components/CashFlowTable';
import { ClassicEntryForm } from './projections/components/ClassicEntryForm';

export const ProjectionsTab = React.memo(() => {
  debug.log('[ProjectionsTab] Component rendering');

  const { styles } = useTheme();
  const { selectedLoan } = useLoan();

  // Projection and Exit settings from React Query (persisted per loan)
  const { data: projSettings, isLoading: loadingProjSettings } = useProjectionSettings(selectedLoan);
  const { data: exitSettings, isLoading: loadingExitSettings } = useExitSettings(selectedLoan);
  const updateProjSettingMutation = useUpdateProjectionSetting();
  const updateExitSettingMutation = useUpdateExitSetting();

  const updateProjSetting = useCallback(<K extends keyof ProjectionSettings>(
    key: K, value: ProjectionSettings[K]
  ) => {
    if (selectedLoan) {
      updateProjSettingMutation.mutate({ mwLoanNo: selectedLoan, key, value });
    }
  }, [selectedLoan, updateProjSettingMutation]);

  const updateExitSetting = useCallback(<K extends keyof ExitSettings>(
    key: K, value: ExitSettings[K]
  ) => {
    if (selectedLoan) {
      updateExitSettingMutation.mutate({ mwLoanNo: selectedLoan, key, value });
    }
  }, [selectedLoan, updateExitSettingMutation]);

  // Data from React Query
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { data: collateral, isLoading: loadingCollateral } = useCollateral();
  const { data: collateralLoanRelationships } = useCollateralRelationships();

  const selectedLoanData = useMemo(
    () => loans?.find(loan => loan.mwLoanNo === selectedLoan),
    [loans, selectedLoan]
  );

  const paymentRecords = useMemo(() => payments || [], [payments]);
  const collateralList = useMemo(() => collateral || [], [collateral]);

  // Mode state
  const [mode, setMode] = useState<'modern' | 'classic'>('modern');

  // Classic mode state
  const [classicEntries, setClassicEntries] = useState<ClassicEntry[]>([]);

  // Memoize collateral lookup
  const loanCollateral = useMemo(() =>
    collateralList.find(c => collateralLoanRelationships?.[c.id]?.[selectedLoan]),
    [collateralList, collateralLoanRelationships, selectedLoan]
  );

  // Core calculation logic
  const calculations = useProjectionCalculations({
    selectedLoan,
    selectedLoanData,
    projSettings,
    exitSettings,
    paymentRecords,
    loans: loans || [],
    loanCollateral,
    updateProjSetting,
    updateExitSetting,
  });

  // Sync local input state when settings change (but not during typing)
  useEffect(() => {
    if (exitSettings && document.activeElement?.getAttribute('name') !== 'startMonth') {
      calculations.setStartMonthInput(exitSettings.startMonth);
    }
  }, [exitSettings?.startMonth]);

  useEffect(() => {
    if (exitSettings && document.activeElement?.getAttribute('name') !== 'endMonth') {
      calculations.setEndMonthInput(exitSettings.endMonth);
    }
  }, [exitSettings?.endMonth]);

  // Projection grid (income/expenses/net cash flow)
  const grid = useProjectionGrid({
    projSettings,
    exitSettings,
    sanitizedExitSettings: calculations.sanitizedExitSettings,
    projectedPaymentValue: calculations.projectedPaymentValue,
    calculatedExitValue: calculations.calculatedExitValue,
    classicEntries,
    mode,
  });

  // Bid statistics
  const bid = useBidStatistics({
    mode,
    selectedLoan,
    selectedLoanData,
    exitSettings,
    sanitizedExitSettings: calculations.sanitizedExitSettings,
    paymentRecords,
    loans: loans || [],
    loanCollateral,
    projectionGrid: grid.projectionGrid,
    totalExitProceeds: calculations.totalExitProceeds,
    classicEntries,
  });

  // Loading state (must be after all hooks)
  if (loadingLoans || loadingPayments || loadingCollateral || loadingProjSettings || loadingExitSettings) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

  if (!selectedLoanData || !projSettings || !exitSettings) {
    debug.warn('[ProjectionsTab] No loan data or settings available');
    return <div className="p-4"><p className={styles.textMuted}>No loan selected</p></div>;
  }

  return (
    <div className="p-4">
      <ModeSelector mode={mode} setMode={setMode} styles={styles} />
      <LoanHeader selectedLoan={selectedLoan} selectedLoanData={selectedLoanData} styles={styles} />

      {/* Modern Mode */}
      {mode === 'modern' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <ProjectionSettingsPanel
                projSettings={projSettings}
                updateProjSetting={updateProjSetting}
                projectedPaymentValue={calculations.projectedPaymentValue}
                getProjectedRate={calculations.getProjectedRate}
                handleAddBackPercentageChange={calculations.handleAddBackPercentageChange}
                handleAddBackPercentageBlur={calculations.handleAddBackPercentageBlur}
                styles={styles}
              />
              <ExitSettingsPanel
                exitSettings={exitSettings}
                updateExitSetting={updateExitSetting}
                startMonthInput={calculations.startMonthInput}
                endMonthInput={calculations.endMonthInput}
                handleStartMonthChange={calculations.handleStartMonthChange}
                handleEndMonthChange={calculations.handleEndMonthChange}
                handleStartMonthBlur={calculations.handleStartMonthBlur}
                handleEndMonthBlur={calculations.handleEndMonthBlur}
                calculatedExitValue={calculations.calculatedExitValue}
                addBackValue={calculations.addBackValue}
                totalExitProceeds={calculations.totalExitProceeds}
                selectedLoanData={selectedLoanData}
                styles={styles}
              />
            </div>
            <BidStatisticsPanel
              bidStatistics={bid.bidStatistics}
              discountRate={bid.discountRate}
              setDiscountRate={bid.setDiscountRate}
              styles={styles}
            />
          </div>

          <div className="mt-4 space-y-4">
            <CashFlowTable
              title="Projected Income"
              data={grid.projectionGrid.income}
              styles={styles}
              colorMode="income"
              filterEmptyYears
            />
            <CashFlowTable
              title="Projected Expenses"
              data={grid.projectionGrid.expenses}
              styles={styles}
              colorMode="expense"
              filterEmptyYears
            />
            <CashFlowTable
              title="Net Cash Flow"
              data={grid.projectionGrid.netCashFlow}
              styles={styles}
              colorMode="net"
              filterEmptyYears
            />
          </div>
        </>
      )}

      {/* Classic Mode */}
      {mode === 'classic' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              <ClassicEntryForm
                classicEntries={classicEntries}
                setClassicEntries={setClassicEntries}
                styles={styles}
              />
              <CashFlowTable
                title="Income"
                data={grid.projectionGrid.income}
                sortedYears={grid.sortedIncomeYears}
                yearSums={grid.yearSums.income}
                styles={styles}
                colorMode="income"
                formatCurrency={grid.formatCurrency}
                useStickyHeader
              />
              <CashFlowTable
                title="Expenses"
                data={grid.projectionGrid.expenses}
                sortedYears={grid.sortedExpenseYears}
                yearSums={grid.yearSums.expenses}
                styles={styles}
                colorMode="expense"
                formatCurrency={grid.formatCurrency}
                filterEmptyYears
                useStickyHeader
              />
              <CashFlowTable
                title="Net Cash Flow"
                data={grid.projectionGrid.netCashFlow}
                sortedYears={grid.sortedNetCashFlowYears}
                yearSums={grid.yearSums.netCashFlow}
                styles={styles}
                colorMode="net"
                formatCurrency={grid.formatCurrency}
                useStickyHeader
              />
            </div>
            <BidStatisticsPanel
              bidStatistics={bid.bidStatistics}
              discountRate={bid.discountRate}
              setDiscountRate={bid.setDiscountRate}
              styles={styles}
              compact
            />
          </div>
        </>
      )}
    </div>
  );
});
ProjectionsTab.displayName = 'ProjectionsTab';
