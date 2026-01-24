"""
Texas Parcel Lookup Module
Provides unified interface for looking up property information by parcel ID

Supported Counties:
- Harris (HCAD) - Direct API access (WORKING)
- Dallas (DCAD) - Web scraping (WORKING)
- Tarrant (TAD) - Requires browser automation (Cloudflare protected)

Usage:
    from texas_parcel_lookup import lookup_parcel

    # Harris County (API)
    result = lookup_parcel("harris", "1170310000010")

    # Dallas County (Web scraping)
    result = lookup_parcel("dallas", "99091019530000000")

    print(result)
"""

import requests
import json
import re
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from urllib.parse import quote

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


@dataclass
class ParcelInfo:
    """Standardized parcel information structure"""
    county: str
    parcel_id: str
    owner_name: str
    property_address: str
    mailing_address: Optional[str]
    land_value: float
    building_value: float
    total_value: float
    tax_year: str
    legal_description: Optional[str]
    acreage: Optional[float]
    property_class: Optional[str]
    raw_data: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "county": self.county,
            "parcel_id": self.parcel_id,
            "owner_name": self.owner_name,
            "property_address": self.property_address,
            "mailing_address": self.mailing_address,
            "land_value": self.land_value,
            "building_value": self.building_value,
            "total_value": self.total_value,
            "tax_year": self.tax_year,
            "legal_description": self.legal_description,
            "acreage": self.acreage,
            "property_class": self.property_class,
        }


