# Relationship Projection - modern layout (Shiny), built to the "Relationship Projection" design canvas.
# Pages: Projection (loan cards + charts) | Optimal (60-month exit analysis) | Pay history (stats + matrix).
# Same engine and read-only data layer as ../app.R.
#
#   shiny::runApp("shiny/modern")                              live data via the sqlDueDiligence DSN
#   Sys.setenv(BR_DEMO = "1"); shiny::runApp("shiny/modern")   synthetic demo, no SQL Server

suppressPackageStartupMessages({ library(shiny); library(ggplot2) })
source("../R/engine.R", local = TRUE); source("../R/rows.R", local = TRUE); source("../R/data.R", local = TRUE)

MONO <- "'IBM Plex Mono', Consolas, monospace"
CSS <- "
:root { --bg:oklch(0.975 0.006 250); --surface:oklch(0.99 0.003 250); --surface2:oklch(0.985 0.004 250); --surface3:oklch(0.965 0.006 250);
  --hover:oklch(0.96 0.006 250); --input:white; --border:oklch(0.9 0.01 250); --border2:oklch(0.88 0.01 250); --border3:oklch(0.92 0.01 250);
  --border4:oklch(0.94 0.01 250); --text:oklch(0.22 0.02 250); --text2:oklch(0.3 0.02 250); --text3:oklch(0.4 0.02 250); --text4:oklch(0.45 0.02 250);
  --muted:oklch(0.5 0.02 250); --muted2:oklch(0.55 0.02 250); --muted3:oklch(0.6 0.02 250); --faint:oklch(0.75 0.02 250);
  --accent:oklch(0.55 0.15 290); --accent-hover:oklch(0.48 0.15 290); --accent-soft:oklch(0.93 0.05 290); --accent-soft2:oklch(0.96 0.01 290); --accent-text:oklch(0.4 0.14 290);
  --good-bg:oklch(0.94 0.05 160); --good-bg2:oklch(0.97 0.02 160); --good-bg3:oklch(0.9 0.05 160); --good-border:oklch(0.85 0.06 160); --good-label:oklch(0.45 0.08 160);
  --good-text:oklch(0.28 0.08 160); --good-text2:oklch(0.4 0.1 160); --good-text3:oklch(0.3 0.1 160); --good-text4:oklch(0.35 0.12 160); --good-text5:oklch(0.4 0.12 160);
  --good:oklch(0.55 0.15 160); --good2:oklch(0.5 0.15 160); --danger:oklch(0.5 0.15 30); --danger-bg:oklch(0.97 0.02 30); --on-accent:white;
  --missed:oklch(0.58 0.2 27); --short:oklch(0.78 0.15 60); --edit-border:oklch(0.85 0.05 95); }
html[data-theme='dark'] { --bg:oklch(0.17 0.012 250); --surface:oklch(0.22 0.014 250); --surface2:oklch(0.2 0.012 250); --surface3:oklch(0.27 0.014 250);
  --hover:oklch(0.28 0.014 250); --input:oklch(0.25 0.014 250); --border:oklch(0.32 0.014 250); --border2:oklch(0.34 0.014 250); --border3:oklch(0.3 0.014 250);
  --border4:oklch(0.28 0.014 250); --text:oklch(0.94 0.01 250); --text2:oklch(0.88 0.01 250); --text3:oklch(0.8 0.01 250); --text4:oklch(0.75 0.01 250);
  --muted:oklch(0.7 0.015 250); --muted2:oklch(0.66 0.015 250); --muted3:oklch(0.6 0.015 250); --faint:oklch(0.45 0.015 250);
  --accent:oklch(0.72 0.14 290); --accent-hover:oklch(0.65 0.14 290); --accent-soft:oklch(0.32 0.07 290); --accent-soft2:oklch(0.27 0.02 290); --accent-text:oklch(0.85 0.1 290);
  --good-bg:oklch(0.3 0.06 160); --good-bg2:oklch(0.25 0.03 160); --good-bg3:oklch(0.33 0.07 160); --good-border:oklch(0.4 0.07 160); --good-label:oklch(0.8 0.1 160);
  --good-text:oklch(0.92 0.08 160); --good-text2:oklch(0.82 0.1 160); --good-text3:oklch(0.9 0.1 160); --good-text4:oklch(0.85 0.12 160); --good-text5:oklch(0.82 0.12 160);
  --good:oklch(0.72 0.15 160); --good2:oklch(0.72 0.15 160); --danger:oklch(0.75 0.14 30); --danger-bg:oklch(0.3 0.05 30); --on-accent:oklch(0.15 0.02 290); color-scheme:dark; }
