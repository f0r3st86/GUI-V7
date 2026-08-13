// Initial borrower data - exact copy from original component
import type { Borrower } from '../types';

// *** SQL CONNECTION POINT ***
// SELECT * FROM borrowers WHERE relationship = 'Haskell' (or current relationship)

export const initialBorrowers: Borrower[] = [
  {
    id: 1,
    relationship: 'Haskell',
    name: 'Blaze Restaurant Group LLC',
    address1: '123 Main Street',
    address2: 'Suite 200',
    city: 'Portland',
    state: 'ME',
    zip: '04101',
    phone: '(207) 555-0123',
    dob: '',
    ssnEin: '45-1234567',
    creditScore: '720',
    creditScoreDate: '10/15/24',
    bkStatus: 'none',
    bkChapter: '',
    bkCourtCase: '',
    bkCourtLocation: '',
    bkAssets: 'No Assets',
    type: 'Borrower',
    // Per-borrower loan relationships
    loanRelationships: {
      '000005100324610': { selected: false, role: 'Borrower' },
      '000005100350910': { selected: true, role: 'Borrower' },
      '000005100378550': { selected: false, role: 'Borrower' },
      '000005100336850': { selected: false, role: 'Borrower' },
      '000005100332050': { selected: false, role: 'Borrower' },
      '000005100368260': { selected: false, role: 'Borrower' },
      '000005100377580': { selected: true, role: 'Borrower' }
    }
  },
  {
    id: 2,
    relationship: 'Haskell',
    name: 'Matthew Haskell',
    address1: '456 Oak Avenue',
    address2: '',
    city: 'Portland',
    state: 'ME',
    zip: '04102',
    phone: '(207) 555-0456',
    dob: '03/15/1975',
    ssnEin: '123-45-6789',
    creditScore: '750',
    creditScoreDate: '09/20/24',
    bkStatus: 'none',
    bkChapter: '',
    bkCourtCase: '',
    bkCourtLocation: '',
    bkAssets: 'No Assets',
    type: 'Guarantor',
    // Per-borrower loan relationships
    loanRelationships: {
      '000005100324610': { selected: true, role: 'Guarantor' },
      '000005100350910': { selected: false, role: 'Guarantor' },
      '000005100378550': { selected: true, role: 'Guarantor' },
      '000005100336850': { selected: true, role: 'Guarantor' },
      '000005100332050': { selected: true, role: 'Borrower' },
      '000005100368260': { selected: true, role: 'Borrower' },
      '000005100377580': { selected: false, role: 'Guarantor' }
    }
  },
  {
    id: 3,
    relationship: 'Haskell',
    name: 'Rocky Coast Real Estate Group LLC',
    address1: '789 Pine Street',
    address2: '',
    city: 'Portland',
    state: 'ME',
    zip: '04103',
    phone: '(207) 555-0789',
    dob: '',
    ssnEin: '98-7654321',
    creditScore: '680',
    creditScoreDate: '08/10/24',
    bkStatus: 'none',
    bkChapter: '',
    bkCourtCase: '',
    bkCourtLocation: '',
    bkAssets: 'No Assets',
    type: 'Borrower',
    // Per-borrower loan relationships
    loanRelationships: {
      '000005100324610': { selected: true, role: 'Borrower' },
      '000005100350910': { selected: false, role: 'Borrower' },
      '000005100378550': { selected: true, role: 'Borrower' },
      '000005100336850': { selected: true, role: 'Borrower' },
      '000005100332050': { selected: false, role: 'Borrower' },
      '000005100368260': { selected: false, role: 'Borrower' },
      '000005100377580': { selected: false, role: 'Borrower' }
    }
  },
  {
    id: 4,
    relationship: 'Coastal',
    name: 'Harbor View Properties LLC',
    address1: '42 Waterfront Drive',
    address2: '',
    city: 'Rockland',
    state: 'ME',
    zip: '04841',
    phone: '(207) 555-0442',
    dob: '',
    ssnEin: '82-4455667',
    creditScore: '705',
    creditScoreDate: '09/20/24',
    bkStatus: 'none',
    bkChapter: '',
    bkCourtCase: '',
    bkCourtLocation: '',
    bkAssets: 'No Assets',
    type: 'Borrower',
    loanRelationships: {
      '0150024381011': { selected: true, role: 'Borrower' },
      '815102-810': { selected: true, role: 'Borrower' }
    }
  }
];
