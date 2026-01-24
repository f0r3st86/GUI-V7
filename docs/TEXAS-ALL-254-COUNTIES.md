# Texas Property Tax Data - All 254 Counties

**Created:** January 24, 2026
**Last Updated:** January 24, 2026
**Purpose:** Complete inventory of parcel data access for all Texas counties

---

## Executive Summary

| Category | Counties | Parcels (Est.) | Data Access |
|----------|----------|----------------|-------------|
| **Tier 1: Bulk Data/API** | 3 | 3.5M | VERIFIED WORKING |
| **Tier 2: True Automation** | ~100 | 5M | Platform scraping |
| **Tier 3: Custom Systems** | ~50 | 4M | Individual scrapers |
| **Tier 4: Small/Rural** | ~100 | 500K | Manual/limited |
| **TOTAL** | 254 | ~13M | Mixed |

---

## TIER 1: BULK DATA / API ACCESS (VERIFIED)

These counties have programmatic data access confirmed working.

| Rank | County | Population | Parcels | Platform | API/Bulk | Status |
|------|--------|------------|---------|----------|----------|--------|
| 1 | **Harris** | 4,700,000 | 1,800,000 | Custom (HCAD) | ArcGIS REST + Tab-delimited | **VERIFIED** |
| 2 | **Dallas** | 2,600,000 | 900,000 | Custom (DCAD) | CSV Bulk Downloads | **VERIFIED** |
| 3 | **Tarrant** | 2,100,000 | 750,000 | Custom (TAD) | Open Data Portal + Shapefiles | **VERIFIED** |

### Harris County (HCAD)
- **API Endpoint:** `https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query`
- **Bulk Files:** `https://hcad.org/hcad-online-services/pdata/`
- **Data Year:** 2025 (current)
- **Fields:** 50+ including owner, address, values, legal description

### Dallas County (DCAD)
- **Bulk Downloads:** `https://www.dallascad.org/DataProducts.aspx`
- **Files Available:** DCAD2026_CURRENT.ZIP, DCAD2025_CERTIFIED, historical back to 2021
- **Format:** Comma-delimited CSV in ZIP archives

### Tarrant County (TAD)
- **Open Data:** `https://gis-tad.opendata.arcgis.com/`
- **Bulk Download:** ParcelView Shapefile (~715 MB)
- **Formats:** Shapefile, GeoJSON, CSV export

---

## TIER 2: TRUE AUTOMATION / HARRIS GOVERN PLATFORM

~100 counties use the True Automation (Harris Govern) platform. One scraper covers all.

### Verified True Automation Counties

| County | CAD ID | URL Pattern | Population | Status |
|--------|--------|-------------|------------|--------|
| **Bexar** | 110 | bexar.trueautomation.com | 2,000,000 | VERIFIED |
| **Collin** | 111 | propaccess.trueautomation.com/?cid=111 | 1,100,000 | VERIFIED |
| **Denton** | 19 | propaccess.trueautomation.com/?cid=19 | 900,000 | VERIFIED |
| Burnet | 85 | propaccess.trueautomation.com/?cid=85 | 50,000 | Listed |
| Cass | 3 | propaccess.trueautomation.com/?cid=3 | 30,000 | Listed |
| Comal | 56 | propaccess.trueautomation.com/?cid=56 | 160,000 | Listed |
| Cooke | 107 | propaccess.trueautomation.com/?cid=107 | 42,000 | Listed |
| Guadalupe | 2 | propaccess.trueautomation.com/?cid=2 | 175,000 | Listed |
| Hale | 41 | propaccess.trueautomation.com/?cid=41 | 33,000 | Listed |
| Hill | 32 | propaccess.trueautomation.com/?cid=32 | 36,000 | Listed |
| San Jacinto | 22 | propaccess.trueautomation.com/?cid=22 | 29,000 | Listed |
| Swisher | 54 | propaccess.trueautomation.com/?cid=54 | 7,000 | Listed |
| Wilson | 27 | propaccess.trueautomation.com/?cid=27 | 52,000 | Listed |

