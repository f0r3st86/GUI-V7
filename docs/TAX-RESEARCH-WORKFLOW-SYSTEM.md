# Tax Research Workflow System

**Created:** January 10, 2026
**Purpose:** Design a tax research system that stays current throughout a deal lifecycle

---

## Core Requirements

1. **Fresh Data** - Scrape on-demand, not from stale cache
2. **Iterative Updates** - Re-research properties as deal progresses
3. **Change Tracking** - Know when tax data has changed
4. **Manual Override** - Researcher can correct/supplement scraped data
5. **Audit Trail** - Full history of all research activity
6. **Workflow Integration** - Fits into deal underwriting process

---

## Data Freshness Model

### When to Scrape

| Trigger | Action |
|---------|--------|
| **New property added** | Auto-scrape immediately |
| **Researcher clicks "Refresh"** | Re-scrape single property |
| **Deal milestone** | Batch re-scrape all properties |
| **Data age > threshold** | Flag as stale, prompt refresh |
| **Before bid submission** | Mandatory refresh all |

### Freshness Thresholds

```typescript
const freshnessRules = {
  // How old before flagged as stale
  staleThresholdDays: {
    taxAmount: 30,           // Tax bills change annually
    delinquentAmount: 7,     // Can change with payments
    assessedValue: 90,       // Usually annual updates
    ownerInfo: 30,           // Changes with sales
    taxSaleStatus: 1         // Critical - check daily if flagged
  },

  // Mandatory refresh points
  milestoneRefresh: [
    'deal_imported',         // Initial load
    'underwriting_start',    // Beginning analysis
    'cutoff_applied',        // Final numbers
    'bid_preparation'        // Before submission
  ]
};
```

---

## Database Schema

### Tax Research Records (with History)

```sql
-- Current tax research data (latest values)
CREATE TABLE tax_research (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id),
    collateral_id INTEGER REFERENCES collateral(id),

    -- Jurisdiction reference
    state_code CHAR(2) NOT NULL,
    jurisdiction_id INTEGER REFERENCES tax_jurisdictions(id),
    jurisdiction_name VARCHAR(255),
    jurisdiction_type VARCHAR(50), -- 'county', 'town', 'city'

    -- Parcel identification
    parcel_id VARCHAR(100),
    parcel_id_alt VARCHAR(100),
    parcel_id_source VARCHAR(50), -- 'scraped', 'manual', 'imported'

    -- Property tax amounts
    annual_tax_amount DECIMAL(12,2),
    tax_year INTEGER,                    -- Which tax year this applies to
    delinquent_amount DECIMAL(12,2),
    delinquent_years TEXT,               -- e.g., "2023, 2024"

    -- Tax sale information
    tax_sale_scheduled BOOLEAN DEFAULT FALSE,
    tax_sale_date DATE,
    redemption_deadline DATE,
    tax_sale_amount DECIMAL(12,2),

    -- Assessed values
    assessed_total DECIMAL(15,2),
    assessed_land DECIMAL(15,2),
    assessed_improvement DECIMAL(15,2),
    market_value DECIMAL(15,2),
    assessment_year INTEGER,

    -- Owner info (from tax records)
    tax_owner_name VARCHAR(255),
    tax_owner_address TEXT,
    tax_mailing_address TEXT,

    -- Data source tracking
    data_source VARCHAR(50) NOT NULL,    -- 'vision', 'qpublic', 'manual', etc.
    source_url VARCHAR(500),
    last_scraped_at TIMESTAMP,
    last_verified_at TIMESTAMP,          -- Human verified
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Research status
    research_status VARCHAR(50) DEFAULT 'pending',
    -- Status: pending, scraped, verified, needs_review, flagged, complete

    -- Flags
    is_stale BOOLEAN DEFAULT FALSE,
    has_discrepancy BOOLEAN DEFAULT FALSE,
    needs_manual_review BOOLEAN DEFAULT FALSE,
    is_tax_sale_risk BOOLEAN DEFAULT FALSE,

    -- Notes
    researcher_notes TEXT,
    system_notes TEXT,                   -- Auto-generated notes

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- History of all tax research changes
CREATE TABLE tax_research_history (
    id SERIAL PRIMARY KEY,
    tax_research_id INTEGER REFERENCES tax_research(id),

    -- Snapshot of data at this point
    data_snapshot JSONB NOT NULL,

    -- What changed
    change_type VARCHAR(50) NOT NULL,
    -- Types: 'initial_scrape', 'refresh', 'manual_edit', 'verification', 'import'

    change_source VARCHAR(50),           -- 'scraper', 'user', 'import', 'api'
    change_reason TEXT,

    -- What was different
    fields_changed TEXT[],               -- Array of field names that changed
    previous_values JSONB,               -- Old values for changed fields
    new_values JSONB,                    -- New values for changed fields

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),

    -- Source info for scrapes
    scrape_source_url VARCHAR(500),
    scrape_raw_html TEXT                 -- Store raw for debugging
);

-- Index for fast history lookups
CREATE INDEX idx_tax_history_research_id ON tax_research_history(tax_research_id);
CREATE INDEX idx_tax_history_created_at ON tax_research_history(created_at);
CREATE INDEX idx_tax_history_change_type ON tax_research_history(change_type);

-- Index for finding stale/flagged records
CREATE INDEX idx_tax_research_stale ON tax_research(is_stale) WHERE is_stale = TRUE;
CREATE INDEX idx_tax_research_status ON tax_research(research_status);
CREATE INDEX idx_tax_research_tax_sale ON tax_research(is_tax_sale_risk) WHERE is_tax_sale_risk = TRUE;
```

