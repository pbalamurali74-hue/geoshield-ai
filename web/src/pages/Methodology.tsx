import React from 'react';
import { Database, GitBranch, Cpu, ShieldAlert, CheckCircle2, Layers, BookOpen, Compass } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-6 select-none">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-slate-800 text-slate-100 px-2 py-0.5 rounded">
              SCIENTIFIC INTEGRITY & AUDIT
            </span>
            <span className="text-xs text-slate-500 font-mono">100% REPRODUCIBLE PIPELINE</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            System Methodology, Provenance & Mathematical Formulation
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Full documentation of the offline geospatial intelligence pipeline, physics of SAR flood detection, and explainable priority scoring.
          </p>
        </div>

        {/* 6-Stage Pipeline Flowchart */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <span>End-to-End Processing Architecture (pipeline/run_pipeline.py)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-blue-600 font-bold block mb-1">STAGE 01</span>
                <span className="font-bold text-slate-900 block mb-1">STAC Ingestion</span>
                <p className="text-[11px] text-slate-600">
                  Planetary Computer STAC streaming S1 RTC, Copernicus DEM, JRC GSW, WorldCover.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2 block border-t pt-1">01_fetch_data.py</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-blue-600 font-bold block mb-1">STAGE 02</span>
                <span className="font-bold text-slate-900 block mb-1">Calibration & dB</span>
                <p className="text-[11px] text-slate-600">
                  Convert linear &gamma;&deg; to dB: 10*log10(power); apply 3x3 median filter for speckle.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2 block border-t pt-1">02_detect_flood.py</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-blue-600 font-bold block mb-1">STAGE 03</span>
                <span className="font-bold text-slate-900 block mb-1">Change Detection</span>
                <p className="text-[11px] text-slate-600">
                  Enforce dual criteria: &Delta;&sigma;&deg; &le; -2.5 dB & Post-water &le; -15.0 dB.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2 block border-t pt-1">02_detect_flood.py</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-blue-600 font-bold block mb-1">STAGE 04</span>
                <span className="font-bold text-slate-900 block mb-1">Masking & Sieve</span>
                <p className="text-[11px] text-slate-600">
                  Exclude slope &gt; 5&deg;, permanent water &gt; 50%; sieve patches &lt; 1,000 m².
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2 block border-t pt-1">02_detect_flood.py</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-blue-600 font-bold block mb-1">STAGE 05</span>
                <span className="font-bold text-slate-900 block mb-1">Zonal Overlay</span>
                <p className="text-[11px] text-slate-600">
                  1 km grid in UTM 43N; 1:1 building centroids; segmented roads; 0 double counting.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2 block border-t pt-1">03_analyze_exposure.py</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-blue-600 font-bold block mb-1">STAGE 06</span>
                <span className="font-bold text-slate-900 block mb-1">Priority Index</span>
                <p className="text-[11px] text-slate-600">
                  Min-Max normalize 5 indicators; composite score (0-100); factor shares & actions.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2 block border-t pt-1">04_compute_priority.py</span>
            </div>
          </div>
        </div>

        {/* Priority Index Mathematical Formula */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>GeoShield Exposure Priority Index Formula & Configurable Weights</span>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <div className="text-emerald-400 font-semibold mb-2"># Composite Index Formulation (pipeline/config.py)</div>
            <div>P_z = 100 * [ (0.25 * F_norm) + (0.25 * B_norm) + (0.20 * R_norm) + (0.15 * P_norm) + (0.15 * A_norm) ]</div>
            <div className="text-slate-400 mt-2 text-[11px]">
              where X_norm = (X_z - min(X)) / (max(X) - min(X)) across all active analysis zones.
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs pt-1">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <span className="font-semibold text-slate-800 block">Flood Extent (F)</span>
              <span className="font-mono text-blue-600 font-bold">w = 0.25 (25%)</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Physical inundation area</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <span className="font-semibold text-slate-800 block">Buildings (B)</span>
              <span className="font-mono text-amber-600 font-bold">w = 0.25 (25%)</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Dwelling footprint count</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <span className="font-semibold text-slate-800 block">Road Network (R)</span>
              <span className="font-mono text-orange-600 font-bold">w = 0.20 (20%)</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Submerged highway length</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <span className="font-semibold text-slate-800 block">Population (P)</span>
              <span className="font-mono text-purple-600 font-bold">w = 0.15 (15%)</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Modelled resident proxy</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <span className="font-semibold text-slate-800 block">Cropland (A)</span>
              <span className="font-mono text-emerald-600 font-bold">w = 0.15 (15%)</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Inundated agricultural area</span>
            </div>
          </div>
        </div>

        {/* Data Provenance Matrix */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Data Sources, Spatial Resolution & Provenance Matrix</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase">
                <tr>
                  <th className="py-2.5 px-3">Layer / Parameter</th>
                  <th className="py-2.5 px-3">Source Agency / Mission</th>
                  <th className="py-2.5 px-3">Resolution</th>
                  <th className="py-2.5 px-3">Acquisition / Edition</th>
                  <th className="py-2.5 px-3">Measurement Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-900">Flood Inundation</td>
                  <td className="py-2 px-3 text-slate-600">ESA Copernicus Sentinel-1A C-SAR</td>
                  <td className="py-2 px-3 font-mono text-slate-500">10 meters</td>
                  <td className="py-2 px-3 font-mono text-slate-500">2023-12-05 & 2023-12-17</td>
                  <td className="py-2 px-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      Direct Sensor Measurement
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-900">Digital Elevation & Slope</td>
                  <td className="py-2 px-3 text-slate-600">Copernicus DEM GLO-30</td>
                  <td className="py-2 px-3 font-mono text-slate-500">30 meters</td>
                  <td className="py-2 px-3 font-mono text-slate-500">2021 Global Edition</td>
                  <td className="py-2 px-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      Direct Sensor Measurement
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-900">Permanent Water Mask</td>
                  <td className="py-2 px-3 text-slate-600">EC JRC Global Surface Water</td>
                  <td className="py-2 px-3 font-mono text-slate-500">30 meters</td>
                  <td className="py-2 px-3 font-mono text-slate-500">1984–2020 Multi-decadal History</td>
                  <td className="py-2 px-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      Direct Baseline
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-900">Land Cover & Cropland</td>
                  <td className="py-2 px-3 text-slate-600">ESA WorldCover 10m v200</td>
                  <td className="py-2 px-3 font-mono text-slate-500">10 meters</td>
                  <td className="py-2 px-3 font-mono text-slate-500">2021 Global Release</td>
                  <td className="py-2 px-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      Direct Baseline
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-900">Building Footprints</td>
                  <td className="py-2 px-3 text-slate-600">OpenStreetMap Contributors</td>
                  <td className="py-2 px-3 font-mono text-slate-500">Vector polygon</td>
                  <td className="py-2 px-3 font-mono text-slate-500">Current Overpass Extraction</td>
                  <td className="py-2 px-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      Direct Vector Survey
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-900">Road Network Lines</td>
                  <td className="py-2 px-3 text-slate-600">OpenStreetMap Contributors</td>
                  <td className="py-2 px-3 font-mono text-slate-500">Vector lines</td>
                  <td className="py-2 px-3 font-mono text-slate-500">Current Overpass Extraction</td>
                  <td className="py-2 px-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      Direct Vector Survey
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-900">Exposed Population</td>
                  <td className="py-2 px-3 text-slate-600">Modelled Household Census Proxy</td>
                  <td className="py-2 px-3 font-mono text-slate-500">Zonal aggregate</td>
                  <td className="py-2 px-3 font-mono text-slate-500">3.8 persons / dwelling (Census Handbook)</td>
                  <td className="py-2 px-3">
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      Modelled Proxy Estimate
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Known Limitations & Physical Radar Caveats */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Documented Assumptions, Physical SAR Caveats & Edge Cases</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-amber-50/50 border border-amber-200 p-3 rounded">
              <span className="font-bold text-slate-900 block mb-1">Urban Radar Double-Bounce</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                In dense downtown cores, perpendicular building walls reflect microwave pulses back to the satellite even when streets are flooded (10-30 cm). This can cause street-level urban inundation to be under-detected by amplitude SAR alone.
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 p-3 rounded">
              <span className="font-bold text-slate-900 block mb-1">Wind-Roughened Surface Waves</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Severe cyclonic wind gusts create capillary waves on wide open water, increasing diffuse backscatter and potentially pushing values above the -15.0 dB calm water threshold.
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 p-3 rounded">
              <span className="font-bold text-slate-900 block mb-1">Temporal Satellite Revisit</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                The Sentinel-1 pass occurred on 2023-12-17 at 00:41 UTC. It captures standing water at that exact moment. Flash floods that peaked and receded prior to the satellite pass are documented through physical field surveys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
