Attribute VB_Name = "modBR_Data"
Option Compare Database
Option Explicit

' =====================================================================
' modBR_Data - data access for Relationship Projection v2.
' SQL Server is READ-ONLY by construction: every read is a temporary
' pass-through SELECT (never updatable, nothing linked). Only the
' local xtblBR_* scratch tables are written.
' =====================================================================

Public Const CONNECT As String = "ODBC;DSN=sqlDueDiligence;DATABASE=MidwestDDi;Trusted_Connection=Yes;APP=Microsoft Office;Encrypt=Optional;TrustServerCertificate=Yes"
Private Const SCHEMA_VER As Long = 2

' ---------------------------------------------------------------- SQL helpers
Public Function Q(v As Variant) As String
    Q = Replace(Nz(v, ""), "'", "''")
End Function

Public Function BR_OpenPT(sql As String, Optional timeoutSec As Long = 20) As DAO.Recordset
    Dim qd As DAO.QueryDef
    Set qd = CurrentDb.CreateQueryDef("")
    qd.Connect = CONNECT
    qd.ReturnsRecords = True
    qd.ODBCTimeout = timeoutSec
    qd.SQL = sql
    Set BR_OpenPT = qd.OpenRecordset(dbOpenSnapshot, dbReadOnly)
End Function

Public Function BR_Ping(ByRef ms As Double) As Boolean
    Dim t0 As Single, rs As DAO.Recordset
    On Error GoTo Fail
    t0 = Timer
    Set rs = BR_OpenPT("SELECT 1 AS ok", 10)
    rs.Close
    ms = (Timer - t0) * 1000
    BR_Ping = True
    Exit Function
Fail:
    BR_Ping = False
End Function

Public Function PdExpr() As String
    PdExpr = Nz(GetGlobal("PdExpr"), "p.pd")
End Function

Public Function BuildLoadSql(proj As String, rel As String) As String
    Dim s As String, pd As String
    pd = PdExpr()
    s = "SET NOCOUNT ON; "
    s = s & "DECLARE @proj nvarchar(50) = N'" & Q(proj) & "'; "
    s = s & "DECLARE @rel nvarchar(100) = N'" & Q(rel) & "'; "
    s = s & ";WITH L AS (SELECT l.MWLoanNo, "
    s = s & "CAST(ISNULL(l.PrincipalBalance,0) AS float) AS UPB, CAST(ISNULL(l.InterestBalance,0) AS float) AS IntBal, "
    s = s & "CAST(ISNULL(l.Rate,0) AS float) AS CRate, CAST(ISNULL(l.DefaultRate,0) AS float) AS DRate, "
    s = s & "CAST(ISNULL(l.RepayAmt,0) AS float) AS CPmt, l.CurrentMaturityDate AS MatDt, l.OrgNoteDate AS OrgDt, l.LastImport, "
    s = s & "ROW_NUMBER() OVER (ORDER BY l.PrincipalBalance DESC, l.MWLoanNo) AS Seq "
    s = s & "FROM dbo.tblLoan l WHERE l.ProjectName = @proj AND l.RelatedLoans = @rel) "
    s = s & "SELECT '1P' AS sect, 0 AS seq, @rel AS k1, CAST(NULL AS int) AS i1, "
    s = s & "CAST((SELECT COUNT(*) FROM L) AS float) AS n1, "
    s = s & "CAST(ISNULL((SELECT SUM(CAST(ISNULL(c.CurrentAppraisedValue,0) AS float)) FROM dbo.CollateralInfo c WHERE c.ProjectName = @proj AND c.RelatedLoans = @rel),0) AS float) AS n2, "
    s = s & "CAST(ISNULL((SELECT SUM(CAST(ISNULL(c.SellerAppraisedValue,0) AS float)) FROM dbo.CollateralInfo c WHERE c.ProjectName = @proj AND c.RelatedLoans = @rel),0) AS float) AS n3, "
    s = s & "CAST((SELECT COUNT(*) FROM dbo.CollateralInfo c WHERE c.ProjectName = @proj AND c.RelatedLoans = @rel) AS float) AS n4, "
    s = s & "CAST(p.cfstartyear*100 + p.cfstartmonth AS float) AS n5, CAST(p.cfstopyear*100 + p.cfstopmonth AS float) AS n6, "
    s = s & "(SELECT MAX(LastImport) FROM L) AS d1, CAST(NULL AS datetime) AS d2, CAST(NULL AS datetime) AS d3 "
    s = s & "FROM (SELECT 1 AS one) AS x LEFT JOIN dbo.xTblCFparameters p ON p.ProjectName = @proj "
    s = s & "UNION ALL SELECT '2L', L.Seq, L.MWLoanNo, NULL, L.UPB, L.IntBal, L.CRate, L.DRate, L.CPmt, NULL, L.MatDt, L.OrgDt, L.LastImport FROM L "
    s = s & "UNION ALL SELECT '3H', 0, p.mwloanno, " & pd & ", CAST(SUM(ISNULL(p.amount,0)) AS float), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL "
    s = s & "FROM dbo.tblPayHistory p INNER JOIN L ON L.MWLoanNo = p.mwloanno GROUP BY p.mwloanno, " & pd & " "
    s = s & "ORDER BY sect, seq, k1, i1;"
    BuildLoadSql = s
