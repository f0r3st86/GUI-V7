// Financial calculation utilities - exact copy from original component
import type { Loan, PaymentRecord, TrailingPaymentData } from '../types';

/**
 * Calculate months between two dates
 * @param startDate - Start date in MM/DD/YY format
 * @param endDate - End date in MM/DD/YY format
 * @returns Number of months between dates
 */
export const calculateMonthsBetween = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;

  // Parse dates - handle MM/DD/YY format
  const parseDate = (dateStr: string): Date | null => {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    let month = parseInt(parts[0]) - 1; // JavaScript months are 0-based
    let day = parseInt(parts[1]);
    let year = parseInt(parts[2]);

    // Handle 2-digit years with sliding window algorithm
    // Fixes Y2.1K bug - works correctly past year 2100
    if (year < 100) {
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const currentTwoDigit = currentYear % 100;

      // Use 50-year sliding window centered on current year
      // If 2-digit year is within +50 years, use current or next century
      // If 2-digit year is more than 50 years forward, assume previous century
      if (year >= currentTwoDigit - 50 && year <= currentTwoDigit + 50) {
        year += currentCentury;
      } else if (year < currentTwoDigit - 50) {
        year += currentCentury + 100; // Next century
      } else {
        year += currentCentury - 100; // Previous century
      }
    }

    return new Date(year, month, day);
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) return 0;

  // Calculate the difference in months
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();

  // Add days consideration - if end day is before start day, subtract a month
  if (end.getDate() < start.getDate()) {
    months--;
  }

  return Math.floor(Math.max(0, months)); // Round down and ensure non-negative
};

/**
 * Calculate months of interest accrued using the formula:
 * Months = Interest Balance / (Principal Balance * (Rate/12))
 * This tells us how many months worth of interest have accumulated
 * For example: $108.72 interest / ($21,505.49 principal * (8.5%/12)) = ~0.71 months
 */
export const calculateInterestAccrued = (
  interestBalance: number | string,
  principalBalance: number | string,
  interestRate: number | string
): string => {
  // Remove $ and commas from balances
  const cleanInterest = parseFloat(String(interestBalance).replace(/[$,]/g, '')) || 0;
  const cleanPrincipal = parseFloat(String(principalBalance).replace(/[$,]/g, '')) || 0;
  const cleanRate = parseFloat(String(interestRate).replace(/%/g, '')) || 0;

  // Avoid division by zero
  if (cleanPrincipal === 0 || cleanRate === 0) return '0.00';

  // Calculate monthly interest rate (convert percentage to decimal)
  const monthlyRate = (cleanRate / 100) / 12;

  // Calculate months of interest accrued
  const months = cleanInterest / (cleanPrincipal * monthlyRate);

  // Return with 2 decimal places
  return months.toFixed(2);
};

/**
 * Calculate months to maturity (from current date to MatDt)
 */
