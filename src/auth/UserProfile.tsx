// User profile dropdown - shows logged in user info
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from '../context';
import { LogOut, User } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const { styles } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="relative">
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded ${styles.hoverBg} transition-colors`}
      >
        <div className={`w-8 h-8 rounded-full ${styles.activeBg} flex items-center justify-center`}>
          <User size={18} className={styles.textPrimary} />
        </div>
        <div className="text-left hidden md:block">
          <p className={`text-sm font-medium ${styles.textPrimary}`}>{user.name}</p>
          <p className={`text-xs ${styles.textMuted}`}>{user.email}</p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className={`absolute right-0 mt-2 w-64 ${styles.cardBg} ${styles.borderColor} border rounded-lg shadow-lg z-20`}
          >
            {/* User Info */}
            <div className="p-4 border-b border-gray-700">
              <p className={`font-medium ${styles.textPrimary}`}>{user.name}</p>
              <p className={`text-sm ${styles.textMuted} mt-1`}>{user.email}</p>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded ${styles.hoverBg} ${styles.textPrimary} text-left transition-colors`}
              >
                <LogOut size={18} />
                <span>Sign out</span>
              </button>
            </div>

            {/* Footer */}
            <div className={`p-3 border-t ${styles.borderColor}`}>
              <p className={`text-xs ${styles.textMuted}`}>
                Authenticated via Microsoft
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
