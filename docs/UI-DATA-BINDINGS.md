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

## Grid population rules (from workbook array formulas)

**Relationship loan grid** is dynamic, not static:
```
MWLoanNo column = SORTBY(
  FILTER(tblLoan[MWLoanNo], tblLoan[RelatedLoans] = <relationship>),
  FILTER(tblLoan[PrincipalBalance], ...))   -- ordered by principal balance
```
→ The GUI's LoanTable should order relationship loans by `PrincipalBalance`
(largest first), matching the workbook.

**Collateral grid rows** come from a hidden key column:
```
MWPropertyNo list = FILTER(CollateralInfo[MWPropertyNo],
                           CollateralInfo[RelatedLoans] = <relationship>)
```
→ **Collateral is linked at the RELATIONSHIP level** (`CollateralInfo.RelatedLoans`),
not per-loan. Loan-level linkage (`CollateralInfo.MWLoanNo`) is nullable/secondary.
The GUI's collateral↔loan junction model should treat relationship scoping as
primary when the backend lands.

## Collateral selection mechanism

Identical pattern to loan selection: checkbox column holds 1 →
`XLOOKUP(1, checkboxCol, MWPropertyNoCol)` into a hidden "Property Selection"
cell → all ~30 detail fields key off it. **`selectedCollateralId` in the GUI
maps to `MWPropertyNo`** (integer, e.g. 400921) — not a synthetic id.

## Collateral grid (Collateral View)

Keyed by hidden `MWPropertyNo` column ("This Row needs to be hidden").

| UI column | React field | Production column |
|---|---|---|
| (checkbox) | `selectedCollateralId` | — selection state |
| Priority | — (missing in GUI) | `CollateralInfo.Priority` |
| MwCollateralCode | `collateralCode` | `CollateralInfo.MWCollateralCode` |
| Description | `description` | `CollateralInfo.Description` |
| Address / City / State / Zip / County | same names | `CollateralInfo.Address`, `City`, `State`, `Zip`, `County` |
| SellerValue | `ourValue` (approx) | `CollateralInfo.SellerAppraisedValue` |
| MaxBpo | `bpoValue` | `CollateralInfo.MaxBPO` (per DD.Main views) |

**Grid actions:** Increase Priority | Decrease Priority | Add Collateral |
Delete Collateral — priority reordering is a first-class operation the GUI
does not have yet (`Priority` drives lien/valuation ordering).

## Collateral tab detail panel (Collateral View rows 25-39)

All fields key off the hidden selected `MWPropertyNo` (`$C$41`).

| UI label | React field | Production column |
|---|---|---|
| MwCollateral Code | `collateralCode` | `CollateralInfo.MWCollateralCode` |
| Description | `description` | `CollateralInfo.Description` |
| Address / City / State / Zip | `address1`, `city`, `state`, `zip` | `CollateralInfo.Address`, `City`, `State`, `Zip` |
| Owner Name | — (missing in GUI) | `CollateralInfo.OwnerName` |
| PropetyNo | — (hidden key) | `CollateralInfo.MWPropertyNo` |
| MwLien / MwSrLien / Date | `titleLienPosition`, `titleLienAmount`, — | `CollateralInfo.MWTitleLienPosition`, `MWTitleSrLienAmt`, `MWTitleDate` |
| Seller Lien / SrLienAmt / Date | `sellerLienPosition`, `sellerLienAmount`, — | `CollateralInfo.LienPosition`, `SeniorLienAmount`, `LienAsOfDate` |
| Lattitude / Longitude | — (Report tab uses these) | `CollateralInfo.Latitude`, `Longitude` |
| Parcel Id | `parcelId` | `CollateralInfo.TaxParcelIDNO` |
| County | `county` | `CollateralInfo.County` |
| Stmt Date | — (missing in GUI) | `CollateralInfo.TaxStatementDate` |
| Base/Year | `taxes` | `CollateralInfo.TaxAnnualAmt` |
| Delq Amt | `delinquentTaxes` | `CollateralInfo.TaxDelinquentAmt` |
| TAV | `taxAssessedValue` | `CollateralInfo.TaxAssessedValue` |
| TMV | `taxMarketValue` | `CollateralInfo.TaxMarketValue` |
| SF | `sqft` | `CollateralInfo.SQFT` |
| Units | `units` | `CollateralInfo.NumUnits` |
| Acres | `acres` | `CollateralInfo.Acreage` |
| MwValue | `appraisedValue` | `CollateralInfo.CurrentAppraisedValue` |
| SellerVal | `ourValue` | `CollateralInfo.SellerAppraisedValue` |
| Prop Detail | — (missing in GUI) | `CollateralInfo.PropertyComment` |
| Environmental Issues | — (missing in GUI) | `CollateralInfo.PossibleEnvironmental` |
| Group | — (missing in GUI) | `CollateralInfo.RealEstateGroup` |
| Flood Zone Location | — (missing in GUI) | `CollateralInfo.IsFloodZone` |
| Tax Card | — (missing in GUI) | `CollateralInfo.TaxWebCard` |