End Function

Public Function BuildTrailCheckSql(proj As String, rel As String, anchorPd As Long) As String
    Dim s As String, pd As String, j As Long
    pd = PdExpr()
    s = "SET NOCOUNT ON; "
    s = s & "DECLARE @proj nvarchar(50) = N'" & Q(proj) & "'; DECLARE @rel nvarchar(100) = N'" & Q(rel) & "'; "
    s = s & "DECLARE @hi int = " & anchorPd & "; DECLARE @lo int = " & PdAdd(anchorPd, -35) & "; "
    s = s & ";WITH L AS (SELECT l.MWLoanNo, CAST(ISNULL(l.PrincipalBalance,0) AS float) AS UPB FROM dbo.tblLoan l WHERE l.ProjectName = @proj AND l.RelatedLoans = @rel), "
    s = s & "PH AS (SELECT p.mwloanno, ((@hi/100 - " & pd & "/100)*12 + (@hi%100 - " & pd & "%100)) AS idx, SUM(CAST(ISNULL(p.amount,0) AS float)) AS amt "
    s = s & "FROM dbo.tblPayHistory p JOIN L ON L.MWLoanNo = p.mwloanno WHERE " & pd & " BETWEEN @lo AND @hi GROUP BY p.mwloanno, " & pd & "), "
    s = s & "PV AS (SELECT mwloanno, SUM(CASE WHEN idx <= 2 THEN amt ELSE 0 END) AS T3, SUM(CASE WHEN idx <= 5 THEN amt ELSE 0 END) AS T6, "
    s = s & "SUM(CASE WHEN idx <= 11 THEN amt ELSE 0 END) AS T12, SUM(CASE WHEN idx <= 23 THEN amt ELSE 0 END) AS T24"
    For j = 0 To 35
        s = s & ", SUM(CASE WHEN idx = " & j & " THEN amt ELSE 0 END) AS M" & Format(j, "00")
    Next j
    s = s & " FROM PH GROUP BY mwloanno) "
    s = s & "SELECT L.MWLoanNo, L.UPB, ISNULL(PV.T3,0) AS T3, ISNULL(PV.T6,0) AS T6, ISNULL(PV.T12,0) AS T12, ISNULL(PV.T24,0) AS T24"
    For j = 0 To 35
        s = s & ", ISNULL(PV.M" & Format(j, "00") & ",0) AS M" & Format(j, "00")
    Next j
    s = s & " FROM L LEFT JOIN PV ON PV.mwloanno = L.MWLoanNo ORDER BY L.UPB DESC, L.MWLoanNo;"
    BuildTrailCheckSql = s
End Function

Public Function BuildCollSql(proj As String, rel As String) As String
    Dim s As String
    s = "SET NOCOUNT ON; SELECT c.MWPropertyNo, c.Priority, c.MWCollateralCode, c.Description, c.Address, c.City, c.State, c.Zip, c.County, "
    s = s & "CAST(ISNULL(c.SQFT,0) AS float) AS SQFT, CAST(ISNULL(c.NumUnits,0) AS float) AS NumUnits, CAST(ISNULL(c.Acreage,0) AS float) AS Acreage, "
    s = s & "c.SellerAppraisalDate AS ApprDt, DATEDIFF(month, c.SellerAppraisalDate, CAST(GETDATE() AS date)) AS MosAppr, "
    s = s & "CAST(ISNULL(c.SellerAppraisedValue,0) AS float) AS SellerAppr, CAST(ISNULL(c.CurrentAppraisedValue,0) AS float) AS MwVx, "
    s = s & "CAST(ISNULL(c.TaxAnnualAmt,0) AS float) AS TaxAnnual, CAST(ISNULL(c.TaxDelinquentAmt,0) AS float) AS TaxDelq, "
    s = s & "CAST(ISNULL(c.MWTitleSrLienAmt,0) AS float) AS SrLien, c.MWTitleLienPosition AS LienPos, "
    s = s & "CASE WHEN ISNULL(c.SQFT,0) > 0 THEN CAST(ISNULL(c.SellerAppraisedValue,0) AS float)/c.SQFT END AS PerSF, "
    s = s & "CASE WHEN ISNULL(c.NumUnits,0) > 0 THEN CAST(ISNULL(c.SellerAppraisedValue,0) AS float)/c.NumUnits END AS PerUnit, "
    s = s & "CASE WHEN ISNULL(c.Acreage,0) > 0 THEN CAST(ISNULL(c.SellerAppraisedValue,0) AS float)/c.Acreage END AS PerAcre, "
    s = s & "CASE WHEN ISNULL(c.CurrentAppraisedValue,0)-ISNULL(c.MWTitleSrLienAmt,0) < 0 THEN 0 ELSE CAST(ISNULL(c.CurrentAppraisedValue,0)-ISNULL(c.MWTitleSrLienAmt,0) AS float) END AS NetMwVx, "
    s = s & "CASE WHEN ISNULL(c.SellerAppraisedValue,0)-ISNULL(c.MWTitleSrLienAmt,0) < 0 THEN 0 ELSE CAST(ISNULL(c.SellerAppraisedValue,0)-ISNULL(c.MWTitleSrLienAmt,0) AS float) END AS NetSeller "
    s = s & "FROM dbo.CollateralInfo c WHERE c.ProjectName = N'" & Q(proj) & "' AND c.RelatedLoans = N'" & Q(rel) & "' ORDER BY c.Priority, c.MWPropertyNo;"
    BuildCollSql = s
