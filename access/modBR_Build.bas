Attribute VB_Name = "modBR_Build"
Option Compare Database
Option Explicit

' =====================================================================
' modBR_Build - generates the Relationship Projection v2 forms.
' Run BuildBidReaderV2 once from the Immediate window. Zero injected
' code: every event is a "=BR_Xxx(...)" property calling modBR_UI.
' =====================================================================

Public Const USE_TABCTL As Boolean = True

Private Const T1 As Long = 1440
Private Const FONT As String = "Calibri"
Private Const CLR_WHITE As Long = 16777215
Private Const CLR_BAND As Long = 16316664
Private Const CLR_PANEL As Long = 15790320
Private Const CLR_HDR As Long = 14277081
Private Const CLR_INPUT As Long = 13434879
Private Const CLR_BORDER As Long = 14277081
Private Const CLR_TEXT As Long = 0
Private Const CLR_TEXT2 As Long = 3355443
Private Const CLR_MUTED As Long = 6710886
Private Const CLR_GREEN As Long = 2315831
Private Const CLR_RESBG As Long = 14348258
Private Const CLR_TITLE As Long = 7949855
Private Const CLR_BTN As Long = 15132390
Private Const CLR_FOCUS As Long = 10086911    ' #FFE699

Private Const LBLW As Single = 1.45
Private Const X0 As Single = 1.55
Private Const COLW As Single = 0.85
Private Const CELLW As Single = 0.8
Private Const RH As Single = 0.21
Private Const TOTW As Single = 0.95

' ---------------------------------------------------------------- entry
Public Sub BuildBidReaderV2()
    On Error GoTo Fail
    EnsureLocalTables
    BuildFsubProj
    BuildFsubPayHist
    BuildFsubOptimal
    BuildFsubColl
    BuildRptProjection
    BuildFrmMain
    On Error Resume Next
    DoCmd.RunCommand acCmdCompileAndSaveAllModules
    On Error GoTo 0
    MsgBox "Relationship Projection v2 built." & vbCrLf & vbCrLf & _
           "Open frmBidReader. Run BR_SelfTest first if you want the fidelity gate.", vbInformation, "Bid Reader v2"
    Exit Sub
Fail:
    MsgBox "Build failed: " & Err.Description, vbCritical, "Bid Reader v2"
End Sub

' v1.3's linked-table browser, optional and never used by the app
Public Sub BR_LinkForBrowsing()
    Dim db As DAO.Database, tables As Variant, i As Long, td As DAO.TableDef
    Set db = CurrentDb
    tables = Array("tblProjects", "tblRelationships", "tblLoan", "tblPayHistory", "CollateralInfo", "xTblCFparameters")
    For i = LBound(tables) To UBound(tables)
        On Error Resume Next
        db.TableDefs.Delete CStr(tables(i))
        Err.Clear
        Set td = db.CreateTableDef(CStr(tables(i)))
        td.Connect = CONNECT
        td.SourceTableName = "dbo." & tables(i)
        db.TableDefs.Append td
        Err.Clear
        On Error GoTo 0
    Next i
    db.TableDefs.Refresh
End Sub

