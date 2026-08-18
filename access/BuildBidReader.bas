Attribute VB_Name = "BuildBidReader"
Option Compare Database
Option Explicit

' =====================================================================
' RELATIONSHIP PROJECTION - standalone read-only bid database (v1)
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
Private Const FONT As String = "Segoe UI"

Private Const CLR_MAIN As Long = 0
Private Const CLR_HEADER As Long = 1775640
Private Const CLR_CARD As Long = 2301984
Private Const CLR_INPUT As Long = 1775640
Private Const CLR_READONLY As Long = 4603711
Private Const CLR_INBORDER As Long = 5984850
Private Const CLR_TEXT As Long = 16777215
Private Const CLR_TEXTSEC As Long = 14407121
Private Const CLR_MUTED As Long = 11510684
Private Const CLR_GREEN As Long = 8445514

' ---------------------------------------------------------------------
Public Sub BuildReaderDB()
    On Error GoTo Fail
    LinkReaderTables
    EnsureReaderTables
    BuildFrmBidReader
    MsgBox "Relationship Projection reader built." & vbCrLf & vbCrLf & _
           "Open frmBidReader (pick project + relationship)." & vbCrLf & _
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
End Sub

' ================= THE FORM ==========================================
Private Sub BuildFrmBidReader()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmBidReader", acForm
    Set frm = NewDarkForm("SELECT * FROM xtblBidReader ORDER BY LoanNo", 1)
    nm = frm.Name
    frm.Caption = "Relationship Projection"
    frm.AllowAdditions = False
    frm.AllowDeletions = False
    frm.HasModule = True
    EnsureHeader frm
    frm.Section(acHeader).BackColor = CLR_CARD
    frm.Section(acHeader).Height = 1.25 * T1
    frm.Section(acDetail).Height = 1.06 * T1
    frm.Section(acDetail).BackColor = CLR_CARD
    frm.Section(acFooter).Height = 1.95 * T1
    frm.Section(acFooter).BackColor = CLR_HEADER

    ' --- Header row 0: brand + recalc ---
    Set c = CreateControl(nm, acLabel, acHeader, "", "", _
                          CLng(0.1 * T1), CLng(0.03 * T1), CLng(1.3 * T1), CLng(0.24 * T1))
    c.Caption = "RELATIONSHIP": c.ForeColor = CLR_TEXT
    c.FontName = FONT: c.FontSize = 11: c.FontBold = True
    Set c = CreateControl(nm, acLabel, acHeader, "", "", _
                          CLng(1.45 * T1), CLng(0.03 * T1), CLng(1.2 * T1), CLng(0.24 * T1))
    c.Caption = "PROJECTION": c.ForeColor = CLR_GREEN
    c.FontName = FONT: c.FontSize = 11: c.FontBold = True
    HeadLbl frm, "reads SQL Server only - all inputs stay local", 2.75, 3.3, 0.08, False
    Set c = CreateControl(nm, acCommandButton, acHeader, "", "", _
                          CLng(9# * T1), CLng(0.02 * T1), CLng(0.85 * T1), CLng(0.26 * T1))
    c.Name = "btnRecalc": c.Caption = "Recalc"
    DarkBtn c

    ' --- Header row 1: pickers ---
    HeadLbl frm, "Project", 0.1, 0.55, 0.34, False
    Set c = CreateControl(nm, acComboBox, acHeader, "", "", _
                          CLng(0.65 * T1), CLng(0.32 * T1), CLng(1.9 * T1), CLng(0.25 * T1))
    c.Name = "cboProject"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT ProjectName FROM tblProjects ORDER BY ProjectName;"
    c.LimitToList = True
    ComboLook c
    HeadLbl frm, "Relationship", 2.65, 0.8, 0.34, False
    Set c = CreateControl(nm, acComboBox, acHeader, "", "", _
                          CLng(3.5 * T1), CLng(0.32 * T1), CLng(1.7 * T1), CLng(0.25 * T1))
    c.Name = "cboRelationship"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT RelatedLoans FROM tblRelationships " & _
        "WHERE ProjectName = Forms!frmBidReader!cboProject ORDER BY SortNo;"
    c.LimitToList = True
    ComboLook c
    HeadLbl frm, "PMT Hist Dt", 5.3, 0.75, 0.34, False
    Set c = CreateControl(nm, acTextBox, acHeader, "", "", _
                          CLng(6.05 * T1), CLng(0.32 * T1), CLng(0.8 * T1), CLng(0.25 * T1))
    StyleInput c: c.Name = "txtAnchor": c.Format = "mm/dd/yy": c.FontSize = 8
    c.DefaultValue = "=Date()"
    HeadLbl frm, "Yield", 6.95, 0.4, 0.34, False
    Set c = CreateControl(nm, acTextBox, acHeader, "", "", _
                          CLng(7.35 * T1), CLng(0.32 * T1), CLng(0.55 * T1), CLng(0.25 * T1))
    StyleInput c: c.Name = "txtYield": c.Format = "0.00%": c.FontSize = 8

    ' --- Header label bands for the three detail rows ---
    HeadLbl frm, "Loan No", 0.05, 1#, 0.64, False
    HeadLbl frm, "UPB", 1.1, 0.85, 0.64, True
    HeadLbl frm, "Interest", 2#, 0.8, 0.64, True
    HeadLbl frm, "Rate", 2.85, 0.5, 0.64, True
    HeadLbl frm, "PMT", 3.4, 0.8, 0.64, True
    HeadLbl frm, "MTM", 4.25, 0.45, 0.64, True
    HeadLbl frm, "MTA", 4.75, 0.45, 0.64, True
    HeadLbl frm, "3M Trail", 5.25, 0.85, 0.64, True
    HeadLbl frm, "6M Trail", 6.15, 0.85, 0.64, True
    HeadLbl frm, "12M Trail", 7.05, 0.9, 0.64, True
    HeadLbl frm, "Pmt Selection", 0.05, 0.95, 0.84, False
    HeadLbl frm, "User PMT", 1.05, 0.8, 0.84, True
    HeadLbl frm, "Term", 1.9, 0.45, 0.84, True
    HeadLbl frm, "Trail %", 2.4, 0.5, 0.84, True
    HeadLbl frm, "Rate Selection", 2.95, 0.9, 0.84, False
    HeadLbl frm, "User Rate", 3.9, 0.55, 0.84, True
    HeadLbl frm, "Legal $", 4.5, 0.8, 0.84, True
    HeadLbl frm, "LglSt", 5.35, 0.45, 0.84, True
    HeadLbl frm, "Hold $", 5.85, 0.75, 0.84, True
    HeadLbl frm, "LglEnd", 6.65, 0.5, 0.84, True
    HeadLbl frm, "Add Back to Exit", 7.2, 1.05, 0.84, False
    HeadLbl frm, "Exit Type", 0.05, 0.95, 1.04, False
    HeadLbl frm, "ExitM", 1.05, 0.45, 1.04, True
    HeadLbl frm, "StartM", 1.55, 0.45, 1.04, True
    HeadLbl frm, "DPO %", 2.05, 0.5, 1.04, True
    HeadLbl frm, "Cap %", 2.6, 0.5, 1.04, True
    HeadLbl frm, "YTM %", 3.15, 0.5, 1.04, True
    HeadLbl frm, "User Exit", 3.7, 0.8, 1.04, True
    HeadLbl frm, "Accr", 4.55, 0.45, 1.04, False
    HeadLbl frm, "Pmt Pull", 5.05, 0.8, 1.04, True
    HeadLbl frm, "Exit Value", 5.9, 0.85, 1.04, True
    HeadLbl frm, "Bid (NPV)", 6.8, 0.9, 1.04, True
    HeadLbl frm, "Bid %", 7.75, 0.5, 1.04, True
    HeadLbl frm, "MOIC", 8.3, 0.5, 1.04, True
    HeadLbl frm, "12M CY", 8.85, 0.5, 1.04, True
    HeadLbl frm, "ImpDPO", 9.4, 0.55, 1.04, True

    ' --- Detail row A: snapshot + trails (locked) ---
    RCell frm, "LoanNo", 0.05, 0.02, 1#, 1, ""
    RCell frm, "UPB", 1.1, 0.02, 0.85, 1, "$#,##0"
    RCell frm, "IntBal", 2#, 0.02, 0.8, 1, "$#,##0"
    RCell frm, "CRate", 2.85, 0.02, 0.5, 1, "0.00%"
    RCell frm, "CPmt", 3.4, 0.02, 0.8, 1, "$#,##0"
    RCell frm, "MTM", 4.25, 0.02, 0.45, 1, ""
    RCell frm, "MTA", 4.75, 0.02, 0.45, 1, ""
    RCell frm, "T3", 5.25, 0.02, 0.85, 1, "$#,##0"
    RCell frm, "T6", 6.15, 0.02, 0.85, 1, "$#,##0"
    RCell frm, "T12", 7.05, 0.02, 0.9, 1, "$#,##0"
    ' --- Detail row B: payment / rate / legal parameters ---
    RCombo frm, "PmtSel", 0.05, 0.36, 0.95, _
        """Current PMT"";""User PMT"";""Interest PMT"";""Term PMT"";""% of M Trail PMT"""
    RCell frm, "UserPmt", 1.05, 0.36, 0.8, 0, "$#,##0"
    RCell frm, "TermMonths", 1.9, 0.36, 0.45, 0, ""
    RCell frm, "TrailPct", 2.4, 0.36, 0.5, 0, "0.00%"
    RCombo frm, "RateSel", 2.95, 0.36, 0.9, _
        """Contractual"";""User Enter"";""Default"""
    RCell frm, "UserRate", 3.9, 0.36, 0.55, 0, "0.00%"
    RCell frm, "LegalInit", 4.5, 0.36, 0.8, 0, "$#,##0"
    RCell frm, "LegalStartM", 5.35, 0.36, 0.45, 0, ""
    RCell frm, "HoldCost", 5.85, 0.36, 0.75, 0, "$#,##0"
    RCell frm, "LegalEndM", 6.65, 0.36, 0.5, 0, ""
    RCombo frm, "AddBack", 7.2, 0.36, 1.05, _
        """No"";""Yes, Initial Only"";""Yes, Both"""
    ' --- Detail row C: exit parameters + results ---
    RCombo frm, "ExitType", 0.05, 0.7, 0.95, _
        """PIF"";""User Enter"";""DPO"";""YTM Sell Solve"";""Value Cap"";""Liquidation"""
    RCell frm, "ExitMonth", 1.05, 0.7, 0.45, 0, ""
    RCell frm, "StartMonth", 1.55, 0.7, 0.45, 0, ""
    RCell frm, "DPOPct", 2.05, 0.7, 0.5, 0, "0.00%"
    RCell frm, "ValCapPct", 2.6, 0.7, 0.5, 0, "0.00%"
    RCell frm, "YTMTgt", 3.15, 0.7, 0.5, 0, "0.00%"
    RCell frm, "UserExit", 3.7, 0.7, 0.8, 0, "$#,##0"
    RCombo frm, "AddAccrued", 4.55, 0.7, 0.45, """Yes"";""No"""
    RCell frm, "PmtPull", 5.05, 0.7, 0.8, 2, "$#,##0"
    RCell frm, "ExitVal", 5.9, 0.7, 0.85, 2, "$#,##0"
    RCell frm, "BidNPV", 6.8, 0.7, 0.9, 2, "$#,##0"
    RCell frm, "BidPct", 7.75, 0.7, 0.5, 2, "0.0%"
    RCell frm, "MOIC", 8.3, 0.7, 0.5, 2, "0.00"
    RCell frm, "CY12", 8.85, 0.7, 0.5, 2, "0.0%"
    RCell frm, "ImpDPO", 9.4, 0.7, 0.55, 2, "0.0%"

    ' --- Footer: relationship rollup + exit-month sensitivity ---
    Set c = CreateControl(nm, acLabel, acFooter, "", "", _
                          CLng(0.05 * T1), CLng(0.05 * T1), CLng(1.1 * T1), CLng(0.2 * T1))
    c.Caption = "Relationship Bid": c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acFooter, "", "=Sum([BidNPV])", _
                          CLng(1.2 * T1), CLng(0.03 * T1), CLng(1# * T1), CLng(0.24 * T1))
    StyleCell c: c.Name = "txtTotBid": c.ForeColor = CLR_GREEN: c.FontBold = True
    c.Format = "$#,##0": c.TextAlign = 3
    Set c = CreateControl(nm, acLabel, acFooter, "", "", _
                          CLng(2.35 * T1), CLng(0.05 * T1), CLng(0.5 * T1), CLng(0.2 * T1))
    c.Caption = "Bid %": c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acFooter, "", _
        "=IIf(Sum([UPB])=0,0,Sum([BidNPV])/Sum([UPB]))", _
        CLng(2.85 * T1), CLng(0.03 * T1), CLng(0.6 * T1), CLng(0.24 * T1))
    StyleCell c: c.Name = "txtTotBidPct": c.ForeColor = CLR_GREEN: c.FontBold = True
    c.Format = "0.0%": c.TextAlign = 3
    Set c = CreateControl(nm, acLabel, acFooter, "", "", _
                          CLng(3.6 * T1), CLng(0.05 * T1), CLng(0.4 * T1), CLng(0.2 * T1))
    c.Caption = "UPB": c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acFooter, "", "=Sum([UPB])", _
                          CLng(4# * T1), CLng(0.03 * T1), CLng(1# * T1), CLng(0.24 * T1))
    StyleCell c: c.Name = "txtTotUPB": c.Format = "$#,##0": c.TextAlign = 3
    Set c = CreateControl(nm, acLabel, acFooter, "", "", _
                          CLng(5.15 * T1), CLng(0.05 * T1), CLng(0.95 * T1), CLng(0.2 * T1))
    c.Caption = "Rel Collateral": c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acFooter, "", "", _
                          CLng(6.1 * T1), CLng(0.03 * T1), CLng(1# * T1), CLng(0.24 * T1))
    StyleCell c: c.Name = "txtRelColl": c.Format = "$#,##0": c.TextAlign = 3
    Set c = CreateControl(nm, acLabel, acFooter, "", "", _
                          CLng(7.25 * T1), CLng(0.05 * T1), CLng(0.7 * T1), CLng(0.2 * T1))
    c.Caption = "Bid/MwVx": c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acFooter, "", "", _
                          CLng(7.95 * T1), CLng(0.03 * T1), CLng(0.6 * T1), CLng(0.24 * T1))
    StyleCell c: c.Name = "txtBidMwVx": c.Format = "0.0%": c.TextAlign = 3
    Set c = CreateControl(nm, acLabel, acFooter, "", "", _
                          CLng(0.05 * T1), CLng(0.36 * T1), CLng(4.5 * T1), CLng(0.2 * T1))
    c.Caption = "Exit-Month Sensitivity (every loan exited at month N)"
    c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    Set c = CreateControl(nm, acListBox, acFooter, "", "", _
                          CLng(0.05 * T1), CLng(0.58 * T1), CLng(9.9 * T1), CLng(1.3 * T1))
    c.Name = "lstSens"
    c.RowSourceType = "Value List"
    c.RowSource = "Month;Bid;Bid %;MOIC;12M CY"
    c.ColumnCount = 5
    c.BoundColumn = 1
    c.ColumnWidths = "700;1400;900;900;900"
    c.ColumnHeads = True
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0

    ' --- Wiring (rename-before-wire, then procs) ---
    Dim mdl As Module, ln As Long, code As String
    frm!btnRecalc.OnClick = "[Event Procedure]"
    frm!cboProject.AfterUpdate = "[Event Procedure]"
    frm!cboRelationship.AfterUpdate = "[Event Procedure]"
    frm!txtYield.AfterUpdate = "[Event Procedure]"
    frm!txtAnchor.AfterUpdate = "[Event Procedure]"
    frm.AfterUpdate = "[Event Procedure]"
    frm.OnLoad = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("Click", "btnRecalc")
    mdl.InsertLines ln + 1, "    RecalcAll"
    ln = mdl.CreateEventProc("AfterUpdate", "Form")
    mdl.InsertLines ln + 1, "    RecalcAll"
    ln = mdl.CreateEventProc("Load", "Form")
    code = "    On Error Resume Next" & vbCrLf
    code = code & "    If IsNull(Me!cboProject) Then Me!cboProject = DFirst(""ProjectName"", ""tblProjects"")" & vbCrLf
    code = code & "    Me!cboRelationship.Requery" & vbCrLf
    code = code & "    Me.Filter = ""RelatedLoans='__none__'""" & vbCrLf
    code = code & "    Me.FilterOn = True"
    mdl.InsertLines ln + 1, code
    ln = mdl.CreateEventProc("AfterUpdate", "cboProject")
    code = "    On Error Resume Next" & vbCrLf
    code = code & "    Me!cboRelationship = Null" & vbCrLf
    code = code & "    Me!cboRelationship.Requery" & vbCrLf
    code = code & "    Me.Filter = ""RelatedLoans='__none__'""" & vbCrLf
    code = code & "    Me.FilterOn = True"
    mdl.InsertLines ln + 1, code
    ln = mdl.CreateEventProc("AfterUpdate", "cboRelationship")
    mdl.InsertLines ln + 1, "    SyncRel"
    ln = mdl.CreateEventProc("AfterUpdate", "txtYield")
    mdl.InsertLines ln + 1, "    SaveSettings" & vbCrLf & "    RecalcAll"
    ln = mdl.CreateEventProc("AfterUpdate", "txtAnchor")
    mdl.InsertLines ln + 1, "    SaveSettings" & vbCrLf & "    RecalcAll"

    ' --- The engine (ports of the sheet's LET formulas) ---
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
    code = code & "    ' Sum of the last n months of actual payments (pd = Year*100+Month)" & vbCrLf
    code = code & "    Dim lo As Long, hi As Long, d As Date" & vbCrLf
    code = code & "    hi = Year(anchor) * 100 + Month(anchor)" & vbCrLf
    code = code & "    d = DateAdd(""m"", -(n - 1), anchor)" & vbCrLf
    code = code & "    lo = Year(d) * 100 + Month(d)" & vbCrLf
    code = code & "    TrailSum = Nz(DSum(""amount"", ""tblPayHistory"", ""mwloanno='"" & lnq & ""' AND pd >= "" & lo & "" AND pd <= "" & hi), 0)" & vbCrLf
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
    code = code & "Private Function PickPmt(sel As String, cp As Double, upb As Double, mr As Double, term As Long, upmt As Double, t12 As Double, tpct As Double) As Double" & vbCrLf
    code = code & "    Select Case sel" & vbCrLf
    code = code & "        Case ""User PMT"": PickPmt = upmt" & vbCrLf
    code = code & "        Case ""Interest PMT"": PickPmt = upb * mr" & vbCrLf
    code = code & "        Case ""Term PMT""" & vbCrLf
    code = code & "            If term > 0 Then" & vbCrLf
    code = code & "                If mr > 0 Then PickPmt = VBA.Pmt(mr, term, -upb) Else PickPmt = upb / term" & vbCrLf
    code = code & "            Else" & vbCrLf
    code = code & "                PickPmt = cp" & vbCrLf
    code = code & "            End If" & vbCrLf
    code = code & "        Case ""% of M Trail PMT"": PickPmt = tpct * t12 / 12" & vbCrLf
    code = code & "        Case Else: PickPmt = cp" & vbCrLf
    code = code & "    End Select" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Private Function CoreBid(mr As Double, pm As Double, upb As Double, ib As Double, startM As Long, exitM As Long, xt As String, dpo As Double, cap As Double, ytmr As Double, uex As Double, accY As Boolean, relColl As Double, mtm As Long, mta As Long, y As Double, lgl As Double, lglS As Long, hld As Double, lglE As Long, ab As String, ByRef xv As Double, ByRef sAll As Double, ByRef s12 As Double) As Double" & vbCrLf
    code = code & "    ' The sheet's Exit Pull LET + NPV of the monthly net stream" & vbCrLf
    code = code & "    Dim fvx As Double, acc As Double, addb As Double, mm As Long" & vbCrLf
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
    code = code & "        Case ""Liquidation"": xv = VBA.FV(mr, exitM, 0, -upb) + acc" & vbCrLf
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
    code = code & "    CurrentDb.Execute ""INSERT INTO xtblBidReader (LoanNo, RelatedLoans, PmtSel, RateSel, ExitType, ExitMonth, StartMonth, DPOPct, ValCapPct, YTMTgt, AddAccrued, AddBack, TrailPct, LegalStartM, LegalEndM) SELECT l.MWLoanNo, l.RelatedLoans, 'Current PMT', 'Contractual', 'PIF', 24, 1, 0.25, 1, 0.15, 'No', 'No', 1, 0, 0 FROM tblLoan AS l WHERE l.RelatedLoans='"" & esc & ""' AND l.MWLoanNo NOT IN (SELECT LoanNo FROM xtblBidReader)""" & vbCrLf
    code = code & "    Me!txtYield = Nz(DLookup(""YieldTarget"", ""xtblBidReaderSet"", ""RelatedLoans='"" & esc & ""'""), 0.15)" & vbCrLf
    code = code & "    Me!txtAnchor = Nz(DLookup(""AnchorDt"", ""xtblBidReaderSet"", ""RelatedLoans='"" & esc & ""'""), Date)" & vbCrLf
    code = code & "    Me.Filter = ""RelatedLoans='"" & esc & ""'""" & vbCrLf
    code = code & "    Me.FilterOn = True" & vbCrLf
    code = code & "    RecalcAll" & vbCrLf
    code = code & "End Sub" & vbCrLf
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
    code = code & "    ' Pass 1: snapshot from SQL Server (read-only) + per-loan results" & vbCrLf
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
    code = code & "        pm = PickPmt(Nz(rs!PmtSel, ""Current PMT""), cp, upb, mr, Nz(rs!TermMonths, 0), Nz(rs!UserPmt, 0), Nz(rs!T12, 0), Nz(rs!TrailPct, 1))" & vbCrLf
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
    code = code & "        npv = CoreBid(mr, pm, upb, ib, Nz(rs!StartMonth, 1), Nz(rs!ExitMonth, 24), Nz(rs!ExitType, ""PIF""), Nz(rs!DPOPct, 0), Nz(rs!ValCapPct, 1), Nz(rs!YTMTgt, 0.15), Nz(rs!UserExit, 0), (Nz(rs!AddAccrued, ""No"") = ""Yes""), relColl, mtm, mta, y, Nz(rs!LegalInit, 0), Nz(rs!LegalStartM, 0), Nz(rs!HoldCost, 0), Nz(rs!LegalEndM, 0), Nz(rs!AddBack, ""No""), xv, sAll, s12)" & vbCrLf
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
    code = code & "    ' Pass 2: exit-month sensitivity from the LOCAL snapshot only" & vbCrLf
    code = code & "    s = ""Month;Bid;Bid %;MOIC;12M CY""" & vbCrLf
    code = code & "    For m = 6 To 60 Step 6" & vbCrLf
    code = code & "        tb = 0: tu = 0: ta = 0: t12s = 0" & vbCrLf
    code = code & "        Set rs = db.OpenRecordset(""SELECT * FROM xtblBidReader WHERE RelatedLoans='"" & esc & ""'"", dbOpenSnapshot)" & vbCrLf
    code = code & "        Do While Not rs.EOF" & vbCrLf
    code = code & "            mr = PickRate(Nz(rs!RateSel, ""Contractual""), Nz(rs!CRate, 0), Nz(rs!DRate, 0), Nz(rs!UserRate, 0))" & vbCrLf
    code = code & "            pm = PickPmt(Nz(rs!PmtSel, ""Current PMT""), Nz(rs!CPmt, 0), Nz(rs!UPB, 0), mr, Nz(rs!TermMonths, 0), Nz(rs!UserPmt, 0), Nz(rs!T12, 0), Nz(rs!TrailPct, 1))" & vbCrLf
    code = code & "            npv = CoreBid(mr, pm, Nz(rs!UPB, 0), Nz(rs!IntBal, 0), Nz(rs!StartMonth, 1), m, Nz(rs!ExitType, ""PIF""), Nz(rs!DPOPct, 0), Nz(rs!ValCapPct, 1), Nz(rs!YTMTgt, 0.15), Nz(rs!UserExit, 0), (Nz(rs!AddAccrued, ""No"") = ""Yes""), relColl, Nz(rs!MTM, 1), Nz(rs!MTA, 360), y, Nz(rs!LegalInit, 0), Nz(rs!LegalStartM, 0), Nz(rs!HoldCost, 0), Nz(rs!LegalEndM, 0), Nz(rs!AddBack, ""No""), xv, sAll, s12)" & vbCrLf
    code = code & "            tb = tb + npv: tu = tu + Nz(rs!UPB, 0): ta = ta + sAll: t12s = t12s + s12" & vbCrLf
    code = code & "            rs.MoveNext" & vbCrLf
    code = code & "        Loop" & vbCrLf
    code = code & "        rs.Close" & vbCrLf
    code = code & "        s = s & "";"" & m & "";"" & Format(tb, ""$#,##0"")" & vbCrLf
    code = code & "        If tu <> 0 Then s = s & "";"" & Format(tb / tu, ""0.0%"") Else s = s & "";-""" & vbCrLf
    code = code & "        If tb <> 0 Then s = s & "";"" & Format(ta / tb, ""0.00"") & "";"" & Format(t12s / tb, ""0.0%"") Else s = s & "";-;-""" & vbCrLf
    code = code & "    Next m" & vbCrLf
    code = code & "    Me!lstSens.RowSource = s" & vbCrLf
    code = code & "    Me!txtRelColl = relColl" & vbCrLf
    code = code & "    Me!txtBidMwVx = Null" & vbCrLf
    code = code & "    If relColl <> 0 Then Me!txtBidMwVx = Nz(DSum(""BidNPV"", ""xtblBidReader"", ""RelatedLoans='"" & esc & ""'""), 0) / relColl" & vbCrLf
    code = code & "    Me.Requery" & vbCrLf
    code = code & "End Sub" & vbCrLf
    mdl.InsertLines mdl.CountOfLines + 1, code
    SaveAs nm, "frmBidReader"
End Sub

' ================= HELPERS ===========================================
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

Private Sub ComboLook(c As Control)
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.SpecialEffect = 0: c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
End Sub

Private Sub DarkBtn(c As Control)
    On Error Resume Next
    c.UseTheme = False: c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXTSEC
    c.BorderColor = CLR_INBORDER: c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
End Sub

' Header label at an x/width/y with optional right alignment
Private Sub HeadLbl(frm As Form, cap As String, xIn As Single, wIn As Single, _
                    yIn As Single, rightAlign As Boolean)
    Dim c As Control
    Set c = CreateControl(frm.Name, acLabel, acHeader, "", "", _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(0.19 * T1))
    c.Caption = cap: c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 7
    If rightAlign Then c.TextAlign = 3
End Sub

' Detail cell: kind 0 = editable parameter, 1 = locked snapshot,
' 2 = green computed result
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
            c.BackColor = CLR_READONLY: c.ForeColor = CLR_MUTED
        Case 2
            StyleCell c
            c.ForeColor = CLR_GREEN
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
