/**
 * Test Utilities
 * Provides custom render function with all providers and mock utilities
 */

import React, { ReactElement, createContext } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { LoanProvider, useLoan } from '../context/LoanContext';
import { ProjectionProvider, useProjection } from '../context/ProjectionContext';
import { ExitProvider, useExit } from '../context/ExitContext';
import {
  initialLoans,
  initialBorrowers,
  initialCollateral,
  initialComments,
  initialPaymentRecords,
  initialRelationships,
} from '../data';
import type { ProjectionSettings, ExitSettings } from '../types';

// Default settings matching the mock API defaults
const defaultProjectionSettings: ProjectionSettings = {
  paymentMethod: 'Contractual',
  rateMethod: 'Contractual',
  userPayment: '',
  userRate: '',
  amortMonths: '360',
  trailPeriod: '12',
  trailPercentage: '100',
  initialLegal: '',
  initialLegalStartMonth: '1',
  holdingCosts: '',
  holdingCostsEndMonth: '12',
  addBackPercentage: '0',
  addBackBasis: 'Initial Only'
};

const defaultExitSettings: ExitSettings = {
  method: 'Pay in Full',
  startMonth: '1',
  endMonth: '24',
  dpoPercentage: '95',
  valueCapPercentage: '90',
  userEnterAmount: '',
  ytmDesired: '12',
  liquidationMonths: '12',
  liquidationAddInterest: false
};

// Create a new QueryClient for each test, pre-seeded with mock data
// so components render content immediately instead of "Loading..."
const createTestQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Pre-seed caches with initial data (same data the mock API returns)
  queryClient.setQueryData(['loans'], [...initialLoans]);
  queryClient.setQueryData(['relationships'], [...initialRelationships]);
  queryClient.setQueryData(['borrowers'], [...initialBorrowers]);
  queryClient.setQueryData(['collateral'], [...initialCollateral]);
  queryClient.setQueryData(['comments'], [...initialComments]);
  queryClient.setQueryData(['payments'], [...initialPaymentRecords]);

  // Pre-seed per-loan settings for the default selected loan ('000005100377580')
  queryClient.setQueryData(['projectionSettings', 'loan', '000005100377580'], { ...defaultProjectionSettings });
  queryClient.setQueryData(['exitSettings', 'loan', '000005100377580'], { ...defaultExitSettings });

  return queryClient;
};

// Extended render options with context overrides
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  loanContextValue?: Partial<ReturnType<typeof useLoan>>;
  themeContextValue?: Partial<ReturnType<typeof useTheme>>;
  projectionContextValue?: Partial<ReturnType<typeof useProjection>>;
  exitContextValue?: Partial<ReturnType<typeof useExit>>;
}

