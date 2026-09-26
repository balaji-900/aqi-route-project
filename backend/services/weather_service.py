import os
import requests
from dotenv import load_dotenv

# Load .env from backend root (Render), then try shared root .env (local dev)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

OPENWEATHER_KEY = os.getenv("OPENWEATHER_API_KEY")

# In-memory cache keyed by rounded coordinates (~1.1 km grid) to prevent hammering the API
# and drastically speed up route evaluation along waypoints
_weather_cache = {}

def get_live_aqi_and_weather(lat, lon, use_cache=True):
    """
    Returns live pollutant concentrations (for ML input) and current weather
    at a given coordinate, using OpenWeather's free APIs.
    
    Note on units:
    CPCB (Central Pollution Control Board) historical training data measures CO in mg/m3,
    whereas OpenWeather returns CO in ug/m3. We divide OpenWeather's CO by 1000.0 to prevent
    model feature saturation and ensure realistic AQI predictions.
    """
    cache_key = (round(lat, 2), round(lon, 2))
    if use_cache and cache_key in _weather_cache:
        return _weather_cache[cache_key]

    # Air pollution data
    aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_KEY}"
    aqi_response = requests.get(aqi_url)
    aqi_response.raise_for_status()
    aqi_data = aqi_response.json()

    components = aqi_data["list"][0]["components"]

    # Weather data (for temperature, humidity, wind)
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_KEY}&units=metric"
    weather_response = requests.get(weather_url)
    weather_response.raise_for_status()
    weather_data = weather_response.json()

    # Convert CO from ug/m3 to mg/m3 (CPCB standard)
    raw_co = components.get("co")
    co_mg = (raw_co / 1000.0) if raw_co is not None else None

    result = {
        "pm2_5": components.get("pm2_5"),
        "pm10": components.get("pm10"),
        "no2": components.get("no2"),
        "so2": components.get("so2"),
        "co": co_mg,
        "o3": components.get("o3"),
        "nh3": components.get("nh3"),
        "temperature": weather_data["main"]["temp"],
        "humidity": weather_data["main"]["humidity"],
        "wind_speed": weather_data["wind"]["speed"]
    }

    if use_cache:
        _weather_cache[cache_key] = result

    return result