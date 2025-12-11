# Projections Tab - Complete Documentation

## Overview
The Projections Tab is a financial analysis tool that helps you model different loan exit scenarios and project cash flows over time. It calculates future values, exit proceeds, and monthly cash flows based on various assumptions and payment methods.

---

## Table of Contents
1. [What the Projections Tab Does](#what-the-projections-tab-does)
2. [User Interface Sections](#user-interface-sections)
3. [Payment Methods Explained](#payment-methods-explained)
4. [Exit Methods Explained](#exit-methods-explained)
5. [Financial Calculations](#financial-calculations)
6. [Cash Flow Projections](#cash-flow-projections)
7. [Common Use Cases](#common-use-cases)
8. [Expected Behavior](#expected-behavior)
9. [Troubleshooting](#troubleshooting)

---

## What the Projections Tab Does

The Projections Tab allows you to:
- **Model different payment scenarios** (contractual, user-defined, interest-only, etc.)
- **Calculate exit values** using various methods (payoff, DPO, YTM, liquidation, etc.)
- **Project monthly cash flows** including income and expenses
- **Analyze holding costs** and recovery scenarios
- **Compare different exit strategies** for a loan

### Key Outputs:
1. **Projected Monthly Payment** - What you expect to receive each month
2. **Exit Value** - What you expect to receive when the loan exits
3. **Add Back Recovery** - Additional recovery from legal and holding costs
4. **Total Exit Proceeds** - Combined exit value + add back recovery
5. **Cash Flow Tables** - Month-by-month projections of income, expenses, and net cash flow

---

## User Interface Sections

### 1. Loan Header (Top)
Displays current loan information:
- **Loan #**: The selected loan number
- **UPB**: Unpaid Principal Balance
- **Contractual Rate**: The loan's interest rate
- **Contractual Pmt**: The loan's scheduled payment

### 2. Projection Settings (Middle Left)

#### Payment Method
Choose how to calculate the projected monthly payment:
- **Contractual**: Use the loan's current payment amount
- **User Enter**: Enter a custom payment amount
- **Term Pmt**: Calculate payment based on amortization period
- **Interest Payment**: Calculate interest-only payment
- **% of Trail Pmt**: Use percentage of trailing payment history

#### Rate Method
Choose which interest rate to use:
- **Contractual**: Use the loan's current interest rate
- **User Enter**: Enter a custom interest rate

#### Expense Assumptions
Model upfront and ongoing costs:
- **Initial Legal ($)**: One-time legal costs
- **Start Month**: When legal costs are incurred
- **Holding Costs ($/mo)**: Monthly ongoing costs (insurance, taxes, etc.)
- **Through Month**: Last month of holding costs

### 3. Exit Scenario Settings (Middle Right)

#### Timeline
- **Cash Flow Start Month**: First month of projected cash flows (1-60)
- **Exit Month**: When the loan exits (1-60)
- Shows calculated number of months between start and exit

#### Exit Method
Choose how to calculate exit value:

**Pay in Full**
- Calculates remaining balance after monthly payments
- Formula: Future Value of principal with payments applied

**DPO (Discounted Payoff)**
- Pay in Full × DPO Percentage
- Example: If payoff is $100k and DPO is 95%, exit value = $95k

**Value Cap**
- Collateral value × Value Cap Percentage
- Based on "Our Value" from Collateral tab
- Example: If property worth $200k and cap is 90%, exit value = $180k

**User Enter**
- Manually enter any exit value

**YTM Sell Solve** (Yield to Maturity)
- Calculates price to sell loan today to achieve desired yield
- Accounts for future payments and final payoff
- Example: "What price gives me 12% annual return?"

**Liquidation**
- Models foreclosure scenario
- Adds accrued interest during liquidation period
- Assumes recovery at collateral value

### 4. Exit Value Summary (Bottom)
Three key metrics:
- **Exit Value**: Amount received from loan exit
- **Add Back Recovery**: Percentage of legal/holding costs recovered
- **Total Exit Proceeds**: Exit Value + Add Back Recovery

### 5. Projection Tables (Bottom)
Two tables showing month-by-month cash flows:

**Projected Income Table**
- Shows monthly payments received
- Organized by year and month
- Sum column shows annual total

**Net Cash Flow Table**
- Income minus expenses per month
- Green = positive cash flow
- Red = negative cash flow
- Shows impact of initial legal and holding costs

---

## Payment Methods Explained

### Contractual
- **What it does**: Uses the loan's existing payment amount
- **When to use**: Standard projection using current terms
- **Example**: Loan has $500/mo payment → Use $500/mo

### User Enter
- **What it does**: You specify the exact payment amount
- **When to use**: Modeling modified terms or assumptions
- **Example**: "What if borrower pays $750/mo instead of $500/mo?"

### Term Pmt (Amortizing Payment)
- **What it does**: Calculates payment to fully pay off loan in X months
- **Formula**: PMT(rate, months, principal)
- **When to use**: Modeling refinance or restructure
- **Example**: $100k loan at 8% over 360 months = $733.76/mo

### Interest Payment (Interest-Only)
- **What it does**: Calculates interest-only payment
- **Formula**: Principal × (Rate / 12)
- **When to use**: Modeling interest-only modification
- **Example**: $100k at 8% = $666.67/mo (no principal reduction)

### % of Trail Pmt (Trailing Payment History)
- **What it does**: Uses historical payment performance
- **Formula**: Average trailing payments × Percentage
- **When to use**: Borrower has irregular payment history
- **Example**: Borrower averaged $400/mo over last 12 months → Use 100% = $400/mo

---

## Exit Methods Explained

### Pay in Full
**Concept**: Calculate remaining balance after payments

**Formula**:
```
FV = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]
Where:
- PV = Current principal balance
- r = Monthly interest rate (annual rate / 12)
- n = Number of months (Exit Month - Start Month + 1)
- PMT = Projected monthly payment (negative for payments made)
```

**Example**:
- Principal: $100,000
- Rate: 8% annual (0.667% monthly)
- Payment: $1,000/mo
- Months: 24

Result: ~$87,284 remaining balance

### DPO (Discounted Payoff)
**Concept**: Borrower pays less than full amount to settle

**Formula**: `Pay in Full × (DPO % / 100)`

**Example**:
- Pay in Full: $100,000
- DPO: 95%
- Exit Value: $95,000 (borrower pays $95k to settle $100k debt)

### Value Cap
**Concept**: Exit value limited by collateral value

**Formula**: `Collateral Our Value × (Value Cap % / 100)`

**Example**:
- Property "Our Value": $200,000
- Value Cap: 90%
- Exit Value: $180,000 (can't exceed 90% of property value)

### YTM Sell Solve
**Concept**: Price to sell loan note to achieve target yield

**Formula**:
```
PV = PMT × [(1 - (1 + r)^-n) / r] + FV / (1 + r)^n
Where:
- PMT = Projected monthly payment
- r = Desired monthly yield (YTM / 12)
- n = Months to exit
- FV = Pay in Full amount
- PV = Price to sell today (exit value)
```

**Example**:
- Monthly payment: $1,000
- Pay in Full at month 24: $87,284
- Desired YTM: 12%
- Exit Value: $104,500 (sell today for this price to get 12% annual return)

### Liquidation
**Concept**: Foreclosure and property sale

**Steps**:
1. Start with principal balance
2. Optionally add current interest balance
3. Accrue interest for liquidation period (no payments received)
4. Assume recovery at collateral value

**Example**:
- Principal: $100,000
- Current Interest: $5,000
- Liquidation period: 12 months at 8% rate
- Balance grows to: $113,300 (principal + interest + accrued interest)
- Property value: $120,000
- Exit Value: $120,000 (property sold)

---

## Financial Calculations

### Future Value (FV) Formula
Used in "Pay in Full" calculation:

```javascript
FV = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]
```

**Variables**:
- `PV` = Present Value (current principal)
- `r` = Monthly interest rate (annual / 100 / 12)
- `n` = Number of periods (months)
- `PMT` = Payment per period (negative for loan payments)

**Example Calculation**:
```
PV = $21,505.49
r = 8.5% annual = 0.00708333 monthly
n = 24 months
PMT = -$608.15

FV = $21,505.49 × (1.00708333)^24 + (-$608.15) × [((1.00708333)^24 - 1) / 0.00708333]
FV = $21,505.49 × 1.18700 + (-$608.15) × 27.05882
FV = $25,525.45 - $16,456.50
FV = $9,068.95
```

### Present Value (PV) Formula
Used in "YTM Sell Solve":

```javascript
PV = PMT × [(1 - (1 + r)^-n) / r] + FV / (1 + r)^n
```

### Payment (PMT) Formula
Used in "Term Pmt":

```javascript
PMT = PV × [r × (1 + r)^n] / [(1 + r)^n - 1]
```

### Add Back Recovery
Models recovery of legal and holding costs:

```javascript
if (Add Back Basis === "Initial Only") {
  Basis = Initial Legal
} else {
  Basis = Initial Legal + Total Holding Costs
}

Add Back Recovery = Basis × (Add Back % / 100)
```

**Example**:
- Initial Legal: $5,000
- Holding Costs: $500/mo for 12 months = $6,000
- Total costs: $11,000
- Add Back %: 50%
- Add Back Recovery: $5,500

---

## Cash Flow Projections

### Income Calculation
For each month from Start Month to Exit Month:
- **Income** = Projected Monthly Payment

### Expense Calculation
For each month:
- If month == Initial Legal Start Month:
  - **Expense** = Initial Legal + Holding Costs
- Else if month is between Initial Legal Start and Holding Costs End:
  - **Expense** = Holding Costs
- Else:
  - **Expense** = $0

### Net Cash Flow
**Net Cash Flow** = Income - Expenses

### Example Month-by-Month:

| Month | Income | Expense | Net CF | Notes |
|-------|--------|---------|--------|-------|
| 1 | $1,000 | $0 | $1,000 | Before legal starts |
| 2 | $1,000 | $5,500 | -$4,500 | Initial legal ($5k) + Holding ($500) |
| 3 | $1,000 | $500 | $500 | Holding costs only |
| 4-12 | $1,000 | $500 | $500 | Holding costs continue |
| 13+ | $1,000 | $0 | $1,000 | After holding ends |

---

## Common Use Cases

### Use Case 1: Standard Loan Exit
**Scenario**: Estimate payoff in 2 years

**Settings**:
- Payment Method: Contractual
- Rate Method: Contractual
- Exit Month: 24
- Exit Method: Pay in Full

**Result**: See remaining balance after 24 months of contractual payments

---

### Use Case 2: DPO Negotiation
**Scenario**: Borrower offers 90% settlement

**Settings**:
- Payment Method: Contractual
- Exit Month: 12 (exit in 1 year)
- Exit Method: DPO
- DPO Percentage: 90%

**Result**: See discounted payoff amount vs. full balance

---

### Use Case 3: Note Sale Analysis
**Scenario**: Price loan for 15% yield to buyer

**Settings**:
- Payment Method: Contractual
- Exit Month: 36 (buyer holds for 3 years)
- Exit Method: YTM Sell Solve
- Desired YTM: 15%

**Result**: Maximum price to sell note today for buyer to achieve 15% return

---

### Use Case 4: Restructure Analysis
**Scenario**: Modify loan to interest-only for 2 years, then exit

**Settings**:
- Payment Method: Interest Payment
- Exit Month: 24
- Exit Method: Pay in Full

**Result**: Compare lower monthly payments vs. higher exit balance

---

### Use Case 5: Foreclosure Analysis
**Scenario**: Model 18-month foreclosure process

**Settings**:
- Exit Method: Liquidation
- Liquidation Months: 18
- Add Current Interest: Yes

**Result**: See total debt at foreclosure completion vs. property value recovery

---

## Expected Behavior

### When You Load the Tab
✅ Should display:
- Loan header with current loan info
- Default projection settings (Contractual payment, Contractual rate)
- Default exit settings (Start Month: 1, Exit Month: 24, Method: Pay in Full)
- Calculated values showing immediately
- Empty or zero-filled projection tables until expenses are entered

### When You Change Settings
✅ Should update in real-time:
- "Calculated" payment display updates when payment method changes
- "Effective Rate" updates when rate method changes
- "Exit Value" updates when exit settings change
- Projection tables update when any settings change
- No page refresh needed

### When You Type in Input Fields
✅ Should handle gracefully:
- Allow typing numbers
- Allow backspace/delete
- Not crash on empty fields
- Not crash on invalid input
- Validate and sanitize input before calculations

### Input Field Validation
✅ Expected ranges:
- **Exit Month**: 1-60
- **Start Month**: 1-60
- **Payment Amount**: 0+
- **Interest Rate**: 0-100
- **DPO %**: 0-100
- **Value Cap %**: 0-100
- **YTM %**: 0-100

---

## Troubleshooting

### Problem: Tab Won't Load
**Symptoms**: Clicking "Projections" shows nothing

**Possible Causes**:
1. No loan selected
2. Context provider error
3. JavaScript error preventing render

**Solution**:
1. Select a loan in the loan table
2. Check browser console (F12) for errors
3. Refresh the page

---

### Problem: White Screen / Crash
**Symptoms**: Screen goes completely white, app unresponsive

**Possible Causes**:
1. Calculation error (NaN, Infinity)
2. Missing data in context
3. Uncaught exception

**Solution**:
1. Click "Reload Page" if error boundary appears
2. Check console for error details
3. Report exact error message

---

### Problem: Calculations Look Wrong
**Symptoms**: Numbers don't make sense

**Debugging Steps**:
1. Check your input values (Are they reasonable?)
2. Verify exit month > start month
3. Check payment amount vs. interest amount
4. Compare with manual calculation

**Common Issues**:
- Exit month less than start month → Shows 1 month of cash flow
- Payment less than interest → Balance grows instead of shrinks
- Very high interest rate → Extreme compound growth

---

### Problem: Can't Type in Fields
**Symptoms**: Input fields don't respond, backspace crashes

**Possible Causes**:
1. Event handler error
2. Validation too strict
3. State update error

**Solution**:
1. Check console for errors when clicking field
2. Try different field to isolate issue
3. Report specific field that has problem

---

### Problem: Tables Don't Show Data
**Symptoms**: Projection tables are empty or all zeros

**Possible Causes**:
1. No expenses entered (Initial Legal, Holding Costs)
2. Start month too high
3. Calculation error

**Solution**:
1. Enter some expense values
2. Check that start/exit months are valid
3. Look for red error messages

---

## Technical Details (For Developers)

### Component Structure
```
ProjectionsTab
├── Loan Header (read-only display)
├── Projection Settings
│   ├── Payment Method (dropdown + conditional inputs)
│   ├── Rate Method (dropdown + conditional inputs)
│   └── Expense Assumptions (4 input fields)
├── Exit Scenario Settings
│   ├── Timeline (2 input fields)
│   ├── Exit Method (dropdown + conditional inputs)
│   └── Exit Value Summary (3 calculated displays)
└── Projection Tables
    ├── Projected Income (month grid)
    └── Net Cash Flow (month grid)
```

### State Management
- **Projection Settings**: Managed by `ProjectionContext`
- **Exit Settings**: Managed by `ExitContext`
- **Loan Data**: From `LoanContext`
- **Calculations**: Memoized with `useMemo` and `useCallback`

### Performance Optimizations
1. **Memoization**: All calculation functions wrapped in `useCallback`
2. **Cached Values**: Display values memoized to prevent re-render loops
3. **Input Sanitization**: Invalid inputs converted to defaults before calculations
4. **Error Handling**: Try-catch blocks prevent crashes from bad data
5. **Validation**: `isFinite()` checks before displaying values

### Error Handling Layers
1. **Input Sanitization**: Empty strings → defaults
2. **Calculation Validation**: Check for NaN/Infinity in formulas
3. **Function Error Handling**: Try-catch in all calculation functions
4. **Display Safeguards**: isFinite() check before toLocaleString()
5. **Error Boundary**: Catches any uncaught React errors

---

## Quick Reference

### Calculation Summary

| What | Formula | Example |
|------|---------|---------|
| **Interest-Only Pmt** | Principal × (Rate / 12) | $100k × (8% / 12) = $666.67 |
| **Amortizing Pmt** | PMT(rate, months, principal) | PMT(8%, 360, $100k) = $733.76 |
| **Pay in Full** | FV(rate, months, -pmt, principal) | FV(8%, 24, -$1k, $100k) = $87,284 |
| **DPO** | Pay in Full × DPO % | $100k × 95% = $95,000 |
| **Value Cap** | Collateral × Cap % | $200k × 90% = $180,000 |
| **YTM Sell** | PV(ytm, months, pmt, payoff) | PV(12%, 24, $1k, $87k) = $104,500 |
| **Add Back** | (Legal + Holding) × % | $11k × 50% = $5,500 |

### Default Values

| Setting | Default | Range |
|---------|---------|-------|
| Payment Method | Contractual | - |
| Rate Method | Contractual | - |
| Start Month | 1 | 1-60 |
| Exit Month | 24 | 1-60 |
| Amort Months | 360 | 1-600 |
| Trail Period | 12 | 1-60 |
| Trail % | 100 | 0-200 |
| DPO % | 95 | 0-100 |
| Value Cap % | 90 | 0-100 |
| YTM % | 12 | 0-100 |
| Liquidation Months | 12 | 1-60 |

---

## Additional Resources

- **DEBUGGING_GUIDE.md**: How to report issues
- **TAB_ISSUES_ANALYSIS.md**: Known issues and fixes
- **calculations.ts**: Source code for formulas
- **ProjectionContext.tsx**: State management
- **ExitContext.tsx**: Exit scenario state

---

## Summary

The Projections Tab is a powerful financial modeling tool that helps you:
1. **Estimate future cash flows** based on different payment scenarios
2. **Calculate exit values** using multiple methods
3. **Model expenses** like legal costs and holding costs
4. **Analyze different exit strategies** to make informed decisions

The tab should work smoothly with real-time updates, proper validation, and clear error messages if something goes wrong. If you experience issues, check the DEBUGGING_GUIDE.md for troubleshooting steps.
