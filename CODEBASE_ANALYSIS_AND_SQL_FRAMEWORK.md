# Codebase Analysis and SQL Backend Framework

**Date:** November 25, 2025
**Project:** Loan Underwriting System (Gui-V4)

---

## Executive Summary

This document provides a comprehensive analysis of the Loan Underwriting System codebase, identifying issues, errors, and proposing an SQL backend framework for data persistence.

---

## Part 1: Codebase Issues and Errors

### Critical Issues

#### 1. Security Vulnerability - Code Injection (Line 824)
**File:** `AccessLayoutWithCalculations (1).jsx:824`
**Severity:** CRITICAL

```javascript
// VULNERABLE CODE
const result = new Function('return ' + expr)();
```

**Problem:** The `calculateExpression` function uses `new Function()` to evaluate mathematical expressions. While there's basic regex validation, this is a **code injection vulnerability** that could allow arbitrary JavaScript execution.

**Current Mitigation (Insufficient):**
```javascript
if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
  return expression;
}
```

**Recommendation:** Replace with a safe math expression parser library like `mathjs` or implement a proper AST-based parser.

---

#### 2. No Data Persistence Layer
**Severity:** CRITICAL

All data is stored in React `useState` hooks:
- `borrowersList` (line 74)
- `collateralList` (line 162)
- `paymentRecords` (line 33)
- `commentsList` (line 264)

**Impact:**
- Data is lost on page refresh
- Cannot be used in production
- No multi-user support

---

#### 3. Missing `src/` Directory Structure
**Severity:** HIGH

The configuration files expect a `src/` directory:
- `vite.config.ts:20` - alias `@` points to `./src`
- `tsconfig.json` - expects `src/main.tsx`
- `index.html:12` - references `/src/main.tsx`

**But `src/` directory does not exist!** The app cannot build as-is.

---

#### 4. Monolithic Component Structure
**Severity:** HIGH
**File:** `AccessLayoutWithCalculations (1).jsx` - **4,361 lines**

Single file containing:
- All UI components
- All state management
- All business logic
- All calculations
- All mock data

**Problems:**
- Impossible to maintain
- Cannot test individual components
- Cannot reuse code
- Performance issues (entire component re-renders)

---

### Medium Issues

#### 5. Uncontrolled Components (Various Lines)
Multiple form inputs use `defaultValue` instead of controlled `value`:

```javascript
// WRONG - Line ~1690+
<input defaultValue="PO Box 824" />

// CORRECT
<input value={address} onChange={(e) => setAddress(e.target.value)} />
```

**Impact:** User changes don't persist in state.

---

#### 6. Missing Input Validation
**Locations:**
- Credit scores accept any string (should be 300-850)
- Dates not validated (MM/DD/YY format)
- Numeric fields accept text
- Lien positions not validated
- Year built not validated (could enter 3000)

---

#### 7. Incomplete Dependencies
**File:** `package.json`

Missing required packages:
- No database driver (SQLite, better-sqlite3)
- No ORM (Sequelize, TypeORM, Prisma)
- No migration tool
- No `electron-is-dev` dependency (imported in electron.js but not in package.json)
- No `electron-builder` (for building installers)
- No `concurrently`, `cross-env`, `wait-on` (for dev scripts)

---

#### 8. Hardcoded Data Values
Multiple hardcoded values instead of data-driven:
- Pool: 100 (line ~1662)
- Related: Haskell (line ~1655)
- Various dropdown options

---

### Minor Issues

#### 9. File Naming Issues
- File has space: `AccessLayoutWithCalculations (1).jsx`
- Should be: `AccessLayoutWithCalculations.jsx` or `App.jsx`

#### 10. Inconsistent Formatting
- Some currency fields have commas, others don't
- Date formats inconsistent
- Phone formats inconsistent

#### 11. Missing Error Boundaries
No React error boundaries to catch rendering errors.

#### 12. No Loading States
No spinners or loading indicators.

#### 13. No Keyboard Accessibility
Missing ARIA labels and keyboard navigation.

---

## Part 2: SQL Backend Framework Proposal

### Recommended Architecture

For an **Electron desktop application**, I recommend using **SQLite** with **better-sqlite3** for its:
- No server required (embedded database)
- Synchronous API (simpler code)
- Fast performance
- Single file database (easy backup)
- Works well with Electron

### Database Schema

**Data Hierarchy:**
```
Projects (Individual Deals)
    └── Relationships (Loan Groups within a Project)
        └── Loans
            ├── Borrower/Guarantor (via borrower_loans junction)
            ├── Collateral (via collateral_loans junction)
            ├── Payment History
            ├── Cash Flows (monthly projection data)
            └── BPO/Title/UCC
```

**Table Summary:**
| # | Table | Purpose |
|---|-------|---------|
| 1 | `projects` | Top-level deals/acquisitions |
| 2 | `relationships` | Loan groups within a project |
| 3 | `loans` | Individual loan records |
| 4 | `borrowers` | Borrower/Guarantor entities |
| 5 | `borrower_loans` | Junction: Borrower ↔ Loan (with role) |
| 6 | `collateral` | Property/asset information |
| 7 | `collateral_loans` | Junction: Collateral ↔ Loan |
| 8 | `payments` | Payment history (YYYYMM format) |
| 9 | `cash_flows` | Monthly projection cash flow data |
| 10 | `bpo_title_ucc` | BPO, Title, and UCC filing records |
| 11 | `projections` | Projection settings per loan |
| 12 | `comments` | Notes and documentation |

