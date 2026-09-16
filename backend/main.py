from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.aggregator_service import get_best_route_with_aqi

app = FastAPI(
    title="AQI-Aware Intelligent Route Optimization API",
    description="Finds the optimal driving route in Delhi balancing travel time and air quality exposure.",
    version="1.0.0"
)

# Enable CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RouteRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/best-route")
def get_best_route(req: RouteRequest):
    try:
        best_route = get_best_route_with_aqi(
            req.origin_lat, req.origin_lon, req.dest_lat, req.dest_lon
        )
        return {
            "status": "success",
            "route": {
                "total_time_min": round(best_route["time_s"] / 60, 1),
                "total_distance_km": round(best_route["distance_m"] / 1000, 2),
                "overall_aqi_score": best_route["exposure_score"],
                "combined_score": round(best_route.get("combined_score", 0), 3),
                "polyline": best_route["polyline"],
                "waypoints": best_route["waypoints"],
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))