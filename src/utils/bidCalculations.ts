// Bid statistics and optimal exit analysis calculations
import { calculateNPV, calculateIRR, calculateXIRR } from './financialFormulas';

/**
 * Build monthly cash flow array from projection grid
 * @param netCashFlow - Projection grid with year -> month -> value structure
 * @param startMonth - Starting month (1-60)
 * @param endMonth - Ending month (1-60)
 * @returns Array of monthly cash flows
 */
export const buildMonthlyCashFlowArray = (
  netCashFlow: Record<string, Record<number, number>>,
  startMonth: number,
  endMonth: number
): number[] => {
  const cashFlows: number[] = [];
  const currentYear = new Date().getFullYear();

  for (let month = startMonth; month <= endMonth; month++) {
    const actualMonth = ((month - 1) % 12) + 1;
    const yearOffset = Math.floor((month - 1) / 12);
    const year = (currentYear + yearOffset).toString();

    const yearData = netCashFlow[year] || {};
    cashFlows.push(yearData[actualMonth] || 0);
  }

  return cashFlows;
};

/**
 * Bid Statistics Interface
 */
export interface BidStatistics {
  bidPrice: number;
  bidPercentage: number;
  moic: number;
  cashYield: number;
  f12CashFlow: number;
  p12CashFlow: number;
  f12vsP12Change: number;
  bidToCollateralPercentage: number;
  ytm: number;
  ytmXirr: number;
}

/**
 * Calculate comprehensive bid statistics
 */
export const calculateBidStatistics = (params: {
  netCashFlow: Record<string, Record<number, number>>;
  startMonth: number;
  endMonth: number;
  upb: number;
  collateralValue: number;
  discountRate: number;
  contractualPayment: number;
  interestRate: number;
  monthsToAmortization: number;
  monthsToMaturity: number;
  exitProceeds: number;
  trailingP12?: number;
}): BidStatistics => {
  const {
    netCashFlow,
    startMonth,
    endMonth,
    upb,
    collateralValue,
    discountRate,
    contractualPayment,
    monthsToAmortization,
    monthsToMaturity,
    exitProceeds,
    trailingP12 = 0
  } = params;

  const maxMonth = Math.min(endMonth, 60);
  const cashFlows = buildMonthlyCashFlowArray(netCashFlow, 1, maxMonth);

  // 1. Bid Price = NPV of net cash flows + PV of exit proceeds at discount rate
  const monthlyRate = discountRate / 100 / 12;
  const npvCashFlows = calculateNPV(discountRate, cashFlows);
  const exitPV = exitProceeds / Math.pow(1 + monthlyRate, endMonth);
  const bidPrice = npvCashFlows + exitPV;

  // 2. Bid Percentage = Bid Price / UPB
  const bidPercentage = upb > 0 ? (bidPrice / upb) * 100 : 0;

  // 3. MOIC = Total Cash Received / Capital Invested (Bid Price)
  const totalNetCashFlow = cashFlows.reduce((sum, cf) => sum + cf, 0);
  const totalCashReceived = totalNetCashFlow + exitProceeds;
  const moic = bidPrice > 0 ? totalCashReceived / bidPrice : 0;

  // 4. Cash Yield = First 12 months of Net Cash Flow / Bid Price
  const first12MonthsCF = cashFlows.slice(0, 12).reduce((sum, cf) => sum + cf, 0);
  const cashYield = bidPrice > 0 ? (first12MonthsCF / bidPrice) * 100 : 0;

  // 5. F12 vs P12
  const f12CashFlow = cashFlows.slice(0, 12).reduce((sum, cf) => sum + cf, 0);
  const p12CashFlow = trailingP12;
  const f12vsP12Change = p12CashFlow > 0 ? ((f12CashFlow - p12CashFlow) / p12CashFlow) * 100 : 0;

  // 6. Bid to Collateral Percentage
  const bidToCollateralPercentage = collateralValue > 0 ? (bidPrice / collateralValue) * 100 : 0;

  // 7. YTM Calculation
  const holdPeriod = Math.min(monthsToAmortization || 360, monthsToMaturity || 360, endMonth - startMonth + 1);
  const ytmCashFlows: number[] = [-bidPrice];

  for (let m = 1; m <= holdPeriod; m++) {
    if (m === holdPeriod) {
      ytmCashFlows.push(contractualPayment + exitProceeds);
    } else {
      ytmCashFlows.push(contractualPayment);
    }
  }

  const ytm = calculateIRR(ytmCashFlows, discountRate / 100) * 100;

  // Calculate XIRR with actual dates
  const startDate = new Date();
  const ytmDates: Date[] = [startDate];
  for (let m = 1; m <= holdPeriod; m++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + m);
    ytmDates.push(date);
  }
  const ytmXirr = calculateXIRR(ytmCashFlows, ytmDates, discountRate / 100) * 100;

  return {
    bidPrice,
    bidPercentage,
    moic,
    cashYield,
    f12CashFlow,
    p12CashFlow,
    f12vsP12Change,
    bidToCollateralPercentage,
    ytm: isFinite(ytm) ? ytm : 0,
    ytmXirr: isFinite(ytmXirr) ? ytmXirr : 0
  };
};

