Attribute VB_Name = "modBR_Engine"
Option Compare Database
Option Explicit

' =====================================================================
' modBR_Engine - the Relationship Projection model (workbook formulas).
' Pure: no DAO, no Forms, never raises. Numeric oracle:
' scripts/bid_engine_ref.py. Contract: docs/BIDREADER-V2-CONTRACT.md.
' =====================================================================

Public Const YTM_USE_PULLS As Boolean = False
Public Const OPT_YTM_MODE As Long = 0
Public Const IRR_GUESS As Double = 0.1
Public Const NCOLS As Long = 10
Public Const NROWS As Long = 58

Public Type TOptRow
    Bid As Double
    BidPct As Double
    ImpDPO As Double
    CY12 As Double
    MOIC As Double
    YTM As Double
    YTMok As Boolean
End Type

Public Type TLoan
    LoanNo As String
    Seq As Long
    UPB As Double
    IntBal As Double
    CRate As Double
    DRate As Double
    CPmt As Double
    HasMat As Boolean
    MatDt As Date
    HasOrg As Boolean
    OrgDt As Date
    T3 As Double
    T6 As Double
    T12 As Double
    T24 As Double
    PmtSel As String
    UserPmt As Double
    TermMonths As Long
    MTrailSel As String
    TrailPct As Double
    RateSel As String
    UserRate As Double
    LegalInit As Double
    LegalStartM As Long
    HoldCost As Double
    LegalEndM As Long
    AddBack As String
    ExitType As String
    DPOPct As Double
    UserExit As Double
    ValCapPct As Double
    YTMTgt As Double
    AddAccrued As Boolean
    LiqAcrM As Long
    StartMonth As Long
    ExitMonth As Long
    HasOverride As Boolean
    BidOverride As Double
    MAI As Double
    MAIok As Boolean
    IntPmt As Double
    TermPmt As Double
    PctTrailPmt As Double
    MTM As Long
    MTA As Long
    MTAok As Boolean
    MRate As Double
    PmtPull As Double
    FvAtExit As Double
    ExpAdj As Double
    ExitPull As Double
    Net(1 To 60) As Double
    S12 As Double
    SAll As Double
    BidModel As Double
    BidUsed As Double
    BidPct As Double
    CY12 As Double
    MOIC As Double
    ImpDPO As Double
    BidMwVx As Double
    F12P12 As Double
    RatioOk(1 To 6) As Boolean
    MTMy As Double
    MFTA As Double
    MFTAok As Boolean
    UseMTM As Long
    BalAtExit As Double
    YtmIRR As Double
    YtmIRRok As Boolean
    YtmXIRR As Double
    YtmXIRRok As Boolean
    SellYTM As Double
    SellYTMok As Boolean
    Opt(1 To 60) As TOptRow
    MinHYTM As Long
    MinHCY As Long
    MinHMOIC As Long
    MinHAll As Long
End Type

Public Type TRel
    ProjectName As String
    RelatedLoans As String
    LoanCount As Long
    Loans() As TLoan
    Yield As Double
    AnchorDt As Date
    CutoffDt As Date
    HasCF As Boolean
    CFStartPd As Long
    MinMonthsJ2 As Long
    HurdleYTM As Double
    HurdleCY As Double
    HurdleMOIC As Double
    RelColl As Double
    RelSellerAppr As Double
    PropCount As Long
    TapeAsOf As Date
    HasTape As Boolean
    Tot As TLoan
    RelOpt(1 To 60) As TOptRow
    RelOptValid As Boolean
    RelMinH(1 To 4) As Long
    MsServer As Double
    MsCalc As Double
    MsPaint As Double
End Type

Public Type TUndo
    Valid As Boolean
    LoanIdx As Long
    Key As String
    OldVal As Variant
    NewVal As Variant
End Type

Public gRel As TRel
Public gPay() As Double
Public gPayMax As Long
Public gPayPd0 As Long

' ---------------------------------------------------------------- defaults
Public Sub InitLoanDefaults(ByRef L As TLoan)
    L.PmtSel = "Current PMT": L.UserPmt = 0: L.TermMonths = 0: L.MTrailSel = "3M": L.TrailPct = 1
    L.RateSel = "Contractual": L.UserRate = 0
    L.LegalInit = 0: L.LegalStartM = 0: L.HoldCost = 0: L.LegalEndM = 0: L.AddBack = "No"
    L.ExitType = "PIF": L.DPOPct = 0: L.UserExit = 0: L.ValCapPct = 0: L.YTMTgt = 0
    L.AddAccrued = False: L.LiqAcrM = 0: L.StartMonth = 1: L.ExitMonth = 12
    L.HasOverride = False: L.BidOverride = 0
End Sub

Public Sub InitRelDefaults(ByRef R As TRel)
    R.Yield = 0.15: R.MinMonthsJ2 = 0
    R.HurdleYTM = 0.1: R.HurdleCY = 0.09: R.HurdleMOIC = 1.3
    R.AnchorDt = Date: R.CutoffDt = DateSerial(Year(Date), Month(Date), 1)
End Sub

' ---------------------------------------------------------------- pulls
Public Function PickRate(sel As String, cr As Double, drt As Double, ur As Double) As Double
    Select Case sel
        Case "User Enter": PickRate = ur
        Case "Default": PickRate = drt
        Case Else: PickRate = cr
    End Select
End Function

Public Function PickPmt(ByRef L As TLoan, mr As Double) As Double
    Dim base As Double
    Select Case L.PmtSel
        Case "User PMT": PickPmt = L.UserPmt
        Case "Interest PMT": PickPmt = L.UPB * mr
        Case "Term PMT"
            If L.TermMonths > 0 Then
                If mr <> 0 Then PickPmt = PMTx(mr, CDbl(L.TermMonths), -L.UPB) Else PickPmt = L.UPB / L.TermMonths
            Else
                PickPmt = 0
            End If
        Case "% of M Trail PMT"
            Select Case L.MTrailSel
                Case "3M": base = L.T3 / 3
                Case "6M": base = L.T6 / 6
                Case Else: base = L.T12 / 12
            End Select
            PickPmt = L.TrailPct * base
        Case Else: PickPmt = L.CPmt
    End Select
