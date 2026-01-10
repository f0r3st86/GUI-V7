# Tax Research API - Commercial Product Design

**Created:** January 10, 2026
**Purpose:** Design a scalable, monetizable Tax Research API service

---

## Product Vision

### The Opportunity

| Current Market | Annual Cost | Pain Points |
|----------------|-------------|-------------|
| CoreLogic | $20,000-100,000+ | Expensive, contracts, stale data |
| ATTOM | $15,000-50,000+ | Limited coverage, complex pricing |
| DataTree | $1-5/property | Adds up quickly, manual |
| Manual research | $5-15/property (labor) | Slow, inconsistent |

### Your Advantage

| Factor | Competitors | Your API |
|--------|-------------|----------|
| Data freshness | Days/weeks old | Real-time scraping |
| Coverage | Major metros | Nationwide (via scraping) |
| Pricing | $$$$$ | Competitive |
| Flexibility | Rigid packages | Pay-per-use |
| Updates | Periodic | On-demand refresh |

---

## API Product Tiers

### Tier 1: Basic (Self-Serve)
```
Target: Small investors, wholesalers, individuals
Pricing: $0.25-0.50 per property lookup
Features:
- Single property lookups
- Basic tax data (assessed value, tax amount, delinquent)
- Owner information
- 24-hour cached data
- Rate limit: 100 requests/day
```

### Tier 2: Professional
```
Target: Lenders, real estate agents, title companies
Pricing: $99-299/month + $0.10-0.20 per property
Features:
- Everything in Basic
- Bulk lookups (up to 1,000/batch)
- Sales history
- Property characteristics
- Fresh data (scrape on demand)
- Rate limit: 1,000 requests/day
- API key management
- Webhook notifications
```

### Tier 3: Enterprise
```
Target: Hedge funds, servicers, large lenders, data aggregators
Pricing: $999-4,999/month + volume discounts
Features:
- Everything in Professional
- Unlimited requests (fair use)
- Bulk file uploads (50K+ properties)
- Dedicated scraping priority
- Custom data fields
- SLA guarantees (99.9% uptime)
- Dedicated support
- White-label option
- Webhook + streaming updates
```

### Tier 4: Reseller/White-Label
```
Target: Software companies, platforms
Pricing: Custom (revenue share or per-call)
Features:
- Everything in Enterprise
- White-label API
- Custom domains
- Co-branded documentation
- Reseller portal
- Usage analytics
```

---

## API Architecture

### Multi-Tenant Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                               │
│    (Rate Limiting, Auth, Routing, Usage Metering)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Tenant A   │  │   Tenant B   │  │   Tenant C   │          │
│  │  (Basic)     │  │ (Pro)        │  │ (Enterprise) │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   SHARED SERVICES                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │ Scraper │  │  Cache  │  │  Queue  │  │ Storage │    │   │
│  │  │ Pool    │  │  Layer  │  │ System  │  │         │    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 SHARED DATA LAYER                        │   │
│  │   (Bulk data, jurisdiction mappings, scraper configs)   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (Multi-Tenant)

```sql
-- Tenants (customers)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL,  -- 'basic', 'professional', 'enterprise'

    -- Billing
    stripe_customer_id VARCHAR(100),
    billing_email VARCHAR(255),

    -- Limits based on plan
    rate_limit_per_minute INTEGER DEFAULT 10,
    rate_limit_per_day INTEGER DEFAULT 100,
    monthly_quota INTEGER,
    bulk_upload_enabled BOOLEAN DEFAULT FALSE,
    max_batch_size INTEGER DEFAULT 10,

    -- Settings
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of API key
    key_prefix VARCHAR(8) NOT NULL,  -- First 8 chars for identification
    name VARCHAR(100),

    -- Permissions
    scopes TEXT[],  -- ['read', 'bulk', 'refresh']

    -- Limits (override tenant defaults)
    rate_limit_override INTEGER,

    -- Status
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);

-- Usage tracking (for billing)
CREATE TABLE usage_records (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    api_key_id UUID REFERENCES api_keys(id),

    -- What was used
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    properties_queried INTEGER DEFAULT 1,

    -- Billing
    billable_units INTEGER DEFAULT 1,
    unit_type VARCHAR(50),  -- 'property_lookup', 'bulk_upload', 'refresh'

    -- Request info
    request_id UUID,
    response_status INTEGER,
    response_time_ms INTEGER,

    -- For analytics
    state_code CHAR(2),
    county VARCHAR(100),
    cache_hit BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partition by month for performance
CREATE TABLE usage_records_2026_01 PARTITION OF usage_records
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE INDEX idx_usage_tenant_date ON usage_records(tenant_id, created_at);
CREATE INDEX idx_usage_billing ON usage_records(tenant_id, created_at, billable_units);

-- Monthly aggregates for billing
CREATE MATERIALIZED VIEW monthly_usage AS
SELECT
    tenant_id,
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS total_requests,
    SUM(billable_units) AS billable_units,
    SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS cache_hits,
    AVG(response_time_ms) AS avg_response_time
FROM usage_records
GROUP BY tenant_id, DATE_TRUNC('month', created_at);
```

