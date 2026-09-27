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
  routes = [],
  routeData,
  selectedRouteId,
  onSelectRoute,
  selectedWaypoint,
  onSelectWaypoint
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  // Normalize route input (support both new routes array and legacy routeData)
  const routeList = (routes && routes.length > 0) ? routes : (routeData ? [routeData] : []);
  const activeRoute = routeList.find((r) => r.id === selectedRouteId) || routeList[0] || null;

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Centered on central Delhi by default
    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.2090],
      zoom: 12,
      zoomControl: false,
    });

    // OpenStreetMap tiles — free, no API key required
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: "abc",
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

  // Update layers whenever origin, destination, routeList, or activeRoute change
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

    // 3. Render Routes
    if (routeList.length > 0) {
      const boundsCollection = [];

      // A. First render ALTERNATIVE (unselected) routes in lighter, muted paths
      const unselectedRoutes = routeList.filter(
        (r) => activeRoute && r.id !== activeRoute.id
      );

      unselectedRoutes.forEach((r) => {
        if (!r.polyline || r.polyline.length === 0) return;
        const latLngs = r.polyline.map((pt) => [pt[0], pt[1]]);
        boundsCollection.push(...latLngs);

        // Lighter casing
        L.polyline(latLngs, {
          color: "#FFFFFF",
          weight: 6,
          opacity: 0.7,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(layerGroup);

        // Lighter path line
        const altPolyline = L.polyline(latLngs, {
          color: "#64748B", // Muted slate gray/blue
          weight: 4.5,
          opacity: 0.75,
          lineCap: "round",
          lineJoin: "round",
          className: "interactive-alt-polyline",
        }).addTo(layerGroup);

        // Hover & Click interactions for alternative routes
        altPolyline.on("mouseover", () => {
          altPolyline.setStyle({ color: "#334155", weight: 6, opacity: 1.0 });
        });
        altPolyline.on("mouseout", () => {
          altPolyline.setStyle({ color: "#64748B", weight: 4.5, opacity: 0.75 });
        });
        altPolyline.on("click", () => {
          if (onSelectRoute) onSelectRoute(r.id);
        });

        // Floating Midpoint Pill for Alternative Route
        const midIdx = Math.floor(latLngs.length / 2);
        const midPoint = latLngs[midIdx];
        const category = getAQICategory(r.overall_aqi_score);

        const altPillIcon = L.divIcon({
          className: "floating-route-pill-container",
          html: `
            <div class="floating-route-pill alt-route-pill" title="Click to choose ${r.name}">
              <div class="pill-badge-tag">${r.badge || "Route"}</div>
              <div class="pill-metrics-row">
                <span class="pill-time">${r.total_time_min}m</span>
                <span class="pill-sep">•</span>
                <span class="pill-dist">${r.total_distance_km}km</span>
              </div>
              <div class="pill-aqi-chip" style="background-color: ${category.bg}; color: ${category.text}; border: 1px solid ${category.color};">
                AQI ${r.overall_aqi_score}
              </div>
              <div class="pill-action-hint">Click to select</div>
            </div>
          `,
          iconSize: [110, 68],
          iconAnchor: [55, 34],
        });

        const pillMarker = L.marker(midPoint, { icon: altPillIcon }).addTo(layerGroup);
        pillMarker.on("click", () => {
          if (onSelectRoute) onSelectRoute(r.id);
        });
      });

      // B. Render the SELECTED / BEST route with the prominent DARKER PATH
      if (activeRoute && activeRoute.polyline && activeRoute.polyline.length > 0) {
        const activeLatLngs = activeRoute.polyline.map((pt) => [pt[0], pt[1]]);
        boundsCollection.push(...activeLatLngs);

        // High-contrast white outer casing
        L.polyline(activeLatLngs, {
          color: "#FFFFFF",
          weight: 10,
          opacity: 0.98,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(layerGroup);

        // Bold Darker Path: Deep Dark Royal Blue (#0D47A1)
        const selectedPolyline = L.polyline(activeLatLngs, {
          color: "#0D47A1", // Darker path as requested
          weight: 7,
          opacity: 1.0,
          lineCap: "round",
          lineJoin: "round",
          className: "selected-dark-polyline",
        }).addTo(layerGroup);

        selectedPolyline.bringToFront();

        // Midpoint Floating Route Badge for Selected Route
        const midIdx = Math.floor(activeLatLngs.length / 2);
        const midPoint = activeLatLngs[midIdx];
        const overallCategory = getAQICategory(activeRoute.overall_aqi_score);

        const selectedPillIcon = L.divIcon({
          className: "floating-route-pill-container",
          html: `
            <div class="floating-route-pill selected-route-pill">
              <div class="pill-header-row">
                <span class="pill-badge-tag active ${activeRoute.is_best ? 'best' : ''}">
                  ${activeRoute.is_best ? "★ " : ""}${activeRoute.badge || "Selected"}
                </span>
                ${activeRoute.is_best ? '<span class="pill-best-flag">Best Choice</span>' : ''}
              </div>
              <div class="pill-time active">${activeRoute.total_time_min} <span class="pill-unit">min</span></div>
              <div class="pill-dist">${activeRoute.total_distance_km} km ${activeRoute.traffic_delay_min > 0 ? `(+${activeRoute.traffic_delay_min}m traffic)` : ''}</div>
              <div class="pill-aqi active" style="background-color: ${overallCategory.color}; color: #fff;">
                Route Exposure AQI: ${activeRoute.overall_aqi_score}
              </div>
            </div>
          `,
          iconSize: [140, 80],
          iconAnchor: [70, 40],
        });

        L.marker(midPoint, { icon: selectedPillIcon, interactive: false }).addTo(layerGroup);

        // Waypoints along the Selected Route
        if (activeRoute.waypoints && activeRoute.waypoints.length > 0) {
          activeRoute.waypoints.forEach((wp, idx) => {
            const category = getAQICategory(wp.predicted_aqi);

            const wpIcon = L.divIcon({
              className: "waypoint-marker",
              html: `
                <div class="wp-bubble" style="background-color: ${category.color}; border: 2.5px solid #FFFFFF;">
                  <span class="wp-number">${idx + 1}</span>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            const popupContent = `
              <div class="wp-popup-content">
                <div class="wp-popup-header">
                  <span class="wp-badge">Waypoint #${idx + 1} (${activeRoute.name})</span>
                  <span class="wp-eta">+${wp.eta_min} min</span>
                </div>
                <div class="wp-aqi-row">
                  <span class="wp-aqi-value" style="color: ${category.color};">${wp.predicted_aqi}</span>
                  <span class="wp-aqi-tag" style="background-color: ${category.bg}; color: ${category.text};">
                    ${category.label}
                  </span>
                </div>
                <div class="wp-popup-sub">
                  Predicted AQI experienced at arrival ETA along this route
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
      }

      // Smoothly fit bounds to encompass ALL available routes
      if (boundsCollection.length > 0) {
        const fullBounds = L.latLngBounds(boundsCollection);
        map.fitBounds(fullBounds, {
          paddingTopLeft: [410, 50],
          paddingBottomRight: [50, 280],
        });
      }
    } else if (origin?.lat && destination?.lat) {
      // Fit bounds between origin and destination
      const bounds = L.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon],
      ]);
      map.fitBounds(bounds, { padding: [100, 100] });
    }
  }, [origin, destination, routes, routeData, selectedRouteId, onSelectRoute, onSelectWaypoint]);

  // Pan to selected waypoint if triggered from the bottom list
  useEffect(() => {
    if (selectedWaypoint != null && activeRoute?.waypoints?.[selectedWaypoint] && mapInstanceRef.current) {
      const wp = activeRoute.waypoints[selectedWaypoint];
      mapInstanceRef.current.flyTo([wp.lat, wp.lon], 14, { duration: 1 });
    }
  }, [selectedWaypoint, activeRoute]);

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
