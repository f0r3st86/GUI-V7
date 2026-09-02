# Relationship Projection v2 — Interface Contract (frozen)

Every module below is written by a different implementer in parallel. These signatures are
**exact and frozen**: implement them verbatim (names, argument order, ByRef/ByVal, types) and
consume only what is listed. Anything not listed is `Private` to its module. Design authority:
`docs/BIDREADER-V2-DESIGN.md`; numeric authority: `scripts/bid_engine_ref.py`.

Global rules (all modules): `Option Compare Database`, `Option Explicit`, first line
`Attribute VB_Name = "<module>"`. No `Declare`. No module-level code outside declarations.
Public names are prefixed (`BR_`, `FVx`, `NPVx`, …) to avoid clashing with VBA/Access built-ins.
Max 20 line continuations per statement; no physical line > 900 chars. No `Me` in standard
modules — address forms explicitly (`Forms("frmBidReader")`, `Forms("frmBidReader")!sub_Proj.Form`).
Nothing in Fin/Engine raises: failures come back via `ByRef ok`/`status`.

---

## modBR_Fin  (pure; no DAO/Forms)

```vb
Public Function FVx(r As Double, n As Double, pmt As Double, pv As Double) As Double
Public Function PVx(r As Double, n As Double, pmt As Double, Optional fv As Double = 0) As Double
Public Function PMTx(r As Double, n As Double, pv As Double, Optional fv As Double = 0) As Double
Public Function NPERx(r As Double, pmt As Double, pv As Double, ByRef ok As Boolean) As Double   ' 1E+9 when Not ok
Public Function NPVx(r As Double, cf() As Double, lo As Long, hi As Long) As Double            ' Excel NPV: cf(lo) discounted once
Public Function Days360US(d1 As Date, d2 As Date) As Long
Public Function DateDifM(d1 As Date, d2 As Date) As Long                                       ' Excel DATEDIF "m", may be negative
Public Function EDateX(d As Date, n As Long) As Date
Public Function PdKey(d As Date) As Long
Public Function PdAdd(pd As Long, n As Long) As Long
Public Function PdDiff(pdHi As Long, pdLo As Long) As Long
' cf(0..n) with cf(0) at t=0. status: 0 ok, 1 no sign change, 2 no bracket, 3 iteration cap, 4 non-positive price
Public Function IRRx(cf() As Double, n As Long, guess As Double, ByRef status As Long) As Double
Public Function IRRLevel(bid As Double, pmt As Double, nPer As Long, bal As Double, guess As Double, ByRef status As Long) As Double
' e(0..n) = years from t0 (Excel: (serial_t - serial_0)/365); returns ANNUAL rate
Public Function XIRRx(cf() As Double, e() As Double, n As Long, guess As Double, ByRef status As Long) As Double
```

## modBR_Engine  (pure; no DAO/Forms)

