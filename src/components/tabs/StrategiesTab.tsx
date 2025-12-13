// StrategiesTab component - strategy notes for loan
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme, useLoan } from '../../context';
import { useLoans } from '../../hooks';

export const StrategiesTab = React.memo(() => {
  const { styles } = useTheme();
  const { selectedLoan } = useLoan();
  const { data: loans } = useLoans();

  // Find selected loan data
  const selectedLoanData = loans?.find(loan => loan.mwLoanNo === selectedLoan);

  // Local state for the text field (per loan)
  const [strategiesData, setStrategiesData] = useState<Record<string, string>>({});

  // Ref for auto-growing textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get current loan's strategy
  const currentStrategy = strategiesData[selectedLoan || ''] || '';

  // Auto-resize textarea to fit content
  const autoResize = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(150, textarea.scrollHeight)}px`;
    }
  }, []);

  // Auto-resize on content change
  useEffect(() => {
    autoResize(textareaRef.current);
  }, [currentStrategy, autoResize]);

  // Auto-resize on initial load and loan change
  useEffect(() => {
    const timer = setTimeout(() => {
      autoResize(textareaRef.current);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedLoan, autoResize]);

  // Handle field change
  const handleChange = useCallback((value: string) => {
    if (!selectedLoan) return;
    setStrategiesData(prev => ({
      ...prev,
      [selectedLoan]: value
    }));
  }, [selectedLoan]);

  if (!selectedLoanData) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>No loan selected</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Loan Header Info */}
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
        <div className="flex items-center space-x-6">
          <div>
            <span className={`text-xs ${styles.textMuted}`}>Loan #:</span>
            <span className={`ml-2 font-medium ${styles.textPrimary}`}>{selectedLoan}</span>
          </div>
          <div>
            <span className={`text-xs ${styles.textMuted}`}>Borrower:</span>
            <span className={`ml-2 font-medium ${styles.textPrimary}`}>
              {selectedLoanData.borrowerName || 'N/A'}
            </span>
          </div>
          <div>
            <span className={`text-xs ${styles.textMuted}`}>UPB:</span>
            <span className={`ml-2 font-medium ${styles.textGreen}`}>
              ${(selectedLoanData.principal ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Strategies */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Strategies</h3>
        <textarea
          ref={textareaRef}
          value={currentStrategy}
          onChange={(e) => {
            handleChange(e.target.value);
            autoResize(e.target);
          }}
          placeholder="Enter strategy notes..."
          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} resize-none overflow-hidden`}
          style={{ minHeight: '150px' }}
        />
      </div>
    </div>
  );
});
