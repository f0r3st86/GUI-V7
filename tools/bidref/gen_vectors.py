"""
gen_vectors.py — builds the golden test vectors for the Relationship Projection v2 engine
from the Python reference (scripts/bid_engine_ref.py) and generates access/modBR_Vectors.bas.

    python3 tools/bidref/gen_vectors.py

Outputs: tools/bidref/vectors.csv and access/modBR_Vectors.bas (never hand-edit the .bas).
BR_CaseInputs(c) returns a flat array of "name|value" strings; BR_CaseExpected(c) returns a flat
array of "field|expected|tol" strings (expected blank = must be n/a). Dates are ISO yyyy-mm-dd.
"""
from __future__ import annotations
import csv, os, random, sys
from datetime import date
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts"))
import bid_engine_ref as R  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
BASE_CUTOFF = date(2026, 7, 1)
BASE_ANCHOR = date(2026, 7, 31)

def base_loan(**kw):
    d = dict(loan_no="000005100324610", upb=1_000_000.0, interest=40_000.0, rate=0.0725, default_rate=0.1225,
             maturity=date(2031, 6, 1), pmt=7_500.0, t3=22_000.0, t6=44_000.0, t12=88_000.0, exit_type="PIF", exit_m=24)
    d.update(kw)
    return R.Loan(**d)

def base_ctx(**kw):
    d = dict(yield_target=0.15, cf_start=BASE_CUTOFF, cutoff=BASE_CUTOFF, rel_collateral=2_500_000.0)
    d.update(kw)
    return R.Context(**d)

CASES = []
def add(cid, L, C=None):
    CASES.append((cid, L, C or base_ctx()))

# --- hand-designed groups (DESIGN §8.4) ---
add("BASE-PIF", base_loan())
for xt in ["User Enter", "DPO", "YTM Sell Solve", "Value Cap", "Liquidation", "IRR Solve"]:
    add(f"EXIT-{xt.replace(' ', '')}-24", base_loan(exit_type=xt, user_exit=750_000, dpo_pct=0.25, val_cap_pct=0.6,
                                                    ytm_tgt=0.12, liq_acr_m=18))
for m in (1, 12, 60):
    add(f"EXIT-PIF-{m}", base_loan(exit_m=m, start_m=1))
    add(f"EXIT-DPO-{m}", base_loan(exit_type="DPO", dpo_pct=0.3, exit_m=m))
