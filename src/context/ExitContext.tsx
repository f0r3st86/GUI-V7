// Exit Context - manages exit scenario settings state
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type { ExitSettings, ExitContextType } from '../types';

// Create context
const ExitContext = createContext<ExitContextType | undefined>(undefined);

// Default exit settings - exact match from original component
const defaultSettings: ExitSettings = {
  method: 'Pay in Full',
  startMonth: '1',
  endMonth: '24',
  dpoPercentage: '95',
  valueCapPercentage: '90',
  userEnterAmount: '',
  ytmDesired: '12',
  liquidationMonths: '12',
  liquidationAddInterest: false
};

interface ExitProviderProps {
  children: ReactNode;
}

// Provider component
export const ExitProvider: React.FC<ExitProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ExitSettings>(defaultSettings);

  const updateSetting = useCallback(<K extends keyof ExitSettings>(
    key: K,
    value: ExitSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const value = useMemo(() => ({
    settings,
    setSettings,
    updateSetting
  }), [settings, updateSetting]);

  return (
    <ExitContext.Provider value={value}>
      {children}
    </ExitContext.Provider>
  );
};

// Custom hook
export const useExit = (): ExitContextType => {
  const context = useContext(ExitContext);
  if (context === undefined) {
    throw new Error('useExit must be used within an ExitProvider');
  }
  return context;
};
