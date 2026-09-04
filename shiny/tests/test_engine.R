# Fidelity gate for shiny/R/engine.R against the golden vectors produced by the Python oracle.
#   Rscript shiny/tests/test_engine.R          (from the repo root; base R only, no packages)
# Exit status 1 on any mismatch. Same tolerances as the Access self-test.

root <- getwd()
args <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", args[grepl("^--file=", args)])
if (length(f)) root <- normalizePath(file.path(dirname(f), "..", ".."))
source(file.path(root, "shiny", "R", "engine.R"))

inputs <- read.csv(file.path(root, "tools", "bidref", "vectors_inputs.csv"), stringsAsFactors = FALSE, colClasses = "character")
expected <- read.csv(file.path(root, "tools", "bidref", "vectors.csv"), stringsAsFactors = FALSE, colClasses = "character")

num <- function(s) as.numeric(s)
build_case <- function(cid) {
  kv <- inputs[inputs$case_id == cid, ]
  g <- function(n) kv$value[kv$name == n]
  mat <- g("MatDt"); mat <- if (nzchar(mat)) as.Date(mat) else NA
  L <- new_loan(LoanNo = g("LoanNo"), UPB = num(g("UPB")), IntBal = num(g("IntBal")), CRate = num(g("CRate")),
                DRate = num(g("DRate")), CPmt = num(g("CPmt")), MatDt = mat, T3 = num(g("T3")), T6 = num(g("T6")),
                T12 = num(g("T12")), T24 = num(g("T24")))
  for (k in INPUT_KEYS) {
    v <- g(k)
    if (k == "BidOverride") { L[[k]] <- if (nzchar(v)) num(v) else NA_real_; next }
    if (k %in% names(VALUE_LISTS)) L[[k]] <- v
    else if (k %in% c("TermMonths", "LegalStartM", "LegalEndM", "LiqAcrM", "StartMonth", "ExitMonth")) L[[k]] <- as.integer(round(num(v)))
    else L[[k]] <- num(v)
  }
  C <- new_ctx(Yield = num(g("Yield")), CutoffDt = as.Date(g("CutoffDt")), CfStartDt = as.Date(g("CutoffDt")),
               AnchorDt = as.Date(g("AnchorDt")), RelColl = num(g("RelColl")), MinMonthsJ2 = num(g("MinMonthsJ2")),
               HurdleYTM = num(g("HurdleYTM")), HurdleCY = num(g("HurdleCY")), HurdleMOIC = num(g("HurdleMOIC")))
  list(L = L, C = C)
}

actual_of <- function(R, field) {
  if (grepl("^Net[0-9]+$", field)) return(R$Net[as.integer(sub("Net", "", field))])
  if (grepl("^Opt[0-9]+_Bid$", field)) return(R$Opt$Bid[as.integer(sub("Opt([0-9]+)_Bid", "\\1", field))])
  switch(field,
    PmtPull = R$PmtPull, ExitVal = R$ExitVal, BidNPV = R$BidNPV, BidPct = R$BidPct, CY12 = R$CY12, MOIC = R$MOIC,
    ImpDPO = R$ImpDPO, BidMwVx = R$BidMwVx, F12P12 = R$F12P12, MTM = R$MTM, MTA = R$MTA, UseMTM = R$UseMTM,
    BalAtExit = R$BalAtExit, YtmIRR = R$YtmIRR, YtmXIRR = R$YtmXIRR, SellYTM = R$SellYTM,
    MinHYTM = R$MinHYTM, MinHCY = R$MinHCY, MinHMOIC = R$MinHMOIC, MinHAll = R$MinHAll, NA_real_)
}

cases <- unique(expected$case_id)
fails <- 0L; checks <- 0L; t0 <- proc.time()[["elapsed"]]
for (cid in cases) {
  cs <- build_case(cid)
  R <- calc_loan(cs$L, cs$C, with_optimal = TRUE)
  ex <- expected[expected$case_id == cid, ]
  for (j in seq_len(nrow(ex))) {
    checks <- checks + 1L
    want <- ex$expected[j]; tol <- num(ex$tol[j]); got <- actual_of(R, ex$field[j])
    ok <- if (!nzchar(want)) is.na(got) else (!is.na(got) && abs(got - num(want)) <= tol + 1e-12)
    if (!ok) {
      fails <- fails + 1L
      cat(sprintf("FAIL %-24s %-10s expected=%s got=%s tol=%g\n", cid, ex$field[j], if (nzchar(want)) want else "n/a",
                  if (is.na(got)) "n/a" else format(got, digits = 15), tol))
    }
  }
}
# relationship-level smoke: totals over all hand cases as one relationship must be finite and consistent
hand <- cases[!grepl("^RND", cases)]
rel <- list(loans = lapply(hand[1:8], function(cid) build_case(cid)$L), ctx = build_case(hand[1])$C)
for (i in seq_along(rel$loans)) rel$loans[[i]]$LoanNo <- paste0("L", i)
rel <- calc_rel(rel)
stopifnot(abs(rel$tot$BidUsed - sum(vapply(rel$loans, `[[`, numeric(1), "BidUsed"))) < 1e-6,
          nrow(rel$rel_opt) == 60, is.finite(rel$tot$YtmIRR), abs(rel$rel_opt$Bid[24] - sum(vapply(rel$loans, function(L) L$Opt$Bid[24], numeric(1)))) < 1e-6)
# pay-history trails: anchor Jul-2026, three payments -> T3 sums idx 0..2 only
pay <- data.frame(LoanNo = "L1", pd = c(202607, 202606, 202605, 202604, 202501), amount = c(100, 200, 300, 400, 5000))
tr <- compute_trails(rel$loans[1], pay, as.Date("2026-07-31"))
stopifnot(tr$loans[[1]]$T3 == 600, tr$loans[[1]]$T6 == 1000, tr$loans[[1]]$T12 == 1000, tr$loans[[1]]$T24 == 6000,
          tr$matrix[1, 1] == 100, tr$matrix[4, 1] == 400, tr$matrix[19, 1] == 5000, tr$labels[1] == "Jul-26", tr$labels[19] == "Jan-25")

cat(sprintf("\n%d cases, %d checks, %d failures, %.1fs\n", length(cases), checks, fails, proc.time()[["elapsed"]] - t0))
cat(if (fails == 0) "FIDELITY GATE: PASS\n" else "FIDELITY GATE: FAIL\n")
quit(status = if (fails == 0) 0 else 1)
