from services.tomtom_service import get_routes

routes = get_routes(28.5642, 77.1806, 28.6562, 77.2410)  # R.K. Puram to Red Fort
print(f"Got {len(routes)} route(s)")
for i, r in enumerate(routes):
    print(f"Route {i+1}: {r['distance_m']}m, {r['time_s']}s, {len(r['polyline'])} points")