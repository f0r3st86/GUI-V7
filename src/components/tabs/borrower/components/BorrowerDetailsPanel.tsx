// Left column: Borrower detail cards (name, contact, identity, credit, bankruptcy)
import React from 'react';
import type { Borrower, ThemeStyles } from '../../../../types';

interface BorrowerDetailsPanelProps {
  styles: ThemeStyles;
  borrower: Borrower;
  handleBorrowerFieldChange: (field: keyof Borrower, value: string) => void;
  handlePhoneChange: (value: string) => void;
  handleZipChange: (value: string) => void;
  handleSsnEinChange: (value: string) => void;
  handleCreditScoreChange: (value: string) => void;
  handleDateChange: (field: keyof Borrower, value: string) => void;
  getInputStyle: (field: string) => string;
}

export const BorrowerDetailsPanel: React.FC<BorrowerDetailsPanelProps> = ({
  styles,
  borrower,
  handleBorrowerFieldChange,
  handlePhoneChange,
  handleZipChange,
  handleSsnEinChange,
  handleCreditScoreChange,
  handleDateChange,
  getInputStyle,
}) => {
  const inputClass = `${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`;

  return (
    <div className="space-y-4">
      <h3 className={`font-medium ${styles.textPrimary} mb-3`}>
        Borrower/Guarantor Details
      </h3>

      {/* Name */}
      <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
        <label className={`text-xs ${styles.textMuted} block mb-1`}>Name:</label>
        <input
          type="text"
          value={borrower.name}
          onChange={(e) => handleBorrowerFieldChange('name', e.target.value)}
          aria-label="Borrower Name"
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
              value={borrower.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(555) 555-5555"
              aria-label="Phone"
              className={`${styles.inputBg} ${getInputStyle('phone')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 1:</label>
            <input type="text" value={borrower.address1} onChange={(e) => handleBorrowerFieldChange('address1', e.target.value)} aria-label="Address Line 1" className={inputClass} />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 2:</label>
            <input type="text" value={borrower.address2} onChange={(e) => handleBorrowerFieldChange('address2', e.target.value)} aria-label="Address Line 2" className={inputClass} />
          </div>
          <div className="grid grid-cols-6 gap-2">
            <div className="col-span-3">
              <label className={`text-xs ${styles.textMuted} block mb-1`}>City:</label>
              <input type="text" value={borrower.city} onChange={(e) => handleBorrowerFieldChange('city', e.target.value)} aria-label="City" className={inputClass} />
            </div>
            <div className="col-span-1">
              <label className={`text-xs ${styles.textMuted} block mb-1`}>State:</label>
              <input type="text" value={borrower.state} onChange={(e) => handleBorrowerFieldChange('state', e.target.value)} maxLength={2} aria-label="State" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={`text-xs ${styles.textMuted} block mb-1`}>Zip:</label>
              <input
                type="text"
                value={borrower.zip}
                onChange={(e) => handleZipChange(e.target.value)}
                placeholder="12345"
                maxLength={10}
                aria-label="Zip Code"
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
              value={borrower.ssnEin}
              onChange={(e) => handleSsnEinChange(e.target.value)}
              placeholder="XXX-XX-XXXX or XX-XXXXXXX"
              aria-label="SSN or EIN"
              className={`${styles.inputBg} ${getInputStyle('ssnEin')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Date of Birth:</label>
            <input
              type="text"
              value={borrower.dob}
              onChange={(e) => handleDateChange('dob', e.target.value)}
              placeholder="MM/DD/YY"
              aria-label="Date of Birth"
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
              value={borrower.creditScore}
              onChange={(e) => handleCreditScoreChange(e.target.value)}
              placeholder="300-850"
              maxLength={3}
              aria-label="Credit Score"
              className={`${styles.inputBg} ${getInputStyle('creditScore')} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>Credit Score Date:</label>
            <input
              type="text"
              value={borrower.creditScoreDate}
              onChange={(e) => handleDateChange('creditScoreDate', e.target.value)}
              placeholder="MM/DD/YY"
              aria-label="Credit Score Date"
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
                value={borrower.bkStatus}
                onChange={(e) => handleBorrowerFieldChange('bkStatus', e.target.value)}
                aria-label="Bankruptcy Status"
                className={inputClass}
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
                value={borrower.bkChapter}
                onChange={(e) => handleBorrowerFieldChange('bkChapter', e.target.value)}
                aria-label="Bankruptcy Chapter"
                className={inputClass}
                disabled={borrower.bkStatus === 'none'}
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
              value={borrower.bkCourtCase}
              onChange={(e) => handleBorrowerFieldChange('bkCourtCase', e.target.value)}
              aria-label="Bankruptcy Court Case Number"
              className={inputClass}
              disabled={borrower.bkStatus === 'none'}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Court Location:</label>
            <input
              type="text"
              value={borrower.bkCourtLocation}
              onChange={(e) => handleBorrowerFieldChange('bkCourtLocation', e.target.value)}
              aria-label="Bankruptcy Court Location"
              className={inputClass}
              disabled={borrower.bkStatus === 'none'}
            />
          </div>
          <div>
            <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Assets:</label>
            <select
              value={borrower.bkAssets}
              onChange={(e) => handleBorrowerFieldChange('bkAssets', e.target.value)}
              aria-label="Bankruptcy Assets"
              className={inputClass}
              disabled={borrower.bkStatus === 'none'}
            >
              <option value="No Assets">No Assets</option>
              <option value="Assets">Assets</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
