"""
True Automation (Harris Govern) Platform Adapter

This single adapter covers 150+ counties across multiple states.
True Automation provides the PropAccess system used by many CADs.

Key insight: All True Automation counties share the same interface,
differentiated only by CAD ID (cid parameter).

URL Pattern: https://propaccess.trueautomation.com/clientdb/?cid={CAD_ID}
"""

import re
import logging
from typing import Optional, List, Dict, Any
from urllib.parse import urlencode, quote

import requests
from bs4 import BeautifulSoup

from ..core import ParcelInfo, CountyConfig
from .base import BaseAdapter

logger = logging.getLogger(__name__)


class TrueAutomationAdapter(BaseAdapter):
    """
    Adapter for True Automation PropAccess platform.

    Coverage: ~150+ counties primarily in Texas, also other states.
    One adapter handles all counties - just need CAD ID config.
    """

    BASE_URL = "https://propaccess.trueautomation.com"

    def __init__(self):
        super().__init__()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def lookup(self, config: CountyConfig, parcel_id: str) -> Optional[ParcelInfo]:
        """Look up parcel by ID on True Automation platform"""
        self._rate_limit(config)

        if not config.cad_id:
            raise ValueError(f"CAD ID required for True Automation lookup: {config.county}")

        # Search for the parcel
        search_url = f"{self.BASE_URL}/clientdb/PropertySearch.aspx"
        params = {
            "cid": config.cad_id,
        }

        try:
            # First get the search page to extract ViewState
            response = self.session.get(search_url, params=params, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            viewstate = self._extract_viewstate(soup)

            if not viewstate:
                logger.error(f"Could not extract ViewState for {config.county}")
                return None

            # Submit search form
            form_data = {
                "__VIEWSTATE": viewstate.get("__VIEWSTATE", ""),
                "__VIEWSTATEGENERATOR": viewstate.get("__VIEWSTATEGENERATOR", ""),
                "__EVENTVALIDATION": viewstate.get("__EVENTVALIDATION", ""),
                "txtQuickRef": parcel_id,
                "cmdQuickRef": "Quick Ref ID",
            }

            search_response = self.session.post(
                search_url,
                params=params,
                data=form_data,
                timeout=30
            )
            search_response.raise_for_status()

            # Check if we got redirected to property detail or search results
            if "Property.aspx" in search_response.url:
                # Direct hit - parse property page
                return self._parse_property_page(config, parcel_id, search_response.text)
            elif "PropertySearchResults.aspx" in search_response.url:
                # Multiple results - try to find exact match
                return self._handle_search_results(config, parcel_id, search_response.text)
            else:
                # Check if property info is on the current page
                return self._parse_property_page(config, parcel_id, search_response.text)

        except requests.RequestException as e:
            logger.error(f"Request failed for {config.county}: {e}")
            return None
        except Exception as e:
            logger.error(f"Lookup failed for {config.county}: {e}")
            return None

    def _extract_viewstate(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract ASP.NET ViewState fields from page"""
        result = {}
        for field in ["__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION"]:
            element = soup.find("input", {"name": field})
            if element:
                result[field] = element.get("value", "")
        return result

    def _handle_search_results(
        self,
        config: CountyConfig,
        parcel_id: str,
        html: str
    ) -> Optional[ParcelInfo]:
        """Handle search results page - find exact match and follow link"""
        soup = BeautifulSoup(html, "html.parser")

        # Look for property links in results table
        results_table = soup.find("table", {"id": "propertySearchResults_datatablesearchresults"})
        if not results_table:
            results_table = soup.find("table", class_=re.compile(r"search.*results", re.I))

        if results_table:
            for row in results_table.find_all("tr"):
                cells = row.find_all("td")
                if cells:
                    # First cell usually contains property ID link
                    link = cells[0].find("a")
                    if link and parcel_id.lower() in link.get_text().lower():
                        href = link.get("href")
                        if href:
                            return self._fetch_property_detail(config, parcel_id, href)

        logger.warning(f"No exact match found for {parcel_id} in {config.county}")
        return None

    def _fetch_property_detail(
        self,
        config: CountyConfig,
        parcel_id: str,
        href: str
    ) -> Optional[ParcelInfo]:
        """Fetch and parse property detail page"""
        if not href.startswith("http"):
            href = f"{self.BASE_URL}/clientdb/{href}"

        try:
            response = self.session.get(href, timeout=30)
            response.raise_for_status()
            return self._parse_property_page(config, parcel_id, response.text)
        except Exception as e:
            logger.error(f"Failed to fetch property detail: {e}")
            return None

    def _parse_property_page(
        self,
        config: CountyConfig,
        parcel_id: str,
        html: str
    ) -> Optional[ParcelInfo]:
        """Parse property detail page"""
        soup = BeautifulSoup(html, "html.parser")

        # Initialize data dict
        data = {
            "source_url": f"{self.BASE_URL}/clientdb/?cid={config.cad_id}"
        }

        # Extract property ID (may differ from search ID)
        prop_id = self._find_field(soup, ["Quick Ref ID", "Property ID", "Account", "Geo ID"])
        if prop_id:
            parcel_id = prop_id

        # Owner information
        data["owner_name"] = self._find_field(soup, ["Owner Name", "Owner", "Property Owner"]) or ""

        # Mailing address
        mail_parts = []
        for field in ["Mailing Address", "Mail Address", "Owner Address"]:
            val = self._find_field(soup, [field])
            if val:
                mail_parts.append(val)
        data["mailing_address"] = ", ".join(mail_parts) if mail_parts else None

        # Property address
        data["property_address"] = self._find_field(soup, [
            "Property Address", "Situs Address", "Location", "Address"
        ]) or ""

        # Legal description
        data["legal_description"] = self._find_field(soup, [
            "Legal Description", "Legal", "Description"
        ])

        # Property class
        data["property_class"] = self._find_field(soup, [
            "Property Type", "Type", "Class", "Use Code"
        ])

        # Acreage
        acreage_str = self._find_field(soup, ["Acres", "Acreage", "Land Area"])
        if acreage_str:
            try:
                data["acreage"] = float(re.sub(r"[^\d.]", "", acreage_str))
            except ValueError:
                pass

        # Values
        data["land_value"] = self._parse_currency(
            self._find_field(soup, ["Land Value", "Land Mkt Value", "Land Market"])
        )
        data["building_value"] = self._parse_currency(
            self._find_field(soup, ["Improvement Value", "Impr Value", "Building Value", "Impr Mkt Value"])
        )
        data["total_value"] = self._parse_currency(
            self._find_field(soup, ["Total Value", "Market Value", "Total Mkt Value", "Appraised Value"])
        )
        data["assessed_value"] = self._parse_currency(
            self._find_field(soup, ["Assessed Value", "Assessed"])
        )
        data["taxable_value"] = self._parse_currency(
            self._find_field(soup, ["Taxable Value", "Taxable"])
        )

        # Tax year
        data["tax_year"] = self._find_field(soup, ["Tax Year", "Year"]) or ""

        # Tax amount
        data["tax_amount"] = self._parse_currency(
            self._find_field(soup, ["Total Tax", "Tax Amount", "Taxes"])
        )

        # Validate we got something useful
        if not data.get("owner_name") and not data.get("total_value"):
            logger.warning(f"No data found for {parcel_id} in {config.county}")
            return None

        return self._build_parcel_info(config, parcel_id, data)

    def _find_field(self, soup: BeautifulSoup, labels: List[str]) -> Optional[str]:
        """Find field value by label text"""
        for label in labels:
            # Try finding by label text
            label_elem = soup.find(string=re.compile(rf"^\s*{re.escape(label)}\s*:?\s*$", re.I))
            if label_elem:
                parent = label_elem.parent
                if parent:
                    # Check for adjacent element or next sibling
                    next_elem = parent.find_next_sibling()
                    if next_elem:
                        text = next_elem.get_text(strip=True)
                        if text:
                            return text

                    # Check parent's next sibling
                    parent_next = parent.parent.find_next_sibling() if parent.parent else None
                    if parent_next:
                        text = parent_next.get_text(strip=True)
                        if text:
                            return text

            # Try finding by ID pattern
            for elem in soup.find_all(id=re.compile(rf".*{label.replace(' ', '')}.*", re.I)):
                text = elem.get_text(strip=True)
                if text and text.lower() != label.lower():
                    return text

            # Try table row pattern
            for row in soup.find_all("tr"):
                cells = row.find_all(["td", "th"])
                for i, cell in enumerate(cells):
                    if label.lower() in cell.get_text().lower():
                        if i + 1 < len(cells):
                            return cells[i + 1].get_text(strip=True)

        return None

    def _parse_currency(self, value: Optional[str]) -> float:
        """Parse currency string to float"""
        if not value:
            return 0.0
        try:
            cleaned = re.sub(r"[^\d.]", "", value)
            return float(cleaned) if cleaned else 0.0
        except ValueError:
            return 0.0

    def search_by_owner(
        self,
        config: CountyConfig,
        owner_name: str,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """Search for parcels by owner name"""
        self._rate_limit(config)

        if not config.cad_id:
            raise ValueError(f"CAD ID required for True Automation: {config.county}")

        search_url = f"{self.BASE_URL}/clientdb/PropertySearch.aspx"
        params = {"cid": config.cad_id}

        try:
            # Get search page
            response = self.session.get(search_url, params=params, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            viewstate = self._extract_viewstate(soup)

            # Submit owner search
            form_data = {
                "__VIEWSTATE": viewstate.get("__VIEWSTATE", ""),
                "__VIEWSTATEGENERATOR": viewstate.get("__VIEWSTATEGENERATOR", ""),
                "__EVENTVALIDATION": viewstate.get("__EVENTVALIDATION", ""),
                "txtOwnerName": owner_name,
                "cmdOwnerName": "Owner Name",
            }

            search_response = self.session.post(
                search_url,
                params=params,
                data=form_data,
                timeout=30
            )
            search_response.raise_for_status()

            return self._parse_search_results(search_response.text, limit)

        except Exception as e:
            logger.error(f"Owner search failed for {config.county}: {e}")
            return []

    def search_by_address(
        self,
        config: CountyConfig,
        street_num: int,
        street_name: str,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """Search for parcels by address"""
        self._rate_limit(config)

        if not config.cad_id:
            raise ValueError(f"CAD ID required for True Automation: {config.county}")

        search_url = f"{self.BASE_URL}/clientdb/PropertySearch.aspx"
        params = {"cid": config.cad_id}

        try:
            # Get search page
            response = self.session.get(search_url, params=params, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            viewstate = self._extract_viewstate(soup)

            # Submit address search
            form_data = {
                "__VIEWSTATE": viewstate.get("__VIEWSTATE", ""),
                "__VIEWSTATEGENERATOR": viewstate.get("__VIEWSTATEGENERATOR", ""),
                "__EVENTVALIDATION": viewstate.get("__EVENTVALIDATION", ""),
                "txtStreetNumber": str(street_num),
                "txtStreetName": street_name,
                "cmdStreetName": "Address",
            }

            search_response = self.session.post(
                search_url,
                params=params,
                data=form_data,
                timeout=30
            )
            search_response.raise_for_status()

            return self._parse_search_results(search_response.text, limit)

        except Exception as e:
            logger.error(f"Address search failed for {config.county}: {e}")
            return []

    def _parse_search_results(self, html: str, limit: int) -> List[Dict[str, str]]:
        """Parse search results page"""
        soup = BeautifulSoup(html, "html.parser")
        results = []

        # Find results table
        table = soup.find("table", {"id": re.compile(r".*searchresults.*", re.I)})
        if not table:
            table = soup.find("table", class_=re.compile(r".*results.*", re.I))

        if table:
            rows = table.find_all("tr")[1:]  # Skip header
            for row in rows[:limit]:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    link = cells[0].find("a")
                    results.append({
                        "parcel_id": link.get_text(strip=True) if link else cells[0].get_text(strip=True),
                        "owner": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "address": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                    })

        return results
