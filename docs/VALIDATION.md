# GEOSHIELD Validation & Sanity Assessment (docs/VALIDATION.md)

**Project:** GEOSHIELD — Flood Exposure & Emergency Decision Intelligence  
**Study Area:** Tirunelveli Urban Agglomeration & Thamirabarani Basin, Tamil Nadu, India  
**Hazard Event:** Southern Tamil Nadu Catastrophic Monsoon Deluge (December 17–18, 2023)  
**Satellite:** Sentinel-1A C-band SAR (IW Mode, VV Polarization, Relative Orbit 165, Descending)  

---

## 1. Ground Truth & Reference Alignment

### A. Event Background
On December 17–18, 2023, an intense cyclonic monsoon circulation brought historic, record-shattering rainfall across Southern Tamil Nadu:
* **Rainfall Extremes:** Kayalpattinam recorded **932 mm in 24 hours** (the highest single-day rainfall ever recorded in the plains of Tamil Nadu). Manjolai in the upper Thamirabarani catchment received **550 mm**.
* **River Discharge:** The Thamirabarani River experienced historic peak discharges exceeding **150,000 cusecs**, causing major breaches along riverbanks at Kurukkuthurai, Vannarpettai, Melapalayam, Srivaikuntam, and Sivalaperi.
* **National Response:** 10 NDRF teams and 9 SDRF battalions were deployed to rescue stranded citizens in Tirunelveli and Thoothukudi.

### B. Observed Pipeline Results vs. District Realities
* **Total Inundated Area Detected:** **3.35 km²** across the 487.92 km² study box (0.69% of the landscape).
* **Spatial Alignment:** Inundation is concentrated strictly along:
  1. The natural riverine floodplains of the Thamirabarani River (Kurukkuthurai, Vannarpettai, Sivalaperi).
  2. Overflow margins of major irrigation tanks (Nainarkulam, Udayarpatti, Melapalayam drainage depression).
  3. Low-lying agricultural paddy basins adjacent to major canal networks.
* **Mean Backscatter Drop:** **-5.68 dB** across detected flooded pixels, confirming a severe shift from soil/vegetation backscatter to specular water reflection.

---

## 2. Quantitative Reconciliation Checkpoints

Every metric was subjected to automated verification assertions in `pipeline/03_analyze_exposure.py`:

| Indicator | Zonal Sum across 506 Cells | Direct Raster / Vector Ground Total | Discrepancy | Verification Result |
| :--- | :--- | :--- | :--- | :--- |
| **Flooded Area** | **3.35 km²** | **3.35 km²** | **0.00 km²** | **PASSED (100% Exact)** |
| **Exposed Buildings** | **272 units** | **272 units** | **0 units** | **PASSED (100% Exact)** |
| **Exposed Roads** | **17.78 km** | **17.78 km** | **0.00 km** | **PASSED (100% Exact)** |
| **Exposed Cropland** | **1.73 km²** | **1.73 km²** | **0.00 km²** | **PASSED (100% Exact)** |
| **Population Proxy** | **1,034 persons** | **1,034 persons** | **0 persons** | **PASSED (100% Exact)** |

---

## 3. Known Physical Error Modes & Sensor Limitations

To uphold transparency and avoid exaggerated claims, the following physical and sensor-based limitations are explicitly recognized:

1. **Urban Corner Reflector / Double-Bounce Effect:**  
   In dense urban environments, perpendicular building walls and ground surfaces create radar double-bounce. This scattering mechanism causes high backscatter ($> -10 \text{ dB}$) even if shallow floodwaters (10–30 cm) cover streets between buildings. As a result, street-level urban inundation in dense commercial zones may be under-detected by pure amplitude thresholding.

2. **Wind-Roughened Water Surfaces:**  
   During active storm events with high surface winds, capillary waves form on standing open water, increasing diffuse surface backscatter. In severe cases, this can push backscatter above the $-15.0 \text{ dB}$ calm-water threshold, causing transient under-detection.

3. **Emergent Vegetation & Saturated Soils:**  
   Agricultural fields with mature tall crops may experience floodwaters beneath the canopy without showing pure specular reflection. The pipeline relies on the backscatter drop ($\Delta \sigma^0 \le -2.5 \text{ dB}$) to capture standing water in sparse crops, but heavily vegetated canopy penetration requires longer wavelengths (e.g. L-band SAR like NISAR/ALOS-2).

4. **Temporal Snapshots:**  
   Satellite SAR captures a single instantaneous snapshot (`2023-12-17 00:41 UTC`). It documents the extent of standing water at that exact pass time, which may differ from the absolute flash-flood peak that occurred earlier during the night of December 17.
