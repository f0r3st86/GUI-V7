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
      '2461': { selected: false, role: 'Borrower' },
      '5091': { selected: true, role: 'Borrower' },
      '7855': { selected: false, role: 'Borrower' },
      '3685': { selected: false, role: 'Borrower' },
      '3205': { selected: false, role: 'Borrower' },
      '6826': { selected: false, role: 'Borrower' },
      '7758': { selected: true, role: 'Borrower' }
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
      '2461': { selected: true, role: 'Guarantor' },
      '5091': { selected: false, role: 'Guarantor' },
      '7855': { selected: true, role: 'Guarantor' },
      '3685': { selected: true, role: 'Guarantor' },
      '3205': { selected: true, role: 'Borrower' },
      '6826': { selected: true, role: 'Borrower' },
      '7758': { selected: false, role: 'Guarantor' }
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
      '2461': { selected: true, role: 'Borrower' },
      '5091': { selected: false, role: 'Borrower' },
      '7855': { selected: true, role: 'Borrower' },
      '3685': { selected: true, role: 'Borrower' },
      '3205': { selected: false, role: 'Borrower' },
      '6826': { selected: false, role: 'Borrower' },
      '7758': { selected: false, role: 'Borrower' }
    }
  }
];