add("EXIT-START6-EXIT24", base_loan(start_m=6))
add("EXIT-USERENTER-0", base_loan(exit_type="User Enter", user_exit=0))
add("EXIT-ACCRUED-YES", base_loan(add_accrued="Yes"))
add("EXIT-LIQ-NOACR", base_loan(exit_type="Liquidation", liq_acr_m=0))
add("EXIT-YTMSELL-PASTMAT", base_loan(exit_type="YTM Sell Solve", ytm_tgt=0.12, exit_m=60, maturity=date(2027, 1, 1)))
# payment / rate pulls
add("PMT-USER", base_loan(pmt_sel="User PMT", user_pmt=9_000))
add("PMT-INTEREST", base_loan(pmt_sel="Interest PMT"))
add("PMT-TERM", base_loan(pmt_sel="Term PMT", term_months=120))
add("PMT-TERM-RATE0", base_loan(pmt_sel="Term PMT", term_months=120, rate_sel="User Enter", user_rate=0.0))
add("PMT-TRAIL-3M", base_loan(pmt_sel="% of M Trail PMT", m_trail="3M", trail_pct=0.9))
add("PMT-TRAIL-12M", base_loan(pmt_sel="% of M Trail PMT", m_trail="12M", trail_pct=1.1))
add("RATE-DEFAULT", base_loan(rate_sel="Default"))
add("RATE-USER", base_loan(rate_sel="User Enter", user_rate=0.09))
# legal
add("LEGAL-INIT-ONLY", base_loan(legal_init=10_000, legal_start=3, hold_cost=500, legal_end=9, add_back="No"))
add("LEGAL-ADDBACK-INITIAL", base_loan(legal_init=10_000, legal_start=3, hold_cost=500, legal_end=9, add_back="Yes, Initial Only"))
add("LEGAL-ADDBACK-BOTH", base_loan(legal_init=10_000, legal_start=3, hold_cost=500, legal_end=9, add_back="Yes, Both"))
add("LEGAL-START0", base_loan(legal_init=10_000, legal_start=0, hold_cost=500, legal_end=9))
add("LEGAL-START-AFTER-EXIT", base_loan(legal_init=10_000, legal_start=30, hold_cost=500, legal_end=40, exit_m=24))
add("LEGAL-END-BEFORE-START", base_loan(legal_init=10_000, legal_start=9, hold_cost=500, legal_end=3, add_back="Yes, Both"))
add("LEGAL-IRRSOLVE", base_loan(exit_type="IRR Solve", ytm_tgt=0.12, legal_init=10_000, legal_start=3, hold_cost=500, legal_end=9, add_back="Yes, Both"))
# YTM / dates
add("D360-FEB28", base_loan(maturity=date(2028, 2, 28)), base_ctx(cutoff=date(2026, 2, 28), cf_start=date(2026, 2, 28)))
add("D360-JAN30-FEB28", base_loan(maturity=date(2027, 2, 28)), base_ctx(cutoff=date(2026, 1, 30), cf_start=date(2026, 1, 30)))
add("D360-MAT-BEFORE-CUTOFF", base_loan(maturity=date(2025, 1, 1)))
add("DATEDIF-DAYROLL", base_loan(maturity=date(2031, 6, 15)), base_ctx(cutoff=date(2026, 7, 20), cf_start=date(2026, 7, 20)))
add("YTM-J2-FLOOR", base_loan(maturity=date(2027, 3, 1)), base_ctx(ytm_floor_months=24))
add("NPER-PMT-LT-INTEREST", base_loan(pmt=5_000))       # 5000 < 6041.67 interest -> MTA n/a (360), MFTA n/a
add("NPER-BIG", base_loan(pmt=6_100))
add("OVERRIDE-NONE", base_loan())
# hurdles
add("OPT-HURDLE-HIGH", base_loan(), base_ctx(hurdle_ytm=0.5, hurdle_cy12=0.9, hurdle_moic=5))
add("OPT-HURDLE-LOW", base_loan(), base_ctx(hurdle_ytm=0.0, hurdle_cy12=0.0, hurdle_moic=0.0))
# trail / collateral edges
add("TRAIL-ZERO", base_loan(t3=0, t6=0, t12=0))
add("REL-NOCOLL", base_loan(), base_ctx(rel_collateral=0))
add("REL-LOAN-HYPHEN", base_loan(loan_no="815102-810"))
add("REL-TINY", base_loan(upb=25_000, interest=900, pmt=350, t3=1_050, t6=2_100, t12=4_200))

# --- seeded random cases ---
rng = random.Random(20260901)
EXITS = ["PIF", "User Enter", "DPO", "YTM Sell Solve", "Value Cap", "Liquidation", "IRR Solve"]
PMTS = ["Current PMT", "User PMT", "Interest PMT", "Term PMT", "% of M Trail PMT"]
RATES = ["Contractual", "User Enter", "Default"]
ADDB = ["No", "Yes, Initial Only", "Yes, Both"]
for n in range(60):
    upb = rng.choice([50_000, 250_000, 1_000_000, 3_500_000]) * rng.uniform(0.6, 1.4)
    rate = rng.uniform(0.04, 0.14)
    pmt = upb * rate / 12 * rng.uniform(0.9, 1.6)
    exit_m = rng.randint(1, 60)
    ls = rng.choice([0, 0, rng.randint(1, 12)])
    L = base_loan(upb=round(upb, 2), interest=round(upb * rng.uniform(0, 0.06), 2), rate=round(rate, 5),
                  default_rate=round(rate + 0.05, 5), pmt=round(pmt, 2),
                  maturity=date(2027 + rng.randint(0, 8), rng.randint(1, 12), rng.randint(1, 28)),
                  t3=round(pmt * rng.uniform(0, 3), 2), t6=round(pmt * rng.uniform(0, 6), 2), t12=round(pmt * rng.uniform(0, 12), 2),
                  pmt_sel=rng.choice(PMTS), user_pmt=round(pmt * rng.uniform(0.5, 1.5), 2), term_months=rng.choice([0, 60, 120, 240]),
                  m_trail=rng.choice(["3M", "6M", "12M"]), trail_pct=round(rng.uniform(0.5, 1.2), 3),
                  rate_sel=rng.choice(RATES), user_rate=round(rng.uniform(0.03, 0.15), 4),
                  legal_init=rng.choice([0, 5_000, 25_000]), legal_start=ls, hold_cost=rng.choice([0, 250, 1_000]),
                  legal_end=ls + rng.randint(0, 24) if ls else 0, add_back=rng.choice(ADDB),
                  exit_type=rng.choice(EXITS), dpo_pct=round(rng.uniform(0, 0.5), 3), user_exit=round(upb * rng.uniform(0.3, 1.1), 2),
                  val_cap_pct=round(rng.uniform(0.3, 1.0), 3), ytm_tgt=round(rng.uniform(0.08, 0.2), 4),
                  add_accrued=rng.choice(["Yes", "No"]), liq_acr_m=rng.choice([0, 6, 18]),
                  start_m=rng.randint(1, min(exit_m, 6)), exit_m=exit_m)
    C = base_ctx(yield_target=round(rng.uniform(0.08, 0.25), 4), rel_collateral=round(upb * rng.uniform(0, 2.5), 2))
    add(f"RND-{n:03d}", L, C)

