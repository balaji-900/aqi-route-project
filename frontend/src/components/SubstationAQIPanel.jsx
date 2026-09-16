import React from "react";
import { Clock, Navigation, Wind, ShieldAlert, ChevronRight, Activity } from "lucide-react";
import { getAQICategory } from "../data/delhiLocations";

export default function SubstationAQIPanel({
  routeData,
  selectedWaypoint,
  onSelectWaypoint
}) {
  if (!routeData) {
    return (
      <div className="empty-aqi-panel">
        <div className="empty-icon-wrap">
          <Wind size={36} className="text-gray-400" />
        </div>
        <h3 className="empty-title">Ready to Navigate</h3>
        <p className="empty-desc">
          Select an origin and destination in Delhi above to calculate the fastest route and see live & predicted AQI along each intermediate waypoint.
        </p>
      </div>
    );
  }

  const overallCat = getAQICategory(routeData.overall_aqi_score);

  return (
    <div className="substation-panel-container">
      {/* Top Metrics Banner */}
      <div className="metrics-banner-grid">
        {/* Travel Time */}
        <div className="metric-box">
          <div className="metric-header">
            <Clock size={16} className="metric-icon text-blue-600" />
            <span className="metric-label">Estimated Time</span>
          </div>
          <div className="metric-value">{routeData.total_time_min} <span className="metric-unit">min</span></div>
          <div className="metric-sub">Fastest TomTom route</div>
        </div>

        {/* Distance */}
        <div className="metric-box">
          <div className="metric-header">
            <Navigation size={16} className="metric-icon text-green-600" />
            <span className="metric-label">Driving Distance</span>
          </div>
          <div className="metric-value">{routeData.total_distance_km} <span className="metric-unit">km</span></div>
          <div className="metric-sub">Delhi arterial roads</div>
        </div>

        {/* Route Exposure AQI */}
        <div className="metric-box aqi-exposure-box" style={{ borderColor: overallCat.color }}>
          <div className="metric-header">
            <Activity size={16} className="metric-icon" style={{ color: overallCat.color }} />
            <span className="metric-label">Route Exposure AQI</span>
          </div>
          <div className="metric-value" style={{ color: overallCat.color }}>
            {routeData.overall_aqi_score}
          </div>
          <div className="aqi-badge-pill" style={{ backgroundColor: overallCat.bg, color: overallCat.text }}>
            {overallCat.label} Air Quality
          </div>
        </div>
      </div>

      {/* Health Advisory */}
      <div className="health-advisory-card" style={{ backgroundColor: overallCat.bg, borderColor: overallCat.color }}>
        <ShieldAlert size={20} style={{ color: overallCat.color }} className="flex-shrink-0" />
        <div>
          <span className="advisory-title" style={{ color: overallCat.text }}>Health Advisory: </span>
          <span className="advisory-text" style={{ color: overallCat.text }}>{overallCat.desc}</span>
        </div>
      </div>

      {/* Substation / Waypoints Sequence */}
      <div className="waypoints-section">
        <div className="section-header-row">
          <div>
            <h3 className="section-title">Substations & Waypoints Along Route</h3>
            <p className="section-subtitle">
              Predicted AQI at the exact arrival time you pass each point (Sampled at ~1.5 km intervals)
            </p>
          </div>
          <span className="count-badge">{routeData.waypoints?.length || 0} Points Monitored</span>
        </div>

        <div className="waypoints-cards-scroll">
          {routeData.waypoints?.map((wp, idx) => {
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
                  <div className="wp-category-chip" style={{ backgroundColor: cat.bg, color: cat.text }}>
                    {cat.label}
                  </div>
                </div>

                {/* Coordinates & Location reference */}
                <div className="wp-card-footer">
                  <span className="wp-coords">
                    {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                  </span>
                  <span className="wp-timing-label">
                    {idx === 0 ? "Origin" : idx === routeData.waypoints.length - 1 ? "Destination" : "Transit"}
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
