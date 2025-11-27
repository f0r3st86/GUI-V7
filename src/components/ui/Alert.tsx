// Reusable Alert component with theme support
import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTheme } from '../../context';

interface AlertProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  className = '',
  title
}) => {
  const { styles } = useTheme();

  return (
    <div className={`${styles.alertBg} ${styles.alertBorder} rounded-lg border p-3 ${className}`}>
      <div className="flex items-start">
        <AlertCircle size={16} className={`${styles.alertText} mr-2 mt-0.5`} />
        <div className={`text-xs ${styles.alertText}`}>
          {title && <p className="font-medium">{title}</p>}
          <div className={title ? 'mt-1' : ''}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Warning alert variant
interface WarningAlertProps {
  children: ReactNode;
  className?: string;
}

export const WarningAlert: React.FC<WarningAlertProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg ${className}`}>
      <div className="flex items-start gap-2">
        <span className="text-yellow-400 text-lg">Warning</span>
        <div className="text-yellow-300 text-xs">
          {children}
        </div>
      </div>
    </div>
  );
};

// Error alert variant
interface ErrorAlertProps {
  title: string;
  message?: string;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title,
  message,
  className = ''
}) => {
  return (
    <div className={`p-3 bg-red-900/30 border border-red-500/50 rounded-lg ${className}`}>
      <div className="flex items-start gap-2">
        <span className="text-red-400 text-lg">Warning</span>
        <div>
          <div className="text-red-400 font-medium text-sm">{title}</div>
          {message && (
            <div className="text-red-300/70 text-xs mt-1">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
};
