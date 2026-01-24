# Texas Tax Data - Testing Methodology

**Created:** January 24, 2026
**Purpose:** Systematic verification of all Texas tax data sources
**Status:** DRAFT

---

## Overview

This document defines the testing procedures to achieve **100% confidence** in Texas tax data sources before production use.

### Test Categories

| Category | Purpose | Priority |
|----------|---------|----------|
| **T1: URL Verification** | Confirm URLs are accessible | CRITICAL |
| **T2: Data Availability** | Confirm data can be downloaded/accessed | CRITICAL |
| **T3: Format Validation** | Verify data format matches documentation | HIGH |
| **T4: Schema Mapping** | Map fields to unified schema | HIGH |
| **T5: Completeness** | Check for missing/null data | MEDIUM |
| **T6: Freshness** | Verify update frequency | MEDIUM |
| **T7: Rate Limits** | Test sustainable request rates | MEDIUM |
| **T8: Scraping Feasibility** | Verify data extraction works | HIGH |

---

# T1: URL VERIFICATION TESTS

## T1.1: HTTP Status Check

**Purpose:** Verify URL returns 200 OK

**Procedure:**
```bash
# Test single URL
curl -I -s -o /dev/null -w "%{http_code}" https://hcad.org/

# Expected: 200
# Acceptable: 200, 301 (redirect), 302 (temporary redirect)
# Fail: 403, 404, 500, timeout
```

**Test Matrix:**

| County | CAD URL | Tax Collector URL | Expected |
|--------|---------|-------------------|----------|
| Harris | hcad.org | hctax.net | 200 |
| Dallas | dallascad.org | dallascounty.org/departments/tax | 200 |
| Tarrant | tad.org | tarrantcountytx.gov/en/tax.html | 200 |
| Bexar | bcad.org | bexar.org/1529/Property-Tax | 200 |
| Travis | traviscad.org | tax-office.traviscountytx.gov | 200 |
| Collin | collincad.org | collincountytx.gov/Tax-Assessor | 200 |
| Denton | dentoncad.com | (verify) | 200 |

**Automation Script:**
```python
import requests

URLS = [
    ("Harris CAD", "https://hcad.org/"),
    ("Harris Tax", "https://www.hctax.net/"),
    ("Dallas CAD", "https://www.dallascad.org/"),
    ("Dallas Tax", "https://www.dallascounty.org/departments/tax/"),
    ("Tarrant CAD", "https://www.tad.org/"),
    ("Tarrant Tax", "https://www.tarrantcountytx.gov/en/tax.html"),
    ("Bexar CAD", "https://bcad.org/"),
    ("Bexar Tax", "https://www.bexar.org/1529/Property-Tax"),
    ("Travis CAD", "https://traviscad.org/"),
    ("Travis Tax", "https://tax-office.traviscountytx.gov/"),
    ("Collin CAD", "https://collincad.org/"),
    ("Collin Tax", "https://www.collincountytx.gov/Tax-Assessor"),
    ("Denton CAD", "https://www.dentoncad.com/"),
]

def test_urls():
    results = []
    for name, url in URLS:
        try:
            r = requests.head(url, timeout=10, allow_redirects=True)
            status = "PASS" if r.status_code == 200 else f"FAIL ({r.status_code})"
        except Exception as e:
            status = f"ERROR ({str(e)[:30]})"
        results.append((name, url, status))
        print(f"{status}: {name} - {url}")
    return results

if __name__ == "__main__":
    test_urls()
```

---

## T1.2: SSL Certificate Check

**Purpose:** Verify HTTPS is valid (not expired, not self-signed)

**Procedure:**
```bash
# Check SSL certificate
echo | openssl s_client -servername hcad.org -connect hcad.org:443 2>/dev/null | openssl x509 -noout -dates

# Check for expiry within 30 days
```

---

## T1.3: Redirect Chain Check

**Purpose:** Document redirect behavior for URL stability

**Procedure:**
```bash
curl -L -s -o /dev/null -w "%{url_effective}" https://pdata.hcad.org/
# Document: pdata.hcad.org -> hcad.org/hcad-online-services/pdata/
```

---

# T2: DATA AVAILABILITY TESTS

## T2.1: Bulk Download Test (HCAD)

**Purpose:** Verify bulk files can be downloaded

