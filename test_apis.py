import os
import requests
from dotenv import load_dotenv

load_dotenv()

TOMTOM_KEY = os.getenv("TOMTOM_API_KEY")
OPENWEATHER_KEY = os.getenv("OPENWEATHER_API_KEY")

print("Keys loaded:", bool(TOMTOM_KEY), bool(OPENWEATHER_KEY))

# ---- Test 1: TomTom Routing API ----
origin = "28.5642,77.1806"       # R.K. Puram
destination = "28.6562,77.2410"  # Red Fort

tomtom_url = f"https://api.tomtom.com/routing/1/calculateRoute/{origin}:{destination}/json?key={TOMTOM_KEY}"
r1 = requests.get(tomtom_url)
print("\n--- TomTom Test ---")
print("Status code:", r1.status_code)
if r1.status_code == 200:
    data = r1.json()
    summary = data["routes"][0]["summary"]
    print("Route found! Distance (m):", summary["lengthInMeters"],
          "| Time (s):", summary["travelTimeInSeconds"])
else:
    print("Error response:", r1.text)

# ---- Test 2: OpenWeather Air Pollution API ----
lat, lon = 28.5642, 77.1806  # R.K. Puram

ow_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_KEY}"
r2 = requests.get(ow_url)
print("\n--- OpenWeather Test ---")
print("Status code:", r2.status_code)
if r2.status_code == 200:
    data2 = r2.json()
    aqi = data2["list"][0]["main"]["aqi"]
    pm25 = data2["list"][0]["components"]["pm2_5"]
    print("AQI index (1-5):", aqi, "| PM2.5:", pm25)
else:
    print("Error response:", r2.text)