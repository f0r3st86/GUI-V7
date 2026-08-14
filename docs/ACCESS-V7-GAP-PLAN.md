# ACCESS-V7-GAP-PLAN — gap analysis and build plan for the v7 VBA generator

**Inputs**: `docs/DDMAIN-PRODUCTION-REFERENCE.md` (authoritative, cited as §n.n),
`access/BuildFrontEnd.bas` (v6, 989 lines), `docs/ACCDE-EXTRACTION.md`, and the miner files
(`mine/write-paths.md`, `mine/forms-map.md`, `mine/combos-defaults.md`).

**Goal**: a "better Access version" — close the highest-value gaps between the v6 generated
front-end and production DD.Main, in an order that never risks the build (six prior build
failures inform the hard constraints in §0).

---

## 0. Hard generator constraints (violating any of these breaks the build)

Every phase below must be implemented inside these rules. They are restated here because
each one was learned through a real build failure:

1. **DAO `CreateTableDef` for ODBC links** — exact production names, **no `dbo_` prefix**
   (try `dbo.<name>` as SourceTableName first, fall back to bare name, as v6's
   `LinkTables` already does). Production maps every local name 1:1 to `dbo.<same>` (§4.1).
2. **Connection string must include `TrustServerCertificate=Yes`** (v6 `CONNECT` const is
   correct — reuse it verbatim; production stores the same flag, §4.1).
3. **Every event** = `mdl.CreateEventProc` **AND** explicitly setting the property to
   `"[Event Procedure]"` — and the property set must happen **AFTER** the control has its
   final name. Order in every builder sub: create control → rename → set `On*` property →
   `CreateEventProc` → `InsertLines`.
4. **Never set properties that don't exist on a control type.** No `OnUpdated` on combos;
   no `Format` on listboxes; no `LimitToList` on textboxes. When unsure wrap in
   `On Error Resume Next` only for *cosmetic* properties (v6 pattern) — never for events.
5. **Max ~24 line-continuations per statement.** All long injected code is built as one
   `code = code & "…" & vbCrLf` statement per line (v6's `OvLayout` injection is the
   template). Same for long SQL: one concatenation statement per clause.
