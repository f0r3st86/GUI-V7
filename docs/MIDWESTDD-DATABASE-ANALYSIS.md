# MidwestDD Database Analysis

**Database:** MidwestDD (SQL Server)
**Access path:** Microsoft Access front-end → ODBC DSN `sqlDueDiligence` → SQL Server
**Authentication:** Windows (Trusted_Connection=Yes)
**Connection string:**
```
DSN=sqlDueDiligence;Description=sqlDueDiligence;Trusted_Connection=Yes;
APP=Microsoft Office;DATABASE=MidwestDD;Encrypt=Optional;TrustServerCertificate=Yes;
```

---

## 1. Architecture Overview

This is a classic **Access front-end / SQL Server back-end** loan due diligence and
underwriting system. The schema profile (78 objects) breaks down as:

| Category | Count | Purpose |
|---|---|---|
| Core tables | 21 | Loans, borrowers, collateral, comments, payments, projections, bids |
| Lookup tables | 18 | Status codes, types, classifications |
| Views | 17 | Reporting aggregates consumed by Access forms/reports |
| Staging tables | 11 | Servicer data import pipeline |
| Other | 11 | Audit, config, system tables |

The 11 staging tables plus fields like `LastImportDate` (visible in loan data) and
`tblASRThisServer` indicate a **periodic batch import** workflow: servicer tape →
staging tables → core tables, likely monthly (the app data shows `10/31/24` import dates).

---

## 2. Core Table Inventory

Confirmed from the Access Linked Table Manager (all linked as `dbo.*`):

| Table | Role | Notes |
|---|---|---|
| `tblLoan` | Loan master (53 cols) | Includes underwriting fields: `ExitCode`, `CreditScore`, `CFLikelyhood`, `PreliminaryScore`, `CashFlowUpdate`, `Times30/60/90` delinquency counters |
| `tblRelationships` | Relationship master | Flags: `InBankruptcy`, `ForeclosureFlag`, `LitigationFlag`, `ForbearanceFlag`, `JudgmentFlag`, `LowYieldAsset`, plus `ExitCode`, `RelatedLoans` |
| `tblBorrowers` | Borrower master (37 cols) | BK fields, business call fields, financial data |
| `tblBorrowerLookup` | Borrower↔loan junction | Maps borrowers to loans with roles |
| `CollateralInfo` | Collateral/property master | ⚠ No `tbl` prefix (naming inconsistency) |
| `tblLiens` | Lien detail | Per-collateral lien positions |
| `tblBPO` | Broker price opinions | Valuation history |
| `tblcomments` | Comments/notes | ⚠ Lowercase `c` (naming inconsistency) |
| `tblPayHistory` | Payment history | Monthly payment records |
| `tblFinancialCMR` | Commercial financial stmts | |
| `tblFinancialPFS` | Personal financial stmts | |
| `tblPropertyStatements` | Property operating stmts | |
| `tblProjections` | Cash flow projections | Maps to app's Projections tab |
| `tblSSBid` | Bid records | Sale/settlement bids |
| `tblSSObligor` | Obligor records | |
| `tblPools` | Loan pools | Pool 100 etc. |
| `tblProjects` | Deals/projects | Top-level grouping |
| `tblInvestors` | Investors | Report recipients |
| `tblASRThisServer` | Asset status report snapshot | Import-cycle artifact |

### Key Views

**`vwRelationshipSummary`** — per-loan financial snapshot (powers relationship-level screens):
`MWLoanNo, BorrowerNm, OrigPrincipalBalance, PrincipalBalance, InterestBalance,
EscrowBalance, OtherBalances, RepayAmt, Rate, DefaultRate, LastPmtDt, PayoffBalance,
OrgNoteDate, DueDt, CurrentMaturityDate`

**`vwCollateralSummary`** — per-collateral valuation snapshot:
`MWCollateralCode, Address, CurrentAppraisedValue, LienPosition, SeniorLienAmount,
TaxAnnualAmt, TaxMarketValue, SellerAppraisedValue, MaxBPO, MinBPO, NetValue,
TaxDelinquentAmt`

**`vwBorrowerSummary`** — per-borrower credit snapshot:
`BorrName, City, SSN, State, DOB, BeaconScore, BeaconDate, HomeOwner, IsBusiness,
BKStatus, BKChapter`

---

## 3. Data Model & Relationships

```
tblProjects ──< tblPools ──< tblLoan >── tblRelationships (RelatedLoans group)
                                │
        ┌───────────┬───────────┼────────────┬─────────────┐
        │           │           │            │             │
  tblBorrowerLookup tblPayHistory tblcomments tblProjections tblSSBid
        │                                                  │
  tblBorrowers ──< tblFinancialPFS                    tblSSObligor
        │
  (BK fields)
                CollateralInfo ──< tblLiens
                      │      └──< tblBPO
                      └──< tblPropertyStatements
```

- **Relationship grouping is by name string** (`RelatedLoans = 'Haskell'`), not a
  surrogate key — joins are string-based.
- `MWLoanNo` is the universal loan key across all child tables.
- Borrower↔loan and collateral↔loan are many-to-many via junction tables.

---

## 4. Design Assessment

### Strengths
1. **Clean layering** — lookups, core, staging, and views are clearly separated.
2. **Views already match reporting needs** — the three `vw*Summary` views are exactly
   what the GUI's Overview tab needs, which is why the React port mapped onto them cleanly.
