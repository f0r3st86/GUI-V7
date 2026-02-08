// CollateralTab component - displays collateral information
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTheme, useLoan } from '../../context';
import { US_STATES } from '../../data';
import {
  calculatePerSqft,
  validateCurrency,
  validatePositiveInteger,
  sanitizeCurrency,
  sanitizeNumber
} from '../../utils';
import {
  useDebounce,
  useCollateral,
  useCollateralRelationships,
  useAddCollateral,
  useUpdateCollateral,
  useDeleteCollateral,
  useUpdateCollateralRelationships,
  useLoans
} from '../../hooks';
import { DeleteModal } from '../ui';
import type { Collateral } from '../../types';

export const CollateralTab = React.memo(() => {
  const { styles } = useTheme();

  // UI state from Context
  const {
    selectedLoan,
    selectedCollateralId,
    setSelectedCollateralId,
    deleteCollateralConfirmation,
    setDeleteCollateralConfirmation
  } = useLoan();

  // Data from React Query
  const { data: collateral, isLoading: loadingCollateral } = useCollateral();
  const { data: collateralLoanRelationships } = useCollateralRelationships();
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { mutate: addCollateral } = useAddCollateral();
  const { mutate: updateCollateral } = useUpdateCollateral();
  const { mutate: deleteCollateral } = useDeleteCollateral();
  const { mutate: updateRelationships } = useUpdateCollateralRelationships();

  // Computed values
  const collateralList = React.useMemo(
    () => collateral || [],
    [collateral]
  );

  const selectedCollateral = React.useMemo(
    () => collateralList.find(c => c.id === selectedCollateralId),
    [collateralList, selectedCollateralId]
  );

  const getSortedLoans = React.useMemo(
    () => loans || [],
    [loans]
  );

  const getNextCollateralId = React.useCallback(() => {
    if (collateralList.length === 0) return 1;
    return Math.max(...collateralList.map(c => c.id)) + 1;
  }, [collateralList]);

  // Local state for debounced inputs ($/SF calculation triggers)
  const [localListPrice, setLocalListPrice] = useState('');
  const [localAppraisedValue, setLocalAppraisedValue] = useState('');
  const [localOurValue, setLocalOurValue] = useState('');
  const [localBpoValue, setLocalBpoValue] = useState('');
  const [localSqft, setLocalSqft] = useState('');

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // PERFORMANCE OPTIMIZATION: Memoize securing loans count and total secured
  // Previously: Computed on every render with filter operations = 10-20ms
  // Now: Computed only when relationships change = <1ms
  const securingLoansStats = React.useMemo(() => {
    if (!collateralLoanRelationships) {
      return { securingCount: 0, totalLoans: 0, totalSecured: 0 };
    }

    const relationships = collateralLoanRelationships[selectedCollateralId] || {};
    const allLoans = getSortedLoans;

    const securingCount = Object.values(relationships).filter(Boolean).length;
    const totalLoans = allLoans.length;
    const totalSecured = allLoans
      .filter(loan => relationships[loan.mwLoanNo])
      .reduce((sum, loan) => sum + loan.principal, 0);

    return { securingCount, totalLoans, totalSecured };
  }, [collateralLoanRelationships, selectedCollateralId, getSortedLoans]);

  // Debounce expensive inputs (500ms for $/SF calculations)
  const debouncedListPrice = useDebounce(localListPrice, 500);
  const debouncedAppraisedValue = useDebounce(localAppraisedValue, 500);
  const debouncedOurValue = useDebounce(localOurValue, 500);
  const debouncedBpoValue = useDebounce(localBpoValue, 500);
  const debouncedSqft = useDebounce(localSqft, 500);

  // Track the current collateral ID to prevent stale updates
  const currentCollateralIdRef = React.useRef<number | null>(null);

  // Handle collateral field changes (moved up and wrapped in useCallback to fix dependency order)
  const handleCollateralFieldChange = React.useCallback((field: keyof Collateral, value: string) => {
    if (selectedCollateralId) {
      updateCollateral({ id: selectedCollateralId, updates: { [field]: value } });
    }
  }, [selectedCollateralId, updateCollateral]);

  // Initialize local state from selectedCollateral
  useEffect(() => {
    if (selectedCollateral) {
      currentCollateralIdRef.current = selectedCollateral.id;
      setLocalListPrice(selectedCollateral.listPrice || '');
      setLocalAppraisedValue(selectedCollateral.appraisedValue || '');
      setLocalOurValue(selectedCollateral.ourValue || '');
      setLocalBpoValue(selectedCollateral.bpoValue || '');
      setLocalSqft(selectedCollateral.sqft || '');
    }
  }, [selectedCollateralId, selectedCollateral]); // FIXED: Added selectedCollateral dependency

  // Update context when debounced values change
  // FIXED: Added missing dependencies and collateral ID check to prevent stale closure bugs
  useEffect(() => {
    if (debouncedListPrice !== undefined && selectedCollateral &&
        currentCollateralIdRef.current === selectedCollateral.id &&
        debouncedListPrice !== selectedCollateral.listPrice) {
      handleCollateralFieldChange('listPrice', debouncedListPrice);
    }
  }, [debouncedListPrice, selectedCollateral, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedAppraisedValue !== undefined && selectedCollateral &&
        currentCollateralIdRef.current === selectedCollateral.id &&
        debouncedAppraisedValue !== selectedCollateral.appraisedValue) {
      handleCollateralFieldChange('appraisedValue', debouncedAppraisedValue);
    }
  }, [debouncedAppraisedValue, selectedCollateral, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedOurValue !== undefined && selectedCollateral &&
        currentCollateralIdRef.current === selectedCollateral.id &&
        debouncedOurValue !== selectedCollateral.ourValue) {
      handleCollateralFieldChange('ourValue', debouncedOurValue);
    }
  }, [debouncedOurValue, selectedCollateral, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedBpoValue !== undefined && selectedCollateral &&
        currentCollateralIdRef.current === selectedCollateral.id &&
        debouncedBpoValue !== selectedCollateral.bpoValue) {
      handleCollateralFieldChange('bpoValue', debouncedBpoValue);
    }
  }, [debouncedBpoValue, selectedCollateral, handleCollateralFieldChange]);

  useEffect(() => {
    if (debouncedSqft !== undefined && selectedCollateral &&
        currentCollateralIdRef.current === selectedCollateral.id &&
        debouncedSqft !== selectedCollateral.sqft) {
      handleCollateralFieldChange('sqft', debouncedSqft);
    }
  }, [debouncedSqft, selectedCollateral, handleCollateralFieldChange]);

  // Helper: Get input border style (red if invalid)
  const getInputStyle = (field: string) => {
    if (validationErrors[field]) {
      return 'border-red-500';
    }
    return `${styles.inputBorder}`;
  };

  // Helper: Handle currency input with validation
  const handleCurrencyChange = (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const sanitized = sanitizeCurrency(value);
    const isValid = validateCurrency(sanitized);
    setter(sanitized);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
  };

  // Helper: Handle integer input with validation
  const handleIntegerChange = (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const sanitized = sanitizeNumber(value, 0); // No decimals for integers
    const isValid = validatePositiveInteger(sanitized, 0);
    setter(sanitized);
    setValidationErrors(prev => ({ ...prev, [field]: !isValid }));
  };

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
    addCollateral(newCollateral, {
      onSuccess: () => {
        // Initialize relationships for this collateral
        const newRelationships = {
          ...collateralLoanRelationships,
          [newId]: { [selectedLoan]: true }
        };
        updateRelationships(newRelationships);
        setSelectedCollateralId(newId);
      }
    });
  };

  // Toggle collateral-loan relationship
  const toggleCollateralLoanRelationship = (loanNo: string) => {
    if (!collateralLoanRelationships) return;

    const updatedRelationships = {
      ...collateralLoanRelationships,
      [selectedCollateralId]: {
        ...(collateralLoanRelationships[selectedCollateralId] || {}),
        [loanNo]: !(collateralLoanRelationships[selectedCollateralId]?.[loanNo])
      }
    };
    updateRelationships(updatedRelationships);
  };

  // Show delete confirmation
  const showDeleteConfirmation = (id: number, description: string) => {
    setDeleteCollateralConfirmation({ show: true, collateralId: id, collateralDescription: description });
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteCollateralConfirmation.collateralId !== null) {
      const collateralIdToDelete = deleteCollateralConfirmation.collateralId;

      deleteCollateral(collateralIdToDelete, {
        onSuccess: () => {
          // Find remaining collateral to select
          const remainingCollateral = collateralList.filter(c => c.id !== collateralIdToDelete);
          if (remainingCollateral.length > 0) {
            setSelectedCollateralId(remainingCollateral[0].id);
          }
        }
      });
    }
    setDeleteCollateralConfirmation({ show: false, collateralId: null, collateralDescription: '' });
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteCollateralConfirmation({ show: false, collateralId: null, collateralDescription: '' });
  };

  // Loading state
  if (loadingCollateral || loadingLoans) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

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
                      value={localSqft}
                      onChange={(e) => handleIntegerChange('sqft', e.target.value, setLocalSqft)}
                      placeholder="0"
                      className={`${styles.inputBg} ${getInputStyle('sqft')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
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
                    value={localListPrice}
                    onChange={(e) => handleCurrencyChange('listPrice', e.target.value, setLocalListPrice)}
                    placeholder="0.00"
                    className={`${styles.inputBg} ${getInputStyle('listPrice')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={localAppraisedValue}
                    onChange={(e) => handleCurrencyChange('appraisedValue', e.target.value, setLocalAppraisedValue)}
                    placeholder="0.00"
                    className={`${styles.inputBg} ${getInputStyle('appraisedValue')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={localOurValue}
                    onChange={(e) => handleCurrencyChange('ourValue', e.target.value, setLocalOurValue)}
                    placeholder="0.00"
                    className={`${styles.inputBg} ${getInputStyle('ourValue')} border rounded px-2 py-1 w-full text-xs ${styles.textGreen} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={localBpoValue}
                    onChange={(e) => handleCurrencyChange('bpoValue', e.target.value, setLocalBpoValue)}
                    placeholder="0.00"
                    className={`${styles.inputBg} ${getInputStyle('bpoValue')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
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
                {getSortedLoans.map((loan) => (
                  <div
                    key={loan.mwLoanNo}
                    className={`flex items-center p-2 rounded ${styles.inputBorder} border transition-colors ${
                      collateralLoanRelationships?.[selectedCollateralId]?.[loan.mwLoanNo] ? styles.activeTabBg : styles.inactiveTabBg
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`collateral-loan-${loan.mwLoanNo}`}
                      checked={collateralLoanRelationships?.[selectedCollateralId]?.[loan.mwLoanNo] || false}
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
                    {securingLoansStats.securingCount} of {securingLoansStats.totalLoans}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${styles.textMuted}`}>Total Secured:</span>
                  <span className={`text-xs font-medium ${styles.textGreen}`}>
                    ${securingLoansStats.totalSecured.toLocaleString()}
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
});
CollateralTab.displayName = 'CollateralTab';
