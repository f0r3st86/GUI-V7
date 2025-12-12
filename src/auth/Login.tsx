// Login page with Microsoft SSO
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from '../context';
import { AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { styles } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoggingIn(true);
      await login();
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again or contact your administrator.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${styles.mainBg}`}>
      <div className={`${styles.cardBg} ${styles.borderColor} border rounded-lg p-8 max-w-md w-full mx-4`}>
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${styles.textPrimary} mb-2`}>
            Loan Underwriting System
          </h1>
          <p className={`${styles.textMuted} text-sm`}>
            Secure access to loan portfolio management
          </p>
        </div>

        {/* Microsoft Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className={`
            w-full flex items-center justify-center gap-3 px-6 py-3
            bg-white hover:bg-gray-50
            border border-gray-300 rounded
            text-gray-700 font-medium
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-sm hover:shadow
          `}
        >
          {/* Microsoft Logo SVG */}
          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>

          <span>
            {isLoggingIn ? 'Signing in...' : 'Sign in with Microsoft'}
          </span>
        </button>

        {/* Error Message */}
        {error && (
          <div className={`mt-4 ${styles.alertBg} ${styles.alertBorder} border rounded p-3 flex items-start gap-2`}>
            <AlertCircle size={20} className={styles.alertText} />
            <p className={`${styles.alertText} text-sm`}>{error}</p>
          </div>
        )}

        {/* Info Section */}
        <div className={`mt-8 pt-6 border-t ${styles.borderColor}`}>
          <p className={`${styles.textMuted} text-xs text-center`}>
            This application uses your company Microsoft account for secure authentication.
          </p>
          <p className={`${styles.textMuted} text-xs text-center mt-2`}>
            By signing in, you agree to the terms of service and privacy policy.
          </p>
        </div>

        {/* Help Text */}
        <div className={`mt-6 text-center`}>
          <p className={`${styles.textMuted} text-xs`}>
            Need help? Contact IT support
          </p>
        </div>
      </div>
    </div>
  );
};
