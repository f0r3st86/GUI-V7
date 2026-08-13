// RelationshipBrowser - portfolio-level view listing every relationship
// This is the missing "level above" the relationship workbench: browse,
// search, and switch between relationships. Selecting one loads its first
// loan into the workbench (everything else derives from that selection).
//
// *** SQL CONNECTION POINT ***
// In production this maps to tblRelationships joined with aggregates
// from vwRelationshipSummary, grouped by RelatedLoans.
import React, { useState, useMemo } from 'react';
import { useTheme, useLoan } from '../../context';
import { useLoans, useBorrowers, useCollateral, useCollateralRelationships, useRelationships } from '../../hooks';
import type { Relationship } from '../../types';

type SortField = 'name' | 'loans' | 'upb' | 'rate';
type SortDirection = 'asc' | 'desc';

interface RelationshipRow {
  name: string;
  loanCount: number;
  borrowerCount: number;
  collateralCount: number;
  totalUPB: number;
  weightedRate: number;
  flags: string[];
  firstLoanNo: string;
}

// Stored relationship flags (tblRelationships bits) -> display labels
const flagLabels = (r: Relationship | undefined): string[] => {
  if (!r) return [];
  const out: string[] = [];
  if (r.inBankruptcy) out.push('Bankruptcy');
  if (r.foreclosureFlag) out.push('Foreclosure');
  if (r.litigationFlag) out.push('Litigation');
  if (r.forbearanceFlag) out.push('Forbearance');
  if (r.judgmentFlag) out.push('Judgment');
  if (r.lowYieldAsset) out.push('Low Yield');
  return out;
};

