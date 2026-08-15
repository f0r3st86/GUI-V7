Attribute VB_Name = "BuildFrontEnd"
Option Compare Database
Option Explicit

' =====================================================================
' MidwestDDi Access Front-End Builder  (v7.0 - production write paths)
'
' Builds a linked front-end styled after the LOANSYSTEM React app and
' wired with the real DD.Main production logic recovered in
' docs/DDMAIN-PRODUCTION-REFERENCE.md / docs/ACCESS-V7-GAP-PLAN.md.
'
'   frmBrowser           dark relationship browser (dbl-click to open)
'   frmWorkbench         header bar + relationship bar + pinned loan
'                        grid (vwRelationshipSummary + 12-pmt column)
'                        + flag card + 13-tab control + the production
'                        "Items Currently Activated" state footer
'   frmLoanGrid          dark continuous loan grid, Total in green,
'                        dbl-click loan no -> frmLoanDetail
'   frmLoanDetail        dark editable loan panel (popup, combos)
'   frmCollateralGrid    dark continuous collateral grid
'   frmCollateralDetail  dark editable collateral panel (popup, combos)
'   frmCommentsSub       production comment editor (sentinel captions)
'   frmTasks             dark task rows + production defaults + filter
'
' v7.0 production write paths (exact SQL from the accde mine):
'   New Loan/Rel Comment   keys-only INSERT + Max(KeyProvision) refocus
'   Add Collateral         Max(Priority)+1 mint + '**ADDED**' group
'   Order BPO              #9/9/1999 sentinel, First/Second/Third slot,
'                          3-order cap, seven collateral field guards
'   Order Title            'MWTitle'/'LO-Title' pending order
'
' HOW TO USE (same as before)
'   1. Blank .accdb on a machine with the sqlDueDiligence DSN
'   2. Alt+F11 -> File -> Import File -> this .bas
'   3. Ctrl+G -> type BuildAll -> Enter
'   4. Open frmLogin, pick a project + your initials (scopes the whole
'      session, exactly like the production frmLogin flow)
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
    EnsureLocalProjectTable
    EnsureLocalUserTable
    BuildQueries
    BuildFrmLoanDetail
    BuildFrmCollateralDetail
    BuildFrmLoanGrid
    BuildFrmCollateralGrid
    BuildFrmCommentsSub
    BuildFrmTasks
    BuildFrmWorkbench
    BuildFrmBrowser
    BuildFrmLogin
    MsgBox "Front-end built successfully." & vbCrLf & vbCrLf & _
           "Open frmLogin to start (pick a project).", vbInformation, "LOANSYSTEM (Access)"
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
    ' v7 tier-1 links per ACCESS-V7-GAP-PLAN B1: the server views the
    ' production grids actually bind, plus the lookup/auth tables the
    ' combos and write paths need. Views link read-only - production
    ' treats all 17 views read-only, so no unique index is declared.
    tables = Array("tblRelationships", "tblLoan", "CollateralInfo", _
                   "tblTasks", "tblBorrowers", "tblBorrowerLookup", _
                   "tblcomments", "tblPayHistory", "tblProjects", _
                   "tblBPO", "tblTitle", "z_CCodes", "zExitCodes", _
                   "vwPayHistorySpread", _
                   "vwRelationshipSummary", "vwCollateralSummary", _
                   "vwTitleDetail", "tblLiens", "ztblCommentGroups", _
                   "ztblLogins", "zCollateralCodes", "zBKStatus", _
                   "vwlstFinancialItemsRowSrc", "vwPropertyStmtsSummary", _
                   "tblFinancialCMR", "tblFinancialPFS", "tblPools")
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

' Local one-row table holding the login-chosen project - mirrors
' production's zxTblLOCALCurrentProject. Every operational query
' filters on it. Survives rebuilds (selection persists).
Private Sub EnsureLocalProjectTable()
    Dim db As DAO.Database: Set db = CurrentDb
    Dim td As DAO.TableDef, f As DAO.Field
    On Error Resume Next
    Set td = db.TableDefs("xtblLocalCurrentProject")
    If Err.Number <> 0 Then
        Err.Clear
        On Error GoTo 0
        Set td = db.CreateTableDef("xtblLocalCurrentProject")
        Set f = td.CreateField("CurrentProject", dbText, 100)
        td.Fields.Append f
        db.TableDefs.Append td
    End If
    On Error Resume Next
    If DCount("*", "xtblLocalCurrentProject") = 0 Then
        db.Execute "INSERT INTO xtblLocalCurrentProject (CurrentProject) " & _
                   "SELECT TOP 1 ProjectName FROM tblProjects ORDER BY ProjectName"
    End If
    Err.Clear
    On Error GoTo 0
End Sub

' Local one-row table holding the login-chosen user initials - the
' cheap half of production auth (GAP-PLAN B14). AcctOfficer defaults
' and the comment write path read it.
Private Sub EnsureLocalUserTable()
    Dim db As DAO.Database: Set db = CurrentDb
    Dim td As DAO.TableDef, f As DAO.Field
    On Error Resume Next
    Set td = db.TableDefs("xtblLocalCurrentUser")
    If Err.Number <> 0 Then
        Err.Clear
        On Error GoTo 0
        Set td = db.CreateTableDef("xtblLocalCurrentUser")
        Set f = td.CreateField("CurrentUser", dbText, 20)
        td.Fields.Append f
        db.TableDefs.Append td
    End If
    Err.Clear
    On Error GoTo 0
End Sub

Private Sub DropTableDef(db As DAO.Database, nm As String)
    On Error Resume Next
    db.TableDefs.Delete nm
    Err.Clear
    On Error GoTo 0
End Sub

Private Function TableExists(nm As String) As Boolean
    Dim db As DAO.Database: Set db = CurrentDb
    On Error Resume Next
    TableExists = (Len(db.TableDefs(nm).Name) > 0)
    Err.Clear
    On Error GoTo 0
End Function

