// StrategiesTab component - strategy notes for the relationship
// This tab is for the RELATIONSHIP as a whole, not per-loan
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context';

const STORAGE_KEY = 'gui-v7-strategies';

export const StrategiesTab = React.memo(() => {
  const { styles } = useTheme();

  // Load initial state from localStorage
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load strategies data:', e);
    }
    return '';
  };

  // Relationship-level state (static across all loans)
  const [strategies, setStrategies] = useState(getInitialState);

  // Save to localStorage when value changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, strategies);
    } catch (e) {
      console.error('Failed to save strategies data:', e);
    }
  }, [strategies]);

  // Ref for auto-growing textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, [strategies, autoResize]);

  // Auto-resize on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      autoResize(textareaRef.current);
    }, 0);
    return () => clearTimeout(timer);
  }, [autoResize]);

  return (
    <div className="p-4 space-y-4">
      {/* Strategies */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Strategies</h3>
        <textarea
          ref={textareaRef}
          value={strategies}
          onChange={(e) => {
            setStrategies(e.target.value);
            autoResize(e.target);
          }}
          aria-label="Strategies"
          placeholder="Enter strategy notes..."
          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} resize-none overflow-hidden`}
          style={{ minHeight: '150px' }}
        />
      </div>
    </div>
  );
});
StrategiesTab.displayName = 'StrategiesTab';
