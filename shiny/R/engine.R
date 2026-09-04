# engine.R - Relationship Projection model in R.
#
# Direct port of scripts/bid_engine_ref.py (the oracle) plus the relationship-level
# totals / optimal table from access/modBR_Engine.bas. Pure base R, no packages.
# Any change here must keep tests/test_engine.R green against tools/bidref/vectors.csv.
#
# Conventions: rates are annual decimal fractions; months are integers 1..60; dates are Date.

# ---------------------------------------------------------------- Excel financial primitives
fv_x <- function(rate, nper, pmt, pv = 0, type = 0) {
  if (rate == 0) return(-(pv + pmt * nper))
  f <- (1 + rate)^nper
  -(pv * f + pmt * (1 + rate * type) * (f - 1) / rate)
}

pv_x <- function(rate, nper, pmt, fv = 0, type = 0) {
  if (rate == 0) return(-(fv + pmt * nper))
  f <- (1 + rate)^nper
  -(fv + pmt * (1 + rate * type) * (f - 1) / rate) / f
}

pmt_x <- function(rate, nper, pv, fv = 0, type = 0) {
  if (rate == 0) return(-(pv + fv) / nper)
  f <- (1 + rate)^nper
  -(pv * f + fv) * rate / ((1 + rate * type) * (f - 1))
}

# Excel NPER; NA when the payment does not cover interest (Excel #NUM!)
nper_x <- function(rate, pmt, pv, fv = 0, type = 0) {
  if (rate == 0) return(-(pv + fv) / pmt)
  a <- pmt * (1 + rate * type)
  num <- a - fv * rate
  den <- a + pv * rate
  if (!is.finite(num / den) || num / den <= 0) return(NA_real_)
  log(num / den) / log(1 + rate)
}

# Excel NPV: first flow discounted ONE period
npv_x <- function(rate, flows) sum(flows / (1 + rate)^(seq_along(flows)))

# sum cf_i / (1+r)^i, i from 0 - computed in log space so the -0.8..10 bracket never overflows
npv0 <- function(rate, flows) sum(flows * exp(-(seq_along(flows) - 1) * log1p(rate)))

# Excel IRR (rate where npv0 = 0). Bracket floored at -0.8 like the oracle, then bisection.
irr_x <- function(flows, tol = 1e-10, maxit = 200) {
  if (!any(flows > 0) || !any(flows < 0)) return(NA_real_)
  lo <- -0.8; hi <- 10
  flo <- npv0(lo, flows); fhi <- npv0(hi, flows)
  if (!is.finite(flo) || !is.finite(fhi) || flo * fhi > 0) return(NA_real_)
  for (i in seq_len(maxit)) {
    mid <- (lo + hi) / 2
    fm <- npv0(mid, flows)
    if (abs(fm) < tol || (hi - lo) < 1e-12) return(mid)
    if (flo * fm < 0) { hi <- mid; fhi <- fm } else { lo <- mid; flo <- fm }
  }
  (lo + hi) / 2
}

# Excel XIRR: sum cf_i / (1+r)^((d_i - d_0)/365) = 0
xirr_x <- function(flows, dates, tol = 1e-10, maxit = 200) {
  tt <- as.numeric(dates - dates[1]) / 365
  f <- function(r) sum(flows * exp(-tt * log1p(r)))
  lo <- -0.9999; hi <- 10
  flo <- f(lo); fhi <- f(hi)
  if (!is.finite(flo) || !is.finite(fhi) || flo * fhi > 0) return(NA_real_)
  for (i in seq_len(maxit)) {
    mid <- (lo + hi) / 2
    fm <- f(mid)
    if (abs(fm) < tol || (hi - lo) < 1e-12) return(mid)
    if (flo * fm < 0) { hi <- mid; fhi <- fm } else { lo <- mid; flo <- fm }
  }
  (lo + hi) / 2
}

is_leap <- function(y) (y %% 4 == 0 & (y %% 100 != 0 | y %% 400 == 0))

