# Assessor Website Scraping Research

**Created:** January 10, 2026
**Purpose:** Identify assessor data sources for property characteristics, valuations, and sales history

---

## Assessor vs Tax Collector: Data Comparison

| Data Type | Assessor Site | Tax Collector Site |
|-----------|---------------|-------------------|
| Property characteristics | ✅ Primary source | ❌ Usually not |
| Assessed/market values | ✅ Primary source | ⚠️ Sometimes |
| Sales history | ✅ Usually | ❌ Rarely |
| Ownership history | ✅ Often | ⚠️ Current only |
| Building permits | ✅ Sometimes | ❌ No |
| Property photos/sketches | ✅ Often | ❌ No |
| Tax bill amounts | ⚠️ Sometimes | ✅ Primary source |
| Delinquent taxes | ❌ Rarely | ✅ Primary source |
| Tax sale info | ❌ No | ✅ Primary source |
| Payment history | ❌ No | ✅ Primary source |

**Conclusion:** Need BOTH assessor AND tax collector scraping for complete picture.

---

## Data Available from Assessor Sites

### Property Identification
```
- Parcel ID / APN / Tax Map ID
- Alternate parcel numbers
- Legal description
- Subdivision/plat info
- Tax district/school district
```

### Property Characteristics
```
- Property type/class (SFR, Condo, Multi, Commercial, Land)
- Year built
- Square footage (living area)
- Total building area
- Lot size (SF or acres)
- Bedrooms / Bathrooms
- Stories/floors
- Basement (yes/no, finished SF)
- Garage (type, spaces)
- Pool (yes/no)
- Construction type (frame, brick, etc.)
- Roof type
- Heating/cooling
- Condition rating
- Quality grade
```

### Valuation Data
```
- Total assessed value
- Land value
- Improvement value
- Market value (if different from assessed)
- Assessment ratio
- Exempt amounts
- Taxable value
- Prior year values (history)
- Assessment date
```

### Sales History
```
- Sale date
- Sale price
- Deed type (warranty, quit claim, etc.)
- Deed book/page
- Grantor (seller)
- Grantee (buyer)
- Qualification code (arm's length, family, etc.)
```

### Ownership
```
- Current owner name(s)
- Owner address
- Mailing address
- Ownership type (individual, trust, LLC, etc.)
- Homestead exemption status
```

### Additional Data (some sites)
```
- Building permits (date, type, value)
- Property photos
- Building sketches/floor plans
- Flood zone
- Zoning
- Census tract
- Neighborhood code
```

---

## Assessor Platform Analysis

### Vision Government Solutions (Assessor Data)
```
Coverage: ~500+ municipalities (New England + others)
Data Quality: EXCELLENT

Available Data:
✅ Full property characteristics
✅ Assessed values (land + improvement)
✅ Sales history
✅ Owner information
✅ Building sketches (many towns)
✅ Property photos (some towns)

URL Pattern: https://gis.vgsi.com/{town}/
Parcel Page: /Parcel.aspx?pid={id}

Scraping Notes:
- Data in structured HTML tables
- Consistent field labels across towns
- May need to click tabs for full data
- Photos/sketches in separate sections

Sample Fields:
- "Total Assessed Value"
- "Land Value" / "Building Value"
- "Year Built"
- "Living Area"
- "Style" (Colonial, Ranch, etc.)
- "Bedrooms" / "Full Bath" / "Half Bath"
```

### qPublic / Schneider Corp (Assessor Data)
```
Coverage: ~200+ counties (Southeast focus)
Data Quality: EXCELLENT

Available Data:
✅ Property characteristics
✅ Assessed and market values
✅ Sales history with prices
✅ Building details
✅ Land use codes
⚠️ Photos (varies by county)

URL Pattern: https://qpublic.schneidercorp.com/
County Subdomains vary

Scraping Notes:
- Tabbed interface (Summary, Values, Sales, etc.)
- Each tab is a separate request
- Values often broken down by year
- Sales history includes deed references
```

### County Assessor GIS Portals
```
Coverage: Most US counties have some form
Data Quality: VARIES WIDELY

Common Platforms:
- Esri ArcGIS Online
- Trimble/Cityworks
- Harris Govern
- Tyler Eagle
- Farragut Systems

Available Data:
✅ Basic property info
✅ Values
⚠️ Sales history (varies)
⚠️ Characteristics (varies)

Scraping Challenge:
- Many are JavaScript-heavy (React, Angular)
- May require headless browser
- API endpoints sometimes discoverable
```