' ================= QUERIES ===========================================
Private Sub BuildQueries()
    Dim db As DAO.Database: Set db = CurrentDb
    ' Project-scoped, like every production operational query
    DropQuery db, "qryRelationshipSummary"
    db.CreateQueryDef "qryRelationshipSummary", _
        "SELECT r.ProjectName, r.SortNo, r.RelatedLoans, " & _
        "Count(l.MWLoanNo) AS LoanCount, Sum(l.PrincipalBalance) AS TotalUPB, " & _
        "r.InBankruptcy, r.ForeclosureFlag, r.LitigationFlag, " & _
        "r.ForbearanceFlag, r.JudgmentFlag, r.LowYieldAsset, r.ExitCode " & _
        "FROM tblRelationships AS r LEFT JOIN tblLoan AS l " & _
        "ON r.RelatedLoans = l.RelatedLoans " & _
        "WHERE r.ProjectName = (SELECT CurrentProject FROM xtblLocalCurrentProject) " & _
        "GROUP BY r.ProjectName, r.SortNo, r.RelatedLoans, r.InBankruptcy, " & _
        "r.ForeclosureFlag, r.LitigationFlag, r.ForbearanceFlag, " & _
        "r.JudgmentFlag, r.LowYieldAsset, r.ExitCode " & _
        "ORDER BY r.ProjectName, r.SortNo;"

    ' Bid liquidation values - production aaaBiddingCollateralValueSummary
    ' math (flat 0.8 advance rate; production reads per-code rates from
    ' z_CCodes - swap in a join once its key column is confirmed)
    Dim rawX As String, adjX As String
    rawX = "Nz([CurrentAppraisedValue],0)-IIf(Nz([SeniorLienAmount],0)>0,Nz([SeniorLienAmount],0),0)-IIf(Nz([TaxDelinquentAmt],0)>0,Nz([TaxDelinquentAmt],0),0)"
    adjX = "0.8*Nz([CurrentAppraisedValue],0)-IIf(Nz([SeniorLienAmount],0)>0,Nz([SeniorLienAmount],0),0)-IIf(Nz([TaxDelinquentAmt],0)>0,Nz([TaxDelinquentAmt],0),0)"
    DropQuery db, "qryBidLiquidationValues"
    db.CreateQueryDef "qryBidLiquidationValues", _
        "SELECT c.RelatedLoans, Count(*) AS Properties, " & _
        "Sum(IIf(" & rawX & ">0," & rawX & ",0)) AS RawLiqVal, " & _
        "Sum(IIf(" & adjX & ">0," & adjX & ",0)) AS AdjLiqVal, " & _
        "Sum(Nz(c.CurrentAppraisedValue,0)) AS TotalAppraised, " & _
        "Sum(Nz(c.TaxDelinquentAmt,0)) AS TotalDelqTaxes " & _
        "FROM CollateralInfo AS c " & _
        "WHERE c.ProjectName = (SELECT CurrentProject FROM xtblLocalCurrentProject) " & _
        "GROUP BY c.RelatedLoans;"

    ' Production binds the pinned grid to vwRelationshipSummary joined
    ' to the local project scope (GAP-PLAN B2); amtpd is the
    ' server-computed trailing-12-payment total ("12 Pmts"). Fall back
    ' to tblLoan if the view failed to link so the build stays green.
    DropQuery db, "qryLoansSorted"
    If TableExists("vwRelationshipSummary") Then
        db.CreateQueryDef "qryLoansSorted", _
            "SELECT v.MWLoanNo, v.RelatedLoans, v.BorrowerNm, " & _
            "v.OrigPrincipalBalance, v.PrincipalBalance, v.InterestBalance, " & _
            "v.Rate, v.RepayAmt, v.DueDt, v.LastPmtDt, v.amtpd " & _
            "FROM vwRelationshipSummary AS v INNER JOIN xtblLocalCurrentProject AS p " & _
            "ON v.ProjectName = p.CurrentProject " & _
            "ORDER BY v.PrincipalBalance DESC;"
    Else
        db.CreateQueryDef "qryLoansSorted", _
            "SELECT MWLoanNo, RelatedLoans, BorrowerNm, OrigPrincipalBalance, " & _
            "PrincipalBalance, InterestBalance, Rate, RepayAmt, DueDt, LastPmtDt, " & _
            "Null AS amtpd FROM tblLoan ORDER BY PrincipalBalance DESC;"
    End If
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
    ' Server-computed trailing-12 payment total (vwRelationshipSummary)
    GridCol frm, "amtpd", "12 Pmts", 10.95, 0.95, True, "$#,##0"

    Dim mdl As Module, ln As Long, code As String
    frm!txtMWLoanNo.OnDblClick = "[Event Procedure]"
    frm.OnCurrent = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("DblClick", "txtMWLoanNo")
    mdl.InsertLines ln + 1, _
        "    DoCmd.OpenForm ""frmLoanDetail"", , , ""MWLoanNo='"" & Me!txtMWLoanNo & ""'"""
    ' Active-loan state writer (GAP-PLAN B9): row focus feeds the
    ' workbench "Items Currently Activated" footer
    ln = mdl.CreateEventProc("Current", "Form")
    code = "    On Error Resume Next" & vbCrLf
    code = code & "    Me.Parent!txtActiveLoan = Me!txtMWLoanNo"
    mdl.InsertLines ln + 1, code
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

    Dim mdl As Module, ln As Long, code As String
    frm!txtMWPropertyNo.OnDblClick = "[Event Procedure]"
    frm.OnCurrent = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("DblClick", "txtMWPropertyNo")
    mdl.InsertLines ln + 1, _
        "    DoCmd.OpenForm ""frmCollateralDetail"", , , ""MWPropertyNo="" & Me!txtMWPropertyNo"
    ' Active-property state writer (GAP-PLAN B9) - BPO/Title ordering
    ' and Add Collateral read these from the workbench footer
    ln = mdl.CreateEventProc("Current", "Form")
    code = "    On Error Resume Next" & vbCrLf
    code = code & "    Me.Parent!txtActivePropNo = Me!txtMWPropertyNo" & vbCrLf
    code = code & "    Me.Parent!txtActivePriority = Me!txtPriority"
    mdl.InsertLines ln + 1, code
    SaveAs nm, "frmCollateralGrid"
End Sub