# Excel DAYS360, US (NASD) method
days360_us <- function(d1, d2) {
  d1 <- as.POSIXlt(d1); d2 <- as.POSIXlt(d2)
  y1 <- d1$year + 1900; m1 <- d1$mon + 1; dd1 <- d1$mday
  y2 <- d2$year + 1900; m2 <- d2$mon + 1; dd2 <- d2$mday
  feb_last <- ifelse(is_leap(y1), 29, 28)
  if (m1 == 2 && dd1 == feb_last) dd1 <- 30
  if (dd1 == 31) dd1 <- 30
  if (dd2 == 31 && dd1 == 30) dd2 <- 30
  (y2 - y1) * 360 + (m2 - m1) * 30 + (dd2 - dd1)
}

# Excel EDATE (clamps to month end)
edate_x <- function(d, months) {
  lt <- as.POSIXlt(d)
  m0 <- lt$mon + months
  y <- lt$year + 1900 + m0 %/% 12
  m <- m0 %% 12 + 1
  last <- c(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)[m]
  if (m == 2 && is_leap(y)) last <- 29
  as.Date(sprintf("%04d-%02d-%02d", y, m, min(lt$mday, last)))
}

# Excel DATEDIF(d1, d2, "m"), day-aware; negative when d2 < d1
datedif_m <- function(d1, d2) {
  sgn <- 1
  if (d2 < d1) { tmp <- d1; d1 <- d2; d2 <- tmp; sgn <- -1 }
  a <- as.POSIXlt(d1); b <- as.POSIXlt(d2)
  m <- (b$year - a$year) * 12 + (b$mon - a$mon)
  if (b$mday < a$mday) m <- m - 1
  sgn * m
}

# Period keys (Year*100 + Month), as in tblPayHistory.pd
pd_key  <- function(d) { lt <- as.POSIXlt(d); (lt$year + 1900) * 100 + lt$mon + 1 }
pd_diff <- function(pd_hi, pd_lo) (pd_hi %/% 100 - pd_lo %/% 100) * 12 + (pd_hi %% 100 - pd_lo %% 100)
pd_add  <- function(pd, n) { y <- pd %/% 100; m <- pd %% 100 - 1 + n; y <- y + m %/% 12; m <- m %% 12; y * 100 + m + 1 }
pd_label <- function(pd) format(as.Date(sprintf("%04d-%02d-01", pd %/% 100, pd %% 100)), "%b-%y")

# ---------------------------------------------------------------- value lists (sheet dropdowns)
VALUE_LISTS <- list(
  PmtSel     = c("Current PMT", "User PMT", "Interest PMT", "Term PMT", "% of M Trail PMT"),
  MTrailSel  = c("3M", "6M", "12M"),
  RateSel    = c("Contractual", "User Enter", "Default"),
  AddBack    = c("No", "Yes, Initial Only", "Yes, Both"),
  ExitType   = c("PIF", "User Enter", "DPO", "YTM Sell Solve", "Value Cap", "Liquidation", "IRR Solve"),
  AddAccrued = c("Yes", "No"),
  TrailDisp  = c("Actual", "monthly", "yearly", "% of Contractual", "% of Int PMT", "# of PMT's Made", "# of Int Pmt's Made")
)

INPUT_KEYS <- c("PmtSel", "UserPmt", "TermMonths", "MTrailSel", "TrailPct", "RateSel", "UserRate",
                "LegalInit", "LegalStartM", "HoldCost", "LegalEndM", "AddBack", "ExitType", "DPOPct",
                "UserExit", "ValCapPct", "YTMTgt", "AddAccrued", "LiqAcrM", "StartMonth", "ExitMonth", "BidOverride")

# Sheet defaults for the yellow cells
loan_defaults <- function() list(
  PmtSel = "Current PMT", UserPmt = 0, TermMonths = 0L, MTrailSel = "12M", TrailPct = 1,
  RateSel = "Contractual", UserRate = 0, LegalInit = 0, LegalStartM = 0L, HoldCost = 0, LegalEndM = 0L,
  AddBack = "No", ExitType = "PIF", DPOPct = 0.25, UserExit = 0, ValCapPct = 1, YTMTgt = 0.15,
  AddAccrued = "No", LiqAcrM = 0L, StartMonth = 1L, ExitMonth = 24L, BidOverride = NA_real_
)

