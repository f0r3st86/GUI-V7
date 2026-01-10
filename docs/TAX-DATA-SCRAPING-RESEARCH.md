# Tax Data Scraping Research

**Created:** January 10, 2026
**Purpose:** Identify states and platforms where property tax data can be programmatically accessed

---

## Scraping Feasibility Categories

| Category | Description | Approach |
|----------|-------------|----------|
| **A - Official API** | State/county provides API | Direct API integration |
| **B - Open Data Portal** | Bulk downloads available | Periodic data refresh |
| **C - Common Vendor Platform** | Standardized third-party software | Build one scraper, use for many |
| **D - Consistent Structure** | No API but predictable HTML | Custom scraper per county |
| **E - Difficult/Blocked** | Anti-scraping, CAPTCHAs, etc. | Manual only |

---

## Category A: States with Official APIs or Data Portals

### Florida
```
Source: County Property Appraisers + FL Dept of Revenue
API: Varies by county, many have REST APIs
Bulk Data: FL DOR provides statewide parcel data annually
URL: https://floridarevenue.com/property/Pages/DataPortal.aspx

Counties with APIs:
- Miami-Dade: REST API available
- Broward: API through BSA
- Palm Beach: PAPA API
- Orange: API available
- Hillsborough: API endpoints

Scraping Feasibility: HIGH
Notes: Best state for programmatic access
```

### Texas
```
Source: Central Appraisal Districts (CAD)
API: Some CADs have APIs, most use True Automation or Tyler
Bulk Data: Some CADs offer bulk downloads
URL: Varies by county

Key Platforms:
- True Automation (trueproperty.com): ~100+ counties
- Tyler Technologies: Major counties
- Esri-based GIS: Many counties

Scraping Feasibility: HIGH (via vendor platforms)
Notes: True Automation platform is very consistent
```

### California
```
Source: County Assessors
API: Limited official APIs
Bulk Data: Some counties offer bulk downloads
Open Data: Many counties on Socrata/OpenData platforms

Counties with Open Data:
- Los Angeles: data.lacounty.gov (Socrata)
- San Francisco: datasf.org
- San Diego: sandiegocounty.gov/opendata
- Sacramento: data portals available

Scraping Feasibility: MEDIUM-HIGH
Notes: Large counties have good access, rural varies
```

### New York (Outside NYC)
```
Source: ORPS (Office of Real Property Tax Services)
API: ORPS provides statewide data
Bulk Data: YES - Assessment roll data available
URL: https://www.tax.ny.gov/research/property/

Data Available:
- Assessment roll data by municipality
- Sales data
- Equalization rates

Scraping Feasibility: HIGH for assessment data
Notes: Tax collection still fragmented by municipality
```

### New York City
```
Source: NYC Department of Finance
API: NYC Open Data (Socrata)
Bulk Data: YES - Very comprehensive
URL: https://data.cityofnewyork.us/

Datasets:
- Property Valuation and Assessment Data
- DOF Property Tax Bills
- ACRIS (deeds/mortgages)
- Property Sales

Scraping Feasibility: VERY HIGH
Notes: One of the best open data portals in the country
```

### Georgia
```
Source: Georgia Department of Revenue + Counties
API: GA Taxpayer Portal has some API access
Bulk Data: Statewide digest available
URL: https://etax.dor.ga.gov/

Scraping Feasibility: MEDIUM-HIGH
Notes: Good statewide coordination
```

### North Carolina
```
Source: County Tax Offices
Platform: Many counties use Farragut Systems or Harris
Bulk Data: Some counties offer downloads
GIS: Most counties have excellent GIS portals

Scraping Feasibility: MEDIUM-HIGH
Notes: GIS integration is excellent
```

### Colorado
```
Source: County Assessors
API: DOLA provides some statewide data
Bulk Data: Available from DOLA
URL: https://dola.colorado.gov/

Scraping Feasibility: MEDIUM-HIGH
Notes: Good state coordination
```

