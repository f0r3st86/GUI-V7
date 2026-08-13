# Interface ↔ Database Alignment Plan

What must change in the GUI so it works against the real MidwestDD database.
Produced from a six-way audit of every interface surface against the confirmed
production schema (Architecture workbook exports: tblLoan 54 cols × 247 rows,
tblRelationships 16 × 209, CollateralInfo 57 × 290) and column-level profiling
of the real data.

**Convention decisions (Phase 0 — these keep 95% of the GUI unchanged):**
- The app keeps camelCase fields, percent-number rates, and MM/DD/YY display
  dates. **All unit translation happens in one API mapper layer** (mock today,
  Express later): `Rate 0.045 ↔ intRate 4.5`, ISO date ↔ MM/DD/YY, PascalCase ↔
  camelCase. Applies to Rate, DefaultRate, margin, floor, ceiling (all fractions
  in production — floor/ceiling/margin also change from string to number types).
- `rowguid` is carried read-only on every entity as the stable row identity
  (the RelatedLoans natural key is fragile).

---

## Phase 1 — Structural blockers (do first; everything else builds on these)

### 1.1 Add the Relationship entity (prerequisite for 1.2, 2.1, 2.2)
No Relationship type, mock resource, or hook exists (grep: zero occurrences of
ProjectName/SortNo/LowYieldAsset in src/). Add:
- `Relationship` interface mirroring tblRelationships: `relatedLoans` (PK),
  `projectName`, `sortNo`, `relationshipOverview`, `collateralOverview`,
  `conditionsDeadlines`, `exitStrategyOverview`, `originalStrategy`, `exitCode`,
  `inBankruptcy`, `foreclosureFlag`, `litigationFlag`, `forbearanceFlag`,
  `judgmentFlag`, `lowYieldAsset`, `rowguid`
- `relationshipApi` in mockApi + `useRelationships()`/`useUpdateRelationship()`
- Seed data for Haskell + Coastal

### 1.2 Remodel loan status — tblLoan has NO Status column
The GUI's per-loan PA/FA/FC/JG/LT status (`Loan.status`, edited in
LoanInfoColumn, colored in LoanTable) does not exist in production. The
distress flags are six stored booleans on tblRelationships. Also fix the
semantic clash: the Loan tab select defines FA = "Fully Performing" (green)
while OverviewTab treats FA = Forbearance (red).
- OverviewTab flags (OverviewTab.tsx:87-94) and RelationshipBrowser flags
  (:68-72) stop deriving from loan statuses → read stored bits from
  `useRelationships()`; add the missing **LowYieldAsset** chip
- LoanTable's Status/Bk column reads relationship flags (workbook binding)
- Loan detail Status select becomes display-only or is removed from persistence

### 1.3 Re-key collateral by MWPropertyNo; relationship-level linkage
- `Collateral.id` (synthetic, client-minted) → `mwPropertyNo` (production INT,
  server-owned; real range 372066–400944)
- Replace the boolean-matrix junction (`CollateralLoanRelationships`) with
  columns on the record: `relatedLoans` (primary linkage — collateral belongs
  to the relationship) + optional `mwLoanNo` (secondary)
- Collateral grids populate by `relatedLoans === currentRelationship`
- Re-key Report tab photos/locations from synthetic id → mwPropertyNo

### 1.4 Data-shape hardening (from profiling 247 real loans)
- **MWLoanNo**: lengths **5–15** chars, leading zeros AND embedded hyphens
  (`999999-999` pattern in 14 rows). Add `validateMWLoanNo` (digits + hyphen,
  max 15, never parseInt). Good news: audit confirmed zero numeric coercion
  exists today — fix is validation + seed/test data + input widths only.
- **Zip**: string with `^\d{5}$` — production already lost leading zeros in 4
  rows from a past numeric conversion; don't repeat it.
- **EscrowBalance can be negative** (−100,198 observed) — no ≥0 validation.
- **Dates**: all production datetimes are midnight-only → treat as DATE;
  CurrentMaturityDate contains 1999-01-01 sentinels and 2058 values.
- Seed data: replace 4-digit loan numbers with realistic 15-char strings, add
  `projectName`, convert collateral money fields from comma-strings to numbers.

## Phase 2 — High priority

### 2.1 Narratives move from localStorage to relationship-scoped data
**Confirmed bug**: OverviewTab and StrategiesTab each use ONE global
localStorage key — every relationship shares the same text. Bind to the
Relationship entity fields (RelationshipOverview / CollateralOverview /
ConditionsDeadlines / ExitStrategyOverview) via mutation with debounce.

### 2.2 Relationship identity in the browser
Add SortNo (default sort, per workbook header) and ProjectName column +
project filter to RelationshipBrowser. Sort within project by SortNo.

### 2.3 Make the mock/real API seam functional
`src/api/index.ts` re-exports mocks directly (shadowing the switch) and
`client.ts` ignores `isMockMode`. Fix so `VITE_API_URL` actually selects the
implementation — this is the single integration point for the future backend.

