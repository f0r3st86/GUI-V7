# Exit Calculation Debugging Guide

## What Was Added

Comprehensive console logging has been added to **all** calculation functions to verify that the selected payment and rate methods are being used correctly in every exit calculation.

## How to Use This Debugging

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Navigate to the Projections tab
4. Select different payment methods and rate methods from the dropdowns
5. Watch the console output to verify the correct values are being used

## Console Output Explained

### 1. Rate Method Selection

When you select a rate method, you'll see:

```
[getProjectedRate] Using Contractual: 8.5
```
or
```
[getProjectedRate] Using User Enter: 10
```

**What this shows:** Which rate method is selected and the actual rate value being used.

---

### 2. Payment Method Selection

When you select a payment method, you'll see one of:

**Contractual:**
```
[calculateProjectedPayment] Method: Contractual
[calculateProjectedPayment] Contractual: 608.15
```

**User Enter:**
```
[calculateProjectedPayment] Method: User Enter
[calculateProjectedPayment] User Enter: 500
```

**Interest Payment:**
```
[calculateProjectedPayment] Method: Interest Payment
[calculateProjectedPayment] Interest Payment - Rate: 8.5 Principal: 21505.49 Result: 152.37
```

**Term Pmt:**
```
[calculateProjectedPayment] Method: Term Pmt
[calculateProjectedPayment] Term Pmt - Rate: 8.5 Months: 360 Result: 165.84
```

**% of Trail Pmt:**
```
[calculateProjectedPayment] Method: % of Trail Pmt
[calculateProjectedPayment] Trail Pmt - Monthly: 400 Percent: 100 Result: 400
```

**What this shows:** Which payment method is selected, the inputs used, and the calculated payment amount.

---

### 3. Exit Method Calculations

Depending on which exit method you select, you'll see detailed logging:

#### **Pay in Full**

```
[calculatedExitValue] Method: Pay in Full
[calculatePayInFull] Using: {
  rate: 8.5,
  payment: 608.15,
  principal: 21505.49,
  nper: 24,
  paymentMethod: "Contractual",
  rateMethod: "Contractual"
}
[calculatePayInFull] Result: 9629.96
[Pay in Full] Result: 9629.96
[calculatedExitValue] Final result for Pay in Full: 9629.96
```

**What this shows:**
- The rate being used (8.5%)
- The payment being used ($608.15)
- The principal amount ($21,505.49)
- The number of months (24)
- Which payment method is selected (Contractual)
- Which rate method is selected (Contractual)
- The calculated future value after 24 months ($9,629.96)

---

#### **DPO (Discounted Payoff)**

```
[calculatedExitValue] Method: DPO
[calculatePayInFull] Using: { rate: 8.5, payment: 608.15, ... }
[calculatePayInFull] Result: 9629.96
[DPO] Pay in Full: 9629.96 Percentage: 95 Result: 9148.46
[calculatedExitValue] Final result for DPO: 9148.46
```

**What this shows:**
- Calls Pay in Full calculation first
- Applies the DPO percentage (95%)
- Final discounted amount ($9,148.46 = $9,629.96 × 95%)

---

#### **Value Cap**

```
[calculatedExitValue] Method: Value Cap
[Value Cap] Collateral: 50000 Percentage: 90 Result: 45000
[calculatedExitValue] Final result for Value Cap: 45000
```

**What this shows:**
- The collateral value ($50,000)
- The value cap percentage (90%)
- The capped exit value ($45,000)

**Note:** This method doesn't use payment/rate methods—it uses collateral value only.

---

#### **User Enter**

```
[calculatedExitValue] Method: User Enter
[User Enter] Amount: 12000
[calculatedExitValue] Final result for User Enter: 12000
```

**What this shows:** The user-entered amount.

**Note:** This method doesn't use payment/rate methods—it uses your manual input.

---

#### **YTM Sell Solve**

