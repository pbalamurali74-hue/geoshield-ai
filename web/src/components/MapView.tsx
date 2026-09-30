import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { LayerVisibility, PriorityClass, ZoneData } from '../types';

interface MapViewProps {
  layers: LayerVisibility;
  classFilter: Record<PriorityClass, boolean>;
  selectedZone: ZoneData | null;
  onSelectZone: (zone: ZoneData | null) => void;
  allZones: ZoneData[];
  mapRefOut?: React.MutableRefObject<maplibregl.Map | null>;
}

export const MapView: React.FC<MapViewProps> = ({
  layers,
  classFilter,
  selectedZone,
  onSelectZone,
  allZones,
  mapRefOut
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const hoverPopup = useRef<maplibregl.Popup | null>(null);

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

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Use Carto Positron vector/raster style (completely free, open-access, zero API key)
    const cartoStyle = {
      version: 8 as const,
      sources: {
        'carto-positron': {
          type: 'raster' as const,
          tiles: [
            'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
        }
      },
      layers: [
        {
          id: 'carto-base',
          type: 'raster' as const,
          source: 'carto-positron',
          minzoom: 0,
          maxzoom: 20
        }
      ]
    };

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: cartoStyle,
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

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
