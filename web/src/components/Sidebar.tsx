import React from 'react';
import { LayerVisibility, PriorityClass } from '../types';
import { Layers, Eye, EyeOff, Filter, Info } from 'lucide-react';

interface SidebarProps {
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  classFilter: Record<PriorityClass, boolean>;
  setClassFilter: React.Dispatch<React.SetStateAction<Record<PriorityClass, boolean>>>;
  counts: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  layers,
  setLayers,
  classFilter,
  setClassFilter,
  counts
}) => {
  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleClass = (cls: PriorityClass) => {
    setClassFilter(prev => ({ ...prev, [cls]: !prev[cls] }));
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto select-none shrink-0 z-20">
      {/* Section 1: Map Layers */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 mb-2">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>DATA LAYERS</span>
        </div>

        <div className="space-y-1 text-xs">
          <button
            onClick={() => toggleLayer('priorityGrid')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition text-left ${
              layers.priorityGrid ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
              <span>Priority Grid (1 km²)</span>
            </div>
            {layers.priorityGrid ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={() => toggleLayer('floodExtent')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition text-left ${
              layers.floodExtent ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
              <span>Flood Inundation (3.35 km²)</span>
            </div>
            {layers.floodExtent ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={() => toggleLayer('submergedRoads')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition text-left ${
              layers.submergedRoads ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-0.5 bg-orange-600 rounded" />
              <span>Submerged Roads (17.8 km)</span>
            </div>
            {layers.submergedRoads ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={() => toggleLayer('exposedBuildings')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition text-left ${
              layers.exposedBuildings ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Exposed Bldgs (272 pts)</span>
            </div>
            {layers.exposedBuildings ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Section 2: SAR Imagery Overlays */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>RADAR IMAGERY (VV)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">S1-A RTC</span>
        </div>

        <div className="space-y-1 text-xs">
          <button
            onClick={() => toggleLayer('preSarRaster')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition text-left ${
              layers.preSarRaster ? 'bg-blue-50 text-blue-900 font-medium border border-blue-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div>
              <span className="block">Pre-Flood SAR</span>
              <span className="text-[10px] text-slate-400 font-mono">2023-12-05 (Baseline)</span>
            </div>
            {layers.preSarRaster ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={() => toggleLayer('postSarRaster')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition text-left ${
              layers.postSarRaster ? 'bg-blue-50 text-blue-900 font-medium border border-blue-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div>
              <span className="block">Post-Flood SAR</span>
              <span className="text-[10px] text-slate-400 font-mono">2023-12-17 (Deluge)</span>
            </div>
            {layers.postSarRaster ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Section 3: Filter by Priority Class */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 mb-2">
          <Filter className="w-3.5 h-3.5 text-slate-600" />
          <span>PRIORITY TIER FILTER</span>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={classFilter.CRITICAL}
                onChange={() => toggleClass('CRITICAL')}
                className="rounded border-slate-300 text-red-600 focus:ring-0"
              />
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-slate-800 font-medium">Critical (&ge;60)</span>
              </span>
            </div>
            <span className="font-mono text-slate-500 font-bold">{counts.critical}</span>
          </label>

          <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={classFilter.HIGH}
                onChange={() => toggleClass('HIGH')}
                className="rounded border-slate-300 text-orange-600 focus:ring-0"
              />
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-slate-800 font-medium">High (25-60)</span>
              </span>
            </div>
            <span className="font-mono text-slate-500 font-bold">{counts.high}</span>
          </label>

          <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={classFilter.MODERATE}
                onChange={() => toggleClass('MODERATE')}
                className="rounded border-slate-300 text-amber-600 focus:ring-0"
              />
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-800 font-medium">Moderate (10-25)</span>
              </span>
            </div>
            <span className="font-mono text-slate-500 font-bold">{counts.moderate}</span>
          </label>

          <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={classFilter.LOW}
                onChange={() => toggleClass('LOW')}
                className="rounded border-slate-300 text-emerald-600 focus:ring-0"
              />
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-800 font-medium">Low (&lt;10)</span>
              </span>
            </div>
            <span className="font-mono text-slate-500 font-bold">{counts.low}</span>
          </label>
        </div>
      </div>

      {/* Section 4: Cartographic Legend */}
      <div className="p-3 text-xs">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-2">
          Map Legend
        </span>
        <div className="space-y-1.5 text-[11px] text-slate-600">
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 bg-blue-600/60 border border-blue-500 rounded-xs" />
            <span>Standing Flood (Specular Drop)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-1 bg-orange-600 rounded" />
            <span>Severed Highway / Road Link</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Exposed Building Centroid</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 border border-dashed border-slate-400 bg-slate-100/50" />
            <span>1 km Analysis Grid Cell</span>
          </div>
        </div>

        <div className="mt-4 p-2 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-500 flex items-start space-x-1.5">
          <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
          <span>All statistics computed in UTM 43N (EPSG:32643) with zero double-counting.</span>
        </div>
      </div>
    </aside>
  );
};
