# Relationship Projection - modern layout (Shiny)
# Only the projection: one card per loan with grouped controls and live result tiles, a relationship
# summary, and cash-flow / bid-curve charts. Same engine and data layer as ../app.R (read-only).
#
#   shiny::runApp("shiny/modern")                     live data via the sqlDueDiligence DSN
#   Sys.setenv(BR_DEMO = "1"); shiny::runApp("shiny/modern")   synthetic demo, no SQL Server

suppressPackageStartupMessages({ library(shiny); library(bslib); library(ggplot2) })
source("../R/engine.R", local = TRUE); source("../R/rows.R", local = TRUE); source("../R/data.R", local = TRUE)

CSS <- "
  :root { --br-accent:#2563EB; --br-good:#16A34A; --br-bad:#DC2626; --br-muted:#6B7280; }
  .card { border:0; box-shadow:0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04); }
  .loan-card .card-header { font-weight:700; font-size:15px; display:flex; justify-content:space-between; align-items:center; }
  .loan-card .badge { font-weight:600; letter-spacing:.02em; }
  .facts { display:grid; grid-template-columns:repeat(4, 1fr); gap:4px 10px; font-size:12px; color:var(--br-muted); margin-bottom:8px; }
  .facts b { color:inherit; font-weight:600; display:block; font-size:13px; }
  .tiles { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin:6px 0 10px; }
  .tile { border-radius:8px; padding:6px 8px; background:rgba(37,99,235,.07); }
  .tile.big { background:rgba(22,163,74,.12); grid-column:span 3; display:flex; justify-content:space-between; align-items:baseline; }
  .tile .k { font-size:11px; color:var(--br-muted); text-transform:uppercase; letter-spacing:.04em; }
  .tile .v { font-size:15px; font-weight:700; } .tile.big .v { font-size:22px; }
  .tile .v.neg { color:var(--br-bad); }
  .accordion-button { padding:8px 12px; font-size:13px; font-weight:600; }
  .accordion-body { padding:8px 12px; }
  .accordion-body .form-group, .accordion-body .shiny-input-container { margin-bottom:6px; }
  .accordion-body label { font-size:11.5px; color:var(--br-muted); margin-bottom:1px; }
  .accordion-body .form-control, .accordion-body .selectize-input { font-size:12.5px; min-height:30px; padding:3px 8px; }
  .irs { font-size:11px; } .irs--shiny .irs-bar, .irs--shiny .irs-single { background:var(--br-accent); border-color:var(--br-accent); }
  .status { font-size:12px; color:var(--br-muted); }
  .bslib-value-box .value-box-title { font-size:12px; } .bslib-value-box .value-box-value { font-size:22px; }
  .sidebar .form-group, .sidebar .shiny-input-container { margin-bottom:8px; }
  .sidebar label { font-size:12px; margin-bottom:2px; }
"

fmt_or <- function(v, fmt) if (is.null(v) || length(v) == 0 || is.na(v)) "\u2014" else fmt_value(v, fmt)

