"""
GEOSHIELD Pipeline Configuration
Central configuration for all data sources, spatial bounds, SAR parameters,
exposure thresholds, and priority index weights.
"""
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
PIPELINE_DIR = BASE_DIR / "pipeline"
CACHE_DIR = PIPELINE_DIR / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

WEB_DATA_DIR = BASE_DIR / "web" / "public" / "data"
WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)

# Study Area Definition
STUDY_AREA_NAME = "Tirunelveli & Thamirabarani Basin, Tamil Nadu"
EVENT_NAME = "Southern Tamil Nadu Extreme Monsoon Deluge"
EVENT_DATE = "December 17-18, 2023"

# Geographic Bounds: [min_lon, min_lat, max_lon, max_lat] in WGS84
BBOX_WGS84 = [77.62, 8.62, 77.82, 8.82]

# Projected Coordinate Reference System (UTM Zone 43N)
# Appropriate for South India (covering longitudes 72E to 78E) for exact metric calculations
CRS_PROJECTED = "EPSG:32643"
CRS_GEOGRAPHIC = "EPSG:4326"

# Pixel resolution for raster analysis (meters)
RASTER_RESOLUTION_M = 10.0

# Sentinel-1 SAR Acquisition Parameters
S1_COLLECTION = "sentinel-1-rtc"
S1_PRE_ID = "S1A_IW_GRDH_1SDV_20231205T004147_20231205T004206_051512_0637C8_rtc"
S1_POST_ID = "S1A_IW_GRDH_1SDV_20231217T004147_20231217T004206_051687_063DE3_rtc"
S1_PRE_DATE = "2023-12-05T00:41:22Z"
S1_POST_DATE = "2023-12-17T00:41:22Z"
S1_ORBIT = 165
S1_PASS = "DESCENDING"
S1_POLARIZATION = "VV"
S1_SENSOR = "Sentinel-1A C-band SAR (5.405 GHz)"

# Flood Detection Thresholds & Rationale
# 1. Speckle Filter: 3x3 median filter reduces radar speckle while preserving sharp water boundaries
SPECKLE_FILTER_SIZE = 3

# 2. Absolute Backscatter Threshold:
# Smooth calm water surfaces reflect radar away specularly, producing VV backscatter <= -16.0 dB.
POST_WATER_THRESHOLD_DB = -16.0

# 3. Change Detection Threshold (Difference in dB):
# Delta dB = Post_dB - Pre_dB. Significant drop indicates transition from land/soil to open flood water.
DELTA_DB_THRESHOLD = -3.0

# 4. Topographic Masking (DEM Slope):
# High slope regions (> 5 degrees) cannot sustain standing flood water and represent radar shadow artifacts.
DEM_COLLECTION = "cop-dem-glo-30"
MAX_SLOPE_DEG = 5.0

# 5. Permanent Water Masking (JRC Global Surface Water):
# Mask pre-existing permanent water bodies (rivers, perennial reservoirs) where occurrence > 50%.
JRC_COLLECTION = "jrc-gsw"
PERMANENT_WATER_OCCURRENCE_PCT = 50.0

# 6. Morphological Sieve (Minimum Connected Patch):
# Discard isolated radar noise clusters smaller than 10 connected pixels (1,000 m2 / 0.1 hectare).
MIN_PATCH_PIXELS = 10

# Exposure & Zonal Partitioning
ZONE_GRID_SIZE_M = 1000.0  # 1 km x 1 km analysis grid

# GeoShield Exposure Priority Index Weights (Sum = 1.0)
WEIGHT_FLOOD = 0.25         # Flooded area share of the zone
WEIGHT_BUILDINGS = 0.25     # Exposed building footprint count
WEIGHT_ROADS = 0.20         # Exposed road network length (km)
WEIGHT_POPULATION = 0.15    # Modelled exposed population proxy
WEIGHT_AGRICULTURE = 0.15   # Inundated cropland area (km2)

# Priority Classes & Cutoffs (Score out of 100)
# Calibrated for multi-criteria linear combination:
PRIORITY_CLASSES = {
    "LOW": (0.0, 10.0, "#22c55e"),         # Green
    "MODERATE": (10.0, 25.0, "#eab308"),   # Amber
    "HIGH": (25.0, 60.0, "#f97316"),       # Orange
    "CRITICAL": (60.0, 100.0, "#ef4444")   # Crimson Red
}
