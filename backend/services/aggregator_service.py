import itertools
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from services.tomtom_service import get_routes
from services.weather_service import get_live_aqi_and_weather
from services.route_utils import sample_waypoints
from services.ml_service import predict_aqi


def _fetch_waypoint_aqi(wp, now):
    """Fetch AQI for a single waypoint. Designed to be called in parallel."""
    try:
        pollutants = get_live_aqi_and_weather(wp["lat"], wp["lon"])
        eta_timestamp = now + timedelta(minutes=wp["eta_min"])
        predicted = predict_aqi(pollutants, eta_timestamp)
    except Exception as e:
        print(f"Warning: could not predict AQI at ({wp['lat']}, {wp['lon']}): {e}")
        predicted = 85.0
    return {
        "lat": wp["lat"],
        "lon": wp["lon"],
        "eta_min": wp["eta_min"],
        "predicted_aqi": round(predicted, 1)
    }


def _format_route_item(route_dict, role_id, is_best):
    badge_map = {
        "fastest": "Fastest",
        "best_aqi": "Cleanest Air",
        "balanced": "Balanced Choice"
    }
    name_map = {
        "fastest": "Fastest Route",
        "best_aqi": "Best AQI Route",
        "balanced": "Balanced Route"
    }
    desc_map = {
        "fastest": "Shortest travel time and direct driving distance",
        "best_aqi": "Lowest air pollution exposure along cleaner corridors",
        "balanced": "Optimal equilibrium between traffic travel time & clean air"
    }
    traffic_delay_s = route_dict.get("traffic_delay_s", 0)
    traffic_delay_min = round(traffic_delay_s / 60, 1)

    return {
        "id": role_id,
        "name": name_map.get(role_id, role_id.capitalize()),
        "badge": badge_map.get(role_id, role_id.capitalize()),
        "description": desc_map.get(role_id, ""),
        "is_best": is_best,
        "total_time_min": round(route_dict["time_s"] / 60, 1),
        "total_distance_km": round(route_dict["distance_m"] / 1000, 2),
        "traffic_delay_min": traffic_delay_min,
        "overall_aqi_score": route_dict["exposure_score"],
        "combined_score": round(route_dict.get("combined_score", 0), 3),
        "polyline": route_dict["polyline"],
        "waypoints": route_dict["waypoints"],
        # Raw metrics for backward compatibility
        "time_s": route_dict["time_s"],
        "distance_m": route_dict["distance_m"],
        "exposure_score": route_dict["exposure_score"],
    }


