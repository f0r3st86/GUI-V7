// Initial relationship data - mirrors production tblRelationships
// Flags are stored bits (the authoritative source - NOT derived from loans).
// sortNo is program-assigned from aggregate UPB rank within each project.
import type { Relationship } from '../types';

// *** SQL CONNECTION POINT ***
// SELECT * FROM tblRelationships WHERE ProjectName = ?

export const initialRelationships: Relationship[] = [
  {
    relatedLoans: 'Haskell',
    projectName: 'Demo.Portfolio.Q3.2026',
    sortNo: 1,
    relationshipOverview: '',
    collateralOverview: '',
    conditionsDeadlines: '',
    exitStrategyOverview: '',
    originalStrategy: '',
    exitCode: '',
    inBankruptcy: false,
    foreclosureFlag: true,
    litigationFlag: true,
    forbearanceFlag: true,
    judgmentFlag: true,
    lowYieldAsset: false,
    rowguid: '51d5ee1d-0000-0000-0000-000000000001'
  },
  {
    relatedLoans: 'Coastal',
    projectName: 'Demo.Portfolio.Q3.2026',
    sortNo: 2,
    relationshipOverview: '',
    collateralOverview: '',
    conditionsDeadlines: '',
    exitStrategyOverview: '',
    originalStrategy: '',
    exitCode: '',
    inBankruptcy: false,
    foreclosureFlag: true,
    litigationFlag: false,
    forbearanceFlag: false,
    judgmentFlag: false,
    lowYieldAsset: false,
    rowguid: '51d5ee1d-0000-0000-0000-000000000002'
  }
];
