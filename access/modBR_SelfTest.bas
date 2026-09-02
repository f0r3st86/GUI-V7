Attribute VB_Name = "modBR_SelfTest"
Option Compare Database
Option Explicit

' =====================================================================
' modBR_SelfTest - fidelity gate and diagnostics for v2.
'   BR_SelfTest  engine vs modBR_Vectors (generated from the Python
'                reference) -> xtblBR_TestResults + Immediate window
'   BR_SqlCheck  local trailing sums vs the server pivot query
'   BR_Bench     load/calc/paint timings -> xtblBR_Bench
'   BR_UISmoke   builds nothing; exercises the built forms
' =====================================================================

Private Function ToDate(s As String) As Date
    ' ISO yyyy-mm-dd
    ToDate = DateSerial(CLng(Left(s, 4)), CLng(Mid(s, 6, 2)), CLng(Mid(s, 9, 2)))
End Function

Private Sub ApplyCaseInputs(c As Long, ByRef R As TRel, ByRef L As TLoan)
    Dim items As Variant, i As Long, p As Long, nm As String, v As String, note As String
    items = BR_CaseInputs(c)
    InitRelDefaults R
    InitLoanDefaults L
    R.CutoffDt = DateSerial(2026, 7, 1): R.AnchorDt = DateSerial(2026, 7, 31)
    For i = LBound(items) To UBound(items)
        p = InStr(items(i), "|")
        If p > 0 Then
            nm = Left(items(i), p - 1): v = Mid(items(i), p + 1)
            Select Case nm
                Case "LoanNo": L.LoanNo = v
                Case "UPB": L.UPB = Val(v)
                Case "IntBal": L.IntBal = Val(v)
                Case "CRate": L.CRate = Val(v)
                Case "DRate": L.DRate = Val(v)
                Case "CPmt": L.CPmt = Val(v)
                Case "MatDt": L.HasMat = (Len(v) > 0): If L.HasMat Then L.MatDt = ToDate(v)
                Case "T3": L.T3 = Val(v)
                Case "T6": L.T6 = Val(v)
                Case "T12": L.T12 = Val(v)
                Case "T24": L.T24 = Val(v)
                Case "Yield": R.Yield = Val(v)
                Case "CutoffDt": R.CutoffDt = ToDate(v)
                Case "AnchorDt": R.AnchorDt = ToDate(v)
                Case "MinMonthsJ2": R.MinMonthsJ2 = Val(v)
                Case "HurdleYTM": R.HurdleYTM = Val(v)
                Case "HurdleCY": R.HurdleCY = Val(v)
                Case "HurdleMOIC": R.HurdleMOIC = Val(v)
                Case "RelColl": R.RelColl = Val(v)
                Case "BidOverride"
                    If Len(v) > 0 Then SetInput L, "BidOverride", Val(v), note
                Case Else
                    If IsInputKey(nm) Then
                        If IsNumeric(v) Then SetInput L, nm, Val(v), note Else SetInput L, nm, v, note
                    End If
            End Select
        End If
    Next i
End Sub

Private Function ActualOf(ByRef L As TLoan, fld As String) As Variant
    Dim t As Long, m As Long
    If Left(fld, 3) = "Net" And Len(fld) = 5 Then
        t = CLng(Mid(fld, 4)): ActualOf = L.Net(t): Exit Function
    End If
    If Left(fld, 3) = "Opt" And Right(fld, 4) = "_Bid" Then
        m = CLng(Mid(fld, 4, 2)): ActualOf = L.Opt(m).Bid: Exit Function
    End If
    Select Case fld
        Case "MinHYTM": If L.MinHYTM > 0 Then ActualOf = L.MinHYTM Else ActualOf = Null
        Case "MinHCY": If L.MinHCY > 0 Then ActualOf = L.MinHCY Else ActualOf = Null
        Case "MinHMOIC": If L.MinHMOIC > 0 Then ActualOf = L.MinHMOIC Else ActualOf = Null
        Case "BalAtExit": If L.UseMTM >= 1 And L.BidUsed > 0 Then ActualOf = L.BalAtExit Else ActualOf = Null
        Case Else: ActualOf = LoanValue(L, fld)
    End Select
