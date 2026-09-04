# rows.R - the Relationship Projection sheet's row order (top to bottom), one row per category.
# kind: g = data from the tape (white), c = computed (grey/white), r = result (green), y = numeric input (yellow),
#       Y = choice input (yellow dropdown), t = Trail Selection display (shared choice), s = section header.
# fmt: money | pct | pct2 | num0 | num1 | num2 | date | text

ROW_DEFS <- data.frame(stringsAsFactors = FALSE, matrix(ncol = 4, byrow = TRUE, dimnames = list(NULL, c("key", "caption", "kind", "fmt")), c(
  "UPB",        "UPB",                      "g", "money",
  "IntBal",     "Interest",                 "g", "money",
  "MAI",        "MAI",                      "c", "num1",
  "CRate",      "Rate",                     "g", "pct2",
  "DRate",      "Default Rate",             "g", "pct2",
  "MatDt",      "Maturity",                 "g", "date",
  "CPmt",       "PMT",                      "g", "money",
  "MTM",        "MTM",                      "c", "num0",
  "MTA",        "MTA",                      "c", "num0",
  "RelColl",    "Rel Collateral",           "c", "money",
  "T3",         "3M Trail",                 "c", "money",
  "T6",         "6M Trail",                 "c", "money",
  "T12",        "12M Trail",                "c", "money",
  "TrailDisp",  "Trail Selection",          "t", "text",
  "PmtSel",     "Payment Selection",        "Y", "text",
  "PmtPull",    "Payment Pull",             "c", "money",
  "IntPmt",     "Interest Payment",         "c", "money",
  "UserPmt",    "User PMT",                 "y", "money",
  "TermPmt",    "Term PMT",                 "c", "money",
  "TermMonths", "Term Months",              "y", "num0",
  "PctTrail",   "% X Trail PMT",            "c", "money",
  "MTrailSel",  "M Trail",                  "Y", "text",
  "TrailPct",   "Trail %",                  "y", "pct2",
  "RateSel",    "Rate Selection",           "Y", "text",
  "RatePull",   "Rate Pull",                "c", "pct2",
  "UserRate",   "User Rate",                "y", "pct2",
  "LegalHdr",   "Legal",                    "s", "text",
  "LegalInit",  "Initial Legal $",          "y", "money",
  "LegalStartM","Initial Start M",          "y", "num0",
  "HoldCost",   "Holding Cost $",           "y", "money",
  "LegalEndM",  "Legal End M",              "y", "num0",
  "AddBack",    "Add Back to Exit",         "Y", "text",
  "ExitType",   "Exit Type",                "Y", "text",
  "ExitVal",    "Exit Pull",                "r", "money",
  "DPOPct",     "DPO %",                    "y", "pct2",
  "UserExit",   "User Enter",               "y", "money",
  "ValCapPct",  "Value Cap",                "y", "pct2",
  "YTMTgt",     "YTM Target %",             "y", "pct2",
  "AddAccrued", "Add Current Accrued",      "Y", "text",
  "LiqAcrM",    "LQDN Forward Acr M",       "y", "num0",
  "ImpDPO",     "Implied DPO",              "r", "pct",
  "StartMonth", "Start Month",              "y", "num0",
  "ExitMonth",  "Exit Month",               "y", "num0",
  "BidPct",     "Bid %",                    "r", "pct",
  "BidNPV",     "Bid",                      "r", "money",
  "CY12",       "12M CY",                   "r", "pct",
  "MOIC",       "MOIC",                     "r", "num2",
  "BidMwVx",    "Bid/MwVx",                 "r", "pct",
  "F12P12",     "F12/P12 PMT",              "r", "num2",
  "YtmHdr",     "YTM (contractual hold)",   "s", "text",
  "UseMTM",     "Use MTM",                  "c", "num0",
  "BalAtExit",  "Bal at Exit",              "c", "money",
  "YtmIRR",     "YTM (IRR)",                "r", "pct2",
  "YtmXIRR",    "YTM (XIRR)",               "r", "pct2",
  "BidOverride","Bid Override",             "y", "money",
  "SellYTM",    "Sell YTM",                 "r", "pct2",
  "HurdleHdr",  "Hurdles",                  "s", "text",
  "MinHYTM",    "Min Hurdle Month (YTM)",   "r", "num0",
  "MinHCY",     "Min Hurdle Month (12M CY)","r", "num0",
  "MinHMOIC",   "Min Hurdle Month (MOIC)",  "r", "num0",
  "MinHAll",    "Min Hurdle Month (All)",   "r", "num0"
)))

# Rows the Relationship column shows (others blank)
REL_COL_KEYS <- c("UPB", "IntBal", "MAI", "CRate", "CPmt", "MTM", "MTA", "RelColl", "T3", "T6", "T12", "PmtPull", "IntPmt",
                  "ExitVal", "ImpDPO", "BidPct", "BidNPV", "CY12", "MOIC", "BidMwVx", "F12P12", "UseMTM", "BalAtExit",
                  "YtmIRR", "YtmXIRR", "SellYTM", "MinHYTM", "MinHCY", "MinHMOIC", "MinHAll")

# ---------------------------------------------------------------- formatting (display strings)
fmt_value <- function(v, fmt) {
  if (is.null(v) || length(v) == 0 || (length(v) == 1 && is.na(v))) return("\u2014")
  switch(fmt,
    money = { s <- formatC(abs(v), format = "f", digits = 0, big.mark = ","); if (v < 0) paste0("($", s, ")") else paste0("$", s) },
    pct   = sprintf("%.1f%%", v * 100),
    pct2  = sprintf("%.2f%%", v * 100),
    num0  = formatC(v, format = "f", digits = 0, big.mark = ","),
    num1  = sprintf("%.1f", v),
    num2  = sprintf("%.2f", v),
    date  = if (inherits(v, "Date")) format(v, "%m/%d/%y") else "\u2014",
    as.character(v))
}

# Value of a sheet row for a calculated loan (or the totals list); NA when not applicable
row_value <- function(L, key, C, is_total = FALSE) {
  if (is_total && !(key %in% REL_COL_KEYS)) return(NA)
  switch(key,
    RelColl = C$RelColl,
    TrailDisp = C$TrailDisp,
    T3 = trail_display(L$T3, 3, C$TrailDisp, L$CPmt, L$IntPmt),
    T6 = trail_display(L$T6, 6, C$TrailDisp, L$CPmt, L$IntPmt),
    T12 = trail_display(L$T12, 12, C$TrailDisp, L$CPmt, L$IntPmt),
    MTA = if (isTRUE(L$MTAok) || is_total) L$MTA else NA,
    UseMTM = if (L$UseMTM >= 1) L$UseMTM else NA,
    LegalHdr = , YtmHdr = , HurdleHdr = NA,
    { v <- L[[key]]; if (is.null(v)) NA else v })
}

# Format override: trail rows change with Trail Selection
row_fmt <- function(key, fmt, C) {
  if (key %in% c("T3", "T6", "T12")) {
    return(switch(C$TrailDisp, "% of Contractual" = , "% of Int PMT" = "pct", "# of PMT's Made" = , "# of Int Pmt's Made" = "num1", "money"))
  }
  fmt
}