```vb
Public Const YTM_USE_PULLS As Boolean = False
Public Const OPT_YTM_MODE As Long = 0
Public Const IRR_GUESS As Double = 0.1
Public Const NCOLS As Long = 10
Public Const NROWS As Long = 58            ' rows in RowDefs (LoanNo header row not counted)

Public Type TOptRow
    Bid As Double
    BidPct As Double
    ImpDPO As Double
    CY12 As Double
    MOIC As Double
    YTM As Double
    YTMok As Boolean
End Type

Public Type TLoan     ' every field named in DESIGN §4.1, one member per line
    ... (LoanNo, Seq, UPB, IntBal, CRate, DRate, CPmt, HasMat, MatDt, HasOrg, OrgDt,
         T3, T6, T12, T24,
         PmtSel, UserPmt, TermMonths, MTrailSel, TrailPct, RateSel, UserRate,
         LegalInit, LegalStartM, HoldCost, LegalEndM, AddBack,
         ExitType, DPOPct, UserExit, ValCapPct, YTMTgt, AddAccrued As Boolean, LiqAcrM, StartMonth, ExitMonth,
         HasOverride, BidOverride,
         MAI, MAIok, IntPmt, TermPmt, PctTrailPmt, MTM, MTA, MTAok, MRate, PmtPull,
         FvAtExit, ExpAdj, ExitPull, Net(1 To 60), S12, SAll,
         BidModel, BidUsed, BidPct, CY12, MOIC, ImpDPO, BidMwVx, F12P12, RatioOk(1 To 6),
         MTMy, MFTA, MFTAok, UseMTM, BalAtExit, YtmIRR, YtmIRRok, YtmXIRR, YtmXIRRok, SellYTM, SellYTMok,
         Opt(1 To 60) As TOptRow, MinHYTM, MinHCY, MinHMOIC, MinHAll)
End Type

Public Type TRel      ' DESIGN §4.1
    ... (ProjectName, RelatedLoans, LoanCount, Loans() As TLoan, Yield, AnchorDt, CutoffDt, HasCF, CFStartPd,
         MinMonthsJ2, HurdleYTM, HurdleCY, HurdleMOIC, RelColl, RelSellerAppr, PropCount, TapeAsOf, HasTape,
         Tot As TLoan, RelOpt(1 To 60) As TOptRow, RelOptValid, RelMinH(1 To 4), MsServer, MsCalc, MsPaint)
End Type

Public Type TUndo
    Valid As Boolean
    LoanIdx As Long
    Key As String
    OldVal As Variant
    NewVal As Variant
End Type

Public gRel As TRel
Public gPay() As Double        ' gPay(1..LoanCount, 0..gPayMax); index 0 = newest month (gPayPd0)
Public gPayMax As Long
Public gPayPd0 As Long

Public Sub InitLoanDefaults(ByRef L As TLoan)              ' DESIGN §3.6 defaults
Public Sub InitRelDefaults(ByRef R As TRel)                 ' Yield .15, hurdles .10/.09/1.3, J2 0
Public Function PickRate(sel As String, cr As Double, drt As Double, ur As Double) As Double     ' annual
Public Function PickPmt(ByRef L As TLoan, mr As Double) As Double
Public Function CalcExitPull(ByRef L As TLoan, ByRef R As TRel, exitM As Long, ByRef fvAtExit As Double, ByRef expAdj As Double) As Double
Public Sub BuildStream(ByRef L As TLoan, ByRef R As TRel, exitM As Long, exitPull As Double, ByRef net() As Double)   ' net(1 To 60)
Public Sub CalcLoan(ByRef L As TLoan, ByRef R As TRel)      ' steps 1-10 of DESIGN §4.5 (incl. CalcYTM, CalcOptimal, CalcHurdles)
Public Sub CalcYTM(ByRef L As TLoan, ByRef R As TRel)
Public Sub CalcOptimal(ByRef L As TLoan, ByRef R As TRel)
Public Sub CalcHurdles(ByRef L As TLoan, ByRef R As TRel)
Public Sub CalcTotals(ByRef R As TRel)
Public Sub CalcRel(ByRef R As TRel)                         ' CalcLoan for all + CalcTotals; RelOptValid = False
Public Sub CalcRelOptimal(ByRef R As TRel)
Public Sub ComputeTrails(ByRef R As TRel)                   ' from gPay at R.AnchorDt
Public Function TrailDisplay(s As Double, n As Long, sel As String, cpmt As Double, ipmt As Double) As Variant
Public Function TrailFormat(sel As String) As String        ' "$#,##0" | "0.0%" | "0.0"
' Input coercion + clamps (DESIGN §4.10). key = row Key. Returns False (and note) when rejected.
Public Function SetInput(ByRef L As TLoan, key As String, val As Variant, ByRef note As String) As Boolean
' Read any row value for painting by Key (inputs, snapshot, derived, results); Null for n/a
Public Function LoanValue(ByRef L As TLoan, key As String) As Variant
Public Function TotValue(ByRef R As TRel, key As String) As Variant    ' Relationship column; Null where not defined
Public Function IsInputKey(key As String) As Boolean
' The sheet's row table (single source of truth for Build + UI). Arrays are 1-based, size NROWS.
' kind: g data | c calc | y input | Y input combo | r result | s section | t trail-selection combo
Public Sub RowDefs(ByRef keys() As String, ByRef caps() As String, ByRef kinds() As String, ByRef fmts() As String)
Public Function ValueList(key As String) As String          ' Chr(34)-quoted ";" list for Y/t rows (DESIGN §6.3)
```