End Function

' ---------------------------------------------------------------- exit pull (sheet C42 LET)
Public Function CalcExitPull(ByRef L As TLoan, ByRef R As TRel, exitM As Long, _
                             ByRef fvAtExit As Double, ByRef expAdj As Double) As Double
    Dim pm As Double, mr As Double, y As Double, st As Long, accrued As Double, bid As Double
    Dim k As Long, ok As Boolean, nper As Double, mtmY As Double, ytmM As Long, ytmBal As Double
    Dim tbid As Double, pvPmts As Double, pvLeg As Double, pvHold As Double, hn As Long, lm As Long
    pm = L.PmtPull: mr = L.MRate: y = R.Yield / 12: st = L.StartMonth
    accrued = IIf(L.AddAccrued, L.IntBal, 0)
    Select Case L.AddBack
        Case "Yes, Initial Only": expAdj = L.LegalInit
        Case "Yes, Both": expAdj = L.LegalInit + (MinL(exitM, L.LegalEndM) - L.LegalStartM) * L.HoldCost
        Case Else: expAdj = 0
    End Select
    fvAtExit = FVx(mr, CDbl(exitM - st + 1), pm, -L.UPB) + pm
    Select Case L.ExitType
        Case "User Enter"
            bid = L.UserExit
        Case "DPO"
            bid = fvAtExit * (1 - L.DPOPct)
        Case "YTM Sell Solve"
            k = MinL(L.MTM, L.MTA)
            If k > exitM Then
                bid = -PVx(L.YTMTgt / 12, CDbl(k - exitM), pm, FVx(mr, CDbl(k), pm, -L.UPB))
            Else
                bid = fvAtExit + accrued
            End If
        Case "Value Cap"
            bid = R.RelColl * L.ValCapPct
        Case "Liquidation"
            lm = IIf(L.LiqAcrM >= 1, L.LiqAcrM, exitM)
            bid = FVx(mr, CDbl(lm), 0, -L.UPB) + accrued
        Case "IRR Solve"
            nper = NPERx(mr, -pm, L.UPB, ok)
            If Not ok Then nper = 1E+9
            If L.HasMat Then mtmY = Days360US(R.CutoffDt, L.MatDt) / 30 Else mtmY = 0
            If mtmY < 1 Then mtmY = 1
            ytmM = MinL(Int(IIf(nper < mtmY, nper, mtmY)), 360)
            If ytmM < 1 Then ytmM = 1
            ytmBal = -FVx(mr, CDbl(ytmM), -pm, L.UPB)
            tbid = PVx(L.YTMTgt / 12, CDbl(ytmM), -pm, -ytmBal)
            pvPmts = PVx(y, CDbl(exitM - st), -pm) / PowY(1 + y, st - 1)
            If L.LegalStartM > 0 Then pvLeg = L.LegalInit / PowY(1 + y, L.LegalStartM) Else pvLeg = L.LegalInit
            hn = MinL(L.LegalEndM, exitM - 1) - L.LegalStartM
            If hn > 0 Then pvHold = PVx(y, CDbl(hn), -L.HoldCost) / PowY(1 + y, L.LegalStartM) Else pvHold = 0
            bid = (tbid - pvPmts + pvLeg + pvHold) * PowY(1 + y, exitM) - expAdj
        Case Else   ' PIF
            bid = fvAtExit + accrued
    End Select
    CalcExitPull = bid + expAdj
End Function

' ---------------------------------------------------------------- monthly stream (rows 126/188/64)
Public Sub BuildStream(ByRef L As TLoan, ByRef R As TRel, exitM As Long, exitPull As Double, ByRef net() As Double)
    Dim t As Long, inc As Double, ex As Double, hEnd As Long
    hEnd = MinL(L.LegalEndM, exitM)
    For t = 1 To 60
        inc = 0: ex = 0
        If t >= L.StartMonth And t < exitM Then inc = L.PmtPull
        If t = exitM Then inc = exitPull
        If L.LegalStartM > 0 And t = L.LegalStartM Then ex = ex + L.LegalInit
        If t > L.LegalStartM And t <= hEnd Then ex = ex + L.HoldCost
        net(t) = inc - ex
    Next t
End Sub

