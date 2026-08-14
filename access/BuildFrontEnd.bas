Attribute VB_Name = "BuildFrontEnd"
Option Compare Database
Option Explicit

' =====================================================================
' MidwestDDi Access Front-End Builder
'
' Builds a complete linked front-end for the MidwestDDi database:
'   - Links the core SQL tables via the sqlDueDiligence DSN
'   - frmBrowser        relationship browser (sorted by project + SortNo,
'                       aggregate UPB, double-click to open workbench)
'   - frmWorkbench      relationship workbench: flag checkboxes, loan and
'                       collateral lists, tasks, narrative sections
'   - frmLoanList       read-only loan grid (principal descending)
'   - frmLoanDetail     editable loan detail panel (workbook layout)
'   - frmCollateralList read-only collateral grid
'   - frmCollateralDetail  editable collateral detail panel
'   - frmTasks          task cards with a perpetual new-entry row
'
' Editability follows the Architecture workbook's yellow-cell rules:
' grids are read-only, detail panels and flags are editable, keys are
' locked.
'
' HOW TO USE
'   1. Create a new blank database (.accdb) on a machine that has the
'      sqlDueDiligence DSN (same machine where the production Access
'      front-end works).
'   2. Enable content when prompted (macros must be allowed).
'   3. Alt+F11 -> File -> Import File -> pick this .bas file
'      (or Insert -> Module and paste the contents).
'   4. Press Ctrl+G to open the Immediate window, type:  BuildAll
'      and press Enter.
'   5. Close the VBA editor. Open frmBrowser. Done.
'
' The build is idempotent: run BuildAll again to rebuild everything
' (existing links/queries/forms with the same names are replaced).
' =====================================================================

' Matches the production app's linked-table connection string exactly —
' TrustServerCertificate=Yes is required when the server uses a
' self-signed certificate (omitting it makes every link fail).
Private Const CONNECT As String = _
    "ODBC;DSN=sqlDueDiligence;DATABASE=MidwestDDi;Trusted_Connection=Yes;" & _
    "APP=Microsoft Office;Encrypt=Optional;TrustServerCertificate=Yes"

' Twips: 1440 per inch
Private Const T1 As Long = 1440

' ---------------------------------------------------------------------
Public Sub BuildAll()
    On Error GoTo Fail
    LinkTables
    BuildQueries
    BuildFrmLoanList
    BuildFrmLoanDetail
    BuildFrmCollateralList
    BuildFrmCollateralDetail
    BuildFrmTasks
    BuildFrmWorkbench
    BuildFrmBrowser
    MsgBox "Front-end built successfully." & vbCrLf & vbCrLf & _
           "Open frmBrowser to start.", vbInformation, "MidwestDDi Front-End"
    Exit Sub
Fail:
    MsgBox "Build failed: " & Err.Description, vbCritical, "MidwestDDi Front-End"
End Sub

' ================= TABLE LINKS =======================================
' Uses DAO CreateTableDef instead of DoCmd.TransferDatabase because
' TransferDatabase ignores the destination name for ODBC links and
' stamps them 'dbo_tblLoan' - DAO names the link exactly as told.
Private Sub LinkTables()
    Dim db As DAO.Database: Set db = CurrentDb
    Dim tables As Variant, i As Integer
    Dim td As DAO.TableDef
    Dim ok As String, bad As String
    tables = Array("tblRelationships", "tblLoan", "CollateralInfo", _
                   "tblTasks", "tblBorrowers", "tblBorrowerLookup", _
                   "tblcomments", "tblPayHistory")
    For i = LBound(tables) To UBound(tables)
        ' Clean up both naming variants from earlier attempts
        DropTableDef db, CStr(tables(i))
        DropTableDef db, "dbo_" & tables(i)

        On Error Resume Next
        Set td = db.CreateTableDef(CStr(tables(i)))
        td.Connect = CONNECT
        td.SourceTableName = "dbo." & tables(i)
        db.TableDefs.Append td
        If Err.Number <> 0 Then
            ' Retry without the schema prefix
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
               "Linked OK:" & ok & vbCrLf & vbCrLf & _
               "Run TestConnection (Ctrl+G, type TestConnection) for the " & _
               "exact ODBC error.", vbExclamation, "Link results"
        If Len(ok) = 0 Then Err.Raise vbObjectError + 1, , _
            "No tables linked - check the connection (run TestConnection)."
    End If
End Sub

