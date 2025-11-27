// Formatting utilities - exact copy from original component

/**
 * Helper function to mask SSN/EIN - shows only last 4 digits
 */
export const maskSsnEin = (value: string): string => {
  if (!value) return '';
  // Remove any dashes or spaces for processing
  const cleaned = value.replace(/[-\s]/g, '');
  if (cleaned.length < 4) return value;
  // Show only last 4 digits
  const lastFour = cleaned.slice(-4);
  // Determine if it's EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX)
  if (value.includes('-') && value.indexOf('-') === 2) {
    // EIN format: XX-XXXXXXX -> **-***XXXX
    return `**-***${lastFour}`;
  } else {
    // SSN format: XXX-XX-XXXX -> ***-**-XXXX
    return `***-**-${lastFour}`;
  }
};

/**
 * Format number as currency
 */
export const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string'
    ? parseFloat(value.replace(/[$,]/g, ''))
    : value;
  if (isNaN(num)) return '';
  return `$${num.toLocaleString()}`;
};

/**
 * Format number as currency with decimal places
 */
export const formatCurrencyWithDecimals = (
  value: number | string | undefined,
  decimals: number = 2
): string => {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string'
    ? parseFloat(value.replace(/[$,]/g, ''))
    : value;
  if (isNaN(num)) return '';
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string'
    ? parseFloat(value.replace(/%/g, ''))
    : value;
  if (isNaN(num)) return '';
  return `${num}%`;
};

/**
 * Get first line of comment text for preview
 */
export const getCommentPreview = (text: string): string => {
  if (!text) return '(No text)';
  const firstLine = text.split('\n')[0];
  return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
};

/**
 * Format date for display (MM/DD/YY)
 */
export const formatDateMMDDYY = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

/**
 * Get today's date in MM/DD/YY format
 */
export const getTodayFormatted = (): string => {
  return formatDateMMDDYY(new Date());
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
};

/**
 * Parse percentage string to number
 */
export const parsePercentage = (value: string): number => {
  return parseFloat(value.replace(/%/g, '')) || 0;
};
