"""
Core classes and functions for parcel lookup framework.
"""

from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any, List
from enum import Enum


class Platform(Enum):
    """Supported CAD/Assessor platforms"""
    TRUE_AUTOMATION = "true_automation"  # Harris Govern - 150+ counties
    ARCGIS_REST = "arcgis_rest"          # Esri ArcGIS - many counties
    TYLER_EAGLE = "tyler_eagle"          # Tyler Technologies
    AUMENTUM = "aumentum"                 # Aumentum/Thomson Reuters
    CUSTOM_SCRAPER = "custom_scraper"    # County-specific scrapers
    BULK_DATA = "bulk_data"              # Downloaded bulk files


@dataclass
class ParcelInfo:
    """Standardized parcel information - same structure for all counties"""

    # Location
    state: str
    county: str
    parcel_id: str

    # Owner
    owner_name: str
    mailing_address: Optional[str] = None

    # Property
    property_address: str = ""
    legal_description: Optional[str] = None
    property_class: Optional[str] = None
    acreage: Optional[float] = None

    # Values
    land_value: float = 0.0
    building_value: float = 0.0
    total_value: float = 0.0
    assessed_value: Optional[float] = None
    taxable_value: Optional[float] = None

    # Tax Info
    tax_year: str = ""
    tax_amount: Optional[float] = None
    tax_status: Optional[str] = None  # Current, Delinquent, etc.

    # Metadata
    source_url: Optional[str] = None
    raw_data: Dict[str, Any] = None

    def __post_init__(self):
        if self.raw_data is None:
            self.raw_data = {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)

    def __str__(self) -> str:
        return (
            f"{self.county} County, {self.state}\n"
            f"Parcel: {self.parcel_id}\n"
            f"Owner: {self.owner_name}\n"
            f"Address: {self.property_address}\n"
            f"Value: ${self.total_value:,.0f}"
        )


@dataclass
class CountyConfig:
    """Configuration for a county's parcel lookup"""
    state: str
    county: str
    platform: Platform

    # Platform-specific config
    base_url: Optional[str] = None
    cad_id: Optional[int] = None           # For True Automation
    arcgis_layer: Optional[int] = None     # For ArcGIS
    parcel_id_field: Optional[str] = None  # Field name for parcel ID

    # Lookup behavior
    requires_selenium: bool = False
    rate_limit_seconds: float = 1.0

    # Additional config
    extra: Dict[str, Any] = None

    def __post_init__(self):
        if self.extra is None:
            self.extra = {}


def lookup_parcel(county: str, state: str, parcel_id: str) -> Optional[ParcelInfo]:
    """
    Look up a parcel by county, state, and parcel ID.

    Args:
        county: County name (e.g., "harris", "los angeles")
        state: Two-letter state code (e.g., "TX", "CA")
        parcel_id: Parcel/account ID

    Returns:
        ParcelInfo object or None if not found

    Raises:
        ValueError: If county/state not supported
    """
    from .registry import get_county_config
    from .adapters import get_adapter

    config = get_county_config(county, state)
    if not config:
        raise ValueError(f"County '{county}, {state}' not supported")

    adapter = get_adapter(config.platform)
    return adapter.lookup(config, parcel_id)


def get_supported_counties(state: str = None) -> List[Dict[str, str]]:
    """
    Get list of supported counties.

    Args:
        state: Optional state filter (two-letter code)

    Returns:
        List of dicts with county, state, platform info
    """
    from .registry import COUNTY_REGISTRY

    results = []
    for key, config in COUNTY_REGISTRY.items():
        if state and config.state.upper() != state.upper():
            continue
        results.append({
            "county": config.county,
            "state": config.state,
            "platform": config.platform.value,
        })

    return sorted(results, key=lambda x: (x["state"], x["county"]))


def search_by_address(
    county: str,
    state: str,
    street_num: int,
    street_name: str,
    limit: int = 10
) -> List[Dict[str, str]]:
    """
    Search for parcels by address.

    Args:
        county: County name
        state: Two-letter state code
        street_num: Street number
        street_name: Street name
        limit: Max results

    Returns:
        List of dicts with parcel_id and address
    """
    from .registry import get_county_config
    from .adapters import get_adapter

    config = get_county_config(county, state)
    if not config:
        raise ValueError(f"County '{county}, {state}' not supported")

    adapter = get_adapter(config.platform)
    if hasattr(adapter, 'search_by_address'):
        return adapter.search_by_address(config, street_num, street_name, limit)

    raise NotImplementedError(f"Address search not supported for {config.platform.value}")