Private Sub DropTableDef(db As DAO.Database, nm As String)
    On Error Resume Next
    db.TableDefs.Delete nm
    Err.Clear
    On Error GoTo 0
End Sub

' Diagnose the ODBC connection: run this from the Immediate window
' (Ctrl+G, type TestConnection) and send the message shown.
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
    MsgBox "Connection FAILED:" & vbCrLf & vbCrLf & Err.Description & vbCrLf & vbCrLf & _
           "Common fixes:" & vbCrLf & _
           "1. Confirm you are on the network / VPN." & vbCrLf & _
           "2. Open the production Access app on this machine - if its " & _
           "linked tables open, the DSN works and the name matches." & vbCrLf & _
           "3. Check the DSN name in Start > ODBC Data Sources (both " & _
           "64-bit and 32-bit apps): is it exactly 'sqlDueDiligence'?", _
           vbCritical, "TestConnection"
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
        "PrincipalBalance, InterestBalance, Rate, RepayAmt, DueDt, " & _
        "LastPmtDt, OrgNoteDate, CurrentMaturityDate " & _
        "FROM tblLoan ORDER BY PrincipalBalance DESC;"

    db.QueryDefs.Refresh
End Sub

' ================= FORM: LOAN LIST (read-only grid) ==================
Private Sub BuildFrmLoanList()
    Dim frm As Form, nm As String
    DropIfExists "frmLoanList", acForm
    Set frm = CreateForm
    nm = frm.Name
    frm.RecordSource = "qryLoansSorted"
    frm.DefaultView = 2               ' datasheet
    frm.AllowEdits = False            ' grid = read-only summary
    frm.AllowAdditions = False
    frm.AllowDeletions = False
    frm.HasModule = True

    AddCol frm, "MWLoanNo", "Loan No", 1.4
    AddCol frm, "RelatedLoans", "Related", 1
    AddCol frm, "BorrowerNm", "Borrower", 2
    AddCol frm, "OrigPrincipalBalance", "Orig Balance", 1
    AddCol frm, "PrincipalBalance", "UPB", 1
    AddCol frm, "InterestBalance", "Interest", 1
    AddCol frm, "Rate", "Rate", 0.6
    AddCol frm, "RepayAmt", "PMT", 0.8
    AddCol frm, "DueDt", "NxtDue", 0.8
    AddCol frm, "LastPmtDt", "LastPmt", 0.8
    AddCol frm, "OrgNoteDate", "OrigDt", 0.8
    AddCol frm, "CurrentMaturityDate", "MatDt", 0.8

    ' Double-click a loan number opens the editable detail panel
    Dim mdl As Module, ln As Long
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("DblClick", "MWLoanNo")
    mdl.InsertLines ln + 1, _
        "    DoCmd.OpenForm ""frmLoanDetail"", , , ""MWLoanNo='"" & Me!MWLoanNo & ""'"""

    SaveAs nm, "frmLoanList"
End Sub

