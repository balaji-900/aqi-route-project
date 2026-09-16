import React, { useState, useRef, useEffect } from "react";
import { Circle, MapPin, ArrowUpDown, Search, Navigation, X, Loader2 } from "lucide-react";
import { DELHI_LOCATIONS } from "../data/delhiLocations";

export default function GoogleMapsSearchBar({
  origin,
  destination,
  setOrigin,
  setDestination,
  onFindRoute,
  isLoading,
  error
}) {
  const [originQuery, setOriginQuery] = useState(origin?.name || "");
  const [destQuery, setDestQuery] = useState(destination?.name || "");
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'origin' | 'dest' | null

  const originRef = useRef(null);
  const destRef = useRef(null);

  useEffect(() => {
    if (origin) setOriginQuery(origin.name);
  }, [origin]);

  useEffect(() => {
    if (destination) setDestQuery(destination.name);
  }, [destination]);

  // Handle clicking outside dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (originRef.current && !originRef.current.contains(e.target) &&
          destRef.current && !destRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOriginChange = (e) => {
    const q = e.target.value;
    setOriginQuery(q);
    if (!q.trim()) {
      setOriginSuggestions(DELHI_LOCATIONS.slice(0, 8));
    } else {
      const filtered = DELHI_LOCATIONS.filter(l =>
        l.name.toLowerCase().includes(q.toLowerCase()) ||
        l.category.toLowerCase().includes(q.toLowerCase())
      );
      setOriginSuggestions(filtered);
    }
    setActiveDropdown("origin");
  };

  const handleDestChange = (e) => {
    const q = e.target.value;
    setDestQuery(q);
    if (!q.trim()) {
      setDestSuggestions(DELHI_LOCATIONS.slice(0, 8));
    } else {
      const filtered = DELHI_LOCATIONS.filter(l =>
        l.name.toLowerCase().includes(q.toLowerCase()) ||
        l.category.toLowerCase().includes(q.toLowerCase())
      );
      setDestSuggestions(filtered);
    }
    setActiveDropdown("dest");
  };

  const selectOrigin = (loc) => {
    setOrigin(loc);
    setOriginQuery(loc.name);
    setActiveDropdown(null);
  };

  const selectDest = (loc) => {
    setDestination(loc);
    setDestQuery(loc.name);
    setActiveDropdown(null);
  };

  const handleSwap = () => {
    const tempOrig = origin;
    const tempDest = destination;
    setOrigin(tempDest);
    setDestination(tempOrig);
    setOriginQuery(tempDest?.name || "");
    setDestQuery(tempOrig?.name || "");
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLoc = {
            name: "Current Location (GPS)",
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            category: "Current GPS"
          };
          selectOrigin(userLoc);
        },
        (err) => {
          alert("Could not access current location. Please ensure location permissions are granted.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const quickPresets = [
    { label: "R.K. Puram → Red Fort", from: "R.K. Puram (Station DL001)", to: "Red Fort (Lal Qila)" },
    { label: "CP → Anand Vihar", from: "Connaught Place (CP)", to: "Anand Vihar (Station DL002)" },
    { label: "India Gate → Dwarka", from: "India Gate", to: "Dwarka Sector 8 (Station DL006)" },
    { label: "Airport T3 → ITO", from: "IGI Airport Terminal 3", to: "ITO (Station DL005)" }
  ];

  const applyPreset = (p) => {
    const origLoc = DELHI_LOCATIONS.find(l => l.name === p.from);
    const destLoc = DELHI_LOCATIONS.find(l => l.name === p.to);
    if (origLoc && destLoc) {
      selectOrigin(origLoc);
      selectDest(destLoc);
    }
  };

  return (
    <div className="google-search-panel">
      <div className="search-box-card">
        {/* Header Branding */}
        <div className="card-brand-row">
          <div className="brand-badge">
            <span className="brand-dot" />
            <span className="brand-title">Delhi CleanRoute AQI Navigator</span>
          </div>
          <span className="brand-subtitle">Google Maps Experience</span>
        </div>

        {/* Inputs container */}
        <div className="inputs-wrapper">
          {/* Left indicators & connector line */}
          <div className="icons-track">
            <div className="origin-icon-wrap" title="Origin">
              <Circle className="icon-circle" size={14} />
            </div>
            <div className="vertical-dotted-line" />
            <div className="dest-icon-wrap" title="Destination">
              <MapPin className="icon-pin" size={16} />
            </div>
          </div>

          {/* Form inputs */}
          <div className="inputs-column">
            {/* Origin Input */}
            <div className="input-group" ref={originRef}>
              <input
                type="text"
                placeholder="Choose starting point in Delhi..."
                value={originQuery}
                onChange={handleOriginChange}
                onFocus={() => {
                  setOriginSuggestions(DELHI_LOCATIONS.slice(0, 8));
                  setActiveDropdown("origin");
                }}
                className="map-input"
              />
              {originQuery && (
                <button
                  className="clear-btn"
                  onClick={() => {
                    setOrigin(null);
                    setOriginQuery("");
                  }}
                  title="Clear"
                >
                  <X size={14} />
                </button>
              )}

              {/* Origin Dropdown */}
              {activeDropdown === "origin" && (
                <div className="suggestions-dropdown">
                  <div
                    className="suggestion-item current-loc-option"
                    onClick={handleUseCurrentLocation}
                  >
                    <Navigation size={15} className="current-loc-icon" />
                    <div>
                      <div className="suggestion-name">Use Current Location</div>
                      <div className="suggestion-sub">Device GPS in Delhi</div>
                    </div>
                  </div>
                  {originSuggestions.map((loc, idx) => (
                    <div
                      key={idx}
                      className="suggestion-item"
                      onClick={() => selectOrigin(loc)}
                    >
                      <MapPin size={15} className="suggestion-icon" />
                      <div>
                        <div className="suggestion-name">{loc.name}</div>
                        <div className="suggestion-sub">{loc.category} • Lat: {loc.lat.toFixed(4)}, Lon: {loc.lon.toFixed(4)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Input */}
            <div className="input-group" ref={destRef}>
              <input
                type="text"
                placeholder="Choose destination in Delhi..."
                value={destQuery}
                onChange={handleDestChange}
                onFocus={() => {
                  setDestSuggestions(DELHI_LOCATIONS.slice(0, 8));
                  setActiveDropdown("dest");
                }}
                className="map-input"
              />
              {destQuery && (
                <button
                  className="clear-btn"
                  onClick={() => {
                    setDestination(null);
                    setDestQuery("");
                  }}
                  title="Clear"
                >
                  <X size={14} />
                </button>
              )}

              {/* Destination Dropdown */}
              {activeDropdown === "dest" && (
                <div className="suggestions-dropdown">
                  {destSuggestions.map((loc, idx) => (
                    <div
                      key={idx}
                      className="suggestion-item"
                      onClick={() => selectDest(loc)}
                    >
                      <MapPin size={15} className="suggestion-icon dest-icon-color" />
                      <div>
                        <div className="suggestion-name">{loc.name}</div>
                        <div className="suggestion-sub">{loc.category} • Lat: {loc.lat.toFixed(4)}, Lon: {loc.lon.toFixed(4)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Swap button */}
          <button className="swap-btn" onClick={handleSwap} title="Swap origin and destination">
            <ArrowUpDown size={18} />
          </button>
        </div>

        {/* Action button */}
        <button
          className={`find-route-btn ${isLoading ? "loading" : ""}`}
          onClick={onFindRoute}
          disabled={!origin || !destination || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="spinner" />
              <span>Optimizing Route & AQI Exposure...</span>
            </>
          ) : (
            <>
              <Search size={18} />
              <span>Find Best Route</span>
            </>
          )}
        </button>

        {/* Error message if any */}
        {error && <div className="error-banner">{error}</div>}

        {/* Quick Presets */}
        <div className="presets-row">
          <span className="presets-label">Popular routes:</span>
          <div className="preset-chips">
            {quickPresets.map((p, idx) => (
              <button
                key={idx}
                className="preset-chip"
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