### CAMAvision / CAMA Systems
```
Coverage: Various counties
Data Quality: GOOD

"Computer Assisted Mass Appraisal" systems
Often the back-end for assessor data

May expose:
- Property cards
- Valuation models
- Comparable sales
- Cost approach data
```

### Florida Property Appraiser Sites
```
Coverage: All 67 FL counties
Data Quality: EXCELLENT

Florida has strong sunshine laws = great data access

Available Data:
✅ Full property characteristics
✅ Just/assessed/taxable values
✅ Sales history with prices
✅ Exemptions
✅ Building sketches
✅ Aerial photos
✅ Permit history

Major Counties:
- Miami-Dade: pa.miamidade.gov
- Broward: bcpa.net
- Palm Beach: pbcgov.org/papa
- Orange: ocpafl.org
- Hillsborough: hcpafl.org

Many have REST APIs or structured data
```

### Texas CAD Sites (Appraisal Districts)
```
Coverage: ~254 counties
Data Quality: VERY GOOD

Texas CADs do both assessment AND some tax functions

Available Data:
✅ Property characteristics
✅ Market/assessed values
✅ Improvement details
✅ Land schedules
✅ Ag valuations
⚠️ Sales (not always public in TX)

Common Platforms:
- True Automation (TrueProdigy)
- Harris Govern
- Tyler Technologies

Note: Texas doesn't require sale price disclosure,
so sales data is limited compared to other states
```

### California County Assessors
```
Coverage: 58 counties
Data Quality: GOOD but COMPLEX

Prop 13 Complications:
- Assessed value may be far below market
- Reassessment triggers (sale, new construction)
- Supplemental assessments

Available Data:
✅ Assessed values (Prop 13 base)
✅ Property characteristics
⚠️ Market value (not always shown)
✅ Transfer history
⚠️ Sales prices (public record but not always displayed)

Major Counties:
- Los Angeles: assessor.lacounty.gov
- San Diego: sdarcc.com
- Orange: ocassessor.gov
- Riverside: riversideacr.com
```

---

## Combined Scraping Strategy

### Unified Property Research Record

```typescript
interface PropertyResearchData {
  // === IDENTIFICATION ===
  parcelId: string;
  altParcelId?: string;
  legalDescription?: string;

  // === LOCATION ===
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  municipality?: string;  // For town-tax states

  // === PROPERTY CHARACTERISTICS (from Assessor) ===
  propertyType: string;   // SFR, Condo, Multi, Commercial, Land
  propertyClass?: string; // Local classification code
  yearBuilt?: number;
  effectiveYearBuilt?: number;
  livingArea?: number;    // Square feet
  totalBuildingArea?: number;
  lotSizeSF?: number;
  lotSizeAcres?: number;
  bedrooms?: number;
  bathsFull?: number;
  bathsHalf?: number;
  stories?: number;
  basement?: {
    hasBasement: boolean;
    finishedSF?: number;
    unfinishedSF?: number;
  };
  garage?: {
    type: string;  // Attached, Detached, Carport, None
    spaces?: number;
  };
  pool?: boolean;
  constructionType?: string;
  roofType?: string;
  heatingCooling?: string;
  condition?: string;
  quality?: string;

  // === VALUES (from Assessor) ===
  assessedTotal?: number;
  assessedLand?: number;
  assessedImprovement?: number;
  marketValue?: number;
  taxableValue?: number;
  assessmentYear?: number;
  priorYearValues?: Array<{
    year: number;
    assessed: number;
    market?: number;
  }>;

  // === TAX DATA (from Tax Collector) ===
  annualTaxAmount?: number;
  taxYear?: number;
  delinquentAmount?: number;
  delinquentYears?: string[];
  taxSaleScheduled?: boolean;
  taxSaleDate?: string;
  redemptionDeadline?: string;

  // === SALES HISTORY (from Assessor/Recorder) ===
  salesHistory?: Array<{
    saleDate: string;
    salePrice?: number;
    deedType?: string;
    deedBook?: string;
    deedPage?: string;
    grantor?: string;   // Seller
    grantee?: string;   // Buyer
    qualified?: boolean; // Arm's length transaction
  }>;

  // === OWNERSHIP (from Assessor) ===
  ownerName: string;
  ownerAddress?: string;
  mailingAddress?: string;
  ownershipType?: string;  // Individual, Trust, LLC, etc.
  homesteadExempt?: boolean;

  // === PERMITS (from Assessor/Building Dept) ===
  permits?: Array<{
    permitDate: string;
    permitType: string;
    description?: string;
    value?: number;
    status?: string;
  }>;

  // === MEDIA ===
  photos?: Array<{
    url: string;
    type: string;  // Exterior, Interior, Aerial, Sketch
    source: string;
  }>;
  hasSketch?: boolean;
  sketchUrl?: string;

  // === METADATA ===
  sources: {
    assessor?: {
      url: string;
      scrapedAt: string;
      platform: string;
    };
    taxCollector?: {
      url: string;
      scrapedAt: string;
      platform: string;
    };
    recorder?: {
      url: string;
      scrapedAt: string;
    };
    gis?: {
      url: string;
      scrapedAt: string;
    };
  };
}
```

