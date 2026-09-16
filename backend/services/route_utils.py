from geopy.distance import geodesic

def sample_waypoints(polyline, total_time_s, interval_km=1.5):
    """
    Samples waypoints from a dense polyline at roughly fixed distance intervals,
    and estimates each waypoint's arrival time based on its position along the route.
    """
    if len(polyline) < 2:
        return []

    # Calculate cumulative distance along the polyline
    cumulative_distances = [0.0]
    for i in range(1, len(polyline)):
        d = geodesic(polyline[i - 1], polyline[i]).km
        cumulative_distances.append(cumulative_distances[-1] + d)

    total_distance_km = cumulative_distances[-1]

    waypoints = []
    next_target = 0.0

    for i, point in enumerate(polyline):
        if cumulative_distances[i] >= next_target or i == len(polyline) - 1:
            # Estimate ETA proportional to distance covered so far
            fraction_covered = cumulative_distances[i] / total_distance_km if total_distance_km > 0 else 0
            eta_seconds = fraction_covered * total_time_s

            waypoints.append({
                "lat": point[0],
                "lon": point[1],
                "distance_km": round(cumulative_distances[i], 2),
                "eta_min": round(eta_seconds / 60, 1)
            })
            next_target += interval_km

    return waypoints