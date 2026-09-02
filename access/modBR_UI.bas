Attribute VB_Name = "modBR_UI"
Option Compare Database
Option Explicit

' =====================================================================
' modBR_UI - every event entry point the generated forms call
' ("=BR_Xxx(...)" property strings), the painters, status line.
' The form is a VIEW of gRel: edits go into the model, then repaint.
' =====================================================================

Public gWin As Long
Public gCell() As Control
Public gShown() As Variant
Public gHead() As Control
Public gPH() As Control
Public gPHShown() As Variant
Public gBusy As Boolean
Public gStale As Long
Public gUndo As TUndo
Public gLastKey As String
Public gLastLoan As Long

Private mKeys() As String
Private mCaps() As String
Private mKinds() As String
Private mFmts() As String
Private mRowsOk As Boolean
Private mCacheOk As Boolean
Private mArmed As String
Private mArmedAt As Single
Private mFrozen As Boolean

Private Const CLR_INPUT As Long = 13434879
Private Const CLR_BAD As Long = 11390968      ' #F8CBAD
Private Const CLR_MISSED As Long = 14083324   ' #FCE4D6
Private Const CLR_SHORT As Long = 13434879

' ---------------------------------------------------------------- form access
Private Function HaveMain() As Boolean
    Dim f As Form
    On Error Resume Next
    Set f = Forms("frmBidReader")
    HaveMain = (Err.Number = 0)
    Err.Clear
End Function

Private Function MainF() As Form
    Set MainF = Forms("frmBidReader")
End Function

Private Function SubF(nm As String) As Form
    Set SubF = MainF.Controls(nm).Form
End Function

Private Sub Freeze()
    On Error Resume Next
    Application.Echo False
    mFrozen = True
End Sub

Private Sub Thaw()
    On Error Resume Next
    Application.Echo True
    mFrozen = False
End Sub

Public Function BR_Unfreeze() As Variant
    Thaw
    On Error Resume Next
    SubF("sub_Proj").Painting = True
    SubF("sub_PayHist").Painting = True
    gBusy = False
End Function

Public Sub SetStatus(msg As String)
    On Error Resume Next
    MainF.Controls("lblStatus").Caption = msg
End Sub

Private Sub EnsureRows()
    If Not mRowsOk Then RowDefs mKeys, mCaps, mKinds, mFmts: mRowsOk = True
End Sub

Private Sub EnsureCache()
    Dim f As Form, i As Long, r As Long
    If mCacheOk Then Exit Sub
    EnsureRows
    Set f = SubF("sub_Proj")
    ReDim gCell(1 To NCOLS + 1, 1 To NROWS)
    ReDim gShown(1 To NCOLS + 1, 1 To NROWS)
    ReDim gHead(1 To NCOLS + 1)
    On Error Resume Next
    For i = 1 To NCOLS
        Set gHead(i) = f.Controls("h" & i & "_LoanNo")
        For r = 1 To NROWS
            Set gCell(i, r) = Nothing
            Set gCell(i, r) = f.Controls("c" & i & "_" & mKeys(r))
            gShown(i, r) = "~init~"
        Next r
    Next i
    Set gHead(NCOLS + 1) = f.Controls("hT_LoanNo")
    For r = 1 To NROWS
        Set gCell(NCOLS + 1, r) = Nothing
        Set gCell(NCOLS + 1, r) = f.Controls("cT_" & mKeys(r))
        gShown(NCOLS + 1, r) = "~init~"
    Next r
    Err.Clear
    On Error GoTo 0
    mCacheOk = True
End Sub

Private Sub ClearShown()
    Dim i As Long, r As Long
    If Not mCacheOk Then Exit Sub
    For i = 1 To NCOLS + 1
        For r = 1 To NROWS
            gShown(i, r) = "~init~"
        Next r
    Next i
    Erase gPHShown
End Sub

Private Function BitOf(i As Long) As Long
    BitOf = 2 ^ i
End Function

' ---------------------------------------------------------------- load
Public Function BR_FormLoad() As Variant
    Dim ms As Double, lp As Variant, lr As Variant
    On Error GoTo Done
    mCacheOk = False: mRowsOk = False
    gBusy = False: gStale = 0: gWin = 1
    EnsureLocalTables
    SetStatus "Connecting to sqlDueDiligence..."
    If BR_Ping(ms) Then
        SetStatus "Connected (" & Format(ms, "0") & " ms). Pick a project and relationship."
    Else
        SetStatus "Cannot reach sqlDueDiligence - check the DSN, then Reload."
    End If
    lp = GetGlobal("LastProject")
    If Not IsNull(lp) Then
        MainF.Controls("cboProject") = lp
        SetRelListProject CStr(lp)
        MainF.Controls("cboRelationship").Requery
        lr = GetGlobal("LastRel")
        If Not IsNull(lr) Then
            MainF.Controls("cboRelationship") = lr
            If Nz(MainF.Controls("cboRelationship"), "") = CStr(lr) Then BR_RelChanged
        End If
    End If
