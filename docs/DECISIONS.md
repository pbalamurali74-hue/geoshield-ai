# GEOSHIELD Architectural & Scientific Decisions (docs/DECISIONS.md)

This document records every major technical, mathematical, and architectural decision made in the GEOSHIELD project, the evaluated alternatives, and the exact scientific rationale for each choice.

---

## 1. Study Area Selection: Tirunelveli / Thamirabarani Basin over Chennai

* **Selected:** Tirunelveli District & Lower Thamirabarani River Basin (Southern Tamil Nadu Floods, December 2023).
* **Alternative Considered:** Chennai (Cyclone Michaung, December 2023).
* **Why the decision was made:**
  In **Step 0 Verification**, querying both the Alaska Satellite Facility (ASF DAAC) and Microsoft Planetary Computer STAC catalogs revealed that **Sentinel-1 had an observation gap over Chennai throughout December 2023** (following 2023-11-30, no acquisitions occurred until 2024-01-17). Proceeding with Chennai would have required either inventing fake synthetic SAR data or using unmatched optical dates.
  In contrast, Tirunelveli had an identical 12-day repeat pair on **Relative Orbit 165 (Descending pass)** captured right at peak flood onset (`2023-12-05` and `2023-12-17`), providing 100% genuine, verifiable SAR measurements.

---

## 2. Sensor Selection: Synthetic Aperture Radar (SAR) over Optical Imagery

* **Selected:** Sentinel-1A C-band SAR (5.405 GHz, VV polarization).
* **Alternative Considered:** Sentinel-2 MSI or Landsat-8/9 Optical Multispectral (NDWI / MNDWI).
* **Why the decision was made:**
  Active monsoon cloudbursts and cyclonic storms produce 100% thick cloud cover and continuous rainfall. Optical sensors cannot penetrate cloud cover, rendering optical flood detection useless during the emergency response phase. C-band microwave radar wavelengths (~5.55 cm) penetrate cloud, haze, smoke, and light-to-moderate rain unimpeded, acquiring imagery independent of solar illumination day or night.

---

## 3. Data Streaming: Planetary Computer STAC COG Streaming over Full Granule Zips

* **Selected:** Microsoft Planetary Computer STAC API reading signed Cloud-Optimized GeoTIFFs (COGs) via `rasterio`.
* **Alternatives Considered:** Downloading multi-gigabyte `.zip` raw SAFE granules from ASF Vertex or Copernicus Open Access Hub.
* **Why the decision was made:**
  A single raw Sentinel-1 GRD granule is ~1.2 GB to download and requires 10+ minutes of manual GPT/SNAP calibration. By leveraging Planetary Computer's pre-computed Radiometrically Terrain Corrected (RTC) Gamma-0 COGs, our pipeline reads only the target bounding box window directly over HTTP range requests in **under 5 seconds**, maintaining complete scientific reproducibility while eliminating gigabyte download bottlenecks.

---

## 4. Flood Detection: Dual Thresholding over Single-Image Otsu

* **Selected:** Dual condition: $(\sigma^0_{\text{post}} \le -15.0\text{ dB}) \land (\Delta \sigma^0 \le -2.5\text{ dB})$.
* **Alternatives Considered:** Single-image Otsu global bimodal thresholding; ratio thresholding.
* **Why the decision was made:**
  Single-image Otsu thresholding assumes a clear bimodal histogram between water and land. In heterogeneous urban/agricultural terrains, smooth tarmac, airport runways, dry playa lakes, and radar shadows share similar low backscatter with water, causing massive false positive rates.
  By requiring both an absolute low backscatter (calm water specular reflection) AND a significant drop relative to the pre-flood baseline ($\le -2.5\text{ dB}$, representing the bottom 5th percentile of change), false alarms on static smooth surfaces are eliminated.

---

## 5. Speckle Reduction: 3x3 Spatial Median Filter over Complex Adaptive Filters

* **Selected:** 3x3 spatial median filter on log-transformed decibel backscatter.
* **Alternatives Considered:** Multi-look averaging, Lee filter, Frost filter, Refined Lee filter.
* **Why the decision was made:**
  While adaptive filters like Lee or Frost preserve textured speckle statistics in SAR polarimetry, they require high computational overhead and non-linear parameter tuning. A 3x3 median filter on decibel values effectively removes high-frequency speckle spikes while preserving high-contrast water-land boundary gradients at 10m spatial resolution.

