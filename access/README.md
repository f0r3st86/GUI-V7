# MidwestDDi Access Front-End Builder

`BuildFrontEnd.bas` generates a complete Access front-end for the MidwestDDi
database on any machine that has the `sqlDueDiligence` DSN (i.e. anywhere the
production Access app works). It creates **linked tables** (live, editable,
writing straight to SQL Server) and a set of forms mirroring the production
DD.Main app, rebuilt from the full reverse-engineering pass in
`docs/DDMAIN-PRODUCTION-REFERENCE.md` (build plan: `docs/ACCESS-V7-GAP-PLAN.md`).

## What it builds (v7.0)

| Object | Purpose |
|---|---|
| 27 linked objects | The 14 core tables plus the production server views (`vwRelationshipSummary`, `vwCollateralSummary`, `vwTitleDetail`, financial/property views) and lookups (`ztblCommentGroups`, `ztblLogins`, `zCollateralCodes`, `zBKStatus`, `tblLiens`, `tblFinancialCMR/PFS`, `tblPools`) |
| `qryLoansSorted` | The pinned loan grid source — binds `vwRelationshipSummary` joined to the local project scope (server-computed **12 Pmts** column), falling back to `tblLoan` if the view is unavailable |
| `frmLogin` | Project **and initials** pick — writes `xtblLocalCurrentProject` / `xtblLocalCurrentUser`, which scope every query and stamp every write (the production frmLogin flow) |
| `frmBrowser` | Portfolio browser — double-click a relationship to open it |
| `frmWorkbench` | Relationship workbench: flag checkboxes, pinned loan grid, 13-tab strip in production order, and the production **"Items Currently Activated"** state footer that every write path reads |
| `frmLoanDetail` | Fully editable loan panel — RateType/AssetType/CF Likelihood combos use the recovered production value lists |
| `frmCollateralDetail` | Same for collateral — collateral-code combo reads `zCollateralCodes` |
| Comment tab | The production comment center: category filter (default `**Show All**`), 150-char preview list, editor subform with the relationship-level sentinel caption, and **New Loan/Rel Comment** buttons running the production keys-only INSERT + `Max(KeyProvision)` refocus |
| Collateral tab | **Add Collateral** button: `Max(Priority)+1` mint, `'**ADDED**'` group, typed-`yes` confirm |
| BPOTitleUCC tab | Live BPO/Title order lists plus **Order BPO** (First/Second/Third slots, 3-order cap, seven collateral-field guards, `#9/9/1999#` sentinel date, `LO-BPO`) and **Order Title** (`MWTitle`/`LO-Title`) |
| `frmTasks` | Production defaults (EntryDate=Now, DueDate=Date, loan/project keys from session state), officer combos over `ztblLogins`, `***` Task For filter, DueDate-desc sort |

Editability follows the workbook's yellow-cell convention: grids read-only,
detail panels and flags editable, keys (`MWLoanNo`, `MWPropertyNo`,
`SortNo`, `RelatedLoans` on the workbench) locked and grey.

## How to run

1. **New blank database**: open Access → Blank database → save it anywhere
   (e.g. `MidwestDDi-FrontEnd.accdb`). Do this on the machine where the
   production Access app works (that proves the DSN + permissions).
2. **Enable content** when the yellow security bar appears.
3. Press **Alt+F11** → File → Import File… → choose `BuildFrontEnd.bas`.
4. Press **Ctrl+G** (Immediate window), type `BuildAll`, press **Enter**.
5. Wait a few seconds for the success message, close the VBA editor, and
   open **frmLogin** (pick project + initials).

Re-running `BuildAll` rebuilds everything from scratch (safe to repeat;
your project/user selections persist).

## Notes and cautions

- **Edits are live production writes.** Every field you change in a detail
  panel hits SQL Server when you leave the record — same as the production
  Access app. There is no undo. The Order/Add buttons INSERT real rows
  (comments, collateral, BPO/Title orders) exactly like production.
- **Some links may fail on your server** (e.g. a view that doesn't exist).
  The build reports which linked and which didn't, and keeps going — the
  loan grid automatically falls back to `tblLoan` if
  `vwRelationshipSummary` is missing. Features tied to a missing lookup
  (a combo's dropdown) degrade to typed entry.
- **New tasks**: if `tblTasks.KeyGenerator` is not an IDENTITY column, new
  task rows will fail with a key error — open `BuildFrontEnd.bas` and
  uncomment the `KeyGenerator.DefaultValue` line in `BuildFrmTasks`, then
  re-run `BuildAll`.
- **Nullable bit columns** (`LowYieldAsset`, `PossibleEnvironmental`) can
  produce Access "write conflict" errors when NULL. If a flag refuses to
  save, that's why — tick it via a query once, after which it edits fine.
- The generated layouts are functional, not polished — open any form in
  Design View to rearrange. The builder only runs once; your layout edits
  survive until you re-run `BuildAll` (which rebuilds from scratch).
- This front-end is **independent of the production Access app** — it never
  modifies it, and both can be open simultaneously.