Done:
End Function

Public Function BR_ProjectChanged() As Variant
    Dim proj As String, cbo As Control
    On Error GoTo Done
    proj = Nz(MainF.Controls("cboProject"), "")
    If Len(proj) = 0 Then Exit Function
    SetRelListProject proj
    Set cbo = MainF.Controls("cboRelationship")
    cbo.Requery
    SetGlobal "LastProject", proj
    If cbo.ListCount > 0 Then
        cbo.Value = cbo.ItemData(0)
        BR_RelChanged
    Else
        SetStatus "No relationships in " & proj
    End If
Done:
End Function

Public Function BR_RelChanged() As Variant
    Dim proj As String, rel As String, errMsg As String, t0 As Single, t1 As Single, i As Long, vl As String
    If gBusy Then Exit Function
    On Error GoTo Fail
    proj = Nz(MainF.Controls("cboProject"), ""): rel = Nz(MainF.Controls("cboRelationship"), "")
    If Len(proj) = 0 Or Len(rel) = 0 Then Exit Function
    gBusy = True
    t0 = Timer
    SetStatus "Loading " & rel & "..."
    ClearShown
    gRel.ProjectName = proj: gRel.RelatedLoans = rel
    LoadSettings gRel
    If Not LoadRelationship(proj, rel, errMsg) Then
        gBusy = False
        SetStatus "Cannot load " & rel & ": " & errMsg & " - Reload to retry."
        Exit Function
    End If
    LoadInputs gRel
    ComputeTrails gRel
    t1 = Timer
    CalcRel gRel
    gRel.MsCalc = (Timer - t1) * 1000
    gWin = 1
    SetGlobal "LastRel", rel
    ' loan picker for the Optimal page
    vl = Chr(34) & "*" & Chr(34)
    For i = 1 To gRel.LoanCount
        vl = vl & ";" & Chr(34) & gRel.Loans(i).LoanNo & Chr(34)
    Next i
    On Error Resume Next
    MainF.Controls("cboOptLoan").RowSource = vl
    MainF.Controls("cboOptLoan").Value = "*"
    On Error GoTo Fail
    t1 = Timer
    PaintHeader
    PaintProjection &HFFFF
    gRel.MsPaint = (Timer - t1) * 1000
    gStale = 15
    PaintVisiblePage
    gBusy = False
    SetStatus "Loaded " & gRel.LoanCount & " loans · " & gRel.PropCount & " properties · server " & _
              Format(gRel.MsServer, "0") & " ms · calc " & Format(gRel.MsCalc, "0") & " ms · paint " & _
              Format(gRel.MsPaint, "0") & " ms"
    Exit Function
Fail:
    gBusy = False
    Thaw
    SetStatus "Load failed: " & Err.Description
End Function

Public Function BR_RelStep(dir As Long) As Variant
    Dim cbo As Control, idx As Long
    On Error GoTo Done
    Set cbo = MainF.Controls("cboRelationship")
    idx = cbo.ListIndex + dir
    If idx < 0 Or idx >= cbo.ListCount Then Exit Function
    cbo.Value = cbo.ItemData(idx)
    BR_RelChanged
Done:
End Function

Public Function BR_Reload() As Variant
    BR_RelChanged
End Function

' ---------------------------------------------------------------- edits
' Core edit path shared by cell edits, undo, apply-all, optimal pick
Private Function ApplyInput(k As Long, key As String, val As Variant, ByRef note As String, Optional pushUndo As Boolean = True) As Boolean
    Dim oldV As Variant, oldBid As Double
    If k < 1 Or k > gRel.LoanCount Then Exit Function
    oldV = LoanValue(gRel.Loans(k), key)
    oldBid = gRel.Tot.BidUsed
    If Not SetInput(gRel.Loans(k), key, val, note) Then Exit Function
    If pushUndo Then
        gUndo.Valid = True: gUndo.LoanIdx = k: gUndo.Key = key: gUndo.OldVal = oldV: gUndo.NewVal = LoanValue(gRel.Loans(k), key)
    End If
    gLastKey = key: gLastLoan = k
    SaveLoanInput gRel, k, key
    CalcLoan gRel.Loans(k), gRel
    CalcTotals gRel
    gRel.RelOptValid = False
    gStale = gStale Or 13
    ApplyInput = True
