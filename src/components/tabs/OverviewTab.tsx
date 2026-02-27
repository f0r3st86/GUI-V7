// OverviewTab component - relationship-level dashboard with loan, collateral, and borrower summaries
// This tab is for the RELATIONSHIP as a whole, not per-loan
//
// *** SQL CONNECTION POINTS ***
// Maps to these database views/tables:
//   tblRelationships  - relationship flags (InBankruptcy, ForeclosureFlag, LitigationFlag, ForbearanceFlag, JudgmentFlag)
//   vwRelationshipSummary - per-loan: MWLoanNo, BorrowerNm, OrigPrincipalBalance, PrincipalBalance, InterestBalance, RepayAmt, Rate
//   vwCollateralSummary   - CurrentAppraisedValue, LienPosition, SeniorLienAmount, TaxAnnualAmt, TaxMarketValue, MaxBPO
//   vwBorrowerSummary     - BorrName, City, State, BeaconScore, BeaconDate, BKStatus, BKChapter, IsBusiness

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../../context';
import { useLoan } from '../../context';
import { useLoans, useBorrowers, useCollateral, useCollateralRelationships } from '../../hooks';
import { maskSsnEin } from '../../utils/formatters';

const STORAGE_KEY = 'gui-v7-overview';

// Loan status display labels
const STATUS_LABELS: Record<string, string> = {
  'PA': 'Performing',
  'FA': 'Forbearance',
  'FC': 'Foreclosure',
  'JG': 'Judgment',
  'LT': 'Litigation',
  '': 'Active'
};

// Status badge color classes
const STATUS_COLORS: Record<string, string> = {
  'FC': 'bg-red-600 text-white',
  'LT': 'bg-orange-600 text-white',
  'JG': 'bg-yellow-600 text-white',
  'FA': 'bg-blue-600 text-white',
  'PA': 'bg-green-600 text-white',
};

const parseNumericString = (val: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace(/[$,]/g, '')) || 0;
};

