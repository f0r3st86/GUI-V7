Attribute VB_Name = "modBR_Fin"
Option Compare Database
Option Explicit

' =====================================================================
' modBR_Fin - Excel-semantics finance primitives for the Relationship
' Projection v2 engine. Pure: no DAO, no Forms, never raises.
' Oracle: scripts/bid_engine_ref.py (Excel conventions).
' =====================================================================

Private Const BIG As Double = 1E+300

' ---------------------------------------------------------------- FV / PV / PMT / NPER (type 0)
Public Function FVx(r As Double, n As Double, pmt As Double, pv As Double) As Double
    Dim f As Double
    If r = 0 Then
        FVx = -(pv + pmt * n)
    Else
        f = PowSafe(1 + r, n)
        FVx = -(pv * f + pmt * (f - 1) / r)
    End If
End Function

Public Function PVx(r As Double, n As Double, pmt As Double, Optional fv As Double = 0) As Double
    Dim f As Double
    If r = 0 Then
        PVx = -(fv + pmt * n)
    Else
        f = PowSafe(1 + r, n)
        If f = 0 Then f = 1E-300
        PVx = -(fv + pmt * (f - 1) / r) / f
    End If
End Function

Public Function PMTx(r As Double, n As Double, pv As Double, Optional fv As Double = 0) As Double
    Dim f As Double
    If n = 0 Then Exit Function
    If r = 0 Then
        PMTx = -(pv + fv) / n
    Else
        f = PowSafe(1 + r, n)
        If f - 1 = 0 Then Exit Function
        PMTx = -(pv * f + fv) * r / (f - 1)
    End If
End Function

' Excel NPER with fv = 0, type 0. ok = False exactly where Excel gives #NUM!
Public Function NPERx(r As Double, pmt As Double, pv As Double, ByRef ok As Boolean) As Double
    Dim a As Double, den As Double
    ok = False
    NPERx = 1E+9
    If r = 0 Then
        If pmt = 0 Then Exit Function
        ok = True
        NPERx = -pv / pmt
        Exit Function
    End If
    den = pmt + pv * r
    If den = 0 Then Exit Function
    a = pmt / den
    If a <= 0 Then Exit Function
    If 1 + r <= 0 Then Exit Function
    ok = True
    NPERx = Log(a) / Log(1 + r)
End Function

' Excel NPV over cf(lo..hi): first flow discounted one period. Horner, no ^.
Public Function NPVx(r As Double, cf() As Double, lo As Long, hi As Long) As Double
    Dim v As Double, acc As Double, t As Long
    If 1 + r = 0 Then Exit Function
    v = 1 / (1 + r)
    acc = 0
    For t = hi To lo Step -1
        acc = (acc + cf(t)) * v
    Next t
    NPVx = acc
End Function

' ---------------------------------------------------------------- dates / period keys
' Excel DAYS360 US (NASD): start Feb-end -> 30; D1 31 -> 30; D2 31 with D1 30 -> 30; end Feb-end untouched
Public Function Days360US(d1 As Date, d2 As Date) As Long
    Dim dd1 As Long, dd2 As Long
    dd1 = Day(d1): dd2 = Day(d2)
    If Month(d1) = 2 And Day(DateSerial(Year(d1), 3, 0)) = dd1 Then dd1 = 30
    If dd1 = 31 Then dd1 = 30
    If dd2 = 31 And dd1 = 30 Then dd2 = 30
    Days360US = (Year(d2) - Year(d1)) * 360 + (Month(d2) - Month(d1)) * 30 + (dd2 - dd1)
End Function

' Excel DATEDIF "m" (day-aware); negative when d2 < d1
Public Function DateDifM(d1 As Date, d2 As Date) As Long
    Dim a As Date, b As Date, sgn As Long, m As Long
    a = d1: b = d2: sgn = 1
    If b < a Then a = d2: b = d1: sgn = -1
    m = (Year(b) - Year(a)) * 12 + (Month(b) - Month(a))
    If Day(b) < Day(a) Then m = m - 1
    DateDifM = sgn * m
End Function

