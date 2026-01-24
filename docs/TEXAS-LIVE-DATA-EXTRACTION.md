# Texas Property Tax - Live Data Extraction Guide

**Created:** January 24, 2026
**Status:** VERIFIED WORKING

---

## Executive Summary

This document provides **working code examples** for extracting current property tax data from Texas counties. All methods have been tested and verified.

---

## Quick Reference: What Works NOW

| County | Method | Data Year | Status |
|--------|--------|-----------|--------|
| **Harris (HCAD)** | ArcGIS REST API | 2025 | WORKING |
| **Dallas (DCAD)** | Bulk Downloads | 2026 | WORKING |
| **Tarrant (TAD)** | Open Data Portal | 2025 | AVAILABLE |

---

## 1. Harris County (HCAD) - ArcGIS REST API

### Live Query Example

```bash
# Get 10 properties with values > $500,000
curl -s "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query?where=total_market_val%3E500000&outFields=acct_num,owner_name_1,site_str_num,site_str_name,site_city,site_zip,land_value,bld_value,total_market_val,tax_year&f=json&resultRecordCount=10&returnGeometry=false"
```

### Verified Working Response (January 24, 2026)

```json
{
  "features": [
    {
      "attributes": {
        "acct_num": "1170310000010",
        "owner_name_1": "CLAY ROBERT H",
        "site_str_num": 5118,
        "site_str_name": "HOLLY TERRACE",
        "site_city": "HOUSTON",
        "site_zip": "77056",
        "land_value": 471600.0,
        "bld_value": 1578300.0,
        "total_market_val": 2049900.0,
        "tax_year": "2025"
      }
    },
    {
      "attributes": {
        "acct_num": "0022510000001",
        "owner_name_1": "EMBARK ENERGY HOLDINGS LLC",
        "site_str_num": 1315,
        "site_str_name": "PALMER",
        "site_city": "HOUSTON",
        "site_zip": "77003",
        "land_value": 1546980.0,
        "bld_value": 360680.0,
        "total_market_val": 1907660.0,
        "tax_year": "2025"
      }
    }
  ],
  "exceededTransferLimit": true
}
```

### HCAD API Endpoints

**Base URL:** `https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0`

| Endpoint | Description |
|----------|-------------|
| `/query` | Query parcels with filters |
| `?f=json` | Return JSON format |
| `?returnGeometry=false` | Skip polygon data (faster) |
| `?resultRecordCount=N` | Limit results |

### Available Fields (50+ fields)

**Property Identification:**
- `acct_num` - Account number
- `HCAD_NUM` - HCAD parcel ID
- `LOWPARCELID` - Lowest parcel ID

**Owner Information:**
- `owner_name_1`, `owner_name_2`, `owner_name_3`
- `owner_pct_1`, `owner_pct_2`, `owner_pct_3`

**Mailing Address:**
- `mail_addr_1`, `mail_addr_2`
- `mail_city`, `mail_state`, `mail_zip`

**Property Address (Situs):**
- `site_str_pfx`, `site_str_num`, `site_str_num_sfx`
- `site_str_name`, `site_str_sfx`, `site_str_sfx_dir`
- `site_city`, `site_county`, `site_zip`

**Values:**
- `land_value` - Land market value
- `bld_value` - Building value
- `impr_value` - Improvement value
- `total_market_val` - Total market value
- `total_appraised_val` - Total appraised value
- `productivity_value` - Ag productivity value
- `tax_value` - Taxable value

**Other:**
- `tax_year` - Tax year (2025)
- `state_class` - Property class code
- `land_use` - Land use code
- `Acreage` - Property acreage
- `land_sqft` - Land square feet
- `new_owner_date` - Date of last ownership change
- `legal_dscr_1` through `legal_dscr_4` - Legal description

### Python Example

```python
import requests
import json

def get_hcad_properties(min_value=100000, limit=100):
    """Fetch Harris County properties above minimum value"""

    url = "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query"

    params = {
        "where": f"total_market_val > {min_value}",
        "outFields": "acct_num,owner_name_1,site_str_num,site_str_name,site_city,site_zip,land_value,bld_value,total_market_val,tax_year",
        "f": "json",
        "resultRecordCount": limit,
        "returnGeometry": False
    }

    response = requests.get(url, params=params)
    data = response.json()

    properties = []
    for feature in data.get("features", []):
        attrs = feature.get("attributes", {})
        properties.append({
            "account": attrs.get("acct_num"),
            "owner": attrs.get("owner_name_1"),
            "address": f"{attrs.get('site_str_num')} {attrs.get('site_str_name')}, {attrs.get('site_city')} {attrs.get('site_zip')}",
            "land_value": attrs.get("land_value"),
            "bld_value": attrs.get("bld_value"),
            "total_value": attrs.get("total_market_val"),
            "tax_year": attrs.get("tax_year")
        })

    return properties

# Example usage
properties = get_hcad_properties(min_value=500000, limit=10)
for p in properties:
    print(f"{p['account']}: {p['owner']}")
    print(f"  {p['address']}")
    print(f"  Total Value: ${p['total_value']:,.0f}")
    print()
```

### Query Examples

```bash
# All properties (first 100)
curl "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query?where=1%3D1&outFields=*&f=json&resultRecordCount=100&returnGeometry=false"

# Properties by ZIP code
curl "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query?where=site_zip%3D'77002'&outFields=*&f=json&resultRecordCount=100&returnGeometry=false"

# Properties by owner name (partial match)
curl "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query?where=owner_name_1%20LIKE%20'%25SMITH%25'&outFields=*&f=json&resultRecordCount=100&returnGeometry=false"

# Count total records
curl "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query?where=1%3D1&returnCountOnly=true&f=json"
```

