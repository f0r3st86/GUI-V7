# DD.Main Front-End Extraction (from DD.Main.64.FE.accde)

Extracted 2026-08 from the compiled production front-end (13.6MB `.accde`)
using mdbtools + oletools. VBA source is stripped (compiled-only), but the
**289 saved queries survived with full SQL** — the majority of the app's
logic. Complete query corpus: `docs/accde-queries.sql`.

## Application inventory

| Objects | Count | Notes |
|---|---|---|
| Forms | 43 | frmLogin → frmMain → frmLoanView + admin/import/reports |
| Reports | 55 | rptDetail-ByRelationship (the Relationship Report), PostRollUp suite |
| Queries | 289 | Full SQL extracted |
| Modules | 12 | Names only (compiled): CashFlowModules, EarthModules, YahooModules, MWFunctions, BKImport, ImportFromTextFiles… |
| Linked ODBC tables | 54 | incl. tables/views we had not discovered |
| Local tables | 67 | mostly import scratch (Delme*/zzz*) + xtblDocuments, tblMWEarth, zxTblLOCALCurrentProject |

## Newly discovered server objects (not in prior inventory)

**Tables:** `tblTitle` (title orders — the Title half of BPOTitleUCC),
`xTblCFparameters` (cash-flow/projection parameters — the per-loan
projection-settings home), `ztblCFImport`, `ztblLogins` (**app-level login
accounts** — production HAS auth), plus the full lookup family:
`z_CCodes` (collateral advance rates), `zCollateralCodes`, `zExitCodes`,
`zBKStatus`, `zBusCallCodes`, `zCreditScores`, `zOccupancyCodes`,
`zRegionCodes`, `ztblClasses`, `ztblCommentGroups`, `ztblGroups`,
`ztblNAICSCodes`, `ztblSrLienHolders`.

**Views:** `vwPayHistorySpread` (server-side payment pivot), `vwProjections`,
`vwProjectionsNet`, `vwTitleDetail`, `vwBankruptcySummary`, `vwBusinessCalls`,
`vwObligorDetail-All`, `vwObligorList-LoanLevel`, `vwFinancialCMR-Summary`,
`vwFinancialPFS-Summary`, `vwPropertyStmtsSummary`, `vwNonRECollateralPreview`.

## The bidding engine (previously unknown math, now in SQL)

From `aaaBiddingCollateralValueSummary`:

```
rawliqval = Σ max(0, CurrentAppraisedValue − max(0,SeniorLienAmount) − max(0,TaxDelinquentAmt))
adjliqval = Σ max(0, AdvanceRate × CurrentAppraisedValue − max(0,SeniorLienAmount) − max(0,TaxDelinquentAmt))
```

where **AdvanceRate comes from `z_CCodes.Rate` keyed by collateral code,
defaulting to 0.8** when the code has no rate. This is the
collateral-coverage math the React bid features should implement.

`aaaBiddingOverviewSpreadsheet` assembles the full per-loan bid tape:
loan terms + relationship flags + `MaxOfBeaconScore` (best borrower credit)
+ collateral value rollups + ERC budget columns + P12 payments.
`aaaBIDQUERYREVISED-ALLPOOLS` is the export of that tape across pools
(null SortNo sorts as 999). `aaaBidSummaryByLoan` shows a 0.6 × UPB
starting-bid heuristic.

## Trailing-12 payments (P12) window

`zQryLast12MosPayHistory`: `tblPayHistory` has a **period key `pd` =
Year*100+Month**; the window is `pd >= (LastImport shifted back 15 months)`
via `IIf(Month(lastimport)>3, (Year-1)*100+Month-3, (Year-2)*100+Month+9)`.
The React trailing-payment analytics should replicate this exact window.

## Schemas revealed through query column usage

- **tblPayHistory**: ProjectName, RelatedLoans, MWLoanNo, Year, month,
  amount, pd — confirms the React PaymentRecord model and the year×12
  pivot (`QryPayHistorySpread` = Sum(IIf([month]=n,[amount],0)) per month)
- **tblProjections**: LoanNo, Year, month, amount, sect ('income'/'expense'),
  Group — a cash-flow ledger; net = Σ IIf(sect='income', amount, −amount)
- **tblBorrowers**: BorrowerID (PK), ProjectName, RelatedLoans, BorrName,
  SSN, DOB, City, State, BeaconScore, BeaconDate, BKStatus, IsBusiness,
  BusinessCallCompleted…
- **tblBPO**: MWPropertyNo, ProjectName, RelatedLoans, Status
  (Not Ordered/Ordered/Entered/Received/Pending/Canceled per the
  qryAdminBPO-* family), BPOBroker, BPOProvider, VendorOrderDt, CancelDate,
  BPOOrderNum, **plus full subject + 3 sale comps + 3 list comps columns**
  (address/city/state/zip, distance, units, br/ba, sqft, lot, year built,
  condition, DOM, list price, sale price, sale date per comp — see the
  zzzBPOImport/Summit import queries)
- **CollateralInfo.RelPrin** rollup via `qrytblLoanLinkToCollateral`
  (related principal per property — drives BPO/Title ordering priority)

## Key confirmations

- LoanView grid row source formats **Rate×100** for display and orders by
  PrincipalBalance — matching our React LoanTable contract
- `zxTblLOCALCurrentProject` (local) stores the login-chosen project; every
  operational query cross-filters on it — the **project selection happens at
  frmLogin** and scopes the whole session (React parallel: a project picker
  above the relationship browser)
- Vendor comps live in **tblBPO columns**, imported from broker files
  ("Summit" import mapping present) — the React Report tab's comparable
  sales should bind to tblBPO rather than a new tblComparableSales
- `Ah/Bhd` appears in no query and no extractable string — it is a compiled
  form expression or VBA; recover empirically (observed values vs payment
  schedule) or from the `.accdb` master if found

## Implications for the alignment plan

1. Phase 4 export list largely **superseded** — tblPayHistory, tblBPO,
   tblProjections, tblBorrowers schemas now known from query usage;
   remaining gaps are exact types/nullability (the `_schema.csv` from the
   PowerShell exporter still closes those)
2. **New binding targets**: projection settings ↔ `xTblCFparameters`;
   Report-tab comps ↔ `tblBPO` comp columns; Title workflow ↔ `tblTitle` +
   `vwTitleDetail`; lookups ↔ the z* lookup tables (advance rates from
   `z_CCodes` for bid math)
3. **Auth exists in production** (`ztblLogins` + frmLogin + per-project
   scoping) — the React auth design should mirror: login → pick project →
   session scoped to project
