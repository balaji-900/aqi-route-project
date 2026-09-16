from services.tomtom_service import get_routes
from services.route_utils import sample_waypoints

routes = get_routes(28.5642, 77.1806, 28.6562, 77.2410)
route = routes[0]

waypoints = sample_waypoints(route["polyline"], route["time_s"], interval_km=1.5)
print(f"Sampled {len(waypoints)} waypoints from {len(route['polyline'])} raw points")
for wp in waypoints:
    print(wp)