```sql
-- ===========================================
-- LOAN UNDERWRITING SYSTEM - DATABASE SCHEMA
-- ===========================================
-- Version: 2.0
-- Updated: November 26, 2025
-- ===========================================

-- ===========================================
-- 1. PROJECTS TABLE (Top Level - Individual Deals)
-- ===========================================
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name VARCHAR(100) NOT NULL,
    roll_up_date DATE,
    expected_bid_date DATE,
    seller VARCHAR(150),
    broker VARCHAR(150),
    proj_comments TEXT,
    team_lead VARCHAR(100),
    -- Yield Settings
    performing_yield DECIMAL(5,3),         -- e.g., 0.120 for 12%
    non_performing_yield DECIMAL(5,3),     -- e.g., 0.150 for 15%
    low_yield DECIMAL(5,3),                -- e.g., 0.080 for 8%
    -- Date Settings
    cutoff_date DATE,
    cash_flow_start_month INTEGER,         -- YYYYMM format (e.g., 202501)
    -- Status
    status VARCHAR(30) DEFAULT 'Active',   -- Active, Closed, On Hold, Sold
    -- Metadata
    version INTEGER DEFAULT 1,             -- For optimistic locking
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 2. RELATIONSHIPS TABLE (Loan Groups within Project)
-- ===========================================
CREATE TABLE relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    related_loan VARCHAR(50),             -- Related loan identifier
    project_name VARCHAR(100) NOT NULL,   -- Links to projects.project_name
    sort_no INTEGER,                      -- Sort order
    exit_strategy VARCHAR(100),           -- Exit strategy description
    relationship_overview TEXT,           -- Overview of the relationship
    collateral_overview TEXT,             -- Overview of collateral
    conditions_deadlines TEXT,            -- Conditions and deadlines notes
    exit_code VARCHAR(20),                -- Exit code identifier
    -- Status Flags (0 = No, 1 = Yes)
    in_bankruptcy BOOLEAN DEFAULT 0,      -- Is borrower in bankruptcy?
    foreclosure_flag BOOLEAN DEFAULT 0,   -- Is property in foreclosure?
    litigation_flag BOOLEAN DEFAULT 0,    -- Is there active litigation?
    forbearance_flag BOOLEAN DEFAULT 0,   -- Is loan in forbearance?
    judgement_flag BOOLEAN DEFAULT 0,     -- Is there a judgement?
    low_yield_flag BOOLEAN DEFAULT 0,     -- Is this a low yield asset?
    -- Metadata
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_name) REFERENCES projects(project_name) ON DELETE CASCADE
);

-- ===========================================
-- 3. LOANS TABLE
-- ===========================================
CREATE TABLE loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Primary Identifiers & Relationships
    loan_number VARCHAR(20) NOT NULL UNIQUE,           -- LoanNumber
    project_name VARCHAR(100),                         -- ProjectName (relates to Projects table)
    related_loan VARCHAR(50),                          -- RelatedLoan (relates to Relationships table)

    -- Investor & Pool Information
    investor VARCHAR(100),                             -- Investor
    number VARCHAR(50),                                -- Number (investor/reference number)
    pool_number VARCHAR(50),                           -- PoolNumber
    underwriter VARCHAR(100),                          -- UnderWriter

    -- Dates
    org_note_date DATE,                                -- OrgNoteDate (original note date)
    current_maturity DATE,                             -- CurrentMaturity

    -- Borrower Information
    borrower_name VARCHAR(150),                        -- BorrowerName
    borrower_address1 VARCHAR(100),                    -- BorrowerAddress1
    borrower_address2 VARCHAR(100),                    -- BorrowerAddress2
    city_name VARCHAR(50),                             -- CityName
    state_code CHAR(2),                                -- StateCode
    zip_code VARCHAR(10),                              -- ZipCode

    -- Balances
    origination_principal DECIMAL(15,2),               -- OriginationPrincipal
    principal_balance DECIMAL(15,2),                   -- PrincipalBalance
    interest_balance DECIMAL(15,2),                    -- InterestBalance
    interest_accrual_date DATE,                        -- InterestAccrualDate
    escrow_balance DECIMAL(15,2),                      -- EscrowBalance
    other_balance DECIMAL(15,2),                       -- OtherBalance
    payoff_balance DECIMAL(15,2),                      -- PayoffBalance

    -- Payment Information
    repay_amount DECIMAL(12,2),                        -- RepayAmount
    escrow_payment DECIMAL(12,2),                      -- EscrowPayment
    last_pmt_date DATE,                                -- LastPmtDate
    due_date DATE,                                     -- DueDate

    -- Interest Rate Information
    rate DECIMAL(7,4),                                 -- Rate
    default_rate DECIMAL(7,4),                         -- DefaultRate
    rate_type VARCHAR(20),                             -- RateType (Fixed, Variable, ARM)
    rate_index VARCHAR(50),                            -- RateIndex (LIBOR, SOFR, Prime, etc.)
    rate_margin DECIMAL(7,4),                          -- RateMargin
    rate_floor DECIMAL(7,4),                           -- RateFloor
    rate_ceiling DECIMAL(7,4),                         -- RateCeiling
    rate_change_freq VARCHAR(20),                      -- RateChangeFreq (Monthly, Quarterly, Annual)
    rate_change_date DATE,                             -- RateChangeDate

    -- Payment Frequency & History
    pmt_frequency VARCHAR(20),                         -- PmtFrequency (Monthly, Quarterly, Annual)
    pay_history_comment TEXT,                          -- PayHistoryComment

    -- Metadata
    last_import_date DATETIME,                         -- LastImportDate
    unfunded_commitment DECIMAL(15,2),                 -- UnfundedCommitment
    consumer_flag BOOLEAN DEFAULT FALSE,               -- ConsumerFlag

    -- System Fields
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Relationships
    FOREIGN KEY (project_name) REFERENCES projects(project_name) ON DELETE SET NULL,
    FOREIGN KEY (related_loan) REFERENCES relationships(related_loan) ON DELETE SET NULL
);

-- ===========================================
-- 4. BORROWERS TABLE
-- ===========================================
CREATE TABLE borrowers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- NOTE: Borrowers belong to relationship, linked to specific loans via junction table
    relationship_id INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    entity_type VARCHAR(30) DEFAULT 'Individual', -- Individual, LLC, Corporation, Trust, Partnership
    -- Contact Info
    address1 VARCHAR(100),
    address2 VARCHAR(100),
    city VARCHAR(50),
    state CHAR(2),
    zip VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    -- Personal/Entity Info
    dob DATE,                             -- Date of birth (individuals)
    ssn_ein VARCHAR(20),                  -- SSN or EIN (encrypted in production)
    -- Credit
    credit_score INTEGER CHECK (credit_score IS NULL OR credit_score BETWEEN 300 AND 850),
    credit_score_date DATE,
    -- Bankruptcy
    bk_status VARCHAR(30) DEFAULT 'None', -- None, Chapter 7, Chapter 11, Chapter 13, Discharged
    bk_chapter VARCHAR(10),
    bk_case_number VARCHAR(50),
    bk_court_location VARCHAR(100),
    bk_filing_date DATE,
    bk_discharge_date DATE,
    bk_assets_value DECIMAL(15,2),
    -- Metadata
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE CASCADE
);

-- ===========================================
-- 5. BORROWER_LOANS JUNCTION TABLE (Many-to-Many with Role)
-- ===========================================
-- Links borrowers/guarantors to specific loans with their role
CREATE TABLE borrower_loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrower_id INTEGER NOT NULL,
    loan_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Borrower', -- Borrower, Guarantor, Co-Borrower
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    UNIQUE(borrower_id, loan_id)          -- One role per borrower per loan
);

-- ===========================================
-- 6. COLLATERAL TABLE
-- ===========================================
CREATE TABLE collateral (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- NOTE: Collateral linked to specific loans via junction table
    -- Property Info
    collateral_code VARCHAR(50),          -- Property type code
    property_type VARCHAR(50),            -- Residential, Commercial, Land, Industrial, etc.
    description TEXT,
    -- Address
    address1 VARCHAR(100),
    address2 VARCHAR(100),
    city VARCHAR(50),
    state CHAR(2),
    zip VARCHAR(10),
    county VARCHAR(50),
    parcel_id VARCHAR(50),
    -- Tax Information
    annual_taxes DECIMAL(12,2),
    delinquent_taxes DECIMAL(12,2),
    tax_assessed_value DECIMAL(15,2),
    tax_market_value DECIMAL(15,2),
    tax_year INTEGER,
    -- Lien Information (Seller)
    seller_lien_position INTEGER,
    seller_lien_amount DECIMAL(15,2),
    -- Lien Information (Title)
    title_lien_position INTEGER,
    title_lien_amount DECIMAL(15,2),
    -- Valuations (moved detailed BPO/Title to separate table)
    list_price DECIMAL(15,2),
    days_on_market INTEGER,
    appraised_value DECIMAL(15,2),
    appraised_date DATE,
    our_value DECIMAL(15,2),              -- Internal valuation
    our_value_date DATE,
    -- Property Details
    sqft INTEGER,
    lot_sqft INTEGER,
    acres DECIMAL(10,4),
    year_built INTEGER CHECK (year_built IS NULL OR year_built BETWEEN 1700 AND 2100),
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    units INTEGER,
    -- Metadata
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 7. COLLATERAL_LOANS JUNCTION TABLE (Many-to-Many)
-- ===========================================
-- Links collateral to specific loans (cross-collateralization support)
CREATE TABLE collateral_loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collateral_id INTEGER NOT NULL,
    loan_id INTEGER NOT NULL,
    lien_position INTEGER DEFAULT 1,      -- 1st, 2nd, 3rd lien on this collateral for this loan
    lien_amount DECIMAL(15,2),            -- Amount of this loan secured by this collateral
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collateral_id) REFERENCES collateral(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    UNIQUE(collateral_id, loan_id)
);

-- ===========================================
-- 8. PAYMENTS TABLE (Payment History - YYYYMM Format)
-- ===========================================
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    payment_date INTEGER NOT NULL,        -- YYYYMM format (e.g., 202504 = April 2025)
    amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(20) DEFAULT 'Regular', -- Regular, Partial, Payoff, NSF, Reversal
    -- Breakdown (optional)
    principal_applied DECIMAL(12,2),
    interest_applied DECIMAL(12,2),
    escrow_applied DECIMAL(12,2),
    fees_applied DECIMAL(12,2),
    -- Metadata
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    UNIQUE(loan_id, payment_date)         -- One payment record per month per loan
);

-- ===========================================
-- 9. CASH_FLOWS TABLE (Monthly Projection Data)
-- ===========================================
-- Stores calculated monthly cash flow data for projections
CREATE TABLE cash_flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    projection_id INTEGER,                -- Optional link to projection settings
    -- Period
    month_number INTEGER NOT NULL,        -- 1, 2, 3... up to 60
    period_date INTEGER NOT NULL,         -- YYYYMM format
    -- Income
    projected_payment DECIMAL(12,2),
    -- Expenses
    initial_legal DECIMAL(12,2) DEFAULT 0,
    holding_cost DECIMAL(12,2) DEFAULT 0,
    other_expense DECIMAL(12,2) DEFAULT 0,
    total_expense DECIMAL(12,2) GENERATED ALWAYS AS (
        COALESCE(initial_legal, 0) +
        COALESCE(holding_cost, 0) +
        COALESCE(other_expense, 0)
    ) STORED,
    -- Calculated
    net_cash_flow DECIMAL(12,2) GENERATED ALWAYS AS (
        COALESCE(projected_payment, 0) -
        COALESCE(initial_legal, 0) -
        COALESCE(holding_cost, 0) -
        COALESCE(other_expense, 0)
    ) STORED,
    cumulative_cash_flow DECIMAL(15,2),   -- Running total (updated by trigger/app)
    -- Exit (only populated in exit month)
    exit_value DECIMAL(15,2),
    add_back_recovery DECIMAL(12,2),
    -- Balance Tracking
    beginning_balance DECIMAL(15,2),
    ending_balance DECIMAL(15,2),
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (projection_id) REFERENCES projections(id) ON DELETE SET NULL,
    UNIQUE(loan_id, month_number)         -- One record per month per loan
);

-- ===========================================
-- 10. BPO_TITLE_UCC TABLE
-- ===========================================
-- Stores BPO (Broker Price Opinion), Title, and UCC filing information
CREATE TABLE bpo_title_ucc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collateral_id INTEGER NOT NULL,       -- Links to collateral
    loan_id INTEGER,                      -- Optional direct link to loan
    record_type VARCHAR(20) NOT NULL,     -- BPO, Title, UCC

    -- BPO Fields (when record_type = 'BPO')
    bpo_value DECIMAL(15,2),
    bpo_date DATE,
    bpo_type VARCHAR(30),                 -- Drive-by, Interior, Desktop
    bpo_provider VARCHAR(100),            -- Company/appraiser name
    bpo_condition VARCHAR(30),            -- Excellent, Good, Fair, Poor
    bpo_marketability VARCHAR(30),        -- High, Medium, Low
    bpo_estimated_repair DECIMAL(12,2),
    bpo_as_is_value DECIMAL(15,2),
    bpo_as_repaired_value DECIMAL(15,2),
    bpo_notes TEXT,

    -- Title Fields (when record_type = 'Title')
    title_company VARCHAR(100),
    title_policy_number VARCHAR(50),
    title_effective_date DATE,
    title_policy_amount DECIMAL(15,2),
    title_exceptions TEXT,                -- Known exceptions/issues
    title_status VARCHAR(30),             -- Clear, Clouded, Pending
    title_last_search_date DATE,
    title_notes TEXT,

    -- UCC Fields (when record_type = 'UCC')
    ucc_filing_number VARCHAR(50),
    ucc_filing_date DATE,
    ucc_filing_state CHAR(2),
    ucc_filing_county VARCHAR(50),
    ucc_secured_party VARCHAR(150),
    ucc_debtor_name VARCHAR(150),
    ucc_collateral_description TEXT,
    ucc_expiration_date DATE,
    ucc_status VARCHAR(30),               -- Active, Terminated, Expired, Amendment
    ucc_continuation_date DATE,
    ucc_notes TEXT,

    -- Document Reference
    document_path VARCHAR(500),           -- Path to scanned document

    -- Metadata
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collateral_id) REFERENCES collateral(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL
);

-- ===========================================
-- 11. PROJECTIONS TABLE (Settings per Loan)
-- ===========================================
-- Stores projection settings; actual cash flow data in cash_flows table
CREATE TABLE projections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL UNIQUE,      -- One projection per loan

    -- Payment Settings
    payment_method VARCHAR(30) NOT NULL DEFAULT 'Contractual',
    payment_amount DECIMAL(12,2),         -- Used when payment_method = 'User Enter'
    rate_method VARCHAR(30) NOT NULL DEFAULT 'Contractual',
    rate_value DECIMAL(5,3),              -- Used when rate_method = 'User Enter'
    amort_months INTEGER DEFAULT 360,     -- For Term Pmt method
    trail_period INTEGER DEFAULT 12,      -- 3, 6, or 12 months
    trail_percentage DECIMAL(5,2) DEFAULT 100,

    -- Exit Settings
    exit_method VARCHAR(30) NOT NULL DEFAULT 'Pay in Full',
    exit_start_month INTEGER NOT NULL DEFAULT 1,
    exit_end_month INTEGER NOT NULL DEFAULT 24,
    exit_dpo_percentage DECIMAL(5,2) DEFAULT 95,
    exit_value_cap_percentage DECIMAL(5,2) DEFAULT 90,
    exit_user_amount DECIMAL(15,2),
    exit_ytm_desired DECIMAL(5,2),
    exit_liquidation_months INTEGER DEFAULT 12,
    exit_liquidation_add_interest BOOLEAN DEFAULT FALSE,

    -- Expenses
    initial_legal DECIMAL(12,2) DEFAULT 0,
    initial_legal_start_month INTEGER DEFAULT 1,
    holding_cost_monthly DECIMAL(12,2) DEFAULT 0,
    holding_cost_end_month INTEGER DEFAULT 12,

    -- Add-Back Recovery
    add_back_percentage DECIMAL(5,2) DEFAULT 0,
    add_back_basis VARCHAR(20) DEFAULT 'Initial Only',

    -- Metadata
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- ===========================================
-- 12. COMMENTS TABLE
-- ===========================================
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Can be linked at any level
    project_id INTEGER,                   -- Project-level comment
    relationship_id INTEGER,              -- Relationship-level comment
    loan_id INTEGER,                      -- Loan-level comment
    collateral_id INTEGER,                -- Collateral-level comment
    -- Comment Data
    comment_type VARCHAR(30) NOT NULL,    -- Note, Legal, Underwriting, Property, Servicing, Collection, Other
    comment_date DATE NOT NULL DEFAULT (DATE('now')),
    text TEXT NOT NULL,                   -- HTML from rich text editor
    -- Metadata
    created_by VARCHAR(100),
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (collateral_id) REFERENCES collateral(id) ON DELETE CASCADE,
    -- At least one parent must be set
    CHECK (project_id IS NOT NULL OR relationship_id IS NOT NULL OR loan_id IS NOT NULL OR collateral_id IS NOT NULL)
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Project/Relationship hierarchy
CREATE INDEX idx_relationships_project ON relationships(project_id);
CREATE INDEX idx_loans_relationship ON loans(relationship_id);
CREATE INDEX idx_loans_mw_loan_no ON loans(mw_loan_no);
CREATE INDEX idx_loans_status ON loans(status);

-- Borrowers
CREATE INDEX idx_borrowers_relationship ON borrowers(relationship_id);
CREATE INDEX idx_borrower_loans_borrower ON borrower_loans(borrower_id);
CREATE INDEX idx_borrower_loans_loan ON borrower_loans(loan_id);

-- Collateral
CREATE INDEX idx_collateral_loans_collateral ON collateral_loans(collateral_id);
CREATE INDEX idx_collateral_loans_loan ON collateral_loans(loan_id);

-- Payments
CREATE INDEX idx_payments_loan ON payments(loan_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Cash Flows
CREATE INDEX idx_cash_flows_loan ON cash_flows(loan_id);
CREATE INDEX idx_cash_flows_period ON cash_flows(period_date);

-- BPO/Title/UCC
CREATE INDEX idx_bpo_title_ucc_collateral ON bpo_title_ucc(collateral_id);
CREATE INDEX idx_bpo_title_ucc_loan ON bpo_title_ucc(loan_id);
CREATE INDEX idx_bpo_title_ucc_type ON bpo_title_ucc(record_type);

-- Projections
CREATE INDEX idx_projections_loan ON projections(loan_id);

-- Comments (multiple parent options)
CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_relationship ON comments(relationship_id);
CREATE INDEX idx_comments_loan ON comments(loan_id);
CREATE INDEX idx_comments_collateral ON comments(collateral_id);

-- ===========================================
-- TRIGGERS FOR UPDATED_AT & VERSION
-- ===========================================

CREATE TRIGGER projects_updated
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = NEW.id;
END;

CREATE TRIGGER relationships_updated
AFTER UPDATE ON relationships
BEGIN
    UPDATE relationships SET updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = NEW.id;
END;

CREATE TRIGGER loans_updated
AFTER UPDATE ON loans
BEGIN
    UPDATE loans SET updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = NEW.id;
END;

CREATE TRIGGER borrowers_updated
AFTER UPDATE ON borrowers
BEGIN
    UPDATE borrowers SET updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = NEW.id;
END;

CREATE TRIGGER collateral_updated
AFTER UPDATE ON collateral
BEGIN
    UPDATE collateral SET updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = NEW.id;
END;

CREATE TRIGGER payments_updated
AFTER UPDATE ON payments
BEGIN
    UPDATE payments SET updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = NEW.id;
END;

CREATE TRIGGER cash_flows_updated
AFTER UPDATE ON cash_flows
BEGIN
    UPDATE cash_flows SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER bpo_title_ucc_updated
AFTER UPDATE ON bpo_title_ucc
BEGIN
    UPDATE bpo_title_ucc SET updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = NEW.id;
END;

CREATE TRIGGER projections_updated
AFTER UPDATE ON projections
BEGIN
    UPDATE projections SET updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = NEW.id;
END;

CREATE TRIGGER comments_updated
AFTER UPDATE ON comments
BEGIN
    UPDATE comments SET updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = NEW.id;
END;
```

