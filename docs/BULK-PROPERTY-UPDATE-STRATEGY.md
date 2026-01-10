# Bulk Property Update Strategy (50K+ Properties/Month)

**Created:** January 10, 2026
**Purpose:** Design system for monthly updates of 50,000+ properties

---

## Scale Analysis

### The Math

| Metric | Value |
|--------|-------|
| Properties to update | 50,000/month |
| Days in month | ~22 working days |
| Properties per day | ~2,273/day |
| Properties per hour (8hr day) | ~284/hour |

### Individual Scraping Won't Scale

| Approach | Daily Capacity | Time for 50K |
|----------|---------------|--------------|
| Individual scraping (conservative) | ~400-500 | 100+ days ❌ |
| Individual scraping (aggressive) | ~1,000 | 50 days ❌ |
| Parallel scrapers (5 platforms) | ~2,000 | 25 days ⚠️ |
| Bulk data + targeted scraping | 50,000+ | 1-5 days ✅ |

**Conclusion:** Need bulk data sources, not just scraping.

---

## Tier 1: States with Bulk Data Downloads (FREE)

### Florida - BEST OPTION
```
Source: FL Department of Revenue
URL: https://floridarevenue.com/property/Pages/DataPortal.aspx
Format: CSV/Fixed-width files
Frequency: Annual (with quarterly updates available)
Coverage: All 67 counties, ALL parcels
Cost: FREE

Data Includes:
✅ Parcel ID
✅ Owner name/address
✅ Property address
✅ Assessed values (just, assessed, taxable)
✅ Land/improvement breakdown
✅ Property characteristics
✅ Sales data
❌ Current tax amounts (need county for this)
❌ Delinquent status (need county for this)

Download Size: ~20GB for entire state
Records: ~10 million parcels
```

### Texas - GOOD OPTION
```
Source: Texas Comptroller + Individual CADs
URL: https://comptroller.texas.gov/taxes/property-tax/
Format: Various (CSV, API for some CADs)
Frequency: Annual
Coverage: Varies by CAD

Many CADs offer bulk downloads:
- Harris County (Houston): Bulk files available
- Dallas CAD: Bulk exports
- Bexar County (San Antonio): Data available
- Tarrant County: Bulk files

Data Includes:
✅ Property characteristics
✅ Assessed values
⚠️ Sales (TX doesn't require price disclosure)
```

### Other States with Bulk Options

| State | Source | Format | Update Freq | Coverage |
|-------|--------|--------|-------------|----------|
| **Georgia** | County downloads | CSV | Annual | Good |
| **North Carolina** | County GIS | Shapefile/CSV | Annual | Good |
| **Ohio** | County Auditors | CSV | Annual | Varies |
| **Colorado** | DOLA | CSV | Annual | Statewide |
| **Oregon** | ORMAP | GIS/CSV | Annual | Statewide |
| **Washington** | County Assessors | CSV | Annual | Most counties |
| **Maryland** | SDAT | API/CSV | Quarterly | Statewide |
| **Montana** | Cadastral | GIS/CSV | Annual | Statewide |
| **Minnesota** | MetroGIS | GIS/CSV | Annual | Metro area |

---

## Tier 2: County-Level Bulk Downloads

### Counties That Offer Bulk Data (FREE)

Many counties provide bulk data downloads. Common patterns:

```
Typical Bulk Data Sources:
1. GIS Portal → "Download Data" option
2. Open Data Portal (Socrata, ArcGIS Hub)
3. FTP site maintained by county
4. Annual assessment roll files
5. FOIA/public records request (may take time)
```

### Finding Bulk Data

```typescript
// Common URL patterns to check
const bulkDataPatterns = [
  '{county}.gov/gis/data',
  '{county}.gov/opendata',
  'data.{county}.gov',
  'gis.{county}.gov/download',
  '{county}.gov/assessor/data',
  '{state}gis.org/{county}',
  'hub.arcgis.com/search?q={county}+parcels'
];

// Example: Finding Miami-Dade bulk data
// https://gis-mdc.opendata.arcgis.com/
// → Search "parcels" → Download as CSV/GeoJSON
```

### High-Volume Counties with Bulk Data

