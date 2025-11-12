import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Import components.
import SearchBar from "./searchbar";
import SignInPanel from "./signin";

export default function BusMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef(new Map());
  const pollTimer = useRef(null); // optional: for auto-refresh

  const lng = -6.266155;
  const lat = 53.35014;
  const zoom = 14;
  const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY_HERE;

  const handleSearch = (query) => {
    console.log("User searched for:", query);
  };

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`,
      center: [lng, lat],
      zoom: zoom,
      pitch: 60,
      bearing: -17,
      antialias: true,
    });

    // Add controls when map is ready
    map.current.on("load", () => {
      map.current.addControl(new maplibregl.NavigationControl(), "top-right");

      // Call the API once map is loaded
      fetchAndRenderBuses();
    });

    return () => {
      // Cleanup on unmount
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
    };
  }, []);

  // fetch bus data and render markers
  async function fetchAndRenderBuses() {
    console.log("Calling API: GET /api/buses ...");
    try {
      const res = await fetch(`${API_BASE}/buses`);
      console.log(`API call completed with status: ${res.status}`);
      if (!res.ok) {
        console.error("Failed to fetch /buses:", res.status);
        return;
      }

      const body = await res.json();
      if (!body?.success || !Array.isArray(body?.data)) {
        console.error("Unexpected /buses response shape:", body);
        return;
      }

      const buses = body.data;
      console.log(`API call successful. Received ${body.data.length} buses.`);
      renderOrUpdateMarkers(buses);
    } catch (err) {
      console.error("Error fetching /buses:", err);
    } finally {
      console.log("Finished attempting to call /api/buses.");
    }
  }

  // add or update markers
  function renderOrUpdateMarkers(buses) {
    if (!map.current) return;

    const stillPresent = new Set();

    buses.forEach((bus) => {
      const { vehicle_id, route_id, latitude, longitude, delay_seconds } = bus;
      if (typeof latitude !== "number" || typeof longitude !== "number") return;

      stillPresent.add(vehicle_id);

      const popupHtml = `
        <div style="font-size:12px;line-height:1.2">
          <strong>Route:</strong> ${route_id}<br/>
          <strong>Vehicle:</strong> ${vehicle_id}<br/>
          <strong>Delay:</strong> ${delay_seconds ?? 0}s
        </div>
      `;

      const existing = markersRef.current.get(vehicle_id);
      if (existing) {
        existing.setLngLat([longitude, latitude]);
        if (existing.getPopup()) existing.getPopup().setHTML(popupHtml);
      } else {
        const marker = new maplibregl.Marker({ color: "#1565c0" })
          .setLngLat([longitude, latitude])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(popupHtml))
          .addTo(map.current);
        markersRef.current.set(vehicle_id, marker);
      }
    });

    // Remove markers that no longer exist
    markersRef.current.forEach((marker, vid) => {
      if (!stillPresent.has(vid)) {
        marker.remove();
        markersRef.current.delete(vid);
      }
    });
  }

  return (
    <div className="map-wrap">
      <SearchBar onSearch={handleSearch} />
      <SignInPanel />
      <div ref={mapContainer} className="map" />
    </div>
  );
}
