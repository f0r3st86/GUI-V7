// Projection Context - manages projection settings state
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type { ProjectionSettings, ProjectionContextType } from '../types';

// Create context
const ProjectionContext = createContext<ProjectionContextType | undefined>(undefined);

// Default projection settings - exact match from original component
const defaultSettings: ProjectionSettings = {
  paymentMethod: 'Contractual',
  rateMethod: 'Contractual',
  userPayment: '',
  userRate: '',
  amortMonths: '360',
  trailPeriod: '12',
  trailPercentage: '100',
  initialLegal: '',
  initialLegalStartMonth: '1',
  holdingCosts: '',
  holdingCostsEndMonth: '12',
  addBackPercentage: '0',
  addBackBasis: 'Initial Only'
};

interface ProjectionProviderProps {
  children: ReactNode;
}

// Provider component
export const ProjectionProvider: React.FC<ProjectionProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ProjectionSettings>(defaultSettings);

  const updateSetting = useCallback(<K extends keyof ProjectionSettings>(
    key: K,
    value: ProjectionSettings[K]
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
    <ProjectionContext.Provider value={value}>
      {children}
    </ProjectionContext.Provider>
  );
};

// Custom hook
export const useProjection = (): ProjectionContextType => {
  const context = useContext(ProjectionContext);
  if (context === undefined) {
    throw new Error('useProjection must be used within a ProjectionProvider');
  }
  return context;
};