End Function

' ---------------------------------------------------------------- trip 1: relationship load
Public Function LoadRelationship(proj As String, rel As String, ByRef errMsg As String) As Boolean
    Dim rs As DAO.Recordset, v As Variant, r As Long, nRows As Long, sect As String, t0 As Single
    Dim n As Long, i As Long, li As Long, pd As Long, maxPd As Long, minPd As Long, gotPay As Boolean
    Dim tmp As TRel
    On Error GoTo Fail
    t0 = Timer
    Set rs = BR_OpenPT(BuildLoadSql(proj, rel))
    If rs.EOF Then errMsg = "Load returned no rows": GoTo Fail
    v = rs.GetRows(50000)
    rs.Close
    nRows = UBound(v, 2) + 1
    ' keep settings already loaded into gRel; replace data
    tmp = gRel
    tmp.ProjectName = proj: tmp.RelatedLoans = rel
    tmp.LoanCount = 0: tmp.RelColl = 0: tmp.RelSellerAppr = 0: tmp.PropCount = 0
    tmp.HasCF = False: tmp.HasTape = False
    For r = 0 To nRows - 1
        sect = Left(Nz(v(0, r), ""), 2)
        If sect = "1P" Then
            tmp.LoanCount = CLng(Nz(v(4, r), 0))
            tmp.RelColl = CDbl(Nz(v(5, r), 0))
            tmp.RelSellerAppr = CDbl(Nz(v(6, r), 0))
            tmp.PropCount = CLng(Nz(v(7, r), 0))
            If Not IsNull(v(8, r)) Then tmp.HasCF = True: tmp.CFStartPd = CLng(v(8, r))
            If Not IsNull(v(10, r)) Then tmp.HasTape = True: tmp.TapeAsOf = CDate(v(10, r))
        End If
    Next r
    If tmp.LoanCount > 0 Then ReDim tmp.Loans(1 To tmp.LoanCount) Else ReDim tmp.Loans(1 To 1)
    For r = 0 To nRows - 1
        sect = Left(Nz(v(0, r), ""), 2)
        If sect = "2L" Then
            n = CLng(v(1, r))
            If n >= 1 And n <= tmp.LoanCount Then
                With tmp.Loans(n)
                    InitLoanDefaults tmp.Loans(n)
                    .LoanNo = CStr(v(2, r)): .Seq = n
                    .UPB = CDbl(Nz(v(4, r), 0)): .IntBal = CDbl(Nz(v(5, r), 0))
                    .CRate = CDbl(Nz(v(6, r), 0)): .DRate = CDbl(Nz(v(7, r), 0)): .CPmt = CDbl(Nz(v(8, r), 0))
                    .HasMat = Not IsNull(v(10, r)): If .HasMat Then .MatDt = CDate(v(10, r))
                    .HasOrg = Not IsNull(v(11, r)): If .HasOrg Then .OrgDt = CDate(v(11, r))
                End With
            End If
        End If
    Next r
    ' pay history: pass 1 = period range
    maxPd = 0: minPd = 999999: gotPay = False
    For r = 0 To nRows - 1
        If Left(Nz(v(0, r), ""), 2) = "3H" Then
            pd = CLng(Nz(v(3, r), 0))
            If pd > 0 Then
                gotPay = True
                If pd > maxPd Then maxPd = pd
                If pd < minPd Then minPd = pd
            End If
        End If
    Next r
    If gotPay Then
        gPayPd0 = maxPd
        gPayMax = PdDiff(maxPd, minPd)
    Else
        gPayPd0 = PdKey(Date)
        gPayMax = 0
    End If
    ReDim gPay(1 To IIf(tmp.LoanCount > 0, tmp.LoanCount, 1), 0 To gPayMax)
    If gotPay Then
        For r = 0 To nRows - 1
            If Left(Nz(v(0, r), ""), 2) = "3H" Then
                pd = CLng(Nz(v(3, r), 0))
                li = 0
                For i = 1 To tmp.LoanCount
                    If tmp.Loans(i).LoanNo = CStr(v(2, r)) Then li = i: Exit For
                Next i
                If li > 0 And pd > 0 Then
                    n = PdDiff(gPayPd0, pd)
                    If n >= 0 And n <= gPayMax Then gPay(li, n) = gPay(li, n) + CDbl(Nz(v(4, r), 0))
                End If
            End If
        Next r
    End If
    ' defaults for dates the settings did not supply
    If tmp.AnchorDt = 0 Then
        If tmp.HasTape Then tmp.AnchorDt = tmp.TapeAsOf Else tmp.AnchorDt = Date
    End If
    If tmp.CutoffDt = 0 Then
        If tmp.HasCF Then
            tmp.CutoffDt = DateSerial(tmp.CFStartPd \ 100, tmp.CFStartPd Mod 100, 1)
        Else
            tmp.CutoffDt = DateSerial(Year(tmp.AnchorDt), Month(tmp.AnchorDt), 1)
        End If
    End If
    tmp.MsServer = (Timer - t0) * 1000
    tmp.RelOptValid = False
    gRel = tmp
    LoadRelationship = True
    Exit Function
