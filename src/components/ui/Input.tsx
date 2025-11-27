// Reusable Input component with theme support
import React from 'react';
import { useTheme } from '../../context';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  readOnly?: boolean;
  isCalculated?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  readOnly = false,
  isCalculated = false,
  className = '',
  ...props
}) => {
  const { styles } = useTheme();

  const inputClasses = readOnly
    ? `${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${isCalculated ? styles.textYellow : styles.textPrimary} font-medium focus:outline-none cursor-not-allowed`
    : `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div>
      {label && (
        <label className={`text-xs ${styles.textMuted} block mb-1`}>{label}</label>
      )}
      <input
        className={`${inputClasses} ${className}`}
        readOnly={readOnly}
        {...props}
      />
    </div>
  );
};

// Version with enhanced styling for calculated/derived values
export const CalculatedInput: React.FC<InputProps> = (props) => {
  return <Input {...props} readOnly isCalculated />;
};
