// Date calculation utilities

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

    // Handle 2-digit years with sliding window algorithm
    // Fixes Y2.1K bug - works correctly past year 2100
    if (year < 100) {
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const currentTwoDigit = currentYear % 100;

      // Use 50-year sliding window centered on current year
      // If 2-digit year is within +50 years, use current or next century
      // If 2-digit year is more than 50 years forward, assume previous century
      if (year >= currentTwoDigit - 50 && year <= currentTwoDigit + 50) {
        year += currentCentury;
      } else if (year < currentTwoDigit - 50) {
        year += currentCentury + 100; // Next century
      } else {
        year += currentCentury - 100; // Previous century
      }
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
 * Calculate months to maturity (from current date to MatDt)
 */
export const calculateMonthsToMaturity = (maturityDate: string): number => {
  const today = new Date();
  const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear() % 100}`;
  return calculateMonthsBetween(todayStr, maturityDate);
};
