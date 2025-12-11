// BorrowerTab component - displays borrower/guarantor information and loan relationships
import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTheme, useLoan } from '../../context';
import {
  maskSsnEin,
  validatePhone,
  validateZip,
  validateSSN,
  validateEIN,
  validateDateFormat,
  validateCreditScore
} from '../../utils';
import { DeleteModal } from '../ui';
import type { Borrower } from '../../types';

export const BorrowerTab: React.FC = () => {
  const { styles } = useTheme();
  const {
    currentRelationship,
    selectedBorrowerId,
    setSelectedBorrowerId,
    selectedBorrower,
    setBorrowersList,
    deleteConfirmation,
    setDeleteConfirmation,
    getSortedLoans,
    getRelationshipBorrowers,
    getCurrentBorrowerLoanRelationships,
    getNextBorrowerId
  } = useLoan();

  // Validation state (track invalid inputs)
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Helper: Get input border style (red if invalid)
  const getInputStyle = (field: string) => {
    if (validationErrors[field]) {
      return 'border-red-500';
    }
    return `${styles.inputBorder}`;
  };

  // Helper: Handle phone input with validation
  const handlePhoneChange = (value: string) => {
    const isValid = validatePhone(value);
    setValidationErrors(prev => ({ ...prev, phone: !isValid }));
    handleBorrowerFieldChange('phone', value);
  };

  // Helper: Handle zip code with validation
  const handleZipChange = (value: string) => {
    const isValid = validateZip(value);
    setValidationErrors(prev => ({ ...prev, zip: !isValid }));
    handleBorrowerFieldChange('zip', value);
  };

  // Helper: Handle SSN/EIN input with validation
  const handleSsnEinChange = (value: string) => {
    // Try both SSN and EIN validation
    const isValidSSN = validateSSN(value);
    const isValidEIN = validateEIN(value);
    const isValid = isValidSSN || isValidEIN || value === ''; // Allow empty
    setValidationErrors(prev => ({ ...prev, ssnEin: !isValid }));
    handleBorrowerFieldChange('ssnEin', value);
  };

  // Helper: Handle credit score with validation
  const handleCreditScoreChange = (value: string) => {
    const isValid = validateCreditScore(value);
    setValidationErrors(prev => ({ ...prev, creditScore: !isValid }));
    handleBorrowerFieldChange('creditScore', value);
  };

  // Helper: Handle date input with validation
  const handleDateChange = (field: keyof Borrower, value: string) => {
    const isValid = validateDateFormat(value);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
    handleBorrowerFieldChange(field, value);
  };

  // Add new borrower
  const addNewBorrower = () => {
    const newId = getNextBorrowerId();
    const newBorrower: Borrower = {
      id: newId,
      relationship: currentRelationship,
      name: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      dob: '',
      ssnEin: '',
      creditScore: '',
      creditScoreDate: '',
      bkStatus: 'none',
      bkChapter: '',
      bkCourtCase: '',
      bkCourtLocation: '',
      bkAssets: 'No Assets',
      type: 'Borrower',
      loanRelationships: {}
    };
    setBorrowersList(prev => [...prev, newBorrower]);
    setSelectedBorrowerId(newId);
  };

  // Handle borrower field changes
  const handleBorrowerFieldChange = (field: keyof Borrower, value: string) => {
    setBorrowersList(prev =>
      prev.map(borrower =>
        borrower.id === selectedBorrowerId
          ? { ...borrower, [field]: value }
          : borrower
      )
    );
  };

  // Show delete confirmation
  const showDeleteConfirmation = (id: number, name: string) => {
    setDeleteConfirmation({ show: true, borrowerId: id, borrowerName: name });
  };

  // Confirm delete
  // FIXED: Use updater function to avoid stale state race condition
  const confirmDelete = () => {
    if (deleteConfirmation.borrowerId !== null) {
      let remainingBorrower: number | null = null;

      // Update list and capture remaining borrower in same operation
      setBorrowersList(prev => {
        const updated = prev.filter(b => b.id !== deleteConfirmation.borrowerId);
        // Find next borrower to select from UPDATED list (not stale state)
        const remaining = updated.filter(b => b.relationship === currentRelationship);
        if (remaining.length > 0) {
          remainingBorrower = remaining[0].id;
        }
        return updated;
      });

      // Select the remaining borrower if found
      if (remainingBorrower !== null) {
        setSelectedBorrowerId(remainingBorrower);
      }
    }
    setDeleteConfirmation({ show: false, borrowerId: null, borrowerName: '' });
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, borrowerId: null, borrowerName: '' });
  };

  // Toggle loan relationship
  const toggleLoanRelationship = (loanNo: string) => {
    setBorrowersList(prev =>
      prev.map(borrower => {
        if (borrower.id !== selectedBorrowerId) return borrower;
        const currentRels = borrower.loanRelationships || {};
        const currentLoanRel = currentRels[loanNo] || { selected: false, role: 'Borrower' };
        return {
          ...borrower,
          loanRelationships: {
            ...currentRels,
            [loanNo]: {
              ...currentLoanRel,
              selected: !currentLoanRel.selected
            }
          }
        };
      })
    );
  };

  // Change loan role
  const changeLoanRole = (loanNo: string, role: string) => {
    setBorrowersList(prev =>
      prev.map(borrower => {
        if (borrower.id !== selectedBorrowerId) return borrower;
        const currentRels = borrower.loanRelationships || {};
        const currentLoanRel = currentRels[loanNo] || { selected: false, role: 'Borrower' };
        return {
          ...borrower,
          loanRelationships: {
            ...currentRels,
            [loanNo]: {
              ...currentLoanRel,
              role
            }
          }
        };
      })
    );
  };

  const relationshipBorrowers = getRelationshipBorrowers();

  return (
    <div className="p-4">
      {/* Top Section - Borrowers/Guarantors Table */}
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

        {/* Borrowers Table */}
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
                      borrower.bkStatus === 'open' ? 'bg-red-500/20 text-red-400' :
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
                      className={`${styles.textMuted} hover:text-red-500 transition-colors`}
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

      {/* Bottom Section - Selected Borrower Details */}
      {selectedBorrower && (
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - Borrower Information */}
          <div className="space-y-4">
            <h3 className={`font-medium ${styles.textPrimary} mb-3`}>
              Borrower/Guarantor Details
            </h3>

            {/* Name */}
            <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Name:</label>
              <input
                type="text"
                value={selectedBorrower.name}
                onChange={(e) => handleBorrowerFieldChange('name', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
              />
            </div>

            {/* Contact Information */}
            <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
              <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Contact Information</h4>
              <div className="space-y-2">
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Phone:</label>
                  <input
                    type="text"
                    value={selectedBorrower.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(555) 555-5555"
                    className={`${styles.inputBg} ${getInputStyle('phone')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 1:</label>
                  <input
                    type="text"
                    value={selectedBorrower.address1}
                    onChange={(e) => handleBorrowerFieldChange('address1', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 2:</label>
                  <input
                    type="text"
                    value={selectedBorrower.address2}
                    onChange={(e) => handleBorrowerFieldChange('address2', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-3">
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>City:</label>
                    <input
                      type="text"
                      value={selectedBorrower.city}
                      onChange={(e) => handleBorrowerFieldChange('city', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>State:</label>
                    <input
                      type="text"
                      value={selectedBorrower.state}
                      onChange={(e) => handleBorrowerFieldChange('state', e.target.value)}
                      maxLength={2}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Zip:</label>
                    <input
                      type="text"
                      value={selectedBorrower.zip}
                      onChange={(e) => handleZipChange(e.target.value)}
                      placeholder="12345"
                      maxLength={10}
                      className={`${styles.inputBg} ${getInputStyle('zip')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Identity Verification */}
            <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
              <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Identity Verification</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>SSN/EIN:</label>
                  <input
                    type="text"
                    value={selectedBorrower.ssnEin}
                    onChange={(e) => handleSsnEinChange(e.target.value)}
                    placeholder="XXX-XX-XXXX or XX-XXXXXXX"
                    className={`${styles.inputBg} ${getInputStyle('ssnEin')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Date of Birth:</label>
                  <input
                    type="text"
                    value={selectedBorrower.dob}
                    onChange={(e) => handleDateChange('dob', e.target.value)}
                    placeholder="MM/DD/YY"
                    className={`${styles.inputBg} ${getInputStyle('dob')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
              </div>
            </div>

            {/* Credit Information */}
            <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
              <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Credit Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Credit Score:</label>
                  <input
                    type="text"
                    value={selectedBorrower.creditScore}
                    onChange={(e) => handleCreditScoreChange(e.target.value)}
                    placeholder="300-850"
                    maxLength={3}
                    className={`${styles.inputBg} ${getInputStyle('creditScore')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Credit Score Date:</label>
                  <input
                    type="text"
                    value={selectedBorrower.creditScoreDate}
                    onChange={(e) => handleDateChange('creditScoreDate', e.target.value)}
                    placeholder="MM/DD/YY"
                    className={`${styles.inputBg} ${getInputStyle('creditScoreDate')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
              </div>
            </div>

            {/* Bankruptcy Information */}
            <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
              <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Bankruptcy Information</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Status:</label>
                    <select
                      value={selectedBorrower.bkStatus}
                      onChange={(e) => handleBorrowerFieldChange('bkStatus', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    >
                      <option value="none">None</option>
                      <option value="open">Open</option>
                      <option value="dismissed">Dismissed</option>
                      <option value="discharged">Discharged</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Chapter:</label>
                    <select
                      value={selectedBorrower.bkChapter}
                      onChange={(e) => handleBorrowerFieldChange('bkChapter', e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      disabled={selectedBorrower.bkStatus === 'none'}
                    >
                      <option value="">Select Chapter</option>
                      <option value="Chapter 7">Chapter 7</option>
                      <option value="Chapter 11">Chapter 11</option>
                      <option value="Chapter 12">Chapter 12</option>
                      <option value="Chapter 13">Chapter 13</option>
                      <option value="Chapter 15">Chapter 15</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Court Case #:</label>
                  <input
                    type="text"
                    value={selectedBorrower.bkCourtCase}
                    onChange={(e) => handleBorrowerFieldChange('bkCourtCase', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    disabled={selectedBorrower.bkStatus === 'none'}
                  />
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Court Location:</label>
                  <input
                    type="text"
                    value={selectedBorrower.bkCourtLocation}
                    onChange={(e) => handleBorrowerFieldChange('bkCourtLocation', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    disabled={selectedBorrower.bkStatus === 'none'}
                  />
                </div>
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Assets:</label>
                  <select
                    value={selectedBorrower.bkAssets}
                    onChange={(e) => handleBorrowerFieldChange('bkAssets', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    disabled={selectedBorrower.bkStatus === 'none'}
                  >
                    <option value="No Assets">No Assets</option>
                    <option value="Assets">Assets</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Loan Relationships */}
          <div className="space-y-4">
            <h3 className={`font-medium ${styles.textPrimary} mb-3`}>Related Loans</h3>

            <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
              <p className={`text-xs ${styles.textMuted} mb-3`}>
                Select loans and specify role for this borrower:
              </p>

              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {getSortedLoans().map((loan) => {
                  const borrowerLoanRels = getCurrentBorrowerLoanRelationships();
                  const loanRel = borrowerLoanRels[loan.mwLoanNo] || { selected: false, role: 'Borrower' };
                  return (
                    <div
                      key={loan.mwLoanNo}
                      className={`flex items-center p-2 rounded ${styles.inputBorder} border transition-colors ${
                        loanRel.selected ? styles.activeTabBg : styles.inactiveTabBg
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`loan-${loan.mwLoanNo}`}
                        checked={loanRel.selected || false}
                        onChange={() => toggleLoanRelationship(loan.mwLoanNo)}
                        className="mr-2"
                      />
                      <label
                        htmlFor={`loan-${loan.mwLoanNo}`}
                        className="flex-shrink-0 cursor-pointer"
                      >
                        <div className={`font-medium ${styles.textPrimary} text-xs`}>
                          #{loan.mwLoanNo}
                        </div>
                      </label>
                      <div className="flex-1 flex items-center justify-between ml-3">
                        <div className="flex items-center space-x-2">
                          <span className={`${styles.textGreen} font-medium text-xs`}>
                            ${loan.principal.toLocaleString()}
                          </span>
                          <span className={`${styles.textMuted} text-xs`}>
                            @ {loan.intRate}%
                          </span>
                        </div>
                        <select
                          value={loanRel.role}
                          onChange={(e) => changeLoanRole(loan.mwLoanNo, e.target.value)}
                          disabled={!loanRel.selected}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-0.5 text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="Borrower">Borrower</option>
                          <option value="Guarantor">Guarantor</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className={`mt-4 pt-3 ${styles.borderColor} border-t`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${styles.textMuted}`}>Selected Loans:</span>
                  <span className={`text-xs font-medium ${styles.textPrimary}`}>
                    {Object.values(getCurrentBorrowerLoanRelationships()).filter(r => r?.selected).length} of {getSortedLoans().length}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${styles.textMuted}`}>Total Exposure:</span>
                  <span className={`text-xs font-medium ${styles.textGreen}`}>
                    ${getSortedLoans()
                      .filter(loan => getCurrentBorrowerLoanRelationships()[loan.mwLoanNo]?.selected)
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
                  <p className="mt-1">SELECT * FROM borrowers WHERE relationship = '{currentRelationship}'</p>
                  <p>INSERT INTO borrowers (relationship, ...) VALUES ('{currentRelationship}', ...)</p>
                  <p>UPDATE borrowers SET field = value WHERE id = {selectedBorrowerId}</p>
                  <p>DELETE FROM borrowers WHERE id = borrower_id</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={deleteConfirmation.show}
        itemName={deleteConfirmation.borrowerName}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};