### Maryland
```
Source: SDAT (State Dept of Assessments & Taxation)
API: SDAT has centralized database
Bulk Data: Available with registration
URL: https://sdat.dat.maryland.gov/RealProperty/

Scraping Feasibility: HIGH
Notes: Centralized statewide - excellent for scraping
```

### Virginia
```
Source: County/City Commissioners of Revenue
Platform: Many use Vision or custom systems
API: Some localities have APIs
Bulk Data: Limited

Scraping Feasibility: MEDIUM
Notes: Independent cities complicate things
```

---

## Category B: Common Vendor Platforms (Build Once, Use Many)

### Vision Government Solutions
```
Coverage: ~500+ municipalities (primarily New England)
States: MA, CT, NH, VT, ME, RI, also FL, NJ, PA

URL Pattern: https://gis.vgsi.com/[municipality]/
API: No official API, but consistent HTML structure
Search: By owner, address, parcel ID

Scraping Approach:
- Base URL: https://gis.vgsi.com/{town_code}/
- Search endpoint: /Search.aspx
- Parcel detail: /Parcel.aspx?pid={id}

Structure is VERY consistent across all Vision sites
Feasibility: HIGH - one scraper covers 500+ towns

Sample Towns:
- Westport CT: https://gis.vgsi.com/westportct/
- Dedham MA: https://gis.vgsi.com/dedhamma/
- Salem NH: https://gis.vgsi.com/salemnh/
```

### Patriot Properties
```
Coverage: ~200+ municipalities (New England focus)
States: MA, NH, ME, VT

URL Pattern: https://[municipality].patriotproperties.com/
API: No official API
Search: By owner, location, parcel

Scraping Approach:
- Consistent form-based search
- Results in HTML table format
- Detail pages follow pattern

Feasibility: HIGH - consistent structure
```

### Tyler Technologies (iasWorld)
```
Coverage: Large counties nationwide
States: TX, CA, FL, IL, OH, PA, and others

Products:
- iasWorld (assessment)
- Munis (financials)
- EnerGov (permitting)

Scraping Feasibility: MEDIUM - varies by implementation
Notes: Large market share but implementations differ
```

### Aumentum (Thomson Reuters)
```
Coverage: ~800+ counties
States: Nationwide, strong in FL, TX, IL

Features: Assessment, tax collection, GIS integration
Scraping Feasibility: MEDIUM - need to identify pattern
```

### Beacon/Schneider Corp
```
Coverage: ~1,000+ counties
States: Nationwide

URL Pattern: https://beacon.schneidercorp.com/
Public Access: Free property search
API: No public API

Scraping Approach:
- County-specific subdomains
- Consistent search/results format
- GIS integration

Feasibility: MEDIUM-HIGH
Notes: Covers many mid-size counties
```

### qPublic (Harris Govern)
```
Coverage: ~200+ counties
States: GA, NC, SC, AL, MS, TN, KY

URL Pattern: https://qpublic.schneidercorp.com/
Search: Owner, address, parcel
Feasibility: HIGH - very consistent

Sample Counties:
- Fulton GA
- Wake NC
- Greenville SC
```

### True Automation (TrueProdigy)
```
Coverage: ~150+ CADs in Texas
States: Primarily TX

URL Pattern: https://[county].truthautomation.com/
Also: esearch.[county].gov

Scraping Feasibility: HIGH for Texas
Notes: Dominates Texas market
```

---

## Category C: States with Centralized Systems

### States with Single Statewide Portals

| State | Portal | Coverage | Scraping Notes |
|-------|--------|----------|----------------|
| **Maryland** | SDAT | 100% | Excellent - single source |
| **Montana** | cadastral.mt.gov | 100% | Good statewide GIS |
| **Hawaii** | County-specific | 4 counties | Small, manageable |
| **Delaware** | County-specific | 3 counties | Very small state |
| **Rhode Island** | Town-specific | 39 towns | Small but fragmented |

### States with Strong Coordination

| State | Notes |
|-------|-------|
| **Oregon** | ORMAP statewide parcel data |
| **Washington** | County assessor data fairly standardized |
| **Minnesota** | Good county coordination |
| **Iowa** | Beacon covers many counties |
| **Nebraska** | CAMA system statewide |