| County | State | Parcels | Bulk Source | Format |
|--------|-------|---------|-------------|--------|
| Miami-Dade | FL | 900K | Open Data Portal | CSV/GeoJSON |
| Broward | FL | 600K | GIS Download | Shapefile |
| Los Angeles | CA | 2.5M | data.lacounty.gov | CSV |
| Harris | TX | 1.8M | HCAD Download | CSV |
| Cook | IL | 1.8M | datacatalog.cookcountyil.gov | CSV |
| Maricopa | AZ | 1.7M | recorder.maricopa.gov | CSV |
| San Diego | CA | 1M | Open Data | CSV |
| Orange | CA | 600K | ocgov.com/opendata | CSV |
| Clark | NV | 800K | Open Data | CSV |
| King | WA | 800K | kingcounty.gov/gis | CSV |

---

## Tier 3: Tax Data Updates (The Harder Part)

### Problem: Bulk Values ≠ Current Tax Status

Bulk downloads give you:
- ✅ Assessed values (may be last year)
- ✅ Property characteristics
- ✅ Owner info
- ❌ Current tax bill amounts
- ❌ Delinquent status
- ❌ Tax sale dates

### Solution: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────────┐
│              MONTHLY UPDATE WORKFLOW (50K properties)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WEEK 1: Bulk Data Refresh                                       │
│  ────────────────────────                                        │
│  1. Download state/county bulk files                             │
│  2. Import into staging tables                                   │
│  3. Match to your property portfolio                             │
│  4. Update assessed values, owner info, characteristics          │
│  5. Flag properties with changes                                 │
│                                                                  │
│  Result: 50K properties updated with bulk data (~1-2 days)       │
│                                                                  │
│  WEEK 2-3: Targeted Tax Scraping                                 │
│  ────────────────────────────                                    │
│  1. Identify properties needing tax updates:                     │
│     - All properties with bulk value changes                     │
│     - All properties flagged for tax risk                        │
│     - Sample of others (random 10-20%)                           │
│  2. Queue for scraping by priority                               │
│  3. Run scrapers across platforms                                │
│                                                                  │
│  Result: ~10-15K targeted scrapes (~5-7 days)                    │
│                                                                  │
│  WEEK 4: Review & Exceptions                                     │
│  ──────────────────────────                                      │
│  1. Review flagged properties                                    │
│  2. Manual research for failures                                 │
│  3. Generate exception reports                                   │
│  4. Update portfolio status                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture for 50K Scale

### Database Schema for Bulk Import

```sql
-- Staging table for bulk imports
CREATE TABLE bulk_import_staging (
    id SERIAL PRIMARY KEY,
    import_batch_id UUID NOT NULL,
    import_source VARCHAR(100),      -- 'FL_DOR', 'HARRIS_CAD', etc.
    import_date DATE,

    -- Raw data from bulk file
    raw_parcel_id VARCHAR(100),
    raw_owner_name VARCHAR(500),
    raw_address VARCHAR(500),
    raw_city VARCHAR(100),
    raw_state VARCHAR(10),
    raw_zip VARCHAR(20),

    -- Values
    raw_assessed_total VARCHAR(50),
    raw_assessed_land VARCHAR(50),
    raw_assessed_improvement VARCHAR(50),
    raw_market_value VARCHAR(50),
    raw_taxable_value VARCHAR(50),

    -- Characteristics
    raw_year_built VARCHAR(20),
    raw_living_area VARCHAR(50),
    raw_lot_size VARCHAR(50),
    raw_property_type VARCHAR(100),

    -- Full raw row for debugging
    raw_data JSONB,

    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'pending',
    matched_property_id INTEGER,
    match_confidence DECIMAL(3,2),
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Index for matching
CREATE INDEX idx_bulk_staging_parcel ON bulk_import_staging(raw_parcel_id);
CREATE INDEX idx_bulk_staging_address ON bulk_import_staging(raw_address);
CREATE INDEX idx_bulk_staging_status ON bulk_import_staging(processing_status);
CREATE INDEX idx_bulk_staging_batch ON bulk_import_staging(import_batch_id);

-- Track bulk import batches
CREATE TABLE bulk_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100) NOT NULL,
    source_file VARCHAR(500),
    source_date DATE,

    records_total INTEGER,
    records_processed INTEGER DEFAULT 0,
    records_matched INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

-- Track which properties need tax scraping after bulk update
CREATE TABLE tax_scrape_queue (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES property_research(id),

    -- Why queued
    queue_reason VARCHAR(100),
    -- Reasons: 'bulk_value_change', 'tax_risk', 'stale_tax_data', 'random_sample', 'manual'

    -- Priority
    priority INTEGER DEFAULT 50,  -- 1=highest, 100=lowest
    priority_reason VARCHAR(255),

    -- Queue management
    queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    queued_by VARCHAR(100),  -- 'bulk_import', 'user', 'scheduler'

    -- Processing
    scrape_status VARCHAR(50) DEFAULT 'pending',
    -- Status: pending, processing, completed, failed, skipped
    scrape_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,

    -- Result
    scrape_result JSONB  -- Store what changed
);

CREATE INDEX idx_tax_queue_status_priority ON tax_scrape_queue(scrape_status, priority);
CREATE INDEX idx_tax_queue_property ON tax_scrape_queue(property_id);
```

