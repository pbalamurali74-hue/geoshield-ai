import React from 'react';
import { ZoneData } from '../types';
import { X, MapPin, AlertCircle, Building2, Route, Trees, Users, ArrowUpRight } from 'lucide-react';

interface ZoneDetailPanelProps {
  zone: ZoneData | null;
  onClose: () => void;
  onZoomToZone?: (zone: ZoneData) => void;
}

export const ZoneDetailPanel: React.FC<ZoneDetailPanelProps> = ({ zone, onClose, onZoomToZone }) => {
  if (!zone) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col justify-center items-center text-center text-slate-400 select-none">
        <MapPin className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
        <h4 className="text-sm font-semibold text-slate-700">No Zone Selected</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
          Click any 1 km² grid cell on the map or select a row in Priority Zones table.
        </p>
      </div>
    );
  }

  const {
    zone_id,
    locality_name,
    rank,
    priority_score,
    exposure_class,
    class_color,
    flooded_area_km2,
    buildings_exposed,
    roads_exposed_km,
    agricultural_exposed_km2,
    population_exposed_proxy,
    primary_reason,
    recommended_action,
    contributing_factors
  } = zone;

  return (
    <div className="w-84 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto select-none shadow-sm z-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Analysis Cell Telemetry
          </span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{zone_id}</h3>
            <p className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{locality_name}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-500">Rank #{rank}</span>
            <div className="mt-0.5">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded text-white inline-block shadow-xs"
                style={{ backgroundColor: class_color }}
              >
                {exposure_class}
              </span>
            </div>
          </div>
        </div>

        {/* Priority Score Meter */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex justify-between items-baseline text-xs mb-1">
            <span className="font-medium text-slate-600">GeoShield Priority Index:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{priority_score.toFixed(1)} / 100</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(2, priority_score))}%`, backgroundColor: class_color }}
            />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 space-y-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-2">
            Measured Inundation & Exposure
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="flex items-center space-x-1.5 text-blue-600 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[11px] font-medium text-slate-600">Flooded Area</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">{flooded_area_km2.toFixed(3)} km²</span>
              <span className="text-[10px] text-slate-500 block">{(flooded_area_km2 * 100).toFixed(1)}% of zone</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="flex items-center space-x-1.5 text-amber-600 mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium text-slate-600">Exposed Bldgs</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">{buildings_exposed} units</span>
              <span className="text-[10px] text-slate-500 block">Direct footprint hit</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="flex items-center space-x-1.5 text-orange-600 mb-1">
                <Route className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium text-slate-600">Submerged Roads</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">{roads_exposed_km.toFixed(2)} km</span>
              <span className="text-[10px] text-slate-500 block">Corridor severance</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="flex items-center space-x-1.5 text-emerald-600 mb-1">
                <Trees className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium text-slate-600">Inundated Crops</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">{agricultural_exposed_km2.toFixed(3)} km²</span>
              <span className="text-[10px] text-slate-500 block">ESA Cropland (40)</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded mt-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-600" />
              <div>
                <span className="text-[11px] font-medium text-slate-700 block">Exposed Population</span>
                <span className="text-[10px] text-slate-500">Modelled proxy (3.8 / dwelling)</span>
              </div>
            </div>
            <span className="font-mono font-bold text-slate-900 text-sm">{population_exposed_proxy.toLocaleString()} persons</span>
          </div>
        </div>

        {/* Factor Breakdown (Why this priority?) */}
        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Why this priority? (Factor Shares)
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-600">Building Exposure</span>
                <span className="font-mono font-semibold text-slate-800">{contributing_factors.building_exposure_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${contributing_factors.building_exposure_pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-600">Road Disruption</span>
                <span className="font-mono font-semibold text-slate-800">{contributing_factors.road_disruption_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: `${contributing_factors.road_disruption_pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-600">Flood Overlap Share</span>
                <span className="font-mono font-semibold text-slate-800">{contributing_factors.flood_overlap_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${contributing_factors.flood_overlap_pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-600">Agricultural Cropland Loss</span>
                <span className="font-mono font-semibold text-slate-800">{contributing_factors.cropland_loss_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${contributing_factors.cropland_loss_pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-600">Population Density Proxy</span>
                <span className="font-mono font-semibold text-slate-800">{contributing_factors.population_proxy_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${contributing_factors.population_proxy_pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Decision Support Action */}
        <div className="border-t border-slate-200 pt-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-1.5">
            Recommended Action (Decision Support)
          </span>
          <div className="bg-blue-50/60 border border-blue-200/80 rounded p-2.5 text-xs text-slate-700 leading-relaxed">
            <div className="flex items-start space-x-1.5">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{recommended_action}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {onZoomToZone && (
          <div className="pt-2">
            <button
              onClick={() => onZoomToZone(zone)}
              className="w-full flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium py-2 rounded transition"
            >
              <span>Focus Map on Zone</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