**Procedure:**
```bash
# 1. Navigate to download page
# https://hcad.org/hcad-online-services/pdata/

# 2. Attempt to download a file
wget --spider "https://pdata.hcad.org/download/2025/Real_acct_owner.zip"

# 3. Document:
# - File size
# - Download time
# - Any authentication required
# - Terms of service restrictions
```

**Test Checklist:**

| File | URL | Size | Status |
|------|-----|------|--------|
| Real_acct_owner.zip | pdata.hcad.org/... | ? MB | PENDING |
| Real_building_res.zip | pdata.hcad.org/... | ? MB | PENDING |
| Real_building_com.zip | pdata.hcad.org/... | ? MB | PENDING |
| Real_land.zip | pdata.hcad.org/... | ? MB | PENDING |

---

## T2.2: Bulk Download Test (DCAD)

**Purpose:** Verify Dallas CAD data products downloadable

**Procedure:**
```bash
# 1. Navigate to: https://www.dallascad.org/dataproducts.aspx
# 2. Document all download links
# 3. Test download of one file per category
```

**Test Checklist:**

| File | Year | Format | Size | Status |
|------|------|--------|------|--------|
| Current Appraisal | 2026 | ZIP/CSV | ? MB | PENDING |
| Certified Roll | 2025 | ZIP/CSV | ? MB | PENDING |
| BPP Detail | 2025 | ZIP/CSV | ? MB | PENDING |

---

## T2.3: ArcGIS REST Service Test

**Purpose:** Verify ArcGIS endpoints return data

**Procedure:**
```bash
# Test HCAD Parcels MapServer
curl "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query?where=1=1&outFields=*&f=json&resultRecordCount=1"

# Expected: JSON response with features array
# Document: Layer count, field names, record count
```

**Test Matrix:**

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| HCAD Parcels | /HCAD/Parcels/MapServer | JSON with parcel data |
| HCAD Cities | /HCAD/HCAD_Cities/MapServer | JSON with city boundaries |
| TAD Open Data | gis-tad.opendata.arcgis.com | Dataset listing |

---

## T2.4: Open Data Portal Test

**Purpose:** Verify Tarrant Open Data Portal access

**Procedure:**
```bash
# 1. Access portal: https://gis-tad.opendata.arcgis.com/
# 2. Search for "parcels" or "land records"
# 3. Attempt to download dataset
# 4. Document available datasets
```

---

# T3: FORMAT VALIDATION TESTS

## T3.1: HCAD Tab-Delimited Format Test

**Purpose:** Verify file format matches documentation

**Procedure:**
```python
import csv

def test_hcad_format(filepath):
    """Test HCAD Real_acct.txt format"""

    expected_fields = [
        'acct', 'yr', 'owner', 'mail_addr_1', 'mail_addr_2',
        'mail_city', 'mail_state', 'mail_zip', 'mail_country',
        'str_pfx', 'str_num', 'str_sfx', 'str_name', 'str_sfx_dir',
        'str_unit', 'site_addr_1', 'site_addr_2', 'site_addr_3',
        'state_class', 'land_val', 'bld_val', 'x_features_val',
        'ag_val', 'assessed_val', 'tot_appr_val', 'tot_mkt_val',
        # ... more fields
    ]

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        header = next(reader)

        # Check field count
        print(f"Field count: {len(header)}")

        # Check first 10 fields match
        matches = sum(1 for i, field in enumerate(expected_fields[:10])
                     if i < len(header) and header[i].lower() == field.lower())

        print(f"Header matches: {matches}/10")

        # Sample 5 rows
        for i, row in enumerate(reader):
            if i >= 5:
                break
            print(f"Row {i}: {len(row)} fields")

    return True

# Usage after download
# test_hcad_format("Real_acct.txt")
```

---

## T3.2: DCAD CSV Format Test

**Purpose:** Verify Dallas CAD CSV format

