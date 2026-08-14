Attribute VB_Name = "BuildFrontEnd"
Option Compare Database
Option Explicit

' =====================================================================
' MidwestDDi Access Front-End Builder  (v4 - React-styled dark theme)
'
' Builds a linked front-end styled after the LOANSYSTEM React app:
' dark zinc backgrounds, green accents, red flag panel, pinned loan
' grid, and a tab strip (Loan / Collateral / Tasks / Overview /
' Strategies) below it.
'
'   frmBrowser           dark relationship browser (dbl-click to open)
'   frmWorkbench         header bar + relationship bar + pinned loan
'                        grid + flag card + tab control
'   frmLoanGrid          dark continuous loan grid, Total in green,
'                        dbl-click loan no -> frmLoanDetail
'   frmLoanDetail        dark editable loan panel (popup)
'   frmCollateralGrid    dark continuous collateral grid
'   frmCollateralDetail  dark editable collateral panel (popup)
'   frmTasks             dark task cards + perpetual new-entry row
'
' HOW TO USE (same as before)
'   1. Blank .accdb on a machine with the sqlDueDiligence DSN
'   2. Alt+F11 -> File -> Import File -> this .bas
'   3. Ctrl+G -> type BuildAll -> Enter
'   4. Open frmBrowser
' Re-running BuildAll rebuilds everything.
' =====================================================================

Private Const CONNECT As String = _
    "ODBC;DSN=sqlDueDiligence;DATABASE=MidwestDDi;Trusted_Connection=Yes;" & _
    "APP=Microsoft Office;Encrypt=Optional;TrustServerCertificate=Yes"

Private Const T1 As Long = 1440       ' twips per inch
Private Const FONT As String = "Segoe UI"

' ---- LOANSYSTEM dark palette - EXACT values from docs/REACT-UI-SPEC.md
' (code-extracted from ThemeContext.tsx; value = r + g*256 + b*65536)
Private Const CLR_MAIN As Long = 0           ' #000000 page (mainBg bg-black)
Private Const CLR_HEADER As Long = 1775640   ' #18181b header/section (zinc-900)
Private Const CLR_CARD As Long = 2301984     ' zinc-800/50 blended over zinc-900
Private Const CLR_INPUT As Long = 1775640    ' #18181b input bg (zinc-900)
Private Const CLR_READONLY As Long = 4603711 ' #3f3f46 readOnlyBg (zinc-700)
Private Const CLR_BORDER As Long = 2762535   ' #27272a borderColor (zinc-800)
Private Const CLR_INBORDER As Long = 5984850 ' #52525b inputBorder (zinc-600)
Private Const CLR_TEXT As Long = 16777215    ' #ffffff textPrimary
Private Const CLR_TEXTSEC As Long = 14407121 ' #d1d5db textSecondary (gray-300)
Private Const CLR_MUTED As Long = 11510684   ' #9ca3af textMuted (gray-400)
Private Const CLR_GREEN As Long = 8445514    ' #4ade80 textGreen (green-400)
Private Const CLR_GREEN5 As Long = 6210850   ' #22c55e green-500 (active accent)
Private Const CLR_RED As Long = 7434744      ' #f87171 textRed (red-400)
Private Const CLR_YELLOW As Long = 1428730   ' #facc15 textYellow (yellow-400)

' ---------------------------------------------------------------------
Public Sub BuildAll()
    On Error GoTo Fail
    LinkTables
    BuildQueries
    BuildFrmLoanDetail
    BuildFrmCollateralDetail
    BuildFrmLoanGrid
    BuildFrmCollateralGrid
    BuildFrmTasks
    BuildFrmWorkbench
    BuildFrmBrowser
    MsgBox "Front-end built successfully." & vbCrLf & vbCrLf & _
           "Open frmBrowser to start.", vbInformation, "LOANSYSTEM (Access)"
    Exit Sub
Fail:
    MsgBox "Build failed: " & Err.Description, vbCritical, "LOANSYSTEM (Access)"
End Sub

' ================= TABLE LINKS (DAO - exact names) ===================
Private Sub LinkTables()
    Dim db As DAO.Database: Set db = CurrentDb
    Dim tables As Variant, i As Integer
    Dim td As DAO.TableDef
    Dim ok As String, bad As String
    tables = Array("tblRelationships", "tblLoan", "CollateralInfo", _
                   "tblTasks", "tblBorrowers", "tblBorrowerLookup", _
                   "tblcomments", "tblPayHistory")
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
            "No tables linked - run TestConnection for the exact ODBC error."
    End If
End Sub

Public Sub TestConnection()
    Dim db As DAO.Database, qd As DAO.QueryDef, rs As DAO.Recordset
    On Error GoTo Fail
    Set db = CurrentDb
    Set qd = db.CreateQueryDef("")
    qd.Connect = CONNECT
    qd.SQL = "SELECT DB_NAME() AS DbName, SUSER_SNAME() AS LoginName, @@SERVERNAME AS ServerName"
    qd.ReturnsRecords = True
    Set rs = qd.OpenRecordset()
    MsgBox "Connection OK!" & vbCrLf & vbCrLf & _
           "Server: " & rs!ServerName & vbCrLf & _
           "Database: " & rs!DbName & vbCrLf & _
           "Login: " & rs!LoginName, vbInformation, "TestConnection"
    rs.Close
    Exit Sub
