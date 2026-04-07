// Type definitions for Loan Underwriting System
// All types extracted from the original monolithic component

// ==================== LOAN TYPES ====================

export interface Loan {
  relatedLoans: string;
  mwLoanNo: string;
  borrowerName: string;
  origBalance: number;
  principal: number;
  interest: number;
  escrowBalance: number;
  otherBalance: number;
  intRate: number;
  dRate: number;
  pmt: number;
  escPmt: number;
  pmtFreq: string;
  notDue: string;
  lastPmt: string;
  origDt: string;
  matDt: string;
  accDt: string;
  dueDt: string;
  lastPdt: string;
  status: string;
  change: number;
  lastImportDate: string;
  pool: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  rateType: string;
  floor: string;
  ceiling: string;
  margin: string;
  chDt: string;
  chFrq: string;
  rateIndex: string;
  ahBhd: string;
  assetType: string;
  unfundedCommitment: string;
  selected?: boolean;
}

// ==================== BORROWER TYPES ====================

export interface LoanRelationship {
  selected: boolean;
  role: string;
}

export interface Borrower {
  id: number;
  relationship: string;
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  dob: string;
  ssnEin: string;
  creditScore: string;
  creditScoreDate: string;
  bkStatus: string;
  bkChapter: string;
  bkCourtCase: string;
  bkCourtLocation: string;
  bkAssets: string;
  type: 'Borrower' | 'Guarantor';
  loanRelationships: Record<string, LoanRelationship>;
}

export interface DeleteConfirmation {
  show: boolean;
  borrowerId: number | null;
  borrowerName: string;
}

// ==================== COLLATERAL TYPES ====================

export interface Collateral {
  id: number;
  loanNo: string;
  collateralCode: string;
  description: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  parcelId: string;
  taxes: string;
  delinquentTaxes: string;
  taxAssessedValue: string;
  taxMarketValue: string;
  sellerLienPosition: string;
  sellerLienAmount: string;
  titleLienPosition: string;
  titleLienAmount: string;
  listPrice: string;
  daysOnMarket: string;
  appraisedValue: string;
  appraisedDate: string;
  ourValue: string;
  ourValueDate: string;
  bpoValue: string;
  bpoDate: string;
  sqft: string;
  acres: string;
  yearBuilt: string;
  units: string;
}

export interface CollateralLoanRelationships {
  [collateralId: number]: Record<string, boolean>;
}

export interface DeleteCollateralConfirmation {
  show: boolean;
  collateralId: number | null;
  collateralDescription: string;
}

// ==================== COMMENT TYPES ====================

export interface Comment {
  id: number;
  loanNo: string;
  commentType: string;
  date: string;
  text: string;
}

// ==================== PAYMENT TYPES ====================

export interface PaymentRecord {
  id: number;
  loanNo: string;
  year: string;
  month: string;
  amount: string;
}

export interface PaymentGridData {
  [year: string]: {
    [month: number]: number;
  };
}

// ==================== PROJECTION TYPES ====================

export type PaymentMethod = 'User Enter' | 'Contractual' | 'Term Pmt' | 'Interest Payment' | '% of Trail Pmt';
export type RateMethod = 'Contractual' | 'User Enter';
export type AddBackBasis = 'Initial Only' | 'Initial + Holding';

export interface ProjectionSettings {
  paymentMethod: PaymentMethod;
  rateMethod: RateMethod;
  userPayment: string;
  userRate: string;
  amortMonths: string;
  trailPeriod: string;
  trailPercentage: string;
  initialLegal: string;
  initialLegalStartMonth: string;
  holdingCosts: string;
  holdingCostsEndMonth: string;
  addBackPercentage: string;
  addBackBasis: AddBackBasis;
}

export interface ProjectionGridData {
  income: Record<string, Record<number, number>>;
  expenses: Record<string, Record<number, number>>;
  netCashFlow: Record<string, Record<number, number>>;
}

// ==================== CASH FLOW STORAGE TYPES (SQL) ====================

/**
 * Individual cash flow record for SQL storage
 * Table: cash_flow_records
 */
export interface CashFlowRecord {
  id?: number;                    // Auto-increment primary key
  mwLoanNo: string;               // Foreign key to loans table
  projectionId: number;           // Foreign key to cash_flow_projections
  year: number;                   // Calendar year (e.g., 2025)
  month: number;                  // Calendar month (1-12)
  projectionMonth: number;        // Projection month (1-60)
  cashFlowType: 'income' | 'expense' | 'net'; // Type of cash flow
  amount: number;                 // Cash flow amount
  createdAt?: string;             // ISO timestamp
  updatedAt?: string;             // ISO timestamp
}