' ================= FORM: LOAN DETAIL (editable panel) ================
Private Sub BuildFrmLoanDetail()
    Dim frm As Form, nm As String
    DropIfExists "frmLoanDetail", acForm
    Set frm = CreateForm
    nm = frm.Name
    frm.RecordSource = "tblLoan"
    frm.Caption = "Loan Detail"
    frm.DefaultView = 0               ' single form

    ' Column 1: identity (key locked) + borrower block
    Dim y As Single: y = 0.2
    AddBoxL frm, "MWLoanNo", "MW Loan #", 0.2, y, 1.9, True: y = y + 0.45
    AddBoxL frm, "BorrowerNm", "Borrower", 0.2, y, 1.9: y = y + 0.45
    AddBoxL frm, "RelatedLoans", "Related", 0.2, y, 1.9: y = y + 0.45
    AddBoxL frm, "Pool", "Pool", 0.2, y, 1.9: y = y + 0.45
    AddBoxL frm, "consumerloan", "Consumer Loan", 0.2, y, 0.4: y = y + 0.45
    AddBoxL frm, "BorrowerAddress", "Address", 0.2, y, 1.9: y = y + 0.45
    AddBoxL frm, "BorrowerAddress2", "Address 2", 0.2, y, 1.9: y = y + 0.45
    AddBoxL frm, "CityNm", "City", 0.2, y, 1.1
    AddBox frm, "StCd", 2.5, y, 0.5
    AddBox frm, "ZipCd", 3.05, y, 0.75: y = y + 0.45
    AddBoxL frm, "LastImport", "Last Import", 0.2, y, 1.9

    ' Column 2: balances
    y = 0.2
    AddBoxL frm, "OrigPrincipalBalance", "Orig Bal", 4.1, y, 1.4: y = y + 0.45
    AddBoxL frm, "PrincipalBalance", "Prin Bal", 4.1, y, 1.4: y = y + 0.45
    AddBoxL frm, "InterestBalance", "Int Bal", 4.1, y, 1.4: y = y + 0.45
    AddBoxL frm, "EscrowBalance", "Esc Bal", 4.1, y, 1.4: y = y + 0.45
    AddBoxL frm, "OtherBalances", "Oth Bal", 4.1, y, 1.4: y = y + 0.45
    AddBoxL frm, "PayoffBalance", "Payoff", 4.1, y, 1.4: y = y + 0.45
    AddBoxL frm, "RepayAmt", "Pmt Amt", 4.1, y, 1.4: y = y + 0.45
    AddBoxL frm, "EscrowPmt", "Esc Pmt", 4.1, y, 1.4

    ' Column 3: dates + rates
    y = 0.2
    AddBoxL frm, "OrgNoteDate", "Orig Dt", 7.1, y, 1.2: y = y + 0.45
    AddBoxL frm, "InterestAccrualDate", "Iacc Dt", 7.1, y, 1.2: y = y + 0.45
    AddBoxL frm, "DueDt", "Due Dt", 7.1, y, 1.2: y = y + 0.45
    AddBoxL frm, "LastPmtDt", "Last PDt", 7.1, y, 1.2: y = y + 0.45
    AddBoxL frm, "CurrentMaturityDate", "Mat Dt", 7.1, y, 1.2: y = y + 0.45
    AddBoxL frm, "Rate", "Rate", 7.1, y, 1.2: y = y + 0.45
    AddBoxL frm, "DefaultRate", "Def Rate", 7.1, y, 1.2: y = y + 0.45
    AddBoxL frm, "nextchangedt", "Ch Dt", 7.1, y, 1.2

    ' Column 4: rate structure
    y = 0.2
    AddBoxL frm, "RateType", "R Type", 10#, y, 1.2: y = y + 0.45
    AddBoxL frm, "index", "Index", 10#, y, 1.2: y = y + 0.45
    AddBoxL frm, "margin", "Margin", 10#, y, 1.2: y = y + 0.45
    AddBoxL frm, "floor", "Floor", 10#, y, 1.2: y = y + 0.45
    AddBoxL frm, "ceiling", "Ceiling", 10#, y, 1.2: y = y + 0.45
    AddBoxL frm, "changefreq", "Ch Frq", 10#, y, 1.2: y = y + 0.45
    AddBoxL frm, "AssetType", "Asset Type", 10#, y, 1.2: y = y + 0.45
    AddBoxL frm, "[Unfunded Commitment]", "Unfunded", 10#, y, 1.2

    SaveAs nm, "frmLoanDetail"
End Sub

' ================= FORM: COLLATERAL LIST =============================
Private Sub BuildFrmCollateralList()
    Dim frm As Form, nm As String
    DropIfExists "frmCollateralList", acForm
    Set frm = CreateForm
    nm = frm.Name
    frm.RecordSource = "CollateralInfo"
    frm.DefaultView = 2
    frm.AllowEdits = False
    frm.AllowAdditions = False
    frm.AllowDeletions = False
    frm.HasModule = True

    AddCol frm, "Priority", "Pri", 0.5
    AddCol frm, "MWPropertyNo", "Property No", 1
    AddCol frm, "RelatedLoans", "Related", 1
    AddCol frm, "MWCollateralCode", "Code", 1.2
    AddCol frm, "Description", "Description", 1.6
    AddCol frm, "Address", "Address", 1.6
    AddCol frm, "City", "City", 1
    AddCol frm, "State", "St", 0.4
    AddCol frm, "SellerAppraisedValue", "Seller Value", 1
    AddCol frm, "CurrentAppraisedValue", "MW Value", 1

    Dim mdl As Module, ln As Long
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("DblClick", "MWPropertyNo")
    mdl.InsertLines ln + 1, _
        "    DoCmd.OpenForm ""frmCollateralDetail"", , , ""MWPropertyNo="" & Me!MWPropertyNo"

    SaveAs nm, "frmCollateralList"
End Sub

