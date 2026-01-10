# Tax Data API Market Research

**Created:** January 10, 2026
**Purpose:** Competitive analysis and market opportunity assessment for a property tax data API service

---

## Executive Summary

The property data API market is **dominated by expensive enterprise players** (CoreLogic, ATTOM) with pricing that excludes small businesses and startups. A significant opportunity exists for an **affordable, tax-focused API** that:

1. Offers transparent, pay-per-use pricing
2. Specializes in **real-time tax data** (not just assessed values)
3. Targets underserved small/medium businesses
4. Provides current delinquent status, tax sale dates, and payment info

---

## Market Size

| Metric | Value | Source |
|--------|-------|--------|
| Global real estate market | $654 trillion by 2025 | Industry reports |
| AI-driven real estate market | $2.9B → $41.5B by 2033 | Market analysis |
| Annual growth rate | 30.5% | PropTech reports |
| US brokerages using AI tools | 75% | Industry surveys |
| US property records | 155-180 million | CoreLogic, ATTOM |

**Total Addressable Market (TAM):** Property data services represent a multi-billion dollar market, with ATTOM alone generating significant revenue from 158M+ property records.

---

## Competitor Analysis

### Tier 1: Enterprise Giants ($$$$)

#### CoreLogic
| Factor | Details |
|--------|---------|
| **Coverage** | 155M+ US properties, 200+ data sources |
| **Pricing** | Enterprise only, annual contracts, 6-figures typical |
| **Strengths** | Most comprehensive data, industry standard |
| **Weaknesses** | Cost prohibitive for SMBs, complex contracts |
| **Target** | Large lenders, servicers, government |

> "CoreLogic is a major enterprise player, and cost can be a barrier for smaller teams. Subscription fees and per-call costs can quickly exceed budgets."

#### ATTOM Data
| Factor | Details |
|--------|---------|
| **Coverage** | 158M+ properties, 70 billion rows, 9,000 attributes |
| **Pricing** | Enterprise, custom quotes, often 6-figures annually |
| **Strengths** | Comprehensive, acquired Estated, good documentation |
| **Weaknesses** | Expensive, negotiating contracts is complex |
| **Target** | Enterprise proptech, lenders, investors |

> "ATTOM's enterprise contracts are well-known to be expensive, often reaching into six figures annually."

#### First American DataTree
| Factor | Details |
|--------|---------|
| **Coverage** | All US properties, 7 billion document images |
| **Pricing** | Premium, per-search fees |
| **Strengths** | Direct county data, document images, title data |
| **Weaknesses** | Premium pricing |
| **Target** | Title companies, lenders, legal |

---

### Tier 2: Mid-Market APIs ($$-$$$)

#### BatchData
| Factor | Details |
|--------|---------|
| **Coverage** | 150M+ properties |
| **Pricing** | **Published pricing** - $500-$5,000/month |
| **Per Record** | $0.01-$0.025 depending on volume |
| **Strengths** | No contracts, skip tracing, transparent pricing |
| **Plans** | Lite: $500/mo (20K records), Growth: $1,500/mo (100K), Pro: $2,500/mo (300K) |

**BatchData Pricing Breakdown:**
```
Lite:         $500/mo  → 20,000 records  → $0.025/record
Growth:     $1,500/mo  → 100,000 records → $0.015/record
Professional: $2,500/mo → 300,000 records → $0.0083/record
Scale:      $5,000/mo  → 500,000 records → $0.01/record
```

#### RealEstateAPI (REAPI)
| Factor | Details |
|--------|---------|
| **Coverage** | 159M properties nationwide |
| **Pricing** | Starts at $599/month, usage-based |
| **Strengths** | Developer-friendly, fast (sub-1s response), 99.9% uptime |
| **Weaknesses** | Not tax-focused |
| **Rating** | 4.9/5 stars (18 reviews) |

> "After trying 4 other API providers that did not perform as well, we chose RealEstateAPI.com - implementation easy and pricing very reasonable."

