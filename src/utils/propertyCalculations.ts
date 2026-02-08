// Property and collateral calculation utilities

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