export const calculateMonthsToMaturity = (maturityDate: string): number => {
  const today = new Date();
  const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear() % 100}`;
  return calculateMonthsBetween(todayStr, maturityDate);
};

/**
 * Calculate months to amortization using NPER formula
 * NPER = -log(1 - (rate * PV / PMT)) / log(1 + rate)
 * Where: rate = annual rate / 12, PV = present value (principal balance), PMT = payment, FV = 0
 * This calculates how many monthly payments are needed to fully pay off the current principal balance
 * Example: $21,505.49 principal at 8.5% with $608.15 payment = ~41 months
 */
export const calculateAmortizationMonths = (
  principalBalance: number | string,
  payment: number | string,
  annualRate: number | string
): number => {
  // Clean the input values
  const cleanPrincipal = parseFloat(String(principalBalance).replace(/[$,]/g, '')) || 0;
  const cleanPayment = parseFloat(String(payment).replace(/[$,]/g, '')) || 0;
  const cleanRate = parseFloat(String(annualRate).replace(/%/g, '')) || 0;

  // Avoid division by zero or invalid inputs
  if (cleanPayment === 0 || cleanRate === 0 || cleanPrincipal === 0) return 0;

  // Convert annual rate to monthly rate (as decimal)
  const monthlyRate = (cleanRate / 100) / 12;

  // Calculate the monthly interest amount
  const monthlyInterest = cleanPrincipal * monthlyRate;

  // Check if payment is less than monthly interest (loan will never be paid off)
  if (cleanPayment <= monthlyInterest) return 999; // Return max value to indicate infinite

  // NPER formula: -ln(1 - (rate * PV / PMT)) / ln(1 + rate)
  // Note: We use natural log (Math.log) in JavaScript
  const numerator = -Math.log(1 - (monthlyRate * cleanPrincipal / cleanPayment));
  const denominator = Math.log(1 + monthlyRate);

  const months = numerator / denominator;

  // Round down to nearest whole number
  return Math.floor(Math.max(0, months));
};

/**
 * Calculate PMT (Excel PMT function equivalent)
 * PMT(rate, nper, pv) = pv * (rate * (1 + rate)^nper) / ((1 + rate)^nper - 1)
 */
export const calculatePMT = (
  annualRate: number,
  nper: number,
  pv: number
): number => {
  const rate = annualRate / 100 / 12; // Monthly rate

  if (rate === 0) return pv / nper;

  const payment = pv * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
  return payment;
};

/**
 * Calculate FV (Excel FV function equivalent)
 * FV = PV * (1 + rate)^nper + Payment * [((1 + rate)^nper - 1) / rate]
 * Note: Use negative payment for loan paydown scenarios
 */
export const calculateFV = (
  annualRate: number,
  nper: number,
  payment: number,
  pv: number
): number => {
  const rate = annualRate / 100 / 12; // Monthly rate

  if (rate === 0) {
    return pv + payment * nper;
  }

  const fv = pv * Math.pow(1 + rate, nper) + payment * ((Math.pow(1 + rate, nper) - 1) / rate);
  return fv;
};

/**
 * Calculate PV (Excel PV function equivalent)
 * PV = Payment * [(1 - (1 + rate)^-nper) / rate] + FV / (1 + rate)^nper
 */
export const calculatePV = (
  annualRate: number,
  nper: number,
  payment: number,
  fv: number = 0
): number => {
  const rate = annualRate / 100 / 12; // Monthly rate

  if (rate === 0) {
    return payment * nper;
  }

  const pv = payment * ((1 - Math.pow(1 + rate, -nper)) / rate) + fv / Math.pow(1 + rate, nper);
  return pv;
};

/**
 * Calculate trailing payment metrics
 */
export const calculateTrailingPayments = (
  loanNo: string,
  months: number,
  lastImportDate: string,
  paymentRecords: PaymentRecord[],
  loans: Loan[]
): TrailingPaymentData | null => {
  if (!lastImportDate) return null;

  // Parse last import date (MM/DD/YY format) - use sliding window for Y2.1K compliance
  const [endMonth, endDay, endYear] = lastImportDate.split('/');
  let year = parseInt(endYear);

  // Apply same sliding window algorithm as calculateMonthsBetween
  if (year < 100) {
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const currentTwoDigit = currentYear % 100;

    if (year >= currentTwoDigit - 50 && year <= currentTwoDigit + 50) {
      year += currentCentury;
    } else if (year < currentTwoDigit - 50) {
      year += currentCentury + 100;
    } else {
      year += currentCentury - 100;
    }
  }

  const endDate = new Date(year, parseInt(endMonth) - 1, parseInt(endDay));

  // Calculate start date
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - months + 1);

  // Get payment records for this loan
  const loanPayments = paymentRecords.filter(
    p => p.loanNo === loanNo && p.year && p.month && p.amount
  );

  // Filter payments within the trailing period
  const trailingPayments = loanPayments.filter(p => {
    const paymentDate = new Date(parseInt(p.year), parseInt(p.month) - 1, 1);
    return paymentDate >= startDate && paymentDate <= endDate;
  });

  // Calculate actual total
  const actualTotal = trailingPayments.reduce((sum, p) => {
    const amount = parseFloat(String(p.amount).replace(/[$,]/g, '')) || 0;
    return sum + amount;
  }, 0);

  // Get loan data for contractual payment
  const loan = loans.find(l => l.mwLoanNo === loanNo);
  const contractualMonthly = loan ? loan.pmt : 0;
  const contractualTotal = contractualMonthly * months;

  // Calculate interest-only payment
  const interestOnlyMonthly = loan ? (loan.principal * (loan.intRate / 100) / 12) : 0;
  const interestOnlyTotal = interestOnlyMonthly * months;

  // Calculate percentages
  const percentOfContractual = contractualTotal > 0 ? (actualTotal / contractualTotal * 100) : 0;
  const percentOfInterestOnly = interestOnlyTotal > 0 ? (actualTotal / interestOnlyTotal * 100) : 0;

  // Calculate months paid (how many months worth of payments were made)
  const monthsPaidContractual = contractualMonthly > 0 ? (actualTotal / contractualMonthly) : 0;
  const monthsPaidInterest = interestOnlyMonthly > 0 ? (actualTotal / interestOnlyMonthly) : 0;

  return {
    actual: actualTotal,
    monthly: actualTotal / months,
    yearly: actualTotal * (12 / months),
    contractualTotal,
    contractualMonthly,
    interestOnlyTotal,
    interestOnlyMonthly,
    percentOfContractual,
    percentOfInterestOnly,
    monthsPaidContractual,
    monthsPaidInterest,
    paymentsReceived: trailingPayments.length,
    paymentsExpected: months
  };
};

/**
 * Calculate $/SF for a given value (whole number)
 */
export const calculatePerSqft = (value: string | number, sqft: string | number): string => {
  const cleanValue = parseFloat(String(value).replace(/[$,]/g, '')) || 0;
  const cleanSqft = parseFloat(String(sqft).replace(/,/g, '')) || 0;
  if (cleanSqft === 0) return '0';
  return Math.round(cleanValue / cleanSqft).toLocaleString();
};

/**
 * Calculate $/Unit (with comma formatting)
 */
export const calculatePerUnit = (value: string | number, units: string | number): string => {
  const cleanValue = parseFloat(String(value).replace(/[$,]/g, '')) || 0;
  const cleanUnits = parseFloat(String(units).replace(/,/g, '')) || 0;
  if (cleanUnits === 0) return '0';
  return Math.round(cleanValue / cleanUnits).toLocaleString();
};

/**
 * Calculate $/Acre (with comma formatting)
 */
export const calculatePerAcre = (value: string | number, acres: string | number): string => {
  const cleanValue = parseFloat(String(value).replace(/[$,]/g, '')) || 0;
  const cleanAcres = parseFloat(String(acres).replace(/,/g, '')) || 0;
  if (cleanAcres === 0) return '0';
  return Math.round(cleanValue / cleanAcres).toLocaleString();
};

/**
 * Calculate year sum for payment/projection grid
 */
export const calculateYearSum = (yearData: Record<number, number> | undefined): number => {
  return Object.values(yearData || {}).reduce((sum, val) => sum + val, 0);
};

/**
 * Calculate NPV (Net Present Value) of a series of cash flows
 * NPV = Σ (CF_t / (1 + r)^t) for t = 1 to n
 * @param discountRate - Annual discount rate as percentage (e.g., 15 for 15%)
 * @param cashFlows - Array of monthly cash flows (index 0 = month 1)
 * @returns NPV of cash flows
 */
export const calculateNPV = (
  discountRate: number,
  cashFlows: number[]
): number => {
  if (cashFlows.length === 0) return 0;

  const monthlyRate = discountRate / 100 / 12;

  let npv = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    // t+1 because first cash flow is at end of month 1, not month 0
    npv += cashFlows[t] / Math.pow(1 + monthlyRate, t + 1);
  }

  return npv;
};

/**
 * Calculate IRR (Internal Rate of Return) using Newton-Raphson method
 * Finds the rate r where: NPV(r, cashFlows) = 0
 * @param cashFlows - Array of cash flows where index 0 is initial investment (negative) and subsequent are returns
 * @param guess - Initial guess for IRR (default 0.1 = 10%)
 * @param maxIterations - Maximum iterations (default 100)
 * @param tolerance - Convergence tolerance (default 0.0001)
 * @returns Annual IRR as decimal (e.g., 0.15 for 15%), or NaN if no solution
 */
export const calculateIRR = (
  cashFlows: number[],
  guess: number = 0.1,
  maxIterations: number = 100,
  tolerance: number = 0.0001
): number => {
  if (cashFlows.length < 2) return NaN;

  // Convert annual guess to monthly
  let rate = guess / 12;

  for (let i = 0; i < maxIterations; i++) {
    // Calculate NPV and its derivative at current rate
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t];
      const discountFactor = Math.pow(1 + rate, t);
      npv += cf / discountFactor;
      // Derivative of CF/(1+r)^t with respect to r is -t * CF / (1+r)^(t+1)
      derivative -= t * cf / Math.pow(1 + rate, t + 1);
    }

    // Check for convergence
    if (Math.abs(npv) < tolerance) {
      // Convert monthly rate back to annual
      return rate * 12;
    }

    // Newton-Raphson step
    if (derivative === 0) break; // Avoid division by zero
    const newRate = rate - npv / derivative;

    // Clamp rate to reasonable bounds
    if (newRate < -0.99 / 12) rate = -0.99 / 12;
    else if (newRate > 10) rate = 10;
    else rate = newRate;
  }

  // Return last computed rate even if not converged
  return rate * 12;
};

/**
 * Calculate XIRR (IRR with actual dates) using Newton-Raphson method
 * Finds the rate r where: Σ (CF_i / (1 + r)^((date_i - date_0)/365)) = 0
 * @param cashFlows - Array of cash flow values
 * @param dates - Array of dates corresponding to each cash flow
 * @param guess - Initial guess for XIRR (default 0.1 = 10%)
 * @param maxIterations - Maximum iterations (default 100)
 * @param tolerance - Convergence tolerance (default 0.0001)
 * @returns Annual XIRR as decimal (e.g., 0.15 for 15%), or NaN if no solution
 */
export const calculateXIRR = (
  cashFlows: number[],
  dates: Date[],
  guess: number = 0.1,
  maxIterations: number = 100,
  tolerance: number = 0.0001
): number => {
  if (cashFlows.length < 2 || cashFlows.length !== dates.length) return NaN;

  const firstDate = dates[0].getTime();

  // Calculate year fractions for each date
  const yearFractions = dates.map(date =>
    (date.getTime() - firstDate) / (365 * 24 * 60 * 60 * 1000)
  );

  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t];
      const yearFrac = yearFractions[t];
      const discountFactor = Math.pow(1 + rate, yearFrac);
      npv += cf / discountFactor;
      // Derivative with respect to rate
      derivative -= yearFrac * cf / Math.pow(1 + rate, yearFrac + 1);
    }

    // Check for convergence
    if (Math.abs(npv) < tolerance) {
      return rate;
    }

    // Newton-Raphson step
    if (derivative === 0) break;
    const newRate = rate - npv / derivative;

    // Clamp rate to reasonable bounds
    if (newRate < -0.99) rate = -0.99;
    else if (newRate > 10) rate = 10;
    else rate = newRate;
  }

  return rate;
};

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
 * @param params - Parameters for bid calculation
 * @returns BidStatistics object
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
  trailingP12?: number; // Prior 12 months actual payments
}): BidStatistics => {
  const {
    netCashFlow,
    startMonth,
    endMonth,
    upb,
    collateralValue,
    discountRate,
    contractualPayment,
    // interestRate - kept in interface for future use (e.g., interest-only period calculations)
    monthsToAmortization,
    monthsToMaturity,
    exitProceeds,
    trailingP12 = 0
  } = params;

  // Build cash flow array for months 1-60
  const maxMonth = Math.min(endMonth, 60);
  const cashFlows = buildMonthlyCashFlowArray(netCashFlow, 1, maxMonth);

  // 1. Bid Price = NPV of net cash flows + PV of exit proceeds at discount rate
  // Exit proceeds occur at the end of the hold period, discounted back to present
  const monthlyRate = discountRate / 100 / 12;
  const npvCashFlows = calculateNPV(discountRate, cashFlows);
  const exitPV = exitProceeds / Math.pow(1 + monthlyRate, endMonth);
  const bidPrice = npvCashFlows + exitPV;

  // 2. Bid Percentage = Bid Price / UPB
  const bidPercentage = upb > 0 ? (bidPrice / upb) * 100 : 0;

  // 3. MOIC = Total Cash Received / Capital Invested (Bid Price)
  // Total cash = sum of net cash flows + exit proceeds
  const totalNetCashFlow = cashFlows.reduce((sum, cf) => sum + cf, 0);
  const totalCashReceived = totalNetCashFlow + exitProceeds;
  const moic = bidPrice > 0 ? totalCashReceived / bidPrice : 0;

  // 4. Cash Yield = First 12 months of Net Cash Flow / Bid Price
  const first12MonthsCF = cashFlows.slice(0, 12).reduce((sum, cf) => sum + cf, 0);
  const cashYield = bidPrice > 0 ? (first12MonthsCF / bidPrice) * 100 : 0;

  // 5. F12 vs P12: Forward 12 months vs Prior 12 months
  // F12 = months 1-12 (forward projection)
  // P12 = trailing 12 months actual payment history
  const f12CashFlow = cashFlows.slice(0, 12).reduce((sum, cf) => sum + cf, 0);
  const p12CashFlow = trailingP12;
  const f12vsP12Change = p12CashFlow > 0 ? ((f12CashFlow - p12CashFlow) / p12CashFlow) * 100 : 0;

  // 6. Bid to Collateral Percentage = Bid Price / Collateral Value
  const bidToCollateralPercentage = collateralValue > 0 ? (bidPrice / collateralValue) * 100 : 0;

  // 7. YTM Calculation
  // Build cash flow stream: contractual payment for min(amort, maturity) months + exit proceeds at end
  const holdPeriod = Math.min(monthsToAmortization || 360, monthsToMaturity || 360, endMonth - startMonth + 1);
  const ytmCashFlows: number[] = [-bidPrice]; // Initial investment (negative)

  // Add monthly contractual payments
  for (let m = 1; m <= holdPeriod; m++) {
    if (m === holdPeriod) {
      // Final month: add contractual payment + exit proceeds
      ytmCashFlows.push(contractualPayment + exitProceeds);
    } else {
      ytmCashFlows.push(contractualPayment);
    }
  }

  // Calculate IRR (monthly) and annualize
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
 * Uses Marginal Utility Equilibrium approach:
 * - Normalizes both absolute values and their derivatives
 * - Finds the "knee" where normalized value ≈ normalized derivative
 * - Gap = |Normalized Value - Normalized Derivative|
 * - Optimal month = where Gap is minimized
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
  // Raw metric values for each month
  metrics: OptimalExitMetrics[];
  // Normalized metric values (0-1, where 1 = best absolute value)
  normalizedValues: OptimalExitRow[];
  // Rate of change (derivative) per month
  derivatives: OptimalExitRow[];
  // Normalized derivatives (0-1, where 1 = fastest improvement)
  normalizedDerivatives: OptimalExitRow[];
  // Gap = |Normalized Value - Normalized Derivative|
  gaps: OptimalExitRow[];
  // Overall combined score for each month
  overallScore: { month: number; score: number }[];
  // Optimal month for each metric (where gap is minimized)
  optimalMonths: {
    bidPrice: number;
    moic: number;
    cashYield: number;
    ytm: number;
    ytmXirr: number;
    bidToCollateralPercentage: number;
    overall: number;
  };
  // Legacy: Keep normalized for backward compatibility with heatmap
  normalized: OptimalExitRow[];
}

/**
 * Calculate optimal exit analysis for months 1-60
 * Uses Marginal Utility Equilibrium approach:
 * 1. Normalize metric values (0-1, where 1 = best absolute value)
 * 2. Calculate derivatives (rate of change per month)
 * 3. Normalize derivatives (0-1, where 1 = fastest improvement)
 * 4. Calculate Gap = |Normalized Value - Normalized Derivative|
 * 5. Optimal month = where Gap is minimized (equilibrium point)
 *
 * @param buildCashFlowForMonth - Function that builds cash flow grid for a given exit month
 * @param calculateExitValueForMonth - Function that calculates exit value for a given month
 * @param params - Base parameters for bid statistics calculation
 * @returns OptimalExitAnalysis with all intermediate calculations and optimal months
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
  // For "higher is better" metrics: (value - min) / (max - min) → 1 = best
  // For "lower is better" metrics (bidToCollateral): invert so 1 = best (lowest value)
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

  // Step 3: Calculate derivatives (rate of change per month)
  // d(metric)/dt = metric[month] - metric[month-1]
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

  // Step 4: Normalize derivatives (0-1 scale where 1 = fastest improvement)
  // For "higher is better" metrics: highest positive derivative = 1 (fastest improvement)
  // For "lower is better" metrics: most negative derivative = 1 (fastest improvement = biggest decrease)
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
    // For higher-is-better: highest derivative (most positive) = 1
    // For lower-is-better: lowest derivative (most negative) = 1 (fastest decrease)
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

  // Step 5: Calculate Gap = |Normalized Value - Normalized Derivative|
  // The optimal month is where Gap is minimized (equilibrium point)
  const gaps: OptimalExitRow[] = normalizedDerivatives.map((nd, i) => {
    // normalizedValues starts at month 1, normalizedDerivatives starts at month 2
    // So we need to align them: derivative for month N uses value for month N
    const nv = normalizedValues[i + 1]; // +1 because derivatives start at month 2
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

  // Step 6: Calculate overall combined score for each month
  // Sum of all individual gaps
  const overallScore: { month: number; score: number }[] = gaps.map(g => ({
    month: g.month,
    score: g.bidPrice + g.moic + g.cashYield + g.ytm + g.ytmXirr + g.bidToCollateralPercentage
  }));

  // Step 7: Find optimal month for each metric (minimum gap)
  const findOptimalMonth = (key: MetricKey): number => {
    let minGap = Infinity;
    let optimalMonth = 2; // Derivatives start at month 2
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

  // For backward compatibility with heatmap, use gaps as "normalized"
  // (lower gap = more optimal, which matches the 0=optimal convention)
  return {
    metrics,
    normalizedValues,
    derivatives,
    normalizedDerivatives,
    gaps,
    overallScore,
    optimalMonths,
    normalized: gaps // Legacy compatibility - gaps work same way (lower = better)
  };
};
