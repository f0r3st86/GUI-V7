// Top section: Collateral list table with add/delete
import React from 'react';
import type { Collateral, ThemeStyles } from '../../../../types';

interface CollateralTableProps {
  styles: ThemeStyles;
  selectedLoan: string;
  collateralList: Collateral[];
  selectedCollateralId: number;
  setSelectedCollateralId: (id: number) => void;
  addNewCollateral: () => void;
  showDeleteConfirmation: (id: number, description: string) => void;
}

export const CollateralTable: React.FC<CollateralTableProps> = ({
  styles,
  selectedLoan,
  collateralList,
  selectedCollateralId,
  setSelectedCollateralId,
  addNewCollateral,
  showDeleteConfirmation,
}) => (
  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className={`font-medium ${styles.textPrimary}`}>Collateral Items</h3>
        <p className={`text-xs ${styles.textMuted} mt-0.5`}>Loan: #{selectedLoan}</p>
      </div>
      <button
        onClick={addNewCollateral}
        className={`px-3 py-1.5 ${styles.inputBg} ${styles.inputBorder} border ${styles.textPrimary} rounded transition-colors text-xs ${styles.buttonHover}`}
      >
        + Add New
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className={`${styles.borderColor} border-b`}>
            <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Description</th>
            <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Address</th>
            <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>City, State</th>
            <th className={`text-right px-2 py-2 ${styles.textMuted} font-medium`}>Our Value</th>
            <th className={`text-right px-2 py-2 ${styles.textMuted} font-medium`}>Appraised</th>
            <th className={`text-center px-2 py-2 ${styles.textMuted} font-medium`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {collateralList.map((item) => (
            <tr
              key={item.mwPropertyNo}
              onClick={() => setSelectedCollateralId(item.mwPropertyNo)}
              className={`${styles.borderColor} border-b cursor-pointer transition-colors ${
                selectedCollateralId === item.mwPropertyNo ? styles.activeTabBg : styles.hoverText
              }`}
            >
              <td className={`px-2 py-2 ${styles.textPrimary} font-medium`}>{item.description || '(New)'}</td>
              <td className={`px-2 py-2 ${styles.textSecondary}`}>{item.address1}</td>
              <td className={`px-2 py-2 ${styles.textSecondary}`}>
                {item.city}{item.city && item.state ? ', ' : ''}{item.state}
              </td>
              <td className={`px-2 py-2 text-right ${styles.textGreen}`}>${item.ourValue}</td>
              <td className={`px-2 py-2 text-right ${styles.textSecondary}`}>${item.appraisedValue}</td>
              <td className="px-2 py-2 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    showDeleteConfirmation(item.mwPropertyNo, item.description);
                  }}
                  className={`${styles.textMuted} ${styles.hoverDanger} transition-colors`}
                  disabled={collateralList.length === 1}
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