' ---------------------------------------------------------------- fsubBR_Proj (the sheet)
Private Sub BuildFsubProj()
    Dim frm As Form, nm As String, c As Control, keys() As String, caps() As String, kinds() As String, fmts() As String
    Dim r As Long, i As Long, y As Single, x As Single, tabN As Long, k As String
    DropForm "fsubBR_Proj"
    Set frm = NewSheetForm()
    nm = frm.Name
    frm.Caption = "Projection"
    EnsureHdrFtr frm
    frm.Section(acHeader).Height = 0.3 * T1
    frm.Section(acHeader).BackColor = CLR_PANEL
    frm.Section(acFooter).Height = 0
    RowDefs keys, caps, kinds, fmts
    frm.Section(acDetail).Height = (0.08 + NROWS * RH + 0.1) * T1
    ' frozen loan-number row + pager
    MkLabel frm, acHeader, "l_LoanNo", "Loan Number", 0.05, 0.05, LBLW, True, CLR_TEXT2
    For i = 1 To NCOLS
        Set c = MkText(frm, acHeader, "h" & i & "_LoanNo", X0 + (i - 1) * COLW, 0.04, CELLW)
        HeadCell c
    Next i
    Set c = MkText(frm, acHeader, "hT_LoanNo", X0 + NCOLS * COLW + 0.05, 0.04, TOTW)
    HeadCell c: c.FontBold = True
    Set c = MkButton(frm, acHeader, "btnPgPrev", "<", X0 + NCOLS * COLW + 1.05, 0.03, 0.3)
    c.OnClick = "=BR_Page(-1)"
    MkLabel frm, acHeader, "lblPg", "", X0 + NCOLS * COLW + 1.38, 0.06, 1.2, False, CLR_MUTED
    Set c = MkButton(frm, acHeader, "btnPgNext", ">", X0 + NCOLS * COLW + 2.6, 0.03, 0.3)
    c.OnClick = "=BR_Page(1)"
    ' rows
    tabN = 0
    For r = 1 To NROWS
        y = 0.05 + (r - 1) * RH
        k = keys(r)
        If kinds(r) = "s" Then
            Set c = MkLabel(frm, acDetail, "l_" & k, caps(r), 0.05, y + 0.01, X0 + NCOLS * COLW + TOTW, True, CLR_TITLE)
            c.BackStyle = 1: c.BackColor = CLR_HDR: c.FontSize = 9
        Else
            MkLabel frm, acDetail, "l_" & k, caps(r), 0.05, y + 0.01, LBLW, True, CLR_TEXT2
            If kinds(r) = "t" Then
                Set c = MkCombo(frm, acDetail, "cTrailDisp", X0 + NCOLS * COLW + 0.05, y, TOTW, ValueList("TrailDisp"))
                c.DefaultValue = "=""Actual"""
                c.AfterUpdate = "=BR_GlobalChanged(""cTrailDisp"")"
            Else
                For i = 1 To NCOLS
                    x = X0 + (i - 1) * COLW
                    Select Case kinds(r)
                        Case "Y"
                            Set c = MkCombo(frm, acDetail, "c" & i & "_" & k, x, y, CELLW, ValueList(k))
                            c.AfterUpdate = "=BR_CellChanged(""c" & i & "_" & k & """)"
                        Case "y"
                            Set c = MkText(frm, acDetail, "c" & i & "_" & k, x, y, CELLW)
                            InputCell c, fmts(r)
                            c.AfterUpdate = "=BR_CellChanged(""c" & i & "_" & k & """)"
                        Case "r"
                            Set c = MkText(frm, acDetail, "c" & i & "_" & k, x, y, CELLW)
                            ResultCell c, fmts(r)
                        Case Else
                            Set c = MkText(frm, acDetail, "c" & i & "_" & k, x, y, CELLW)
                            DataCell c, fmts(r)
                    End Select
                Next i
                If kinds(r) = "g" Or kinds(r) = "c" Or kinds(r) = "r" Then
                    Set c = MkText(frm, acDetail, "cT_" & k, X0 + NCOLS * COLW + 0.05, y, TOTW)
                    If kinds(r) = "r" Then ResultCell c, fmts(r) Else DataCell c, fmts(r): c.BackColor = 15921906
                    c.FontBold = True
                End If
            End If
        End If
    Next r
    ' column-major tab order over yellow cells
    For i = 1 To NCOLS
        For r = 1 To NROWS
            If kinds(r) = "y" Or kinds(r) = "Y" Then
                tabN = tabN + 1
                frm.Controls("c" & i & "_" & keys(r)).TabIndex = tabN
            End If
        Next r
    Next i
    AssertControls frm, 720
    SaveAs nm, "fsubBR_Proj"
End Sub

' ---------------------------------------------------------------- fsubBR_PayHist
Private Sub BuildFsubPayHist()
    Dim frm As Form, nm As String, c As Control, i As Long, k As Long, y As Single, stats As Variant, scaps As Variant, s As Long
    DropForm "fsubBR_PayHist"
    Set frm = NewSheetForm()
    nm = frm.Name
    frm.Caption = "Pay History"
    EnsureHdrFtr frm
    frm.Section(acHeader).Height = 0.3 * T1
    frm.Section(acHeader).BackColor = CLR_PANEL
    frm.Section(acFooter).Height = 0
    MkLabel frm, acHeader, "l_LoanNo", "Loan Number", 0.05, 0.05, LBLW, True, CLR_TEXT2
    For i = 1 To NCOLS
        Set c = MkText(frm, acHeader, "h" & i & "_LoanNo", X0 + (i - 1) * COLW, 0.04, CELLW)
        HeadCell c
    Next i
    Set c = MkText(frm, acHeader, "hT_LoanNo", X0 + NCOLS * COLW + 0.05, 0.04, TOTW)
    HeadCell c: c.FontBold = True
    Set c = MkButton(frm, acHeader, "btnPgPrev", "<", X0 + NCOLS * COLW + 1.05, 0.03, 0.3)
    c.OnClick = "=BR_Page(-1)"
    MkLabel frm, acHeader, "lblPg", "", X0 + NCOLS * COLW + 1.38, 0.06, 1.2, False, CLR_MUTED
    Set c = MkButton(frm, acHeader, "btnPgNext", ">", X0 + NCOLS * COLW + 2.6, 0.03, 0.3)
    c.OnClick = "=BR_Page(1)"
    stats = Array("Orig", "Pmt", "IntPmt", "T3", "T6", "T12", "T24")
    scaps = Array("Origination", "PMT", "Int PMT", "Trailing 3", "Trailing 6", "Trailing 12", "Trailing 24")
    For s = 0 To 6
        y = 0.05 + s * RH
        MkLabel frm, acDetail, "l_" & stats(s), CStr(scaps(s)), 0.05, y + 0.01, LBLW, True, CLR_TEXT2
        For i = 1 To NCOLS
            Set c = MkText(frm, acDetail, "p" & i & "_" & stats(s), X0 + (i - 1) * COLW, y, CELLW)
            DataCell c, IIf(s = 0, "mm/dd/yy", "$#,##0")
        Next i
        Set c = MkText(frm, acDetail, "pT_" & stats(s), X0 + NCOLS * COLW + 0.05, y, TOTW)
        DataCell c, IIf(s = 0, "", "$#,##0"): c.FontBold = True
    Next s
    y = 0.05 + 7 * RH + 0.08
    Set c = MkLabel(frm, acDetail, "l_Matrix", "Monthly payments (newest first)", 0.05, y, X0 + NCOLS * COLW + TOTW, True, CLR_TITLE)
    c.BackStyle = 1: c.BackColor = CLR_HDR
    For k = 0 To 35
        y = 0.05 + 8 * RH + 0.08 + k * RH
        Set c = MkText(frm, acDetail, "m" & k & "_Lbl", 0.05, y, LBLW)
        DataCell c, "": c.TextAlign = 1
        For i = 1 To NCOLS
            Set c = MkText(frm, acDetail, "m" & k & "_" & i, X0 + (i - 1) * COLW, y, CELLW)
            DataCell c, "#,##0;(#,##0);0;""—"""
        Next i
        Set c = MkText(frm, acDetail, "m" & k & "_T", X0 + NCOLS * COLW + 0.05, y, TOTW)
        DataCell c, "#,##0;(#,##0);0;""—""": c.FontBold = True
    Next k
    frm.Section(acDetail).Height = (0.05 + 8 * RH + 0.08 + 36 * RH + 0.1) * T1
    AssertControls frm, 620
    SaveAs nm, "fsubBR_PayHist"
