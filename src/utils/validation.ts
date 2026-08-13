// Validation utilities - exact copy from original component
import type { PaymentRecord } from '../types';

/**
 * Validate MW Loan Number against the production tblLoan.MWLoanNo shape:
 * a STRING of 5-15 characters — digits with leading zeros preserved
 * (e.g. '000005100350710') or digits with one embedded hyphen group
 * (e.g. '999999-999'). Never parse as a number: leading zeros and
 * hyphens are significant. See docs/UI-DATA-BINDINGS.md data-shape rules.
 */
export const validateMWLoanNo = (value: string): boolean => {
  if (!value) return false;
  if (value.length < 5 || value.length > 15) return false;
  return /^\d+(-\d+)?$/.test(value);
};

/**
 * Validate month input (1-12)
 */
export const validateMonth = (value: string): boolean => {
  if (!value) return true; // Allow empty
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= 1 && num <= 12;
};

/**
 * Validate year input (reasonable range)
 */
export const validateYear = (value: string): boolean => {
  if (!value) return true; // Allow empty
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= 1990 && num <= 2100;
};

/**
 * Check for duplicate payment entry
 */
export const isDuplicatePayment = (
  paymentRecords: PaymentRecord[],
  selectedLoan: string,
  year: string,
  month: string,
  excludeId: number
): boolean => {
  return paymentRecords.some(
    record =>
      record.loanNo === selectedLoan &&
      record.year === year &&
      record.month === month &&
      record.id !== excludeId &&
      year && month // Both must be non-empty
  );
};

/**
 * Validate credit score (300-850)
 */
export const validateCreditScore = (value: string): boolean => {
  if (!value) return true; // Allow empty
  // Must be integer (no decimals)
  if (!/^\d+$/.test(value)) return false;
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= 300 && num <= 850;
};

/**
 * Validate ZIP code (5 digits)
 */
export const validateZip = (value: string): boolean => {
  if (!value) return true; // Allow empty
  return /^\d{5}(-\d{4})?$/.test(value);
};

/**
 * Validate phone number
 */
export const validatePhone = (value: string): boolean => {
  if (!value) return true; // Allow empty
  // Allow various phone formats
  const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
  return /^\d{10}$/.test(cleaned);
};

/**
 * Validate date format (MM/DD/YY)
 */
export const validateDateFormat = (value: string): boolean => {
  if (!value) return true; // Allow empty
  const pattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/\d{2}$/;
  return pattern.test(value);
};

/**
 * Validate SSN format (XXX-XX-XXXX)
 */
export const validateSSN = (value: string): boolean => {
  if (!value) return true; // Allow empty
  const pattern = /^\d{3}-\d{2}-\d{4}$/;
  return pattern.test(value);
};

/**
 * Validate EIN format (XX-XXXXXXX)
 */
export const validateEIN = (value: string): boolean => {
  if (!value) return true; // Allow empty
  const pattern = /^\d{2}-\d{7}$/;
  return pattern.test(value);
};

/**
 * Validate numeric input
 */
export const validateNumeric = (value: string): boolean => {
  if (!value) return true; // Allow empty
  return /^\d*\.?\d*$/.test(value);
};

/**
 * Validate integer input
 */
export const validateInteger = (value: string): boolean => {
  if (!value) return true; // Allow empty
  return /^\d*$/.test(value);
};

/**
 * Validate lien position (1, 2, or 3)
 */
export const validateLienPosition = (value: string): boolean => {
  if (!value) return true; // Allow empty
  return /^[1-3]$/.test(value);
};

/**
 * Validate year built (1700-present)
 */
export const validateYearBuilt = (value: string): boolean => {
  if (!value) return true; // Allow empty
  const num = parseInt(value, 10);
  const currentYear = new Date().getFullYear();
  return !isNaN(num) && num >= 1700 && num <= currentYear + 5;
};

/**
 * Validate percentage (0-100)
 */
export const validatePercentage = (value: string): boolean => {
  if (!value) return true; // Allow empty
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && num <= 100;
};

/**
 * Validate month input during typing
 */
export const validateMonthInput = (value: string): boolean => {
  if (value === '') return true;
  // Only allow digits
  if (!/^\d*$/.test(value)) return false;
  // Limit to 2 characters
  if (value.length > 2) return false;
  // Check if complete value is valid (1-12)
  if (value.length === 2 || (value.length === 1 && parseInt(value) > 1)) {
    const num = parseInt(value, 10);
    if (num < 1 || num > 12) return false;
  }
  return true;
};

/**
 * Validate year input during typing
 */
export const validateYearInput = (value: string): boolean => {
  if (value === '') return true;
  // Only allow digits
  if (!/^\d*$/.test(value)) return false;
  // Limit to 4 characters
  if (value.length > 4) return false;
  return true;
};

// ==================== NEW VALIDATION HELPERS ====================

/**
 * Sanitize currency input - remove all non-numeric except decimal point
 * @param value - Raw input value
 * @returns Sanitized numeric string
 */
export const sanitizeCurrency = (value: string): string => {
  return value.replace(/[^0-9.]/g, '');
};

/**
 * Validate currency input (positive numbers, optional decimals, max 2 decimal places)
 * @param value - Currency value to validate
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: 1 billion)
 * @returns Whether the value is valid
 */
export const validateCurrency = (
  value: string,
  min: number = 0,
  max: number = 1_000_000_000
): boolean => {
  if (!value || value === '') return true; // Allow empty

  // Check format: optional digits, optional single decimal, up to 2 decimal places
  if (!/^\d*\.?\d{0,2}$/.test(value)) return false;

  const num = parseFloat(value);
  if (isNaN(num)) return false;

  return num >= min && num <= max;
};

/**
 * Validate interest rate (0-100 with up to 3 decimal places)
 * @param value - Interest rate value
 * @returns Whether the value is valid
 */
export const validateInterestRate = (value: string): boolean => {
  if (!value || value === '') return true; // Allow empty

  // Allow up to 3 decimal places for precision (e.g., 8.375%)
  if (!/^\d*\.?\d{0,3}$/.test(value)) return false;

  const num = parseFloat(value);
  if (isNaN(num)) return false;

  return num >= 0 && num <= 100;
};

/**
 * Validate positive integer (for NPER, months, etc.)
 * @param value - Integer value
 * @param min - Minimum allowed value (default: 1)
 * @param max - Maximum allowed value (default: 1200 months = 100 years)
 * @returns Whether the value is valid
 */
export const validatePositiveInteger = (
  value: string,
  min: number = 1,
  max: number = 1200
): boolean => {
  if (!value || value === '') return true; // Allow empty

  if (!/^\d+$/.test(value)) return false;

  const num = parseInt(value, 10);
  return num >= min && num <= max;
};

/**
 * Sanitize and format a number input
 * Removes invalid characters, limits decimal places
 * @param value - Raw input
 * @param decimals - Max decimal places (default: 2)
 * @returns Sanitized value
 */
export const sanitizeNumber = (value: string, decimals: number = 2): string => {
  // Remove all except digits and decimal point
  let cleaned = value.replace(/[^0-9.]/g, '');

  // Handle multiple decimal points (keep only first one)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit decimal places
  if (parts.length === 2 && parts[1].length > decimals) {
    cleaned = parts[0] + '.' + parts[1].substring(0, decimals);
  }

  return cleaned;
};

/**
 * Validate that a value is within range
 * @param value - Numeric value
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Whether value is in range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};