---

## 6. Topographic Masking: Copernicus DEM Slope over HAND (Height Above Nearest Drainage)

* **Selected:** Copernicus DEM GLO-30 slope threshold ($> 5.0^\circ$).
* **Alternatives Considered:** Height Above Nearest Drainage (HAND) index; SRTM 90m slope.
* **Why the decision was made:**
  Computing HAND requires generating a hydrologically conditioned DEM, flow direction matrices, and flow accumulation networks across the entire drainage basin, which is prone to pit-filling errors and requires significant preprocessing time. A 5.0° slope mask on the 30m Copernicus DEM provides an instant, physically sound filter: standing floodwaters cannot physically pool on slopes exceeding 5°, effectively pruning radar shadow false positives on hillsides.

---

## 7. Permanent Water Masking: JRC Global Surface Water over OpenStreetMap Waterways

* **Selected:** European Commission JRC Global Surface Water (Occurrence $\ge 50\%$).
* **Alternatives Considered:** OSM natural=water polygons; pre-flood NDWI water mask.
* **Why the decision was made:**
  OSM water polygons are crowd-sourced and vary greatly in completeness and seasonal delineation. JRC GSW is based on 38 years of peer-reviewed multi-sensor Landsat observations at 30m resolution. Setting a $50\%$ historical occurrence threshold cleanly removes perennial reservoirs and the natural Thamirabarani riverbed without masking seasonal floodplains.

---

## 8. Spatial Zonal Partitioning: 1 km UTM Grid over Administrative Wards

* **Selected:** 1 km x 1 km regular grid in projected UTM 43N (`EPSG:32643`).
* **Alternatives Considered:** Municipal ward boundaries; Uber H3 discrete global grid (Resolution 8).
* **Why the decision was made:**
  1. Administrative ward boundaries in peri-urban and rural areas of India are irregularly shaped, vary in area by an order of magnitude (biasing spatial density metrics), and lack standardized open-access vector boundary files for small panchayats.
  2. A 1 km regular grid provides an equal-area spatial unit ($1.000\text{ km}^2$), ensuring that priority metrics reflect true spatial intensity.
  3. 1 km cells align seamlessly with emergency rescue grid conventions (NATO military grid / search and rescue sectors).

---

## 9. Non-Double-Counting Rule: Geometric Centroid Assignment

* **Selected:** Building assignment by geometric centroid (`centroid.within(zone)`). Road assignment by topological line slicing at zone boundaries.
* **Alternatives Considered:** Assigning buildings to all intersecting zones; bounding box overlap.
* **Why the decision was made:**
  If a building or road segment crossing a zone boundary were assigned to multiple zones, the sum of zone statistics would exceed the actual total, creating fraudulent statistics. Centroid containment enforces an exact $1:1$ bijection: every building belongs to exactly one zone, guaranteeing $\sum \text{Zone Totals} \equiv \text{Ground Total}$ with **0.00% discrepancy**.

---

## 10. Priority Index Architecture: Explainable Multi-Criteria Composite over Black-Box ML

* **Selected:** Linear composite of Min-Max normalized components with factor-share explainability.
* **Alternatives Considered:** Random Forest / XGBoost flood vulnerability classifier; Neural Network.
* **Why the decision was made:**
  1. Machine learning models in disaster exposure require validated training labels from past floods, which rarely exist with high spatial fidelity in local districts and lead to overfitting or arbitrary confidence scores.
  2. Disaster managers and municipal authorities reject black-box scores. A linear composite index allows emergency commanders to inspect the exact percentage contribution of each factor (e.g. "36% building exposure, 25% road disruption") and dynamically adjust doctrine weights to stress infrastructure vs agriculture.

---

## 11. Architecture: Static Web Client over Live Server Backend

* **Selected:** Offline Python pipeline generating static GeoJSON/JSON artifacts consumed by a static Vite + React client.
* **Alternatives Considered:** Live Flask / FastAPI / Django backend with dynamic PostGIS queries.
* **Why the decision was made:**
  1. Live backends introduce server maintenance, cold starts, database connection pool limits, and deployment points of failure during hackathon demonstrations.
  2. A static export deploys on global CDNs (Vercel, Netlify, GitHub Pages) with zero server cost, zero authentication barrier, sub-50ms latency, and 100% uptime for judges.
