/**
 * Validation Utilities Tests
 * Tests for all validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateMonth,
  validateYear,
  isDuplicatePayment,
  validateCreditScore,
  validateZip,
  validatePhone,
  validateDateFormat,
  validateSSN,
  validateEIN,
  validateNumeric,
  validateInteger,
  validateLienPosition,
  validateYearBuilt,
  validatePercentage,
  validateMonthInput,
  validateYearInput
} from './validation';
import type { PaymentRecord } from '../types';

describe('validateMonth', () => {
  it('should return true for valid months 1-12', () => {
    for (let i = 1; i <= 12; i++) {
      expect(validateMonth(String(i))).toBe(true);
    }
  });

  it('should return true for empty string', () => {
    expect(validateMonth('')).toBe(true);
  });

  it('should return false for 0', () => {
    expect(validateMonth('0')).toBe(false);
  });

  it('should return false for 13+', () => {
    expect(validateMonth('13')).toBe(false);
    expect(validateMonth('99')).toBe(false);
  });

  it('should return false for negative numbers', () => {
    expect(validateMonth('-1')).toBe(false);
  });

  it('should return false for non-numeric input', () => {
    expect(validateMonth('abc')).toBe(false);
  });
});

describe('validateYear', () => {
  it('should return true for years 1990-2100', () => {
    expect(validateYear('1990')).toBe(true);
    expect(validateYear('2024')).toBe(true);
    expect(validateYear('2100')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validateYear('')).toBe(true);
  });

  it('should return false for years before 1990', () => {
    expect(validateYear('1989')).toBe(false);
    expect(validateYear('1900')).toBe(false);
  });

  it('should return false for years after 2100', () => {
    expect(validateYear('2101')).toBe(false);
  });

  it('should return false for non-numeric input', () => {
    expect(validateYear('abc')).toBe(false);
  });
});

describe('isDuplicatePayment', () => {
  const mockPayments: PaymentRecord[] = [
    { id: 1, loanNo: '7758', year: '2024', month: '10', amount: '750' },
    { id: 2, loanNo: '7758', year: '2024', month: '9', amount: '750' },
    { id: 3, loanNo: '7759', year: '2024', month: '10', amount: '500' },
  ];

  it('should return true for duplicate entry', () => {
    expect(isDuplicatePayment(mockPayments, '7758', '2024', '10', 99)).toBe(true);
  });

  it('should return false for same record (excludeId)', () => {
    expect(isDuplicatePayment(mockPayments, '7758', '2024', '10', 1)).toBe(false);
  });

  it('should return false for different loan', () => {
    expect(isDuplicatePayment(mockPayments, '9999', '2024', '10', 99)).toBe(false);
  });

  it('should return false for different month', () => {
    expect(isDuplicatePayment(mockPayments, '7758', '2024', '11', 99)).toBe(false);
  });

  it('should return false for different year', () => {
    expect(isDuplicatePayment(mockPayments, '7758', '2023', '10', 99)).toBe(false);
  });

  it('should return false for empty year/month', () => {
    expect(isDuplicatePayment(mockPayments, '7758', '', '10', 99)).toBe(false);
    expect(isDuplicatePayment(mockPayments, '7758', '2024', '', 99)).toBe(false);
  });
});

describe('validateCreditScore', () => {
  it('should return true for valid scores 300-850', () => {
    expect(validateCreditScore('300')).toBe(true);
    expect(validateCreditScore('720')).toBe(true);
    expect(validateCreditScore('850')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validateCreditScore('')).toBe(true);
  });

  it('should return false for scores below 300', () => {
    expect(validateCreditScore('299')).toBe(false);
    expect(validateCreditScore('0')).toBe(false);
  });

  it('should return false for scores above 850', () => {
    expect(validateCreditScore('851')).toBe(false);
    expect(validateCreditScore('999')).toBe(false);
  });

  it('should return false for non-numeric', () => {
    expect(validateCreditScore('abc')).toBe(false);
  });
});

describe('validateZip', () => {
  it('should return true for 5-digit zip', () => {
    expect(validateZip('12345')).toBe(true);
    expect(validateZip('00000')).toBe(true);
    expect(validateZip('99999')).toBe(true);
  });

  it('should return true for 5+4 format', () => {
    expect(validateZip('12345-6789')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validateZip('')).toBe(true);
  });

  it('should return false for wrong length', () => {
    expect(validateZip('1234')).toBe(false);
    expect(validateZip('123456')).toBe(false);
  });

  it('should return false for invalid 5+4 format', () => {
    expect(validateZip('12345-678')).toBe(false);
    expect(validateZip('12345-67890')).toBe(false);
  });

  it('should return false for non-numeric', () => {
    expect(validateZip('abcde')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('should return true for 10 digits', () => {
    expect(validatePhone('5555555555')).toBe(true);
  });

  it('should return true for formatted phone numbers', () => {
    expect(validatePhone('555-555-5555')).toBe(true);
    expect(validatePhone('(555) 555-5555')).toBe(true);
    expect(validatePhone('555.555.5555')).toBe(true);
    expect(validatePhone('555 555 5555')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validatePhone('')).toBe(true);
  });

  it('should return false for wrong number of digits', () => {
    expect(validatePhone('555555555')).toBe(false); // 9 digits
    expect(validatePhone('55555555555')).toBe(false); // 11 digits
  });

  it('should return false for non-numeric characters', () => {
    expect(validatePhone('555-555-ABCD')).toBe(false);
  });
});

describe('validateDateFormat', () => {
  it('should return true for valid MM/DD/YY', () => {
    expect(validateDateFormat('01/15/24')).toBe(true);
    expect(validateDateFormat('12/31/99')).toBe(true);
  });

  it('should return true for single digit month/day', () => {
    expect(validateDateFormat('1/5/24')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validateDateFormat('')).toBe(true);
  });

  it('should return false for invalid month', () => {
    expect(validateDateFormat('13/15/24')).toBe(false);
    expect(validateDateFormat('00/15/24')).toBe(false);
  });

  it('should return false for invalid day', () => {
    expect(validateDateFormat('01/32/24')).toBe(false);
    expect(validateDateFormat('01/00/24')).toBe(false);
  });

  it('should return false for wrong format', () => {
    expect(validateDateFormat('2024-01-15')).toBe(false);
    expect(validateDateFormat('01-15-24')).toBe(false);
  });

  it('should return false for 4-digit year', () => {
    expect(validateDateFormat('01/15/2024')).toBe(false);
  });
});

describe('validateSSN', () => {
  it('should return true for valid SSN format', () => {
    expect(validateSSN('123-45-6789')).toBe(true);
    expect(validateSSN('000-00-0000')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validateSSN('')).toBe(true);
  });

  it('should return false for wrong format', () => {
    expect(validateSSN('123456789')).toBe(false);
    expect(validateSSN('123-456-789')).toBe(false);
    expect(validateSSN('12-345-6789')).toBe(false);
  });

  it('should return false for non-numeric', () => {
    expect(validateSSN('abc-de-fghi')).toBe(false);
  });
});

describe('validateEIN', () => {
  it('should return true for valid EIN format', () => {
    expect(validateEIN('12-3456789')).toBe(true);
    expect(validateEIN('00-0000000')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validateEIN('')).toBe(true);
  });

  it('should return false for wrong format', () => {
    expect(validateEIN('123456789')).toBe(false);
    expect(validateEIN('123-456789')).toBe(false);
    expect(validateEIN('12-345678')).toBe(false);
  });

  it('should return false for non-numeric', () => {
    expect(validateEIN('ab-cdefghi')).toBe(false);
  });
});

describe('validateNumeric', () => {
  it('should return true for integers', () => {
    expect(validateNumeric('123')).toBe(true);
    expect(validateNumeric('0')).toBe(true);
  });

  it('should return true for decimals', () => {
    expect(validateNumeric('123.45')).toBe(true);
    expect(validateNumeric('.5')).toBe(true);
    expect(validateNumeric('0.123')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validateNumeric('')).toBe(true);
  });

  it('should return false for non-numeric', () => {
    expect(validateNumeric('abc')).toBe(false);
    expect(validateNumeric('12.34.56')).toBe(false);
    expect(validateNumeric('$123')).toBe(false);
  });
});

describe('validateInteger', () => {
  it('should return true for integers', () => {
    expect(validateInteger('123')).toBe(true);
    expect(validateInteger('0')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validateInteger('')).toBe(true);
  });

  it('should return false for decimals', () => {
    expect(validateInteger('123.45')).toBe(false);
    expect(validateInteger('.5')).toBe(false);
  });

  it('should return false for non-numeric', () => {
    expect(validateInteger('abc')).toBe(false);
  });
});

describe('validateLienPosition', () => {
  it('should return true for positions 1, 2, 3', () => {
    expect(validateLienPosition('1')).toBe(true);
    expect(validateLienPosition('2')).toBe(true);
    expect(validateLienPosition('3')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validateLienPosition('')).toBe(true);
  });

  it('should return false for 0', () => {
    expect(validateLienPosition('0')).toBe(false);
  });

  it('should return false for 4+', () => {
    expect(validateLienPosition('4')).toBe(false);
    expect(validateLienPosition('10')).toBe(false);
  });

  it('should return false for non-numeric', () => {
    expect(validateLienPosition('a')).toBe(false);
  });
});

describe('validateYearBuilt', () => {
  const currentYear = new Date().getFullYear();

  it('should return true for valid years', () => {
    expect(validateYearBuilt('1700')).toBe(true);
    expect(validateYearBuilt('2000')).toBe(true);
    expect(validateYearBuilt(String(currentYear))).toBe(true);
  });

  it('should return true for up to 5 years in future', () => {
    expect(validateYearBuilt(String(currentYear + 5))).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validateYearBuilt('')).toBe(true);
  });

  it('should return false for years before 1700', () => {
    expect(validateYearBuilt('1699')).toBe(false);
    expect(validateYearBuilt('1000')).toBe(false);
  });

  it('should return false for years too far in future', () => {
    expect(validateYearBuilt(String(currentYear + 6))).toBe(false);
  });

  it('should return false for non-numeric', () => {
    expect(validateYearBuilt('abc')).toBe(false);
  });
});

describe('validatePercentage', () => {
  it('should return true for 0-100', () => {
    expect(validatePercentage('0')).toBe(true);
    expect(validatePercentage('50')).toBe(true);
    expect(validatePercentage('100')).toBe(true);
  });

  it('should return true for decimals', () => {
    expect(validatePercentage('50.5')).toBe(true);
    expect(validatePercentage('99.99')).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(validatePercentage('')).toBe(true);
  });

  it('should return false for negative', () => {
    expect(validatePercentage('-1')).toBe(false);
  });

  it('should return false for > 100', () => {
    expect(validatePercentage('100.01')).toBe(false);
    expect(validatePercentage('150')).toBe(false);
  });

  it('should return false for non-numeric', () => {
    expect(validatePercentage('abc')).toBe(false);
  });
});

describe('validateMonthInput', () => {
  it('should return true for empty string', () => {
    expect(validateMonthInput('')).toBe(true);
  });

  it('should return true for valid single digits', () => {
    expect(validateMonthInput('1')).toBe(true);
  });

  it('should return true for valid double digits', () => {
    expect(validateMonthInput('01')).toBe(true);
    expect(validateMonthInput('12')).toBe(true);
  });

  it('should return false for non-digits', () => {
    expect(validateMonthInput('a')).toBe(false);
  });

  it('should return false for > 2 characters', () => {
    expect(validateMonthInput('123')).toBe(false);
  });

  it('should return false for invalid month numbers', () => {
    expect(validateMonthInput('13')).toBe(false);
    expect(validateMonthInput('00')).toBe(false);
  });

  it('should handle single digit > 1 validation', () => {
    // After typing '2', it's valid (could become 02-09)
    expect(validateMonthInput('2')).toBe(true);
    // After typing '3', it's still potentially valid (could be 03)
    expect(validateMonthInput('3')).toBe(true);
  });
});

describe('validateYearInput', () => {
  it('should return true for empty string', () => {
    expect(validateYearInput('')).toBe(true);
  });

  it('should return true for 1-4 digit years', () => {
    expect(validateYearInput('2')).toBe(true);
    expect(validateYearInput('20')).toBe(true);
    expect(validateYearInput('202')).toBe(true);
    expect(validateYearInput('2024')).toBe(true);
  });

  it('should return false for non-digits', () => {
    expect(validateYearInput('abc')).toBe(false);
    expect(validateYearInput('20a4')).toBe(false);
  });

  it('should return false for > 4 characters', () => {
    expect(validateYearInput('20245')).toBe(false);
  });
});