**GUI fields with no binding in this view** (likely sourced elsewhere or dropped):
`loanNo`, `listPrice`, `daysOnMarket`, `appraisedDate`, `ourValueDate`,
`bpoValue`/`bpoDate` (production home is `tblBPO`), `yearBuilt`.

## tblTasks — 13 columns (production export, 206 rows)

```
AcctOfficer | EntryDate (datetime, WITH time) | KeyGenerator (int PK, ~166xxx)
ProjectName | RelatedLoans | MWLoanNo | DueDate | EntryAcctOfficer
Comment (free text) | Completed (bool) | CompleteDate | New (bool) | rowguid
```

Tasks are diligence requests/questions tied to a relationship (and optionally a
loan), assigned between account officers, with completion tracking. This is the
schema for the GUI's **Tasks tab** (currently a "Coming soon" stub).

## Task View bindings (Tasks tab spec)

- Task list for the open relationship:
  `FILTER(tblTasks[KeyGenerator], tblTasks[RelatedLoans] = <relationship>)`
  via a hidden key column ("These should be hidden")
- Repeating task cards, each bound by `KeyGenerator`:

| UI label | Production column |
|---|---|
| Task For | `tblTasks.AcctOfficer` |
| Entered By | `tblTasks.EntryAcctOfficer` |
| Date | `tblTasks.EntryDate` |
| (comment body) | `tblTasks.Comment` |
| Complete | `tblTasks.Completed` + `CompleteDate` |
| (relationship ref) | `tblTasks.RelatedLoans` |