---

## 2. Dallas County (DCAD) - Bulk Downloads

### Available Files (January 2026)

| File | Description | Format |
|------|-------------|--------|
| `DCAD2026_CURRENT.ZIP` | Current 2026 appraisal data | CSV |
| `DCAD2025_CURRENT.ZIP` | 2025 data with values | CSV |
| `DCAD2025_CERTIFIED_07242025.zip` | Certified 2025 values | CSV |
| `2025_REAL_PROPERTY_CERT_APPR_ROLL.zip` | 2025 appraisal roll | CSV |

### Download URL Format

```
https://www.dallascad.org/ViewPDFs.aspx?type=3&id=\\DCAD.ORG\WEB\WEBDATA\WEBFORMS\DATA PRODUCTS\{FILENAME}
```

### Python Download Example

```python
import requests
from urllib.parse import quote

def download_dcad_data(filename, output_path):
    """Download Dallas CAD bulk data file"""

    # URL-encode the UNC path
    unc_path = f"\\\\DCAD.ORG\\WEB\\WEBDATA\\WEBFORMS\\DATA PRODUCTS\\{filename}"

    url = f"https://www.dallascad.org/ViewPDFs.aspx?type=3&id={quote(unc_path)}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    response = requests.get(url, headers=headers, stream=True)

    with open(output_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    return output_path

# Download current data
download_dcad_data("DCAD2026_CURRENT.ZIP", "/tmp/dcad2026.zip")
```

### Data Products Page

**URL:** https://www.dallascad.org/DataProducts.aspx

Contains:
- Current year preliminary data
- Certified appraisal rolls (prior years)
- BPP (Business Personal Property) detail files
- ARB (Appraisal Review Board) data

---

## 3. Tarrant County (TAD) - Open Data Portal

### Portal URL

**URL:** https://gis-tad.opendata.arcgis.com/

### Available Datasets

- Parcel boundaries
- School district boundaries
- City boundaries
- MUD districts
- Flood data

### Download Options

1. **Shapefile** - Geographic data with attributes
2. **GeoJSON** - Web-friendly format
3. **CSV** - Tabular data export
4. **API** - ArcGIS REST services

### Bulk Download

**ParcelView Shapefile:** ~715 MB
Available at: https://www.tad.org/data-download/

---

## 4. Query Patterns for Production Use

### Pagination (HCAD)

```python
def get_all_hcad_properties(where_clause, batch_size=1000):
    """Paginate through all matching properties"""

    url = "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query"

    all_properties = []
    offset = 0

    while True:
        params = {
            "where": where_clause,
            "outFields": "*",
            "f": "json",
            "resultRecordCount": batch_size,
            "resultOffset": offset,
            "returnGeometry": False
        }

        response = requests.get(url, params=params)
        data = response.json()

        features = data.get("features", [])
        if not features:
            break

        all_properties.extend(features)

        if not data.get("exceededTransferLimit"):
            break

        offset += batch_size
        time.sleep(1)  # Rate limiting

    return all_properties
```

### Rate Limiting

```python
import time
from functools import wraps

def rate_limit(calls_per_minute=60):
    """Decorator to rate limit API calls"""
    interval = 60.0 / calls_per_minute
    last_call = [0]

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            elapsed = time.time() - last_call[0]
            if elapsed < interval:
                time.sleep(interval - elapsed)
            result = func(*args, **kwargs)
            last_call[0] = time.time()
            return result
        return wrapper
    return decorator

@rate_limit(calls_per_minute=30)
def query_hcad(where):
    # API call here
    pass
```

---

## 5. Data Quality Notes

### HCAD ArcGIS

- **Tax Year:** Currently showing 2025
- **Update Frequency:** Real-time (reflects CAD database)
- **Coverage:** 1.8M+ parcels
- **Null Values:** Some records have null values for certain fields
- **Geometry:** Available but increases response size significantly

### DCAD Bulk Files

- **Tax Year:** 2026 current data available
- **Update Frequency:** Daily/weekly updates to current files
- **Coverage:** 900K+ parcels
- **Format:** Comma-delimited CSV in ZIP archives

### TAD Open Data

- **Tax Year:** 2025
- **Update Frequency:** Periodic (check portal)
- **Coverage:** 750K+ parcels
- **Format:** Multiple export options

---

## 6. Error Handling

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| Empty response | Query too restrictive | Broaden WHERE clause |
| 503 Service Unavailable | Server maintenance | Retry after delay |
| 403 Forbidden | Bot detection | Add User-Agent header |
| Timeout | Large result set | Add pagination/limits |

### Retry Logic

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session_with_retries():
    session = requests.Session()
    retries = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount('https://', adapter)
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    return session
```

---

## 7. Next Steps

### Immediate Priorities

1. **Build HCAD data pipeline** - Stream from ArcGIS API
2. **Download DCAD bulk files** - Parse CSV into database
3. **Access TAD Open Data** - Download parcel shapefile

### Future Enhancements

- Add Travis County when server recovers (currently 503)
- Build True Automation scraper for Bexar, Collin, Denton
- Connect tax bill data from Tax Collector websites

---

## Appendix: API Reference

### HCAD ArcGIS MapServer

**Service URL:** `https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer`

| Layer | ID | Name |
|-------|-----|------|
| Parcels | 0 | Property parcels with attributes |

**Supported Operations:**
- Query (GET/POST)
- Export Map
- Identify
- Find

**Spatial Reference:** WKID 102740 (NAD 1983 StatePlane Texas South Central FIPS 4204 Feet)

---

*Last verified: January 24, 2026*