End Function

Public Function BR_CellChanged(nm As String) As Variant
    Dim p As Long, i As Long, key As String, k As Long, ctl As Control, note As String, t0 As Single
    Dim oldBid As Double, newBid As Double, oldV As Variant
    If gBusy Then Exit Function
    On Error GoTo Fail
    p = InStr(nm, "_")
    If p < 3 Then Exit Function
    i = CLng(Mid(nm, 2, p - 2)): key = Mid(nm, p + 1)
    k = gWin + i - 1
    Set ctl = SubF("sub_Proj").Controls(nm)
    If k > gRel.LoanCount Then ctl.Value = Null: Exit Function
    gBusy = True
    t0 = Timer
    oldV = LoanValue(gRel.Loans(k), key)
    oldBid = gRel.Loans(k).BidModel
    If Not ApplyInput(k, key, ctl.Value, note) Then
        ctl.Value = oldV
        On Error Resume Next
        ctl.BackColor = CLR_BAD
        On Error GoTo Fail
        SetStatus "Loan " & gRel.Loans(k).LoanNo & " · " & CapOf(key) & ": " & note
        gBusy = False
        Exit Function
    End If
    On Error Resume Next
    ctl.BackColor = CLR_INPUT
    On Error GoTo Fail
    newBid = gRel.Loans(k).BidModel
    PaintProjection BitOf(i) Or 1
    If PageIndex() = 1 Then RefreshOptimalPage
    gBusy = False
    SetStatus "Loan " & gRel.Loans(k).LoanNo & " · " & CapOf(key) & " " & ShowV(oldV) & " → " & ShowV(LoanValue(gRel.Loans(k), key)) & _
              IIf(Len(note) > 0, " (" & note & ")", "") & " · Bid " & Format(newBid, "$#,##0") & " (was " & Format(oldBid, "$#,##0") & ") · " & _
              Format((Timer - t0) * 1000, "0") & " ms"
    Exit Function
Fail:
    gBusy = False
    Thaw
    SetStatus "Edit failed: " & Err.Description
End Function

Private Function CapOf(key As String) As String
    Dim r As Long
    EnsureRows
    For r = 1 To NROWS
        If mKeys(r) = key Then CapOf = mCaps(r): Exit Function
    Next r
    CapOf = key
End Function

Private Function ShowV(v As Variant) As String
    If IsNull(v) Then ShowV = "—" Else ShowV = CStr(v)
End Function

Public Function BR_GlobalChanged(nm As String) As Variant
    Dim v As Variant, d As Double
    If gBusy Then Exit Function
    On Error GoTo Fail
    v = MainF.Controls(nm).Value
    Select Case nm
        Case "txtYield"
            If Not IsNumeric(v) Then PaintHeader: Exit Function
            d = CDbl(v): If d > 1 Then d = d / 100
            If d < 0 Then d = 0
            gRel.Yield = d
        Case "txtJ2"
            If Not IsNumeric(v) Then PaintHeader: Exit Function
            gRel.MinMonthsJ2 = CLng(v): If gRel.MinMonthsJ2 < 0 Then gRel.MinMonthsJ2 = 0
        Case "txtCutoff"
            If Not IsDate(v) Then PaintHeader: Exit Function
            gRel.CutoffDt = CDate(v)
        Case "txtAnchor"
            If Not IsDate(v) Then PaintHeader: Exit Function
            gRel.AnchorDt = CDate(v)
        Case "cboTrailDisp"
            gBusy = True
            PaintProjection &HFFFF
            gStale = gStale Or 4
            If PageIndex() = 2 Then PaintPayHist
            gBusy = False
            Exit Function
    End Select
    If gRel.LoanCount = 0 Then SaveSettings gRel: Exit Function
    gBusy = True
    SaveSettings gRel
    If nm = "txtAnchor" Then ComputeTrails gRel
    CalcRel gRel
    gStale = 15
    PaintHeader
    PaintProjection &HFFFF
    PaintVisiblePage
    gBusy = False
    SetStatus CapGlobal(nm) & " → " & ShowV(v) & " · Bid " & Format(gRel.Tot.BidModel, "$#,##0")
    Exit Function
Fail:
    gBusy = False
    Thaw
    SetStatus "Change failed: " & Err.Description
End Function

