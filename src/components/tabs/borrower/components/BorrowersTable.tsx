// Top section: Borrower/Guarantor list table with add/delete
import React from 'react';
import { maskSsnEin } from '../../../../utils';
import type { Borrower, ThemeStyles } from '../../../../types';

interface BorrowersTableProps {
  styles: ThemeStyles;
  currentRelationship: string;
  relationshipBorrowers: Borrower[];
  selectedBorrowerId: number | null;
  setSelectedBorrowerId: (id: number) => void;
  addNewBorrower: () => void;
  showDeleteConfirmation: (id: number, name: string) => void;
}

export const BorrowersTable: React.FC<BorrowersTableProps> = ({
  styles,
  currentRelationship,
  relationshipBorrowers,
  selectedBorrowerId,
  setSelectedBorrowerId,
  addNewBorrower,
  showDeleteConfirmation,
}) => (
  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className={`font-medium ${styles.textPrimary}`}>Borrowers & Guarantors</h3>
        <p className={`text-xs ${styles.textMuted} mt-0.5`}>Relationship: {currentRelationship}</p>
      </div>
      <button
        onClick={addNewBorrower}
        className={`px-3 py-1.5 ${styles.inputBg} ${styles.inputBorder} border ${styles.textPrimary} rounded transition-colors text-xs ${styles.buttonHover}`}
      >
        + Add New
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className={`${styles.borderColor} border-b`}>
            <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Name</th>
            <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Phone</th>
            <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Address</th>
            <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>City, State</th>
            <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>SSN/EIN</th>
            <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Credit Score</th>
            <th className={`text-center px-2 py-2 ${styles.textMuted} font-medium`}>BK Status</th>
            <th className={`text-center px-2 py-2 ${styles.textMuted} font-medium`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {relationshipBorrowers.map((borrower) => (
            <tr
              key={borrower.id}
              onClick={() => setSelectedBorrowerId(borrower.id)}
              className={`${styles.borderColor} border-b cursor-pointer transition-colors ${
                selectedBorrowerId === borrower.id ? styles.activeTabBg : styles.hoverText
              }`}
            >
              <td className={`px-2 py-2 ${styles.textPrimary} font-medium`}>{borrower.name || '(New)'}</td>
              <td className={`px-2 py-2 ${styles.textSecondary}`}>{borrower.phone}</td>
              <td className={`px-2 py-2 ${styles.textSecondary}`}>{borrower.address1}</td>
              <td className={`px-2 py-2 ${styles.textSecondary}`}>
                {borrower.city}{borrower.city && borrower.state ? ', ' : ''}{borrower.state}
              </td>
              <td className={`px-2 py-2 ${styles.textSecondary}`} title="SSN/EIN masked for security">
                {maskSsnEin(borrower.ssnEin)}
              </td>
              <td className={`px-2 py-2 ${styles.textSecondary}`}>{borrower.creditScore}</td>
              <td className={`px-2 py-2 text-center`}>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  borrower.bkStatus === 'none' ? styles.textMuted :
                  borrower.bkStatus === 'open' ? `${styles.invalidBg} ${styles.textRed}` :
                  borrower.bkStatus === 'dismissed' ? 'bg-yellow-500/20 text-yellow-400' :
                  borrower.bkStatus === 'discharged' ? 'bg-green-500/20 text-green-400' :
                  styles.textMuted
                }`}>
                  {borrower.bkStatus === 'none' ? 'None' :
                   borrower.bkStatus === 'open' ? 'Open' :
                   borrower.bkStatus === 'dismissed' ? 'Dismissed' :
                   borrower.bkStatus === 'discharged' ? 'Discharged' : 'None'}
                </span>
              </td>
              <td className="px-2 py-2 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    showDeleteConfirmation(borrower.id, borrower.name);
                  }}
                  className={`${styles.textMuted} ${styles.hoverDanger} transition-colors`}
                  disabled={relationshipBorrowers.length === 1}
                  title={relationshipBorrowers.length === 1 ? "Cannot delete last borrower" : "Delete borrower"}
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
