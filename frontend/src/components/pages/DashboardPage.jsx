import React from "react";
import { Wind, Route, Clock, Leaf, Navigation, Activity } from "lucide-react";
import { getAQICategory } from "../../data/delhiLocations";

export default function DashboardPage({ routes, selectedRoute, origin, destination, onNavigate }) {
  const route = selectedRoute || routes?.[0] || null;
  const cat = route ? getAQICategory(route.overall_aqi_score) : null;

  return (
    <div className="page-container">
      <div className="page-hero">
        <div className="page-hero-icon" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
          <Leaf size={28} color="#fff" />
        </div>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time AQI route overview for Delhi</p>
        </div>
      </div>

      {/* Route Summary */}
      {route ? (
        <>
          <div className="dash-route-banner" style={{ borderColor: cat.color }}>
            <div className="dash-route-header">
              <span className="dash-route-label">Active Route</span>
              <span className="dash-aqi-pill" style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.color}` }}>
                AQI {route.overall_aqi_score} — {cat.label}
              </span>
            </div>
            <h2 className="dash-route-name">{route.name}</h2>
            <p className="dash-route-from">
              {origin?.name || "Origin"} → {destination?.name || "Destination"}
            </p>
            <p className="dash-route-desc">{route.description}</p>
          </div>

          <div className="dash-stats-grid">
            <div className="dash-stat-card">
              <Clock size={20} className="dash-stat-icon" style={{ color: "#3b82f6" }} />
              <div className="dash-stat-value">{route.total_time_min}<span className="dash-stat-unit">min</span></div>
              <div className="dash-stat-label">Travel Time</div>
            </div>
            <div className="dash-stat-card">
              <Navigation size={20} className="dash-stat-icon" style={{ color: "#10b981" }} />
              <div className="dash-stat-value">{route.total_distance_km}<span className="dash-stat-unit">km</span></div>
              <div className="dash-stat-label">Distance</div>
            </div>
            <div className="dash-stat-card">
              <Activity size={20} className="dash-stat-icon" style={{ color: cat.color }} />
              <div className="dash-stat-value" style={{ color: cat.color }}>{route.overall_aqi_score}</div>
              <div className="dash-stat-label">AQI Exposure</div>
            </div>
            <div className="dash-stat-card">
              <Route size={20} className="dash-stat-icon" style={{ color: "#f59e0b" }} />
              <div className="dash-stat-value">{route.waypoints?.length || 0}<span className="dash-stat-unit">pts</span></div>
              <div className="dash-stat-label">Waypoints</div>
            </div>
          </div>

          {/* All Routes */}
          {routes.length > 1 && (
            <div className="dash-section">
              <h3 className="dash-section-title">All Route Options</h3>
              <div className="dash-routes-list">
                {routes.map(r => {
                  const rc = getAQICategory(r.overall_aqi_score);
                  return (
                    <div key={r.id} className={`dash-route-row ${r.is_best ? "dash-route-best" : ""}`}>
                      <div className="dash-route-row-left">
                        <Wind size={14} style={{ color: rc.color }} />
                        <span className="dash-route-row-name">{r.name}</span>
                        {r.is_best && <span className="dash-best-chip">Best</span>}
                      </div>
                      <div className="dash-route-row-right">
                        <span className="dash-route-row-stat">{r.total_time_min}min</span>
                        <span className="dash-route-row-stat">{r.total_distance_km}km</span>
                        <span className="dash-route-row-aqi" style={{ color: rc.color }}>AQI {r.overall_aqi_score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="page-empty">
          <Wind size={48} className="page-empty-icon" />
          <h3>No route loaded yet</h3>
          <p>Go to the Map page, choose origin &amp; destination, and find the best route.</p>
          <button className="page-action-btn" onClick={() => onNavigate("map")}>Open Map</button>
        </div>
      )}
    </div>
  );
}