# A loan = snapshot fields + inputs. Snapshot: LoanNo, UPB, IntBal, CRate, DRate, CPmt, MatDt (Date or NA), T3, T6, T12, T24
new_loan <- function(LoanNo, UPB, IntBal = 0, CRate = 0, DRate = 0, CPmt = 0, MatDt = NA, T3 = 0, T6 = 0, T12 = 0, T24 = 0, ...) {
  L <- loan_defaults()
  L$LoanNo <- LoanNo; L$UPB <- UPB; L$IntBal <- IntBal; L$CRate <- CRate; L$DRate <- DRate; L$CPmt <- CPmt
  L$MatDt <- if (inherits(MatDt, "Date") && !is.na(MatDt)) MatDt else NA
  L$T3 <- T3; L$T6 <- T6; L$T12 <- T12; L$T24 <- T24
  extra <- list(...)
  for (nm in names(extra)) L[[nm]] <- extra[[nm]]
  L
}

# Relationship-level context (header globals)
new_ctx <- function(Yield = 0.15, CutoffDt = Sys.Date(), CfStartDt = NULL, AnchorDt = Sys.Date(), RelColl = 0,
                    MinMonthsJ2 = 0, HurdleYTM = 0.10, HurdleCY = 0.09, HurdleMOIC = 1.3, TrailDisp = "Actual") {
  list(Yield = Yield, CutoffDt = as.Date(CutoffDt), CfStartDt = as.Date(if (is.null(CfStartDt)) CutoffDt else CfStartDt),
       AnchorDt = as.Date(AnchorDt), RelColl = RelColl, MinMonthsJ2 = MinMonthsJ2,
       HurdleYTM = HurdleYTM, HurdleCY = HurdleCY, HurdleMOIC = HurdleMOIC, TrailDisp = TrailDisp)
}

# ---------------------------------------------------------------- input coercion (SetInput semantics)
# Returns list(ok, value, note). Rates typed as 8 -> 0.08; clamps; choices validated case-insensitively.
coerce_input <- function(key, value) {
  bad <- function(msg) list(ok = FALSE, value = NULL, note = msg)
  if (key %in% names(VALUE_LISTS)) {
    s <- trimws(as.character(value))
    hit <- match(tolower(s), tolower(VALUE_LISTS[[key]]))
    if (is.na(hit)) return(bad(sprintf("'%s' is not a valid choice", s)))
    return(list(ok = TRUE, value = VALUE_LISTS[[key]][hit], note = ""))
  }
  if (key == "BidOverride" && (is.null(value) || is.na(value) || trimws(as.character(value)) == ""))
    return(list(ok = TRUE, value = NA_real_, note = ""))
  s <- gsub("[$,%[:space:]]", "", as.character(value))
  s <- gsub("^\\((.*)\\)$", "-\\1", s)
  if (s == "") return(list(ok = TRUE, value = 0, note = ""))
  d <- suppressWarnings(as.numeric(s))
  if (is.na(d)) return(bad("not a number"))
  pct <- key %in% c("TrailPct", "DPOPct", "ValCapPct", "YTMTgt", "UserRate")
  int <- key %in% c("TermMonths", "LegalStartM", "LegalEndM", "LiqAcrM", "StartMonth", "ExitMonth")
  if (pct) { if (d > 1) d <- d / 100; d <- max(0, min(1, d)) }
  if (int) {
    d <- as.integer(round(d))
    hi <- switch(key, TermMonths = 480L, StartMonth = 60L, ExitMonth = 60L, 480L)
    lo <- if (key %in% c("StartMonth", "ExitMonth")) 1L else 0L
    d <- max(lo, min(hi, d))
  }
  if (key %in% c("UserPmt", "LegalInit", "HoldCost", "UserExit") && d < 0) d <- 0
  list(ok = TRUE, value = d, note = "")
}

# ---------------------------------------------------------------- the model (one loan)
rate_pull <- function(L) switch(L$RateSel, "User Enter" = L$UserRate, "Default" = L$DRate, L$CRate)

