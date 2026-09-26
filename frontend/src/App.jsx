import React, { useState, useEffect, useCallback, useRef } from "react";
import GoogleMapsSearchBar from "./components/GoogleMapsSearchBar";
import RouteMap from "./components/RouteMap";
import SubstationAQIPanel from "./components/SubstationAQIPanel";
import AuthModal from "./components/AuthModal";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import AQIChatbot from "./components/AQIChatbot";
import DashboardPage from "./components/pages/DashboardPage";
import RoutesPage from "./components/pages/RoutesPage";
import ForecastPage from "./components/pages/ForecastPage";
import HistoryPage, { saveRouteToHistory } from "./components/pages/HistoryPage";
import AlertsPage from "./components/pages/AlertsPage";
import ProfilePage from "./components/pages/ProfilePage";
import SettingsPage from "./components/pages/SettingsPage";
import { DELHI_LOCATIONS } from "./data/delhiLocations";
import "./App.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
const LS_USER_KEY = "aqi_user";
const LS_THEME_KEY = "aqi_theme";

export default function App() {
  // ── Auth state ─────────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [showAuth, setShowAuth] = useState(false);

  // ── Theme state ────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(LS_THEME_KEY);
    if (saved !== null) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem(LS_THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  // ── Sidebar state ──────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("map");

  // ── Fullscreen map state ───────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Route / AQI state ─────────────────────────────────────────────────────
  const [origin, setOrigin] = useState(
    DELHI_LOCATIONS.find((l) => l.name.includes("R.K. Puram")) || DELHI_LOCATIONS[0]
  );
  const [destination, setDestination] = useState(
    DELHI_LOCATIONS.find((l) => l.name.includes("Red Fort")) || DELHI_LOCATIONS[1]
  );
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);

  const selectedRoute =
    routes.find((r) => r.id === selectedRouteId) || routes[0] || null;

  // ── Alert count for sidebar badge ──────────────────────────────────────────
  const alertCount = (() => {
    if (!selectedRoute) return 0;
    let c = 0;
    if (selectedRoute.overall_aqi_score > 100) c++;
    if (selectedRoute.traffic_delay_min > 0) c++;
    return c;
  })();

  // Auto-fetch on mount
  useEffect(() => {
    if (origin && destination) handleFindRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFindRoute = useCallback(async () => {
    if (!origin || !destination) {
      setError("Please choose both an origin and a destination in Delhi.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSelectedWaypoint(null);

    try {
      const response = await fetch(`${BACKEND_URL}/best-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_lat: origin.lat,
          origin_lon: origin.lon,
          dest_lat: destination.lat,
          dest_lon: destination.lon,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status === "success") {
        const fetchedRoutes = data.routes || (data.route ? [data.route] : []);
        const bestId = data.best_route_id || fetchedRoutes[0]?.id || null;
        setRoutes(fetchedRoutes);
        setSelectedRouteId(bestId);
        // Save to history
        saveRouteToHistory(origin, destination, fetchedRoutes, bestId);
      } else {
        throw new Error("Invalid response received from route optimizer.");
      }
    } catch (err) {
      console.error("Route calculation error:", err);
      setError(
        err.message.includes("Failed to fetch")
          ? "Cannot connect to backend server at http://127.0.0.1:8000. Ensure FastAPI backend is running."
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination]);

  const handleSelectRoute = (routeId) => {
    setSelectedRouteId(routeId);
    setSelectedWaypoint(null);
  };

  // ── Auth handlers ──────────────────────────────────────────────────────────
  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem(LS_USER_KEY, JSON.stringify(userData));
    setShowAuth(false);
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem(LS_USER_KEY);
  };

  // ── History replay ─────────────────────────────────────────────────────────
  const handleHistoryReplay = (orig, dest) => {
    setOrigin(orig);
    setDestination(dest);
    setActiveNav("map");
  };

  // After setting origin/dest from replay, trigger fetch
  const prevOriginRef = useRef(origin);
  const prevDestRef = useRef(destination);
  useEffect(() => {
    if (
      prevOriginRef.current !== origin ||
      prevDestRef.current !== destination
    ) {
      prevOriginRef.current = origin;
      prevDestRef.current = destination;
      if (activeNav === "map" && origin && destination) handleFindRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination]);

  // ── The "map" page is the default full layout ──────────────────────────────
  const isMapPage = activeNav === "map" || activeNav === "dashboard";

  // Render page content for sidebar pages
  const renderPage = () => {
    switch (activeNav) {
      case "dashboard":
        return (
          <DashboardPage
            routes={routes}
            selectedRoute={selectedRoute}
            origin={origin}
            destination={destination}
            onNavigate={setActiveNav}
          />
        );
      case "routes":
        return (
          <RoutesPage
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={handleSelectRoute}
            origin={origin}
            destination={destination}
          />
        );
      case "forecast":
        return <ForecastPage />;
      case "history":
        return <HistoryPage onReplay={handleHistoryReplay} />;
      case "alerts":
        return <AlertsPage routes={routes} selectedRoute={selectedRoute} />;
      case "profile":
        return <ProfilePage user={user} onSignIn={() => setShowAuth(true)} onSignOut={handleSignOut} />;
      case "settings":
        return <SettingsPage isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />;
      default: // "map"
        return null;
    }
  };

  const pageContent = renderPage();

  return (
    <div className={`app-viewport ${isDark ? "dark" : ""}`}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        user={user}
        onSignOut={handleSignOut}
        onSignIn={() => setShowAuth(true)}
        alertCount={alertCount}
      />

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <TopBar
        onHamburger={() => setSidebarOpen(true)}
        user={user}
        onSignIn={() => setShowAuth(true)}
        onSignOut={handleSignOut}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
      />

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      {pageContent ? (
        /* ── Sidebar page view (scrollable) ───────────────────────────── */
        <div className="page-view">
          {pageContent}
        </div>
      ) : (
        /* ── Map view (existing layout, unchanged) ────────────────────── */
        <div className={`main-layout ${isFullscreen ? "fullscreen-map" : ""}`}>
          {/* Map Section */}
          <div className="map-section-container">
            {/* Floating Search Card — collapses when sidebar is open */}
            <div className={`search-panel-wrapper ${sidebarOpen ? "search-panel-collapsed" : ""}`}>
              <GoogleMapsSearchBar
                origin={origin}
                destination={destination}
                setOrigin={setOrigin}
                setDestination={setDestination}
                onFindRoute={handleFindRoute}
                isLoading={isLoading}
                error={error}
              />
            </div>

            {/* Map */}
            <RouteMap
              origin={origin}
              destination={destination}
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={handleSelectRoute}
              selectedWaypoint={selectedWaypoint}
              onSelectWaypoint={(idx) => setSelectedWaypoint(idx)}
            />

            {/* Fullscreen toggle */}
            <button
              className="map-fullscreen-btn"
              onClick={() => setIsFullscreen((v) => !v)}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
            >
              {isFullscreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="10" y1="14" x2="3" y2="21" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
          </div>

          {/* Bottom AQI Panel */}
          {!isFullscreen && (
            <div className="bottom-content-container">
              <SubstationAQIPanel
                routes={routes}
                selectedRouteId={selectedRouteId}
                selectedRoute={selectedRoute}
                onSelectRoute={handleSelectRoute}
                selectedWaypoint={selectedWaypoint}
                onSelectWaypoint={(idx) => setSelectedWaypoint(idx)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Auth Modal ──────────────────────────────────────────────────── */}
      {showAuth && (
        <AuthModal
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(false)}
        />
      )}

      {/* ── AQI Chatbot ─────────────────────────────────────────────────── */}
      <AQIChatbot
        origin={origin}
        destination={destination}
        routes={routes}
        selectedRoute={selectedRoute}
      />
    </div>
  );
}