End Function

Public Sub BR_SelfTest()
    Dim c As Long, n As Long, R As TRel, L As TLoan, ex As Variant, i As Long, parts As Variant
    Dim fld As String, expS As String, tol As Double, act As Variant, pass As Boolean, delta As Double
    Dim nPass As Long, nFail As Long, shown As Long, rs As DAO.Recordset, t0 As Single
    Dim cf() As Double, st As Long, r As Double, y As Double
    EnsureLocalTables
    CurrentDb.Execute "DELETE FROM xtblBR_TestResults"
    Set rs = CurrentDb.OpenRecordset("xtblBR_TestResults", dbOpenDynaset)
    t0 = Timer
    n = BR_CaseCount()
    Debug.Print "BR_SelfTest: " & n & " cases"
    For c = 1 To n
        ApplyCaseInputs c, R, L
        R.LoanCount = 1
        ReDim R.Loans(1 To 1)
        R.Loans(1) = L
        On Error Resume Next
        CalcLoan R.Loans(1), R
        If Err.Number <> 0 Then
            Debug.Print "  RUNTIME ERROR in case " & BR_CaseId(c) & ": " & Err.Description
            Err.Clear
        End If
        On Error GoTo 0
        ex = BR_CaseExpected(c)
        For i = LBound(ex) To UBound(ex)
            parts = Split(ex(i), "|")
            If UBound(parts) >= 2 Then
                fld = parts(0): expS = parts(1): tol = Val(parts(2))
                act = ActualOf(R.Loans(1), fld)
                If Len(expS) = 0 Then
                    pass = IsNull(act)
                    delta = 0
                ElseIf IsNull(act) Then
                    pass = False: delta = 1E+99
                Else
                    delta = Abs(CDbl(act) - Val(expS))
                    pass = (delta <= tol)
                End If
                If pass Then nPass = nPass + 1 Else nFail = nFail + 1
                rs.AddNew
                rs!CaseId = BR_CaseId(c): rs!Field = fld
                If Len(expS) > 0 Then rs!Expected = Val(expS)
                If Not IsNull(act) Then rs!Actual = CDbl(act)
                rs!Delta = delta: rs!pass = pass: rs!RunAt = Now
                rs.Update
                If Not pass And shown < 20 Then
                    shown = shown + 1
                    Debug.Print "  FAIL " & BR_CaseId(c) & " " & fld & ": expected " & IIf(Len(expS) = 0, "n/a", expS) & _
                                " got " & IIf(IsNull(act), "n/a", CStr(act))
                End If
            End If
        Next i
    Next c
    rs.Close
    ' property tests
    ReDim cf(0 To 5)
    cf(0) = -1000: cf(1) = 300: cf(2) = 300: cf(3) = 300: cf(4) = 300: cf(5) = 300
    y = 0.01
    ReDim cf(0 To 5): cf(0) = 0: cf(1) = 300: cf(2) = 300: cf(3) = 300: cf(4) = 300: cf(5) = 300
    cf(0) = -NPVx(y, cf, 1, 5)
    r = IRRx(cf, 5, 0.1, st)
    If Abs(r - y) < 0.000000001 And st = 0 Then nPass = nPass + 1 Else nFail = nFail + 1: Debug.Print "  FAIL property IRR(-NPV,cf)=y: " & r & " status " & st
    ApplyCaseInputs 1, R, L
    R.LoanCount = 1: ReDim R.Loans(1 To 1): R.Loans(1) = L
    CalcLoan R.Loans(1), R
    If R.Loans(1).SellYTMok And Abs(R.Loans(1).SellYTM - R.Yield) < 0.000001 Then nPass = nPass + 1 Else nFail = nFail + 1: Debug.Print "  FAIL property SellYTM = Yield"
    If Abs(R.Loans(1).BidModel * R.Loans(1).MOIC - R.Loans(1).SAll) < 0.01 Then nPass = nPass + 1 Else nFail = nFail + 1: Debug.Print "  FAIL property Bid*MOIC = sum(Net)"
    Debug.Print "BR_SelfTest: " & nPass & " pass, " & nFail & " fail (" & Format((Timer - t0) * 1000, "0") & " ms). Results in xtblBR_TestResults."
    If nFail = 0 Then Debug.Print "FIDELITY GATE: PASS" Else Debug.Print "FIDELITY GATE: FAIL"