html, body { margin:0; padding:0; background:var(--bg); color:var(--text); font-family:'Work Sans', system-ui, sans-serif; -webkit-font-smoothing:antialiased; transition:background .2s, color .2s; }
* { box-sizing:border-box; } select, input, button { font-family:inherit; } input[type=number]::-webkit-inner-spin-button { opacity:0.4; }
.mono { font-family:'IBM Plex Mono', Consolas, monospace; }
.app { display:flex; flex-direction:column; min-height:100vh; }
.topbar { display:flex; align-items:center; gap:24px; padding:0 28px; min-height:56px; flex-wrap:wrap; background:var(--surface); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:5; }
.brand { display:flex; align-items:center; gap:10px; } .brand .dot { width:26px; height:26px; border-radius:7px; background:var(--accent); } .brand .t { font-weight:600; font-size:15px; letter-spacing:-0.01em; }
.nav { display:flex; gap:4px; height:56px; margin-left:8px; }
.nav button { border:0; background:none; cursor:pointer; padding:0 14px; font:inherit; font-size:13.5px; font-weight:500; color:var(--muted2); border-bottom:2px solid transparent; height:100%; }
.nav button.on { color:var(--text); border-bottom-color:var(--accent); }
.tb-right { margin-left:auto; display:flex; align-items:center; gap:16px; flex:1; min-width:0; justify-content:flex-end; }
.status { font-family:'IBM Plex Mono', Consolas, monospace; font-size:11.5px; color:var(--muted2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0; text-align:right; }
.tb-btns { display:flex; gap:6px; flex-shrink:0; }
.tb-btn, .tb-btns .shiny-download-link { font:inherit; font-size:12.5px; font-weight:500; padding:6px 12px; border-radius:7px; border:1px solid var(--border2); background:var(--surface); cursor:pointer; color:var(--text2); text-decoration:none; display:inline-block; line-height:1.3; }
.tb-btn:hover { background:var(--hover); } .tb-btn.danger { color:var(--danger); } .tb-btn.danger:hover { background:var(--danger-bg); }
.tb-btns .shiny-download-link, .btn-accent { border-color:var(--accent); background:var(--accent); color:var(--on-accent); } .tb-btns .shiny-download-link:hover, .btn-accent:hover { background:var(--accent-hover); }
.body { display:grid; grid-template-columns:272px minmax(0,1fr); flex:1; min-height:0; }
.sidebar { border-right:1px solid var(--border); background:var(--surface); padding:20px 18px; display:flex; flex-direction:column; gap:18px; position:sticky; top:56px; height:calc(100vh - 56px); overflow:auto; }
.sb-lab { font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--muted2); }
.sb-group { display:flex; flex-direction:column; gap:8px; } .sb-group .sb-lab + .sb-lab { margin-top:6px; }
.hr { height:1px; background:var(--border3); }
.f { display:flex; flex-direction:column; gap:4px; min-width:0; } .f > span, .f > label { font-size:12px; color:var(--muted); }
.grid2 { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; } .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
select.in, input.in, .shiny-date-input input { width:100%; min-width:0; height:32px; border-radius:7px; border:1px solid var(--border2); background:var(--input); padding:0 8px; font-size:13px; color:var(--text); }
select.in.tall { height:34px; padding:0 10px; } input.in, .shiny-date-input input { font-family:'IBM Plex Mono', Consolas, monospace; }
.shiny-date-input { width:100%; } .shiny-date-input label { display:none; }
.sb-note { margin-top:auto; font-size:11.5px; color:var(--muted3); line-height:1.5; }
.sw { display:inline-block; width:10px; height:10px; border-radius:3px; vertical-align:-1px; } .sw.edit { background:var(--input); border:1px solid var(--edit-border); } .sw.res { background:var(--good-bg); border:1px solid oklch(0.8 0.08 160); }
.main { padding:22px 28px 40px; display:flex; flex-direction:column; gap:20px; min-width:0; }
.kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:10px; }
.kpi { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px 16px; display:flex; flex-direction:column; gap:4px; }
.kpi .k { font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--muted2); } .kpi .v { font-family:'IBM Plex Mono', Consolas, monospace; font-size:24px; font-weight:600; letter-spacing:-0.02em; }
.kpi.accent { background:var(--accent); color:var(--on-accent); border-color:var(--accent); } .kpi.accent .k { color:inherit; opacity:0.8; }
.kpi.good { background:var(--good-bg); border-color:var(--good-border); } .kpi.good .k { color:var(--good-text2); } .kpi.good .v { color:var(--good-text3); }
.page { display:none; flex-direction:column; gap:20px; } .page.on { display:flex; }
.cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(380px, 1fr)); gap:16px; align-items:start; }
.card { background:var(--surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; display:flex; flex-direction:column; }
.card-hd { display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px; }
.card-hd .no { font-family:'IBM Plex Mono', Consolas, monospace; font-size:14px; font-weight:600; } .card-hd .sub { font-size:11.5px; color:var(--muted2); }
.pill { font-size:11.5px; font-weight:600; padding:4px 10px; border-radius:999px; background:var(--accent-soft); color:var(--accent-text); letter-spacing:0.02em; }
.facts { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px 10px; padding:0 16px 12px; font-size:11.5px; color:var(--muted2); }
.facts b { display:block; color:var(--text); font-family:'IBM Plex Mono', Consolas, monospace; font-weight:500; font-size:12.5px; }
.res { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; padding:0 16px 14px; }
.res .big { grid-column:span 3; display:flex; justify-content:space-between; align-items:baseline; background:var(--good-bg); border-radius:9px; padding:8px 12px; }
.glab { font-size:10.5px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--good-label); }
.gval { font-family:'IBM Plex Mono', Consolas, monospace; font-size:21px; font-weight:600; color:var(--good-text); } .gval.sm { font-size:16px; } .gval.xs { font-size:14px; }
.tile { background:var(--accent-soft2); border-radius:8px; padding:6px 9px; } .tile .k { font-size:10px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; color:var(--muted2); white-space:nowrap; }
.tile .v { font-family:'IBM Plex Mono', Consolas, monospace; font-size:13.5px; font-weight:600; }
.secs { border-top:1px solid var(--border3); }
.sec-btn { width:100%; display:flex; justify-content:space-between; align-items:center; border:0; background:none; cursor:pointer; padding:10px 16px; font:inherit; font-size:12.5px; font-weight:600; color:var(--text2); border-bottom:1px solid var(--border4); }
.sec-btn .sum { display:flex; align-items:center; gap:10px; } .sec-btn .sum .s { font-weight:400; color:var(--muted2); font-size:12px; } .sec-btn .sum .s b { font-family:'IBM Plex Mono', Consolas, monospace; color:var(--text); font-weight:400; }
.sec-btn .arr { display:inline-block; transition:transform .15s; color:var(--muted3); } .sec-btn.open .arr { transform:rotate(180deg); }
.sec-body { display:none; padding:10px 16px 12px; flex-direction:column; gap:8px; background:var(--surface2); border-bottom:1px solid var(--border4); } .sec-body.open { display:flex; }
.sec-body label.f { font-size:11.5px; color:var(--muted); gap:3px; }
.gbox { display:flex; justify-content:space-between; align-items:baseline; background:var(--good-bg); border-radius:8px; padding:7px 10px; } .gbox.col { flex-direction:column; align-items:flex-start; gap:2px; }
.unit { font-family:'Work Sans', sans-serif; font-weight:400; font-size:11px; color:var(--good-label); margin-left:6px; }
.g2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.charts { display:grid; grid-template-columns:repeat(auto-fit, minmax(420px, 1fr)); gap:16px; }
.chart-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:14px 16px 12px; display:flex; flex-direction:column; gap:8px; }
.chart-card .hd { display:flex; justify-content:space-between; align-items:baseline; } .chart-card .ttl { font-size:13.5px; font-weight:600; } .chart-card .note { font-size:11px; color:var(--muted3); } .chart-card .leg { font-size:11.5px; color:var(--muted2); }
.chart-card .stats { display:flex; gap:18px; font-size:12px; color:var(--text4); } .chart-card .stats b { font-family:'IBM Plex Mono', Consolas, monospace; font-weight:600; }
.opt-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(560px, 1fr)); gap:16px; align-items:start; }
.tbl-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; display:flex; flex-direction:column; }
.tbl-hd { display:flex; align-items:center; gap:12px; padding:14px 18px; border-bottom:1px solid var(--border3); flex-wrap:wrap; } .tbl-hd .ttl { font-size:13.5px; font-weight:600; } .tbl-hd .right { margin-left:auto; display:flex; align-items:center; gap:10px; }
.tbl-hd select.in { width:auto; height:30px; font-size:12.5px; }
.opt-row { display:grid; grid-template-columns:52px repeat(4, minmax(80px,1fr)) repeat(3, 44px) 50px; padding:8px 18px; font-size:12px; font-family:'IBM Plex Mono', Consolas, monospace; border-bottom:1px solid var(--border4); cursor:pointer; }
.opt-row:hover { background:var(--accent-soft2); } .opt-row.pass { background:var(--good-bg2); } .opt-row.sel { background:var(--accent-soft); }
.opt-row span { text-align:right; } .opt-row span:first-child { text-align:left; font-weight:600; } .opt-row .c { text-align:center; } .opt-row .ok { color:var(--good2); } .opt-row .no { color:var(--faint); }
.opt-hdr { display:grid; grid-template-columns:52px repeat(4, minmax(80px,1fr)) repeat(3, 44px) 50px; padding:8px 18px; font-size:10.5px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; color:var(--muted2); border-bottom:1px solid var(--border3); }
.opt-hdr span { text-align:right; } .opt-hdr span:first-child { text-align:left; } .opt-hdr .c { text-align:center; }
.opt-scroll { max-height:560px; overflow:auto; min-width:0; }
.minh { display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; }
.minh > div { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:12px 14px; } .minh .k { font-size:10.5px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; color:var(--muted2); } .minh .v { font-family:'IBM Plex Mono', Consolas, monospace; font-size:20px; font-weight:600; }
.minh > div.good { background:var(--good-bg); border-color:var(--good-border); } .minh .good .k { color:var(--good-text2); } .minh .good .v { color:var(--good-text4); }
.stat-hdr, .stat-row { display:grid; padding:8px 18px; min-width:820px; } .stat-hdr { font-size:10.5px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; color:var(--muted2); border-bottom:1px solid var(--border3); }
.stat-hdr span, .stat-row span { text-align:right; } .stat-hdr span:first-child, .stat-row span:first-child { text-align:left; } .stat-hdr .mono { text-transform:none; letter-spacing:0; }
.stat-row { font-size:12.5px; border-bottom:1px solid var(--border4); } .stat-row span { font-family:'IBM Plex Mono', Consolas, monospace; } .stat-row span:first-child { font-family:inherit; color:var(--text3); } .stat-row span:last-child { font-weight:600; } .stat-row.hl { background:var(--good-bg2); }
.matrix { padding:12px 18px 16px; display:flex; flex-direction:column; gap:18px; }
.mx-hd { display:flex; align-items:baseline; gap:10px; } .mx-hd .no { font-family:'IBM Plex Mono', Consolas, monospace; font-size:13px; font-weight:600; } .mx-hd .sub { font-size:11.5px; color:var(--muted2); }
.mx { display:grid; grid-template-columns:56px repeat(12, minmax(0, 1fr)); gap:3px; font-family:'IBM Plex Mono', Consolas, monospace; font-size:11px; }
.mx .mh { text-align:center; color:var(--muted2); font-size:10.5px; padding-bottom:2px; font-family:'Work Sans', sans-serif; font-weight:600; letter-spacing:0.04em; }
.mx .yr { display:flex; align-items:center; font-weight:600; color:var(--text3); }
.mx .c { text-align:right; padding:8px 6px; border-radius:5px; background:var(--surface3); min-height:32px; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mx .c.miss { background:var(--missed); color:white; } .mx .c.short { background:var(--short); color:oklch(0.25 0.05 60); } .mx .c.rel { background:var(--good-bg3); } .mx .c.none { background:transparent; }
.legend { display:flex; gap:14px; font-size:11.5px; color:var(--muted2); } .legend span { display:flex; align-items:center; gap:5px; }
.shiny-notification { font-family:inherit; border-radius:10px; }
.shiny-plot-output img { width:100% !important; height:auto; }
"

JS <- "
(function(){
  function applyTheme(t){ document.documentElement.dataset.theme = t; var b = document.getElementById('themeBtn'); if (b) b.textContent = (t === 'dark' ? 'Light' : 'Dark');
    if (window.Shiny && Shiny.setInputValue) Shiny.setInputValue('dark', t === 'dark'); }
  function currentTheme(){ try { return localStorage.getItem('rp-theme') || 'light'; } catch(e) { return 'light'; } }
  window.rpToggleTheme = function(){ var t = currentTheme() === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('rp-theme', t); } catch(e){} applyTheme(t); };
  window.rpTab = function(t){ document.querySelectorAll('.nav button').forEach(function(b){ b.classList.toggle('on', b.dataset.tab === t); });
    document.querySelectorAll('.page').forEach(function(p){ p.classList.toggle('on', p.id === 'page-' + t); });
    if (window.Shiny && Shiny.setInputValue) Shiny.setInputValue('tab', t);
    setTimeout(function(){ $('#page-' + t).trigger('shown'); $(window).trigger('resize'); }, 40); };
  document.addEventListener('click', function(e){
    var b = e.target.closest('.sec-btn'); if (b) { b.classList.toggle('open'); var body = b.nextElementSibling; if (body) body.classList.toggle('open'); return; }
    var r = e.target.closest('.opt-row'); if (r) { document.querySelectorAll('.opt-row.sel').forEach(function(x){ x.classList.remove('sel'); }); r.classList.add('sel');
      if (window.Shiny) Shiny.setInputValue('optSel', +r.dataset.m); }
  });
  document.documentElement.dataset.theme = currentTheme();
  $(document).on('shiny:connected', function(){ applyTheme(currentTheme()); Shiny.setInputValue('tab', 'proj'); });
})();
"