Fail:
    If Len(errMsg) = 0 Then errMsg = Err.Description
    LoadRelationship = False
End Function

' ---------------------------------------------------------------- trip 2: collateral -> local cache
Public Function LoadCollateral(proj As String, rel As String, ByRef errMsg As String) As Boolean
    Dim rs As DAO.Recordset, db As DAO.Database, ws As DAO.Workspace, lc As DAO.Recordset, n As Long, f As DAO.Field
    On Error GoTo Fail
    Set rs = BR_OpenPT(BuildCollSql(proj, rel))
    Set ws = DBEngine.Workspaces(0)
    Set db = CurrentDb
    ws.BeginTrans
    db.Execute "DELETE FROM xtblBR_CollCache", dbFailOnError
    Set lc = db.OpenRecordset("xtblBR_CollCache", dbOpenDynaset)
    Do While Not rs.EOF
        n = n + 1
        lc.AddNew
        lc!RowNo = n
        For Each f In rs.Fields
            On Error Resume Next
            lc.Fields(f.Name) = f.Value
            On Error GoTo Fail
        Next f
        lc.Update
        rs.MoveNext
    Loop
    lc.Close: rs.Close
    ws.CommitTrans
    LoadCollateral = True
    Exit Function
Fail:
    errMsg = Err.Description
    On Error Resume Next
    ws.Rollback
    LoadCollateral = False
End Function

Public Sub SetRelListProject(proj As String)
    Dim qd As DAO.QueryDef, s As String
    s = "SELECT r.RelatedLoans, COUNT(l.MWLoanNo) AS Loans, CAST(SUM(ISNULL(l.PrincipalBalance,0)) AS float) AS UPB, r.SortNo "
    s = s & "FROM dbo.tblRelationships r LEFT JOIN dbo.tblLoan l ON l.ProjectName = r.ProjectName AND l.RelatedLoans = r.RelatedLoans "
    s = s & "WHERE r.ProjectName = N'" & Q(proj) & "' GROUP BY r.RelatedLoans, r.SortNo ORDER BY r.SortNo, r.RelatedLoans;"
    Set qd = CurrentDb.QueryDefs("qptBR_Rels")
    qd.SQL = s
End Sub

' ---------------------------------------------------------------- local tables
Private Function TableExists(nm As String) As Boolean
    Dim db As DAO.Database: Set db = CurrentDb
    On Error Resume Next
    TableExists = (Len(db.TableDefs(nm).Name) > 0)
    Err.Clear
End Function

Private Sub Ddl(sql As String)
    On Error Resume Next
    CurrentDb.Execute sql
    Err.Clear
End Sub

Public Sub EnsureField(tbl As String, fld As String, ddlType As String)
    Dim db As DAO.Database, f As DAO.Field
    Set db = CurrentDb
    On Error Resume Next
    Set f = db.TableDefs(tbl).Fields(fld)
    If Err.Number <> 0 Then
        Err.Clear
        db.Execute "ALTER TABLE " & tbl & " ADD COLUMN " & fld & " " & ddlType
    End If
    Err.Clear
End Sub

Private Sub EnsurePT(nm As String, sql As String)
    Dim db As DAO.Database, qd As DAO.QueryDef
    Set db = CurrentDb
    On Error Resume Next
    Set qd = db.QueryDefs(nm)
    If Err.Number <> 0 Then
        Err.Clear
        Set qd = db.CreateQueryDef(nm)
        qd.Connect = CONNECT
        qd.SQL = sql
        qd.ReturnsRecords = True
    End If
    Err.Clear
End Sub