### Bulk Import Service

```typescript
class BulkImportService {
  // Configuration for different bulk sources
  private sourceConfigs: Record<string, BulkSourceConfig> = {
    'FL_DOR': {
      filePattern: 'NAL*.txt',
      format: 'fixed_width',
      recordLayout: FL_DOR_LAYOUT,
      parcelIdField: 'PARCEL_ID',
      matchFields: ['parcel_id', 'address']
    },
    'HARRIS_CAD': {
      filePattern: '*.csv',
      format: 'csv',
      delimiter: ',',
      parcelIdField: 'prop_id',
      matchFields: ['parcel_id', 'address', 'owner_name']
    },
    'COUNTY_GIS': {
      filePattern: '*.csv',
      format: 'csv',
      // Generic - will auto-detect columns
      matchFields: ['parcel_id', 'address']
    }
  };

  async importBulkFile(
    source: string,
    filePath: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const config = this.sourceConfigs[source] || this.sourceConfigs['COUNTY_GIS'];
    const batchId = uuid();

    console.log(`Starting bulk import: ${source}, batch: ${batchId}`);

    // Create batch record
    const batch = await this.db.createBatch({
      id: batchId,
      source,
      sourceFile: filePath,
      status: 'processing',
      startedAt: new Date()
    });

    // Stream file to avoid memory issues
    const stream = this.createFileStream(filePath, config);
    let processed = 0;
    let matched = 0;
    let updated = 0;
    let failed = 0;

    for await (const record of stream) {
      try {
        // Normalize record
        const normalized = this.normalizeRecord(record, config);

        // Insert to staging
        await this.db.insertStaging({
          importBatchId: batchId,
          importSource: source,
          ...normalized
        });

        processed++;

        // Process in batches of 1000
        if (processed % 1000 === 0) {
          const results = await this.processStaging(batchId, 1000);
          matched += results.matched;
          updated += results.updated;
          failed += results.failed;

          console.log(`Processed ${processed} records...`);
        }
      } catch (error) {
        failed++;
        console.error(`Error processing record: ${error.message}`);
      }
    }

    // Process remaining
    const finalResults = await this.processStaging(batchId);
    matched += finalResults.matched;
    updated += finalResults.updated;
    failed += finalResults.failed;

    // Update batch
    await this.db.updateBatch(batchId, {
      recordsTotal: processed,
      recordsMatched: matched,
      recordsUpdated: updated,
      recordsFailed: failed,
      status: 'completed',
      completedAt: new Date()
    });

    // Queue tax scrapes for changed properties
    await this.queueTaxScrapes(batchId);

    return { batchId, processed, matched, updated, failed };
  }

  private async processStaging(batchId: string, limit?: number): Promise<ProcessResult> {
    const records = await this.db.getStagingRecords(batchId, 'pending', limit);
    let matched = 0, updated = 0, failed = 0;

    for (const record of records) {
      try {
        // Try to match to existing property
        const match = await this.findMatch(record);

        if (match) {
          matched++;

          // Check what changed
          const changes = this.detectChanges(match.property, record);

          if (changes.length > 0) {
            // Update property with new data
            await this.updateProperty(match.property.id, record, changes);
            updated++;

            // Flag for tax scrape if significant changes
            if (this.shouldQueueForTaxScrape(changes)) {
              await this.db.addToTaxQueue({
                propertyId: match.property.id,
                queueReason: 'bulk_value_change',
                priority: this.calculatePriority(changes),
                queuedBy: 'bulk_import'
              });
            }
          }

          await this.db.updateStagingStatus(record.id, 'matched', match.property.id);
        } else {
          // No match - log for review
          await this.db.updateStagingStatus(record.id, 'no_match');
        }
      } catch (error) {
        failed++;
        await this.db.updateStagingStatus(record.id, 'error', null, error.message);
      }
    }

    return { matched, updated, failed };
  }

  private async findMatch(record: StagingRecord): Promise<PropertyMatch | null> {
    // Try parcel ID first (most reliable)
    if (record.raw_parcel_id) {
      const match = await this.db.findByParcelId(
        record.raw_parcel_id,
        record.raw_state
      );
      if (match) return { property: match, confidence: 1.0 };
    }

    // Try address match
    if (record.raw_address) {
      const normalized = this.normalizeAddress(record.raw_address);
      const match = await this.db.findByAddress(
        normalized,
        record.raw_city,
        record.raw_state
      );
      if (match) return { property: match, confidence: 0.9 };
    }

    // Try fuzzy match on address + owner
    const fuzzyMatches = await this.db.fuzzyMatch(record);
    if (fuzzyMatches.length > 0 && fuzzyMatches[0].score > 0.85) {
      return {
        property: fuzzyMatches[0].property,
        confidence: fuzzyMatches[0].score
      };
    }

    return null;
  }

  private shouldQueueForTaxScrape(changes: PropertyChange[]): boolean {
    const significantChanges = [
      'assessed_total',
      'market_value',
      'owner_name',
      'taxable_value'
    ];

    return changes.some(c =>
      significantChanges.includes(c.field) ||
      (c.percentChange && Math.abs(c.percentChange) > 10)
    );
  }
}
```

