// Mode selector toggle between Modern and Classic modes
import React from 'react';
import type { ThemeStyles } from '../../../../types';

interface ModeSelectorProps {
  mode: 'modern' | 'classic';
  setMode: (mode: 'modern' | 'classic') => void;
  styles: ThemeStyles;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode, styles }) => (
  <div className="mb-4 flex gap-2">
    <button
      onClick={() => setMode('modern')}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
        mode === 'modern'
          ? `${styles.activeBg} ${styles.textPrimary} ${styles.inputBorder}`
          : `${styles.cardBg} ${styles.textMuted} ${styles.borderColor} ${styles.hoverText}`
      }`}
    >
      Modern Mode
    </button>
    <button
      onClick={() => setMode('classic')}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
        mode === 'classic'
          ? `${styles.activeBg} ${styles.textPrimary} ${styles.inputBorder}`
          : `${styles.cardBg} ${styles.textMuted} ${styles.borderColor} ${styles.hoverText}`
      }`}
    >
      Classic Mode
    </button>
  </div>
);