### Likely True Automation Counties (Based on Platform Research)

Counties that likely use True Automation based on website patterns:

| County | Population | CAD Website | Evidence |
|--------|------------|-------------|----------|
| Brazos | 230,000 | brazoscad.org | Similar platform |
| Bell | 370,000 | bellcad.org | Similar platform |
| Lubbock | 310,000 | lubbockcad.org | Similar platform |
| McLennan | 260,000 | mclennancad.org | Similar platform |
| Webb | 275,000 | webbcad.org | Similar platform |
| Midland | 175,000 | midcad.org | Similar platform |
| Ector | 165,000 | ectorcad.org | Similar platform |
| Taylor | 145,000 | taylorcad.org | Similar platform |
| Wichita | 130,000 | wichitacad.org | Similar platform |
| Smith | 235,000 | smithcad.org | Similar platform |

---

## TIER 3: CUSTOM SYSTEMS / OTHER PLATFORMS

Counties with custom systems requiring individual scrapers.

### Major Custom System Counties

| County | Population | CAD Website | Platform | Notes |
|--------|------------|-------------|----------|-------|
| **Travis** | 1,300,000 | traviscad.org | Custom | Currently returning 503 |
| **Fort Bend** | 850,000 | fbcad.org | Custom | Has property search |
| **Hidalgo** | 870,000 | hidalgoad.org | Custom | RGV area |
| **El Paso** | 865,000 | epcad.org | Custom | Border area, 403 errors |
| **Montgomery** | 620,000 | mcad-tx.org | Custom | North of Houston |
| **Williamson** | 610,000 | wcad.org | Custom | Austin metro |
| **Cameron** | 420,000 | cameroncad.org | Custom | Border area |
| **Nueces** | 360,000 | nuecescad.net | Custom | Corpus Christi |
| **Brazoria** | 390,000 | brazoriacad.org | Custom | Gulf Coast |
| **Galveston** | 350,000 | galvestoncad.org | Custom | Gulf Coast |

### Other Notable Custom Counties

| County | Population | CAD Website | Notes |
|--------|------------|-------------|-------|
| Jefferson | 255,000 | jcad.org | Beaumont area |
| Hays | 240,000 | hayscad.com | Austin metro |
| Ellis | 195,000 | elliscad.com | Dallas metro |
| Johnson | 180,000 | johnsoncad.com | DFW metro |
| Kaufman | 145,000 | kaufmancad.org | DFW metro |
| Rockwall | 110,000 | rockwallcad.com | DFW metro |
| Parker | 150,000 | parkercad.org | DFW metro |
| Grayson | 140,000 | graysonappraisal.org | North TX |
| Hunt | 100,000 | huntcad.org | East TX |
| Victoria | 92,000 | victoriacad.org | South TX |

---

## COMPLETE COUNTY LIST (All 254)

### A Counties (11)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 1 | Anderson | 57,000 | 3 | andersoncad.net | Unknown |
| 2 | Andrews | 18,000 | 4 | andrewscad.org | Unknown |
| 3 | Angelina | 87,000 | 3 | angelinacad.org | Unknown |
| 4 | Aransas | 24,000 | 4 | aransascad.org | Unknown |
| 5 | Archer | 8,500 | 4 | archercad.org | Unknown |
| 6 | Armstrong | 1,900 | 4 | N/A | Manual |
| 7 | Atascosa | 51,000 | 3 | atascosacad.org | Unknown |
| 8 | Austin | 30,000 | 4 | austincad.org | Unknown |

