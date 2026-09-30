"""
GEOSHIELD Master Pipeline Runner (pipeline/run_pipeline.py)
Executes the end-to-end geospatial intelligence pipeline:
  Step 1: 01_fetch_data.py       - Data acquisition from Planetary Computer & Overpass
  Step 2: 02_detect_flood.py     - Sentinel-1 SAR change detection & terrain/water masking
  Step 3: 03_analyze_exposure.py - 1 km zonal overlays & non-double-counting reconciliation
  Step 4: 04_compute_priority.py - GeoShield Exposure Priority Index & web JSON exports
"""
import importlib
import logging
import sys
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("geoshield.master")


def run_all():
    start_time = time.time()
    logger.info("======================================================================")
    logger.info("  GEOSHIELD: FLOOD EXPOSURE & EMERGENCY DECISION INTELLIGENCE PIPELINE")
    logger.info("======================================================================")

    # Dynamic imports for numeric module filenames
    step1 = importlib.import_module("pipeline.01_fetch_data")
    step2 = importlib.import_module("pipeline.02_detect_flood")
    step3 = importlib.import_module("pipeline.03_analyze_exposure")
    step4 = importlib.import_module("pipeline.04_compute_priority")

    logger.info(">>> STEP 1: FETCHING SATELLITE & ANCILLARY DATA...")
    step1.run_data_fetch()

    logger.info(">>> STEP 2: PERFORMING SAR FLOOD DETECTION...")
    step2.detect_flood_extent()

    logger.info(">>> STEP 3: PERFORMING ZONAL EXPOSURE ANALYSIS...")
    step3.run_exposure_analysis()

    logger.info(">>> STEP 4: COMPUTING EXPOSURE PRIORITY INDEX & WEB EXPORTS...")
    summary = step4.calculate_priority_index()

    elapsed = time.time() - start_time
    logger.info("======================================================================")
    logger.info(f"  PIPELINE EXECUTION COMPLETE IN {elapsed:.2f} SECONDS")
    logger.info(f"  Flooded Area:          {summary['kpis']['total_flooded_area_km2']} km²")
    logger.info(f"  Exposed Buildings:     {summary['kpis']['total_buildings_exposed']} units")
    logger.info(f"  Exposed Roads:         {summary['kpis']['total_roads_exposed_km']} km")
    logger.info(f"  Exposed Agriculture:   {summary['kpis']['total_agricultural_exposed_km2']} km²")
    logger.info(f"  Exposed Population:    {summary['kpis']['total_population_exposed_proxy']} persons (modelled proxy)")
    logger.info(f"  Critical Zones:        {summary['kpis']['priority_zones_count']['critical']} zones")
    logger.info(f"  High Priority Zones:   {summary['kpis']['priority_zones_count']['high']} zones")
    logger.info("======================================================================")


if __name__ == "__main__":
    run_all()