- **Author's spec note in the sheet:** "We should always have a new row to
  enter a new task at the bottom" — the Tasks tab needs a perpetual empty
  entry card (same pattern as PayHist's empty payment row).

## Strategies View bindings (Strategies tab spec)

| UI element | Production column |
|---|---|
| Exit Strategy textarea | `tblRelationships.ExitStrategyOverview` |
| Exit Code field | `tblRelationships.ExitCode` (11-value lookup) |

## Overview View bindings — confirms the GUI's existing three sections

| UI section | Production column |
|---|---|
| Relationship Overview textarea | `tblRelationships.RelationshipOverview` |
| Collateral Overview textarea | `tblRelationships.CollateralOverview` |
| Bid Conditions | `tblRelationships.ConditionsDeadlines` |

The current OverviewTab layout matches this view 1:1 — only the persistence
(localStorage → relationship-scoped API) needs to change.

## Grid flag panel decoded (all View sheets)

The "Check Box / Bk" columns at the right of every relationship loan grid are
NOT per-loan status — they are a vertical **relationship flag panel**: the
checkbox column binds one tblRelationships flag per row
(`InBankruptcy`, `ForeclosureFlag`, `JudgmentFlag`, `LitigationFlag`,
`LowYieldAsset`), with static labels beside them. This matches the Access
form's BK/FA/FC/JG/LT + Low Yield Asset checkbox stack and confirms the
alignment plan's status remodel: the GUI's per-loan Status column should be
replaced by this relationship-level flag panel.

## Editability — the yellow-cell convention (authoritative)

Cells filled light-yellow (`FFFFFFCC`) in the View sheets are **editable**;
everything else is read-only. 133 marked cells, extracted 2026-08:

**Editable on every view:**
- The relationship selector (`C2`)
- The five relationship flag checkboxes — `InBankruptcy`, `ForeclosureFlag`,
  `JudgmentFlag`, `LitigationFlag`, `LowYieldAsset` (flags are editable from
  ANY tab, not just Overview; `ForbearanceFlag` still unbound per query #3)

**Loan View — the ENTIRE detail panel is editable**, including fields a
conventional model would assume import-owned: all balances (incl.
PrincipalBalance, InterestBalance, EscrowBalance, OtherBalances,
**PayoffBalance**), Rate/DefaultRate/floor/ceiling/margin/index/changefreq,
all dates (**including LastImport**), borrower name + full address block,
consumerloan, PmtFrq(DaysBasis), RateType, AssetType, Unfunded Commitment.
→ The pattern is **grid = read-only summary; detail panel = fully editable**.
Underwriters can correct any loan field; the monthly tape import presumably
overwrites on refresh.

**Collateral View — entire detail panel editable** (~30 fields incl.
Latitude/Longitude, TaxWebCard, IsFloodZone, PossibleEnvironmental,
PropertyComment). Read-only: the collateral summary grid (rows 17-22),
Priority column in the grid (changed via the Increase/Decrease buttons),
MWPropertyNo. Note: row 38 has five empty yellow cells (C38:G38) — an
unbound editable row, purpose unconfirmed.

**Strategies View:** ExitStrategyOverview textarea + ExitCode field.
**Overview View:** the three narrative textareas.
**Task View:** per-card AcctOfficer, Comment, Completed, CompleteDate,
EntryAcctOfficer, EntryDate, and (notably) the task's RelatedLoans reference
— plus the empty new-task entry card. KeyGenerator is never editable.

**Read-only everywhere:** the relationship loan summary grids, MWLoanNo /
KeyGenerator / MWPropertyNo keys, SortNo (displayed on every view header but
editable on none — set elsewhere), hidden plumbing cells, `rowguid`.

## Workbook wiring queries (confirm with author)

1. **Loan View "PmtFrq"** binds `tblLoan.DaysBasis`, not `tblLoan.PmtFrequency` —
   mislabeled UI or intentional?
2. **Collateral View "MwValue" date** (J33) binds `SellerAppraisalDate` while the
   value binds `CurrentAppraisedValue` — expected pair is `CurrentAppraisalDate`.
3. **Flag panel label offset** (all View sheets): the `InBankruptcy` checkbox
   formula sits beside the label "FA", the "BK" label is absent, and
   `ForbearanceFlag` has no row at all. Expected pairing per the Access form:
   BK→InBankruptcy, FA→ForbearanceFlag, FC→ForeclosureFlag, JG→JudgmentFlag,
   LT→LitigationFlag, Low Yield Asset→LowYieldAsset.

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

1. **MWLoanNo is a string, 5–15 chars** — leading zeros (`000005100350710`)
   AND embedded hyphens (`999999-999` pattern) both occur in production; never
   numeric. Seed/test data with 4-digit IDs understates field widths.
2. **RelatedLoans is a ~11-char truncated name** (`HISPANIC PR`) used as a join key —
   renames break joins (see database analysis doc).
3. **Rates are decimal fractions** (`0.045` = 4.5%); the GUI stores percent numbers
   (4.75). The API layer must convert both directions.
4. **Narratives contain CR literals** (`_x000D_`) — normalize line endings on read.
5. **`rowguid`** exists on every table (SQL Server replication) — read-only, never sent
   on update.
6. **Latitude/Longitude exist on CollateralInfo but are 100% EMPTY** (0/290
   rows filled) — the columns are ready but the Report tab map needs a
   geocoding step or manual entry to populate them.
7. **Scale reality:** ~210 relationships, ~248 loans, ~291 properties across multiple
   `ProjectName` deals in one database — the relationship browser needs a project
   filter when real data connects.