3. **Relationship-centric model** matches the business workflow (bid on relationships,
   not individual loans).
4. **Import pipeline isolation** — staging tables keep servicer tape loads from
   corrupting core data mid-import.

### Issues & Risks

| # | Issue | Severity | Detail |
|---|---|---|---|
| 1 | **PII exposure** | High | `SSN` and `DOB` are exposed plain in `vwBorrowerSummary`. Anyone with view SELECT rights sees full SSNs. Recommend SQL Server Dynamic Data Masking or a masked view for non-admin roles (the GUI already masks to `***-**-1234`). |
| 2 | **String-keyed relationships** | Medium | Grouping by `RelatedLoans` name string means renaming a relationship orphans children. A surrogate `RelationshipID` FK would be safer. |
| 3 | **Likely missing FK constraints** | Medium | Typical of Access-upsized databases; integrity enforced by the front-end only. Verify with `SELECT * FROM sys.foreign_keys`. |
| 4 | **Naming inconsistencies** | Low | `tblcomments` (lowercase), `CollateralInfo` (no prefix), misspelled `CFLikelyhood`. Signs of organic growth; safe to leave but document. |
| 5 | **Wide loan table** | Low | 53 columns mixing servicer tape data with underwriting scores. Works fine at this scale; would split servicing vs. underwriting if it grows. |
| 6 | **`Encrypt=Optional`** | Low | Connection allows unencrypted transport. Fine on a LAN; set `Encrypt=Yes` if traffic crosses untrusted segments. |

---

## 5. Mapping to the React GUI

| Production object | GUI consumer | Status |
|---|---|---|
| `vwRelationshipSummary` | Overview tab loan summary, LoanTable | ✅ Mapped (`sql/create_tables.sql` mirrors it) |
| `vwCollateralSummary` | Overview + Collateral tabs | ✅ Mapped |
| `vwBorrowerSummary` | Overview + Borrower tabs | ✅ Mapped |
| `tblRelationships` flags | Overview tab flag pills (BK/FC/LT/FA/JG) | ✅ Mapped — also matches the Access form checkboxes |
| `tblcomments` | Comment tab | ✅ Mapped |
| `tblPayHistory` | PayHist tab | ✅ Mapped |
| `tblProjections` | Projections tab | ⚠ Need column-level mapping to `ProjectionSettings` |
| `tblSSBid` / `tblSSObligor` | Bid statistics | ⚠ Need column-level mapping to `BidStatisticsRecord` |
| `tblBPO`, `tblLiens` | BPOTitleUCC tab (unbuilt) | ⏳ Future |
| `tblFinancialCMR/PFS` | FinStmts tab (unbuilt) | ⏳ Future |
| — (does not exist) | Report tab photos | ❌ Propose `tblPropertyPhotos` |
| — (does not exist) | Report tab comps | ❌ Propose `tblComparableSales` |
| — (does not exist) | Report tab map pins | ❌ Add `Latitude`/`Longitude` to `CollateralInfo` |

### Proposed new tables for the Report tab

```sql
CREATE TABLE tblPropertyPhotos (
    PhotoID       INT IDENTITY(1,1) PRIMARY KEY,
    CollateralID  INT NOT NULL,            -- FK to CollateralInfo
    FilePath      NVARCHAR(500) NOT NULL,  -- UNC path or blob URL
    Caption       NVARCHAR(200) NULL,
    PhotoType     NVARCHAR(20) NOT NULL DEFAULT 'exterior',
    SortOrder     INT NULL,
    CreatedAt     DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE tblComparableSales (
    CompID        INT IDENTITY(1,1) PRIMARY KEY,
    CollateralID  INT NULL,                -- subject property it supports
    Address       NVARCHAR(200) NOT NULL,
    City          NVARCHAR(100) NULL,
    State         NVARCHAR(5) NULL,
    Zip           NVARCHAR(20) NULL,
    SalePrice     DECIMAL(18,2) NULL,
    SaleDate      DATE NULL,
    SqFt          INT NULL,
    DistanceMiles DECIMAL(6,2) NULL,
    YearBuilt     NVARCHAR(10) NULL,
    PropertyType  NVARCHAR(50) NULL,
    Latitude      DECIMAL(9,6) NULL,
    Longitude     DECIMAL(9,6) NULL,
    CreatedAt     DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

---

## 6. Recommended Next Steps

1. **Export the authoritative DDL** (no admin needed — any SELECT-capable login):
   ```sql
   SELECT t.name AS TableName, c.name AS ColumnName,
          ty.name AS DataType, c.max_length, c.is_nullable
   FROM sys.tables t
   JOIN sys.columns c ON t.object_id = c.object_id
   JOIN sys.types ty ON c.user_type_id = ty.user_type_id
   ORDER BY t.name, c.column_id;
   ```
   Save the output to `sql/midwestdd_actual_schema.csv` so the GUI mapping can be
   verified column-by-column.
2. **Check FK coverage:** `SELECT COUNT(*) FROM sys.foreign_keys;` — if near zero,
   plan integrity constraints before multi-user write access.
3. **Lock down PII:** masked view or Dynamic Data Masking on `SSN`/`DOB`.
4. **Get the server name** from the `sqlDueDiligence` DSN (ODBC Data Sources →
   System DSN) — the last piece needed to wire the GUI's API layer to live data.
5. **Map `tblProjections` and `tblSSBid` columns** to the GUI's projection/bid types
   so the Projections tab can read/write production data.