### Data Access Layer Architecture

```
src/
├── database/
│   ├── index.ts              # Database initialization & connection
│   ├── schema.sql            # SQL schema (above)
│   ├── migrations/           # Future schema migrations
│   │   ├── 001_initial.sql
│   │   └── 002_add_attachments.sql
│   └── repositories/         # Data access repositories
│       ├── LoanRepository.ts
│       ├── BorrowerRepository.ts
│       ├── CollateralRepository.ts
│       ├── PaymentRepository.ts
│       ├── CommentRepository.ts
│       └── ProjectionRepository.ts
├── services/                 # Business logic layer
│   ├── LoanService.ts
│   ├── BorrowerService.ts
│   ├── CalculationService.ts
│   └── ProjectionService.ts
└── electron/
    ├── main.ts               # Electron main process
    └── preload.ts            # IPC bridge
```

### Implementation Pattern

#### 1. Database Initialization (`src/database/index.ts`)

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

const DB_NAME = 'loan_underwriting.db';

export function initializeDatabase(): Database.Database {
    // Store in app's user data directory
    const dbPath = path.join(app.getPath('userData'), DB_NAME);

    // Create database (or open existing)
    const db = new Database(dbPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Run schema if tables don't exist
    const tableExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='loans'"
    ).get();

    if (!tableExists) {
        const schema = fs.readFileSync(
            path.join(__dirname, 'schema.sql'),
            'utf-8'
        );
        db.exec(schema);
    }

    return db;
}
```

#### 2. Repository Pattern (`src/database/repositories/LoanRepository.ts`)

```typescript
import Database from 'better-sqlite3';
import { Loan, LoanCreate, LoanUpdate } from '../../types';

export class LoanRepository {
    private db: Database.Database;

    constructor(db: Database.Database) {
        this.db = db;
    }

    // Get all loans for a relationship
    findByRelationship(relationshipId: number): Loan[] {
        const stmt = this.db.prepare(`
            SELECT * FROM loans
            WHERE relationship_id = ?
            ORDER BY mw_loan_no
        `);
        return stmt.all(relationshipId) as Loan[];
    }

    // Get single loan by ID
    findById(id: number): Loan | undefined {
        const stmt = this.db.prepare('SELECT * FROM loans WHERE id = ?');
        return stmt.get(id) as Loan | undefined;
    }

    // Get loan by MW Loan Number
    findByLoanNo(mwLoanNo: string): Loan | undefined {
        const stmt = this.db.prepare('SELECT * FROM loans WHERE mw_loan_no = ?');
        return stmt.get(mwLoanNo) as Loan | undefined;
    }

    // Create new loan
    create(loan: LoanCreate): Loan {
        const stmt = this.db.prepare(`
            INSERT INTO loans (
                mw_loan_no, relationship_id, pool, status,
                origination_date, original_balance,
                principal_balance, interest_balance, escrow_balance, fees_balance,
                interest_rate, payment_amount, maturity_date,
                address1, address2, city, state, zip, asset_type
            ) VALUES (
                @mw_loan_no, @relationship_id, @pool, @status,
                @origination_date, @original_balance,
                @principal_balance, @interest_balance, @escrow_balance, @fees_balance,
                @interest_rate, @payment_amount, @maturity_date,
                @address1, @address2, @city, @state, @zip, @asset_type
            )
        `);

        const result = stmt.run(loan);
        return this.findById(result.lastInsertRowid as number)!;
    }

    // Update loan
    update(id: number, updates: LoanUpdate): Loan | undefined {
        const fields = Object.keys(updates);
        const setClause = fields.map(f => `${f} = @${f}`).join(', ');

        const stmt = this.db.prepare(`
            UPDATE loans SET ${setClause} WHERE id = @id
        `);

        stmt.run({ ...updates, id });
        return this.findById(id);
    }