Fail:
    MsgBox "Connection FAILED:" & vbCrLf & vbCrLf & Err.Description, _
           vbCritical, "TestConnection"
End Sub

Private Sub DropTableDef(db As DAO.Database, nm As String)
    On Error Resume Next
    db.TableDefs.Delete nm
    Err.Clear
    On Error GoTo 0
End Sub

' ================= QUERIES ===========================================
Private Sub BuildQueries()
    Dim db As DAO.Database: Set db = CurrentDb
    DropQuery db, "qryRelationshipSummary"
    db.CreateQueryDef "qryRelationshipSummary", _
        "SELECT r.ProjectName, r.SortNo, r.RelatedLoans, " & _
        "Count(l.MWLoanNo) AS LoanCount, Sum(l.PrincipalBalance) AS TotalUPB, " & _
        "r.InBankruptcy, r.ForeclosureFlag, r.LitigationFlag, " & _
        "r.ForbearanceFlag, r.JudgmentFlag, r.LowYieldAsset, r.ExitCode " & _
        "FROM tblRelationships AS r LEFT JOIN tblLoan AS l " & _
        "ON r.RelatedLoans = l.RelatedLoans " & _
        "GROUP BY r.ProjectName, r.SortNo, r.RelatedLoans, r.InBankruptcy, " & _
        "r.ForeclosureFlag, r.LitigationFlag, r.ForbearanceFlag, " & _
        "r.JudgmentFlag, r.LowYieldAsset, r.ExitCode " & _
        "ORDER BY r.ProjectName, r.SortNo;"

    DropQuery db, "qryLoansSorted"
    db.CreateQueryDef "qryLoansSorted", _
        "SELECT MWLoanNo, RelatedLoans, BorrowerNm, OrigPrincipalBalance, " & _
        "PrincipalBalance, InterestBalance, Rate, RepayAmt, DueDt, LastPmtDt " & _
        "FROM tblLoan ORDER BY PrincipalBalance DESC;"
    db.QueryDefs.Refresh
End Sub

' ================= FORM: LOAN GRID (dark continuous) =================
Private Sub BuildFrmLoanGrid()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmLoanGrid", acForm
    Set frm = NewDarkForm("qryLoansSorted", 1)   ' continuous
    nm = frm.Name
    frm.AllowEdits = False: frm.AllowAdditions = False: frm.AllowDeletions = False
    frm.HasModule = True
    EnsureHeader frm
    frm.Section(acHeader).BackColor = CLR_CARD
    frm.Section(acHeader).Height = 0.24 * T1
    frm.Section(acDetail).Height = 0.26 * T1

    ' Header labels + row cells (dark grid like LoanTable.tsx)
    GridCol frm, "MWLoanNo", "Loan No", 0.1, 1.5, False
    GridCol frm, "BorrowerNm", "Borrower", 1.7, 2.2, False
    GridCol frm, "OrigPrincipalBalance", "Orig Balance", 4#, 1.05, True, "$#,##0"
    GridCol frm, "PrincipalBalance", "Principal", 5.15, 1.05, True, "$#,##0"
    GridCol frm, "InterestBalance", "Interest", 6.3, 0.95, True, "$#,##0"
    ' calculated Total in green (React: styles.textGreen)
    AddHeadLabel frm, "Total", 7.35, 0.95, True
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
        "=[PrincipalBalance]+[InterestBalance]", CLng(7.35 * T1), 0, CLng(0.95 * T1), CLng(0.22 * T1))
    StyleCell c: c.Name = "txtTotal": c.ForeColor = CLR_GREEN
    c.Format = "$#,##0": c.TextAlign = 3
    GridCol frm, "Rate", "Rate", 8.4, 0.6, True, "0.00%"
    GridCol frm, "RepayAmt", "PMT", 9.1, 0.85, True, "$#,##0"
    GridCol frm, "DueDt", "NxtDue", 10.05, 0.8, False, "mm/dd/yy"

    Dim mdl As Module, ln As Long
    frm!txtMWLoanNo.OnDblClick = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("DblClick", "txtMWLoanNo")
    mdl.InsertLines ln + 1, _
        "    DoCmd.OpenForm ""frmLoanDetail"", , , ""MWLoanNo='"" & Me!txtMWLoanNo & ""'"""
    SaveAs nm, "frmLoanGrid"
End Sub

' ================= FORM: COLLATERAL GRID =============================
Private Sub BuildFrmCollateralGrid()
    Dim frm As Form, nm As String
    DropIfExists "frmCollateralGrid", acForm
    Set frm = NewDarkForm("CollateralInfo", 1)
    nm = frm.Name
    frm.AllowEdits = False: frm.AllowAdditions = False: frm.AllowDeletions = False
    frm.HasModule = True
    EnsureHeader frm
    frm.Section(acHeader).BackColor = CLR_CARD
    frm.Section(acHeader).Height = 0.24 * T1
    frm.Section(acDetail).Height = 0.26 * T1

    GridCol frm, "Priority", "Pri", 0.1, 0.4, False
    GridCol frm, "MWPropertyNo", "Prop No", 0.6, 0.8, False
    GridCol frm, "MWCollateralCode", "Code", 1.5, 1.2, False
    GridCol frm, "Description", "Description", 2.8, 1.9, False
    GridCol frm, "City", "City", 4.8, 1#, False
    GridCol frm, "State", "St", 5.9, 0.4, False
    GridCol frm, "SellerAppraisedValue", "SellerValue", 6.4, 1.05, True, "$#,##0"
    GridCol frm, "CurrentAppraisedValue", "MwValue", 7.55, 1.05, True, "$#,##0"
    GridCol frm, "TaxDelinquentAmt", "Dlq Taxes", 8.7, 0.95, True, "$#,##0"

    Dim mdl As Module, ln As Long
    frm!txtMWPropertyNo.OnDblClick = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("DblClick", "txtMWPropertyNo")
    mdl.InsertLines ln + 1, _
        "    DoCmd.OpenForm ""frmCollateralDetail"", , , ""MWPropertyNo="" & Me!txtMWPropertyNo"
    SaveAs nm, "frmCollateralGrid"
