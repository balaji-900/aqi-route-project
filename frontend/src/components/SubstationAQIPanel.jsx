import React from "react";
import {
  Clock,
  Navigation,
  Wind,
  ShieldAlert,
  ChevronRight,
  Activity,
  Zap,
  Scale,
  Star,
  CheckCircle2,
} from "lucide-react";
import { getAQICategory } from "../data/delhiLocations";

export default function SubstationAQIPanel({
  routes = [],
  selectedRouteId,
  selectedRoute,
  routeData,
  onSelectRoute,
  selectedWaypoint,
  onSelectWaypoint,
}) {
  const activeRoute = selectedRoute || routeData || (routes && routes[0]) || null;

  if (!activeRoute) {
    return (
      <div className="empty-aqi-panel">
        <div className="empty-icon-wrap">
          <Wind size={36} className="text-gray-400" />
        </div>
        <h3 className="empty-title">Ready to Navigate</h3>
        <p className="empty-desc">
          Select an origin and destination in Delhi above to calculate the 3 optional routes (Fastest, Best AQI, and Balanced) with live air quality exposure.
        </p>
      </div>
    );
  }

  const overallCat = getAQICategory(activeRoute.overall_aqi_score);

  const getRouteIcon = (id) => {
    switch (id) {
      case "fastest":
        return <Zap size={18} className="route-type-icon route-icon-fastest" />;
      case "best_aqi":
        return <Wind size={18} className="route-type-icon route-icon-aqi" />;
      case "balanced":
      default:
        return <Scale size={18} className="route-type-icon route-icon-balanced" />;
    }
  };

  return (
    <div className="substation-panel-container">
      {/* 3-Optional Routes Selector Cards */}
      {routes && routes.length > 1 && (
        <div className="route-selection-section">
          <div className="routes-section-header">
            <div className="routes-title-group">
              <h3 className="routes-title">Choose Optional Route</h3>
              <p className="routes-subtitle">
                The darker path on the map highlights the best route. Click any other route below or on the map to switch.
              </p>
            </div>
            <span className="routes-count-tag">{routes.length} Routes Available</span>
          </div>

          <div className="route-cards-grid">
            {routes.map((r) => {
              const isSelected = r.id === (selectedRouteId || activeRoute.id);
              const rCat = getAQICategory(r.overall_aqi_score);

              return (
                <div
                  key={r.id}
                  className={`route-option-card ${isSelected ? "selected" : ""} ${r.is_best ? "best-choice" : ""}`}
                  onClick={() => onSelectRoute && onSelectRoute(r.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="card-top-row">
                    <div className="route-header-title">
                      {getRouteIcon(r.id)}
                      <div>
                        <div className="route-name">{r.name}</div>
                        <div className="route-tag-label">{r.badge}</div>
                      </div>
                    </div>

                    {r.is_best ? (
                      <span className="best-choice-badge">
                        <Star size={11} fill="#F59E0B" color="#F59E0B" /> Best Choice
                      </span>
                    ) : isSelected ? (
                      <span className="active-selected-badge">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : null}
                  </div>

                  <div className="card-stats-row">
                    <div className="stat-time-wrap">
                      <span className="stat-time">{r.total_time_min}</span>
                      <span className="stat-time-unit">min</span>
                    </div>
                    <span className="stat-divider">•</span>
                    <span className="stat-dist">{r.total_distance_km} km</span>
                  </div>

                  {r.traffic_delay_min > 0 ? (
                    <div className="traffic-delay-tag has-delay">
                      +{r.traffic_delay_min} min traffic delay
                    </div>
                  ) : (
                    <div className="traffic-delay-tag normal-traffic">
                      Standard traffic flow
                    </div>
                  )}

                  <div className="card-footer-row">
                    <div
                      className="route-aqi-chip"
                      style={{ backgroundColor: rCat.bg, color: rCat.text, borderColor: rCat.color }}
                    >
                      <span className="aqi-chip-dot" style={{ backgroundColor: rCat.color }} />
                      AQI {r.overall_aqi_score} ({rCat.label})
                    </div>

                    <span className="select-action-label">
                      {isSelected ? "Showing on Map (Darker)" : "Click to view"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Route Title & Description */}
      <div className="active-route-banner">
        <div className="active-route-meta">
          <div className="active-route-tag-row">
            <span className="active-tag-pill">{activeRoute.badge || activeRoute.name}</span>
            {activeRoute.is_best && (
              <span className="best-tag-pill">
                <Star size={12} fill="#F59E0B" color="#F59E0B" /> Recommended Best Route (Darker Path on Map)
              </span>
            )}
          </div>
          <h2 className="active-route-heading">{activeRoute.name} Details</h2>
          <p className="active-route-description">{activeRoute.description}</p>
        </div>
      </div>

      {/* Top Metrics Banner for Selected Route */}
      <div className="metrics-banner-grid">
        {/* Travel Time */}
        <div className="metric-box">
          <div className="metric-header">
            <Clock size={16} className="metric-icon text-blue-600" />
            <span className="metric-label">Estimated Time</span>
          </div>
          <div className="metric-value">
            {activeRoute.total_time_min} <span className="metric-unit">min</span>
          </div>
          <div className="metric-sub">
            {activeRoute.traffic_delay_min > 0
              ? `Includes +${activeRoute.traffic_delay_min} min traffic delay`
              : "Clear arterial traffic"}
          </div>
        </div>

        {/* Distance */}
        <div className="metric-box">
          <div className="metric-header">
            <Navigation size={16} className="metric-icon text-green-600" />
            <span className="metric-label">Driving Distance</span>
          </div>
          <div className="metric-value">
            {activeRoute.total_distance_km} <span className="metric-unit">km</span>
          </div>
          <div className="metric-sub">TomTom evaluated driving path</div>
        </div>

        {/* Route Exposure AQI */}
        <div className="metric-box aqi-exposure-box" style={{ borderColor: overallCat.color }}>
          <div className="metric-header">
            <Activity size={16} className="metric-icon" style={{ color: overallCat.color }} />
            <span className="metric-label">Route Exposure AQI</span>
          </div>
          <div className="metric-value" style={{ color: overallCat.color }}>
            {activeRoute.overall_aqi_score}
          </div>
          <div className="aqi-badge-pill" style={{ backgroundColor: overallCat.bg, color: overallCat.text }}>
            {overallCat.label} Air Quality
          </div>
        </div>
      </div>

      {/* Health Advisory */}
      <div
        className="health-advisory-card"
        style={{ backgroundColor: overallCat.bg, borderColor: overallCat.color }}
      >
        <ShieldAlert size={20} style={{ color: overallCat.color }} className="flex-shrink-0" />
        <div>
          <span className="advisory-title" style={{ color: overallCat.text }}>
            Health Advisory:{" "}
          </span>
          <span className="advisory-text" style={{ color: overallCat.text }}>
            {overallCat.desc}
          </span>
        </div>
      </div>

      {/* Substation / Waypoints Sequence */}
      <div className="waypoints-section">
        <div className="section-header-row">
          <div>
            <h3 className="section-title">
              Substations & Waypoints Along {activeRoute.name}
            </h3>
            <p className="section-subtitle">
              Predicted AQI at arrival ETA along this route (Sampled at ~1.5 km intervals)
            </p>
          </div>
          <span className="count-badge">
            {activeRoute.waypoints?.length || 0} Points Monitored
          </span>
        </div>

        <div className="waypoints-cards-scroll">
          {activeRoute.waypoints?.map((wp, idx) => {
            const cat = getAQICategory(wp.predicted_aqi);
            const isSelected = selectedWaypoint === idx;

            return (
              <div
                key={idx}
                className={`waypoint-card ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectWaypoint(idx)}
                style={{
                  borderLeft: `5px solid ${cat.color}`,
                }}
              >
                {/* Top Row: Waypoint # and Arrival ETA */}
                <div className="wp-card-header">
                  <div className="wp-number-badge">
                    <span className="wp-index">#{idx + 1}</span>
                    <span className="wp-eta-tag">ETA: +{wp.eta_min} min</span>
                  </div>
                  <ChevronRight size={14} className="wp-arrow" />
                </div>

                {/* Middle: Predicted AQI */}
                <div className="wp-card-body">
                  <div className="wp-aqi-num" style={{ color: cat.color }}>
                    {wp.predicted_aqi}
                  </div>
                  <div
                    className="wp-category-chip"
                    style={{ backgroundColor: cat.bg, color: cat.text }}
                  >
                    {cat.label}
                  </div>
                </div>

                {/* Coordinates & Location reference */}
                <div className="wp-card-footer">
                  <span className="wp-coords">
                    {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                  </span>
                  <span className="wp-timing-label">
                    {idx === 0
                      ? "Origin"
                      : idx === activeRoute.waypoints.length - 1
                      ? "Destination"
                      : "Transit"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
