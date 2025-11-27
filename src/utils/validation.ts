// Validation utilities - exact copy from original component
import type { PaymentRecord } from '../types';

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
