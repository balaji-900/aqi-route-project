from services.aggregator_service import get_best_route_with_aqi

result = get_best_route_with_aqi(28.5642, 77.1806, 28.6562, 77.2410)
print("Distance:", result["distance_m"], "m")
print("Time:", result["time_s"], "s")
print("Exposure score:", result["exposure_score"])
print("Number of waypoints:", len(result["waypoints"]))
for wp in result["waypoints"][:5]:
    print(wp)