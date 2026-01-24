"""
ArcGIS REST API Adapter

Many counties use Esri's ArcGIS platform for GIS/parcel data.
This adapter provides a standard interface to ArcGIS REST services.

Verified working:
- Harris County, TX (HCAD) - 2025 data confirmed
"""

import re
import logging
from typing import Optional, List, Dict, Any
from urllib.parse import urlencode, quote

import requests

from ..core import ParcelInfo, CountyConfig
from .base import BaseAdapter

logger = logging.getLogger(__name__)


class ArcGISAdapter(BaseAdapter):
    """
    Adapter for ArcGIS REST API services.

    Many counties publish parcel data through ArcGIS servers.
    This adapter handles the standard ArcGIS query interface.
    """

    def __init__(self):
        super().__init__()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def lookup(self, config: CountyConfig, parcel_id: str) -> Optional[ParcelInfo]:
        """Look up parcel by ID using ArcGIS REST API"""
        self._rate_limit(config)

        if not config.base_url:
            raise ValueError(f"Base URL required for ArcGIS lookup: {config.county}")

        # Build query URL
        query_url = f"{config.base_url}/query"

        # Determine the field to search
        id_field = config.parcel_id_field or "PARCEL_ID"

        params = {
            "where": f"{id_field} LIKE '{parcel_id}'",
            "outFields": "*",
            "returnGeometry": "false",
            "f": "json",
        }

        try:
            response = self.session.get(query_url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            if "error" in data:
                logger.error(f"ArcGIS error for {config.county}: {data['error']}")
                return None

            features = data.get("features", [])
            if not features:
                logger.info(f"No results for parcel {parcel_id} in {config.county}")
                return None

            # Take first result
            attributes = features[0].get("attributes", {})

            return self._build_from_arcgis(config, parcel_id, attributes)

        except requests.RequestException as e:
            logger.error(f"Request failed for {config.county}: {e}")
            return None
        except Exception as e:
            logger.error(f"Lookup failed for {config.county}: {e}")
            return None

    def _build_from_arcgis(
        self,
        config: CountyConfig,
        parcel_id: str,
        attrs: Dict[str, Any]
    ) -> ParcelInfo:
        """Build ParcelInfo from ArcGIS attributes"""

        # Common field mappings (case-insensitive search)
        def find_attr(patterns: List[str]) -> Any:
            """Find attribute by pattern matching"""
            for pattern in patterns:
                for key, value in attrs.items():
                    if re.match(pattern, key, re.I):
                        return value
            return None

        # Get actual parcel ID from response
        actual_id = find_attr([
            r"acct.*num", r"parcel.*id", r"account", r"pin", r"apn"
        ]) or parcel_id

        # Build owner name
        owner_parts = []
        for i in range(1, 4):
            owner = find_attr([rf"owner.*name.*{i}", rf"owner.*{i}", rf"owner{i}"])
            if owner:
                owner_parts.append(str(owner).strip())
        owner_name = " / ".join(owner_parts) if owner_parts else find_attr([
            r"owner.*name", r"owner"
        ]) or ""

        # Build mailing address
        mail_parts = []
        mail_addr = find_attr([r"mail.*addr", r"mail.*str"])
        if mail_addr:
            mail_parts.append(str(mail_addr).strip())
        mail_city = find_attr([r"mail.*city"])
        mail_state = find_attr([r"mail.*state"])
        mail_zip = find_attr([r"mail.*zip"])
        if mail_city or mail_state or mail_zip:
            mail_parts.append(
                f"{mail_city or ''}, {mail_state or ''} {mail_zip or ''}".strip()
            )
        mailing_address = ", ".join(mail_parts) if mail_parts else None

        # Build property address
        addr_parts = []
        site_num = find_attr([r"site.*str.*num", r"site.*num", r"str.*num", r"addr.*num"])
        site_name = find_attr([r"site.*str.*name", r"site.*name", r"str.*name", r"addr.*str"])
        if site_num:
            addr_parts.append(str(int(site_num)) if isinstance(site_num, float) else str(site_num))
        if site_name:
            addr_parts.append(str(site_name).strip())
        site_city = find_attr([r"site.*city", r"city"])
        site_zip = find_attr([r"site.*zip", r"zip"])
        if addr_parts:
            property_address = " ".join(addr_parts)
            if site_city:
                property_address += f", {site_city}"
            if site_zip:
                property_address += f" {site_zip}"
        else:
            property_address = find_attr([r"address", r"situs"]) or ""

        # Values
        land_value = self._to_float(find_attr([r"land.*val", r"land.*mkt"]))
        building_value = self._to_float(find_attr([
            r"bld.*val", r"impr.*val", r"building.*val", r"improvement.*val"
        ]))
        total_value = self._to_float(find_attr([
            r"total.*market.*val", r"total.*val", r"market.*val", r"appraised.*val"
        ]))

        # If total not found, calculate from land + building
        if not total_value and (land_value or building_value):
            total_value = land_value + building_value

        # Other fields
        legal_desc = find_attr([r"legal.*dscr", r"legal.*desc", r"legal"])
        acreage = self._to_float(find_attr([r"acreage", r"acres", r"land.*area"]))
        property_class = find_attr([r"state.*class", r"class", r"type", r"use.*code"])
        tax_year = find_attr([r"tax.*year", r"year"])

        return ParcelInfo(
            state=config.state,
            county=config.county,
            parcel_id=str(actual_id),
            owner_name=str(owner_name),
            mailing_address=mailing_address,
            property_address=property_address,
            legal_description=str(legal_desc) if legal_desc else None,
            property_class=str(property_class) if property_class else None,
            acreage=acreage if acreage else None,
            land_value=land_value,
            building_value=building_value,
            total_value=total_value,
            tax_year=str(tax_year) if tax_year else "",
            source_url=config.base_url,
            raw_data=attrs,
        )

    def _to_float(self, value: Any) -> float:
        """Convert value to float safely"""
        if value is None:
            return 0.0
        try:
            if isinstance(value, (int, float)):
                return float(value)
            cleaned = re.sub(r"[^\d.]", "", str(value))
            return float(cleaned) if cleaned else 0.0
        except (ValueError, TypeError):
            return 0.0

    def search_by_address(
        self,
        config: CountyConfig,
        street_num: int,
        street_name: str,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """Search for parcels by address using ArcGIS"""
        self._rate_limit(config)

        if not config.base_url:
            raise ValueError(f"Base URL required for ArcGIS: {config.county}")

        query_url = f"{config.base_url}/query"

        # Build where clause - try common field names
        where_clause = (
            f"(site_str_num = {street_num} OR addr_num = {street_num}) "
            f"AND (site_str_name LIKE '%{street_name.upper()}%' "
            f"OR addr_str LIKE '%{street_name.upper()}%')"
        )

        params = {
            "where": where_clause,
            "outFields": "*",
            "returnGeometry": "false",
            "resultRecordCount": limit,
            "f": "json",
        }

        try:
            response = self.session.get(query_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            results = []
            for feature in data.get("features", [])[:limit]:
                attrs = feature.get("attributes", {})
                parcel_id = (
                    attrs.get("acct_num") or
                    attrs.get("parcel_id") or
                    attrs.get("PARCEL_ID") or
                    "Unknown"
                )
                results.append({
                    "parcel_id": str(parcel_id),
                    "address": self._format_address(attrs),
                    "owner": attrs.get("owner_name_1", attrs.get("owner", "")),
                })

            return results

        except Exception as e:
            logger.error(f"Address search failed for {config.county}: {e}")
            return []

    def _format_address(self, attrs: Dict[str, Any]) -> str:
        """Format address from attributes"""
        parts = []
        num = attrs.get("site_str_num") or attrs.get("addr_num")
        name = attrs.get("site_str_name") or attrs.get("addr_str")
        city = attrs.get("site_city") or attrs.get("city")

        if num:
            parts.append(str(int(num)) if isinstance(num, float) else str(num))
        if name:
            parts.append(str(name))
        if city:
            parts.append(str(city))

        return " ".join(parts)

    def get_service_info(self, config: CountyConfig) -> Dict[str, Any]:
        """Get ArcGIS service metadata"""
        if not config.base_url:
            return {}

        try:
            response = self.session.get(
                config.base_url,
                params={"f": "json"},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get service info: {e}")
            return {}

    def get_available_fields(self, config: CountyConfig) -> List[str]:
        """Get list of available fields from service"""
        info = self.get_service_info(config)
        fields = info.get("fields", [])
        return [f.get("name", "") for f in fields]