---

## API Endpoints

### Authentication

```
All requests require API key in header:
Authorization: Bearer txr_live_abc123xyz...

Or as query param (less secure):
?api_key=txr_live_abc123xyz...
```

### Core Endpoints

```yaml
# Single Property Lookup
GET /v1/properties/{parcel_id}
GET /v1/properties/search?address={address}&state={state}

Response:
{
  "parcel_id": "01-2345-678-9012",
  "address": "123 Main St",
  "city": "Miami",
  "state": "FL",
  "zip": "33101",
  "county": "Miami-Dade",

  "owner": {
    "name": "SMITH JOHN & JANE",
    "mailing_address": "123 Main St, Miami FL 33101"
  },

  "values": {
    "assessed_total": 285000,
    "assessed_land": 85000,
    "assessed_improvement": 200000,
    "market_value": 320000,
    "assessment_year": 2025
  },

  "taxes": {
    "annual_amount": 4521.00,
    "tax_year": 2025,
    "delinquent_amount": 0,
    "is_delinquent": false,
    "tax_sale_scheduled": false
  },

  "characteristics": {
    "property_type": "Single Family",
    "year_built": 1985,
    "living_area_sf": 1850,
    "lot_size_sf": 7500,
    "bedrooms": 3,
    "bathrooms": 2
  },

  "metadata": {
    "data_source": "miami-dade-pa",
    "last_updated": "2026-01-10T14:30:00Z",
    "freshness": "fresh",  // or "cached", "stale"
    "confidence": 0.98
  }
}

# Bulk Lookup (Professional+)
POST /v1/properties/bulk
{
  "properties": [
    {"parcel_id": "01-2345-678-9012", "state": "FL"},
    {"address": "456 Oak Ave", "city": "Tampa", "state": "FL"}
  ],
  "options": {
    "include_sales_history": true,
    "include_characteristics": true,
    "force_refresh": false
  }
}

Response:
{
  "request_id": "req_abc123",
  "status": "processing",  // or "completed"
  "total": 100,
  "completed": 0,
  "results_url": "/v1/bulk/{request_id}/results",
  "webhook_url": "https://your-site.com/webhook"  // Will POST when done
}

# Force Refresh (Professional+)
POST /v1/properties/{parcel_id}/refresh
{
  "priority": "normal"  // or "high" (Enterprise only)
}

Response:
{
  "status": "queued",
  "estimated_completion": "2026-01-10T14:35:00Z",
  "request_id": "ref_xyz789"
}

# Check Refresh Status
GET /v1/refresh/{request_id}

# Bulk File Upload (Enterprise)
POST /v1/bulk/upload
Content-Type: multipart/form-data
file: properties.csv

Response:
{
  "upload_id": "upl_abc123",
  "records_received": 50000,
  "status": "processing",
  "estimated_completion": "2026-01-11T06:00:00Z"
}

# Webhooks
POST /v1/webhooks
{
  "url": "https://your-site.com/tax-updates",
  "events": ["property.updated", "bulk.completed", "refresh.completed"],
  "secret": "whsec_..."
}

# Usage/Billing
GET /v1/usage
GET /v1/usage?start_date=2026-01-01&end_date=2026-01-31

Response:
{
  "period": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  },
  "usage": {
    "property_lookups": 4521,
    "bulk_lookups": 15000,
    "refreshes": 230,
    "cache_hit_rate": 0.72
  },
  "billing": {
    "plan": "professional",
    "base_fee": 199.00,
    "overage_units": 521,
    "overage_rate": 0.15,
    "overage_amount": 78.15,
    "total": 277.15
  }
}
```

### Coverage Endpoint

```yaml
# Check coverage before committing
GET /v1/coverage?state=FL
GET /v1/coverage?state=FL&county=Miami-Dade

Response:
{
  "state": "FL",
  "county": "Miami-Dade",
  "coverage": {
    "status": "full",  // "full", "partial", "manual_only", "none"
    "scraper_available": true,
    "bulk_data_available": true,
    "estimated_response_time_ms": 500,
    "data_fields_available": [
      "parcel_id", "owner", "values", "taxes", "characteristics", "sales_history"
    ],
    "last_bulk_update": "2026-01-05"
  }
}

# Full coverage map
GET /v1/coverage

Response:
{
  "states": {
    "FL": {"status": "full", "counties": 67},
    "TX": {"status": "full", "counties": 254},
    "CA": {"status": "partial", "counties": 58, "covered": 45},
    ...
  },
  "total_jurisdictions": 3143,
  "automated_coverage": 2100,
  "coverage_percent": 67
}
```