Private Function CapGlobal(nm As String) As String
    Select Case nm
        Case "txtYield": CapGlobal = "Yield"
        Case "txtJ2": CapGlobal = "YTM Min Months"
        Case "txtCutoff": CapGlobal = "Cutoff Date"
        Case "txtAnchor": CapGlobal = "PMT History Date"
        Case Else: CapGlobal = nm
    End Select
End Function

Public Function BR_Undo() As Variant
    Dim note As String, tmp As Variant, k As Long, key As String
    If gBusy Or Not gUndo.Valid Then Exit Function
    On Error GoTo Fail
    gBusy = True
    k = gUndo.LoanIdx: key = gUndo.Key
    tmp = gUndo.OldVal
    If ApplyInput(k, key, tmp, note, False) Then
        gUndo.OldVal = gUndo.NewVal: gUndo.NewVal = tmp
        PaintProjection &HFFFF
        If PageIndex() = 1 Then RefreshOptimalPage
        SetStatus "Undo: loan " & gRel.Loans(k).LoanNo & " · " & CapOf(key) & " → " & ShowV(tmp)
    End If
    gBusy = False
    Exit Function
Fail:
    gBusy = False: Thaw
End Function

Public Function BR_ApplyAll() As Variant
    Dim i As Long, v As Variant, note As String, n As Long
    If gBusy Or Len(gLastKey) = 0 Or gLastLoan < 1 Then SetStatus "Edit a yellow cell first, then Apply to all.": Exit Function
    On Error GoTo Fail
    gBusy = True
    v = LoanValue(gRel.Loans(gLastLoan), gLastKey)
    For i = 1 To gRel.LoanCount
        If i <> gLastLoan Then
            If SetInput(gRel.Loans(i), gLastKey, v, note) Then n = n + 1
        End If
    Next i
    SaveAllInputs gRel
    CalcRel gRel
    gStale = 15
    PaintProjection &HFFFF
    PaintVisiblePage
    gBusy = False
    SetStatus CapOf(gLastKey) & " = " & ShowV(v) & " applied to " & n & " other loans"
    Exit Function
Fail:
    gBusy = False: Thaw
End Function

Private Function Armed(what As String) As Boolean
    If mArmed = what And (Timer - mArmedAt) < 5 Then
        Armed = True: mArmed = ""
    Else
        mArmed = what: mArmedAt = Timer
        SetStatus "Click " & what & " again within 5 seconds to confirm."
        Armed = False
    End If
End Function

Public Function BR_ResetLoan() As Variant
    Dim k As Long
    If gBusy Then Exit Function
    k = gLastLoan
    If k < 1 Or k > gRel.LoanCount Then SetStatus "Edit a cell in the loan you want to reset first.": Exit Function
    If Not Armed("Reset loan") Then Exit Function
    On Error GoTo Fail
    gBusy = True
    InitLoanDefaults gRel.Loans(k)
    SaveLoanInput gRel, k, ""
    CalcLoan gRel.Loans(k), gRel: CalcTotals gRel: gRel.RelOptValid = False
    gStale = 15
    PaintProjection &HFFFF
    PaintVisiblePage
    gBusy = False
    SetStatus "Loan " & gRel.Loans(k).LoanNo & " reset to defaults"
    Exit Function
Fail:
    gBusy = False: Thaw
End Function

Public Function BR_ResetAll() As Variant
    Dim i As Long
    If gBusy Then Exit Function
    If Not Armed("Reset all") Then Exit Function
    On Error GoTo Fail
    gBusy = True
    For i = 1 To gRel.LoanCount
        InitLoanDefaults gRel.Loans(i)
    Next i
    SaveAllInputs gRel
    CalcRel gRel
    gStale = 15
    PaintProjection &HFFFF
    PaintVisiblePage
    gBusy = False
    SetStatus "All " & gRel.LoanCount & " loans reset to defaults"
    Exit Function
Fail:
    gBusy = False: Thaw
End Function

' ---------------------------------------------------------------- pages
Private Function PageIndex() As Long
    On Error Resume Next
    PageIndex = -1
    If USE_TABCTL Then
        PageIndex = MainF.Controls("tabMain").Value
    Else
        Dim i As Long, subs As Variant
        subs = Array("sub_Proj", "sub_Optimal", "sub_PayHist", "sub_Coll")
        For i = 0 To 3
            If MainF.Controls(subs(i)).Visible Then PageIndex = i: Exit Function
        Next i
    End If
End Function