' ---------------------------------------------------------------- per-loan calc
Public Sub CalcLoan(ByRef L As TLoan, ByRef R As TRel)
    Dim ok As Boolean, n As Double, y As Double, t As Long, rateSrc As Double, pmtSrc As Double
    Dim cf() As Double, st As Long
    y = R.Yield / 12
    ' 1 interest payment / MAI
    L.IntPmt = L.UPB * L.CRate / 12
    L.MAIok = (L.IntPmt <> 0)
    If L.MAIok Then L.MAI = L.IntBal / L.IntPmt Else L.MAI = 0
    ' 4 rate / payment pulls (needed before MTA)
    L.MRate = PickRate(L.RateSel, L.CRate, L.DRate, L.UserRate) / 12
    If L.TermMonths >= 1 Then L.TermPmt = PMTx(L.MRate, CDbl(L.TermMonths), -L.UPB) Else L.TermPmt = 0
    Select Case L.MTrailSel
        Case "3M": L.PctTrailPmt = L.TrailPct * L.T3 / 3
        Case "6M": L.PctTrailPmt = L.TrailPct * L.T6 / 6
        Case Else: L.PctTrailPmt = L.TrailPct * L.T12 / 12
    End Select
    L.PmtPull = PickPmt(L, L.MRate)
    ' 3 MTM / MTA
    If L.HasMat Then L.MTM = DateDifM(R.CutoffDt, L.MatDt) Else L.MTM = 0
    If YTM_USE_PULLS Then
        rateSrc = L.MRate: pmtSrc = L.PmtPull
    Else
        rateSrc = L.CRate / 12: pmtSrc = L.CPmt
    End If
    n = NPERx(rateSrc, pmtSrc, -L.UPB, ok)
    L.MTAok = ok
    If ok Then
        If n > 360 Then L.MTA = 360 Else L.MTA = Int(n)
        If L.MTA < 0 Then L.MTA = 0
    Else
        L.MTA = 360
    End If
    ' 5-6 exit + stream
    L.ExitPull = CalcExitPull(L, R, L.ExitMonth, L.FvAtExit, L.ExpAdj)
    BuildStream L, R, L.ExitMonth, L.ExitPull, L.Net
    ' 7 bid + ratios
    L.BidModel = NPVx(y, L.Net, 1, 60)
    If L.HasOverride Then L.BidUsed = L.BidOverride Else L.BidUsed = L.BidModel
    L.S12 = 0: L.SAll = 0
    For t = 1 To 60
        L.SAll = L.SAll + L.Net(t)
        If t <= 12 Then L.S12 = L.S12 + L.Net(t)
    Next t
    L.RatioOk(1) = (L.UPB <> 0): If L.RatioOk(1) Then L.BidPct = L.BidUsed / L.UPB Else L.BidPct = 0
    L.RatioOk(2) = (L.BidUsed <> 0): If L.RatioOk(2) Then L.CY12 = L.S12 / L.BidUsed Else L.CY12 = 0
    L.RatioOk(3) = (L.BidUsed <> 0): If L.RatioOk(3) Then L.MOIC = L.SAll / L.BidUsed Else L.MOIC = 0
    L.RatioOk(4) = (L.FvAtExit <> 0): If L.RatioOk(4) Then L.ImpDPO = 1 - L.ExitPull / L.FvAtExit Else L.ImpDPO = 0
    L.RatioOk(5) = (R.RelColl <> 0): If L.RatioOk(5) Then L.BidMwVx = L.BidUsed / R.RelColl Else L.BidMwVx = 0
    L.RatioOk(6) = (L.T12 <> 0): If L.RatioOk(6) Then L.F12P12 = L.S12 / L.T12 Else L.F12P12 = 0
    ' 8 YTM (contractual hold)
    CalcYTM L, R
    ' 9 Sell YTM
    L.SellYTMok = False
    If L.BidUsed > 0 And L.ExitMonth >= 1 Then
        ReDim cf(0 To L.ExitMonth)
        cf(0) = -L.BidUsed
        For t = 1 To L.ExitMonth
            cf(t) = L.Net(t)
        Next t
        L.SellYTM = 12 * IRRx(cf, L.ExitMonth, IRR_GUESS, st)
        L.SellYTMok = (st = 0)
    End If
    ' 10 optimal + hurdles
    CalcOptimal L, R
    CalcHurdles L, R
End Sub

Public Sub CalcYTM(ByRef L As TLoan, ByRef R As TRel)
    Dim rateSrc As Double, pmtSrc As Double, baseline As Double, ok As Boolean
    Dim cf() As Double, e() As Double, t As Long, st As Long, d0 As Long
    If YTM_USE_PULLS Then
        rateSrc = L.MRate: pmtSrc = L.PmtPull
    Else
        rateSrc = L.CRate / 12: pmtSrc = L.CPmt
    End If
    If L.HasMat Then L.MTMy = Days360US(R.CutoffDt, L.MatDt) / 30 Else L.MTMy = 0
    If L.MTMy < 0 Then L.MTMy = 0
    L.MFTA = NPERx(rateSrc, -pmtSrc, L.UPB, L.MFTAok)
    baseline = L.MTMy
    If R.MinMonthsJ2 > baseline Then baseline = R.MinMonthsJ2
    If L.MFTAok And L.MFTA < baseline Then L.UseMTM = Int(L.MFTA) Else L.UseMTM = Int(baseline)
    If L.UseMTM > 360 Then L.UseMTM = 360
    L.YtmIRRok = False: L.YtmXIRRok = False
    If L.UseMTM < 1 Or L.BidUsed <= 0 Then Exit Sub
    L.BalAtExit = -FVx(rateSrc, CDbl(L.UseMTM), -pmtSrc, L.UPB)
    ReDim cf(0 To L.UseMTM): ReDim e(0 To L.UseMTM)
    cf(0) = -L.BidUsed
    d0 = CLng(R.CutoffDt)
    For t = 1 To L.UseMTM
        cf(t) = pmtSrc
        e(t) = (CLng(EDateX(R.CutoffDt, t)) - d0) / 365
    Next t
    cf(L.UseMTM) = cf(L.UseMTM) + L.BalAtExit
    L.YtmIRR = 12 * IRRx(cf, L.UseMTM, IRR_GUESS, st)
    L.YtmIRRok = (st = 0)
    L.YtmXIRR = XIRRx(cf, e, L.UseMTM, 0.1, st)
    L.YtmXIRRok = (st = 0)
End Sub

Public Sub CalcOptimal(ByRef L As TLoan, ByRef R As TRel)
    Dim m As Long, xp As Double, fvm As Double, eam As Double, netm(1 To 60) As Double
    Dim y As Double, t As Long, s12 As Double, sAll As Double, st As Long, warm As Double
    Dim rateSrc As Double, pmtSrc As Double, cf() As Double
    y = R.Yield / 12
    If YTM_USE_PULLS Then
        rateSrc = L.MRate: pmtSrc = L.PmtPull
    Else
        rateSrc = L.CRate / 12: pmtSrc = L.CPmt
    End If
    warm = IRR_GUESS
    For m = 1 To 60
        xp = CalcExitPull(L, R, m, fvm, eam)
        BuildStream L, R, m, xp, netm
        L.Opt(m).Bid = NPVx(y, netm, 1, 60)
        s12 = 0: sAll = 0
        For t = 1 To 60
            sAll = sAll + netm(t)
            If t <= 12 Then s12 = s12 + netm(t)
        Next t
        If L.UPB <> 0 Then L.Opt(m).BidPct = L.Opt(m).Bid / L.UPB Else L.Opt(m).BidPct = 0
        If fvm <> 0 Then L.Opt(m).ImpDPO = 1 - xp / fvm Else L.Opt(m).ImpDPO = 0
        If L.Opt(m).Bid <> 0 Then
            L.Opt(m).CY12 = s12 / L.Opt(m).Bid
            L.Opt(m).MOIC = sAll / L.Opt(m).Bid
        Else
            L.Opt(m).CY12 = 0: L.Opt(m).MOIC = 0
        End If
        L.Opt(m).YTMok = False
        If OPT_YTM_MODE = 0 Then
            If L.Opt(m).Bid > 0 And L.UseMTM >= 1 Then
                L.Opt(m).YTM = 12 * IRRLevel(L.Opt(m).Bid, pmtSrc, L.UseMTM, L.BalAtExit, warm, st)
                L.Opt(m).YTMok = (st = 0)
                If st = 0 Then warm = L.Opt(m).YTM / 12
            End If
        Else
            If L.Opt(m).Bid > 0 Then
                ReDim cf(0 To m)
                cf(0) = -L.Opt(m).Bid
                For t = 1 To m
                    cf(t) = netm(t)
                Next t
                L.Opt(m).YTM = 12 * IRRx(cf, m, IRR_GUESS, st)
                L.Opt(m).YTMok = (st = 0)
            End If
        End If
    Next m