# ---------------------------------------------------------------- small UI helpers
sel_in <- function(id, choices, selected = NULL, class = "in", labels = names(choices)) {
  if (is.null(labels)) labels <- choices
  tags$select(id = id, class = class, lapply(seq_along(choices), function(i)
    tags$option(value = choices[i], labels[i], selected = if (!is.null(selected) && choices[i] == selected) NA else NULL)))
}
num_in <- function(id, value, step = 1, min = NULL, max = NULL, placeholder = NULL)
  tags$input(type = "number", id = id, class = "in", value = value, step = step, min = min, max = max, placeholder = placeholder)
field <- function(label, ctl) tags$label(class = "f", label, ctl)
sb_field <- function(label, ctl) div(class = "f", span(label), ctl)
fmt_or <- function(v, fmt) if (is.null(v) || length(v) == 0 || is.na(v)) "\u2014" else fmt_value(v, fmt)
nav_btn <- function(tab, label, on = FALSE) tags$button(`data-tab` = tab, class = if (on) "on" else NULL, onclick = sprintf("rpTab('%s')", tab), label)
kpi <- function(id, label, cls = "") div(class = paste("kpi", cls), div(class = "k", label), div(class = "v", textOutput(id, inline = TRUE)))
TRAIL_LABELS <- c("Actual", "monthly", "yearly", "% of Contractual", "% of Int PMT", "Number of PMT's Made", "Number of Int Pmt's Made")

