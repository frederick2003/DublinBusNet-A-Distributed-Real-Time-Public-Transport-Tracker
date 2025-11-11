import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const lng = -6.266155;
  const lat = 53.35014;
  const zoom = 14;
  const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY_HERE;

  // 1) Initialise map ONCE
  useEffect(() => {
    if (map.current) return; // prevents re-init

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`,
      center: [lng, lat],
      zoom: zoom,
    });

    return () => {
      // Cleanup on unmount
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 2) Add controls & markers ONCE after map exists
  useEffect(() => {
    if (!map.current) return;

    // Add navigation controls
    const nav = new maplibregl.NavigationControl();
    map.current.addControl(nav, "top-right");

    // Add marker
    const marker = new maplibregl.Marker({ color: "#FF0000" })
      .setLngLat([139.7525, 35.6846])
      .addTo(map.current);
  }, []);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
}