Private Sub PaintVisiblePage()
    Select Case PageIndex()
        Case 1: RefreshOptimalPage
        Case 2: If (gStale And 4) <> 0 Then PaintPayHist
        Case 3: RefreshCollPage
    End Select
End Sub

Private Sub RefreshOptimalPage()
    On Error Resume Next
    If gRel.LoanCount = 0 Then Exit Sub
    If Not gRel.RelOptValid Then CalcRelOptimal gRel
    WriteOptCache gRel
    SubF("sub_Optimal").Requery
    BR_OptLoanChanged
    PaintOptimalBlock
    PaintProjection 1
    gStale = gStale And Not 9
End Sub

Private Sub RefreshCollPage()
    Dim errMsg As String
    On Error Resume Next
    If (gStale And 2) = 0 Then Exit Sub
    If gRel.LoanCount = 0 And Len(gRel.RelatedLoans) = 0 Then Exit Sub
    If LoadCollateral(gRel.ProjectName, gRel.RelatedLoans, errMsg) Then
        SubF("sub_Coll").Requery
        gStale = gStale And Not 2
    Else
        SetStatus "Collateral load failed: " & errMsg
    End If
End Sub

Public Function BR_TabChanged() As Variant
    If gBusy Then Exit Function
    On Error GoTo Done
    gBusy = True
    PaintVisiblePage
    gBusy = False
    Exit Function
Done:
    gBusy = False
End Function

Public Function BR_ShowPage(n As Long) As Variant
    Dim i As Long, subs As Variant
    On Error Resume Next
    subs = Array("sub_Proj", "sub_Optimal", "sub_PayHist", "sub_Coll")
    For i = 0 To 3
        MainF.Controls(subs(i)).Visible = (i = n)
    Next i
    BR_TabChanged
End Function

Public Function BR_Page(dir As Long) As Variant
    Dim w As Long
    If gBusy Or gRel.LoanCount <= NCOLS Then Exit Function
    On Error GoTo Done
    w = gWin + dir * NCOLS
    If w > gRel.LoanCount - NCOLS + 1 Then w = gRel.LoanCount - NCOLS + 1
    If w < 1 Then w = 1
    If w = gWin Then Exit Function
    gWin = w
    gBusy = True
    PaintProjection &HFFFF
    gStale = gStale Or 4
    If PageIndex() = 2 Then PaintPayHist
    PaintOptimalBlock
    gBusy = False
    Exit Function
Done:
    gBusy = False: Thaw
End Function

' ---------------------------------------------------------------- optimal / collateral strips
Public Function BR_OptLoanChanged() As Variant
    Dim v As String
    On Error Resume Next
    v = Nz(MainF.Controls("cboOptLoan"), "*")
    With SubF("sub_Optimal")
        .Filter = "LoanNo='" & Q(v) & "'"
        .FilterOn = True
    End With
    PaintOptimalBlock
End Function

Public Function BR_HurdleChanged() As Variant
    Dim v As Variant
    If gBusy Then Exit Function
    On Error GoTo Fail
    gBusy = True
    v = MainF.Controls("txtHYTM"): If IsNumeric(v) Then gRel.HurdleYTM = IIf(v > 1, v / 100, v)
    v = MainF.Controls("txtHCY"): If IsNumeric(v) Then gRel.HurdleCY = IIf(v > 1, v / 100, v)
    v = MainF.Controls("txtHMOIC"): If IsNumeric(v) Then gRel.HurdleMOIC = CDbl(v)
    SaveSettings gRel
    Dim i As Long
    For i = 1 To gRel.LoanCount
        CalcHurdles gRel.Loans(i), gRel
    Next i
    gRel.RelOptValid = False
    RefreshOptimalPage
    PaintProjection &HFFFF
    gBusy = False
    SetStatus "Hurdles: YTM " & Format(gRel.HurdleYTM, "0.0%") & " · 12M CY " & Format(gRel.HurdleCY, "0.0%") & " · MOIC " & Format(gRel.HurdleMOIC, "0.00")
    Exit Function
Fail:
    gBusy = False: Thaw
End Function

Private Sub UseMonth(m As Long)
    Dim v As String, i As Long, note As String, n As Long
    If m < 1 Or m > 60 Then Exit Sub
    v = Nz(MainF.Controls("cboOptLoan"), "*")
    gBusy = True
    If v = "*" Then
        For i = 1 To gRel.LoanCount
            If SetInput(gRel.Loans(i), "ExitMonth", m, note) Then n = n + 1
        Next i
        SaveAllInputs gRel
        CalcRel gRel
    Else
        For i = 1 To gRel.LoanCount
            If gRel.Loans(i).LoanNo = v Then ApplyInput i, "ExitMonth", m, note: Exit For
        Next i
    End If
    gStale = 15
    PaintProjection &HFFFF
    RefreshOptimalPage
    gBusy = False
    SetStatus "Exit Month set to " & m & IIf(v = "*", " for all loans", " for loan " & v)