# ---------------------------------------------------------------- UI
ui <- tagList(
  tags$head(
    tags$meta(charset = "utf-8"), tags$meta(name = "viewport", content = "width=device-width, initial-scale=1"), tags$title("Relationship Projection"),
    tags$link(rel = "preconnect", href = "https://fonts.googleapis.com"),
    tags$link(href = "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap", rel = "stylesheet"),
    tags$style(HTML(CSS)), tags$script(HTML(JS))
  ),
  div(class = "app",
    tags$header(class = "topbar",
      div(class = "brand", div(class = "dot"), div(class = "t", "Relationship Projection")),
      tags$nav(class = "nav", nav_btn("proj", "Projection", TRUE), nav_btn("opt", "Optimal"), nav_btn("pay", "Pay history")),
      div(class = "tb-right",
        div(class = "status", textOutput("status", inline = TRUE)),
        div(class = "tb-btns",
          tags$button(id = "themeBtn", class = "tb-btn", title = "Toggle dark mode", onclick = "rpToggleTheme()", "Dark"),
          actionButton("undo", "Undo", class = "tb-btn"),
          tags$button(class = "tb-btn danger", onclick = "if (confirm('Reset every input on this relationship to the sheet defaults?')) Shiny.setInputValue('resetok', Date.now())", "Reset"),
          downloadButton("export", "Export .xlsx", icon = NULL)))),
    div(class = "body",
      tags$aside(class = "sidebar",
        div(class = "sb-group",
          tags$label(class = "sb-lab", "Project"), sel_in("proj", character(0), class = "in tall"),
          tags$label(class = "sb-lab", "Relationship"), sel_in("rel", character(0), class = "in tall")),
        div(class = "hr"),
        div(class = "sb-group", div(class = "sb-lab", "Assumptions"),
          div(class = "grid2", sb_field("Yield %", num_in("yield", 15, 0.5, 0, 100)), sb_field("YTM min months", num_in("j2", 0, 1, 0, 360))),
          sb_field("Cutoff date", dateInput("cutoff", NULL, value = Sys.Date(), width = "100%")),
          sb_field("PMT history date", dateInput("anchor", NULL, value = Sys.Date(), width = "100%")),
          sb_field("Trail selection", sel_in("traildisp", VALUE_LISTS$TrailDisp, "Actual", labels = TRAIL_LABELS))),
        div(class = "sb-group", div(class = "sb-lab", "Hurdles"),
          div(class = "grid3", sb_field("YTM %", num_in("hytm", 10, 0.5, 0)), sb_field("CY %", num_in("hcy", 9, 0.5, 0)), sb_field("MOIC", num_in("hmoic", 1.3, 0.05, 0)))),
        div(class = "sb-note", "Read-only against ", span(class = "mono", DSN_NAME), ". Inputs saved locally. ",
            span(class = "sw edit"), " editable · ", span(class = "sw res"), " result")),
      tags$main(class = "main",
        tags$section(class = "kpis",
          kpi("kBid", "Relationship bid", "accent"), kpi("kPct", "Bid %"), kpi("kCY", "12M cash yield"), kpi("kMOIC", "MOIC"), kpi("kYTM", "YTM (IRR)"), kpi("kMinH", "Min hurdle month", "good")),
        div(id = "page-proj", class = "page on",
          uiOutput("cards"),
          tags$section(class = "charts",
            div(class = "chart-card", div(class = "hd", div(class = "ttl", "Net cash flow by month")), plotOutput("cfplot", height = "240px"),
                div(class = "note", "Pseudo-logarithmic axis so exit pulls and monthly payments read on one chart; legal costs show below zero.")),
            div(class = "chart-card", div(class = "hd", div(class = "ttl", "Relationship bid by exit month"), div(class = "leg", "● all hurdles pass · ┆ current exit")),
                plotOutput("bidplot", height = "240px"), uiOutput("curveStats")))),
        div(id = "page-opt", class = "page",
          tags$section(class = "opt-grid",
            div(class = "tbl-card",
              div(class = "tbl-hd", div(class = "ttl", "60-month exit analysis"), sel_in("optLoan", "rel", "rel", labels = "Relationship"),
                  div(class = "right", span(style = "font-size:12px; color:var(--muted2);", "Selected ", tags$b(class = "mono", style = "color:var(--text)", textOutput("optSelTxt", inline = TRUE))),
                      actionButton("usemonth", "Use selected month as Exit Month", class = "tb-btn btn-accent"))),
              div(class = "opt-hdr", span("M"), span("Bid"), span("Bid %"), span("YTM"), span("12M CY"), span(class = "c", "YTM"), span(class = "c", "CY"), span(class = "c", "MOIC"), span("MOIC")),
              div(class = "opt-scroll", uiOutput("optRows"))),
            div(style = "display:flex; flex-direction:column; gap:16px;",
              div(class = "chart-card", div(class = "hd", div(class = "ttl", "YTM · 12M CY · MOIC vs hurdles")), plotOutput("optplot", height = "300px"),
                  div(class = "leg", uiOutput("optNote", inline = TRUE))),
              uiOutput("minh")))),
        div(id = "page-pay", class = "page",
          div(class = "tbl-card",
            div(class = "tbl-hd", div(class = "ttl", "Payment statistics"), div(class = "right", style = "font-size:12px; color:var(--muted2);", uiOutput("payNote", inline = TRUE))),
            div(style = "overflow:auto;", uiOutput("payStats"))),
          div(class = "tbl-card",
            div(class = "tbl-hd", div(class = "ttl", "36-month payment matrix"), sel_in("payLoan", "rel", "rel", labels = "Relationship (all loans)"),
                div(class = "right legend", span(span(class = "sw", style = "background:var(--missed)"), "missed month"), span(span(class = "sw", style = "background:var(--short)"), "below contractual PMT"))),
            uiOutput("payMatrix")))))))

