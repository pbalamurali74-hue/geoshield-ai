# GEOSHIELD Technical Study Guide (docs/STUDY_GUIDE.md)

This study guide explains the remote sensing physics, geospatial mathematics, and decision algorithms implemented in GEOSHIELD in plain language. Study this document to speak confidently and defend the project before judges.

---

## 1. SAR Radar Physics: Why Does Radar See Through Clouds?

### Active vs. Passive Remote Sensing
* **Optical Satellites (Sentinel-2, Landsat):** Passive sensors. They measure sunlight reflected from the Earth's surface. During cyclones and cloudbursts, thick clouds, rain, and nighttime darkness completely block the optical sensor's view.
* **SAR Satellites (Sentinel-1):** Active sensors. The satellite carries its own microwave transmitter and antenna. It emits microwave pulses toward Earth and records the amplitude and phase of the backscattered echo returned to the sensor.

### C-band Microwave Wavelengths
* Sentinel-1 operates at **5.405 GHz (C-band)**, with a wavelength of approximately **$\lambda \approx 5.55\text{ cm}$**.
* Water droplets in clouds typically measure less than $0.1\text{ mm}$, and rain droplets are a few millimeters. Because the radar wavelength ($5.55\text{ cm}$) is much larger than cloud droplet diameters, microwave pulses pass through clouds, haze, and rain with negligible atmospheric attenuation.

---

## 2. Why Does Water Appear Dark on Radar Imagery?

Radar backscatter depends primarily on **surface roughness** relative to the radar wavelength:

1. **Rough Land / Dry Soil / Vegetation (Diffuse Scattering):**
   * Terrain, crop foliage, and rough soil contain irregularities comparable to or larger than the $5.55\text{ cm}$ radar wavelength.
   * Incoming radar pulses are scattered in all directions (diffuse scattering). A significant fraction reflects back directly toward the satellite antenna, producing **high to moderate backscatter (typically $-10\text{ dB to } -6\text{ dB}$)**, appearing gray or bright in radar imagery.

2. **Smooth Standing Water (Specular Reflection):**
   * When land is submerged by standing floodwater, the flat, calm liquid surface behaves like a mirror (specular reflection).
   * In accordance with Snell's law of reflection ($\theta_{\text{incident}} = \theta_{\text{reflected}}$), the radar pulse bounces away from the side-looking satellite antenna into space.
   * Almost no energy returns to the receiver antenna, causing backscatter to drop dramatically to **$\le -15.0\text{ dB}$ (often $-20\text{ to } -25\text{ dB}$)**, appearing as deep dark or black patches in the radar image.

---

## 3. What is Radar Backscatter in Decibels (dB)?

* Raw radar detectors record linear power ($\gamma^0$). Because radar reflections span over 5 orders of magnitude (from smooth lakes to metallic bridges), linear power is converted into a logarithmic decibel scale:
  $$\sigma^0_{\text{dB}} = 10 \cdot \log_{10}(\gamma^0)$$
* A value of $0\text{ dB}$ means high reflection.
* A value of $-10\text{ dB}$ is typical dry pasture or open ground.
* A value of $-16\text{ dB}$ is quiet water.
* **Remember:** Because decibels are logarithmic, a **$-3\text{ dB}$ change represents a 50% drop** in returned microwave power. Our observed mean drop of **$-5.68\text{ dB}$** represents a **nearly 75% reduction in returned energy**, confirming profound surface inundation.

---

## 4. Why Must Pre and Post Images Have the Same Orbit and Pass?

* Synthetic Aperture Radar is **side-looking**. The satellite looks to the side at an incidence angle between $30^\circ$ and $45^\circ$.
* In an **Ascending pass**, the satellite flies South-to-North looking East.
* In a **Descending pass**, the satellite flies North-to-South looking West.
* If you compare an ascending scene with a descending scene:
  * Building walls and hillslopes face opposite directions.
  * Radar layover and radar shadow appear on completely opposite sides of terrain features.
* By enforcing identical **Relative Orbit (Orbit 165)** and identical **Pass Direction (Descending)**:
  * The look angle and illumination geometry are identical down to the meter.
  * Geometric distortions cancel out, ensuring that any drop in backscatter is caused solely by surface water changes.

