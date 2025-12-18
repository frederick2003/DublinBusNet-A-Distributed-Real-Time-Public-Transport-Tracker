import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Import components.
import SearchBar from "./searchbar";
import SignInPanel from "./signin";
import Navbar from "./navbar";

export default function BusMap({ auth }) {
  const { user, token, loading, signIn, signUp, signOut, setFavouriteRoute } =
    auth;
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef(new Map());
  const pollTimer = useRef(null); // optional: for auto-refresh
  const routeLookup = useRef(new Map());
  const routeReverseLookup = useRef(new Map());
  const [showAuth, setShowAuth] = React.useState(false);
  const [authMode, setAuthMode] = React.useState("choice");
  React.useEffect(() => {
    if (user) {
      setShowAuth(false); // logged in → hide
    } else {
      setShowAuth(true); // guest → show
    }
  }, [user]);

  const routeLayerId = "route-shape-line";
  const routeSourceId = "route-shape-source";
  const routeStopsLayerId = "route-stops-layer";
  const routeStopsSourceId = "route-stops-source";
  const [selectedRoute, setSelectedRoute] = React.useState(null);
  const FADE_NON_SELECTED_STOPS = true; // set to false to hide non-selected stops entirely

  const lng = -6.266155;
  const lat = 53.35014;
  const zoom = 14;
  // Accept either VITE_MAPTILER_API_KEY or legacy VITE_MAPTILER_API_KEY_HERE
  const API_KEY =
    import.meta.env.VITE_MAPTILER_API_KEY ||
    import.meta.env.VITE_MAPTILER_API_KEY_HERE;

  const handleSearch = async (route_id, direction_id = 1) => {
    const normalizedRoute = (route_id || "").toUpperCase();
    setSelectedRoute({ route_id: normalizedRoute, direction_id });

    console.log(
      `Calling API: GET ${API_BASE}/buses/by-route?route_id=${normalizedRoute}&direction_id=${direction_id}`
    );

    const rawRouteIds = routeReverseLookup.current.get(normalizedRoute) || [];

    try {
      const res = await fetch(
        `${API_BASE}/buses/by-route?route_id=${normalizedRoute}&direction_id=${direction_id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      console.log(`Status: ${res.status}`);

      if (!res.ok) throw new Error("Backend API offline");

      const body = await res.json();

      if (body?.success && Array.isArray(body.data)) {
        console.log(`Backend returned ${body.data.length} buses`);
        renderOrUpdateMarkers(body.data);
        fetchAndRenderRoute(normalizedRoute, direction_id);
        if (auth?.refreshUser) {
          auth.refreshUser();
        }
        return;
      }

      throw new Error("Unexpected backend response");
    } catch (err) {
      console.warn(
        "Backend unavailable, falling back to static vehicles_test.json...",
        err.message
      );

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
              rawRouteIds.includes(bus.route_id) &&
              Number(bus.direction_id) === Number(direction_id)
          );

        console.log(
          `Fallback static dataset returned ${filtered.length} buses for route ${normalizedRoute} (dir=${direction_id})`
        );

        return renderOrUpdateMarkers(filtered);
      } catch (fallbackErr) {
        console.error("Fallback static file load failed:", fallbackErr);
      }
    }
  };

  async function fetchAndRenderRoute(route_id, direction_id = 1) {
    if (!map.current) return;
    try {
      const res = await fetch(
        `${API_BASE}/routes/shape?route_id=${route_id}&direction_id=${direction_id}`
      );
      if (!res.ok) throw new Error(`Route shape fetch failed: ${res.status}`);
      const body = await res.json();
      const shape = body?.data?.shape;
      const color = body?.data?.color;
      if (!shape) throw new Error("Missing shape in response");
      renderRouteLine(shape, color);
      await fetchAndRenderRouteStops(route_id, direction_id, color);
    } catch (err) {
      console.warn(
        "Failed to load route shape; will skip drawing polyline",
        err.message
      );
      // Optional fallback: clear any existing route line
      removeRouteLine();
      removeRouteStops();
    }
  }

  async function fetchAndRenderRouteStops(route_id, direction_id = 1, color) {
    if (!map.current) return;
    try {
      const res = await fetch(
        `${API_BASE}/routes/stops?route_id=${route_id}&direction_id=${direction_id}`
      );
      if (!res.ok) throw new Error(`Route stops fetch failed: ${res.status}`);
      const body = await res.json();
      const stops = body?.data?.stops;
      if (!stops) throw new Error("Missing stops in response");
      renderRouteStops(stops, color);
    } catch (err) {
      console.warn("Failed to load route stops", err.message);
      removeRouteStops();
    }
  }

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

    // If no API key is provided, fall back to a public demo style so the map still renders.
    const styleUrl = API_KEY
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`
      : "https://demotiles.maplibre.org/style.json";

    if (!API_KEY) {
      console.warn(
        "No MapTiler API key found; using demo tiles (may be rate-limited)."
      );
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
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
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
  if (!map.current) return;

  // Clear any existing polling
  if (pollTimer.current) {
    clearInterval(pollTimer.current);
    pollTimer.current = null;
  }

  // Decide what to poll based on state
  const poll = () => {
    if (selectedRoute) {
      const { route_id, direction_id } = selectedRoute;
      fetchAndRenderRouteBuses(route_id, direction_id);
    } else {
      fetchAndRenderBuses();
    }
  };

  // Initial fetch
  poll();

  // Poll every 30 seconds
  pollTimer.current = setInterval(poll, 30_000);

  return () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };
}, [selectedRoute]);


  async function fetchAndRenderRouteBuses(route_id, direction_id) {
  console.log(
    `Polling route: GET /buses/by-route?route_id=${route_id}&direction_id=${direction_id}`
  );

  try {
    const res = await fetch(
      `${API_BASE}/buses/by-route?route_id=${route_id}&direction_id=${direction_id}`
    );

    if (!res.ok) throw new Error("Route polling failed");

    const body = await res.json();
    if (body?.success && Array.isArray(body.data)) {
      return renderOrUpdateMarkers(body.data);
    }
  } catch (err) {
    console.warn("Route polling failed:", err.message);
  }
}

  async function fetchAndRenderBuses() {
    if (selectedRoute) {
      console.log("Blocked global fetch — route mode active");
      return;
    }

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

  function renderRouteLine(shapeGeoJson, color) {
    if (!map.current) return;
    // Remove existing
    removeRouteLine();

    map.current.addSource(routeSourceId, {
      type: "geojson",
      data: shapeGeoJson,
    });

    map.current.addLayer({
      id: routeLayerId,
      type: "line",
      source: routeSourceId,
      paint: {
        "line-color": color || "#ff3b30",
        "line-width": 5,
        "line-opacity": 0.8,
      },
    });
  }

  function removeRouteLine() {
    if (!map.current) return;
    if (map.current.getLayer(routeLayerId)) {
      map.current.removeLayer(routeLayerId);
    }
    if (map.current.getSource(routeSourceId)) {
      map.current.removeSource(routeSourceId);
    }
  }

  function renderRouteStops(stopsGeoJson, color) {
    if (!map.current) return;
    removeRouteStops();

    map.current.addSource(routeStopsSourceId, {
      type: "geojson",
      data: stopsGeoJson,
    });

    map.current.addLayer({
      id: routeStopsLayerId,
      type: "circle",
      source: routeStopsSourceId,
      paint: {
        "circle-radius": 4,
        "circle-color": color || "#ff3b30",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
      },
    });

    updateStopVisibility(true, color);
  }

  function removeRouteStops() {
    if (!map.current) return;
    if (map.current.getLayer(routeStopsLayerId)) {
      map.current.removeLayer(routeStopsLayerId);
    }
    if (map.current.getSource(routeStopsSourceId)) {
      map.current.removeSource(routeStopsSourceId);
    }
    updateStopVisibility(false);
  }

  function updateStopVisibility(onlySelectedRoute, color) {
    if (!map.current) return;
    const baseLayer = map.current.getLayer("bus-stops-layer");
    if (baseLayer) {
      if (onlySelectedRoute) {
        if (FADE_NON_SELECTED_STOPS) {
          map.current.setLayoutProperty(
            "bus-stops-layer",
            "visibility",
            "visible"
          );
          map.current.setPaintProperty(
            "bus-stops-layer",
            "circle-opacity",
            0.12
          );
          map.current.setPaintProperty(
            "bus-stops-layer",
            "circle-color",
            "#9bbce9"
          );
        } else {
          map.current.setLayoutProperty(
            "bus-stops-layer",
            "visibility",
            "none"
          );
        }
      } else {
        map.current.setLayoutProperty(
          "bus-stops-layer",
          "visibility",
          "visible"
        );
        map.current.setPaintProperty("bus-stops-layer", "circle-opacity", 1);
        map.current.setPaintProperty(
          "bus-stops-layer",
          "circle-color",
          "#007AFF"
        );
      }
    }

    const selectedLayer = map.current.getLayer(routeStopsLayerId);
    if (selectedLayer) {
      map.current.setLayoutProperty(
        routeStopsLayerId,
        "visibility",
        onlySelectedRoute ? "visible" : "none"
      );
    }
  }

  return (
    <div className="page-shell">
      <Navbar />
      <main id="home">
        <div className="map-wrap">
          <SearchBar
            onSearch={handleSearch}
            user={user}
            setFavouriteRoute={setFavouriteRoute}
          />
          {showAuth && (
            <SignInPanel
              mode={authMode}
              setMode={setAuthMode}
              close={() => setShowAuth(false)}
              onSignIn={signIn}
              onSignUp={signUp}
            />
          )}
          <div ref={mapContainer} className="map" />
        </div>
      </main>
    </div>
  );
}
