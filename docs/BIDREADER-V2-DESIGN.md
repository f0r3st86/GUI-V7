# Relationship Projection v2 — Final Design

Status: implementation-ready. Supersedes the three proposals (performance / fidelity / ux) and the two judges' scorecards. The **performance** proposal is the spine; grafts from the other two are marked `[graft: fidelity]` / `[graft: ux]` where they change a decision.

Reference implementation being replaced: `access/BuildBidReader.bas` (v1.3). Oracle for every number: the `Bid_Project` workbook.

---

## 1. Goals and non-goals

### Goals
1. **Feels instant.** Every user action other than a relationship switch completes in one visible frame (< 100 ms). A relationship switch is one server round trip plus in-memory calc plus paint (target ≤ 300 ms warm, ≤ 500 ms p95).
2. **Every number equals the workbook.** Excel semantics for NPV/IRR/XIRR/FV/PV/PMT/NPER/DAYS360/DATEDIF/EDATE, proven by a three-way Excel-cached-values ↔ Python ↔ VBA vector loop *before* UI work starts. "n/a" in v2 coincides exactly with an Excel `#NUM!`/`#DIV/0!`.
3. **Adds the missing sheet blocks:** YTM(IRR), YTM(XIRR), Sell YTM, Bid Override, the IRR Solve exit type, the per-month Optimal table (m = 1..60) and hurdle "Min Hurdle Month" stats, per loan and for the relationship.
4. **Excel-sheet look, exact row order.** The v1.3 row order (the sheet's rows 2–50) is untouched; new rows are appended below in clearly banded sections. Yellow = input, white = data/calc, green = result. The sheet's 10 loan columns (C..L) are shown by default.
5. **One window.** Projection · Optimal · Pay History · Collateral as pages of one tab control, sharing one header (pickers, globals) and one status line.
6. **Read-only against SQL Server by construction.** No server table is linked; all reads are pass-through `SELECT`s; only local scratch tables are written.
7. **Buildable by the documented VBA generator rules.** Zero injected code; every event is a `="=BR_Xxx(...)"` property pointing at a Public Function in a standard module; forms have `HasModule = False`.

### Non-goals
- Not a general loan viewer, not a replacement for LoanView; no server writes ever.
- No horizontal scrolling of loan columns (Access cannot); > 10 loans uses a paging window.
- No keyboard chords (F9, Ctrl+Z, …): a parent form's `KeyPreview` does not see keystrokes while focus is in a subform, and the only way around that is injected `KeyDown` procedures per subform. All actions are buttons; Tab/Enter/Shift+Tab flow is native.
- No multi-level undo, no fill-down ranges, no cell selection ranges.
- No dependency on Excel at runtime. Excel is used once, offline, by whoever regenerates the golden vectors.
- No `Declare` statements (no `timeGetTime`); timing uses `Timer` (≈ 15 ms resolution — fine for a HUD, averaged in the bench).

---

## 2. File layout

Seven `.bas` files (six hand-written + one generated). The user imports all of them into a blank `.accdb` (any order — nothing runs at import) and runs `BuildBidReaderV2` from the Immediate window. Rebuilding is idempotent: forms, reports and saved queries are dropped and recreated; local tables persist and are upgraded in place.

| File | Kind | Contents | References |
|---|---|---|---|
| `access/modBR_Fin.bas` | standard | Pure finance primitives with Excel semantics, no runtime errors: `FVx, PVx, PMTx, NPERx, NPVx, IRRx, IRRLevel, XIRRx, Days360US, DateDifM, EDateX, PdKey, PdAdd, PdDiff`. No DAO, no Forms. | none |
| `access/modBR_Engine.bas` | standard | `Public Type TLoan / TRel / TOptRow / TColl`; the sheet formulas: `CalcLoan, CalcRel, CalcExitPull, BuildStream, CalcYTM, CalcOptimal, CalcHurdles, CalcRelOptimal, ComputeTrails, PickPmt, PickRate, TrailDisplay, SetInput`. In-memory model `gRel As TRel`. No DAO, no Forms. | Fin |
| `access/modBR_Data.bas` | standard | `CONNECT`; `BR_OpenPT` (temp pass-through); T-SQL builders; `LoadRelationship`, `LoadCollateral`, `SetRelListProject`; local tables (`EnsureLocalTables`, `EnsureField`, `SchemaVer`, v1.3 migration); `LoadInputs / SaveLoanInput / SaveSettings / LoadSettings`; cache writers for the bound Optimal/Collateral subforms and the print/export snapshot. | Engine |
| `access/modBR_UI.bas` | standard | Every `Public Function BR_*(...) As Variant` the forms call; control-reference cache; dirty-value cache; `PaintProjection / PaintPayHist / PaintOptimalBlock / PaintHeader`; paging; undo; status line; print/export; `BR_Unfreeze`. | Data, Engine |
| `access/modBR_Build.bas` | standard | The generator `BuildBidReaderV2`: saved pass-through QueryDefs, local tables, `frmBidReader` + `fsubBR_Proj`, `fsubBR_PayHist`, `fsubBR_Optimal`, `fsubBR_Coll`, `rptBR_Projection`; style helpers (`SafeSet`, `VL`, per-type lookers); control-count assertions; compile-all. Runs only at build time. | none at runtime |
| `access/modBR_SelfTest.bas` | standard (optional) | `BR_SelfTest` (engine vs vectors → `xtblBR_TestResults`), `BR_SqlCheck` (server vs local sums), `BR_Bench` (p50/p95 timings), `BR_UISmoke`. | all |
| `access/modBR_Vectors.bas` | **generated** by `tools/bidref/gen_vba_vectors.py` | `Public Function BR_VectorCount() As Long`, `Public Function BR_Vector(i As Long) As Variant` returning `Array(caseId, fieldName, expected, tol)` — one `Case` per vector row, so no line-continuation or line-length limits are approached. | none |

```
tools/bidref/
  excelfin.py          Excel-semantic primitives (fv, pv, pmt, nper, npv, irr, xirr, days360_us, datedif_m, edate)
  bidcalc.py           1:1 mirror of modBR_Engine (same function names, same statement order)
  make_vectors.py      writes BidVectors.xlsx: input rows + LIVE Excel formulas transcribed from the sheet's LETs
  extract_vectors.py   reads Excel-cached values (openpyxl data_only=True) -> vectors.csv
  gen_vba_vectors.py   vectors.csv -> access/modBR_Vectors.bas
  test_bidcalc.py      pytest: bidcalc == Excel cached values within tolerance
  lint_bas.py          fails on > 20 line continuations per statement or physical lines > 900 chars in any .bas
  vectors.csv          committed golden set
access/README-BidReader-v2.md   import list, build sub, test subs, Compact-on-Close note, CONFIRM items
```

**What is injected: nothing.** All forms are `HasModule = False`. Every event is a property string calling a Public Function in `modBR_UI`, with the control name baked in as a literal at build time (`c.AfterUpdate = "=BR_CellChanged(""c3_ExitMonth"")"`) `[graft: ux]` — no `Screen.ActiveControl` parsing, no `CreateEventProc` ordering hazards, no module-level declarations to inject. `BR_FormLoad` addresses the form as `Forms("frmBidReader")`.

**Linked tables: none.** `sqlDueDiligence` is required as a DSN only. An optional `BR_LinkForBrowsing` (v1.3's `LinkReaderTables` verbatim) exists for troubleshooting and is never called by the build or the app.

Runtime state (all in `modBR_Engine` / `modBR_UI`):

```vb
Public gRel As TRel               ' the loaded relationship (server data + inputs + results)
Public gPay() As Double           ' gPay(1..nLoans, 0..gPayMax): amount by month index, 0 = newest month on tape
Public gPayMax As Long            ' highest month index present
Public gPayPd0 As Long            ' yyyymm of month index 0 (max pd across the relationship)
Public gWin As Long               ' 1-based index of the loan shown in column 1 (paging window)
Public gCell() As Control         ' gCell(1..NCOLS+1, 0..ROWS) cached control refs for fsubBR_Proj
Public gShown() As Variant        ' last painted values, same shape (dirty cache; Nz-compared)
Public gPH() As Control, gPHShown() As Variant   ' same for fsubBR_PayHist
Public gBusy As Boolean           ' re-entrancy guard
Public gStale As Long             ' bit flags: 1 = Optimal cache, 2 = Collateral cache, 4 = PayHist paint, 8 = RelOpt
Public gUndo As TUndo             ' one-deep: loanIdx, key, oldVal, newVal
```

---

## 3. Data access

### 3.1 Mechanics
- `CONNECT = "ODBC;DSN=sqlDueDiligence;DATABASE=MidwestDDi;Trusted_Connection=Yes;APP=Microsoft Office;Encrypt=Optional;TrustServerCertificate=Yes"` (v1.3's proven string).
- `Public Function BR_OpenPT(sql As String, Optional timeoutSec As Long = 20) As DAO.Recordset`: `Set q = CurrentDb.CreateQueryDef("")` (temporary — never saved, no catalog write, no bloat), `q.Connect = CONNECT`, `q.ReturnsRecords = True`, `q.ODBCTimeout = timeoutSec`, `q.SQL = sql`, `Set rs = q.OpenRecordset(dbOpenSnapshot, dbReadOnly or dbForwardOnly)`. Pass-through recordsets are never updatable: writes to the server are impossible by construction.
- Rows are pulled with one `rs.GetRows(50000)` into a 2-D Variant and dispatched in VBA. Never field-by-field loops.
- Literals substituted by VBA (pass-throughs take no parameters): text via `N'...'` with `'` doubled by `Q()`; period keys as integer `yyyymm`; nothing else is user-typed. Loan numbers are TEXT everywhere and never numerically converted.
- Every numeric column is `CAST(... AS float)` so DAO delivers `Double` (never `Currency`/`Decimal` Variants); nullable numerics are `ISNULL(...,0)` unless NULL is meaningful (dates, CF params).
- A pass-through QueryDef surfaces only the first result set, so every load is exactly one `SELECT` (a `UNION ALL` with tagged arms of identical shape).
- **Warm-up:** `BR_FormLoad` runs `SELECT 1 AS ok` immediately (status: "Connecting to sqlDueDiligence…") so the 150–800 ms ODBC login is paid while the user picks a project. DAO keeps the connection for the session.
- `PD_EXPR` constant = `"p.pd"`. If a server lacks a physical `pd` column, the build-time probe `SELECT TOP (1) pd FROM dbo.tblPayHistory` fails and the generator stores `PD_EXPR = "(p.[year]*100 + p.[month])"` in `xtblBR_Settings.PdExpr` (row `*`). Both the load query and the check query use `PD_EXPR`.

### 3.2 Trip 1 — the relationship load (one round trip) `[graft: ux — all pay history, local trails]`

Built by `BuildLoadSql(proj, rel)`. Three arms, identical 12-column shape: `sect char(2), seq int, k1 nvarchar(50), i1 int, n1..n6 float, d1 datetime, d2 datetime, d3 datetime`. Pulling the **entire** pay history for the relationship's loans (a few hundred to ~1,500 rows, pre-summed per loan-period) makes the PMT History Date, the 3/6/12/24-month trails and the 36-month matrix purely local: changing the anchor never touches the server.

```sql
SET NOCOUNT ON;
DECLARE @proj nvarchar(50)  = N'{PROJ}';
DECLARE @rel  nvarchar(100) = N'{REL}';
;WITH L AS (
    SELECT l.MWLoanNo,
           CAST(ISNULL(l.PrincipalBalance,0) AS float) AS UPB,
           CAST(ISNULL(l.InterestBalance,0)  AS float) AS IntBal,
           CAST(ISNULL(l.Rate,0)             AS float) AS CRate,
           CAST(ISNULL(l.DefaultRate,0)      AS float) AS DRate,
           CAST(ISNULL(l.RepayAmt,0)         AS float) AS CPmt,
           l.CurrentMaturityDate AS MatDt, l.OrgNoteDate AS OrgDt, l.LastImport,
           ROW_NUMBER() OVER (ORDER BY l.PrincipalBalance DESC, l.MWLoanNo) AS Seq
    FROM dbo.tblLoan l
    WHERE l.ProjectName = @proj AND l.RelatedLoans = @rel
)
-- arm 1P: exactly one row of relationship-level scalars
SELECT '1P' AS sect, 0 AS seq, @rel AS k1, CAST(NULL AS int) AS i1,
       CAST((SELECT COUNT(*) FROM L) AS float)                                  AS n1,  -- loan count
       CAST(ISNULL((SELECT SUM(CAST(ISNULL(c.CurrentAppraisedValue,0) AS float))
                    FROM dbo.CollateralInfo c
                    WHERE c.ProjectName = @proj AND c.RelatedLoans = @rel),0) AS float) AS n2,  -- RelColl
       CAST(ISNULL((SELECT SUM(CAST(ISNULL(c.SellerAppraisedValue,0) AS float))
                    FROM dbo.CollateralInfo c
                    WHERE c.ProjectName = @proj AND c.RelatedLoans = @rel),0) AS float) AS n3,  -- RelSellerAppr
       CAST((SELECT COUNT(*) FROM dbo.CollateralInfo c
             WHERE c.ProjectName = @proj AND c.RelatedLoans = @rel) AS float)      AS n4,  -- property count
       CAST(p.cfstartyear*100 + p.cfstartmonth AS float)                          AS n5,  -- CF start yyyymm (NULL if none)
       CAST(p.cfstopyear *100 + p.cfstopmonth  AS float)                          AS n6,  -- CF stop  yyyymm
       (SELECT MAX(LastImport) FROM L) AS d1,                                             -- "tape as of"
       CAST(NULL AS datetime) AS d2, CAST(NULL AS datetime) AS d3
FROM (SELECT 1 AS one) AS x
LEFT JOIN dbo.xTblCFparameters p ON p.ProjectName = @proj
UNION ALL
-- arm 2L: loan snapshot, largest UPB first
SELECT '2L', L.Seq, L.MWLoanNo, NULL,
       L.UPB, L.IntBal, L.CRate, L.DRate, L.CPmt, NULL,
       L.MatDt, L.OrgDt, L.LastImport
FROM L
UNION ALL
-- arm 3H: all pay history for these loans, pre-summed per loan-period
SELECT '3H', 0, p.mwloanno, {PD_EXPR},
       CAST(SUM(ISNULL(p.amount,0)) AS float), NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, NULL
FROM dbo.tblPayHistory p
INNER JOIN L ON L.MWLoanNo = p.mwloanno
GROUP BY p.mwloanno, {PD_EXPR}
ORDER BY sect, seq, k1, i1;
```

Dispatch (`LoadRelationship`): `v = rs.GetRows(50000)`; walk rows; `Left(v(0,r),2)` selects the arm. Arm 2L fills `gRel.Loans(1..n)` in `seq` order; arm 3H fills `gPay(loanIdx, mi)` where `mi = PdDiff(gPayPd0, pd)` and `gPayPd0` = max pd seen (computed in a first pass over the 3H rows). If arm 1P's `n1 = 0` the relationship has no loans: paint an empty grid and say so in the status line (not an error). If there are more than 20,000 pay rows (never expected), the loader retries with `WHERE {PD_EXPR} >= {anchor − 120 months}` and marks the status "history truncated to 120 months".

Server cost: index seek on `tblLoan(ProjectName, RelatedLoans)`, three small aggregates on `CollateralInfo`, one range scan on `tblPayHistory(mwloanno)`. 5–40 ms server side; ≤ ~1,500 × 12 cells on the wire.

### 3.3 Trailing sums and the 36-month matrix — local, and the server cross-check query

At runtime both are computed from `gPay` (see §4.6 `ComputeTrails`). The following query is the **diagnostic** form used by `BR_SqlCheck` (and by anyone validating in SSMS); it returns per-loan snapshot + trailing sums + the 36-month matrix in one row per loan, anchored at `@hi = PdKey(AnchorDt)`, and must agree with the local sums to the cent. The `M00..M35` column pairs are emitted by a `For j = 0 To 35` loop in `BuildTrailCheckSql`.

```sql
SET NOCOUNT ON;
DECLARE @proj nvarchar(50)  = N'{PROJ}';
DECLARE @rel  nvarchar(100) = N'{REL}';
DECLARE @hi   int = {ANCHOR_PD};     -- yyyymm of the PMT History Date (inclusive)
DECLARE @lo   int = {LO_PD};         -- yyyymm of anchor minus 35 months (VBA PdAdd(@hi,-35))
;WITH L AS (
    SELECT l.MWLoanNo, CAST(ISNULL(l.PrincipalBalance,0) AS float) AS UPB
    FROM dbo.tblLoan l WHERE l.ProjectName = @proj AND l.RelatedLoans = @rel
),
PH AS (
    SELECT p.mwloanno,
           ((@hi/100 - {PD_EXPR}/100)*12 + (@hi%100 - {PD_EXPR}%100)) AS idx,   -- 0 = anchor month
           SUM(CAST(ISNULL(p.amount,0) AS float)) AS amt
    FROM dbo.tblPayHistory p JOIN L ON L.MWLoanNo = p.mwloanno
    WHERE {PD_EXPR} BETWEEN @lo AND @hi
    GROUP BY p.mwloanno, {PD_EXPR}
),
PV AS (
    SELECT mwloanno,
           SUM(CASE WHEN idx <= 2  THEN amt ELSE 0 END) AS T3,
           SUM(CASE WHEN idx <= 5  THEN amt ELSE 0 END) AS T6,
           SUM(CASE WHEN idx <= 11 THEN amt ELSE 0 END) AS T12,
           SUM(CASE WHEN idx <= 23 THEN amt ELSE 0 END) AS T24,
           SUM(CASE WHEN idx = 0  THEN amt ELSE 0 END) AS M00,
           SUM(CASE WHEN idx = 1  THEN amt ELSE 0 END) AS M01,
           /* ... M02..M34 generated ... */
           SUM(CASE WHEN idx = 35 THEN amt ELSE 0 END) AS M35
    FROM PH GROUP BY mwloanno
)
SELECT L.MWLoanNo, L.UPB,
       ISNULL(PV.T3,0) AS T3, ISNULL(PV.T6,0) AS T6, ISNULL(PV.T12,0) AS T12, ISNULL(PV.T24,0) AS T24,
       ISNULL(PV.M00,0) AS M00, /* ... */ ISNULL(PV.M35,0) AS M35
FROM L LEFT JOIN PV ON PV.mwloanno = L.MWLoanNo
ORDER BY L.UPB DESC, L.MWLoanNo;
```

### 3.4 Trip 2 — collateral detail (lazy, once per relationship, cached locally)

Fired the first time the Collateral page is shown for the loaded relationship (`gStale And 2`). Rows go into `xtblBR_CollCache` (DELETE + INSERT inside one transaction, ≤ 30 rows) because the Collateral page is a bound continuous form. `RelColl` painted on the page is `gRel.RelColl` from arm 1P; `BR_SqlCheck` asserts it equals `SUM(MwVx)` of this result.

```sql
SET NOCOUNT ON;
SELECT c.MWPropertyNo, c.Priority, c.MWCollateralCode, c.Description, c.Address, c.City, c.State, c.Zip, c.County,
       CAST(ISNULL(c.SQFT,0) AS float) AS SQFT, CAST(ISNULL(c.NumUnits,0) AS float) AS NumUnits,
       CAST(ISNULL(c.Acreage,0) AS float) AS Acreage,
       c.SellerAppraisalDate AS ApprDt,
       DATEDIFF(month, c.SellerAppraisalDate, CAST(GETDATE() AS date)) AS MosAppr,
       CAST(ISNULL(c.SellerAppraisedValue,0) AS float)  AS SellerAppr,
       CAST(ISNULL(c.CurrentAppraisedValue,0) AS float) AS MwVx,
       CAST(ISNULL(c.TaxAnnualAmt,0) AS float)          AS TaxAnnual,
       CAST(ISNULL(c.TaxDelinquentAmt,0) AS float)      AS TaxDelq,
       CAST(ISNULL(c.MWTitleSrLienAmt,0) AS float)      AS SrLien,
       c.MWTitleLienPosition AS LienPos,
       CASE WHEN ISNULL(c.SQFT,0)     > 0 THEN CAST(ISNULL(c.SellerAppraisedValue,0) AS float)/c.SQFT     END AS PerSF,
       CASE WHEN ISNULL(c.NumUnits,0) > 0 THEN CAST(ISNULL(c.SellerAppraisedValue,0) AS float)/c.NumUnits END AS PerUnit,
       CASE WHEN ISNULL(c.Acreage,0)  > 0 THEN CAST(ISNULL(c.SellerAppraisedValue,0) AS float)/c.Acreage  END AS PerAcre,
       CASE WHEN ISNULL(c.CurrentAppraisedValue,0)-ISNULL(c.MWTitleSrLienAmt,0) < 0 THEN 0
            ELSE CAST(ISNULL(c.CurrentAppraisedValue,0)-ISNULL(c.MWTitleSrLienAmt,0) AS float) END AS NetMwVx,
       CASE WHEN ISNULL(c.SellerAppraisedValue,0)-ISNULL(c.MWTitleSrLienAmt,0) < 0 THEN 0
            ELSE CAST(ISNULL(c.SellerAppraisedValue,0)-ISNULL(c.MWTitleSrLienAmt,0) AS float) END AS NetSeller
FROM dbo.CollateralInfo c
WHERE c.ProjectName = N'{PROJ}' AND c.RelatedLoans = N'{REL}'
ORDER BY c.Priority, c.MWPropertyNo;
```

### 3.5 Pickers (saved pass-through QueryDefs used as combo row sources)

```sql
-- qptBR_Projects (static)
SELECT ProjectName FROM dbo.tblProjects ORDER BY ProjectName;

-- qptBR_Rels: SQL rewritten by SetRelListProject(proj) on project change, then cboRelationship.Requery
SELECT r.RelatedLoans,
       COUNT(l.MWLoanNo)                                   AS Loans,
       CAST(SUM(ISNULL(l.PrincipalBalance,0)) AS float)    AS UPB,
       r.SortNo
FROM dbo.tblRelationships r
LEFT JOIN dbo.tblLoan l ON l.ProjectName = r.ProjectName AND l.RelatedLoans = r.RelatedLoans
WHERE r.ProjectName = N'{PROJ}'
GROUP BY r.RelatedLoans, r.SortNo
ORDER BY r.SortNo, r.RelatedLoans;

-- qptBR_Ping (warm-up)
SELECT 1 AS ok;
```

`qptBR_Rels` is the only saved QueryDef whose `.SQL` is rewritten (one small catalog write per project change); the README recommends Compact on Close. `cboRelationship` shows RelatedLoans · Loans · UPB (SortNo hidden), `AutoExpand = True`. Prev/Next relationship buttons walk `cboRelationship.ListIndex` in tape order `[graft: ux]`.

### 3.6 Local tables (the only things written)

Created/upgraded by `EnsureLocalTables` (DDL with indexes; `EnsureField(table, field, type)` adds missing columns idempotently; `xtblBR_Settings` row `*`/`*` carries `SchemaVer`) `[graft: fidelity]`.

| Table | Purpose | Columns |
|---|---|---|
| `xtblBR_Inputs` | per-loan yellow inputs only (no results) | `ProjectName T(50), RelatedLoans T(100), LoanNo T(20), PmtSel T(20), UserPmt DBL, TermMonths LONG, MTrailSel T(3), TrailPct DBL, RateSel T(20), UserRate DBL, LegalInit DBL, LegalStartM LONG, HoldCost DBL, LegalEndM LONG, AddBack T(20), ExitType T(20), DPOPct DBL, UserExit DBL, ValCapPct DBL, YTMTgt DBL, AddAccrued T(3), LiqAcrM LONG, StartMonth LONG, ExitMonth LONG, BidOverride DBL (Null = none), UpdatedAt DATETIME`; unique index `(ProjectName, RelatedLoans, LoanNo)` |
| `xtblBR_Settings` | per relationship; `RelatedLoans = '*'` = project default; `ProjectName = '*'` = global | `ProjectName, RelatedLoans, YieldTarget DBL (0.15), AnchorDt DATE, CutoffDt DATE, MinMonthsJ2 LONG (0), HurdleYTM DBL (0.10), HurdleCY DBL (0.09), HurdleMOIC DBL (1.3), TrailDisp T(25), OptLoan T(20), Win LONG, LastProject T(50), LastRel T(100), PdExpr T(60), SchemaVer LONG, UpdatedAt` |
| `xtblBR_CollCache` | bound source of `fsubBR_Coll` | the Trip 2 columns + `RowNo LONG` |
| `xtblBR_OptCache` | bound source of `fsubBR_Optimal` | `LoanNo T(20), M LONG, Bid DBL, BidPct DBL, ImpDPO DBL, CY12 DBL, MOIC DBL, YTM DBL, YTMok BIT, PassYTM BIT, PassCY BIT, PassMOIC BIT, PassAll BIT` (LoanNo `'*'` = relationship rows) |
| `xtblBR_Snapshot` | print/export source | `Sheet T(12), RowNo LONG, Kind T(1), Caption T(40), L1..L10 T(30), Tot T(30)` — pre-formatted strings |
| `xtblBR_TestResults` | `BR_SelfTest` output | `CaseId T(40), Field T(30), Expected DBL, Actual DBL, Delta DBL, Pass BIT, RunAt DATETIME` |
| `xtblBR_Bench` | `BR_Bench` output | `RunAt, ProjectName, RelatedLoans, Loans LONG, MsServer, MsCalc, MsPaint, MsTotal DBL` |

Write policy: **write-behind, row-granular.** Editing one cell → `Seek`/`Edit`/`Update` on the indexed local row (1–2 ms). Results are never stored; they are derived. Loading reads one filtered local recordset (2–5 ms) and matches by `LoanNo` string equality (linear scan, ≤ 50 loans). New loans get a row with defaults at load. Migration: if `xtblBidReader` (v1.3) exists, its input columns are copied once into `xtblBR_Inputs` under the project chosen at the relationship's first v2 load; `xtblBidReaderSet → xtblBR_Settings`. v1.3 tables and forms are left in place for rollback.

Defaults for a new loan row: `PmtSel = "Current PMT"`, `MTrailSel = "3M"`, `TrailPct = 1`, `RateSel = "Contractual"`, `AddBack = "No"`, `ExitType = "PIF"`, `AddAccrued = "No"`, `StartMonth = 1`, `ExitMonth = 12`, `TermMonths = 0`, all money/rates 0, `LiqAcrM = 0`, `BidOverride = Null`.

---

## 4. Engine API (modBR_Fin + modBR_Engine)

All money is `Double`; all rates are decimal fractions per period as stated; nothing in the engine raises a runtime error — failure states come back through `ByRef ok As Boolean` or a `status As Long`. The engine never touches DAO or Forms; it is testable from the Immediate window with only `modBR_Fin`, `modBR_Engine`, `modBR_Vectors`, `modBR_SelfTest` imported.

### 4.1 Types

```vb
Public Type TOptRow
    Bid As Double: BidPct As Double: ImpDPO As Double: CY12 As Double: MOIC As Double
    YTM As Double: YTMok As Boolean
End Type

Public Type TLoan
    ' --- server snapshot (arm 2L)
    LoanNo As String: Seq As Long
    UPB As Double: IntBal As Double: CRate As Double: DRate As Double: CPmt As Double
    HasMat As Boolean: MatDt As Date: HasOrg As Boolean: OrgDt As Date
    ' --- local trails (from gPay at AnchorDt)
    T3 As Double: T6 As Double: T12 As Double: T24 As Double
    ' --- inputs (persisted)
    PmtSel As String: UserPmt As Double: TermMonths As Long: MTrailSel As String: TrailPct As Double
    RateSel As String: UserRate As Double
    LegalInit As Double: LegalStartM As Long: HoldCost As Double: LegalEndM As Long: AddBack As String
    ExitType As String: DPOPct As Double: UserExit As Double: ValCapPct As Double: YTMTgt As Double
    AddAccrued As Boolean: LiqAcrM As Long: StartMonth As Long: ExitMonth As Long
    HasOverride As Boolean: BidOverride As Double
    ' --- derived (white calc rows)
    MAI As Double: MAIok As Boolean: IntPmt As Double: TermPmt As Double: PctTrailPmt As Double
    MTM As Long: MTA As Long: MTAok As Boolean
    MRate As Double: PmtPull As Double
    FvAtExit As Double: ExpAdj As Double: ExitPull As Double
    Net(1 To 60) As Double: S12 As Double: SAll As Double
    ' --- results (green rows)
    BidModel As Double: BidUsed As Double
    BidPct As Double: CY12 As Double: MOIC As Double: ImpDPO As Double: BidMwVx As Double: F12P12 As Double
    RatioOk(1 To 6) As Boolean            ' BidPct, CY12, MOIC, ImpDPO, BidMwVx, F12P12 divisions valid
    MTMy As Double: MFTA As Double: MFTAok As Boolean: UseMTM As Long: BalAtExit As Double
    YtmIRR As Double: YtmIRRok As Boolean: YtmXIRR As Double: YtmXIRRok As Boolean
    SellYTM As Double: SellYTMok As Boolean
    Opt(1 To 60) As TOptRow
    MinHYTM As Long: MinHCY As Long: MinHMOIC As Long: MinHAll As Long   ' 0 = never
End Type

Public Type TRel
    ProjectName As String: RelatedLoans As String
    LoanCount As Long: Loans() As TLoan
    Yield As Double: AnchorDt As Date: CutoffDt As Date: HasCF As Boolean: CFStartPd As Long
    MinMonthsJ2 As Long: HurdleYTM As Double: HurdleCY As Double: HurdleMOIC As Double
    RelColl As Double: RelSellerAppr As Double: PropCount As Long: TapeAsOf As Date: HasTape As Boolean
    Tot As TLoan                          ' relationship column (sums / ratios of sums / IRRs of summed streams)
    RelOpt(1 To 60) As TOptRow: RelOptValid As Boolean
    RelMinH(1 To 4) As Long
    MsServer As Double: MsCalc As Double: MsPaint As Double
End Type

Public Type TUndo
    Valid As Boolean: LoanIdx As Long: Key As String: OldVal As Variant: NewVal As Variant
End Type
```

Configuration constants (top of `modBR_Engine`, each a CONFIRM item settled by the golden workbook, §8.2):

```vb
Public Const YTM_USE_PULLS As Boolean = False   ' False: YTM block/MTA/MFTA use contractual CRate & CPmt. True: use RatePull & PmtPull (v1.3 MTA behaviour).
Public Const OPT_YTM_MODE As Long = 0           ' 0: YTM_m = contractual-hold IRR priced at Bid_m. 1: IRR of modeled stream (constant = Yield; parity only).
Public Const IRR_GUESS As Double = 0.1          ' Excel default guess per period
Public Const NCOLS As Long = 10                 ' sheet columns C..L; set 8 for small screens (build-time)
```

### 4.2 modBR_Fin — Excel-semantics primitives

| Function | Definition |
|---|---|
| `FVx(r, n, pmt, pv) As Double` | Excel FV type 0: `r=0 → -(pv + pmt*n)`; else `-(pv*(1+r)^n + pmt*((1+r)^n - 1)/r)` |
| `PVx(r, n, pmt, Optional fv = 0) As Double` | Excel PV type 0: `r=0 → -(fv + pmt*n)`; else `-(fv + pmt*((1+r)^n - 1)/r)/(1+r)^n` |
| `PMTx(r, n, pv, Optional fv = 0) As Double` | `r=0 → -(pv+fv)/n`; else `-(pv*(1+r)^n + fv)*r/((1+r)^n - 1)`; `n=0 → 0, ok` not needed (caller guards TermMonths ≥ 1) |
| `NPERx(r, pmt, pv, ByRef ok) As Double` | Excel NPER fv 0: `r=0 → -pv/pmt` (ok iff pmt ≠ 0); else `a = pmt/(pmt + pv*r)`; `ok = (pmt + pv*r <> 0) And (a > 0) And (1+r > 0) And (r <> 0)`; returns `Log(a)/Log(1+r)` when ok, else `1E+9` (callers cap at 360 / treat as ∞). Excel returns `#NUM!` exactly when `ok = False`. |
| `NPVx(r, cf(), lo, hi) As Double` | Excel NPV: `Σ_{t=lo..hi} cf(t)/(1+r)^(t-lo+1)`; Horner from the end: `v = 1/(1+r); acc = 0; For t = hi To lo Step -1: acc = (acc + cf(t)) * v`. Zero `^` calls. |
| `Days360US(d1, d2) As Long` | Excel DAYS360 US/NASD (method FALSE), verified against Excel cached values. `D1 = Day(d1)`, `D2 = Day(d2)`. If `d1` is the last day of February → `D1 = 30`. If `D1 = 31` → `D1 = 30`. If `D2 = 31 And D1 = 30` (after adjustment) → `D2 = 30`. **The end date is never adjusted for Feb-end** (so `DAYS360(2025-01-30, 2025-02-28) = 28`, `DAYS360(2025-02-28, 2026-02-28) = 358`). Result `(Y2-Y1)*360 + (M2-M1)*30 + (D2-D1)`. `[graft: fidelity]` |
| `DateDifM(d1, d2) As Long` | Excel DATEDIF "m": `(Y2-Y1)*12 + (M2-M1) - IIf(Day(d2) < Day(d1), 1, 0)`; negative allowed (caller floors). Replaces v1.3's day-blind `DateDiff("m")`. `[graft: fidelity]` |
| `EDateX(d, n) As Date` | `DateAdd("m", n, d)` — identical month-end clamping to Excel EDATE. |
| `PdKey(d) As Long` | `Year(d)*100 + Month(d)` |
| `PdAdd(pd, n) As Long` | month arithmetic on yyyymm keys |
| `PdDiff(pdHi, pdLo) As Long` | `(pdHi\100 - pdLo\100)*12 + (pdHi Mod 100 - pdLo Mod 100)` |
| `IRRx(cf(), n, guess, ByRef status) As Double` | §4.3 |
| `IRRLevel(bid, pmt, nPer, bal, guess, ByRef status) As Double` | §4.3 |
| `XIRRx(cf(), e(), n, guess, ByRef status) As Double` | §4.4 |

Powers of `(1+r)^n` in FV/PV/PMT are single `^` calls per evaluation (fine); the streams never use `^` inside loops.

### 4.3 IRR — Excel-faithful root choice, then robust fallback `[spine: performance; graft: fidelity root order; graft: ux overflow guard]`

`IRRx(cf(0 To n), n, guess, status)` returns the **per-period** rate (monthly for our streams; callers multiply by 12). `status`: 0 ok · 1 no sign change in flows (Excel `#NUM!`) · 2 no bracket found · 3 iteration cap (returns best r, painted with "~" tooltip) · 4 non-positive price (caller-set when `cf(0) >= 0` for a bid stream).

Evaluation of `f` and `f'` in one Horner pass with `v = 1/(1+r)` (no `^`):
```
acc = 0: gacc = 0
For t = n To 1 Step -1
    acc  = acc  * v + cf(t)          ' after loop + cf(0): f = Σ cf(t) v^t
    gacc = gacc * v + t * cf(t)      ' Σ t cf(t) v^(t-1)
Next
f = acc * v + cf(0)                  ' (acc currently holds Σ_{t≥1} cf(t) v^(t-1))
fp = -v * v * gacc                   ' df/dr
```
(Implement exactly as: `acc = 0; For t = n To 0 Step -1: acc = acc*v + cf(t)`; and `gacc` over `t = n..1`.) Each evaluation is wrapped `On Error Resume Next` with `Err.Number = 6` (overflow) mapped to `f = ±1E+300` carrying the sign of the last non-zero flow (the correct limit sign as `v → ∞`) and `fp = 0`.

Algorithm:
1. **Scale:** `s = max|cf(t)|`; `s = 0 → status 1`. Work on `cf/s`.
2. **Feasibility:** need ≥ 1 negative and ≥ 1 positive flow (|cf| > 1e-12 after scaling); otherwise `status = 1` (this is the all-positive stream / Bid ≤ 0 case; UI shows "n/a").
3. **Phase 1 — Newton from Excel's guess** (default `IRR_GUESS = 0.1` per period, exactly what the sheet's `IRR(stream)` without a guess does): `r = guess`; up to 60 iterations: evaluate `f, fp`; if overflow or `|fp| < 1e-300` → phase 2. `r1 = r - f/fp`; if `r1 <= -1` then `r1 = (r - 1)/2` (damped, never crosses −1); if `r1 > 1E+3` → phase 2. Converged when `|r1 - r| <= 1e-12 * max(1, |r|)` → `r = r1`, go to 5. Excel stops at 1e-7 relative after 20 iterations; we continue to 1e-12 from the same path, so we land on Excel's root and polish it.
4. **Phase 2 — bracket + safeguarded Newton ("rtsafe")** only when phase 1 failed: fixed grid (per-period) `G = {-0.8, -0.7, -0.5, -0.3, -0.2, -0.1, -0.05, -0.02, -0.01, -0.005, 0, 0.0025, 0.005, 0.01, 0.02, 0.03, 0.05, 0.08, 0.12, 0.2, 0.35, 0.5, 1}`. Floor −0.8 keeps `v^n ≤ 5^360 ≈ 4e251` inside Double range for `n ≤ 360`; every node is still overflow-guarded as above. Evaluate `f` at all nodes; collect adjacent pairs with a sign change; none → `status = 2`. Several → the interval whose midpoint is closest to `guess`. Then up to 100 iterations of Newton steps accepted only when the iterate stays strictly inside `(lo, hi)` and `|dr|` at least halved versus the previous step, else bisection; shrink the bracket by the sign of `f`; stop when `hi - lo < 1e-13` or `|f| < 1e-12`. Cap reached → `status = 3`.
5. **Verify:** `|f(r)| <= 1e-6 * Σ|cf|/s` else `status = 2` (guards a Newton run that "converged" toward a pole).
6. Return `r` (unscaled — scaling does not change roots). Cost: n = 360 → ≤ (60 + 23 + 100) × 360 multiply-adds worst case, typically ~10 evaluations ≈ 0.3 ms.

Root multiplicity: the contractual-hold stream `[-Bid, pmt…, pmt+Bal]` has one sign change when Bid > 0 (unique root). The modeled net stream (Sell YTM; Optimal mode 1) can have extra sign changes when legal costs exceed a month's income; phase 1 from 0.1 reproduces Excel's choice; phase 2 is only reached where Excel itself returns `#NUM!`. Vectors `IRR-TWOROOT-*` document the behaviour.

`IRRLevel(bid, pmt, nPer, bal, guess, status)` — closed-form NPV for the level stream `[-bid, pmt × nPer, +bal at nPer]` used 60× per loan by the Optimal table: `r = 0 → f = -bid + pmt*nPer + bal`; else `vn = v^nPer` (one `^`), `f = -bid + pmt*(1 - vn)/r + bal*vn`, `fp = pmt*(nPer*vn*v*r - (1 - vn))/r^2 - nPer*bal*vn*v`. Same phase 1 / phase 2 / verify structure with `guess` = the previous month's root (warm start → 3–5 Newton steps). `bid <= 0 → status 4`.

### 4.4 XIRR

`XIRRx(cf(0..n), e(0..n), n, guess, status)`: `e(t) = (CLng(d_t) - CLng(d_0))/365` precomputed by the caller (Excel truncates dates to integer serials; `CLng(CDate)` equals the Excel serial for modern dates); `d_t = EDateX(CutoffDt, t)`. `f(r) = Σ cf(t)·Exp(-e(t)·Log(1+r))`, `f'(r) = -Σ e(t)·cf(t)·Exp(-(e(t)+1)·Log(1+r))`. Annual domain: phase 1 Newton from `guess = 0.1` (Excel's default) with damping below −1 and `r` clamped to `[-0.999999, 1E+3]`, ≤ 100 iterations (Excel's cap); phase 2 grid `{-0.99, -0.9, -0.5, -0.3, -0.1, 0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1, 2, 5, 10}` (with `e ≤ 30` years, `(1+r)^-e` at `r = -0.99` is `1e60`: no overflow; still guarded); verify as above. Returns the annual rate directly (no ×12). Precision: we polish to 1e-12 where Excel stops at ~1e-6 — tolerance in tests is 1e-6 absolute.

### 4.5 Per-loan calculation — `CalcLoan(ByRef L As TLoan, ByRef R As TRel)`

Statement order is identical in `bidcalc.py`. `mr = MRate`, `y = R.Yield/12`.

1. `IntPmt = UPB*CRate/12`; `MAI = IntBal/IntPmt` (`MAIok = IntPmt <> 0`).
2. Trails already set by `ComputeTrails` (§4.9).
3. `MTM = DateDifM(CutoffDt, MatDt)` (`HasMat = False → MTM = 0`, flagged in status). For the exit-solve `min(MTM, MTA)` the sheet uses the raw value; v2 floors the *displayed* MTM at nothing and uses `max(MTM, 1)` only where the brief's `max(...,1)` appears.
   `MTA`: `n = NPERx(rateSrc/12, pmtSrc, -UPB, ok)` where `(rateSrc, pmtSrc) = (CRate, CPmt)` unless `YTM_USE_PULLS` (then `(RatePull, PmtPull)`); `MTAok = ok`; `MTA = IIf(ok, Int(n), 360)` capped at 360 (Excel would show `#NUM!`; documented deviation "∞", painted as 360 with a tooltip).
4. `MRate = PickRate(RateSel, CRate, DRate, UserRate)/12`; `TermPmt = PMTx(MRate, TermMonths, -UPB)` (0 when `TermMonths < 1`); `PctTrailPmt = TrailPct × T_n/n` with `n` = 3/6/12 per `MTrailSel`; `PmtPull = PickPmt(...)`:
   `Current PMT → CPmt | User PMT → UserPmt | Interest PMT → UPB*MRate | Term PMT → TermPmt | % of M Trail PMT → PctTrailPmt`.
   `PickRate`: `Contractual → CRate | User Enter → UserRate | Default → DRate`.
5. `ExitPull = CalcExitPull(L, R, ExitMonth, FvAtExit, ExpAdj)` (§4.6).
6. `BuildStream(L, R, ExitMonth, ExitPull, Net)` (§5).
7. `BidModel = NPVx(y, Net, 1, 60)`; `BidUsed = IIf(HasOverride, BidOverride, BidModel)`; `S12 = ΣNet(1..12)`, `SAll = ΣNet(1..60)`.
   Ratios use **BidUsed**: `BidPct = BidUsed/UPB`; `CY12 = S12/BidUsed`; `MOIC = SAll/BidUsed`; `BidMwVx = BidUsed/RelColl`; `ImpDPO = 1 - ExitPull/FvAtExit`; `F12P12 = S12/T12`. Each division sets `RatioOk(k)`; a false flag paints "—". The `Bid` row always shows `BidModel` (the NPV), so the override's distance from the model is visible `[graft: fidelity]`.
8. `CalcYTM(L, R)` (contractual hold; `rateSrc/pmtSrc` as in step 3):
   `MTMy = max(0, Days360US(CutoffDt, MatDt)/30)` (0 if no maturity); `MFTA = NPERx(rateSrc/12, -pmtSrc, UPB, MFTAok)`; `Baseline = max(MTMy, R.MinMonthsJ2)`; `UseMTM = min(Int(IIf(MFTAok And MFTA < Baseline, MFTA, Baseline)), 360)`; `BalAtExit = -FVx(rateSrc/12, UseMTM, -pmtSrc, UPB)`; stream `c(0) = -BidUsed`, `c(t) = pmtSrc` for `t = 1..UseMTM`, `c(UseMTM) += BalAtExit`; `YtmIRR = 12 × IRRx(c, UseMTM, IRR_GUESS)`; `YtmXIRR = XIRRx(c, e, UseMTM, 0.1)` with `e(t) = (CLng(EDateX(CutoffDt, t)) - CLng(CutoffDt))/365`. `UseMTM = 0` or `BidUsed <= 0` → both n/a (status 4).
9. `SellYTM = 12 × IRRx([-BidUsed, Net(1..ExitMonth)], ExitMonth, IRR_GUESS)` — equals `Yield` to ~1e-10 when there is no override (self-test invariant); meaningful with an override.
10. `CalcOptimal(L, R)` then `CalcHurdles(L, R)` (§4.7).

`CalcRel(ByRef R)`: `CalcLoan` for every loan, then `CalcTotals(R)`: `Tot.UPB/IntBal/CPmt/T3/T6/T12/T24/ExitPull/BidModel/BidUsed/S12/SAll` = sums; `Tot.CRate` = UPB-weighted; `Tot.BidPct = ΣBidUsed/ΣUPB`; `Tot.CY12 = ΣS12/ΣBidUsed`; `Tot.MOIC = ΣSAll/ΣBidUsed`; `Tot.BidMwVx = ΣBidUsed/RelColl`; `Tot.F12P12 = ΣS12/ΣT12`; `Tot.ImpDPO = 1 - ΣExitPull/ΣFvAtExit`; `Tot.YtmIRR` = 12 × IRR of the element-wise sum of the loans' hold streams (length max UseMTM); `Tot.YtmXIRR` likewise; `Tot.SellYTM` = 12 × IRR of `[-ΣBidUsed, ΣNet(t)]`; `Tot.UseMTM = max`; `Tot.BalAtExit = Σ`; `Tot.MinH*` from `RelOpt` (lazy, §4.8). Sets `RelOptValid = False`.

### 4.6 Exit Pull — `CalcExitPull(L, R, exitM, ByRef fvAtExit, ByRef expAdj) As Double`

Inputs `pm = PmtPull`, `mr = MRate`, `y = Yield/12`, `st = StartMonth`.
- `fvAtExit = FVx(mr, exitM - st + 1, pm, -UPB) + pm`
- `accrued = IIf(AddAccrued, IntBal, 0)`
- `expAdj`: `"No" → 0`; `"Yes, Initial Only" → LegalInit`; `"Yes, Both" → LegalInit + (min(exitM, LegalEndM) - LegalStartM) × HoldCost`. **Not floored at 0** — the LET has no floor; vector `LEGAL-END-BEFORE-START` locks it `[graft: fidelity]`.
- `bid` by `ExitType`:
  - `PIF` → `fvAtExit + accrued`
  - `User Enter` → `UserExit`
  - `DPO` → `fvAtExit × (1 - DPOPct)`
  - `YTM Sell Solve` → `k = min(MTM, MTA)`; `-PVx(YTMTgt/12, k - exitM, pm, FVx(mr, k, pm, -UPB))`; when `k <= exitM` fall back to `fvAtExit + accrued` (Excel would give a PV over ≤ 0 periods; vector `EXIT-YTMSELL-PASTMAT` pins whichever the workbook shows — CONFIRM)
  - `Value Cap` → `RelColl × ValCapPct`
  - `Liquidation` → `FVx(mr, IIf(LiqAcrM >= 1, LiqAcrM, exitM), 0, -UPB) + accrued`
  - `IRR Solve` (closed form, no iteration):
    ```
    nper   = NPERx(mr, -pm, UPB, ok)                        ' ok=False → +inf
    ytm_m  = min(Int(min(nper, max(Days360US(CutoffDt, MatDt)/30, 1))), 360)
    ytmBal = -FVx(mr, ytm_m, -pm, UPB)
    tbid   = PVx(YTMTgt/12, ytm_m, -pm, -ytmBal)
    pvPmts = PVx(y, exitM - st, -pm) / (1+y)^(st - 1)
    pvLeg  = LegalInit / (1+y)^LegalStartM
    pvHold = PVx(y, min(LegalEndM, exitM - 1) - LegalStartM, -HoldCost) / (1+y)^LegalStartM   ' 0 when the count <= 0
    bid    = (tbid - pvPmts + pvLeg + pvHold) * (1+y)^exitM - expAdj
    ```
    Interpretation: the exit value at `exitM` that makes the modeled stream return exactly `Yield` when bought at `tbid` (the price the contractual hold commands at the YTM target). Identity (self-test): `BidModel = tbid + (pvExp_closedform - pvExp_stream)`, where the two expense PVs differ by exactly one discounted month of holding cost when `LegalEndM >= exitM` (the sheet holds to `exitM-1` in the closed form and to `exitM` in the stream) and by `pvLeg` when `LegalStartM = 0` (the closed form counts it, the stream does not). Both are **reproduced verbatim** and listed as CONFIRM items.
- Return `ExitPull = bid + expAdj`.

### 4.7 Optimal table and hurdles — `CalcOptimal(L, R)`, `CalcHurdles(L, R)`

For `m = 1..60`: `xp = CalcExitPull(L, R, m, fv_m, ea_m)`; `BuildStream(L, R, m, xp, net_m)`; `Opt(m).Bid = NPVx(y, net_m, 1, 60)`; `.BidPct = Bid_m/UPB`; `.ImpDPO = 1 - xp/fv_m`; `.CY12 = Σ_{t≤12} net_m(t)/Bid_m`; `.MOIC = Σ net_m/Bid_m`; `.YTM`:
- `OPT_YTM_MODE = 0` (default): `12 × IRRLevel(Bid_m, pmtSrc, UseMTM, BalAtExit, warm)` — the contractual-hold yield if you paid `Bid_m`; warm start from `Opt(m-1).YTM/12`. `Bid_m <= 0 → YTMok = False`.
- Mode 1: `12 × IRRx([-Bid_m, net_m(1..m)])` (equals `Yield` by construction; parity only).

`CalcHurdles`: `MinHYTM` = first `m` with `YTMok And YTM >= R.HurdleYTM`; `MinHCY` = first `m` with `CY12 >= R.HurdleCY`; `MinHMOIC` = first `m` with `MOIC >= R.HurdleMOIC`; `MinHAll` = first `m` passing all three; 0 = never (painted "—").

### 4.8 Relationship-level Optimal — `CalcRelOptimal(R)` (lazy)

Computed on first paint of the Optimal page after any change (`gStale And 8`): per `m`, `RelOpt(m).Bid = ΣBid_m`; `.BidPct = ΣBid_m/ΣUPB`; `.CY12 = ΣS12_m/ΣBid_m`; `.MOIC = ΣSAll_m/ΣBid_m`; `.ImpDPO = 1 - Σxp_m/Σfv_m`; `.YTM = 12 × IRRx` of the element-wise summed hold streams priced at `ΣBid_m` (60 generic solves on ≤ 360 terms ≈ 15–25 ms — the one deliberately deferred computation). `RelMinH(1..4)` as §4.7 over `RelOpt`. The v1.3 step-6 sensitivity table is the subset `m ∈ {6, 12, …, 60}`.

### 4.9 Trails and display transform

`ComputeTrails(R)`: `a = PdDiff(gPayPd0, PdKey(AnchorDt))` (index of the anchor month; negative if the anchor is newer than the tape → treat months beyond the tape as 0); for each loan `T_n = Σ gPay(i, a .. a+n-1)` for n = 3, 6, 12, 24 (indices outside `0..gPayMax` contribute 0). Anchor month inclusive, matching v1.3's `[anchor-(n-1), anchor]` window.

`TrailDisplay(s, n, sel, cpmt, ipmt) As Variant` — returns a **number** (the control's `Format` is switched per selection) or `Null` on a zero divisor: `Actual → s` · `monthly → s/n` · `yearly → s/n*12` · `% of Contractual → s/(cpmt*n)` · `% of Int PMT → s/(ipmt*n)` · `# of PMT's Made → s/cpmt` · `# of Int Pmt's Made → s/ipmt`. Formats: `$#,##0` for the first three, `0.0%` for the two percents, `0.0` for the two counts.

### 4.10 Input coercion — `SetInput(i, key, val, ByRef note As String) As Boolean`

Numbers via `IsNumeric`/`CDbl` (non-numeric → return False, UI reverts); rates typed as `8` normalised to `0.08` when `> 1`; clamps with a note: `ExitMonth 1..60`, `StartMonth 1..ExitMonth`, `LegalStartM 0..60`, `LegalEndM 0..60`, `TermMonths 0..480`, `LiqAcrM 0..360`, `DPOPct/ValCapPct 0..1`, `YTMTgt/UserRate 0..1`; combos validated against the exact value-list vocabulary (`LimitToList = True`); `BidOverride` empty → `HasOverride = False`.

---

## 5. Cash-flow timing rules (exact)

- **Period index.** `t = 1..60` are month-ends after the cutoff: month `t` ends at `EDateX(CutoffDt, t)`. `t = 0` is the cutoff date (the bid is paid at `t = 0`). NPV discounts month `t` by `(1+y)^t` (Excel NPV over `Net(1..60)`: first flow discounted once).
- **Cutoff (CF start).** `CutoffDt = DateSerial(cfstartyear, cfstartmonth, 1)` from `xTblCFparameters` when present (arm 1P `n5`), else the first day of the AnchorDt month; overridable in the header (persisted per relationship). Used by: `MTM` (DATEDIF), `MTMy` and IRR Solve's `ytm_m` (DAYS360), XIRR dates.
- **Anchor (PMT History Date).** Default = `TapeAsOf` (max `LastImport`) if present, else today; persisted per relationship. Used only for trailing windows and the Pay History matrix. Never touches the server.
- **Income.** `Income(t) = PmtPull` if `StartMonth <= t < ExitMonth`; `Income(ExitMonth) = ExitPull` (no payment in the exit month itself — `fvAtExit` already includes `+pm`). `Income(t) = 0` for `t > ExitMonth`.
- **Expense.** `Expense(t) = LegalInit` if `t = LegalStartM` (so `LegalStartM = 0` never books the initial legal in the stream); `+ HoldCost` if `LegalStartM < t <= min(LegalEndM, ExitMonth)` (with `LegalStartM = 0` holding runs from `t = 1`; with `LegalEndM = 0` holding never runs). Expenses are not truncated by `ExitMonth` beyond that `min`.
- **Net.** `Net(t) = Income(t) - Expense(t)`, `t = 1..60`; nothing after 60 (ExitMonth ≤ 60 enforced).
- **Exit value.** `fvAtExit` accrues `exitM - start + 1` periods of `PmtPull` at `MRate` on `-UPB` plus one `pm` — verbatim from the sheet.
- **Add-back.** `ExitPull = bid + expAdj` for every exit type (IRR Solve subtracts `expAdj` inside `bid` and adds it back: its ExitPull is the closed-form expression without the `- expAdj`).
- **Holding-window quirks (reproduced, not fixed).** IRR Solve's closed form counts holding months through `exitM - 1`; the stream counts through `exitM`. IRR Solve's `pvLeg` counts `LegalInit` when `LegalStartM = 0`; the stream does not.
- **Contractual-hold (YTM) stream.** `c(0) = -BidUsed` at `CutoffDt`; `c(t) = pmtSrc` at `EDateX(CutoffDt, t)` for `t = 1..UseMTM`; `+BalAtExit` at `t = UseMTM`. `UseMTM` is the floor of the lesser of `MFTA` and `max(MTMy, J2)`, capped at 360.
- **Sell YTM stream.** `[-BidUsed, Net(1..ExitMonth)]` (truncated at the exit month; every later `Net` is 0 anyway).
- **Optimal month `m`.** Each row re-evaluates the loan's own exit type at `exitM = m` (DPO uses `fv_m`; YTM Sell Solve and IRR Solve use `m`; User Enter and Value Cap are constant; Liquidation uses `LiqAcrM` if ≥ 1 else `m`; legal windows follow `min(LegalEndM, m)`).
- **Pay-history month index.** `idx = PdDiff(anchorPd, pd)`; trail `n` sums `idx = 0..n-1`; matrix row `k` (0 = newest) shows `idx = k`, labelled `Format(DateSerial(y, m, 1), "mmm-yy")`.

---

## 6. UI specification

### 6.1 Forms and objects

| Object | Type | Notes |
|---|---|---|
| `frmBidReader` | main, unbound, `HasModule=False`, `PopUp=False`, `Modal=False`, `AutoCenter`, `AutoResize=False`, `BorderStyle=Sizable`, `RecordSelectors/NavigationButtons=No`, `ScrollBars=Neither`, `AllowEdits=True`, width 11.7" | Header 0.95": pickers/globals/buttons. Detail: tab control `tabMain` (4 pages), `VerticalAnchor=acVerticalAnchorBoth` so it stretches to the window; each page holds one subform control with the same anchoring. Footer 0.26": status line. |
| `fsubBR_Proj` | unbound single-form subform, `AllowEdits=True`, cells `Locked`, `ScrollBars=Vertical`, `Cycle=CurrentRecord` | The sheet. Header section 0.28" (frozen): loan-number row + pager. Detail: 58 rows (§6.3). |
| `fsubBR_PayHist` | unbound single-form subform, `AllowEdits=True`, `Locked` cells | Stats block (7 rows) + 36-month matrix, painted from `gPay`; no server, no local writes. |
| `fsubBR_Optimal` | continuous, bound `xtblBR_OptCache`, `AllowEdits/Additions/Deletions=False`, **no unbound controls on it** | 60 rows × (M, Bid, Bid %, Implied DPO, 12M CY, MOIC, YTM) filtered by the page's loan selector; FormatConditions on the bound fields. |
| `fsubBR_Coll` | continuous, bound `xtblBR_CollCache`, `AllowEdits/Additions/Deletions=False`, **no unbound controls on it** | v1.3's two-line-per-property layout; footer `Sum()` totals + 90% line. |
| `rptBR_Projection` | report, landscape, source `xtblBR_Snapshot` | Print/PDF twin of the sheet `[graft: ux]`. |
| `qptBR_Projects`, `qptBR_Rels`, `qptBR_Ping` | saved pass-through QueryDefs | §3.5 |

Tab pages are created with `CreateControl(frm, acPage, acDetail, "tabMain", ...)` and page children with `Parent := pageName`. A 1-hour spike in M3 verifies this on the target Access version; the generator keeps `USE_TABCTL` with a fully implemented fallback (four overlapping subform controls toggled by `Visible` from a strip of label "tabs" wired to `=BR_ShowPage(n)`).

### 6.2 Control naming scheme

| Pattern | Where | Example |
|---|---|---|
| `c{i}_{Key}` | Projection detail cell, loan column `i = 1..NCOLS` | `c3_ExitMonth` |
| `cT_{Key}` | Projection Relationship column | `cT_BidNPV` |
| `l_{Key}` | Projection row caption | `l_ExitMonth` |
| `h{i}_LoanNo`, `hT_LoanNo` | frozen header cells | `h1_LoanNo` |
| `cTrailDisp` | the single Trail Selection combo (Relationship column of the TrailDisp row) | |
| `btnPgPrev`, `lblPg`, `btnPgNext` | pager in the Projection/PayHist header | |
| `p{i}_{Stat}` / `pT_{Stat}` | PayHist stats block, `Stat ∈ {Orig, Pmt, IntPmt, T3, T6, T12, T24}` | `p2_T12` |
| `m{k}_{i}` / `m{k}_T` / `m{k}_Lbl` | PayHist matrix row `k = 0..35`, loan column `i` / total / month label | `m11_4` |
| `txtAnchor, txtCutoff, txtYield, txtJ2, cboTrailDisp` | header globals | |
| `cboProject, cboRelationship, btnRelPrev, btnRelNext` | pickers | |
| `btnReload, btnUndo, btnResetLoan, btnResetAll, btnApplyAll, btnPrint, btnExport` | header buttons | |
| `cboOptLoan, txtHYTM, txtHCY, txtHMOIC, s{i}_{H}` | Optimal page strip; hurdle block `H ∈ {YTM, CY, MOIC, All}`, `i = 1..NCOLS` and `T` | `s4_CY` |
| `cboUnitSel, txtUnitVal, txtCalcVal` | Collateral page strip (what-if) | |
| `lblStatus`, `lblConn`, `lblTape` | footer / header info | |
| `sub_Proj, sub_PayHist, sub_Optimal, sub_Coll` | subform controls on the pages | |

### 6.3 Projection row table (sheet order; `LoanNo` row lives in the frozen header)

Kinds: `g` data (white, locked) · `c` calc (white, locked) · `y` yellow input · `Y` yellow combo · `r` result (green) · `s` section band · `t` the single Trail Selection combo. Captions are the workbook's verbatim (including its spellings). Formats use a 4th section so `Null` paints as an em-dash.

| # | Key | Caption | Kind | Format |
|---|---|---|---|---|
| H | LoanNo | Loan Number | header | text, left |
| 1 | UPB | UPB | g | `$#,##0;($#,##0);0;"—"` |
| 2 | IntBal | Interest | g | `$#,##0;($#,##0);0;"—"` |
| 3 | MAI | MAI | c | `0.0;-0.0;0.0;"—"` |
| 4 | CRate | Rate | g | `0.00%` |
| 5 | DRate | Default Rate | g | `0.00%` |
| 6 | MatDt | Maturity | g | `mm/dd/yy` |
| 7 | CPmt | PMT | g | `$#,##0;($#,##0);0;"—"` |
| 8 | MTM | MTM | c | `0;-0;0;"—"` |
| 9 | MTA | MTA | c | `0;-0;0;"—"` |
| 10 | RelColl | Rel Collateral | c | `$#,##0` |
| 11 | T3 | 3M Trail | c | per Trail Selection |
| 12 | T6 | 6M Trail | c | per Trail Selection |
| 13 | T12 | 12M Trail | c | per Trail Selection |
| 14 | TrailDisp | Trail Selection | t | value list |
| 15 | PmtSel | Payment Selection | Y | value list |
| 16 | PmtPull | Payment Pull | c | `$#,##0` |
| 17 | IntPmt | Interest Payment | c | `$#,##0` |
| 18 | UserPmt | User PMT | y | `$#,##0` |
| 19 | TermPmt | Term PMT | c | `$#,##0` |
| 20 | TermMonths | Term Months | y | `0` |
| 21 | PctTrail | % X Trail PMT | c | `$#,##0` |
| 22 | MTrailSel | M Trail | Y | value list |
| 23 | TrailPct | Trail % | y | `0.00%` |
| 24 | RateSel | Rate Selection | Y | value list |
| 25 | RatePull | Rate Pull | c | `0.00%` |
| 26 | UserRate | User Rate | y | `0.00%` |
| 27 | LegalHdr | Legal | s | — |
| 28 | LegalInit | Initial Legal $ | y | `$#,##0` |
| 29 | LegalStartM | Intial Start M | y | `0` |
| 30 | HoldCost | Holding Cost $ | y | `$#,##0` |
| 31 | LegalEndM | Legal End M | y | `0` |
| 32 | AddBack | Add Back to Exit | Y | value list |
| 33 | ExitType | Exit Type | Y | value list (+ `IRR Solve`) |
| 34 | ExitVal | Exit Pull | r | `$#,##0;[Red]($#,##0);0;"—"` |
| 35 | DPOPct | DPO % | y | `0.00%` |
| 36 | UserExit | User Enter | y | `$#,##0` |
| 37 | ValCapPct | Value Cap | y | `0.00%` |
| 38 | YTMTgt | YTM Target % | y | `0.00%` |
| 39 | AddAccrued | Add Current Accrued | Y | value list |
| 40 | LiqAcrM | LQDN Forward Acr M | y | `0` |
| 41 | ImpDPO | Implied DPO | r | `0.0%;-0.0%;0.0%;"—"` |
| 42 | StartMonth | Start Mont | y | `0` |
| 43 | ExitMonth | Exit Month | y | `0` |
| 44 | BidPct | Bid % | r | `0.0%;-0.0%;0.0%;"—"` |
| 45 | BidNPV | Bid | r | `$#,##0;[Red]($#,##0);0;"—"` |
| 46 | CY12 | 12M CY | r | `0.0%;-0.0%;0.0%;"—"` |
| 47 | MOIC | MOIC | r | `0.00;-0.00;0.00;"—"` |
| 48 | BidMwVx | Bid/MwVx | r | `0.0%;-0.0%;0.0%;"—"` |
| 49 | F12P12 | F12/P12 PMT | r | `0.00;-0.00;0.00;"—"` |
| 50 | YtmHdr | YTM (contractual hold) | s | — |
| 51 | UseMTM | Use MTM | c | `0;-0;0;"—"` |
| 52 | BalAtExit | Bal at Exit | c | `$#,##0;($#,##0);0;"—"` |
| 53 | YtmIRR | YTM (IRR) | r | `0.00%;-0.00%;0.00%;"—"` |
| 54 | YtmXIRR | YTM (XIRR) | r | `0.00%;-0.00%;0.00%;"—"` |
| 55 | BidOverride | Bid Override | y | `$#,##0;($#,##0);0;""` |
| 56 | SellYTM | Sell YTM | r | `0.00%;-0.00%;0.00%;"—"` |
| 57 | HurdleHdr | Hurdles | s | — |
| 58 | MinHAll | Min Hurdle Month (All) | r | `0;-0;0;"—"` (0 painted as Null → "—") |

Value lists (every item `Chr(34)`-quoted by `VL()`; `LimitToList = True`, `AutoExpand = True`):
`PmtSel`: Current PMT · User PMT · Interest PMT · Term PMT · % of M Trail PMT — `MTrailSel`: 3M · 6M · 12M — `RateSel`: Contractual · User Enter · Default — `AddBack`: No · Yes, Initial Only · Yes, Both — `ExitType`: PIF · User Enter · DPO · YTM Sell Solve · Value Cap · Liquidation · IRR Solve — `AddAccrued`: Yes · No — `TrailDisp`: Actual · monthly · yearly · % of Contractual · % of Int PMT · # of PMT's Made · # of Int Pmt's Made.

Control budget for `fsubBR_Proj` at `NCOLS = 10`: 54 cell rows × 10 = 540; Relationship column on the 32 non-input rows = 32; 58 captions; 1 `cTrailDisp`; header 11 loan cells + 3 pager = **645 of 754** (`NCOLS = 8`: 537). The generator asserts `< 720` and always creates a fresh form. Headroom ≈ 8 more rows.

### 6.4 Geometry and visual tokens

| Token | Value |
|---|---|
| Font | Calibri; cells 9 pt; captions 8 pt bold `#333333`; section captions 9 pt bold `#1F4E79`; title 12 pt bold `#1F4E79`; status 8 pt `#666666` |
| Row height `RH` | 0.21" (cells 0.20" tall) |
| Caption column | x 0.05", w 1.45" |
| Loan columns | `X0 = 1.55"`, pitch `COLW = 0.85"`, cell width 0.80" |
| Relationship column | x `X0 + NCOLS×COLW + 0.05`, w 0.95" (→ 10.55" / 8.85") |
| Page/sheet width | 11.6" (`NCOLS=10`), 9.9" (`NCOLS=8`); 1366×768 at 100% shows all columns; the sheet scrolls vertically inside the subform |
| Grid | every cell `BorderStyle=Solid`, `BorderColor #D9D9D9`, `SpecialEffect=Flat`, `BackStyle=Normal`; no per-cell rectangles |
| Palette (RGB hex → Access Long) | page white `#FFFFFF` (16777215); banded row `#F8F8F8` (16316664); header panel `#F0F0F0` (15790320); band `#D9D9D9` (14277081); **input yellow `#FFFFCC`** (13434879); focus yellow `#FFE699`; **result fill `#E2EFDA`** (14348258) with **dark-green text `#375623`** (2315831); title/section blue `#1F4E79` (7949855); secondary text `#333333`; muted `#666666`; gridline `#BFBFBF`/`#D9D9D9`; buttons `#E6E6E6` (15132390); pass `#E2EFDA`, fail `#FCE4D6`; invalid flash `#F8CBAD`; override-active text `#C65911` |
| Section bands (`s` rows) | full-width label, `BackStyle=Normal`, `BackColor #D9D9D9`, caption bold `#1F4E79` — Legal · YTM (contractual hold) · Hurdles |
| Relationship column | `#F2F2F2` bold on g/c rows, result fill on r rows, blank on input rows |
| Loan header cells | `#F2F2F2` bold, centred, 1.5 pt bottom rule (one rectangle across the header) |
| Negative numbers | red parentheses via the Format string |
| n/a | `Null` + 4th Format section → "—" in the cell's own color |
| Focus | one `FormatCondition` of type `acFieldHasFocus` on every `y`/`Y` cell → `BackColor #FFE699` `[graft: ux]`; no GotFocus/LostFocus handlers |
| Override active | `FormatCondition` expression `Not IsNull([c{i}_BidOverride])` on `c{i}_BidNPV` → `ForeColor #C65911` |
| Hurdle cells | `FormatCondition` on `c{i}_YtmIRR` `>= Forms!frmBidReader!txtHYTM` → green text, else `#C00000`; same for `CY12` / `MOIC` |
| Tab strip | native `Style=Tabs`, `UseTheme=False` (SafeSet), `BackStyle=Normal`, page background white, Calibri 10 bold, `TabFixedWidth=1.4"` |
| Buttons | flat, `#E6E6E6`, 1 px `#BFBFBF` border, Calibri 9 |

### 6.5 Header, pager, status line

- Header row 1 (y 0.05"): title `RELATIONSHIP PROJECTION` · `Project` combo · `Relationship` combo (3 visible columns) · `◀ ▶` relationship Prev/Next + "12 of 41" · right-aligned buttons `Reload` · `Undo` · `Reset loan` · `Reset all` · `Apply to all` · `Print/PDF` · `Export .xlsx`.
- Header row 2 (y 0.50"): yellow globals with captions above: `PMT History Date` (`txtAnchor`) · `Cutoff Date` (`txtCutoff`) · `Yield` (`txtYield`, `0.00%`) · `YTM Min Months` (`txtJ2`) · `Trail Selection` (`cboTrailDisp`); right: `lblTape` "Tape as of 08/29/26 · 12 loans · UPB $4,215,880 · Collateral $6,120,000 · CF start 09/2026".
- Frozen loan-number row: in the **subform header** of `fsubBR_Proj` and `fsubBR_PayHist` (so the tab strip, the main header and the loan numbers all survive scrolling on a 1366×768 screen); each header cell's `ControlTipText` = maturity and origination date; the pager `◀ Loans 1–10 of 14 ▶` sits at the right of the same header, visible only when `LoanCount > NCOLS`.
- Footer `lblStatus` (left, 9"): plain-language last action — `Loan 0012-3456 · Exit Month 24 → 30 · Bid $1,204,300 (was $1,188,910) · 21 ms`; after a load: `Loaded 12 loans · 488 pay rows · 3 properties · server 71 ms · calc 9 ms · paint 62 ms`; `lblConn` (right, muted): `sqlDueDiligence · MidwestDDi · read-only` `[graft: ux]`.
- Invalid input: cell reverts to the shown value, `BackColor #F8CBAD` until the next paint of that cell, status says why. **No modal MsgBox anywhere in the edit path.**

### 6.6 Painting / sweeping protocol (loans as columns)

- There is **no sweep** (v1.3's read-back of all cells before recalc is gone): every edit goes straight into `gRel` via `SetInput`; the form is a view of the model.
- Control references are cached once per subform instance (`gCell(i, r)` on first paint; re-cached if `Forms` instance changes) — removes ~600 name lookups per paint `[graft: ux]`.
- `PaintProjection(colMask As Long)`: `Application.Echo False`; `sub.Form.Painting = False`; for each column `i` in the mask (bit `i`; bit 0 = totals; `&HFFFF` = all): loan `k = gWin + i - 1`; if `k > LoanCount` hide the column (`Visible = False` on its cells, only when visibility changes) else for each row assign `newVal` **only when `Nz(newVal, "~") <> Nz(gShown(i, r), "~")`** (dirty cache; `CStr(Null)` never evaluated); trail rows also switch `Format` when `cboTrailDisp` changed. Then restore `Painting`/`Echo` in a `Done:` label reached on every error path.
- Edit repaints ~30 cells (one column + totals); a global change ~200; a relationship switch ≤ 646.
- Values are assigned raw (numbers/dates/Null); the control `Format` renders them; combos receive the string.
- Paints never fire `AfterUpdate` (code assignment does not raise it); `gBusy` guards re-entrancy anyway.
- `fsubBR_PayHist` paints the same way from `gPay` (`PaintPayHist`), including per-cell `BackColor` for `= 0` (missed month, `#FCE4D6`) and `< 0.9 × CPmt` (short month, `#FFF2CC`) tracked in `gPHShown` so only state changes repaint; the anchor row is bold `[graft: ux]`.
- `fsubBR_Optimal` and `fsubBR_Coll` are bound: their caches are rewritten (`BeginTrans`/`AddNew`/`CommitTrans`) only when their page becomes visible and the relevant `gStale` bit is set, then `Requery`.
- Optimal page strip: `cboOptLoan` (defaults to the last edited loan; `*` = Relationship) filters the subform (`Filter = "LoanNo='...'"`); hurdle inputs `txtHYTM/txtHCY/txtHMOIC`; hurdle stat block `s{i}_{H}` painted (4 rows × NCOLS + Rel = Min Hurdle Month per stat); button `Use month as Exit →`; double-clicking a row in the grid (`OnDblClick = "=BR_OptPick()"`, reading `Forms!frmBidReader!sub_Optimal.Form!M`) sets that loan's Exit Month through the normal edit path `[graft: ux]`.

### 6.7 Navigation and editing interaction

- `cboProject.AfterUpdate = "=BR_ProjectChanged()"` → rewrite `qptBR_Rels`, requery, select the remembered or first relationship.
- `cboRelationship.AfterUpdate = "=BR_RelChanged()"` → load sequence: `gBusy = True` → `LoadSettings` (relationship → project default → global → hardcoded) → Trip 1 → `LoadInputs` → `ComputeTrails` → `CalcRel` → `gWin = 1` (or persisted) → `PaintHeader` + `PaintProjection(&HFFFF)` → `gStale = 15` → paint the visible page if not Projection → status/HUD → `gBusy = False`. Failure (DSN missing, timeout): the grid is cleared, the status line shows "Cannot reach sqlDueDiligence — Reload to retry"; nothing partial is painted.
- Every `y`/`Y` cell: `AfterUpdate = "=BR_CellChanged(""c{i}_{Key}"")"`. `BR_CellChanged(nm)`: parse `i`/`Key`; `k = gWin + i - 1`; read the cell; `SetInput` (revert on False); push `gUndo`; `SaveLoanInput(k, Key)`; `CalcLoan(k)`; `CalcTotals`; `RelOptValid = False`; `PaintProjection(bit i Or bit 0)`; set `gStale = gStale Or 1 Or 4 Or 8`; if the Optimal page is visible and shows loan `k` or `*`, refresh its cache now; status line with old → new value and old → new Bid. Budget ≤ 30 ms.
- Header globals: `txtYield/txtJ2/txtCutoff` → `BR_GlobalChanged("txtYield")` → `SaveSettings`, `CalcRel`, `PaintProjection(&HFFFF)` (dirty-checked). `txtAnchor` → `SaveSettings`, `ComputeTrails`, `CalcRel`, paint (purely local). `cboTrailDisp` → repaints rows 11–13 and the PayHist stats only. Hurdle inputs on the Optimal page → `SaveSettings`, `CalcHurdles` for every loan, `CalcRelOptimal`, repaint the stat block, `MinHAll` row and the grid's pass flags.
- `tabMain.OnChange = "=BR_TabChanged()"` → lazy fill of the shown page.
- `btnPgPrev/Next` → `BR_Page(-1/1)`: `gWin` shifts by `NCOLS` (clamped so the last window is full when possible); repaint all columns; persisted in settings.
- `btnUndo` → re-applies `gUndo.OldVal` through `BR_CellChanged` semantics (and swaps old/new so Undo toggles). `btnApplyAll` → copies the value of the last edited yellow cell to every loan (with a status note listing how many were changed; one undo restores... only the last cell — documented). `btnResetLoan/All` → defaults for the focused column / all loans (confirmation in the status line via a two-click pattern: first click arms "Click again to reset", second within 5 s resets). `btnReload` → Trip 1 again, inputs kept. `btnPrint` → snapshot + `rptBR_Projection` preview (PDF via `DoCmd.OutputTo acOutputReport, ..., acFormatPDF`). `btnExport` → three `TransferSpreadsheet acExport, acSpreadsheetTypeExcel12Xml` calls (Projection, PayHist, Optimal) into `%USERPROFILE%\Documents\BidReader\<Rel>_<yyyymmdd-hhmm>.xlsx`.
- Keyboard: `TabIndex` assigned **column-major over yellow cells only** (read-only cells `TabStop = False`), so Tab/Enter walks down a loan's inputs and continues at the top of the next loan; Shift+Tab walks up; combos accept typed prefixes. Ctrl+Tab switches pages when the tab control has focus. No other shortcuts (see Non-goals).

### 6.8 Recalc interaction summary

There is no "recalc" button dependency — the model is always consistent after each edit. `Reload` refetches the tape; nothing else asks the server.

### 6.9 > NCOLS loans

Columns are a window `gWin..gWin+NCOLS-1` over `gRel.Loans` (sorted by UPB desc, as the sheet lays them out). The Relationship column always totals **all** loans. The Pay History stats/matrix columns and the Optimal hurdle block use the same window. Header caption `Loans 11–14 of 14`. Columns beyond `LoanCount` are hidden. A relationship with ≤ NCOLS loans hides the pager.

---

## 7. Performance budget (warm connection, 10 loans, office LAN)

| Operation | Budget | Where the time goes |
|---|---|---|
| Form open | 250–450 ms | form load with ~650 + ~120 controls; `qptBR_Projects` trip; warm-up ping in the background of the user's first click |
| Trip 1 (pass-through) | 60–150 ms | SQL login reuse 0; server 5–40 ms; ODBC/network 30–60 ms; `GetRows` of ≤ 1,500 × 12 cells 5–10 ms |
| Local inputs read + defaults | 2–5 ms | one indexed local recordset |
| `ComputeTrails` + `CalcRel` (10 loans) | 15–30 ms | per loan: stream/NPV 0.05 ms; YTM IRR (≤ 360 terms, Newton from 0.1) 0.3 ms; XIRR 0.8 ms (Exp/Log); Sell YTM 0.05 ms; Optimal 60 × (stream + NPV + closed-form IRR) 0.8 ms; hurdles 0.01 ms → ≈ 2 ms/loan; relationship IRRs 1–2 ms |
| `PaintProjection(all)` | 60–120 ms | ≤ 646 assignments × 0.1–0.2 ms with Echo/Painting off, one final render |
| **Relationship switch, total** | **≈ 150–300 ms** (p95 ≤ 500) | v1.3: 72+ ODBC domain calls ≈ 4–10 s |
| Single yellow-cell edit | **≈ 10–30 ms** | parse 0.1; local row write 1–2; `CalcLoan` 2; totals 0.3; ~30 dirty cells 5–8; Echo toggle 5 |
| Yield / J2 / Cutoff change | ≈ 40–90 ms | `CalcRel` 20 + ~200 dirty cells 30–60 |
| PMT History Date change | ≈ 40–90 ms | local trails + `CalcRel` + paint (no server) |
| Hurdle change | ≈ 20–60 ms | hurdles + `CalcRelOptimal` (15–25) + block/row paint |
| Trail Selection change | < 10 ms | 33 + 40 cells |
| Page ◀ ▶ | ≈ 60–110 ms | full column repaint |
| Pay History page first show | ≈ 40–70 ms | 509 cells from memory (dirty-checked thereafter) |
| Optimal page first show | ≈ 50–90 ms | `CalcRelOptimal` 15–25 + 660 cache rows in one transaction 20–30 + `Requery` 20 |
| Collateral page first show | ≈ 60–120 ms | Trip 2 50–80 + cache 5 + `Requery` 15; 0 afterwards |
| Project change | ≈ 50–90 ms | `qptBR_Rels` rewrite + requery (one trip) |
| Print snapshot + preview | ≈ 1–1.5 s | 60 local inserts + report render |
| xlsx export | ≈ 1–2 s | three `TransferSpreadsheet` calls |
| Build (`BuildBidReaderV2`) | 4–8 s once | ~1,300 `CreateControl` calls |

Rules that keep it there: no `DLookup`/`DSum` anywhere; no server call inside calc or paint; no `^` inside loops; control references cached; dirty-cell painting; bound subforms only over local caches; the relationship-level 60 generic IRRs are the only deferred computation. The status line shows the last operation's ms so regressions are visible to users; `BR_Bench` records p50/p95 into `xtblBR_Bench`.

---

## 8. Test strategy

### 8.1 Three-way vector loop (Excel cached values are the authority) `[graft: fidelity]`
1. `make_vectors.py` writes `BidVectors.xlsx`: one row per case (≈ 120 hand-designed in named groups + 300 seeded-random), columns = every `TLoan` input + globals, followed by **live Excel formulas** transcribed from the sheet's LETs (FV/PV/PMT/NPER/NPV/IRR/XIRR/DAYS360/DATEDIF/EDATE/SWITCH) producing every output field, the 60 `Net(t)` values, `Opt` rows for `m ∈ {1, 6, 12, 24, 36, 60}` and the four hurdle months (MINIFS over helper columns). Ambiguities are **CONFIRM cells** an analyst settles by pasting the real sheet's formula over the transcription.
2. An analyst opens the workbook in Excel once, presses F9, saves. `extract_vectors.py` reads cached values (`openpyxl data_only=True`) → `vectors.csv` (`case_id, field, expected, tol, excel_error`).
3. `pytest test_bidcalc.py`: `bidcalc.py` (statement-for-statement mirror of `modBR_Engine`, on `excelfin.py`) equals the cached values within tolerance; an Excel error must coincide with a Python `None`/flag. LibreOffice headless recalculation is a CI smoke check only (its DAYS360/XIRR differ from Excel at the edges).
4. `gen_vba_vectors.py` → `modBR_Vectors.bas`. `BR_SelfTest` runs every case through `CalcLoan`/`CalcOptimal`/`IRRx`/`XIRRx`, writes `xtblBR_TestResults`, prints a summary to the Immediate window. **Gate: 100% pass before any UI work continues.**

### 8.2 CONFIRM items (settled in the workbook, then frozen as constants/vectors)
- YTM block, MTA and MFTA: contractual `Rate`/`PMT` vs Rate Pull / Payment Pull (`YTM_USE_PULLS`; v1.3 used the pulls for MTA).
- Cutoff source: `xTblCFparameters` start vs anchor month start.
- Hold-window quirks in IRR Solve (`exitM-1` vs `exitM`; `pvLeg` with `LegalStartM = 0`).
- YTM Sell Solve when `min(MTM, MTA) <= exitM`.
- `Opt` `YTM_m` definition (`OPT_YTM_MODE`).
- MTM for a missing maturity date.

### 8.3 Tolerances
Currency `|Δ| ≤ 0.005`; ratios/percents `|Δ| ≤ 1e-9` relative; IRR/XIRR `|Δ| ≤ 1e-6` absolute (Excel's own convergence noise is the floor; a larger mismatch means a different root); integers exact; n/a ⇔ Excel error exactly.

### 8.4 Named edge groups
`D360-*` (start/end on 28/29/30/31, Feb leap and non-leap, `2/28→2/28 = 358`, `1/30→2/28 = 28`, `1/15→2/28 = 43`, maturity before cutoff) · `DATEDIF-*` (day rollover, cutoff on the 31st) · `EDATE-*` · `NPER-*` (rate 0; pmt = interest; pmt < interest → `#NUM!`/∞; huge n capped 360) · `IRR-*` (all-positive; all-negative; Bid 0; two sign changes; root > 1/period; tiny streams; `[-100, 110] = 0.10`) · `XIRR-*` (Excel's documented example → 0.373362535; leap years; `UseMTM = 1` and 360) · `LEGAL-*` (`LegalStart 0`; `LegalStart > exit`; `LegalEnd < LegalStart`; hold 0; all three add-backs) · `EXIT-*` (each of 7 exit types at exit 1, 24, 60; start > exit; User Enter 0; IRR Solve identity `BidModel = tbid + residual`) · `OPT-*` (hurdle never met; met at m = 1; warm-start equals cold-start) · `OVERRIDE-*` (Sell YTM ≠ Yield; ratios on BidUsed) · `TRAIL-*` (all 7 transforms; zero PMT/IntPmt divisors; anchor newer than tape; anchor older than 36 months) · `REL-*` (14-loan relationship; loan numbers with leading zeros/hyphens; no collateral → Bid/MwVx n/a; no CF params).

### 8.5 Property tests (no oracle needed, in both Python and `BR_SelfTest`)
`IRRx([-NPVx(y, cf), cf]) = y`; `SellYTM = Yield` without override (1e-9); `Bid × MOIC = ΣNet`; NPV decreasing in yield; XIRR vs `(1+IRR)^(365/(365/12)) - 1` within 2e-4 (documented monthly-vs-day-count approximation); `Days360US` vectors; every solver returns a status and never raises on any vector.

### 8.6 Data layer — `BR_SqlCheck`
For 3 real relationships: local `T3/T6/T12/T24` and matrix cells equal the §3.3 pivot query; `RelColl` equals `SUM(MwVx)` of Trip 2; loan count equals arm 1P `n1`; every money column arrives as `vbDouble`; Trip 1 server time ≤ 50 ms in SSMS (`SET STATISTICS TIME ON`).

### 8.7 Build and UI smoke — `BR_UISmoke`
`BuildBidReaderV2` on a blank accdb asserts: control counts (`fsubBR_Proj < 720`, `fsubBR_PayHist < 600`, main < 300); every `=BR_*` expression referenced by a property resolves (`Application.Run` probe under `On Error`); value lists round-trip through `Chr(34)`; `DoCmd.RunCommand acCmdCompileAndSaveAllModules` succeeds; `lint_bas.py` clean. Then: open `frmBidReader`, pick the first relationship, edit `c1_ExitType` through `BR_CellChanged`, assert painted cells equal model values, switch all four pages, page a synthetic 14-loan model, run print snapshot and export to the scratch folder.

### 8.8 Perf acceptance — `BR_Bench`
20 relationships (1–15 loans): p50 switch ≤ 300 ms, p95 ≤ 500 ms; 50 scripted edits: p95 ≤ 40 ms. Results in `xtblBR_Bench` and the Immediate window.

### 8.9 Pilot
Two analysts run v2 beside the workbook on 5 relationships; sign-off compares Bid, Bid %, MOIC, 12M CY, YTM(IRR), YTM(XIRR), Sell YTM, Min Hurdle Months to the cent / 4 dp; the parity log is committed to `docs/bidreader-parity.md` (no PII: relationship identifiers are hashed).

---

## 9. Risk register (VBA gotchas → mitigations)

| # | Risk / gotcha | Mitigation |
|---|---|---|
| 1 | DAO `CreateTableDef` for ODBC links fails in some environments | v2 links nothing. Pass-through only; DSN is the only dependency. `BR_LinkForBrowsing` (v1.3 code verbatim) is optional and never called by the build. |
| 2 | Event wiring: `[Event Procedure]` + `CreateEventProc` after final names; injected code rules | **No injection at all.** `HasModule=False` everywhere; every event is `="=BR_Xxx(""literal"")"` to Public Functions in standard modules. |
| 3 | `Screen.ActiveControl` unreliable inside subforms | Control names baked into the event expressions; forms addressed by explicit path (`Forms!frmBidReader!sub_Proj.Form`). |
| 4 | Setting non-existent properties on a control type | Per-`ControlType` style helpers; `SafeSet(ctl, prop, val)` (CallByName under `On Error Resume Next`) only for optional properties (`UseTheme`, `VerticalAnchor`, `FormatConditions`, `TabFixedWidth`). |
| 5 | ≤ 24 line continuations per statement; 1,023-char lines | SQL, value lists, row arrays and vectors are built in loops or `s = s & "..."` per statement; `lint_bas.py` fails the build on > 20 continuations or > 900-char lines. |
| 6 | Value-list items containing commas | `VL(ParamArray)` `Chr(34)`-quotes every item; `"Yes, Initial Only"` is the regression case; `LimitToList=True`. |
| 7 | `AllowEdits=False` freezes unbound controls (error 2448 on code assignment) | Painted forms (`fsubBR_Proj`, `fsubBR_PayHist`, main) are `AllowEdits=True` with `Locked` cells; bound subforms (`fsubBR_Optimal`, `fsubBR_Coll`) are `AllowEdits=False` and carry **no unbound controls** — their selectors/inputs/calculators live on the main form's page strips. |
| 8 | No horizontal continuous forms | Fixed `NCOLS` painted columns + paging window; Relationship column always totals all loans. |
| 9 | Expression-service UDFs must be Public in standard modules; name clashes with `IRR`/`NPV`/`Pmt` | All engine/UI functions are prefixed (`BR_`, `IRRx`, `NPVx`, …) and Public in standard modules. |
| 10 | 754 controls per form lifetime | Subform per page; explicit budgets (645 / ~535 / ~120); forms always recreated from scratch; generator asserts counts. |
| 11 | `Echo False` / `Painting=False` left on after an error → frozen UI | Every entry point ends in a `Done:` label restoring both; `BR_Unfreeze()`; Echo never off across any dialog. |
| 12 | ODBC login latency / DSN missing / timeouts | Warm-up ping at load with status text; `ODBCTimeout=20`; friendly status banner with `Reload`; no partial grid. |
| 13 | Loan numbers are TEXT (leading zeros, hyphens) | Never converted; `N'...'` literals via `Q()`; local `LoanNo Text(20)`; string-equality matching. |
| 14 | Rates typed as `8` instead of `0.08` | `SetInput` normalises `> 1` by ÷100 with a status note; `0.00%` formats. |
| 15 | Regional date literals in SQL | Server SQL carries integer `yyyymm` keys only; local writes via DAO `Edit/Update`. |
| 16 | Double overflow in `v^n` (VBA raises error 6, no Inf/NaN) | Horner with `v = 1/(1+r)`; monthly grid floored at −0.8 (`5^360` fits); every node evaluation wrapped `On Error Resume Next` mapping overflow to ±1E+300 with the sign of the last non-zero flow; XIRR via `Exp/Log` with `r ≥ -0.999999`; Newton iterates clamped. `[graft: ux]` |
| 17 | VBA `NPer/PV/FV/IRR` raise on edge inputs | Own closed forms with `ok`/`status`; NPER → `1E+9` sentinel capped at 360. |
| 18 | Excel picks a different IRR root than a generic solver on multi-sign-change streams | Newton from Excel's guess (0.1) first, bracket only as fallback, verify step; `IRR-TWOROOT-*` vectors. `[graft: fidelity]` |
| 19 | DAYS360 / DATEDIF / EDATE subtleties | Own implementations (§4.2) with `D360-*`/`DATEDIF-*`/`EDATE-*` groups against Excel cached values; end-date Feb rule explicitly NOT applied. |
| 20 | Tab-control page parenting via `CreateControl` | 1-hour spike first (M3); `USE_TABCTL` fallback fully implemented. |
| 21 | Sheet-formula ambiguities (YTM rate/pmt source, cutoff, hold windows, YTM Sell Solve past maturity) | CONFIRM cells in `BidVectors.xlsx`; constants `YTM_USE_PULLS`/`OPT_YTM_MODE`; vectors encode the chosen behaviour so a later flip is one constant + regenerated vectors. |
| 22 | DAO Decimal/Currency Variants from `money` columns | `CAST(... AS float)` in every SELECT; `BR_SqlCheck` asserts `vbDouble`. |
| 23 | `pd` not a physical column on some server | Build-time probe stores `PdExpr` (`(p.[year]*100 + p.[month])` fallback) used by both queries. |
| 24 | Value-list 32 KB limit / list-box look | No large value lists; grids are painted cells or bound subforms over local caches. |
| 25 | `Timer` resolution (~15 ms); `Declare` under AppLocker | HUD only; `BR_Bench` averages over 20 runs; no `Declare` statements at all. |
| 26 | Tape changes mid-session | `Tape as of` in the header; `Reload` button; nothing cached across sessions except inputs/settings. |
| 27 | Front-end bloat from rewriting saved QueryDef SQL | Only `qptBR_Rels` is rewritten (per project change); everything else uses temp QueryDefs; README recommends Compact on Close. |
| 28 | Dirty cache `CStr(Null)` runtime error | Comparisons via `Nz(v, "~")`; `gShown` cleared on relationship load. |
| 29 | Parent `KeyPreview` cannot see subform keystrokes | No keyboard chords; all actions are buttons; native Tab/Enter flow only. |
| 30 | Bound Optimal FormatConditions comparing text to numbers | Pass flags are stored as `BIT` columns in `xtblBR_OptCache`; FormatConditions test `[PassYTM] = True`, never a formatted string. |
| 31 | Collateral what-if control source referencing `Parent!` not refreshing | Calculator lives entirely on the main-form strip: `txtCalcVal` control source `=IIf([cboUnitSel]="SF",[txtUnitVal]*[txtSqft],...)` with the selected property's size copied into hidden main-form cells by `BR_CollRowChanged()` (`OnCurrent` of `fsubBR_Coll`). |
| 32 | 1366×768 screens: 8.9" pages do not fit | `tabMain` and subform controls `VerticalAnchor=acVerticalAnchorBoth`; subform headers (loan numbers) are frozen inside the subforms; sheet scrolls within the page. |
| 33 | Local table schema drift across rebuilds / users' v1.3 data | `EnsureField` + `SchemaVer`; one-time v1.3 → v2 input migration; v1.3 objects left untouched for rollback. |
| 34 | Pass-through returns only the first result set | One `UNION ALL` result set per load (§3.2); Collateral detail is its own lazy query. |
| 35 | Export/print paths | `TransferSpreadsheet` and `OutputTo acFormatPDF` are built into Access (no executables); target folder created with `MkDir` under `%USERPROFILE%\Documents`; failures reported in the status line only. |

---

## 10. Build order and milestones

| M | Deliverable | Exit criterion |
|---|---|---|
| **M0 — Reference & SQL (day 1)** | `excelfin.py`, `bidcalc.py`, `make_vectors.py`, `BidVectors.xlsx` (analyst F9), `extract_vectors.py`, `vectors.csv`, `pytest` green; Trip 1, Trip 2 and the §3.3 check query validated in SSMS on 3 relationships (row counts, T-sums vs SUMIFS, server time). CONFIRM items answered. | Python == Excel cached values; SQL timings recorded. |
| **M1 — Engine (days 2–3)** | `modBR_Fin`, `modBR_Engine`, generated `modBR_Vectors`, `modBR_SelfTest.BR_SelfTest`. Import into a blank accdb; no forms. | `BR_SelfTest` 100% pass; property tests pass; no runtime error on any vector. **Fidelity gate.** |
| **M2 — Data (day 4)** | `modBR_Data`: `BR_OpenPT`, `BuildLoadSql`, `LoadRelationship` + dispatch into `gRel`/`gPay`, local tables + `EnsureField` + v1.3 migration, inputs/settings persistence, `BR_SqlCheck`, `BR_Bench` (load-only). | p50 Trip 1 ≤ 150 ms warm; `BR_SqlCheck` green on 3 relationships. |
| **M3 — Main form + Projection (days 5–7)** | Tab-control spike → `USE_TABCTL` decision; `modBR_Build` generates `frmBidReader` (header, pager, status) + `fsubBR_Proj` (58 rows, `NCOLS=10`, frozen header); `modBR_UI` control cache, dirty paint, `BR_CellChanged` edit path, undo, apply-to-all, reset, status line; column-major TabIndex; visual pass against the workbook screenshot. | Switch ≤ 300 ms and edit ≤ 30 ms in the HUD; first underwriter demo. |
| **M4 — Optimal + hurdles (day 8)** | `xtblBR_OptCache` writer, `fsubBR_Optimal` with pass-flag FormatConditions, Optimal page strip (loan selector, hurdle inputs, stat block, Use-month button, double-click), `MinHAll` row live. | Hurdle months match vectors; page first-show ≤ 90 ms. |
| **M5 — Pay History + Collateral (day 9)** | `fsubBR_PayHist` painted stats + matrix with missed/short colouring and pager coupling; Trip 2, `xtblBR_CollCache`, `fsubBR_Coll`, totals + 90% line, what-if strip. | Matrix equals check query; Collateral `RelColl` equals engine value. |
| **M6 — Print / export (day 10)** | `xtblBR_Snapshot` writer, `rptBR_Projection` (landscape, Kind-based conditional formatting, PDF), 3-sheet xlsx export. | PDF and xlsx produced in the scratch folder from `BR_UISmoke`. |
| **M7 — Hardening (day 11)** | `Done:` audits, `BR_Unfreeze`, `lint_bas.py`, control-count assertions, compile-all, `BR_UISmoke`, `BR_Bench` acceptance run, README (import 7 files → `BuildBidReaderV2`; test subs; Compact on Close; CONFIRM answers). | All assertions green; p50/p95 within §7. |
| **M8 — Pilot (days 12–13)** | Two analysts, 5 relationships beside the workbook; parity log; v1.3 forms left in place for rollback. | Sign-off to the cent / 4 dp; then v1.3 forms removed from the build in a follow-up. |

Deliverables: `access/modBR_Fin.bas`, `modBR_Engine.bas`, `modBR_Data.bas`, `modBR_UI.bas`, `modBR_Build.bas`, `modBR_SelfTest.bas`, generated `modBR_Vectors.bas`; `tools/bidref/*`; `access/README-BidReader-v2.md`; `docs/bidreader-parity.md`.