End Sub

' ---------------------------------------------------------------- fsubBR_Optimal (bound)
Private Sub BuildFsubOptimal()
    Dim frm As Form, nm As String, c As Control, flds As Variant, caps As Variant, fm As Variant, w As Variant, i As Long, x As Single
    DropForm "fsubBR_Optimal"
    Set frm = NewSheetForm("SELECT * FROM xtblBR_OptCache ORDER BY M", 1)
    nm = frm.Name
    frm.Caption = "Optimal"
    frm.AllowEdits = False: frm.AllowAdditions = False: frm.AllowDeletions = False
    EnsureHdrFtr frm
    frm.Section(acHeader).Height = 0.24 * T1
    frm.Section(acHeader).BackColor = CLR_HDR
    frm.Section(acFooter).Height = 0
    frm.Section(acDetail).Height = 0.2 * T1
    flds = Array("M", "Bid", "BidPct", "ImpDPO", "CY12", "MOIC", "YTM", "PassAll")
    caps = Array("Month", "Bid", "Bid %", "Implied DPO", "12M CY", "MOIC", "YTM", "Pass")
    fm = Array("0", "$#,##0", "0.0%", "0.0%", "0.0%", "0.00", "0.00%", "")
    w = Array(0.55, 1.1, 0.75, 0.85, 0.75, 0.7, 0.8, 0.5)
    x = 0.05
    For i = 0 To 7
        MkLabel frm, acHeader, "l_" & flds(i), CStr(caps(i)), x, 0.03, CSng(w(i)), True, CLR_TEXT2
        If flds(i) = "PassAll" Then
            Set c = CreateControl(nm, acCheckBox, acDetail, "", "PassAll", CLng((x + 0.15) * T1), CLng(0.02 * T1), CLng(0.2 * T1), CLng(0.18 * T1))
            c.Name = "chkPassAll"
        Else
            Set c = CreateControl(nm, acTextBox, acDetail, "", CStr(flds(i)), CLng(x * T1), CLng(0.0 * T1), CLng(w(i) * T1), CLng(0.2 * T1))
            c.Name = "txt" & flds(i)
            DataCell c, CStr(fm(i))
            If flds(i) = "M" Then c.TextAlign = 2
        End If
        x = x + w(i) + 0.05
    Next i
    AddExprFC frm.Controls("txtYTM"), "[PassYTM]=True", CLR_GREEN, 12582912
    AddExprFC frm.Controls("txtCY12"), "[PassCY]=True", CLR_GREEN, 12582912
    AddExprFC frm.Controls("txtMOIC"), "[PassMOIC]=True", CLR_GREEN, 12582912
    frm.OnDblClick = "=BR_OptPick()"
    SaveAs nm, "fsubBR_Optimal"
End Sub

