Attribute VB_Name = "BuildBidReader"
Option Compare Database
Option Explicit

' =====================================================================
' RELATIONSHIP PROJECTION - standalone read-only bid database (v1.3)
'
' v1.3: the main form now uses the SHEET'S OWN ORIENTATION - categories
' run DOWN the left in the sheet's exact row order (UPB, Interest, MAI,
' Rate ... Legal block ... Exit block ... Bid results), loans are
' COLUMNS (up to 8) plus a Relationship totals column. Newly modeled
' sheet rows: MAI, Payment/Rate Pull, Interest/Term PMT, % X Trail,
' M Trail, LQDN Forward Acr M (liquidation accrual months), Bid/MwVx,
' F12/P12 PMT, and the Trail Selection display transform.
'
' v1.2 visual redesign: styled like the Bid_Project Excel workbook -
' Calibri on white with banded rows and gridline borders, gray header
' bands, YELLOW cells = editable (the workbook's convention), plain
' white cells = data read from SQL, green-filled cells = computed
' results. Header bands are color-coded the same way.
'
' A minimal single-purpose Access database that does what the
' Bid_Project workbook's 'Relationship Projection' sheet does:
'   pick project -> relationship -> per-loan rows with the loan
'   snapshot (UPB / Interest / Rate / PMT / MTM / MTA / trailing
'   3-6-12 payments), the payment / rate / legal / exit selectors,
'   Bid = NPV of the monthly net cash-flow stream at the target
'   yield, Bid % / MOIC / 12M CY / Implied DPO per loan, the
'   relationship rollup, and the exit-month sensitivity table
'   (all loans exited at month 6/12/.../60).
'
' READ-ONLY BY DESIGN: SQL Server is only ever read (SELECT / DLookup
' / DSum). Every parameter and result lives in LOCAL tables
' (xtblBidReader / xtblBidReaderSet), which persist across sessions.
' No form is bound to a server table; no INSERT/UPDATE/DELETE ever
' targets a linked table.
'
' Faithful ports from the sheet's recovered LET formulas:
'   Payment Pull  SWITCH(Current PMT / User PMT / Interest PMT /
'                 Term PMT / % of M Trail PMT)
'   Rate Pull     SWITCH(Contractual / User Enter / Default)
'   Exit Pull     PIF / User Enter / DPO / YTM Sell Solve /
'                 Value Cap / Liquidation, + legal add-back
'                 ("Yes, Initial Only" / "Yes, Both")
'   Bid           NPV(yield/12, monthly stream to exit month), with
'                 initial-legal and monthly holding costs subtracted
' Documented approximations: Liquidation accrues to the exit month
' (the sheet's separate LQDN Forward Acr M input is not modeled);
' IRR Solve and XIRR outputs are omitted (iterative solver).
'
' HOW TO USE
'   1. Blank .accdb on a machine with the sqlDueDiligence DSN
'   2. Alt+F11 -> File -> Import File -> this .bas
'   3. Ctrl+G -> type BuildReaderDB -> Enter
'   4. Open frmBidReader, pick a project + relationship
' Re-running BuildReaderDB rebuilds the form; parameters persist.
' =====================================================================

Private Const CONNECT As String = _
    "ODBC;DSN=sqlDueDiligence;DATABASE=MidwestDDi;Trusted_Connection=Yes;" & _
    "APP=Microsoft Office;Encrypt=Optional;TrustServerCertificate=Yes"

Private Const T1 As Long = 1440
Private Const FONT As String = "Calibri"

' ---- Excel-sheet palette (matches the Bid_Project workbook look) ----
' color = R + G*256 + B*65536
Private Const CLR_MAIN As Long = 16777215    ' white page (sheet body)
Private Const CLR_ALT As Long = 16316664     ' #F8F8F8 banded rows
Private Const CLR_CARD As Long = 15790320    ' #F0F0F0 header panel
Private Const CLR_HEADER As Long = 14277081  ' #D9D9D9 band / footer strip
Private Const CLR_INPUT As Long = 13434879   ' #FFFFCC yellow = EDITABLE (workbook convention)
Private Const CLR_READONLY As Long = 16777215 ' white locked cells (plain sheet cells)
Private Const CLR_INBORDER As Long = 12566463 ' #BFBFBF gridline border
Private Const CLR_TEXT As Long = 0           ' black
Private Const CLR_TEXTSEC As Long = 3355443  ' #333333
Private Const CLR_MUTED As Long = 6710886    ' #666666
Private Const CLR_GREEN As Long = 2315831    ' #375623 dark green result text
Private Const CLR_RESBG As Long = 14348258   ' #E2EFDA Excel green fill (computed)
Private Const CLR_TITLE As Long = 7949855    ' #1F4E79 Excel heading blue
Private Const CLR_BTN As Long = 15132390     ' #E6E6E6 buttons

' ---------------------------------------------------------------------
Public Sub BuildReaderDB()
    On Error GoTo Fail
    LinkReaderTables
    EnsureReaderTables
    BuildFrmPayHistSheet
    BuildFrmCollSheet
    BuildFrmBidReader
    MsgBox "Relationship Projection reader built." & vbCrLf & vbCrLf & _
           "Open frmBidReader (pick project + relationship)." & vbCrLf & _
           "Pay History / Collateral buttons open the companion sheets." & vbCrLf & _
           "This database READS SQL Server only - it never writes.", _
           vbInformation, "Relationship Projection"
    Exit Sub
Fail:
    MsgBox "Build failed: " & Err.Description, vbCritical, "Relationship Projection"
End Sub

' ================= LINKS (read-only usage) ===========================
Private Sub LinkReaderTables()
    Dim db As DAO.Database: Set db = CurrentDb
    Dim tables As Variant, i As Integer
    Dim td As DAO.TableDef
    Dim ok As String, bad As String
    tables = Array("tblProjects", "tblRelationships", "tblLoan", _
                   "tblPayHistory", "CollateralInfo", "xTblCFparameters")
    For i = LBound(tables) To UBound(tables)
        DropTableDef db, CStr(tables(i))
        DropTableDef db, "dbo_" & tables(i)
        On Error Resume Next
        Set td = db.CreateTableDef(CStr(tables(i)))
        td.Connect = CONNECT
        td.SourceTableName = "dbo." & tables(i)
        db.TableDefs.Append td
        If Err.Number <> 0 Then
            Err.Clear
            Set td = db.CreateTableDef(CStr(tables(i)))
            td.Connect = CONNECT
            td.SourceTableName = CStr(tables(i))
            db.TableDefs.Append td
        End If
        If Err.Number <> 0 Then
            bad = bad & vbCrLf & "  " & tables(i) & ": " & Err.Description
            Err.Clear
        Else
            ok = ok & " " & tables(i)
        End If
        On Error GoTo 0
    Next i
    db.TableDefs.Refresh
    If Len(bad) > 0 Then
        MsgBox "Some tables failed to link:" & bad & vbCrLf & vbCrLf & _
               "Linked OK:" & ok, vbExclamation, "Link results"
        If Len(ok) = 0 Then Err.Raise vbObjectError + 1, , _
            "No tables linked - check the sqlDueDiligence DSN."
    End If
End Sub

' ================= LOCAL SCRATCH (the only writable tables) ==========
Private Sub EnsureReaderTables()
    Dim db As DAO.Database: Set db = CurrentDb
    Dim td As DAO.TableDef
    On Error Resume Next
    Set td = db.TableDefs("xtblBidReader")
    If Err.Number <> 0 Then
        Err.Clear
        On Error GoTo 0
        Set td = db.CreateTableDef("xtblBidReader")
        td.Fields.Append td.CreateField("LoanNo", dbText, 20)
        td.Fields.Append td.CreateField("RelatedLoans", dbText, 100)
        td.Fields.Append td.CreateField("UPB", dbCurrency)
        td.Fields.Append td.CreateField("IntBal", dbCurrency)
        td.Fields.Append td.CreateField("CRate", dbDouble)
        td.Fields.Append td.CreateField("DRate", dbDouble)
        td.Fields.Append td.CreateField("CPmt", dbCurrency)
        td.Fields.Append td.CreateField("MatDt", dbDate)
        td.Fields.Append td.CreateField("MTM", dbLong)
        td.Fields.Append td.CreateField("MTA", dbLong)
        td.Fields.Append td.CreateField("T3", dbCurrency)
        td.Fields.Append td.CreateField("T6", dbCurrency)
        td.Fields.Append td.CreateField("T12", dbCurrency)
        td.Fields.Append td.CreateField("PmtSel", dbText, 20)
        td.Fields.Append td.CreateField("UserPmt", dbCurrency)
        td.Fields.Append td.CreateField("TermMonths", dbLong)
        td.Fields.Append td.CreateField("TrailPct", dbDouble)
        td.Fields.Append td.CreateField("RateSel", dbText, 20)
        td.Fields.Append td.CreateField("UserRate", dbDouble)
        td.Fields.Append td.CreateField("LegalInit", dbCurrency)
        td.Fields.Append td.CreateField("LegalStartM", dbLong)
        td.Fields.Append td.CreateField("HoldCost", dbCurrency)
        td.Fields.Append td.CreateField("LegalEndM", dbLong)
        td.Fields.Append td.CreateField("AddBack", dbText, 20)
        td.Fields.Append td.CreateField("ExitType", dbText, 20)
        td.Fields.Append td.CreateField("ExitMonth", dbLong)
        td.Fields.Append td.CreateField("StartMonth", dbLong)
        td.Fields.Append td.CreateField("DPOPct", dbDouble)
        td.Fields.Append td.CreateField("ValCapPct", dbDouble)
        td.Fields.Append td.CreateField("YTMTgt", dbDouble)
        td.Fields.Append td.CreateField("UserExit", dbCurrency)
        td.Fields.Append td.CreateField("MTrailSel", dbText, 3)
        td.Fields.Append td.CreateField("LiqAcrM", dbLong)
        td.Fields.Append td.CreateField("AddAccrued", dbText, 3)
        td.Fields.Append td.CreateField("PmtPull", dbCurrency)
        td.Fields.Append td.CreateField("ExitVal", dbCurrency)
        td.Fields.Append td.CreateField("BidNPV", dbCurrency)
        td.Fields.Append td.CreateField("BidPct", dbDouble)
        td.Fields.Append td.CreateField("MOIC", dbDouble)
        td.Fields.Append td.CreateField("CY12", dbDouble)
        td.Fields.Append td.CreateField("ImpDPO", dbDouble)
        db.TableDefs.Append td
    End If
    On Error Resume Next
    Set td = db.TableDefs("xtblBidReaderSet")
    If Err.Number <> 0 Then
        Err.Clear
        On Error GoTo 0
        Set td = db.CreateTableDef("xtblBidReaderSet")
        td.Fields.Append td.CreateField("RelatedLoans", dbText, 100)
        td.Fields.Append td.CreateField("YieldTarget", dbDouble)
        td.Fields.Append td.CreateField("AnchorDt", dbDate)
        db.TableDefs.Append td
    End If
    Err.Clear
    On Error GoTo 0
    ' Upgrade path: the scratch table persists across rebuilds, so add
    ' any column introduced after an existing install created it
    Dim f As DAO.Field
    On Error Resume Next
    Set td = db.TableDefs("xtblBidReader")
    If Err.Number = 0 Then
        Err.Clear
        Set f = td.Fields("UserExit")
        If Err.Number <> 0 Then
            Err.Clear
            db.Execute "ALTER TABLE xtblBidReader ADD COLUMN UserExit CURRENCY"
        End If
        Err.Clear
        Set f = td.Fields("MTrailSel")
        If Err.Number <> 0 Then
            Err.Clear
            db.Execute "ALTER TABLE xtblBidReader ADD COLUMN MTrailSel TEXT(3)"
        End If
        Err.Clear
        Set f = td.Fields("LiqAcrM")
        If Err.Number <> 0 Then
            Err.Clear
            db.Execute "ALTER TABLE xtblBidReader ADD COLUMN LiqAcrM LONG"
        End If
    End If
    db.TableDefs.Refresh
    Err.Clear
    On Error GoTo 0
End Sub