6. **Palette colors as `Const Long`** at module top (v6's `CLR_*` set — keep).
7. **Controls renamed with `txt`/`cbo`/`lst` prefixes BEFORE event wiring** (the
   `GridCell` helper's `c.Name = "txt" & …` pattern; event procs must target the final
   name).
8. **Forms must remain scrollable** (`frm.ScrollBars = 3` in `NewDarkForm` — keep; never
   set `AutoResize`/`AutoCenter` combinations that clip the detail section; tab-page
   content must fit or the page clamps, per the `OvLayout` BOTY clamp).

Additional conventions carried forward from v6 that v7 keeps: `DropIfExists`/`DropQuery`
idempotent rebuild, `SaveAs` temp-name→final-name rename, `EnsureLocalProjectTable`
persistence across rebuilds.

---

## Part A — What v6 already matches (keep, don't rebuild)

| v6 feature | Production counterpart |
|---|---|
| 14 ODBC links, exact names, dbo. fallback, TrustServerCertificate=Yes | §4.1/§4.2 link model |
| `xtblLocalCurrentProject` single-row scope table, written by frmLogin (Delete-all + Insert) | `zxTblLOCALCurrentProject` session bootstrap (§1.2, write-paths §1) |
| frmLogin project pick → scopes every query | frmLogin project pick (§1.2) — minus auth, see Gap B14 |
| frmBrowser relationship list w/ flags, UPB, dbl-click open | RelatedLoanLookup + SortNo ordering (§2.2) |
| frmWorkbench: pinned loan grid + flag panel + 13-page tab in **production stored order** (Loan · Collateral · Obligor · Comment · BPOTitleUCC · PayHist · FinStmts · Projections · Strategies · Tasks · Overview · Property [+Report]) | frmLoanView TabCtl6 (§2.2) |
| Six relationship flags bound to tblRelationships (immediate save on tick) | footer `CheckRel*`/`chkLowYldAsset` → `Update tblRelationships Set <flag>` (§3.10) — same net effect via bound prepared UPDATE |
| frmLoanDetail full loan panel (balances/dates/rate structure, all §2.3 columns incl. `[Unfunded Commitment]`) | frmLoanDetail (§2.3) — minus Ah/Bhd, Gap B13 |
| Collateral grid + detail popup (tax/lien/CoStar-adjacent fields) | CollateralDetail/frmCollateralPopup (§2.4) — read/edit only, no add/delete/reorder |
| Tasks page, `EntryDate = Now()` default, perpetual new row | frmTasks bound creation (§2.7, write-paths §14) — partial, Gap B7 |
| Overview auto-grow memo stack (3 memos incl. ConditionsDeadlines) | frmOverview (§2.7) |
| Strategies memos (ExitStrategyOverview, Original_Strategy) | frmRelatedStrategy (§2.7) — minus ExitCode combo, Gap B5 |
| BPO/Title/PayHist raw datasheet pages | placeholder-level only — Gaps B3/B4/B8 |
| `qryBidLiquidationValues` (raw/adj liq value, flat 0.8) | `aaaBiddingCollateralValueSummary` math (§5.1) — minus per-code z_CCodes rates, Gap B12 |
| cboRelationship nav combo, Current-event sync | RelatedLoanLookup navigation (§2.2) |

---

## Part B — Gaps vs production

Ordered by (value ÷ cost). Cost: **S** ≈ ≤40 generator lines, **M** ≈ 40–150, **L** ≈ 150+.

### B1. 40 missing ODBC links — especially the server views  · **Value: High · Cost: S**
**Production** (§4.2/§4.3): 54 links. The LoanView grids bind server views —
`vwRelationshipSummary` (adds computed `amtpd` "12 Pmts", §5.10), `vwCollateralSummary`
(MaxBPO/MinBPO/NetValue), `vwTitleDetail`, `vwlstFinancialItemsRowSrc`,
`vwPropertyStmtsSummary` — plus tables v6 lacks: `tblLiens`, `ztblCommentGroups`,
`ztblLogins`, `tblFinancialCMR/PFS`, `tblProjections`, `tblPropertyStatements`, `tblPools`,
`zCollateralCodes`, `zBKStatus`, `zBusCallCodes`, `ztblGroups`, `xTblCFparameters`.
**Generator notes**: extend the `tables` array in `LinkTables` (tiered — see v7.0 checklist).
Views link **read-only without a unique-index designation — that matches production**
(§4.2 "All 17 views are read-only in practice"); do *not* run `CREATE UNIQUE INDEX` on view
links. Keep the existing per-table error accumulation so one missing server object doesn't
kill the build (dormant tables may not exist on a given server).

### B2. Loan grid binds tblLoan, not vwRelationshipSummary  · **Value: High · Cost: S**
**Production** (§5.10): the pinned grid is
`SELECT MWLoanNo, …, amtpd, OrgNoteDate FROM vwRelationshipSummary INNER JOIN
zxTblLOCALCurrentProject ON ProjectName=CurrentProject ORDER BY PrincipalBalance DESC`.
**Generator notes**: change `qryLoansSorted` to select from `vwRelationshipSummary` joined
to `xtblLocalCurrentProject`; add an `amtpd` column ("12 Pmts", `$#,##0`) and
`Rate*100`/`DefaultRate*100` display columns (§2.2 LstRelatedLoans). Grid stays read-only,
so the view's read-only link is fine. Keep dbl-click → frmLoanDetail (which stays bound to
the base `tblLoan`).

### B3. Comment tab is a raw datasheet; production is the app's core editor  · **Value: High · Cost: M**
**Production** (§2.6, §3.13): `lstComments` (`Left([Comment],150) AS [Comment Detail]`,
`ORDER BY Date DESC`; `ORDER BY Group, KeyProvision` when filtered), `CommentFilter` combo
(ztblCommentGroups, default `**Show All**`), editor subform with `Date` default `=Date()`,
`AcctOfficer` combo over ztblLogins, `txtGroup` category combo (excludes `**Show All**`,
`ORDER BY ReportPriority, GroupName`), relationship-level sentinel caption
(`IIf([MWLoanNo]=[RelatedLoans], "Relationship Level…", "Loan Level…")`), and the
**add-comment write path** (keys-only INSERT, identity re-find — exact SQL in Part C).
**Generator notes**: new `BuildFrmCommentsSub` (continuous, record source filtered by
subform master/child `ProjectName;RelatedLoans`); on pgComment replace `Table.tblcomments`
with it plus `lstComments` listbox whose row source is rebuilt in the workbench Current
event (inject one `code = code &` line per SQL clause). `cmdNewComment` click proc runs the
INSERT then `Me.Requery`. Combos: set `RowSourceType="Table/Query"`, `RowSource`,
`ColumnWidths` (comment picker widths in §7.5: keys hidden, preview 8280) — never touch
non-existent properties. Escape user text with `Replace(x,"'","''")` (v6 login pattern).

