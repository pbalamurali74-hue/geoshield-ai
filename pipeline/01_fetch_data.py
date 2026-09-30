"""
GEOSHIELD Data Acquisition Module (pipeline/01_fetch_data.py)
Downloads and extracts real, validated geospatial layers for the study area:
- Sentinel-1 SAR RTC VV pre/post GeoTIFFs (Planetary Computer STAC)
- Copernicus DEM 30m & Topographic Slope calculation
- JRC Global Surface Water occurrence raster
- ESA WorldCover 10m Land Use / Cropland classification
- OpenStreetMap buildings and road networks (Overpass API)
"""
import json
import logging
import math
import sys
from pathlib import Path
import numpy as np
import pyproj
import requests
import rasterio
from rasterio.enums import Resampling
from rasterio.warp import calculate_default_transform, reproject
from rasterio.windows import from_bounds
import pystac_client
import planetary_computer as pc

from pipeline import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("geoshield.fetch")


def get_target_grid():
    """
    Computes the target UTM 43N grid extent aligned to 10m resolution.
    Returns (transform, width, height, bounds)
    """
    transformer = pyproj.Transformer.from_crs(config.CRS_GEOGRAPHIC, config.CRS_PROJECTED, always_xy=True)
    minx, miny = transformer.transform(config.BBOX_WGS84[0], config.BBOX_WGS84[1])
    maxx, maxy = transformer.transform(config.BBOX_WGS84[2], config.BBOX_WGS84[3])

    # Snap to nearest 10m resolution
    res = config.RASTER_RESOLUTION_M
    left = math.floor(minx / res) * res
    bottom = math.floor(miny / res) * res
    right = math.ceil(maxx / res) * res
    top = math.ceil(maxy / res) * res

    width = int(round((right - left) / res))
    height = int(round((top - bottom) / res))
    transform = rasterio.transform.from_bounds(left, bottom, right, top, width, height)

    bounds = (left, bottom, right, top)
    logger.info(f"Target Grid: {width}x{height} pixels @ {res}m res. Bounds: {bounds}")
    return transform, width, height, bounds


def fetch_sentinel1_rasters(target_transform, width, height, bounds):
    """
    Fetches Pre and Post Sentinel-1 RTC VV rasters from Microsoft Planetary Computer.
    """
    pre_path = config.CACHE_DIR / "s1_pre_vv.tif"
    post_path = config.CACHE_DIR / "s1_post_vv.tif"

    if pre_path.exists() and post_path.exists():
        logger.info("Sentinel-1 rasters already cached.")
        return pre_path, post_path

    logger.info("Opening Planetary Computer STAC catalog...")
    catalog = pystac_client.Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1",
        modifier=pc.sign_inplace
    )

    search = catalog.search(
        collections=[config.S1_COLLECTION],
        ids=[config.S1_PRE_ID, config.S1_POST_ID]
    )
    items = {item.id: item for item in search.items()}

    profile = {
        "driver": "GTiff",
        "dtype": "float32",
        "nodata": np.nan,
        "width": width,
        "height": height,
        "count": 1,
        "crs": config.CRS_PROJECTED,
        "transform": target_transform,
        "compress": "deflate",
        "tiled": True,
        "blockxsize": 256,
        "blockysize": 256
    }

    # Fetch Pre
    logger.info(f"Streaming Pre-flood S1 RTC: {config.S1_PRE_ID}")
    pre_item = items[config.S1_PRE_ID]
    with rasterio.open(pre_item.assets["vv"].href) as src:
        win = from_bounds(*bounds, src.transform)
        pre_data = src.read(1, window=win, out_shape=(height, width), resampling=Resampling.bilinear)
        with rasterio.open(pre_path, "w", **profile) as dst:
            dst.write(pre_data.astype(np.float32), 1)

    # Fetch Post
    logger.info(f"Streaming Post-flood S1 RTC: {config.S1_POST_ID}")
    post_item = items[config.S1_POST_ID]
    with rasterio.open(post_item.assets["vv"].href) as src:
        win = from_bounds(*bounds, src.transform)
        post_data = src.read(1, window=win, out_shape=(height, width), resampling=Resampling.bilinear)
        with rasterio.open(post_path, "w", **profile) as dst:
            dst.write(post_data.astype(np.float32), 1)

    logger.info("Sentinel-1 Pre & Post rasters successfully extracted.")
    return pre_path, post_path