payment_pull <- function(L, mr) {
  switch(L$PmtSel,
    "User PMT" = L$UserPmt,
    "Interest PMT" = L$UPB * mr,
    "Term PMT" = if (L$TermMonths <= 0) 0 else if (mr != 0) pmt_x(mr, L$TermMonths, -L$UPB) else L$UPB / L$TermMonths,
    "% of M Trail PMT" = L$TrailPct * switch(L$MTrailSel, "3M" = L$T3 / 3, "6M" = L$T6 / 6, L$T12 / 12),
    L$CPmt)
}

# Sheet MTM (row 11): DATEDIF(CF start, maturity, "M"); 0 when no maturity
months_to_maturity <- function(C, L) if (is.na(L$MatDt)[1]) 0L else as.integer(datedif_m(C$CfStartDt, L$MatDt))

# Sheet MTA (row 12): ROUNDDOWN(NPER(Rate/12, PMT, -UPB)) on the CONTRACTUAL rate/payment, capped 360; NA when undefined
months_to_amortize <- function(L) {
  n <- tryCatch(nper_x(L$CRate / 12, L$CPmt, -L$UPB), error = function(e) NA_real_)
  if (is.na(n)) return(NA_integer_)
  if (n < 0) return(0L)
  as.integer(min(floor(n), 360))
}

# Direct port of the sheet's C42 exit LET formula
exit_pull <- function(C, L, mr, pm, mtm, mta) {
  y <- C$Yield / 12
  exit_m <- L$ExitMonth; start_m <- L$StartMonth
  accrued_adj <- if (L$AddAccrued == "Yes") L$IntBal else 0
  exp_adj <- switch(L$AddBack,
    "Yes, Initial Only" = L$LegalInit,
    "Yes, Both" = L$LegalInit + (min(exit_m, L$LegalEndM) - L$LegalStartM) * L$HoldCost,
    0)
  fv_at_exit <- fv_x(mr, exit_m - start_m + 1, pm, -L$UPB) + pm
  mat_mo <- min(mtm, if (is.na(mta)) mtm else mta)
  xt <- L$ExitType
  bid <- if (xt == "PIF") {
    fv_at_exit + accrued_adj
  } else if (tolower(xt) == "user enter") {
    L$UserExit
  } else if (xt == "DPO") {
    fv_at_exit * (1 - L$DPOPct)
  } else if (xt == "YTM Sell Solve") {
    if (mat_mo > exit_m) -pv_x(L$YTMTgt / 12, mat_mo - exit_m, pm, fv_x(mr, mat_mo, pm, -L$UPB))
    else fv_at_exit + accrued_adj                       # past maturity: fall back to PIF (CONFIRM item)
  } else if (xt == "Value Cap") {
    C$RelColl * L$ValCapPct
  } else if (tolower(xt) == "liquidation") {
    lm <- if (L$LiqAcrM >= 1) L$LiqAcrM else exit_m
    fv_x(mr, lm, 0, -L$UPB) + accrued_adj
  } else if (xt == "IRR Solve") {
    ytm_rate <- L$YTMTgt / 12
    mtm_ytm <- if (!is.na(L$MatDt)[1]) max(max(0, days360_us(C$CutoffDt, L$MatDt) / 30), 1) else 1
    nper_full <- nper_x(mr, -pm, L$UPB); if (is.na(nper_full)) nper_full <- 360
    ytm_m <- min(floor(min(nper_full, mtm_ytm)), 360)
    ytm_bal <- -fv_x(mr, ytm_m, -pm, L$UPB)
    tbid <- pv_x(ytm_rate, ytm_m, -pm, -ytm_bal)
    pv_pmts <- pv_x(y, exit_m - start_m, -pm) / (1 + y)^(start_m - 1)
    pv_legal <- L$LegalInit / (1 + y)^L$LegalStartM
    hn <- min(L$LegalEndM, exit_m - 1) - L$LegalStartM
    pv_hold <- if (hn > 0) pv_x(y, hn, -L$HoldCost) / (1 + y)^L$LegalStartM else 0
    (tbid - pv_pmts + (pv_legal + pv_hold)) * (1 + y)^exit_m - exp_adj
  } else {
    fv_at_exit + accrued_adj
  }
  bid + exp_adj
}