---

## Pricing Model

### Usage-Based Pricing

```typescript
const pricingTiers = {
  basic: {
    monthlyFee: 0,
    includedLookups: 0,
    perLookup: 0.50,
    bulkEnabled: false,
    refreshEnabled: false
  },

  professional: {
    monthlyFee: 199,
    includedLookups: 1000,
    perLookup: 0.15,         // After included
    bulkPerProperty: 0.08,
    refreshPerProperty: 0.25,
    bulkEnabled: true,
    refreshEnabled: true
  },

  enterprise: {
    monthlyFee: 1999,
    includedLookups: 25000,
    perLookup: 0.05,
    bulkPerProperty: 0.03,
    refreshPerProperty: 0.10,
    bulkEnabled: true,
    refreshEnabled: true,
    priorityRefresh: true,
    slaGuarantee: true
  }
};

// Volume discounts for Enterprise
const volumeDiscounts = {
  10000: 0.10,   // 10% off after 10K
  50000: 0.20,   // 20% off after 50K
  100000: 0.30,  // 30% off after 100K
  500000: 0.40   // 40% off after 500K
};
```

### Revenue Projections

| Customers | Plan | Monthly Revenue |
|-----------|------|-----------------|
| 100 | Basic (avg 200 lookups) | $10,000 |
| 50 | Professional | $15,000 |
| 10 | Enterprise | $25,000 |
| **Total** | | **$50,000/month** |

### Cost Structure

| Cost | Monthly | Notes |
|------|---------|-------|
| Infrastructure | $500-2,000 | Scales with usage |
| Scraping compute | $200-500 | Shared across tenants |
| Storage | $100-300 | Bulk data + cache |
| Support | $1,000-3,000 | 1-2 people part-time |
| **Total** | **$2,000-6,000** | |
| **Margin** | **88-96%** | |

---

## Technical Implementation

### Rate Limiting

```typescript
import { RateLimiter } from './rateLimiter';
import { Redis } from 'ioredis';

const redis = new Redis();

const rateLimiter = new RateLimiter({
  redis,
  keyPrefix: 'ratelimit:',

  // Tier-based limits
  tiers: {
    basic: {
      perMinute: 10,
      perHour: 100,
      perDay: 500
    },
    professional: {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000
    },
    enterprise: {
      perMinute: 300,
      perHour: 10000,
      perDay: 100000
    }
  }
});

// Middleware
async function rateLimitMiddleware(req, res, next) {
  const tenant = req.tenant;
  const key = `${tenant.id}`;

  const result = await rateLimiter.check(key, tenant.plan);

  if (!result.allowed) {
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', result.resetAt);
    res.setHeader('Retry-After', result.retryAfter);

    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`,
      upgrade_url: 'https://taxresearchapi.com/pricing'
    });
  }

  res.setHeader('X-RateLimit-Limit', result.limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetAt);

  next();
}
```

### Usage Metering

```typescript
class UsageMeter {
  async record(event: UsageEvent): Promise<void> {
    // Write to database
    await this.db.insert('usage_records', {
      tenant_id: event.tenantId,
      api_key_id: event.apiKeyId,
      endpoint: event.endpoint,
      method: event.method,
      properties_queried: event.propertiesQueried,
      billable_units: this.calculateBillableUnits(event),
      unit_type: event.unitType,
      response_status: event.status,
      response_time_ms: event.responseTime,
      cache_hit: event.cacheHit,
      state_code: event.stateCode,
      county: event.county
    });

    // Update real-time counters in Redis
    await this.redis.hincrby(
      `usage:${event.tenantId}:${this.getCurrentMonth()}`,
      event.unitType,
      event.propertiesQueried
    );

    // Check if approaching quota
    await this.checkQuotaAlerts(event.tenantId);
  }

  private calculateBillableUnits(event: UsageEvent): number {
    // Cache hits might be free or discounted
    if (event.cacheHit && event.tenant.plan !== 'enterprise') {
      return Math.ceil(event.propertiesQueried * 0.5); // 50% discount
    }

    return event.propertiesQueried;
  }

