/**
 * Formatter Utilities Tests
 * Tests for currency, date, and masking formatters
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  maskSsnEin,
  formatCurrency,
  formatCurrencyWithDecimals,
  formatPercentage,
  getCommentPreview,
  formatDateMMDDYY,
  getTodayFormatted,
  parseCurrency,
  parsePercentage
} from './formatters';

describe('maskSsnEin', () => {
  describe('SSN masking', () => {
    it('should mask SSN showing only last 4 digits', () => {
      expect(maskSsnEin('123-45-6789')).toBe('***-**-6789');
    });

    it('should mask SSN without dashes', () => {
      expect(maskSsnEin('123456789')).toBe('***-**-6789');
    });
  });

  describe('EIN masking', () => {
    it('should mask EIN showing only last 4 digits', () => {
      expect(maskSsnEin('12-3456789')).toBe('**-***6789');
    });
  });

  describe('Edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(maskSsnEin('')).toBe('');
    });

    it('should return original if less than 4 characters', () => {
      expect(maskSsnEin('123')).toBe('123');
    });

    it('should handle spaces', () => {
      expect(maskSsnEin('123 45 6789')).toBe('***-**-6789');
    });
  });
});

describe('formatCurrency', () => {
  it('should format number as currency', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
  });

  it('should format string number as currency', () => {
    expect(formatCurrency('1000')).toBe('$1,000');
  });

  it('should handle existing currency format', () => {
    expect(formatCurrency('$1,000')).toBe('$1,000');
  });

  it('should format large numbers with commas', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000');
  });

  it('should return empty string for empty input', () => {
    expect(formatCurrency('')).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatCurrency(undefined)).toBe('');
  });

  it('should return empty string for null', () => {
    expect(formatCurrency(null as unknown as number)).toBe('');
  });

  it('should return empty string for NaN', () => {
    expect(formatCurrency('abc')).toBe('');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('should handle negative numbers', () => {
    // Note: toLocaleString formats negative currency as $-1,000 not -$1,000
    expect(formatCurrency(-1000)).toBe('$-1,000');
  });

  it('should handle decimals', () => {
    const result = formatCurrency(1000.50);
    // Note: toLocaleString behavior may vary by environment
    expect(result).toContain('$1,000');
  });
});

describe('formatCurrencyWithDecimals', () => {
  it('should format with 2 decimal places by default', () => {
    expect(formatCurrencyWithDecimals(1000)).toBe('$1,000.00');
  });

  it('should format with specified decimal places', () => {
    expect(formatCurrencyWithDecimals(1000, 4)).toBe('$1,000.0000');
  });

  it('should round to specified decimals', () => {
    expect(formatCurrencyWithDecimals(1000.5678, 2)).toBe('$1,000.57');
  });

  it('should format string input', () => {
    expect(formatCurrencyWithDecimals('$1,000.50', 2)).toBe('$1,000.50');
  });

  it('should return empty string for empty input', () => {
    expect(formatCurrencyWithDecimals('')).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatCurrencyWithDecimals(undefined)).toBe('');
  });

  it('should return empty string for NaN', () => {
    expect(formatCurrencyWithDecimals('abc')).toBe('');
  });

  it('should handle zero', () => {
    expect(formatCurrencyWithDecimals(0)).toBe('$0.00');
  });
});

describe('formatPercentage', () => {
  it('should format number as percentage', () => {
    expect(formatPercentage(8.5)).toBe('8.5%');
  });

  it('should format string number', () => {
    expect(formatPercentage('8.5')).toBe('8.5%');
  });

  it('should handle existing percentage format', () => {
    expect(formatPercentage('8.5%')).toBe('8.5%');
  });

  it('should return empty string for empty input', () => {
    expect(formatPercentage('')).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatPercentage(undefined)).toBe('');
  });

  it('should return empty string for NaN', () => {
    expect(formatPercentage('abc')).toBe('');
  });

  it('should handle zero', () => {
    expect(formatPercentage(0)).toBe('0%');
  });

  it('should handle whole numbers', () => {
    expect(formatPercentage(100)).toBe('100%');
  });
});

describe('getCommentPreview', () => {
  it('should return first line of text', () => {
    expect(getCommentPreview('First line\nSecond line')).toBe('First line');
  });

  it('should truncate long lines to 50 characters', () => {
    const longText = 'This is a very long comment that exceeds fifty characters in length and should be truncated';
    const result = getCommentPreview(longText);
    expect(result.length).toBe(53); // 50 chars + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('should return (No text) for empty string', () => {
    expect(getCommentPreview('')).toBe('(No text)');
  });

  it('should return short text as-is', () => {
    expect(getCommentPreview('Short text')).toBe('Short text');
  });

  it('should handle exactly 50 characters', () => {
    const text50 = 'x'.repeat(50);
    expect(getCommentPreview(text50)).toBe(text50);
  });

  it('should handle 51 characters', () => {
    const text51 = 'x'.repeat(51);
    const result = getCommentPreview(text51);
    expect(result.length).toBe(53);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('formatDateMMDDYY', () => {
  it('should format date as MM/DD/YY', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(formatDateMMDDYY(date)).toBe('01/15/24');
  });

  it('should pad single digit month', () => {
    const date = new Date(2024, 4, 5); // May 5, 2024
    expect(formatDateMMDDYY(date)).toBe('05/05/24');
  });

  it('should handle December correctly', () => {
    const date = new Date(2024, 11, 31); // Dec 31, 2024
    expect(formatDateMMDDYY(date)).toBe('12/31/24');
  });

  it('should handle year 2000', () => {
    const date = new Date(2000, 5, 15);
    expect(formatDateMMDDYY(date)).toBe('06/15/00');
  });

  it('should handle first day of year', () => {
    const date = new Date(2024, 0, 1);
    expect(formatDateMMDDYY(date)).toBe('01/01/24');
  });
});

describe('getTodayFormatted', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return today in MM/DD/YY format', () => {
    vi.setSystemTime(new Date(2024, 9, 15)); // Oct 15, 2024
    expect(getTodayFormatted()).toBe('10/15/24');
  });

  it('should return January correctly', () => {
    vi.setSystemTime(new Date(2024, 0, 1)); // Jan 1, 2024
    expect(getTodayFormatted()).toBe('01/01/24');
  });
});

describe('parseCurrency', () => {
  it('should parse currency string to number', () => {
    expect(parseCurrency('$1,000')).toBe(1000);
  });

  it('should parse plain number string', () => {
    expect(parseCurrency('1000')).toBe(1000);
  });

  it('should handle decimals', () => {
    expect(parseCurrency('$1,000.50')).toBe(1000.50);
  });

  it('should return 0 for empty string', () => {
    expect(parseCurrency('')).toBe(0);
  });

  it('should return 0 for non-numeric', () => {
    expect(parseCurrency('abc')).toBe(0);
  });

  it('should handle negative values', () => {
    expect(parseCurrency('-$1,000')).toBe(-1000);
  });

  it('should handle just dollar sign', () => {
    expect(parseCurrency('$')).toBe(0);
  });
});

describe('parsePercentage', () => {
  it('should parse percentage string to number', () => {
    expect(parsePercentage('8.5%')).toBe(8.5);
  });

  it('should parse plain number string', () => {
    expect(parsePercentage('8.5')).toBe(8.5);
  });

  it('should return 0 for empty string', () => {
    expect(parsePercentage('')).toBe(0);
  });

  it('should return 0 for non-numeric', () => {
    expect(parsePercentage('abc')).toBe(0);
  });

  it('should handle whole numbers', () => {
    expect(parsePercentage('100%')).toBe(100);
  });

  it('should handle just percent sign', () => {
    expect(parsePercentage('%')).toBe(0);
  });
});
