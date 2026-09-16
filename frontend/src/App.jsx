import React, { useState, useEffect } from "react";
import GoogleMapsSearchBar from "./components/GoogleMapsSearchBar";
import RouteMap from "./components/RouteMap";
import SubstationAQIPanel from "./components/SubstationAQIPanel";
import { DELHI_LOCATIONS } from "./data/delhiLocations";
import "./App.css";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function App() {
  // Preset default: R.K. Puram to Red Fort for immediate demonstration
  const [origin, setOrigin] = useState(
    DELHI_LOCATIONS.find((l) => l.name.includes("R.K. Puram")) || DELHI_LOCATIONS[0]
  );
  const [destination, setDestination] = useState(
    DELHI_LOCATIONS.find((l) => l.name.includes("Red Fort")) || DELHI_LOCATIONS[1]
  );

  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);

  // Automatically fetch route on initial load so the user immediately sees the map & route
  useEffect(() => {
    if (origin && destination) {
      handleFindRoute();
    }
  }, []);

  const handleFindRoute = async () => {
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
        headers: {
          "Content-Type": "application/json",
        },
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
      if (data.status === "success" && data.route) {
        setRouteData(data.route);
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
  };

  return (
    <div className="app-viewport">
      {/* Top Map Section with Floating Google Maps Search Bar */}
      <div className="map-section-container">
        <GoogleMapsSearchBar
          origin={origin}
          destination={destination}
          setOrigin={setOrigin}
          setDestination={setDestination}
          onFindRoute={handleFindRoute}
          isLoading={isLoading}
          error={error}
        />

        <RouteMap
          origin={origin}
          destination={destination}
          routeData={routeData}
          selectedWaypoint={selectedWaypoint}
          onSelectWaypoint={(idx) => setSelectedWaypoint(idx)}
        />
      </div>

      {/* Bottom Section: Substation & Waypoints AQI Breakdown */}
      <div className="bottom-content-container">
        <SubstationAQIPanel
          routeData={routeData}
          selectedWaypoint={selectedWaypoint}
          onSelectWaypoint={(idx) => setSelectedWaypoint(idx)}
        />
      </div>
    </div>
  );
}