End Sub

' ================= FORM: TASKS (dark cards) ==========================
Private Sub BuildFrmTasks()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmTasks", acForm
    Set frm = NewDarkForm("SELECT * FROM tblTasks ORDER BY EntryDate DESC", 1)
    nm = frm.Name
    frm.AllowAdditions = True
    frm.Section(acDetail).Height = 1# * T1
    frm.Section(acDetail).BackColor = CLR_CARD

    DarkBoxL frm, "AcctOfficer", "Task For", 0.15, 0.12, 1#
    DarkBoxL frm, "EntryAcctOfficer", "Entered By", 2.7, 0.12, 1#
    DarkBoxL frm, "EntryDate", "Date", 5.3, 0.12, 1.05
    DarkBoxL frm, "Completed", "Complete", 7.7, 0.12, 0.3
    DarkBoxL frm, "CompleteDate", "Done", 8.9, 0.12, 0.95
    Set c = CreateControl(nm, acTextBox, acDetail, "", "Comment", _
                          CLng(0.15 * T1), CLng(0.5 * T1), CLng(9.7 * T1), CLng(0.42 * T1))
    StyleInput c: c.Name = "Comment": c.ScrollBars = 2
    frm!EntryDate.DefaultValue = "=Now()"
    'frm!KeyGenerator.DefaultValue = "=DMax(""KeyGenerator"",""tblTasks"")+1"  ' if not IDENTITY
    SaveAs nm, "frmTasks"
End Sub

' ================= FORM: LOAN DETAIL (dark popup) ====================
Private Sub BuildFrmLoanDetail()
    Dim frm As Form, nm As String
    DropIfExists "frmLoanDetail", acForm
    Set frm = NewDarkForm("tblLoan", 0)
    nm = frm.Name
    frm.Caption = "Loan Detail"
    frm.PopUp = True
    CardRect frm, 0.1, 0.1, 3.5, 4.6      ' identity card
    CardRect frm, 3.7, 0.1, 2.9, 4.6      ' balances card
    CardRect frm, 6.7, 0.1, 2.9, 4.6      ' dates/rates card
    CardRect frm, 9.7, 0.1, 2.7, 4.6      ' rate structure card

    Dim y As Single: y = 0.25
    DarkBoxL frm, "MWLoanNo", "MW Loan #", 0.2, y, 1.9, True: y = y + 0.42
    DarkBoxL frm, "BorrowerNm", "Borrower", 0.2, y, 1.9: y = y + 0.42
    DarkBoxL frm, "RelatedLoans", "Relationship", 0.2, y, 1.9: y = y + 0.42
    DarkBoxL frm, "Pool", "Pool", 0.2, y, 1.9: y = y + 0.42
    DarkBoxL frm, "consumerloan", "Consumer Loan", 0.2, y, 0.3: y = y + 0.42
    DarkBoxL frm, "BorrowerAddress", "Address 1", 0.2, y, 1.9: y = y + 0.42
    DarkBoxL frm, "BorrowerAddress2", "Address 2", 0.2, y, 1.9: y = y + 0.42
    DarkBoxL frm, "CityNm", "City", 0.2, y, 1.9: y = y + 0.42
    DarkBoxL frm, "StCd", "State", 0.2, y, 0.6
    DarkBoxL frm, "ZipCd", "Zip", 1.9, y, 0.85: y = y + 0.42
    DarkBoxL frm, "LastImport", "Last Import", 0.2, y, 1.9

    y = 0.25
    DarkBoxL frm, "OrigPrincipalBalance", "Orig Balance", 3.8, y, 1.35, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "PrincipalBalance", "Principal", 3.8, y, 1.35, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "InterestBalance", "Interest", 3.8, y, 1.35, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "EscrowBalance", "Escrow", 3.8, y, 1.35, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "OtherBalances", "Other", 3.8, y, 1.35, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "PayoffBalance", "Payoff", 3.8, y, 1.35, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "RepayAmt", "Payment", 3.8, y, 1.35, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "EscrowPmt", "Escrow Pmt", 3.8, y, 1.35, False, "$#,##0"

    y = 0.25
    DarkBoxL frm, "OrgNoteDate", "Orig Dt", 6.8, y, 1.25, False, "mm/dd/yy": y = y + 0.42
    DarkBoxL frm, "InterestAccrualDate", "Acc Dt", 6.8, y, 1.25, False, "mm/dd/yy": y = y + 0.42
    DarkBoxL frm, "DueDt", "Due Dt", 6.8, y, 1.25, False, "mm/dd/yy": y = y + 0.42
    DarkBoxL frm, "LastPmtDt", "Last PMT", 6.8, y, 1.25, False, "mm/dd/yy": y = y + 0.42
    DarkBoxL frm, "CurrentMaturityDate", "Mat Dt", 6.8, y, 1.25, False, "mm/dd/yy": y = y + 0.42
    DarkBoxL frm, "Rate", "Int Rate", 6.8, y, 1.25, False, "0.00%": y = y + 0.42
    DarkBoxL frm, "DefaultRate", "Default Rate", 6.8, y, 1.25, False, "0.00%": y = y + 0.42
    DarkBoxL frm, "nextchangedt", "Change Dt", 6.8, y, 1.25, False, "mm/dd/yy"

    y = 0.25
    DarkBoxL frm, "RateType", "Rate Type", 9.8, y, 1.25: y = y + 0.42
    DarkBoxL frm, "index", "Index", 9.8, y, 1.25: y = y + 0.42
    DarkBoxL frm, "margin", "Margin", 9.8, y, 1.25, False, "0.00%": y = y + 0.42
    DarkBoxL frm, "floor", "Floor", 9.8, y, 1.25, False, "0.00%": y = y + 0.42
    DarkBoxL frm, "ceiling", "Ceiling", 9.8, y, 1.25, False, "0.00%": y = y + 0.42
    DarkBoxL frm, "changefreq", "Change Freq", 9.8, y, 1.25: y = y + 0.42
    DarkBoxL frm, "AssetType", "Asset Type", 9.8, y, 1.25: y = y + 0.42
    DarkBoxL frm, "[Unfunded Commitment]", "Unfunded", 9.8, y, 1.25

    SaveAs nm, "frmLoanDetail"
