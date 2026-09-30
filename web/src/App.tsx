import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Header } from './components/Header';
import { StatsStrip } from './components/StatsStrip';
import { GuidedTourModal } from './components/GuidedTourModal';
import { MapApiModal } from './components/MapApiModal';
import { OverviewPage } from './pages/Overview';
import { HazardAnalysisPage } from './pages/HazardAnalysis';
import { ExposurePage } from './pages/Exposure';
import { PriorityZonesPage } from './pages/PriorityZones';
import { MethodologyPage } from './pages/Methodology';
import { ActiveTab, BasemapProvider, ExposureSummary, HazardMetadata, ZoneData } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [summary, setSummary] = useState<ExposureSummary | null>(null);
  const [metadata, setMetadata] = useState<HazardMetadata | null>(null);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Basemap & Commercial API Configuration
  const [activeBasemap, setActiveBasemap] = useState<BasemapProvider>(() => {
    return (localStorage.getItem('geoshield_basemap') as BasemapProvider) || 'esri-satellite';
  });
  const [mapboxToken, setMapboxToken] = useState<string>(() => {
    return localStorage.getItem('geoshield_mapbox_token') || (import.meta as any).env?.VITE_MAPBOX_TOKEN || '';
  });
  const [maptilerKey, setMaptilerKey] = useState<string>(() => {
    return localStorage.getItem('geoshield_maptiler_key') || (import.meta as any).env?.VITE_MAPTILER_KEY || '';
  });

  const mapRef = useRef<maplibregl.Map | null>(null);

  const handleSelectBasemap = (provider: BasemapProvider) => {
    setActiveBasemap(provider);
    localStorage.setItem('geoshield_basemap', provider);
  };

  const handleSaveMapboxToken = (token: string) => {
    setMapboxToken(token);
    localStorage.setItem('geoshield_mapbox_token', token);
  };

  const handleSaveMaptilerKey = (key: string) => {
    setMaptilerKey(key);
    localStorage.setItem('geoshield_maptiler_key', key);
  };

  // Fetch pipeline outputs on mount
  useEffect(() => {
    const loadPipelineData = async () => {
      try {
        setLoading(true);
        const [sumRes, metaRes, rankRes] = await Promise.all([
          fetch('/data/exposure_summary.json'),
          fetch('/data/hazard_metadata.json'),
          fetch('/data/zone_rankings.json')
        ]);

        if (!sumRes.ok || !metaRes.ok || !rankRes.ok) {
          throw new Error('Pipeline analysis data files not found in web/public/data/');
        }

        const summaryJson = await sumRes.json();
        const metaJson = await metaRes.json();
        const rankingsJson = await rankRes.json();

        setSummary(summaryJson);
        setMetadata(metaJson);
        setZones(rankingsJson);

        // Pre-select Top Rank zone by default
        if (rankingsJson && rankingsJson.length > 0) {
          setSelectedZone(rankingsJson[0]);
        }
      } catch (err) {
        console.error('Failed to load pipeline data:', err);
        setError('Disaster exposure analytics data unavailable. Please verify pipeline execution.');
      } finally {
        setLoading(false);
      }
    };

    loadPipelineData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white select-none">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-bold tracking-wider text-sm font-mono">INITIALIZING GEOSHIELD PLATFORM</span>
        </div>
        <p className="text-xs text-slate-400 font-mono">Streaming Sentinel-1 SAR exposure tensors & zonal matrices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white select-none p-6 text-center">
        <span className="text-red-500 font-mono text-sm font-bold mb-2">SYSTEM TELEMETRY ERROR</span>
        <p className="text-slate-400 text-xs max-w-md mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded font-medium transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 text-slate-900">
      {/* Header with Navigation, Tour Trigger, and Map API Trigger */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onStartTour={() => setIsTourOpen(true)}
        onOpenMapApi={() => setIsApiModalOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'overview' && (
          <OverviewPage
            summary={summary}
            metadata={metadata}
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            mapRef={mapRef}
            activeBasemap={activeBasemap}
            onSelectBasemap={handleSelectBasemap}
            mapboxToken={mapboxToken}
            maptilerKey={maptilerKey}
            onOpenApiModal={() => setIsApiModalOpen(true)}
          />
        )}

        {activeTab === 'hazard' && (
          <HazardAnalysisPage metadata={metadata} />
        )}

        {activeTab === 'exposure' && (
          <ExposurePage
            summary={summary}
            zones={zones}
            onSelectZone={(z) => {
              setSelectedZone(z);
              setActiveTab('overview');
            }}
          />
        )}

        {activeTab === 'priority' && (
          <PriorityZonesPage
            zones={zones}
            summary={summary}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            onSwitchToOverview={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'methodology' && (
          <MethodologyPage />
        )}
      </main>

      {/* Bottom Monospace Telemetry Strip */}
      <StatsStrip summary={summary} />

      {/* Guided Tour Modal */}
      <GuidedTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        setActiveTab={setActiveTab}
        onSelectZone={setSelectedZone}
        topZone={zones.length > 0 ? zones[0] : null}
      />

      {/* Map APIs & Developer Endpoints Modal */}
      <MapApiModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        activeBasemap={activeBasemap}
        onSelectBasemap={handleSelectBasemap}
        mapboxToken={mapboxToken}
        onSaveMapboxToken={handleSaveMapboxToken}
        maptilerKey={maptilerKey}
        onSaveMaptilerKey={handleSaveMaptilerKey}
      />
    </div>
  );
};