' ================= FORM: COLLATERAL DETAIL ===========================
Private Sub BuildFrmCollateralDetail()
    Dim frm As Form, nm As String
    DropIfExists "frmCollateralDetail", acForm
    Set frm = CreateForm
    nm = frm.Name
    frm.RecordSource = "CollateralInfo"
    frm.Caption = "Collateral Detail"
    frm.DefaultView = 0

    Dim y As Single: y = 0.2
    AddBoxL frm, "MWPropertyNo", "Property No", 0.2, y, 1.6, True: y = y + 0.45
    AddBoxL frm, "MWCollateralCode", "Code", 0.2, y, 1.6: y = y + 0.45
    AddBoxL frm, "Description", "Description", 0.2, y, 1.6: y = y + 0.45
    AddBoxL frm, "OwnerName", "Owner", 0.2, y, 1.6: y = y + 0.45
    AddBoxL frm, "Address", "Address", 0.2, y, 1.6: y = y + 0.45
    AddBoxL frm, "City", "City", 0.2, y, 1#
    AddBox frm, "State", 2.3, y, 0.5
    AddBox frm, "Zip", 2.85, y, 0.75: y = y + 0.45
    AddBoxL frm, "County", "County", 0.2, y, 1.6: y = y + 0.45
    AddBoxL frm, "TaxParcelIDNO", "Parcel Id", 0.2, y, 1.6: y = y + 0.45
    AddBoxL frm, "Latitude", "Latitude", 0.2, y, 1.6: y = y + 0.45
    AddBoxL frm, "Longitude", "Longitude", 0.2, y, 1.6

    y = 0.2
    AddBoxL frm, "LienPosition", "Seller Lien", 4.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "SeniorLienAmount", "Sr Lien Amt", 4.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "MWTitleLienPosition", "MW Lien", 4.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "MWTitleSrLienAmt", "MW Sr Lien", 4.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "TaxAnnualAmt", "Tax / Yr", 4.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "TaxDelinquentAmt", "Delq Amt", 4.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "TaxAssessedValue", "TAV", 4.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "TaxMarketValue", "TMV", 4.2, y, 1.2

    y = 0.2
    AddBoxL frm, "SQFT", "SF", 7.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "NumUnits", "Units", 7.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "Acreage", "Acres", 7.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "CurrentAppraisedValue", "MW Value", 7.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "SellerAppraisedValue", "Seller Val", 7.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "PossibleEnvironmental", "Environmental", 7.2, y, 0.4: y = y + 0.45
    AddBoxL frm, "IsFloodZone", "Flood Zone", 7.2, y, 0.4: y = y + 0.45
    AddBoxL frm, "RealEstateGroup", "Group", 7.2, y, 1.2: y = y + 0.45
    AddBoxL frm, "TaxWebCard", "Tax Card", 7.2, y, 1.2

    Dim c As Control
    Set c = CreateControl(nm, acTextBox, acDetail, "", "PropertyComment", _
                          CLng(0.2 * T1), CLng(5.4 * T1), CLng(8.2 * T1), CLng(1.2 * T1))
    c.Name = "PropertyComment": c.ScrollBars = 2
    AddLabel frm, "Prop Detail", 0.2, 5.15

    SaveAs nm, "frmCollateralDetail"
End Sub

' ================= FORM: TASKS =======================================
Private Sub BuildFrmTasks()
    Dim frm As Form, nm As String
    DropIfExists "frmTasks", acForm
    Set frm = CreateForm
    nm = frm.Name
    frm.RecordSource = "SELECT * FROM tblTasks ORDER BY EntryDate DESC"
    frm.DefaultView = 1               ' continuous - cards
    frm.AllowAdditions = True         ' perpetual new-entry row (spec note)

    Dim y As Single: y = 0.15
    AddBoxL frm, "AcctOfficer", "Task For", 0.2, y, 1#
    AddBoxL frm, "EntryAcctOfficer", "Entered By", 3#, y, 1#
    AddBoxL frm, "EntryDate", "Date", 5.8, y, 1.1
    AddBoxL frm, "Completed", "Complete", 8.2, y, 0.4
    AddBoxL frm, "CompleteDate", "Done", 9.4, y, 1#
    y = y + 0.5
    Dim c As Control
    Set c = CreateControl(nm, acTextBox, acDetail, "", "Comment", _
                          CLng(0.2 * T1), CLng(y * T1), CLng(10.2 * T1), CLng(0.7 * T1))
    c.Name = "Comment": c.ScrollBars = 2

    ' EntryDate defaults to now for new tasks.
    ' NOTE: if tblTasks.KeyGenerator is NOT an IDENTITY column, uncomment
    ' the DefaultValue line so new rows mint the next key client-side.
    frm!EntryDate.DefaultValue = "=Now()"
    'frm!KeyGenerator.DefaultValue = "=DMax(""KeyGenerator"",""tblTasks"")+1"

    SaveAs nm, "frmTasks"
