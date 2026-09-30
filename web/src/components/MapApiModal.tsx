import React, { useState } from 'react';
import { Key, Globe, Copy, Check, ExternalLink, X, Database, Terminal, Shield } from 'lucide-react';
import { BasemapProvider } from '../types';

interface MapApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBasemap: BasemapProvider;
  onSelectBasemap: (provider: BasemapProvider) => void;
  mapboxToken: string;
  onSaveMapboxToken: (token: string) => void;
  maptilerKey: string;
  onSaveMaptilerKey: (key: string) => void;
}

export const MapApiModal: React.FC<MapApiModalProps> = ({
  isOpen,
  onClose,
  activeBasemap,
  onSelectBasemap,
  mapboxToken,
  onSaveMapboxToken,
  maptilerKey,
  onSaveMaptilerKey
}) => {
  const [activeTab, setActiveTab] = useState<'basemaps' | 'keys' | 'data-api'>('basemaps');
  const [tokenInput, setTokenInput] = useState(mapboxToken);
  const [keyInput, setKeyInput] = useState(maptilerKey);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const origin = window.location.origin;

  const dataEndpoints = [
    {
      name: 'Priority Analysis Zones (1 km² Grid)',
      format: 'GeoJSON (EPSG:4326)',
      url: `${origin}/data/priority_zones.geojson`,
      desc: 'All 506 sectors with priority scores, rankings, exposure classes, and factor shares.'
    },
    {
      name: 'Detected Flood Inundation Polygons',
      format: 'GeoJSON (EPSG:4326)',
      url: `${origin}/data/flood_extent.geojson`,
      desc: '881 sieved inundation contours derived from Sentinel-1 SAR change detection.'
    },
    {
      name: 'Exposed Infrastructure Points & Corridors',
      format: 'GeoJSON (EPSG:4326)',
      url: `${origin}/data/exposed_infrastructure.geojson`,
      desc: '272 building centroids (1:1) and 17.78 km of submerged road line segments.'
    },
    {
      name: 'Exposure Summary & KPI Matrix',
      format: 'JSON REST',
      url: `${origin}/data/exposure_summary.json`,
      desc: 'Reconciliation statistics, land use breakdown, sensitivity rankings, and index weights.'
    },
    {
      name: 'Sentinel-1 SAR Radar Metadata',
      format: 'JSON REST',
      url: `${origin}/data/hazard_metadata.json`,
      desc: 'Sensor, Relative Orbit 165, dual thresholds, and temporal timestamps.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 rounded-lg border border-blue-500/40">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center space-x-2">
                <span>Map APIs & Geospatial Data Endpoints</span>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                  ENTERPRISE GIS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Switch basemap providers, configure commercial API keys, or consume GeoJSON layers in QGIS & ArcGIS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('basemaps')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'basemaps'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Basemap APIs</span>
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'keys'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Commercial API Keys (Mapbox / MapTiler)</span>
          </button>

          <button
            onClick={() => setActiveTab('data-api')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'data-api'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>GIS Developer REST / GeoJSON API</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: BASEMAPS */}
          {activeTab === 'basemaps' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Available Map Basemap Tile Services</h4>
                <p className="text-slate-600 text-xs">
                  GEOSHIELD integrates multiple high-availability open-access and commercial tile servers. Select a provider below to immediately switch the map canvas:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ESRI Satellite */}
                <div
                  onClick={() => onSelectBasemap('esri-satellite')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    activeBasemap === 'esri-satellite'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>🛰️ ESRI World Imagery</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-semibold">
                        Free / No Key
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      High-resolution orbital satellite photography. Ideal for ground-truthing flood boundaries against agricultural fields and real riverbeds.
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-400">
                    Source: Esri, Maxar, Earthstar Geographics
                  </div>
                </div>

                {/* Carto Positron */}
                <div
                  onClick={() => onSelectBasemap('carto-light')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    activeBasemap === 'carto-light'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>☀️ Carto Positron (Light)</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-semibold">
                        Free / No Key
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Minimalist, low-contrast grayscale base cartography. High visual contrast for priority hazard heatmaps and road disruption layers.
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-400">
                    Source: CARTO &copy; OpenStreetMap
                  </div>
                </div>

                {/* Carto Dark */}
                <div
                  onClick={() => onSelectBasemap('carto-dark')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    activeBasemap === 'carto-dark'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>🌙 Carto Dark Matter</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-semibold">
                        Free / No Key
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Deep charcoal dark mode cartography. Optimized for emergency operations center projection screens and neon hazard layers.
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-400">
                    Source: CARTO &copy; OpenStreetMap
                  </div>
                </div>

                {/* OpenStreetMap */}
                <div
                  onClick={() => onSelectBasemap('osm-streets')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    activeBasemap === 'osm-streets'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>🗺️ OpenStreetMap Standard</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-semibold">
                        Free / No Key
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Full community street map showing street names, ward divisions, bridges, and infrastructure landmarks across Tirunelveli.
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-400">
                    Source: OpenStreetMap Contributors
                  </div>
                </div>

                {/* OpenTopoMap */}
                <div
                  onClick={() => onSelectBasemap('opentopo')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    activeBasemap === 'opentopo'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>⛰️ OpenTopoMap (Terrain)</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-semibold">
                        Free / No Key
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Topographic contours and shaded elevation relief. Demonstrates how terrain slopes and valleys guide floodwater accumulation.
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-400">
                    Source: SRTM / OpenTopoMap
                  </div>
                </div>

                {/* Mapbox Custom */}
                <div
                  onClick={() => {
                    if (mapboxToken) onSelectBasemap('mapbox');
                    else setActiveTab('keys');
                  }}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    activeBasemap === 'mapbox'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>⚡ Mapbox Satellite Streets</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                          mapboxToken
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {mapboxToken ? 'Key Configured' : 'Requires API Key'}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Commercial Mapbox raster/vector hybrid tiles with high-clarity labels and seamless global satellite coverage.
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-400">
                    Source: Mapbox GL API
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: API KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Commercial Map API Keys Configuration</h4>
                <p className="text-slate-600 text-xs">
                  Optionally integrate your own commercial API keys. Keys are stored locally in your browser session (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">localStorage</code>) and are never transmitted to external servers.
                </p>
              </div>

              {/* Mapbox Key */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Mapbox Access Token</span>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                  </div>
                  <a
                    href="https://account.mapbox.com/access-tokens/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1 text-[11px]"
                  >
                    <span>Get free Mapbox token</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="password"
                    placeholder="pk.eyJ1Ijo..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      onSaveMapboxToken(tokenInput);
                      if (tokenInput.trim()) onSelectBasemap('mapbox');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition"
                  >
                    Save & Activate
                  </button>
                  {mapboxToken && (
                    <button
                      onClick={() => {
                        setTokenInput('');
                        onSaveMapboxToken('');
                        onSelectBasemap('esri-satellite');
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Enables Mapbox Satellite-Streets v12 and Mapbox Navigation Dark basemap styles.
                </p>
              </div>

              {/* MapTiler Key */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">MapTiler Cloud API Key</span>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                  </div>
                  <a
                    href="https://cloud.maptiler.com/account/keys/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1 text-[11px]"
                  >
                    <span>Get free MapTiler key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="password"
                    placeholder="maptiler_key..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      onSaveMaptilerKey(keyInput);
                      if (keyInput.trim()) onSelectBasemap('maptiler');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition"
                  >
                    Save & Activate
                  </button>
                  {maptilerKey && (
                    <button
                      onClick={() => {
                        setKeyInput('');
                        onSaveMaptilerKey('');
                        onSelectBasemap('esri-satellite');
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Enables MapTiler Satellite Hybrid and Terrain 3D raster styles.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: DATA API */}
          {activeTab === 'data-api' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">GIS Developer REST & GeoJSON Data Endpoints</h4>
                <p className="text-slate-600 text-xs">
                  All hazard layers and exposure indices are served as standardized open-access endpoints. Load them directly into QGIS, ArcGIS Online, Python GeoPandas, or web applications with zero authentication barriers:
                </p>
              </div>

              <div className="space-y-2">
                {dataEndpoints.map((ep) => (
                  <div key={ep.name} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{ep.name}</span>
                        <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          {ep.format}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(ep.url, ep.name)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium text-[11px]"
                      >
                        {copiedUrl === ep.name ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-slate-500 text-[11px]">{ep.desc}</p>
                    <code className="text-[10px] font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-700 select-all overflow-x-auto block">
                      {ep.url}
                    </code>
                  </div>
                ))}
              </div>

              {/* Code Snippet Box */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-lg space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quickstart: Ingest into Python GeoPandas</span>
                  </div>
                </div>
                <pre className="text-emerald-400 overflow-x-auto whitespace-pre">
{`import geopandas as gpd

# Fetch verified priority analysis cells directly from GEOSHIELD Edge API
url = "${origin}/data/priority_zones.geojson"
gdf = gpd.read_file(url)

# Filter Critical Priority Action Zones
critical_zones = gdf[gdf['exposure_class'] == 'CRITICAL']
print(f"Loaded {len(critical_zones)} Critical Action Zones:")
print(critical_zones[['zone_id', 'locality_name', 'priority_score', 'flooded_area_km2']])`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Basemap: <strong className="text-slate-800 capitalize">{activeBasemap.replace('-', ' ')}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
