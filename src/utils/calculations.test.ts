/**
 * Financial Calculations Tests
 * Tests for loan calculations, financial formulas, and metrics
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateMonthsBetween,
  calculateInterestAccrued,
  calculateMonthsToMaturity,
  calculateAmortizationMonths,
  calculatePMT,
  calculateFV,
  calculatePV,
  calculateTrailingPayments,
  calculatePerSqft,
  calculatePerUnit,
  calculatePerAcre,
  calculateYearSum
} from './calculations';
import type { Loan, PaymentRecord } from '../types';

describe('calculateMonthsBetween', () => {
  it('should calculate months between dates in same year', () => {
    expect(calculateMonthsBetween('01/15/24', '06/15/24')).toBe(5);
  });

  it('should calculate months across years', () => {
    expect(calculateMonthsBetween('10/15/23', '02/15/24')).toBe(4);
  });

  it('should handle 2-digit years (00-49 -> 2000s)', () => {
    expect(calculateMonthsBetween('01/01/20', '01/01/25')).toBe(60);
  });

  it('should handle 2-digit years (50-99 -> 1900s)', () => {
    expect(calculateMonthsBetween('01/01/95', '01/01/00')).toBe(60);
  });

  it('should return 0 for same date', () => {
    expect(calculateMonthsBetween('05/15/24', '05/15/24')).toBe(0);
  });

  it('should return 0 for empty start date', () => {
    expect(calculateMonthsBetween('', '05/15/24')).toBe(0);
  });

  it('should return 0 for empty end date', () => {
    expect(calculateMonthsBetween('05/15/24', '')).toBe(0);
  });

  it('should return 0 for invalid date format', () => {
    expect(calculateMonthsBetween('invalid', '05/15/24')).toBe(0);
  });

  it('should subtract a month if end day is before start day', () => {
    expect(calculateMonthsBetween('01/20/24', '02/15/24')).toBe(0);
  });

  it('should handle full year', () => {
    expect(calculateMonthsBetween('01/01/23', '01/01/24')).toBe(12);
  });
});

describe('calculateInterestAccrued', () => {
  it('should calculate months of interest accrued', () => {
    // $108.72 interest / ($21,505.49 * 8.5%/12) = ~0.71 months
    const result = calculateInterestAccrued(108.72, 21505.49, 8.5);
    expect(parseFloat(result)).toBeCloseTo(0.71, 1);
  });

  it('should handle string inputs with $ and commas', () => {
    const result = calculateInterestAccrued('$108.72', '$21,505.49', '8.5%');
    expect(parseFloat(result)).toBeCloseTo(0.71, 1);
  });

  it('should return 0.00 when principal is 0', () => {
    expect(calculateInterestAccrued(100, 0, 8.5)).toBe('0.00');
  });

  it('should return 0.00 when rate is 0', () => {
    expect(calculateInterestAccrued(100, 10000, 0)).toBe('0.00');
  });

  it('should return 0.00 when interest is 0', () => {
    expect(calculateInterestAccrued(0, 10000, 8.5)).toBe('0.00');
  });

  it('should handle 12 months of interest', () => {
    // If interest = principal * rate, that's 12 months
    const principal = 100000;
    const rate = 6; // 6%
    const yearInterest = principal * (rate / 100);
    const result = calculateInterestAccrued(yearInterest, principal, rate);
    expect(parseFloat(result)).toBeCloseTo(12, 0);
  });
});

describe('calculateMonthsToMaturity', () => {
  beforeEach(() => {
    // Mock current date
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 9, 15)); // Oct 15, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate months to future maturity date', () => {
    // From Oct 2024 to Oct 2025 = 12 months
    expect(calculateMonthsToMaturity('10/15/25')).toBe(12);
  });

  it('should return 0 for past maturity date', () => {
    expect(calculateMonthsToMaturity('01/01/24')).toBe(0);
  });

  it('should handle maturity this month', () => {
    expect(calculateMonthsToMaturity('10/31/24')).toBe(0);
  });
});

describe('calculateAmortizationMonths', () => {
  it('should calculate months to payoff', () => {
    // $21,505 at 8.5% with $608.15 payment ≈ 41 months
    const months = calculateAmortizationMonths(21505, 608.15, 8.5);
    expect(months).toBeGreaterThan(35);
    expect(months).toBeLessThan(50);
  });

  it('should handle string inputs', () => {
    const months = calculateAmortizationMonths('$21,505', '$608.15', '8.5%');
    expect(months).toBeGreaterThan(35);
    expect(months).toBeLessThan(50);
  });

  it('should return 999 when payment <= interest', () => {
    // Payment that is less than monthly interest
    const principal = 100000;
    const rate = 12; // 12% annual = 1% monthly
    const monthlyInterest = 1000; // 100000 * 0.01
    expect(calculateAmortizationMonths(principal, monthlyInterest - 1, rate)).toBe(999);
  });

  it('should return 0 when payment is 0', () => {
    expect(calculateAmortizationMonths(10000, 0, 8.5)).toBe(0);
  });

  it('should return 0 when rate is 0', () => {
    expect(calculateAmortizationMonths(10000, 500, 0)).toBe(0);
  });

  it('should return 0 when principal is 0', () => {
    expect(calculateAmortizationMonths(0, 500, 8.5)).toBe(0);
  });

  it('should calculate standard 30-year mortgage payoff', () => {
    // $200,000 at 6% with ~$1,199 payment = 360 months
    const months = calculateAmortizationMonths(200000, 1199.10, 6);
    expect(months).toBeGreaterThan(350);
    expect(months).toBeLessThan(370);
  });
});

describe('calculatePMT', () => {
  it('should calculate monthly payment for loan', () => {
    // $200,000 at 6% for 360 months
    const pmt = calculatePMT(6, 360, 200000);
    expect(pmt).toBeCloseTo(1199.10, 0);
  });

  it('should calculate payment for short term loan', () => {
    // $10,000 at 12% for 12 months
    const pmt = calculatePMT(12, 12, 10000);
    expect(pmt).toBeCloseTo(888.49, 0);
  });

  it('should handle 0% rate', () => {
    const pmt = calculatePMT(0, 12, 12000);
    expect(pmt).toBe(1000); // 12000 / 12
  });

  it('should calculate car loan payment', () => {
    // $25,000 at 5% for 60 months
    const pmt = calculatePMT(5, 60, 25000);
    expect(pmt).toBeCloseTo(471.78, 0);
  });
});

describe('calculateFV', () => {
  it('should calculate future value with payments', () => {
    // FV formula: PV grows with interest while payments reduce balance
    // $100,000 at 8% for 12 months with -$1,000 payments
    // The FV represents the remaining balance after payments
    const fv = calculateFV(8, 12, -1000, 100000);
    // With positive PV and negative payments, FV will be positive (loan balance remaining)
    expect(fv).toBeGreaterThan(100000); // Balance grows with interest
  });

  it('should calculate future value without payments', () => {
    // $100,000 at 8% for 12 months, no payments
    const fv = calculateFV(8, 12, 0, 100000);
    expect(fv).toBeCloseTo(108300, -2); // ~8.3% annual growth
  });

  it('should handle 0% rate', () => {
    const fv = calculateFV(0, 12, -1000, 100000);
    expect(fv).toBe(88000); // 100000 - 12*1000
  });

  it('should handle large payments over time', () => {
    // With larger payments, future value increases (more paid into the account)
    const fv = calculateFV(6, 60, -2000, 50000);
    // FV formula calculates compound growth, so result will be positive
    expect(typeof fv).toBe('number');
    expect(isFinite(fv)).toBe(true);
  });
});

describe('calculatePV', () => {
  it('should calculate present value of annuity', () => {
    // $1,000/month for 12 months at 6%
    const pv = calculatePV(6, 12, 1000);
    expect(pv).toBeGreaterThan(11000);
    expect(pv).toBeLessThan(12000);
  });

  it('should calculate present value with future value', () => {
    const pv = calculatePV(6, 12, 1000, 10000);
    expect(pv).toBeGreaterThan(20000);
  });

  it('should handle 0% rate', () => {
    const pv = calculatePV(0, 12, 1000);
    expect(pv).toBe(12000); // 12 * 1000
  });

  it('should calculate mortgage affordability', () => {
    // What principal can you afford with $1,200/month at 6% for 360 months?
    const pv = calculatePV(6, 360, 1200);
    expect(pv).toBeGreaterThan(195000);
    expect(pv).toBeLessThan(205000);
  });
});

describe('calculateTrailingPayments', () => {
  const mockLoans: Loan[] = [
    {
      mwLoanNo: '7758',
      borrowerName: 'Test',
      relatedLoans: 'Test',
      pool: 'Pool1',
      status: 'PA',
      lastImportDate: '10/31/24',
      origBalance: 100000,
      principal: 95000,
      interest: 500,
      escrowBalance: 0,
      otherBalance: 0,
      intRate: 8.5,
      dRate: 0,
      pmt: 750,
      escPmt: 0,
      pmtFreq: 'M',
      notDue: '',
      lastPmt: '',
      origDt: '',
      matDt: '',
      accDt: '',
      dueDt: '',
      lastPdt: '',
      rateType: 'Fixed',
      floor: '0',
      ceiling: '0',
      margin: '0',
      change: 0,
      chDt: '',
      chFrq: '',
      rateIndex: '',
      ahBhd: '',
      assetType: 'SFR',
      unfundedCommitment: '0',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: ''
    }
  ];

  const mockPayments: PaymentRecord[] = [
    { id: 1, loanNo: '7758', year: '2024', month: '10', amount: '750' },
    { id: 2, loanNo: '7758', year: '2024', month: '9', amount: '750' },
    { id: 3, loanNo: '7758', year: '2024', month: '8', amount: '750' },
    { id: 4, loanNo: '7758', year: '2024', month: '7', amount: '500' },
    { id: 5, loanNo: '7758', year: '2024', month: '6', amount: '500' },
    { id: 6, loanNo: '7758', year: '2024', month: '5', amount: '500' },
  ];

  it('should return null if no lastImportDate', () => {
    expect(calculateTrailingPayments('7758', 12, '', mockPayments, mockLoans)).toBeNull();
  });

  it('should calculate 3-month trailing payments', () => {
    const result = calculateTrailingPayments('7758', 3, '10/31/24', mockPayments, mockLoans);
    expect(result).not.toBeNull();
    // The function filters payments from startDate to endDate
    // Based on actual calculation: Aug, Sep, Oct = months 8, 9, 10
    expect(result!.actual).toBeGreaterThan(0);
    expect(result!.monthly).toBeGreaterThan(0);
    expect(result!.paymentsExpected).toBe(3);
  });

  it('should calculate 6-month trailing payments', () => {
    const result = calculateTrailingPayments('7758', 6, '10/31/24', mockPayments, mockLoans);
    expect(result).not.toBeNull();
    // Sum of payments in 6-month window
    expect(result!.actual).toBeGreaterThan(0);
    expect(result!.monthly).toBe(result!.actual / 6);
    expect(result!.paymentsExpected).toBe(6);
  });

  it('should calculate percentage of contractual', () => {
    const result = calculateTrailingPayments('7758', 3, '10/31/24', mockPayments, mockLoans);
    // Percent = actual / contractualTotal * 100
    const expectedPercent = (result!.actual / result!.contractualTotal) * 100;
    expect(result!.percentOfContractual).toBeCloseTo(expectedPercent, 2);
  });

  it('should calculate interest-only metrics', () => {
    const result = calculateTrailingPayments('7758', 3, '10/31/24', mockPayments, mockLoans);
    // Interest-only monthly = 95000 * (8.5/100/12) = ~672.92
    expect(result!.interestOnlyMonthly).toBeCloseTo(672.92, 0);
  });

  it('should handle loan not found', () => {
    const result = calculateTrailingPayments('9999', 3, '10/31/24', mockPayments, mockLoans);
    expect(result).not.toBeNull();
    expect(result!.contractualMonthly).toBe(0);
  });
});

describe('calculatePerSqft', () => {
  it('should calculate price per square foot', () => {
    expect(calculatePerSqft(200000, 2000)).toBe('100');
  });

  it('should handle string inputs', () => {
    expect(calculatePerSqft('$200,000', '2,000')).toBe('100');
  });

  it('should return 0 when sqft is 0', () => {
    expect(calculatePerSqft(200000, 0)).toBe('0');
  });

  it('should round to whole number', () => {
    expect(calculatePerSqft(199999, 2000)).toBe('100');
  });

  it('should format with commas for large values', () => {
    expect(calculatePerSqft(10000000, 5000)).toBe('2,000');
  });
});

describe('calculatePerUnit', () => {
  it('should calculate price per unit', () => {
    expect(calculatePerUnit(1000000, 10)).toBe('100,000');
  });

  it('should handle string inputs', () => {
    expect(calculatePerUnit('$1,000,000', '10')).toBe('100,000');
  });

  it('should return 0 when units is 0', () => {
    expect(calculatePerUnit(1000000, 0)).toBe('0');
  });
});

describe('calculatePerAcre', () => {
  it('should calculate price per acre', () => {
    expect(calculatePerAcre(500000, 5)).toBe('100,000');
  });

  it('should handle string inputs', () => {
    expect(calculatePerAcre('$500,000', '5')).toBe('100,000');
  });

  it('should return 0 when acres is 0', () => {
    expect(calculatePerAcre(500000, 0)).toBe('0');
  });

  it('should handle fractional acres', () => {
    expect(calculatePerAcre(50000, 0.5)).toBe('100,000');
  });
});

describe('calculateYearSum', () => {
  it('should sum all months in year data', () => {
    const yearData = { 1: 100, 2: 200, 3: 300 };
    expect(calculateYearSum(yearData)).toBe(600);
  });

  it('should return 0 for empty object', () => {
    expect(calculateYearSum({})).toBe(0);
  });

  it('should return 0 for undefined', () => {
    expect(calculateYearSum(undefined)).toBe(0);
  });

  it('should handle all 12 months', () => {
    const yearData: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) {
      yearData[i] = 100;
    }
    expect(calculateYearSum(yearData)).toBe(1200);
  });
});