---

## Scraper Architecture (Expanded)

```
┌─────────────────────────────────────────────────────────────────┐
│                  PROPERTY RESEARCH SERVICE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   REQUEST COORDINATOR                    │   │
│  │  Determines which scrapers to call for complete data    │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │  ASSESSOR   │     │TAX COLLECTOR│     │   RECORDER  │      │
│  │  SCRAPERS   │     │  SCRAPERS   │     │  SCRAPERS   │      │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘      │
│         │                   │                   │              │
│  ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐      │
│  │• Vision     │     │• Vision     │     │• County     │      │
│  │• qPublic    │     │• qPublic    │     │  Recorder   │      │
│  │• FL Appraiser│    │• TrueAuto   │     │• ACRIS (NY) │      │
│  │• TX CAD     │     │• Beacon     │     │• DataTree   │      │
│  │• CA Assessor│     │• Direct Co. │     │             │      │
│  │• GIS Portals│     │             │     │             │      │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘      │
│         │                   │                   │              │
│         └───────────────────┼───────────────────┘              │
│                             ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    DATA MERGER                           │  │
│  │  Combines assessor + tax + recorder into unified record │  │
│  │  Resolves conflicts (assessor value vs tax value)       │  │
│  │  Flags discrepancies for review                         │  │
│  └───────────────────────────┬─────────────────────────────┘  │
│                              │                                 │
│  ┌───────────────────────────┴─────────────────────────────┐  │
│  │                   STORAGE LAYER                          │  │
│  │  property_research (current) + property_research_history │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Expanded)

### Property Research Table (Combined Assessor + Tax)

```sql
-- Main property research table (combines assessor + tax collector data)
CREATE TABLE property_research (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id),
    collateral_id INTEGER REFERENCES collateral(id),

    -- === IDENTIFICATION ===
    parcel_id VARCHAR(100),
    parcel_id_alt VARCHAR(100),
    legal_description TEXT,

    -- === LOCATION ===
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state_code CHAR(2) NOT NULL,
    zip VARCHAR(10),
    county VARCHAR(100),
    municipality VARCHAR(100),
    jurisdiction_id INTEGER REFERENCES tax_jurisdictions(id),

    -- === PROPERTY CHARACTERISTICS (Assessor) ===
    property_type VARCHAR(50),
    property_class VARCHAR(50),
    year_built INTEGER,
    effective_year_built INTEGER,
    living_area_sf INTEGER,
    total_building_sf INTEGER,
    lot_size_sf INTEGER,
    lot_size_acres DECIMAL(10,4),
    bedrooms INTEGER,
    baths_full INTEGER,
    baths_half INTEGER,
    stories DECIMAL(3,1),
    has_basement BOOLEAN,
    basement_finished_sf INTEGER,
    basement_unfinished_sf INTEGER,
    garage_type VARCHAR(50),
    garage_spaces INTEGER,
    has_pool BOOLEAN,
    construction_type VARCHAR(100),
    roof_type VARCHAR(100),
    heating_cooling VARCHAR(100),
    condition_rating VARCHAR(50),
    quality_grade VARCHAR(50),

    -- === VALUES (Assessor) ===
    assessed_total DECIMAL(15,2),
    assessed_land DECIMAL(15,2),
    assessed_improvement DECIMAL(15,2),
    market_value DECIMAL(15,2),
    taxable_value DECIMAL(15,2),
    assessment_year INTEGER,

    -- === TAX DATA (Tax Collector) ===
    annual_tax_amount DECIMAL(12,2),
    tax_year INTEGER,
    delinquent_amount DECIMAL(12,2),
    delinquent_years TEXT,
    tax_sale_scheduled BOOLEAN DEFAULT FALSE,
    tax_sale_date DATE,
    redemption_deadline DATE,
    tax_sale_amount DECIMAL(12,2),

    -- === OWNERSHIP ===
    owner_name VARCHAR(255),
    owner_address TEXT,
    mailing_address TEXT,
    ownership_type VARCHAR(50),
    homestead_exempt BOOLEAN,

    -- === MEDIA ===
    has_photos BOOLEAN DEFAULT FALSE,
    has_sketch BOOLEAN DEFAULT FALSE,
    photo_urls JSONB,        -- Array of {url, type, source}
    sketch_url VARCHAR(500),

    -- === SOURCE TRACKING ===
    assessor_source VARCHAR(50),
    assessor_url VARCHAR(500),
    assessor_scraped_at TIMESTAMP,
    tax_collector_source VARCHAR(50),
    tax_collector_url VARCHAR(500),
    tax_collector_scraped_at TIMESTAMP,
    recorder_url VARCHAR(500),
    recorder_scraped_at TIMESTAMP,

    -- === STATUS ===
    research_status VARCHAR(50) DEFAULT 'pending',
    assessor_status VARCHAR(50) DEFAULT 'pending',
    tax_status VARCHAR(50) DEFAULT 'pending',
    is_stale BOOLEAN DEFAULT FALSE,
    has_discrepancy BOOLEAN DEFAULT FALSE,
    needs_manual_review BOOLEAN DEFAULT FALSE,
    is_tax_sale_risk BOOLEAN DEFAULT FALSE,

    -- === NOTES ===
    researcher_notes TEXT,
    system_notes TEXT,
    discrepancy_notes TEXT,

    -- === AUDIT ===
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),

    -- Unique constraint
    UNIQUE(loan_id, collateral_id)
);