#### RentCast
| Factor | Details |
|--------|---------|
| **Coverage** | 140M+ property records |
| **Pricing** | Free tier (50 calls/mo), then paid plans |
| **Strengths** | Free tier available, rental estimates |
| **Weaknesses** | Focused on rentals, not tax data |

#### Estated (now ATTOM)
| Factor | Details |
|--------|---------|
| **Coverage** | 140M properties, 150 data points |
| **Pricing** | Started at $179/month, $0.02-$0.20 per record overage |
| **Status** | Acquired by ATTOM |

---

### Tier 3: Specialized Tax Data Providers

#### TaxNetUSA
| Factor | Details |
|--------|---------|
| **Coverage** | 300+ counties (all TX and FL) |
| **Pricing** | Custom quotes, credit-based system |
| **Strengths** | **Tax-focused**, real-time delinquent data, direct from counties |
| **Weaknesses** | Limited geographic coverage, opaque pricing |
| **Data** | Delinquent tax bills, estimated annual taxes, assessor/collector data |

> "Real-time machine access via web services using XML or JSON queries and responses."

#### TaxLates
| Factor | Details |
|--------|---------|
| **Coverage** | Nationwide |
| **Pricing** | Self-serve platform (pricing not public) |
| **Strengths** | Real-time tax delinquent leads |
| **Data** | Ownership, lat/long, loan types, sales history, comps |

#### First American TaxSource
| Factor | Details |
|--------|---------|
| **Coverage** | Nationwide, city and county level |
| **Pricing** | Enterprise (DataTree parent) |
| **Strengths** | Aggregates assessor + tax authority + tax bill data |
| **Weaknesses** | Enterprise pricing |

---

### Tier 4: Disruptors & New Entrants

#### Realie.ai
| Factor | Details |
|--------|---------|
| **Coverage** | 180M parcels |
| **Approach** | **AI agents scrape directly from public sources** |
| **Pricing** | "Best pricing relative to breadth of data" |
| **Strengths** | No intermediary fees, sub-10ms latency, parcel boundaries |
| **Weaknesses** | New entrant, building trust |

> "Recognizing the limitations of traditional data sourcing methods, Realie has adopted a novel approach by directly collecting property data from public sources using AI agents. This strategy eliminates the need for intermediaries."

**Realie's Approach is Similar to Yours:**
- Scrapes public county data directly
- Uses AI/automation instead of buying from aggregators
- Passes cost savings to customers
- Covers assessor + tax data

---

## Pricing Comparison Summary

| Provider | Entry Price | Per Record | Annual Cost (50K records/mo) |
|----------|-------------|------------|------------------------------|
| CoreLogic | Enterprise only | Unknown | $50,000-$200,000+ |
| ATTOM | Enterprise only | Unknown | $20,000-$100,000+ |
| DataTree | Custom | $1-5 | $600,000-$3,000,000 |
| BatchData | $500/mo | $0.01-$0.025 | $6,000-$30,000 |
| REAPI | $599/mo | Usage-based | $7,200+ |
| RentCast | Free tier | Varies | $1,200+ |
| TaxNetUSA | Custom | Unknown | Unknown |
| **Your API** | $0-$199/mo | $0.03-$0.50 | **$1,800-$30,000** |

---

## Market Gaps & Opportunities

### Gap 1: Affordable Tax-Focused API
**Problem:** Most APIs focus on property characteristics and valuations. Tax-specific data (current delinquent status, tax sale dates, payment history) is hard to get affordably.

**Opportunity:** Specialized tax data API at SMB-friendly prices.

### Gap 2: Real-Time Tax Data
**Problem:** Enterprise providers often have stale tax data (weeks/months old). Tax sale dates and delinquent status can change daily.

**Opportunity:** On-demand scraping for fresh data, with cache for cost efficiency.

### Gap 3: Transparent Pricing
**Problem:** "Contact sales" is the norm. Small businesses can't budget without knowing costs.

**Opportunity:** Published, transparent pricing like BatchData.