/**
 * Optimal Exit Analysis Types
 */
export interface OptimalExitMetrics {
  month: number;
  bidPrice: number;
  moic: number;
  cashYield: number;
  ytm: number;
  ytmXirr: number;
  bidToCollateralPercentage: number;
}

export interface OptimalExitRow {
  month: number;
  bidPrice: number;
  moic: number;
  cashYield: number;
  ytm: number;
  ytmXirr: number;
  bidToCollateralPercentage: number;
}

export interface OptimalExitAnalysis {
  metrics: OptimalExitMetrics[];
  normalizedValues: OptimalExitRow[];
  derivatives: OptimalExitRow[];
  normalizedDerivatives: OptimalExitRow[];
  gaps: OptimalExitRow[];
  overallScore: { month: number; score: number }[];
  optimalMonths: {
    bidPrice: number;
    moic: number;
    cashYield: number;
    ytm: number;
    ytmXirr: number;
    bidToCollateralPercentage: number;
    overall: number;
  };
  normalized: OptimalExitRow[];
}

/**
 * Calculate optimal exit analysis for months 1-60
 * Uses Marginal Utility Equilibrium approach
 */
export const calculateOptimalExitAnalysis = (
  buildCashFlowForMonth: (exitMonth: number) => Record<string, Record<number, number>>,
  calculateExitValueForMonth: (exitMonth: number) => number,
  params: {
    upb: number;
    collateralValue: number;
    discountRate: number;
    contractualPayment: number;
    interestRate: number;
    monthsToAmortization: number;
    monthsToMaturity: number;
    trailingP12: number;
    addBackValue: number;
  }
): OptimalExitAnalysis => {
  const metrics: OptimalExitMetrics[] = [];
  const metricKeys = ['bidPrice', 'moic', 'cashYield', 'ytm', 'ytmXirr', 'bidToCollateralPercentage'] as const;
  type MetricKey = typeof metricKeys[number];

  // Step 1: Calculate raw metrics for each exit month (1-60)
  for (let month = 1; month <= 60; month++) {
    const netCashFlow = buildCashFlowForMonth(month);
    const exitValue = calculateExitValueForMonth(month);
    const totalExitProceeds = exitValue + params.addBackValue;

    const stats = calculateBidStatistics({
      netCashFlow,
      startMonth: 1,
      endMonth: month,
      upb: params.upb,
      collateralValue: params.collateralValue,
      discountRate: params.discountRate,
      contractualPayment: params.contractualPayment,
      interestRate: params.interestRate,
      monthsToAmortization: params.monthsToAmortization,
      monthsToMaturity: params.monthsToMaturity,
      exitProceeds: totalExitProceeds,
      trailingP12: params.trailingP12
    });

    metrics.push({
      month,
      bidPrice: stats.bidPrice,
      moic: stats.moic,
      cashYield: stats.cashYield,
      ytm: stats.ytm,
      ytmXirr: stats.ytmXirr,
      bidToCollateralPercentage: stats.bidToCollateralPercentage
    });
  }

  // Helper: Get min/max for a metric across all months
  const getMetricRange = (key: MetricKey) => {
    const values = metrics.map(m => m[key]).filter(v => isFinite(v));
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  // Step 2: Normalize metric values (0-1 scale)
  const metricRanges = {
    bidPrice: getMetricRange('bidPrice'),
    moic: getMetricRange('moic'),
    cashYield: getMetricRange('cashYield'),
    ytm: getMetricRange('ytm'),
    ytmXirr: getMetricRange('ytmXirr'),
    bidToCollateralPercentage: getMetricRange('bidToCollateralPercentage')
  };

  const normalizeValue = (value: number, range: { min: number; max: number }, lowerIsBetter: boolean): number => {
    if (range.max === range.min) return 0.5;
    const normalized = (value - range.min) / (range.max - range.min);
    return lowerIsBetter ? (1 - normalized) : normalized;
  };

  const normalizedValues: OptimalExitRow[] = metrics.map(m => ({
    month: m.month,
    bidPrice: normalizeValue(m.bidPrice, metricRanges.bidPrice, false),
    moic: normalizeValue(m.moic, metricRanges.moic, false),
    cashYield: normalizeValue(m.cashYield, metricRanges.cashYield, false),
    ytm: normalizeValue(m.ytm, metricRanges.ytm, false),
    ytmXirr: normalizeValue(m.ytmXirr, metricRanges.ytmXirr, false),
    bidToCollateralPercentage: normalizeValue(m.bidToCollateralPercentage, metricRanges.bidToCollateralPercentage, true)
  }));

  // Step 3: Calculate derivatives
  const derivatives: OptimalExitRow[] = [];
  for (let i = 1; i < metrics.length; i++) {
    const prev = metrics[i - 1];
    const curr = metrics[i];
    derivatives.push({
      month: curr.month,
      bidPrice: curr.bidPrice - prev.bidPrice,
      moic: curr.moic - prev.moic,
      cashYield: curr.cashYield - prev.cashYield,
      ytm: curr.ytm - prev.ytm,
      ytmXirr: curr.ytmXirr - prev.ytmXirr,
      bidToCollateralPercentage: curr.bidToCollateralPercentage - prev.bidToCollateralPercentage
    });
  }

  // Step 4: Normalize derivatives
  const getDerivativeRange = (key: MetricKey) => {
    const values = derivatives.map(d => d[key]).filter(v => isFinite(v));
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  const derivativeRanges = {
    bidPrice: getDerivativeRange('bidPrice'),
    moic: getDerivativeRange('moic'),
    cashYield: getDerivativeRange('cashYield'),
    ytm: getDerivativeRange('ytm'),
    ytmXirr: getDerivativeRange('ytmXirr'),
    bidToCollateralPercentage: getDerivativeRange('bidToCollateralPercentage')
  };

  const normalizeDerivative = (value: number, range: { min: number; max: number }, lowerIsBetter: boolean): number => {
    if (range.max === range.min) return 0.5;
    const normalized = (value - range.min) / (range.max - range.min);
    return lowerIsBetter ? (1 - normalized) : normalized;
  };

  const normalizedDerivatives: OptimalExitRow[] = derivatives.map(d => ({
    month: d.month,
    bidPrice: normalizeDerivative(d.bidPrice, derivativeRanges.bidPrice, false),
    moic: normalizeDerivative(d.moic, derivativeRanges.moic, false),
    cashYield: normalizeDerivative(d.cashYield, derivativeRanges.cashYield, false),
    ytm: normalizeDerivative(d.ytm, derivativeRanges.ytm, false),
    ytmXirr: normalizeDerivative(d.ytmXirr, derivativeRanges.ytmXirr, false),
    bidToCollateralPercentage: normalizeDerivative(d.bidToCollateralPercentage, derivativeRanges.bidToCollateralPercentage, true)
  }));

  // Step 5: Calculate gaps
  const gaps: OptimalExitRow[] = normalizedDerivatives.map((nd, i) => {
    const nv = normalizedValues[i + 1];
    return {
      month: nd.month,
      bidPrice: Math.abs(nv.bidPrice - nd.bidPrice),
      moic: Math.abs(nv.moic - nd.moic),
      cashYield: Math.abs(nv.cashYield - nd.cashYield),
      ytm: Math.abs(nv.ytm - nd.ytm),
      ytmXirr: Math.abs(nv.ytmXirr - nd.ytmXirr),
      bidToCollateralPercentage: Math.abs(nv.bidToCollateralPercentage - nd.bidToCollateralPercentage)
    };
  });

  // Step 6: Overall combined score
  const overallScore: { month: number; score: number }[] = gaps.map(g => ({
    month: g.month,
    score: g.bidPrice + g.moic + g.cashYield + g.ytm + g.ytmXirr + g.bidToCollateralPercentage
  }));

  // Step 7: Find optimal months
  const findOptimalMonth = (key: MetricKey): number => {
    let minGap = Infinity;
    let optimalMonth = 2;
    for (const g of gaps) {
      if (g[key] < minGap) {
        minGap = g[key];
        optimalMonth = g.month;
      }
    }
    return optimalMonth;
  };

  const findOverallOptimal = (): number => {
    let minScore = Infinity;
    let optimalMonth = 2;
    for (const s of overallScore) {
      if (s.score < minScore) {
        minScore = s.score;
        optimalMonth = s.month;
      }
    }
    return optimalMonth;
  };

  const optimalMonths = {
    bidPrice: findOptimalMonth('bidPrice'),
    moic: findOptimalMonth('moic'),
    cashYield: findOptimalMonth('cashYield'),
    ytm: findOptimalMonth('ytm'),
    ytmXirr: findOptimalMonth('ytmXirr'),
    bidToCollateralPercentage: findOptimalMonth('bidToCollateralPercentage'),
    overall: findOverallOptimal()
  };

  return {
    metrics,
    normalizedValues,
    derivatives,
    normalizedDerivatives,
    gaps,
    overallScore,
    optimalMonths,
    normalized: gaps
  };
};
