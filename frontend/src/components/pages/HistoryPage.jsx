import React, { useState, useEffect } from "react";
import { History, Trash2, Route, Clock, MapPin, Wind } from "lucide-react";
import { getAQICategory } from "../../data/delhiLocations";

const LS_HISTORY_KEY = "aqi_route_history";
const MAX_HISTORY = 20;

export function saveRouteToHistory(origin, destination, routes, bestRouteId) {
  try {
    const existing = JSON.parse(localStorage.getItem(LS_HISTORY_KEY) || "[]");
    const bestRoute = routes.find(r => r.id === bestRouteId) || routes[0];
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      origin: { name: origin.name, lat: origin.lat, lon: origin.lon },
      destination: { name: destination.name, lat: destination.lat, lon: destination.lon },
      bestRoute: bestRoute ? {
        name: bestRoute.name,
        total_time_min: bestRoute.total_time_min,
        total_distance_km: bestRoute.total_distance_km,
        overall_aqi_score: bestRoute.overall_aqi_score,
      } : null,
      routeCount: routes.length,
    };
    const updated = [entry, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("History save failed:", e);
  }
}

export default function HistoryPage({ onReplay }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_HISTORY_KEY) || "[]");
      setHistory(stored);
    } catch {
      setHistory([]);
    }
  }, []);

  const clearAll = () => {
    localStorage.removeItem(LS_HISTORY_KEY);
    setHistory([]);
  };

  const removeEntry = (id) => {
    const updated = history.filter(e => e.id !== id);
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="page-container">
      <div className="page-hero">
        <div className="page-hero-icon" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>
          <History size={28} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Route History</h1>
          <p className="page-subtitle">Your previous {history.length} route searches</p>
        </div>
        {history.length > 0 && (
          <button className="hist-clear-btn" onClick={clearAll} title="Clear all history">
            <Trash2 size={15} /> Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="page-empty">
          <History size={48} className="page-empty-icon" />
          <h3>No history yet</h3>
          <p>Your route searches will appear here automatically.</p>
        </div>
      ) : (
        <div className="hist-list">
          {history.map(entry => {
            const cat = entry.bestRoute ? getAQICategory(entry.bestRoute.overall_aqi_score) : null;
            return (
              <div key={entry.id} className="hist-card">
                <div className="hist-card-header">
                  <span className="hist-time">{formatTime(entry.timestamp)}</span>
                  <button className="hist-remove-btn" onClick={() => removeEntry(entry.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="hist-route">
                  <div className="hist-location">
                    <MapPin size={13} style={{ color: "#10b981" }} />
                    <span>{entry.origin.name}</span>
                  </div>
                  <div className="hist-arrow">↓</div>
                  <div className="hist-location">
                    <MapPin size={13} style={{ color: "#ef4444" }} />
                    <span>{entry.destination.name}</span>
                  </div>
                </div>

                {entry.bestRoute && cat && (
                  <div className="hist-stats">
                    <div className="hist-stat">
                      <Clock size={12} /> {entry.bestRoute.total_time_min} min
                    </div>
                    <div className="hist-stat">
                      <Route size={12} /> {entry.bestRoute.total_distance_km} km
                    </div>
                    <div className="hist-stat" style={{ color: cat.color }}>
                      <Wind size={12} /> AQI {entry.bestRoute.overall_aqi_score}
                      <span className="hist-cat-chip" style={{ background: cat.bg, color: cat.text }}>
                        {cat.label}
                      </span>
                    </div>
                  </div>
                )}

                <div className="hist-footer">
                  <span className="hist-route-count">{entry.routeCount} routes analyzed</span>
                  {onReplay && (
                    <button
                      className="hist-replay-btn"
                      onClick={() => onReplay(entry.origin, entry.destination)}
                    >
                      Replay Search →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
