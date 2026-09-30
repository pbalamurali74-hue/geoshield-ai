import React from 'react';
import { Shield, Play, Layers, Compass, BarChart3, ListFilter, FileText, Globe } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onStartTour: () => void;
  onOpenMapApi?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onStartTour, onOpenMapApi }) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Compass className="w-4 h-4" /> },
    { id: 'hazard', label: 'Hazard Analysis', icon: <Layers className="w-4 h-4" /> },
    { id: 'exposure', label: 'Exposure', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'priority', label: 'Priority Zones', icon: <ListFilter className="w-4 h-4" /> },
    { id: 'methodology', label: 'Methodology', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 select-none z-30 shrink-0">
      {/* Top Banner */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600/30 p-1.5 rounded border border-blue-500/40 text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-base text-white">GEOSHIELD</span>
              <span className="text-xs bg-slate-800 text-blue-400 px-2 py-0.5 rounded font-mono border border-slate-700">v1.0-DEMO</span>
              <span className="text-xs text-slate-400 border-l border-slate-700 pl-2">Flood Exposure & Emergency Decision Intelligence</span>
            </div>
          </div>
        </div>

        {/* Sensor & Event Metadata */}
        <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">EVENT:</span>
            <span className="text-slate-200">TN Extreme Deluge (Dec 2023)</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-400">SENSOR:</span>
            <span className="text-blue-300">Sentinel-1A C-SAR (Orbit 165 Desc)</span>
          </div>
          {onOpenMapApi && (
            <button
              onClick={onOpenMapApi}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded font-sans font-medium transition border border-slate-700 hover:border-slate-600 shadow-sm"
              title="Configure Map APIs, Basemaps, and REST Endpoints"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Map APIs</span>
            </button>
          )}
          <button
            onClick={onStartTour}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-sans font-medium transition shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Guided Tour (2 min)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 flex items-center space-x-1 bg-slate-900/90 text-sm">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 border-b-2 font-medium transition text-xs tracking-wide ${
                isActive
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
