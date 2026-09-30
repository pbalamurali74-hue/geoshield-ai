# GEOSHIELD: Flood Exposure & Emergency Decision Intelligence

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Static Edge](https://img.shields.io/badge/Platform-Static%20Vite%20%2B%20React-emerald.svg)](web/)
[![Pipeline: Python 3.10+](https://img.shields.io/badge/Pipeline-GeoPandas%20%2B%20Rasterio-blue.svg)](pipeline/)
[![Data: Copernicus Open Access](https://img.shields.io/badge/Data-Sentinel--1%20SAR-orange.svg)](docs/DATA_SOURCES.md)

**GEOIMPathon 1.0 (Problem Statement 4.4: Disaster Exposure Mapping)**  
*Case Study: Southern Tamil Nadu Extreme Monsoon Deluge (Tirunelveli & Thamirabarani Basin, December 17–18, 2023)*

---

## 1. Problem Statement & Operational Challenge

During catastrophic cyclonic cloudbursts, emergency response agencies face one urgent question:  
> **"Given a flood hazard, what infrastructure and settlements are exposed, how severe is the exposure, and which 1 km² sectors should receive rescue resources first?"**

Traditional disaster mapping products present static inundation polygons without operational prioritization, or rely on opaque machine learning models that generate unexplainable risk scores. Furthermore, optical satellites (Sentinel-2, Landsat) are completely blinded by thick cyclone cloud cover.

**GEOSHIELD** solves this challenge through an explainable, end-to-end geospatial intelligence pipeline:
1. **Radar Physics Flood Detection:** Leverages Copernicus Sentinel-1A C-band Synthetic Aperture Radar (SAR) to penetrate 100% cloud cover and map water surfaces via specular microwave reflection.
2. **Strict Non-Overlapping Exposure Accounting:** Overlays flood extent onto 23,000+ building footprints, road networks, and ESA WorldCover cropland with an enforced mathematical bijection (zero double-counting).
3. **Explainable Priority Decision Index:** Evaluates 506 equal-area 1 km² analysis sectors, calculating exact factor shares (e.g. *"36% building exposure, 25% road disruption"*) to deliver direct, conservative decision support for rescue commanders.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph DataIngestion["1. Cloud-Optimized Data Ingestion (Planetary Computer & Overpass)"]
        S1["Sentinel-1A RTC C-SAR (10m)<br/>Orbit 165 Descending (2023-12-05 & 2023-12-17)"]
        DEM["Copernicus DEM GLO-30<br/>Topographic Elevation (30m)"]
        GSW["JRC Global Surface Water<br/>Historical Occurrence (1984-2020)"]
        WC["ESA WorldCover 10m v200<br/>Global Land Cover Matrix"]
        OSM["OpenStreetMap Dynamic API<br/>23,363 Buildings & 8,320 Roads"]
    end

    subgraph PipelineEngine["2. Reproducible Geospatial Intelligence Engine (pipeline/)"]
        P1["01_fetch_data.py<br/>STAC Window Streaming & Reprojection to UTM 43N"]
        P2["02_detect_flood.py<br/>SAR Log-dB Calibration & 3x3 Median Speckle Filter<br/>Dual Condition: Post <= -15dB and Delta <= -2.5dB<br/>Slope <= 5° & GSW <= 50% Masking & 1000m² Sieve"]
        P3["03_analyze_exposure.py<br/>1 km² Grid Partitioning (506 Cells)<br/>1:1 Centroid Building Containment & Road Slicing<br/>Zonal Pixel Matrix Sum & Zero Double-Counting Assertions"]
        P4["04_compute_priority.py<br/>Min-Max Normalization of 5 Indicator Tensors<br/>Configurable Multi-Criteria Composite Scoring<br/>Factor Share Decomposition & Sensitivity Matrix"]
    end

    subgraph WebArtifacts["3. Web Export Layer (web/public/data/)"]
        Geo1["flood_extent.geojson (1.1 MB)"]
        Geo2["priority_zones.geojson (436 KB)"]
        Geo3["exposed_infrastructure.geojson (144 KB)"]
        Json1["exposure_summary.json (4.8 KB)"]
        Json2["zone_rankings.json (215 KB)"]
        Png1["pre_sar.png & post_sar.png (2.1 MB)"]
    end

    subgraph StaticFrontend["4. Desktop Command Center (web/src/)"]
        UI1["Overview Hero Canvas<br/>MapLibre GL JS + Real-Time Telemetry KPI Strip"]
        UI2["Hazard Analysis Swiper<br/>Pre vs Post SAR Backscatter Split View"]
        UI3["Exposure Matrix<br/>Category Isolation: Buildings, Roads, Cropland, Pop"]
        UI4["Priority Zones Table<br/>Ranked Decision Table + Sensitivity Analysis Drawer"]
        UI5["Methodology & Provenance<br/>Data Sources Audit Matrix & Physical Caveats"]
        Tour["Built-In 2-Minute Guided Tour Modal"]
    end

    DataIngestion --> PipelineEngine
    P1 --> P2 --> P3 --> P4
    PipelineEngine --> WebArtifacts
    WebArtifacts --> StaticFrontend
```

---

## 3. Verified Empirical Results

All statistics are generated directly from the execution of `pipeline/run_pipeline.py` over the Tirunelveli & Thamirabarani Basin study area:

| Metric | Measured Value | Provenance & Methodological Note |
| :--- | :--- | :--- |
| **Total Analysis Extent** | **487.92 km²** | $21.8\text{ km} \times 22.3\text{ km}$ bounding box in UTM Zone 43N (`EPSG:32643`) |
| **Detected Flood Inundation** | **3.35 km² (0.69%)** | Sentinel-1A C-SAR change detection; 881 discrete flood polygons |
| **Mean Radar Backscatter Drop** | **-5.68 dB** | Substantial microwave attenuation confirming specular open water |
| **Exposed Building Footprints** | **272 units** | OpenStreetMap direct vector footprint intersection ($1:1$ centroid assignment) |
| **Submerged Road Network** | **17.78 km** | OpenStreetMap highway lines topologically segmented at zone boundaries |
| **Inundated Cropland** | **1.73 km² (51.7%)** | ESA WorldCover Class 40 (Paddy & cash crops) under standing water |
| **Modelled Population Proxy** | **1,034 persons** | Explicitly labelled proxy: $272\text{ dwellings} \times 3.8\text{ persons/household}$ (Census Handbook) |
| **Reconciliation Discrepancy** | **0.00% (EXACT)** | Automated assertion: $\sum \text{Zone Totals} \equiv \text{Ground Raster/Vector Totals}$ |

---

## 4. Priority Decision Index Formulation

The priority score $P_z \in [0, 100]$ for each 1 km² zone $z$ is formulated as an explainable multi-criteria composite:

$$P_z = 100 \times \left(0.25 \bar{F}_z + 0.25 \bar{B}_z + 0.20 \bar{R}_z + 0.15 \bar{P}_z + 0.15 \bar{A}_z\right)$$

Where each component $\bar{X}_z$ is Min-Max normalized across active landscape cells:
$$\bar{X}_z = \frac{X_z - \min(X)}{\max(X) - \min(X)}$$

### Thresholds & Classification:
* **CRITICAL ($P_z \ge 60.0$):** **2 zones** (Melapalayam drainage depression; 181 buildings and 3.05 km roads submerged)
* **HIGH ($25.0 \le P_z < 60.0$):** **4 zones** (Vannarpettai riverbank corridor; substantial agricultural and road severance)
* **MODERATE ($10.0 \le P_z < 25.0$):** **13 zones** (Canal basin agricultural inundation)
* **LOW ($P_z < 10.0$):** **487 zones** (Minimal or zero standing water detected)

---

## 5. Local Setup & Execution Guide

### Prerequisites
* **Python 3.10+** (with virtual environment support)
* **Node.js 18+** & **npm**

### Step 1: Clone Repository & Setup Python Environment
```bash
git clone https://github.com/your-org/geoshield.git
cd geoshield

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install locked pipeline dependencies
pip install -r pipeline/requirements.txt
```

### Step 2: Execute Geospatial Pipeline (Takes ~2.5 Seconds)
```bash
# Runs data check, SAR flood detection, zonal overlay, and web exports
python3 -m pipeline.run_pipeline
```
*Pipeline outputs are written directly to `web/public/data/`.*

### Step 3: Run Desktop Web Command Center
```bash
cd web
npm install
npm run dev
```
Open **`http://localhost:3000`** in any modern desktop browser.

---

## 6. One-Click Cloud Deployment

Because the web frontend is **100% static** and loads GeoJSONs directly from `public/data/`, it requires **NO backend server and NO database**.

* **Vercel:** Import repository into Vercel. `vercel.json` is pre-configured. Click **Deploy**.
* **Netlify:** Import repository into Netlify. `netlify.toml` automatically builds `web` and publishes `dist`.
* **GitHub Pages:** Pre-configured in `.github/workflows/deploy.yml`. Enable Pages in repository settings.

---

## 7. Comprehensive Project Documentation Suite

For judges and technical reviewers, detailed documentation is organized in `docs/`:

1. [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md): Complete provenance, spatial resolution, dates, licenses, and direct vs. modelled proxy indicators.
2. [docs/DECISIONS.md](docs/DECISIONS.md): Every tool, dataset, threshold, and design choice, and WHY it was chosen over alternatives.
3. [docs/VALIDATION.md](docs/VALIDATION.md): Accuracy assessment against ground references and honest physical radar limitations.
4. [docs/PITCH_NOTES.md](docs/PITCH_NOTES.md): Mapping to judging criteria, a 2-minute demo pitch flow, and 15 defensive Q&As.
5. [docs/STUDY_GUIDE.md](docs/STUDY_GUIDE.md): Technical educational guide covering SAR physics, decibels, specular reflection, and index mathematics.

---

## 8. Physical Limitations & Future Enhancements

* **Urban Double-Bounce:** Dense multi-story downtown buildings reflect radar pulses back even if streets have shallow water (10–30 cm). Amplitude SAR under-detects shallow street flooding in narrow concrete canyons.
* **Wind Surface Roughening:** High cyclonic surface winds create capillary waves on wide water bodies, which can elevate backscatter above the -15.0 dB calm water threshold.
* **Future Work:** Integrating L-band SAR (such as the NASA-ISRO NISAR mission) for mature agricultural canopy penetration, adding critical facility points of interest (hospitals, schools, fire stations), and connecting automated SMS alerts for local panchayats.