End Sub

Public Sub CalcHurdles(ByRef L As TLoan, ByRef R As TRel)
    Dim m As Long, pY As Boolean, pC As Boolean, pM As Boolean
    L.MinHYTM = 0: L.MinHCY = 0: L.MinHMOIC = 0: L.MinHAll = 0
    For m = 1 To 60
        pY = L.Opt(m).YTMok And L.Opt(m).YTM >= R.HurdleYTM
        pC = (L.Opt(m).Bid <> 0) And L.Opt(m).CY12 >= R.HurdleCY
        pM = (L.Opt(m).Bid <> 0) And L.Opt(m).MOIC >= R.HurdleMOIC
        If pY And L.MinHYTM = 0 Then L.MinHYTM = m
        If pC And L.MinHCY = 0 Then L.MinHCY = m
        If pM And L.MinHMOIC = 0 Then L.MinHMOIC = m
        If pY And pC And pM And L.MinHAll = 0 Then L.MinHAll = m
    Next m
End Sub

' ---------------------------------------------------------------- relationship
Public Sub CalcTotals(ByRef R As TRel)
    Dim i As Long, t As Long, wRate As Double, sFv As Double, sXp As Double, st As Long
    Dim cf() As Double, e() As Double, mx As Long, d0 As Long, rateSrc As Double, pmtSrc As Double
    Dim tot As TLoan
    tot = R.Tot
    InitLoanDefaults tot
    tot.LoanNo = "Relationship"
    tot.UPB = 0: tot.IntBal = 0: tot.CPmt = 0: tot.T3 = 0: tot.T6 = 0: tot.T12 = 0: tot.T24 = 0
    tot.ExitPull = 0: tot.BidModel = 0: tot.BidUsed = 0: tot.S12 = 0: tot.SAll = 0: tot.UseMTM = 0: tot.BalAtExit = 0
    For t = 1 To 60: tot.Net(t) = 0: Next t
    For i = 1 To R.LoanCount
        With R.Loans(i)
            tot.UPB = tot.UPB + .UPB: tot.IntBal = tot.IntBal + .IntBal: tot.CPmt = tot.CPmt + .CPmt
            tot.T3 = tot.T3 + .T3: tot.T6 = tot.T6 + .T6: tot.T12 = tot.T12 + .T12: tot.T24 = tot.T24 + .T24
            tot.ExitPull = tot.ExitPull + .ExitPull: tot.BidModel = tot.BidModel + .BidModel: tot.BidUsed = tot.BidUsed + .BidUsed
            tot.S12 = tot.S12 + .S12: tot.SAll = tot.SAll + .SAll
            wRate = wRate + .CRate * .UPB
            sFv = sFv + .FvAtExit: sXp = sXp + .ExitPull
            If .UseMTM > tot.UseMTM Then tot.UseMTM = .UseMTM
            tot.BalAtExit = tot.BalAtExit + .BalAtExit
            For t = 1 To 60: tot.Net(t) = tot.Net(t) + .Net(t): Next t
        End With
    Next i
    If tot.UPB <> 0 Then tot.CRate = wRate / tot.UPB
    tot.IntPmt = tot.UPB * tot.CRate / 12
    tot.RatioOk(1) = (tot.UPB <> 0): If tot.RatioOk(1) Then tot.BidPct = tot.BidUsed / tot.UPB
    tot.RatioOk(2) = (tot.BidUsed <> 0): If tot.RatioOk(2) Then tot.CY12 = tot.S12 / tot.BidUsed
    tot.RatioOk(3) = (tot.BidUsed <> 0): If tot.RatioOk(3) Then tot.MOIC = tot.SAll / tot.BidUsed
    tot.RatioOk(4) = (sFv <> 0): If tot.RatioOk(4) Then tot.ImpDPO = 1 - sXp / sFv
    tot.RatioOk(5) = (R.RelColl <> 0): If tot.RatioOk(5) Then tot.BidMwVx = tot.BidUsed / R.RelColl
    tot.RatioOk(6) = (tot.T12 <> 0): If tot.RatioOk(6) Then tot.F12P12 = tot.S12 / tot.T12
    ' summed contractual-hold stream
    tot.YtmIRRok = False: tot.YtmXIRRok = False: tot.SellYTMok = False
    mx = tot.UseMTM
    If mx >= 1 And tot.BidUsed > 0 Then
        ReDim cf(0 To mx): ReDim e(0 To mx)
        cf(0) = -tot.BidUsed
        d0 = CLng(R.CutoffDt)
        For i = 1 To R.LoanCount
            With R.Loans(i)
                If YTM_USE_PULLS Then
                    pmtSrc = .PmtPull
                Else
                    pmtSrc = .CPmt
                End If
                If .UseMTM >= 1 And .BidUsed > 0 Then
                    For t = 1 To .UseMTM
                        cf(t) = cf(t) + pmtSrc
                    Next t
                    cf(.UseMTM) = cf(.UseMTM) + .BalAtExit
                End If
            End With
        Next i
        For t = 1 To mx
            e(t) = (CLng(EDateX(R.CutoffDt, t)) - d0) / 365
        Next t
        tot.YtmIRR = 12 * IRRx(cf, mx, IRR_GUESS, st): tot.YtmIRRok = (st = 0)
        tot.YtmXIRR = XIRRx(cf, e, mx, 0.1, st): tot.YtmXIRRok = (st = 0)
    End If
    mx = 0
    For i = 1 To R.LoanCount
        If R.Loans(i).ExitMonth > mx Then mx = R.Loans(i).ExitMonth
    Next i
    If mx >= 1 And tot.BidUsed > 0 Then
        ReDim cf(0 To mx)
        cf(0) = -tot.BidUsed
        For t = 1 To mx: cf(t) = tot.Net(t): Next t
        tot.SellYTM = 12 * IRRx(cf, mx, IRR_GUESS, st): tot.SellYTMok = (st = 0)
    End If
    R.Tot = tot
