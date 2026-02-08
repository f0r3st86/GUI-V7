// Theme Context - manages dark/light theme state
import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import type { Theme, ThemeStyles, ThemeContextType } from '../types';

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme styles generator - exact copy from original component
const getThemeStyles = (theme: Theme): ThemeStyles => ({
  // Backgrounds
  mainBg: theme === 'dark' ? 'bg-black' : 'bg-gray-50',
  headerBg: theme === 'dark' ? 'bg-zinc-900' : 'bg-white',
  sectionBg: theme === 'dark' ? 'bg-zinc-900' : 'bg-white',
  cardBg: theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-100',
  inputBg: theme === 'dark' ? 'bg-zinc-900' : 'bg-white',
  readOnlyBg: theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200',

  // Borders
  borderColor: theme === 'dark' ? 'border-zinc-800' : 'border-gray-200',
  inputBorder: theme === 'dark' ? 'border-zinc-600' : 'border-gray-300',
  focusBorder: theme === 'dark' ? 'focus:border-green-500' : 'focus:border-green-600',

  // Text colors
  textPrimary: theme === 'dark' ? 'text-white' : 'text-gray-900',
  textSecondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-700',
  textMuted: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
  textGreen: theme === 'dark' ? 'text-green-400' : 'text-green-600',
  textYellow: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
  textRed: theme === 'dark' ? 'text-red-400' : 'text-red-600',

  // Hover states
  hoverDanger: theme === 'dark' ? 'hover:text-red-400' : 'hover:text-red-600',
  hoverBg: theme === 'dark' ? 'hover:bg-zinc-800/30' : 'hover:bg-gray-100',
  hoverText: theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900',
  buttonHover: theme === 'dark' ? 'hover:bg-zinc-600' : 'hover:bg-gray-300',

  // Active/Selected states
  selectedBg: theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50',
  selectedHoverBg: theme === 'dark' ? 'hover:bg-green-500/15' : 'hover:bg-green-100',
  activeBg: theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200',
  activeTabBg: theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100',
  inactiveTabBg: theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-50',

  // Validation
  invalidBorder: theme === 'dark' ? 'border-red-500' : 'border-red-500',
  invalidBg: theme === 'dark' ? 'bg-red-500/20' : 'bg-red-50',
  validRing: theme === 'dark' ? 'ring-green-500' : 'ring-green-600',
  invalidRing: theme === 'dark' ? 'ring-red-500' : 'ring-red-600',

  // Special elements
  alertBg: theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50',
  alertBorder: theme === 'dark' ? 'border-red-800/30' : 'border-red-200',
  alertText: theme === 'dark' ? 'text-red-400' : 'text-red-600',

  // Table
  tableHeaderBg: theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-100',

  // Menu bar
  menuBg: theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-50',
});

interface ThemeProviderProps {
  children: ReactNode;
}

// Provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const styles = useMemo(() => getThemeStyles(theme), [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme,
    styles
  }), [theme, styles]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper function to get status color based on loan status
export const getStatusColor = (status: string, theme: Theme): string => {
  switch(status) {
    case 'PA': return theme === 'dark' ? 'text-green-400' : 'text-green-600';  // Performing Asset
    case 'FA': return theme === 'dark' ? 'text-green-400' : 'text-green-600';  // Fully Performing
    case 'FC': return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'; // Foreclosure
    case 'JG': return theme === 'dark' ? 'text-orange-400' : 'text-orange-600'; // Judgment
    case 'LT': return theme === 'dark' ? 'text-red-400' : 'text-red-600';    // Litigation
    default: return theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  }
};