-- Sales history (from assessor/recorder)
CREATE TABLE property_sales_history (
    id SERIAL PRIMARY KEY,
    property_research_id INTEGER REFERENCES property_research(id) ON DELETE CASCADE,

    sale_date DATE,
    sale_price DECIMAL(15,2),
    deed_type VARCHAR(50),
    deed_book VARCHAR(50),
    deed_page VARCHAR(50),
    grantor VARCHAR(255),      -- Seller
    grantee VARCHAR(255),      -- Buyer
    is_qualified BOOLEAN,      -- Arm's length transaction
    qualification_code VARCHAR(50),
    source VARCHAR(50),
    source_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Value history (year over year from assessor)
CREATE TABLE property_value_history (
    id SERIAL PRIMARY KEY,
    property_research_id INTEGER REFERENCES property_research(id) ON DELETE CASCADE,

    assessment_year INTEGER NOT NULL,
    assessed_total DECIMAL(15,2),
    assessed_land DECIMAL(15,2),
    assessed_improvement DECIMAL(15,2),
    market_value DECIMAL(15,2),
    taxable_value DECIMAL(15,2),
    source VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_research_id, assessment_year)
);

-- Permit history (from assessor/building dept)
CREATE TABLE property_permits (
    id SERIAL PRIMARY KEY,
    property_research_id INTEGER REFERENCES property_research(id) ON DELETE CASCADE,

    permit_date DATE,
    permit_number VARCHAR(100),
    permit_type VARCHAR(100),
    description TEXT,
    estimated_value DECIMAL(12,2),
    status VARCHAR(50),
    source VARCHAR(50),
    source_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full history of all changes
CREATE TABLE property_research_history (
    id SERIAL PRIMARY KEY,
    property_research_id INTEGER REFERENCES property_research(id) ON DELETE CASCADE,

    data_snapshot JSONB NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    change_source VARCHAR(50),  -- 'assessor_scraper', 'tax_scraper', 'user', 'import'
    change_reason TEXT,
    fields_changed TEXT[],
    previous_values JSONB,
    new_values JSONB,

    scrape_url VARCHAR(500),
    scrape_raw_html TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_property_research_loan ON property_research(loan_id);
CREATE INDEX idx_property_research_collateral ON property_research(collateral_id);
CREATE INDEX idx_property_research_state ON property_research(state_code);
CREATE INDEX idx_property_research_status ON property_research(research_status);
CREATE INDEX idx_property_research_stale ON property_research(is_stale) WHERE is_stale = TRUE;
CREATE INDEX idx_property_research_tax_sale ON property_research(is_tax_sale_risk) WHERE is_tax_sale_risk = TRUE;
CREATE INDEX idx_sales_history_property ON property_sales_history(property_research_id);
CREATE INDEX idx_value_history_property ON property_value_history(property_research_id);
CREATE INDEX idx_permits_property ON property_permits(property_research_id);
```

---

## Assessor Platform Scrapers

### Vision Government Solutions (Assessor)

```typescript
class VisionAssessorScraper {
  // Vision combines assessor + tax in one interface

  async scrapeProperty(townCode: string, parcelId: string): Promise<AssessorData> {
    const url = `https://gis.vgsi.com/${townCode}/Parcel.aspx?pid=${parcelId}`;

    // Get main parcel page
    const html = await this.fetch(url);
    const $ = cheerio.load(html);

    return {
      // Property characteristics
      propertyType: this.extractField($, 'Use Code'),
      yearBuilt: this.extractNumber($, 'Year Built'),
      livingArea: this.extractNumber($, 'Living Area'),
      lotSize: this.extractNumber($, 'Lot Size'),
      bedrooms: this.extractNumber($, 'Bedrooms'),
      bathsFull: this.extractNumber($, 'Full Bath'),
      bathsHalf: this.extractNumber($, 'Half Bath'),
      stories: this.extractNumber($, 'Stories'),
      style: this.extractField($, 'Style'),
      condition: this.extractField($, 'Condition'),

      // Values
      assessedTotal: this.extractCurrency($, 'Total Assessed Value'),
      assessedLand: this.extractCurrency($, 'Land Value'),
      assessedImprovement: this.extractCurrency($, 'Building Value'),

      // Owner
      ownerName: this.extractField($, 'Owner'),
      ownerAddress: this.extractField($, 'Location'),
      mailingAddress: this.extractField($, 'Mailing Address'),

      // Sales (may be on separate tab)
      salesHistory: await this.scrapeSalesTab(townCode, parcelId),

      // Check for sketch/photos
      hasSketch: $('.sketch-image').length > 0,
      hasPhotos: $('.property-photo').length > 0,

      sourceUrl: url,
      scrapedAt: new Date()
    };
  }
}
```

### Florida Property Appraiser

```typescript
class FloridaAssessorScraper {
  // Each FL county has different site but similar data

  private countyConfigs = {
    'miami-dade': {
      baseUrl: 'https://www.miamidade.gov/pa/',
      searchEndpoint: 'propertySearch.asp',
      detailPattern: '/propertysearch/#/folio/{folio}'
    },
    'broward': {
      baseUrl: 'https://web.bcpa.net/',
      searchEndpoint: 'BcpaClient/',
      hasApi: true,
      apiEndpoint: '/api/property/'
    },
    'palm-beach': {
      baseUrl: 'https://www.pbcgov.org/papa/',
      searchEndpoint: 'aspx/web/search.aspx'
    }
    // ... more counties
  };

  async scrapeProperty(county: string, folio: string): Promise<AssessorData> {
    const config = this.countyConfigs[county];

    if (config.hasApi) {
      return this.scrapeViaApi(config, folio);
    } else {
      return this.scrapeViaHtml(config, folio);
    }
  }

  private async scrapeViaApi(config: CountyConfig, folio: string) {
    // Some FL counties have REST APIs
    const response = await fetch(`${config.baseUrl}${config.apiEndpoint}${folio}`);
    const data = await response.json();

    return this.normalizeFlData(data);
  }
}
```

### Texas CAD Scraper

```typescript
class TexasCADScraper {
  // Most TX CADs use True Automation platform

  async scrapeProperty(county: string, propertyId: string): Promise<AssessorData> {
    // True Automation URL pattern
    const url = `https://esearch.${county}cad.org/Property/View/${propertyId}`;

    const html = await this.fetch(url);
    const $ = cheerio.load(html);

    return {
      // Texas-specific fields
      propertyType: this.extractField($, 'Property Type'),
      legalDescription: this.extractField($, 'Legal Description'),

      // Characteristics
      yearBuilt: this.extractNumber($, 'Year Built'),
      livingArea: this.extractNumber($, 'Living Area'),
      landArea: this.extractNumber($, 'Land Area'),

      // TX uses different value types
      marketValue: this.extractCurrency($, 'Market Value'),
      assessedValue: this.extractCurrency($, 'Assessed Value'),
      landValue: this.extractCurrency($, 'Land Value'),
      improvementValue: this.extractCurrency($, 'Improvement Value'),
      agValue: this.extractCurrency($, 'Ag Use Value'), // TX agricultural

      // Exemptions (important in TX)
      exemptions: this.extractExemptions($),

      // Owner
      ownerName: this.extractField($, 'Owner Name'),
      mailingAddress: this.extractField($, 'Mailing Address'),

      // Note: TX doesn't require sale price disclosure
      // Sales data limited compared to other states

      sourceUrl: url,
      scrapedAt: new Date()
    };
  }
}
```

---

## Combined Research Workflow

```typescript
class PropertyResearchService {

  async researchProperty(collateralId: number, options: ResearchOptions = {}) {
    const collateral = await this.getCollateral(collateralId);
    const jurisdiction = await this.getJurisdiction(collateral.state, collateral.county, collateral.city);

    // Determine which scrapers to use
    const scrapers = this.getScrapersForJurisdiction(jurisdiction);

    const results: PartialPropertyData[] = [];

    // Run scrapers in parallel where possible
    const scrapePromises = [];

    if (scrapers.assessor) {
      scrapePromises.push(
        this.runAssessorScraper(scrapers.assessor, collateral)
          .then(data => results.push({ source: 'assessor', data }))
      );
    }

    if (scrapers.taxCollector) {
      scrapePromises.push(
        this.runTaxScraper(scrapers.taxCollector, collateral)
          .then(data => results.push({ source: 'taxCollector', data }))
      );
    }

    if (scrapers.recorder && options.includeSales) {
      scrapePromises.push(
        this.runRecorderScraper(scrapers.recorder, collateral)
          .then(data => results.push({ source: 'recorder', data }))
      );
    }

    await Promise.allSettled(scrapePromises);

    // Merge results into unified record
    const merged = this.mergeResults(results);

    // Detect discrepancies
    const discrepancies = this.detectDiscrepancies(merged);
    if (discrepancies.length > 0) {
      merged.hasDiscrepancy = true;
      merged.discrepancyNotes = discrepancies.join('; ');
    }

    // Compare to previous data
    const changes = await this.detectChanges(collateralId, merged);

    // Save with history
    await this.saveWithHistory(collateralId, merged, changes);

    // Check for alerts
    await this.checkAlerts(collateralId, merged);

    return merged;
  }

  private mergeResults(results: PartialPropertyData[]): PropertyResearchData {
    // Priority: assessor for characteristics/values, tax collector for taxes
    const merged: PropertyResearchData = {};

    for (const result of results) {
      if (result.source === 'assessor') {
        // Assessor is authoritative for property characteristics
        Object.assign(merged, {
          propertyType: result.data.propertyType,
          yearBuilt: result.data.yearBuilt,
          livingArea: result.data.livingArea,
          // ... all property characteristics
          assessedTotal: result.data.assessedTotal,
          assessedLand: result.data.assessedLand,
          marketValue: result.data.marketValue,
          ownerName: result.data.ownerName,
        });
      }

      if (result.source === 'taxCollector') {
        // Tax collector is authoritative for tax amounts
        Object.assign(merged, {
          annualTaxAmount: result.data.annualTaxAmount,
          delinquentAmount: result.data.delinquentAmount,
          taxSaleScheduled: result.data.taxSaleScheduled,
          taxSaleDate: result.data.taxSaleDate,
        });
      }

      if (result.source === 'recorder') {
        merged.salesHistory = result.data.salesHistory;
      }
    }

    return merged;
  }

  private detectDiscrepancies(data: PropertyResearchData): string[] {
    const discrepancies: string[] = [];

    // Check if assessor value differs significantly from tax value
    if (data.assessedTotal && data.taxableValue) {
      const diff = Math.abs(data.assessedTotal - data.taxableValue) / data.assessedTotal;
      if (diff > 0.1) { // >10% difference
        discrepancies.push(`Assessed value ($${data.assessedTotal}) differs from taxable value ($${data.taxableValue})`);
      }
    }

    // Check owner name consistency
    if (data.ownerName && data.taxOwnerName) {
      if (!this.namesMatch(data.ownerName, data.taxOwnerName)) {
        discrepancies.push(`Assessor owner (${data.ownerName}) differs from tax owner (${data.taxOwnerName})`);
      }
    }

    return discrepancies;
  }
}
```

---

## TypeScript Interfaces (Add to types)

```typescript
// === ASSESSOR-SPECIFIC TYPES ===

export interface AssessorData {
  // Property identification
  parcelId: string;
  altParcelId?: string;
  legalDescription?: string;

  // Characteristics
  propertyType?: string;
  propertyClass?: string;
  yearBuilt?: number;
  effectiveYearBuilt?: number;
  livingAreaSF?: number;
  totalBuildingSF?: number;
  lotSizeSF?: number;
  lotSizeAcres?: number;
  bedrooms?: number;
  bathsFull?: number;
  bathsHalf?: number;
  stories?: number;
  basement?: BasementInfo;
  garage?: GarageInfo;
  hasPool?: boolean;
  constructionType?: string;
  roofType?: string;
  heatingCooling?: string;
  condition?: string;
  quality?: string;

  // Values
  assessedTotal?: number;
  assessedLand?: number;
  assessedImprovement?: number;
  marketValue?: number;
  taxableValue?: number;
  assessmentYear?: number;

  // Owner
  ownerName?: string;
  ownerAddress?: string;
  mailingAddress?: string;
  ownershipType?: string;
  homesteadExempt?: boolean;

  // Media
  hasPhotos?: boolean;
  photoUrls?: string[];
  hasSketch?: boolean;
  sketchUrl?: string;

  // Source
  sourceUrl: string;
  scrapedAt: Date;
}

export interface BasementInfo {
  hasBasement: boolean;
  finishedSF?: number;
  unfinishedSF?: number;
  type?: string;
}

export interface GarageInfo {
  type: 'Attached' | 'Detached' | 'Carport' | 'None';
  spaces?: number;
  areaSF?: number;
}

export interface SaleRecord {
  saleDate: string;
  salePrice?: number;
  deedType?: string;
  deedBook?: string;
  deedPage?: string;
  grantor?: string;
  grantee?: string;
  isQualified?: boolean;
  qualificationCode?: string;
}

export interface PermitRecord {
  permitDate: string;
  permitNumber?: string;
  permitType: string;
  description?: string;
  estimatedValue?: number;
  status?: string;
}

export interface PropertyResearch extends AssessorData {
  id: number;
  loanId: number;
  collateralId: number;

  // Tax collector data (merged)
  annualTaxAmount?: number;
  taxYear?: number;
  delinquentAmount?: number;
  delinquentYears?: string[];
  taxSaleScheduled?: boolean;
  taxSaleDate?: string;
  redemptionDeadline?: string;

  // Related records
  salesHistory?: SaleRecord[];
  valueHistory?: Array<{
    year: number;
    assessed: number;
    market?: number;
  }>;
  permits?: PermitRecord[];

  // Status tracking
  researchStatus: 'pending' | 'scraped' | 'verified' | 'complete' | 'needs_review' | 'flagged';
  assessorStatus: 'pending' | 'scraped' | 'failed' | 'manual';
  taxStatus: 'pending' | 'scraped' | 'failed' | 'manual';
  isStale: boolean;
  hasDiscrepancy: boolean;
  needsManualReview: boolean;
  isTaxSaleRisk: boolean;

  // Source tracking
  assessorSource?: string;
  assessorUrl?: string;
  assessorScrapedAt?: string;
  taxCollectorSource?: string;
  taxCollectorUrl?: string;
  taxCollectorScrapedAt?: string;

  // Notes
  researcherNotes?: string;
  systemNotes?: string;
  discrepancyNotes?: string;
}
```

---

## Summary

Assessor scraping adds:
- **Property characteristics** (beds, baths, sqft, year built, etc.)
- **Property valuations** (assessed, market, land vs improvement)
- **Sales history** (dates, prices, buyers/sellers)
- **Building permits** (renovations, additions)
- **Property photos/sketches**

Combined with tax collector scraping, you get complete property intelligence for underwriting.

**Same platforms, more data:**
- Vision, qPublic, etc. often have BOTH assessor and tax data
- One scraper can pull both data types
- Merge into unified `property_research` record
