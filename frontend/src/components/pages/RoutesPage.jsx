import React from "react";
import { Route, Clock, Navigation, Wind, Zap, Scale, Star, ChevronRight } from "lucide-react";
import { getAQICategory } from "../../data/delhiLocations";

function RouteTypeIcon({ id }) {
  if (id === "fastest") return <Zap size={16} style={{ color: "#f59e0b" }} />;
  if (id === "best_aqi") return <Wind size={16} style={{ color: "#10b981" }} />;
  return <Scale size={16} style={{ color: "#3b82f6" }} />;
}

export default function RoutesPage({ routes, selectedRouteId, onSelectRoute, origin, destination }) {
  if (!routes || routes.length === 0) {
    return (
      <div className="page-container">
        <div className="page-hero">
          <div className="page-hero-icon" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
            <Route size={28} color="#fff" />
          </div>
          <div>
            <h1 className="page-title">Routes</h1>
            <p className="page-subtitle">Route options and AQI exposure analysis</p>
          </div>
        </div>
        <div className="page-empty">
          <Route size={48} className="page-empty-icon" />
          <h3>No routes calculated</h3>
          <p>Go to the Map and search for a route to see the analysis here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-hero">
        <div className="page-hero-icon" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
          <Route size={28} color="#fff" />
        </div>
        <div>
          <h1 className="page-title">Routes</h1>
          <p className="page-subtitle">
            {origin?.name} → {destination?.name}
          </p>
        </div>
      </div>

      <div className="routes-page-list">
        {routes.map(r => {
          const cat = getAQICategory(r.overall_aqi_score);
          const isSelected = r.id === selectedRouteId;
          return (
            <div
              key={r.id}
              className={`routes-page-card ${isSelected ? "routes-page-card-active" : ""} ${r.is_best ? "routes-page-card-best" : ""}`}
              onClick={() => onSelectRoute && onSelectRoute(r.id)}
            >
              <div className="rpc-header">
                <div className="rpc-title-row">
                  <RouteTypeIcon id={r.id} />
                  <span className="rpc-name">{r.name}</span>
                  {r.is_best && (
                    <span className="rpc-best-badge">
                      <Star size={11} fill="#f59e0b" color="#f59e0b" /> Recommended
                    </span>
                  )}
                </div>
                <ChevronRight size={16} className="rpc-arrow" />
              </div>

              <p className="rpc-desc">{r.description}</p>

              <div className="rpc-stats">
                <div className="rpc-stat">
                  <Clock size={13} /> <span>{r.total_time_min} min</span>
                </div>
                <div className="rpc-stat">
                  <Navigation size={13} /> <span>{r.total_distance_km} km</span>
                </div>
                <div className="rpc-stat" style={{ color: cat.color }}>
                  <Wind size={13} /> <span>AQI {r.overall_aqi_score}</span>
                </div>
              </div>

              <div className="rpc-aqi-bar">
                <div
                  className="rpc-aqi-fill"
                  style={{
                    width: `${Math.min(100, (r.overall_aqi_score / 500) * 100)}%`,
                    background: cat.color
                  }}
                />
              </div>
              <div className="rpc-aqi-label" style={{ color: cat.text, background: cat.bg }}>
                {cat.label} Air Quality along this route
              </div>

              {/* Waypoints */}
              {r.waypoints && r.waypoints.length > 0 && (
                <div className="rpc-waypoints">
                  <div className="rpc-wp-title">Key waypoints ({r.waypoints.length})</div>
                  <div className="rpc-wp-scroll">
                    {r.waypoints.map((wp, i) => {
                      const wc = getAQICategory(wp.predicted_aqi);
                      return (
                        <div key={i} className="rpc-wp-chip" style={{ background: wc.bg, color: wc.text, border: `1px solid ${wc.color}` }}>
                          <span className="rpc-wp-idx">#{i + 1}</span>
                          <span>AQI {wp.predicted_aqi}</span>
                          <span className="rpc-wp-eta">+{wp.eta_min}m</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
