// Core financial formulas (TVM: Time Value of Money)

/**
 * Calculate PMT (Excel PMT function equivalent)
 * PMT(rate, nper, pv) = pv * (rate * (1 + rate)^nper) / ((1 + rate)^nper - 1)
 */
export const calculatePMT = (
  annualRate: number,
  nper: number,
  pv: number
): number => {
  const rate = annualRate / 100 / 12; // Monthly rate

  if (rate === 0) return pv / nper;

  const payment = pv * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
  return payment;
};

/**
 * Calculate FV (Excel FV function equivalent)
 * FV = PV * (1 + rate)^nper + Payment * [((1 + rate)^nper - 1) / rate]
 * Note: Use negative payment for loan paydown scenarios
 */
export const calculateFV = (
  annualRate: number,
  nper: number,
  payment: number,
  pv: number
): number => {
  const rate = annualRate / 100 / 12; // Monthly rate

  if (rate === 0) {
    return pv + payment * nper;
  }

  const fv = pv * Math.pow(1 + rate, nper) + payment * ((Math.pow(1 + rate, nper) - 1) / rate);
  return fv;
};

/**
 * Calculate PV (Excel PV function equivalent)
 * PV = Payment * [(1 - (1 + rate)^-nper) / rate] + FV / (1 + rate)^nper
 */
export const calculatePV = (
  annualRate: number,
  nper: number,
  payment: number,
  fv: number = 0
): number => {
  const rate = annualRate / 100 / 12; // Monthly rate

  if (rate === 0) {
    return payment * nper;
  }

  const pv = payment * ((1 - Math.pow(1 + rate, -nper)) / rate) + fv / Math.pow(1 + rate, nper);
  return pv;
};

/**
 * Calculate NPV (Net Present Value) of a series of cash flows
 * NPV = Σ (CF_t / (1 + r)^t) for t = 1 to n
 * @param discountRate - Annual discount rate as percentage (e.g., 15 for 15%)
 * @param cashFlows - Array of monthly cash flows (index 0 = month 1)
 * @returns NPV of cash flows
 */
export const calculateNPV = (
  discountRate: number,
  cashFlows: number[]
): number => {
  if (cashFlows.length === 0) return 0;

  const monthlyRate = discountRate / 100 / 12;

  let npv = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    // t+1 because first cash flow is at end of month 1, not month 0
    npv += cashFlows[t] / Math.pow(1 + monthlyRate, t + 1);
  }

  return npv;
};

/**
 * Calculate IRR (Internal Rate of Return) using Newton-Raphson method
 * Finds the rate r where: NPV(r, cashFlows) = 0
 * @param cashFlows - Array of cash flows where index 0 is initial investment (negative) and subsequent are returns
 * @param guess - Initial guess for IRR (default 0.1 = 10%)
 * @param maxIterations - Maximum iterations (default 100)
 * @param tolerance - Convergence tolerance (default 0.0001)
 * @returns Annual IRR as decimal (e.g., 0.15 for 15%), or NaN if no solution
 */
export const calculateIRR = (
  cashFlows: number[],
  guess: number = 0.1,
  maxIterations: number = 100,
  tolerance: number = 0.0001
): number => {
  if (cashFlows.length < 2) return NaN;

  // Convert annual guess to monthly
  let rate = guess / 12;

  for (let i = 0; i < maxIterations; i++) {
    // Calculate NPV and its derivative at current rate
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t];
      const discountFactor = Math.pow(1 + rate, t);
      npv += cf / discountFactor;
      // Derivative of CF/(1+r)^t with respect to r is -t * CF / (1+r)^(t+1)
      derivative -= t * cf / Math.pow(1 + rate, t + 1);
    }

    // Check for convergence
    if (Math.abs(npv) < tolerance) {
      // Convert monthly rate back to annual
      return rate * 12;
    }

    // Newton-Raphson step
    if (derivative === 0) break; // Avoid division by zero
    const newRate = rate - npv / derivative;

    // Clamp rate to reasonable bounds
    if (newRate < -0.99 / 12) rate = -0.99 / 12;
    else if (newRate > 10) rate = 10;
    else rate = newRate;
  }

  // Return last computed rate even if not converged
  return rate * 12;
};

/**
 * Calculate XIRR (IRR with actual dates) using Newton-Raphson method
 * Finds the rate r where: Σ (CF_i / (1 + r)^((date_i - date_0)/365)) = 0
 * @param cashFlows - Array of cash flow values
 * @param dates - Array of dates corresponding to each cash flow
 * @param guess - Initial guess for XIRR (default 0.1 = 10%)
 * @param maxIterations - Maximum iterations (default 100)
 * @param tolerance - Convergence tolerance (default 0.0001)
 * @returns Annual XIRR as decimal (e.g., 0.15 for 15%), or NaN if no solution
 */
export const calculateXIRR = (
  cashFlows: number[],
  dates: Date[],
  guess: number = 0.1,
  maxIterations: number = 100,
  tolerance: number = 0.0001
): number => {
  if (cashFlows.length < 2 || cashFlows.length !== dates.length) return NaN;

  const firstDate = dates[0].getTime();

  // Calculate year fractions for each date
  const yearFractions = dates.map(date =>
    (date.getTime() - firstDate) / (365 * 24 * 60 * 60 * 1000)
  );

  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t];
      const yearFrac = yearFractions[t];
      const discountFactor = Math.pow(1 + rate, yearFrac);
      npv += cf / discountFactor;
      // Derivative with respect to rate
      derivative -= yearFrac * cf / Math.pow(1 + rate, yearFrac + 1);
    }

    // Check for convergence
    if (Math.abs(npv) < tolerance) {
      return rate;
    }

    // Newton-Raphson step
    if (derivative === 0) break;
    const newRate = rate - npv / derivative;

    // Clamp rate to reasonable bounds
    if (newRate < -0.99) rate = -0.99;
    else if (newRate > 10) rate = 10;
    else rate = newRate;
  }

  return rate;
};
