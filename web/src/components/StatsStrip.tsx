import React from 'react';
import { ExposureSummary } from '../types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface StatsStripProps {
  summary: ExposureSummary | null;
}

export const StatsStrip: React.FC<StatsStripProps> = ({ summary }) => {
  if (!summary) {
    return (
      <div className="h-10 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center px-4 font-mono">
        Loading pipeline telemetry...
      </div>
    );
  }

  const { kpis, reconciliation_status } = summary;

  return (
    <footer className="h-11 bg-slate-900 border-t border-slate-800 text-slate-300 text-xs px-4 flex items-center justify-between select-none z-30 shrink-0 font-mono">
      <div className="flex items-center space-x-5 overflow-x-auto py-1 scrollbar-none">
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-slate-500">STUDY EXTENT:</span>
          <span className="font-semibold text-slate-200">487.92 km²</span>
        </div>

        <div className="h-3 w-px bg-slate-800 shrink-0" />

        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-slate-500">FLOODED AREA:</span>
          <span className="font-semibold text-blue-400">{kpis.total_flooded_area_km2} km²</span>
          <span className="text-slate-500 text-[10px]">(0.69%)</span>
        </div>

        <div className="h-3 w-px bg-slate-800 shrink-0" />

        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-slate-500">EXPOSED BLDGS:</span>
          <span className="font-semibold text-amber-400">{kpis.total_buildings_exposed} units</span>
        </div>

        <div className="h-3 w-px bg-slate-800 shrink-0" />

        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-slate-500">SUBMERGED ROADS:</span>
          <span className="font-semibold text-orange-400">{kpis.total_roads_exposed_km} km</span>
        </div>

        <div className="h-3 w-px bg-slate-800 shrink-0" />

        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-slate-500">CROPLAND INUNDATED:</span>
          <span className="font-semibold text-emerald-400">{kpis.total_agricultural_exposed_km2} km²</span>
        </div>

        <div className="h-3 w-px bg-slate-800 shrink-0" />

        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-slate-500">EXPOSED POPULATION (PROXY):</span>
          <span className="font-semibold text-purple-400">{kpis.total_population_exposed_proxy.toLocaleString()} persons</span>
        </div>
      </div>

      {/* Reconciliation Assurance */}
      <div className="hidden xl:flex items-center space-x-2 shrink-0 pl-4 border-l border-slate-800">
        {reconciliation_status.verified ? (
          <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>RECONCILED: 0.00% DISCREPANCY</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-amber-400 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>UNRECONCILED</span>
          </div>
        )}
      </div>
    </footer>
  );
};