### Tax Jurisdictions (Platform Mapping)

```sql
CREATE TABLE tax_jurisdictions (
    id SERIAL PRIMARY KEY,
    state_code CHAR(2) NOT NULL,
    county_name VARCHAR(100),
    municipality_name VARCHAR(100),
    jurisdiction_type VARCHAR(50) NOT NULL, -- 'county', 'town', 'city', 'township'

    -- Scraper configuration
    scraper_platform VARCHAR(50),        -- 'vision', 'qpublic', 'trueauto', 'beacon', 'manual'
    scraper_config JSONB,                -- Platform-specific config
    base_url VARCHAR(500),
    search_url VARCHAR(500),

    -- Quick links for manual research
    assessor_url VARCHAR(500),
    tax_collector_url VARCHAR(500),
    gis_url VARCHAR(500),
    delinquent_tax_url VARCHAR(500),

    -- Contact info
    phone VARCHAR(50),
    email VARCHAR(255),

    -- Scraper health
    last_scrape_success TIMESTAMP,
    last_scrape_failure TIMESTAMP,
    scrape_success_rate DECIMAL(5,2),    -- Last 30 days
    is_scraper_working BOOLEAN DEFAULT TRUE,

    -- Notes
    notes TEXT,
    research_tips TEXT,                  -- Tips for manual research

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(state_code, county_name, municipality_name)
);

CREATE INDEX idx_jurisdictions_state ON tax_jurisdictions(state_code);
CREATE INDEX idx_jurisdictions_platform ON tax_jurisdictions(scraper_platform);
```

---

## Workflow States

```
┌─────────────────────────────────────────────────────────────────┐
│                    TAX RESEARCH WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ PENDING  │───▶│ SCRAPED  │───▶│ VERIFIED │───▶│ COMPLETE │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │                         │
│       │               ▼               ▼                         │
│       │         ┌──────────┐   ┌──────────┐                    │
│       └────────▶│  NEEDS   │◀──│ FLAGGED  │                    │
│                 │  REVIEW  │   │          │                    │
│                 └──────────┘   └──────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Status Definitions:
- PENDING: New property, not yet researched
- SCRAPED: Auto-scraped but not human verified
- VERIFIED: Human has confirmed data accuracy
- COMPLETE: Fully researched and approved
- NEEDS_REVIEW: Discrepancy or issue found
- FLAGGED: Critical issue (tax sale, major discrepancy)
```

---

## Scraper Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TAX RESEARCH SERVICE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    REQUEST QUEUE                         │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │   │
│  │  │ P1  │ │ P2  │ │ P3  │ │ P4  │ │ P5  │ │ ... │       │   │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────┴───────────────────────────────┐   │
│  │                   SCRAPER ROUTER                         │   │
│  │  Determines which platform adapter to use                │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
│  ┌────────┬────────┬───────┴───┬────────┬────────┬────────┐   │
│  │ Vision │qPublic │ TrueAuto  │ Beacon │ Custom │ Manual │   │
│  │Adapter │Adapter │  Adapter  │Adapter │Adapter │Fallback│   │
│  └───┬────┴───┬────┴─────┬─────┴───┬────┴───┬────┴───┬────┘   │
│      │        │          │         │        │        │         │
│  ┌───┴────────┴──────────┴─────────┴────────┴────────┴─────┐  │
│  │                 RATE LIMITER (per platform)              │  │
│  └─────────────────────────┬───────────────────────────────┘  │
│                            │                                   │
│  ┌─────────────────────────┴───────────────────────────────┐  │
│  │                  RESPONSE PROCESSOR                      │  │
│  │  - Normalize data to standard format                     │  │
│  │  - Detect changes from previous scrape                   │  │
│  │  - Flag discrepancies                                    │  │
│  │  - Calculate staleness                                   │  │
│  └─────────────────────────┬───────────────────────────────┘  │
│                            │                                   │
│  ┌─────────────────────────┴───────────────────────────────┐  │
│  │                   HISTORY RECORDER                       │  │
│  │  - Save to tax_research table                            │  │
│  │  - Create history entry                                  │  │
│  │  - Trigger alerts if needed                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Research Operations