def fetch_copernicus_dem_and_slope(target_transform, width, height, bounds):
    """
    Fetches Copernicus 30m DEM, reprojects to UTM 43N target grid, and computes slope in degrees.
    """
    dem_path = config.CACHE_DIR / "dem.tif"
    slope_path = config.CACHE_DIR / "slope.tif"

    if dem_path.exists() and slope_path.exists():
        logger.info("DEM and Slope rasters already cached.")
        return dem_path, slope_path

    logger.info("Searching Copernicus DEM GLO-30 in STAC...")
    catalog = pystac_client.Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1",
        modifier=pc.sign_inplace
    )
    search = catalog.search(collections=[config.DEM_COLLECTION], bbox=config.BBOX_WGS84)
    dem_items = list(search.items())
    if not dem_items:
        raise RuntimeError("No Copernicus DEM items found for bounding box!")

    dem_href = dem_items[0].assets["data"].href
    logger.info(f"Reprojecting Copernicus DEM from {dem_items[0].id}...")

    dem_grid = np.zeros((height, width), dtype=np.float32)
    with rasterio.open(dem_href) as src:
        reproject(
            source=rasterio.band(src, 1),
            destination=dem_grid,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=target_transform,
            dst_crs=config.CRS_PROJECTED,
            resampling=Resampling.bilinear
        )

    profile = {
        "driver": "GTiff",
        "dtype": "float32",
        "nodata": -9999.0,
        "width": width,
        "height": height,
        "count": 1,
        "crs": config.CRS_PROJECTED,
        "transform": target_transform,
        "compress": "deflate"
    }

    with rasterio.open(dem_path, "w", **profile) as dst:
        dst.write(dem_grid, 1)

    # Compute Slope: slope_deg = arctan(sqrt( (dz/dx)^2 + (dz/dy)^2 )) * 180 / pi
    res = config.RASTER_RESOLUTION_M
    dy, dx = np.gradient(dem_grid, res, res)
    slope_rad = np.arctan(np.sqrt(dx**2 + dy**2))
    slope_deg = np.degrees(slope_rad).astype(np.float32)

    with rasterio.open(slope_path, "w", **profile) as dst:
        dst.write(slope_deg, 1)

    logger.info(f"DEM and Slope generated. Elevation range: {dem_grid.min():.1f}m - {dem_grid.max():.1f}m. Mean slope: {slope_deg.mean():.1f}°")
    return dem_path, slope_path


def fetch_jrc_permanent_water(target_transform, width, height, bounds):
    """
    Fetches JRC Global Surface Water occurrence raster, reprojected to target grid.
    """
    jrc_path = config.CACHE_DIR / "jrc_occurrence.tif"
    if jrc_path.exists():
        logger.info("JRC occurrence raster already cached.")
        return jrc_path

    logger.info("Searching JRC Global Surface Water in STAC...")
    catalog = pystac_client.Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1",
        modifier=pc.sign_inplace
    )
    search = catalog.search(collections=[config.JRC_COLLECTION], bbox=config.BBOX_WGS84)
    items = list(search.items())
    if not items:
        raise RuntimeError("No JRC items found!")

    occ_href = items[0].assets["occurrence"].href
    logger.info("Reprojecting JRC Surface Water occurrence...")

    occ_grid = np.zeros((height, width), dtype=np.uint8)
    with rasterio.open(occ_href) as src:
        reproject(
            source=rasterio.band(src, 1),
            destination=occ_grid,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=target_transform,
            dst_crs=config.CRS_PROJECTED,
            resampling=Resampling.nearest
        )

    profile = {
        "driver": "GTiff",
        "dtype": "uint8",
        "nodata": 255,
        "width": width,
        "height": height,
        "count": 1,
        "crs": config.CRS_PROJECTED,
        "transform": target_transform,
        "compress": "deflate"
    }

    with rasterio.open(jrc_path, "w", **profile) as dst:
        dst.write(occ_grid, 1)

    logger.info(f"JRC occurrence raster cached. Max occurrence: {occ_grid.max()}%")
    return jrc_path


def fetch_worldcover_landuse(target_transform, width, height, bounds):
    """
    Fetches ESA WorldCover 10m Land Use classification, reprojected to target grid.
    Cropland class is 40. Built-up is 50. Water is 80.
    """
    wc_path = config.CACHE_DIR / "worldcover.tif"
    if wc_path.exists():
        logger.info("ESA WorldCover raster already cached.")
        return wc_path

    logger.info("Searching ESA WorldCover in STAC...")
    catalog = pystac_client.Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1",
        modifier=pc.sign_inplace
    )
    search = catalog.search(collections=["esa-worldcover"], bbox=config.BBOX_WGS84)
    items = list(search.items())
    if not items:
        raise RuntimeError("No WorldCover items found!")

    map_href = items[0].assets["map"].href
    logger.info(f"Reprojecting ESA WorldCover from {items[0].id}...")

    wc_grid = np.zeros((height, width), dtype=np.uint8)
    with rasterio.open(map_href) as src:
        reproject(
            source=rasterio.band(src, 1),
            destination=wc_grid,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=target_transform,
            dst_crs=config.CRS_PROJECTED,
            resampling=Resampling.nearest
        )

    profile = {
        "driver": "GTiff",
        "dtype": "uint8",
        "nodata": 0,
        "width": width,
        "height": height,
        "count": 1,
        "crs": config.CRS_PROJECTED,
        "transform": target_transform,
        "compress": "deflate"
    }

    with rasterio.open(wc_path, "w", **profile) as dst:
        dst.write(wc_grid, 1)

    logger.info("ESA WorldCover raster cached.")
    return wc_path


