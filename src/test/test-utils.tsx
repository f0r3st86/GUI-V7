/**
 * Test Utilities
 * Provides custom render function with all providers and mock utilities
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';
import { LoanProvider } from '../context/LoanContext';
import { ProjectionProvider } from '../context/ProjectionContext';
import { ExitProvider } from '../context/ExitContext';

/**
 * All Providers wrapper for testing
 */
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <LoanProvider>
        <ProjectionProvider>
          <ExitProvider>
            {children}
          </ExitProvider>
        </ProjectionProvider>
      </LoanProvider>
    </ThemeProvider>
  );
};

/**
 * Custom render function that wraps components with all providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Override render with custom render
export { customRender as render };

/**
 * Mock data factories for testing
 */
export const createMockLoan = (overrides = {}) => ({
  mwLoanNo: '7758',
  borrowerName: 'Test Borrower',
  relatedLoans: 'TestRelationship',
  pool: 'Pool1',
  status: 'PA',
  lastImportDate: '10/31/24',
  origBal: 100000,
  principal: 95000,
  interest: 500,
  escrow: 200,
  otherBal: 0,
  intRate: 8.5,
  dRate: 0,
  pmt: 750,
  escPmt: 100,
  pmtFreq: 'M',
  noteDueDt: '01/01/24',
  lastPmt: '10/15/24',
  origDt: '01/01/20',
  matDt: '01/01/30',
  accDt: '01/01/20',
  dueDt: '11/01/24',
  lastPdt: '10/15/24',
  rateType: 'Fixed',
  floor: 0,
  ceiling: 0,
  margin: 0,
  changeDt: '',
  changeFreq: '',
  rateIndex: '',
  ahbhdStatus: '',
  assetType: 'SFR',
  unfundedCommitment: 0,
  address1: '123 Test St',
  address2: '',
  city: 'Test City',
  state: 'TX',
  zip: '75001',
  ...overrides
});

export const createMockBorrower = (overrides = {}) => ({
  id: 1,
  name: 'Test Borrower',
  type: 'Borrower' as const,
  relationship: 'TestRelationship',
  address1: '123 Test St',
  address2: '',
  city: 'Test City',
  state: 'TX',
  zip: '75001',
  phone: '555-555-5555',
  dob: '01/01/1980',
  ssnEin: '123-45-6789',
  creditScore: '720',
  creditScoreDate: '01/01/24',
  bkStatus: 'None',
  bkChapter: '',
  bkCourtCase: '',
  bkCourtLocation: '',
  bkAssets: '',
  loanRelationships: {
    '7758': { selected: true, role: 'Borrower' }
  },
  ...overrides
});

export const createMockCollateral = (overrides = {}) => ({
  id: 1,
  collateralCode: 'COLL001',
  description: 'Test Property',
  address1: '123 Property St',
  city: 'Test City',
  state: 'TX',
  zip: '75001',
  county: 'Test County',
  parcelId: 'P12345',
  taxes: 5000,
  delinquentTaxes: 0,
  taxAssessedValue: 150000,
  taxMarketValue: 200000,
  sellerLienPosition: 1,
  sellerLienAmount: 0,
  titleLienPosition: 1,
  titleLienAmount: 0,
  listPrice: 250000,
  daysOnMarket: 30,
  appraisedValue: 225000,
  appraisedDate: '01/01/24',
  ourValue: 220000,
  ourValueDate: '01/15/24',
  bpoValue: 230000,
  bpoDate: '01/20/24',
  sqft: 2000,
  acres: 0.25,
  yearBuilt: 2000,
  units: 1,
  ...overrides
});

export const createMockPaymentRecord = (overrides = {}) => ({
  id: 1,
  loanNo: '7758',
  year: '2024',
  month: '10',
  amount: 750,
  ...overrides
});

export const createMockComment = (overrides = {}) => ({
  id: 1,
  loanNo: '7758',
  commentType: 'Note' as const,
  date: '10/31/24',
  text: 'Test comment text',
  ...overrides
});