Row keys, in order (1..58): UPB, IntBal, MAI, CRate, DRate, MatDt, CPmt, MTM, MTA, RelColl, T3, T6, T12,
TrailDisp, PmtSel, PmtPull, IntPmt, UserPmt, TermPmt, TermMonths, PctTrail, MTrailSel, TrailPct, RateSel,
RatePull, UserRate, LegalHdr, LegalInit, LegalStartM, HoldCost, LegalEndM, AddBack, ExitType, ExitVal, DPOPct,
UserExit, ValCapPct, YTMTgt, AddAccrued, LiqAcrM, ImpDPO, StartMonth, ExitMonth, BidPct, BidNPV, CY12, MOIC,
BidMwVx, F12P12, YtmHdr, UseMTM, BalAtExit, YtmIRR, YtmXIRR, BidOverride, SellYTM, HurdleHdr, MinHAll.
(Captions/kinds/formats: DESIGN §6.3 verbatim.)

## modBR_Data  (DAO; no Forms except none)

```vb
Public Const CONNECT As String = "ODBC;DSN=sqlDueDiligence;DATABASE=MidwestDDi;Trusted_Connection=Yes;APP=Microsoft Office;Encrypt=Optional;TrustServerCertificate=Yes"
Public Function Q(v As Variant) As String                            ' doubles single quotes, no wrapping quotes
Public Function BR_OpenPT(sql As String, Optional timeoutSec As Long = 20) As DAO.Recordset   ' temp pass-through, snapshot/read-only
Public Function BR_Ping(ByRef ms As Double) As Boolean
Public Function PdExpr() As String                                   ' "p.pd" or the year/month fallback (stored setting)
Public Function BuildLoadSql(proj As String, rel As String) As String
Public Function BuildTrailCheckSql(proj As String, rel As String, anchorPd As Long) As String
Public Function BuildCollSql(proj As String, rel As String) As String
' Fills gRel (scalars + Loans snapshot) and gPay/gPayMax/gPayPd0. Keeps existing inputs? NO — caller runs LoadInputs after.
Public Function LoadRelationship(proj As String, rel As String, ByRef errMsg As String) As Boolean
Public Function LoadCollateral(proj As String, rel As String, ByRef errMsg As String) As Boolean   ' -> xtblBR_CollCache
Public Sub SetRelListProject(proj As String)                          ' rewrites qptBR_Rels SQL
Public Sub EnsureLocalTables()                                        ' creates/upgrades all xtblBR_* (DESIGN §3.6), saved qpt* QueryDefs
Public Sub EnsureField(tbl As String, fld As String, ddlType As String)
Public Sub LoadInputs(ByRef R As TRel)                                ' per-loan inputs from xtblBR_Inputs (defaults + v1.3 migration)
Public Sub SaveLoanInput(ByRef R As TRel, i As Long, key As String)  ' write-behind one row
Public Sub SaveAllInputs(ByRef R As TRel)
Public Sub LoadSettings(ByRef R As TRel)                              ' relationship -> project default -> global -> hardcoded
Public Sub SaveSettings(ByRef R As TRel)
Public Function GetGlobal(name As String, Optional dflt As Variant = Null) As Variant     ' xtblBR_Settings row */*
Public Sub SetGlobal(name As String, val As Variant)
Public Sub WriteOptCache(ByRef R As TRel)                             ' xtblBR_OptCache: per loan + '*' rows
Public Sub WriteSnapshot(ByRef R As TRel)                             ' xtblBR_Snapshot for print/export
```

Local tables and columns: DESIGN §3.6 verbatim (names exact). Saved QueryDefs: `qptBR_Projects`,
`qptBR_Rels`, `qptBR_Ping` (pass-through, `ReturnsRecords = True`, Connect = CONNECT).

## modBR_UI  (Forms + Engine + Data)