' ================= FORM: PAY HISTORY SHEET ===========================
' The workbook's 'Relationship Pay History' sheet: per-loan stats
' (Origination, PMT, Int PMT, Trailing 3/6/12/24 with the Trail
' Selection transforms) + the 36-month payment matrix, newest first,
' anchored to the reader's PMT Hist Dt. Read-only; loans as columns
' in the matrix (first 10, like the sheet's C..L).
Private Sub BuildFrmPayHistSheet()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmPayHistSheet", acForm
    Set frm = NewDarkForm("", 0)
    nm = frm.Name
    frm.Caption = "Relationship Pay History"
    frm.PopUp = True
    frm.NavigationButtons = False
    frm.HasModule = True
    frm.Section(acDetail).Height = 5.3 * T1
    frm.Section(acDetail).BackColor = CLR_MAIN

    Set c = CreateControl(nm, acLabel, acDetail, "", "", _
                          CLng(0.05 * T1), CLng(0.05 * T1), CLng(1.4 * T1), CLng(0.24 * T1))
    c.Caption = "PAY HISTORY": c.ForeColor = CLR_TEXT
    c.FontName = FONT: c.FontSize = 11: c.FontBold = True
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
                          "=[Forms]![frmBidReader]![cboRelationship]", _
                          CLng(1.5 * T1), CLng(0.07 * T1), CLng(1.8 * T1), CLng(0.22 * T1))
    StyleCell c: c.Name = "txtRel": c.ForeColor = CLR_TITLE: c.FontBold = True
    c.FontSize = 10
    Set c = CreateControl(nm, acLabel, acDetail, "", "", _
                          CLng(3.9 * T1), CLng(0.08 * T1), CLng(1# * T1), CLng(0.2 * T1))
    c.Caption = "Trail Selection": c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acComboBox, acDetail, "", "", _
                          CLng(4.95 * T1), CLng(0.05 * T1), CLng(1.5 * T1), CLng(0.25 * T1))
    c.Name = "cboTrailSel"
    c.RowSourceType = "Value List"
    c.RowSource = """Actual"";""monthly"";""yearly"";""% of Contractual"";""% of Int PMT"";""# of PMT's Made"";""# of Int Pmt's Made"""
    c.LimitToList = True
    c.DefaultValue = "=""# of PMT's Made"""
    ComboLook c
    Set c = CreateControl(nm, acLabel, acDetail, "", "", _
                          CLng(6.6 * T1), CLng(0.08 * T1), CLng(0.55 * T1), CLng(0.2 * T1))
    c.Caption = "Anchor": c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
                          "=[Forms]![frmBidReader]![txtAnchor]", _
                          CLng(7.15 * T1), CLng(0.07 * T1), CLng(0.8 * T1), CLng(0.22 * T1))
    StyleCell c: c.Name = "txtAnchorEcho": c.Format = "mm/dd/yy"

    Set c = CreateControl(nm, acListBox, acDetail, "", "", _
                          CLng(0.05 * T1), CLng(0.42 * T1), CLng(9.85 * T1), CLng(1.35 * T1))
    c.Name = "lstStats"
    c.RowSourceType = "Value List"
    c.RowSource = "Loan No;Orig;PMT;Int PMT;Trail 3;Trail 6;Trail 12;Trail 24"
    c.ColumnCount = 8
    c.BoundColumn = 1
    c.ColumnWidths = "1450;800;950;950;850;850;850;850"
    c.ColumnHeads = True
    ListLook c
    Set c = CreateControl(nm, acLabel, acDetail, "", "", _
                          CLng(0.05 * T1), CLng(1.88 * T1), CLng(4.5 * T1), CLng(0.2 * T1))
    c.Caption = "Monthly payments, newest first (up to 10 loans + relationship total)"
    c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acListBox, acDetail, "", "", _
                          CLng(0.05 * T1), CLng(2.12 * T1), CLng(9.85 * T1), CLng(3.05 * T1))
    c.Name = "lstMatrix"
    c.RowSourceType = "Value List"
    c.RowSource = "Month;Total"
    c.ColumnCount = 2
    c.BoundColumn = 1
    c.ColumnWidths = "700;1000"
    c.ColumnHeads = True
    ListLook c

    Dim mdl As Module, ln As Long, code As String
    frm!cboTrailSel.AfterUpdate = "[Event Procedure]"
    frm.OnLoad = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("AfterUpdate", "cboTrailSel")
    mdl.InsertLines ln + 1, "    RebuildAll"
    ln = mdl.CreateEventProc("Load", "Form")
    mdl.InsertLines ln + 1, "    On Error Resume Next" & vbCrLf & "    RebuildAll"

    code = ""
    code = code & "Private Function TrailX(s As Double, n As Long, sel As String, cpmt As Double, ipmt As Double) As String" & vbCrLf
    code = code & "    ' The sheet's Trail Selection SWITCH transforms" & vbCrLf
    code = code & "    Select Case sel" & vbCrLf
    code = code & "        Case ""monthly"": TrailX = Format(s / n, ""$#,##0"")" & vbCrLf
    code = code & "        Case ""yearly"": TrailX = Format(s / n * 12, ""$#,##0"")" & vbCrLf
    code = code & "        Case ""% of Contractual""" & vbCrLf
    code = code & "            If cpmt = 0 Then TrailX = ""-"" Else TrailX = Format(s / (cpmt * n), ""0.0%"")" & vbCrLf
    code = code & "        Case ""% of Int PMT""" & vbCrLf
    code = code & "            If ipmt = 0 Then TrailX = ""-"" Else TrailX = Format(s / (ipmt * n), ""0.0%"")" & vbCrLf
    code = code & "        Case ""# of PMT's Made""" & vbCrLf
    code = code & "            If cpmt = 0 Then TrailX = ""-"" Else TrailX = Format(s / cpmt, ""0.00"")" & vbCrLf
    code = code & "        Case ""# of Int Pmt's Made""" & vbCrLf
    code = code & "            If ipmt = 0 Then TrailX = ""-"" Else TrailX = Format(s / ipmt, ""0.00"")" & vbCrLf
    code = code & "        Case Else: TrailX = Format(s, ""$#,##0"")" & vbCrLf
    code = code & "    End Select" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Public Sub RebuildAll()" & vbCrLf
    code = code & "    Dim rel As String, esc As String, anchor As Date, sel As String" & vbCrLf
    code = code & "    Dim rs As DAO.Recordset, cnt As Integer, i As Integer, j As Integer" & vbCrLf
    code = code & "    Dim lnos(1 To 10) As String, cp(1 To 10) As Double, ip(1 To 10) As Double" & vbCrLf
    code = code & "    Dim org(1 To 10) As Variant, amounts(1 To 10, 0 To 35) As Double" & vbCrLf
    code = code & "    Dim inl As String, lo As Long, d As Date, py As Long, pmn As Long, idx As Long" & vbCrLf
    code = code & "    Dim s As String, w As String, tot As Double, t3 As Double, t6 As Double" & vbCrLf
    code = code & "    Dim t12 As Double, t24 As Double" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    rel = Nz(Forms(""frmBidReader"")!cboRelationship, """")" & vbCrLf
    code = code & "    If Len(rel) = 0 Then Exit Sub" & vbCrLf
    code = code & "    esc = Replace(rel, ""'"", ""''"")" & vbCrLf
    code = code & "    anchor = Nz(Forms(""frmBidReader"")!txtAnchor, Date)" & vbCrLf
    code = code & "    sel = Nz(Me!cboTrailSel, ""# of PMT's Made"")" & vbCrLf
    code = code & "    ' Loans of the relationship, largest first (sheet columns C..L)" & vbCrLf
    code = code & "    cnt = 0" & vbCrLf
    code = code & "    Set rs = CurrentDb.OpenRecordset(""SELECT MWLoanNo, OrgNoteDate, RepayAmt, Rate, PrincipalBalance FROM tblLoan WHERE RelatedLoans='"" & esc & ""' ORDER BY PrincipalBalance DESC"", dbOpenSnapshot)" & vbCrLf
    code = code & "    Do While Not rs.EOF" & vbCrLf
    code = code & "        If cnt < 10 Then" & vbCrLf
    code = code & "            cnt = cnt + 1" & vbCrLf
    code = code & "            lnos(cnt) = Nz(rs!MWLoanNo, """")" & vbCrLf
    code = code & "            cp(cnt) = Nz(rs!RepayAmt, 0)" & vbCrLf
    code = code & "            ip(cnt) = Nz(rs!Rate, 0) / 12 * Nz(rs!PrincipalBalance, 0)" & vbCrLf
    code = code & "            org(cnt) = rs!OrgNoteDate" & vbCrLf
    code = code & "        End If" & vbCrLf
    code = code & "        rs.MoveNext" & vbCrLf
    code = code & "    Loop" & vbCrLf
    code = code & "    rs.Close" & vbCrLf
    code = code & "    If cnt = 0 Then Exit Sub" & vbCrLf
    code = code & "    ' One grouped pull for the whole 36-month window (pd key)" & vbCrLf
    code = code & "    inl = """"" & vbCrLf
    code = code & "    For i = 1 To cnt" & vbCrLf
    code = code & "        inl = inl & "",'"" & Replace(lnos(i), ""'"", ""''"") & ""'""" & vbCrLf
    code = code & "    Next i" & vbCrLf
    code = code & "    inl = Mid(inl, 2)" & vbCrLf
    code = code & "    d = DateAdd(""m"", -35, anchor)" & vbCrLf
    code = code & "    lo = Year(d) * 100 + Month(d)" & vbCrLf
    code = code & "    Set rs = CurrentDb.OpenRecordset(""SELECT mwloanno, pd, Sum(amount) AS amt FROM tblPayHistory WHERE pd >= "" & lo & "" AND mwloanno IN ("" & inl & "") GROUP BY mwloanno, pd"", dbOpenSnapshot)" & vbCrLf
    code = code & "    Do While Not rs.EOF" & vbCrLf
    code = code & "        py = Nz(rs!pd, 0) \ 100" & vbCrLf
    code = code & "        pmn = Nz(rs!pd, 0) Mod 100" & vbCrLf
    code = code & "        idx = (Year(anchor) - py) * 12 + (Month(anchor) - pmn)" & vbCrLf
    code = code & "        If idx >= 0 And idx <= 35 Then" & vbCrLf
    code = code & "            For i = 1 To cnt" & vbCrLf
    code = code & "                If lnos(i) = Nz(rs!mwloanno, """") Then amounts(i, idx) = amounts(i, idx) + Nz(rs!amt, 0)" & vbCrLf
    code = code & "            Next i" & vbCrLf
    code = code & "        End If" & vbCrLf
    code = code & "        rs.MoveNext" & vbCrLf
    code = code & "    Loop" & vbCrLf
    code = code & "    rs.Close" & vbCrLf
    code = code & "    ' Stats list (trails computed from the matrix window)" & vbCrLf
    code = code & "    s = ""Loan No;Orig;PMT;Int PMT;Trail 3;Trail 6;Trail 12;Trail 24""" & vbCrLf
    code = code & "    For i = 1 To cnt" & vbCrLf
    code = code & "        t3 = 0: t6 = 0: t12 = 0: t24 = 0" & vbCrLf
    code = code & "        For j = 0 To 35" & vbCrLf
    code = code & "            If j <= 2 Then t3 = t3 + amounts(i, j)" & vbCrLf
    code = code & "            If j <= 5 Then t6 = t6 + amounts(i, j)" & vbCrLf
    code = code & "            If j <= 11 Then t12 = t12 + amounts(i, j)" & vbCrLf
    code = code & "            If j <= 23 Then t24 = t24 + amounts(i, j)" & vbCrLf
    code = code & "        Next j" & vbCrLf
    code = code & "        s = s & "";"" & lnos(i) & "";"" & Format(Nz(org(i), """"), ""mm/dd/yy"")" & vbCrLf
    code = code & "        s = s & "";"" & Chr(34) & Format(cp(i), ""$#,##0"") & Chr(34) & "";"" & Chr(34) & Format(ip(i), ""$#,##0"") & Chr(34)" & vbCrLf
    code = code & "        s = s & "";"" & Chr(34) & TrailX(t3, 3, sel, cp(i), ip(i)) & Chr(34) & "";"" & Chr(34) & TrailX(t6, 6, sel, cp(i), ip(i)) & Chr(34)" & vbCrLf
    code = code & "        s = s & "";"" & Chr(34) & TrailX(t12, 12, sel, cp(i), ip(i)) & Chr(34) & "";"" & Chr(34) & TrailX(t24, 24, sel, cp(i), ip(i)) & Chr(34)" & vbCrLf
    code = code & "    Next i" & vbCrLf
    code = code & "    Me!lstStats.RowSource = s" & vbCrLf
    code = code & "    ' Monthly matrix: Month | loan1..loanN | Total, newest first" & vbCrLf
    code = code & "    Me!lstMatrix.ColumnCount = cnt + 2" & vbCrLf
    code = code & "    w = ""700""" & vbCrLf
    code = code & "    For i = 1 To cnt" & vbCrLf
    code = code & "        w = w & "";950""" & vbCrLf
    code = code & "    Next i" & vbCrLf
    code = code & "    Me!lstMatrix.ColumnWidths = w & "";1000""" & vbCrLf
    code = code & "    s = ""Month""" & vbCrLf
    code = code & "    For i = 1 To cnt" & vbCrLf
    code = code & "        s = s & "";"" & lnos(i)" & vbCrLf
    code = code & "    Next i" & vbCrLf
    code = code & "    s = s & "";Total""" & vbCrLf
    code = code & "    For j = 0 To 35" & vbCrLf
    code = code & "        s = s & "";"" & Format(DateAdd(""m"", -j, anchor), ""mm/yy"")" & vbCrLf
    code = code & "        tot = 0" & vbCrLf
    code = code & "        For i = 1 To cnt" & vbCrLf
    code = code & "            s = s & "";"" & Chr(34) & Format(amounts(i, j), ""#,##0"") & Chr(34)" & vbCrLf
    code = code & "            tot = tot + amounts(i, j)" & vbCrLf
    code = code & "        Next i" & vbCrLf
    code = code & "        s = s & "";"" & Chr(34) & Format(tot, ""#,##0"") & Chr(34)" & vbCrLf
    code = code & "    Next j" & vbCrLf
    code = code & "    Me!lstMatrix.RowSource = s" & vbCrLf
    code = code & "End Sub" & vbCrLf
    mdl.InsertLines mdl.CountOfLines + 1, code
    SaveAs nm, "frmPayHistSheet"
End Sub

' ================= FORM: COLLATERAL SHEET ============================
' The workbook's 'Collateral' sheet, transposed to rows: location/size,
' appraisal with $/SF-$/Unit-$/Acre and months-since-appraised, taxes,
' MwVx vs MW lien -> net values, footer totals with the sheet's 90%
' line, plus the what-if valuation calculator (scratch only, nothing
' saved). Read-only per control (every bound cell Locked) so the
' unbound calculator inputs stay typeable; no module.
Private Sub BuildFrmCollSheet()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmCollSheet", acForm
    Set frm = NewDarkForm( _
        "SELECT * FROM CollateralInfo WHERE RelatedLoans = " & _
        "Forms!frmBidReader!cboRelationship ORDER BY Priority", 1)
    nm = frm.Name
    frm.Caption = "Relationship Collateral"
    frm.PopUp = True
    ' No AllowEdits=False here: it would also freeze the UNBOUND
    ' calculator inputs. Data safety comes from Locked on every bound
    ' cell + no additions/deletions.
    frm.AllowAdditions = False
    frm.AllowDeletions = False
    EnsureHeader frm
    frm.Section(acHeader).BackColor = CLR_CARD
    frm.Section(acHeader).Height = 1# * T1
    frm.Section(acDetail).Height = 0.66 * T1
    frm.Section(acDetail).BackColor = CLR_MAIN
    frm.Section(acFooter).Height = 0.32 * T1
    frm.Section(acFooter).BackColor = CLR_HEADER

    ' What-if valuation calculator (current row; scratch only)
    HeadLbl frm, "Valuation Calc:", 0.05, 1#, 0.04, False
    Set c = CreateControl(nm, acComboBox, acHeader, "", "", _
                          CLng(1.1 * T1), CLng(0.02 * T1), CLng(0.6 * T1), CLng(0.25 * T1))
    c.Name = "cboUnitSel"
    c.RowSourceType = "Value List"
    c.RowSource = """SF"";""Unit"";""Acre"""
    c.LimitToList = True
    c.DefaultValue = "=""Unit"""
    ComboLook c
    HeadLbl frm, "Value/unit", 1.8, 0.7, 0.04, False
    Set c = CreateControl(nm, acTextBox, acHeader, "", "", _
                          CLng(2.5 * T1), CLng(0.02 * T1), CLng(0.7 * T1), CLng(0.25 * T1))
    StyleInput c: c.Name = "txtUnitVal": c.Format = "$#,##0": c.FontSize = 8
    HeadLbl frm, "= Property Value (current row):", 3.3, 1.95, 0.04, False
    Set c = CreateControl(nm, acTextBox, acHeader, "", _
        "=IIf([cboUnitSel]='SF',Nz([SQFT],0),IIf([cboUnitSel]='Unit',Nz([NumUnits],0),Nz([Acreage],0)))*Nz([txtUnitVal],0)", _
        CLng(5.25 * T1), CLng(0.02 * T1), CLng(0.9 * T1), CLng(0.25 * T1))
    ResultLook c: c.Name = "txtCalcVal"
    c.Format = "$#,##0": c.TextAlign = 3: c.FontSize = 9
    HeadLbl frm, "(scratch only - nothing is saved)", 6.3, 2.2, 0.04, False

    ' Column label bands: gray = data, green = computed net values
    HeadBand frm, 0.05, 10.1, 0.54, CLR_HEADER
    HeadBand frm, 0.05, 8.3, 0.76, CLR_HEADER
    HeadBand frm, 8.35, 1.8, 0.76, CLR_RESBG
    HeadLbl frm, "Prop#", 0.05, 0.7, 0.56, False
    HeadLbl frm, "Code", 0.8, 0.85, 0.56, False
    HeadLbl frm, "Description", 1.7, 1.5, 0.56, False
    HeadLbl frm, "Address", 3.25, 1.85, 0.56, False
    HeadLbl frm, "City", 5.15, 0.95, 0.56, False
    HeadLbl frm, "St", 6.15, 0.4, 0.56, False
    HeadLbl frm, "ZIP", 6.6, 0.6, 0.56, False
    HeadLbl frm, "County", 7.25, 0.95, 0.56, False
    HeadLbl frm, "SF", 8.25, 0.65, 0.56, True
    HeadLbl frm, "Units", 8.95, 0.5, 0.56, True
    HeadLbl frm, "Acres", 9.5, 0.55, 0.56, True
    HeadLbl frm, "ApprDt", 0.05, 0.75, 0.78, False
    HeadLbl frm, "Mos", 0.85, 0.45, 0.78, True
    HeadLbl frm, "Appraised", 1.35, 0.9, 0.78, True
    HeadLbl frm, "$/SF", 2.3, 0.6, 0.78, True
    HeadLbl frm, "$/Unit", 2.95, 0.7, 0.78, True
    HeadLbl frm, "$/Acre", 3.7, 0.7, 0.78, True
    HeadLbl frm, "AnnTax", 4.45, 0.75, 0.78, True
    HeadLbl frm, "DelqTax", 5.25, 0.8, 0.78, True
    HeadLbl frm, "MwVx", 6.1, 0.9, 0.78, True
    HeadLbl frm, "MwLien", 7.05, 0.85, 0.78, True
    HeadLbl frm, "Pos", 7.95, 0.4, 0.78, True
    HeadLbl frm, "Net MwVx", 8.4, 0.85, 0.78, True
    HeadLbl frm, "Net Seller", 9.3, 0.85, 0.78, True

    ' Row A: identity / location / size
    RCell frm, "MWPropertyNo", 0.05, 0.02, 0.7, 1, ""
    RCell frm, "MWCollateralCode", 0.8, 0.02, 0.85, 1, ""
    RCell frm, "Description", 1.7, 0.02, 1.5, 1, ""
    RCell frm, "Address", 3.25, 0.02, 1.85, 1, ""
    RCell frm, "City", 5.15, 0.02, 0.95, 1, ""
    RCell frm, "State", 6.15, 0.02, 0.4, 1, ""
    RCell frm, "Zip", 6.6, 0.02, 0.6, 1, ""
    RCell frm, "County", 7.25, 0.02, 0.95, 1, ""
    RCell frm, "SQFT", 8.25, 0.02, 0.65, 1, "#,##0"
    RCell frm, "NumUnits", 8.95, 0.02, 0.5, 1, ""
    RCell frm, "Acreage", 9.5, 0.02, 0.55, 1, ""
    ' Row B: appraisal / taxes / liens / net values
    RCell frm, "SellerAppraisalDate", 0.05, 0.36, 0.75, 1, "mm/dd/yy"
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
        "=IIf(IsNull([SellerAppraisalDate]),Null,DateDiff('m',[SellerAppraisalDate],Date()))", _
        CLng(0.85 * T1), CLng(0.36 * T1), CLng(0.45 * T1), CLng(0.24 * T1))
    CalcCell c: c.Name = "txtMosAppr": c.Format = "0"
    RCell frm, "SellerAppraisedValue", 1.35, 0.36, 0.9, 1, "$#,##0"
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
        "=IIf(Nz([SQFT],0)=0,Null,[SellerAppraisedValue]/[SQFT])", _
        CLng(2.3 * T1), CLng(0.36 * T1), CLng(0.6 * T1), CLng(0.24 * T1))
    CalcCell c: c.Name = "txtPerSF": c.Format = "$#,##0"
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
        "=IIf(Nz([NumUnits],0)=0,Null,[SellerAppraisedValue]/[NumUnits])", _
        CLng(2.95 * T1), CLng(0.36 * T1), CLng(0.7 * T1), CLng(0.24 * T1))
    CalcCell c: c.Name = "txtPerUnit": c.Format = "$#,##0"
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
        "=IIf(Nz([Acreage],0)=0,Null,[SellerAppraisedValue]/[Acreage])", _
        CLng(3.7 * T1), CLng(0.36 * T1), CLng(0.7 * T1), CLng(0.24 * T1))
    CalcCell c: c.Name = "txtPerAcre": c.Format = "$#,##0"
    RCell frm, "TaxAnnualAmt", 4.45, 0.36, 0.75, 1, "$#,##0"
    RCell frm, "TaxDelinquentAmt", 5.25, 0.36, 0.8, 1, "$#,##0"
    RCell frm, "CurrentAppraisedValue", 6.1, 0.36, 0.9, 1, "$#,##0"
    RCell frm, "MWTitleSrLienAmt", 7.05, 0.36, 0.85, 1, "$#,##0"
    RCell frm, "MWTitleLienPosition", 7.95, 0.36, 0.4, 1, ""
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
        "=IIf(Nz([CurrentAppraisedValue],0)-Nz([MWTitleSrLienAmt],0)<0,0,Nz([CurrentAppraisedValue],0)-Nz([MWTitleSrLienAmt],0))", _
        CLng(8.4 * T1), CLng(0.36 * T1), CLng(0.85 * T1), CLng(0.24 * T1))
    ResultLook c: c.Name = "txtNetMwVx": c.TextAlign = 3: c.Format = "$#,##0"
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
        "=IIf(Nz([SellerAppraisedValue],0)-Nz([MWTitleSrLienAmt],0)<0,0,Nz([SellerAppraisedValue],0)-Nz([MWTitleSrLienAmt],0))", _
        CLng(9.3 * T1), CLng(0.36 * T1), CLng(0.85 * T1), CLng(0.24 * T1))
    ResultLook c: c.Name = "txtNetSeller": c.TextAlign = 3: c.Format = "$#,##0"

    ' Footer: totals + the sheet's 90% haircut line
    Set c = CreateControl(nm, acLabel, acFooter, "", "", _
                          CLng(0.05 * T1), CLng(0.06 * T1), CLng(0.6 * T1), CLng(0.2 * T1))
    c.Caption = "Totals": c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acFooter, "", "=Sum([SellerAppraisedValue])", _
                          CLng(1.35 * T1), CLng(0.04 * T1), CLng(0.9 * T1), CLng(0.24 * T1))
    StyleCell c: c.Name = "txtTotAppr": c.Format = "$#,##0": c.TextAlign = 3
    Set c = CreateControl(nm, acTextBox, acFooter, "", "=Sum([CurrentAppraisedValue])", _
                          CLng(6.1 * T1), CLng(0.04 * T1), CLng(0.9 * T1), CLng(0.24 * T1))
    StyleCell c: c.Name = "txtTotMwVx": c.Format = "$#,##0": c.TextAlign = 3
    Set c = CreateControl(nm, acTextBox, acFooter, "", _
        "=Sum(IIf(Nz([CurrentAppraisedValue],0)-Nz([MWTitleSrLienAmt],0)<0,0,Nz([CurrentAppraisedValue],0)-Nz([MWTitleSrLienAmt],0)))", _
        CLng(8.4 * T1), CLng(0.04 * T1), CLng(0.85 * T1), CLng(0.24 * T1))
    ResultLook c: c.Name = "txtTotNet"
    c.Format = "$#,##0": c.TextAlign = 3
    Set c = CreateControl(nm, acLabel, acFooter, "", "", _
                          CLng(2.4 * T1), CLng(0.06 * T1), CLng(0.9 * T1), CLng(0.2 * T1))
    c.Caption = "Net @ 90%": c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acFooter, "", _
        "=Sum(IIf(Nz([CurrentAppraisedValue],0)-Nz([MWTitleSrLienAmt],0)<0,0,Nz([CurrentAppraisedValue],0)-Nz([MWTitleSrLienAmt],0)))*0.9", _
        CLng(3.3 * T1), CLng(0.04 * T1), CLng(0.9 * T1), CLng(0.24 * T1))
    ResultLook c: c.Name = "txtTotNet90"
    c.Format = "$#,##0": c.TextAlign = 3
    SaveAs nm, "frmCollSheet"