End Sub

Public Sub CalcRel(ByRef R As TRel)
    Dim i As Long
    For i = 1 To R.LoanCount
        CalcLoan R.Loans(i), R
    Next i
    CalcTotals R
    R.RelOptValid = False
End Sub

Public Sub CalcRelOptimal(ByRef R As TRel)
    Dim m As Long, i As Long, sBid As Double, sUpb As Double, sS12 As Double, sAll As Double, sDpo As Double
    Dim cf() As Double, mx As Long, t As Long, st As Long, pmtSrc As Double, pY As Boolean, pC As Boolean, pM As Boolean
    For i = 1 To 4: R.RelMinH(i) = 0: Next i
    sUpb = R.Tot.UPB
    For m = 1 To 60
        sBid = 0: sS12 = 0: sAll = 0: sDpo = 0
        For i = 1 To R.LoanCount
            With R.Loans(i).Opt(m)
                sBid = sBid + .Bid
                sS12 = sS12 + .CY12 * .Bid
                sAll = sAll + .MOIC * .Bid
                sDpo = sDpo + .ImpDPO * .Bid
            End With
        Next i
        R.RelOpt(m).Bid = sBid
        If sUpb <> 0 Then R.RelOpt(m).BidPct = sBid / sUpb Else R.RelOpt(m).BidPct = 0
        If sBid <> 0 Then
            R.RelOpt(m).CY12 = sS12 / sBid: R.RelOpt(m).MOIC = sAll / sBid: R.RelOpt(m).ImpDPO = sDpo / sBid
        Else
            R.RelOpt(m).CY12 = 0: R.RelOpt(m).MOIC = 0: R.RelOpt(m).ImpDPO = 0
        End If
        R.RelOpt(m).YTMok = False
        mx = R.Tot.UseMTM
        If sBid > 0 And mx >= 1 Then
            ReDim cf(0 To mx)
            cf(0) = -sBid
            For i = 1 To R.LoanCount
                With R.Loans(i)
                    If YTM_USE_PULLS Then pmtSrc = .PmtPull Else pmtSrc = .CPmt
                    If .UseMTM >= 1 Then
                        For t = 1 To .UseMTM: cf(t) = cf(t) + pmtSrc: Next t
                        cf(.UseMTM) = cf(.UseMTM) + .BalAtExit
                    End If
                End With
            Next i
            R.RelOpt(m).YTM = 12 * IRRx(cf, mx, IRR_GUESS, st)
            R.RelOpt(m).YTMok = (st = 0)
        End If
        pY = R.RelOpt(m).YTMok And R.RelOpt(m).YTM >= R.HurdleYTM
        pC = (sBid <> 0) And R.RelOpt(m).CY12 >= R.HurdleCY
        pM = (sBid <> 0) And R.RelOpt(m).MOIC >= R.HurdleMOIC
        If pY And R.RelMinH(1) = 0 Then R.RelMinH(1) = m
        If pC And R.RelMinH(2) = 0 Then R.RelMinH(2) = m
        If pM And R.RelMinH(3) = 0 Then R.RelMinH(3) = m
        If pY And pC And pM And R.RelMinH(4) = 0 Then R.RelMinH(4) = m
    Next m
    R.Tot.MinHYTM = R.RelMinH(1): R.Tot.MinHCY = R.RelMinH(2): R.Tot.MinHMOIC = R.RelMinH(3): R.Tot.MinHAll = R.RelMinH(4)
    R.RelOptValid = True
End Sub

' ---------------------------------------------------------------- trails from gPay
Public Sub ComputeTrails(ByRef R As TRel)
    Dim i As Long, a As Long, j As Long, s3 As Double, s6 As Double, s12 As Double, s24 As Double
    If R.LoanCount = 0 Then Exit Sub
    a = PdDiff(gPayPd0, PdKey(R.AnchorDt))
    For i = 1 To R.LoanCount
        s3 = 0: s6 = 0: s12 = 0: s24 = 0
        For j = 0 To 23
            If a + j >= 0 And a + j <= gPayMax And gPayMax >= 0 Then
                If j <= 2 Then s3 = s3 + gPay(i, a + j)
                If j <= 5 Then s6 = s6 + gPay(i, a + j)
                If j <= 11 Then s12 = s12 + gPay(i, a + j)
                s24 = s24 + gPay(i, a + j)
            End If
        Next j
        R.Loans(i).T3 = s3: R.Loans(i).T6 = s6: R.Loans(i).T12 = s12: R.Loans(i).T24 = s24
    Next i
End Sub

Public Function TrailDisplay(s As Double, n As Long, sel As String, cpmt As Double, ipmt As Double) As Variant
    Select Case sel
        Case "monthly": TrailDisplay = s / n
        Case "yearly": TrailDisplay = s / n * 12
        Case "% of Contractual"
            If cpmt = 0 Then TrailDisplay = Null Else TrailDisplay = s / (cpmt * n)
        Case "% of Int PMT"
            If ipmt = 0 Then TrailDisplay = Null Else TrailDisplay = s / (ipmt * n)
        Case "# of PMT's Made"
            If cpmt = 0 Then TrailDisplay = Null Else TrailDisplay = s / cpmt
        Case "# of Int Pmt's Made"
            If ipmt = 0 Then TrailDisplay = Null Else TrailDisplay = s / ipmt
        Case Else: TrailDisplay = s
    End Select
End Function

Public Function TrailFormat(sel As String) As String
    Select Case sel
        Case "% of Contractual", "% of Int PMT": TrailFormat = "0.0%"
        Case "# of PMT's Made", "# of Int Pmt's Made": TrailFormat = "0.0"
        Case Else: TrailFormat = "$#,##0"
    End Select
End Function

