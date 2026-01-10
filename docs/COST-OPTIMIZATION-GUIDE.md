# Cost Optimization Guide

**Created:** January 10, 2026
**Goal:** Minimize costs while maintaining effective tax research

---

## Cost Breakdown

### Current System Costs

| Cost Area | Without Optimization | With Optimization |
|-----------|---------------------|-------------------|
| Data sources | $0 (free public records) | $0 |
| Server compute | $100-200/mo | $20-50/mo |
| Storage | $50-100/mo | $10-20/mo |
| Network/bandwidth | $20-50/mo | $5-10/mo |
| Manual labor | Variable | Reduced 50-70% |
| **Total** | **$170-350/mo** | **$35-80/mo** |

---

## Strategy 1: Don't Scrape What You Don't Need

### Scrape Smart, Not Hard

```
❌ BAD: Scrape all 50K properties monthly
✅ GOOD: Scrape only what changed or is at risk
```

### Tiered Update Strategy

| Tier | Properties | Update Frequency | Monthly Scrapes |
|------|------------|------------------|-----------------|
| **Critical** | Tax sale risk | Weekly | 4 × count |
| **High** | Delinquent | Bi-weekly | 2 × count |
| **Medium** | Value changes | Monthly | 1 × count |
| **Low** | Stable properties | Quarterly | 0.33 × count |

### Example: 50K Portfolio

```
Assume:
- 500 tax sale risk (1%)
- 2,500 delinquent (5%)
- 5,000 recent changes (10%)
- 42,000 stable (84%)

Monthly scrapes needed:
- Critical: 500 × 4 = 2,000
- High: 2,500 × 2 = 5,000
- Medium: 5,000 × 1 = 5,000
- Low: 42,000 × 0.33 = 14,000

Total: ~26,000 scrapes/month (vs 50,000)
Savings: 48% reduction in scraping volume
```

### Implementation

```typescript
function shouldScrapeThisMonth(property: Property): boolean {
  // Always scrape tax sale risks
  if (property.isTaxSaleRisk) return true;

  // Always scrape delinquent
  if (property.delinquentAmount > 0) return true;

  // Scrape if bulk data showed value change >5%
  if (property.bulkValueChangePercent > 5) return true;

  // Scrape if stale > 90 days
  if (property.daysSinceLastScrape > 90) return true;

  // Random 10% sample of stable properties
  if (property.isStable && Math.random() < 0.10) return true;

  return false;
}
```

---

## Strategy 2: Aggressive Caching

### Cache Everything

```typescript
const cacheConfig = {
  // Property characteristics - rarely change
  propertyCharacteristics: {
    ttlDays: 180,  // 6 months
    storage: 'database'
  },

  // Assessed values - annual updates
  assessedValues: {
    ttlDays: 365,
    storage: 'database'
  },

  // Tax amounts - change with payments
  taxAmounts: {
    ttlDays: 30,
    storage: 'database'
  },

  // Raw HTML pages - for debugging
  rawHtml: {
    ttlDays: 7,
    storage: 'file',  // Cheaper than database
    compress: true    // gzip saves 70-80%
  }
};
```

### Before Scraping, Check Cache

```typescript
async function getPropertyData(parcelId: string): Promise<PropertyData> {
  // 1. Check memory cache (free, instant)
  const memCached = memoryCache.get(parcelId);
  if (memCached && !isStale(memCached)) return memCached;

  // 2. Check database cache (cheap, fast)
  const dbCached = await db.getCache(parcelId);
  if (dbCached && !isStale(dbCached)) {
    memoryCache.set(parcelId, dbCached);
    return dbCached;
  }

  // 3. Only scrape if no valid cache
  const scraped = await scraper.scrape(parcelId);
  await db.setCache(parcelId, scraped);
  memoryCache.set(parcelId, scraped);

  return scraped;
}
```

### Cache Hit Rate Target: 70%+

With good caching:
- 50K property lookups/month
- 70% cache hits = 35K served from cache (free)
- 30% actual scrapes = 15K scrapes needed

---

## Strategy 3: Minimize Server Costs

### Use Free Tiers

| Service | Free Tier | Enough For |
|---------|-----------|------------|
| **Supabase** | 500MB DB, 1GB storage | Small portfolio |
| **PlanetScale** | 1 billion row reads/mo | Database queries |
| **Vercel** | 100GB bandwidth | API hosting |
| **Railway** | $5 credit/mo | Small compute |
| **Render** | 750 hours/mo | Background jobs |
| **Cloudflare R2** | 10GB storage, free egress | File storage |

### Self-Hosted Option (Cheapest)

```
Single VPS: $5-20/month
- DigitalOcean Droplet: $6/mo (1GB RAM)
- Hetzner VPS: $4/mo (2GB RAM)
- Vultr: $5/mo (1GB RAM)

Can run:
- PostgreSQL database
- Node.js scraper service
- Redis cache
- All on one server
```

### Run During Off-Peak Hours