Public Sub EnsureLocalTables()
    Dim s As String, rs As DAO.Recordset
    If Not TableExists("xtblBR_Inputs") Then
        s = "CREATE TABLE xtblBR_Inputs (ProjectName TEXT(50), RelatedLoans TEXT(100), LoanNo TEXT(20), PmtSel TEXT(20), UserPmt DOUBLE, "
        s = s & "TermMonths LONG, MTrailSel TEXT(3), TrailPct DOUBLE, RateSel TEXT(20), UserRate DOUBLE, LegalInit DOUBLE, LegalStartM LONG, "
        s = s & "HoldCost DOUBLE, LegalEndM LONG, AddBack TEXT(20), ExitType TEXT(20), DPOPct DOUBLE, UserExit DOUBLE, ValCapPct DOUBLE, "
        s = s & "YTMTgt DOUBLE, AddAccrued TEXT(3), LiqAcrM LONG, StartMonth LONG, ExitMonth LONG, BidOverride DOUBLE, UpdatedAt DATETIME)"
        Ddl s
        Ddl "CREATE UNIQUE INDEX ixBRInputs ON xtblBR_Inputs (ProjectName, RelatedLoans, LoanNo)"
    End If
    If Not TableExists("xtblBR_Settings") Then
        s = "CREATE TABLE xtblBR_Settings (ProjectName TEXT(50), RelatedLoans TEXT(100), YieldTarget DOUBLE, AnchorDt DATETIME, CutoffDt DATETIME, "
        s = s & "MinMonthsJ2 LONG, HurdleYTM DOUBLE, HurdleCY DOUBLE, HurdleMOIC DOUBLE, TrailDisp TEXT(25), OptLoan TEXT(20), Win LONG, "
        s = s & "LastProject TEXT(50), LastRel TEXT(100), PdExpr TEXT(60), SchemaVer LONG, UpdatedAt DATETIME)"
        Ddl s
        Ddl "CREATE UNIQUE INDEX ixBRSettings ON xtblBR_Settings (ProjectName, RelatedLoans)"
    End If
    If Not TableExists("xtblBR_CollCache") Then
        s = "CREATE TABLE xtblBR_CollCache (RowNo LONG, MWPropertyNo LONG, Priority LONG, MWCollateralCode TEXT(20), Description TEXT(100), "
        s = s & "Address TEXT(100), City TEXT(50), State TEXT(5), Zip TEXT(12), County TEXT(50), SQFT DOUBLE, NumUnits DOUBLE, Acreage DOUBLE, "
        s = s & "ApprDt DATETIME, MosAppr LONG, SellerAppr DOUBLE, MwVx DOUBLE, TaxAnnual DOUBLE, TaxDelq DOUBLE, SrLien DOUBLE, LienPos TEXT(10), "
        s = s & "PerSF DOUBLE, PerUnit DOUBLE, PerAcre DOUBLE, NetMwVx DOUBLE, NetSeller DOUBLE)"
        Ddl s
    End If
    If Not TableExists("xtblBR_OptCache") Then
        s = "CREATE TABLE xtblBR_OptCache (LoanNo TEXT(20), M LONG, Bid DOUBLE, BidPct DOUBLE, ImpDPO DOUBLE, CY12 DOUBLE, MOIC DOUBLE, YTM DOUBLE, "
        s = s & "YTMok YESNO, PassYTM YESNO, PassCY YESNO, PassMOIC YESNO, PassAll YESNO)"
        Ddl s
        Ddl "CREATE INDEX ixBROpt ON xtblBR_OptCache (LoanNo, M)"
    End If
    If Not TableExists("xtblBR_Snapshot") Then
        s = "CREATE TABLE xtblBR_Snapshot (Sheet TEXT(12), RowNo LONG, Kind TEXT(1), Caption TEXT(40), L1 TEXT(30), L2 TEXT(30), L3 TEXT(30), "
        s = s & "L4 TEXT(30), L5 TEXT(30), L6 TEXT(30), L7 TEXT(30), L8 TEXT(30), L9 TEXT(30), L10 TEXT(30), Tot TEXT(30))"
        Ddl s
    End If
    If Not TableExists("xtblBR_TestResults") Then
        Ddl "CREATE TABLE xtblBR_TestResults (CaseId TEXT(40), Field TEXT(30), Expected DOUBLE, Actual DOUBLE, Delta DOUBLE, Pass YESNO, RunAt DATETIME)"
    End If
    If Not TableExists("xtblBR_Bench") Then
        Ddl "CREATE TABLE xtblBR_Bench (RunAt DATETIME, ProjectName TEXT(50), RelatedLoans TEXT(100), Loans LONG, MsServer DOUBLE, MsCalc DOUBLE, MsPaint DOUBLE, MsTotal DOUBLE)"
    End If
    ' global settings row */*
    If DCount("*", "xtblBR_Settings", "ProjectName='*' AND RelatedLoans='*'") = 0 Then
        CurrentDb.Execute "INSERT INTO xtblBR_Settings (ProjectName, RelatedLoans, SchemaVer, UpdatedAt) VALUES ('*','*'," & SCHEMA_VER & ", Now())"
    End If
    ' pass-through pickers
    EnsurePT "qptBR_Projects", "SELECT ProjectName FROM dbo.tblProjects ORDER BY ProjectName;"
    EnsurePT "qptBR_Rels", "SELECT RelatedLoans, 0 AS Loans, CAST(0 AS float) AS UPB, SortNo FROM dbo.tblRelationships WHERE 1 = 0;"
    EnsurePT "qptBR_Ping", "SELECT 1 AS ok;"
    ' pd column probe (once)
    If IsNull(GetGlobal("PdExpr")) Then
        On Error Resume Next
        Set rs = BR_OpenPT("SELECT TOP (1) pd FROM dbo.tblPayHistory", 10)
        If Err.Number <> 0 Then
            Err.Clear
            SetGlobal "PdExpr", "(p.[year]*100 + p.[month])"
        Else
            rs.Close
            SetGlobal "PdExpr", "p.pd"
        End If
        On Error GoTo 0
    End If
