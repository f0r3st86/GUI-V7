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

    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
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
 * FV = PV * (1 + rate)^nper - Payment * [((1 + rate)^nper - 1) / rate]
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

  const fv = pv * Math.pow(1 + rate, nper) - payment * ((Math.pow(1 + rate, nper) - 1) / rate);
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

  // Parse last import date (MM/DD/YY format)
  const [endMonth, endDay, endYear] = lastImportDate.split('/');
  const endDate = new Date(2000 + parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));

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
