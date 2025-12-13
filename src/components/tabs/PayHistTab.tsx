// PayHistTab component - payment history with Excel-like grid
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTheme, useLoan } from '../../context';
import {
  calculateExpression,
  calculateTrailingPayments,
  calculateYearSum,
  validateYearInput,
  validateMonthInput
} from '../../utils';
import { MONTH_NAMES } from '../../data';
import {
  useLoans,
  usePayments,
  useUpdatePayment,
  useDeletePayment,
  useAddPayment
} from '../../hooks';

export const PayHistTab = React.memo(() => {
  const { theme, styles } = useTheme();

  // UI state from Context
  const { selectedLoan } = useLoan();

  // Data from React Query
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { mutate: updatePayment } = useUpdatePayment();
  const { mutate: deletePayment } = useDeletePayment();
  const { mutate: addPayment } = useAddPayment();

  // Track next payment ID for new row creation
  const nextIdRef = useRef<number>(1000);
  const lastLoanRef = useRef<string | null>(null);

  // Computed values
  const selectedLoanData = useMemo(
    () => loans?.find(loan => loan.mwLoanNo === selectedLoan),
    [loans, selectedLoan]
  );

  const paymentRecords = useMemo(
    () => payments || [],
    [payments]
  );

  const getFilteredPaymentRecords = useMemo(() => {
    if (!payments) return [];
    return payments.filter(p => p.loanNo === selectedLoan);
  }, [payments, selectedLoan]);

  // Helper to add an empty row for data entry
  const addEmptyRow = useCallback(() => {
    // Update the max ID from existing payments
    if (payments && payments.length > 0) {
      const maxId = Math.max(...payments.map(p => p.id));
      if (maxId >= nextIdRef.current) {
        nextIdRef.current = maxId + 1;
      }
    }

    addPayment({
      id: nextIdRef.current++,
      loanNo: selectedLoan,
      year: '',
      month: '',
      amount: ''
    });
  }, [addPayment, selectedLoan, payments]);

  // Add empty row only when loan changes (not on every payment update)
  useEffect(() => {
    if (loadingPayments || !selectedLoan) return;

    // Only add empty row when switching to a new loan
    if (lastLoanRef.current !== selectedLoan) {
      lastLoanRef.current = selectedLoan;

      const filteredRecords = payments?.filter(p => p.loanNo === selectedLoan) || [];
      const lastRecord = filteredRecords[filteredRecords.length - 1];

      // Add empty row if there's none or the last one is filled
      if (!lastRecord || (lastRecord.year && lastRecord.month && lastRecord.amount)) {
        addEmptyRow();
      }
    }
  }, [selectedLoan, loadingPayments, payments, addEmptyRow]);

  // Convert payment records to grid data (year -> month -> amount)
  const paymentGridData = useMemo(() => {
    const gridData: Record<string, Record<number, number>> = {};
    getFilteredPaymentRecords.forEach(record => {
      if (record.year && record.month && record.amount) {
        const year = record.year;
        const month = parseInt(record.month);
        const amount = parseFloat(record.amount);

        if (!gridData[year]) {
          gridData[year] = {};
        }
        gridData[year][month] = (gridData[year][month] || 0) + amount;
      }
    });
    return gridData;
  }, [getFilteredPaymentRecords]);

  // Validation state (track invalid inputs by record ID + field)
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // PERFORMANCE: Memoize year sums to avoid O(n×m) redundant calculations
  // Previously calculated 3+ times per render for same data
  const yearSums = useMemo(() => {
    const sums: Record<string, number> = {};
    Object.keys(paymentGridData).forEach(year => {
      const yearData = paymentGridData[year] || {};
      sums[year] = calculateYearSum(yearData);
    });
    return sums;
  }, [paymentGridData]);

  // Memoize sorted years with non-zero sums
  const sortedYears = useMemo(() => {
    return Object.keys(yearSums)
      .filter(year => yearSums[year] > 0)
      .sort((a, b) => parseInt(a) - parseInt(b));
  }, [yearSums]);

  // Memoize grand total
  const grandTotal = useMemo(() => {
    return Object.values(yearSums).reduce((total, sum) => total + sum, 0);
  }, [yearSums]);

  // Helper: Get validation key for a record field
  const getValidationKey = (id: number, field: string) => `${id}-${field}`;

  // Helper: Check if field is invalid
  const isFieldInvalid = (id: number, field: string) => {
    return validationErrors[getValidationKey(id, field)] || false;
  };

  // Loading state
  if (loadingLoans || loadingPayments) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

  if (!selectedLoanData) {
    return <div className="p-4"><p className={styles.textMuted}>No loan selected</p></div>;
  }

  // Handle cell edit with validation
  const handleCellEdit = (id: number, field: string, value: string) => {
    let isValid = true;

    // Validate based on field type
    if (field === 'year') {
      isValid = validateYearInput(value);
    } else if (field === 'month') {
      isValid = validateMonthInput(value);
    } else if (field === 'amount') {
      // For amount, allow expressions (will be validated on blur)
      // Just prevent completely invalid input
      isValid = /^[0-9+\-*/.() ]*$/.test(value);
    }

    // Update validation state
    const key = getValidationKey(id, field);
    setValidationErrors(prev => ({ ...prev, [key]: !isValid }));

    // Only update if valid OR if clearing the field
    if (isValid || value === '') {
      updatePayment({ id, updates: { [field]: value } });
    }
  };

  // Handle amount blur - evaluate expression and add new row if needed
  const handleAmountBlur = (id: number, value: string) => {
    const result = calculateExpression(value);
    updatePayment({ id, updates: { amount: result } });

    // Check if this completes the last row - if so, add a new empty row
    const filteredRecords = getFilteredPaymentRecords;
    const lastRecord = filteredRecords[filteredRecords.length - 1];
    if (lastRecord && lastRecord.id === id) {
      // This is the last row - check if all fields will be filled after this update
      if (lastRecord.year && lastRecord.month && result) {
        addEmptyRow();
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, id: number, field: string) => {
    const filteredRecords = getFilteredPaymentRecords;
    const currentIndex = filteredRecords.findIndex(r => r.id === id);

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Move to next row, same column
      if (currentIndex < filteredRecords.length - 1) {
        const nextId = filteredRecords[currentIndex + 1].id;
        const nextInput = document.getElementById(`${field}-${nextId}`) as HTMLInputElement;
        nextInput?.focus();
      }
    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      const prevId = filteredRecords[currentIndex - 1].id;
      const prevInput = document.getElementById(`${field}-${prevId}`) as HTMLInputElement;
      prevInput?.focus();
    } else if (e.key === 'Tab') {
      // Let tab work naturally for right movement
    }
  };

  // Delete payment row
  const deletePaymentRow = (id: number) => {
    deletePayment(id);
  };

  // Export payment history
  const exportPaymentHistory = () => {
    const filtered = getFilteredPaymentRecords.filter(r => r.year && r.month && r.amount);
    const csvContent = [
      ['Year', 'Month', 'Amount'],
      ...filtered.map(r => [r.year, r.month, r.amount])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_history_${selectedLoan}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = getFilteredPaymentRecords;
  const trailing12 = calculateTrailingPayments(selectedLoan, 12, selectedLoanData.lastImportDate, paymentRecords, loans || []);
  const trailing6 = calculateTrailingPayments(selectedLoan, 6, selectedLoanData.lastImportDate, paymentRecords, loans || []);
  const trailing3 = calculateTrailingPayments(selectedLoan, 3, selectedLoanData.lastImportDate, paymentRecords, loans || []);

  return (
    <div className="p-4">
      {/* Loan Header Info */}
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <span className={`text-xs ${styles.textMuted}`}>Loan #:</span>
              <span className={`ml-2 font-medium ${styles.textPrimary}`}>{selectedLoan}</span>
            </div>
            <div>
              <span className={`text-xs ${styles.textMuted}`}>Borrower:</span>
              <span className={`ml-2 ${styles.textPrimary}`}>{selectedLoanData.borrowerName}</span>
            </div>
            <div>
              <span className={`text-xs ${styles.textMuted}`}>Current Balance:</span>
              <span className={`ml-2 font-medium ${styles.textGreen}`}>${selectedLoanData.principal.toLocaleString()}</span>
            </div>
            <div>
              <span className={`text-xs ${styles.textMuted}`}>Monthly Payment:</span>
              <span className={`ml-2 ${styles.textPrimary}`}>${selectedLoanData.pmt.toLocaleString()}</span>
            </div>
            <div>
              <span className={`text-xs ${styles.textMuted}`}>Rate:</span>
              <span className={`ml-2 ${styles.textPrimary}`}>{selectedLoanData.intRate}%</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportPaymentHistory}
              className={`px-4 py-1.5 ${styles.cardBg} ${styles.inputBorder} border ${styles.textPrimary} rounded transition-colors text-xs ${styles.buttonHover}`}
            >
              Export History
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        {/* Left Panel - Editable Data Table */}
        <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`} style={{ minWidth: '350px' }}>
          <h3 className={`font-medium mb-3 ${styles.textPrimary} text-center`}>Payment Entry for Loan #{selectedLoan}</h3>

          {/* Excel-like Editable Table */}
          <div className={`${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} rounded border ${styles.borderColor}`}>
            <table className="w-full">
              <thead>
                <tr className={`${styles.borderColor} border-b ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`} style={{ width: '80px' }}>Year</th>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`} style={{ width: '80px' }}>Month</th>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`} style={{ width: '100px' }}>Amount</th>
                  <th className={`px-2 py-2`} style={{ width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr key={record.id} className={`${styles.borderColor} border-b ${styles.hoverBg}`}>
                    <td className="px-0 py-0">
                      <input
                        id={`year-${record.id}`}
                        type="text"
                        value={record.year}
                        onChange={(e) => handleCellEdit(record.id, 'year', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, record.id, 'year')}
                        placeholder="YYYY"
                        maxLength={4}
                        className={`w-full px-3 py-2 text-xs ${styles.textPrimary} bg-transparent focus:outline-none ${
                          isFieldInvalid(record.id, 'year')
                            ? 'ring-1 ring-red-500'
                            : 'focus:ring-1 focus:ring-green-500'
                        }`}
                        style={{ border: 'none' }}
                      />
                    </td>
                    <td className="px-0 py-0">
                      <input
                        id={`month-${record.id}`}
                        type="text"
                        value={record.month}
                        onChange={(e) => handleCellEdit(record.id, 'month', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, record.id, 'month')}
                        placeholder="1-12"
                        maxLength={2}
                        className={`w-full px-3 py-2 text-xs ${styles.textPrimary} bg-transparent focus:outline-none ${
                          isFieldInvalid(record.id, 'month')
                            ? 'ring-1 ring-red-500'
                            : 'focus:ring-1 focus:ring-green-500'
                        }`}
                        style={{ border: 'none' }}
                      />
                    </td>
                    <td className="px-0 py-0">
                      <input
                        id={`amount-${record.id}`}
                        type="text"
                        value={record.amount}
                        onChange={(e) => handleCellEdit(record.id, 'amount', e.target.value)}
                        onBlur={(e) => handleAmountBlur(record.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, record.id, 'amount')}
                        placeholder="0.00"
                        title="You can enter calculations like 500+108.15 or 608.15*2"
                        className={`w-full px-3 py-2 text-xs ${styles.textGreen} bg-transparent focus:outline-none ${
                          isFieldInvalid(record.id, 'amount')
                            ? 'ring-1 ring-red-500'
                            : 'focus:ring-1 focus:ring-green-500'
                        }`}
                        style={{ border: 'none' }}
                      />
                    </td>
                    <td className="px-2 py-0">
                      {record.year && record.month && record.amount && index < filteredRecords.length - 1 && (
                        <button
                          onClick={() => deletePaymentRow(record.id)}
                          className={`${styles.textMuted} hover:text-red-500 text-xs`}
                          title="Delete row"
                        >
                          x
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`mt-3 text-xs ${styles.textMuted}`}>
            <p>Click any cell to edit</p>
            <p>Press Enter or Down to move down</p>
            <p>Press Tab to move right</p>
            <p>Amount supports calculations: 500+108.15</p>
          </div>
        </div>

        {/* Right Panel - Payment History Grid */}
        <div className={`flex-1 ${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border overflow-x-auto`}>
          <h3 className={`font-medium mb-3 ${styles.textPrimary} text-center`}>Data will be displayed here</h3>

          {/* Payment History Grid */}
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className={`text-left px-2 py-1 ${styles.textMuted} font-medium`}></th>
                {MONTH_NAMES.map(month => (
                  <th key={month} className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>{month}</th>
                ))}
                <th className={`text-center px-2 py-1 ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Sum</th>
              </tr>
            </thead>
            <tbody>
              {sortedYears.map((year, index) => {
                const yearData = paymentGridData[year] || {};
                const yearSum = yearSums[year];
                return (
                  <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                    <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                      const amount = yearData[month];
                      return (
                        <td key={month} className={`text-center px-1 py-2 ${amount ? styles.textGreen : styles.textSecondary}`}>
                          {amount ? amount.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                    <td className={`text-center px-2 py-2 font-medium ${yearSum > 0 ? styles.textPrimary : styles.textSecondary} ${styles.borderColor} border-l`}>
                      ${yearSum.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className={`${styles.borderColor} border-t font-medium`}>
                <td className={`px-2 py-2 ${styles.textPrimary}`}>TOTAL</td>
                <td colSpan={12} className={`text-right px-2 py-2 ${styles.textPrimary}`}>Grand Total:</td>
                <td className={`text-center px-2 py-2 ${styles.textGreen} ${styles.borderColor} border-l`}>
                  ${grandTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Trailing Payment Analytics - Modern Card Design */}
          {selectedLoanData?.lastImportDate && trailing12 && trailing6 && trailing3 ? (
            <div className="mt-4">
              <h4 className={`text-base font-medium ${styles.textMuted} mb-2`}>Payment Analytics</h4>
              <div className="grid grid-cols-3 gap-4" style={{ maxWidth: '540px' }}>
                {/* T12 Card */}
                <div className={`${styles.inputBorder} border rounded-lg p-4`}>
                  <div className={`text-base font-semibold ${styles.textPrimary} mb-3 text-center`}>Trailing 12</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>$/Mo</span>
                      <span className={`text-base font-medium ${styles.textPrimary}`}>
                        ${trailing12.monthly.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>Actual</span>
                      <span className={`text-base font-medium ${styles.textGreen}`}>
                        ${trailing12.actual.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>% Cont.</span>
                      <span className={`text-base font-medium ${
                        trailing12.percentOfContractual >= 100 ? styles.textGreen :
                        trailing12.percentOfContractual >= 80 ? styles.textYellow : 'text-red-500'
                      }`}>
                        {trailing12.percentOfContractual.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>Mo Pd</span>
                      <span className={`text-base font-medium ${styles.textPrimary}`}>
                        {trailing12.monthsPaidContractual.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* T6 Card */}
                <div className={`${styles.inputBorder} border rounded-lg p-4`}>
                  <div className={`text-base font-semibold ${styles.textPrimary} mb-3 text-center`}>Trailing 6</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>$/Mo</span>
                      <span className={`text-base font-medium ${styles.textPrimary}`}>
                        ${trailing6.monthly.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>Actual</span>
                      <span className={`text-base font-medium ${styles.textGreen}`}>
                        ${trailing6.actual.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>% Cont.</span>
                      <span className={`text-base font-medium ${
                        trailing6.percentOfContractual >= 100 ? styles.textGreen :
                        trailing6.percentOfContractual >= 80 ? styles.textYellow : 'text-red-500'
                      }`}>
                        {trailing6.percentOfContractual.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>Mo Pd</span>
                      <span className={`text-base font-medium ${styles.textPrimary}`}>
                        {trailing6.monthsPaidContractual.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* T3 Card */}
                <div className={`${styles.inputBorder} border rounded-lg p-4`}>
                  <div className={`text-base font-semibold ${styles.textPrimary} mb-3 text-center`}>Trailing 3</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>$/Mo</span>
                      <span className={`text-base font-medium ${styles.textPrimary}`}>
                        ${trailing3.monthly.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>Actual</span>
                      <span className={`text-base font-medium ${styles.textGreen}`}>
                        ${trailing3.actual.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>% Cont.</span>
                      <span className={`text-base font-medium ${
                        trailing3.percentOfContractual >= 100 ? styles.textGreen :
                        trailing3.percentOfContractual >= 80 ? styles.textYellow : 'text-red-500'
                      }`}>
                        {trailing3.percentOfContractual.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-base ${styles.textMuted}`}>Mo Pd</span>
                      <span className={`text-base font-medium ${styles.textPrimary}`}>
                        {trailing3.monthsPaidContractual.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`mt-3 p-2 ${styles.inputBg} ${styles.inputBorder} rounded border`}>
              <div className={`text-xs ${styles.textMuted} text-center`}>
                Set Last Import Date in Loan tab for analytics
              </div>
            </div>
          )}

          {/* SQL Connection Info */}
          <div className={`mt-4 p-3 ${styles.alertBg} ${styles.alertBorder} rounded-lg border`}>
            <div className="flex items-start">
              <AlertCircle size={16} className={`${styles.alertText} mr-2 mt-0.5`} />
              <div className={`text-xs ${styles.alertText}`}>
                <p className="font-medium">SQL Connection Points:</p>
                <p className="mt-1">SELECT * FROM payment_history WHERE loan_id = '{selectedLoan}' ORDER BY year DESC, month DESC</p>
                <p>INSERT INTO payment_history (loan_id, year, month, amount) VALUES (...)</p>
                <p>UPDATE payment_history SET amount = value WHERE id = record_id</p>
                <p>DELETE FROM payment_history WHERE id = record_id</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
