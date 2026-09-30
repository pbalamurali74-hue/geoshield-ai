import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Globe, Key, ChevronDown, Check } from 'lucide-react';
import { BasemapProvider, LayerVisibility, PriorityClass, ZoneData } from '../types';

interface MapViewProps {
  layers: LayerVisibility;
  classFilter: Record<PriorityClass, boolean>;
  selectedZone: ZoneData | null;
  onSelectZone: (zone: ZoneData | null) => void;
  allZones: ZoneData[];
  mapRefOut?: React.MutableRefObject<maplibregl.Map | null>;
  activeBasemap: BasemapProvider;
  onSelectBasemap: (provider: BasemapProvider) => void;
  mapboxToken: string;
  maptilerKey: string;
  onOpenApiModal: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  layers,
  classFilter,
  selectedZone,
  onSelectZone,
  allZones,
  mapRefOut,
  activeBasemap,
  onSelectBasemap,
  mapboxToken,
  maptilerKey,
  onOpenApiModal
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const hoverPopup = useRef<maplibregl.Popup | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Geographic center of Tirunelveli & Thamirabarani Basin
  const CENTER_COORDS: [number, number] = [77.72, 8.72];
  const DEFAULT_ZOOM = 11.5;

  // SAR raster exact WGS84 bounding coordinates
  const SAR_BOUNDS: [[number, number], [number, number], [number, number], [number, number]] = [
    [77.61994930954828, 8.820060619487881], // Top-Left
    [77.82000652370476, 8.820060619487881], // Top-Right
    [77.82000652370476, 8.61991394040965],  // Bottom-Right
    [77.61994930954828, 8.61991394040965]   // Bottom-Left
  ];