End Sub

' ---------------------------------------------------------------- inputs persistence
Private Function InputKeys() As Variant
    InputKeys = Array("PmtSel", "UserPmt", "TermMonths", "MTrailSel", "TrailPct", "RateSel", "UserRate", "LegalInit", _
                      "LegalStartM", "HoldCost", "LegalEndM", "AddBack", "ExitType", "DPOPct", "UserExit", "ValCapPct", _
                      "YTMTgt", "AddAccrued", "LiqAcrM", "StartMonth", "ExitMonth", "BidOverride")
End Function

Private Sub RowToLoan(rs As DAO.Recordset, ByRef L As TLoan)
    L.PmtSel = Nz(rs!PmtSel, "Current PMT"): L.UserPmt = Nz(rs!UserPmt, 0): L.TermMonths = Nz(rs!TermMonths, 0)
    L.MTrailSel = Nz(rs!MTrailSel, "3M"): L.TrailPct = Nz(rs!TrailPct, 1)
    L.RateSel = Nz(rs!RateSel, "Contractual"): L.UserRate = Nz(rs!UserRate, 0)
    L.LegalInit = Nz(rs!LegalInit, 0): L.LegalStartM = Nz(rs!LegalStartM, 0): L.HoldCost = Nz(rs!HoldCost, 0)
    L.LegalEndM = Nz(rs!LegalEndM, 0): L.AddBack = Nz(rs!AddBack, "No")
    L.ExitType = Nz(rs!ExitType, "PIF"): L.DPOPct = Nz(rs!DPOPct, 0): L.UserExit = Nz(rs!UserExit, 0)
    L.ValCapPct = Nz(rs!ValCapPct, 0): L.YTMTgt = Nz(rs!YTMTgt, 0)
    L.AddAccrued = (Nz(rs!AddAccrued, "No") = "Yes"): L.LiqAcrM = Nz(rs!LiqAcrM, 0)
    L.StartMonth = Nz(rs!StartMonth, 1): L.ExitMonth = Nz(rs!ExitMonth, 12)
    L.HasOverride = Not IsNull(rs!BidOverride)
    If L.HasOverride Then L.BidOverride = rs!BidOverride Else L.BidOverride = 0
End Sub

Private Sub LoanToRow(ByRef L As TLoan, rs As DAO.Recordset, Optional onlyKey As String = "")
    Dim k As Variant
    For Each k In InputKeys()
        If Len(onlyKey) = 0 Or CStr(k) = onlyKey Then
            Select Case CStr(k)
                Case "AddAccrued": rs!AddAccrued = IIf(L.AddAccrued, "Yes", "No")
                Case "BidOverride": If L.HasOverride Then rs!BidOverride = L.BidOverride Else rs!BidOverride = Null
                Case Else: rs.Fields(CStr(k)) = LoanValue(L, CStr(k))
            End Select
        End If
    Next k
    rs!UpdatedAt = Now
End Sub

Private Function InputRow(ByRef R As TRel, loanNo As String) As DAO.Recordset
    Set InputRow = CurrentDb.OpenRecordset("SELECT * FROM xtblBR_Inputs WHERE ProjectName='" & Q(R.ProjectName) & _
        "' AND RelatedLoans='" & Q(R.RelatedLoans) & "' AND LoanNo='" & Q(loanNo) & "'", dbOpenDynaset)
End Function

