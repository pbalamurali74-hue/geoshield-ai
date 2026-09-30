import React, { useState, useMemo } from 'react';
import { ExposureSummary, PriorityClass, ZoneData } from '../types';
import { Search, Filter, ArrowUpDown, SlidersHorizontal, Check, AlertCircle, ArrowRight } from 'lucide-react';

interface PriorityZonesPageProps {
  zones: ZoneData[];
  summary: ExposureSummary | null;
  selectedZone: ZoneData | null;
  onSelectZone: (zone: ZoneData) => void;
  onSwitchToOverview: () => void;
}

export const PriorityZonesPage: React.FC<PriorityZonesPageProps> = ({
  zones,
  summary,
  selectedZone,
  onSelectZone,
  onSwitchToOverview
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof ZoneData>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [showSensitivity, setShowSensitivity] = useState<boolean>(false);

  // Filter and sort active zones
  const activeZones = useMemo(() => {
    return zones.filter(z => z.flooded_area_km2 > 0 || z.buildings_exposed > 0 || z.roads_exposed_km > 0);
  }, [zones]);

  const filteredZones = useMemo(() => {
    return activeZones.filter(z => {
      const matchesSearch =
        z.zone_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.locality_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.primary_reason.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = selectedClass === 'ALL' || z.exposure_class === selectedClass;

      return matchesSearch && matchesClass;
    }).sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [activeZones, searchQuery, selectedClass, sortField, sortAsc]);

  const handleSort = (field: keyof ZoneData) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank' ? true : false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-6 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                DECISION SUPPORT RANKING
              </span>
              <span className="text-xs text-slate-500 font-mono">1 km² ZONAL INDEX</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              GeoShield Exposure Priority Zones
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Explainable multi-criteria ranking of 1 km² analysis sectors to inform rapid emergency resource allocation.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSensitivity(!showSensitivity)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                showSensitivity
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sensitivity Analysis</span>
            </button>
          </div>
        </div>

        {/* Sensitivity Analysis Drawer */}
        {showSensitivity && summary?.sensitivity_analysis && (
          <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Sensitivity Matrix: Ranking Stability Under Varying Operational Doctrines
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluates how the Top 10 priority zones shift when weights emphasize urban infrastructure vs agricultural food security.
                </p>
              </div>
              <button
                onClick={() => setShowSensitivity(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase bg-slate-50">
                    <th className="py-2 px-3">Zone ID</th>
                    <th className="py-2 px-3">Locality Sector</th>
                    <th className="py-2 px-3">Baseline Rank (Default)</th>
                    <th className="py-2 px-3">Infra-Heavy Rank (Roads/Bldgs 70%)</th>
                    <th className="py-2 px-3">Agri-Heavy Rank (Cropland 40%)</th>
                    <th className="py-2 px-3">Stability Insight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.sensitivity_analysis.top10_comparison.map((item) => (
                    <tr key={item.zone_id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.zone_id}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.locality}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">
                        Rank #{item.baseline_rank} ({item.baseline_score})
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        Rank #{item.infra_rank} ({item.infra_score})
                        {item.rank_shift_infra !== 0 && (
                          <span className={`ml-1.5 text-[10px] font-bold ${item.rank_shift_infra > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {item.rank_shift_infra > 0 ? `+${item.rank_shift_infra}` : item.rank_shift_infra}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        Rank #{item.agri_rank} ({item.agri_score})
                        {item.rank_shift_agri !== 0 && (
                          <span className={`ml-1.5 text-[10px] font-bold ${item.rank_shift_agri > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {item.rank_shift_agri > 0 ? `+${item.rank_shift_agri}` : item.rank_shift_agri}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {item.rank_shift_infra === 0 ? 'Stable urban core' : item.rank_shift_agri > 0 ? 'High agricultural surge' : 'Rural-urban mixed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by zone ID (e.g. ZONE_R14_C11) or locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            />
          </div>

          {/* Tier Buttons */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  selectedClass === cls
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          <span className="text-slate-400 font-mono text-[11px] self-center">
            Showing {filteredZones.length} of {activeZones.length} active zones
          </span>
        </div>

        {/* Main Ranked Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                <tr>
                  <th onClick={() => handleSort('rank')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900">
                    <div className="flex items-center space-x-1">
                      <span>Rank</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('zone_id')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900">
                    <div className="flex items-center space-x-1">
                      <span>Zone ID & Sector</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('priority_score')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900">
                    <div className="flex items-center space-x-1">
                      <span>Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Class</th>
                  <th onClick={() => handleSort('flooded_area_km2')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span>Flood (km²)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('buildings_exposed')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span>Bldgs</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('roads_exposed_km')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span>Roads (km)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('agricultural_exposed_km2')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span>Crops (km²)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Primary Contributing Factor</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredZones.map((z) => {
                  const isSelected = selectedZone?.zone_id === z.zone_id;
                  return (
                    <tr
                      key={z.zone_id}
                      onClick={() => onSelectZone(z)}
                      className={`hover:bg-blue-50/50 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/80 ring-1 ring-blue-400' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-500">#{z.rank}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-slate-900 block">{z.zone_id}</span>
                        <span className="text-[11px] text-slate-500 truncate block max-w-xs">{z.locality_name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{z.priority_score.toFixed(1)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded text-white inline-block"
                          style={{ backgroundColor: z.class_color }}
                        >
                          {z.exposure_class}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-blue-600 font-semibold">{z.flooded_area_km2.toFixed(3)}</td>
                      <td className="py-2.5 px-3 font-mono text-right text-amber-600 font-semibold">{z.buildings_exposed}</td>
                      <td className="py-2.5 px-3 font-mono text-right text-orange-600 font-semibold">{z.roads_exposed_km.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-semibold">{z.agricultural_exposed_km2.toFixed(3)}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-xs truncate" title={z.primary_reason}>
                        {z.primary_reason}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectZone(z);
                            onSwitchToOverview();
                          }}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium text-[11px] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition"
                        >
                          <span>Map</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