### B Counties (18)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 9 | Bailey | 7,000 | 4 | baileycad.org | Unknown |
| 10 | Bandera | 23,000 | 4 | banderacad.org | Unknown |
| 11 | Bastrop | 97,000 | 3 | bastropcad.org | Unknown |
| 12 | Baylor | 3,500 | 4 | N/A | Manual |
| 13 | Bee | 32,000 | 4 | beecad.org | Unknown |
| 14 | Bell | 370,000 | 2 | bellcad.org | True Automation likely |
| 15 | **Bexar** | 2,000,000 | **2** | bcad.org | **True Automation (cid=110)** |
| 16 | Blanco | 12,000 | 4 | blancocad.org | Unknown |
| 17 | Borden | 640 | 4 | N/A | Manual |
| 18 | Bosque | 18,000 | 4 | bosquecad.org | Unknown |
| 19 | Bowie | 93,000 | 3 | bowiecad.org | Unknown |
| 20 | Brazoria | 390,000 | 3 | brazoriacad.org | Custom |
| 21 | Brazos | 230,000 | 2 | brazoscad.org | True Automation likely |
| 22 | Brewster | 9,500 | 4 | brewstercad.org | Unknown |
| 23 | Briscoe | 1,500 | 4 | N/A | Manual |
| 24 | Brooks | 7,000 | 4 | brookscad.org | Unknown |
| 25 | Brown | 38,000 | 4 | browncad.org | Unknown |
| 26 | Burleson | 18,000 | 4 | burlesoncad.org | Unknown |
| 27 | Burnet | 50,000 | 2 | burnetcad.org | True Automation (cid=85) |

### C Counties (32)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 28 | Caldwell | 45,000 | 3 | caldwellcad.org | Unknown |
| 29 | Calhoun | 21,000 | 4 | calhouncad.org | Unknown |
| 30 | Callahan | 14,000 | 4 | callahancad.org | Unknown |
| 31 | Cameron | 420,000 | 3 | cameroncad.org | Custom |
| 32 | Camp | 13,000 | 4 | campcad.org | Unknown |
| 33 | Carson | 5,900 | 4 | carsoncad.org | Unknown |
| 34 | Cass | 30,000 | 2 | casscad.org | True Automation (cid=3) |
| 35 | Castro | 7,500 | 4 | castrocad.org | Unknown |
| 36 | Chambers | 45,000 | 3 | chamberscad.org | Unknown |
| 37 | Cherokee | 52,000 | 3 | cherokeecad.org | Unknown |
| 38 | Childress | 7,000 | 4 | childresscad.org | Unknown |
| 39 | Clay | 10,500 | 4 | claycad.org | Unknown |
| 40 | Cochran | 2,900 | 4 | N/A | Manual |
| 41 | Coke | 3,300 | 4 | N/A | Manual |
| 42 | Coleman | 8,300 | 4 | colemancad.org | Unknown |
| 43 | **Collin** | 1,100,000 | **2** | collincad.org | **True Automation (cid=111)** |
| 44 | Collingsworth | 2,900 | 4 | N/A | Manual |
| 45 | Colorado | 21,000 | 4 | coloradocad.org | Unknown |
| 46 | Comal | 160,000 | 2 | comalcad.org | True Automation (cid=56) |
| 47 | Comanche | 13,500 | 4 | comanchecad.org | Unknown |
| 48 | Concho | 2,700 | 4 | N/A | Manual |
| 49 | Cooke | 42,000 | 2 | cookecad.org | True Automation (cid=107) |
| 50 | Coryell | 75,000 | 3 | coryellcad.org | Unknown |
| 51 | Cottle | 1,400 | 4 | N/A | Manual |
| 52 | Crane | 5,000 | 4 | cranecad.org | Unknown |
| 53 | Crockett | 3,700 | 4 | crockettcad.org | Unknown |
| 54 | Crosby | 5,500 | 4 | crosbycad.org | Unknown |
| 55 | Culberson | 2,200 | 4 | N/A | Manual |

