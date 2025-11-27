// Reusable Button component with theme support
import React from 'react';
import { useTheme } from '../../context';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'sm',
  className = '',
  children,
  ...props
}) => {
  const { styles } = useTheme();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    default: `${styles.cardBg} ${styles.inputBorder} border ${styles.textPrimary} ${styles.buttonHover}`,
    primary: `bg-green-600 hover:bg-green-700 text-white border border-green-600`,
    danger: `bg-red-600 hover:bg-red-700 text-white border border-red-600`,
    success: `${styles.cardBg} ${styles.inputBorder} border ${styles.textGreen} ${styles.buttonHover}`
  };

  return (
    <button
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded transition-colors font-medium ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
