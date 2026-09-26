import os
import requests
from dotenv import load_dotenv

# Load .env from backend root (Render), then try shared root .env (local dev)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

TOMTOM_KEY = os.getenv("TOMTOM_API_KEY")

def get_routes(origin_lat, origin_lon, dest_lat, dest_lon, max_alternatives=2):
    """
    Calls TomTom Routing API and returns a list of route options,
    each with distance, time, traffic delay, and the polyline (list of lat/lon points).
    """
    origin = f"{origin_lat},{origin_lon}"
    destination = f"{dest_lat},{dest_lon}"

    url = (
        f"https://api.tomtom.com/routing/1/calculateRoute/"
        f"{origin}:{destination}/json"
        f"?key={TOMTOM_KEY}&maxAlternatives={max_alternatives}&traffic=true"
    )

    response = requests.get(url)
    response.raise_for_status()  # raises an error if status isn't 200
    data = response.json()

    routes = []
    for route in data.get("routes", []):
        summary = route.get("summary", {})
        polyline = []
        for leg in route.get("legs", []):
            for point in leg.get("points", []):
                polyline.append([point["latitude"], point["longitude"]])

        routes.append({
            "distance_m": summary.get("lengthInMeters", 0),
            "time_s": summary.get("travelTimeInSeconds", 0),
            "traffic_delay_s": summary.get("trafficDelayInSeconds", 0),
            "polyline": polyline
        })

    return routes