End Sub

' ================= FORM: WORKBENCH ===================================
Private Sub BuildFrmWorkbench()
    Dim frm As Form, nm As String
    DropIfExists "frmWorkbench", acForm
    Set frm = CreateForm
    nm = frm.Name
    frm.RecordSource = "tblRelationships"
    frm.Caption = "Relationship Workbench"
    frm.DefaultView = 0
    frm.HasModule = True

    ' Header: relationship identity (key + sort locked)
    AddBoxL frm, "RelatedLoans", "Relationship", 0.2, 0.2, 1.6, True
    AddBoxL frm, "SortNo", "Sort", 4#, 0.2, 0.5, True
    AddBoxL frm, "ProjectName", "Project", 5.8, 0.2, 1.8, True
    AddBoxL frm, "ExitCode", "Exit Code", 9.2, 0.2, 1.3

    ' Flag panel (editable from any view - yellow-cell rule)
    Dim flags As Variant, i As Integer, y As Single
    flags = Array("InBankruptcy", "ForeclosureFlag", "LitigationFlag", _
                  "ForbearanceFlag", "JudgmentFlag", "LowYieldAsset")
    y = 0.8
    For i = 0 To UBound(flags)
        AddBoxL frm, CStr(flags(i)), CStr(flags(i)), 11.3, y, 0.3
        y = y + 0.35
    Next i

    ' Loan grid subform (read-only, principal descending)
    AddSub frm, "frmLoanList", "subLoans", 0.2, 0.8, 10.8, 2.2
    AddLabel frm, "Loans (double-click a loan number for detail)", 0.2, 0.6

    ' Collateral subform
    AddSub frm, "frmCollateralList", "subCollateral", 0.2, 3.35, 10.8, 1.6
    AddLabel frm, "Collateral (double-click a property number for detail)", 0.2, 3.15

    ' Tasks subform
    AddSub frm, "frmTasks", "subTasks", 0.2, 5.25, 10.8, 1.8
    AddLabel frm, "Tasks (bottom row adds a new task)", 0.2, 5.05

    ' Narrative sections (Overview + Strategies fields, bound direct)
    Dim c As Control
    AddLabel frm, "Relationship Overview", 0.2, 7.25
    Set c = CreateControl(nm, acTextBox, acDetail, "", "RelationshipOverview", _
                          CLng(0.2 * T1), CLng(7.5 * T1), CLng(5.3 * T1), CLng(1.4 * T1))
    c.Name = "RelationshipOverview": c.ScrollBars = 2

    AddLabel frm, "Collateral Overview", 5.7, 7.25
    Set c = CreateControl(nm, acTextBox, acDetail, "", "CollateralOverview", _
                          CLng(5.7 * T1), CLng(7.5 * T1), CLng(5.3 * T1), CLng(1.4 * T1))
    c.Name = "CollateralOverview": c.ScrollBars = 2

    AddLabel frm, "Exit Strategy", 0.2, 9.05
    Set c = CreateControl(nm, acTextBox, acDetail, "", "ExitStrategyOverview", _
                          CLng(0.2 * T1), CLng(9.3 * T1), CLng(5.3 * T1), CLng(1.2 * T1))
    c.Name = "ExitStrategyOverview": c.ScrollBars = 2

    AddLabel frm, "Bid Conditions / Deadlines", 5.7, 9.05
    Set c = CreateControl(nm, acTextBox, acDetail, "", "ConditionsDeadlines", _
                          CLng(5.7 * T1), CLng(9.3 * T1), CLng(5.3 * T1), CLng(1.2 * T1))
    c.Name = "ConditionsDeadlines": c.ScrollBars = 2

    SaveAs nm, "frmWorkbench"

    ' Wire subform links after save (SourceObject must exist)
    DoCmd.OpenForm "frmWorkbench", acDesign
    Dim f As Form: Set f = Forms("frmWorkbench")
    LinkSub f, "subLoans"
    LinkSub f, "subCollateral"
    LinkSub f, "subTasks"
    DoCmd.Close acForm, "frmWorkbench", acSaveYes
