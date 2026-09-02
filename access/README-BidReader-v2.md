# Relationship Projection v2 — Access bid database

A redesigned, standalone, **read-only** Access database that does what the Bid_Project
workbook's *Relationship Projection* sheet does — snappier, with the YTM calcs the sheet
has, in the sheet's own top-to-bottom layout. Design: `docs/BIDREADER-V2-DESIGN.md`;
interface contract: `docs/BIDREADER-V2-CONTRACT.md`; numeric oracle:
`scripts/bid_engine_ref.py`.

## What changed vs v1.3

- **One server round trip per relationship** (a pass-through `UNION ALL` returning the loan
  snapshot, relationship scalars and *all* pay history), then everything is in memory.
  No linked tables at all — SQL Server cannot be written by construction.
- **Zero injected code.** Six real VBA modules; every form event is a `=BR_Xxx()` property
  calling a Public function — the whole class of generator failures we hit before is gone.
- **YTM (IRR), YTM (XIRR), Sell YTM, IRR Solve exit type, Bid Override**, the 60-month
  **Optimal** table with **hurdle months**, Trail Selection transforms, and the relationship
  column — all per the sheet's formulas.
- The sheet's vertical layout: 58 category rows down the left, 10 loan columns + Relationship
  column, yellow = editable, white = data, green = computed. Paging for > 10 loans.
- Pages: Projection · Optimal · Pay History · Collateral in one window; Print/PDF and
  Export to .xlsx (both built into Access — no executables).

## Install (once)

1. Blank `.accdb` on a machine with the `sqlDueDiligence` DSN → Enable Content.
2. **Alt+F11 → File → Import File…** for each of these seven files (any order):
   `modBR_Fin.bas`, `modBR_Engine.bas`, `modBR_Data.bas`, `modBR_UI.bas`,
   `modBR_Build.bas`, `modBR_SelfTest.bas`, `modBR_Vectors.bas`.
3. **Debug → Compile** (fix nothing yet — just confirm it compiles; if it doesn't, send the error).
4. **Ctrl+G** and run `BR_SelfTest` — the fidelity gate. It prints pass/fail counts; results in
   `xtblBR_TestResults`. Expect **FIDELITY GATE: PASS**. (This needs no SQL Server.)
5. **Ctrl+G** and run `BuildBidReaderV2`.
6. Open **frmBidReader**: pick Project → Relationship.

Rebuilding (re-running `BuildBidReaderV2`) recreates the forms; your inputs/settings persist in
`xtblBR_Inputs` / `xtblBR_Settings`. v1.3 inputs are migrated the first time a relationship is
opened; v1.3 objects are left untouched for rollback.

## Using it

- Yellow cells edit in place; the model recalculates and repaints on every change; the
  status line shows what changed, the old → new Bid, and the milliseconds.
- Header globals: PMT History Date (trailing windows + matrix), Cutoff Date (MTM/YTM/XIRR
  dates), Yield, YTM Min Months (the YTM sheet's J2 floor), Trail Selection.
- Buttons: Reload (re-pull the tape, keep inputs), Undo (one step), Reset loan / Reset all
  (click twice within 5 s), Apply to all (copies the last edited value to every loan),
  Print (report preview → PDF), Export .xlsx (Projection + Optimal + Collateral sheets to
  `Documents\BidReader`).
- Optimal page: pick a loan (or `*` = relationship), set hurdles, double-click a month row or
  press "Use month as Exit" to make it the Exit Month.
- Collateral page: what-if valuation strip (SF / Unit / Acre × value) — scratch only.

## Diagnostics

- `BR_SqlCheck` — with a relationship loaded: local trailing sums and the 36-month matrix vs
  the server-side pivot; must be 0 mismatches.
- `BR_Bench` — times load + calc over the first 20 relationships of the current project.
- `BR_UISmoke` — opens the form, loads, edits a cell, walks the pages.
- `BR_LinkForBrowsing` (optional) — links the six tables for ad-hoc browsing; the app never
  uses links.

## CONFIRM items (settle these against the workbook once; each is a constant or vector)

1. YTM block / MTA / MFTA use the **contractual** Rate and PMT (current) — or the pulls?
   (`YTM_USE_PULLS` in modBR_Engine.)
2. Cutoff date source: `xTblCFparameters` start month (current) or the PMT History month?
3. IRR Solve holding window: closed form holds through exit−1 while the stream holds through
   exit; `pvLeg` counts Initial Legal when Legal Start = 0 — both reproduced verbatim.
4. YTM Sell Solve when min(MTM, MTA) ≤ Exit Month: currently falls back to PIF.
5. Optimal table YTM definition: contractual-hold yield priced at Bid_m (`OPT_YTM_MODE = 0`).
6. MTM when the maturity date is missing: currently 0.

## Troubleshooting

- *"Cannot reach sqlDueDiligence"* in the status line: the DSN is missing on this machine or
  the network is down; click Reload after fixing.
- Tab pages not created on your Access version: set `USE_TABCTL = False` in modBR_Build and
  rebuild (a label strip switches four stacked pages instead).
- *"…has N controls (limit …)"* during build: the control budget assertion fired — send the
  message; `NCOLS` in modBR_Engine can be lowered to 8 as a stopgap.
- Compact on Close is recommended (`qptBR_Rels` is rewritten on every project change).