---

## Category D: Anti-Scraping Measures to Watch For

### Common Blocking Techniques
```
1. CAPTCHA on search forms
2. Session-based tokens required
3. IP rate limiting
4. JavaScript-rendered content (SPA)
5. Terms of Service prohibitions
6. Login/registration required
```

### States/Counties Known for Blocking
```
- Cook County IL: Rate limiting, complex navigation
- Some California counties: Registration required
- Certain Florida counties: Session tokens
- Philadelphia: Complex multi-system
```

### Mitigation Strategies
```
1. Respect robots.txt
2. Implement delays between requests
3. Rotate user agents
4. Use headless browser for JS-heavy sites
5. Cache results aggressively
6. Consider official data purchases
```

---

## Recommended Scraping Priority

### Phase 1: High-Value, Easy Access
```
Priority Targets (build scrapers for these first):

1. Vision Government Solutions (~500 towns)
   - Covers most of New England
   - Single scraper, many jurisdictions
   - Estimated coverage: MA, CT, NH, VT, ME, RI

2. qPublic/Schneidercorp (~200 counties)
   - Covers GA, NC, SC, AL, TN
   - Consistent interface

3. True Automation (~150 Texas CADs)
   - Texas has high loan volume
   - Very standardized

4. Florida APIs
   - Major counties have APIs
   - State provides bulk data

5. NYC Open Data
   - Comprehensive
   - Well-documented API
```

### Phase 2: Medium Effort
```
6. Beacon/Schneider Corp portals
7. Maryland SDAT (centralized)
8. California open data counties
9. Tyler/iasWorld implementations
```

### Phase 3: Custom Development
```
10. Individual county scrapers for high-volume areas
11. States without common platforms
```

---

## Technical Implementation Notes

### Scraper Architecture
```
┌─────────────────────────────────────────────────────┐
│                   Scraper Service                    │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Vision    │  │   qPublic   │  │   TrueAuto  │ │
│  │   Adapter   │  │   Adapter   │  │   Adapter   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │         │
│  ┌──────┴────────────────┴────────────────┴──────┐ │
│  │              Unified Tax Data Model            │ │
│  └───────────────────────┬───────────────────────┘ │
│                          │                          │
│  ┌───────────────────────┴───────────────────────┐ │
│  │              Rate Limiter / Queue              │ │
│  └───────────────────────┬───────────────────────┘ │
│                          │                          │
│  ┌───────────────────────┴───────────────────────┐ │
│  │                 Cache Layer                    │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Unified Tax Data Response
```typescript
interface ScrapedTaxData {
  // Source info
  source: string;           // 'vision', 'qpublic', 'trueauto', etc.
  scrapedAt: Date;
  jurisdiction: string;

  // Parcel identification
  parcelId: string;
  altParcelId?: string;

  // Property info
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;

  // Owner info
  ownerName: string;
  ownerAddress?: string;
  mailingAddress?: string;

  // Values
  assessedValue?: number;
  marketValue?: number;
  taxableValue?: number;
  landValue?: number;
  improvementValue?: number;

  // Tax amounts
  annualTaxAmount?: number;
  delinquentAmount?: number;

  // Tax sale info
  taxSaleDate?: Date;
  redemptionDeadline?: Date;

  // Property details
  propertyType?: string;
  yearBuilt?: number;
  squareFeet?: number;
  lotSize?: number;

