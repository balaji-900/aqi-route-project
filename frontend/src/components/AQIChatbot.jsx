import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  ChevronLeft,
  Wind,
  Clock,
  Route,
  Leaf,
  Loader2,
  AlertCircle,
  BarChart2,
} from "lucide-react";
import { getAQICategory } from "../data/delhiLocations";

const BACKEND_URL = "";

/* ─────────────────────────────────────────────────
   Helper: AQI colour badge
───────────────────────────────────────────────── */
function AQIBadge({ aqi }) {
  const cat = getAQICategory(aqi);
  return (
    <span
      className="cb-aqi-badge"
      style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.color}` }}
    >
      {aqi} — {cat.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────
   Pollutant mini-table
───────────────────────────────────────────────── */
function PollutantRow({ label, value, unit }) {
  if (value == null) return null;
  return (
    <div className="cb-pollutant-row">
      <span className="cb-pollutant-label">{label}</span>
      <span className="cb-pollutant-value">
        {typeof value === "number" ? value.toFixed(2) : value}{" "}
        <span className="cb-pollutant-unit">{unit}</span>
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Answer renderers for each question type
───────────────────────────────────────────────── */
function AnswerCurrentAQI({ data }) {
  const cat = getAQICategory(data.predicted_aqi);
  return (
    <div className="cb-answer">
      <div className="cb-answer-location">📍 {data.location}</div>
      <div className="cb-answer-headline">
        Current AQI <AQIBadge aqi={data.predicted_aqi} />
      </div>
      <p className="cb-answer-desc" style={{ color: cat.text, background: cat.bg, borderColor: cat.color }}>
        {cat.desc}
      </p>
      <div className="cb-pollutant-grid">
        <PollutantRow label="PM2.5" value={data.pollutants?.pm2_5} unit="µg/m³" />
        <PollutantRow label="PM10" value={data.pollutants?.pm10} unit="µg/m³" />
        <PollutantRow label="NO₂" value={data.pollutants?.no2} unit="µg/m³" />
        <PollutantRow label="O₃" value={data.pollutants?.o3} unit="µg/m³" />
      </div>
      {data.weather && (
        <div className="cb-weather-strip">
          🌡 {data.weather.temperature?.toFixed(1)}°C &nbsp;|&nbsp;
          💧 {data.weather.humidity}% humidity &nbsp;|&nbsp;
          🌬 {data.weather.wind_speed?.toFixed(1)} m/s
        </div>
      )}
      <div className="cb-answer-source">Source: OpenWeather API + ML Model (GRU/Residual)</div>
    </div>
  );
}

function AnswerForecastAQI({ data }) {
  const cat = getAQICategory(data.predicted_aqi);
  return (
    <div className="cb-answer">
      <div className="cb-answer-location">📍 {data.location}</div>
      <div className="cb-answer-headline">
        AQI in {data.hours_ahead}h ({data.forecast_time}) <AQIBadge aqi={data.predicted_aqi} />
      </div>
      <p className="cb-answer-desc" style={{ color: cat.text, background: cat.bg, borderColor: cat.color }}>
        {cat.desc}
      </p>
      <div className="cb-pollutant-grid">
        <PollutantRow label="PM2.5 (now)" value={data.pollutants?.pm2_5} unit="µg/m³" />
        <PollutantRow label="PM10 (now)" value={data.pollutants?.pm10} unit="µg/m³" />
      </div>
      <div className="cb-answer-source">Forecast via ML Model — live pollutants × future timestamp</div>
    </div>
  );
}

function AnswerShortestRoute({ routes, origin, destination }) {
  if (!routes || routes.length === 0) {
    return (
      <div className="cb-answer cb-answer-warn">
        <AlertCircle size={16} /> No route data yet. Click <strong>Find Best Route</strong> on the map first.
      </div>
    );
  }
  // Fastest route = lowest total_time_min
  const fastest = [...routes].sort((a, b) => a.total_time_min - b.total_time_min)[0];
  const cat = getAQICategory(fastest.overall_aqi_score);
  return (
    <div className="cb-answer">
      <div className="cb-answer-location">
        🚗 {origin?.name || "Origin"} → {destination?.name || "Destination"}
      </div>
      <div className="cb-answer-headline">Shortest Route: <strong>{fastest.name}</strong></div>
      <div className="cb-stat-row">
        <div className="cb-stat"><Clock size={13} /> {fastest.total_time_min} min</div>
        <div className="cb-stat"><Route size={13} /> {fastest.total_distance_km} km</div>
        <div className="cb-stat">
          <Wind size={13} /> AQI exposure{" "}
          <span style={{ color: cat.color, fontWeight: 700 }}>{fastest.overall_aqi_score}</span>
        </div>
      </div>
      {fastest.traffic_delay_min > 0 && (
        <div className="cb-traffic-tag">⚠ +{fastest.traffic_delay_min} min traffic delay</div>
      )}
      <p className="cb-answer-note">{fastest.description}</p>
      <div className="cb-answer-source">Data: TomTom Routing API + live AQI waypoints</div>
    </div>
  );
}

function AnswerLowestAQIRoute({ routes, origin, destination }) {
  if (!routes || routes.length === 0) {
    return (
      <div className="cb-answer cb-answer-warn">
        <AlertCircle size={16} /> No route data yet. Click <strong>Find Best Route</strong> on the map first.
      </div>
    );
  }
  // Best AQI = lowest overall_aqi_score
  const cleanest = [...routes].sort((a, b) => a.overall_aqi_score - b.overall_aqi_score)[0];
  const cat = getAQICategory(cleanest.overall_aqi_score);

  // Compare vs fastest for context
  const fastest = [...routes].sort((a, b) => a.total_time_min - b.total_time_min)[0];
  const extraMin = (cleanest.total_time_min - fastest.total_time_min).toFixed(1);
  const aqiSaved = (fastest.overall_aqi_score - cleanest.overall_aqi_score).toFixed(1);

  return (
    <div className="cb-answer">
      <div className="cb-answer-location">
        🌿 {origin?.name || "Origin"} → {destination?.name || "Destination"}
      </div>
      <div className="cb-answer-headline">
        Cleanest Air Route: <strong>{cleanest.name}</strong>
      </div>
      <div className="cb-stat-row">
        <div className="cb-stat"><Clock size={13} /> {cleanest.total_time_min} min</div>
        <div className="cb-stat"><Route size={13} /> {cleanest.total_distance_km} km</div>
        <div className="cb-stat">
          <Leaf size={13} /> AQI{" "}
          <span style={{ color: cat.color, fontWeight: 700 }}>{cleanest.overall_aqi_score}</span>
          {" "}({cat.label})
        </div>
      </div>

      {/* Comparison callout */}
      {routes.length > 1 && (
        <div className={`cb-comparison-chip ${Number(aqiSaved) > 0 ? "better" : "same"}`}>
          {Number(aqiSaved) > 0
            ? `↓ ${aqiSaved} AQI lower than fastest route${Number(extraMin) > 0 ? ` (+${extraMin} min extra)` : ""}`
            : "Same AQI as fastest route — great conditions today!"}
        </div>
      )}

      {/* Waypoints summary */}
      {cleanest.waypoints && cleanest.waypoints.length > 0 && (
        <div className="cb-waypoints-strip">
          <div className="cb-wp-label">Worst AQI point along route:</div>
          {(() => {
            const worst = [...cleanest.waypoints].sort(
              (a, b) => b.predicted_aqi - a.predicted_aqi
            )[0];
            const wCat = getAQICategory(worst.predicted_aqi);
            return (
              <span className="cb-wp-chip" style={{ background: wCat.bg, color: wCat.text }}>
                {worst.predicted_aqi} ({wCat.label}) at +{worst.eta_min} min
              </span>
            );
          })()}
        </div>
      )}

      <p className="cb-answer-note">{cleanest.description}</p>
      <div className="cb-answer-source">
        ML-scored exposure: weighted AQI × time at each {Math.ceil(cleanest.waypoints?.length || 0)} waypoint(s)
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Main Chatbot Component
───────────────────────────────────────────────── */
export default function AQIChatbot({ origin, destination, routes, selectedRoute }) {
  const [open, setOpen] = useState(false);
  // view: 'menu' | 'q1_loc' | 'q2_loc' | 'answering' | 'answer'
  const [view, setView] = useState("menu");
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answerData, setAnswerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // For location-picker sub-menu (Q1 & Q2)
  const [chosenLocation, setChosenLocation] = useState(null);

  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 120);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  const reset = () => {
    setView("menu");
    setActiveQuestion(null);
    setAnswerData(null);
    setApiError(null);
    setChosenLocation(null);
    setLoading(false);
  };

  /* ── location choices for Q1/Q2 ── */
  const locationOptions = [
    origin && { label: `From: ${origin.name}`, loc: origin },
    destination && { label: `To: ${destination.name}`, loc: destination },
    selectedRoute?.waypoints?.[Math.floor((selectedRoute.waypoints.length - 1) / 2)] && {
      label: "Midpoint of current route",
      loc: {
        name: "Route Midpoint",
        lat: selectedRoute.waypoints[Math.floor((selectedRoute.waypoints.length - 1) / 2)].lat,
        lon: selectedRoute.waypoints[Math.floor((selectedRoute.waypoints.length - 1) / 2)].lon,
      },
    },
  ].filter(Boolean);

  /* ── Q1: current AQI ── */
  const fetchCurrentAQI = async (loc) => {
    setLoading(true);
    setView("answering");
    setApiError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/aqi-point`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: loc.lat, lon: loc.lon, location_name: loc.name }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setAnswerData({ type: "current_aqi", payload: data });
      setView("answer");
    } catch (e) {
      setApiError(e.message.includes("Failed to fetch")
        ? "Cannot reach backend. Is FastAPI running on port 8000?"
        : e.message);
      setView("answer");
    } finally {
      setLoading(false);
    }
  };

  /* ── Q2: AQI forecast ── */
  const fetchForecastAQI = async (loc) => {
    setLoading(true);
    setView("answering");
    setApiError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/aqi-forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: loc.lat, lon: loc.lon, location_name: loc.name, hours_ahead: 3 }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setAnswerData({ type: "forecast_aqi", payload: data });
      setView("answer");
    } catch (e) {
      setApiError(e.message.includes("Failed to fetch")
        ? "Cannot reach backend. Is FastAPI running on port 8000?"
        : e.message);
      setView("answer");
    } finally {
      setLoading(false);
    }
  };

  /* ── Q3 & Q4: use existing routes state (no API call needed) ── */
  const answerFromRoutes = (type) => {
    setActiveQuestion(type);
    setAnswerData({ type, payload: null });
    setView("answer");
  };

  /* ── Question menu items ── */
  const QUESTIONS = [
    {
      id: "q1",
      icon: <Wind size={18} />,
      color: "#10B981",
      text: "What is the current AQI at a location?",
      sub: "Live ML-predicted air quality",
      onSelect: () => { setActiveQuestion("q1"); setView("q1_loc"); },
    },
    {
      id: "q2",
      icon: <BarChart2 size={18} />,
      color: "#3B82F6",
      text: "What will the AQI be in 3 hours?",
      sub: "ML forecast via future timestamp",
      onSelect: () => { setActiveQuestion("q2"); setView("q2_loc"); },
    },
    {
      id: "q3",
      icon: <Clock size={18} />,
      color: "#F59E0B",
      text: "Which is the fastest route?",
      sub: `${origin?.name || "From"} → ${destination?.name || "To"}`,
      onSelect: () => answerFromRoutes("shortest"),
    },
    {
      id: "q4",
      icon: <Leaf size={18} />,
      color: "#059669",
      text: "Which route has the lowest AQI exposure?",
      sub: `${origin?.name || "From"} → ${destination?.name || "To"}`,
      onSelect: () => answerFromRoutes("lowest_aqi"),
    },
  ];

  /* ── Render ── */
  return (
    <>
      {/* FAB */}
      <button
        className={`chatbot-fab ${open ? "fab-active" : ""}`}
        onClick={() => { setOpen((v) => !v); if (open) reset(); }}
        aria-label="Open AQI Chatbot"
        title="AQI Assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && <span className="fab-pulse" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="chatbot-panel" ref={panelRef} role="dialog" aria-label="AQI Chatbot">
          {/* Header */}
          <div className="cb-header">
            <div className="cb-header-left">
              {(view !== "menu") && (
                <button className="cb-back-btn" onClick={reset} aria-label="Back to menu">
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="cb-header-brand">
                <div className="cb-header-logo"><Leaf size={14} /></div>
                <div>
                  <div className="cb-header-title">AQI Assistant</div>
                  <div className="cb-header-sub">Powered by ML + Live Data</div>
                </div>
              </div>
            </div>
            <button className="cb-close-btn" onClick={() => { setOpen(false); reset(); }} aria-label="Close chatbot">
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="cb-body">

            {/* ── MENU ── */}
            {view === "menu" && (
              <div className="cb-menu">
                <p className="cb-menu-intro">
                  Hi! Ask me about Delhi's air quality and routes. Choose a question:
                </p>
                <div className="cb-questions">
                  {QUESTIONS.map((q) => (
                    <button
                      key={q.id}
                      className="cb-question-btn"
                      onClick={q.onSelect}
                      style={{ "--q-accent": q.color }}
                    >
                      <span className="cb-q-icon" style={{ background: `${q.color}18`, color: q.color }}>
                        {q.icon}
                      </span>
                      <span className="cb-q-content">
                        <span className="cb-q-text">{q.text}</span>
                        <span className="cb-q-sub">{q.sub}</span>
                      </span>
                      <span className="cb-q-arrow">›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── LOCATION PICKER for Q1 ── */}
            {view === "q1_loc" && (
              <div className="cb-loc-picker">
                <p className="cb-loc-intro">
                  <Wind size={16} style={{ verticalAlign: "middle" }} />
                  {" "}Select a location to check <strong>current AQI</strong>:
                </p>
                {locationOptions.length === 0 ? (
                  <div className="cb-answer-warn">
                    <AlertCircle size={15} /> Set origin and destination on the map first.
                  </div>
                ) : (
                  locationOptions.map((opt, i) => (
                    <button
                      key={i}
                      className="cb-loc-btn"
                      onClick={() => fetchCurrentAQI(opt.loc)}
                    >
                      📍 {opt.label}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ── LOCATION PICKER for Q2 ── */}
            {view === "q2_loc" && (
              <div className="cb-loc-picker">
                <p className="cb-loc-intro">
                  <BarChart2 size={16} style={{ verticalAlign: "middle" }} />
                  {" "}Select a location to <strong>forecast AQI in 3 hours</strong>:
                </p>
                {locationOptions.length === 0 ? (
                  <div className="cb-answer-warn">
                    <AlertCircle size={15} /> Set origin and destination on the map first.
                  </div>
                ) : (
                  locationOptions.map((opt, i) => (
                    <button
                      key={i}
                      className="cb-loc-btn"
                      onClick={() => fetchForecastAQI(opt.loc)}
                    >
                      📍 {opt.label}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ── LOADING ── */}
            {view === "answering" && (
              <div className="cb-loading">
                <Loader2 size={28} className="cb-spinner" />
                <span>Querying live sensors + ML model…</span>
              </div>
            )}

            {/* ── ANSWER ── */}
            {view === "answer" && (
              <div className="cb-answer-wrapper">
                {apiError ? (
                  <div className="cb-error-box">
                    <AlertCircle size={16} /> {apiError}
                  </div>
                ) : answerData?.type === "current_aqi" ? (
                  <AnswerCurrentAQI data={answerData.payload} />
                ) : answerData?.type === "forecast_aqi" ? (
                  <AnswerForecastAQI data={answerData.payload} />
                ) : answerData?.type === "shortest" ? (
                  <AnswerShortestRoute routes={routes} origin={origin} destination={destination} />
                ) : answerData?.type === "lowest_aqi" ? (
                  <AnswerLowestAQIRoute routes={routes} origin={origin} destination={destination} />
                ) : null}

                <button className="cb-menu-again-btn" onClick={reset}>
                  ← Back to Questions
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