# Net cash flows months 1..60 (income row 126 minus expense row 188)
cash_flows <- function(L, pm, xv, exit_m = L$ExitMonth) {
  t <- 1:60
  inc <- ifelse(t >= L$StartMonth & t < exit_m, pm, 0)
  if (exit_m >= 1 && exit_m <= 60) inc[exit_m] <- xv
  ex <- numeric(60)
  if (L$LegalStartM > 0) {
    if (L$LegalStartM <= 60) ex[L$LegalStartM] <- L$LegalInit
    hold <- t > L$LegalStartM & t <= L$LegalEndM & t <= exit_m
    ex[hold] <- L$HoldCost
  }
  inc - ex
}

# YTM sheet: contractual hold stream at Bid. Returns list(use_mtm, bal, irr, xirr) (NAs when n/a)
ytm_hold <- function(C, L) {
  out <- list(use_mtm = 0L, bal = NA_real_, flows = NULL, dates = NULL)
  if (is.na(L$MatDt)[1]) return(out)
  mtm_y <- max(0, days360_us(C$CutoffDt, L$MatDt) / 30)
  mfta <- nper_x(L$CRate / 12, -L$CPmt, L$UPB); if (is.na(mfta)) mfta <- Inf
  baseline <- max(mtm_y, C$MinMonthsJ2)
  use <- as.integer(min(if (mfta < baseline) floor(mfta) else floor(baseline), 360))
  if (use < 1) return(out)
  bal <- -fv_x(L$CRate / 12, use, -L$CPmt, L$UPB)
  flows <- rep(L$CPmt, use); flows[use] <- flows[use] + bal
  dates <- do.call(c, lapply(0:use, function(k) edate_x(C$CutoffDt, k)))
  list(use_mtm = use, bal = bal, flows = flows, dates = dates)
}

ytm_at_bid <- function(hold, bid) {
  if (bid <= 0 || hold$use_mtm < 1) return(c(irr = NA_real_, xirr = NA_real_))
  f <- c(-bid, hold$flows)
  irr <- irr_x(f); if (!is.na(irr)) irr <- irr * 12
  c(irr = irr, xirr = xirr_x(f, hold$dates))
}

