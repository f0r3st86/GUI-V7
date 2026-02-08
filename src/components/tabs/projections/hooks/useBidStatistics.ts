// Bid statistics calculation logic extracted from ProjectionsTab
import { useMemo, useState } from 'react';
import {
  calculateBidStatistics,
  calculateTrailingPayments,
  calculateAmortizationMonths,
  calculateMonthsToMaturity,
} from '../../../../utils';
import type { BidStatistics } from '../../../../utils/calculations';
import type { Loan, ExitSettings, PaymentRecord } from '../../../../types';
import type { Collateral } from '../../../../types';
import type { ProjectionGrid, ClassicEntry } from '../types';

interface UseBidStatisticsParams {
  mode: 'modern' | 'classic';
  selectedLoan: string;
  selectedLoanData: Loan | undefined;
  exitSettings: ExitSettings | undefined;
  sanitizedExitSettings: { startMonth: string; endMonth: string };
  paymentRecords: PaymentRecord[];
  loans: Loan[];
  loanCollateral: Collateral | undefined;
  projectionGrid: ProjectionGrid;
  totalExitProceeds: number;
  classicEntries: ClassicEntry[];
}

export const useBidStatistics = ({
  mode,
  selectedLoan,
  selectedLoanData,
  exitSettings,
  sanitizedExitSettings,
  paymentRecords,
  loans,
  loanCollateral,
  projectionGrid,
  totalExitProceeds,
  classicEntries,
}: UseBidStatisticsParams) => {
  const [discountRate, setDiscountRate] = useState<string>('15');

  // Get trailing 12 months actual payments for P12 comparison
  const trailingPaymentData = useMemo(() => {
    return calculateTrailingPayments(
      selectedLoan,
      12,
      selectedLoanData?.lastImportDate ?? '',
      paymentRecords,
      loans || []
    );
  }, [selectedLoan, selectedLoanData?.lastImportDate, paymentRecords, loans]);

  // Calculate start/end months for classic mode from entries
  const classicMonthRange = useMemo(() => {
    if (classicEntries.length === 0) {
      return { startMonth: 1, endMonth: 24, totalMonths: 24 };
    }

    let minYearMonth = Infinity;
    let maxYearMonth = -Infinity;

    classicEntries.forEach(entry => {
      const startYM = parseInt(entry.startYear) * 12 + parseInt(entry.startMonth);
      const endYM = parseInt(entry.endYear) * 12 + parseInt(entry.endMonth);
      minYearMonth = Math.min(minYearMonth, startYM);
      maxYearMonth = Math.max(maxYearMonth, endYM);
    });

    const totalMonths = maxYearMonth - minYearMonth + 1;
    return { startMonth: 1, endMonth: totalMonths, totalMonths };
  }, [classicEntries]);

  // Calculate bid statistics
  const bidStatistics: BidStatistics = useMemo(() => {
    const isClassicMode = mode === 'classic';

    const startMonth = isClassicMode ? classicMonthRange.startMonth : (parseInt(sanitizedExitSettings.startMonth) || 1);
    const endMonth = isClassicMode ? classicMonthRange.endMonth : (parseInt(sanitizedExitSettings.endMonth) || 24);
    const upb = selectedLoanData?.principal ?? 0;
    const collateralValue = loanCollateral ? parseFloat(String(loanCollateral.ourValue).replace(/[$,]/g, '')) : 0;
    const discRate = parseFloat(discountRate) || 15;
    const contractualPayment = selectedLoanData?.pmt ?? 0;
    const interestRate = selectedLoanData?.intRate ?? 0;
    const monthsToAmort = calculateAmortizationMonths(
      selectedLoanData?.principal ?? 0,
      selectedLoanData?.pmt ?? 0,
      selectedLoanData?.intRate ?? 0
    );
    const monthsToMat = calculateMonthsToMaturity(selectedLoanData?.matDt ?? '');
    const trailingP12 = trailingPaymentData?.actual ?? 0;

    let exitProceedsForStats = 0;
    if (!isClassicMode) {
      const isLiquidation = exitSettings?.method === 'Liquidation';
      exitProceedsForStats = isLiquidation ? 0 : totalExitProceeds;
    }

    return calculateBidStatistics({
      netCashFlow: projectionGrid.netCashFlow,
      startMonth,
      endMonth,
      upb,
      collateralValue,
      discountRate: discRate,
      contractualPayment,
      interestRate,
      monthsToAmortization: monthsToAmort,
      monthsToMaturity: monthsToMat,
      exitProceeds: exitProceedsForStats,
      trailingP12
    });
  }, [
    mode,
    classicMonthRange,
    projectionGrid.netCashFlow,
    sanitizedExitSettings.startMonth,
    sanitizedExitSettings.endMonth,
    selectedLoanData?.principal,
    selectedLoanData?.pmt,
    selectedLoanData?.intRate,
    selectedLoanData?.matDt,
    loanCollateral,
    discountRate,
    totalExitProceeds,
    exitSettings?.method,
    trailingPaymentData?.actual
  ]);

  return {
    discountRate,
    setDiscountRate,
    bidStatistics,
  };
};
