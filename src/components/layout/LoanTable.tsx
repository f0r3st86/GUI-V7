// LoanTable component - displays the relationship loans grid with the
// relationship flag panel (matching the production workbook layout).
//
// Grid = read-only summary (workbook convention); ordered by principal
// descending (SORTBY contract). The flag panel binds the six STORED
// tblRelationships bits and is editable from any view (yellow-cell rule).
import React from 'react';
import { useTheme, useLoan } from '../../context';
import { useLoans, useRelationships, useUpdateRelationship } from '../../hooks';
import { RELATIONSHIP_FLAGS } from '../../data/constants';
import type { Loan } from '../../types';

export const LoanTable: React.FC = () => {
  const { styles } = useTheme();

  // UI state from Context
  const { selectedLoan, setSelectedLoan, currentRelationship, setRelationshipBrowserOpen } = useLoan();

  // Data from React Query
  const { data: loans, isLoading } = useLoans();
  const { data: relationships = [] } = useRelationships();
  const { mutate: updateRelationship } = useUpdateRelationship();

  const relationshipData = React.useMemo(
    () => relationships.find(r => r.relatedLoans === currentRelationship),
    [relationships, currentRelationship]
  );

  // Relationship loans, principal descending (workbook SORTBY contract)
  const relationshipLoans = React.useMemo(
    () => (loans || [])
      .filter(loan => loan.relatedLoans === currentRelationship)
      .sort((a, b) => (b.principal || 0) - (a.principal || 0)),
    [loans, currentRelationship]
  );

  const handleLoanClick = (loan: Loan) => {
    setSelectedLoan(loan.mwLoanNo);
  };

  const handleFlagToggle = (flagKey: typeof RELATIONSHIP_FLAGS[number]['key']) => {
    if (!relationshipData) return;
    updateRelationship({
      relatedLoans: currentRelationship,
      updates: { [flagKey]: !relationshipData[flagKey] }
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`${styles.headerBg} ${styles.borderColor} border-b p-4`}>
        <p className={`text-sm ${styles.textMuted}`}>Loading loans...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.headerBg} ${styles.borderColor} border-b`}>
      {/* Relationship Label */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <span className={`text-sm font-medium ${styles.textPrimary}`}>
            Relationship: {currentRelationship || 'None'}
          </span>
          <span className={`ml-3 text-xs ${styles.textMuted}`}>
            ({relationshipLoans.length} loans)
          </span>
          {relationshipData?.sortNo != null && (
            <span className={`ml-3 text-xs ${styles.textMuted}`} title="Program-assigned UPB rank within project">
              Sort {relationshipData.sortNo}
            </span>
          )}
        </div>
        <button
          onClick={() => setRelationshipBrowserOpen(true)}
          className={`px-2.5 py-1 rounded text-xs ${styles.inputBg} ${styles.inputBorder} border ${styles.textSecondary} ${styles.buttonHover}`}
          aria-label="Browse relationships"
        >
          Browse Relationships
        </button>
      </div>

      {/* Grid + Flag Panel */}
      <div className="flex">
        {/* Loan Table (read-only summary) */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs">
            <thead>
              <tr className={`${styles.borderColor} border-b ${styles.tableHeaderBg}`}>
                <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium`}>Loan No</th>
                <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium`}>Borrower</th>
                <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium`}>Orig Balance</th>
                <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium`}>Principal</th>
                <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium`}>Interest</th>
                <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium`}>Total</th>
                <th className={`text-center px-3 py-2 ${styles.textMuted} font-medium`}>Rate</th>
                <th className={`text-center px-3 py-2 ${styles.textMuted} font-medium`}>PMT</th>
              </tr>
            </thead>
            <tbody>
              {relationshipLoans.map((loan) => (
                <tr
                  key={loan.mwLoanNo}
                  onClick={() => handleLoanClick(loan)}
                  className={`${styles.borderColor} border-b cursor-pointer transition-colors ${
                    loan.mwLoanNo === selectedLoan
                      ? styles.selectedBg + ' ' + styles.selectedHoverBg
                      : styles.hoverBg
                  }`}
                >
                  <td className={`px-3 py-2 font-medium ${
                    loan.mwLoanNo === selectedLoan ? styles.textGreen : styles.textPrimary
                  }`}>
                    {loan.mwLoanNo}
                  </td>
                  <td className={`px-3 py-2 ${styles.textPrimary}`}>
                    {loan.borrowerName}
                  </td>
                  <td className={`px-3 py-2 text-right ${styles.textPrimary}`}>
                    ${loan.origBalance.toLocaleString()}
                  </td>
                  <td className={`px-3 py-2 text-right ${styles.textPrimary}`}>
                    ${loan.principal.toLocaleString()}
                  </td>
                  <td className={`px-3 py-2 text-right ${styles.textMuted}`}>
                    ${loan.interest.toLocaleString()}
                  </td>
                  <td className={`px-3 py-2 text-right ${styles.textGreen} font-medium`}>
                    ${(loan.principal + loan.interest).toLocaleString()}
                  </td>
                  <td className={`px-3 py-2 text-center ${styles.textPrimary}`}>
                    {loan.intRate}%
                  </td>
                  <td className={`px-3 py-2 text-center ${styles.textPrimary}`}>
                    ${loan.pmt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Relationship Flag Panel (stored tblRelationships bits, editable) */}
        <div
          className={`${styles.borderColor} border-l px-3 py-2 flex-shrink-0`}
          role="group"
          aria-label="Relationship flags"
        >
          {RELATIONSHIP_FLAGS.map(flag => {
            const active = relationshipData ? relationshipData[flag.key] : false;
            return (
              <label
                key={flag.key}
                className={`flex items-center gap-1.5 py-0.5 cursor-pointer text-xs ${
                  active ? styles.textRed + ' font-medium' : styles.textMuted
                }`}
                title={flag.title}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => handleFlagToggle(flag.key)}
                  aria-label={flag.title}
                  className="accent-red-600"
                  disabled={!relationshipData}
                />
                {flag.title}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
