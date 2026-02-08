// Loan-specific calculation utilities
import type { Loan, PaymentRecord, TrailingPaymentData } from '../types';

/**
 * Calculate months of interest accrued using the formula:
 * Months = Interest Balance / (Principal Balance * (Rate/12))
 * This tells us how many months worth of interest have accumulated
 */
export const calculateInterestAccrued = (
  interestBalance: number | string,
  principalBalance: number | string,
  interestRate: number | string
): string => {
  const cleanInterest = parseFloat(String(interestBalance).replace(/[$,]/g, '')) || 0;
  const cleanPrincipal = parseFloat(String(principalBalance).replace(/[$,]/g, '')) || 0;
  const cleanRate = parseFloat(String(interestRate).replace(/%/g, '')) || 0;

  if (cleanPrincipal === 0 || cleanRate === 0) return '0.00';

  const monthlyRate = (cleanRate / 100) / 12;
  const months = cleanInterest / (cleanPrincipal * monthlyRate);

  return months.toFixed(2);
};

/**
 * Calculate months to amortization using NPER formula
 * NPER = -log(1 - (rate * PV / PMT)) / log(1 + rate)
 */
export const calculateAmortizationMonths = (
  principalBalance: number | string,
  payment: number | string,
  annualRate: number | string
): number => {
  const cleanPrincipal = parseFloat(String(principalBalance).replace(/[$,]/g, '')) || 0;
  const cleanPayment = parseFloat(String(payment).replace(/[$,]/g, '')) || 0;
  const cleanRate = parseFloat(String(annualRate).replace(/%/g, '')) || 0;

  if (cleanPayment === 0 || cleanRate === 0 || cleanPrincipal === 0) return 0;

  const monthlyRate = (cleanRate / 100) / 12;
  const monthlyInterest = cleanPrincipal * monthlyRate;

  if (cleanPayment <= monthlyInterest) return 999;

  const numerator = -Math.log(1 - (monthlyRate * cleanPrincipal / cleanPayment));
  const denominator = Math.log(1 + monthlyRate);

  const months = numerator / denominator;
  return Math.floor(Math.max(0, months));
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

  const [endMonth, endDay, endYear] = lastImportDate.split('/');
  let year = parseInt(endYear);

  // Apply sliding window algorithm for 2-digit years
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

  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - months + 1);

  const loanPayments = paymentRecords.filter(
    p => p.loanNo === loanNo && p.year && p.month && p.amount
  );

  const trailingPayments = loanPayments.filter(p => {
    const paymentDate = new Date(parseInt(p.year), parseInt(p.month) - 1, 1);
    return paymentDate >= startDate && paymentDate <= endDate;
  });

  const actualTotal = trailingPayments.reduce((sum, p) => {
    const amount = parseFloat(String(p.amount).replace(/[$,]/g, '')) || 0;
    return sum + amount;
  }, 0);

  const loan = loans.find(l => l.mwLoanNo === loanNo);
  const contractualMonthly = loan ? loan.pmt : 0;
  const contractualTotal = contractualMonthly * months;

  const interestOnlyMonthly = loan ? (loan.principal * (loan.intRate / 100) / 12) : 0;
  const interestOnlyTotal = interestOnlyMonthly * months;

  const percentOfContractual = contractualTotal > 0 ? (actualTotal / contractualTotal * 100) : 0;
  const percentOfInterestOnly = interestOnlyTotal > 0 ? (actualTotal / interestOnlyTotal * 100) : 0;

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