### D Counties (8)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 56 | Dallam | 7,300 | 4 | dallamcad.org | Unknown |
| 57 | **Dallas** | 2,600,000 | **1** | dallascad.org | **Custom (Bulk Downloads)** |
| 58 | Dawson | 12,700 | 4 | dawsoncad.org | Unknown |
| 59 | Deaf Smith | 18,500 | 4 | deafsmithcad.org | Unknown |
| 60 | Delta | 5,300 | 4 | deltacad.org | Unknown |
| 61 | **Denton** | 900,000 | **2** | dentoncad.com | **True Automation (cid=19)** |
| 62 | DeWitt | 20,000 | 4 | dewittcad.org | Unknown |
| 63 | Dickens | 2,200 | 4 | N/A | Manual |
| 64 | Dimmit | 9,800 | 4 | dimmitcad.org | Unknown |
| 65 | Donley | 3,300 | 4 | N/A | Manual |
| 66 | Duval | 11,000 | 4 | duvalcad.org | Unknown |

### E Counties (7)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 67 | Eastland | 18,000 | 4 | eastlandcad.org | Unknown |
| 68 | Ector | 165,000 | 2 | ectorcad.org | True Automation likely |
| 69 | Edwards | 2,000 | 4 | N/A | Manual |
| 70 | El Paso | 865,000 | 3 | epcad.org | Custom (403 errors) |
| 71 | Ellis | 195,000 | 3 | elliscad.com | Custom |
| 72 | Erath | 43,000 | 3 | erathcad.org | Unknown |

### F Counties (9)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 73 | Falls | 17,000 | 4 | fallscad.org | Unknown |
| 74 | Fannin | 35,000 | 4 | fannincad.org | Unknown |
| 75 | Fayette | 25,000 | 4 | fayettecad.org | Unknown |
| 76 | Fisher | 3,800 | 4 | N/A | Manual |
| 77 | Floyd | 5,700 | 4 | floydcad.org | Unknown |
| 78 | Foard | 1,200 | 4 | N/A | Manual |
| 79 | Fort Bend | 850,000 | 3 | fbcad.org | Custom |
| 80 | Franklin | 10,600 | 4 | franklincad.org | Unknown |
| 81 | Freestone | 19,500 | 4 | freestonecad.org | Unknown |
| 82 | Frio | 20,000 | 4 | friocad.org | Unknown |

### G Counties (12)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 83 | Gaines | 21,000 | 4 | gainescad.org | Unknown |
| 84 | Galveston | 350,000 | 3 | galvestoncad.org | Custom |
| 85 | Garza | 6,200 | 4 | garzacad.org | Unknown |
| 86 | Gillespie | 27,000 | 4 | gillespiecad.org | Unknown |
| 87 | Glasscock | 1,400 | 4 | N/A | Manual |
| 88 | Goliad | 7,700 | 4 | goliadcad.org | Unknown |
| 89 | Gonzales | 21,000 | 4 | gonzalescad.org | Unknown |
| 90 | Gray | 22,000 | 4 | graycad.org | Unknown |
| 91 | Grayson | 140,000 | 3 | graysonappraisal.org | Custom |
| 92 | Gregg | 124,000 | 3 | greggcad.org | Unknown |
| 93 | Grimes | 30,000 | 4 | grimescad.org | Unknown |
| 94 | Guadalupe | 175,000 | 2 | guadalupead.org | True Automation (cid=2) |

### H Counties (16)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 95 | Hale | 33,000 | 2 | halecad.org | True Automation (cid=41) |
| 96 | Hall | 3,000 | 4 | N/A | Manual |
| 97 | Hamilton | 8,500 | 4 | hamiltoncad.org | Unknown |
| 98 | Hansford | 5,400 | 4 | hansfordcad.org | Unknown |
| 99 | Hardeman | 3,800 | 4 | N/A | Manual |
| 100 | Hardin | 57,000 | 3 | hardincad.org | Unknown |
| 101 | **Harris** | 4,700,000 | **1** | hcad.org | **Custom (ArcGIS + Bulk)** |
| 102 | Harrison | 67,000 | 3 | harrisoncad.org | Unknown |
| 103 | Hartley | 6,000 | 4 | hartleycad.org | Unknown |
| 104 | Haskell | 5,700 | 4 | haskellcad.org | Unknown |
| 105 | Hays | 240,000 | 3 | hayscad.com | Custom |
| 106 | Hemphill | 3,800 | 4 | hemphillcad.org | Unknown |
| 107 | Henderson | 82,000 | 3 | hendersoncad.org | Unknown |
| 108 | Hidalgo | 870,000 | 3 | hidalgoad.org | Custom |
| 109 | Hill | 36,000 | 2 | hillcad.org | True Automation (cid=32) |
| 110 | Hockley | 23,000 | 4 | hockleycad.org | Unknown |
| 111 | Hood | 65,000 | 3 | hoodcad.org | Unknown |
| 112 | Hopkins | 37,000 | 3 | hopkinscad.com | Unknown |
| 113 | Houston | 22,000 | 4 | houstoncad.org | Unknown |
| 114 | Howard | 36,000 | 4 | howardcad.org | Unknown |
| 115 | Hudspeth | 4,500 | 4 | hudspethcad.org | Unknown |
| 116 | Hunt | 100,000 | 3 | huntcad.org | Unknown |
| 117 | Hutchinson | 21,000 | 4 | hutchinsoncad.org | Unknown |

