"""
Reference implementation of the Bid_Project workbook's 'Relationship Projection'
model, written directly from the sheet's formulas (see the recovered LET
formulas in docs/). This is the ORACLE for the Access/VBA engine: any port must
reproduce these numbers to the cent. Pure Python, no dependencies; uses Excel's
own conventions for NPV/IRR/XIRR/FV/PV/PMT/NPER/DAYS360.

Run:  python3 scripts/bid_engine_ref.py        -> self-test + a worked example
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date
import math

# ---------------------------------------------------------------- Excel financial primitives
def FV(rate, nper, pmt, pv=0.0, typ=0):
    if rate == 0:
        return -(pv + pmt * nper)
    f = (1 + rate) ** nper
    return -(pv * f + pmt * (1 + rate * typ) * (f - 1) / rate)

def PV(rate, nper, pmt, fv=0.0, typ=0):
    if rate == 0:
        return -(fv + pmt * nper)
    f = (1 + rate) ** nper
    return -(fv + pmt * (1 + rate * typ) * (f - 1) / rate) / f

def PMT(rate, nper, pv, fv=0.0, typ=0):
    if rate == 0:
        return -(pv + fv) / nper
    f = (1 + rate) ** nper
    return -(pv * f + fv) * rate / ((1 + rate * typ) * (f - 1))

def NPER(rate, pmt, pv, fv=0.0, typ=0):
    if rate == 0:
        return -(pv + fv) / pmt
    a = pmt * (1 + rate * typ)
    num = a - fv * rate
    den = a + pv * rate
    if num / den <= 0:
        raise ValueError("NPER undefined (payment does not cover interest)")
    return math.log(num / den) / math.log(1 + rate)

def NPV(rate, flows):
    """Excel NPV: first flow discounted ONE period."""
    return sum(cf / (1 + rate) ** (i + 1) for i, cf in enumerate(flows))

def _npv0(rate, flows):
    """sum cf_i v^i with v = 1/(1+r), Horner from the end (no underflowing powers)."""
    v = 1.0 / (1.0 + rate)
    acc = 0.0
    for cf in reversed(flows):
        acc = acc * v + cf
    return acc

def IRR(flows, guess=0.1, tol=1e-10, maxit=200):
    """Excel IRR: rate where sum(cf_i/(1+r)^i) = 0, i from 0. Bracket (floored at -0.8 like the VBA
    grid, so 5^360 stays finite) + bisection."""
    if not any(cf > 0 for cf in flows) or not any(cf < 0 for cf in flows):
        raise ValueError("IRR needs a sign change")
    lo, hi = -0.8, 10.0
    flo, fhi = _npv0(lo, flows), _npv0(hi, flows)
    if flo * fhi > 0:
        raise ValueError("IRR not bracketed")
    for _ in range(maxit):
        mid = (lo + hi) / 2
        fm = _npv0(mid, flows)
        if abs(fm) < tol or (hi - lo) < 1e-12:
            return mid
        if flo * fm < 0:
            hi, fhi = mid, fm
        else:
            lo, flo = mid, fm
    return (lo + hi) / 2

def XIRR(flows, dates, tol=1e-10, maxit=200):
    """Excel XIRR: sum(cf_i/(1+r)^((d_i-d_0)/365)) = 0. Bisection on a bracket."""
    d0 = dates[0]
    t = [(d - d0).days / 365.0 for d in dates]
    def f(r):
        return sum(cf / (1 + r) ** ti for cf, ti in zip(flows, t))
    lo, hi = -0.9999, 10.0
    flo, fhi = f(lo), f(hi)
    if flo * fhi > 0:
        raise ValueError("XIRR not bracketed")
    for _ in range(maxit):
        mid = (lo + hi) / 2
        fm = f(mid)
        if abs(fm) < tol or (hi - lo) < 1e-12:
            return mid
        if flo * fm < 0:
            hi, fhi = mid, fm
        else:
            lo, flo = mid, fm
    return (lo + hi) / 2

def DAYS360(d1: date, d2: date) -> int:
    """US (NASD) method, Excel default."""
    y1, m1, dd1 = d1.year, d1.month, d1.day
    y2, m2, dd2 = d2.year, d2.month, d2.day
    # Excel US method: a start date on the last day of February counts as the 30th;
    # the end date is NOT adjusted for February.
    feb_last = 29 if (y1 % 4 == 0 and (y1 % 100 != 0 or y1 % 400 == 0)) else 28
    if m1 == 2 and dd1 == feb_last:
        dd1 = 30
    if dd1 == 31:
        dd1 = 30
    if dd2 == 31 and dd1 == 30:
        dd2 = 30
    return (y2 - y1) * 360 + (m2 - m1) * 30 + (dd2 - dd1)

def EDATE(d: date, months: int) -> date:
    m = d.month - 1 + months
    y = d.year + m // 12
    m = m % 12 + 1
    last = [31, 29 if (y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
    return date(y, m, min(d.day, last))

# ---------------------------------------------------------------- the model
@dataclass
class Loan:
    loan_no: str
    upb: float
    interest: float
    rate: float            # decimal fraction, annual
    default_rate: float
    maturity: date | None
    pmt: float             # contractual RepayAmt
    t3: float = 0.0        # trailing payment sums
    t6: float = 0.0
    t12: float = 0.0
    # yellow inputs (sheet defaults)
    pmt_sel: str = "Current PMT"
    user_pmt: float = 0.0
    term_months: int = 0
    m_trail: str = "12M"
    trail_pct: float = 1.0
    rate_sel: str = "Contractual"
    user_rate: float = 0.0
    legal_init: float = 0.0
    legal_start: int = 0
    hold_cost: float = 0.0
    legal_end: int = 0
    add_back: str = "No"           # No | Yes, Initial Only | Yes, Both
    exit_type: str = "PIF"
    dpo_pct: float = 0.25
    user_exit: float = 0.0
    val_cap_pct: float = 1.0
    ytm_tgt: float = 0.15
    add_accrued: str = "No"
    liq_acr_m: int = 0
    start_m: int = 1
    exit_m: int = 24

@dataclass
class Context:
    yield_target: float = 0.15
    cf_start: date = date(2026, 7, 31)   # sheet S1 (EOMONTH of project CF start)
    cutoff: date = date(2026, 7, 20)     # sheet S2
    rel_collateral: float = 0.0
    ytm_floor_months: int = 0            # YTM!J2 baseline floor
    hurdle_ytm: float = 0.10
    hurdle_cy12: float = 0.09
    hurdle_moic: float = 1.3

@dataclass
class Result:
    mai: float | None
    mtm: int
    mta: int
    pmt_pull: float
    rate_pull: float
    exit_pull: float
    net: list                      # months 1..60
    bid: float
    bid_pct: float | None
    cy12: float | None
    moic: float | None
    implied_dpo: float | None
    bid_mwvx: float | None
    f12_p12: float | None
    ytm_irr: float | None
    ytm_xirr: float | None
    sell_ytm: float | None
    optimal: list = field(default_factory=list)   # per exit month 1..60 dicts
    min_hurdle_month: dict = field(default_factory=dict)

def rate_pull(L: Loan) -> float:
    return {"User Enter": L.user_rate, "Default": L.default_rate}.get(L.rate_sel, L.rate)

def payment_pull(L: Loan, mr: float) -> float:
    s = L.pmt_sel
    if s == "User PMT":
        return L.user_pmt
    if s == "Interest PMT":
        return L.upb * mr
    if s == "Term PMT":
        if L.term_months <= 0:
            return 0.0
        return PMT(mr, L.term_months, -L.upb) if mr != 0 else L.upb / L.term_months
    if s == "% of M Trail PMT":
        base = {"3M": L.t3 / 3, "6M": L.t6 / 6}.get(L.m_trail, L.t12 / 12)
        return L.trail_pct * base
    return L.pmt

def months_to_maturity(C: Context, L: Loan) -> int:
    """Sheet MTM (row 11): DATEDIF(CF start, maturity, 'M') — may be negative."""
    if L.maturity is None:
        return 0
    a, b = C.cf_start, L.maturity
    sign = 1
    if b < a:
        a, b, sign = b, a, -1
    m = (b.year - a.year) * 12 + (b.month - a.month)
    if b.day < a.day:
        m -= 1
    return sign * m

def months_to_amortize(L: Loan, mr: float, pm: float) -> int | None:
    """Sheet MTA (row 12): ROUNDDOWN(NPER(Rate/12, PMT, -UPB), 0) on the CONTRACTUAL rate and payment
    (the mr/pm arguments are accepted for signature compatibility; YTM_USE_PULLS=False semantics)."""
    try:
        n = NPER(L.rate / 12, L.pmt, -L.upb)
        return min(int(math.floor(n)), 360) if n >= 0 else 0
    except (ValueError, ZeroDivisionError):
        return None

def exit_pull(C: Context, L: Loan, mr: float, pm: float, mtm: int, mta: int | None) -> float:
    """Direct port of the C42 LET formula."""
    y = C.yield_target / 12
    exit_m, start_m = L.exit_m, L.start_m
    accrued_adj = L.interest if L.add_accrued == "Yes" else 0.0
    if L.add_back == "Yes, Initial Only":
        exp_adj = L.legal_init
    elif L.add_back == "Yes, Both":
        exp_adj = L.legal_init + (min(exit_m, L.legal_end) - L.legal_start) * L.hold_cost
    else:
        exp_adj = 0.0
    fv_at_exit = FV(mr, exit_m - start_m + 1, pm, -L.upb) + pm
    mat_mo = min(mtm, mta if mta is not None else mtm)
    xt = L.exit_type
    if xt == "PIF":
        bid = fv_at_exit + accrued_adj
    elif xt.lower() == "user enter":
        bid = L.user_exit
    elif xt == "DPO":
        bid = fv_at_exit * (1 - L.dpo_pct)
    elif xt == "YTM Sell Solve":
        if mat_mo > exit_m:
            bid = -PV(L.ytm_tgt / 12, mat_mo - exit_m, pm, FV(mr, mat_mo, pm, -L.upb))
        else:
            bid = fv_at_exit + accrued_adj          # past maturity: fall back to PIF (CONFIRM item)
    elif xt == "Value Cap":
        bid = C.rel_collateral * L.val_cap_pct
    elif xt.lower() == "liquidation":
        lm = L.liq_acr_m if L.liq_acr_m >= 1 else exit_m
        bid = FV(mr, lm, 0, -L.upb) + accrued_adj
    elif xt == "IRR Solve":
        ytm_rate = L.ytm_tgt / 12
        mtm_ytm = max(max(0, DAYS360(C.cutoff, L.maturity) / 30), 1) if L.maturity else 1
        try:
            nper_full = NPER(mr, -pm, L.upb)
        except ValueError:
            nper_full = 360
        ytm_m = min(math.floor(min(nper_full, mtm_ytm)), 360)
        ytm_bal = -FV(mr, ytm_m, -pm, L.upb)
        tbid = PV(ytm_rate, ytm_m, -pm, -ytm_bal)
        pv_pmts = PV(y, exit_m - start_m, -pm) / (1 + y) ** (start_m - 1)
        pv_legal = L.legal_init / (1 + y) ** L.legal_start        # sheet: legalCost/(1+y)^legalStart (=legalCost when start 0)
        hn = min(L.legal_end, exit_m - 1) - L.legal_start
        pv_hold = PV(y, hn, -L.hold_cost) / (1 + y) ** L.legal_start if hn > 0 else 0.0
        bid = (tbid - pv_pmts + (pv_legal + pv_hold)) * (1 + y) ** exit_m - exp_adj
    else:
        bid = fv_at_exit + accrued_adj
    return bid + exp_adj

def cash_flows(L: Loan, pm: float, xv: float, exit_m: int | None = None):
    """Rows 126 (income) / 188 (expense) / 64 (net), months 1..60."""
    exit_m = L.exit_m if exit_m is None else exit_m
    net = []
    for t in range(1, 61):
        inc = pm if (L.start_m <= t < exit_m) else 0.0
        if t == exit_m:
            inc = xv
        exp = 0.0
        if L.legal_start and t == L.legal_start:
            exp = L.legal_init
        elif L.legal_start and (L.legal_start < t <= L.legal_end and t <= exit_m):
            exp = L.hold_cost
        net.append(inc - exp)
    return net

def ytm_contractual(C: Context, L: Loan, bid: float):
    """YTM sheet: hold-to-contract stream at contractual PMT/rate, given Bid."""
    if bid <= 0 or L.maturity is None:
        return None, None
    mtm_y = max(0.0, DAYS360(C.cutoff, L.maturity) / 30)
    try:
        mfta = NPER(L.rate / 12, -L.pmt, L.upb)
    except ValueError:
        mfta = float("inf")
    baseline = max(mtm_y, C.ytm_floor_months)
    use_mtm = int(min(math.floor(mfta) if mfta < baseline else math.floor(baseline), 360))
    if use_mtm < 1:
        return None, None
    bal = -FV(L.rate / 12, use_mtm, -L.pmt, L.upb)
    flows = [-bid] + [L.pmt + (bal if t == use_mtm else 0.0) for t in range(1, use_mtm + 1)]
    dates = [EDATE(C.cutoff, t) for t in range(0, use_mtm + 1)]
    try:
        irr = IRR(flows) * 12
    except ValueError:
        irr = None
    try:
        xirr = XIRR(flows, dates)
    except ValueError:
        xirr = None
    return irr, xirr

def evaluate(C: Context, L: Loan, with_optimal: bool = True) -> Result:
    mr = rate_pull(L) / 12
    pm = payment_pull(L, mr)
    mtm = months_to_maturity(C, L)
    mta = months_to_amortize(L, mr, pm)
    xv = exit_pull(C, L, mr, pm, mtm, mta)
    net = cash_flows(L, pm, xv)
    y = C.yield_target / 12
    bid = NPV(y, net)
    s12 = sum(net[:12]); s_all = sum(net)
    fv_at_exit = FV(mr, L.exit_m - L.start_m + 1, pm, -L.upb) + pm
    ip = L.upb * L.rate / 12
    ytm_irr, ytm_xirr = ytm_contractual(C, L, bid)
    try:
        sell = IRR([-bid] + net) * 12 if bid > 0 else None
    except ValueError:
        sell = None
    optimal = []
    mhm = {}
    if with_optimal:
        for m in range(1, 61):
            Lm = Loan(**{**L.__dict__, "exit_m": m})
            xvm = exit_pull(C, Lm, mr, pm, mtm, mta)
            netm = cash_flows(Lm, pm, xvm, m)
            bidm = NPV(y, netm)
            fvm = FV(mr, m - L.start_m + 1, pm, -L.upb) + pm
            row = {"month": m, "bid": bidm, "bid_pct": bidm / L.upb if L.upb else None,
                   "implied_dpo": 1 - xvm / fvm if fvm else None,
                   "cy12": sum(netm[:12]) / bidm if bidm else None,
                   "moic": sum(netm) / bidm if bidm else None}
            yi, _ = ytm_contractual(C, L, bidm)
            row["ytm_irr"] = yi
            optimal.append(row)
        def first(pred):
            for r in optimal:
                try:
                    if pred(r):
                        return r["month"]
                except TypeError:
                    pass
            return None
        mhm = {"ytm": first(lambda r: r["ytm_irr"] is not None and r["ytm_irr"] >= C.hurdle_ytm),
               "cy12": first(lambda r: r["cy12"] is not None and r["cy12"] >= C.hurdle_cy12),
               "moic": first(lambda r: r["moic"] is not None and r["moic"] >= C.hurdle_moic)}
    return Result(
        mai=(L.interest / ip) if ip else None, mtm=mtm, mta=mta if mta is not None else 360,
        pmt_pull=pm, rate_pull=mr * 12, exit_pull=xv, net=net, bid=bid,
        bid_pct=bid / L.upb if L.upb else None, cy12=s12 / bid if bid else None,
        moic=s_all / bid if bid else None, implied_dpo=1 - xv / fv_at_exit if fv_at_exit else None,
        bid_mwvx=bid / C.rel_collateral if C.rel_collateral else None,
        f12_p12=s12 / L.t12 if L.t12 else None, ytm_irr=ytm_irr, ytm_xirr=ytm_xirr, sell_ytm=sell,
        optimal=optimal, min_hurdle_month=mhm)

# ---------------------------------------------------------------- self-test
def _selftest():
    # 1. primitives vs known Excel values
    assert abs(PMT(0.05 / 12, 360, -300000) - 1610.4648690364193) < 1e-6      # Excel PMT
    assert abs(FV(0.05 / 12, 12, -100, -1000) - 2279.0474470) < 1e-6            # Excel FV
    assert abs(NPV(0.1, [-10000, 3000, 4200, 6800]) - 1188.44) < 0.01          # Excel doc example
    assert abs(IRR([-70000, 12000, 15000, 18000, 21000, 26000]) - 0.0866) < 1e-4  # Excel doc example
    assert abs(NPER(0.12 / 12, -100, 1000) - 10.5886444594) < 1e-6             # Excel NPER
    x = XIRR([-10000, 2750, 4250, 3250, 2750],
             [date(2008, 1, 1), date(2008, 3, 1), date(2008, 10, 30), date(2009, 2, 15), date(2009, 4, 1)])
    assert abs(x - 0.373362535) < 1e-6                                          # Excel doc example
    assert DAYS360(date(2011, 1, 30), date(2011, 2, 1)) == 1
    # 2. model identities
    C = Context(yield_target=0.15, cf_start=date(2026, 7, 31), cutoff=date(2026, 7, 20),
                rel_collateral=2_500_000)
    L = Loan("000005100324610", upb=1_000_000, interest=40_000, rate=0.0725, default_rate=0.1225,
             maturity=date(2031, 6, 1), pmt=7_500, t3=22_000, t6=44_000, t12=88_000,
             exit_type="PIF", exit_m=24)
    R = evaluate(C, L)
    # Sell YTM must equal the target yield when Bid = NPV at that yield (by construction)
    assert abs(R.sell_ytm - 0.15) < 1e-6, R.sell_ytm
    # PIF exit = remaining balance + final payment; implied DPO must be 0
    assert abs(R.implied_dpo) < 1e-9
    # cash-flow timing: 23 payments (months 1..23) then exit at 24, nothing after
    assert R.net[0] == 7_500 and R.net[22] == 7_500 and R.net[23] == R.exit_pull and R.net[24] == 0
    # DPO at 25% lowers bid vs PIF
    R2 = evaluate(C, Loan(**{**L.__dict__, "exit_type": "DPO", "dpo_pct": 0.25}), with_optimal=False)
    assert R2.bid < R.bid and abs(R2.implied_dpo - 0.25) < 1e-9
    # legal timing: initial at month 3, holding months 4..min(9, exit)
    R3 = evaluate(C, Loan(**{**L.__dict__, "legal_init": 10_000, "legal_start": 3, "hold_cost": 500,
                            "legal_end": 9}), with_optimal=False)
    assert R3.net[2] == 7_500 - 10_000 and R3.net[3] == 7_000 and R3.net[8] == 7_000 and R3.net[9] == 7_500
    # YTM on contractual hold at the modeled bid is finite and sensible
    assert R.ytm_irr is not None and 0 < R.ytm_irr < 1 and abs(R.ytm_xirr - R.ytm_irr) < 0.02
    # optimal analysis: 60 rows, bid at month 24 equals the modeled bid
    assert len(R.optimal) == 60 and abs(R.optimal[23]["bid"] - R.bid) < 1e-6
    print("self-test OK")
    print(f"  example: pmt_pull={R.pmt_pull:,.2f} exit_pull={R.exit_pull:,.2f} bid={R.bid:,.2f} "
          f"bid%={R.bid_pct:.4f} cy12={R.cy12:.4f} moic={R.moic:.4f} ytm_irr={R.ytm_irr:.4f} "
          f"ytm_xirr={R.ytm_xirr:.4f} sell={R.sell_ytm:.4f} mtm={R.mtm} mta={R.mta} hurdles={R.min_hurdle_month}")

if __name__ == "__main__":
    _selftest()