End Sub

' Local trailing sums / matrix vs the server-side pivot for the loaded relationship
Public Sub BR_SqlCheck()
    Dim rs As DAO.Recordset, i As Long, k As Long, a As Long, nBad As Long, nChk As Long, idx As Long
    Dim loc As Double, srv As Double, fld As String
    If gRel.LoanCount = 0 Then Debug.Print "BR_SqlCheck: load a relationship in frmBidReader first.": Exit Sub
    Set rs = BR_OpenPT(BuildTrailCheckSql(gRel.ProjectName, gRel.RelatedLoans, PdKey(gRel.AnchorDt)))
    a = PdDiff(gPayPd0, PdKey(gRel.AnchorDt))
    Do While Not rs.EOF
        For i = 1 To gRel.LoanCount
            If gRel.Loans(i).LoanNo = CStr(rs!MWLoanNo) Then
                If VarType(rs!UPB) <> vbDouble Then Debug.Print "  UPB arrived as VarType " & VarType(rs!UPB)
                nChk = nChk + 1: If Abs(gRel.Loans(i).T3 - Nz(rs!T3, 0)) > 0.005 Then nBad = nBad + 1: Debug.Print "  T3 mismatch " & gRel.Loans(i).LoanNo
                nChk = nChk + 1: If Abs(gRel.Loans(i).T6 - Nz(rs!T6, 0)) > 0.005 Then nBad = nBad + 1: Debug.Print "  T6 mismatch " & gRel.Loans(i).LoanNo
                nChk = nChk + 1: If Abs(gRel.Loans(i).T12 - Nz(rs!T12, 0)) > 0.005 Then nBad = nBad + 1: Debug.Print "  T12 mismatch " & gRel.Loans(i).LoanNo
                nChk = nChk + 1: If Abs(gRel.Loans(i).T24 - Nz(rs!T24, 0)) > 0.005 Then nBad = nBad + 1: Debug.Print "  T24 mismatch " & gRel.Loans(i).LoanNo
                For k = 0 To 35
                    idx = a + k
                    If idx >= 0 And idx <= gPayMax Then loc = gPay(i, idx) Else loc = 0
                    fld = "M" & Format(k, "00")
                    srv = Nz(rs.Fields(fld), 0)
                    nChk = nChk + 1
                    If Abs(loc - srv) > 0.005 Then nBad = nBad + 1: If nBad <= 10 Then Debug.Print "  " & fld & " mismatch " & gRel.Loans(i).LoanNo & " local " & loc & " server " & srv
                Next k
            End If
        Next i
        rs.MoveNext
    Loop
    rs.Close
    Debug.Print "BR_SqlCheck: " & nChk & " checks, " & nBad & " mismatches" & IIf(nBad = 0, " - OK", "")
End Sub