# ---------------------------------------------------------------- server
server <- function(input, output, session) {
  con <- br_connect(); demo <- is.null(con)
  session$onSessionEnded(function() if (!is.null(con)) try(DBI::dbDisconnect(con), silent = TRUE))
  rv <- reactiveValues(rel = NULL, pay = NULL, trails = NULL, undo = list(), status = "", proj = NULL, relname = NULL, loading = FALSE, expect = NULL, gen = 0L, optSel = 24L)
  obs <- list()
  set_status <- function(...) rv$status <- paste0(format(Sys.time(), "%H:%M:%S"), "  ", sprintf(...))
  loan_nos <- function(R = rv$rel) vapply(R$loans, `[[`, character(1), "LoanNo")

  updateSelectInput(session, "proj", choices = br_projects(con))
  observeEvent(input$proj, {
    req(nzchar(input$proj)); d <- br_relationships(con, input$proj)
    updateSelectInput(session, "rel", choices = setNames(d$RelatedLoans, sprintf("%s  (%d loan%s, $%s)", d$RelatedLoans, d$Loans, ifelse(d$Loans == 1, "", "s"), formatC(d$UPB, format = "f", digits = 0, big.mark = ","))))
  })

  # -- header globals (round-trip safe)
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
    if (retrail) { tr <- compute_trails(loans, rv$pay, ctx$AnchorDt); loans <- tr$loans; rv$trails <- tr }
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
    rv$pay <- x$pay; rv$trails <- tr; rv$proj <- proj; rv$relname <- rel; rv$undo <- list()
    rv$rel <- calc_rel(list(loans = tr$loans, ctx = ctx))
    rv$optSel <- max(vapply(rv$rel$loans, `[[`, integer(1), "ExitMonth"))
    push_globals(ctx)
    nos <- loan_nos(); ch <- c("rel", seq_along(nos)); names(ch) <- c("Relationship", nos)
    updateSelectInput(session, "optLoan", choices = ch, selected = "rel")
    names(ch)[1] <- "Relationship (all loans)"; updateSelectInput(session, "payLoan", choices = ch, selected = "rel")
    rv$gen <- rv$gen + 1L
    rv$loading <- FALSE
    set_status("%s: %d loans%s, %s, %.0f ms", rel, length(loans), if (saved$found) ", saved inputs restored" else "", if (demo) "DEMO data" else DSN_NAME, (proc.time()[["elapsed"]] - t0) * 1000)
  }
  observeEvent(input$rel, { req(nzchar(input$rel)); load_rel(input$proj, input$rel) })

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
      Lk <- function() { R <- rv$rel; req(R, k <= length(R$loans)); R$loans[[k]] }
      output[[sprintf("badge_%d", k)]] <- renderText(Lk()$ExitType)
      output[[sprintf("sum_%d_pmt", k)]] <- renderUI({ L <- Lk(); span(class = "s", L$PmtSel, " · ", tags$b(fmt_or(L$PmtPull, "money"))) })
      output[[sprintf("sum_%d_rate", k)]] <- renderUI({ L <- Lk(); span(class = "s", switch(L$RateSel, Contractual = "Current Rate", Default = "Default Rate", L$RateSel), " · ", tags$b(fmt_or(L$RatePull, "pct2"))) })
      output[[sprintf("sum_%d_legal", k)]] <- renderUI({ L <- Lk(); span(class = "s", if (L$LegalInit == 0 && L$HoldCost == 0) "none" else paste0(fmt_value(L$LegalInit, "money"), " + ", fmt_value(L$HoldCost, "money"), "/mo")) })
      output[[sprintf("sum_%d_exit", k)]] <- renderUI({ L <- Lk(); span(class = "s", L$ExitType, " · M", L$ExitMonth) })
      output[[sprintf("pull_%d_pmt", k)]] <- renderText(fmt_or(Lk()$PmtPull, "money"))
      output[[sprintf("pull_%d_rate", k)]] <- renderText(fmt_or(Lk()$RatePull, "pct2"))
      output[[sprintf("pull_%d_int", k)]] <- renderText(fmt_or(Lk()$IntPmt, "money"))
      output[[sprintf("res_%d", k)]] <- renderUI({
        L <- Lk()
        tile <- function(kk, v, fmt) div(class = "tile", div(class = "k", kk), div(class = "v", fmt_or(v, fmt)))
        div(class = "res",
          div(class = "big", div(div(class = "glab", "Bid"), div(class = "gval", fmt_or(L$BidUsed, "money"))),
              div(style = "text-align:right;", div(class = "glab", "Bid %"), div(class = "gval sm", fmt_or(L$BidPct, "pct")))),
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
  observeEvent(input$resetok, {
    req(rv$rel); push_undo()
    loans <- lapply(rv$rel$loans, function(L) { d <- loan_defaults(); for (k in INPUT_KEYS) L[[k]] <- d[[k]]; L })
    rv$loading <- TRUE; ms <- recalc(loans); rv$gen <- rv$gen + 1L; rv$loading <- FALSE
    set_status("All inputs reset | Bid %s | %.0f ms", fmt_value(rv$rel$tot$BidUsed, "money"), ms)
  })

  # -- cards (rendered once per load / undo / reset; live parts are separate outputs)
  output$cards <- renderUI({
    rv$gen; R <- isolate(rv$rel); req(R)
    n <- length(R$loans); bind_inputs(n)
    tags$section(class = "cards", lapply(seq_len(n), function(i) loan_card(i, n, R$loans[[i]], R$ctx)))
  })

  loan_card <- function(i, n, L, C) {
    id <- function(key) sprintf("L%d_%s", i, key)
    num <- function(key, label, step = 1, pct = FALSE) field(label, num_in(id(key), if (pct) round(L[[key]] * 100, 4) else L[[key]], step))
    sel <- function(key, label, labels = NULL) field(label, sel_in(id(key), VALUE_LISTS[[key]], L[[key]], labels = labels))
    cond <- function(js, ...) conditionalPanel(condition = js, ...)
    P <- function(key) sprintf("input.%s", id(key))
    section <- function(name, summary_id, open, ...) tagList(
      tags$button(class = paste("sec-btn", if (open) "open"), type = "button", span(name), span(class = "sum", uiOutput(summary_id, inline = TRUE), span(class = "arr", "⌄"))),
      div(class = paste("sec-body", if (open) "open"), ...))
    gpull <- function(label, out_id, unit = NULL) div(class = "gbox", span(class = "glab", label), span(class = "gval xs", textOutput(out_id, inline = TRUE), if (!is.null(unit)) span(class = "unit", unit)))
    div(class = "card",
      div(class = "card-hd", div(div(class = "no", L$LoanNo), div(class = "sub", sprintf("Loan %d of %d", i, n))), span(class = "pill", textOutput(sprintf("badge_%d", i), inline = TRUE))),
      div(class = "facts",
        div("UPB", tags$b(fmt_value(L$UPB, "money"))), div("Rate", tags$b(fmt_value(L$CRate, "pct2"))), div("PMT", tags$b(fmt_value(L$CPmt, "money"))), div("Maturity", tags$b(fmt_or(L$MatDt, "date"))),
        div("Interest", tags$b(fmt_value(L$IntBal, "money"))), div("MTM / MTA", tags$b(paste(L$MTM, "/", if (isTRUE(L$MTAok)) L$MTA else "n/a"))),
        div("12M trail", tags$b(fmt_value(L$T12, "money"))), div("3M trail", tags$b(fmt_value(L$T3, "money")))),
      uiOutput(sprintf("res_%d", i)),
      div(class = "secs",
        section("Payment", sprintf("sum_%d_pmt", i), FALSE,
          sel("PmtSel", "Payment selection"), gpull("Payment pull", sprintf("pull_%d_pmt", i), "/mo"),
          cond(sprintf("%s == 'User PMT'", P("PmtSel")), num("UserPmt", "User PMT ($)", 100)),
          cond(sprintf("%s == 'Term PMT'", P("PmtSel")), num("TermMonths", "Term months", 12)),
          cond(sprintf("%s == '%% of M Trail PMT'", P("PmtSel")), div(class = "g2", sel("MTrailSel", "Trail window"), num("TrailPct", "Trail %", 5, pct = TRUE)))),
        section("Rate", sprintf("sum_%d_rate", i), FALSE,
          sel("RateSel", "Rate selection", labels = c("Current Rate", "User Enter", "Default Rate")),
          div(class = "g2", div(class = "gbox col", span(class = "glab", "Rate pull"), span(class = "gval xs", textOutput(sprintf("pull_%d_rate", i), inline = TRUE))),
              div(class = "gbox col", span(class = "glab", "Interest PMT"), span(class = "gval xs", textOutput(sprintf("pull_%d_int", i), inline = TRUE), span(class = "unit", "/mo")))),
          cond(sprintf("%s == 'User Enter'", P("RateSel")), num("UserRate", "User rate %", 0.25, pct = TRUE))),
        section("Legal", sprintf("sum_%d_legal", i), FALSE,
          div(class = "g2", num("LegalInit", "Initial legal ($)", 1000), num("LegalStartM", "Start month", 1), num("HoldCost", "Holding cost ($/mo)", 100), num("LegalEndM", "End month", 1)),
          sel("AddBack", "Add back to exit")),
        section("Exit", sprintf("sum_%d_exit", i), TRUE,
          sel("ExitType", "Exit type"),
          cond(sprintf("%s == 'DPO'", P("ExitType")), num("DPOPct", "DPO %", 1, pct = TRUE)),
          cond(sprintf("%s == 'User Enter'", P("ExitType")), num("UserExit", "Exit amount ($)", 1000)),
          cond(sprintf("%s == 'Value Cap'", P("ExitType")), num("ValCapPct", "Value cap %", 5, pct = TRUE)),
          cond(sprintf("%s == 'YTM Sell Solve' || %s == 'IRR Solve'", P("ExitType"), P("ExitType")), num("YTMTgt", "YTM target %", 0.5, pct = TRUE)),
          cond(sprintf("%s == 'Liquidation'", P("ExitType")), num("LiqAcrM", "Liquidation forward accrual months", 1)),
          div(class = "g2", sel("AddAccrued", "Add current accrued"),
              field("Bid override ($)", num_in(id("BidOverride"), if (is.na(L$BidOverride)) NULL else L$BidOverride, 1000, placeholder = "—"))),
          div(class = "g2", field("Start month", num_in(id("StartMonth"), L$StartMonth, 1, 1, 60)), field("Exit month", num_in(id("ExitMonth"), L$ExitMonth, 1, 1, 60))))))
  }

  kpi_out <- function(f, fmt) renderText({ req(rv$rel); fmt_or(rv$rel$tot[[f]], fmt) })
  output$kBid <- kpi_out("BidUsed", "money"); output$kPct <- kpi_out("BidPct", "pct"); output$kCY <- kpi_out("CY12", "pct")
  output$kMOIC <- kpi_out("MOIC", "num2"); output$kYTM <- kpi_out("YtmIRR", "pct2"); output$kMinH <- kpi_out("MinHAll", "num0")
  output$status <- renderText(rv$status)

  # -- charts (colors follow the theme)
  pal <- reactive({
    dark <- isTRUE(input$dark)
    list(text = if (dark) "#E6E8EE" else "#2B2F3A", muted = if (dark) "#9AA0AE" else "#7A8090", grid = if (dark) "#3A3F4C" else "#E4E6EC",
         accent = if (dark) "#A98BF5" else "#6B4FC6", good = if (dark) "#4FD19A" else "#1E9A6A", cy = if (dark) "#4FB6CC" else "#2E93A6", moic = if (dark) "#E08A6C" else "#C7694F",
         loans = if (dark) c("#A98BF5", "#8B73D6", "#6A57B3", "#544593", "#C9B8F5", "#7E6DC0") else c("#5B3FB0", "#8B73D6", "#C4B5EA", "#6F5AC0", "#A997E3", "#3D2A80"))
  })
  theme_rp <- function(p) theme_minimal(base_size = 11, base_family = "") +
    theme(panel.grid.minor = element_blank(), panel.grid.major = element_line(color = p$grid, linewidth = 0.4), axis.text = element_text(color = p$muted, size = 8.5),
          axis.title = element_blank(), legend.position = "top", legend.title = element_blank(), legend.text = element_text(color = p$muted, size = 8.5),
          plot.background = element_blank(), panel.background = element_blank(), legend.key.size = grid::unit(9, "pt"), plot.margin = margin(2, 6, 2, 2))
  money_k <- function(x) ifelse(abs(x) >= 1e6, paste0("$", formatC(x / 1e6, format = "f", digits = 1), "M"), paste0("$", formatC(x / 1e3, format = "f", digits = 0), "k"))

  output$cfplot <- renderPlot({
    R <- rv$rel; req(R); p <- pal(); nos <- loan_nos(R)
    d <- do.call(rbind, lapply(seq_along(R$loans), function(i) data.frame(Loan = factor(nos[i], levels = nos), Month = 1:60, Net = R$loans[[i]]$Net)))
    ggplot(d, aes(Month, Net, fill = Loan)) + geom_col(width = 0.85) +
      scale_y_continuous(trans = scales::pseudo_log_trans(sigma = 2000, base = 10), labels = money_k, breaks = c(-1e5, -1e4, 0, 1e4, 1e5, 1e6, 1e7)) +
      scale_x_continuous(breaks = c(1, 12, 24, 36, 48, 60)) + scale_fill_manual(values = rep_len(p$loans, length(nos))) + theme_rp(p)
  }, bg = "transparent")
  output$bidplot <- renderPlot({
    R <- rv$rel; req(R, !is.null(R$rel_opt)); p <- pal()
    d <- R$rel_opt; cur <- max(vapply(R$loans, `[[`, integer(1), "ExitMonth"))
    g <- ggplot(d, aes(M, Bid)) + geom_area(fill = p$accent, alpha = 0.15) + geom_line(color = p$accent, linewidth = 0.9) +
      geom_vline(xintercept = cur, linetype = "dashed", color = p$muted, linewidth = 0.4) +
      scale_y_continuous(labels = function(x) paste0("$", formatC(x / 1e6, format = "f", digits = 2), "M")) + scale_x_continuous(breaks = c(1, 12, 24, 36, 48, 60)) + theme_rp(p)
    if (!is.na(R$tot$MinHAll)) g <- g + geom_vline(xintercept = R$tot$MinHAll, linetype = "dotted", color = p$good, linewidth = 0.6)
    if (any(d$PassAll)) g <- g + geom_point(data = d[d$PassAll, ], color = p$good, size = 1.4)
    g
  }, bg = "transparent")
  output$curveStats <- renderUI({
    R <- rv$rel; req(R, !is.null(R$rel_opt)); d <- R$rel_opt; pk <- which.max(d$Bid)
    div(class = "stats", span("Peak ", tags$b(fmt_value(d$Bid[pk], "money")), sprintf(" at M%d", pk)),
        span("First all-pass ", tags$b(style = "color:var(--good-text5)", if (is.na(R$tot$MinHAll)) "—" else paste0("M", R$tot$MinHAll))))
  })

  # -- Optimal
  observeEvent(input$optSel, { rv$optSel <- as.integer(input$optSel) }, ignoreInit = TRUE)
  opt_sel <- reactive({
    R <- rv$rel; req(R); sel <- input$optLoan
    if (is.null(sel) || sel == "rel" || is.na(suppressWarnings(as.integer(sel))) || as.integer(sel) > length(R$loans)) list(opt = R$rel_opt, L = R$tot, k = 0L)
    else { k <- as.integer(sel); list(opt = R$loans[[k]]$Opt, L = R$loans[[k]], k = k) }
  })
  output$optSelTxt <- renderText(paste0("M", rv$optSel))
  output$optRows <- renderUI({
    s <- opt_sel(); d <- s$opt; sel <- rv$optSel
    flag <- function(ok) span(class = paste("c", if (ok) "ok" else "no"), if (ok) "✓" else "·")
    lapply(seq_len(nrow(d)), function(i) div(class = paste("opt-row", if (d$M[i] == sel) "sel" else if (d$PassAll[i]) "pass"), `data-m` = d$M[i],
      span(d$M[i]), span(fmt_or(d$Bid[i], "money")), span(fmt_or(d$BidPct[i], "pct")), span(fmt_or(d$YTM[i], "pct2")), span(fmt_or(d$CY12[i], "pct")),
      flag(d$PassYTM[i]), flag(d$PassCY[i]), flag(d$PassMOIC[i]), span(fmt_or(d$MOIC[i], "num2"))))
  })
  output$optplot <- renderPlot({
    s <- opt_sel(); d <- s$opt; C <- rv$rel$ctx; p <- pal()
    ylo <- 0; yhi <- max(0.16, min(1, max(c(d$YTM, d$CY12[d$M > 12], C$HurdleYTM, C$HurdleCY) * 1.15, na.rm = TRUE)))   # ignore the pre-12-month CY spike
    mlo <- min(0.9, min(d$MOIC, na.rm = TRUE)); mhi <- max(1.7, max(c(d$MOIC, C$HurdleMOIC), na.rm = TRUE) * 1.05)
    tr <- function(m) (m - mlo) / (mhi - mlo) * (yhi - ylo) + ylo
    dd <- rbind(data.frame(M = d$M, v = d$YTM, s = "YTM"), data.frame(M = d$M, v = d$CY12, s = "12M CY"), data.frame(M = d$M, v = tr(d$MOIC), s = "MOIC"))
    dd$s <- factor(dd$s, levels = c("YTM", "12M CY", "MOIC"))
    g <- ggplot(dd, aes(M, v, color = s)) + geom_line(linewidth = 0.9, na.rm = TRUE) +
      geom_hline(yintercept = C$HurdleYTM, linetype = "dashed", color = p$accent, linewidth = 0.4) + geom_hline(yintercept = C$HurdleCY, linetype = "dashed", color = p$cy, linewidth = 0.4) +
      geom_hline(yintercept = tr(C$HurdleMOIC), linetype = "dashed", color = p$moic, linewidth = 0.4) +
      geom_vline(xintercept = rv$optSel, linetype = "dashed", color = p$text, linewidth = 0.4) +
      scale_color_manual(values = c(YTM = p$accent, `12M CY` = p$cy, MOIC = p$moic)) +
      scale_y_continuous(limits = c(ylo, yhi), labels = function(x) paste0(round(x * 100), "%"), sec.axis = sec_axis(~ (. - ylo) / (yhi - ylo) * (mhi - mlo) + mlo, labels = function(x) sprintf("%.1fx", x))) +
      scale_x_continuous(breaks = c(1, 12, 24, 36, 48, 60)) + theme_rp(p)
    if (!is.na(s$L$MinHAll)) g <- g + geom_vline(xintercept = s$L$MinHAll, color = p$good, linewidth = 0.6)
    g
  }, bg = "transparent")
  output$optNote <- renderUI({ C <- rv$rel$ctx; req(C); HTML(sprintf("Dashed horizontals are the hurdles (%s &middot; %s &middot; %.2f). Green line marks the first month all three pass.", fmt_value(C$HurdleYTM, "pct"), fmt_value(C$HurdleCY, "pct"), C$HurdleMOIC)) })
  output$minh <- renderUI({
    s <- opt_sel(); L <- s$L; f <- function(v) if (is.na(v)) "—" else as.character(v)
    div(class = "minh", div(div(class = "k", "Min H (YTM)"), div(class = "v", f(L$MinHYTM))), div(div(class = "k", "Min H (CY)"), div(class = "v", f(L$MinHCY))),
        div(div(class = "k", "Min H (MOIC)"), div(class = "v", f(L$MinHMOIC))), div(class = "good", div(class = "k", "Min H (All)"), div(class = "v", f(L$MinHAll))))
  })
  observeEvent(input$usemonth, {
    s <- opt_sel(); m <- rv$optSel; req(m >= 1, m <= 60)
    if (s$k == 0) { push_undo(); loans <- rv$rel$loans; for (i in seq_along(loans)) loans[[i]]$ExitMonth <- as.integer(m)
      rv$loading <- TRUE; ms <- recalc(loans); rv$gen <- rv$gen + 1L; rv$loading <- FALSE
      set_status("Exit Month -> %d on %d loans | Bid %s | %.0f ms", m, length(loans), fmt_value(rv$rel$tot$BidUsed, "money"), ms) }
    else { if (apply_input(s$k, "ExitMonth", m)) updateNumericInput(session, sprintf("L%d_ExitMonth", s$k), value = m) }
  })

  # -- Pay history
  output$payNote <- renderUI({ C <- rv$rel$ctx; req(C); span("Trail selection: ", tags$b(style = "color:var(--text)", C$TrailDisp), " · anchored ", format(C$AnchorDt, "%m/%d/%y")) })
  output$payStats <- renderUI({
    R <- rv$rel; req(R, rv$trails); C <- R$ctx; nos <- loan_nos(R); n <- length(nos); m <- rv$trails$matrix
    ip <- function(L) L$UPB * L$CRate / 12
    cols <- sprintf("180px repeat(%d, minmax(150px, 1fr)) minmax(150px,1fr)", n)
    tfmt <- function(v) fmt_or(v, row_fmt("T3", "money", C))
    row <- function(label, vals, tot, fmt = fmt_or, fmtarg = "money", hl = FALSE) div(class = paste("stat-row", if (hl) "hl"), style = paste0("grid-template-columns:", cols),
      span(label), lapply(vals, function(v) span(fmt(v, fmtarg))), span(fmt(tot, fmtarg)))
    tr <- function(f, nn) vapply(R$loans, function(L) trail_display(L[[f]], nn, C$TrailDisp, L$CPmt, ip(L)), numeric(1))
    trT <- function(f, nn) trail_display(R$tot[[f]], nn, C$TrailDisp, R$tot$CPmt, R$tot$IntPmt)
    cnt <- function(nn) colSums(m[seq_len(nn), , drop = FALSE] > 0)
    pct12 <- vapply(R$loans, function(L) if (L$CPmt > 0) L$T12 / (L$CPmt * 12) else NA_real_, numeric(1))
    last <- vapply(seq_len(n), function(i) { k <- which(m[, i] > 0); if (length(k)) rv$trails$labels[min(k)] else "—" }, character(1))
    tfmt2 <- function(v, ...) tfmt(v)
    tagList(
      div(class = "stat-hdr", style = paste0("grid-template-columns:", cols), span(""), lapply(nos, function(x) span(class = "mono", x)), span("Relationship")),
      row("Contract PMT", vapply(R$loans, `[[`, numeric(1), "CPmt"), R$tot$CPmt), row("Interest PMT", vapply(R$loans, ip, numeric(1)), R$tot$IntPmt),
      row("3M trail", tr("T3", 3), trT("T3", 3), tfmt2), row("6M trail", tr("T6", 6), trT("T6", 6), tfmt2), row("12M trail", tr("T12", 12), trT("T12", 12), tfmt2, hl = TRUE),
      row("24M trail", tr("T24", 24), trT("T24", 24), tfmt2), row("36M trail", colSums(m), sum(m)),
      row("# of PMT's made (12M)", cnt(12), sum(cnt(12)), function(v, ...) as.character(v)), row("# of PMT's made (36M)", cnt(36), sum(cnt(36)), function(v, ...) as.character(v)),
      row("12M % of contractual", pct12, if (R$tot$CPmt > 0) R$tot$T12 / (R$tot$CPmt * 12) else NA, fmt_or, "pct"),
      row("Last payment", last, "—", function(v, ...) v))
  })
  output$payMatrix <- renderUI({
    R <- rv$rel; req(R, rv$trails); tr <- rv$trails; nos <- loan_nos(R); n <- length(nos); m <- tr$matrix
    a <- pd_key(R$ctx$AnchorDt); pds <- pd_add(a, -(0:35)); yrs <- pds %/% 100; mos <- pds %% 100
    block <- function(no, pmt, vals, is_rel = FALSE) {
      cells <- list(div(""), lapply(month.abb, function(x) div(class = "mh", x)))
      for (y in sort(unique(yrs))) {
        cells <- c(cells, list(div(class = "yr", y)))
        for (mo in 1:12) {
          k <- which(yrs == y & mos == mo)
          cells <- c(cells, list(if (!length(k)) div(class = "c none", "") else {
            v <- vals[k]; cls <- if (v == 0) "miss" else if (v < 0.9 * pmt) "short" else if (is_rel) "rel" else ""
            div(class = paste("c", cls), if (v == 0) "—" else fmt_value(v, "money")) }))
        }
      }
      div(style = "display:flex; flex-direction:column; gap:6px;", div(class = "mx-hd", span(class = "no", no), span(class = "sub", sprintf("contractual PMT %s/mo", fmt_value(pmt, "money")))), div(class = "mx", cells))
    }
    sel <- input$payLoan; ks <- if (is.null(sel) || sel == "rel" || is.na(suppressWarnings(as.integer(sel)))) seq_len(n) else as.integer(sel)
    blocks <- lapply(ks, function(i) block(nos[i], R$loans[[i]]$CPmt, m[, i]))
    if (length(ks) == n && n > 1) blocks <- c(blocks, list(block("Relationship", R$tot$CPmt, rowSums(m), TRUE)))
    div(class = "matrix", blocks)
  })

  for (id in c("optRows", "optSelTxt", "optNote", "minh", "payNote", "payStats", "payMatrix")) outputOptions(output, id, suspendWhenHidden = FALSE)

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
      opt <- do.call(rbind, c(lapply(R$loans, function(L) cbind(LoanNo = L$LoanNo, L$Opt)), list(cbind(LoanNo = "Relationship", R$rel_opt))))
      openxlsx::addWorksheet(wb, "Optimal"); openxlsx::writeData(wb, "Optimal", opt)
      tr <- rv$trails; pm <- data.frame(Month = tr$labels, as.data.frame(tr$matrix, check.names = FALSE), Total = rowSums(tr$matrix), check.names = FALSE)
      openxlsx::addWorksheet(wb, "PayHistory"); openxlsx::writeData(wb, "PayHistory", pm)
      openxlsx::saveWorkbook(wb, file, overwrite = TRUE)
    })
}

shinyApp(ui, server)
