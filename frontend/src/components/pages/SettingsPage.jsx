import React from "react";
import { Settings, Sun, Moon, Map, Bell, Shield } from "lucide-react";

const LS_THEME_KEY = "aqi_theme";

export default function SettingsPage({ isDark, onToggleTheme }) {
  return (
    <div className="page-container">
      <div className="page-hero">
        <div className="page-hero-icon" style={{ background: "linear-gradient(135deg,#64748b,#334155)" }}>
          <Settings size={28} color="#fff" />
        </div>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">App preferences and configuration</p>
        </div>
      </div>

      <div className="settings-sections">
        {/* Appearance */}
        <div className="settings-section">
          <h3 className="settings-section-title">Appearance</h3>

          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon">
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <div className="settings-row-label">Theme</div>
                <div className="settings-row-sub">
                  Currently: <strong>{isDark ? "Dark Mode" : "Light Mode"}</strong>
                  {" "}· Saved in localStorage
                </div>
              </div>
            </div>
            <button
              className={`theme-toggle-pill ${isDark ? "dark" : "light"}`}
              onClick={onToggleTheme}
              aria-label="Toggle theme"
            >
              <span className="theme-pill-knob" />
            </button>
          </div>

          <div className="settings-theme-preview">
            <div className={`tp-box tp-light ${!isDark ? "tp-active" : ""}`} onClick={!isDark ? undefined : onToggleTheme}>
              <Sun size={16} /> Light
            </div>
            <div className={`tp-box tp-dark ${isDark ? "tp-active" : ""}`} onClick={isDark ? undefined : onToggleTheme}>
              <Moon size={16} /> Dark
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="settings-section">
          <h3 className="settings-section-title">Map</h3>
          <div className="settings-row settings-row-static">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Map size={18} /></div>
              <div>
                <div className="settings-row-label">Map Provider</div>
                <div className="settings-row-sub">OpenStreetMap via Leaflet.js</div>
              </div>
            </div>
            <span className="settings-tag">Active</span>
          </div>
          <div className="settings-row settings-row-static">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Map size={18} /></div>
              <div>
                <div className="settings-row-label">Routing Engine</div>
                <div className="settings-row-sub">TomTom Traffic API + ML AQI Model</div>
              </div>
            </div>
            <span className="settings-tag">Active</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <h3 className="settings-section-title">Data Sources</h3>
          <div className="settings-row settings-row-static">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Bell size={18} /></div>
              <div>
                <div className="settings-row-label">AQI Source</div>
                <div className="settings-row-sub">OpenWeather Air Pollution API (live)</div>
              </div>
            </div>
            <span className="settings-tag settings-tag-green">Live</span>
          </div>
          <div className="settings-row settings-row-static">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Shield size={18} /></div>
              <div>
                <div className="settings-row-label">ML Model</div>
                <div className="settings-row-sub">GRU/Residual neural network · Backend inference</div>
              </div>
            </div>
            <span className="settings-tag settings-tag-green">Active</span>
          </div>
        </div>

        {/* About */}
        <div className="settings-section settings-about">
          <h3 className="settings-section-title">About</h3>
          <p className="settings-about-text">
            <strong>AQI Route Navigator</strong> — Delhi Clean Air<br />
            Version 2.0.0 · FastAPI + React + Leaflet<br />
            ML-powered AQI prediction with TomTom routing
          </p>
        </div>
      </div>
    </div>
  );
}