End Sub

' ================= FORM: BROWSER =====================================
Private Sub BuildFrmBrowser()
    Dim frm As Form, nm As String
    DropIfExists "frmBrowser", acForm
    Set frm = CreateForm
    nm = frm.Name
    frm.RecordSource = "qryRelationshipSummary"
    frm.Caption = "Relationships"
    frm.DefaultView = 2
    frm.AllowEdits = False
    frm.AllowAdditions = False
    frm.AllowDeletions = False
    frm.HasModule = True

    AddCol frm, "ProjectName", "Project", 1.6
    AddCol frm, "SortNo", "Sort", 0.5
    AddCol frm, "RelatedLoans", "Relationship", 1.4
    AddCol frm, "LoanCount", "Loans", 0.6
    AddCol frm, "TotalUPB", "Total UPB", 1.1
    AddCol frm, "ExitCode", "Exit Code", 1.1
    AddCol frm, "InBankruptcy", "BK", 0.4
    AddCol frm, "ForeclosureFlag", "FC", 0.4
    AddCol frm, "LitigationFlag", "LT", 0.4
    AddCol frm, "ForbearanceFlag", "FA", 0.4
    AddCol frm, "JudgmentFlag", "JG", 0.4
    AddCol frm, "LowYieldAsset", "LYA", 0.4

    Dim mdl As Module, ln As Long
    Set mdl = frm.Module
    ln = mdl.CreateEventProc("DblClick", "RelatedLoans")
    mdl.InsertLines ln + 1, _
        "    DoCmd.OpenForm ""frmWorkbench"", , , ""RelatedLoans='"" & Me!RelatedLoans & ""'"""

    SaveAs nm, "frmBrowser"
End Sub

' ================= HELPERS ===========================================
Private Sub AddCol(frm As Form, src As String, cap As String, wIn As Single)
    ' Datasheet column: bound textbox; caption becomes the column header
    Dim c As Control
    Set c = CreateControl(frm.Name, acTextBox, acDetail, "", src, 0, 0, _
                          CLng(wIn * T1), CLng(0.25 * T1))
    c.Name = Replace(Replace(src, "[", ""), "]", "")
    AttachLabel frm, c, cap
End Sub

Private Sub AddBox(frm As Form, src As String, xIn As Single, yIn As Single, _
                   wIn As Single, Optional lockIt As Boolean = False)
    Dim c As Control
    Set c = CreateControl(frm.Name, acTextBox, acDetail, "", src, _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(0.25 * T1))
    c.Name = Replace(Replace(src, "[", ""), "]", "")
    If lockIt Then c.Locked = True: c.BackColor = RGB(235, 235, 235)
End Sub

Private Sub AddBoxL(frm As Form, src As String, cap As String, xIn As Single, _
                    yIn As Single, wIn As Single, Optional lockIt As Boolean = False)
    AddLabel frm, cap, xIn, yIn - 0.02, 1.15
    AddBox frm, src, xIn + 1.2, yIn, wIn, lockIt
End Sub

Private Sub AddLabel(frm As Form, cap As String, xIn As Single, yIn As Single, _
                     Optional wIn As Single = 3)
    Dim c As Control
    Set c = CreateControl(frm.Name, acLabel, acDetail, "", "", _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(0.22 * T1))
    c.Caption = cap
End Sub

Private Sub AttachLabel(frm As Form, ctl As Control, cap As String)
    Dim lbl As Control
    Set lbl = CreateControl(frm.Name, acLabel, acDetail, ctl.Name, "", 0, 0, _
                            CLng(1 * T1), CLng(0.22 * T1))
    lbl.Caption = cap
End Sub

Private Sub AddSub(frm As Form, srcForm As String, ctlName As String, _
                   xIn As Single, yIn As Single, wIn As Single, hIn As Single)
    Dim c As Control
    Set c = CreateControl(frm.Name, acSubform, acDetail, "", "", _
                          CLng(xIn * T1), CLng(yIn * T1), CLng(wIn * T1), CLng(hIn * T1))
    c.Name = ctlName
    c.SourceObject = srcForm
End Sub

Private Sub LinkSub(f As Form, ctlName As String)
    f(ctlName).LinkMasterFields = "RelatedLoans"
    f(ctlName).LinkChildFields = "RelatedLoans"
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