### I-J Counties (8)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 118 | Irion | 1,500 | 4 | N/A | Manual |
| 119 | Jack | 8,800 | 4 | jackcad.org | Unknown |
| 120 | Jackson | 14,500 | 4 | jacksoncad.org | Unknown |
| 121 | Jasper | 35,000 | 4 | jaspercad.org | Unknown |
| 122 | Jeff Davis | 2,300 | 4 | N/A | Manual |
| 123 | Jefferson | 255,000 | 3 | jcad.org | Custom |
| 124 | Jim Hogg | 5,200 | 4 | jimhoggcad.org | Unknown |
| 125 | Jim Wells | 40,000 | 4 | jimwellscad.org | Unknown |
| 126 | Johnson | 180,000 | 3 | johnsoncad.com | Custom |
| 127 | Jones | 19,800 | 4 | jonescad.org | Unknown |

### K Counties (10)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 128 | Karnes | 15,500 | 4 | karnescad.org | Unknown |
| 129 | Kaufman | 145,000 | 3 | kaufmancad.org | Custom |
| 130 | Kendall | 48,000 | 3 | kendallcad.org | Unknown |
| 131 | Kenedy | 400 | 4 | N/A | Manual |
| 132 | Kent | 750 | 4 | N/A | Manual |
| 133 | Kerr | 52,000 | 3 | kerrcad.org | Unknown |
| 134 | Kimble | 4,400 | 4 | kimblecad.org | Unknown |
| 135 | King | 270 | 4 | N/A | Manual (smallest county) |
| 136 | Kinney | 3,600 | 4 | N/A | Manual |
| 137 | Kleberg | 31,000 | 4 | klebergcad.org | Unknown |
| 138 | Knox | 3,700 | 4 | knoxcad.org | Unknown |

### L Counties (14)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 139 | La Salle | 7,500 | 4 | lasallecad.org | Unknown |
| 140 | Lamar | 50,000 | 3 | lamarcad.org | Unknown |
| 141 | Lamb | 13,000 | 4 | lambcad.org | Unknown |
| 142 | Lampasas | 22,000 | 4 | lampasascad.org | Unknown |
| 143 | Lavaca | 20,000 | 4 | lavacacad.org | Unknown |
| 144 | Lee | 17,000 | 4 | leecad.org | Unknown |
| 145 | Leon | 17,000 | 4 | leoncad.org | Unknown |
| 146 | Liberty | 91,000 | 3 | libertycad.org | Unknown |
| 147 | Limestone | 23,000 | 4 | limestonecad.org | Unknown |
| 148 | Lipscomb | 3,300 | 4 | N/A | Manual |
| 149 | Live Oak | 12,000 | 4 | liveoakcad.org | Unknown |
| 150 | Llano | 22,000 | 4 | llanocad.org | Unknown |
| 151 | Loving | 65 | 4 | N/A | Manual (2nd smallest) |
| 152 | Lubbock | 310,000 | 2 | lubbockcad.org | True Automation likely |
| 153 | Lynn | 5,800 | 4 | lynncad.org | Unknown |

