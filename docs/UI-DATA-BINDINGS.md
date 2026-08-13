# UI ↔ Database Bindings

**Source of truth:** `Architecture.xlsx` workbook (maintained outside the repo — contains
production data). Its View sheets wire every UI field to a production column via
`XLOOKUP` formulas against real MidwestDD table exports. This document captures that
mapping structurally, with no data.

## Real production schemas (from table exports)

### tblLoan — 54 columns
```
MWLoanNo (PK, 15-char string) | ProjectName | RelatedLoans | LoanNo | Investor | Pool
AssetType | AcctOfficer | AssignedToAcctOfficer | OrgNoteDate | CurrentMaturityDate
SSN | BorrowerNm | BorrowerAddress | BorrowerAddress2 | CityNm | StCd | ZipCd
OrigPrincipalBalance | PrincipalBalance | InterestBalance | InterestAccrualDate
EscrowBalance | OtherBalances | PayoffBalance | RepayAmt | EscrowPmt | LastPmtDt | DueDt
Rate | DefaultRate | RateType | index | margin | floor | ceiling | changefreq
nextchangedt | DaysBasis | PmtFrequency | PayHistoryComment | LastImport | NAICS
CreditScore | ExitCode | CFLikelyhood | PreliminaryScore | CashFlowUpdate
Times30 | Times60 | Times90 | consumerloan | [Unfunded Commitment] | rowguid
```

### tblRelationships — 16 columns
```
RelatedLoans (PK, ~11-char truncated name) | ProjectName | SortNo
ExitStrategyOverview | Original_Strategy | RelationshipOverview | CollateralOverview
ConditionsDeadlines | ExitCode | InBankruptcy | ForeclosureFlag | LitigationFlag
ForbearanceFlag | JudgmentFlag | rowguid | LowYieldAsset
```

### CollateralInfo — 57 columns
```
Priority | ProjectName | RelatedLoans | MWPropertyNo | MWLoanNo | BorrowerName
OwnerName | LoanNo | IsRealEstate | RealEstateGroup | Description | MWCollateralCode
Address | City | State | County | Zip | SQFT | LienPosition | SeniorLienAmount
LienAsOfDate | MWTitleLienPosition | MWTitleSrLienAmt | MWTitleDate
CurrentAppraisalDate | CurrentAppraisedValue | SellerAppraisalDate | SellerAppraisedValue
Acreage | NumUnits | TaxAnnualAmt | TaxAssessedValue | TaxMarketValue | TaxDelinquentAmt
TaxStatementDate | TaxParcelIDNO | TaxComment | TaxCallComplete | InsuranceType
InsuranceExpiration | BPOonOrder | SiteVisitOnOrder | TitleSearchOnOrder
PossibleEnvironmental | BPOProvider | BPOOrderNum | PropertyComment | RelatedUPB
IsFloodZone | TaxWebCard | rowguid | Latitude | Longitude | Condition
[CoStar Rents] | [CoStar Vac] | [CoStar Cap]
```

## Key relationships

```
tblRelationships.RelatedLoans  1 ──< tblLoan.RelatedLoans
tblLoan.MWLoanNo               1 ──< CollateralInfo.MWLoanNo (nullable)
tblRelationships.RelatedLoans  1 ──< CollateralInfo.RelatedLoans
ProjectName groups everything one level above relationships
  (e.g. 'Regions.Q3.2026', 'Hilltop.BCB.Q3.2026')
```

## Selection mechanism (from the workbook)

The relationship loan grid has a checkbox column; the checked row's `MWLoanNo` is
resolved by `XLOOKUP(1, checkboxCol, loanNoCol)` into a hidden "Loan Selected" cell,
and every detail field keys off that cell. **This is `selectedLoan` in LoanContext** —
the React app already implements this mechanism.

## Relationship loan grid (LoanTable / Main View)

| GUI column | React field | Production column |
|---|---|---|
| Loan No | `mwLoanNo` | `tblLoan.MWLoanNo` |
| Related Loans | `relatedLoans` | `tblLoan.RelatedLoans` |
| Borrower | `borrowerName` | `tblLoan.BorrowerNm` |
| Orig Balance | `origBalance` | `tblLoan.OrigPrincipalBalance` |
| UPB / Principal | `principal` | `tblLoan.PrincipalBalance` |
| Rate | `intRate` | `tblLoan.Rate` (stored as decimal fraction, e.g. 0.045) |
| PMT | `pmt` | `tblLoan.RepayAmt` |
| NxtDue | `dueDt` | `tblLoan.DueDt` |
| LastPmt | `lastPmt` | `tblLoan.LastPmtDt` |
| OrigDt | `origDt` | `tblLoan.OrgNoteDate` |
| MatDt | `matDt` | `tblLoan.CurrentMaturityDate` |
| Bk / flags column | (Overview flags) | `tblRelationships.{InBankruptcy, ForeclosureFlag, LitigationFlag, ForbearanceFlag, JudgmentFlag, LowYieldAsset}` |