  // Raw data for reference
  rawHtml?: string;
  sourceUrl: string;
}
```

### Rate Limiting Strategy
```typescript
const rateLimits = {
  vision: { requestsPerMinute: 30, delayMs: 2000 },
  qpublic: { requestsPerMinute: 20, delayMs: 3000 },
  trueauto: { requestsPerMinute: 30, delayMs: 2000 },
  beacon: { requestsPerMinute: 15, delayMs: 4000 },
  default: { requestsPerMinute: 10, delayMs: 6000 }
};
```

---

## Legal Considerations

### Generally Acceptable
```
✅ Public record data is public
✅ No login required = generally scrapable
✅ Personal use / business use typically OK
✅ Caching to reduce load is good practice
```

### Caution Areas
```
⚠️ Terms of Service may prohibit scraping
⚠️ Bulk downloading may be restricted
⚠️ Commercial redistribution may require license
⚠️ Some states sell bulk data (implies restriction)
```

### Best Practices
```
1. Check robots.txt before scraping
2. Identify your scraper in User-Agent
3. Implement reasonable delays
4. Don't overload servers
5. Consider purchasing bulk data if available
6. Keep scraped data secure (owner names = PII)
```

---

## Vendor Platform Coverage Summary

| Platform | Est. Coverage | States | Scraper Difficulty |
|----------|--------------|--------|-------------------|
| Vision Government | ~500 towns | NE states | Easy |
| qPublic | ~200 counties | SE states | Easy |
| True Automation | ~150 CADs | TX | Easy |
| Beacon | ~1,000 counties | Nationwide | Medium |
| Tyler/iasWorld | ~500+ | Nationwide | Medium |
| Patriot Properties | ~200 towns | NE states | Easy |
| Aumentum | ~800 counties | Nationwide | Medium |

**Total estimated coverage with 7 scrapers: ~3,350+ jurisdictions (~70% of US)**

---

## Next Steps

1. [ ] Build Vision Government Solutions scraper (highest ROI)
2. [ ] Build qPublic scraper (SE coverage)
3. [ ] Build True Automation scraper (TX coverage)
4. [ ] Create jurisdiction-to-platform mapping table
5. [ ] Implement rate limiting and caching infrastructure
6. [ ] Build unified search interface
7. [ ] Add manual fallback for non-scrapable jurisdictions

---

## Sample Scraper Pseudocode (Vision)

```python
# Vision Government Solutions Scraper

import requests
from bs4 import BeautifulSoup
import time

class VisionScraper:
    BASE_URL = "https://gis.vgsi.com/{town_code}/"

    def __init__(self, town_code):
        self.town_code = town_code
        self.session = requests.Session()
        self.session.headers['User-Agent'] = 'TaxResearchBot/1.0 (internal use)'

    def search_by_address(self, address):
        """Search for parcel by street address"""
        search_url = f"{self.BASE_URL}Search.aspx"

        # Get search page for form tokens
        resp = self.session.get(search_url)
        soup = BeautifulSoup(resp.text, 'html.parser')

        # Extract form tokens
        viewstate = soup.find('input', {'name': '__VIEWSTATE'})['value']

        # Submit search
        data = {
            '__VIEWSTATE': viewstate,
            'txtStreet': address,
            'btnSearch': 'Search'
        }

        resp = self.session.post(search_url, data=data)
        time.sleep(2)  # Rate limit

        return self._parse_results(resp.text)

    def get_parcel_details(self, parcel_id):
        """Get full parcel details"""
        url = f"{self.BASE_URL}Parcel.aspx?pid={parcel_id}"
        resp = self.session.get(url)
        time.sleep(2)  # Rate limit

        return self._parse_parcel(resp.text)

    def _parse_parcel(self, html):
        """Parse parcel detail page"""
        soup = BeautifulSoup(html, 'html.parser')

        return {
            'parcel_id': self._extract('Parcel ID', soup),
            'owner': self._extract('Owner', soup),
            'address': self._extract('Location', soup),
            'assessed_value': self._extract('Total Assessed', soup),
            'tax_amount': self._extract('Tax Amount', soup),
            # ... more fields
        }
```

---

## Estimated Development Time

| Component | Time | Coverage Gained |
|-----------|------|-----------------|
| Vision scraper | 2-3 days | 500+ towns |
| qPublic scraper | 2-3 days | 200+ counties |
| True Automation | 2-3 days | 150+ TX CADs |
| Beacon scraper | 3-4 days | 1,000+ counties |
| Infrastructure | 3-5 days | Rate limiting, cache, queue |
| Mapping table | 2-3 days | Jurisdiction → platform |
| **Total** | **15-20 days** | **~2,000+ jurisdictions** |

This gives ~70% automated coverage of US jurisdictions with ~3 weeks of development.
