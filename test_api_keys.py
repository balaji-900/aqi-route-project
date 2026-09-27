import requests
import os
from dotenv import load_dotenv

# Load keys from .env (gitignored - never commit raw keys!)
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

TOMTOM_KEY = os.getenv("TOMTOM_API_KEY")
OPENWEATHER_KEY = os.getenv("OPENWEATHER_API_KEY")

if not TOMTOM_KEY or not OPENWEATHER_KEY:
    print("ERROR: Missing API keys in .env file")
    exit(1)

# Test TomTom (RK Puram to Red Fort)
print('=== Testing TomTom API ===')
try:
    url = (
        f'https://api.tomtom.com/routing/1/calculateRoute/'
        f'28.5638,77.1734:28.6562,77.2410/json'
        f'?key={TOMTOM_KEY}&maxAlternatives=1&traffic=true'
    )
    r = requests.get(url, timeout=10)
    print(f'HTTP Status: {r.status_code}')
    data = r.json()
    if 'routes' in data:
        routes = data['routes']
        print(f'Routes found: {len(routes)}')
        dist = routes[0]['summary']['lengthInMeters']
        time_s = routes[0]['summary']['travelTimeInSeconds']
        print(f'Distance: {dist}m  Time: {time_s}s')
        print('TomTom: OK')
    else:
        print('Error response:', data)
except Exception as e:
    print(f'TomTom FAILED: {e}')

print()
print('=== Testing OpenWeather Air Pollution API ===')
try:
    url2 = (
        f'http://api.openweathermap.org/data/2.5/air_pollution'
        f'?lat=28.5638&lon=77.1734&appid={OPENWEATHER_KEY}'
    )
    r2 = requests.get(url2, timeout=10)
    print(f'HTTP Status: {r2.status_code}')
    data2 = r2.json()
    if 'list' in data2:
        comp = data2['list'][0]['components']
        print(f'PM2.5: {comp.get("pm2_5")} ug/m3')
        print(f'PM10:  {comp.get("pm10")} ug/m3')
        print(f'NO2:   {comp.get("no2")} ug/m3')
        print(f'CO:    {comp.get("co")} ug/m3')
        print('OpenWeather Air: OK')
    else:
        print('Error response:', data2)
except Exception as e:
    print(f'OpenWeather Air FAILED: {e}')

print()
print('=== Testing OpenWeather Weather API ===')
try:
    url3 = (
        f'https://api.openweathermap.org/data/2.5/weather'
        f'?lat=28.5638&lon=77.1734&appid={OPENWEATHER_KEY}&units=metric'
    )
    r3 = requests.get(url3, timeout=10)
    print(f'HTTP Status: {r3.status_code}')
    data3 = r3.json()
    if 'main' in data3:
        print(f'Temperature: {data3["main"]["temp"]} C')
        print(f'Humidity:    {data3["main"]["humidity"]}%')
        print(f'Wind speed:  {data3["wind"]["speed"]} m/s')
        print('OpenWeather Weather: OK')
    else:
        print('Error response:', data3)
except Exception as e:
    print(f'OpenWeather Weather FAILED: {e}')