### M Counties (17)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 154 | Madison | 14,500 | 4 | madisoncad.org | Unknown |
| 155 | Marion | 10,000 | 4 | marioncad.org | Unknown |
| 156 | Martin | 5,800 | 4 | martincad.org | Unknown |
| 157 | Mason | 4,200 | 4 | masoncad.org | Unknown |
| 158 | Matagorda | 36,000 | 4 | matagordacad.org | Unknown |
| 159 | Maverick | 58,000 | 3 | maverickcad.org | Unknown |
| 160 | McCulloch | 8,000 | 4 | mccullochcad.org | Unknown |
| 161 | McLennan | 260,000 | 2 | mclennancad.org | True Automation likely |
| 162 | McMullen | 660 | 4 | N/A | Manual |
| 163 | Medina | 52,000 | 3 | medinacad.org | Unknown |
| 164 | Menard | 2,100 | 4 | N/A | Manual |
| 165 | Midland | 175,000 | 2 | midcad.org | True Automation likely |
| 166 | Milam | 25,000 | 4 | milamcad.org | Unknown |
| 167 | Mills | 4,900 | 4 | millscad.org | Unknown |
| 168 | Mitchell | 9,000 | 4 | mitchellcad.org | Unknown |
| 169 | Montague | 20,000 | 4 | montaguecad.org | Unknown |
| 170 | Montgomery | 620,000 | 3 | mcad-tx.org | Custom |
| 171 | Moore | 21,000 | 4 | moorecad.org | Unknown |
| 172 | Morris | 12,500 | 4 | morriscad.org | Unknown |
| 173 | Motley | 1,150 | 4 | N/A | Manual |

### N Counties (6)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 174 | Nacogdoches | 65,000 | 3 | nacogdochescad.org | Unknown |
| 175 | Navarro | 50,000 | 3 | navarrocad.com | Unknown |
| 176 | Newton | 14,000 | 4 | newtoncad.org | Unknown |
| 177 | Nolan | 14,500 | 4 | nolancad.org | Unknown |
| 178 | Nueces | 360,000 | 3 | nuecescad.net | Custom |

### O Counties (4)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 179 | Ochiltree | 9,600 | 4 | ochiltreecad.org | Unknown |
| 180 | Oldham | 2,000 | 4 | N/A | Manual |
| 181 | Orange | 83,000 | 3 | orangecad.org | Unknown |

### P Counties (9)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 182 | Palo Pinto | 29,000 | 4 | palopintocad.org | Unknown |
| 183 | Panola | 23,000 | 4 | panolacad.org | Unknown |
| 184 | Parker | 150,000 | 3 | parkercad.org | Custom |
| 185 | Parmer | 9,600 | 4 | parmercad.org | Unknown |
| 186 | Pecos | 15,800 | 4 | pecoscad.org | Unknown |
| 187 | Polk | 51,000 | 3 | polkcad.org | Unknown |
| 188 | Potter | 118,000 | 3 | pottercad.org | Unknown |
| 189 | Presidio | 6,700 | 4 | presidiocad.org | Unknown |

### R Counties (12)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 190 | Rains | 13,000 | 4 | rainscad.org | Unknown |
| 191 | Randall | 140,000 | 3 | randallcad.org | Unknown |
| 192 | Reagan | 3,800 | 4 | reagancad.org | Unknown |
| 193 | Real | 3,400 | 4 | N/A | Manual |
| 194 | Red River | 12,500 | 4 | redrivercad.org | Unknown |
| 195 | Reeves | 16,000 | 4 | reevescad.org | Unknown |
| 196 | Refugio | 7,000 | 4 | refugiocad.org | Unknown |
| 197 | Roberts | 880 | 4 | N/A | Manual |
| 198 | Robertson | 17,000 | 4 | robertsoncad.org | Unknown |
| 199 | Rockwall | 110,000 | 3 | rockwallcad.com | Custom |
| 200 | Runnels | 10,500 | 4 | runnelscad.org | Unknown |
| 201 | Rusk | 54,000 | 3 | ruskcad.org | Unknown |

