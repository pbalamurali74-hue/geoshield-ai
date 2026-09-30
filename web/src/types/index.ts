export type PriorityClass = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type ActiveTab = 'overview' | 'hazard' | 'exposure' | 'priority' | 'methodology';

export interface ContributingFactors {
  flood_overlap_pct: number;
  building_exposure_pct: number;
  road_disruption_pct: number;
  population_proxy_pct: number;
  cropland_loss_pct: number;
}

export interface ZoneData {
  rank: number;
  zone_id: string;
  locality_name: string;
  priority_score: number;
  exposure_class: PriorityClass;
  class_color: string;
  flooded_area_km2: number;
  buildings_exposed: number;
  roads_exposed_km: number;
  agricultural_exposed_km2: number;
  population_exposed_proxy: number;
  primary_reason: string;
  recommended_action: string;
  contributing_factors: ContributingFactors;
  land_use_breakdown?: Record<string, number>;
}

export interface SensitivityComparison {
  zone_id: string;
  locality: string;
  baseline_rank: number;
  baseline_score: number;
  infra_rank: number;
  infra_score: number;
  agri_rank: number;
  agri_score: number;
  rank_shift_infra: number;
  rank_shift_agri: number;
}

export interface ExposureSummary {
  kpis: {
    total_flooded_area_km2: number;
    total_buildings_exposed: number;
    total_roads_exposed_km: number;
    total_agricultural_exposed_km2: number;
    total_population_exposed_proxy: number;
    priority_zones_count: {
      critical: number;
      high: number;
      moderate: number;
      low: number;
      total_active: number;
    };
  };
  land_use_exposure_km2: Record<string, number>;
  index_weights: {
    flood_overlap: number;
    building_exposure: number;
    road_exposure: number;
    population_proxy: number;
    agriculture_cropland: number;
  };
  priority_thresholds: Record<PriorityClass, string>;
  sensitivity_analysis: {
    description: string;
    top10_comparison: SensitivityComparison[];
  };
  reconciliation_status: {
    verified: boolean;
    double_counting_prevented: boolean;
    building_assignment_rule: string;
    road_assignment_rule: string;
    flood_assignment_rule: string;
  };
}

export interface HazardMetadata {
  study_area: string;
  event_name: string;
  event_date: string;
  sensor: string;
  polarization: string;
  relative_orbit: number;
  pass_direction: string;
  pre_acquisition: string;
  post_acquisition: string;
  processing_method: string;
  thresholds: {
    post_water_max_db: number;
    backscatter_delta_drop_db: number;
    max_slope_deg: number;
    jrc_permanent_water_pct: number;
    min_connected_patch_m2: number;
  };
  statistics: {
    total_study_area_km2: number;
    total_flooded_area_km2: number;
    inundation_percentage: number;
    polygon_count: number;
    mean_backscatter_drop_db: number;
  };
  raster_bounds_wgs84: [number, number, number, number];
}

export interface LayerVisibility {
  priorityGrid: boolean;
  floodExtent: boolean;
  submergedRoads: boolean;
  exposedBuildings: boolean;
  preSarRaster: boolean;
  postSarRaster: boolean;
}