# ---------------------------------------------------------------- UI
ui <- page_sidebar(
  title = tags$span(tags$span("Relationship Projection", style = "font-weight:700"),
                    tags$span(class = "status ms-3", textOutput("status", inline = TRUE))),
  theme = bs_theme(version = 5, preset = "shiny", base_font = font_google("Inter"), font_scale = 0.92, primary = "#2563EB"),
  fillable = FALSE,
  sidebar = sidebar(width = 290, open = TRUE,
    tags$head(tags$style(HTML(CSS)), tags$title("Relationship Projection")),
    selectInput("proj", "Project", choices = NULL),
    selectInput("rel", "Relationship", choices = NULL),
    div(class = "d-flex gap-2 mb-2", actionButton("reload", "Reload", class = "btn-sm btn-outline-primary"),
        actionButton("undo", "Undo", class = "btn-sm btn-outline-secondary"),
        actionButton("resetall", "Reset", class = "btn-sm btn-outline-danger")),
    hr(),
    h6("Assumptions"),
    numericInput("yield", "Yield %", 15, min = 0, max = 100, step = 0.5),
    dateInput("cutoff", "Cutoff date", value = Sys.Date()),
    dateInput("anchor", "PMT history date", value = Sys.Date()),
    numericInput("j2", "YTM minimum months", 0, min = 0, max = 360, step = 1),
    selectInput("traildisp", "Trail selection", VALUE_LISTS$TrailDisp),
    h6("Hurdles", class = "mt-2"),
    layout_columns(col_widths = c(4, 4, 4), gap = "6px",
      numericInput("hytm", "YTM %", 10, min = 0, step = 0.5), numericInput("hcy", "CY %", 9, min = 0, step = 0.5),
      numericInput("hmoic", "MOIC", 1.3, min = 0, step = 0.05)),
    hr(),
    downloadButton("export", "Export sheet (.xlsx)", class = "btn-sm w-100"),
    div(class = "mt-3", input_dark_mode(id = "dark", mode = "light"))
  ),
  layout_columns(col_widths = c(2, 2, 2, 2, 2, 2), fill = FALSE, gap = "10px",
    value_box("Relationship bid", textOutput("kBid"), theme = "primary"),
    value_box("Bid %", textOutput("kPct"), theme = "secondary"),
    value_box("12M cash yield", textOutput("kCY"), theme = "secondary"),
    value_box("MOIC", textOutput("kMOIC"), theme = "secondary"),
    value_box("YTM (IRR)", textOutput("kYTM"), theme = "secondary"),
    value_box("Min hurdle month", textOutput("kMinH"), theme = "success")
  ),
  uiOutput("cards"),
  layout_columns(col_widths = c(7, 5), fill = FALSE, gap = "10px",
    card(card_header("Net cash flow by month"), plotOutput("cfplot", height = "260px")),
    card(card_header("Relationship bid by exit month"), plotOutput("bidplot", height = "260px"))
  )
)

