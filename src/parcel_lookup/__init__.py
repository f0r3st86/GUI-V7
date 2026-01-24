"""
US Property Parcel Lookup Framework

Scalable architecture for automated property tax lookups across US counties.

Architecture:
- Platform Adapters: One adapter per vendor (covers 100s of counties each)
- County Registry: Maps county -> platform + config
- Standardized Output: ParcelInfo dataclass

Supported Platforms:
- TrueAutomation (Harris Govern): ~150+ counties in TX, other states
- ArcGIS REST: Counties with Esri GIS portals
- Custom Scrapers: Large counties with proprietary systems

Usage:
    from parcel_lookup import lookup_parcel, get_supported_counties

    # Lookup by county name
    result = lookup_parcel("harris", "TX", "1170310000010")

    # Get all supported counties
    counties = get_supported_counties("TX")
"""

from .core import ParcelInfo, lookup_parcel, get_supported_counties
from .registry import COUNTY_REGISTRY, register_county, get_county_config

__version__ = "0.1.0"
__all__ = [
    "ParcelInfo",
    "lookup_parcel",
    "get_supported_counties",
    "COUNTY_REGISTRY",
    "register_county",
    "get_county_config",
]
