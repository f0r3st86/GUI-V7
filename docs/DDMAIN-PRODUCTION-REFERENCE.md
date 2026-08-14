# DD.Main Production Reference — the definitive front-end specification

**Source**: `DD.Main.64.FE.accde` (compiled production Access front-end, 13.6 MB, assembled
2023-05-17, last production login 2025-10-22), a loan due-diligence application over SQL Server
database **MidwestDDi** via ODBC DSN **sqlDueDiligence**. VBA source is compiled out, but this
document reconstructs the application from what survives: all 289 saved queries, the per-form/
per-report structure string tables in the UTF-16 dump (record sources, control inventories,
row-source SQL, value lists, captions, defaults, formats), the embedded VBA string constants
(every dynamic SQL statement and MsgBox), the ODBC prepared-statement cache (bound-table
schemas + concurrency model), and MSysObjects (full object inventory + link metadata).

This file supersedes and extends `docs/ACCDE-EXTRACTION.md`. A developer rebuilding DD.Main
(in Access VBA or React) can work from this document without reopening the accde.
Personal names in captured SQL literals are redacted as `<name>`; a logged-in user's initials
as `<initials>`. Project names (e.g. `USBank.May.2008`, `Deutsche.FDIC.Oct.2009`,
`Hilltop.BCB.Q3.2026`) are retained.

**Object inventory**: 43 forms · 55 reports · 289 queries · 12 modules (names only; compiled)
· 54 ODBC linked tables/views · 67 local tables (40 application + 27 system artifacts) ·
1 macro (`~TMPCLPMacro`, a compiler temp — there is **no AutoExec**; everything is VBA).

**Headline recoveries** (previously unknown or declared unrecoverable):
- The **Ah/Bhd formula** — a bound expression on frmLoanDetail, not compiled VBA (§5.8).
- The full **ztblLogins auth schema** with multi-axis per-user permissions (§1.2).
- The complete **BPO and Title status machines** with exact UPDATE templates, sentinel dates,
  and First/Second/Third duplicate slots (§3.4, §3.5).
- The **tblPropertyStatements 7-scenario valuation model** and its delete-and-rewrite save (§3.8).
- The **server-TVF-driven statement-rendering pipeline** with data-driven styling flags (§6.4).
- **`upsize_ts` rowversion optimistic locking on every bound UPDATE/DELETE** (§3.1).

---

## Sentinel & convention glossary (used throughout)