## Loan tab detail panel (Loan View)

| UI label | React field | Production column |
|---|---|---|
| Consumer Loan | — (not in GUI yet) | `tblLoan.consumerloan` |
| Loan No | `mwLoanNo` | `tblLoan.MWLoanNo` |
| Related | `relatedLoans` | `tblLoan.RelatedLoans` |
| Borrower name | `borrowerName` | `tblLoan.BorrowerNm` |
| Address / 2 / City / St / Zip | `address1`, `address2`, `city`, `state`, `zip` | `tblLoan.BorrowerAddress`, `BorrowerAddress2`, `CityNm`, `StCd`, `ZipCd` |
| Orig Dt | `origDt` | `tblLoan.OrgNoteDate` |
| LastIm | `lastImportDate` | `tblLoan.LastImport` |
| Iacc Dt | `accDt` | `tblLoan.InterestAccrualDate` |
| Due Dt | `dueDt` | `tblLoan.DueDt` |
| Mat Dt | `matDt` | `tblLoan.CurrentMaturityDate` |
| OrigBal | `origBalance` | `tblLoan.OrigPrincipalBalance` |
| PrinBal | `principal` | `tblLoan.PrincipalBalance` |
| IntBal | `interest` | `tblLoan.InterestBalance` |
| EscBal | `escrowBalance` | `tblLoan.EscrowBalance` |
| OthBal | `otherBalance` | `tblLoan.OtherBalances` |
| Payoff | — (computed in GUI) | `tblLoan.PayoffBalance` |
| PmtAmt | `pmt` | `tblLoan.RepayAmt` |
| EscPmt | `escPmt` | `tblLoan.EscrowPmt` |
| LastPDt | `lastPdt` | `tblLoan.LastPmtDt` |
| PmtFrq | `pmtFreq` | `tblLoan.DaysBasis` (workbook binds DaysBasis here; confirm vs `PmtFrequency`) |
| Rate | `intRate` | `tblLoan.Rate` |
| DefR | `dRate` | `tblLoan.DefaultRate` |
| ChDt | `chDt` | `tblLoan.nextchangedt` |
| Floor / Ceiling / Margin | `floor`, `ceiling`, `margin` | `tblLoan.floor`, `ceiling`, `margin` |
| Index | `rateIndex` | `tblLoan.index` |
| ChFrq | `chFrq` | `tblLoan.changefreq` |
| Rtype | `rateType` | `tblLoan.RateType` |
| AssetType | `assetType` | `tblLoan.AssetType` |
| Unfunded Commitment | `unfundedCommitment` | `tblLoan.[Unfunded Commitment]` |

## Collateral grid (Collateral View)

| UI column | React field | Production column |
|---|---|---|
| Priority | — | `CollateralInfo.Priority` |
| MwCollateralCode | `collateralCode` | `CollateralInfo.MWCollateralCode` |
| Description | `description` | `CollateralInfo.Description` |
| Address / City / State / Zip / County | same names | `CollateralInfo.Address`, `City`, `State`, `Zip`, `County` |
| SellerValue | `ourValue` (approx) | `CollateralInfo.SellerAppraisedValue` |
| MaxBpo | `bpoValue` | `CollateralInfo.MaxBPO` (per DD.Main views; export shows BPO fields on order flags) |

## Overview / Strategies narrative fields — schema home confirmed

The GUI currently persists these to localStorage; production stores them on
`tblRelationships`:

| GUI field | Production column |
|---|---|
| OverviewTab "Relationship Overview" | `tblRelationships.RelationshipOverview` |
| OverviewTab "Collateral Overview" | `tblRelationships.CollateralOverview` |
| OverviewTab "Bid Conditions" | `tblRelationships.ConditionsDeadlines` |
| StrategiesTab notes | `tblRelationships.ExitStrategyOverview` (+ `Original_Strategy` history) |

When the backend lands, these four fields move from localStorage to
relationship-scoped API calls.

## Data-shape rules the GUI must honor

1. **MWLoanNo is a 13–15 char string** (`000005100350710`) — never numeric, keep
   leading zeros. Seed/test data with 4-digit IDs understates field widths.
2. **RelatedLoans is a ~11-char truncated name** (`HISPANIC PR`) used as a join key —
   renames break joins (see database analysis doc).
3. **Rates are decimal fractions** (`0.045` = 4.5%); the GUI stores percent numbers
   (4.75). The API layer must convert both directions.
4. **Narratives contain CR literals** (`_x000D_`) — normalize line endings on read.
5. **`rowguid`** exists on every table (SQL Server replication) — read-only, never sent
   on update.
6. **Latitude/Longitude already exist on CollateralInfo** — the Report tab map can bind
   directly; no schema change needed.
7. **Scale reality:** ~210 relationships, ~248 loans, ~291 properties across multiple
   `ProjectName` deals in one database — the relationship browser needs a project
   filter when real data connects.