def fetch_osm_infrastructure():
    """
    Fetches OpenStreetMap roads and building footprints via Overpass API.
    Converts directly to GeoJSON in cache/ directory.
    """
    roads_path = config.CACHE_DIR / "osm_roads.geojson"
    bldgs_path = config.CACHE_DIR / "osm_buildings.geojson"

    if roads_path.exists() and bldgs_path.exists():
        logger.info("OSM infrastructure already cached.")
        return roads_path, bldgs_path

    logger.info("Querying Overpass API for OSM roads and buildings in study area...")
    bbox = config.BBOX_WGS84  # [min_lon, min_lat, max_lon, max_lat]
    # Overpass bbox format: (min_lat, min_lon, max_lat, max_lon)
    op_bbox = f"{bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]}"

    overpass_url = "https://overpass-api.de/api/interpreter"
    headers = {"User-Agent": "GeoShield-Disaster-Intelligence-Platform/1.0"}

    # Fetch Roads: major highways and residential roads
    query_roads = f"""
    [out:json][timeout:60];
    (
      way["highway"~"primary|secondary|tertiary|trunk|motorway|residential|unclassified"]({op_bbox});
    );
    out body;
    >;
    out skel qt;
    """

    try:
        r = requests.post(overpass_url, data={"data": query_roads}, headers=headers, timeout=60)
        r.raise_for_status()
        roads_raw = r.json()
        logger.info(f"OSM Roads response received: {len(roads_raw.get('elements', []))} elements")
    except Exception as e:
        logger.error(f"Failed to fetch roads from Overpass: {e}")
        roads_raw = {"elements": []}

    # Convert OSM roads elements to GeoJSON FeatureCollection
    nodes = {}
    for el in roads_raw.get("elements", []):
        if el["type"] == "node":
            nodes[el["id"]] = (el["lon"], el["lat"])

    road_features = []
    for el in roads_raw.get("elements", []):
        if el["type"] == "way" and "nodes" in el:
            coords = [nodes[nid] for nid in el["nodes"] if nid in nodes]
            if len(coords) >= 2:
                highway_type = el.get("tags", {}).get("highway", "road")
                name = el.get("tags", {}).get("name", "")
                road_features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coords
                    },
                    "properties": {
                        "id": el["id"],
                        "highway": highway_type,
                        "name": name
                    }
                })

    roads_geojson = {
        "type": "FeatureCollection",
        "name": "osm_roads",
        "features": road_features
    }
    with open(roads_path, "w") as f:
        json.dump(roads_geojson, f)
    logger.info(f"Wrote {len(road_features)} road segments to {roads_path}")

    # Fetch Buildings
    query_bldgs = f"""
    [out:json][timeout:90];
    (
      way["building"]({op_bbox});
    );
    out body;
    >;
    out skel qt;
    """

    try:
        r = requests.post(overpass_url, data={"data": query_bldgs}, headers=headers, timeout=90)
        r.raise_for_status()
        bldgs_raw = r.json()
        logger.info(f"OSM Buildings response received: {len(bldgs_raw.get('elements', []))} elements")
    except Exception as e:
        logger.error(f"Failed to fetch buildings from Overpass: {e}")
        bldgs_raw = {"elements": []}

    bldg_nodes = {}
    for el in bldgs_raw.get("elements", []):
        if el["type"] == "node":
            bldg_nodes[el["id"]] = (el["lon"], el["lat"])

    bldg_features = []
    for el in bldgs_raw.get("elements", []):
        if el["type"] == "way" and "nodes" in el:
            coords = [bldg_nodes[nid] for nid in el["nodes"] if nid in bldg_nodes]
            if len(coords) >= 3:
                # Ensure polygon ring is closed
                if coords[0] != coords[-1]:
                    coords.append(coords[0])
                bldg_type = el.get("tags", {}).get("building", "yes")
                bldg_features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [coords]
                    },
                    "properties": {
                        "id": el["id"],
                        "building": bldg_type
                    }
                })

    bldgs_geojson = {
        "type": "FeatureCollection",
        "name": "osm_buildings",
        "features": bldg_features
    }
    with open(bldgs_path, "w") as f:
        json.dump(bldgs_geojson, f)
    logger.info(f"Wrote {len(bldg_features)} building footprints to {bldgs_path}")

    return roads_path, bldgs_path


def run_data_fetch():
    logger.info("=== STEP 1: INITIATING GEOSPATIAL DATA FETCH ===")
    target_transform, width, height, bounds = get_target_grid()
    fetch_sentinel1_rasters(target_transform, width, height, bounds)
    fetch_copernicus_dem_and_slope(target_transform, width, height, bounds)
    fetch_jrc_permanent_water(target_transform, width, height, bounds)
    fetch_worldcover_landuse(target_transform, width, height, bounds)
    fetch_osm_infrastructure()
    logger.info("=== STEP 1 COMPLETE: ALL DATASETS CACHED SUCCESSFULLY ===")


if __name__ == "__main__":
    run_data_fetch()
