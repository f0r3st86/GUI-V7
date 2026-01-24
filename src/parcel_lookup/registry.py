"""
County Registry - Maps counties to their platform configurations.

This is the central database of supported counties. Adding a new county
is as simple as adding an entry here with the correct platform config.
"""

from typing import Optional, Dict
from .core import CountyConfig, Platform


# Global registry: key = "county_state" lowercase
COUNTY_REGISTRY: Dict[str, CountyConfig] = {}


def _key(county: str, state: str) -> str:
    """Generate registry key"""
    return f"{county.lower().strip()}_{state.upper().strip()}"


def register_county(config: CountyConfig) -> None:
    """Register a county configuration"""
    key = _key(config.county, config.state)
    COUNTY_REGISTRY[key] = config


def get_county_config(county: str, state: str) -> Optional[CountyConfig]:
    """Get configuration for a county"""
    key = _key(county, state)
    return COUNTY_REGISTRY.get(key)


# =============================================================================
# TEXAS COUNTIES
# =============================================================================

# Tier 1: Direct API / Bulk Data (Largest counties)
register_county(CountyConfig(
    state="TX",
    county="Harris",
    platform=Platform.ARCGIS_REST,
    base_url="https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0",
    parcel_id_field="acct_num",
    extra={"fields": [
        "acct_num", "owner_name_1", "owner_name_2",
        "site_str_num", "site_str_name", "site_city", "site_zip",
        "mail_addr_1", "mail_city", "mail_state", "mail_zip",
        "land_value", "bld_value", "total_market_val",
        "tax_year", "legal_dscr_1", "Acreage", "state_class"
    ]}
))

register_county(CountyConfig(
    state="TX",
    county="Dallas",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://www.dallascad.org",
    extra={"scraper_class": "DallasCountyScraper"}
))

register_county(CountyConfig(
    state="TX",
    county="Tarrant",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://www.tad.org",
    requires_selenium=True,
    extra={"scraper_class": "TarrantCountyScraper"}
))

# Tier 2: True Automation Platform (~100 counties)
# One adapter handles all of these - just need CAD ID

TRUE_AUTOMATION_TEXAS = {
    # Verified CAD IDs
    "Bexar": 110,
    "Collin": 111,
    "Denton": 19,
    "Burnet": 85,
    "Cass": 3,
    "Comal": 56,
    "Cooke": 107,
    "Guadalupe": 2,
    "Hale": 41,
    "Hill": 32,
    "San Jacinto": 22,
    "Swisher": 54,
    "Wilson": 27,
    # Add more as discovered
    "Anderson": 4,
    "Angelina": 5,
    "Aransas": 6,
    "Archer": 7,
    "Atascosa": 8,
    "Austin": 9,
    "Bandera": 10,
    "Bastrop": 11,
    "Baylor": 12,
    "Bee": 13,
    "Bell": 14,
    "Blanco": 15,
    "Bosque": 16,
    "Bowie": 17,
    "Brazoria": 18,
    "Brazos": 20,
    "Brown": 21,
    "Burleson": 23,
    "Caldwell": 24,
    "Calhoun": 25,
    "Callahan": 26,
    "Cameron": 28,
    "Camp": 29,
    "Carson": 30,
    "Castro": 31,
    "Chambers": 33,
    "Cherokee": 34,
    "Childress": 35,
    "Clay": 36,
    "Cochran": 37,
    "Coke": 38,
    "Coleman": 39,
    "Colorado": 40,
    "Comanche": 42,
    "Concho": 43,
    "Coryell": 44,
    "Cottle": 45,
    "Crane": 46,
    "Crockett": 47,
    "Crosby": 48,
    "Culberson": 49,
    "Dallam": 50,
    "Dawson": 51,
    "DeWitt": 52,
    "Deaf Smith": 53,
    "Delta": 55,
    "Dickens": 57,
    "Dimmit": 58,
    "Donley": 59,
    "Duval": 60,
    "Eastland": 61,
    "Ector": 62,
    "Edwards": 63,
    "Ellis": 64,
    "Erath": 65,
    "Falls": 66,
    "Fannin": 67,
    "Fayette": 68,
    "Fisher": 69,
    "Floyd": 70,
    "Foard": 71,
    "Fort Bend": 72,
    "Franklin": 73,
    "Freestone": 74,
    "Frio": 75,
    "Gaines": 76,
    "Galveston": 77,
    "Garza": 78,
    "Gillespie": 79,
    "Glasscock": 80,
    "Goliad": 81,
    "Gonzales": 82,
    "Gray": 83,
    "Grayson": 84,
    "Gregg": 86,
    "Grimes": 87,
    "Hamilton": 88,
    "Hansford": 89,
    "Hardeman": 90,
    "Hardin": 91,
    "Harrison": 92,
    "Hartley": 93,
    "Haskell": 94,
    "Hays": 95,
    "Hemphill": 96,
    "Henderson": 97,
    "Hidalgo": 98,
    "Hockley": 99,
    "Hood": 100,
    "Hopkins": 101,
    "Houston": 102,
    "Howard": 103,
    "Hudspeth": 104,
    "Hunt": 105,
    "Hutchinson": 106,
    "Irion": 108,
    "Jack": 109,
}