End Sub

' ================= THE FORM (vertical sheet layout) ==================
' The 'Relationship Projection' sheet's own orientation: categories run
' DOWN the left in the sheet's exact row order; loans are COLUMNS
' (up to 8, like the sheet's C..L) plus a Relationship totals column.
' Yellow cells are editable in place - any change sweeps the columns
' back to the local scratch table, recalcs, and repaints.
Private Sub BuildFrmBidReader()
    Dim frm As Form, nm As String, c As Control
    Dim K As Variant, Cp As Variant, T As Variant, F As Variant
    Dim r As Integer, i As Integer, y As Single, x As Single
    Const LBLW As Single = 1.45
    Const X0 As Single = 1.55
    Const COLW As Single = 0.85
    Const NCOLS As Integer = 8
    Const TOTX As Single = 8.4
    Const TOTW As Single = 0.95
    Const RH As Single = 0.21

    DropIfExists "frmBidReader", acForm
    Set frm = NewDarkForm("", 0)
    nm = frm.Name
    frm.Caption = "Relationship Projection"
    frm.NavigationButtons = False
    frm.HasModule = True
    EnsureHeader frm
    frm.Section(acHeader).BackColor = CLR_CARD
    frm.Section(acHeader).Height = 0.62 * T1
    frm.Section(acDetail).Height = 12.55 * T1
    frm.Section(acDetail).BackColor = CLR_MAIN
    frm.Section(acFooter).Height = 0

    ' --- Header: title + pickers (unchanged flow) ---
    Set c = CreateControl(nm, acLabel, acHeader, "", "", _
                          CLng(0.1 * T1), CLng(0.03 * T1), CLng(1.35 * T1), CLng(0.24 * T1))
    c.Caption = "RELATIONSHIP": c.ForeColor = CLR_TEXT
    c.FontName = FONT: c.FontSize = 11: c.FontBold = True
    Set c = CreateControl(nm, acLabel, acHeader, "", "", _
                          CLng(1.5 * T1), CLng(0.03 * T1), CLng(1.25 * T1), CLng(0.24 * T1))
    c.Caption = "PROJECTION": c.ForeColor = CLR_TITLE
    c.FontName = FONT: c.FontSize = 11: c.FontBold = True
    HeadLbl frm, "reads SQL Server only - all inputs stay local - yellow = editable", 2.85, 4.2, 0.08, False
    Set c = CreateControl(nm, acCommandButton, acHeader, "", "", _
                          CLng(9# * T1), CLng(0.02 * T1), CLng(0.85 * T1), CLng(0.26 * T1))
    c.Name = "btnRecalc": c.Caption = "Recalc"
    DarkBtn c
    HeadLbl frm, "Project", 0.1, 0.55, 0.36, False
    Set c = CreateControl(nm, acComboBox, acHeader, "", "", _
                          CLng(0.65 * T1), CLng(0.34 * T1), CLng(1.9 * T1), CLng(0.25 * T1))
    c.Name = "cboProject"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT ProjectName FROM tblProjects ORDER BY ProjectName;"
    c.LimitToList = True
    ComboLook c
    HeadLbl frm, "Relationship", 2.65, 0.8, 0.36, False
    Set c = CreateControl(nm, acComboBox, acHeader, "", "", _
                          CLng(3.5 * T1), CLng(0.34 * T1), CLng(1.7 * T1), CLng(0.25 * T1))
    c.Name = "cboRelationship"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT RelatedLoans FROM tblRelationships " & _
        "WHERE ProjectName = Forms!frmBidReader!cboProject ORDER BY SortNo;"
    c.LimitToList = True
    ComboLook c
    HeadLbl frm, "PMT Hist Dt", 5.3, 0.75, 0.36, False
    Set c = CreateControl(nm, acTextBox, acHeader, "", "", _
                          CLng(6.05 * T1), CLng(0.34 * T1), CLng(0.8 * T1), CLng(0.25 * T1))
    StyleInput c: c.Name = "txtAnchor": c.Format = "mm/dd/yy": c.FontSize = 8
    c.DefaultValue = "=Date()"
    HeadLbl frm, "Yield", 6.95, 0.4, 0.36, False
    Set c = CreateControl(nm, acTextBox, acHeader, "", "", _
                          CLng(7.35 * T1), CLng(0.34 * T1), CLng(0.55 * T1), CLng(0.25 * T1))
    StyleInput c: c.Name = "txtYield": c.Format = "0.00%": c.FontSize = 8
    Set c = CreateControl(nm, acCommandButton, acHeader, "", "", _
                          CLng(8# * T1), CLng(0.33 * T1), CLng(0.9 * T1), CLng(0.26 * T1))
    c.Name = "btnPayHist": c.Caption = "Pay History"
    DarkBtn c
    Set c = CreateControl(nm, acCommandButton, acHeader, "", "", _
                          CLng(8.95 * T1), CLng(0.33 * T1), CLng(0.9 * T1), CLng(0.26 * T1))
    c.Name = "btnColl": c.Caption = "Collateral"
    DarkBtn c

    ' --- Row definitions: the sheet's exact top-to-bottom order ---
    ' kinds: g=data (white), c=calc (white), r=result (green fill),
    ' y=yellow input, Y=yellow combo, t=single Trail Selection combo,
    ' s=section label
    K = Array("LoanNo", "UPB", "IntBal", "MAI", "CRate", "DRate", "MatDt", "CPmt", "MTM", "MTA", "RelColl", "T3", "T6", "T12", "TrailDisp", "PmtSel", "PmtPull", _
              "IntPmt", "UserPmt", "TermPmt", "TermMonths", "PctTrail", "MTrailSel", "TrailPct", "RateSel", "RatePull", "UserRate", "LegalHdr", "LegalInit", "LegalStartM", "HoldCost", "LegalEndM", "AddBack", _
              "ExitType", "ExitVal", "DPOPct", "UserExit", "ValCapPct", "YTMTgt", "AddAccrued", "LiqAcrM", "ImpDPO", "StartMonth", "ExitMonth", "BidPct", "BidNPV", "CY12", "MOIC", "BidMwVx", "F12P12")
    Cp = Array("Loan Number", "UPB", "Interest", "MAI", "Rate", "Default Rate", "Maturity", "PMT", "MTM", "MTA", "Rel Collateral", "3M Trail", "6M Trail", "12M Trail", "Trail Selection", "Payment Selection", "Payment Pull", _
               "Interest Payment", "User PMT", "Term PMT", "Term Months", "% X Trail PMT", "M Trail", "Trail %", "Rate Selection", "Rate Pull", "User Rate", "Legal", "Initial Legal $", "Intial Start M", "Holding Cost $", "Legal End M", "Add Back to Exit", _
               "Exit Type", "Exit Pull", "DPO %", "User Enter", "Value Cap", "YTM Target %", "Add Current Accrued", "LQDN Forward Acr M", "Implied DPO", "Start Mont", "Exit Month", "Bid %", "Bid", "12M CY", "MOIC", "Bid/MwVx", "F12/P12 PMT")
    T = Array("g", "g", "g", "c", "g", "g", "g", "g", "c", "c", "c", "c", "c", "c", "t", "Y", "c", _
              "c", "y", "c", "y", "c", "Y", "y", "Y", "c", "y", "s", "y", "y", "y", "y", "Y", _
              "Y", "r", "y", "y", "y", "y", "Y", "y", "r", "y", "y", "r", "r", "r", "r", "r", "r")
    F = Array("", "$#,##0", "$#,##0", "0.0", "0.00%", "0.00%", "mm/dd/yy", "$#,##0", "0", "0", "$#,##0", "", "", "", "", "", "$#,##0", _
              "$#,##0", "$#,##0", "$#,##0", "0", "$#,##0", "", "0.00%", "", "0.00%", "0.00%", "", "$#,##0", "0", "$#,##0", "0", "", _
              "", "$#,##0", "0.00%", "$#,##0", "0.00%", "0.00%", "", "0", "0.0%", "0", "0", "0.0%", "$#,##0", "0.0%", "0.00", "0.0%", "0.00")

    For r = 0 To UBound(K)
        y = 0.05 + r * RH
        If T(r) = "s" Then
            Set c = CreateControl(nm, acLabel, acDetail, "", "", _
                                  CLng(0.05 * T1), CLng((y + 0.01) * T1), CLng(3# * T1), CLng(0.19 * T1))
            c.Caption = CStr(Cp(r)): c.ForeColor = CLR_TITLE
            c.FontName = FONT: c.FontSize = 9: c.FontBold = True
        Else
            Set c = CreateControl(nm, acLabel, acDetail, "", "", _
                                  CLng(0.05 * T1), CLng((y + 0.01) * T1), CLng(LBLW * T1), CLng(0.19 * T1))
            c.Caption = CStr(Cp(r)): c.ForeColor = CLR_TEXTSEC
            c.FontName = FONT: c.FontSize = 8: c.FontBold = True
            If T(r) = "t" Then
                Set c = CreateControl(nm, acComboBox, acDetail, "", "", _
                                      CLng(TOTX * T1), CLng(y * T1), CLng(TOTW * T1), CLng(0.2 * T1))
                c.Name = "cTrailDisp"
                c.RowSourceType = "Value List"
                c.RowSource = ComboList("TrailDisp")
                c.LimitToList = True
                c.DefaultValue = "=""Actual"""
                ComboLook c
                c.AfterUpdate = "=PaintOnly()"
            Else
                For i = 1 To NCOLS
                    x = X0 + (i - 1) * COLW
                    If T(r) = "Y" Then
                        Set c = CreateControl(nm, acComboBox, acDetail, "", "", _
                                              CLng(x * T1), CLng(y * T1), CLng((COLW - 0.05) * T1), CLng(0.2 * T1))
                        c.Name = "c" & i & "_" & K(r)
                        c.RowSourceType = "Value List"
                        c.RowSource = ComboList(CStr(K(r)))
                        c.LimitToList = False
                        ComboLook c
                        c.AfterUpdate = "=SaveRecalc()"
                    Else
                        Set c = CreateControl(nm, acTextBox, acDetail, "", "", _
                                              CLng(x * T1), CLng(y * T1), CLng((COLW - 0.05) * T1), CLng(0.2 * T1))
                        c.Name = "c" & i & "_" & K(r)
                        Select Case T(r)
                            Case "y"
                                StyleInput c: c.FontSize = 8: c.TextAlign = 3
                                c.AfterUpdate = "=SaveRecalc()"
                            Case "r"
                                ResultLook c
                            Case Else
                                CalcCell c
                        End Select
                        If Len(F(r)) > 0 Then c.Format = CStr(F(r))
                        If K(r) = "LoanNo" Then c.TextAlign = 1
                    End If
                Next i
                ' Relationship totals column (data/calc/result rows only)
                If T(r) = "g" Or T(r) = "c" Or T(r) = "r" Then
                    Set c = CreateControl(nm, acTextBox, acDetail, "", "", _
                                          CLng(TOTX * T1), CLng(y * T1), CLng(TOTW * T1), CLng(0.2 * T1))
                    c.Name = "cT_" & K(r)
                    If T(r) = "r" Then
                        ResultLook c
                    Else
                        CalcCell c
                        c.FontBold = True
                    End If
                    If Len(F(r)) > 0 Then c.Format = CStr(F(r))
                    If K(r) = "LoanNo" Then c.TextAlign = 1
                End If
            End If
        End If
    Next r

    y = 0.05 + (UBound(K) + 1) * RH + 0.04
    Set c = CreateControl(nm, acLabel, acDetail, "", "", _
                          CLng(0.05 * T1), CLng(y * T1), CLng(6# * T1), CLng(0.19 * T1))
    c.Caption = "": c.Name = "lblMore": c.ForeColor = CLR_MUTED
    c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acLabel, acDetail, "", "", _
                          CLng(0.05 * T1), CLng((y + 0.26) * T1), CLng(4.5 * T1), CLng(0.19 * T1))
    c.Caption = "Exit-Month Sensitivity (every loan exited at month N)"
    c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acListBox, acDetail, "", "", _
                          CLng(0.05 * T1), CLng((y + 0.48) * T1), CLng(9.3 * T1), CLng(1.3 * T1))
    c.Name = "lstSens"
    c.RowSourceType = "Value List"
    c.RowSource = "Month;Bid;Bid %;MOIC;12M CY"
    c.ColumnCount = 5
    c.BoundColumn = 1
    c.ColumnWidths = "700;1400;900;900;900"
    c.ColumnHeads = True
    ListLook c

    ' --- Wiring ---
    Dim mdl As Module, ln As Long, code As String
    frm!btnRecalc.OnClick = "=SaveRecalc()"
    frm!btnPayHist.OnClick = "[Event Procedure]"
    frm!btnColl.OnClick = "[Event Procedure]"
    frm!cboProject.AfterUpdate = "[Event Procedure]"
    frm!cboRelationship.AfterUpdate = "[Event Procedure]"
    frm!txtYield.AfterUpdate = "[Event Procedure]"
    frm!txtAnchor.AfterUpdate = "[Event Procedure]"
    frm.OnLoad = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("Load", "Form")
    code = "    On Error Resume Next" & vbCrLf
    code = code & "    If IsNull(Me!cboProject) Then Me!cboProject = DFirst(""ProjectName"", ""tblProjects"")" & vbCrLf
    code = code & "    Me!cboRelationship.Requery"
    mdl.InsertLines ln + 1, code
    ln = mdl.CreateEventProc("AfterUpdate", "cboProject")
    code = "    On Error Resume Next" & vbCrLf
    code = code & "    Me!cboRelationship = Null" & vbCrLf
    code = code & "    Me!cboRelationship.Requery"
    mdl.InsertLines ln + 1, code
    ln = mdl.CreateEventProc("AfterUpdate", "cboRelationship")
    mdl.InsertLines ln + 1, "    SyncRel"
    ln = mdl.CreateEventProc("AfterUpdate", "txtYield")
    mdl.InsertLines ln + 1, "    SaveSettings" & vbCrLf & "    RefreshAll"
    ln = mdl.CreateEventProc("AfterUpdate", "txtAnchor")
    mdl.InsertLines ln + 1, "    SaveSettings" & vbCrLf & "    RefreshAll"
    ln = mdl.CreateEventProc("Click", "btnPayHist")
    code = "    If Len(Nz(Me!cboRelationship, """")) = 0 Then" & vbCrLf
    code = code & "        MsgBox ""Pick a relationship first.""" & vbCrLf
    code = code & "        Exit Sub" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    DoCmd.OpenForm ""frmPayHistSheet""" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    Forms(""frmPayHistSheet"").RebuildAll"
    mdl.InsertLines ln + 1, code
    ln = mdl.CreateEventProc("Click", "btnColl")
    code = "    If Len(Nz(Me!cboRelationship, """")) = 0 Then" & vbCrLf
    code = code & "        MsgBox ""Pick a relationship first.""" & vbCrLf
    code = code & "        Exit Sub" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    DoCmd.OpenForm ""frmCollSheet""" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    Forms(""frmCollSheet"").Requery"
    mdl.InsertLines ln + 1, code

    InjectEngine mdl
    SaveAs nm, "frmBidReader"
End Sub

' The runtime engine for the vertical sheet: sweep yellow columns ->
' local table, recalc (sheet LET formulas), repaint columns + totals.
Private Sub InjectEngine(mdl As Module)
    Dim code As String
    code = ""
    code = code & "Private Function Q(v As Variant) As String" & vbCrLf
    code = code & "    Q = Replace(Nz(v, """"), ""'"", ""''"")" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Private Function MinL(a As Long, b As Long) As Long" & vbCrLf
    code = code & "    If a < b Then MinL = a Else MinL = b" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Private Function TrailSum(lnq As String, anchor As Date, n As Long) As Double" & vbCrLf
    code = code & "    Dim lo As Long, hi As Long, d As Date" & vbCrLf
    code = code & "    hi = Year(anchor) * 100 + Month(anchor)" & vbCrLf
    code = code & "    d = DateAdd(""m"", -(n - 1), anchor)" & vbCrLf
    code = code & "    lo = Year(d) * 100 + Month(d)" & vbCrLf
    code = code & "    TrailSum = Nz(DSum(""amount"", ""tblPayHistory"", ""mwloanno='"" & lnq & ""' AND pd >= "" & lo & "" AND pd <= "" & hi), 0)" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Private Function TrailX(s As Double, n As Long, sel As String, cpmt As Double, ipmt As Double) As String" & vbCrLf
    code = code & "    Select Case sel" & vbCrLf
    code = code & "        Case ""monthly"": TrailX = Format(s / n, ""$#,##0"")" & vbCrLf
    code = code & "        Case ""yearly"": TrailX = Format(s / n * 12, ""$#,##0"")" & vbCrLf
    code = code & "        Case ""% of Contractual""" & vbCrLf
    code = code & "            If cpmt = 0 Then TrailX = ""-"" Else TrailX = Format(s / (cpmt * n), ""0.0%"")" & vbCrLf
    code = code & "        Case ""% of Int PMT""" & vbCrLf
    code = code & "            If ipmt = 0 Then TrailX = ""-"" Else TrailX = Format(s / (ipmt * n), ""0.0%"")" & vbCrLf
    code = code & "        Case ""# of PMT's Made""" & vbCrLf
    code = code & "            If cpmt = 0 Then TrailX = ""-"" Else TrailX = Format(s / cpmt, ""0.00"")" & vbCrLf
    code = code & "        Case ""# of Int Pmt's Made""" & vbCrLf
    code = code & "            If ipmt = 0 Then TrailX = ""-"" Else TrailX = Format(s / ipmt, ""0.00"")" & vbCrLf
    code = code & "        Case Else: TrailX = Format(s, ""$#,##0"")" & vbCrLf
    code = code & "    End Select" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Private Function PickRate(sel As String, cr As Double, drt As Double, ur As Double) As Double" & vbCrLf
    code = code & "    Select Case sel" & vbCrLf
    code = code & "        Case ""User Enter"": PickRate = ur / 12" & vbCrLf
    code = code & "        Case ""Default"": PickRate = drt / 12" & vbCrLf
    code = code & "        Case Else: PickRate = cr / 12" & vbCrLf
    code = code & "    End Select" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Private Function PickPmt(sel As String, cp As Double, upb As Double, mr As Double, term As Long, upmt As Double, t3 As Double, t6 As Double, t12 As Double, mts As String, tpct As Double) As Double" & vbCrLf
    code = code & "    Dim base As Double" & vbCrLf
    code = code & "    Select Case sel" & vbCrLf
    code = code & "        Case ""User PMT"": PickPmt = upmt" & vbCrLf
    code = code & "        Case ""Interest PMT"": PickPmt = upb * mr" & vbCrLf
    code = code & "        Case ""Term PMT""" & vbCrLf
    code = code & "            If term > 0 Then" & vbCrLf
    code = code & "                If mr > 0 Then PickPmt = VBA.Pmt(mr, term, -upb) Else PickPmt = upb / term" & vbCrLf
    code = code & "            Else" & vbCrLf
    code = code & "                PickPmt = cp" & vbCrLf
    code = code & "            End If" & vbCrLf
    code = code & "        Case ""% of M Trail PMT""" & vbCrLf
    code = code & "            base = t12 / 12" & vbCrLf
    code = code & "            If mts = ""3M"" Then base = t3 / 3" & vbCrLf
    code = code & "            If mts = ""6M"" Then base = t6 / 6" & vbCrLf
    code = code & "            PickPmt = tpct * base" & vbCrLf
    code = code & "        Case Else: PickPmt = cp" & vbCrLf
    code = code & "    End Select" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Private Function CoreBid(mr As Double, pm As Double, upb As Double, ib As Double, startM As Long, exitM As Long, xt As String, dpo As Double, cap As Double, ytmr As Double, uex As Double, accY As Boolean, relColl As Double, mtm As Long, mta As Long, y As Double, lgl As Double, lglS As Long, hld As Double, lglE As Long, ab As String, liqM As Long, ByRef xv As Double, ByRef sAll As Double, ByRef s12 As Double) As Double" & vbCrLf
    code = code & "    Dim fvx As Double, acc As Double, addb As Double, mm As Long, lm As Long" & vbCrLf
    code = code & "    Dim t As Long, cf As Double, npv As Double, ym As Double" & vbCrLf
    code = code & "    fvx = VBA.FV(mr, exitM - startM + 1, pm, -upb) + pm" & vbCrLf
    code = code & "    acc = 0: If accY Then acc = ib" & vbCrLf
    code = code & "    addb = 0" & vbCrLf
    code = code & "    If ab = ""Yes, Initial Only"" Then addb = lgl" & vbCrLf
    code = code & "    If ab = ""Yes, Both"" And lglS > 0 Then addb = lgl + (MinL(exitM, lglE) - lglS) * hld" & vbCrLf
    code = code & "    If addb < 0 Then addb = 0" & vbCrLf
    code = code & "    Select Case xt" & vbCrLf
    code = code & "        Case ""User Enter"": xv = uex" & vbCrLf
    code = code & "        Case ""DPO"": xv = fvx * (1 - dpo)" & vbCrLf
    code = code & "        Case ""Value Cap"": xv = relColl * cap" & vbCrLf
    code = code & "        Case ""Liquidation""" & vbCrLf
    code = code & "            lm = liqM: If lm < 1 Then lm = exitM" & vbCrLf
    code = code & "            xv = VBA.FV(mr, lm, 0, -upb) + acc" & vbCrLf
    code = code & "        Case ""YTM Sell Solve""" & vbCrLf
    code = code & "            mm = mtm: If mta < mm Then mm = mta" & vbCrLf
    code = code & "            If mm > exitM Then" & vbCrLf
    code = code & "                xv = -VBA.PV(ytmr / 12, mm - exitM, pm, VBA.FV(mr, mm, pm, -upb))" & vbCrLf
    code = code & "            Else" & vbCrLf
    code = code & "                xv = fvx + acc" & vbCrLf
    code = code & "            End If" & vbCrLf
    code = code & "        Case Else: xv = fvx + acc" & vbCrLf
    code = code & "    End Select" & vbCrLf
    code = code & "    xv = xv + addb" & vbCrLf
    code = code & "    ym = y / 12" & vbCrLf
    code = code & "    npv = 0: sAll = 0: s12 = 0" & vbCrLf
    code = code & "    For t = 1 To exitM" & vbCrLf
    code = code & "        cf = 0" & vbCrLf
    code = code & "        If t >= startM And t < exitM Then cf = pm" & vbCrLf
    code = code & "        If lglS > 0 And t = lglS Then cf = cf - lgl" & vbCrLf
    code = code & "        If lglS > 0 And hld <> 0 Then" & vbCrLf
    code = code & "            If t >= lglS And t <= MinL(lglE, exitM - 1) Then cf = cf - hld" & vbCrLf
    code = code & "        End If" & vbCrLf
    code = code & "        If t = exitM Then cf = cf + xv" & vbCrLf
    code = code & "        npv = npv + cf / ((1 + ym) ^ t)" & vbCrLf
    code = code & "        sAll = sAll + cf" & vbCrLf
    code = code & "        If t <= 12 Then s12 = s12 + cf" & vbCrLf
    code = code & "    Next t" & vbCrLf
    code = code & "    CoreBid = npv" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Private Sub SaveSettings()" & vbCrLf
    code = code & "    Dim esc As String" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    If Len(Nz(Me!cboRelationship, """")) = 0 Then Exit Sub" & vbCrLf
    code = code & "    esc = Q(Me!cboRelationship)" & vbCrLf
    code = code & "    CurrentDb.Execute ""DELETE FROM xtblBidReaderSet WHERE RelatedLoans='"" & esc & ""'""" & vbCrLf
    code = code & "    CurrentDb.Execute ""INSERT INTO xtblBidReaderSet (RelatedLoans, YieldTarget, AnchorDt) VALUES ('"" & esc & ""', "" & Str(Nz(Me!txtYield, 0.15)) & "", #"" & Format(Nz(Me!txtAnchor, Date), ""mm/dd/yyyy"") & ""#)""" & vbCrLf
    code = code & "End Sub" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Public Sub SyncRel()" & vbCrLf
    code = code & "    Dim esc As String" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    If Len(Nz(Me!cboRelationship, """")) = 0 Then Exit Sub" & vbCrLf
    code = code & "    esc = Q(Me!cboRelationship)" & vbCrLf
    code = code & "    CurrentDb.Execute ""INSERT INTO xtblBidReader (LoanNo, RelatedLoans, PmtSel, RateSel, ExitType, ExitMonth, StartMonth, DPOPct, ValCapPct, YTMTgt, AddAccrued, AddBack, TrailPct, LegalStartM, LegalEndM, MTrailSel, LiqAcrM) SELECT l.MWLoanNo, l.RelatedLoans, 'Current PMT', 'Contractual', 'PIF', 24, 1, 0.25, 1, 0.15, 'No', 'No', 1, 0, 0, '12M', 0 FROM tblLoan AS l WHERE l.RelatedLoans='"" & esc & ""' AND l.MWLoanNo NOT IN (SELECT LoanNo FROM xtblBidReader)""" & vbCrLf
    code = code & "    Me!txtYield = Nz(DLookup(""YieldTarget"", ""xtblBidReaderSet"", ""RelatedLoans='"" & esc & ""'""), 0.15)" & vbCrLf
    code = code & "    Me!txtAnchor = Nz(DLookup(""AnchorDt"", ""xtblBidReaderSet"", ""RelatedLoans='"" & esc & ""'""), Date)" & vbCrLf
    code = code & "    RefreshAll" & vbCrLf
    code = code & "End Sub" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Public Sub RefreshAll()" & vbCrLf
    code = code & "    RecalcAll" & vbCrLf
    code = code & "    PaintColumns" & vbCrLf
    code = code & "End Sub" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Public Function PaintOnly() As Variant" & vbCrLf
    code = code & "    PaintColumns" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Public Function SaveRecalc() As Variant" & vbCrLf
    code = code & "    SweepColumns" & vbCrLf
    code = code & "    RecalcAll" & vbCrLf
    code = code & "    PaintColumns" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Public Sub RecalcAll()" & vbCrLf
    code = code & "    Dim db As DAO.Database, rs As DAO.Recordset" & vbCrLf
    code = code & "    Dim esc As String, y As Double, anchor As Date, relColl As Double, cfStart As Date" & vbCrLf
    code = code & "    Dim lq As String, upb As Double, ib As Double, cr As Double, drt As Double, cp As Double" & vbCrLf
    code = code & "    Dim mat As Variant, mr As Double, pm As Double, mtm As Long, mta As Long" & vbCrLf
    code = code & "    Dim xv As Double, sAll As Double, s12 As Double, npv As Double" & vbCrLf
    code = code & "    Dim sy As Variant, sm As Variant, pj As String" & vbCrLf
    code = code & "    Dim m As Long, tb As Double, tu As Double, ta As Double, t12s As Double, s As String" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    If Len(Nz(Me!cboRelationship, """")) = 0 Then Exit Sub" & vbCrLf
    code = code & "    esc = Q(Me!cboRelationship)" & vbCrLf
    code = code & "    Set db = CurrentDb" & vbCrLf
    code = code & "    y = Nz(Me!txtYield, 0.15)" & vbCrLf
    code = code & "    anchor = Nz(Me!txtAnchor, Date)" & vbCrLf
    code = code & "    relColl = Nz(DSum(""CurrentAppraisedValue"", ""CollateralInfo"", ""RelatedLoans='"" & esc & ""'""), 0)" & vbCrLf
    code = code & "    cfStart = anchor" & vbCrLf
    code = code & "    pj = Q(Me!cboProject)" & vbCrLf
    code = code & "    sy = DLookup(""cfstartyear"", ""xTblCFparameters"", ""ProjectName='"" & pj & ""'"")" & vbCrLf
    code = code & "    sm = DLookup(""cfstartmonth"", ""xTblCFparameters"", ""ProjectName='"" & pj & ""'"")" & vbCrLf
    code = code & "    If IsNumeric(sy) And IsNumeric(sm) Then cfStart = DateSerial(CInt(sy), CInt(sm), 1)" & vbCrLf
    code = code & "    Set rs = db.OpenRecordset(""SELECT * FROM xtblBidReader WHERE RelatedLoans='"" & esc & ""'"", dbOpenDynaset)" & vbCrLf
    code = code & "    Do While Not rs.EOF" & vbCrLf
    code = code & "        lq = Q(rs!LoanNo)" & vbCrLf
    code = code & "        upb = Nz(DLookup(""PrincipalBalance"", ""tblLoan"", ""MWLoanNo='"" & lq & ""'""), 0)" & vbCrLf
    code = code & "        ib = Nz(DLookup(""InterestBalance"", ""tblLoan"", ""MWLoanNo='"" & lq & ""'""), 0)" & vbCrLf
    code = code & "        cr = Nz(DLookup(""Rate"", ""tblLoan"", ""MWLoanNo='"" & lq & ""'""), 0)" & vbCrLf
    code = code & "        drt = Nz(DLookup(""DefaultRate"", ""tblLoan"", ""MWLoanNo='"" & lq & ""'""), 0)" & vbCrLf
    code = code & "        cp = Nz(DLookup(""RepayAmt"", ""tblLoan"", ""MWLoanNo='"" & lq & ""'""), 0)" & vbCrLf
    code = code & "        mat = DLookup(""CurrentMaturityDate"", ""tblLoan"", ""MWLoanNo='"" & lq & ""'"")" & vbCrLf
    code = code & "        mr = PickRate(Nz(rs!RateSel, ""Contractual""), cr, drt, Nz(rs!UserRate, 0))" & vbCrLf
    code = code & "        rs.Edit" & vbCrLf
    code = code & "        rs!UPB = upb: rs!IntBal = ib: rs!CRate = cr: rs!DRate = drt: rs!CPmt = cp" & vbCrLf
    code = code & "        If Not IsNull(mat) Then rs!MatDt = mat" & vbCrLf
    code = code & "        rs!T3 = TrailSum(lq, anchor, 3)" & vbCrLf
    code = code & "        rs!T6 = TrailSum(lq, anchor, 6)" & vbCrLf
    code = code & "        rs!T12 = TrailSum(lq, anchor, 12)" & vbCrLf
    code = code & "        pm = PickPmt(Nz(rs!PmtSel, ""Current PMT""), cp, upb, mr, Nz(rs!TermMonths, 0), Nz(rs!UserPmt, 0), Nz(rs!T3, 0), Nz(rs!T6, 0), Nz(rs!T12, 0), Nz(rs!MTrailSel, ""12M""), Nz(rs!TrailPct, 1))" & vbCrLf
    code = code & "        mtm = 1" & vbCrLf
    code = code & "        If Not IsNull(mat) Then mtm = DateDiff(""m"", cfStart, mat)" & vbCrLf
    code = code & "        If mtm < 1 Then mtm = 1" & vbCrLf
    code = code & "        mta = 360" & vbCrLf
    code = code & "        Err.Clear" & vbCrLf
    code = code & "        If mr > 0 And pm > upb * mr Then mta = Int(VBA.NPer(mr, -pm, upb))" & vbCrLf
    code = code & "        If Err.Number <> 0 Then mta = 360: Err.Clear" & vbCrLf
    code = code & "        If mta < 1 Then mta = 1" & vbCrLf
    code = code & "        If mta > 360 Then mta = 360" & vbCrLf
    code = code & "        rs!MTM = mtm: rs!MTA = mta" & vbCrLf
    code = code & "        npv = CoreBid(mr, pm, upb, ib, Nz(rs!StartMonth, 1), Nz(rs!ExitMonth, 24), Nz(rs!ExitType, ""PIF""), Nz(rs!DPOPct, 0), Nz(rs!ValCapPct, 1), Nz(rs!YTMTgt, 0.15), Nz(rs!UserExit, 0), (Nz(rs!AddAccrued, ""No"") = ""Yes""), relColl, mtm, mta, y, Nz(rs!LegalInit, 0), Nz(rs!LegalStartM, 0), Nz(rs!HoldCost, 0), Nz(rs!LegalEndM, 0), Nz(rs!AddBack, ""No""), Nz(rs!LiqAcrM, 0), xv, sAll, s12)" & vbCrLf
    code = code & "        rs!PmtPull = pm: rs!ExitVal = xv: rs!BidNPV = npv" & vbCrLf
    code = code & "        rs!BidPct = 0: If upb <> 0 Then rs!BidPct = npv / upb" & vbCrLf
    code = code & "        rs!MOIC = 0: rs!CY12 = 0" & vbCrLf
    code = code & "        If npv <> 0 Then rs!MOIC = sAll / npv: rs!CY12 = s12 / npv" & vbCrLf
    code = code & "        rs!ImpDPO = 0" & vbCrLf
    code = code & "        If VBA.FV(mr, Nz(rs!ExitMonth, 24) - Nz(rs!StartMonth, 1) + 1, pm, -upb) + pm <> 0 Then rs!ImpDPO = 1 - (xv / (VBA.FV(mr, Nz(rs!ExitMonth, 24) - Nz(rs!StartMonth, 1) + 1, pm, -upb) + pm))" & vbCrLf
    code = code & "        rs.Update" & vbCrLf
    code = code & "        rs.MoveNext" & vbCrLf
    code = code & "    Loop" & vbCrLf
    code = code & "    rs.Close" & vbCrLf
    code = code & "    s = ""Month;Bid;Bid %;MOIC;12M CY""" & vbCrLf
    code = code & "    For m = 6 To 60 Step 6" & vbCrLf
    code = code & "        tb = 0: tu = 0: ta = 0: t12s = 0" & vbCrLf
    code = code & "        Set rs = db.OpenRecordset(""SELECT * FROM xtblBidReader WHERE RelatedLoans='"" & esc & ""'"", dbOpenSnapshot)" & vbCrLf
    code = code & "        Do While Not rs.EOF" & vbCrLf
    code = code & "            mr = PickRate(Nz(rs!RateSel, ""Contractual""), Nz(rs!CRate, 0), Nz(rs!DRate, 0), Nz(rs!UserRate, 0))" & vbCrLf
    code = code & "            pm = PickPmt(Nz(rs!PmtSel, ""Current PMT""), Nz(rs!CPmt, 0), Nz(rs!UPB, 0), mr, Nz(rs!TermMonths, 0), Nz(rs!UserPmt, 0), Nz(rs!T3, 0), Nz(rs!T6, 0), Nz(rs!T12, 0), Nz(rs!MTrailSel, ""12M""), Nz(rs!TrailPct, 1))" & vbCrLf
    code = code & "            npv = CoreBid(mr, pm, Nz(rs!UPB, 0), Nz(rs!IntBal, 0), Nz(rs!StartMonth, 1), m, Nz(rs!ExitType, ""PIF""), Nz(rs!DPOPct, 0), Nz(rs!ValCapPct, 1), Nz(rs!YTMTgt, 0.15), Nz(rs!UserExit, 0), (Nz(rs!AddAccrued, ""No"") = ""Yes""), relColl, Nz(rs!MTM, 1), Nz(rs!MTA, 360), y, Nz(rs!LegalInit, 0), Nz(rs!LegalStartM, 0), Nz(rs!HoldCost, 0), Nz(rs!LegalEndM, 0), Nz(rs!AddBack, ""No""), Nz(rs!LiqAcrM, 0), xv, sAll, s12)" & vbCrLf
    code = code & "            tb = tb + npv: tu = tu + Nz(rs!UPB, 0): ta = ta + sAll: t12s = t12s + s12" & vbCrLf
    code = code & "            rs.MoveNext" & vbCrLf
    code = code & "        Loop" & vbCrLf
    code = code & "        rs.Close" & vbCrLf
    code = code & "        s = s & "";"" & m & "";"" & Chr(34) & Format(tb, ""$#,##0"") & Chr(34)" & vbCrLf
    code = code & "        If tu <> 0 Then s = s & "";"" & Format(tb / tu, ""0.0%"") Else s = s & "";-""" & vbCrLf
    code = code & "        If tb <> 0 Then s = s & "";"" & Format(ta / tb, ""0.00"") & "";"" & Format(t12s / tb, ""0.0%"") Else s = s & "";-;-""" & vbCrLf
    code = code & "    Next m" & vbCrLf
    code = code & "    Me!lstSens.RowSource = s" & vbCrLf
    code = code & "End Sub" & vbCrLf
    mdl.InsertLines mdl.CountOfLines + 1, code

    code = ""
    code = code & "Public Sub PaintColumns()" & vbCrLf
    code = code & "    Dim db As DAO.Database, rs As DAO.Recordset" & vbCrLf
    code = code & "    Dim esc As String, i As Long, n As Long, relColl As Double, tsel As String" & vbCrLf
    code = code & "    Dim mr As Double, ip As Double, base As Double" & vbCrLf
    code = code & "    Dim kk As Variant, k As Variant" & vbCrLf
    code = code & "    Dim tUPB As Double, tInt As Double, tPmt As Double, tRate As Double" & vbCrLf
    code = code & "    Dim tT3 As Double, tT6 As Double, tT12 As Double, tXV As Double, tBid As Double" & vbCrLf
    code = code & "    Dim tSAll As Double, tS12 As Double" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    If Len(Nz(Me!cboRelationship, """")) = 0 Then Exit Sub" & vbCrLf
    code = code & "    esc = Q(Me!cboRelationship)" & vbCrLf
    code = code & "    Set db = CurrentDb" & vbCrLf
    code = code & "    tsel = Nz(Me!cTrailDisp, ""Actual"")" & vbCrLf
    code = code & "    relColl = Nz(DSum(""CurrentAppraisedValue"", ""CollateralInfo"", ""RelatedLoans='"" & esc & ""'""), 0)" & vbCrLf
    code = code & "    kk = Array(""LoanNo"", ""UPB"", ""IntBal"", ""MAI"", ""CRate"", ""DRate"", ""MatDt"", ""CPmt"", ""MTM"", ""MTA"", ""RelColl"", ""T3"", ""T6"", ""T12"", ""PmtSel"", ""PmtPull"", ""IntPmt"", ""UserPmt"", ""TermPmt"", ""TermMonths"", ""PctTrail"", ""MTrailSel"", ""TrailPct"", ""RateSel"", ""RatePull"", ""UserRate"", ""LegalInit"", ""LegalStartM"", ""HoldCost"", ""LegalEndM"", ""AddBack"", ""ExitType"", ""ExitVal"", ""DPOPct"", ""UserExit"", ""ValCapPct"", ""YTMTgt"", ""AddAccrued"", ""LiqAcrM"", ""ImpDPO"", ""StartMonth"", ""ExitMonth"", ""BidPct"", ""BidNPV"", ""CY12"", ""MOIC"", ""BidMwVx"", ""F12P12"")" & vbCrLf
    code = code & "    For i = 1 To 8" & vbCrLf
    code = code & "        For Each k In kk" & vbCrLf
    code = code & "            Me(""c"" & i & ""_"" & k) = Null" & vbCrLf
    code = code & "        Next k" & vbCrLf
    code = code & "    Next i" & vbCrLf
    code = code & "    For Each k In kk" & vbCrLf
    code = code & "        Me(""cT_"" & k) = Null" & vbCrLf
    code = code & "    Next k" & vbCrLf
    code = code & "    n = 0: i = 0" & vbCrLf
    code = code & "    Set rs = db.OpenRecordset(""SELECT * FROM xtblBidReader WHERE RelatedLoans='"" & esc & ""' ORDER BY UPB DESC, LoanNo"", dbOpenSnapshot)" & vbCrLf
    code = code & "    Do While Not rs.EOF" & vbCrLf
    code = code & "        n = n + 1" & vbCrLf
    code = code & "        tUPB = tUPB + Nz(rs!UPB, 0): tInt = tInt + Nz(rs!IntBal, 0): tPmt = tPmt + Nz(rs!CPmt, 0)" & vbCrLf
    code = code & "        tRate = tRate + Nz(rs!CRate, 0) * Nz(rs!UPB, 0)" & vbCrLf
    code = code & "        tT3 = tT3 + Nz(rs!T3, 0): tT6 = tT6 + Nz(rs!T6, 0): tT12 = tT12 + Nz(rs!T12, 0)" & vbCrLf
    code = code & "        tXV = tXV + Nz(rs!ExitVal, 0): tBid = tBid + Nz(rs!BidNPV, 0)" & vbCrLf
    code = code & "        tSAll = tSAll + Nz(rs!MOIC, 0) * Nz(rs!BidNPV, 0): tS12 = tS12 + Nz(rs!CY12, 0) * Nz(rs!BidNPV, 0)" & vbCrLf
    code = code & "        If n <= 8 Then" & vbCrLf
    code = code & "            i = n" & vbCrLf
    code = code & "            mr = PickRate(Nz(rs!RateSel, ""Contractual""), Nz(rs!CRate, 0), Nz(rs!DRate, 0), Nz(rs!UserRate, 0))" & vbCrLf
    code = code & "            ip = Nz(rs!UPB, 0) * Nz(rs!CRate, 0) / 12" & vbCrLf
    code = code & "            Me(""c"" & i & ""_LoanNo"") = rs!LoanNo" & vbCrLf
    code = code & "            Me(""c"" & i & ""_UPB"") = rs!UPB" & vbCrLf
    code = code & "            Me(""c"" & i & ""_IntBal"") = rs!IntBal" & vbCrLf
    code = code & "            If ip <> 0 Then Me(""c"" & i & ""_MAI"") = Nz(rs!IntBal, 0) / ip" & vbCrLf
    code = code & "            Me(""c"" & i & ""_CRate"") = rs!CRate" & vbCrLf
    code = code & "            Me(""c"" & i & ""_DRate"") = rs!DRate" & vbCrLf
    code = code & "            Me(""c"" & i & ""_MatDt"") = rs!MatDt" & vbCrLf
    code = code & "            Me(""c"" & i & ""_CPmt"") = rs!CPmt" & vbCrLf
    code = code & "            Me(""c"" & i & ""_MTM"") = rs!MTM" & vbCrLf
    code = code & "            Me(""c"" & i & ""_MTA"") = rs!MTA" & vbCrLf
    code = code & "            Me(""c"" & i & ""_RelColl"") = relColl" & vbCrLf
    code = code & "            Me(""c"" & i & ""_T3"") = TrailX(Nz(rs!T3, 0), 3, tsel, Nz(rs!CPmt, 0), ip)" & vbCrLf
    code = code & "            Me(""c"" & i & ""_T6"") = TrailX(Nz(rs!T6, 0), 6, tsel, Nz(rs!CPmt, 0), ip)" & vbCrLf
    code = code & "            Me(""c"" & i & ""_T12"") = TrailX(Nz(rs!T12, 0), 12, tsel, Nz(rs!CPmt, 0), ip)" & vbCrLf
    code = code & "            Me(""c"" & i & ""_PmtSel"") = Nz(rs!PmtSel, ""Current PMT"")" & vbCrLf
    code = code & "            Me(""c"" & i & ""_PmtPull"") = rs!PmtPull" & vbCrLf
    code = code & "            Me(""c"" & i & ""_IntPmt"") = ip" & vbCrLf
    code = code & "            Me(""c"" & i & ""_UserPmt"") = rs!UserPmt" & vbCrLf
    code = code & "            If Nz(rs!TermMonths, 0) > 0 Then" & vbCrLf
    code = code & "                If mr > 0 Then" & vbCrLf
    code = code & "                    Me(""c"" & i & ""_TermPmt"") = VBA.Pmt(mr, rs!TermMonths, -Nz(rs!UPB, 0))" & vbCrLf
    code = code & "                Else" & vbCrLf
    code = code & "                    Me(""c"" & i & ""_TermPmt"") = Nz(rs!UPB, 0) / rs!TermMonths" & vbCrLf
    code = code & "                End If" & vbCrLf
    code = code & "            End If" & vbCrLf
    code = code & "            Me(""c"" & i & ""_TermMonths"") = rs!TermMonths" & vbCrLf
    code = code & "            base = Nz(rs!T12, 0) / 12" & vbCrLf
    code = code & "            If Nz(rs!MTrailSel, ""12M"") = ""3M"" Then base = Nz(rs!T3, 0) / 3" & vbCrLf
    code = code & "            If Nz(rs!MTrailSel, ""12M"") = ""6M"" Then base = Nz(rs!T6, 0) / 6" & vbCrLf
    code = code & "            Me(""c"" & i & ""_PctTrail"") = Nz(rs!TrailPct, 1) * base" & vbCrLf
    code = code & "            Me(""c"" & i & ""_MTrailSel"") = Nz(rs!MTrailSel, ""12M"")" & vbCrLf
    code = code & "            Me(""c"" & i & ""_TrailPct"") = rs!TrailPct" & vbCrLf
    code = code & "            Me(""c"" & i & ""_RateSel"") = Nz(rs!RateSel, ""Contractual"")" & vbCrLf
    code = code & "            Me(""c"" & i & ""_RatePull"") = mr * 12" & vbCrLf
    code = code & "            Me(""c"" & i & ""_UserRate"") = rs!UserRate" & vbCrLf
    code = code & "            Me(""c"" & i & ""_LegalInit"") = rs!LegalInit" & vbCrLf
    code = code & "            Me(""c"" & i & ""_LegalStartM"") = rs!LegalStartM" & vbCrLf
    code = code & "            Me(""c"" & i & ""_HoldCost"") = rs!HoldCost" & vbCrLf
    code = code & "            Me(""c"" & i & ""_LegalEndM"") = rs!LegalEndM" & vbCrLf
    code = code & "            Me(""c"" & i & ""_AddBack"") = Nz(rs!AddBack, ""No"")" & vbCrLf
    code = code & "            Me(""c"" & i & ""_ExitType"") = Nz(rs!ExitType, ""PIF"")" & vbCrLf
    code = code & "            Me(""c"" & i & ""_ExitVal"") = rs!ExitVal" & vbCrLf
    code = code & "            Me(""c"" & i & ""_DPOPct"") = rs!DPOPct" & vbCrLf
    code = code & "            Me(""c"" & i & ""_UserExit"") = rs!UserExit" & vbCrLf
    code = code & "            Me(""c"" & i & ""_ValCapPct"") = rs!ValCapPct" & vbCrLf
    code = code & "            Me(""c"" & i & ""_YTMTgt"") = rs!YTMTgt" & vbCrLf
    code = code & "            Me(""c"" & i & ""_AddAccrued"") = Nz(rs!AddAccrued, ""No"")" & vbCrLf
    code = code & "            Me(""c"" & i & ""_LiqAcrM"") = rs!LiqAcrM" & vbCrLf
    code = code & "            Me(""c"" & i & ""_ImpDPO"") = rs!ImpDPO" & vbCrLf
    code = code & "            Me(""c"" & i & ""_StartMonth"") = rs!StartMonth" & vbCrLf
    code = code & "            Me(""c"" & i & ""_ExitMonth"") = rs!ExitMonth" & vbCrLf
    code = code & "            Me(""c"" & i & ""_BidPct"") = rs!BidPct" & vbCrLf
    code = code & "            Me(""c"" & i & ""_BidNPV"") = rs!BidNPV" & vbCrLf
    code = code & "            Me(""c"" & i & ""_CY12"") = rs!CY12" & vbCrLf
    code = code & "            Me(""c"" & i & ""_MOIC"") = rs!MOIC" & vbCrLf
    code = code & "            If relColl <> 0 Then Me(""c"" & i & ""_BidMwVx"") = Nz(rs!BidNPV, 0) / relColl" & vbCrLf
    code = code & "            If Nz(rs!T12, 0) <> 0 Then Me(""c"" & i & ""_F12P12"") = (Nz(rs!CY12, 0) * Nz(rs!BidNPV, 0)) / Nz(rs!T12, 0)" & vbCrLf
    code = code & "        End If" & vbCrLf
    code = code & "        rs.MoveNext" & vbCrLf
    code = code & "    Loop" & vbCrLf
    code = code & "    rs.Close" & vbCrLf
    code = code & "    Me(""cT_LoanNo"") = ""Relationship""" & vbCrLf
    code = code & "    Me(""cT_UPB"") = tUPB" & vbCrLf
    code = code & "    Me(""cT_IntBal"") = tInt" & vbCrLf
    code = code & "    Me(""cT_CPmt"") = tPmt" & vbCrLf
    code = code & "    If tUPB <> 0 Then Me(""cT_CRate"") = tRate / tUPB" & vbCrLf
    code = code & "    Me(""cT_RelColl"") = relColl" & vbCrLf
    code = code & "    Me(""cT_T3"") = TrailX(tT3, 3, tsel, tPmt, tRate / 12)" & vbCrLf
    code = code & "    Me(""cT_T6"") = TrailX(tT6, 6, tsel, tPmt, tRate / 12)" & vbCrLf
    code = code & "    Me(""cT_T12"") = TrailX(tT12, 12, tsel, tPmt, tRate / 12)" & vbCrLf
    code = code & "    Me(""cT_ExitVal"") = tXV" & vbCrLf
    code = code & "    Me(""cT_BidNPV"") = tBid" & vbCrLf
    code = code & "    If tUPB <> 0 Then Me(""cT_BidPct"") = tBid / tUPB" & vbCrLf
    code = code & "    If tBid <> 0 Then Me(""cT_MOIC"") = tSAll / tBid" & vbCrLf
    code = code & "    If tBid <> 0 Then Me(""cT_CY12"") = tS12 / tBid" & vbCrLf
    code = code & "    If relColl <> 0 Then Me(""cT_BidMwVx"") = tBid / relColl" & vbCrLf
    code = code & "    If tT12 <> 0 Then Me(""cT_F12P12"") = tS12 / tT12" & vbCrLf
    code = code & "    Me!lblMore.Caption = """"" & vbCrLf
    code = code & "    If n > 8 Then Me!lblMore.Caption = ""Showing the 8 largest loans of "" & n & "" - the Relationship column totals all of them.""" & vbCrLf
    code = code & "End Sub" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Public Sub SweepColumns()" & vbCrLf
    code = code & "    Dim db As DAO.Database, rs As DAO.Recordset, i As Long" & vbCrLf
    code = code & "    Dim esc As String" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    If Len(Nz(Me!cboRelationship, """")) = 0 Then Exit Sub" & vbCrLf
    code = code & "    esc = Q(Me!cboRelationship)" & vbCrLf
    code = code & "    Set db = CurrentDb" & vbCrLf
    code = code & "    Set rs = db.OpenRecordset(""SELECT * FROM xtblBidReader WHERE RelatedLoans='"" & esc & ""' ORDER BY UPB DESC, LoanNo"", dbOpenDynaset)" & vbCrLf
    code = code & "    i = 0" & vbCrLf
    code = code & "    Do While Not rs.EOF" & vbCrLf
    code = code & "        i = i + 1" & vbCrLf
    code = code & "        If i > 8 Then Exit Do" & vbCrLf
    code = code & "        If Nz(Me(""c"" & i & ""_LoanNo""), """") = Nz(rs!LoanNo, """") Then" & vbCrLf
    code = code & "            rs.Edit" & vbCrLf
    code = code & "            rs!PmtSel = Nz(Me(""c"" & i & ""_PmtSel""), ""Current PMT"")" & vbCrLf
    code = code & "            rs!UserPmt = Nz(Me(""c"" & i & ""_UserPmt""), 0)" & vbCrLf
    code = code & "            rs!TermMonths = Nz(Me(""c"" & i & ""_TermMonths""), 0)" & vbCrLf
    code = code & "            rs!MTrailSel = Nz(Me(""c"" & i & ""_MTrailSel""), ""12M"")" & vbCrLf
    code = code & "            rs!TrailPct = Nz(Me(""c"" & i & ""_TrailPct""), 1)" & vbCrLf
    code = code & "            rs!RateSel = Nz(Me(""c"" & i & ""_RateSel""), ""Contractual"")" & vbCrLf
    code = code & "            rs!UserRate = Nz(Me(""c"" & i & ""_UserRate""), 0)" & vbCrLf
    code = code & "            rs!LegalInit = Nz(Me(""c"" & i & ""_LegalInit""), 0)" & vbCrLf
    code = code & "            rs!LegalStartM = Nz(Me(""c"" & i & ""_LegalStartM""), 0)" & vbCrLf
    code = code & "            rs!HoldCost = Nz(Me(""c"" & i & ""_HoldCost""), 0)" & vbCrLf
    code = code & "            rs!LegalEndM = Nz(Me(""c"" & i & ""_LegalEndM""), 0)" & vbCrLf
    code = code & "            rs!AddBack = Nz(Me(""c"" & i & ""_AddBack""), ""No"")" & vbCrLf
    code = code & "            rs!ExitType = Nz(Me(""c"" & i & ""_ExitType""), ""PIF"")" & vbCrLf
    code = code & "            rs!DPOPct = Nz(Me(""c"" & i & ""_DPOPct""), 0)" & vbCrLf
    code = code & "            rs!UserExit = Nz(Me(""c"" & i & ""_UserExit""), 0)" & vbCrLf
    code = code & "            rs!ValCapPct = Nz(Me(""c"" & i & ""_ValCapPct""), 1)" & vbCrLf
    code = code & "            rs!YTMTgt = Nz(Me(""c"" & i & ""_YTMTgt""), 0.15)" & vbCrLf
    code = code & "            rs!AddAccrued = Nz(Me(""c"" & i & ""_AddAccrued""), ""No"")" & vbCrLf
    code = code & "            rs!LiqAcrM = Nz(Me(""c"" & i & ""_LiqAcrM""), 0)" & vbCrLf
    code = code & "            rs!StartMonth = Nz(Me(""c"" & i & ""_StartMonth""), 1)" & vbCrLf
    code = code & "            rs!ExitMonth = Nz(Me(""c"" & i & ""_ExitMonth""), 24)" & vbCrLf
    code = code & "            rs.Update" & vbCrLf
    code = code & "        End If" & vbCrLf
    code = code & "        rs.MoveNext" & vbCrLf
    code = code & "    Loop" & vbCrLf
    code = code & "    rs.Close" & vbCrLf
    code = code & "End Sub" & vbCrLf
    mdl.InsertLines mdl.CountOfLines + 1, code
End Sub

' ================= HELPERS ===========================================
' Sheet-styled base form: white body, banded rows on continuous views
Private Function NewDarkForm(recordSource As String, viewMode As Integer) As Form
    Dim frm As Form
    Set frm = CreateForm
    frm.RecordSource = recordSource
    frm.DefaultView = viewMode
    frm.Section(acDetail).BackColor = CLR_MAIN
    frm.RecordSelectors = False
    frm.NavigationButtons = (viewMode = 0)
    frm.DividingLines = False
    On Error Resume Next
    frm.ScrollBars = 3
    If viewMode = 1 Then frm.Section(acDetail).AlternateBackColor = CLR_ALT
    On Error GoTo 0
    Set NewDarkForm = frm
End Function

Private Sub EnsureHeader(frm As Form)
    On Error Resume Next
    If Not frm.Section(acHeader).Visible Then frm.Section(acHeader).Visible = True
    If Err.Number <> 0 Then
        Err.Clear
        DoCmd.RunCommand acCmdFormHdrFtr
    End If
    frm.Section(acFooter).Height = 0
    Err.Clear
    On Error GoTo 0
End Sub

' Value lists for the yellow selector rows (sheet vocabulary verbatim)
Private Function ComboList(k As String) As String
    Select Case k
        Case "PmtSel"
            ComboList = """Current PMT"";""User PMT"";""Interest PMT"";""Term PMT"";""% of M Trail PMT"""
        Case "MTrailSel"
            ComboList = """3M"";""6M"";""12M"""
        Case "RateSel"
            ComboList = """Contractual"";""User Enter"";""Default"""
        Case "AddBack"
            ComboList = """No"";""Yes, Initial Only"";""Yes, Both"""
        Case "ExitType"
            ComboList = """PIF"";""User Enter"";""DPO"";""YTM Sell Solve"";""Value Cap"";""Liquidation"""
        Case "AddAccrued"
            ComboList = """Yes"";""No"""
        Case "TrailDisp"
            ComboList = """Actual"";""monthly"";""yearly"";""% of Contractual"";""% of Int PMT"";""# of PMT's Made"";""# of Int Pmt's Made"""
        Case Else
            ComboList = """"""
    End Select
End Function

' Editable input = YELLOW cell (the workbook's editability convention)
Private Sub StyleInput(c As Control)
    c.BackStyle = 1
    c.BackColor = CLR_INPUT
    c.ForeColor = CLR_TEXT
    c.BorderStyle = 1
    c.BorderColor = CLR_INBORDER
    c.SpecialEffect = 0
    c.FontName = FONT
    c.FontSize = 9
End Sub

Private Sub StyleCell(c As Control)
    c.BackStyle = 0
    c.BorderStyle = 0
    c.ForeColor = CLR_TEXT
    c.FontName = FONT
    c.FontSize = 8
    c.Locked = True
    c.TabStop = False
End Sub

' Derived in-grid cell on the gray (data) band: bordered white like
' its neighbors so the sheet gridline stays unbroken
Private Sub CalcCell(c As Control)
    StyleInput c
    c.FontSize = 8
    c.Locked = True
    c.TabStop = False
    c.BackColor = CLR_READONLY
    c.ForeColor = CLR_TEXT
    c.TextAlign = 3
End Sub

' Computed result = Excel green fill with dark-green bold text
Private Sub ResultLook(c As Control)
    c.BackStyle = 1
    c.BackColor = CLR_RESBG
    c.ForeColor = CLR_GREEN
    c.BorderStyle = 1
    c.BorderColor = CLR_INBORDER
    c.SpecialEffect = 0
    c.FontName = FONT
    c.FontSize = 8
    c.FontBold = True
    c.Locked = True
    c.TabStop = False
End Sub

Private Sub ComboLook(c As Control)
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.SpecialEffect = 0: c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
End Sub

Private Sub ListLook(c As Control)
    On Error Resume Next
    c.BackColor = CLR_MAIN: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
End Sub

Private Sub DarkBtn(c As Control)
    On Error Resume Next
    c.UseTheme = False: c.BackColor = CLR_BTN: c.ForeColor = CLR_TEXT
    c.BorderColor = CLR_INBORDER: c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
End Sub

' Header label at an x/width/y with optional right alignment - bold
' black on the band, like an Excel header row
Private Sub HeadLbl(frm As Form, cap As String, xIn As Single, wIn As Single, _
                    yIn As Single, rightAlign As Boolean)
    Dim c As Control
    Set c = CreateControl(frm.Name, acLabel, acHeader, "", "", _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(0.19 * T1))
    c.Caption = cap: c.ForeColor = CLR_TEXTSEC: c.FontName = FONT: c.FontSize = 7
    c.FontBold = True
    If rightAlign Then c.TextAlign = 3
End Sub

' Colored band behind a run of header labels (Excel group header)
Private Sub HeadBand(frm As Form, xIn As Single, wIn As Single, _
                     yIn As Single, clr As Long)
    Dim c As Control
    Set c = CreateControl(frm.Name, acRectangle, acHeader, "", "", _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(0.2 * T1))
    c.BackStyle = 1: c.BackColor = clr: c.BorderStyle = 1
    c.BorderColor = CLR_INBORDER: c.SpecialEffect = 0
End Sub

' Detail cell: kind 0 = editable parameter (yellow), 1 = locked
' snapshot (white sheet cell), 2 = computed result (green fill)
Private Sub RCell(frm As Form, src As String, xIn As Single, yIn As Single, _
                  wIn As Single, kind As Integer, fmt As String)
    Dim c As Control
    Set c = CreateControl(frm.Name, acTextBox, acDetail, "", src, _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(0.24 * T1))
    c.Name = "txt" & src
    c.TextAlign = 3
    If Len(fmt) > 0 Then c.Format = fmt
    Select Case kind
        Case 1
            StyleInput c
            c.FontSize = 8
            c.Locked = True: c.TabStop = False
            c.BackColor = CLR_READONLY: c.ForeColor = CLR_TEXT
        Case 2
            ResultLook c
        Case Else
            StyleInput c
            c.FontSize = 8
    End Select
End Sub

Private Sub RCombo(frm As Form, src As String, xIn As Single, yIn As Single, _
                   wIn As Single, valueList As String)
    Dim c As Control
    Set c = CreateControl(frm.Name, acComboBox, acDetail, "", src, _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(0.24 * T1))
    c.Name = "cbo" & src
    c.RowSourceType = "Value List"
    c.RowSource = valueList
    c.LimitToList = False
    ComboLook c
End Sub

Private Sub SaveAs(tempName As String, finalName As String)
    DoCmd.Close acForm, tempName, acSaveYes
    DoCmd.Rename finalName, acForm, tempName
End Sub

Private Sub DropIfExists(nm As String, objType As AcObjectType)
    On Error Resume Next
    DoCmd.DeleteObject objType, nm
    Err.Clear
    On Error GoTo 0
End Sub

Private Sub DropTableDef(db As DAO.Database, nm As String)
    On Error Resume Next
    db.TableDefs.Delete nm
    Err.Clear
    On Error GoTo 0
End Sub
