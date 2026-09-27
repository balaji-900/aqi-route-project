import React, { useState, useEffect, useCallback } from "react";
import { BarChart2, RefreshCw, Wind, Thermometer, Droplets, MapPin } from "lucide-react";
import { getAQICategory } from "../../data/delhiLocations";

const BACKEND_URL = "";

const FORECAST_LOCATIONS = [
  { name: "R.K. Puram", lat: 28.5642, lon: 77.1806 },
  { name: "Anand Vihar", lat: 28.6476, lon: 77.3158 },
  { name: "Punjabi Bagh", lat: 28.6740, lon: 77.1310 },
  { name: "ITO", lat: 28.6289, lon: 77.2415 },
  { name: "Connaught Place", lat: 28.6315, lon: 77.2167 },
  { name: "Dwarka Sector 8", lat: 28.5710, lon: 77.0673 },
];

function AQICard({ loc, data, loading, error }) {
  const cat = data ? getAQICategory(data.predicted_aqi) : null;
  return (
    <div className={`forecast-card ${loading ? "forecast-card-loading" : ""}`}
         style={cat ? { borderTop: `4px solid ${cat.color}` } : {}}>
      <div className="fc-location">
        <MapPin size={13} />
        <span>{loc.name}</span>
      </div>

      {loading && (
        <div className="fc-loading">
          <div className="fc-spinner" />
          <span>Fetching live data…</span>
        </div>
      )}

      {error && !loading && (
        <div className="fc-error">⚠ {error}</div>
      )}

      {data && !loading && cat && (
        <>
          <div className="fc-aqi-num" style={{ color: cat.color }}>{data.predicted_aqi}</div>
          <div className="fc-category" style={{ background: cat.bg, color: cat.text }}>{cat.label}</div>
          <p className="fc-desc">{cat.desc}</p>

          <div className="fc-weather-row">
            {data.weather?.temperature != null && (
              <div className="fc-weather-item">
                <Thermometer size={13} />
                <span>{data.weather.temperature.toFixed(1)}°C</span>
              </div>
            )}
            {data.weather?.humidity != null && (
              <div className="fc-weather-item">
                <Droplets size={13} />
                <span>{data.weather.humidity}%</span>
              </div>
            )}
            {data.weather?.wind_speed != null && (
              <div className="fc-weather-item">
                <Wind size={13} />
                <span>{data.weather.wind_speed.toFixed(1)} m/s</span>
              </div>
            )}
          </div>

          <div className="fc-pollutants">
            {data.pollutants?.pm2_5 != null && (
              <span className="fc-poll-chip">PM2.5: {data.pollutants.pm2_5.toFixed(1)}</span>
            )}
            {data.pollutants?.pm10 != null && (
              <span className="fc-poll-chip">PM10: {data.pollutants.pm10.toFixed(1)}</span>
            )}
            {data.pollutants?.no2 != null && (
              <span className="fc-poll-chip">NO₂: {data.pollutants.no2.toFixed(1)}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ForecastPage() {
  const [results, setResults] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [errorMap, setErrorMap] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    const loadState = {};
    FORECAST_LOCATIONS.forEach(l => { loadState[l.name] = true; });
    setLoadingMap(loadState);
    setErrorMap({});

    await Promise.all(
      FORECAST_LOCATIONS.map(async (loc) => {
        try {
          const res = await fetch(`${BACKEND_URL}/aqi-point`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: loc.lat, lon: loc.lon, location_name: loc.name }),
          });
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          const data = await res.json();
          setResults(prev => ({ ...prev, [loc.name]: data }));
          setErrorMap(prev => ({ ...prev, [loc.name]: null }));
        } catch (e) {
          setErrorMap(prev => ({
            ...prev,
            [loc.name]: e.message.includes("fetch") ? "Backend offline" : e.message
          }));
        } finally {
          setLoadingMap(prev => ({ ...prev, [loc.name]: false }));
        }
      })
    );
    setLastUpdated(new Date());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const anyLoading = Object.values(loadingMap).some(Boolean);

  return (
    <div className="page-container">
      <div className="page-hero">
        <div className="page-hero-icon" style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}>
          <BarChart2 size={28} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Live AQI Forecast</h1>
          <p className="page-subtitle">Real-time air quality across Delhi monitoring stations</p>
        </div>
        <button
          className={`fc-refresh-btn ${anyLoading ? "fc-refreshing" : ""}`}
          onClick={fetchAll}
          disabled={anyLoading}
          title="Refresh data"
        >
          <RefreshCw size={16} className={anyLoading ? "fc-spin" : ""} />
          {anyLoading ? "Updating…" : "Refresh"}
        </button>
      </div>

      {lastUpdated && (
        <div className="fc-last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()} · Source: OpenWeather API + ML Model
        </div>
      )}

      <div className="forecast-grid">
        {FORECAST_LOCATIONS.map(loc => (
          <AQICard
            key={loc.name}
            loc={loc}
            data={results[loc.name]}
            loading={!!loadingMap[loc.name]}
            error={errorMap[loc.name]}
          />
        ))}
      </div>
    </div>
  );
}