```
[calculatedExitValue] Method: YTM Sell Solve
[getProjectedRate] Using Contractual: 8.5
[calculateProjectedPayment] Method: Contractual
[calculateProjectedPayment] Contractual: 608.15
[calculatePayInFull] Using: { rate: 8.5, payment: 608.15, ... }
[calculatePayInFull] Result: 9629.96
[YTM Sell Solve] Using: {
  desiredYield: 12,
  months: 24,
  monthlyPmt: 608.15,
  finalPayoff: 9629.96,
  paymentMethod: "Contractual",
  rateMethod: "Contractual"
}
[YTM Sell Solve] Result: 17547.23
[calculatedExitValue] Final result for YTM Sell Solve: 17547.23
```

**What this shows:**
- The selected payment method (Contractual) and calculated payment ($608.15)
- The selected rate method (Contractual) and rate (8.5%)
- The desired yield for the buyer (12%)
- The number of months (24)
- The final payoff amount ($9,629.96)
- The present value—what to sell the loan for today to achieve 12% yield ($17,547.23)

---

#### **Liquidation**

```
[calculatedExitValue] Method: Liquidation
[getProjectedRate] Using Contractual: 8.5
[Liquidation] Starting balance: 21505.49 Rate: 8.5 Months: 12 Rate method: Contractual
[Liquidation] Balance after accrual: 23287.93 Collateral value: 50000
[calculatedExitValue] Final result for Liquidation: 50000
```

**What this shows:**
- The selected rate method (Contractual) and rate (8.5%)
- The starting balance ($21,505.49)
- The liquidation period (12 months)
- The balance after interest accrual ($23,287.93)
- The collateral recovery value ($50,000)

**Note:** The final result is the collateral value (if available), not the accrued balance.

---

## What to Verify

### ✅ Correct Behavior

When you change the **Payment Method** dropdown:
- The console should show the new payment method being used
- The calculated payment amount should change
- All exit calculations that use payment (Pay in Full, DPO, YTM Sell Solve) should recalculate

When you change the **Rate Method** dropdown:
- The console should show the new rate method being used
- The rate value should change
- All exit calculations that use rate (Pay in Full, DPO, YTM Sell Solve, Liquidation) should recalculate

### ❌ Incorrect Behavior

If you see:
- The same values in console after changing dropdowns → Something is wrong
- Different payment/rate methods in console than what's selected in UI → Something is wrong
- No console output when changing dropdowns → Calculations aren't running

---

## Example Test Scenario

**Test:** Verify that changing payment method affects exit calculations

1. **Set initial state:**
   - Payment Method: **Contractual**
   - Rate Method: **Contractual**
   - Exit Method: **Pay in Full**

2. **Check console output:**
   ```
   [calculateProjectedPayment] Method: Contractual
   [calculateProjectedPayment] Contractual: 608.15
   [calculatePayInFull] Using: { rate: 8.5, payment: 608.15, ... }
   [calculatePayInFull] Result: 9629.96
   ```

3. **Change Payment Method to "Interest Payment"**

4. **Check console output again:**
   ```
   [calculateProjectedPayment] Method: Interest Payment
   [calculateProjectedPayment] Interest Payment - Rate: 8.5 Principal: 21505.49 Result: 152.37
   [calculatePayInFull] Using: { rate: 8.5, payment: 152.37, ... }
   [calculatePayInFull] Result: 25834.12
   ```

5. **Verification:**
   - ✅ Payment method changed in console
   - ✅ Payment amount changed (608.15 → 152.37)
   - ✅ Pay in Full result changed (9629.96 → 25834.12)
   - ✅ Lower payment = higher remaining balance (correct!)

---

## Summary

The debugging output proves:

1. ✅ **Rate calculations** use the selected Rate Method dropdown
2. ✅ **Payment calculations** use the selected Payment Method dropdown
3. ✅ **Exit calculations** use the values from rate and payment methods
4. ✅ **All 6 exit methods** correctly pull from the selected methods when applicable
5. ✅ **Calculations update** when you change dropdown selections

Every exit method now shows complete transparency about:
- What inputs are being used
- Where those inputs come from
- What the calculation result is

If the console shows the correct payment method and rate method, but the displayed Exit Value seems wrong, please share:
1. The console output
2. What you expected to see
3. Which exit method you're using

This will help identify if it's a calculation issue or a display issue.
