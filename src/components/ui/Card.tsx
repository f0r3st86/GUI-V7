// Reusable Card component with theme support
import React, { ReactNode } from 'react';
import { useTheme } from '../../context';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  style
}) => {
  const { styles } = useTheme();

  return (
    <div
      className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border ${className}`}
      style={style}
    >
      {title && (
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>{title}</h3>
      )}
      {children}
    </div>
  );
};

// Smaller card variant for compact layouts
export const CardSmall: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  style
}) => {
  const { styles } = useTheme();

  return (
    <div
      className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border ${className}`}
      style={style}
    >
      {title && (
        <h4 className={`text-xs ${styles.textMuted} font-medium mb-3`}>{title}</h4>
      )}
      {children}
    </div>
  );
};