    // Delete loan
    delete(id: number): boolean {
        const stmt = this.db.prepare('DELETE FROM loans WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    // Get loans with borrower info (for list view)
    findAllWithBorrowers(): Array<Loan & { primary_borrower: string }> {
        const stmt = this.db.prepare(`
            SELECT
                l.*,
                (SELECT b.name FROM borrowers b
                 JOIN borrower_loans bl ON b.id = bl.borrower_id
                 WHERE bl.loan_id = l.id AND bl.role = 'Borrower'
                 LIMIT 1) as primary_borrower
            FROM loans l
            ORDER BY l.mw_loan_no
        `);
        return stmt.all() as Array<Loan & { primary_borrower: string }>;
    }
}
```

#### 3. Comment Repository (`src/database/repositories/CommentRepository.ts`)

```typescript
import Database from 'better-sqlite3';

interface Comment {
    id: number;
    relationship_id: number;
    loan_id: number | null;  // NULL = relationship-wide comment
    comment_type: string;
    comment_date: string;
    text: string;            // HTML from rich text editor
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

interface CommentCreate {
    relationship_id: number;
    loan_id?: number | null;
    comment_type: string;
    comment_date?: string;   // Defaults to today if not provided
    text: string;
    created_by?: string;
}

export class CommentRepository {
    private db: Database.Database;

    constructor(db: Database.Database) {
        this.db = db;
    }

    // Get all comments for relationship (default view - whole relationship)
    findByRelationship(relationshipId: number): Comment[] {
        const stmt = this.db.prepare(`
            SELECT c.*, l.mw_loan_no
            FROM comments c
            LEFT JOIN loans l ON c.loan_id = l.id
            WHERE c.relationship_id = ?
            ORDER BY c.comment_date DESC, c.created_at DESC
        `);
        return stmt.all(relationshipId) as Comment[];
    }

    // Get comments filtered by specific loan (includes relationship-wide comments)
    findByLoan(relationshipId: number, loanId: number): Comment[] {
        const stmt = this.db.prepare(`
            SELECT c.*, l.mw_loan_no
            FROM comments c
            LEFT JOIN loans l ON c.loan_id = l.id
            WHERE c.relationship_id = ?
              AND (c.loan_id = ? OR c.loan_id IS NULL)
            ORDER BY c.comment_date DESC, c.created_at DESC
        `);
        return stmt.all(relationshipId, loanId) as Comment[];
    }

    // Create new comment (date auto-fills to today if not provided)
    create(comment: CommentCreate): Comment {
        const stmt = this.db.prepare(`
            INSERT INTO comments (
                relationship_id, loan_id, comment_type, comment_date, text, created_by
            ) VALUES (
                @relationship_id,
                @loan_id,
                @comment_type,
                COALESCE(@comment_date, DATE('now')),
                @text,
                @created_by
            )
        `);

        const result = stmt.run({
            relationship_id: comment.relationship_id,
            loan_id: comment.loan_id ?? null,
            comment_type: comment.comment_type,
            comment_date: comment.comment_date ?? null, // Let DB default handle it
            text: comment.text,
            created_by: comment.created_by ?? null
        });

        return this.findById(result.lastInsertRowid as number)!;
    }

    // Update comment (text is HTML from rich text editor)
    update(id: number, updates: Partial<CommentCreate>): Comment | undefined {
        const fields = Object.keys(updates);
        const setClause = fields.map(f => `${f} = @${f}`).join(', ');

        const stmt = this.db.prepare(`
            UPDATE comments SET ${setClause} WHERE id = @id
        `);

        stmt.run({ ...updates, id });
        return this.findById(id);
    }

    // Delete comment
    delete(id: number): boolean {
        const stmt = this.db.prepare('DELETE FROM comments WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    private findById(id: number): Comment | undefined {
        const stmt = this.db.prepare('SELECT * FROM comments WHERE id = ?');
        return stmt.get(id) as Comment | undefined;
    }
}
```

---

#### 4. Projection Repository (`src/database/repositories/ProjectionRepository.ts`)

```typescript
import Database from 'better-sqlite3';

interface Projection {
    id: number;
    loan_id: number;
    // Payment Settings
    payment_method: string;
    payment_amount: number | null;
    rate_method: string;
    rate_value: number | null;
    amort_months: number;
    trail_period: number;
    trail_percentage: number;
    // Exit Settings
    exit_method: string;
    exit_start_month: number;
    exit_end_month: number;
    exit_dpo_percentage: number;
    exit_value_cap_percentage: number;
    exit_user_amount: number | null;
    exit_ytm_desired: number | null;
    exit_liquidation_months: number;
    exit_liquidation_add_interest: boolean;
    // Expenses
    initial_legal: number;
    initial_legal_start_month: number;
    holding_cost_monthly: number;
    holding_cost_end_month: number;
    // Add-Back
    add_back_percentage: number;
    add_back_basis: string;
    // Metadata
    created_at: string;
    updated_at: string;
}

type ProjectionUpdate = Partial<Omit<Projection, 'id' | 'loan_id' | 'created_at' | 'updated_at'>>;

export class ProjectionRepository {
    private db: Database.Database;

    constructor(db: Database.Database) {
        this.db = db;
    }

    // Get projection for a loan (single scenario per loan)
    findByLoan(loanId: number): Projection | undefined {
        const stmt = this.db.prepare('SELECT * FROM projections WHERE loan_id = ?');
        return stmt.get(loanId) as Projection | undefined;
    }

    // Save projection (UPSERT - insert or update)
    save(loanId: number, updates: ProjectionUpdate): Projection {
        const existing = this.findByLoan(loanId);

        if (existing) {
            // Update existing
            const fields = Object.keys(updates);
            if (fields.length > 0) {
                const setClause = fields.map(f => `${f} = @${f}`).join(', ');
                const stmt = this.db.prepare(`
                    UPDATE projections
                    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
                    WHERE loan_id = @loan_id
                `);
                stmt.run({ ...updates, loan_id: loanId });
            }
        } else {
            // Insert new with defaults
            const stmt = this.db.prepare(`
                INSERT INTO projections (
                    loan_id, payment_method, payment_amount, rate_method, rate_value,
                    amort_months, trail_period, trail_percentage,
                    exit_method, exit_start_month, exit_end_month,
                    exit_dpo_percentage, exit_value_cap_percentage, exit_user_amount,
                    exit_ytm_desired, exit_liquidation_months, exit_liquidation_add_interest,
                    initial_legal, initial_legal_start_month,
                    holding_cost_monthly, holding_cost_end_month,
                    add_back_percentage, add_back_basis
                ) VALUES (
                    @loan_id,
                    COALESCE(@payment_method, 'Contractual'),
                    @payment_amount,
                    COALESCE(@rate_method, 'Contractual'),
                    @rate_value,
                    COALESCE(@amort_months, 360),
                    COALESCE(@trail_period, 12),
                    COALESCE(@trail_percentage, 100),
                    COALESCE(@exit_method, 'Pay in Full'),
                    COALESCE(@exit_start_month, 1),
                    COALESCE(@exit_end_month, 24),
                    COALESCE(@exit_dpo_percentage, 95),
                    COALESCE(@exit_value_cap_percentage, 90),
                    @exit_user_amount,
                    @exit_ytm_desired,
                    COALESCE(@exit_liquidation_months, 12),
                    COALESCE(@exit_liquidation_add_interest, 0),
                    COALESCE(@initial_legal, 0),
                    COALESCE(@initial_legal_start_month, 1),
                    COALESCE(@holding_cost_monthly, 0),
                    COALESCE(@holding_cost_end_month, 12),
                    COALESCE(@add_back_percentage, 0),
                    COALESCE(@add_back_basis, 'Initial Only')
                )
            `);
            stmt.run({ loan_id: loanId, ...updates });
        }

        return this.findByLoan(loanId)!;
    }

    // Get trailing payment data for calculation
    getTrailingPayments(loanId: number, trailPeriod: number, lastImportDate: string): {
        totalPayments: number;
        monthsWithPayments: number;
        monthlyAverage: number;
    } {
        // Calculate start date based on trail period and last import date
        // lastImportDate format: "MM/DD/YY" or "YYYY-MM-DD"
        const importDate = new Date(lastImportDate);
        const startDate = new Date(importDate);
        startDate.setMonth(startDate.getMonth() - trailPeriod);

        // Convert to YYYYMM format for payment_date comparison
        const startYYYYMM = startDate.getFullYear() * 100 + (startDate.getMonth() + 1);
        const endYYYYMM = importDate.getFullYear() * 100 + importDate.getMonth(); // Month before import

        const stmt = this.db.prepare(`
            SELECT
                COALESCE(SUM(amount), 0) as total_payments,
                COUNT(*) as months_with_payments
            FROM payments
            WHERE loan_id = ?
              AND payment_date >= ?
              AND payment_date < ?
        `);

        const result = stmt.get(loanId, startYYYYMM, endYYYYMM) as {
            total_payments: number;
            months_with_payments: number;
        };

        return {
            totalPayments: result.total_payments,
            monthsWithPayments: result.months_with_payments,
            monthlyAverage: trailPeriod > 0 ? result.total_payments / trailPeriod : 0
        };
    }

    // Delete projection for a loan
    delete(loanId: number): boolean {
        const stmt = this.db.prepare('DELETE FROM projections WHERE loan_id = ?');
        const result = stmt.run(loanId);
        return result.changes > 0;
    }
}
```

---

#### 5. IPC Communication (Electron ↔ React)

**Main Process (`electron/main.ts`):**
```typescript
import { ipcMain } from 'electron';
import { LoanRepository } from '../database/repositories/LoanRepository';

// Initialize database
const db = initializeDatabase();
const loanRepo = new LoanRepository(db);
const commentRepo = new CommentRepository(db);

// IPC Handlers - Loans
ipcMain.handle('loans:getAll', () => {
    return loanRepo.findAllWithBorrowers();
});

ipcMain.handle('loans:getById', (_, id: number) => {
    return loanRepo.findById(id);
});

ipcMain.handle('loans:create', (_, loan: LoanCreate) => {
    return loanRepo.create(loan);
});

ipcMain.handle('loans:update', (_, id: number, updates: LoanUpdate) => {
    return loanRepo.update(id, updates);
});

ipcMain.handle('loans:delete', (_, id: number) => {
    return loanRepo.delete(id);
});

// IPC Handlers - Comments (simplified per user requirements)
ipcMain.handle('comments:getByRelationship', (_, relationshipId: number) => {
    return commentRepo.findByRelationship(relationshipId);  // Default: all loans
});

ipcMain.handle('comments:getByLoan', (_, relationshipId: number, loanId: number) => {
    return commentRepo.findByLoan(relationshipId, loanId);  // Filtered by loan
});

ipcMain.handle('comments:create', (_, comment: CommentCreate) => {
    return commentRepo.create(comment);  // Date auto-fills to today
});

ipcMain.handle('comments:update', (_, id: number, updates: Partial<CommentCreate>) => {
    return commentRepo.update(id, updates);  // text field stores HTML
});

ipcMain.handle('comments:delete', (_, id: number) => {
    return commentRepo.delete(id);
});

// IPC Handlers - Projections (single scenario per loan)
const projectionRepo = new ProjectionRepository(db);

ipcMain.handle('projections:getByLoan', (_, loanId: number) => {
    return projectionRepo.findByLoan(loanId);
});

ipcMain.handle('projections:save', (_, loanId: number, updates: ProjectionUpdate) => {
    return projectionRepo.save(loanId, updates);  // UPSERT pattern
});

ipcMain.handle('projections:getTrailingPayments', (_, loanId: number, trailPeriod: number, lastImportDate: string) => {
    return projectionRepo.getTrailingPayments(loanId, trailPeriod, lastImportDate);
});
```

**Preload (`electron/preload.ts`):**
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    loans: {
        getAll: () => ipcRenderer.invoke('loans:getAll'),
        getById: (id: number) => ipcRenderer.invoke('loans:getById', id),
        create: (loan: LoanCreate) => ipcRenderer.invoke('loans:create', loan),
        update: (id: number, updates: LoanUpdate) => ipcRenderer.invoke('loans:update', id, updates),
        delete: (id: number) => ipcRenderer.invoke('loans:delete', id),
    },
    comments: {
        // Default view: all comments for relationship
        getByRelationship: (relId: number) => ipcRenderer.invoke('comments:getByRelationship', relId),
        // Filtered view: comments for specific loan (+ relationship-wide)
        getByLoan: (relId: number, loanId: number) => ipcRenderer.invoke('comments:getByLoan', relId, loanId),
        create: (comment: CommentCreate) => ipcRenderer.invoke('comments:create', comment),
        update: (id: number, updates: Partial<CommentCreate>) => ipcRenderer.invoke('comments:update', id, updates),
        delete: (id: number) => ipcRenderer.invoke('comments:delete', id),
    },
    projections: {
        // Single scenario per loan
        getByLoan: (loanId: number) => ipcRenderer.invoke('projections:getByLoan', loanId),
        save: (loanId: number, updates: ProjectionUpdate) => ipcRenderer.invoke('projections:save', loanId, updates),
        getTrailingPayments: (loanId: number, trailPeriod: number, lastImportDate: string) =>
            ipcRenderer.invoke('projections:getTrailingPayments', loanId, trailPeriod, lastImportDate),
    },
    borrowers: {
        // Similar pattern...
    },
    // ... other entities
});
```

**React Usage:**
```typescript
// In React component - Loans
const loadLoans = async () => {
    const loans = await window.electronAPI.loans.getAll();
    setLoans(loans);
};

const saveLoan = async (loan: LoanUpdate) => {
    await window.electronAPI.loans.update(selectedLoanId, loan);
    await loadLoans(); // Refresh list
};

// In React component - Comments Tab
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const [commentLoanFilter, setCommentLoanFilter] = useState('all');
const [comments, setComments] = useState([]);

// Load comments based on filter
const loadComments = async () => {
    if (commentLoanFilter === 'all') {
        // Default: show all comments for relationship
        const data = await window.electronAPI.comments.getByRelationship(currentRelationshipId);
        setComments(data);
    } else {
        // Filtered by specific loan
        const data = await window.electronAPI.comments.getByLoan(currentRelationshipId, parseInt(commentLoanFilter));
        setComments(data);
    }
};

// Create new comment (date auto-fills to today)
const addNewComment = async () => {
    await window.electronAPI.comments.create({
        relationship_id: currentRelationshipId,
        loan_id: commentLoanFilter === 'all' ? null : parseInt(commentLoanFilter),
        comment_type: 'Note',
        text: '',  // Empty rich text
        // comment_date omitted - auto-fills to today
    });
    await loadComments();
};

// Save comment with rich text HTML
const saveComment = async (id: number, htmlContent: string) => {
    await window.electronAPI.comments.update(id, { text: htmlContent });
};

// In React component - Projections Tab
const [projection, setProjection] = useState<Projection | null>(null);
const [trailingData, setTrailingData] = useState({ monthlyAverage: 0, monthsWithPayments: 0 });

// Load projection when loan is selected
const loadProjection = async (loanId: number) => {
    const data = await window.electronAPI.projections.getByLoan(loanId);
    setProjection(data || getDefaultProjection()); // Use defaults if none exists
};

// Save projection (auto-saves on field change)
const saveProjection = async (field: string, value: any) => {
    await window.electronAPI.projections.save(selectedLoanId, { [field]: value });
    await loadProjection(selectedLoanId);
};

// Get trailing payment data for "% of Trail Pmt" method
const loadTrailingPayments = async () => {
    const loan = loans.find(l => l.id === selectedLoanId);
    if (!loan?.lastImportDate) return;

    const data = await window.electronAPI.projections.getTrailingPayments(
        selectedLoanId,
        projection.trail_period,
        loan.lastImportDate
    );
    setTrailingData(data);

    // Show warning if no payment history
    if (data.monthsWithPayments === 0) {
        setShowNoHistoryWarning(true);
    }
};

// Calculate projected payment based on method
const getProjectedPayment = () => {
    switch (projection.payment_method) {
        case 'Contractual': return selectedLoan.pmt;
        case 'User Enter': return projection.payment_amount;
        case 'Term Pmt': return calculateTermPayment();
        case 'Interest Payment': return calculateInterestOnly();
        case '% of Trail Pmt': return trailingData.monthlyAverage * (projection.trail_percentage / 100);
    }
};
```

### Required Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "react-quill": "^2.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "electron-is-dev": "^3.0.1",
    "concurrently": "^8.2.2",
    "cross-env": "^7.0.3",
    "wait-on": "^7.2.0"
  }
}
```

**Note on react-quill:** This provides the rich text editor for comments. The HTML output is stored directly in the SQLite `text` column. No additional processing required.

---

## Part 3: Priority Recommendations

### Immediate Actions (Critical)

1. **Fix Security Vulnerability** - Replace `new Function()` with safe math parser
2. **Create `src/` directory structure** - App cannot build without it
3. **Rename file** - Remove space from filename
4. **Add missing dependencies** - App won't run without them

### Short-term (Within 1 Week)

5. **Implement SQLite database** - Using schema above
6. **Convert to controlled components** - Fix all `defaultValue` issues
7. **Add input validation** - Prevent bad data entry

### Medium-term (Within 1 Month)

8. **Break apart monolithic component** - Create modular structure
9. **Add error boundaries** - Graceful error handling
10. **Complete Comments & Projections tabs** - Currently 0% done

### Long-term (Enhancement)

11. **Add authentication** - User management
12. **Implement undo/redo** - User safety
13. **Data export** - Excel/CSV/PDF
14. **Add comment search** - If needed in future (currently not required)

---

## Part 4: Comments Tab Design Specifications

### 4.1 Filtering by Loan (Independent Dropdown)

The Comments tab will have its own loan filter dropdown, **independent of the loan selected in the main Loans table**. This allows users to:

1. **View all relationship comments** (default) - First/default view shows comments for the entire relationship
2. **Filter by specific loan** - Optional filtering to show only comments tied to a specific loan

**UI Implementation:**
```jsx
// Loan filter dropdown in Comments tab header
const [commentLoanFilter, setCommentLoanFilter] = useState('all'); // 'all' or loan_id

<select value={commentLoanFilter} onChange={(e) => setCommentLoanFilter(e.target.value)}>
    <option value="all">All Loans (Relationship View)</option>
    {loans.map(loan => (
        <option key={loan.id} value={loan.id}>{loan.mw_loan_no} - {loan.borrowerName}</option>
    ))}
</select>
```

**Database Query:**
```sql
-- Get all comments for relationship (default view)
SELECT * FROM comments
WHERE relationship_id = ?
ORDER BY comment_date DESC;

-- Get comments filtered by specific loan
SELECT * FROM comments
WHERE relationship_id = ?
  AND (loan_id = ? OR loan_id IS NULL)  -- Includes relationship-wide comments
ORDER BY comment_date DESC;
```

---

### 4.2 Rich Text Storage in SQL

**How it works:** Rich text editors output HTML or JSON. SQLite's TEXT column can store either format without issues.

**Recommended Approach: Store HTML**

```sql
-- Example comment with rich text (HTML)
INSERT INTO comments (relationship_id, loan_id, comment_type, text)
VALUES (
    1,
    NULL,  -- Relationship-wide comment
    'Note',
    '<p>Spoke with borrower on <strong>11/25/24</strong>.</p>
     <ul>
       <li>Confirmed mailing address</li>
       <li>Discussed payment plan options</li>
     </ul>
     <p><em>Follow up next week.</em></p>'
);
```

**UI Component Options:**

| Library | Bundle Size | Features | Recommendation |
|---------|-------------|----------|----------------|
| **Quill** | 43kb | Toolbar, lists, bold/italic, links | ✅ Best for simplicity |
| **TipTap** | 25kb | Modern, extensible, collaborative | Good for advanced needs |
| **React-Quill** | 45kb | React wrapper for Quill | ✅ Easy React integration |

**Simple Implementation:**
```jsx
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// In Comments tab
<ReactQuill
    value={selectedComment.text}
    onChange={(html) => handleCommentFieldChange(selectedComment.id, 'text', html)}
    modules={{
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ]
    }}
    placeholder="Enter your notes..."
/>
```

**Storage Considerations:**
- SQLite TEXT columns have no practical size limit (up to 1GB)
- HTML is human-readable and can be searched with LIKE if needed later
- Rendering is straightforward: `<div dangerouslySetInnerHTML={{ __html: comment.text }} />`

---

### 4.3 Free-Form Comment Entry

Each team member has their own method of going through documents. The comment system is **intentionally unstructured**:

- ✅ **Free-form text** - No required fields beyond the comment itself
- ✅ **Rich text formatting** - Bold, italic, lists, etc. for personal organization
- ✅ **Comment types** - Optional categorization (Note, Legal, Underwriting, etc.)
- ❌ **No templates** - Users write what they need
- ❌ **No required structure** - No mandatory sections or fields

---

### 4.4 Date Handling (Auto-fill with Override)

**Comment dates auto-fill with today's date** but users can adjust if needed:

**Database Default:**
```sql
comment_date DATE NOT NULL DEFAULT (DATE('now'))
```

**UI Implementation:**
```jsx
// Date input with today as default, but editable
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

const [newComment, setNewComment] = useState({
    date: today,  // Auto-filled
    // ... other fields
});

<input
    type="date"
    value={selectedComment.date}
    onChange={(e) => handleCommentFieldChange(selectedComment.id, 'date', e.target.value)}
/>
```

**For all date fields in the app**, the pattern is:
1. Auto-populate with today's date when creating new records
2. Allow user to click and select a different date if needed
3. Use native HTML5 `<input type="date">` for built-in calendar picker

---

### 4.5 Features Explicitly NOT Included

Per user specifications, the following are **not implemented**:

| Feature | Status | Reason |
|---------|--------|--------|
| Revision History | ❌ Not needed | User confirmed not required |
| Attachments | ❌ Not needed | Comments don't need file attachments |
| @Mentions | ❌ Not needed | No tagging/notification system |
| Search within Comments | ❌ Not needed | Not a current requirement |

These can be added later if requirements change.

---

## Part 5: Projections Tab Design Specifications

### 5.1 Overview

The Projections tab provides loan scenario analysis for modeling cash flows and exit strategies. Each loan has a **single projection scenario** (not multiple named scenarios).

**Key Constraints:**
| Setting | Value |
|---------|-------|
| Scenarios per loan | 1 (single) |
| Default exit month | 24 |
| Maximum projection length | 60 months |
| Expense types | 2 (Initial Legal + Holding Costs) |

---

### 5.2 Payment Methods

Five payment calculation methods are available. When selected, the UI shows the **calculated value being used**:

| Method | Description | Shows Value |
|--------|-------------|-------------|
| **Contractual** | Uses loan's contracted payment | `$1,000/mo` |
| **User Enter** | Manual payment amount | `$800/mo` (user input) |
| **Term Pmt** | Calculates PMT based on amortization | `$950/mo (360 mo amort)` |
| **Interest Payment** | Interest-only payment | `$625/mo (interest only)` |
| **% of Trail Pmt** | Trailing average from payment history | `$700/mo (12-mo avg)` |

**UI Display Pattern:**
```jsx
// When user selects a payment method, show the value being used
<div className="value-display">
    <span className="label">Monthly Payment:</span>
    <span className="value">${calculatedPayment.toLocaleString()}</span>
    <span className="method-note">({paymentMethodDescription})</span>
</div>
```

---

### 5.3 Trailing Payment Calculation

The "% of Trail Pmt" method analyzes **actual payment history before the last import date**:

**Logic:**
```
Last Import Date: 11/15/2024

12-month trailing → Sum payments from 11/2023 through 10/2024
 6-month trailing → Sum payments from 05/2024 through 10/2024
 3-month trailing → Sum payments from 08/2024 through 10/2024

Monthly Average = Total Payments ÷ Number of Months
Projected Payment = Monthly Average × (Trail Percentage / 100)
```

**Database Query:**
```sql
-- Get trailing payments for calculation
SELECT SUM(amount) as total_payments, COUNT(*) as months_with_payments
FROM payments
WHERE loan_id = ?
  AND payment_date >= ?  -- Start of trailing period (YYYYMM format)
  AND payment_date < ?   -- Last import date month (YYYYMM format)
```

**No Payment History Handling:**
- If no payments found in the trailing period → Return `$0`
- Display warning: "No payment history available for trailing calculation"

```jsx
{trailingPaymentData.monthsWithPayments === 0 && (
    <div className="warning-alert">
        ⚠️ No payment history available for trailing calculation
    </div>
)}
```

---

### 5.4 Rate Methods

Two rate calculation methods:

| Method | Description | Shows Value |
|--------|-------------|-------------|
| **Contractual** | Uses loan's contracted rate | `7.5%` |
| **User Enter** | Manual rate entry | `8.0%` (user input) |

The rate is used in Term Pmt, Interest Payment, Pay in Full, and other calculations.

---

### 5.5 Expense Assumptions (2 Types Only)

Per user specification, only two expense types:

**1. Initial Legal**
- One-time cost
- Occurs in specified month (default: month 1)
- Example: $5,000 legal fees

**2. Holding Costs**
- Monthly recurring cost
- Runs from month after initial legal through end month
- Example: $1,000/month for 12 months = $12,000 total

**UI shows calculated totals:**
```jsx
<div className="expense-summary">
    <div>Initial Legal: ${initialLegal.toLocaleString()} (Month {initialLegalStartMonth})</div>
    <div>Holding Costs: ${holdingCostMonthly.toLocaleString()}/mo × {holdingMonths} months
         = ${totalHoldingCosts.toLocaleString()}</div>
    <div className="total">Total Expenses: ${totalExpenses.toLocaleString()}</div>
</div>
```

---

### 5.6 Add-Back Recovery

Recovers a percentage of expenses at exit:

**Calculation:**
```javascript
if (addBackBasis === 'Initial Only') {
    recovery = initialLegal * (addBackPercentage / 100);
} else if (addBackBasis === 'Initial + Holding') {
    recovery = (initialLegal + totalHoldingCosts) * (addBackPercentage / 100);
}
```

**Example:**
```
Initial Legal: $5,000
Holding Costs: $12,000 (12 × $1,000)
Add Back %: 50%
Basis: Initial + Holding

Recovery = ($5,000 + $12,000) × 50% = $8,500
```

---

### 5.7 Exit Methods (All 6 Used)

| Method | Calculation | Shows Value |
|--------|-------------|-------------|
| **Pay in Full** | Future Value at exit month | `$125,000 (FV at Month 24)` |
| **DPO** | PIF × DPO% | `$118,750 (95% of PIF)` |
| **Value Cap** | Collateral Value × Cap% | `$108,000 (90% of $120,000)` |
| **User Enter** | Manual amount | `$100,000` (user input) |
| **YTM Sell Solve** | Sale price for desired YTM | `$95,000 (for 12% YTM)` |
| **Liquidation** | Principal + accrued interest | `$130,000 (12-mo accrual)` |

**Exit Settings:**
- Start Month: Default 1, adjustable
- End Month: Default 24, max 60
- UI validates: End Month ≤ 60

**Negative Exit Value Warning:**

If any exit calculation returns a negative value, display a warning:

```jsx
{exitValue < 0 && (
    <div className="warning-alert negative-exit">
        ⚠️ Warning: Exit value is negative (${Math.abs(exitValue).toLocaleString()})
        <p>This may indicate the loan balance exceeds the expected recovery.</p>
    </div>
)}
```

**Scenarios that may produce negative exit values:**
| Exit Method | When Negative |
|-------------|---------------|
| **Value Cap** | Collateral value × Cap% < expenses |
| **DPO** | Offered discount too steep relative to balance |
| **Liquidation** | Recovery after costs is negative |
| **YTM Sell Solve** | Desired YTM requires sale below zero |

The warning is informational - the system still allows saving negative projections for analysis purposes.

---

### 5.8 Cash Flow Grid Display

Shows monthly projections with values that feed into calculations displayed:

**Grid Structure (5 years max):**
```
         | Jan  | Feb  | Mar  | ... | Dec  | Year Total
---------|------|------|------|-----|------|------------
2025     |      |      |      |     |      |
  Income | $700 | $700 | $700 | ... | $700 | $8,400
  Expense| $5K  | $1K  | $1K  | ... | $1K  | $16,000
  Net    |-$4.3K|-$300 |-$300 | ... |-$300 | -$7,600
---------|------|------|------|-----|------|------------
2026     | ...
```

**Color Coding:**
- Income: Green for positive, gray for zero
- Expenses: Red for positive, gray for zero
- Net: Green for positive, Red for negative

---

### 5.9 Summary Display

Show all values being used in the projection:

```jsx
<div className="projection-summary">
    <h4>Projection Settings</h4>

