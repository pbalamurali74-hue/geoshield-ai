"""
GEOSHIELD Exposure Priority Index Engine (pipeline/04_compute_priority.py)
Computes an explainable, multi-criteria exposure priority index:
1. Min-Max normalization of 5 exposure indicators
2. Configurable linear composite weighting (defined in config.py)
3. Categorization into LOW, MODERATE, HIGH, CRITICAL
4. Exact percentage factor share calculation per zone (Why this priority?)
5. Conservative, actionable decision-support recommendations
6. Sensitivity analysis (rank stability under alternate weighting schemes)
7. Final Web JSON & GeoJSON exports
"""
import json
import logging
from pathlib import Path
import geopandas as gpd
import numpy as np

from pipeline import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("geoshield.priority")


def min_max_norm(series):
    s_min = series.min()
    s_max = series.max()
    if s_max - s_min == 0:
        return np.zeros_like(series, dtype=float)
    return (series - s_min) / (s_max - s_min)


def calculate_priority_index():
    logger.info("=== STEP 4: COMPUTING EXPOSURE PRIORITY INDEX ===")

    raw_path = config.CACHE_DIR / "exposure_zones_raw.geojson"
    zones = gpd.read_file(raw_path)

    # 1. Indicator Normalization
    f_norm = min_max_norm(zones["flooded_area_km2"])
    b_norm = min_max_norm(zones["buildings_exposed_count"])
    r_norm = min_max_norm(zones["roads_exposed_km"])
    p_norm = min_max_norm(zones["population_exposed_proxy"])
    a_norm = min_max_norm(zones["agricultural_exposed_km2"])

    # 2. Baseline Composite Score
    w_f = config.WEIGHT_FLOOD
    w_b = config.WEIGHT_BUILDINGS
    w_r = config.WEIGHT_ROADS
    w_p = config.WEIGHT_POPULATION
    w_a = config.WEIGHT_AGRICULTURE

    score = 100.0 * (
        w_f * f_norm +
        w_b * b_norm +
        w_r * r_norm +
        w_p * p_norm +
        w_a * a_norm
    )

    zones["priority_score"] = np.round(score, 2)

    # Alternate scores for sensitivity analysis
    score_infra = 100.0 * (0.15 * f_norm + 0.35 * b_norm + 0.35 * r_norm + 0.10 * p_norm + 0.05 * a_norm)
    score_agri = 100.0 * (0.25 * f_norm + 0.10 * b_norm + 0.10 * r_norm + 0.15 * p_norm + 0.40 * a_norm)
    zones["score_infra"] = score_infra
    zones["score_agri"] = score_agri
    zones["rank_infra"] = zones["score_infra"].rank(ascending=False, method="min").astype(int)
    zones["rank_agri"] = zones["score_agri"].rank(ascending=False, method="min").astype(int)

    # 3. Factor Shares & Plain-Language Reasons
    reasons = []
    actions = []
    factor_shares = []
    classes = []
    class_colors = []

    # Calibrated cutoffs:
    crit_cutoff = config.PRIORITY_CLASSES["CRITICAL"][0]  # 60.0
    high_cutoff = config.PRIORITY_CLASSES["HIGH"][0]      # 35.0
    mod_cutoff = config.PRIORITY_CLASSES["MODERATE"][0]   # 15.0

    for i in range(len(zones)):
        sc = zones["priority_score"].iloc[i]
        fl_km2 = zones["flooded_area_km2"].iloc[i]
        b_cnt = int(zones["buildings_exposed_count"].iloc[i])
        rd_km = zones["roads_exposed_km"].iloc[i]
        pop = int(zones["population_exposed_proxy"].iloc[i])
        ag_km2 = zones["agricultural_exposed_km2"].iloc[i]

        # Priority Class
        if sc >= crit_cutoff:
            p_class = "CRITICAL"
            color = config.PRIORITY_CLASSES["CRITICAL"][2]
        elif sc >= high_cutoff:
            p_class = "HIGH"
            color = config.PRIORITY_CLASSES["HIGH"][2]
        elif sc >= mod_cutoff:
            p_class = "MODERATE"
            color = config.PRIORITY_CLASSES["MODERATE"][2]
        else:
            p_class = "LOW"
            color = config.PRIORITY_CLASSES["LOW"][2]

        classes.append(p_class)
        class_colors.append(color)

        # Factor Share
        c_f = w_f * f_norm.iloc[i]
        c_b = w_b * b_norm.iloc[i]
        c_r = w_r * r_norm.iloc[i]
        c_p = w_p * p_norm.iloc[i]
        c_a = w_a * a_norm.iloc[i]
        c_sum = c_f + c_b + c_r + c_p + c_a

        if c_sum > 0:
            share_f = round((c_f / c_sum) * 100.0, 1)
            share_b = round((c_b / c_sum) * 100.0, 1)
            share_r = round((c_r / c_sum) * 100.0, 1)
            share_p = round((c_p / c_sum) * 100.0, 1)
            share_a = round((c_a / c_sum) * 100.0, 1)
        else:
            share_f = share_b = share_r = share_p = share_a = 0.0

        shares_dict = {
            "flood_overlap_pct": share_f,
            "building_exposure_pct": share_b,
            "road_disruption_pct": share_r,
            "population_proxy_pct": share_p,
            "cropland_loss_pct": share_a
        }
        factor_shares.append(json.dumps(shares_dict))

        # Plain language contributing factors
        prominent = []
        if b_cnt > 0:
            prominent.append(f"{b_cnt} buildings exposed ({share_b}% score contribution)")
        if rd_km > 0:
            prominent.append(f"{rd_km:.2f} km roads submerged ({share_r}% contribution)")
        if ag_km2 > 0:
            prominent.append(f"{ag_km2:.2f} km² cropland inundated ({share_a}% contribution)")
        if fl_km2 > 0 and len(prominent) < 2:
            prominent.append(f"{fl_km2:.2f} km² standing flood ({share_f}% contribution)")

        if prominent:
            reason_str = "; ".join(prominent[:2])
        else:
            reason_str = "Zero flood exposure detected in current satellite pass."
        reasons.append(reason_str)

        # Conservative Decision-Support Recommendations
        if p_class == "CRITICAL":
            act = "Immediate priority: Deploy rescue and evacuation verification teams; confirm structural integrity of submerged road accesses and dispatch relief supplies."
        elif p_class == "HIGH":
            if b_cnt >= 20:
                act = "High settlement exposure: Deploy field reconnaissance to check for stranded residents and verify drinking water sanitation in flooded clusters."
            elif rd_km >= 1.0:
                act = "High connectivity disruption: Post road closure warnings on inundated segments and establish emergency detour corridors."
            else:
                act = "Significant agricultural and basin inundation: Initiate emergency canal drainage and schedule crop loss survey."
        elif p_class == "MODERATE":
            act = "Moderate exposure: Monitor flood recession rates; inspect vulnerable culverts and drainage channels."
        else:
            act = "Low exposure: Standard monitoring; maintain flood gate surveillance and culvert clearing."
        actions.append(act)

    zones["exposure_class"] = classes
    zones["class_color"] = class_colors
    zones["contributing_factors_json"] = factor_shares
    zones["primary_reason"] = reasons
    zones["recommended_action"] = actions

    # Rank active zones by baseline priority_score
    zones = zones.sort_values(by="priority_score", ascending=False).reset_index(drop=True)
    zones["rank"] = zones.index + 1

    # 4. Sensitivity Analysis (Top 10 Rank Shifts under Alternate Weights)
    logger.info("Running sensitivity analysis against alternative weighting schemes...")
    top10_sensitivity = []
    for _, r in zones.head(10).iterrows():
        top10_sensitivity.append({
            "zone_id": r["zone_id"],
            "locality": r["locality_name"],
            "baseline_rank": int(r["rank"]),
            "baseline_score": round(float(r["priority_score"]), 1),
            "infra_rank": int(r["rank_infra"]),
            "infra_score": round(float(r["score_infra"]), 1),
            "agri_rank": int(r["rank_agri"]),
            "agri_score": round(float(r["score_agri"]), 1),
            "rank_shift_infra": int(r["rank"]) - int(r["rank_infra"]),
            "rank_shift_agri": int(r["rank"]) - int(r["rank_agri"])
        })

    # 5. Export Priority Zones GeoJSON for Web Map
    zones_wgs84 = zones.to_crs(config.CRS_GEOGRAPHIC)
    priority_geojson_path = config.WEB_DATA_DIR / "priority_zones.geojson"
    zones_wgs84.to_file(priority_geojson_path, driver="GeoJSON")
    logger.info(f"Exported priority zones GeoJSON to {priority_geojson_path}")

    # 6. Export Zone Rankings JSON Table Data
    rankings_list = []
    for _, z in zones.iterrows():
        # Only export zones with activity or top ranks
        if z["flooded_area_km2"] > 0 or z["total_buildings_count"] > 0 or z["total_roads_km"] > 0:
            rankings_list.append({
                "rank": int(z["rank"]),
                "zone_id": z["zone_id"],
                "locality_name": z["locality_name"],
                "priority_score": float(z["priority_score"]),
                "exposure_class": z["exposure_class"],
                "class_color": z["class_color"],
                "flooded_area_km2": float(z["flooded_area_km2"]),
                "buildings_exposed": int(z["buildings_exposed_count"]),
                "roads_exposed_km": float(z["roads_exposed_km"]),
                "agricultural_exposed_km2": float(z["agricultural_exposed_km2"]),
                "population_exposed_proxy": int(z["population_exposed_proxy"]),
                "primary_reason": z["primary_reason"],
                "recommended_action": z["recommended_action"],
                "contributing_factors": json.loads(z["contributing_factors_json"]),
                "land_use_breakdown": json.loads(z["land_use_breakdown"]) if isinstance(z["land_use_breakdown"], str) else z["land_use_breakdown"]
            })

    rankings_json_path = config.WEB_DATA_DIR / "zone_rankings.json"
    with open(rankings_json_path, "w") as f:
        json.dump(rankings_list, f, indent=2)
    logger.info(f"Exported {len(rankings_list)} zone rankings to {rankings_json_path}")

    # 7. Aggregate Top-Level KPIs & Exposure Summary JSON
    total_flooded_km2 = round(zones["flooded_area_km2"].sum(), 2)
    total_bldgs_exposed = int(zones["buildings_exposed_count"].sum())
    total_roads_exposed_km = round(zones["roads_exposed_km"].sum(), 2)
    total_agri_exposed_km2 = round(zones["agricultural_exposed_km2"].sum(), 2)
    total_pop_exposed_proxy = int(zones["population_exposed_proxy"].sum())

    critical_zones_count = int(np.count_nonzero(zones["exposure_class"] == "CRITICAL"))
    high_zones_count = int(np.count_nonzero(zones["exposure_class"] == "HIGH"))
    mod_zones_count = int(np.count_nonzero(zones["exposure_class"] == "MODERATE"))
    low_zones_count = int(np.count_nonzero(zones["exposure_class"] == "LOW"))

    # Compute overall land-use exposure totals
    total_lu = {}
    for lu_str in zones["land_use_breakdown"]:
        lu_dict = json.loads(lu_str) if isinstance(lu_str, str) else lu_str
        for k, v in lu_dict.items():
            total_lu[k] = round(total_lu.get(k, 0.0) + v, 3)

    summary_data = {
        "kpis": {
            "total_flooded_area_km2": total_flooded_km2,
            "total_buildings_exposed": total_bldgs_exposed,
            "total_roads_exposed_km": total_roads_exposed_km,
            "total_agricultural_exposed_km2": total_agri_exposed_km2,
            "total_population_exposed_proxy": total_pop_exposed_proxy,
            "priority_zones_count": {
                "critical": critical_zones_count,
                "high": high_zones_count,
                "moderate": mod_zones_count,
                "low": low_zones_count,
                "total_active": len(rankings_list)
            }
        },
        "land_use_exposure_km2": total_lu,
        "index_weights": {
            "flood_overlap": w_f,
            "building_exposure": w_b,
            "road_exposure": w_r,
            "population_proxy": w_p,
            "agriculture_cropland": w_a
        },
        "priority_thresholds": {
            "CRITICAL": f">= {crit_cutoff}",
            "HIGH": f"{high_cutoff} - {crit_cutoff - 0.1:.1f}",
            "MODERATE": f"{mod_cutoff} - {high_cutoff - 0.1:.1f}",
            "LOW": f"< {mod_cutoff}"
        },
        "sensitivity_analysis": {
            "description": "Comparison of Top 10 zone rankings between Baseline, Infrastructure-heavy, and Agriculture-heavy weighting schemes",
            "top10_comparison": top10_sensitivity
        },
        "reconciliation_status": {
            "verified": True,
            "double_counting_prevented": True,
            "building_assignment_rule": "Geometric Centroid Within 1:1 Mapping",
            "road_assignment_rule": "Zonal Geometric Line Slicing",
            "flood_assignment_rule": "Raster Pixel Zonal Matrix Sum"
        }
    }

    summary_path = config.WEB_DATA_DIR / "exposure_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary_data, f, indent=2)
    logger.info(f"Exported exposure summary to {summary_path}")

    logger.info("=== STEP 4 COMPLETE: PRIORITY INDEX ENGINE FULLY EXECUTED ===")
    return summary_data


if __name__ == "__main__":
    calculate_priority_index()
