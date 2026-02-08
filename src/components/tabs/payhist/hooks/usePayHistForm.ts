// Custom hook for PayHistTab state management
// Handles payment data, grid computation, trailing analytics, validation, CRUD
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTheme, useLoan } from '../../../../context';
import {
  calculateExpression,
  calculateTrailingPayments,
  calculateYearSum,
  validateYearInput,
  validateMonthInput
} from '../../../../utils';
import {
  useLoans,
  usePayments,
  useUpdatePayment,
  useDeletePayment,
  useAddPayment
} from '../../../../hooks';
import type { PayHistFormState } from '../types';

export function usePayHistForm(): PayHistFormState | { isLoading: true } | { isLoading: false; selectedLoanData: undefined } {
  const { theme } = useTheme();
  const { selectedLoan } = useLoan();

  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { mutate: updatePayment } = useUpdatePayment();
  const { mutate: deletePayment } = useDeletePayment();
  const { mutate: addPayment } = useAddPayment();

  const nextIdRef = useRef<number>(1000);
  const lastLoanRef = useRef<string | null>(null);

  const selectedLoanData = useMemo(
    () => loans?.find(loan => loan.mwLoanNo === selectedLoan),
    [loans, selectedLoan]
  );

  const filteredRecords = useMemo(() => {
    if (!payments) return [];
    return payments.filter(p => p.loanNo === selectedLoan);
  }, [payments, selectedLoan]);

  const addEmptyRow = useCallback(() => {
    if (payments && payments.length > 0) {
      const maxId = Math.max(...payments.map(p => p.id));
      if (maxId >= nextIdRef.current) {
        nextIdRef.current = maxId + 1;
      }
    }
    addPayment({
      id: nextIdRef.current++,
      loanNo: selectedLoan,
      year: '', month: '', amount: ''
    });
  }, [addPayment, selectedLoan, payments]);

  // Add empty row when loan changes
  useEffect(() => {
    if (loadingPayments || !selectedLoan) return;
    if (lastLoanRef.current !== selectedLoan) {
      lastLoanRef.current = selectedLoan;
      const records = payments?.filter(p => p.loanNo === selectedLoan) || [];
      const lastRecord = records[records.length - 1];
      if (!lastRecord || (lastRecord.year && lastRecord.month && lastRecord.amount)) {
        addEmptyRow();
      }
    }
  }, [selectedLoan, loadingPayments, payments, addEmptyRow]);

  // Grid computation
  const paymentGridData = useMemo(() => {
    const gridData: Record<string, Record<number, number>> = {};
    filteredRecords.forEach(record => {
      if (record.year && record.month && record.amount) {
        const year = record.year;
        const month = parseInt(record.month);
        const amount = parseFloat(record.amount);
        if (!gridData[year]) gridData[year] = {};
        gridData[year][month] = (gridData[year][month] || 0) + amount;
      }
    });
    return gridData;
  }, [filteredRecords]);

  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [payHistDate, setPayHistDate] = useState<string>('');

  const parsedPayHistDate = useMemo(() => {
    if (!payHistDate) return null;
    const parts = payHistDate.split('-');
    if (parts.length !== 3) return null;
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${month}/${day}/${year < 100 ? year : year % 100}`;
  }, [payHistDate]);

  const effectiveDate = parsedPayHistDate || selectedLoanData?.lastImportDate || null;

  const yearSums = useMemo(() => {
    const sums: Record<string, number> = {};
    Object.keys(paymentGridData).forEach(year => {
      sums[year] = calculateYearSum(paymentGridData[year] || {});
    });
    return sums;
  }, [paymentGridData]);

  const sortedYears = useMemo(() => {
    return Object.keys(yearSums)
      .filter(year => yearSums[year] > 0)
      .sort((a, b) => parseInt(a) - parseInt(b));
  }, [yearSums]);

  const grandTotal = useMemo(() => {
    return Object.values(yearSums).reduce((total, sum) => total + sum, 0);
  }, [yearSums]);

  const trailing12 = useMemo(
    () => effectiveDate ? calculateTrailingPayments(selectedLoan, 12, effectiveDate, payments || [], loans || []) : null,
    [selectedLoan, effectiveDate, payments, loans]
  );
  const trailing6 = useMemo(
    () => effectiveDate ? calculateTrailingPayments(selectedLoan, 6, effectiveDate, payments || [], loans || []) : null,
    [selectedLoan, effectiveDate, payments, loans]
  );
  const trailing3 = useMemo(
    () => effectiveDate ? calculateTrailingPayments(selectedLoan, 3, effectiveDate, payments || [], loans || []) : null,
    [selectedLoan, effectiveDate, payments, loans]
  );

  // Validation helpers
  const getValidationKey = (id: number, field: string) => `${id}-${field}`;
  const isFieldInvalid = useCallback((id: number, field: string) => {
    return validationErrors[getValidationKey(id, field)] || false;
  }, [validationErrors]);

  // Handlers
  const handleCellEdit = useCallback((id: number, field: string, value: string) => {
    let isValid = true;
    if (field === 'year') isValid = validateYearInput(value);
    else if (field === 'month') isValid = validateMonthInput(value);
    else if (field === 'amount') isValid = /^[0-9+\-*/.() ]*$/.test(value);

    const key = getValidationKey(id, field);
    setValidationErrors(prev => ({ ...prev, [key]: !isValid }));

    if (isValid || value === '') {
      updatePayment({ id, updates: { [field]: value } });
      const records = filteredRecords;
      const lastRecord = records[records.length - 1];
      if (lastRecord && lastRecord.id === id && value) {
        const wasEmpty = !lastRecord.year && !lastRecord.month && !lastRecord.amount;
        if (wasEmpty) addEmptyRow();
      }
    }
  }, [updatePayment, filteredRecords, addEmptyRow]);

  const handleAmountBlur = useCallback((id: number, value: string) => {
    const result = calculateExpression(value);
    updatePayment({ id, updates: { amount: result } });
  }, [updatePayment]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: number, field: string) => {
    const records = filteredRecords;
    const currentIndex = records.findIndex(r => r.id === id);

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentIndex < records.length - 1) {
        const nextId = records[currentIndex + 1].id;
        const nextInput = document.getElementById(`${field}-${nextId}`) as HTMLInputElement;
        nextInput?.focus();
      }
    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      const prevId = records[currentIndex - 1].id;
      const prevInput = document.getElementById(`${field}-${prevId}`) as HTMLInputElement;
      prevInput?.focus();
    }
  }, [filteredRecords]);

  const deletePaymentRow = useCallback((id: number) => {
    deletePayment(id);
  }, [deletePayment]);

  const exportPaymentHistory = useCallback(() => {
    const filtered = filteredRecords.filter(r => r.year && r.month && r.amount);
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
  }, [filteredRecords, selectedLoan]);

  if (loadingLoans || loadingPayments) {
    return { isLoading: true };
  }

  if (!selectedLoanData) {
    return { isLoading: false, selectedLoanData: undefined };
  }

  return {
    selectedLoan,
    selectedLoanData,
    filteredRecords,
    paymentGridData,
    sortedYears,
    yearSums,
    grandTotal,
    effectiveDate,
    trailing12,
    trailing6,
    trailing3,
    payHistDate,
    parsedPayHistDate,
    setPayHistDate,
    theme,
    handleCellEdit,
    handleAmountBlur,
    handleKeyDown,
    deletePaymentRow,
    exportPaymentHistory,
    isFieldInvalid,
  };
}