End Sub

Public Function BR_OptPick() As Variant
    Dim m As Variant
    If gBusy Then Exit Function
    On Error GoTo Done
    m = SubF("sub_Optimal").Controls("txtM").Value
    If IsNumeric(m) Then UseMonth CLng(m)
    Exit Function
Done:
    gBusy = False: Thaw
End Function

Public Function BR_UseMonth() As Variant
    BR_OptPick
End Function

Public Function BR_CollRowChanged() As Variant
    Dim f As Form
    On Error Resume Next
    Set f = SubF("sub_Coll")
    MainF.Controls("txtSqft") = f.Controls("txtSQFT").Value
    MainF.Controls("txtUnits") = f.Controls("txtNumUnits").Value
    MainF.Controls("txtAcres") = f.Controls("txtAcreage").Value
End Function

' ---------------------------------------------------------------- print / export
Public Function BR_Print() As Variant
    On Error GoTo Fail
    If gRel.LoanCount = 0 Then SetStatus "Load a relationship first.": Exit Function
    WriteSnapshot gRel
    DoCmd.OpenReport "rptBR_Projection", acViewPreview
    SetStatus "Print preview opened - use File > Print or Export to PDF from the preview."
    Exit Function
Fail:
    SetStatus "Print failed: " & Err.Description
End Function

Public Function BR_Export() As Variant
    Dim folder As String, path As String
    On Error GoTo Fail
    If gRel.LoanCount = 0 Then SetStatus "Load a relationship first.": Exit Function
    WriteSnapshot gRel
    If Not gRel.RelOptValid Then CalcRelOptimal gRel
    WriteOptCache gRel
    folder = Environ("USERPROFILE") & "\Documents\BidReader"
    If Len(Dir(folder, vbDirectory)) = 0 Then MkDir folder
    path = folder & "\" & SafeName(gRel.RelatedLoans) & "_" & Format(Now, "yyyymmdd-hhnn") & ".xlsx"
    DoCmd.TransferSpreadsheet acExport, acSpreadsheetTypeExcel12Xml, "xtblBR_Snapshot", path, True
    DoCmd.TransferSpreadsheet acExport, acSpreadsheetTypeExcel12Xml, "xtblBR_OptCache", path, True
    DoCmd.TransferSpreadsheet acExport, acSpreadsheetTypeExcel12Xml, "xtblBR_CollCache", path, True
    SetStatus "Exported " & path
    Exit Function
Fail:
    SetStatus "Export failed: " & Err.Description
End Function

Private Function SafeName(s As String) As String
    Dim i As Long, ch As String, o As String
    For i = 1 To Len(s)
        ch = Mid(s, i, 1)
        If ch Like "[A-Za-z0-9_-]" Then o = o & ch Else o = o & "_"
    Next i
    SafeName = o
End Function

' ---------------------------------------------------------------- painters
Public Sub PaintHeader()
    Dim f As Form, cbo As Control
    On Error Resume Next
    Set f = MainF
    f.Controls("txtYield") = gRel.Yield
    f.Controls("txtJ2") = gRel.MinMonthsJ2
    f.Controls("txtCutoff") = gRel.CutoffDt
    f.Controls("txtAnchor") = gRel.AnchorDt
    f.Controls("txtHYTM") = gRel.HurdleYTM
    f.Controls("txtHCY") = gRel.HurdleCY
    f.Controls("txtHMOIC") = gRel.HurdleMOIC
    f.Controls("lblTape").Caption = IIf(gRel.HasTape, "Tape as of " & Format(gRel.TapeAsOf, "mm/dd/yy") & " · ", "") & _
        gRel.LoanCount & " loans · UPB " & Format(gRel.Tot.UPB, "$#,##0") & " · Collateral " & Format(gRel.RelColl, "$#,##0") & _
        IIf(gRel.HasCF, " · CF start " & Format(gRel.CutoffDt, "mm/yyyy"), "")
    Set cbo = f.Controls("cboRelationship")
    f.Controls("lblRelPos").Caption = IIf(cbo.ListIndex >= 0, (cbo.ListIndex + 1) & " of " & cbo.ListCount, "")