' ---------------------------------------------------------------- fsubBR_Coll (bound)
Private Sub BuildFsubColl()
    Dim frm As Form, nm As String, c As Control
    DropForm "fsubBR_Coll"
    Set frm = NewSheetForm("SELECT * FROM xtblBR_CollCache ORDER BY RowNo", 1)
    nm = frm.Name
    frm.Caption = "Collateral"
    frm.AllowEdits = False: frm.AllowAdditions = False: frm.AllowDeletions = False
    EnsureHdrFtr frm
    frm.Section(acHeader).Height = 0.46 * T1
    frm.Section(acHeader).BackColor = CLR_HDR
    frm.Section(acDetail).Height = 0.5 * T1
    frm.Section(acFooter).Height = 0.28 * T1
    frm.Section(acFooter).BackColor = CLR_PANEL
    ' row A headers/cells
    CollCol frm, "MWPropertyNo", "Prop#", 0.05, 0.02, 0.7, "0"
    CollCol frm, "MWCollateralCode", "Code", 0.8, 0.02, 0.85, ""
    CollCol frm, "Description", "Description", 1.7, 0.02, 1.5, ""
    CollCol frm, "Address", "Address", 3.25, 0.02, 1.85, ""
    CollCol frm, "City", "City", 5.15, 0.02, 0.95, ""
    CollCol frm, "State", "St", 6.15, 0.02, 0.4, ""
    CollCol frm, "Zip", "ZIP", 6.6, 0.02, 0.6, ""
    CollCol frm, "County", "County", 7.25, 0.02, 0.95, ""
    CollCol frm, "SQFT", "SF", 8.25, 0.02, 0.65, "#,##0"
    CollCol frm, "NumUnits", "Units", 8.95, 0.02, 0.5, "0"
    CollCol frm, "Acreage", "Acres", 9.5, 0.02, 0.55, "0.00"
    ' row B
    CollCol frm, "ApprDt", "ApprDt", 0.05, 0.26, 0.75, "mm/dd/yy"
    CollCol frm, "MosAppr", "Mos", 0.85, 0.26, 0.45, "0"
    CollCol frm, "SellerAppr", "Appraised", 1.35, 0.26, 0.9, "$#,##0"
    CollCol frm, "PerSF", "$/SF", 2.3, 0.26, 0.6, "$#,##0"
    CollCol frm, "PerUnit", "$/Unit", 2.95, 0.26, 0.7, "$#,##0"
    CollCol frm, "PerAcre", "$/Acre", 3.7, 0.26, 0.7, "$#,##0"
    CollCol frm, "TaxAnnual", "AnnTax", 4.45, 0.26, 0.75, "$#,##0"
    CollCol frm, "TaxDelq", "DelqTax", 5.25, 0.26, 0.8, "$#,##0"
    CollCol frm, "MwVx", "MwVx", 6.1, 0.26, 0.9, "$#,##0"
    CollCol frm, "SrLien", "MwLien", 7.05, 0.26, 0.85, "$#,##0"
    CollCol frm, "LienPos", "Pos", 7.95, 0.26, 0.4, ""
    CollCol frm, "NetMwVx", "Net MwVx", 8.4, 0.26, 0.85, "$#,##0"
    CollCol frm, "NetSeller", "Net Seller", 9.3, 0.26, 0.85, "$#,##0"
    ResultCell frm.Controls("txtNetMwVx"), "$#,##0": ResultCell frm.Controls("txtNetSeller"), "$#,##0"
    ' footer totals
    MkLabel frm, acFooter, "l_Tot", "Totals", 0.05, 0.05, 0.6, True, CLR_TEXT2
    Set c = MkText(frm, acFooter, "txtTotAppr", 1.35, 0.03, 0.9, "=Sum([SellerAppr])")
    DataCell c, "$#,##0": c.FontBold = True
    Set c = MkText(frm, acFooter, "txtTotMwVx", 6.1, 0.03, 0.9, "=Sum([MwVx])")
    DataCell c, "$#,##0": c.FontBold = True
    Set c = MkText(frm, acFooter, "txtTotNet", 8.4, 0.03, 0.85, "=Sum([NetMwVx])")
    ResultCell c, "$#,##0"
    MkLabel frm, acFooter, "l_Net90", "Net @ 90%", 2.4, 0.05, 0.8, True, CLR_TEXT2
    Set c = MkText(frm, acFooter, "txtTotNet90", 3.3, 0.03, 0.9, "=Sum([NetMwVx])*0.9")
    ResultCell c, "$#,##0"
    frm.OnCurrent = "=BR_CollRowChanged()"
    SaveAs nm, "fsubBR_Coll"
End Sub

Private Sub CollCol(frm As Form, fld As String, cap As String, x As Single, y As Single, w As Single, fmt As String)
    Dim c As Control
    MkLabel frm, acHeader, "l_" & fld, cap, x, y + 0.01, w, True, CLR_TEXT2
    Set c = CreateControl(frm.Name, acTextBox, acDetail, "", fld, CLng(x * T1), CLng(y * T1), CLng(w * T1), CLng(0.22 * T1))
    c.Name = "txt" & fld
    DataCell c, fmt
    If Len(fmt) = 0 Then c.TextAlign = 1
End Sub