def get_three_optional_routes(origin_lat, origin_lon, dest_lat, dest_lon):
    """
    Computes up to three distinct optional routes:
    1. Fastest: lowest travel time and distance
    2. Best AQI: lowest air pollution exposure
    3. Balanced: optimal composite trade-off between traffic travel time & air quality
    Marks the overall best route among the three with is_best=True.
    """
    raw_routes = get_routes(origin_lat, origin_lon, dest_lat, dest_lon, max_alternatives=3)
    if not raw_routes:
        raise ValueError("No route found between selected origin and destination.")

    now = datetime.now()
    scored_candidates = []

    for route_idx, route in enumerate(raw_routes):
        # Use 3km intervals to keep API call count low (~6 waypoints per route)
        waypoints = sample_waypoints(route["polyline"], route["time_s"], interval_km=3.0)

        # ── Parallel AQI fetch: all waypoints on this route at once ──────────
        waypoint_results_map = {}
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_idx = {
                executor.submit(_fetch_waypoint_aqi, wp, now): i
                for i, wp in enumerate(waypoints)
            }
            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                waypoint_results_map[idx] = future.result()

        # Restore original order
        waypoint_results = [waypoint_results_map[i] for i in range(len(waypoints))]

        total_weighted_aqi = 0
        total_time = 0
        for i in range(1, len(waypoint_results)):
            segment_time = waypoint_results[i]["eta_min"] - waypoint_results[i - 1]["eta_min"]
            total_weighted_aqi += waypoint_results[i]["predicted_aqi"] * segment_time
            total_time += segment_time

        exposure_score = (
            total_weighted_aqi / total_time
            if total_time > 0
            else (waypoint_results[0]["predicted_aqi"] if waypoint_results else 75.0)
        )

        scored_candidates.append({
            "candidate_idx": route_idx,
            "distance_m": route["distance_m"],
            "time_s": route["time_s"],
            "traffic_delay_s": route.get("traffic_delay_s", 0),
            "exposure_score": round(exposure_score, 1),
            "polyline": route["polyline"],
            "waypoints": waypoint_results
        })

    max_time = max(r["time_s"] for r in scored_candidates) or 1
    max_exposure = max(r["exposure_score"] for r in scored_candidates) or 1
    max_dist = max(r["distance_m"] for r in scored_candidates) or 1

    for r in scored_candidates:
        r["norm_time"] = r["time_s"] / max_time
        r["norm_exposure"] = r["exposure_score"] / max_exposure
        r["norm_dist"] = r["distance_m"] / max_dist
        # Combined score reflects 45% travel time, 45% pollution exposure, 10% distance
        r["combined_score"] = 0.45 * r["norm_time"] + 0.45 * r["norm_exposure"] + 0.10 * r["norm_dist"]

    num_candidates = len(scored_candidates)
    role_assignments = []

    if num_candidates >= 3:
        # Find the optimal 1-to-1 assignment of 3 distinct candidates to (fastest, best_aqi, balanced)
        best_assignment = None
        best_cost = float("inf")

        for perm in itertools.permutations(scored_candidates, 3):
            cand_fast, cand_aqi, cand_bal = perm
            # Cost for each role
            cost_fast = 0.7 * cand_fast["norm_time"] + 0.3 * cand_fast["norm_dist"]
            cost_aqi = cand_aqi["norm_exposure"]
            cost_bal = cand_bal["combined_score"]
            total_cost = cost_fast + cost_aqi + cost_bal

            if total_cost < best_cost:
                best_cost = total_cost
                best_assignment = (cand_fast, cand_aqi, cand_bal)

        fast_cand, aqi_cand, bal_cand = best_assignment
        role_assignments = [
            ("fastest", fast_cand),
            ("best_aqi", aqi_cand),
            ("balanced", bal_cand)
        ]
    elif num_candidates == 2:
        # 2 distinct candidates
        cand0, cand1 = scored_candidates[0], scored_candidates[1]
        if cand0["time_s"] <= cand1["time_s"]:
            fast_cand, other_cand = cand0, cand1
        else:
            fast_cand, other_cand = cand1, cand0

        # Decide whether other is cleaner or balanced
        if other_cand["exposure_score"] < fast_cand["exposure_score"]:
            role_assignments = [
                ("fastest", fast_cand),
                ("best_aqi", other_cand)
            ]
        else:
            role_assignments = [
                ("fastest", fast_cand),
                ("balanced", other_cand)
            ]
    else:
        role_assignments = [("balanced", scored_candidates[0])]

    # Determine which assigned route is overall BEST among them (lowest combined_score)
    best_role = min(role_assignments, key=lambda pair: pair[1]["combined_score"])[0]

    final_routes = []
    for role_id, candidate in role_assignments:
        is_best = (role_id == best_role)
        final_routes.append(_format_route_item(candidate, role_id, is_best))

    return {
        "best_route_id": best_role,
        "routes": final_routes
    }


def get_best_route_with_aqi(origin_lat, origin_lon, dest_lat, dest_lon):
    """
    Backwards compatibility helper: returns the single best route dictionary.
    """
    res = get_three_optional_routes(origin_lat, origin_lon, dest_lat, dest_lon)
    best_id = res["best_route_id"]
    for r in res["routes"]:
        if r["id"] == best_id:
            return r
    return res["routes"][0]