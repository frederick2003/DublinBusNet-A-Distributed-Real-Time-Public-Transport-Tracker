import React from "react";

export default function FavouriteRoute({ route }) {
  if (!route) return null;

  const handleAddFavourite = () => {
    console.log("Adding favourite route:", route);

    // TEMP: local-only storage
    localStorage.setItem("favouriteRoute", route);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "90px",
        right: "16px",
        zIndex: 1000,
        background: "rgba(255,255,255,0.9)",
        padding: "0.75rem 1rem",
        borderRadius: "14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        fontSize: "0.95rem",
      }}
    >
      <div style={{ marginBottom: "0.5rem" }}>
        Current route: <strong>{route}</strong>
      </div>

      <button
        onClick={handleAddFavourite}
        style={{
          border: "none",
          borderRadius: "10px",
          padding: "0.5rem 0.8rem",
          cursor: "pointer",
          background: "#007AFF",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        ⭐ Add to favourites
      </button>
    </div>
  );
}
