// OverviewTab component - relationship and collateral overviews with bid conditions
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme, useLoan } from '../../context';
import { useLoans } from '../../hooks';

export const OverviewTab = React.memo(() => {
  const { styles } = useTheme();
  const { selectedLoan } = useLoan();
  const { data: loans } = useLoans();

  // Find selected loan data
  const selectedLoanData = loans?.find(loan => loan.mwLoanNo === selectedLoan);

  // Local state for the text fields (per loan)
  const [overviewData, setOverviewData] = useState<Record<string, {
    relationshipOverview: string;
    collateralOverview: string;
    bidConditions: string;
  }>>({});

  // Refs for auto-growing textareas
  const relationshipRef = useRef<HTMLTextAreaElement>(null);
  const collateralRef = useRef<HTMLTextAreaElement>(null);

  // Get current loan's overview data
  const currentOverview = overviewData[selectedLoan || ''] || {
    relationshipOverview: '',
    collateralOverview: '',
    bidConditions: ''
  };

  // Auto-resize textarea to fit content
  const autoResize = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight (minimum 150px)
      textarea.style.height = `${Math.max(150, textarea.scrollHeight)}px`;
    }
  }, []);

  // Auto-resize on content change
  useEffect(() => {
    autoResize(relationshipRef.current);
    autoResize(collateralRef.current);
  }, [currentOverview.relationshipOverview, currentOverview.collateralOverview, autoResize]);

  // Auto-resize on initial load and loan change
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      autoResize(relationshipRef.current);
      autoResize(collateralRef.current);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedLoan, autoResize]);

  // Handle field change
  const handleFieldChange = useCallback((field: 'relationshipOverview' | 'collateralOverview' | 'bidConditions', value: string) => {
    if (!selectedLoan) return;

    setOverviewData(prev => ({
      ...prev,
      [selectedLoan]: {
        ...prev[selectedLoan],
        relationshipOverview: prev[selectedLoan]?.relationshipOverview || '',
        collateralOverview: prev[selectedLoan]?.collateralOverview || '',
        bidConditions: prev[selectedLoan]?.bidConditions || '',
        [field]: value
      }
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

      {/* Relationship Overview */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Relationship Overview</h3>
        <textarea
          ref={relationshipRef}
          value={currentOverview.relationshipOverview}
          onChange={(e) => {
            handleFieldChange('relationshipOverview', e.target.value);
            autoResize(e.target);
          }}
          placeholder="Enter relationship overview details..."
          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} resize-none overflow-hidden`}
          style={{ minHeight: '150px' }}
        />
      </div>

      {/* Collateral Overview */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Collateral Overview</h3>
        <textarea
          ref={collateralRef}
          value={currentOverview.collateralOverview}
          onChange={(e) => {
            handleFieldChange('collateralOverview', e.target.value);
            autoResize(e.target);
          }}
          placeholder="Enter collateral overview details..."
          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} resize-none overflow-hidden`}
          style={{ minHeight: '150px' }}
        />
      </div>

      {/* Bid Conditions - Single Line */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Bid Conditions</h3>
        <input
          type="text"
          value={currentOverview.bidConditions}
          onChange={(e) => handleFieldChange('bidConditions', e.target.value)}
          placeholder="Enter bid conditions..."
          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
        />
      </div>
    </div>
  );
});