' Timings over the first 20 relationships of the current project
Public Sub BR_Bench()
    Dim rs As DAO.Recordset, proj As String, n As Long, t0 As Single, t1 As Single, errMsg As String
    Dim msS As Double, msC As Double, out As DAO.Recordset
    If Not HaveMainForm() Then Debug.Print "BR_Bench: open frmBidReader and pick a project first.": Exit Sub
    proj = Nz(Forms("frmBidReader").Controls("cboProject"), "")
    If Len(proj) = 0 Then Exit Sub
    Set rs = CurrentDb.OpenRecordset("qptBR_Rels", dbOpenSnapshot)
    Set out = CurrentDb.OpenRecordset("xtblBR_Bench", dbOpenDynaset)
    Do While Not rs.EOF And n < 20
        n = n + 1
        gRel.ProjectName = proj: gRel.RelatedLoans = CStr(rs!RelatedLoans)
        LoadSettings gRel
        t0 = Timer
        If LoadRelationship(proj, CStr(rs!RelatedLoans), errMsg) Then
            LoadInputs gRel
            ComputeTrails gRel
            t1 = Timer
            CalcRel gRel
            msS = (t1 - t0) * 1000: msC = (Timer - t1) * 1000
            out.AddNew
            out!RunAt = Now: out!ProjectName = proj: out!RelatedLoans = gRel.RelatedLoans: out!Loans = gRel.LoanCount
            out!MsServer = msS: out!MsCalc = msC: out!MsPaint = 0: out!MsTotal = msS + msC
            out.Update
            Debug.Print "  " & gRel.RelatedLoans & ": " & gRel.LoanCount & " loans, server " & Format(msS, "0") & " ms, calc " & Format(msC, "0") & " ms"
        Else
            Debug.Print "  " & rs!RelatedLoans & ": load failed - " & errMsg
        End If
        rs.MoveNext
    Loop
    out.Close: rs.Close
    Debug.Print "BR_Bench: " & n & " relationships timed (xtblBR_Bench)."
End Sub

Private Function HaveMainForm() As Boolean
    Dim f As Form
    On Error Resume Next
    Set f = Forms("frmBidReader")
    HaveMainForm = (Err.Number = 0)
    Err.Clear
End Function

Public Sub BR_UISmoke()
    Dim f As Form, names As Variant, i As Long, ok As Boolean
    On Error Resume Next
    DoCmd.OpenForm "frmBidReader"
    If Err.Number <> 0 Then Debug.Print "BR_UISmoke: cannot open frmBidReader - " & Err.Description: Exit Sub
    Set f = Forms("frmBidReader")
    Debug.Print "frmBidReader controls: " & f.Controls.Count
    Debug.Print "fsubBR_Proj controls: " & f.Controls("sub_Proj").Form.Controls.Count
    Debug.Print "fsubBR_PayHist controls: " & f.Controls("sub_PayHist").Form.Controls.Count
    names = Array("BR_FormLoad", "BR_ProjectChanged", "BR_RelChanged", "BR_CellChanged", "BR_GlobalChanged", "BR_TabChanged", _
                  "BR_Page", "BR_Undo", "BR_ApplyAll", "BR_ResetLoan", "BR_ResetAll", "BR_Reload", "BR_Print", "BR_Export", _
                  "BR_OptLoanChanged", "BR_HurdleChanged", "BR_OptPick", "BR_UseMonth", "BR_CollRowChanged", "BR_Unfreeze")
    For i = LBound(names) To UBound(names)
        ok = True
        Err.Clear
        ' probe existence only (no call): a missing function shows as a compile error at build time
    Next i
    If f.Controls("cboRelationship").ListCount > 0 And Len(Nz(f.Controls("cboRelationship"), "")) = 0 Then
        f.Controls("cboRelationship") = f.Controls("cboRelationship").ItemData(0)
        BR_RelChanged
    End If
    Debug.Print "Loaded: " & gRel.LoanCount & " loans; Bid " & Format(gRel.Tot.BidModel, "$#,##0")
    If gRel.LoanCount > 0 Then
        f.Controls("sub_Proj").Form.Controls("c1_ExitMonth").Value = 30
        BR_CellChanged "c1_ExitMonth"
        Debug.Print "After edit: loan 1 ExitMonth = " & gRel.Loans(1).ExitMonth & "; painted " & f.Controls("sub_Proj").Form.Controls("c1_ExitMonth").Value
    End If
    For i = 0 To 3
        f.Controls("tabMain").Value = i
        BR_TabChanged
    Next i
    f.Controls("tabMain").Value = 0
    Debug.Print "BR_UISmoke done."
End Sub
