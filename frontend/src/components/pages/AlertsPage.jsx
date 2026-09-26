import React from "react";
import { Bell, Wind, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { getAQICategory } from "../../data/delhiLocations";

function AlertItem({ icon, color, bg, title, body, time, type }) {
  return (
    <div className={`alert-item alert-item-${type}`} style={{ borderLeft: `4px solid ${color}` }}>
      <div className="alert-item-icon" style={{ color, background: bg }}>
        {icon}
      </div>
      <div className="alert-item-body">
        <div className="alert-item-title">{title}</div>
        <div className="alert-item-body-text">{body}</div>
        <div className="alert-item-time">{time}</div>
      </div>
    </div>
  );
}

export default function AlertsPage({ routes, selectedRoute }) {
  const route = selectedRoute || routes?.[0] || null;
  const cat = route ? getAQICategory(route.overall_aqi_score) : null;

  // Generate dynamic alerts from current route data
  const alerts = [];

  if (route && cat) {
    if (route.overall_aqi_score > 300) {
      alerts.push({
        type: "danger",
        color: "#ef4444",
        bg: "#fef2f2",
        icon: <AlertTriangle size={18} />,
        title: "Severe AQI Alert",
        body: `Current route AQI is ${route.overall_aqi_score} (${cat.label}). ${cat.desc}`,
        time: "Now · Live Route Data",
      });
    } else if (route.overall_aqi_score > 200) {
      alerts.push({
        type: "warning",
        color: "#f97316",
        bg: "#fff7ed",
        icon: <AlertTriangle size={18} />,
        title: "Poor Air Quality Warning",
        body: `Route AQI ${route.overall_aqi_score} (${cat.label}). Avoid prolonged outdoor exposure.`,
        time: "Now · Live Route Data",
      });
    } else if (route.overall_aqi_score > 100) {
      alerts.push({
        type: "moderate",
        color: "#f59e0b",
        bg: "#fffbeb",
        icon: <Wind size={18} />,
        title: "Moderate Air Quality",
        body: `Route AQI ${route.overall_aqi_score} (${cat.label}). Sensitive individuals should take precautions.`,
        time: "Now · Live Route Data",
      });
    } else {
      alerts.push({
        type: "good",
        color: "#10b981",
        bg: "#ecfdf5",
        icon: <CheckCircle size={18} />,
        title: "Good Air Quality",
        body: `Route AQI ${route.overall_aqi_score} (${cat.label}). ${cat.desc}`,
        time: "Now · Live Route Data",
      });
    }

    if (route.traffic_delay_min > 0) {
      alerts.push({
        type: "info",
        color: "#3b82f6",
        bg: "#eff6ff",
        icon: <Info size={18} />,
        title: "Traffic Delay Detected",
        body: `Current route has a +${route.traffic_delay_min} min traffic delay. Consider alternate routes.`,
        time: "Now · TomTom Traffic API",
      });
    }

    // Check for worst waypoint
    if (route.waypoints?.length > 0) {
      const worst = [...route.waypoints].sort((a, b) => b.predicted_aqi - a.predicted_aqi)[0];
      const wCat = getAQICategory(worst.predicted_aqi);
      if (worst.predicted_aqi > 200) {
        alerts.push({
          type: "warning",
          color: wCat.color,
          bg: wCat.bg,
          icon: <Wind size={18} />,
          title: "High AQI Hotspot on Route",
          body: `Waypoint at +${worst.eta_min} min (${worst.lat.toFixed(3)}, ${worst.lon.toFixed(3)}) has AQI ${worst.predicted_aqi} — ${wCat.label}.`,
          time: "Predicted · ML Model",
        });
      }
    }
  }

  // Static advisory alerts
  alerts.push({
    type: "info",
    color: "#6366f1",
    bg: "#eef2ff",
    icon: <Info size={18} />,
    title: "Delhi Winter Advisory",
    body: "AQI levels typically worsen during Oct–Jan due to stubble burning and temperature inversions. Check forecasts regularly.",
    time: "Advisory · CPCB",
  });

  return (
    <div className="page-container">
      <div className="page-hero">
        <div className="page-hero-icon" style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}>
          <Bell size={28} color="#fff" />
        </div>
        <div>
          <h1 className="page-title">AQI Alerts</h1>
          <p className="page-subtitle">{alerts.length} active alerts for your current route</p>
        </div>
      </div>

      <div className="alerts-list">
        {alerts.map((a, i) => (
          <AlertItem key={i} {...a} />
        ))}
      </div>

      {!route && (
        <div className="page-empty" style={{ marginTop: 24 }}>
          <Bell size={48} className="page-empty-icon" />
          <h3>No route data loaded</h3>
          <p>Load a route on the Map page to see live AQI alerts.</p>
        </div>
      )}
    </div>
  );
}
