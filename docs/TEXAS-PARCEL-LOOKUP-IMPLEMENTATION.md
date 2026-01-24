# Texas Tier 1 Counties - Parcel Lookup Implementation

**Created:** January 24, 2026
**Purpose:** Technical documentation for automated parcel lookups

---

## Summary of Findings

| County | Lookup Method | Status | Complexity |
|--------|--------------|--------|------------|
| **Harris** | ArcGIS REST API | WORKING | LOW |
| **Dallas** | Web scraping required | NEEDS WORK | HIGH |
| **Tarrant** | Bulk data + Web scraping | NEEDS WORK | MEDIUM |

---

## 1. HARRIS COUNTY (HCAD) - FULLY WORKING

### API Endpoint
```
https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query
```

### Parcel ID Format
- **Field Name:** `acct_num`
- **Format:** 13-digit string (e.g., `1170310000010`)
- **Pattern:** `XXXXXXXXXXX00` (varies)

### Working Query
```bash
curl "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query?where=acct_num%20LIKE%20'{ACCOUNT_NUMBER}'&outFields=*&f=json&returnGeometry=false"
```

### Example Response
```json
{
  "features": [{
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
  }]
}
```

### Available Fields (50+)
| Field | Description |
|-------|-------------|
| `acct_num` | Account number (parcel ID) |
| `owner_name_1`, `owner_name_2`, `owner_name_3` | Owner names |
| `mail_addr_1`, `mail_city`, `mail_state`, `mail_zip` | Mailing address |
| `site_str_num`, `site_str_name`, `site_city`, `site_zip` | Property address |
| `land_value`, `bld_value`, `total_market_val` | Values |
| `tax_year` | Tax year |
| `legal_dscr_1` | Legal description |
| `Acreage` | Property size |
| `state_class` | Property classification |

### Rate Limits
- No explicit rate limit documented
- Recommend: 1 request per second

---

## 2. DALLAS COUNTY (DCAD) - NEEDS SCRAPER

### Current Status
- **No public API** available
- **Bulk downloads** available but require parsing
- **Web interface** uses ASP.NET with ViewState (complex forms)

### Property Lookup URL Pattern
```
https://www.dallascad.org/AcctDetailRes.aspx?ID={PROPERTY_ID}
```

### Parcel ID Format
- **Format:** Unknown exact format - appears to be 17 digits
- **Example IDs in database:** Need to extract from bulk data

### Bulk Data Files (Alternative)
```
https://www.dallascad.org/DataProducts.aspx

Available files:
- DCAD2026_CURRENT.ZIP (current year)
- DCAD2025_CERTIFIED_*.zip (certified values)
```

### Work Required
1. Download and parse bulk CSV files
2. Build local database with parcel IDs
3. OR build ASP.NET form scraper with:
   - ViewState extraction
   - Form submission
   - HTML response parsing

### Complexity: HIGH
- Requires either bulk data ingestion or complex web scraping
- No direct parcel ID → data API

---

## 3. TARRANT COUNTY (TAD) - NEEDS SCRAPER

### Current Status
- **Bulk downloads** available (but Cloudflare protected)
- **No direct API** found
- **Open Data Portal** exists but parcel layer not directly accessible

### Bulk Data Files
```
https://www.tad.org/content/data-download/PropertyData(Delimited).ZIP
https://www.tad.org/content/data-download/PropertyData_2025(Certified).ZIP
```

**Issue:** Downloads protected by Cloudflare challenge (403)

### Data Layout Documentation
```
https://www.tad.org/content/forms/PropertyData&PropertyLocationLayouts.pdf
```
(Accessible - describes field formats)

### Property Types Available
| File | Description |
|------|-------------|
| `PropertyData_R.ZIP` | Residential |
| `PropertyData_C.ZIP` | Commercial |
| `PropertyData_P.ZIP` | Personal property |
| `PropertyData_M.ZIP` | Mineral |

### Work Required
1. Bypass Cloudflare protection (browser automation)
2. Download and parse bulk ZIP files
3. Build local database for lookups
4. OR build web scraper for TAD search interface

### Complexity: MEDIUM
- Bulk data exists but protected
- May need Selenium/Playwright for downloads

---

## Implementation Priority

### Immediate (Use Now)
1. **Harris County** - ArcGIS API fully working

### Short-term (1-2 days work)
2. **Dallas County** - Download bulk data, build parser
3. **Tarrant County** - Browser automation for bulk download

### Architecture Recommendation

```
┌─────────────────────────────────────────────────────────┐
│                    Parcel Lookup Service                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Input: County + Parcel ID                              │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Harris    │  │    Dallas    │  │   Tarrant    │  │
│  │  (ArcGIS)    │  │  (Bulk DB)   │  │  (Bulk DB)   │  │
│  │              │  │              │  │              │  │
│  │ Direct API   │  │ Local SQLite │  │ Local SQLite │  │
│  │   Query      │  │    Query     │  │    Query     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  Output: Property Details (Owner, Address, Values)      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Python Implementation

See `src/texas_parcel_lookup.py` for working code.

---

## Next Steps

1. [ ] Create bulk data downloader for DCAD
2. [ ] Create bulk data downloader for TAD (with Cloudflare bypass)
3. [ ] Build SQLite database schema for bulk data
4. [ ] Create unified lookup interface
5. [ ] Add caching layer for API calls

---

*Last Updated: January 24, 2026*