---

## Parallel Processing Architecture

### Distributed Scraping for Tax Data

```typescript
class DistributedScraperService {
  // Run multiple scraper workers for different platforms
  private workers: Map<string, ScraperWorker[]> = new Map();

  constructor() {
    // Initialize workers per platform (respecting rate limits)
    this.workers.set('vision', [new ScraperWorker('vision', 1)]);
    this.workers.set('qpublic', [new ScraperWorker('qpublic', 1)]);
    this.workers.set('trueauto', [new ScraperWorker('trueauto', 1)]);
    this.workers.set('beacon', [new ScraperWorker('beacon', 1)]);
    // More workers for manual/slow platforms
    this.workers.set('county_direct', [
      new ScraperWorker('county_direct', 1),
      new ScraperWorker('county_direct', 2),
      new ScraperWorker('county_direct', 3)
    ]);
  }

  async processQueue(): Promise<void> {
    // Get pending items grouped by platform
    const queueByPlatform = await this.db.getTaxQueueByPlatform();

    const promises = [];

    for (const [platform, items] of Object.entries(queueByPlatform)) {
      const workers = this.workers.get(platform) || [];

      for (const worker of workers) {
        // Each worker processes items for its platform
        promises.push(worker.processItems(items));
      }
    }

    await Promise.all(promises);
  }
}

// Run as scheduled job
// 0 1 * * * node scripts/process-tax-queue.js
```

### Throughput with Parallel Processing

| Platform | Workers | Requests/Hour Each | Total/Hour | Total/Day |
|----------|---------|-------------------|------------|-----------|
| Vision | 1 | 60 | 60 | 480 |
| qPublic | 1 | 60 | 60 | 480 |
| TrueAuto | 1 | 60 | 60 | 480 |
| Beacon | 1 | 40 | 40 | 320 |
| County (mixed) | 3 | 30 | 90 | 720 |
| **Total** | **7** | - | **310** | **2,480** |

**With bulk data + targeted scraping:**
- 50K properties bulk updated: 1-2 days
- 10-15K tax scrapes: 4-6 days
- **Total monthly cycle: ~7-8 days** ✅

---

## Monthly Schedule