' ---------------------------------------------------------------- rptBR_Projection
Private Sub BuildRptProjection()
    Dim rpt As Report, nm As String, c As Control, i As Long, x As Single, fl As Variant
    On Error Resume Next
    DoCmd.DeleteObject acReport, "rptBR_Projection"
    Err.Clear
    On Error GoTo 0
    Set rpt = CreateReport
    nm = rpt.Name
    rpt.RecordSource = "SELECT * FROM xtblBR_Snapshot ORDER BY Sheet DESC, RowNo"
    rpt.Caption = "Relationship Projection"
    On Error Resume Next
    rpt.Printer.Orientation = acPRORLandscape
    On Error GoTo 0
    rpt.Section(acDetail).Height = 0.2 * T1
    Set c = CreateControl(nm, acTextBox, acDetail, "", "Caption", CLng(0.05 * T1), 0, CLng(1.6 * T1), CLng(0.18 * T1))
    c.Name = "txtCaption": c.FontName = FONT: c.FontSize = 8: c.FontBold = True
    x = 1.7
    For i = 1 To 10
        Set c = CreateControl(nm, acTextBox, acDetail, "", "L" & i, CLng(x * T1), 0, CLng(0.78 * T1), CLng(0.18 * T1))
        c.Name = "txtL" & i: c.FontName = FONT: c.FontSize = 7: c.TextAlign = 3
        x = x + 0.8
    Next i
    Set c = CreateControl(nm, acTextBox, acDetail, "", "Tot", CLng(x * T1), 0, CLng(0.9 * T1), CLng(0.18 * T1))
    c.Name = "txtTot": c.FontName = FONT: c.FontSize = 7: c.FontBold = True: c.TextAlign = 3
    DoCmd.Close acReport, nm, acSaveYes
    DoCmd.Rename "rptBR_Projection", acReport, nm
End Sub

