// Constants extracted from original monolithic component
import type { USState } from '../types';

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

// Tab names
export const TABS = [
  'Loan', 'Borrower', 'Collateral', 'Comment', 'BPOTitleUCC',
  'PayHist', 'FinStmts', 'Projections', 'Strategies', 'Tasks',
  'Overview', 'Property'
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