```typescript
// POST /api/tax-research/scrape
// Scrape a single property
{
  collateral_id: number;
  force_refresh?: boolean;  // Ignore cache/freshness
}

// POST /api/tax-research/scrape-batch
// Scrape multiple properties
{
  collateral_ids: number[];
  priority?: 'high' | 'normal' | 'low';
}

// POST /api/tax-research/scrape-deal
// Scrape all properties in a deal
{
  project_id: number;
  only_stale?: boolean;      // Only refresh stale records
  only_pending?: boolean;    // Only research pending
}

// GET /api/tax-research/:collateral_id
// Get current tax research data
Response: {
  current: TaxResearch;
  history: TaxResearchHistory[];
  staleness: {
    is_stale: boolean;
    days_since_scrape: number;
    days_since_verification: number;
    stale_fields: string[];
  };
  jurisdiction: {
    name: string;
    type: string;
    quick_links: { assessor, tax_collector, gis };
    research_tips: string;
  };
}

// PUT /api/tax-research/:id
// Manual update (creates history entry)
{
  field_updates: Partial<TaxResearch>;
  reason: string;            // Required for audit
  mark_verified?: boolean;
}

// POST /api/tax-research/:id/verify
// Mark as human-verified
{
  verification_notes?: string;
}

// POST /api/tax-research/:id/flag
// Flag for review
{
  flag_reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}
```

### History & Audit

```typescript
// GET /api/tax-research/:id/history
// Get full change history
Response: {
  history: [{
    timestamp: Date;
    change_type: string;
    changed_by: { id, name };
    fields_changed: string[];
    before: object;
    after: object;
    reason: string;
  }];
}

// GET /api/tax-research/:id/compare
// Compare current to previous scrape
{
  compare_to?: 'previous' | 'last_verified' | 'initial';
}
Response: {
  current: TaxResearch;
  comparison: TaxResearch;
  differences: [{
    field: string;
    current_value: any;
    previous_value: any;
    change_percent?: number;  // For numeric fields
  }];
}
```

### Deal-Level Operations

```typescript
// GET /api/projects/:id/tax-research/summary
// Summary of tax research status for a deal
Response: {
  total_properties: number;
  by_status: {
    pending: number;
    scraped: number;
    verified: number;
    complete: number;
    needs_review: number;
    flagged: number;
  };
  stale_count: number;
  tax_sale_risks: number;
  total_delinquent: number;
  last_batch_scrape: Date;
}

// POST /api/projects/:id/tax-research/refresh-all
// Refresh all tax data for a deal
{
  priority: 'high' | 'normal';
  notify_when_complete?: boolean;
}
```

---

## UI Components

### Tax Research Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ TAX RESEARCH - Project: ABC Pool 2026-1                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Status Summary:                                                  │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│ │Pending │ │Scraped │ │Verified│ │Complete│ │Flagged │        │
│ │   12   │ │   45   │ │   23   │ │   18   │ │   2    │        │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                                  │
│ [Refresh All Stale] [Refresh All] [Export Tax Summary]          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Filter: [All ▼] Status: [All ▼] State: [All ▼] [🔍 Search]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ │ Loan # │ Address          │ County    │ Status  │ Tax    │ ⟳ │
│ ├────────┼──────────────────┼───────────┼─────────┼────────┼───┤
│ │ 1001   │ 123 Main St      │ Miami-Dade│ ✓ Done  │ $4,521 │ 2d│
│ │ 1002   │ 456 Oak Ave      │ Broward   │ ⚠ Stale │ $3,200 │15d│
│ │ 1003   │ 789 Pine Rd      │ Westport  │ 🔴 Flag │ $8,100 │ 1d│
│ │ 1004   │ 321 Elm St       │ Cook      │ ○ Pend  │   --   │ - │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Property Tax Research Detail