# --- evaluate ---
FIELDS = ["PmtPull", "ExitVal", "BidNPV", "BidPct", "CY12", "MOIC", "ImpDPO", "BidMwVx", "F12P12", "MTM", "MTA",
          "UseMTM", "BalAtExit", "YtmIRR", "YtmXIRR", "SellYTM", "MinHYTM", "MinHCY", "MinHMOIC", "MinHAll"]
NET_SAMPLE = [1, 2, 12, 23, 24, 25, 36, 60]
OPT_SAMPLE = [6, 12, 24, 36, 60]

def tol_for(field, v):
    if field in ("MTM", "MTA", "UseMTM", "MinHYTM", "MinHCY", "MinHMOIC", "MinHAll"):
        return 0
    if field in ("YtmIRR", "YtmXIRR", "SellYTM"):
        return 1e-6
    if field in ("BidPct", "CY12", "MOIC", "ImpDPO", "BidMwVx", "F12P12"):
        return 1e-9 * max(1.0, abs(v or 0))
    return 0.005

def ytm_hold(C, L, bid):
    """UseMTM / BalAtExit per the YTM sheet (mirrors bid_engine_ref.ytm_contractual)."""
    if L.maturity is None:
        return 0, 0.0
    mtm_y = max(0.0, R.DAYS360(C.cutoff, L.maturity) / 30)
    try:
        mfta = R.NPER(L.rate / 12, -L.pmt, L.upb)
    except ValueError:
        mfta = float("inf")
    baseline = max(mtm_y, C.ytm_floor_months)
    use = int(min(R.math.floor(mfta) if mfta < baseline else R.math.floor(baseline), 360))
    bal = -R.FV(L.rate / 12, use, -L.pmt, L.upb) if use >= 1 else 0.0
    return use, bal

rows = []       # (case, field, expected or None, tol)
inputs_by_case = {}
for cid, L, C in CASES:
    res = R.evaluate(C, L)
    use, bal = ytm_hold(C, L, res.bid)
    exp = {
        "PmtPull": res.pmt_pull, "ExitVal": res.exit_pull, "BidNPV": res.bid, "BidPct": res.bid_pct,
        "CY12": res.cy12, "MOIC": res.moic, "ImpDPO": res.implied_dpo, "BidMwVx": res.bid_mwvx, "F12P12": res.f12_p12,
        "MTM": res.mtm, "MTA": res.mta, "UseMTM": use, "BalAtExit": bal if use >= 1 else None,
        "YtmIRR": res.ytm_irr, "YtmXIRR": res.ytm_xirr, "SellYTM": res.sell_ytm,
        "MinHYTM": res.min_hurdle_month["ytm"], "MinHCY": res.min_hurdle_month["cy12"],
        "MinHMOIC": res.min_hurdle_month["moic"],
        "MinHAll": next((r["month"] for r in res.optimal
                         if r["ytm_irr"] is not None and r["ytm_irr"] >= C.hurdle_ytm and r["cy12"] is not None
                         and r["cy12"] >= C.hurdle_cy12 and r["moic"] is not None and r["moic"] >= C.hurdle_moic), None),
    }
    for f in FIELDS:
        rows.append((cid, f, exp[f], tol_for(f, exp[f])))
    for t in NET_SAMPLE:
        rows.append((cid, f"Net{t:02d}", res.net[t - 1], 0.005))
    for m in OPT_SAMPLE:
        rows.append((cid, f"Opt{m:02d}_Bid", res.optimal[m - 1]["bid"], 0.005))
    inputs_by_case[cid] = [
        ("LoanNo", L.loan_no), ("UPB", L.upb), ("IntBal", L.interest), ("CRate", L.rate), ("DRate", L.default_rate),
        ("CPmt", L.pmt), ("MatDt", L.maturity.isoformat() if L.maturity else ""), ("T3", L.t3), ("T6", L.t6),
        ("T12", L.t12), ("T24", L.t12 * 2), ("PmtSel", L.pmt_sel), ("UserPmt", L.user_pmt), ("TermMonths", L.term_months),
        ("MTrailSel", L.m_trail), ("TrailPct", L.trail_pct), ("RateSel", L.rate_sel), ("UserRate", L.user_rate),
        ("LegalInit", L.legal_init), ("LegalStartM", L.legal_start), ("HoldCost", L.hold_cost), ("LegalEndM", L.legal_end),
        ("AddBack", L.add_back), ("ExitType", L.exit_type), ("DPOPct", L.dpo_pct), ("UserExit", L.user_exit),
        ("ValCapPct", L.val_cap_pct), ("YTMTgt", L.ytm_tgt), ("AddAccrued", L.add_accrued), ("LiqAcrM", L.liq_acr_m),
        ("StartMonth", L.start_m), ("ExitMonth", L.exit_m), ("BidOverride", ""),
        ("Yield", C.yield_target), ("CutoffDt", C.cutoff.isoformat()), ("AnchorDt", BASE_ANCHOR.isoformat()),
        ("MinMonthsJ2", C.ytm_floor_months), ("HurdleYTM", C.hurdle_ytm), ("HurdleCY", C.hurdle_cy12),
        ("HurdleMOIC", C.hurdle_moic), ("RelColl", C.rel_collateral),
    ]