# Evaluate one loan. Returns the loan list with computed fields added (and $Opt: 60-row data.frame).
calc_loan <- function(L, C, with_optimal = TRUE) {
  mr <- rate_pull(L) / 12
  pm <- payment_pull(L, mr)
  mtm <- months_to_maturity(C, L)
  mta <- months_to_amortize(L)
  xv <- exit_pull(C, L, mr, pm, mtm, mta)
  net <- cash_flows(L, pm, xv)
  y <- C$Yield / 12
  bid_model <- npv_x(y, net)
  bid_used <- if (!is.na(L$BidOverride)) L$BidOverride else bid_model
  s12 <- sum(net[1:12]); s_all <- sum(net)
  fv_at_exit <- fv_x(mr, L$ExitMonth - L$StartMonth + 1, pm, -L$UPB) + pm
  ip <- L$UPB * L$CRate / 12
  hold <- ytm_hold(C, L)
  ytm <- ytm_at_bid(hold, bid_used)
  sell <- if (bid_used > 0) irr_x(c(-bid_used, net)) else NA_real_     # full 60-month modeled stream (sheet)
  if (!is.na(sell)) sell <- sell * 12
  div <- function(a, b) if (!is.na(b) && b != 0) a / b else NA_real_

  L$RatePull <- mr * 12; L$PmtPull <- pm; L$IntPmt <- ip
  L$TermPmt <- if (L$TermMonths > 0) (if (mr != 0) pmt_x(mr, L$TermMonths, -L$UPB) else L$UPB / L$TermMonths) else NA_real_
  L$PctTrail <- L$TrailPct * switch(L$MTrailSel, "3M" = L$T3 / 3, "6M" = L$T6 / 6, L$T12 / 12)
  L$MAI <- div(L$IntBal, ip); L$MTM <- mtm; L$MTA <- if (is.na(mta)) 360L else mta; L$MTAok <- !is.na(mta)
  L$ExitVal <- xv; L$FvAtExit <- fv_at_exit; L$Net <- net
  L$BidNPV <- bid_model; L$BidUsed <- bid_used; L$S12 <- s12; L$SAll <- s_all
  L$BidPct <- div(bid_used, L$UPB); L$CY12 <- div(s12, bid_used); L$MOIC <- div(s_all, bid_used)
  L$ImpDPO <- if (fv_at_exit != 0) 1 - xv / fv_at_exit else NA_real_
  L$BidMwVx <- div(bid_used, C$RelColl); L$F12P12 <- div(s12, L$T12)
  L$UseMTM <- hold$use_mtm; L$BalAtExit <- if (hold$use_mtm >= 1) hold$bal else NA_real_
  L$YtmIRR <- unname(ytm["irr"]); L$YtmXIRR <- unname(ytm["xirr"]); L$SellYTM <- sell
  L$Hold <- hold

  if (with_optimal) {
    m <- 1:60
    bid_m <- numeric(60); dpo_m <- numeric(60); cy_m <- numeric(60); moic_m <- numeric(60); ytm_m <- numeric(60)
    for (k in m) {
      Lk <- L; Lk$ExitMonth <- k
      xvk <- exit_pull(C, Lk, mr, pm, mtm, mta)
      netk <- cash_flows(Lk, pm, xvk, k)
      bk <- npv_x(y, netk)
      fvk <- fv_x(mr, k - L$StartMonth + 1, pm, -L$UPB) + pm
      bid_m[k] <- bk
      dpo_m[k] <- if (fvk != 0) 1 - xvk / fvk else NA
      cy_m[k] <- if (bk != 0) sum(netk[1:12]) / bk else NA
      moic_m[k] <- if (bk != 0) sum(netk) / bk else NA
      ytm_m[k] <- unname(ytm_at_bid(hold, bk)["irr"])
    }
    opt <- data.frame(M = m, Bid = bid_m, BidPct = if (L$UPB != 0) bid_m / L$UPB else NA, ImpDPO = dpo_m,
                      CY12 = cy_m, MOIC = moic_m, YTM = ytm_m)
    opt$PassYTM <- !is.na(opt$YTM) & opt$YTM >= C$HurdleYTM
    opt$PassCY <- !is.na(opt$CY12) & opt$Bid != 0 & opt$CY12 >= C$HurdleCY
    opt$PassMOIC <- !is.na(opt$MOIC) & opt$Bid != 0 & opt$MOIC >= C$HurdleMOIC
    opt$PassAll <- opt$PassYTM & opt$PassCY & opt$PassMOIC
    first <- function(p) if (any(p)) which(p)[1] else NA_integer_
    L$Opt <- opt
    L$MinHYTM <- first(opt$PassYTM); L$MinHCY <- first(opt$PassCY); L$MinHMOIC <- first(opt$PassMOIC); L$MinHAll <- first(opt$PassAll)
  }
  L
}

# ---------------------------------------------------------------- relationship
# rel = list(loans = list of loans, ctx = ctx). Returns rel with loans calculated plus $tot and $rel_opt.
calc_rel <- function(rel, with_optimal = TRUE) {
  C <- rel$ctx
  rel$loans <- lapply(rel$loans, calc_loan, C = C, with_optimal = with_optimal)
  rel$tot <- calc_totals(rel$loans, C)
  if (with_optimal) {
    ro <- calc_rel_optimal(rel$loans, rel$tot, C)
    rel$rel_opt <- ro$opt
    rel$tot$MinHYTM <- ro$minh[1]; rel$tot$MinHCY <- ro$minh[2]; rel$tot$MinHMOIC <- ro$minh[3]; rel$tot$MinHAll <- ro$minh[4]
  }
  rel
}