| Sentinel | Meaning |
|---|---|
| `#09/09/1999#` (also `#09/09/99#`) | placeholder date on freshly created BPO / Title / financial-statement rows ("not yet really ordered/dated"); queries match it exactly to find fresh orders |
| `Priority = 888` | temp slot during a priority swap (collateral on LoanView, liens) |
| `Priority = 9119` | temp slot during a priority swap (collateral popup / admin flavor) |
| `Priority = 88` | newborn financial-statement stub before resequencing |
| `'ZZZ'` prefix on ProjectName / RelatedLoans / AcctOfficer | soft-delete namespace — rows stay on the server, out of project scope |
| `'First' / 'Second' / 'Third'` (tblBPO.BPOBroker) | the three duplicate-order slots per property (max 3 concurrent BPOs) |
| `'LO-BPO' / 'LO-Title'` | pseudo-vendors stamped on loan-officer orders until admin assigns a real vendor |
| `MWLoanNo = RelatedLoans` (tblcomments) | a comment row whose loan number equals the relationship key is a **relationship-level comment** |
| `'**Show All**'` | a real row in ztblCommentGroups (filter combos include it and default to it; the editor's category picker excludes it); admin filters use single-asterisk `*Show All*` |
| `'**ADDED**'` (CollateralInfo.RealEstateGroup) | hand-added (not imported) collateral |
| `999` | Null SortNo sorts to the end (`IIf([sortno] Is Null,999,CDbl([sortno]))`) |
| `'[NEW BORROWER RECORD]'` | placeholder BorrName on a freshly inserted obligor |
| `'DueDil'` (tblProjections.Group) | the budget scenario group exported to the bid tape |
| long numeric literals (`111000111000`, `1234589754326`, …) | impossible-key placeholders in VBA SQL scaffolds / no-selection probes |

---

# 1. Application map

## 1.1 Startup & shell

- Startup is driven by database properties: **`StartUpForm = frmLogin`**, `AppTitle =
  "Midwest Due Diligence Database"`, plus the standard lockdown set (StartUpShowDBWindow,
  AllowFullMenus, AllowSpecialKeys, etc. all restricted). **No custom ribbon** (CustomRibbonID
  property exists but no ribbon XML/USysRibbons) — UI chrome is plain forms.
- Only two embedded UI macros exist, both `cmdExit → CloseWindow`; every other event is
  `[Event Procedure]` compiled VBA. 38 of 43 forms have code-behind classes.
- Branding: `MW-BW.bmp` logo + label "Due Diligence Review" (Copperplate Gothic Bold) on
  frmLogin and frmMain. Reports print via a PDF printer driver plus office devices.

## 1.2 frmLogin — authentication + project pick (one form, one gesture)

Controls: `UserID` ("UserName:"), `Password` ("Password:"), `BtnLogin` "Login", `Command4`
"Exit", header "USER LOGIN", and **`cboCurrentProject`** ("Project:") — row source
`SELECT tblProjects.ProjectName FROM tblProjects ORDER BY [ProjectName]`.

**Auth algorithm** (recovered verbatim from VBA strings):
1. `Select * from ztblLogins WHERE ztblLogins.initials='<UserID>'`
2. no row → "UserName not found"
3. plaintext password compare → "Password Incorrect!" (the prepared SELECT pulls the Password
   column to the client)
4. `AcctDisabled` check; restricted destinations → "Unauthorized Access Attempted"
5. `LastLogin` stamped via the bound prepared UPDATE
   (`…"LastLogin"=?… WHERE "Initials" = ? AND "upsize_ts" = ?` — optimistic lock even here)

**ztblLogins full schema**: `Initials (PK), Password, AcctDisabled, Name, LastLogin, Class,
ReportAccess, MasterAccess, PoolRestrictions, InvestorRestrictions, LoanFormEditLevel,
DocInventoryEditLvl, LBDMasterAccess, upsize_ts, rowguid`. Production authorization is
**multi-axis**: report access, master/admin access, pool-level and investor restrictions,
per-form edit levels, and a flag for a sibling "LBD" application. A second permission table
`ztblGroups (Group, Description, EditLevel, ViewLevel, GSortOrder)` carries group-level
view/edit levels. ODBC itself uses Windows trusted auth; ztblLogins is app-level auth on top.

**Session bootstrap on success**:
- `Delete * from zxTblLOCALCurrentProject` then
  `Insert into zxTblLOCALCurrentProject (CurrentProject) SELECT '<proj>' as CP` — the
  single-row local scope table that **51+ of the 289 saved queries join** to filter everything.
- **Rewrites six pass-through queries to the chosen project**:
  `qryDDCollateralDataCurrentProject` → `exec dbo.uspDDReportFilteredCollateral '<proj>'`;
  same pattern for `…Payhistory`, `…BPOTitle`, `…Projections`; and
  `qryUDFFinancialCMRDetail` → `SELECT * FROM [dbo].[udfFinancialCMRDetail]('<proj>')`,
  `qryUDFPropertyStmtDetail` → `[dbo].[udfPropertyStatementsDetail]('<proj>')`.
  Four stored procedures + two table-valued functions are the server-side report data layer.
- **Link health/repair** against two merge-replicated servers:
  `Server=Midwest-azdata[.midwest-fac.com];DATABASE=MidwestDD` (location literal "KansasCity")
  and `Server=Midwest-rocdata[.midwest-fac.com];DATABASE=MidwestDDi` ("Rochester"). VBA reads
  the machine's live DSN target from the registry via WMI
  (`SOFTWARE\ODBC\ODBC.INI\sqlDueDiligence`), compares it with local
  `xtblLOCALLastLocation.LastLoc`, and relinks all 54 tables if they differ
  ("Table links refreshed successfully." / failure: "Network Adapter Error. Links not
  optimized…"). Every table carries `rowguid` + `upsize_ts` and an `MSmerge_index` appears in
  index catalogs ⇒ the two servers are SQL Server **merge-replication partners**.
- **Screen restore**: frmLogin reopens the form recorded in `xtblLOCALLastLocation.LastLoc`
  (written whenever the user jumps back to login). Its Select-Case still handles legacy
  destinations (frmPerformance, frmDisplayPoolPerf, frmInvestorPerformance, frmImport,
  frmSSBidDataCollection) that no longer exist in this FE — gated by the ztblLogins flags.

## 1.3 frmMain — the menu

Unbound; two state controls — `txtCurrentProject` (referenced by 30+ queries/forms as
`Forms!frmMain!txtCurrentProject`) and `lblLoginID` (logged-in initials) — plus:

| Button | Caption | Target |
|---|---|---|
| btnLoanView | VIEW LOANS | frmLoanView |
| cmdDDReports | DUE DILIGENCE REPORTS | frmDueDiligenceReports |
| cmdBPOAdminMain | BPO ADMINISTRATION | frmBPOAdmin |
| cmdTitleAdmin | TITLE ADMINISTRATION | frmTitleAdmin |
| btntaxcalls | TAX CALLS | frmTaxCall |
| btnBusinessCalls | BUSINESS CALLS | frmBusinessCalls |
| frmBKSearch | BK SEARCHES | frmBKSearches |
| cmdRptTasksOpen | VIEW TASKS | rptTasksByProject |
| cmdOpenPoolView | PROJECT LEVEL INFORMATION | frmProjectDetail / frmPoolDetail |
| cmdOpenCFForm | PROJECT MAINTENANCE | xFrmCashFlowParams (guard: "Cash flow parameters have not been set for this project. Please contact the Director of Due Diligence for resolution.") |
| cmdMakeBidSS | Make Bid Spreadsheet | exports `aaaBIDQUERYREVISED-ALLPOOLS` |
| btnPerformance | ANALYSIS/STATISTICS | legacy performance forms (dead refs, not in this FE) |
| btnBackToLoginScreen | LOGIN | saves LastLoc, reopens frmLogin (project/user switch) |
| cboDocumentsOnOff | Documents On/Off ("On";"Off", default **Off**) | gates the Documents-tab folder scan |
| btnQuit | EXIT | quit |

## 1.4 Navigation map

```
startup (StartUpForm property; no AutoExec)
  └─ frmLogin ── auth ztblLogins ── project pick ⇒ zxTblLOCALCurrentProject
       │          rewrite 6 pass-throughs · relink check (2 servers) · restore LastLoc
       ▼
     frmMain (txtCurrentProject, lblLoginID)
       ├─ VIEW LOANS ───────────► frmLoanView (13-tab workspace)
       │     ├─ Relationship Report ► rptDetail-ByRelationship
       │     ├─ Order BPO / BPO entry ► frmBPOInput (one property + duplicate slot)
       │     ├─ Order Title / New Title ► tblTitle inserts; edit ► frmTitleUpdates(+Sub)
       │     ├─ Enter New Financials ► frmFinancials (CMR/PFS popup)
       │     ├─ Open Projections Form ► frmProjectionsNew (+ 3 ERC grids)
       │     ├─ View/Edit Property Stmts ► frmPropertyStatements
       │     └─ View Satelite Map ► EarthModules Google-Maps page (tblMWEarth)
       ├─ DUE DILIGENCE REPORTS ─► frmDueDiligenceReports ─► rpt* suite
       │     └─ DD REPORT EXPORT ► frmDDReportExport ─► per-rel PDFs (<Rel>.DD_ASR.pdf)
       ├─ BPO ADMINISTRATION ────► frmBPOAdmin (batches via xtblBPOSelected)
       ├─ TITLE ADMINISTRATION ──► frmTitleAdmin (batches via xtblTitleSelected)
       ├─ TAX CALLS ─────────────► frmTaxCall(+Sub)      [works straight off frmMain]
       ├─ BUSINESS CALLS ────────► frmBusinessCalls(+frmSubformBusinessCall)
       ├─ BK SEARCHES ───────────► frmBKSearches
       ├─ PROJECT LEVEL INFO ────► frmPoolDetail / frmProjectDetail
       ├─ PROJECT MAINTENANCE ───► xFrmCashFlowParams
       │     ├─ Import Deal ► frmImportNewProject     ├─ Move Loans ► frmMoveLoan-Admin
       │     ├─ Delete Loans ► frmAddDeleteAdmin      ├─ Archive ► exec uspArchiveDDData
       │     └─ Set Sort Numbers / Cut-Off Comparison / ConvertDD Pay History
       └─ LOGIN ─────────────────► save LastLoc, reopen frmLogin
```

Dependency direction: **frmMain scopes the side doors** (tax/business calls, BK, admin
consoles, reports) via `txtCurrentProject`; **frmLoanView scopes everything loan-level** via
its unbound footer controls. frmMain must stay open under frmLoanView (classic Access modal
stack: Login → Main → LoanView → popups).

## 1.5 The local state system (per-user FE tables)

| Table | Role |
|---|---|
| `zxTblLOCALCurrentProject` (CurrentProject Text50, single row) | THE session scope; written only at login; joined by 51+ queries |
| `xtblLOCALLastLocation` (LastLoc Text30, single row) | server-location memory for the relink engine + last-screen restore |
| `zzzTableNameTEMP` | relink working set — snapshot of parsed MSysObjects.Connect (via saved query `zzzQryTableListforLinkUpdates`) |
| `zxtblFilterMasterRpt` (ProjectName, SortID) | user-typed SortNo pick list for the FILTERED master report |
| `xtblBPOSelected` (ID, MWPropertyNo, Status, ProjectName, BPOBroker) | BPO-admin multi-select batch buffer |
| `xtblTitleSelected` (ID, MWPropertyNo, ProjectName) | Title-admin multi-select batch buffer |
| `xtblTitleSponsor` (TitleType, Sponsor, SortOrder) | seeded lookup: maps tblTitle.Source → Sponsor ('Midwest' = internally sponsored title work) |
| `ztblDeedStatusCodes` (Order, DeedStatusCode(1), DeedStatusDescription) | seeded lookup for the lien grid's Deed Status combo |
| `xtblLOCALFinancialCMRDetail` / `xtblLOCALPropertyStmtDetail` | delete-all/refill snapshots of the two server TVFs, carrying per-row styling flags (§6.4) |
| `xtblDocuments` (FileName, FileDescription, FileType, FileDate, FilePath) | transient folder-scan cache for the Documents tab |
| `tblMWEarth` (RelatedLoans, LoanNo, Priority, Borrower, Description, Address, City, State, Zip, Latitude, Longitude, Precision — all lat/long as Text) | geocode cache (persists between sessions) |
| `ZZZDelme{Project,Pool,Loan,Relationship,Borrower,Collateral}` | new-deal import staging (§3.6) |
| `zzzBPOImport` (149 cols) / `aaBPO` (231 cols) | BPO vendor-file import staging: generic layout / Summit raw layout |
| `Delme*_ImportErrors` ×18, `delmelns`, `delmelns2` | residue — do not recreate |

Every local table exists because each user runs a private FE copy — in a multi-user rebuild
these become session state or direct service calls; only `tblMWEarth` and the two seeded
lookups hold durable data worth migrating.

## 1.6 Cross-form reference graph (Forms!X!Y)

- **frmMain!txtCurrentProject** ← frmLoanView header/footer, frmBKSearches, frmBusinessCalls,
  frmTaxCall(+Sub), frmBPOAdmin!txtProjectName, frmTitleAdmin!txtCurrentProject,
  frmDueDiligenceReports!txtproject, frmFilteredMasterRpt-RowSrc default, xFrmCashFlowParams,
  rptBlankFileReview query.
- **frmLoanView!{ProjectName, RelatedLoans, MWLoanNo}** ← all 13 tab child queries
  (`~sq_cfrmLoanView~sq_c*`), `~sq_ffrmBPOInput`, `~sq_ffrmPropertyStatements`, frmTasks
  defaults, frmPayHistSub defaults, the lien grid's MWLoanNo combo.
- **frmLoanView!{txtPropNo, lstCollForPropinfo, lstFinancial, txtMWPropertyNo,
  txtBPODuplicate}** ← property statements editor, lstPropertyInfo, lstFinancialItems,
  frmBPOInput record source.
- **frmLoanView!frmLoanDetail.Form!{MWLoanNo,…}** ← `zQryCurrentLoanERC` (the only
  sub-form-path reference; feeds the projections engine).
- **frmFinancials!{txtRelatedLoans, txtBorrowerID}** ← txtBorrowerName lookup.
- **frmTitleUpdates!{ProjectName, RelatedLoans, MWPropertyNo, TitleID}** ← tblLiens grid.
- **frmProjectionsNew!{cboGroup, txtEditGroup, cboType, cboBeg/EndMonth, cboBeg/EndYear}** ←
  the runtime projection edit SQL.
- **frmDueDiligenceReports!txtReportDate** ← the entire PostRollUp / ZFiltered comment filter.

## 1.7 Dead references — the wider app family

Names in compiled VBA with no matching object: `frmPerformance`, `frmDisplayPoolPerf`,
`frmInvestorPerformance`, `frmImport`, `frmSSBidDataCollection`, `frmBPOTitleImport`,
`frmBPOTitleAdminMain`, `rptTasks`, `rptBPOOrderStatus`, `rptBPOStatusMissing`. Their support
links remain attached (tblSSBid, tblSSObligor, tblInvestors, tblASRThisServer — all dormant).
`frmProperty` binds a nonexistent `tblProperty`. `ztblLogins.LBDMasterAccess` + "LBD" naming
= a sibling application shares the login table. A legacy connect string
`ODBC;DATABASE=Midwest;DSN=sqlMidwest` (with a call to `sp_testanddelme`) is dead code from a
prior servicing-system integration.

---

# 2. Forms reference (43 forms)

## 2.1 Inventory

| # | Form | Role | Record source |
|---|------|------|------|
| 1 | frmLogin | login + project pick | unbound |
| 2 | frmMain | main menu | unbound |
| 3 | frmLoanView | THE tabbed workspace | unbound (header pickers + footer state) |
| 4 | frmLoanDetail | Loan tab subform | tblLoan.* ⋈ tblRelationships, filtered on frmLoanView keys |
| 5 | CollateralDetail | Collateral tab subform | CollateralInfo.* |
| 6 | frmObligorSub2 | Obligor tab subform | tblBorrowers.* |
| 7 | frmBorrowerLookup | loan↔borrower link grid | tblBorrowerLookup filtered on frmLoanView |
| 8 | FrmCommentsSub | Comment tab editor | tblcomments filtered on frmLoanView |
| 9 | frmPayHistSub | PayHist entry grid | tblPayHistory filtered on frmLoanView |
| 10 | frmRelatedStrategy | Strategies tab subform | tblRelationships (exit-strategy cols) |
| 11 | frmTasks | Tasks tab subform | tblTasks filtered on frmLoanView, DueDate DESC |
| 12 | frmOverview | Overview tab subform | tblRelationships (overview memos) |
| 13 | frmPropertyStatements | property-stmt editor popup (added 5/23/23) | CollateralInfo header + tblPropertyStatements via VBA |
| 14 | frmProperty | legacy NOI/cap-rate mini form | tblProperty (nonexistent — dead form) |
| 15 | frmCollateralPopup | collateral view/edit popup | CollateralInfo.* |
| 16 | frmBPOInput | BPO full entry (subject + 6 comps) | tblBPO filtered on frmLoanView keys + txtBPODuplicate |
| 17 | frmFinancials | financials container popup | unbound |
| 18 | frmFinancialCMR | commercial stmt subform | tblFinancialCMR |
| 19 | frmFinancialPFS | personal PFS/1040 subform | tblFinancialPFS |
| 20 | frmProjectionsNew | cash-flow projections editor | unbound |
| 21–23 | frmCurrentLoanERC-{Income,Expense,Total} | ERC pivot grids | zQryCurrentLoanERC{Income,Expense,Total} |
| 24 | xFrmCashFlowParams | PROJECT MAINTENANCE panel | xTblCFparameters |
| 25 | frmTaxCall | tax-call worklist | unbound (List3 + subform) |
| 26 | frmTaxCallSub | tax-call detail | CollateralInfo (RE only, by List3) |
| 27 | frmBKSearches | BK search worklist | tblBorrowers ⋈ tblRelationships(SortNo), by frmMain project |
| 28 | frmBusinessCalls | business-call worklist | tblborrowers by frmMain project |
| 29 | frmSubformBusinessCall | business-call detail | tblBorrowers |
| 30 | frmBPOAdmin | BPO admin console | unbound (qryAdminBPO-* lists) |
| 31 | frmCollateralAdminBPO | BPO admin datasheet sub | CollateralInfo.* |
| 32 | frmTitleAdmin | Title admin console | unbound (qryAdminTitle-* lists) |
| 33 | frmCollateralAdminTitle | Title admin datasheet sub | CollateralInfo.* |
| 34 | frmTitleUpdates | title record editor popup | tblTitle |
| 35 | frmTitleUpdatesSub | liens grid | tblLiens filtered on frmTitleUpdates 4-part key |
| 36 | frmMoveLoan-Admin | move loan/collateral/borrower/comment | unbound |
| 37 | frmAddDeleteAdmin | delete loan / delete pool | unbound |
| 38 | frmImportNewProject | run new-project import | unbound |
| 39 | frmPoolDetail | pool bid-tracking editor | tblPools (all 28 cols) |
| 40 | frmProjectDetail | project header editor | tblProjects ⋈ zxTblLOCALCurrentProject |
| 41 | frmDueDiligenceReports | report launcher menu | unbound |
| 42 | frmFilteredMasterRpt-RowSrc | sort-filter entry sub | local zxtblFilterMasterRpt |
| 43 | frmDDReportExport | per-relationship PDF export (added 5/19/23) | unbound |

**`~sq_` naming convention**: hidden query `~sq_c<Form>~sq_c<Control>` = row/record source of
that control; `~sq_f<Form>` = the form's own record source; `~sq_r<Report>` /
`~sq_d<Report>~sq_d<Sub>` = report record sources / subreport link stubs. 45 control queries,
12 form record sources, 18 report record sources, 137 subreport stubs are registered.

## 2.2 frmLoanView — the workspace (deep)

Unbound. **FormHeader**:
- `RelatedLoanLookup` combo — `SELECT RelatedLoans, MWLoanNo, Format(Sum(PrincipalBalance),
  '$#,##0') AS Principal, SortNo, BorrowerNm FROM tblLoan LEFT JOIN tblRelationships …
  HAVING ProjectName=Forms!frmMain!txtcurrentproject ORDER BY BorrowerNm`.
  Guard: "You must first select a relationship to activate the loanview form."
- `LstRelatedLoans` — the loan grid: ProjectName, RelatedLoans, MWLoanNo, BorrowerNm, Orig
  Balance, Principal, Interest, **`Rate*100` IntRate, `DefaultRate*100` DRate**, Pmt, NxtDue,
  LastPmt, Orig Dt, Mat Dt FROM tblLoan filtered on the active relationship,
  `ORDER BY PrincipalBalance DESC`. (The production summary grid also binds
  **vwRelationshipSummary**, which adds server-computed `amtpd` — see §4.3/§5.10.)
- `cmdMainMenu1` "Main Menu", `cmdDetailRelRpt` "Relationship Report"
  (→ rptDetail-ByRelationship), `SortNo` ("Sort:").

**Footer — the activation state** ("Items Currently Activated:"): unbound `ProjectName`
(default `[Forms].[frmMain].[txtCurrentProject]`), `RelatedLoans`, `MWLoanNo`, `Priority`,
`BorrName`, `BorrowerID`, `LoanNm`, `LoanNo`, `txtPropNo`, `txtMWPropertyNo`,
`txtBPODuplicate`, `txtCurrentTitleRecord`, `txtKeyProvision`, `txtSource`/`txtSourceDate`,
plus relationship-flag checkboxes `CheckRelBK/FA/FC/JG/LT` (InBankruptcy, ForbearanceFlag,
ForeclosureFlag, JudgmentFlag, LitigationFlag) and `chkLowYldAsset` "Low Yield Asset" — each
writing `Update tblRelationships Set <flag> = <b>` immediately. **This footer IS the app's
current-record state machine** — every subform/list criteria chain hangs off these unbound
controls, not off bound recordsets.

**Tab control `TabCtl6`** — 13 pages in stored order:
`Loan · Collateral · Obligor · Comment · BPOTitle (caption "BPOTitleUCC") · PayHist ·
FinStmts · Projections · Strategies · Tasks · Overview · Documents · Property`.

| Page | Contents |
|---|---|
| **Loan** | subform `frmLoanDetail` (§2.3) |
| **Collateral** | subform `CollateralDetail` (§2.4) + `LstCollateral` (CollateralInfo LEFT JOIN tblBPO with SellerValue + `Max(SubjSalePrice) AS MaxBPO`, ORDER BY Priority). Add/delete/reorder collateral buttons (§3.2) |
| **Obligor** | subform `frmObligorSub2` + `lstObligors` (tblBorrowers cols through BKStatus) + subform `frmBorrowerLookup` + `cmdRelateObligor` "Relate Obligors" ("Ctrl click to highlight multiple selections.") |
| **Comment** | `lstComments` — VBA-built: `SELECT …, Left([Comment],150) AS [Comment Detail] FROM tblcomments WHERE RelatedLoans='…' AND ProjectName='…' ORDER BY Date DESC`, or `ORDER BY Group, KeyProvision` when the `CommentFilter` combo (ztblCommentGroups, default `**Show All**`) is set; subform `FrmCommentsSub`; `cmdNewComment` "New Comment". Guard: "You must first activate a Relationship and LoanNo before entering a Comment." |
| **BPOTitle** | `LstBPOs` (design placeholder `SELECT 'nothing' as field1`; runtime `SELECT ProjectName, RelatedLoans, Priority, MWPropertyNo, VendorNo, BPODate, BPOBroker, Address, SubjSalePrice, SubjQuickSale, SubjListPrice, Status FROM tblBPO … ORDER BY BPODate, BPOBroker`, caption "BPO's (Double click to view OR click below to order or enter a new BPO)"); `LstCollateralItems` ("All Collateral:"); `lstTitleFilter` (runtime tblTitle list); `cmdOrderBPO` "Order BPO", `CmdOrderTitle` "Order Title", `cmdNewTitle` "Create New Title Record" (+ `txtSource` combo from xtblTitleSponsor, `txtSourceDate`) — full flows in §3.4/§3.5 |
| **PayHist** | subform `frmPayHistSub` + `LstPayHistorySpreadSub` (QryPayHistorySpread pivot JAN–DEC + TOTAL, `$#,##0`) + `PayHistoryComment` textbox (writes `Update tblLoan Set PayHistoryComment='…'`). Guard: "You do not currently have a loan selected…" |
| **FinStmts** | `lstFinancial` ("Obligors:", tblBorrowers for the relationship); `lstFinancialItems` (runtime from server view `vwlstFinancialItemsRowSrc`: `IIf([StmtType]='Commercial',[CompanyName],[PFSName]) AS SubjectName` + type-switched date/priority, ORDER BY StmtType, date DESC, priority); `cmdAddNewFinancials` "Enter New Financials" (§3.7); `cmdDeleteFinancials` "Delete Selected Record" |
| **Projections** | `CFLikelyhood` combo (2 Very Optimistic … −2 Very Pessimistic); `btnOpenProjForm` "Open Projections Form" → frmProjectionsNew |
| **Strategies** | subform `frmRelatedStrategy` + `lstCFSummary` (qrylstCFSummaryRowSrc — per-loan TotalCF; "If a related loan does not appear above then no cash flows have been entered for that loan.") |
| **Tasks** | subform `frmTasks`, master/child `ProjectName;RelatedLoans` |
| **Overview** | subform `frmOverview` |
| **Documents** | `lstDocuments` bound to local xtblDocuments (folder scan gated by frmMain's Documents On/Off) |
| **Property** | `lstCollForPropinfo` ("CollateralInfo:", incl. CoStar Rents/Vac/Cap, pipe-concatenated address, ORDER BY Priority); `lstPropertyInfo` ("PropertyStatementsSummary:", `vwPropertyStmtsSummary` — EGI/OpEx/NOI/CapRate/AdjVal + per-SF/per-unit ratios, WHERE MWPropertyNo = lstCollForPropinfo, ORDER BY SortNo); `cmdViewEditPropStmts` "View / Edit Property Stmts" (guard: "You must first activate a Collateral item before editing the property statements.") |

## 2.3 frmLoanDetail (Loan tab)

Record source: `SELECT tblLoan.* FROM tblLoan LEFT JOIN tblRelationships … WHERE
ProjectName/MWLoanNo/RelatedLoans = Forms.frmLoanView.…`. Controls (name = bound column;
caption in quotes): MWLoanNo "LoanNo", ProjectName "Project", Pool, RelatedLoans "Related",
BorrowerNm + address block, OrigPrincipalBalance "OrgBal", PrincipalBalance "PrinBal",
InterestBalance "IntBal", EscrowBalance "EscBal", OtherBalances "OthBal", PayoffBalance
"Payoff", RepayAmt "PmtAmt", EscrowPmt "EscPmt", LastPmtDt "LastPDt", DueDt "Due Dt",
OrgNoteDate "Orig Dt", CurrentMaturityDate "Mat Dt", LastImport "LastIm", InterestAccrualDate
"IAcc Dt", Rate (Percent), DefaultRate "DefR", floor, ceiling, margin, nextchangedt "ChDt",
index, **`Text44` = the Ah/Bhd computed control** (§5.8), RateType (Variable;Fixed),
changefreq, PmtFrequency, ConsumerLoan checkbox, AssetType ("No Default";"Payment
Default";"Technical Default"), [Unfunded Commitment].

**tblLoan full column list** (confirmed by the import INSERT): + Investor, DaysBasis,
PayHistoryComment, NAICS, CreditScore, ExitCode, CFLikelyhood, PreliminaryScore,
CashFlowUpdate, Times30, Times60, Times90.

## 2.4 CollateralDetail / frmCollateralPopup

Record source `SELECT CollateralInfo.* FROM CollateralInfo` (parent link filters). Controls:
Address, City, State, Priority, LoanNo (default `=[Forms]![frmLoanView]![LoanNo]`), MWLoanNo,
CurrentAppraisalDate/Value ("MWValue:"), LienPosition ("SellerLien"), SeniorLienAmount,
LienAsOfDate, Acreage, NumUnits, TaxAnnualAmt ("Base/Year"), TaxAssessedValue,
TaxDelinquentAmt, TaxStatementDate, PossibleEnvironmental ("Environmental Issues"), SqFt,
taxparcelIDNo, MWCollateralCode combo (`SELECT Code, Class FROM zCollateralCodes ORDER BY
Class`), TaxMarketValue, Description, SellerAppraisedValue/Date, County, IsRealEstate,
OwnerName, MWPropertyNo, RealEstateGroup (Commercial/Residential/Unknown), TaxComment,
PropertyComment, IsFloodZone "Flood Zone Location", Latitude/Longitude, TaxWebCard,
MWTitle lien summary (MWTitleLienPosition/MWTitleSrLienAmt/MWTitleDate),
`btnCreateSateliteMap` "View Satelite Map" (sic), priority up/down buttons, Add/Delete
Collateral. The popup adds `ComboViewMode` ("View";"Edit";"Add";"Allow Delete", default View).

## 2.5 Obligor forms

**frmObligorSub2** (tblBorrowers.*): header `cmdAddObligor` "Add Borrower" / `cmdDelObligor`
"Delete Borrower". Detail: SSN (mask `000\-00\-0000;0;_`), BorrName, Address1, City, State,
HomeOwner, PersonalBankruptcy "Curr BK", PriorBankruptcy "Prior BK", BKSearchComplete,
IsBusiness, BKCaseNo, BKCourt, BKFileDt, BeaconScore "CBScore:", BeaconDate, PhoneNmb1/2
(mask `!\(999") "000\-0000;0;_`), BusinessCallSpecialInstructions, BKAssets
(Assets/No Assets), BKChapter (Uncertain: Follow-up;Chapter 7;Chapter 11;Chapter 13;
Chapter12), BKStatus combo (zBKStatus), BusinessCallComments, BusinessCallResult combo
(zBusCallCodes), BusinessCallDT.

**frmBorrowerLookup**: tblBorrowerLookup (ProjectName, MWLoanNo, BorrowerID, RelatedLoans,
BorrowerType ["Borrower";"Guarantor"], BorrName), ORDER BY BorrowerType, BorrName.

## 2.6 FrmCommentsSub (Comment tab editor)

Record source: tblcomments filtered on frmLoanView ProjectName+RelatedLoans. Controls:
Date (default `=Date()`), Comment, AcctOfficer combo (`SELECT DISTINCTROW Initials FROM
ztblLogins`, default `<initials>`), `txtGroup` category combo (`SELECT GroupName FROM
ztblCommentGroups WHERE GroupName<>"**Show All**" ORDER BY ReportPriority, GroupName` —
written back via `Update tblComments Set [Group]='…' WHERE … KeyProvision=<n>`), `txtMWLo`
combo (VBA-filled with the relationship's loan numbers), KeyProvision, `cmdNewComment`,
`Command28` "Delete". Header caption: `IIf([MWLoanNo]=[RelatedLoans], "Relationship Level
Comments…", "Loan Level Comments…")` — the sentinel in expression form.

## 2.7 frmPayHistSub / frmTasks / frmOverview / frmRelatedStrategy

- **frmPayHistSub**: tblPayHistory (mwloanno, year, month, amount, ProjectName, RelatedLoans)
  ORDER BY year, month; the key fields default from frmLoanView so new rows auto-key.
- **frmTasks**: `SELECT tblTasks.* … ORDER BY DueDate DESC`. **tblTasks schema**: ProjectName,
  RelatedLoans, MWLoanNo, EntryAcctOfficer, EntryDate, Comment, Completed, AcctOfficer,
  CompleteDate, DueDate. Defaults: EntryDate `=Now()`, DueDate `=Date()`, MWLoanNo from
  frmLoanView; AcctOfficer/EntryAcctOfficer combos over ztblLogins.Initials; header
  `cboAcctOfficerFilter` (default `"***"` = all) + "Print Tasks" → rptTasks filtered
  `MWLoanNo='…' and AcctOfficer='…'`. **Known production bug**: the ProjectName control's
  default is `=[Forms]![frmLoanView]![MWLoanNo]` (the loan number, not the project).
- **frmOverview**: tblRelationships (RelationshipOverview, CollateralOverview,
  ConditionsDeadlines) — three memos; the third captioned "Bid Conditions/Deadlines: Include:
  (a) conditions/follow-up items for bidding a relationship (b) critical deadlines requiring
  LO attention after purchase."
- **frmRelatedStrategy**: tblRelationships (ExitStrategyOverview, ExitCode combo
  `SELECT ExitCode FROM zExitCodes ORDER BY rowguid`, Original_Strategy). Guard: "You must
  first select a Relationship before entering an exit code."

## 2.8 Financials suite

**frmFinancials** (unbound popup): hosts subforms `frmFinancialCMR` + `FinancialPFS`,
switched by `txtFinancialsType` ("Personal";"Commercial"); keys txtBorrowerID/
txtRelatedLoans/txtProjectName passed from the FinStmts tab; "Save and Close"; priority
renumbering VBA (§3.7).

**frmFinancialCMR** (tblFinancialCMR): full balance sheet (Cash, AR, Inventory, NoteRec,
OtherCA, REO "Land:", OtherAssets, FFandE, InsiderTranf "Insider Assets*", Improvements +
ImprvAccDepr, accDeprFFE, AccDeprOthFixed, AssetOtherAmt1/2+Descr, AP, AccrExp, NotePay,
CurrLTD, OthCurrLiab, LTDebt, InsiderLiab, LiabOtherAmt1/2, Equity) + P&L (Revenue, COGS,
OperExp, OthExp, Depreciation, Amortization, Interest, IncomeTx, Extraordinary "Total
Adjustments*", DebtServiceAmt) + Comment, CompanyName, StmtDate, StartDate, StatementType
("Tax Return";"BK Plan";"Co. Prepared";"Acct Prepared";"Audited Stmt"), Format
("Actual";"Annualized"), NonObligorRecord. Computed controls: Total Current Assets/Assets/
Current Liab/Liabilities/Liab.and Eq., Funded Debt (=CurrLTD+NotePay+LTDebt), Operating
Income, Net Income, EBITDA, Adjusted EBITDA, Balance/Difference.

**frmFinancialPFS** (tblFinancialPFS): PFS asset/liability block (PFSCash … PFSOtherLiab,
PFSComment, PFSName, PFSDate, PFSSource "Borrower Figures";"Bank Figures";"Audited
Financials"), computed Total Assets/Liabilities/Net Worth, and a full **1040 block**
(1040FilingStatus Single…Qualifying Widow(er), 1040NumDependents, WageSalaryTips,
ScheduleB/C/D/E/F, OtherIncome, TotalAdjustments, computed Total Income and Adj. Gross
Income, Schedule A itemized detail incl. ATotalTaxesPaid, AHomeMgtIntRptd1098,
AHomeMgtIntNotRptd, AInvestmentIntRptd4952, TotalTaxableIncome, PFSIncSource, PFSIncDt),
NonObligorRecord.

## 2.9 Projections suite

**frmProjectionsNew** (unbound): `cboGroup` (ztblGroups.Group, default "DueDil"), three ERC
pivot subforms, `cboType` (Income/Expense, default Income), `cboBegMonth/cboEndMonth` (1–12),
`cboBegYear/cboEndYear` (**bug: the year combos reuse the month value list 1–12**),
`txtAmount`, buttons Change Cash Flow / Cancel Changes / Save Changes / Exit, `chkEditFlag`,
`txtEditGroup`, `lstERCSummary` (zqryCurrentLoanERCSummary). Edit-group protocol in §3.9.

**xFrmCashFlowParams** (xTblCFparameters; doubles as PROJECT MAINTENANCE hub): CFLimitKey,
cfstartyear/cfstartmonth/cfstopyear/cfstopmonth (hardcoded year list `;2008…2014` with a
blank first row); admin buttons: Archive Project (`Exec uspArchiveDDData '<proj>'`), Delete
Loans, Import Deal, Set Sort Numbers (§3.10), Move Loans, Cut-Off Comparison
(qryCutOffComparisonOutput), ConvertDD Pay History (§3.6).

## 2.10 Worklist forms (frmMain-scoped)

- **frmBKSearches**: continuous over tblBorrowers ⋈ tblRelationships.SortNo for the frmMain
  project, ORDER BY SortNo: BK fields (BKFileDt/CaseNo/Court/Notes/Status/Chapter/Assets,
  Prior/Curr BK checks, BKSearchComplete "Completed", BKSearchDt) + masked SSN.
- **frmBusinessCalls**: banner "IMPORTANT - ALWAYS BLOCK CALLER ID WHEN DIALING!";
  `LstBusinessBorrowers` (IsBusiness=True per project, with BusinessCallCompleted AS
  Complete); subform **frmSubformBusinessCall** = the call record (comments, result combo
  from zBusCallCodes, date completed, special instructions, phones).
- **frmTaxCall**: `List3` = all RE collateral of the project with `IIf(TaxCallComplete,'Y','N')
  AS done`; `optListSort` radio — three ORDER BY variants (SortNo+County / County+Zip+SortNo /
  Zip+SortNo); `cmdOutputTaxData` "DATA". **frmTaxCallSub** = the tax card (TaxAnnualAmt
  "Annual Tax", TaxAssessedValue, TaxMarketValue, TaxDelinquentAmt, TaxStatementDate,
  TaxParcelIDNO, TaxComment "Notes: (Do NOT appear in reports):", TaxCallComplete, TaxWebCard,
  RealEstateGroup, SumRel = RelatedUPB).

## 2.11 BPO / Title admin consoles

**frmBPOAdmin** (unbound): `lstRealEstate` (qryAdminBPO-AllRE default); `txtBPOView` view
combo ("All Real Estate";"All Orders";"Ordered";"Pending";"Received";"Canceled";"Entered";
"Not Entered";"Not Ordered";"In File") swapping to the matching qryAdminBPO-* query;
`txtREGroup` (*Show All*/Commercial/Residential/Unknown); vendor filter/selection
(NMS/REO/Summit/Other); duplicate pick (First/Second/Third); buttons ORDER ("Outputs pending
records; if none selected then all pending in view:"), CANCEL, RECOVER (Canceled→Pending),
Received ("To set status to [Received], select 1 property above then select proper duplicate
value."), DATA, RESET, INVOICE ISSUES; `lstDeletedBPOs` (qryAdminBPO-DeletedCollateral —
ZZZ-archived rows) + Output; subform frmCollateralAdminBPO; selection via local
xtblBPOSelected; `txtProjectName` default = frmMain project.

**frmTitleAdmin**: mirror for tblTitle — view combo adds **"Follow Up"** and **"Online"**;
vendors LandAm/NatAbstr/Fiserv/Online/Other; `cmdSubmitOrder` (Status='Ordered',
OrderDate=Date()); `cmdOpenInternalTitleRpt` "Internal Title" → rptInternalTitle;
`lstDeletedTitle`; selection via xtblTitleSelected; status views split by
`xtblTitleSponsor.Sponsor='Midwest'` — the admin queue only manages Midwest-sponsored title
work; seller-file title ("In File") is excluded.

**frmTitleUpdates** (popup, tblTitle full row: TitleID, Priority, MWPropertyNo, ProjectName,
RelatedLoans, Source, SourceDate, TitleVendor, VendorNo, OrderDate, DeliveryDate, CancelDate,
Status, FollowUp, OwnerName, DeedDate, DeedType, RecCounty, ParcelNum, DelqTaxes,
MarkedIncomplete, TitleComment, AdminNotes, Confirmed, LastModifiedDate, Registry,
[Registration Status]): header key fields + `cmdclicktoconfirm` (Confirmed toggle), FollowUp
checkbox, Source combo (xtblTitleSponsor.TitleType), `cmdInsertLientoViewer` "Add New Lien";
detail = subform **frmTitleUpdatesSub** (tblLiens by the 4-part key, ORDER BY LienPosition:
LienPosition, CreditorName, Limit "Limit/Face Amt:", RecordingDt, Amount "Curr. Balance:",
BalanceDt, CrossCollateral, InstrumentNo, DocType, MWLien, UCCExpirDt/UCCContinuationDt/
UCCLocation, MWLoanNo combo reaching back to frmLoanView, [Deed No], [Deed Status] combo from
ztblDeedStatusCodes, LienMatDt, NoneStated) + TitleComment ("TITLE NOTES:" — "*Title Notes -
limited to 255 characters (1-2 rows). If more space is needed; type \"SEE COMMENTS\" and
input on Comments tab.") + Move Up / Move Down lien reorder.

**frmBPOInput** (popup; record source = tblBPO full row filtered on
`Forms!frmLoanview!{txtBPODuplicate, ProjectName, RelatedLoans, txtMWPropertyNo}` — one BPO
row per property + duplicate slot): subject block (address/parcel, SubjUnits/Br/Ba, SubjCond
[Poor…Excellent], SubjUse [SFR;Apartments;Land;Resi-Lot;Office;CRE w/Apts;Warehouse;
Industrial;Retail;Gas/Service;Restaurant;Recreation;Duplex;Triplex], SubjOccup
[Owner;Vacant;Tenant], SubjDOM, SubjBldgArea, SubjLandArea, SubjYrBuilt, SubjSalePrice
"Sale:", SubjQuickSale "Quik:", SubjListPrice "List:", SubjIsListed(+ForPrice), SubjRentSF,
SubjNOI, computed PPSF/PPUnit/PPAc); market block (MktRentLow/High, MktVacancyRate, MktValues
[Stable;Increasing;Decreasing], MktTime [Under 90;90-180;181-365;Over 365], MktDOM); **3 sale
comps + 3 list comps**, each with Distance/Units/Br/Ba/BldgSize/YrBuilt/Cond/DOM/List[/Sale/
SaleDt]/RentSF/NOI/LandAc + computed PPSF/PPAc/PPUnit; BPONarrative, BPODate, BPOBroker
"Ref:", BPOAgency, BPOPhone, MWAccntOfficer, Status, BPOProvider "Vend:". Footer: "*Double
click on Blue Column Labels for an Aerial Map (Only works for REO Nationwide BPOs)."

## 2.12 Data-admin forms

- **frmMoveLoan-Admin**: `lstMoveThisLoan` ("SELECT A SINGLE LOAN TO MOVE (SORTED BY POOL
  THEN BY RELATIONSHIP THEN BY BALANCE)"), `cboTargetRelationship` ("MOVE TO THIS
  RELATIONSHIP:" — the "Green Combo Box"), per-entity move buttons with completion checkboxes
  (LoanData/BorrLook/PayHist/Projections), collateral mover (source/target lists with BPO and
  Title counts, priority handoff via temp 9119), borrower mover (+ CMR/PFS financials with
  Max(Priority) renumber), comment mover (relationship-level comments only:
  `MWLoanNo = RelatedLoans` filter; picker shows `Left([Comment],175) AS [Text]`).
- **frmAddDeleteAdmin**: loan picker + "DELETE THE SELECTED LOAN RECORD" and pool combo +
  "DELETE ALL RECORDS OF THE SELECTED POOL" (§3.11).
- **frmImportNewProject**: "IMPORT NEW PROJECT:" + Import Project button (§3.6). Pre-check:
  "Project level fields have not been completed [Broker], [Seller], [BidDate]."
- **frmPoolDetail** (tblPools, 28 cols): PoolNo, Description, UPBAmount, BidAmount, BidPctUPB,
  wAvgBidToYield, PurchasedUPB, PurchasePrice, EstHighBid, EstCoverBid, EstNoBidders, NoLoans,
  NoRelationships, OtherMemo, BidderName, PrimaryGeography, PrimaryPerformance,
  PrimaryAssetType, SaleResult, EstPlacing, PrimaryGeogState, BaseServicingFee, Investor —
  the post-sale/market-intel ledger (value lists in §7.2).
- **frmProjectDetail** (tblProjects ⋈ zxTblLOCALCurrentProject): ProjectName, RollUpDate,
  ExpectedBidDate "Bid Date:", PayHistoryDate, Seller, Broker, ProjComments.

## 2.13 Reporting forms

- **frmDueDiligenceReports** — the report launcher (buttons and guards in §6.7); embeds
  subform `frmFilteredMasterRpt-RowSrc` (bound to local zxtblFilterMasterRpt; user types
  SortNo values; "Clear" empties it); owns `txtReportDate` ("Include All Changes After Dt:")
  and `txtPools`.
- **frmDDReportExport** — pool multi-select (`lstPools` + "Select ALL"), relationship list,
  folder picker ("Select a Folder"), "EXPORT DD Reports To PDF" → loops relationships
  rewriting `qryDetail-ByRelationship_ExportCopy` with `HAVING RelatedLoans='…'`, OutputTo
  PDF as **`<Relationship>.DD_ASR.pdf`** → "Exported PDFs to <folder>".
- **frmPropertyStatements** — CollateralInfo header (address, SQFT, taxes, units, condition,
  CoStar Rents/Vac/Cap) for `Forms!frmLoanView!txtPropNo`; the 7-scenario grid is VBA-managed
  over tblPropertyStatements with per-scenario controls `txt<Field>_<Scenario>` (EGIoV/OthInc/
  OpEx/NOI/CapRt/Val/Adjs/AdjVal + ProTax/Ins/Util/Maint/Mgmt/Res/Oth per Appr/BPO/AsIsPF/
  AsStblPF/H1/H2/H3), per-column `^--Clear--^` buttons, Save/Undo/Exit; close prompts
  "Do you want to save your changes?".

## 2.14 Dev build manifest (C:\Scripts\DD)

A SaveAsText/LoadFromText manifest survives listing **41 forms, 12 modules, 60 querydefs,
60 report files** (plus a parallel `C:\Scripts\DD3\{Modules,Scripts,Forms,Reports,QueryDefs}`
category exporter). The accde's 43 forms = the 41 **plus frmDDReportExport and
frmPropertyStatements** (both created after 5/17/23, appended at the end of the compiled
class list). Manifest-only relics: module `basMouseHook`, reports
`rptFinancialCMRDetailAAA-Labels` and `-Priority1..5` (retired per-priority CMR detail
generation). Accde-only newer objects: `Module1`, `rptCommentSub-2`,
`rptDetail-ByRelationship_ExportCopy`, `rptPropertyStmtDetail`.

---

# 3. Write workflows

## 3.1 Two write mechanisms, one concurrency model

1. **Embedded dynamic SQL** — VBA builds INSERT/UPDATE/DELETE strings (workflow writes:
   status machines, key minting, cascades).
2. **Bound-form writes** — Access emits ODBC prepared statements. **Every captured prepared
   UPDATE/DELETE carries `"upsize_ts" = ?` in the WHERE** (rowversion optimistic locking),
   and every identity-table INSERT uses
   `DECLARE @_si TABLE(_id int); INSERT … OUTPUT INSERTED."<idcol>" INTO @_si …; SELECT ? = _id FROM @_si`
   to read back the new identity.

Tables with captured prepared DML (**directly bound-editable**): CollateralInfo, tblLoan,
tblRelationships, tblcomments, tblBPO, tblPayHistory, tblProjections, tblFinancialCMR,
tblFinancialPFS, tblPropertyStatements, tblProjects, zCollateralCodes, ztblLogins (an admin
editor exists for login accounts). tblTitle, tblLiens, tblBorrowers, tblTasks,
xTblCFparameters are also bound-editable (their statement cache simply didn't survive).
Identity columns confirmed by `SET IDENTITY_INSERT` strings: `CollateralInfo.MWPropertyNo`,
`tblcomments.KeyProvision` (BorrowerID and TitleID behave the same: inserts never supply
them; code re-finds rows afterwards).

## 3.2 Collateral

**Add** (Collateral tab). Guards: "You must activate the largest loan that is secured by the
collateral being added."; prompt Real Estate vs Other (type Yes for RE). Key mint =
Max(Priority)+1 within the relationship:
```sql
SELECT RelatedLoans, Max(Priority) AS MaxOfPriority FROM CollateralInfo
  GROUP BY RelatedLoans, ProjectName HAVING RelatedLoans='<rel>' and ProjectName='<proj>'
INSERT INTO collateralinfo (RelatedLoans, Priority, ProjectName, BorrowerName,
  IsRealEstate, RealEstateGroup)
SELECT '<rel>', <max+1>, '<proj>', <borrower>, <bool>, '**ADDED**'
-- re-find: SELECT Max(MWPropertyNo) as MaxPropID FROM CollateralInfo WHERE …
```
Then: "Collateral record added. The collateral type is [Real Estate]." + "REMINDER - Please
insert collateral codes." All other fields save via the bound prepared UPDATE (full column
list incl. tax/lien/insurance blocks, MWTitle* summary, BPOonOrder/SiteVisitOnOrder/
TitleSearchOnOrder, RelatedUPB, IsFloodZone, Latitude/Longitude, Condition, CoStar Rents/
Vac/Cap).

**Reorder priority** — swap via sentinel. LoanView flavor uses **888**, popup/admin flavor
uses **9119**:
```sql
UPDATE CollateralInfo set priority = 888  where MWPropertyNo = <a> And priority = <pa>
UPDATE CollateralInfo set priority = <pa> where MWPropertyNo = <b> And priority = <pb>
UPDATE CollateralInfo set priority = <pb> where priority = 888 and MWPropertyNo = <a>
```
Guards: "The priority cannot be increased it is already 1." / "This collateral item is
already the highest priority."

**Delete** — warns with the BPO count ("There are <n> BPO's that will be disassociated…"),
confirm requires typing **yes**; side effects before the bound row delete:
```sql
Update tblBPO   set Status = 'DELETED' Where MWPropertyNo = <n> And (Status='Pending' OR Status='Ordered')
Update tblTitle set Status = 'DELETED' Where MWPropertyNo = <n> And Source='MWTitle' And (Status='Pending' OR Status='Ordered')
UPDATE CollateralInfo set priority=priority-1 where RelatedLoans='<rel>' and priority > <deleted>
```
DELETED rows surface in `qryAdminBPO-DeletedCollateral` / `qryAdminTitle-DeletedCollateral`
so an administrator formally cancels with vendors.

**Move to another relationship** (frmMoveLoan-Admin): probe target Max(Priority), then
`UPDATE CollateralInfo set RelatedLoans='<target>', priority=<MaxPr+1> where …`.

## 3.3 Borrowers / obligors

- **Add**: `INSERT INTO tblBorrowers (ProjectName, RelatedLoans, BorrName) SELECT …,
  '[NEW BORROWER RECORD]'` — then edit bound (BorrowerID = server identity).
- **Delete**: "Are you sure you want to delete this obligor?" →
  `Delete * from tblborrowers WHERE RelatedLoans='<rel>' and projectname='<proj>' and borrowerid=<id>`.
- **Relate to a loan**: guard "A Loan and a Borrower must be activated to relate an obligor
  to a loan!" → `INSERT INTO tblBorrowerLookup(MWLoanNo, RelatedLoans, ProjectName,
  BorrowerID, BorrName) Select …`.
- BusinessCallCompleted / TaxCallComplete are bound checkboxes (prepared UPDATE only).

## 3.4 BPO status machine (tblBPO)

States: **In File → (Not Ordered) → Pending → Ordered → Received / Entered → Canceled →
(restored) Pending**, plus **DELETED**. "Not Entered"/"Not Ordered" are admin filter views.
"In File" = valuation already in the seller's file, never orderable. `BPODate = #9/9/1999#`
marks an order slot with no vendor result; `BPOBroker ∈ {First, Second, Third}` = the three
duplicate slots (max 3 per property, enforced with the dialog chain: 0 open → "Are you sure
you want to order this BPO" [type yes]; 1–2 → "…causing a total of <n> BPOs…"; 3 → "Three
BPOs are already on order. No additional orders are allowed…").

**Loan-officer order** — seven field guards ("To order a BPO you must complete the
{Collateral Code|Address|City Code|State Code|Zip Code|County|Parcel Number} on the
Collateral Tab"), then:
```sql
INSERT INTO tblBPO (RelatedLoans, Priority, ProjectName, BPODate, BPOBroker,
  MWPropertyNo, Status, BPOProvider)
SELECT '<rel>', <collateral priority>, '<proj>', '09/09/99', '<First|Second|Third>',
  <propno>, 'Pending', 'LO-BPO'
```

**Admin vendor assignment** (guard "You must first select the vendor that will be handeling
this order." [sic]):
```sql
UPDATE tblBPO SET Status='Pending', BPOProvider='<vendor>', CancelDate=Null WHERE MWPropertyNo=<n> …
Update tblBPO Set BPOProvider='<vendor>' Where MWPropertyNo=<n> And BPODate=#09/09/1999# And BPOBroker='<slot>'
```

**Send order** / **Receive** / **Cancel** / **Restore**:
```sql
UPDATE tblBPO Set Status='Ordered', VendorOrderDt=Date() Where MWPropertyNo=<n> And Status='Pending'
Update tblBPO Set Status='Received' Where MWPropertyNo=<n> And Status='Ordered' And BPOBroker='<slot>'
UPDATE tblBPO SET Status='Canceled', CancelDate=Date() WHERE MWPropertyNo=<n> [And BPOBroker='<slot>' And BPODate=#09/09/99#]
-- restore = the vendor-assignment UPDATE (Status='Pending', CancelDate=Null)
```
Batch selection travels through local `xtblBPOSelected` (Delete-all + one Insert per listbox
pick), which feeds qryAdminBPO-OrderOutput/-DataOutput vendor exports and
rptAdminBPO-Canceled. **Entered** is set only by the import pipeline (§3.6).

## 3.5 Title status machine (tblTitle)

`Source='MWTitle'` marks app-ordered searches (vs 'Online' / 'In File' seller records);
`xtblTitleSponsor` maps Source→Sponsor. States: **Pending → Ordered → Received → Entered**,
**Canceled** (CancelDate=Date(), restore to Pending nulls it), **Follow Up** (FollowUp=True —
"The status for this title record has been set to [Follow up]."), **In File**, **DELETED**.

**Loan-officer order** (same seven field guards, "To order Title you must complete …"):
```sql
INSERT INTO tblTitle (ProjectName, MWPropertyNo, RelatedLoans, Priority, SourceDate,
  Source, Status, TitleVendor)
SELECT '<proj>', <prop>, '<rel>', <pri>, #09/09/1999#, 'MWTitle', 'Pending', 'LO-Title'
```
→ "Your order has been placed." (Admin direct-order variant inserts 'Ordered' + real vendor.)

**Manual title record** (frmTitleUpdates, document already in hand — guards: activate a
Property, input Source Type, input Date):
```sql
Insert Into tblTitle (…, Source, SourceDate, Status[, TitleVendor])
Select …, '<src>', #<date>#, 'Received'[, 'Online']    -- or … 'In File'
```

**Admin transitions**:
```sql
UPDATE tblTitle SET TitleVendor='<v>', Status='Ordered' WHERE (MWPropertyNo=<n> And SourceDate=#09/09/99#
  And Source='MWTitle' And Status='Pending') OR (… And Status='Canceled')
UPDATE tblTitle Set Status='Ordered', OrderDate=Date() Where MWPropertyNo=<n> …
Update tblTitle Set Status='Received' Where MWPropertyNo=<n> And Status='Ordered'
Update tblTitle Set Status='Canceled', CancelDate=Date() Where … And (Status='Pending' Or Status='Ordered')
Update tblTitle Set Status='Pending', CancelDate=Null Where …    -- restore
```
Relationship-level confirmation: `Update tblTitle set Confirmed=true|false WHERE
RelatedLoans='<rel>' …`.

## 3.6 Import pipelines

**Generic BPO import** (local `zzzBPOImport` → tblBPO), four saved queries:
1. `ZZZQryBPOImportID` — open order slots: `SELECT RelatedLoans, BPOBroker, MWPropertyNo,
   [Relatedloans] & "-" & [MWPropertyNo] & "-" & [BPOBroker], BPOOrderNum FROM tblBPO WHERE
   BPOOrderNum Is Null` (the composite string is the order ID printed on vendor files).
2. `ZZZQryBPOUpdateKeyFields` — stamps the matched keys onto import rows.
3. `ZZZQryBPORunImport-Part1` — sets **Status='Entered'**, BPODate, BPOOrderNum, subject +
   market blocks + Sale1–3 comps.
4. `-Part2` — List1–3 comps, comp addresses, BPOAgency/Phone, and BPONarrative =
   OverallComment & CRLF & LST1..3Comment & SAL1..3Comment & MarketComment.

**Summit vendor variant** (local `aaBPO`, 231 raw text cols): `zqrySummitImport1Subject` /
`2SaleComps` / `3ListComps` — Status 'Entered', bath arithmetic `[Full Baths]+[Half Baths]*2`
(subject) vs `*0.5` (comps), broker `Company & "-" & Name`, narrative concatenation;
hardcoded per-run order/delivery dates (one-deal artifact).

**Pay-history import** (linked `ztblCFImport` with month columns Jan2006…Dec2007): VBA loops
months emitting `INSERT INTO tblPayHistory (projectname, mwloanno, amount, [year], [month])
SELECT '<proj>', MWLoanNo, <MonYYYY>, <yyyy>, <m> FROM ztblCFImport WHERE <MonYYYY> <> 0`
→ "pay history converted". Manual cell entry via the bound grid; loan narrative via
`Update tblLoan Set PayHistoryComment='…'`.

**New-deal import** (frmImportNewProject): text files at
`\\midwest-fac.com\azurefiles\duediligence\ZZZ - NewDealToImport\Delme{Loan,Collateral,
Borrower,Relationship,Pool,Project}.txt` → TransferText into local ZZZDelme* (Delete-all
first; failures create Delme*_ImportErrors tables) → six INSERT..SELECTs into tblLoan
(46 cols), CollateralInfo (31), tblBorrowers (21), tblRelationships (10), tblPools (5),
tblProjects (5) → "The new project has been imported." The ZZZDelme* schemas (§1.5, detailed
in local-schema DDL) are the canonical import file layouts; date fields arrive as numeric
serials.

**Credit scores for bidding**:
```sql
Delete * from BeaconScores
INSERT INTO BeaconScores (MWLoanNo, MaxOfBeaconScore)
SELECT tblLoan.MWLoanNo, Max(tblBorrowers.BeaconScore) FROM tblBorrowers RIGHT JOIN tblLoan
  ON tblBorrowers.MWLoanNo = tblLoan.MWLoanNo GROUP BY tblLoan.MWLoanNo;
UPDATE tblLoan INNER JOIN BidCreditScoresTemp ON … SET tblLoan.CreditScore = [cscore];
UPDATE tblLoan SET CreditScore = [preliminaryscore] WHERE PreliminaryScore Is Not Null;  -- manual override wins
```
→ "Credit Scores Updated!" Pool reclass via `zRegroupPoolsLookup` (rpool per loan from
UPB/DueDt/adjliqval) → "Reclass pools have been assigned!"

## 3.7 Financial statements (tblFinancialCMR / tblFinancialPFS)

**Create** — stub row with sentinels, then edit bound:
```sql
Insert Into tblFinancialPFS (ProjectName, RelatedLoans, BorrowerID, Priority, PFSName, PFSDate)
Select '<proj>', '<rel>', <id>, 88, '<name>', #09/09/1999#
Insert Into tblFinancialCMR (…, Priority, CompanyName, StmtDate) Select …, 88, '<company>', #09/09/1999#
-- re-find by Priority=88 + name + sentinel date
```
PK CMR = (ProjectName, BorrowerID, RelatedLoans, Priority, StmtDate); PFS = (RelatedLoans,
BorrowerID, Priority, PFSDate). Non-obligor statements: NonObligorRecord flag + "You may now
change the [Company Name]/[Name] field to show the non-obligor entity name."

**Resequence Priority** (newest statement = 1): select statements ordered date DESC, loop
`Update … Set Priority = <n> Where … Priority = <old> and {StmtDate|PFSDate} = #<date>#`.

**Delete**: "Are you sure you want to delete the selected financials? Type [YES] to delete."
→ `Delete * From tblFinancial{PFS|CMR} Where … And Priority = <n> …`.

## 3.8 Property statements (tblPropertyStatements) — delete-and-rewrite

One row per valuation scenario; `Type` ∈ **Historical1, Historical2, Historical3, Appraisal,
As-Is Pro-Forma, As-Stabilized Pro-Forma, Baycrest BPO**. Columns: ColPriority, ProjectName,
RelatedLoans, MWPropertyNo, [Statement Type], Source, [Start Date], [End Date], Type, PGI,
Vacancy, [EGI or Actual], [Other Income], [Property Tax], Insurance, Utilities, Maintenance,
Management, Reserve, Other, [Cap Rate], Adjustments. Save = replace-set:
```sql
DELETE * FROM tblPropertyStatements WHERE MWPropertyNo = <n>
INSERT INTO tblPropertyStatements (…22 cols…) VALUES(…)   -- one INSERT per scenario
```
The grid's derived rows are computed control sources: NOI = (EGI + OtherInc) − OpEx;
Value = `Round((NOI / CapRate)/10000,0)*10000`; AdjustedValue = Value + Adjustments; per-SF
and per-unit derivations.

## 3.9 Projections / ERC editor (frmProjectionsNew, tblProjections)

Row = (LoanNo, ProjectName, RelatedLoans, Group, Sect['income'|'expense'], Year, Month,
Amount, pd, netcf). Guard: "You must select the appropriate loan from the active relationship
before entering cashflows."

**Edit-group session** (clone → edit → commit/rollback):
1. Clone the chosen group into shadow `'Edit' & <group>`:
   `INSERT INTO tblProjections (…) SELECT LoanNo, '<proj>', '<rel>', 'Edit' & [group],
   Sect, Year, Month, Amount FROM zQryCurrentLoanERC WHERE Group = Forms!frmProjectionsNew!cboGroup`.
2. Ranged clears inside the copy (window validated against xTblCFparameters cfstart/cfstop;
   "The ending date must occur after the beginning date!"):
   `DELETE … WHERE Group=[txtEditGroup] AND Sect=[cboType] AND CDate([month]&'/01/'&[year])
   BETWEEN CDate(beg) AND CDate(end)` — then re-INSERT the typed amount rows.
3. Save: delete the original group, re-insert the shadow under the real name. Cancel deletes
   the shadow. Guard: "You must cancel or save changes before exiting!"

**Automatic projections** (bid engine, per loan unless `tblLoan.CashFlowUpdate='manual'`):
regenerate `tblProjectionsShortTerm` via the VBA CashFlowModules engine, group with
`IIf([amount]<0,'expense','income')`, `Delete * from tblprojections where loanno='<ln>'` +
re-INSERT → "Automatic Cash Flow Projections Updated".

## 3.10 Relationship-level writes

- **Six status flags** (LoanView footer checkboxes → immediate
  `Update tblRelationships Set {InBankruptcy|ForeclosureFlag|LitigationFlag|ForbearanceFlag|
  JudgmentFlag|LowYieldAsset} = <b> Where …`).
- **Narratives** — full bound schema: RelatedLoans, ProjectName, SortNo, ExitStrategyOverview,
  Original_Strategy, RelationshipOverview, CollateralOverview, ConditionsDeadlines, ExitCode,
  the five flags, LowYieldAsset, rowguid (+upsize_ts) — memos save via prepared UPDATE.
- **SortNo (computed, never hand-entered)**: `zQrySortNoCalculation` ranks relationships
  `ORDER BY Pool, Sum(PrincipalBalance) DESC` per project, then loops
  `UPDATE tblRelationships Set SortNo = <n> Where RelatedLoans = '<rel>'` →
  "<n> Sort numbers were calculated."
- **Create relationship on demand** (move-loan target): count probe, then
  `Insert Into tblRelationships (RelatedLoans, ProjectName) Select …` →
  "The relationship name [<rel>] was added to tblRelationships."

## 3.11 Move-loan / delete-loan / pool / archive admin

**Move a loan** — cascade RelatedLoans across the star: tblLoan, tblBorrowerLookup,
tblPayHistory, tblProjections, tblComments (+ MWLoanNo rewrite), CollateralInfo
(re-prioritized Max+1), tblBorrowers, tblFinancialCMR/PFS (after Max(Priority) probes).
Last-loan warning: "Your are moving the last remaining loan out of this relationship. This
relationship will be removed from the Project." [sic]

**Delete a loan** (frmAddDeleteAdmin) — counts loans first. **Last loan**: "…Information for
this Relationship will be moved out of the project. Affected Title and BPOs will be marked
for cancellation by the Administrator." (comments neutered:
`Update tblcomments Set …, AcctOfficer='ZZZ' Where KeyProvision=<n>`). **More remain**:
"Comments for this loan will be flagged and labeled as relationship comments." →
`Update tblcomments Set [MWLoanNo] = '<relationship>'` (the sentinel promotion).

**Move a pool out** ("DELETE ALL RECORDS OF THE SELECTED POOL", confirm Type [YES]) —
soft-delete by ZZZ-prefixing keys; rows stay on the server:
```sql
Update tblRelationships Set RelatedLoans='ZZZ<rel>', ProjectName='ZZZ<p>' Where …
Update CollateralInfo   Set ProjectName='ZZZ'&'<p>' Where MWPropertyNo=<n>
Update tblLoan          Set ProjectName='ZZZ<p>', RelatedLoans='ZZZ<rel>' Where … MWLoanNo='<ln>'
Update tblProjections   Set ProjectName='ZZZ<p>' … And LoanNo='<ln>'
Update tblBPO   Set Status='DELETED', CancelDate=Date() Where … (Pending|Ordered)
Update tblTitle Set Status='DELETED', CancelDate=Date() Where … Source='MWTitle' And (Pending|Ordered)
```

**Archive a project**: `Exec uspArchiveDDData '<ProjectName>'` (pass-through) →
"<project> was archieved successfully." [sic]

## 3.12 Liens (tblLiens)

- **Add** — Max(LienPosition)+1 within (property, title record); guards: county name and
  owner name required. `INSERT INTO tblLiens (RelatedLoans, ProjectName, Priority,
  MWPropertyNo, TitleID, LienPosition) Select …, <max+1>`.
- **Reorder** — 888-sentinel swap (`Set LienPosition = 888` / ±1 / back).
- **Seller-bank lien**: `MWLien=True` marks it; guard "You have not identified which lien
  belongs to the selling bank. Please check the appropriate [MWLien]." Completeness nags:
  "Useful information was omitted from the yellow text boxes…", "The source date has not been
  updated."

## 3.13 Comments (extends the previously documented lifecycle)

tblcomments schema: MWLoanNo, AcctOfficer, Date, **KeyProvision (identity PK)**, ProjectName,
RelatedLoans, Group, GroupType, Comment, LastModifiedDate, rowguid (+upsize_ts). Lifecycle:
- **Add**: `INSERT INTO tblComments (MWLoanNo, ProjectName, RelatedLoans, [Date],
  AcctOfficer, [Group]) SELECT '…` — keys + defaults only, no text; server assigns
  KeyProvision; VBA re-finds via `Select Max(KeyProvision) as lastrecord …`; user types the
  Comment into the bound subform (prepared UPDATE with upsize_ts).
- **Recategorize**: `Update tblComments Set [Group]='<group>' … And KeyProvision=<n>`.
- **Delete** (confirm "Are you sure you want to delete this comment?"): by
  ProjectName+RelatedLoans+KeyProvision, or by `KeyProvision = <n>` alone.
- **Reassignment on loan moves/deletes**: MWLoanNo rewritten to the relationship name
  (promotion to relationship-level), or AcctOfficer set to 'ZZZ' (orphaned).
- Display: picker shows `Left([Comment],150–175)`; unfiltered order `Date DESC`; filtered
  order `Group, KeyProvision`; reports order `ztblCommentGroups.ReportPriority, Date DESC`.

## 3.14 Tasks, documents, geo

- **Tasks**: pure bound-form creation (defaults in §2.7); completion = Completed checkbox +
  CompleteDate (event-stamped).
- **Documents**: folder root from per-project directory columns on tblProjects (`Directory,
  BPODirectory, TitleDirectory, ASRDirectory, SiteVisitDirectory, AssetSearchDirectory,
  BKDirectory, LoanDirectory, UpdateDirectory`); rescan = Delete-all + one
  `Insert Into xtblDocuments …` per file (FileSystemObject walk).
- **Geocoding** (YahooModules/EarthModules): address scrub (strip apt/lot/unit/suite tokens,
  expand blvd/rd), primary Yahoo Maps V1 REST geocode, fallback geocoder.us, city-center
  fallback ("This street address provided could not be mapped. The city or zip code (i.e.
  [City Center]) will be mapped instead."); write-back `UPDATE tblMWEarth Set Latitude='…',
  Longitude='…', Precision='…' WHERE LoanNo='…'`. Consumers: KML export (`C:\kml_IT_co.kml`,
  red-dot placemarks, launches Google Earth), a Google Maps v2 HTA (`C:\GoogleAPIMap.hta`,
  satellite@18 + street@13 panes), and a portfolio GeoMap HTA fed by server scratch
  `ztblMWEarth-TempQryOutput` + `ztblPRMetroAreas` (metro backfill by Zip then City).

## 3.15 Key-generation summary

| Table | Key | Minting |
|---|---|---|
| CollateralInfo | MWPropertyNo | SQL Server IDENTITY (OUTPUT INSERTED on bound insert; Max() re-find after dynamic insert) |
| CollateralInfo | Priority (per relationship) | Max+1; swap via 888/9119; compaction `priority=priority-1` |
| tblcomments | KeyProvision | IDENTITY; Max() re-find |
| tblBorrowers | BorrowerID | IDENTITY (stub insert, then bound edit) |
| tblLiens | LienPosition (per title) | Max+1; swap via 888 |
| tblFinancialCMR/PFS | Priority | born 88 → resequenced 1..N by statement date DESC |
| tblBPO | composite (Project, RelatedLoans, MWPropertyNo, BPOBroker, BPODate) | sentinel date + First/Second/Third slot |
| tblTitle | TitleID | IDENTITY; rows addressed by MWPropertyNo+Source+SourceDate+Status |
| tblPayHistory | (mwloanno, month, year) natural | import or grid entry |
| tblRelationships | SortNo | batch-computed UPB rank |

Deletes are mostly **soft** (Status DELETED, ZZZ prefix); tblComments, tblBorrowers,
tblFinancial*, tblLiens, tblPropertyStatements hard-delete. The financial/property-statement
editors are replace-set writers (delete+insert), not row patchers.

---

# 4. Data layer

## 4.1 Connect strings

All 54 links use one trusted-connection DSN string, two stored variants differing only in
DATABASE case:
- **A (52 links)**: `DSN=sqlDueDiligence;Description=sqlDueDiligence;Trusted_Connection=Yes;
  APP=Microsoft Office;DATABASE=MidwestDDi;Encrypt=Optional;TrustServerCertificate=Yes;`
- **B (2 links)**: same with `DATABASE=midwestDDi` — the tblPropertyStatements /
  vwPropertyStmtsSummary pair, relinked in a later pass.

VBA-only constants: a relink variant with `Encrypt=No` (harmless), and the dead legacy
`ODBC;DATABASE=Midwest;DSN=sqlMidwest` (§1.7). Every local name maps 1:1 to `dbo.<same name>`
— no dbo_ prefixes, no double links.

## 4.2 The 54 ODBC links

**Base tables (22)** — Q = saved-query references, ✔ = linked by BuildFrontEnd.bas:

| Local name | Q | Builder | Role |
|---|---|---|---|
| CollateralInfo | 555 | ✔ | core collateral |
| tblBPO | 250 | ✔ | BPO orders + subject/comp columns (~160 cols) |
| tblLoan | 161 | ✔ | core loans |
| tblRelationships | 144 | ✔ | relationships (narratives, flags, SortNo) |
| tblTitle | 134 | ✔ | title orders |
| tblBorrowers | 55 | ✔ | obligors |
| tblLiens | 50 | — | title lien lines |
| tblPools | 40 | — | pool/bid tracking |
| tblcomments | 38 | ✔ | comments |
| tblProjections | 31 | — | cash-flow projection ledger |
| tblPayHistory | 19 | ✔ | payment ledger |
| tblBorrowerLookup | 11 | ✔ | loan↔borrower link |
| tblProjects | 10 | ✔ | projects (incl. 9 document-directory columns) |
| tblTasks | 2 | ✔ | tasks |
| tblFinancialCMR / tblFinancialPFS | 1/1 | — | financial statements |
| tblPropertyStatements | 0 | — | property scenario statements |
| xTblCFparameters | 1 | — | projection window params |
| tblASRThisServer, tblInvestors, tblSSBid, tblSSObligor | 0 | — | **dormant** (legacy app family) |

**Lookups (15)**: z_CCodes (advance rates + `under60factor`/`over60factor` delinquency
split — bid math, ✔), zExitCodes (✔), ztblCommentGroups (categories + ReportPriority),
zBusCallCodes, zCollateralCodes (Code, Class — admin-editable), ztblGroups (projection
groups + view/edit levels), ztblLogins (**app auth**), zBKStatus, ztblClasses (projection
classes), ztblCFImport (pay-history import staging), and dormant zCreditScores (Score,
Description, HaircutRate, zzExitPeriod, zzExitYield, zzTargetYield — the bid-pricing knobs),
zOccupancyCodes (Type, Factor), zRegionCodes (Region, ValueFactor), ztblNAICSCodes,
ztblSrLienHolders.

**Views (17)** — Q=0 for most because their SELECTs live inside form/report binaries as
embedded record sources:

| View | Where used |
|---|---|
| vwPayHistorySpread (✔) | server-side year×12 payment pivot (PHJan…PHDec + SumOfAmount) |
| vwRelationshipSummary | **the production LoanView pinned loan grid** + rptRelationshipSummarySub — adds server-computed `amtpd` (trailing-payments total), `ORDER BY PrincipalBalance DESC` |
| vwCollateralSummary | LoanView collateral grid + rptCollateralSummary — adds **MaxBPO, MinBPO, NetValue** rollups |
| vwTitleDetail | LoanView title subform + rptTitleDetailSub in 5 report masters (title + full lien chain) |
| vwCollateralReportTest | rptCollateralReportTest — the 40+-column per-property merge for the Relationship Report |
| vwFinancialCMR-Summary / vwFinancialPFS-Summary | financial summary subreports + LoanView lists |
| vwlstFinancialItemsRowSrc | merged CMR+PFS statement list (Commercial/Personal IIf projection) |
| vwProjections / vwProjectionsNet | pivoted (Year × m1…m12, Sect, Group) projection grids |
| vwPropertyStmtsSummary | Property tab statement summary (EGI/OpEx/NOI/CapRate/AdjVal + ratios, ORDER BY SortNo) |
| vwBorrowerSummary, vwBankruptcySummary, vwBusinessCalls, vwNonRECollateralPreview, vwObligorDetail-All, vwObligorList-LoanLevel | same-named subreports in the Detail masters |

**All 17 views are read-only in practice**: zero DML strings target any view; every prepared
UPDATE/DELETE hits base tables (statements shown via views, edited via base tables). A
rebuild can link views without unique-index designation (DAO links them read-only, matching
production).

## 4.3 Gap vs BuildFrontEnd.bas

The builder links only 14 objects; **40 are missing**. Highest-impact fixes: link
vwRelationshipSummary / vwCollateralSummary / vwTitleDetail and rebind the LoanView grids to
them (picks up `amtpd`, MaxBPO/MinBPO/NetValue, and lien detail the raw-table approximations
lack); add tblLiens + ztblCommentGroups (Tier 1); tblFinancialCMR/PFS + both summary views +
vwlstFinancialItemsRowSrc, tblProjections + ztblGroups/ztblClasses + vwProjections(Net),
tblPropertyStatements + vwPropertyStmtsSummary (Tier 2 — whole tabs); ztblLogins, tblPools,
zCollateralCodes, zBKStatus, zBusCallCodes, xTblCFparameters, ztblCFImport (Tier 3);
the seven report views (Tier 4); dormant links (Tier 5, fidelity only).

## 4.4 Server-side programmables (called, definitions not recoverable)

Stored procedures: `uspDDReportFilteredCollateral/Payhistory/BPOTitle/Projections '<proj>'`
(report data), `uspArchiveDDData '<proj>'`. Table-valued functions:
`udfFinancialCMRDetail('<proj>')`, `udfPropertyStatementsDetail('<proj>')` (statement grids
with styling flags, §6.4). Their bodies live only in the MidwestDDi database.

## 4.5 Local tables

See §1.5 for the roster. Full schemas of the important ones:

- `zxTblLOCALCurrentProject`: `CurrentProject Text(50) NOT NULL` (single row).
- `xtblLOCALLastLocation`: `LastLoc Text(30)` (single row).
- `zxtblFilterMasterRpt`: `ProjectName Text(50) NOT NULL, SortID Long NOT NULL`.
- `xtblBPOSelected`: `ID Long, MWPropertyNo Long, Status Text(50), ProjectName Text(50),
  BPOBroker Text(50)`; `xtblTitleSelected`: `ID, MWPropertyNo, ProjectName`.
- `xtblTitleSponsor`: `TitleType Text(50) NOT NULL, Sponsor Text(50), SortOrder Long` —
  seed with the tblTitle.Source domain (MWTitle/Online/In File) and Sponsor='Midwest' rows.
- `ztblDeedStatusCodes`: `Order Long, DeedStatusCode Text(1), DeedStatusDescription Text(55)`
  — seed data lives only here.
- `xtblLOCALFinancialCMRDetail`: join keys (ProjectName, RelatedLoans, BorrowerID) + `rn`
  (rn=1 is the column-header row), RowLabel, value/percent pairs `[1]/[1p]…[5]/[5p]`, and
  styling booleans `[Top Line], [Bottom Line], [Bold LBL], [Bold VAL], [Center Just],
  [Bold BL]`.
- `xtblLOCALPropertyStmtDetail`: (Priority, ProjectName, RelatedLoans, MWPropertyNo) + rn,
  RowLabel, `[1]..[7]` + the same styling booleans.
- `xtblDocuments`: FileName(250), FileDescription(50), FileType(200), FileDate, FilePath(250).
- `tblMWEarth`: logical key RelatedLoans+LoanNo+Priority; Latitude/Longitude/Precision as
  Text.
- Import staging: ZZZDelme* ×6 (canonical import layouts), zzzBPOImport (149 cols),
  aaBPO (231 cols, raw Text(255) Summit layout).

No local table has a PK or index (consistent with delete-all/refill usage). All were created
together at FE assembly. mdbtools strips JOIN predicates from saved-query FROM clauses —
`FROM [a],[b]` in the query dump is an artifact; true ON clauses were recovered from the
form-binding string regions.

---

# 5. Query logic by category (289 queries; business rules & formulas)

Category totals: 212 binding plumbing (45 `~sq_c` + 12 `~sq_f` + 18 `~sq_r` + 137 `~sq_d`) ·
7 bidding (`aaa*`) · 31 admin workflow (`qryAdmin*`) · 8 imports · 3 pay-history ·
13 projections/ERC/budget · 9 report feeds/roll-ups · 6 pool/sort/link helpers.

## 5.1 The bidding chain

1. `aaaBiddingBeaconScoreSummary` — Max(BeaconScore) per relationship.
2. `zqryFirstCollateral` — Min(Priority) per relationship = the representative property.
3. `aaaBiddingCollateralPriority` — that property's address/code for the tape row.
4. `aaaBiddingCollateralValueSummary` — the collateral-coverage math:
   ```
   rawliqval = Σ max(0, CurrentAppraisedValue − max(0,SeniorLienAmount) − max(0,TaxDelinquentAmt))
   adjliqval = Σ max(0, AdvanceRate × CurrentAppraisedValue − max(0,SeniorLienAmount) − max(0,TaxDelinquentAmt))
   ```
   AdvanceRate from `z_CCodes.Rate` keyed by collateral code, **default 0.8** when absent
   (z_CCodes also carries under60factor/over60factor delinquency-split rates). Plus sums of
   TaxMarketValue, TaxDelinquentAmt, TaxAnnualAmt, SellerAppraisedValue,
   CurrentAppraisedValue, CountOfPriority per relationship.
5. `aaaBiddingOverviewSpreadsheet` — per-loan tape: loan terms + relationship flags +
   MaxOfBeaconScore + collateral rollups + ERC budget columns + P12 payments.
6. `aaaBIDQUERYREVISED-ALLPOOLS` — the cross-pool export (joins the P12 crosstab and the
   budget crosstab on MWLoanNo; numeric-pool sort via `IIf(IsNumeric([pool]),CDbl([pool]),
   [pool])`; null SortNo → 999).
7. `aaaBidSummaryByLoan` — `Sum(0.6*[principalbalance])` starting-bid heuristic.
8. `aaaBidReviewBreakdown` — per-loan bid QC (hardcoded Pool="122"): `reviewed` flag,
   `ltv = principalbalance/adjliqval`, `bid-to-collateral = bidvalue/adjliqval`; pulls
   numpds/balloon/bidvalue from **`zzBidCalculation-Dynamic`** and colliqval/adjliqval from
   **`zzDueDilColVal`** — both VBA-materialized tables (CashFlowModules).

**The bid value itself is VBA** (CashFlowModules): `makeprojections2` fills
`tblProjectionsShortTerm (LoanNo, Period, Amount)` skipping `CashFlowUpdate='manual'` loans;
`NPVCashFlowStream(CFRate, CFStart, CFDuration, CFAmount)` discounts the payment stream;
`liqbidvalue(liqtype, targetyield, liqval, liqhaircutrate, terminalinflow)` prices the
liquidation leg (haircut liquidation value as a terminal inflow at exitperiod, discounted at
targetyield); `interimsvccushion` = interim servicing cushion. Pricing knobs come from
`zCreditScores` (Score → HaircutRate, zzExitPeriod, zzExitYield, zzTargetYield).

**Credit-score assignment** (`assigncreditscores`): QryCreditScoreBase over DueDt, LTV,
maxofbeaconscore, PMTSCORE, onsched, minoflienposition → BidCreditScoresTemp → applied to
tblLoan.CreditScore, with `PreliminaryScore` as a manual per-loan override that always wins.
(tblLoan.Times30/60/90 delinquency counts likely feed PMTSCORE.)

## 5.2 Pay-history analytics

- `QryPayHistorySpread` — year×12 pivot per loan: `Sum(IIf([month]=n,[amount],0))` + total;
  tblPayHistory period key `pd = Year*100+Month`.
- `zQryLast12MosPayHistory` — **the P12 window**: crosstab `TRANSFORM Sum(IIf([amount] Is
  Not Null,[amount],0)) AS amtpd … PIVOT pd`, window
  `pd >= IIf(Month(lastimport)>3, (Year-1)*100+Month-3, (Year-2)*100+Month+9)` (LastImport
  shifted back 15 months); fixed pd column headings per vintage. Its `amtpd` alias matches
  the server view's derived column.
- `QryRelatedPayHist` — relationship-grain re-aggregation of `vwPayHistorySpread`
  (Sum PHJan…PHDec + SumOfAmount per relationship-year); feeds rptRelatedPayHist.

## 5.3 Admin workflow queries (31)

- `qryAdminBPO-{AllRE, AllOrders, NotOrdered, Ordered, NotEntered, Entered, Pending,
  Received, Canceled}` — one status-filtered family: CollateralInfo × tblBPO ×
  `qrytblLoanLinkToCollateral`, **ordered `RelPrin DESC`** (related principal drives
  ordering priority); filter core `IsRealEstate=True AND Status Is Not Null AND
  Status<>'In File'`. `-DataOutput`/`-OrderOutput` build vendor files (order ID =
  `RelatedLoans & '-' & MWPropertyNo & '-' & BPOBroker`); `-CancellationRpt` (Canceled or
  Ordered) feeds vendor cancellation notices; `-DeletedCollateral` filters Status='DELETED'
  AND `ProjectName = "ZZZ" & <project>`.
- `qryAdminTitle-*` (18) — same pattern over tblTitle, split by
  `xtblTitleSponsor.Sponsor='Midwest'`; `-MWandFileRecords` counts
  `IIf(Source="MWTitle",1,0)` / `IIf(<>"MWTitle",1,0)` as MTitle/FTitle per property;
  extra views FollowUp, Online, InFile.

## 5.4 Pool / sort helpers

- `qrytblLoanLinkToCollateral` — the rollup everything keys on: per (Project, RelatedLoans,
  Pool, SortNo): `Sum(PrincipalBalance) AS RelPrin, Count(MWLoanNo), Sum(InterestBalance)`.
- `qryPoolLevelCalculations` — UPB-weighted pool metrics: `Sum((Date()-[DueDt])*
  [PrincipalBalance])` (weighted days past due), `Sum([PrincipalBalance]*[DueDt])`,
  `Sum([PrincipalBalance]*[CurrentMaturityDate])`, `Sum([PrincipalBalance]*[Rate])` — each
  divided by SumOfUPB for weighted-average due date / maturity / coupon.
- `qryDef-SortNoCalcResults` — verification grid for the SortNo assignment (§3.10).
- `QryPRPoolRelationships` — pool-geography tag per relationship.

## 5.5 Projections / ERC / budget (13)

Sign convention everywhere: **net = Σ IIf(sect='income', amount, −amount)**.
- `zQryCurrentLoanERC` — the current loan's raw rows (via
  Forms!frmLoanView!frmLoanDetail.Form!… — the app's only sub-form-path reference).
- `zQryCurrentLoanERC{Income,Expense}` — year×12 pivots; `…Total` — the signed net pivot;
  `zqryCurrentLoanERCSummary` — net per Group; `qrylstCFSummaryRowSrc` — per-loan net total.
- `zQryASRReportCurrentLoanERC` (+`Sum`, +`Union`) — project-wide pivots per
  (Project, RelatedLoans, LoanNo, Group, Sect) with a literal "Net" arm; the ASR projection
  block.
- `qryProjReport` — the union + ztblGroups (Description, GSortOrder) + ztblClasses
  (SortOrder joined on Sect=Class) — loan-grain report feed.
- `qryProjectionsSummary-ByRelationship` — same, grain collapsed to relationship.
- `zqryBudgetSpreadSheetOutput` — net per MWLoanNo pivoted to YYYY/MM columns, **restricted
  to `Group='duedil'`** — the budget scenario exported to the bid tape (wrapped by
  `zQryBudgetOutputtoExcel`).

## 5.6 Roll-up / report feeds

- `qryPostRollUp-Temp` — **the change detector**: relationships where
  `tblTitle.LastModifiedDate > txtReportDate OR tblBPO.LastModifiedDate > … OR
  tblcomments.LastModifiedDate > … OR tblBorrowers.BusinessCallDT > …` — the whole
  "what changed since we published" family is four timestamp comparisons.
- `QryCollateralRptSummary` — 3-arm UNION aligned on (mwloanno, projectname, relatedloans,
  priority) with a sorting `type` tag: `'1Coll'` (CollateralInfo facts) → `'2BPO'` (tblBPO
  subject values incl. SubjQuickSale) → `'3Lien'` (tblLiens **WHERE Confirmed=True** —
  unconfirmed title work never reaches the report). Feeds rptBPOTitleSummarySub.
  `qryCollateralRptSummary2` is the flat joined variant.
- `qryTaxAnalysis-Output` — every RE property with **both lien data sources side by side**:
  seller-tape LienPosition/SeniorLienAmount vs Midwest-title MWTitleLienPosition/
  MWTitleSrLienAmt, + full tax set, appraisals, SQFT/Acreage/Units, Lat/Long, ordered SortNo.
- `qryCutOffComparisonOutput` — current balances/dates/rate + ten Null placeholder columns
  to paste the seller's cut-off tape against.
- `qryDetail-ByRelationship_ExportCopy` — the PDF-export loop's rewritable record source.

## 5.7 Blank/audit rules (§6.6 for the reports)

Loans with no projections (`HAVING Sum(netcf) Is Null`) = cannot be bid; relationships with
zero comments (`tblcomments.RelatedLoans Is Null` after outer join) = file never reviewed;
`MWCollateralCode Is Null`; `ExitCode Is Null`; liens lacking confirmation
(`Count(Confirmed)` vs `Count(LienPosition)` per RelatedLoans+Priority — doubles as the
reviewer-throughput scoreboard).

## 5.8 Formulas recovered from control-source expressions

- **Ah/Bhd** (frmLoanDetail Text44):
  `=monthsbetween([duedt],[currentmaturitydate]) - amortizedmaturity([repayamt],[principalbalance],[rate])`
  — contractual months to maturity minus the amortization-implied months to payoff at the
  current payment/balance/rate. Positive = ahead of schedule, negative = behind. Both helper
  functions live in the stripped MWFunctions module; `amortizedmaturity` is the standard
  annuity solve (`n = −ln(1 − P·r/pmt)/ln(1+r)` family) — verify empirically.
- **Property valuation**: NOI = (EGI + OtherIncome) − OpEx;
  Value = `Round((NOI/CapRate)/10000,0)*10000`; AdjustedValue = Value + Adjustments; per-SF /
  per-unit ratios; 7 scenario columns (H1–H3, Appraisal, BPO, As-Is PF, As-Stabilized PF).
- **Financial statements**: 1040 personal income rollup; PFS net worth; business
  balance-sheet net; adjusted-EBITDA-style cash flow
  (Revenue − COGS − OperExp + OthExp + D&A + Interest + Tax [+ Extraordinary]);
  Funded Debt = CurrLTD + NotePay + LTDebt.
- **Weighted-average maturity**: `Σ(MaturityDate×Principal)/Σ(Principal)`.
- **Borrower age**: `(Date() − DOB)/365`.
- **BPO derived**: `SubjPPSqft = SubjSalePrice/SubjBldgArea`;
  `Sale1PPSF = Sale1Sale/Sale1BldgSize`; etc.

## 5.9 Modules (12, names + recovered responsibilities)

`MWFunctions` (financial UDFs: monthsbetween, amortizedmaturity), `CashFlowModules`
(projection/bid engine), `EarthModules` (Google Maps/KML), `YahooModules` (geocoding),
`BKImport` (PACER import — writes tblComments "BK PACER HIT: … Chapter … Assets: … /
Confirmed Plan: … Dates: Discharged/Dismissed/Closed"; plus `aaaMWDeaths` deceased matching —
"**Possibly Deceased: <name> age: …"), `ImportFromTextFiles` (new-deal import),
`MWDDOnlyFunctions` (LastLoc writer, relink, server failover), `FindMissingReferencesModule`,
`ExtModules`, `IntModules`, `Internal-Other`, `Module1`.

## 5.10 vwRelationshipSummary — resolved

There is **no `qryRelationshipSummary`** anywhere in the accde. The summary grid/report binds
directly to the server view:
```sql
SELECT MWLoanNo, ProjectName, RelatedLoans, Pool, BorrowerNm, DueDt, CurrentMaturityDate,
       OrigPrincipalBalance, PrincipalBalance, InterestBalance, EscrowBalance, OtherBalances,
       PayoffBalance, RepayAmt, Rate, DefaultRate, LastPmtDt, amtpd, OrgNoteDate
FROM vwRelationshipSummary INNER JOIN zxTblLOCALCurrentProject
  ON vwRelationshipSummary.ProjectName = zxTblLOCALCurrentProject.CurrentProject
ORDER BY vwRelationshipSummary.PrincipalBalance DESC
```
Grain = one row per loan; `amtpd` = the loan's summed trailing payments (server-computed;
matches the P12 crosstab alias; rendered as "12 Pmts" on the report).

---

# 6. Reports suite (55 reports)

## 6.1 Inventory by family

- **Detail masters (6)**, all sharing one relationship×loan record source:
  `rptDetail-ByRelationship` (flagship), `rptDetail-ByPool`, `rptDetail-Master`,
  `rptDetail-MasterGARversion` (abbreviated), `rptDetail-ByRelationship_ExportCopy`
  (PDF-export twin), `rptZFilteredMaster` (SortNo-filtered).
- **~30 subreports** of the masters (all record-source SQL recovered).
- **PostRollUp suite (5)**: Master + Comment/Title/BPO/BusinessCall subs.
- **Blank/audit suite (5)**: BestLien, CashFlows, CollateralCodes, ExitCodes, FileReview.
- **Bid (2)**: rptBidConditions-All + its sub.
- **Admin/ops (7)**: rptAdminBPO-Canceled, rptAdminTitle-Canceled, rptInternalTitle,
  rptBPOTitleSummarySub, rptLienSummarySub, rptReviewerPerformance, rptTasksByProject.
- **Ghosts** (VBA dispatch, object deleted): rptBPOOrderStatus, rptBPOStatusMissing, rptTasks.

## 6.2 Link-field architecture (from the 137 `~sq_d` glue stubs)

| Link pattern | Meaning | Subreports |
|---|---|---|
| `[__RelatedLoans] = RelatedLoans` | relationship-level | all summary/overview/financial/BPO/title/task subs |
| `+ [__MWLoanNo] = MWLoanNo` | loan-level (per-loan group) | rptLoanDetailSub, rptObligorList-LoanLevel, RptPayHistorySpread, rptProjectionsNew, rptCommentSub-2 |
| `[__RelatedLoans] = MWLoanNo` | **the relationship-comment sentinel as a link pair** | rptCommentSub |
| `[__ProjectName] + [__RelatedLoans]` | PostRollUp subs | all four |

## 6.3 Flagship: rptDetail-ByRelationship (reconstructed section by section)

**Record source**: `zxTblLOCALCurrentProject INNER JOIN tblRelationships ON CurrentProject =
ProjectName … LEFT JOIN tblLoan ON RelatedLoans`, GROUP BY all columns (one row per
relationship × loan), carrying SortNo, the three overview memos, ExitCode, Pool, MWLoanNo,
PrincipalBalance, and the five workout flags. Sort/group: SortNo → RelatedLoans → MWLoanNo →
PrincipalBalance. Title band: "Due Diligence Report:" + Project + "Related:"; page banner:
Relationship / Exit Code / Pool / Sort Order / Page N of M / =Now(); the group header prints
the five flags.

**GroupHeader0 — per RELATIONSHIP** (link RelatedLoans):

| # | Section | Subreport | Record source |
|---|---|---|---|
| 1 | RELATIONSHIP SUMMARY: | rptRelationshipSummarySub | vwRelationshipSummary (§5.10) |
| 2 | COLLATERAL SUMMARY: | rptCollateralSummary | vwCollateralSummary (incl. MaxBPO/MinBPO/NetValue) |
| 3 | BORROWER DETAIL: | rptBorrowerSummarySub | tblBorrowers LEFT JOIN zBusCallCodes |
| 4 | RELATIONSHIP OVERVIEW: | rptRelationshipOverviewSub | tblRelationships.RelationshipOverview |
| 5 | COLLATERAL OVERVIEW: | rptCollateralOverviewSub | tblRelationships.CollateralOverview |
| 6 | EXIT STRATEGY: | rptExitStrategySub | tblRelationships.ExitStrategyOverview |
| 7 | BID CONDITIONS/DEADLINES: | rptBidConditionsDeadlinesSub | tblRelationships.ConditionsDeadlines |
| 8 | RELATIONSHIP PAY HISTORY SUMMARY: | rptRelatedPayHist | QryRelatedPayHist |
| 9 | RELATIONSHIP PROJECTIONS SUMMARY: | rptProjections-Summary | qryProjectionsSummary-ByRelationship |
| 10–11 | FINANCIAL SUMMARY: | RptFinancialSummaryCMR + PFS | vwFinancialCMR-Summary / vwFinancialPFS-Summary |
| 12 | BANKRUPTCY SEARCH RESULTS: | rptBKSummarySub | tblBorrowers BK columns |
| 13 | BUSINESS CALL DETAIL: | rptBusinessCall | tblBorrowers WHERE IsBusiness AND BusinessCallCompleted |
| 14 | OBLIGOR SUMMARY: | rptObligorDetail-All | vwObligorDetail-All |
| 15 | COLLATERAL PREVIEW: | rptCollateralReportTest | vwCollateralReportTest (wide per-property merge) |
| 16 | (non-RE) | rptNonRECollateralPreview | CollateralInfo WHERE IsRealEstate=False |
| 17 | RELATIONSHIP LEVEL COMMENTS: | rptCommentSub | tblComments LEFT JOIN ztblCommentGroups WHERE MWLoanNo=RelatedLoans ORDER BY ReportPriority, Date DESC |
| 18 | PROPERTY STATEMENTS: | rptPropertyStmtDetail | xtblLOCALPropertyStmtDetail ⋈ CollateralInfo WHERE rn<>1 (TVF-fed, §6.4) |

**GroupHeader1 — per LOAN** (link RelatedLoans + MWLoanNo):

| # | Section | Subreport | Record source |
|---|---|---|---|
| 19 | LOAN DETAIL: | rptLoanDetailSub | tblLoan.* + SortNo ("CONSUMER LOAN:" variant header) |
| 20 | OBLIGOR LIST: | rptObligorList-LoanLevel | vwObligorList-LoanLevel |
| 21 | PAYMENT HISTORY: | RptPayHistorySpread | vwPayHistorySpread |
| 22 | PROJECTED CASH FLOW: | rptProjectionsNew | qryProjReport |
| 23 | LOAN LEVEL COMMENTS: | rptCommentSub-2 | tblComments + groups, MWLoanNo-linked |

(ByPool and Master additionally host rptPayHistoryComment here.)

**GroupFooter0 — relationship back-matter:**

| # | Section | Subreport | Record source |
|---|---|---|---|
| 24 | BPO DETAIL: | rptBPO | tblBPO WHERE SubjSalePrice Is Not Null (full comps) |
| 25 | TITLE DETAIL: | rptTitleDetailSub | vwTitleDetail (title + lien chain) |
| 26 | FINANCIAL DETAIL - BUSINESS: | rptFinancialCMRDetail | xtblLOCALFinancialCMRDetail ⋈ tblBorrowers (TVF-fed) |
| 27 | (comments) | rptFinancialsComments-CMR | tblFinancialCMR WHERE Comment Is Not Null |
| 28 | FINANCIAL DETAIL - INDIVIDUAL: | rptFinancialPFSDetail | tblFinancialPFS.* ("PERSONAL ASSETS/LIABILITIES/INCOME INFORMATION:") |
| 29 | TASKS - BY RELATIONSHIP: | rptTaskSub | tblTasks.* |

## 6.4 The statement-rendering pipeline (server-computed layout)

1. VBA calls pass-through TVFs `dbo.udfFinancialCMRDetail(@project)` /
   `dbo.udfPropertyStatementsDetail(@project)` (shells qryUDF*, rewritten at login).
2. Results are materialized into `xtblLOCALFinancialCMRDetail` / `xtblLOCALPropertyStmtDetail`
   whose rows carry **presentation metadata**: `rn` (row order; rn=1 = column-header row),
   `RowLabel`, numbered value columns, and boolean styling flags (Top Line, Bottom Line,
   Bold LBL, Bold VAL, Center Just, Bold BL).
3. The subreports bind the local tables joined back to tblBorrowers/CollateralInfo for
   captions. **The layout intelligence lives in the database, not the report** — a rebuild
   should call the same TVFs or reproduce the {rn, rowLabel, values[], styleFlags} contract
   (flags map to CSS).

## 6.5 Master variants

| Report | Difference |
|---|---|
| rptDetail-Master | unfiltered whole project ("MASTER DD REPORT - DETAILED"; first clears zxtblFilterMasterRpt); includes rptPayHistoryComment |
| rptDetail-ByPool | `WHERE tblLoan.Pool = Forms!frmDueDiligenceReports.txtPools` (guard "You must select a Pool to filter the report.") |
| rptDetail-MasterGARversion | "ABBREV." — 11 relationship-level sections only; no comments/BPO/Title/per-loan group/financial detail |
| rptDetail-ByRelationship_ExportCopy | bound to named qryDetail-ByRelationship_ExportCopy so frmDDReportExport can rewrite it per relationship (`HAVING RelatedLoans='<rel>'`), OutputTo "PDFFormat(*.pdf)" as `<Relationship>.DD_ASR.pdf` ("DD ASR" = Due Diligence Asset Summary Report); only 13 subreport controls keep link glue (the report is pre-filtered) |
| rptZFilteredMaster | record source joins local zxtblFilterMasterRpt (SortID=SortNo); comments via rptZFilteredCommentSub: `WHERE Date > txtReportDate` with `IIf([MWLoanNo]=[RelatedLoans],1,0) AS [Order]` so relationship-level comments sort first; abbreviated section set |

## 6.6 PostRollUp + Blank suites

**PostRollUp** ("POST ROLL-UP REPORT - BY DATE", `txtReportDate`; guard "Please enter the
data start date for the report."): master = tblRelationships × qryPostRollUp-Temp (only
relationships with post-date activity), ordered SortNo; footer "From: [txtReportDate]
Through: =Now()"; page break per relationship. Four subs (COMMENTS: / TITLE: / BPO: /
BUSINESS CALLS:), each filtering its `LastModifiedDate` (or BusinessCallDT +
BusinessCallCompleted + IsBusiness) against txtReportDate; the Title sub joins
CollateralInfo LEFT JOIN tblTitle LEFT JOIN tblLiens. A delta report for re-sending updates
to investors.

**Blank/audit** (all headed `<TOPIC> --- BLANKS`, frmMain-project-scoped): CONFIRMED LIEN /
CASH FLOW (NO BIDS) / COLLATERAL CODE / EXIT CODES / FILE REVIEW COMMENTS — rules in §5.7.
rptReviewerPerformance reuses the lien aggregation as a throughput scoreboard.

## 6.7 Report menu + admin reports

frmDueDiligenceReports buttons (verbatim): MASTER DD REPORT - DETAILED · MASTER DD REPORT -
BY POOL · MASTER DD REPORT- ABBREV. · POST ROLL-UP REPORT - BY DATE · BID CONDITIONS AND
DEADLINES · REAL ESTATE - TAX ANALYSIS (exports qryTaxAnalysis-Output) · FILTERED - BY DATE
AND SORT · COLLATERAL CODE - BLANKS · CASH FLOW (BID) - BLANKS · REVIEW COMMENTS - BLANKS ·
DD REPORT - EXPORT BY POOL OR RELATIONSHIP · Clear · MAIN MENU.

Admin reports: rptAdminBPO-Canceled ("CANCELED BPO'S:", legend: `"Cancelled" - Orders were
formally cancelled by Midwest, Inc.` / `"Ordered" - Orders were submitted to vendor but not
delivered.` / `*OrderDt = Null - The order was never submitted to the Vendor.`);
rptAdminTitle-Canceled ("CANCELED TITLE:"); rptInternalTitle (county worksheet for in-house
searches); rptTasksByProject ("PROJECT TASK LIST:").

All report parametrization flows through exactly three inputs — current project
(zxTblLOCALCurrentProject), pool (txtPools), report date (txtReportDate) — plus the SortID
filter table for ZFiltered.

---

# 7. UI copy deck, combos, value lists, defaults, formats

Production typos are faithful and load-bearing for fidelity: `Satelite`, `Statments`,
`occured`, `recieved`, `handeling`, `archieved`, `Your are`, `items items`,
`Note Receicable`, `NotesReceiveable`, `Performnce`, `PrimryState`, `want save`.

## 7.1 Value-list catalog (all 83, condensed by feature)

**Loan terms** (frmLoanDetail): RateType `Variable;Fixed`; changefreq
`"D";"Daily";"M";"1 Mos";"Q";"3 Mos";"S";"6 Mos";"A";"1 Yr";"2A";"2 Yrs";"3A";"3 Yrs";"5A";
"5 Yrs";"O";"Oth"` (code+label pairs); PmtFrequency `1;Monthly;3;Quarterly;6;Semi-Ann.;12;
Annual;I;Interest;D;Demand;M;Maturity` (bound col = code); AssetType `"No Default";"Payment
Default";"Technical Default"`.

**LoanView**: CFLikelyhood `2;"Very Optimistic";1;"Optimistic";0;"Average";-1;"Pessimistic";
-2;"Very Pessimistic"` (bound numeric −2..+2).

**Obligor/BK**: BorrowerType `"Borrower";"Guarantor"`; BKChapter `Uncertain: Follow-up;
Chapter 7;Chapter 11;Chapter 13;Chapter12` (sic); BKAssets `"Assets";"No Assets"` on
frmObligorSub2 but `Asset;No Asset` on frmBKSearches (**the two forms disagree**).

**Financials**: txtFinancialsType `"Personal";"Commercial"`; CMR StatementType `"Tax Return";
"BK Plan";"Co. Prepared";"Acct Prepared";"Audited Stmt"`; CMR Format `"Actual";"Annualized"`;
PFSSource `"Borrower Figures";"Bank Figures";"Audited Financials"`; PFSIncSource
`"Tax Return";"Borrower Figures";"Audited Financials"`; 1040FilingStatus `"Single";"Married -
Filing Jointly";"Married - Filing Separately";"Head of Household";"Qualifying Widow(er)"`.

**Property statements**: StmtType per scenario `"Actual";"Annualized";"Pro-forma"`; Source
`"Appraisal";"Co. Prepared";"MW Estimate";"BPO";"Tax Return";"Acct. Prepared"`; Condition
`5;Best;4;"  |  ";3;"  |  ";2;"  |  ";1;Worst` (1–5, only endpoints labeled).

**Collateral**: RealEstateGroup `"Commercial";"Residential";"Unknown"` (5 forms);
frmCollateralPopup ComboViewMode `"View";"Edit";"Add";"Allow Delete"` (default View).

**BPO admin**: view `"All Real Estate";"All Orders";"Ordered";"Pending";"Received";
"Canceled";"Entered";"Not Entered";"Not Ordered";"In File"`; group `"*Show All*";
"Commercial";"Residential";"Unknown"`; vendors `"NMS";"REO";"Summit";"Other"`; duplicate
`"First";"Second";"Third"`.

**Title admin**: view adds `"Follow Up"` and `"Online"`; vendors `"LandAm";"NatAbstr";
"Fiserv";"Online";"Other"`. frmTitleUpdatesSub [Registration Status] `Registered;
Unregistered;Other`; lien position display `"1st";"2nd";"3rd";"4th";"5th";"6th +"`.

**BPO input**: condition `Poor;Fair;Average;Good;Excellent`; use `SFR;Apartments;Land;
Resi-Lot;Office;CRE w/Apts;Warehouse;Industrial;Retail;Gas/Service;Restaurant;Recreation;
Duplex;Triplex`; occupancy `Owner;Vacant;Tenant`; MktValues `Stable;Increasing;Decreasing`;
MktTime `Under 90;90-180;181-365;Over 365`.

**Pool detail**: BidderName `"Pramco";"Pramco/Alliant";"MFAC";"FAM";"FAM/Alliant";
"Sandstone";"MI"`; PrimaryGeography (11 region buckets, e.g. `"Midwest (East) -
IN,IL,KY,MI,OH,WI"` … `"Puerto Rico";"Carribean - Not PR"`); PrimaryGeogState (50 states as
`Alabama - AL;…`); PrimaryPerformance `"Performing";"Subperforming";"Nonperforming";"REO"`;
PrimaryAssetType `"RE - Single Family";"RE - Multi Family";"RE - Agriculture";"RE - Retail";
"RE - Office";"RE - Industrial/Warehouse";"RE - Church";"RE - Development";"RE - Other";
"Business Assets";"Unsecured"`; SaleResult `"No Bid";"Won";"Lost";"No Trade";"Pending"`;
EstPlacing `"1st";"2nd";"3rd";"4th";"5th";"6th +"`.

**Projections**: cboType `"Income";"Expense"`; months `1;…;12`; **bug: the year combos reuse
the month list**; xFrmCashFlowParams years `;2008;2009;…;2014` (blank first row).

**Misc**: frmMain Documents `"On";"Off"`.

**Table-driven combos** (read live): ztblLogins.Initials (officers), ztblCommentGroups.
GroupName (with the `**Show All**` row), ztblGroups.Group ('DueDil' exists), zBKStatus,
zBusCallCodes.CallResult, zCollateralCodes (Code, Class) ORDER BY Class, zExitCodes ORDER BY
rowguid (arbitrary-but-stable — reproduce as insertion order), xtblTitleSponsor.TitleType
ORDER BY SortOrder, tblProjects.ProjectName. Implied bound-column lengths from the combo
descriptors: Initials=6, Group=16, GroupName=40, BKStatus=100, CollateralCode=70.

## 7.2 Defaults catalog (complete)

| Default | Controls |
|---|---|
| `=Date()` | FrmCommentsSub.Date; frmTasks.DueDate |
| `=Now()` | frmTasks.EntryDate; report footer time stamps |
| `<initials>` (design-time literal of the primary user) | AcctOfficer (comments), EntryAcctOfficer + AcctOfficer (tasks), AccntOfficer (BPO/Title admin) — seed with the current login's initials in a rebuild |
| `"***"` | frmTasks.cboAcctOfficerFilter (no-filter sentinel) |
| `"**Show All**"` | frmLoanView.CommentFilter |
| `"*Show All*"` | admin group/vendor filters |
| `"All Real Estate"` | admin view combos |
| `"View"` | frmCollateralPopup.ComboViewMode |
| `"Off"` | frmMain.cboDocumentsOnOff |
| `"Income"` / `"DueDil"` | frmProjectionsNew cboType / cboGroup |
| `'038-150'` | FrmCommentsSub.txtMWLo (dev leftover; runtime requeries) |
| `[Forms].[frmMain].[txtCurrentProject]` | txtProjectName on both admin consoles; frmDueDiligenceReports.txtproject; frmFilteredMasterRpt-RowSrc.ProjectName; xFrmCashFlowParams project |
| `=[Forms]![frmLoanView]![…]` | frmTasks (MWLoanNo, RelatedLoans, **ProjectName←MWLoanNo bug**); frmPayHistSub (all three keys); CollateralDetail.LoanNo |

## 7.3 Formats & masks

| Format | Count | Where |
|---|---|---|
| `$#,##0.00;($#,##0.00)` | 294 | THE house money format — every currency textbox |
| `Standard` | 247 | integer-ish numerics (SqFt/Acreage/Units, grid amounts, Rate×100 columns) |
| `mm/dd/yy` | 93 | THE house date format |
| `Fixed` | 46 | land acres and 2-decimal numerics (BPO cluster) |
| `Percent` | 44 | Rate/DefaultRate/floor/ceiling/margin; cap rates & vacancy; pool percentages; CMR % columns |
| `Short Date` | 15 | property-statement start/end dates + title source date |
| `Long Date` | 1 | =Now() page footer on the title report |

**Grids format in SQL, not properties**: row sources bake `Format([PrincipalBalance],
'$#,##0')`, `Format([Rate]*100,'Standard')`, `Format([DueDt],'mm/dd/yy')`,
`Format([RelPrin],"$#,##0")` — list money shows **$#,##0 (no cents)**, detail textboxes show
cents. Only two input masks exist in the whole app: SSN `000\-00\-0000;0;_` (mask chars
stored with data) and phone `!\(999") "000\-0000;0;_`.

Fonts (chrome fidelity): Arial Narrow detail controls; MS Sans Serif/Tahoma dialogs;
Franklin Gothic Book admin headers; Times New Roman reports; Copperplate Gothic Bold login
branding. No Tag/StatusBarText/ControlTip strings anywhere.

## 7.4 Message catalog highlights (exact production wording)

The complete copy deck is in the miner file `ui-vocabulary.md`; the load-bearing subset:

- **Guards (activation)**: "You must first select a relationship to activate the loanview
  form." · "You must first activate a Relationship and LoanNo before entering a Comment." ·
  "You do not currently have a loan selected. Please select the loan that coincides to the
  pay history you want to enter." · "A Loan and a Borrower must be activated to relate an
  obligor to a loan!" · "You must first activate a Collateral item before editing the
  property statements." · "You must select the appropriate loan from the active relationship
  before entering cashflows." · "You must first select a Relationship before entering an
  exit code."
- **Destructive confirms** (typed-word pattern): "Are you sure you want to delete this
  collateral item? [Type the word 'yes' if you are sure.]" · "Are you sure you want to
  delete the selected financials? Type [YES] to delete." · "Are you sure you want to move
  pool … out of the current project? Type [YES] to continue or [NO] to cancel."
- **BPO 3-order chain**: "Are you sure you want to order this BPO" → "There are <n> BPOs
  already on order or pending order." → "Are you sure you want to add this order causing a
  total of <n> BPOs to be ordered for this property?" → "Three BPOs are already on order.
  No additional orders are allowed until the outstanding BPOs are input."
- **Admin status flips**: "The status for <n> BPO records has been changed to [Canceled].
  Forward the pop-up list the appropriate vendor." · "The status of the previously Canceled
  orders has been restored to [Pending]. Does the Vendor need notification that these orders
  have been restored? Use the Order Button to output [Pending] orders." · "You are trying to
  re-order items that are already [Active]. You must assign another record to order a
  duplicate."
- **Business calls banner**: "IMPORTANT - ALWAYS BLOCK CALLER ID WHEN DIALING!"
- **Delete-loan branches**: "This is the last loan in this relationship. Information for
  this Relationship will be moved out of the project. Affected Title and BPOs will be marked
  for cancellation by the Administrator." · "There is more than one loan in this
  relationship. Comments for this loan will be flagged and labeled as relationship comments.
  No BPO or Title will be marked for cancellation."
- **Ops**: "Cash flow parameters have not been set for this project. Please contact the
  Director of Due Diligence for resolution." · "Network Adapter Error. Links not optimized.
  You may work, but may experience slow functionality. Notify an Admin of this Warning." ·
  "<n> Sort numbers were calculated." · "Credit Scores Updated!" · "Reclass pools have been
  assigned!" · "Automatic Cash Flow Projections Updated" · "The new project has been
  imported." · "… was archieved successfully." [sic] · "Exported PDFs to …"

## 7.5 Useful column widths (twips)

BPO admin lstRealEstate `461;0;1656;0;1800;936;389;540;792;1152;936;720;266;576;864;864;360;
864`; comment picker `0;1080;619;0;720;1224;1152;1080;8280` (keys hidden, preview 8280);
MWCollateralCode `2016;864`; changefreq `360;1080`; PmtFrequency `288;1080`; Condition
`360;360`; single-column officer/group combos 1440.

---

# 8. What remains unknowable from the accde

1. **Compiled VBA procedure bodies.** All event code and module internals are P-code only.
   We have every SQL string, function *name* (`NPVCashFlowStream`, `liqbidvalue`,
   `makeprojections2`, `monthsbetween`, `amortizedmaturity`, `interimsvccushion`,
   `assigncreditscores`, `bidsrcrs`) and their input/output *identities*, but not their
   arithmetic bodies. The NPV/liquidation bid engine and the exact
   `amortizedmaturity` implementation must be verified empirically or recovered from a
   source `.accdb`/`C:\Scripts\DD` export tree if one is ever found. (Note: **Ah/Bhd itself
   is now recovered** — it is a bound expression, not VBA; only its two helper functions'
   bodies remain unverified.)
2. **Pixel layout/geometry.** Control positions/sizes are undocumented binary. Column widths
   (twips), fonts, tab order (stored order), and captions survive; coordinates do not.
3. **Conditional formatting.** CF rules are binary blobs — the "yellow text boxes" validation
   highlighting on frmTitleUpdates and any grid coloring are known to exist only from message
   text. (Exception: CMR/PFS/property statement styling is data-driven via the TVF flag
   columns and IS recovered.)
4. **MsgBox titles and button sets** (vbYesNo etc. are compiled numeric flags) — only body
   text survives.
5. **Server-side object definitions.** The four `uspDDReportFiltered*` procs,
   `uspArchiveDDData`, the two `udf*Detail` TVFs, and all 17 `vw*` view definitions live in
   MidwestDDi; the accde shows their call sites and output shapes only. Same for exact
   column types/nullability of server tables (the prepared-statement cache gives names and
   rough types, not full DDL).
6. **Lookup table contents.** Row data of zExitCodes, ztblCommentGroups, zBKStatus,
   zBusCallCodes, zCollateralCodes, z_CCodes, zCreditScores etc. is on the server; only
   schemas, orderings, and a few literals (e.g. '**Show All**', 'DueDil', advance-rate
   default 0.8) are recoverable.
7. **The PMTSCORE / onsched computation** inside credit scoring, and the exact
   `zzBidCalculation-Dynamic` generation logic (VBA-materialized).
8. **Dead/legacy internals**: the retired performance/investor forms, frmBPOTitleImport, the
   sibling "LBD" application, and the `sqlMidwest` servicing-system integration exist only
   as names.