' ---------------------------------------------------------------- frmBidReader (main)
Private Sub BuildFrmMain()
    Dim frm As Form, nm As String, c As Control, tb As Control, pg As Control, i As Long, x As Single
    Dim pages As Variant, subs As Variant, srcs As Variant, hs As Variant, hcaps As Variant, j As Long
    Const PY As Single = 0.05
    Const PH As Single = 8.2
    DropForm "frmBidReader"
    Set frm = NewSheetForm()
    nm = frm.Name
    frm.Caption = "Relationship Projection"
    frm.AllowEdits = True
    frm.NavigationButtons = False
    On Error Resume Next
    frm.BorderStyle = 2: frm.AutoCenter = True: frm.AutoResize = False: frm.ScrollBars = 0
    On Error GoTo 0
    EnsureHdrFtr frm
    frm.Section(acHeader).Height = 0.98 * T1
    frm.Section(acHeader).BackColor = CLR_PANEL
    frm.Section(acFooter).Height = 0.26 * T1
    frm.Section(acFooter).BackColor = CLR_HDR
    frm.Section(acDetail).Height = (PY + PH + 0.55) * T1
    frm.Width = 11.7 * T1
    ' --- header row 1
    Set c = MkLabel(frm, acHeader, "lblTitle", "RELATIONSHIP PROJECTION", 0.08, 0.05, 2.6, True, CLR_TITLE)
    c.FontSize = 12
    MkLabel frm, acHeader, "l_Project", "Project", 2.75, 0.09, 0.55, False, CLR_MUTED
    Set c = MkCombo(frm, acHeader, "cboProject", 3.3, 0.06, 1.9, "")
    c.RowSourceType = "Table/Query": c.RowSource = "qptBR_Projects": c.LimitToList = True
    c.AfterUpdate = "=BR_ProjectChanged()"
    MkLabel frm, acHeader, "l_Rel", "Relationship", 5.3, 0.09, 0.85, False, CLR_MUTED
    Set c = MkCombo(frm, acHeader, "cboRelationship", 6.15, 0.06, 2.1, "")
    c.RowSourceType = "Table/Query": c.RowSource = "qptBR_Rels": c.LimitToList = True
    c.ColumnCount = 4: c.ColumnWidths = "1900;500;1000;0": c.ListWidth = 3400 * 1
    c.AfterUpdate = "=BR_RelChanged()"
    Set c = MkButton(frm, acHeader, "btnRelPrev", "<", 8.3, 0.05, 0.28): c.OnClick = "=BR_RelStep(-1)"
    MkLabel frm, acHeader, "lblRelPos", "", 8.6, 0.09, 0.75, False, CLR_MUTED
    Set c = MkButton(frm, acHeader, "btnRelNext", ">", 9.35, 0.05, 0.28): c.OnClick = "=BR_RelStep(1)"
    Set c = MkButton(frm, acHeader, "btnReload", "Reload", 9.7, 0.05, 0.62): c.OnClick = "=BR_Reload()"
    Set c = MkButton(frm, acHeader, "btnUndo", "Undo", 10.36, 0.05, 0.55): c.OnClick = "=BR_Undo()"
    Set c = MkButton(frm, acHeader, "btnPrint", "Print", 10.95, 0.05, 0.6): c.OnClick = "=BR_Print()"
    ' --- header row 2: globals
    MkLabel frm, acHeader, "l_Anchor", "PMT History Date", 0.08, 0.42, 1.1, False, CLR_MUTED
    Set c = MkText(frm, acHeader, "txtAnchor", 0.08, 0.6, 0.85): InputCell c, "mm/dd/yy"
    c.AfterUpdate = "=BR_GlobalChanged(""txtAnchor"")"
    MkLabel frm, acHeader, "l_Cutoff", "Cutoff Date", 1.05, 0.42, 0.85, False, CLR_MUTED
    Set c = MkText(frm, acHeader, "txtCutoff", 1.05, 0.6, 0.85): InputCell c, "mm/dd/yy"
    c.AfterUpdate = "=BR_GlobalChanged(""txtCutoff"")"
    MkLabel frm, acHeader, "l_Yield", "Yield", 2.02, 0.42, 0.5, False, CLR_MUTED
    Set c = MkText(frm, acHeader, "txtYield", 2.02, 0.6, 0.6): InputCell c, "0.00%"
    c.AfterUpdate = "=BR_GlobalChanged(""txtYield"")"
    MkLabel frm, acHeader, "l_J2", "YTM Min Months", 2.72, 0.42, 1.0, False, CLR_MUTED
    Set c = MkText(frm, acHeader, "txtJ2", 2.72, 0.6, 0.55): InputCell c, "0"
    c.AfterUpdate = "=BR_GlobalChanged(""txtJ2"")"
    MkLabel frm, acHeader, "l_TrailDisp", "Trail Selection", 3.4, 0.42, 1.0, False, CLR_MUTED
    Set c = MkCombo(frm, acHeader, "cboTrailDisp", 3.4, 0.6, 1.45, ValueList("TrailDisp"))
    c.DefaultValue = "=""Actual""": c.AfterUpdate = "=BR_GlobalChanged(""cboTrailDisp"")"
    Set c = MkButton(frm, acHeader, "btnResetLoan", "Reset loan", 5.0, 0.6, 0.8): c.OnClick = "=BR_ResetLoan()"
    Set c = MkButton(frm, acHeader, "btnResetAll", "Reset all", 5.85, 0.6, 0.75): c.OnClick = "=BR_ResetAll()"
    Set c = MkButton(frm, acHeader, "btnApplyAll", "Apply to all", 6.65, 0.6, 0.85): c.OnClick = "=BR_ApplyAll()"
    Set c = MkButton(frm, acHeader, "btnExport", "Export .xlsx", 7.55, 0.6, 0.85): c.OnClick = "=BR_Export()"
    MkLabel frm, acHeader, "lblTape", "", 8.5, 0.62, 3.1, False, CLR_MUTED
    ' --- footer status
    MkLabel frm, acFooter, "lblStatus", "Pick a project and relationship.", 0.08, 0.04, 8.6, False, CLR_TEXT2
    MkLabel frm, acFooter, "lblConn", "sqlDueDiligence · MidwestDDi · read-only", 8.8, 0.04, 2.8, False, CLR_MUTED
    frm.Controls("lblConn").TextAlign = 3
    ' --- pages
    Dim pcaps As Variant, hidden As Variant
    pages = Array("pgProj", "pgOptimal", "pgPayHist", "pgColl")
    subs = Array("sub_Proj", "sub_Optimal", "sub_PayHist", "sub_Coll")
    srcs = Array("fsubBR_Proj", "fsubBR_Optimal", "fsubBR_PayHist", "fsubBR_Coll")
    pcaps = Array("Projection", "Optimal", "Pay History", "Collateral")
    hidden = Array("txtSqft", "txtUnits", "txtAcres")
    If USE_TABCTL Then
        Set tb = CreateControl(nm, acTabCtl, acDetail, "", "", CLng(0.05 * T1), CLng(PY * T1), CLng(11.55 * T1), CLng((PH + 0.45) * T1))
        tb.Name = "tabMain"
        For i = 2 To 3
            Set pg = CreateControl(nm, acPage, acDetail, "tabMain")
        Next i
        For i = 0 To 3
            tb.Pages(i).Caption = CStr(pcaps(i))
            tb.Pages(i).Name = CStr(pages(i))
        Next i
        On Error Resume Next
        tb.Style = 0: tb.BackStyle = 1: tb.FontName = FONT: tb.FontSize = 10: tb.FontBold = True
        On Error GoTo 0
        tb.OnChange = "=BR_TabChanged()"
        For i = 0 To 3
            Set c = CreateControl(nm, acSubform, acDetail, CStr(pages(i)), "", CLng(0.15 * T1), CLng((PY + 0.9) * T1), CLng(11.3 * T1), CLng((PH - 0.6) * T1))
            c.Name = CStr(subs(i)): c.SourceObject = CStr(srcs(i))
            SafeSet c, "VerticalAnchor", 2
        Next i
        ' Optimal page strip
        MkLabel frm, acDetail, "l_OptLoan", "Loan", 0.2, PY + 0.4, 0.4, False, CLR_MUTED, "pgOptimal"
        Set c = MkCombo(frm, acDetail, "cboOptLoan", 0.6, PY + 0.38, 1.4, "", "pgOptimal")
        c.RowSourceType = "Value List": c.RowSource = """*"""
        c.AfterUpdate = "=BR_OptLoanChanged()"
        hs = Array("YTM", "CY", "MOIC")
        hcaps = Array("Hurdle YTM", "Hurdle 12M CY", "Hurdle MOIC")
        x = 2.2
        For j = 0 To 2
            MkLabel frm, acDetail, "l_H" & hs(j), CStr(hcaps(j)), x, PY + 0.4, 0.95, False, CLR_MUTED, "pgOptimal"
            Set c = MkText(frm, acDetail, "txtH" & hs(j), x + 0.95, PY + 0.38, 0.6, "", "pgOptimal")
            InputCell c, IIf(hs(j) = "MOIC", "0.00", "0.00%")
            c.AfterUpdate = "=BR_HurdleChanged()"
            x = x + 1.65
        Next j
        Set c = MkButton(frm, acDetail, "btnUseMonth", "Use month as Exit", 7.3, PY + 0.37, 1.35, "pgOptimal")
        c.OnClick = "=BR_UseMonth()"
        MkLabel frm, acDetail, "l_MinH", "Min hurdle month  (YTM / CY / MOIC / All):", 0.2, PY + 0.66, 2.6, False, CLR_MUTED, "pgOptimal"
        hs = Array("YTM", "CY", "MOIC", "All")
        For j = 0 To 3
            For i = 1 To NCOLS
                Set c = MkText(frm, acDetail, "s" & i & "_" & hs(j), 2.85 + (i - 1) * 0.62, PY + 0.66, 0.58, "", "pgOptimal")
                c.Visible = False
            Next i
            Set c = MkText(frm, acDetail, "sT_" & hs(j), 2.85 + j * 0.62, PY + 0.66, 0.58, "", "pgOptimal")
            ResultCell c, "0;-0;0;""—"""
        Next j
        ' Collateral page strip: what-if
        MkLabel frm, acDetail, "l_Calc", "Valuation Calc:", 0.2, PY + 0.4, 1.0, True, CLR_TEXT2, "pgColl"
        Set c = MkCombo(frm, acDetail, "cboUnitSel", 1.25, PY + 0.38, 0.6, """SF"";""Unit"";""Acre""", "pgColl")
        c.DefaultValue = "=""Unit"""
        MkLabel frm, acDetail, "l_UnitVal", "Value/unit", 1.95, PY + 0.4, 0.7, False, CLR_MUTED, "pgColl"
        Set c = MkText(frm, acDetail, "txtUnitVal", 2.65, PY + 0.38, 0.75, "", "pgColl"): InputCell c, "$#,##0"
        MkLabel frm, acDetail, "l_CalcVal", "= Property Value (selected row):", 3.5, PY + 0.4, 2.0, False, CLR_MUTED, "pgColl"
        Set c = MkText(frm, acDetail, "txtCalcVal", 5.5, PY + 0.38, 0.95, _
            "=IIf([cboUnitSel]=""SF"",Nz([txtSqft],0),IIf([cboUnitSel]=""Unit"",Nz([txtUnits],0),Nz([txtAcres],0)))*Nz([txtUnitVal],0)", "pgColl")
        ResultCell c, "$#,##0"
        For j = 0 To 2
            Set c = MkText(frm, acDetail, CStr(hidden(j)), 6.6 + j * 0.5, PY + 0.38, 0.45, "", "pgColl")
            c.Visible = False
        Next j
    Else
        ' fallback: overlapping subforms toggled by a label strip
        For i = 0 To 3
            Set c = CreateControl(nm, acLabel, acDetail, "", "", CLng((0.1 + i * 1.5) * T1), CLng(PY * T1), CLng(1.4 * T1), CLng(0.26 * T1))
            c.Name = "tabLbl" & i: c.Caption = CStr(pcaps(i))
            c.FontName = FONT: c.FontBold = True: c.ForeColor = CLR_TITLE
            c.OnClick = "=BR_ShowPage(" & i & ")"
        Next i
        For i = 0 To 3
            Set c = CreateControl(nm, acSubform, acDetail, "", "", CLng(0.1 * T1), CLng((PY + 0.35) * T1), CLng(11.4 * T1), CLng(PH * T1))
            c.Name = CStr(subs(i)): c.SourceObject = CStr(srcs(i))
            If i > 0 Then c.Visible = False
        Next i
    End If
    frm.OnLoad = "=BR_FormLoad()"
    AssertControls frm, 320
    SaveAs nm, "frmBidReader"
