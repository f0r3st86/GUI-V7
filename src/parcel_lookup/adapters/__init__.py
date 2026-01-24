"""
Platform Adapters for Parcel Lookup

Each adapter handles a specific platform/vendor that serves multiple counties.
This architecture maximizes coverage with minimal code:

- TrueAutomationAdapter: ~150+ counties (one adapter, many CAD IDs)
- ArcGISAdapter: Counties with Esri GIS portals
- CustomScraperAdapter: Large counties with proprietary systems

Usage:
    from parcel_lookup.adapters import get_adapter
    from parcel_lookup.core import Platform

    adapter = get_adapter(Platform.TRUE_AUTOMATION)
    result = adapter.lookup(config, parcel_id)
"""

from typing import Dict

from ..core import Platform
from .base import BaseAdapter
from .true_automation import TrueAutomationAdapter
from .arcgis import ArcGISAdapter
from .custom_scrapers import CustomScraperAdapter


# Singleton adapter instances
_adapters: Dict[Platform, BaseAdapter] = {}


def get_adapter(platform: Platform) -> BaseAdapter:
    """
    Get adapter instance for a platform.

    Adapters are singletons - one instance handles all counties
    using that platform.

    Args:
        platform: Platform enum value

    Returns:
        Adapter instance

    Raises:
        ValueError: If platform not supported
    """
    if platform not in _adapters:
        _adapters[platform] = _create_adapter(platform)

    return _adapters[platform]


def _create_adapter(platform: Platform) -> BaseAdapter:
    """Create adapter instance for platform"""
    adapter_map = {
        Platform.TRUE_AUTOMATION: TrueAutomationAdapter,
        Platform.ARCGIS_REST: ArcGISAdapter,
        Platform.CUSTOM_SCRAPER: CustomScraperAdapter,
    }

    adapter_class = adapter_map.get(platform)
    if not adapter_class:
        raise ValueError(
            f"No adapter available for platform: {platform.value}\n"
            f"Supported platforms: {list(adapter_map.keys())}"
        )

    return adapter_class()


__all__ = [
    "get_adapter",
    "BaseAdapter",
    "TrueAutomationAdapter",
    "ArcGISAdapter",
    "CustomScraperAdapter",
]