' ---------------------------------------------------------------- inputs
Public Function IsInputKey(key As String) As Boolean
    Select Case key
        Case "PmtSel", "UserPmt", "TermMonths", "MTrailSel", "TrailPct", "RateSel", "UserRate", _
             "LegalInit", "LegalStartM", "HoldCost", "LegalEndM", "AddBack", "ExitType", "DPOPct", _
             "UserExit", "ValCapPct", "YTMTgt", "AddAccrued", "LiqAcrM", "StartMonth", "ExitMonth", "BidOverride"
            IsInputKey = True
    End Select
End Function

Private Function InList(val As String, lst As String) As Boolean
    Dim parts As Variant, i As Long
    parts = Split(lst, "|")
    For i = 0 To UBound(parts)
        If StrComp(parts(i), val, vbTextCompare) = 0 Then InList = True: Exit Function
    Next i
End Function

Private Function Canon(val As String, lst As String) As String
    Dim parts As Variant, i As Long
    parts = Split(lst, "|")
    For i = 0 To UBound(parts)
        If StrComp(parts(i), val, vbTextCompare) = 0 Then Canon = parts(i): Exit Function
    Next i
    Canon = val
End Function

' Coerce/clamp an input; False (with note) when rejected. Rates typed as 8 -> 0.08.
Public Function SetInput(ByRef L As TLoan, key As String, val As Variant, ByRef note As String) As Boolean
    Dim d As Double, s As String, lo As Double, hi As Double, isNum As Boolean, isPct As Boolean, isInt As Boolean
    note = ""
    SetInput = True
    Select Case key
        Case "PmtSel", "MTrailSel", "RateSel", "AddBack", "ExitType", "AddAccrued"
            s = Trim(Nz(val, ""))
            If Not InList(s, Replace(Replace(ValueList(key), Chr(34), ""), ";", "|")) Then
                note = "'" & s & "' is not a valid choice": SetInput = False: Exit Function
            End If
            s = Canon(s, Replace(Replace(ValueList(key), Chr(34), ""), ";", "|"))
            Select Case key
                Case "PmtSel": L.PmtSel = s
                Case "MTrailSel": L.MTrailSel = s
                Case "RateSel": L.RateSel = s
                Case "AddBack": L.AddBack = s
                Case "ExitType": L.ExitType = s
                Case "AddAccrued": L.AddAccrued = (s = "Yes")
            End Select
            Exit Function
        Case "BidOverride"
            If IsNull(val) Or Trim(Nz(val, "")) = "" Then L.HasOverride = False: L.BidOverride = 0: Exit Function
    End Select
    d = 0
    If Not (IsNull(val) Or Trim(Nz(val, "")) = "") Then
        If Not IsNumeric(val) Then note = "not a number": SetInput = False: Exit Function
        d = CDbl(val)
    End If
    isNum = True: isPct = False: isInt = False: lo = -1E+300: hi = 1E+300
    Select Case key
        Case "TrailPct", "DPOPct", "ValCapPct", "YTMTgt", "UserRate": isPct = True: lo = 0: hi = 1
        Case "TermMonths": isInt = True: lo = 0: hi = 480
        Case "LegalStartM", "LegalEndM": isInt = True: lo = 0: hi = 60
        Case "LiqAcrM": isInt = True: lo = 0: hi = 360
        Case "StartMonth": isInt = True: lo = 1: hi = IIf(L.ExitMonth >= 1, L.ExitMonth, 60)
        Case "ExitMonth": isInt = True: lo = 1: hi = 60
    End Select
    If isPct And d > 1 Then d = d / 100: note = "read as " & Format(d, "0.00%")
    If d < lo Then d = lo: note = "clamped to " & lo
    If d > hi Then d = hi: note = "clamped to " & hi
    If isInt Then d = Int(d)
    Select Case key
        Case "UserPmt": L.UserPmt = d
        Case "TermMonths": L.TermMonths = CLng(d)
        Case "TrailPct": L.TrailPct = d
        Case "UserRate": L.UserRate = d
        Case "LegalInit": L.LegalInit = d
        Case "LegalStartM": L.LegalStartM = CLng(d)
        Case "HoldCost": L.HoldCost = d
        Case "LegalEndM": L.LegalEndM = CLng(d)
        Case "DPOPct": L.DPOPct = d
        Case "UserExit": L.UserExit = d
        Case "ValCapPct": L.ValCapPct = d
        Case "YTMTgt": L.YTMTgt = d
        Case "LiqAcrM": L.LiqAcrM = CLng(d)
        Case "StartMonth": L.StartMonth = CLng(d)
        Case "ExitMonth"
            L.ExitMonth = CLng(d)
            If L.StartMonth > L.ExitMonth Then L.StartMonth = L.ExitMonth: note = "start month clamped to " & L.ExitMonth
        Case "BidOverride": L.HasOverride = True: L.BidOverride = d
        Case Else
            note = "unknown input " & key: SetInput = False
    End Select
End Function

' ---------------------------------------------------------------- values for painting
Private Function NA(ok As Boolean, v As Double) As Variant
    If ok Then NA = v Else NA = Null
End Function

