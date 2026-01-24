# US Property Parcel Lookup Framework

**Created:** January 24, 2026
**Purpose:** Scalable architecture for automated property tax lookups across US counties

---

## Overview

This framework provides a unified interface for looking up property parcel information across US counties. The key architectural insight is that **one adapter per vendor platform covers hundreds of counties**.

### Current Coverage

| State | Counties | Primary Platforms |
|-------|----------|-------------------|
| Texas | 113 | True Automation (110), ArcGIS (1), Custom (2) |
| Florida | 5 | Custom scrapers |
| California | 3 | Custom scrapers |
| New York | 2 | Custom scrapers |
| **Total** | **123** | |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Parcel Lookup Service                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  lookup_parcel("Harris", "TX", "1170310000010")                 │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              County Registry (registry.py)              │     │
│  │  Maps: County + State → Platform + Config              │     │
│  └────────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │           Platform Adapter (adapters/*.py)              │     │
│  │                                                         │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │     │
│  │  │ True Auto    │  │   ArcGIS     │  │   Custom     │ │     │
│  │  │ (~150 ctys)  │  │   REST API   │  │  Scrapers    │ │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │     │
│  └────────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              ParcelInfo (Standardized Output)           │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```python
from parcel_lookup import lookup_parcel, get_supported_counties

# Look up a property
result = lookup_parcel("Harris", "TX", "1170310000010")
print(f"Owner: {result.owner_name}")
print(f"Value: ${result.total_value:,.0f}")

# List all supported counties in Texas
counties = get_supported_counties("TX")
for c in counties:
    print(f"{c['county']}: {c['platform']}")
```

---

## Platform Adapters

### 1. True Automation (Harris Govern)

**Coverage:** ~150+ counties across multiple states
**Method:** ASP.NET form scraping
**Config:** Just need `cad_id` for each county

```python
register_county(CountyConfig(
    state="TX",
    county="Bexar",
    platform=Platform.TRUE_AUTOMATION,
    base_url="https://propaccess.trueautomation.com",
    cad_id=110,  # This is the only unique config needed
    rate_limit_seconds=2.0,
))
```

**Finding CAD IDs:**
1. Visit `https://propaccess.trueautomation.com`
2. Select county from dropdown
3. Note the `cid=XX` parameter in URL

### 2. ArcGIS REST API

**Coverage:** Counties with Esri GIS portals
**Method:** Direct JSON API
**Config:** Need `base_url` and `parcel_id_field`

```python
register_county(CountyConfig(
    state="TX",
    county="Harris",
    platform=Platform.ARCGIS_REST,
    base_url="https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0",
    parcel_id_field="acct_num",
))
```

**Finding ArcGIS endpoints:**
1. Search for `{county} GIS parcel viewer`
2. Open browser dev tools → Network tab
3. Look for requests to `*/arcgis/rest/services/*/query*`

### 3. Custom Scrapers

**Coverage:** Large counties with proprietary systems
**Method:** BeautifulSoup/Selenium web scraping
**Config:** Need `scraper_class` and optional Selenium flag

```python
register_county(CountyConfig(
    state="TX",
    county="Dallas",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://www.dallascad.org",
    extra={"scraper_class": "DallasCountyScraper"}
))
```

---

## Adding a New County

### Step 1: Identify the Platform

1. **Check True Automation first** - Highest leverage
   - Visit https://propaccess.trueautomation.com
   - If county is in dropdown, just need CAD ID

2. **Check for ArcGIS**
   - Search `{county} parcel GIS map`
   - Look for Esri/ArcGIS branding or REST endpoints

3. **Custom scraper needed**
   - Large proprietary systems require custom code

### Step 2: Add to Registry

```python
# In src/parcel_lookup/registry.py

# For True Automation:
TRUE_AUTOMATION_TEXAS["NewCounty"] = 999  # CAD ID

# For ArcGIS:
register_county(CountyConfig(
    state="TX",
    county="NewCounty",
    platform=Platform.ARCGIS_REST,
    base_url="https://...",
    parcel_id_field="PARCEL_ID",
))

# For Custom:
register_county(CountyConfig(
    state="TX",
    county="NewCounty",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://...",
    extra={"scraper_class": "NewCountyScraper"}
))
```

### Step 3: Test

```python
from parcel_lookup import lookup_parcel

result = lookup_parcel("NewCounty", "TX", "test-parcel-id")
assert result is not None
assert result.owner_name
assert result.total_value > 0
```

---

## Standardized Output: ParcelInfo

All lookups return the same `ParcelInfo` dataclass:

```python
@dataclass
class ParcelInfo:
    # Location
    state: str              # "TX"
    county: str             # "Harris"
    parcel_id: str          # "1170310000010"

    # Owner
    owner_name: str         # "SMITH JOHN"
    mailing_address: str    # "123 MAIN ST, HOUSTON TX 77001"

    # Property
    property_address: str   # "456 OAK DR, HOUSTON 77002"
    legal_description: str  # "LOT 1 BLK 2 SUNSET HILLS"
    property_class: str     # "A1" (single family)
    acreage: float          # 0.25

    # Values
    land_value: float       # 150000.0
    building_value: float   # 350000.0
    total_value: float      # 500000.0
    assessed_value: float   # 500000.0
    taxable_value: float    # 450000.0

    # Tax
    tax_year: str           # "2025"
    tax_amount: float       # 12500.0
    tax_status: str         # "Current"

    # Metadata
    source_url: str         # URL where data was fetched
    raw_data: dict          # Original API/scrape response
```

---

## Rate Limiting

Each county config has a `rate_limit_seconds` setting (default 1.0s).

```python
register_county(CountyConfig(
    ...
    rate_limit_seconds=2.0,  # Wait 2s between requests
))
```

Be respectful of county systems - most are small government IT departments.

---

## File Structure

```
src/parcel_lookup/
├── __init__.py           # Public API exports
├── core.py               # ParcelInfo, CountyConfig, Platform enum
├── registry.py           # County → Platform mapping database
└── adapters/
    ├── __init__.py       # get_adapter() factory
    ├── base.py           # BaseAdapter ABC
    ├── true_automation.py # True Automation (~150 counties)
    ├── arcgis.py         # ArcGIS REST API
    └── custom_scrapers.py # Dallas, Tarrant, etc.
```

---

## Expansion Roadmap

### High-Leverage Targets

1. **Tyler Technologies (Tyler Eagle)** - ~100+ counties
2. **Aumentum (Thomson Reuters)** - ~50+ counties
3. **Manatron/Thomson Reuters** - ~50+ counties

### Per-State Expansion

Each state has dominant platforms:
- **Texas:** True Automation (done)
- **Florida:** County-specific systems
- **California:** County-specific systems
- **Ohio:** Auditor systems
- **Pennsylvania:** County-specific

---

## Testing

```bash
# Run from project root
python3 -c "
from parcel_lookup import lookup_parcel, get_supported_counties
from parcel_lookup.registry import get_registry_stats

# Stats
stats = get_registry_stats()
print(f'Total counties: {stats[\"total_counties\"]}')

# Test Harris (ArcGIS)
result = lookup_parcel('Harris', 'TX', '1170310000010')
print(f'Harris: {result.owner_name} - \${result.total_value:,.0f}')

# Test Dallas (Custom)
result = lookup_parcel('Dallas', 'TX', '00000526120000000')
print(f'Dallas: {result.owner_name} - \${result.total_value:,.0f}')
"
```

---

*Last Updated: January 24, 2026*