# Recalculate one loan (after one of its inputs changed) and the relationship totals/optimal
calc_rel_loan <- function(rel, k, with_optimal = TRUE) {
  rel$loans[[k]] <- calc_loan(rel$loans[[k]], rel$ctx, with_optimal = with_optimal)
  rel$tot <- calc_totals(rel$loans, rel$ctx)
  if (with_optimal) {
    ro <- calc_rel_optimal(rel$loans, rel$tot, rel$ctx)
    rel$rel_opt <- ro$opt
    rel$tot$MinHYTM <- ro$minh[1]; rel$tot$MinHCY <- ro$minh[2]; rel$tot$MinHMOIC <- ro$minh[3]; rel$tot$MinHAll <- ro$minh[4]
  }
  rel
}

sum_field <- function(loans, f) sum(vapply(loans, function(L) as.numeric(L[[f]]), numeric(1)), na.rm = TRUE)

calc_totals <- function(loans, C) {
  tot <- loan_defaults(); tot$LoanNo <- "Relationship"
  if (length(loans) == 0) return(tot)
  for (f in c("UPB", "IntBal", "CPmt", "T3", "T6", "T12", "T24", "ExitVal", "BidNPV", "BidUsed", "S12", "SAll"))
    tot[[f]] <- sum_field(loans, f)
  tot$BalAtExit <- sum(vapply(loans, function(L) if (L$UseMTM >= 1) L$BalAtExit else 0, numeric(1)))
  tot$UseMTM <- max(vapply(loans, function(L) L$UseMTM, integer(1)))
  tot$Net <- Reduce(`+`, lapply(loans, `[[`, "Net"))
  tot$CRate <- if (tot$UPB != 0) sum(vapply(loans, function(L) L$CRate * L$UPB, numeric(1))) / tot$UPB else 0
  tot$IntPmt <- tot$UPB * tot$CRate / 12
  sFv <- sum_field(loans, "FvAtExit")
  div <- function(a, b) if (b != 0) a / b else NA_real_
  tot$MAI <- div(tot$IntBal, tot$IntPmt)
  tot$BidPct <- div(tot$BidUsed, tot$UPB); tot$CY12 <- div(tot$S12, tot$BidUsed); tot$MOIC <- div(tot$SAll, tot$BidUsed)
  tot$ImpDPO <- if (sFv != 0) 1 - tot$ExitVal / sFv else NA_real_
  tot$BidMwVx <- div(tot$BidUsed, C$RelColl); tot$F12P12 <- div(tot$S12, tot$T12)
  tot$MTM <- max(vapply(loans, function(L) L$MTM, integer(1))); tot$MTA <- max(vapply(loans, function(L) L$MTA, integer(1)))
  tot$PmtPull <- sum_field(loans, "PmtPull"); tot$RatePull <- NA_real_
  # summed contractual-hold stream
  tot$YtmIRR <- NA_real_; tot$YtmXIRR <- NA_real_; tot$SellYTM <- NA_real_
  mx <- tot$UseMTM
  if (mx >= 1 && tot$BidUsed > 0) {
    cf <- numeric(mx)
    for (L in loans) if (L$UseMTM >= 1 && L$BidUsed > 0) {
      cf[seq_len(L$UseMTM)] <- cf[seq_len(L$UseMTM)] + L$CPmt
      cf[L$UseMTM] <- cf[L$UseMTM] + L$BalAtExit
    }
    f <- c(-tot$BidUsed, cf)
    irr <- irr_x(f); tot$YtmIRR <- if (is.na(irr)) NA_real_ else 12 * irr
    dates <- do.call(c, lapply(0:mx, function(k) edate_x(C$CutoffDt, k)))
    tot$YtmXIRR <- xirr_x(f, dates)
  }
  mxe <- max(vapply(loans, function(L) L$ExitMonth, integer(1)))
  if (mxe >= 1 && tot$BidUsed > 0) {
    s <- irr_x(c(-tot$BidUsed, tot$Net[seq_len(mxe)]))
    tot$SellYTM <- if (is.na(s)) NA_real_ else 12 * s
  }
  tot
}