# ---------------------------------------------------------------- server
server <- function(input, output, session) {
  con <- br_connect(); demo <- is.null(con)
  session$onSessionEnded(function() if (!is.null(con)) try(DBI::dbDisconnect(con), silent = TRUE))
  rv <- reactiveValues(rel = NULL, pay = NULL, undo = list(), status = "", proj = NULL, relname = NULL, loading = FALSE, expect = NULL, gen = 0L)
  obs <- list()
  set_status <- function(...) rv$status <- paste0(format(Sys.time(), "%H:%M:%S"), "  ", sprintf(...))

  updateSelectInput(session, "proj", choices = br_projects(con))
  observeEvent(input$proj, {
    req(nzchar(input$proj)); d <- br_relationships(con, input$proj)
    updateSelectInput(session, "rel", choices = setNames(d$RelatedLoans, sprintf("%s  (%d loans, $%s)", d$RelatedLoans, d$Loans, formatC(d$UPB, format = "f", digits = 0, big.mark = ","))))
  })

  # -- header globals (round-trip safe, as in ../app.R)
  ctx_from_inputs <- function(inp, base) {
    new <- base
    new$AnchorDt <- as.Date(inp$anchor); new$CutoffDt <- as.Date(inp$cutoff); new$CfStartDt <- as.Date(inp$cutoff)
    new$Yield <- inp$yield / 100; new$MinMonthsJ2 <- inp$j2; new$TrailDisp <- inp$traildisp
    new$HurdleYTM <- inp$hytm / 100; new$HurdleCY <- inp$hcy / 100; new$HurdleMOIC <- inp$hmoic
    new
  }
  same_globals <- function(a, b) all(a$AnchorDt == b$AnchorDt, a$CutoffDt == b$CutoffDt, a$TrailDisp == b$TrailDisp,
    abs(c(a$Yield - b$Yield, a$MinMonthsJ2 - b$MinMonthsJ2, a$HurdleYTM - b$HurdleYTM, a$HurdleCY - b$HurdleCY, a$HurdleMOIC - b$HurdleMOIC)) < 1e-9)
  push_globals <- function(ctx) {
    rv$expect <- ctx
    updateNumericInput(session, "yield", value = ctx$Yield * 100); updateDateInput(session, "cutoff", value = ctx$CutoffDt)
    updateDateInput(session, "anchor", value = ctx$AnchorDt); updateNumericInput(session, "j2", value = ctx$MinMonthsJ2)
    updateSelectInput(session, "traildisp", selected = ctx$TrailDisp)
    updateNumericInput(session, "hytm", value = ctx$HurdleYTM * 100); updateNumericInput(session, "hcy", value = ctx$HurdleCY * 100)
    updateNumericInput(session, "hmoic", value = ctx$HurdleMOIC)
  }

  recalc <- function(loans = rv$rel$loans, ctx = rv$rel$ctx, retrail = FALSE, only = NULL) {
    t0 <- proc.time()[["elapsed"]]
    if (retrail) { tr <- compute_trails(loans, rv$pay, ctx$AnchorDt); loans <- tr$loans }
    rel <- list(loans = loans, ctx = ctx, tot = rv$rel$tot, rel_opt = rv$rel$rel_opt)
    rv$rel <- if (is.null(only)) calc_rel(rel) else calc_rel_loan(rel, only)
    save_inputs(rv$proj, rv$relname, rv$rel$loans, rv$rel$ctx)
    (proc.time()[["elapsed"]] - t0) * 1000
  }
  push_undo <- function() rv$undo <- c(list(list(loans = rv$rel$loans, ctx = rv$rel$ctx)), head(rv$undo, 19))

  load_rel <- function(proj, rel) {
    t0 <- proc.time()[["elapsed"]]
    x <- br_load_relationship(con, proj, rel)
    if (!length(x$loans)) { rv$rel <- NULL; set_status("No loans for %s", rel); return(invisible()) }
    ctx <- new_ctx(CutoffDt = if (!is.na(x$cf_start)) x$cf_start else Sys.Date(), AnchorDt = if (!is.na(x$tape_asof)) x$tape_asof else Sys.Date(), RelColl = x$rel_coll)
    saved <- apply_saved_inputs(proj, rel, x$loans, ctx); loans <- saved$loans; ctx <- saved$ctx; ctx$CfStartDt <- ctx$CutoffDt
    tr <- compute_trails(loans, x$pay, ctx$AnchorDt)
    rv$loading <- TRUE
    rv$pay <- x$pay; rv$proj <- proj; rv$relname <- rel; rv$undo <- list()
    rv$rel <- calc_rel(list(loans = tr$loans, ctx = ctx))
    push_globals(ctx)
    rv$gen <- rv$gen + 1L                     # re-render the cards once
    rv$loading <- FALSE
    set_status("%s: %d loans%s, %s, %.0f ms", rel, length(loans), if (saved$found) ", saved inputs restored" else "", if (demo) "DEMO data" else "sqlDueDiligence", (proc.time()[["elapsed"]] - t0) * 1000)
  }
  observeEvent(input$rel, { req(nzchar(input$rel)); load_rel(input$proj, input$rel) })
  observeEvent(input$reload, { req(rv$rel); load_rel(rv$proj, rv$relname) })

  observe({
    req(rv$rel, !rv$loading); ctx <- isolate(rv$rel$ctx)
    inp <- list(anchor = input$anchor, cutoff = input$cutoff, yield = input$yield, j2 = input$j2, traildisp = input$traildisp, hytm = input$hytm, hcy = input$hcy, hmoic = input$hmoic)
    req(!is.null(inp$anchor), !is.null(inp$cutoff), !is.null(inp$traildisp), !is.na(inp$yield), !is.na(inp$j2), !is.na(inp$hytm), !is.na(inp$hcy), !is.na(inp$hmoic))
    new <- ctx_from_inputs(inp, ctx); ex <- isolate(rv$expect)
    if (!is.null(ex)) { if (same_globals(new, ex)) rv$expect <- NULL; return(invisible()) }
    if (!same_globals(new, ctx)) isolate({ push_undo(); ms <- recalc(ctx = new, retrail = new$AnchorDt != ctx$AnchorDt)
      set_status("Assumptions updated | Bid %s | %.0f ms", fmt_value(rv$rel$tot$BidUsed, "money"), ms) })
  })

  # -- loan input path
  PCT_KEYS <- c("TrailPct", "UserRate", "DPOPct", "ValCapPct", "YTMTgt")
  apply_input <- function(k, key, value) {
    L <- rv$rel$loans[[k]]
    if (key != "BidOverride" && !(key %in% names(VALUE_LISTS)) && (length(value) == 0 || is.na(value))) return(FALSE)
    if (key %in% PCT_KEYS) value <- min(1, max(0, as.numeric(value) / 100))
    c0 <- coerce_input(key, value)
    if (!c0$ok) { showNotification(sprintf("%s %s: %s", L$LoanNo, key, c0$note), type = "error", duration = 4); return(FALSE) }
    cur <- L[[key]]
    if (identical(cur, c0$value) || (is.numeric(cur) && is.numeric(c0$value) && isTRUE(all.equal(cur, c0$value)))) return(FALSE)
    if (key == "BidOverride" && is.na(cur) && is.na(c0$value)) return(FALSE)
    push_undo(); old_bid <- rv$rel$tot$BidUsed
    loans <- rv$rel$loans; loans[[k]][[key]] <- c0$value
    ms <- recalc(loans, only = k)
    set_status("%s %s -> %s | Bid %s -> %s | %.0f ms", L$LoanNo, key, as.character(c0$value), fmt_value(old_bid, "money"), fmt_value(rv$rel$tot$BidUsed, "money"), ms)
    TRUE
  }
  bind_inputs <- function(n) {
    for (o in obs) o$destroy(); obs <<- list()
    for (i in seq_len(n)) for (key in INPUT_KEYS) local({
      k <- i; kk <- key; id <- sprintf("L%d_%s", k, kk)
      obs[[id]] <<- observeEvent(input[[id]], { req(rv$rel, !rv$loading, k <= length(rv$rel$loans)); apply_input(k, kk, input[[id]]) }, ignoreInit = TRUE, ignoreNULL = TRUE)
    })
    for (i in seq_len(n)) local({
      k <- i
      output[[sprintf("badge_%d", k)]] <- renderText({ R <- rv$rel; req(R, k <= length(R$loans)); R$loans[[k]]$ExitType })
      output[[sprintf("res_%d", k)]] <- renderUI({
        R <- rv$rel; req(R, k <= length(R$loans)); L <- R$loans[[k]]
        tile <- function(k2, v, fmt) div(class = "tile", div(class = "k", k2), div(class = paste("v", if (!is.na(v) && is.numeric(v) && v < 0) "neg"), fmt_or(v, fmt)))
        div(class = "tiles",
          div(class = "tile big", div(div(class = "k", "Bid"), div(class = "v", fmt_or(L$BidUsed, "money"))),
              div(class = "text-end", div(class = "k", "Bid %"), div(class = "v", fmt_or(L$BidPct, "pct")))),
          tile("Exit pull", L$ExitVal, "money"), tile("12M CY", L$CY12, "pct"), tile("MOIC", L$MOIC, "num2"),
          tile("YTM (IRR)", L$YtmIRR, "pct2"), tile("YTM (XIRR)", L$YtmXIRR, "pct2"), tile("Sell YTM", L$SellYTM, "pct2"),
          tile("Implied DPO", L$ImpDPO, "pct"), tile("Bid / MwVx", L$BidMwVx, "pct"), tile("Min hurdle month", L$MinHAll, "num0"))
      })
    })
  }

  observeEvent(input$undo, {
    req(length(rv$undo) > 0); u <- rv$undo[[1]]; rv$undo <- rv$undo[-1]
    rv$loading <- TRUE; ms <- recalc(u$loans, u$ctx, retrail = TRUE); push_globals(u$ctx); rv$gen <- rv$gen + 1L; rv$loading <- FALSE
    set_status("Undo | Bid %s | %.0f ms", fmt_value(rv$rel$tot$BidUsed, "money"), ms)
  })
  observeEvent(input$resetall, { req(rv$rel); showModal(modalDialog("Reset every input on this relationship to the sheet defaults?", footer = tagList(modalButton("Cancel"), actionButton("resetok", "Reset", class = "btn-danger")), easyClose = TRUE)) })
  observeEvent(input$resetok, {
    removeModal(); push_undo()
    loans <- lapply(rv$rel$loans, function(L) { d <- loan_defaults(); for (k in INPUT_KEYS) L[[k]] <- d[[k]]; L })
    rv$loading <- TRUE; ms <- recalc(loans); rv$gen <- rv$gen + 1L; rv$loading <- FALSE
    set_status("All inputs reset | Bid %s | %.0f ms", fmt_value(rv$rel$tot$BidUsed, "money"), ms)
  })

  # -- cards (rendered once per load / undo / reset; results are separate live outputs)
  output$cards <- renderUI({
    rv$gen; R <- isolate(rv$rel); req(R)
    n <- length(R$loans)
    bind_inputs(n)
    cards <- lapply(seq_len(n), function(i) loan_card(i, R$loans[[i]], R$ctx))
    layout_column_wrap(width = "400px", heights_equal = "row", fill = FALSE, !!!cards)
  })

  loan_card <- function(i, L, C) {
    id <- function(key) sprintf("L%d_%s", i, key)
    num <- function(key, label, step = 1, pct = FALSE, money = FALSE) numericInput(id(key), label, value = if (pct) round(L[[key]] * 100, 4) else L[[key]], step = step)
    sel <- function(key, label) selectInput(id(key), label, VALUE_LISTS[[key]], selected = L[[key]])
    cond <- function(js, ...) conditionalPanel(condition = js, ...)
    P <- function(key) sprintf("input.%s", id(key))
    card(class = "loan-card", full_screen = FALSE,
      card_header(span(L$LoanNo), span(class = "badge text-bg-primary", textOutput(sprintf("badge_%d", i), inline = TRUE))),
      card_body(padding = c("10px", "14px"), gap = 0,
        div(class = "facts",
          div("UPB", tags$b(fmt_value(L$UPB, "money"))), div("Rate", tags$b(fmt_value(L$CRate, "pct2"))),
          div("PMT", tags$b(fmt_value(L$CPmt, "money"))), div("Maturity", tags$b(fmt_or(L$MatDt, "date"))),
          div("Interest", tags$b(fmt_value(L$IntBal, "money"))), div("MTM / MTA", tags$b(paste(L$MTM, "/", if (isTRUE(L$MTAok)) L$MTA else "n/a"))),
          div("12M trail", tags$b(fmt_value(L$T12, "money"))), div("3M trail", tags$b(fmt_value(L$T3, "money")))),
        uiOutput(sprintf("res_%d", i)),
        accordion(open = "Exit", multiple = TRUE,
          accordion_panel("Payment",
            sel("PmtSel", "Payment selection"),
            cond(sprintf("%s == 'User PMT'", P("PmtSel")), num("UserPmt", "User PMT ($)", 100)),
            cond(sprintf("%s == 'Term PMT'", P("PmtSel")), num("TermMonths", "Term months", 12)),
            cond(sprintf("%s == '%% of M Trail PMT'", P("PmtSel")), layout_columns(col_widths = c(6, 6), gap = "6px", sel("MTrailSel", "Trail window"), num("TrailPct", "Trail %", 5, pct = TRUE)))),
          accordion_panel("Rate",
            sel("RateSel", "Rate selection"),
            cond(sprintf("%s == 'User Enter'", P("RateSel")), num("UserRate", "User rate %", 0.25, pct = TRUE))),
          accordion_panel("Legal",
            layout_columns(col_widths = c(6, 6), gap = "6px", num("LegalInit", "Initial legal ($)", 1000), num("LegalStartM", "Start month", 1)),
            layout_columns(col_widths = c(6, 6), gap = "6px", num("HoldCost", "Holding cost ($/mo)", 100), num("LegalEndM", "End month", 1)),
            sel("AddBack", "Add back to exit")),
          accordion_panel("Exit",
            sel("ExitType", "Exit type"),
            cond(sprintf("%s == 'DPO'", P("ExitType")), num("DPOPct", "DPO %", 1, pct = TRUE)),
            cond(sprintf("%s == 'User Enter'", P("ExitType")), num("UserExit", "Exit amount ($)", 1000)),
            cond(sprintf("%s == 'Value Cap'", P("ExitType")), num("ValCapPct", "Value cap %", 5, pct = TRUE)),
            cond(sprintf("%s == 'YTM Sell Solve' || %s == 'IRR Solve'", P("ExitType"), P("ExitType")), num("YTMTgt", "YTM target %", 0.5, pct = TRUE)),
            cond(sprintf("%s == 'Liquidation'", P("ExitType")), num("LiqAcrM", "Liquidation forward accrual months", 1)),
            layout_columns(col_widths = c(6, 6), gap = "6px", sel("AddAccrued", "Add current accrued"), num("BidOverride", "Bid override ($)", 1000)),
            sliderInput(id("StartMonth"), "Start month", 1, 60, L$StartMonth, step = 1, ticks = FALSE),
            sliderInput(id("ExitMonth"), "Exit month", 1, 60, L$ExitMonth, step = 1, ticks = FALSE))
        )))
  }

  kpi <- function(f, fmt) renderText({ req(rv$rel); fmt_or(rv$rel$tot[[f]], fmt) })
  output$kBid <- kpi("BidUsed", "money"); output$kPct <- kpi("BidPct", "pct"); output$kCY <- kpi("CY12", "pct")
  output$kMOIC <- kpi("MOIC", "num2"); output$kYTM <- kpi("YtmIRR", "pct2"); output$kMinH <- kpi("MinHAll", "num0")
  output$status <- renderText(rv$status)

  # -- charts
  theme_br <- function() theme_minimal(base_size = 11) + theme(panel.grid.minor = element_blank(), legend.position = "top", legend.title = element_blank(), plot.background = element_blank(), panel.background = element_blank())
  output$cfplot <- renderPlot({
    R <- rv$rel; req(R)
    d <- do.call(rbind, lapply(R$loans, function(L) data.frame(Loan = L$LoanNo, Month = 1:60, Net = L$Net)))
    ggplot(d, aes(Month, Net, fill = Loan)) + geom_col(width = 0.85) + scale_y_continuous(labels = function(x) paste0("$", formatC(x / 1000, format = "f", digits = 0, big.mark = ","), "k")) +
      scale_fill_brewer(palette = "Blues", direction = -1) + labs(x = "Month", y = NULL) + theme_br()
  }, bg = "transparent")
  output$bidplot <- renderPlot({
    R <- rv$rel; req(R, !is.null(R$rel_opt))
    d <- R$rel_opt; cur <- max(vapply(R$loans, `[[`, integer(1), "ExitMonth"))
    ggplot(d, aes(M, Bid)) + geom_area(fill = "#2563EB", alpha = 0.12) + geom_line(color = "#2563EB", linewidth = 1) +
      geom_vline(xintercept = cur, linetype = 2, color = "#6B7280") +
      { if (!is.na(R$tot$MinHAll)) geom_vline(xintercept = R$tot$MinHAll, linetype = 3, color = "#16A34A") } +
      geom_point(data = d[d$PassAll, ], color = "#16A34A", size = 1.6) +
      scale_y_continuous(labels = function(x) paste0("$", formatC(x / 1e6, format = "f", digits = 2), "M")) +
      labs(x = "Exit month (dots = all hurdles pass, dashed = current exit)", y = NULL) + theme_br()
  }, bg = "transparent")

  # -- export: the Excel-order sheet built from rows.R
  output$export <- downloadHandler(
    filename = function() sprintf("Projection_%s_%s.xlsx", safe_name(rv$relname), format(Sys.Date(), "%Y%m%d")),
    content = function(file) {
      R <- rv$rel; req(R); C <- R$ctx
      col <- function(L, is_total = FALSE) vapply(seq_len(nrow(ROW_DEFS)), function(r) { k <- ROW_DEFS$key[r]; if (ROW_DEFS$kind[r] == "s") return("")
        v <- row_value(L, k, C, is_total); if (length(v) == 1 && is.na(v)) return(""); if (is.character(v)) v else fmt_value(v, row_fmt(k, ROW_DEFS$fmt[r], C)) }, character(1))
      df <- data.frame(Category = ROW_DEFS$caption, stringsAsFactors = FALSE)
      for (L in R$loans) df[[L$LoanNo]] <- col(L)
      df[["Relationship"]] <- col(R$tot, TRUE)
      wb <- openxlsx::createWorkbook(); openxlsx::addWorksheet(wb, "Projection"); openxlsx::writeData(wb, "Projection", df)
      ys <- openxlsx::createStyle(fgFill = "#FFFF99"); gs <- openxlsx::createStyle(fgFill = "#E2EFDA", textDecoration = "bold")
      for (r in which(ROW_DEFS$kind %in% c("y", "Y", "t"))) openxlsx::addStyle(wb, "Projection", ys, rows = r + 1, cols = 2:(length(R$loans) + 1), gridExpand = TRUE)
      for (r in which(ROW_DEFS$kind == "r")) openxlsx::addStyle(wb, "Projection", gs, rows = r + 1, cols = 2:(length(R$loans) + 2), gridExpand = TRUE)
      openxlsx::setColWidths(wb, "Projection", cols = 1:(length(R$loans) + 2), widths = c(26, rep(16, length(R$loans) + 1)))
      openxlsx::saveWorkbook(wb, file, overwrite = TRUE)
    })
}

shinyApp(ui, server)