### B4. BPOTitle tab: raw datasheets, no order workflow  · **Value: High · Cost: M**
**Production** (§2.2 BPOTitle page, §3.4/§3.5): `LstBPOs` runtime SQL (`…FROM tblBPO WHERE
keys ORDER BY BPODate, BPOBroker`), `LstCollateralItems`, `lstTitleFilter`, plus
`cmdOrderBPO` / `CmdOrderTitle` / `cmdNewTitle` implementing the sentinel-date +
First/Second/Third slot machine with the 0/1–2/3 confirm chain and seven field guards.
**Generator notes**: replace the two `Table.*` subforms with three listboxes (design-time
placeholder row source `SELECT 'nothing' as field1` exactly like production, then runtime
SQL assigned in Current — listboxes accept `RowSource` assignment at runtime with no
Requery quirk). Order buttons per Part C templates. The duplicate-slot picker can be a
3-item value-list combo `"First";"Second";"Third"` (§7.1). Status remains display-only in
v7.0 (admin transitions are B10).

### B5. Naked textboxes where production has table-driven combos  · **Value: Med · Cost: S**
**Production** (§7.1 table-driven catalog, mine/combos-defaults.md): `ExitCode` =
`SELECT ExitCode FROM zExitCodes ORDER BY rowguid`; `MWCollateralCode` =
`SELECT Code, Class FROM zCollateralCodes ORDER BY Class` (widths `2016;864`); `AcctOfficer`
= `SELECT DISTINCTROW Initials FROM ztblLogins`; `BKStatus`/`BusinessCallResult` lookups;
value lists `RateType Variable;Fixed`, `AssetType "No Default";"Payment Default";"Technical
Default"`, `RealEstateGroup "Commercial";"Residential";"Unknown"`, CFLikelyhood `2;"Very
Optimistic";…;-2;"Very Pessimistic"`.
**Generator notes**: add a `DarkComboL` helper (label + `acComboBox`, StyleInput colors,
sets `RowSourceType`, `RowSource`, `ColumnCount`, `BoundColumn`, `ColumnWidths`,
`LimitToList`). Swap into frmLoanDetail (RateType/AssetType/changefreq/PmtFrequency —
code;label pairs need `ColumnCount=2`, `BoundColumn=1`, widths `360;1080`),
frmCollateralDetail (MWCollateralCode, RealEstateGroup), Strategies page (ExitCode).
Requires B1 lookups linked first.

### B6. Collateral add / delete / reorder buttons  · **Value: High · Cost: M**
**Production** (§3.2): Max(Priority)+1 mint, `'**ADDED**'` RealEstateGroup, identity
re-find; delete warns with BPO count, cascades `Status='DELETED'` to tblBPO/tblTitle,
compacts priorities; reorder swaps via sentinel 888. Exact SQL in Part C.
**Generator notes**: three buttons on pgCollateral (`cmdAddCollateral`, `cmdDelCollateral`,
`cmdPriUp`/`cmdPriDown`). All SQL through `CurrentDb.Execute … dbFailOnError` against
linked tables. Typed-`yes` confirm via `InputBox` (production pattern §7.4). v7.0 ships
**add** only; delete+reorder in v7.1 (destructive, needs the active-property state of B9).

### B7. Tasks page: wrong sort, missing defaults/combos/filter  · **Value: Med · Cost: S**
**Production** (§2.7, write-paths §14): `ORDER BY DueDate DESC` (v6 uses EntryDate),
defaults `EntryDate=Now()` ✔ / `DueDate=Date()` ✘ / `MWLoanNo` from active loan ✘;
`AcctOfficer`+`EntryAcctOfficer` combos over ztblLogins; header `cboAcctOfficerFilter`
default `"***"`. Production has a known bug (ProjectName default = MWLoanNo) — **fix it**
in v7: default ProjectName from the scope table.
**Generator notes**: adjust `BuildFrmTasks` record-source ORDER BY; `DefaultValue` strings
(`"=Date()"`, and for keys `"=[Parent]![RelatedLoans]"` — safe because frmTasks only ever
runs as a subform of the workbench). Officer combos per B5 helper.