End Sub

Private Sub SetCell(c As Control, i As Long, r As Long, v As Variant)
    If c Is Nothing Then Exit Sub
    If Nz(v, "~") <> Nz(gShown(i, r), "~") Or VarType(gShown(i, r)) = vbString And gShown(i, r) = "~init~" Then
        c.Value = v
        gShown(i, r) = v
    End If
End Sub

Public Sub PaintProjection(colMask As Long)
    Dim f As Form, i As Long, r As Long, k As Long, tsel As String, tf As String, v As Variant, c As Control
    Dim ip As Double
    On Error GoTo Done
    EnsureCache
    Set f = SubF("sub_Proj")
    tsel = Nz(MainF.Controls("cboTrailDisp"), "Actual")
    tf = TrailFormat(tsel)
    Freeze
    f.Painting = False
    For i = 1 To NCOLS
        If (colMask And BitOf(i)) <> 0 Then
            k = gWin + i - 1
            If k <= gRel.LoanCount Then
                gHead(i).Value = gRel.Loans(k).LoanNo
                ip = gRel.Loans(k).UPB * gRel.Loans(k).CRate / 12
                For r = 1 To NROWS
                    Set c = gCell(i, r)
                    If Not c Is Nothing Then
                        Select Case mKeys(r)
                            Case "T3": v = TrailDisplay(gRel.Loans(k).T3, 3, tsel, gRel.Loans(k).CPmt, ip): If c.Format <> tf Then c.Format = tf
                            Case "T6": v = TrailDisplay(gRel.Loans(k).T6, 6, tsel, gRel.Loans(k).CPmt, ip): If c.Format <> tf Then c.Format = tf
                            Case "T12": v = TrailDisplay(gRel.Loans(k).T12, 12, tsel, gRel.Loans(k).CPmt, ip): If c.Format <> tf Then c.Format = tf
                            Case "RelColl": v = gRel.RelColl
                            Case Else: v = LoanValue(gRel.Loans(k), mKeys(r))
                        End Select
                        SetCell c, i, r, v
                    End If
                Next r
            Else
                gHead(i).Value = Null
                For r = 1 To NROWS
                    SetCell gCell(i, r), i, r, Null
                Next r
            End If
        End If
    Next i
    If (colMask And 1) <> 0 Then
        gHead(NCOLS + 1).Value = "Relationship"
        ip = gRel.Tot.IntPmt
        For r = 1 To NROWS
            Set c = gCell(NCOLS + 1, r)
            If Not c Is Nothing Then
                Select Case mKeys(r)
                    Case "T3": v = TrailDisplay(gRel.Tot.T3, 3, tsel, gRel.Tot.CPmt, ip): If c.Format <> tf Then c.Format = tf
                    Case "T6": v = TrailDisplay(gRel.Tot.T6, 6, tsel, gRel.Tot.CPmt, ip): If c.Format <> tf Then c.Format = tf
                    Case "T12": v = TrailDisplay(gRel.Tot.T12, 12, tsel, gRel.Tot.CPmt, ip): If c.Format <> tf Then c.Format = tf
                    Case "MinHAll": If gRel.RelOptValid And gRel.Tot.MinHAll > 0 Then v = gRel.Tot.MinHAll Else v = Null
                    Case Else: v = TotValue(gRel, mKeys(r))
                End Select
                SetCell c, NCOLS + 1, r, v
            End If
        Next r
    End If
    ' pager
    On Error Resume Next
    f.Controls("btnPgPrev").Visible = (gRel.LoanCount > NCOLS)
    f.Controls("btnPgNext").Visible = (gRel.LoanCount > NCOLS)
    If gRel.LoanCount > NCOLS Then
        f.Controls("lblPg").Caption = "Loans " & gWin & "–" & MinL(gWin + NCOLS - 1, gRel.LoanCount) & " of " & gRel.LoanCount
    Else
        f.Controls("lblPg").Caption = ""
    End If
Done:
    On Error Resume Next
    f.Painting = True
    Thaw
End Sub