Public Sub LoadInputs(ByRef R As TRel)
    Dim i As Long, rs As DAO.Recordset, old As DAO.Recordset
    For i = 1 To R.LoanCount
        Set rs = InputRow(R, R.Loans(i).LoanNo)
        If rs.EOF Then
            InitLoanDefaults R.Loans(i)
            ' one-time migration from v1.3 scratch
            If TableExists("xtblBidReader") Then
                On Error Resume Next
                Set old = CurrentDb.OpenRecordset("SELECT * FROM xtblBidReader WHERE LoanNo='" & Q(R.Loans(i).LoanNo) & "'", dbOpenSnapshot)
                If Err.Number = 0 Then
                    If Not old.EOF Then
                        RowToLoan old, R.Loans(i)
                        If R.Loans(i).MTrailSel = "" Then R.Loans(i).MTrailSel = "3M"
                    End If
                    old.Close
                End If
                Err.Clear
                On Error GoTo 0
            End If
            rs.AddNew
            rs!ProjectName = R.ProjectName: rs!RelatedLoans = R.RelatedLoans: rs!LoanNo = R.Loans(i).LoanNo
            LoanToRow R.Loans(i), rs
            rs.Update
        Else
            RowToLoan rs, R.Loans(i)
        End If
        rs.Close
    Next i
End Sub

Public Sub SaveLoanInput(ByRef R As TRel, i As Long, key As String)
    Dim rs As DAO.Recordset
    If i < 1 Or i > R.LoanCount Then Exit Sub
    Set rs = InputRow(R, R.Loans(i).LoanNo)
    If rs.EOF Then
        rs.AddNew
        rs!ProjectName = R.ProjectName: rs!RelatedLoans = R.RelatedLoans: rs!LoanNo = R.Loans(i).LoanNo
        LoanToRow R.Loans(i), rs
    Else
        rs.Edit
        LoanToRow R.Loans(i), rs, key
    End If
    rs.Update
    rs.Close
End Sub

Public Sub SaveAllInputs(ByRef R As TRel)
    Dim i As Long
    For i = 1 To R.LoanCount
        SaveLoanInput R, i, ""
    Next i
End Sub

' ---------------------------------------------------------------- settings
Private Sub ApplySettingsRow(rs As DAO.Recordset, ByRef R As TRel)
    If Not IsNull(rs!YieldTarget) Then R.Yield = rs!YieldTarget
    If Not IsNull(rs!AnchorDt) Then R.AnchorDt = rs!AnchorDt
    If Not IsNull(rs!CutoffDt) Then R.CutoffDt = rs!CutoffDt
    If Not IsNull(rs!MinMonthsJ2) Then R.MinMonthsJ2 = rs!MinMonthsJ2
    If Not IsNull(rs!HurdleYTM) Then R.HurdleYTM = rs!HurdleYTM
    If Not IsNull(rs!HurdleCY) Then R.HurdleCY = rs!HurdleCY
    If Not IsNull(rs!HurdleMOIC) Then R.HurdleMOIC = rs!HurdleMOIC
End Sub

Public Sub LoadSettings(ByRef R As TRel)
    Dim rs As DAO.Recordset, lvl As Long, p As String, rel As String
    InitRelDefaults R
    R.AnchorDt = 0: R.CutoffDt = 0          ' let LoadRelationship default these from the tape / CF params
    For lvl = 1 To 3
        Select Case lvl
            Case 1: p = "*": rel = "*"
            Case 2: p = R.ProjectName: rel = "*"
            Case 3: p = R.ProjectName: rel = R.RelatedLoans
        End Select
        Set rs = CurrentDb.OpenRecordset("SELECT * FROM xtblBR_Settings WHERE ProjectName='" & Q(p) & "' AND RelatedLoans='" & Q(rel) & "'", dbOpenSnapshot)
        If Not rs.EOF Then ApplySettingsRow rs, R
        rs.Close
    Next lvl
End Sub

Public Sub SaveSettings(ByRef R As TRel)
    Dim rs As DAO.Recordset
    Set rs = CurrentDb.OpenRecordset("SELECT * FROM xtblBR_Settings WHERE ProjectName='" & Q(R.ProjectName) & "' AND RelatedLoans='" & Q(R.RelatedLoans) & "'", dbOpenDynaset)
    If rs.EOF Then
        rs.AddNew
        rs!ProjectName = R.ProjectName: rs!RelatedLoans = R.RelatedLoans
    Else
        rs.Edit
    End If
    rs!YieldTarget = R.Yield: rs!AnchorDt = R.AnchorDt: rs!CutoffDt = R.CutoffDt: rs!MinMonthsJ2 = R.MinMonthsJ2
    rs!HurdleYTM = R.HurdleYTM: rs!HurdleCY = R.HurdleCY: rs!HurdleMOIC = R.HurdleMOIC
    rs!UpdatedAt = Now
    rs.Update
    rs.Close
End Sub

Public Function GetGlobal(name As String, Optional dflt As Variant = Null) As Variant
    Dim v As Variant
    On Error Resume Next
    v = DLookup(name, "xtblBR_Settings", "ProjectName='*' AND RelatedLoans='*'")
    If Err.Number <> 0 Then Err.Clear: v = Null
    If IsNull(v) Then GetGlobal = dflt Else GetGlobal = v
End Function

