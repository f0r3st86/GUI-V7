// OverviewTab component - relationship and collateral overviews with bid conditions
// This tab is for the RELATIONSHIP as a whole, not per-loan
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context';

export const OverviewTab = React.memo(() => {
  const { styles } = useTheme();

  // Relationship-level state (static across all loans)
  const [relationshipOverview, setRelationshipOverview] = useState('');
  const [collateralOverview, setCollateralOverview] = useState('');
  const [bidConditions, setBidConditions] = useState('');

  // Refs for auto-growing textareas
  const relationshipRef = useRef<HTMLTextAreaElement>(null);
  const collateralRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content
  const autoResize = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(150, textarea.scrollHeight)}px`;
    }
  }, []);

  // Auto-resize on content change
  useEffect(() => {
    autoResize(relationshipRef.current);
    autoResize(collateralRef.current);
  }, [relationshipOverview, collateralOverview, autoResize]);

  // Auto-resize on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      autoResize(relationshipRef.current);
      autoResize(collateralRef.current);
    }, 0);
    return () => clearTimeout(timer);
  }, [autoResize]);

  return (
    <div className="p-4 space-y-4">
      {/* Relationship Overview */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Relationship Overview</h3>
        <textarea
          ref={relationshipRef}
          value={relationshipOverview}
          onChange={(e) => {
            setRelationshipOverview(e.target.value);
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
          value={collateralOverview}
          onChange={(e) => {
            setCollateralOverview(e.target.value);
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
          value={bidConditions}
          onChange={(e) => setBidConditions(e.target.value)}
          placeholder="Enter bid conditions..."
          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
        />
      </div>
    </div>
  );
});
