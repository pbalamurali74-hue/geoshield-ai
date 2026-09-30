# GEOSHIELD Data Sources & Provenance Matrix

**Project:** GEOSHIELD — Flood Exposure & Emergency Decision Intelligence  
**Study Area:** Tirunelveli Urban Agglomeration & Thamirabarani Basin, Tamil Nadu, India  
**Event:** Southern Tamil Nadu Catastrophic Monsoon Inundation (December 17–18, 2023)  
**CRS:** WGS 84 / UTM Zone 43N (`EPSG:32643`) | Web Standard: WGS 84 (`EPSG:4326`)  

---

## 1. Primary Geospatial Data Sources

| Dataset Name | Source Agency / Catalog | Native Resolution | Acquisition / Baseline Date | License | Measurement Type | Ingestion & Access Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sentinel-1A C-SAR (Pre-Flood)** | European Space Agency (ESA) / Copernicus | 10 meters (10m x 10m pixels) | **2023-12-05 00:41:22 UTC** | CC-BY-SA 3.0 IGO / Open Access | **Direct Sensor Measurement** | Microsoft Planetary Computer STAC (`sentinel-1-rtc`), signed COG streaming |
| **Sentinel-1A C-SAR (Post-Flood)** | European Space Agency (ESA) / Copernicus | 10 meters (10m x 10m pixels) | **2023-12-17 00:41:22 UTC** | CC-BY-SA 3.0 IGO / Open Access | **Direct Sensor Measurement** | Microsoft Planetary Computer STAC (`sentinel-1-rtc`), signed COG streaming |
| **Copernicus DEM GLO-30** | Copernicus Space Component Data Access / ESA | 30 meters (resampled to 10m) | 2021 Global Edition | Open Access / Public Domain | **Direct Sensor Measurement** | Microsoft Planetary Computer STAC (`cop-dem-glo-30`), on-the-fly warp |
| **Global Surface Water (GSW)** | European Commission Joint Research Centre (JRC) | 30 meters (resampled to 10m) | 1984–2020 Multi-decadal History | Open Access / JRC License | **Direct Baseline (Historical)** | Microsoft Planetary Computer STAC (`jrc-gsw`), Occurrence layer |
| **ESA WorldCover 10m v200** | European Space Agency (ESA) / VITO Remote Sensing | 10 meters | 2021 Global Edition | Creative Commons Attribution 4.0 | **Direct Baseline (Classification)** | Microsoft Planetary Computer STAC (`esa-worldcover`), map asset |
| **Building Footprints** | OpenStreetMap (OSM) Contributors | Vector Polygon Geometry | Dynamic Extraction (Dec 2023 baseline) | Open Database License (ODbL) | **Direct Vector Footprint Survey** | Overpass API (`https://overpass-api.de/api/interpreter`) |
| **Road Transport Network** | OpenStreetMap (OSM) Contributors | Vector LineString Geometry | Dynamic Extraction (Dec 2023 baseline) | Open Database License (ODbL) | **Direct Vector Network Survey** | Overpass API (`https://overpass-api.de/api/interpreter`) |
| **Exposed Population** | Modelled Census Proxy | Zonal Tabular Aggregate | 2023 Projection (2011 Census District Handbook) | Derived Proxy Metric | **MODELLED PROXY ESTIMATE** | Calculated as $272\text{ dwellings} \times 3.8\text{ persons/household}$ |

---

## 2. Detailed Technical Specifications & Quality Audit

### A. Synthetic Aperture Radar (SAR) Inundation Engine
* **Instrument:** C-band Synthetic Aperture Radar (C-SAR) operating at a center frequency of $5.405\text{ GHz}$ ($\lambda \approx 5.55\text{ cm}$).
* **Acquisition Mode:** Interferometric Wide (IW) swath mode.
* **Polarization:** Single co-polarization (VV). (VV co-pol is optimal for open water surface change detection due to high contrast between rough dry soil and specular calm water).
* **Relative Orbit:** **165** (Descending pass). Identical orbit geometry eliminates look-angle discrepancies, layover shifts, and geometric shadows.
* **Processing Level:** Radiometrically Terrain Corrected (RTC) Gamma-0 ($\gamma^0$), projecting backscatter onto a standardized DEM surface to eliminate topography-induced radiometric distortions.

### B. Topographic Slope & Elevation Filtering
* **DEM Product:** Copernicus DEM GLO-30 (30m elevation model).
* **Processing:** Reprojected to UTM Zone 43N (`EPSG:32643`) using bilinear interpolation.
* **Slope Calculation:** Two-dimensional gradient computed using central differences:
  $$\text{Slope}_{\text{deg}} = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right) \times \frac{180}{\pi}$$
* **Threshold:** Pixels with slope $> 5.0^\circ$ are masked. Standing floodwaters cannot accumulate on steep gradients; masking prevents radar shadow false positives.

### C. Permanent Water Mask (JRC Global Surface Water)
* **Layer Used:** Surface water occurrence ($\%$ of months water was detected over 1984–2020).
* **Threshold:** Occurrence $\ge 50\%$.
* **Rationale:** Excludes the permanent natural riverbed of the Thamirabarani River and perennial irrigation reservoirs from being counted as flood disaster inundation.

### D. Land Cover / Agricultural Mapping (ESA WorldCover)
* **Classification System:**
  * **Class 40 (Cropland):** Paddy fields, banana groves, sugarcane, and seasonal horticulture.
  * **Class 50 (Built-up):** Urban and rural artificial structures, residential settlements, commercial centers.
  * **Class 10 (Tree Cover):** Riparian riverbank vegetation and agro-forestry.
  * **Class 20 & 30 (Shrubland / Grassland):** Open pasture, scrub, and drainage channels.
  * **Class 80 (Permanent Water):** Reservoirs and streams.

### E. Infrastructure & Population Proxy
* **OSM Buildings:** 23,363 building footprint polygons extracted in the study extent.
* **Assignment Mechanism:** Assigned to 1 km² analysis grid cells strictly by **Geometric Centroid** (`geometry.centroid`). This guarantees a mathematically closed $1:1$ mapping where every building belongs to exactly one zone.
* **OSM Roads:** 8,320 road ways spanning primary national highways (NH-44, NH-138), state highways, and residential streets.
* **Road Assignment Mechanism:** Segmented at zonal boundaries (`gpd.overlay(roads, zones)`) and measured in projected meters before summing.
* **Population Exposed (Modelled Proxy):**
  > **Crucial Transparency Note:**  
  > Satellite SAR and OpenStreetMap do not measure real-time human occupancy. In accordance with the project rules, population figures are explicitly labelled as a **Modelled Proxy Estimate**. Based on the *Census of India District Census Handbook for Tirunelveli*, average rural/peri-urban household occupancy is **3.8 persons per dwelling**. Each directly inundated building footprint is assigned $3.8$ persons.