    <div className="section">
        <strong>Income</strong>
        <div>Payment Method: {paymentMethod}</div>
        <div>Monthly Payment: ${monthlyPayment.toLocaleString()}</div>
        <div>Rate: {effectiveRate}%</div>
    </div>

    <div className="section">
        <strong>Expenses</strong>
        <div>Initial Legal: ${initialLegal.toLocaleString()} (Month {startMonth})</div>
        <div>Holding Costs: ${holdingCostMonthly.toLocaleString()}/mo through Month {endMonth}</div>
        <div>Total Expenses: ${totalExpenses.toLocaleString()}</div>
    </div>

    <div className="section">
        <strong>Exit ({exitMethod})</strong>
        <div>Exit Month: {exitEndMonth}</div>
        <div>Exit Value: ${exitValue.toLocaleString()}</div>
        <div>Add-Back Recovery: ${addBackRecovery.toLocaleString()}</div>
        <div className="total">Total Return: ${totalReturn.toLocaleString()}</div>
    </div>
</div>
```

---

### 5.10 Database Operations

**Single scenario per loan - uses UPSERT pattern:**

```sql
-- Insert or update projection for a loan
INSERT INTO projections (loan_id, payment_method, exit_end_month, ...)
VALUES (?, ?, ?, ...)
ON CONFLICT(loan_id) DO UPDATE SET
    payment_method = excluded.payment_method,
    exit_end_month = excluded.exit_end_month,
    ...
    updated_at = CURRENT_TIMESTAMP;
```

**Load projection for loan:**
```sql
SELECT * FROM projections WHERE loan_id = ?
```

---

### 5.11 Validation Rules

| Field | Validation |
|-------|------------|
| Exit End Month | 1-60, must be ≥ Exit Start Month |
| Exit Start Month | 1-60, must be ≤ Exit End Month |
| Amort Months | 1-360 (for Term Pmt) |
| Trail Period | 3, 6, or 12 only |
| Trail Percentage | 0-100% |
| DPO Percentage | 0-100% |
| Value Cap Percentage | 0-100% |
| Add Back Percentage | 0-100% |
| Initial Legal | ≥ 0 |
| Holding Cost Monthly | ≥ 0 |

**Warning Conditions (non-blocking):**

| Condition | Warning Message |
|-----------|-----------------|
| Exit Value < 0 | "Exit value is negative" - allows save but warns user |
| No trailing payment history | "No payment history available for trailing calculation" |

---

### 5.12 Future Enhancements (Projections Tab)

The following enhancements are planned for future implementation:

#### 5.12.1 Exit Value Validation Against Face Value

**Requirement:** Throw an error/warning when exit value exceeds the mortgage face value.

**Logic:**
```javascript
if (exitValue > loan.faceValue) {
    showError("Exit value ($X) exceeds mortgage face value ($Y)");
}
```

**Rationale:** Exit values shouldn't typically exceed the original face value of the mortgage unless significant fees/interest have accrued. This catches potential input errors.

**Database Need:** Ensure `face_value` field exists in loans table.

---

#### 5.12.2 Exit Value vs Collateral Value Warning

**Requirement:** Warning when exit value exceeds the collateral's "Our Value" for loans linked to that collateral.

**Logic:**
```javascript
const linkedCollateral = getCollateralForLoan(loanId);
const totalCollateralValue = linkedCollateral.reduce((sum, c) => sum + c.ourValue, 0);

if (exitValue > totalCollateralValue) {
    showWarning("Exit value ($X) exceeds collateral value ($Y)");
}
```

**UI Display:**
```jsx
{exitValue > collateralValue && (
    <div className="warning-alert">
        ⚠️ Exit value exceeds collateral value by ${(exitValue - collateralValue).toLocaleString()}
    </div>
)}
```

**Rationale:** For Value Cap and other recovery-based exits, projecting more than the collateral is worth may be unrealistic.

---

#### 5.12.3 Cross-Collateralized Face Value Tracking

**Requirement:** Track availability of mortgage face value across cross-collateralized loans.

**Problem:** When multiple loans share collateral, the face value "capacity" needs to be tracked to ensure we're not over-allocating recovery expectations.

**Database Schema Addition:**
```sql
-- Track face value allocation across cross-collateralized loans
CREATE TABLE face_value_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collateral_id INTEGER NOT NULL,
    loan_id INTEGER NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL,
    allocation_priority INTEGER DEFAULT 1,  -- 1 = first lien, 2 = second, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collateral_id) REFERENCES collateral(id),
    FOREIGN KEY (loan_id) REFERENCES loans(id)
);
```

**UI Display:**
```
Collateral: 123 Main St
Total Face Value: $500,000
├── Loan #001: $300,000 allocated (1st lien)
├── Loan #002: $150,000 allocated (2nd lien)
└── Available: $50,000

