from datetime import datetime, timedelta
from services.tomtom_service import get_routes
from services.weather_service import get_live_aqi_and_weather
from services.route_utils import sample_waypoints
from services.ml_service import predict_aqi


def get_best_route_with_aqi(origin_lat, origin_lon, dest_lat, dest_lon):
    routes = get_routes(origin_lat, origin_lon, dest_lat, dest_lon, max_alternatives=2)

    now = datetime.now()
    scored_routes = []

    for route in routes:
        waypoints = sample_waypoints(route["polyline"], route["time_s"], interval_km=1.5)

        waypoint_results = []
        total_weighted_aqi = 0
        total_time = 0

        for i, wp in enumerate(waypoints):
            # Query live pollutants AT THIS WAYPOINT, not just at origin
            pollutants = get_live_aqi_and_weather(wp["lat"], wp["lon"])
            print(f"Waypoint {i}: ({wp['lat']}, {wp['lon']}) -> PM2.5={pollutants['pm2_5']}, PM10={pollutants['pm10']}") 
            eta_timestamp = now + timedelta(minutes=wp["eta_min"])
            predicted = predict_aqi(pollutants, eta_timestamp)

            waypoint_results.append({
                "lat": wp["lat"],
                "lon": wp["lon"],
                "eta_min": wp["eta_min"],
                "predicted_aqi": predicted
            })

            if i > 0:
                segment_time = waypoints[i]["eta_min"] - waypoints[i - 1]["eta_min"]
                total_weighted_aqi += predicted * segment_time
                total_time += segment_time

        exposure_score = total_weighted_aqi / total_time if total_time > 0 else 0

        scored_routes.append({
            "distance_m": route["distance_m"],
            "time_s": route["time_s"],
            "exposure_score": round(exposure_score, 1),
            "polyline": route["polyline"],
            "waypoints": waypoint_results
        })

    max_time = max(r["time_s"] for r in scored_routes)
    max_exposure = max(r["exposure_score"] for r in scored_routes)

    for r in scored_routes:
        norm_time = r["time_s"] / max_time if max_time > 0 else 0
        norm_exposure = r["exposure_score"] / max_exposure if max_exposure > 0 else 0
        r["combined_score"] = 0.5 * norm_time + 0.5 * norm_exposure

    best_route = min(scored_routes, key=lambda r: r["combined_score"])
    return best_route