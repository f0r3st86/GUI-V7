# Scraping Rate Limits & Free Data Sources

**Created:** January 10, 2026
**Purpose:** Document rate limiting strategies and confirm free vs paid data sources

---

## Critical Constraints

1. **Must be FREE** - No paid APIs, subscriptions, or per-search fees
2. **Must respect rate limits** - Avoid getting blocked
3. **Must be sustainable** - Can research hundreds of properties per deal

---

## Free vs Paid Data Sources

### ✅ CONFIRMED FREE Sources

| Source | Type | Cost | Notes |
|--------|------|------|-------|
| **County Assessor websites** | Public records | Free | Taxpayer-funded, public access |
| **County Tax Collector websites** | Public records | Free | Taxpayer-funded, public access |
| **Vision Government Solutions** | Public portal | Free | Counties pay, public access free |
| **qPublic** | Public portal | Free | Counties pay, public access free |
| **True Automation (TX)** | Public portal | Free | CADs pay, public access free |
| **Beacon/Schneider** | Public portal | Free | Counties pay, public access free |
| **Patriot Properties** | Public portal | Free | Towns pay, public access free |
| **County GIS portals** | Public records | Free | Taxpayer-funded |
| **State data portals** | Public records | Free | Open data initiatives |

### ❌ PAID Sources (Avoid)

| Source | Cost | Notes |
|--------|------|-------|
| CoreLogic | $$$$ | Subscription, per-property fees |
| ATTOM Data | $$$$ | Subscription |
| Black Knight | $$$$ | Subscription |
| DataTree/First American | $$ | Per-search fees |
| PropertyShark | $$ | Subscription |
| RealtyTrac | $$ | Subscription |
| Zillow API | Restricted | Not for commercial use |
| Redfin API | Restricted | Not available |

### ⚠️ GRAY AREA

| Source | Issue | Recommendation |
|--------|-------|----------------|
| **County bulk downloads** | Some charge fees | Check each county - many free |
| **State bulk data** | Some charge | FL, TX usually free; others vary |
| **FOIA requests** | Time + possible fee | Use for bulk, not per-property |

---

## Rate Limiting Strategy

### The Golden Rule
```
Be a good citizen: Scrape slowly, cache aggressively, don't hammer servers.
```

### Rate Limits by Platform

| Platform | Recommended Delay | Max Requests/Hour | Notes |
|----------|------------------|-------------------|-------|
| **Vision** | 3-5 seconds | 60-100 | Generally permissive |
| **qPublic** | 3-5 seconds | 60-100 | Generally permissive |
| **True Automation** | 3-5 seconds | 60-100 | Varies by CAD |
| **Beacon** | 5-10 seconds | 30-60 | More restrictive |
| **County direct sites** | 5-10 seconds | 30-60 | Varies widely |
| **Unknown sites** | 10+ seconds | 20-30 | Start conservative |

### Delay Implementation

```typescript
const platformRateLimits: Record<string, RateLimitConfig> = {
  vision: {
    minDelayMs: 3000,        // 3 seconds between requests
    maxDelayMs: 5000,        // Randomize up to 5 seconds
    maxRequestsPerHour: 100,
    maxRequestsPerDay: 500,
    backoffMultiplier: 2,    // Double delay after rate limit hit
    maxBackoffMs: 60000      // Max 1 minute delay
  },
  qpublic: {
    minDelayMs: 3000,
    maxDelayMs: 5000,
    maxRequestsPerHour: 100,
    maxRequestsPerDay: 500,
    backoffMultiplier: 2,
    maxBackoffMs: 60000
  },
  trueautomation: {
    minDelayMs: 3000,
    maxDelayMs: 5000,
    maxRequestsPerHour: 80,
    maxRequestsPerDay: 400,
    backoffMultiplier: 2,
    maxBackoffMs: 60000
  },
  beacon: {
    minDelayMs: 5000,
    maxDelayMs: 10000,
    maxRequestsPerHour: 50,
    maxRequestsPerDay: 300,
    backoffMultiplier: 2,
    maxBackoffMs: 120000
  },
  county_direct: {
    minDelayMs: 5000,
    maxDelayMs: 10000,
    maxRequestsPerHour: 40,
    maxRequestsPerDay: 200,
    backoffMultiplier: 3,
    maxBackoffMs: 300000     // 5 minutes for unknown sites
  },
  default: {
    minDelayMs: 10000,       // Very conservative default
    maxDelayMs: 15000,
    maxRequestsPerHour: 20,
    maxRequestsPerDay: 100,
    backoffMultiplier: 3,
    maxBackoffMs: 600000
  }
};
```