⚠️ Warning: Loan #003 exit value ($75,000) exceeds available face value ($50,000)
```

**Calculation:**
```javascript
const getTotalAllocated = (collateralId) => {
    return allocations
        .filter(a => a.collateral_id === collateralId)
        .reduce((sum, a) => sum + a.allocated_amount, 0);
};

const getAvailableFaceValue = (collateralId) => {
    const collateral = getCollateral(collateralId);
    return collateral.faceValue - getTotalAllocated(collateralId);
};
```

---

#### 5.12.4 Variable Rate Reset Warning

**Requirement:** Display warning when a variable-rate loan has an interest rate reset within 6 months of the projection start.

**Database Schema Addition:**
```sql
-- Add to loans table
ALTER TABLE loans ADD COLUMN rate_type VARCHAR(20) DEFAULT 'Fixed';  -- Fixed, Variable, ARM
ALTER TABLE loans ADD COLUMN next_rate_reset_date DATE;
ALTER TABLE loans ADD COLUMN rate_index VARCHAR(30);  -- SOFR, Prime, etc.
ALTER TABLE loans ADD COLUMN rate_margin DECIMAL(5,3);  -- Margin over index
```

**Logic:**
```javascript
const monthsUntilReset = differenceInMonths(loan.nextRateResetDate, projectionStartDate);

if (loan.rateType === 'Variable' && monthsUntilReset <= 6) {
    showWarning(`Interest rate reset in ${monthsUntilReset} months. Current projections use ${loan.intRate}%.`);
}
```

**UI Display:**
```jsx
{loan.rateType === 'Variable' && monthsUntilReset <= 6 && (
    <div className="warning-alert rate-reset">
        ⚠️ Variable Rate Alert: Rate reset in {monthsUntilReset} months
        <p>Current rate: {loan.intRate}% | Index: {loan.rateIndex} + {loan.rateMargin}%</p>
        <p>Projections assume current rate continues. Actual payments may differ.</p>
    </div>
)}
```

---

#### 5.12.5 Negative Amortization Warning

**Requirement:** Alert users when the projected payment is less than the interest accruing, causing the loan balance to grow instead of decrease.

**Problem:** When monthly payment < monthly interest, unpaid interest gets added to principal ("negative amortization"). This is critical to flag because:
- Loan balance increases over time
- Exit value calculations may be understated
- Actual payoff at exit will be higher than projected

**Logic:**
```javascript
const monthlyInterest = (loan.principal * (effectiveRate / 100)) / 12;
const projectedPayment = calculateProjectedPayment();

const isNegativeAmortization = projectedPayment < monthlyInterest;
const monthlyShortfall = monthlyInterest - projectedPayment;
const projectedBalanceGrowth = monthlyShortfall * exitEndMonth;
```

**Calculation Example:**
```
Principal: $100,000
Rate: 8%
Monthly Interest: $100,000 × 8% ÷ 12 = $666.67

Projected Payment: $400/mo (e.g., from trailing average)
Shortfall: $666.67 - $400 = $266.67/mo

