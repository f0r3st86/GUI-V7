// MenuBar component - File, Home, Create, etc. buttons
import React from 'react';
import { useTheme } from '../../context';

export const MenuBar: React.FC = () => {
  const { styles } = useTheme();

  const menuItems = ['File', 'Home', 'Create', 'Import', 'Export', 'Reports', 'Tools', 'Admin'];

  return (
    <div className={`h-9 ${styles.menuBg} flex items-center px-2 ${styles.borderColor} border-b`}>
      {menuItems.map((item) => (
        <button
          key={item}
          className={`px-3 py-1 ${styles.textMuted} ${styles.hoverBg} ${styles.hoverText} rounded text-sm transition-colors`}
        >
          {item}
        </button>
      ))}
    </div>
  );
};