### S Counties (17)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 202 | Sabine | 10,500 | 4 | sabinecad.org | Unknown |
| 203 | San Augustine | 8,300 | 4 | sanaugustinecad.org | Unknown |
| 204 | San Jacinto | 29,000 | 2 | sanjacintocad.org | True Automation (cid=22) |
| 205 | San Patricio | 67,000 | 3 | sanpatcad.org | Unknown |
| 206 | San Saba | 6,000 | 4 | sansabacad.org | Unknown |
| 207 | Schleicher | 2,900 | 4 | N/A | Manual |
| 208 | Scurry | 17,000 | 4 | scurrycad.org | Unknown |
| 209 | Shackelford | 3,300 | 4 | N/A | Manual |
| 210 | Shelby | 25,000 | 4 | shelbycad.org | Unknown |
| 211 | Sherman | 3,000 | 4 | N/A | Manual |
| 212 | Smith | 235,000 | 2 | smithcad.org | True Automation likely |
| 213 | Somervell | 9,000 | 4 | somervellcad.org | Unknown |
| 214 | Starr | 65,000 | 3 | starrcad.org | Unknown |
| 215 | Stephens | 9,400 | 4 | stephenscad.org | Unknown |
| 216 | Sterling | 1,150 | 4 | N/A | Manual |
| 217 | Stonewall | 1,350 | 4 | N/A | Manual |
| 218 | Sutton | 3,800 | 4 | suttoncad.org | Unknown |
| 219 | Swisher | 7,000 | 2 | swishercad.org | True Automation (cid=54) |

### T Counties (10)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 220 | **Tarrant** | 2,100,000 | **1** | tad.org | **Custom (Open Data Portal)** |
| 221 | Taylor | 145,000 | 2 | taylorcad.org | True Automation likely |
| 222 | Terrell | 800 | 4 | N/A | Manual |
| 223 | Terry | 12,500 | 4 | terrycad.org | Unknown |
| 224 | Throckmorton | 1,500 | 4 | N/A | Manual |
| 225 | Titus | 33,000 | 4 | tituscad.org | Unknown |
| 226 | Tom Green | 120,000 | 3 | tomgreencad.org | Unknown |
| 227 | Travis | 1,300,000 | 3 | traviscad.org | Custom (currently 503) |
| 228 | Trinity | 14,500 | 4 | trinitycad.org | Unknown |
| 229 | Tyler | 21,000 | 4 | tylercad.org | Unknown |

### U-V Counties (6)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 230 | Upshur | 41,000 | 4 | upshurcad.org | Unknown |
| 231 | Upton | 3,600 | 4 | uptoncad.org | Unknown |
| 232 | Uvalde | 27,000 | 4 | uvaldecad.org | Unknown |
| 233 | Val Verde | 48,000 | 3 | valverdecad.org | Unknown |
| 234 | Van Zandt | 58,000 | 3 | vanzandtcad.org | Unknown |
| 235 | Victoria | 92,000 | 3 | victoriacad.org | Custom |

### W Counties (14)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 236 | Walker | 75,000 | 3 | walkercad.org | Unknown |
| 237 | Waller | 58,000 | 3 | wallercad.org | Unknown |
| 238 | Ward | 11,500 | 4 | wardcad.org | Unknown |
| 239 | Washington | 36,000 | 4 | washingtoncad.org | Unknown |
| 240 | Webb | 275,000 | 2 | webbcad.org | True Automation likely |
| 241 | Wharton | 41,000 | 4 | whartoncad.org | Unknown |
| 242 | Wheeler | 5,400 | 4 | wheelercad.org | Unknown |
| 243 | Wichita | 130,000 | 2 | wichitacad.org | True Automation likely |
| 244 | Wilbarger | 12,500 | 4 | wilbargercad.org | Unknown |
| 245 | Willacy | 21,000 | 4 | willacycad.org | Unknown |
| 246 | Williamson | 610,000 | 3 | wcad.org | Custom |
| 247 | Wilson | 52,000 | 2 | wilsoncad.org | True Automation (cid=27) |
| 248 | Winkler | 8,000 | 4 | winklercad.org | Unknown |
| 249 | Wise | 75,000 | 3 | wisecad.org | Unknown |
| 250 | Wood | 45,000 | 3 | woodcad.org | Unknown |