Public Sub SetGlobal(name As String, val As Variant)
    Dim rs As DAO.Recordset
    Set rs = CurrentDb.OpenRecordset("SELECT * FROM xtblBR_Settings WHERE ProjectName='*' AND RelatedLoans='*'", dbOpenDynaset)
    If rs.EOF Then
        rs.AddNew
        rs!ProjectName = "*": rs!RelatedLoans = "*"
    Else
        rs.Edit
    End If
    rs.Fields(name) = val
    rs!UpdatedAt = Now
    rs.Update
    rs.Close
End Sub

' ---------------------------------------------------------------- caches for the bound subforms / print
Public Sub WriteOptCache(ByRef R As TRel)
    Dim db As DAO.Database, ws As DAO.Workspace, rs As DAO.Recordset, i As Long, m As Long
    Set ws = DBEngine.Workspaces(0): Set db = CurrentDb
    If Not R.RelOptValid Then CalcRelOptimal R
    ws.BeginTrans
    db.Execute "DELETE FROM xtblBR_OptCache", dbFailOnError
    Set rs = db.OpenRecordset("xtblBR_OptCache", dbOpenDynaset)
    For i = 1 To R.LoanCount
        For m = 1 To 60
            OptRowOut rs, R.Loans(i).LoanNo, m, R.Loans(i).Opt(m), R
        Next m
    Next i
    For m = 1 To 60
        OptRowOut rs, "*", m, R.RelOpt(m), R
    Next m
    rs.Close
    ws.CommitTrans
End Sub

Private Sub OptRowOut(rs As DAO.Recordset, ln As String, m As Long, ByRef o As TOptRow, ByRef R As TRel)
    Dim pY As Boolean, pC As Boolean, pM As Boolean
    pY = o.YTMok And o.YTM >= R.HurdleYTM
    pC = (o.Bid <> 0) And o.CY12 >= R.HurdleCY
    pM = (o.Bid <> 0) And o.MOIC >= R.HurdleMOIC
    rs.AddNew
    rs!LoanNo = ln: rs!M = m: rs!Bid = o.Bid: rs!BidPct = o.BidPct: rs!ImpDPO = o.ImpDPO
    rs!CY12 = o.CY12: rs!MOIC = o.MOIC: rs!YTM = o.YTM: rs!YTMok = o.YTMok
    rs!PassYTM = pY: rs!PassCY = pC: rs!PassMOIC = pM: rs!PassAll = (pY And pC And pM)
    rs.Update
End Sub

Public Sub WriteSnapshot(ByRef R As TRel)
    Dim db As DAO.Database, rs As DAO.Recordset, keys() As String, caps() As String, kinds() As String, fmts() As String
    Dim r As Long, i As Long, v As Variant, m As Long
    Set db = CurrentDb
    db.Execute "DELETE FROM xtblBR_Snapshot", dbFailOnError
    Set rs = db.OpenRecordset("xtblBR_Snapshot", dbOpenDynaset)
    RowDefs keys, caps, kinds, fmts
    rs.AddNew
    rs!Sheet = "Projection": rs!RowNo = 0: rs!Kind = "h": rs!Caption = "Loan Number"
    For i = 1 To 10
        If i <= R.LoanCount Then rs.Fields("L" & i) = R.Loans(i).LoanNo
    Next i
    rs!Tot = "Relationship"
    rs.Update
    For r = 1 To NROWS
        rs.AddNew
        rs!Sheet = "Projection": rs!RowNo = r: rs!Kind = kinds(r): rs!Caption = caps(r)
        If kinds(r) <> "s" And kinds(r) <> "t" Then
            For i = 1 To 10
                If i <= R.LoanCount Then rs.Fields("L" & i) = Fmt(LoanValue(R.Loans(i), keys(r)), fmts(r))
            Next i
            If kinds(r) = "g" Or kinds(r) = "c" Or kinds(r) = "r" Then rs!Tot = Fmt(TotValue(R, keys(r)), fmts(r))
        End If
        rs.Update
    Next r
    If Not R.RelOptValid Then CalcRelOptimal R
    For m = 1 To 60
        rs.AddNew
        rs!Sheet = "Optimal": rs!RowNo = m: rs!Kind = "r": rs!Caption = "Month " & m
        rs!L1 = Fmt(R.RelOpt(m).Bid, "$#,##0"): rs!L2 = Fmt(R.RelOpt(m).BidPct, "0.0%")
        rs!L3 = Fmt(R.RelOpt(m).CY12, "0.0%"): rs!L4 = Fmt(R.RelOpt(m).MOIC, "0.00")
        If R.RelOpt(m).YTMok Then rs!L5 = Fmt(R.RelOpt(m).YTM, "0.00%") Else rs!L5 = "—"
        rs.Update
    Next m
    rs.Close
End Sub

Private Function Fmt(v As Variant, f As String) As String
    If IsNull(v) Then Fmt = "—": Exit Function
    If Len(f) = 0 Then Fmt = CStr(v): Exit Function
    If VarType(v) = vbString Then Fmt = CStr(v) Else Fmt = Format(v, f)
End Function