### B8. PayHist page: unlinked pivot view, no entry grid, no comment writeback  · **Value: Med · Cost: M**
**Production** (§2.2/§2.7): entry grid `frmPayHistSub` (tblPayHistory, keys defaulted from
active loan, ORDER BY year, month) + `LstPayHistorySpreadSub` pivot (JAN–DEC + TOTAL,
`$#,##0`) + `PayHistoryComment` textbox → `Update tblLoan Set PayHistoryComment='…'`.
**Generator notes**: build a small continuous `frmPayHistSub` (mwloanno, year, month,
amount `$#,##0.00;($#,##0.00)`); link the pivot datasheet on `MWLoanNo` once an active-loan
control exists (B9). PayHistoryComment: unbound textbox + AfterUpdate proc executing the
UPDATE (escape quotes). Guard text: "You do not currently have a loan selected…" (§7.4).

### B9. No active-loan / active-property state machine  · **Value: High (enabler) · Cost: S**
**Production** (§2.2 footer): unbound `MWLoanNo`, `txtPropNo`, `txtMWPropertyNo`,
`Priority`, `txtBPODuplicate` etc. — "this footer IS the app's current-record state
machine"; every guard and write path reads it.
**Generator notes**: v6 is bound to tblRelationships (fine — keeps RelatedLoans/
ProjectName), but v7 needs unbound `txtActiveLoan`, `txtActivePropNo`, `txtActivePriority`
on frmWorkbench (footer strip, muted "Items Currently Activated:" label for fidelity).
Set them from subform events: loan grid `Current` → `Me.Parent!txtActiveLoan =
Me!txtMWLoanNo`; collateral grid `Current` → prop no + priority (wrap in
`On Error Resume Next` — Parent absent when the form opens standalone). All B4/B6/B8/C
write paths read these. This is the single most important structural addition in v7.0.

### B10. BPO/Title admin consoles (vendor assign, order, receive, cancel)  · **Value: Med · Cost: L**
**Production** (§2.11, §3.4/§3.5): view-combo-switched qryAdminBPO-*/qryAdminTitle-*
families, batch buffers `xtblBPOSelected`/`xtblTitleSelected`, vendor assignment, Ordered/
Received/Canceled/Restore transitions with exact UPDATE templates and date stamps
(`VendorOrderDt`, `OrderDate`, `CancelDate`).
**Generator notes**: defer to v7.2. When built: one console form, listbox + view combo
(value list §7.1), each transition = one Execute of the write-paths §4/§5 template keyed on
the selected `MWPropertyNo` + slot combo; skip the batch scratch tables initially (operate
on the single selected row).

### B11. FinStmts / Property / Projections tabs are "Coming soon" labels  · **Value: Med · Cost: L**
**Production**: FinStmts lists (`vwlstFinancialItemsRowSrc`, §2.2) + stub-create with
Priority 88 sentinel + CMR/PFS editors (§2.8, §3.7); Property lists (`lstCollForPropinfo`,
`vwPropertyStmtsSummary`) + 7-scenario delete-and-rewrite editor (§2.13, §3.8);
Projections editor with Edit-group clone protocol (§2.9, §3.9).
**Generator notes**: split read vs write. **Read is cheap** once B1 links land: two
listboxes per tab bound to the views, filtered in Current — do in v7.1. **Editors are the
two most complex forms in the app** (CMR ≈ 60 controls + computed totals; property
statements = VBA-managed grid) — v7.2, and consider leaving the property-statement editor
to the React app permanently. Projections: read-only `vwProjections`/`vwProjectionsNet`
datasheets + CFLikelyhood combo (bound to tblLoan) in v7.1; the clone/commit editor is L
and low marginal value (bid engine is unrecoverable VBA anyway, §8.1).

### B12. Bid math uses flat 0.8 instead of z_CCodes advance rates  · **Value: Med · Cost: S**
**Production** (§5.1): AdvanceRate from `z_CCodes.Rate` keyed by collateral code, default
0.8 when absent.
**Generator notes**: v6 already links z_CCodes; rewrite `qryBidLiquidationValues` with
`LEFT JOIN z_CCodes ON c.MWCollateralCode = z_CCodes.<code col>` and
`Nz([Rate],0.8)*Nz([CurrentAppraisedValue],0)…`. Confirm the z_CCodes key column name at
runtime (one `DLookup` probe in the builder; fall back to flat 0.8 and keep the build
green — never let a schema surprise fail the build).

