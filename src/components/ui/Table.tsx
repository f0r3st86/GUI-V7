// Reusable Table component with theme support
import React, { ReactNode } from 'react';
import { useTheme } from '../../context';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <table className={`w-full ${className}`}>
      {children}
    </table>
  );
};

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '' }) => {
  const { theme } = useTheme();

  return (
    <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'} ${className}`}>
      {children}
    </thead>
  );
};

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
};

interface TableRowProps {
  children: ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className = '',
  selected = false,
  onClick
}) => {
  const { theme, styles } = useTheme();

  const selectedClass = selected
    ? theme === 'dark' ? 'bg-zinc-800' : 'bg-blue-50'
    : styles.hoverBg;

  return (
    <tr
      onClick={onClick}
      className={`${styles.borderColor} border-b cursor-pointer transition-colors ${selectedClass} ${className}`}
    >
      {children}
    </tr>
  );
};

interface TableCellProps {
  children: ReactNode;
  className?: string;
  header?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  header = false
}) => {
  const { styles } = useTheme();

  if (header) {
    return (
      <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs ${className}`}>
        {children}
      </th>
    );
  }

  return (
    <td className={`px-3 py-2 text-xs ${styles.textPrimary} ${className}`}>
      {children}
    </td>
  );
};