End Sub

' ================= FORM: COLLATERAL DETAIL ===========================
Private Sub BuildFrmCollateralDetail()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmCollateralDetail", acForm
    Set frm = NewDarkForm("CollateralInfo", 0)
    nm = frm.Name
    frm.Caption = "Collateral Detail"
    frm.PopUp = True
    CardRect frm, 0.1, 0.1, 3.6, 5#
    CardRect frm, 3.8, 0.1, 3.1, 5#
    CardRect frm, 7#, 0.1, 3.2, 5#

    Dim y As Single: y = 0.25
    DarkBoxL frm, "MWPropertyNo", "Property No", 0.2, y, 1.7, True: y = y + 0.42
    DarkBoxL frm, "MWCollateralCode", "Code", 0.2, y, 1.7: y = y + 0.42
    DarkBoxL frm, "Description", "Description", 0.2, y, 1.7: y = y + 0.42
    DarkBoxL frm, "OwnerName", "Owner", 0.2, y, 1.7: y = y + 0.42
    DarkBoxL frm, "Address", "Address", 0.2, y, 1.7: y = y + 0.42
    DarkBoxL frm, "City", "City", 0.2, y, 1.7: y = y + 0.42
    DarkBoxL frm, "State", "State", 0.2, y, 0.6
    DarkBoxL frm, "Zip", "Zip", 1.8, y, 0.9: y = y + 0.42
    DarkBoxL frm, "County", "County", 0.2, y, 1.7: y = y + 0.42
    DarkBoxL frm, "TaxParcelIDNO", "Parcel Id", 0.2, y, 1.7: y = y + 0.42
    DarkBoxL frm, "Latitude", "Latitude", 0.2, y, 1.7: y = y + 0.42
    DarkBoxL frm, "Longitude", "Longitude", 0.2, y, 1.7

    y = 0.25
    DarkBoxL frm, "LienPosition", "Seller Lien", 3.9, y, 1.3: y = y + 0.42
    DarkBoxL frm, "SeniorLienAmount", "Sr Lien Amt", 3.9, y, 1.3, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "MWTitleLienPosition", "MW Lien", 3.9, y, 1.3: y = y + 0.42
    DarkBoxL frm, "MWTitleSrLienAmt", "MW Sr Lien", 3.9, y, 1.3, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "TaxAnnualAmt", "Taxes / Yr", 3.9, y, 1.3, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "TaxDelinquentAmt", "Delq Amt", 3.9, y, 1.3, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "TaxAssessedValue", "TAV", 3.9, y, 1.3, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "TaxMarketValue", "TMV", 3.9, y, 1.3, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "TaxStatementDate", "Stmt Date", 3.9, y, 1.3, False, "mm/dd/yy"

    y = 0.25
    DarkBoxL frm, "SQFT", "Sq Ft", 7.1, y, 1.3, False, "#,##0": y = y + 0.42
    DarkBoxL frm, "NumUnits", "Units", 7.1, y, 1.3: y = y + 0.42
    DarkBoxL frm, "Acreage", "Acres", 7.1, y, 1.3: y = y + 0.42
    DarkBoxL frm, "CurrentAppraisedValue", "MW Value", 7.1, y, 1.3, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "SellerAppraisedValue", "Seller Value", 7.1, y, 1.3, False, "$#,##0": y = y + 0.42
    DarkBoxL frm, "PossibleEnvironmental", "Environmental", 7.1, y, 0.3: y = y + 0.42
    DarkBoxL frm, "IsFloodZone", "Flood Zone", 7.1, y, 0.3: y = y + 0.42
    DarkBoxL frm, "RealEstateGroup", "Group", 7.1, y, 1.3: y = y + 0.42
    DarkBoxL frm, "TaxWebCard", "Tax Card", 7.1, y, 1.3

    AddThemedLabel frm, "Prop Detail", 0.2, 5.25, CLR_MUTED, 8
    Set c = CreateControl(nm, acTextBox, acDetail, "", "PropertyComment", _
                          CLng(0.2 * T1), CLng(5.5 * T1), CLng(9.9 * T1), CLng(1# * T1))
    StyleInput c: c.Name = "PropertyComment": c.ScrollBars = 2
    SaveAs nm, "frmCollateralDetail"
End Sub

' ================= FORM: WORKBENCH ===================================
Private Sub BuildFrmWorkbench()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmWorkbench", acForm
    Set frm = NewDarkForm("tblRelationships", 0)
    nm = frm.Name
    frm.Caption = "LOANSYSTEM"
    frm.HasModule = True

    ' --- Brand bar (React Header: zinc-900, LOAN white + SYSTEM green) ---
    Set c = CreateControl(nm, acRectangle, acDetail, "", "", 0, 0, CLng(12.6 * T1), CLng(0.38 * T1))
    c.BackStyle = 1: c.BackColor = CLR_HEADER: c.BorderStyle = 0: c.SpecialEffect = 0
    AddThemedLabel frm, "LOAN", 0.15, 0.06, CLR_TEXT, 12, True
    AddThemedLabel frm, "SYSTEM", 0.72, 0.06, CLR_GREEN, 12, True

    ' --- Menu bar (React MenuBar: 8 muted items) ---
    Set c = CreateControl(nm, acRectangle, acDetail, "", "", 0, CLng(0.38 * T1), CLng(12.6 * T1), CLng(0.28 * T1))
    c.BackStyle = 1: c.BackColor = CLR_HEADER: c.BorderStyle = 0: c.SpecialEffect = 0
    Dim menus As Variant, mi As Integer, mx As Single
    menus = Array("File", "Home", "Create", "Import", "Export", "Reports", "Tools", "Admin")
    mx = 0.15
    For mi = 0 To UBound(menus)
        AddThemedLabel frm, CStr(menus(mi)), mx, 0.43, CLR_MUTED, 9
        mx = mx + 0.62
    Next mi

    ' --- Relationship bar ---
    AddThemedLabel frm, "Relationship:", 0.15, 0.78, CLR_MUTED, 9
    DarkBox frm, "RelatedLoans", 1.25, 0.76, 1.5, True
    AddThemedLabel frm, "Sort", 3#, 0.78, CLR_MUTED, 9
    DarkBox frm, "SortNo", 3.4, 0.76, 0.5, True
    AddThemedLabel frm, "Project", 4.1, 0.78, CLR_MUTED, 9
    DarkBox frm, "ProjectName", 4.7, 0.76, 1.7, True
    AddThemedLabel frm, "Exit Code", 6.6, 0.78, CLR_MUTED, 9
    DarkBox frm, "ExitCode", 7.35, 0.76, 1.2
    Set c = CreateControl(nm, acCommandButton, acDetail, "", "", _
                          CLng(10.7 * T1), CLng(0.74 * T1), CLng(1.75 * T1), CLng(0.28 * T1))
    c.Name = "btnBrowse": c.Caption = "Browse Relationships"
    On Error Resume Next
    c.UseTheme = False: c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXTSEC
    c.BorderColor = CLR_INBORDER: c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0

    ' --- Pinned loan grid + flag card (React LoanTable + flag panel) ---
    AddSub frm, "frmLoanGrid", "subLoans", 0.15, 1.15, 10.2, 2#
    CardRect frm, 10.45, 1.15, 2.05, 2#
    AddThemedLabel frm, "Relationship Flags", 10.55, 1.23, CLR_MUTED, 8
    Dim flags As Variant, caps As Variant, i As Integer, y As Single
    flags = Array("InBankruptcy", "ForeclosureFlag", "LitigationFlag", _
                  "ForbearanceFlag", "JudgmentFlag", "LowYieldAsset")
    caps = Array("Bankruptcy", "Foreclosure", "Litigation", _
                 "Forbearance", "Judgment", "Low Yield Asset")
    y = 1.5
    For i = 0 To UBound(flags)
        FlagCheck frm, CStr(flags(i)), CStr(caps(i)), 10.6, y
        y = y + 0.26
    Next i

    ' --- Tab strip: FULL 13 tabs in the React TABS order ---
    Dim tb As Control, pg As Control
    Set tb = CreateControl(nm, acTabCtl, acDetail, "", "", _
                           CLng(0.15 * T1), CLng(3.3 * T1), CLng(12.45 * T1), CLng(4.5 * T1))
    tb.Name = "tabMain"
    On Error Resume Next
    tb.BackStyle = 0
    tb.Style = 0
    On Error GoTo 0

    ' React TABS order: Loan, Borrower, Collateral, Comment, BPOTitleUCC,
    ' PayHist, FinStmts, Projections, Strategies, Tasks, Overview,
    ' Property, Report  (docs/REACT-UI-SPEC.md)
    Dim tabNames As Variant
    tabNames = Array("Loan", "Borrower", "Collateral", "Comment", "BPOTitleUCC", _
                     "PayHist", "FinStmts", "Projections", "Strategies", "Tasks", _
                     "Overview", "Property", "Report")
    ' Tab control ships with 2 pages; add the other 11
    For i = 2 To UBound(tabNames)
        Set pg = CreateControl(nm, acPage, acDetail, "tabMain")
    Next i
    For i = 0 To UBound(tabNames)
        tb.Pages(i).Caption = tabNames(i)
        tb.Pages(i).Name = "pg" & tabNames(i)
    Next i

    Const PY As Single = 3.72          ' content top inside tab body
    Const PH As Single = 3.9           ' content height

    ' Loan page: editable detail subform (navigate loans with record arrows)
    Set c = CreateControl(nm, acSubform, acDetail, "pgLoan", "", _
                          CLng(0.3 * T1), CLng(PY * T1), CLng(12# * T1), CLng(PH * T1))
    c.Name = "subLoanDetail": c.SourceObject = "frmLoanDetail"

    ' Borrower / Comment / PayHist pages: raw table datasheets until the
    ' production schemas are confirmed (Phase 4 exports)
    Set c = CreateControl(nm, acSubform, acDetail, "pgBorrower", "", _
                          CLng(0.3 * T1), CLng(PY * T1), CLng(12# * T1), CLng(PH * T1))
    c.Name = "subBorrowers": c.SourceObject = "Table.tblBorrowers"
    Set c = CreateControl(nm, acSubform, acDetail, "pgComment", "", _
                          CLng(0.3 * T1), CLng(PY * T1), CLng(12# * T1), CLng(PH * T1))
    c.Name = "subComments": c.SourceObject = "Table.tblcomments"
    Set c = CreateControl(nm, acSubform, acDetail, "pgPayHist", "", _
                          CLng(0.3 * T1), CLng(PY * T1), CLng(12# * T1), CLng(PH * T1))
    c.Name = "subPayHist": c.SourceObject = "Table.tblPayHistory"

    ' Collateral page
    Set c = CreateControl(nm, acSubform, acDetail, "pgCollateral", "", _
                          CLng(0.3 * T1), CLng(PY * T1), CLng(12# * T1), CLng(PH * T1))
    c.Name = "subCollateral": c.SourceObject = "frmCollateralGrid"

    ' Tasks page
    Set c = CreateControl(nm, acSubform, acDetail, "pgTasks", "", _
                          CLng(0.3 * T1), CLng(PY * T1), CLng(12# * T1), CLng(PH * T1))
    c.Name = "subTasks": c.SourceObject = "frmTasks"

    ' Overview page: the three narratives (bound to tblRelationships)
    AddPageLabel frm, "pgOverview", "Relationship Overview", 0.3, PY
    Set c = CreateControl(nm, acTextBox, acDetail, "pgOverview", "RelationshipOverview", _
                          CLng(0.3 * T1), CLng((PY + 0.25) * T1), CLng(5.9 * T1), CLng(1.5 * T1))
    StyleInput c: c.Name = "RelationshipOverview": c.ScrollBars = 2
    AddPageLabel frm, "pgOverview", "Collateral Overview", 6.4, PY
    Set c = CreateControl(nm, acTextBox, acDetail, "pgOverview", "CollateralOverview", _
                          CLng(6.4 * T1), CLng((PY + 0.25) * T1), CLng(5.9 * T1), CLng(1.5 * T1))
    StyleInput c: c.Name = "CollateralOverview": c.ScrollBars = 2
    AddPageLabel frm, "pgOverview", "Bid Conditions", 0.3, PY + 1.95
    Set c = CreateControl(nm, acTextBox, acDetail, "pgOverview", "ConditionsDeadlines", _
                          CLng(0.3 * T1), CLng((PY + 2.2) * T1), CLng(12# * T1), CLng(1.2 * T1))
    StyleInput c: c.Name = "ConditionsDeadlines": c.ScrollBars = 2

    ' Strategies page
    AddPageLabel frm, "pgStrategies", "Exit Strategy", 0.3, PY
    Set c = CreateControl(nm, acTextBox, acDetail, "pgStrategies", "ExitStrategyOverview", _
                          CLng(0.3 * T1), CLng((PY + 0.25) * T1), CLng(12# * T1), CLng(2.4 * T1))
    StyleInput c: c.Name = "ExitStrategyOverview": c.ScrollBars = 2
    AddPageLabel frm, "pgStrategies", "Original Strategy", 0.3, PY + 2.8
    Set c = CreateControl(nm, acTextBox, acDetail, "pgStrategies", "Original_Strategy", _
                          CLng(0.3 * T1), CLng((PY + 3.05) * T1), CLng(12# * T1), CLng(0.6 * T1))
    StyleInput c: c.Name = "Original_Strategy": c.ScrollBars = 2

    ' Placeholder pages (mirrors the React "Coming soon" default case)
    AddPageLabel frm, "pgBPOTitleUCC", "BPOTitleUCC tab content - Coming soon", 4.5, PY + 1.5
    AddPageLabel frm, "pgFinStmts", "FinStmts tab content - Coming soon", 4.5, PY + 1.5
    AddPageLabel frm, "pgProjections", "Projections modeling lives in the React app", 4.2, PY + 1.5
    AddPageLabel frm, "pgProperty", "Property tab content - Coming soon", 4.5, PY + 1.5
    AddPageLabel frm, "pgReport", "Investor reports live in the React app", 4.3, PY + 1.5

    ' Button + subform wiring
    Dim mdl As Module, ln As Long
    frm!btnBrowse.OnClick = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("Click", "btnBrowse")
    mdl.InsertLines ln + 1, "    DoCmd.OpenForm ""frmBrowser"""

    SaveAs nm, "frmWorkbench"

    DoCmd.OpenForm "frmWorkbench", acDesign
    Dim f As Form: Set f = Forms("frmWorkbench")
    f!subLoans.LinkMasterFields = "RelatedLoans": f!subLoans.LinkChildFields = "RelatedLoans"
    f!subLoanDetail.LinkMasterFields = "RelatedLoans": f!subLoanDetail.LinkChildFields = "RelatedLoans"
    f!subCollateral.LinkMasterFields = "RelatedLoans": f!subCollateral.LinkChildFields = "RelatedLoans"
    f!subTasks.LinkMasterFields = "RelatedLoans": f!subTasks.LinkChildFields = "RelatedLoans"
    ' Borrower/Comment/PayHist datasheets stay unlinked until their
    ' production schemas are confirmed (see INTERFACE-ALIGNMENT-PLAN Phase 4)
    DoCmd.Close acForm, "frmWorkbench", acSaveYes
End Sub

' ================= FORM: BROWSER =====================================
Private Sub BuildFrmBrowser()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmBrowser", acForm
    Set frm = NewDarkForm("qryRelationshipSummary", 1)
    nm = frm.Name
    frm.Caption = "Relationships"
    frm.AllowEdits = False: frm.AllowAdditions = False: frm.AllowDeletions = False
    frm.HasModule = True
    EnsureHeader frm
    frm.Section(acHeader).BackColor = CLR_HEADER
    frm.Section(acHeader).Height = 0.55 * T1
    frm.Section(acDetail).Height = 0.28 * T1

    Dim t As Control
    Set t = CreateControl(nm, acLabel, acHeader, "", "", CLng(0.15 * T1), CLng(0.05 * T1), CLng(3 * T1), CLng(0.25 * T1))
    t.Caption = "Relationships": t.ForeColor = CLR_TEXT: t.FontName = FONT
    t.FontSize = 12: t.FontBold = True
    AddHeadLabel frm, "Project", 0.15, 1.6, False, 0.32
    AddHeadLabel frm, "Sort", 1.85, 0.45, False, 0.32
    AddHeadLabel frm, "Relationship", 2.4, 1.5, False, 0.32
    AddHeadLabel frm, "Loans", 4#, 0.55, True, 0.32
    AddHeadLabel frm, "Total UPB", 4.65, 1.15, True, 0.32
    AddHeadLabel frm, "Exit Code", 5.9, 1.15, False, 0.32
    AddHeadLabel frm, "Flags", 7.15, 2#, False, 0.32

    GridCell frm, "ProjectName", 0.15, 1.6
    GridCell frm, "SortNo", 1.85, 0.45
    Dim rel As Control
    Set rel = GridCell(frm, "RelatedLoans", 2.4, 1.5)
    rel.ForeColor = CLR_GREEN
    GridCell frm, "LoanCount", 4#, 0.55, True
    GridCell frm, "TotalUPB", 4.65, 1.15, True, "$#,##0"
    GridCell frm, "ExitCode", 5.9, 1.15

    ' Flag badges: compact initials in red (React badge row)
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
        "=IIf([InBankruptcy],""BK "","""") & IIf([ForeclosureFlag],""FC "","""") & " & _
        "IIf([LitigationFlag],""LT "","""") & IIf([ForbearanceFlag],""FA "","""") & " & _
        "IIf([JudgmentFlag],""JG "","""") & IIf([LowYieldAsset],""LYA"","""")", _
        CLng(7.15 * T1), 0, CLng(2# * T1), CLng(0.24 * T1))
    StyleCell c: c.Name = "txtFlags": c.ForeColor = CLR_RED: c.FontBold = True

    Dim mdl As Module, ln As Long
    frm!txtRelatedLoans.OnDblClick = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("DblClick", "txtRelatedLoans")
    mdl.InsertLines ln + 1, _
        "    DoCmd.OpenForm ""frmWorkbench"", , , ""RelatedLoans='"" & Me!txtRelatedLoans & ""'"""
    SaveAs nm, "frmBrowser"
End Sub

' ================= THEME HELPERS =====================================
Private Function NewDarkForm(recordSource As String, viewMode As Integer) As Form
    Dim frm As Form
    Set frm = CreateForm
    frm.RecordSource = recordSource
    frm.DefaultView = viewMode          ' 0 single, 1 continuous, 2 datasheet
    frm.Section(acDetail).BackColor = CLR_MAIN
    frm.RecordSelectors = False
    frm.NavigationButtons = (viewMode = 0)
    frm.DividingLines = False
    On Error Resume Next
    frm.ScrollBars = 2
    On Error GoTo 0
    Set NewDarkForm = frm
End Function

Private Sub EnsureHeader(frm As Form)
    ' Toggle header/footer on (CreateForm gives detail-only)
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

Private Sub StyleCell(c As Control)
    ' Read-only grid cell look
    c.BackStyle = 0                     ' transparent over dark detail
    c.BorderStyle = 0
    c.ForeColor = CLR_TEXT
    c.FontName = FONT
    c.FontSize = 8
    c.Locked = True
    c.TabStop = False
End Sub

Private Sub StyleInput(c As Control)
    ' Editable input look (dark input with border, like React inputs)
    c.BackStyle = 1
    c.BackColor = CLR_INPUT
    c.ForeColor = CLR_TEXT
    c.BorderStyle = 1
    c.BorderColor = CLR_INBORDER
    c.SpecialEffect = 0
    c.FontName = FONT
    c.FontSize = 9
End Sub

Private Function GridCell(frm As Form, src As String, xIn As Single, wIn As Single, _
                          Optional rightAlign As Boolean = False, _
                          Optional fmt As String = "") As Control
    Dim c As Control
    Set c = CreateControl(frm.Name, acTextBox, acDetail, "", src, _
                          CLng(xIn * T1), 0, CLng(wIn * T1), CLng(0.24 * T1))
    StyleCell c
    c.Name = "txt" & Replace(Replace(src, "[", ""), "]", "")
    If rightAlign Then c.TextAlign = 3
    If Len(fmt) > 0 Then c.Format = fmt
    Set GridCell = c
End Function

Private Sub GridCol(frm As Form, src As String, cap As String, xIn As Single, _
                    wIn As Single, rightAlign As Boolean, Optional fmt As String = "")
    AddHeadLabel frm, cap, xIn, wIn, rightAlign
    Dim c As Control
    Set c = GridCell(frm, src, xIn, wIn, rightAlign, fmt)
    If src = "MWLoanNo" Or src = "MWPropertyNo" Then c.Locked = True
End Sub

Private Sub AddHeadLabel(frm As Form, cap As String, xIn As Single, wIn As Single, _
                         rightAlign As Boolean, Optional yIn As Single = 0.02)
    Dim c As Control
    Set c = CreateControl(frm.Name, acLabel, acHeader, "", "", _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(0.2 * T1))
    c.Caption = cap: c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
    If rightAlign Then c.TextAlign = 3
End Sub

Private Sub DarkBox(frm As Form, src As String, xIn As Single, yIn As Single, _
                    wIn As Single, Optional lockIt As Boolean = False, _
                    Optional fmt As String = "")
    Dim c As Control
    Set c = CreateControl(frm.Name, acTextBox, acDetail, "", src, _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(0.24 * T1))
    StyleInput c
    c.Name = Replace(Replace(src, "[", ""), "]", "")
    If Len(fmt) > 0 Then c.Format = fmt
    If lockIt Then
        c.Locked = True
        c.BackColor = CLR_READONLY      ' readOnlyBg
        c.ForeColor = CLR_MUTED
    End If
End Sub

Private Sub DarkBoxL(frm As Form, src As String, cap As String, xIn As Single, _
                     yIn As Single, wIn As Single, Optional lockIt As Boolean = False, _
                     Optional fmt As String = "")
    AddThemedLabel frm, cap, xIn, yIn + 0.01, CLR_MUTED, 8
    DarkBox frm, src, xIn + 1.15, yIn, wIn, lockIt, fmt
End Sub

Private Sub AddThemedLabel(frm As Form, cap As String, xIn As Single, yIn As Single, _
                           clr As Long, Optional sz As Integer = 9, _
                           Optional bold As Boolean = False)
    Dim c As Control
    Set c = CreateControl(frm.Name, acLabel, acDetail, "", "", _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(1.7 * T1), CLng(0.22 * T1))
    c.Caption = cap: c.ForeColor = clr: c.FontName = FONT: c.FontSize = sz
    c.FontBold = bold
End Sub

Private Sub AddPageLabel(frm As Form, pageName As String, cap As String, _
                         xIn As Single, yIn As Single)
    Dim c As Control
    Set c = CreateControl(frm.Name, acLabel, acDetail, pageName, "", _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(3 * T1), CLng(0.22 * T1))
    c.Caption = cap: c.ForeColor = CLR_MUTED: c.FontName = FONT: c.FontSize = 8
End Sub

Private Sub FlagCheck(frm As Form, src As String, cap As String, _
                      xIn As Single, yIn As Single)
    Dim c As Control, lbl As Control
    Set c = CreateControl(frm.Name, acCheckBox, acDetail, "", src, _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(0.22 * T1), CLng(0.2 * T1))
    c.Name = src
    Set lbl = CreateControl(frm.Name, acLabel, acDetail, "", "", _
                            CLng((xIn + 0.28) * T1), CLng(yIn * T1), CLng(1.5 * T1), CLng(0.2 * T1))
    lbl.Caption = cap: lbl.ForeColor = CLR_RED: lbl.FontName = FONT: lbl.FontSize = 8
End Sub

Private Sub CardRect(frm As Form, xIn As Single, yIn As Single, _
                     wIn As Single, hIn As Single)
    Dim c As Control
    Set c = CreateControl(frm.Name, acRectangle, acDetail, "", "", _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(hIn * T1))
    c.BackStyle = 1: c.BackColor = CLR_CARD
    c.BorderColor = CLR_INBORDER: c.BorderStyle = 1: c.SpecialEffect = 0
End Sub

Private Sub AddSub(frm As Form, srcForm As String, ctlName As String, _
                   xIn As Single, yIn As Single, wIn As Single, hIn As Single)
    Dim c As Control
    Set c = CreateControl(frm.Name, acSubform, acDetail, "", "", _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(hIn * T1))
    c.Name = ctlName
    c.SourceObject = srcForm
    On Error Resume Next
    c.BorderColor = CLR_INBORDER
    On Error GoTo 0
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

Private Sub DropQuery(db As DAO.Database, nm As String)
    On Error Resume Next
    db.QueryDefs.Delete nm
    Err.Clear
    On Error GoTo 0
End Sub
