from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from services.aggregator_service import get_three_optional_routes
from services.weather_service import get_live_aqi_and_weather
from services.ml_service import predict_aqi

app = FastAPI(
    title="AQI-Aware Intelligent Route Optimization API",
    description="Finds three optional driving routes in Delhi (Fastest, Best AQI, and Balanced) with air quality exposure insights.",
    version="2.0.0"
)

# Enable CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class RouteRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "ok", "message": "AQI Route API is running. Use /health, /best-route, /aqi-point, /aqi-forecast"}


@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok"}


@app.post("/best-route")
def get_best_route(req: RouteRequest):
    try:
        result = get_three_optional_routes(
            req.origin_lat, req.origin_lon, req.dest_lat, req.dest_lon
        )
        routes = result["routes"]
        best_route_id = result["best_route_id"]
        best_route = next((r for r in routes if r.get("is_best")), routes[0])

        return {
            "status": "success",
            "best_route_id": best_route_id,
            "routes": routes,
            "route": best_route
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AQIPointRequest(BaseModel):
    lat: float
    lon: float
    location_name: str = "this location"


@app.post("/aqi-point")
def get_aqi_at_point(req: AQIPointRequest):
    """
    Returns live pollutant data + ML-predicted current AQI at a given coordinate.
    Used by the chatbot for Q1: 'What is the current AQI of <location>?'
    Reuses get_live_aqi_and_weather (weather_service) and predict_aqi (ml_service).
    """
    try:
        pollutants = get_live_aqi_and_weather(req.lat, req.lon, use_cache=False)
        now = datetime.now()
        predicted_aqi = predict_aqi(pollutants, now)
        return {
            "status": "success",
            "location": req.location_name,
            "lat": req.lat,
            "lon": req.lon,
            "predicted_aqi": round(predicted_aqi, 1),
            "pollutants": {
                "pm2_5": pollutants.get("pm2_5"),
                "pm10": pollutants.get("pm10"),
                "no2": pollutants.get("no2"),
                "so2": pollutants.get("so2"),
                "co": pollutants.get("co"),
                "o3": pollutants.get("o3"),
            },
            "weather": {
                "temperature": pollutants.get("temperature"),
                "humidity": pollutants.get("humidity"),
                "wind_speed": pollutants.get("wind_speed"),
            },
            "timestamp": now.isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AQIForecastRequest(BaseModel):
    lat: float
    lon: float
    location_name: str = "this location"
    hours_ahead: int = 3   # how many hours into the future to forecast


@app.post("/aqi-forecast")
def get_aqi_forecast(req: AQIForecastRequest):
    """
    Returns ML-predicted AQI at a location N hours in the future.
    Used by the chatbot for Q2: 'What will the AQI be in <location>?'
    Reuses live pollutants (current snapshot) fed into the ML model at a future timestamp.
    """
    try:
        hours = max(1, min(req.hours_ahead, 24))  # clamp 1..24
        pollutants = get_live_aqi_and_weather(req.lat, req.lon, use_cache=True)
        future_ts = datetime.now() + timedelta(hours=hours)
        predicted_aqi = predict_aqi(pollutants, future_ts)
        return {
            "status": "success",
            "location": req.location_name,
            "lat": req.lat,
            "lon": req.lon,
            "hours_ahead": hours,
            "predicted_aqi": round(predicted_aqi, 1),
            "forecast_time": future_ts.strftime("%I:%M %p"),
            "pollutants": {
                "pm2_5": pollutants.get("pm2_5"),
                "pm10": pollutants.get("pm10"),
            },
            "timestamp": future_ts.isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