### Gap 4: Town-Level Tax Jurisdictions
**Problem:** Most APIs assume county-level taxation. New England states (CT, MA, NJ, etc.) have town-level taxation that's poorly supported.

**Opportunity:** Specialized coverage for town-tax states.

### Gap 5: Pay-Per-Use Without Minimums
**Problem:** Most require $500+/month minimums. Occasional users (lawyers, small investors) priced out.

**Opportunity:** True pay-per-use from $0.

---

## Target Customer Segments

### Segment 1: Real Estate Investors (High Volume)
| Attribute | Details |
|-----------|---------|
| **Size** | 10,000+ nationally |
| **Need** | Tax delinquent leads, assessed values, owner info |
| **Current Solution** | TaxLates, ListSource, manual research |
| **Pain** | Expensive data, stale leads |
| **Willingness to Pay** | $100-$500/month |

### Segment 2: Private Lenders & Servicers (Enterprise)
| Attribute | Details |
|-----------|---------|
| **Size** | 500+ companies |
| **Need** | Portfolio monitoring, tax escrow verification, delinquent alerts |
| **Current Solution** | CoreLogic, ATTOM, manual |
| **Pain** | $20K+/year for data, integration complexity |
| **Willingness to Pay** | $1,000-$10,000/month |

### Segment 3: Title & Settlement Companies
| Attribute | Details |
|-----------|---------|
| **Size** | 5,000+ companies |
| **Need** | Tax cert verification, lien searches |
| **Current Solution** | DataTree, TaxNetUSA, direct county research |
| **Pain** | Per-search fees add up, slow manual process |
| **Willingness to Pay** | $200-$1,000/month |

### Segment 4: PropTech Startups
| Attribute | Details |
|-----------|---------|
| **Size** | 1,000+ companies |
| **Need** | Property data for apps, tax estimates |
| **Current Solution** | ATTOM, REAPI, scraping |
| **Pain** | Enterprise APIs too expensive for MVP |
| **Willingness to Pay** | $100-$500/month initially, scales with success |

### Segment 5: Law Firms (Foreclosure, Bankruptcy)
| Attribute | Details |
|-----------|---------|
| **Size** | 10,000+ firms |
| **Need** | Tax lien status, delinquent amounts, redemption deadlines |
| **Current Solution** | Manual county research, paralegals |
| **Pain** | Labor-intensive, $50-$100/property in labor |
| **Willingness to Pay** | $0.50-$2/property lookup |

---

## Competitive Positioning

### Your Unique Value Proposition

```
"Real-time property tax data at 90% less than enterprise providers.
Fresh data scraped on-demand. No contracts. Pay only for what you use."
```

### Positioning Matrix

```
                        TAX-FOCUSED
                            ↑
                            |
           TaxNetUSA    [YOUR API]
           TaxLates         ★
                            |
    EXPENSIVE ←─────────────┼──────────────→ AFFORDABLE
                            |
           CoreLogic    BatchData
           ATTOM        REAPI
           DataTree     RentCast
                            |
                            ↓
                    GENERAL PROPERTY DATA
```

### Differentiation Strategy

| Factor | Enterprise (CoreLogic/ATTOM) | Mid-Market (BatchData) | Your API |
|--------|------------------------------|------------------------|----------|
| Pricing | $$$$ | $$ | $ |
| Tax Focus | General | General | **Specialized** |
| Freshness | Days/weeks | Daily | **Real-time option** |
| Contracts | Annual | Monthly | **None** |
| Minimums | Yes | $500/mo | **$0** |
| Town-tax coverage | Poor | Poor | **Full** |

---

## Revenue Model Recommendation

### Revised Pricing Based on Research

| Tier | Monthly Fee | Included | Overage | Target |
|------|-------------|----------|---------|--------|
| **Free** | $0 | 50 lookups | N/A | Developers, trial |
| **Starter** | $49 | 500 lookups | $0.15/ea | Small investors |
| **Growth** | $199 | 3,000 lookups | $0.08/ea | Active investors, small lenders |
| **Business** | $499 | 10,000 lookups | $0.05/ea | Title companies, servicers |
| **Enterprise** | $1,999+ | 50,000+ | $0.02-$0.03 | Large lenders, portfolios |

