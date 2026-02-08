// Re-export all calculation utilities from focused modules
// This file maintains backward compatibility for existing imports

export { calculateMonthsBetween, calculateMonthsToMaturity } from './dateCalculations';

export {
  calculatePMT,
  calculateFV,
  calculatePV,
  calculateNPV,
  calculateIRR,
  calculateXIRR
} from './financialFormulas';

export {
  calculateInterestAccrued,
  calculateAmortizationMonths,
  calculateTrailingPayments
} from './loanCalculations';

export {
  calculatePerSqft,
  calculatePerUnit,
  calculatePerAcre,
  calculateYearSum
} from './propertyCalculations';

export {
  buildMonthlyCashFlowArray,
  calculateBidStatistics,
  calculateOptimalExitAnalysis
} from './bidCalculations';

export type {
  BidStatistics,
  OptimalExitMetrics,
  OptimalExitRow,
  OptimalExitAnalysis
} from './bidCalculations';