Over 24-month projection:
Balance Growth: $266.67 × 24 = $6,400
Projected Balance at Exit: $106,400 (not $100,000)
```

**UI Display:**
```jsx
{isNegativeAmortization && (
    <div className="warning-alert negative-amort">
        ⚠️ Negative Amortization Warning
        <p>Projected payment (${projectedPayment.toLocaleString()}/mo) is less than
           monthly interest (${monthlyInterest.toLocaleString()}/mo)</p>
        <div className="details">
            <div>Monthly Shortfall: ${monthlyShortfall.toLocaleString()}</div>
            <div>Projected Balance Growth: ${projectedBalanceGrowth.toLocaleString()} over {exitEndMonth} months</div>
            <div>Estimated Balance at Exit: ${(loan.principal + projectedBalanceGrowth).toLocaleString()}</div>
        </div>
        <p className="note">Exit value calculations may need adjustment to account for balance growth.</p>
    </div>
)}
```

**Impact on Exit Calculations:**
| Exit Method | How Negative Amort Affects It |
|-------------|-------------------------------|
| **Pay in Full** | Should use grown balance, not original UPB |
| **DPO** | Discount applied to higher balance |
| **Value Cap** | No direct impact (based on collateral) |
| **Liquidation** | Balance at liquidation will be higher |
| **YTM Sell Solve** | IRR calculation needs adjusted cash flows |

**Severity Levels:**
```javascript
const shortfallPercent = (monthlyShortfall / monthlyInterest) * 100;

if (shortfallPercent > 50) {
    severity = 'critical';  // Red - payment covers less than half of interest
} else if (shortfallPercent > 25) {
    severity = 'warning';   // Yellow - significant shortfall
} else {
    severity = 'info';      // Blue - minor shortfall
}
```

---

#### 5.12.6 Additional Suggested Enhancements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| **LTV Warning** | Alert when projected exit LTV exceeds threshold (e.g., 80%) | Medium |
| **Maturity Date Warning** | Warning if exit month is past loan maturity date | High |
| **BPO/Appraisal Age** | Warning if collateral value is based on appraisal > 12 months old | Low |
| **Exit Method Consistency** | Error if using Value Cap but no collateral linked to loan | High |
| **Payment Shortfall** | Warning if projected payment is < 50% of contractual | Medium |
| **Expense Ratio Warning** | Alert if total expenses > 20% of exit value | Low |
| **IRR Display** | Show projected IRR based on purchase price and cash flows | Medium |
| **Sensitivity Analysis** | Show exit value at ±10% rate/payment scenarios | Low |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Critical Issues | 4 |
| High Priority Issues | 4 |
| Medium Priority Issues | 4 |
| Minor Issues | 5 |
| **Total Issues** | **17** |

| Refactoring Status | % Complete |
|-------------------|-----------|
| Foundation | 100% |
| UI Components | 100% |
| Loan Tab | 100% |
| Borrower Tab | 100% |
| Collateral Tab | 100% |
| PayHist Tab | 100% |
| Comments Tab | 0% |
| Projections Tab | 0% |
| **Overall** | **48%** |

---

## Appendix: Entity Relationship Diagram

```
+----------------+
|    projects    |  (Top Level - Individual Deals)
+----------------+
| id (PK)        |
| name           |
| purchase_price |
| status         |
+----------------+
        |
        | 1:N
        v
+----------------+       +------------------+       +----------------+
| relationships  |       |      loans       |       |   borrowers    |
+----------------+       +------------------+       +----------------+
| id (PK)        |       | id (PK)          |       | id (PK)        |
| project_id(FK) |<------| relationship_id  |------>| relationship_id|
| name           |       | mw_loan_no       |       | name           |
+----------------+       | principal_balance|       | entity_type    |
                         | interest_rate    |       | credit_score   |
                         | status           |       +----------------+
                         +------------------+              |
                                |                          |
                                |     +------------------+ |
                                +---->| borrower_loans   |<+  (Junction: Role)
                                |     +------------------+
                                |     | borrower_id (FK) |
                                |     | loan_id (FK)     |
                                |     | role             |  Borrower/Guarantor/Co-Borrower
                                |     +------------------+
                                |
                                |     +------------------+
                                +---->| collateral_loans |     (Junction: Lien Position)
                                |     +------------------+
                                |     | collateral_id(FK)|
                                |     | loan_id (FK)     |
                                |     | lien_position    |
                                |     | lien_amount      |
                                |     +------------------+
                                |            |
                                |            v
                                |     +------------------+     +------------------+
                                |     |   collateral     |---->|  bpo_title_ucc   |
                                |     +------------------+     +------------------+
                                |     | id (PK)          |     | collateral_id(FK)|
                                |     | property_type    |     | record_type      | BPO/Title/UCC
                                |     | address1         |     | bpo_value        |
                                |     | our_value        |     | title_status     |
                                |     +------------------+     | ucc_filing_number|
                                |                              +------------------+
                                |
                                |     +------------------+
                                +---->|    payments      |  (YYYYMM Format)
                                |     +------------------+
                                |     | loan_id (FK)     |
                                |     | payment_date     |  Integer: 202504
                                |     | amount           |
                                |     +------------------+
                                |
                                |     +------------------+
                                +---->|   cash_flows     |  (Monthly Projection Data)
                                |     +------------------+
                                |     | loan_id (FK)     |
                                |     | month_number     |
                                |     | projected_payment|
                                |     | net_cash_flow    |
                                |     | exit_value       |
                                |     +------------------+
                                |
                                |     +------------------+
                                +---->|   projections    |  (Settings per Loan)
                                |     +------------------+
                                |     | loan_id (FK)     |
                                |     | payment_method   |
                                |     | exit_method      |
                                |     | exit_end_month   |
                                |     +------------------+
                                |
                                |     +------------------+
                                +---->|    comments      |  (Multi-level: Project/Rel/Loan/Collateral)
                                      +------------------+
                                      | project_id (FK)  |
                                      | relationship_id  |
                                      | loan_id (FK)     |
                                      | collateral_id(FK)|
                                      | comment_type     |
                                      | text             |
                                      +------------------+
```

**Table Count: 12**
| # | Table | Records Per |
|---|-------|-------------|
| 1 | projects | Top level |
| 2 | relationships | Per project |
| 3 | loans | Per relationship |
| 4 | borrowers | Per relationship |
| 5 | borrower_loans | Per borrower-loan pair |
| 6 | collateral | Standalone |
| 7 | collateral_loans | Per collateral-loan pair |
| 8 | payments | Per loan per month |
| 9 | cash_flows | Per loan per projection month |
| 10 | bpo_title_ucc | Per collateral |
| 11 | projections | One per loan |
| 12 | comments | Any level |

---

## Part 6: Database Tables View (Access-Style Datasheet)

### 6.1 Overview

An Access-like datasheet view that allows users to:
- View raw database tables in a spreadsheet grid
- Edit multiple rows quickly (bulk editing)
- Add/delete rows directly
- Filter, sort, and search within tables
- See changes from other users in near real-time

**Target Tables for Datasheet View:**
| Table | Primary Use Case |
|-------|-----------------|
| `projects` | Manage deals/acquisitions |
| `relationships` | Manage loan groups within projects |
| `loans` | Bulk update loan balances, rates, status |
| `borrowers` | Quick credit score updates, address changes |
| `borrower_loans` | Manage borrower-loan relationships with roles |
| `collateral` | Mass property value updates |
| `collateral_loans` | Manage collateral-loan links with lien positions |
| `payments` | Bulk payment entry (YYYYMM format) |
| `cash_flows` | View/edit monthly projection data |
| `bpo_title_ucc` | Manage BPO, Title, and UCC records |
| `projections` | Projection settings per loan |
| `comments` | Review/edit notes and documentation |

---

### 6.2 UI Design

**Tab Structure:**
```
[Projects] [Loans] [Borrowers] [Collateral] [PayHist] [Comments] [Projections] [📊 Tables]
```

**Tables Tab Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Table: [loans ▼]          Filter: [___________] 🔍    [+ Add Row] [🗑 Delete]│
├─────────────────────────────────────────────────────────────────────────────┤
│   │ mw_loan_no │ borrower    │ principal  │ interest │ rate  │ status │ ▲ │
│───┼────────────┼─────────────┼────────────┼──────────┼───────┼────────┼───│
│ 1 │ 2461       │ Smith LLC   │ 125,000.00 │ 1,250.00 │ 7.50  │ Active │   │
│ 2 │ 5091       │ Jones Inc   │  85,000.00 │   425.00 │ 8.00  │ Active │   │
│ 3 │ 7758       │ Blaze Rest  │  21,505.00 │   108.72 │ 8.50  │ PA     │   │
│ 4 │ *          │             │            │          │       │        │ ▼ │
├─────────────────────────────────────────────────────────────────────────────┤
│ Showing 3 of 3 rows │ Last synced: 10:45:23 AM │ [↻ Refresh] [💾 Save All] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 6.3 Inline Cell Editing

**Edit Behavior (Like Access):**
1. Click cell → Edit mode (text highlighted)
2. Type to replace OR F2/double-click to position cursor
3. Tab → Move to next cell (save current)
4. Enter → Move down (save current)
5. Escape → Cancel edit, revert to original
6. Arrow keys → Navigate (with auto-save on leave)

**Cell Types by Column:**
| Type | Behavior | Example |
|------|----------|---------|
| Text | Free input | Borrower name |
| Number | Numeric only, auto-format | Principal balance |
| Currency | `$` prefix, 2 decimals | `$125,000.00` |
| Date | Date picker on click | `12/15/2024` |
| Dropdown | Select from list | Status: Active, PA, FC |
| Checkbox | Toggle on click | `☑` / `☐` |

**React Implementation:**
```jsx
const DatasheetCell = ({ value, type, onChange, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleBlur = () => {
    setEditing(false);
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
      // Move to next row
    } else if (e.key === 'Tab') {
      handleBlur();
      // Move to next column
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className="cell">
        {formatValue(value, type)}
      </div>
    );
  }

  return (
    <input
      autoFocus
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="cell-input"
    />
  );
};
```

---

### 6.4 Bulk Operations

**Multi-Select Rows:**
- Click row number to select entire row
- Shift+Click to select range
- Ctrl+Click to add to selection
- Ctrl+A to select all

**Bulk Actions:**
```jsx
<div className="bulk-actions">
  <button onClick={deleteSelected}>Delete Selected ({selectedCount})</button>
  <button onClick={() => setShowBulkEdit(true)}>Edit Selected</button>
  <button onClick={exportSelected}>Export to CSV</button>
</div>
```

**Bulk Edit Dialog:**
```
┌─────────────────────────────────────────────┐
│ Edit 5 Selected Loans                       │
├─────────────────────────────────────────────┤
│ Field: [status ▼]                           │
│ New Value: [Active ▼]                       │
│                                             │
│ ☐ Only update if currently blank            │
│                                             │
│ [Cancel]                    [Apply to All]  │
└─────────────────────────────────────────────┘
```

---

### 6.5 Multi-User Concurrency

**Since multiple users rarely edit the same relationship:**

**Optimistic Locking Strategy:**
```sql
-- Each table has a version column
ALTER TABLE loans ADD COLUMN version INTEGER DEFAULT 1;

-- Before update, check version hasn't changed
UPDATE loans
SET principal_balance = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND version = ?;