```typescript
// Schedule heavy scraping for nights/weekends
// when server costs may be lower (spot instances)

const scrapeSchedule = {
  // Batch scraping: 2 AM - 6 AM local time
  batchScraping: '0 2 * * *',

  // Priority scraping: every 4 hours
  priorityScraping: '0 */4 * * *',

  // Bulk imports: Sunday 3 AM
  bulkImport: '0 3 * * 0'
};
```

---

## Strategy 4: Minimize Storage Costs

### Compress Everything

```typescript
// Raw HTML: 50KB average → 10KB compressed (80% savings)
async function storeRawHtml(parcelId: string, html: string): Promise<void> {
  const compressed = await gzip(html);
  await storage.put(`raw/${parcelId}.html.gz`, compressed);
}

// Database: Use JSONB compression in PostgreSQL
// CREATE TABLE property_data (
//   data JSONB COMPRESSION lz4
// );
```

### Archive Old Data

```typescript
// Move data older than 1 year to cold storage
async function archiveOldData(): Promise<void> {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  // Move old history to archive table (cheaper storage)
  await db.query(`
    INSERT INTO property_research_history_archive
    SELECT * FROM property_research_history
    WHERE created_at < $1
  `, [cutoff]);

  // Delete from main table
  await db.query(`
    DELETE FROM property_research_history
    WHERE created_at < $1
  `, [cutoff]);
}
```

### Storage Comparison

| Storage Type | Cost/GB/Month | Use For |
|--------------|---------------|---------|
| PostgreSQL (managed) | $0.10-0.25 | Active data |
| S3 Standard | $0.023 | Raw files |
| S3 Infrequent Access | $0.0125 | Archives |
| S3 Glacier | $0.004 | Long-term backup |
| Local SSD (VPS) | ~$0.10 | Everything (self-hosted) |

---

## Strategy 5: Minimize Network Costs

### Reduce Request Size

```typescript
// Only request what you need
const scrapingOptions = {
  // Don't download images by default
  downloadImages: false,

  // Don't follow redirects to external sites
  followExternalRedirects: false,

  // Limit response size
  maxResponseSize: 500 * 1024, // 500KB max

  // Request compressed responses
  headers: {
    'Accept-Encoding': 'gzip, deflate, br'
  }
};
```

### Batch API Calls

```typescript
// Instead of 100 individual API calls
❌ for (const id of parcelIds) {
     await api.getProperty(id);
   }

// Make one batch call
✅ await api.getProperties(parcelIds); // If API supports it
```

---

## Strategy 6: Reduce Manual Labor

### Automate Exception Handling

```typescript
// Auto-resolve common issues
const autoResolvers = {
  // Parcel ID format mismatch
  'parcel_format_mismatch': async (property) => {
    const formats = generateParcelFormats(property.parcelId);
    for (const format of formats) {
      const result = await trySearch(format);
      if (result) {
        await updateParcelId(property.id, format);
        return true;
      }
    }
    return false;
  },

  // Address variation
  'address_not_found': async (property) => {
    const variations = generateAddressVariations(property.address);
    for (const variation of variations) {
      const result = await trySearch(variation);
      if (result) return true;
    }
    return false;
  },

  // Temporary site issue
  'scrape_failed': async (property) => {
    // Auto-retry after delay
    await delay(60000);
    return await retryScrape(property);
  }
};

// Only escalate to manual if auto-resolve fails
async function handleException(property: Property, error: string): Promise<void> {
  const resolver = autoResolvers[error];
  if (resolver) {
    const resolved = await resolver(property);
    if (resolved) return;
  }

  // Escalate to manual queue
  await addToManualQueue(property, error);
}
```

### Prioritize Manual Work

```typescript
// Sort manual queue by value/risk
const manualQueueSort = {
  // Tax sale imminent - highest priority
  'tax_sale_30_days': 100,

  // High loan balance
  'upb_over_500k': 80,

  // Delinquent taxes
  'delinquent': 60,

  // Standard research
  'standard': 20
};

// Researchers focus on highest-value items first
```

---

## Strategy 7: Use Bulk Data Extensively

### Bulk Data = 90% Cost Reduction

| Approach | Scrapes Needed | Time | Cost |
|----------|---------------|------|------|
| Scrape everything | 50,000 | 100+ days | High compute |
| Bulk + targeted | 5,000-15,000 | 5-7 days | Low compute |

### Bulk Data Provides (FREE):

- ✅ Assessed values
- ✅ Property characteristics
- ✅ Owner information
- ✅ Sales history
- ✅ Legal descriptions

### Only Scrape For:

- ❓ Current tax bill amount
- ❓ Delinquent status
- ❓ Tax sale dates
- ❓ Recent payment status

---

## Strategy 8: Efficient Database Design

### Index Only What You Query

```sql
-- Good: Index fields you filter/sort by
CREATE INDEX idx_property_state ON property_research(state_code);
CREATE INDEX idx_property_status ON property_research(research_status);
CREATE INDEX idx_property_tax_sale ON property_research(is_tax_sale_risk)
  WHERE is_tax_sale_risk = TRUE;  -- Partial index, smaller

-- Bad: Indexing everything (wastes storage)
-- Don't index: notes, raw_html, rarely-queried fields
```

