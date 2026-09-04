# data.R - read-only data access for the Relationship Projection Shiny app.
#
# Every statement here is a SELECT. Nothing in this app writes to SQL Server; user inputs are saved
# as .rds files under the user's profile (see inputs_path()).
#
# Connection: the existing `sqlDueDiligence` DSN with Windows trusted authentication (no password in code).
# Demo mode (no DSN, or BR_DEMO=1): a small synthetic project so the app runs anywhere.

DSN_NAME <- Sys.getenv("BR_DSN", "sqlDueDiligence")
DB_NAME  <- Sys.getenv("BR_DB", "MidwestDDi")
PD_EXPR  <- Sys.getenv("BR_PD_EXPR", "p.pd")      # tblPayHistory period key; fallback e.g. "p.[Year]*100 + p.[Month]"

# ---------------------------------------------------------------- connection
br_connect <- function() {
  if (Sys.getenv("BR_DEMO") == "1") return(NULL)
  if (!requireNamespace("DBI", quietly = TRUE) || !requireNamespace("odbc", quietly = TRUE)) return(NULL)
  tryCatch(
    DBI::dbConnect(odbc::odbc(), dsn = DSN_NAME, database = DB_NAME, timeout = 10,
                   ApplicationIntent = "ReadOnly", encoding = "latin1"),
    error = function(e) { message("br_connect: ", conditionMessage(e)); NULL })
}

br_query <- function(con, sql, params = NULL) {
  if (is.null(params)) DBI::dbGetQuery(con, sql) else DBI::dbGetQuery(con, sql, params = params)
}

# ---------------------------------------------------------------- pickers
br_projects <- function(con) {
  if (is.null(con)) return(demo_projects())
  br_query(con, "SELECT DISTINCT ProjectName FROM dbo.tblLoan WHERE ProjectName IS NOT NULL ORDER BY ProjectName")$ProjectName
}

