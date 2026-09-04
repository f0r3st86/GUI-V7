# app.R - Relationship Projection (Shiny)
# Run from this folder:  shiny::runApp()      or in RStudio: open app.R and click "Run App".
# Demo without SQL Server:  Sys.setenv(BR_DEMO = "1"); shiny::runApp()
#
# Read-only against MidwestDDi (see R/data.R). Inputs persist as local .rds files under
# %USERPROFILE%\BidReader\inputs. Engine fidelity: Rscript tests/test_engine.R (must PASS).

suppressPackageStartupMessages({
  library(shiny); library(bslib); library(rhandsontable); library(DT); library(htmlwidgets)
})
source("R/engine.R", local = TRUE); source("R/rows.R", local = TRUE); source("R/data.R", local = TRUE)

# ---------------------------------------------------------------- look: Excel-like palette
CSS <- "
  .handsontable td.br-cat { background:#F2F2F2; font-weight:600; color:#333; }
  .handsontable td.br-g   { background:#FFFFFF; text-align:right; }
  .handsontable td.br-c   { background:#F7F7F7; text-align:right; color:#444; }
  .handsontable td.br-r   { background:#E2EFDA; text-align:right; font-weight:600; }
  .handsontable td.br-y   { background:#FFFF99; text-align:right; }
  .handsontable td.br-s   { background:#5B9BD5; color:#fff; font-weight:700; }
  .handsontable td.br-t   { background:#FFFF99; text-align:center; }
  .handsontable td.br-t.htAutocomplete .htAutocompleteArrow { color:#7F6000; }
  .br-hdr { background:#4472C4 !important; color:#fff !important; font-weight:700; }
  .handsontable th { background:#4472C4; color:#fff; font-weight:700; }
  .handsontable td { font-family: Calibri, 'Segoe UI', sans-serif; font-size:12.5px; padding:2px 6px; }
  .br-status { font-family: Consolas, monospace; font-size:12px; color:#555; padding:4px 0; }
  .br-globals .form-group { margin-bottom:4px; }
  .br-globals label { font-size:11px; color:#555; margin-bottom:0; }
  .br-globals .form-control, .br-globals .selectize-input { font-size:12px; min-height:28px; padding:2px 6px; }
  .br-kpi { background:#E2EFDA; border:1px solid #A9D18E; border-radius:4px; padding:6px 10px; text-align:center; }
  .br-kpi .v { font-size:18px; font-weight:700; } .br-kpi .k { font-size:11px; color:#555; }
"

# ---------------------------------------------------------------- UI
ui <- page_fluid(
  theme = bs_theme(version = 5, bootswatch = "flatly", base_font = font_google("Inter"), font_scale = 0.9),
  tags$head(tags$style(HTML(CSS)), tags$title("Relationship Projection")),
  layout_columns(col_widths = c(3, 3, 6), fill = FALSE,
    selectInput("proj", "Project", choices = NULL),
    selectInput("rel", "Relationship", choices = NULL),
    div(class = "br-globals", layout_columns(col_widths = c(2, 2, 1, 1, 2, 1, 1, 1, 1), fill = FALSE,
      dateInput("anchor", "PMT History Date", value = Sys.Date()),
      dateInput("cutoff", "Cutoff Date", value = Sys.Date()),
      numericInput("yield", "Yield %", 15, min = 0, max = 100, step = 0.5),
      numericInput("j2", "YTM Min M", 0, min = 0, max = 360, step = 1),
      selectInput("traildisp", "Trail Selection", VALUE_LISTS$TrailDisp),
      numericInput("hytm", "Hurdle YTM %", 10, min = 0, step = 0.5),
      numericInput("hcy", "Hurdle CY %", 9, min = 0, step = 0.5),
      numericInput("hmoic", "Hurdle MOIC", 1.3, min = 0, step = 0.05),
      div(style = "padding-top:18px", actionButton("reload", "Reload", class = "btn-sm btn-outline-primary"))
    ))
  ),
  layout_columns(col_widths = c(2, 2, 2, 2, 2, 2), fill = FALSE,
    div(class = "br-kpi", div(class = "v", textOutput("kBid", inline = TRUE)), div(class = "k", "Relationship Bid")),
    div(class = "br-kpi", div(class = "v", textOutput("kPct", inline = TRUE)), div(class = "k", "Bid %")),
    div(class = "br-kpi", div(class = "v", textOutput("kCY", inline = TRUE)), div(class = "k", "12M CY")),
    div(class = "br-kpi", div(class = "v", textOutput("kMOIC", inline = TRUE)), div(class = "k", "MOIC")),
    div(class = "br-kpi", div(class = "v", textOutput("kYTM", inline = TRUE)), div(class = "k", "YTM (IRR)")),
    div(class = "br-kpi", div(class = "v", textOutput("kSell", inline = TRUE)), div(class = "k", "Sell YTM"))
  ),
  navset_card_underline(id = "tabs",
    nav_panel("Projection",
      div(style = "margin:6px 0", actionButton("undo", "Undo", class = "btn-sm"), actionButton("resetall", "Reset all inputs", class = "btn-sm btn-outline-danger"),
          downloadButton("export", "Export .xlsx", class = "btn-sm"), span(class = "br-status", textOutput("status", inline = TRUE))),
      rHandsontableOutput("hot", height = "calc(100vh - 330px)")),
    nav_panel("Optimal",
      layout_columns(col_widths = c(3, 9), fill = FALSE,
        div(selectInput("optloan", "Loan", choices = NULL), actionButton("usemonth", "Use selected month as Exit Month", class = "btn-sm btn-primary"),
            br(), br(), uiOutput("hurdleBox")),
        plotOutput("optplot", height = "260px")),
      DTOutput("opttab")),
    nav_panel("Pay History",
      h6("Payment statistics"), DTOutput("paystats"),
      h6(style = "margin-top:12px", "36-month payment matrix (newest first; orange = missed, yellow = short)"), DTOutput("paymatrix")),
    nav_panel("Collateral",
      layout_columns(col_widths = c(2, 2, 2, 2, 4), fill = FALSE,
        selectInput("unitsel", "What-if unit", c("SF", "Unit", "Acre")), numericInput("unitval", "$ per unit", 100, min = 0),
        div(class = "br-kpi", div(class = "v", textOutput("kWhatIf", inline = TRUE)), div(class = "k", "What-if value")),
        div(class = "br-kpi", div(class = "v", textOutput("kBidWhatIf", inline = TRUE)), div(class = "k", "Bid / What-if")),
        div(class = "br-kpi", div(class = "v", textOutput("kColl", inline = TRUE)), div(class = "k", "Rel Collateral (MwVx) / 90% line"))),
      DTOutput("colltab"))
  )
)

# ---------------------------------------------------------------- server
server <- function(input, output, session) {
  con <- br_connect()
  demo <- is.null(con)
  session$onSessionEnded(function() if (!is.null(con)) try(DBI::dbDisconnect(con), silent = TRUE))

  rv <- reactiveValues(rel = NULL, pay = NULL, coll = NULL, trails = NULL, undo = list(), status = "", proj = NULL, relname = NULL, loading = FALSE, expect = NULL)

  set_status <- function(...) rv$status <- paste0(format(Sys.time(), "%H:%M:%S"), "  ", sprintf(...))

  # -- pickers
  updateSelectInput(session, "proj", choices = br_projects(con))
  observeEvent(input$proj, {
    req(nzchar(input$proj))
    d <- br_relationships(con, input$proj)
    lab <- sprintf("%s  (%d loans, $%s)", d$RelatedLoans, d$Loans, formatC(d$UPB, format = "f", digits = 0, big.mark = ","))
    updateSelectInput(session, "rel", choices = setNames(d$RelatedLoans, lab))
  })

  # -- load a relationship
  load_rel <- function(proj, rel) {
    t0 <- proc.time()[["elapsed"]]
    x <- br_load_relationship(con, proj, rel)
    if (!length(x$loans)) { rv$rel <- NULL; set_status("No loans for %s", rel); return(invisible()) }
    ctx <- new_ctx(CutoffDt = if (!is.na(x$cf_start)) x$cf_start else Sys.Date(),
                   AnchorDt = if (!is.na(x$tape_asof)) x$tape_asof else Sys.Date(), RelColl = x$rel_coll)
    ctx$CfStartDt <- ctx$CutoffDt
    saved <- apply_saved_inputs(proj, rel, x$loans, ctx)
    loans <- saved$loans; ctx <- saved$ctx; ctx$CfStartDt <- ctx$CutoffDt
    tr <- compute_trails(loans, x$pay, ctx$AnchorDt)
    rv$loading <- TRUE
    rv$pay <- x$pay; rv$trails <- tr; rv$coll <- coll_derive(br_load_collateral(con, proj, rel))
    rv$rel <- calc_rel(list(loans = tr$loans, ctx = ctx)); rv$proj <- proj; rv$relname <- rel; rv$undo <- list()
    push_globals(ctx)
    updateSelectInput(session, "optloan", choices = c("Relationship", vapply(loans, `[[`, character(1), "LoanNo")))
    rv$loading <- FALSE
    set_status("%s: %d loans, %d pay rows%s, %s in %.0f ms", rel, length(loans), nrow(x$pay), if (saved$found) ", saved inputs restored" else "",
               if (demo) "DEMO data" else "sqlDueDiligence", (proc.time()[["elapsed"]] - t0) * 1000)
  }
  observeEvent(input$rel, { req(nzchar(input$rel)); load_rel(input$proj, input$rel) })
  observeEvent(input$reload, { req(rv$rel); load_rel(rv$proj, rv$relname) })

  # Send ctx globals to the header widgets and remember what we sent: the globals observer ignores
  # input values until they match (the update is a client round trip, so stale values arrive first).
  push_globals <- function(ctx) {
    rv$expect <- ctx_from_inputs(list(anchor = ctx$AnchorDt, cutoff = ctx$CutoffDt, yield = ctx$Yield * 100, j2 = ctx$MinMonthsJ2,
                                      traildisp = ctx$TrailDisp, hytm = ctx$HurdleYTM * 100, hcy = ctx$HurdleCY * 100, hmoic = ctx$HurdleMOIC), ctx)
    updateDateInput(session, "anchor", value = ctx$AnchorDt); updateDateInput(session, "cutoff", value = ctx$CutoffDt)
    updateNumericInput(session, "yield", value = ctx$Yield * 100); updateNumericInput(session, "j2", value = ctx$MinMonthsJ2)
    updateSelectInput(session, "traildisp", selected = ctx$TrailDisp)
    updateNumericInput(session, "hytm", value = ctx$HurdleYTM * 100); updateNumericInput(session, "hcy", value = ctx$HurdleCY * 100)
    updateNumericInput(session, "hmoic", value = ctx$HurdleMOIC)
  }
  ctx_from_inputs <- function(inp, base) {
    new <- base
    new$AnchorDt <- as.Date(inp$anchor); new$CutoffDt <- as.Date(inp$cutoff); new$CfStartDt <- as.Date(inp$cutoff)
    new$Yield <- inp$yield / 100; new$MinMonthsJ2 <- inp$j2; new$TrailDisp <- inp$traildisp
    new$HurdleYTM <- inp$hytm / 100; new$HurdleCY <- inp$hcy / 100; new$HurdleMOIC <- inp$hmoic
    new
  }
  same_globals <- function(a, b) {
    all(a$AnchorDt == b$AnchorDt, a$CutoffDt == b$CutoffDt, a$TrailDisp == b$TrailDisp,
        abs(c(a$Yield - b$Yield, a$MinMonthsJ2 - b$MinMonthsJ2, a$HurdleYTM - b$HurdleYTM, a$HurdleCY - b$HurdleCY, a$HurdleMOIC - b$HurdleMOIC)) < 1e-9)
  }

  # -- shared edit path
  push_undo <- function() { rv$undo <- c(list(list(loans = rv$rel$loans, ctx = rv$rel$ctx)), head(rv$undo, 19)) }
  recalc <- function(loans = rv$rel$loans, ctx = rv$rel$ctx, retrail = FALSE) {
    t0 <- proc.time()[["elapsed"]]
    if (retrail) { tr <- compute_trails(loans, rv$pay, ctx$AnchorDt); loans <- tr$loans; rv$trails <- tr }
    rv$rel <- calc_rel(list(loans = loans, ctx = ctx))
    save_inputs(rv$proj, rv$relname, rv$rel$loans, rv$rel$ctx)
    (proc.time()[["elapsed"]] - t0) * 1000
  }
  apply_input <- function(k, key, value) {
    c0 <- coerce_input(key, value)
    if (!c0$ok) { set_status("Loan %s %s: %s (reverted)", rv$rel$loans[[k]]$LoanNo, key, c0$note); return(FALSE) }
    push_undo()
    old_bid <- rv$rel$tot$BidUsed
    loans <- rv$rel$loans; loans[[k]][[key]] <- c0$value
    ms <- recalc(loans)
    set_status("%s %s -> %s | Bid %s -> %s | %.0f ms", loans[[k]]$LoanNo, key, as.character(c0$value),
               fmt_value(old_bid, "money"), fmt_value(rv$rel$tot$BidUsed, "money"), ms)
    TRUE
  }

  # -- globals
  observe({
    req(rv$rel, !rv$loading)
    ctx <- isolate(rv$rel$ctx)
    inp <- list(anchor = input$anchor, cutoff = input$cutoff, yield = input$yield, j2 = input$j2, traildisp = input$traildisp,
                hytm = input$hytm, hcy = input$hcy, hmoic = input$hmoic)
    req(!is.null(inp$anchor), !is.null(inp$cutoff), !is.null(inp$traildisp), !is.na(inp$yield), !is.na(inp$j2), !is.na(inp$hytm), !is.na(inp$hcy), !is.na(inp$hmoic))
    new <- ctx_from_inputs(inp, ctx)
    ex <- isolate(rv$expect)
    if (!is.null(ex)) {                       # waiting for our own update to round-trip
      if (same_globals(new, ex)) rv$expect <- NULL
      return(invisible())
    }
    if (!same_globals(new, ctx)) {
      isolate({ push_undo(); ms <- recalc(ctx = new, retrail = new$AnchorDt != ctx$AnchorDt); set_status("Globals updated | Bid %s | %.0f ms", fmt_value(rv$rel$tot$BidUsed, "money"), ms) })
    }
  })

  observeEvent(input$undo, {
    req(length(rv$undo) > 0)
    u <- rv$undo[[1]]; rv$undo <- rv$undo[-1]
    rv$loading <- TRUE
    ms <- recalc(u$loans, u$ctx, retrail = TRUE)
    push_globals(u$ctx)
    rv$loading <- FALSE
    set_status("Undo | Bid %s | %.0f ms", fmt_value(rv$rel$tot$BidUsed, "money"), ms)
  })
  observeEvent(input$resetall, {
    req(rv$rel)
    showModal(modalDialog("Reset every yellow input on this relationship to the sheet defaults?", footer = tagList(modalButton("Cancel"),
              actionButton("resetok", "Reset", class = "btn-danger")), easyClose = TRUE))
  })
  observeEvent(input$resetok, {
    removeModal(); push_undo()
    loans <- lapply(rv$rel$loans, function(L) { d <- loan_defaults(); for (k in INPUT_KEYS) L[[k]] <- d[[k]]; L })
    ms <- recalc(loans); set_status("All inputs reset | Bid %s | %.0f ms", fmt_value(rv$rel$tot$BidUsed, "money"), ms)
  })

  # -- projection sheet
  sheet_df <- reactive({
    req(rv$rel)
    R <- rv$rel; C <- R$ctx; n <- length(R$loans)
    cols <- lapply(seq_len(n), function(i) vapply(seq_len(nrow(ROW_DEFS)), function(r) {
      k <- ROW_DEFS$key[r]; kind <- ROW_DEFS$kind[r]
      if (kind == "s") return("")
      v <- row_value(R$loans[[i]], k, C)
      if (kind %in% c("y", "Y", "t")) {                       # editable: show the raw-ish value
        if (k == "BidOverride" && (is.null(v) || is.na(v))) return("")
        if (is.character(v)) return(v)
        fmt <- ROW_DEFS$fmt[r]
        return(if (fmt %in% c("pct", "pct2")) sprintf("%.2f%%", v * 100) else if (fmt == "money") fmt_value(v, "money") else as.character(v))
      }
      fmt_value(v, row_fmt(k, ROW_DEFS$fmt[r], C))
    }, character(1)))
    tot <- vapply(seq_len(nrow(ROW_DEFS)), function(r) {
      k <- ROW_DEFS$key[r]; if (ROW_DEFS$kind[r] == "s") return("")
      v <- row_value(R$tot, k, C, is_total = TRUE); if (length(v) == 1 && is.na(v)) return("")
      fmt_value(v, row_fmt(k, ROW_DEFS$fmt[r], C))
    }, character(1))
    df <- data.frame(Category = ROW_DEFS$caption, stringsAsFactors = FALSE)
    for (i in seq_len(n)) df[[R$loans[[i]]$LoanNo]] <- cols[[i]]
    df[["Relationship"]] <- tot
    df
  })

  output$hot <- renderRHandsontable({
    df <- sheet_df(); n <- ncol(df) - 2
    kinds <- ROW_DEFS$kind; keys <- ROW_DEFS$key
    lists <- VALUE_LISTS
    cells_js <- JS(sprintf("
      function(row, col, prop) {
        var kinds = %s, keys = %s, lists = %s, nLoans = %d, cp = {};
        var kind = kinds[row];
        if (col === 0) { cp.readOnly = true; cp.className = kind === 's' ? 'br-s' : 'br-cat'; return cp; }
        if (kind === 's') { cp.readOnly = true; cp.className = 'br-s'; return cp; }
        if (col > nLoans) { cp.readOnly = true; cp.className = 'br-r'; return cp; }   /* Relationship column */
        if (kind === 'y') { cp.readOnly = false; cp.className = 'br-y'; return cp; }
        if (kind === 'Y' || kind === 't') { cp.readOnly = false; cp.type = 'dropdown'; cp.strict = false; cp.allowInvalid = true;
          cp.source = lists[kind === 't' ? 'TrailDisp' : keys[row]]; cp.className = 'br-t'; return cp; }
        cp.readOnly = true; cp.className = kind === 'r' ? 'br-r' : (kind === 'c' ? 'br-c' : 'br-g'); return cp;
      }", jsonlite::toJSON(kinds), jsonlite::toJSON(keys), jsonlite::toJSON(lists), n))
    rhandsontable(df, rowHeaders = NULL, stretchH = "none", cells = cells_js, useTypes = FALSE, manualColumnResize = TRUE,
                  outsideClickDeselects = FALSE, colWidths = c(200, rep(136, n), 136), rowHeights = 26) %>%
      hot_table(highlightRow = TRUE, contextMenu = FALSE)
  })

  observeEvent(input$hot$changes$changes, {
    ch <- input$hot$changes$changes
    req(rv$rel, length(ch) > 0)
    n <- length(rv$rel$loans)
    for (c in ch) {
      row <- c[[1]] + 1; col <- c[[2]]; old <- c[[3]]; new <- c[[4]]
      if (is.null(new) || identical(old, new) || col < 1 || col > n) next
      key <- ROW_DEFS$key[row]; kind <- ROW_DEFS$kind[row]
      if (kind == "t") { updateSelectInput(session, "traildisp", selected = if (tolower(new) %in% tolower(VALUE_LISTS$TrailDisp)) VALUE_LISTS$TrailDisp[match(tolower(new), tolower(VALUE_LISTS$TrailDisp))] else rv$rel$ctx$TrailDisp); next }
      if (!(kind %in% c("y", "Y"))) next
      apply_input(col, key, new)
    }
  }, ignoreInit = TRUE)

  # -- KPIs
  kpi <- function(f, fmt) renderText({ req(rv$rel); fmt_value(rv$rel$tot[[f]], fmt) })
  output$kBid <- kpi("BidUsed", "money"); output$kPct <- kpi("BidPct", "pct"); output$kCY <- kpi("CY12", "pct")
  output$kMOIC <- kpi("MOIC", "num2"); output$kYTM <- kpi("YtmIRR", "pct2"); output$kSell <- kpi("SellYTM", "pct2")
  output$status <- renderText(rv$status)

  # -- Optimal
  opt_sel <- reactive({
    req(rv$rel, input$optloan)
    if (input$optloan == "Relationship") list(opt = rv$rel$rel_opt, L = rv$rel$tot, k = 0L)
    else { k <- match(input$optloan, vapply(rv$rel$loans, `[[`, character(1), "LoanNo")); req(!is.na(k)); list(opt = rv$rel$loans[[k]]$Opt, L = rv$rel$loans[[k]], k = k) }
  })
  output$hurdleBox <- renderUI({
    s <- opt_sel(); L <- s$L
    f <- function(v) if (is.na(v)) "\u2014" else as.character(v)
    tags$table(class = "table table-sm", tags$tbody(
      tags$tr(tags$td("Min month \u00b7 YTM \u2265 hurdle"), tags$td(f(L$MinHYTM))), tags$tr(tags$td("Min month \u00b7 12M CY \u2265 hurdle"), tags$td(f(L$MinHCY))),
      tags$tr(tags$td("Min month \u00b7 MOIC \u2265 hurdle"), tags$td(f(L$MinHMOIC))), tags$tr(tags$td(strong("Min month \u00b7 all hurdles")), tags$td(strong(f(L$MinHAll))))))
  })
  output$opttab <- renderDT({
    s <- opt_sel(); d <- s$opt
    d$Exit <- ifelse(d$M == (if (s$k == 0) max(vapply(rv$rel$loans, `[[`, integer(1), "ExitMonth")) else s$L$ExitMonth), "\u25c0", "")
    d <- d[, c("M", "Exit", "Bid", "BidPct", "ImpDPO", "CY12", "MOIC", "YTM", "PassYTM", "PassCY", "PassMOIC", "PassAll")]
    for (f in c("PassYTM", "PassCY", "PassMOIC", "PassAll")) d[[f]] <- ifelse(d[[f]], "\u2713", "")
    datatable(d, rownames = FALSE, selection = "single", options = list(pageLength = 60, dom = "t", scrollY = "calc(100vh - 560px)", scrollCollapse = TRUE),
              colnames = c("Month", "", "Bid", "Bid %", "Implied DPO", "12M CY", "MOIC", "YTM", "YTM \u2713", "CY \u2713", "MOIC \u2713", "All \u2713")) %>%
      formatCurrency("Bid", digits = 0) %>% formatPercentage(c("BidPct", "ImpDPO", "CY12"), 1) %>% formatPercentage("YTM", 2) %>% formatRound("MOIC", 2) %>%
      formatStyle("PassAll", target = "row", backgroundColor = styleEqual("\u2713", "#E2EFDA"))
  })
  output$optplot <- renderPlot({
    s <- opt_sel(); d <- s$opt; C <- rv$rel$ctx
    op <- par(mar = c(3.5, 4, 1, 4), mgp = c(2.2, 0.6, 0)); on.exit(par(op))
    ylim <- c(min(0, d$YTM, na.rm = TRUE), min(1, max(c(d$CY12, d$YTM, C$HurdleYTM, C$HurdleCY) * 1.05, na.rm = TRUE)))
    plot(d$M, d$YTM, type = "l", lwd = 2, col = "#4472C4", ylim = ylim, xlab = "Exit month", ylab = "YTM / 12M CY", yaxt = "n", las = 1)
    axis(2, at = pretty(ylim), labels = paste0(round(pretty(ylim) * 100), "%"), las = 1)
    lines(d$M, d$CY12, lwd = 2, col = "#ED7D31"); abline(h = C$HurdleYTM, col = "#4472C4", lty = 3); abline(h = C$HurdleCY, col = "#ED7D31", lty = 3)
    par(new = TRUE); plot(d$M, d$MOIC, type = "l", lwd = 2, col = "#70AD47", axes = FALSE, xlab = "", ylab = ""); axis(4, las = 1); mtext("MOIC", 4, line = 2.4)
    abline(h = C$HurdleMOIC, col = "#70AD47", lty = 3)
    if (!is.na(s$L$MinHAll)) abline(v = s$L$MinHAll, col = "grey40", lty = 2)
    legend("topright", c("YTM", "12M CY", "MOIC", "hurdles"), col = c("#4472C4", "#ED7D31", "#70AD47", "grey40"), lty = c(1, 1, 1, 3), lwd = 2, bty = "n", cex = 0.85, horiz = TRUE)
  })
  observeEvent(input$usemonth, {
    s <- opt_sel(); r <- input$opttab_rows_selected; req(length(r) == 1)
    m <- s$opt$M[r]
    if (s$k == 0) { push_undo(); loans <- rv$rel$loans; for (i in seq_along(loans)) loans[[i]]$ExitMonth <- as.integer(m); ms <- recalc(loans)
      set_status("Exit Month %d applied to all loans | Bid %s | %.0f ms", m, fmt_value(rv$rel$tot$BidUsed, "money"), ms) }
    else apply_input(s$k, "ExitMonth", m)
  })

  # -- Pay History
  output$paystats <- renderDT({
    req(rv$rel); R <- rv$rel; C <- R$ctx
    cols <- c(R$loans, list(R$tot))
    stat <- function(f) vapply(cols, f, numeric(1))
    ip <- function(L) L$UPB * L$CRate / 12
    d <- data.frame(Statistic = c("Contract PMT", "Interest PMT", "3M Trail", "6M Trail", "12M Trail", "24M Trail"), stringsAsFactors = FALSE)
    rows <- list(function(L) L$CPmt, function(L) ip(L),
                 function(L) trail_display(L$T3, 3, C$TrailDisp, L$CPmt, ip(L)), function(L) trail_display(L$T6, 6, C$TrailDisp, L$CPmt, ip(L)),
                 function(L) trail_display(L$T12, 12, C$TrailDisp, L$CPmt, ip(L)), function(L) trail_display(L$T24, 24, C$TrailDisp, L$CPmt, ip(L)))
    m <- sapply(rows, stat); if (is.null(dim(m))) m <- matrix(m, nrow = 1)
    m <- t(m); colnames(m) <- c(vapply(R$loans, `[[`, character(1), "LoanNo"), "Relationship")
    d <- cbind(d, as.data.frame(m, check.names = FALSE))
    fmt <- row_fmt("T3", "money", C)
    dt <- datatable(d, rownames = FALSE, options = list(dom = "t", ordering = FALSE), class = "compact stripe")
    if (fmt == "money") dt <- formatCurrency(dt, 2:ncol(d), digits = 0) else if (fmt == "pct") dt <- formatPercentage(dt, 2:ncol(d), 1) else dt <- formatRound(dt, 2:ncol(d), 1)
    dt
  })
  output$paymatrix <- renderDT({
    req(rv$rel, rv$trails); R <- rv$rel; tr <- rv$trails
    m <- tr$matrix; d <- data.frame(Month = tr$labels, as.data.frame(m, check.names = FALSE), Total = rowSums(m), check.names = FALSE)
    dt <- datatable(d, rownames = FALSE, options = list(dom = "t", pageLength = 36, ordering = FALSE, scrollY = "calc(100vh - 560px)", scrollCollapse = TRUE), class = "compact") %>%
      formatCurrency(2:ncol(d), digits = 0)
    for (i in seq_along(R$loans)) {
      cp <- R$loans[[i]]$CPmt
      dt <- formatStyle(dt, colnames(m)[i], backgroundColor = styleInterval(c(0.005, 0.9 * cp - 1e-9), c("#FCE4D6", "#FFF2CC", "white")))
    }
    dt
  })

  # -- Collateral
  output$colltab <- renderDT({
    req(rv$rel); d <- rv$coll
    if (!nrow(d)) return(datatable(data.frame(Note = "No collateral rows for this relationship"), rownames = FALSE, options = list(dom = "t")))
    show <- c("Priority", "MWPropertyNo", "MWCollateralCode", "Description", "Address", "City", "State", "County", "SQFT", "NumUnits", "Acreage", "ApprDt", "MosAppr",
              "SellerAppr", "PerSF", "PerUnit", "PerAcre", "MwVx", "SrLien", "LienPos", "NetMwVx", "NetSeller", "TaxAnnual", "TaxDelq")
    tot <- d[1, show]; tot[] <- NA; tot$Description <- "TOTAL"
    for (f in c("SQFT", "NumUnits", "Acreage", "SellerAppr", "MwVx", "SrLien", "NetMwVx", "NetSeller", "TaxAnnual", "TaxDelq")) tot[[f]] <- sum(d[[f]], na.rm = TRUE)
    dd <- rbind(d[, show], tot)
    datatable(dd, rownames = FALSE, options = list(dom = "t", pageLength = 200, ordering = FALSE, scrollX = TRUE), class = "compact stripe",
              colnames = c("Pri", "Prop#", "Code", "Description", "Address", "City", "St", "County", "SF", "Units", "Acres", "Appr Dt", "Mos", "Seller Appr",
                           "$/SF", "$/Unit", "$/Acre", "MwVx", "Sr Lien", "Pos", "Net MwVx", "Net Seller", "Ann Tax", "Delq Tax")) %>%
      formatCurrency(c("SellerAppr", "PerSF", "PerUnit", "PerAcre", "MwVx", "SrLien", "NetMwVx", "NetSeller", "TaxAnnual", "TaxDelq"), digits = 0) %>%
      formatRound(c("SQFT", "NumUnits"), 0) %>% formatRound("Acreage", 2) %>% formatDate("ApprDt", "toLocaleDateString") %>%
      formatStyle("Description", target = "row", fontWeight = styleEqual("TOTAL", "bold"))
  })
  whatif <- reactive({
    req(rv$rel); d <- rv$coll; if (!nrow(d)) return(0)
    u <- switch(input$unitsel, SF = sum(d$SQFT, na.rm = TRUE), Unit = sum(d$NumUnits, na.rm = TRUE), sum(d$Acreage, na.rm = TRUE))
    u * ifelse(is.na(input$unitval), 0, input$unitval)
  })
  output$kWhatIf <- renderText(fmt_value(whatif(), "money"))
  output$kBidWhatIf <- renderText({ w <- whatif(); if (w > 0) fmt_value(rv$rel$tot$BidUsed / w, "pct") else "\u2014" })
  output$kColl <- renderText({ req(rv$rel); paste(fmt_value(rv$rel$ctx$RelColl, "money"), "/", fmt_value(0.9 * rv$rel$ctx$RelColl, "money")) })

  # -- Export
  output$export <- downloadHandler(
    filename = function() sprintf("BidReader_%s_%s.xlsx", safe_name(rv$relname), format(Sys.Date(), "%Y%m%d")),
    content = function(file) {
      req(rv$rel); R <- rv$rel
      wb <- openxlsx::createWorkbook()
      openxlsx::addWorksheet(wb, "Projection"); openxlsx::writeData(wb, "Projection", sheet_df())
      ys <- openxlsx::createStyle(fgFill = "#FFFF99"); gs <- openxlsx::createStyle(fgFill = "#E2EFDA", textDecoration = "bold")
      for (r in which(ROW_DEFS$kind %in% c("y", "Y", "t"))) openxlsx::addStyle(wb, "Projection", ys, rows = r + 1, cols = 2:(length(R$loans) + 1), gridExpand = TRUE)
      for (r in which(ROW_DEFS$kind == "r")) openxlsx::addStyle(wb, "Projection", gs, rows = r + 1, cols = 2:(length(R$loans) + 2), gridExpand = TRUE)
      openxlsx::setColWidths(wb, "Projection", cols = 1:(length(R$loans) + 2), widths = c(26, rep(16, length(R$loans) + 1)))
      opt <- do.call(rbind, c(lapply(R$loans, function(L) cbind(LoanNo = L$LoanNo, L$Opt)), list(cbind(LoanNo = "Relationship", R$rel_opt))))
      openxlsx::addWorksheet(wb, "Optimal"); openxlsx::writeData(wb, "Optimal", opt)
      tr <- rv$trails; pm <- data.frame(Month = tr$labels, as.data.frame(tr$matrix, check.names = FALSE), Total = rowSums(tr$matrix), check.names = FALSE)
      openxlsx::addWorksheet(wb, "PayHistory"); openxlsx::writeData(wb, "PayHistory", pm)
      openxlsx::addWorksheet(wb, "Collateral"); openxlsx::writeData(wb, "Collateral", rv$coll)
      openxlsx::addWorksheet(wb, "Inputs"); openxlsx::writeData(wb, "Inputs", do.call(rbind, lapply(R$loans, function(L) data.frame(LoanNo = L$LoanNo, as.data.frame(L[INPUT_KEYS], stringsAsFactors = FALSE)))))
      openxlsx::saveWorkbook(wb, file, overwrite = TRUE)
    })
}

shinyApp(ui, server)
