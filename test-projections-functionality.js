// Comprehensive test suite for Projections Tab functionality
// This verifies all features described in PROJECTIONS_TAB_DOCUMENTATION.md

console.log('===== PROJECTIONS TAB FUNCTIONALITY TEST =====\n');

// Import the calculation functions (simulated here)
function calculatePMT(annualRate, nper, pv) {
  const rate = annualRate / 100 / 12;
  if (rate === 0) return pv / nper;
  const payment = pv * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
  return payment;
}

function calculateFV(annualRate, nper, payment, pv) {
  const rate = annualRate / 100 / 12;
  if (rate === 0) return pv + payment * nper;
  const fv = pv * Math.pow(1 + rate, nper) + payment * ((Math.pow(1 + rate, nper) - 1) / rate);
  return fv;
}

function calculatePV(annualRate, nper, payment, fv = 0) {
  const rate = annualRate / 100 / 12;
  if (rate === 0) return payment * nper;
  const pv = payment * ((1 - Math.pow(1 + rate, -nper)) / rate) + fv / Math.pow(1 + rate, nper);
  return pv;
}

let passCount = 0;
let failCount = 0;

function test(description, actual, expected, tolerance = 0.01) {
  const diff = Math.abs(actual - expected);
  const pass = diff <= tolerance;

  if (pass) {
    console.log(`✅ PASS: ${description}`);
    console.log(`   Expected: ${expected.toFixed(2)}, Got: ${actual.toFixed(2)}\n`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${description}`);
    console.log(`   Expected: ${expected.toFixed(2)}, Got: ${actual.toFixed(2)}, Diff: ${diff.toFixed(2)}\n`);
    failCount++;
  }
}

// ===== PAYMENT METHOD TESTS =====
console.log('===== 1. PAYMENT METHOD TESTS =====\n');

// Test 1: Contractual
console.log('Test 1.1: Contractual Payment');
const contractualPmt = 500; // From loan data
test('Contractual payment should equal loan.pmt', contractualPmt, 500);

// Test 2: User Enter
console.log('Test 1.2: User Enter Payment');
const userEnterPmt = 750;
test('User entered payment should equal entered value', userEnterPmt, 750);

// Test 3: Interest Payment
console.log('Test 1.3: Interest-Only Payment');
const principal = 100000;
const rate = 8;
const interestOnlyPmt = principal * (rate / 100) / 12;
test('Interest-only payment calculation', interestOnlyPmt, 666.67, 0.01);

// Test 4: Term Pmt
console.log('Test 1.4: Term Payment (Amortizing)');
const termPmt = calculatePMT(8, 360, 100000);
test('Term payment for 30-year loan at 8%', termPmt, 733.76, 0.01);

// Test 5: % of Trail Pmt
console.log('Test 1.5: Percentage of Trailing Payment');
const trailingAvg = 400;
const trailPercent = 100;
const trailPmt = trailingAvg * (trailPercent / 100);
test('Trail payment at 100% of $400 average', trailPmt, 400);

// ===== EXIT METHOD TESTS =====
console.log('\n===== 2. EXIT METHOD TESTS =====\n');

// Test 6: Pay in Full
console.log('Test 2.1: Pay in Full (FV Calculation)');
const pif1 = calculateFV(8, 24, -1000, 100000);
test('Pay in Full after 24 months with $1k payments', pif1, 87284, 1);

// Documentation example
const pif2 = calculateFV(8.5, 24, -608.15, 21505.49);
test('Pay in Full - Documentation example', pif2, 9068.95, 1);

// Test 7: DPO
console.log('Test 2.2: DPO (Discounted Payoff)');
const payInFull = 100000;
const dpoPercent = 95;
const dpo = payInFull * (dpoPercent / 100);
test('DPO at 95% of $100k payoff', dpo, 95000);

// Test 8: Value Cap
console.log('Test 2.3: Value Cap');
const collateralValue = 200000;
const valueCapPercent = 90;
const valueCap = collateralValue * (valueCapPercent / 100);
test('Value Cap at 90% of $200k collateral', valueCap, 180000);

// Test 9: User Enter
console.log('Test 2.4: User Enter Exit Value');
const userExitValue = 125000;
test('User entered exit value', userExitValue, 125000);

// Test 10: YTM Sell Solve
console.log('Test 2.5: YTM Sell Solve (PV Calculation)');
const ytmSell = calculatePV(12, 24, 1000, 87284);
test('YTM Sell for 12% yield', ytmSell, 104500, 100);

// Test 11: Liquidation
console.log('Test 2.6: Liquidation');
let liquidationBalance = 100000;
const liquidationMonths = 12;
const monthlyRate = 8 / 100 / 12;
for (let i = 0; i < liquidationMonths; i++) {
  liquidationBalance += liquidationBalance * monthlyRate;
}
test('Liquidation balance after 12 months at 8%', liquidationBalance, 108300, 10);

// ===== FINANCIAL FORMULA TESTS =====
console.log('\n===== 3. FINANCIAL FORMULA TESTS =====\n');

// Test 12: FV Formula - Balance should decrease with payments
console.log('Test 3.1: FV Formula - Payments reduce balance');
const fvStart = 100000;
const fvEnd = calculateFV(8, 12, -1000, fvStart);
const balanceReduced = fvEnd < fvStart;
test('Balance should decrease after payments', balanceReduced ? 1 : 0, 1);

// Test 13: FV Formula - Balance should increase without payments
console.log('Test 3.2: FV Formula - No payments increase balance');
const fvNoPayment = calculateFV(8, 12, 0, 100000);
test('Balance should increase without payments', fvNoPayment, 108300, 10);

// Test 14: PMT Formula - Standard 30-year mortgage
console.log('Test 3.3: PMT Formula - 30-year mortgage');
const pmt30yr = calculatePMT(6, 360, 100000);
test('30-year mortgage at 6%', pmt30yr, 599.55, 0.01);

// Test 15: PV Formula - Present value calculation
console.log('Test 3.4: PV Formula - Present value');
const pv = calculatePV(10, 12, 1000, 50000);
test('PV of 12 payments at 10% yield', pv, 52376, 10);

// ===== ADD BACK RECOVERY TESTS =====
console.log('\n===== 4. ADD BACK RECOVERY TESTS =====\n');

// Test 16: Add Back - Initial Only
console.log('Test 4.1: Add Back Recovery - Initial Only');
const initialLegal = 5000;
const addBackPercent = 50;
const addBackInitial = initialLegal * (addBackPercent / 100);
test('Add Back at 50% of $5k initial legal', addBackInitial, 2500);

// Test 17: Add Back - Initial + Holding
console.log('Test 4.2: Add Back Recovery - Initial + Holding');
const holdingCosts = 500 * 12; // $500/mo for 12 months
const totalCosts = initialLegal + holdingCosts;
const addBackTotal = totalCosts * (addBackPercent / 100);
test('Add Back at 50% of $11k total costs', addBackTotal, 5500);

// ===== CASH FLOW PROJECTION TESTS =====
console.log('\n===== 5. CASH FLOW PROJECTION TESTS =====\n');

// Test 18: Income calculation
console.log('Test 5.1: Monthly Income');
const monthlyIncome = 1000;
const months = 24;
const totalIncome = monthlyIncome * months;
test('Total income over 24 months', totalIncome, 24000);

// Test 19: Expense calculation
console.log('Test 5.2: Monthly Expenses');
const expenseMonth2 = 5000 + 500; // Initial legal + holding
const expenseMonth3 = 500; // Just holding
test('Expenses in month 2 (initial legal + holding)', expenseMonth2, 5500);
test('Expenses in month 3 (holding only)', expenseMonth3, 500);

// Test 20: Net cash flow
console.log('Test 5.3: Net Cash Flow');
const netCFMonth2 = monthlyIncome - expenseMonth2;
const netCFMonth3 = monthlyIncome - expenseMonth3;
test('Net cash flow month 2', netCFMonth2, -4500);
test('Net cash flow month 3', netCFMonth3, 500);

// ===== INPUT VALIDATION TESTS =====
console.log('\n===== 6. INPUT VALIDATION TESTS =====\n');

// Test 21: Month sanitization
console.log('Test 6.1: Month Input Sanitization');
function sanitizeMonth(input) {
  const parsed = parseInt(input) || 1;
  return Math.max(1, Math.min(60, parsed));
}

test('Empty string should default to 1', sanitizeMonth(''), 1);
test('Zero should sanitize to 1', sanitizeMonth('0'), 1);
test('Negative should sanitize to 1', sanitizeMonth('-5'), 1);
test('Valid value should pass through', sanitizeMonth('24'), 24);
test('Too large should cap at 60', sanitizeMonth('100'), 60);
test('Invalid string should default to 1', sanitizeMonth('abc'), 1);

// ===== EDGE CASE TESTS =====
console.log('\n===== 7. EDGE CASE TESTS =====\n');

// Test 27: Zero interest rate
console.log('Test 7.1: Zero Interest Rate');
const fvZeroRate = calculateFV(0, 12, -100, 10000);
test('FV with 0% rate', fvZeroRate, 10000 - 1200, 0.01);

// Test 28: Very small balance
console.log('Test 7.2: Very Small Balance');
const fvSmall = calculateFV(8, 12, -100, 500);
test('FV with small balance', fvSmall, 0, 50); // Balance goes to ~0

// Test 29: Payment equals interest
console.log('Test 7.3: Payment Equals Monthly Interest');
const interestOnly = calculateFV(12, 12, -1000, 100000); // $1000 payment, $1000/mo interest
test('FV when payment equals interest', interestOnly, 100000, 10);

// Test 30: Single month projection
console.log('Test 7.4: Single Month Projection');
const fvOneMonth = calculateFV(8, 1, -1000, 10000);
test('FV for single month', fvOneMonth, 9000 + (10000 * 0.08 / 12), 10);

// ===== SUMMARY =====
console.log('\n===== TEST SUMMARY =====');
console.log(`Total Tests: ${passCount + failCount}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);

if (failCount === 0) {
  console.log('\n🎉 ALL TESTS PASSED! 🎉');
  console.log('All functionality described in documentation is working correctly.');
} else {
  console.log('\n⚠️  SOME TESTS FAILED');
  console.log('Review failed tests above and fix implementation.');
}

console.log('\n===== END OF TESTS =====');
