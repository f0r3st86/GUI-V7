// Initial collateral data - exact copy from original component
import type { Collateral, CollateralLoanRelationships } from '../types';

export const initialCollateral: Collateral[] = [
  {
    id: 1,
    loanNo: '7758',
    collateralCode: 'Commercial Property',
    description: 'Commercial Building - Restaurant',
    address1: '500 Commercial Street',
    city: 'Portland',
    state: 'ME',
    zip: '04101',
    county: 'Cumberland',
    parcelId: 'R12-345-678',
    taxes: '12,500',
    delinquentTaxes: '0',
    taxAssessedValue: '450,000',
    taxMarketValue: '475,000',
    sellerLienPosition: '1',
    sellerLienAmount: '32,800',
    titleLienPosition: '1',
    titleLienAmount: '32,800',
    listPrice: '550,000',
    daysOnMarket: '45',
    appraisedValue: '525,000',
    appraisedDate: '06/15/24',
    ourValue: '500,000',
    ourValueDate: '07/01/24',
    bpoValue: '490,000',
    bpoDate: '07/10/24',
    sqft: '4,500',
    acres: '0.35',
    yearBuilt: '1995',
    units: '1'
  },
  {
    id: 2,
    loanNo: '2461',
    collateralCode: 'Multi-Family',
    description: '12-Unit Apartment Building',
    address1: '1200 Main Street',
    city: 'Portland',
    state: 'ME',
    zip: '04102',
    county: 'Cumberland',
    parcelId: 'R45-678-901',
    taxes: '18,000',
    delinquentTaxes: '4,500',
    taxAssessedValue: '850,000',
    taxMarketValue: '900,000',
    sellerLienPosition: '1',
    sellerLienAmount: '300,000',
    titleLienPosition: '1',
    titleLienAmount: '300,000',
    listPrice: '975,000',
    daysOnMarket: '90',
    appraisedValue: '950,000',
    appraisedDate: '05/20/24',
    ourValue: '925,000',
    ourValueDate: '06/01/24',
    bpoValue: '900,000',
    bpoDate: '06/15/24',
    sqft: '12,000',
    acres: '0.75',
    yearBuilt: '1985',
    units: '12'
  }
];

// Collateral to Loan relationships - tracks which loans this collateral secures
export const initialCollateralLoanRelationships: CollateralLoanRelationships = {
  1: { // Collateral ID 1
    '2461': false,
    '5091': false,
    '7855': false,
    '3685': false,
    '3205': false,
    '6826': false,
    '7758': true
  },
  2: { // Collateral ID 2
    '2461': true,
    '5091': false,
    '7855': false,
    '3685': false,
    '3205': false,
    '6826': false,
    '7758': false
  }
};