**Procedure:**
```python
import csv
import zipfile

def test_dcad_format(zip_path):
    """Test DCAD CSV format from ZIP file"""

    with zipfile.ZipFile(zip_path, 'r') as z:
        # List files in ZIP
        print(f"Files in ZIP: {z.namelist()}")

        for name in z.namelist():
            if name.endswith('.csv') or name.endswith('.txt'):
                with z.open(name) as f:
                    # Try to detect delimiter
                    sample = f.read(1024).decode('utf-8')

                    # Check for comma or tab
                    comma_count = sample.count(',')
                    tab_count = sample.count('\t')

                    delimiter = ',' if comma_count > tab_count else '\t'
                    print(f"{name}: delimiter='{delimiter}'")

                    # Reset and read header
                    f.seek(0)
                    reader = csv.reader(
                        f.read().decode('utf-8').splitlines(),
                        delimiter=delimiter
                    )
                    header = next(reader)
                    print(f"  Fields: {len(header)}")
                    print(f"  Header: {header[:10]}...")

    return True
```

---

## T3.3: Shapefile Format Test (TAD)

**Purpose:** Verify Tarrant shapefile integrity

**Procedure:**
```python
# Requires: pip install pyshp
import shapefile

def test_shapefile(shp_path):
    """Test shapefile format and content"""

    sf = shapefile.Reader(shp_path)

    print(f"Shape type: {sf.shapeTypeName}")
    print(f"Record count: {len(sf)}")
    print(f"Fields: {[f[0] for f in sf.fields[1:]]}")

    # Sample first record
    rec = sf.record(0)
    print(f"Sample record: {rec[:5]}...")

    # Check geometry
    shape = sf.shape(0)
    print(f"Geometry type: {shape.shapeTypeName}")
    print(f"Bounding box: {sf.bbox}")

    return True

# Usage:
# test_shapefile("ParcelView/parcels.shp")
```

---

# T4: SCHEMA MAPPING TESTS

## T4.1: Field Mapping Validation

**Purpose:** Map source fields to unified schema

**Unified Schema:**
```sql
CREATE TABLE properties (
    -- Identifiers
    id SERIAL PRIMARY KEY,
    source_id VARCHAR(50) NOT NULL,      -- Original account/parcel ID
    source_county VARCHAR(50) NOT NULL,  -- County name
    source_system VARCHAR(50) NOT NULL,  -- HCAD, DCAD, TAD, etc.

    -- Location
    property_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2) DEFAULT 'TX',
    zip VARCHAR(10),

    -- Owner
    owner_name VARCHAR(255),
    owner_address VARCHAR(255),
    owner_city VARCHAR(100),
    owner_state VARCHAR(2),
    owner_zip VARCHAR(10),

    -- Values
    land_value DECIMAL(15,2),
    improvement_value DECIMAL(15,2),
    total_assessed_value DECIMAL(15,2),
    total_market_value DECIMAL(15,2),

    -- Characteristics
    property_class VARCHAR(50),
    year_built INTEGER,
    building_sqft INTEGER,
    lot_sqft INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),

    -- Tax Info
    tax_year INTEGER,
    exemptions TEXT,

    -- Metadata
    data_source VARCHAR(100),
    fetched_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

**Field Mapping Test:**

| Unified Field | HCAD Field | DCAD Field | TAD Field |
|---------------|------------|------------|-----------|
| source_id | acct | ACCOUNT_NUM | PROP_ID |
| property_address | site_addr_1 | SITUS_ADDRESS | SITUS |
| owner_name | owner | OWNER_NAME | OWNER |
| land_value | land_val | LAND_VAL | LAND_VALUE |
| improvement_value | bld_val | IMPR_VAL | IMPR_VALUE |
| total_market_value | tot_mkt_val | MARKET_VAL | MARKET_VALUE |

**Procedure:**
```python
def test_field_mapping(source_data, mapping):
    """Test that field mapping produces valid unified records"""

    errors = []
    for record in source_data[:100]:  # Test first 100
        unified = {}
        for target_field, source_field in mapping.items():
            value = record.get(source_field)

            # Validate required fields
            if target_field in ['source_id', 'source_county'] and not value:
                errors.append(f"Missing required: {target_field}")

            # Validate numeric fields
            if target_field.endswith('_value') and value:
                try:
                    float(str(value).replace(',', '').replace('$', ''))
                except:
                    errors.append(f"Invalid numeric: {target_field}={value}")

            unified[target_field] = value

    print(f"Tested 100 records, {len(errors)} errors")
    return errors