' ================= FORM: TASKS (production defaults) =================
' GAP-PLAN B7: DueDate-desc sort, production defaults (EntryDate=Now,
' DueDate=Date, keys from the workbench state), ztblLogins officer
' combos, and the "***" Task For filter. Production's ProjectName<-
' MWLoanNo default bug is deliberately FIXED (scope-table default).
Private Sub BuildFrmTasks()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmTasks", acForm
    Set frm = NewDarkForm("SELECT * FROM tblTasks ORDER BY DueDate DESC", 1)
    nm = frm.Name
    frm.AllowAdditions = True
    frm.HasModule = True
    EnsureHeader frm
    frm.Section(acHeader).BackColor = CLR_HEADER
    frm.Section(acHeader).Height = 0.34 * T1
    frm.Section(acDetail).Height = 1.55 * T1
    frm.Section(acDetail).BackColor = CLR_CARD

    ' Header: Task For filter, production default "***" (= everyone)
    AddHeadLabel frm, "Task For Filter", 0.15, 1.1, False, 0.07
    Set c = CreateControl(nm, acComboBox, acHeader, "", "", _
                          CLng(1.35 * T1), CLng(0.04 * T1), CLng(0.9 * T1), CLng(0.26 * T1))
    c.Name = "cboOfficerFilter"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT DISTINCTROW Initials FROM ztblLogins ORDER BY Initials;"
    c.LimitToList = False
    c.DefaultValue = "=""***"""
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0

    DarkComboL frm, "AcctOfficer", "Task For", 0.15, 0.12, 0.9, _
               "Table/Query", "SELECT DISTINCTROW Initials FROM ztblLogins ORDER BY Initials;"
    DarkComboL frm, "EntryAcctOfficer", "Entered By", 2.35, 0.12, 0.9, _
               "Table/Query", "SELECT DISTINCTROW Initials FROM ztblLogins ORDER BY Initials;"
    DarkBoxL frm, "EntryDate", "Entered", 4.55, 0.12, 0.95, False, "mm/dd/yy"
    DarkBoxL frm, "Completed", "Complete", 6.8, 0.12, 0.3
    DarkBoxL frm, "CompleteDate", "Done", 8.3, 0.12, 0.9, False, "mm/dd/yy"
    DarkBoxL frm, "DueDate", "Due", 0.15, 0.52, 0.95, False, "mm/dd/yy"
    DarkBoxL frm, "MWLoanNo", "Loan", 2.35, 0.52, 1.2
    Set c = CreateControl(nm, acTextBox, acDetail, "", "Comment", _
                          CLng(0.15 * T1), CLng(0.94 * T1), CLng(9.7 * T1), CLng(0.5 * T1))
    StyleInput c: c.Name = "Comment": c.ScrollBars = 2
    ' Hidden ProjectName carrier so the default applies on new rows
    Set c = CreateControl(nm, acTextBox, acDetail, "", "ProjectName", _
                          CLng(10# * T1), CLng(0.94 * T1), CLng(0.4 * T1), CLng(0.2 * T1))
    c.Name = "txtProjectName": c.Visible = False

    frm!EntryDate.DefaultValue = "=Now()"
    frm!DueDate.DefaultValue = "=Date()"
    frm!MWLoanNo.DefaultValue = "=[Forms]![frmWorkbench]![txtActiveLoan]"
    frm!txtProjectName.DefaultValue = "=DLookUp(""CurrentProject"",""xtblLocalCurrentProject"")"
    frm!EntryAcctOfficer.DefaultValue = "=DLookUp(""CurrentUser"",""xtblLocalCurrentUser"")"

    Dim mdl As Module, ln As Long, code As String
    frm!cboOfficerFilter.AfterUpdate = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("AfterUpdate", "cboOfficerFilter")
    code = "    If Nz(Me!cboOfficerFilter, ""***"") = ""***"" Then" & vbCrLf
    code = code & "        Me.FilterOn = False" & vbCrLf
    code = code & "    Else" & vbCrLf
    code = code & "        Me.Filter = ""AcctOfficer='"" & Replace(Me!cboOfficerFilter, ""'"", ""''"") & ""'""" & vbCrLf
    code = code & "        Me.FilterOn = True" & vbCrLf
    code = code & "    End If"
    mdl.InsertLines ln + 1, code
    SaveAs nm, "frmTasks"
End Sub

' ================= FORM: COMMENTS SUB (production editor) ============
' GAP-PLAN B3: the production FrmCommentsSub - continuous editor with
' the relationship-level sentinel caption (MWLoanNo = RelatedLoans),
' mm/dd/yy date, ztblCommentGroups category combo, and the Comment
' memo. Rows are minted by the workbench New buttons (write path C.1);
' the identity key (KeyProvision) is server-assigned.
Private Sub BuildFrmCommentsSub()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmCommentsSub", acForm
    Set frm = NewDarkForm( _
        "SELECT MWLoanNo, AcctOfficer, [Date], KeyProvision, ProjectName, " & _
        "RelatedLoans, [Group], GroupType, Comment FROM tblcomments " & _
        "ORDER BY [Date] DESC", 1)
    nm = frm.Name
    frm.AllowAdditions = False
    frm.AllowDeletions = False
    frm.Section(acDetail).Height = 1.15 * T1
    frm.Section(acDetail).BackColor = CLR_CARD

    ' Sentinel header (production expression, recovered verbatim)
    Set c = CreateControl(nm, acTextBox, acDetail, "", _
        "=IIf([MWLoanNo]=[RelatedLoans],""Relationship Level Comments - "" & [RelatedLoans],""Loan Level Comments - "" & [MWLoanNo])", _
        CLng(0.1 * T1), CLng(0.06 * T1), CLng(4.4 * T1), CLng(0.24 * T1))
    StyleCell c: c.Name = "txtLevel": c.ForeColor = CLR_GREEN: c.FontBold = True

    ' Bracketed sources: bare "Date"/"Group" would resolve to the VBA
    ' function / reserved word instead of the tblcomments columns
    Set c = CreateControl(nm, acTextBox, acDetail, "", "[Date]", _
                          CLng(4.6 * T1), CLng(0.06 * T1), CLng(0.85 * T1), CLng(0.24 * T1))
    StyleInput c: c.Name = "txtDate": c.Format = "mm/dd/yy"
    Set c = CreateControl(nm, acComboBox, acDetail, "", "[Group]", _
                          CLng(5.55 * T1), CLng(0.06 * T1), CLng(1.5 * T1), CLng(0.24 * T1))
    c.Name = "cboGroup"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT GroupName FROM ztblCommentGroups " & _
                  "WHERE GroupName<>'**Show All**' ORDER BY ReportPriority, GroupName;"
    c.LimitToList = False
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
    Set c = CreateControl(nm, acTextBox, acDetail, "", "AcctOfficer", _
                          CLng(7.15 * T1), CLng(0.06 * T1), CLng(0.7 * T1), CLng(0.24 * T1))
    StyleInput c: c.Name = "txtAcctOfficer"
    Set c = CreateControl(nm, acTextBox, acDetail, "", "KeyProvision", _
                          CLng(7.95 * T1), CLng(0.06 * T1), CLng(0.7 * T1), CLng(0.24 * T1))
    StyleInput c: c.Name = "txtKeyProvision"
    c.Locked = True: c.BackColor = CLR_READONLY: c.ForeColor = CLR_MUTED

    Set c = CreateControl(nm, acTextBox, acDetail, "", "Comment", _
                          CLng(0.1 * T1), CLng(0.36 * T1), CLng(11.7 * T1), CLng(0.68 * T1))
    StyleInput c: c.Name = "txtComment": c.ScrollBars = 2
    c.EnterKeyBehavior = True
    SaveAs nm, "frmCommentsSub"
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
    ' Production value lists (recovered verbatim - GAP-PLAN B5)
    DarkComboL frm, "RateType", "Rate Type", 9.8, y, 1.25, _
               "Value List", """Variable"";""Fixed""": y = y + 0.42
    DarkBoxL frm, "index", "Index", 9.8, y, 1.25: y = y + 0.42
    DarkBoxL frm, "margin", "Margin", 9.8, y, 1.25, False, "0.00%": y = y + 0.42
    DarkBoxL frm, "floor", "Floor", 9.8, y, 1.25, False, "0.00%": y = y + 0.42
    DarkBoxL frm, "ceiling", "Ceiling", 9.8, y, 1.25, False, "0.00%": y = y + 0.42
    DarkBoxL frm, "changefreq", "Change Freq", 9.8, y, 1.25: y = y + 0.42
    DarkComboL frm, "AssetType", "Asset Type", 9.8, y, 1.25, _
               "Value List", """No Default"";""Payment Default"";""Technical Default""": y = y + 0.42
    DarkBoxL frm, "[Unfunded Commitment]", "Unfunded", 9.8, y, 1.25: y = y + 0.42
    DarkComboL frm, "CFLikelyhood", "CF Likelihood", 9.8, y, 1.25, _
               "Value List", _
               "2;""Very Optimistic"";1;""Optimistic"";0;""Neutral"";-1;""Pessimistic"";-2;""Very Pessimistic""", _
               2, "360;1080"

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
    ' Production combo: code + class from zCollateralCodes (widths verbatim)
    DarkComboL frm, "MWCollateralCode", "Code", 0.2, y, 1.7, _
               "Table/Query", "SELECT Code, Class FROM zCollateralCodes ORDER BY Class;", _
               2, "2016;864": y = y + 0.42
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
    DarkComboL frm, "RealEstateGroup", "Group", 7.1, y, 1.3, _
               "Value List", """Commercial"";""Residential"";""Unknown""": y = y + 0.42
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

    ' --- Relationship bar (combo navigation like production frmLoanView) ---
    AddThemedLabel frm, "Relationship:", 0.15, 0.78, CLR_MUTED, 9
    Dim cbo As Control
    Set cbo = CreateControl(nm, acComboBox, acDetail, "", "", _
                            CLng(1.25 * T1), CLng(0.76 * T1), CLng(1.5 * T1), CLng(0.24 * T1))
    cbo.Name = "cboRelationship"
    cbo.RowSourceType = "Table/Query"
    cbo.RowSource = "SELECT RelatedLoans FROM tblRelationships " & _
        "WHERE ProjectName = (SELECT CurrentProject FROM xtblLocalCurrentProject) " & _
        "ORDER BY SortNo;"
    cbo.LimitToList = True
    On Error Resume Next
    cbo.BackColor = CLR_INPUT: cbo.ForeColor = CLR_TEXT
    cbo.BorderColor = CLR_INBORDER: cbo.FontName = FONT: cbo.FontSize = 9
    On Error GoTo 0
    AddThemedLabel frm, "Sort", 3#, 0.78, CLR_MUTED, 9
    DarkBox frm, "SortNo", 3.4, 0.76, 0.5, True
    AddThemedLabel frm, "Project", 4.1, 0.78, CLR_MUTED, 9
    DarkBox frm, "ProjectName", 4.7, 0.76, 1.7, True
    AddThemedLabel frm, "Exit Code", 6.6, 0.78, CLR_MUTED, 9
    ' Production combo: the 11 zExitCodes values, rowguid order (verbatim)
    Set cbo = CreateControl(nm, acComboBox, acDetail, "", "ExitCode", _
                            CLng(7.35 * T1), CLng(0.76 * T1), CLng(1.2 * T1), CLng(0.24 * T1))
    cbo.Name = "ExitCode"
    cbo.RowSourceType = "Table/Query"
    cbo.RowSource = "SELECT ExitCode FROM zExitCodes ORDER BY rowguid;"
    cbo.LimitToList = False
    On Error Resume Next
    cbo.BackColor = CLR_INPUT: cbo.ForeColor = CLR_TEXT
    cbo.BorderColor = CLR_INBORDER: cbo.FontName = FONT: cbo.FontSize = 9
    On Error GoTo 0
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
    ' Production frmLoanView order (Collateral 2nd, 'Obligor' naming);
    ' Report is the React app's addition, kept last
    tabNames = Array("Loan", "Collateral", "Obligor", "Comment", "BPOTitleUCC", _
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
    Set c = CreateControl(nm, acSubform, acDetail, "pgObligor", "", _
                          CLng(0.3 * T1), CLng(PY * T1), CLng(12# * T1), CLng(PH * T1))
    c.Name = "subBorrowers": c.SourceObject = "Table.tblBorrowers"
    ' Comment page: the production comment center (GAP-PLAN B3) -
    ' category filter (default **Show All**, a real ztblCommentGroups
    ' row), 150-char preview list, editor subform, and the two New
    ' buttons that run the keys-only INSERT write path (C.1)
    AddPageLabel frm, "pgComment", "Comment Category:", 0.3, PY
    Set c = CreateControl(nm, acComboBox, acDetail, "pgComment", "", _
                          CLng(1.75 * T1), CLng((PY - 0.02) * T1), CLng(1.6 * T1), CLng(0.26 * T1))
    c.Name = "CommentFilter"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT GroupName FROM ztblCommentGroups ORDER BY ReportPriority, GroupName;"
    c.LimitToList = False
    c.DefaultValue = "=""**Show All**"""
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
    Set c = CreateControl(nm, acCommandButton, acDetail, "pgComment", "", _
                          CLng(9.05 * T1), CLng((PY - 0.02) * T1), CLng(1.6 * T1), CLng(0.28 * T1))
    c.Name = "cmdNewComment": c.Caption = "New Loan Comment"
    DarkButton c
    Set c = CreateControl(nm, acCommandButton, acDetail, "pgComment", "", _
                          CLng(10.75 * T1), CLng((PY - 0.02) * T1), CLng(1.55 * T1), CLng(0.28 * T1))
    c.Name = "cmdNewRelComment": c.Caption = "New Rel Comment"
    DarkButton c
    Set c = CreateControl(nm, acListBox, acDetail, "pgComment", "", _
                          CLng(0.3 * T1), CLng((PY + 0.32) * T1), CLng(12# * T1), CLng(1.15 * T1))
    c.Name = "lstComments"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT 'nothing' as field1"
    c.ColumnCount = 4
    c.BoundColumn = 1
    c.ColumnWidths = "0;720;1080;9600"
    c.ColumnHeads = True
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
    Set c = CreateControl(nm, acSubform, acDetail, "pgComment", "", _
                          CLng(0.3 * T1), CLng((PY + 1.55) * T1), CLng(12# * T1), CLng(2.3 * T1))
    c.Name = "subComments": c.SourceObject = "frmCommentsSub"
    ' Production's server-side year x 12 payment pivot
    Set c = CreateControl(nm, acSubform, acDetail, "pgPayHist", "", _
                          CLng(0.3 * T1), CLng(PY * T1), CLng(12# * T1), CLng(PH * T1))
    c.Name = "subPayHist": c.SourceObject = "Table.vwPayHistorySpread"

    ' Collateral page + Add Collateral write path (GAP-PLAN B6 / C.2)
    Set c = CreateControl(nm, acCommandButton, acDetail, "pgCollateral", "", _
                          CLng(10.85 * T1), CLng((PY - 0.02) * T1), CLng(1.45 * T1), CLng(0.28 * T1))
    c.Name = "cmdAddCollateral": c.Caption = "Add Collateral"
    DarkButton c
    Set c = CreateControl(nm, acSubform, acDetail, "pgCollateral", "", _
                          CLng(0.3 * T1), CLng((PY + 0.3) * T1), CLng(12# * T1), CLng((PH - 0.35) * T1))
    c.Name = "subCollateral": c.SourceObject = "frmCollateralGrid"

    ' Tasks page
    Set c = CreateControl(nm, acSubform, acDetail, "pgTasks", "", _
                          CLng(0.3 * T1), CLng(PY * T1), CLng(12# * T1), CLng(PH * T1))
    c.Name = "subTasks": c.SourceObject = "frmTasks"

    ' Overview page: three stacked full-width narratives (React layout).
    ' Boxes AUTO-GROW as lines are entered (OvLayout in the form module);
    ' labels are named so the layout code can reflow them.
    Dim lbl As Control
    Set lbl = CreateControl(nm, acLabel, acDetail, "pgOverview", "", _
                            CLng(0.3 * T1), CLng(PY * T1), CLng(3 * T1), CLng(0.22 * T1))
    lbl.Caption = "Relationship Overview": lbl.Name = "lblRelOv"
    lbl.ForeColor = CLR_MUTED: lbl.FontName = FONT: lbl.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acDetail, "pgOverview", "RelationshipOverview", _
                          CLng(0.3 * T1), CLng((PY + 0.24) * T1), CLng(12# * T1), CLng(0.75 * T1))
    StyleInput c: c.Name = "RelationshipOverview": c.ScrollBars = 0
    c.EnterKeyBehavior = True

    Set lbl = CreateControl(nm, acLabel, acDetail, "pgOverview", "", _
                            CLng(0.3 * T1), CLng((PY + 1.1) * T1), CLng(3 * T1), CLng(0.22 * T1))
    lbl.Caption = "Collateral Overview": lbl.Name = "lblCollOv"
    lbl.ForeColor = CLR_MUTED: lbl.FontName = FONT: lbl.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acDetail, "pgOverview", "CollateralOverview", _
                          CLng(0.3 * T1), CLng((PY + 1.34) * T1), CLng(12# * T1), CLng(0.75 * T1))
    StyleInput c: c.Name = "CollateralOverview": c.ScrollBars = 0
    c.EnterKeyBehavior = True

    Set lbl = CreateControl(nm, acLabel, acDetail, "pgOverview", "", _
                            CLng(0.3 * T1), CLng((PY + 2.2) * T1), CLng(3 * T1), CLng(0.22 * T1))
    lbl.Caption = "Bid Conditions": lbl.Name = "lblBid"
    lbl.ForeColor = CLR_MUTED: lbl.FontName = FONT: lbl.FontSize = 8
    Set c = CreateControl(nm, acTextBox, acDetail, "pgOverview", "ConditionsDeadlines", _
                          CLng(0.3 * T1), CLng((PY + 2.44) * T1), CLng(12# * T1), CLng(0.75 * T1))
    StyleInput c: c.Name = "ConditionsDeadlines": c.ScrollBars = 0
    c.EnterKeyBehavior = True

    ' Strategies page
    AddPageLabel frm, "pgStrategies", "Exit Strategy", 0.3, PY
    Set c = CreateControl(nm, acTextBox, acDetail, "pgStrategies", "ExitStrategyOverview", _
                          CLng(0.3 * T1), CLng((PY + 0.25) * T1), CLng(12# * T1), CLng(2.4 * T1))
    StyleInput c: c.Name = "ExitStrategyOverview": c.ScrollBars = 2
    AddPageLabel frm, "pgStrategies", "Original Strategy", 0.3, PY + 2.8
    Set c = CreateControl(nm, acTextBox, acDetail, "pgStrategies", "Original_Strategy", _
                          CLng(0.3 * T1), CLng((PY + 3.05) * T1), CLng(12# * T1), CLng(0.6 * T1))
    StyleInput c: c.Name = "Original_Strategy": c.ScrollBars = 2

    ' BPOTitleUCC page (GAP-PLAN B4): production listboxes with the
    ' design-time 'nothing' placeholder (runtime SQL set in Current),
    ' plus the Order BPO / Order Title write paths (C.3 / C.4)
    AddPageLabel frm, "pgBPOTitleUCC", _
        "BPO Orders (First/Second/Third slots - 3 max per property)", 0.3, PY
    Set c = CreateControl(nm, acCommandButton, acDetail, "pgBPOTitleUCC", "", _
                          CLng(9.35 * T1), CLng((PY - 0.02) * T1), CLng(1.4 * T1), CLng(0.28 * T1))
    c.Name = "cmdOrderBPO": c.Caption = "Order BPO"
    DarkButton c
    Set c = CreateControl(nm, acCommandButton, acDetail, "pgBPOTitleUCC", "", _
                          CLng(10.9 * T1), CLng((PY - 0.02) * T1), CLng(1.4 * T1), CLng(0.28 * T1))
    c.Name = "cmdOrderTitle": c.Caption = "Order Title"
    DarkButton c
    Set c = CreateControl(nm, acListBox, acDetail, "pgBPOTitleUCC", "", _
                          CLng(0.3 * T1), CLng((PY + 0.3) * T1), CLng(12# * T1), CLng(1.55 * T1))
    c.Name = "lstBPOs"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT 'nothing' as field1"
    c.ColumnCount = 6
    c.BoundColumn = 1
    c.ColumnWidths = "1000;900;1000;1000;1600;1100"
    c.ColumnHeads = True
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
    AddPageLabel frm, "pgBPOTitleUCC", "Title Orders", 0.3, PY + 1.95
    Set c = CreateControl(nm, acListBox, acDetail, "pgBPOTitleUCC", "", _
                          CLng(0.3 * T1), CLng((PY + 2.22) * T1), CLng(12# * T1), CLng(1.6 * T1))
    c.Name = "lstTitles"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT 'nothing' as field1"
    c.ColumnCount = 5
    c.BoundColumn = 1
    c.ColumnWidths = "1000;1100;1100;1000;1600"
    c.ColumnHeads = True
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0

    ' Placeholder pages (mirrors the React "Coming soon" default case)
    AddPageLabel frm, "pgFinStmts", "FinStmts tab content - Coming soon", 4.5, PY + 1.5
    AddPageLabel frm, "pgProjections", "Projections modeling lives in the React app", 4.2, PY + 1.5
    AddPageLabel frm, "pgProperty", "Property tab content - Coming soon", 4.5, PY + 1.5
    AddPageLabel frm, "pgReport", "Investor reports live in the React app", 4.3, PY + 1.5

    ' --- "Items Currently Activated" state footer (GAP-PLAN B9) ---
    ' Production frmLoanView's unbound current-record state machine:
    ' every guard and write path reads these. Fed by the loan and
    ' collateral grids' Current events.
    AddThemedLabel frm, "Items Currently Activated:", 0.15, 7.88, CLR_MUTED, 8
    AddThemedLabel frm, "Loan", 2.05, 7.88, CLR_MUTED, 8
    Set c = CreateControl(nm, acTextBox, acDetail, "", "", _
                          CLng(2.5 * T1), CLng(7.85 * T1), CLng(1.5 * T1), CLng(0.24 * T1))
    StyleInput c: c.Name = "txtActiveLoan"
    c.Locked = True: c.TabStop = False: c.BackColor = CLR_READONLY: c.ForeColor = CLR_GREEN
    AddThemedLabel frm, "Prop No", 4.2, 7.88, CLR_MUTED, 8
    Set c = CreateControl(nm, acTextBox, acDetail, "", "", _
                          CLng(4.9 * T1), CLng(7.85 * T1), CLng(0.9 * T1), CLng(0.24 * T1))
    StyleInput c: c.Name = "txtActivePropNo"
    c.Locked = True: c.TabStop = False: c.BackColor = CLR_READONLY: c.ForeColor = CLR_GREEN
    AddThemedLabel frm, "Priority", 5.95, 7.88, CLR_MUTED, 8
    Set c = CreateControl(nm, acTextBox, acDetail, "", "", _
                          CLng(6.6 * T1), CLng(7.85 * T1), CLng(0.5 * T1), CLng(0.24 * T1))
    StyleInput c: c.Name = "txtActivePriority"
    c.Locked = True: c.TabStop = False: c.BackColor = CLR_READONLY: c.ForeColor = CLR_GREEN

    ' Button + combo + subform wiring. Constraint 3: every control has
    ' its final name by now; set the property, then create the proc.
    Dim mdl As Module, ln As Long, code As String
    frm!btnBrowse.OnClick = "[Event Procedure]"
    frm!cboRelationship.AfterUpdate = "[Event Procedure]"
    frm.OnCurrent = "[Event Procedure]"
    frm!CommentFilter.AfterUpdate = "[Event Procedure]"
    frm!lstComments.AfterUpdate = "[Event Procedure]"
    frm!cmdNewComment.OnClick = "[Event Procedure]"
    frm!cmdNewRelComment.OnClick = "[Event Procedure]"
    frm!cmdAddCollateral.OnClick = "[Event Procedure]"
    frm!cmdOrderBPO.OnClick = "[Event Procedure]"
    frm!cmdOrderTitle.OnClick = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("Click", "btnBrowse")
    mdl.InsertLines ln + 1, "    DoCmd.OpenForm ""frmBrowser"""
    ln = mdl.CreateEventProc("AfterUpdate", "cboRelationship")
    mdl.InsertLines ln + 1, _
        "    Me.Recordset.FindFirst ""RelatedLoans='"" & Replace(Me!cboRelationship, ""'"", ""''"") & ""'"""
    ln = mdl.CreateEventProc("Current", "Form")
    code = "    On Error Resume Next" & vbCrLf
    code = code & "    Me!cboRelationship = Me!RelatedLoans" & vbCrLf
    code = code & "    OvLayout" & vbCrLf
    code = code & "    RefreshComments" & vbCrLf
    code = code & "    RefreshBPOTitle"
    mdl.InsertLines ln + 1, code
    ln = mdl.CreateEventProc("Change", "RelationshipOverview")
    mdl.InsertLines ln + 1, "    OvLayout"
    ln = mdl.CreateEventProc("Change", "CollateralOverview")
    mdl.InsertLines ln + 1, "    OvLayout"
    ln = mdl.CreateEventProc("Change", "ConditionsDeadlines")
    mdl.InsertLines ln + 1, "    OvLayout"
    ' Set the change-event properties so the procs fire
    frm!RelationshipOverview.OnChange = "[Event Procedure]"
    frm!CollateralOverview.OnChange = "[Event Procedure]"
    frm!ConditionsDeadlines.OnChange = "[Event Procedure]"

    ' Comment filter re-sorts the preview list (production: filtered
    ' view orders by Group, KeyProvision instead of Date DESC)
    ln = mdl.CreateEventProc("AfterUpdate", "CommentFilter")
    mdl.InsertLines ln + 1, "    RefreshComments"
    ' Preview list click -> focus that comment in the editor
    ln = mdl.CreateEventProc("AfterUpdate", "lstComments")
    code = "    On Error Resume Next" & vbCrLf
    code = code & "    Me!subComments.Form.Recordset.FindFirst ""KeyProvision="" & Me!lstComments"
    mdl.InsertLines ln + 1, code

    ' --- Write path C.1: New Loan Comment (keys-only INSERT, then
    ' Max(KeyProvision) re-find - the production add-comment protocol) ---
    ln = mdl.CreateEventProc("Click", "cmdNewComment")
    code = "    Dim sql As String, k As Variant, g As String" & vbCrLf
    code = code & "    If Len(Nz(Me!txtActiveLoan, """")) = 0 Then" & vbCrLf
    code = code & "        MsgBox ""You must first activate a Relationship and LoanNo before entering a Comment.""" & vbCrLf
    code = code & "        Exit Sub" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    g = Nz(Me!CommentFilter, ""**Show All**"")" & vbCrLf
    code = code & "    If g = ""**Show All**"" Then g = """"" & vbCrLf
    code = code & "    sql = ""INSERT INTO tblcomments (MWLoanNo, ProjectName, RelatedLoans, [Date], AcctOfficer, [Group]) VALUES (""" & vbCrLf
    code = code & "    sql = sql & ""'"" & Q(Me!txtActiveLoan) & ""','"" & Q(Me!ProjectName) & ""','"" & Q(Me!RelatedLoans) & ""',Date(),'"" & Q(CurUser()) & ""',""" & vbCrLf
    code = code & "    If Len(g) = 0 Then" & vbCrLf
    code = code & "        sql = sql & ""Null)""" & vbCrLf
    code = code & "    Else" & vbCrLf
    code = code & "        sql = sql & ""'"" & Q(g) & ""')""" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    CurrentDb.Execute sql, dbFailOnError" & vbCrLf
    code = code & "    RefreshComments" & vbCrLf
    code = code & "    Me!subComments.Requery" & vbCrLf
    code = code & "    k = DMax(""KeyProvision"", ""tblcomments"", ""ProjectName='"" & Q(Me!ProjectName) & ""' AND RelatedLoans='"" & Q(Me!RelatedLoans) & ""'"")" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    If Not IsNull(k) Then Me!subComments.Form.Recordset.FindFirst ""KeyProvision="" & k"
    mdl.InsertLines ln + 1, code

    ' --- Write path C.1b: relationship-level comment - the sentinel
    ' convention: MWLoanNo = RelatedLoans ---
    ln = mdl.CreateEventProc("Click", "cmdNewRelComment")
    code = "    Dim sql As String, k As Variant" & vbCrLf
    code = code & "    If Len(Nz(Me!RelatedLoans, """")) = 0 Then" & vbCrLf
    code = code & "        MsgBox ""You must first activate a Relationship before entering a Comment.""" & vbCrLf
    code = code & "        Exit Sub" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    sql = ""INSERT INTO tblcomments (MWLoanNo, ProjectName, RelatedLoans, [Date], AcctOfficer) VALUES (""" & vbCrLf
    code = code & "    sql = sql & ""'"" & Q(Me!RelatedLoans) & ""','"" & Q(Me!ProjectName) & ""','"" & Q(Me!RelatedLoans) & ""',Date(),'"" & Q(CurUser()) & ""')""" & vbCrLf
    code = code & "    CurrentDb.Execute sql, dbFailOnError" & vbCrLf
    code = code & "    RefreshComments" & vbCrLf
    code = code & "    Me!subComments.Requery" & vbCrLf
    code = code & "    k = DMax(""KeyProvision"", ""tblcomments"", ""ProjectName='"" & Q(Me!ProjectName) & ""' AND RelatedLoans='"" & Q(Me!RelatedLoans) & ""'"")" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    If Not IsNull(k) Then Me!subComments.Form.Recordset.FindFirst ""KeyProvision="" & k"
    mdl.InsertLines ln + 1, code

    ' --- Write path C.2: Add Collateral (Max(Priority)+1 mint,
    ' '**ADDED**' group, typed-yes confirm - production protocol) ---
    ln = mdl.CreateEventProc("Click", "cmdAddCollateral")
    code = "    Dim ans As String, isRE As String, pri As Long, sql As String, borr As String" & vbCrLf
    code = code & "    If Len(Nz(Me!RelatedLoans, """")) = 0 Then" & vbCrLf
    code = code & "        MsgBox ""Activate a relationship first.""" & vbCrLf
    code = code & "        Exit Sub" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    ans = InputBox(""Add a collateral record to "" & Me!RelatedLoans & ""?  Type yes to continue."", ""Add Collateral"")" & vbCrLf
    code = code & "    If LCase(Trim(ans)) <> ""yes"" Then Exit Sub" & vbCrLf
    code = code & "    isRE = InputBox(""Is the new collateral Real Estate?  Type yes for Real Estate; anything else for Non-RE."", ""Add Collateral"")" & vbCrLf
    code = code & "    pri = Nz(DMax(""Priority"", ""CollateralInfo"", ""RelatedLoans='"" & Q(Me!RelatedLoans) & ""' AND ProjectName='"" & Q(Me!ProjectName) & ""'""), 0) + 1" & vbCrLf
    code = code & "    borr = Nz(DLookup(""BorrowerNm"", ""tblLoan"", ""MWLoanNo='"" & Q(Me!txtActiveLoan) & ""'""), """")" & vbCrLf
    code = code & "    sql = ""INSERT INTO CollateralInfo (RelatedLoans, Priority, ProjectName, BorrowerName, IsRealEstate, RealEstateGroup) VALUES (""" & vbCrLf
    code = code & "    sql = sql & ""'"" & Q(Me!RelatedLoans) & ""',"" & pri & "",'"" & Q(Me!ProjectName) & ""','"" & Q(borr) & ""',"" & IIf(LCase(Trim(isRE)) = ""yes"", ""True"", ""False"") & "",'**ADDED**')""" & vbCrLf
    code = code & "    CurrentDb.Execute sql, dbFailOnError" & vbCrLf
    code = code & "    Me!subCollateral.Requery" & vbCrLf
    code = code & "    MsgBox ""Collateral record added with Priority "" & pri & ""."" & vbCrLf & ""REMINDER - Please insert collateral codes."""
    mdl.InsertLines ln + 1, code

    ' --- Write path C.3: Order BPO (sentinel date #9/9/1999,
    ' First/Second/Third slot machine, 3-order cap, 7 field guards) ---
    ln = mdl.CreateEventProc("Click", "cmdOrderBPO")
    code = "    Dim n As Long, slot As String, ans As String, sql As String, prop As Variant" & vbCrLf
    code = code & "    prop = Me!txtActivePropNo" & vbCrLf
    code = code & "    If Len(Nz(prop, """")) = 0 Then" & vbCrLf
    code = code & "        MsgBox ""Activate a collateral row first (click it in the Collateral grid).""" & vbCrLf
    code = code & "        Exit Sub" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    If MissingColl(""a BPO"") Then Exit Sub" & vbCrLf
    code = code & "    n = DCount(""*"", ""tblBPO"", ""MWPropertyNo="" & prop & "" AND Status<>'Canceled' AND Status<>'DELETED'"")" & vbCrLf
    code = code & "    If n >= 3 Then" & vbCrLf
    code = code & "        MsgBox ""Three BPOs are already on order. No additional orders are allowed for this property.""" & vbCrLf
    code = code & "        Exit Sub" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    If DCount(""*"", ""tblBPO"", ""MWPropertyNo="" & prop & "" AND BPOBroker='First' AND Status<>'Canceled' AND Status<>'DELETED'"") = 0 Then" & vbCrLf
    code = code & "        slot = ""First""" & vbCrLf
    code = code & "    ElseIf DCount(""*"", ""tblBPO"", ""MWPropertyNo="" & prop & "" AND BPOBroker='Second' AND Status<>'Canceled' AND Status<>'DELETED'"") = 0 Then" & vbCrLf
    code = code & "        slot = ""Second""" & vbCrLf
    code = code & "    Else" & vbCrLf
    code = code & "        slot = ""Third""" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    If n = 0 Then" & vbCrLf
    code = code & "        ans = InputBox(""Are you sure you want to order this BPO?  Type yes to continue."", ""Order BPO"")" & vbCrLf
    code = code & "    Else" & vbCrLf
    code = code & "        ans = InputBox(""Are you sure you want to order this BPO, causing a total of "" & (n + 1) & "" BPOs to be ordered for this property?  Type yes to continue."", ""Order BPO"")" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    If LCase(Trim(ans)) <> ""yes"" Then Exit Sub" & vbCrLf
    code = code & "    sql = ""INSERT INTO tblBPO (RelatedLoans, Priority, ProjectName, BPODate, BPOBroker, MWPropertyNo, Status, BPOProvider) VALUES (""" & vbCrLf
    code = code & "    sql = sql & ""'"" & Q(Me!RelatedLoans) & ""',"" & Nz(Me!txtActivePriority, 0) & "",'"" & Q(Me!ProjectName) & ""',#09/09/1999#,'"" & slot & ""',"" & prop & "",'Pending','LO-BPO')""" & vbCrLf
    code = code & "    CurrentDb.Execute sql, dbFailOnError" & vbCrLf
    code = code & "    RefreshBPOTitle" & vbCrLf
    code = code & "    MsgBox ""Your order has been placed."""
    mdl.InsertLines ln + 1, code

    ' --- Write path C.4: Order Title ('MWTitle'/'LO-Title' pending) ---
    ln = mdl.CreateEventProc("Click", "cmdOrderTitle")
    code = "    Dim ans As String, sql As String, prop As Variant" & vbCrLf
    code = code & "    prop = Me!txtActivePropNo" & vbCrLf
    code = code & "    If Len(Nz(prop, """")) = 0 Then" & vbCrLf
    code = code & "        MsgBox ""Activate a collateral row first (click it in the Collateral grid).""" & vbCrLf
    code = code & "        Exit Sub" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    If MissingColl(""Title"") Then Exit Sub" & vbCrLf
    code = code & "    If DCount(""*"", ""tblTitle"", ""MWPropertyNo="" & prop & "" AND Source='MWTitle' AND Status='Pending'"") > 0 Then" & vbCrLf
    code = code & "        MsgBox ""A Midwest title order is already pending for this property.""" & vbCrLf
    code = code & "        Exit Sub" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    ans = InputBox(""Are you sure you want to order Title for property "" & prop & ""?  Type yes to continue."", ""Order Title"")" & vbCrLf
    code = code & "    If LCase(Trim(ans)) <> ""yes"" Then Exit Sub" & vbCrLf
    code = code & "    sql = ""INSERT INTO tblTitle (ProjectName, MWPropertyNo, RelatedLoans, Priority, SourceDate, Source, Status, TitleVendor) VALUES (""" & vbCrLf
    code = code & "    sql = sql & ""'"" & Q(Me!ProjectName) & ""',"" & prop & "",'"" & Q(Me!RelatedLoans) & ""',"" & Nz(Me!txtActivePriority, 0) & "",#09/09/1999#,'MWTitle','Pending','LO-Title')""" & vbCrLf
    code = code & "    CurrentDb.Execute sql, dbFailOnError" & vbCrLf
    code = code & "    RefreshBPOTitle" & vbCrLf
    code = code & "    MsgBox ""Your order has been placed."""
    mdl.InsertLines ln + 1, code

    ' Inject the auto-grow layout helpers at the end of the form module
    ' (one statement per line - VBA caps line continuations at ~24 per
    ' statement; `code` was declared in the wiring block above)
    code = ""
    code = code & "Private Function OvGrow(s As String) As Long" & vbCrLf
    code = code & "    ' Estimate rendered lines: hard returns + word-wrap at ~95 chars" & vbCrLf
    code = code & "    Dim lines As Long, p As Variant" & vbCrLf
    code = code & "    lines = 0" & vbCrLf
    code = code & "    For Each p In Split(s, Chr(13) & Chr(10))" & vbCrLf
    code = code & "        lines = lines + 1 + Int(Len(p) / 95)" & vbCrLf
    code = code & "    Next" & vbCrLf
    code = code & "    If lines < 3 Then lines = 3" & vbCrLf
    code = code & "    OvGrow = lines * 235 + 150   ' twips per line + padding" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Public Sub OvLayout()" & vbCrLf
    code = code & "    ' Grow each Overview box to its content and reflow the stack." & vbCrLf
    code = code & "    ' Growth is clamped to the tab page bottom (pages cannot scroll)." & vbCrLf
    code = code & "    Const TOPY As Long = 5357" & vbCrLf
    code = code & "    Const BOTY As Long = 11000" & vbCrLf
    code = code & "    Const MINH As Long = 792" & vbCrLf
    code = code & "    Const LBLH As Long = 340" & vbCrLf
    code = code & "    Dim boxes As Variant, lbls As Variant" & vbCrLf
    code = code & "    Dim i As Integer, y As Long, want As Long, maxA As Long, s As String" & vbCrLf
    code = code & "    boxes = Array(""RelationshipOverview"", ""CollateralOverview"", ""ConditionsDeadlines"")" & vbCrLf
    code = code & "    lbls = Array(""lblRelOv"", ""lblCollOv"", ""lblBid"")" & vbCrLf
    code = code & "    y = TOPY" & vbCrLf
    code = code & "    On Error Resume Next   ' layout must never break typing" & vbCrLf
    code = code & "    For i = 0 To 2" & vbCrLf
    code = code & "        s = """"" & vbCrLf
    code = code & "        Err.Clear" & vbCrLf
    code = code & "        s = Me(boxes(i)).Text          ' available while focused" & vbCrLf
    code = code & "        If Err.Number <> 0 Then Err.Clear: s = Nz(Me(boxes(i)).Value, """")" & vbCrLf
    code = code & "        want = OvGrow(s)" & vbCrLf
    code = code & "        maxA = BOTY - y - (2 - i) * (MINH + LBLH) - LBLH" & vbCrLf
    code = code & "        If want > maxA Then want = maxA" & vbCrLf
    code = code & "        If want < MINH Then want = MINH" & vbCrLf
    code = code & "        Me(lbls(i)).Top = y" & vbCrLf
    code = code & "        Me(boxes(i)).Top = y + LBLH - 20" & vbCrLf
    code = code & "        Me(boxes(i)).Height = want" & vbCrLf
    code = code & "        y = y + LBLH + want + 120" & vbCrLf
    code = code & "    Next i" & vbCrLf
    code = code & "End Sub" & vbCrLf
    mdl.InsertLines mdl.CountOfLines + 1, code

    ' Inject the write-path helpers: quote escaper, session user,
    ' the 7-field collateral guard chain, and the two runtime
    ' listbox-SQL refreshers (production 'nothing'-placeholder pattern)
    code = ""
    code = code & "Private Function Q(v As Variant) As String" & vbCrLf
    code = code & "    Q = Replace(Nz(v, """"), ""'"", ""''"")" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Private Function CurUser() As String" & vbCrLf
    code = code & "    CurUser = Nz(DLookup(""CurrentUser"", ""xtblLocalCurrentUser""), ""MW"")" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Private Function MissingColl(pfx As String) As Boolean" & vbCrLf
    code = code & "    ' Production guard chain: seven required collateral fields" & vbCrLf
    code = code & "    Dim fds As Variant, caps As Variant, i As Integer, crit As String" & vbCrLf
    code = code & "    fds = Array(""MWCollateralCode"", ""Address"", ""City"", ""State"", ""Zip"", ""County"", ""TaxParcelIDNO"")" & vbCrLf
    code = code & "    caps = Array(""Collateral Code"", ""Address"", ""City Code"", ""State Code"", ""Zip Code"", ""County"", ""Parcel Number"")" & vbCrLf
    code = code & "    crit = ""MWPropertyNo="" & Me!txtActivePropNo" & vbCrLf
    code = code & "    For i = 0 To 6" & vbCrLf
    code = code & "        If Len(Nz(DLookup(fds(i), ""CollateralInfo"", crit), """")) = 0 Then" & vbCrLf
    code = code & "            MsgBox ""To order "" & pfx & "" you must complete the "" & caps(i) & "" on the Collateral Tab""" & vbCrLf
    code = code & "            MissingColl = True" & vbCrLf
    code = code & "            Exit Function" & vbCrLf
    code = code & "        End If" & vbCrLf
    code = code & "    Next i" & vbCrLf
    code = code & "End Function" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Public Sub RefreshComments()" & vbCrLf
    code = code & "    Dim s As String, g As String" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    g = Nz(Me!CommentFilter, ""**Show All**"")" & vbCrLf
    code = code & "    s = ""SELECT KeyProvision, Format([Date],'mm/dd/yy') AS Dt, [Group], Left([Comment],150) AS [Comment Detail] FROM tblcomments""" & vbCrLf
    code = code & "    s = s & "" WHERE ProjectName='"" & Q(Me!ProjectName) & ""' AND RelatedLoans='"" & Q(Me!RelatedLoans) & ""'""" & vbCrLf
    code = code & "    If g <> ""**Show All**"" And Len(g) > 0 Then" & vbCrLf
    code = code & "        s = s & "" AND [Group]='"" & Q(g) & ""' ORDER BY [Group], KeyProvision""" & vbCrLf
    code = code & "    Else" & vbCrLf
    code = code & "        s = s & "" ORDER BY [Date] DESC""" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    Me!lstComments.RowSource = s" & vbCrLf
    code = code & "End Sub" & vbCrLf
    code = code & "" & vbCrLf
    code = code & "Public Sub RefreshBPOTitle()" & vbCrLf
    code = code & "    Dim s As String" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    s = ""SELECT MWPropertyNo, BPOBroker, Status, Format(BPODate,'mm/dd/yy') AS Ordered, BPOProvider, Format(SubjSalePrice,'$#,##0') AS SalePrice FROM tblBPO""" & vbCrLf
    code = code & "    s = s & "" WHERE ProjectName='"" & Q(Me!ProjectName) & ""' AND RelatedLoans='"" & Q(Me!RelatedLoans) & ""' ORDER BY MWPropertyNo, BPOBroker""" & vbCrLf
    code = code & "    Me!lstBPOs.RowSource = s" & vbCrLf
    code = code & "    s = ""SELECT MWPropertyNo, Source, Status, Format(SourceDate,'mm/dd/yy') AS SrcDt, TitleVendor FROM tblTitle""" & vbCrLf
    code = code & "    s = s & "" WHERE ProjectName='"" & Q(Me!ProjectName) & ""' AND RelatedLoans='"" & Q(Me!RelatedLoans) & ""' ORDER BY MWPropertyNo""" & vbCrLf
    code = code & "    Me!lstTitles.RowSource = s" & vbCrLf
    code = code & "End Sub" & vbCrLf
    mdl.InsertLines mdl.CountOfLines + 1, code

    SaveAs nm, "frmWorkbench"

    DoCmd.OpenForm "frmWorkbench", acDesign
    Dim f As Form: Set f = Forms("frmWorkbench")
    f!subLoans.LinkMasterFields = "RelatedLoans": f!subLoans.LinkChildFields = "RelatedLoans"
    f!subLoanDetail.LinkMasterFields = "RelatedLoans": f!subLoanDetail.LinkChildFields = "RelatedLoans"
    f!subCollateral.LinkMasterFields = "RelatedLoans": f!subCollateral.LinkChildFields = "RelatedLoans"
    f!subTasks.LinkMasterFields = "RelatedLoans": f!subTasks.LinkChildFields = "RelatedLoans"
    ' Comments editor: two-field link, exactly like production's
    ' cFrmCommentsSub (ProjectName;RelatedLoans)
    f!subComments.LinkMasterFields = "ProjectName;RelatedLoans"
    f!subComments.LinkChildFields = "ProjectName;RelatedLoans"
    ' Borrower/PayHist datasheets stay unlinked until their production
    ' schemas are confirmed (see INTERFACE-ALIGNMENT-PLAN Phase 4);
    ' the BPO/Title listboxes are filtered by runtime SQL instead.
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
    ' Current project indicator + switch (login-time scoping, per production)
    Dim tp As Control
    Set tp = CreateControl(nm, acTextBox, acHeader, "", _
        "=DLookUp(""CurrentProject"",""xtblLocalCurrentProject"")", _
        CLng(3.4 * T1), CLng(0.07 * T1), CLng(2.2 * T1), CLng(0.22 * T1))
    tp.Name = "txtProject": tp.BackStyle = 0: tp.BorderStyle = 0
    tp.ForeColor = CLR_GREEN: tp.FontName = FONT: tp.FontSize = 9
    tp.Locked = True: tp.TabStop = False
    Set tp = CreateControl(nm, acCommandButton, acHeader, "", "", _
        CLng(5.8 * T1), CLng(0.05 * T1), CLng(1.3 * T1), CLng(0.26 * T1))
    tp.Name = "btnProject": tp.Caption = "Switch Project"
    On Error Resume Next
    tp.UseTheme = False: tp.BackColor = CLR_INPUT: tp.ForeColor = CLR_TEXTSEC
    tp.BorderColor = CLR_INBORDER: tp.FontName = FONT: tp.FontSize = 8
    On Error GoTo 0
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
    frm!btnProject.OnClick = "[Event Procedure]"
    ln = mdl.CreateEventProc("Click", "btnProject")
    mdl.InsertLines ln + 1, "    DoCmd.OpenForm ""frmLogin"""
    SaveAs nm, "frmBrowser"
End Sub

' ================= FORM: LOGIN (project selection) ===================
' Mirrors production frmLogin: choose the project, which scopes every
' query in the session via xtblLocalCurrentProject.
Private Sub BuildFrmLogin()
    Dim frm As Form, nm As String, c As Control
    DropIfExists "frmLogin", acForm
    Set frm = CreateForm
    nm = frm.Name
    frm.Section(acDetail).BackColor = CLR_MAIN
    frm.RecordSelectors = False
    frm.NavigationButtons = False
    frm.Caption = "LOANSYSTEM - Select Project"
    frm.PopUp = True
    frm.HasModule = True

    AddThemedLabel frm, "LOAN", 0.4, 0.3, CLR_TEXT, 14, True
    AddThemedLabel frm, "SYSTEM", 1.15, 0.3, CLR_GREEN, 14, True
    AddThemedLabel frm, "Project", 0.4, 0.85, CLR_MUTED, 9
    Set c = CreateControl(nm, acComboBox, acDetail, "", "", _
                          CLng(0.4 * T1), CLng(1.1 * T1), CLng(2.6 * T1), CLng(0.26 * T1))
    c.Name = "cboProject"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT ProjectName FROM tblProjects ORDER BY ProjectName;"
    c.LimitToList = True
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT
    c.BorderColor = CLR_INBORDER: c.FontName = FONT: c.FontSize = 10
    c.DefaultValue = "=DLookUp(""CurrentProject"",""xtblLocalCurrentProject"")"
    On Error GoTo 0

    ' Initials picker (GAP-PLAN B14): the cheap half of production
    ' auth - session initials drive AcctOfficer stamps and defaults
    AddThemedLabel frm, "Initials", 0.4, 1.5, CLR_MUTED, 9
    Set c = CreateControl(nm, acComboBox, acDetail, "", "", _
                          CLng(0.4 * T1), CLng(1.72 * T1), CLng(1# * T1), CLng(0.26 * T1))
    c.Name = "cboUser"
    c.RowSourceType = "Table/Query"
    c.RowSource = "SELECT Initials FROM ztblLogins ORDER BY Initials;"
    c.LimitToList = False
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT
    c.BorderColor = CLR_INBORDER: c.FontName = FONT: c.FontSize = 10
    c.DefaultValue = "=DLookUp(""CurrentUser"",""xtblLocalCurrentUser"")"
    On Error GoTo 0

    Set c = CreateControl(nm, acCommandButton, acDetail, "", "", _
                          CLng(0.4 * T1), CLng(2.25 * T1), CLng(1.2 * T1), CLng(0.3 * T1))
    c.Name = "btnOpen": c.Caption = "Open"
    On Error Resume Next
    c.UseTheme = False: c.BackColor = CLR_GREEN5: c.ForeColor = CLR_TEXT
    c.FontName = FONT: c.FontSize = 9
    On Error GoTo 0

    Dim mdl As Module, ln As Long, code As String
    frm!btnOpen.OnClick = "[Event Procedure]"
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("Click", "btnOpen")
    code = "    If IsNull(Me!cboProject) Then Exit Sub" & vbCrLf
    code = code & "    CurrentDb.Execute ""DELETE FROM xtblLocalCurrentProject""" & vbCrLf
    code = code & "    CurrentDb.Execute ""INSERT INTO xtblLocalCurrentProject (CurrentProject) VALUES ('"" & Replace(Me!cboProject, ""'"", ""''"") & ""')""" & vbCrLf
    code = code & "    If Not IsNull(Me!cboUser) Then" & vbCrLf
    code = code & "        CurrentDb.Execute ""DELETE FROM xtblLocalCurrentUser""" & vbCrLf
    code = code & "        CurrentDb.Execute ""INSERT INTO xtblLocalCurrentUser (CurrentUser) VALUES ('"" & Replace(Me!cboUser, ""'"", ""''"") & ""')""" & vbCrLf
    code = code & "    End If" & vbCrLf
    code = code & "    DoCmd.OpenForm ""frmBrowser""" & vbCrLf
    code = code & "    On Error Resume Next" & vbCrLf
    code = code & "    Forms(""frmBrowser"").Requery" & vbCrLf
    code = code & "    DoCmd.Close acForm, Me.Name"
    mdl.InsertLines ln + 1, code
    SaveAs nm, "frmLogin"
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
    frm.ScrollBars = 3          ' both - form scrolls when larger than window
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

' Label + bound combo (GAP-PLAN B5). Sets only properties that exist
' on combos (constraint 4); cosmetic colors wrapped, never events.
Private Sub DarkComboL(frm As Form, src As String, cap As String, xIn As Single, _
                       yIn As Single, wIn As Single, rowType As String, _
                       rowSrc As String, Optional colCount As Integer = 1, _
                       Optional widths As String = "")
    AddThemedLabel frm, cap, xIn, yIn + 0.01, CLR_MUTED, 8
    Dim c As Control
    Set c = CreateControl(frm.Name, acComboBox, acDetail, "", src, _
                          CLng((xIn + 1.15) * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(0.24 * T1))
    c.Name = Replace(Replace(src, "[", ""), "]", "")
    c.RowSourceType = rowType
    c.RowSource = rowSrc
    c.ColumnCount = colCount
    c.BoundColumn = 1
    If Len(widths) > 0 Then c.ColumnWidths = widths
    c.LimitToList = False
    On Error Resume Next
    c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXT: c.BorderColor = CLR_INBORDER
    c.SpecialEffect = 0: c.FontName = FONT: c.FontSize = 9
    On Error GoTo 0
End Sub

Private Sub DarkButton(c As Control)
    On Error Resume Next
    c.UseTheme = False: c.BackColor = CLR_INPUT: c.ForeColor = CLR_TEXTSEC
    c.BorderColor = CLR_INBORDER: c.FontName = FONT: c.FontSize = 8
    On Error GoTo 0
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