export const RelationshipBrowser: React.FC = () => {
  const { styles } = useTheme();
  const { currentRelationship, setSelectedLoan, setRelationshipBrowserOpen } = useLoan();

  const { data: loans = [], isLoading: loansLoading } = useLoans();
  const { data: borrowers = [] } = useBorrowers();
  const { data: collateral = [] } = useCollateral();
  const { data: collateralRelationships = {} } = useCollateralRelationships();
  const { data: relationshipEntities = [] } = useRelationships();

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('upb');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Group loans into relationship rows with aggregates
  const relationships = useMemo((): RelationshipRow[] => {
    const groups = new Map<string, typeof loans>();
    loans.forEach(loan => {
      const key = loan.relatedLoans || '(Unassigned)';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(loan);
    });

    return Array.from(groups.entries()).map(([name, groupLoans]) => {
      const loanNos = new Set(groupLoans.map(l => l.mwLoanNo));
      const totalPrincipal = groupLoans.reduce((s, l) => s + (l.principal || 0), 0);
      const totalUPB = groupLoans.reduce(
        (s, l) => s + (l.principal || 0) + (l.interest || 0) + (l.escrowBalance || 0) + (l.otherBalance || 0),
        0
      );
      const weightedRate = totalPrincipal > 0
        ? groupLoans.reduce((s, l) => s + (l.intRate || 0) * (l.principal || 0), 0) / totalPrincipal
        : 0;

      // Flags come from the STORED tblRelationships bits, not loan statuses
      const relationshipEntity = relationshipEntities.find(r => r.relatedLoans === name);
      const relationshipBorrowers = borrowers.filter(b => b.relationship === name);

      const collateralCount = collateral.filter(c => {
        const rels = collateralRelationships[c.id];
        return rels && Object.entries(rels).some(([ln, linked]) => linked && loanNos.has(ln));
      }).length;

      // First loan by loan number gives a stable default selection
      const firstLoanNo = [...groupLoans].sort((a, b) => a.mwLoanNo.localeCompare(b.mwLoanNo))[0].mwLoanNo;

      return {
        name,
        loanCount: groupLoans.length,
        borrowerCount: relationshipBorrowers.length,
        collateralCount,
        totalUPB,
        weightedRate,
        flags: flagLabels(relationshipEntity),
        firstLoanNo,
      };
    });
  }, [loans, borrowers, collateral, collateralRelationships, relationshipEntities]);

  // Search + sort
  const visibleRelationships = useMemo(() => {
    const term = search.trim().toLowerCase();
    let rows = relationships;
    if (term) {
      const matchingLoanRels = new Set(
        loans
          .filter(l =>
            l.mwLoanNo.toLowerCase().includes(term) ||
            l.borrowerName.toLowerCase().includes(term)
          )
          .map(l => l.relatedLoans || '(Unassigned)')
      );
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(term) || matchingLoanRels.has(r.name)
      );
    }
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sortField) {
        case 'name': return a.name.localeCompare(b.name) * dir;
        case 'loans': return (a.loanCount - b.loanCount) * dir;
        case 'rate': return (a.weightedRate - b.weightedRate) * dir;
        default: return (a.totalUPB - b.totalUPB) * dir;
      }
    });
  }, [relationships, loans, search, sortField, sortDirection]);

  const portfolioUPB = useMemo(
    () => relationships.reduce((s, r) => s + r.totalUPB, 0),
    [relationships]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  const handleSelect = (row: RelationshipRow) => {
    if (row.name !== currentRelationship) {
      setSelectedLoan(row.firstLoanNo);
    }
    setRelationshipBrowserOpen(false);
  };

  const sortArrow = (field: SortField) =>
    sortField === field ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

  if (loansLoading) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading relationships...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-xl font-bold ${styles.textPrimary}`}>Relationships</h2>
          <p className={`text-xs ${styles.textMuted} mt-1`}>
            {relationships.length} relationship{relationships.length !== 1 ? 's' : ''} | Portfolio UPB ${portfolioUPB.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setRelationshipBrowserOpen(false)}
          className={`px-3 py-1.5 rounded text-sm ${styles.inputBg} ${styles.inputBorder} border ${styles.textPrimary} ${styles.buttonHover}`}
        >
          Back to {currentRelationship || 'Workbench'}
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search relationships"
        placeholder="Search by relationship, borrower, or loan number..."
        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} mb-4`}
      />

      {/* Relationship table */}
      <div className={`${styles.cardBg} rounded-lg ${styles.inputBorder} border overflow-x-auto`}>
        <table className="w-full text-sm" role="table" aria-label="Relationships">
          <thead>
            <tr className={`${styles.tableHeaderBg} border-b ${styles.inputBorder}`}>
              <th
                className={`text-left px-3 py-2 font-medium ${styles.textSecondary} cursor-pointer select-none`}
                onClick={() => handleSort('name')}
              >
                Relationship{sortArrow('name')}
              </th>
              <th
                className={`text-center px-3 py-2 font-medium ${styles.textSecondary} cursor-pointer select-none`}
                onClick={() => handleSort('loans')}
              >
                Loans{sortArrow('loans')}
              </th>
              <th className={`text-center px-3 py-2 font-medium ${styles.textSecondary}`}>Borrowers</th>
              <th className={`text-center px-3 py-2 font-medium ${styles.textSecondary}`}>Collateral</th>
              <th
                className={`text-right px-3 py-2 font-medium ${styles.textSecondary} cursor-pointer select-none`}
                onClick={() => handleSort('upb')}
              >
                Total UPB{sortArrow('upb')}
              </th>
              <th
                className={`text-right px-3 py-2 font-medium ${styles.textSecondary} cursor-pointer select-none`}
                onClick={() => handleSort('rate')}
              >
                W.Avg Rate{sortArrow('rate')}
              </th>
              <th className={`text-left px-3 py-2 font-medium ${styles.textSecondary}`}>Flags</th>
            </tr>
          </thead>
          <tbody>
            {visibleRelationships.map(row => {
              const isCurrent = row.name === currentRelationship;
              return (
                <tr
                  key={row.name}
                  onClick={() => handleSelect(row)}
                  className={`border-b ${styles.inputBorder} cursor-pointer transition-colors ${
                    isCurrent ? `${styles.selectedBg} ${styles.selectedHoverBg}` : styles.hoverBg
                  }`}
                >
                  <td className={`px-3 py-2 font-medium ${isCurrent ? styles.textGreen : styles.textPrimary}`}>
                    {row.name}
                    {isCurrent && <span className={`ml-2 text-xs ${styles.textMuted}`}>(current)</span>}
                  </td>
                  <td className={`px-3 py-2 text-center ${styles.textPrimary}`}>{row.loanCount}</td>
                  <td className={`px-3 py-2 text-center ${styles.textPrimary}`}>{row.borrowerCount}</td>
                  <td className={`px-3 py-2 text-center ${styles.textPrimary}`}>{row.collateralCount}</td>
                  <td className={`px-3 py-2 text-right font-medium ${styles.textPrimary}`}>
                    ${row.totalUPB.toLocaleString()}
                  </td>
                  <td className={`px-3 py-2 text-right ${styles.textPrimary}`}>
                    {row.weightedRate.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {row.flags.length === 0 ? (
                        <span className={`text-xs ${styles.textMuted}`}>-</span>
                      ) : (
                        row.flags.map(flag => (
                          <span
                            key={flag}
                            className="px-1.5 py-0.5 rounded text-xs bg-red-600 text-white"
                          >
                            {flag}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleRelationships.length === 0 && (
              <tr>
                <td colSpan={7} className={`px-3 py-6 text-center text-sm ${styles.textMuted}`}>
                  No relationships match "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className={`text-xs ${styles.textMuted} mt-3`}>
        Click a relationship to open it in the workbench.
      </p>
    </div>
  );
};