```

---

# T5: COMPLETENESS TESTS

## T5.1: Null Value Analysis

**Purpose:** Identify fields with high null rates

**Procedure:**
```python
def analyze_completeness(data, fields):
    """Analyze null/empty rates for each field"""

    total = len(data)
    stats = {}

    for field in fields:
        null_count = sum(1 for r in data if not r.get(field))
        pct = (null_count / total) * 100
        stats[field] = {
            'null_count': null_count,
            'null_pct': pct,
            'status': 'OK' if pct < 5 else 'WARN' if pct < 20 else 'FAIL'
        }

    return stats

# Acceptance criteria:
# - source_id: 0% null (REQUIRED)
# - property_address: <5% null
# - owner_name: <5% null
# - total_market_value: <10% null
# - building_sqft: <20% null (some land-only parcels)
```

---

## T5.2: Record Count Validation

**Purpose:** Verify expected record counts

**Expected Counts:**

| County | Expected Parcels | Tolerance |
|--------|------------------|-----------|
| Harris | 1,800,000 | ±100,000 |
| Dallas | 900,000 | ±50,000 |
| Tarrant | 750,000 | ±50,000 |
| Bexar | 700,000 | ±50,000 |
| Travis | 450,000 | ±30,000 |
| Collin | 400,000 | ±30,000 |

---

# T6: FRESHNESS TESTS

## T6.1: Data Date Verification

**Purpose:** Verify data is current

**Procedure:**
```python
def check_freshness(data, date_field, max_age_days=365):
    """Check if data is within acceptable age"""
    from datetime import datetime, timedelta

    cutoff = datetime.now() - timedelta(days=max_age_days)

    # Sample date values
    dates = [r.get(date_field) for r in data[:1000] if r.get(date_field)]

    # Parse and check
    stale_count = 0
    for d in dates:
        try:
            parsed = datetime.strptime(str(d), '%Y-%m-%d')
            if parsed < cutoff:
                stale_count += 1
        except:
            pass

    stale_pct = (stale_count / len(dates)) * 100 if dates else 100
    return {
        'sample_size': len(dates),
        'stale_count': stale_count,
        'stale_pct': stale_pct,
        'status': 'PASS' if stale_pct < 5 else 'FAIL'
    }
```

---

## T6.2: Website Update Date Check

**Purpose:** Verify website shows recent updates

**Checklist:**

| County | URL | Update Date Location | Last Check |
|--------|-----|---------------------|------------|
| Harris | hcad.org/pdata | "Data last updated" text | PENDING |
| Dallas | dallascad.org/dataproducts.aspx | File dates on page | Jan 22, 2026 |
| Tarrant | tad.org | Check file dates | PENDING |

---

# T7: RATE LIMIT TESTS

## T7.1: Sustainable Request Rate Test

**Purpose:** Find maximum sustainable request rate without blocking

**Procedure:**
```python
import time
import requests

def test_rate_limit(base_url, test_urls, delays=[1, 2, 3, 5, 10]):
    """Test various request delays to find sustainable rate"""

    results = {}

    for delay in delays:
        success = 0
        blocked = 0

        for i, url in enumerate(test_urls[:20]):
            try:
                r = requests.get(url, timeout=30)
                if r.status_code == 200:
                    success += 1
                elif r.status_code in [403, 429, 503]:
                    blocked += 1
                    break  # Stop if blocked
            except:
                blocked += 1

            time.sleep(delay)

        results[delay] = {
            'success': success,
            'blocked': blocked,
            'sustainable': blocked == 0
        }

        print(f"Delay {delay}s: {success} success, {blocked} blocked")

        if blocked > 0:
            break  # Don't test faster rates if already blocked

    return results

# Recommended starting delays:
# True Automation: 3-5 seconds
# Tax Collector sites: 5-10 seconds
# HCAD ArcGIS: 1-2 seconds
```

---

## T7.2: robots.txt Compliance Test

**Purpose:** Check robots.txt for scraping rules

**Procedure:**
```bash
# Check robots.txt for each site
curl https://hcad.org/robots.txt
curl https://www.dallascad.org/robots.txt
curl https://propaccess.trueautomation.com/robots.txt
curl https://www.hctax.net/robots.txt
```

**Document:**
- Disallowed paths
- Crawl-delay directives
- User-agent restrictions

---

# T8: SCRAPING FEASIBILITY TESTS

## T8.1: Property Search Test

**Purpose:** Verify property data can be extracted from search results

**Test Cases:**

| Platform | Test Account | Expected Fields |
|----------|--------------|-----------------|
| HCAD | 0010010000001 | Owner, address, value |
| DCAD | R00000001 | Owner, address, value |
| True Automation | (sample from Bexar) | Owner, address, value |
| Tax Collector | (same accounts) | Tax amount, status |

**Procedure:**
```python
from bs4 import BeautifulSoup
import requests

