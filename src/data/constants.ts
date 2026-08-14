// Constants extracted from original monolithic component
import type { USState } from '../types';

// ==================== TIMING CONSTANTS ====================

/** Default debounce delay for form field inputs (ms) */
export const DEBOUNCE_DELAY = 500;

/** Default debounce delay for search inputs (ms) */
export const DEBOUNCE_DELAY_SEARCH = 300;

/** Mock API simulated network delay range (ms) */
export const MOCK_DELAY_MIN = 50;
export const MOCK_DELAY_MAX = 200;

/** React Query cache timing */
export const QUERY_STALE_TIME = 5 * 60 * 1000;   // 5 minutes
export const QUERY_GC_TIME = 10 * 60 * 1000;      // 10 minutes

/** Textarea minimum height (px) */
export const TEXTAREA_MIN_HEIGHT = 150;

// ==================== DATA CONSTANTS ====================

// US States constant for dropdowns
export const US_STATES: USState[] = [
  { code: '', name: 'Select State' },
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'PR', name: 'Puerto Rico' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'Washington DC' }
];

// Tab names - matches the production frmLoanView tab order exactly
// (Collateral 2nd, borrower tab named 'Obligor'); Report is our addition
export const TABS = [
  'Loan', 'Collateral', 'Obligor', 'Comment', 'BPOTitleUCC',
  'PayHist', 'FinStmts', 'Projections', 'Strategies', 'Tasks',
  'Overview', 'Property', 'Report'
];

// Comment types
export const COMMENT_TYPES = [
  'Note', 'Legal', 'Underwriting', 'Property', 'Servicing', 'Collection', 'Other'
];

// Payment methods for projections
export const PAYMENT_METHODS = [
  'User Enter', 'Contractual', 'Term Pmt', 'Interest Payment', '% of Trail Pmt'
];

// Rate methods for projections
export const RATE_METHODS = ['Contractual', 'User Enter'];

// Exit methods
export const EXIT_METHODS = [
  'Pay in Full', 'DPO', 'Value Cap', 'User Enter', 'YTM Sell Solve', 'Liquidation'
];

// Payment frequency options
export const PAYMENT_FREQUENCIES = [
  { value: 'M', label: 'M' },
  { value: 'Q', label: 'Q' },
  { value: 'SA', label: 'SA' },
  { value: 'A', label: 'A' }
];

// Rate type options
export const RATE_TYPES = ['Fixed', 'Variable', 'Adjustable'];

// Asset type options
export const ASSET_TYPES = [
  'Commercial RE',
  'Multi-family',
  'Residential',
  'Land',
  'Industrial',
  'Retail',
  'Office',
  'Mixed Use',
  'Special Purpose'
];

// Bankruptcy status options
export const BK_STATUS_OPTIONS = ['none', 'active', 'discharged', 'dismissed'];

// Exit codes - the 11 authoritative values mined from production
// tblRelationships.ExitCode (see docs/UI-DATA-BINDINGS.md)
export const EXIT_CODES = [
  'BK Performing',
  'Forbearance',
  'Liquidation-Full',
  'Liquidation-Partial',
  'PAA to Mat',
  'PAA w/Haircuts',
  'PAA/DPO',
  'PAA/Prepay',
  'Restruct/Extend',
  'Settlement',
  'ZERO BID'
];

// Relationship flag definitions - stored bits on tblRelationships,
// displayed as the flag panel beside the relationship loan grid
export const RELATIONSHIP_FLAGS = [
  { key: 'inBankruptcy', label: 'BK', title: 'Bankruptcy' },
  { key: 'forbearanceFlag', label: 'FA', title: 'Forbearance' },
  { key: 'foreclosureFlag', label: 'FC', title: 'Foreclosure' },
  { key: 'judgmentFlag', label: 'JG', title: 'Judgment' },
  { key: 'litigationFlag', label: 'LT', title: 'Litigation' },
  { key: 'lowYieldAsset', label: 'LYA', title: 'Low Yield Asset' },
] as const;

// Add back basis options
export const ADD_BACK_BASIS_OPTIONS = ['Initial Only', 'Initial + Holding'];

// Trailing period options
export const TRAILING_PERIODS = [
  { value: '12', label: '12 Months' },
  { value: '6', label: '6 Months' },
  { value: '3', label: '3 Months' }
];

// Month names for display
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Short month names for display
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
