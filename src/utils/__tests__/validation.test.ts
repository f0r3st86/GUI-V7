import { describe, it, expect } from 'vitest';
import {
  validateCurrency,
  validateInterestRate,
  validatePositiveInteger,
  validateCreditScore,
  validateZip,
  validatePhone,
  validateSSN,
  validateEIN,
  validateDateFormat,
  validateYearBuilt,
  validateLienPosition,
  validatePercentage,
  validateMonth,
  validateYear,
  validateMonthInput,
  validateYearInput,
  sanitizeCurrency,
  sanitizeNumber,
  isInRange
} from '../validation';

describe('Currency Validation', () => {
  it('should validate valid currency values', () => {
    expect(validateCurrency('100')).toBe(true);
    expect(validateCurrency('100.50')).toBe(true);
    expect(validateCurrency('0.99')).toBe(true);
    expect(validateCurrency('1000000')).toBe(true);
  });

  it('should reject invalid currency values', () => {
    expect(validateCurrency('100.123')).toBe(false); // Too many decimals
    expect(validateCurrency('abc')).toBe(false); // Letters
    expect(validateCurrency('100.1.1')).toBe(false); // Multiple decimals
  });

  it('should allow empty values', () => {
    expect(validateCurrency('')).toBe(true);
  });

  it('should respect min/max bounds', () => {
    expect(validateCurrency('50', 0, 100)).toBe(true);
    expect(validateCurrency('150', 0, 100)).toBe(false);
    expect(validateCurrency('-10', 0, 100)).toBe(false);
  });
});

describe('Interest Rate Validation', () => {
  it('should validate valid interest rates', () => {
    expect(validateInterestRate('5')).toBe(true);
    expect(validateInterestRate('5.5')).toBe(true);
    expect(validateInterestRate('5.125')).toBe(true);
    expect(validateInterestRate('8.375')).toBe(true); // 3 decimals
    expect(validateInterestRate('0')).toBe(true);
    expect(validateInterestRate('100')).toBe(true);
  });

  it('should reject invalid interest rates', () => {
    expect(validateInterestRate('5.1234')).toBe(false); // Too many decimals
    expect(validateInterestRate('101')).toBe(false); // Over 100%
    expect(validateInterestRate('-1')).toBe(false); // Negative
    expect(validateInterestRate('abc')).toBe(false); // Letters
  });
});

describe('Positive Integer Validation', () => {
  it('should validate valid positive integers', () => {
    expect(validatePositiveInteger('1')).toBe(true);
    expect(validatePositiveInteger('100')).toBe(true);
    expect(validatePositiveInteger('1200')).toBe(true);
  });

  it('should reject invalid positive integers', () => {
    expect(validatePositiveInteger('0', 1)).toBe(false); // Below min
    expect(validatePositiveInteger('1500', 1, 1200)).toBe(false); // Above max
    expect(validatePositiveInteger('10.5')).toBe(false); // Decimal
    expect(validatePositiveInteger('-5')).toBe(false); // Negative
    expect(validatePositiveInteger('abc')).toBe(false); // Letters
  });
});

describe('Credit Score Validation', () => {
  it('should validate valid credit scores', () => {
    expect(validateCreditScore('300')).toBe(true);
    expect(validateCreditScore('700')).toBe(true);
    expect(validateCreditScore('850')).toBe(true);
  });

  it('should reject invalid credit scores', () => {
    expect(validateCreditScore('299')).toBe(false); // Below min
    expect(validateCreditScore('851')).toBe(false); // Above max
    expect(validateCreditScore('700.5')).toBe(false); // Decimal
  });
});

describe('Zip Code Validation', () => {
  it('should validate valid zip codes', () => {
    expect(validateZip('12345')).toBe(true);
    expect(validateZip('12345-6789')).toBe(true);
  });

  it('should reject invalid zip codes', () => {
    expect(validateZip('1234')).toBe(false); // Too short
    expect(validateZip('123456')).toBe(false); // Wrong format
    expect(validateZip('abcde')).toBe(false); // Letters
  });
});

describe('Phone Validation', () => {
  it('should validate valid phone numbers', () => {
    expect(validatePhone('(555) 555-5555')).toBe(true);
    expect(validatePhone('555-555-5555')).toBe(true);
    expect(validatePhone('5555555555')).toBe(true);
    expect(validatePhone('555.555.5555')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhone('123')).toBe(false); // Too short
    expect(validatePhone('abc-def-ghij')).toBe(false); // Letters
  });
});

describe('SSN/EIN Validation', () => {
  it('should validate valid SSN', () => {
    expect(validateSSN('123-45-6789')).toBe(true);
  });

  it('should reject invalid SSN', () => {
    expect(validateSSN('12-45-6789')).toBe(false); // Wrong format
    expect(validateSSN('123456789')).toBe(false); // No dashes
  });

  it('should validate valid EIN', () => {
    expect(validateEIN('12-3456789')).toBe(true);
  });

  it('should reject invalid EIN', () => {
    expect(validateEIN('123-456789')).toBe(false); // Wrong format
    expect(validateEIN('123456789')).toBe(false); // No dashes
  });
});

