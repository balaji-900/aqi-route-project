import requests, json

r = requests.post(
    'http://127.0.0.1:8000/best-route',
    json={
        'origin_lat': 28.5638,
        'origin_lon': 77.1734,
        'dest_lat': 28.6562,
        'dest_lon': 77.2410
    },
    timeout=30
)
print('Status:', r.status_code)
data = r.json()

if r.status_code == 200:
    routes = data.get('routes', [])
    print('Routes returned:', len(routes))
    for route in routes:
        name = route.get('name', 'Unknown')
        aqi = route.get('overall_aqi_score', '?')
        mins = route.get('total_time_min', '?')
        km = route.get('total_distance_km', '?')
        best = '★ BEST' if route.get('is_best') else ''
        print(f'  {best} {name} | AQI: {aqi} | {mins}min | {km}km')
    print()
    print('best_route_id:', data.get('best_route_id'))
else:
    print('ERROR:')
    print(json.dumps(data, indent=2))