/**
 * Cash flow projection header for SQL storage
 * Table: cash_flow_projections
 */
export interface CashFlowProjection {
  id?: number;                    // Auto-increment primary key
  mwLoanNo: string;               // Foreign key to loans table
  mode: 'modern' | 'classic';     // Projection mode used
  discountRate: number;           // Discount rate used for NPV
  startMonth: number;             // Projection start month (1-60)
  endMonth: number;               // Projection end month (1-60)
  projectionSettingsId?: number;  // Foreign key to projection_settings
  exitSettingsId?: number;        // Foreign key to exit_settings
  createdAt?: string;             // ISO timestamp
  updatedAt?: string;             // ISO timestamp
}

/**
 * Bid statistics snapshot for SQL storage
 * Table: bid_statistics
 */
export interface BidStatisticsRecord {
  id?: number;                    // Auto-increment primary key
  mwLoanNo: string;               // Foreign key to loans table
  projectionId: number;           // Foreign key to cash_flow_projections
  bidPrice: number;               // NPV of net cash flows
  bidPercentage: number;          // Bid Price / UPB * 100
  moic: number;                   // Sum of NCF / UPB
  cashYield: number;              // F12 NCF / Bid Price * 100
  f12CashFlow: number;            // Forward 12 months cash flow
  p12CashFlow: number;            // Prior 12 months actual payments
  f12vsP12Change: number;         // Percentage change F12 vs P12
  bidToCollateralPct: number;     // Bid Price / Collateral Value * 100
  ytmIrr: number;                 // Yield to maturity (IRR method)
  ytmXirr: number;                // Yield to maturity (XIRR method)
  totalExitProceeds: number;      // Exit value + add back recovery
  upbAtBid: number;               // UPB used for bid calculation
  collateralValueAtBid: number;   // Collateral value used
  createdAt?: string;             // ISO timestamp
}

/**
 * Aggregated projection summary for reporting
 * Table: projection_summaries
 */
export interface ProjectionSummary {
  id?: number;
  mwLoanNo: string;
  projectionId: number;
  totalIncome: number;            // Sum of all income
  totalExpenses: number;          // Sum of all expenses
  totalNetCashFlow: number;       // Sum of all net cash flows
  year1Income: number;            // First year income total
  year1Expenses: number;          // First year expense total
  year1NetCashFlow: number;       // First year NCF total
  avgMonthlyIncome: number;       // Average monthly income
  avgMonthlyExpense: number;      // Average monthly expense
  avgMonthlyNCF: number;          // Average monthly NCF
  createdAt?: string;
}

// ==================== EXIT TYPES ====================

export type ExitMethod = 'Pay in Full' | 'DPO' | 'Value Cap' | 'User Enter' | 'YTM Sell Solve' | 'Liquidation';

export interface ExitSettings {
  method: ExitMethod;
  startMonth: string;
  endMonth: string;
  dpoPercentage: string;
  valueCapPercentage: string;
  userEnterAmount: string;
  ytmDesired: string;
  liquidationMonths: string;
  liquidationAddInterest: boolean;
}

// ==================== TRAILING PAYMENT TYPES ====================

export interface TrailingPaymentData {
  actual: number;
  monthly: number;
  yearly: number;
  contractualTotal: number;
  contractualMonthly: number;
  interestOnlyTotal: number;
  interestOnlyMonthly: number;
  percentOfContractual: number;
  percentOfInterestOnly: number;
  monthsPaidContractual: number;
  monthsPaidInterest: number;
  paymentsReceived: number;
  paymentsExpected: number;
}

// ==================== THEME TYPES ====================

export type Theme = 'dark' | 'light';

export interface ThemeStyles {
  // Backgrounds
  mainBg: string;
  headerBg: string;
  sectionBg: string;
  cardBg: string;
  inputBg: string;
  readOnlyBg: string;

  // Borders
  borderColor: string;
  inputBorder: string;
  focusBorder: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textGreen: string;
  textYellow: string;
  textRed: string;

  // Hover states
  hoverDanger: string;
  hoverBg: string;
  hoverText: string;
  buttonHover: string;