```vb
Public gWin As Long
Public gCell() As Control          ' gCell(1..NCOLS+1, 1..NROWS): column NCOLS+1 = Relationship column
Public gShown() As Variant
Public gHead() As Control          ' gHead(1..NCOLS+1) loan-number header cells
Public gPH() As Control            ' PayHist matrix/stat cells (implementer's shape)
Public gPHShown() As Variant
Public gBusy As Boolean
Public gStale As Long              ' 1 Optimal cache, 2 Collateral cache, 4 PayHist paint, 8 RelOpt
Public gUndo As TUndo
Public gLastKey As String          ' last edited row key (Apply-to-all source)
Public gLastLoan As Long

' Event entry points (all return Variant; bound via ="=BR_Xxx(...)" property strings)
Public Function BR_FormLoad() As Variant
Public Function BR_ProjectChanged() As Variant
Public Function BR_RelChanged() As Variant
Public Function BR_RelStep(dir As Long) As Variant
Public Function BR_CellChanged(nm As String) As Variant       ' nm = "c{i}_{Key}"
Public Function BR_GlobalChanged(nm As String) As Variant     ' txtYield | txtJ2 | txtCutoff | txtAnchor | cboTrailDisp
Public Function BR_TabChanged() As Variant
Public Function BR_ShowPage(n As Long) As Variant             ' fallback strip (USE_TABCTL = False)
Public Function BR_Page(dir As Long) As Variant
Public Function BR_Undo() As Variant
Public Function BR_ApplyAll() As Variant
Public Function BR_ResetLoan() As Variant
Public Function BR_ResetAll() As Variant
Public Function BR_Reload() As Variant
Public Function BR_Print() As Variant
Public Function BR_Export() As Variant
Public Function BR_OptLoanChanged() As Variant
Public Function BR_HurdleChanged() As Variant
Public Function BR_OptPick() As Variant
Public Function BR_UseMonth() As Variant
Public Function BR_CollRowChanged() As Variant
Public Function BR_Unfreeze() As Variant
' Painters / helpers used by SelfTest/UISmoke
Public Sub SetStatus(msg As String)
Public Sub PaintHeader()
Public Sub PaintProjection(colMask As Long)                   ' bit 0 = Relationship column, bit i = loan column i, &HFFFF = all
Public Sub PaintPayHist()
Public Sub PaintOptimalBlock()
```

Form/control names the UI addresses (created by Build): main `frmBidReader`; tab `tabMain` with pages
`pgProj`, `pgOptimal`, `pgPayHist`, `pgColl`; subform controls `sub_Proj`, `sub_PayHist`, `sub_Optimal`,
`sub_Coll` (SourceObjects `fsubBR_Proj`, `fsubBR_PayHist`, `fsubBR_Optimal`, `fsubBR_Coll`);
header controls `cboProject`, `cboRelationship`, `btnRelPrev`, `btnRelNext`, `lblRelPos`, `btnReload`,
`btnUndo`, `btnResetLoan`, `btnResetAll`, `btnApplyAll`, `btnPrint`, `btnExport`, `txtAnchor`, `txtCutoff`,
`txtYield`, `txtJ2`, `cboTrailDisp`, `lblTape`, `lblConn`; footer `lblStatus`; Optimal strip `cboOptLoan`,
`txtHYTM`, `txtHCY`, `txtHMOIC`, `btnUseMonth`, `s{i}_{H}` for `i = 1..NCOLS` and `T`, `H ∈ {YTM, CY, MOIC, All}`;
Collateral strip `cboUnitSel`, `txtUnitVal`, `txtCalcVal`, hidden `txtSqft`, `txtUnits`, `txtAcres`.
`fsubBR_Proj`: header `h{i}_LoanNo`, `hT_LoanNo`, `btnPgPrev`, `lblPg`, `btnPgNext`; detail `c{i}_{Key}`,
`cT_{Key}` (g/c/r rows only), `l_{Key}`, `cTrailDisp`. `fsubBR_PayHist`: header `h{i}_LoanNo`/`hT_LoanNo`/pager;
stats `p{i}_{Stat}`, `pT_{Stat}`, `Stat ∈ {Orig, Pmt, IntPmt, T3, T6, T12, T24}`; matrix `m{k}_{i}`, `m{k}_T`,
`m{k}_Lbl`, `k = 0..35`. Bound subforms: `fsubBR_Optimal` fields M, Bid, BidPct, ImpDPO, CY12, MOIC, YTM,
PassYTM, PassCY, PassMOIC, PassAll (controls named `txt<Field>`); `fsubBR_Coll` v1.3 layout over
`xtblBR_CollCache`.