Public Function EDateX(d As Date, n As Long) As Date
    EDateX = DateAdd("m", n, d)
End Function

Public Function PdKey(d As Date) As Long
    PdKey = Year(d) * 100 + Month(d)
End Function

Public Function PdAdd(pd As Long, n As Long) As Long
    Dim y As Long, m As Long
    y = pd \ 100: m = pd Mod 100
    m = m - 1 + n
    y = y + m \ 12
    m = m Mod 12
    If m < 0 Then m = m + 12: y = y - 1
    PdAdd = y * 100 + m + 1
End Function

Public Function PdDiff(pdHi As Long, pdLo As Long) As Long
    PdDiff = (pdHi \ 100 - pdLo \ 100) * 12 + (pdHi Mod 100 - pdLo Mod 100)
End Function

' ---------------------------------------------------------------- IRR
' Evaluate f = sum cf(t) v^t and f' at rate r (scaled by s). ok = False on overflow;
' then f carries the sign of the last non-zero flow (the correct limit sign as v -> inf).
Private Sub EvalNpv(cf() As Double, n As Long, s As Double, r As Double, _
                    ByRef f As Double, ByRef fp As Double, ByRef ok As Boolean)
    Dim v As Double, acc As Double, gacc As Double, t As Long
    ok = True
    On Error GoTo Ovf
    If 1 + r <= 0 Then GoTo Ovf
    v = 1 / (1 + r)
    acc = 0: gacc = 0
    For t = n To 1 Step -1
        acc = acc * v + cf(t) / s
        gacc = gacc * v + t * (cf(t) / s)
    Next t
    f = acc * v + cf(0) / s
    fp = -v * v * gacc
    Exit Sub
Ovf:
    ok = False
    fp = 0
    f = BIG * LastSign(cf, n)
End Sub

Private Function LastSign(cf() As Double, n As Long) As Double
    Dim t As Long
    For t = n To 0 Step -1
        If cf(t) > 0 Then LastSign = 1: Exit Function
        If cf(t) < 0 Then LastSign = -1: Exit Function
    Next t
    LastSign = 1
End Function

' Bracketed safeguarded Newton between lo/hi (flo*fhi < 0). Returns status 0 or 3.
Private Function RtSafe(cf() As Double, n As Long, s As Double, lo As Double, hi As Double, _
                        flo As Double, fhi As Double, ByRef status As Long) As Double
    Dim r As Double, f As Double, fp As Double, ok As Boolean, i As Long
    Dim dr As Double, prevDr As Double, r1 As Double
    r = (lo + hi) / 2
    prevDr = hi - lo
    For i = 1 To 100
        EvalNpv cf, n, s, r, f, fp, ok
        If ok Then
            If Abs(f) < 0.000000000001 Then RtSafe = r: status = 0: Exit Function
        End If
        If ok Then
            If (flo < 0 And f < 0) Or (flo > 0 And f > 0) Then lo = r: flo = f Else hi = r: fhi = f
        Else
            If (flo < 0 And f < 0) Or (flo > 0 And f > 0) Then lo = r: flo = f Else hi = r: fhi = f
        End If
        If hi - lo < 0.0000000000001 Then RtSafe = (lo + hi) / 2: status = 0: Exit Function
        r1 = (lo + hi) / 2
        If ok And fp <> 0 Then
            dr = f / fp
            If Abs(dr) < prevDr / 2 Then
                If r - dr > lo And r - dr < hi Then r1 = r - dr
            End If
        End If
        prevDr = Abs(r1 - r)
        r = r1
    Next i
    RtSafe = r
    status = 3
End Function