for county, cad_id in TRUE_AUTOMATION_TEXAS.items():
    # Skip counties already registered with other platforms
    if _key(county, "TX") in COUNTY_REGISTRY:
        continue

    register_county(CountyConfig(
        state="TX",
        county=county,
        platform=Platform.TRUE_AUTOMATION,
        base_url="https://propaccess.trueautomation.com",
        cad_id=cad_id,
        rate_limit_seconds=2.0,  # Be respectful
    ))


# =============================================================================
# FLORIDA COUNTIES (Example expansion)
# =============================================================================

# Florida uses different platforms - mostly custom county systems
# Many have ArcGIS portals

register_county(CountyConfig(
    state="FL",
    county="Miami-Dade",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://www.miamidade.gov/pa/",
    extra={"scraper_class": "MiamiDadeCountyScraper"}
))

register_county(CountyConfig(
    state="FL",
    county="Broward",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://web.bcpa.net/",
    extra={"scraper_class": "BrowardCountyScraper"}
))

register_county(CountyConfig(
    state="FL",
    county="Palm Beach",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://www.pbcgov.org/papa/",
    extra={"scraper_class": "PalmBeachCountyScraper"}
))

register_county(CountyConfig(
    state="FL",
    county="Hillsborough",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://www.hcpafl.org/",
    extra={"scraper_class": "HillsboroughCountyScraper"}
))

register_county(CountyConfig(
    state="FL",
    county="Orange",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://www.ocpafl.org/",
    extra={"scraper_class": "OrangeCountyScraper"}
))


# =============================================================================
# CALIFORNIA COUNTIES (Example expansion)
# =============================================================================

register_county(CountyConfig(
    state="CA",
    county="Los Angeles",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://assessor.lacounty.gov/",
    extra={"scraper_class": "LosAngelesCountyScraper"}
))

register_county(CountyConfig(
    state="CA",
    county="San Diego",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://arcc.sdcounty.ca.gov/",
    extra={"scraper_class": "SanDiegoCountyScraper"}
))

register_county(CountyConfig(
    state="CA",
    county="Orange",
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://ocgov.com/gov/assessor/",
    extra={"scraper_class": "OrangeCACountyScraper"}
))


# =============================================================================
# NEW YORK
# =============================================================================

register_county(CountyConfig(
    state="NY",
    county="New York",  # Manhattan
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://www.nyc.gov/site/finance/property/property.page",
    extra={"scraper_class": "NYCPropertyScraper", "borough": "manhattan"}
))

register_county(CountyConfig(
    state="NY",
    county="Kings",  # Brooklyn
    platform=Platform.CUSTOM_SCRAPER,
    base_url="https://www.nyc.gov/site/finance/property/property.page",
    extra={"scraper_class": "NYCPropertyScraper", "borough": "brooklyn"}
))


# =============================================================================
# STATISTICS
# =============================================================================

def get_registry_stats() -> Dict[str, int]:
    """Get statistics about registered counties"""
    stats = {
        "total_counties": len(COUNTY_REGISTRY),
        "by_state": {},
        "by_platform": {},
    }

    for config in COUNTY_REGISTRY.values():
        # By state
        stats["by_state"][config.state] = stats["by_state"].get(config.state, 0) + 1
        # By platform
        platform = config.platform.value
        stats["by_platform"][platform] = stats["by_platform"].get(platform, 0) + 1

    return stats


if __name__ == "__main__":
    stats = get_registry_stats()
    print(f"Total counties registered: {stats['total_counties']}")
    print("\nBy State:")
    for state, count in sorted(stats["by_state"].items()):
        print(f"  {state}: {count}")
    print("\nBy Platform:")
    for platform, count in sorted(stats["by_platform"].items(), key=lambda x: -x[1]):
        print(f"  {platform}: {count}")