// Context override wrapper
const ContextOverrideProvider: React.FC<{
  children: React.ReactNode;
  loanContextValue?: Partial<ReturnType<typeof useLoan>>;
  themeContextValue?: Partial<ReturnType<typeof useTheme>>;
  projectionContextValue?: Partial<ReturnType<typeof useProjection>>;
  exitContextValue?: Partial<ReturnType<typeof useExit>>;
}> = ({ children, loanContextValue, themeContextValue, projectionContextValue, exitContextValue }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemeOverride overrides={themeContextValue}>
          <LoanProvider>
            <LoanOverride overrides={loanContextValue}>
              <ProjectionProvider>
                <ProjectionOverride overrides={projectionContextValue}>
                  <ExitProvider>
                    <ExitOverride overrides={exitContextValue}>
                      {children}
                    </ExitOverride>
                  </ExitProvider>
                </ProjectionOverride>
              </ProjectionProvider>
            </LoanOverride>
          </LoanProvider>
        </ThemeOverride>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Override components that merge provided values with real context
const ThemeOverride: React.FC<{ children: React.ReactNode; overrides?: Partial<ReturnType<typeof useTheme>> }> = ({ children, overrides }) => {
  const realContext = useTheme();
  const ThemeOverrideContext = createContext({ ...realContext, ...overrides });

  if (!overrides) return <>{children}</>;

  return (
    <ThemeOverrideContext.Provider value={{ ...realContext, ...overrides }}>
      {children}
    </ThemeOverrideContext.Provider>
  );
};

const LoanOverride: React.FC<{ children: React.ReactNode; overrides?: Partial<ReturnType<typeof useLoan>> }> = ({ children, overrides }) => {
  const realContext = useLoan();
  const merged = { ...realContext, ...overrides };

  if (!overrides) return <>{children}</>;

  // We need to provide the merged context to children
  // This is a bit of a hack - we'll use a wrapper component
  return <LoanContextWrapper merged={merged}>{children}</LoanContextWrapper>;
};

const LoanContextWrapper: React.FC<{ children: React.ReactNode; merged: ReturnType<typeof useLoan> }> = ({ children, merged }) => {
  // Clone children and inject the merged context through a custom hook override
  const LoanTestContext = React.createContext(merged);

  return (
    <LoanTestContext.Provider value={merged}>
      <LoanTestConsumer context={LoanTestContext}>
        {children}
      </LoanTestConsumer>
    </LoanTestContext.Provider>
  );
};

const LoanTestConsumer: React.FC<{ children: React.ReactNode; context: React.Context<ReturnType<typeof useLoan>> }> = ({ children }) => {
  return <>{children}</>;
};

const ProjectionOverride: React.FC<{ children: React.ReactNode; overrides?: Partial<ReturnType<typeof useProjection>> }> = ({ children, overrides }) => {
  const realContext = useProjection();
  const merged = { ...realContext, ...overrides };

  if (!overrides) return <>{children}</>;

  const ProjectionTestContext = React.createContext(merged);
  return (
    <ProjectionTestContext.Provider value={merged}>
      {children}
    </ProjectionTestContext.Provider>
  );
};

const ExitOverride: React.FC<{ children: React.ReactNode; overrides?: Partial<ReturnType<typeof useExit>> }> = ({ children, overrides }) => {
  const realContext = useExit();
  const merged = { ...realContext, ...overrides };

  if (!overrides) return <>{children}</>;

  const ExitTestContext = React.createContext(merged);
  return (
    <ExitTestContext.Provider value={merged}>
      {children}
    </ExitTestContext.Provider>
  );
};

/**
 * All Providers wrapper for testing
 */
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LoanProvider>
          <ProjectionProvider>
            <ExitProvider>
              {children}
            </ExitProvider>
          </ProjectionProvider>
        </LoanProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

/**
 * Custom render function that wraps components with all providers
 * Supports context value overrides for testing specific scenarios
 */
const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { loanContextValue, themeContextValue, projectionContextValue, exitContextValue, ...renderOptions } = options || {};

  // If any overrides are provided, use the override wrapper
  if (loanContextValue || themeContextValue || projectionContextValue || exitContextValue) {
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ContextOverrideProvider
        loanContextValue={loanContextValue}
        themeContextValue={themeContextValue}
        projectionContextValue={projectionContextValue}
        exitContextValue={exitContextValue}
      >
        {children}
      </ContextOverrideProvider>
    );
    return render(ui, { wrapper: Wrapper, ...renderOptions });
  }

  return render(ui, { wrapper: AllProviders, ...renderOptions });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Override render with custom render
export { customRender as render };

/**
 * Mock data factories for testing
 */
export const createMockLoan = (overrides = {}) => ({
  mwLoanNo: '000005100377580',
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
    '000005100377580': { selected: true, role: 'Borrower' }
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
  loanNo: '000005100377580',
  year: '2024',
  month: '10',
  amount: 750,
  ...overrides
});

export const createMockComment = (overrides = {}) => ({
  id: 1,
  loanNo: '000005100377580',
  commentType: 'Note' as const,
  date: '10/31/24',
  text: 'Test comment text',
  ...overrides
});