  async getMonthlyUsage(tenantId: string): Promise<UsageSummary> {
    const month = this.getCurrentMonth();
    const usage = await this.redis.hgetall(`usage:${tenantId}:${month}`);

    return {
      property_lookups: parseInt(usage.property_lookup || '0'),
      bulk_lookups: parseInt(usage.bulk_lookup || '0'),
      refreshes: parseInt(usage.refresh || '0'),
      total_billable: parseInt(usage.total_billable || '0')
    };
  }
}
```

### Billing Integration (Stripe)

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class BillingService {
  async createSubscription(tenantId: string, plan: string): Promise<void> {
    const tenant = await this.db.getTenant(tenantId);

    // Create or get Stripe customer
    let customerId = tenant.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.billing_email,
        metadata: { tenant_id: tenantId }
      });
      customerId = customer.id;
      await this.db.updateTenant(tenantId, { stripe_customer_id: customerId });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: this.getPriceId(plan) }],
      metadata: { tenant_id: tenantId }
    });
  }

  async reportUsage(tenantId: string): Promise<void> {
    const tenant = await this.db.getTenant(tenantId);
    const usage = await this.usageMeter.getMonthlyUsage(tenantId);
    const plan = this.pricingTiers[tenant.plan];

    // Calculate overage
    const overage = Math.max(0, usage.total_billable - plan.includedLookups);

    if (overage > 0) {
      // Report to Stripe for usage-based billing
      await stripe.subscriptionItems.createUsageRecord(
        tenant.stripe_subscription_item_id,
        {
          quantity: overage,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'set'
        }
      );
    }
  }

  // Run daily to report usage
  async dailyUsageReport(): Promise<void> {
    const tenants = await this.db.getActiveTenantsWithUsage();
    for (const tenant of tenants) {
      await this.reportUsage(tenant.id);
    }
  }
}
```

---

## Infrastructure for Scale

### Recommended Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CDN/Edge: Cloudflare (free tier, then Pro $20/mo)              │
│     ↓                                                            │
│  Load Balancer: Nginx or Cloud LB                                │
│     ↓                                                            │
│  API Servers: 2-4 instances                                      │
│  - Node.js/Bun                                                   │
│  - Auto-scaling based on load                                    │
│     ↓                                                            │
│  Cache: Redis (Upstash free tier, then $10+/mo)                 │
│     ↓                                                            │
│  Database: PostgreSQL (Supabase/Neon free, then $25+/mo)        │
│     ↓                                                            │
│  Queue: BullMQ (Redis-based, included above)                    │
│     ↓                                                            │
│  Scraper Workers: 2-5 instances (can be same servers)           │
│     ↓                                                            │
│  Object Storage: Cloudflare R2 (free 10GB, cheap after)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Estimated Monthly Cost:
- Low volume (1K customers): $100-300/mo
- Medium volume (10K customers): $500-1,500/mo
- High volume (100K+ requests/day): $2,000-5,000/mo
```

### Auto-Scaling Rules

```typescript
const scalingRules = {
  api_servers: {
    min: 2,
    max: 10,
    scale_up_threshold: 70,    // CPU %
    scale_down_threshold: 30,
    cooldown_seconds: 300
  },

  scraper_workers: {
    min: 2,
    max: 20,
    scale_based_on: 'queue_depth',
    scale_up_threshold: 1000,  // Queue items
    scale_down_threshold: 100
  }
};
```

---

## Go-to-Market Strategy

### Phase 1: Beta (Month 1-3)
```
- Launch with 10-20 beta customers (free)
- Focus on feedback and reliability
- Build coverage for top 20 states
- No SLA, best-effort support
```

### Phase 2: Soft Launch (Month 4-6)
```
- Launch Basic and Professional tiers
- Target: 100 paying customers
- Focus on self-serve onboarding
- Build documentation and examples
```

### Phase 3: Growth (Month 7-12)
```
- Launch Enterprise tier
- Add white-label option
- Target partnerships (title companies, lenders)
- Marketing: SEO, content, industry events
```

### Phase 4: Scale (Year 2+)
```
- Expand coverage to all US counties
- Add more data types (liens, foreclosures, permits)
- International expansion
- Acquisition target or Series A
```

---

## Competitive Positioning

### Marketing Messages

```
"Real-time property tax data at a fraction of the cost"

"Why pay $5 per property when you can pay $0.05?"

"The API-first alternative to CoreLogic"

"Fresh data, not stale reports"
```

### Key Differentiators

| Feature | CoreLogic/ATTOM | Your API |
|---------|-----------------|----------|
| Pricing | Enterprise only | Pay-per-use from $0 |
| Data freshness | Days/weeks | Real-time option |
| Integration | Heavy | Simple REST API |
| Minimum commitment | Annual contract | None |
| Coverage | Preset | Expandable on request |

---

## Summary

### Business Model

| Metric | Year 1 Target | Year 2 Target |
|--------|---------------|---------------|
| Customers | 200 | 1,000 |
| MRR | $50,000 | $250,000 |
| ARR | $600,000 | $3,000,000 |
| Gross Margin | 85% | 90% |

### Success Metrics

```
- API uptime: 99.9%
- Average response time: <500ms
- Coverage: 70%+ US jurisdictions automated
- Customer churn: <5% monthly
- NPS: >50
```

### Next Steps

1. Build MVP API with core endpoints
2. Implement usage metering and billing
3. Launch beta program (10-20 customers)
4. Iterate based on feedback
5. Launch publicly with Basic + Professional tiers
