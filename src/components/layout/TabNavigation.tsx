// TabNavigation component - tab buttons for switching between views
import React from 'react';
import { useTheme, useLoan } from '../../context';
import { TABS } from '../../data';

export const TabNavigation: React.FC = () => {
  const { styles } = useTheme();
  const { activeTab, setActiveTab } = useLoan();

  return (
    <div className={`flex ${styles.borderColor} border-b`}>
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === tab
              ? `${styles.activeTabBg} ${styles.textGreen} ${styles.borderColor} border-b-2 border-green-500`
              : `${styles.textMuted} ${styles.hoverBg} ${styles.hoverText}`
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