### Per-Lookup Pricing Comparison

| Volume | BatchData | Your API | Savings |
|--------|-----------|----------|---------|
| 1,000/mo | $0.025 | $0.10 | Premium for tax focus |
| 10,000/mo | $0.015 | $0.05 | 67% cheaper |
| 50,000/mo | $0.01 | $0.03 | 67% cheaper |
| 100,000/mo | $0.01 | $0.02 | 50% cheaper |

*Note: Your API charges more at low volume (covers costs) but beats competitors at scale.*

---

## Technical Approach Validation

### Realie.ai Validates Your Model

Realie.ai is already doing what you're planning:
- ✅ Scraping directly from county sources
- ✅ Using AI/automation instead of buying data
- ✅ Offering affordable pricing
- ✅ Covering 180M parcels

**Key Difference:** You can focus specifically on **tax data** (delinquent status, tax sales, current bills) which Realie doesn't emphasize.

### Success Factors from Research

1. **Latency Matters:** Realie achieves sub-10ms latency vs. 440ms for ATTOM/RentCast
2. **Developer Experience:** REAPI's Discord community and docs cited as advantages
3. **Transparent Pricing:** BatchData's published pricing is a competitive advantage
4. **Free Tier:** RentCast's 50 free calls helps onboard developers

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Rate limiting/blocking** | High | Aggressive caching, respectful scraping, fallback to manual |
| **Data accuracy** | Medium | Multiple source verification, human QA for flagged items |
| **Geographic coverage gaps** | Medium | Prioritize high-volume states, expand based on demand |
| **Competitor response** | Low | Speed to market, niche focus, customer relationships |
| **Legal/TOS issues** | Low | Public records, reasonable use, no redistribution of raw data |

---

## Go-to-Market Recommendations

### Phase 1: MVP (Months 1-3)
- Launch with FL + TX coverage (your strongest scraper coverage)
- Free tier (50 lookups) + Starter tier ($49)
- Target: 100 beta users
- Focus: Validate pricing, gather feedback

### Phase 2: Growth (Months 4-6)
- Expand to top 10 states
- Add Growth + Business tiers
- Content marketing: "How to research property taxes" guides
- Target: 500 paying customers, $20K MRR

### Phase 3: Scale (Months 7-12)
- Full US coverage
- Enterprise tier with SLAs
- Partnerships: Integrate with CRMs, loan origination systems
- Target: 2,000 customers, $100K MRR

### Phase 4: Expand (Year 2)
- Add adjacent data (liens, foreclosures, permits)
- White-label option for platforms
- Target: $500K+ MRR

---

## Key Takeaways

1. **Market is hungry for affordable tax data** - Enterprise pricing excludes most potential users

2. **Scraping-based approach is validated** - Realie.ai proves the model works

3. **Tax specialization is underserved** - Most APIs focus on valuations, not current tax status

4. **Transparent pricing wins customers** - BatchData's model is widely praised

5. **Town-tax states are a gap** - NE states poorly served by existing APIs

6. **Real-time data is a differentiator** - Stale data is a common complaint

---

## Sources

- [ScrapingBee - Best Real Estate APIs 2026](https://www.scrapingbee.com/blog/best-real-estate-apis-for-developers/)
- [ATTOM Data Solutions](https://www.attomdata.com/)
- [Realie.ai - Breaking the Data Monopoly](https://blog.realie.ai/blog/breaking-the-data-monopoly-how-realie-is-disrupting-the-property-data-industry)
- [BatchData Pricing](https://batchdata.io/pricing)
- [RealEstateAPI](https://www.realestateapi.com/)
- [TaxNetUSA](https://www.taxnetusa.com/)
- [Datarade - ATTOM Profile](https://datarade.ai/data-providers/attom/profile)
- [G2 - CoreLogic Alternatives](https://www.g2.com/products/corelogic-realist/competitors/alternatives)