### B13. Ah/Bhd computed control  · **Value: Low · Cost: S**
**Production** (§5.8): `=monthsbetween([duedt],[currentmaturitydate]) -
amortizedmaturity([repayamt],[principalbalance],[rate])` — helper bodies unrecovered.
**Generator notes**: inject a standard module `MWFunctions` with `monthsbetween` =
DateDiff("m") and `amortizedmaturity` = `-Log(1 - P*r/pmt)/Log(1+r)` (monthly r; guard
pmt≤P*r → Null), add `txtAhBhd` to frmLoanDetail. Mark as "verify empirically" (§8.1).

### B14. Real login (ztblLogins auth) + initials in session  · **Value: Low-Med · Cost: M**
**Production** (§1.2): user/password against ztblLogins, AcctDisabled check, LastLogin
stamp, initials drive AcctOfficer defaults everywhere (§7.2).
**Generator notes**: v7.0 does the cheap, useful half — an **initials picker** combo on
frmLogin (`SELECT Initials FROM ztblLogins`) stored in a second local single-row table
`xtblLocalCurrentUser`; AcctOfficer defaults read
`=DLookup("Initials","xtblLocalCurrentUser")`. Password checking is theater on a
trusted-auth ODBC link — skip unless asked (plaintext compare, §1.2).

### B15. Guard/message copy fidelity  · **Value: Low · Cost: S**
**Production** (§7.4): exact wording (typos load-bearing). **Generator notes**: use the
verbatim strings from §7.4 in every guard MsgBox added by B3/B4/B6/B8 — they're short;
inline them (watch constraint 5 for long concatenations).

### B16. House formats  · **Value: Low · Cost: S**
**Production** (§7.3): detail money `$#,##0.00;($#,##0.00)`, grid money `$#,##0` baked in
SQL, dates `mm/dd/yy`, `Percent` on rates. **Generator notes**: v6 mostly complies; sweep
detail textboxes from `$#,##0` → `$#,##0.00;($#,##0.00)`; keep grid SQL-side formatting.

### B17. Reports (rptDetail-ByRelationship etc.)  · **Value: Low for Access track · Cost: L**
**Production** (§6): 55 reports, TVF-driven statement rendering (§6.4). **Generator
notes**: out of scope for the Access rebuild (the React app owns reporting). If ever
needed, start with `qryTaxAnalysis-Output` (§5.6) as a plain export query — S cost, real
value — and stop there.

### B18. Worklists (Tax/Business/BK), move/delete admin, imports  · **Value: Low · Cost: L**
§2.10, §2.12, §3.6, §3.11 — separate consoles off frmMain, batch/import machinery. Not part
of the loan-review workbench; defer indefinitely unless users ask.

---

## Part C — Phased v7 plan

### v7.0 — highest value, lowest risk (target: one generator revision, no new form count beyond FrmCommentsSub + frmPayHistSub)

Scope rule: **read everything through the real production views; wire exactly four write
paths** (the ones below); nothing destructive.

**Recommended v7.0 write paths + exact SQL templates** (from `mine/write-paths.md`; every
`<x>` filled from workbench state per B9, all string values escaped `Replace(v,"'","''")`,
all via `CurrentDb.Execute sql, dbFailOnError`):

1. **Add comment** (`cmdNewComment`, pgComment — write-paths §13):
   ```sql
   INSERT INTO tblComments (MWLoanNo, ProjectName, RelatedLoans, [Date], AcctOfficer, [Group])
   SELECT '<activeLoan>', '<proj>', '<rel>', Date(), '<initials>', '<group>'
   -- re-find the identity:
   SELECT Max(KeyProvision) as lastrecord FROM tblComments
     WHERE ProjectName='<proj>' AND RelatedLoans='<rel>'
   ```
   Then `Requery` the editor and move to the new row; user types the Comment text bound
   (prepared UPDATE handles it). Guard: "You must first activate a Relationship and LoanNo
   before entering a Comment." Relationship-level comment = pass `<rel>` as MWLoanNo
   (the sentinel, §glossary).