  // Active/Selected states
  selectedBg: string;
  selectedHoverBg: string;
  activeBg: string;
  activeTabBg: string;
  inactiveTabBg: string;

  // Validation
  invalidBorder: string;
  invalidBg: string;
  validRing: string;
  invalidRing: string;

  // Special elements
  alertBg: string;
  alertBorder: string;
  alertText: string;

  // Table
  tableHeaderBg: string;

  // Menu bar
  menuBg: string;
}

// ==================== REPORT TYPES ====================

export type PhotoType = 'exterior' | 'interior' | 'aerial' | 'street' | 'comp' | 'other';

export interface PropertyPhoto {
  id: number;
  collateralId: number;
  url: string;
  caption: string;
  type: PhotoType;
}

export interface PropertyLocation {
  collateralId: number;
  lat: number;
  lng: number;
  address: string;
}

export interface ComparableSale {
  id: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  salePrice: number;
  saleDate: string;
  sqft: number;
  pricePerSqft: number;
  distanceMiles: number;
  yearBuilt: string;
  propertyType: string;
  lat: number;
  lng: number;
  photos: PropertyPhoto[];
}

// ==================== US STATES TYPE ====================

export interface USState {
  code: string;
  name: string;
}

// ==================== CONTEXT TYPES ====================

export interface LoanContextType {
  // Loan state
  loans: Loan[];
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
  selectedLoan: string;
  setSelectedLoan: React.Dispatch<React.SetStateAction<string>>;
  selectedLoanData: Loan | undefined;
  currentRelationship: string;

  // Tab state
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;

  // Borrower state
  borrowersList: Borrower[];
  setBorrowersList: React.Dispatch<React.SetStateAction<Borrower[]>>;
  selectedBorrowerId: number;
  setSelectedBorrowerId: React.Dispatch<React.SetStateAction<number>>;
  selectedBorrower: Borrower | undefined;
  deleteConfirmation: DeleteConfirmation;
  setDeleteConfirmation: React.Dispatch<React.SetStateAction<DeleteConfirmation>>;

  // Collateral state
  collateralList: Collateral[];
  setCollateralList: React.Dispatch<React.SetStateAction<Collateral[]>>;
  selectedCollateralId: number;
  setSelectedCollateralId: React.Dispatch<React.SetStateAction<number>>;
  selectedCollateral: Collateral | undefined;
  collateralLoanRelationships: CollateralLoanRelationships;
  setCollateralLoanRelationships: React.Dispatch<React.SetStateAction<CollateralLoanRelationships>>;
  deleteCollateralConfirmation: DeleteCollateralConfirmation;
  setDeleteCollateralConfirmation: React.Dispatch<React.SetStateAction<DeleteCollateralConfirmation>>;

  // Comment state
  commentsList: Comment[];
  setCommentsList: React.Dispatch<React.SetStateAction<Comment[]>>;
  selectedCommentId: number;
  setSelectedCommentId: React.Dispatch<React.SetStateAction<number>>;
  selectedComment: Comment | undefined;

  // Payment state
  paymentRecords: PaymentRecord[];
  setPaymentRecords: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  paymentGridData: PaymentGridData;
  setPaymentGridData: React.Dispatch<React.SetStateAction<PaymentGridData>>;

  // Helper functions
  handleLoanFieldChange: (field: string, value: string | number) => void;
  getRelationshipBorrowers: () => Borrower[];
  getSortedLoans: () => Loan[];
  getCurrentBorrowerLoanRelationships: () => Record<string, LoanRelationship>;
  getCollateralForLoan: () => Collateral[];
  getFilteredPaymentRecords: () => PaymentRecord[];
  getNextPaymentId: () => number;
  getNextBorrowerId: () => number;
  getNextCollateralId: () => number;
  getNextCommentId: () => number;
}

export interface ThemeContextType {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  toggleTheme: () => void;
  styles: ThemeStyles;
}

export interface ProjectionContextType {
  settings: ProjectionSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProjectionSettings>>;
  updateSetting: <K extends keyof ProjectionSettings>(key: K, value: ProjectionSettings[K]) => void;
}

export interface ExitContextType {
  settings: ExitSettings;
  setSettings: React.Dispatch<React.SetStateAction<ExitSettings>>;
  updateSetting: <K extends keyof ExitSettings>(key: K, value: ExitSettings[K]) => void;
}