br_relationships <- function(con, proj) {
  if (is.null(con)) return(demo_relationships(proj))
  d <- br_query(con, "
    SELECT RelatedLoans, COUNT(*) AS Loans, SUM(CAST(ISNULL(PrincipalBalance,0) AS float)) AS UPB
    FROM dbo.tblLoan WHERE ProjectName = ? AND RelatedLoans IS NOT NULL
    GROUP BY RelatedLoans ORDER BY SUM(CAST(ISNULL(PrincipalBalance,0) AS float)) DESC, RelatedLoans", list(proj))
  d
}

# ---------------------------------------------------------------- relationship load (loans + pay history + scalars)
# Returns list(loans = list of new_loan(), pay = data.frame(LoanNo, pd, amount), tape_asof, cf_start, rel_coll, coll_seller, coll_count)
br_load_relationship <- function(con, proj, rel) {
  if (is.null(con)) return(demo_load(proj, rel))
  loans <- br_query(con, "
    SELECT l.MWLoanNo, CAST(ISNULL(l.PrincipalBalance,0) AS float) AS UPB, CAST(ISNULL(l.InterestBalance,0) AS float) AS IntBal,
           CAST(ISNULL(l.Rate,0) AS float) AS CRate, CAST(ISNULL(l.DefaultRate,0) AS float) AS DRate,
           CAST(ISNULL(l.RepayAmt,0) AS float) AS CPmt, CAST(l.CurrentMaturityDate AS date) AS MatDt, l.LastImport
    FROM dbo.tblLoan l WHERE l.ProjectName = ? AND l.RelatedLoans = ?
    ORDER BY l.PrincipalBalance DESC, l.MWLoanNo", list(proj, rel))
  pay <- if (nrow(loans)) br_query(con, sprintf("
    SELECT p.mwloanno AS LoanNo, %s AS pd, CAST(SUM(ISNULL(p.amount,0)) AS float) AS amount
    FROM dbo.tblPayHistory p INNER JOIN dbo.tblLoan l ON l.MWLoanNo = p.mwloanno
    WHERE l.ProjectName = ? AND l.RelatedLoans = ?
    GROUP BY p.mwloanno, %s", PD_EXPR, PD_EXPR), list(proj, rel)) else data.frame(LoanNo = character(), pd = numeric(), amount = numeric())
  coll <- br_query(con, "
    SELECT COUNT(*) AS N, SUM(CAST(ISNULL(CurrentAppraisedValue,0) AS float)) AS MwVx, SUM(CAST(ISNULL(SellerAppraisedValue,0) AS float)) AS Seller
    FROM dbo.CollateralInfo WHERE ProjectName = ? AND RelatedLoans = ?", list(proj, rel))
  cfp <- br_query(con, "SELECT cfstartyear, cfstartmonth FROM dbo.xTblCFparameters WHERE ProjectName = ?", list(proj))
  cf_start <- if (nrow(cfp) && !is.na(cfp$cfstartyear[1])) as.Date(sprintf("%04d-%02d-01", cfp$cfstartyear[1], cfp$cfstartmonth[1])) else NA
  list(
    loans = lapply(seq_len(nrow(loans)), function(i) with(loans[i, ], new_loan(
      LoanNo = as.character(MWLoanNo), UPB = UPB, IntBal = IntBal, CRate = CRate, DRate = DRate, CPmt = CPmt,
      MatDt = if (is.na(MatDt)) NA else as.Date(MatDt)))),
    pay = data.frame(LoanNo = as.character(pay$LoanNo), pd = as.numeric(pay$pd), amount = as.numeric(pay$amount)),
    tape_asof = if (nrow(loans) && any(!is.na(loans$LastImport))) as.Date(max(loans$LastImport, na.rm = TRUE)) else NA,
    cf_start = cf_start,
    rel_coll = if (nrow(coll)) ifelse(is.na(coll$MwVx[1]), 0, coll$MwVx[1]) else 0,
    coll_seller = if (nrow(coll)) ifelse(is.na(coll$Seller[1]), 0, coll$Seller[1]) else 0,
    coll_count = if (nrow(coll)) coll$N[1] else 0
  )
}

# ---------------------------------------------------------------- collateral detail (Collateral tab)
br_load_collateral <- function(con, proj, rel) {
  if (is.null(con)) return(demo_collateral(proj, rel))
  br_query(con, "
    SELECT c.MWPropertyNo, c.Priority, c.MWCollateralCode, c.Description, c.Address, c.City, c.State, c.Zip, c.County,
           CAST(ISNULL(c.SQFT,0) AS float) AS SQFT, CAST(ISNULL(c.NumUnits,0) AS float) AS NumUnits, CAST(ISNULL(c.Acreage,0) AS float) AS Acreage,
           CAST(c.SellerAppraisalDate AS date) AS ApprDt, DATEDIFF(month, c.SellerAppraisalDate, CAST(GETDATE() AS date)) AS MosAppr,
           CAST(ISNULL(c.SellerAppraisedValue,0) AS float) AS SellerAppr, CAST(ISNULL(c.CurrentAppraisedValue,0) AS float) AS MwVx,
           CAST(ISNULL(c.TaxAnnualAmt,0) AS float) AS TaxAnnual, CAST(ISNULL(c.TaxDelinquentAmt,0) AS float) AS TaxDelq,
           CAST(ISNULL(c.MWTitleSrLienAmt,0) AS float) AS SrLien, c.MWTitleLienPosition AS LienPos
    FROM dbo.CollateralInfo c WHERE c.ProjectName = ? AND c.RelatedLoans = ?
    ORDER BY c.Priority, c.MWPropertyNo", list(proj, rel))
}

# Derived collateral columns (same definitions as the sheet / Access v2)
coll_derive <- function(d) {
  if (!nrow(d)) return(d)
  safe_div <- function(a, b) ifelse(!is.na(b) & b > 0, a / b, NA_real_)
  d$PerSF <- safe_div(d$SellerAppr, d$SQFT)
  d$PerUnit <- safe_div(d$SellerAppr, d$NumUnits)
  d$PerAcre <- safe_div(d$SellerAppr, d$Acreage)
  d$NetMwVx <- pmax(0, d$MwVx - d$SrLien)
  d$NetSeller <- pmax(0, d$SellerAppr - d$SrLien)
  d
}

# ---------------------------------------------------------------- input persistence (local files, never the server)
inputs_dir <- function() {
  base <- Sys.getenv("USERPROFILE", unset = path.expand("~"))
  d <- file.path(base, "BidReader", "inputs")
  if (!dir.exists(d)) dir.create(d, recursive = TRUE, showWarnings = FALSE)
  d
}
safe_name <- function(s) gsub("[^A-Za-z0-9_.-]", "_", s)
inputs_path <- function(proj, rel) file.path(inputs_dir(), paste0(safe_name(proj), "__", safe_name(rel), ".rds"))

save_inputs <- function(proj, rel, loans, ctx) {
  x <- list(version = 2, saved = Sys.time(),
            loans = lapply(loans, function(L) c(list(LoanNo = L$LoanNo), L[INPUT_KEYS])),
            ctx = ctx[c("Yield", "CutoffDt", "AnchorDt", "MinMonthsJ2", "HurdleYTM", "HurdleCY", "HurdleMOIC", "TrailDisp")])
  tryCatch(saveRDS(x, inputs_path(proj, rel)), error = function(e) message("save_inputs: ", conditionMessage(e)))
  invisible(x)
}

# Apply saved inputs to freshly loaded loans/ctx (unknown loans are ignored; missing loans keep defaults)
apply_saved_inputs <- function(proj, rel, loans, ctx) {
  p <- inputs_path(proj, rel)
  if (!file.exists(p)) return(list(loans = loans, ctx = ctx, found = FALSE))
  x <- tryCatch(readRDS(p), error = function(e) NULL)
  if (is.null(x)) return(list(loans = loans, ctx = ctx, found = FALSE))
  by_no <- setNames(x$loans, vapply(x$loans, `[[`, character(1), "LoanNo"))
  for (i in seq_along(loans)) {
    s <- by_no[[loans[[i]]$LoanNo]]
    if (!is.null(s)) for (k in INPUT_KEYS) if (!is.null(s[[k]])) loans[[i]][[k]] <- s[[k]]
  }
  for (k in names(x$ctx)) if (!is.null(x$ctx[[k]])) ctx[[k]] <- x$ctx[[k]]
  list(loans = loans, ctx = ctx, found = TRUE)
}

# ---------------------------------------------------------------- demo data (synthetic, no PII)
demo_projects <- function() c("DEMO Project")

demo_relationships <- function(proj) {
  data.frame(RelatedLoans = c("ALPHA HOLDINGS", "BRAVO PARTNERS", "CHARLIE LLC"), Loans = c(3L, 2L, 1L),
             UPB = c(2650000, 1180000, 420000), stringsAsFactors = FALSE)
}

demo_loans_df <- function(rel) {
  switch(rel,
    "ALPHA HOLDINGS" = data.frame(stringsAsFactors = FALSE,
      MWLoanNo = c("000005100324610", "000005100324611", "815102-810"),
      UPB = c(1500000, 850000, 300000), IntBal = c(40000, 12000, 22000), CRate = c(0.0725, 0.0650, 0.0900),
      DRate = c(0.1225, 0.1150, 0.1400), CPmt = c(11250, 6200, 3100),
      MatDt = as.Date(c("2031-06-01", "2029-03-15", "2027-11-01"))),
    "BRAVO PARTNERS" = data.frame(stringsAsFactors = FALSE,
      MWLoanNo = c("000006200111001", "000006200111002"), UPB = c(780000, 400000), IntBal = c(5000, 61000),
      CRate = c(0.0550, 0.0800), DRate = c(0.1050, 0.1300), CPmt = c(5400, 3600), MatDt = as.Date(c("2033-01-01", "2026-12-01"))),
    data.frame(stringsAsFactors = FALSE, MWLoanNo = "000007300222001", UPB = 420000, IntBal = 0, CRate = 0.0475, DRate = 0.0975,
               CPmt = 2900, MatDt = as.Date("2040-05-01")))
}

demo_load <- function(proj, rel) {
  df <- demo_loans_df(rel)
  set.seed(sum(utf8ToInt(rel)))
  anchor <- 202607
  pay <- do.call(rbind, lapply(seq_len(nrow(df)), function(i) {
    k <- 0:47
    pdv <- pd_add(anchor, -k)
    amt <- df$CPmt[i] * sample(c(1, 1, 1, 1, 0.5, 0, 1.2), 48, replace = TRUE)
    if (i == 2) amt[1:3] <- 0
    data.frame(LoanNo = df$MWLoanNo[i], pd = pdv, amount = round(amt, 2), stringsAsFactors = FALSE)
  }))
  pay <- pay[pay$amount != 0, ]
  coll <- demo_collateral(proj, rel)
  list(
    loans = lapply(seq_len(nrow(df)), function(i) with(df[i, ], new_loan(LoanNo = MWLoanNo, UPB = UPB, IntBal = IntBal, CRate = CRate,
                                                                          DRate = DRate, CPmt = CPmt, MatDt = MatDt))),
    pay = pay, tape_asof = as.Date("2026-07-31"), cf_start = as.Date("2026-07-01"),
    rel_coll = sum(coll$MwVx), coll_seller = sum(coll$SellerAppr), coll_count = nrow(coll))
}

demo_collateral <- function(proj, rel) {
  n <- switch(rel, "ALPHA HOLDINGS" = 3L, "BRAVO PARTNERS" = 2L, 1L)
  d <- data.frame(stringsAsFactors = FALSE,
    MWPropertyNo = 1000L + seq_len(n), Priority = seq_len(n), MWCollateralCode = c("CRE-OFF", "CRE-RET", "RES-SFR")[seq_len(n)],
    Description = c("Office building", "Retail strip", "Single family")[seq_len(n)],
    Address = c("100 Main St", "220 Market Ave", "8 Elm Ct")[seq_len(n)], City = c("Rochester", "Buffalo", "Albany")[seq_len(n)],
    State = "NY", Zip = c("14604", "14202", "12203")[seq_len(n)], County = c("Monroe", "Erie", "Albany")[seq_len(n)],
    SQFT = c(42000, 18500, 2100)[seq_len(n)], NumUnits = c(12, 6, 1)[seq_len(n)], Acreage = c(1.8, 2.4, 0.3)[seq_len(n)],
    ApprDt = as.Date(c("2025-11-15", "2024-06-30", "2026-02-01"))[seq_len(n)],
    SellerAppr = c(2100000, 950000, 310000)[seq_len(n)], MwVx = c(1850000, 800000, 290000)[seq_len(n)],
    TaxAnnual = c(48000, 21000, 6200)[seq_len(n)], TaxDelq = c(0, 14000, 0)[seq_len(n)], SrLien = c(0, 250000, 0)[seq_len(n)],
    LienPos = c("1st", "2nd", "1st")[seq_len(n)])
  d$MosAppr <- as.integer(datedif_vec(d$ApprDt, Sys.Date()))
  d
}

datedif_vec <- function(d1, d2) vapply(seq_along(d1), function(i) datedif_m(d1[i], d2), numeric(1))