```
┌─────────────────────────────────────────────────────────────────┐
│ TAX RESEARCH: 123 Main St, Miami, FL 33101                      │
│ Loan #1001 | Collateral #2345                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Jurisdiction: Miami-Dade County, FL                              │
│ Platform: qPublic (auto-scrape available)                        │
│ Last Scraped: Jan 8, 2026 (2 days ago) ✓ Fresh                  │
│ Last Verified: Jan 8, 2026 by John Smith                        │
│                                                                  │
│ Quick Links: [Assessor] [Tax Collector] [GIS Map] [Pay Taxes]   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ PARCEL INFORMATION                               [Refresh Now]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Parcel ID:        01-2345-678-9012      [Copy]                  │
│ Alt Parcel ID:    12345678901234                                 │
│                                                                  │
│ ─── Tax Amounts ───────────────────────────────────────────     │
│ Annual Tax (2025):     $4,521.00                                │
│ Delinquent Amount:     $0.00          ✓ Current                 │
│                                                                  │
│ ─── Tax Sale Status ───────────────────────────────────────     │
│ Tax Sale Scheduled:    No             ✓                         │
│ Tax Sale Date:         N/A                                      │
│ Redemption Deadline:   N/A                                      │
│                                                                  │
│ ─── Assessed Values ───────────────────────────────────────     │
│ Total Assessed:        $285,000       (2025)                    │
│   Land:                $85,000                                  │
│   Improvement:         $200,000                                 │
│ Market Value:          $320,000                                 │
│                                                                  │
│ ─── Owner Information (per tax records) ───────────────────     │
│ Owner Name:            SMITH JOHN & JANE                        │
│ Owner Address:         123 Main St, Miami FL 33101              │
│ Mailing Address:       Same as above                            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ RESEARCHER NOTES                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Verified owner matches borrower. No liens found.            │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [Mark Verified] [Flag for Review] [View History] [Edit]         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Change History Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ CHANGE HISTORY: 123 Main St                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Jan 8, 2026 3:45 PM - Verified by John Smith                    │
│   "Confirmed owner matches loan documents"                       │
│                                                                  │
│ Jan 8, 2026 3:42 PM - Auto-scraped (qPublic)                    │
│   No changes from previous scrape                                │
│                                                                  │
│ Jan 5, 2026 9:15 AM - Auto-scraped (qPublic)                    │
│   ├─ delinquent_amount: $450.00 → $0.00                         │
│   └─ Note: Payment received, now current                         │
│                                                                  │
│ Dec 20, 2025 2:30 PM - Manual Edit by Jane Doe                  │
│   ├─ parcel_id: "12345678" → "01-2345-678-9012"                 │
│   └─ Reason: "Corrected parcel format per county site"          │
│                                                                  │
│ Dec 18, 2025 10:00 AM - Initial Scrape (qPublic)                │
│   First research of this property                                │
│                                                                  │
│ [Load More History]                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Alert System

### Auto-Generated Alerts

```typescript
const alertRules = [
  {
    condition: 'tax_sale_date IS NOT NULL AND tax_sale_date <= NOW() + INTERVAL 30 days',
    alert_type: 'tax_sale_imminent',
    priority: 'critical',
    message: 'Tax sale scheduled within 30 days'
  },
  {
    condition: 'delinquent_amount > 0 AND delinquent_amount > annual_tax_amount',
    alert_type: 'severe_delinquency',
    priority: 'high',
    message: 'Delinquent taxes exceed annual amount'
  },
  {
    condition: 'tax_owner_name NOT ILIKE borrower_name',
    alert_type: 'owner_mismatch',
    priority: 'medium',
    message: 'Tax owner name does not match borrower'
  },
  {
    condition: 'last_scraped_at < NOW() - INTERVAL 14 days',
    alert_type: 'stale_data',
    priority: 'low',
    message: 'Tax data not refreshed in 14+ days'
  },
  {
    condition: 'ABS(assessed_total - previous_assessed_total) / previous_assessed_total > 0.20',
    alert_type: 'value_change',
    priority: 'medium',
    message: 'Assessed value changed >20% since last scrape'
  }
];
```

---

## Deal Milestone Integration

```typescript
// Automatically trigger tax research at deal milestones

const dealMilestoneHooks = {
  'deal_imported': async (projectId) => {
    // Queue initial scrape for all properties
    await taxResearchService.queueBatchScrape(projectId, {
      priority: 'normal',
      only_pending: true
    });
  },

  'underwriting_started': async (projectId) => {
    // Refresh any stale data
    await taxResearchService.queueBatchScrape(projectId, {
      priority: 'high',
      only_stale: true
    });
  },

  'cutoff_applied': async (projectId) => {
    // Full refresh before final numbers
    await taxResearchService.queueBatchScrape(projectId, {
      priority: 'high',
      force_refresh: true
    });
    // Generate tax summary report
    await reportService.generateTaxSummary(projectId);
  },

  'bid_preparation': async (projectId) => {
    // Final verification check
    const summary = await taxResearchService.getSummary(projectId);
    if (summary.flagged > 0 || summary.stale_count > 0) {
      await notificationService.alert(projectId,
        'Tax research has unresolved issues before bid'
      );
    }
  }
};
```

---

## TypeScript Interfaces

```typescript
// Add to src/types/index.ts