describe('Date Format Validation', () => {
  it('should validate valid dates', () => {
    expect(validateDateFormat('01/01/25')).toBe(true);
    expect(validateDateFormat('12/31/99')).toBe(true);
    expect(validateDateFormat('1/1/25')).toBe(true); // Single digit
  });

  it('should reject invalid dates', () => {
    expect(validateDateFormat('13/01/25')).toBe(false); // Invalid month
    expect(validateDateFormat('01/32/25')).toBe(false); // Invalid day
    expect(validateDateFormat('2025-01-01')).toBe(false); // Wrong format
  });
});

describe('Year Built Validation', () => {
  it('should validate valid years', () => {
    expect(validateYearBuilt('1900')).toBe(true);
    expect(validateYearBuilt('2024')).toBe(true);
  });

  it('should reject invalid years', () => {
    const currentYear = new Date().getFullYear();
    expect(validateYearBuilt('1600')).toBe(false); // Too old
    expect(validateYearBuilt((currentYear + 10).toString())).toBe(false); // Too far future
  });
});

describe('Lien Position Validation', () => {
  it('should validate valid lien positions', () => {
    expect(validateLienPosition('1')).toBe(true);
    expect(validateLienPosition('2')).toBe(true);
    expect(validateLienPosition('3')).toBe(true);
  });

  it('should reject invalid lien positions', () => {
    expect(validateLienPosition('0')).toBe(false);
    expect(validateLienPosition('4')).toBe(false);
    expect(validateLienPosition('10')).toBe(false);
  });
});

describe('Percentage Validation', () => {
  it('should validate valid percentages', () => {
    expect(validatePercentage('0')).toBe(true);
    expect(validatePercentage('50')).toBe(true);
    expect(validatePercentage('100')).toBe(true);
    expect(validatePercentage('50.5')).toBe(true);
  });

  it('should reject invalid percentages', () => {
    expect(validatePercentage('-1')).toBe(false);
    expect(validatePercentage('101')).toBe(false);
  });
});

describe('Month Validation', () => {
  it('should validate valid months', () => {
    expect(validateMonth('1')).toBe(true);
    expect(validateMonth('12')).toBe(true);
  });

  it('should reject invalid months', () => {
    expect(validateMonth('0')).toBe(false);
    expect(validateMonth('13')).toBe(false);
  });
});

describe('Year Validation', () => {
  it('should validate valid years', () => {
    expect(validateYear('2024')).toBe(true);
    expect(validateYear('1990')).toBe(true);
  });

  it('should reject invalid years', () => {
    expect(validateYear('1989')).toBe(false); // Below min
    expect(validateYear('2101')).toBe(false); // Above max
  });
});

describe('Month Input Validation (during typing)', () => {
  it('should allow valid partial input', () => {
    expect(validateMonthInput('')).toBe(true);
    expect(validateMonthInput('1')).toBe(true);
    expect(validateMonthInput('12')).toBe(true);
  });

  it('should reject invalid input during typing', () => {
    expect(validateMonthInput('13')).toBe(false);
    expect(validateMonthInput('20')).toBe(false);
    expect(validateMonthInput('abc')).toBe(false);
    expect(validateMonthInput('123')).toBe(false); // Too long
  });
});

describe('Year Input Validation (during typing)', () => {
  it('should allow valid partial input', () => {
    expect(validateYearInput('')).toBe(true);
    expect(validateYearInput('2')).toBe(true);
    expect(validateYearInput('20')).toBe(true);
    expect(validateYearInput('202')).toBe(true);
    expect(validateYearInput('2024')).toBe(true);
  });

  it('should reject invalid input during typing', () => {
    expect(validateYearInput('abc')).toBe(false);
    expect(validateYearInput('20241')).toBe(false); // Too long
  });
});

describe('Sanitization Functions', () => {
  it('should sanitize currency input', () => {
    expect(sanitizeCurrency('$100.50')).toBe('100.50');
    expect(sanitizeCurrency('1,000.00')).toBe('1000.00');
    expect(sanitizeCurrency('abc123def')).toBe('123');
  });

  it('should sanitize and limit decimal places', () => {
    expect(sanitizeNumber('100.123', 2)).toBe('100.12');
    expect(sanitizeNumber('100.123456', 3)).toBe('100.123');
    expect(sanitizeNumber('abc100.50xyz', 2)).toBe('100.50');
  });

  it('should handle multiple decimal points', () => {
    expect(sanitizeNumber('100.50.75', 2)).toBe('100.5075'); // Concatenates
  });
});

describe('Range Validation', () => {
  it('should validate values within range', () => {
    expect(isInRange(50, 0, 100)).toBe(true);
    expect(isInRange(0, 0, 100)).toBe(true);
    expect(isInRange(100, 0, 100)).toBe(true);
  });

  it('should reject values outside range', () => {
    expect(isInRange(-1, 0, 100)).toBe(false);
    expect(isInRange(101, 0, 100)).toBe(false);
  });
});
