// Header component - top bar with logo, theme toggle, and user icons
import React from 'react';
import { Sun, Moon, Settings, User, Bell } from 'lucide-react';
import { useTheme } from '../../context';

export const Header: React.FC = () => {
  const { theme, toggleTheme, styles } = useTheme();

  return (
    <div className={`h-12 ${styles.headerBg} flex items-center justify-between px-4 ${styles.borderColor} border-b`}>
      {/* Left side - Logo */}
      <div className="flex items-center space-x-3">
        <div className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          LOAN<span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>SYSTEM</span>
        </div>
      </div>

      {/* Right side - Theme toggle and user controls */}
      <div className="flex items-center space-x-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded ${styles.hoverBg} ${styles.textMuted} ${styles.hoverText} transition-colors`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className={`p-2 rounded ${styles.hoverBg} ${styles.textMuted} ${styles.hoverText} transition-colors`} aria-label="Notifications">
          <Bell size={18} />
        </button>

        {/* Settings */}
        <button className={`p-2 rounded ${styles.hoverBg} ${styles.textMuted} ${styles.hoverText} transition-colors`} aria-label="Settings">
          <Settings size={18} />
        </button>

        {/* User */}
        <button className={`p-2 rounded ${styles.hoverBg} ${styles.textMuted} ${styles.hoverText} transition-colors`} aria-label="User profile">
          <User size={18} />
        </button>
      </div>
    </div>
  );
};