# --- write csv ---
os.makedirs(os.path.join(ROOT, "tools", "bidref"), exist_ok=True)
with open(os.path.join(ROOT, "tools", "bidref", "vectors.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["case_id", "field", "expected", "tol"])
    for cid, f, v, tol in rows:
        w.writerow([cid, f, "" if v is None else repr(float(v)), repr(float(tol))])

# --- write VBA ---
def vnum(v):
    if isinstance(v, float):
        return repr(v)
    return str(v)

def emit_str_chunks(varname, items, sep=";"):
    """Emit `s = ""` then `s = s & "..."` lines, each under 400 chars."""
    out = [f"    {varname} = \"\""]
    cur = ""
    for it in items:
        piece = (sep if cur or out[-1] != f"    {varname} = \"\"" and cur == "" and False else "") + it
        piece = it if cur == "" else sep + it
        if len(cur) + len(piece) > 380:
            out.append(f"    {varname} = {varname} & \"{cur}\"")
            cur = it
        else:
            cur += piece
    if cur:
        out.append(f"    {varname} = {varname} & \"{cur}\"")
    return out

lines = ['Attribute VB_Name = "modBR_Vectors"', "Option Compare Database", "Option Explicit", "",
         "' GENERATED by tools/bidref/gen_vectors.py - do not edit. Golden vectors from scripts/bid_engine_ref.py.",
         "' BR_CaseInputs -> flat array of \"name|value\" strings; BR_CaseExpected -> \"field|expected|tol\" (blank expected = n/a).",
         "", "Public Function BR_CaseCount() As Long", f"    BR_CaseCount = {len(CASES)}", "End Function", "",
         "Public Function BR_CaseId(c As Long) As String", "    Select Case c"]
for i, (cid, _, _) in enumerate(CASES, start=1):
    lines.append(f"        Case {i}: BR_CaseId = \"{cid}\"")
lines += ["        Case Else: BR_CaseId = \"\"", "    End Select", "End Function", "",
          "Public Function BR_CaseInputs(c As Long) As Variant", "    Dim s As String", "    Select Case c"]
for i, (cid, _, _) in enumerate(CASES, start=1):
    items = [f"{n}|{vnum(v)}" for n, v in inputs_by_case[cid]]
    lines.append(f"        Case {i}")
    lines += ["    " + l for l in emit_str_chunks("s", items)]
lines += ["    End Select", "    BR_CaseInputs = Split(s, \";\")", "End Function", "",
          "Public Function BR_CaseExpected(c As Long) As Variant", "    Dim s As String", "    Select Case c"]
by_case = {}
for cid, f, v, tol in rows:
    by_case.setdefault(cid, []).append(f"{f}|{'' if v is None else repr(float(v))}|{repr(float(tol))}")
for i, (cid, _, _) in enumerate(CASES, start=1):
    lines.append(f"        Case {i}")
    lines += ["    " + l for l in emit_str_chunks("s", by_case[cid])]
lines += ["    End Select", "    BR_CaseExpected = Split(s, \";\")", "End Function", ""]
open(os.path.join(ROOT, "access", "modBR_Vectors.bas"), "w").write("\n".join(lines))
print(f"cases: {len(CASES)}  rows: {len(rows)}  longest VBA line: {max(len(l) for l in lines)}")
