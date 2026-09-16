import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAQICategory } from "../data/delhiLocations";

// Fix Leaflet's default icon path issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function RouteMap({
  origin,
  destination,
  routeData,
  selectedWaypoint,
  onSelectWaypoint
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Centered on central Delhi by default
    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.2090],
      zoom: 12,
      zoomControl: false,
    });

    // Add Google-like Clean Map Tiles (CartoDB Positron gives that exact clean Google Maps road look)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update layers whenever origin, destination, or routeData change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Origin Marker
    if (origin?.lat && origin?.lon) {
      const originIcon = L.divIcon({
        className: "custom-map-marker",
        html: `
          <div class="origin-pin-wrapper">
            <div class="origin-pin-core"></div>
            <div class="origin-pin-pulse"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([origin.lat, origin.lon], { icon: originIcon })
        .bindPopup(`<strong>Origin:</strong> ${origin.name}`)
        .addTo(layerGroup);
    }

    // 2. Destination Marker
    if (destination?.lat && destination?.lon) {
      const destIcon = L.divIcon({
        className: "custom-map-marker",
        html: `
          <div class="dest-pin-wrapper">
            <svg width="32" height="42" viewBox="0 0 24 32" fill="none">
              <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="#EA4335"/>
              <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
            </svg>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });

      L.marker([destination.lat, destination.lon], { icon: destIcon })
        .bindPopup(`<strong>Destination:</strong> ${destination.name}`)
        .addTo(layerGroup);
    }

    // 3. Route Polyline + Waypoints + Floating Route Badge
    if (routeData && routeData.polyline && routeData.polyline.length > 0) {
      const latLngs = routeData.polyline.map((pt) => [pt[0], pt[1]]);

      // Outer white border (casing) for high contrast like Google Maps
      L.polyline(latLngs, {
        color: "#FFFFFF",
        weight: 9,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layerGroup);

      // Core Google Maps Vibrant Blue Polyline
      const mainPolyline = L.polyline(latLngs, {
        color: "#1A73E8",
        weight: 6,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layerGroup);

      // Midpoint Floating Route Badge (Matching User's Screenshot Pill)
      const midIdx = Math.floor(latLngs.length / 2);
      const midPoint = latLngs[midIdx];
      const overallCategory = getAQICategory(routeData.overall_aqi_score);

      const floatingPillIcon = L.divIcon({
        className: "floating-route-pill-container",
        html: `
          <div class="floating-route-pill">
            <div class="pill-time">${routeData.total_time_min} min</div>
            <div class="pill-dist">${routeData.total_distance_km} km</div>
            <div class="pill-aqi" style="background-color: ${overallCategory.color}; color: #fff;">
              AQI ${routeData.overall_aqi_score}
            </div>
          </div>
        `,
        iconSize: [120, 60],
        iconAnchor: [60, 30],
      });

      L.marker(midPoint, { icon: floatingPillIcon, interactive: false }).addTo(layerGroup);

      // Waypoints (Substations) Along the Route
      if (routeData.waypoints && routeData.waypoints.length > 0) {
        routeData.waypoints.forEach((wp, idx) => {
          const category = getAQICategory(wp.predicted_aqi);

          const wpIcon = L.divIcon({
            className: "waypoint-marker",
            html: `
              <div class="wp-bubble" style="background-color: ${category.color}; border: 2px solid #FFFFFF;">
                <span class="wp-number">${idx + 1}</span>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const popupContent = `
            <div class="wp-popup-content">
              <div class="wp-popup-header">
                <span class="wp-badge">Waypoint #${idx + 1}</span>
                <span class="wp-eta">+${wp.eta_min} min</span>
              </div>
              <div class="wp-aqi-row">
                <span class="wp-aqi-value" style="color: ${category.color};">${wp.predicted_aqi}</span>
                <span class="wp-aqi-tag" style="background-color: ${category.bg}; color: ${category.text};">
                  ${category.label}
                </span>
              </div>
              <div class="wp-popup-sub">
                Predicted AQI experienced at arrival ETA
              </div>
            </div>
          `;

          const marker = L.marker([wp.lat, wp.lon], { icon: wpIcon })
            .bindPopup(popupContent)
            .addTo(layerGroup);

          marker.on("click", () => {
            if (onSelectWaypoint) onSelectWaypoint(idx);
          });
        });
      }

      // Smoothly fit bounds to encompass the entire route with padding
      map.fitBounds(mainPolyline.getBounds(), {
        paddingTopLeft: [380, 50],
        paddingBottomRight: [50, 280],
      });
    } else if (origin?.lat && destination?.lat) {
      // Fit bounds between origin and destination
      const bounds = L.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon],
      ]);
      map.fitBounds(bounds, { padding: [100, 100] });
    }
  }, [origin, destination, routeData, onSelectWaypoint]);

  // Pan to selected waypoint if triggered from the bottom list
  useEffect(() => {
    if (selectedWaypoint != null && routeData?.waypoints?.[selectedWaypoint] && mapInstanceRef.current) {
      const wp = routeData.waypoints[selectedWaypoint];
      mapInstanceRef.current.flyTo([wp.lat, wp.lon], 14, { duration: 1 });
    }
  }, [selectedWaypoint, routeData]);

  return (
    <div className="map-view-wrapper">
      <div id="leaflet-map" ref={mapContainerRef} className="map-canvas" />

      {/* Floating Map Legend / Status */}
      <div className="map-floating-legend">
        <div className="legend-title">AQI Severity Bands</div>
        <div className="legend-items">
          <span className="legend-chip" style={{ backgroundColor: "#10B981", color: "#fff" }}>0-50 Good</span>
          <span className="legend-chip" style={{ backgroundColor: "#84CC16", color: "#fff" }}>51-100 Mod</span>
          <span className="legend-chip" style={{ backgroundColor: "#F59E0B", color: "#fff" }}>101-200 Poor</span>
          <span className="legend-chip" style={{ backgroundColor: "#EF4444", color: "#fff" }}>201+ Severe</span>
        </div>
      </div>
    </div>
  );
}