Public Function LoanValue(ByRef L As TLoan, key As String) As Variant
    Select Case key
        Case "LoanNo": LoanValue = L.LoanNo
        Case "UPB": LoanValue = L.UPB
        Case "IntBal": LoanValue = L.IntBal
        Case "MAI": LoanValue = NA(L.MAIok, L.MAI)
        Case "CRate": LoanValue = L.CRate
        Case "DRate": LoanValue = L.DRate
        Case "MatDt": If L.HasMat Then LoanValue = L.MatDt Else LoanValue = Null
        Case "CPmt": LoanValue = L.CPmt
        Case "MTM": LoanValue = L.MTM
        Case "MTA": LoanValue = L.MTA
        Case "T3": LoanValue = L.T3
        Case "T6": LoanValue = L.T6
        Case "T12": LoanValue = L.T12
        Case "T24": LoanValue = L.T24
        Case "PmtSel": LoanValue = L.PmtSel
        Case "PmtPull": LoanValue = L.PmtPull
        Case "IntPmt": LoanValue = L.IntPmt
        Case "UserPmt": LoanValue = L.UserPmt
        Case "TermPmt": LoanValue = L.TermPmt
        Case "TermMonths": LoanValue = L.TermMonths
        Case "PctTrail": LoanValue = L.PctTrailPmt
        Case "MTrailSel": LoanValue = L.MTrailSel
        Case "TrailPct": LoanValue = L.TrailPct
        Case "RateSel": LoanValue = L.RateSel
        Case "RatePull": LoanValue = L.MRate * 12
        Case "UserRate": LoanValue = L.UserRate
        Case "LegalInit": LoanValue = L.LegalInit
        Case "LegalStartM": LoanValue = L.LegalStartM
        Case "HoldCost": LoanValue = L.HoldCost
        Case "LegalEndM": LoanValue = L.LegalEndM
        Case "AddBack": LoanValue = L.AddBack
        Case "ExitType": LoanValue = L.ExitType
        Case "ExitVal": LoanValue = L.ExitPull
        Case "DPOPct": LoanValue = L.DPOPct
        Case "UserExit": LoanValue = L.UserExit
        Case "ValCapPct": LoanValue = L.ValCapPct
        Case "YTMTgt": LoanValue = L.YTMTgt
        Case "AddAccrued": LoanValue = IIf(L.AddAccrued, "Yes", "No")
        Case "LiqAcrM": LoanValue = L.LiqAcrM
        Case "ImpDPO": LoanValue = NA(L.RatioOk(4), L.ImpDPO)
        Case "StartMonth": LoanValue = L.StartMonth
        Case "ExitMonth": LoanValue = L.ExitMonth
        Case "BidPct": LoanValue = NA(L.RatioOk(1), L.BidPct)
        Case "BidNPV": LoanValue = L.BidModel
        Case "CY12": LoanValue = NA(L.RatioOk(2), L.CY12)
        Case "MOIC": LoanValue = NA(L.RatioOk(3), L.MOIC)
        Case "BidMwVx": LoanValue = NA(L.RatioOk(5), L.BidMwVx)
        Case "F12P12": LoanValue = NA(L.RatioOk(6), L.F12P12)
        Case "UseMTM": LoanValue = L.UseMTM
        Case "BalAtExit": LoanValue = L.BalAtExit
        Case "YtmIRR": LoanValue = NA(L.YtmIRRok, L.YtmIRR)
        Case "YtmXIRR": LoanValue = NA(L.YtmXIRRok, L.YtmXIRR)
        Case "BidOverride": If L.HasOverride Then LoanValue = L.BidOverride Else LoanValue = Null
        Case "SellYTM": LoanValue = NA(L.SellYTMok, L.SellYTM)
        Case "MinHAll": If L.MinHAll > 0 Then LoanValue = L.MinHAll Else LoanValue = Null
        Case "MinHYTM": If L.MinHYTM > 0 Then LoanValue = L.MinHYTM Else LoanValue = Null
        Case "MinHCY": If L.MinHCY > 0 Then LoanValue = L.MinHCY Else LoanValue = Null
        Case "MinHMOIC": If L.MinHMOIC > 0 Then LoanValue = L.MinHMOIC Else LoanValue = Null
        Case Else: LoanValue = Null
    End Select
End Function

Public Function TotValue(ByRef R As TRel, key As String) As Variant
    Select Case key
        Case "LoanNo": TotValue = "Relationship"
        Case "RelColl": TotValue = R.RelColl
        Case "MAI", "DRate", "MatDt", "MTM", "MTA", "TermPmt", "PctTrail", "RatePull", "UseMTM"
            TotValue = Null
        Case "IntPmt": TotValue = R.Tot.IntPmt
        Case "PmtPull": TotValue = R.Tot.PmtPull
        Case Else: TotValue = LoanValue(R.Tot, key)
    End Select
End Function