### Use Appropriate Data Types

```sql
-- Good: Right-sized types
state_code CHAR(2),           -- 2 bytes vs VARCHAR(255)
year_built SMALLINT,          -- 2 bytes vs INTEGER (4 bytes)
is_delinquent BOOLEAN,        -- 1 byte vs VARCHAR

-- Bad: Oversized types
state_code VARCHAR(255),      -- Wastes space
```

### Partition Large Tables

```sql
-- Partition history by date (query only recent data)
CREATE TABLE property_research_history (
  ...
) PARTITION BY RANGE (created_at);

CREATE TABLE property_history_2025
  PARTITION OF property_research_history
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE property_history_2024
  PARTITION OF property_research_history
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Old partitions can be archived/dropped
```

---

## Cost Calculator

### Input Your Numbers

```typescript
function calculateMonthlyCost(config: CostConfig): MonthlyCost {
  const {
    totalProperties,
    taxSaleRiskPercent,
    delinquentPercent,
    changedPercent,
    serverCostPerHour,
    storagePerGbMonth,
    hoursPerDay
  } = config;

  // Calculate scrapes needed
  const taxSaleRisk = totalProperties * taxSaleRiskPercent * 4; // Weekly
  const delinquent = totalProperties * delinquentPercent * 2;   // Bi-weekly
  const changed = totalProperties * changedPercent * 1;         // Monthly
  const stable = totalProperties * (1 - taxSaleRiskPercent - delinquentPercent - changedPercent) * 0.33;

  const totalScrapes = taxSaleRisk + delinquent + changed + stable;

  // Calculate time needed
  const scrapesPerHour = 60; // Conservative
  const hoursNeeded = totalScrapes / scrapesPerHour;
  const daysNeeded = hoursNeeded / hoursPerDay;

  // Calculate costs
  const computeCost = hoursNeeded * serverCostPerHour;
  const storageCost = (totalProperties * 0.001) * storagePerGbMonth; // ~1KB per property

  return {
    totalScrapes,
    hoursNeeded,
    daysNeeded,
    computeCost,
    storageCost,
    totalCost: computeCost + storageCost
  };
}

// Example: 50K properties
const cost = calculateMonthlyCost({
  totalProperties: 50000,
  taxSaleRiskPercent: 0.01,
  delinquentPercent: 0.05,
  changedPercent: 0.10,
  serverCostPerHour: 0.05,  // Cheap VPS
  storagePerGbMonth: 0.10,
  hoursPerDay: 8
});

// Result:
// totalScrapes: ~26,000
// hoursNeeded: ~433
// daysNeeded: ~54 days (but spread over month with bulk data)
// computeCost: ~$22
// storageCost: ~$5
// totalCost: ~$27/month
```

---

## Minimum Viable Setup (Cheapest Possible)

### $10-20/Month Setup

```
Hardware:
- 1× $6/mo VPS (Hetzner/Vultr)
  - 2GB RAM
  - 40GB SSD
  - Runs everything

Software (all free):
- PostgreSQL (database)
- Node.js (scraper)
- Redis (optional, can use PostgreSQL for cache)

Workflow:
1. Download bulk files manually (free)
2. Import via script
3. Run scraper 6-8 hours/night
4. Review exceptions weekly
```

### What You Give Up

| Feature | Full System | Minimum Setup |
|---------|-------------|---------------|
| Auto bulk download | ✅ | ❌ Manual |
| Real-time scraping | ✅ | ❌ Batch only |
| Web dashboard | ✅ | ❌ CLI/reports |
| Multi-user | ✅ | ❌ Single user |
| High availability | ✅ | ❌ Downtime OK |

---

## Summary: Cost Tiers

| Tier | Monthly Cost | Features |
|------|-------------|----------|
| **Minimum** | $10-20 | Basic scraping, manual processes |
| **Standard** | $35-80 | Automated bulk + scraping, caching |
| **Full** | $100-200 | Dashboard, multi-user, HA |
| **Commercial data** | $5,000+ | Third-party subscriptions |

### Savings vs Commercial Data

| Portfolio Size | Commercial Cost | Your System | Savings |
|---------------|-----------------|-------------|---------|
| 1K properties | $500-1,000/mo | $10-20/mo | 95%+ |
| 10K properties | $2,000-5,000/mo | $20-50/mo | 98%+ |
| 50K properties | $10,000+/mo | $50-100/mo | 99%+ |

---

## Action Items to Reduce Costs

```markdown
### Immediate (This Week)
- [ ] Implement caching layer (target 70%+ hit rate)
- [ ] Add tiered update frequency (critical/high/medium/low)
- [ ] Set up compression for stored HTML

### Short-term (This Month)
- [ ] Identify bulk data sources for top 10 counties
- [ ] Automate bulk data imports
- [ ] Implement auto-resolvers for common exceptions

### Long-term (This Quarter)
- [ ] Archive old history data
- [ ] Optimize database indexes
- [ ] Evaluate cheaper hosting options
```
