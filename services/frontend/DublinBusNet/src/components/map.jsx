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
  const [showAuth, setShowAuth] = React.useState(true);
  const [authMode, setAuthMode] = React.useState("choice");

  const lng = -6.266155;
  const lat = 53.35014;
  const zoom = 14;
  const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY_HERE;

  const handleSearch = async (route) => {
    console.log(
      `Calling API: GET ${API_BASE}/buses/by-route?route=${route} ...`
    );

    try {
      const res = await fetch(`${API_BASE}/buses/by-route?route=${route}`);
      console.log(`API call completed with status: ${res.status}`);

      if (!res.ok) {
        console.error(
          "Failed to fetch buses by route:",
          res.status,
          await res.text()
        );
        return;
      }

      const body = await res.json();
      console.log("Successfully fetched buses by route:", body);

      if (body?.success && Array.isArray(body.data)) {
        renderOrUpdateMarkers(body.data);
      } else {
        console.warn("Unexpected API response shape:", body);
      }
    } catch (err) {
      console.error("Error calling /buses/by-route:", err);
    }
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

      loadStops();
      loadVehiclePositions();
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

  async function loadVehiclePositions() {
    try {
      const res = await fetch("/data/vehicles_test.json");
      const feed = await res.json();

      if (!feed.entity || !Array.isArray(feed.entity)) {
        console.error("GTFS-RT feed missing entity[]:", feed);
        return;
      }

      const buses = [];

      for (const entity of feed.entity) {
        if (!entity.vehicle || !entity.vehicle.position) continue;

        buses.push({
          vehicle_id: entity.vehicle.vehicle?.id || entity.id,
          route_id: entity.vehicle.trip?.routeId || "N/A",
          latitude: entity.vehicle.position.latitude,
          longitude: entity.vehicle.position.longitude,
          delay_seconds: 0,
        });
      }

      console.log("Parsed vehicle positions:", buses);

      renderOrUpdateMarkers(buses);
    } catch (err) {
      console.error("Error loading vehicle positions:", err);
    }
  }

  async function loadStops() {
    try {
      const response = await fetch("/data/stops.txt");
      const text = await response.text();

      const rows = text.trim().split("\n");
      const headers = rows[0].split(",");

      const features = rows
        .slice(1)
        .map((row) => {
          const values = row.split(",");
          const obj = {};
          headers.forEach((h, i) => (obj[h] = values[i]));

          const lat = parseFloat(obj.stop_lat);
          const lon = parseFloat(obj.stop_lon);

          if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lon, lat],
            },
            properties: {
              stop_id: obj.stop_id,
              stop_name: obj.stop_name,
            },
          };
        })
        .filter(Boolean);

      const geojson = {
        type: "FeatureCollection",
        features,
      };

      // --- Add source ---
      if (map.current.getSource("bus-stops")) {
        map.current.getSource("bus-stops").setData(geojson);
      } else {
        map.current.addSource("bus-stops", {
          type: "geojson",
          data: geojson,
        });

        // --- Add fast GPU circle layer ---
        map.current.addLayer({
          id: "bus-stops-layer",
          type: "circle",
          source: "bus-stops",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              4,
              100,
              4,
            ],
            "circle-color": "#007AFF",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Popup on click
        map.current.on("click", "bus-stops-layer", (e) => {
          const p = e.features[0].properties;
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<strong>${p.stop_name}</strong><br>ID: ${p.stop_id}`)
            .addTo(map.current);
        });

        // Change cursor on hover
        map.current.on("mouseenter", "bus-stops-layer", () => {
          map.current.getCanvas().style.cursor = "pointer";
        });

        map.current.on("mouseleave", "bus-stops-layer", () => {
          map.current.getCanvas().style.cursor = "";
        });
      }
    } catch (error) {
      console.error("Failed to load stops.txt:", error);
    }
  }

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
        const el = document.createElement("div");
        el.className = "bus-marker";
        el.innerHTML = "🚌";
        const marker = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
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
      {showAuth && (
        <SignInPanel
          mode={authMode}
          setMode={setAuthMode}
          close={() => setShowAuth(false)}
        />
      )}
      <div ref={mapContainer} className="map" />
    </div>
  );
}