2. **Add collateral** (`cmdAddCollateral`, pgCollateral — write-paths §2):
   ```sql
   SELECT RelatedLoans, Max(Priority) AS MaxOfPriority FROM CollateralInfo
     GROUP BY RelatedLoans, ProjectName HAVING RelatedLoans='<rel>' and ProjectName='<proj>'

   INSERT INTO collateralinfo (RelatedLoans, Priority, ProjectName, BorrowerName,
     IsRealEstate, RealEstateGroup)
   SELECT '<rel>', <max+1>, '<proj>', '<borrower>', <True|False>, '**ADDED**'

   SELECT Max(MWPropertyNo) as MaxPropID FROM CollateralInfo
     WHERE RelatedLoans='<rel>' and projectname='<proj>'
   ```
   RE-vs-Other prompt (type `Yes` for RE); confirmations "Collateral record added…" +
   "REMINDER - Please insert collateral codes." (§3.2). Max probes via `DMax`/recordset on
   the linked table (Access SQL `HAVING` form kept for fidelity but `DMax` is safe too).

3. **BPO order button** (`cmdOrderBPO`, pgBPOTitleUCC — write-paths §4):
   ```sql
   -- open-order probe:
   SELECT ProjectName, RelatedLoans, MWPropertyNo, Count(MWPropertyNo) AS RecCount
     FROM tblBPO GROUP BY ProjectName, RelatedLoans, MWPropertyNo HAVING MWPropertyNo=<prop>
   -- 0 → "Are you sure you want to order this BPO" (type yes)
   -- 1–2 → "…causing a total of <n> BPOs to be ordered for this property?"
   -- 3 → "Three BPOs are already on order. No additional orders are allowed…"  (abort)

   INSERT INTO tblBPO (RelatedLoans, Priority, ProjectName, BPODate, BPOBroker,
     MWPropertyNo, Status, BPOProvider)
   SELECT '<rel>', <collateralPriority>, '<proj>', '09/09/99', '<First|Second|Third>',
     <prop>, 'Pending', 'LO-BPO'
   ```
   Slot = first unused of First/Second/Third (derive from the probe rows). Seven field
   guards ("To order a BPO you must complete the {Collateral Code|Address|City Code|State
   Code|Zip Code|County|Parcel Number} on the Collateral Tab") — check via `DLookup` on
   CollateralInfo for `<prop>`.

4. **Title order button** (`cmdOrderTitle` — write-paths §5):
   ```sql
   INSERT INTO tblTitle (ProjectName, MWPropertyNo, RelatedLoans, Priority, SourceDate,
     Source, Status, TitleVendor)
   SELECT '<proj>', <prop>, '<rel>', <pri>, #09/09/1999#, 'MWTitle', 'Pending', 'LO-Title'
   ```
   → "Your order has been placed." Same seven guards ("To order Title you must complete…").

5. **Task add** — no dynamic SQL: bound creation with corrected defaults (B7). This is a
   "write path" only in the sense that v7.0 must make new task rows key themselves:
   `DueDate = "=Date()"`, `EntryDate = "=Now()"`, keys from Parent, officer combos over
   ztblLogins, filter combo default `"***"`.

**v7.0 checklist**
- [ ] B1 links, tier 1: `vwRelationshipSummary`, `vwCollateralSummary`, `vwTitleDetail`,
      `tblLiens`, `ztblCommentGroups`, `ztblLogins`, `zCollateralCodes`, `zBKStatus`,
      `vwlstFinancialItemsRowSrc`, `vwPropertyStmtsSummary`, `tblFinancialCMR`,
      `tblFinancialPFS`, `tblPools` (extend `tables` array; keep per-table error report)
- [ ] B2 rebind loan grid: `qryLoansSorted` → vwRelationshipSummary ⋈
      xtblLocalCurrentProject, add `amtpd` "12 Pmts" column, Rate×100 display
- [ ] B9 active-state footer: `txtActiveLoan`/`txtActivePropNo`/`txtActivePriority` +
      Current-event writers in frmLoanGrid/frmCollateralGrid (rename → wire order per
      constraint 3)
- [ ] B3 FrmCommentsSub + lstComments + CommentFilter + **add-comment write path (C.1)**
- [ ] B6 **add-collateral write path (C.2)** (`cmdAddCollateral` only)
- [ ] B4 BPOTitle listboxes (placeholder `SELECT 'nothing' as field1` → runtime SQL) +
      **BPO order (C.3)** + **Title order (C.4)** with guard chains