class HarrisCountyLookup:
    """
    Harris County (HCAD) parcel lookup via ArcGIS REST API

    Status: FULLY WORKING
    """

    BASE_URL = "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query"

    # Fields to request from API
    FIELDS = [
        "acct_num", "owner_name_1", "owner_name_2",
        "site_str_num", "site_str_name", "site_city", "site_zip",
        "mail_addr_1", "mail_city", "mail_state", "mail_zip",
        "land_value", "bld_value", "total_market_val",
        "tax_year", "legal_dscr_1", "Acreage", "state_class"
    ]

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def lookup(self, parcel_id: str) -> Optional[ParcelInfo]:
        """
        Look up a parcel by account number

        Args:
            parcel_id: HCAD account number (e.g., "1170310000010")

        Returns:
            ParcelInfo object or None if not found
        """
        # Build query - use LIKE for flexibility
        where_clause = f"acct_num LIKE '{parcel_id}'"

        params = {
            "where": where_clause,
            "outFields": ",".join(self.FIELDS),
            "f": "json",
            "returnGeometry": "false"
        }

        try:
            response = self.session.get(
                self.BASE_URL,
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()

            data = response.json()
            features = data.get("features", [])

            if not features:
                return None

            attrs = features[0].get("attributes", {})
            return self._parse_response(parcel_id, attrs)

        except requests.RequestException as e:
            print(f"Error querying HCAD API: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"Error parsing HCAD response: {e}")
            return None

    def _parse_response(self, parcel_id: str, attrs: Dict) -> ParcelInfo:
        """Parse HCAD API response into ParcelInfo"""

        # Build property address
        street_num = attrs.get("site_str_num", "")
        street_name = attrs.get("site_str_name", "")
        city = attrs.get("site_city", "")
        zip_code = attrs.get("site_zip", "")
        property_address = f"{street_num} {street_name}, {city} {zip_code}".strip()

        # Build mailing address
        mail_addr = attrs.get("mail_addr_1", "")
        mail_city = attrs.get("mail_city", "")
        mail_state = attrs.get("mail_state", "")
        mail_zip = attrs.get("mail_zip", "")
        mailing_address = None
        if mail_addr:
            mailing_address = f"{mail_addr}, {mail_city}, {mail_state} {mail_zip}".strip()

        return ParcelInfo(
            county="Harris",
            parcel_id=attrs.get("acct_num", parcel_id),
            owner_name=attrs.get("owner_name_1", ""),
            property_address=property_address,
            mailing_address=mailing_address,
            land_value=attrs.get("land_value") or 0.0,
            building_value=attrs.get("bld_value") or 0.0,
            total_value=attrs.get("total_market_val") or 0.0,
            tax_year=attrs.get("tax_year", ""),
            legal_description=attrs.get("legal_dscr_1"),
            acreage=attrs.get("Acreage"),
            property_class=attrs.get("state_class"),
            raw_data=attrs
        )

    def search_by_address(self, street_num: int, street_name: str, limit: int = 10) -> list:
        """
        Search parcels by address

        Args:
            street_num: Street number
            street_name: Street name (partial match)
            limit: Maximum results to return

        Returns:
            List of ParcelInfo objects
        """
        where_clause = f"site_str_num = {street_num} AND site_str_name LIKE '%{street_name.upper()}%'"

        params = {
            "where": where_clause,
            "outFields": ",".join(self.FIELDS),
            "f": "json",
            "returnGeometry": "false",
            "resultRecordCount": limit
        }

        try:
            response = self.session.get(
                self.BASE_URL,
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()

            data = response.json()
            features = data.get("features", [])

            results = []
            for feature in features:
                attrs = feature.get("attributes", {})
                parcel_id = attrs.get("acct_num", "")
                results.append(self._parse_response(parcel_id, attrs))

            return results

        except Exception as e:
            print(f"Error searching HCAD: {e}")
            return []

    def search_by_owner(self, owner_name: str, limit: int = 10) -> list:
        """
        Search parcels by owner name

        Args:
            owner_name: Owner name (partial match)
            limit: Maximum results to return

        Returns:
            List of ParcelInfo objects
        """
        where_clause = f"owner_name_1 LIKE '%{owner_name.upper()}%'"

        params = {
            "where": where_clause,
            "outFields": ",".join(self.FIELDS),
            "f": "json",
            "returnGeometry": "false",
            "resultRecordCount": limit
        }

        try:
            response = self.session.get(
                self.BASE_URL,
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()

            data = response.json()
            features = data.get("features", [])

            results = []
            for feature in features:
                attrs = feature.get("attributes", {})
                parcel_id = attrs.get("acct_num", "")
                results.append(self._parse_response(parcel_id, attrs))

            return results

        except Exception as e:
            print(f"Error searching HCAD: {e}")
            return []


class DallasCountyLookup:
    """
    Dallas County (DCAD) parcel lookup via web scraping

    Status: WORKING (Web Scraping)
    - Scrapes property detail pages from dallascad.org
    - Parcel IDs are 17-character strings (e.g., "99091019530000000")
    """

    BASE_URL = "https://www.dallascad.org"
    DETAIL_URL = "https://www.dallascad.org/AcctDetailRes.aspx"
    SEARCH_URL = "https://www.dallascad.org/SearchAddr.aspx"

    def __init__(self, timeout: int = 30):
        """
        Initialize Dallas County lookup

        Args:
            timeout: Request timeout in seconds
        """
        if not HAS_BS4:
            raise ImportError("BeautifulSoup4 required for Dallas lookup. Install with: pip install beautifulsoup4")

        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def lookup(self, parcel_id: str) -> Optional[ParcelInfo]:
        """
        Look up a parcel by ID (web scraping)

        Args:
            parcel_id: Dallas CAD property ID (17-char string, e.g., "99091019530000000")

        Returns:
            ParcelInfo object or None if not found
        """
        url = f"{self.DETAIL_URL}?ID={parcel_id}"

        try:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Check for error page
            title = soup.find('title')
            if title and 'Error' in title.get_text():
                return None

            return self._parse_detail_page(parcel_id, soup)

        except requests.RequestException as e:
            print(f"Error fetching DCAD page: {e}")
            return None

    def _parse_detail_page(self, parcel_id: str, soup: BeautifulSoup) -> Optional[ParcelInfo]:
        """Parse DCAD property detail page"""

        raw_data = {}

        # Extract all labeled spans
        for span in soup.find_all('span', id=True):
            span_id = span.get('id', '')
            text = span.get_text(strip=True)
            if text:
                raw_data[span_id] = text

        # Extract owner name - look for row after "Owner Name" header
        owner_name = ""
        legal_desc = raw_data.get('LegalDesc1_lblLegal1', '')

        # Find owner by looking for row pattern: "Owner Name" | "Ownership %"
        # followed by: "OWNER NAME HERE" | "100%"
        for tr in soup.find_all('tr'):
            cells = tr.find_all('td')
            if len(cells) >= 2:
                first_cell = cells[0].get_text(strip=True)
                # Check if this is the owner data row (has percentage like "100%")
                second_cell = cells[1].get_text(strip=True) if len(cells) > 1 else ''
                if re.match(r'\d+%$', second_cell) and first_cell and 'Owner' not in first_cell:
                    owner_name = first_cell
                    break

        # Fallback to legal description for owner name
        if not owner_name and legal_desc:
            owner_name = legal_desc

        # Extract address - look for street address pattern in page text
        address = ""
        # Common street suffixes
        street_pattern = r'^\d+\s+[EWNS]?\s*[A-Z][A-Z\s]+(?:ST|DR|AVE|RD|LN|BLVD|CT|CIR|WAY|PL|PKWY|HWY)$'

        for text in soup.stripped_strings:
            if re.match(street_pattern, text, re.I):
                address = text
                break

        # If no address found, look in any cell with address-like content
        if not address:
            for td in soup.find_all('td'):
                text = td.get_text(strip=True)
                if re.match(street_pattern, text, re.I):
                    address = text
                    break

        # Extract values
        def parse_money(text: str) -> float:
            """Parse money string like '$15,920' to float"""
            if not text:
                return 0.0
            cleaned = re.sub(r'[^\d.]', '', text)
            try:
                return float(cleaned) if cleaned else 0.0
            except ValueError:
                return 0.0

        improvement_val = parse_money(raw_data.get('ValueSummary1_lblImpVal', ''))
        land_val = parse_money(raw_data.get('ValueSummary1_pnlValue_lblLandVal', ''))
        total_val = parse_money(raw_data.get('ValueSummary1_pnlValue_lblTotalVal', ''))

        # Extract tax year
        tax_year = raw_data.get('ValueSummary1_lblApprYr', '')
        # Clean up tax year (e.g., "2025 Certified Values" -> "2025")
        year_match = re.search(r'(\d{4})', tax_year)
        if year_match:
            tax_year = year_match.group(1)

        if not owner_name and not total_val:
            return None

        return ParcelInfo(
            county="Dallas",
            parcel_id=parcel_id,
            owner_name=owner_name,
            property_address=address,
            mailing_address=None,
            land_value=land_val,
            building_value=improvement_val,
            total_value=total_val,
            tax_year=tax_year,
            legal_description=legal_desc,
            acreage=None,
            property_class=None,
            raw_data=raw_data
        )

    def search_by_address(self, street_num: int, street_name: str, city: str = "DALLAS", limit: int = 10) -> List[Dict]:
        """
        Search for properties by address

        Args:
            street_num: Street number
            street_name: Street name
            city: City name (default: DALLAS)
            limit: Max results

        Returns:
            List of dicts with parcel_id and address
        """
        # First get the search page for ViewState
        resp = self.session.get(self.SEARCH_URL, timeout=self.timeout)
        soup = BeautifulSoup(resp.text, 'html.parser')

        viewstate = soup.find('input', {'name': '__VIEWSTATE'})
        viewstate_gen = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
        event_validation = soup.find('input', {'name': '__EVENTVALIDATION'})

        # City codes (partial list)
        city_codes = {
            'DALLAS': '2', 'RICHARDSON': '38', 'PLANO': '37',
            'GARLAND': '22', 'IRVING': '31', 'MESQUITE': '34'
        }
        city_code = city_codes.get(city.upper(), '2')

        form_data = {
            '__VIEWSTATE': viewstate['value'] if viewstate else '',
            '__VIEWSTATEGENERATOR': viewstate_gen['value'] if viewstate_gen else '',
            '__EVENTVALIDATION': event_validation['value'] if event_validation else '',
            '__EVENTTARGET': '',
            '__EVENTARGUMENT': '',
            'txtAddrNum': str(street_num),
            'txtStName': street_name.upper(),
            'ddlCity': city_code,
            'txtBldgID': '',
            'txtUnitID': '',
            'txtAddrNum1': '',
            'txtAddrNum2': '',
            'AcctTypeCheckList1:chkAcctType:0': 'on',
            'AcctTypeCheckList1:chkAcctType:1': 'on',
            'AcctTypeCheckList1:chkAcctType:2': 'on',
            'cmdSubmit': 'Search'
        }

        resp = self.session.post(self.SEARCH_URL, data=form_data, timeout=self.timeout)
        soup = BeautifulSoup(resp.text, 'html.parser')

        results = []
        links = soup.find_all('a', href=re.compile(r'AcctDetail.*ID='))

        for link in links[:limit]:
            href = link.get('href', '')
            text = link.get_text(strip=True)
            match = re.search(r'ID=([^&"]+)', href)
            if match:
                results.append({
                    'parcel_id': match.group(1),
                    'address': text
                })

        return results


class TarrantCountyLookup:
    """
    Tarrant County (TAD) parcel lookup

    Status: REQUIRES BROWSER AUTOMATION OR BULK DATA
    - Website protected by Cloudflare (returns 403 for requests)
    - Can use Selenium with Chrome/Firefox if installed
    - Or download bulk data manually and use SQLite
    """

    BULK_DATA_URL = "https://www.tad.org/content/data-download/PropertyData(Delimited).ZIP"
    SEARCH_URL = "https://www.tad.org/property-search/"
    PROPERTY_URL = "https://www.tad.org/property/"

    def __init__(self, db_path: str = None, use_selenium: bool = False, headless: bool = True):
        """
        Initialize Tarrant County lookup

        Args:
            db_path: Path to SQLite database with bulk data (if downloaded)
            use_selenium: If True, use Selenium for web scraping
            headless: If True, run browser in headless mode (no GUI)
        """
        self.db_path = db_path
        self.use_selenium = use_selenium
        self.headless = headless
        self._driver = None

    def _init_selenium(self):
        """Initialize Selenium WebDriver"""
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.chrome.service import Service
        except ImportError:
            raise ImportError(
                "Selenium not installed. Install with:\n"
                "  pip install selenium webdriver-manager"
            )

        options = Options()
        if self.headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        try:
            # Try using webdriver-manager for automatic driver management
            from webdriver_manager.chrome import ChromeDriverManager
            service = Service(ChromeDriverManager().install())
            self._driver = webdriver.Chrome(service=service, options=options)
        except Exception:
            # Fallback to default chromedriver
            try:
                self._driver = webdriver.Chrome(options=options)
            except Exception as e:
                raise RuntimeError(
                    f"Could not start Chrome browser: {e}\n\n"
                    "Make sure Chrome/Chromium is installed:\n"
                    "  - Ubuntu/Debian: sudo apt install chromium-browser\n"
                    "  - macOS: brew install --cask google-chrome\n"
                    "  - Windows: Download from google.com/chrome\n"
                )

        self._driver.set_page_load_timeout(30)
        return self._driver

    def _close_selenium(self):
        """Close Selenium WebDriver"""
        if self._driver:
            try:
                self._driver.quit()
            except:
                pass
            self._driver = None

    def lookup(self, parcel_id: str) -> Optional[ParcelInfo]:
        """
        Look up a parcel by ID

        Args:
            parcel_id: Tarrant County property ID

        Returns:
            ParcelInfo object or None if not found
        """
        if self.db_path:
            return self._lookup_sqlite(parcel_id)

        if self.use_selenium:
            return self._lookup_selenium(parcel_id)

        raise NotImplementedError(
            "Tarrant County lookup requires special handling.\n\n"
            "The TAD website is protected by Cloudflare and blocks automated requests.\n\n"
            "Options:\n"
            "1. Use Selenium (requires Chrome browser installed):\n"
            "   lookup = TarrantCountyLookup(use_selenium=True)\n"
            "   result = lookup.lookup('12345678')\n\n"
            "2. Download bulk data manually from browser:\n"
            f"   {self.BULK_DATA_URL}\n"
            "   Then: lookup = TarrantCountyLookup(db_path='path/to/data.db')\n"
        )

    def _lookup_sqlite(self, parcel_id: str) -> Optional[ParcelInfo]:
        """Look up parcel from local SQLite database"""
        import sqlite3

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Try common column names for parcel ID
        for id_col in ['prop_id', 'parcel_id', 'account', 'acct_num', 'property_id']:
            try:
                cursor.execute(f"SELECT * FROM properties WHERE {id_col} = ?", (parcel_id,))
                row = cursor.fetchone()
                if row:
                    columns = [desc[0] for desc in cursor.description]
                    data = dict(zip(columns, row))
                    conn.close()
                    return self._parse_sqlite_row(parcel_id, data)
            except sqlite3.OperationalError:
                continue

        conn.close()
        return None

    def _parse_sqlite_row(self, parcel_id: str, data: Dict) -> ParcelInfo:
        """Parse SQLite row into ParcelInfo"""
        # Map common field names
        owner = data.get('owner_name') or data.get('owner') or data.get('owner_name_1', '')
        address = data.get('situs_address') or data.get('property_address') or data.get('address', '')
        land_val = float(data.get('land_value') or data.get('land_val') or 0)
        bldg_val = float(data.get('improvement_value') or data.get('bldg_value') or data.get('impr_val') or 0)
        total_val = float(data.get('total_value') or data.get('market_value') or data.get('total_market_val') or 0)

        return ParcelInfo(
            county="Tarrant",
            parcel_id=parcel_id,
            owner_name=owner,
            property_address=address,
            mailing_address=data.get('mailing_address'),
            land_value=land_val,
            building_value=bldg_val,
            total_value=total_val,
            tax_year=str(data.get('tax_year', '')),
            legal_description=data.get('legal_description'),
            acreage=data.get('acreage'),
            property_class=data.get('property_class'),
            raw_data=data
        )

    def _lookup_selenium(self, parcel_id: str) -> Optional[ParcelInfo]:
        """Look up parcel using Selenium browser automation"""
        import time
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        try:
            driver = self._init_selenium()

            # Navigate to TAD search
            driver.get(self.SEARCH_URL)
            time.sleep(5)  # Wait for Cloudflare

            # Check if we're past Cloudflare
            if "challenge" in driver.page_source.lower():
                print("Waiting for Cloudflare challenge...")
                time.sleep(10)

            # Try to find and use the search form
            try:
                # Look for search input
                search_input = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text'], input[type='search']"))
                )
                search_input.clear()
                search_input.send_keys(parcel_id)

                # Find and click search button
                search_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit']")
                search_btn.click()

                time.sleep(3)

                # Parse results
                return self._parse_selenium_page(parcel_id, driver.page_source)

            except Exception as e:
                print(f"Search form not found or error: {e}")
                return None

        finally:
            self._close_selenium()

    def _parse_selenium_page(self, parcel_id: str, page_source: str) -> Optional[ParcelInfo]:
        """Parse TAD property page from Selenium"""
        if not HAS_BS4:
            return None

        soup = BeautifulSoup(page_source, 'html.parser')

        # Extract property data - TAD-specific parsing
        owner = ""
        address = ""
        land_value = 0.0
        bldg_value = 0.0
        total_value = 0.0

        # Look for common patterns in TAD pages
        for text in soup.stripped_strings:
            if 'Owner' in text:
                # Try to get next text element
                pass
            if re.match(r'^\d+\s+[A-Z]', text):
                address = text

        # Look for value table
        for table in soup.find_all('table'):
            for row in table.find_all('tr'):
                cells = row.find_all('td')
                if len(cells) >= 2:
                    label = cells[0].get_text(strip=True).lower()
                    value = cells[1].get_text(strip=True)

                    if 'owner' in label:
                        owner = value
                    elif 'land' in label and 'value' in label:
                        land_value = self._parse_money(value)
                    elif 'improvement' in label or 'building' in label:
                        bldg_value = self._parse_money(value)
                    elif 'total' in label or 'market' in label:
                        total_value = self._parse_money(value)

        if not owner and not total_value:
            return None

        return ParcelInfo(
            county="Tarrant",
            parcel_id=parcel_id,
            owner_name=owner,
            property_address=address,
            mailing_address=None,
            land_value=land_value,
            building_value=bldg_value,
            total_value=total_value,
            tax_year="",
            legal_description=None,
            acreage=None,
            property_class=None,
            raw_data={}
        )

    def _parse_money(self, text: str) -> float:
        """Parse money string to float"""
        if not text:
            return 0.0
        cleaned = re.sub(r'[^\d.]', '', text)
        try:
            return float(cleaned) if cleaned else 0.0
        except ValueError:
            return 0.0


# County lookup registry
COUNTY_LOOKUPS = {
    "harris": HarrisCountyLookup,
    "dallas": DallasCountyLookup,
    "tarrant": TarrantCountyLookup,
}


def lookup_parcel(county: str, parcel_id: str, **kwargs) -> Optional[ParcelInfo]:
    """
    Unified parcel lookup function

    Args:
        county: County name (e.g., "harris", "dallas", "tarrant")
        parcel_id: Parcel/account ID
        **kwargs: Additional arguments passed to county lookup class

    Returns:
        ParcelInfo object or None if not found

    Raises:
        ValueError: If county not supported
        NotImplementedError: If county requires bulk data not loaded
    """
    county_lower = county.lower().strip()

    if county_lower not in COUNTY_LOOKUPS:
        supported = ", ".join(COUNTY_LOOKUPS.keys())
        raise ValueError(f"County '{county}' not supported. Supported: {supported}")

    lookup_class = COUNTY_LOOKUPS[county_lower]
    lookup = lookup_class(**kwargs)
    return lookup.lookup(parcel_id)


def get_supported_counties() -> list:
    """Return list of supported county names"""
    return list(COUNTY_LOOKUPS.keys())


# CLI interface
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python texas_parcel_lookup.py <county> <parcel_id>")
        print(f"Supported counties: {', '.join(get_supported_counties())}")
        print()
        print("Example:")
        print("  python texas_parcel_lookup.py harris 1170310000010")
        sys.exit(1)

    county = sys.argv[1]
    parcel_id = sys.argv[2]

    try:
        result = lookup_parcel(county, parcel_id)

        if result:
            print(f"\n{'='*60}")
            print(f"PARCEL LOOKUP RESULT - {result.county.upper()} COUNTY")
            print(f"{'='*60}")
            print(f"Parcel ID:    {result.parcel_id}")
            print(f"Owner:        {result.owner_name}")
            print(f"Address:      {result.property_address}")
            if result.mailing_address:
                print(f"Mail To:      {result.mailing_address}")
            print(f"")
            print(f"Land Value:   ${result.land_value:,.0f}")
            print(f"Bldg Value:   ${result.building_value:,.0f}")
            print(f"Total Value:  ${result.total_value:,.0f}")
            print(f"Tax Year:     {result.tax_year}")
            if result.acreage:
                print(f"Acreage:      {result.acreage}")
            if result.property_class:
                print(f"Class:        {result.property_class}")
            print(f"{'='*60}")
        else:
            print(f"No parcel found for ID: {parcel_id}")

    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except NotImplementedError as e:
        print(f"Not Implemented: {e}")
        sys.exit(1)
