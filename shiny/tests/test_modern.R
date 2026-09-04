# Headless smoke test of the modern (card) layout in DEMO mode.
#   Rscript shiny/tests/test_modern.R      (from the repo root)
Sys.setenv(BR_DEMO = "1", USERPROFILE = tempfile("brprofile"))
suppressPackageStartupMessages(library(shiny))
root <- getwd()
args <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", args[grepl("^--file=", args)])
if (length(f)) root <- normalizePath(file.path(dirname(f), "..", ".."))
owd <- setwd(file.path(root, "shiny", "modern")); on.exit(setwd(owd))
for (f in c("../R/engine.R", "../R/rows.R", "../R/data.R")) source(f)
app <- shinyAppFile("app.R")

testServer(app, {
  session$setInputs(proj = "DEMO Project")
  session$setInputs(rel = "ALPHA HOLDINGS", anchor = as.Date("2026-07-31"), cutoff = as.Date("2026-07-01"), yield = 15, j2 = 0,
                    traildisp = "Actual", hytm = 10, hcy = 9, hmoic = 1.3)
  stopifnot(length(rv$rel$loans) == 3)
  bid0 <- rv$rel$tot$BidUsed
  ui <- output$cards                     # renders the cards and binds the per-loan observers
  stopifnot(grepl("L1_ExitType", ui$html), grepl("L3_ExitMonth", ui$html))
  # initial input values arriving from the client must be no-ops
  session$setInputs(L1_ExitType = "PIF", L1_DPOPct = 25, L2_UserPmt = 0)
  stopifnot(rv$rel$tot$BidUsed == bid0, length(rv$undo) == 0)
  # real edits
  session$setInputs(L1_ExitType = "DPO")
  stopifnot(rv$rel$loans[[1]]$ExitType == "DPO", rv$rel$tot$BidUsed < bid0, length(rv$undo) == 1)
  bid1 <- rv$rel$tot$BidUsed
  session$setInputs(L1_DPOPct = 40)      # percent units in the UI
  stopifnot(abs(rv$rel$loans[[1]]$DPOPct - 0.40) < 1e-12, rv$rel$tot$BidUsed < bid1)
  session$setInputs(L3_ExitMonth = 36L)
  stopifnot(rv$rel$loans[[3]]$ExitMonth == 36L)
  session$setInputs(L2_UserPmt = NA)     # empty box while typing: ignored
  stopifnot(rv$rel$loans[[2]]$UserPmt == 0)
  stopifnot(grepl("^\\$", output$res_1$html) || grepl("Bid", output$res_1$html), output$badge_1 == "DPO")
  # globals
  session$setInputs(yield = 12)
  stopifnot(rv$rel$ctx$Yield == 0.12)
  # undo twice -> back to bid after DPO
  session$setInputs(undo = 1); session$setInputs(undo = 2); session$setInputs(undo = 3)
  stopifnot(abs(rv$rel$tot$BidUsed - bid1) < 1e-6)
  # charts and export
  stopifnot(inherits(output$cfplot, "list") || is.character(output$cfplot), nzchar(output$kBid))
  xp <- output$export; stopifnot(file.exists(xp), "Projection" %in% openxlsx::getSheetNames(xp))
  cat("status:", rv$status, "\n")
})
cat("MODERN SMOKE: PASS\n")