End Sub

' ---------------------------------------------------------------- helpers
Private Function NewSheetForm(Optional recordSource As String = "", Optional viewMode As Integer = 0) As Form
    Dim frm As Form
    Set frm = CreateForm
    If Len(recordSource) > 0 Then frm.RecordSource = recordSource
    frm.DefaultView = viewMode
    frm.Section(acDetail).BackColor = CLR_WHITE
    frm.RecordSelectors = False
    frm.NavigationButtons = False
    frm.DividingLines = False
    On Error Resume Next
    frm.ScrollBars = 2
    If viewMode = 1 Then frm.Section(acDetail).AlternateBackColor = CLR_BAND
    On Error GoTo 0
    Set NewSheetForm = frm
End Function

Private Sub EnsureHdrFtr(frm As Form)
    On Error Resume Next
    If Not frm.Section(acHeader).Visible Then frm.Section(acHeader).Visible = True
    If Err.Number <> 0 Then
        Err.Clear
        DoCmd.RunCommand acCmdFormHdrFtr
    End If
    Err.Clear
    On Error GoTo 0
End Sub

Private Function MkText(frm As Form, sec As Long, nm As String, x As Single, y As Single, w As Single, _
                        Optional src As String = "", Optional parentPage As String = "") As Control
    Dim c As Control
    Set c = CreateControl(frm.Name, acTextBox, sec, parentPage, src, CLng(x * T1), CLng(y * T1), CLng(w * T1), CLng(0.2 * T1))
    c.Name = nm
    c.FontName = FONT: c.FontSize = 9
    Set MkText = c
