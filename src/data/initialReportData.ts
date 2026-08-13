// Mock report data - property photos, locations, and comparable sales
// In production, photos would come from file storage / SQL blob references
// and comps from a market data feed or manual entry
import type { PropertyPhoto, PropertyLocation, ComparableSale } from '../types';

// *** SQL CONNECTION POINT ***
// Photos: SELECT * FROM tblPropertyPhotos WHERE MWPropertyNo = ?
// Comps:  SELECT * FROM tblComparableSales WHERE RelationshipID = ?
// Locations: SELECT Latitude, Longitude FROM CollateralInfo WHERE MWPropertyNo = ?

// Property photos for each collateral item
// URL format: In production these would be S3/Azure Blob URLs or local file paths
// For demo, we use placeholder color blocks rendered by the component
export const initialPropertyPhotos: PropertyPhoto[] = [
  // Collateral 1: Commercial Building - Restaurant (500 Commercial St)
  { id: 1, mwPropertyNo: 400921, url: '', caption: 'Front Exterior - Commercial Building', type: 'exterior' },
  { id: 2, mwPropertyNo: 400921, url: '', caption: 'Side View - Parking Area', type: 'exterior' },
  { id: 3, mwPropertyNo: 400921, url: '', caption: 'Main Dining Area', type: 'interior' },
  { id: 4, mwPropertyNo: 400921, url: '', caption: 'Kitchen / Prep Area', type: 'interior' },
  { id: 5, mwPropertyNo: 400921, url: '', caption: 'Street View - Commercial Street', type: 'street' },
  { id: 6, mwPropertyNo: 400921, url: '', caption: 'Aerial View - Lot Overview', type: 'aerial' },

  // Collateral 2: 12-Unit Apartment Building (1200 Main St)
  { id: 7, mwPropertyNo: 400922, url: '', caption: 'Front Exterior - Apartment Building', type: 'exterior' },
  { id: 8, mwPropertyNo: 400922, url: '', caption: 'Rear Exterior - Parking Lot', type: 'exterior' },
  { id: 9, mwPropertyNo: 400922, url: '', caption: 'Unit 1A - Living Room', type: 'interior' },
  { id: 10, mwPropertyNo: 400922, url: '', caption: 'Unit 1A - Kitchen', type: 'interior' },
  { id: 11, mwPropertyNo: 400922, url: '', caption: 'Common Area - Hallway', type: 'interior' },
  { id: 12, mwPropertyNo: 400922, url: '', caption: 'Aerial View - Building & Grounds', type: 'aerial' },
];

// GPS coordinates for collateral properties (Portland, ME area)
export const initialPropertyLocations: PropertyLocation[] = [
  {
    mwPropertyNo: 400921,
    lat: 43.6568,
    lng: -70.2531,
    address: '500 Commercial Street, Portland, ME 04101'
  },
  {
    mwPropertyNo: 400922,
    lat: 43.6615,
    lng: -70.2553,
    address: '1200 Main Street, Portland, ME 04102'
  }
];

// Comparable sales for valuation analysis
export const initialComparableSales: ComparableSale[] = [
  {
    id: 1,
    address: '320 Fore Street',
    city: 'Portland',
    state: 'ME',
    zip: '04101',
    salePrice: 575000,
    saleDate: '03/15/24',
    sqft: 4200,
    pricePerSqft: 136.90,
    distanceMiles: 0.3,
    yearBuilt: '1998',
    propertyType: 'Commercial RE',
    lat: 43.6558,
    lng: -70.2498,
    photos: [
      { id: 101, mwPropertyNo: 0, url: '', caption: 'Comp 1 - Front', type: 'comp' },
      { id: 102, mwPropertyNo: 0, url: '', caption: 'Comp 1 - Side', type: 'comp' },
    ]
  },
  {
    id: 2,
    address: '85 Exchange Street',
    city: 'Portland',
    state: 'ME',
    zip: '04101',
    salePrice: 510000,
    saleDate: '01/22/24',
    sqft: 3800,
    pricePerSqft: 134.21,
    distanceMiles: 0.5,
    yearBuilt: '1992',
    propertyType: 'Commercial RE',
    lat: 43.6580,
    lng: -70.2545,
    photos: [
      { id: 103, mwPropertyNo: 0, url: '', caption: 'Comp 2 - Front', type: 'comp' },
      { id: 104, mwPropertyNo: 0, url: '', caption: 'Comp 2 - Interior', type: 'comp' },
    ]
  },
  {
    id: 3,
    address: '1450 Congress Street',
    city: 'Portland',
    state: 'ME',
    zip: '04102',
    salePrice: 925000,
    saleDate: '11/08/23',
    sqft: 10500,
    pricePerSqft: 88.10,
    distanceMiles: 0.8,
    yearBuilt: '1982',
    propertyType: 'Multi-family',
    lat: 43.6635,
    lng: -70.2680,
    photos: [
      { id: 105, mwPropertyNo: 0, url: '', caption: 'Comp 3 - Exterior', type: 'comp' },
      { id: 106, mwPropertyNo: 0, url: '', caption: 'Comp 3 - Units', type: 'comp' },
    ]
  },
  {
    id: 4,
    address: '200 Park Avenue',
    city: 'Portland',
    state: 'ME',
    zip: '04102',
    salePrice: 1050000,
    saleDate: '08/30/23',
    sqft: 11200,
    pricePerSqft: 93.75,
    distanceMiles: 1.2,
    yearBuilt: '1990',
    propertyType: 'Multi-family',
    lat: 43.6650,
    lng: -70.2620,
    photos: [
      { id: 107, mwPropertyNo: 0, url: '', caption: 'Comp 4 - Building', type: 'comp' },
    ]
  },
  {
    id: 5,
    address: '75 Market Street',
    city: 'Portland',
    state: 'ME',
    zip: '04101',
    salePrice: 485000,
    saleDate: '06/12/24',
    sqft: 3500,
    pricePerSqft: 138.57,
    distanceMiles: 0.4,
    yearBuilt: '2001',
    propertyType: 'Commercial RE',
    lat: 43.6575,
    lng: -70.2510,
    photos: [
      { id: 108, mwPropertyNo: 0, url: '', caption: 'Comp 5 - Storefront', type: 'comp' },
      { id: 109, mwPropertyNo: 0, url: '', caption: 'Comp 5 - Interior', type: 'comp' },
    ]
  }
];