---

## 5. What is Speckle Noise, and Why Use a 3x3 Median Filter?

* **Radar Speckle:** Coherent microwave pulses reflect off multiple tiny scatterers within a single $10\text{m} \times 10\text{m}$ ground resolution cell. These waves interfere constructively and destructively, producing a "salt-and-pepper" granular texture known as speckle.
* **Speckle Filtering:** A $3\times3$ spatial median filter calculates the median of the 9 pixels surrounding each cell. Unlike a simple mean blur, a median filter suppresses isolated noise spikes while preserving sharp edges between water bodies and dry land.

---

## 6. How Did We Prevent False Alarms?

1. **Topographic Masking (Copernicus DEM Slope):**
   * On steep hillslopes facing away from the radar antenna, radar shadows produce very low backscatter that can look identical to calm water.
   * By calculating the slope gradient from the Copernicus 30m DEM and masking slopes $> 5.0^\circ$, we ensure no radar shadows on hillsides are falsely flagged as floods.
2. **Permanent Water Masking (JRC Global Surface Water):**
   * We do not want to flag the normal riverbed of the Thamirabarani River as a flood disaster.
   * We used the JRC Global Surface Water dataset (38 years of historical Landsat records) to mask all pixels with historical water occurrence $\ge 50\%$.

---

## 7. How Does the Exposure Overlay Work Without Double-Counting?

To ensure mathematical precision ($\sum \text{Zones} \equiv \text{Total}$):
1. **Building Assignment ($1:1$ Centroid Bijection):**
   * Every building polygon has a single geometric center of mass (`centroid`).
   * A centroid falls into exactly one 1 km² grid cell. If the building polygon or its centroid intersects the flood extent, it is flagged as exposed and counted once in that cell.
2. **Road Network Slicing:**
   * Road lines that cross grid boundaries are topologically split at the boundary lines.
   * The length of each segment is calculated in metric meters in projected CRS (`EPSG:32643`) before summing.
3. **Automated Assertion:**
   * The pipeline runs `assert total_zonal == total_ground` for all counts, lengths, and areas before exporting data.

---

## 8. How Does the GeoShield Exposure Priority Index Work?

### Min-Max Normalization
Because indicators have different units (buildings are counts, roads are km, flood is km²), each indicator $X$ is scaled to $[0, 1]$ across all active zones:
$$\bar{X}_z = \frac{X_z - \min(X)}{\max(X) - \min(X)}$$

### Linear Composite Combination
The indicators are combined using transparent, configurable weights:
$$P_z = 100 \times \left(0.25 \bar{F}_z + 0.25 \bar{B}_z + 0.20 \bar{R}_z + 0.15 \bar{P}_z + 0.15 \bar{A}_z\right)$$

### Explainability
For every zone, the system calculates the exact percentage contribution of each factor to its score:
$$\text{Share}_{i,z} = \frac{w_i \cdot \bar{X}_{i,z}}{\sum_j w_j \cdot \bar{X}_{j,z}} \times 100\%$$
This allows the dashboard to explain in plain language: *"Melapalayam is Rank #1 Critical because building exposure accounts for 36.0% and road disruption accounts for 25.2% of its score."*

---

## 9. What are the Physical Limitations to Acknowledge to Judges?

1. **Urban Radar Double-Bounce:**  
   In dense multi-story concrete downtowns, perpendicular building walls reflect microwave pulses back to the satellite even when streets have 10–30 cm of water. Amplitude SAR can under-detect shallow urban street flooding in dense downtown canyons.
2. **Wind-Roughened Surface Waves:**  
   Severe cyclonic wind gusts can create surface waves on open water, increasing diffuse backscatter above the $-15.0\text{ dB}$ calm-water threshold.
3. **Dense Crop Canopy Penetration:**  
   In mature tall paddy crops, C-band SAR (~5.5 cm) reflects off the upper canopy foliage. Penetrating through mature flooded vegetation requires longer wavelengths, such as L-band SAR (~24 cm, like the upcoming NASA-ISRO NISAR mission).