const formatNum = (val: number): string => {
  return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const OverviewTab = React.memo(() => {
  const { styles } = useTheme();
  const { currentRelationship, selectedLoan } = useLoan();

  // React Query hooks for live data with loading states
  const { data: loans = [], isLoading: loansLoading } = useLoans();
  const { data: borrowers = [], isLoading: borrowersLoading } = useBorrowers();
  const { data: allCollateral = [], isLoading: collateralLoading } = useCollateral();
  const { data: collateralRelationships = {} } = useCollateralRelationships();

  const isLoading = loansLoading || borrowersLoading || collateralLoading;

  // ==================== DERIVED DATA ====================

  // Loans in current relationship, selected loan first
  const relationshipLoans = useMemo(() => {
    const filtered = loans.filter(l => l.relatedLoans === currentRelationship);
    return [...filtered].sort((a, b) => {
      if (a.mwLoanNo === selectedLoan) return -1;
      if (b.mwLoanNo === selectedLoan) return 1;
      return 0;
    });
  }, [loans, currentRelationship, selectedLoan]);

  const relationshipBorrowers = useMemo(() =>
    borrowers.filter(b => b.relationship === currentRelationship),
    [borrowers, currentRelationship]
  );

  // Collateral linked to any loan in the relationship
  const relationshipCollateral = useMemo(() => {
    const loanNos = new Set(relationshipLoans.map(l => l.mwLoanNo));
    return allCollateral.filter(c => {
      const rels = collateralRelationships[c.id];
      if (!rels) return false;
      return Object.entries(rels).some(([loanNo, linked]) => linked && loanNos.has(loanNo));
    });
  }, [allCollateral, collateralRelationships, relationshipLoans]);

  // Relationship-level flags (maps to tblRelationships columns)
  const flags = useMemo(() => ({
    bankruptcy: relationshipBorrowers.some(b =>
      b.bkStatus && b.bkStatus !== 'none' && b.bkStatus !== 'None'),
    foreclosure: relationshipLoans.some(l => l.status === 'FC'),
    litigation: relationshipLoans.some(l => l.status === 'LT'),
    forbearance: relationshipLoans.some(l => l.status === 'FA'),
    judgment: relationshipLoans.some(l => l.status === 'JG'),
  }), [relationshipLoans, relationshipBorrowers]);

  // Aggregate loan totals
  const totals = useMemo(() => {
    const totalOrigBalance = relationshipLoans.reduce((s, l) => s + (l.origBalance || 0), 0);
    const totalPrincipal = relationshipLoans.reduce((s, l) => s + (l.principal || 0), 0);
    const totalInterest = relationshipLoans.reduce((s, l) => s + (l.interest || 0), 0);
    const totalEscrow = relationshipLoans.reduce((s, l) => s + (l.escrowBalance || 0), 0);
    const totalOther = relationshipLoans.reduce((s, l) => s + (l.otherBalance || 0), 0);
    const totalUPB = totalPrincipal + totalInterest + totalEscrow + totalOther;
    const totalPayment = relationshipLoans.reduce((s, l) => s + (l.pmt || 0), 0);
    const weightedRate = totalPrincipal > 0
      ? relationshipLoans.reduce((s, l) => s + (l.intRate || 0) * (l.principal || 0), 0) / totalPrincipal
      : 0;
    return { totalOrigBalance, totalPrincipal, totalInterest, totalEscrow, totalOther, totalUPB, totalPayment, weightedRate };
  }, [relationshipLoans]);

  // Collateral totals
  const collateralTotals = useMemo(() => ({
    appraised: relationshipCollateral.reduce((s, c) => s + parseNumericString(c.appraisedValue), 0),
    bpo: relationshipCollateral.reduce((s, c) => s + parseNumericString(c.bpoValue), 0),
    lienAmount: relationshipCollateral.reduce((s, c) => s + parseNumericString(c.sellerLienAmount), 0),
    taxes: relationshipCollateral.reduce((s, c) => s + parseNumericString(c.taxes), 0),
    delinquentTaxes: relationshipCollateral.reduce((s, c) => s + parseNumericString(c.delinquentTaxes), 0),
  }), [relationshipCollateral]);

  // ==================== LOCALSTORAGE STATE ====================

  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load overview data:', e);
    }
    return { relationshipOverview: '', collateralOverview: '', bidConditions: '' };
  };

  const initialState = getInitialState();
  const [relationshipOverview, setRelationshipOverview] = useState(initialState.relationshipOverview);
  const [collateralOverview, setCollateralOverview] = useState(initialState.collateralOverview);
  const [bidConditions, setBidConditions] = useState(initialState.bidConditions);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        relationshipOverview, collateralOverview, bidConditions
      }));
    } catch (e) {
      console.error('Failed to save overview data:', e);
    }
  }, [relationshipOverview, collateralOverview, bidConditions]);

  // ==================== TEXTAREA AUTO-RESIZE ====================

  const relationshipRef = useRef<HTMLTextAreaElement>(null);
  const collateralRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    autoResize(relationshipRef.current);
    autoResize(collateralRef.current);
  }, [relationshipOverview, collateralOverview, autoResize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      autoResize(relationshipRef.current);
      autoResize(collateralRef.current);
    }, 0);
    return () => clearTimeout(timer);
  }, [autoResize]);

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

  const thCell = `text-left px-2 py-1.5 font-medium ${styles.textSecondary}`;
  const thCellRight = `text-right px-2 py-1.5 font-medium ${styles.textSecondary}`;
  const thCellCenter = `text-center px-2 py-1.5 font-medium ${styles.textSecondary}`;
  const tdCell = `px-2 py-1.5 ${styles.textPrimary}`;
  const tdCellRight = `px-2 py-1.5 text-right ${styles.textPrimary}`;
  const rowBorder = `border-b ${styles.inputBorder}`;

  return (
    <div className="p-4 space-y-4">
      {/* ===== RELATIONSHIP HEADER WITH FLAGS ===== */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-medium ${styles.textPrimary}`}>
            Relationship: {currentRelationship || 'N/A'}
          </h3>
          <span className={`text-xs ${styles.textMuted}`}>
            {relationshipLoans.length} loan{relationshipLoans.length !== 1 ? 's' : ''} | {relationshipBorrowers.length} borrower{relationshipBorrowers.length !== 1 ? 's' : ''} | {relationshipCollateral.length} collateral
          </span>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Relationship status flags">
          {([
            { key: 'bankruptcy', label: 'Bankruptcy', active: flags.bankruptcy },
            { key: 'foreclosure', label: 'Foreclosure', active: flags.foreclosure },
            { key: 'litigation', label: 'Litigation', active: flags.litigation },
            { key: 'forbearance', label: 'Forbearance', active: flags.forbearance },
            { key: 'judgment', label: 'Judgment', active: flags.judgment },
          ] as const).map(flag => (
            <span
              key={flag.key}
              data-testid={`flag-${flag.key}`}
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                flag.active
                  ? 'bg-red-600 text-white'
                  : `${styles.inputBg} ${styles.textMuted} ${styles.inputBorder} border`
              }`}
              role="status"
              aria-label={`${flag.label}: ${flag.active ? 'Yes' : 'No'}`}
            >
              {flag.label}
            </span>
          ))}
        </div>
      </div>

      {/* ===== LOAN SUMMARY TABLE ===== */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Loan Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" role="table" aria-label="Loan summary">
            <thead>
              <tr className={`${styles.tableHeaderBg} ${rowBorder}`}>
                <th className={thCell}>Loan #</th>
                <th className={thCell}>Borrower</th>
                <th className={thCellRight}>Orig Bal</th>
                <th className={thCellRight}>Principal</th>
                <th className={thCellRight}>Interest</th>
                <th className={thCellRight}>Total UPB</th>
                <th className={thCellRight}>Rate</th>
                <th className={thCellRight}>Payment</th>
                <th className={thCellCenter}>Status</th>
              </tr>
            </thead>
            <tbody>
              {relationshipLoans.map(loan => {
                const upb = (loan.principal || 0) + (loan.interest || 0) + (loan.escrowBalance || 0) + (loan.otherBalance || 0);
                const isSelected = loan.mwLoanNo === selectedLoan;
                return (
                  <tr key={loan.mwLoanNo} className={`${rowBorder} ${isSelected ? styles.selectedBg : ''}`}>
                    <td className={`${tdCell} ${isSelected ? 'font-medium' : ''}`}>{loan.mwLoanNo}</td>
                    <td className={tdCell}>{loan.borrowerName}</td>
                    <td className={tdCellRight}>${formatNum(loan.origBalance)}</td>
                    <td className={tdCellRight}>${formatNum(loan.principal)}</td>
                    <td className={tdCellRight}>${formatNum(loan.interest)}</td>
                    <td className={`${tdCellRight} font-medium`}>${formatNum(upb)}</td>
                    <td className={tdCellRight}>{loan.intRate.toFixed(2)}%</td>
                    <td className={tdCellRight}>${formatNum(loan.pmt)}</td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        STATUS_COLORS[loan.status] || `${styles.inputBg} ${styles.textMuted}`
                      }`}>
                        {STATUS_LABELS[loan.status] || loan.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={`${styles.tableHeaderBg} border-t-2 ${styles.inputBorder} font-medium`}>
                <td className={tdCell} colSpan={2}>Totals ({relationshipLoans.length} loans)</td>
                <td className={tdCellRight}>${formatNum(totals.totalOrigBalance)}</td>
                <td className={tdCellRight}>${formatNum(totals.totalPrincipal)}</td>
                <td className={tdCellRight}>${formatNum(totals.totalInterest)}</td>
                <td className={`${tdCellRight} font-medium`}>${formatNum(totals.totalUPB)}</td>
                <td className={tdCellRight}>{totals.weightedRate.toFixed(2)}%</td>
                <td className={tdCellRight}>${formatNum(totals.totalPayment)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===== COLLATERAL SUMMARY ===== */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Collateral Summary</h3>
        {relationshipCollateral.length === 0 ? (
          <p className={`text-sm ${styles.textMuted}`}>No collateral linked to this relationship</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" role="table" aria-label="Collateral summary">
              <thead>
                <tr className={`${styles.tableHeaderBg} ${rowBorder}`}>
                  <th className={thCell}>Type</th>
                  <th className={thCell}>Description</th>
                  <th className={thCell}>Location</th>
                  <th className={thCellRight}>Appraised</th>
                  <th className={thCellRight}>BPO</th>
                  <th className={thCellCenter}>Lien Pos</th>
                  <th className={thCellRight}>Lien Amt</th>
                  <th className={thCellRight}>Taxes</th>
                  <th className={thCellRight}>Dlq Taxes</th>
                </tr>
              </thead>
              <tbody>
                {relationshipCollateral.map(c => (
                  <tr key={c.id} className={rowBorder}>
                    <td className={tdCell}>{c.collateralCode}</td>
                    <td className={tdCell}>{c.description}</td>
                    <td className={tdCell}>{c.city}, {c.state}</td>
                    <td className={tdCellRight}>${c.appraisedValue}</td>
                    <td className={tdCellRight}>${c.bpoValue}</td>
                    <td className={`px-2 py-1.5 text-center ${styles.textPrimary}`}>{c.sellerLienPosition}</td>
                    <td className={tdCellRight}>${c.sellerLienAmount}</td>
                    <td className={tdCellRight}>${c.taxes}</td>
                    <td className={`px-2 py-1.5 text-right ${
                      parseNumericString(c.delinquentTaxes) > 0 ? 'text-red-500 font-medium' : styles.textPrimary
                    }`}>
                      ${c.delinquentTaxes}
                    </td>
                  </tr>
                ))}
              </tbody>
              {relationshipCollateral.length > 1 && (
                <tfoot>
                  <tr className={`${styles.tableHeaderBg} border-t-2 ${styles.inputBorder} font-medium`}>
                    <td className={tdCell} colSpan={3}>Totals ({relationshipCollateral.length} items)</td>
                    <td className={tdCellRight}>${formatNum(collateralTotals.appraised)}</td>
                    <td className={tdCellRight}>${formatNum(collateralTotals.bpo)}</td>
                    <td></td>
                    <td className={tdCellRight}>${formatNum(collateralTotals.lienAmount)}</td>
                    <td className={tdCellRight}>${formatNum(collateralTotals.taxes)}</td>
                    <td className={`px-2 py-1.5 text-right ${styles.textPrimary}`}>
                      ${formatNum(collateralTotals.delinquentTaxes)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* ===== BORROWER SUMMARY ===== */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Borrower Summary</h3>
        {relationshipBorrowers.length === 0 ? (
          <p className={`text-sm ${styles.textMuted}`}>No borrowers in this relationship</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" role="table" aria-label="Borrower summary">
              <thead>
                <tr className={`${styles.tableHeaderBg} ${rowBorder}`}>
                  <th className={thCell}>Name</th>
                  <th className={thCellCenter}>Type</th>
                  <th className={thCell}>Location</th>
                  <th className={thCellCenter}>Credit Score</th>
                  <th className={thCellCenter}>Score Date</th>
                  <th className={thCellCenter}>BK Status</th>
                  <th className={thCell}>SSN/EIN</th>
                </tr>
              </thead>
              <tbody>
                {relationshipBorrowers.map(b => (
                  <tr key={b.id} className={rowBorder}>
                    <td className={tdCell}>{b.name}</td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        b.type === 'Guarantor' ? 'bg-purple-600 text-white' : 'bg-sky-600 text-white'
                      }`}>
                        {b.type}
                      </span>
                    </td>
                    <td className={tdCell}>{b.city}, {b.state}</td>
                    <td className={`px-2 py-1.5 text-center font-medium ${
                      parseInt(b.creditScore) >= 720 ? 'text-green-500' :
                      parseInt(b.creditScore) >= 680 ? 'text-yellow-500' :
                      parseInt(b.creditScore) > 0 ? 'text-red-500' :
                      styles.textPrimary
                    }`}>
                      {b.creditScore || '-'}
                    </td>
                    <td className={`px-2 py-1.5 text-center ${styles.textPrimary}`}>{b.creditScoreDate || '-'}</td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        b.bkStatus && b.bkStatus !== 'none' && b.bkStatus !== 'None'
                          ? 'bg-red-600 text-white'
                          : `${styles.inputBg} ${styles.textMuted}`
                      }`}>
                        {b.bkStatus || 'None'}
                      </span>
                    </td>
                    <td className={`${tdCell} font-mono`}>{maskSsnEin(b.ssnEin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== NARRATIVE SECTIONS ===== */}

      {/* Relationship Overview */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Relationship Overview</h3>
        <textarea
          ref={relationshipRef}
          value={relationshipOverview}
          onChange={(e) => {
            setRelationshipOverview(e.target.value);
            autoResize(e.target);
          }}
          aria-label="Relationship Overview"
          placeholder="Enter relationship overview details..."
          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} resize-none overflow-hidden`}
          style={{ minHeight: '120px' }}
        />
      </div>

      {/* Collateral Overview */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Collateral Overview</h3>
        <textarea
          ref={collateralRef}
          value={collateralOverview}
          onChange={(e) => {
            setCollateralOverview(e.target.value);
            autoResize(e.target);
          }}
          aria-label="Collateral Overview"
          placeholder="Enter collateral overview details..."
          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} resize-none overflow-hidden`}
          style={{ minHeight: '120px' }}
        />
      </div>

      {/* Bid Conditions */}
      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Bid Conditions</h3>
        <input
          type="text"
          value={bidConditions}
          onChange={(e) => setBidConditions(e.target.value)}
          aria-label="Bid Conditions"
          placeholder="Enter bid conditions..."
          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
        />
      </div>
    </div>
  );
});
OverviewTab.displayName = 'OverviewTab';
