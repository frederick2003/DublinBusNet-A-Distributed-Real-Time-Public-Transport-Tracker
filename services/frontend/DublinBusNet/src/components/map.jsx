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
  const routeLookup = useRef(new Map());
  const routeReverseLookup = useRef(new Map());
  const [showAuth, setShowAuth] = React.useState(true);
  const [authMode, setAuthMode] = React.useState("choice");

  const lng = -6.266155;
  const lat = 53.35014;
  const zoom = 14;
  const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY_HERE;

  const handleSearch = async (route_id, direction_id = 1) => {
    console.log(
      `Calling API: GET ${API_BASE}/buses/by-route?route_id=${route_id}&direction_id=${direction_id}`
    );

    // NEW: resolve user input (e.g. "6") → GTFS internal IDs
    const rawRouteIds = routeReverseLookup.current.get(route_id) || [];

    try {
      const res = await fetch(
        `${API_BASE}/buses/by-route?route_id=${route_id}&direction_id=${direction_id}`
      );

      console.log(`Status: ${res.status}`);

      if (!res.ok) throw new Error("Backend API offline");

      const body = await res.json();

      if (body?.success && Array.isArray(body.data)) {
        console.log(`Backend returned ${body.data.length} buses`);
        return renderOrUpdateMarkers(body.data);
      }

      throw new Error("Unexpected backend response");
    } catch (err) {
      console.warn(
        "Backend unavailable, falling back to static vehicles_test.json...",
        err.message
      );

      // --- FALLBACK: Filter static feed using mapped GTFS IDs ---
      try {
        const staticRes = await fetch("/data/vehicles_test.json");
        const staticJson = await staticRes.json();

        if (!staticJson.entity) {
          console.error("Static GTFS feed missing entity[]");
          return;
        }

        const filtered = staticJson.entity
          .map((ent) => {
            if (!ent.vehicle || !ent.vehicle.position) return null;

            return {
              vehicle_id: ent.vehicle.vehicle?.id || ent.id,
              route_id: ent.vehicle.trip?.routeId || "N/A",
              direction_id: ent.vehicle.trip?.directionId ?? 0,
              latitude: ent.vehicle.position.latitude,
              longitude: ent.vehicle.position.longitude,
              delay_seconds: 0,
            };
          })
          .filter(
            (bus) =>
              bus &&
              rawRouteIds.includes(bus.route_id) && // <-- NEW FIX
              Number(bus.direction_id) === Number(direction_id)
          );

        console.log(
          `Fallback static dataset returned ${filtered.length} buses for route ${route_id} (dir=${direction_id})`
        );

        return renderOrUpdateMarkers(filtered);
      } catch (fallbackErr) {
        console.error("Fallback static file load failed:", fallbackErr);
      }
    }
  };

  async function loadRoutes() {
    try {
      const res = await fetch("/data/routes.txt");
      const text = await res.text();

      const rows = text.trim().split("\n");
      const headers = rows[0].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

      rows.slice(1).forEach((row) => {
        const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        if (!values) return;

        const obj = {};
        headers.forEach((h, i) => (obj[h] = values[i]?.replace(/"/g, "")));

        const short =
          obj.route_short_name?.trim() ||
          obj.route_long_name?.trim() ||
          obj.route_id;

        const raw = obj.route_id;

        // Forward mapping (raw → user-friendly)
        routeLookup.current.set(raw, short);

        // Reverse mapping (user → raw)
        if (!routeReverseLookup.current.has(short)) {
          routeReverseLookup.current.set(short, []);
        }
        routeReverseLookup.current.get(short).push(raw);
      });

      console.log("Forward mappings:", routeLookup.current);
      console.log("Reverse mappings:", routeReverseLookup.current);
    } catch (err) {
      console.error("Failed to load routes.txt:", err);
    }
  }

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

      loadRoutes();
      loadStops();
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

  async function fetchAndRenderBuses() {
    console.log("Calling API: GET /buses/active ...");

    try {
      const res = await fetch(`${API_BASE}/buses/active`);
      console.log(`API call completed with status: ${res.status}`);

      if (!res.ok) throw new Error("Backend not ready");

      const body = await res.json();
      if (body?.success && Array.isArray(body.data)) {
        console.log("Loaded buses from backend:", body.data.length);
        return renderOrUpdateMarkers(body.data);
      }

      throw new Error("Unexpected backend response");
    } catch (err) {
      console.warn(
        "Backend unavailable, falling back to static /data/vehicles_test.json",
        err.message
      );

      // --- FALLBACK ---
      try {
        const fallbackRes = await fetch("/data/vehicles_test.json");
        const fallbackJson = await fallbackRes.json();

        // Transform GTFS-RT into your bus object format
        const fallbackBuses = [];

        if (fallbackJson.entity) {
          fallbackJson.entity.forEach((ent) => {
            if (!ent.vehicle || !ent.vehicle.position) return;

            fallbackBuses.push({
              vehicle_id: ent.vehicle.vehicle?.id || ent.id,
              route_id: ent.vehicle.trip?.routeId || "N/A",
              direction_id: ent.vehicle.trip?.directionId ?? 0,
              latitude: ent.vehicle.position.latitude,
              longitude: ent.vehicle.position.longitude,
              delay_seconds: 0,
            });
          });
        }

        console.log("Fallback bus count:", fallbackBuses.length);
        return renderOrUpdateMarkers(fallbackBuses);
      } catch (fallbackErr) {
        console.error("Fallback failed:", fallbackErr);
      }
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
              6,
              100,
              6,
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
      const friendlyRoute = routeLookup.current.get(route_id) || route_id;

      const popupHtml = `
        <div style="font-size:12px;line-height:1.2">
          <strong>Route:</strong> ${friendlyRoute}<br/>
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
