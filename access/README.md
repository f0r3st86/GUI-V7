# MidwestDDi Access Front-End Builder

`BuildFrontEnd.bas` generates a complete Access front-end for the MidwestDDi
database on any machine that has the `sqlDueDiligence` DSN (i.e. anywhere the
production Access app works). It creates **linked tables** (live, editable,
writing straight to SQL Server) and a set of forms mirroring the Architecture
workbook's views and editability rules.

## What it builds

| Object | Purpose |
|---|---|
| Linked tables | tblRelationships, tblLoan, CollateralInfo, tblTasks, tblBorrowers, tblBorrowerLookup, tblcomments, tblPayHistory |
| `qryRelationshipSummary` | Relationships with loan count + total UPB, ordered by Project → SortNo |
| `frmBrowser` | Portfolio browser — double-click a relationship to open it |
| `frmWorkbench` | Relationship workbench: flag checkboxes (editable), loan grid, collateral grid, tasks, and the four narrative sections bound directly to tblRelationships |
| `frmLoanList` / `frmLoanDetail` | Read-only grid (principal descending) → double-click for the fully editable detail panel (workbook layout) |
| `frmCollateralList` / `frmCollateralDetail` | Same pattern for collateral |
| `frmTasks` | Task cards with a perpetual new-entry row (EntryDate defaults to now) |

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
   open **frmBrowser**.

Re-running `BuildAll` rebuilds everything from scratch (safe to repeat).

## Notes and cautions

- **Edits are live production writes.** Every field you change in a detail
  panel hits SQL Server when you leave the record — same as the production
  Access app. There is no undo.
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