' ---------------------------------------------------------------- the sheet's row table
Public Sub RowDefs(ByRef keys() As String, ByRef caps() As String, ByRef kinds() As String, ByRef fmts() As String)
    Dim n As Long
    ReDim keys(1 To NROWS): ReDim caps(1 To NROWS): ReDim kinds(1 To NROWS): ReDim fmts(1 To NROWS)
    n = 0
    RowDef keys, caps, kinds, fmts, n, "UPB", "UPB", "g", "$#,##0;($#,##0);0;""—"""
    RowDef keys, caps, kinds, fmts, n, "IntBal", "Interest", "g", "$#,##0;($#,##0);0;""—"""
    RowDef keys, caps, kinds, fmts, n, "MAI", "MAI", "c", "0.0;-0.0;0.0;""—"""
    RowDef keys, caps, kinds, fmts, n, "CRate", "Rate", "g", "0.00%"
    RowDef keys, caps, kinds, fmts, n, "DRate", "Default Rate", "g", "0.00%"
    RowDef keys, caps, kinds, fmts, n, "MatDt", "Maturity", "g", "mm/dd/yy"
    RowDef keys, caps, kinds, fmts, n, "CPmt", "PMT", "g", "$#,##0;($#,##0);0;""—"""
    RowDef keys, caps, kinds, fmts, n, "MTM", "MTM", "c", "0;-0;0;""—"""
    RowDef keys, caps, kinds, fmts, n, "MTA", "MTA", "c", "0;-0;0;""—"""
    RowDef keys, caps, kinds, fmts, n, "RelColl", "Rel Collateral", "c", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "T3", "3M Trail", "c", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "T6", "6M Trail", "c", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "T12", "12M Trail", "c", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "TrailDisp", "Trail Selection", "t", ""
    RowDef keys, caps, kinds, fmts, n, "PmtSel", "Payment Selection", "Y", ""
    RowDef keys, caps, kinds, fmts, n, "PmtPull", "Payment Pull", "c", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "IntPmt", "Interest Payment", "c", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "UserPmt", "User PMT", "y", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "TermPmt", "Term PMT", "c", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "TermMonths", "Term Months", "y", "0"
    RowDef keys, caps, kinds, fmts, n, "PctTrail", "% X Trail PMT", "c", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "MTrailSel", "M Trail", "Y", ""
    RowDef keys, caps, kinds, fmts, n, "TrailPct", "Trail %", "y", "0.00%"
    RowDef keys, caps, kinds, fmts, n, "RateSel", "Rate Selection", "Y", ""
    RowDef keys, caps, kinds, fmts, n, "RatePull", "Rate Pull", "c", "0.00%"
    RowDef keys, caps, kinds, fmts, n, "UserRate", "User Rate", "y", "0.00%"
    RowDef keys, caps, kinds, fmts, n, "LegalHdr", "Legal", "s", ""
    RowDef keys, caps, kinds, fmts, n, "LegalInit", "Initial Legal $", "y", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "LegalStartM", "Intial Start M", "y", "0"
    RowDef keys, caps, kinds, fmts, n, "HoldCost", "Holding Cost $", "y", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "LegalEndM", "Legal End M", "y", "0"
    RowDef keys, caps, kinds, fmts, n, "AddBack", "Add Back to Exit", "Y", ""
    RowDef keys, caps, kinds, fmts, n, "ExitType", "Exit Type", "Y", ""
    RowDef keys, caps, kinds, fmts, n, "ExitVal", "Exit Pull", "r", "$#,##0;[Red]($#,##0);0;""—"""
    RowDef keys, caps, kinds, fmts, n, "DPOPct", "DPO %", "y", "0.00%"
    RowDef keys, caps, kinds, fmts, n, "UserExit", "User Enter", "y", "$#,##0"
    RowDef keys, caps, kinds, fmts, n, "ValCapPct", "Value Cap", "y", "0.00%"
    RowDef keys, caps, kinds, fmts, n, "YTMTgt", "YTM Target %", "y", "0.00%"
    RowDef keys, caps, kinds, fmts, n, "AddAccrued", "Add Current Accrued", "Y", ""
    RowDef keys, caps, kinds, fmts, n, "LiqAcrM", "LQDN Forward Acr M", "y", "0"
    RowDef keys, caps, kinds, fmts, n, "ImpDPO", "Implied DPO", "r", "0.0%;-0.0%;0.0%;""—"""
    RowDef keys, caps, kinds, fmts, n, "StartMonth", "Start Mont", "y", "0"
    RowDef keys, caps, kinds, fmts, n, "ExitMonth", "Exit Month", "y", "0"
    RowDef keys, caps, kinds, fmts, n, "BidPct", "Bid %", "r", "0.0%;-0.0%;0.0%;""—"""
    RowDef keys, caps, kinds, fmts, n, "BidNPV", "Bid", "r", "$#,##0;[Red]($#,##0);0;""—"""
    RowDef keys, caps, kinds, fmts, n, "CY12", "12M CY", "r", "0.0%;-0.0%;0.0%;""—"""
    RowDef keys, caps, kinds, fmts, n, "MOIC", "MOIC", "r", "0.00;-0.00;0.00;""—"""
    RowDef keys, caps, kinds, fmts, n, "BidMwVx", "Bid/MwVx", "r", "0.0%;-0.0%;0.0%;""—"""
    RowDef keys, caps, kinds, fmts, n, "F12P12", "F12/P12 PMT", "r", "0.00;-0.00;0.00;""—"""
    RowDef keys, caps, kinds, fmts, n, "YtmHdr", "YTM (contractual hold)", "s", ""
    RowDef keys, caps, kinds, fmts, n, "UseMTM", "Use MTM", "c", "0;-0;0;""—"""
    RowDef keys, caps, kinds, fmts, n, "BalAtExit", "Bal at Exit", "c", "$#,##0;($#,##0);0;""—"""
    RowDef keys, caps, kinds, fmts, n, "YtmIRR", "YTM (IRR)", "r", "0.00%;-0.00%;0.00%;""—"""
    RowDef keys, caps, kinds, fmts, n, "YtmXIRR", "YTM (XIRR)", "r", "0.00%;-0.00%;0.00%;""—"""
    RowDef keys, caps, kinds, fmts, n, "BidOverride", "Bid Override", "y", "$#,##0;($#,##0);0;"""""
    RowDef keys, caps, kinds, fmts, n, "SellYTM", "Sell YTM", "r", "0.00%;-0.00%;0.00%;""—"""
    RowDef keys, caps, kinds, fmts, n, "HurdleHdr", "Hurdles", "s", ""
    RowDef keys, caps, kinds, fmts, n, "MinHAll", "Min Hurdle Month (All)", "r", "0;-0;0;""—"""
End Sub

Private Sub RowDef(ByRef keys() As String, ByRef caps() As String, ByRef kinds() As String, ByRef fmts() As String, _
                   ByRef n As Long, k As String, c As String, t As String, f As String)
    n = n + 1
    keys(n) = k: caps(n) = c: kinds(n) = t: fmts(n) = f
End Sub

' Chr(34)-quoted ";" value list for the Y/t rows
Public Function ValueList(key As String) As String
    Select Case key
        Case "PmtSel": ValueList = VLq("Current PMT|User PMT|Interest PMT|Term PMT|% of M Trail PMT")
        Case "MTrailSel": ValueList = VLq("3M|6M|12M")
        Case "RateSel": ValueList = VLq("Contractual|User Enter|Default")
        Case "AddBack": ValueList = VLq("No|Yes, Initial Only|Yes, Both")
        Case "ExitType": ValueList = VLq("PIF|User Enter|DPO|YTM Sell Solve|Value Cap|Liquidation|IRR Solve")
        Case "AddAccrued": ValueList = VLq("Yes|No")
        Case "TrailDisp": ValueList = VLq("Actual|monthly|yearly|% of Contractual|% of Int PMT|# of PMT's Made|# of Int Pmt's Made")
        Case Else: ValueList = ""
    End Select
End Function

Private Function VLq(pipeList As String) As String
    Dim parts As Variant, i As Long, s As String
    parts = Split(pipeList, "|")
    For i = 0 To UBound(parts)
        If i > 0 Then s = s & ";"
        s = s & Chr(34) & parts(i) & Chr(34)
    Next i
    VLq = s
End Function

' ---------------------------------------------------------------- small helpers
Public Function MinL(a As Long, b As Long) As Long
    If a < b Then MinL = a Else MinL = b
End Function

Private Function PowY(b As Double, n As Long) As Double
    On Error GoTo Bad
    PowY = b ^ n
    Exit Function
Bad:
    PowY = 1E+300
End Function
