from services.aggregator_service import get_three_optional_routes, get_best_route_with_aqi

res = get_three_optional_routes(28.5642, 77.1806, 28.6562, 77.2410)
print(f"Best Route ID: {res['best_route_id']}")
print(f"Total Routes Returned: {len(res['routes'])}")
for r in res["routes"]:
    print(f"- [{r['id']}] {r['name']} ({r['badge']}): {r['total_time_min']} min, {r['total_distance_km']} km, AQI: {r['overall_aqi_score']}, Traffic Delay: +{r['traffic_delay_min']} min, is_best={r['is_best']}")