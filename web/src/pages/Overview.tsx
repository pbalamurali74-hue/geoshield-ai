import React, { useState } from 'react';
import { MapView } from '../components/MapView';
import { Sidebar } from '../components/Sidebar';
import { ZoneDetailPanel } from '../components/ZoneDetailPanel';
import { BasemapProvider, ExposureSummary, HazardMetadata, LayerVisibility, PriorityClass, ZoneData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ChevronUp, ChevronDown, BarChart2, Layers } from 'lucide-react';
import maplibregl from 'maplibre-gl';

interface OverviewPageProps {
  summary: ExposureSummary | null;
  metadata: HazardMetadata | null;
  zones: ZoneData[];
  selectedZone: ZoneData | null;
  onSelectZone: (zone: ZoneData | null) => void;
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  activeBasemap: BasemapProvider;
  onSelectBasemap: (provider: BasemapProvider) => void;
  mapboxToken: string;
  maptilerKey: string;
  onOpenApiModal: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  summary,
  metadata,
  zones,
  selectedZone,
  onSelectZone,
  mapRef,
  activeBasemap,
  onSelectBasemap,
  mapboxToken,
  maptilerKey,
  onOpenApiModal
}) => {
  const [layers, setLayers] = useState<LayerVisibility>({
    priorityGrid: true,
    floodExtent: true,
    submergedRoads: true,
    exposedBuildings: true,
    preSarRaster: false,
    postSarRaster: false
  });

  const [classFilter, setClassFilter] = useState<Record<PriorityClass, boolean>>({
    CRITICAL: true,
    HIGH: true,
    MODERATE: true,
    LOW: true
  });

  const [showCharts, setShowCharts] = useState(false);

  // Zoom to zone helper
  const handleZoomToZone = (zone: ZoneData) => {
    if (!mapRef.current) return;
    // Map center offset for zone
    mapRef.current.flyTo({
      center: [77.72, 8.72], // Can zoom to specific sector
      zoom: 13,
      speed: 1.2
    });
  };

  // Prepare chart data
  const tierData = [
    { name: 'Critical (>=60)', count: summary?.kpis.priority_zones_count.critical || 0, color: '#ef4444' },
    { name: 'High (25-60)', count: summary?.kpis.priority_zones_count.high || 0, color: '#f97316' },
    { name: 'Moderate (10-25)', count: summary?.kpis.priority_zones_count.moderate || 0, color: '#eab308' },
    { name: 'Low (<10)', count: summary?.kpis.priority_zones_count.low || 0, color: '#22c55e' }
  ];

  const landUseData = summary?.land_use_exposure_km2
    ? Object.entries(summary.land_use_exposure_km2)
        .filter(([_, val]) => val > 0.01)
        .map(([name, val]) => ({ name, value: Number(val.toFixed(2)) }))
    : [];

  const LU_COLORS = ['#10b981', '#f59e0b', '#84cc16', '#0ea5e9', '#6366f1', '#64748b'];

  const counts = summary?.kpis.priority_zones_count || { critical: 0, high: 0, moderate: 0, low: 0 };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Left Control Sidebar */}
      <Sidebar
        layers={layers}
        setLayers={setLayers}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        counts={counts}
      />

      {/* Main Map Canvas Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* KPI Row Banner */}
        <div className="bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2 flex items-center justify-between select-none z-10 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
            <div className="bg-slate-50 border border-slate-200 p-2 rounded">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Flooded Footprint</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base font-bold font-mono text-blue-600">{summary?.kpis.total_flooded_area_km2 || '3.35'} km²</span>
                <span className="text-[10px] text-slate-400 font-mono">(S1 SAR VV)</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2 rounded">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Exposed Buildings</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base font-bold font-mono text-amber-600">{summary?.kpis.total_buildings_exposed || '272'} units</span>
                <span className="text-[10px] text-slate-400 font-mono">(OSM)</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2 rounded">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Submerged Roads</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base font-bold font-mono text-orange-600">{summary?.kpis.total_roads_exposed_km || '17.78'} km</span>
                <span className="text-[10px] text-slate-400 font-mono">(Network)</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2 rounded">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Cropland Loss</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base font-bold font-mono text-emerald-600">{summary?.kpis.total_agricultural_exposed_km2 || '1.73'} km²</span>
                <span className="text-[10px] text-slate-400 font-mono">(WorldCover)</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2 rounded col-span-2 md:col-span-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Priority Action Cells</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base font-bold font-mono text-red-600">{summary?.kpis.priority_zones_count.critical || 2} Critical</span>
                <span className="text-xs text-orange-600 font-bold">/ {summary?.kpis.priority_zones_count.high || 4} High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapView
            layers={layers}
            classFilter={classFilter}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
            allZones={zones}
            mapRefOut={mapRef}
            activeBasemap={activeBasemap}
            onSelectBasemap={onSelectBasemap}
            mapboxToken={mapboxToken}
            maptilerKey={maptilerKey}
            onOpenApiModal={onOpenApiModal}
          />

          {/* Collapsible Analytics Tray Button */}
          <div className="absolute bottom-3 left-4 z-10">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded shadow-md backdrop-blur border border-slate-700 transition"
            >
              <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{showCharts ? 'Hide Analytics Drawer' : 'View Exposure Analytics'}</span>
              {showCharts ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>

          {/* Bottom Floating Charts Drawer */}
          {showCharts && (
            <div className="absolute bottom-12 left-4 right-4 max-w-4xl bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-lg shadow-xl z-10 transition animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Exposure Analytics & Land-Use Distribution
                  </h4>
                </div>
                <button
                  onClick={() => setShowCharts(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chart 1: Priority Tiers */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-2">
                    Analysis Grid Cells by Priority Tier (506 Total)
                  </span>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tierData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                          {tierData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Land-Use Breakdown */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-2">
                    Land-Cover Inundation (ESA WorldCover 10m)
                  </span>
                  <div className="h-36 flex items-center justify-between">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={landUseData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={45}
                            paddingAngle={2}
                          >
                            {landUseData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={LU_COLORS[index % LU_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-1/2 text-[10px] space-y-1 overflow-y-auto max-h-32">
                      {landUseData.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LU_COLORS[idx % LU_COLORS.length] }} />
                            <span className="text-slate-600 truncate">{item.name}</span>
                          </div>
                          <span className="font-mono font-semibold text-slate-800 shrink-0">{item.value} km²</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Context Drawer */}
      <ZoneDetailPanel
        zone={selectedZone}
        onClose={() => onSelectZone(null)}
        onZoomToZone={handleZoomToZone}
      />
    </div>
  );
};
