// Analysis script to identify Projections tab issues

console.log('=== PROJECTIONS TAB ANALYSIS ===\n');

// Simulate the sanitization logic
function sanitizeExitSettings(exitSettings) {
  const startMonth = parseInt(exitSettings.startMonth) || 1;
  const endMonth = parseInt(exitSettings.endMonth) || 24;

  return {
    ...exitSettings,
    startMonth: Math.max(1, Math.min(60, startMonth)).toString(),
    endMonth: Math.max(1, Math.min(60, endMonth)).toString(),
  };
}

// Test cases for sanitization
const testCases = [
  { startMonth: '', endMonth: '' },
  { startMonth: '0', endMonth: '0' },
  { startMonth: '-5', endMonth: '-5' },
  { startMonth: '1', endMonth: '24' },
  { startMonth: '100', endMonth: '200' },
  { startMonth: 'abc', endMonth: 'xyz' },
];

console.log('1. SANITIZATION TEST');
console.log('===================');
testCases.forEach((testCase, index) => {
  const result = sanitizeExitSettings(testCase);
  console.log(`Test ${index + 1}:`, testCase, '→', result);
});

// Simulate the FV calculation
function calculateFV(annualRate, nper, payment, pv) {
  const rate = annualRate / 100 / 12;

  if (rate === 0) {
    return pv + payment * nper;
  }

  const fv = pv * Math.pow(1 + rate, nper) + payment * ((Math.pow(1 + rate, nper) - 1) / rate);
  return fv;
}

console.log('\n2. FV CALCULATION TEST');
console.log('===================');
const principal = 21505.49;
const rate = 8.5;
const payment = -608.15;
const months = 24;

const fv = calculateFV(rate, months, payment, principal);
console.log(`Principal: $${principal.toLocaleString()}`);
console.log(`Rate: ${rate}%`);
console.log(`Payment: $${Math.abs(payment).toLocaleString()}/mo`);
console.log(`Months: ${months}`);
console.log(`Future Value: $${fv.toLocaleString()}`);
console.log(`Balance change: $${(fv - principal).toLocaleString()}`);
console.log(`Expected: Balance should decrease`);
console.log(`Result: ${fv < principal ? '✓ PASS' : '✗ FAIL'}`);

// Test edge cases
console.log('\n3. EDGE CASE TESTS');
console.log('===================');

// Test with empty string leading to NaN
const edgeCases = [
  { desc: 'Empty string for month', startMonth: '', endMonth: '24' },
  { desc: 'NaN propagation', startMonth: 'abc', endMonth: '24' },
  { desc: 'Zero values', startMonth: '0', endMonth: '0' },
  { desc: 'Negative values', startMonth: '-5', endMonth: '-10' },
  { desc: 'Very large values', startMonth: '1000', endMonth: '2000' },
];

edgeCases.forEach(testCase => {
  const sanitized = sanitizeExitSettings(testCase);
  const startMonth = parseInt(sanitized.startMonth) || 1;
  const endMonth = parseInt(sanitized.endMonth) || 24;
  const nper = Math.max(1, endMonth - startMonth + 1);

  console.log(`${testCase.desc}:`);
  console.log(`  Input: start="${testCase.startMonth}", end="${testCase.endMonth}"`);
  console.log(`  Sanitized: start="${sanitized.startMonth}", end="${sanitized.endMonth}"`);
  console.log(`  NPER: ${nper}`);
  console.log(`  Valid: ${isFinite(nper) && nper > 0 ? '✓' : '✗'}`);
  console.log('');
});

// Test the dependency chain
console.log('4. DEPENDENCY CHAIN TEST');
console.log('===================');
console.log('Checking useMemo/useCallback dependency chains...');

const dependencies = {
  sanitizedExitSettings: ['exitSettings'],
  getProjectedRate: ['projSettings.rateMethod', 'projSettings.userRate', 'selectedLoanData.intRate'],
  calculateProjectedPayment: ['projSettings.paymentMethod', 'projSettings.userPayment', '...', 'getProjectedRate'],
  calculatePayInFull: ['sanitizedExitSettings.startMonth', 'sanitizedExitSettings.endMonth', 'selectedLoanData.principal', 'getProjectedRate', 'calculateProjectedPayment'],
  calculatedExitValue: ['sanitizedExitSettings', 'exitSettings.method', '...', 'calculatePayInFull'],
  projectedPaymentValue: ['calculateProjectedPayment'],
  addBackValue: ['calculateAddBackToExit'],
};

console.log('Dependency graph:');
Object.entries(dependencies).forEach(([name, deps]) => {
  console.log(`  ${name} depends on:`);
  deps.forEach(dep => console.log(`    - ${dep}`));
});

console.log('\n5. POTENTIAL ISSUES');
console.log('===================');
const issues = [
  {
    issue: 'Infinite re-render loop',
    cause: 'Function calls during render trigger recalculations',
    status: 'FIXED - using memoized values'
  },
  {
    issue: 'NaN propagation',
    cause: 'Empty string → parseInt("") = NaN → calculations fail',
    status: 'FIXED - sanitization layer'
  },
  {
    issue: 'White screen on click',
    cause: 'React re-render triggered by useState during event handler',
    status: 'NEEDS VERIFICATION'
  },
  {
    issue: 'White screen on backspace',
    cause: 'Empty string during editing triggers NaN',
    status: 'FIXED - sanitization handles empty strings'
  },
  {
    issue: 'toLocaleString on NaN',
    cause: 'Attempting to format NaN/Infinity values',
    status: 'FIXED - isFinite checks before formatting'
  }
];

issues.forEach((item, index) => {
  console.log(`Issue ${index + 1}: ${item.issue}`);
  console.log(`  Cause: ${item.cause}`);
  console.log(`  Status: ${item.status}`);
  console.log('');
});

console.log('6. RECOMMENDATIONS');
console.log('===================');
const recommendations = [
  'Add error boundary around ProjectionsTab',
  'Add console.error logging for all catch blocks',
  'Test with React DevTools to check render cycles',
  'Verify all context providers are properly wrapped',
  'Check for any missing dependencies in useCallback/useMemo arrays'
];

recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec}`);
});

console.log('\n=== ANALYSIS COMPLETE ===');