Event property strings (Build sets exactly these):
`cboProject.AfterUpdate = "=BR_ProjectChanged()"`; `cboRelationship.AfterUpdate = "=BR_RelChanged()"`;
`btnRelPrev.OnClick = "=BR_RelStep(-1)"`; `btnRelNext.OnClick = "=BR_RelStep(1)"`;
`c{i}_{Key}.AfterUpdate = "=BR_CellChanged(""c{i}_{Key}"")"`; `txtYield.AfterUpdate = "=BR_GlobalChanged(""txtYield"")"`
(same pattern for txtJ2/txtCutoff/txtAnchor/cboTrailDisp); `tabMain.OnChange = "=BR_TabChanged()"`;
`btnPgPrev.OnClick = "=BR_Page(-1)"`; `btnPgNext.OnClick = "=BR_Page(1)"`; buttons → `"=BR_Undo()"` etc.;
`cboOptLoan.AfterUpdate = "=BR_OptLoanChanged()"`; `txtHYTM/txtHCY/txtHMOIC.AfterUpdate = "=BR_HurdleChanged()"`;
`btnUseMonth.OnClick = "=BR_UseMonth()"`; `fsubBR_Optimal` detail `OnDblClick = "=BR_OptPick()"`;
`fsubBR_Coll.OnCurrent = "=BR_CollRowChanged()"`; `frmBidReader.OnLoad = "=BR_FormLoad()"`.

## modBR_Build

```vb
Public Const USE_TABCTL As Boolean = True
Public Sub BuildBidReaderV2()            ' EnsureLocalTables, drop+create forms/report, assert control counts, compile
Public Sub BR_LinkForBrowsing()          ' optional: v1.3 LinkReaderTables verbatim (never called by build)
```

## modBR_SelfTest

```vb
Public Sub BR_SelfTest()                 ' engine vs modBR_Vectors -> xtblBR_TestResults + Immediate summary
Public Sub BR_SqlCheck()                 ' local trails/matrix vs BuildTrailCheckSql for the loaded relationship
Public Sub BR_Bench()                    ' p50/p95 timings -> xtblBR_Bench
Public Sub BR_UISmoke()
```

## modBR_Vectors  (GENERATED by tools/bidref/gen_vectors.py — never hand-edited)

```vb
Public Function BR_CaseCount() As Long
Public Function BR_CaseId(c As Long) As String
' Flat Variant array (from Split) of "name|value" strings, one per input: every TLoan input field
' name (PmtSel, UserPmt, ... ExitMonth, BidOverride) plus snapshot fields (UPB, IntBal, CRate, DRate,
' CPmt, MatDt, T3, T6, T12, T24) plus globals (Yield, CutoffDt, AnchorDt, MinMonthsJ2, HurdleYTM,
' HurdleCY, HurdleMOIC, RelColl). Dates are ISO yyyy-mm-dd; modBR_SelfTest.ApplyCaseInputs parses them.
Public Function BR_CaseInputs(c As Long) As Variant
' Flat Variant array of "field|expected|tol" strings; a blank expected means "must be n/a".
Public Function BR_CaseExpected(c As Long) As Variant
```
Expected fields: PmtPull, ExitVal (ExitPull), BidNPV (BidModel), BidPct, CY12, MOIC, ImpDPO, BidMwVx,
F12P12, MTM, MTA, UseMTM, BalAtExit, YtmIRR, YtmXIRR, SellYTM, MinHYTM, MinHCY, MinHMOIC, MinHAll,
Net01..Net60 (sampled: 1, 2, 12, 23, 24, 25, 36, 60), Opt06_Bid, Opt12_Bid, Opt24_Bid, Opt36_Bid, Opt60_Bid.
