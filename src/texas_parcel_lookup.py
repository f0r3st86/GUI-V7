"""
Texas Parcel Lookup Module
Provides unified interface for looking up property information by parcel ID

Supported Counties:
- Harris (HCAD) - Direct API access
- Dallas (DCAD) - Bulk data required
- Tarrant (TAD) - Bulk data required

Usage:
    from texas_parcel_lookup import lookup_parcel

    result = lookup_parcel("harris", "1170310000010")
    print(result)
"""

import requests
import json
from typing import Optional, Dict, Any
from dataclasses import dataclass
from urllib.parse import quote


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
    Dallas County (DCAD) parcel lookup

    Status: REQUIRES BULK DATA
    - No public API available
    - Must download and parse bulk CSV files
    - Or use web scraping (complex ASP.NET forms)
    """

    BULK_DATA_URL = "https://www.dallascad.org/DataProducts.aspx"

    def __init__(self, db_path: str = None):
        """
        Initialize Dallas County lookup

        Args:
            db_path: Path to SQLite database with bulk data
                     If None, lookups will fail with instructions
        """
        self.db_path = db_path
        self._db_conn = None

    def lookup(self, parcel_id: str) -> Optional[ParcelInfo]:
        """
        Look up a parcel by ID

        Requires bulk data to be downloaded and loaded first.
        """
        if not self.db_path:
            raise NotImplementedError(
                "Dallas County lookup requires bulk data.\n"
                f"Download from: {self.BULK_DATA_URL}\n"
                "Then load into SQLite and provide db_path."
            )

        # TODO: Implement SQLite lookup when db_path provided
        raise NotImplementedError("SQLite lookup not yet implemented")


class TarrantCountyLookup:
    """
    Tarrant County (TAD) parcel lookup

    Status: REQUIRES BULK DATA
    - Bulk downloads protected by Cloudflare
    - May need browser automation to download
    """

    BULK_DATA_URL = "https://www.tad.org/content/data-download/PropertyData(Delimited).ZIP"

    def __init__(self, db_path: str = None):
        """
        Initialize Tarrant County lookup

        Args:
            db_path: Path to SQLite database with bulk data
        """
        self.db_path = db_path

    def lookup(self, parcel_id: str) -> Optional[ParcelInfo]:
        """
        Look up a parcel by ID

        Requires bulk data to be downloaded and loaded first.
        """
        if not self.db_path:
            raise NotImplementedError(
                "Tarrant County lookup requires bulk data.\n"
                f"Download from: {self.BULK_DATA_URL}\n"
                "(Note: May require browser automation due to Cloudflare)\n"
                "Then load into SQLite and provide db_path."
            )

        # TODO: Implement SQLite lookup when db_path provided
        raise NotImplementedError("SQLite lookup not yet implemented")


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
