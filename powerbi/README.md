# Relationship Report — local paginated report (.rdl)

`RelationshipReport.rdl` is a Power BI **paginated report** that rebuilds the
production `rptDetail-ByRelationship` (the investor Relationship Report) from
the structure recovered in `docs/DDMAIN-PRODUCTION-REFERENCE.md`. It runs
**entirely on your machine**: data is read from SQL Server with your Windows
login, rendered locally, and exported to PDF locally. Nothing is published to
any cloud service.

## Sections (production order)

1. Header — relationship name, Sort number, project, run timestamp
2. Flag line (BK / FA / FC / JG / LT / Low Yield Asset, in red) + Exit Code
3. **Relationship Overview** narrative
4. **Loans** table — production grid columns (rates shown ×100) with totals row
5. **Collateral** — Collateral Overview narrative + property table with
   MwVx / Sr Lien / Delq Tax and computed **Net Value**
   (max(0, value − lien − tax), the recovered bidding math), with totals
6. **Obligors** — name, city/state, Beacon score, BK status
   (SSN/DOB deliberately excluded)
7. **Payment History** — year × 12-month spread from `vwPayHistorySpread`
   with a grand-total row
8. **Exit Strategy** — narrative + Bid Conditions / Deadlines
9. **File Review Comments** — relationship-level comments first (the
   `MWLoanNo = RelatedLoans` sentinel shows as "RELATIONSHIP"), then by
   `ztblCommentGroups.ReportPriority`, newest first — production's ordering
10. Page footer: CONFIDENTIAL + project + page numbers

Parameters: **Project** (from tblProjects) → **Relationship** (cascading, in
SortNo order — the production browse order). One relationship per run,
matching how production's per-relationship PDF export works; render, export
to PDF, pick the next.

## How to run

1. Install **Microsoft Power BI Report Builder** (free). If double-click
   installs are blocked in your environment, get it from your company's
   software portal / IT — it's a standard Microsoft tool.
2. Open `RelationshipReport.rdl` in Report Builder.
3. **One-time:** if your SQL Server name differs, edit the data source —
   right-click **MidwestDDi** under Data Sources → Connection string is
   `Data Source=Midwest-rocdata;Initial Catalog=MidwestDDi;Integrated
   Security=SSPI` — change `Data Source=` to your server (the machine your
   `sqlDueDiligence` DSN points at; check ODBC Data Sources if unsure).
4. Click **Run**, pick Project and Relationship, then
   **Export → PDF** (or Word/Excel).

## Notes

- Read-only by construction: every dataset is a plain `SELECT`; the report
  cannot write.
- Do **not** publish this to the Power BI Service without a compliance
  conversation — the data contains PII and the Service is cloud-hosted.
  Local Report Builder use keeps everything on-network.
- The financial-statement detail sections (CMR/PFS, property statements) are
  not yet included — production renders those via the server UDFs
  `udfFinancialCMRDetail` / `udfPropertyStatementsDetail`, and they can be
  added as additional datasets once we confirm those functions exist on your
  server.
