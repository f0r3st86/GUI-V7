"""
Custom Scrapers for County-Specific Systems

Large counties often have proprietary systems that require custom scrapers.
This module contains scrapers for specific counties that don't fit
the standard platform adapters.

Supported Counties:
- Dallas County, TX (DCAD) - ASP.NET web scraping
- Tarrant County, TX (TAD) - Selenium + SQLite bulk data
"""

import re
import time
import logging
from typing import Optional, List, Dict, Any

import requests
from bs4 import BeautifulSoup

from ..core import ParcelInfo, CountyConfig
from .base import BaseAdapter

logger = logging.getLogger(__name__)


class CustomScraperAdapter(BaseAdapter):
    """
    Adapter that dispatches to county-specific scrapers.

    Each county with a custom system has its own scraper class.
    This adapter routes to the appropriate scraper based on config.
    """

    def __init__(self):
        super().__init__()
        self._scrapers = {
            "DallasCountyScraper": DallasCountyScraper(),
            "TarrantCountyScraper": TarrantCountyScraper(),
        }

    def lookup(self, config: CountyConfig, parcel_id: str) -> Optional[ParcelInfo]:
        """Route to appropriate county scraper"""
        scraper_class = config.extra.get("scraper_class")
        if not scraper_class:
            raise ValueError(f"No scraper_class specified for {config.county}")

        scraper = self._scrapers.get(scraper_class)
        if not scraper:
            raise ValueError(f"Scraper not found: {scraper_class}")

        self._rate_limit(config)
        return scraper.lookup(config, parcel_id)

    def search_by_address(
        self,
        config: CountyConfig,
        street_num: int,
        street_name: str,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """Route address search to appropriate scraper"""
        scraper_class = config.extra.get("scraper_class")
        scraper = self._scrapers.get(scraper_class)

        if scraper and hasattr(scraper, 'search_by_address'):
            self._rate_limit(config)
            return scraper.search_by_address(config, street_num, street_name, limit)

        raise NotImplementedError(f"Address search not supported for {config.county}")


class DallasCountyScraper:
    """
    Dallas County (DCAD) scraper.

    Scrapes property detail pages from dallascad.org
    Parcel IDs are 17-character strings (e.g., "99091019530000000")

    Status: WORKING
    """

    DETAIL_URL = "https://www.dallascad.org/AcctDetailRes.aspx"
    SEARCH_URL = "https://www.dallascad.org/SearchAddr.aspx"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def lookup(self, config: CountyConfig, parcel_id: str) -> Optional[ParcelInfo]:
        """Look up parcel by ID via web scraping"""
        url = f"{self.DETAIL_URL}?ID={parcel_id}"

        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Check for error page
            title = soup.find('title')
            if title and 'Error' in title.get_text():
                return None

            return self._parse_detail_page(config, parcel_id, soup, url)

        except requests.RequestException as e:
            logger.error(f"Error fetching DCAD page: {e}")
            return None

    def _parse_detail_page(
        self,
        config: CountyConfig,
        parcel_id: str,
        soup: BeautifulSoup,
        url: str
    ) -> Optional[ParcelInfo]:
        """Parse DCAD property detail page"""

        raw_data = {"source_url": url}

        # Extract all labeled spans
        for span in soup.find_all('span', id=True):
            span_id = span.get('id', '')
            text = span.get_text(strip=True)
            if text:
                raw_data[span_id] = text

        # Extract owner name
        owner_name = ""
        legal_desc = raw_data.get('LegalDesc1_lblLegal1', '')

        # Find owner by looking for row with percentage pattern
        for tr in soup.find_all('tr'):
            cells = tr.find_all('td')
            if len(cells) >= 2:
                first_cell = cells[0].get_text(strip=True)
                second_cell = cells[1].get_text(strip=True) if len(cells) > 1 else ''
                if re.match(r'\d+%$', second_cell) and first_cell and 'Owner' not in first_cell:
                    owner_name = first_cell
                    break

        if not owner_name and legal_desc:
            owner_name = legal_desc

        # Extract address
        address = ""
        street_pattern = r'^\d+\s+[EWNS]?\s*[A-Z][A-Z\s]+(?:ST|DR|AVE|RD|LN|BLVD|CT|CIR|WAY|PL|PKWY|HWY)$'

        for text in soup.stripped_strings:
            if re.match(street_pattern, text, re.I):
                address = text
                break

        if not address:
            for td in soup.find_all('td'):
                text = td.get_text(strip=True)
                if re.match(street_pattern, text, re.I):
                    address = text
                    break

        # Extract values
        def parse_money(text: str) -> float:
            if not text:
                return 0.0
            cleaned = re.sub(r'[^\d.]', '', text)
            try:
                return float(cleaned) if cleaned else 0.0
            except ValueError:
                return 0.0

        land_val = parse_money(raw_data.get('ValueSummary1_pnlValue_lblLandVal', ''))
        bldg_val = parse_money(raw_data.get('ValueSummary1_lblImpVal', ''))
        total_val = parse_money(raw_data.get('ValueSummary1_pnlValue_lblTotalVal', ''))

        # Extract tax year
        tax_year = raw_data.get('ValueSummary1_lblApprYr', '')
        year_match = re.search(r'(\d{4})', tax_year)
        if year_match:
            tax_year = year_match.group(1)

        if not owner_name and not total_val:
            return None

        return ParcelInfo(
            state=config.state,
            county=config.county,
            parcel_id=parcel_id,
            owner_name=owner_name,
            property_address=address,
            mailing_address=None,
            land_value=land_val,
            building_value=bldg_val,
            total_value=total_val,
            tax_year=tax_year,
            legal_description=legal_desc if legal_desc else None,
            source_url=url,
            raw_data=raw_data,
        )

    def search_by_address(
        self,
        config: CountyConfig,
        street_num: int,
        street_name: str,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """Search for properties by address"""
        # Get search page for ViewState
        resp = self.session.get(self.SEARCH_URL, timeout=30)
        soup = BeautifulSoup(resp.text, 'html.parser')

        viewstate = soup.find('input', {'name': '__VIEWSTATE'})
        viewstate_gen = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
        event_validation = soup.find('input', {'name': '__EVENTVALIDATION'})

        form_data = {
            '__VIEWSTATE': viewstate['value'] if viewstate else '',
            '__VIEWSTATEGENERATOR': viewstate_gen['value'] if viewstate_gen else '',
            '__EVENTVALIDATION': event_validation['value'] if event_validation else '',
            '__EVENTTARGET': '',
            '__EVENTARGUMENT': '',
            'txtAddrNum': str(street_num),
            'txtStName': street_name.upper(),
            'ddlCity': '2',  # Dallas
            'cmdSubmit': 'Search'
        }

        resp = self.session.post(self.SEARCH_URL, data=form_data, timeout=30)
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


class TarrantCountyScraper:
    """
    Tarrant County (TAD) scraper.

    Website protected by Cloudflare - requires Selenium or bulk data.

    Options:
    1. Selenium browser automation (requires Chrome)
    2. SQLite database from bulk data download

    Status: REQUIRES BROWSER OR BULK DATA
    """

    SEARCH_URL = "https://www.tad.org/property-search/"
    BULK_DATA_URL = "https://www.tad.org/content/data-download/PropertyData(Delimited).ZIP"

    def __init__(self, db_path: str = None):
        self.db_path = db_path
        self._driver = None

    def lookup(self, config: CountyConfig, parcel_id: str) -> Optional[ParcelInfo]:
        """Look up parcel - uses Selenium if configured, else SQLite"""
        # Check for SQLite database first
        if self.db_path:
            return self._lookup_sqlite(config, parcel_id)

        # Check if Selenium is required
        if config.requires_selenium:
            return self._lookup_selenium(config, parcel_id)

        raise NotImplementedError(
            f"Tarrant County lookup requires special handling.\n\n"
            f"The TAD website is protected by Cloudflare.\n\n"
            f"Options:\n"
            f"1. Configure requires_selenium=True in county config\n"
            f"2. Download bulk data manually and load into SQLite"
        )

    def _lookup_sqlite(self, config: CountyConfig, parcel_id: str) -> Optional[ParcelInfo]:
        """Look up parcel from local SQLite database"""
        import sqlite3

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Try common column names
        for id_col in ['prop_id', 'parcel_id', 'account', 'acct_num', 'property_id']:
            try:
                cursor.execute(f"SELECT * FROM properties WHERE {id_col} = ?", (parcel_id,))
                row = cursor.fetchone()
                if row:
                    columns = [desc[0] for desc in cursor.description]
                    data = dict(zip(columns, row))
                    conn.close()
                    return self._build_from_sqlite(config, parcel_id, data)
            except sqlite3.OperationalError:
                continue

        conn.close()
        return None

    def _build_from_sqlite(
        self,
        config: CountyConfig,
        parcel_id: str,
        data: Dict
    ) -> ParcelInfo:
        """Build ParcelInfo from SQLite row"""
        owner = data.get('owner_name') or data.get('owner') or data.get('owner_name_1', '')
        address = data.get('situs_address') or data.get('property_address') or data.get('address', '')
        land_val = float(data.get('land_value') or data.get('land_val') or 0)
        bldg_val = float(data.get('improvement_value') or data.get('bldg_value') or data.get('impr_val') or 0)
        total_val = float(data.get('total_value') or data.get('market_value') or data.get('total_market_val') or 0)

        return ParcelInfo(
            state=config.state,
            county=config.county,
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
            raw_data=data,
        )

    def _lookup_selenium(self, config: CountyConfig, parcel_id: str) -> Optional[ParcelInfo]:
        """Look up parcel using Selenium browser automation"""
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.chrome.service import Service
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
        except ImportError:
            raise ImportError(
                "Selenium not installed. Install with:\n"
                "  pip install selenium webdriver-manager"
            )

        driver = None
        try:
            # Initialize Chrome
            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

            try:
                from webdriver_manager.chrome import ChromeDriverManager
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=options)
            except Exception:
                driver = webdriver.Chrome(options=options)

            driver.set_page_load_timeout(30)

            # Navigate to TAD search
            driver.get(self.SEARCH_URL)
            time.sleep(5)  # Wait for Cloudflare

            # Check for Cloudflare challenge
            if "challenge" in driver.page_source.lower():
                logger.info("Waiting for Cloudflare challenge...")
                time.sleep(10)

            # Find and use search form
            try:
                search_input = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text'], input[type='search']"))
                )
                search_input.clear()
                search_input.send_keys(parcel_id)

                search_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit']")
                search_btn.click()
                time.sleep(3)

                return self._parse_selenium_page(config, parcel_id, driver.page_source)

            except Exception as e:
                logger.error(f"Selenium search failed: {e}")
                return None

        finally:
            if driver:
                try:
                    driver.quit()
                except:
                    pass

    def _parse_selenium_page(
        self,
        config: CountyConfig,
        parcel_id: str,
        page_source: str
    ) -> Optional[ParcelInfo]:
        """Parse TAD property page from Selenium"""
        soup = BeautifulSoup(page_source, 'html.parser')

        # Extract data - TAD-specific parsing
        owner = ""
        address = ""
        land_value = 0.0
        bldg_value = 0.0
        total_value = 0.0
        raw_data = {}

        # Look for property details table
        for table in soup.find_all('table'):
            for row in table.find_all('tr'):
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    label = cells[0].get_text(strip=True).lower()
                    value = cells[1].get_text(strip=True)

                    if 'owner' in label:
                        owner = value
                    elif 'address' in label or 'situs' in label:
                        address = value
                    elif 'land' in label and 'value' in label:
                        land_value = self._parse_money(value)
                    elif 'improvement' in label or 'building' in label:
                        bldg_value = self._parse_money(value)
                    elif 'total' in label or 'market' in label:
                        total_value = self._parse_money(value)

                    raw_data[label] = value

        if not owner and not total_value:
            return None

        return ParcelInfo(
            state=config.state,
            county=config.county,
            parcel_id=parcel_id,
            owner_name=owner,
            property_address=address,
            land_value=land_value,
            building_value=bldg_value,
            total_value=total_value,
            raw_data=raw_data,
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
