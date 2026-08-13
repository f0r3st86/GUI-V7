// Initial collateral data - mirrors production CollateralInfo
// Keyed by mwPropertyNo (production MWPropertyNo, server-owned int).
// Primary linkage is relatedLoans (relationship-level); loanNo is the
// optional secondary link to a specific loan.
import type { Collateral } from '../types';

// *** SQL CONNECTION POINT ***
// SELECT * FROM CollateralInfo WHERE RelatedLoans = ?

export const initialCollateral: Collateral[] = [
  {
    mwPropertyNo: 400921,
    relatedLoans: 'Haskell',
    loanNo: '000005100377580',
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
    mwPropertyNo: 400922,
    relatedLoans: 'Haskell',
    loanNo: '000005100324610',
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
