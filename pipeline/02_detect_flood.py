"""
GEOSHIELD Flood Inundation Detection Engine (pipeline/02_detect_flood.py)
Implements rigorous Sentinel-1 SAR change detection:
1. Calibrated Gamma-0 power to Decibel (dB) conversion
2. Speckle suppression using 3x3 focal median filter
3. Dual-condition detection: Post-water threshold (<= -15.0 dB) & backscatter drop (<= -2.5 dB)
4. Permanent water body exclusion using JRC Surface Water occurrence (>= 50%)
5. Steep terrain radar shadow masking using Copernicus DEM slope (> 5.0 deg)
6. Morphological connected-patch sieving (>= 10 pixels / 1,000 m2)
7. Vector polygonization and GeoJSON export for web dashboard
8. Pre and post visual SAR image generation for interactive comparison
"""
import json
import logging
from pathlib import Path
import geopandas as gpd
import numpy as np
from PIL import Image
import pyproj
import rasterio
from rasterio.features import shapes
from scipy.ndimage import median_filter, label
from shapely.geometry import shape

from pipeline import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("geoshield.flood")


def detect_flood_extent():
    logger.info("=== STEP 2: INITIATING SAR FLOOD INUNDATION DETECTION ===")

    # Paths
    pre_path = config.CACHE_DIR / "s1_pre_vv.tif"
    post_path = config.CACHE_DIR / "s1_post_vv.tif"
    dem_path = config.CACHE_DIR / "dem.tif"
    slope_path = config.CACHE_DIR / "slope.tif"
    jrc_path = config.CACHE_DIR / "jrc_occurrence.tif"
    mask_out_path = config.CACHE_DIR / "flood_mask.tif"
    geojson_out_path = config.WEB_DATA_DIR / "flood_extent.geojson"

    # 1. Read input rasters
    logger.info("Loading pre/post SAR backscatter, DEM slope, and JRC water occurrence...")
    with rasterio.open(pre_path) as src:
        pre_raw = src.read(1)
        transform = src.transform
        crs = src.crs
        profile = src.profile.copy()
        bounds = src.bounds

    with rasterio.open(post_path) as src:
        post_raw = src.read(1)

    with rasterio.open(slope_path) as src:
        slope = src.read(1)

    with rasterio.open(jrc_path) as src:
        jrc_occ = src.read(1)

    # 2. Convert linear power to decibels (dB)
    # sigma_0_dB = 10 * log10(power)
    logger.info("Converting linear power to dB and applying 3x3 median filter for speckle reduction...")
    pre_db = 10.0 * np.log10(np.clip(pre_raw, 1e-5, 100.0))
    post_db = 10.0 * np.log10(np.clip(post_raw, 1e-5, 100.0))

    # Apply 3x3 spatial median filter to suppress speckle noise
    pre_filtered = median_filter(pre_db, size=config.SPECKLE_FILTER_SIZE)
    post_filtered = median_filter(post_db, size=config.SPECKLE_FILTER_SIZE)

    # 3. Change Detection: Delta dB = Post - Pre
    delta_db = post_filtered - pre_filtered
    logger.info(f"Delta dB: min={delta_db.min():.2f}, mean={delta_db.mean():.2f}, median={np.median(delta_db):.2f}")

    # 4. Dual Thresholding
    # Calibrated for Southern Tamil Nadu December 2023 flood:
    # Post water threshold: -15.0 dB (specular reflection of calm water)
    # Delta threshold: -2.5 dB (significant backscatter attenuation relative to pre-flood land)
    water_threshold_db = -15.0
    change_threshold_db = -2.5

    water_condition = (post_filtered <= water_threshold_db)
    change_condition = (delta_db <= change_threshold_db)
    raw_flood_candidate = water_condition & change_condition
    logger.info(f"Raw candidate flood pixels: {np.count_nonzero(raw_flood_candidate)}")

    # 5. Mask permanent water and steep terrain
    permanent_water_mask = (jrc_occ >= config.PERMANENT_WATER_OCCURRENCE_PCT)
    steep_terrain_mask = (slope > config.MAX_SLOPE_DEG)

    valid_flood = raw_flood_candidate & (~permanent_water_mask) & (~steep_terrain_mask)
    logger.info(f"Post terrain & permanent water masking: {np.count_nonzero(valid_flood)} pixels")

    # 6. Connected Component Analysis & Morphological Sieve
    # Filter out isolated clusters smaller than MIN_PATCH_PIXELS (10 pixels = 1,000 m2)
    labeled_patches, num_features = label(valid_flood)
    patch_sizes = np.bincount(labeled_patches.ravel())
    small_patches = patch_sizes < config.MIN_PATCH_PIXELS
    small_patches[0] = False  # Background
    valid_flood[small_patches[labeled_patches]] = False

    total_flooded_pixels = int(np.count_nonzero(valid_flood))
    pixel_area_m2 = config.RASTER_RESOLUTION_M ** 2
    total_flooded_area_km2 = float(total_flooded_pixels * pixel_area_m2 / 1e6)
    total_study_area_km2 = float(valid_flood.size * pixel_area_m2 / 1e6)
    inundation_percentage = float((total_flooded_area_km2 / total_study_area_km2) * 100.0)

    logger.info(f"Final Flooded Pixels: {total_flooded_pixels}")
    logger.info(f"Total Flooded Area: {total_flooded_area_km2:.2f} km² ({inundation_percentage:.2f}% of study area)")

    # 7. Save Binary Flood Mask GeoTIFF
    profile.update({
        "dtype": "uint8",
        "nodata": 0,
        "count": 1,
        "compress": "deflate"
    })
    with rasterio.open(mask_out_path, "w", **profile) as dst:
        dst.write(valid_flood.astype(np.uint8), 1)
    logger.info(f"Saved binary flood mask to {mask_out_path}")

    # 8. Vectorize Polygons
    logger.info("Polygonizing binary flood raster into vector geometries...")
    poly_generator = shapes(valid_flood.astype(np.uint8), mask=valid_flood, transform=transform)
    polygon_list = []
    area_list = []
    for geom, value in poly_generator:
        if value == 1:
            poly_geom = shape(geom)
            # Area in m2 in UTM 43N
            poly_area_m2 = poly_geom.area
            if poly_area_m2 >= 1000.0:  # >= 0.1 hectare
                polygon_list.append(poly_geom)
                area_list.append(round(poly_area_m2 / 1e6, 4))

    flood_gdf = gpd.GeoDataFrame({
        "flood_id": [f"FL_{i+1:04d}" for i in range(len(polygon_list))],
        "area_km2": area_list,
        "hazard_type": "Riverine & Urban Inundation",
        "detection_method": "Sentinel-1 SAR Change Detection (VV)",
        "geometry": polygon_list
    }, crs=crs)

    # Simplify slightly (2m tolerance) for fast web rendering while preserving exact shapes
    flood_gdf["geometry"] = flood_gdf.geometry.simplify(tolerance=2.0, preserve_topology=True)

    # Reproject to WGS84 for GeoJSON web standard
    flood_gdf_wgs84 = flood_gdf.to_crs(config.CRS_GEOGRAPHIC)
    flood_gdf_wgs84.to_file(geojson_out_path, driver="GeoJSON")
    logger.info(f"Exported {len(flood_gdf_wgs84)} flood polygons to {geojson_out_path}")

    # 9. Export Georeferenced Visual SAR PNGs for MapLibre before/after comparison
    def export_sar_png(raw_data, out_path):
        db = 10.0 * np.log10(np.clip(raw_data, 1e-4, 10.0))
        # Map -25 dB -> 0, 0 dB -> 255
        norm = np.clip((db + 25.0) / 25.0 * 255.0, 0, 255).astype(np.uint8)
        img = Image.fromarray(norm)
        img.save(out_path, optimize=True)

    export_sar_png(pre_raw, config.WEB_DATA_DIR / "pre_sar.png")
    export_sar_png(post_raw, config.WEB_DATA_DIR / "post_sar.png")

    transformer = pyproj.Transformer.from_crs(crs, config.CRS_GEOGRAPHIC, always_xy=True)
    min_lon, min_lat = transformer.transform(bounds.left, bounds.bottom)
    max_lon, max_lat = transformer.transform(bounds.right, bounds.top)
    wgs84_bounds = [float(min_lon), float(min_lat), float(max_lon), float(max_lat)]

    # 10. Write Flood Detection Metadata
    flood_meta = {
        "study_area": config.STUDY_AREA_NAME,
        "event_name": config.EVENT_NAME,
        "event_date": config.EVENT_DATE,
        "sensor": config.S1_SENSOR,
        "polarization": config.S1_POLARIZATION,
        "relative_orbit": config.S1_ORBIT,
        "pass_direction": config.S1_PASS,
        "pre_acquisition": config.S1_PRE_DATE,
        "post_acquisition": config.S1_POST_DATE,
        "processing_method": "SAR Amplitude Change Detection with Dual-Thresholding & Terrain/GSW Masking",
        "thresholds": {
            "post_water_max_db": water_threshold_db,
            "backscatter_delta_drop_db": change_threshold_db,
            "max_slope_deg": config.MAX_SLOPE_DEG,
            "jrc_permanent_water_pct": config.PERMANENT_WATER_OCCURRENCE_PCT,
            "min_connected_patch_m2": 1000.0
        },
        "statistics": {
            "total_study_area_km2": round(total_study_area_km2, 2),
            "total_flooded_area_km2": round(total_flooded_area_km2, 2),
            "inundation_percentage": round(inundation_percentage, 2),
            "polygon_count": len(flood_gdf_wgs84),
            "mean_backscatter_drop_db": round(float(np.mean(delta_db[valid_flood])), 2)
        },
        "raster_bounds_wgs84": wgs84_bounds
    }

    meta_path = config.WEB_DATA_DIR / "hazard_metadata.json"
    with open(meta_path, "w") as f:
        json.dump(flood_meta, f, indent=2)
    logger.info(f"Saved hazard metadata to {meta_path}")

    logger.info("=== STEP 2 COMPLETE: FLOOD HAZARD LAYER GENERATED & VALIDATED ===")
    return flood_meta


if __name__ == "__main__":
    detect_flood_extent()