// ==================== TAX RESEARCH TYPES ====================

export type TaxResearchStatus =
  | 'pending'
  | 'scraped'
  | 'verified'
  | 'complete'
  | 'needs_review'
  | 'flagged';

export type ScraperPlatform =
  | 'vision'
  | 'qpublic'
  | 'trueauto'
  | 'beacon'
  | 'patriot'
  | 'custom'
  | 'manual';

export interface TaxResearch {
  id: number;
  loanId: number;
  collateralId: number;

  // Jurisdiction
  stateCode: string;
  jurisdictionId?: number;
  jurisdictionName: string;
  jurisdictionType: 'county' | 'town' | 'city' | 'township';

  // Parcel
  parcelId: string;
  parcelIdAlt?: string;
  parcelIdSource: 'scraped' | 'manual' | 'imported';

  // Tax amounts
  annualTaxAmount?: number;
  taxYear?: number;
  delinquentAmount?: number;
  delinquentYears?: string;

  // Tax sale
  taxSaleScheduled: boolean;
  taxSaleDate?: string;
  redemptionDeadline?: string;
  taxSaleAmount?: number;

  // Values
  assessedTotal?: number;
  assessedLand?: number;
  assessedImprovement?: number;
  marketValue?: number;
  assessmentYear?: number;

  // Owner
  taxOwnerName?: string;
  taxOwnerAddress?: string;
  taxMailingAddress?: string;

  // Source tracking
  dataSource: ScraperPlatform;
  sourceUrl?: string;
  lastScrapedAt?: string;
  lastVerifiedAt?: string;

  // Status
  researchStatus: TaxResearchStatus;
  isStale: boolean;
  hasDiscrepancy: boolean;
  needsManualReview: boolean;
  isTaxSaleRisk: boolean;

  // Notes
  researcherNotes?: string;
  systemNotes?: string;

  // Audit
  createdAt: string;
  createdBy?: number;
  updatedAt: string;
  updatedBy?: number;
}

export interface TaxResearchHistory {
  id: number;
  taxResearchId: number;
  dataSnapshot: Partial<TaxResearch>;
  changeType: 'initial_scrape' | 'refresh' | 'manual_edit' | 'verification' | 'import';
  changeSource: 'scraper' | 'user' | 'import' | 'api';
  changeReason?: string;
  fieldsChanged: string[];
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
  createdBy?: number;
  scrapeSourceUrl?: string;
}

export interface TaxJurisdiction {
  id: number;
  stateCode: string;
  countyName?: string;
  municipalityName?: string;
  jurisdictionType: 'county' | 'town' | 'city' | 'township';

  // Scraper config
  scraperPlatform: ScraperPlatform;
  scraperConfig?: Record<string, any>;
  baseUrl?: string;
  searchUrl?: string;

  // Quick links
  assessorUrl?: string;
  taxCollectorUrl?: string;
  gisUrl?: string;
  delinquentTaxUrl?: string;

  // Contact
  phone?: string;
  email?: string;

  // Health
  lastScrapeSuccess?: string;
  lastScrapeFailure?: string;
  scrapeSuccessRate?: number;
  isScraperWorking: boolean;

  // Notes
  notes?: string;
  researchTips?: string;
}

export interface TaxResearchSummary {
  totalProperties: number;
  byStatus: Record<TaxResearchStatus, number>;
  staleCount: number;
  taxSaleRisks: number;
  totalDelinquent: number;
  lastBatchScrape?: string;
}

export interface TaxStaleness {
  isStale: boolean;
  daysSinceScrape: number;
  daysSinceVerification?: number;
  staleFields: string[];
}
```

---

## Summary

This system provides:

1. **Real-time scraping** - On-demand refresh, not stale cache
2. **Full history** - Every change tracked with before/after
3. **Workflow integration** - Auto-refresh at deal milestones
4. **Smart alerts** - Tax sale risks, owner mismatches, value changes
5. **Manual override** - Researchers can correct with audit trail
6. **Staleness tracking** - Know when data needs refresh
7. **Platform flexibility** - Supports scrapers + manual research

The key insight: **Tax data is living data** that changes throughout a deal, so the system must support iterative research, not one-time lookups.