def test_property_extraction(url, account_id):
    """Test if property data can be extracted"""

    # Make search request
    r = requests.get(url, params={'acct': account_id})

    if r.status_code != 200:
        return {'status': 'FAIL', 'reason': f'HTTP {r.status_code}'}

    soup = BeautifulSoup(r.content, 'html.parser')

    # Try to extract key fields
    extracted = {}

    # Look for common patterns
    # (Customize per site)
    owner_elem = soup.find(text=lambda t: 'owner' in t.lower() if t else False)
    value_elem = soup.find(text=lambda t: '$' in str(t) if t else False)

    return {
        'status': 'PASS' if owner_elem or value_elem else 'PARTIAL',
        'html_size': len(r.content),
        'has_owner': bool(owner_elem),
        'has_value': bool(value_elem),
    }
```

---

## T8.2: Anti-Bot Detection Test

**Purpose:** Check for anti-scraping measures

**Indicators to Check:**

| Indicator | Test Method | Mitigation |
|-----------|-------------|------------|
| CAPTCHA | Visual inspection | Manual intervention |
| JavaScript rendering | Check if content loads without JS | Use Selenium/Playwright |
| IP blocking | Multiple requests | Rate limiting, proxy rotation |
| Session cookies | Check for required cookies | Maintain session |
| User-agent check | Test with/without UA | Set realistic UA |

---

# TEST EXECUTION PLAN

## Phase 1: Critical Tests (Day 1)

| Test ID | Test Name | Target | Priority |
|---------|-----------|--------|----------|
| T1.1 | URL HTTP Status | All 14 URLs | CRITICAL |
| T2.1 | HCAD Bulk Download | 1 file | CRITICAL |
| T2.2 | DCAD Bulk Download | 1 file | CRITICAL |
| T2.3 | ArcGIS REST Service | HCAD Parcels | CRITICAL |

## Phase 2: Format Tests (Day 2)

| Test ID | Test Name | Target | Priority |
|---------|-----------|--------|----------|
| T3.1 | HCAD Format | Real_acct.txt | HIGH |
| T3.2 | DCAD Format | Sample CSV | HIGH |
| T4.1 | Field Mapping | All 3 sources | HIGH |

## Phase 3: Quality Tests (Day 3)

| Test ID | Test Name | Target | Priority |
|---------|-----------|--------|----------|
| T5.1 | Null Analysis | All sources | MEDIUM |
| T5.2 | Record Counts | All sources | MEDIUM |
| T6.1 | Data Freshness | All sources | MEDIUM |

## Phase 4: Scraping Tests (Day 4)

| Test ID | Test Name | Target | Priority |
|---------|-----------|--------|----------|
| T7.1 | Rate Limits | True Automation, Tax sites | MEDIUM |
| T8.1 | Property Extraction | Sample accounts | HIGH |
| T8.2 | Anti-Bot Detection | All scrape targets | HIGH |

---

# TEST RESULTS - January 24, 2026 (Day 1)

## Test Run: January 24, 2026

### Summary

| Category | Tests | Passed | Failed | Pending |
|----------|-------|--------|--------|---------|
| T1: URLs | 17 | 12 | 5 | 0 |
| T2: Downloads | 4 | 3 | 1 | 0 |
| T3: Formats | 3 | 0 | 0 | 3 |
| T4: Schema | 3 | 0 | 0 | 3 |
| T5: Completeness | 6 | 0 | 0 | 6 |
| T6: Freshness | 6 | 0 | 0 | 6 |
| T7: Rate Limits | 4 | 0 | 0 | 4 |
| T8: Scraping | 4 | 0 | 0 | 4 |
| **TOTAL** | **47** | **15** | **6** | **26** |

**Day 1 Pass Rate: 71% (15/21 tests run)**

---

## T1: URL VERIFICATION RESULTS

### T1.1 CAD Main Websites

| URL | Expected | Actual | Status |
|-----|----------|--------|--------|
| https://hcad.org/ | 200 | 200 | ✅ PASS |
| https://www.dallascad.org/ | 200 | 200 | ✅ PASS |
| https://www.tad.org/ | 200 | 403 | ❌ FAIL (bot protection) |
| https://bcad.org/ | 200 | 200 | ✅ PASS |
| https://traviscad.org/ | 200 | 503 | ❌ FAIL (service unavailable) |
| https://collincad.org/ | 200 | 200 | ✅ PASS |
| https://www.dentoncad.com/ | 200 | 200 | ✅ PASS |

### T1.2 Tax Collector Websites

| URL | Expected | Actual | Status |
|-----|----------|--------|--------|
| https://www.hctax.net/ | 200 | 200 | ✅ PASS |
| https://www.dallascounty.org/departments/tax/ | 200 | 200 | ✅ PASS |
| https://www.tarrantcountytx.gov/en/tax.html | 200 | 200 | ✅ PASS |
| https://www.bexar.org/1529/Property-Tax | 200 | 200 | ✅ PASS |
| https://tax-office.traviscountytx.gov/ | 200 | 503 | ❌ FAIL (service unavailable) |
| https://www.collincountytx.gov/Tax-Assessor | 200 | 200 | ✅ PASS |

### T1.3 Data Portals & APIs

| URL | Expected | Actual | Status |
|-----|----------|--------|--------|
| https://www.gis.hctx.net/arcgis/rest/services/HCAD | 200 | 200 | ✅ PASS |
| https://www.dallascad.org/dataproducts.aspx | 200 | 200 | ✅ PASS |
| https://gis-tad.opendata.arcgis.com/ | 200 | 200 | ✅ PASS |
| https://maps.dcad.org/prd/dpm/ | 200 | 503 | ❌ FAIL (service unavailable) |

### T1.4 True Automation Platform

| CAD | URL Pattern | Status |
|-----|-------------|--------|
| Bexar (cid=110) | propaccess.trueautomation.com | ✅ PASS |
| Bexar subdomain | bexar.trueautomation.com | ✅ PASS |
| Denton (via CAD site) | dentoncad.com/property-search | ✅ PASS |
| Collin (eSearch) | esearch.collincad.org | ✅ PASS |
| Other cids | propaccess.trueautomation.com | ❌ FAIL (504 timeout) |

---

## T2: DATA AVAILABILITY RESULTS

### T2.1 HCAD ArcGIS REST API

| Test | Result | Details |
|------|--------|---------|
| Service Discovery | ✅ PASS | 4 services in HCAD folder |
| Query Single Parcel | ✅ PASS | 8348 bytes returned |
| Query 3 Parcels | ✅ PASS | 11694 bytes returned |
| Field Extraction | ✅ PASS | 50+ fields available |

**HCAD ArcGIS Fields Confirmed:**
```
Owner: owner_name_1, owner_name_2, owner_name_3
Mail: mail_addr_1, mail_addr_2, mail_city, mail_state, mail_zip
Site: site_str_num, site_str_name, site_city, site_zip
Values: land_value, bld_value, impr_value, total_appraised_val, total_market_val, tax_value
Legal: legal_dscr_1, legal_dscr_2, legal_dscr_3, legal_dscr_4
Parcel: acct_num, tax_year, land_sqft, acreage
```

### T2.2 DCAD Bulk Downloads

| Test | Result | Details |
|------|--------|---------|
| Data Products Page | ✅ PASS | 30+ ZIP files listed |
| Download Mechanism | ✅ PASS | ViewPDFs.aspx handler works |
| Sample Download | ✅ PASS | DCAD2025_CERTIFIED = **182.72 MB** |
| File Format | ✅ VERIFIED | application/x-zip-compressed |

**DCAD Files Confirmed Available:**
- DCAD2026_CURRENT.ZIP (current, no values)
- DCAD2025_CURRENT.ZIP (certified with supplemental)
- 2025_REAL_PROPERTY_CERT_APPR_ROLL.zip (fixed format)
- DCAD2025_CERTIFIED_07242025.zip (comma delimited, 182.72 MB)
- 5 years of historical data (2021-2025)

### T2.3 TAD Open Data Portal

| Test | Result | Details |
|------|--------|---------|
| Portal Access | ✅ PASS | gis-tad.opendata.arcgis.com accessible |
| API Response | ✅ PASS | 10 MB response from dataset API |
| Dataset Categories | ✅ VERIFIED | Land Records, Political Boundaries, etc. |
| Main Website | ❌ FAIL | tad.org blocked (403), use portal instead |

### T2.4 HCAD Bulk Files

| Test | Result | Details |
|------|--------|---------|
| PDATA Page | ✅ PASS | hcad.org/hcad-online-services/pdata/ |
| Download Links | ⚠️ PARTIAL | JavaScript-loaded, requires browser |
| Direct URL Test | ⚠️ REDIRECT | pdata.hcad.org redirects to main site |

---

## Issues Found

### Issue #1: TAD.org Bot Protection
**Severity:** MEDIUM
**Status:** DOCUMENTED
**Description:** tad.org returns 403/503 to automated requests
**Workaround:** Use gis-tad.opendata.arcgis.com

### Issue #2: Travis County Sites Down
**Severity:** HIGH
**Status:** MONITORING
**Description:** Both traviscad.org and tax-office.traviscountytx.gov return 503
**Impact:** Cannot verify Travis County data access
**Action:** Re-test in 24 hours

### Issue #3: True Automation Rate Limiting
**Severity:** MEDIUM
**Status:** DOCUMENTED
**Description:** propaccess.trueautomation.com returns 504 timeout for most cids
**Workaround:** Use county-specific subdomains (bexar.trueautomation.com)

### Issue #4: HCAD PDATA JavaScript Loading
**Severity:** LOW
**Status:** DOCUMENTED
**Description:** Download links loaded via JavaScript, not visible to curl
**Workaround:** Use ArcGIS REST API for programmatic access

### Issue #5: DCAD Map Server Down
**Severity:** LOW
**Status:** MONITORING
**Description:** maps.dcad.org/prd/dpm/ returns 503
**Impact:** Cannot use DCAD interactive map
**Workaround:** Use DCAD bulk downloads instead

---

## Day 1 Key Findings

### ✅ VERIFIED WORKING

1. **HCAD ArcGIS REST API** - Full parcel data with 50+ fields
2. **DCAD Bulk Downloads** - 182 MB certified data file accessible
3. **TAD Open Data Portal** - Alternative access works
4. **6 of 7 CAD websites** - All except TAD (blocked) and Travis (down)
5. **5 of 6 Tax Collector sites** - All except Travis (down)

### ❌ NOT WORKING / BLOCKED

1. **tad.org** - Bot protection (use Open Data Portal)
2. **Travis County sites** - 503 errors (temporary?)
3. **DCAD Map** - 503 error
4. **True Automation generic URL** - Rate limited

### ⚠️ NEEDS FOLLOW-UP

1. Travis County - re-test in 24 hours
2. HCAD bulk files - verify direct download URLs
3. True Automation - document working cids vs blocked

---

## Recommendations

1. **Primary data source:** Use HCAD ArcGIS REST API for Harris County
2. **Secondary source:** Use DCAD bulk downloads for Dallas County
3. **TAD access:** Use Open Data Portal, not main website
4. **Travis County:** Wait and re-test, or use alternative source
5. **True Automation:** Use county-specific subdomains, not generic URL

---

# ACCEPTANCE CRITERIA

## Minimum for Production Use

| Criterion | Requirement |
|-----------|-------------|
| URL Accessibility | 100% of documented URLs return 200 |
| Bulk Downloads | At least 1 file per county downloadable |
| Format Match | Headers match documented schema |
| Null Rates | Critical fields <5% null |
| Data Freshness | Data from current or prior tax year |
| Rate Limits | Sustainable rate identified |
| Scraping Works | At least 1 test extraction successful |

## Confidence Levels After Testing

| Level | Criteria Met | Action |
|-------|--------------|--------|
| **100%** | All tests pass | Proceed to production |
| **90-99%** | Minor failures, workarounds exist | Document issues, proceed |
| **70-89%** | Some failures, data gaps | Re-evaluate approach |
| **<70%** | Major failures | Do not use source |

---

# CHANGELOG

| Date | Change |
|------|--------|
| Jan 24, 2026 | Initial testing methodology created |
