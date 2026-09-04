# Headless smoke test of the Shiny server in DEMO mode (no SQL Server, no browser).
#   Rscript shiny/tests/test_app.R      (from the repo root)
Sys.setenv(BR_DEMO = "1", USERPROFILE = tempfile("brprofile"))
suppressPackageStartupMessages(library(shiny))
root <- getwd()
args <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", args[grepl("^--file=", args)])
if (length(f)) root <- normalizePath(file.path(dirname(f), "..", ".."))
appdir <- file.path(root, "shiny")
owd <- setwd(appdir); on.exit(setwd(owd))
for (f in c("R/engine.R", "R/rows.R", "R/data.R")) source(f)   # make the sheet definitions visible to the test expressions
app <- shinyAppFile("app.R")

testServer(app, {
  session$setInputs(proj = "DEMO Project")
  session$setInputs(rel = "ALPHA HOLDINGS", anchor = as.Date("2026-07-31"), cutoff = as.Date("2026-07-01"), yield = 15, j2 = 0,
                    traildisp = "Actual", hytm = 10, hcy = 9, hmoic = 1.3, optloan = "Relationship", unitsel = "SF", unitval = 100)
  stopifnot(!is.null(rv$rel), length(rv$rel$loans) == 3)
  bid0 <- rv$rel$tot$BidUsed
  stopifnot(is.finite(bid0), bid0 > 0)
  df <- sheet_df()
  stopifnot(nrow(df) == nrow(ROW_DEFS), ncol(df) == 5, df$Category[1] == "UPB", grepl("^\\$", df[[2]][1]))
  cat("loaded:", rv$status, "\n")

  # edit Exit Type of loan 1 (row index of ExitType, 0-based) -> DPO lowers the bid
  r <- which(ROW_DEFS$key == "ExitType") - 1
  session$setInputs(hot = list(changes = list(event = "afterChange", changes = list(list(r, 1, "PIF", "DPO")))))
  stopifnot(rv$rel$loans[[1]]$ExitType == "DPO", rv$rel$tot$BidUsed < bid0)
  bid1 <- rv$rel$tot$BidUsed
  cat("after DPO:", rv$status, "\n")

  # numeric edit typed with $ and comma, then a rate typed as "9" -> 0.09
  r <- which(ROW_DEFS$key == "UserPmt") - 1
  session$setInputs(hot = list(changes = list(event = "afterChange", changes = list(list(r, 2, "$0", "$9,000")))))
  stopifnot(rv$rel$loans[[2]]$UserPmt == 9000)
  r <- which(ROW_DEFS$key == "UserRate") - 1
  session$setInputs(hot = list(changes = list(event = "afterChange", changes = list(list(r, 3, "0.00%", "9")))))
  stopifnot(abs(rv$rel$loans[[3]]$UserRate - 0.09) < 1e-12)

  # invalid choice is rejected and reverted
  r <- which(ROW_DEFS$key == "PmtSel") - 1
  session$setInputs(hot = list(changes = list(event = "afterChange", changes = list(list(r, 1, "Current PMT", "Bogus")))))
  stopifnot(rv$rel$loans[[1]]$PmtSel == "Current PMT", grepl("not a valid choice", rv$status))

  # undo twice (UserRate, UserPmt; the rejected edit pushed nothing) restores the post-DPO bid
  session$setInputs(undo = 1); session$setInputs(undo = 2)
  stopifnot(abs(rv$rel$tot$BidUsed - bid1) < 1e-6, rv$rel$loans[[2]]$UserPmt == 0)

  # globals: yield 15 -> 12 raises the bid
  session$setInputs(yield = 12)
  stopifnot(rv$rel$ctx$Yield == 0.12, rv$rel$tot$BidUsed > bid1)

  # optimal: pick month 36 for the relationship
  session$setInputs(optloan = "Relationship", opttab_rows_selected = 36L)
  session$setInputs(usemonth = 1)
  stopifnot(all(vapply(rv$rel$loans, `[[`, integer(1), "ExitMonth") == 36L))
  s <- opt_sel(); stopifnot(nrow(s$opt) == 60)

  # pay history + collateral reactives evaluate
  stopifnot(nrow(rv$trails$matrix) == 36, ncol(rv$trails$matrix) == 3, nrow(rv$coll) == 3, whatif() == 100 * sum(rv$coll$SQFT))
  stopifnot(nzchar(output$kBid), nzchar(output$kYTM))

  # inputs persisted locally; reload restores them
  p <- inputs_path("DEMO Project", "ALPHA HOLDINGS"); stopifnot(file.exists(p))
  session$setInputs(reload = 1)
  stopifnot(rv$rel$loans[[1]]$ExitType == "DPO", all(vapply(rv$rel$loans, `[[`, integer(1), "ExitMonth") == 36L),
            rv$rel$ctx$Yield == 0.12, grepl("saved inputs restored", rv$status))

  # export writes a workbook with 5 sheets
  xp <- output$export
  stopifnot(file.exists(xp), identical(openxlsx::getSheetNames(xp), c("Projection", "Optimal", "PayHistory", "Collateral", "Inputs")))
  cat("smoke:", rv$status, "\n")
})
cat("APP SMOKE: PASS\n")