-- If 0 rows affected → someone else modified it
```

**Conflict Resolution UI:**
```
┌─────────────────────────────────────────────┐
│ ⚠️ Conflict Detected                        │
├─────────────────────────────────────────────┤
│ Loan #2461 was modified by another user.    │
│                                             │
│ Your value:    $125,000.00                  │
│ Current value: $124,500.00                  │
│ Changed by:    jsmith @ 10:47 AM            │
│                                             │
│ [Keep Mine] [Use Theirs] [View Difference]  │
└─────────────────────────────────────────────┘
```

**Auto-Refresh (Polling):**
```javascript
// Poll for changes every 30 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const serverData = await window.electronAPI.tables.getAll(tableName);
    // Compare with local data, highlight changed rows
    const changedRows = findChangedRows(localData, serverData);
    if (changedRows.length > 0) {
      setHighlightedRows(changedRows);
      showNotification(`${changedRows.length} rows updated by other users`);
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [tableName]);
```

---

### 6.6 Payment History YYYYMM Format

**Current Format (Needs Migration):**
```javascript
// Current: separate year/month columns
{ loanNo: '2461', year: '2025', month: '4', amount: '3522.00' }
```

**New Format for SQL:**
```sql
-- YYYYMM integer format
INSERT INTO payments (loan_id, payment_date, amount)
VALUES (123, 202504, 3522.00);  -- April 2025

-- Easy queries
SELECT * FROM payments WHERE payment_date BETWEEN 202401 AND 202412;  -- All 2024
SELECT * FROM payments WHERE payment_date >= 202410;  -- Oct 2024 onwards
```

**Datasheet Display for Payments:**
```
┌───────────────────────────────────────────────────────────────────────────┐
│ Table: payments     Loan Filter: [All ▼]    Year: [2024 ▼]               │
├───────────────────────────────────────────────────────────────────────────┤
│   │ loan_no │ Jan      │ Feb      │ Mar      │ ... │ Dec      │ Total    │
│───┼─────────┼──────────┼──────────┼──────────┼─────┼──────────┼──────────│
│ 1 │ 2461    │ 3,522.00 │ 3,522.00 │ 3,522.00 │ ... │ 3,522.00 │42,264.00 │
│ 2 │ 5091    │ 1,250.00 │ 1,250.00 │ 1,250.00 │ ... │ 1,250.00 │15,000.00 │
│ 3 │ 7758    │   608.15 │   608.15 │   608.15 │ ... │   608.15 │ 7,297.80 │
├───────────────────────────────────────────────────────────────────────────┤
│ Totals     │ 5,380.15 │ 5,380.15 │ 5,380.15 │ ... │ 5,380.15 │64,561.80 │
└───────────────────────────────────────────────────────────────────────────┘
```

**Pivot Query for Grid Display:**
```sql
SELECT
    l.mw_loan_no,
    SUM(CASE WHEN p.payment_date % 100 = 1 THEN p.amount ELSE 0 END) as jan,
    SUM(CASE WHEN p.payment_date % 100 = 2 THEN p.amount ELSE 0 END) as feb,
    -- ... (3-12)
    SUM(p.amount) as total
FROM loans l
LEFT JOIN payments p ON l.id = p.loan_id
    AND p.payment_date >= ? AND p.payment_date <= ?
GROUP BY l.id, l.mw_loan_no
ORDER BY l.mw_loan_no;
```

---

### 6.7 Table Configuration

**Column Visibility & Order:**
```jsx
// User can customize which columns to show
const [visibleColumns, setVisibleColumns] = useState([
  'mw_loan_no', 'borrowerName', 'principal', 'interest', 'rate', 'status'
]);

// Column order can be changed by drag-and-drop
const [columnOrder, setColumnOrder] = useState([...visibleColumns]);
```

**Column Settings Dialog:**
```
┌─────────────────────────────────────────────┐
│ Configure Columns                           │
├─────────────────────────────────────────────┤
│ ☑ mw_loan_no        [↑] [↓]                │
│ ☑ borrowerName      [↑] [↓]                │
│ ☑ principal         [↑] [↓]                │
│ ☑ interest          [↑] [↓]                │
│ ☐ escrow            [↑] [↓]                │
│ ☑ rate              [↑] [↓]                │
│ ☐ maturity_date     [↑] [↓]                │
│ ☑ status            [↑] [↓]                │
│                                             │
│ [Reset to Default]           [Apply]        │
└─────────────────────────────────────────────┘
```

---

### 6.8 Filtering & Sorting

**Quick Filter (per column):**
```jsx
// Click column header → Sort asc/desc
// Click filter icon → Show filter dropdown

<th onClick={() => toggleSort('principal')}>
  Principal {sortField === 'principal' && (sortDir === 'asc' ? '↑' : '↓')}
  <button onClick={() => openFilter('principal')}>🔽</button>
</th>

// Filter dropdown
<div className="filter-dropdown">
  <input placeholder="Filter..." value={filters.principal} onChange={...} />
  <div className="filter-options">
    <label><input type="radio" /> Equals</label>
    <label><input type="radio" /> Greater than</label>
    <label><input type="radio" /> Less than</label>
    <label><input type="radio" /> Between</label>
  </div>
</div>
```

**SQL Query Building:**
```javascript
const buildQuery = (tableName, filters, sort, pagination) => {
  let sql = `SELECT * FROM ${tableName}`;
  const params = [];

  // WHERE clauses
  const whereConditions = Object.entries(filters)
    .filter(([_, v]) => v.value)
    .map(([field, filter]) => {
      params.push(filter.value);
      switch (filter.operator) {
        case 'equals': return `${field} = ?`;
        case 'gt': return `${field} > ?`;
        case 'lt': return `${field} < ?`;
        case 'contains': return `${field} LIKE '%' || ? || '%'`;
      }
    });

  if (whereConditions.length) {
    sql += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  // ORDER BY
  if (sort.field) {
    sql += ` ORDER BY ${sort.field} ${sort.direction}`;
  }

  // LIMIT/OFFSET for pagination
  sql += ` LIMIT ? OFFSET ?`;
  params.push(pagination.pageSize, pagination.page * pagination.pageSize);

  return { sql, params };
};
```

---

### 6.9 Add/Delete Rows

**Add New Row:**
```jsx
// New row appears at bottom with asterisk (*)
// User fills in required fields
// Row is inserted when user moves to another row

const handleNewRowBlur = async (rowData) => {
  if (hasRequiredFields(rowData)) {
    const newId = await window.electronAPI.tables.insert(tableName, rowData);
    setRows([...rows.slice(0, -1), { ...rowData, id: newId }, { isNew: true }]);
  }
};
```

**Delete Row:**
```jsx
// Select row(s) → Click Delete → Confirm
const handleDelete = async () => {
  if (selectedRows.length === 0) return;

  const confirmed = await showConfirm(
    `Delete ${selectedRows.length} row(s)?`,
    'This action cannot be undone.'
  );

  if (confirmed) {
    await window.electronAPI.tables.deleteMany(tableName, selectedRows);
    setRows(rows.filter(r => !selectedRows.includes(r.id)));
    setSelectedRows([]);
  }
};
```

---

### 6.10 Database Repository for Tables View

```typescript
// src/database/repositories/TableRepository.ts

export class TableRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // Get table metadata (columns, types)
  getTableSchema(tableName: string): ColumnDef[] {
    const stmt = this.db.prepare(`PRAGMA table_info(${tableName})`);
    return stmt.all().map(col => ({
      name: col.name,
      type: col.type,
      nullable: !col.notnull,
      primaryKey: col.pk === 1,
      defaultValue: col.dflt_value
    }));
  }

  // Get all rows with filtering, sorting, pagination
  getRows(tableName: string, options: QueryOptions): { rows: any[], total: number } {
    const { filters, sort, page, pageSize } = options;
    const { sql, params } = this.buildQuery(tableName, filters, sort);

    // Get total count
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const total = this.db.prepare(countSql).get(...params.slice(0, -2)).count;

    // Get paginated rows
    const rows = this.db.prepare(sql).all(...params);

    return { rows, total };
  }

  // Update single cell
  updateCell(tableName: string, id: number, field: string, value: any, version: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE ${tableName}
      SET ${field} = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND version = ?
    `);

    const result = stmt.run(value, id, version);
    return result.changes > 0;  // false if version conflict
  }

  // Insert new row
  insertRow(tableName: string, data: Record<string, any>): number {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');

    const stmt = this.db.prepare(`
      INSERT INTO ${tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `);

    const result = stmt.run(...Object.values(data));
    return result.lastInsertRowid as number;
  }

  // Delete rows
  deleteRows(tableName: string, ids: number[]): number {
    const placeholders = ids.map(() => '?').join(', ');
    const stmt = this.db.prepare(`DELETE FROM ${tableName} WHERE id IN (${placeholders})`);
    const result = stmt.run(...ids);
    return result.changes;
  }

  // Bulk update
  bulkUpdate(tableName: string, ids: number[], field: string, value: any): number {
    const placeholders = ids.map(() => '?').join(', ');
    const stmt = this.db.prepare(`
      UPDATE ${tableName}
      SET ${field} = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `);
    const result = stmt.run(value, ...ids);
    return result.changes;
  }
}
```

---

### 6.11 IPC Handlers for Tables

```typescript
// electron/main.ts - Add table handlers

const tableRepo = new TableRepository(db);

// Get table schema
ipcMain.handle('tables:getSchema', (_, tableName: string) => {
  return tableRepo.getTableSchema(tableName);
});

// Get rows with options
ipcMain.handle('tables:getRows', (_, tableName: string, options: QueryOptions) => {
  return tableRepo.getRows(tableName, options);
});

// Update single cell (with optimistic locking)
ipcMain.handle('tables:updateCell', (_, tableName: string, id: number, field: string, value: any, version: number) => {
  return tableRepo.updateCell(tableName, id, field, value, version);
});

// Insert row
ipcMain.handle('tables:insertRow', (_, tableName: string, data: Record<string, any>) => {
  return tableRepo.insertRow(tableName, data);
});

// Delete rows
ipcMain.handle('tables:deleteRows', (_, tableName: string, ids: number[]) => {
  return tableRepo.deleteRows(tableName, ids);
});

// Bulk update
ipcMain.handle('tables:bulkUpdate', (_, tableName: string, ids: number[], field: string, value: any) => {
  return tableRepo.bulkUpdate(tableName, ids, field, value);
});
```

---

### 6.12 Access Comparison

| Access Feature | Our Implementation |
|---------------|-------------------|
| Datasheet View | ✅ Grid with editable cells |
| Form View | ✅ Existing tab-based UI |
| Relationships | ✅ SQL foreign keys |
| Filters | ✅ Per-column filtering |
| Sorting | ✅ Click column headers |
| Add Row | ✅ New row at bottom |
| Delete Row | ✅ Select + Delete |
| Multi-Select | ✅ Shift/Ctrl+Click |
| Find & Replace | 🔜 Future enhancement |
| Freeze Columns | 🔜 Future enhancement |
| Query Designer | ❌ Not planned (use SQL directly) |

---

### 6.13 Interest Calculation Validation

**Confirmed: `rate / 12` is correct for simple monthly interest.**

```javascript
// Monthly interest calculation (validated)
const monthlyInterest = principal * (annualRate / 100 / 12);

// Example:
// Principal: $100,000
// Annual Rate: 8%
// Monthly Interest: $100,000 × (8 / 100 / 12) = $666.67
```

This is the standard method for:
- Simple interest loans
- Interest-only payment calculation
- Negative amortization detection
- Trailing payment vs. interest comparison

---

*Document updated with Database Tables View specification on November 26, 2025*