# Relationship optimal table: Bid-weighted CY12/MOIC/ImpDPO per month, YTM of the summed hold stream priced at sum(Bid_m)
calc_rel_optimal <- function(loans, tot, C) {
  m <- 1:60
  sBid <- Reduce(`+`, lapply(loans, function(L) L$Opt$Bid))
  wsum <- function(f) Reduce(`+`, lapply(loans, function(L) ifelse(is.na(L$Opt[[f]]), 0, L$Opt[[f]]) * L$Opt$Bid))
  cy <- ifelse(sBid != 0, wsum("CY12") / sBid, NA); moic <- ifelse(sBid != 0, wsum("MOIC") / sBid, NA)
  dpo <- ifelse(sBid != 0, wsum("ImpDPO") / sBid, NA)
  ytm <- rep(NA_real_, 60)
  mx <- tot$UseMTM
  if (mx >= 1) {
    cf <- numeric(mx)
    for (L in loans) if (L$UseMTM >= 1) {
      cf[seq_len(L$UseMTM)] <- cf[seq_len(L$UseMTM)] + L$CPmt
      cf[L$UseMTM] <- cf[L$UseMTM] + L$BalAtExit
    }
    for (k in m) if (sBid[k] > 0) { r <- irr_x(c(-sBid[k], cf)); ytm[k] <- if (is.na(r)) NA else 12 * r }
  }
  opt <- data.frame(M = m, Bid = sBid, BidPct = if (tot$UPB != 0) sBid / tot$UPB else NA, ImpDPO = dpo, CY12 = cy, MOIC = moic, YTM = ytm)
  opt$PassYTM <- !is.na(opt$YTM) & opt$YTM >= C$HurdleYTM
  opt$PassCY <- !is.na(opt$CY12) & sBid != 0 & opt$CY12 >= C$HurdleCY
  opt$PassMOIC <- !is.na(opt$MOIC) & sBid != 0 & opt$MOIC >= C$HurdleMOIC
  opt$PassAll <- opt$PassYTM & opt$PassCY & opt$PassMOIC
  first <- function(p) if (any(p)) which(p)[1] else NA_integer_
  list(opt = opt, minh = c(first(opt$PassYTM), first(opt$PassCY), first(opt$PassMOIC), first(opt$PassAll)))
}

# ---------------------------------------------------------------- pay history
# pay: data.frame(LoanNo, pd, amount) pre-summed per loan-period. Returns per-loan T3/T6/T12/T24 and the 36-month matrix.
# idx = pd_diff(anchor_pd, pd): 0 = anchor month (newest), trail n sums idx 0..n-1, matrix row k shows idx k.
compute_trails <- function(loans, pay, anchor_dt) {
  a <- pd_key(anchor_dt)
  keys <- vapply(loans, `[[`, character(1), "LoanNo")
  mat <- matrix(0, nrow = 36, ncol = length(loans), dimnames = list(NULL, keys))
  if (nrow(pay)) {
    idx <- pd_diff(a, pay$pd)
    for (i in seq_along(loans)) {
      sel <- pay$LoanNo == keys[i] & idx >= 0
      amt <- pay$amount[sel]; ix <- idx[sel]
      loans[[i]]$T3 <- sum(amt[ix <= 2]); loans[[i]]$T6 <- sum(amt[ix <= 5])
      loans[[i]]$T12 <- sum(amt[ix <= 11]); loans[[i]]$T24 <- sum(amt[ix <= 23])
      inm <- ix <= 35
      if (any(inm)) mat[, i] <- tapply(c(amt[inm], rep(0, 36)), c(ix[inm], 0:35), sum)
    }
  }
  list(loans = loans, matrix = mat, labels = pd_label(pd_add(a, -(0:35))))
}

# Trail Selection transforms (sheet Pay History)
trail_display <- function(s, n, sel, cpmt, ipmt) {
  switch(sel,
    "monthly" = s / n,
    "yearly" = s / n * 12,
    "% of Contractual" = if (cpmt != 0) s / (cpmt * n) else NA_real_,
    "% of Int PMT" = if (ipmt != 0) s / (ipmt * n) else NA_real_,
    "# of PMT's Made" = if (cpmt != 0) s / cpmt else NA_real_,
    "# of Int Pmt's Made" = if (ipmt != 0) s / ipmt else NA_real_,
    s)
}