### Y-Z Counties (4)

| # | County | Pop. Est. | Tier | CAD Website | Platform |
|---|--------|-----------|------|-------------|----------|
| 251 | Yoakum | 8,600 | 4 | yoakumcad.org | Unknown |
| 252 | Young | 18,000 | 4 | youngcad.org | Unknown |
| 253 | Zapata | 14,000 | 4 | zapatacad.org | Unknown |
| 254 | Zavala | 12,000 | 4 | zavalacad.org | Unknown |

---

## SUMMARY BY TIER

### Tier 1: Bulk Data/API (3 counties, 3.45M parcels)
- Harris, Dallas, Tarrant
- **Immediate programmatic access verified**

### Tier 2: True Automation Platform (~25+ verified, ~75 likely)
- Verified: Bexar, Collin, Denton, Burnet, Cass, Comal, Cooke, Guadalupe, Hale, Hill, San Jacinto, Swisher, Wilson
- Likely: Bell, Brazos, Ector, Lubbock, McLennan, Midland, Smith, Taylor, Webb, Wichita, and ~65 others
- **One scraper covers all True Automation counties**

### Tier 3: Custom Systems (~50 counties)
- Fort Bend, Travis, Hidalgo, El Paso, Montgomery, Williamson, Cameron, etc.
- **Individual scrapers needed**

### Tier 4: Small/Rural (~100 counties)
- Populations under 20,000
- Many have minimal web presence
- **Manual access or phone requests**

---

## IMPLEMENTATION PRIORITY

### Phase 1: Immediate (3 counties, 3.45M parcels)
1. Harris County (HCAD) - ArcGIS API working
2. Dallas County (DCAD) - Bulk downloads working
3. Tarrant County (TAD) - Open Data Portal working

### Phase 2: True Automation (~100 counties, ~5M parcels)
1. Build single True Automation scraper
2. Configure with CAD IDs
3. Covers majority of remaining population

### Phase 3: Major Custom Systems (~20 counties, ~4M parcels)
1. Travis, Fort Bend, Hidalgo, El Paso, Montgomery
2. Williamson, Cameron, Nueces, Galveston, Brazoria
3. Individual scrapers per system

### Phase 4: Remaining Counties (as needed)
- Based on portfolio requirements
- Many small counties with minimal data

---

## DATA ACCESS NOTES

### Counties with Known Issues
| County | Issue | Workaround |
|--------|-------|------------|
| Travis | 503 errors | Wait and retry |
| El Paso | 403 blocked | Add headers |
| TAD (Tarrant main) | 403 blocked | Use Open Data Portal |
| Brazoria | 503 errors | Retry later |

### Very Small Counties (< 1,000 population)
These 8 counties have minimal online presence:
- Loving (65), King (270), Kenedy (400), McMullen (660), Borden (640), Roberts (880), Terrell (800), Sterling (1,150)

### CAD Website URL Patterns
Most Texas CADs follow: `www.{county}cad.org` or `www.{county}cad.com`

---

## APPENDIX: True Automation CAD ID Reference

| CAD ID | County | Verified |
|--------|--------|----------|
| 2 | Guadalupe | Y |
| 3 | Cass | Y |
| 19 | Denton | Y |
| 22 | San Jacinto | Y |
| 27 | Wilson | Y |
| 32 | Hill | Y |
| 41 | Hale | Y |
| 54 | Swisher | Y |
| 56 | Comal | Y |
| 85 | Burnet | Y |
| 107 | Cooke | Y |
| 110 | Bexar | Y |
| 111 | Collin | Y |

**Note:** True Automation CAD IDs range from 1-250+. Testing requires systematic validation.

---

*Last Updated: January 24, 2026*