Public Sub PaintPayHist()
    Dim f As Form, i As Long, k As Long, s As Long, a As Long, idx As Long, v As Variant, tot As Double, tsel As String
    Dim stats As Variant, ip As Double, pd As Long, c As Control, kk As Long
    On Error GoTo Done
    Set f = SubF("sub_PayHist")
    tsel = Nz(MainF.Controls("cboTrailDisp"), "Actual")
    stats = Array("Orig", "Pmt", "IntPmt", "T3", "T6", "T12", "T24")
    a = PdDiff(gPayPd0, PdKey(gRel.AnchorDt))
    Freeze
    f.Painting = False
    For i = 1 To NCOLS
        k = gWin + i - 1
        If k <= gRel.LoanCount Then
            With gRel.Loans(k)
                f.Controls("h" & i & "_LoanNo") = .LoanNo
                ip = .UPB * .CRate / 12
                If .HasOrg Then f.Controls("p" & i & "_Orig") = .OrgDt Else f.Controls("p" & i & "_Orig") = Null
                f.Controls("p" & i & "_Pmt") = .CPmt
                f.Controls("p" & i & "_IntPmt") = ip
                For s = 3 To 6
                    Set c = f.Controls("p" & i & "_" & stats(s))
                    If c.Format <> TrailFormat(tsel) Then c.Format = TrailFormat(tsel)
                    Select Case s
                        Case 3: c.Value = TrailDisplay(.T3, 3, tsel, .CPmt, ip)
                        Case 4: c.Value = TrailDisplay(.T6, 6, tsel, .CPmt, ip)
                        Case 5: c.Value = TrailDisplay(.T12, 12, tsel, .CPmt, ip)
                        Case 6: c.Value = TrailDisplay(.T24, 24, tsel, .CPmt, ip)
                    End Select
                Next s
            End With
        Else
            f.Controls("h" & i & "_LoanNo") = Null
            For s = 0 To 6
                f.Controls("p" & i & "_" & stats(s)) = Null
            Next s
        End If
    Next i
    f.Controls("hT_LoanNo") = "Relationship"
    f.Controls("pT_Orig") = Null
    f.Controls("pT_Pmt") = gRel.Tot.CPmt
    f.Controls("pT_IntPmt") = gRel.Tot.IntPmt
    For s = 3 To 6
        Set c = f.Controls("pT_" & stats(s))
        If c.Format <> TrailFormat(tsel) Then c.Format = TrailFormat(tsel)
        Select Case s
            Case 3: c.Value = TrailDisplay(gRel.Tot.T3, 3, tsel, gRel.Tot.CPmt, gRel.Tot.IntPmt)
            Case 4: c.Value = TrailDisplay(gRel.Tot.T6, 6, tsel, gRel.Tot.CPmt, gRel.Tot.IntPmt)
            Case 5: c.Value = TrailDisplay(gRel.Tot.T12, 12, tsel, gRel.Tot.CPmt, gRel.Tot.IntPmt)
            Case 6: c.Value = TrailDisplay(gRel.Tot.T24, 24, tsel, gRel.Tot.CPmt, gRel.Tot.IntPmt)
        End Select
    Next s
    For kk = 0 To 35
        pd = PdAdd(PdKey(gRel.AnchorDt), -kk)
        f.Controls("m" & kk & "_Lbl") = Format(DateSerial(pd \ 100, pd Mod 100, 1), "mmm-yy")
        idx = a + kk
        tot = 0
        For i = 1 To NCOLS
            k = gWin + i - 1
            Set c = f.Controls("m" & kk & "_" & i)
            If k <= gRel.LoanCount And idx >= 0 And idx <= gPayMax Then
                v = gPay(k, idx)
                c.Value = v
                If v = 0 And gRel.Loans(k).CPmt > 0 Then
                    c.BackColor = CLR_MISSED
                ElseIf v < 0.9 * gRel.Loans(k).CPmt And gRel.Loans(k).CPmt > 0 Then
                    c.BackColor = CLR_SHORT
                Else
                    c.BackColor = 16777215
                End If
            Else
                c.Value = Null: c.BackColor = 16777215
            End If
        Next i
        If idx >= 0 And idx <= gPayMax Then
            For k = 1 To gRel.LoanCount
                tot = tot + gPay(k, idx)
            Next k
            f.Controls("m" & kk & "_T") = tot
        Else
            f.Controls("m" & kk & "_T") = Null
        End If
    Next kk
    gStale = gStale And Not 4
Done:
    On Error Resume Next
    f.Painting = True
    Thaw
End Sub

Public Sub PaintOptimalBlock()
    Dim f As Form, j As Long, hs As Variant, v As Variant
    On Error Resume Next
    Set f = MainF
    hs = Array("YTM", "CY", "MOIC", "All")
    For j = 0 To 3
        If gRel.RelOptValid And gRel.RelMinH(j + 1) > 0 Then v = gRel.RelMinH(j + 1) Else v = Null
        f.Controls("sT_" & hs(j)) = v
    Next j
End Sub