- [ ] B7 Tasks: ORDER BY DueDate DESC, defaults, officer combos, `"***"` filter (**C.5**)
- [ ] B5 combos: ExitCode, MWCollateralCode, RealEstateGroup, RateType, AssetType,
      CFLikelyhood (new `DarkComboL` helper; ColumnCount/BoundColumn/ColumnWidths only)
- [ ] B14 initials picker + `xtblLocalCurrentUser`; AcctOfficer defaults DLookup it
- [ ] B15 verbatim guard strings on every new button
- [ ] Regression: rebuild from blank accdb twice (idempotency), verify no event proc lost
      after `SaveAs` rename, verify forms scroll, verify no property-not-found errors

### v7.1 — depth on existing tabs (destructive ops + entry grids)
- [ ] B6 delete collateral (BPO-count warning, typed-`yes`, `Status='DELETED'` cascades to
      tblBPO/tblTitle, `priority=priority-1` compaction — write-paths §2) and 888-sentinel
      priority up/down buttons
- [ ] B8 frmPayHistSub entry grid + pivot linked on active loan + PayHistoryComment
      writeback (`Update tblLoan Set PayHistoryComment='…'`)
- [ ] Obligor tab: frmObligorSub2-style editor + `lstObligors` + borrower-lookup grid;
      add (`'[NEW BORROWER RECORD]'` insert), delete (confirm + `Delete * from
      tblborrowers WHERE … borrowerid=<id>`), Relate Obligors
      (`INSERT INTO tblBorrowerLookup …`) — write-paths §3
- [ ] B11 read-only halves: FinStmts lists (vwlstFinancialItemsRowSrc + obligor list),
      Property lists (lstCollForPropinfo + vwPropertyStmtsSummary), Projections
      vwProjections/vwProjectionsNet datasheets + CFLikelyhood bound combo
- [ ] Title record viewer: dbl-click title list → popup over tblTitle + tblLiens grid
      (read-only; vwTitleDetail for the flattened view)
- [ ] B12 z_CCodes advance-rate join in qryBidLiquidationValues (probe key col, fallback 0.8)
- [ ] B13 Ah/Bhd + MWFunctions module
- [ ] B16 format sweep

### v7.2 — editors and consoles (only if the Access track is still alive)
- [ ] Financial statements: stub-create (Priority 88 + `#09/09/1999#` sentinels,
      write-paths §7), CMR/PFS editors, priority resequencing, typed-`YES` delete
- [ ] Property statements 7-scenario editor (delete-and-rewrite, write-paths §8)
- [ ] B10 BPO/Title admin console (single-row transitions first; batch buffers later)
- [ ] Comment recategorize (`Update tblComments Set [Group]='…' WHERE KeyProvision=<n>`)
      and delete (confirm + `Delete * From tblComments Where KeyProvision=<n>`)
- [ ] Lien add/reorder (Max(LienPosition)+1, 888 swap — write-paths §12)

**Explicitly out of scope for v7** (documented so nobody re-litigates): projections
edit-group clone protocol, bid/NPV engine (unrecoverable VBA, §8.1), imports, move/delete
admin, worklist consoles, the 55-report suite, geocoding/maps, merge-replication relink.

---

## Appendix — implementation gotchas carried from the six build failures

- `CreateEventProc` on a control that is later renamed orphans the proc → **always** rename
  first (constraint 3/7). The `SaveAs` temp→final form rename is safe (procs are stored in
  the form module, not keyed by form name).
- Setting `frm!ctl.OnDblClick` before the control exists under its final name raises 2465 —
  the v6 `GridCol` flow (create → `c.Name = "txt"&…` inside `GridCell`) is the reference
  pattern.
- Runtime listbox SQL built in injected code must respect constraint 5: one
  `s = s & "…"` line per clause, then `Me!lstBPOs.RowSource = s`.
- `DoCmd.Execute` doesn't exist — `CurrentDb.Execute sql, dbFailOnError`; ODBC errors
  surface in `DBEngine.Errors`, report them in the button's error handler, never crash.
- Date literals to SQL Server through a linked table: Access syntax `#09/09/1999#` works in
  Access SQL over the link (production string `'09/09/99'` inside INSERT…SELECT also passes
  through — keep whichever the template shows).
- Subform `LinkMasterFields`/`LinkChildFields` must be set with the *parent open in design
  view* after `SaveAs` (v6 end of `BuildFrmWorkbench` — reuse that block for every new
  linked subform).
