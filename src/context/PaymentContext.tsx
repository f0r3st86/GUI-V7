// Payment Context - manages payment history state
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import type { PaymentRecord, PaymentGridData, PaymentContextType } from '../types';
import { initialPaymentRecords } from '../data';
import { useLoan } from './LoanContext';

// Create context
const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: ReactNode;
}

// Provider component
export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  // Get loan context for filtering
  const { selectedLoan } = useLoan();

  // Payment state
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(initialPaymentRecords);
  const [paymentGridData, setPaymentGridData] = useState<PaymentGridData>({});

  // Get filtered payment records for current loan
  const getFilteredPaymentRecords = useCallback((): PaymentRecord[] => {
    return paymentRecords.filter(record => record.loanNo === selectedLoan);
  }, [paymentRecords, selectedLoan]);

  // ID generator
  const getNextPaymentId = useCallback((): number => {
    return Math.max(...paymentRecords.map(r => r.id), 0) + 1;
  }, [paymentRecords]);

  // Update payment grid data when payment records or selected loan changes
  useEffect(() => {
    const filteredRecords = paymentRecords.filter(
      record => record.loanNo === selectedLoan && record.year && record.month && record.amount
    );

    const gridData: PaymentGridData = {};
    filteredRecords.forEach(record => {
      const year = record.year;
      const month = parseInt(record.month);
      const amount = parseFloat(record.amount.replace(/[$,]/g, '')) || 0;

      if (!gridData[year]) {
        gridData[year] = {};
      }
      gridData[year][month] = amount;
    });

    setPaymentGridData(gridData);
  }, [paymentRecords, selectedLoan]);

  // Ensure there's always an empty row for new entries in payment records
  useEffect(() => {
    const filteredRecords = paymentRecords.filter(record => record.loanNo === selectedLoan);
    const lastRecord = filteredRecords[filteredRecords.length - 1];

    // Add empty row if the last row has data or if there are no records
    if (!lastRecord || (lastRecord.year && lastRecord.month && lastRecord.amount)) {
      setPaymentRecords(prev => [
        ...prev,
        {
          id: getNextPaymentId(),
          loanNo: selectedLoan,
          year: '',
          month: '',
          amount: ''
        }
      ]);
    }
  }, [selectedLoan, paymentRecords, getNextPaymentId]);

  // Context value
  const value = useMemo<PaymentContextType>(() => ({
    paymentRecords,
    setPaymentRecords,
    paymentGridData,
    getFilteredPaymentRecords,
    getNextPaymentId,
  }), [
    paymentRecords, paymentGridData, getFilteredPaymentRecords, getNextPaymentId
  ]);

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// Custom hook to use payment context
export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
