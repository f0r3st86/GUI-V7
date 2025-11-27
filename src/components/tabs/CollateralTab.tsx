// CollateralTab component - displays collateral information
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useTheme, useLoan } from '../../context';
import { US_STATES } from '../../data';
import { calculatePerSqft } from '../../utils';
import { DeleteModal } from '../ui';
import type { Collateral } from '../../types';

export const CollateralTab: React.FC = () => {
  const { styles } = useTheme();
  const {
    selectedLoan,
    collateralList,
    setCollateralList,
    selectedCollateralId,
    setSelectedCollateralId,
    selectedCollateral,
    collateralLoanRelationships,
    setCollateralLoanRelationships,
    deleteCollateralConfirmation,
    setDeleteCollateralConfirmation,
    getSortedLoans,
    getNextCollateralId
  } = useLoan();

  // Add new collateral
  const addNewCollateral = () => {
    const newId = getNextCollateralId();
    const newCollateral: Collateral = {
      id: newId,
      loanNo: selectedLoan,
      collateralCode: '',
      description: '',
      address1: '',
      city: '',
      state: '',
      zip: '',
      county: '',
      parcelId: '',
      taxes: '',
      delinquentTaxes: '',
      taxAssessedValue: '',
      taxMarketValue: '',
      sellerLienPosition: '',
      sellerLienAmount: '',
      titleLienPosition: '',
      titleLienAmount: '',
      listPrice: '',
      daysOnMarket: '',
      appraisedValue: '',
      appraisedDate: '',
      ourValue: '',
      ourValueDate: '',
      bpoValue: '',
      bpoDate: '',
      sqft: '',
      acres: '',
      yearBuilt: '',
      units: ''
    };
    setCollateralList(prev => [...prev, newCollateral]);
    // Initialize relationships for this collateral
    setCollateralLoanRelationships(prev => ({
      ...prev,
      [newId]: { [selectedLoan]: true }
    }));
    setSelectedCollateralId(newId);
  };

  // Handle collateral field changes
  const handleCollateralFieldChange = (field: keyof Collateral, value: string) => {
    setCollateralList(prev =>
      prev.map(collateral =>
        collateral.id === selectedCollateralId
          ? { ...collateral, [field]: value }
          : collateral
      )
    );
  };

  // Toggle collateral-loan relationship
  const toggleCollateralLoanRelationship = (loanNo: string) => {
    setCollateralLoanRelationships(prev => ({
      ...prev,
      [selectedCollateralId]: {
        ...(prev[selectedCollateralId] || {}),
        [loanNo]: !(prev[selectedCollateralId]?.[loanNo])
      }
    }));
  };

  // Show delete confirmation
  const showDeleteConfirmation = (id: number, description: string) => {
    setDeleteCollateralConfirmation({ show: true, collateralId: id, collateralDescription: description });
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteCollateralConfirmation.collateralId !== null) {
      setCollateralList(prev =>
        prev.filter(c => c.id !== deleteCollateralConfirmation.collateralId)
      );
      // Select another collateral
      const remaining = collateralList.filter(c => c.id !== deleteCollateralConfirmation.collateralId);
      if (remaining.length > 0) {
        setSelectedCollateralId(remaining[0].id);
      }
    }
    setDeleteCollateralConfirmation({ show: false, collateralId: null, collateralDescription: '' });
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteCollateralConfirmation({ show: false, collateralId: null, collateralDescription: '' });
  };

  return (
    <div className="p-4">
      {/* Top Section - Collateral List */}
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

        {/* Collateral Table */}
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
              {collateralList.map((collateral) => (
                <tr
                  key={collateral.id}
                  onClick={() => setSelectedCollateralId(collateral.id)}
                  className={`${styles.borderColor} border-b cursor-pointer transition-colors ${
                    selectedCollateralId === collateral.id ? styles.activeTabBg : styles.hoverText
                  }`}
                >
                  <td className={`px-2 py-2 ${styles.textPrimary} font-medium`}>{collateral.description || '(New)'}</td>
                  <td className={`px-2 py-2 ${styles.textSecondary}`}>{collateral.address1}</td>
                  <td className={`px-2 py-2 ${styles.textSecondary}`}>
                    {collateral.city}{collateral.city && collateral.state ? ', ' : ''}{collateral.state}
                  </td>
                  <td className={`px-2 py-2 text-right ${styles.textGreen}`}>${collateral.ourValue}</td>
                  <td className={`px-2 py-2 text-right ${styles.textSecondary}`}>${collateral.appraisedValue}</td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteConfirmation(collateral.id, collateral.description);
                      }}
                      className={`${styles.textMuted} hover:text-red-500 transition-colors`}
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

      {/* Bottom Section - Selected Collateral Details */}
      {selectedCollateral && (
        <div className="grid grid-cols-3 gap-4">
          {/* Column 1 - Property Info */}
          <div className="space-y-3">
            <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
              <h4 className={`text-xs ${styles.textMuted} font-medium mb-3`}>Property Information</h4>
              <div className="space-y-2">
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Description:</label>
                  <input
                    type="text"
                    value={selectedCollateral.description}
                    onChange={(e) => handleCollateralFieldChange('description', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Address:</label>
                  <input
                    type="text"
                    value={selectedCollateral.address1}
                    onChange={(e) => handleCollateralFieldChange('address1', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>City:</label>
                    <input
                      type="text"
                      value={selectedCollateral.city}
                      onChange={(e) => handleCollateralFieldChange('city', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>State:</label>
                    <select
                      value={selectedCollateral.state}
                      onChange={(e) => handleCollateralFieldChange('state', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    >
                      {US_STATES.map(state => (
                        <option key={state.code} value={state.code}>{state.code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Zip:</label>
                    <input
                      type="text"
                      value={selectedCollateral.zip}
                      onChange={(e) => handleCollateralFieldChange('zip', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>County:</label>
                    <input
                      type="text"
                      value={selectedCollateral.county}
                      onChange={(e) => handleCollateralFieldChange('county', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Parcel ID:</label>
                    <input
                      type="text"
                      value={selectedCollateral.parcelId}
                      onChange={(e) => handleCollateralFieldChange('parcelId', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>SqFt:</label>
                    <input
                      type="text"
                      value={selectedCollateral.sqft}
                      onChange={(e) => handleCollateralFieldChange('sqft', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Acres:</label>
                    <input
                      type="text"
                      value={selectedCollateral.acres}
                      onChange={(e) => handleCollateralFieldChange('acres', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Year Built:</label>
                    <input
                      type="text"
                      value={selectedCollateral.yearBuilt}
                      onChange={(e) => handleCollateralFieldChange('yearBuilt', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Units:</label>
                    <input
                      type="text"
                      value={selectedCollateral.units}
                      onChange={(e) => handleCollateralFieldChange('units', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 - Values & Calculations */}
          <div className="space-y-3">
            <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
              <h4 className={`text-xs ${styles.textMuted} font-medium mb-3`}>Values</h4>
              <div className="grid grid-cols-4 gap-3">
                {/* Headers */}
                <div className={`text-xs ${styles.textMuted} font-medium`}>List Price</div>
                <div className={`text-xs ${styles.textMuted} font-medium`}>Appraised</div>
                <div className={`text-xs ${styles.textMuted} font-medium`}>Our Value</div>
                <div className={`text-xs ${styles.textMuted} font-medium`}>BPO</div>

                {/* Value Row */}
                <div>
                  <input
                    type="text"
                    value={selectedCollateral.listPrice}
                    onChange={(e) => handleCollateralFieldChange('listPrice', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={selectedCollateral.appraisedValue}
                    onChange={(e) => handleCollateralFieldChange('appraisedValue', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={selectedCollateral.ourValue}
                    onChange={(e) => handleCollateralFieldChange('ourValue', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textGreen} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={selectedCollateral.bpoValue}
                    onChange={(e) => handleCollateralFieldChange('bpoValue', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>

                {/* $/SF Row - Calculated */}
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
                  <input
                    type="text"
                    value={selectedCollateral.listPrice && selectedCollateral.sqft ?
                      `$${calculatePerSqft(selectedCollateral.listPrice, selectedCollateral.sqft)}` : '$0'}
                    className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                    readOnly
                  />
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
                  <input
                    type="text"
                    value={selectedCollateral.appraisedValue && selectedCollateral.sqft ?
                      `$${calculatePerSqft(selectedCollateral.appraisedValue, selectedCollateral.sqft)}` : '$0'}
                    className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                    readOnly
                  />
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
                  <input
                    type="text"
                    value={selectedCollateral.ourValue && selectedCollateral.sqft ?
                      `$${calculatePerSqft(selectedCollateral.ourValue, selectedCollateral.sqft)}` : '$0'}
                    className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                    readOnly
                  />
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
                  <input
                    type="text"
                    value={selectedCollateral.bpoValue && selectedCollateral.sqft ?
                      `$${calculatePerSqft(selectedCollateral.bpoValue, selectedCollateral.sqft)}` : '$0'}
                    className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 3 - Related Loans */}
          <div className="space-y-3">
            <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
              <h4 className={`text-xs ${styles.textMuted} font-medium mb-3`}>Related Loans</h4>
              <p className={`text-xs ${styles.textMuted} mb-3`}>
                Select which loans this collateral secures:
              </p>

              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {getSortedLoans().map((loan) => (
                  <div
                    key={loan.mwLoanNo}
                    className={`flex items-center p-2 rounded ${styles.inputBorder} border transition-colors ${
                      collateralLoanRelationships[selectedCollateralId]?.[loan.mwLoanNo] ? styles.activeTabBg : styles.inactiveTabBg
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`collateral-loan-${loan.mwLoanNo}`}
                      checked={collateralLoanRelationships[selectedCollateralId]?.[loan.mwLoanNo] || false}
                      onChange={() => toggleCollateralLoanRelationship(loan.mwLoanNo)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`collateral-loan-${loan.mwLoanNo}`}
                      className="flex-1 cursor-pointer flex items-center justify-between"
                    >
                      <div className={`font-medium ${styles.textPrimary} text-xs`}>
                        #{loan.mwLoanNo}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`${styles.textGreen} font-medium text-xs`}>
                          ${loan.principal.toLocaleString()}
                        </span>
                        <span className={`${styles.textMuted} text-xs`}>
                          @ {loan.intRate}%
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className={`mt-4 pt-3 ${styles.borderColor} border-t`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${styles.textMuted}`}>Securing Loans:</span>
                  <span className={`text-xs font-medium ${styles.textPrimary}`}>
                    {Object.values(collateralLoanRelationships[selectedCollateralId] || {}).filter(Boolean).length} of {getSortedLoans().length}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${styles.textMuted}`}>Total Secured:</span>
                  <span className={`text-xs font-medium ${styles.textGreen}`}>
                    ${getSortedLoans()
                      .filter(loan => collateralLoanRelationships[selectedCollateralId]?.[loan.mwLoanNo])
                      .reduce((sum, loan) => sum + loan.principal, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* SQL Connection Info */}
            <div className={`${styles.alertBg} ${styles.alertBorder} rounded-lg border p-3`}>
              <div className="flex items-start">
                <AlertCircle size={16} className={`${styles.alertText} mr-2 mt-0.5`} />
                <div className={`text-xs ${styles.alertText}`}>
                  <p className="font-medium">SQL Connection Points:</p>
                  <p className="mt-1">SELECT * FROM collateral WHERE loan_id = '{selectedLoan}'</p>
                  <p>INSERT INTO collateral (loan_id, ...) VALUES (...)</p>
                  <p>UPDATE collateral SET field = value WHERE id = {selectedCollateralId}</p>
                  <p>DELETE FROM collateral WHERE id = collateral_id</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={deleteCollateralConfirmation.show}
        itemName={deleteCollateralConfirmation.collateralDescription}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};