' cf(0..n) with cf(0) at t=0. status: 0 ok, 1 no sign change, 2 no bracket, 3 iteration cap
Public Function IRRx(cf() As Double, n As Long, guess As Double, ByRef status As Long) As Double
    Dim s As Double, t As Long, hasPos As Boolean, hasNeg As Boolean
    Dim r As Double, r1 As Double, f As Double, fp As Double, ok As Boolean, i As Long
    Dim g As Variant, k As Long, fv() As Double, okv() As Boolean, bestLo As Long, bestDist As Double
    Dim sumAbs As Double
    status = 0
    IRRx = 0
    s = 0
    For t = 0 To n
        If Abs(cf(t)) > s Then s = Abs(cf(t))
    Next t
    If s = 0 Then status = 1: Exit Function
    For t = 0 To n
        If cf(t) / s > 0.000000000001 Then hasPos = True
        If cf(t) / s < -0.000000000001 Then hasNeg = True
        sumAbs = sumAbs + Abs(cf(t)) / s
    Next t
    If Not (hasPos And hasNeg) Then status = 1: Exit Function
    ' Phase 1: Newton from Excel's guess (damped below -1)
    r = guess
    For i = 1 To 60
        EvalNpv cf, n, s, r, f, fp, ok
        If Not ok Then Exit For
        If Abs(fp) < 1E-300 Then Exit For
        r1 = r - f / fp
        If r1 <= -1 Then r1 = (r - 1) / 2
        If r1 > 1000 Then Exit For
        If Abs(r1 - r) <= 0.000000000001 * IIf(Abs(r) > 1, Abs(r), 1) Then
            r = r1
            EvalNpv cf, n, s, r, f, fp, ok
            If ok Then
                If Abs(f) <= 0.000001 * sumAbs Then IRRx = r: status = 0: Exit Function
            End If
            Exit For
        End If
        r = r1
    Next i
    ' Phase 2: grid bracket (floored at -0.8) + safeguarded Newton
    g = Array(-0.8, -0.7, -0.5, -0.3, -0.2, -0.1, -0.05, -0.02, -0.01, -0.005, 0, 0.0025, 0.005, _
              0.01, 0.02, 0.03, 0.05, 0.08, 0.12, 0.2, 0.35, 0.5, 1)
    ReDim fv(0 To UBound(g)): ReDim okv(0 To UBound(g))
    For k = 0 To UBound(g)
        EvalNpv cf, n, s, CDbl(g(k)), fv(k), fp, okv(k)
    Next k
    bestLo = -1: bestDist = 1E+300
    For k = 0 To UBound(g) - 1
        If (fv(k) < 0 And fv(k + 1) > 0) Or (fv(k) > 0 And fv(k + 1) < 0) Then
            If Abs((g(k) + g(k + 1)) / 2 - guess) < bestDist Then
                bestDist = Abs((g(k) + g(k + 1)) / 2 - guess)
                bestLo = k
            End If
        End If
    Next k
    If bestLo < 0 Then status = 2: Exit Function
    r = RtSafe(cf, n, s, CDbl(g(bestLo)), CDbl(g(bestLo + 1)), fv(bestLo), fv(bestLo + 1), status)
    EvalNpv cf, n, s, r, f, fp, ok
    If Not ok Then status = 2: Exit Function
    If Abs(f) > 0.000001 * sumAbs Then status = 2: Exit Function
    IRRx = r
End Function

' Level stream [-bid, pmt x nPer, +bal at nPer]; per-period rate. bid <= 0 -> status 4
Public Function IRRLevel(bid As Double, pmt As Double, nPer As Long, bal As Double, guess As Double, _
                         ByRef status As Long) As Double
    Dim cf() As Double, t As Long
    If bid <= 0 Or nPer < 1 Then status = 4: Exit Function
    ReDim cf(0 To nPer)
    cf(0) = -bid
    For t = 1 To nPer
        cf(t) = pmt
    Next t
    cf(nPer) = cf(nPer) + bal
    IRRLevel = IRRx(cf, nPer, guess, status)
End Function

' ---------------------------------------------------------------- XIRR (annual)
Private Sub EvalXnpv(cf() As Double, e() As Double, n As Long, s As Double, r As Double, _
                     ByRef f As Double, ByRef fp As Double, ByRef ok As Boolean)
    Dim t As Long, lg As Double, w As Double
    ok = True
    On Error GoTo Ovf
    If 1 + r <= 0 Then GoTo Ovf
    lg = Log(1 + r)
    f = 0: fp = 0
    For t = 0 To n
        w = Exp(-e(t) * lg)
        f = f + (cf(t) / s) * w
        fp = fp - e(t) * (cf(t) / s) * w / (1 + r)
    Next t
    Exit Sub