```
┌──────────────────────────────────────────────────────────────────┐
│                    MONTHLY UPDATE CALENDAR                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Week 1 (Days 1-5)                                                │
│  ─────────────────                                                │
│  Mon: Download FL DOR bulk file                                   │
│  Tue: Import FL data, match properties                            │
│  Wed: Download TX CAD files (major counties)                      │
│  Thu: Import TX data, match properties                            │
│  Fri: Download other state/county bulk files                      │
│                                                                   │
│  Week 2 (Days 6-12)                                               │
│  ──────────────────                                               │
│  Mon-Wed: Import remaining bulk files                             │
│  Thu-Fri: Start tax scraping queue (high priority)                │
│  Weekend: Continue scraping (automated)                           │
│                                                                   │
│  Week 3 (Days 13-19)                                              │
│  ──────────────────                                               │
│  Mon-Fri: Continue tax scraping (medium priority)                 │
│  Review exceptions, manual research                               │
│  Weekend: Continue scraping (automated)                           │
│                                                                   │
│  Week 4 (Days 20-22+)                                             │
│  ────────────────────                                             │
│  Mon-Tue: Complete remaining scrapes                              │
│  Wed: Generate exception reports                                  │
│  Thu: Review and resolve exceptions                               │
│  Fri: Generate monthly portfolio update report                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Bulk Data Source Checklist

### Priority 1: State-Level Downloads

```markdown
## Florida
- [ ] FL DOR NAL File (annual): https://floridarevenue.com/property/
- [ ] Download all 67 county files
- [ ] Estimated: 10M parcels, 20GB

## Texas (by CAD)
- [ ] Harris CAD: https://hcad.org/property-search/property-downloads/
- [ ] Dallas CAD: https://www.dallascad.org/
- [ ] Bexar CAD: https://www.bcad.org/
- [ ] Tarrant CAD: https://www.tad.org/
- [ ] Travis CAD: https://www.traviscad.org/

## Other States
- [ ] Georgia: County-by-county downloads
- [ ] North Carolina: County GIS portals
- [ ] Ohio: County auditor sites
```

### Priority 2: High-Volume Counties

```markdown
## By Parcel Count
- [ ] Los Angeles CA (2.5M): data.lacounty.gov
- [ ] Cook IL (1.8M): datacatalog.cookcountyil.gov
- [ ] Maricopa AZ (1.7M): Open data portal
- [ ] San Diego CA (1M): Open data
- [ ] Orange CA (600K): Open data
- [ ] Clark NV (800K): Open data
- [ ] King WA (800K): kingcounty.gov/gis
```

### Priority 3: By Your Portfolio

```markdown
## Analyze your 50K properties
- [ ] Group by state
- [ ] Group by county
- [ ] Identify top 20 counties by volume
- [ ] Research bulk data availability for each
- [ ] Prioritize bulk sources for highest-volume counties
```

---

## Monitoring Dashboard

```typescript
interface MonthlyUpdateDashboard {
  // Bulk import status
  bulkImport: {
    totalSources: number;
    sourcesCompleted: number;
    recordsImported: number;
    recordsMatched: number;
    recordsUpdated: number;
    lastImportDate: Date;
  };

  // Tax scrape queue
  taxScrapeQueue: {
    totalQueued: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    byPriority: Record<string, number>;
    byPlatform: Record<string, number>;
    estimatedCompletionDate: Date;
  };

  // Portfolio status
  portfolio: {
    totalProperties: number;
    updatedThisMonth: number;
    pendingUpdate: number;
    staleData: number;  // Not updated in 60+ days
    exceptions: number; // Need manual review
  };

  // Performance
  performance: {
    bulkImportRate: number;      // Records/hour
    scrapeRate: number;          // Properties/hour
    matchRate: number;           // % of bulk records matched
    successRate: number;         // % of scrapes successful
  };
}
```

---

## Cost Summary (50K Scale)

| Item | Cost | Notes |
|------|------|-------|
| Bulk state data | $0 | Public records |
| Bulk county data | $0 | Public records |
| Individual scraping | $0 | Rate-limited, free sites |
| Server costs | ~$50-100/mo | Additional compute for processing |
| Storage | ~$10-20/mo | Bulk files + database |
| **Total** | **~$60-120/mo** | vs $5,000+/mo for commercial data |

---

## Summary

For 50K properties/month:

| Approach | Time | Feasibility |
|----------|------|-------------|
| Individual scraping only | 100+ days | ❌ Not feasible |
| Bulk data + targeted scraping | 7-8 days | ✅ Recommended |

**Strategy:**
1. **Bulk downloads** for assessed values, owner info, characteristics
2. **Targeted scraping** for current tax status (10-20% of portfolio)
3. **Priority queue** for at-risk properties
4. **Monthly cycle** fits in 7-8 working days

**Data freshness:**
- Bulk data: Updated monthly (values, ownership)
- Tax data: Priority properties scraped monthly, others quarterly
- Tax sale risks: Scraped weekly
