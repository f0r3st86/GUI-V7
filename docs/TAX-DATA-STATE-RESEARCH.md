# Real Estate Tax Data - State-by-State Research

**Created:** January 2026
**Purpose:** Categorize states by data access method (API, bulk download, scraping, manual)
**Status:** In Progress

---

## Access Method Categories

| Category | Description | Effort | Cost |
|----------|-------------|--------|------|
| **Tier 1: Official API** | REST API or ArcGIS FeatureServer | Low | Free |
| **Tier 2: Open Data Portal** | Bulk downloads (CSV, Shapefile) | Low-Medium | Free |
| **Tier 3: Vendor Platform** | Consistent scraping (Vision, qPublic, True Automation) | Medium | Free |
| **Tier 4: County Website** | Individual county scraping | High | Free |
| **Tier 5: Manual Only** | No online access, phone/mail required | Very High | Free |

---

# TEXAS (Detailed Research)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | County (via CADs - Central Appraisal Districts) |
| Total Counties | 254 |
| Primary Platform | True Automation (majority), Harris custom |
| API Availability | **Tier 2** - Bulk downloads, limited API |
| Data Quality | Excellent |

## Data Access Methods

### 1. Harris County (Houston) - HCAD
**Population:** 4.7M | **Parcels:** 1.8M+