Ovf:
    ok = False
    fp = 0
    f = BIG * LastSign(cf, n)
End Sub

Public Function XIRRx(cf() As Double, e() As Double, n As Long, guess As Double, ByRef status As Long) As Double
    Dim s As Double, t As Long, hasPos As Boolean, hasNeg As Boolean, sumAbs As Double
    Dim r As Double, r1 As Double, f As Double, fp As Double, ok As Boolean, i As Long
    Dim g As Variant, k As Long, fv() As Double, lo As Double, hi As Double, flo As Double, fhi As Double
    Dim bestLo As Long, bestDist As Double
    status = 0
    XIRRx = 0
    s = 0
    For t = 0 To n
        If Abs(cf(t)) > s Then s = Abs(cf(t))
    Next t
    If s = 0 Then status = 1: Exit Function
    For t = 0 To n
        If cf(t) / s > 0.000000000001 Then hasPos = True
        If cf(t) / s < -0.000000000001 Then hasNeg = True
        sumAbs = sumAbs + Abs(cf(t)) / s
    Next t
    If Not (hasPos And hasNeg) Then status = 1: Exit Function
    r = guess
    For i = 1 To 100
        EvalXnpv cf, e, n, s, r, f, fp, ok
        If Not ok Then Exit For
        If Abs(fp) < 1E-300 Then Exit For
        r1 = r - f / fp
        If r1 <= -1 Then r1 = (r - 1) / 2
        If r1 < -0.999999 Then r1 = -0.999999
        If r1 > 1000 Then Exit For
        If Abs(r1 - r) <= 0.000000000001 * IIf(Abs(r) > 1, Abs(r), 1) Then
            r = r1
            EvalXnpv cf, e, n, s, r, f, fp, ok
            If ok Then
                If Abs(f) <= 0.000001 * sumAbs Then XIRRx = r: Exit Function
            End If
            Exit For
        End If
        r = r1
    Next i
    g = Array(-0.99, -0.9, -0.5, -0.3, -0.1, 0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1, 2, 5, 10)
    ReDim fv(0 To UBound(g))
    For k = 0 To UBound(g)
        EvalXnpv cf, e, n, s, CDbl(g(k)), fv(k), fp, ok
    Next k
    bestLo = -1: bestDist = 1E+300
    For k = 0 To UBound(g) - 1
        If (fv(k) < 0 And fv(k + 1) > 0) Or (fv(k) > 0 And fv(k + 1) < 0) Then
            If Abs((g(k) + g(k + 1)) / 2 - guess) < bestDist Then
                bestDist = Abs((g(k) + g(k + 1)) / 2 - guess)
                bestLo = k
            End If
        End If
    Next k
    If bestLo < 0 Then status = 2: Exit Function
    lo = g(bestLo): hi = g(bestLo + 1): flo = fv(bestLo): fhi = fv(bestLo + 1)
    For i = 1 To 200
        r = (lo + hi) / 2
        EvalXnpv cf, e, n, s, r, f, fp, ok
        If ok Then
            If Abs(f) < 0.000000000001 Then Exit For
        End If
        If (flo < 0 And f < 0) Or (flo > 0 And f > 0) Then lo = r: flo = f Else hi = r: fhi = f
        If hi - lo < 0.0000000000001 Then Exit For
    Next i
    EvalXnpv cf, e, n, s, r, f, fp, ok
    If Not ok Then status = 2: Exit Function
    If Abs(f) > 0.000001 * sumAbs Then status = 2: Exit Function
    If i > 200 Then status = 3
    XIRRx = r
End Function

' ---------------------------------------------------------------- helpers
' (1+r)^n without raising: overflow -> 1E+300, invalid base -> 0
Private Function PowSafe(b As Double, n As Double) As Double
    On Error GoTo Bad
    If b <= 0 Then
        If n = Int(n) Then PowSafe = b ^ n Else PowSafe = 0
        Exit Function
    End If
    PowSafe = Exp(n * Log(b))
    Exit Function
Bad:
    PowSafe = BIG
End Function
