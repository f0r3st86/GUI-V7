# Relationship Projection — Shiny app

The Bid_Project workbook's *Relationship Projection* sheet as an R/Shiny app: same rows in the
same top-to-bottom order, one column per loan plus the Relationship column, yellow = editable,
green = result. Reads MidwestDDi through the existing `sqlDueDiligence` DSN and **never writes to
SQL Server**. Your inputs are saved locally under `%USERPROFILE%\BidReader\inputs`.

```
shiny/
  app.R                 UI + server
  R/engine.R            the model (port of scripts/bid_engine_ref.py) — pure base R
  R/rows.R              the sheet's row order, kinds, formats
  R/data.R              DBI/odbc read-only queries, local input persistence, demo data
  tests/test_engine.R   fidelity gate vs tools/bidref/vectors.csv (107 cases, 3,531 checks)
  tests/test_app.R      headless server smoke test (demo mode)
```

## Setup (once)

```r
install.packages(c("shiny", "bslib", "rhandsontable", "DT", "DBI", "odbc", "openxlsx", "jsonlite"))
```

Then, from the repo root, prove the engine before trusting any number:

```r
system("Rscript shiny/tests/test_engine.R")   # expect: FIDELITY GATE: PASS
```

## Run

In RStudio open `shiny/app.R` and click **Run App**, or:

```r
shiny::runApp("shiny")                          # live data via the DSN
Sys.setenv(BR_DEMO = "1"); shiny::runApp("shiny")  # synthetic demo relationship, no SQL Server
```

Environment overrides: `BR_DSN` (default `sqlDueDiligence`), `BR_DB` (`MidwestDDi`),
`BR_PD_EXPR` (pay-history period key; default `p.pd`, fallback `p.[Year]*100 + p.[Month]`).

## Using it

- **Projection**: pick Project → Relationship. Edit any yellow cell in place (type `9` in a rate
  cell for 9%, `$9,000` or `9000` for money, dropdowns for the choice rows). Every edit recalculates
  the whole relationship and repaints; the status line shows what changed, the old → new Bid and
  the milliseconds. **Undo** steps back (20 levels); **Reset all inputs** asks first.
- **Header globals**: PMT History Date (trailing windows + matrix), Cutoff Date (MTM/YTM dates),
  Yield, YTM Min Months (the YTM sheet's J2 floor), Trail Selection, and the three hurdles.
- **KPI strip**: Relationship Bid, Bid %, 12M CY, MOIC, YTM (IRR), Sell YTM.
- **Optimal**: 60-month table for a loan or the relationship, hurdle pass flags, chart of YTM / 12M
  CY / MOIC with hurdle lines and the min-hurdle month; select a row and press *Use selected
  month as Exit Month*.
- **Pay History**: statistics block (Trail Selection transforms) and the 36-month matrix, orange =
  missed month, yellow = under 90% of the contractual payment.
- **Collateral**: $/SF, $/Unit, $/Acre, months since appraisal, net values, totals, 90% line,
  what-if unit × value.
- **Export .xlsx**: Projection (with yellow/green styling), Optimal, PayHistory, Collateral, Inputs.

## Numbers

The engine is `R/engine.R`, a line-for-line port of the Python oracle that also drives the Access
v2 self-test. Exit types (PIF / User Enter / DPO / YTM Sell Solve / Value Cap / Liquidation / IRR
Solve), payment and rate pulls, legal timing and add-back, NPV bid, 12M CY, MOIC, implied DPO,
Bid/MwVx, F12/P12, the YTM block (MTM via DAYS360, MFTA via NPER, IRR and XIRR), Sell YTM, and the
optimal/hurdle analysis are all covered by the vector gate. The relationship column follows the
Access v2 definitions (sums, UPB-weighted rate, IRR of the summed hold stream, Bid-weighted optimal
ratios). The CONFIRM items in `access/README-BidReader-v2.md` apply here too.

## Sharing

A Shiny app on your desktop is yours alone. To share it, IT would host it on Posit Connect, Shiny
Server or ShinyProxy on an internal machine; the code needs no changes for that (the DSN must exist
on the host and users must have SQL Server access under their own Windows login, or the host runs
as a service account). Do not deploy to shinyapps.io — the data is internal and contains PII.
