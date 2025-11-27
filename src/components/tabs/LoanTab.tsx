// LoanTab component - displays loan details in 5-column grid layout
import React from 'react';
import { useTheme, useLoan } from '../../context';
import { US_STATES } from '../../data';
import {
  calculateInterestAccrued,
  calculateMonthsToMaturity,
  calculateAmortizationMonths
} from '../../utils';

export const LoanTab: React.FC = () => {
  const { styles } = useTheme();
  const {
    selectedLoanData,
    handleLoanFieldChange
  } = useLoan();

  if (!selectedLoanData) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>No loan selected</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Main 5-column grid for loan tab */}
      <div className="grid grid-cols-5 gap-4">
        {/* Column 1: Loan Info */}
        <div className="space-y-3">
          <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>MW Loan #:</label>
                <input
                  type="text"
                  value={selectedLoanData.mwLoanNo}
                  readOnly
                  className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none cursor-not-allowed`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Borrower:</label>
                <input
                  type="text"
                  value={selectedLoanData.borrowerName}
                  onChange={(e) => handleLoanFieldChange('borrowerName', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Relationship:</label>
                <input
                  type="text"
                  value={selectedLoanData.relatedLoans}
                  onChange={(e) => handleLoanFieldChange('relatedLoans', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Pool:</label>
                <input
                  type="text"
                  value={selectedLoanData.pool || ''}
                  onChange={(e) => handleLoanFieldChange('pool', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Status:</label>
                <select
                  value={selectedLoanData.status || ''}
                  onChange={(e) => handleLoanFieldChange('status', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                >
                  <option value="">Select</option>
                  <option value="PA">PA - Performing Asset</option>
                  <option value="FA">FA - Fully Performing</option>
                  <option value="FC">FC - Foreclosure</option>
                  <option value="JG">JG - Judgment</option>
                  <option value="LT">LT - Litigation</option>
                  <option value="BK">BK - Bankruptcy</option>
                  <option value="REO">REO - Real Estate Owned</option>
                </select>
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Last Import:</label>
                <input
                  type="text"
                  value={selectedLoanData.lastImportDate || ''}
                  onChange={(e) => handleLoanFieldChange('lastImportDate', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Balances */}
        <div className="space-y-3">
          <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Orig Balance:</label>
                <input
                  type="text"
                  value={selectedLoanData.origBalance.toLocaleString()}
                  onChange={(e) => handleLoanFieldChange('origBalance', parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Principal:</label>
                <input
                  type="text"
                  value={selectedLoanData.principal.toLocaleString()}
                  onChange={(e) => handleLoanFieldChange('principal', parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Interest:</label>
                <input
                  type="text"
                  value={selectedLoanData.interest.toLocaleString()}
                  onChange={(e) => handleLoanFieldChange('interest', parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Escrow:</label>
                <input
                  type="text"
                  value={selectedLoanData.escrowBalance.toLocaleString()}
                  onChange={(e) => handleLoanFieldChange('escrowBalance', parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Other:</label>
                <input
                  type="text"
                  value={selectedLoanData.otherBalance.toLocaleString()}
                  onChange={(e) => handleLoanFieldChange('otherBalance', parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Total Balance:</label>
                <input
                  type="text"
                  value={'$' + (selectedLoanData.principal + selectedLoanData.interest + selectedLoanData.escrowBalance + selectedLoanData.otherBalance).toLocaleString()}
                  className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textGreen} font-medium focus:outline-none cursor-not-allowed`}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Rates and Payment */}
        <div className="space-y-3">
          <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Int Rate:</label>
                <input
                  type="text"
                  value={selectedLoanData.intRate}
                  onChange={(e) => handleLoanFieldChange('intRate', parseFloat(e.target.value) || 0)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Default Rate:</label>
                <input
                  type="text"
                  value={selectedLoanData.dRate}
                  onChange={(e) => handleLoanFieldChange('dRate', parseFloat(e.target.value) || 0)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Payment:</label>
                <input
                  type="text"
                  value={selectedLoanData.pmt.toLocaleString()}
                  onChange={(e) => handleLoanFieldChange('pmt', parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Escrow Pmt:</label>
                <input
                  type="text"
                  value={selectedLoanData.escPmt.toLocaleString()}
                  onChange={(e) => handleLoanFieldChange('escPmt', parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Pmt Freq:</label>
                <select
                  value={selectedLoanData.pmtFreq}
                  onChange={(e) => handleLoanFieldChange('pmtFreq', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                >
                  <option value="M">M</option>
                  <option value="Q">Q</option>
                  <option value="SA">SA</option>
                  <option value="A">A</option>
                </select>
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Unfunded Commitment:</label>
                <input
                  type="text"
                  value={selectedLoanData.unfundedCommitment || ''}
                  onChange={(e) => handleLoanFieldChange('unfundedCommitment', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Dates */}
        <div className="space-y-3">
          <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Not Due:</label>
                <input
                  type="text"
                  value={selectedLoanData.notDue || ''}
                  onChange={(e) => handleLoanFieldChange('notDue', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Last PMT:</label>
                <input
                  type="text"
                  value={selectedLoanData.lastPmt || ''}
                  onChange={(e) => handleLoanFieldChange('lastPmt', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Orig Dt:</label>
                <input
                  type="text"
                  value={selectedLoanData.origDt || ''}
                  onChange={(e) => handleLoanFieldChange('origDt', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Mat Dt:</label>
                <input
                  type="text"
                  value={selectedLoanData.matDt || ''}
                  onChange={(e) => handleLoanFieldChange('matDt', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Acc Dt:</label>
                <input
                  type="text"
                  value={selectedLoanData.accDt || ''}
                  onChange={(e) => handleLoanFieldChange('accDt', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Due Dt:</label>
                <input
                  type="text"
                  value={selectedLoanData.dueDt || ''}
                  onChange={(e) => handleLoanFieldChange('dueDt', e.target.value)}
                  placeholder="MM/DD/YY"
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 5: Address and Additional Info */}
        <div className="space-y-3">
          <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 1:</label>
                <input
                  type="text"
                  value={selectedLoanData.address1 || ''}
                  onChange={(e) => handleLoanFieldChange('address1', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 2:</label>
                <input
                  type="text"
                  value={selectedLoanData.address2 || ''}
                  onChange={(e) => handleLoanFieldChange('address2', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>City:</label>
                <input
                  type="text"
                  value={selectedLoanData.city || ''}
                  onChange={(e) => handleLoanFieldChange('city', e.target.value)}
                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>State:</label>
                  <select
                    value={selectedLoanData.state || ''}
                    onChange={(e) => handleLoanFieldChange('state', e.target.value)}
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
                    value={selectedLoanData.zip || ''}
                    onChange={(e) => handleLoanFieldChange('zip', e.target.value)}
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Rate Type, Loan Type, Calculated Fields */}
      <div className="mt-4 space-y-3">
        {/* Rate Type Information */}
        <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
          <div className="grid grid-cols-7 gap-3">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Rate Type:</label>
              <select
                value={selectedLoanData.rateType || ''}
                onChange={(e) => handleLoanFieldChange('rateType', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              >
                <option value="">Select</option>
                <option value="Fixed">Fixed</option>
                <option value="Variable">Variable</option>
                <option value="Adjustable">Adjustable</option>
              </select>
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Floor:</label>
              <input
                type="text"
                value={selectedLoanData.floor || ''}
                onChange={(e) => handleLoanFieldChange('floor', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Ceiling:</label>
              <input
                type="text"
                value={selectedLoanData.ceiling || ''}
                onChange={(e) => handleLoanFieldChange('ceiling', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Margin:</label>
              <input
                type="text"
                value={selectedLoanData.margin || ''}
                onChange={(e) => handleLoanFieldChange('margin', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>ChDt:</label>
              <input
                type="text"
                value={selectedLoanData.chDt || ''}
                onChange={(e) => handleLoanFieldChange('chDt', e.target.value)}
                placeholder="MM/DD/YY"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>ChFrq:</label>
              <input
                type="text"
                value={selectedLoanData.chFrq || ''}
                onChange={(e) => handleLoanFieldChange('chFrq', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Index:</label>
              <select
                value={selectedLoanData.rateIndex || ''}
                onChange={(e) => handleLoanFieldChange('rateIndex', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              >
                <option value=""></option>
                <option value="LIBOR">LIBOR</option>
                <option value="SOFR">SOFR</option>
                <option value="Prime">Prime</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loan Type Information - 3 columns with empty space */}
        <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Ah/Bhd:</label>
              <input
                type="text"
                value={selectedLoanData.ahBhd || ''}
                onChange={(e) => handleLoanFieldChange('ahBhd', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>AssetType:</label>
              <select
                value={selectedLoanData.assetType || ''}
                onChange={(e) => handleLoanFieldChange('assetType', e.target.value)}
                className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              >
                <option value=""></option>
                <option value="Commercial RE">Commercial RE</option>
                <option value="Residential">Residential</option>
                <option value="Multi-family">Multi-family</option>
                <option value="Land">Land</option>
                <option value="Construction">Construction</option>
              </select>
            </div>
            <div>
              {/* Empty cell for consistent 3-column layout */}
            </div>
          </div>
        </div>

        {/* Calculated Fields - Local calculations, not stored in database */}
        <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Months Interest Accrued:</label>
              <input
                type="text"
                value={calculateInterestAccrued(selectedLoanData.interest, selectedLoanData.principal, selectedLoanData.intRate)}
                className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                readOnly
                title="Interest Balance / (Principal Balance x (Rate/12))"
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Months to Maturity:</label>
              <input
                type="text"
                value={selectedLoanData.matDt ? calculateMonthsToMaturity(selectedLoanData.matDt) : '0'}
                className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                readOnly
                title="Calculated from Today to Maturity Date"
              />
            </div>
            <div>
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Months to Amortization:</label>
              <input
                type="text"
                value={calculateAmortizationMonths(selectedLoanData.principal, selectedLoanData.pmt, selectedLoanData.intRate)}
                className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                readOnly
                title="NPER calculation: Months to pay off principal at current payment rate"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
