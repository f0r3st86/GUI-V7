// Reusable TextArea component with theme support
import React from 'react';
import { useTheme } from '../../context';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  className = '',
  ...props
}) => {
  const { styles } = useTheme();

  return (
    <div>
      {label && (
        <label className={`text-xs ${styles.textMuted} block mb-1`}>{label}</label>
      )}
      <textarea
        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder} font-mono ${className}`}
        {...props}
      />
    </div>
  );
};