| Access Type | URL | Format | Update Frequency |
|-------------|-----|--------|------------------|
| **Bulk Data Download** | [hcad.org/pdata](https://hcad.org/pdata/pdata-property-downloads.html) | Tab-delimited TXT | Annual (certified) |
| **GIS Data** | [hcad.org/pdata/gis](https://hcad.org/pdata/pdata-gis-downloads.html) | ESRI Shapefile | Quarterly |
| **Web Search** | [hcad.org](https://hcad.org/) | HTML | Real-time |
| **ArcGIS MapServer** | [gis.hctx.net/arcgis](https://www.gis.hctx.net/arcgis/rest/services/HCAD/HCAD_MUD/MapServer) | REST API | Real-time |

**HCAD Bulk Data Files:**
```
Files available at pdata.hcad.org:
- Real_acct.txt - Account/owner information
- Real_building_res.txt - Residential building details
- Real_building_com.txt - Commercial building details
- Real_land.txt - Land details
- Real_jur_exempt.txt - Exemptions
- Personal_acct.txt - Personal property
```

**Data Fields Available:**
- Account number, legal description
- Owner name, mailing address
- Situs (property) address
- Market value, assessed value, taxable value
- Land value, improvement value
- Building characteristics (sqft, year built, etc.)
- Exemptions

**Access Notes:**
- Files are large (hundreds of MB compressed)
- Requires WinZip to extract
- No technical support provided
- Custom requests: Open Records Request

---

### 2. Dallas County - Dallas CAD
**Population:** 2.6M | **Parcels:** 900K+

| Access Type | URL | Format |
|-------------|-----|--------|
| **Web Search** | [dallascad.org](https://www.dallascad.org/) | HTML |
| **True Automation** | propaccess.trueautomation.com | HTML |
| **Bulk Download** | Contact CAD | Request required |

**Scraping Notes:**
- Uses True Automation platform
- Standard True Automation URL patterns
- Property search by owner, address, account number

---

### 3. Bexar County (San Antonio) - BCAD
**Population:** 2.0M | **Parcels:** 700K+

| Access Type | URL | Format |
|-------------|-----|--------|
| **Web Search** | [bcad.org](https://bcad.org/) | HTML |
| **True Automation Map** | [bexar.trueautomation.com](https://bexar.trueautomation.com/mapSearch/?cid=110) | HTML |
| **Open Data** | Available | Shapefile |

---

### 4. Travis County (Austin) - TCAD
**Population:** 1.3M | **Parcels:** 450K+

| Access Type | URL | Format |
|-------------|-----|--------|
| **Web Search** | [traviscad.org](https://traviscad.org/propertysearch/) | HTML |
| **Data Download** | Contact CAD | Request required |

**Notes:**
- Entire database searchable online
- Owner name, address, account number search
- Current year data is "work in progress"

---

### 5. Tarrant County (Fort Worth) - TAD
**Population:** 2.1M | **Parcels:** 750K+

| Access Type | URL | Format |
|-------------|-----|--------|
| **Web Search** | [tad.org](https://www.tad.org/) | HTML |
| **True Automation** | Standard platform | HTML |

---

## True Automation Platform (Covers ~150+ Texas CADs)

**Standard URL Pattern:**
```
Search: https://propaccess.trueautomation.com/clientdb/?cid={CAD_ID}
Map: https://{county}.trueautomation.com/mapSearch/?cid={CAD_ID}
```

**Common CAD IDs:**
| County | CAD ID | URL |
|--------|--------|-----|
| Bexar | 110 | bexar.trueautomation.com |
| San Jacinto | 22 | propaccess.trueautomation.com/?cid=22 |
| (others) | varies | Check county website |

**Scraping Approach:**
```
1. Get list of all Texas CADs using True Automation
2. Build single scraper with configurable CAD ID
3. Standard field mappings across all True Automation sites
4. Rate limit: 3-5 seconds between requests
```

---

## Texas Tax Assessor-Collectors (Separate from CADs)

**Important:** CADs handle appraisal/valuation. Tax Assessor-Collectors handle billing/collection.

For delinquent tax data, you need the Tax Assessor-Collector, not the CAD.

| County | Tax Office URL |
|--------|---------------|
| Harris | [hctax.net](https://www.hctax.net/) |
| Dallas | [dallascounty.org/tax](https://www.dallascounty.org/departments/tax/) |
| Bexar | [bexar.org/tax](https://www.bexar.org/tax/) |
| Travis | [traviscountytax.org](https://www.traviscountytax.org/) |
| Tarrant | [tarrantcounty.com/tax](https://www.tarrantcounty.com/en/tax.html) |

---

## Texas Data Summary

| Data Type | Source | Best Access Method |
|-----------|--------|-------------------|
| Assessed Values | CAD | Bulk download (HCAD) or scraping |
| Property Characteristics | CAD | Bulk download (HCAD) or scraping |
| Owner Information | CAD | Bulk download (HCAD) or scraping |
| Current Tax Bill | Tax Collector | Scraping |
| Delinquent Taxes | Tax Collector | Scraping |
| Tax Sale Info | Tax Collector | Scraping |
| Sales History | CAD | Limited (TX doesn't require disclosure) |

---

## Texas Implementation Plan

### Phase 1: Harris County (Bulk Data)
```
1. Download HCAD bulk files
2. Parse tab-delimited format
3. Map to unified schema
4. Import to database
5. Test with sample properties
```

### Phase 2: Top 10 Texas Counties (Scraping)
```
1. Build True Automation scraper
2. Configure for Dallas, Bexar, Travis, Tarrant, etc.
3. Rate-limited scraping
4. Match to HCAD schema
```

### Phase 3: Remaining Counties
```
1. Identify which CADs use True Automation
2. Extend scraper coverage
3. Handle custom county sites individually
```

---

# FLORIDA (Detailed Research)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | County |
| Total Counties | 67 |
| Primary System | County Property Appraisers + FL DOR |
| API Availability | **Tier 1/2** - ArcGIS API + Bulk downloads |
| Data Quality | Excellent (Sunshine Law = great transparency) |

## Statewide Resources

### Florida Department of Revenue (DOR)
**Best bulk data source for all 67 counties**

| Access Type | URL | Format |
|-------------|-----|--------|
| **NAL Files** | [floridarevenue.com/property](https://floridarevenue.com/property/Pages/DataPortal.aspx) | Fixed-width TXT |
| **Data Portal** | Same | CSV available |

**NAL File Contents:**
- Parcel ID
- Owner name/address
- Property address
- Just value, assessed value, taxable value
- Land/improvement breakdown
- Property class/use code
- Exemptions
- Sale date/price

**Coverage:** ALL 67 Florida counties in one download

---

### Florida DOT Parcels FeatureServer (API)
**Statewide parcel data via REST API**

| Attribute | Value |
|-----------|-------|
| **URL** | [gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer](https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer) |
| **Format** | ArcGIS REST API (JSON, GeoJSON) |
| **Operations** | Query, Extract Changes |

**Sample Query:**
```
https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer/13/query?
  where=1=1
  &outFields=*
  &f=json
  &resultRecordCount=100
```

**County Indices:**
- Broward: 6
- Miami-Dade: 13
- (Check FeatureServer for full list)

---

## Major County Details

### Miami-Dade County
**Population:** 2.7M | **Parcels:** 900K+

| Access Type | URL | Format |
|-------------|-----|--------|
| **Property Search** | [miamidade.gov/pa/propertysearch](https://www.miamidade.gov/Apps/PA/propertysearch/) | HTML |
| **Open Data Hub** | [gis-mdc.opendata.arcgis.com](https://gis-mdc.opendata.arcgis.com/) | ArcGIS/CSV |
| **Bulk Files** | [bbs.miamidade.gov](https://bbs.miamidade.gov/) | Custom request |

**API Access:**
```
Miami-Dade Open Data Hub provides ArcGIS-based API access
- Search for "Property" or "Parcel" datasets
- Download as CSV, Shapefile, or query via API
```

---

### Broward County
**Population:** 1.9M | **Parcels:** 600K+

| Access Type | URL | Format |
|-------------|-----|--------|
| **Property Search** | [bcpa.net](https://bcpa.net/) | HTML |
| **GIS** | Broward GIS portal | Shapefile |

---

### Palm Beach County
**Population:** 1.5M | **Parcels:** 600K+

| Access Type | URL | Format |
|-------------|-----|--------|
| **PAPA** | [pbcgov.org/papa](https://www.pbcgov.org/papa/) | HTML |
| **Open Data** | Palm Beach GIS | Available |

---

## Florida Implementation Plan

### Phase 1: Statewide Bulk Import
```
1. Download FL DOR NAL files (all 67 counties)
2. Parse fixed-width format
3. Map to unified schema
4. ~10M parcels imported
```

### Phase 2: ArcGIS API Integration
```
1. Connect to FDOT FeatureServer
2. Query specific counties as needed
3. Use for real-time lookups
```

### Phase 3: Tax Collector Data
```
For delinquent/tax sale data:
1. Identify Tax Collector websites per county
2. Build scrapers for top 10 counties
3. Most use similar platforms
```

---

# NEW YORK CITY (Detailed Research)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | City (NYC DOF) |
| Boroughs | Manhattan, Brooklyn, Bronx, Queens (+ Staten Island separate) |
| API Availability | **Tier 1** - NYC Open Data (Socrata API) |
| Data Quality | Excellent |

## NYC Open Data (Best Source)

**URL:** [data.cityofnewyork.us](https://data.cityofnewyork.us/)
**API:** Socrata Open Data API (SODA)

### Key Datasets

| Dataset | Endpoint | Records |
|---------|----------|---------|
| **ACRIS Real Property Master** | [bnx9-e6tj](https://data.cityofnewyork.us/City-Government/ACRIS-Real-Property-Master/bnx9-e6tj) | Deeds, mortgages |
| **ACRIS Real Property Legals** | [8h5j-fqxa](https://data.cityofnewyork.us/City-Government/ACRIS-Real-Property-Legals/8h5j-fqxa) | Legal descriptions |
| **Property Valuation and Assessment** | Search portal | Assessments |
| **DOF Property Tax Bills** | Available | Tax amounts |

### SODA API Example

```javascript
// Query ACRIS data via Socrata API
const endpoint = 'https://data.cityofnewyork.us/resource/bnx9-e6tj.json';
const query = `?$where=borough=1&$limit=100`;

fetch(endpoint + query)
  .then(res => res.json())
  .then(data => console.log(data));
```

**API Features:**
- No API key required (with rate limits)
- App token available for higher limits
- SQL-like queries ($where, $select, $limit)
- JSON, CSV, GeoJSON output

---

## ACRIS (Automated City Register Information System)

**URL:** [nyc.gov/acris](https://www.nyc.gov/site/finance/property/acris.page)

**Coverage:**
- Manhattan, Brooklyn, Bronx, Queens (1966-present)
- Staten Island: Separate Richmond County portal

**Data Available:**
- Deeds
- Mortgages
- Liens
- Satisfactions
- Property transfers

---

## NYC Implementation Plan

### Phase 1: Open Data API
```
1. Register for NYC Open Data app token
2. Build Socrata API client
3. Query property/assessment data
4. Import to database
```

### Phase 2: ACRIS Integration
```
1. Query ACRIS datasets via SODA
2. Link property records to documents
3. Track ownership/transfer history
```

---

# MARYLAND (Detailed Research)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | County (State coordinates via SDAT) |
| Total Counties | 24 (including Baltimore City) |
| Primary System | SDAT (centralized state system) |
| API Availability | **Tier 1/2** - ArcGIS API + web search |
| Data Quality | Good |

## SDAT (State Department of Assessments and Taxation)

**Centralized statewide database - rare and valuable**

| Access Type | URL | Format |
|-------------|-----|--------|
| **Property Search** | [sdat.dat.maryland.gov](https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx) | HTML |
| **ArcGIS MapServer** | [geodata.md.gov](https://geodata.md.gov/imap/rest/services/PlanningCadastre/MD_ParcelBoundaries/MapServer) | REST API |
| **Bulk Download** | [planning.maryland.gov](https://planning.maryland.gov/Pages/OurProducts/DownloadFiles.aspx) | Shapefile/CSV |

### ArcGIS API

```
Base URL: https://geodata.md.gov/imap/rest/services/PlanningCadastre/MD_ParcelBoundaries/MapServer

Capabilities:
- Query (JSON, GeoJSON)
- WMS, WFS, KML
- Parcel boundaries + SDAT attributes
```

**Query Example:**
```
https://geodata.md.gov/imap/rest/services/PlanningCadastre/MD_ParcelBoundaries/MapServer/0/query?
  where=COUNTY='BALTIMORE'
  &outFields=*
  &f=json
  &resultRecordCount=100
```

---

## Maryland Implementation Plan

### Phase 1: ArcGIS API
```
1. Query MD parcel boundaries MapServer
2. Extract SDAT attributes
3. Statewide coverage in one API
```

### Phase 2: Web Scraping (if needed)
```
1. SDAT web search for additional details
2. Rate-limited queries
```

---

# GEORGIA (Detailed Research)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | County |
| Total Counties | 159 |
| Primary Platform | qPublic (Schneider Corp) |
| API Availability | **Tier 3** - Vendor platform scraping |
| Data Quality | Good |

## qPublic Platform

**Covers majority of Georgia counties**

| Access Type | URL | Format |
|-------------|-----|--------|
| **County Directory** | [qpublic.net/ga](https://qpublic.net/ga/gaassessors/) | HTML |
| **Property Search** | [qpublic.schneidercorp.com](https://qpublic.schneidercorp.com/) | HTML |

**Standard URL Pattern:**
```
https://qpublic.schneidercorp.com/Application.aspx?AppID={APP_ID}&LayerID={LAYER_ID}&PageTypeID=2&KeyValue={PARCEL_ID}
```

**Scraping Approach:**
```
1. Build single qPublic scraper
2. Configure for each Georgia county
3. Standard field mappings
4. Rate limit: 3-5 seconds
```

---

# STATE CATEGORIZATION SUMMARY

## Tier 1: Official REST API Available

| State | API Type | Coverage | Notes |
|-------|----------|----------|-------|
| **New York City** | Socrata SODA | Full city | Excellent, free API |
| **Maryland** | ArcGIS REST | Statewide | SDAT centralized |
| **Florida** | ArcGIS REST | Statewide | FDOT FeatureServer |

## Tier 2: Bulk Downloads Available

| State | Source | Format | Coverage |
|-------|--------|--------|----------|
| **Florida** | FL DOR | Fixed-width/CSV | All 67 counties |
| **Texas (Harris)** | HCAD PDATA | Tab-delimited | Harris County only |
| **Maryland** | MD Planning | Shapefile | Statewide |

## Tier 3: Vendor Platform (Scrapable)

| State | Platform | Counties Covered |
|-------|----------|------------------|
| **Texas** | True Automation | ~150+ CADs |
| **Georgia** | qPublic | ~100+ counties |
| **North Carolina** | qPublic | Many counties |
| **South Carolina** | qPublic | Many counties |
| **Alabama** | qPublic | Many counties |
| **New England** | Vision Government | ~500 towns |

## Tier 4: Individual County Websites

| State | Notes |
|-------|-------|
| **California** | 58 counties, each different |
| **Illinois** | Cook County complex, others vary |
| **Ohio** | 88 counties, varying systems |
| **Pennsylvania** | 67 counties, very fragmented |

## Tier 5: Limited/Manual Access

| State | Notes |
|-------|-------|
| **Rural New England** | Small towns, phone only |
| **Some Western states** | Limited online presence |

---

# CALIFORNIA (Detailed Research)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | County |
| Total Counties | 58 |
| Primary System | Each county independent |
| API Availability | **Tier 2/4** - LA County Open Data + individual counties |
| Data Quality | Good but fragmented |

## Statewide Resources

### State Controller's Office
**URL:** [propertytax.bythenumbers.sco.ca.gov](https://propertytax.bythenumbers.sco.ca.gov/)
- Property tax allocations and levies from all 58 counties
- Open data format (aggregate data, not parcel-level)

### ParcelQuest (Commercial - California Specific)
| Attribute | Value |
|-----------|-------|
| **URL** | [parcelquest.com](https://www.parcelquest.com/) |
| **Coverage** | All 58 counties, 13M parcels |
| **Updates** | Daily from county assessors |
| **Pricing** | Commercial (contact for quote) |

**Note:** ParcelQuest is the primary commercial provider for California-wide parcel data.

---

## Major County Details

### Los Angeles County
**Population:** 10M+ | **Parcels:** 2.7M

| Access Type | URL | Format |
|-------------|-----|--------|
| **Assessor Portal** | [portal.assessor.lacounty.gov](https://portal.assessor.lacounty.gov/) | HTML |
| **Open Data** | [data.lacounty.gov](https://data.lacounty.gov/search?categories=assessor) | Socrata API |
| **GIS Hub** | [egis-lacounty.hub.arcgis.com](https://egis-lacounty.hub.arcgis.com/) | ArcGIS/Shapefile |
| **Assessor Map** | [maps.assessor.lacounty.gov](https://maps.assessor.lacounty.gov/m/) | ArcGIS |

**API Access:**
```
LA County Open Data uses Socrata platform
- Similar to NYC Open Data
- API endpoints available for datasets
- Export as CSV, JSON, or query via SODA API
```

### San Diego County
| Access Type | URL | Format |
|-------------|-----|--------|
| **Web Search** | sandiegocounty.gov/assessor | HTML |
| **GIS** | Available | Shapefile |

### Orange County
| Access Type | URL | Format |
|-------------|-----|--------|
| **Web Search** | ocgov.com/assessor | HTML |

---

## California Implementation Plan

### Phase 1: Los Angeles County (Open Data)
```
1. Connect to data.lacounty.gov Socrata API
2. Query assessor datasets
3. Export parcel data
4. 2.7M parcels importable
```

### Phase 2: Other Major Counties
```
1. San Diego, Orange, San Francisco - check for open data
2. Most require web scraping
3. Prioritize based on portfolio needs
```

### Phase 3: Statewide (if needed)
```
1. Evaluate ParcelQuest for commercial API
2. Alternative: county-by-county scraping
3. 58 counties = high effort
```

---

# OHIO (Detailed Research)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | County |
| Total Counties | 88 |
| Primary System | County Auditors (independent) |
| API Availability | **Tier 2/4** - Some ArcGIS, mostly scraping |
| Data Quality | Varies by county |

## Major County Details

### Franklin County (Columbus)
**Population:** 1.3M | **Parcels:** 500K+

| Access Type | URL | Format |
|-------------|-----|--------|
| **Web Search** | [franklincountyauditor.com](https://franklincountyauditor.com/) | HTML |
| **Open Data** | [auditor-fca.opendata.arcgis.com](https://auditor-fca.opendata.arcgis.com/) | ArcGIS API |
| **Web Reporter** | [audr-apps.franklincountyohio.gov/reporter](https://audr-apps.franklincountyohio.gov/reporter) | CSV Export |
| **Property Search** | [property.franklincountyauditor.com](https://property.franklincountyauditor.com/) | HTML |

**Notable Features:**
- ArcGIS open data portal available
- Web Reporter allows data filtering and download
- Current tax year data downloadable
- Past years via Direct Downloads tool

### Cuyahoga County (Cleveland)
**Population:** 1.2M | **Parcels:** 570K+

| Access Type | URL | Format |
|-------------|-----|--------|
| **Web Search** | cuyahogacounty.us/auditor | HTML |
| **Property Tax Calculator** | Available | Online tool |

**Notes:**
- Full property reappraisal completed 2024
- Online property search available
- No documented public API

---

## Ohio Implementation Plan

### Phase 1: Franklin County (ArcGIS)
```
1. Query Franklin County ArcGIS open data
2. Use Web Reporter for bulk exports
3. Covers Columbus metro area
```

### Phase 2: Other Major Counties
```
1. Cuyahoga (Cleveland) - web scraping
2. Hamilton (Cincinnati) - check for open data
3. Summit (Akron) - check for open data
```

---

# ILLINOIS (Detailed Research)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | County |
| Total Counties | 102 |
| Primary System | County Assessors |
| API Availability | **Tier 1** (Cook County) / **Tier 4** (others) |
| Data Quality | Excellent for Cook County |

## Cook County (Chicago) - BEST DATA ACCESS

**Population:** 5.2M | **Parcels:** 1.8M+

### Open Data Portal (Socrata)
**URL:** [datacatalog.cookcountyil.gov](https://datacatalog.cookcountyil.gov/)

| Dataset | Endpoint | Description |
|---------|----------|-------------|
| **Assessed Values** | [uzyt-m557](https://datacatalog.cookcountyil.gov/Property-Taxation/Assessor-Assessed-Values/uzyt-m557) | Land, building, total values 1999-present |
| **Parcel Sales** | [wvhk-k5uv](https://datacatalog.cookcountyil.gov/Property-Taxation/Assessor-Parcel-Sales/wvhk-k5uv) | Sales history |
| **Property Characteristics** | Multiple datasets | Building details, lot info |

**API Access:**
```javascript
// Cook County uses Socrata SODA API
const endpoint = 'https://datacatalog.cookcountyil.gov/resource/uzyt-m557.json';
const query = '?$where=pin14="12345678901234"&$limit=100';

fetch(endpoint + query)
  .then(res => res.json())
  .then(data => console.log(data));
```

### GIS Portal
**URL:** [hub-cookcountyil.opendata.arcgis.com](https://hub-cookcountyil.opendata.arcgis.com/)

### GitHub - CCAO Data Department
**URL:** [github.com/ccao-data](https://github.com/ccao-data)
- Open source models and tools
- Transparent property assessment methodology
- Public datasets and code

**Important:** When working with PINs, zero-pad to 14 digits (leading zeros may be lost in exports).

---

## Illinois Implementation Plan

### Phase 1: Cook County (Priority)
```
1. Connect to Socrata API
2. Query assessed values, sales, characteristics
3. 1.8M parcels accessible
4. Excellent documentation and support
```

### Phase 2: Collar Counties
```
1. DuPage, Lake, Will, Kane Counties
2. Check for open data portals
3. Likely require scraping
```

---

# PENNSYLVANIA (Detailed Research)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | County (with school districts) |
| Total Counties | 67 |
| Primary System | County-specific |
| API Availability | **Tier 2** (Allegheny) / **Tier 4** (others) |
| Data Quality | Varies significantly |

## Allegheny County (Pittsburgh) - BEST ACCESS

**Population:** 1.2M | **Parcels:** 580K+

### WPRDC (Western PA Regional Data Center)
**URL:** [data.wprdc.org](https://data.wprdc.org/dataset/property-assessments)

| Access Type | URL | Format |
|-------------|-----|--------|
| **Property Assessments** | [data.wprdc.org](https://data.wprdc.org/dataset/property-assessments) | CSV, API |
| **Parcel Extractor** | WPRDC tool | Filtered downloads |
| **Monthly Archives** | ZIP files | Bulk data |
| **Property Search** | [alleghenycounty.us](https://www.alleghenycounty.us/Services/Property-Assessments-and-Real-Estate/Property-Record-Search) | HTML |

**Data Available:**
- Land characteristics
- Property values
- Sales history
- Abatements
- Building characteristics (residential)

---

## Other Pennsylvania Counties

### Monroe County
| Access Type | URL | Format |
|-------------|-----|--------|
| **Web Search** | [agencies.monroecountypa.gov](http://agencies.monroecountypa.gov/monroepa_prod/Search/Disclaimer.aspx) | HTML |
| **Bulk Data** | Not available | N/A |

**Notes:**
- Web-based search only
- No documented API
- Assessment office administers Homestead/Farmstead programs

### Philadelphia County
- Check Philadelphia Open Data portal
- Likely has structured data available

---

## Pennsylvania Implementation Plan

### Phase 1: Allegheny County (WPRDC)
```
1. Download from WPRDC portal
2. Monthly updated ZIP archives
3. 580K parcels accessible
```

### Phase 2: Major Counties
```
1. Philadelphia - check open data
2. Montgomery, Bucks, Delaware - check portals
3. Most require scraping
```

---

# NEW JERSEY (Detailed Research - Town-Level Taxation)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | **Municipality (Town)** |
| Total Municipalities | 564 |
| Primary System | NJACTB + Municipal Assessors |
| API Availability | **Tier 2/3** - MOD-IV data + restricted access |
| Data Quality | Good but access changed in 2023 |

## Important: Daniel's Law Restrictions (Jan 2023)

**As of January 1, 2023:** NJACTB website no longer provides direct access to Tax List (MOD-IV) and Property Sales (SR1A) data due to Daniel's Law privacy protections.

Access now requires going through individual county tax boards.

---

## Data Sources

### NJ Open Data - MOD-IV Files
**URL:** [njogis-newjersey.opendata.arcgis.com](https://njogis-newjersey.opendata.arcgis.com/documents/102a9bf3c6da4ca3b9b31f831a1e9f72)

| Access Type | Format | Notes |
|-------------|--------|-------|
| **Property Tax List** | File Geodatabase | For use with parcel data |
| **Statistical Data** | [nj.gov/treasury/taxation](https://www.nj.gov/treasury/taxation/lpt/statdata.shtml) | Tax rates by municipality |

### NJACTB Record Search
**URL:** [njactb.org/record-search](https://njactb.org/record-search/)
- Assessment records
- Deed information
- Comparable sales data
- Access varies by county

### County Tax Boards (21 Total)
Each county operates independently. Contact individual county tax boards for bulk data access:
- Essex County: [essexcountynjtaxboard.org](https://www.essexcountynjtaxboard.org/)
- Camden County: [camdencounty.com/service/board-of-taxation](https://www.camdencounty.com/service/board-of-taxation/)

---

## New Jersey Implementation Plan

### Phase 1: MOD-IV Data
```
1. Download MOD-IV from NJ Open Data
2. File Geodatabase format
3. Statewide coverage but may have lag
```

### Phase 2: County-Level Access
```
1. Contact major county tax boards
2. Request bulk data access
3. 21 counties to coordinate
```

### Phase 3: Municipal Scraping (if needed)
```
1. 564 municipalities is significant effort
2. Many use similar platforms
3. Prioritize based on portfolio
```

---

# MASSACHUSETTS (Detailed Research - Town-Level Taxation)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | **Municipality (City/Town)** |
| Total Municipalities | 351 |
| Primary Platform | Vision Government Solutions |
| API Availability | **Tier 2/3** - MassGIS bulk + Vision scraping |
| Data Quality | Excellent |

## MassGIS Property Tax Parcels (STATE RESOURCE)

**URL:** [mass.gov/info-details/massgis-data-property-tax-parcels](https://www.mass.gov/info-details/massgis-data-property-tax-parcels)

**Best bulk data source for Massachusetts**

| Access Type | Format | Coverage |
|-------------|--------|----------|
| **Parcel Shapefiles** | Shapefile/GDB | All 351 municipalities |
| **FTP Downloads** | Per municipality | Updated annually |
| **Online Viewer** | Web map | Statewide seamless |

**Data Available:**
- Parcel boundaries
- Property characteristics from assessors
- Linked to municipal assessment data
- Level 3 standardized format

---

## Vision Government Solutions

**URL:** [vgsi.com/massachusetts-online-database](https://www.vgsi.com/massachusetts-online-database/)

**Covers majority of Massachusetts municipalities**

| Access Type | URL Pattern | Format |
|-------------|-------------|--------|
| **Town Portals** | gis.vgsi.com/{townname}ma/ | HTML |
| **Property Search** | By address, owner, parcel | Online |

**Examples:**
- Lawrence: [gis.vgsi.com/lawrencema](https://gis.vgsi.com/lawrencema/)
- Paxton: [gis.vgsi.com/paxtonma](https://gis.vgsi.com/paxtonma/)

**Scraping Approach:**
```
1. Build single Vision scraper
2. Configure for each municipality
3. Standard URL patterns and fields
4. Rate limit: 3-5 seconds
5. ~200+ towns use Vision
```

---

## Massachusetts Implementation Plan

### Phase 1: MassGIS Bulk Import
```
1. Download statewide parcel shapefiles
2. All 351 municipalities
3. Import to database with geometry
```

### Phase 2: Vision Scraping (for current assessments)
```
1. Build Vision Government Solutions scraper
2. Configure for ~200 municipalities
3. Get current assessed values, owner info
```

### Phase 3: Non-Vision Municipalities
```
1. Identify municipalities using other systems
2. Build scrapers as needed
3. Some may use Patriot Properties or custom
```

---

# CONNECTICUT (Detailed Research - Town-Level Taxation)

## Overview

| Attribute | Value |
|-----------|-------|
| Tax Level | **Municipality (Town)** |
| Total Municipalities | 169 |
| Primary Platforms | Vision Government Solutions + Patriot Properties |
| API Availability | **Tier 3** - Vendor platform scraping |
| Data Quality | Good |

## Platform Distribution

### Vision Government Solutions
**URL:** [vgsi.com/connecticut-online-database](https://www.vgsi.com/connecticut-online-database/)

| Access Type | URL Pattern | Format |
|-------------|-------------|--------|
| **Town Portals** | gis.vgsi.com/{townname}ct/ | HTML |
| **Property Search** | By address, owner, parcel | Online |

**Examples:**
- Winchester: [gis.vgsi.com/winchesterct](https://gis.vgsi.com/winchesterct/)
- South Windsor: Vision integration

### Patriot Properties
**Used by major cities**

| Municipality | URL | Format |
|--------------|-----|--------|
| Hartford | [assessor1.hartford.gov](http://assessor1.hartford.gov/Default.asp) | HTML |
| Manchester | [manchester.patriotproperties.com](https://manchester.patriotproperties.com/) | HTML |

### eQuality CAMA
**Based in Waterbury, CT**
- Some municipalities use this system
- Standardized data format
- Can interface with other CAMA vendors

---

## Connecticut Municipal Assessor Directory
**URL:** [portal.ct.gov/opm/igpp/directories/municipal-assessors](https://portal.ct.gov/opm/igpp/directories/municipal-assessors)

Lists all 169 municipal assessors with contact information.

---

## Connecticut Implementation Plan

### Phase 1: Vision Municipalities
```
1. Use Vision scraper from Massachusetts
2. Configure for CT towns
3. Same platform, different URLs
```

### Phase 2: Patriot Properties
```
1. Build Patriot Properties scraper
2. Hartford, Manchester, others
3. Different structure than Vision
```

### Phase 3: Other Systems
```
1. Identify eQuality users
2. Build scrapers as needed
3. 169 towns = manageable
```

---

# STATE CATEGORIZATION SUMMARY (UPDATED)

## Tier 1: Official REST API Available

| State | API Type | Coverage | Notes |
|-------|----------|----------|-------|
| **New York City** | Socrata SODA | Full city | Excellent, free API |
| **Maryland** | ArcGIS REST | Statewide | SDAT centralized |
| **Florida** | ArcGIS REST | Statewide | FDOT FeatureServer |
| **Cook County IL** | Socrata SODA | Cook County | Excellent data + GitHub |

## Tier 2: Bulk Downloads Available

| State | Source | Format | Coverage |
|-------|--------|--------|----------|
| **Florida** | FL DOR | Fixed-width/CSV | All 67 counties |
| **Texas (Harris)** | HCAD PDATA | Tab-delimited | Harris County only |
| **Maryland** | MD Planning | Shapefile | Statewide |
| **Massachusetts** | MassGIS | Shapefile/GDB | All 351 towns |
| **New Jersey** | NJ Open Data | File GDB | Statewide (MOD-IV) |
| **California (LA)** | data.lacounty.gov | Socrata | LA County |
| **Pennsylvania (Allegheny)** | WPRDC | CSV/API | Allegheny County |
| **Ohio (Franklin)** | ArcGIS Open Data | API | Franklin County |

## Tier 3: Vendor Platform (Scrapable)

| State | Platform | Coverage |
|-------|----------|----------|
| **Texas** | True Automation | ~150+ CADs |
| **Georgia** | qPublic | ~100+ counties |
| **North Carolina** | qPublic | Many counties |
| **South Carolina** | qPublic | Many counties |
| **Alabama** | qPublic | Many counties |
| **Massachusetts** | Vision Government | ~200 towns |
| **Connecticut** | Vision + Patriot | ~169 towns |
| **New Hampshire** | Vision Government | Many towns |
| **Rhode Island** | Vision Government | Many towns |

## Tier 4: Individual County/Town Websites

| State | Notes |
|-------|-------|
| **California** | 58 counties, LA has open data, others vary |
| **Illinois** | Cook County excellent, 101 others vary |
| **Ohio** | Franklin has ArcGIS, 87 others vary |
| **Pennsylvania** | Allegheny has WPRDC, 66 others vary |
| **New Jersey** | 564 municipalities, Daniel's Law restrictions |

## Tier 5: Limited/Manual Access

| State | Notes |
|-------|-------|
| **Rural New England** | Small towns, phone only |
| **Some Western states** | Limited online presence |

---

# RESEARCH STATUS

## Completed Research

| State | Status | Key Finding |
|-------|--------|-------------|
| ✅ Texas | Done | True Automation platform, HCAD bulk |
| ✅ Florida | Done | FL DOR bulk + FDOT API |
| ✅ New York City | Done | Socrata SODA API |
| ✅ Maryland | Done | Centralized SDAT + ArcGIS |
| ✅ Georgia | Done | qPublic platform |
| ✅ California | Done | LA Open Data, ParcelQuest commercial |
| ✅ Ohio | Done | Franklin ArcGIS, others fragmented |
| ✅ Illinois | Done | Cook County Socrata (excellent) |
| ✅ Pennsylvania | Done | Allegheny WPRDC, others fragmented |
| ✅ New Jersey | Done | MOD-IV data, Daniel's Law restrictions |
| ✅ Massachusetts | Done | MassGIS bulk + Vision platform |
| ✅ Connecticut | Done | Vision + Patriot platforms |

---

# IMPLEMENTATION PRIORITY (REVISED)

## Phase 1: API/Bulk States (Lowest Effort - Start Here)
```
1. NYC Open Data (Socrata) - ~1M parcels
2. Cook County IL (Socrata) - 1.8M parcels
3. Florida DOR + FDOT API - 10M parcels
4. Maryland ArcGIS - 2M parcels
5. LA County Open Data - 2.7M parcels
6. Massachusetts MassGIS - 2M parcels
7. Allegheny County WPRDC - 580K parcels
8. Franklin County OH ArcGIS - 500K parcels
```

## Phase 2: Vendor Platforms (Medium Effort)
```
1. True Automation (Texas) - 150+ CADs
2. qPublic (Georgia, Carolinas, Alabama)
3. Vision (MA, CT, NH, RI, VT)
4. Patriot Properties (CT cities)
```

## Phase 3: Individual Counties (Higher Effort)
```
1. Major California counties (San Diego, Orange, etc.)
2. Ohio counties (Cuyahoga, Hamilton, Summit)
3. Illinois collar counties
4. Pennsylvania counties
```

## Phase 4: Complex States (Highest Effort)
```
1. New Jersey municipalities (564 towns)
2. Small New England towns
3. As needed based on portfolio
```

---

# ESTIMATED COVERAGE BY EFFORT

| Effort Level | Parcels Covered | States/Areas |
|--------------|-----------------|--------------|
| **API/Bulk (Low)** | ~20M parcels | NYC, Cook County, FL, MD, LA, MA, Allegheny, Franklin |
| **Vendor Platform (Medium)** | ~15M parcels | TX, GA, NC, SC, AL, New England |
| **Individual Counties (High)** | ~10M parcels | CA, OH, IL, PA remaining |
| **Total Addressable** | ~45M parcels | ~70% of US property market |