### 2.4 Grid ordering + read-only enforcement
- LoanTable + mock getAll: order relationship loans by principal descending
  (workbook SORTBY contract)
- **Editability policy confirmed by the workbook's yellow-cell convention**
  (see UI-DATA-BINDINGS.md "Editability"): detail panels are FULLY editable —
  including LastImport and PayoffBalance — while summary grids, key fields
  (MWLoanNo/MWPropertyNo/KeyGenerator), SortNo, and rowguid are read-only.
  Add `payoffBalance` as an editable field (not server-computed as previously
  assumed); keep the GUI's computed four-balance "Total" as a separate
  display. Enforce read-only only on: keys, rowguid, SortNo (set elsewhere),
  and grid cells.

### 2.5 Missing loan fields
`consumerLoan` checkbox, PayoffBalance display; collapse the duplicate
lastPmt/lastPdt fields (both bind LastPmtDt); drop `notDue`, `change`, `ahBhd`,
`selected`, `status` from the Loan type/seeds (no production columns).

## Phase 3 — Medium

- **Collateral fields the workbook UI shows but GUI lacks**: Priority (+
  Increase/Decrease Priority reorder buttons — first-class operation),
  OwnerName, PropertyComment, PossibleEnvironmental (tri-state), IsFloodZone,
  RealEstateGroup, TaxWebCard, TaxStatementDate, Latitude/Longitude inputs
- **Drop unbound GUI fields**: listPrice, daysOnMarket, yearBuilt; move
  bpoValue/bpoDate toward tblBPO (export needed); keep appraisedDate/
  ourValueDate bound to CurrentAppraisalDate/SellerAppraisalDate
- **Lookup lists mined from real data** (seed as constants/dropdowns):
  - ExitCode (11 values, lives on tblRelationships — tblLoan.ExitCode is empty):
    BK Performing, Forbearance, Liquidation-Full, Liquidation-Partial,
    PAA to Mat, PAA w/Haircuts, PAA/DPO, PAA/Prepay, Restruct/Extend,
    Settlement, ZERO BID
  - Pool (12 alphanumeric values: 1, 100, 100A-C, 200, 200A-C, 300, 400, 900 —
    string, not number)
  - RateType: Fixed/Variable only (case-inconsistent in data — normalize)
  - MWCollateralCode: 25 values (has near-dupes to reconcile)
  - Rate index: 25 free-text values with typos ('Tresuary') — curate to a
    lookup, flag for data cleanup
- Type the test factories (`createMockCollateral` etc.) so tests catch drift

## Phase 3.5 — Tasks tab is now fully specified (unblocked 2026-08)

The Architecture workbook now includes the `tblTasks` export (13 cols, 206
rows) and a wired Task View. The "Coming soon" Tasks tab can be built for
real: task cards (Task For / Entered By / Date / Comment / Complete +
CompleteDate) filtered by relationship, ordered by EntryDate, with a
perpetual empty entry card at the bottom (author's spec note). Add a `tasks`
mock resource + `useTasks()` hooks keyed by `KeyGenerator`. Note EntryDate
carries real times (unlike every other date column) and tasks may reference
a specific `MWLoanNo`.

## Phase 4 — What to export next (extends the Architecture workbook)

Priority-ordered; each unblocks a GUI surface currently built on guesses:

| # | Export | Unblocks | Risk if skipped |
|---|---|---|---|
| 1 | `tblBorrowers` (37 cols) | Borrower tab (~70% unverified) | blocker |
| 2 | `tblBorrowerLookup` | Borrower↔loan junction (GUI shape diverges) | blocker |
| 3 | `tblPayHistory` | PayHist grid + trailing analytics + bid P12 | blocker |
| 4 | `tblProjections`, `tblSSBid`, `tblSSObligor` | Projections tab (22 settings + 15 bid metrics unmapped) | high |
| 5 | `tblcomments` | Comment tab (PK/type domain unconfirmed) | high |
| 6 | `tblBPO` | MaxBPO column + Report valuation chart | medium |
| 7 | View definitions (vw*Summary) | Confirms read-path binding | low |

Also: **Latitude/Longitude are 100% empty in production** (0/290 rows) — the
Report tab map needs a geocoding step (or manual entry) regardless of schema.
tblPropertyPhotos / tblComparableSales still need to be created (greenfield DDL
in create_tables.sql).

## Notable data-quality findings (for the workbook author / data owner)

1. 13 orphan rows: 1 tblLoan + 12 CollateralInfo reference RelatedLoans values
   missing from tblRelationships
2. Rate outlier: one loan at 0.721 (72.1%) — likely entry error
3. 27 columns are 100% empty (incl. CreditScore, Times30/60/90, DaysBasis,
   SSN on tblLoan) — types can't be inferred; need the sys.columns export
4. Workbook wiring queries still open: PmtFrq→DaysBasis; MwValue date→
   SellerAppraisalDate (see UI-DATA-BINDINGS.md)