  // Initialize Map with Multi-Basemap Raster Sources
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const baseSources: Record<string, any> = {
      'source-esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '&copy; Esri, Maxar, Earthstar Geographics'
      },
      'source-carto-light': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; CARTO &copy; OpenStreetMap'
      },
      'source-carto-dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; CARTO &copy; OpenStreetMap'
      },
      'source-osm-streets': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      },
      'source-opentopo': {
        type: 'raster',
        tiles: [
          'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        maxzoom: 17,
        attribution: '&copy; OpenTopoMap &copy; OpenStreetMap'
      }
    };

    if (mapboxToken) {
      baseSources['source-mapbox'] = {
        type: 'raster',
        tiles: [
          `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
        ],
        tileSize: 256,
        attribution: '&copy; Mapbox &copy; OpenStreetMap'
      };
    }

    if (maptilerKey) {
      baseSources['source-maptiler'] = {
        type: 'raster',
        tiles: [
          `https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.jpg?key=${maptilerKey}`
        ],
        tileSize: 256,
        attribution: '&copy; MapTiler &copy; OpenStreetMap'
      };
    }

    const baseLayers: any[] = [
      {
        id: 'base-esri-satellite',
        type: 'raster',
        source: 'source-esri-satellite',
        layout: { visibility: activeBasemap === 'esri-satellite' ? 'visible' : 'none' }
      },
      {
        id: 'base-carto-light',
        type: 'raster',
        source: 'source-carto-light',
        layout: { visibility: activeBasemap === 'carto-light' ? 'visible' : 'none' }
      },
      {
        id: 'base-carto-dark',
        type: 'raster',
        source: 'source-carto-dark',
        layout: { visibility: activeBasemap === 'carto-dark' ? 'visible' : 'none' }
      },
      {
        id: 'base-osm-streets',
        type: 'raster',
        source: 'source-osm-streets',
        layout: { visibility: activeBasemap === 'osm-streets' ? 'visible' : 'none' }
      },
      {
        id: 'base-opentopo',
        type: 'raster',
        source: 'source-opentopo',
        layout: { visibility: activeBasemap === 'opentopo' ? 'visible' : 'none' }
      }
    ];

    if (mapboxToken) {
      baseLayers.push({
        id: 'base-mapbox',
        type: 'raster',
        source: 'source-mapbox',
        layout: { visibility: activeBasemap === 'mapbox' ? 'visible' : 'none' }
      });
    }

    if (maptilerKey) {
      baseLayers.push({
        id: 'base-maptiler',
        type: 'raster',
        source: 'source-maptiler',
        layout: { visibility: activeBasemap === 'maptiler' ? 'visible' : 'none' }
      });
    }

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8 as const,
        sources: baseSources,
        layers: baseLayers
      },
      center: CENTER_COORDS,
      zoom: DEFAULT_ZOOM,
      minZoom: 8,
      maxZoom: 18,
      pitchWithRotate: false,
      dragRotate: false
    });

    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapInstance.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    hoverPopup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12
    });

    mapInstance.on('load', () => {
      // 1. Add Pre and Post SAR Raster Sources
      mapInstance.addSource('pre-sar-source', {
        type: 'image',
        url: '/data/pre_sar.png',
        coordinates: SAR_BOUNDS
      });

      mapInstance.addSource('post-sar-source', {
        type: 'image',
        url: '/data/post_sar.png',
        coordinates: SAR_BOUNDS
      });

      mapInstance.addLayer({
        id: 'pre-sar-layer',
        type: 'raster',
        source: 'pre-sar-source',
        paint: { 'raster-opacity': 0.85 },
        layout: { visibility: 'none' }
      });

      mapInstance.addLayer({
        id: 'post-sar-layer',
        type: 'raster',
        source: 'post-sar-source',
        paint: { 'raster-opacity': 0.85 },
        layout: { visibility: 'none' }
      });

      // 2. Add Priority Zones Grid Source
      mapInstance.addSource('priority-zones-source', {
        type: 'geojson',
        data: '/data/priority_zones.geojson'
      });

      mapInstance.addLayer({
        id: 'priority-zones-fill',
        type: 'fill',
        source: 'priority-zones-source',
        paint: {
          'fill-color': [
            'match',
            ['get', 'exposure_class'],
            'CRITICAL', '#ef4444',
            'HIGH', '#f97316',
            'MODERATE', '#eab308',
            'LOW', '#22c55e',
            '#94a3b8'
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'exposure_class'], 'LOW'], 0.08,
            0.35
          ]
        }
      });

      mapInstance.addLayer({
        id: 'priority-zones-line',
        type: 'line',
        source: 'priority-zones-source',
        paint: {
          'line-color': '#64748b',
          'line-width': 0.75,
          'line-opacity': 0.4
        }
      });

      // Selected Zone Highlight Outline
      mapInstance.addLayer({
        id: 'priority-zone-selected',
        type: 'line',
        source: 'priority-zones-source',
        filter: ['==', 'zone_id', ''],
        paint: {
          'line-color': '#06b6d4',
          'line-width': 3,
          'line-opacity': 1.0
        }
      });

      // 3. Add Flood Inundation Extent Source & Layer
      mapInstance.addSource('flood-extent-source', {
        type: 'geojson',
        data: '/data/flood_extent.geojson'
      });

      mapInstance.addLayer({
        id: 'flood-extent-fill',
        type: 'fill',
        source: 'flood-extent-source',
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.65
        }
      });

      mapInstance.addLayer({
        id: 'flood-extent-line',
        type: 'line',
        source: 'flood-extent-source',
        paint: {
          'line-color': '#1d4ed8',
          'line-width': 1.2
        }
      });

      // 4. Add Exposed Infrastructure Source & Layers
      mapInstance.addSource('exposed-infra-source', {
        type: 'geojson',
        data: '/data/exposed_infrastructure.geojson'
      });

      // Submerged Roads
      mapInstance.addLayer({
        id: 'submerged-roads-layer',
        type: 'line',
        source: 'exposed-infra-source',
        filter: ['==', 'feature_type', 'road'],
        paint: {
          'line-color': '#ea580c',
          'line-width': 2.5,
          'line-opacity': 0.9
        }
      });

      // Exposed Buildings Centroids
      mapInstance.addLayer({
        id: 'exposed-buildings-layer',
        type: 'circle',
        source: 'exposed-infra-source',
        filter: ['==', 'feature_type', 'building'],
        paint: {
          'circle-color': '#f59e0b',
          'circle-radius': 3.5,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Map Interactions
      mapInstance.on('mousemove', 'priority-zones-fill', (e) => {
        if (!e.features || !e.features.length) return;
        mapInstance.getCanvas().style.cursor = 'pointer';

        const feat = e.features[0];
        const props = feat.properties;
        const coordinates = e.lngLat;

        if (hoverPopup.current) {
          hoverPopup.current
            .setLngLat(coordinates)
            .setHTML(`
              <div class="p-1 font-sans text-xs">
                <div class="font-bold text-slate-900">${props?.zone_id}</div>
                <div class="text-[11px] text-slate-600">${props?.locality_name}</div>
                <div class="mt-1 flex items-center justify-between space-x-2 text-[10px]">
                  <span class="font-medium text-slate-500">Priority Score:</span>
                  <span class="font-mono font-bold text-slate-800">${Number(props?.priority_score).toFixed(1)}</span>
                </div>
                <div class="flex items-center justify-between space-x-2 text-[10px]">
                  <span class="font-medium text-slate-500">Flooded Area:</span>
                  <span class="font-mono text-blue-600 font-semibold">${Number(props?.flooded_area_km2).toFixed(3)} km²</span>
                </div>
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'priority-zones-fill', () => {
        mapInstance.getCanvas().style.cursor = '';
        if (hoverPopup.current) {
          hoverPopup.current.remove();
        }
      });

      // Click to select zone
      mapInstance.on('click', 'priority-zones-fill', (e) => {
        if (!e.features || !e.features.length) return;
        const feat = e.features[0];
        const clickedZoneId = feat.properties?.zone_id;
        const matched = allZones.find(z => z.zone_id === clickedZoneId);
        if (matched) {
          onSelectZone(matched);
        }
      });
    });

    map.current = mapInstance;
    if (mapRefOut) {
      mapRefOut.current = mapInstance;
    }

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // Synchronize Basemap visibility when activeBasemap changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Dynamically register Mapbox if selected and not yet added
    if (activeBasemap === 'mapbox' && mapboxToken && !map.current.getSource('source-mapbox')) {
      map.current.addSource('source-mapbox', {
        type: 'raster',
        tiles: [
          `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
        ],
        tileSize: 256,
        attribution: '&copy; Mapbox &copy; OpenStreetMap'
      });
      map.current.addLayer({
        id: 'base-mapbox',
        type: 'raster',
        source: 'source-mapbox',
        layout: { visibility: 'none' }
      }, 'pre-sar-layer');
    }

    // Dynamically register MapTiler if selected and not yet added
    if (activeBasemap === 'maptiler' && maptilerKey && !map.current.getSource('source-maptiler')) {
      map.current.addSource('source-maptiler', {
        type: 'raster',
        tiles: [
          `https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.jpg?key=${maptilerKey}`
        ],
        tileSize: 256,
        attribution: '&copy; MapTiler &copy; OpenStreetMap'
      });
      map.current.addLayer({
        id: 'base-maptiler',
        type: 'raster',
        source: 'source-maptiler',
        layout: { visibility: 'none' }
      }, 'pre-sar-layer');
    }

    const allBaseLayerIds = [
      'base-esri-satellite',
      'base-carto-light',
      'base-carto-dark',
      'base-osm-streets',
      'base-opentopo',
      'base-mapbox',
      'base-maptiler'
    ];

    allBaseLayerIds.forEach(id => {
      if (map.current?.getLayer(id)) {
        map.current.setLayoutProperty(id, 'visibility', id === `base-${activeBasemap}` ? 'visible' : 'none');
      }
    });
  }, [activeBasemap, mapboxToken, maptilerKey]);

  // Update layer visibility dynamically
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    map.current.setLayoutProperty('priority-zones-fill', 'visibility', layers.priorityGrid ? 'visible' : 'none');
    map.current.setLayoutProperty('priority-zones-line', 'visibility', layers.priorityGrid ? 'visible' : 'none');
    map.current.setLayoutProperty('flood-extent-fill', 'visibility', layers.floodExtent ? 'visible' : 'none');
    map.current.setLayoutProperty('flood-extent-line', 'visibility', layers.floodExtent ? 'none' : 'none');
    map.current.setLayoutProperty('submerged-roads-layer', 'visibility', layers.submergedRoads ? 'visible' : 'none');
    map.current.setLayoutProperty('exposed-buildings-layer', 'visibility', layers.exposedBuildings ? 'visible' : 'none');
    map.current.setLayoutProperty('pre-sar-layer', 'visibility', layers.preSarRaster ? 'visible' : 'none');
    map.current.setLayoutProperty('post-sar-layer', 'visibility', layers.postSarRaster ? 'visible' : 'none');
  }, [layers]);

  // Update Priority Class filter
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const allowedClasses = (Object.keys(classFilter) as PriorityClass[]).filter(k => classFilter[k]);
    const filterExp = ['in', ['get', 'exposure_class'], ['literal', allowedClasses]] as any;
    map.current.setFilter('priority-zones-fill', filterExp);
  }, [classFilter]);

  // Highlight selected zone
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (selectedZone) {
      map.current.setFilter('priority-zone-selected', ['==', 'zone_id', selectedZone.zone_id]);
    } else {
      map.current.setFilter('priority-zone-selected', ['==', 'zone_id', '']);
    }
  }, [selectedZone]);

  const basemapOptions: { id: BasemapProvider; label: string; icon: string; badge: string }[] = [
    { id: 'esri-satellite', label: 'ESRI Satellite', icon: '🛰️', badge: 'High-Res' },
    { id: 'carto-light', label: 'Carto Light', icon: '☀️', badge: 'Minimal' },
    { id: 'carto-dark', label: 'Carto Dark', icon: '🌙', badge: 'Emergency' },
    { id: 'osm-streets', label: 'OpenStreetMap', icon: '🗺️', badge: 'Streets' },
    { id: 'opentopo', label: 'OpenTopo (Terrain)', icon: '⛰️', badge: 'Relief' },
    { id: 'mapbox', label: 'Mapbox Satellite', icon: '⚡', badge: mapboxToken ? 'Active' : 'Key Req' },
    { id: 'maptiler', label: 'MapTiler Hybrid', icon: '🌐', badge: maptilerKey ? 'Active' : 'Key Req' },
  ];

  const currentOption = basemapOptions.find(b => b.id === activeBasemap) || basemapOptions[0];

  return (
    <div className="relative w-full h-full select-none">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Basemap API Switcher Widget */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2">
        {/* Basemap Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-1.5 bg-white/95 hover:bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md backdrop-blur border border-slate-200 hover:border-slate-300 transition"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Basemap: {currentOption.icon} {currentOption.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Switch Map Basemap API
              </div>

              {basemapOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if ((option.id === 'mapbox' && !mapboxToken) || (option.id === 'maptiler' && !maptilerKey)) {
                      onOpenApiModal();
                    } else {
                      onSelectBasemap(option.id);
                    }
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition ${
                    activeBasemap === option.id
                      ? 'bg-blue-50 text-blue-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {option.badge}
                    </span>
                    {activeBasemap === option.id && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}

              <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenApiModal();
                  }}
                  className="w-full text-center py-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 rounded transition"
                >
                  Configure API Keys & Endpoints &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Developer Endpoints & Keys Button */}
        <button
          onClick={onOpenApiModal}
          className="flex items-center space-x-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-700 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-md backdrop-blur border border-slate-200 hover:border-slate-300 transition"
          title="Configure Commercial API Keys & Copy GIS GeoJSON Endpoints"
        >
          <Key className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Map APIs & Endpoints</span>
        </button>
      </div>
    </div>
  );
};
