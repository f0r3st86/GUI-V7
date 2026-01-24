"""
Base adapter class for parcel lookup platforms.

All platform adapters inherit from this base class, ensuring
consistent interface across different CAD/Assessor systems.
"""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
import time
import logging

from ..core import ParcelInfo, CountyConfig

logger = logging.getLogger(__name__)


class BaseAdapter(ABC):
    """Base class for all platform adapters"""

    def __init__(self):
        self._last_request_time = 0

    def _rate_limit(self, config: CountyConfig) -> None:
        """Enforce rate limiting between requests"""
        elapsed = time.time() - self._last_request_time
        if elapsed < config.rate_limit_seconds:
            time.sleep(config.rate_limit_seconds - elapsed)
        self._last_request_time = time.time()

    @abstractmethod
    def lookup(self, config: CountyConfig, parcel_id: str) -> Optional[ParcelInfo]:
        """
        Look up a parcel by ID.

        Args:
            config: County configuration
            parcel_id: Parcel/account ID

        Returns:
            ParcelInfo object or None if not found
        """
        pass

    def search_by_address(
        self,
        config: CountyConfig,
        street_num: int,
        street_name: str,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """
        Search for parcels by address.

        Args:
            config: County configuration
            street_num: Street number
            street_name: Street name
            limit: Max results

        Returns:
            List of dicts with parcel_id and address

        Raises:
            NotImplementedError: If adapter doesn't support address search
        """
        raise NotImplementedError(
            f"Address search not implemented for {self.__class__.__name__}"
        )

    def search_by_owner(
        self,
        config: CountyConfig,
        owner_name: str,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """
        Search for parcels by owner name.

        Args:
            config: County configuration
            owner_name: Owner name (or partial)
            limit: Max results

        Returns:
            List of dicts with parcel_id, owner, and address

        Raises:
            NotImplementedError: If adapter doesn't support owner search
        """
        raise NotImplementedError(
            f"Owner search not implemented for {self.__class__.__name__}"
        )

    def validate_parcel_id(self, config: CountyConfig, parcel_id: str) -> bool:
        """
        Validate parcel ID format for this platform.

        Args:
            config: County configuration
            parcel_id: Parcel ID to validate

        Returns:
            True if format is valid
        """
        return True  # Default: accept any format

    def _build_parcel_info(
        self,
        config: CountyConfig,
        parcel_id: str,
        data: Dict[str, Any]
    ) -> ParcelInfo:
        """
        Build ParcelInfo from raw data dict.

        Subclasses should override this to map platform-specific
        fields to the standard ParcelInfo structure.
        """
        return ParcelInfo(
            state=config.state,
            county=config.county,
            parcel_id=parcel_id,
            owner_name=data.get("owner_name", ""),
            mailing_address=data.get("mailing_address"),
            property_address=data.get("property_address", ""),
            legal_description=data.get("legal_description"),
            property_class=data.get("property_class"),
            acreage=data.get("acreage"),
            land_value=float(data.get("land_value", 0) or 0),
            building_value=float(data.get("building_value", 0) or 0),
            total_value=float(data.get("total_value", 0) or 0),
            assessed_value=data.get("assessed_value"),
            taxable_value=data.get("taxable_value"),
            tax_year=str(data.get("tax_year", "")),
            tax_amount=data.get("tax_amount"),
            tax_status=data.get("tax_status"),
            source_url=data.get("source_url"),
            raw_data=data,
        )