End Function

Private Function MkCombo(frm As Form, sec As Long, nm As String, x As Single, y As Single, w As Single, _
                         valueList As String, Optional parentPage As String = "") As Control
    Dim c As Control
    Set c = CreateControl(frm.Name, acComboBox, sec, parentPage, "", CLng(x * T1), CLng(y * T1), CLng(w * T1), CLng(0.2 * T1))
    c.Name = nm
    If Len(valueList) > 0 Then
        c.RowSourceType = "Value List"
        c.RowSource = valueList
        c.LimitToList = True
    End If
    c.FontName = FONT: c.FontSize = 9
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_BORDER: c.SpecialEffect = 0: c.AutoExpand = True
    On Error GoTo 0
    Set MkCombo = c
End Function

Private Function MkLabel(frm As Form, sec As Long, nm As String, cap As String, x As Single, y As Single, w As Single, _
                         bold As Boolean, clr As Long, Optional parentPage As String = "") As Control
    Dim c As Control
    Set c = CreateControl(frm.Name, acLabel, sec, parentPage, "", CLng(x * T1), CLng(y * T1), CLng(w * T1), CLng(0.19 * T1))
    c.Name = nm: c.Caption = cap
    c.FontName = FONT: c.FontSize = 8: c.FontBold = bold: c.ForeColor = clr
    Set MkLabel = c
End Function

Private Function MkButton(frm As Form, sec As Long, nm As String, cap As String, x As Single, y As Single, w As Single, _
                          Optional parentPage As String = "") As Control
    Dim c As Control
    Set c = CreateControl(frm.Name, acCommandButton, sec, parentPage, "", CLng(x * T1), CLng(y * T1), CLng(w * T1), CLng(0.24 * T1))
    c.Name = nm: c.Caption = cap
    On Error Resume Next
    c.UseTheme = False: c.BackColor = CLR_BTN: c.ForeColor = CLR_TEXT: c.BorderColor = 12566463
    c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
    Set MkButton = c
End Function

Private Sub GridBorder(c As Control)
    c.BackStyle = 1: c.BorderStyle = 1: c.BorderColor = CLR_BORDER: c.SpecialEffect = 0
    c.FontName = FONT: c.FontSize = 9
End Sub

Private Sub DataCell(c As Control, fmt As String)
    GridBorder c
    c.BackColor = CLR_WHITE: c.ForeColor = CLR_TEXT
    c.Locked = True: c.TabStop = False: c.TextAlign = 3
    If Len(fmt) > 0 Then c.Format = fmt
End Sub

Private Sub InputCell(c As Control, fmt As String)
    GridBorder c
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.TextAlign = 3
    If Len(fmt) > 0 Then c.Format = fmt
    AddFocusFC c
End Sub

Private Sub ResultCell(c As Control, fmt As String)
    GridBorder c
    c.BackColor = CLR_RESBG: c.ForeColor = CLR_GREEN: c.FontBold = True
    c.Locked = True: c.TabStop = False: c.TextAlign = 3
    If Len(fmt) > 0 Then c.Format = fmt
End Sub

Private Sub HeadCell(c As Control)
    GridBorder c
    c.BackColor = 15921906: c.ForeColor = CLR_TEXT: c.FontBold = True
    c.Locked = True: c.TabStop = False: c.TextAlign = 2: c.FontSize = 8
End Sub

Private Sub AddFocusFC(c As Control)
    On Error Resume Next
    With c.FormatConditions.Add(acFieldHasFocus)
        .BackColor = CLR_FOCUS
    End With
    Err.Clear
End Sub

Private Sub AddExprFC(c As Control, expr As String, clrTrue As Long, clrFalse As Long)
    On Error Resume Next
    With c.FormatConditions.Add(acExpression, , expr)
        .ForeColor = clrTrue
        .FontBold = True
    End With
    With c.FormatConditions.Add(acExpression, , "Not (" & expr & ")")
        .ForeColor = clrFalse
    End With
    Err.Clear
End Sub

Private Sub SafeSet(c As Control, propName As String, val As Variant)
    On Error Resume Next
    CallByName c, propName, VbLet, val
    Err.Clear
End Sub

Private Sub AssertControls(frm As Form, maxN As Long)
    If frm.Controls.Count > maxN Then Err.Raise vbObjectError + 100, , _
        frm.Name & " has " & frm.Controls.Count & " controls (limit " & maxN & ")"
End Sub

Private Sub DropForm(nm As String)
    On Error Resume Next
    DoCmd.Close acForm, nm, acSaveNo
    DoCmd.DeleteObject acForm, nm
    Err.Clear
End Sub

Private Sub SaveAs(tempName As String, finalName As String)
    DoCmd.Close acForm, tempName, acSaveYes
    DoCmd.Rename finalName, acForm, tempName
End Sub