### Rate Limiter Implementation

```typescript
class RateLimiter {
  private requestCounts: Map<string, { hourly: number; daily: number; lastReset: Date }> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private currentBackoff: Map<string, number> = new Map();

  async waitForSlot(platform: string): Promise<void> {
    const config = platformRateLimits[platform] || platformRateLimits.default;

    // Check if we've exceeded limits
    const counts = this.getOrInitCounts(platform);
    if (counts.hourly >= config.maxRequestsPerHour) {
      const waitTime = this.timeUntilHourReset(counts.lastReset);
      console.log(`Rate limit reached for ${platform}, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.resetHourlyCounts(platform);
    }

    // Calculate delay with randomization
    const baseDelay = config.minDelayMs;
    const randomExtra = Math.random() * (config.maxDelayMs - config.minDelayMs);
    const backoff = this.currentBackoff.get(platform) || 0;
    const totalDelay = baseDelay + randomExtra + backoff;

    // Wait since last request
    const lastRequest = this.lastRequestTime.get(platform) || 0;
    const elapsed = Date.now() - lastRequest;
    if (elapsed < totalDelay) {
      await this.sleep(totalDelay - elapsed);
    }

    // Update tracking
    this.lastRequestTime.set(platform, Date.now());
    counts.hourly++;
    counts.daily++;
  }

  onRateLimitHit(platform: string): void {
    const config = platformRateLimits[platform] || platformRateLimits.default;
    const current = this.currentBackoff.get(platform) || config.minDelayMs;
    const newBackoff = Math.min(current * config.backoffMultiplier, config.maxBackoffMs);
    this.currentBackoff.set(platform, newBackoff);
    console.warn(`Rate limit hit for ${platform}, backing off to ${newBackoff}ms`);
  }

  onSuccessfulRequest(platform: string): void {
    // Gradually reduce backoff on success
    const current = this.currentBackoff.get(platform) || 0;
    if (current > 0) {
      this.currentBackoff.set(platform, Math.floor(current * 0.9));
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Detection Avoidance (Ethical)

### What Gets You Blocked

| Behavior | Risk Level | Mitigation |
|----------|------------|------------|
| Too many requests too fast | HIGH | Rate limiting |
| Same User-Agent for all requests | MEDIUM | Rotate realistic UAs |
| Predictable request patterns | MEDIUM | Add randomization |
| Requesting same page repeatedly | MEDIUM | Cache results |
| No cookies/session handling | LOW | Maintain sessions |
| Ignoring robots.txt | MEDIUM | Respect it |

### Recommended Headers

```typescript
const getRequestHeaders = (): Record<string, string> => {
  // Rotate through realistic browser User-Agents
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
  ];

  return {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
  };
};
```

### Session Management

```typescript
class ScraperSession {
  private cookieJar: Map<string, string> = new Map();
  private sessionId: string;

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  async initSession(platform: string, baseUrl: string): Promise<void> {
    // Visit homepage first to get cookies
    const response = await fetch(baseUrl, {
      headers: getRequestHeaders()
    });

    // Extract and store cookies
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.parseCookies(setCookie);
    }

    // Wait before making actual requests
    await this.sleep(2000 + Math.random() * 3000);
  }

  getHeaders(): Record<string, string> {
    const headers = getRequestHeaders();
    if (this.cookieJar.size > 0) {
      headers['Cookie'] = Array.from(this.cookieJar.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    }
    return headers;
  }
}
```

---

## Caching Strategy

### Cache Everything, Refresh Strategically

```typescript
interface CacheConfig {
  // How long before data is considered stale
  staleDays: {
    propertyCharacteristics: 90,   // Rarely changes
    assessedValues: 365,           // Annual updates
    taxAmounts: 30,                // Can change with payments
    delinquentStatus: 7,           // Check weekly
    taxSaleStatus: 1,              // Check daily if flagged
    ownerInfo: 30,                 // Changes with sales
    salesHistory: 30               // New sales added
  };

  // Force refresh triggers
  forceRefreshOn: [
    'deal_cutoff',
    'bid_preparation',
    'user_request'
  ];
}
```

### Cache Storage

```typescript
interface CachedPropertyData {
  parcelId: string;
  jurisdiction: string;
  platform: string;

  // Cached data
  data: PropertyResearchData;

  // Cache metadata
  cachedAt: Date;
  expiresAt: Date;
  source: 'scrape' | 'manual' | 'import';
  sourceUrl: string;

  // Staleness by field
  fieldTimestamps: {
    [field: string]: Date;
  };
}

class PropertyCache {
  private cache: Map<string, CachedPropertyData> = new Map();
  private db: Database;

  async get(parcelId: string, jurisdiction: string): Promise<CachedPropertyData | null> {
    const key = `${jurisdiction}:${parcelId}`;

    // Check memory cache first
    if (this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      if (!this.isExpired(cached)) {
        return cached;
      }
    }

    // Check database cache
    const dbCached = await this.db.getCache(key);
    if (dbCached && !this.isExpired(dbCached)) {
      this.cache.set(key, dbCached);
      return dbCached;
    }

    return null;
  }

  async set(parcelId: string, jurisdiction: string, data: PropertyResearchData): Promise<void> {
    const key = `${jurisdiction}:${parcelId}`;
    const cached: CachedPropertyData = {
      parcelId,
      jurisdiction,
      platform: data.assessorSource || 'unknown',
      data,
      cachedAt: new Date(),
      expiresAt: this.calculateExpiry(data),
      source: 'scrape',
      sourceUrl: data.assessorUrl || data.taxCollectorUrl || '',
      fieldTimestamps: this.getFieldTimestamps(data)
    };

    this.cache.set(key, cached);
    await this.db.setCache(key, cached);
  }

  isStale(cached: CachedPropertyData, field?: string): boolean {
    if (field) {
      const fieldTime = cached.fieldTimestamps[field];
      const staleConfig = CacheConfig.staleDays[field as keyof typeof CacheConfig.staleDays] || 30;
      const staleDate = new Date(fieldTime);
      staleDate.setDate(staleDate.getDate() + staleConfig);
      return new Date() > staleDate;
    }

    return new Date() > cached.expiresAt;
  }

  // Get fields that need refresh
  getStaleFields(cached: CachedPropertyData): string[] {
    return Object.entries(cached.fieldTimestamps)
      .filter(([field, _]) => this.isStale(cached, field))
      .map(([field, _]) => field);
  }
}
```

---

## Request Queue System

### Queue with Priority and Rate Limiting

```typescript
interface ScrapeRequest {
  id: string;
  collateralId: number;
  parcelId?: string;
  jurisdiction: string;
  platform: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  requestedAt: Date;
  requestedBy?: number;  // User ID

  // For retries
  attempts: number;
  lastAttempt?: Date;
  lastError?: string;
}

class ScrapeQueue {
  private queues: Map<string, ScrapeRequest[]> = new Map(); // Per-platform queues
  private processing: Map<string, boolean> = new Map();
  private rateLimiter: RateLimiter;

  async add(request: ScrapeRequest): Promise<string> {
    const platform = request.platform;

    if (!this.queues.has(platform)) {
      this.queues.set(platform, []);
    }

    const queue = this.queues.get(platform)!;

    // Insert by priority
    const insertIndex = queue.findIndex(r =>
      this.getPriorityValue(r.priority) < this.getPriorityValue(request.priority)
    );

    if (insertIndex === -1) {
      queue.push(request);
    } else {
      queue.splice(insertIndex, 0, request);
    }

    // Start processing if not already
    this.processQueue(platform);

    return request.id;
  }

  private async processQueue(platform: string): Promise<void> {
    if (this.processing.get(platform)) {
      return; // Already processing
    }

    this.processing.set(platform, true);
    const queue = this.queues.get(platform) || [];

    while (queue.length > 0) {
      const request = queue.shift()!;

      try {
        // Wait for rate limit slot
        await this.rateLimiter.waitForSlot(platform);

        // Process request
        await this.processRequest(request);

        this.rateLimiter.onSuccessfulRequest(platform);

      } catch (error) {
        if (this.isRateLimitError(error)) {
          this.rateLimiter.onRateLimitHit(platform);
          // Re-queue with delay
          request.attempts++;
          if (request.attempts < 3) {
            queue.unshift(request); // Put back at front
          } else {
            await this.markFailed(request, 'Rate limit exceeded after 3 attempts');
          }
        } else if (this.isBlockedError(error)) {
          // Stop processing this platform temporarily
          console.error(`Blocked by ${platform}, pausing for 1 hour`);
          await this.sleep(3600000);
        } else {
          request.attempts++;
          request.lastError = error.message;
          if (request.attempts < 3) {
            queue.push(request); // Re-queue at end
          } else {
            await this.markFailed(request, error.message);
          }
        }
      }
    }

    this.processing.set(platform, false);
  }

  private getPriorityValue(priority: string): number {
    const values = { critical: 4, high: 3, normal: 2, low: 1 };
    return values[priority as keyof typeof values] || 0;
  }

  private isRateLimitError(error: any): boolean {
    return error.status === 429 ||
           error.message?.includes('rate limit') ||
           error.message?.includes('too many requests');
  }

  private isBlockedError(error: any): boolean {
    return error.status === 403 ||
           error.message?.includes('blocked') ||
           error.message?.includes('forbidden') ||
           error.message?.includes('captcha');
  }
}
```

---

## Practical Throughput Estimates

### With Conservative Rate Limits

| Platform | Requests/Hour | Properties/Hour | Properties/Day |
|----------|---------------|-----------------|----------------|
| Vision | 60 | 60 | 480 |
| qPublic | 60 | 60 | 480 |
| True Automation | 60 | 60 | 480 |
| Beacon | 40 | 40 | 320 |
| County Direct | 30 | 30 | 240 |

### For a Typical Deal (200 properties)

| Scenario | Time to Complete |
|----------|------------------|
| All same platform (Vision) | ~3-4 hours |
| Mixed platforms | ~4-6 hours |
| With caching (50% cached) | ~2-3 hours |
| Priority refresh only | ~1-2 hours |

### Recommended Workflow

```
1. Import deal → Queue all properties at LOW priority
2. Run overnight → ~8 hours = ~400 properties researched
3. Morning review → Researcher sees results
4. Flagged items → Queue at HIGH priority for immediate refresh
5. Before bid → Queue all at HIGH priority for final refresh
```

---

## Handling Blocks and Failures

### Graceful Degradation

```typescript
class ScraperWithFallback {
  async scrapeProperty(request: ScrapeRequest): Promise<PropertyResearchData | null> {
    const jurisdiction = await this.getJurisdiction(request.jurisdiction);

    // Try primary scraper
    try {
      const result = await this.tryScraper(jurisdiction.primaryPlatform, request);
      if (result) return result;
    } catch (error) {
      console.warn(`Primary scraper failed: ${error.message}`);
    }

    // Try fallback scrapers
    for (const fallback of jurisdiction.fallbackPlatforms || []) {
      try {
        const result = await this.tryScraper(fallback, request);
        if (result) return result;
      } catch (error) {
        console.warn(`Fallback ${fallback} failed: ${error.message}`);
      }
    }

    // Mark for manual research
    await this.markForManualResearch(request, 'All scrapers failed');
    return null;
  }
}
```

### Manual Research Fallback

```typescript
interface ManualResearchTask {
  id: string;
  collateralId: number;
  address: string;
  jurisdiction: string;

  // Quick links for researcher
  assessorUrl?: string;
  taxCollectorUrl?: string;
  gisUrl?: string;

  // Why manual is needed
  reason: string;        // 'scraper_blocked', 'no_scraper', 'captcha', etc.
  failedAttempts: number;

  // Assignment
  assignedTo?: number;
  assignedAt?: Date;
  status: 'pending' | 'assigned' | 'completed';

  // Research tips
  tips?: string;         // From jurisdiction config
}
```

---

## Robots.txt Compliance

### Check Before Scraping

```typescript
import robotsParser from 'robots-parser';

class RobotsChecker {
  private robotsCache: Map<string, { rules: any; fetchedAt: Date }> = new Map();

  async canScrape(url: string): Promise<boolean> {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.origin}/robots.txt`;

    // Check cache
    let robots = this.robotsCache.get(robotsUrl);
    if (!robots || this.isExpired(robots.fetchedAt, 24)) {
      try {
        const response = await fetch(robotsUrl);
        const text = await response.text();
        robots = {
          rules: robotsParser(robotsUrl, text),
          fetchedAt: new Date()
        };
        this.robotsCache.set(robotsUrl, robots);
      } catch {
        // No robots.txt = assume allowed
        return true;
      }
    }

    // Check if our path is allowed
    return robots.rules.isAllowed(url, 'PropertyResearchBot');
  }

  // Get crawl delay if specified
  getCrawlDelay(baseUrl: string): number | null {
    const robots = this.robotsCache.get(`${baseUrl}/robots.txt`);
    if (!robots) return null;

    return robots.rules.getCrawlDelay('PropertyResearchBot') ||
           robots.rules.getCrawlDelay('*');
  }
}
```

---

## Cost Summary

### Total Cost: $0

| Item | Cost | Notes |
|------|------|-------|
| Assessor websites | $0 | Public records |
| Tax collector websites | $0 | Public records |
| Vision/qPublic/etc portals | $0 | Free public access |
| Server costs | $0* | Runs on existing infrastructure |
| Development time | Internal | Your time |

*Assuming you have existing server infrastructure

### What You're NOT Paying For

| Service | Typical Cost | You Pay |
|---------|-------------|---------|
| CoreLogic subscription | $500-2000/mo | $0 |
| Per-property data fees | $1-5/property | $0 |
| API access fees | $0.10-1.00/call | $0 |
| Bulk data purchases | $1000s | $0 |

---

## Implementation Checklist

```markdown
### Phase 1: Infrastructure
- [ ] Rate limiter with per-platform configs
- [ ] Request queue with priorities
- [ ] Cache layer (memory + database)
- [ ] Robots.txt checker
- [ ] Session/cookie management

### Phase 2: Scrapers
- [ ] Vision adapter (NE states)
- [ ] qPublic adapter (SE states)
- [ ] True Automation adapter (TX)
- [ ] Generic county adapter (fallback)

### Phase 3: Workflow
- [ ] Manual research task queue
- [ ] Researcher dashboard
- [ ] Quick links for manual research
- [ ] Status tracking and reporting

### Phase 4: Monitoring
- [ ] Success/failure rates per platform
- [ ] Average response times
- [ ] Block/rate limit alerts
- [ ] Queue depth monitoring
```

---

## Summary

| Requirement | Solution |
|-------------|----------|
| **Free** | All sources are public records, $0 cost |
| **Rate limited** | 3-10 second delays, per-platform configs |
| **Sustainable** | Queue system, caching, overnight batch processing |
| **Reliable** | Fallback scrapers, manual research queue |
| **Up-to-date** | Configurable staleness, on-demand refresh |

**Realistic throughput:** ~400-500 properties/day with conservative rate limits

**For a 200-property deal:**
- Initial research: Run overnight (~4-6 hours)
- Refresh before bid: ~2-3 hours
- Priority items: Immediate (~minutes each)
