-- ============================================================
-- MidwestDD Database Schema
-- SQL Server CREATE TABLE scripts matching the React GUI types
--
-- Connection: DSN=sqlDueDiligence; DATABASE=MidwestDD
-- Auth: Trusted_Connection (Windows Authentication)
--
-- Run this script in SQL Server Management Studio or
-- any tool connected to MidwestDD to create the tables.
-- ============================================================

USE MidwestDD;
GO

-- ============================================================
-- CORE TABLES
-- ============================================================

-- ------------------------------------------------------------
-- tblRelationships
-- Relationship-level record (one per loan group)
-- Maps to: currentRelationship in React context
-- Flags visible on Overview tab header
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRelationships')
CREATE TABLE tblRelationships (
    RelationshipID      INT IDENTITY(1,1) PRIMARY KEY,
    RelatedLoans        NVARCHAR(100)   NOT NULL,           -- e.g. 'Haskell'
    ExitCode            NVARCHAR(20)    NULL,
    InBankruptcy        BIT             NOT NULL DEFAULT 0,
    ForeclosureFlag     BIT             NOT NULL DEFAULT 0,
    LitigationFlag      BIT             NOT NULL DEFAULT 0,
    ForbearanceFlag     BIT             NOT NULL DEFAULT 0,
    JudgmentFlag        BIT             NOT NULL DEFAULT 0,
    LowYieldAsset       BIT             NOT NULL DEFAULT 0,
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- tblLoan
-- One record per loan
-- Maps to: Loan interface in types/index.ts
-- Primary key: MWLoanNo
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblLoan')
CREATE TABLE tblLoan (
    MWLoanNo            NVARCHAR(20)    NOT NULL PRIMARY KEY,
    RelatedLoans        NVARCHAR(100)   NOT NULL,           -- FK to tblRelationships.RelatedLoans
    BorrowerName        NVARCHAR(200)   NULL,
    OrigBalance         DECIMAL(18,2)   NULL DEFAULT 0,
    Principal           DECIMAL(18,2)   NULL DEFAULT 0,
    Interest            DECIMAL(18,2)   NULL DEFAULT 0,
    EscrowBalance       DECIMAL(18,2)   NULL DEFAULT 0,
    OtherBalance        DECIMAL(18,2)   NULL DEFAULT 0,
    IntRate             DECIMAL(8,4)    NULL DEFAULT 0,     -- e.g. 4.7500
    DRate               DECIMAL(8,4)    NULL DEFAULT 0,     -- Default rate
    Pmt                 DECIMAL(18,2)   NULL DEFAULT 0,     -- Monthly payment
    EscPmt              DECIMAL(18,2)   NULL DEFAULT 0,     -- Escrow payment
    PmtFreq             NVARCHAR(5)     NULL DEFAULT 'M',   -- M=Monthly, Q=Quarterly, etc.
    NotDue              NVARCHAR(20)    NULL,                -- Next due date (MM/DD/YY)
    LastPmt             NVARCHAR(20)    NULL,                -- Last payment date
    OrigDt              NVARCHAR(20)    NULL,                -- Origination date
    MatDt               NVARCHAR(20)    NULL,                -- Maturity date
    AccDt               NVARCHAR(20)    NULL,                -- Accrual date
    DueDt               NVARCHAR(20)    NULL,                -- Due date
    LastPdt             NVARCHAR(20)    NULL,                -- Last paid-to date
    Status              NVARCHAR(10)    NULL DEFAULT '',     -- PA, FA, FC, JG, LT, or empty
    Change              DECIMAL(8,2)    NULL DEFAULT 0,      -- % change
    LastImportDate      NVARCHAR(20)    NULL,
    Pool                NVARCHAR(20)    NULL,
    Address1            NVARCHAR(200)   NULL,
    Address2            NVARCHAR(200)   NULL,
    City                NVARCHAR(100)   NULL,
    State               NVARCHAR(5)     NULL,
    Zip                 NVARCHAR(20)    NULL,
    RateType            NVARCHAR(20)    NULL DEFAULT 'Fixed', -- Fixed, Variable, Adjustable
    Floor               NVARCHAR(20)    NULL,
    Ceiling             NVARCHAR(20)    NULL,
    Margin              NVARCHAR(20)    NULL,
    ChDt                NVARCHAR(20)    NULL,                -- Rate change date
    ChFrq               NVARCHAR(20)    NULL,                -- Rate change frequency
    RateIndex           NVARCHAR(50)    NULL,
    AhBhd               NVARCHAR(20)    NULL,                -- e.g. '#Typed'
    AssetType           NVARCHAR(50)    NULL,                -- Commercial RE, Residential, etc.
    UnfundedCommitment  NVARCHAR(50)    NULL,
    Selected            BIT             NULL DEFAULT 0,
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- tblBorrowers
-- One record per borrower/guarantor
-- Maps to: Borrower interface in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblBorrowers')
CREATE TABLE tblBorrowers (
    BorrowerID          INT IDENTITY(1,1) PRIMARY KEY,
    Relationship        NVARCHAR(100)   NOT NULL,           -- FK to tblRelationships.RelatedLoans
    BorrName            NVARCHAR(200)   NOT NULL,
    Address1            NVARCHAR(200)   NULL,
    Address2            NVARCHAR(200)   NULL,
    City                NVARCHAR(100)   NULL,
    State               NVARCHAR(5)     NULL,
    Zip                 NVARCHAR(20)    NULL,
    Phone               NVARCHAR(30)    NULL,
    DOB                 NVARCHAR(20)    NULL,                -- MM/DD/YYYY format
    SSN_EIN             NVARCHAR(20)    NULL,                -- SSN or EIN (encrypted in prod)
    CreditScore         NVARCHAR(10)    NULL,
    CreditScoreDate     NVARCHAR(20)    NULL,
    BKStatus            NVARCHAR(20)    NULL DEFAULT 'none', -- none, active, discharged, dismissed
    BKChapter           NVARCHAR(10)    NULL,
    BKCourtCase         NVARCHAR(50)    NULL,
    BKCourtLocation     NVARCHAR(100)   NULL,
    BKAssets            NVARCHAR(100)   NULL,
    BorrowerType        NVARCHAR(20)    NOT NULL DEFAULT 'Borrower', -- Borrower or Guarantor
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- tblBorrowerLoanRelationships
-- Junction table: which borrowers are linked to which loans
-- Maps to: Borrower.loanRelationships in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblBorrowerLoanRelationships')
CREATE TABLE tblBorrowerLoanRelationships (
    ID                  INT IDENTITY(1,1) PRIMARY KEY,
    BorrowerID          INT             NOT NULL,           -- FK to tblBorrowers
    MWLoanNo            NVARCHAR(20)    NOT NULL,           -- FK to tblLoan
    Selected            BIT             NOT NULL DEFAULT 0,
    Role                NVARCHAR(20)    NOT NULL DEFAULT 'Borrower', -- Borrower or Guarantor
    CONSTRAINT FK_BLR_Borrower FOREIGN KEY (BorrowerID) REFERENCES tblBorrowers(BorrowerID),
    CONSTRAINT FK_BLR_Loan FOREIGN KEY (MWLoanNo) REFERENCES tblLoan(MWLoanNo),
    CONSTRAINT UQ_BLR UNIQUE (BorrowerID, MWLoanNo)
);
GO

-- ------------------------------------------------------------
-- CollateralInfo
-- One record per collateral item
-- Maps to: Collateral interface in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CollateralInfo')
CREATE TABLE CollateralInfo (
    CollateralID        INT IDENTITY(1,1) PRIMARY KEY,
    LoanNo              NVARCHAR(20)    NULL,               -- Primary linked loan
    CollateralCode      NVARCHAR(50)    NULL,               -- e.g. 'Commercial Property'
    Description         NVARCHAR(200)   NULL,
    Address1            NVARCHAR(200)   NULL,
    City                NVARCHAR(100)   NULL,
    State               NVARCHAR(5)     NULL,
    Zip                 NVARCHAR(20)    NULL,
    County              NVARCHAR(100)   NULL,
    ParcelID            NVARCHAR(50)    NULL,
    Taxes               NVARCHAR(50)    NULL,               -- Annual taxes (e.g. '12,500')
    DelinquentTaxes     NVARCHAR(50)    NULL DEFAULT '0',
    TaxAssessedValue    NVARCHAR(50)    NULL,
    TaxMarketValue      NVARCHAR(50)    NULL,
    SellerLienPosition  NVARCHAR(10)    NULL,
    SellerLienAmount    NVARCHAR(50)    NULL,
    TitleLienPosition   NVARCHAR(10)    NULL,
    TitleLienAmount     NVARCHAR(50)    NULL,
    ListPrice           NVARCHAR(50)    NULL,
    DaysOnMarket        NVARCHAR(20)    NULL,
    AppraisedValue      NVARCHAR(50)    NULL,
    AppraisedDate       NVARCHAR(20)    NULL,
    OurValue            NVARCHAR(50)    NULL,
    OurValueDate        NVARCHAR(20)    NULL,
    BPOValue            NVARCHAR(50)    NULL,
    BPODate             NVARCHAR(20)    NULL,
    SqFt                NVARCHAR(20)    NULL,
    Acres               NVARCHAR(20)    NULL,
    YearBuilt           NVARCHAR(10)    NULL,
    Units               NVARCHAR(10)    NULL,
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- tblCollateralLoanRelationships
-- Junction table: which collateral items are linked to which loans
-- Maps to: CollateralLoanRelationships in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblCollateralLoanRelationships')
CREATE TABLE tblCollateralLoanRelationships (
    ID                  INT IDENTITY(1,1) PRIMARY KEY,
    CollateralID        INT             NOT NULL,           -- FK to CollateralInfo
    MWLoanNo            NVARCHAR(20)    NOT NULL,           -- FK to tblLoan
    Linked              BIT             NOT NULL DEFAULT 1,
    CONSTRAINT FK_CLR_Collateral FOREIGN KEY (CollateralID) REFERENCES CollateralInfo(CollateralID),
    CONSTRAINT FK_CLR_Loan FOREIGN KEY (MWLoanNo) REFERENCES tblLoan(MWLoanNo),
    CONSTRAINT UQ_CLR UNIQUE (CollateralID, MWLoanNo)
);
GO

-- ------------------------------------------------------------
-- tblComments
-- One record per comment
-- Maps to: Comment interface in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblComments')
CREATE TABLE tblComments (
    CommentID           INT IDENTITY(1,1) PRIMARY KEY,
    MWLoanNo            NVARCHAR(20)    NOT NULL,           -- FK to tblLoan
    CommentType         NVARCHAR(30)    NOT NULL DEFAULT 'Note', -- Note, Legal, Underwriting, Property, Servicing, Collection, Other
    CommentDate         NVARCHAR(20)    NULL,                -- MM/DD/YY format
    CommentText         NVARCHAR(MAX)   NULL,
    CONSTRAINT FK_Comments_Loan FOREIGN KEY (MWLoanNo) REFERENCES tblLoan(MWLoanNo),
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- tblPayHistory
-- One record per payment entry
-- Maps to: PaymentRecord interface in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPayHistory')
CREATE TABLE tblPayHistory (
    PaymentID           INT IDENTITY(1,1) PRIMARY KEY,
    MWLoanNo            NVARCHAR(20)    NOT NULL,           -- FK to tblLoan
    PaymentYear         NVARCHAR(10)    NOT NULL,           -- e.g. '2025'
    PaymentMonth        NVARCHAR(5)     NOT NULL,           -- e.g. '4' (April)
    Amount              NVARCHAR(50)    NOT NULL DEFAULT '0', -- e.g. '3522.00'
    CONSTRAINT FK_PayHistory_Loan FOREIGN KEY (MWLoanNo) REFERENCES tblLoan(MWLoanNo),
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- PROJECTION / BID TABLES
-- ============================================================

-- ------------------------------------------------------------
-- tblProjectionSettings
-- Per-loan projection configuration
-- Maps to: ProjectionSettings interface in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblProjectionSettings')
CREATE TABLE tblProjectionSettings (
    SettingsID          INT IDENTITY(1,1) PRIMARY KEY,
    MWLoanNo            NVARCHAR(20)    NOT NULL,           -- FK to tblLoan
    PaymentMethod       NVARCHAR(30)    NOT NULL DEFAULT 'Contractual', -- User Enter, Contractual, Term Pmt, Interest Payment, % of Trail Pmt
    RateMethod          NVARCHAR(20)    NOT NULL DEFAULT 'Contractual', -- Contractual, User Enter
    UserPayment         NVARCHAR(50)    NULL,
    UserRate            NVARCHAR(50)    NULL,
    AmortMonths         NVARCHAR(10)    NULL DEFAULT '360',
    TrailPeriod         NVARCHAR(10)    NULL DEFAULT '12',
    TrailPercentage     NVARCHAR(10)    NULL DEFAULT '100',
    InitialLegal        NVARCHAR(50)    NULL,
    InitialLegalStartMonth NVARCHAR(10) NULL DEFAULT '1',
    HoldingCosts        NVARCHAR(50)    NULL,
    HoldingCostsEndMonth NVARCHAR(10)   NULL DEFAULT '12',
    AddBackPercentage   NVARCHAR(10)    NULL DEFAULT '0',
    AddBackBasis        NVARCHAR(30)    NULL DEFAULT 'Initial Only', -- Initial Only, Initial + Holding
    CONSTRAINT FK_ProjSettings_Loan FOREIGN KEY (MWLoanNo) REFERENCES tblLoan(MWLoanNo),
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- tblExitSettings
-- Per-loan exit strategy configuration
-- Maps to: ExitSettings interface in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblExitSettings')
CREATE TABLE tblExitSettings (
    SettingsID          INT IDENTITY(1,1) PRIMARY KEY,
    MWLoanNo            NVARCHAR(20)    NOT NULL,           -- FK to tblLoan
    ExitMethod          NVARCHAR(30)    NOT NULL DEFAULT 'Pay in Full', -- Pay in Full, DPO, Value Cap, User Enter, YTM Sell Solve, Liquidation
    StartMonth          NVARCHAR(10)    NULL DEFAULT '1',
    EndMonth            NVARCHAR(10)    NULL DEFAULT '24',
    DPOPercentage       NVARCHAR(10)    NULL DEFAULT '95',
    ValueCapPercentage  NVARCHAR(10)    NULL DEFAULT '90',
    UserEnterAmount     NVARCHAR(50)    NULL,
    YTMDesired          NVARCHAR(10)    NULL DEFAULT '12',
    LiquidationMonths   NVARCHAR(10)    NULL DEFAULT '12',
    LiquidationAddInterest BIT          NULL DEFAULT 0,
    CONSTRAINT FK_ExitSettings_Loan FOREIGN KEY (MWLoanNo) REFERENCES tblLoan(MWLoanNo),
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- tblCashFlowProjections
-- Projection header / metadata
-- Maps to: CashFlowProjection interface in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblCashFlowProjections')
CREATE TABLE tblCashFlowProjections (
    ProjectionID        INT IDENTITY(1,1) PRIMARY KEY,
    MWLoanNo            NVARCHAR(20)    NOT NULL,           -- FK to tblLoan
    Mode                NVARCHAR(10)    NOT NULL DEFAULT 'modern', -- modern, classic
    DiscountRate        DECIMAL(8,4)    NULL DEFAULT 0,
    StartMonth          INT             NULL DEFAULT 1,
    EndMonth            INT             NULL DEFAULT 24,
    ProjectionSettingsID INT            NULL,                -- FK to tblProjectionSettings
    ExitSettingsID      INT             NULL,                -- FK to tblExitSettings
    CONSTRAINT FK_CFP_Loan FOREIGN KEY (MWLoanNo) REFERENCES tblLoan(MWLoanNo),
    CONSTRAINT FK_CFP_ProjSettings FOREIGN KEY (ProjectionSettingsID) REFERENCES tblProjectionSettings(SettingsID),
    CONSTRAINT FK_CFP_ExitSettings FOREIGN KEY (ExitSettingsID) REFERENCES tblExitSettings(SettingsID),
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- tblCashFlowRecords
-- Individual monthly cash flow entries
-- Maps to: CashFlowRecord interface in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblCashFlowRecords')
CREATE TABLE tblCashFlowRecords (
    RecordID            INT IDENTITY(1,1) PRIMARY KEY,
    MWLoanNo            NVARCHAR(20)    NOT NULL,           -- FK to tblLoan
    ProjectionID        INT             NOT NULL,           -- FK to tblCashFlowProjections
    Year                INT             NOT NULL,           -- Calendar year (e.g. 2025)
    Month               INT             NOT NULL,           -- Calendar month (1-12)
    ProjectionMonth     INT             NOT NULL,           -- Projection month (1-60)
    CashFlowType        NVARCHAR(10)    NOT NULL,           -- income, expense, net
    Amount              DECIMAL(18,2)   NOT NULL DEFAULT 0,
    CONSTRAINT FK_CFR_Loan FOREIGN KEY (MWLoanNo) REFERENCES tblLoan(MWLoanNo),
    CONSTRAINT FK_CFR_Projection FOREIGN KEY (ProjectionID) REFERENCES tblCashFlowProjections(ProjectionID),
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- tblBidStatistics
-- Snapshot of bid calculations
-- Maps to: BidStatisticsRecord interface in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblBidStatistics')
CREATE TABLE tblBidStatistics (
    BidStatID           INT IDENTITY(1,1) PRIMARY KEY,
    MWLoanNo            NVARCHAR(20)    NOT NULL,           -- FK to tblLoan
    ProjectionID        INT             NOT NULL,           -- FK to tblCashFlowProjections
    BidPrice            DECIMAL(18,2)   NULL DEFAULT 0,     -- NPV of net cash flows
    BidPercentage       DECIMAL(8,4)    NULL DEFAULT 0,     -- Bid / UPB * 100
    MOIC                DECIMAL(8,4)    NULL DEFAULT 0,     -- Sum NCF / UPB
    CashYield           DECIMAL(8,4)    NULL DEFAULT 0,     -- F12 NCF / Bid * 100
    F12CashFlow         DECIMAL(18,2)   NULL DEFAULT 0,     -- Forward 12 months
    P12CashFlow         DECIMAL(18,2)   NULL DEFAULT 0,     -- Prior 12 months
    F12vsP12Change      DECIMAL(8,4)    NULL DEFAULT 0,     -- % change
    BidToCollateralPct  DECIMAL(8,4)    NULL DEFAULT 0,     -- Bid / Collateral * 100
    YTM_IRR             DECIMAL(8,4)    NULL DEFAULT 0,     -- Yield to maturity (IRR)
    YTM_XIRR            DECIMAL(8,4)    NULL DEFAULT 0,     -- Yield to maturity (XIRR)
    TotalExitProceeds   DECIMAL(18,2)   NULL DEFAULT 0,
    UPBAtBid            DECIMAL(18,2)   NULL DEFAULT 0,
    CollateralValueAtBid DECIMAL(18,2)  NULL DEFAULT 0,
    CONSTRAINT FK_BidStats_Loan FOREIGN KEY (MWLoanNo) REFERENCES tblLoan(MWLoanNo),
    CONSTRAINT FK_BidStats_Projection FOREIGN KEY (ProjectionID) REFERENCES tblCashFlowProjections(ProjectionID),
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ------------------------------------------------------------
-- tblProjectionSummaries
-- Aggregated projection totals
-- Maps to: ProjectionSummary interface in types/index.ts
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblProjectionSummaries')
CREATE TABLE tblProjectionSummaries (
    SummaryID           INT IDENTITY(1,1) PRIMARY KEY,
    MWLoanNo            NVARCHAR(20)    NOT NULL,           -- FK to tblLoan
    ProjectionID        INT             NOT NULL,           -- FK to tblCashFlowProjections
    TotalIncome         DECIMAL(18,2)   NULL DEFAULT 0,
    TotalExpenses       DECIMAL(18,2)   NULL DEFAULT 0,
    TotalNetCashFlow    DECIMAL(18,2)   NULL DEFAULT 0,
    Year1Income         DECIMAL(18,2)   NULL DEFAULT 0,
    Year1Expenses       DECIMAL(18,2)   NULL DEFAULT 0,
    Year1NetCashFlow    DECIMAL(18,2)   NULL DEFAULT 0,
    AvgMonthlyIncome    DECIMAL(18,2)   NULL DEFAULT 0,
    AvgMonthlyExpense   DECIMAL(18,2)   NULL DEFAULT 0,
    AvgMonthlyNCF       DECIMAL(18,2)   NULL DEFAULT 0,
    CONSTRAINT FK_ProjSummary_Loan FOREIGN KEY (MWLoanNo) REFERENCES tblLoan(MWLoanNo),
    CONSTRAINT FK_ProjSummary_Projection FOREIGN KEY (ProjectionID) REFERENCES tblCashFlowProjections(ProjectionID),
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- LOOKUP TABLES
-- ============================================================

-- ------------------------------------------------------------
-- lkpLoanStatus
-- Valid loan status codes
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'lkpLoanStatus')
CREATE TABLE lkpLoanStatus (
    StatusCode          NVARCHAR(10)    PRIMARY KEY,
    StatusName          NVARCHAR(50)    NOT NULL,
    DisplayOrder        INT             NULL
);
GO

INSERT INTO lkpLoanStatus (StatusCode, StatusName, DisplayOrder) VALUES
    ('', 'Active', 1),
    ('PA', 'Performing', 2),
    ('FA', 'Forbearance', 3),
    ('FC', 'Foreclosure', 4),
    ('JG', 'Judgment', 5),
    ('LT', 'Litigation', 6);
GO

-- ------------------------------------------------------------
-- lkpCommentTypes
-- Valid comment type values
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'lkpCommentTypes')
CREATE TABLE lkpCommentTypes (
    CommentType         NVARCHAR(30)    PRIMARY KEY,
    DisplayOrder        INT             NULL
);
GO

INSERT INTO lkpCommentTypes (CommentType, DisplayOrder) VALUES
    ('Note', 1),
    ('Legal', 2),
    ('Underwriting', 3),
    ('Property', 4),
    ('Servicing', 5),
    ('Collection', 6),
    ('Other', 7);
GO

-- ------------------------------------------------------------
-- lkpAssetTypes
-- Valid asset type values
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'lkpAssetTypes')
CREATE TABLE lkpAssetTypes (
    AssetType           NVARCHAR(50)    PRIMARY KEY,
    DisplayOrder        INT             NULL
);
GO

INSERT INTO lkpAssetTypes (AssetType, DisplayOrder) VALUES
    ('Commercial RE', 1),
    ('Multi-family', 2),
    ('Residential', 3),
    ('Land', 4),
    ('Industrial', 5),
    ('Retail', 6),
    ('Office', 7),
    ('Mixed Use', 8),
    ('Special Purpose', 9);
GO

-- ------------------------------------------------------------
-- lkpRateTypes
-- Valid rate type values
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'lkpRateTypes')
CREATE TABLE lkpRateTypes (
    RateType            NVARCHAR(20)    PRIMARY KEY,
    DisplayOrder        INT             NULL
);
GO

INSERT INTO lkpRateTypes (RateType, DisplayOrder) VALUES
    ('Fixed', 1),
    ('Variable', 2),
    ('Adjustable', 3);
GO

-- ------------------------------------------------------------
-- lkpBKStatus
-- Valid bankruptcy status values
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'lkpBKStatus')
CREATE TABLE lkpBKStatus (
    BKStatus            NVARCHAR(20)    PRIMARY KEY,
    DisplayOrder        INT             NULL
);
GO

INSERT INTO lkpBKStatus (BKStatus, DisplayOrder) VALUES
    ('none', 1),
    ('active', 2),
    ('discharged', 3),
    ('dismissed', 4);
GO

-- ------------------------------------------------------------
-- lkpUSStates
-- US state codes and names
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'lkpUSStates')
CREATE TABLE lkpUSStates (
    StateCode           NVARCHAR(5)     PRIMARY KEY,
    StateName           NVARCHAR(50)    NOT NULL
);
GO

INSERT INTO lkpUSStates (StateCode, StateName) VALUES
    ('AL','Alabama'),('AK','Alaska'),('AZ','Arizona'),('AR','Arkansas'),
    ('CA','California'),('CO','Colorado'),('CT','Connecticut'),('DE','Delaware'),
    ('DC','District of Columbia'),('FL','Florida'),('GA','Georgia'),('HI','Hawaii'),
    ('ID','Idaho'),('IL','Illinois'),('IN','Indiana'),('IA','Iowa'),
    ('KS','Kansas'),('KY','Kentucky'),('LA','Louisiana'),('ME','Maine'),
    ('MD','Maryland'),('MA','Massachusetts'),('MI','Michigan'),('MN','Minnesota'),
    ('MS','Mississippi'),('MO','Missouri'),('MT','Montana'),('NE','Nebraska'),
    ('NV','Nevada'),('NH','New Hampshire'),('NJ','New Jersey'),('NM','New Mexico'),
    ('NY','New York'),('NC','North Carolina'),('ND','North Dakota'),('OH','Ohio'),
    ('OK','Oklahoma'),('OR','Oregon'),('PA','Pennsylvania'),('PR','Puerto Rico'),
    ('RI','Rhode Island'),('SC','South Carolina'),('SD','South Dakota'),('TN','Tennessee'),
    ('TX','Texas'),('UT','Utah'),('VT','Vermont'),('VA','Virginia'),
    ('WA','Washington'),('WV','West Virginia'),('WI','Wisconsin'),('WY','Wyoming');
GO

-- ============================================================
-- VIEWS (matching React computed data)
-- ============================================================

-- ------------------------------------------------------------
-- vwRelationshipSummary
-- Per-loan summary used by Overview tab Loan Summary table
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vwRelationshipSummary')
    DROP VIEW vwRelationshipSummary;
GO

CREATE VIEW vwRelationshipSummary AS
SELECT
    l.MWLoanNo,
    l.RelatedLoans,
    l.BorrowerName,
    l.OrigBalance,
    l.Principal      AS PrincipalBalance,
    l.Interest       AS InterestBalance,
    l.EscrowBalance,
    l.OtherBalance,
    (ISNULL(l.Principal,0) + ISNULL(l.Interest,0) + ISNULL(l.EscrowBalance,0) + ISNULL(l.OtherBalance,0)) AS PayoffBalance,
    l.IntRate        AS Rate,
    l.DRate          AS DefaultRate,
    l.Pmt            AS RepayAmt,
    l.LastPmt        AS LastPmtDt,
    l.OrigDt         AS OrgNoteDate,
    l.DueDt,
    l.MatDt          AS CurrentMaturityDate,
    l.Status,
    l.AssetType,
    l.RateType
FROM tblLoan l;
GO

-- ------------------------------------------------------------
-- vwCollateralSummary
-- Per-collateral summary used by Overview tab Collateral table
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vwCollateralSummary')
    DROP VIEW vwCollateralSummary;
GO

CREATE VIEW vwCollateralSummary AS
SELECT
    c.CollateralID,
    c.CollateralCode,
    c.Description,
    c.Address1,
    c.City,
    c.State,
    c.Zip,
    c.County,
    c.AppraisedValue    AS CurrentAppraisedValue,
    c.AppraisedDate,
    c.BPOValue          AS MaxBPO,
    c.BPODate,
    c.OurValue          AS SellerAppraisedValue,
    c.SellerLienPosition AS LienPosition,
    c.SellerLienAmount  AS SeniorLienAmount,
    c.Taxes             AS TaxAnnualAmt,
    c.TaxMarketValue,
    c.TaxAssessedValue,
    c.DelinquentTaxes   AS TaxDelinquentAmt,
    c.SqFt,
    c.Acres,
    c.YearBuilt,
    c.Units
FROM CollateralInfo c;
GO

-- ------------------------------------------------------------
-- vwBorrowerSummary
-- Per-borrower summary used by Overview tab Borrower table
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vwBorrowerSummary')
    DROP VIEW vwBorrowerSummary;
GO

CREATE VIEW vwBorrowerSummary AS
SELECT
    b.BorrowerID,
    b.BorrName,
    b.Relationship,
    b.City,
    b.State,
    b.CreditScore       AS BeaconScore,
    b.CreditScoreDate   AS BeaconDate,
    b.BKStatus,
    b.BKChapter,
    b.BorrowerType,
    b.SSN_EIN,
    b.DOB,
    b.Phone,
    CASE WHEN b.SSN_EIN LIKE '__-_______' THEN 1 ELSE 0 END AS IsBusiness
FROM tblBorrowers b;
GO

-- ============================================================
-- INDEXES
-- ============================================================

-- Loan lookups
CREATE NONCLUSTERED INDEX IX_tblLoan_RelatedLoans ON tblLoan(RelatedLoans);
CREATE NONCLUSTERED INDEX IX_tblLoan_Status ON tblLoan(Status);

-- Borrower lookups
CREATE NONCLUSTERED INDEX IX_tblBorrowers_Relationship ON tblBorrowers(Relationship);

-- Comment lookups
CREATE NONCLUSTERED INDEX IX_tblComments_LoanNo ON tblComments(MWLoanNo);
CREATE NONCLUSTERED INDEX IX_tblComments_Type ON tblComments(CommentType);

-- Payment lookups
CREATE NONCLUSTERED INDEX IX_tblPayHistory_LoanNo ON tblPayHistory(MWLoanNo);
CREATE NONCLUSTERED INDEX IX_tblPayHistory_YearMonth ON tblPayHistory(PaymentYear, PaymentMonth);

-- Junction table lookups
CREATE NONCLUSTERED INDEX IX_BLR_BorrowerID ON tblBorrowerLoanRelationships(BorrowerID);
CREATE NONCLUSTERED INDEX IX_BLR_LoanNo ON tblBorrowerLoanRelationships(MWLoanNo);
CREATE NONCLUSTERED INDEX IX_CLR_CollateralID ON tblCollateralLoanRelationships(CollateralID);
CREATE NONCLUSTERED INDEX IX_CLR_LoanNo ON tblCollateralLoanRelationships(MWLoanNo);

-- Projection/Bid lookups
CREATE NONCLUSTERED INDEX IX_tblCFR_ProjectionID ON tblCashFlowRecords(ProjectionID);
CREATE NONCLUSTERED INDEX IX_tblCFP_LoanNo ON tblCashFlowProjections(MWLoanNo);
CREATE NONCLUSTERED INDEX IX_tblBidStats_LoanNo ON tblBidStatistics(MWLoanNo);
GO

PRINT '============================================================';
PRINT 'MidwestDD schema created successfully.';
PRINT '';
PRINT 'Tables created:';
PRINT '  Core:    tblRelationships, tblLoan, tblBorrowers, CollateralInfo';
PRINT '           tblComments, tblPayHistory';
PRINT '  Junction: tblBorrowerLoanRelationships, tblCollateralLoanRelationships';
PRINT '  Projection: tblProjectionSettings, tblExitSettings';
PRINT '              tblCashFlowProjections, tblCashFlowRecords';
PRINT '              tblBidStatistics, tblProjectionSummaries';
PRINT '  Lookup:  lkpLoanStatus, lkpCommentTypes, lkpAssetTypes';
PRINT '           lkpRateTypes, lkpBKStatus, lkpUSStates';
PRINT '  Views:   vwRelationshipSummary, vwCollateralSummary, vwBorrowerSummary';
PRINT '============================================================';
GO
